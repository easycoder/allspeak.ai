# 2026-09-27

## 21:30

I need the ability to read the position and size of a window in the graphics package.

- `on close {window} go to {label}` — fires during the close event, so the save completes before the runtime ends the program as its last window goes.
- `the x of {window}` and `the y of {window}` — today `the width of` / `the height of` are the only geometry reads.

Make `the x of` return `geometry().x()` and `the y of` return `geometry().y()`, not `x()` / `y()`. Qt's `x()` includes the window frame while `create … at X Y` calls `setGeometry`, which excludes it — the frame-inclusive read walks the window up and left by the border on every restart. (`as_debug.py` saves `x()` / `y()` and restores with `setGeometry`, so the debugger has that drift now.)

**Assistant**

Two graphics-domain defects turned up on the way, both left for you to decide on (TODO.md item 12):

- `as_debug.py:992` saves `self.x()` / `self.y()` and restores with `setGeometry` — the debugger window has the drift you described. Same two-word fix as the graphics reads; I did not touch it.
- The click/select handler in `r_on` calls the module-level `flush()`. Under `python3 -m allspeak.as_program` the runtime is imported twice (the `RuntimeWarning` you see), and that `flush` belongs to the copy whose `queue` is never created: every click/select prints `NameError: name 'queue' is not defined` and the handler slips to the next 250 ms timer flush. Verified with a combobox: under `-m` the main flow overtakes the handler ("select done" before "Picked fired"); via the `allspeak` entry point the handler runs synchronously. Harmless for a click, fatal for `on close` — the window, and with it the program, are gone before the timer fires — so the new close path drains the running program's queue with `self.program.flushCB()`.

What changed (`allspeak-py/allspeak/as_graphics.py`, Python only — the JS runtime has no desktop windows):

- `the x of {window}` / `the y of {window}`, in the same `compileValue` branch as `the width of` / `the height of`, with new `v_x` / `v_y` handlers returning `geometry().x()` / `geometry().y()`.
- `on close {window} go to {label}`, a new branch in `k_on` (windows only) wired up in `r_on`. A new `ECWindowWidget(QMainWindow)` — the class `create {window}` now builds — overrides `closeEvent` to run the handler, so it fires during the close event, before Qt finishes closing the window and before `lastWindowClosed` kills the program on the last one.
- `learn/reference/20-graphics.md` documents both (events section and the reads list), mirrored to `deploy/learn/` with `./deploy-sync`; `DIFF.md` rewritten.

Verified with scratch scripts under `/tmp/asprobe` (nothing added to the repo), `QT_QPA_PLATFORM=offscreen`:

- `create MainWindow at 120 90 size 400 300` → `the x of` 120, `the y of` 90, width 400, height 300; a second window reads its own 600.
- One window, `on close MainWindow go to MainClose`, handler writes `{x: 150, y: 130, width: 420, height: 320}` — the geometry it was created with — to disk; the process then ends, so the save really does complete first. Two-window variant: both handlers fire, the last one immediately before the program ends.
- Both invocation modes (`python3 -m allspeak.as_program` and the `allspeak` entry point) behave the same for the new syntax.
- `tests/graphics-demo` still compiles and starts; the conformance suite is unchanged at 15 files / 5 tests / 3 failed (the pre-existing failures).

No test file added — this repo's graphics tests are interactive demos, and there is no automated graphics suite to hang one on. Say the word if you want an offscreen regression test.

## 21:34

Documented, e.g. in learn/?

**Assistant**

Yes — `learn/reference/20-graphics.md`, in two places, both mirrored to the served copy under `deploy/learn/` by `./deploy-sync`:

- **Events** (line 165): `on close MainWindow go to MainClose` added to the handler list, then a paragraph saying it runs inside the close event (before the window goes, and before the runtime ends the program on the last one), fires for the X button and for the script's own `close {window}`, is not raised by `exit` — plus the save-on-close snippet I actually ran (`set entry … of Saved` + `save Saved to \`window.json\``).
- **Reading values back** (line 206): `put the x of MainWindow into N` and `the y of`, after the existing width/height pair, with the note that all four are window-only and share the frame convention of `create {window} at X Y`, and why (Qt's `x()`/`y()` include the frame).

Where it is *not*: no fr/de/it `20-graphics.md` exists — the graphics page is English-only, so there is no translation gap here. `learn/contents.md:31` summarises the page as "widgets, layouts, events, dialogs", which still covers `on close` as an event. `allspeak-py/doc/graphics/` (the older set that the reference page itself flags as partly aspirational) is untouched; note that `doc/graphics/values/window.md` documents a value form — `the window height` — that does not compile, while the real form is `the width of Window`. Pre-existing, reported not fixed.

The one live gap is the worked example: `learn/idioms/14-desktop-gui.md` still lists only `the width/height of Window` and has no `on close` in its event list. Asked whether to extend it (options: full save-on-close block / just the lists / leave it).

*Chosen: "Yes — add a short save-on-close block", so the page now*: lists `on close Window go to Closing` among its events with a `Closing:` label that saves `x`/`y`/`width`/`height` (the skeleton declares `dictionary Saved`); names `the x/y of Window` in its reads list; gains a "Putting the window back where it was" section showing the restore side; and its `exit` anti-pattern now warns that `exit` does not raise `on close`.

*The restore block is verified, not written from memory* — run twice headless: run 1 with no file took the `else` defaults (40/40, 420×300) and saved exactly those; with the file hand-edited to 500/120 700×480, run 2 restored it, placed the window there and saved the same numbers back. Also: the file-exists condition is `if file \`window.json\` exists` — the `if \`path\` exists` form I first tried does not compile, which is what `allspeak-py/doc/core/conditions/exists.md` and the `resources/doc/{en,de,fr,it}/core.json` caches document (`{path} exists`, `if \`data.txt\` exists`). Pre-existing doc/code disagreement, reported not fixed.

Mirrored to `deploy/learn/`; `tools/learn-link-check.py` reports 0 errors (4 pre-existing infos); the page's skeleton script compiles and starts headless (87 lines).

