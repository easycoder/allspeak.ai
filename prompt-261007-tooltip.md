# `on hover`: a fifth pointer event — where this stands, 2026-10-07

A work order for a session picking this up cold. Read `AI/README.md` and `AI/ALLSPEAK_CODING_GUIDELINES.md`
first, as `AGENTS.md` requires, then `TODO-language.md`'s "**`on hover`**" and `TODO-viz.md`'s "**The clip's
interaction, settled 2026-10-07**".

## What is wanted, and why

**A rollover event**: something that fires while the pointer is merely *over* an attached element, so a
control can say what it does before it is pressed. It is wanted in **two places**, both already designed and
both waiting on this:

1. **The clip bar's two cut controls.** Graham's design (2026-10-07) is two controls above the clip bar whose
   icons are arrow pairs — arrows facing away keep the window between the markers, arrows facing together
   remove it. **`><` and `<>` are ambiguous without a key**, which is what the tooltip is for.
2. **The sidebar's tooltips**, already carried in `TODO-viz.md` as "rollover tooltips, on the sidebar's hit
   test, once the sidebar is settled" — same need, same event.

## The evidence: there is no such event

The runtime's pointer events are exactly four — **`pick`, `drag`, `drop`, `wheel`** — and each is handled
twice in `js/allspeak/Browser.js`:

| event | compile half | run half |
|---|---|---|
| `wheel` | ~1390 | ~1593 |
| `pick` | ~1411 | ~1622 |
| `drag` / `drop` | ~1437–1438 | ~1715–1716 |

**An event is vocabulary, not a keyword.** The syntax is `on {event}` (the pattern list in each pack, e.g.
`LanguagePack_en.js` ~515–612: `"on drag"`, `"on pick {element}"`, `"on wheel {element}"`, `"on drop"`), and
the words are then a map (`LanguagePack_en.js` ~1260–1289, `"pick": "pick"`, …, `"wheel": "wheel"`).
**No grammar change is needed**; a fifth event is a pattern, a word, and a listener.

## The template: how an event is registered and dispatched

`pick` is the closest model — it attaches to *named elements*, which is what a hover on a control wants —
and `drag`/`drop` are the document-level pair (registered on `document` because a drag outlives the element it
started on). Read both, in both halves:

- **the compile half** turns the statement into a command carrying the handler's program counter and the
  attached symbol;
- **the run half** attaches the listener to the element (or elements — `pick` records an index per element,
  which is how one handler serves an array), and the listener runs the handler;
- **`touchstart` is registered alongside the pointer event** for `pick`, because a touch may never send one;
  **decide deliberately whether a rollover wants a touch counterpart** — a touch has no hover, and inventing
  one would be worse than not having it.

## What it must and must not do

- **It fires at pointer rate.** A hover is many events a second; a handler that redraws would make the pane
  unusable. The pane's own handlers say as much ("the pointer events arrive many times a second — a message
  per event would put a round trip inside every move"), so **the pane's use of this must be attribute writes
  only** — exactly what the drag's guide-and-wash feedback already is.
- **Nothing must change when nothing registers it.** The runtime must not add per-move cost to a page that
  does not ask for hover — the same discipline as the recorder, which tests one attribute and does nothing
  when it is not armed.
- **A pane element cannot take its own listener.** `svg` is the one element type the plugin registers
  *without* the `dom` extra, so the hover must be on the **host** and the pane must work out *which* control
  the pointer is over by arithmetic from the pointer position — which is the pane's own idiom and what
  `VizHandleAt` already does for every gesture. The tooltip is therefore the *pane's* answer, not the
  browser's: it draws the words.

## The word, four times, and the collision check

`hover` is the English name; the pack carries the pattern and the word, and **the other three languages need
a word each — a translation, and a collision check with it.** The project has paid for this once already: the
first German word chosen for `join` was `verbinde`, which was already the German `connect`, so the reverse map
sent the compiler looking for a handler that does not exist and **JavaScript accepted the word while Python
refused it**. So for each candidate: `reverse_word` of the form must answer `hover` and nothing else.

**`./sync-language-packs` mirrors the JS packs into the Python JSON ones and refuses a pack that is behind
English**, so the word must go into all four JS packs or that guard will stop the change — which is the point
of the guard, and what makes this a four-file job instead of a hunt.

## The Python side

**There is nothing to mirror: the Python runtime has no pointer events at all** (grep `pick` / `drag` / `drop`
across `allspeak-py/allspeak/*.py` — one unrelated mention of dropping an MQTT message). The *word* is still
required in the Python packs, because of the parity guard above, but there is no Python behaviour to write —
say so in the commit and in `TODO-language.md` rather than leaving it to be re-derived. **`spec/` needs
nothing**: events are not opcodes, and `spec/opcodes.json`'s one `pick` is a file-picker action.

## Verification, and what done looks like

1. **A check that fires the event**, which is the part with real work in it: the harness's DOM stub has
   `addEventListener() {}` as a **no-op** (`tools/plotview-check.js`, the element `mk`), so a stub that
   *stores* its listeners and can *dispatch* one is what a hover check needs. The precedent for a check that
   drives one host and says in its own output why the other is not asserted is `tools/capture-check.js` (the
   recorder's two hosts) — Python cannot be asserted here at all, and the check should say that sentence.
2. **The pane's two controls answer the tooltip** — the consumer side, and the thing the work is for: the
   words appear while the pointer is over a cut control and go when it leaves.
3. **The 323-script sweep is unchanged**, because nothing in it registers a hover.
4. **`./sync-language-packs` passes** (four packs, each with the pattern and the word, `reverse_word` clean).
5. **`./build-allspeak`** for the bundle, and **`node tools/asedit-check.js` for each editor file** if the
   pane is touched.

## The two consumers this unblocks

- `TODO-viz.md`, "The clip's interaction, settled 2026-10-07": the two cut controls want their tooltips, and
  until this lands they carry the words **drawn in them** (`keep` / `cut`) — which works and is the fallback.
- `TODO-viz.md`'s owed list: "**Rollover tooltips**, on the sidebar's hit test, once the sidebar is settled."

## Shipping

**A build and a deploy, and a release** — the same pair the `join` keyword needed. The browser gets the
runtime and the packs from `deploy/dist/`, so `./build-allspeak` then a deploy; and the CLI reads its packs
from the installed package, so a word the packs carry needs **`allspeak-ai` released** before a Python-side
script can use it. The JS runtime is the only implementer, so no Python *code* ships with it.

## One decision that is Graham's, not the builder's

**Whether the codex lessons should teach it.** The events are taught in `codex/<lang>/code/step17.allspeak`
and `step18.allspeak` (nothing in `learn/` lists them). A rollover is a UI nicety and the governing rule is
that the onboarding does not grow with the tooling — so the honest default is to add nothing to the codex and
mention the event in the reference only if a reference chapter lists the events at all. Asking is cheaper
than guessing.
