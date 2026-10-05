# AllSpeak language-pack issues

Living tracker for open and resolved issues in the per-language pack files (`js/allspeak/LanguagePack_<lang>.js`) and the runtime's handling of them. Refer to this before starting cross-language pack work — to avoid duplicating closed items and to surface things that should be tackled together. Update when new issues are found or fixed.

## Open

### 1. Wrong-canonical pattern mismatches (no automated detection yet)
A pattern uses surface word X; X is mapped to canonical Y in the words map; but the `compile:` function in `Core.js` / `Browser.js` / `MQTT.js` / etc. expects canonical Z. The DE `attach` bug (closed 2026-04-27) was the first instance found: `attach` pattern used `an`, `an` mapped to canonical `an` (the indefinite article), but `Attach.compile` called `compiler.isWord(\`to\`)`. The unmapped-words audit (below) does **not** catch this class — it only flags words that map to no canonical at all.

Detecting more requires scanning every `compiler.isWord()` / `nextIsWord()` / `skipWord()` call across the JS runtime and cross-referencing the canonical asked for against what each language pack's pattern declares. Doable but bigger. Defer until next user report or a batch session.

### 2. `patterns` arrays are documentation-only
The compiler dispatches by `keyword` alone; literal words after the keyword in a pattern are not enforced — the runtime accepts whatever the handler reads via `isWord()`. Means a pattern can silently drift from runtime expectations until a user happens to rely on the declared form. The While patch (item closed 2026-04-21) works around this for one specific case. A proper fix would route compilation through the patterns array — bigger refactor.

### 3. (resolved 2026-04-29 — never actually a problem) `has` and the `a` anchor keyword
The earlier worry was that adding FR `has → a` would collide with the `a` HTML anchor element keyword. Investigation showed the worry was unfounded: the FR pack already has `a` as a form for three canonicals (`than`, `to`, `a` itself); IT has two (`to`, `a`). Multi-canonical-sharing-a-form is the established pattern. Each `compiler.isWord(canonical)` call is context-specific, and the `a` element keyword is dispatched via DECLARE_ELEMENT pattern matching, not via reverse-lookup. Adding `has` mappings (FR `a`, IT `ha`, DE `hat`, EN `has`) would work like the existing entries. Closed without runtime change.

### 4. Plugin-declared elements not available in headless compile checks
`gmap` (gmap plugin), `animation` (svg plugin) fail when plugins aren't loaded — affects English and translated scripts identically. Testing-infrastructure limitation, not a translation issue: step16 / step19 / step20 fail the same way in EN and FR harness runs.

### 5. (resolved 2026-09-27) Quick Reference in starter `CLAUDE.md` is hand-maintained
The per-language `CLAUDE.md` Quick Reference block was removed when the four starter packs were consolidated onto a single `AGENTS.md` (the `CLAUDE.md` files are now one-line pointers). No hand-maintained vocabulary table remains in the packs, so there is nothing left to drift from `LanguagePack_<lang>.js`. The earlier failure mode (random/wait/fork drift, 2026-04-26) no longer applies.

### 6. Localized error messages — coverage check pending
Each pack has a handful of translated error strings (`"syntaxError"`, `"runtimeError"`, …) but full coverage hasn't been verified. Some runtime error paths probably still emit English. Worth a sweep when next we touch error reporting.

### 7. (resolved 2026-04-29) JS is source of truth; `sync-language-packs` keeps JSON in sync
JS `LanguagePack_*.js` files are now the canonical source. The standalone `sync-language-packs` script extracts the JSON object from each JS pack and writes it to `allspeak-py/allspeak/languages/<lang>.json` for the Python runtime. The misleading "auto-generated from languages/<lang>.json" header comment was updated to reflect the new direction. The unused root `/languages/` mirror (which was incomplete — only EN+IT) was removed. Run `./sync-language-packs` after editing any `js/allspeak/LanguagePack_*.js` to keep Python parity.

### 8. Python runtime i18n is incomplete (separate workstream)
Hardcoded English literals, accent issues, word-order mismatches. Out of scope for JS pack work but tracked here so it isn't forgotten. Catalogue lives in the auto-memory note `project_python_i18n_gaps.md`.

### 9. Floats are not first-class numerics — by design
Python value parser rejects float literals (`as_value.py:43` uses `isnumeric()`, `'51.5'.isnumeric()` is `False`). This is the intended convention, not a parser bug:

