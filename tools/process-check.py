#!/usr/bin/env python3
"""Does a child process's output reach AllSpeak handlers, and does the window close itself?

**Why this exists.** The `process` domain exists for one shape of app — a Run button that starts a
child, shows its output while the AllSpeak flow is parked, and reports how it ended — and that shape
cannot be checked by compiling it. The line has to arrive on the right handler, in order, with the
event that belongs to it; the exit code has to reach the exit handler after the last line; stdin has
to reach the child; and `stop Runner` has to end it with a signal. All of that is timing and threads,
so this drives `examples/process-bridge/bridge.allspeak` on the offscreen Qt and asks the widgets
what they got.

**It needs a checkout**, because it imports `allspeak-py/` rather than whatever `allspeak-ai` happens
to be installed: the domain is in the source tree until it is released. It says so rather than
failing on a missing path.

    QT_QPA_PLATFORM=offscreen python3 tools/process-check.py

The example is also where the table and log are exercised — `set rows of`, `set cell`, a per-cell
colour and tooltip, a selected row and a clicked cell — so the report covers those too. The app's own
`check` commands are the verdict it writes for a person; the claims here are the ones a harness can
make about what actually happened.
"""

import os
import signal
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
EXAMPLE = os.path.join(ROOT, 'examples', 'process-bridge')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('process-check: no allspeak-py/allspeak beside this script. It imports the runtime, '
                     'so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')  # the window opens without a screen

try:
    from PySide6.QtCore import Qt, QTimer
    from PySide6.QtWidgets import QApplication
except ImportError as e:
    sys.stderr.write(f'process-check: PySide6 is needed to run the example ({e}).\n')
    sys.exit(2)

from allspeak.as_program import Program  # noqa: E402  — after the path is set

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def note(text):
    print('  ..    ' + text)


def symbol(program, name):
    """The variable record, read without the runtime's requirement that the program be running."""
    return program.code[program.symbols[name]]


def value(program, name):
    record = symbol(program, name)
    holder = record.get('object')
    if holder is None:
        return None
    held = holder.getValue()
    return None if held is None else held.getContent()


def widget(program, name):
    return symbol(program, name)['object'].getValue()


# ---- the premise: there is an example to run, and a child to run it with ---------------------------
print('the example this check drives')
script = os.path.join(EXAMPLE, 'bridge.allspeak')
check(os.path.isfile(script), f'{script} exists')
check(os.path.isfile(os.path.join(EXAMPLE, 'linewriter.py')), 'the child it starts exists beside it')
if not os.path.isfile(script):
    print()
    print('1 claim failed')
    sys.exit(1)

# The app's command is `python3 linewriter.py ten`, so it is run from the example's directory.
os.chdir(EXAMPLE)

app = QApplication([])
timedOut = []


def guard():
    # The app closes its own window when its checks pass; if it has not done so in time, this
    # ends the Qt loop so the check can report rather than hang.
    timedOut.append(True)
    QApplication.quit()


QTimer.singleShot(45000, guard)

program = Program('bridge.allspeak', testMode=False)
program.start()

# ---- the run ended by itself ---------------------------------------------------------------------
print()
print('the run itself')
check(not timedOut, 'the app closed its own window (the Qt loop ended without the guard firing)')
check(not widget(program, 'Win').isVisible(), 'and the window is not visible afterwards')
runner = symbol(program, 'Runner')['object']
check(runner.process is None or runner.process.poll() is not None,
      'no child process is left running when the run ends')

# ---- every stdout line arrived, in order ----------------------------------------------------------
print()
print('stdout, one handler call per line')
log = widget(program, 'Log').toPlainText()
lines = [line for line in log.splitlines() if '"event": "line"' in line]
check(len(lines) == 10, f'ten lines reached the log (got {len(lines)})')
check(all(f'"n": {n}' in (lines[n - 1] if n <= len(lines) else '') for n in range(1, 11)),
      'and they arrived in the order the child wrote them')
