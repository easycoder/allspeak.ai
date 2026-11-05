"""The `process` domain: a child process whose output reaches AllSpeak handlers.

A script declares a process, starts it with a command line, and names the labels that
handle its stdout lines, its stderr lines and its exit:

    process Runner
    start Runner command `python -m scenario_runner`
    on line Runner go to RunnerLine
    on error line Runner go to RunnerError
    on exit Runner go to RunnerDone
    ...
    RunnerLine:
        append the line of Runner to Log
        return

**Nothing is polled.** Two reader threads and a waiter thread watch the pipes; each
complete line is queued as an event and an intent is posted to the program, which runs
the handler on the main thread in its own flush — the same route MQTT takes, so an
event can never run inside a handler or while the program is stepping a command. A
line that is not yet terminated is held by the reader until its newline arrives (the
text-mode iterator buffers it) and the exit event is queued only after both readers
have finished, so every line reaches its handler before the exit does.

The handler's line is read with `the line of Runner` (stdout) or
`the error line of Runner` (stderr); on exit `the exit code of Runner` and
`the signal of Runner` say how it ended. The process's stdin takes a line with
`write ... to Runner`, and `stop Runner` ends it (terminate, then kill after a grace
period).
"""

import os
import shlex
import subprocess
import sys
import threading

from .as_classes import ECValue, ECObject, RuntimeError
from .as_handler import Handler
from .as_language import language


class ECProcess(ECObject):
    """The process variable: a Popen handle, its event queue and its handlers."""

    def __init__(self):
        super().__init__()
        self.process = None
        self.current = None
        self.exitCode = 0
        self.exitSignal = 0
        self.handlers = {}
        self.stopped = False
        self.readers = []
        self.waiter = None

    # The core `stop` handler asks this of a symbol's object before it consumes the
    # keyword: a process is the one type a bare `stop Runner` ends.
    def isStoppable(self):
        return True

    def setHandler(self, event, label):
        self.handlers[event] = label

    # ---- starting ------------------------------------------------------------------

    def start(self, program, command):
        if self.process is not None and self.process.poll() is None:
            raise RuntimeError(program, f'Process "{self.name}" is already running')
        self.shutdown()
        argv = shlex.split(str(command), posix=(os.name != 'nt'))
        if not argv:
            raise RuntimeError(program, f'Process "{self.name}" has no command to run')
        try:
            self.process = subprocess.Popen(
                argv,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace',
                bufsize=1,
                start_new_session=(os.name != 'nt'),
            )
        except (OSError, ValueError) as e:
            raise RuntimeError(program, f'Cannot start process "{self.name}": {e}')
        self.current = None
        self.stopped = False
        self.exitCode = 0
        self.exitSignal = 0
        self.readers = [
            threading.Thread(target=self.readStream, args=(program, self.process.stdout, 'line'), daemon=True),
            threading.Thread(target=self.readStream, args=(program, self.process.stderr, 'error'), daemon=True),
        ]
        for reader in self.readers:
            reader.start()
        self.waiter = threading.Thread(target=self.waitForExit, args=(program,), daemon=True)
        self.waiter.start()

    # A complete line at a time. Python's text-mode iterator blocks until a newline (or
    # the end of the stream), which is what "hold a partial line until it is complete"
    # means here; the final unterminated line of a stream is delivered at EOF.
    def readStream(self, program, stream, kind):
        if stream is None:
            return
        try:
            for line in stream:
                self.post(program, kind, line.rstrip('\r\n'))
        except (OSError, ValueError):
            pass

    def waitForExit(self, program):
        try:
            code = self.process.wait() if self.process is not None else 0
        except (OSError, ValueError):
            code = 0
        # Join the readers before saying the process exited: the pipes close when the
        # child exits, and any line still in them belongs before the exit event.
        for reader in self.readers:
            reader.join()
        if code is not None and code < 0:
            self.exitSignal = -code
            self.exitCode = 0
        else:
            self.exitCode = code if code is not None else 0
        self.post(program, 'exit', self.exitCode)

    # ---- events --------------------------------------------------------------------

    def post(self, program, kind, payload):
        if self.stopped:
            return
        # The event travels with its intent. One intent per event keeps the order the
        # child wrote them in, and nothing has to be popped later: a `prepare` that
        # read from a shared queue would be called for every intent before any handler
        # ran, so they would all see the *last* event.
        program.queueIntent(None, prepare=self.prepare(program, (kind, payload)))

    def prepare(self, program, event):
        def prepare():
            if self.stopped:
                return None
            self.current = event
            label = self.handlers.get(event[0])
            if not label:
                return None
            pc = program.symbols.get(label + ':')
            if pc is None:
                sys.stderr.write(f'process {self.name}: there is no label "{label}:"\n')
                return None
            # A handler label ends with `return`; the return address it pops is the
            # end of the program, because an event handler has nothing to go back to.
            program.stack.append(0)
            return pc
        return prepare

    # ---- stdin and stopping ----------------------------------------------------------

    def writeLine(self, program, text):
        process = self.process
        if process is None or process.stdin is None or process.poll() is not None:
            raise RuntimeError(program, f'Process "{self.name}" is not running')
        try:
            process.stdin.write(str(text) + '\n')
            process.stdin.flush()
        except (OSError, ValueError) as e:
            raise RuntimeError(program, f'Cannot write to process "{self.name}": {e}')

    # `stop Runner` — ask the child to end, and leave the exit event to arrive. The
    # waiter is what reports it (with `the signal of Runner` when the child was
    # terminated), so the stop itself does not suppress events.
    def stop(self):
        process = self.process
        if process is not None and process.poll() is None:
            try:
                process.terminate()
            except OSError:
                pass

    # The run is ending: end the child and drop whatever it still had to say. This is
    # what a closed window and an `exit` do, and it is deliberately not `stop`.
    def shutdown(self):
        self.stopped = True
        process = self.process
        self.process = None
        if process is None:
            return
        if process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                try:
                    process.kill()
                    process.wait(timeout=2)
                except (OSError, subprocess.TimeoutExpired):
                    pass
            except OSError:
                pass
        self.closeStreams(process)

    def closeStreams(self, process):
        for stream in (process.stdin, process.stdout, process.stderr):
            try:
                if stream is not None:
                    stream.close()
            except (OSError, ValueError):
                pass