- Pass floats as backtick strings (`` `51.5` ``); DBs and APIs that need float coerce on receive.
- For arithmetic with fixed precision, use scaled integers (e.g. multiply by 100 for 2-decimal precision) at script level.
- If an imported API requires native float, do the str→float conversion at the boundary, not in the value parser.

Open task is documentation, not code: starter `CLAUDE.md` should mention the convention so AI agents don't write `put 51.5 into X`.

### 10. List-of-dict access: `item N of List` works; dict-field access needs an intermediate
ECList supports `put item N of List into X` for positional access. A multi-row SQL result *can* be iterated via `item Index of Rows`, but dict-field access on the returned element requires a copy through a `dictionary` variable first:

```text
dictionary Row
put 0 into Index
while Index is less than the count of Rows
begin
    put item Index of Rows into Row
    put entry `body` of Row into Body
    ! ...
    add 1 to Index
end
```

`entry of` is not valid directly on a list, and ECList has no get-by-value (`find` / `indexOf` / etc.). Open task is documentation, not code. Surfaced 2026-04-27 building the SQL plugin's multi-row select.

### 11. `the elements of` (arrays) vs `entry of` (dictionaries) — by design
`set the elements of X to N` and `the elements of X` are for ECVariable's array mode (positional/numeric indexing via `index X to I`). `entry of X` is for ECDictionary (keyed access). They serve different shapes and the runtime error when used on the wrong one is the right behaviour. Open task is documenting the distinction in starter `CLAUDE.md` (the array form was added 2026-04-27; the dictionary contrast still isn't called out).

### 12. Starter pack lacks an idioms/tutorial layer
Beyond the Quick Reference and template snippets, there's no guide to the *patterns* of AllSpeak — when to use arrays vs separate variables, how event handlers compose with state, how REST / Webson / script-side coordinate in a GUI app, etc. The bugs and smells fixed on 2026-04-27 (numbered-variable anti-pattern across all four TicTacToe runs, `end on` confusion, missing array idiom in starter docs) all trace to this gap: AI agents working from the starter pack get correct syntax but not idiomatic structure.

Methodology when tackling this: study the larger scripts already in the repo as worked examples — `chat/chat-main.allspeak`, `asedit.allspeak`, `server.allspeak`, `codex/<lang>/code/step12.allspeak`–`step20.allspeak`, `primer/project.allspeak`, plus whatever lands under `examples/` (Graham plans to populate this with past EasyCoder projects; current contents `dice`, `imageswitcher`, `usercapture`) — and ask Graham to explain *why* particular constructs are used. Some idiomatic choices reflect tacit experience that won't surface from reading code alone. Don't try to invent the curriculum from first principles.

EasyCoder scripts are valid sources too: AllSpeak was a global rename of EasyCoder (per project root `CLAUDE.md`), so EN-language idioms in `.ecs` files map directly. The non-trivial part is generalising idioms across languages, not translating them.

Distinct from #5: that item is about keeping the existing Quick Reference auto-synced with the language pack. #12 is about adding a new, larger guide that doesn't currently exist.

### 13. (low-priority, cosmetic) Internal Python class names still carry `EC` prefix
The 2026-04-06 EasyCoder→AllSpeak global rename caught file paths, package names, the `.allspeak` extension, and source-level identifiers, but internal Python classes still carry the EC prefix: `ECValue`, `ECVariable`, `ECDictionary`, `ECList`, `ECObject`, `ECValueHolder`, `ECFile`, `ECModule`, `ECSSH`, `ECQueue`. These aren't user-visible — only plugin authors and runtime contributors see them — so the inconsistency is cosmetic. Worth a sweep eventually for naming consistency, but not a priority.

### 14. `dictionary` / `list` in the JS flavour — the "severe implications" was never tested, and measuring it says it cost almost nothing

The standing assumption has been that implementing `dictionary` and `list` in the JS runtime
would have severe implications. **No rationale for it is recorded anywhere** — not in the packs,
not in `learn/`, not in `AI/`, not in the conversation logs. It was inherited from EasyCoder. What
*was* measured (conversation-017, April 2026) is the consequence of not having them: **8 of 148
scripts could not even compile under the JS runtime** because of `use`, `list` and `dictionary`.

Measured 2026-09-29, now that both runtimes run headlessly (`tools/asviz-run.py --run`,
`tools/asviz-run.js --run`):

**The container types are not missing from JS — only the keywords are.** JS has both shapes under
the spellings `learn/reference/04-collections.md` already documents, and they work: `set X to
object` + `set property K of X to V` + `put property K of X into V` reads back correctly, and
`set X to array` + `set element N of X` does too (a probe printed `100`, `first`, `second`).

