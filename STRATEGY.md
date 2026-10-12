# Strategy

**What this file is.** The aim, the plan and the constraints behind AllSpeak's move from *a language you can read* to **an environment where the intent is reviewable**. It is for us, not for a reader.

**What it is not.** It is not a status list — `TODO.md` and its three companions are the state, and this file does not repeat them. It is not a claim aimed at anybody outside; that is `why/`. And it is not a specification: where a step needs one, the step names the file that holds it.

**It is a work in progress and it is meant to be revised often.** Every change gets a dated entry at the foot. A claim here that turns out to be wrong gets **removed**, not softened — a strategy that hedges is a strategy nobody can act on.

---

## The shift

Graham, 2026-10-07:

> *"AllSpeak is many things, including a beginner's coding environment, a multilingual programming language, and a tool that allows a console-based product to closely resemble its browser-based cousin. But our recent work is taking it into new territory.*
>
> *I have noticed myself using the Edit tab of asedit less frequently, spending more time in Blocks. With the arrival of the Graph tab and the ability to run a script directly from asedit, the ground has shifted again. We are moving from code to intent, and that's a direct result of the introduction of doc blocks.*
>
> *All coding is intent-based, starting with the prompts and finishing with the code itself. The problem vibe coders have is they cannot read the code as intent, so they have to rely on trust. AllSpeak addresses this gap by first having a more accessible vocabulary and syntax, and second by providing intent alongside code. Asedit takes this at least one step further by offering visualisation and (planned) AI-guided debugging using throwaway scripts."*

**The mechanism is the doc block, and the consequence is that the centre of the tool has moved.** A reader who was going to edit code now reads blocks; a script can be run from the tool rather than from a terminal; and the picture of the run sits beside both. The evidence is in the strategy's own author: the flat editor is used *less* than it was.

**So what is being built is not an editor.** It is a *chain*: something writes the code, the tool shows the intent beside it, the tool runs it, the run becomes an artefact, and the artefact can be asked a question. Four of those five exist; the fifth is the debugger, and its brief is `prompt-261007-debugger.md`.

---

## What is actually being sold

**Not "AllSpeak is readable."** That claim is the old one, it is contested by every language with a friendly syntax, and it is an adjective. The claim that is ours is a *mechanism*:

> **Intent is kept beside the code, in the author's own words, and a run can be handed to somebody.**

Three mechanisms carry it, and each is already in the tree rather than planned:

1. **A vocabulary a person can read** — and, separately, **in their own language**. The language packs are not a translation layer bolted on; the front-ends *are* per-language.
2. **Intent, alongside the code, in the author's own prose** — the doc-block convention. A block is prose plus the code it is the prose for, and the block is the unit the tool shows, reads and reports on. This is the piece that makes review possible *without* reading the code.
3. **A run as an artefact** — a recording is a file, it travels with the project, it carries the author's own names and prose, and it can be read on a machine that cannot run the code. No conventional language ships this. A stack trace is a failure, a log is a choice, a debugger is a session, a profiler is an aggregate.

**And the honest bound on "code without coding".** The tooling can make intent *reviewable*. It cannot make intent *correct*, and it cannot decide what the intent should have been. The verification marks a reader sees are a **record of what a human signed off**, not a proof — which is exactly why the convention exists rather than a "trust me" badge. A document that promises more than that will be found out by the first person who reads one of its blocks and finds the prose and the code disagreeing.

---

## Who it is for, and what each one needs

| | what they bring | what they need from us |
|---|---|---|
| **The vibe coder** | an outcome, described in words | to review *intent* without reading code, and to go deeper exactly as far as they choose |
| **The experienced engineer** | the knowledge that code is only as good as the intent behind it | to read the intent **first**, then the code as far as they want — and to be able to *check* rather than trust |
| **The AI agent** | the ability to write and change the code | an instrument that answers questions about **behaviour** rather than about text |

**One constraint outranks each of their needs: the onboarding must not grow with the tooling.** The audience includes people who leave at the first steep step, and every feature added to the tool is a step. That is the standing rule, and it is what decides most of the arguments in this file.

---

## The plan, in the order it has to happen

### 1. The name: `asedit` becomes `viz` — **done 2026-10-12**

**Why it was first.** The tool is no longer an editor, and a name that says "editor" sets the wrong expectation before anybody opens it. It went first because the name is *in the artefact names*, and doing it later meant doing everything else twice.

