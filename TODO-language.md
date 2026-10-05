# The language, the runtimes and the packs

The detail behind `TODO.md`'s language row. Anything here that is settled says so; anything open has the smallest first step named. The dated reasoning behind each is in `git log -p -- TODO.md` (pre-2026-10-04) and in `conversation/`.

---

## Open in the language

### Attributes — landed, five small things outstanding

**What is in.** `@` at the start of a token, outside a literal, is an attribute: the text runs to the end of the line or to a `!` comment, and it is carried into the compiled program with no runtime effect. A statement's attribute is an `attr` field on the command it compiles to; a line that compiles to no command of its own gets an `attr` entry of its own, which the runtime steps over. Rules 11–14 of `spec/allspeak-language-contract.md`; `ATTR` in `spec/opcodes.json`.

**Where the design is decided, so nobody looks in the wrong place.** Recognition lives in the **tokeniser**, not the grammar — `js/allspeak/Main.js` `attributeText` + `tokeniseFile`, `allspeak-py/allspeak/as_program.py` `attribute_text` + `Program.tokenise` — so no keyword handler knows `@` exists and no condition parser can swallow the tail. The compiler holds the attribute for the length of one statement (`attrPending`/`attrStamped`, saved and restored because a `begin` compiles its whole body) and `addCommand` stamps the first command emitted. `!` ends an attribute. `tools/attr-check.js` drives both runtimes and is the place to read the claim.

**Open, and each is small.**

1. **`@app` is still `!! @app` in a doc block**, read by the editor's own buffer walk. Moving it onto a bare `@` line is Graham's re-base, and the editor's Launch is the only reader to change.
2. **Nothing highlights `@`** in the editor or the CodeMirror mode.
3. **Should `tools/attr-check.js` join the starter packs?** It needs a full checkout, so a pack could never run it — the same position `guard-check.js` is in while being shipped.
4. **`conformance/actuals-js-browser.json` is stale from April:** all nine tests in it report a compile error, and it has not been regenerated since. Also `ec_js_runner.js`'s usage names `as_js_runner.js` and a `dist/` path that is really `deploy/dist/`; and `run_conformance.py` has no notion of an optional case (`required: false` is ignored).
5. **A known divergence to accommodate rather than fix blindly:** Python keeps the colon on a label's symbol name (`Main:`) and JS strips it (`Main`), and Python stamps no `opcode`.

### Doc blocks — the sweep, and one gap in the tools

- **Nine files of 337 have errors, all `code-outside-section`.** In order of size: `codex/codex.allspeak` (537 — one large partially-blocked file, plus its `deploy/` copy), `deploy/code/asedit-graph.allspeak` (36, the stale deploy copy — `./deploy-allspeak` refreshes it), **`examples/chemical/parser.allspeak` (19)**, `tools/strike-fixture.allspeak` (10, a fixture and probably deliberate), and then three files with exactly one error each — `learn/reader.allspeak`, `tools/asdoc-check-cli.allspeak` and `tools/asdoc-check.allspeak` — where the shape is identical and the fix is one line: the `script X` declaration sits *outside* the first block, when it belongs inside it. A further **75 `title-long` warnings** are a sweep of their own, not blocking.
- **The two `.allspeak` analysers are behind the Python one.** `tools/asdoc-check-cli.allspeak` and `tools/asdoc-check.allspeak` do not have `code-outside-section`, `title-long`, `doc-after-code`, `meta-not-in-tail`, `symbol-unknown` or `redundant-giving`, so the three analysers AGENTS.md calls interchangeable currently disagree.
- **A rule the convention implies but the tool does not enforce:** "`!!!` must be followed, after blank lines, by the next block's `!!` or the end of file". Seventeen misplaced terminators in one file would have been caught by it. **Not added unasked** — the analyser is shared with other projects and a new error would start failing their files. Offered.
- **A gap in the doc-block tooling generally:** the analyser hashes code, not prose, so a doc block that describes deleted code is invisible to it. That is why the code-outside-section rule mattered.
- **The pane's own doc block states a false path rule** — that the recording is "a file beside the script… which the runtime writes with `--trace=`" — eliding that the host refuses to guess a filename (`tools/asviz-run.py`: "guessing writes files"). A doc/code disagreement to fix with whichever capture route is chosen.

