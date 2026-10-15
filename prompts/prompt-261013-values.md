# The value capture process — what an annotation can capture, and what the reader gets

**Why this document exists.** Graham, 2026-10-13: *"As for values, yes, that's exactly what I would like, but I think we need to define the value capture process clearly first, as it involves pinning down what annotations are capable of in this context."* The sidebar tab that would show them is agreed in principle — it is what the panel's rule asks for (`TODO-viz.md`, "Settled decisions": a tab brings the reading to the reader) — and it waits on this. **The pipeline has joins, and a decision at each one changes what the *language* can say, what a *recording* carries, and what a *reader* can be shown.** Each join is written out below as: what it does today, what it could do, what each answer costs. **The decisions are at the end, numbered; the recommendations are mine and are separable from them.**

Everything written down as "today" below was read out of the code, not remembered — the file and function are named each time, so a later session can check it before building on it.

## What exists today

**The attribute.** `@show Total, Row` sits on the statement the values belong to (`learn/reference/22-attributes.md`). An attribute is a single string — `show Total, Row` — and **the runtime does nothing with it**; the vocabulary is not policed and no tool has to understand it. That is the property this whole design rests on: an annotation is *for tooling*, and a tool that wants a key and a value splits it itself.

**Who reads it and when.** The recorder, as it passes each command: `js/plugins/asviz.js`, `capture:` — and the same in the Python runtime, `allspeak-py/allspeak/plugins/as_viz.py:481`. Both read the values **as the statement is *reached*, before it runs** (the recorder is a pre-execution hook), so an attribute beside the statement that *changes* a variable records the value going in. The language reference's own example puts `@show Total` on the line *after* the change, which is that fact written down.

**What it rides on.** The **visit in flight** — one anchor's residence, from its arrival to the next. So `while Total is less than Limit @show Total, Row` attaches to the arrival it belongs to, and a `@show` further down the block attaches to the visit that covers it. **One value per name per visit**: a second `@show` in the same span rewrites rather than adding a second reading. **A capture with no visit in flight is dropped** — and a visit needs an anchor, and an anchor is emitted inside a `@viz start`/`@viz stop` window, so **a script that writes `@show` and no markers records nothing at all**.

**What is stored.** Text, as that runtime renders a value in its own output, resolved against the program's symbols. A name the program does not hold is recorded as `?` rather than dropped, because an attribute naming something the runtime cannot see is worth seeing. Absent entirely when the script asked for nothing, so a recording of a script with no `@show` is byte-for-byte what it always was.

**Where it travels.** The `anchor` event's optional `args.values`, keyed by the name as written (`spec/viz-trace-format.md`, §`cat: "anchor"`). Draft 2 already specifies it, and both runtimes emit it.

**How the reader reaches it today.** By *clicking a mark*: the pane's hit test (`VizMarkAt`) walks the recording for the arrival under the pointer, collects its values, and reports them with the mark's figures; the editor relays them; the sidebar prints them in **name order** in its status bar (`SideStatusDraw`), and the pane's own status line carries the mark's line and visit. **A hover deliberately carries none of this** — the pane says why: *"the visit number, the total and the `@show` values belong to an arrival, and a pointer over a row has not named one."*

**What bounds it.** The editor's recorder takes the guard (§ the budget and ceiling in `plugins/asviz.js`); a recording asked for by the `*.record` flag file takes no guard and is bounded by `as_viz.FLAG_CAP` (50,000 visits) instead. Both exist because a recording is proportional to what it collects.

## The joins, and what each could be

**J1 — what a name may be.** *Today*: a bare name the program holds, resolved in the symbol table. *Could be*: a property read (`the size of Row`), or a general expression. **The cost of the general answer is that the attribute becomes a second language** — expression syntax, precedence and errors inside a string the language deliberately does not parse, in four packs' worth of reading. **The small answer is the language's own**: a script that wants something computed assigns it to a variable on the line before and names that, which is one line of AllSpeak doing what an expression would have done inside a comment.

**J2 — when it is read.** *Today*: on arrival, before the statement runs. The alternative (after it runs) inverts the reading of every attribute already written — `@show Total` after `add Row to Total` would mean the value *leaving* the line rather than entering it, and the reference's example would have to change meaning.

**J3 — what a capture is attached to.** *Today*: the visit, which gives one reading per name per span and no reading at all outside a window. *Could be*: **its own event**, so a capture is recorded wherever it happens — including in a script with no markers, and including twice in one span. The cost is a new event kind in the trace, a decision about what a viewer draws for a value that is not inside a visit, and a second thing that can be large.

**J4 — what is stored.** *Today*: text, one per name per visit, `?` for an unknown name. This is the field that makes two runtimes comparable and makes a value "what the script asked to see" rather than a serialisation of an internal object; changing it would change what a recording means.

