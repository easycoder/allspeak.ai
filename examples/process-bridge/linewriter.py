#!/usr/bin/env python3
"""The child process bridge.allspeak starts, and the ten lines it prints.

`ten` prints ten JSON Lines and exits 0 — the acceptance case for the `process`
type: line buffered, UTF-8, one event per line, and an exit code the handler can
report.

`wait` prints one line, then reads stdin until it is told to cancel. That is the
second run: the app writes `{"command":"cancel"}` to the process and expects exit
code 3 back, which proves the stdin route as well as the exit event.
"""

import json
import sys


def emit(**fields):
    print(json.dumps(fields), flush=True)


def main(argv):
    mode = argv[1] if len(argv) > 1 else 'ten'
    if mode == 'ten':
        # A line on stderr before the output: the app gives stderr its own handler,
        # and the check proves that line arrives there without being counted as output.
        print(json.dumps({'event': 'warning', 'message': 'a note on stderr'}), file=sys.stderr, flush=True)
        for number in range(1, 11):
            emit(event='line', n=number)
        return 0
    emit(event='waiting')
    for raw in sys.stdin:
        try:
            command = json.loads(raw)
        except ValueError:
            command = {}
        if command.get('command') == 'cancel':
            emit(event='cancelled')
            return 3
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
