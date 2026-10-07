# The debugger: a briefing, 2026-10-07

**What this is.** A single place for the debugger workstream Graham raised on 2026-10-07, so that a couple of days' pondering has something to be done *against* and the next session does not begin by re-deriving it. It is **not yet an order**: one of its three shapes is unsettled by him, and this file says which parts are settled, which are open, and what the first slice is either way. Everything below is either a measurement, a quote, or an existing fact in the tree with its file named.

**What it is not.** It is not a summary of `TODO-viz.md`'s "The debugger proposal" — that is the record of the conversation and stays the record. This is the brief.

---

## The ask, in his words

> *"Use of the visualizer as a debugger, primarily by adding @ttributes to labels and script commands, to name variables whose values should be captured. Programs like VS Code allow expressions to be evaluated, but I'm wondering if we can go further, by adding whole AllSpeak scripts that act on the recording process rather than the run itself. This leverages code we already have rather than requiring an all-new expression evaluator, as well as offering more complex expressions akin to Excel macros. These would be written by AI on an as-needed basis."*

and, the following evening, what fixed the middle shape:

> *"For 2 I will need some more thought. I had in mind temporary files created as needed — this was the point about the process running as an AI task, so the user just helps decide what information is needed and is not expected to write and integrate it. We've gone well past the point where the average user — particularly a vibe coder — can cope with that kind of mental load."*

and, closing for the night:

> *"I have a feeling there could be some kinds of debugging tasks that AI might recognise as needing help from this mechanism, and go ahead without consulting the user, just to validate a theory."*

**The sentence to keep in front of every decision:** the user's only input is **what they want to know**. Nothing in this feature may require them to write a script, name a file, choose a directory, or understand a format.

---

## What a reader actually wants, and what already exists

The question a reader brings to a run is of one of two kinds, and the second is the one nothing serves today:

1. **"Where did it go?"** — served already: the picture, the flow lines, the heat, the sidebar's block prose per mark.
2. **"What was true at that moment?"** — *not* served: `visit 7 of 12` is a count, and `@show Total, Row` shows the names the script *chose* to watch, at the arrival it named and nowhere else. Everything else about the run is in the recording and unreadable without writing code.

**The leverage is larger than it first looks, and it is all stuff that already runs:**

| what | where | what it gives the debugger |
|---|---|---|
| a second program in the same page | `asedit.allspeak`: `run VizSrc as VizModule`, and `run SideSrc as SideModule` | the editor, the pane and the sidebar are **three AllSpeak programs in one realm today** — so a probe needs no new engine, only a host |
| the recording, as text | the message field `trace`; the pane holds it as `VizTrace` | a probe can be *given* the run as a json variable |
| naming variables to watch, already | `@show Total, Row` — read by the recorder, shown by the sidebar | the first useful probe needs no language change at all |
| an annotation carrying names, already | `@viz start on Work` | "a label carrying an annotation" is not a proposal, it exists |
| fetching and running a script from a file | `asedit.allspeak`'s `LoadVizModule` — `rest get … or go`, then `run … as …` | the runner's plumbing is written; it fetches the pane this way |
| a bounded run | `js/plugins/asviz.js`'s recorder: a **time budget** and a **wall ceiling**, with `stopped: "work"｜"wall"` reaching the trace | the precedent for the probe's own budget, and it argues the case: *"a loop that waits or has to be set so high that a genuinely busy loop runs for minutes"* |
| the panel | `asedit.json`'s `se-alert`, `ShowAlert`/`HideAlert`, and the pane writing the same two elements by id | the place an answer can be shown, and copied |
| a tabbed panel whose body is filled by a message | `asedit-side.allspeak` — `SideTabName`, the `SideTab` pool, `SideRender` | a Debug tab is one more name and one more branch |

**And one cost that governs the whole design.** `element N of X` parses the whole array and stringifies the element it returns — **~15 ms an access on a 435 KB recording**, measured 2026-10-06, so every loop over a recording is *quadratic in what it walks* and the **records walked** are the cost, not the work done. A probe therefore has to be a thing that reads the recording **once**, and a probe that walks a big recording twice is not a slow probe, it is an unusable one.

---

## The three shapes, and how his correction collapses them

**Shape 1 — a panel that runs a script.** A Debug tab with a `textarea`, a Run button, and the recording handed over as a json variable; the answer is whatever the script writes into a named variable. No spec change, no recorder change, works on recordings that exist now. **Settled — "just as I envisaged it".**

**Shape 2 — a script the AI writes on demand.** His correction removed the thing my first sketch had asked *him* to decide: the script is **not** stored on the block, **not** an attribute, **not** integrated into the source. It is a **temporary file created as needed** — throwaway, in the way `various/` is throwaway in this repository — and his only input is what he wants to know. **Open, and deliberately so: he is still turning it over.** Nothing in the mechanism depends on the answer; only the *provenance* does.

