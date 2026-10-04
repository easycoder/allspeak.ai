# The visualiser and the editor

The detail behind `TODO.md`'s viz row. Everything here is either a **binding decision** — checked against before adding anything — or **open work** with the smallest first step named. The dated reasoning that produced each of these lives in `git log -p -- TODO.md` (pre-2026-10-04) and in `conversation/`; it is deliberately not repeated here.

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

## Settled decisions

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

---

## Open work, in the order it was chosen

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

**The finding that changes the estimate: there is no rollover event in the runtime.** `on` accepts `change`, `click`, `key`, `leave`, `window resize`, `browser back`, `swipe`, `wheel`, `pick`, `resume`, `drag` and `drop` — and `on leave` is `beforeunload`, not a mouse leave. So a tooltip is **not a pane tweak; it is a new language event**, reaching Core/Browser, four language packs and the plugin contract, with a Python counterpart that has nothing to hover.

The display side: the svg plugin has no `title`/tooltip support and the arrows are one merged path, so the pane needs a hit test *and* a surface for the tip. Its foot already carries the status line, so the tooltip must be its own element.

**It shares its hit test with the sidebar**, which is why the two belong in one pass — sidebar first, tooltip on the same arithmetic.

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

Two numbers for his eye: the fill is `#d6d6d6`, which against the page is 12.36:1 where the dark grey was 1.45:1, and **a rule crossing a bar is 1.25:1** — the rules are `#eee`, so a leader crossing a bar was identical to it and is now only a shade clear. If reading a rule across the text matters, the bars want to come down to about `#7a8290` (the horizontal scrollbar's grey), which puts the rule at 2.05.

### Launching the project's app — built; the capture half open

`@app <page>` on a script, and `asedit.allspeak`'s **Launch** re-parses the buffer and hands the page name to `location new`. **The name is relative to where the editor is served from — the project root — so no path is assembled and no server route is added.** A script naming no app is told so and told the spelling; deleting the attribute stops the launch rather than leaving the last page standing.

**Still open:** arming a recorder for a launched app must happen before the app's own `viz start` runs, so it needs a bootstrap in the app's page or an injection before its scripts run. And whether the editor should *drive* the app rather than only launch it — which is what a pane would buy, and the window was chosen knowing it does not.

### The three routes for capturing a run, unchanged

1. **The editor records** (JS, in the editor's own page) — **built**. `edit.html` already loads the runtime and `plugins/asviz.js`, so nothing new is fetched, no server change is needed, and it works from a pack. The trace is written to `<script>.viz.json` through the existing `POST /write/`. *Caveat to state, not hide:* the script runs **in the editor's page**, so it can scribble on the editor's DOM, and it is the JS runtime's run. The guard makes a runaway harmless; the DOM sharing is the reason to consider a throwaway iframe, at the cost of twenty lines of page JS.
2. **The project's server records** (Python) — unbuilt. `server.allspeak` gains a route that runs the script under Python and writes `<script>.viz.json`. It needs the plugin beside the server (`use plugin Viz from ./as_viz.py`, so `as_viz.py` travels in the packs) and a route that calls the new command.
3. **The project records itself** — the most integrated and the least machinery for a JS project, and the one that answers a question the other two cannot: recording what an app *actually does*, rather than running the script instead of it.

---

## Smaller items, in any order

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
- **The status line keeps a pane's report after the pane is gone.** Leaving the Graph pane for Edit leaves `I don't understand 'dictionary' at line 46.` sitting beside the toolbar buttons, which reads as a live fault. It has three writers (a transient action, the auto-save, and the pane when it fetches a run) — assert the value it is built from, and clear it when the pane that set it is closed.
- **The ramp's bottom end:** with a band size of 1 a once-visited line lands in band 1, so a quiet run shows amber for its least-worked lines. One line to change (`take 1 from VizCount` before the division), and it moves every boundary; the legend makes either choice legible.
- **The two copies of `asedit.allspeak`** — hygiene, not a bug: nothing he runs reads the second one. The options are in `DIFF.md`; the recommendation is to have `deploy-sync` refresh `deploy/code/` from the root, so the local published copy cannot be stale *and* so `BUILD.md`'s claim that the `cp` step is enough becomes true.
- **The size of a mark** — settled in code at 14 units, one line if he wants it tuned. It does not shrink as the window narrows, which is deliberate: a mark has to stay legible to be a mark.
- **`deploy/code/asedit-graph.allspeak` is behind the root copy** — the same hygiene item.
- **Four `verify-stale` sign-offs**, his by convention: the editor's declarations, its handler block, the Graph host's section, and the view's own. Until he clears them the analyser reports four warnings.
- **The source picture wants a browser, and this is the one thing a check cannot say:** that a browser renders an `<image>` whose `href` is an SVG data URL at all (plain `href`, SVG 2 — `xlink:href` is the fallback), that `xml:space="preserve"` keeps the indentation, and that the monospace advance is close enough to the eight units a column is assumed to be. Decoding the URL and checking the document is well formed is as far as a headless check reaches.
- **The gestures are one section of about 490 lines** — the wheel, the pan, the bars, the redraw plumbing and the window's limits. Their inline comments carry the detail; they would read better as five.
- **The pane is JS-only.** The Python runtime has no visualiser, and nothing here changes that. It is by design, not a backlog.

---

## Numbers to re-measure rather than carry

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
