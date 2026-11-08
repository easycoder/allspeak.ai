#!/usr/bin/env python3
"""Does `set the cursor of Win to wait` reach the widget's cursor, in the desktop flavour?

**Why this exists.** A cursor is invisible to every other instrument: nothing in the script sweep sets
one, and Qt, like a browser, ignores a cursor it does not know — so a branch wired to the wrong widget
or a name in the wrong table would change nothing a run could show. The value this check reads is the
widget's own cursor shape, asked of the widget the build created.

**The list is a shared contract.** `CURSORS` here and `AllSpeak_BrowserCursors` in
`js/allspeak/Browser.js` publish the same twelve names, because a script should run on either flavour
without changing a word. `tools/cursor-check.js` compares the two tables; this check drives the Python
half, so neither side is only asserted from source.

    QT_QPA_PLATFORM=offscreen python3 tools/cursor-check.py

It needs a checkout: it imports `allspeak-py/` rather than whatever `allspeak-ai` happens to be
installed, because the feature lives in the source tree until it is released.
"""

import contextlib
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('cursor-check: no allspeak-py/allspeak beside this script. It imports the '
                     'runtime, so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')

try:
    from PySide6.QtCore import Qt
    from PySide6.QtWidgets import QApplication
except ImportError as e:
    sys.stderr.write(f'cursor-check: PySide6 is needed to drive a widget ({e}).\n')
    sys.exit(2)

from allspeak.as_program import Program  # noqa: E402  — after the path is set
from allspeak.as_graphics import CURSORS  # noqa: E402

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def symbol(program, name):
    return program.code[program.symbols[name]]


def widget(program, name):
    return symbol(program, name)['object'].getValue()


def shape(program, name):
    return widget(program, name).cursor().shape()


SOURCE = """
script CursorProbe

use graphics

label WaitLabel
label HandLabel
label VariableLabel
label PageLabel
variable Shape

create WaitLabel text `wait`
create HandLabel text `hand`
create VariableLabel text `variable`
create PageLabel text `none`

set the cursor of WaitLabel to wait
set the cursor of HandLabel to hand
put `grabbing` into Shape
set the cursor of VariableLabel to Shape
set the cursor of PageLabel to none
stop
"""

BAD = """
script CursorBad

use graphics

label Status

create Status text `bad`
set the cursor of Status to wobble
stop
"""

app = QApplication([])
program = Program('cursorprobe.allspeak', testMode=True, source=SOURCE)
program.start()

print('the friendly names reach the widget')
check(shape(program, 'WaitLabel') == Qt.CursorShape.WaitCursor,
      f'`set the cursor of WaitLabel to wait` sets WaitCursor (got {shape(program, "WaitLabel")})')
check(shape(program, 'HandLabel') == Qt.CursorShape.PointingHandCursor,
      f'`hand` sets PointingHandCursor (got {shape(program, "HandLabel")})')
check(shape(program, 'VariableLabel') == Qt.CursorShape.ClosedHandCursor,
      f'and a variable holding the name works too (got {shape(program, "VariableLabel")})')
check(shape(program, 'PageLabel') == Qt.CursorShape.BlankCursor,
      f'`none` sets BlankCursor (got {shape(program, "PageLabel")})')

print()
print('the published vocabulary is the one the browser uses')
expected = {
    'arrow': Qt.CursorShape.ArrowCursor,
    'hand': Qt.CursorShape.PointingHandCursor,
    'wait': Qt.CursorShape.WaitCursor,
    'progress': Qt.CursorShape.BusyCursor,
    'text': Qt.CursorShape.IBeamCursor,
    'move': Qt.CursorShape.SizeAllCursor,
    'crosshair': Qt.CursorShape.CrossCursor,
    'help': Qt.CursorShape.WhatsThisCursor,
    'not-allowed': Qt.CursorShape.ForbiddenCursor,
    'grab': Qt.CursorShape.OpenHandCursor,
    'grabbing': Qt.CursorShape.ClosedHandCursor,
    'none': Qt.CursorShape.BlankCursor,
}
check(CURSORS == expected,
      f'twelve names, each with the cursor it means ({len(CURSORS)} in the table)')

print()
print('a name no cursor has is refused rather than silently ignored')
bad = Program('cursorbad.allspeak', testMode=True, source=BAD)
output = io.StringIO()
with contextlib.redirect_stdout(output):
    try:
        bad.start()
        refused = False
    except SystemExit:
        refused = True
check(refused and "'wobble' is not a cursor" in output.getvalue(),
      'the run stops with a message that names the words that would have worked '
      f'({output.getvalue().strip().splitlines()[-1] if output.getvalue().strip() else "no message"})')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
