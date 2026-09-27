# 2026-09-27

## 12:32

I've been on another project for a few days so I need to get back up to speed. Where are we and what's next?

**Assistant**

[code omitted]

**Where we are.** The orphan flag works end to end and is verified: the plugin's `reachable=no` anchor, the editor's walk over the model records, the range test, and the sidebar row's red background, strike-through and tooltip. Switching tabs (or opening a file) leaves Blocks mode automatically. The string-versus-number trap is documented in `learn/` (`idioms/12-working-with-ai.md`, `reference/06-conditions.md`). The `DIFF.md` habit is a rule in the root `AGENTS.md` and all eight starter-pack documents, and `AGENTS.md` now also carries a "Diagnostics while debugging" recommendation. All of it is committed as `2609252139`, and the working tree is clean.

**What's next, in order** (from `TODO.md` → "Where things stand"):

1. The starter packs' `AGENTS.md` and `CLAUDE.md` have drifted apart — same structural slot, different titles, and the French pair runs 166 lines against 412. Decide whether they should be one document.
2. Block-level aggregation over a trace, then the first screen in `asedit.as`.
3. The label bodies after `ListSorter` in `codex.as`, and the run-panel region still outside any block.
4. The JS recorder — needed before traces from the two runtimes can be compared.
5. Propagate the logging recommendation to the four starter packs; fr/de/it drafts for review.

**Four traps worth carrying over**, because each has already cost hours: text compared with numbers (convert with `add 0 to X` or `the value of X`; the runtimes differ, so verify where the problem appears); an undeclared `variable` reported as a token error rather than "not declared"; editing `asedit.as` with content anchors and checking `commands` is non-zero, not just that the analyser reports 0 errors; and the cached editor fetch.

## 12:34

The session history is gtting a bit long so I'll close it here and open a new one to continue.

**Assistant**

[code omitted]

Nothing to do — the state is clean and the handover is in place. `TODO.md` → "Where things stand" carries the summary, the open items in order, and the four traps; the root `AGENTS.md` points a new session at it, so it does not depend on anyone remembering. The working tree holds one new file from this session, `conversation/conversation-020.md`, which is untracked and needs no action to continue work.

## 12:36

Please pick up the project from TODO.md and brief me on what is next to be done.

**Assistant**

[code omitted]

Tree was clean, last commit `2609252139` (2026-09-25) — only Reasonix's `.reasonix/` metadata and the untracked `conversation/conversation-020.md` pending. I noted that `DIFF.md` still claimed "staged and uncommitted", which was stale. I briefed the handover from `TODO.md` → "Where things stand": the active queue (pack drift, then the two `viz` items, the `codex.as` label bodies, the JS recorder, the logging propagation) and the longer thematic backlog (storage defaults, multi-field unpack, the `resources/ecs` prune, the pending `viz` native review, `modifyValue` in the plugin contract, the provisional flags) — plus the four traps. Verification: the drift figures in item 1 were stale (166/412); the real shapes are EN identical at 298 lines, fr/de/it `AGENTS.md` at 198 against `CLAUDE.md` at ~420, and the same slot titled `Contexte du projet` vs `Première configuration`.

You then chose: **one document — `AGENTS.md` is the single source, `CLAUDE.md` points to it — reconciled to EN's shape, with me drafting fr/de/it for your review.** I implemented exactly that.

**What I changed.** `starter/{en,fr,de,it}/CLAUDE.md` are now one-line pointers to `AGENTS.md` (the "type go" beginner tip kept). The fr/de/it `AGENTS.md` were rebuilt to EN's section shape — they gain **Required practices** (doc blocks, consult `learn/`) and **Common mistakes to avoid**, the reference section now names the real 20 reference / 15 idiom files with the recommended first reads, and the first-time-setup flow matches EN (the user starts the server; the agent must not). The hand-maintained Quick Reference is gone. All four `AGENTS.md` now share the same 11 `##` sections; `./build-starters` was re-run and the four zips rebuilt.

**Bugs found and fixed while reading:** `starter/it/` templates used `language it` (now `language italiano`, matching `codex/it`); `starter/de/AGENTS.md` used `ausstieg` and `führe Skript aus`, neither of which is a keyword (now `beende` and `laufe Skript`). The GUI templates' `stop` is now the local `arrête`/`stoppe`/`ferma`, matching `codex/` — `stop` does compile everywhere, so that one was a consistency call, not a bug.

**Downstream docs updated:** `README.md`, `BUILD.md`, `NOTES-i18n-nice-to-have.md`, and `language-pack-issues.md` (#5, the Quick Reference drift, now marked resolved).

I validated every code example with the Python runtime: the `cat` examples (and the deliberate wrong ones) behave as the doc claims, and the loops, conditionals and `vasous`/`gsub` forms compile. Two things I could not validate that way, and flagged: `div`/`rest`/`crée` are browser-only so the CLI can't reach them, and the multi-word `set the elements of` resolves in EN but not fr/de/it in the Python runtime — the known Python i18n gap, not a bad example.

**Findings left for you (not fixed):** the EN "Common mistakes" bullet says `try`/`catch` doesn't exist, but the EN pack *does* have a `try` opcode (`try … end try`) — a doc/code disagreement now inherited by fr/de/it; and `learn/{,fr,de,it}/idioms/13-server-as-application.md` still say the packs' default is to launch with `-t edit,<project>`, contradicted by the packs in all four languages. Both are logged in `TODO.md`, along with the native-review pass the fr/de/it drafts need.
