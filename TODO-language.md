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

**What is already in step.** The trace is one contract (`spec/viz-trace-format.md`, Draft 2) and both write it — `js/plugins/asviz.js` (`VIZ_TRACE_VERSION = 2`) and `allspeak-py/plugins/as_viz.py` (`TRACE_VERSION = 2`). The marker syntax is core in both, and the shared framework `viz.allspeak` runs on both hosts. Measured by running both hosts on `tools/trace-run.allspeak`, the two reports agree except in the differences the spec documents — command counts 25 against 23, the `steps` axis, and a label followed immediately by a marker counting as two arrivals in Python and one in JS.

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

### Two language-layer findings from the same pass, both measured

- **`record le script dans …` cannot parse in French, and the cause is one line of the pack.** The French pack maps both `in` and `into` to `dans`, and the reverse map keeps only one: `language.reverse_word('dans')` is `into`, while `k_record`/`k_model` ask for `in`. So the plugin's grammar word is writable in French only as the untranslated English `in`. The shape of the fix is to accept either spelling (`in`/`into`) — the two mean the same thing here — but it is a change to what the grammar accepts rather than to a message, so it is not this pass's.
- **`tant que …` does not compile under the Python runtime at all, and that is a documented gap.** `language-pack-issues.md` (2026-04-21) records the multi-word `while` joiner being added **to `Core.js`** — `While.compile` skips an optional `that`/`que` — and `as_core.py`'s `k_while` never got the same. Measured: `      tant que N est inférieur à 3` gives `Je ne comprends pas 'tant' à la ligne 6` under `allspeak-py`, while the same file prints `3` under the JS runtime. **So a French script with a loop cannot run under Python**, which makes it the largest thing standing between the packs and real parity — and a one-line mirror of `Core.js` is what it needs.

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
