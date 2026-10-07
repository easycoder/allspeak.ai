# The visualiser and the editor

The detail behind `TODO.md`'s viz row. Everything here is either a **binding decision** — checked against before adding anything — or **open work** with the smallest first step named. The dated reasoning that produced each of these lives in `git log -p -- TODO.md` (pre-2026-10-04) and in `conversation/`; it is deliberately not repeated here.

**Headings carry their bin, since 2026-10-06** — the four are defined in `TODO.md` under "How this list is run". Here that reads: `[note]` is a settled decision or a fact; `[mine, queued]` is open work that does not need you, in the order it was chosen where an order is stated; `[your call]` is the few that want your eye or your hand.

---

## Read this first if you are resuming this work

**`various/record-and-launch.md` — 544 lines, and the working state of the capture-and-trigger workstream.** It is the detailed record, section by section, of how `record the script … giving … reporting <verdict>`, `record this run`, `save the recording to` and `record the app at <url> to <path>` were designed and built, what each decision was against, and what is left. **It is gitignored, so it exists only in this checkout** — a fresh clone has no copy, and nothing else replaces it. Start there.

**The other local material, also gitignored, and what each is for.** `various/plot` and `various/make-viz-plot.py` are the throwaway prototypes the pane's geometry came from; `various/make-viz-silhouette.py`, `various/silhouette*` and `various/make-redacted.py` are the static-shape experiments; `various/svg-image-check.js` was the off-screen-buffer probe; `various/plotview-*.html` and `plot-trace-*.html` are saved harness pages you can open in a browser. None of it ships, all of it is disposable, and it is the only browser-visible form of the pane outside the editor.

**And the commands that check any edit here are in `BUILD.md`**, not repeated in this file: `node tools/asedit-check.js <file>` for each of the three editor files, `node tools/asedit-modes-check.js` for the editor and both modules end to end, `node tools/plotview-check.js <trace>` for the drawing, and `node tools/guard-check.js` for the recorder's guard on both hosts. **Editing the editor files needs no build** — what it needs is those checks, and a refresh of any extracted starter directory, because a running server serves the copy on disk rather than the repository.

---

## The governing principle, and it overrides anything below that conflicts with it

**Make complex things simple.** A fully-integrated solution with a concise feature set and a minimal learning curve, for an audience that includes people who will only stay aboard while each learning step is small. Three rules follow, and future work is checked against them:

1. **No new commands to see the picture.** The view is simply there for a script you have run. The two marker words a user has already learned — `viz start` and `viz stop` — are enough for every review; `on`, `once`, `every`, `until` and `limit` are refinements, not a curriculum. `viz` is a no-op without a recorder, so a script carrying markers runs like any other.
2. **Nothing in the onboarding depends on this.** The Primer's first steps carry no markers at all.
3. **Perfetto is not the product.** It is a development instrument and an optional escape hatch; users are never asked to learn it. Its UI is also English-only and has no notion of the script's own language, whereas our records already carry the user's own names and prose.

**The visualiser speaks the script's language for free.** The language packs already carry a `diagnostics` section of user-facing strings, so the view's own labels belong there rather than in a translation layer of our own. Anchor names and doc-block prose arrive in the author's language already, because they *are* the author's text. The editor passes the three localised flow words to the pane; the provisional fr/it/de words for `wheel`, `amount`, `shift`, `control` and `svgimage` are still awaiting Graham's eye, as is the `reverseWord` line in the svg plugin's `getHandler`.

---

## Settled decisions — [note]: checked against before adding anything

Each of these was decided by Graham and is not to be re-opened without him.

- **The dev server's page has no check.** On 2026-10-04 the Graph pane came up empty for Graham on a dev server, with a clean console and no effect from resizing: `server.allspeak` filled `lang` and `#editor-home` in the page and **nothing filled `#editor-graph`/`#editor-side`**, so the editor fell through to a cross-origin fetch of a `.allspeak` file, which the browser refuses (the site sends `access-control-allow-origin` for `.js`, `.css` and `.json`, not `.allspeak`) — and the refusal is swallowed by design. Fixed by having the server fetch both modules and write them into those elements (before: 11,580-byte page with no pane; after: 179,056 with both). **What is missing is a check that the page a dev server serves carries the two modules**, since every other symptom of this failure is invisible: `tools/encoding-check.js` is the model — it starts the runtime and inspects what it serves.
- **One view, and lines from the start.** Every line is a row; at low zoom they are sub-pixel and read as one compressed band per block, with the block label above it.
- **The bar is not a shape device — it is the heat channel.** The marks are shaded by how busy a line is, and the shape of the flow is a separate channel.
- **The hover rule.** At low zoom, show the current marker and any doc prose — not the line's command, which is meaningless at that size. Line text belongs there only once zoom makes it legible.
- **Colour: the run warming up, not a legend.** Each mark's colour is its line's *running* count against the busiest line in the recording, and is dialled back by how early in the run the mark is, so every line starts cold and a hot line sweeps the ramp as the run proceeds. The four colours are blue, violet, magenta, red. **The heat key had to go** with this: a colour meaning "how hot, by when" cannot be labelled with a range of visit counts. The flow key stays, on the status line's row.
- **The heat is *executions*, not time** — and the recording carries time too, so colouring by `dur` instead of by count is available whenever it is wanted.
- **Transfers: recorded, not inferred.** The flow lines come from the run (`cat: "transfer"`), so each lands at its own moment. The compiler's own jumps are recorded too, but as `branch` and drawn only when asked for, because `if`/`while`/`wait` scaffolding is not a program jump.
- **The gestures, from Kdenlive and Audacity:** wheel alone scrolls up and down, **shift-wheel zooms the lines**, **control-wheel the steps**, both together both, and drag does the panning. The axis-selective zoom the first prototype used is dropped: a zoom takes both axes, and pan covers the rest. Axis selection uses keys rather than modifiers where it cannot use them at all.
- **The trace is the contract.** A recording is a file, so a script the JS runtime cannot run is recorded by Python and drawn by the same picture. `viz.allspeak` itself uses no containers and runs on both.
- **The Graph pane is a companion module**, `asedit-graph.allspeak`, fetched and compiled on the first click on Graph — with `asedit-side.allspeak` beside it. Each attaches to its **own element** (`se-graph-host` for the picture, `se-graph-side` for the panel, `se-graph-area` as the flex row), so neither module lays the other out.
- **The editor owns the doc-block look-up.** Which block holds a line is a question about the script's structure and Blocks mode already answers it, so the sidebar displays and the editor decides. A line in no block is an answer, not a failure.
- **The pane cannot measure its own canvas.** `svg` is the one element type the plugin registers without the `dom` extra, so the sidebar could not have been an element inside the pane's own box — an arithmetic fit with the sidebar's width baked into it would sit between the panel and every drawn coordinate.
- **Nothing in the picture is a DOM element.** Each kind of mark is one merged path (`ec-VizFlowCall-0` carries four arrows in a single `d`), so a click or a hover is arithmetic against the view's own geometry, exactly as the scrollbar handles' hit test is. **This is the constraint the tooltip shares with the mark selection.**
- **Draft 2 of the trace format is spec-first work.** The format is the contract the sidebar, the pane and both recorders all read, so a format change begins with the spec and stays in step with `tools/check-trace.py`.
- **Working from a trace file** is agreed: the view needs nothing new from the runtime.

## The alert/info panel — [note], and built 2026-10-07

**One panel, `asedit.json`'s (`se-alert` + `se-alert-text` + `se-alert-close`), near the top of the page and in front of everything, hidden until something asks for it.** Graham's words were *"a text area with one or more buttons attached, near the top of the panel … its z-order can place it in front of anything else and it can be disabled or moved out of the way when not needed"*, and his reason for wanting it: *"places where user actions don't give immediately noticeable results or where things need to be explained."* Asked which home, he answered the **editor-wide shared overlay** — *"for now, the only likely use is in the Graph pane. But it's sensible to go with 1"* — so the pane writes to the same two elements **by id** rather than the editor showing messages on the module's behalf. Neither program declares the other's text, and the Close button belongs to whoever rendered the page.

**What is in it.** The editor's two *module could not be loaded* messages (`SideLoadFailed`, `VizLoadFailed`), which were the worst-served by the status line: the editor also leaves the mode they belong to, so the explanation and the symptom arrived a line apart and both went after three seconds. And the pane's long-drawing notice.

**The pane's notice, and the decision inside it.** The panel is armed from `VizBusyNotice` and a ticker (`VizAlertTick`) puts it up **only if the drawing is still going a second later** — no threshold chosen in advance, and it is what makes a *first* drawing (where the pane has no rate and so nothing measured to say) told about exactly as any other. `VizAlertSay` composes the one sentence from three facts: the learned estimate, the elapsed seconds, and `VizAlertWhy` — the explanation the prediction wrote. **The count is `DrawStarted`'s clock, not the ticker's origin**, because the ticker cannot fire while the drawing holds the thread, and the first version read `16 s` against a drawing that reported `drew in 4.2 s`. On completion `VizAlertFinish` keeps `drew in X.Y s` up for four seconds and then takes the panel away; `Close` does it at once, which is the thing a native `alert` never allowed. **The panel is armed *before* the corner readout is written**, deliberately — see the finding below.

**The size warning left the status line.** `VizPredict` now writes `VizAlertWhy` instead of `set the content of StatusSpan`, and `VizWarned` (and the status-clearing branch it guarded) went with it. The status line keeps the pane's *other* messages; the number a reader waits on is now in the place they are looking.

