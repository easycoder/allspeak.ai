# Desktop graphics (Qt)

The `graphics` domain gives AllSpeak a desktop GUI toolkit built on **PySide6/Qt**. It is the Python runtime's counterpart to [Browser and Webson](browser-and-webson.md) in the JS runtime — but with a different shape: there is no layout dialect like Webson; windows, layouts and widgets are all declared and assembled in AllSpeak code, and the running program is driven by a Qt event loop.

This page documents what the domain **actually implements today** (verified against `allspeak-py/allspeak/as_graphics.py`). The keyword list under `allspeak-py/doc/graphics/` contains some aspirational forms (e.g. `on Button clicked …`, `attach`, `move`) that the current code does **not** implement — check the code before relying on them.

## Enabling graphics

Graphics is a Python-runtime-only plugin, loaded like any other module:

```as
use graphics
```

`use graphics` registers the domain (widget types, `create`, `set`, `on`, …) so the rest of the script can compile. The runtime must be able to import PySide6.

`init graphics` hands control to Qt:

```as
init graphics
```

It creates the `QApplication` (reusing one already created by the debugger), records the screen size, and enters the Qt event loop. Everything after `init graphics` does **not** run immediately — a 250 ms timer flushes the program forward in slices, so long-running code between `init` and the next `stop`/`exit` keeps the UI responsive.

- `stop` ends the main flow and hands control to the event loop (handlers keep running); `exit` quits the whole process via `QApplication.quit()`.
- When the last window closes, the program is killed.
- `set blocked true` pauses the automatic tick handler (periodic work such as a clock stops); event handlers and `wait` still run, so a Resume button can clear the block. `set blocked false` resumes the tick. Use it to freeze periodic work while a long operation is in progress.

In headless CI you can still run a graphics script with `QT_QPA_PLATFORM=offscreen`.

## Widget variables

Declaring a widget type creates a typed variable (the cursor model of [variables-and-arrays](variables-and-arrays.md) applies — every widget variable is an array with one element until you size it):

```as
window MainWindow
layout MainPanel
group SettingsGroup
label StatusLabel
pushbutton SaveButton
checkbox InvertFlag
lineinput NameInput
multiline Description
multiline SourceView
mdpanel HelpPanel
listbox DeviceList
combobox SystemCombo
panel Placeholder
shape RoundCard
table Steps
logpane Log
panes Work
tabs Views
dialog ConfirmDlg
messagebox MessageBox
```

