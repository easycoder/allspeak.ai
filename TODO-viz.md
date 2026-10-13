# The visualiser and the editor

**What this file is.** The outstanding work on the visualiser and the editor, and nothing else: decisions
that constrain it, items waiting to be built, items owed, and the plan for the rest of the split. **The
history is not here** — what was built, when, and why it is the way it is lives in `conversation/` and in
`git log -p -- TODO-viz.md`, and a handover that repeats it stops being readable.

**Read `TODO.md` first**: it says which of the three handover files to open. Standing traps are in
`AGENTS.md`, and they are read before editing anything.

## The governing principle, and it overrides anything below that conflicts with it

**Make complex things simple.** A fully-integrated solution with a concise feature set and a minimal learning curve, for an audience that includes people who will only stay aboard while each learning step is small. Three rules follow, and future work is checked against them:

1. **No new commands to see the picture.** The view is simply there for a script you have run. The two marker words a user has already learned — `viz start` and `viz stop` — are enough for every review; `on`, `once`, `every`, `until` and `limit` are refinements, not a curriculum. `viz` is a no-op without a recorder, so a script carrying markers runs like any other.
2. **Nothing in the onboarding depends on this.** The Primer's first steps carry no markers at all.
3. **Perfetto is not the product.** It is a development instrument and an optional escape hatch; users are never asked to learn it. Its UI is also English-only and has no notion of the script's own language, whereas our records already carry the user's own names and prose.

**The visualiser speaks the script's language for free.** The language packs already carry a `diagnostics` section of user-facing strings, so the view's own labels belong there rather than in a translation layer of our own. Anchor names and doc-block prose arrive in the author's language already, because they *are* the author's text. The editor passes the three localised flow words to the pane; the provisional fr/it/de words for `wheel`, `amount`, `shift`, `control` and `svgimage` are still awaiting Graham's eye, as is the `reverseWord` line in the svg plugin's `getHandler`.

---
## Settled decisions — [note]: checked against before adding anything

Each of these was decided by Graham and is not to be re-opened without him.

