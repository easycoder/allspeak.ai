#!/usr/bin/env python3
"""Does `set the tooltip of <widget> to <text>` reach the widget, in the desktop flavour?

**Why this exists.** A tooltip is invisible to every other instrument: no script in the tree sets one
except the per-cell `set cell tooltip`, and a wrong widget or a value that never arrives would change
nothing a run could show. The value this check reads is the widget's own `toolTip()`, asked of the
widget the build created — not the compiled command, and not a drawing.

**The empty case is the one worth asserting.** A tooltip is taken away by setting an empty text, so a
path that writes the empty string must actually clear it rather than leave a tooltip that still
appears at the pointer. The same statement covers both, which is why the last write below is `` `` ``.

It needs a checkout: it imports `allspeak-py/` rather than whatever `allspeak-ai` happens to be
installed, because the feature lives in the source tree until it is released.

    QT_QPA_PLATFORM=offscreen python3 tools/tooltip-check.py
"""

import contextlib
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('tooltip-check: no allspeak-py/allspeak beside this script. It imports the '
                     'runtime, so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')

try:
    from PySide6.QtWidgets import QApplication
except ImportError as e:
    sys.stderr.write(f'tooltip-check: PySide6 is needed to drive a widget ({e}).\n')
    sys.exit(2)

from allspeak.as_program import Program  # noqa: E402  — after the path is set
from allspeak.as_language import Language  # noqa: E402

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def symbol(program, name):
    return program.code[program.symbols[name]]


def widget(program, name):
    return symbol(program, name)['object'].getValue()


SOURCE = """
script TooltipProbe

use graphics

label SaveLabel
label EmptyLabel
label VariableLabel
table Steps
variable TextValue

Main:
    create SaveLabel text `Save`
    create EmptyLabel text `Empty`
    create VariableLabel text `Variable`
    create Steps
    set the tooltip of SaveLabel to `Save the file`
    set the tooltip of Steps to `the runs this app made`
    put `Loaded from the address book` into TextValue
    set the tooltip of VariableLabel to TextValue
    set the tooltip of EmptyLabel to `temporary`
    set the tooltip of EmptyLabel to ``
    stop
"""

BAD = """
script TooltipBad

use graphics

variable Counter

Main:
    set the tooltip of Counter to `not a widget`
    stop
"""

app = QApplication([])
program = Program('tooltipprobe.allspeak', testMode=True, source=SOURCE)
program.start()

print('the text reaches the widget')
check(widget(program, 'SaveLabel').toolTip() == 'Save the file',
      f'`set the tooltip of SaveLabel to ...` sets the widget tooltip '
      f'(got {widget(program, "SaveLabel").toolTip()!r})')
check(widget(program, 'Steps').toolTip() == 'the runs this app made',
      f'and a table takes one like any other widget '
      f'(got {widget(program, "Steps").toolTip()!r})')
check(widget(program, 'VariableLabel').toolTip() == 'Loaded from the address book',
      f'and a variable holding the text works too '
      f'(got {widget(program, "VariableLabel").toolTip()!r})')
check(widget(program, 'EmptyLabel').toolTip() == '',
      f'an empty text takes the tooltip away — not a tooltip that still appears '
      f'(got {widget(program, "EmptyLabel").toolTip()!r})')

print()
print('the word is translated, and reaches the same branch')
for lang, word in (('en', 'tooltip'), ('fr', 'infobulle'), ('de', 'tooltip'), ('it', 'suggerimento')):
    pack = Language()
    pack.load_by_name(lang)
    answers = pack.reverse_word(word)
    check(answers == 'tooltip',
          f'{lang}: {word!r} reverse-maps to {answers!r}')

print()
print('a plain variable is refused rather than silently ignored')
bad = Program('tooltipbad.allspeak', testMode=True, source=BAD)
output = io.StringIO()
with contextlib.redirect_stdout(output):
    try:
        bad.start()
        refused = False
    except SystemExit:
        refused = True
check(refused,
      f'`set the tooltip of Counter ...` on a plain `variable` is refused '
      f'({output.getvalue().strip().splitlines()[-1] if output.getvalue().strip() else "no message"})')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
