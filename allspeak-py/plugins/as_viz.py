"""as_viz.py — the Python-side half of the AllSpeak visualiser.

Same job as js/plugins/asviz.js: compile a target script WITHOUT running it, read
its IR, and hand the AllSpeak framework (viz.as) a list of records describing the
ANCHORS — labels, loop tests, and event registrations — plus whether each can be
reached. The record format is identical to the JS plugin's, so one framework
serves both runtimes.

Loaded from a script, as any plugin is:

    use plugin Viz from `allspeak-py/plugins/as_viz.py`

Host contract (the counterpart of AllSpeak_Viz.target / .sources in JS):

    as_viz.VizState.target = `path/to/script.as`

The IR this reads is the *Python* runtime's, which is not the same as the JS
runtime's — labels are real commands here rather than bare symbol entries, `lino`
is 0-based, and the two runtimes have different vocabularies. So a script is
analysed as the runtime you analyse it with sees it.
"""

from allspeak import (ECValue, ECVariable, FatalError, Handler, RuntimeError,
                      language)

import contextlib
import io
import json
import time


# How many visits a window may collect before the runtime stops collecting. The cap is
# a runaway guard, not a policy: a window with no stop stays open on purpose, so it can
# outlive the thread that opened it and pick up whatever that thread set in motion.
DEFAULT_LIMIT = 100000


class VizState:
    """What the host and the plugin share. Nothing here needs a run."""

    target = None       # default path, set by the host
    sources = {}        # optional pre-supplied text, keyed by path
    sections = {}       # the analyser's --json output, keyed by path
    trace = {}          # recordings, keyed by the script that produced them
    problems = []       # non-empty if a target could not be compiled


class Recorder:
    """What the runtime collects while a window is open, and nothing more.

    The host attaches it to a program; the markers arm and stop it. It records a visit
    to each anchor with a step count and a timestamp, and a count of every instruction by
    pc. It never changes the program's own state, so a run with a recorder behaves
    exactly like a run without one.
    """

    def __init__(self):
        self.windows = []
        self.current = None
        self.sealed = False     # a `once` window has been recorded; further starts ignored

    def anchorsOf(self, program):
        """The pcs worth timestamping: labels, loop tests, events, and the markers.

        Computed from the running program rather than from a file, so it is the same
        program the numbers come from.
        """
        if getattr(program, '_vizAnchors', None) is None:
            found = {}
            for pc, c in enumerate(program.code):
                lino = c.get('lino', 0) + 1
                if c.get('domain') is None:
                    found[pc] = (c.get('name') or '').rstrip(':') or 'label'
                elif c.get('keyword') == 'while':
                    found[pc] = f'loop@{lino}'
                elif c.get('keyword') == 'on':
                    found[pc] = f'event@{lino}'
                elif c.get('keyword') == 'viz' and c.get('request'):
                    found[pc] = f"viz-{c['request']}@{lino}"
            program._vizAnchors = found
        return program._vizAnchors

    def arm(self, program, command, pc):
        # `once` records one window and nothing more until the recording is cleared: with
        # a start and a stop inside a subroutine, every call would otherwise open and
        # close its own window, which is what `every` is for.
        if command.get('mode') == 'once' and (self.sealed or self.current is not None):
            return
        if self.current is not None:
            self.stop()                 # `every`: latest window wins
        anchors = self.anchorsOf(program)
        blockEnd = len(program.code)
        for other, c in enumerate(program.code):
            if other > pc and c.get('domain') is None:
                blockEnd = other
                break
        self.current = {
            'start_pc': pc,
            'line': command.get('lino', 0) + 1,
            'mode': command.get('mode', 'once'),
            'limit': command.get('limit', DEFAULT_LIMIT),
            'until': command.get('until'),
            'anchors': anchors,
            'block_end': blockEnd,
            'depth': len(program.stack),
            'visits': [],
            'counts': [0] * len(program.code),
            'linos': [c.get('lino', 0) + 1 for c in program.code],
            'steps': 0,
            't0': time.perf_counter_ns(),
            't1': None,
            'truncated': False
        }

    def finish(self):
        """Close a window left open when the program ended.

        The end of a window that never saw its stop is the end of the *run*, not the moment
        some tool next looks at the recorder — otherwise the report and the trace file
        disagree about how long it lasted by however long the host spent in between.
        """
        self.stop()

    def finishedWindows(self):
        """The windows worth reporting: the stopped ones, plus a window still open when the run
        ended, punched as of now. A `viz start` with no stop is not a mistake — it is the
        deliberate "watch until the end" case — but it is still a window, and a copy is taken
        so stamping it cannot surprise a reader holding the original.
        """
        windows = list(self.windows)
        if self.current is not None:
            closed = dict(self.current)
            closed['t1'] = time.perf_counter_ns()
            windows.append(closed)
        return windows

    def stop(self):
        if self.current is None:
            return
        self.current['t1'] = time.perf_counter_ns()
        if self.current.get('mode') == 'once':
            self.sealed = True
        self.windows.append(self.current)
        self.current = None

    def tick(self, program, pc):
        # Reaching a marker opens or closes a window. This is the whole of the marker's
        # runtime behaviour: the syntax lives in core, so a script with markers in it still
        # runs as an ordinary script when no recorder is attached, and the recorder only
        # has to notice the commands as they pass.
        command = program.code[pc] if pc < len(program.code) else None
        marker = None
        if command is not None and command.get('keyword') == 'viz':
            marker = command.get('request')
        if marker == 'start':
            self.arm(program, command, pc)
        window = self.current
        if window is None or pc >= len(window['counts']):
            return
        window['counts'][pc] += 1
        window['steps'] += 1
        # `until thread`: outside the block the window was opened in, and the call stack
        # back to where it was when the window opened. That covers a `return`, falling off
        # the end of the block, and a `gosub` inside it — with no thread bookkeeping.
        if (window['until'] == 'thread' and pc >= window['block_end']
                and len(program.stack) <= window['depth']):
            self.stop()
            return
        if pc not in window['anchors']:
            return
        if len(window['visits']) >= window['limit']:
            window['truncated'] = True      # keep counting, stop collecting visits
            return
        window['visits'].append((pc, window['steps'], time.perf_counter_ns()))
        if marker == 'stop':
            self.stop()


