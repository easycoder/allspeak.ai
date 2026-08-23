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
mdpanel HelpPanel
listbox DeviceList
combobox SystemCombo
panel Placeholder
dialog ConfirmDlg
messagebox MessageBox
```

Types: `window`, `layout`, `group`, `label`, `pushbutton`, `checkbox`, `lineinput`, `multiline`, `mdpanel` (read-only markdown preview), `listbox`, `combobox`, `panel`, `dialog`, `messagebox`.

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
create HelpPanel cols 40 rows 6
```

- **window**: `title`, `at X Y`, `size W H`, `layout`. Defaults: title `AllSpeak Main Window`, size 640×480, centered. The `layout` attribute attaches a layout to the window directly (the layout must exist already) — `set the layout of … to …` does the same thing at any time.
- **layout**: `type` must be one of the four Qt layout classes; anything else falls back to `QVBoxLayout`.
- **group**: optional `title`.
- **label**: `text`, `size` (approx. width in 'm' characters), `width` (fixed), `expand`, `align left|right|center|centre|justify`.
- **pushbutton**: `text`, `icon {path}` (loaded as a pixmap, scaled to height `size` or 24), `size`.
- **checkbox**: `text`.
- **lineinput**: `text`, `size` (width in characters).
- **multiline / mdpanel**: `cols`, `rows` (fixed character grid; without them the widget expands).
- **listbox / combobox / panel**: no attributes.

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

`add {value} to {listbox|combobox}` appends an item — a list value is spread into items (`add Devices to Combo` adds them all). Groups accept both a layout (`add Layout to Group` sets the group's layout — the rbrconf pattern) and widgets directly (`add Widget to Group` adds to the group's own layout, creating a plain `QVBoxLayout` on first use).

## Setting properties

The `set` command reads like English; `the` is optional sugar:

```as
set the layout of MainWindow to MainPanel
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

Targets are type-checked at runtime: `text` applies to label/pushbutton/lineinput/multiline/mdpanel (mdpanel interprets it as markdown), `state` to checkbox, `layout` to window/group/panel, `alignment` flags are `left hcenter right top vcenter bottom center` (any combination).

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
on tick go to Tick                      ! every 250 ms while the program is idle
stop                                    ! end the main flow here

SaveClick:
    ! ... the handler runs as its own thread ...
    stop
```

Only `pushbutton` takes `click`/`tap`; `combobox` and `listbox` take `select` (fired on `currentIndexChanged` / `itemClicked`). The tick handler is invoked by the flush timer whenever the program is not busy and not blocked.

Because the handler is a single command, the idiomatic pattern is a label — usually ending in `stop`. The handler runs to completion; nothing waits on it. Widget variables follow the cursor model, and the `on` registration captures the array index of the element that fires, so one registration can serve an array of widgets (see [event handlers and array index](../idioms/event-handlers-and-array-index.md)).

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
```

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
- `generic` — a 500×500 frameless modal with a title bar you can add your own layout to via `with {layout}`; result is the dialog's exec code.

Reading the result before `show` returns `None` — read it after `show` for the actual result.

## Message boxes

```as
messagebox MessageBox
variable Answer
create MessageBox on MainWindow style question title `Delete?` message `Really delete?`
show MessageBox giving Answer
```

Styles and results: `question` → `Yes`/`No`; `yesnocancel` → `Yes`/`No`/`Cancel`; `warning` → `OK` or empty string; anything else → `Cancel`.

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
- `allspeak-py/tests/graphics-demo.as` — an on-screen tour exercising one of every widget type and command form; run it with `cd allspeak-py && python3 -m allspeak.as_program tests/graphics-demo.as`.
