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

- **Python → JS: the run guard.** *Closed 2026-10-03.* `asviz.js` now takes a work budget and a wall ceiling and writes `stopped: "work"|"wall"`, exactly as `as_viz.py` does, and `Run.js` reads the answer the way Python's runtime does. `tools/guard-check.js` ships and proves both bounds on both hosts.
- **`asdoc-check.py` → both `.allspeak` analysers.** Listed under Doc blocks above.
- **Python → JS: a debugger.** `allspeak-py/allspeak/debugger/` is a working Qt debugger with a watchlist and a value display. JS has nothing. **This is the ancestor of the sidebar's debug tab.**
- **JS → Python: nothing.** The Graph pane is an editor feature and Python has no editor — by design, not a backlog.

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
