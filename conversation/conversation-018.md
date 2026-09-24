# 2026-09-23

## 19:11

I have a need for "is uppercase" and "is lowercase" (also accept "is upper/lower case")

**Assistant**

Done, in both runtimes. `is uppercase` and `is lowercase` are now conditions, and `uppercase X` is now a value expression in JS too.

**Semantics** (your call: require at least one letter) — a value passes only if it holds at least one cased letter and every cased letter is in that case, i.e. Python's `str.isupper()`/`islower()`. So `ABC-123` is uppercase, while `Hello`, `123`, `""` and a number or boolean are neither (nothing is ever both). Accepted spellings: `is uppercase`, `is upper case`; `is lowercase`, `is lower case`. `is not uppercase` / `is not lower case` negate as usual.

**What changed**
- `js/allspeak/Core.js` — a shared `_AllSpeak_isCased` helper (folds to the opposite case as its presence test), two compile cases in the `is` switch, two test cases. The two-word spellings work through `upper`/`lower` plus an optional `case`, tokens that are not pack words, so only an English script can reach that branch.
- `js/allspeak/LanguagePack_{en,fr,it,de}.js` — `uppercase` word added (EN also gets it in the `conditions` map): `majuscule`, `maiuscolo|maiuscola`, `großbuchstaben|grossbuchstaben`. I also added the feminine `minuscola` to the existing IT `lowercase` so `è minuscola` reads naturally.
- `allspeak-py/allspeak/as_core.py` — `uppercase`/`lowercase` in the `is` list, `c_uppercase`/`c_lowercase` over a shared `_isCased` (which is just `str.isupper()`/`islower()` behind an isinstance check), and the same two-word spelling. `./sync-language-packs` refreshed the four JSON packs.
- JS value expression `uppercase X` added next to `lowercase X` — closing the gap you approved (Python already had `v_uppercase`).
- Docs: `learn/reference/06-conditions.md`, `spec/allspeak-language-contract.md` (new rule 10), `resources/doc/en/core.json`, and the Python doc set (`conditions/uppercase.md`, `conditions/lowercase.md`, README list, Prev/Next chain).
- Conformance: `conformance/tests/EC-0015-case-conditions.{as,json}` plus the index entry — green in both implementations.
- Rebuilt: `./build-allspeak` (deploy/dist/allspeak.js + -min.js contain the change) and `./deploy-sync`.

**Verification** — one script per language run through both runtimes, plus the suites. JS and Python produce byte-identical output on the same English script (fifteen assertions: both spellings, both cases, negation, mixed case, digits, empty, a number, and the `uppercase` value form). FR/IT/DE also verified in both: `est majuscule`, `è maiuscolo`/`è maiuscola`, `ist großbuchstaben` and `ist großbuchstaben` with ss. Python conformance is unchanged at 12 pass / 3 fail, JS at 13 pass / 2 fail, and EC-0015 passes in both — no test that passed before fails now.

**Findings** (separate from the feature — your call what to do with each)
1. **French negation was broken in the Python runtime, and I fixed it.** `reverse_word('pas')` answers `step`, not `not`, because the FR pack maps both `not` and `step` to `pas` and the later key wins the reverse map — so `si N est pas 0` was a *compile error* in Python while JS handled it (JS checks with a form-aware lookup). One line in `compileCondition` now uses `matches_word(self.peek(), 'not')`, mirroring JS's `isNegate`, and the FR negation cases now agree with JS. Worth knowing it was silent-broken for every negated condition, not just the new ones.
2. **Non-English value keywords don't work in Python** — pre-existing. The value-keyword list in `as_core.py` compares raw tokens, so `minuscule X` / `kleinbuchstaben X` / `minuscolo X` all fail there today ("Cannot get the value of..."), while the JS runtime resolves them through the pack. Because of this my new `uppercase X` works in all four languages in JS but only in English in Python. Same root cause, one fix; I left it alone.
3. **Conformance has pre-existing red tests.** EC-0007 and EC-0009 fail in JS and Python, and EC-0008 fails in Python only — all on `string S` as a declaration, which the EN pack doesn't define (only `variable` does; `use` and `integer`/`float` are missing too, which is also why `allspeak-py/tests/fizzbuzz.as` won't compile in either runtime). I verified each fails identically at HEAD, so nothing here is from my change; the one-word fix is `string` → `variable` in the two test scripts.
4. **`./sync-language-packs` wanted to delete `shape` and `roundrect`** from `allspeak-py/allspeak/languages/en.json`. They were added to that JSON in 16bef9f (`2608282155`) for the Python graphics work but were never added to `js/allspeak/LanguagePack_en.js`, which is meant to be the source of truth. I restored them and left the JS pack alone — but the two are out of step, and the next sync will drop them again unless you either add them to the JS pack or decide the Python side owns extras.
5. **The FR/DE doc caches are stale.** I added the English entries and ran `tools/generate-translated-docs.py fr de`, which correctly produced `majuscule`/`minuscule` and `großbuchstaben/grossbuchstaben` entries — but it also swept in about 39 files of unrelated pending drift (e.g. `zu` → `zu/an`, `auf` → `bei`, `has entry` → `hat eintrag`, `hash` descriptions). I reverted those files rather than land unreviewed translations inside a feature change; run the generator when you're ready to review that drift, and note it doesn't cover `it/` at all.
6. Two smaller ones: `learn/reference/08-strings-and-text.md` already documented `uppercase X`, and `resources/doc/en/core.json` listed it as Python-only — both were doc/code disagreements that this change resolves. Python's `Core.isNegate` (`as_core.py`) has no callers; I inlined the equivalent check rather than wire it up.

**For your review**: the three non-English word choices (FR `majuscule`, IT `maiuscolo|maiuscola`, DE `großbuchstaben|grossbuchstaben` — I followed the existing `kleinbuchstaben` lowercase-noun style), and the fact that the two-word spelling is deliberately English-only, since `upper case` is an English idiom and the other packs use their single word.

Nothing here is committed — the working tree also still holds your viz work, so I left the commit to you.