## A fault left for you — [your call]: `VizBusyNotice` writes to an element the first drawing has not made

**The readout moved into the drawing on 2026-10-06 and the line that writes it did not move with it.** `VizBusy` is created by the build block inside `Draw`; `VizBusyNotice` — which writes it — runs *before* `VizRequest` calls `Draw`, so on the first drawing of a run `the text of VizBusy` reaches a `null` target and throws (`Cannot set properties of null (setting 'innerHTML')`). **Measured, not reasoned**: reproduced in a browser by calling `VizBusyNotice` directly (`busyEl: []`, the throw), and by instrumenting the module (`VizBusyNotice entered` … and nothing after). **It is invisible in practice, and that is why it has survived**: with no recording the flow stops at `GraphNone` before the draw and the message is all that is shown, and with a recording the build has happened by the time the notice is reached (`VizReady` is `1`, the canvas is in the page, no error). It is also what `asedit-modes-check` dies on at the end. **The fix is yours to call**: either split `Draw` so the elements are built before the notice, or build them from the notice itself — and the panel work above deliberately does not depend on it.

---

## Open work, in the order it was chosen — [mine, queued]

### First: the traffic lights — decided, designed, not built (2026-10-03)

**Graham's answer to the choice was both halves: per-tab lights *and* the app reporting back.** The order follows, because the second half writes into the first.

**Half one — the state, and the lights from it (editor only, no app change).** Everything it needs is already parsed; the work is a per-tab model and the colours.

- A per-tab flag array, grown in `TabGrow` like `TabPath` and `TabSaved`.
- **Has a recording**: set where the run is fetched (`FetchRunText` — success 1, the `or go` failure 0), and after the editor's own Record. *"As of the last look"* is the honest reading and the doc block should say so.
- **Names an app**: `AppPage` is already set by `ParseSource`, so a per-tab flag is one line beside it.
- **Asks to be recorded**: this needs the *model* to say so, because `record this run` is a command rather than an attribute and the model reports attributes and counts only. Cheapest honest form is one summary record (`uses | record-this-run=yes | markers=2`) rather than one per command, which would be verbose for every reader.
- **Painting**: `Record`/`Graph` tinted when the tab has a recording, `Launch` when it names an app, a quiet mark when it asks to be recorded — one `PaintLights` called from tab switch, parse and record, so no caller has to remember. **The colours are Graham's to choose**; the states are few and they are what matters.

**Half two — the app reporting back, which is the only way "armed" can be true.** Two pieces, both small: the editor must **keep the window it opened** (`location new <page>` discards the handle; `window.open` returns one, and the editor needs it to listen for a message), and **the app's page must opt in** — a few lines loading `plugins/asviz.js` and posting a small message to `window.opener` when armed, when recording and when saved. The editor paints per tab from that, and says plainly when it has heard nothing, since silence is also a state.

### Then: the sidebar's remaining pieces

The sidebar and its Docs tab are built. What remains, and each is small:

- **The time at a mark.** The anchor event already carries `dur`, so it is one more property on the message the pane already sends, and it belongs in the same status bar that carries `line N   visit V of T`.
- **A marker highlight in the picture**, so the panel's selection is visible there too. It costs a new path, and the harness's "exactly eight paths" structural check moves with it.
- **A second path into the panel** — selecting a block directly rather than only through a mark.
- **A way to close it.** The 6-px grip is where it belongs: a drag to the floor, or a double-click, rather than a third control.
- **One decision waiting for the second tab.** The mark click fills the tab it belongs to. The moment there *are* others, a click while another tab is up would change nothing visible — indistinguishable from a bug. So: does a mark click bring the Docs tab forward (the click is always "tell me about this line"), or leave the tab where the reader put it? Decide it **with** the second tab, not after it.
- **A debug tab** — item 5 below.

### Then: rollover tooltips (item 3)

**The language half is done — `on hover` landed 2026-10-07, and the thing this section used to name as the blocker is the part that is now built.** `on hover {element}` fires while the pointer is merely *over* a browser element (element-scoped like `pick`, and refused for a plain `variable`), reads `the hover position`, and attaches **`mousemove` and `mouseleave`** — the leave being what carries a tooltip away again, since a hover is pointer-rate and the last one the pane sees is inside the host. There is no touch counterpart, deliberately. The word is in all four packs (`hover` / `survole` / `sorvola` / `schwebe`), collision-checked so `reverseWord` answers `hover` and nothing else, and `tools/hover-check.js` proves the whole path with a stub that stores listeners and can dispatch one. **Python has no pointer event at all, so nothing was mirrored there but the word.**

What is left is the pane's own side. The svg plugin has no `title`/tooltip support and the arrows are one merged path, so the pane needs a hit test *and* a surface for the tip — and **the pane cannot take its own listener** (`svg` is the one element type registered without the `dom` extra), so the hover is registered on the **host** and the pane works out *which* control the pointer is over by arithmetic from `the hover position`. That is what `VizHandleAt` already does for every gesture, and it is the cheap half: the tip's own `svgtext` and its two coordinates are attribute writes. **The handler must be attribute writes only** — the event arrives at pointer rate, so a handler that redraws makes the pane unusable, exactly as the drag's guide-and-wash feedback is. Its foot already carries the status line, so the tooltip must be its own element.

**Built 2026-10-07, for the clip bar's three controls — (`TODO.md` has the dated entry).** `on hover VizHost` is registered with the other gestures; `VizHover` converts the pointer through **`VizPointerUnits`** and asks **`VizControlAt`** which box is under it — the same two subroutines the *press* uses, because the factored-out hit test is what stops a control answering a press and a hover differently, and `VizPointerUnits` is the one place the letterbox arithmetic lives (the thing here that has already been got wrong once). The tip is `VizTipBox` + `VizTip`, created last so they draw in front, and it is **right-aligned with the control it belongs to**, on the strip below the controls. `VizHoverShown` is the memo: the words are written only when the answer changes, because a tip rewritten in the same words is a layout the browser is asked to redo dozens of times a second. `plotview-check` gained six claims, including **no hover draws anything** (the picture is byte-identical across all three hovers) and that the tip's right edge moves with the box.

**The sidebar's own rollover is what remains of this item**, and it is the *other* half of sharing the hit test: it wants a tip surface in the sidebar's module, over its line-marked rows and its tabs. The tabs already carry a `title`.

### Then: a run started from the editor (item 4)

**The command and the button are built.** `asviz.js` has `record the script [in <path>] [as <source>] giving <variable> [incomplete <flag>]`, `asedit.allspeak` has `RecordRun`, and `asedit.json` has a **Record** button beside **Graph**. `asedit-modes-check` proves the loop end to end.

**What remains is the shape a run takes when it waits.** See the note the code points at, in `TODO.md`: a capture covers a run *up to its first wait*, and says so rather than passing a slice off as a whole. Graham's steer: *"it's a place to start, but eventually I will probably want to trace through threads that wait."* That needs the caller to be **told** when a run ends rather than to wait for it — a callback, or start/collect — and the fact a fix needs is already in place: `recorder.parked`, set as the recorder ticks each command from the same waiting-keyword list the guard uses.

**Two boundaries to state in the button's message rather than fix:**

- **A Python-variant script is out of reach of the editor's Record by construction** — the editor records with the JS runtime, so a script using `dictionary` is refused. Its route is a project's Python server recording it (route 2 below), which is unbuilt.
- **An app is not a script.** `parser.html` fetches its script and runs it into *that* page; in the editor's page there is no such page, so it stops at once. Recording a launched app means arming the recorder **before the app's own `viz start` line runs** — attach one after startup and the window has already passed.

**And the guard every route needs is in** (see the note in `TODO.md`): both recorders take a work budget and a wall ceiling, `Run.js` reads the answer the way Python's runtime does, and `stopped: "work"|"wall"` reaches the trace. `tools/guard-check.js` ships in the packs and proves it on both hosts.

### Then: annotations, capturing values into the recording (item 5)

**The vocabulary already exists, which is the good news.** "A label carrying an annotation" is already `viz start on Work`, and a `while`'s anchor exists too (`loop@<line>`). So the extension is one more option in the same option-reading loop in `Core.js` and `as_core.py` — naming the variables to capture — not a new syntax. The precedent for the feature itself is `allspeak-py/allspeak/debugger/`'s watchlist; `args.values = {name: value}` is the obvious shape, and both recorders already hold the pc→line map needed to attribute a value to an anchor.

**It begins with Draft 3 of `spec/viz-trace-format.md`**, and `tools/check-trace.py` stays in step. **Cost, stated plainly:** core syntax in two runtimes, four language packs, a spec revision, a checker change, two recorders and the sidebar's debug tab. **The largest item on the list, and the one to design rather than start.**

**Graham, on what it buys:** *"the addition of variable values to the recording will open up many debugging possibilities"* — and the article's §9 currently *undersells* the tool because of the "flow, not data" bound, so this is the change that most improves the writing as well as the tool.

### The redaction — done, with two things still to weigh

`VizRedact` is one `path` inside `VizPane`: one bar per drawn line, built in the same once-per-run pass as the text document, each bar as wide as its line at eight units a column and as tall as the whole eighteen-unit row. **The zoom behaviour is a consequence of where it lives** — `VizPane`'s `viewBox` is the document, so a bar is scaled by the browser exactly as the glyphs beside it are — and the width is pinned at the maximum-zoom length by a `transform` whose factor is the document's shrinkage inverted, so the two cancel at one attribute per draw with no rebuild. **The deferral Graham offered is not needed**, and the reason is what to keep: rebuilding the bars per notch is the obvious way and the one that would have cost what he expected.

