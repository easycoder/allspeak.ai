# AllSpeak — Language Enhancement TODO

Items identified during real project work. Each should be implemented in both JS and Python.

## Attributes landed — 2026-10-03

**What is now in.** `@` at the start of a token, outside a literal, is an attribute: the text runs to the end of the line or to a `!` comment, and it is carried into the compiled program with no runtime effect. A statement's attribute is an `attr` field on the command it compiles to; a line that compiles to no command of its own (an attribute-only line, or a label) gets an `attr` entry of its own, which the runtime steps over. Rules 11–14 of `spec/allspeak-language-contract.md`, `ATTR` in `spec/opcodes.json`.

**Where the design is decided and why.** Recognition lives in the **tokeniser**, not in the grammar — `js/allspeak/Main.js` `attributeText` + `tokeniseFile`, `allspeak-py/allspeak/as_program.py` `attribute_text` + `Program.tokenise` — so no keyword handler knows `@` exists and no condition parser can swallow the tail. The compiler holds the attribute for the length of one statement (`attrPending`/`attrStamped`, saved and restored because a `begin` compiles its whole body) and `addCommand` stamps the first command emitted. `!` ends an attribute. `tools/attr-check.js` drives both runtimes and is the place to read the claim.

**Open, and each is small.** (1) `@app` is still `!! @app` in a doc block, read by the editor's own buffer walk; moving it onto a bare `@` line is Graham's re-base, and the editor's Launch is the only reader to change. (2) Nothing highlights `@` in the editor or the CodeMirror mode. (3) Whether `tools/attr-check.js` joins the starter packs — it needs a full checkout, so a pack could never run it, which is the same position `guard-check.js` is in while being shipped. (4) `conformance/actuals-js-browser.json` is stale from April: all nine tests in it report a compile error, and it has not been regenerated since. (5) A **known divergence** the check has to accommodate, recorded in `conversation/conversation-017.md` and not introduced here: Python keeps the colon on a label's symbol name (`Main:`) and JS strips it (`Main`), and Python stamps no `opcode`.

## Next workstreams — Graham's list, 2026-10-02

Five workstreams named by Graham at the start of this session. Each entry says what exists **today, checked by running the tools rather than remembered**, what is missing, the smallest first step and the traps. A recommendation is at the end of the section.

### 1. Parity — what needs copying between the runtimes

**What is already in step.** The trace is one contract for both runtimes (`spec/viz-trace-format.md`, Draft 2) and both write it — `js/plugins/asviz.js` (`VIZ_TRACE_VERSION = 2`) and `allspeak-py/plugins/as_viz.py` (`TRACE_VERSION = 2`). The marker syntax `viz start/stop` is core in *both* (`Core.js` `Viz`; `as_core.py` `k_viz`/`r_viz`), and the shared framework `viz.allspeak` runs on both hosts.

**Measured, by running both hosts on the same instrumented script** (`tools/asviz-run.py --run tools/trace-run.allspeak` against `node tools/asviz-run.js --run tools/trace-run.allspeak`): the two reports agree except in the differences the spec already documents — command counts 25 against 23, the `steps` axis, and a label followed immediately by a marker counting as two arrivals in Python and one in JS. **Two divergences are not documented in the spec:**

- **`shape | … | exit-exit=0` (Python) against `exit-exit=1` (JS)**, and the same run's `Worker` anchor reading `exit=stop` against `exit=stop,exit`. **The cause is one command:** JS's `Compile.compile` appends a final `exit` to every program, and the last label's block runs into it. Python emits no such command. My reading is that the *model* should ignore a compiler-appended exit, since it is not a line the author wrote — but that is a decision, not an obvious fix.
- The two runs are otherwise line-for-line equal, which is worth knowing: the trace format is doing its job.

**The gaps that are real, in the direction each runs:**

- **Python → JS: the run guard.** `as_viz.py` bounds a run with a work *budget* (2 s) and a wall *ceiling* (20 s) and records `stopped: "work"|"wall"`; its comment says why — *"the editor is what usually asks for one and a script under review is not to be trusted with the editor's responsiveness"*. `asviz.js` has neither, and never writes the `stopped` field the spec documents. **Nothing needs this today. Item 4 makes it necessary.**
- **`asdoc-check.py` → both `.allspeak` analysers: the new rules.** The Python linter gained `code-outside-section`, `title-long`, `doc-after-code`, `meta-not-in-tail`, `symbol-unknown` and `redundant-giving` with fixtures; the two `.allspeak` variants still carry the older set, so the three analysers AGENTS.md calls interchangeable currently disagree.
- **Python → JS: a debugger.** `allspeak-py/allspeak/debugger/` is a working Qt debugger with a **watchlist** and a value display. JS has nothing. This is the ancestor of item 5's debug tab.
- **JS → Python: nothing.** The Graph pane is an editor feature and Python has no editor — that asymmetry is by design, not a backlog.

**For the record, on versions:** `js/allspeak/AllSpeak.js` line 1 still reads `2608191442` while `Browser.js` changed on 2026-10-02. The versioning policy says the runtime scheme "may remain implementation-specific", so this breaks no rule — but the string no longer dates the runtime, and AGENTS.md describes it as date-time.

### 2. The right-hand sidebar, tabbed, doc blocks first

**Done, first cut — 2026-10-02, and as a co-module.** Graham's call: "the sidebar is likely to get quite bulky, so can you look into doing it as a co-module, as is done for the asedit-graph script". It is `asedit-side.allspeak`, a sixth-of-the-pane module loaded on the first click on Graph beside the drawing. `asedit.json` now gives each module **its own element** — `se-graph-host` for the picture, `se-graph-side` for the panel — with `se-graph-area` as the flex row holding both, so neither module lays the other out and the pane's own geometry is untouched. The panel is a tab strip plus a body with a heading, the prose and a hint; `SideTab` is a *pool* (an AllSpeak element is a declared symbol), so **a tab is a name in `SideTabName` and a branch in `SideRender`** — the debug tab is those two things.

**What crosses, which is the shape the rest of this list inherits.** *Editor → sidebar*: a dict of two kinds, `run` (the path, and whether the pane is still on screen) and `block` (the clicked line, whether any block holds it, and the heading and prose if one does). *Pane → editor*: one dict, `{kind: "mark", line: N}`, on a press. **The editor owns the look-up** — which doc block holds a line is a question about the script's structure, and Blocks mode already answers it, so the sidebar displays and the editor decides. That is why a line in no block is an answer rather than a failure, and why the pane decides nothing about what a line means.

**Proved.** `node tools/asedit-modes-check.js` — all checks pass, including seven new ones: both modules load, each attaches to its *own* element, the sidebar builds its own panel in a program the editor declares no element for, and the relay (the model put in by hand, the line reported, the block looked up and shown, and a line in no block said so). `node tools/plotview-check.js <trace>` — 45 checks, the same 2 known window expectations, with three new ones for a press on a mark. `asedit-graph.allspeak` 1223 commands / 247 symbols, `asedit-side.allspeak` 115 / 30, `asedit.allspeak` 1442 / 244, all 0 errors, and all three clean under the linter.

**Two faults found on the way, both of the kind this project keeps finding.** *The pane's fixture never applied its own constants*: `plotview-check.js` looked its panel up by the page's id `se-graph-area`, and the page's elements are not created in the harness, so the letterbox its comment is built on was always zero — harmless only because two offsets cancel, which is exactly why no check could have said so. It now finds the element through the view's own symbol and **fails loudly** if it cannot. And *a handler is registered by executing the line*: the `on message` came out at the end of `asedit.allspeak`, after the `stop` that ends its linear flow, so the relay would have been dead in the browser — and the relay check passed anyway, because it called the handler by name. There is now a check on `program.onMessage` itself (with teeth: removing the line fails it) and the registration sits in its own small block above that `stop`.

**Three more faults found on the first real click (2026-10-02, Graham), all mine, and the third is about the checks rather than the code.** *The report was never read out of its dict*: the pane sends `{"kind":"mark","line":N}` — a dict is a JSON string in this language — and the handler was written to convert its message instead of reading its property, so `add 0 to` a dict threw (Graham's error) and `the value of` it is `parseInt` of the whole JSON, which is **0 for every click** (his own fix, which cleared the error and left the panel looking up line 0). It reads `property "line"` now. *And the doc-block model was never built for the file under review*: `ParseSource` runs in Blocks mode and nowhere else, so a reader who opens a run without opening Blocks gets the sections from whatever file was last blocked — a stale model, which is worse than an empty one because it answers; `EnterGraph` parses the buffer on the way in, before the fetch that puts the pane on screen. *And the harness agreed with the bug twice over*: it delivered a bare **number** where the pane sends a dict, and it read whatever model happened to be lying around — then, once the fixture was fixed, **two of its three checks still passed**, because lines 5 and 12 of `asedit.allspeak` happen to fall inside its first two sections. It now delivers the exact JSON string, enters Graph so the model is really built, asserts `SecCount=2` (the fixture's own count) and asserts the block *titles* exactly. Reinstating `the value of` fails it with `line=0, found=0` — the reported symptom, reproduced.

**And the outcome worth keeping: the check is not the path.** Twice now a green harness has sat over a browser fault — `program.onMessage` unregistered and then an unread dict — and both times because the check *entered the path where the reader cannot*: calling a handler by name, or feeding it a shape `send` never produces. The rule that falls out: a check on a boundary must carry what the boundary carries (the JSON string, the registered handler) and must set up what the real path sets up (the parse on entry), or it is testing a story about the code.

**Next for this item.** *Visits are done* (2026-10-02) — the panel's status bar carries `line N   visit V of T`, counted by the pane during the walk it already makes, which is the count the dot's colour is drawn from; see the entry below for what that settled and what it left. What remains: the **time** at a mark (the anchor event already carries `dur`, so it is one more property on the same message, and it belongs in the same bar); a marker highlight in the picture so the panel's selection is visible there too (it costs a new path, and the harness's "exactly eight paths" structural check moves with it); a **debug tab**, which is item 5; a second path into the panel — selecting a block directly rather than only through a mark; and **a way to close it**. **Sizing is done**: a 6-px grip between the drawing and the panel, the width kept in `storage as "asedit-graph-side-width"` and restored in `EnterGraph`, clamped at 200 px and at the panel's width less 320. Closing it is still not built, and the same grip is where it belongs — a drag to the floor, or a double-click, rather than a third control.

**And the visit count, which was the first thing asked for after the panel existed** (2026-10-02). Graham: *"Along any one row, the visit dots currently all display the same information when clicked, so let's get them to do something to differentiate them. The obvious one to start with is the number of visits to this marker, which already governs the colour shown by the dot."* He was right that the row was the problem: every dot on a line names the same line and so the same doc block, so the block is precisely what cannot tell them apart. The answer is the **running** count — which arrival on that line this dot is — and it is the number the ramp is computed from (`count*3/VizMaxCount`), so a reader comparing a pale dot with a red one is now reading the number that produced the difference. The **line's total** rides along, because "visit 3" alone cannot be told from "visit 3 of 3". Both are counted by the pane in the walk it already makes to decide which mark was pressed, so the two figures come from one pass and cannot disagree; the editor passes them on and the sidebar shows them in a bar at the panel's foot. **The bar is about the mark and not the block**, so it speaks for a line in no doc block too — the block prose above it may be empty while the bar below is not. Left for the same bar: the time at the mark (`dur`, already on the anchor event).

**One decision waiting for the second tab.** Graham's verdict on the click was "1 if the Docs tab is selected (there will be others)". So the mark click fills the tab it belongs to — and the moment there *are* others, a click while another tab is up would change nothing visible, which is indistinguishable from the bug just fixed. The choice is whether a mark click brings the Doc block tab forward (the click is always "tell me about this line") or leaves the tab where the reader put it and does nothing. Which way that goes should be decided with the second tab, not after it.

**And the design notes that led here, kept because they are the reasoning behind the shape.** The Blocks sidebar is `$BlocksToc` — 200 px, left, one row per section — and the doc-block model the tab needs was already the editor's, so the tab's data was never going to be a second parser. The pane cannot measure its own canvas (`svg` is the one element type the plugin registers without the `dom` extra), which is why the modules were given separate elements rather than one module doing both: a sidebar inside the pane's own box would have put an arithmetic fit, with the sidebar's width baked into it, between the panel and every drawn coordinate. And **nothing in the picture is an element the DOM can hit** — each kind of mark is one merged path (`ec-VizFlowCall-0` carries four arrows in a single `d`) — so the click is arithmetic against the view's own geometry, exactly as the scrollbar handles' hit test is. That is the constraint item 3 shares.

### 3. Rollover tooltips on the arrowed lines

**The finding that changes the estimate: there is no rollover event in the runtime.** `on` accepts `change`, `click`, `key`, `leave`, `window resize`, `browser back`, `swipe`, `wheel`, `pick`, `resume`, `drag` and `drop` — and `on leave` is `beforeunload`, not a mouse leave. So a rollover tooltip is **not a pane tweak; it is a new language event**, reaching Core/Browser, four language packs and the plugin contract, with a Python counterpart that has nothing to hover.

**And the display side.** The svg plugin has no `title`/tooltip support, and the arrows are one merged path, so the pane needs a hit test *and* a surface for the tip. Its foot already carries a status line naming the window and the zoom — overwriting that would lose a thing worth keeping, so a tooltip should be its own element.

**Consequence for the order:** item 3 is the item that looks smallest and is not. It shares its hit test with item 2, so the two belong together — the sidebar first, the tooltip on the same arithmetic.

### 4. Starting a run from the editor, to capture data without the console

**What exists.** A recording is made by a console command today: `python3 tools/asviz-run.py --run --trace=<file.json> <script>` or `node tools/asviz-run.js …`. The editor only *reads* `<script>.viz.json` from beside the script — the Graph pane's own doc block says so. There is no Run button: the editor's buttons are Open, Find, Blocks, Graph, plus the Blocks toolbar.

**The two halves, and what each already has.**

- **JS.** `edit.html` already loads `allspeak-min.js` **and `plugins/asviz.js`** for its own sake. A run needs a *host* function in that page — `AllSpeak_Viz.Recorder` is host API, and no AllSpeak command attaches a recorder — which compiles the buffer, runs it with a recorder attached and hands back the trace document. No file, no server.
- **Python.** `server.allspeak` (`use server`, Python) has `/list`, `/read/<file>`, `/write/<file>`, `/version`, `/restart` and static files; a `/run/<file>` route is the obvious home, and Python's core has `system "<cmd>" [background]` for shelling out. The two hosts are twins with the same CLI, so "both JS and Python" is one route with a runtime switch rather than two mechanisms.

**The open design question, and it is why this is not the first step.** Where the run host lives in a **pack** project. `tools/asviz-run.py` derives its root from its own path and puts `<root>/allspeak-py` and `<root>/allspeak-py/plugins` on `sys.path` — so it runs from *this repo*, not from a starter pack, which carries no `allspeak-py` (and, by the decision taken earlier today, no `js/` either). Three ways out: **(a)** ship a run host in the packs and let it fetch the plugin from the CDN; **(b)** put the run inside the installed Python `server` plugin, so no tool is needed; **(c)** run in the browser, where the runtime and the plugin are already loaded. **(c) is by far the least new machinery** and makes the recording an object rather than a file, at the cost of the run happening in the page that is also the editor.

**And the guard comes first.** A button makes it trivial to run a script that never returns, so item 1's budget/ceiling gap has to be closed in `asviz.js` before a run can start from a button — or the button can be Python-only until it is.

### 5. Annotations — capturing run-time values into the recording

**The vocabulary already exists, which is the good news.** The marker is `viz start [on <label>] [once|every] [until thread] [limit N]` / `viz stop [on <label>]` — core syntax in both runtimes, compiled to a command the runtime does nothing with and a Recorder watches. **"A label carrying an annotation" is already `viz start on Work`**, and a `while`'s anchor exists too (`loop@<line>`). So the extension is one more option in the same option-reading loop in `Core.js` and `as_core.py` — naming the variables to capture — not a new syntax.

**The spec rules it out in as many words today**, which is what makes this a designed change rather than an addition: *"Values. Nothing here records what was in a variable. That is the debugger's job, and the only honest bridge between the two is that they can agree on anchors."* So this begins with **Draft 3 of `spec/viz-trace-format.md`**, with `tools/check-trace.py` — the checker "any writer for either runtime must produce a document that passes" — kept in step.

**What to borrow, and it is already in the repo.** The anchor event carries `line`, `pc`, `name`, `steps` and `visit` in `args`; `args.values = {name: value}` is the obvious shape, and both recorders already hold the pc→line map needed to attribute a value to an anchor. The precedent for the *feature* is `allspeak-py/allspeak/debugger/`'s watchlist.

**Cost, stated plainly:** core syntax in two runtimes, four language packs, a spec revision, a checker change, two recorders, and the sidebar's debug tab. **The largest item on the list**, and the one to design rather than start. The spec should be written first, because the trace format is the contract the sidebar, the pane and both recorders all read.

### 6. The redaction — the text's own shape, drawn behind it (done, 2026-10-03)

**Asked for as an experiment, and it is in.** Graham: *"create a redacted version of the entire displayed text, not in black but in a shade of grey that keeps the text readable … placed behind the text itself, as a rearmost layer. The redaction for each line covers not just the text but also the line spacing above and below each line. When the page is zoomed, the redaction zooms with it, but only in Y … The intention is to preserve the visible 'shape' of the text at any zoom level."* `VizRedact` is one `path` inside `VizPane`, one bar per drawn line, built in the same once-per-run pass as the text document. Each bar is as wide as its line at eight units a column and as tall as the whole eighteen-unit row, so it covers the leading as well as the glyphs.

**The zoom behaviour is a consequence of where it lives, and that is the design.** `VizPane`'s `viewBox` is the document — eighteen units to a row, eight to a column — so a bar drawn there is scaled by the browser exactly as the glyphs beside it are: with the vertical zoom and not with the horizontal one, because `VizWindowW` is derived from `VizWindowH`. Nothing is recomputed to keep that true.

**The deferral Graham offered is not needed, and the reason is worth keeping.** He expected a per-zoom cost with a plan to hide the layer during a zoom and render it a second after the last notch. The bars are a function of the *source*, not of the window, so they belong with the picture built once per run rather than with the marks and rules every draw rebuilds — a gesture never enters that pass. **Measured**: the build rides in a draw of ~54 ms on a 211-line recording, and the difference it makes is below that draw's own variance (±3 ms across repeated runs). **And it is a check**: the path data is byte-identical across all 34 phases of a run that zooms and pans throughout, and changes when the script is edited. Had the bars been drawn in the *frame's* units instead, they would have needed re-laying-out on every notch — which is exactly where the expected cost would have come from, and why it does not arise.

**The grey is chosen by contrast, not taste**, and the table is in the code: `#2f353c` gives 1.45 against the page and 2.07 for the text on it, where a light bar (`#8f979f`) gives 6.07 and 2.02. Both keep the text readable; the dark one is used because the rules are `#eee`, the frame `#3a4048` and the marks the blue-to-red ramp, all drawn *over* the redaction — a light block behind every line would wash the pane's subject away. **This is the one judgement left to Graham's eye**, since the shape is measured but the effect is a look.

**Revised the same day: the width pinned and the fill changed to `#eee`.** Graham: *"The white-on-black is too heavy for my liking and it tends to take over, where the dots and lines are the things that should be most prominent. I'd prefer the text to stay black and to try the horizontal line colour for the redaction."* — and then, correcting the first attempt: *"I'd like the width of each redaction bar to stay fixed at the length of its text at maximum zoom, so that at all zoom levels the bars still occupy the same width. It was this additional load that made me wonder if a deferral would be needed."* So his first description — "it zooms with it, but only in Y" — was about the **bars' own** scaling, not the document's: the *height* follows the row, the *width* does not move at all. **The deferral is still not needed, and the reason is the interesting part**: pinning a width while the zoom moves wants a `transform` whose factor is the document's shrinkage inverted, so the two cancel — one attribute per draw, no rebuild. Rebuilding the bars per notch is the obvious way and the one that would have cost what he expected. **Measured**: 200.0 units wide at all 47 phases (0.75% spread, which is the thousandths rounding plus the clamp at the deepest zoom, where the factor is held at one because that is where the reference comes from), rows 2.22 to 18.13 units tall. The fill is `#eee` — the rules' colour — with the text left as it was (`#5b6472`, 5.16:1 on the new paper). **Two numbers Graham has to weigh**: `#eee` against the page is 15.48:1 where the dark grey was 1.45:1, so the bars are now the loudest thing in the picture; and a rule crossing a bar is 1.00:1, i.e. invisible. The alternatives measured: `#7a8290` (the horizontal scrollbar) at 4.36:1 against the page and 2.13 for the text, `#3a4048` (the frame) at 1.72 and 1.34. **One line changes it.**

**And the fault that pinning found, which is a language trap worth remembering.** The first attempt pinned nothing — a 75% width spread the harness reported — because `left 1 of X cat '.' cat right 3 of X` **parses as `left 1 of (X cat '.' cat right 3 of X)`**: `cat`'s right-hand side is the whole rest of the expression, so the first part takes the leading digit of everything after it. It compiled, it ran, and the transform came out `scale(8 1)` where `scale(8.068 1)` was meant. Built in steps, as it now is, with the reason recorded in the code.

