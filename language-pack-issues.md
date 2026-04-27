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

## Resolved

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
