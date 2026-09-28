# Building a desktop window

## Problem

You want a desktop GUI — a window with fields, buttons and a live status line — driven entirely from AllSpeak, on the Python runtime.

## Pattern

The graphics domain ([reference](../reference/graphics.md)) is code-only: declare the widget variables, build the layout with `create`/`add`/`set`, register handlers with `on`, then `stop` the main flow and let the Qt event loop take over. Every handler is a single command, so the shape of a graphics app is a short setup section followed by a table of handler labels:

```as
script Settings

use graphics

window Window
layout Panel
layout Row
label Label
label StatusLabel
pushbutton SaveButton
checkbox InvertFlag
lineinput NameInput
combobox SystemCombo
listbox DeviceList
variable V
dictionary Saved

init graphics

! --- build the UI ---
create Window title `Settings` size 420 300
create Panel type QVBoxLayout
set the layout of Window to Panel

create Row type QHBoxLayout
add Row to Panel
create Label text `Name:`
add Label to Row
create NameInput size 20
add NameInput to Row
add stretch to Row

create InvertFlag text `Invert polarity`
add InvertFlag to Panel

create SystemCombo
add `alpha` to SystemCombo
add `beta` to SystemCombo
select index 0 of SystemCombo
add SystemCombo to Panel

create DeviceList
add `sensor-01` to DeviceList
add `sensor-02` to DeviceList
add DeviceList to Panel

create StatusLabel text `Ready` align right
add StatusLabel to Panel

create SaveButton text `Save`
add SaveButton to Panel

! --- wire up the events ---
on click SaveButton go to SaveClick
on select SystemCombo go to SystemChanged
on select DeviceList go to DevicePicked
on tick go to Tick
on close Window go to Closing

show Window
stop                                ! main flow ends; the event loop runs

SaveClick:
    put NameInput into V
    set the text of StatusLabel to `Saved '` cat V cat `'`
    stop

SystemChanged:
    set the text of StatusLabel to `System changed`
    stop

DevicePicked:
    set the text of StatusLabel to `Device picked`
    stop

Tick:
    ! keep the clock honest without a blocking loop
    stop

Closing:
    ! runs as the window closes — where the geometry is saved
    set entry `x` of Saved to the x of Window
    set entry `y` of Saved to the y of Window
    set entry `width` of Saved to the width of Window
    set entry `height` of Saved to the height of Window
    save Saved to `window.json`
    stop
```

Every widget you `create` must be declared first (`label Label`, `lineinput NameInput`, …), exactly as in the [reference](../reference/graphics.md).

## Reading the fields

Every widget type that holds a value can be read: `put LineInput into V`, `put CheckBox into V`, `put Label into V`, `put PushButton into V`, `put Combo into V`, `put ListBox into V` (returns `None` when nothing is selected), plus the value forms `the text of …`, `the count of …`, `the current item in ListBox`, `the current index of ListBox`, `the current of Combo`, `the width/height of Window` and `the x/y of Window` (full list in the [reference page](../reference/graphics.md)). A handy pattern for handlers that need the selected list entry is to snapshot it into a state variable:

```as
variable CurrentDevice
variable CurrentName

on select DeviceList go to DevicePicked

DevicePicked:
    put the current index of DeviceList into CurrentDevice
    put the current item in DeviceList into CurrentName
    stop
```

Two read idioms to remember: `the current item` takes `in`, `the current index` takes `of`, and a combo's selection is `put Combo into V` or `the current of Combo`.

## Putting the window back where it was

`on close` is the one hook that also catches the user's X button, and it runs before the window goes — which is what makes the `Closing:` label above a safe place to save the geometry. The next run reads that file back and hands it straight to `create … at X Y size W H`:

```as
variable X
variable Y
variable W
variable H
variable Text

if file `window.json` exists begin
    load Text from `window.json`
    put json of Text into Saved
    put entry `x` of Saved into X
    put entry `y` of Saved into Y
    put entry `width` of Saved into W
    put entry `height` of Saved into H
end
else begin
    put 40 into X
    put 40 into Y
    put 420 into W
    put 300 into H
end

create Window title `Settings` at X Y size W H
```