**Shape 3 — a script over the finished recording, writing derived records.** Not an interposition on the recording process, which is the expensive version and the one he agreed to skip: run the script once over the completed recording and let it write a summary anchor or a computed series that the pane draws as **a new layer**. **Settled in shape — "just as I envisaged it".** Open only in that layer's document format.

**And they are one thing, which is the simplification worth taking.** All three are **"run an AllSpeak script with the recording handed to it"**; they differ only in where the script comes from (typed, AI-written, a file) and what happens to the answer (shown, shown, drawn). So the thing to build is the **runner**, and the three shapes become three ways of feeding it. That matters practically: shapes 1 and 3 come almost free once the runner exists and a file route exists, and the runner is also what the capture half needs in order to be read at all.

---

## The runner: what it is, and what "done" means

**One sentence.** The **editor** is the host — it already fetches files (`rest get`), compiles and runs fetched text (`run … as …`), owns the panel and the string table, and knows the tabs; the pane draws and should keep doing only that. The runner takes a probe's **text**, hands it the **recording's text** as a json variable, runs it under a **budget**, and puts the probe's **answer** somewhere the reader can copy.

**Why the editor and not the pane.** The pane's own state is a *picture* (the window, the clip, the kept set); the probe wants the *recording*, which the editor is the one that fetched. And the editor is where a probe's failure has to be *said*.

**The answer channel — my recommendation, and it should be the panel first.** The alert panel (`se-alert`) is already a place a program can write a message and a reader can copy one out of. Drawing a probe's answer in the pane (shape 3) is the *later* half, because it needs a document format and a layer; **text is what a theory is validated with**, and text is what can be quoted into a conversation, a commit or a bug report — which is this project's own reason for preferring a message to a dialog box.