**J5 — how a reader reaches it.** *Today*: a click on a mark. **A tab needs the pointer to name an arrival, and that is the one join with a fork that matters for the tab Graham asked for.** Three answers: (a) **the hover names the arrival under the pointer** — the pointer's `x` *is* a step, so the pane's existing hit test already answers it, and the tab then shows exactly what a click shows, without a click; (b) the tab shows *every* arrival on the line, which means walking the recording per pointer move — expensive, and the trap in `AGENTS.md` about indexed reads over a json array is exactly this walk; (c) the tab shows the line's latest arrival, which is cheap but is an answer the reader did not ask for.

**J6 — what it may cost.** Values are per visit per anchor, so a `@show` in a hot loop is the largest thing a recording can grow by. *Today*: the caps bound it, and `@show` is the script author's own ask. The join that wants a decision is whether a *tool* may ask for values the script did not name — the answer that keeps the design small is no: attributes are the script's, and a tool that wants a different variable edits the script (or hands the recording to the runner in `prompt-261007-debugger.md`).

**J7 — who else reads it.** The recording is a file, so the consumer side already works: the runner brief (`prompt-261007-debugger.md`) hands a recording to a second AllSpeak program, and `args.values` is in it. Nothing here blocks that, and nothing there needs a new annotation.

## What an annotation must not become

- **Not an expression language.** The attribute is a string; the runtime passes it on; a tool splits it. Every addition to the vocabulary has to survive that sentence (J1).
- **Not control flow, and not a hook.** An attribute describes; it does not run. A script that wants to *act* on a recording is the runner's case, not an attribute's.
- **Not language.** `@` is not a word and is the same in every pack, so an attribute written in French is read by a tool written for English (the reference's own rule).
- **Not required.** A script with no attributes runs the same and records a byte-identical trace. That is what lets the markers and `@show` sit in a script permanently.

## Recommended answers

1. **J1: names only.** A computed value is assigned to a variable on the line before. This keeps the attribute a string and the vocabulary in the script author's hands.
2. **J2: unchanged** — read on arrival, before the statement runs, with the reference's example re-read so the rule is stated where a user meets it.
3. **J3: keep the visit, and say the limitation out loud.** "No markers, no values" is worth a sentence in the reference beside `@show`, because it is invisible today: the pane says only *"No recording beside this script"*. If captures outside windows are wanted later, that is a new event kind and a new decision — not something to slip in now.
4. **J4: unchanged.**
5. **J5: (a) — the hover names the arrival.** It is the cheapest of the three, it uses the hit test that already exists for the press, and it makes the hover report say what the pointer is actually over (a mark on a line, not merely the line). It revises the pane's "deliberately carries none of this" note, which was written when a click was the only consumer.
6. **J6: no new asker.** Values are what the script says they are.
7. **J7: nothing to do** — the runner reads the file.

## The decisions that are yours

- **D1 — names only, or a small expression form?** (`D1a` names only — one line of AllSpeak does the rest; `D1b` allow `the <property> of <name>`, which the recorder can already resolve without a parser; `D1c` a full expression, which makes the attribute a language.)
- **D2 — does the values tab wait for captures outside `@viz` windows?** (`D2a` no: the tab shows what a recording has, and the reference gains the "no markers, no values" sentence; `D2b` yes: captures become their own event kind, so `@show` works in a script with no markers — a bigger change, and the one that makes `@show` useful to a plain debugging run.)
- **D3 — how the tab gets its arrival** (`D3a` the hover names the mark under the pointer, as recommended; `D3b` the tab lists every arrival on the line, at the cost of walking the recording per move; `D3c` the latest arrival on the line, cheapest and least true).
- **D4 — the tab's place in the strip.** `Doc block`, `Code`, and then? `Values` beside them, or the values folded into `Doc block` the way the status bar already shows them for a click. Folded is fewer controls and one place to look; separate is what "a tab is a name and a branch" was built for, and it matches Graham's *"for example to display captured values"*.

## If the recommendations stand: the first slice

1. **The hover names the arrival** (D3a): `VizHover` gains the mark hit it already has for a press — no drawing, no new walk, one extra field on the message the pane already sends. *Check*: `plotview-check` — hovering a mark reports its line **and** its visit, hovering a row with no mark reports the line alone, and the picture is still byte-identical (the existing "no hover draws anything" claim covers it).
2. **A `Values` tab** (D4 separate): a fourth name in `SideTabName`, a third body element, and a branch that renders the values the arrival carried — the assembly `SideStatusDraw` already does, moved where a tab can reach it. *Check*: `viz-modes-check` — the tab shows the arrival's values in name order, switching to it and back leaves the other two as they were, and a line with no captured values says so rather than showing the last arrival's.
3. **The reference gains the two rules a user needs** (`learn/reference/22-attributes.md` and its three translations): `@show` reads the value as the statement is *reached*; and values are recorded only inside a `@viz` window. *Check*: `tools/learn-link-check.py`, and a probe per language as the pointer-event set had.

Nothing in the slice touches the trace format, the recorder, or either runtime — which is the test of whether the definition above is the right shape: **the format already carries this, and what was missing was the reader's route to it.**