class Viz(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'viz'

    # The Python runtime asks every registered domain to take part in value and
    # condition handling, so a domain must implement these even when it has nothing
    # to say. `compileValue`/`compileCondition` are in the plugin contract;
    # `modifyValue` is not, but as_value.py calls it on every domain unguarded, so
    # omitting it breaks every value in the program.
    def modifyValue(self, value):
        return value

    def compileValue(self):
        return None

    def compileCondition(self):
        return None

    # ------------------------------------------------------------------ compile

    # model the script [in <path>] giving <variable>
    def k_model(self, command):
        if language_word(self.peek()) == 'the':
            self.nextToken()
        if language_word(self.peek()) == 'script':
            self.nextToken()
        if language_word(self.peek()) == 'in':
            self.nextToken()
            command['path'] = self.nextValue()
        # `as <source>` is for a caller holding the text itself — an editor with an unsaved
        # buffer is the case that matters — so nothing has to be written out and read back
        # just to be looked at.
        if language_word(self.peek()) == 'as':
            self.nextToken()
            command['text'] = self.nextValue()
        if language_word(self.peek()) != 'giving':
            FatalError(self.compiler,
                       "viz 'model': expected "
                       "'model the script [in <path>] [as <source>] giving <variable>'")
        self.nextToken()
        command['target'] = self.nextToken()
        self.add(command)
        return True

    # ------------------------------------------------------------------ markers

    # viz start [on <label>] [once|every]   |   viz stop [on <label>]
    #
    # A marker, not a measurement: it says *where* to watch, and the runtime does the
    # watching. Two markers bound a window; the end may be left out, in which case the
    # window closes when the thread that opened it ends — which is what makes the
    # several-stop-points case work without instrumenting each one.

    # -------------------------------------------------------------------- run

    def r_model(self, command):
        path = self.textify(command['path']) if 'path' in command else VizState.target
        if path is None:
            RuntimeError(self.program,
                         "viz: no target — the host must set as_viz.VizState.target")
            return self.nextPC()

        if 'text' in command:
            VizState.sources[path] = self.textify(command['text'])
        text = VizState.sources.get(path)
        if text is None:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    text = f.read()
            except (IOError, OSError) as e:
                RuntimeError(self.program, f'viz: cannot read {path}: {e}')
                return self.nextPC()

        records = self.model(path, text)
        self.setRecords(command['target'], records)
        return self.nextPC()

    # ----------------------------------------------------------------- the trace

    def traceRecords(self, path, covered=None, seq=20, top=10):
        """What the run collected, stated plainly: the sequence, then the hot spots.

        The line numbers come from the run's own program rather than from the file, so
        editing the script afterwards cannot relabel an old recording.
        """
        recorder = VizState.trace.get(path)
        if recorder is None:
            return []
        windows = recorder.finishedWindows()

        out = []
        for n, window in enumerate(windows):
            visits = window['visits']
            linos = window['linos']
            span_ns = (window['t1'] or time.perf_counter_ns()) - window['t0']
            out.append(
                f"trace | window={n + 1} | from=line {window['line']} | "
                f"visits={len(visits)} | anchors={len({pc for pc, _, _ in visits})} | "
                f"steps={window['steps']} | span-ms={span_ns / 1e6:.3f} | "
                + (f"limit={window['limit']} | truncated=yes" if window['truncated']
                   else 'truncated=no'))
            for i, (pc, steps, _stamp) in enumerate(visits[:seq]):
                out.append(f"seq | n={i + 1} | steps={steps} | line={linos[pc]} | "
                           f"name={window['anchors'].get(pc, '?')}")
            if len(visits) > seq:
                out.append(f"seq | ... {len(visits) - seq} more visits")

            # What the run did not reach is as useful as what it did, and the top-list
            # alone cannot say it — the capped list looks the same either way.
            seen = {pc for pc, _steps, _stamp in visits}
            # Only anchors the declared windows could have reached count: a narrow window
            # leaves most of a program untouched, and listing all of it as "not reached"
            # says nothing useful.
            cold = [(pc, name) for pc, name in window['anchors'].items()
                    if pc not in seen and (covered is None or pc in covered)]
            if cold:
                out.append(f"unvisited | n={len(cold)} | anchors in this program that "
                           "the recording did not reach")
                for pc, name in sorted(cold)[:top]:
                    out.append(f"cold-anchor | line={linos[pc]} | name={name}")

            counted = {}
            for pc, _steps, _stamp in visits:
                counted[pc] = counted.get(pc, 0) + 1
            for pc, count in sorted(counted.items(), key=lambda item: -item[1])[:top]:
                share = 100.0 * count / len(visits) if visits else 0.0
                out.append(f"hot-anchor | count={count} | share={share:.1f}% | "
                           f"line={linos[pc]} | name={window['anchors'].get(pc, '?')}")

            byLine = {}
            for pc, count in enumerate(window['counts']):
                if count:
                    byLine[linos[pc]] = byLine.get(linos[pc], 0) + count
            total = window['steps']
            for line, count in sorted(byLine.items(), key=lambda item: -item[1])[:top]:
                share = 100.0 * count / total if total else 0.0
                out.append(f"hot-line | count={count} | share={share:.1f}% | line={line}")
        return out

    # ------------------------------------------------------------------ model

    def model(self, path, text):
        """Compile the source without running it, then describe the anchors."""
        lines = text.split('\n')
        if lines and lines[-1] == '':
            lines.pop()

        target, problem = compileOnly(path, lines)
        if problem is not None:
            VizState.problems.append(problem)
        # A script that will not compile still has documentation, and the narrative is
        # useful for exactly the scripts we cannot run. So there is no early return:
        # the IR analysis simply has nothing to say and the sections carry the report.
        code = target.code if target is not None else []
        symbols = target.symbols if target is not None else {}

        # A label is a real command here: domain None, classname ':'. Its own line
        # number rides on the command, so unlike the JS side there is nothing to
        # recover from the tokeniser.
        labels = []
        for pc, c in enumerate(code):
            if c.get('domain') is None:
                name = c.get('name', '')
                labels.append({
                    'name': name[:-1] if name.endswith(':') else name,
                    'pc': pc,
                    'line': c.get('lino', 0) + 1
                })

        # Loop sites. `while` compiles to: test @pc, a 'gotoPC' @pc+1 carrying the
        # exit target, the body, and a 'gotoPC' back to the test. So a loop is the
        # half-open interval [pc+2, exit), and nesting depth is how many intervals
        # contain a pc.
        loops = []
        for pc, c in enumerate(code):
            if c.get('keyword') != 'while':
                continue
            exit_pc = None
            if pc + 1 < len(code) and code[pc + 1].get('keyword') == 'gotoPC':
                exit_pc = code[pc + 1].get('goto')
            loops.append({'pc': pc, 'line': c.get('lino', 0) + 1,
                          'start': pc + 2, 'end': exit_pc})

        # Event registrations. Python's `on` keeps its skip target on the command
        # itself and fixes it up past the handler body; the handler entry is pc+2,
        # which is what the runtime records (`onMessage(nextPC() + 1)`). Note the
        # `gotoPC` at pc+1 is left pointing at 0 and is never executed — so it must
        # not be followed, or every event would look like an edge back to the start.
        events = []
        for pc, c in enumerate(code):
            if c.get('keyword') != 'on':
                continue
            skip = c.get('goto')
            hasSkip = isinstance(skip, int) and skip > pc + 2
            events.append({'pc': pc, 'line': c.get('lino', 0) + 1,
                           'entry': pc + 2 if hasSkip else None,
                           'end': skip if hasSkip else None,
                           'name': eventName(lines, c)})

        # `viz start` and `viz stop` are landmarks the author placed deliberately, so
        # they belong in the model alongside labels and loops: the narrative should show
        # where a script is instrumented, and the window analysis below is the
        # pre-flight — it says what a window would capture and whether it can close.
        markers = []
        for pc, c in enumerate(code):
            if c.get('keyword') == 'viz' and c.get('request'):
                markers.append({'pc': pc, 'line': c.get('lino', 0) + 1,
                                'request': c['request'], 'mode': c.get('mode', 'once'),
                                'point': c.get('point'),
                                'until': c.get('until'),
                                'limit': c.get('limit', DEFAULT_LIMIT)})

        # ---- reachability ----

        # A `return` resumes wherever its `gosub` left off, so every pc after a
        # gosub is a possible return target.
        return_targets = []
        gosubTargets = set()
        forkTargets = set()
        for pc, c in enumerate(code):
            keyword = c.get('keyword')
            if keyword == 'gosub':
                return_targets.append(pc + 1)
                if isinstance(c.get('gosub'), str):
                    gosubTargets.add(c['gosub'])
            elif keyword == 'fork':
                if isinstance(c.get('fork'), str):
                    forkTargets.add(c['fork'])

        dynamic = 0
        for c in code:
            if 'gotoExpr' in c or 'gosubExpr' in c or 'forkExpr' in c:
                dynamic += 1
            elif c.get('keyword') == 'return':
                dynamic += 1
            elif c.get('keyword') in ('run', 'require', 'load'):
                dynamic += 1

        def labelAt(name):
            entry = symbols.get(name + ':')
            return entry

        def baseSuccessors(pc):
            c = code[pc]
            keyword = c.get('keyword')
            nxt = pc + 1

            if keyword in ('stop', 'exit'):
                return []
            if keyword == 'gotoPC':
                return [c.get('goto', nxt)]
            if keyword == 'goto':
                # The user-facing `go` keeps a label name in `goto`.
                at = labelAt(c.get('goto')) if isinstance(c.get('goto'), str) else None
                return [at] if at is not None else [nxt]
            if keyword in ('while', 'if'):
                # `while`: false -> pc+1 (the exit goto), true -> pc+2 (the body).
                # `if`:  false -> pc+1 (the else goto), true -> pc+2. Note there is
                # no `else` field here, unlike the JS runtime's compiled `if`.
                return [nxt, pc + 2]
            if keyword == 'gosub':
                at = labelAt(c.get('gosub')) if 'gosub' in c else None
                return [at, nxt] if at is not None else [nxt]
            if keyword == 'fork':
                at = labelAt(c.get('fork')) if 'fork' in c else None
                return [at, nxt] if at is not None else [nxt]
            if keyword == 'return':
                return list(return_targets)
            if keyword == 'on':
                skip = c.get('goto')
                return [skip] if isinstance(skip, int) and skip > pc else [nxt]
            if keyword == 'try':
                handler_pc = c.get('handlerPC')
                return [nxt, handler_pc] if isinstance(handler_pc, int) else [nxt]
            return [nxt]

        def successors(pc):
            out = baseSuccessors(pc)
            c = code[pc]
            # A failure clause — `... or <action>`, or `on failure` — is a second
            # outgoing edge: the normal path continues past it, the failure path
            # enters it. Python leaves the target in `or` and sets it to None when
            # there is none; the JS runtime calls the same field `onError`.
            for field in ('or', 'onError'):
                clause = c.get(field)
                if isinstance(clause, int) and clause > 0:
                    out.append(clause)
            return out

        reachable = set()
        named = set()
        stack = [0]
        for event in events:
            if event['entry'] is not None:
                stack.append(event['entry'])
        while stack:
            pc = stack.pop()
            if not isinstance(pc, int) or pc < 0 or pc >= len(code) or pc in reachable:
                continue
            reachable.add(pc)
            stack.extend(successors(pc))
            # A label can also be *named* rather than jumped to, in which case it is
            # an entry point with no incoming edge. Collect any string the command
            # mentions, one level into its operands, and err towards reachable.
            for name in mentionedStrings(code[pc]):
                for label in labels:
                    if label['pc'] not in reachable and label['name'] == name:
                        named.add(label['name'])
                        stack.append(label['pc'])

        def reachableAt(pc):
            return 'yes' if pc in reachable else 'no'

        def depthAt(pc):
            return sum(1 for loop in loops
                       if loop['end'] is not None and loop['start'] <= pc < loop['end'])

        # ---- what shape each label block is ----
        #
        # Descriptive, not judgemental. A block can be entered by a call and also by
        # falling in from the line above; it can leave by `return`, by a tail `go`, or
        # by falling out into the next label. All of those are deliberate idioms — the
        # shared exit is how a deep if/else in business logic gets an escape hatch —
        # so this records the shape rather than scoring it. It is also what makes an
        # `unreachable` verdict readable: `reachable=no | entry=none` is a confident
        # claim, while `reachable=no | entry=call` says the analysis missed an edge.
        eventEntries = set()
        eventTargets = set()
        for event in events:
            if event['entry'] is not None:
                eventEntries.add(event['entry'])
            if event['entry'] is None or event['end'] is None:
                continue
            # A handler's body normally jumps to its real target, so the label an
            # event reaches is the target of a `go` inside the handler body — not the
            # handler body's own first pc.
            for pc in range(event['entry'], event['end']):
                c = code[pc]
                if isinstance(c.get('goto'), str):
                    eventTargets.add(c['goto'])

        jumpTargets = set()
        for c in code:
            # The user-facing `go`/`goto` keeps a label name in `goto`; the compiler's
            # own jumps are integer targets.
            if c.get('keyword') in ('goto', 'go') and isinstance(c.get('goto'), str):
                jumpTargets.add(c['goto'])

        # Which pcs anything can enter at all, and which are entered by falling out of
        # the command above. One pass, so that `entry=none` can mean "nothing enters
        # this label" rather than just "no bucket matched".
        incoming = set()
        fromPrev = set()
        for pc in range(len(code)):
            for successor in successors(pc):
                incoming.add(successor)
                if successor == pc + 1:
                    fromPrev.add(successor)

        def unique(items):
            seen = []
            for item in items:
                if item not in seen:
                    seen.append(item)
            return seen

        pcs = []
        for label in sorted(labels, key=lambda item: item['pc']):
            if label['pc'] not in pcs:
                pcs.append(label['pc'])

        def blockEnd(pc):
            n = pcs.index(pc)
            return pcs[n + 1] if n + 1 < len(pcs) else len(code)

        # The whole event construct — registration, its skip jump and the handler
        # body — is scaffolding for the block it sits in, not part of the block's own
        # flow. In Python the skip jump is left pointing at 0 and is never executed, so
        # treating it as block flow would invent a branch out of the block back to the
        # program start.
        handlerPcs = set()
        for event in events:
            if event['end'] is not None:
                handlerPcs.update(range(event['pc'], event['end']))

        def shapeOf(label):
            end = blockEnd(label['pc'])
            entry = []
            if label['name'] in gosubTargets:
                entry.append('call')
            if label['name'] in forkTargets:
                entry.append('fork')
            if label['name'] in eventTargets or label['pc'] in eventEntries:
                entry.append('event')
            if label['name'] in jumpTargets:
                entry.append('jump')
            # `named` is the broad "the name appears as a value" test, so it also fires
            # for call and jump targets. Only report it when it is the *sole* trace of
            # the label — which is the callback case, the one that would otherwise look
            # unreachable.
            if (label['name'] in named and label['name'] not in gosubTargets
                    and label['name'] not in forkTargets and label['name'] not in jumpTargets
                    and label['name'] not in eventTargets):
                entry.append('named')
            if label['pc'] > 0 and label['pc'] in successors(label['pc'] - 1):
                entry.append('fall-in')
            # A label nothing names but something jumps to: the compiler's own loop
            # exits and `if` branches land here, so it is entered, just not by name.
            if not entry and label['pc'] in incoming:
                entry.append('branch')
            if not entry:
                entry.append('none')

            exitTokens = []
            fallsOut = False
            branchOut = False
            for pc in range(label['pc'], end):
                if pc in handlerPcs:
                    # An inline event handler body sits inside the block but is not part
                    # of the block's own flow: its trailing `stop` and any `go` it
                    # contains belong to the handler, not here.
                    continue
                keyword = code[pc].get('keyword')
                if keyword == 'return':
                    exitTokens.append('return')
                elif keyword == 'stop':
                    exitTokens.append('stop')
                elif keyword == 'exit':
                    exitTokens.append('exit')
                elif keyword in ('goto', 'go') and isinstance(code[pc].get('goto'), str):
                    exitTokens.append('jump')
                # Where the block's flow can go. `falls-out` is the shared-continuation
                # case — control runs on into the next label, whether by falling through
                # the last line or by a loop exit landing there. `branch-out` is any
                # other jump leaving the block, including over the top of it. Call and
                # return edges are excluded: they are reported as `call`/`fork` on the
                # entry side, and counting them here would read a call as a fall-through.
                callEdge = keyword in ('gosub', 'fork', 'return')
                for successor in successors(pc):
                    # A call's target is reported as `call`/`fork` on the entry side; its
                    # continuation (pc+1) is genuine flow and does count — a block that
                    # ends in a call still runs on into the next label when it returns.
                    if callEdge and successor != pc + 1:
                        continue
                    if successor == end:
                        fallsOut = True
                    elif successor < label['pc'] or successor > end:
                        branchOut = True
            if fallsOut:
                exitTokens.append('falls-out')
            if branchOut:
                exitTokens.append('branch-out')
            return {'entry': ','.join(unique(entry)),
                    'exit': ','.join(unique(exitTokens)) or 'no-exit'}

        shapes = {label['pc']: shapeOf(label) for label in labels}

        labelLine = {label['pc']: label['line'] for label in labels}

        # ---- the windows the author asked for ----
        #
        # A start opens a window, a stop closes it, and a start with no stop closes when
        # the thread that opened it ends — the case that makes several stop points work
        # without instrumenting each one. Statically the end of that thread is unknown,
        # so it is estimated as the end of the block the start sits in.

        def nextLabelAfter(pc):
            for labelPc in sorted(pcs):
                if labelPc > pc:
                    return labelPc
            return len(code)

        def pointPc(marker):
            """The pc a marker's window begins or ends at, resolving `on <label>`."""
            if marker is None:
                return None
            if marker.get('point'):
                at = symbols.get(marker['point'] + ':')
                if at is None:
                    return None
                return at
            return marker['pc']

        # Which pcs a start can reach, with distance, so that "the stop that closes
        # this window" means the nearest stop actually reachable from the start rather
        # than the next one in file order — which is a different thread often enough to
        # matter. Nothing here needs to run: it is the same graph the reachability pass
        # already uses.
        def flowOnly(startPc):
            """The pcs the window's own forward flow can reach, not following returns.

            Used to tell genuine ambiguity — two stops the window's own code could arrive
            at — from the much looser set that the return model makes reachable.
            """
            seen = set()
            stack = [startPc]
            while stack:
                pc = stack.pop()
                if not isinstance(pc, int) or pc >= len(code) or pc in seen:
                    continue
                seen.add(pc)
                if code[pc].get('keyword') == 'return':
                    continue
                stack.extend(successors(pc))
            return seen

        def windowRegion(startPc, stopPc):
            """The pcs a window covers: its own flow and the code it calls, stopping where a
            call returns and at its stop. Not the looser return-model reach, which spreads
            from every call site in the program and made a window inside one subroutine look
            as if it covered 25 of the program's 27 anchors.
            """
            seen = set()
            stack = [startPc]
            while stack:
                pc = stack.pop()
                if not isinstance(pc, int) or pc >= len(code) or pc in seen:
                    continue
                if stopPc is not None and pc == stopPc:
                    continue
                seen.add(pc)
                if code[pc].get('keyword') == 'return':
                    continue
                stack.extend(successors(pc))
            return seen

        def regionFrom(startPc, stopPc):
            """The pcs a window can cover: everything reachable from the start without
            passing through the stop. Distance is no good as a test here — a window
            opened at a label can reach code that sits before its stop in the file, and
            a call inside the window runs before the stop even when it sits after it in
            pc order. The region over-approximates where a revisited pc could be seen,
            which is the honest direction for "what would be recorded"."""
            seen = set()
            stack = [startPc]
            while stack:
                pc = stack.pop()
                if not isinstance(pc, int) or pc in seen or pc >= len(code):
                    continue
                if stopPc is not None and pc == stopPc:
                    continue
                seen.add(pc)
                stack.extend(successors(pc))
            return seen

        starts = [m for m in markers if m['request'] == 'start']
        stops = [m for m in markers if m['request'] == 'stop']
        claimed = set()        # stops used to close a window
        reached = set()        # stops any window can reach at all
        ignored = set()        # starts the runtime will ignore, with a finding to say why
        windowRecords = []
        covered = set()        # every pc the declared windows could reach
        extraFindings = []

        for start in starts:
            if id(start) in ignored:
                continue           # already reported; it does not open a window
            startPc = pointPc(start)
            if startPc is None:
                extraFindings.append(
                    f"finding | window | line={start['line']} | the start names a point "
                    "that does not exist")
                continue
            near = None  # replaced by the region, once the stop is known

            # The first reachable stop in file order closes the window; failing that,
            # the thread that opened it does — estimated statically as the end of the
            # block.
            # Which stop is predicted to close the window: only ones on the window's own
            # flow. A stop that the return model makes reachable may sit on the far side of
            # a call or in another thread, and guessing from that produced nonsense like a
            # window ending above its own start. When the only stops are out there, say so
            # and leave it to the run.
            ownFlow = flowOnly(startPc)
            elsewhere = []
            onFlow = []
            for candidate in stops:
                candidatePc = pointPc(candidate)
                if candidatePc is None or candidatePc not in regionFrom(startPc, None):
                    continue
                reached.add(id(candidate))
                if candidatePc in ownFlow:
                    onFlow.append((candidatePc, candidate))
                else:
                    elsewhere.append(candidate)
            reach = {item[0]: flowOnly(item[0]) for item in onFlow}
            first = [item for item in onFlow
                     if not any(item[0] in reach[other[0]]
                                for other in onFlow if other[0] != item[0])]
            if onFlow:
                stopPc, stop = min(onFlow, key=lambda item: item[0])
                stopPc, stop = stopPc, stop
                claimed.add(id(stop))
            else:
                stopPc, stop = None, None
            # A thread-scoped window with no stop is bounded by the thread's own span,
            # which statically is the block the start sits in — exact for a handler body
            # or a subroutine, approximate if the block is the main flow.
            if stopPc is None and start.get('until') == 'thread':
                near = windowRegion(startPc, None)
                near = {pc for pc in near if pc < nextLabelAfter(startPc)}
            else:
                near = windowRegion(startPc, stopPc)
            covered |= set(near)
            # Which anchors fall inside is a graph question, not a line range: a window
            # opened `on <label>` runs from that label until its stop, wherever the calls
            # in between lead, so its two ends can even appear in either file order.
            # Counted by point rather than by landmark: two landmarks can share a pc
            # (the JS side puts a label's pc on the command that follows it), and the
            # question here is how much of the program the window covers, not how many
            # records name it.
            inside = len({item['pc'] for group in (labels, loops, events, markers)
                          for item in group if item['pc'] in near})
            index = len(windowRecords) + 1
            fromLine = (labelLine.get(startPc, start['line']) if start.get('point')
                        else start['line'])
            # `stop=` names the nearest stop the start can reach; `open` means none is,
            # so the window records until the limit or the end of the program. Leaving it
            # open is a legitimate choice — a thread that sets a flag has ended long
            # before the work it triggered does.
            # How the window is expected to finish: an explicit stop it can reach, the
            # end of the thread that opened it, or neither — in which case it runs to the
            # limit or the end of the program.
            if stop:
                ends = ("ends=line "
                        + (f"{labelLine.get(stopPc, stop['line'])}" if stop.get('point')
                           else f"{stop['line']}"))
            else:
                ends = 'ends=thread' if start.get('until') == 'thread' else 'ends=open'
            windowRecords.append(
                f"window | index={index} | from=line {fromLine}"
                + (f" | at={start['point']}" if start.get('point') else '')
                + (f" | until=thread" if start.get('until') == 'thread' else '')
                + f" | {ends} | mode={start.get('mode', 'once')} | "
                + f"limit={start.get('limit', DEFAULT_LIMIT)} | region-anchors={inside}")

            # Two stops along the same flow are simply the first and the second, and the
            # first closes the window anyway; two that cannot reach each other depend on
            # which route is taken.
            if len(first) > 1:
                extraFindings.append(
                    f"finding | window | index={index} | {len(first)} stops can close "
                    "this window by different routes | which one does depends on which "
                    "route is taken")
            if elsewhere and not onFlow:
                extraFindings.append(
                    f"finding | window | index={index} | the only stops in reach are "
                    f"past a call or in another thread (line {elsewhere[0]['line']}) | "
                    "whether one closes this window is a runtime question")
            if reachableAt(startPc) != 'yes':
                extraFindings.append(
                    f"finding | window | index={index} | the start is unreachable, so "
                    "nothing will ever be recorded")
            # A start that a later instruction can reach while this window is open: with
            # `once` the runtime ignores it, which is worth saying out loud because the
            # author probably expected two recordings.
            for other in starts:
                if other is start or id(other) in claimed:
                    continue
                otherPc = pointPc(other)
                if otherPc is None or otherPc not in near:
                    continue
                if start.get('mode', 'once') == 'once':
                    extraFindings.append(
                        f"finding | window | index={index} | the start at line "
                        f"{other['line']} is reachable while this window is open | mode "
                        "is once, so the runtime ignores it until the recording is reset")
                    ignored.add(id(other))
            for loop in loops:
                if loop['pc'] in near:
                    extraFindings.append(
                        f"finding | window | index={index} | contains the loop at line "
                        f"{loop['line']} | revisits count as visits, so the window may "
                        "reach its limit")
                    break

        for stop in stops:
            if id(stop) in reached:
                continue
            stopPc = pointPc(stop)
            if stopPc is None:
                extraFindings.append(
                    f"finding | window | line={stop['line']} | the stop names a point "
                    "that does not exist")
            else:
                extraFindings.append(
                    f"finding | window | line={stop['line']} | no window can reach this "
                    "stop, so it closes nothing")

        # ---- records, identical in shape to the JS plugin's ----

        anchors = []
        for label in labels:
            shape = shapes[label['pc']]
            anchors.append((label['line'],
                            f"anchor | reachable={reachableAt(label['pc'])} | kind=label | "
                            f"line={label['line']} | name={label['name']} | pc={label['pc']} | "
                            f"depth={depthAt(label['pc'])} | entry={shape['entry']} | "
                            f"exit={shape['exit']}"))
        for loop in loops:
            anchors.append((loop['line'],
                            f"anchor | reachable={reachableAt(loop['pc'])} | kind=loop | "
                            f"line={loop['line']} | pc={loop['pc']} | depth={depthAt(loop['pc'])}"
                            + ('' if loop['end'] is not None else ' | open')))
        for event in events:
            anchors.append((event['line'],
                            f"anchor | reachable={reachableAt(event['pc'])} | kind=event | "
                            f"line={event['line']} | name={event['name']} | pc={event['pc']} | "
                            f"entry={event['entry'] if event['entry'] is not None else '?'}"))
        for marker in markers:
            anchors.append((marker['line'],
                            f"anchor | reachable={reachableAt(marker['pc'])} | kind=viz | "
                            f"line={marker['line']} | request={marker['request']} | "
                            f"pc={marker['pc']} | mode={marker['mode']}"
                            + (f" | at={marker['point']}" if marker.get('point') else '')))
        anchors.sort(key=lambda item: item[0])

        # ---- the narrative ----
        #
        # The analyser's section model is supplied by the host (VizState.sections), so
        # the doc-block parser stays owned by tools/asdoc-check.py and this consumes
        # its output rather than forking it. The sections are what turn a list into a
        # story: the author's own prose captions the code, and the routes between
        # sections say how the parts connect.
        sections = parseSections(VizState.sections.get(path))

        def sectionOf(line):
            for n, section in enumerate(sections):
                if section['start_line'] <= line <= section['end_line']:
                    return n
            return -1

        bySection = {}
        loose = []
        for line, text in anchors:
            n = sectionOf(line)
            if n < 0:
                loose.append(text)
            else:
                bySection.setdefault(n, []).append(text)

        # How the sections connect, said once per distinct route. A call or jump inside
        # a section is internal detail; a route that crosses sections is structure.
        pcLine = {label['pc']: label['line'] for label in labels}
        routes = set()
        for pc, c in enumerate(code):
            keyword = c.get('keyword')
            target = None
            via = None
            if keyword == 'gosub' and isinstance(c.get('gosub'), str):
                target, via = labelAt(c['gosub']), 'call'
            elif keyword in ('goto', 'go') and isinstance(c.get('goto'), str):
                target, via = labelAt(c['goto']), 'jump'
            if target is not None and target in pcLine:
                routes.add((sectionOf(c.get('lino', 0) + 1),
                            sectionOf(pcLine[target]), via))
        for label in sorted(labels, key=lambda item: item['pc']):
            if 'falls-out' not in shapes[label['pc']]['exit']:
                continue
            targetPc = blockEnd(label['pc'])
            if targetPc in pcLine:
                routes.add((sectionOf(label['line']), sectionOf(pcLine[targetPc]),
                            'falls-out'))

        out = [f'model | script={path} | lines={len(lines)} | '
               f'sections={len(sections)} | commands={len(code)} | '
               f'labels={len(labels)} | loops={len(loops)} | events={len(events)} | '
               f'anchors={len(anchors)}' + (' | incomplete=yes' if problem else '')]
        if problem is not None:
            out.append(f'problem | script={path} | {problem}')
        if dynamic > 0:
            out.append(f'note | reachability is approximate: {dynamic} computed jump(s) '
                       'or returns')

        # The census of block shapes. A label can appear in more than one entry or exit
        # bucket, so these count labels carrying that shape, not a partition of them.
        def tally(kind, token):
            return sum(1 for label in labels
                       if token in shapes[label['pc']][kind].split(','))

        out.append('shape | labels=%d | ' % len(labels)
                   + ' | '.join(
                       f'{kind}-{token}={tally(kind, token)}'
                       for kind, tokens in (
                           ('entry', ('call', 'fall-in', 'fork', 'event', 'jump',
                                      'branch', 'named', 'none')),
                           ('exit', ('return', 'falls-out', 'branch-out', 'jump',
                                     'stop', 'exit', 'no-exit')))
                       for token in tokens))

        out.extend(traceRecordsFor(self, path, covered))
        out.extend(windowRecords)

        for n, section in enumerate(sections):
            inside = bySection.get(n, [])
            out.append(f"section | index={n + 1} | lines={section['start_line']}-"
                       f"{section['end_line']} | anchors={len(inside)} | "
                       f"hash={section['hash_state']} | verify={section['verify_state']}")
            for paragraph in section.get('doc', []):
                out.append(f'prose | {paragraph}')
            out.extend(inside)
            for fromIndex, toIndex, via in sorted(routes):
                if fromIndex == n and toIndex >= 0 and toIndex != n:
                    out.append(f'route | from={n + 1} | to={toIndex + 1} | via={via}')
            # Prose that matches the code but whose verification has not been refreshed
            # since the code changed: the hash was re-run, the human sign-off was not.
            if section['hash_state'] == 'stale':
                out.append(f"finding | stale-prose | line={section['start_line']} | the "
                           "code has changed since this section's prose was hashed, so "
                           "the prose may no longer describe it")
            if section['verify_state'] == 'verified-stale':
                out.append(f"finding | stale-verify | line={section['start_line']} | "
                           "prose matches the code, but has not been re-verified since "
                           "the code last changed")

        if loose:
            # Deliberately not a `section`: with no doc blocks there are no sections,
            # and the framework counts that word.
            out.append(f'loose | anchors={len(loose)} | lines outside any doc block')
            out.extend(loose)

        out.extend(extraFindings)

        for _, text in anchors:
            if 'entry=none' in text:
                name = text.split('name=')[1].split(' ')[0] if 'name=' in text else '?'
                line = text.split('line=')[1].split(' ')[0]
                out.append(f'finding | unreachable | line={line} | name={name} | '
                           'nothing enters this label')

        return out

    # -------------------------------------------------------------- write-back

    def setRecords(self, name, records):
        """Put the records into a variable as an array, the way `split` does."""
        record = self.getVariable(name)
        obj = record.get('object')
        if obj is None:
            RuntimeError(self.program, f'viz: {name} is not a variable')
            return
        self.checkObjectType(obj, ECVariable)
        obj.setElements(len(records))
        for n, text in enumerate(records):
            obj.setIndex(n)
            obj.setValue(ECValue(type=str, content=text))
        obj.setIndex(0)


# ---------------------------------------------------------------- helpers

# ------------------------------------------------------------------ trace file

# A recording is more useful as a file than as an object held by the process that made it:
# the editor can then show a trace without running anything, a trace recorded by one
# runtime can be read by the other, and the two have a neutral container to be compared in.
# The container is the Chrome Trace Event Format — see spec/viz-trace-format.md for the
# subset used, the meaning of each args field, and why `line` and `steps` carry the join and
# the comparable axis respectively.
TRACE_VERSION = 1


def traceDocument(script, windows):
    """The whole recording as one Chrome-trace document.

    One lane per window, one interval per anchor arrival: from that arrival to the next, which
    is time spent inside the block the arrival named. The intervals tile the window without
    overlapping, so their durations sum to the window's span — the property that makes the
    height of a row mean something, and one that tools/check-trace.py checks.
    """
    events = [{
        'name': 'process_name',
        'ph': 'M',
        'pid': 1,
        'args': {'name': script}
    }]
    for index, window in enumerate(windows, start=1):
        visits = window['visits']
        last = visits[-1][2] if visits else window['t0']
        end = window['t1'] or last
        events.append({
            'name': 'thread_name', 'ph': 'M', 'pid': 1, 'tid': index,
            'args': {'name': f'window {index} (line {window["line"]})'}
        })
        events.append({
            'name': 'thread_sort_index', 'ph': 'M', 'pid': 1, 'tid': index,
            'args': {'sort_index': index}
        })
        counts = {}
        for pc, count in enumerate(window['counts']):
            if count:
                line = str(window['linos'][pc])
                counts[line] = counts.get(line, 0) + count
        # Keyed and ordered by line number: this map is read by people.
        counts = {line: counts[line] for line in sorted(counts, key=int)}
        events.append({
            'name': f'window {index}',
            'cat': 'window',
            'ph': 'X',
            'pid': 1,
            'tid': index,
            'ts': window['t0'] // 1000,
            'dur': max(0, (end - window['t0']) // 1000),
            'args': {
                'from_line': window['line'],
                'mode': window['mode'],
                'limit': window['limit'],
                'until': window['until'],
                'visits': len(visits),
                'anchors': len(window['anchors']),
                'steps': window['steps'],
                'truncated': bool(window['truncated']),
                'line_counts': counts
            }
        })
        for position, (pc, steps, stamp) in enumerate(visits):
            following = visits[position + 1][2] if position + 1 < len(visits) else end
            line = window['linos'][pc]
            name = window['anchors'].get(pc, '')
            events.append({
                'name': name or f'line {line}',
                'cat': 'anchor',
                'ph': 'X',
                'pid': 1,
                'tid': index,
                'ts': stamp // 1000,
                'dur': max(0, (following - stamp) // 1000),
                'args': {
                    'line': line,
                    'pc': pc,
                    'name': name,
                    'steps': steps,
                    'visit': position + 1
                }
            })
    return {
        'traceEvents': events,
        'displayTimeUnit': 'ms',
        'otherData': {'vizTrace': TRACE_VERSION, 'script': script}
    }


def traceRecordsFor(handler, path, covered=None):
    return handler.traceRecords(path, covered)


def parseSections(text):
    """Read the analyser's section model. Absent or unreadable means: no doc blocks.

    Sections without a `doc` key are kept — an older analyser would still give the
    block structure, just without prose to caption it.
    """
    if not text:
        return []
    try:
        data = json.loads(text)
        files = data.get('files') or []
    except (ValueError, TypeError, AttributeError):
        return []
    return list(files[0].get('sections', [])) if files else []


def language_word(token):
    """The canonical name of a token in the active language pack."""
    return language.reverse_word(token)


def eventName(lines, command):
    """Python's `on` does not record which event it is, so read the source line."""
    lino = command.get('lino', 0)
    if 0 <= lino < len(lines):
        text = lines[lino].split('!')[0].split()
        for n, word in enumerate(text):
            if language_word(word) == 'on' and n + 1 < len(text):
                return text[n + 1]
    return 'on'


def mentionedStrings(command):
    """Every plain string a command mentions, one level into its operands."""
    found = set()

    def walk(value, depth):
        if depth > 2:
            return
        if isinstance(value, str):
            found.add(value)
            return
        if isinstance(value, dict):
            for item in value.values():
                walk(item, depth + 1)
            return
        if isinstance(value, (list, tuple)):
            for item in value:
                walk(item, depth + 1)
            return
        if isinstance(value, (int, float, bool)) or value is None:
            return
        # An ECValue holds its text in attributes.
        for item in vars(value).values() if hasattr(value, '__dict__') else ():
            walk(item, depth + 1)

    walk(command, 0)
    return found


def compileOnly(path, lines):
    """Compile a file without running it. Returns (program, problem-or-None).

    Two hazards to handle. `Program.__init__` resets the module-global `queue`,
    which belongs to whatever is already running, so it is saved and restored. And
    a compile error calls sys.exit(), which would take the framework down with it —
    so SystemExit is caught and reported as a problem record instead.
    """
    from allspeak import Program
    from allspeak import as_program

    saved_queue = as_program.queue
    saved_pack = language.pack
    # The Python compiler announces a failure by printing it and calling sys.exit(),
    # so capture the output to quote the reason inline rather than pointing at a log.
    # Anything else captured is noise from the target's own `use` directives.
    captured = io.StringIO()
    try:
        with contextlib.redirect_stdout(captured):
            target = Program(path, testMode=True)
            # No domain needed for the markers: `viz` is core syntax that compiles to a
            # no-op, so the target compiles with or without this plugin loaded.
            target.tokenise(target.script)
            target.compiler.compileFromStart()
        return target, None
    except SystemExit:
        return None, f'does not compile: {compileFailure(captured.getvalue())}'
    except BaseException as e:                      # noqa: BLE001 - report, never crash
        return None, f'does not compile: {e}'
    finally:
        as_program.queue = saved_queue
        if saved_pack is not None and language.pack is not saved_pack:
            language.init(saved_pack)


def compileFailure(printed):
    """Pull the compiler's own words out of what it printed before exiting."""
    lines = [line.strip() for line in printed.splitlines() if line.strip()]
    for line in reversed(lines):
        if line.startswith('-> '):
            return line[3:]
    return lines[-1] if lines else 'no message from the compiler'