---

## Parity between the runtimes

**What is already in step.** The trace is one contract (`spec/viz-trace-format.md`, Draft 2) and both write it — `js/plugins/asviz.js` (`VIZ_TRACE_VERSION = 2`) and `allspeak-py/allspeak/plugins/as_viz.py` (`TRACE_VERSION = 2`). The marker syntax is core in both, and the shared framework `viz.allspeak` runs on both hosts. Measured by running both hosts on `tools/trace-run.allspeak`, the two reports agree except in the differences the spec documents — command counts 25 against 23, the `steps` axis, and a label followed immediately by a marker counting as two arrivals in Python and one in JS.

**Two divergences the spec does not document, so they are open as a *decision*:**

- **`shape | … | exit-exit=0` (Python) against `exit-exit=1` (JS)**, and the same run's `Worker` anchor reading `exit=stop` against `exit=stop,exit`. **The cause is one command:** JS's `Compile.compile` appends a final `exit` to every program, and the last label's block runs into it; Python emits no such command. My reading is that the *model* should ignore a compiler-appended exit, since it is not a line the author wrote.
- The two runs are otherwise line-for-line equal, which is worth knowing: the trace format is doing its job.

**The gaps that are real, and in which direction each runs:**

- **The failure clauses — *closed 2026-10-04, and neither runtime had it right*.** `learn/reference/10-errors-and-recovery.md` gives the two spellings different endings — `or` "run and stop", `on failure` "run and continue" — and that was true only of `check`, whose handler compiles its own clause (Python's `k_check` ends it with `gotoTestEnd`, JS's `check` block does the same). Every command that goes through the **generic** clause compiler ran the action and then (Python) carried on under *either* spelling, or (JS) ended the thread under either. Measured: `load C from <missing> or begin … end` followed by a `print` printed the `print` in Python; `load … on failure …` followed by a `print` did not print it in JS. One rule now holds in both: **`or` ends the thread after its action, `on failure` carries on.** A written `continue` inside an `or` clause still overrides it in JS (undocumented, no Python equivalent, unused in the tree). The generic clause covers `load`, `save`, `download`, `get`, `post`, `open`, `read`, `write`, `append`, `put`, `index`, `pop` and the arithmetic `giving` forms in Python, and `Attach`, `Create`, `On` and `Append` in JS.
- **No conformance case can pin the general clause**, because no failure-capable command is shared: `load` is Python-only and JS's four are browser-only. That is the position `tools/capture-check.js` is in (it drives one host and says in its own output why the other is not asserted) — **and no check drives this rule yet.** `EC-0013` / `EC-0014` still produce their expected logs on both hosts, so `check`'s own clause is pinned; the rest is pinned by the reference and by hand.
- **The clauses that had to move from `or` to `on failure`**, because they meant "carry on": `server.allspeak`'s startup update check and `.code-version` read, `chat/chat-server.allspeak`'s version warning, `chat/chat-main.allspeak`'s second credentials attempt, `codex/codex.allspeak`'s empty-step fallback. Every other `or` in the tree either transfers control inside the clause (`go to`, `return`, `stop`, `exit`, `gosub`) or belongs to `check`. Compile sweep afterwards: 211 tracked scripts, the **same set compiles before and after** in both runtimes (Python 211/211, JS 62/211, the same 62).
- **Python → JS: the run guard.** *Closed 2026-10-03.* `asviz.js` now takes a work budget and a wall ceiling and writes `stopped: "work"|"wall"`, exactly as `as_viz.py` does, and `Run.js` reads the answer the way Python's runtime does. `tools/guard-check.js` ships and proves both bounds on both hosts.
- **`asdoc-check.py` → both `.allspeak` analysers.** Listed under Doc blocks above.
- **Python → JS: a debugger.** `allspeak-py/allspeak/debugger/` is a working Qt debugger with a watchlist and a value display. JS has nothing. **This is the ancestor of the sidebar's debug tab.**
- **JS → Python: nothing.** The Graph pane is an editor feature and Python has no editor — by design, not a backlog.