The first run has no file, so the `else` branch supplies the defaults — the same `420 300` the skeleton above asks for, only now the position is ours rather than Qt's centring. `x` and `y` are read frame-*excluded*, the convention `create … at` writes with, so a saved position comes back unchanged instead of walking up and to the left by the window border on every restart. [JSON](../reference/json.md) covers `load` and `json of`; the geometry reads themselves are in the [reference page](../reference/graphics.md).

## Opening a file and showing it read-only

A `file` dialog and a `readonly` multiline are the two halves of "let the user pick a file, then show it to them without letting them edit it". `create OpenDlg on Window type file` sets up the operating system's own open chooser; `show OpenDlg` blocks in it; `put OpenDlg into Path` returns the chosen path, or an empty string if the user cancelled — so `if Path is empty` is the cancel test. `create SourceView readonly` builds a multiline the user cannot type into, and `set the text of` still writes to it: the plain-text counterpart of `mdpanel`, which renders markdown. Declare the pieces with the rest, build them in the setup section, and let one button do the work:

```as
dialog OpenDlg
multiline SourceView
pushbutton OpenButton
variable Path
variable Text

! --- in the setup section ---
create OpenButton text `Open…`
add OpenButton to Panel
create SourceView readonly cols 60 rows 20
add SourceView to Panel
create OpenDlg on Window type file title `Open a file`
on click OpenButton go to OpenClick

OpenClick:
    show OpenDlg
    put OpenDlg into Path
    if Path is empty
        set the text of StatusLabel to `No file chosen`
    else
        load Text from Path
        set the text of SourceView to Text
        set the text of StatusLabel to `Opened ` cat Path
    end
    stop
```

`load Text from Path` reads the file whose path is *in a variable*, not only a literal, so the path the dialog returned goes straight in. The `file` type opens over the window named in `create … on Window` — leave `on` off and the chooser is a bare top-level window.

For the write side, `create SaveDlg on Window type save` is the same chooser in save mode: it returns the path the user typed, or `''` if they cancelled, and the script then writes the file itself (`save Text to Path`). Add `filter \`*.txt\`` to either type to narrow the listing to a pattern (or several groups: `filter \`Texts (*.txt);;All files (*)\``).

## Anti-patterns

- **Creating the window before the layout it references** — `create Window … layout Panel` attaches the layout at create time, so `Panel` must already exist. Build and populate layouts first, then create the window; `set the layout of Window to Panel` works at any later point.
- **Long loops in a handler** — the main flow runs on a 250 ms timer; a handler that loops for seconds freezes the whole UI. Keep handlers short, and use `wait` or `set blocked true` around genuinely long operations.
- **Reading a listbox with nothing selected** — `put DeviceList into V` returns `None` (no crash); use `the current index of DeviceList` if you need to distinguish "nothing selected" (-1) from a real selection.
- **Calling `exit` mid-app to close a window** — `exit` quits the whole process, and it does not raise `on close`, so anything that handler saves is skipped. To close just the window, `close Window`; the app exits when the last window closes.

## Why this works

`init graphics` starts the Qt event loop and hands the rest of the program to a timer, so the "main flow" is really a setup coroutine that runs in slices. Handlers are independent threads the event loop spawns on demand; each runs to its `stop`. The widget variables are ordinary cursor-model variables, so arrays of widgets work exactly as in the browser domain ([event handlers and array index](event-handlers-and-array-index.md)).

You can validate the whole lifecycle headless with `QT_QPA_PLATFORM=offscreen` — useful for CI smoke tests of the setup section.

## See also

- [Desktop graphics (Qt)](../reference/graphics.md) — every widget type, command form and caveat.
- [Event handlers and array index](event-handlers-and-array-index.md) — one `on` for an array of widgets.
- [Cooperative multitasking](../reference/cooperative-multitasking.md) — `wait`, `fork` and why handlers don't block each other.
