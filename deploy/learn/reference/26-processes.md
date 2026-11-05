# Child processes (`process`)

The `process` domain runs a child process and delivers its output to AllSpeak handlers. It is the Python runtime's answer to the one thing a desktop app cannot do with `system`: `system` waits for the command and hands back nothing, so a long-running child — a runner, a service, a tool that prints progress — cannot be watched while the AllSpeak program carries on.

It is a Python-runtime-only domain, like `graphics` and `mqtt`. Load it with `use process`; the child is a normal process on the host, so nothing else needs installing.

## The shape

```as
use process

process Runner
variable Lines

Main:
    on line Runner go to RunnerLine
    on stderr line Runner go to RunnerError
    on exit Runner go to RunnerDone
    start Runner command `python3 linewriter.py ten`
    stop

RunnerLine:
    add 1 to Lines
    append the line of Runner to Log
    return

RunnerError:
    append the stderr line of Runner to Log with color `#B00020`
    return

RunnerDone:
    set the text of Status to `exit code ` cat the exit code of Runner
    return
```

- **`process Runner`** declares the variable. Its value is the child handle, not text; there is no `create` step.
- **`start Runner command \`…\`** starts it. The command line is split the way a shell splits it (quotes are honoured), but no shell is involved, so a pipe or a redirect is not a shell expression — run a shell with `command \`sh -c …\`` if you need one. Starting a process that is already running is an error.
- **`on line`**, **`on stderr line`** (or `on stderr Runner`, or `on error line`), and **`on exit`** name the label that handles each event. The label is resolved when the event fires, so it may be written below the registration; it ends with `return`, and the return address the runtime pushes for it is the end of the program.
- **`write \`{"command":"cancel"}\` to Runner`** writes one line to its stdin.
- **`stop Runner`** asks the child to end (a terminate, then a kill after a grace period). The **exit** event still arrives, so a handler can report what happened.
- **`the line of Runner`** and **`the stderr line of Runner`** are the line being handled; **`the exit code of Runner`** and **`the signal of Runner`** are set when it ends. A run ended by `stop Runner` reports signal 15 on Linux and exit code 0.

`the error line of Runner` would read better than `the stderr line`, and is not available: the core value compiler reads `the error …` as the program's own error message and answers before this domain is asked. The handler's registration is unaffected — `on error line Runner` is accepted as an alias for `on stderr line Runner`.

## How an event reaches a handler

The child's stdout and stderr are read by one thread each, in complete lines: a line that has not yet met its newline is held until it does, and the final unterminated line is delivered at end of stream. Each line is posted to the program as an intent — the same queue MQTT uses — and the runtime runs the handler on the Qt thread, in its own slice. So:

- **The script never polls.** It can sit in its `wait 1 tick` loop, or at `stop`, and the handler still runs.
- **Events cannot interrupt a statement.** They are drained between statements, which is what makes a handler safe to write.
- **Order is the child's order.** Each line carries its own event, and the exit event is queued only after both readers have finished, so every line reaches its handler before the exit does.
- **A slow handler queues events, it does not lose them.**

A process is stopped when the window closes, when the script runs `exit`, and when the interpreter ends; `stopProcesses` is idempotent and runs from all three.

## Worked example

`examples/process-bridge/` is the full case — a window that starts a child, shows ten JSON Lines in a log pane, receives one line on stderr, cancels a second run over stdin, and stops a third. `tools/process-check.py` drives it headless and asserts what the widgets hold afterwards; it needs a checkout, because the domain is in the source tree rather than a released package.

## Traps

- **A handler label ends with `return`, not `stop`.** The runtime pushes the end of the program as the return address; `stop` would also end the slice but leaves that address on the stack.
- **Register before starting.** An event that arrives before its handler is registered has nowhere to go and is dropped.
- **`the stderr line` and `the line` are what the current event was.** A handler is run once per event; reading a line value outside a handler is reading the last one delivered.
- **A process started with `start` is not a shell.** `start Runner command \`python3 runner.py --flag \`a b\`\`` splits as an argument list; `sh -c` is the escape hatch.