**Three non-negotiables, and they are acceptance criteria rather than polish** (each has this repo's precedent):

1. **A compile error is shown verbatim**, in the panel, naming the line. The editor already says a module it could not load in a sentence of its own (`VizLoadFailed`, `SideLoadFailed`), and those two moved to the panel precisely because the status line clears everything after three seconds — so a failure that is not shown where a reader is looking is a failure that was thrown away.
2. **A run budget**, because the probe is written by a program about a program: the recorder's `budget`/`ceiling` pair is the model, and the reason is the same one that put a guard on the recorder — an unbounded walk of a recording is minutes, not milliseconds.
3. **Nothing written into the project**, except at most a scratch file the probe itself names. A probe that reforms a project to answer a question is not a probe.

---

## The first slice, in the order I would build it

Four steps, each with the check that says it is done. Nothing here touches the language, the packs or the trace format.

1. **The runner, headless.** A subroutine in `asedit.allspeak` that takes a text and a recording and runs the text with the recording available, under a budget, returning either the answer or the compiler's sentence. *Check:* `asedit-modes-check` drives it with a probe that is deliberately broken (the sentence comes back), one that walks the recording once (the answer comes back), and one that loops forever (the budget stops it and says so). This is the whole feature's spine and it can be tested before any UI exists.
2. **The Debug tab.** One more name in `SideTabName`, one more branch in `SideRender`, a `textarea` and a `Run` for the probe, and the answer in the panel. *Check:* `asedit-modes-check` asserts the tab exists, that Run reaches the runner, and that a failure lands in the panel rather than on the status line; a browser measurement shows the round trip.
3. **The file route** (this is shape 2's mechanism, whatever his answer about keeping probes turns out to be). The probe's text may come from a file the editor fetches, with the path remembered so nobody types it twice. *Check:* the same harness, with the probe served by the stub rather than typed.
4. **Shape 3's output**, and this one needs a decision first: derived records the pane can draw want a **document shape**, and the cheapest honest version is a *second* json beside the recording with its own small section in `spec/` — **not** a revision of the trace format, so that a probe can be added without moving the contract the two recorders and the sidebar share. Then the pane draws it as a layer, and `tools/check-trace.py` gains a sibling rather than a new rule.

**Where the capture half meets this.** The runner is what makes captured values readable, which is why it goes first — so the capture half's Draft 3 of `spec/viz-trace-format.md` should be written *after* step 2 exists and can demonstrate a use.

---

## The constraint that collides with an existing rule, and it needs Graham

**A project's agents are told to keep their scratch out of the project, and a probe has to be in it.** The pack's own `AGENTS.md` says, of the published checks:

> *"fetch the one you need into your own scratch directory, not into the project"* — `curl … -o /tmp/asdoc-check.py`

That is the right rule for a check. But the runner's file route reads through the dev server (`/read/<path>`), which serves **the project root and below** — a page cannot fetch `/tmp`. So a probe written where the rules say scratch goes is a probe the editor cannot read. Three ways out, and this is a genuine fork:

- **(a) Give a project a probe place, and ignore it.** A conventional directory, named in the pack's `AGENTS.md` and ignored by the project's git — which means a pack grows a fourth file (`.gitignore`) or the user's first setup does, and `build-starters` changes. Most honest, most visible, and it makes "a probe is throwaway" a fact rather than a hope.
- **(b) A server route that reads outside the root.** No pack change, but it is a **security-shaped** decision (the dev server would serve files outside the project), and it would have to be off by default.
- **(c) No file at all — the probe is handed in.** The AI's script goes into the panel as text through the editor's existing `/write/` route into a *probe buffer*, and the user never sees a file. Smallest change to the project's shape; but it needs somewhere for the text to live between sessions, which is what shape 2's "temporary file" was for in the first place.

**My recommendation: (a), because it is the only one that keeps the rule "the user's only input is what they want to know" true for the *agent* as well as for the user, and because an ignored directory is a thing a person can look at.** But (b) and (c) are cheaper, and it is his call.

---

## An AI using this unprompted — his new thought, and what it needs

> *"some kinds of debugging tasks that AI might recognise as needing help from this mechanism, and go ahead without consulting the user, just to validate a theory"*

**This is already the culture of this repository, and the new mechanism only widens what a probe can be pointed at.** `tools/*-check.js` are instruments an agent runs on its own initiative — `plotview-check` drives the pane, `guard-check` drives both recorders, `hover-check` drives the runtime — and the trap list says why they earn their place: *"a log beats a theory. Both faults diagnosed by reading the runtime were wrong; both found by a log or a harness were right."* The debugger adds the one instrument that has been missing: **a probe that can ask a question about a program's own execution rather than about its text.**

**The kind of task where an agent should reach for it unprompted** is narrow and recognisable: the uncertainty is about **behaviour** — how many times, in what order, with what values, at which arrival — and it sits under a claim the agent is about to make. That is the class a recording answers and reading cannot.

**What makes it legitimate to do without asking, and each of the four is a property the *mechanism* has to provide:**

1. **Bounded.** The recording is the expensive artefact, not the probe: the first drawing of a large recording is minutes, and a probe that walks one twice is quadratic. So the mechanism must make a *small* recording the easy one — narrowed by the clip bar, or recorded from a purpose-written script — and the agent must say which it used.
2. **Reversible.** Nothing in the project changes: no source edited, and the probe and any scratch output are untracked and deletable. This is the same permission an agent already has to run a check, and it is the reason (a) above must be an *ignored* place rather than merely an untracked one — an untracked file in a project is what `git add -A` sweeps up.
3. **Quotable.** The probe is a file and its answer is text, so a conclusion can be reported *with the probe's own text and the numbers it printed*. That is this project's rule for diagnostics — a copied line can be compared, re-run and read by somebody else, where a paraphrase cannot — and it is the difference between evidence and an assertion.
4. **Declared.** An unprompted probe is reported as one: *"I validated this with a probe; here it is; these are the numbers."* A probe may not be the only support for a claim that reaches the reader.

**And the honest bound on it.** A probe validates a theory about a *run that happened*; it cannot invent the run. Recording is what produces the artefact, recording is what costs, and — if a probe needs one — producing it writes `<script>.viz.json` beside the script. So an agent that reaches for this unprompted must first say *what it recorded and why*, which is cheap to do and impossible to do afterwards.

---

## Settled, and open

| | |
|---|---|
| **Settled** | the user's only input is what they want to know; no attribute, no language change, no spec change for the runner; the probe is temporary and AI-written; shapes 1 and 3 as Graham envisaged them; shape 3 runs over the *finished* recording rather than during it; the runner first, and the capture half after it; the three non-negotiables above |
| **Open — his** | where a probe file lives (the three-way fork above); whether a probe worth keeping is *keepable* by name or throwaway by design; shape 3's output document; whether the panel or the pane shows a shape-3 answer |
| **Open — the builder's** | the runner's budget constants; whether the answer channel is the alert panel or the Debug tab's own body; the probe's variable convention for handing in the recording |
| **Not to be reopened** | the per-record interposition (his call, and the cost argument is in `TODO-viz.md`); a new expression language (his, and this feature exists to avoid one) |

## What I would not build, and why

- **A filter over the recording process** — rejected on measurement, not taste: a per-record callback multiplies `element N of X` by the record count.
- **An expression evaluator** — the whole point of his framing. VS Code's advantage is a language; AllSpeak already has one, and a *program* is what makes "Excel macros" possible.
- **A probe stored in the source** — the thing his correction removed. It would put a language decision and a maintenance burden on the reader this feature is meant to serve.
- **A third pane for the answer** — the editor already has a panel, a status line and a sidebar with tabs; a fourth surface is where the learning curve starts growing again, and the rule is that the onboarding must not grow with the tooling.