**Which runtime a script is for — landed 2026-10-05, and it was the missing half of parity.** The two implementations were "similar versions of the same coding language" with nothing anywhere recording which one a given script was written for; the only way to find out was to compile it and read the failure. `@js` / `@py` on a line of its own is now the script's own answer, `@js` is the default, and the reader is `record the script … giving …` — in **both** runtimes, which is what the marker was needed for. It is a file-level attribute, so no syntax, no pack entry, and rule 14 still holds; `learn/reference/22-attributes.md` documents it and `tools/capture-check.js` drives both hosts on it (eight assertions).

- **Read from the token stream, before the compile.** A script handed to the wrong runtime is exactly the script that will not compile there, so a marker read off the compiled program could never be reached — the compile's error arrives first. `vizFlavourOf(tokens)` / `flavourOf(tokens)` therefore read the stream `tokeniseFile`/`Program.tokenise` already produced.
- **`tools/asviz-run.js` registers its sources before it runs anything.** A target can now name another by name, and the host's half of the contract has to be in place first; it used to be filled after the run, which failed with `no source registered` — a script's fault, apparently, and actually the host's ordering.
- **Three defects came out with it, two fixed and one carried.** The JS model's `attr | line=` had a `+ 1` on an already 1-based line (invisible, because the editor reads the key and the value, not the line); the Python model reported *no* attributes with their lines at all, which the JS model has done since 2026-10-03 — so the editor's own `@app` walk had no Python counterpart; and Python's `@viz stop` still falls through the anchor early return that JS's stopped doing on 2026-10-04 (measured, and parked in `TODO-viz.md` with the visit counts it moves).
- **The default is the project's, and that is what makes `@js` worth having.** Resolution is **script marker → `.allspeak-init`'s `runtime:` line → `js`**, so a Python project carries no marker on any script and `@js` is the *override* a mixed project needs. `learn/reference/22-attributes.md` documents the order; `tools/capture-check.js` drives all four cases on both hosts.
- **Asked about a *path*, never once for the process.** `record the script in <path>` names its own target, and that target can be in another project than the caller's — so the first version, which resolved the project once per host and cached it, refused the wrong thing. The Python plugin reads the `.allspeak-init` above the path it is given (it has a filesystem, and reads the target's source the same way); the JS plugin asks `AllSpeak_Viz.projectFlavourFor(path)` — a *function*, supplied by `tools/asviz-run.js` — and falls back to `#editor-runtime`, the page element the dev server fills, which is right for the editor because every tab is a file of one project.
- **`server.allspeak` read `.allspeak-init` wrongly, and it was live.** `put field 1 of InitText delimited by \`lang:\`` takes everything *after* the key, and the lines after it were only stripped of spaces and newlines — so a project the packs had told the agent to *set up* (name and type added) served `lang="frruntime:pyname:Mynotesapptype:cli"` and an editor in English whatever its language. Measured 2026-10-05 against a four-line file, before and after; `InitValue` is now a line-aware reader and `runtime:` is read through it too.

### The messages a person reads — landed 2026-10-05, with two batches owed

**The mechanism, which is the part that matters.** A plugin's message is now a key in the pack's `diagnostics`, read through `AllSpeak_Language.diagnostic` / `language.diagnostic` — the same accessor the compiler's seven errors have always used. `diagnostics` went from 7 keys to 33, all four packs translated, and `say()` in each plugin is the only way a message is made. The English text has **one** home: `LanguagePack_en.js`. It used to be two — the pack and a table copied inside `diagnostic()` — and nothing kept them in step, which is the shape of bug that makes a new message both more work and less reliable.