**`entry` is half-wired, and asymmetrically.** One spelling per file, because a compile error is
fatal:

| spelling | JS runtime |
|---|---|
| `set X to object` / `set X to array` | works |
| `set property K of X to V` | works |
| `put property K of X into V` | works |
| `X has entry K` / `X has no entry K` | **works** — `Core.js`'s `has` accepts `property`, `element` *and* `entry` |
| `set entry K of X to V` | compile error: "I don't understand 'set'" |
| `put entry K of X into V` | runtime error: "Undefined value: 'entry'" |
| `dictionary X` | compile error: "I don't understand 'dictionary'" |
| `list X` | compile error: "I don't understand 'list'" |

The `has` handler accepting `entry` while its neighbours do not looks accidental, not designed.

**The cost, counted** — browser-relevant scripts, excluding `allspeak-py/` and `tools/`:

| gap | scripts | which ones |
|---|---|---|
| `use` (modules) | 10 | every one a server script (`server.allspeak`, `starter/*/server.allspeak`, `chat/chat-server.allspeak`, `deploy/code/server.allspeak`) plus `diffshow.allspeak` — **none of them browser scripts** |
| `load … from` (file read) | 10 | the same population |
| `save` | 9 | the same population |
| `dictionary` | 3 | the same population, **plus `examples/chemical/parser.allspeak`** |
| `list` | 1 | `parser.allspeak` |

So exactly **one** script is kept out of the browser by `dictionary`/`list`, and it is kept out by
`load … from` as well — file I/O, which is inherently browser-hostile rather than merely
unimplemented. A three-rule mechanical rewrite of it (25 line changes) clears every declaration and
entry-access error and then fails on `load`, which is the honest boundary.

**What that does and does not say.** Selection effect: scripts that would have used a dictionary
were never written for the browser, so the count understates demand. The real cost is not
throughput but the **portability promise** — `parser.allspeak`'s header claims the browser page is
the same parser, and it cannot be one script on both runtimes, which is the fork's premise.

**If this is ever picked up:**
1. **Lower `dictionary X` / `list X` to what the docs already tell JS authors to write**
   (`variable X` + `set X to object` / `set X to array`). Small, and it gives the declarations one
   spelling on both runtimes — the cheapest step towards the portability promise.
2. **Make `entry` consistent** in the JS runtime: accept it wherever `property` is, or stop
   accepting it in `has`. Note `04-collections.md` currently *forbids* each runtime's spelling in
   the other, so this is a design decision rather than a repair.
3. **`use` and file I/O are the bigger gaps** by count — but every script they block is a server or
   desktop script, where Python is the right runtime anyway. The honest reading is that the browser
   is short of *scripts*, not of features.


### 14b. The same question, prototyped — feasible in four edits, but it would mislead rather than help

Built 2026-09-29 as an **in-memory prototype**: `js/allspeak/Core.js`'s text is patched as it is
loaded and never written to the tree (`/tmp/proto/run.js`). Four edits, all in `Core.js`:

1. two compile handlers (`Dictionary`, `List`, ~8 lines each) that lower to `variable X` +
   `set X to object` / `set X to array`;
2. two lines registering them in `_buildCompileHandlers`, the way the file already registers the
   untranslated `ulog`;
3. `case \`entry\`:` beside `case \`property\`:` in `Set.compile`, so `set entry K of X to V` works;
4. `|| token === \`entry\`` in the value parser, so `put entry K of X into V` works. (`has entry`
   already did.)

**Nothing else is needed, and in particular no language pack change:** `dictionary` and `list` are
absent from the `words` map in **all four** packs already — they are untranslated technical
keywords, exactly like `json`, `mqtt` and `viz` — and `Language.word()` falls back to the canonical
when a pack has no entry. The one thing that *must* be true is that the declarations lower to
`keyword: 'variable'`: **18 places test `keyword === 'variable'`** (Core 7, JSON 9, Browser 1,
REST 1), so a distinctive keyword would have to be added to every one of them.

**It works.** With the prototype, `dictionary X`, `list X`, `set entry`, `put entry` and `has entry`
all behave, and `examples/chemical/parser.allspeak` moves from failing at line 43 (`dictionary`) to
failing at line 45 (`load … from`) — file I/O, which is inherently browser-hostile.

**But it would mislead, because the two runtimes' declared lists are different data structures.**
Measured, one spelling per file:

| | Python | JS |
|---|---|---|
| declare | `list X` | `list X` (new) / `variable X` + `set X to array` |
| initialise | `reset X` | done by the lowering — **JS has no `reset` at all** ("I don't understand 'reset'") |
| add | `append V to X` works; assigning to an index that does not exist dies with *list assignment index out of range* | `set element 4 of X to V` **auto-extends** an empty array |
| read | `item N of X` (`put element 0 of Names into First` **does not compile**) | `element N of X` |

So a script written with `list` + `element` would **compile on both runtimes and run on JS while
failing to compile on Python.** Today the failure is unambiguous — the JS runtime says "I don't
understand 'dictionary'". After the addition it would be a silent divergence, which is worse.

And `learn/reference/04-collections.md` already points the wrong way: it documents
`set element 0 of Items to` under the **Python** heading, which is the JS spelling and does not
compile on Python.

**Verdict:** option 1 above, taken alone, is not advisable. Adding the declarations is four edits —
the cheap part — but doing it *properly* means settling one idiom for both runtimes: whether `reset`
exists in JS, whether the accessor is `item` or `element`, and whether index-assign grows the list.
That is a language decision, and the honest conclusion of testing the old assumption is that it was
right in spirit and wrong in location: **the implications are real, and they are in the list
semantics rather than in the declarations.**


### 14c. Decided 2026-09-29 — leave the JS runtime as it is; the visualiser needs nothing

**Graham's rule:** the JS variant must follow the time-honoured JS principle of **adding without
taking away**. If the addition cannot meet that, leave things as they are and work around it in the
visualiser instead.

**Tested against the rule** — 319 `.allspeak` scripts compiled twice, once with the vanilla runtime
and once with the four-edit prototype loaded, comparing per-file verdicts:

| | vanilla | patched |
|---|---|---|
| compiled OK | 149 | 149 |
| **compiled before, failed after** | — | **0** |
| verdict changed at all | — | 4, all `FAIL` → `FAIL` |

So the rule *is* satisfied — nothing is taken away. (The four changes are all the failure moving
*later*: `wordlist` and `asdoc-check-cli` get past the declarations and stop on `url` and `argc`,
values only the Python plugins provide; `parser` stops on `load`; `benchmark` stops on a further
`entry` form.)

**But it still should not be done, for two reasons.**

1. **It doesn't finish anything, it moves a boundary.** The sweep found a **fifth** site the
   four-edit version misses: `log entry \`k\` in D` — Python's preposition is `in` where JS's
   `property` form uses `of`, and it needs another change to the value parser. Every script it
   unblocks then stops on the next Python-only thing.
2. **It would mislead about portability**, per the list-semantics table in #14b: a script written
   with `list` + `element` would compile on both runtimes, run on JS, and fail on Python. Today the
   failure is unambiguous; afterwards it would look portable and not be.

**And the workaround the rule asks for is not needed, because there is nothing to work around.**
The visualiser is already independent of the JS runtime's container vocabulary:

- The **trace format is portable**, so a script the JS runtime cannot run is recorded by the Python
  runtime and drawn by the same picture — `./various/plot examples/chemical/parser.allspeak` works
  today, and `./various/plot --js` draws a JS-recording of the same script.
- **Browser projects are unaffected**: a JS AllSpeak app is written in JS vocabulary and cannot have
  used `dictionary`/`list`, and the JS recorder landed 2026-09-29, so those projects record.
- **`viz.allspeak` itself uses neither** — plain variables and element counts — and runs on both
  runtimes, which is what lets it be the shared framework.

### 15. `the count of <array>` exists in Python and not in JS — and the shared reference implies both

Found 2026-09-29 while working out how a view would walk a parsed JSON trace. `learn/reference/18-json.md`
says a value parsed with `json of` "can be indexed, iterated, or counted with the usual
array/dictionary commands". Indexed, yes, on both. **Counted, no, on JS:**

| | Python | JS |
|---|---|---|
| `put json of Text into Rows` | needs a *typed* target — `list Rows` first (a plain `variable` gives the misleading "I don't understand 'put'", TODO item 8) | works on a plain `variable` |
| `put the count of Rows into N` | **3** ✓ | not a command: "Undefined value: 'the'" |
| iterating | `while Index is less than the count of Rows` | `while Rows has element Index` ✓ (verified, including past the end) |

There is no `COUNT` opcode in any pack, so `count` is a word with nothing behind it in the JS
runtime; Python implements it. The JS idiom is the `has element` guard, which is arguably the
better loop anyway — it needs no separate count and cannot go out of step with the array.