**And the shade was settled by eye, in two steps, which is the right way round for a look.** Graham saw `#eee` and asked for a tenth off it — *"the redaction bars can be a bit darker, as the text is easily readable and the trace information is still the loudest thing in the picture"* — so the fill is now `#d6d6d6`. The numbers moved with it: against the page 15.48 → 12.36, the text on it 5.16 → 4.12 (still plainly readable), and a rule crossing a bar 1.00 → 1.25. **That last one is the thing to watch**: the rules are `#eee`, so a leader crossing a bar was *identical* to it and is now only a shade clear of it. If reading a rule across the text matters, the bars want to come down to about `#7a8290` (the horizontal scrollbar's grey), which puts the rule at 2.05. **The geometry is unaffected by the colour** — the bars stay pinned at 200.0 units across all 47 phases while their height follows the row, and the path is still built once per run.

**Verified**: every bar is exactly its own row (top at the row's top, eighteen tall, width = the line's length × 8) — 221 bars for 221 drawn rows, and no zero-width bar for the blanked doc blocks. And the harness learned a **third coordinate system**: anything inside `VizPane` is in document units, so it is measured with the pane and not against the frame.

### 7. Setting a script up for capture, and triggering the run — the workflow (2026-10-03)

**What was asked.** *"Next I want to look at the most user-friendly way of setting up a script for runtime capture and triggering the run, on both Python and JS versions."* The marking half of "setting up" is Graham's own session — attributes, probably `@viz start`/`@viz stop` — and he said so: *"My idea is to use attributes to define data for collection in the runtime JSON capture."* So this entry is about the **rest of the loop**: how a script is run with a recorder attached, and how the recording reaches the pane. Nothing here presumes a marker spelling, deliberately.

**What exists today, verified rather than remembered.** Both runtimes have a *host* that can run a script and write a trace: `tools/asviz-run.py` and `tools/asviz-run.js`, twins with the same CLI (`--run [--trace=<file>] <script>`). **Neither works from a starter pack**: `asviz-run.py` derives its root from its own path and puts `<root>/allspeak-py` and `<root>/allspeak-py/plugins` on `sys.path`, and a pack carries neither those nor `js/` — so a pack user has **no way to capture a run at all**. Neither host is in the packs either. And the editor's own doc block claims the runtime writes `<script>.viz.json` *"with `--trace=`"* — an intention that is not implemented anywhere: a **doc/code disagreement** to fix whichever route is chosen.

**Two pieces of machinery already exist and are dormant.** First, the **guard** — the Python recorder has a work budget (2 s of the program's own work) and a wall ceiling (20 s), with `as_viz.py`'s own comment saying why: *"the editor is what usually asks for one and a script under review is not to be trusted with the editor's responsiveness"*. **Nothing constructs a guarded recorder**: both hosts deliberately pass none, because hand-made recordings at a terminal are their own business. So the guard was built *for the feature now being asked for* and is waiting for a trigger. **Its JS half was missing entirely — implemented 2026-10-03** (see the entry below). Second, **`use plugin <Class> from <path>`** in the Python runtime (`as_program.py`'s `importPlugin` appends the file's directory to `sys.path` and imports it), so a *project* can carry and load the visualiser's plugin — which answers "can a packed project capture at all?" with yes, if the plugin travels.

**The missing primitive, and it is the whole of the answer.** A trigger needs something that can *compile a script, attach a guarded recorder, run it, and hand back the trace* — and today that exists only in host code (`asviz-run.*`), which is why it is unreachable from a project. **It belongs in the visualiser plugin, one command per runtime** (`asviz.js` / `as_viz.py`), because the plugin is the thing that ships and because a plugin command can do it from inside the runtime: in JS the plugin shares the page with `AllSpeak.compileScript`/`AllSpeak_Run` and its own `Recorder`; in Python it has the compiler and can build a `Program`. One command then serves every route below, and it is the *only* new vocabulary the feature needs — which is the simplest thing that can work, and it keeps the trigger out of core (so it cannot collide with the attribute work).

**And it needs one field the trace does not have: which runtime wrote it.** `otherData` carries `{vizTrace, script}` and nothing else — so a recording made by a trigger **cannot say which runtime ran it**, while the format spec says the two differ in `steps` ("joined on `line`, and `steps` compares within one runtime"). The moment both runtimes can be triggered this stops being academic: a reader looking at a recording cannot tell whether the run it describes is the one their own app makes. **Add it to the trace, both writers, and to `check-trace.py`** — one field, and the first honest thing to do.

**Three routes, all built on that one command.**

1. **The editor records (JS, in the editor's own page).** The pane's empty state already says *"No recording beside this script: x.viz.json"* — the most natural place for a **Record** button, since that is exactly the moment a reader wants one. `edit.html` already loads the runtime *and* `plugins/asviz.js` (for the pane), so nothing new is fetched, no server change is needed, and it works **from a pack**. The trace is written to `<script>.viz.json` with the existing `POST /write/`, so the recording stays a file that travels, and the pane then reads it as it always has. **Caveat to state, not to hide**: the script runs *in the editor's page* — it can scribble on the editor's DOM, and it is the **JS** runtime's run. The guard makes a runaway harmless; the DOM sharing is the reason to consider running it in a throwaway iframe, at the cost of twenty lines of page JS.
2. **The project's server records (Python).** `server.allspeak` gains a route that runs the script under the Python runtime and writes `<script>.viz.json`, and the editor's button calls it — the Python counterpart, and the one that matches a project whose scripts run under Python. It needs the plugin beside the server (`use plugin Viz from ./as_viz.py`, so `as_viz.py` travels in the packs) and a route that calls the new command.
3. **The project records itself (page-level).** The most "integrated" of the three and the least machinery for a *JS project*: the app runs exactly as it always does and leaves a recording. A project page would load the plugin, and a few lines of page JS — or one line of AllSpeak calling the new command — records its own run. Good for "record what this app actually does", which none of the other two can do, since they both run the script *instead of* the app.

**Recommendation: route 1 first, because it is the only one that needs no new file, no packaging change and no server route** — one command in the plugin and a button, and a packed project can record. Route 2 is the Python answer and its real cost is one decision (the plugin travelling in the packs); route 3 is the one that answers a question the other two cannot, and can come later.

**One coupling to flag to the attribute session.** Both recorders recognise a marker by *spelling*: `command.keyword === 'viz'` in `asviz.js` and `command.get('keyword') == 'viz'` in `as_viz.py`. So `@viz start` will need the **syntax** changed in core *and* the **detection** changed in two recorders — three files, two languages — and the recorders must keep agreeing about what a marker is, since that is what makes their traces comparable.

**Done this turn: the JS half of the guard, which every route needs and none of them supplies.** `asviz.js`'s recorder now takes a work budget and a wall ceiling and answers `false` when one fires, exactly as `as_viz.py`'s does — same two bounds, same numbers in this runtime's units (2 s of the program's own work, 20 s of wall clock, a 20 ms gap cap, the same waiting keywords and the same `core`-domain rule), and the same two reasons reported apart as `stopped: "work"|"wall"`. `Run.js` now *reads* that answer the way Python's runtime does (`if (tick(...) === false) break`), which it did not: the return value was ignored, so a JS recorder could not have ended a run at all. The trace's window event carries `stopped`, which is what the spec and `tools/check-trace.py` already expect of a writer.

**Proved, both bounds, by arming it from a host and running deliberately bad scripts.** A 200,000-iteration loop with a 1 ms budget stopped after **1,710 µs** of accumulated work and its recording says `stopped: "work"`. A loop that only waits — the case the budget cannot catch, because waiting is not work — ran 0.57 s under a 300 ms ceiling where the script wanted 5 s, and 3.19 s under a 3 s one. An ordinary recording is unchanged apart from the new `stopped: null` field (which Python already wrote), and `check-trace.py` passes on both.

**And the fault found while proving it is worth keeping, and now has a check.** The first two attempts showed no guard at all, and the cause was that the constructor's parameter list had not taken — `function ()` with a body reading `budget` — so both bounds were `null` and the guard was silently off. It is the shape of fault a *check* would have caught and a probe did: the probe printing `busy=11985us` for 160,000 commands is what proved the accumulation was real and the arming was not. **`tools/guard-check.js` is that check, and it ships** (twelve files a pack now): nine checks, both hosts, both bounds, an unguarded control that proves the loop *does* run to the end, and the waiting case proved by the clock on both runtimes.

**And two things measuring turned up.** *The JS guard's clock was too coarse*: `vizClock` counts microseconds — right for the trace, wrong for a guard, because a compiled command can take less than one, so a µs budget counts only the commands that happen to round up and the same bound means different work on every machine. It now accumulates nanoseconds through `vizClockNs`, mirroring Python's `perf_counter_ns`, with the Python constants by value. *And the two hosts disagree about a script that waits, with the JS one wrong*: `AllSpeak_Run.run` returns when a `wait` hands the rest of the program to a timer, so the JS host writes its trace **one slice in** — a waiting script records only that slice, and the guard's `stopped` never reaches the file, while Python's host waits for the run to end (its own report: `reason=wall | elapsed-ms=302`). The check proves the JS case by the clock and says its trace cannot be asked, and **this is the piece the editor's Record button needs before it can be built**: a UI script waits constantly, so a recording of one would today be a slice and a lie about the run. Both hosts also gained `--budget=`/`--ceiling=`, so a plain `--run` records an unbounded run as it always has while a trigger can arm the guard.

**Done 2026-10-03: route 1 is built — the command and the button, end to end.** `asviz.js` has **`record the script [in <path>] [as <source>] giving <variable> [incomplete <flag>]`**, a sibling of `model` so the plugin now compiles a script either to *read* it or to *run* it; `asedit.allspeak` has `RecordRun` (the button's body, which reads the buffer, has the plugin run it and writes `<script>.viz.json` through the `/write/` a saved tab already uses), and `asedit.json` a **Record** button beside **Graph**. The two faults it had to get right were both about *naming and stopping*: the declared name is stepped aside for the compile and handed back (recording `asedit.allspeak` while `ASEditor` runs is the likeliest collision of all, and there is a check that the editor still owns its name afterwards), and the guard is armed with the recorder's own defaults, which is the caller it was built for. `asedit-modes-check` proves the loop: the POST lands at `/write/tools/trace-wide.allspeak.viz.json`, 18 events, 2,708 bytes. Its harness stub now *remembers* writes instead of swallowing them, which is what made the path checkable at all.

**And the one thing it cannot do, which is the next shape rather than a defect: follow a run past a `wait`.** `wait` hands the rest of the program to a timer, so `AllSpeak_Run.run` returns and a capture made inside a call covers the run *up to that wait* — the same property that makes the JS host's trace one slice in (above). Rather than pass a slice off as a whole run, the command answers with the flag and the status line says so. **Graham's steer, 2026-10-03: *"it's a place to start, but eventually I will probably want to trace through threads that wait."*** That needs the caller to be **told** when a run ends rather than to wait for it — i.e. the deferred shape (a callback, or start/collect) — and the piece it needs is already in place: the recorder now notes that a run has **handed control to a timer** (`recorder.parked`, set as it ticks each command, from the same waiting-keyword list the guard uses). Nothing else in either runtime can see that: a program parked on a timer is registered exactly like one that has ended, which is why the first attempt to test it with `AllSpeak.scripts[name] === program` reported a finished busy loop as unfinished. A deferred capture reads `parked` after each slice.

**Later same day: the verdict, and the fault it was hiding.** Recording two real scripts in `~/dev/dojo/chemical` (the same task in both variants — `parser.as` for the command line, `parser-main.as` for the browser) reported *"Could not record this script"* for one and wrote a **single-event trace** for the other. Neither was a fault in those scripts. **A document holding nothing but its header is still a valid document**, so a button that reads only the trace reports a run that died on its first statement as a success — and the two ways a recording comes back empty are worth telling apart. `record … giving <trace> reporting <verdict>` now answers with the sentence (`8 visits in 1 window`, `could not run: I don't understand 'dictionary' at line 46`, `stopped: …`, `nothing recorded: the run finished without reaching a marker`), composed by the plugin because the plugin is what saw the run. Visits are the pane's unit, so the status line and the sidebar agree. Both cases are checked.

**What those two recordings actually proved, and they are the map for the next piece.** `parser.as` is refused because it uses `dictionary` — a **Python-flavour** word with no JS equivalent (item 7 above, and `language-pack-issues.md` #14) — and the editor records with the **JS runtime**. So a Python-variant script is out of reach of route 1 *by construction*, and its route is route 2 (the project's server records under Python), which is unbuilt. That is a boundary to state in the button's message, not a bug to fix. And `parser-main.as` records nothing because **it is an app, not a script**: `parser.html` does `rest get Script from 'parser-main.as'` then `run Script`, and the script fetches `atomic-weights.json` and `parser.json` and builds its UI into *that* page. In the editor's page there is no such page, so it stops at once. **The consequence for capture is exact and worth remembering: recording a launched app means arming the recorder *before* the app's own `viz start` line runs** — attach one after startup and the window has already passed, so the recording is empty again. That is not a detail of route 3; it is route 3's first requirement.

### 8. Launching the project's app from asedit (2026-10-03) — asked for as a feature in its own right

**What was asked, and it is a feature rather than a side-effect of capture.** *"The ability for asedit to launch a GUI app from itself — with or without runtime data capture — would be highly prized."* It came out of recording `~/dev/dojo/chemical`: the app is `parser.html`, which does `rest get Script from 'parser-main.as'` and `run Script`, and it is served by the project's dev server (`server.allspeak` serves static files, plus `/read/`, `/write/`, `/list`). Today the only way to see it is to start that server and browse to the page; the editor, which *is* served from the same project by the same server, could open it instead.

**Why it is cheap where it is, and what the unknowns are.** The editor already knows the project it is served from — its own location is in it — so the app's URL is a sibling of the editor's, and launching is `window.open` of it. So the whole question is *which page* and *where*:

- **Which page.** Convention (an `.html` beside the script, or the same basename), the project's own descriptor `.allspeak-init` (which already carries `project: parser` and `type: both`), or an **attribute on the script** — Graham's direction, since attributes are becoming the way a script declares things about itself. The editor must still be honest when it finds none: say that the project declares no app rather than launch nothing.
- **Where.** A **new window** runs the app exactly as it normally runs, at the cost of the editor not being able to reach it (it can, same-origin, but only to drive it). A **pane inside asedit** is integrated and drivable, at the cost of the app sharing the editor's window and its layout being the editor's rather than its own.

**And capture-on-launch has one requirement that must shape it.** Recording a launched app means arming the recorder **before the app's own `viz start` runs**: attach one afterwards and the window has already passed, so the recording is empty — which is exactly the single-event trace that started this. So the app page needs a bootstrap (route 3 of item 7), or the editor must inject one *before the page's scripts run* — the wrapper-page trick (fetch the app's HTML, splice the bootstrap in, `document.write` it, with a `<base href>` so the app's relative URLs still resolve). Launching without capture needs neither.

**Verified while asking the question rather than before building it:** the dojo's `.allspeak-init` contents, `parser.html`'s two lines of work, and the dev server's route list — so the options above are read off the project, not assumed.

**Decided and built the same day: `@app <page>`, opening in a window of its own.** Graham chose the attribute over the project descriptor or a convention — *"an attribute on the script"* — and a new window over a pane, because the app then runs exactly as it does by hand. So `asedit.allspeak` gained **Launch**: it re-parses the buffer (the attributes are read by the same walk the Blocks view uses, in `MaybeMeta`, where a key and its value are already apart) and hands `location new` the page name. **The name is relative to where the editor is served from — the project root — so no path is assembled and no server route is added.** A script naming no app is told so and told the spelling; deleting the attribute stops the launch rather than leaving the last page standing. Provisional: the attribute syntax is Graham's own session's to settle, and `tools/asdoc-check.py` already accepts `@app` on a block's tail with no error or warning (verified on a fixture).

**Still open, and it is the capture half only.** Arming a recorder for a launched app must happen **before the app's own `viz start` runs**, so it needs a bootstrap in the app's page or an injection before the page's scripts run. Launching needs neither, which is why it went first. Also open, and independent of that: whether the editor should be able to *drive* the app (fill its input, press its button) rather than only launch it — that is what a pane would buy, and the window was chosen knowing it does not.

### Where to start

**Item 2 — started, first cut done, 2026-10-02.** The sidebar exists as a co-module with the doc-blocks tab filled by a click on a mark, and the record of how it was built, what it proves and what is next is the entry above. What follows is the order it was chosen in and what remains behind it.

**Then item 4** (deciding the pack question first), **then item 5** (spec first), **then item 3** on item 2's hit test — the tooltip and the mark selection want the same arithmetic, which is why they belong in one pass. **Item 1's gaps get fixed as each is met** — the JS guard arrives with item 4, and the analyser rules are a chore that needs no feature around them. **The order was chosen for the reasons the sidebar won:** it had no open design question, it is the container the other three land in, and it is visible — which a plan that cannot yet be run from the editor most needs.

## For evaluating this tool — 2026-10-01, end of session

**A candid state, since the next question is whether any of this earns its keep.** Everything below is
measured or demonstrated, not argued.

**What works, demonstrated.** The pane draws the *whole file* and windows over it with the wheel (both ways),
shift/control-wheel zooming the lines and the steps independently, a drag panning, the clamp holding at both
ends. Two keys, a caption naming the recording's range, a status line naming the window and the zoom, and
marks/rules/heat saying which lines ran. The extent change is proved numerically: the window's fit reads
`0 0 7100 4680` for the 260-line fixture and `0 0 7128 4698` for the same file a line longer.

**What a draw costs, which is the number that decides it.** From Graham's own console timestamps, on a **24 KB
recording**: 279 ms, 131 ms, 118 ms, 125 ms — call it **120-280 ms per draw**, agreeing with the module's
learned 4 ms/KB plus a fixed part. It scales with the recording, so a megabyte is seconds per gesture. The
gestures are no longer *lost* (that was the `VizRequest` fix) but each one waits for a draw. **Measure the curve
on a real recording before optimising anything** — this is the single input most likely to decide whether the
pane is worth its weight, and his rule is not to optimise before the functionality is finished.

**What is weak, and it is the tooling rather than the pane.** Four faults were found this session; the two I
diagnosed by *reading* the runtime were both **wrong**, and the two found by a **log** and by the **harness**
were both right. `plotview-check.js` has never run an event-handler path (`on wheel … begin … end`), which is
where both wheel faults lived, and its scroll check asked whether a scroll *moved* the picture but never **which
way** — which is exactly how a missing sign slipped through. **A phase that fires `program.onWheel` with a
signed `document.wheelAmount` is the highest-value check in the repo.**

**Loose ends in order:** (1) that handler phase; (2) **the two remaining stale expectations** in
`plotview-check.js`, both the same design: it wants the window *kept* across a script edit and computes its
expected fit from the original source. **The row-against-axis one is fixed and closed** (2026-10-01): it was
stale for two reasons at once — it took the origin of the document's rows from the caption, which names the
*recording's* range while the picture is the whole file, and its model put a line at the *top* of its row, which
is what the view did until the half-row fix; it now states the claim properly, that every tick sits on the
**middle** of the row it names, and it passes with 1.0 unit to spare; (3) three `verify-stale` sign-offs in the
module (the gestures block, the draw block, and the view's own section); (4) the clamp's 32-row floor for files
shorter than 32 lines. **The pane is JS-only** — the Python runtime has no visualiser, and nothing here changes
that.

## Where things stand

**Handover, end of session 2026-10-03 — read this one first, then the entries below it.** A long evening: the whole capture-and-trigger workstream was built, the language grew four fixes, and the editor stopped being a copy a project has to refresh. **The detailed record is `various/record-and-launch.md`** (gitignored, so it will not travel — hence this summary), and `DIFF.md` says what to do about the last change.

**First: commit.** Around 42 files are modified and uncommitted — `js/allspeak` (the four language fixes), `js/plugins/asviz.js` (the guard, the trigger vocabulary, the app recording), `asedit.allspeak`/`asedit-graph.allspeak`/`asedit-side.allspeak`/`asedit.json`/`edit.html`, `build-allspeak`/`build-starters`/`deploy-allspeak`, `tools/` (the new `capture-check.js`, and the harnesses), `starter/*`, `allspeak-py/allspeak/as_classes.py`+`as_program.py`, `spec/viz-trace-format.md`, `learn/reference/03-variables-and-arrays.md`. Nothing is half-finished; the tree is consistent and every check passes. **Two new files are untracked and need `git add`: `tools/capture-check.js` (it ships in the packs, so a fresh checkout must have it) and `deploy/dist/asedit.js` (generated by `build-allspeak`, and committed like the bundle beside it — the deploy publishes it).

**Done this session.** *The trigger*: `record the script … giving … reporting <verdict>` (run a script under a recorder, with the guard armed and a sentence saying what the recording amounts to), `record this run` (arm the program that calls it — what an app needs), `save the recording to <path>`, and `record the app at <url> to <path>` with **Record branching on `@app`** so one button either runs a script or opens and arms an app and writes the recording when its window closes. *The capture*: `@viz start`/`@viz stop` and `@show N, Total` are read by both recorders, `values` ride the visit in the trace, and the sidebar shows them beside the line and visit — measured identical across the two runtimes. *Four language fixes, Graham's four*: an undeclared variable now says which one and what to do (JS, where the error named the verb); a variable must be declared before the statement that writes it, **now documented** in the reference; `NoValueRuntimeError` takes a name or a record and no longer hides a type mismatch behind a missing `f`; and **an unhandled runtime error ends the run**, matching Python — `aborted` was set and read nowhere. *The editor*: fetched, not copied — `dist/asedit.js` (written by `./build-allspeak`) carries the editor and its two modules as a script, so a project takes the released one with **no copy to refresh**; packs carry none of it and generate their page from the repo's.

**Next, in order.**

1. **The traffic lights, Graham's decision: per-tab *and* the app reporting back.** The design is in `various/record-and-launch.md` under *"The traffic lights, decided"* — the state model and colours first (editor-only, no app change), then the launch-armed-Record and the app posting back to `window.opener`. Half one does not depend on the app at all.
2. **Try the app recording end to end**: with the plugin line in `parser.html`, `Record` on a script naming an app should open and arm it — and `record this run` at the top of `Report:` is the *optional* extra that catches the app's first draw. Not exercised in a browser here: no chromium.
3. **Python parity for the trigger**: `as_viz.py` has no `record this run` / `save the recording to` yet, so the CLI cannot arm its own recording. Also worth fixing there: Python's compiler says `I don't understand 'add'` for `add 1 to Nope`, where JS now names the variable — the same misleading message, other runtime.
4. **Two known gaps**: `plotview-check.js` never runs a trace carrying `values`, so the pane→editor hop is unasserted; and `tools/asviz-run.js` writes a waiting script's trace one slice in (the JS run returns at a `wait`). `recorder.parked` is the fact a fix needs.
5. **Conformance, reported and untouched**: `actuals-js-browser.json` holds compile failures for cases that pass today; `ec_js_runner.js`'s usage names `as_js_runner.js` and a `dist/` path that is really `deploy/dist/`; and `run_conformance.py` has no notion of an optional case (`required: false` is ignored).

**Traps worth knowing before editing.** A **status code does not mean the file arrived**: the dev-server Graham uses answers an unknown path with `200`, the editor's own page, and the MIME guessed from the extension — the page now checks bodies for a leading `<` in every place it fetches, and the editor treats such a body as a miss. **CORS is by file type on allspeak.ai** (`.js`/`.css` have it, `.allspeak` does not), which is why the editor travels as a script. **A variable must be declared before the statement that writes it** — the compiler is single-pass, and the error for it used to name the verb. **A duplicate declaration is an error.** `index X to N` selects a *slot*, so it does not walk a json list's elements (`element N of` does). **The instrument is checked first**: this session lost time three times to a `head -8`, a capture that read only stdout, and a log filter that knew one shape of line — and once to a *probe* whose own pane was broken by a leftover line of mine. And one habit worth keeping: open the editor at `/edit.html`, never a made-up path — a catch-all answers those with the page, which works as a page and breaks every relative URL in it.

**Handover, end of session 2026-10-02 — read the entries below after this one.** The Graph pane itself is in good order: the module compiles at 1164 commands / 234 symbols / 0 errors, all 24 doc blocks are clean under the linter, and 42 harness checks pass on the short recording with only the two pre-existing window expectations outstanding.

**Done this session, in order.** Vertical flow lines are drawn in full and clipped by the plot's own nested viewport, reversing an earlier answer of mine. Two scrollbars, draggable, sized by the visible proportion — at 100% the handle fills its bar and cannot move. The heat is a blue-to-red ramp that shades by each line's *own* running count, so every line starts cold and the hottest line in the run defines the top; the editor's per-line counts are no longer read, which also removed a colour/line mismatch and a per-draw error. The module went from 7 doc sections to 24, with titles, in the shape the convention actually requires — **a block contains its code**, and its `@hash`/`@verified`/`!!!` are the tail. And the tooling: a linter with five new rules, and a rule that any tool an agent can use ships in the starter packs.

**Next, in order.** *Counts below re-measured at the start of the next session (2026-10-02, later), not carried over.*

1. **The runtime-in-packs question — decided 2026-10-02: leave as-is.** Graham's call. A pack keeps carrying the analyser and both visualiser instruments and does **not** gain `js/`: the analyser is the one that matters and it is self-contained Python, so it works from a pack, while the two instruments say in a sentence that they need a checkout rather than failing on a missing file. Shipping `js/allspeak` + `js/plugins` would add roughly 1.2 MB — about tripling a 110 KB pack — for two development instruments. **Nothing to implement; the decision was the deliverable.**
2. **Re-verify two doc blocks** in `asedit-graph.allspeak` — the *gestures* block (line 80) and *"Drawing a run that has arrived, and saying what it cost"* (line 118). One click each in Blocks mode. *(The "six" above was written before the last commit re-verified the rest; the linter reports four warnings over two blocks.)*
3. **Work through what the linter found**: eight files with `code-outside-section` — `codex/codex.allspeak` 537 and its `deploy/codex/` copy, `examples/chemical/parser.allspeak` 19, `tools/strike-fixture.allspeak` 10 (a fixture), then one line each in `tools/asdoc-check.allspeak`, `tools/asdoc-check-cli.allspeak` and `learn/reader.allspeak` (plus the `deploy/learn/` copy). Outside `various/` the rest is 82 `doc-wrapped` and 70 `title-long` warnings, mostly in files older than the convention. *(`deploy/code/asedit-graph.allspeak`, once the second-worst, is clean now.)*
4. **The sidebar — first cut done 2026-10-02**, as a co-module with its own file (`asedit-side.allspeak`) and its own element, showing the doc block a clicked mark's line belongs to. What is next for it — the marker highlight in the picture, visits and time in the panel, the debug tab and a second way in — is in the workstreams section at the top of this file, "Next workstreams — Graham's list, 2026-10-02".
5. **Housekeeping**: the deploy copy of `asedit-graph.allspeak` is current now, and three variables are still declared and never used (`VizKeyTextX`, `VizZoomXW`, `VizZoomYH`) — Graham's call, reported not removed. `examples/chemical/parser.allspeak.viz.json` is untracked and not gitignored: a recording left in the tree.

**Traps worth knowing before editing.** The linter is the first thing to run (`python3 tools/asdoc-check.py <path>`) and it hashes *code, not prose*, so prose rot is invisible to it — a deleted element's comment reads as documentation until somebody looks. The harness cuts the module at the marker comment `! ---- the view, below here, is what a host runs ----`, which replaced a filename that no longer exists; that string is load-bearing. `various/` is gitignored and is no home for anything that has to travel. And the oldest lesson here still holds: a visual fault is measured from a screenshot, and the instrument's own constants get checked first.

**The editor reported its own file as broken, and the guard that did it was sound** (2026-10-03, found by Graham using the editor). With `asedit.allspeak` open in a tab the status line read *"problem \| script=asedit.allspeak \| Script 'ASEditor' is already running."* — a fault the file does not have. The chain: Blocks mode models the **buffer**, so it compiles a second `ASEditor` while the first is running; the runtime's `Script.compile` holds one program per declared name and refuses a name it already has, because two *running* copies of one script would be indistinguishable; and the plugin, whose compile never runs, reported the refusal as a problem with the file. **The rule is right and the caller was wrong**: a compile-only pass must not be refused by a guard meant for running, and it is the pass's job to leave the registry as it found it — which the plugin already tried to do for names its *own* compile added, in the `finally`, but not for a name a running program already held. The fix steps the declared name aside for the pass and restores it after: `declaredScript` reads it from the token stream — `script <name>` is untranslated, so it is in no language pack and the raw token is the right test in every language — and the same small scan `labelLine` already does for a label. **So the fix is in the plugin, not the runtime**: the guard is correct where it is, and `js/plugins/asviz.js` is the caller that has to behave. Python needed nothing: `as_core.py`'s `k_script` does not police duplicates at all, and the Python host's report on that file is *honest* — `does not compile: I don't understand 'div' at line 12`, since the editor is a browser script and that runtime has no `div` domain — which is why the same symptom cannot arise there.

**And it is checked on the real path.** `asedit-modes-check` runs the editor with **its own source as the buffer** — as the page does — so `run('ToggleBlocks')` *is* the collision; two checks now cover it: the model comes back clean (25 sections, no `problem` record) with the editor running under the name it declares, and the running program **still owns its name** after a pass that borrowed it. Both have teeth: remove the fix and the first one fails with Graham's exact sentence. The second is the safety net for the fix itself — a careless version that deleted the entry instead of restoring it would leave the editor unreachable.


**The picture was half a row out, and that was the whole of Graham's "vertical alignment mismatch"** (2026-10-01, from a second screenshot and a measurement of it). His report had two halves — the rules "not emanating from the text or respecting the 1em gap", and the lines and dots not matching the text they belong to — and they are **one fault**: a row of the picture is eighteen document units tall with its glyphs *centred* in it, and the marks, the rules and the axis labels were all placed at the row's **top edge**. So every rule and every dot sat just under the text of the line *above* the one it named, which is why a rule beginning exactly one em past its line's code read as beginning in the middle of the line above.

**Measured, not argued — and the measurement is what found it.** From the screenshot: 20 lines span 259 px, so 12.95 px a line and the window holds 62 rows; the label "338" has its baseline on the frame's top edge. Against that grid, **the *x* geometry was already exact** — 16 of 17 rules sat within ±1 px of `8·length + 1em` computed from the file's own line, the 17th being 17 px out because a vertical flow line is drawn *over* the rule's first characters. And every one of the 17 sat between **0.23 and 0.54 rows above its own glyph row** — the half row. Two false trails were paid for on the way: my first two passes used a pitch derived from eyeballed label positions (11.25 px) instead of measured ones (12.95), which put the "implied line" of every rule a few rows out and made the file look stale.

**The fix is one mapping, in one place.** `VizPlaceY` already existed for the axis labels; the marks, the rules and the flow's two ends each had the same five lines written out inline, and every copy put the line at the row's top. They all call `VizPlaceY` now, and the half row lives there (added *before* the division, as half of `VizPlotH`, so the arithmetic stays exact). `VizOffset` became unused and is gone. **And the long-stale row-against-axis check had to be fixed with it** — for two reasons at once: it took the origin of the document's rows from the caption (the *recording's* range) where it is the file's first line, and its model put a line at the row's top. Restated as "every tick sits on the **middle** of the row it names" it **passes at 1.0 unit**, and the harness is down to **2 failures** from 3.

**Teeth, proved by reverting one line:** with `add VizRowHalf` removed from a copy, the harness reports *"a tick is 9.8 units from the middle of its row"* — half a row at the legible floor — and *"no rule at y=92"* where the rule should be. Checked on two recordings: 34 checks green on the wide one and 32 on the short one.

**But it is not the whole of Graham's misalignment, and he says so.** His verdict on the half-row fix: *"the lines are now centered, but the whole graph is still misaligned with the text"* — and he proposed **a visual diagnostic rather than another theory**: *"for each of the lines that emanate from a script label, render the name of that label onto the right-hand end of its line, using the same size font. Then we can see if they all match up"* (2026-10-01, end of session; his idea, and the right instrument — a comparison of two *identical* things rather than a judgement of small offsets).

**Found, and it was neither the drawing nor the text: the rows were being *placed* wrongly.** Two screencaps at a thousand-per-cent Y zoom (2026-10-02 morning) made it measurable, and the number fell out of the file: **the picture's text is drawn compacted by exactly the number of rows that draw nothing above each line.** Line 468 sits where the drawing's row 324 is, and 143 rows above it draw nothing; line 508 sits at the drawing's 350, with 155 such rows above it. So the *drawing* was right all along — the rules, the marks and the labels are one mapping and it agrees with the file — and the *text* had moved up, by a growing amount.

**The cause is one attribute, and it is a trap worth keeping.** The picture's rows were `<tspan dy="18">` inside one `<text>`, the offset accumulating as the text was laid out — which the code used to *boast* about ("no per-line coordinate is computed at all"). **An empty `<tspan>` does not advance the text position**, so every row that drew nothing collapsed and every row below it was pulled up by one row's worth. With fourteen blank lines in a file of six hundred the drift was under a row and invisible; **blanking the doc blocks added a hundred and seventy-eight more**, and the drift became a fifth of the screen. It arrived the day the doc blocks went, which is why the two faults looked like one.

**And no check could see it**, which is the part to remember: the *document* was perfect — one row per line, the right text in each, which is what the harness asserted — while the *rendering* skipped the empty rows. The fault lived in the one place a headless check cannot look. **The fix is to give every row its own absolute `y`** (`<tspan x="0" y="...">`), so no row's place depends on what the row before it did; the coordinate the old form saved is now computed, and `y="-4"` on the element stays only to keep a reader of the source oriented.

**The check that would have caught it, and it is about attributes because it has to be.** `various/plotview-check.js` now asserts *"every row carries its own y and they are 18 apart (260 rows, 14 to 4676)"* — and with the old accumulating form restored in a copy, the same harness reports *"0 placed row(s) of 260"* while **every other check still passes**, including "one row per line" and the row-36 check. That is the fault's whole disguise, stated as a test.

**`various/viz-align-measure.py` can now see it from a screenshot too**, which is how it was found: the pattern of rows that draw nothing is a fingerprint of the text's true place, so it reports how far the picture's blanks are from the file's. On the 10:18 screencap it reads *40/60 agree where the axis puts them, and the file has 20 such rows in this window* — a shortfall of exactly the blank rows, which is the signature. It reports the shortfall rather than an offset, because the blank pattern alone does not pin the offset: that came from reading a marked crop and counting the file's blank rows by hand.

**The diagnostic does its job at the same time.** Its copies are drawn by `VizPlaceY` — the drawing's mapping — so with the text placed properly the copies should now sit level with the source lines they copy. **That is the one thing left to look at**, and then it can come out; it is temporary, one subroutine and one layer.

**The heat is relative, and the code had stopped saying so** (2026-10-02). Graham: *"we agree the heat colours are relative, not absolute. They all start cold and the hottest one at the end of the run determines the scaling for all the others."* He was reading the **doc block**, which still described the relative design, while the code had drifted to an absolute ladder — one visit cold, two to three, four to seven, eight or more — which on a busy run would have made every mark the same colour. A doc/code disagreement nobody had noticed, found by the reader the documentation was written for. The ramp is now relative again: the view counts each line's *running* visits in pass two and scales them against `VizMaxCount`, the busiest line in the recording, counted in pass one. Every line starts cold, the busiest line reaches the top of the ramp, and a run whose busiest line ran six times and one that ran six thousand both use the whole range. **The proof is in the harness**: the same check that saw two layers in use now sees **four**, because the top band is reachable.

**The linter is built, with five rules, and the tools now ship** (2026-10-02). Graham: *"I think a linter would be a good investment now. Any other tools we create as part of this job that can be used by an agent to speed product development and improve reliability must also go into the pack."* Both done.

**The five rules**, each one a fault this session actually produced: `meta-not-in-tail` (an error — code after `@hash`/`@verified`; I got this wrong by hand), `doc-wrapped` (the one-paragraph-one-line rule — it found the mappings block, wrapped over five lines, and 137 more across the repo), `title-missing` and `title-long` (the Blocks view list needs a title), `symbol-unknown` (a backticked name starting like one of the file's own symbols but declared nowhere — the caption/heat-key detector, guarded by a three-character stem test so `Kdenlive` cannot be caught), and `redundant-giving` (no false positives by construction, because the language pack says which placeholder is the variable). Seventeen fixtures, zero failures.

**And a correction I owe myself: my "40 redundant `giving`" was an undercount.** The regex required the second operand to be an identifier, so `multiply VizX by 2 giving VizX` slipped past — and the new rule's own fixture used `by 2`, which caught it. **15 more are removed**, and the module is clean under all five rules.

**The tools are in the pack** — `plotview-check.js`, `viz-align-measure.py` and the analyser, with a build guard that fails if one goes missing, and AGENTS.md now states both halves of the rule: a tool an agent can use ships, and a tool that needs this repo's sources to run has to say so rather than fail on a missing file. `various/` is named as no home for anything that has to travel.

**And one dependency worth deciding about.** `plotview-check.js` runs the view on the runtime sources — `js/allspeak` and `js/plugins`, **736 KB** — and a pack carries no `js/`, because a pack is a CDN client rather than a checkout. So it cannot run from a pack, and it now says so in a sentence. `viz-align-measure.py` needs `PIL`. **The analyser is self-contained**, so it works from a pack, and it is the one that matters. Giving the visualiser's instruments the same footing means shipping the runtime, roughly tripling a pack; Graham's call.

**`giving X` when X is already the destination, removed 40 times** (2026-10-02). Graham: *"I notice in Block 24 several places where the multiplicand/dividend variable is also the product/quotient, so `giving xxx` is redundant. Not wrong, but it's easier to read the shorter version."* Right, and checked three ways before agreeing: the language pack documents `multiply {variable} by {value}` as the short form with `giving` as the *other* pattern for a different destination; the file already used it two lines away (`add VizMargin to VizTickPos`); and the harness returns 42 checks with an unchanged command count, so the picture is provably identical. **40 occurrences, all in this module** — the whole file was done rather than block 24 alone, since leaving 36 would only move the inconsistency.

The rule has one exception and it is worth stating: `take VizViewY0 from VizTickValue giving VizTickPos` keeps its `giving`, because the destination is *neither* operand. So the shape is *"`giving X` where X is the variable the pattern itself assigns"* — the first operand for `multiply` and `divide`, the second for `add` and `take`.

**And it is a *better* linter rule than the one I proposed earlier.** It has no false positives by construction, because the package's own grammar names which placeholder is the variable; `symbol-unknown` caught 2 of 4 real cases and needed a shape heuristic to stay quiet. **Rules that read behaviour are reliable; rules that read prose are guesses.** If the linter gets built, this belongs in it.

Nine `verify-stale` warnings are the honest consequence of the code changing — the sign-offs want redoing, which is a review pass and not a formality.

**The gesture docs were stale, and four comments were describing elements that no longer exist** (2026-10-02). Graham: *"Block 9 has been slightly overtaken by events; Shift-Control-wheel now does nothing; the panel is now draggable and also has scrollbars."* Right on all three. **The code comments were already correct** — `VizWheel` documents the parked pair at length, including Graham's own reasoning for it — so the code knew and the prose did not, which is the diagnostic: prose that *restates* an implementation is prose that goes stale the first time the implementation moves.

**So the bindings are no longer listed in prose.** Block 9's paragraph now says what the window *is* and points at `VizWheel` for the keys, naming the two facts a reader needs without following the pointer: the scrollbars are the second way to move the window, and the modifier pair is parked. The same paragraph used to carry a list that had already gone wrong, which is its own argument.

**Three more places in the same state, none of them in block 9.** The module header's *"What it owns"* paragraph still listed **the key and the caption** — both removed two turns ago — and made no mention of the scrollbars. The gestures block said *"`VizPan` on drag"* when the drag has gone through `VizDrag` since the bars arrived. And our comments around the code still described the caption and the heat key as though they were on screen: four of them, in the create block, the status row, the step-label row and the rules. A grep for `VizCaption`/`VizKeyBox`/`VizKeyLabel` returns **nothing**, so every one was describing a deleted thing. They now say what is true, and the historical ones are kept where they *explain* — the caption's row was taken by the status line, and the reason the caption existed (a stale recording shows) is worth keeping even though the element is gone.

**And a lint worth having.** The analyser hashes code, not prose, so a doc block that describes deleted code is invisible to it — the same blind spot that let a paragraph lose its body two turns ago. A check as simple as *"every backticked `Viz…` symbol named in doc prose must exist in the file"* would have caught the caption, the heat key and `VizPan` on drag. Not implemented; noted as the obvious next rule after `code-outside-section`.

**What was going on with block 7, and two things it turned out to be hiding** (2026-10-02). Graham: *"Block 7 genuinely doesn't have any content, so I've added a comment just for something to show. But its synopsis refers to plotview.allspeak, which isn't a file I can see. What's going on here?"* The answer is a fossil. **`various/plotview.allspeak` was the view's own file** until the view grew into this module and that file was deleted — but its *name* survives as the **cut marker for the development harness**: `various/plotview-check.js`, which is *gitignored*, so it does not appear in the repo either, compiles the module in node as a standalone section and therefore needs the view's half only. It slices the file at that exact string, which means the string was load-bearing and could not simply be corrected. It is now a comment — `! ---- the view, below here, is what a host runs ----` — which the harness searches for, and the block's synopsis says what the block *is*: the view's opening, not a deleted file's header.

**And the block being empty was a fault, not a fact.** A block's code is the lines between it and the next block, and here there were none, so Graham's instinct — put *a line* there — was right, and the marker comment is the honest one. **Looking for it turned up two more of my own injuries from the preceding passes:**

- **A duplicated paragraph** — "The view's own symbols" sat in *both* block 7 and block 8, left behind by the splice that rebuilt the header.
- **A paragraph with its body missing.** "**The window doubles as the reset.**" had lost everything after the bold sentence — *"Both gestures clamp at the edges of the run…"* — to my punctuation-based rejoin pass. Found by checking **every moved paragraph's closing words against the file** (18 checked, 1 missing), which is the check worth keeping: a doc edit that moves prose around can lose a paragraph's tail without anything else noticing, and the analyser hashes code, not prose.

My *title-splitting* had also over-reached the other way, splitting bold **paragraph lead-ins** such as "**What it owns.** Everything inside the pane…" as though they were titles. Six of them are rejoined; two of those rejoins were themselves wrong and are repaired, one of them being the lost body above. The lesson is the same one this session keeps teaching: I inferred a structure from punctuation twice and was wrong twice, and both times the file had to be *compared* against its own earlier text to find it.

**The convention is a rule now, enforced in the analyser, and the tool found nine files** (2026-10-02). Graham: *"I think you're right to require any script that has doc blocks to do it properly or not at all. I'm willing to deal with any existing ones that are malformed as we find them, so make it a rule."* So `tools/asdoc-check.py` gained two checks and promoted a third:

- **`code-outside-section`** (error) — code outside any section, in a file that *has* sections. This is the fault that started it: a terminator written *before* its code closes the section early and the code falls through the gap, and every later block inherits it. It would have caught all seventeen of mine. The documented opt-out is preserved — a file with no doc blocks at all says nothing — and there is a fixture proving it stays that way.
- **`title-long`** (warning) — the first doc line is the section's *title* in the Blocks view, so past 100 characters it is a paragraph pretending to be one.
- **`doc-after-code`** was an `info` and is now an **error**: prose arriving after code in a section is the same fault seen from the other side.

Four new self-test fixtures cover them, and the analyser's own docstring had the shape wrong — it showed `@hash` *before* the code — which is corrected: **a block contains its code**, and its attributes and `!!!` are its tail. AGENTS.md now states both rules, and the "adopt it file-by-file" line is gone with them.

**And the sweep it enables: nine files of 337 have errors, all `code-outside-section`.** In order of size: `codex/codex.allspeak` (537 — one large partially-blocked file, plus its `deploy/` copy), `deploy/code/asedit-graph.allspeak` (36, the stale deploy copy — `./deploy-allspeak` refreshes it), **`examples/chemical/parser.allspeak` (19)**, `tools/strike-fixture.allspeak` (10, a fixture and probably deliberate), and then **three files with exactly one error each** — `learn/reader.allspeak`, `tools/asdoc-check-cli.allspeak` and `tools/asdoc-check.allspeak` — where the shape is identical and the fix is one line: the `script X` declaration sits *outside* the first block, when it belongs inside it. `asedit-graph.allspeak` itself is clean, which is the proof the last two turns' work is complete. A further 75 `title-long` warnings are a sweep of their own, not blocking.

**And one gap the rule exposes:** `tools/asdoc-check-cli.allspeak` — the AllSpeak twin, which AGENTS.md says validates the same convention — does not have the new checks yet, so the two analysers currently disagree. It is on the list itself, for the same one-line reason. The analyser is not part of any build workflow, so none of this can break a deploy.

**And the doc-block convention: a block *contains* its code, and the first line is the list title** (2026-10-02). Graham, validating: *"they don't properly follow the convention. Each one should have a brief synopsis for the content list on the left of the Blocks view. Also, in asedit-graph.allspeak, those from block 7 onwards don't actually show any script. Looks like the placement of !!! has gone wrong."* Both exactly right. The shape is **synopsis / `!!` / prose / `@hash` / `@verified` / the code / `!!!`** — the terminator is the *last* line of the section, and the code sits *inside* it. I had written prose then `!!!` then the code, so every block I created closed before its own script and the editor showed it with none. **Seventeen terminators moved**, and the whole file now passes the rule that describes it: every `!!!` is followed, after blank lines, by the next block's `!!` or the end of the file.

**And every block now opens with a title.** The tool's `--json` dump shows each section's `title` — the first `!!` line, which is what the Blocks view lists down the left — and mine were the entire prose paragraph, so the list would have shown sixteen walls of text. Most of them began with a bolded sentence that makes a perfect title, so the fix was to split it off: *"What a draw does, in order"*, *"One path per kind of mark"*, *"A mark has to stay legible at the pane's scale, or it is not a mark"*. A **new block for the mappings** too — `VizPlaceY`/`VizPlaceX` were riding on the window-on-the-picture section, and they are the one place the line-to-y rule lives.

**The instrument that made it findable, and a gap in it.** `python3 tools/asdoc-check.py --json` prints every section's `code_lines` and `title`, so the fault read as *"every block from line 183 on shows code=0"* — one line instead of two thousand. But the analyser itself **accepted** the bad shape, reporting 0 errors; it catches an *orphan* terminator and not a terminator that closes a block before its code. A rule as small as *"`!!!` must be followed by the next `!!` or the end of the file"* would have caught all seventeen, and that rule is now how the fix was checked. **Not added to the tool unasked** — it is shared with other projects, and a new error would start failing their files. Offered.

**The doc blocks, first tranche: 7 sections to 24** (2026-10-02). Graham: *"asedit-graph.allspeak is only partially doc-blocked… it would be good to see what the actual blocks are doing."* The file had one block covering everything from the declarations to the end — some two thirds of it — with a single design preamble holding notes about the source, the rules, the labels, the window and the key. Each of those notes now sits with the code it governs, at the `! ----` banner that was already there, and the preamble is two paragraphs that *point* to them: the window at `VizWindow`, the picture at `VizBuilt`, the marks at the marks pass, the source at `VizSourceMeasure`, the labels at `VizLabelNames`, the gestures at `VizWheel`. A reader looking at a line of the file no longer has to hold the rest of it in their head.

**And the review the convention asks for, which is the point of a doc pass.** Reported rather than fixed where it was not mine to fix:

- **Three dead variables.** `VizKeyTextX` is a leftover from the heat key's older layout, and `VizZoomXW`/`VizZoomYH` from an earlier zoom; nothing reads any of them. Left in place — a review pass reports, it does not tidy.
- **No unreachable labels.** Every label in the file has a caller; checked mechanically rather than by eye.
- **The module's header was mangled, and had been for a while.** Its opening — `!! plotview.allspeak — the run as a picture…` — was glued onto the end of a `!` code comment, with its next two sentences glued onto that, and a *second* copy of the same code comment stranded inside the header block. The header was therefore not a doc-block opening at all, and the harness, which cuts the view out of the module at that header, could not find it: it said *"has no '!! plotview.allspeak' header"*, which is how this surfaced. Un-mangled, with the stranded comment dropped (its twin is where `GraphNone` needs it).
- **A gap in the tooling, which is why the above survived.** `node tools/asedit-check.js` did **not** notice when my scripted edit deleted `GraphNone`, `VizPredict`, `VizPredictJudged` and `VizRemember` — thirty-eight lines — while the calls to them stayed. A `go to` to a label that does not exist compiles, so a missing label is a *runtime* failure and the checker says OK. The harness caught it because it looks for the header; a checker that resolved labels would have caught it in a second. Worth a look.
- **The key's block was still describing the key**, which no longer exists, and its sentence about the boundaries moving with the run is the one that had described the *relative* ramp. It is now the ramp's own block, and the trap it recorded — numbers read out of a trace stay *text*, and text compares lexically, so `9` is not less than `10` — is kept with the source-reading code where it still applies.
- **The design notes were hard-wrapped**, against the convention's one-paragraph-one-line rule, which renders badly in Blocks mode. They are single long lines now.
- Two `info [doc-after-code]` notices remain, both the same shape: the *built once, on the first draw* block sits inside `Draw`'s section rather than opening one, because its banner is a line inside that code. Informational, and the placement reads better where it is.

**And a slip of my own, in the middle of it.** The restructure is a scripted splice, and the splice's range was wider than the prose it was meant to move: it took thirty-eight lines of code with it — the estimate path, `GraphNone` through `VizRemember` — leaving the calls behind. The compiler accepted the result; the *harness* did not, and its complaint ("no '!! plotview.allspeak' header") is what found it. Everything is restored verbatim from `git show HEAD:` and re-verified. The lesson is in the tooling note above, and it is the third time this session that an instrument has caught something reasoning did not.

**Still to do:** the gestures are one section of about 490 lines — the wheel, the pan, the bars, the redraw plumbing and the window's limits. Their inline comments carry the detail, but they would read better as five. Two `verify-stale` sign-offs (the declarations and the boundary). And the three dead variables above are Graham's call.

**The ramp reached blue, violet and magenta and never red — and Graham's screenshot is what showed me** (2026-10-02). The first version of the shading dialled each mark's colour back by the *clock*: `band x steps / maxSteps`. A ramp like that only arrives at the top colour at the very last step of the run, and no mark sits there, so the hottest band was unreachable by construction — a picture showing three quarters of its own range and calling the top of it "the final colour". He read the missing red off a screenshot before I did, which is the second time in two days that measuring the picture beat reasoning about it.

**The fix: the view counts each line's visits itself.** `VizSeen` is a dictionary struck fresh at the top of the mark pass, and every anchor adds one to its line's count *before* the mark is placed — above the test for whether the mark is inside the window, because a line's heat is a fact about the run and panning must not repaint it. The band comes from that count through a **doubling** ladder: one visit is the coldest colour, two to three the next, four to seven the one after, eight or more the hottest. Four equal steps would put a line reached five times at the top of a short run and could not tell a loop that ran eight times from one that ran eight hundred. Every line therefore *starts* blue and its last visit shows *its* final colour, which is what Graham asked for in the first place: *"start all blue and gradually shade towards their final colours at the end of the trace."* On his own recording that gives **line 388 (inside `ReadSymbol`) and line 419 (inside `ReadCount`) red**, the two block labels magenta, and everything reached once blue.

**And that removed the misattribution reported a turn earlier.** The view no longer reads the editor's `line_counts` at all, so a mark's colour cannot disagree with the mark's line — and the `Non-numeric value` alert that fired once per draw for a line the recording had left out of its counts is gone with it, which closes an open item from two turns back. `asviz.js` still keys those counts to a different line from the anchors it writes, and anything else that reads `line_counts` should know it; nothing in the view does now.

**What the graph says about `parser.allspeak`, which is the question he asked.** The heat is the *number of commands executed on a line*, and it concentrates in two places: line 388 (12 visits, 24 executions, **27.6%** of the recorded time) and line 419 (8 visits, **25.2%**) — `ReadSymbol` and `ReadCount`, the two character-by-character parse loops. **Together they are about 53% of the run.** Everything else is spread over eleven lines at 3-12% each, and the marks sit on only 13 of the file's 626 lines. So his reading — *"ReadSymbol is the hottest part by some margin, and activity is fairly evenly distributed elsewhere"* — is right at the top and right about the shape, with one refinement: the margin over `ReadCount` is small, and the work is really in *two* loops rather than one.

**The heat is *executions*, not *time* — and the recording carries time too.** That is the honest caveat on using the picture to choose where to optimise: a line reached 24 times of a cheap command can cost less than one reached four times of an expensive one. But each anchor in the recording carries a `dur`, so per-line *time* is already there — and on this run the time ranking **agrees** with the visit ranking (388 at 27.6%, 419 at 25.2%). Colouring by time instead of by count is available whenever it is wanted.

**Next, and Graham's own suggestion:** *"further data could be expected by hovering over the red dots and seeing what appears in the sidebar yet to be added."* A mark could carry its line number, its visits, its time and its doc-block prose — which is exactly the sidebar's job — and the fact that he reached for it unprompted says the sidebar is the right next step.

**The marks are a ramp now, and the run warms up as you watch** (2026-10-02). Graham: *"I would like the dots to start all blue and gradually shade towards their final colours at the end of the trace … That part of the colour key isn't really needed, and the intermediate colours currently used aren't on a spectrum between blue and red."* Two changes: the four colours are now a spectrum the eye can interpolate — blue, violet, magenta, red, in place of blue/yellow/orange/red — and each mark's colour is its line's heat **dialled back by how early in the run the mark is**, so every line's first mark is the coldest colour however hot the line ends up and a hot line's marks sweep the whole ramp as the run proceeds. `multiply VizBand by VizSteps; divide by VizMaxSteps` — two lines, and they turn a picture of *totals* into a picture of a program *heating up*. **That is also why the heat key had to go**, not merely because he does not want it: a colour meaning "how hot, by when" cannot be labelled with a range of visit counts. The flow key stays, on the same row as the status line, and the caption is gone — it printed the run's line range and step count, both of which the status already carries, so its row is now the status's and the foot of the canvas is a line shorter.

**A fault in the data the colours are drawn from, found while checking them.** The marks come from the recording's *anchor* events and the heat comes from its *line_counts*, and **on the wide recording those two name different lines**: line 209 is visited six times and has no count, while lines 210 and 211 carry a count of six and are never visited. So a mark's colour is its *neighbour's* heat, and the whole heat picture is shifted by a line or two. It is not visible as a fault because a one-line shift in a heat map looks like a heat map — but it may well be part of what made the colours read oddly. The source is `asviz.js`'s `lineTable` and the anchors it feeds: the anchors name the *label's* line, the counts key the *command's* line, and they are one apart by construction. **Worth a look as its own small piece of work**; the harness names the numbers in the phase where it cannot check the climb.

**And a divide by zero the ramp made visible.** `VizBandSize` is `VizMaxCount / 4`, so a run whose busiest line ran fewer than four times divided into an *Infinity*, which the clamp then read as the hottest band — every mark the hottest colour on a short run. It now has a floor of one: one visit, one band.

**The two checks that replaced the key check.** Every mark in the *first quarter* of the run must be the coldest colour — a quarter rather than the third the arithmetic actually allows, because a third is exactly where the rule flips and a mark on the boundary would be in the second layer by the rule and the first by the check. And within a line the colour must never go *backwards* down the ramp as the run proceeds, which a picture coloured by totals would fail outright, since a hot line would be one flat colour. On the short recording: 3 of 9 marks in the first quarter, three layers in use, and one line visibly climbing. On the wide one the climb is unavailable for the reason above, and the check says so rather than passing quietly. 42 checks green on the wide recording, 41 on the short, plus the `--` for the climb and the same two pre-existing failures that are Graham's call.

**Open:** the canvas is 40 units taller than its instruments need — deliberate, per Graham: *"a sidebar is coming that will change the panel's shape, and the height is better chosen then, with the width it will have."* The caption's one job beyond repeating the status was to make a *stale* recording visible, and that signal goes with it. Four `verify-stale` sign-offs. `deploy/code/asedit-graph.allspeak` is behind the root copy.

**Two scrollbars, and they are the window drawn as a proportion** (2026-10-02). Graham's ask: *"Once zoom is greater than 100% it can be hard to visualise which proportion of the total picture is currently visible. So we need vertical and horizontal scrollbars … with a draggable handle of a size that varies according to what proportion is visible (and at 100% is consequently immovable, occupying the entire bar)."* The vertical bar is the lines axis down the right-hand margin, the horizontal is the steps axis along the foot of the frame, and each handle is the window's share of its axis: its **length** is the fraction in view — which is why the fit fills the bar — and its **offset** is how far into the run the window has gone, scaled to the part of the bar the handle can move *along* rather than to the whole bar. That last scaling is the whole of the familiar behaviour: a handle of half the bar can travel half the bar, so the ends of the run put it at the ends of the bar instead of three quarters of the way along. At the fit there is no travel and no room, so a drag moves nothing — immovable because there is nowhere to go, not because a guard says so.

**A press decides what the drag is.** `VizGrab` hit-tests the pointer against the two handles and sets `VizSlide` (0 the picture, 1 the lines bar, 2 the steps bar); `VizDrag` then routes to `VizPan` or to the new `VizSlideTo`, which maps pointer travel to *window* travel by the ratio of the run to the window. Three things fell out of doing it that way and each is worth keeping: the troughs are deliberately **not** hit, so a press beside a handle is the pan the pane always had, and the two boxes sit in different margins so the order of the tests cannot matter; and the whole hit test lives in the *pane's* pick, because the SVG plugin's shapes are not browser elements and the runtime's `on pick` accepts only those, so a `rect` cannot be given a handler of its own. **The instrument for the hit test is the canvas's box, not the pane's** — except that the canvas is an `svg`, and `svg` is the one element type the plugin registers without the `dom` extra, so `the width of` will not compile for it (a limitation the file already documented, and I probed for it before reading that). The pointer is therefore mapped from the panel's corner, less the letterbox, at the fitted scale.

**Two faults in the view, both found by measurement rather than reading.** `VizPixelScale` divided the panel's height by **700**, the canvas the view started with; the canvas has been 740 tall since the forty units went in with the flow key, so **every drag and every wheel had been moving the window 5.7% short of the pointer** — corrected, which changes the *feel* of the pan and the wheels by that much. And the frame-geometry comment claimed the plot ends at 660 and the step labels sat at 664; the code said 640 and I moved the labels to 670 to clear the new steps bar, so the comment now matches the code.

**And one fault of my own, which the log found in a single run.** `VizPixelScale` multiplies `VizPixelsH` in place, and the first version of the hit test read that scaled number as though it were the panel's height — 700,000 pixels — putting every hit 350 pixels out. It is now `VizPaneH` in its own right and `VizPixelsW`/`VizPixelsH` are the panel's two sides, untouched. That is the second time this session that a two-line `log` beat an hour of reasoning; the numbers were copyable and the answer was in them.

**Seven new checks, and the harness itself was the thing to fix.** The bars are checked as a *rule* over all 46 phases — handle length against the caption's span over the run's, position against the window's place in the travel — and then as behaviour: half a bar of pointer travel moves the window half its remaining room (line 27 to 53, 53 predicted), three times the bar reaches the end of the run and stops, a drag at the fit moves nothing, a handle drag moves its axis and leaves the other exactly where it was, and a press on the trough pans both axes. Two things had to change in the harness first: the stub gave **every** element the same box, so the letterbox was always zero and the hit test was never exercised — the panel is now 1440x700 and the canvas is the 946x700 the fit makes of it, **which is what makes the 247-pixel offset part of the fixture** — and the stub had no `getAttribute`, which every real element has. My own check from the previous change also gave a `FAIL` where the fixture cannot see anything (no transfer crosses the frame on the short recording), which now says so rather than claiming a fault.

**Open:** the harness never supplies the `line_counts` the editor sends, so the view alerts `Non-numeric value` once per draw and the heat *bands* are the one thing in the picture no check covers (the marks' positions are covered). The four `verify-stale` sign-offs are at the declarations, the handlers, the draw and the labels' section. `deploy/code/asedit-graph.allspeak` is behind the root copy again.

**The flow is drawn in full and masked, reversing an answer of mine** (2026-10-02). Graham: *"I gave a poor answer a while back to what happens when vertical lines go outside the panel boundary … This should change to the panel displaying all of each line and leaving the existing mask to hide what goes outside."* The answer he is calling poor is the one I offered and he took — *leave the whole segment out, as a mark outside the window already is* — and the fault is that **every answer in that family lost the same information**: a transfer whose other end is off-screen is the one thing a picture of a *sliced* run can only say by showing a line leave the frame. Clamping said it by moving the end onto the border (a line ending on nothing); dropping it said nothing at all.

**So the ends stay where the lines are, and the plot is the mask.** `VizPlot` is a nested `<svg>` over the frame — 60,60 to 940,640, its `viewBox` the same, so one unit inside is one unit outside and *no* coordinate changed — holding the rules, the four mark layers and the three flow layers; the axis, the key, the caption and the status stay outside it, because they live in the margin and a line crossing them would be a line crossing the reader's instruments. The transfer pass now asks only whether a segment *crosses* the window: a transfer wholly above or wholly below is still left out, since it is not in the picture at all. **The mechanism is the one the picture already used** — a nested viewport clips by default, and the plugin has no `clipPath` element — which is what "the existing mask" turned out to mean.

**What the harness had to be restated for, three checks of it.** *"Every mark of every phase is inside the frame"* split in two, because the flow is now *supposed* to leave the frame: everything the frame bounds is still measured against it, and the flow is expected past it in the phases where the run is sliced. *"Every transfer begins and ends on a rule"* became **"at a line's own y"** — a rule is drawn only for lines in view, so it is the right comparison only where the end is inside the frame, and an end beyond the mask must still be at its own line's y. And the count check I first wrote was **wrong and I said so in the code**: on this trace most transfers are wholly outside a thirty-two-row window, so the number drawn falls by design; the evidence is the ends measured outside the frame instead — *"444 ends over 36 phases, 18 of them outside the frame and hidden by the mask"*. A fourth check is structural, because the clipping itself is the renderer's and no runtime check can see it: **the plot is a nested `<svg>` whose viewBox is the frame holding exactly eight paths** (the rules, four mark layers, three flow layers) and nothing else. 34 checks green on the wide recording, 31 on the short one, the 2 known stale expectations unchanged; `asedit-check` 1099 commands / 222 symbols / 0 errors; four packs rebuilt.

**And the drag itself was broken in the runtime, by the same shadowing the click path had already been cured of** (2026-10-02). Graham: *"on this system, click-drag doesn't do anything"* — after a redeploy and a browser reset, so the deployment was not at fault. The cause is three lines in the plugin's `pick` handler: it did `const element = e.target ? e.target : e.srcElement` inside a function whose parameter is *already* the attached element, **shadowing it**. The press lands on whatever is under the pointer — inside the Graph pane that is the `<svg>`, a child of the `div` the script attached — and `pickIndex`, `mouseDownPc` and `blur()` all belong to the *attached* element. **An SVG element has no `blur`**, so `element.blur()` threw, the handler aborted, and `document.onmousemove` — the whole of where a drag comes from — was never installed. The pick's own `program.run` is below the throw, so the grab never ran either. Nothing the user could do would move the picture, and the wheel kept working because it is a different path.

**The precedent is in the same file, which is what makes it certain.** `on click` had already met this: it guards `typeof eventTarget.blur === 'function'` and carefully distinguishes `eventTarget` from `boundTarget`. The cure went into one handler and not the other, and the surviving one silently killed the pane's drag. Both branches are fixed now (mouse and touch), and the pick acts on the attached element for `blur`, `pickIndex` and `mouseDownPc` while the offsets stay on the target.

**And the check that found it needed its fixture corrected first.** `various/drag-check.js` passed on the broken code because it pressed *on the bound element* — so the handler found everything where it looked — and because my element stub gave the child a `blur()` that an SVG child does not have. Two fixture faults, both of the same kind the evening had already charged twice for: **a fixture that is kinder than reality hides the fault it was written for**. With the target a bare `{ tagName: 'svg' }` the harness reports `TypeError: element.blur is not a function` at the mousedown, and with the fix it reports *"program A: moves=1 picks=1 ... program B: moves=1 picks=0"* — the pressed program arms the drag, and both programs receive the move and the release.

**The label names are kept, and the gesture scheme is simplified** (2026-10-02, Graham's verdict and his correction). His verdict on the alignment: *"All the labels are now in perfect alignment"* — and then: *"I can see no good reason to remove the indigo labels, as they don't collide with anything else and actualy help with navigation."* So they are a **feature** now, not a diagnostic: `VizLabelNotes` became `VizLabelNames`, the comments say why it stays (it settled the alignment, then caught the row-placement fault, and a column of names down the edge navigates a long file), and two things changed at his request — **the colons are dropped**, the name being a signpost rather than a line of code, and **the rule for a label's line stops one em short of the name** so the two read as a signpost beside the line rather than as one long line with a word on the end. The label test itself is now one routine (`VizLabelCheck`), because two things ask: the rules for that gap, and the names themselves.

**His correction to the gestures, and it is a good one.** *"I've placed over-emphasis on the use of modifier keys … for panning I found myself wanting to mouse click/drag as this seems to be the natural instinct."* So **shift+control+wheel is parked** — ignored, deliberately not deleted, because deleting the special case restores the accidental both-axes zoom the plain arithmetic gives. `VizScrollAcross` and `VizScroll`'s second axis are still standing with a comment saying so; restoring the gesture is the three lines that set the flags, and **nothing else in the file refers to them**. The drag is unchanged and is now the way the run is moved. **The blank-row collapsing is parked by Graham's own decision, with his reason:** *"the blank rows are the file's own structure … collapsing them also makes the axis a non-linear scale, which is a real loss in a picture whose whole job is to say where a line is."*

**And the drag needed a runtime fix, which is the same fault the editor had been carrying.** `on drag` and `on drop` kept their pc in a single `document.mouseMovePc` / `mouseUpPc`, so **a second program registering a drag silently took the handler from the first** — which is what happened when the Graph pane became a module: the module registers its own drag for panning, over the editor's own handler for the **Blocks divider**, and one of the two then did nothing. The module's own comment ("each ignores the mode it is not in") was only true if both ran. Each program now keeps its own pc and they are all run, exactly as `on key` has always done. **Found by reading, and the fix was verified by a new harness** — `various/drag-check.js`, which runs *two* programs, presses on one of them, moves, and requires **both** to have received the move and the release: one program would pass on the broken code, which is the whole reason to write it. **The harness caught a fault in my own fix first** (`action` is not in scope in the runtime's `run`, so the patch crashed every drag outright — a worse bug than the one it fixed), and with the single-pc form put back it reports six failures. `asedit-check` 1089 commands / 221 symbols / 0 errors, `asedit-modes-check` all pass, 33 checks green on the wide recording with only the 2 known stale expectations, four packs rebuilt, `./build-allspeak` run for the runtime fix.

**The label layer, for the record.** `VizLabelNames` copies every *label* line of the script into its own picture — `VizLabelText`, one `<image>` in the canvas rather than a pool of text elements, because at the widest zoom every label in a file is on screen — right-aligned at the frame's right edge, in the source's font size scaled to the frame and on the baseline the source's own rows use, in a strong indigo that the drawing uses nowhere else. The same string then appears twice on a row: once where the *picture* puts it and once where the *drawing's* mapping puts it. If the two mappings agree the copies sit level; if they disagree, the copies show the misalignment as visible drift. **A label is found in the script as a line at the left margin whose last character is a colon** — the pane is given the script as text and nothing else, and the recording carries no label names (its anchors are the `viz` markers) — with doc blocks, indented lines and `!` comments excluded, which the harness now tests against all four shapes. **It draws nothing when the copy would be under four units** (at the fit the source's own text is two units a line) and *clears* the layer in that case, because an annotation left behind by a zoom is a stale artefact and a stale artefact in a diagnostic is a wrong answer. That threshold is why the fixture's label cases sit at lines 150-153: the phases only reach a legible zoom around 140-247, and a case the phases never look at is a case a check only appears to cover. Verified: *"the diagnostic names the fixture's label wherever the copy is legible, at the frame's edge and on the y the drawing gives that line (2 note(s) over 2 phase(s))"*, with all four near-misses correctly unnamed; `asedit-check` 1062 commands / 216 symbols / 0 errors; 35 checks green on the wide recording, 32 on the short one.

**What remains unmeasured, and what the copies should settle.** The rules, the marks and the axis labels are one mapping now, and the measurement on the 23:10 screenshot says that the mapping agrees with the text rows — so whatever is left is either (a) the *graph as a body* offset from the text by a constant, (b) something about the **marks' x** against the text, where there is deliberately no relation (the x axis is *when*, the text is *where*), or (c) something the instrument cannot see. **The diagnostic is the instrument for (a)**: identical strings, identical font, one drawn by each mapping, and the drift between them *is* the remaining fault — and it will be measurable from a screenshot by eye, or by `various/viz-align-measure.py` once the copies are there to be found. It comes out again when the question is settled.

**The instrument is `various/viz-align-measure.py`** (untracked, with the rest of `various/`), and it is what found the half row. It measures a screenshot's own grid and prints it — the frame, the y-axis labels (which give the pitch: 20 lines apart by construction), the glyph rows, the rules, and each rule's y against the glyph row it belongs to — then, given the script and its recording, each rule's left end against `8·length + 1em`. **It needs the top label's value on the command line** (338 in the screenshot), because the labels cannot be read from an image without OCR; that number and the pitch are the two to re-check first if its output looks wrong. Verified against a known answer: on the 23:10 screenshot it reports **16 of 17 rules within ±1 px** and the 17th 17 px out from a flow line drawn over it. **Its colour assumptions are theme-dependent** and are printed with every run.

**The rules are leaders, and the flow is drawn only where it is complete** (2026-10-01, from Graham's second look at the screenshot; his two items, both landed). **A rule now begins one em past the last character of the line it names and runs to the frame's right edge**, instead of from the frame's left edge across the code — it points at its line rather than striking through it, which matters most for the indentation and the first word. **And a transfer is drawn only when both its ends are in the window**: one that reached outside used to be kept and clamped to the frame's border, which put its end on a border rather than on a rule — his "the vertical lines should each begin and end on a horizontal line", and the check now quantifies the old fault at **126 ends landing on `y=640`** across the phases. The head's wings are excluded from that claim, being a chevron's shape rather than a place the flow goes.

**One case cannot be led from, and it has a stated fallback.** When a line's own text reaches the frame's edge — only at a deep zoom, and only for the longest lines in a file — there is nowhere *after* it for a rule to begin, and a rule starting off the frame would leave its mark with no line to sit on, which is the one thing a rule is for. Those lines keep the rule they had, from the left edge: what it crosses is already cut off, so crossing costs nothing there. Exercised on purpose — the harness fixture's line 179 is named by the recording, in the window at the legible floor, and 204 columns wide, so the branch runs and the count says how often.

**The pane's mapping is now computed at the top of the draw, and that was not cosmetic.** A rule's left end needs `VizWindowW` — the document-to-frame factor — and it used to be computed inside `VizSourcePicture`, which is the *last* thing a draw does: a rule reading it would have been reading the draw before, which is the trap this file has paid for twice already (the size of a mark, and a value measured before the pass that measures it). It now sits at `VizWindow`, right after the clamp, where both the pane and the rules can have it.

**Verified by seven checks, two of which are new claims and three of which fail on the previous view.** `various/plotview-check.js` now reads each rule as `M x y h width` and each transfer's segment ends, and asserts: every transfer begins and ends on a rule (418 ends over 36 phases, checked by **y** in every phase — which is Graham's own refinement, "if a vertical line starts or ends inside the text itself, it stops where the horizontal line would have been", so the claim is about height and not about whether the rule reaches that far across); the transfers that reach outside are left out rather than clamped; every rule begins one em past the code on the line it names (1377 rules over all phases, worst 1.0 unit out) with the too-wide fallback counted; and every rule reaches the frame's right edge. **Against the previous view the same harness reports 126 clamped ends and a rule's left end 757 units from where its line's text ends** — the two faults, as numbers. The frame constants moved to the top of that file, since the rules' geometry needs them where the flow is checked. `asedit-check` 1009 commands / 207 symbols / 0 errors, `asedit-modes-check` all pass, four packs rebuilt, 33 checks green on the wide recording and 31 on the short one.

**Two prose faults fixed on the way**, both older than this change: the rules' intro comment still said the rules came from the window's per-line *counts* (the 13:31 fix moved them to the lines the recording *names*), and `VizSourcePicture`'s comment claimed a width it no longer computes.

**Doc blocks are no longer drawn in the picture** (2026-10-01, Graham's ask; the screenshot he took of `examples/chemical/parser.allspeak` shows what it was for). Every line of the file keeps its row, and a line belonging to a doc block — the `!!` prose, the `@hash`/`@verified` pair, the `!!!` terminator — is drawn as an empty row. **Blanked rather than skipped is the whole of the care taken:** the rows are what the axis, the rules and the marks line up with, so the pane's numbering still matches the editor's, which is what makes a mark and a line two statements of the same thing. Skipping a doc line would renumber the file from its first block onwards. **A bare `!` comment stays**, by Graham's choice between three readings of "all doc blocks": it is a note to the line beside it rather than a block.

**The predicate is the analyser's own, checked rather than assumed.** `starts with \`!!\`` gives exactly the count `asdoc-check.py`'s doc-line rule gives — `^!![ \t]`, the bare `!!`, the `!!!` — on all three files that matter: **178 of 626 rows blank in `parser.allspeak`, 153 of 1805 in `asedit.allspeak`, 96 of 1593 in the module**. Nothing is over- or under-blanked, and there is no indented `!!` anywhere in the repo for a column-0 test to miss. Verified by three new harness checks over two recordings — the doc line blank *and* one row per line, a bare `!` comment drawn as it is, and the line after a doc block still on its own row — plus `asedit-check` 989 commands / 204 symbols / 0 errors, `asedit-modes-check` all pass and the four packs rebuilt. **Judged by the harness only so far**: the picture over a real file in a browser is the thing the ask was about, and it is Graham's to look at.

**Horizontal scrolling is in, and the script is anchored to the left edge** (2026-10-01, this session). The pane had no way of moving along the run's *time* axis but a drag; it has one now — **both modifiers with the wheel scroll the steps**, taking the combination that used to be the two zooms at once. That pair was an accident of `VizWheel`'s arithmetic (shift set one flag, control the other, and `VizZoom` applied whatever it was given) rather than a gesture anybody chose, so it is the pair that pays: `VizWheel` now normalizes it — clears both zoom flags, points `VizScrollAcross` across — before the existing test sorts the notch into a scroll or a zoom, so each of those still reads one flag and no second dispatch was added. `VizScroll` gained the axis as a variable rather than a second copy: the step is a quarter of the window on *that* axis, and the sign rule and the clamp are unchanged. Graham's call between two options: drop the both-axes zoom rather than move it to Alt+wheel.

**And the source no longer slides sideways, which is the half with consequences.** Its horizontal offset in the document was derived from the step window — `VizWindowX = (glyphWidth − windowW) × VizViewX0 / VizMaxSteps` — so panning along the run, and the centring inside every horizontal zoom, dragged the source with it and took the indentation and the first word out of view. The window's `x` is now always zero. **The price is stated in the module rather than left to be discovered:** a line wider than the frame is cut off at the right, and the frame shows about a hundred and ten columns at the legible floor (873 units ÷ 8 a column), so most source lines fit and a few do not. The sidebar is where a long line should be read in full, and that is now the reason for the sidebar work rather than a nice-to-have.

**Verified by three instruments, and the split between them matters.** `various/plotview-check.js` gained two phases (a shift+control notch across and back), an axis check that it moves the *steps* and not the lines, a check that it moves the window **on** — read from the status line's `steps a-b`, because the `viewBox` answers to the lines alone, which is the mistake that once hid every horizontal notch — and a check that the source's window is `x=0` in all 36 phases. Its fixture's longest line is now 164 columns, deliberately wider than the frame can show, because a narrower document cannot tell an anchored source from a sliding one. **Run against the previous view the same harness fails all of these and passes all of them against this one**, and with the new phases stripped out the two views' reports differ in **one thing only**: the pane's window `x`, which was `19, 77, 102, 102, 102, 154, 177` in the old view and `0` everywhere now. Every other line of the report — marks, rules, labels, bounds, the source document, the check results — is identical. `node tools/asedit-check.js asedit-graph.allspeak` → 987 commands / 204 symbols / 0 errors; `asedit-modes-check.js` all checks pass; `./build-starters` rebuilt the four packs.

**The one thing no check here can settle: whether the browser delivers a wheel with both modifiers set.** The runtime half is proved — `the wheel shift` and `the wheel control` are both readable and `various/wheel-check.js` already fires all three modifier cases in four languages — and the axis being collapsed into one signed amount is *fine* for a scroll, which needs only the sign. But there is no browser in this workspace (playwright is a devDependency and `node_modules` is absent), so whether Chrome/Firefox hand a Ctrl+Shift+wheel event to the pane at all, rather than claiming it for page zoom, is a one-minute test in Graham's browser. If it does not arrive, Shift+wheel alone is the conventional fallback and would mean moving the vertical zoom.

**Three `verify-stale` sign-offs**, all of them the sections this change touched or revealed: the gestures block and the draw block (both refreshed hashes that had been stale *since the module extraction* — `--write` refreshed them, and their `@verified` marks now say so), and the view's own section. Refreshing a stale `@hash` is what `--write` does; the `@verified` warning is the honest signal and is Graham's.

**The Graph pane is a companion module** (2026-10-01). `asedit.allspeak` is 1,804 lines instead of 3,141 and the drawing lives in `asedit-graph.allspeak`: fetched with `rest get`, compiled and run on the first click on **Graph** (`run <source> as VizModule` — the JS dialect compiles the *text*, not a path), and messaged from then on. The module declares `VizHost` and `StatusSpan` and attaches both **by id** from `asedit.json`, registers its own gestures (pan/zoom never cross a message — a round trip per drag event is the thing the modularisation guidance rules out), and owns the calibration file, the estimate and the status line. One dict crosses, when a run is opened: the recording's text, the script's text, the three localised flow words, and the path the recording was expected at. The editor names no `svg` vocabulary any more (verified: 0 hits, 29 in the module), and the page still loads the plugin because the pane is compiled when fetched. **`various/plotview.allspeak` is deleted** — the harness cuts the view out of the module at its doc-block header instead, so the "two copies of the view" trap is closed for good. Verified: both files compile (1,355 + 966 commands), `asedit-modes-check` passes with four new boundary checks, `plotview-check`'s report is byte-identical to the pre-extraction view's, hashes refreshed, packs rebuilt with the module inside them. **Not shipped:** `deploy/code/` waits for the next `./deploy-allspeak` (the `cp` list and `server.allspeak`'s update list both name the module now).

**Two things that cost time and are worth keeping** (2026-10-01). **`or` on a `rest get` stops the thread** — a failure clause that only sets a default ends the entry, which is how the pane came to be sent nothing at all: the entry read the recording with `or put '' into TraceText` and never reached the send. The fix is to default first and point the clause at the send (`or go VizSendTheRun`). **And `on failure` compiles identically to `or` in the JS `rest` domain** — the clause is followed by a `stop` — so `learn/reference/10-errors-and-recovery.md`'s "…then resumes at the next statement" is wrong for `rest`; either the doc or the domain wants aligning. Second: a **late `open` after leaving the pane**, because both fetches hand control back to the event loop and a click can land in between — `SendRunToViz` now checks `GraphMode` first, and the harness has a check for exactly that race.

**Two stray doc-block tails in the module, found by Graham in Blocks mode** (2026-10-01). He saw **8 blocks**
where there should be seven, the first empty and the last showing nothing when clicked. Both were structure left
behind by the extraction, not faults in Blocks mode: the `script ASEditorGraph` line (and the `!` comment above
it) sat *after* the header block's `!!!`, so the file's own block was empty and the title lived in no block at
all; and the file ended with `!! @verified fefa5a95` and a `!!!` with no code between them and no `@hash` — a
block whose code was moved out and whose tail stayed. **The editor's own file keeps its `script` line inside its
header block**, which is the shape to copy. Fixed: 8 sections → 7, 0 errors, module unchanged at 975 commands.
The first block now has a `@hash` and wants a `@verified`; lines 76 and 114 carry two pre-existing `verify-stale`
sign-offs from the extraction.

**The vertical axis is the recording's span, and a reader may reasonably expect the file's** (2026-10-01).
Graham, viewing `examples/chemical/parser.allspeak` (626 lines): the axis reads **206-482 at 100%**, and he
asked whether it means something else. It does not — `VizMinLine`/`VizMaxLine` are computed from the *trace's
events*, so the axis names the lines the **run executed**, by their real numbers, and the fit shows the whole
*recording*. So 206-482 says the run never entered the rest of the file, and the caption says the same range,
which is why the pane is consistent with itself. **What is missing is any sign that the file is longer.** The
choice is his and is recorded as unanswered: draw the whole file with unrun lines blank (axis 1-626, taller
picture, space spent on code the run never touched) or leave it as the run's span.

**The wheel: a second fault, not yet found, and the logs are out** (2026-10-01). The `VizRequest` fix went in
and the wheel still blocks after a single event. **Three suspects died by reading, and all three are worth
keeping:** a lost `wait` continuation (`Wait.run` captures `command.pc + 1` in its closure, so a suspended
program survives a handler running in between); a handler's `return` popping a suspended draw's `programStack`
frame (`completeHandler` ends an action with a compiler-inserted **`stop`**, not a `return`); and `stop` ending
the program (`Stop.run` returns 0, ending that run and leaving nothing set). **Four `log` lines are now in the
module and Graham has been asked to quote them** — `viz: draw start` / `viz: draw end` / `viz: wheel reaches the
handler` / `viz: request deferred, a draw is running`. That set distinguishes the gesture never arriving from
the draw dying mid-flight, which is the fork the four readings could not settle. **Remove them once the fault is
named.**

**The wheel was never broken — the window was at the end of the recording** (2026-10-01, Graham's logs).
Four `log` lines settled it in one paste: **every `draw start` had a `draw end`**, gestures reached the handler
throughout, and from a certain point the handler ran while `VizRequest` was never reached — meaning `VizMoved`
was 0 and the window was not changing. That is the **clamp holding at line 482, the end of the recording**, while
he asked for 555+ of a **626-line file**. So the `VizRequest` fix was working, the gesture was applied, and the
only fault was that the pane had nothing there to show. **The lesson, and it is the third time it has paid:** a
log in the code answered in one round what three readings of the runtime could not. The logs are removed again.

**The picture is now the whole file (Graham's call).** `VizMinLine`/`VizMaxLine` became the *file's* extent
(1..`VizSourceCount`) instead of the recording's, so the picture draws every line, the axis is 1..N, the window
can travel the whole file, and a stretch with no marks reads as a stretch that did not run. The **caption keeps
the recording's range** (`VizRunMinLine`/`VizRunMaxLine`), so the difference between "the run touched 206-482"
and "the file is 626 lines" is visible by comparing the two — which is exactly what he wanted it to show. A new
picture re-fits the window (`VizPictureFresh` calls `VizReset`), because editing the script moves the extent.

**The scroll had no direction, and the harness had no check for one** (2026-10-01, Graham). `VizScroll`
divided the window by four and **added** it, reading the wheel's amount but never its sign — so every notch
went the same way down the file, which is "the page scrolls up whichever way I roll". The zoom always tested
its sign; the scroll did not. Fixed with one line (`if VizWheelAmount is less than 0 take VizMove from 0 giving
VizMove`). **The harness could not have caught it:** its scroll check asks whether a scroll *moved* the picture,
never *which way*. A direction check is now the first thing to add there.

**The extent change is proved, and the remaining harness failures are its stale expectations.** Repairing the
fixture (`SetBriefSource` had been collapsing a 260-line source to **one line**, breaking the fixture's own
rule that it must be long enough to name every line the recording references — a one-line file with a
twenty-line trace has no rows for marks to sit on) turned the failures from noise into numbers:

| after | window fitted to |
|--|--|
| the 260-line script | `0 0 7100 4680` — 260 × 18 |
| the edited script | `0 0 7128 4698` — 261 × 18 |

So the picture is the whole file, the extent tracks the line count, and an edit re-fits (`VizPictureFresh`'s
`VizReset`). **Three failures remain and all three are the harness's old model**: it expects the window to be
*kept* across a script edit (the old behaviour, deliberately not the new one) and computes its "a fit would be"
from the original source while the phase runs against the edited one. Rewriting those expectations, plus a
check that a row sits on the line the axis names *inside the window*, is the next work.

**Unverified, and the harness disagrees: read this before trusting it.** `plotview-check.js` reports **four
failures** and they look like its *fixture*: `SetBriefSource` replaces a **260-line** source with a **1-line**
one while the trace still names lines 25-44, so the phase asks about a one-line file holding a twenty-line
recording, and a file shorter than the window's 32-row floor also trips a **pre-existing** clamp edge case
(reported window `0 -54 109 72`). The file-shaped phases pass, including the row-against-axis check. **Fix the
fixture first** (edit a file-shaped source — one line longer — rather than collapsing it) and then the clamp's
floor for files under 32 lines. If the extent change proves wrong, the revert is small: take `VizMinLine`/
`VizMaxLine` from the trace scan again and drop the two lines in `VizSourceMeasure`.

**The harness gap that let both through, and it is the real lesson.** Neither harness fires an *event handler*:
`plotview-check.js` and `asedit-modes-check.js` both call the *label* (`entry('VizWheel')`,
`program.symbols['ToggleGraph'].pc`), so the `on wheel … begin … end` path — the one the browser actually uses,
with its compiler-inserted `stop` and its interaction with a suspended program — **has never been run by any
check.** A harness phase that does `program.run(program.onWheel)` twice, with `document.wheelAmount` set, is the
first thing to add once the fault is known.

**The check that would have caught it is not the one I used.** Counting `@hash` lines against `@verified` lines
over a whole file comes out *balanced* when one block has an orphaned tail and another has a block with no
verify at all — which is exactly the pair here. **`asdoc-check` should warn on a block that holds `@hash`/
`@verified` but no code**, which is a one-line addition and would name the real fault. Not done yet.

**The wheel fix: the gesture must never be what waits** (2026-10-01). Graham: at 575% Y zoom he could not
scroll past about line 420, and the wheel was *ignored after a few moves* — recovering for a single movement
after a pause. **One cause, and it was the guard, not the browser.** `VizWheel` and `VizPan` both returned at
once when `VizDrawing` was set, so every gesture arriving during a draw was *discarded* — and a draw on a big
recording takes a good while, so the input was being thrown away for as long as it ran. The diagnosis that felt
right first (an event *losing* a suspended draw) is wrong, and it is worth knowing why: **`wait` captures its
own pc** (`setTimeout(() => program.run(command.pc + 1))`), so a suspended draw resumes on its own timer after a
handler has run, and the flag always clears. Nothing was lost; the gesture was refused.

**The fix: `VizRequest` is the single way a draw is asked for.** Running already? Set `VizPending` and return;
`Draw` serves it on the way out, once. So a burst of notches costs one more draw, which reads the window as it
stands *then*. Safe because only one draw is ever in flight (the shared scratch the passes build in), because a
suspended draw resumes, and because the buffer is the variables. `VizDrawRun` no longer times a request it did
not wait for. **Compiles (module 975 commands, 202 symbols), picture byte-identical, both harnesses green — but
not behaviourally asserted:** no check fires a gesture while `VizDrawing` is set, which is the only state this
is about. The check wants a host-side label in the harness's prologue (set `VizDrawing`, fire `VizWheel`, assert
the window moved and `VizPending` is set). **That is the first thing to add.**

**And the section-cut trap bit again, in the same way as `StrFlow*`:** `VizPending` is declared at the *top* of
the module because `VizDrawRun` uses it before any view declaration would — the compiler is single-pass — and
the harness cuts the view out of the module at its header, so the cut carries no top declarations. The harness's
prelude names `VizPending` alongside `StrFlowCall/Jump/Return` for that reason. **Anything the view reads that
is declared at the module's top has to be added there.**

**A pre-existing wart, not fixed:** opening the editor **on itself** puts `problem | script= | Script 'ASEditor' is already running.` on the status line, because the analysis compiles the buffer and the runtime's `Script` compile refuses a second program with the same `script` name. It is what the status line says when reviewing the editor in itself, which is how Graham works.

**The house style is written down, in four languages** (2026-10-01). `learn/reference/21-house-style.md` is new — `begin` and `end` on their own lines (the one exception being `else begin`, and `then begin` where `then` opens a block), and how a long statement is split: **a join that fits comfortably on one line stays on one line**, and the advice is for the builds that would wrap in a narrow editor pane or a diff. Where one is broken, it is broken before the joining word (`cat`, `and`, `or`, `with`), continuation one indent deeper, one fragment per line. Graham's rule, and a recommendation rather than a rule the compiler enforces — his correction after the first draft made it the other way round. Every example on the page was compiled with its own language pack — 28 blocks across EN/FR/IT/DE, plus the 8 examples on the `cat` idiom page — and `tools/learn-link-check.py` is clean. `reference/02-symbols-and-layout.md` now leads with the house form and points at the page, `09-control-flow.md` points at it too, and `idioms/01-cat-and-string-building.md` leaves its short build on one line and shows the six-fragment one split. **Translations carry it as item `20.` in their own contents lists** because their reference list has no `20-graphics`; the file is `21-house-style.md` everywhere. `./deploy-sync` has run, so `deploy/learn/` is in step.

**And `then` turns out to belong to `run` alone** — the finding behind that exception. `then` is a word in all four packs, but the only grammar that uses it is `run {script} with {imports} then {handler}`; `if … then` and `while … then` are rejected by both runtimes with *I don't understand 'then'*, although both compilers call the `if` body "the 'then' code" in their comments — which is probably where the impression that `if … then` exists came from. **`nowait` and `then` are JS-only on `run`:** the Python `k_run` implements neither, while the packs advertise both (`run {script} with {imports} dann {handler}`, `Sansattente`, `ohnewarten`). A gap to close in the Python runtime, not a documentation problem.

**The editor's guards, simplified** (2026-10-01). Ten `if`s became one where two guards said the same thing: `VizRemember`'s `TraceSize`/`DrawMillis` pair (Graham's), `VizPan`'s `VizDrawing`/`VizGrabbed` pair, and `PollFile`'s two mode guards, whose two comments folded into one statement of the rule. A fourth case was the same family under a different operator: the axis placed each of eight tick labels as `if <past the margin>` / `begin` / `if <inside the plot> set its text` / `end`, which is `and`, not `or` — each collapse drops a `begin`/`end`, and they are **the first places in asedit that split a condition onto a continuation line**, at Graham's suggestion. Net −17 lines. `asedit` compiles at 2008 commands, 359 symbols, 0 errors, and `various/plotview-check.js` reports a **byte-identical picture** before and after, on two recordings. Three sections want a re-verify (`PollFile`, the Graph-mode section holding `VizRemember`, and the view holding the axis and `VizPan`). Same-shape pairs left alone in `resources/ecs/*`, `tools/asdoc-check*.allspeak`, `chat/chat-main.allspeak`, `codex/en/code/step18.allspeak` and `resources/scripts/solitaire.allspeak`.

**A harness finding worth keeping:** `various/plotview-check.js`'s two *escaping* checks look for source lines 30–31 of its own fixture, so they **fail on any trace whose line span excludes them** — they fail on `examples/chemical/parser.allspeak.viz.json` (span 205–480) and pass on a window that covers them. Trace-dependent, not code: the same two fail identically before and after the change above, which is how they were caught. The fix is for those checks to assert on lines inside the trace's own span.

**The visualiser is in the editor and working.** `asedit.allspeak` has a **Graph** pane: a third view fed by a
run recording, drawn in AllSpeak with the `svg` plugin. It gained the **heat** (the marks coloured by how
much work each line carried, four bands, now the only scheme), a **caption** naming the run it drew,
**yielding** every hundred marks so a long draw cannot freeze the browser, and a **prediction** of how long
a draw will take — learned from the previous one and kept in `.viz-calibration.json` (gitignored,
per-machine). It also gained the **JSON prettify** on open (one-line files only) and the `Marks`/`Heat`
toggle was **folded away** on Graham's call, so there are two buttons for two panes. Since 2026-09-30 it also
shows a **window on the run** rather than the whole of it — wheel alone scrolls, shift-wheel zooms the
lines, control-wheel the steps, and a drag pans — and draws **the source itself behind the heat**, so a mark
says what ran rather than only that something did.

**Corrected this session — the "stale copy" diagnosis did not fit Graham's page.** He runs the editor at
`http://localhost:8080/edit.html`, served from the **repo root** by the `allspeak server` started there, and
its `/asedit.allspeak` is **byte-identical to the root file** (both `bbd58e04…`, 82,668 bytes). So the root
copy is what he sees, always: `./deploy-sync` was never needed for him, and `deploy-sync` in any case does
**not** touch `deploy/code/` (only `deploy-allspeak` step 3, `cp asedit.allspeak … deploy/code/`, does).
The stale copy is real but it is the **live site's**: `https://allspeak.ai/code/asedit.allspeak` is
**byte-identical to `deploy/code/asedit.allspeak`** — 77,488 bytes, **no `Heat` anywhere** — i.e. the editor
published at allspeak.ai/code is the one from the 19:03 deploy, and it is what anybody off this machine
gets. Reachable locally too, one URL away: `localhost:8080/deploy/code/edit.html` runs that same old copy.

**The tiny dots on a return to Graph are diagnosed and fixed — and it was never the cap.** The two
renders differ in exactly one thing: `stroke-width`, **14 on the first draw and 3 on every redraw**.
Measured by running the view once and twice through the harness and diffing the serialised SVG: the five
mark paths and the axis are otherwise byte-identical, caps included in both. The cause is an
order-of-passes fault in `VizBuilt`: the size was computed in the per-draw block at the *top* of the pass,
which is before pass one has measured the span, so the first draw divided `VizPlotH` by an empty
`VizSpanLines` (Infinity → the ceiling, 14) and each redraw divided it by the *previous* draw's span
(580/249 = 2 → the floor, 3). Hence "right the first time, tiny from the second onwards", in his words and
now in the arithmetic. Fixed by computing the size after `VizSpanLines` is known and dropping the
row-proportional rule that produced the 3: it only ever applied to spans of 41–193 lines (shorter ones
were clamped up to 14 anyway), and on a long run a row is about two units, so its floor was a pinprick by
construction. One size, 14 — which is what the first draw has always shown him. The per-draw block at the
top is now purely a reset, and the invariant is worth keeping: **nothing before pass one may depend on what
pass one measures.** Verified: first draw and redraw are now byte-identical, his recording still draws 44
arrivals and 99 transfers, the fixture is unchanged, and `asedit` compiles at 1656 commands, 0 errors.

**The harness puzzle is solved, and it was the yield — not the trace.** `wait 1 millis` resumes from a
timer, so `AllSpeak_Run.run` returns with the picture half drawn; the harness reported in that same tick,
before the rest arrived. Graham's 147 events cross the hundred-mark yield threshold, a nine-event fixture
never does, and his browser is fine because yielding is what it is for. With the report moved to a settle
detector, his recording draws **44 arrivals (15+9+8+12) and 99 transfers** — and the inert
`VizArrivalDots` path stays empty in the same run, which is the evidence that deleting it was safe.

**The fold is finished** (2026-09-29): the inert plain marks path, `VizArrivals`, the two `set attribute d`
lines that wrote it, the dead `if VizBands is 1` / `if VizBands is greater than 1` guards and the duplicated
string-clearing at the top of pass two are all gone — 1656 commands down to **1635**, 286 symbols to 284.
Proved rather than assumed: the old view (commit `e4106ff`) and the new one were run against the same trace
and their serialised SVG diffed — the only difference is the removed `<path id="ec-VizArrivalDots-0">`, with
every shared element byte-identical. `VizBands` stays as the one statement of the band count, which the
band-size division uses.

**The legend is done** (2026-09-29): four swatches in the ramp's own colours on the caption's line, each
beside the counts its band covers, computed per draw from `VizMaxCount / VizBands` — `1-5  6-11  12-17  18+`
for Graham's recording, and `0-0  1-1  2-2  3+` for a fixture where nothing ran twice, which is the case
that shows the key describing the mark loop's own boundary rather than decorating it. 1716 commands,
0 analysis errors, 25 elements where there were 17.

**The wheel event is in** (2026-09-30), because zoom needs it and the language had no wheel event at all.
`on wheel <Element>` in `js/allspeak/Browser.js`, element-scoped on purpose: its whole use is to take over
the gesture *on a pane*, and a zoom that scrolled the page underneath would be unusable, so the listener
is registered `{passive: false}` and calls `preventDefault`. Two values come with it — `the wheel amount`
(signed, away from the user is positive) and `the wheel position` (x/y, the point a zoom keeps still) —
which is what the pick/drag pair already does for their gestures. Words added to all four packs (`wheel`:
`molette`/`rotella`/`Mausrad|mausrad`; `amount`: `quantité|quantite`/`quantità|quantita`/`Menge|menge`, the
fr/it/de forms **provisional and for native review**, as the `viz` option words were), `./sync-language-packs`
run, `resources/doc/en/browser.json` updated, and `./build-allspeak` rebuilt so the editor's own page can
use it. Verified by a new scratch harness, `various/wheel-check.js`: it attaches a pane, registers the event,
fires a synthetic wheel event and reports what the handler saw — **all four languages** attach, run, read
amount `-120` and position `300,42`, and call `preventDefault`. `asedit` still compiles at 1716 commands,
0 errors.

**Two traps found while building it, both worth knowing beyond this event.** `nextIsWord(canonical)`
advances *before* it answers, so two of them in a row test the token after the one being read and walk past
the value's last word — the failure reads as `Undefined value: 'the'` on a whole expression, which points at
the wrong thing entirely. Use `peek()` and check. And a local form can stand for more than one canonical
word — Italian `posizione` is both `position` and `location` — so `reverseWord` is ambiguous and the form
test has to be `matchesWord`, which is what `isWord` uses.

**And one thing about handlers in general, met while testing:** the compiler appends an `exit` to every
program, and `AllSpeak_Run.exit` deletes every binding on the program object — `run` included. So **an event
handler registered by a script whose flow then ends is dead**: the editor only works because its poll loop
keeps the program alive. The harness now ends with a `wait` for that reason, and it is worth knowing before
anyone writes a script that is nothing but handlers.

**The off-screen buffer's element is in: `svgimage`** (2026-09-30). An SVG `<image>` element in
`js/plugins/svg.js`, wired at every site a declared element type needs — and the count is worth keeping,
because **a site left out fails silently**: the declaration handler, `create`'s compile list, the keyword →
tag mapping, the create-time location bookkeeping, `Move`'s compile *and* its two runtime case lists (a
group's children and a standalone element), and `getHandler`. Two of those were missed on the first pass and
caught only by the new check.

It is called **`svgimage`, not `image`**, because `image` is already the browser domain's HTML `<img>` and the
browser domain wins the token — the same reason `svgtext` is not `text`. Verified by
`various/svg-image-check.js` (scratch): a script creates one in a canvas, moves it to 10,20, sizes it and
sets a data URL, and the check reports the tag (`image`, not `svgimage`), the position, the size and the
`href` — which is all an SVG image is drawn from.

**And the plugin was English-only in practice, which this exposed.** Every other domain builds its compile
table from the pack's own keyword list — that is why `mets` and `crée` work — while `svg.js` switched on
canonical names, so the element names the packs carry (`chemin`, `rettangolo`, `svgtesto`) resolved to
nothing at all. One line in its `getHandler` (`reverseWord`) fixes the class; the proof is that the Italian
declaration moved from failing on `svgimmagine` to compiling. Worth a look by Graham, since the svg
vocabulary is now localisable by a mechanism the other domains do not use.

**The wheel amount now reads whichever axis the wheel moved furthest on.** Browsers report a shift-wheel as
a *horizontal* scroll on most platforms, so a `deltaY`-only reading would have made the very gesture Graham
chose for zoom arrive as no movement at all. The axis does not need telling apart for a zoom, so the value
takes the larger magnitude and keeps the sign. Both cases are in `various/wheel-check.js`: `-120` for a
plain wheel, `120` for the same gesture reported on x.

**The modifier reading is in** (2026-09-30), which was the one thing between here and a zoom. `on wheel`
exposes `the wheel shift` and `the wheel control` beside the amount and the position, each **0 or 1** rather
than true/false so the reader can add or multiply it without a conversion first; the listener stores
`event.shiftKey` and `event.ctrlKey` that way. The compile side folds the four readings into one
`[amount, position, shift, control].find(matchesWord)` and builds the type name from it, so a fifth reading
is one word in that list; the runtime cases sit together in `getValue`. Words added to all four packs —
`shift`: `maj`/`maiusc`/`Umschalt|umschalt`, `control`: `ctrl`/`ctrl`/`Strg|strg` — **fr/it/de provisional
and for native review**, as `wheel`/`amount` are; `./sync-language-packs` run, `resources/doc/en/browser.json`
gained a `wheel shift` and a `wheel control` value and the missing `on wheel {element} ...` line in `on`'s
syntax, and `./deploy-sync` was run so the doc ship matches the source (it touched only the two doc files).
Verified by `various/wheel-check.js`, now three events — plain, shift and control — **in all four
languages**: the plain wheel reads `-120/0/0`, the shift-wheel `120/1/0`, the control-wheel `-50/0/1`, and
every reading is the pack's own local word. `asedit` still compiles at 1716 commands, 0 errors.

**The viewport is in, and with it the zoom and the pan** (2026-09-30) — which was item 1 of "where the work
goes next", and item 2 as well. `Draw` now shows a **window** on the run rather than the whole of it: two
ranges in the trace's own units (steps across, lines down), fitted to the whole recording when a run is
opened, and moved by three gestures — **wheel alone scrolls, shift-wheel zooms, drag pans**, Graham's scheme
from Kdenlive and Audacity. The three are the view's own entry points (`VizGrab`, `VizPan`, `VizWheel`), with
`VizReset` for the host to call on entry; the editor registers `on pick VizHost`, `on wheel VizHost` and
branches its existing document-level `on drag` on `GraphMode`, which is possible because the two views never
share the screen.

Four things about it are worth keeping. **A window, not a scale factor** — a factor has to be relative to a
fit that changes with the recording, and an absolute one sits pinned at one end, which is the prototype's own
lesson. **The steps are exact inverses**: in shrinks the window by a fifth, out grows it by a quarter, and
4/5 × 5/4 is 1, so the harness can demand that two notches in and two out land back on the fitted picture
byte for byte — and it does, on both fixtures. **The clamp is the reset**: zooming out and panning both stop
at the edges of the run, so there is no reset button to find. And **the marks are left out rather than
clipped** when they fall outside the window, because the plugin has no clip element and a mark outside the
frame paints over the axis — while a *transfer* whose ends straddle the window is kept and its ends clamped
to the frame, which is what a clip would have done.

Verified the way the project verifies a drawing: `various/plotview-check.js` now drives the four gestures
through the view's own entry points with the DOM values a browser would set, and reports the picture at each
step. On a 25-step fixture and a 284-step one, all five checks pass — every phase's marks inside the frame,
the zoom round-trip exact, every scroll and every drag moving the picture, and `VizReset` restoring the fit.
And the fitted picture is **byte-identical to the pre-viewport view** on both, proved by running the section
from `git show HEAD:asedit.allspeak` through the same harness (`PLOTVIEW=…`) and diffing. `asedit` compiles
at 1907 commands, 330 symbols, 0 errors.

**Two harness faults were found on the way, both worth keeping.** The settle detector counted *quiet ticks*
alone, and a draw blanks the picture before it draws it — so a big recording was declared finished while it
was still blank, which is what made the old view look like it drew nothing on the 284-step fixture. It now
requires having seen the picture change at least once. And the first observation was itself counted as a
change, which put the same mistake back one line later.

**The source is behind the heat** (2026-09-30) — the "program behind the heat" half of Graham's four
requirements, and the raster he asked for, with one substitution he agreed to. Where he proposed a
**canvas raster** (a plugin draws the source into a canvas and hands back a PNG data URL), the picture is
instead an **SVG document the view builds itself**: one `<image>` (the `svgimage` element) whose `href` is
`data:image/svg+xml,…`, assembled from `json split` (which splits on newlines by default and yields a JSON
array `element N of` can read) and `replace` (a global literal replace). So no canvas is reached, no new
vocabulary is invented, and the text stays vector — it cannot go soft past the scale it was rendered at,
and there is no 16,384-pixel ceiling to split around. The rows are `<tspan dy="18">` under one `<text>`, so
the offset accumulates and the whole file is one element with no per-line coordinate to compute.

**The picture is the window, and that is also the clipping** (2026-09-30, revised the same day on
Graham's report that text was showing above and below the panel). It is stretched to the frame with
`preserveAspectRatio: none`, x and y independently, which is what puts each row on the line the axis names
— and the *document holds only the lines the window shows*, so the picture is exactly the frame and cannot
spill onto the axis or the caption. An `<image>` lays its content out inside its own box and paints nothing
outside it, so the rectangle being the frame is a structural guarantee rather than a mask; the alternative,
a document per run with the element made taller than the frame to keep the rows in step, is what let the
text past the edges. The cost of the revision is that the document is rebuilt on every draw rather than
once per run — the rows in view, not the whole file, so at the fit it is the biggest it gets and at a zoom
it is small; a control-wheel notch that leaves the rows alone still rebuilds them, which is a known and
unfixed cost. The lines' `<`, `>` and `&` are escaped first (ampersand first, or it would escape its own
escapes), then `%` and `#` are percent-encoded for the URL. Host side: `VizSource` is read from the active
tab beside the recording, and a source that will not read leaves the pane plain rather than failing the
draw.

**The zoom is per axis** (2026-09-30, Graham's second correction): **shift-wheel zooms the lines**,
**control-wheel the steps**, both together both, and the wheel with neither modifier still scrolls down the
run. His first scheme had shift-wheel zooming both, and he called that a mistake — the steps are *when* and
the lines are *where*, and how far apart two arrivals are in time says nothing about how far apart the lines
they land on are. `VizWheel` therefore reads the two modifiers and marks the axes; `VizZoom` touches only
the marked ones, and an unmarked axis keeps its size and so is moved by nothing in the centring. Control is
taken over from the browser's own page zoom, which the pane's listener already `preventDefault`s.

Verified by `various/plotview-check.js`, which now hands the view a source of its own — fifty lines with a
blank row every seventh, one with `<`, `>` and `&`, one with `#`, `%` and `"`, and one 68 characters long —
and checks the things that matter rather than the things that are easy. Fifteen statements, all passing on
both fixtures: **every row sits on the line the axis names it**, with the document *saying which line it
starts at* so the grid is placed against the axis rather than merely sized like it (80 comparisons, worst
0.9 units out); **each axis moves only itself** (the check that would catch both wired to one modifier, and
which nothing else in the file would notice); the picture's rectangle is the frame in every phase; the
document's row count follows the window (20, 16, 13, 11); the round trip lands exactly on the fit once per
axis; the tags balance (`svg 1/1, text 1/1, tspan 20/20`); and the two awkward lines survive the URL byte
for byte. The marks and labels are **still unchanged** from before any of this landed, on both fixtures.
`asedit` compiles at 1985 commands, 346 symbols, 0 errors.

**One sign error was caught by arithmetic rather than by the harness, and it is worth knowing why.** The
picture's top was written `take VizMinLine from VizViewY0` — which is `ViewY0 - MinLine`, the negation of
what the mapping needs, and it put the text *below* where it belonged, moving the wrong way as the window
moved. The harness's checks at the time all passed: nothing outside the frame, a rectangle that changed,
rows that balanced. **A wrong value that is still a plausible value is what a check has to be written to
catch**, and the one that catches it is the one that compares the picture against an independent witness —
the axis. It is in the harness now. The same fault reappeared a moment later in the harness itself, where
`take`-style destructuring took a `[name, state]` pair for the state; that one was caught in seconds
because a value that is there but is the wrong shape fails loudly.

**Graham's four points, and where they stand** (2026-10-01). He raised them after looking at the pane, and
said of them that "much of the above is guesswork and will have to be resolved by trial and error" — which is
the tracking instruction, and it is being answered by landing one point at a time so he can look at it, in
the editor, before the next changes what it looks like.

1. **One drawing, zoomed and panned — LANDED.** The source was being redrawn at every gesture, so a zoom
   changed the *document's* proportions while its line lengths stayed put, and at high zoom the letters were
   pulled tall. It is now drawn once when the run is opened, at the size the text is really written at, and
   shown through `VizPane` — a nested `<svg>` the size of the frame whose `viewBox` is the whole of the zoom
   and the pan, one attribute per draw. The pane is also the clipping, which is what a picture cannot do for
   itself. **The consequence to look at, and it is a real one:** the window's width is what the frame's
   aspect allows at that row height, so at the fitted view — hundreds of rows in a 580-unit frame — the
   source is a *narrow column* down the left of the panel rather than a full-width texture, which is the
   opposite of what he expected ("longer lines will fall outside the right side"). If he would rather have
   the full-width shape at low zoom and the natural proportions only once the text is legible, that is
   `VizWindowW` set to `VizGlyphWidth` — **one line**, and it is not taken because what he asked for is what
   is built. **He has since looked and answered: "you're right, I had a faulty mental image... it's almost
   exactly right"**, so the coupling stands and the narrow column at the fit is accepted.
   **And one fault, found by him and fixed:** at the legible floor a further shift-wheel notch slid the
   window up a few lines, with a redraw flash. The cause was order: `VizZoom` centred the window on the
   size it had *computed*, and `VizClamp` then refused half of it, so the origin kept the centring's share
   of a change that never happened. The size is now clamped before the origin is moved to follow it — and
   because a refused notch now leaves the window identical, `VizRedraw` skips the draw entirely, which is
   the flash gone as well as the drift. `VizNote`/`VizRedraw` are the general form: a gesture that changes
   nothing does nothing, for the pan and the scroll as well as the zoom.
   **And he asked the follow-up question that found the rest of it — "does the graphics system clear then
   redraw, or redraw and switch buffers?"** The answer was: clear, then redraw, in the live DOM, with no
   buffer — and the clear was *paintable*, because the passes yield to the browser every hundred marks. So
   the flash had two causes and the second was structural. Every draw now builds all of its output in
   variables and writes nothing to the DOM until the end, in a run of statements with no yield in it: **the
   buffer is the variables and the swap is the last block.** The evidence is positional and easy to re-check
   — no `set attribute` or `set the text` appears anywhere in `VizBuilt` before the final block, so nothing
   the browser could paint is ever half-built. A redraw therefore leaves the previous picture up until the
   next one is complete, which is what a double buffer would do, and the blanking block at the top of the
   draw is gone (its accumulator resets stay, because those strings are grown by `cat`).
2. **The zoom stops at the text's own size — LANDED.** `VizGlyphRows` is `PlotH / 18` rows, derived rather
   than chosen, and `VizClamp` will not go below it. Applied *before* the clamp to the run, so a recording
   shorter than that many lines has no vertical zoom at all — which is right (there is nothing to zoom into)
   and is now the reason the harness reports those phases as "nothing to move" rather than as failures.
3. **Arrow heads, and a colour per kind — LANDED** (2026-10-01). One path per kind instead of one
   `VizFlowLines`, in the prototype's own colours: `call` `#e0a44a`, `jump` `#43c6a8`, `return` `#c07ad0`.
   The head is a chevron in the path data — the plugin has no marker element and a stroked chevron needs no
   fill — placed at the destination end with its wings behind the tip, which side depending on which way
   the segment runs; a transfer whose ends are the same line gets no head, since a head with no direction
   would be claiming one. **`branch` is now not drawn at all**, and that is a visible change: the trace has
   recorded the compiler's `if`/`while`/`wait` jumps as `branch` since draft 2, the settle note says they
   are "drawn only when asked for", and the view had been drawing all four kinds alike — so about a fifth
   of the flow on `trace-run.allspeak` was machinery. The prototype's default agrees (they sit behind a
   "compiler jumps" checkbox), and a fourth path plus a button is what it would take to offer them.
4. **A faint rule per recorded line — LANDED** (2026-10-01, then corrected the same day). One hairline
   across the frame at every line the run *names* — an arrival, or either end of a transfer — so a line
   visited forty times gets one rule and not forty, and a line the run merely passed through gets none.
   Only the rules *in view* are drawn, since the loop covers the run and the window is a slice of it.
   **Two faults, and both were found by a check rather than by reading.** The first version drew rules for
   *every line the run executed* — taken from the window's per-line counts — which on `trace-wide.allspeak`
   is 148 lines where only 62 carry anything; the other 86 are the `add` and `go to` between one label and
   the next, and a rule on each is a grid over lines with nothing on them. **Graham saw it before any check
   did**: "too many of them... is it possible some belong to the internal gotos from if, wait etc?" They were
   not the gotos — those are already out of the flow — but the instinct was exact, and the counts were the
   wrong source. And the first version also drew the off-window rules, which map outside the frame and cross
   the axis: *that* one the "every coordinate is inside the frame" check caught, on twenty of twenty-eight
   phases. The harness now checks the converse too — **the rules are exactly the lines the recording names,
   and nothing else** — which is the statement whose absence let the wrong version pass 20 of 20.
   The set is a padded string with an `includes` test, because the language has one of those and no set type;
   the padding is what stops ` 15 ` matching inside ` 115 `. Its colour is `#eee`, on Graham's eye: the pane
   sits on the editor's white, and `#2b3138` was a near-black grid there.
   **What is missing, and it needs a word from Graham before it is drawn:** the flow colours mean something
   and nothing says what. The key names the four heat bands and has no room on the caption's line for three
   more entries, though the space between the caption and the key (about 280 units) would take them. What
   wants settling first is the *vocabulary* — the trace says `call`/`jump`/`return`, and a reader's words
   are probably `gosub`/`go`/`return`.

**The mode invariant, and the bug that wasn't one (2026-10-01).** Graham reached a state by the one path that
shows it — Graph, then Blocks — where both the Graph and the Blocks buttons read `Edit`, and in the same state
the graph was left lying under the Blocks pane. Both faces are one omission: `EnterBlocks` never turned the
Graph pane off. `EnterGraph` had always turned Blocks off, and `ActivateTab` turned both off, so the *other*
direction was fine and had been since the Graph pane was added — `EnterBlocks` was written before it existed
and nothing pointed at the assumption it was making.

**Fixed by closing the class rather than the instance.** `DoExitPanes` is now the single statement of "which
other modes there are", and the three entry points call it — `EnterBlocks`, `EnterGraph`, `ActivateTab`. A
fourth pane means changing that one subroutine; the entrance still has to remember to *call* it, which is the
part that is not enforceable and is why the comment sits at both entry points. The verification is a click
rather than a check: the two harnesses drive the drawing, not the editor's UI state, and nothing headless can
see a button's label.

**A mode comes back as it was left (2026-10-01).** Graham's requirement: *"The first visit needs to set things up,
but subsequent visits should avoid any form of reset. So the current line number remains the same in Edit mode,
and the zoom/pan setting in Graph mode."* And for the open question — what to do when the user changes one thing
and returns to the other view — his call: *"just restoring it as it was previously is the best"*.

The window was being fitted on **every visit**, because the host called `VizReset` on the way in. The view now
decides for itself, and the thing it decides from is **the recording**: the same recording is the same run, so the
window is kept, and a different one re-fits. The comparison is over the whole string, and that is the honest
key — a recording is a file beside the script, so editing the script leaves the recording alone and the window
still means what it meant, while re-running writes a new one.

**The two inputs are different, and that is the whole of the design.** The picture answers to the *script* and
the window to the *recording*: a redraw touches only the window it was given; an edited script rebuilds the
picture and leaves the window exactly alone; a new recording re-fits. **And the near-miss is worth keeping**:
moving the fit out of the per-visit path took `VizSourceMeasure` with it, which would have left an edited script
showing its old text — silent, plausible, and caught only by the check written for it.

**The flat editor's line** is read when the pane opens and put back on the way out. **The one thing to revisit is
how it goes back:** `codemirror scroll to line` is the only command that calls `refresh`, and the plugin's own
note says a hidden CodeMirror needs one — so the line comes back near the *top* of the pane rather than at the
height it was. A plain `codemirror refresh` command would re-measure without moving; it is a small addition to
the plugin, and it is the difference between "the line is right" and "the view is right".

**A tab keeps the caret *and* the view (2026-10-01).** Graham, from Kdenlive: scrolling must not move the
insertion point, and the view must not be dragged to the caret on return — the jump that catches him out there.
Two faults, which are the two halves of it: **a tab switch reset both** (`ActivateTab` sets the content, and
`setValue` resets the caret and the view), and **leaving the Graph pane scrolled the view back onto the caret** —
the same jump, in the same shape.

**The fix is a pair, kept apart.** Each tab remembers the caret's line *and* the viewport's scroll offset, and both
go back on return — through the same two subroutines for a tab switch, the Blocks button and the Graph pane, so
there is one answer to "where was I" rather than one per way of leaving. Three commands were added to the
`codemirror` plugin, which is the editor's own plumbing (the domain is undocumented and no user writes it):
`view of` / `view to` for the scroll offset, and `cursor to line` for the caret — and that last one deliberately
does **not** scroll, which is what stops the pair disturbing each other. **The column is not remembered**, only the
line, because that is all `get cursor` returns.

**Two traps, both paid for.** `getNextValue` reads the token *after* the one the index is on, and `nextIsWord`
advances before it answers — so `nextIsWord('to')` followed by `getNextValue()` steps over the value. It surfaced
as a runtime error about a value called `in`, which points at nothing. The plugin's own `get` chain carries a
warning about exactly this, now in its second paying. And `deploy/code/asedit.allspeak` went stale again the moment
the root copy moved — which is the two-copies item below, and this is its third reminder.

**Not verifiable headlessly**, and it is the same class as the mode-invariant bug: which caret, which scroll, which
pane is editor UI state, and no check can see it. **And that prediction came true within the hour**: opening a
second tab from the *file browser* died with *"Array index 1 is out of range for 'TabCursor'"*, because the two new
per-tab arrays were grown in `NewFile` (the + button) and not in `OpenFile` (the browser). Fixed by the same move
as `DoExitPanes` — **one `TabGrow` subroutine makes room for a tab**, and both callers use it, so a seventh
per-tab array is one line in one place. `CloseTab` is the only other site that knows the list, and it shifts the
value arrays back down; the element arrays are rebuilt from the count.

**That is the third paying for one shape** — a list kept in step in more than one place: `svgimage`'s seven sites
(two missed), the mode panes' one entry point that did not exit the others, and now the tab arrays' two ways to
open a tab. The fix has been the same each time: make one place responsible. It is worth watching for, because the
*failure* is not the same each time — two were silent and this one was loud — while the cause always is.

**The editor has a harness (2026-10-01).** `tools/asedit-modes-check.js` — 18 checks, all passing. It stubs the
DOM and CodeMirror, runs `asedit.allspeak` the way the page does, clicks the mode buttons and opens and closes
tabs, and reads the editor's own variables and elements. It asks *is the state consistent*, not *does it look
right* — the gap both of the afternoon's UI faults fell into, which a click found slowly and this finds in a
second.

**And it paid for itself on the first run**, by finding a real bug in the change that prompted it: `TabGrow` grew
the per-tab arrays but did **not clear the new slot**, so a tab opened after another was closed inherited the
closed tab's caret and scroll — a stale restore, on a tab that had never been anywhere. The two arrays that
matter are read-only, which is why the two already there never showed it. Fixing that cost two off-by-ones of
its own (the new slot is `TabCount - 1`: an index counts from zero, the count does not).

**What it does not cover, and this is the part to remember:** the renderer is stubbed. Webson's build is
asynchronous all the way down and stalls headlessly somewhere unreached, so the ids come straight from
`asedit.json` and **a fault in the UI's markup is invisible here**. Modes, buttons, panes, tab records and the
caret/view pair are what it covers.

**The editor's load time is the number to watch, and it is creeping.** The editor is compiled on every page
load, so its compile time *is* its load time — and the runtime prints it (`N ms: Compiled ASEditor: L lines (T
tokens) in N ms`), which is where to read it: **his own browser console, on his own machine**, not mine. Measured
here, in node, on 2026-10-01: **~1.0 s for 3017 lines / 9045 tokens** (`node tools/asedit-modes-check.js` prints
the same line for the editor it runs).

The growth, by line count, since the file has an editor pane worth counting:

| date | commit | lines |
|--|--|--|
| 2026-09-27 | 283be86 | 1508 |
| 2026-09-29 | 43bf410 | 2036 |
| 2026-09-29 | e4106ff | 2142 |
| 2026-09-30 | 7f44651 | 2229 |
| 2026-10-01 | 32a2124 | 2767 |
| 2026-10-01 | 0eef19f | 3003 |
| 2026-10-01 | 11a631d | 3016 |

**Doubled in four days**, and the panes are what did it. Compile cost looks linear in the script, so the next
doubling is ~2 s. `tools/asedit-modes-check.js <path>` will compile any revision and print the line, which is how
to put a number on it when it next moves — `asedit-check.js` does not, because it compiles without running and
never reaches the runtime's timing.

**If it wants addressing, the shape is deferred loads** — the editor split so a pane's section is compiled when
that pane is first opened. The viz plugin's contract already carries a `sections` idea, so the seam exists. Not
before the functionality is finished, and not without his say-so.

**It ships nothing.** The starter pack is seven files — `CLAUDE.md`, `AGENTS.md`, `server.allspeak`, `edit.html`,
`asedit.json`, `asedit.allspeak`, `asdoc-check.py` — and nothing in `tools/` or `various/` is among them. The
`codemirror` commands it drives are runtime plumbing from `dist/plugins/`, also not in the pack. What a user
carries is the editor, and **`asedit.allspeak` is now 136 KB**, the largest file in the pack, up from 82 KB a
week ago — worth watching as the panes grow.

**The flow key: the words are looked up, not asked for.** The three transfer kinds are named in the language
packs already — the language's own keyword for each, which is what a reader of that language knows:

| trace | internal | en | fr | it | de |
|--|--|--|--|--|--|
| `call` | `GOSUB` | `gosub` | `vasous` | `vaisub` | `gosub` |
| `jump` | `GOTO` | `go` | `va` | `vai` | `gehe` |
| `return` | `RETURN` | `return` | `retourne` | `ritorna` | `retourniere` |

That is Graham's own guess (`gosub`/`go`/`return`) confirmed by the packs, and it means the key needs no new
vocabulary and no per-language review — the words go into `SetStrings` beside `StrFind`, three lines per language.
(The project rule is explicit: don't ask him for an equivalent keyword, look it up in the pack.)

**The seat is settled and built: the frame grew, and the two keys share the floor.** The canvas is 1000x740
(Graham's choice, 2026-10-01) but the plot still ends at 660, so the step-axis labels stayed at 664, the heat key
at 679, the caption at 690 — **widening moved nothing already drawn**, and the forty new units are floor for the
flow key's row alone (marks at 700, words at 711, a dash per colour because a transfer is drawn as a line).
The three colours are now `VizColourCall/Jump/Return`, used by the wires *and* the key, since two copies is how a
legend starts naming a colour the wires do not use.

**One declaration rule learned the hard way, and it will come up again.** The compiler is single-pass, so a
variable read by the view section must be **declared before `SetStrings` uses it**, at the top with the other
`Str` names — and the section cannot declare it as well, because a repeated `variable` is a compile error
(`ASEDITCHECK-FAIL: Duplicate variable name`). So the mirror is not self-contained: `various/plotview-check.js`
prepends the three declarations when it loads the section, the same standing-in the DOM stub does. The first
attempt put the declarations in the section and broke the *editor*; the second put them in both and broke the
*mirror*; both are worth remembering.

**And a stale fixture bound cost half an hour.** `plotview-check.js` asserted every coordinate was inside a
1000x700 frame; the flow key's row sits at 700-711. Rather than one red check, it **aborted the run** and reported
`DOM: 0 element(s)` with the phase labels missing — which read as "the drawing is broken" and was not. When that
harness reports nothing at all, suspect its own bounds first.

**Load time, measured (2026-10-01):** ~1.04 s in node for 3102 lines / 9361 tokens. Up 35 ms for the flow key,
1508 lines on 27 September. **Read it in his browser console** — the runtime prints it on every page load — and
`node tools/asedit-modes-check.js <path>` prints it for any revision. Deferred loads if it needs addressing.

**The status line is in (2026-10-01, Graham's ask).** `VizStatus`, along the bottom at (60, 730), left-aligned,
written in the same uninterrupted final run as the axis labels so it cannot flicker. Format:
`zoom x 100% y 100%   steps 0-162, lines 15-211` — the two zooms as percentages of the *fitted* picture, then
the window in the trace's own units. **Both halves earn their place:** the percentage is the reading a person
recognises, the span is what makes a report reproducible, because a size is not a position. He asked for the
zoom; the span was added because the line's stated purpose is describing an issue. It is his to trim.

The fit is kept in `VizFitXW`/`VizFitYH` — the one place a second copy of a computed thing is right, since the
alternative is asking `VizClamp` what it allowed, which it does not answer. The percentages multiply before
dividing because the runtime truncates (`100 × fit / window`, never `100 × (fit / window)`, which would report a
125% zoom as 1).

**Not yet asserted anywhere.** `various/plotview-check.js` prints the status text every phase, and that is how
the numbers were checked by eye: 100% at the fit, 124/155/194% on the steps, 124…615% on the lines, 100% again
after `VizReset`, and the two axes moving independently. **A check that the fit reads 100%/100% and that a wheel
notch moves it is the obvious next addition** — the harness can read the text and the gestures already exist, so
it is a few lines against the newest thing on the picture.

**What the harnesses still cannot see:** the drawing. `asedit-modes-check.js` stubs the renderer, so the flow
key's *appearance* — a dash at the right size, a word that does not run into its neighbour, in four languages — is
Graham's eye alone. A check that the key's three labels exist and read the right word per language is the obvious
next thing to add to it, since the elements and the strings are both there for the asking.

**Where the work goes next, in order** — the flow's key (the words and the seat above), then:

5. **The side panel, and the hover rule.** The settled note above: at low zoom show the current marker and
   any doc prose, not the line's command, which is meaningless at that size. The panel is a reuse of the
   Blocks split — draggable divider and doc pane — so the work is the rule rather than the furniture, and
   the rule needs the pointer→line mapping (a pixel → a viewBox y → a line). That is the letterboxed
   arithmetic the *zoom* deliberately avoided; `VizPixelScale` already computes the scale, so what is
   missing is the centring offset and the inversion.
6. **Per-marker data** — wants his idea in words. The anchor is the designed extension point, and the trace
   format deliberately carries no values.

**Done, for the record:** the modifier reading (`the wheel shift` / `the wheel control`), then the viewport
with its zoom and pan, then the source behind the heat — items 1 and 2 of this list, and the first half of
what was item 3, all landed 2026-09-30.

**Smaller items, in any order:**

- **Four `verify-stale` sign-offs** — his by convention: the editor's declarations, its handler block, the
  Graph host's section, and the view's own. Until he clears them the analyser reports four warnings.
- **The source picture wants a browser, and this is the one thing a check cannot say.** Three things are
  unverifiable here and none of them is subtle if wrong: that a browser renders an `<image>` whose `href` is
  an SVG data URL at all (plain `href`, SVG 2 — every current browser takes it, and `xlink:href` is the
  fallback if one does not); that `xml:space="preserve"` keeps the indentation; and that the monospace
  advance is close enough to the 8 units a column is assumed to be, where a mismatch only widens the right
  margin. Decoding the URL and checking the document is well formed, and that its rows sit on the axis, is as
  far as a headless check reaches. **The clipping is no longer on this list** — the picture is the frame, so
  a browser that draws it at all cannot draw it outside the panel.
- **The document is as wide as the longest line of the *file*, which may now be one of the blanked ones.**
  `VizGlyphMax` is measured over every line, prose included, so an invisible `!!` paragraph of four hundred
  characters still sets `VizGlyphWidth`. Nothing shows it: the pane clips at the frame, and the glyph metrics are
  fixed by the font size and the row height rather than by the document's declared size, so the extra width is
  slack the browser never paints. One line in `VizSourceMeasure`'s measure loop if it wants the width to mean
  "the widest row that is drawn" instead — and that loop is now the only place a doc line and a code line are
  treated alike, which is worth knowing when reading it.
- **A horizontal notch rebuilds the `href` for nothing, and the reason recorded here was wrong.** This said the
  document is "the rows in view", which the extent change ended: `VizSourceMeasure` builds the whole file, once,
  when the source changes, and a horizontal notch changes neither the source nor the rows. What it still rebuilds
  is the data-URL *string* — `VizSourcePicture` re-`cat`s the whole encoded body on every draw — and the `href`
  and the `viewBox` are the only DOM writes that share a draw with a step-window change. A guard — reassign the
  `href` only when the source or `VizViewY0`/`VizViewYH` moved — removes it, and is not there because the standing
  call is to leave optimisation until the functionality is finished.
- **Tabs.** A tab in the source is one character in the document, and SVG's whitespace rules turn it into a
  single space, so a tab-indented file would lose its column alignment. `.allspeak` files are space-indented
  so nothing in the tool shows it; `as_condition.py`, which is what the redacted picture is of, is not.
- **The cost of a live pan** — the drag redraws on every drag event, so the picture follows the pointer at a
  few frames a second on a big recording. Graham's call (2026-09-30): leave it until the functionality is
  finished. The fix, if it reads badly then, is to translate the five path attributes with an SVG
  `transform` during the drag and redraw once on release.
- The ramp's bottom end: with a band size of 1 a once-visited line lands in band 1, so a quiet run shows
  amber for its least-worked lines. One line to change (`take 1 from VizCount` before the division), and it
  moves every boundary; the legend makes either choice legible.
- The two copies of `asedit.allspeak` — hygiene, not a bug: nothing he runs reads the second one. The
  options are in `DIFF.md`; the recommendation is to have `deploy-sync` refresh `deploy/code/` from the root,
  so the local published copy cannot be stale *and* so `BUILD.md`'s claim that the `cp` step is enough
  becomes true. Publishing to the live site is still `./deploy-allspeak`.
- The size of a mark — settled in code at 14 units, one line if he wants it tuned. It does not shrink as the
  window narrows, which is deliberate: a mark has to stay legible to be a mark.
- The provisional fr/it/de words for `wheel`, `amount`, `shift`, `control` and `svgimage`, and the
  `reverseWord` line in the svg plugin's `getHandler` — all awaiting his eye.

**Working methods that earned their place**, worth keeping: `tools/asedit-check.js` exists because a check
that loads every plugin verifies a program nobody runs — it caught `I don't understand 'VizBands'` when
"declare before use" turned out to be positional in the file. **Never redirect stderr on a check whose
stderr is its verdict** — hours were lost running the harness `2>/dev/null`, which discarded the
`Non-numeric value` report it was written to produce. **"Fail closed" means build the result in memory,
assert, then write once**: a patch that wrote per-file left the sketch half-changed and broke the harness
for a turn. And **a check that reads a value mid-flight reports the half-finished state as the answer** —
which is the whole of the puzzle above, and a cousin of the stderr lesson: the instrument was measuring at
the wrong moment. And the tiny dots had a third cousin, the most expensive of the three: **a value computed
before the pass that measures it silently uses the previous draw's number.** Both readings are plausible, so
the fault never looks like a fault — the first render is "right" and every later one is not, which is what
made it read as a cap problem for two rounds.

## High priority

### 1. ~~String split by delimiter~~ ✓ Done
Implemented in both JS and Python. The `split` command now accepts `by` in addition to `on`:
```
split MessageText by `|` into Parts
put element 0 of Parts into TopicName
```
New value expression for single-field extraction:
```
put field 0 of MessageText delimited by `|` into TopicName
```

### 2. ~~Append to JSON array in file~~ ✓ Done (Python only)
Implemented in Python. Creates `[]` if the file doesn't exist. Supports `or` error handling.

```
append `{"name":"test"}` to json file `data/topics.json`
```
JS not applicable — browser file writes use `rest post` to a server; the existing in-memory `append` command covers the JS use case.

## Medium priority

### 3. Storage get with defaults
`get X from storage` returns the string `"null"` or `"undefined"` when a key is missing, requiring repeated cleanup. Should return empty instead, or support a fallback:

**Proposed syntax:**
```
get Broker from storage as `chat-broker` or clear
```

### 4. Multi-field unpack with remainder
For protocols using delimited fields where the last field may contain the delimiter:

**Proposed syntax:**
```
unpack MessageText by `|` into TopicName Subject Author Body
```
Last variable gets the remainder.

---

*Source: friction points from the chat/forum project, April 2026.*

---

## Housekeeping (not language work)

### 5. Prune `resources/ecs` — scheduled, not yet done

`resources/ecs/` is a **superseded site generation**. `documents/doclets-feature-checklist.md`
already records the reason: the deploy pipeline never ships it (`deploy-allspeak` mirrors only
`codex/`, `learn/`, `primer/`). What remains is a mixture of ages and purposes, which is the
argument for pruning it rather than keeping it as one unit:

- **18 files dated 2026-04-06** (the fork day) — the old site's pages.
- `scripted.allspeak` / `scripted-server.allspeak` / `scripted.html` / `scripted.json` / `README.md`
  (04-08) — the self-contained "scripted" colour-coded editor, a five-file bundle described in
  `resources/ecs/README.md`, which now sits among unrelated pages.
- `docman.allspeak` (04-17), `doclets.allspeak` (08-04), `main.allspeak` (08-19) — the more recent page work.

Renaming the folder is not worth doing on its own: if it is pruned, the name goes with it; if a
subset survives, name it after what it is (`scripted/`).

**Clear these first — each is a reference the prune would leave dangling:**

1. `project.html:13` loads `/resources/ecs/project-main.allspeak`, which does not exist. Fix or retire
   `project.html`.
2. `codex/{en,de,fr,it}/md/tools.md` use `/resources/ecs/myscript.allspeak` as an example path. Repoint
   to a path that exists.
3. The four `resources/doc/*/core.json` translation caches link to `resources/ecs/sample/factory`,
   which does not exist. Repoint or drop the links.
4. `index.html:21` and `codex/codex.allspeak:303` load `main.allspeak` and `docman.allspeak` from the folder. Decide
   whether those entry points survive.
5. `resources/ecs/README.md` describes a five-file bundle but sits in a folder of unrelated pages.
   Move the `scripted*` files out together with their README, or drop them.

**Why nothing can be lost:** all 33 files under `resources/ecs/` are tracked, so any of them is
recoverable with `git log -- resources/ecs/<file>` after deletion. Run `./deploy-sync` afterwards,
because `deploy/` holds a mirror of the tree.

**When:** together with the `resources/` prune as a whole — not during a deploy freeze, and not
with a release in flight.


## Language packs

### 6. ~~The `viz` marker's option words~~ ✓ Reviewed 2026-09-28 — the words stand, provisional fr/it forms included

`viz` is core syntax (a no-op command) with the grammar
`viz start|stop [on <label>] [once|every] [until thread] [limit <count>]`. Every option
word now has a local spelling in all four packs, so a marker can be written entirely in the
local language — verified by compiling each of these to the same internal marker
(`request=start, mode=once, until=thread, limit=2`):

    fr   viz démarre une-fois jusqu'à fil limite 2      viz arrête
    it   viz avvia una-volta fino-a discussione limite 2   viz ferma
    de   viz starte einmal bis Thread Limit 2            viz stoppe

`viz` itself stays `viz` in all four languages, as `json` and `mqtt` do: technical keywords
are not translated.

| canonical | en | fr | it | de |
|---|---|---|---|---|
| `on` | on | sur | su | bei |
| `start` / `stop` | start / stop | démarre / arrête | avvia / ferma | starte / stoppe |
| `every` | every | chaque | ogni | jede |
| `once` | once | une-fois *(provisional)* | una-volta *(provisional)* | einmal |
| `limit` | limit | limite | limite | Limit\|limit |
| `until` | until | jusqu'à † | fino-a | bis |
| `thread` | thread | fil | discussione\|thread | Thread\|thread |

† Four spellings — `jusqu'à|jusqu’à|jusqu'a|jusqu’a` — because the match is exact and a
French writer chooses the apostrophe (ASCII or typographic) and the accent independently.
Verified end to end. This is the first apostrophe in any of the four packs.

**Constraints a local word must satisfy** (learned the hard way, worth keeping for any
future vocabulary):
- **One token.** The tokeniser splits on whitespace and `reverse_word` is a whole-token
  lookup, so a phrase can never match: `une fois` is two tokens and no entry can bind it.
  The failure is loud rather than silent — `viz start une fois` stops with
  `Je ne comprends pas 'une'` — but it is still a failure. Hyphens and apostrophes are fine
  inside a word, which is what makes `une-fois`, `una-volta`, `fino-a` and `jusqu'à` work.
  This is also why the label form is `on <label>`: `une` and `una` on their own are already
  the article (`an`), and `on` needed no new word at all.
- **Case matters.** The lookup is exact and every existing German keyword is lowercase
  (`körper`, `nachricht`, `zahl`), so the correct German noun spellings — `Limit`, `Thread` —
  are entered as `Limit|limit` and `Thread|thread`, keeping the proper spelling canonical
  without making them the only keywords a German script must capitalise.

**For the native reviewers:** the French and Italian `once` forms are provisional guesses
(`une-fois`, `una-volta`); Italian `discussione` is the forum-thread sense, whereas the
marker means a thread of execution, so `thread` may be the better primary there; and the
German capitalisation call (`Limit`/`Thread` first, or lowercase-first) is a matter of taste.

**One follow-up.** `tools/generate-translated-docs.py` reads this same `words` table and
substitutes word by word (`words[tok].split('|')`, line 107), and the English doc source in
`resources/doc/en` contains the new words — `once` 4 times, `thread` 3, `until` 5 — so the
next doc regeneration will change some French/Italian/German lines. That is mostly what you
want for syntax lines, but the substitution is word-level and will also touch prose
containing those words. Worth eyeballing those diffs before the next `deploy-sync`.

### 7. `dictionary` / `list` in the JS flavour — measured 2026-09-29, see `language-pack-issues.md` #14

The assumption that implementing them in JS "would have severe implications" is recorded nowhere
and was never tested. Measuring it says they cost almost nothing: JS already has both *shapes*
under the spellings the reference documents, and the keywords would lower to the two lines it
already tells JS authors to write. `entry` is half-wired (`has entry` works, `set entry` and
`put entry` do not) — that looks accidental. The scripts actually kept out of the browser by these
two keywords number **one** (`examples/chemical/parser.allspeak`), and file I/O blocks it anyway.
Full measurements and three options in `language-pack-issues.md` #14.

**Also prototyped 2026-09-29 (#14b):** feasible in **four edits, all in `Core.js`, with no pack
change** — `dictionary`/`list` are untranslated keywords in all four packs already, like `json` and
`mqtt` — provided the declarations lower to `keyword: 'variable'` (18 places test that). It works,
and it moves `parser.allspeak` from failing at line 43 to line 45. **But it would mislead:** the two
runtimes' lists are different structures — Python has no `element` (it is `item`), JS has no `reset`,
Python dies on index-assign to a non-existent slot where JS auto-extends — so `list` + `element`
would compile on both, run on JS and fail on Python. Doing it properly means settling one idiom for
both runtimes first, which is a language decision.

**Decided 2026-09-29 — leave it alone.** Graham's rule is that the JS variant must follow "adding without taking away"; testing the prototype against it **passes** (319 scripts compiled with and without: 149 OK either way, **0 regressions**, the 4 verdict changes all `FAIL` → `FAIL`) but it still should not be done: it moves a boundary rather than closing a gap (the sweep found a fifth `entry` site), and it would advertise a portability that the list semantics do not support. **No visualiser workaround is needed** — the trace format is portable, so a script the JS runtime cannot run is recorded by Python and drawn by the same picture; `viz.allspeak` itself uses no containers and runs on both. See `language-pack-issues.md` #14b and #14c.

### 7b. `modifyValue` is still undocumented in the plugin contract

`as_value.py` calls `domain.modifyValue(value)` on every registered domain, and the JS twin
of that bug was fixed earlier by guarding `handler.value`. Any plugin domain must define
`modifyValue` to avoid an AttributeError; `spec/allspeak-plugin-contract.md` does not say so.

## Visualiser (`viz`) — decisions and next steps

**Governing principle** (Graham, and it overrides anything below that conflicts with it): *make
complex things simple.* The aim is a **fully-integrated solution with a concise feature set and a
minimal learning curve**, for an audience that includes people who will only stay aboard while
each learning step is small. Three rules follow, and future work should be checked against them:

1. **No new commands to see the picture.** The view is simply there for a script you have run. The
   two marker words a user has already learned — `viz start` and `viz stop` — are enough for every
   review; `on`, `once`, `every`, `until` and `limit` are refinements, not a curriculum. `viz` is a
   no-op without a recorder, so a script carrying markers runs like any other.
2. **Nothing in the onboarding depends on this.** The Primer's first steps carry no markers at all.
3. **Perfetto is not the product.** It is a development instrument and an optional escape hatch;
   users are never asked to learn it. Its UI is also English-only and has no notion of the script's
   own language, whereas our records already carry the user's own names and prose.

**The visualiser speaks the script's language for free.** The language packs already carry a
`diagnostics` section of user-facing strings in all four languages (`Je ne comprends pas '{token}'
à la ligne {line}.`), so the view's own labels belong there rather than in a translation layer of
our own. Anchor names and doc-block prose arrive in the author's language already, because they
*are* the author's text.

**Proposed, and no longer settled:** a **dual-pane** view — the script on one side, the picture on
the other, with the script *following* the user's navigation. The sketches below suggest one pane
can carry it; two may re-surface if one turns out too cluttered (Graham, 2026-09-28). Two
consequences hold either way, and are already built into the trace format: every event names a
`line` (the join key the editor scrolls to), and every event carries `steps` alongside its timing
(the deterministic axis, since timings are not comparable across runs or runtimes).

**In place:** `viz` markers as core syntax (no-ops without a recorder); the static model
(sections, prose, anchors, routes, windows, findings); the Python recorder; and now the recording
as a **file** — `spec/viz-trace-format.md` (Chrome Trace Event Format, the subset used and the
meaning of each `args` field) with `tools/check-trace.py` as the conformance check both runtimes
must pass. `tools/asviz-run.py --run --trace=<file.json>` writes one. As of 2026-09-29 the file
also carries **control transfers** (`cat: "transfer"`, `ph: "i"`, format **draft 2**): one instant
per arrival that is not the command after the last, with `from_line`, `to_line`, `steps` and a
`kind` of `call`/`jump`/`return`/`branch`. That closes the gap that left the flow invisible — a
call, a return, a jump and a loop's back-edge are now in the record. `branch` is the compiler's own
jumps (`if`/`while`/`wait`/`try` scaffolding), kept apart from `jump` because **a written jump
names a label and a generated one carries a numeric target** — Python's conditions compile to
`gotoPC` but JS's compile to `goto`, the same keyword its `Go` uses, so the keyword alone would
report the `else` of every `if` as an author's `go`. `pretrace.json` was regenerated. And
`./various/plot` (2026-09-29, `various/`, gitignored) draws it: **the script down the left, the
sequence across** — two bands in one canvas sharing y, because the script cannot share the plot's
x, where x means *when* and text has no position on it. Text appears once a row can hold it (both
sample scripts fit at 22–26 px/line), the anchor *names* take over below that, the arrival dots
keep their own column so none is lost to the sampling, and hovering a row lights it in both bands.

**Sketches, and what they established** (2026-09-28; `various/`, gitignored — run
`./various/silhouette <script>`, which prints the path and opens it). They render the *static*
model only: no trace, no runtime change, because the riskiest assumption was whether an unreadable
shape is useful at all.

- A whole-file view of a 626-line script **cannot** show per-line shape: 1.26 px per line leaves
  indentation sub-pixel. Resolution is the limit, not the encoding.
- The block rows have no zoom dimension — the whole file's form always fits — so a single zoom
  control cannot govern them and per-line rows at once.
- A block's bounding box cannot show nesting: every AllSpeak block starts at column 0, so the
  shallowest indent is 0 for all of them.
- The x-axis cannot be both glyph-proportional and whole-file legible. `parser.allspeak`'s longest
  line is 461 chars, which at glyph scale fills 238 px of a 1400 px pane — 17%, i.e. collapsed
  into the left margin. Hence the per-density x (percentage for blocks, glyphs for lines) — which
  Graham's read below now calls into question.

**From Graham's read of the sketches (2026-09-28):**

- Hover in the **compressed** view should show the **current marker and any doc prose**, not the
  line's text — individual commands are meaningless at that zoom. Line text belongs there only
  once zoom makes it legible; a toggle in the detail pane should offer either.
- The bars-without-text rendering is a poorer navigation aid than the compressed one. He would
  rather have **one continuous view**: the compressed picture at different levels of zoom, ending
  where the text's line height reaches normal. That replaces the mode switch, and implies one
  geometry rather than two.
- The gutter of marker dots and the doc-block prose are the parts he would keep.

**Settled by Graham, 2026-09-28** (after the sketches above; his own words noted where the choice
was made without confidence):

- **One view, and lines from the start.** Every line is a row; at low zoom they are sub-pixel and
  read as one compressed band per block, with the block label above it. *"I'll go with 2, but
  without being confident the one or the other is the right choice."* — so build it cheaply and
  judge it from the picture.
- **The bar is not a shape device — it is the heat channel.** *"What should be visible behind the
  text is a series of rectangular elements whose colours represent how busy that block is at that
  point in time (the sequence). Once the program flow moves away they revert to blue."* So "what
  should the bar measure" (extent, nesting) was the wrong question, and the per-density x argument
  goes with it.
- **The hover rule.** At low zoom, show the current marker and any doc prose — not the line's
  command, which is meaningless at that size. Line text belongs there only once zoom makes it
  legible; a toggle in the detail pane should offer either.

**Settled by Graham, 2026-09-29** — the colour channel, and the transfers:

- **Colour: both, behind a toggle, in one prototype.** The two readings of "how busy" are (a) two
  colours — blue for an anchor the program *has* against red for an arrival the run *made*, which
  shows the shape of the flow without ranking it — and (b) one ramp, each arrival shaded by that
  line's visit count *so far* against the busiest line in the window, so the most-revisited line
  ends at full red. He is not sure which reads better and a toggle is the cheap way to find out.
  Whether the **instruction count** should drive the shade instead of the visit count is
  unanswered, so the sketch shows the line's instruction count in the readout, where the two can be
  compared before choosing.
- **Transfers: recorded, not inferred.** The faint lines at each `go`/`gosub`/`return` come from the
  run (`cat: "transfer"`, built 2026-09-29), so each lands at its own moment. The compiler's own
  jumps are recorded too, but as `branch` and drawn only when asked for: `if`/`while`/`wait`
  scaffolding is not a program jump, and Graham's own caution about that is what the separate kind
  is for. Static edges from the model were the alternative — no runtime change, but not tied to the
  run, and only section-to-section.
- **Build: a throwaway sketch first** — `various/plot` (gitignored), judged from the picture,
  before anything in `asedit.allspeak`.
- **The pane count is still open.** Graham's 2026-09-29 note: *"when I say left and right panes I
  forgot it may be a single pane."* What follows from the plot having x = sequence is that the
  script cannot share that axis — in the sequence plot the text has no place — which is exactly why
  a second pane would have to follow the first vertically. Two panes side by side, or one pane
  whose x means something different once zoom crosses the text-legible threshold, is the question
  left open. **Built as the cheapest reading of it, not as a decision:** one canvas holding two
  bands — the script on the left, the sequence on the right — sharing y and nothing else, with the
  script toggleable so the plot can have the full width. It is a sketch, so the question is still
  where it was; the difference is that there is now a picture to argue about.

**Asked by Graham, 2026-09-29 — the picture's controls, and the source behind it.** Four requirements,
audited against the code the same day. The shape is consistent with the decisions above; the work is mostly
capability that does not exist yet, and one item is blocked by the language.

1. **Zoom, independent X and Y.** Not in the pane: it asserts a fixed frame (`viewBox 0 0 1000 700`,
   `preserveAspectRatio`, and the `VizMargin`/`VizPlotW`/`VizPlotH` constants) and recomputes the fit per
   draw, so the two axes already scale independently — but nothing can change them. Prototyped in
   `various/make-viz-plot.py` (independent view state, sliders relative to the fitted scale, wheel zoom
   with shift for X alone and alt for Y alone), and its lesson carries: **the axes have to be relative to
   the fitted scale, not absolute.** **The blocker is gone** — `on wheel` and its two values now exist
   (above) — but the prototype's axis-selective zoom wants **modifier keys**, and the runtime exposes none
   anywhere (`shiftKey`/`altKey`/`ctrlKey` appear nowhere in `js/allspeak`). So either the event grows a
   modifier reading, or axis selection comes from keys or clicks instead of the wheel.
   **Graham's scheme (2026-09-30), from Kdenlive and Audacity:** wheel alone scrolls up and down,
   **shift-wheel zooms**, drag does the panning, and there is no wheel-based left-right scroll unless a
   second or dual modifier is added. It makes sense and it lands as: wheel-alone and drag are expressible
   today; shift-wheel needs the modifier reading above, and shift is the *right* modifier to take because
   `ctrl`+wheel is the browser's own page zoom; drag already covers left-right, so the dual-modifier binding
   would buy a gesture the mouse already has at the cost of a step to learn. The axis-selective zoom the
   prototype used (shift for X alone, alt for Y alone) is **dropped** by this scheme, which is simpler: a
   zoom takes both axes, and the user has pan for the rest.
2. **Pan by mouse drag.** Not in the pane, and **expressible today**: `on pick`/`on drag`/`on drop` with
   `the pick position` and `the drag position` exist, and `asedit.allspeak` already uses them for the
   Blocks divider. Prototyped in `various/make-viz-plot.py:511-527`.
3. **The program behind the heat: one pane, code only.** Nothing in the pane — it draws a frame, marks,
   flow, axis, caption and key, no source text at all, and `$GraphArea`'s `"#"` is empty. The nearest
   prototype draws the source *beside* the plot in a left band sharing only y (`various/make-viz-plot.py`,
   `BAND=0.46`) and it *draws the prose* rather than excluding it. Two consequences worth settling before
   building: **the text is a bounded pool** — an element is a declared symbol, so there cannot be one
   `svgtext` per source line; the pool covers the rows in view at legible zoom, which is the cost of "at
   some zoom levels it can't be read anyway". And **the side panel is already an idiom here**: the Blocks
   view is a split with a draggable divider and a doc pane (`$BlocksSplit`, `$BlocksCodePane`,
   `$BlocksDivider`, `$BlocksDocPane`), so the textual detail is a reuse rather than new machinery.
4. **Program-related data per marker.** **No hook, and deliberately so.**
   `spec/viz-trace-format.md`'s "What the format deliberately does not carry" excludes prose, static
   structure and *values* — "nothing here records what was in a variable. That is the debugger's job, and
   the only honest bridge between the two is that they can agree on anchors." The one per-marker extra
   today is the marker's own label (`viz start on <label>` → `at=`). So the anchor is the designed
   extension point, and anything beyond a label is a versioned change to a format that
   `tools/check-trace.py` enforces on both runtimes — Graham's idea wants words before code.

**Graham's answer to item 3's bounded-pool problem** (2026-09-30): render the *whole* text at normal size
into an off-screen buffer once, then place it suitably scaled in X and Y behind the heat map — one render,
and everything after that is SVG. It removes the pool entirely: one element for the whole file instead of a
declared `svgtext` per visible row, and independent scaling in X and Y is exactly what an `<image>` does.
What it needs: an **`image` element in the svg plugin** — a fifth element type, the same five small additions
`path` needed — and a way to rasterise, since the language has no canvas vocabulary: a plugin that draws the
source into a canvas and hands back a data URL for the element's `href`. Two costs to decide on rather than
discover: a raster is resolution-fixed, so zooming past the scale it was rendered at goes soft (mitigated by
rendering well above 1:1, at the price of the buffer — 1400×8000 pixels is about 45 MB), and the text
becomes a picture, so nothing but an eye can read it. The side panel keeps its own copy of the truth: the
line under the pointer and its doc block come from the script and the analyser, not from the raster.

The prose half of item 3 is already solved off-trace: doc-block text comes from
`tools/asdoc-check.py --json` and joins the trace on script path and line numbers, which is where the side
panel's doc block would come from.

**A data gap that constrains the heat.** The recorder keeps per-line activity as **totals**
(`line_counts`) and a *sequence* only for anchors (`visits`: pc, steps, timestamp). So activity
over the run is derivable at **block granularity** — between consecutive visits, which is the
original "all the rows under the marked line, down to the next marker, take the same shade" rule —
but not per line. A per-line timeline would need the recorder to keep a series rather than a total.
The *transfers* are a sequence now (2026-09-29), so the flow has a timeline even though the work
does not.

**Next, in order — deliberately trimmed:**
1. **Look at the run picture** — `./various/plot` (2026-09-29). The script down the left with its
   marker dots, the run across the right: x is the sequence in steps, y is the line, arrivals are
   dots, transfers are faint vertical strokes, the two colour rules are on a toggle, and each axis
   stretches on its own with drag-to-pan. Judgement is the next input, and the questions it should
   answer are: does the row height the fit chooses want to be bigger; does the band want to be
   wider than 46% (one constant, `BAND`); and is the split honest, or is a *second* pane with its
   own scroll the better shape after all. One trap found while building it, and worth carrying into
   the real screen: the axes have to be *relative to the fitted scale*, not absolute — the fitted
   scale is whatever makes the window fit, which is 51.6 px/step for a 25-step window and 0.7 for a
   2000-step one, so any fixed slider range is pinned at one end before the user touches it.
2. **The doc-block prose, in the band.** The 2026-09-28 read said the prose is one of the parts to
   keep, and the block list is not in the sketch yet: the sections and their paragraphs are already
   in the model the generator reads (`section |` and `prose |`), so this is a draw pass and a
   decision about where a paragraph goes in a one-row-per-line layout. It is the cheapest remaining
   step that adds interpretation rather than decoration.
3. The first screen in `asedit.allspeak`, reading a **trace file** — agreed 2026-09-28: work from a
   trace for now; it needs nothing new from the runtime.
4. Only if it earns its place: running the script in-browser (needs the JS recorder), an
   overlay/code-map mode, and `viz diff`.

### The editor route — agreed 2026-09-29, and the next work

**The aim, in Graham's words:** the job of visualisation is to help the user *review new code as it
is created*, so the best place to invoke it is from inside `asedit`, where the new code lands. For
Python that means adding `viz` commands (by hand or by prompt), running the code to capture the
record, and then a **third editor view** — the picture. The JS route is similar. **A crucial aim is
to hide the plumbing.**

**Revised 2026-09-29, after Graham's note that some projects — RBR is the example — have to run on
remote hardware.** He does not expect asedit to reach that over SSH, so there must still be a way to
*record a run and bring it back for display*. That is not a complication: **the trace file is the
transport, which is what the format exists for** — its own purpose section says a recording is more
useful as a file than as an object held by the process that made it. Two consequences, and they
reorder the work:

- **The view must be fed by a *recording*, and a recording can arrive two ways** — recorded here, or
  opened from a file. The file route is both **smaller and required** for remote runs, so it comes
  first. The remote flow needs nothing new: the run writes the trace into the project
  (`tools/asviz-run.py --run --trace=<project>/…`, already supported), and whatever brings the
  project back — scp, git, a memory stick — brings the recording with it; the editor then opens it.
- **It needs no new server capability at all.** `/read` fetches the trace and the script, and
  `viz model <path>` gives the anchors and prose *statically* — both exist today. So the third view
  can be built and judged **before** `viz record` exists, which also means the remote case works on
  day one rather than after the in-editor path.

**A second worry removed, tested rather than assumed: the view needs no plugin command to read a
trace.** AllSpeak can walk the nested document directly — parse it with `json of`, reach
`traceEvents` with `property \`traceEvents\` of …`, index it with `element N of`, and iterate with
`while Events has element Index` (verified, including past the end); nested fields read with
`property \`args\` of …` then `property \`line\` of …`; and `X has entry \`k\`` tells the two event
shapes apart, so anchors (which have `line`) and transfers (which have `from_line`) can be handled in
one loop. The one thing that does *not* work from the shared reference is `the count of` — see
`language-pack-issues.md` #15.

**Drawing from AllSpeak is feasible, and verifiable without a browser — both tested.** The `svg`
vocabulary turned out thinner than the plugin's opcode list suggests, and the whole of it was
established by running a real script against a stub DOM in node (a harness that records
`appendChild`/`setAttribute` calls), which is how the view can be developed and checked at all:

- `create` fills a **parent symbol**, not `body` — so a root needs a host element first
  (`div Host` + `create Host in body`), then `svg Canvas` + `create Canvas in Host`. Children go in
  the root: `line Stroke` + `create Stroke in Canvas` ✓.
- `move <symbol> to <x> <y>` is how geometry is placed (a line's `move` sets `x1`/`y1`), and
  **`set attribute \`x2\` of Stroke to 30`** — the *browser* domain's attribute set — covers the
  rest, working on an SVG element like any other ✓. `set the text of <svgtext> to …` is text.
- So a mark costs three or four statements: `create`, `move`, then attributes.

**And the view cannot be drawn yet: the svg plugin has no `path` element — which is the real
finding.** Performance settled the plugin question in the other direction, and my own framing was
overstated: "three or four statements per mark" is a loop *body*, written once. But building the
first cut showed the thing that actually bites. An AllSpeak element is a **declared symbol**, so a
script cannot create N elements for N marks; a picture with a variable number of marks therefore
needs one element per *layer*, drawn from a `d` attribute grown by concatenation. `js/plugins/svg.js`
declares `circle`, `ellipse`, `group`, `line`, `rect`, `svg` and `svgtext` and **no `path`** — the
word does not appear in the file at all. So the requirement is one more element type in the
*existing* plugin, about five small additions mirroring `rect` (a declaration handler, a `Create`
case, the create-run case, and `getHandler`), which is additive and needs no new plugin. Sketch and
its stub-DOM harness are in `various/` (gitignored), failing at the declaration until then.

**The view is in the editor** (2026-09-29). `asedit.allspeak` gained a **Graph** pane: a third view
beside flat and Blocks, with its own button in the top bar (`asedit.json` gained `$GraphBtn` and
`$GraphArea`), a `GraphMode`, and the plot view appended as a portable section kept byte-for-byte
from `various/plotview.allspeak`.

**The recording is a file beside the script** — `<script>.viz.json`, written by
`tools/asviz-run.py --run --trace=<script>.viz.json <script>`. That is what makes the remote case
work: a run captured on the rig arrives with the project however the project travels, and reviewing a
script in the editor never executes it. When the file is absent the pane says so and *names it*,
which is the whole of the plumbing a reader needs.

**What was verified, and what could not be:** `asedit` still compiles to a program — **1489 commands,
253 symbols**, which is the check that matters because a broken editor analyses clean — all eleven new
symbols (`ToggleGraph`, `EnterGraph`, `GraphNone`, `DoExitGraph`, `Draw`, `VizCanvas`, `VizHost`,
`VizTrace`, `GraphBtn`, `GraphMode`, `VizBuilt`) resolve, the analyser reports **0 errors** and no new
warnings, and the layout JSON is valid with the button and pane in place. The one thing not verified
is the editor *in a browser* — there is none here — so the look and the click are for Graham.

**And the editor could not compile it — a real error, reproduced and fixed** (2026-09-29). Graham hit
`I don't understand 'svg' at line 1633` opening the editor. The cause: `edit.html` loads the runtime
and its plugins from a **fixed list**, and that list had no svg plugin — so `svg VizCanvas`, the
view's first declaration, had no handler.

**The diagnosis was a hole in my own verification, and this is the part worth remembering.** My
compile harness loaded *every* plugin in `js/plugins`, so it passed while the editor failed: it was
verifying a program nobody runs. `tools/asedit-check.js` now **derives the plugin list from
`edit.html` itself** and compiles `asedit.allspeak` with exactly those, so the two cannot drift. It
reproduces the failure when the plugin is removed — *"I don't understand 'svg' at line 1633"*, the
same line — and reports `commands=1489 symbols=253 OK` with it present. It also covers the standing
gap the repo's notes describe: `asdoc-check.py` reports doc blocks, and a broken editor analyses
clean, so the command count is the check that matters and now has a tool.

**And the page now prefers the working tree's build** (`deploy/dist/…`) with the deployed copy as a
fallback, so a change to the runtime or a plugin is visible without deploying — which the view needs
twice over, since it depends on the new `svg` plugin *and* on the `path` element added to it.

**First real picture** (2026-09-29). With the markers moved onto the parser's own loop (lines 206–213),
Graham ran `tools/asviz-run.py` and clicked Graph: **41 arrivals, 93 transfers, lines 206–481, 301
steps**, and the plot matches those numbers exactly. It reads as a parser walking a document — the
descending staircase *is* the run advancing down the file, and the tall amber verticals are control
going back up to the loop. The window's own seven lines are a sliver at the top for the honest
reason that the window calls code 275 lines below it.

**A defect the picture found and the harness could not:** the arrival dot was a constant 9 units on a
2.1-unit row, so each arrival was a bead four rows deep. It is now sized to the row and clamped
(3…14). Third time this session that looking at the rendered thing caught something measuring did
not (the pan bug, the faint strokes, now this) — worth remembering as a method, not an anecdote.

**Two traps worth carrying:** a declaration must precede its **use**, not merely its section, which is
why the host declares `VizTrace` rather than the view (the harness failed with "I don't understand
'put'" the other way round); and the analyser rejects `!!` prose *between* labels in a section, so the
parts of a multi-label block use `!` comments and the prose belongs in its opening.

**And the deployed copy is stale:** `deploy/code/asedit.json` differs from the root one, so
`./deploy-sync` is needed before the site shows the Graph button. Opening `edit.html` from the working
tree shows it as it is — and that page cache-busts its own fetches (`?v=` + a timestamp), so no
hard-reload is needed.

**The view is visible** (2026-09-29). `various/plotview-check.js` now writes a page containing the
view's own SVG output — not a redrawing of it — so `various/plotview-trace-run.html` and
`various/plotview-parser.html` can simply be opened. That is the honest route to "seeing it" from a
session with no browser: the harness serialises what the AllSpeak actually created.

**And looking at it caught three things the harness could not**, which is the argument for the page
rather than a nicety: the arrival dots were *filled* hairline segments and would have rendered as
**nothing**; the axis labels had no `text-anchor` or font size, so the y labels would have run into
the plot; and the serialiser itself tested `innerHTML` for truthiness, so a label legitimately
reading `0` — the first step tick, every time — came out blank. Every one of those passed the frame
check and the element counts.

**And looking at it immediately caught something the harness could not.** The arrival dots were
*filled* hairline segments (`M x y h0.01` with `fill=#e5484d`), which render as **nothing at all** —
a dot has to be a stroked hairline with a round cap. Every coordinate was inside the frame, every
count was right, and the picture would have been blank. Worth remembering as the reason the page is
a step and not a nicety.

**The view is now editor-ready, and one of my own plan steps was wrong** (2026-09-29). I had "the
fetch" as the next piece; it does not belong in the view at all — the plugin contract puts
*acquisition* on the host side ("file read, fetch, editor buffer — stays on the host side, because
that is where the platform differences live"), so the view takes a trace and draws it. What it
actually needed was to be shaped for embedding, and it now is:

- **Every symbol is prefixed `Viz…`.** Names are the scarce resource in a flat table of declared
  symbols, so the section has to be able to sit beside asedit's own drawings, variables and elements
  without colliding.
- **The host owns the panel and the trace** — `VizHost` and `VizTrace` are declared and filled by
  whoever embeds it, so nothing is fetched or created behind the host's back.
- **`Draw:` builds its elements once and replaces the marks on every later call.** Verified by
  drawing twice: 13 elements either way, where a rebuild would give 26, with the marks landing
  correctly from each trace (9+10 for `trace-run`, 4+4 for `parser`) and every coordinate inside the
  frame. That is what makes a redraw a redraw rather than a second picture.
- **`return`, not `stop`** — inside the editor this is a section of the editor's own program, and
  stopping would end the editor.

**And a placement rule found by getting it wrong: a label is not a barrier.** The body below `Draw:`
runs by *falling through*, so a section placed before the host's main flow draws before the host has
created the panel — which is exactly what happened, and showed up as
`Cannot read properties of undefined (reading 'appendChild')`. The section must sit after the host's
`stop`, and that is now said in the sketch rather than left to be rediscovered when it is pasted into
`asedit`.

**And the first cut of the view now draws, and is fitted** (2026-09-29). The geometry is no longer a
guessed scale: it is fitted to the trace's own ranges (min/max line, total steps), so a run stays
inside the frame whatever its size. Verified on three real traces — `trace-run` (9 arrivals, 10
transfers), `parser` (4 and 4), `trace-fixture` (2 and 0) — with every coordinate inside the 1000×700
viewBox, and on a synthetic **600-line span** that would have collapsed onto a single line before the
fix below. Still two path elements in every case.

**The fit needed a fix that is worth remembering, and it is a language behaviour rather than a
mistake in the code:** AllSpeak's arithmetic is integer-first and **division truncates**
(`divide 10 by 3` is 3), so a scale factor like 580/626 is **0** — the picture would silently flatten.
The fix is the documented scaled-integer pattern, multiplying *before* dividing, so the intermediate
stays large and the result is exact to a unit. It is in `learn/reference/07-arithmetic.md`, which is
where I should have looked first. Worth knowing because a *fractional* layout looks like the obvious
way to write a fit, and the failure is a wrong picture rather than an error.

**The axis is in, and the element count is now constant** (2026-09-29). Ticks are a **fixed pool of
four labels a side** — a label is an element, so it cannot be made per tick any more than a mark can
be made per arrival — spaced by a third of the span and placed with the same fit the marks use, so a
label sits exactly on the line it names. Verified on two traces: `trace-run` labels lines 25/31/37/43
at y 60/234/408/582 and steps 0/8/16/24 at x 60/341/623/904; `parser` labels lines 379/387/395/403
and steps 0/6/12/18. **The whole picture is 13 elements** — host, canvas, frame, eight labels and two
mark layers — whatever the number of marks, because only the `d` strings grow.

Two consequences worth keeping. **The pool size is the axis's resolution**, so a 4-tick axis is what
the design has until someone wants more. And **in the editor the y labels may be redundant**: if the
plot's rows are kept in register with the editor's text, the editor's own line numbers label the same
lines, and the pool drops to one side.

**And the static-element model bites in a second way:** the axis's tick positions collided with the
marks' existing `Y2`, which surfaced as *"Duplicate variable name 'Y2'"*. Not a trap in the notes —
just what happens when every element and every value is a name in one flat table.

**Documentation fixed 2026-09-29** (Graham: "certainly worth adding"). Three defects, each found by
using the thing and none of them knowable from the page: the **Python list example** in
`learn/reference/04-collections.md` showed the JS spelling (`set element 0 of Items to`, which does
not compile in Python) and the table said the two accessors agree — neither does, so the row and the
example now show `append` + `item`; the page gained the **stack/queue shape** it never mentioned; and
`learn/reference/18-json.md` now gives the iteration loop **each runtime actually needs** (Python
`the count of` + `item`, JS `has element` + `element`) instead of claiming a parsed value "can be
counted". Both loops were run before being written down. The fr/de/it copies of `04-collections.md`
still need the same three changes — they are hand-kept, not generated.

**Graham's note on that, and what checking it turned up (2026-09-29):** the collision applies to
*scratch* variables rather than elements, and he added a **stack** type so a name can be pushed on
entry and popped on exit and re-used in between. Verified in Python — `stack S` + `push 10 onto S` +
`pop V from S` gives `popped: 20` ✓. **But it is Python-only, and in JS the same two words mean
something else entirely**: `stack S` is not a keyword there, while `push {value}` and
`pop [into] {variable}` are the *argument* and *call* stacks. So the idiom is unavailable to anything
that has to run in the browser — including this view, which names its scratch values by role instead.
Recorded as `language-pack-issues.md` #16, with the note that the type is undocumented in
`04-collections.md`'s "four shapes".

**And the project's own trap about undeclared variables caught me live**: five declarations dropped
in a rewrite surfaced as "I don't understand 'put'" at the first statement using one, not as "not
declared" — exactly as the root `AGENTS.md` warns. With `path` added, `various/plotview.allspeak`
reads a trace, walks it in AllSpeak, and emits two `d` attributes — and the stub-DOM harness
(`various/plotview-check.js`, which is the development loop for this piece since there is no browser
here) confirms it against the trace of `tools/trace-run.allspeak`: **9 arrivals and 10 transfers
drawn as two elements in total**, with the geometry checked by hand (`M72 360` is steps 1 × 12 + 60,
line 25 × 12 + 60 — the first arrival). What it does not yet have: a real fit to the trace's ranges
rather than a fixed 12 units per step/line, the axis, and the fetch. Both files live in `various/`
(gitignored); the plugin change is real and additive.

**Which also settles per-mark colour:** one path carries one colour, so the accumulated heat ramp
(scheme B) becomes one path *per colour band* — quantised, which is what a heat map reads fine at.

**Which makes the drawing-plugin question one of *concision*, not capability** — which is where
Graham's opening instinct ("maybe a new plugin for drawing tasks") lands, now with evidence rather
than a guess. One `draw line from … to … in Canvas` would replace four statements per mark, and a
picture is hundreds of marks; against that, a plugin is a new artefact to maintain and one more
vocabulary to learn. Worth deciding *when the first view is drawn*, from how the script reads —
which is the same "build it cheaply and judge it from the picture" rule the sketches followed.

**A finding that removes a worry: the picture needs no new drawing plugin.** AllSpeak has no canvas
2D context (there is none anywhere in the JS runtime), but the existing `svg` plugin creates `line`,
`rect`, `circle` and `svgtext` — which is the whole vocabulary the picture uses for tracks, arrival
dots, transfer strokes and the script text. And because AllSpeak generates the elements it can cull
to what is *visible*, so a long run does not create a node per visit despite `limit` defaulting to
100,000.

**And the third view may be smaller than the sketch.** `asedit` already renders the script — it is a
CodeMirror editor — so the view may need only the **plot** panel, scrolled in sympathy with the
editor's own text, which is the two-panes-held-in-register idea Graham described in his first
message. That is a simplification of `various/make-viz-plot.py`, which draws both bands in one canvas
because it had no editor to sit inside.

**The shape it takes, given what already exists** (`server.allspeak` already serves `/list`,
`/read`, `/write`, `/version`, `/restart` in AllSpeak, and asedit already talks to them with
`rest get`/`rest post`):

1. **`viz record`** — a plugin command that runs a script (from a path *or from the buffer text*)
   with a recorder attached and hands back what the picture needs. The counterpart of the existing
   `viz model`, and the piece every host below needs. *(Not built yet — see the two findings below,
   which the groundwork turned up and which it depends on.)*

**Groundwork done 2026-09-29, before writing `viz record`:**

- **A plugin can run a nested program, and the host survives it.** Verified directly: a plugin
  command that constructs and starts another `Program` runs it (`[inner] X = 42`), the host
  continues correctly, and a nested run that *fails* — compile error or runtime error — is caught
  and leaves the host unharmed. So in-process recording is viable.
- **The pattern to copy already exists.** `compileOnly` documents the two hazards in its own
  docstring and handles both: `Program.__init__` resets the module-global `queue` that belongs to
  the running host, and a failing compile calls `sys.exit()`, which would take the host down with
  it. `viz record`'s runner must save/restore the queue and catch `SystemExit` exactly the same way.
- ~~**A defect, and it is the editor's core case: `viz model ... as <source>` did not analyse the
  supplied text.**~~ **Fixed 2026-09-29.** `compileOnly(path, lines)` never used `lines` — it
  compiled the file at `path`. Demonstrated before the fix: supplying a one-line `stop` for a file
  that has a label gave `model | lines=1 ... labels=1` with `anchor | ... | line=3 | name=Inner` —
  the *text's* dimensions and the *file's* anchors in one report, a plausible wrong answer rather
  than an error, which is the worse kind. **The JS plugin never had this**: it tokenises the text it
  is given and compiles that, so this was a Python-only divergence between the two analysers.
- **The buffer question, decided 2026-09-29: the runtime compiles lines, not just a path.**
  `Program(arg, testMode, source=None, name=None)` now takes source with no file behind it — the
  editor's unsaved buffer is the case it exists for, and text should not have to be written to disk
  to be compiled, looked at or recorded. The command-line branches (`-v`, `debug `, argv splitting)
  sit in the else, where they belong. Verified end to end on a buffer that has never been saved: it
  compiles, **runs** (`counted to 3`) and analyses (`lines=10 | labels=1 | anchors=3`, with the
  label and both markers at their buffer lines).
2. **A `/viz` route** in `server.allspeak` — a handful of AllSpeak lines, mirroring `/read`.
3. **A third view in `asedit.allspeak`** — **drawing from a trace file first**, since that is the
   smaller step and the one the remote case needs. Then `viz record` and the `/viz` route add the
   "record here" button to the same view. The drawing uses the `svg` plugin, culled to what is
   visible; the code that proves the layout exists in `various/make-viz-plot.py`.

**Run safety — decided and built (2026-09-29).** Recording *runs* the script, so a runaway would
hang the editor. The guard is a **time budget on the program's own work** rather than a count of
commands, because a loop that waits or calls out between iterations reaches any command count
eventually. Graham's refinement: *ignore programmed delays, and actions that are known to time out
themselves such as REST calls*. Measured, and it works — a busy loop stops after **2000.0 ms of own
work**, while a loop of `wait 200 ms` accumulates only 25.6 ms and is left alone.

**But the budget alone cannot be the only bound, and the test proved it:** a loop that *waits*
between iterations never spends its budget, so the first version ran until the test harness killed
it. So there are two, with distinct jobs — `budget` (own work, 2 s: "this script is computing too
much") and `ceiling` (wall clock, 20 s: "this script has been running too long to be a review of
anything"). Graham's reading of the second: *a wait loop that never returns is likely to be a
coding error* — so the ceiling is not a compromise set high enough to spare honest scripts, it is
the guard for a mistake. That is why the two reasons are told apart and *reported*, not just
recorded: `stopped | reason=wall | elapsed-ms=20000 | own-work-ms=26 | the run was stopped: a loop
that never returns is usually a mistake`, against `reason=work` for slow code. An overrun that
shows only as a short trace is a puzzle; said out loud it is a diagnosis.

**One defect found by testing the guard, worth remembering.** Halting a run by setting
`program.running = False` from inside the recorder does *not* stop it cleanly: the command already
being dispatched runs anyway, finds the program stopped, and reports *"Improper use of runtime
function"* — a lie about what happened. The recorder's `tick` now returns `False` to mean "end the
run", and `as_program.py`'s loop breaks on it, so no command runs with the program already stopped.
That is a one-line hook in the runtime's loop, alongside the recorder call it already had.

The JS recorder has neither bound yet — a deliberate divergence to close when the JS route is
attempted.

### The agent-assisted flow (Graham, 2026-09-29)

The idea, in his words: since an agent is writing the code it can also place the markers. *"Show
me what happens when I click the Add button"* — the agent works out where `viz start` and `viz
stop` belong, runs the script, captures the recording and shows the picture.

**Settled: the markers are reverted after capturing.** The author's file goes back exactly as it
was; the markers were scaffolding for one question. `viz start on <label>` is the preferred form
where a label exists, because it puts the edit a line or two *outside* the block being studied
rather than an opening brace inside it.

**Three obstacles, and only one of them is the prompt.** They are worth knowing before the flow is
built, because each lands on different work:

1. **Placing markers mutates the author's file.** Runtime-safe — `viz` is a no-op without a
   recorder — but the doc-block `@hash`es go stale, so a revert is the only clean end state.
2. **Running is the hard half for a browser app**, and "when I click Add" makes the *event* the
   subject, so the run has to be a real click in a real DOM. Both jsdom and Playwright are already
   devDependencies.
3. **Displaying** is currently `./various/plot`, a Python generator writing an HTML file, and now
   `./various/plot --js`. That covers a trace from either runtime, but "in the browser, in the
   editor" is the asedit screen, which is not built.

**The cheap kill:** the workflow half needs nothing new on the Python side — `./various/plot`
already finds a script, runs it, records it and draws it. So the prompt and the marker step can be
tested today, before any browser work, which is the cheapest way to find out whether the idea
survives contact.

**Cut for now,** because they add artefacts or steps without answering the first screen's
question: a separate report document, and `viz diff`. The JS recorder is no longer a prerequisite
for the visualiser either — a trace written by the Python runtime is a complete input, which is
what the portable format was for.

**Unverified here:** that a trace renders as expected in Perfetto or `chrome://tracing`. The
documents validate against the format as specified, but the rendering needs an eye on a browser —
`ui.perfetto.dev` accepts the file directly, so that is a one-minute check for whoever has one.

**The two halves of the visualiser are now in line** (2026-09-29). The JS plugin gained the
**recording report** — `AllSpeak_Viz.trace` for the host to hand the recorder to, and
`traceRecords()`, emitting `trace`, `seq`, `unvisited`, `cold-anchor`, `hot-anchor` and `hot-line`
records exactly as the Python plugin does. Measured: with no recording the two sides' record kinds
are **identical**; with one, the only difference is `hot-line` 7 against 8 — Python's extra line
being the label command it executes and JS does not, which is the documented `steps` difference
showing through. The mirror-image wart was fixed at the same time: the Python host's target output
now goes to stderr like the JS host's, so a `print` can no longer land in the middle of the model
records. The spec gained a fourth runtime difference, observed concretely here: a label and the
command after it are one pc in JS and two in Python (`Worker:` + `viz start`), so an anchor list
can differ in size as well as in lines.

**Working from a trace file is agreed for now** (Graham, 2026-09-28). Still open: whether the
editor *also* runs the script itself in-browser — the difference between JS-Recorder-first and
Editor-first. The **JS recorder landed 2026-09-29**, so the first half of that question is
answered: `js/allspeak/Run.js` ticks a `program.vizRecorder` once per command, `js/plugins/asviz.js`
carries the Recorder and the draft-2 writer, and `tools/asviz-run.js --run --trace=` writes one.
`./various/plot --js` draws it, and the two runtimes' traces agree event for event on
`tools/trace-run.allspeak`. What is still missing for the browser is an *attach point*: the node
CLI attaches the recorder, and nothing in a page does, so a browser run records only if the page
wires it.

### 8. Flags: `it` / `fr` / `de` are provisional

The three flags now in `deploy/icon/` are flat PNG tricolours copied out of `resources/flags/`,
a plain ISO-code set. The intended look is the **wavy banner** of `en-flag.svg`, which is
OpenClipart's "US/UK flag" by **klainen** — `openclipart.org/detail/168121/usuk-flag`, and the
attribution is inside the file itself. Graham is looking for where the wavy set came from; when
it turns up, replace the three PNGs and the three `flagImage` values in `deploy/config.json`.

Two things already established, so nobody re-derives them:

- **OpenClipart is public domain** by contributor dedication. Artwork from there carries no
  attribution obligation; the comment in `en-flag.svg` is a courtesy, not a requirement.
- The PNG set in `resources/flags/` records no provenance of its own. `en-flag.svg` documents
  its source *inside* the file, which is the habit worth copying.

**JSON display in the editor** (2026-09-29). `OpenFile` now calls a `FormatJson` step for any `.json`
name (including `.viz.json`), formatting **only a single-line file** — the case Graham named — and
leaving a laid-out file at its author's indent. It uses the runtime's own `json format`
(`JSON.stringify(val, null, 2)`), and catches malformed input so a file that will not parse still
opens. The call sits **before** the tab's saved text is recorded, so opening a file does not mark it
modified. Verified with five cases against the routine extracted from `asedit`. The guard exists
because `asedit.json` is four-space: always reformatting would have rewritten the editor's own layout.

**The revert was the poll, and the fix is symmetry** (2026-09-29). Graham saw the JSON format itself
and then revert to one line after a couple of seconds. Cause: `asedit` has **no Save button** — it
auto-saves every 500 ms and `PollFile` re-reads the current file every 3 s — and the formatter sat
only in the *loader*, so the tab held formatted text while the file on disk was still one line. The
poll compared them, found a difference every pass, and silently reloaded the minified text over the
tab; three seconds per round, which is why it read as a delay rather than a loop.

**The rule to carry: a transformation applied to data that is read on two paths must be applied on
both.** The routine now takes its text in `JsonText` and runs in the loader *and* the poll, so the
comparison is like with like and the tab settles. It also converges rather than oscillates — a
formatted file is multi-line, so the guard leaves it alone, and formatting twice equals formatting
once. The file on disk is *not* rewritten by looking at it; it becomes pretty once the user edits it,
because the auto-save writes what they see.


**The Graph pane now names the run it drew** (2026-09-29). A recording is a file beside the script, so
a *failed* recording leaves the previous one in place, and a stale picture is exactly as convincing as
a fresh one. The view draws a caption under the plot — `lines 152-493, 328 steps` — which is the only
thing that can tell the two apart. Both copies of the view carry it (they must stay in step by hand).

**Measured while chasing an unexplained freeze:** the wrapped script compiles in 48 ms (JS) and fails
cleanly on `viz end` in 13 ms; the Python analyser takes 0.27 s; the host runs and fails fast; the view
draws the on-disk recording in 1.0 s and a **whole-script** window in 0.98 s (46 marks, 24.7 KB — a
whole-script window is *not* big, so a scaling hang is ruled out). **The freeze itself is still
unexplained** — everything reachable headlessly is fast, so the browser console is the next evidence.

**Marker words, worth remembering:** `viz start` … `viz stop`. Not `viz end` — the compiler says
*"viz: expected `start` or `stop`"*, and `examples/chemical/parser.allspeak` already carries a pair at
lines 206/213 (that is the recording in `parser.allspeak.viz.json`).


**The graph is slow because `element N of <array>` re-parses the array — measured at ~8 ms per access
on a 2472-event trace** (2026-09-29), and the view makes about four such accesses per event across its
two passes, so the cost is quadratic in the trace: 493 marks 6.8 s, 740 14.6 s, 1481 54.5 s, 2468 over
two minutes. Isolated: `element` 8.7 ms/iteration, `property` 0.24 ms, an empty loop 0.18 ms.

**Shipped:** the view yields every hundred marks (`wait 1 millis`, measured free — 6.75 → 6.83 s) so
the browser is never blocked for the whole pass, the host prints `Drawing the recording - please wait`
before the wait and clears it after, and the view captions the run it drew so a stale recording is
visible. A `wait` inside the `gosub`'d draw resumes correctly, verified by the marks still coming out
right.

**Not yet done, and the real prize:** stop `element N` re-parsing — a runtime change, ~1000× on this
pane and on any script using lists. Graham's call, since it touches the core.


**The editor now predicts a slow recording and learns the rate** (2026-09-29). `VizPredict` (before the
draw) and `VizRemember` (after) sit in the Graph block: milliseconds per kilobyte, measured from the
draw that just happened, kept in `.viz-calibration.json` in the project root. Over five seconds and it
pops up a warning naming the estimate in seconds and suggesting narrower markers. Silent on a first
run, because there is no measurement yet. Verified verbatim: 58,900 ms / 402,000 bytes → 150 ms/Kb →
58 s. **Per-machine file, so it wants gitignoring.**

Graham's ruling, worth remembering: the wait is *acceptable* — other machines will be faster, the
example is extreme, and a visualiser should highlight parts of a run rather than trace whole ones. He
also made the good point that having to wait makes the next request more considered. So **the slow
case stays slow**: the message explains it and nothing refuses to draw. The `element N` re-parse stays.


**A tab change now leaves Graph mode** (2026-09-29). Opening a file while the graph was up loaded it
into `ContentEditor`, which the pane had hidden — so the file opened correctly and invisibly, and only
the **Edit** button revealed it. This was not a new rule but an old one not applied: `ActivateTab`
already began `if BlocksMode is 1 gosub to DoExitBlocks`, so it now does the same for `GraphMode`, and
`ActivateTab` is the one place every route to showing a file passes through. `DoExitGraph` already
restored the pane, so the fix is a call rather than new code.

Worth carrying as a *shape* of bug: **a mode that owns a global flag has to be left by every path that
wants the screen back**, and the tell is a pane that hides the thing you just asked for.


**Two simplifications from Graham's validation of `asedit`** (2026-09-29). The empty block 24 was the
view's own documentation header, closed by a `!!!` of its own — prose with no code, which Blocks
renders as a blank pane. The prose was right and the terminator wrong: it now opens the section
holding the view's code, in both copies, 25 sections → 24. And the nested `if` at line 1459 collapsed
to one range test with `and` — verified equivalent, since both sides are plain integer comparisons and
nothing on the right can fail when the left is false. **It is the only one of that shape in the file**,
so the pattern is not widespread. `and` itself was checked before use.


**The heat is built and verified, but not yet switchable** (2026-09-29). Four band paths with a
cool-to-hot ramp whose hottest band is the plain marks' own colour; `line_counts` from the window
("the number of times each command on a line executed") read per arrival; bands over the counts' range
across the marks' own lines, so the ramp fits the run. **`VizBands` is the toggle** — view-declared,
host-settable, and unset means 1, which is exactly the old picture. Verified both ways: the default
carries the same 9 marks with the bands empty, and at four bands the bands carry 2+3+0+4 = 9 — no mark
lost, none double-counted. 18 elements now (was 14).

**Next, both small:** a top-bar control that sets `VizBands` (1 and 4), and a legend — a heat picture
without one is a mystery, since the colours say nothing until a reader can see what each band covers.


**A corruption found in `examples/chemical/parser.allspeak` and repaired** (2026-09-29): two lines
joined — `!! Constants: …` welded onto `    script Parser` — plus rewritten hashes, which is the
signature of a doc-block write-back from Blocks mode. **And his `viz start`/`viz stop` markers are not
in the file**, so something wrote it back without them. Candidates: the Blocks write-back (rewrites the
buffer from parsed sections) and `PollFile` (reloads from disk when the tab is clean). **A write path
that silently drops an edit outranks the rest of the visualiser work.**


**The heat is switchable** (2026-09-29): a `Heat` button in the top bar that flips `VizBands` between 1
(plain marks) and 4 (the ramp), redrawing on the spot. **`VizBands` is a host input like `VizTrace`** —
declared by the host, read by the view, so a host that never sets it gets the old picture. Verified: the
toggle flips 1→4→1 (handler extracted and run), the bands carry 2+3+0+4 = 9 marks with none lost, and
the default path is byte-identical. 1670 commands, 0 errors.

**And the checker earned its keep:** it refused the first attempt with `I don't understand 'VizBands' at
line 1580` — the view declared it *after* the host code using it, because "declare before use" is
**positional in the file**, which I had reasoned my way around and got wrong. The tool written this
morning for a different bug caught this one.

**Left: the legend** — the colours mean nothing until a reader can see which counts each band covers.


**`Non-numeric value` on the first Graph, fixed** (2026-09-29). `add 1 to VizBreathe` ran before anything
put a number in it — declared but never initialised, unlike every other scratch value in the view. The
runtime's report is not fatal, so the picture appeared anyway and the *yield silently never ran* — which
matters, because the yield is what keeps the browser alive on a long pass. Fixed with `put 0 into
VizBreathe` at the top of the draw.

**And the harness had reported it all along:** `various/plotview-check.js` writes runtime errors to
stderr — with a comment saying that is the point — and I had been running it `2>/dev/null` for hours,
discarding the evidence the line exists to preserve. **Never redirect stderr on a check whose stderr is
its verdict.**

**Unexplained:** on Graham's recording (44 arrivals, 99 transfers) the harness draws nothing at all and
reports no error, while the same harness draws a small recording correctly. His browser shows the graph,
which points at the harness, but that is a guess. **First job next session.**


**The learned rate, seen working** (2026-09-29): the first Graph warned 51 s for a drawing that took
under 1 s. The calibration explains it — it now holds **7 ms/Kb** (predicting 166 ms for the 24 KB
recording) while 51 s implies **2140 ms/Kb**, so the sample was **~306x slower** than the machine is.
That sample was genuine: it was the tens-of-seconds drawing made while the yielding was dead from the
`VizBreathe` bug. **A broken yield made a run slow, and the slowness was learned as the machine's
speed** — then corrected by the next run, because `VizRemember` overwrites rather than averages. The
warning now says its number is a measurement of the last drawing rather than a promise.


**Marks and Heat are one view: the fold is agreed but NOT landed** (2026-09-29). Graham's call: with the
heat always on, Marks differs only in the colour of the markers, which does not justify a second view.
The fold: the heat becomes the only scheme, the view owns the band count (fixed at four), the button,
its handler, and the plain `VizArrivalDots` path all go.

**The attempt failed halfway and left nothing changed in the editor.** My patch wrote the scratch sketch
*before* asserting the result was sane, so a failed assertion left the sketch half-changed — its
`path VizArrivalDots` declaration and creation gone, five references still in place. `asedit.json` lost
its Heat button mid-attempt; **I put it back**, so it matches `asedit.allspeak` again (verified).
`asedit.allspeak` itself was untouched and compiles at 1671 commands, 0 errors.

**The lesson, and it is operative: "fail closed" means build the whole result in memory, assert, then
write once.** Earlier patches here did that; this one wrote per-file and did not.

**First job next session, before the legend:** regenerate `various/plotview.allspeak` **from
`asedit.allspeak`**, which holds the view verbatim — then make the fold properly. Until then the
harness cannot run, so no headless verification is available, and the "draws nothing on his recording"
puzzle stays open.


**The tiny dots in Heat, fixed** (2026-09-29): the four band paths never got `stroke-linecap: round`,
so `M x y h0.01` drew a 0.01-long rectangle instead of a dot — while the plain path had the line **and
a comment explaining why**. The rule was documented one screen above the code that broke it. Fixed in
all four; verified in the generated HTML (5 round caps; band 0 = colour + cap + width 14).

**And the sketch is repaired by regeneration:** `various/plotview.allspeak` now comes **from
`asedit.allspeak`**, which holds the view verbatim — one source and a one-line regeneration, rather than
two copies kept in step by hand. The harness works again, so headless verification is back.

**Next: the fold.** Heat becomes the only scheme, the view owns the band count (four), and the button,
its handler and the plain `VizArrivalDots` path all go. **Build the whole result in memory, assert, then
write once** — the discipline whose absence broke the sketch last turn.


**The fold landed: two buttons, one colour scheme** (2026-09-29). Graham's point was exact — three
buttons for two panes, and the third was mine. The heat is the only scheme now: the `Heat`/`Marks`
button, its handler and its layout entry are gone, and **the view owns the band count** (fixed at four),
so nothing carries across a re-open. His question about disabling the current view's button is answered
by the editor's own convention, which is better: **the current pane's button offers the way back**,
reading `Edit` — what Blocks has always done, and now what Graph does. Verified: 1659 commands, 0
errors, layout valid, and the heat drawing 2+3+0+4 = 9 marks on the small recording with no stderr. The
plain marks path is left **inert** and should be removed next time that code is open.

**Open puzzle, two explanations dead:** Graham's recording draws nothing **in the harness** while his
browser draws it and the harness draws a small one. Not backticks or `${` (0 of each — so not the
harness's template literal) and not the 24 KB single source line (pretty-printing changes nothing).
**The browser is ground truth and it works**, so it is a harness limitation — cause still unknown, and
I stopped guessing rather than dressing one up.


**Small dots from the second Graph onward, fixed** (2026-09-29). An asymmetry: `stroke-width` was set in
**both** the built-once block and the per-draw block, while `stroke-linecap` was set in the built-once
block **only** — so a redraw restored the width and lost the cap, and a mark without a round cap is a
0.01-long rectangle. Fixed by setting the cap beside the width in the per-draw block; the build-time
copies stay, as the width's do.

**The class, named — it has bitten twice:** **an attribute that must survive a redraw belongs in the
per-draw block.** The plain marks path had its cap right; when I added the band paths I copied the
colours faithfully and missed the cap. That is an argument for deleting the inert plain path rather than
leaving it: it is the template the mistake came from.

Verified: compiles, 0 errors, the cap at line 463 beside the width at 462, sketch in step. **Not
verifiable headlessly** — the harness's stub DOM does not reproduce whatever the browser does between
draws, the same limitation as the recording that draws nothing there and fine in his browser. His click
is the test.


**SOLVED: the tiny dots were a STALE COPY, not a code bug** (2026-09-29). `edit.html` fetches
`asedit.allspeak` **relative to the page**, and Graham was running the **deployed** copy —
`deploy/code/asedit.allspeak`, **77,488 bytes vs the root's 82,668**, with **no heat paths at all** and
its single `VizArrivalDots` path taking its `stroke-linecap` **only at build** while restating
`stroke-width` per draw. That is precisely "right the first time, small from the second onwards". The
fix had been in the root copy for two rounds and **never reached the copy he runs**.

**Fix: `./deploy-sync`.** Found by a read-only `explore` subagent after I had spent two rounds editing
the wrong file — a good argument for delegating a hunt when the obvious suspect is exhausted.

**Landing lesson:** there are **two copies of the editor** and the page runs whichever is beside it, so a
root change is invisible until synced. **Next session: make the deployed editor load the way the plugins
do — one copy, not two to keep in step.**

**Also landed:** `PollFile` now skips Graph mode as it already skipped Blocks (the poll was replacing the
editor's content every three seconds behind an open pane). **Still to do:** delete the inert plain
`VizArrivalDots` path from the root copy — it is the template this whole class of mistake came from.
