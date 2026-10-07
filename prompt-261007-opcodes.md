# `spec/opcodes.json`: the twelve opcodes it has not got — and what the file is for

A work order for a session picking this up cold. Read `AI/README.md` and `AI/ALLSPEAK_CODING_GUIDELINES.md`
first, as `AGENTS.md` requires, then `TODO-language.md`'s "**The opcode table, and an event that is not in
it**".

## What is already done, so it is not redone

The `wheel` gap that led here is **closed** and guarded, as of 2026-10-07:

- `Opcodes.js` has `case 'wheel': return 'ON_WHEEL'` in the `on` group, and the note that used to sit there —
  which said a wheel "resolves to no opcode and is dispatched by keyword", **and was wrong about both** — is
  replaced by the trap that belongs there: an unlisted action gets the group's `default`, `ON_CLICK`, so a
  missing case is **silently mislabelled** rather than refused.
- `Browser.js`'s opcode map has `ON_WHEEL: this.On`.
- `spec/opcodes.json` gained `ON_WHEEL` **and** `ON_HOVER`, and `ON_PICK`'s description was corrected from
  "file picker selection" to "a pointer press on an element". **Its `ON_` group is now complete against the
  resolver — 18 for 18 — which `tools/opcode-check.js` asserts.**
- `tools/opcode-check.js` is the new guard. It compiles each event from **the pack's own pattern**, checks
  the opcode it is stamped with, the dispatch-map entry, and the spec entry's action; and it **fails if it
  skipped anything**, because a skip is not a pass.

## What is left

**Twelve opcodes that `Opcodes.js` can return and `spec/opcodes.json` has never listed**, none of them events:

| opcode | where the resolver returns it |
|---|---|
| `VIZ` | `resolveCore`, the `viz` instrumentation marker |
| `BEGIN`, `END`, `IF` | `resolveCore`, block syntax |
| `INCREMENT`, `DECREMENT` | `resolveCore` |
| `PARAM`, `SCRIPT`, `CLOSE_MODULE`, `NO_CACHE` | `resolveCore` |
| `MQTT_CONNECT`, `MQTT_TOPIC_INIT` | `resolveMqtt` |

`VIZ` has been missing since at least `conversation-033`; the others were found by comparing the resolver's
returns with the file on 2026-10-07. **Re-derive the list rather than trusting it** — the comparison is a
one-liner over the two files, and the twelve are what it gave then, not a promise about now.

## The rule that makes this more than typing

**An entry must be derived, not invented** — and the whole reason this file is being touched is that a
description in it was wrong and misled two sessions. For each entry, the fields are answerable from named
places:

- `domain` — which of the resolver's `case` groups returns it;
- `current.keyword` and `current.action` — what `Compile.js` puts on the command (an `action` must match what
  a compiler case actually produces; `tools/opcode-check.js` already asserts exactly this for the `ON_`
  group, which is the demonstration that it is knowable);
- `params` — the parts a script writes, as the sibling entries list them;
- `description` — **the one place a guess is tempting and wrong**. Take it from the code that consumes the
  opcode, in its own words: `Core.js`'s handler for it, or the plugin, or the pack's `patterns` for it. If
  nothing says what it means, say so in the commit rather than inventing a sentence.

Cite the line each description came from in the commit message. That is the discipline that keeps this file
from becoming the thing that misled two sessions again.

## The decision to make before the work

**Is `spec/opcodes.json` a contract or a catalogue?** Nothing reads it: only prose points at it, and
`spec/allspeak-language-contract.md` names it. So:

- **If it is a contract** — the drift is a defect. Catch the file up, then **turn the assertion on**: extend
  `tools/opcode-check.js`'s spec section from the events to every opcode the resolver can return, so the next
  opcode a session adds cannot skip the file silently. (The resolver has no "list yourself" call, so this
  needs either a text scan of its returns — say so in the check's own output if so, because a text scan is a
  weaker instrument than the rest of that check — or a per-opcode script, which is the stronger form and the
  harder one.)
- **If it is a catalogue** — retire it: delete the file and edit the reference in
  `spec/allspeak-language-contract.md` so the contract stops pointing at a table nothing maintains. Say in the
  commit what was lost by retiring it.

**Do not do both, and do not half-do either.** A file half caught up reads as authoritative and is not, which
is the state it is in now.

## Also worth asking, while you are there

**Whether `tools/opcode-check.js` should be published.** It is a repo tool like `attr-check.js` and
`check-trace.py`: it compiles the runtime from source, so it needs a checkout and says so in the sentence the
published tools carry — but an agent working from a starter pack has no `js/` to point it at, so it cannot
run there. The published set is a fixed list in `./build-starters` and `deploy-allspeak`; adding a tool to it
is Graham's call, and the same one that is pending for `attr-check.js` in `TODO.md`.

## What done looks like

1. `node tools/opcode-check.js` green (it asserts the events today, and whatever the decision adds tomorrow).
2. The twelve entries present, each field traceable to a named line, with the descriptions' sources in the
   commit message.
3. The decision recorded in `TODO-language.md` and `TODO.md`, and the consequences of it actually taken —
   either the assertion extended, or the file and the contract's reference removed.
4. `python3 tools/asdoc-check.py` is **not** part of this: no `.allspeak` file is touched.
