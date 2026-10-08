# The website, and the writing

The detail behind `TODO.md`'s site row. The dated reasoning is in `git log -p -- TODO.md` (pre-2026-10-04) and in `conversation/`.

**Headings carry their bin, since 2026-10-06** — the four are defined in `TODO.md` under "How this list is run". Here: `[note]` is a settled claim or decision, `[mine, queued]` is work that does not need you, `[your call]` is what wants your eye — and the prune below is the one item that is both measured and scheduled.

---

## The claim, and where it goes — [note]

**The claim, in the form that should go on the site.** Not "AllSpeak is readable" — that is the old sentence and others can say it. The new one: **a run is an artefact you can be handed.** It is a file, it travels with the project, it carries the author's own prose in the author's own language, and it can be read on a machine that cannot run the code. No conventional language ships that — a stack trace is a failure, a log is a choice, a debugger is interactive, a profiler is aggregate. It is a comprehension claim for the vibe coder and a governance claim for the professional.

**What is invisible today, which is the reason this matters.** Nothing on allspeak.ai mentions the visualiser; no recording ships anywhere (`find . -name '*.viz.json'` finds none); and the live editor cannot open a project at all on the static host — `/list/` and `/read/…` are the Python server's routes and answer `404`. Also not published anywhere: `resources/md/ai-article.md` (the "quick brief", `404` on the site), `dev-to-article.md`, and the four `*-agent-primer.md` files.

### Three decisions taken (Graham, 2026-10-04)

1. **The home page gets one hero joining both claims** — "in your own language" and "and you can see what the AI did" as a single proposition, not a new section beside the multilingual lead. Source of truth is `deploy/<lang>/home.md`, **not** `resources/md/home.md` (a dead EasyCoder-era copy still saying `~ec~`). `deploy/{fr,it,de}/home.md` are translated copies of the old hero, so an English-only change leaves three languages on the previous positioning — budget for all four, since a differing hero reads as abandonment rather than as a backlog.
2. **The documents are English-first**, translated once the English has settled. This keeps the nav change to two files (`deploy/en/topnav.md` + `nav.md`) instead of eight.
3. **The AI Manual is retired and folded into the long read.** What that deletes: the Manual is *translated* — `deploy/{en,fr,de,it}/primer/ch01..08.md` (32 files) plus four `tab3.md` overviews and Manual strings in four `strings.json`. Also 160 lines of Manual handlers and the eight `#manual/chNN` restore branches in `primer/project.allspeak`. Do it as *one* small change: `TabManual` becomes `TabWhy` and does what `TabLearn` already does (`location` to another page); the destination has to be per-language data, and `strings.json` is where per-language strings live. Split what is folded: the **product** half (ch1's premise, ch2's decision framework, ch5's observability, ch8's vibe-versus-structured) goes into the long read; the **process** half (ch3 milestones, ch4 incident loop, ch6 roles, ch7 prompt templates) belongs beside `learn/idioms/12-working-with-ai.md`, not in a persuasion piece. Keep `AI/WEBAPP_AI_MANUAL.md` itself — `mapintel-agent-primer.md` cites it as the process doc. **Keep the fr/de/it tabs live until their long read exists**, or those languages lose their AI door.

### Placement, agreed shape

Synopsis at `deploy/<lang>/why.html`, the long read linked from it, one shared script at `deploy/shared/why/why.allspeak` (the `deploy/shared/primer/project.allspeak` pattern), markdown sources in `why/` at the repo root with one new `deploy-sync` line. `learn/contents.md` gains a "New here?" line. A new page here is one HTML loader, one shared script and one markdown file — no build step, as `deploy/<lang>/primer.html` shows.

**Publishing, when it is ready.** Canonical on the project's own site, not on a platform: a LinkedIn article edit is **silent, leaves no "edited" marker, and destroys the previous version** (LinkedIn's own help), and LinkedIn renders no markdown — so a work in progress there cannot show what changed, which is the one thing it needs to do. Use LinkedIn (or any platform) as the *door*: a short post per revision, pointing at the page that is always current. Reuse the dated-snapshot mechanism the runtime already has (`/dist/<YYMMDD>/`, and `./deploy-allspeak` already does that rsync) as `why/<YYMMDD>/`, so a shared link keeps saying what it said. An email list is the only venue where "periodically update" actually notifies. Show HN wants the *exhibit* shipped first. Zenodo is right for v1.0, not for a draft.

