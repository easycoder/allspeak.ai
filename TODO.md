# AllSpeak — TODO

**This file is the handover and the index.** It says what is done, what is next and in what order, and what is waiting on a decision. A new session reads this first.

**The detail is in three workstream files**, and only the one you need is worth opening:

| File | What is in it |
|---|---|
| [`TODO-viz.md`](TODO-viz.md) | The visualiser and the editor — the governing principle, the settled decisions, the open work in its chosen order, the smaller items, and the numbers to re-measure |
| [`TODO-language.md`](TODO-language.md) | The language, the two runtimes, the packs, the doc-block tools, and the language proposals carried and not started |
| [`TODO-site.md`](TODO-site.md) | The website, the claim, the long read and its review log, and the `resources/ecs` prune |

**The dated reasoning has gone, and it is not lost.** Every entry this file used to carry — how a fault was found, what the screenshot showed, which measurement settled it — is a commit in `git log -p -- TODO.md`, and the session narrative is in `conversation/`. Removed 2026-10-04, when the file reached 2,090 lines, 265 KB and 43,700 words and had become impossible for a human to read. **Its own first instruction had gone stale**, which is the argument for keeping it short: it opened by telling the next session to commit work that had been committed a day earlier.

---

## Where things stand

**The visualiser is the live work.** It is in the editor and working: a Graph pane over a recorded run, with the whole file as rows, a wheel-and-drag window over it, per-axis zoom, a caption and status line, marks and rules and heat, recorded flow lines, and a sidebar whose Docs tab shows the block prose for a clicked mark with `line N   visit V of T`. A run can be recorded from the editor's **Record** button, and a script naming an app can be **Launched** from it.

**The last three sessions, in one line each.** *2026-10-04, second session*: a project's broken editor page was traced to the dev server answering a missing file with the *previous* response's body — fixed, with `.code-version` bumped to 3 so a project's next server start picks it up; the update route stopped downloading the editor into a project (the page's payload supplies it); `server.allspeak` and `edit.html` now come from the repo root in every pack instead of four copies that had drifted; and the two failure clauses were made to mean what the reference says in both runtimes — `or` ends the thread, `on failure` carries on. *2026-10-03*: the capture and trigger workstream was built end to end — a `record` command with a verdict, `record this run`, `save the recording to`, and `record the app at <url> to <path>` with Record branching on `@app`; the JS half of the recorder's guard; four language fixes; and the editor became *fetched* rather than copied, which removes the staleness that cost two evenings. *2026-10-02*: the sidebar as a co-module, tabbed, with the doc-blocks tab filled by a click on a mark.

### What's next, in order

The order was chosen for stated reasons and is Graham's to change: **the item with no open design question goes first, and the container the others land in goes early, because it is visible.**

1. **The traffic lights** — decided in full on 2026-10-03 and **not built**, and by the rule above it goes first because nothing about it is undecided and its first half needs no change to any app. Per-tab state, and `Record`/`Graph`/`Launch` tinted from it; then the app reporting back. The design is in `TODO-viz.md` and, in full, in `various/record-and-launch.md`.
2. **The sidebar's remaining pieces** — the time at a mark, a marker highlight in the picture, a second path in, a way to close it. Each is small; the detail is in `TODO-viz.md`.
3. **A run started from the editor, done properly** — the command and the button are built; what remains is the shape a run takes when it *waits*. Graham's steer: *"eventually I will probably want to trace through threads that wait."* Needs the caller to be told when a run ends, and `recorder.parked` is the fact a fix needs.
4. **Annotations — capturing values into the recording.** The largest item on the list and the one to design rather than start: it begins with **Draft 3 of `spec/viz-trace-format.md`**. Graham's note is that it will open up many debugging possibilities — and it is also the change that most improves the long read, because §9's "flow, not data" bound is what the article currently rests on.
5. **Rollover tooltips**, on the sidebar's hit test, once the sidebar is settled.
6. **The website**: the exhibit, then the synopsis, then the hero, then retiring the AI Manual for a `TabWhy`. `TODO-site.md`.
7. **Parity's remaining chores** as each is met — the two `.allspeak` analysers are behind the Python one, and `conformance/actuals-js-browser.json` is stale from April. `TODO-language.md`.

**And the standing rule from Graham that governs all of it:** *make complex things simple* — a fully-integrated solution with a concise feature set and a minimal learning curve, for an audience that will leave at the first steep step.