class Process(Handler):
    """The `process` domain: the type, `start`, `on line`/`on error line`/`on exit`,
    `write ... to`, `stop`, and the values the handlers read."""

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'process'

    def modifyValue(self, value):
        return value

    # process Runner — declare the variable
    def k_process(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECProcess')

    def r_process(self, command):
        # The object exists from the declaration; the program keeps the ones it may
        # have to stop, so closing the window cannot leave a child running.
        record = self.getVariable(command['name'])
        object = self.getObject(record)
        if isinstance(object, ECProcess) and object not in self.program.processes:
            self.program.processes.append(object)
        return self.nextPC()

    # start Runner command `...`
    def k_start(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECProcess):
                command['name'] = record['name']
                if self.nextIsWord('command'):
                    command['value'] = self.nextValue()
                    if command['value'] is not None:
                        self.add(command)
                        return True
        return False

    def r_start(self, command):
        record = self.getVariable(command['name'])
        object = self.getObject(record)
        self.checkObjectType(object, ECProcess)
        object.start(self.program, self.textify(command['value']))
        return self.nextPC()

    # on line Runner go to Label
    # on stderr [line] Runner go to Label   (`on error line` is accepted too)
    # on exit Runner go to Label
    def k_on(self, command):
        token = language.reverse_word(self.nextToken())
        kind = None
        if token == 'line':
            kind = 'line'
        elif token in ('stderr', 'error'):
            kind = 'error'
            self.skipWord('line')
        elif token == 'exit':
            kind = 'exit'
        if kind is None:
            return False
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        if not self.isObjectType(record, ECProcess):
            return False
        command['type'] = kind
        command['name'] = record['name']
        # The label is taken as a name and resolved when the event fires, so a handler
        # may sit below the registration — the order a script reads in.
        if language.reverse_word(self.peek()) not in ('go', 'gosub'):
            return False
        self.nextToken()
        self.skipWord('to')
        command['label'] = self.nextToken()
        self.add(command)
        return True

    def r_on(self, command):
        record = self.getVariable(command['name'])
        object = self.getObject(record)
        self.checkObjectType(object, ECProcess)
        object.setHandler(command['type'], command['label'])
        return self.nextPC()

    # stop Runner — reached through core's `stop`, which hands a stoppable variable
    # to its own domain before consuming the keyword.
    def k_stop(self, command):
        record = self.getSymbolRecord()
        if not self.isObjectType(record, ECProcess):
            return False
        command['name'] = record['name']
        self.add(command)
        return True

    def r_stop(self, command):
        record = self.getVariable(command['name'])
        object = self.getObject(record)
        self.checkObjectType(object, ECProcess)
        object.stop()
        return self.nextPC()

    # write `{"command":"cancel"}` to Runner
    def k_write(self, command):
        command['value'] = self.nextValue()
        if command['value'] is None:
            return False
        if self.nextIsWord('to') and self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECProcess):
                command['name'] = record['name']
                self.add(command)
                return True
        return False

    def r_write(self, command):
        record = self.getVariable(command['name'])
        object = self.getObject(record)
        self.checkObjectType(object, ECProcess)
        object.writeLine(self.program, self.textify(command['value']))
        return self.nextPC()

    # ---- values ----------------------------------------------------------------------

    # the line of Runner / the stderr line of Runner / the exit code of Runner /
    # the signal of Runner
    #
    # `the error line` would read better, and cannot be used: the core value compiler
    # reads `the error …` as the error message and returns it before this domain is
    # asked, so the process form has to start with a word core does not own.
    def compileValue(self):
        value = ECValue(domain=self.getName())
        token = self.getToken()
        if token is None:
            return None
        if language.matches_word(token, 'the'):
            self.nextToken()
            token = self.getToken()
        canon = language.reverse_word(token)
        kind = None
        if canon == 'line':
            kind = 'line'
        elif canon == 'stderr' and self.peek() and language.reverse_word(self.peek()) == 'line':
            self.nextToken()
            kind = 'errorline'
        elif canon == 'exit' and self.peek() and language.reverse_word(self.peek()) == 'code':
            self.nextToken()
            kind = 'exitcode'
        elif canon == 'signal':
            kind = 'signal'
        if kind is None:
            return None
        self.skipWord('of')
        if not self.nextIsSymbol():
            return None
        record = self.getSymbolRecord()
        if not self.isObjectType(record, ECProcess):
            return None
        value.setType(kind)
        value.target = record['name']
        return value

    def _target(self, v):
        record = self.getVariable(v.target)
        object = self.getObject(record)
        self.checkObjectType(object, ECProcess)
        return object

    def v_line(self, v):
        process = self._target(v)
        kind, text = process.current if process.current else (None, '')
        return ECValue(domain=self.getName(), type=str, content=text if kind == 'line' else '')

    def v_errorline(self, v):
        process = self._target(v)
        kind, text = process.current if process.current else (None, '')
        return ECValue(domain=self.getName(), type=str, content=text if kind == 'error' else '')

    def v_exitcode(self, v):
        process = self._target(v)
        return ECValue(domain=self.getName(), type=int, content=process.exitCode)

    def v_signal(self, v):
        process = self._target(v)
        return ECValue(domain=self.getName(), type=int, content=process.exitSignal)