**The collision, and how it was resolved.** `viz.allspeak` was **already taken** — it is the *visualiser framework*: the AllSpeak half of the recorder contract, which a plugin's records arrive in and which turns them into a narrative, loaded by `tools/asviz-run.js` and `tools/asviz-run.py`. Graham's call: the framework moves so the tool can have the name, and it is **`vizframe.allspeak`**. Everything else followed the plan: the tool's four files, the payload (`dist/viz.js`), the DOM id (`viz-ui`), the two harnesses (`tools/viz-check.js`, `tools/viz-modes-check.js`), and — Graham's later call — the editor's own three program names (`script Viz`, `script VizGraph`, `script VizSide`). Graham's rule was *rename it "everywhere it appears"*, and that reached the dated records too (the whitepaper, the `prompt-*.md` briefs, `why/REVIEW-LOG.md`), which the first plan had expected to leave alone. Two things were deliberately not touched, and neither is code: `various/backup-261001/` (a backup of an older tree — renaming it would stop it being one) and `conversation/` (the session log).

**The one rule that shaped the change, and it is an invariant below.** The payload name is a *published* contract — a page asks for `dist/asedit.js` and the site serves it by rsync — so the rename was **additive first**: the new name and the old one are both served, the payload still answers to the old part names, and `edit.html` and the payload land together. The *other* half of that window — dropping the old names — is open work in `TODO-viz.md`; it is safe once no browser cache holds a pre-rename page and no `~/.cache/allspeak/server.allspeak` asks for the old module names.

**The consequence that was stated rather than discovered, and it still stands:** the *language* keeps `viz start` / `viz stop` and the `@viz` attribute. One word now names both the tool and the marker written inside it. That is defensible — the tool is where you see what your markers recorded — but it is a choice, not an accident, and a reader's first confusion will be exactly here.

**What is left of this step is not this step.** The decisions are made and carried out; the detail lives in `TODO-viz.md`, and the reasoning that produced them is in the dated entries at the foot of this file. A step that is finished leaves this one — but §1 keeps its place and this paragraph, because the question "why is the tool called `viz` when the language says `viz start`" is one every new session asks.

### 2. The toolchain, and no new concepts to use it

**The rule this section exists to enforce: nothing here adds a word a user has to learn.** Blocks, Graph and Record already exist; what is missing is that they read as *one product* rather than three views. Concretely: the alert panel is the tool's voice for anything that takes time or needs explaining (`TODO-viz.md`, "The alert/info panel"), the three views share a file and a tab, and every control says what it does before it is pressed. Anything that would need teaching goes in the *documentation*, not in the critical path.

### 3. The debugger: the runner first

Brief: **`prompt-261007-debugger.md`** — the ask, what already exists to build on, the three shapes and how Graham's correction collapses them into one runner, the acceptance criteria, and the first slice in four steps. **Two properties of it are strategic rather than technical**, and they are why it is this early in the plan: it is what makes *captured values* (the annotations item) readable at all, and it is the instrument the AI agent's half of the audience needs.

### 4. The AI loop: write, run, look, then focus

**What it is.** The AI produces runnable code; the tool offers to run it; the first run captures broadly with a **user-supplied limit on the number of records**; the AI examines the recording and works with the user to decide where to look — for example at the runs that follow user or external events; then the recording is taken again, narrowed, with markers and probes around the part that matters. Graham's sketch, and it is the right loop: *breadth once, then depth where the answer is.*

**The consent discipline, which is the part that makes it legitimate rather than presumptuous.** An agent may record and probe **without asking** — that is already this repository's culture, where `tools/*-check.js` are instruments an agent runs on its own initiative — provided the mechanism makes four things true: the probe is **bounded** (a recording, not the probe, is the expensive artefact), **reversible** (nothing in the project changes), **quotable** (the probe is a file and its answer is text, so a conclusion arrives with its own numbers), and **declared** (the agent says what it recorded and why). The first run's limit is the user's lever on the one cost that is not bounded by anything else.

### 5. The writing

**Two documents, and they must not drift.** The internal one is this file. The user-facing one is **a new umbrella piece, `why/intent.md`** — Graham's call, 2026-10-07 — with **`why/article.md` kept as it is** as the visualiser deep-dive, linked from it. Nothing already reviewed moves. `why/REVIEW-LOG.md` keeps doing for the article what it does now, and **the umbrella piece needs its own log before it goes anywhere**, because a claim in a persuasion piece is a promise the tooling has to keep.

**The publishing path is `TODO-site.md`'s**, not a new one: synopsis, then the hero with all four languages at once, then the manual retired for `TabWhy`, then the piece. The site's own rule applies unchanged — a work in progress is published where it can show what changed, with the platform as the door rather than the venue.

---

## The invariants

These outrank any step above, and a step that breaks one is wrong even if it works.