Two numbers for his eye, and **both are closed by his call of 2026-10-06: the redacter is a tool he expects never to use, so the fill stays `#d6d6d6` and neither number is worth moving.** Recorded so it is not re-derived: the fill is `#d6d6d6`, which against the page is 12.36:1 where the dark grey was 1.45:1, and **a rule crossing a bar is 1.25:1** — the rules are `#eee`, so a leader crossing a bar was identical to it and is now only a shade clear. The alternative was about `#7a8290` (the horizontal scrollbar's grey), which puts the rule at 2.05.

### Launching the project's app — built; the capture half open

`@app <page>` on a script, and `asedit.allspeak`'s **Launch** re-parses the buffer and hands the page name to `location new`. **The name is relative to where the editor is served from — the project root — so no path is assembled and no server route is added.** A script naming no app is told so and told the spelling; deleting the attribute stops the launch rather than leaving the last page standing.

**Still open:** arming a recorder for a launched app must happen before the app's own `viz start` runs, so it needs a bootstrap in the app's page or an injection before its scripts run. And whether the editor should *drive* the app rather than only launch it — which is what a pane would buy, and the window was chosen knowing it does not.

### The three routes for capturing a run, unchanged

1. **The editor records** (JS, in the editor's own page) — **built**. `edit.html` already loads the runtime and `plugins/asviz.js`, so nothing new is fetched, no server change is needed, and it works from a pack. The trace is written to `<script>.viz.json` through the existing `POST /write/`. *Caveat to state, not hide:* the script runs **in the editor's page**, so it can scribble on the editor's DOM, and it is the JS runtime's run. The guard makes a runaway harmless; the DOM sharing is the reason to consider a throwaway iframe, at the cost of twenty lines of page JS.
2. **The project's server records** (Python) — **built 2026-10-05.** `allspeak --record=<trace> <script>` runs a
   script and writes its recording; `GET /record/<script>` on the dev server calls it with the script's output
   redirected to `<script>-stdout.txt` and the trace written to `<script>.viz.json`, and answers with the verdict
   and the output file's name; and the editor's **Record** asks that route when the tab's script is for Python,
   instead of refusing it. Verified live (`41 visits in 1 window` from `examples/chemical/parser.allspeak`) and
   asserted in `asedit-modes-check`. **Corrected 2026-10-05, and the correction is the interesting part**: the first version
   resolved the flavour from the model's *attribute* records, which exist only for a program the runtime
   compiled — so the marker was invisible for a script the JavaScript runtime cannot compile, which is every
   script that needs one. The model now reports `flavour | py | from=script` from the **token stream**, and the
   editor reads that. Found from Graham's own status line; the check had passed because its fixture was a script
   the JS runtime *can* compile. **What is still owed**: the *dev server* filling `#editor-runtime` has no check
   of its own — the harness now sets the element, so the plugin's read of it is exercised, but that a served page
   carries it at all is the same owed check as the one above. The guard bounds a recorded
   run (2 s work / 20 s wall) where a console run is unbounded, which is Graham's call to change.

   Was: **half built, 2026-10-05.** The command it needs now exists: `record the script [in <path>] [as <source>] giving <variable> [reporting <verdict>]` runs a script under a recorder *inside the Python runtime* and hands the recording back, so a route can call it and write the trace, and `@py` is how the script says it is the Python runtime's (below). What is still unbuilt is the route in `server.allspeak`, and it needs the plugin beside the server (`use plugin Viz from ./as_viz.py`, so `as_viz.py` travels in the packs — which no pack carries yet). **And the marker has made the caveat concrete rather than theoretical:** a route that runs *the script in the active tab* can only do so if the tab is a `@py` script, and today every script without a marker is a JavaScript one — so a route like this records `@py` scripts and refuses the rest in a sentence, which is the honest half of the feature.
3. **The project records itself** — the most integrated and the least machinery for a JS project, and the one that answers a question the other two cannot: recording what an app *actually does*, rather than running the script instead of it.

### The Python flavour's two remaining shapes, and one bug found with them (2026-10-05)

`record the script … giving …` is now in both plugins, so **the trigger's halves are one apiece**: the Python side has the "run another script" half and the JS side has the pair `record this run` and `save the recording to <path>` that a *running app* needs. Mirroring those two into `as_viz.py` is the other direction, and it is the smaller job of the two — both are thin shells over machinery the plugin already has (`Recorder`, `guard`, `traceDocument`, `verdict`), and `@viz start` arming is the JS wrap of `AllSpeak_Run.run`, whose Python counterpart would be the same wrap of `Program.run`. `tools/asviz-run.py` already demonstrates the arm (`program.recorder = Recorder(...)`).

**And the flavour marker is what makes the pair non-trivial to place.** `record this run` arms *the program that called it*, and `save the recording to <path>` needs a file path — neither needs the marker. But a Python app recording itself needs `use plugin Viz from …` in its script, and a *pack* does not carry `as_viz.py` — the same "the packs are CDN clients" boundary as `tools/`.

**Fixed 2026-10-05 — see the section at the end. The bug was: Python's `@viz stop` never closed its window, the same bug JS fixed on 2026-10-04 (`23a9b30`).** In `as_viz.py`'s `Recorder.tick`, `if marker == 'stop': self.stop()` sits *below* `if pc not in window['anchors']: … return`, and an `@viz stop` line compiles to the attribute entry, which is never an anchor — so every attribute-form stop falls through the early return and what closes a window is `finish()` at the end of the run. It is invisible in a single-window recording, which is why it has survived; it shows up as **a visit count the two runtimes disagree about**, because JS closes the window *before* counting the marker and Python counts it:

| script | Python | JS |
|--|--|--|
| `viz start` / `put` / `viz stop` | 2 visits | 1 visit |
| `@viz start` / `gosub` / `@viz stop` | 1 visit | 2 visits |

Found while writing `tools/capture-check.js`'s flavour assertions, and worked around there rather than fixed: **the check uses a window that opens *not* directly under a label**, where the two runtimes agree exactly (`4 visits in 1 window` either side). The fix is to move the stop handling above the anchor test, exactly as JS did — but it moves the visit counts the trace spec's "Where the two runtimes differ" section was written around, so it belongs with the `@viz start`/`@viz stop` segment work rather than with a parity patch.

---

## Smaller items, in any order — [mine, queued], unless marked

- **The document is as wide as the longest line of the *file*, which may now be one of the blanked ones.** `VizGlyphMax` is measured over every line, prose included, so an invisible `!!` paragraph of four hundred characters still sets `VizGlyphWidth`. Nothing shows it — the pane clips at the frame and the glyph metrics are fixed by font size and row height — so the extra width is slack the browser never paints. One line in `VizSourceMeasure`'s measure loop if the width should mean "the widest row that is drawn".
- **A horizontal notch rebuilds the `href` for nothing.** `VizSourcePicture` re-`cat`s the whole encoded body on every draw; a guard that reassigns the `href` only when the source or `VizViewY0`/`VizViewYH` moved removes it. Not done because the standing call is to leave optimisation until the functionality is finished.
- **Tabs.** A tab in the source is one character in the document and SVG's whitespace rules turn it into a single space, so a tab-indented file would lose its column alignment. `.allspeak` files are space-indented; `as_condition.py`, which is what the redacted picture is of, is not.
- **The cost of a live pan** — the drag redraws on every drag event, so the picture follows the pointer at a few frames a second on a big recording. Graham's call (2026-09-30): leave it until the functionality is finished. The fix, if it reads badly then, is to translate the five path attributes with an SVG `transform` during the drag and redraw once on release.
- **`tools/guard-check.js`'s JS 1 ms work-budget check is flaky** — on 2026-10-04 it reported `stopped=null, null visit(s) recorded` on one run and passed on the next two. One millisecond is inside the recorder's own bookkeeping, so the check reads a value mid-flight more often than it should; a budget of a few milliseconds, or a retry, would settle it.
- **`viz start`/`viz stop` as the whole recording lifecycle — Graham's shape, 2026-10-04, not built.** `start` arms and opens the window; `stop` closes it, *flushes the trace file*, and leaves the app armed for the next run; a second `start` restarts the capture; a `start` with no `stop` loses that window only. It takes the editor out of the loop entirely, which is where tonight's three faults lived. **Settled later the same evening, and it is three seams:** Record *creates* the empty trace file (and does not open the app — which is also what would light the traffic lights); `viz start` starts a collection (arm if unarmed, begin a segment); `viz stop` ends the segment, **flushes it into the file**, and closes it — so the file accumulates any number of segments contiguously as one recording, and a flush has to merge (read, add, write back). No new vocabulary, so no pack changes. **Built 2026-10-04 (`23a9b30`), and the check for it is `tools/flush-check.js`.** `@viz start` arms (and flushes nothing), `@viz stop` ends its segment and writes it into the file named by `save the recording to <path>`, the window index continues across segments, and a program a host has already armed is left alone. `save` no longer ends the recording or unarms. On the way, a real bug: **`@viz stop` had never closed its window** — the handler sat below the recorder's early return for a command that is not an anchor, and a marker line never is one.

What is still open here:
- **The editor's Record does not create the trace file.** Graham's shape has it doing that so the tab can see a recording is intended; the script's own `save the recording to <path>` creates it today, which covers the app case. Needs a decision on whether Record also POSTs an empty document.
- **The reference chapter on recording a run** — `learn/*/reference/` still has none, and the vocabulary has now changed shape twice.
- **The framework's report line lies under `--no-recorder`**: `viz.allspeak` prints `windows recorded: 0` for a script that armed itself, because it counts the *host's* recorder.
- **`tools/capture-check.js` is published and needs this repo's sources, without saying so.** It spawns `tools/asviz-run.js`, which a pack does not carry, so from a pack it fails with a missing-file stack trace rather than the sentence `tools/flush-check.js` now prints (added when `flush-check.js` was published, 2026-10-04). The same fix, one tool over.
- **`flush-check.js` is published but not named in any pack's `AGENTS.md`**, so a project's agent will not know it exists. The four checks the packs name are unchanged.
- **The read-merge-write is proven against a stubbed page, not a real one.** `tools/flush-check.js` drives the plugin with an in-memory `/read/` and `/write/`; a real browser run is the remaining evidence, and it is the one Graham can give.
- **DONE 2026-10-04: the editor's status line now says only what is true** ("Opening <app> — it writes its recording to <path> as it runs"). What remains of it: the editor still cannot *report* a failure, which the plugin logs in the console — a deeper fix would have the editor read the plugin's state on a later tick rather than claim anything at the moment of the click. Was: **The editor's status line claims a recording that may not exist.** `asedit.allspeak:2171` sets "Recording <app> — close its window and the recording is saved to <path>" immediately after issuing `record the app …`, whether or not the plugin opened a window, injected itself into the app, or armed anything. Measured 2026-10-04 by Graham following that message while nothing was recording. It should be set only when `watchApp` reports it started.
- **DONE 2026-10-04: `watchApp` stops trying only when a program is being recorded** (and it hands the app its `tracePath` before arming). Was: **`watchApp` sets `armed = true` even when it armed nothing**, so the loop then only *collects* and never tries again. An app that parks on its first wait (`rest get` before `run Script`, as `parser.html` does) has no registered program at that moment, so the program is never armed by the editor — the editor's console says `0 program(s) armed`. With a self-recording app the recording survives (the app arms itself), but the editor never learns that it did.
- **DONE 2026-10-04: Record no longer writes the file at all**, and `gatherApp`/`writeAppTrace` are removed with it — the app is the one writer. Was: **`writeAppTrace` overwrites, so Record and a self-recording script are two writers of one file.** It writes a fresh document with no read-merge, so a close-write after the app has flushed three segments replaces them with the editor's snapshot. Whatever Record becomes, it should add rather than replace — `AllSpeak_Viz.appendTrace` is the function that does it.
- **The editor's app-arming path (`watchApp`, the injection, the carry) is now redundant for a self-recording app** — it stays for `record the script …`, and nothing has been removed. Deciding whether to retire it wants the browser run above first.
- Written up in `various/record-and-launch.md`.
- **The arming across the window boundary is still unasserted, and it had two defects until 2026-10-04.** `asedit-modes-check` asserts the *branch* (an app buffer opens the page and writes nothing) and says so in its own output; the arming itself needs two live windows and the harness has one. Graham's first run of it found both: the plugin was injected on every poll tick (`asviz.js` declares its namespace as a top-level `const`, and a classic script's `const` is not a property of `window`, so the editor's `win.AllSpeak_Viz` guard never passed) and the arming line would have failed next for the same reason. Both fixed; **a fake second window in the harness is what would hold them**.
- **DONE 2026-10-05: the Launch message shows a real filename rather than a placeholder.** It read `add '@app <page>' on a line of its own` and `<page>` was eaten as an HTML tag by `innerHTML`, so the reader saw `add '@app ' on a line of its own` — Graham reported exactly that, which is the whole diagnosis. Now `@app mypage.html`, and `asedit-modes-check` asserts the message carries `@app` plus a filename, which is the content that does the work; the same trap is in `AGENTS.md`'s list. **The related decision is still open**: on a Py-side script this message *invites an `@app`*, and a Python script has no page to name — so Launch wants either a flavour-aware message or a meaning, which needs the editor to read `#editor-runtime` first. See `TODO-language.md`.
- **The status line keeps a pane's report after the pane is gone.** Leaving the Graph pane for Edit leaves `I don't understand 'dictionary' at line 46.` sitting beside the toolbar buttons, which reads as a live fault. It has three writers (a transient action, the auto-save, and the pane when it fetches a run) — assert the value it is built from, and clear it when the pane that set it is closed.
- **The ramp's bottom end — closed by his call of 2026-10-06, kept only so the reasoning is not re-derived.** With a band size of 1 a once-visited line lands in band 1, so a quiet run shows amber for its least-worked lines; the change would be `take 1 from VizCount` before the division, and it moves every boundary. He reads it as noise rather than as a fault, and the legend makes either choice legible. **Do not re-open it without a reason from a screenshot.**
- **The two copies of `asedit.allspeak`** — hygiene, not a bug: nothing he runs reads the second one. The options are in `DIFF.md`; the recommendation is to have `deploy-sync` refresh `deploy/code/` from the root, so the local published copy cannot be stale *and* so `BUILD.md`'s claim that the `cp` step is enough becomes true.
- **The size of a mark** — settled in code at 14 units, one line if he wants it tuned. It does not shrink as the window narrows, which is deliberate: a mark has to stay legible to be a mark.
- **`deploy/code/asedit-graph.allspeak` is behind the root copy** — the same hygiene item.
- **Four `verify-stale` sign-offs**, his by convention: the editor's declarations, its handler block, the Graph host's section, and the view's own. Until he clears them the analyser reports four warnings.
- **The source picture wants a browser, and this is the one thing a check cannot say:** that a browser renders an `<image>` whose `href` is an SVG data URL at all (plain `href`, SVG 2 — `xlink:href` is the fallback), that `xml:space="preserve"` keeps the indentation, and that the monospace advance is close enough to the eight units a column is assumed to be. Decoding the URL and checking the document is well formed is as far as a headless check reaches.
- **The gestures are one section of about 490 lines** — the wheel, the pan, the bars, the redraw plumbing and the window's limits. Their inline comments carry the detail; they would read better as five.
- **The pane is JS-only.** The Python runtime has no visualiser, and nothing here changes that. It is by design, not a backlog.

---

## Numbers to re-measure rather than carry — [note]

- **What a draw costs, which is the number that decides the pane's weight.** Measured on Graham's console, on a **24 KB recording**: 279, 131, 118, 125 ms — call it **120–280 ms per draw**, agreeing with the module's learned 4 ms/KB plus a fixed part. It scales with the recording, so a megabyte is seconds per gesture. **Measure the curve on a real recording before optimising anything** — and the standing rule is not to optimise before the functionality is finished.
- **The editor's load time is creeping.** Compile cost looks linear in the script: ~1.04 s in node for 3,102 lines / 9,361 tokens, up 35 ms for the flow key. If it wants addressing, the shape is deferred loads — the editor split so a pane's section is compiled when it is fetched.

---

## Working methods that earned their place

- **Never redirect stderr on a check whose stderr is its verdict.** Hours were lost running the harness `2>/dev/null`, which discarded the `Non-numeric value` report it was written to produce.
- **"Fail closed" means build the result in memory, assert, then write once.** A patch that wrote per-file left the sketch half-changed and broke the harness for a turn.
- **A check that reads a value mid-flight reports the half-finished state as the answer.**
- **A value computed before the pass that measures it silently uses the previous draw's number.** Both readings are plausible, so the fault never looks like a fault — the first render is "right" and every later one is not. This is what made the tiny-dots fault read as a cap problem for two rounds.
- **A check on a boundary must carry what the boundary carries** — the JSON string, the registered handler — and must set up what the real path sets up. Twice a green harness sat over a browser fault because the check entered the path where the reader cannot.
- **Measure the picture from a screenshot before reading the code.** Three passes were spent deriving a row pitch from eyeballed axis-label positions when a screenshot settled it; the instrument's own constants are checked first.
- **A log beats a theory.** Both faults diagnosed by reading the runtime were wrong; both found by a log or a harness were right.

## Performance of the draw — 2026-10-05, **measured, and the frame moved**

**Measured** (Graham's own traces, one draw each, via `PLOTVIEW_ONEDRAW=1 node tools/plotview-check.js <trace>`
— a mode added to the harness for this, because its usual run draws the picture ~50 times and a 472KB trace
never finishes): `parser-main` 157KB → 362ms for two load-time draws; `parser` 472KB → 1590ms for two (best of
three: 1817/1615/1590, so a shared machine is worth 15% either way and the pane's own `millis_per_kb` inherits
that). **So one draw is ~0.8s — and that is not what makes it unusable.** What does is that **every pan and zoom runs a whole
`Draw`**: `VizPan` → `VizRedraw` → `VizRequest` → `Draw`, which rebuilds rules, marks, flow and the source
picture each time, the `viewBox` being the only window-independent part. `VizRequest` coalesces, so a drag gives
about one and a half updates a second.

**The fix is a split, not a rewrite**: `Draw` becomes "build the picture" (once per run) and "apply the window"
(`viewBox` + axis labels + bars, all cheap). What forces the rebuild is the *window tests* that drop off-screen
marks (`VizOutside`), rules (the `VizMinLine` loop) and source lines — delete them, let the nested `<svg>` clip
as the module's own prose already says it does, and a pan costs a `viewBox` change.

**What was done instead this turn**, because it is what Graham asked for: a corner readout — the estimate before
the drawing, the cost after — in `asedit-graph.allspeak`. It **cannot tick**, and that is a consequence rather
than a limitation to work around: the pane runs on the browser's thread, so the notice is read at all only because
`VizBusyNotice` sets it on a `div` of the *panel* and then `wait 20 millis` (the runtime's `wait` is a
`setTimeout` in `Browser.js`) hands the thread back for a frame — before the caller starts its clock. A ticking
counter needs the sliced draw, i.e. the same work as the split above.

**Two faults found by building it — one real, one mine.** The real one: the readout was first written *inside*
`Draw`, and because a drawing returns to its caller at each yield, the caller's clock stopped before the work had
started. It read 30ms for a 472KB trace and `DrawMillis` was never written. The clock now starts after the
notice's `wait`, in the host. **My own: I concluded from that that a drawing is atomic, and it is not** — `Draw`
gives the browser a turn every hundred marks on purpose ("without this the page's thread is held for the whole
pass — tens of seconds on a big recording"). The 50-second wall clock that seemed to prove the compounding was my
`PLOTVIEW_ONEDRAW` guard firing at a settled snapshot the harness's own escape had already distorted. A claim in
this file's first draft, and the same one in `DIFF.md`, has been corrected. What stands from it: the notice is a
`div` on the panel, and the whole readout is host-half.

**The breathing is the hook for a ticking counter.** `Draw` already slices itself every hundred marks, so the
machinery for a counter that updates during a drawing is there; the slice is simply too coarse (a hundred marks is
tens of milliseconds on a big run) to count seconds with. If Graham wants the old `wait 1 millis`/counter, that is
the loop to hang it on — but it is a change to the drawing, and the split above is the same work done properly.

The rest of what was established earlier still stands:

- **Already deferred**: `VizRequest` remembers a request arriving during a draw (so a burst of notches costs one
  draw more, landing on the latest); the window is a `viewBox`, so a pan should not rebuild the picture; and the
  pane measures its own draws into a `millis_per_kb` calibration, alerting above 5000ms.
- **Not deferred**: everything inside one `Draw` — rules, marks, flow, source picture, labels, bars.
- **The pane's own calibration route is still dead in the harness** (`plotview-check.js` has no `rest` stub, so
  `VizPredict` stands down and `VizRemember` never writes). Not needed for the numbers above — `PLOTVIEW_ONEDRAW`
  times the load-time draws directly, and the view's own `DrawMillis` is written in the *host* half the harness
  does not run — but worth the five lines if the estimate itself ever needs checking outside a browser.
- Still open, and cheaper than the split: **draw marks at screen resolution** (at a fitted 472KB run the marks
  are a fraction of a unit apart and fourteen wide, so most of that work is invisible overdraw).

## The window clips a row, so a dot's visit is not the line's total — 2026-10-05

Graham reported the status "consistently under-reporting": the rightmost dot on a row said `line 254 visit 23 of
44`. Measured, and **the pane is right**: it drops marks outside the window (and the hit test skips the same ones,
by design), so at a fitted window the rightmost dot is the line's last visit (`31/31` on a 31-arrival row, and
the harness's own row check reads `visit 2` and `visit 4 ... both of 4`), while on a mid-zoom window the same row's
drawn dots begin at visit 12 — the earlier arrivals are off the plot. The two numbers answer different questions:
the visit is the dot's, the total is the line's across the whole recording.

Open question for Graham: whether the total should be qualified when the row is clipped (a count of arrivals in
view), or left as the recording's fact. Not changed — the evidence went first.

## Owed — [mine, queued]

- **The alert panel's pane half has no headless check.** The editor's half is asserted by `asedit-modes-check` (the three elements, the panel hidden, `ShowAlert` showing the message, `HideAlert` putting it away), but the pane's half — the armed ticker, the one-second delay before the panel goes up, the sentence `VizAlertSay` composes and the four-second finish — lives in the module's *plumbing*, which `plotview-check` cuts away, and `asedit-modes-check` cannot reach because it dies on `VizBusy` first (see below). It was measured **in a browser** instead (a headless chromium against the dev server, polling the panel: `Working - about 58 seconds - 7 s so far …` → `drew in 4.6 s.` → gone), which is a measurement rather than a check. A headless harness for the pane's host half would close it — and would also close the item below, since the same cut is what hides `VizBusyDone`.
- **The sidebar's bar has no check.** It now shows only the `@show` values, and nothing asserts that its values
  survive the move or that an empty bar is left when a mark asked to watch nothing. `plotview-check` covers the
  pane's new line; the sidebar has no harness of its own.
- **The pane's mark line is English-only** (`line ...   visit ... of ...`), as the sidebar's wording was before it
  moved — the editor's string table has the flow words but not these. It moved the gap rather than widening it.

- **Half the corner readout is code the pane's harness never runs.** `VizBusyNotice` is called from `Draw`, which
  `plotview-check` runs, so the notice is checked there; `VizBusyDone` is called from `VizDrawRun` in the module's
  *host* half, above the harness's `viewStart` cut, and only `asedit-check` (which runs the module whole) compiles
  it. What "drew in X.Y s" says is therefore unasserted — the whole-and-tenth assembly is the part worth a check,
  since the language has no fractions and the obvious `DrawMillis / 1000` gives `0 s` for a 700ms drawing.

## The split, taken 2026-10-05 — first slice done, the rest named

Graham: "Yes, I'd like you to take the split." The measurement that justified it, with the view's own clock
(`DrawMillis`, written by every drawing at its own two ends — the harness's wall clock is dominated by its own
settling): `parser-main`'s 46 gestures **166 694 ms → 90 735 ms**, median **4107 → 1873 ms**; small trace's
dearest gesture **396 → 160 ms**; and on the small trace the drawn picture is **byte-identical** (`PLOTVIEW=`
runs the old copy against the same trace).

**Done**: the parts before "pass one" — the extent, the rule set, the mark size — are built once per *picture*
(`VizPictureNew`, read at the top of the pass because the fit that decides it comes later and cannot be asked
yet) instead of once per *draw*. Two findings fell out: **`wait N millis` costs about four times N** (`Browser.js`
polls in 16 ms steps: `wait 20 millis` measures 84 ms), so the pass's breathing was ~1.7 s of every big gesture;
and **`VizRuledLines` was initialised in the per-draw block** while the pass that fills it ran per draw, which is
why it had to move into the gated part.

**Four harness checks were failing on `parser-main` before this and pass now** (transfer ends not on a rule; a
rule Infinity units from its text; a tick 143 units off its row; a two-modifier notch that changed the picture).
They were one fault four ways — the old, slow gestures outlasted the harness's own phase-advance timeout, so the
picture was mid-draw when the snapshot was taken. 33 OK/14 FAIL → **37 OK/10 FAIL**, no new failures. The
standard trace is unchanged at 51 OK with the same two known window expectations.

**The rest of the split**: the marks and the flow are still placed by `VizPlaceX`/`VizPlaceY`, which fold the
*window* into the coordinates, so a gesture still walks every event to move them. The module's own prose says the
intended design — `VizPane`'s `viewBox` is "the whole of the zoom and the pan … the picture itself is drawn once
when the run is opened", and "no coordinate below has to" know about the window. Placing marks/flow/rules in
document units and letting that `viewBox` zoom would make a pan one attribute. It touches every coordinate, the
axis labels and the clipping, so it wants its own pass with the same `PLOTVIEW=` before/after diff.

## The markers DO bound a recording — 2026-10-05, and the bug is fixed

**Graham asked why his recording was the same size however he gated the markers.** It was a bug, not a design:
Python's `@viz stop` never closed its window. In `Recorder.tick`, `if marker == 'stop': self.stop()` sat *below*
`if pc not in window['anchors']: … return` — and a marker line is not an anchor (it compiles to an attribute
entry, which `window['anchors']` has no key for), so every attribute-form stop fell through the early return and
the only things that closed a window were the next `viz start` and the end of the run. **This is the bug noted at
line 146 above: JavaScript was fixed on 2026-10-04 (`23a9b30`), Python was not.** It is invisible in a
single-window recording, which is why it survived — and Graham hit it the first time he gated a capture.

**Fixed 2026-10-05**: the check moved above the anchor test and above the count, exactly as JavaScript's was,
which also settles the ordering the 146 note records (JavaScript closes the window *before* counting the marker;
Python counted it). Measured on `parser.allspeak` through the editor's own path (`allspeak --record=…`), markers
gated to the first formula:

| runtime | bytes | windows | arrivals |
|---|---|---|---|
| installed (before) | 460 409 | 1 | **742** |
| repo (after) | **25 792** | 1 | **39** |

**What this means for the plan, and it is a change of plan.** "Restrict the capture range" is not something the
pane has to do at all for a *new* run: gating `viz start` / `viz stop` in the script now bounds the recording,
which is what Graham expected when he first asked. The clip we discussed is still wanted — it is the *post-hoc*
version, for a recording already made — but it is no longer the only lever, and the preview/overview work drops
down the list behind it.

**Two mistakes of mine, recorded because both were avoidable.** First, I measured the *arrival count* on a trace
written by the wrong path and concluded the markers only *named* a region; then I wrote that conclusion into the
pane's alert, both plugins' docstrings and this file — documenting a bug as the design, which is the opposite of
this project's rule that a symptom in a log line is evidence. Second, the bug was already written down at line
146 above, in this file, before I started. The revert is in the same commit as the fix.

**Unverified**: the JavaScript recorder is the twin and its behaviour was already right, but the measurement
above is the Python CLI path — the one the editor uses. The fix needs a **release** to reach a user, then the
reverted messages need a deploy.

## The clip: built, checked, and in the pane — 2026-10-06

**It is in, and the check that withdrew it was the thing that was wrong.** `VizClip` takes the range from the window and asks for a draw; `VizUnclip` clears it; the range joins the re-fit key at both places that decide a picture, so a clip re-measures the extent, the rule set, the busiest line and the fit rather than staying fitted to the part that was cut away; and the status line leads with the notice. The pane filters `VizEvents` where the recording is parsed, so pass one, the marks, the rules, `visit N of T` and the hit test all read the same kept set — which is what makes the notice a fact rather than a label.

**What was measured, 2026-10-06.** `asedit-check asedit-graph.allspeak` compiles (1380 commands, 284 symbols); `asdoc-check` 0 errors; `plotview-check` on the Python recording of `tools/trace-run.allspeak` is **56 OK / 2 FAIL**, the two FAILs being the same two known window expectations the file carried before the change. **And the unclipped report is byte-identical to the previous pane's**, on that trace and on the JS one (`PLOTVIEW=` diff: 51 OK / 2 FAIL either side, no line differing) — the strongest statement available that the step origin added below changed nothing when there is no clip. Five new checks: fewer marks than the whole recording, the notice's range and denominator read against the window and the trace, no rule for a line the recording does not name, the unclip restoring the fit byte for byte, and the notice gone.

**Two things the second attempt had to find out, and neither was in the prompt.**

1. **A clip cannot reduce the marks *in view* — only the marks of the whole recording.** A mark outside the window is not drawn, so clipping to the window removes exactly the records the picture was already leaving out: the drawn picture is the same, and what the clip buys is the *work* it no longer does plus the reading (the ramp rescales to the range's busiest line — the fixture's hottest band goes 1 mark → 2 — and `visit N of T` counts the range). The prompt's "assert fewer marks", posed against the phase before the clip, is unachievable and reads `4 then 4`; posed against the **fit**, where the window is the whole run, it is `4 against 8` and is the claim worth making. This is the same fault as the one that cost the evening, one level down: the question, not the code.
2. **The range had to join the *fit*, and the pane's steps axis had to acquire an origin.** The fit began at `put 0 into VizViewX0`, so a refit after a clip would put the picture back at the recording's start and show the cut-away part blank. The run's first step is now a value — `VizMinSteps`, 0 unclipped and the clip's own start when clipped — with its width in `VizSpanSteps`, and the fit, `VizClamp`, the steps bar and the handle drag read those instead of a hard 0. Every one of them reduces to exactly what it was when `VizMinSteps` is 0, which is why the unclipped report is byte-identical.

## The clip bar: the control, and why it is a bar rather than a button — 2026-10-06, later

**Graham's choice, on seeing the clip with no control to drive it: the bar, and the reason he gave is what settled it.** *"I favour 3 [the clip bar] because it avoids the need to zoom (the thing that takes most time after the initial draw)."* That is a better argument than the one in the work order, which had the bar as a third way and the entries as the thing to build on: **the zoom is the expensive gesture**, so a control that *marks* a range costs one drawing where reaching the same range by wheel and pan takes five or six. So the bar is the control, and everything below follows from that.

**What it is.** A strip in the pane's own foot — between the step numbers on their baseline at 670 and the status line at 711, the one free band — with a rail, a band between the markers that *is* the range, and two draggable markers. The pane's idiom, not a dom surface: an arithmetic hit test on the pointer (`VizHandleAt`) and a drag of its own (`VizClipMove`), the same three events every other gesture uses.

**Three decisions worth stating, because each has a reason and a later change could quietly take it away.**

1. **The bar is the *recording's* steps, not the picture's.** `VizRunFrom`/`VizRunTo` are measured from the events as they arrive (`VizRunExtent`), before the filter — because pass one over a clipped recording has measured the *range*, and a bar whose axis shrank with the range could never be dragged back out. It is also why a clip survives a re-record: the range is in steps and the steps are the run's.
2. **The markers move as attributes and the clip is applied on the *drop*** (`VizRelease`), never while the drag is in flight. Applying it live would put the expensive cost straight back — which is the whole point of the bar — and this is the one claim about the control a later change could silently lose, so the harness asserts it directly: the picture between the grab and the drop is byte-identical while the marker has visibly moved.
3. **A range that *is* the recording is no range.** `VizClipApply` reads both ends back from where the markers are *drawn* — the one place that knows what the reader chose, so there is no second answer to disagree with the picture — and if the pair is the run's own ends it clears the clip outright. That is what makes dragging a marker home the same gesture as `VizUnclip`. The minimum span is the pane's own floor of four steps, **but never more than the recording is**: on a three-step run a four-step floor fights the run's own bounds, and the first version of this drew a marker past the end of the bar for exactly that reason.

**Measured, 2026-10-06.** `asedit-check asedit-graph.allspeak` compiles (1554 commands, 304 symbols), `asdoc-check` 0 errors, and `plotview-check` on the Python recording of `tools/trace-run.allspeak` is **63 OK / 2 FAIL** — the same two known window expectations as before, with the unclipped report still byte-identical to the pane that had no bar at all. Twelve checks are new — five for the entries and seven for the bar — and all of them green:

- the marker drag moves the marker it was given and leaves the other where it was;
- **the picture is not redrawn while the marker moves** — the drag costs no drawing;
- the notice agrees with the markers, read back through the bar's own mapping (`steps 0-9` at x=60 and x=390 of the recording's 17 records);
- the clip the bar applied really is narrower (4 marks against the whole recording's 8);
- dragging the marker home clears the clip, with the picture byte-for-byte the fit again;
- and the marker comes home to the end of the bar (x=940).

**One check is posed as a `..:` rather than a claim, and it is the harness's own idiom doing its job.** "The clipped picture has fewer marks than the fit" is only a question where the picture and the recording share an axis, which they do on a recording that opens **one** `viz` window — what the Python recorder writes. On the JS recording of the same script (three windows, the extent collapsed by the standing fault above) the fit is degenerate and the clip can draw *more* marks than it, so the check says so instead of failing: measured, the JS trace is 55 OK / 5 FAIL, the five being the ones it carried before this change, and the note it prints names that fault with numbers — "the picture's steps axis (3) is not the recording's (21)".

**A fault of mine, and where it was.** The first harness version of the bar check *looked* like a pane fault — the clip never cleared — and it was the harness: `dragClipMarker` had lost its `entry('VizRelease')` line, so the drag happened and the drop never did. Four instrumented runs were spent before printing from *inside* the pane settled it (`VizRelease` ran once, not twice). The lesson is the project's own: the harness is a program too, and a phase that *does* nothing and a phase that *fails* look identical from the check's side.

**Two standing faults this pass ran into, both pre-existing and neither introduced by the clip — reported, not fixed.**

- **A later `window` record overwrites `VizMaxSteps`.** Pass one does `put property `steps` of VizArgs into VizMaxSteps` for every `window` record, so on a recording that opens more than one window the extent collapses to the *last* window's step count (anchors can only raise it, and they have already been seen). Measured: the JS recording of `tools/trace-run.allspeak` has three windows and fits to `steps -1-2`, where the Python host's single-window recording of the same script is the well-behaved 24-step one the harness's expectations are tuned to. `VizMaxSteps` should be a maximum, not an assignment — a one-line fix, but it changes the unclipped picture for any multi-window trace, so it wants its own measurement.
- **`steps` is per window, not per recording.** So a clip range is approximate on a multi-window recording: the steps of one window land on top of another's. That is the pane's existing step model rather than anything the clip introduced, but a clip magnifies it, and it is the reason the harness is run on the *Python* recording.

## What the first look at a big recording found — 2026-10-06, later still

**Graham's report from a real 435KB run, and what each item turned out to be.** Six things: one is a property of the runtime that explains the whole of the speed problem, one is my own defect that made the clip cost more than it saved, and four are the pane's reading of itself.

**1. The clip made nothing faster — it was making things *slower*.** Measured on his own recording (`~/dev/dojo/chemical/parser.allspeak.viz.json`, 435KB, 2,273 anchor/transfer records), two load-time drawings: **33.1 s unclipped, 83.0 s with a clip that kept nearly everything**. Two causes, and both had to go:

- **`json add` re-parses and re-stringifies the array it appends to** (`js/allspeak/JSON.js`, case `add`), so building a filtered copy one record at a time is quadratic — 13.5 s for 2,273 records, measured in isolation.
- **And the kept list was rebuilt on *every draw*.** This is the one that made a clipped draw slower than an unclipped one: the clip paid its own construction cost per gesture and never got to spend what it saved. It is now built when the *clip* changes and reused while the range stands (`VizKeptKey`).

**1b. My own A/B of the clip's benefit was mis-posed, and Graham's use of it on the real recording is the better evidence — read the two together.** He reports that *"the responsiveness of the graph increases the narrower the range chosen"*, and that the bulk of the work will be done on restricted parts of the timeline *"where the performance is generally acceptable"*; he also rates the wash *"just perfect"*. My measurement said the opposite — 110.4 s unclipped against 113.0 s clipped over the same 52 phases, and 3,602 ms against 3,610 ms at the fit — **and mine is the one to distrust**, for two reasons visible in it: the harness's own phase list **unclips partway through** ("unclipped, so the whole recording is back" is one of its phases, so the late and dearest phases are unclipped in both runs), and the fixture is 157 KB, where a walk of 522 records is cheap enough to hide inside the constant per-draw work. So the honest position is not *"the clip does not help"* but **"we do not know, and the person using it on a 435 KB recording says it does"**.

**The measurement that would settle it**, and the one to take before anything is built on the premise: **a section-timing pass inside `Draw`** — the instrument that found the 435 KB trace's 37 s in a single run. If the residual cost is per-*record* work, narrowing pays and pays more each time; if it is per-*line* work (the source picture and its labels, ~600 lines, which no clip can reduce), then narrowing-only buys the *clip operation* and not the rendering, and the expectation should be set accordingly.

**1d. And the question 1b left open is now answered, by section timing: a drawing *is* the record walks.** Measured 2026-10-06 on Graham's own 435 KB recording (2,273 anchor/transfer records), with the yields temporarily removed so that a whole drawing runs in one pass and every section can be stamped:

| section | first drawing | second (pass one skipped) |
|---|---|---|
| parse (cached, so 12 ms the second time) | 15 ms | 12 ms |
| the built-once element block | 36 ms | — |
| **pass one** | **34.2 s** | — |
| **the mark loop** | **35.8 s** | **35.4 s** |
| the source picture | 4 ms | 6 ms |
| the labels, bars and clip bar | 0 ms | 1 ms |
| **total** | **70.0 s** | **35.4 s** |

**So ~15 ms per record in each of the two loops, and about fifty milliseconds for everything else in the pane put together** — the source picture, the labels, the axis and the clip bar are visible in the noise. That is the `element N of` access cost of §2, twice: pass one walks the recording and so does the mark loop, and between them they are the whole of a drawing.

**What follows, and it is the answer to the trade Graham is weighing**: the cost is *quadratic in the number of records walked* — so narrowing pays, and pays by the square. A clip keeping a tenth of the records should cost about a hundredth of the drawing, and each successive narrowing multiplies that again. **His experience is therefore the right one and my A/B was the wrong instrument** — see §1e for why it read as parity.

**1d-bis. And the clip's benefit is measured at last — the instrument was the thing at fault, twice over.** With `PLOTVIEW_CLIP` fixed (see §1e), two drawings of the same recording, each timed by the pane's own clock, and then the same drawing taken again *after* a clip:

| | whole recording | a redraw of it, clipped |
|---|---|---|
| the 157 KB trace, clipped to steps 0-44 of 441 | **1816 ms** | **23 ms** — 79× |
| Graham's 435 KB trace, clipped to steps 0-117 of 1400 | **35 764 ms** | **1 248 ms** — 29× |

So the clip pays, by roughly the square of the fraction kept, exactly as the section table in §1d says it must — and Graham's own reading of it on the real recording (*"the responsiveness of the graph increases the narrower the range chosen"*) is confirmed by measurement. **The first clip costs what a drawing costs** (37.7 s on his trace: the filter walks the whole recording once, ~15 ms a record, and then the picture is drawn), which is *precisely* the cost his narrowing-only proposal removes — after it, the second clip walks only what the first kept.

**1e. And why `PLOTVIEW_CLIP` measured nothing, which is a trap that has now been closed.** The instrument (`tools/plotview-check.js`) sets `VizClipFrom`/`VizClipTo` *before* the script's load-time drawings — and the pane, quite deliberately, **clears the clip when the recording changes** (`Draw`: "a clip is a range over *this* recording, so a new recording clears it"). On the first drawing `VizTrace` is not `VizLastTrace`, so the clip is wiped before it can be used: **both halves of that A/B were unclipped runs**, which is why they agreed to within noise. **Fixed 2026-10-06**: the instrument now clips *after* the load-time drawings — it sets the window through the symbol record and calls the pane's own `VizClip`, which is what a reader's gesture calls — and it stands the `wait` down under `PLOTVIEW_ONEDRAW` so that a drawing finishes in one pass and its own clock can be read (`Wait` returns before the resume otherwise, which is why the mode's figure covered only the beginning of a drawing). Both are in `tools/plotview-check.js` with the reasons at the code. **The shape of the mistake is the original one**: the clip was "not working" once before because the check was mis-posed rather than the code, and this was the same error in the instrument — twice, in the same mode.

**1c-bis. Attempted 2026-10-07, and *withdrawn unverified* — which is the state it is in.** The change itself is small and it was written: the filter walks the *current* set rather than the recording (`VizFeed`), `VizClipKeep` leaves its result as the set the next clip reads (`VizNarrow`/`VizNarrowOn`), `VizUnclip` becomes **Reset** (clearing the narrowing as well as the range), the notice names what has been cut as well as what is in view, and a **Reset control** is drawn above the end of the bar and hit-tested like every other control.

**What was observed working**: the pane did narrow *cumulatively* — after a second clip and a drag that cleared the range, the notice read `narrowed to 7 of 8 records` and the picture was of the smaller set — and **nothing regressed**: 56 OK / 2 FAIL, the two being the known window expectations and no older check moving.

**Two faults in it, and the second is why it was withdrawn.** The notice's *total* counted anchors only (8 where the recording has 17) because the increment landed in one of the two loops that name a transfer. And **the Reset control could not be exercised by the harness at all**: a press at the control's own rectangle appeared to hit a control that was not there — the flag read as 0 in the phases after it, while the picture *was* still the narrowed set — so the hit test, the phase, or the flag's lifecycle is wrong and I did not find out which. **The Reset is the only way back from a narrowing**, and an unverified only-way-back is exactly what this project's history says not to ship: the first clip attempt was withdrawn for the same reason (its check was the thing at fault, but nobody knew that at the time).

**So it goes back on the list, and the order to do it in is the lesson**: build the **Reset control and prove it first**, on its own, before the filter that needs it — the same "prove the entry before building on it" the clip itself followed. The pane and the harness are at the committed state (`c9c1304`) and **the instrument fix is kept**, so when it is rebuilt the 29× it buys is already measurable.

**1c. Graham's proposal, 2026-10-06: clipping should only ever narrow.** The bar keeps its markers at the *recording's* extent, so every clip is a range of the *whole* recording and each one re-walks all of it — slow on a large trace. He would rather the kept section *replace* the original, so each successive clip filters a smaller set and gets faster, with a **reset** above the end of the bar to restore the full recording. His reading of the trade is that losing the ability to widen without a reset is worth the speed. **Comment given, not actioned** — the argument is in the reply and the reply is in `conversation/038`; the substance is that it is *less* work than it looks (`VizTrace` is already retained, so a reset is one re-parse and `VizUnclip` already restores the whole recording), that it buys the filter's re-walk rather than necessarily the rendering, and that it brings two bonuses with it: the guides and the wash would always align (the picture *is* the set, so `VizClipWide` and the harness's `..:` guard both go), and the notice would have to state what has been cut as well as what is kept.

**2. Under both of those sits a cost that is real whether or not a clip is on: reading one record costs a parse of the whole recording.** `Core.js`'s `element` (and `item`) case does `JSON.parse(<the whole array>)[N]`, then `JSON.stringify` of the element, because a json variable is held as *text* — **~15 ms per access** on his trace, so one loop over 2,300 records is ~35 s, and the pane walks the recording several times per drawing. That is his `Drew in 33.6 s`, exactly. It is in `AGENTS.md`'s trap list now, and the consequence is worth stating plainly: **the number of records *walked* is the cost that matters, not the number of marks drawn** — so the clip is not a convenience but the only lever the language offers, and no amount of drawing fewer marks makes an unclipped gesture quick. Recorded as a language proposal in `TODO-language.md`: memoising the parse of a json variable's text would fix every loop in the language at once, in both runtimes.

**The instrument this needed.** `tools/plotview-check.js` gained **`PLOTVIEW_CLIP=<from>-<to>`** — the phases cannot finish on a recording that size, so clipping it *before* the load-time drawings is the only way to ask what a clipped draw costs there. It writes the two variables the pane's own `VizClip` writes, through the symbol record, because the host half of the compiled script sits above the view's declarations and cannot name them.

**3. The readout was landing over the editor's toolbar.** His words: *"some text in the top left corner of the window, overlaying the icon and Open button; it seems to read 'Drew in 33.6 S'"*. It was a `div` created in the pane's host with `position:absolute;left:10px;top:8px` — and an absolutely positioned element goes to the nearest *positioned* ancestor, which the host is not, so it went to the window. It is an `svgtext` **in the drawing** now, on the free strip below the plot, and it says **`Working`** with the estimate in words, in an orange weight, before the cost. It cannot escape the pane, and it sits on the row the clip bar used to occupy. A pane literal, so English like the rest of them.

**4. The clip notice ran into the flow key.** It led the status line, and that row is shared with the legend, so a long notice pushed into the words. The notice has its own line now — on the bar's row above the plot, which is where it belongs anyway: the clip's instruments above, the working readout below.

**5. The bar wanted to be above the picture, with the range visible on it.** His reading, and the right one: with the bar below the plot nothing connected a marker to the picture it was choosing from. It is above the plot now, and its markers carry **guides down the full height of the plot** and a **wash over the parts of the picture the range leaves out** — both moved by attribute writes, so a drag shows where the marker is *and* what it is about to cut without a single drawing. They are drawn only while the plot's x axis is the recording's (at the fit, which is where a reader chooses one); zoom in or clip and they are hidden rather than pointing at a step the picture is not showing. One subroutine, `VizClipEdge`, so the draw and the drag cannot disagree about where the range is.

**6. The ETA popup told the reader to edit the script.** *"Better would be 'You may need to narrow the range viewed'"* — and it was worse than a wording slip: it sent them to narrow `viz start`/`viz stop`, which means editing and re-running, and answers a different question. It now says: *You may need to narrow the range viewed: drag the two markers on the clip bar above the picture to the part you want to watch.*

**And a fault of mine that the harness had been hiding.** Dragging a marker home did not clear the clip on a 441-step recording, while it happened to work on the 24-step fixture the harness uses: the drag's x round-trips through pixels and truncates, so the marker stopped a step or two short and `VizClipApply` then saw a range that was not quite the recording. A marker now **snaps** to an end within one floor's width — what every scrollbar does, for the same reason — and the harness reads the guides, the wash, and the notice's own line.

## The clip's interaction, settled 2026-10-07 — **[built the same day, but one control is unproven]**

**Three things he asked for after using it, 2026-10-07, all in.** (1) **The recording is not copied for the history** — his own reading, and right: the history is a list of *ranges*, and the whole recording is read from the parse (`VizParsed`, already keyed by the recording's text) at the moment a cut needs it. A cut filters *that*, so a second cut narrows a first rather than replacing it, and an undo re-filters to rebuild any state the history names. No second copy of the records is held. (2) **A cut now keeps the vertical zoom and the line range** — the steps are what a cut changed, so the horizontal window is fitted to the new range while the lines stay where the reader put them; giving the whole recording back still fits both, which is what `reset` means. The harness asserts both halves: `[1,209]` after the cut against the fit's `[1,261]`, and the fit's again after the unclip. (3) **The status line carries the number of records in the current set**, at his ask, "to help users get a feel for why the program gets sluggish" — every walk in the drawing is proportional to it.

**And the fault Graham found by using it, 2026-10-07: the clip was applied and then thrown away.** The load block writes the *whole* recording's events into `VizEvents` on **every** draw, and the line that put the *kept* set back sat inside the filter's cache test — so every draw after a cut, which skips the filter because the key has not changed, went on walking the full recording. **The clip narrowed the axis and nothing else.** He spotted it from the outside — "the full array seems to be hanging about like an unwelcome guest" — and a probe confirmed it exactly: on his recording, clipped to 96 of 533 records, the marks walked `522 533 533 96 533` before the fix and `522 522 522 96 96` after. **A redraw of the clipped picture went from 1652 ms to 78 ms.** The lesson, and it is the one this file keeps teaching: the swap belonged *outside* the cache test, because the line above the clip block destroys the set every draw — a cache key that guards an *action* is not the same as one that guards a *rebuild*.

**What is in the pane.** The state is a **list of kept step ranges** (`VizKeepFrom`/`VizKeepTo`/`VizKeepN`), not one range, which is what makes both of Graham's points expressible: `**←--- ---→**` intersects the list with the window between the markers, and `**---→ ←---**` subtracts the window, splitting a range in two — and an empty list is the whole recording, which is what `reset` restores. One operation, `VizCut`, with `VizKeepTail` saying which. The bar's axis is the **working set's** own extent, so a cut brings both markers home to the ends of what is now on screen — his point 3, and the fix for his point 4 with it, since the guides and the washes are placed in the **picture's** mapping now and so are drawn at any zoom and with a cut on. **A drag only selects**; a press is what commits; and the three controls are drawn from the same variables the hit test matches, so `tools/plotview-check.js` presses **the rectangle read out of the snapshot**.

**And the history exists: `undo` works.** Each cut saves the list it replaced as one *string* (`0-4;12-20`), so the stack is a few bytes per cut however big the recording is, and an undo is a `split` and a draw rather than a re-filter — which is why it is instant. `VizUndo` is driven in the harness and the claim passes byte for byte. **A redo is five lines** (`VizHistAt` is kept beside `VizHistN` for exactly that) and there is no control for either yet.

**Harness: 69 OK, and every claim of this change passes** — the drop committing nothing, the window control committing what the markers marked (`kept the window: 5 of 17 records`), both markers coming home, the guides still drawn with a clip on, `reset`, and undo. Three failures: the two known window expectations, and **"a handle drag crossed axes: lines held, steps held", which is new and not yet diagnosed** — it appeared with the change that made the *filter run on every draw* (so the pane's set no longer carries the metadata `window` records, and the axis is one step narrower), and whether that moved the phase's premise or leaked an axis has not been established. That is the first thing to look at next, before the control below.

**And the speed, which is what he asked for three times and what his screenshots finally pinned: a cut now reads the set on screen.** The fault was a single line — the load block's `put json of \`[]\` into VizEvents` ran on every draw and emptied the kept set before the clip block read it, so every cut walked the whole recording (11.3 s at 2,273 records, at 284 and at 53 alike; a pan or a zoom is cheap because its pass one is *gated*, which is why only clipping was slow). Guarded now; a cut filters `VizEvents` and only giving the whole recording back and an undo read the recording. On his `parser-main`: first cut 1798 ms, a redraw 69 ms, **a second cut 531 ms**. The line, the screencaps and the probe are in `TODO-language.md` and in `AGENTS.md`'s trap list.

**Left undone, and stated rather than asserted:**

1. **The `---→ ←---` control is built and not driven by the harness.** The pane cuts correctly for it — `VizCut` with `VizKeepTail` 2 rewrites the list, and its own `log` shows the call (`tail=2 N=1`) — but a phase sequence of *drag, then press* could not be made to land twice in one run: the second press reads the notice's `select steps …` and never reaches the control. That is a phase-ordering fault in `tools/plotview-check.js` and not a fault in the pane, and it is a stated gap (`..:` is this harness's own shape for one) rather than an assertion that cannot fail.
2. **~~The tooltips.~~ Done 2026-10-07, this session.** `on hover VizHost`, `VizPointerUnits` and `VizControlAt` — the hit test shared with the press — with `VizTipBox`/`VizTip` as the surface. `plotview-check` drives it through the view's own entry point and asserts the three sets of words, the clearing on a leave, the tip's place, and that **a hover draws nothing**. The words are `Keep the window: the part between the markers` / `Keep the outside: cut the part between the markers` / `Reset: show the whole recording again` — the design's `keep the window` / `keep the outside` / `reset`, said in full. **The sidebar's own rollover is what is left of the item**, and it is still owed.
3. **The empty-cut refusal** is in (`nothing left to keep — the whole recording stands`): subtracting a selection from a list it already covers would leave nothing, and an empty list means "the whole recording", so the pane would *widen* at a press — the one thing this control must never do. Worth a check of its own.


**Graham's account of the first real use, and what each part of it is.** Drawn after the expected long wait; then *"grab the left-hand clip marker and drag it partway to the right. The shade follows"* — the wash working; on release, a redraw *"still slow, but faster than before"*, with **the left marker staying where he left it where he expects it to return to the left edge**, *"as we're now seeing a new total range"*; then *"grab the right-hand marker and drag it left. No vertical line nor shade appears, but the clip goes ahead."*

**His points 3 and 4 are one design gap, and his expectation is the fix.** The bar is measured in the *recording's* steps (`Draw`: `if VizClipFrom is 0 and VizClipTo is 0 put VizMaxSteps into VizRunTo`, so it keeps the recording's extent once a clip is on) while the picture is measured in the *range's* (`VizMinSteps`/`VizSpanSteps`); the guides and the wash are drawn only while the two coincide (`if VizViewX0 is VizRunFrom and VizViewXW is VizRunTo put 1 into VizClipWide`). So after a cut they are parked and the markers stay in recording coordinates. **The fix is narrowing-only** (§1c-bis): the bar *is* the current range, the two axes are then always the same, `VizClipWide` and the harness's `..:` guard both go, and the markers return to the edges by themselves — which is what he expected to see.

