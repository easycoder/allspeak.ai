#!/usr/bin/env python3
"""Does `set the shortcut of <widget> to <key>` bind a key, and does `on key ... of <window>` fire?

**Why this exists.** A keyboard binding is invisible to every other instrument: a wrong widget, a
misspelt key or a shortcut that never becomes active would change nothing a run could show. So this
drives a real offscreen window and sends real key events, then asks the widgets and the program's
variables what happened.

**The two statements do different jobs.** `set the shortcut of Step2 to F6` gives that widget a
shortcut and activates it the way a click would — `Step2`'s own `on click` handler runs even though
`Step2` does not have focus. `on key F5 of Win go to ...` registers a key for the window. The one
behaviour worth taking care over is the interaction: a focused button's Space is the button's own
click, so a window-level Space must not swallow it. That is asserted below.

    QT_QPA_PLATFORM=offscreen python3 tools/shortcut-check.py

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
    sys.stderr.write('shortcut-check: no allspeak-py/allspeak beside this script. It imports the '
                     'runtime, so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')

try:
    from PySide6.QtCore import Qt
    from PySide6.QtTest import QTest
    from PySide6.QtWidgets import QApplication
except ImportError as e:
    sys.stderr.write(f'shortcut-check: PySide6 is needed to drive a widget ({e}).\n')
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


def value(program, name):
    held = symbol(program, name)['object'].getValue()
    return None if held is None else held.getContent()


SOURCE = """
script KeyProbe

use graphics

window Win
layout Root
pushbutton StepBtn
pushbutton Step2
pushbutton Save
pushbutton Cleared
variable Clicked
variable Step2Clicked
variable SaveClicked
variable KeyFired
variable WindowSpace
variable KeyName

Main:
    create Win size 320 240
    create Root type QVBoxLayout
    create StepBtn text `Step`
    create Step2 text `Step two`
    create Save text `Save`
    create Cleared text `Cleared`
    add StepBtn to Root
    add Step2 to Root
    add Save to Root
    add Cleared to Root
    set the layout of Win to Root
    on click StepBtn go to StepClicked
    on click Step2 go to Step2Clicked
    on click Save go to SaveClicked
    set the shortcut of Step2 to F6
    put `Ctrl+S` into KeyName
    set the shortcut of Save to KeyName
    set the shortcut of Cleared to F9
    set the shortcut of Cleared to ``
    on key F5 of Win go to KeyHit
    on key Space of Win go to WindowSpaceHit
    put 0 into Clicked
    put 0 into Step2Clicked
    put 0 into SaveClicked
    put 0 into WindowSpace
    show Win
    stop

StepClicked:
    add 1 to Clicked
    return

Step2Clicked:
    add 1 to Step2Clicked
    return

SaveClicked:
    add 1 to SaveClicked
    return

KeyHit:
    put 1 into KeyFired
    return

WindowSpaceHit:
    put 1 into WindowSpace
    return
"""

BAD_KEY = """
script BadKey

use graphics

pushbutton Btn

Main:
    create Btn text `B`
    set the shortcut of Btn to Wobble
    stop
"""

BAD_TARGET = """
script BadShortcutTarget

use graphics

variable Counter

Main:
    set the shortcut of Counter to F6
    stop
"""

app = QApplication([])
program = Program('keyprobe.allspeak', testMode=True, source=SOURCE)
# `create Win` asks the program for the screen size that `init graphics` normally fills in; the
# check supplies it rather than starting a Qt event loop it cannot easily stop.
program.screenWidth = 800
program.screenHeight = 600
program.start()
app.processEvents()

win = widget(program, 'Win')
step = widget(program, 'StepBtn')
step2 = widget(program, 'Step2')
save = widget(program, 'Save')
cleared = widget(program, 'Cleared')
win.activateWindow()
app.processEvents()

print('a shortcut is created with the key the script wrote')
check(getattr(step2, '_ecShortcut', None) is not None
      and step2._ecShortcut.key().toString() == 'F6',
      f'`set the shortcut of Step2 to F6` makes an F6 shortcut '
      f'({getattr(step2, "_ecShortcut", None).key().toString() if getattr(step2, "_ecShortcut", None) else "none"})')
check(getattr(save, '_ecShortcut', None) is not None
      and save._ecShortcut.key().toString() == 'Ctrl+S',
      f'and a variable holding `Ctrl+S` works too '
      f'({save._ecShortcut.key().toString() if getattr(save, "_ecShortcut", None) else "none"})')
check(getattr(cleared, '_ecShortcut', None) is None,
      'an empty key removes the shortcut')

print()
print('the shortcut activates the widget the way a click does')
win.setFocus()
app.processEvents()
QTest.keyClick(win, Qt.Key.Key_F6)
app.processEvents()
check(value(program, 'Step2Clicked') == 1,
      f'F6 activates a button that does not have focus, through its `on click` handler '
      f'(got {value(program, "Step2Clicked")!r})')
QTest.keyClick(win, Qt.Key.Key_S, Qt.KeyboardModifier.ControlModifier)
app.processEvents()
check(value(program, 'SaveClicked') == 1,
      f'Ctrl+S does too (got {value(program, "SaveClicked")!r})')

print()
print('the window handler fires, and leaves a focused button alone')
QTest.keyClick(win, Qt.Key.Key_F5)
app.processEvents()
check(value(program, 'KeyFired') == 1,
      f'`on key F5 of Win` runs its label (got {value(program, "KeyFired")!r})')
QTest.keyClick(win, Qt.Key.Key_Space)
app.processEvents()
check(value(program, 'WindowSpace') == 1,
      f'`on key Space of Win` runs while focus is on the window (got {value(program, "WindowSpace")!r})')
step.setFocus()
app.processEvents()
QTest.keyClick(step, Qt.Key.Key_Space)
app.processEvents()
check(value(program, 'Clicked') == 1 and value(program, 'WindowSpace') == 1,
      f'a focused button keeps Space for its own activation, so the window handler does not run '
      f'(button {value(program, "Clicked")!r}, window {value(program, "WindowSpace")!r})')

print()
print('the example form on its own: `set the shortcut of StepBtn to Space`')
SPACE_SCRIPT = """
script SpaceProbe

