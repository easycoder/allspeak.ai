# AllSpeak — Language Enhancement TODO

Items identified during real project work. Each should be implemented in both JS and Python.

## Where things stand

**Working and verified:** the four starter packs are consolidated onto a single instructions document per language — `AGENTS.md` — with `CLAUDE.md` reduced to a one-line pointer, so the two can no longer drift. The fr/de/it `AGENTS.md` now carry the same sections as EN: the "Required practices" (doc blocks, consult `learn/`) and "Common mistakes to avoid" sections that were missing, a reference section listing the current 20 reference / 15 idiom files, and the newer first-time-setup flow (the *user* starts the server; the agent must not). The hand-maintained Quick Reference is gone — it duplicated `learn/` — which closes item #5 in `language-pack-issues.md`. The orphan flag works end to end — the plugin's `reachable=no` anchor, the editor's walk over the model records, the range test, and the sidebar row's red background, strike-through and tooltip. Switching tabs (or opening a file) now leaves Blocks mode automatically. The string-versus-number trap is documented in `learn/` (`idioms/12-working-with-ai.md`, `reference/06-conditions.md`), and the `DIFF.md` habit is a rule in the root `AGENTS.md` and in all four starter packs' `AGENTS.md`. The **Python graphics domain gained native file dialogs** (`create {dialog} type file` to open, `type save` to save — each with an optional `filter` — result is the chosen path or `''`), a **`readonly` option on `multiline`** (a plain-text field the user cannot type into), and **`set the title of {window}/{group}/{dialog} to …`** (the counterpart of `create … title`) — documented in `learn/reference/20-graphics.md` and `learn/idioms/14-desktop-gui.md`; Python-only, so there is no JS counterpart to build. Separately, `ensureRunning()` now raises a `RuntimeError` rather than a compile-time `FatalError`, so misusing a runtime API (`getVariable` and friends) while the program is idle no longer reports a bogus "Compile error … at line <last line>" and kills the host — and `RuntimeError` no longer crashes when `program.pc` is `None`.

**Open, in order:**

1. **Extension rename is on `master`** (merged fast-forward, 3 commits; `origin/master` not yet pushed). `.as` → `.allspeak` across the repo: 318 files renamed, ~326 docs/config swept, both extensions accepted by the runtimes. Remaining: `git push` when ready, and re-verify the 14 `verify-stale` blocks in `asedit.allspeak` (Blocks mode) if that matters.
2. **Consumer projects** still carry the old names. `~/dev/doclets` is the only project *coupled* to this repo — it holds copies of `asedit.as`, `asdoc-check.py` and `allspeak-js/*.js`. Nothing is *broken* (the runtimes accept `.as`), so renaming the rest is cosmetic; the `.as` counts per project are in `conversation-021.md`. Update doclets in its own session, never in place here.
3. Native review of the fr/de/it `AGENTS.md`: they were machine-drafted, so a reading pass is worth doing before they ship — the viz-word review is the precedent.
4. **The run picture is drawn, but not yet judged.** A trace now carries control transfers
   (format draft 2) and `./various/plot` draws the run — arrivals as dots, transfers as faint
   strokes, two colour rules behind a toggle, independent axis stretch. The next input is Graham's
   eye on it; the first screen in `asedit.allspeak` follows. Both described in the Visualiser
   section below.
5. The label bodies after `ListSorter` in `codex.allspeak`, and the run-panel region that still sits outside any block.
6. ~~The JS recorder~~ **Done 2026-09-29.** `js/plugins/asviz.js` now carries the Recorder and the trace
   writer, `js/allspeak/Run.js` calls `program.vizRecorder.tick()` once per command, and
   `tools/asviz-run.js --run --trace=` records. `./various/plot --js <script>` draws it. The two
   runtimes now agree on every arrival, transfer and line count for `tools/trace-run.allspeak` —
   only `steps` differs (25 against 22), by the label commands Python emits and JS does not, which
   is now recorded in the spec under "Where the two runtimes differ".
