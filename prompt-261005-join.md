# Build the `join` keyword — AllSpeak, in both runtimes

A work order. It assumes no context beyond the repository; read `AI/README.md` and
`AI/ALLSPEAK_CODING_GUIDELINES.md` first, as `AGENTS.md` requires, and `TODO-language.md`'s sections on `join`
for how this was arrived at.

## What it is, and why

`split` takes a value and fills a named holder with one slot per line. **`join` is its inverse: it takes a whole
holder and makes one value out of it.** Nothing in the language can say "this whole holder, as one value" today:
a bare holder name everywhere else means *the slot the cursor is on* — `put A into B` copies one slot, and
`json of` a holder gives one slot — and both are measured. So `join` is the exception, made deliberately, in the
same way `split` already makes it in reverse.

## The syntax

    join MyArray into SingleValue                   ! the elements joined, no delimiter
    join MyArray with `,` into StringValue          ! the elements joined by a comma
    join MyArray as json into SingleValue           ! one json value
    join from 4 to 9 of MyArray into SingleValue    ! a range of them, which may be combined with the above
    join from 4 to 9 of MyArray as json into V

One shape, three optional modifiers: `from N to M of` narrows the source, `as json` chooses the result's form,
and `with <delimiter>` gives the text form its separator. **A bare name after `join` always means the whole
holder** — that is what the keyword is for.

**Graham's spelling was `join MyArray to json SingleValue` and `join MyArray to StringValue with ','`.** The
alternative above was suggested because `to` then does two jobs in his second example — `index MyArray to N`
followed by `join MyArray to json MyArray`, where the same token means the set on one side and a slot on the
other — and because the language already uses `into` for "the slot you are about to write" in `put V into X`.
**His call, and he has not ruled on it.** If the spelling stays with `to`, check whether a bare `MyArray` after
`to` means the slot (it must, for form two above to make sense) and document the asymmetry where a reader will
find it.

## The semantics, including the range

- **`join from N to M of X` is the half-open slice X[N:M]** — "consistent with normal string and array
  handling", Graham's qualification of 2026-10-05. So **`from 4 to 5` is one element** and **`from 4 to 4` is
  empty** — an empty string for the text form, an empty json value (`[]`) for `as json`. Out-of-range bounds
  clamp rather than raise, and a range with `M < N` is empty.
- **The result of `as json` must be a json *value*, not its text.** In JavaScript an `ECValue`'s content is
  *text* and json-ness is recognised, so this means producing exactly the text the `json` word's commands
  produce — `json set … to array` and `json add …` — rather than a native array, which would not be recognised.
  In Python the compiled script is never serialised and the content is a real object, so it is a real list.
  **Graham's explanation of the split, 2026-10-05**: JS descends from a product whose compiled script had to be
  serializable; Python abandoned that. It is why this keyword must be tested in both runtimes rather than
  assumed to agree.
- **`json` produces the same thing the `json` command set produces.** Check that the reader the caller uses
  accepts it: `the json count of`, `the json keys of`, `element N of`, `has element`.

## The template to mirror

`split` is the model, in both runtimes.

**JavaScript** — `js/allspeak/Core.js`. The `Split` domain entry has both halves:

- `compile` (~line 2647) reads an optional target symbol, the value, an optional `on`/`by` and an optional
  `giving`/`into`, then `addCommand({domain: 'core', keyword: 'split', lino, item, on, target})`;
- `run` does `program.getValue(command.item).split(on)`, sets `targetRecord.elements` and fills
  `targetRecord.value[n]` with `{type: 'constant', numeric: false, content: …}` entries.

**`join` is those two halves with the direction reversed**: the compile half takes a *symbol* where `split` takes
a *value*, and the run half **reads** `elements`/`value[n]` where `split` writes them. The modifiers, the target
type check (`is not a variable`), the `lino` handling and the warnings all follow `Split`.

**And do not miss the second registration site**: `Split` appears twice in `Core.js` — the domain entry, and
again in the opcode table (`SPLIT: this.Split`, ~line 3420). A new keyword needs both, and forgetting the second
is the kind of fault this file's history is full of.

**Python** — `allspeak-py/allspeak/as_core.py`. The same pair is `k_split` (compile, ~line 2061; uses
`nextIsSymbol`, `getSymbolRecord`, `add`) and `r_split` (run, ~line 2080; uses `getVariable`,
`getSymbolValue`, `object.setElements`, `setIndex`, `setValue`). Mirror them as `k_join` / `r_join`.

## The words

The pack lists **words with their grammar patterns** — a phrase search finds nothing, which cost half an evening
on 2026-10-05. Add `join` to all four JS packs (`js/allspeak/LanguagePack_{en,fr,de,it}.js`) and mirror with
`./sync-language-packs`, which writes the Python JSONs and refuses a mismatch.

**The English word is known; the other three are not.** Add `join` as the accepted spelling in all four and mark
the French, German and Italian entries as provisional for a native eye — the same treatment the `runtime:`
sentence in the starter packs' `AGENTS.md` currently carries.

## Verification, and what "done" looks like

1. **One probe per runtime, asserting on values.** The failure this whole exercise came from was a claim made
   without one: a holder of three slots, `join`ed `as json`, must answer `the json count of` **3**, and
   `element 1 of` it must give the second element. Then the range cases: `from 0 to 1` gives one element,
   `from 4 to 4` gives an empty value, and both the text and the json forms are checked.
2. **In both runtimes.** JS with `tools/asviz-run.js`, Python with `tools/asviz-run.py`. They are not expected
   to agree on the *representation* — see above — only on what the reader sees.
3. **A check that stays.** `conformance/` is the cross-implementation suite; add a case there so the next
   person does not have to write a probe. `tools/` is where a *tool's* checks live.
4. **The sweep still compiles.** `python3 /tmp/compile-sweep.py`-style: the tracked `.allspeak` set must compile
   identically before and after, since the keyword is additive.
5. **`./build-allspeak`** afterwards (the JS bundle carries the new opcode), and the four `deploy/dist/asedit.*`
   files restored if the build overwrites them.
6. **The reference**: `learn/reference/` has no chapter for `join`; the string/variable chapter it belongs to
   should list it beside `split`, with the half-open range stated. Check which chapter that is — the reference
   is 23 files and the earlier note that a rule was missing from it was checked across all of them.

## Release, not deploy

The keyword lives in the **runtimes**. The browser gets it from `allspeak.js` / `allspeak-min.js` on a **deploy**;
the Python CLI needs a **release** of `allspeak-ai`, whose version is bumped in
`allspeak-py/allspeak/__init__.py`. Both halves reach a user only when each has happened, and the JavaScript half
is the one the Graph pane runs.