- **The guard is `./sync-language-packs`, and it is why a new language is now mechanical.** It refuses a pack that is missing a key English has, a key English has dropped, and any translation whose `{placeholders}` do not match English's — the last being the subtle one, since a dropped `{line}` still renders a sentence and no check would notice. It writes nothing when it refuses, so the trees cannot go half-synced. `learn/reference/15-multilingual.md`'s "Adding a new language" now names this step.
- **The `diagnostics` limit worth knowing.** The count sentences are four whole keys (`vizVerdictManyMany` etc.) rather than two fragments glued together, because the counts vary independently and a language that joins them differently would get English word order back. That covers the **two-form** languages the packs ship; a language with more plural forms (Russian, Polish) needs a rule the plugin does not have. Stated in the code rather than hidden, and it is the first thing to reach for when such a language arrives.
- **Owed: the editor's own messages.** `asedit.allspeak`'s status line is mostly raw English literals — `No doc blocks in this file`, `Could not record this script — `, `The Graph pane could not be loaded`, `Recorded …` — and its `SetStrings` table (18 `Str*` variables) covers only the chrome. So in a French project the line reads *English frame, French body*. A different actor with its own mechanism, and a batch of its own.
- **Owed: the four plugin messages left in English on purpose**, because they are a *host author's* diagnostics rather than a user's: `no source registered for … the host must set …` (twice — the same guard duplicated in `Model.run` and `Record.run`, a consolidation candidate), `could not arm a program in the app`, `could not load the visualiser into the app`, and `{name} is not a variable`.
- **Open, and it wants a decision rather than a guess: whose language is a verdict in?** The verdict is the *caller's* (the pack is restored before the sentence is built), while the compile error *inside* it was produced while the recorded script's pack was active — so `could not run: Je ne comprends pas 'dictionary' à la ligne 46.` is a real possibility: English frame, French body. Either restore after the sentence (whole line in the recorded script's language, wrong for the reader) or keep the reason in the caller's language (needs the runtime error text re-generated, which nothing can do). Measured 2026-10-05; not decided.

### The language layer's one real defect — **fixed 2026-10-05**, and it was 33 lines in 7 files

**It was one bug, not two, and it is written up in full in `language-pack-issues.md`.** The Python grammar asked
the *lossy* reverse map whether a token *is* a word (`reverse_word(t) == 'c'`), where JavaScript asks the pack
whether the token is a *form* of it (`matchesWord`). Where a language spells two English words the same — French
`à` is `than` and `to`, Italian `e` is `and` and `is` — one of them becomes unreachable, and **a loop written in
any language but English could not run under the Python runtime at all.**

- **32 comparisons** in 7 files now use `matches_word`, `k_while` gained `Core.js`'s optional `that`/`que`
  joiner (missing since 2026-04-21), the condition *type* falls back to a canonical the runtime can answer
  (`Language.canonicals_of`, new), and `as_value.compileValue`'s article is skipped at last.
- **Provably a no-op under English** — no ambiguous form in `en`, out of 376 — which is why the whole class could
  be fixed in one pass: all 323 tracked scripts compile to the *same set* before and after, and three
  per-language probes print what the English equivalent prints.
- **The guard lives in `./sync-language-packs`** (`check_grammar`): it fails, naming file and line, when a Python
  site compares a reverse lookup against a word dead in some pack. It named all 32 before the fix and is
  re-evaluated from the packs every run, so a new word or language cannot reintroduce it quietly.
- **Still open, and neither is a one-liner.** `as_core.compileValue` knows the rich value forms and
  `as_value.compileValue` (what `log` uses) does not, so `log the json count of T` prints under JS and fails to
  compile under Python — the article half is fixed, the rich-form half is a design decision, because `as_value`
  is the *value protocol* shared with plugin domains. And the packs' `conditions` section is **dead code**: only
  `en` has it and `Language.condition_word` has zero call sites.
- **And `BUILD.md` has no Python release step.** These fixes reach users only through a new `allspeak-ai`
  release; the packs carry no runtime, so nothing else has to move. Worth a line in `BUILD.md` beside the JS
  build.

- **Open, and it is the smallest useful piece of Py-side Launch/Record: the editor does not read `#editor-runtime`.** The page carries it and the dev server fills it (verified live: `id="editor-runtime" style="display:none">py`), and the *plugin* reads it — verified through the editor's own path with a page standing up: an unmarked script resolves to `{declared: py, origin: project}`. But **no check asserts it**, because `asedit-modes-check`'s stub page has no such element, and the editor cannot branch on flavour until it attaches one. That is what would let **Launch** stop inviting an `@app` on a script that has no page, and let **Record** route a Py-side script to the project's server rather than refusing it. The remaining pieces are named in the message above and in `TODO-viz.md`'s "three routes": the route itself is ~20 lines of `server.allspeak` and the command it needs exists; **shipping `as_viz.py` to a project is the real work**, because a pack carries three files and no plugin — which is a decision, not a coding detail.
- **Open: the repo's own Python scripts are unmarked.** `server.allspeak`, `chat/chat-server.allspeak` and the `allspeak-py/*.allspeak` fixtures are `js` by default — correct as *tools* are written today (a host runs what it is handed and never consults the marker), and wrong the moment anything selects a runtime for them. This repository is the mixed project the `@js` override was invented for, so it wants either an `.allspeak-init` saying `runtime: js` with `@py` on the Python few, or the reverse.

**One parity gap found on 2026-10-04, and it is a *leniency* rather than a break:** the JS compiler accepts `run <value>` with **no `as <module>`**, the Python one refuses it (`'as {module name}' expected`). `learn/reference/12-modules.md` documents only the `as` form, and the starter packs' GUI launcher template uses the bare form — inside an HTML page, which the browser's runtime compiles, so it never meets Python there. It bites the moment somebody copies the idiom into a `.allspeak` file: measured at 2026-10-04, `run Script` compiled with 0 problems under `tools/asviz-run.js` and failed to compile under the CLI.

**On versions, for the record:** `js/allspeak/AllSpeak.js` line 1 still reads `2608191442` while `Browser.js` changed on 2026-10-02. The versioning policy says the runtime scheme "may remain implementation-specific", so this breaks no rule — but the string no longer dates the runtime, and AGENTS.md describes it as date-time.

---

## Language packs

### The `viz` marker's option words — reviewed 2026-09-28, the words stand

Every option word has a local spelling in all four packs, so a marker can be written entirely in the local language. `viz` itself stays `viz` in all four, as `json` and `mqtt` do: technical keywords are not translated.

| canonical | en | fr | it | de |
|---|---|---|---|---|
| `on` | on | sur | su | bei |
| `start` / `stop` | start / stop | démarre / arrête | avvia / ferma | starte / stoppe |
| `every` | every | chaque | ogni | jede |
| `once` | once | une-fois *(provisional)* | una-volta *(provisional)* | einmal |
| `limit` | limit | limite | limite | Limit\|limit |
| `until` | until | jusqu'à † | fino-a | bis |
| `thread` | thread | fil | discussione\|thread | Thread\|thread |

† Four spellings — `jusqu'à|jusqu’à|jusqu'a|jusqu’a` — because the match is exact and a French writer chooses the apostrophe (ASCII or typographic) and the accent independently.

**Constraints a local word must satisfy, worth keeping for any future vocabulary:**

- **One token.** The tokeniser splits on whitespace and `reverse_word` is a whole-token lookup, so a phrase can never match: `une fois` is two tokens and no entry can bind it. The failure is loud rather than silent (`Je ne comprends pas 'une'`), but it is still a failure. Hyphens and apostrophes are fine inside a word, which is what makes `une-fois`, `una-volta`, `fino-a` and `jusqu'à` work.
- **Case matters.** The lookup is exact and every existing German keyword is lowercase, so the correct German noun spellings — `Limit`, `Thread` — are entered as `Limit|limit` and `Thread|thread`.

**For the native reviewers:** the French and Italian `once` forms are provisional guesses; Italian `discussione` is the forum-thread sense whereas the marker means a thread of execution, so `thread` may be the better primary there; and the German capitalisation call is a matter of taste.

**One follow-up.** `tools/generate-translated-docs.py` substitutes word by word, and the English doc source contains the new words — `once` 4 times, `thread` 3, `until` 5 — so the next doc regeneration will change some French/Italian/German lines, including prose containing those words. Eyeball those diffs before the next `deploy-sync`.

### `dictionary` / `list` in the JS flavour — measured 2026-09-29; **decided: leave it alone**

The assumption that implementing them in JS "would have severe implications" was recorded nowhere and never tested. Measuring says they cost almost nothing: JS already has both shapes under the spellings the reference documents. It was also prototyped in **four edits, all in `Core.js`, with no pack change**, and it moves `examples/chemical/parser.allspeak` from failing at line 43 to line 45.

**It still should not be done**, and the reason is the one to keep: the two runtimes' lists are different structures — Python has no `element` (it is `item`), JS has no `reset`, Python dies on index-assign to a non-existent slot where JS auto-extends — so `list` + `element` would compile on both, run on JS and fail on Python. Graham's rule is that the JS variant must follow **"adding without taking away"**: the sweep passes (319 scripts compiled with and without: 149 OK either way, **0 regressions**) but it would advertise a portability the list semantics do not support. **No visualiser workaround is needed** — the trace format is portable, so a script the JS runtime cannot run is recorded by Python and drawn by the same picture. Full measurements in `language-pack-issues.md` #14 / #14b / #14c. **`entry` is half-wired** (`has entry` works, `set entry` and `put entry` do not), which looks accidental.

### `modifyValue` is still undocumented in the plugin contract

`as_value.py` calls `domain.modifyValue(value)` on every registered domain, and the JS twin of that bug was fixed by guarding `handler.value`. Any plugin domain must define `modifyValue` to avoid an AttributeError, and `spec/allspeak-plugin-contract.md` does not say so.

---

## Language proposals, carried and not started

Both come from friction points in the chat/forum project, April 2026.

3. **Storage get with defaults.** `get X from storage` returns the string `"null"` or `"undefined"` when a key is missing, requiring repeated cleanup. It should return empty, or support a fallback: `get Broker from storage as \`chat-broker\` or clear`.
4. **Multi-field unpack with remainder.** For protocols where the last field may contain the delimiter: `unpack MessageText by \`|\` into TopicName Subject Author Body` — the last variable gets the remainder.

Done and closed: **string split by delimiter** (`split … by` and `put field N of … delimited by`), implemented in both runtimes; and **append to a JSON array in a file** (Python only; JS uses `rest post` to a server, and the in-memory `append` covers the JS case).

## `json of` a holder gives one slot, not the set — 2026-10-05, and the earlier claim is corrected

Found designing the recording clip. **An earlier version of this section said "a script cannot build a json
list". That was broader than the evidence, and Graham's question — whether an "array" means the cursor-like
indexed pattern *whose whole element set converts to a single JSON value* — is exactly the distinction.** What
is actually measured, in both runtimes:

- **A holder is the cursor-like indexed pattern**, and the cursor is stronger than it looks. It is declared with
  `set the elements of X to N`; slots are written with `index X to I` + `put V into X`; a slot is read with
  `index X to I` + `put X into G`. **`split` fills the variable it names** with a slot per line — the editor's
  walk is `put Source into Lines` *then* `split Lines`, and splitting the original instead is how a copy of it
  then yields one element rather than all of them.
- **`put A into B` copies the value the cursor stands on, not the set.** Measured: after `split Text`, a
  `put Text into Holder` left `Holder` holding **one** element.
- **`json of <holder>` gives one slot's value too.** Measured: a three-slot holder of dicts came out as
  `{"steps":9,"n":"c"}` (the last written), and a two-slot holder of numbers as `9`.

**So "the whole element set as a single JSON value" is not something the language spells today.** That is the
real gap, and it is narrower than the first version of this note claimed: reading and writing slots works;
what is missing is a way to say *the whole holder, as one json list*.

**Next test, and it is the one the probe botched**: `put Text into Holder` **then** `split Holder`, and then ask
`the elements of Holder`, `Holder has element 0`, and `json of Holder`. The first probe split `Text` and copied
it afterwards, so every reading of the copy was a reading of one slot — which is why `has element` looked false
and why the conclusion was drawn from the wrong object. **A probe that manipulates a cursor has to check which
object the cursor is on before it concludes anything.**

**What this means for the clip.** A filtered list of events still needs a home. Two candidates, unchanged: a way
to spell "this whole holder as a json list", or filtering where JSON is JSON — the `viz` plugin, in both
runtimes, which already reads and writes trace documents and which the pane already depends on. The plugin
remains the likelier answer, but the language question comes first because it is cheaper to answer.

## Proposed: a `join` keyword, the inverse of `split` — 2026-10-05

Graham's proposal, and it closes the gap above. `split` takes a value and fills the named holder with a slot per
line; **`join` would take a whole holder and make one value out of it**:

    join MyArray to json SingleValue          ! one json list, into the currently-indexed slot
    join MyArray to StringValue with `,`      ! no `json`, so a CSV string
    join from N to M of MyArray [ to ...]     ! a range of elements

His own second example shows why the wording needs one change:

    index MyArray to N
    join MyArray to json MyArray              ! "destroys one of its own elements"

There, one token — the bare name `MyArray` — means *the whole set* on the left of `to` and *the slot the cursor
is on* on the right. A reader cannot see which is which, and everything else in the language means the slot: a
bare name in `put A into B` copies **one** slot (measured — see above), and `json of` a holder gives one slot.
So the *source* reading is an exception, and it is the right one — it is the same scoped exception `split`
already makes, in reverse — but the *destination* should be marked with the word the language already uses for
"the slot you are about to write": **`into`**.

    join MyArray as json into SingleValue     ! as = the form; into = the target
    join MyArray with `,` into StringValue    ! with = the delimiter; no `as` = text
    join MyArray into StringValue             ! no delimiter at all

One shape, three optional words, and a bare name after `join` always means the set — because that is what the
keyword is for.

**Two notes for whoever specifies it.** `json` must produce a **value**, not its text: `the json count of` a
*string* is undefined (measured above), and a text where a list is wanted is exactly the fault that produced
this section. And `join from N to M` is a *different* operation — an element-wise copy into another holder, not
one value out of many — so it belongs with `split` as a second feature rather than as a fourth form of this one.

**Why it matters beyond tidiness**: with `join` the clip's filter is pane work. Build a holder of the kept
events, `join` it `as json into VizEvents`, and the pane's own loops read the range — no plugin call, no new
boundary. The implementation is a small extension of what `json of` already does, since that already serialises
the value the cursor stands on.

## `join`: the implementation recon, so the next session resumes rather than rediscovers — 2026-10-05

**The template is `split`, and it mirrors cleanly.** In `js/allspeak/Core.js` the `Split` domain entry has both
halves: `compile` reads an optional target symbol, the value, an optional `on`/`by` and an optional
`giving`/`into`, then `addCommand({domain: 'core', keyword: 'split', lino, item, on, target})`; `run` does
`program.getValue(command.item).split(on)`, sets `targetRecord.elements` and fills `targetRecord.value[n]` with
`{type: 'constant', …}` entries. In `allspeak-py/allspeak/as_core.py` the same pair is `k_split` (compile, using
`nextIsSymbol`/`getSymbolRecord`/`add`) and `r_split` (run, using `getVariable`, `getSymbolValue`,
`object.setElements`, `setIndex`, `setValue`).

**`join` is those two halves with the direction reversed**: the compile half takes a *symbol* where `split` takes
a *value*, and the run half **reads** `elements`/`value[n]` where `split` writes them. Everything else — the
`as`/`with`/`into` modifiers, the target check (`is not a variable`), the lino — follows `Split` word for word.

**The one thing to find before writing it: what a *list* value is.** `join … as json` must produce the same
kind of value that `the json count of` and `the json keys of` already read — and those two are in neither
`Core.js`, the English pack, nor any plugin under `js/plugins/`, which was the surprise. The likely reason is
that the packs list **words**, not phrases: `json`, `keys`, `of` are separate entries and the grammar composes
them, so a search for the phrase finds nothing. **Start there** — find the word entry and its handler, and make
`join … as json` produce exactly that shape.

That matters more than it sounds: my own reading of a json value went wrong an hour before this note was
written (a *reader* and a *producer* disagreeing about what "json" means — see the section above). A `join` that
produced a json *string* instead of a json *value* would be the same fault shipped as a feature.

**Order of work, and why**: JavaScript first — it is what the Graph pane runs, and JS is this project's primary
focus — then the packs (`./sync-language-packs` mirrors them into the Python JSONs; note that a pack word with no
Python handler is a parity gap that wants stating, not hiding), then the Python twin, then the clip that uses it.