### Waiting on a decision from Graham

- **`/read/<missing>` still answers `200` with an empty body.** The static route was given a real 404 on 2026-10-04; this route was left alone, so a caller cannot tell "no file" from "empty file". Same shape as that fix, one branch.
- **The general failure clause has no check.** `or` ends the thread and `on failure` carries on, in both runtimes, as of 2026-10-04 — but no conformance case can pin it (`load` is Python-only, JS's four clause-carrying commands are browser-only), so it rests on the reference and on hand measurement. `tools/capture-check.js` is the precedent for a check that drives one host and says why. `TODO-language.md`.
- **The sidebar's click, once there is a second tab:** does a mark click bring the Docs tab forward, or leave the tab where he put it? Decide it *with* the second tab, not after.
- **The redaction's fill.** `#d6d6d6` (the current one) makes a rule crossing a bar **1.25:1** — the rules are `#eee`, so a leader across a bar was identical to it and is now only a shade clear. `#7a8290` puts the rule at 2.05. One line.
- **Four `verify-stale` sign-offs** in the editor and the graph module. His by convention, and the analyser reports them as warnings until he clears them.
- **And one more in `examples/chemical/parser.allspeak`** (line 216, `MeasureFormula`), created deliberately on 2026-10-04 when its marker was corrected from `is 1` to `is 0`: the doc-block hash was refreshed and the `@verified` stamp left behind, which is the convention reporting the change. **It is not a fault to be cleared by a tool** — the only honest way to clear it is for a person who has re-read the section to use the editor's "Mark verified".
- **`@app` is still `!! @app` in a doc block.** Moving it onto a bare `@` line is his re-base, and the editor's Launch is the only reader to change.
- **Should `tools/attr-check.js` join the starter packs?** It needs a full checkout, so a pack could never run it — the position `guard-check.js` is in while being shipped.
- **The native reviewers' questions** for the packs: the fr/it `once` forms are provisional, Italian `discussione` is the forum-thread sense where the marker means a thread of execution, and the German `Limit`/`Thread` capitalisation call is a matter of taste.
- **The provisional fr/it/de words** for `wheel`, `amount`, `shift`, `control` and `svgimage`.
- **The two copies of `asedit.allspeak`** — hygiene, not a bug. The recommendation is to have `deploy-sync` refresh `deploy/code/` from the root.
- **The ramp's bottom end:** a once-visited line lands in band 1, so a quiet run shows amber for its least-worked lines. One line to change, and it moves every boundary.
- **The `resources/ecs` prune**, and when to do it — with the `resources/` prune as a whole, not during a deploy freeze.
- **Three dead variables** in `asedit-graph.allspeak` (`VizKeyTextX`, `VizZoomXW`, `VizZoomYH`) — leftovers, and a review pass reports rather than tidies.

### Notes the code points at

Four source files cite this file by name, so these stay here until the citations are changed. Both are facts about current behaviour, not history.

- **A recording covers a run up to its first `wait`.** `wait` hands the rest of the program to a timer, so `AllSpeak_Run.run` returns and a capture made inside a call covers only that slice; the JS host writes its trace one slice in, and its guard's `stopped` never reaches the file, where Python's host waits for the run to end. Rather than pass a slice off as a whole run, `record … reporting <verdict>` answers with the flag and the status line says so. **`recorder.parked`** — set as the recorder ticks each command, from the same waiting-keyword list the guard uses — is the fact a fix needs. Cited by `js/plugins/asviz.js`, `asedit.allspeak` and `tools/guard-check.js`.
- **The heat's per-line counts are the view's own, and the editor's are keyed one line off.** `asviz.js`'s anchors name the *label's* line and its `line_counts` key the *command's* line, so on a wide recording an anchor and its count can name different lines — a mark's colour was its neighbour's heat. The view no longer reads them at all: `VizSeen` counts arrivals itself during the mark pass. Anything else that reads `line_counts` should know it. Cited by `asedit-graph.allspeak`.

### Traps

**Moved to `AGENTS.md`** — they are standing knowledge rather than next steps, and every agent reads that file first. The ones that cost the most: `or` on a `rest get` stops the thread; a status code does not mean the file arrived; a variable must be declared before the statement that *writes* it; a duplicate declaration is an error; never redirect stderr on a check whose stderr is its verdict.