use graphics

window Win
layout Root
pushbutton StepBtn
variable Clicked

Main:
    create Win size 300 200
    create Root type QVBoxLayout
    create StepBtn text `Step`
    add StepBtn to Root
    set the layout of Win to Root
    on click StepBtn go to StepClicked
    set the shortcut of StepBtn to Space
    put 0 into Clicked
    show Win
    stop

StepClicked:
    add 1 to Clicked
    return
"""
space = Program('spaceprobe.allspeak', testMode=True, source=SPACE_SCRIPT)
space.screenWidth = 800
space.screenHeight = 600
space.start()
app.processEvents()
spaceWin = widget(space, 'Win')
spaceBtn = widget(space, 'StepBtn')
spaceWin.activateWindow()
app.processEvents()
check(getattr(spaceBtn, '_ecShortcut', None) is not None
      and spaceBtn._ecShortcut.key().toString() == 'Space',
      'it binds Space '
      f'({getattr(spaceBtn, "_ecShortcut", None).key().toString() if getattr(spaceBtn, "_ecShortcut", None) else "none"})')
spaceWin.setFocus()
app.processEvents()
QTest.keyClick(spaceWin, Qt.Key.Key_Space)
app.processEvents()
check(value(space, 'Clicked') == 1,
      'and Space clicks the button even when the button does not have focus '
      f'(got {value(space, "Clicked")!r})')
spaceBtn.setFocus()
app.processEvents()
QTest.keyClick(spaceBtn, Qt.Key.Key_Space)
app.processEvents()
check(value(space, 'Clicked') == 2,
      'a focused button clicks once, not twice, when its own Space is bound '
      f'(got {value(space, "Clicked")!r})')

print()
print('the words are translated, and reach the same branch')
for lang, word in (('en', 'shortcut'), ('fr', 'raccourci'),
                   ('de', 'tastenkürzel'), ('it', 'scorciatoia')):
    pack = Language()
    pack.load_by_name(lang)
    answers = pack.reverse_word(word)
    check(answers == 'shortcut',
          f'{lang}: {word!r} reverse-maps to {answers!r}')
    check(pack.reverse_word({'en': 'key', 'fr': 'touche', 'de': 'taste', 'it': 'tasto'}[lang]) == 'key',
          f'{lang}: the word for `key` reaches the event branch')

print()
print('what must be refused')
badKey = Program('badkey.allspeak', testMode=True, source=BAD_KEY)
output = io.StringIO()
with contextlib.redirect_stdout(output):
    try:
        badKey.start()
        refused = False
    except SystemExit:
        refused = True
check(refused and "'Wobble' is not a key" in output.getvalue(),
      'an unknown key name is a runtime error that names the words that would have worked '
      f'({output.getvalue().strip().splitlines()[-1] if output.getvalue().strip() else "no message"})')

badTarget = Program('badtarget.allspeak', testMode=True, source=BAD_TARGET)
output = io.StringIO()
with contextlib.redirect_stdout(output):
    try:
        badTarget.start()
        refused = False
    except SystemExit:
        refused = True
check(refused,
      'and a plain `variable` has no widget to put a shortcut on '
      f'({output.getvalue().strip().splitlines()[-1] if output.getvalue().strip() else "no message"})')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