- **The page warns; it does not restart the server** (decided 2026-10-12). What the dialog used to do: `confirm("viz has been updated. Restart to apply changes?")`, then `GET /restart`, and the route re-ran the server with `system background` and exited. **The restart worked and left a server the reader could not stop** — a detached process, not in the terminal's foreground group, so the Ctrl+C that follows reaches nothing; that was the third of Graham's three symptoms on 2026-10-12 (the other two were the false nag and a lost HTTP response, both fixed). **Graham's call: take the restart out** — *"given that this is an infrequent operation to perform"* — so the dialog is an `alert` naming the reader's own two steps (stop the server, start it again, reload the page) and `/restart` is gone. The alternative that was on the table is recorded so it is not re-derived: an in-process `exec`-style keyword would have kept the feature *and* the terminal — same pid, still the foreground job, Ctrl+C working — at the cost of one dev-environment keyword in both runtimes, the four packs, a spec note and a check, for something that happens once per deploy per project. Not worth it.
- **The dev server's page has no check.** On 2026-10-04 the Graph pane came up empty for Graham on a dev server, with a clean console and no effect from resizing: `server.allspeak` filled `lang` and `#editor-home` in the page and **nothing filled `#editor-graph`/`#editor-side`**, so the editor fell through to a cross-origin fetch of a `.allspeak` file, which the browser refuses (the site sends `access-control-allow-origin` for `.js`, `.css` and `.json`, not `.allspeak`) — and the refusal is swallowed by design. Fixed by having the server fetch both modules and write them into those elements (before: 11,580-byte page with no pane; after: 179,056 with both). **What is missing is a check that the page a dev server serves carries the two modules**, since every other symptom of this failure is invisible: `tools/encoding-check.js` is the model — it starts the runtime and inspects what it serves.
- **One view, and lines from the start.** Every line is a row; at low zoom they are sub-pixel and read as one compressed band per block, with the block label above it.
- **The bar is not a shape device — it is the heat channel.** The marks are shaded by how busy a line is, and the shape of the flow is a separate channel.
- **The hover rule.** At low zoom, show the current marker and any doc prose — not the line's command, which is meaningless at that size. Line text belongs there only once zoom makes it legible.
- **Colour: the run warming up, not a legend.** Each mark's colour is its line's *running* count against the busiest line in the recording, and is dialled back by how early in the run the mark is, so every line starts cold and a hot line sweeps the ramp as the run proceeds. The four colours are blue, violet, magenta, red. **The heat key had to go** with this: a colour meaning "how hot, by when" cannot be labelled with a range of visit counts. The flow key stays, on the status line's row.
- **The heat is *executions*, not time** — and the recording carries time too, so colouring by `dur` instead of by count is available whenever it is wanted.
- **Transfers: recorded, not inferred.** The flow lines come from the run (`cat: "transfer"`), so each lands at its own moment. The compiler's own jumps are recorded too, but as `branch` and drawn only when asked for, because `if`/`while`/`wait` scaffolding is not a program jump.
- **The gestures, from Kdenlive and Audacity:** wheel alone scrolls up and down, **shift-wheel zooms the lines**, **control-wheel the steps**, both together both, and drag does the panning. The axis-selective zoom the first prototype used is dropped: a zoom takes both axes, and pan covers the rest. Axis selection uses keys rather than modifiers where it cannot use them at all.
- **The trace is the contract.** A recording is a file, so a script the JS runtime cannot run is recorded by Python and drawn by the same picture. `viz.allspeak` itself uses no containers and runs on both.
- **The Graph pane is a companion module**, `viz-graph.allspeak`, fetched and compiled on the first click on Graph — with `viz-side.allspeak` beside it. Each attaches to its **own element** (`se-graph-host` for the picture, `se-graph-side` for the panel, `se-graph-area` as the flex row), so neither module lays the other out.
- **The editor owns the doc-block look-up.** Which block holds a line is a question about the script's structure and Blocks mode already answers it, so the sidebar displays and the editor decides. A line in no block is an answer, not a failure.
- **The pane cannot measure its own canvas.** `svg` is the one element type the plugin registers without the `dom` extra, so the sidebar could not have been an element inside the pane's own box — an arithmetic fit with the sidebar's width baked into it would sit between the panel and every drawn coordinate.
- **Nothing in the picture is a DOM element.** Each kind of mark is one merged path (`ec-VizFlowCall-0` carries four arrows in a single `d`), so a click or a hover is arithmetic against the view's own geometry, exactly as the scrollbar handles' hit test is. **This is the constraint the tooltip shares with the mark selection.**
- **Draft 2 of the trace format is spec-first work.** The format is the contract the sidebar, the pane and both recorders all read, so a format change begins with the spec and stays in step with `tools/check-trace.py`.
- **Working from a trace file** is agreed: the view needs nothing new from the runtime.
- **A sidebar tab brings the reading to the reader; it never sends them hunting** (Graham's own discovery, 2026-10-13, after using the `Code` tab: *"That's a most effective addition, that brings the code to the reader instead of the latter having to hunt for it. It's a genuine discovery for me."*). The picture names a line and the panel shows what that line *is* — its prose, its code — so a reviewer reading a run never leaves the pane for the text. **This is the rule a new tab is measured against**, and it is *why* the trigger carries only the line and a tab is a name in `SideTabName` plus a branch in `SideRender`: what the line means is the panel's business, not the trigger's. **It has one consequence that is open** — a line *not* inside a doc block answers the `Code` tab with a sentence rather than the code the pointer is on, which is the one case where the reader is still sent hunting. See the question at the foot of "The intent on hover".
## Open work, in the order it was chosen — [mine, queued]

### First: the traffic lights — decided, designed, not built (2026-10-03)



- A per-tab flag array, grown in `TabGrow` like `TabPath` and `TabSaved`.
- **Has a recording**: set where the run is fetched (`FetchRunText` — success 1, the `or go` failure 0), and after the editor's own Record. *"As of the last look"* is the honest reading and the doc block should say so.
- **Names an app**: `AppPage` is already set by `ParseSource`, so a per-tab flag is one line beside it.
- **Asks to be recorded**: this needs the *model* to say so, because `record this run` is a command rather than an attribute and the model reports attributes and counts only. Cheapest honest form is one summary record (`uses | record-this-run=yes | markers=2`) rather than one per command, which would be verbose for every reader.
- **Painting**: `Record`/`Graph` tinted when the tab has a recording, `Launch` when it names an app, a quiet mark when it asks to be recorded — one `PaintLights` called from tab switch, parse and record, so no caller has to remember. **The colours are Graham's to choose**; the states are few and they are what matters.


### Then: the sidebar's remaining pieces


- **The time at a mark.** The anchor event already carries `dur`, so it is one more property on the message the pane already sends, and it belongs in the same status bar that carries `line N   visit V of T`.
- **A marker highlight in the picture**, so the panel's selection is visible there too. It costs a new path, and the harness's "exactly eight paths" structural check moves with it.
- **A second path into the panel** — selecting a block directly rather than only through a mark.
- **A way to close it.** The 6-px grip is where it belongs: a drag to the floor, or a double-click, rather than a third control.
- **One decision waiting for the second tab.** The mark click fills the tab it belongs to. The moment there *are* others, a click while another tab is up would change nothing visible — indistinguishable from a bug. So: does a mark click bring the Docs tab forward (the click is always "tell me about this line"), or leave the tab where the reader put it? Decide it **with** the second tab, not after it.
- **A debug tab** — item 5 below.

### Then: rollover tooltips (item 3)





### Then: a run started from the editor (item 4)




- **A Python-variant script is out of reach of the editor's Record by construction** — the editor records with the JS runtime, so a script using `dictionary` is refused. Its route is a project's Python server recording it (route 2 below), which is unbuilt.
- **An app is not a script.** `parser.html` fetches its script and runs it into *that* page; in the editor's page there is no such page, so it stops at once. Recording a launched app means arming the recorder **before the app's own `viz start` line runs** — attach one after startup and the window has already passed.


### Then: annotations, capturing values into the recording (item 5)




### The legacy names, still to be dropped — the second half of "additive first" (2026-10-12)


### The debugger runner — briefed, not started (2026-10-07)


### The redaction — done, with two things still to weigh






### Launching the project's app — built; the capture half open



### The three routes for capturing a run, unchanged

   script and writes its recording; `GET /record/<script>` on the dev server calls it with the script's output
   redirected to `<script>-stdout.txt` and the trace written to `<script>.viz.json`, and answers with the verdict
   and the output file's name; and the editor's **Record** asks that route when the tab's script is for Python,
   instead of refusing it. Verified live (`41 visits in 1 window` from `examples/chemical/parser.allspeak`) and
   asserted in `viz-modes-check`. **Corrected 2026-10-05, and the correction is the interesting part**: the first version
   resolved the flavour from the model's *attribute* records, which exist only for a program the runtime
   compiled — so the marker was invisible for a script the JavaScript runtime cannot compile, which is every
   script that needs one. The model now reports `flavour | py | from=script` from the **token stream**, and the
   editor reads that. Found from Graham's own status line; the check had passed because its fixture was a script
   the JS runtime *can* compile. **What is still owed**: the *dev server* filling `#editor-runtime` has no check
   of its own — the harness now sets the element, so the plugin's read of it is exercised, but that a served page
   carries it at all is the same owed check as the one above. The guard bounds a recorded
   run (2 s work / 20 s wall) where a console run is unbounded, which is Graham's call to change.

   Was: **half built, 2026-10-05.** The command it needs now exists: `record the script [in <path>] [as <source>] giving <variable> [reporting <verdict>]` runs a script under a recorder *inside the Python runtime* and hands the recording back, so a route can call it and write the trace, and `@py` is how the script says it is the Python runtime's (below). What is still unbuilt is the route in `server.allspeak`, and it needs the plugin beside the server (`use plugin Viz from ./as_viz.py`, so `as_viz.py` travels in the packs — which no pack carries yet). **And the marker has made the caveat concrete rather than theoretical:** a route that runs *the script in the active tab* can only do so if the tab is a `@py` script, and today every script without a marker is a JavaScript one — so a route like this records `@py` scripts and refuses the rest in a sentence, which is the honest half of the feature.

### The Python flavour's two remaining shapes, and one bug found with them (2026-10-05)
## Smaller items, in any order — [mine, queued], unless marked

- **The document is as wide as the longest line of the *file*, which may now be one of the blanked ones.** `VizGlyphMax` is measured over every line, prose included, so an invisible `!!` paragraph of four hundred characters still sets `VizGlyphWidth`. Nothing shows it — the pane clips at the frame and the glyph metrics are fixed by font size and row height — so the extra width is slack the browser never paints. One line in `VizSourceMeasure`'s measure loop if the width should mean "the widest row that is drawn".
- **A horizontal notch rebuilds the `href` for nothing.** `VizSourcePicture` re-`cat`s the whole encoded body on every draw; a guard that reassigns the `href` only when the source or `VizViewY0`/`VizViewYH` moved removes it. Not done because the standing call is to leave optimisation until the functionality is finished.
- **Tabs.** A tab in the source is one character in the document and SVG's whitespace rules turn it into a single space, so a tab-indented file would lose its column alignment. `.allspeak` files are space-indented; `as_condition.py`, which is what the redacted picture is of, is not.
- **The cost of a live pan** — the drag redraws on every drag event, so the picture follows the pointer at a few frames a second on a big recording. Graham's call (2026-09-30): leave it until the functionality is finished. The fix, if it reads badly then, is to translate the five path attributes with an SVG `transform` during the drag and redraw once on release.
- **`tools/guard-check.js`'s JS 1 ms work-budget check is flaky** — on 2026-10-04 it reported `stopped=null, null visit(s) recorded` on one run and passed on the next two. One millisecond is inside the recorder's own bookkeeping, so the check reads a value mid-flight more often than it should; a budget of a few milliseconds, or a retry, would settle it.
- **`viz start`/`viz stop` as the whole recording lifecycle — Graham's shape, 2026-10-04, not built.** `start` arms and opens the window; `stop` closes it, *flushes the trace file*, and leaves the app armed for the next run; a second `start` restarts the capture; a `start` with no `stop` loses that window only. It takes the editor out of the loop entirely, which is where tonight's three faults lived. **Settled later the same evening, and it is three seams:** Record *creates* the empty trace file (and does not open the app — which is also what would light the traffic lights); `viz start` starts a collection (arm if unarmed, begin a segment); `viz stop` ends the segment, **flushes it into the file**, and closes it — so the file accumulates any number of segments contiguously as one recording, and a flush has to merge (read, add, write back). No new vocabulary, so no pack changes. **Built 2026-10-04 (`23a9b30`), and the check for it is `tools/flush-check.js`.** `@viz start` arms (and flushes nothing), `@viz stop` ends its segment and writes it into the file named by `save the recording to <path>`, the window index continues across segments, and a program a host has already armed is left alone. `save` no longer ends the recording or unarms. On the way, a real bug: **`@viz stop` had never closed its window** — the handler sat below the recorder's early return for a command that is not an anchor, and a marker line never is one.

- **The editor's Record does not create the trace file.** Graham's shape has it doing that so the tab can see a recording is intended; the script's own `save the recording to <path>` creates it today, which covers the app case. Needs a decision on whether Record also POSTs an empty document.
- **The reference chapter on recording a run** — `learn/*/reference/` still has none, and the vocabulary has now changed shape twice.
- **The framework's report line lies under `--no-recorder`**: `viz.allspeak` prints `windows recorded: 0` for a script that armed itself, because it counts the *host's* recorder.
- **`tools/capture-check.js` is published and needs this repo's sources, without saying so.** It spawns `tools/asviz-run.js`, which a pack does not carry, so from a pack it fails with a missing-file stack trace rather than the sentence `tools/flush-check.js` now prints (added when `flush-check.js` was published, 2026-10-04). The same fix, one tool over.
- **`flush-check.js` is published but not named in any pack's `AGENTS.md`**, so a project's agent will not know it exists. The four checks the packs name are unchanged.
- **The read-merge-write is proven against a stubbed page, not a real one.** `tools/flush-check.js` drives the plugin with an in-memory `/read/` and `/write/`; a real browser run is the remaining evidence, and it is the one Graham can give.
- **The editor's app-arming path (`watchApp`, the injection, the carry) is now redundant for a self-recording app** — it stays for `record the script …`, and nothing has been removed. Deciding whether to retire it wants the browser run above first.
- Written up in `various/record-and-launch.md`.
- **The arming across the window boundary is still unasserted, and it had two defects until 2026-10-04.** `viz-modes-check` asserts the *branch* (an app buffer opens the page and writes nothing) and says so in its own output; the arming itself needs two live windows and the harness has one. Graham's first run of it found both: the plugin was injected on every poll tick (`asviz.js` declares its namespace as a top-level `const`, and a classic script's `const` is not a property of `window`, so the editor's `win.AllSpeak_Viz` guard never passed) and the arming line would have failed next for the same reason. Both fixed; **a fake second window in the harness is what would hold them**.
- **The status line keeps a pane's report after the pane is gone.** Leaving the Graph pane for Edit leaves `I don't understand 'dictionary' at line 46.` sitting beside the toolbar buttons, which reads as a live fault. It has three writers (a transient action, the auto-save, and the pane when it fetches a run) — assert the value it is built from, and clear it when the pane that set it is closed.
- **The ramp's bottom end — closed by his call of 2026-10-06, kept only so the reasoning is not re-derived.** With a band size of 1 a once-visited line lands in band 1, so a quiet run shows amber for its least-worked lines; the change would be `take 1 from VizCount` before the division, and it moves every boundary. He reads it as noise rather than as a fault, and the legend makes either choice legible. **Do not re-open it without a reason from a screenshot.**
- **The two copies of `viz.allspeak`** — hygiene, not a bug: nothing he runs reads the second one. The options are in `DIFF.md`; the recommendation is to have `deploy-sync` refresh `deploy/code/` from the root, so the local published copy cannot be stale *and* so `BUILD.md`'s claim that the `cp` step is enough becomes true.
- **The size of a mark** — settled in code at 14 units, one line if he wants it tuned. It does not shrink as the window narrows, which is deliberate: a mark has to stay legible to be a mark.
- **`deploy/code/viz-graph.allspeak` is behind the root copy** — the same hygiene item.
- **Four `verify-stale` sign-offs**, his by convention: the editor's declarations, its handler block, the Graph host's section, and the view's own. Until he clears them the analyser reports four warnings.
- **The source picture wants a browser, and this is the one thing a check cannot say:** that a browser renders an `<image>` whose `href` is an SVG data URL at all (plain `href`, SVG 2 — `xlink:href` is the fallback), that `xml:space="preserve"` keeps the indentation, and that the monospace advance is close enough to the eight units a column is assumed to be. Decoding the URL and checking the document is well formed is as far as a headless check reaches.
- **The gestures are one section of about 490 lines** — the wheel, the pan, the bars, the redraw plumbing and the window's limits. Their inline comments carry the detail; they would read better as five.
- **The pane is JS-only.** The Python runtime has no visualiser, and nothing here changes that. It is by design, not a backlog.
## Numbers to re-measure rather than carry — [note]

- **What a draw costs, which is the number that decides the pane's weight.** Measured on Graham's console, on a **24 KB recording**: 279, 131, 118, 125 ms — call it **120–280 ms per draw**, agreeing with the module's learned 4 ms/KB plus a fixed part. It scales with the recording, so a megabyte is seconds per gesture. **Measure the curve on a real recording before optimising anything** — and the standing rule is not to optimise before the functionality is finished.
- **The editor's load time is creeping.** Compile cost looks linear in the script: ~1.04 s in node for 3,102 lines / 9,361 tokens, up 35 ms for the flow key. If it wants addressing, the shape is deferred loads — the editor split so a pane's section is compiled when it is fetched.

---
## Owed — [mine, queued]

- **The line-name overlay is deleted (2026-10-13).** 58 code lines with the routine, and 120 lines all told with
  its `<image>`, its creation, six declarations, its comment and its call; its four appendix entries went with
  the numbering rebuilt, and `plotview-check`'s one claim about it and the four helpers only it used. What
  stayed is `VizLabelCheck`/`VizLabelShape` — the two halves of the check the *rules* use to find their right
  end — which is worth stating because the first attempt cut `VizLabelShape` on the strength of its name.
- **One block's appendix entries are out of order, and it was like that before this pass.** `viz-graph.allspeak`'s
  last block (the filter and the clip bar) holds 30 entries numbered 1..30 with no repeat and no gap, but not in
  ascending order in the file. It costs a reader following the numbers nothing, and `asdoc-check` is content
  (0 errors), so it is written here rather than churned: fixing it means renumbering the block and moving every
  marker that names one, with the same check the overlay's removal used.

- **The sidebar's bar has no check.** It now shows only the `@show` values, and nothing asserts that its values
  survive the move or that an empty bar is left when a mark asked to watch nothing. `plotview-check` covers the
  pane's new line; the sidebar has no harness of its own.
- **The pane's mark line is English-only** (`line ...   visit ... of ...`), as the sidebar's wording was before it
  moved — the editor's string table has the flow words but not these. It moved the gap rather than widening it.

- **The menu's freeze has no headless check, and it is the one thing this pass left owed.** Its row sends a
  message *to the pane*, and a message to the pane is what lets the `VizBusyNotice` tick fire inside a second and
  kill the run (see "A fault left for you") — so the freeze's crossing, the `Freeze`/`Cancel` row and the lift the
  pane makes are measured in a browser instead: `various/menu-measure.js`, 17 checks, all green, no page errors.
  Everything the editor owns about the menu *is* asserted by `viz-modes-check` (8 claims). **These claims come
  home when the tick is moved out of the drawing**, and they are the first thing to move.

- **What is left to split — the survey corrected, and Graham's decisions taken (2026-10-13).** *The first survey
  of this was wrong and is replaced here*: it summed each cluster's **label span**, and a span runs to the next
  label, so it swallowed doc prose and, worse, code that belongs to nobody — in the header region it gave
  `VizRemember` 484 lines and the overlay 484 too. What follows is the **code** count, statements and comments,
  with prose and blank lines out. The lesson is the repository's own: measure the value, not the span.
  - **the element build — 362 code lines, `VizBuildElements`, one label** (the most reliable reading in the
    list, because the label's body is the whole cluster). Graham: *"a module that's only called once but
    removes 383 lines is well worthwhile"* — **do it.** One design point to settle first: `plotview-check`
    reads the elements the build makes (`ec-VizPane`, `ec-VizGlyphs`, the bars), so a build that moves out of
    the pane leaves the harness holding nothing. The frame module has to be something the harness can run, or
    the harness's picture claims go with it.
  - **the window and its gestures — 525 code lines over 12 labels.** The plan's item (3) and the biggest
    remaining win; hard because of its *rate* (the gestures mutate the window while the picture draws from it,
    so a module would be asked per pointer event — the one thing the module pattern refuses). The seam to look
    for is the arithmetic: the fit, the clamp, the step↔x mapping.
  - **the two drawing layers** (`VizSourceMeasure` 82 code lines; the marks, rules and flow 75): the plan's
    verdict stands — *last, or not at all*, because a split there risks a second copy of the mapping, this
    file's most expensive known fault.
  - **the freeze — 16 code lines** (`VizFreeze`, `VizFreezeTell`): Graham's condition was "if it's
    self-contained", and it is not: the frozen flag is read by the pane's own pointer handler, so the part a
    module could own is the two messages, not the guard. Not worth its wiring.
  - **`VizRemember` — 7 code lines**, a calibration write. It is not a cluster at all: the 484 lines the first
    survey attributed to it were the header region's, prose and declarations. **Nothing to split.**
  - **the bars — 45 code lines** (`VizBars`, `VizBarFit`), whose handles are drags, so they belong with the
    window rather than in a module of their own.
  **And Graham's principle, recorded because it governs the queue**: modules should be as readable as
  possible, and *more* of them is a help rather than a handicap when it comes to understanding — the same
  principle he applied when allocating EasyCoder's original functionality.
- **The clip's kept set is a module now — stage one of two (2026-10-13).** `viz-clip.allspeak` holds the kept
  ranges, the history behind them and the arithmetic of a cut, and the pane is **untouched**: nothing is wired
  yet, so nothing can regress, and the module is not in the build. What *is* proved: the move is mechanical and
  checked (the body, renamed back, differs from the pane's own lines only at the interface — printed and read),
  it compiles (**208 commands / 41 symbols**) and `asdoc-check` is clean at **0 errors, 0 warnings** — the
  copied appendix entries were renamed to the module's own names, and the entry that said "it bumps the tag"
  now says the tag is bumped by the pane.
- **What stage two has to do, in order.** (1) **The behavioural check** — written 2026-10-13 and living in
  **`various/clip-check.js`** while it is unfinished (6 of 8 checks pass): it compiles the module in node, sends
  it `{what:'cut', tail, from, to, run, cap}` and reads `ClipOut`. **It has already earned its place**, having
  found three real things: the module was never given `ClipKeepCap` (so every cut kept nothing), a json holder
  crosses a property as one of its slots rather than as the set (so the reply now carries one text in the
  history's form), and — **live in the pane as well** — keeping the *outside* of a window beyond a range
  *widened* that range (`10-29` for a 10-20 range against a 30-40 window), which is fixed in both copies.
  **What is left there is `undo`: it restores nothing.** That file is the
  instrument the rest needs, and it is the honest home for the claim `plotview-check` makes today from the
  pane's side ("a cut is taken from what is on screen", which is the *filter*'s half). (2) **Wire it**, exactly
  as the alert module is wired: a fourth payload in `viz.html` and `server.allspeak`, `build-allspeak`'s
  `names`, the editor's `LoadClipModule` (forked, as the notice is) and a relay branch on the reply's `what`
  (`kept`), since a module may only send to `parent`, `sender` or one it declares. (3) **Then remove the pane's
  copy**: `VizCut`…`VizUndo` and their state, its `VizClip`/`VizUnclip` become senders, the reply fills the
  pane's own arrays and `VizKeepWhole`, the pane bumps its tag and writes its notice. (4) **The pane's block
  renumbers**: the entries the cut carried leave with it, and every marker in that block has to move — do it
  with a check that every marker names an entry which exists, the same check `structure-clip.py` used.
  no recording — any script without a `<script>.viz.json` beside it, which is most of them — now draws the
  script plain: the frame, the text, the redaction bars, no arrivals. Verified in the browser, which is the only
  place it can be seen (a screenshot, 15:2x): lines 1–40, the step axis `0…1`, no runtime error, no page error.
  The three faults, in the order they were found — each one *hidden* by the one before it:
  1. **the clip's filter** read the parsed document, which is deliberately unset when there was nothing to
     parse: `Undefined value`, the console error Graham reported;
  2. **the redaction bars** (`VizRedactBuild`, *not* the scrollbars — that is what I first wrote and the
     measurement corrected) walked an extent the frame pass had never set, which is what the failure moved to
     once (1) was guarded — and it throws out of a handler rather than reporting, so it is the worse fault;
  3. **the frame pass was never run for the empty picture**, because "has anything changed?" compared
     `VizTrace`/`VizSource` against *unset* values and two unset values compare equal — the unset-comparison
     trap Graham has hit before. Fixed by naming the condition instead of inferring it: both absent is a draw
     that stops (`if VizTrace is empty and VizSource is empty return`).
  **And the pane was never sent the script** — the real last mile: the editor's `FetchRunText` read the
  *recording* first with `or go …`, so a missing `.viz.json` took the script's own read with it (the `rest get`
  trap in AGENTS.md). `on failure` is the clause that continues, so either read can now come up empty alone.
  the run *before* applying its four-step floor, so the pull-back that keeps the right edge at the run's end
  set the left edge to `maxSteps - 4` — **any run shorter than four steps** got an axis starting before the
  recording (the empty picture read `-3 … 0`). Order swapped: floor first, then the run's own width.
  waited for the pane to hold *any* events, which the pane satisfies with the *previous* tab's — the very fault
  the checks below it exist to catch. It now waits for the recording to have been asked for.

  the measurement and the decision (2026-10-13, `dec-274a640ffe0aff5a`). `various/menu-measure.js` walks the
  natural route again, which is itself the browser evidence that the sideways jump is gone.

- **The menu's rows have no rollover.** The sidebar's tabs, the bar's buttons and the pane's three clip controls
  all say what they are before they are pressed; the menu's rows are the one control in the editor that do not.
  It is the same `on hover` work as the sidebar's own rollover, on a third surface, and neither is built.

- **Half the corner readout is code the pane's harness never runs.** `VizBusyNotice` is called from `Draw`, which
  `plotview-check` runs, so the notice is checked there; `VizBusyDone` is called from `VizDrawRun` in the module's
  *host* half, above the harness's `viewStart` cut, and only `viz-check` (which runs the module whole) compiles
  it. What "drew in X.Y s" says is therefore unasserted — the whole-and-tenth assembly is the part worth a check,
  since the language has no fractions and the obvious `DrawMillis / 1000` gives `0 s` for a 700ms drawing.
- **The alert panel's pane half has no headless check.** The editor's half is asserted by `viz-modes-check` (the three elements, the panel hidden, `ShowAlert` showing the message, `HideAlert` putting it away), but the pane's half — the armed ticker, the one-second delay before the panel goes up, the sentence `VizAlertSay` composes and the four-second finish — lives in the module's *plumbing*, which `plotview-check` cuts away, and `viz-modes-check` cannot reach because it dies on `VizBusy` first (see below). It was measured **in a browser** instead (a headless chromium against the dev server, polling the panel: `Working - about 58 seconds - 7 s so far …` → `drew in 4.6 s.` → gone), which is a measurement rather than a check. A headless harness for the pane's host half would close it — and would also close the item below, since the same cut is what hides `VizBusyDone`.

## `viz-graph.allspeak`'s comments, and its seams — investigated 2026-10-13

**Graham's ask.** The pane is 4,330 lines and *approaching half of it is comments* — many of them essays in the code rather than in the doc blocks — so the code is hard to see, though the notes are what an AI maintainer needs. His proposal: move them into the blocks as an **appendix of numbered paragraphs**, leaving a `§N` marker (inline where it belongs to a statement) in the code; then, with the file readable, find the self-contained parts worth splitting out as modules.

**The census, measured** (`various/` scratch script, 2026-10-13). 4,330 lines: 109 blank, 195 `!!` doc prose, **1,776 `!` comment lines (41% of the file; 47% of non-blank lines)**, 2,250 code — of which **349 are declarations**. **All 1,776 comment lines already sit inside one of the 26 doc blocks** — nothing is orphaned, so every comment has a home to move to. They come in **307 runs**: 31 single-line, 1,745 lines in runs of two or more, **973 in runs of eight or more**. They are 148,092 characters, with 117 bare `!` paragraph separators. 24 are `! ---- … ----` signposts; two blocks are already pure prose with no code (the migration is half done).

**Three classes, and only one of them should move.** (1) **Signposts** (`! ---- the scrollbars ----`, 24 of them) are navigation and stay. (2) **Local remarks** (1–4 lines, ~150 lines in total) are what the coding guidelines ask for — a statement's own note, read where it is written. (3) **Essays** (the 74 runs of ≥8 lines, 973 lines) are design reasoning, measurements and traps: these are what flood the code, and these are what move. That is the split to make, and it is one Graham should confirm, because "how long is too long" is a judgement.

**The mechanics, and each one was measured rather than assumed.** The appendix must sit in the **prose region** (after the synopsis, before the code): the analyser errors with `doc-after-code` if prose follows code and with `meta-not-in-tail` if anything follows `@hash`. Prose is **one paragraph per line**, so the 100-column wrapping has to be re-flowed — and *that re-flow is where the file actually shrinks*: at ~170 characters a line the 1,776 comment lines become ~871 long lines, taking the file from 4,330 to about **3,400 lines**. `code_hash` includes `!` comments, so removing them changes every touched block's hash: `asdoc-check --write` fixes the hashes and **every `@verified` in the file goes `verify-stale`** — correct behaviour, and it means the sign-offs reset and want re-reading (his one-click *Mark verified* is the tool). **And there is a bonus nobody has claimed yet**: prose is *checked* prose — moving 148k characters into blocks puts them under `doc-name-undefined`, which is the check for a name a deletion left behind.

**The checks that make it safe, demonstrated on one block.** The whole transform was run on the `VizDotSize` block in a scratch copy: 20 lines → 15, `asdoc-check` 0 errors with only the expected hash/verify churn, **`viz-check` still `commands=2256 symbols=432`**, and a strip-the-comments diff of the two files is **identical at 2,250 code lines**. So the plan's acceptance test is mechanical: *code identical, counts identical, only prose moved*.

**What the reader loses, stated plainly.** The flat editor becomes code plus `§N` markers, so the *why* is read in Blocks mode — where the appendix is not away from the code but **in the pane beside it** (`se-blocks-split`: code at 60% on the left, the doc pane in Georgia on the right). The sidebar's `Code` tab strips `!` lines, so it shows exactly the code with no markers at all. And a big block's appendix is long (the gestures' block would gain ~335 lines of prose): the doc pane scrolls, and that is the trade.

**The seams, measured.** The candidate clusters, by lines (code + comments): **alert / prediction / calibration 292**; **window + clip + gestures 1,385**; **source layer — glyphs, em measurement, redaction, labels — 460**; **marks layer — marks, heat, rules, flow, key — 345**; **the picture + geometry + mappings 1,461** (what stays). And the coupling is *not* the call graph: cross-boundary `gosub` edges are few (picture↔window 8 each way, picture→alert 7, marks→window 4), while the state — forty-odd variables, the window, the kept set, the drawing elements — is shared by everything. **So a split is a decision about who owns state, not about where the calls go**, and the clusters that own the least shared state split best.

**The order I would take, and why.** (1) **The alert / prediction / calibration cluster** — it owns its own state (the estimate, the ticker, the calibration file), needs only "a drawing of this size started, and took this long" from the picture, already writes into a page element the editor shares (`se-alert`), and **takes the `VizBusy` fault class with it** if the corner readout becomes part of the draw: that fault is "a message read *while* a long job runs written into the drawing the job is building", and its own module writing into its own panel is the fix the `AGENTS.md` trap already prescribes — which would also give `viz-modes-check` its tail (and its 22 checks) back. (2) **The clip's kept set** as a data module: it owns the kept records and the history, and tells the picture what to draw on every change — one message per cut, which is the sidebar's own shape. (3) **The window and its gestures** (the biggest win at 1,385 lines, and the most entangled: the gestures mutate the window while the picture draws it). (4) **The two layers last, or not at all** — the source and the marks draw into the same frame and share the em measurement and the letterbox, so a split there ships the geometry per draw and risks *a second copy of the mapping*, which is this file's most expensive known fault.

**If the comments move and (1) and (3) happen, the arithmetic is**: 4,330 → ~3,400 (appendix) → ~3,100 (alert) → ~1,700 (window+clip) → with the layers split as well, four modules of 250–1,500 lines each. That is the shape to choose from.

**Two standing faults this pass ran into, both pre-existing and neither introduced by the clip — reported, not fixed.**

- **A later `window` record overwrites `VizMaxSteps`.** Pass one does `put property `steps` of VizArgs into VizMaxSteps` for every `window` record, so on a recording that opens more than one window the extent collapses to the *last* window's step count (anchors can only raise it, and they have already been seen). Measured: the JS recording of `tools/trace-run.allspeak` has three windows and fits to `steps -1-2`, where the Python host's single-window recording of the same script is the well-behaved 24-step one the harness's expectations are tuned to. `VizMaxSteps` should be a maximum, not an assignment — a one-line fix, but it changes the unclipped picture for any multi-window trace, so it wants its own measurement.
- **`steps` is per window, not per recording.** So a clip range is approximate on a multi-window recording: the steps of one window land on top of another's. That is the pane's existing step model rather than anything the clip introduced, but a clip magnifies it, and it is the reason the harness is run on the *Python* recording.

## Rescued from the narratives — still live

- **The `---→ ←---` control was never driven by the harness, and that is why the clip's split does not yet remove `VizClip` from the pane.** The pane cuts correctly for it (`ClipCut` with `ClipKeepTail` 2 rewrites the list to the outside of the window), but no headless check presses it; `various/menu-measure.js` drives the pane in a browser and says so. When the clip's stage two lands, its check has to cover this control and the two beside it.
- **The pane's calibration route is dead in the harness.** `tools/plotview-check.js` has no `rest` stub, so the write `VizRemain` makes cannot happen there and the prediction it feeds is never exercised headlessly; in a browser it only runs when the pane draws a real recording twice.