**And the interaction he proposes is better than what is there**, because it removes a conflation: today a *drop* applies the clip, so a reader can never adjust a range without paying for a cut.

| gesture | meaning |
|---|---|
| drag either marker | **select** — no drawing at all; the guides follow and both shades move |
| the two shaded regions | **what a cut would remove** — the window between the markers is the selection |
| press `<>` (arrows facing away) | **keep the window** — the contiguous set between the markers becomes the run |
| press `><` (arrows facing together) | **remove the window** — and this is the operation he had not considered and wants for *"condensing very long loops"*: the kept set is then the two outer parts, **with a gap where the middle was**, which the picture shows honestly as a blank stretch because the steps are the run's own |
| press Reset, above the end of the bar | the whole recording back — the only way to widen, and there is no single-cut undo because the set a cut came from is gone |

**The controls want words, not just glyphs, and that is where the language answer lives.** `><` and `<>` are ambiguous without a key. A rollover tooltip is the neat answer, and **the event it needs now exists** — `on hover {element}` landed 2026-10-07 (`Browser.js`, all four packs, and `tools/hover-check.js`), with `the hover position` for the hit test and a `mouseleave` to carry the words away again. **So the controls can have their tooltips now**; the fallback the pane carries today — the words `keep` / `cut` drawn in the controls — is no longer the only option, and the click that each control takes is unaffected either way. There is still no Python counterpart, because there is no Python pointer event to hover with.

**The order to build it in, and the thing that defeated the last attempt.** The controls first and proved on their own — a press on each, driven by the harness reading **the rectangle the control was drawn at out of its snapshot**, never a coordinate typed into the test. The withdrawn attempt hard-coded the Reset's press position, and when it did not take I could not tell whether the hit test, the phase or the flag was wrong; driving the drawn box removes that whole class of doubt, and it is how the *markers* have been driven all along.
