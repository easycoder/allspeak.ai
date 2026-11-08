#!/usr/bin/env python3
"""Can a table or listbox report a whole multi-row selection, and does a click still run its handler?

**Why this exists.** A table answers `the selected row of` with one number, and that is only ever the
cursor's row: the Studio had to keep its own set of clicked rows to offer a Select rows mode. A widget
can carry a selection *mode* and a selection *set*, and neither is visible by reading the source — the
mode is a Qt enum and the set is whatever the click and the modifiers left behind. So this drives a
small program on the offscreen Qt and asks the widgets.

It checks both members of the pair: `set selection of … to single|contiguous|multiple|none` on a table
and a listbox, and `the selection of …` read into a declared `list` (row indexes, ascending, empty when
nothing is selected). The click is a real one, sent to the viewport, because the question that matters
is whether `cellClicked` fires for the row a click just selected.

    QT_QPA_PLATFORM=offscreen python3 tools/table-selection-check.py

It needs a checkout: it imports `allspeak-py/` rather than whatever `allspeak-ai` happens to be
installed, because the feature lives in the source tree until it is released. It says so, rather than
failing on a missing path.
"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('table-selection-check: no allspeak-py/allspeak beside this script. It imports the '
                     'runtime, so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')

try:
    from PySide6.QtCore import Qt, QItemSelectionModel
    from PySide6.QtTest import QTest
    from PySide6.QtWidgets import QApplication, QAbstractItemView
except ImportError as e:
    sys.stderr.write(f'table-selection-check: PySide6 is needed to drive a widget ({e}).\n')
    sys.exit(2)

from allspeak.as_program import Program  # noqa: E402  — after the path is set

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def symbol(program, name):
    return program.code[program.symbols[name]]


def value(program, name):
    """A symbol's content. A `list` holds its list directly; a `variable` holds an ECValue."""
    held = symbol(program, name).get('object').getValue()
    if isinstance(held, list):
        return held
    return None if held is None else held.getContent()


def widget(program, name):
    return symbol(program, name)['object'].getValue()


SOURCE = """
script SelectionProbe

use graphics

table Steps
table Default
table Single
table Contiguous
table Off
listbox DeviceList
list Selection
list DeviceSelection
variable Selected
variable Clicked
variable SelectionCount
variable Second

Main:
    create Steps
    create Default
    create Single
    create Contiguous
    create Off
    create DeviceList
    set columns of Steps to `["a","b","c"]`
    set rows of Steps to `[["0","1","2"],["3","4","5"],["6","7","8"]]`
    add `one` to DeviceList
    add `two` to DeviceList
    add `three` to DeviceList
    set selection of Steps to multiple
    set selection of Single to single
    set selection of Contiguous to contiguous
    set selection of Off to none
    set selection of DeviceList to multiple
    on select Steps go to StepSelected
    on click Steps go to StepClicked
    on click DeviceList go to DeviceClicked
    stop

StepSelected:
    put the selection of Steps into Selection
    put the count of Selection into SelectionCount
    if SelectionCount is greater than 1
    begin
        put item 1 of Selection into Second
    end
    put the selected row of Steps into Selected
    return

StepClicked:
    put the clicked row of Steps into Clicked
    put the selection of Steps into Selection
    return

DeviceClicked:
    put the selection of DeviceList into DeviceSelection
    return
"""


def selected_rows(table):
    """The rows a real click or a Ctrl-click would leave selected."""
    return sorted({index.row() for index in table.selectionModel().selectedIndexes()})


app = QApplication([])
program = Program('selectionprobe.allspeak', testMode=True, source=SOURCE)
program.start()

print('the mode is a property of the widget')
steps = widget(program, 'Steps')
check(widget(program, 'Default').selectionMode() == QAbstractItemView.SelectionMode.SingleSelection,
      'a table is single-selection until told otherwise')
check(steps.selectionMode() == QAbstractItemView.SelectionMode.ExtendedSelection,
      '`multiple` is Qt\'s ExtendedSelection, so Ctrl and Shift both work')
check(widget(program, 'Single').selectionMode() == QAbstractItemView.SelectionMode.SingleSelection,
      '`single` is SingleSelection')
check(widget(program, 'Contiguous').selectionMode() == QAbstractItemView.SelectionMode.ContiguousSelection,
      '`contiguous` is ContiguousSelection')
check(widget(program, 'Off').selectionMode() == QAbstractItemView.SelectionMode.NoSelection,
      '`none` is NoSelection')

print()
print('the selection reads as a list of row indexes')
steps.selectRow(1)
check(value(program, 'Selection') == [1],
      f'a single selection is a one-item list (got {value(program, "Selection")!r})')
check(value(program, 'SelectionCount') == 1, '`the count of` reads the list')
check(value(program, 'Selected') == 1, '`the selected row of` still reads the current row')

steps.clearSelection()
model = steps.model()
selection = steps.selectionModel()
for row in (0, 2):
    selection.select(model.index(row, 0),
                     QItemSelectionModel.SelectionFlag.Select | QItemSelectionModel.SelectionFlag.Rows)
check(value(program, 'Selection') == [0, 2],
      f'a non-contiguous pair reads as [0, 2] (got {value(program, "Selection")!r})')
check(value(program, 'SelectionCount') == 2, 'and the count is 2')
check(value(program, 'Second') == 2, '`item 1 of` the list is the second selected row')

steps.clearSelection()
check(value(program, 'Selection') == [],
      f'clearing the selection leaves an empty list (got {value(program, "Selection")!r})')
check(value(program, 'SelectionCount') == 0, 'which `the count of` reports as 0')

print()
print('a click still runs its handler, with the selection readable')
steps.resize(320, 160)
steps.show()
QApplication.processEvents()
rect = steps.visualRect(model.index(1, 0))
QTest.mouseClick(steps.viewport(), Qt.MouseButton.LeftButton, Qt.KeyboardModifier.NoModifier, rect.center())
QApplication.processEvents()
check(value(program, 'Clicked') == 1,
      f'a real click on row 1 ran the click handler (got {value(program, "Clicked")!r})')
check(value(program, 'Selection') == [1],
      f'and the row the click selected is in the selection (got {value(program, "Selection")!r})')

print()
print('a listbox answers the same way')
devices = widget(program, 'DeviceList')
check(devices.selectionMode() == QAbstractItemView.SelectionMode.ExtendedSelection,
      'a listbox takes the same mode setting')
devices.clearSelection()
devices.item(0).setSelected(True)
devices.item(2).setSelected(True)
devices.itemClicked.emit(devices.item(0))
check(value(program, 'DeviceSelection') == [0, 2],
      f'and reads its selected rows as indexes (got {value(program, "DeviceSelection")!r})')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