check(value(program, 'Lines') == 10, 'the handler counted ten stdout lines')
check(value(program, 'FirstCode') == 0, 'the first run reported exit code 0')

# ---- stderr is its own event, and is not counted as output -----------------------------------------
print()
print('stderr, delivered separately')
warningLines = [line for line in log.splitlines() if 'a note on stderr' in line]
check(len(warningLines) == 1, f'the stderr line reached the log once (got {len(warningLines)})')
check(value(program, 'Warnings') == 1, 'and it reached the stderr handler once')
check('"event": "warning"' in log, 'the stderr line is the one the child wrote')
block = None
document = widget(program, 'Log').document()
for number in range(document.blockCount()):
    candidate = document.findBlockByNumber(number)
    if 'a note on stderr' in candidate.text():
        block = candidate
        break
# The colour is a character format on the text the cursor inserted, which is the
# fragment — a block's own char format is the paragraph's, and stays black.
colour = None
if block is not None:
    iterator = block.begin()
    while not iterator.atEnd():
        fragment = iterator.fragment()
        if fragment.isValid() and 'a note on stderr' in fragment.text():
            colour = fragment.charFormat().foreground().color().name().lower()
            break
        iterator += 1
check(colour == '#b00020', f'and it is red, which is what `with color` asked for (got {colour})')

# ---- stdin and the exit code ----------------------------------------------------------------------
print()
print('the cancelled run')
check('"event": "waiting"' in log, 'the second run printed its waiting line')
check('"event": "cancelled"' in log, 'and the cancel line written to its stdin was answered')
check(value(program, 'SecondCode') == 3, 'its exit code 3 reached the exit handler')

# ---- stop Runner ----------------------------------------------------------------------------------
print()
print('the stopped run')
check(value(program, 'ThirdSignal') == 15, 'SIGTERM reached the handler as signal 15')

# ---- the table ------------------------------------------------------------------------------------
print()
print('the table')
table = widget(program, 'Steps')
check(table.rowCount() == 4, f'four summary rows (got {table.rowCount()})')
check([table.horizontalHeaderItem(i).text() for i in range(table.columnCount())] == ['#', 'Run', 'Result'],
      'the column labels are the array it was given')
check(table.item(0, 2).text() == 'exit code 0', 'a cell written by a handler holds its text')
check(table.item(1, 2).text() == 'exit code 3', 'and the next run its own')
check(table.item(2, 2).text() == 'signal 15', 'and a terminated run names its signal')
check(table.item(3, 2).text() == 'all checks passed', 'the verdict row was written')
check(table.item(3, 1).toolTip() == 'the verdict row', 'a cell carries the tooltip `set cell tooltip` gave it')
check(int(table.item(3, 0).textAlignment()) & int(Qt.AlignmentFlag.AlignHCenter),
      'a cell carries the alignment `set cell alignment` gave it')
check(table.item(0, 2).background().color().name().lower() == '#e4f2e8',
      'a cell carries the background `set cell colour` gave it')
check(table.item(0, 2).foreground().color().name().lower() == '#1e6b2f',
      'and the foreground from the same statement')
# ---- selection and clicking, through the handlers a program registers ------------------------------
# Asked of a program that is still alive: a Qt signal after the app's window has closed must not
# resurrect it (that is what `kill` is for), so the handlers are exercised here rather than on the
# example's widgets after its run.
print()
print('the table\'s handlers')
tableSource = """
script TableProbe

use graphics

table Steps
label Status
variable Selected
variable Clicked

Main:
    create Steps
    create Status text ``
    set columns of Steps to `["a","b","c"]`
    set rows of Steps to `[["0","1","2"],["3","4","5"]]`
    on select Steps go to StepSelected
    on click Steps go to StepClicked
    stop

StepSelected:
    put the selected row of Steps into Selected
    set the text of Status to `selected row ` cat the selected row of Steps
    return

StepClicked:
    put the clicked row of Steps into Clicked
    set the text of Status to `clicked row ` cat the clicked row of Steps cat ` column ` cat the clicked column of Steps
    return
"""
tableProbe = Program('tableprobe.allspeak', testMode=True, source=tableSource)
tableProbe.start()
tableWidget = widget(tableProbe, 'Steps')
tableWidget.selectRow(1)
check(widget(tableProbe, 'Status').text() == 'selected row 1',
      'selecting a row runs the handler that reads `the selected row of`')