**The documentation fix belongs with this:** `18-json.md` should say how to *iterate*, not just that
counting is possible, because the two runtimes need different loops. Worth doing when `learn/` is
next touched, alongside the Python-list error in `04-collections.md` (#14b).

### 16. `push` / `pop` mean *different things* in the two runtimes, and the `stack` type is Python-only

Found 2026-09-29, following Graham's note that the duplicate-variable-name error bites scratch
variables rather than elements, and that he added a **stack** type so a name can be pushed on entry
and popped on exit and re-used in between.

**In Python it works** — `stack S` + `push 10 onto S` + `push 20 onto S` + `pop V from S` gives
`popped: 20` ✓ (LIFO, and note the form is `pop <target> from <stack>`, not `pop <stack> giving …`).

**In JS there is no `stack` at all** ("I don't understand 'stack'"), which is the same shape as
`dictionary` / `list` (#14). But the words themselves diverge *harder* than those two do:

| | Python | JS |
|---|---|---|
| `stack S` | declares an `ECStack` | not a keyword |
| `push 10 onto S` | pushes onto that stack | `push {value}` is the **argument stack** (`Core.js` `PUSH: this.Push`) |
| `pop V from S` | pops the stack into `V` | `pop [into] {variable}` is the **call stack** |

So the *same two words* name a declared collection on one runtime and parameter passing on the
other. A script that reaches for the Python idiom in JS therefore fails in a way that has nothing to
do with what it meant — worse than a plain absence, because the words are there.

**And the type is undocumented:** `learn/reference/04-collections.md` presents "the four shapes" —
variable arrays, object properties, key-value collections, ordered sequences — and a stack or queue
is not among them, though both exist in Python (`ECStack`, `ECQueue`, and `k_queue`). Worth adding
there when `learn/` is next touched, with the cross-runtime note.

**Consequence for the view:** it must run in the JS runtime, so it cannot use a stack for its scratch
values; it names them by role instead (`TY0`…`TX3`), which for a view reads better anyway. An
element or a value that only Python can hold is not available to the third view at all.

### 17. The divergence map — where the two runtimes actually differ, and why it is not the opcodes

Gathered 2026-09-29, after Graham said the alignment question was "too complex for me to visualise
and judge". That is the problem to solve: not to opine, but to make it visible. Every row below was
*measured* this session, not read off a document.

**The engine is already in line.** All **151** opcodes the packs name are dispatched by the JS
runtime when its plugins are loaded — core 101, browser 34, json 11, mqtt 3, rest 2 — and Python
implements 97 of them under the same names (and the 54 it does not are the browser, json, mqtt and
rest families — exactly what you would expect — so the measure looks sound, though note it is a proxy:
method *presence*, where the JS figure came from asking each domain for a handler, which is the real
dispatch path). So "implement the missing opcodes" is not the work.

**The surface language is where the two part company, and none of it is an opcode.** Declarations and
value/statement forms are compile-time vocabulary, so the packs cannot show a difference at all:

| | Python | JS | kind |
|---|---|---|---|
| `dictionary X` | declares `ECDictionary` | not a keyword — `variable X` + `set X to object` | declaration |
| `list X` | declares `ECList` | not a keyword — `variable X` + `set X to array` | declaration |
| `stack X` / `queue X` | declares one | not a keyword | declaration |
| `push 10 onto S` / `pop V from S` | the declared stack | **the argument and call stacks** | same words, different meaning |
| a list's accessor | `item N of X`; grown with `append` | `element N of X`; `set element N of X to V` grows it | value/statement form |
| `the count of X` | the length | no such form — `while X has element N` | value form |
| `entry K of X` | dictionary access | **works** — the `has` condition accepts `entry`; `set entry` / `put entry` do not | half-wired |
| `use <module>` | modules | not a keyword | declaration |
| `load` / `save` | file I/O | `rest get` / `rest post` | statement form |
| `json of <string>` into a plain variable | needs a typed target | works | strictness |

**Two readings follow, and they point opposite ways.**

- *Towards a port*: the surface differences are few and each looks small in isolation — four
  declarations, one count, one accessor.
- *Away from it*: `04-collections.md` is built **on** the difference (its whole point is that the JS
  column is not a valid fallback in Python), so unifying the surface contradicts a documented design
  decision rather than filling a gap; and each change is visible to every existing script, which is
  what the "adding without taking away" rule exists to prevent.

**The recommendation, and the reason it is the cheap one:** the engine is already aligned, so the
work worth doing is **documentation and visibility, not porting** — the three doc defects fixed
alongside this note (the Python list example, the iteration loop, the missing stack shape) were each
found by using the thing, and a reader could not have known any of them from the page. If the
divergence is ever to be closed, the honest order is: keep the map current, and let *demand* choose
the next entry — which is what the visualiser did here (it found #15 and #16 within an hour of being
pointed at real scripts).

### 18. JSON pretty-printing: `prettify` and the save path are Python-only

Found while fixing the editor's JSON display, and a file-level divergence rather than a keyword one —
the same script writes a *different file* under each runtime.

| | JS | Python |
|--|--|--|
| `prettify Text` | **no such form** | `json.dumps(item, indent=4)` — see `as_core.py` `v_prettify` |
| `save` of a dict/list | `JSON.stringify(content)` — **compact** | `json.dumps(content, indent=2)` |
| `save` of a JSON *string* through a `.json` name | written as given | re-dumped, `indent=2` |
| `json format X` | `JSON.stringify(val, null, 2)` | present |

So `diffshow.allspeak`'s `save prettify Conf to ...` is Python-only — correct for that program, which
is a Qt one, but it is language-visible. And the two paths inside Python disagree: `prettify` indents
by 4, the save path by 2.

**Recommendation: document, don't port** — the same call as #17, for the same reason. The one thing
worth keeping in step is the *display* side, which is where the editor's fix sits: it formats on open
with the JS runtime's own `json format`, whose two-space indent matches Python's save path, so a file
the editor touches looks like its neighbours. It also reformats only a **single-line** file, leaving a
laid-out file at whatever indent its author chose — "adding without taking away".

## Resolved

### 2026-04-29 — `on failure` recovery clause added as alternative to `or`
Adds an explicit recovery-handler form that mirrors event-handler vocabulary (`on click`, `on mqtt connect`, ...). Semantics identical to `or` (always continues after the handler runs); difference is readability — `on failure` clearly signals "recovery, then continue" where `or` can read as alternation. Both forms supported across both runtimes; both single-statement and `begin ... end` block forms work. Implementation: new `compileFailureClause` helper in JS Compile.js consolidating the 9 inline `or`-clause sites; Python `processOr` extended in 3 places (core, email plugin, sql plugin); new `failure` canonical in all 4 language packs (`failure` / `fallimento` / `échec` / `fehlschlag`). Test in `/tmp/test-onfailure.allspeak`-style scripts. Surface forms: `on failure`, `su fallimento`, `sur échec`, `bei fehlschlag`.

### 2026-04-27 — JS gmap plugin missing single-marker remove, marker IDs, structured bounds
`js/plugins/gmap.js` extended: added `set the id of Marker to V` (stores per-marker arbitrary string, accessible from click handler via `the id of Marker`); single-marker `remove marker X from Map` (was multi-only); structured bounds via `the north|south|east|west edge of Map` (returns scalar) and `the edges of Map` (returns JSON dict `{north,south,east,west}`). The pre-existing `remove markers from Map` and `set color of Marker` were already in place; `on move Map` / `on zoom Map` already wired in `setupMap`. Both `js/plugins/gmap.js` and `dist/plugins/gmap.js` refreshed.

### 2026-04-27 — Python SQL plugin had no runtime query execution
`allspeak-py/plugins/as_sql.py` was DDL-only (generated `CREATE TABLE` strings). Added connection management (`database X` / `connect X to sqlite \`path\``), parameterised query execution (`sql select Row from X with QUERY and V1 V2 ...`, `sql exec on X with QUERY [giving NewId]`), and transactions (`sql begin/commit/rollback X`). Single-row select returns a `dictionary`, multi-row a `list`; `or begin ... end` error blocks fire on DB exceptions and on single-row no-match. Test in `allspeak-py/testsqlite.allspeak`. Items 9–11 were latent issues surfaced during this work.

### 2026-04-27 — Editor UI strings (`asedit.allspeak`) only translated for IT
The editor displayed English `Open`/`Find`/`Save` etc. for FR and DE because `asedit.allspeak` had only `if Lang is \`it\` ... else [English]`. Added `else if Lang is \`fr\`` and `else if Lang is \`de\`` branches with full string sets.

### 2026-04-27 — Starter `CLAUDE.md` had no array idiom; AI generated parallel numbered variables
TicTacToe runs in all four languages produced `variable Score0`, `variable Score1`, ... `variable Score8` etc. — anti-pattern across all 4 languages because the array idiom (`set the elements of X to N` + `index X to N`) wasn't documented anywhere in the starter pack. Added an `## Arrays` / `## Tableaux` / `## Array` / `## Arrays` section to all four starter `CLAUDE.md` files showing the canonical idiom, the DOM-array-with-`on click` pattern, and an explicit "do not create parallel numbered variables" warning.

### 2026-04-27 — Starter `CLAUDE.md` didn't warn against `end on`
EN test project's AI-generated code wrote `on click Cell ... end on`. There is no closing `end on` form: `on click X` takes a single statement, or a `begin ... end` block (closed by `end`, not `end on`). Added a guardrail line to the "Strict syntax guardrails" section in all four starter `CLAUDE.md` files.

### 2026-04-27 — Unmapped pattern words across DE/FR/IT
For 9 opcodes (`END_TRY`, `HISTORY_FORWARD`, `JSON_FORMAT`, `MQTT_SUBSCRIBE`, `MQTT_ON_CONNECT`, `ON_CLOSE`, `ON_ERROR`, `SEND_MESSAGE`, `SET_ENCODING`) the patterns used surface words that didn't reverse-map to any canonical, so the compiler emitted "Unrecognised syntax". Fixed by extending the words map: added canonicals `forward`, `topic`, `error`, `sender`, `encoding`; extended existing `format`, `close`, `try`, `connect` with the surface form used in the pattern. Both `js/allspeak/` and `dist/` copies refreshed.

### 2026-04-27 — DE `attach` / `to` / `an` mismatch
`Browser.js` `Attach.compile` calls `compiler.isWord(\`to\`)`, but the DE pack mapped `"to": "zu"` while the `attach` pattern declared `an`. Fixed by `"to": "zu|an"`. Class: wrong-canonical mismatch (item #1 above) — the canonical kind of bug not catchable by the static unmapped-words audit.

### 2026-04-26 — Quick Reference missing `random` / `wait` / `fork`
Primer's TicTacToe example (`deploy/<lang>/primer/tab2.md`) required these commands but they weren't in any starter pack's quick reference, leaving the user's AI agent unable to write the code. Added idiomatic example lines to all four starter `CLAUDE.md` files (en/fr/it/de). Long-term fix tracked as item #5.

### 2026-04-22 — Italian event canonicals backfilled
`drop`, `change`, `leave`, `restore`, `resume`, `that` added to `it.json` words map (`rilascia`, `cambio`, `lascia`, `ripristina`, `riprendi`, `che`). Italian `on drop` / `on change` / etc. now resolve correctly.

### 2026-04-21 — Multi-word While keyword (`tant que X`)
`Core.js` `While.compile` now does an optional `skipWord('that')` between the keyword and the condition. Joiner exposed via `"that": "que"` (French), etc.

### 2026-04-21 — Canonical event names missing from `en.json`
`change`, `leave`, `restore`, `resume`, `drop`, `that` now explicit self-referencing keys in `en.json` `words`. Translated packs override when the natural form differs.

### 2026-04-21 — Hardcoded English keywords in `Core.js` handler table
`Core.js:2571-2578` (`log`, `release`, `continue`, `no`, `test`, `goto`, `subtract`, `endTry`) now resolve through `lang.word(...)` like `begin` / `end` / `script` already did.

## Tooling

### Unmapped-words audit
Static check: every non-keyword word in any pattern reverse-maps to *some* canonical. **Does not** catch wrong-canonical mismatches (item #1). Save / re-run anytime, especially after editing a pack:

```python
import json, re
for lang in ['en', 'de', 'fr', 'it']:
    with open(f'js/allspeak/LanguagePack_{lang}.js') as f:
        m = re.search(r'=\s*(\{[\s\S]*\})\s*;?\s*$', f.read())
    data = json.loads(m.group(1))
    forms = {}
    for canon, fs in data.get('words', {}).items():
        for w in fs.split('|'):
            forms.setdefault(w, set()).add(canon)
    unmapped = []
    for cmd, info in data.get('opcodes', {}).items():
        for pat in info.get('patterns', []):
            for i, t in enumerate(pat.split()):
                t = t.strip(',.')
                if i == 0 or t.startswith('{') or t.startswith('[') or '|' in t:
                    continue
                if not re.match(r"^[a-zàâäáçéèêëíîïñóôöúûüšž߀ßẞœæ']+$", t.lower()):
                    continue
                if t.lower() not in forms:
                    unmapped.append((cmd, pat, t))
    print(f'{lang}: {"clean" if not unmapped else unmapped}')
```

---

## 2026-10-05 — one word can mean two, and the Python grammar asked the wrong question

**Found while adding translated messages, and it is the largest language defect this file has recorded.**

A language pack maps canonical English → local forms, and the runtime builds the *reverse* map from it. That
map is **many-to-one, and therefore lossy**: where a language spells two English words the same, it keeps one
and the other becomes invisible.

```
fr   dans -> in | into        à -> than | to       pas -> not | step      contient -> contains | includes
it   e -> and | is            di -> of | than       a -> a | to           per -> by | for
de   von -> from | of         mit -> by | with      in -> in | into       als -> as | than
```

Measured across fr/de/it: **42 forms are ambiguous** (fr 10, de 13, it 19), and **37 (canonical, form) pairs —
28 distinct words — cannot be reached by a reverse lookup at all**. English has **none**, out of 376 forms, which
is why this went unnoticed for so long.

**The JavaScript grammar never asks that question.** It asks the pack whether a token *is a form of* a word —
`matchesWord(token, 'than')` — which is unambiguous. The Python grammar asked `language.reverse_word(token) ==
'than'` in **32 places**, and every one of them silently failed in whichever languages spelled that word the way
another word is spelled:

| what a user wrote | language | what happened |
|---|---|---|
| `tant que N est inférieur à 3` | fr | `Je ne comprends pas 'tant'` — `à` answered `to`, so `than` was unreachable, and a **loop could not run under Python in any language but English** |
| `solange N ist kleiner als 5` | de | worked: `als` answers `than` (and it is `as` that was dead) |
| `record le script dans \`…\`` | fr | the `in` of the plugin's grammar could not be written |
| `si T contient \`jour\`` | fr | `'Core' object has no attribute 'c_contains'` — the condition *type* is a name the runtime looks a handler up by, and `contient` answers `contains` |
| `se T esiste` | it | the same for `exist`/`exists` |
| `journalise la valeur de N` | fr | `as_value.compileValue: Cannot get the value of "la"` — two value compilers, and the one `log` uses did not skip a leading article |

**Fixed:**

1. **32 comparisons** across 6 files — `as_core.py` 21, `as_viz.py` 4, `as_mqtt.py` 3, and one each in
   `as_condition.py`, `as_graphics.py`, `as_sql.py`, `as_server.py` — now `language.matches_word(...)`.
   Provably a no-op under English, where the two questions have the same answer for every token.
2. **`k_while`'s optional joiner** — `Core.js`'s `While.compile` has accepted `while that X` since 2026-04-21 and
   `as_core.py` never did, so `tant que` (fr), `che` (it) and `dass` (de) could not be written. The Python form is
   a *lookahead* (`nextCondition()` advances past the keyword itself), which is why the obvious mirror does not
   work.
3. **The condition type**, in `compileCondition`: when the reverse answer names no `c_<type>` handler, the pack is
   asked which *other* canonical the same token is a form of (`Language.canonicals_of`, new) and that one is used.
   General, and needs no list of pairs to keep in step with the packs.
4. **`as_value.compileValue`'s article** — it called `skipArticles()`, which only looks *past* the cursor while
   `getToken()` does not advance, so the article was never skipped.

**Verified.** All 323 tracked scripts compile to the **same set** before and after (52), under the Python runtime;
three probe scripts — one per language, using the forms the tutorials use — now print what the English equivalent
prints; and the whole check suite passes.

**Still open, and neither is a one-liner:**

- **Two value compilers.** `as_core.compileValue` knows the rich forms (`the value of`, `the json count of`,
  `the timestamp of`) and `as_value.compileValue` does not, and `log` uses the second: `log the json count of T`
  prints `0` under the JS runtime and fails to compile under Python with `I don't understand 'of'`. The article
  half is fixed; this half is a design decision, because `as_value` is the *value protocol* shared with plugin
  domains and may deliberately not depend on core's vocabulary.
- **The packs' `conditions` section is dead code.** Only `en` has it (fr/de/it have none), and nothing calls
  `Language.condition_word` — checked, zero call sites. Either it is wired up or the section is deleted.

**And the guard is in `./sync-language-packs`** (`check_grammar`): it fails, naming the file and line, when a
Python site compares a reverse lookup against a word that is dead in some pack. It named all 32 before the fix, it
is clean now, and it is re-evaluated from the packs on every run — so a new word, or a new language, cannot
reintroduce the class quietly.
