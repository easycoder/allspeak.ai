# 2026-09-28

## 10:54

Add a native file browser (Python)

**Assistant**

Implemented `dialog` type `file` (the OS's own file-open chooser, `QFileDialog`) and a `readonly` option on `multiline` (a plain-text, non-editable field) in the Python graphics runtime. Surface form:

[code omitted]

- `create {dialog} on {window} type file title ...` — chooser opens over the window; result is the chosen path, or `''` on cancel, so `if Path is empty` is the cancel test; the path feeds straight into `load`/`save`.
- `create {multiline} readonly` — field built non-editable; `set the text of` still writes to it. Plain-text counterpart of `mdpanel`.

Both are English-only attribute words, like the rest of the graphics grammar, so no language-pack changes.

Changed `allspeak-py/allspeak/as_graphics.py`; updated `learn/reference/20-graphics.md`, `learn/idioms/14-desktop-gui.md` (new section), `allspeak-py/doc/graphics/keywords/{dialog,multiline}.md`; mirrored to `deploy/learn/`; rewrote `DIFF.md`; updated the `TODO.md` handover.

Verified headless (`QT_QPA_PLATFORM=offscreen`): chooser opens over the window with the title passed through; returns the path, cancel gives `''`; `readonly` multiline is `isReadOnly()` True, plain multiline False, text still settable; all dialog types and both multiline forms compile; conformance unchanged (15 files / 5 tests / 3 failed, pre-existing); learn-link-check 0 errors.

Left out (offered): a save dialog and a filename filter. Flagged one pre-existing offscreen oddity (a graphics script that ends trips `ensureRunning` at its last line) that reproduces without either new feature.

## 10:54

A file-open dialog. Nothing in the graphics keyword set opens a file — I checked doc/graphics/ and as_graphics.py: add, attach, center, checkbox, clear, close, combobox, create, dialog, disable, enable, group, hide, label, layout, lineinput, listbox, messagebox, move, multiline, on, pushbutton, remove, select, set, window. You're taking that to the AllSpeak project; tell me the surface form it lands with and I'll wire it in.
A read-only plain-text view. mdpanel's text setter is setMarkdown, and multiline's is setPlainText but the widget is editable — so there's no way today to show a non-markdown file as plain text the user can't type into. Worth settling in the same pass as the dialog (a readonly option on multiline, or a plainpanel).

**Assistant**

Both settled and implemented. Surface form — a new `dialog` type `file` (`create OpenDlg on MainWindow type file title ...`, result = chosen path or `''`) and a `readonly` option on `multiline` (`create SourceView readonly cols 60 rows 20`). You picked those two shapes; note the real grammar is `create Viewer readonly`, no `type` word — a multiline is declared as `multiline Viewer` and created with per-type options after the name, so there is no `type multiline` form. Both are Python-graphics-only and English-only surface words. Documented in `learn/reference/20-graphics.md` and `learn/idioms/14-desktop-gui.md`; verified headless as above.

## 11:06

Best to add the save dislog and filename filter while they're fresh. Then can you investigate the oddity.

**Assistant**

Save dialog + filename filter added; oddity investigated and explained (it was the test harness, not the runtime).

Surface form:
- `create D on W type save title ... filter ...` — `save` is a new dialog type (same native chooser, save mode); result = chosen path or `''`, and the file is not created for you.
- `filter` — an optional attribute on `file` and `save`, a Qt filter string (`*.txt` or `Texts (*.txt);;All files (*)`), passed through.
- Default titles: `Open a file` (file) / `Save a file` (save).

Verified headless: open/save/filter calls go to `QFileDialog.getOpenFileName`/`getSaveFileName` with the right parent, title and filter; `type save` with no title defaults to `Save a file`; `save Text to Path` (variable path) round-trips. Docs updated (`learn/reference/20-graphics.md`, `learn/idioms/14-desktop-gui.md`, `doc/graphics/keywords/dialog.md`), `deploy-sync` mirrors, `DIFF.md`/`TODO.md` updated; conformance 15/5/3 and link-check 0 errors unchanged.

Oddity: not a graphics bug. `program.getVariable()` (also `getSymbolValue`, `textify`, `evaluate`) calls `ensureRunning()`, which raises `FatalError('Improper use of runtime function')` whenever `running` is False. My earlier harness read `program.getVariable('Viewer')` *after* `start()` had returned — hence the error. `FatalError` prints "Compile error ... at line N (script)" using `compiler.index`, which after compile sits at the token stream's end, so N is the script's last line (hence "at line 9 (stop)"); it then calls `sys.exit()` (which killed the harness). Plain runs (no post-run `getVariable`) never show it: 0/8. It is pre-existing and already documented in `as_mqtt.py` (resolves topics on the main thread because `getVariable` fails when the main flow is idle). Asked whether to make `ensureRunning` report a proper runtime error (correct line, "Runtime Error" wording, honours `onError`) instead of a compile-phase one.

## 11:14

[Decision] ensureRunning → Fix the error type/message (recommended).

**Assistant**

Applied. `ensureRunning()` now raises `RuntimeError` instead of a compile-time `FatalError` (matching its sibling `ensureNotRunning`). A second gap surfaced immediately: `RuntimeError.__init__` indexes `program.code[program.pc]`, and an idle program has `pc == None`, so the first attempt died with `TypeError: list indices must be integers or slices, not NoneType`. `RuntimeError` now falls back to a line-less message when there is no current statement (pc None or out of range).

Verified: idle misuse prints `Runtime Error in EndStop:` / `-> Improper use of runtime function` (honest label, no bogus line, no crash); an in-run error still names its line (`Runtime Error in RT at line 3 (add 1 to N)`); conformance unchanged (15 files / 5 tests / 3 failed — CheckBlocks/CheckClauses/CheckClauses2 exercise the onError routing); the file/readonly and save/filter harnesses still pass; `FatalError` is still imported and used elsewhere. DIFF.md and TODO.md updated.

## 11:41

Another request, for the following:
set the title of MainWindow to Text — the direct counterpart of create {window} title ….

**Assistant**

Added `set the title of {window}/{group}/{dialog} to {value}` in the Python graphics runtime — the counterpart of `create … title`.

- `k_set` gains a `title` branch (targets `ECWindow`/`ECGroup`/`ECDialog`); `r_set` gains a `title` branch that calls `setTitle` for a group box and `setWindowTitle` for a window or dialog. The value may be a literal or a variable.
- Scope note: `create … title` applies to window, group and dialog, so all three are covered — window is what was asked for, and group/dialog close the gap (a title you can set at create should be settable later).
- Documented in `learn/reference/20-graphics.md` (the `set` example list, the "Targets are type-checked" line, and the window-attribute note), `allspeak-py/doc/graphics/keywords/set.md` (examples + supported attributes); mirrored to `deploy/learn/`; `DIFF.md`/`TODO.md` updated.

Verified headless (`QT_QPA_PLATFORM=offscreen`) with a harness that reads the Qt widgets after the run: `set the title of MainWindow to \`Renamed\`` → window title `Renamed`; `set the title of Box to V` (via a variable) → group caption `Group Renamed`; `set the title of Dlg to \`Dlg Renamed\`` → dialog title `Dlg Renamed`. All PASS; conformance unchanged (15 files / 5 tests / 3 failed); learn-link-check 0 errors.

Note: the previous turn's work (native file dialogs, readonly multiline, ensureRunning fix) is committed as 2609281118, so this turn's diff is only the `set the title of` change.

## 12:04

allspeak --version is broken in the runtime as it stands: it prints the version and then dies with AttributeError: 'Program' object has no attribute 'debugging', exit 1.

**Assistant**

Fixed. `Program.__init__` returned early for a version request (`if arg in ['-v', '--version']: return` at as_program.py:57) — before `self.debugging` and every other attribute was set — and `Main()` then called `.start()` on that half-initialised object, which reads `self.debugging` on its first line. It now `sys.exit()`s after printing the banner, so `allspeak --version` / `-v` print the version and exit 0. `allspeak` with no arguments (Main's `Program('-v')` branch) also exits 0; running a script, `debug …`, `info` and `--test` are untouched.

Verified through the exact entry-point path with the repo on PYTHONPATH (`from allspeak.as_program import Main; sys.exit(Main())`): `--version` and `-v` → version, exit 0; a normal script compiles and runs (exit 0); conformance unchanged (15 files / 5 tests / 3 failed). Also confirmed the installed copy under ~/.local differed from the repo only by this hunk, so a reinstall is all that is needed — and noticed DIFF.md's reinstall command was wrong (`pip install --no-deps allspeak-py` is read as a PyPI name; it must be `./allspeak-py`), now corrected. Could not reinstall to verify the installed CLI directly: the sandbox reports ~/.local as a read-only filesystem.