6. Propagate the logging recommendation (root `AGENTS.md`, "Diagnostics while debugging") to the four starter packs — drafts in fr/de/it for review, as with the diff-notes sections.
7. `learn/{,fr,de,it}/idioms/13-server-as-application.md` (and the `deploy/` mirrors) still say the starter packs' `CLAUDE.md` default is to launch the server with `-t edit,<project>`. The packs now say the user starts the server and the agent must not — so that line is stale in all four languages. Worth fixing when `learn/` is next touched.
8. **Runtime bugs the three old `allspeak-py/tests` scripts exposed** (2026-09-27 — the scripts themselves are fixed; see `DIFF.md` for the repros). `set property \`k\` of D to v` compiles and then poisons the dictionary — the next read dies with `TypeError: argument of type 'ECValue' is not iterable`; `set entry \`k\` of D to v` is the spelling that works. `put json \`{}\` into X` on a plain `variable` reports "I don't understand 'put'" rather than naming the type mismatch. `dummy` and `debug symbol(s)` exist in JS (and the packs) but not in the Python runtime. Take them one at a time, JS-parity first.
9. ~~**`the year of X` / `the month of X` / `the day of X` / `the hour of X` and friends**~~ **Done 2026-09-27.** They now work in both runtimes and take **milliseconds** — the same unit as `now`/`timestamp`/`today` — so the doc's own example (`put the timestamp into Now` … `put the year of Now into YYYY`) is correct. Two further faults surfaced: the JS accessors multiplied their operand by 1000 (seconds), so that example yielded `NaN` in the browser; and the two reference pages contradicted each other on units (`05-values-and-types.md` said milliseconds, `07-arithmetic.md` said seconds). Both fixed; `07` now says milliseconds. **Left open:** the Python value parser does not canonicalise translated keywords, so `l horodatage` / `l année de` fail where `the timestamp` / `the year of` work. That gap is wider than these accessors — it is every translated value keyword — and wants its own fix (JS canonicalises with `AllSpeak_Language.reverseWord`).
10. **`weekday` and `day` disagree.** Python has `[the] weekday` = 0 = Monday, today only (documented in `allspeak-py/doc/`); JS and the packs have `the day of X` = 0 = Sunday. Two near-synonyms on different bases is a footgun — pick one (the documented `day`) and retire or reconcile the other.
11. **Two conformance suites fail** — `allspeak --test conformance/tests/` reports 15 files, 5 tests, 3 failed (`CheckBasic` "RoomCount is 5", `CheckBlocks` "X is 3"). Pre-existing, not touched by the 2026-09-27 work.
12. The new "interactive debugger" section in `learn/idioms/11-debugging-as.md` is **English only** — the fr/de/it copies need the same block (the EN page is the source).
12. **Two graphics-domain defects found while adding `on close {window}` and `the x of` / `the y of`** (2026-09-27). (a) `as_debug.py`'s `closeEvent` saves `self.x()` / `self.y()` and restores with `setGeometry`, which excludes the frame — so the debugger window creeps up and to the left on every run. The graphics reads now use `geometry()`; the debugger's own save is the same two-word fix. (b) `r_on`'s click/select handler calls the module-level `flush()`, which under `python3 -m allspeak.as_program` resolves to the *second* copy of `as_program` (the runtime is loaded twice — hence the `RuntimeWarning`) whose `queue` is never created: every click/select prints `NameError: name 'queue' is not defined` and the handler is deferred to the next 250 ms timer flush (verified: with `-m` the main flow overtakes the handler; via the `allspeak` entry point the handler runs synchronously). Harmless-but-noisy for a click, fatal for anything that must finish before a window goes — the new `on close` path drains the running program's queue with `self.program.flushCB()` instead.

**Traps that have cost hours here — worth reading before editing anything:**

- **Text compared with numbers.** A number read *out of* text — a record field, `the content of`, `the index of` — stays text, and text comparison is lexical: `\`29\`` is not less than `\`1000001\``. Nothing errors; the condition simply answers the wrong way. Convert with `add 0 to X` or `the value of X`. The two runtimes differ — the browser does not coerce a mixed comparison, the terminal does — so verify in the runtime where the problem appears.
- **An undeclared `variable`** is reported as a *token* error at the first statement using it ("I don't understand 'put'"), not as "not declared". If a compile fails that way, look for a missing declaration.
- **Editing `asedit.allspeak`:** use content anchors with assertions, never positional spans. Afterwards check that `commands` is non-zero *as well as* the analyser reporting 0 errors — a broken editor still analyses clean.
- **The served editor is cached.** `asedit.allspeak` is fetched with a `?v=` stamp; if a change does not appear, check the fetch before the code.

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

**The shape it takes, given what already exists** (`server.allspeak` already serves `/list`,
`/read`, `/write`, `/version`, `/restart` in AllSpeak, and asedit already talks to them with
`rest get`/`rest post`):

1. **`viz record`** — a plugin command that runs a script (from a path *or from the buffer text*)
   with a recorder attached and hands back what the picture needs. The counterpart of the existing
   `viz model`, and the piece every host below needs. *(Not built yet.)*
2. **A `/viz` route** in `server.allspeak` — a handful of AllSpeak lines, mirroring `/read`.
3. **A third view in `asedit.allspeak`** — the canvas, drawing from the fetched data. The drawing
   code exists in `various/make-viz-plot.py` but is *generated* into a page; it has to become a
   fetch-and-draw so it can live in the editor.

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