---

## Done, and what is next — [mine, queued], the four in that order

**Done: `why/intent.md`** — 2026-10-07, Graham's call: the **umbrella piece** for the new direction, aimed at people who do not read code, mechanism-first, with §4 ("what this is not") and §5 ("the bargain") doing the load-bearing work. `why/article.md` is **kept as it is** as the visualiser deep-dive it already is, and the umbrella points at it. Two consequences for this file: the site path now has **two** long reads rather than one, so the synopsis has two doors to offer and each piece needs a page; and **the umbrella needs its own review log** before it goes anywhere, because a claim in a persuasion piece is a promise the tooling has to keep. It is a draft, with a four-item header of what must be true first.

**Done: `why/article.md`** — the long read, ~5,000 words, **draft and deliberately not published** while the visualiser is still moving. It is not too early by design: Graham's steer is that there are major features still to land, and the article is reviewed as they do. Eleven sections; three figures marked to produce; all its numbers taken from the `H₂O` run of `examples/chemical/parser.allspeak`.

**Done: `why/REVIEW-LOG.md`** — every checkable claim in the article against what it depends on and what would make it stale, the dated record of each review, and the named triggers for the next pass. Graham asked for a regular review while the visualiser keeps moving, so the log exists to make a review a checklist rather than a re-read. **Review 1 (2026-10-04) found nine errors in the draft**, six of them real factual mistakes, all fixed. Read the log's trigger list before any revision.

**Next, in order.**

1. **The exhibit** — a copy of the parser and a fresh recording in the deploy tree, and the pane on a page, so the claim has something to point at. One command writes the recording, and the pane takes the script and the recording as *text*, which is what the editor already sends it, so a static page can do the same. **`pretrace.json` must not be shipped as the demo**: it is the format spec's worked example, from an older revision of the parser — its window is at line 379 while the parser's marker is at 206.
2. **The synopsis** — `why/synopsis.md`, ~700–900 words, short sentences, no adjectives where a mechanism will do: the problem in one paragraph; three mechanisms rather than three claims; one figure with three captions; **what it is not**; one sentence to each audience; where to go next.
3. **The hero**, which is the one page change that wants all four languages at once.
4. **Retire the Manual and add `TabWhy`.**

---

## Repo hygiene: prune `resources/ecs` — [your call], scheduled, not yet done

`resources/ecs/` is a **superseded site generation**. `documents/doclets-feature-checklist.md` records why: the deploy pipeline never ships it. What remains is a mixture of ages and purposes, which is the argument for pruning it rather than keeping it as one unit — 18 files dated 2026-04-06 (the fork day, the old site's pages), the five-file "scripted" colour-coded editor bundle (`scripted.allspeak` / `scripted-server.allspeak` / `scripted.html` / `scripted.json` / `README.md`), and the three more recent page scripts (`docman.allspeak`, `doclets.allspeak`, `main.allspeak`). Renaming the folder is not worth doing on its own: if it is pruned, the name goes with it.

**Clear these first — each is a reference the prune would leave dangling:**

1. `project.html:13` loads `/resources/ecs/project-main.allspeak`, which does not exist.
2. `codex/{en,de,fr,it}/md/tools.md` use `/resources/ecs/myscript.allspeak` as an example path.
3. The four `resources/doc/*/core.json` translation caches link to `resources/ecs/sample/factory`, which does not exist.
4. `index.html:21` and `codex/codex.allspeak:303` load `main.allspeak` and `docman.allspeak` from the folder.
5. `resources/ecs/README.md` describes a five-file bundle but sits in a folder of unrelated pages.

**Why nothing can be lost:** all 33 files are tracked, so any is recoverable with `git log -- resources/ecs/<file>`. Run `./deploy-sync` afterwards, because `deploy/` holds a mirror. **When:** with the `resources/` prune as a whole — not during a deploy freeze, and not with a release in flight.