1. **Make complex things simple.** A fully-integrated solution, a concise feature set, a minimal learning curve — for an audience that leaves at the first steep step.
2. **The onboarding does not grow with the tooling.** New concepts are optional, never on the critical path.
3. **A published thing must not break a project that did not change.** Names a project fetches are contracts; they change additively, with a window.
4. **Every checkable claim in a user-facing document is logged against what it depends on** — `why/REVIEW-LOG.md`'s discipline, applied to anything that goes out.
5. **A tool an agent needs is published, not shipped**, so there is one copy and no staleness.
6. **A check that cannot fail is worse than no check.** Where a fault is a *class*, the fix is a check.
7. **Measure, do not reason.** A value read from a log or a probe settles what an argument about the mechanism will not.

---

## What "done" looks like

Not a date and not a release. **A state:** somebody who cannot read code is handed a project, asks for a change in words, reads what the AI *intended* as blocks rather than as code, runs it, sees where it went in a picture, asks the run a question and gets an answer with numbers, and decides whether the code does what they meant — **without editing a script by hand, and without taking anybody's word for it.**

Every step in the plan is justified by how much of that sentence it makes true.

---

## Risks, named

- **The rename's blast radius — closed 2026-10-12, and the rule outlives it.** The payload name was published, so the rename went **additive first**, with the old name still served and the page and payload landing together. The rule it tested is invariant 3, and the *other* half of the window — dropping the old names — is open work in `TODO-viz.md`.
- **"Code without coding" over-promising.** The phrase is Graham's and it is a good door; the honest bound is in "What is actually being sold", and it has to survive into the user-facing piece or the first disagreement between prose and code becomes the story.
- **The two documents drifting.** The umbrella makes claims; the strategy sequences them; `why/REVIEW-LOG.md` checks them. Three files, one subject — the mitigation is that each has a stated job and none repeats another's.
- **The learning curve.** Every addition to the tool is a step for somebody. The counterweight is the invariants above, and it needs a person to enforce it — ideally the same person who notices they have stopped using the flat editor.
- **Building an expression evaluator by accident.** The debugger's whole point is that a *program* in the language already read is the evaluator. A "small expression language" for probes would undo it.

---

## How this file is kept honest

- **Dated entries at the foot**, newest first, one paragraph each: what changed and why. The reasoning behind a decision belongs in the entry, not in a rewrite of the section above it.
- **Nothing is deleted quietly.** A superseded claim is removed *and* the entry says so, because the next session will otherwise re-derive it.
- **A step that is finished leaves.** This file is the direction; once a step is done it belongs in the `TODO*.md` that follows it, and leaving it here turns the direction into a status list the way `TODO.md` once became one.
- **Read it before proposing a new feature**, and check the proposal against the invariants. That is the whole point of writing it down.

---

## Revisions

**2026-10-12 — step 1 is done, and it is the only step that leaves a residue.** Graham took two calls the plan had left open and one it had not. The framework is **`vizframe.allspeak`** (the proposal, not `vizreport.allspeak`); the editor's three program names moved with the tool — `script Viz`, `script VizGraph`, `script VizSide`, **`Viz`** chosen over `VizEditor` and over leaving `ASEditor` alone; and the sweep Graham's rule demanded (*rename it "everywhere it appears"*) reached the **dated records** — `documents/whitepaper.*`, the `prompt-*.md` briefs, `prompts/prompt-260509.md`, `why/REVIEW-LOG.md` and the dated entry in `language-pack-issues.md` — which the original section had expected to leave alone. `various/backup-261001/` and `conversation/` were still left untouched: neither is code, and renaming the first would stop it being a backup. **The section above is rewritten rather than removed**, against the file's own rule that a finished step leaves, because it is the one step whose *result* is a word every reader of the tool will wonder about — "why `viz` when the language says `viz start`" — and the answer belongs where the plan is. What leaves is the decision list: the classes, the table and the "two things it must not do" are now description of a shipped state. **Invariant 3 was the load-bearing one and it held**: the rename is additive — `dist/asedit.js`, the four `asedit.*` copies at `/dist/`, the four part-name aliases and a second payload global all still answer — so a cached page and a cached `server.allspeak` both keep working. Dropping that window is open work in `TODO-viz.md`, not a loose end here. Measured, in `TODO-viz.md`: three files compile (1704 / 2179 / 152 commands), `viz-modes-check` reports the same 56 of its 74 checks with the same two long-standing failures, `plotview-check` 79 OK / 6 FAIL — byte-for-byte the same six as before the rename — and `guard-check` and `capture-check` green.

**2026-10-07 — the file is started.** Written from Graham's two messages of that evening, which asked for an internal strategy and a user-facing piece, and which fixed two things by his decision: the tool is renamed **`viz`**, with the *framework* renamed so the name is free, and the user-facing half is a **new umbrella piece** with `why/article.md` left as the deep dive. The rename's collision, its published-payload problem and the framework's reference list are measured above rather than assumed; no rename has been performed yet.