check(value(tableProbe, 'Selected') == 1, 'and the value it read is the row that was selected')
tableWidget.cellClicked.emit(0, 2)
check(widget(tableProbe, 'Status').text() == 'clicked row 0 column 2',
      'a cell click runs the handler that reads `the clicked row of` and `the clicked column of`')
check(value(tableProbe, 'Clicked') == 0, 'and the clicked row is the cell under the click')

# ---- the log pane's own surface --------------------------------------------------------------------
# The example app appends from a handler; `clear`, `set the text of` and reading the text back are
# the rest of the type, and a small second program asks for them directly.
print()
print('the log pane on its own')
probeSource = """
script LogProbe

use graphics

logpane Notes
variable Text

Main:
    create Notes
    set the text of Notes to `first`
    append `second` to Notes
    append `third` to Notes with color `#B00020`
    put the text of Notes into Text
    clear Notes
    stop
"""
probe = Program('logprobe.allspeak', testMode=True, source=probeSource)
probe.start()
notes = widget(probe, 'Notes')
check(notes.isReadOnly(), 'a log pane is read-only')
check(value(probe, 'Text') == 'first\nsecond\nthird',
      f'`the text of` reads the lines back (got {value(probe, "Text")!r})')
check(notes.toPlainText() == '', '`clear` empties it')
check(notes.lineWrapMode() == notes.lineWrapMode().NoWrap, 'and it does not wrap a long line')

# ---- panes and tabs ---------------------------------------------------------------------------------
# The studio's window is a splitter with a table, a log and an inspector in it, and a tab set for the
# views that share a pane. Both are containers, so the check is about what ends up inside them.
print()
print('panes and tabs')
containerSource = """
script PanesProbe

use graphics

panes Work
tabs Views
tabs Gone
layout Left
layout Right
label A
label B
label C
label D
label E
variable TabIndex
variable ChangedTo
variable TabAfter

Main:
    create Work orientation horizontal
    create Views
    create Gone
    create Left type QVBoxLayout
    create Right type QVBoxLayout
    create A text `one`
    create B text `two`
    create C text `first page`
    create D text `second page`
    create E text `only page`
    add A to Left
    add B to Right
    add Left to Work
    add Right to Work
    add C to Views as `First`
    add D to Views as `Second`
    add E to Gone as `Solo`
    set sizes of Work to `[120,240]`
    set current tab of Views to 1
    put the current tab of Views into TabIndex
    on select Views go to TabChanged
    set current tab of Views to 0
    put ChangedTo into TabAfter
    clear Gone
    stop

TabChanged:
    put the current tab of Views into ChangedTo
    return
"""
containers = Program('panesprobe.allspeak', testMode=True, source=containerSource)
containers.start()
panes = widget(containers, 'Work')
tabs = widget(containers, 'Views')
gone = widget(containers, 'Gone')
check(panes.count() == 2, f'two layouts were added to the splitter as panes (got {panes.count()})')
sizes = panes.sizes()
check(len(sizes) == 2 and abs(sizes[0] * 2 - sizes[1]) <= 1,
      f'`set sizes of` set the 1:2 proportion ({sizes})')
check(value(containers, 'TabIndex') == 1, '`the current tab of` reads the page that was selected')
check(value(containers, 'TabAfter') == 0,
      'changing the tab runs the `on select` handler, which reads the same value')
check([tabs.tabText(0), tabs.tabText(1)] == ['First', 'Second'],
      'the page labels are the ones `as` gave them')
check(gone.count() == 0, '`clear` removes every page')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