Types: `window`, `layout`, `group`, `label`, `pushbutton`, `checkbox`, `lineinput`, `multiline` (editable text; add `readonly` for a plain-text view the user can't type into), `mdpanel` (read-only markdown preview), `listbox`, `combobox`, `panel`, `shape`, `table` (a read-only grid), `logpane` (a read-only, append-only log), `panes` (a splitter), `tabs` (a page set), `dialog`, `messagebox`.

The log type is called `logpane`, not `log`, because `log` is the core print command — `log Journal` already means "print the variable Journal", and a declaration cannot share that word.

## Creating widgets

`create {variable}` instantiates the widget; per-type attributes follow:

```as
create MainWindow title `My App` at 20 20 size 800 600
create MainPanel type QHBoxLayout          ! QVBoxLayout | QHBoxLayout | QGridLayout | QStackedLayout
create SettingsGroup title `Options`
create Label text `Name:` size 12 width 200 expand align right
create SaveButton text `Save` size 12
create CheckBox text `Inverted`
create NameInput text `guest` size 40
create Description cols 40 rows 6
create SourceView readonly cols 40 rows 6
create HelpPanel cols 40 rows 6
create RoundCard type roundrect radius 16 fill `#FFFFFF` border `#ECECEC` borderwidth 1
create Steps
create Log
create Work orientation horizontal
create Views
```

- **window**: `title`, `at X Y`, `size W H`, `layout`. Defaults: title `AllSpeak Main Window`, size 640×480, centered. The `layout` attribute attaches a layout to the window directly (the layout must exist already) — `set the layout of … to …` does the same thing at any time, and `set the title of … to …` renames the window at any time.
- **layout**: `type` must be one of the four Qt layout classes; anything else falls back to `QVBoxLayout`.
- **group**: optional `title`.
- **label**: `text`, `size` (approx. width in 'm' characters), `width` (fixed), `expand`, `align left|right|center|centre|justify`.
- **pushbutton**: `text`, `icon {path}` (loaded as a pixmap, scaled to height `size` or 24), `size`.
- **checkbox**: `text`.
- **lineinput**: `text`, `size` (width in characters).
- **multiline / mdpanel**: `cols`, `rows` (fixed character grid; without them the widget expands). `multiline` is editable; `create Description readonly` builds it as a plain-text view the user cannot type into — the plain-text counterpart of the always-read-only `mdpanel`. `set the text of` still writes to a read-only field, so it is the way to show a file's contents.
- **shape**: `type rect|roundrect|ellipse|circle` (default `roundrect`), `radius` (corner radius, default 12; ignored for `rect`), `fill` (fill colour), `border` (border colour), `borderwidth` (border thickness). The border thickness is called `borderwidth` — plain `width` is the widget width elsewhere in the domain, so `create Card … width 1` would be ambiguous.
- **listbox / combobox / panel**: no attributes.
- **table**: no required attributes. `columns N` and `rows N` reserve the count before any data arrives; the usual way to fill it is `set columns of` and `set rows of` (below). Cells are never edited in the widget: the inspector edits one step at a time and writes the cell back.
- **logpane**: `cols` and `rows` fix a character-grid size, as for `multiline`; without them it fills its container. It is read-only, monospace and does not wrap.
- **panes**: `orientation horizontal|vertical` (default `horizontal`). The panes are the widgets or layouts added to it, each resizable by dragging the divider.
- **tabs**: `cols` and `rows` as for `logpane`. Pages are added with `add … as` (below).

A `window` is not a widget — it has no parent layout until you call `set the layout of`. `panel` is a plain `QWidget` you can hang a layout on.

## Building the layout

`add` places widgets into layouts and groups:

```as
add MainPanel to MainWindow            ! layouts nest
add LeftPanel to MainPanel
add Label to LeftPanel
add SaveButton to LeftPanel
add stretch to LeftPanel               ! elastic spacer
add stretch SaveButton to LeftPanel    ! give one widget all spare space
add spacer size 10 to LeftPanel        ! fixed-size spacer
add DeviceList at 0 1 in GridPanel     ! QGridLayout cells: column, row
```

`add {value} to {listbox|combobox}` appends an item — a list value is spread into items (`add Devices to Combo` adds them all). Groups accept both a layout (`add Layout to Group` sets the group's layout — the rbrconf pattern) and widgets directly (`add Widget to Group` adds to the group's own layout, creating a plain `QVBoxLayout` on first use). Shapes are containers in the same way: `add Widget to Shape` puts the widget in the shape's own layout (auto-created on first use, with contents margins matching the shape's `radius` so children sit inside the rounded area); `add Layout to Shape` sets the shape's layout instead.

`panes` and `tabs` are containers too, and take a widget or a layout — a layout handed to either is wrapped in a plain `QWidget`, which is what a pane or a page is:

```as
add LeftPanel to Work                  ! a splitter pane
add RightPanel to Work
add Steps to Views as `Steps`          ! a tab page and its label
add Log to Views title `Console`       ! `title` is the same word
```

A tab added without `as`/`title` is labelled with the variable's own name.

## Shapes

A `shape` is a declarative rounded/rectangular card — a painted widget with a fill and an optional border. It exists because the RBR-style "white rounded card" is a primary element worth naming, instead of bolting QSS `border-radius` onto a `panel`. Unlike the workaround, the corner radius, fill, border and border thickness are real attributes:

```as
shape RoundCard
shape Avatar

create RoundCard type roundrect radius 16 fill `#FFFFFF` border `#ECECEC` borderwidth 1
create Avatar type circle radius 24 fill `#FFF3E0` border `#FFB74D` borderwidth 2
create Title text `Kitchen`
add Title to RoundCard          ! container: children sit inside the rounded area
```

The four `type` variants share one widget and one paint path: `rect` (square corners), `roundrect` (corners rounded by `radius`), `ellipse`, and `circle` (always round, centred). The default `type` is `roundrect`, so `create Card radius 16 …` is a rounded card without spelling it out. `type` is create-time only — runtime geometry changes aren't supported.

The shapes are painted with `QPainter` (antialiased) rather than a stylesheet: Qt QSS has no percentage `border-radius`, so an `ellipse` or `circle` cannot be expressed as a style string. There is no text on a shape itself — put a `label` inside it.

Runtime theming via `set` (each change repaints):

```as
set the fill of RoundCard to `#FF8800`      ! heating card turns accent-orange
set the radius of RoundCard to 8
set the border of RoundCard to `#000000`
set the borderwidth of RoundCard to 2
```

Honest limitation: the paint clips the shape's own background, not its children — a child near the edge can poke past the rounded corner. The default contents margins (≈ radius) keep normal content clear of the corners; a true rounded mask is a possible future extension.

## Setting properties

The `set` command reads like English; `the` is optional sugar:

```as
set the layout of MainWindow to MainPanel
set the title of MainWindow to `Settings — edited`
set the text of SaveButton to `Apply`
set the state of InvertFlag to checked          ! or: unchecked | {value}
set the color of StatusLabel to `red`
set the background color of StatusLabel to `#ffeeee`
set the style of StatusLabel to `font-weight:bold;`
set the alignment of StatusLabel to hcenter vcenter
set the width of SaveButton to 120
set the height of SettingsGroup to 50
set the size of MainWindow to 800 600
set the spacing of MainPanel to 5
set blocked true
```

### Setting the cursor

`set the cursor of <widget> to <name>` sets the pointer's shape over a widget — the busy pointer while a long job runs, or the hand over something clickable:

```as
set the cursor of MainWindow to wait
set the cursor of SaveButton to hand
set the cursor of SaveButton to arrow        ! back to the normal pointer
```

The twelve names are the same ones the browser runtime accepts — `arrow`, `hand`, `wait`, `progress`, `text`, `move`, `crosshair`, `help`, `not-allowed`, `grab`, `grabbing`, `none` — so a script that sets a cursor runs on either flavour unchanged. A backticked name or a variable holding one works too, and a name outside the table is a runtime error rather than a silently unchanged pointer. [Browser and Webson](14-browser-and-webson.md#setting-the-cursor) has the table of what each name looks like.

A window, dialog or any widget takes it; a plain `variable` is refused.

### Setting a tooltip

`set the tooltip of <widget> to <text>` gives a widget the message that appears when the pointer rests on it, and an empty text takes it away:

```as
set the tooltip of SaveButton to `Save this file`
set the tooltip of Steps to `the runs this app made`
set the tooltip of SaveButton to ``                 ! no tooltip
```

It is the widget's own tooltip, distinct from `set cell tooltip`, which annotates one cell of a table. A window, dialog or any widget takes it; a plain `variable` is refused. The text is shown as written — it is not markup.

Tables have their own set of statements. The cursor reads them as a sentence — `set cell Steps 0 2 to …` — and the colour, tooltip and alignment are per cell:

```as
set columns of Steps to `["#","Time","Actor","Target","Action","Expectation","Result"]`
set rows of Steps to ScenarioRows                       ! an array of rows, or an array variable holding one
set cell Steps 0 2 to `Controller`
set cell colour Steps 0 2 to `#2F75B5` `#E6EFF7`        ! foreground, then optional background
set cell tooltip Steps 0 3 to `room.Office.advance`
set cell alignment Steps 0 0 to center                  ! left | center | centre | right | justify
set column widths of Steps to `[40,80,120,200,120,200,80]`
set stretch column of Steps to 5                        ! the column that takes the spare width
set row numbers of Steps to true                        ! the vertical header (hidden by default)
set selection of Steps to multiple                      ! single | contiguous | multiple | none
select row 12 of Steps                                  ! make row 12 the current, selected row
scroll to row 35 of Steps                               ! bring row 35 into view
clear Steps                                             ! removes the rows, keeps the columns
```

`set selection of` also applies to a listbox. A table and a listbox are single-selection by default; `multiple` is Qt's `ExtendedSelection`, so a plain click selects one row and Ctrl/Shift add or range-select the rest. `contiguous` allows a range but no scattered rows, and `none` stops selection entirely — a click still fires `on click`, but `the selection of` stays empty. A typo in the mode is a runtime error rather than a silently unchanged widget.

`select row N of` drives the selection from the script: it makes row N current and selected, so `the selected row of` follows it and `on select` runs just as it would after a click. `scroll to row N of` moves the table's scrollbar so that row is visible and leaves the selection where it was. Both take a value as well as a literal, which is how a table follows a live run even when the current row is off screen:

```as
put the current step into N
select row N of Steps
scroll to row N of Steps
```

Row indexes are 0-based, like `item N of`, and a row beyond the table's data is ignored rather than refused — a run can outrun the rows on screen.

`the selection of` reads the whole set as a **list of row indexes**, ascending — the same value in every mode, so a script that handles one row already handles many. It works for a listbox as well as a table, and row indexes are 0-based, like `item N of`:

```as
list Selection
put the selection of Steps into Selection
put the count of Selection into N               ! 0 when nothing is selected
put the selected row of Steps into R            ! the cursor row, even with several selected
```

A selection can be empty (a Ctrl-click that deselects the last row, or `clear`), and that is why the read is a list rather than a number. Guard an index before using it — `if the count of Selection is greater than 0` — and loop over it with `item N of`. `on click` still fires for the row under the pointer in a multiple-selection table, and by the time the handler runs that row is in the selection, so `the clicked row` and `the selection of` answer the click and the set it changed.

A row may also be an object keyed by column label — `{"Actor":"User"}` fills the named columns — which is how a scenario's step objects can be shown without first flattening them to arrays. Cells are read-only: the inspector edits one step at a time and writes the cell back.

A log pane takes `append` with an optional colour, and the usual text and clear:

```as
append the line of Runner to Log
append the text of ErrorText to Log with color `#B00020`
set the text of Log to `starting`
clear Log
```

A splitter and a page set take their own state:

```as
set sizes of Work to `[260,700]`
set current tab of Views to 1
```

Targets are type-checked at runtime: `text` applies to label/pushbutton/lineinput/multiline/mdpanel (mdpanel interprets it as markdown), `title` to window/group/dialog (it sets a window's or dialog's window title, or a group box's caption — the counterpart of `create … title`), `state` to checkbox, `layout` to window/group/panel, `selection` to table/listbox, and `alignment` flags are `left hcenter right top vcenter bottom center` (any combination).

## Visibility and state

```as
show MainWindow            ! window, widget or dialog
hide StatusLabel
close MainWindow           ! windows only
enable SaveButton
disable SaveButton
clear DeviceList           ! panel, listbox, combobox, layout — anything clearable
adjust MainWindow          ! size-to-content
center DetailWindow on MainWindow    ! centre window2 on window1
```

## Events

Handlers are registered with `on` and take **exactly one command** — typically a `go to`:

```as
on click SaveButton go to SaveClick
on tap SaveButton go to SaveClick       ! alias for click
on select SystemCombo go to SystemChanged
on select DeviceList go to DevicePicked
on select Steps go to StepSelected       ! a table row selection
on click Steps go to StepClicked         ! a table cell click
on select Views go to ViewChanged        ! a tab set's current page
on tick go to Tick                      ! every 250 ms while the program is idle
on close MainWindow go to MainClose     ! as the window closes
stop                                    ! end the main flow here

SaveClick:
    ! ... the handler runs as its own thread ...
    stop
```

`click`/`tap` fire for `pushbutton` and for a table's `cellClicked`; `select` fires on a combo's `currentIndexChanged`, a listbox's `itemClicked`, a table's row selection, and a tab set's `currentChanged`. With multiple selection on a table, `click` fires for the row under the pointer and `select` fires on every change to the set; either handler can read `the selection of`. The tick handler is invoked by the flush timer whenever the program is not busy and not blocked.

Because the handler is a single command, the idiomatic pattern is a label — usually ending in `stop`. The handler runs to completion; nothing waits on it. Widget variables follow the cursor model, and the `on` registration captures the array index of the element that fires, so one registration can serve an array of widgets (see [event handlers and array index](../idioms/event-handlers-and-array-index.md)).

`close` is for windows. Its handler runs **inside the close event**, before the window has gone — so it can still read the window's geometry, which is what makes it the place to save the window's position and size for the next run:

```as
dictionary Saved                     ! declared with the other variables
on close MainWindow go to MainClose

MainClose:
    set entry `x` of Saved to the x of MainWindow
    set entry `y` of Saved to the y of MainWindow
    set entry `width` of Saved to the width of MainWindow
    set entry `height` of Saved to the height of MainWindow
    save Saved to `window.json`
    stop
```

(That dictionary is what the next run reads back to place the window with `create MainWindow at X Y size W H`.)

It fires whichever way the window closes — the user's X button or the script's own `close {window}` — and it runs before the runtime ends the program as its last window goes, so that save always completes. `exit` does not raise it: `exit` quits the process without closing the windows one by one.

## Reading values back

Widget reads work for every widget type that holds a value (verified at runtime):

```as
put CheckBox into V          ! bool
put LineInput into V         ! text
put MultiLine into V         ! text
put Label into V             ! label text
put PushButton into V        ! button label
put Combo into V             ! selected combo text
put ListBox into V           ! selected item, or None if nothing selected
put the text of Label into V
put the text of Button into V
put the text of Combo into V
put the count of ListBox into N
put the current item in ListBox into V     ! selected item (None if none)
put the current index of ListBox into N    ! -1 if nothing selected
put the current of Combo into V            ! selected combo text
put the width of MainWindow into N
put the height of MainWindow into N
put the x of MainWindow into N
put the y of MainWindow into N
```

A table and the log pane read back through their own values:

```as
put the selected row of Steps into N          ! -1 when nothing is selected
put the selected column of Steps into N
put the selection of Steps into Selection      ! a list of selected row indexes, ascending
put the clicked row of Steps into N            ! set by the last cell click
put the clicked column of Steps into N
put the cell 0 3 of Steps into V               ! row then column
put the row count of Steps into N
put the column count of Steps into N
put the current tab of Views into N            ! -1 when there are no pages
put the text of Log into V
```

`the clicked row`/`the clicked column` name the cell under the last click, while `the selected row` follows the selection — row selection and a cell click are different questions, which is why they have different values. `the current tab` is an index, not a label.

`x`, `y`, `width` and `height` are window-only: for a widget, `set the width of` fixes a size and there is no matching read. The four use the same frame convention as `create {window} at X Y` — the window frame is excluded — so a position read here and handed back to `at` puts the window where it was, instead of walking it up and left by the border on each restart. Qt's own `x()`/`y()` include the frame, which is why the runtime reads `geometry()` instead.

Two read idioms to remember: `the current item` takes `in` (`the current item in ListBox`) while `the current index` takes `of` (`the current index of ListBox`). A combo's selection is read with `put Combo into V` or `the current of Combo`; there is no per-item `current item` for a combo.

## Dialogs

`dialog` variables are modal dialogs created with a `type`, then shown:

```as
dialog NameDlg
create NameDlg on MainWindow type lineedit title `Input` prompt `Name:` value `guest`
show NameDlg
put NameDlg into V              ! the result
```

Types and results:

- `confirm` — prompt plus OK/Cancel; result is `true`/`false`.
- `lineedit` — prompt plus a text field prefilled with `value`; result is the entered text, or the original `value` if cancelled.
- `multiline` — as `lineedit` but multi-line.
- `file` — the operating system's own **file-open chooser** (a `QFileDialog`), so the user browses the real filesystem. The result is the **full path of the chosen file**, or an **empty string** if the user cancelled — so a script tests it with `if Path is empty` and then reads the file with the usual keywords.
- `save` — the same native chooser in **save mode**: the user picks a name to write. The file is *not* created for you — the script writes it (e.g. `save Text to Path`). The result rule is the same: the chosen path, or `''` on cancel.
- `generic` — a 500×500 frameless modal with a title bar you can add your own layout to via `with {layout}`; result is the dialog's exec code.

Reading the result before `show` returns `None` — read it after `show` for the actual result.

`file` and `save` take just two attributes, both optional: `title` (defaults to `Open a file` / `Save a file`) and `filter`, a Qt filter string — a bare pattern like `*.txt`, or several groups separated by `;;` (`Texts (*.txt);;All files (*)`). The chooser opens over the window named in `on {window}`; leave `on` off for a bare top-level chooser.

The `file` and `save` types are the two dialogs not built from prompt/OK/Cancel widgets; `show` hands control to the native chooser and blocks until it closes, exactly like the other modal types:

```as
dialog OpenDlg
dialog SaveDlg
variable Path
variable Text

create OpenDlg on MainWindow type file title `Open a file` filter `*.allspeak`
create SaveDlg on MainWindow type save title `Save as`

show OpenDlg
put OpenDlg into Path
if Path is empty
    log `cancelled`
else
    log `chose ` cat Path
end

show SaveDlg
put SaveDlg into Path
if Path is not empty
    save Text to Path
end
```

## Message boxes

```as
messagebox MessageBox
variable Answer
create MessageBox on MainWindow style question title `Delete?` message `Really delete?`
show MessageBox giving Answer
```

Styles and results: `question` → `Yes`/`No`; `yesnocancel` → `Yes`/`No`/`Cancel`; `warning` → `OK` or empty string; anything else → `Cancel`.

## Virtual keyboard

An on-screen keyboard for kiosk and touch environments (no hardware keyboard needed):

```as
show keyboard NameInput on MainWindow giving V
```

`show keyboard {lineinput|multiline} [on {window}] [giving {var}]` pops a frameless, modal keyboard over the named window (positioned at the bottom, centred) and blocks until it closes. The field **stays in the window** — text appears in it live as you type. When the keyboard closes, `giving {var}` receives the field's final text.

How it behaves:

- **Enter** accepts a single-line field (the `multiline` field type is the exception — there Enter inserts a newline). The ✓ on the title bar accepts too.
- **✕ on the title bar cancels**: the field is restored to what it held when the keyboard opened, and `giving` still fires with the restored text.
- The title bar is draggable, so the keyboard can be moved out of the way.
- **Shift** toggles lowercase/uppercase; **123** switches to numbers and symbols; **#+=** switches to the extended symbol page; **ABC** returns to letters; **Back** deletes.
- Keys are text-labelled (`Shift`, `123`, `Enter`, …) — the keyboard needs no image assets.

Typical use is from a button click:

```as
KeyboardClick:
    show keyboard NameInput on MainWindow giving V
    set the text of StatusLabel to `Keyboard: ` cat V
    stop
```

## Caveats for reviving this code

Bugs and sharp edges found while verifying this page (`allspeak-py/allspeak/as_graphics.py`):

1. **Attribute tokens are English-only in practice** — the widget-type and command words resolve through the language packs, but the `create`/`set` attribute words (`title`, `size`, `text`, `width`, …) are matched as raw English inside the handlers. Write graphics scripts in English.
2. **`init graphics` blocks** — everything after it runs on the 250 ms flush timer, so a handler that runs long freezes the UI; keep handlers short and use `wait`/`set blocked`.
3. **The Python `doc/graphics/` keyword docs are partly aspirational** — cross-check any syntax there against `as_graphics.py` before using it.
4. Requires **PySide6**; the domain is Python-runtime-only (no JS equivalent).

Previously documented defects that are now fixed: `create Window … layout L` was accepted but ignored; `create Window at X Y` computed `y` from `x`; grid `add at` read the row first (now column, row per the documented grammar); pushbutton/combobox value reads returned the widget or `None`; `put ListBox into V` crashed with no selection; list values were stringified instead of spread into listbox/combobox; `the current … of Combo` raised an error; dialog results were unreadable (`put {dialog} into V` did not compile); `add {widget} to {group}` crashed (QGroupBox has no `addWidget`); `set the alignment of …` and generic dialogs with `with {layout}` read a non-existent record key.

## See also

- [Building a desktop window](../idioms/desktop-gui.md) — a worked example.
- [Browser and Webson](browser-and-webson.md) — the JS-runtime UI model.
- [Event handlers and array index](../idioms/event-handlers-and-array-index.md) — the cursor model behind widget arrays.
- [Dev-environment commands](dev-environment.md) — the Python runtime's shell integration.
- `allspeak-py/tests/graphics-demo.allspeak` — an on-screen tour exercising one of every widget type and command form; run it with `cd allspeak-py && python3 -m allspeak.as_program tests/graphics-demo`.
