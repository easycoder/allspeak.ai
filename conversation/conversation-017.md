# 2026-09-22

## 21:25

I have been thinking about some form of visual debugger for AllSpeak, to help code reviewers get a mental picture of what is happening. The following is just an outline of my thoughts; I would like to see if you think it is possible or whether there's already a choice of similar techniques that could be adapted. I do not tthis stage to write any code, just discuss the possibilities.

[Pasted text #1 · 15 lines — outline of a visual debugging panel: zoomable whole-script view, labels as trace points, timeline of label visits, blue→red colour ramp, vertical position = label position in script, horizontal = timeline, estimated per-instruction timings, temp labels for detail]

**Assistant**

Verdict first: yes, this is not only possible, it's one of the better-fitting designs for this particular runtime — because the quantity you want to instrument (which label execution is at) is already a first-class part of the compiled program, and there is exactly one place to hook it. The part I'd re-think before building anything is the horizontal axis.

**What the runtime already gives you**

I traced the compile and run paths to check the mechanism holds up.

- A compiled program is a flat array of command objects, each carrying `pc` (index), `lino` (source line), `domain` and `opcode`. See `AllSpeak_Compiler.compile` and `addCommand` in `js/allspeak/Compile.js`.
- **Labels are not commands.** A label becomes a symbol-table entry pointing at the first command after it (`Compile.js` `compileOne`: `this.symbols[name] = { pc }`). Variables are symbol records with `isSymbol: true`; labels point at an ordinary command or at `program.length`. So "symbols that are labels" is derivable, and a `pc → label(s)` map can be built once at compile time. Consecutive labels share a pc.
- **All control transfer funnels through one loop.** In `AllSpeak_Run.run` (`js/allspeak/Run.js`) the `while (program.running)` body does `program.pc = handler.run(program)`. Every internal `goto`, every `gosub`/`return`, every `if`/`while` branch, `fork`, and event-handler entry surfaces there. That's your single instrumentation point — no per-command edits.
- Loops compile down to bare numeric `goto`s with no synthetic symbols (`While`/`If` in `Core.js`), so the symbol table contains *only* the user's labels and variables. Clean namespace for the map.
- The script text is reachable at run time: `program.source.scriptLines[lino - 1].line`. Both a text view and a block view have their data.
- A trace facility and a panel already exist and are documented: the `trace` / `trace ... vertical` commands (`TRACE_SETUP`/`TRACE_RUN` in `Browser.js`), `set the tracer rows`, `debug step`/`debug stop`, the `tracing` condition, and `writeToDebugConsole`. The panel is an HTML element your script creates (`<div id="allspeak-tracer">`). Precedent and a home already exist (`learn/idioms/11-debugging-as.md`, `codex/en/code/step10.as`).
- The Python runtime has a ~1,000-line PySide6 debugger in `allspeak-py/allspeak/debugger/` — step/watch/value, no visualisation. So the idea already exists in-repo in the other implementation.
- Doc blocks (`!!` … `!!!`, with `@hash`) are already-parsed section boundaries. That's a free coarse-grained structure map for the fully zoomed-out level, and `tools/asdoc-check.py` already knows how to find them.
- Rendering options are in place: the `svg`, `vfx`, `float` and `ui` plugins, plus Webson for panel layout.

**The design tension to settle first: x can't be both text and time**

Your spec says "the horizontal axis, as well as displaying text, is also a timeline." Those are two different views and they can't share an axis. Two coherent readings:

- **(A) x = time, y = source position.** The quantitative view. Text then cannot live in the plot — put source lines in a left-hand gutter column aligned to y (Perfetto's code view, or a flame chart with a source axis). Horizontal zoom is time, vertical zoom is text size.
- **(B) x = text layout, y = line number.** The qualitative view. Here **the polyline is the timeline**: time is encoded by traversal order and colour, not by x. Zoomed out, lines are blocks and the path threads through them; zoomed in, you hide the path and show a heat/colour gutter beside real text.

I'd build both over one shared dataset, but be clear which answers which question: (A) answers "where does it spend its time", (B) answers "what does the flow look like". (B) is the evocative, less-common one; (A) is off-the-shelf.

**Capture: cost and the semantics you'll have to pin down**

- **Cost is negligible.** Keep a `Uint8Array`/`Int32Array` indexed by pc; "is this instruction at a label?" is one array read per dispatch, against a loop that already indexes `program[program.pc]` several times and calls a handler. When it *is* a label, push `(labelIndex, stepCount, timestamp)` onto an event list. Thousands of events is nothing.
- **Also capture per-line counts.** A `Uint32Array` indexed by `lino`, incremented per dispatch, is nearly free and gives a per-line heatmap *even where the user added no labels* — that's the direct answer to "detailed debugging can be done by adding temporary labels". Keep it as an opt-in "counts" mode so the overhead stays opt-in.
- **Define "visited a label."** Fall-through past a label counts (pc increments onto it). Consecutive labels share a pc. A loop jumping back into the *middle* of a labelled block counts. A trailing label has `pc == program.length`. All defensible — but pin them down, or reviewers will disagree with the picture.
- **Threads are the real complication.** AllSpeak is cooperatively multitasked: the main thread, each `on ...` handler, and each `fork` are separate threads sharing globals, interleaved at `wait`/blocking I/O/`stop`. Concretely: `fork` calls `program.run(pc)` re-entrantly, which pushes a bare pc onto the same `program.runQueue` (`Run.js` lines 51–55), and DOM events do the same — so these threads share one pc space but arrive from a queue with **no thread identity attached** (queued pcs are plain numbers). A "start label → end label" window therefore only delimits one thread's story, and to draw lanes you'd need to add small bookkeeping: stamp a thread id when queueing, inherit on fork, allocate fresh on handler entry. Modules are cleaner: `run module` creates a child program with its own pc array.
- **End condition is ambiguous.** "Reaches its designated end point" is unclear when the main thread `stop`s while handlers remain live. Decide between: end label hit, label hit twice, `stop`, an explicit stop-recording command, or a fixed instruction budget (note the existing watchdog already caps a runaway thread at 1,000,000 instructions).
- **Naming:** don't hijack `program.tracing`. It already means the step-tracer's paused state, is tested by the user-visible `tracing` condition, and is consulted in the run loop's queue handling. Use something like `program.recording` and a distinct element id.

**The axes**

- **x: step count vs wall clock.** Instruction count is deterministic and reproducible; wall-clock includes `wait`, browser timer flooring, and network parking, so it conflates compute with idle. Record both; default to step count, offer wall-clock as a mode.
- **Your "estimate each instruction's cost in ns" idea** is a cost model / virtual clock — the same trick as `qemu -icount` or discrete-event simulation time. It's genuinely useful *because* it's deterministic and excludes parking, but it's a model, not a measurement, and JS timings aren't stable across machines, browsers or JIT warm-up. I'd render it as a clearly-labelled third axis, never the default.
- **"Scale so the total fills the panel"** is fine for one run but blocks run-to-run and reviewer-to-reviewer comparison. Offer a pinned scale, and consider a log axis for heavy-tailed traces.
- **y: literal line number compresses exactly the regions that matter.** A three-line hot loop gets three lines of vertical space while a 200-line rarely-executed block gets 200. Consider a rank/semantic y-axis: a minimum vertical span per label and per doc-block section, with hot regions allowed to expand. Flame graphs do the analogous thing by merging sub-pixel frames.
- **Colour.** Blue→red is fine for red-green colour-blindness, but in view (A) it duplicates the x axis, so it only earns its keep in view (B) where x is text. Also: at low zoom the blocks are tiny, so the ramp must vary in *lightness* as well as hue or it disappears — and greyscale printing will flatten it. Use a colourblind-safe sequential ramp (viridis/cividis/plasma) rather than a diverging blue-red, and keep a separate categorical palette (Okabe–Ito style) for the second dimension you'll inevitably want — thread/case/module.

**Zoom, LOD and rendering**

- One canvas with a viewport transform (scale + translate) is the simplest route to zoom and pan. DOM/SVG (the `svg` plugin) is fine for hundreds of elements, not thousands of segments.
- LOD ladder: per-line heat bars → blocks plus label-transition edges → shrunk text → real text. At the top zoom stop drawing the path and demote it to a gutter marker/highlight.
- Don't bother with fractional font sizes — sub-~6px text is unreadable and browsers fight you. Scale a canvas, or scale a fixed-size render with a CSS transform.
- At the coarsest level: line length plus indentation gives a silhouette (the minimap idiom), `begin`/`end` nesting gives nested brackets, doc blocks give section headers, label positions give ticks.
- Large traces need run-length collapsing ("N ×" for a repeated loop body). That's how trace viewers stay readable — and it's precisely what "add temporary labels" fights against.

**Prior art worth adapting**

Two I'd put first:

1. **Emit a standard trace format instead of building a viewer first.** The Chrome Trace Event Format (`ph`/`ts`/`dur`/`pid`/`tid`/`name`) is read by Perfetto UI, chrome://tracing, Speedscope and Firefox Profiler. Model each label visit as a span and you get per-thread swimlanes, zoom, pan, search and a source view for free — and you learn what the bespoke panel actually needs by using it. Jaeger/Tempo/OpenTelemetry span waterfalls are the same shape, and your "list of visits with lines drawn between them" is essentially a span waterfall.
2. **Treat the label-visit list as an event log and use process mining / trace inference.** `(case, activity, timestamp)` is exactly what process mining consumes: pm4py's heuristic and inductive miners, and research tools like Synoptic and Perfume, turn it into a flow model — an inferred "how the parts fit together" diagram learned from runs rather than drawn by hand. That's a more direct answer to the reviewer's problem than a timeline.

Then the more familiar neighbours:

- **Flame charts / icicle plots** (Chrome DevTools Performance, Speedscope, Brendan Gregg's flame graphs). Same shape as view (A) except y is call depth — and since `gosub`/`return` gives you real nesting, a genuine flame graph is cheap and is the best-understood answer to "where did the time go".
- **Line-level execution heatmaps / coverage annotation** (Chrome DevTools Coverage panel, lcov/genhtml, gcov, coverage.py, Istanbul). This *is* your "coloured blocks for each line, whole script fits in the panel" — established and very cheap. I'd start here.
- **Per-line hotness bars** (VTune source view, `perf report`, `gprof -l`, KCachegrind).
- **Per-trace animation and scrubbing**: Python Tutor, Bret Victor's "Inventing on Principle", time-travel debuggers (Redux DevTools, `rr`, WinDbg TTD).
- **CFG / call graphs with edge frequencies**: Graphviz DOT, gcov edge counts, `go tool pprof`, `llvm -dot-cfg`; Sankey/alluvial and chord diagrams for label→label transitions.
- **Code-as-map metaphors** for the fully zoomed-out view: the VS Code/Sublime minimap, Wettel & Lanza's "Code City".

**The cheaper 80%**

Worth stating plainly: the compiled program already contains every internal branch target as a resolved numeric pc, plus the `gosub`/`return` structure. So a **static control-flow graph and call graph are derivable with no execution at all** — deterministic, diffable, reviewable. Combine that with the per-line count array from a run and you get a gcov-style annotated CFG, which is the classic answer to "how do the parts fit together" for a fraction of the effort of the timeline. Doc-block sections are the natural node granularity at the top zoom.

**Beyond the picture: traces as artefacts**

If a recording serialises to stable JSON (events + script hash + label table), it becomes something you can *hand* a reviewer rather than something they must reproduce. And since both runtimes are meant to agree, it's a candidate for `conformance/`: compare the **execution path**, not just the final output. That may turn out to be the more valuable half of the idea. Caveat: with `every`/`wait`/I/O the interleaving is scheduler-dependent, so only deliberately deterministic scripts will replay faithfully.

**Suggested order to prove it (no code yet)**

1. Compile-time pass producing the `pc → label(s)` map and a label index table. Nothing else changes.
2. Record-only mode in the run loop (step count, wall clock, thread id) dumped as JSON, with no UI. Run it over the Codex scripts — `codex/en/code/step*.as` are small and already exercise loops, handlers and forks — and judge whether the data is legible and what a typical trace looks like.
3. Emit that same recording as Chrome Trace Event JSON and open it in Perfetto. That tells you whether the bespoke timeline view is necessary at all, and what its real requirements are.
4. Only then build the LOD panel: most likely view (B) with a per-line heat gutter, plus the static CFG for the coarsest zoom.

**Risks**

- Runs aren't reproducible in practice (input, network, timers) — keep the deterministic step-count axis as the reference.
- Instrumentation perturbs timing — measure overhead with the recorder on and off, and keep counts-only as the production-safe mode.
- y = literal line number compresses hot regions; a rank axis fixes it.
- Multi-thread and multi-module means "a trace" should be defined per case/thread, or the picture is a misleading average.
- `tracing` and `#allspeak-tracer` are already user-facing; a new facility needs its own names.
- The viewer must not itself be an AllSpeak script — it's the thing debugging AllSpeak. A plugin following `spec/allspeak-plugin-contract.md` is the idiomatic home.

## 21:58

1. My description of the horizontal axis was clumsy. The timeline would be an overlay over a scaled view of the actual script.
2. The doc block mechansm can possibly be leverged to provide an intelligent narrative of what is happening.
3. I know nothing of Perfetto/Speedscope, but would like to know what they contribute to the job.
4. I should add that the Python version of AllSpeak is the one that would initially most benefit from this kind of tool.
5. Can you explain what a static CFG/call graph looks like and does.

**Assistant**

Understood on point 1 — that reshapes the design in a way worth spelling out, because it removes the axis that was doing the most work. Taking your five points in turn.

**1. A timeline overlaid on a scaled view of the script**

That's coherent, and it's the more interesting of the two designs — but one consequence has to be handled deliberately. **If the geometry is fixed by the script, time no longer has a spatial channel.** A line from a label near the top of the file to one near the bottom is long because the file is long, not because it took long; a three-line hot loop occupies almost no panel area. So "where does it spend most of its time" can't be read off the drawing the way it can off a time axis.

The fix is to spend your remaining visual channels deliberately:

- **Colour ramp = order** (your plan). Keep it — it's the only zero-cost ordering channel you have.
- **Stroke width or weight = time between consecutive label hits.** This is the channel that actually answers the hot-spot question, and it composes cleanly with colour (hue = order, weight = duration).
- **A dwell marker at each label point** (dot radius, or a small bar) for time spent inside that block — separates "visited often" from "stayed long", which are different findings.
- **Back-edges drawn distinctly** (bulged, dashed, offset, or routed through a side gutter). This is not cosmetic: a loop's back edge otherwise lies exactly on top of its forward edge and reads as a single line, hiding the iteration count. Annotating it "×40" is very readable and is the honest replacement for "add temporary labels to get detail".
- **Long edges need routing.** Straight diagonals across the whole panel will dominate visually even when they took microseconds. Arc/ribbon routing through a margin channel (the arc-diagram idiom) or bundling repeated identical edges into one stroke is needed before the picture becomes legible rather than merely pretty.
- **A time cursor.** A scrub slider that paints the path up to time T is cheap once you have the event list, and it makes ordering unambiguous in a way overlapping static colour ramps never are. This is the natural answer to "the polyline *is* the timeline" — you may already have the mechanism: your editor has Blocks mode, and the pattern of "one control that advances through the document" is established.

Two further consequences worth noting. First, this is **an editor overlay, not a separate app** — so it belongs as a mode of `asedit.as`, and at full zoom you should hand off to the real editor (the CodeMirror plugin) rather than reimplement text rendering on a canvas. Two renderers is the maintenance smell to avoid; define the handoff threshold explicitly. Second, anchoring to code positions lets you mix granularities on one surface in a way a time axis never can: label-to-label edges when zoomed out, per-line density when zoomed in. That's a genuine advantage of your design over the standard one.

**2. Doc blocks as the narrative**

Yes — and the substrate already exists, which is the pleasant part. `tools/asdoc-check.py` already parses each section into a `Section` object holding `start_line`, `end_line`, `doc` (the prose lines), `meta` (including the `@hash` and `@verified` values), `code` and `code_line_numbers`, and it already emits all of that as JSON via `--json`. So you don't need to invent a section parser; you need to join it to the trace.

Because every command carries `lino` and every section has a line range, every execution event can be attributed to a section. That yields, with no new authoring effort:

- **A profile by documented section** — "43% of the run inside *Updating the display*", attributed to a heading the author wrote rather than a label name they invented.
- **The narrative skeleton itself**, using the author's own prose as captions: *entered "Why we defer the redraw"* → *then "Handling the empty case"* → *then back to "Why we defer the redraw"*. The prose already explains why; the trace supplies what actually happened. That combination is the "intelligent narrative" you're describing, and it's derived rather than generated.
- **Intent versus actuality**, which I think is the strongest framing available here: the doc blocks are the author's *claim* about the overall picture; the trace is *evidence*. A section whose prose says "handles the retry case" but which is never entered is a finding. So is a section entered from a place its prose doesn't mention. That difference is where a reviewer's mental model is wrong, and no amount of text rendering surfaces it.
- **Documentation coverage**, as a natural extension of the analyser you already have: sections never reached during a run ("documented but not executed") and executed code that sits outside any section ("executed but undocumented"). `asdoc-check.py` already has a status model, per-section reports and exit codes; adding a reachability column fits its shape rather than fighting it.
- **Staleness, handled properly.** `@hash` is a content identity for a section. Record the section hashes alongside the trace, and after an edit you can state precisely which parts of a recorded narrative are no longer trustworthy — reusing existing metadata instead of adding new bookkeeping.

Cautions: sections can't nest (a `!!!` closes the block), so a section may span several labels — decide whether the prose captions attach to the section or to each label inside it. The convention is per-file opt-out, so files that haven't adopted it must degrade gracefully to labels (which is also a reason to adopt it). Prose lines are deliberately one-paragraph-per-line and very long, so the narrative view must truncate; the good news is that `classify()` already routes leading-`@` lines to metadata, so `@hash`/`@verified` won't leak into the prose. And I'd keep author prose and any synthesised text visually separate: a generated narrative over a trace reads plausibly and is unverifiable, whereas a measured fact ("entered 4 812 times, 61% of total dwell") isn't.

One lead worth noting: the Python compiler already accepts an `info` directive and `allspeak info <script>` dumps it (prose, Python-only — not in `js/allspeak/Compile.js`). It's free text rather than structured, so it's not the narrative substrate, but it's an existing channel for a script to describe itself if you ever want a per-script narrative preamble.

**3. What Perfetto and Speedscope actually contribute**

They're **trace viewers**: you write an exporter, they do all the rendering. Concretely:

**Perfetto UI** (`ui.perfetto.dev`) — a browser app that runs locally and opens Chrome Trace Event Format JSON (as well as its own protobuf). It contributes four things that are expensive to build yourself:

- **One track per thread/process**, with nested spans drawn as boxes, zoom and pan. Your cooperative interleaving becomes legible lanes rather than a tangle — this is the single hardest part of the drawing problem, handed to you.
- **Scale.** It's built for gigabyte captures, so you can record *everything* and filter afterwards instead of deciding at record time what to discard. That's a design-level gift: it removes the "labels only, or per-line counts too?" trade-off.
- **Flows** — explicit arrows drawn between related events, normally used for cross-thread handoffs. That maps onto "label A leads to label B".
- **SQL over the trace** (Trace Processor). "Time per label", "count per section", "the ten longest dwells" become queries rather than UI features. It also derives a flame graph from the spans automatically.
- Everything is local; no data leaves the machine.

**Speedscope** (`speedscope.app`) is a smaller, local viewer specialised in flame graphs: flame, icicle, left-heavy and **time-order** views. The time-order view is almost literally your "list of visits, in time order, with lines drawn between them", and because `gosub`/`return` gives real nesting, the flame views answer "where did the time go" straight away.

**Firefox Profiler** (`profiler.firefox.com`) imports the same format and is worth a look specifically for its **per-line source view with per-line hotness bars** — that is the closest existing implementation of your "coloured blocks for each line, whole script in the panel", and it already solves the LOD problem that view creates.

What none of them give you: the code-space overlay, the doc-block narrative, AllSpeak label semantics, editor integration, or anything that treats the script as a document. They are the *measurement* half. Your panel is the *comprehension* half, and I don't think the measurement half is worth hand-building.

Practical mapping: use `ph: 'X'` complete events with `ts`/`dur` for "time between label hit N and N+1", `ph: 'i'` instant events for a bare label hit, `pid` for the script/module, `tid` for the thread/case, `name` for the label, and put the section heading in `args`. It's JSON — an afternoon's exporter, not a project. Keep it permanently: it's how you inspect a trace too large for your own panel, and how you debug the recorder itself.

**4. Python first — what I found in the runtime**

Agreed, and the Python runtime is a better host than I assumed. Grounding:

- **One choke point, same shape as JS.** `as_program.py` `flush(pc)` runs `while self.running:` → `handler = domain.runHandler(keyword)` → `self.pc = handler(command)`. Instrument that loop and you've caught everything.
- **Label detection is easier than in JS.** `as_compiler.py` `compileOne` routes a `name:` token to `compileLabel` → `compileSymbol(..., ':')`, so a label is an actual command at its own pc with `domain: None`; `flush` treats a null domain as a no-op that advances pc. So "we are at a label" is exact. In JS, labels emit nothing and you need a derived `pc → label` map (with consecutive labels sharing a pc). Same concept, two small per-runtime shims rather than one shared hack — worth knowing before you design a shared trace format.
- **`command['lino']` plus `self.script.lines`** gives you the same text access as JS.
- **Off-the-shelf profilers work with zero code changes.** Handlers are methods named `r_<keyword>` (see `as_handler.py`), so `cProfile` / `sys.setprofile` / `viztracer` / `py-spy` will show `r_put`, `r_while`, `r_gosub` frames — a per-AllSpeak-command profile, a flame graph, or Perfetto-compatible JSON, today. That's a free first answer to "which commands dominate", before you write anything.
- **Nanosecond clocks and no timer flooring.** `time.perf_counter_ns()` makes your "nanoseconds" idea a measurement rather than an estimate, and removes the browser-timing caveats I raised earlier. Also no JIT warm-up, no DOM, no racing event loop — so traces of deterministic scripts actually reproduce, which is what makes a trace usable as a review artefact.
- **There is currently no tracer at all on the Python side.** I grepped the whole package: no `trace` command, no tracer panel, no `tracing` condition. So you're not extending an existing facility (and you sidestep the `tracing` flag collision that JS would force on you), but you also have no `<div id="allspeak-tracer">`-style home. What does exist: `debug step` (`debugStep`, printing `script: Line n: domain:keyword`), a Qt `debugger` attach with `checkIfHalt`, `dummy`/`breakpoint`, and `testMode` — so the "attach a component to the program" pattern is already established.
- **Threads are cheap to model.** Execution is one global `queue` deque of items carrying `.program` and `.pc`, drained by a single flusher, with `flush_depth` handling re-entrancy; `wait` resumes through `threading.Timer` (or `QTimer` under the debugger). A thread/case id is essentially "which queue item this continuation came from", stamped where items are enqueued via `program.run(pc)` — a handful of call sites. The timer threads still mean wall-clock includes parked time, so keep step count as the reference axis.
- **Qt gives you the rendering for free.** PySide6 is already a dependency (`as_debug.py`, `as_graphics.py`), and `QGraphicsView`/`QGraphicsScene` are built for exactly this: a zoomable, pannable scene of custom items with hit-testing and transform-based LOD. "Zoom from blocks to real text and drag to pan" becomes scene configuration rather than canvas arithmetic. The existing debugger window is the natural host, and it already captures `sys.stdout` and integrates with the Qt event loop.
- **The cheapest delivery route is the CLI.** `pyproject.toml` exposes one entry point, `allspeak = "allspeak:Main"`, and `Main` in `as_program.py` already dispatches subcommands (`info`, `--test`). An `allspeak trace script.as` that emits a trace JSON, an annotated CFG and a markdown narrative fits that shape, needs no GUI, and is usable in code review and CI — including for scripts that can't be run interactively. I'd build that first and let the Qt panel follow.
- Finally, both "adapt rather than invent" ideas from my earlier note are one `pip install` away in the same language: `graphviz` for the graph, `pm4py` for process mining over the event log.

**5. What a static CFG / call graph is and does**

**Nodes and edges.** A *basic block* is a maximal run of commands with one entry and one exit. For AllSpeak, the natural node is a labelled block (and, finer, the straight-line runs inside it). The *control-flow graph* (CFG) is a directed graph of those nodes where each edge is a way control can move between them. All of the edges are derivable from the compiled array without running anything:

- **Fall-through**: pc → pc+1.
- **Conditional**: `if` goes to the then-branch or to its `else` target; `while` goes to its body or to the fail target (the internal `goto` at pc+1).
- **Unconditional jump**: the compiler's internal `goto` with a resolved numeric target, plus a user `go to Label` (label → `symbols[label].pc`).
- **Loop back edge**: the trailing `goto` of a `while` points back at the test, so a loop appears as an edge that goes *upwards*.
- **Call/return**: `gosub Label`, plus `fork` (which also starts a thread at a label) and `return`.
- **Error edges**: `try … handle` (`try.handlerPC`, `endTry`) and `… or` / `on failure` (`command.onError`) to the handler block and back.
- **Terminals**: `stop`, `exit`, `endTry`, end of program.
- **Roots** are not just pc 0: every `on …` handler target and every `fork` target is an entry point, so "unreachable" means "reachable from no root".

**What it looks like.** Boxes carrying label names, arrows for transfers, laid out top to bottom. A `while` reads as the canonical loop: test box with two out-edges, body below, an arrow from the end of the body back up to the test. A `gosub` is a dashed arrow to a separate box with a return arrow. `stop` boxes have no out-edges. An `if` is a fork that rejoins. Unused subroutines float with no inbound arrow. This is the picture compilers print with `llvm -dot-cfg`, and Graphviz `dot` does the layered layout for you. A few hundred labels stays readable; and you can draw doc-block sections as clusters that group their labels, which makes the graph read like the document it came from.

The **call graph** is the coarser cousin and possibly the better review artefact: nodes are the labels that are *called* (`gosub`, `fork`, `run module`), edges are caller → callee, optionally weighted by call count. It answers "what uses what" in a handful of boxes. A module-level call graph is coarser still. Think of the call graph as the architecture view and the CFG as the plumbing view.

**What it buys you statically**, with no run at all:

- **Unreachable code** — blocks with no path from any root. The compiler today warns only about unused *symbols*; it never says "this block can never run". That's a real review finding and precisely what a mental picture misses.
- **Structural smells**: blocks only ever entered by jumping into their middle (so the label is decorative); loops with more than one entry point; `gosub` targets that never `return`; labels that are merely fallen through, so the name lies about being an entry point.
- **Unused subroutines** — labels with no inbound call edge.
- **The shape of the script**: how many independent top-level flows exist, where the fan-out is, how deep the `gosub` nesting goes.
- **Policy checks in CI**: "no `gosub` cycles" (a cycle without a return guard is a latent runaway), "every event handler terminates", "no block unreachable".

**What one run adds** is the classic *annotated CFG* that `gcov` produces: edge weight or colour by traversal count, so never-taken `else` branches, obvious hot loops (thick back edges) and the hot edges *between* far-apart blocks — the very thing your code-space overlay makes hard to read. That's why I'd treat the two as complements: the CFG is the map, the trace is the journey, and the map is the one that works without running anything.

**Where it's honestly imprecise**, so the tool can degrade gracefully instead of lying:

- `return` has no static target. Either treat it conservatively (return to any pc following a `gosub`), or build a call graph plus per-label intra-procedural CFGs — the standard compromise.
- **Computed jumps** — `go to label <expr>`, `gosub to label <expr>`, computed `fork` — can go anywhere. Draw them as edges to a "dynamic" node rather than pretending to resolve them.
- Late-registered `on …` handlers and `run module` widen the reachable set, so some "unreachable" verdicts must be softened when those are present. A tool for reviewers can be *useful* rather than sound, as long as it says which parts are approximations.

**Why I'd build this first for a reviewer**: it needs no run, so it works on scripts that can't be run — which matters for the Python runtime, where device, network, MQTT or credential dependencies are likely. It's deterministic. It's diffable, so you can say "this edge is new in this change" — a structural diff, which is a better review signal than a trace of a run the reviewer can't reproduce. And with doc-block sections as cluster boxes it *is* the "mental picture of how the parts fit together" you started from, with the trace then answering the follow-up question of which paths through that map were actually walked.

## 22:34

I should probably also revise my initial statement that this is a debugger. I'm now thinking it's more accurate to describe it as a visualliser, that answers the question "What does my program do?". It's for healthy as well as broken code and it tries to keep the human in the loop. Running it may well point to a need for either debugging or optimisation (for example if it looks like it's spending far too much of its time on unnecesary activities). Those are the kind of things I hope to reveal with such a tool..

So, with all that, how do I go about creating an add-on or independent tool for AllSpeak to do this?

**Assistant**

Good — that reframing has real design consequences, and it also changes the build order. Here's a concrete plan, with the integration points verified against the actual code.

**What changes when it's a visualiser rather than a debugger**

- **The static model becomes the primary artefact; the trace becomes optional enrichment.** A visualiser has to be useful on a script it *cannot* run — and for the Python runtime that's the common case (device, network, MQTT, credentials). So design three tiers where each is a complete answer to *some* questions, not a degraded version of the next: model only → model + doc-block map → model + trace.
- **Healthy code means the default output is a description, not a warning list.** Make findings opt-in annotations. The first thing a reader sees should be "here is what this script is made of, and here is the path the last run took".
- **"Human in the loop" + "may point to a need for debugging or optimisation" implies the output should be a suggested next experiment, not a verdict.** You already have the right precedent: the documented AllSpeak workflow is "add temporary labels, add prints". So when the visualiser sees a hot region, it should hand you the label to insert and the `if tracing log ...` line to go with it. That makes the visualiser the front end to both the debugger and the optimiser, which is exactly the relationship you described. Emit edits, not conclusions.
- **"Unnecessary activities" needs expected-versus-actual.** You have two sources already: `spec/opcodes.json` gives every command a `category` (`arithmetic`, `collection`, `dom`, `navigation`, …), so "38% of executed commands were DOM writes" is computable; and the doc-block prose supplies the intent to compare against. Both artefacts exist today.

**Which kind of "add-on" — three different mechanisms, only one is right**

1. **AllSpeak plugin/domain** (`spec/allspeak-plugin-contract.md`): JS registers `AllSpeak.domain.<name>`; Python loads via `import plugin X from y.py` and `Program.useClass()`. This adds *keywords the script calls* — the wrong mechanism for a visualiser, which inspects programs rather than being invoked by them. Keep it in reserve for one thing only: a small script-facing command to declare a trace window if you later want the script to say "watch from here to here".
2. **A host-level tap inside the runtime**: how you observe execution. Python can do this with *no runtime change at all*; JS needs one small branch.
3. **An independent tool**: its own process, consuming the runtime as a library.

So it isn't either/or. The product is (3), sourcing its data through (2), with an optional (1) later. Worth stating explicitly in any design note, because "add-on" has a specific meaning in this repo.

**Where it should live**

**Start in this repo under `tools/`.** `tools/` is the established home for repo-owned developer tools (`asdoc-check.py`, `learn-link-check.py`, `generate-translated-docs.py`, `cm-smoke.js`, `scale-check.js`); the tool needs `allspeak-py`'s compiler and language packs, which are here; and it's far more useful when iterated against the scripts here (`codex/*/code/step*.as`, `learn/`, `conformance/`). The canonical-source rule also makes this the right place for anything touching shared files.

There's precedent for promotion rather than starting separate: `asdoc-check.py` began as a repo tool and is now mirrored by the doclets project. Split out to a package (`allspeak-viz` depending on `allspeak-ai`) when the data model stabilises or an outside user needs it — a mirror is a cost you don't want before stability. A single `tools/asviz.py` is friendlier than a package while it's small; grow it into `tools/asviz/` if the renderers multiply. Add a `BUILD.md` lookup-table row only once it's part of routine workflow.

**The integration points, verified**

**Python — you get a lot for free:**

- **Compile without running.** `Program.__init__(arg, testMode=False)` reads the file and builds `self.script` (a `Script` with `.lines`), `self.compiler`, `self.code` (the flat IR list) and `self.symbols` (name → pc). Compilation is `program.tokenise(program.script)` then `program.compiler.compileFromStart()`. `Program.start()` runs unconditionally *afterwards*, so in static mode call those two directly and never call `start()`. Construct with `testMode=True` to suppress the version/compile banner on stdout.
- **Labels are exact.** `as_compiler.py` `compileOne` sends a `name:` token to `compileLabel` → `compileSymbol(..., ':')`, so a label is a real command with `domain: None` at its own pc, and the dispatcher treats a null domain as a no-op advance. `pc → label` is a direct read, not a derivation. Note Python stores labels *with* the trailing colon in `symbols` (`'Foo:'`) where JS stores them without — normalise that in your trace format.
- **Recording needs no runtime change.** `Program.flush(pc)` is the single dispatch point, and it *already* consults a per-program hook object: `if self.debugger != None: if self.debugger.checkIfHalt(is_first): break`. That's a designed seam. Either subclass `Program` and override `flush()` (record, then delegate) or attach a recorder object exposing `checkIfHalt()`. Do **not** set `self.debugging = True` — that forces the Qt graphics route and a `QApplication`.
- **Cases/threads come from the queue.** The module-level `flush()` drains a global `queue` deque of `ECValue(program, pc)` items; `Program.run(pc)` and `Program.queueIntent(pc)` enqueue, `wait` resumes via `threading.Timer`, `fork` calls `self.run(label)`, and `flush_depth` handles re-entrancy. A case id is "which enqueued continuation this is", stamped where items are enqueued.
- **There's a CLI seam.** `Main()` in `as_program.py` already dispatches subcommands (`info`, `--test`), and `pyproject.toml` exposes one entry point. `allspeak model|cfg|trace script.as` fits with no new packaging.
- **Classification goes through `spec/opcodes.json`.** Python does *not* stamp an `opcode` on commands (JS does, via `AllSpeak_Opcodes.resolve`), but both runtimes agree on `domain` + `keyword`, so `(domain, keyword) → opcode → category` is your portable classifier.

**JS — later, and it does need a change:**

- No subclassing, and the per-instruction loop is internal to `AllSpeak_Run.run`, so wrapping it from a plugin only yields entry/exit granularity. The honest option is one branch inside the `while (program.running)` loop in `js/allspeak/Run.js`, beside the existing `if (program.debugStep)`. This repo owns that file, so it's permitted — but it *is* a runtime change, which is why it's a later step.
- JS labels emit nothing: derive `pc → label` from `program.symbols` (entries whose pc points at a command that isn't a symbol record), accepting that consecutive labels share a pc.
- The panel convention is that the host page supplies the element (`<div id="allspeak-tracer">` is created by the script), so a JS panel must require or create one.

**Define two data artefacts before any renderer**

This is the step that decides whether the project is two weeks or two months.

1. **Program model** (static, no run): script name + content hash; `lines`; per-command `{pc, lino, domain, keyword, opcode, category}`; `labels {name: pc}`; `sections` (line ranges, prose, hash/verified state); CFG `edges`. Deterministic, diffable, committable.
2. **Trace model** (dynamic, optional): header (script hash, AllSpeak version, language pack, section hashes); time-ordered events `{case, pc, lino, label, steps, t_ns}`; plus per-line counts.

Two rules to fix now: everything references **pc and lino**, never text offsets; and the trace *annotates* the model rather than replacing it. Get those right and every renderer — DOT, HTML report, Qt panel, Chrome-trace export — is a thin view over the same two objects, which is also how the JS side later reuses your viewer.

**Build order, each step independently useful**

1. **`allspeak model script.as` → model JSON.** Uses `Program` + `tokenise` + `compileFromStart`. Accept when it runs clean over every `codex/*/code/step*.as` and `learn/` script with all labels resolving. No runtime change, no GUI.
2. **`allspeak cfg script.as` → DOT/SVG.** Edge derivation, using the field names I confirmed: fall-through pc+1; `if` true → pc+2, false → the following `gotoPC`'s `goto`; `while` true → pc+2, false → the fail `gotoPC` target, plus the trailing `gotoPC` back to the test; internal `gotoPC` numeric targets; user `goto` by label; `gosub` by label (`gosubExpr` → dynamic); `return` → dynamic (`stack.pop()`); `try` `handlerPC`/`endTry`; `onError` handlers; terminals `stop`/`exit`. Mark dynamic edges as approximations rather than pretending to resolve them. Accept when unreachable-block detection fires on a deliberately unreachable block and *not* on a `fork`-only target.
3. **Section join.** Consume `tools/asdoc-check.py --json`, attribute code lines to sections, emit the section map and a coverage table. Accept when you'd be willing to show that table to someone.
4. **`allspeak trace script.as` → trace JSON.** Subclass `Program` or attach a recorder object; record label visits, per-line counts, step counts and `time.perf_counter_ns()` deltas with a case id. Accept when a loop's counts match hand-counted iterations, overhead is measured with the recorder on and off, and a deterministic script reproduces byte-identically.
5. **Report before panel.** An HTML/text report (section coverage, hot lines, transitions, unreachable blocks, stale doc hashes) is cheaper than the Qt panel and works in review and CI. Only then `QGraphicsView` in the existing debugger window — Qt is already a dependency and already handles zoom, pan and LOD.
6. **Chrome Trace Event JSON export**, used to validate the trace model in Perfetto/Speedscope rather than to ship a viewer.

Keep a small fixture set — deliberately unreachable block, never-taken branch, `gosub` cycle, a doc block with a stale hash, a script with no doc blocks — and regression-test the analysis against it, the same discipline `conformance/` applies to the engine.

**The small additive changes this needs in canonically-owned files**

- `tools/asdoc-check.py` — its `--json` section report carries `start_line`, `end_line`, `doc_lines`, `code_lines`, `current_hash`, `stored_hash`, `verified_hash`, `hash_state` and `verify_state`, i.e. line ranges, hash state and prose *counts*, but **not the prose text**. The narrative needs the prose. Either add a `doc` list to `section_status()` or re-parse the file in the tool. I'd add it here: it's a new key in a dict consumers read by name, so it's additive for the doclets project too, and this repo owns the analyser.
- `spec/opcodes.json` — already sufficient for category classification; no change.
- `js/allspeak/Run.js` — one hook branch, only if you build the JS recorder. Defer.
- `BUILD.md` — one table row, once the tool is routine.
- Nothing in the Python runtime — which is the point of starting static.

**The one fork worth deciding before you write anything**

**Import the runtime to compile, or re-implement a parser?** Import it. Fidelity is the reason: the CFG must describe what the runtime *actually* executes, and a second parser is a second source of truth — precisely what the canonical-source rule exists to prevent. You also get the language packs, the tokeniser and the diagnostics for free.

The cost is real and worth naming up front: **`program.code`'s command-dict shape is an undocumented internal IR.** `spec/opcodes.json` is a published contract, and `spec/allspeak-language-contract.md` specifies *behaviour* (assignment, arithmetic, `if`, `while`, `log`, error categories) but says nothing about the compiled representation. And the two IRs already diverge in ways that matter to a tool: Python's `if` puts its branch target in a following `gotoPC` while JS's `if` carries `else` on itself; Python's internal jump keyword is `gotoPC` where JS uses `goto`; Python keeps the trailing colon on label names and JS does not; JS stamps `opcode` and Python does not. So budget for **a thin adapter module that is the only place knowing the IR**, with one implementation per runtime — and consider proposing the command shape into `spec/allspeak-language-contract.md`, since a stable IR is the single thing that would most reduce the cost of *any* third-party tool, and that document is small today.

**Milestones**

- **M0 — prove the data is interesting (a day or two).** Steps 1–2 on the `codex` and `learn` scripts. The question is "does the CFG of a real script tell me something I didn't already know?" If yes, everything after is engineering. If no, the visualiser idea needs rethinking *before* you build renderers — which is why this is the first milestone and not the demo.
- **M1 — the static report.** Steps 3 and an HTML report. Committable, diffable, works on scripts you can't run, and it's the thing you can hand a reviewer.
- **M2 — the trace.** Step 4 plus the Chrome-trace export, read in Perfetto. Now you know whether your own panel is needed at all.
- **M3 — the Qt panel.** Step 5, hosted in the existing debugger, `QGraphicsView`, block-to-text LOD.

One framing sentence worth using in the docs, because it keeps the visualiser distinct from the debugger: *the static model is a map of the script; the trace is a record of one journey across it; the doc blocks are the script's own account of why the map looks that way; the tool's job is to show the three together and suggest the next thing to measure.*

## 22:51

What are IR and CFG? (I should probably know, but nothing comes to mind)
I've not looked at asdoc-check.py and its report; what's its role?

**Assistant**

Both are worth pinning down precisely — here's each, grounded in this repo.

**IR — intermediate representation**

**The general idea.** When a program is compiled, it passes through intermediate forms between the source text and the thing that actually executes. A conventional compiler goes source → IR → optimised IR → machine code. An *interpreter* stops at the IR and walks it directly. AllSpeak's runtime is the interpreting kind, so the IR is the end product of compilation, not a way-station.

Familiar examples elsewhere: Python's bytecode (as shown by `dis`) and its AST; JVM class files; LLVM IR. "Opcode" is the older word for the code for one instruction — which is why the spec file is called `spec/opcodes.json`.

**What AllSpeak's IR concretely is.** The list returned by `AllSpeak_Compiler.compile` in JS, and `program.code` / `self.code` in Python. A flat, linear list where each element is one command, and:

- its **index is its own address**, called `pc` (program counter) — this is the key property, because every jump in the program is just an integer;
- it carries `lino`, the source line it came from, which is how runtime errors and the existing tracer can point back at the text;
- it carries `domain` and `keyword` (or a canonical `opcode` name in JS), which is what dispatch switches on;
- and it carries payload fields — some of them *trees*. A `while` holds a nested `condition` structure; a `put` holds a nested value expression. So it's a hybrid: a linear instruction list whose operands can be expression trees.

Two details that matter for anything built on top:

- **Labels are represented differently in the two runtimes.** In Python a label is a real element with `domain: None` at its own pc. In JS a label isn't an element at all — it's only an entry in `program.symbols` pointing at a pc.
- **The field names are not a published contract.** `spec/opcodes.json` is (`domain`, `category`, `description`, `params` per opcode), and `spec/allspeak-language-contract.md` specifies behaviour, but nothing specifies the command dict's shape. That's the caveat I flagged as the one real cost of the project.

**Why you'd use the IR rather than parsing the source yourself.** The source makes you re-derive everything the compiler already decided: where a `while` body ends, what a `goto` targets, which identifiers are labels versus variables, how a condition nests. The IR has all of it resolved into indices. It's also the same data the runtime executes, so a tool built on it cannot disagree with the engine.

**CFG — control-flow graph**

**Basic block:** a maximal run of instructions with exactly one entry and one exit — you always enter at its first instruction and leave at its last, and nothing can jump into the middle of it. Everything a graph can say about "what can follow what" is said in terms of those blocks.

**The graph:** nodes are basic blocks; edges are the transitions that can actually happen between them. One entry node; some terminal nodes; and loops appear as edges that point *backwards* to an earlier node.

That's the whole idea, and it's the standard data structure underneath every compiler's analysis passes and most coverage tools. It's how you reason about possible execution without executing anything.

**Concretely, in AllSpeak.** Take:

[code omitted]

Four blocks and five edges:

- **B0** = `put 0 into N` — falls through to B1.
- **B1** = the `while` test — the branch node, with two outgoing edges.
- **B2** = the body (`log N`, `add 1 to N`).
- **B3** = the `stop` — a terminal, no outgoing edges.

Edges: B0 → B1 (fall-through), B1 → B2 (test true), B1 → B3 (test false), **B2 → B1** (the back edge — this is the loop, and this is the edge that becomes visibly thick when you annotate counts onto it), and B3 has none. That maps exactly onto the compiled shape: the `while` command at one pc, a `gotoPC` immediately after it holding the fail target, the body, then a trailing `gotoPC` back to the test pc.

**How to read one:** entry at the top, arrows downward are fall-through and forward branches, arrows going back up are loops, a node with no outgoing arrows is a terminal, and a node with no incoming arrows is either unreachable or an entry point in its own right — which in AllSpeak means a `fork` target or an `on ...` handler, since those are entered by the runtime rather than by falling through.

**Why it matters here.** The CFG is *all possible* journeys through the script; a trace is *the one* journey a particular run took. Put counts on the edges and you have the annotated CFG that `gcov` produces — never-taken branches, hot loops, and hot transitions between far-apart blocks. That's the "map versus journey" distinction I keep coming back to, and the map is the half that needs no run.

A related but separate term I used: a **call graph** has routines as its nodes and calls as its edges — a coarser, architecture-level view, where a CFG is the plumbing-level view.

**What `asdoc-check.py` is and does**

It's the **maintainer and linter for the doc-block convention** — the `!! prose … !! @hash … !!!` sections that wrap code in this repo. It has two jobs:

1. **Verify.** It parses every doc block, computes a hash of the *code* inside the block, and compares that against the `!! @hash` line stored in the block. That's how "this prose describes this exact code" is enforced: edit the code and the hash goes stale, so the tool can tell you the prose may no longer be true. `@verified` is a separate, human sign-off hash, and it can go stale independently.
2. **Maintain.** With `--write` it inserts or updates the `@hash` lines to match the current code. It deliberately never touches `@verified` — that's a person's sign-off, not the tool's business.

Being a linter, it also reports structural faults in the sections themselves: an orphan `!!!` with no open section, a section left unclosed at EOF, a duplicate `@key` in one block, and prose appearing after code inside a block. It walks directories recursively (`--ext .as` by default), is read-only unless you pass `--write`, and exits non-zero on errors — and on warnings too under `--strict` — so it drops straight into CI. `--self-test` runs built-in fixtures.

**Its report, in two forms.** Default output is one line per issue as `path:line: severity [code] message`, then a summary:

[code omitted]

With `--json` you get a structured document: a top-level `files` array, each entry `{path, changed, sections, issues}`, plus a `summary` of `{files, sections, errors, warnings}`. Each `issues` entry is `{line, severity, code, message}` — for example the `hash-stale` warning carries the stored and current hashes in its message. Each `sections` entry is the `section_status` dict:

- `start_line`, `end_line` — the block's extent in the file;
- `has_code`, `doc_lines`, `code_lines`;
- `current_hash`, `stored_hash`, `verified_hash`;
- `hash_state` — one of `fresh`, `stale`, `no-baseline`, `no-code`;
- `verify_state` — one of `unverified`, `verified-fresh`, `verified-stale`, `verified-no-code`.

Two things about it are directly relevant to your visualiser. First, **the JSON is almost the section model you want** — line ranges, hash state, verification state — and the gap is exactly one field: it reports how *many* prose lines a section has, but not the prose text. That's the additive key I suggested, and it's a safe addition since consumers read the dict by key.

Second, **it's the only component in the repo that parses the script's structure independently of the runtime.** The compiler tells you where the jumps go; `asdoc-check.py` tells you where the author's *intent* was written down and how far that intent can be trusted. Joining those two is the narrative.

Worth knowing about its family, since AGENTS.md records this repo as their canonical source: the same convention is implemented several times over — this Python CLI, `tools/asdoc-check-cli.as` (runs under the AllSpeak Python runtime), `tools/asdoc-check.as` and `tools/asdoc-check.html` (browser), and inline parsing inside `asedit.as` for Blocks mode. The doclets project mirrors these. Design notes and history live in `prompt-260509.md`. And one behaviour to design around: a file with no doc blocks at all is treated as opted out — no errors, no warnings — so its section model is deliberately *sparse*, and your tool has to fall back to labels for such files.

## 23:12

Ah, yes, I understand IR. I originally viewed it as the machine code of a hypothetical processing engine. As you say, it's undocumented, but it sounds like that's where much of the action will happen.
So if I'm following, the place to start is with a static analysis of the IR. I'd really like the product to be written as an AllSpeak framework, with a plugin if needed to do complex, time-consuming stuff behind a suitable vocubuary. Rather like the server in the Doclets project. I doubt I'd be able to keep up with an all-Python solution. The UI would certainly benefit from having most of its structure expressed in AllSpeak.

**Assistant**

This is the pivotal decision, and the good news is that the pattern you're describing already exists in this repo in two places — so you're not inventing an architecture, you're following one.

**The pattern you're citing is here**

`server.as` is exactly it: an AllSpeak framework that does `use server` and then drives a plugin which hides the machinery behind a small vocabulary — `/list/<path>`, `/read/<file>`, `/write/<file>`, `/restart`. The script orchestrates; the plugin does the privileged work. And `asedit.as` + `asedit.json` shows the UI half of the same pattern: **structure in Webson JSON** (`asedit.json` is an element tree with `#element`/`@id`/styles), **strings in per-language tables** (asedit detects the host page's language into `Lang` and then assigns `StrOpen`, `StrFind`… per language; `codex/*/strings.json` is the same idea as data), and **behaviour in AllSpeak**.

So the visualiser as an AllSpeak framework looks like: `viz.html` (host) + `asviz.as` (framework, narrative, drawing) + `asviz.json` (Webson structure) + one plugin per runtime. That's a template you can copy rather than a design you have to justify.

**Where the seam should go**

Put the *raw material* behind the plugin and everything above it in AllSpeak. The only genuinely privileged operation is "get me the compiled program for this source"; everything else — deriving the CFG, joining sections, aggregating counts, writing the narrative, laying out the picture, drawing it — is data manipulation over an array and a JSON object. That maximises the AllSpeak content and keeps the plugin small enough that you can maintain it, which is your real constraint.

I checked, and the browser side makes this work better than I expected:

- **Compile-without-run is already a public call.** `AllSpeak.tokeniseFile(lines)` gives you a tokenised source; `AllSpeak.compileScript(source, imports, module, parent)` returns the compiled program **and does not run it**. The one to avoid is `AllSpeak.tokeniseAndCompile`, which ends with `program.running = true; AllSpeak_Run.run(program, 0)`. So the plugin's core job is two calls plus a walk of the returned program.
- **Diagnostics come free.** `AllSpeak_Compiler.getWarnings()` gives you the compile warnings, which are themselves a useful first finding to show.
- **Drawing is already expressible in AllSpeak.** The `svg` plugin gives you `svg`, `group`, `rect`, `circle`, `ellipse`, `line` and `svgtext`. A CFG is rectangles, text and lines — so the graph can be drawn by AllSpeak code from the model, with no new rendering machinery and no layout library to start with.
- **The `json` domain is your model carrier.** `JSON_PARSE`, `JSON_ADD`, `JSON_SET_VAR`, `JSON_FORMAT` and friends mean the plugin hands back a JSON string and the framework queries it. That's the clean interface between the two halves.
- **Plugin loading needs no new mechanism.** `require js <url>` from the host page, and the file self-registers with `AllSpeak.domain.<name>` — exactly how `svg` and the others do it (see `codex.html`).
- **Version 1 needs no file I/O at all.** The script you're analysing is the one in the editor's buffer — `asedit.as` already holds it in `Content`. For project-wide work you talk to the dev server's `/list` and `/read`, which `asedit.as` already uses. That removes the browser's file-access problem entirely.

**The traps, which are specific rather than general**

- **The language pack is global, and compiling mutates it.** `checkLanguageDirective` in `Compile.js` calls `AllSpeak_Language.init(pack)` and resets the compile-handler caches for Core, Browser, REST and MQTT. So compiling a French target flips the runtime's language for everything afterwards — including your own panel's keywords and strings. For AllSpeak this isn't an edge case; multilingual targets are the whole point. So: take the target's language from its own `language XX` directive, snapshot the active pack before the analysis, and re-`init` the previous pack afterwards. Design it in now rather than discovering it.
- **`AllSpeak_Compiler` is a singleton.** `compileScript` begins `const compiler = AllSpeak_Compiler;` and mutates its `tokens`, `index`, `program`, `symbols` and `warnings`. That's survivable because your framework is already compiled by the time it analyses anything — but you must not analyse while a compile is in flight (mid `run module`, for instance). Serialise analyses.
- **Keep compile-only, compile-only.** `compileScript` does *not* register the program in `AllSpeak.scripts` or bump `AllSpeak.scriptIndex`; only `tokeniseAndCompile` does. Preserve that, so the analyser never leaves ghost programs in the session.
- **Don't touch `program.tracing`** on either the target or yourself — it's the step-tracer's pause flag and will stall the run loop.
- **Python is the one place your preference meets real friction.** `Program.__init__` does `global queue; queue = deque()` and `language.load_by_name('en')`. So constructing a second `Program` inside a running Python program wipes the host's execution queue and its language pack. A Python plugin must not do that naively. The clean shape on that side is therefore *out of process*: an `allspeak viz` CLI subcommand, or the doclets-style server, emitting the same model JSON for the framework to consume. Which is the pattern you cited — but chosen for a structural reason rather than for tidiness, and worth knowing that before you start.
- Still worth doing: add the prose text to `asdoc-check.py --json`, since the narrative's captions need it and `section_status()` currently reports only counts.

**How the plan changes**

- **The "thin IR adapter" becomes one plugin per runtime**, each registering a single domain (say `viz`) and loaded the standard way. That's a better home than a Python module: in-repo, canonically owned, and following `spec/allspeak-plugin-contract.md`.
- **The vocabulary split I'd choose.** Plugin: the privileged operations only — get me the model, and later, record a trace. AllSpeak: everything else. Something like:
  - `model the script in Content giving Model` — compile-only, returns the IR as JSON, plus warnings.
  - `record the script in Content giving Trace` — the one that needs a runtime hook, and therefore the one to defer.
  - `draw the graph in Model into Canvas` — if you keep layout in AllSpeak over the `svg` primitives, this isn't a plugin command at all.
  CFG derivation in AllSpeak means a loop over the model array reading `keyword` and `goto` fields — which is AllSpeak's kind of work, readable and editable by you in the language you'd rather maintain.
- **Layout caution.** The analysis is linear and cheap; the only "time-consuming" risk in the browser is graph layout over a large script. For a script, ordering blocks by line number is already nearly the right picture — start there rather than pulling in a layout engine.
- **Multilingual UI follows asedit's shape**: structure in `asviz.json`, strings per language (either the `Str*`-assignment style in-script or a `strings.json`), behaviour in AllSpeak. Your target scripts will be in several languages, so this is not a later translation pass.
- **Revision to the milestones.** M0 keeps its purpose but changes shape: it becomes the plugin returning model JSON plus a throwaway AllSpeak script that prints it — you judge usability before any UI exists. Then CFG derivation in AllSpeak over that JSON, drawn with the `svg` plugin, which gets you a real picture early without committing to a GUI stack. The Python mirror then produces the *same model JSON* through a CLI or server, so both runtimes feed one framework — which is how "JS is the primary focus" and "Python is the runtime that benefits most" can both be true at once.

One honest note on the "all-Python solution" concern: you're right that it would be hard to keep up with, and the reason is narrower than it sounds. Python would only be needed for two things — project-wide file access and the trace recorder's hook — and both are small, well-bounded pieces. The comprehension logic, where the real content lives, is better off in AllSpeak in either case.

## 09:41

1. After a few hours allowing thoughts to gather, I conclude that the graph should primarily display points, not lines. Faint connecting lines are OK but the main thing seen will be the points representing labels being passed. I would expect to see lines of points, with some lines more populated than others. This leads on to other possible visuaisations akin to heat maps, such as showing where the program spent most of its time.
2. The framework of the drawing should be AllSpeak. If the graph drawing code is bulky and/or repetitive or slow it should be captured as new vocabulary for the SVG plugin. (The general principle behind all plugins and language additions.)
3. The choice of structure, narrative or time is a difficult one. I'll pick narrative as narrowly my first choice.
4. The first steps should be made as simple as possible, so let's stay with text initially.
5. I guess the first step is IR analysis. Perhaps we should intercept 'while' commands as well as labels, as these also cause the reviewer to experience a break in linear code reading.

**Assistant**

All five land well, and point 5 in particular changes the data model — so it's worth doing before any plugin is written. Taking them in turn.

**1. Points, not lines**

**It has a name and a precedent.** Rows = anchors, dots = visits, x = order or time. That's an **event raster** / spike-train plot: matplotlib ships `eventplot` for exactly this shape, logic-analyser and Perfetto "instant event" views are the engineering version, and per-neuron spike rasters are the canonical scientific one. Established, cheap to draw, and it degrades gracefully — which the line version doesn't.

**Why points are strictly better for this job:**

- Lines assert a path *and a direction*. With repeated visits they overlay into a mesh across the same two rows and stop carrying information. Points are additive: overlap *is* the data.
- Density needs no cleverness. More visits = more ink, so "some lines more populated than others" *is* the heat map — you get it by counting, not by colouring.
- Lines need a defined ordering to mean anything; points mean something as a set, so a partially-recorded trace still renders honestly.
- Rows aggregate: dots per row is visits per anchor, which answers "which label is noisy" directly.

**What this frees, and what to design in now:**

- Since density comes from dot count, **colour and size are free for a second variable** — dwell per visit, or case/thread. Better use than encoding time order, which x already carries.
- **Row order becomes the most consequential choice.** Discrete y forces one: source order (reads like the script), first-visit order (reads like the story), or count/dwell order (reads as a ranking). Make it a control rather than something baked into the code.
- **Marginal histograms are nearly free and are the "where does it spend its time" answer** — a bar per row (visits, or summed dwell) and a bar per x-bin (activity over time).
- **Saturation is a legitimate reading, not a bug.** A loop run 10,000 times inside a narrow x-range becomes a solid band. That means you need transparency or a log-ish treatment for the second channel, and the UI should say a filled band means "saturated".
- **Row selection is required, not optional.** A 300-row raster is illegible; you need subsets — hottest N, one doc-block section, one anchor and its neighbours. Sections are the natural grouping, and point 3 already gives you that model.
- **This view needs per-visit events, not just counts.** A raster can't be reconstructed from per-line counters, so the recorder must keep the event list (anchor, steps, timestamp, ideally from/to). Cheap — anchor visits are far rarer than instructions — but fix it in the trace model now rather than retrofitting it.
- **The faint lines: keep, as a toggle, and thin the set first.** Their real value is reading the path — a diagonal from row 40 up to row 3 shows the jump. Since ordering is already visible along x, draw a connector only when the anchor *changes*, so the line count is anchor *transitions*, not visits. That's a large reduction, and it's the version I'd implement.

**2. Drawing in AllSpeak, bulk promoted to vocabulary**

Yes — and it's the repo's own rule: `AI/ALLSPEAK_CODING_GUIDELINES.md` says to create a plugin when AllSpeak syntax is clumsy for a task or when wrapping substantial JS, and to prefer a new plugin over script-level workarounds. So this isn't a compromise, it's the documented convention.

**Discover the vocabulary rather than designing it.** The right candidates are what you write for the third time and still can't read. Write the raster in AllSpeak first and let the vocabulary fall out; the vocabulary is a spec, so guessing its shape up front is expensive to undo.

**What I'd bet on promoting, from this view specifically:**

- **A mapping primitive** — something like "put Value scaled from A to B into C to D giving R". Today that's hand-rolled integer arithmetic: the repo has an *idiom page* (`learn/idioms/05-floats-and-scaled-integers.md`) rather than a command, which is a good signal there's no vocabulary for it. Most likely first addition, and useful well beyond this tool.
- **An event-plot primitive** — one command taking an array of points. The per-point loop (map x, map y, create dot, set attributes) is the definition of bulky and repetitive.
- **Axis, margin and label placement** — fiddly, repetitive, easy to get subtly wrong.

**What to keep out of the plugin**: the analysis — CFG derivation, aggregation, ordering, selection. Those are loops over arrays, which is AllSpeak's home ground, and keeping them in the script is what keeps them editable by you.

**One refinement on where the additions go.** `svg.js` is a layer of *primitives* — element types as AllSpeak variables (`svg`, `group`, `rect`, `circle`, `ellipse`, `line`, `svgtext`). Margins, scales, axes and dot rendering are a *chart domain*, one layer up. I'd keep `svg.js` as the primitive layer (adding a primitive only if something is genuinely missing, e.g. a polyline or path for connectors) and put the chart vocabulary in a sibling plugin — say `plot.js` → `AllSpeak.domain.plot`, loaded with `require js`. That keeps `svg.js` comprehensible and makes the vocabulary reusable for any future plot. Putting it all in `svg.js` works too; it's just a heavier file to reason about.

Worth noting: because the drawing is AllSpeak, its keywords resolve through the language pack, so the drawing vocabulary is multilingual by construction — which matters for a tool whose point is scripts in several languages.

**3. Narrative first**

Good pick, and I think it's technically the right one for reasons beyond preference:

- It's the only one of the three that stands alone with *no run at all* — the majority of the value, especially on the Python side.
- It's inherently a text artefact, so it agrees with point 4: the narrative phase *is* the text phase. Those two decisions reinforce each other rather than competing.
- It subsumes the other two at coarse grain — "entered section X, then Y, then back to X" is structure and time expressed as prose.
- **The rule that decides whether it's a narrative or a plausible-sounding story: carry the doc-block hash state.** `asdoc-check.py` already reports `hash_state` and `verify_state` per section. If a section's prose is stale, the narrative must say so, or you've built a tool that confidently describes code that no longer exists. Mark each narrated section "prose current" or "prose may be out of date since this code changed".
- **Declare the fallback.** Files with no doc blocks get anchor-only narration; the report should state which mode it's in rather than quietly producing a thinner story.

**4. Text first**

Agreed, and I'd argue it's a first-class deliverable rather than scaffolding:

- Concretely, the framework `log`s a report instead of drawing, and the very first output is the model dumped readably — which is the M0 acceptance test anyway.
- **A report is diffable; a picture isn't.** You can commit it, diff two versions of a script structurally ("this edge is new"), and attach it to a review. So the text artefact may be what reviewers actually use long-term, with the graph as the exploratory tool.
- **A report is testable the way `conformance/` tests the engine** — fixture script in, expected report out. Your analysis gets regression coverage before any UI exists.
- It defers both the canvas-versus-editor question and the Qt question, which are the two decisions most likely to eat a week.

**5. Intercept `while` as well as labels**

The strongest technical point in the list. Endorsing it, generalising it, and flagging one mechanism detail.

**The principle behind your instinct.** What you're really selecting is *the points where control flow is not simply the next line* — where a reader's top-to-bottom model breaks. `while` qualifies strongly, arguably more than a label does, because a label merely *names* a place while a `while` *repeats* one.

**Why `while` is especially valuable.** The loop test pc is evaluated exactly once per iteration, so **visits to a `while` anchor are the iteration count** — a metric labels can't give you without adding a temporary label inside the body, which is precisely the manual work the tool exists to remove. A `while` anchor also exposes a loop that spins without ever entering its body, which no label inside the body would show.

**Record the transition, not just the visit.** A label is a *place*; a `while` is a place plus a repeated event plus an *outcome*. So record `(anchor pc, next pc, steps, t)` per hit. The branch outcome then comes free — `while` moves to pc+2 when true, pc+1 when false — so the final evaluation is identifiable and iterations follow from the true-count. The same data gives you anchor-to-anchor transitions, which is exactly the thinned line set from point 1. One generic recorder, no per-construct special-casing.

**One computation, two consumers.** The static pass already has to find `while` sites to build the CFG. So build the anchor set once — labels plus loop tests — and let both the graph and the recorder consume it, so the two views can never disagree about what an anchor is.

**Naming.** Once `while` is in, "label" is the wrong word for a row. I'd call them **anchors**: a set of watched code positions. The JSON model, the plugin vocabulary and the report will all refer to the set, and a name that covers loop tests avoids a mismatch later.

**The natural next members**, each with a reason rather than "it's also control flow":

- `gosub`/`return` — the biggest break in linear reading after a loop, and it gives you real nesting for a flame-style view later.
- `if` — a fork and rejoin; cheap, and it exposes never-taken branches. It breaks linear reading less severely than `while`, which may be why your instinct stopped there.
- `every` — periodic re-entry, the same family as `while` from a reader's point of view, and it's how AllSpeak does animation and polling.
- `stop`/`exit`/`fork` — thread ends and starts; needed for case/thread lanes later, not for reading.

**A mechanism caution.** A `while`'s semantics are spread across three IR commands — the test, the fail `gotoPC`, and the trailing back `gotoPC` — so the anchor is the *test* pc, which is also the right line for the reader's eye (the `lino` on the `while` command). Name it as "the loop at line N", not as a label.

**And a robustness point in your favour:** detection is language-independent. In Python, `compileToken` stores `language.reverse_word(token)`, so `command['keyword']` is canonical whatever the source language; in JS, `AllSpeak_Opcodes.resolve` stamps a canonical `opcode` such as `WHILE`. Matching on the canonical keyword or opcode finds loop tests in French, Italian and German scripts without knowing their vocabulary — which matters, since your targets will be multilingual.

**The immediate next deliverable, text only:** a dump listing the anchors — labels and loop tests — with line numbers, static loop-nesting depth per anchor, and the compile warnings. Small, useful on its own, exercises the compile-without-run path end to end, and is the prerequisite for both the graph and the narrative. It's also what tells you whether "anchor" is the right abstraction, so it should happen before any plugin vocabulary is contemplated — and since point 5 changes the model rather than sitting on top of it, it belongs before the plugin is written too.

## 10:26

Step13 is fine by me. It's compact and it has two events that can be traced.
There's a lot here for me to take in. It would help to have something to run, so I can see what's happening and ask specific questions.

**Assistant**

Working end to end. Here's what you can run right now:

node tools/asviz-run.js                              # default: codex/en/code/step13.as
node tools/asviz-run.js tools/anchors-fixture.as     # the negative-case fixture
node tools/asviz-run.js a.as b.as                    # several targets, one process

Real output for step13:

model | script=codex/en/code/step13.as | lines=69 | commands=62 | labels=3 | loops=1
anchor | kind=label | line=45 | name=DisplayUnsorted | pc=38 | depth=0
anchor | kind=label | line=51 | name=Display | pc=41 | depth=0
anchor | kind=loop | line=54 | pc=43 | depth=0
anchor | kind=label | line=62 | name=AlphabeticSort | pc=50 | depth=0
anchors: 4

Every line number matches the file. And the fixture exercises the awkward cases:

model | script=tools/anchors-fixture.as | lines=56 | commands=27 | labels=9 | loops=5
anchor | kind=loop | line=31 | pc=9 | depth=1        <- the inner loop of a nested pair
anchor | kind=label | line=47 | name=AdjacentA | pc=23 | depth=0
anchor | kind=label | line=48 | name=AdjacentB | pc=23 | depth=0   <- same pc
anchor | kind=label | line=56 | name=Trailing | pc=26 | depth=0    <- last line of the file

**What I built**

| File | Role |
| --- | --- |
| `js/plugins/asviz.js` (178 lines) | The plugin. One command, `model the script [in <path>] giving <variable>`. Compiles the target **without running it** via `AllSpeak.tokeniseFile` + `AllSpeak.compileScript`, walks the IR, and writes a newline-separated model into the variable. |
| `viz.as` (49 lines) | The AllSpeak framework. Two doc blocks, `@hash` lines inserted by `asdoc-check.py --write`; the analyser reports it clean. |
| `tools/asviz-run.js` (112 lines) | Node host: loads the runtime in the `build-allspeak` bundle order, loads the plugin, registers the target's source, runs the framework. |
| `tools/anchors-fixture.as` (56 lines) | The negative-case fixture. No doc blocks, matching `tools/modulo-test.as`. |

The host-tool seam is the whole thing: `AllSpeak_Viz.target` plus `AllSpeak_Viz.sources[path]`. That two-line contract is exactly where the dev server's `/read` plugs in later.

**Findings from the first run**

These are the things I'd want to ask about, so they're front and centre.

1. **The two events you mentioned in step13 are invisible to the current anchor set.** `on click Sorted` (inline block) and `on click Unsorted go to DisplayUnsorted` are event *registrations*, not labels, and the handlers are entered by events rather than by falling through the code. So step13's traceable events don't appear — which is precisely what the "control flow isn't the next line" principle predicts: **`on` handlers are entry points, and they belong in the anchor set.** That's now the most valuable next member, ahead of `gosub`.
2. **A label immediately followed by a `while` yields two anchors at the same pc.** `Loop:`/`while` are both `pc=3`; the same for `Nested`, `NeverEntered`, and `OneLine`. In the recommended style every loop is preceded by a label, so this is the common case, not an edge case. So pc does not identify an anchor — and there's a real design question: keep both records (a jump target *and* a repetition site — my current choice, since they're different facts), or collapse to one row labelled by the loop? I'd keep both in the model and draw one row per pc, named by the label.
3. **`Unreachable:` is listed as an anchor but not flagged as unreachable.** Expected — reachability is the CFG step, not the anchor step — but the fixture makes the gap explicit.
4. **Two array representations exist in this runtime, and it cost me the first working run.** `json count of X` counts a *JSON-string* array (what `append` builds); `split` builds a multi-element symbol record, whose length is `the elements of X`. My first framework version used `json count`, got `0`, and silently printed no anchors. Worth knowing before it bites you in a script you care about.
5. **Comments never reach the IR.** The fixture's eleven comment lines produce zero commands. So doc blocks and `!` comments inflate `lines=` but nothing else — which is good news for the doc-block narrative tier: prose can't pollute the model, it only shifts `lino`.
6. **"The runtime needs a browser" amounts to two globals and two assignments.** The Node host needed a `document`/`window` shim, plus `AllSpeak_Language.init(...)` and `AllSpeak.scripts = {}` from `AllSpeak_Startup`. The compile-and-print path touches no DOM at all — encouraging for headless/CI use and for a Python-side mirror.
7. **The compiler singleton is a non-issue in practice, and I tested it rather than assuming.** Two targets in one process produce two independent models, because the framework is already compiled by the time the plugin borrows the compiler.
8. **The framework's job turned out to be exactly what I hoped**: `split`, `the elements of`, `index`, `while`, `starts with`, `cat` — core vocabulary only, no plugin help. The plugin is 178 lines, the framework 49, and the line between them held.

Rough edge: the target variable must be declared; otherwise `getSymbolRecord` throws at run time rather than compile time.

**Two things to know about placement**

- **`tools/` is gitignored** (`.gitignore` line 3, and nothing in `tools/` has ever been tracked here) — so `tools/asviz-run.js` and `tools/anchors-fixture.as` are **local-only** and will not survive a fresh clone. `viz.as` and `js/plugins/asviz.js` are in tracked locations. Say the word if you want the fixture and runner moved somewhere versioned.
- I deliberately did **not** add a browser host (`viz.html`). I can't verify a page here, and an unverified artefact is a liability. It would mirror `edit.html`: fetch `viz.as` into `#allspeak-script`, load the runtime and the plugin, call `AllSpeak_Startup()`. Note that a browser host needs `./build-allspeak` to copy the plugin into `dist/plugins/` — I didn't run it, since it rewrites `deploy/dist/` and reaches for the network.

The only files I touched are those four. The `.reasonix/*` and `documents/*` entries in `git status` were already there.

## 11:48

I've run this on some scripts in resources/ecs (can/should this be be renamed?)
lifedemo.as is good
diceroller.as barfs (framework runtime error)
Does this tool work on both JS and Python-based scripts?
What's the next step?

**Assistant**

All four answered, and the corpus run turned up more than expected.

**1. `resources/ecs` — can it be renamed?**

The name is a fossil: `ecs` is the **EasyCoder Script** extension, and the 23 files inside are `.as` — the AllSpeak extension. So the container is named after a format the contents abandoned at the fork. Other fossils are in the same family, e.g. `server.as`'s docstring still says it serves "HTML, JS, CSS, JSON, ECS".

It's referenced by hard-coded REST paths, not just prose:

- `index.html:21` — `rest get Script from '/resources/ecs/main.as?v=' cat now`
- `codex/codex.as:303` — `rest get Script from '/resources/ecs/docman.as?v=' cat now`
- `codex/{en,fr,de,it}/md/tools.md` — a documented example path
- plus generated mirrors: `deploy/codex/**`, `resources/doc/*/core.json`, `deploy/resources/doc/*/core.json`, `tools/translations/*/core.json`

So a rename is mechanical but not local: ~20 files including *generated* caches, and `deploy/` is rsynced verbatim, so you'd want `./deploy-sync` afterwards. My take: **the folder isn't the stale part, the contents are.** `resources/` is already described in AGENTS.md as "carried over from EasyCoder, to be pruned", and these are website pages rather than a coherent module — they're even mixed-target (`scripted-server.as` is Python-only). I'd either let `ecs/` go with the pruning, or rename it as part of that work rather than as a standalone tidy.

**2. `diceroller.as` — fixed, and it found four bugs**

Two were mine, and both would have hit you on other scripts:

- **I passed `null` for `imports`** to `compileScript`. `Core.js:1091` dereferences `imports.caller`, so any target using `import` crashed. Now passes `[]` (the handler's own `length` test takes the no-import branch).
- **The target's own `script <name>` command registers it in `AllSpeak.scripts`**, and I never cleaned up — so analysing `codex/fr/code/step18.as` after the English one died with `Script 'Solitaire' is already running`. That's what killed five files in the sweep: the translated step18/19/20 reuse the English names (`Solitaire`, `PanZoom`, `KenBurns`). The plugin now snapshots the registry and removes anything the compile added.

Two were the runtime's, and both are contract violations rather than my usage:

- `Value.js:73` and `Condition.js:12` call `handler.value.compile(...)` / `domain.condition.compile(...)` **without checking the member exists**. Mine was the first domain without them — but `codemirror-ecs.js` lacks both too, so it's a pre-existing latent crash, and `spec/allspeak-plugin-contract.md` says outright that "missing handlers are allowed". I added guards in both files.
- **The language pack is global, and compiling a target switches it.** I flagged this two turns ago and the corpus reproduced it exactly: after analysing the French script the runtime stayed French, and the *next* framework compile failed in Italian. The plugin now saves and restores the pack (and clears the per-language compile-handler caches, mirroring `checkLanguageDirective`).

**Note:** `js/allspeak/Value.js` and `js/allspeak/Condition.js` are canonical runtime source, so those two guards need `./build-allspeak` to reach the browser. I didn't run it. `diceroller.as` now reports 9 anchors with every line number matching the file, including the nested loop at 69 as `depth=1`.

Two more causes of failure I found were in my *harness*, not the tool: the analyser needs the target's **language pack** loaded (or `language français` silently fails to switch) and the target's **plugins** (or `showdown decode …` can't compile). Both now load automatically, and the harness reports which domains are in scope.

**3. Does it work on JS *and* Python scripts?**

Not yet, and now I can be precise about why. The tool compiles with the **JS runtime**, so it analyses anything the JS runtime can compile — regardless of which runtime the author intended.

Sweep of 148 `.as` files across `codex/ learn/ resources/ecs primer/ chat/ conformance/ tools/`: **140 analysed, 790 anchors, 8 failures** — and every failure is vocabulary the JS runtime lacks:

| Failure | Files | Verdict |
| --- | --- | --- |
| `use` | `chat/chat-server.as`, `resources/ecs/scripted-server.as` | Python-only. I confirmed both compile under the Python runtime (418 and 300 commands) |
| `list`, `dictionary` | `tools/asdoc-check-cli.as` | Python-only. Its own source says "must be `list` so item N of works **in Python runtime**" |
| `string`, `number` | `conformance/tests/EC-0007`, `EC-0009` | **Neither** runtime — Python rejects `string Sentence` with the same error |
| `Undefined value: 'the'` | `tools/asdoc-check.as` | needs a look |
| Italian i18n gaps | `codex/it/code/step16`, `step18` | English equivalents pass |

So covering Python-targeted scripts needs the second model producer on the Python side — out-of-process, CLI or server, emitting the same model — which was the plan all along. It's also required for correctness, not just coverage: the Python IR differs in detail (labels are commands, `lino` is 0-based, `gotoPC` rather than `goto`).

**What the tool found on the repo**

This is the part that answers "what does my program do" in the least expected way — it found defects in *other* things:

1. **`Compile.js` reports the wrong line number for "no handler found" — off by one.** Proven twice: `list Entries` is line 38, reported as 39; `elemento` is line 220, reported as 221. Cause: `compileToken` does `this.getLino() + 1`, but JS token `lino` is already 1-based (Python's is 0-based, where `+1` is right). One-line fix; I haven't made it, because it's unrelated to the tool and it's your call.
2. **The diagnostic blames the first token of the failed statement**, not the token that failed. `Non capisco 'imposta'` blames `imposta`, which maps fine — the real gap is later in the line. That's what makes finding 1 hard to notice.
3. **An Italian pack/translation disagreement**: `codex/it/code/step16.as` line 41 uses `chiave`, but the Italian pack maps `key` → `tasto`. The pack and the tutorial contradict each other. (`language-pack-issues.md` already tracks gmap vocabulary gaps; these look new.)
4. **Two conformance tests use `string`/`number`, which neither implementation accepts** — so `EC-0007` and `EC-0009` cannot pass in either runtime. If `string`/`number` are meant to exist, that's a spec gap; if not, they should be `skip`ped.
5. `codemirror-ecs.js` has no `value`/`condition` members — it would have crashed on any unhandled value or condition, exactly as my plugin did. Now guarded.

**4. Next step**

The corpus changes my priority order. I'd do these two, in this order, both small and both static:

- **Add `on` handlers to the anchor set.** No longer a principle, a measurement: `diceroller.as` has four event entries (`on message`, `on click Dice`, `on click Dot`, `on DecoratorCallback`) and none appear; step13's two events likewise. The `on` commands are already in the IR with their handler pcs, so it's the same scan.
- **Reachability on the CFG.** The fixture's `Unreachable:` label and its never-entered loop are in the model but unflagged. The CFG edges give you "this anchor is unreachable" and "this loop is never entered" — the first *finding* the tool produces with no run at all. That's the step that turns it from a describer into a finder.

After that, the Python-side producer, and the browser host last. The sweep is reproducible as a check: `node tools/asviz-run.js $(find … -name '*.as')` continues past failures and exits non-zero, so it can already serve as a CI guard for "this script no longer compiles".

Still worth knowing: `tools/` is gitignored, so the harness and fixture are local-only; `viz.as` and `js/plugins/asviz.js` are in tracked locations.

## 12:31

1. Do the Compile.js fix
2. The scripts in resources/ecs seem to be a mixture of very old and quite recent. As long as none get lost in the process, schedule a prune for whenever is appropriate.
3. Next step as per your recommendation.

**Assistant**

All three tasks are done and verified.

**1. `Compile.js` off-by-one — fixed**

One line, `const lino = this.getLino() + 1` -> `this.getLino()`, with a comment explaining why. Every failure message in the sweep now names the correct line:

| Message | Was | Now |
| --- | --- | --- |
| `I don't understand 'list'` | 39 | **38** (correct) |
| `Non capisco 'elemento'` | 221 | **220** (correct) |
| `Non capisco 'imposta'` | 42 | **41** (correct) |
| `I don't understand 'string'` | 4 | **3** (correct) |
| `I don't understand 'use'` | 6 / 16 | **5 / 15** (correct) |

**2. Prune scheduled in `TODO.md`**

Added a *Housekeeping (not language work)* section — nothing deleted. It records:

- **What it is**: a superseded site generation. `documents/doclets-feature-checklist.md` already establishes that the deploy pipeline never ships `resources/` (`deploy-allspeak` mirrors only `codex/`, `learn/`, `primer/`).
- **The age mixture you described**, quantified: 18 files from the fork day (2026-04-06), the `scripted*` editor bundle + its README (04-08), `docman.as` (04-17), `doclets.as` (08-04), `main.as` (08-19, the newest).
- **Five references to clear first**, two of which are *already broken*: `project.html:13` loads `/resources/ecs/project-main.as`, which doesn't exist; and the four `resources/doc/*/core.json` translation caches link to `resources/ecs/sample/factory`, which doesn't exist either. Plus `index.html:21`, `codex/codex.as:303`, the `myscript.as` example paths in four `tools.md` files, and the README that documents a five-file bundle sitting among unrelated pages.
- **Why nothing can be lost**: all 33 files are tracked, so `git log -- resources/ecs/<file>` recovers any of them; run `./deploy-sync` afterwards since `deploy/` mirrors the tree.
- **When**: with the `resources/` prune as a whole, not during a deploy freeze.

I also noted that renaming is moot if the folder is going — if a subset survives (the `scripted` bundle), name it after what it is.

**3. Next step — event anchors and reachability, both done**

**Event anchors.** `on …` and `every …` now appear as `kind=event`. They share the same compiled shape — registration, skip-goto, handler from `pc+2` — but I *check* that shape rather than assuming it, so a domain with a different layout reports `entry=?` instead of a wrong pc. Events are named by action *and* element: `click:Unsorted`, `click:Dice`, `click:Dot`, `DecoratorCallback`. step13 now shows its two events; diceroller shows all four.

**Reachability.** Successors are derived per command (fall-through, `goto`/`go`, `gosub`/`return`, `if`/`else`, `while`, `fork`, `try`/`handlerPC`, `onError`, `stop`/`exit` as terminals), then a DFS from the roots — program start **plus every event entry**, which is what makes `on … go to Handler` targets reachable at all. Each anchor now carries `reachable=yes/no`, and the plugin emits a `note` line when computed jumps or `return`s make the verdict approximate.

One refinement came from the tool being *wrong* first: it reported `AlphabeticSort` in step13 as unreachable, because `sort DisplayList with AlphabeticSort` names it rather than jumping to it. A label used as a value is an entry point too, so the DFS now also follows names found in a reachable command's fields — the same test `Compile.js` already uses when warning about unused symbols. `AlphabeticSort` is now `reachable=yes`.

**The fixture grew a decisive case**: a `button Go`, an `on click Go go to EventOnly` registration, and the `EventOnly` label placed *after* a `stop` — so it can only be reached through the event. It reports `reachable=yes`, which is the test that the root logic actually works. Expected and actual: 10 labels, 5 loops, 1 event, 16 anchors, 2 unreachable (`Unreachable`, `Trailing`).

**Sweep of 148 scripts: 140 analysed, 1226 anchors, 8 unreachable, 34 with approximate-reachability notes.** Two of the eight are real findings, and I verified both by hand:

- **`codex/codex.as:890` — `ListSorter` is dead code.** The name appears nowhere else in the file; nothing calls or references it.
- **`resources/ecs/usercapture.as:180` — `Decorate` can never run.** `DecoratorCallback` is declared at line 27 and written to at 181/192, but there is no `on DecoratorCallback go to Decorate` registration — and no `showdown decode` anywhere in the file either, so the callback is never even fired. Compare `diceroller.as`, which has both lines. So either that page's syntax decoration was never wired up, or the wiring was lost.

Files changed: `js/allspeak/Compile.js`, `js/allspeak/Condition.js`, `js/allspeak/Value.js` (13 insertions, 1 deletion total), `TODO.md`, plus new `js/plugins/asviz.js` and `viz.as`. `viz.as` passes `asdoc-check.py` clean.

**Still outstanding for you**: `./build-allspeak`, which I haven't run — it's now needed for the three runtime fixes to reach `dist/`, not just the plugin.

For the step after this, the biggest known gap is that **8 of 148 scripts are invisible** because the JS runtime can't compile Python-only vocabulary (`use`, `list`, `dictionary`) — so I'd do the Python-side model producer next, now that its IR differences are understood (labels *are* commands, `lino` is 0-based, internal jumps are `gotoPC`). The browser host stays last.

## 13:35

I've deployed. I'd like to see the Python-side version as I have a large script to aim it at.

**Assistant**

Working on both runtimes now. Here's where it stands.

**What you can run**

python3 tools/asviz-run.py <script.as> [more.as ...]     # Python runtime
node    tools/asviz-run.js <script.as>                   # JS runtime

Verified on the Python side:

| Target | Result |
| --- | --- |
| `tools/asdoc-check-cli.as` (392 lines, 300 commands) | 16 labels, 2 loops, 18 anchors |
| `chat/chat-server.as` (489 lines, 418 commands) | 11 labels, 1 loop, 1 event, 13 anchors |
| `resources/ecs/scripted-server.as` | 0 labels, 0 loops — correct: it really has none (the server plugin drives it) |
| `conformance/tests/*.as` (14) | 11 analyse, 3 fail |

**One framework, two runtimes**

`viz.as` now runs unchanged under both. Two things were needed for that, and both are worth knowing:

- **`split` differs between the runtimes** — JS is `split <value> on <sep> into <var>`, Python splits in place and takes no target — so the plugin now hands the framework a **list of records** rather than a blob of text. The framework reads it with `the elements of` and `index`, which both support. Reasonable independently of portability: no delimiter or quoting to get wrong.
- **Plugin loading is runtime-specific** (`require js` vs `use plugin …`), so the framework carries no prelude: the *host* registers the domain, exactly as a browser page loads a plugin. The Python runner calls `useClass(Viz)` before `start()`.

**The Python IR needed its own analysis**

Dumping the real IR first paid off — it differs from JS in ways that would have produced silently wrong answers:

- **Labels are real commands here** (`domain: None`, `classname: ':'`) carrying their own `lino`, so unlike JS there's nothing to recover from the tokeniser.
- **`lino` is 0-based** (JS is 1-based).
- **`if` has no `else` field** — the exit target rides on the following `gotoPC`, and the runtime jumps `pc+2`/`pc+1`.
- **`gosub`/`fork` name their target in a field of the same name** (`gosub`, `fork`), not `label`.
- **`on` keeps its skip target on the command itself.** The `gotoPC` at pc+1 is left pointing at **0** and is never executed — following it would have wired every event handler back to the start of the program and hidden real findings. The handler entry is pc+2, matching the runtime's `onMessage(nextPC() + 1)`.

Python's vocabulary is also genuinely smaller — no `sort`, no `every`, no `div`/`button`/`on click`. So the two views legitimately differ: **you see the script as the runtime you analyse it with sees it.**

**What it found**

- **3 of the 8 scripts the JS plugin couldn't compile now analyse under Python**: `chat/chat-server.as`, `resources/ecs/scripted-server.as`, `tools/asdoc-check-cli.as` — the ones using `use`, `list` and `dictionary`.
- **A genuine Python implementation gap, from aiming it at the conformance suite**: `EC-0008-char-of-value.as` is marked `"required": true` and expects logs `["u","e"]`, but the Python runtime cannot compile `char 5 of Text` — `as_value.compileValue: Cannot get the value of "char"`. The JS runtime supports it. So that required test cannot pass on Python today. The other two conformance failures (`EC-0007`, `EC-0009`) both use `string`, which **neither** runtime accepts — the earlier finding, now confirmed from the other side.
- **An undocumented plugin requirement**: my first Python plugin crashed with `'Viz' object has no attribute 'modifyValue'`, because `as_value.py:76` calls `domain.modifyValue(value)` on *every* registered domain, unguarded. That's the Python twin of the JS `handler.value.compile` bug I fixed last turn, and it's a latent crash for any plugin that omits it. The plugin contract mentions `compileValue`/`compileCondition` but not `modifyValue`. I implemented it in the plugin rather than change another runtime file — but it's worth three lines in `spec/allspeak-plugin-contract.md`, or a guard for symmetry with the JS fix.

Also changed: **a target that won't compile is now a finding, not a crash**, in both runtimes — the plugin emits a `problem |` record, the framework prints it and counts it, and the runner still exits non-zero:

problem | script=conformance/tests/EC-0007-includes-membership.as | I don't understand 'string' at line 3.
anchors: 0
problems: 1

**Outstanding**

- **`deploy/dist/plugins/asviz.js` is stale** — your build predates this turn's plugin changes (array records + problem handling). `./build-allspeak` again, when you want the browser copy current. Nothing else on the Python side needs building.
- JS sweep after the refactor: 140 models, **613 anchors, 4 unreachable**, same 8 failures. The anchor count halved from 1226 because the framework no longer prints the model *and* re-prints the anchors — 613 is the correct figure, not a regression. The 4 unreachable are the two real findings (`ListSorter` in `codex/codex.as`, `Decorate` in `resources/ecs/usercapture.as`) plus the fixture's two.

Files this turn: new `allspeak-py/plugins/as_viz.py`, new `tools/asviz-run.py`, modified `viz.as`, `js/plugins/asviz.js`, `tools/asviz-run.js`.

For your large script: aim `python3 tools/asviz-run.py <it>.as` at it and tell me what looks wrong — the reachability `note` line will say when the verdict is approximate, and a `problem` record means it didn't compile rather than that the tool failed.

## 14:52

The script is ../rbr/controller.as  It ran all the way through and reported 1 unreachable, NoCredentials. You'll have to explain that for me. The label exists and is called with
	    get Credentials from url `https://rbrheating.com/credentials.php`
    	    or go to NoCredentials

**Assistant**

Explained — and it was a false positive in my analysis, not a problem with your script.

**Why it said `NoCredentials` was unreachable**

220:  get Credentials from url `https://rbrheating.com/credentials.php`
221:      or go to NoCredentials

compiles to three commands:

| pc | what |
| --- | --- |
| 186 | the `get`, carrying **`or: 188`** |
| 187 | a `gotoPC` to 189 — the path the *success* case follows |
| 188 | the handler body: `goto 'NoCredentials'` |

My Python plugin derived successors for jumps, loops, `if`, `gosub`/`return`, `fork`, `on` and `try` — but **not for the failure clause**. So pc 188 had no incoming edge of any kind and `NoCredentials` looked like an island. The code was always fine.

**Why the JS side never showed this**: the JS runtime stores the same clause under a different name — `onError`. The JS plugin already followed that. Same construct, two field names, and that's the fourth such divergence between the runtimes (`goto` vs `gotoPC`; `if.else` vs a following `gotoPC`; labels as real commands vs bare symbol entries; now `onError` vs `or`).

**The fix**: any command carrying `or` (Python) or `onError` (JS) now contributes its clause target as a second outgoing edge — the normal path continues past the clause, the failure path enters it. Verified:

anchor | reachable=yes | kind=label | line=280 | name=NoCredentials | pc=225 | depth=0
model | script=../rbr/controller.as | lines=2318 | commands=1910 | labels=41 | loops=19 | events=2 | anchors=62
anchors: 62
unreachable: 0

Your script has three such clauses — the `get` at line 220 and two `send`s at 2214 and 2224 — all now followed. It analyses in **1.4 seconds**.

**How to read that "0 unreachable"**

It's weaker than it looks, and the `note` line says so:

note | reachability is approximate: 92 computed jump(s) or returns

81 of those 92 are `return`s. My model for `return` is deliberately permissive: a `return` may resume at *any* point that follows a `gosub`. With 87 gosubs in your script, that connects most of the graph. So `0 unreachable` means "no **definite** islands" — not "everything is provably reachable".

That's also why this false positive was worth chasing: it was reported unreachable *despite* that permissiveness, so it stood out as a genuine anomaly. And "check whether the analysis has a gap before believing a dead-code claim" is the right first instinct every time.

**If you want sharper findings**, the next refinement is to match each `return` to its own call site instead of anywhere — per-label intra-procedural analysis. That tightens reachability a lot and would start producing real dead-code claims on a script like this. Analysis only; no new vocabulary.

**Two smaller things**

- The runner printed `FAIL … : ` with an empty message while I was mid-edit, because AllSpeak's `RuntimeError` doesn't stringify. It now falls back to the exception type and points at the log the runtime already printed. A genuine diagnosability rough edge in the runtime.
- **The failure clause isn't uniformly available.** `append … or …` compiles in JS but not Python (Python's `append` needs an `ECList`/`ECQueue`-typed variable), and `take … or …` fails in both. So an `or` clause can compile in one runtime and not the other — worth knowing when writing portable scripts, and worth a `TODO.md` entry if you want one.

Also confirmed no regression: the fixture still reports 2 unreachable, the Python probe 1, and the Python conformance suite is unchanged at 11 of 14.

Files changed this turn: `allspeak-py/plugins/as_viz.py` (the clause edge) and `tools/asviz-run.py` (the failure message).

## 15:48

Will that not cause a potential problem with scripts that jump into another subroutine instead of returning directly?

**Assistant**

Yes — and your own script demonstrates the problem. I scanned it for exactly those patterns:

../rbr/controller.as
  labels=41 gosub targets=33
  gosub targets with no `return` in the block (tail-jump / fall-out): 5
      ProcessRoom: pc=562   ProcessReply: pc=686   SetRelay: pc=745
      UpdateRooms: pc=922   UpdateProfile: pc=924
  labels both gosub-target and fallen into from the line above: 4
      ProcessReply (after `send`)   UpdateRooms (after `set`)
      UpdateProfile (after `set`)   SendMapToUI (after `print`)
  `return` inside a block that is not a gosub target: 1
      UpdateMap: pc=930

So nine of your forty-one labels break the call/return discipline in one of two ways, and one `return` sits in a block nothing calls.

**What those patterns do**

`gosub` pushes the return address; `return` pops it. A block that **tail-jumps** (`go to`) or **falls through** into the next label leaves its address on the stack — so the eventual `return` resumes at the *original* call site, from a different subroutine than the one containing it. `SetRelay` is called but never returns directly; whoever returns later is returning on SetRelay's behalf.

A **shared entry** is worse for analysis: `ProcessReply` is entered both by `gosub` and by falling in from the `send` above it, so "the call site of this block" isn't a well-defined thing at all. And `UpdateMap`'s `return` has no call site to match — dynamically it pops whatever the stack happens to hold, or errors.

A per-call-site model has to *guess* in all nine places. Guess wrong and it reports live code as dead.

**Why that settles the direction**

The two models fail in opposite directions:

- **Current model** — `return` may resume at any pc that follows a `gosub`. It can *miss* dead code.
- **Tight model** — wrong on shared entries and tail-jumps, so it can *invent* dead code.

For a tool whose output is a claim a reviewer will act on, inventing dead code is the unacceptable failure. That's exactly what `NoCredentials` was: a confident-looking claim that turned out to be an analysis gap. So I wouldn't tighten the graph.

**And a correction to what I said earlier**

I implied the current model is "permissive". Looking again, it's closer to exact than I gave it credit for: the pc after each `gosub` genuinely *is* a return point, so reachability is nearly right. Its two real gaps are narrow — a live `return` can resurrect code sitting after a *dead* `gosub`, and it tells you nothing about *which* call site a label belongs to.

So tight matching would mainly buy **"how"**, not **"whether"** — and `how` is precisely the inference your script's structure doesn't support. That reframes it: matching returns to call sites isn't a dead-code feature. It's a *route* feature, which is the narrative goal we chose several turns ago — and route claims need to be sound before they're useful.

**What I'd do instead**

Turn the scan into **facts rather than inferences**. For each label, compute and report its shape:

- `returns` — has a `return`, and a call site exists
- `exits-via-go-to` / `falls-through` — entered by call but leaves without returning
- `shared-entry` — also fallen into from the line above
- `no-call-site` — contains a `return` with no matching `gosub` on any path

Those are observations about the code, verifiable by eye, and they're exactly what a reader needs — "SetRelay is called but never returns" is a structural fact worth knowing, and arguably worth *flagging*, not smoothing over. They also give a sound basis for any future dead-code claim: only assert "unreachable" for a label with no incoming edge of any kind **and** no mention as a value.

Net effect: you'd get more from this scan as annotations than you would from a sharper graph, and the failure mode stays "might have missed something" rather than "wrongly called it dead".

Want me to add the `shape=` field to the anchors (both plugins, since the scan is the same), and count the shaped labels in the framework summary?

## 16:12

It's a patttern I'd like to feel free to use, not withstanding its somewhat unstructured nature. It greatly simplifies many large if...then..else structures in areas like business logic. An escape hatch for when th wrong path is taken. If you can impove the scanner without compromising that ability, go ahead.

**Assistant**

Done — and nothing about the pattern is flagged.

**What the scanner reports now**

Each label anchor carries two new fields, and the header gets a census:

anchor | reachable=yes | kind=label | line=37 | name=Start | pc=29 | depth=0 | entry=event,jump | exit=falls-out
anchor | reachable=yes | kind=label | line=64 | name=Redraw | pc=43 | depth=0 | entry=event,jump,fall-in | exit=stop
anchor | reachable=yes | kind=label | line=83 | name=RandomiseDots | pc=63 | depth=0 | entry=call | exit=return

- **`entry`** — `call`, `fork`, `event` (an event handler jumps here), `jump` (a `go` names it), `fall-in` (the block above runs on into it), `branch` (only reached by a compiler-generated jump), `named` (its only trace is the name appearing as a value — the callback case), `none` (nothing enters it).
- **`exit`** — `return`, `jump` (a tail `go`), `falls-out` (control runs on into the next label), `branch-out` (a jump leaving the block, including over the top), `stop`, `exit`, `no-exit`.

Your script, as it stands:

shape | labels=41 | entry-call=33 | entry-fall-in=10 | entry-jump=6 | entry-event=1 | entry-none=0 |
        exit-return=29 | exit-falls-out=10 | exit-branch-out=2 | exit-jump=4 | exit-exit=2 | exit-none=0

Those numbers cross-check against the scan I ran by hand earlier: 33 call targets, and 29 blocks containing a `return` — the 28 call targets that return directly plus the one stray `return` in a block nothing calls. Two independent measurements agreeing is the reassurance I wanted before trusting the field.

**Nothing here is a warning.** The escape hatch shows up as `exit=falls-out` on the block that leaves and `entry=fall-in` on the block it runs into — a description of the route, in the same vocabulary as everything else. `SetRelay` is `entry=call | exit=falls-out`, and that's all it says.

What you *do* get is a way to read an `unreachable` verdict safely, which is what last turn's false positive was really about:

- `reachable=no | entry=none` — nothing enters it at all: a confident dead-code claim.
- `reachable=no | entry=call` — suspicious: the analysis most likely missed an edge, as it had for `NoCredentials`.

That's the confidence tiering, achieved descriptively rather than with a new verdict.

**Two mislabellings found and fixed while doing it**

Both were wrong labels, not wrong reachability:

- Python leaves the vestigial `gotoPC` at 0 inside every event's scaffolding (the one that's never executed). It was reading as a "branch out of the block" back to the program start. The whole event construct is now treated as scaffolding for the block it sits in.
- A call whose target happened to *be* the next label was reading as a fall-through, and a `return` as a branch-out. Call targets are now reported on the entry side (`call`/`fork`) only — but a call's *continuation* still counts, because a block ending in `gosub` genuinely runs on into the next label when it returns. That's the case in `diceroller`: `Start` is `exit=falls-out` into `Redraw`, which is now stated rather than lost.

**Verification**

No change to reachability anywhere: the JS sweep is still **140 models, 613 anchors, 4 unreachable, 8 failures**; the fixture still 16 anchors / 2 unreachable (with `Unreachable` and `Trailing` now showing `entry=none`, the confident case); the Python conformance suite still 11 of 14; `viz.as` clean under `asdoc-check`. The shape fields are additive, so nothing already working moved.

One caveat worth stating: `entry`/`exit` describe *labels*, since that's where block structure lives in this language — loops and events don't carry them.

Files changed: `js/plugins/asviz.js` and `allspeak-py/plugins/as_viz.py` only.

## 17:05

What's next?

**Assistant**

Where things stand: the static analyser works on both runtimes, with anchors (labels/loops/events), reachability, and per-label entry/exit shape. It's text-only, in the terminal. What's missing is the thing you actually picked as the first product — **the narrative** — and the substrate for it turns out to be sitting in your own script, ready:

../rbr/controller.as — 40 doc-block sections, all hash=fresh, 17 verified-stale
  lines 1-166    "RBR is a heating control system based on Zigbee relays and
                 thermometers... The script starts by declaring all the variables..."
  lines 167-212  "Basic initialisation. The system can run either with real hardware
                 or with a simulator..."

Forty sections with real prose, and the hashes are current — you maintain the documentation. That's the captions for a narrative already written by you.

[asked which increment to build next, and about versioning tools/]

## 17:20

User answered: build the static narrative first ("I hadn't thought of non-runnable scripts, so let's nail that part down"), and version tools/ by un-ignoring it.

**Assistant**

Note for later: your index already had **13 staged files in `allspeak-py/`** before I touched anything (including new `lowercase.md`/`uppercase.md` docs and `as_core.py`) — not mine, and untouched. My change is `.gitignore` plus the 42 `tools/` files. I won't commit.

Now the narrative. First the analyser needs to hand over the prose — added `doc` and `title` to each section's `--json` report (additive; the self-test still passes).

Then: the Python plugin consumes a section model the host supplies, and emits a narrative; the framework counts; the host shells out to `tools/asdoc-check.py --json`. Same for JS.

**The narrative on your script**

model | script=../rbr/controller.as | lines=2318 | sections=40 | commands=1910 | labels=41 | loops=19 | events=2 | anchors=62
section | index=4 | lines=278-285 | anchors=1 | hash=fresh | verify=verified-stale
prose | Missing credentials signifies a non-recoverable error
anchor | reachable=yes | kind=label | line=280 | name=NoCredentials | pc=225 | depth=0 | entry=jump | exit=exit
route | from=5 | to=6 | via=falls-out
sections: 40 | anchors: 62 | unreachable: 0 | findings: 17 | problems: 0

40 sections captioned by your own prose, 62 anchors placed inside them, 67 cross-section routes, and no unreachable code.

**The non-runnable cases, since you said to nail that down**

| Case | Result |
| --- | --- |
| Documented, doesn't compile — `tools/asdoc-check.as` | 8 sections of prose plus `does not compile: I don't understand 'div' at line 26.` |
| No doc blocks, compiles — the fixture | `loose | anchors=16`, `sections: 0` |
| No doc blocks, doesn't compile — `step13.as` under Python | the reason, marked `incomplete=yes` |
| Compiles with sections — `learn/reader.as` | 8 sections, 12 anchors distributed into them, 8 inter-section routes |

Removing the early return on compile failure was the key change: a script that won't compile still gets its documentation narrated, with a precise reason and `incomplete=yes` marking the missing half.

**How it's wired**

- The analyser stays the single source of truth. The host shells out to `tools/asdoc-check.py --json` and hands the output to the plugin; the plugin interprets it; the framework presents. No doc-block parser is forked into the tool.
- One additive change to `asdoc-check.py`: each section's report now carries `doc` and `title`.
- Findings are now first-class records: `finding | stale-verify` and `finding | unreachable`.

The stale-verification finding is the one to look at on your script: 17 sections where `hash=fresh` but `verify=verified-stale` — the hash was re-run after the code changed, the human sign-off wasn't.

**Two caveats**

- Adoption: only 3 of 149 corpus scripts use real doc blocks (`reader.as`, `asdoc-check.as`, `asdoc-check-cli.as` — 25 sections, matching the sweep). Your RBR controller is the exception; elsewhere the narrative degrades to the anchor list.
- `!!!!…` banner lines are comments, not doc blocks — `step18.as` looked documented to `grep '^!!'` but the analyser correctly says 0 sections.

**Housekeeping**

`tools/` un-ignored and 42 files staged (15 tools + 27 translation caches); `__pycache__` stays ignored. Also staged `viz.as`, `js/plugins/asviz.js`, `allspeak-py/plugins/as_viz.py`. Your 13 pre-existing staged `allspeak-py/` files are untouched — including the three new conformance tests, and `EC-0014-on-failure.as` cross-checks the earlier `or`-clause fix (`FixUp` reports `entry=call | exit=return`).

Runner semantics preserved: exit 1 for a target that doesn't compile, 0 for one that does; ~20 s for 149 targets.

Corpus after the change: 149 targets, 613 anchors, 25 sections, 4 findings, 8 failures; Python conformance still 12 analysed and the same 3 problems.

## 18:40

It's possible I'm not keeping up with this as well as I'd like, so I'm stepping back for a general look at data capture.
I'd like visualisation to be available for any arbitrary range of execution, from a given start to a given end. We can add a new "viz" keyword for this, as "viz {args}" ... Does all this make sense, or are you following a different strategy?

**Assistant**

[confirmed it is the same strategy, with three refinements: the runtime keeps the record and the visualiser only presents it; anchor-only recording would leave the step13 button handler empty (three plain statements, no label or loop), so per-line counts are needed alongside anchor visits; and the window's own opening instruction is excluded, so the start should be able to name a point — plus "until this thread terminates" needs thread identity, which neither runtime tracks yet.]

[asked two questions]

## 18:52

User chose `once` by default, and anchor visits + per-line counts.

**Assistant**

Built the first slice: the `viz` markers and the static pre-flight, so instrumentation can be placed and inspected without running anything.

**The vocabulary**

viz start                     ! open a window here — mode `once` by default
viz start each                ! ... or record every traversal
viz start at Watch            ! open at a label rather than at this instruction
viz stop                      ! close the window here
viz stop at Watch             ! ... or close at a label

One command with args, sub-typed the way `set` and `on` already are. A window with no stop closes when the thread that opened it does, which is the multi-stop-point case. Markers also appear as `kind=viz` anchors, so the narrative shows where a script is instrumented.

**What the pre-flight reports**

window | index=1 | from=line 20 | to=line 22 | mode=once | anchors=2
window | index=2 | from=line 24 | to=line 29 | mode=once | anchors=2
window | index=3 | from=line 37 | at=Watch | to=line 34 | mode=once | anchors=3
finding | window | index=2 | contains the loop at line 25 | revisits mean the recording may grow while it runs
finding | window | index=3 | the start at line 42 is reachable while this window is open | mode is once, so the runtime ignores it until the recording is reset
finding | window | line=44 | no start can reach this stop, so nothing is being closed

**Two bugs worth reporting, and the design correction they forced**

- `reachableAt` returns 'yes'/'no' and I used it as a boolean. `not 'no'` is false, so the "start is unreachable" check silently never fired.
- A window is not a line range. With `at <label>` plus calls and returns, a window can reach code that sits before its stop in the file. Counting anchors as [startPc, endPc) gave `from=line 37 | to=line 34` with `anchors=0`. It now counts anchors in the graph region reachable from the start without passing through the stop.

**Two caveats from doing it on both runtimes**

- JS labels point at the command after them, so a label's pc can coincide with a marker's, making the anchor count inside a window differ by one from Python. Noted in the fixture.
- Thread identity is still the missing piece: statically the end of a no-stop window is estimated as the end of its block, reported as `to=thread-end | estimated-to-line=N`.

**What's next**

The recorder: one branch in each runtime's dispatch loop (the same seam `debugStep` uses), armed by the markers, keeping anchor visits with time and step count plus the per-line counts. Then the trace joins the IR and the sections as a third dataset, and the editor mode has its heat gutter and points.

Staged, nothing committed. Corpus unchanged otherwise: 150 targets, 625 anchors, 8 failures; controller.as still 40 sections / 62 anchors / 17 findings.

## 19:25

This tool is one to be used with care. It's inevitable that the results will sometimes not match the user's expectations, but as with all programming, mistakes can be corrected and tested with a re-run. I don't want to put up too many guardrails; better to let users learn and adapt.
So where are we now? I'm curious to be able to see the data that's collected from a test run.

**Assistant**

Built the recorder, so a run now produces data you can read.

**What a run looks like**

$ python3 tools/asviz-run.py --run tools/trace-run.as
asviz-run: running tools/trace-run.as
4                                        <- the script's own output
model | script=tools/trace-run.as | lines=48 | ... | anchors=9
trace | window=1 | from=line 25 | visits=8 | anchors=3 | steps=24 | span-ms=0.551 | truncated=no
seq | n=1 | steps=1 | line=26 | name=loop@26
seq | n=2 | steps=3 | line=42 | name=Work
hot-anchor | count=4 | share=50.0% | line=26 | name=loop@26
hot-anchor | count=3 | share=37.5% | line=42 | name=Work
hot-line | count=8 | share=33.3% | line=26
windows: 2 | findings: 3

Three views of one recording: the sequence (what happened, in order, with step counts), the hot anchors (where the visits are), and the per-line heat (where the instructions are). The per-line channel earns its place at once: window 3 is an `until thread` window over three label-free statements, so it records visits=0 at anchor level and still shows hot-line for both lines — exactly the gap the counts were added for.

The runtime hook is two lines in Program.flush, next to debugStep: one attribute test per dispatch, and nothing when no recorder is attached.

**Two design details**

- `until thread` works at run time, tested on a real thread (a fork). Its rule: close when execution is outside the block the window opened in and the call stack is back to its arming depth. That covers a return, falling off the block, and an inner gosub, with no thread bookkeeping.
- A window that never hits a viz stop is still reported at exit, from the recorder's current slot — otherwise the flag case would collect data and show none of it.

**The prediction learned some humility**

Three attempts at predicting which stop closes a window, each defeated by the permissive return model; the last produced a window whose predicted end sat above its own start. It now predicts only from the window's own flow (not following returns), and when the only stops in reach are past a call or in another thread it says so and leaves it to the run:

finding | window | index=3 | the only stops in reach are past a call or in another thread (line 40) | whether one closes this window is a runtime question

**Outstanding**

- The JS side has the static window analysis but no recorder: the runtime hook there is one branch in Run.js, plus a JS Recorder and ./build-allspeak.
- A program that never exits (the RBR server) still needs a report trigger — viz report, or a keypress in the editor.

Everything staged, nothing committed. Corpus: 151 targets, 640 anchors, 8 failures; controller.as unchanged at 40 sections / 17 findings; conformance problems still the same three.
