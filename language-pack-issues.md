# AllSpeak language-pack issues

Living tracker for open and resolved issues in the per-language pack files (`js/allspeak/LanguagePack_<lang>.js`) and the runtime's handling of them. Refer to this before starting cross-language pack work — to avoid duplicating closed items and to surface things that should be tackled together. Update when new issues are found or fixed.

## Open

### 1. Wrong-canonical pattern mismatches (no automated detection yet)
A pattern uses surface word X; X is mapped to canonical Y in the words map; but the `compile:` function in `Core.js` / `Browser.js` / `MQTT.js` / etc. expects canonical Z. The DE `attach` bug (closed 2026-04-27) was the first instance found: `attach` pattern used `an`, `an` mapped to canonical `an` (the indefinite article), but `Attach.compile` called `compiler.isWord(\`to\`)`. The unmapped-words audit (below) does **not** catch this class — it only flags words that map to no canonical at all.

Detecting more requires scanning every `compiler.isWord()` / `nextIsWord()` / `skipWord()` call across the JS runtime and cross-referencing the canonical asked for against what each language pack's pattern declares. Doable but bigger. Defer until next user report or a batch session.

### 2. `patterns` arrays are documentation-only
The compiler dispatches by `keyword` alone; literal words after the keyword in a pattern are not enforced — the runtime accepts whatever the handler reads via `isWord()`. Means a pattern can silently drift from runtime expectations until a user happens to rely on the declared form. The While patch (item closed 2026-04-21) works around this for one specific case. A proper fix would route compilation through the patterns array — bigger refactor.

### 3. Browser condition `element X has focus` — `has` collides in FR
`has` would need to be in the words map, but `a` (the natural French translation of `has`) collides with the `a` HTML anchor tag keyword. Not yet resolved.

### 4. Plugin-declared elements not available in headless compile checks
`gmap` (gmap plugin), `animation` (svg plugin) fail when plugins aren't loaded — affects English and translated scripts identically. Testing-infrastructure limitation, not a translation issue: step16 / step19 / step20 fail the same way in EN and FR harness runs.

### 5. Quick Reference in starter `CLAUDE.md` is hand-maintained
Each `starter/<lang>/CLAUDE.md` carries a hand-translated subset of the language in its Quick Reference block. Drift between this and `LanguagePack_<lang>.js` is the failure mode that bit us with random/wait/fork on 2026-04-26. Long-term fix: generate the Quick Reference from the language pack with a template format that distinguishes generated regions from hand-written prose. Deferred — needs design.

### 6. Localized error messages — coverage check pending
Each pack has a handful of translated error strings (`"syntaxError"`, `"runtimeError"`, …) but full coverage hasn't been verified. Some runtime error paths probably still emit English. Worth a sweep when next we touch error reporting.

### 7. `LanguagePack_<lang>.js` vs `languages/<lang>.json` source-of-truth unclear
The JS pack header says "auto-generated from languages/<lang>.json", but no generator script is checked in (or none I've found). Hand-edits to the JS likely leave the JSON stale. Confirm whether anything still reads the JSON, then either delete it or wire up the generator.

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

Methodology when tackling this: study the larger scripts already in the repo as worked examples — `chat/chat-main.as`, `asedit.as`, `allspeak.as`, `codex/<lang>/code/step12.as`–`step20.as`, `primer/project.as`, plus whatever lands under `examples/` (Graham plans to populate this with past EasyCoder projects; current contents `dice`, `imageswitcher`, `usercapture`) — and ask Graham to explain *why* particular constructs are used. Some idiomatic choices reflect tacit experience that won't surface from reading code alone. Don't try to invent the curriculum from first principles.

EasyCoder scripts are valid sources too: AllSpeak was a global rename of EasyCoder (per project root `CLAUDE.md`), so EN-language idioms in `.ecs` files map directly. The non-trivial part is generalising idioms across languages, not translating them.

Distinct from #5: that item is about keeping the existing Quick Reference auto-synced with the language pack. #12 is about adding a new, larger guide that doesn't currently exist.

### 13. (low-priority, cosmetic) Internal Python class names still carry `EC` prefix
The 2026-04-06 EasyCoder→AllSpeak global rename caught file paths, package names, the `.as` extension, and source-level identifiers, but internal Python classes still carry the EC prefix: `ECValue`, `ECVariable`, `ECDictionary`, `ECList`, `ECObject`, `ECValueHolder`, `ECFile`, `ECModule`, `ECSSH`, `ECQueue`. These aren't user-visible — only plugin authors and runtime contributors see them — so the inconsistency is cosmetic. Worth a sweep eventually for naming consistency, but not a priority.

## Resolved

### 2026-04-27 — JS gmap plugin missing single-marker remove, marker IDs, structured bounds
`js/plugins/gmap.js` extended: added `set the id of Marker to V` (stores per-marker arbitrary string, accessible from click handler via `the id of Marker`); single-marker `remove marker X from Map` (was multi-only); structured bounds via `the north|south|east|west edge of Map` (returns scalar) and `the edges of Map` (returns JSON dict `{north,south,east,west}`). The pre-existing `remove markers from Map` and `set color of Marker` were already in place; `on move Map` / `on zoom Map` already wired in `setupMap`. Both `js/plugins/gmap.js` and `dist/plugins/gmap.js` refreshed.

### 2026-04-27 — Python SQL plugin had no runtime query execution
`allspeak-py/plugins/as_sql.py` was DDL-only (generated `CREATE TABLE` strings). Added connection management (`database X` / `connect X to sqlite \`path\``), parameterised query execution (`sql select Row from X with QUERY and V1 V2 ...`, `sql exec on X with QUERY [giving NewId]`), and transactions (`sql begin/commit/rollback X`). Single-row select returns a `dictionary`, multi-row a `list`; `or begin ... end` error blocks fire on DB exceptions and on single-row no-match. Test in `allspeak-py/testsqlite.as`. Items 9–11 were latent issues surfaced during this work.

### 2026-04-27 — Editor UI strings (`asedit.as`) only translated for IT
The editor displayed English `Open`/`Find`/`Save` etc. for FR and DE because `asedit.as` had only `if Lang is \`it\` ... else [English]`. Added `else if Lang is \`fr\`` and `else if Lang is \`de\`` branches with full string sets.

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
