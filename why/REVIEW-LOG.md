# `why/article.md` — review log

This file exists so that reviewing the article is a **checklist rather than a re-read**. Every checkable claim in the article is listed against what it depends on, so a review that starts from here takes minutes instead of hours, and a review that starts from the article takes all afternoon.

It has a second life once the article is published as a work in progress: the reviews below are the "what changed in this revision" note, which is the honest way to publish something that is still moving.

How to use it: when any of the features named in **Review triggers** changes, read the rows it names, re-measure what they report, and add a dated entry. Do not re-read the whole piece looking for trouble — that is how a review becomes a chore and stops happening.

---

## Checkable claims, and what would make each one stale

| § | Claim | Depends on | Stale when |
|---|---|---|---|
| §3 | Two words record a run: `viz start` / `viz stop`, and they are no-ops with no recorder | `Core.js` `Viz`, `as_core.py` `k_viz`/`r_viz` | The marker vocabulary or the no-op behaviour changes |
| §3 | Visits to labelled subroutines, `while` loops and `return` are recorded | `js/plugins/asviz.js`, `allspeak-py/plugins/as_viz.py` | The set of anchor kinds grows or changes |
| §3 | The language is BASIC-like: labels, `goto`/`gosub`, `if`, `while` | `Core.js`, `learn/reference/09-control-flow.md` | New flow-control keywords land (a `for`, a `case`) |
| §4 | The editor writes `<script>.viz.json` beside the script; a terminal write goes where it is told | `asedit.allspeak` `RecordRun`, `tools/asviz-run.py` `--trace=` | Either path changes — and note the pane's own doc block disagrees (see Repo findings) |
| §4 | Chrome Trace Event format, one specification, both runtimes | `spec/viz-trace-format.md` | The format is revised, or a third writer appears |
| §4 | Timings are not comparable across runs; command counts are | `spec/viz-trace-format.md` | A deterministic axis is added, or `steps` stops being deterministic |
| §4 | Transfers are recorded, not inferred; compiler jumps are a separate kind | `kind: call/jump/return/branch` | The kinds change |
| §5 | **Every figure** — 626 lines, 15 labels, 10 loops, one window of roughly 12 ms, 301 commands, 103 lines, 41 arrivals on 13 marker lines, 13 calls, 13 returns, 67 branches, hottest line 18 | `examples/chemical/parser.allspeak` **and the recorder** | The parser is edited, the recorder changes, or the marker's condition changes — re-run before publishing |
| §5 | The recording is of `H₂O`, and the marker reads `is 0` | `parser.allspeak:206` against a loop that counts from zero | The marker goes back to `is 1` — then the article must say the *second* formula, and `allspeak parser H2O` records a self-check case instead |
| §5 | The hottest line is `ReadCount`'s loop reading the digits after a symbol; `ReadSymbol`'s is second at 16 | `parser.allspeak` lines 419 and 388 | The parser is restructured, or the hot line moves |
| §6 | An unreachable anchor is shown in preference to the verification colour | `asedit.allspeak` `NoteMarker`, the analyser's reachability model | The Blocks view's colour rules change |
| §7 | `@hash` is written by the analyser; `@verified` is a human sign-off that goes stale with the code | `tools/asdoc-check.py` | The convention changes (§22 of the language reference) |
| §7 | The mark-all button exists and asks for confirmation first | `asedit.allspeak` `MarkAllVerified` | The confirmation is dropped, or the button goes |
| §9 | A recording of ~24 KB takes a few hundred milliseconds to draw; a megabyte is seconds | The pane's per-draw cost on the machine that measured it | **Always** — this is the least settled figure in the piece and the one most likely to be wrong by the time anyone reads it |
| §9 | Values are visible only where `@show` asked for them | `spec/viz-trace-format.md` `args.values` | Values become the default, or a data channel arrives |
| §10 | The picture's own few words are localised from the language packs | The three localised flow words passed by `asedit.allspeak` | More of the picture's vocabulary is translated, or the pane grows a label |
| §11 | Recording from a button in the editor is real; captured values exist and are the newest thing; hover tooltips do not; the app path is least exercised | `asedit.allspeak`, `asedit-graph.allspeak`, `TODO.md` | **Anything in that list moves** — §11 is the section that goes stale fastest, by design |

Two rules for anyone editing the article: keep every paragraph on **one line** (the reader renders a hard-wrapped paragraph badly, and the doc-block convention says the same for `!!` prose), and re-run the review rows above before publishing.

---

## Review 1 — 2026-10-04

**Method.** An independent review pass over the claims above, then each finding verified here by hand before anything was changed — run the parser, read the recorder, count the labels, check `git show`, grep for a caller. Two findings came from running something rather than reading it, which is the pattern this project keeps relearning.

**Corrections made — nine, all in the article.**

1. **§5 was about the wrong formula.** It said the recording is of `H2O`; it is of `NaCl`. The marker is `if FormulaIndex is 1 viz start`, and the loop that drives it starts at zero, so `FormulaIndex is 1` is the *second* worked example. Proved two ways: a two-formula copy of the parser (`H2O`, `Mg(OH)2`) with the marker untouched recorded the bracket-expansion lines, which only `Mg(OH)2` can reach; and the trace the article's numbers actually come from has no bracket-region lines at all, ruling out indices 3 and 4. The heading, the body, the Figure 2 caption and the draft note all now say `NaCl`, and the paragraph turns the trap into a sentence of the argument — the marker is a condition, and a condition is code.
2. **§7 quoted the wrong hash.** The example showed `ExpandGroups`'s opening prose with `@hash 8d8fe6ab`, which is `MeasureFormula`'s. `ExpandGroups` is `3ea85314`. Fixed.
3. **§4 overstated what `steps` compares across.** It said comparable "across the two runtimes". The specification says the opposite: the two compile different numbers of commands for the same source, so traces are joined on `line` and `steps` compares *within* one runtime. Rewritten, and the same overstatement in "compared event by event" went with it.
4. **§3 said `while` was the whole of the flow control.** `if`/`else` is flow control, and the article's own worked example is built from it. Rewritten.
5. **§7 called the mark-all button "quiet".** It asks for confirmation first, and the code says why. The honest version is stronger: confirmation cannot tell judgement from habit.
6. **§4 claimed every event names a line.** The three metadata events do not. Qualified to the events that record execution.
7. **§4 conflated the two recording paths** — the editor's convention and the terminal's explicit `--trace=`. Now stated as two.
8. **§5's "the last two numbers" had no antecedent.** Now names the thirteen calls and the twenty-four executions.
9. **§11 called `tools/check-trace.py` a conformance check the runtimes "have to pass".** Nothing runs it; the requirement is documented, not enforced. Softened to a checker that exists.

**Survived the pass unchanged.** The counts and measurements in §5 as numbers (626/15/10, one window, 10.9 ms, 325 commands, 105 lines, 44 arrivals, 13 calls/13 returns, 73 branches, hottest 24); the marker syntax and the no-op behaviour; the trace format's identity; transfers recorded rather than inferred; the reachability colour rule; the hash and verification convention; the localisation of the picture's own words; and the whole of the §2 argument separating a static silhouette from a picture of a run.

**Repo findings — reported, not fixed.** None of these is the article's fault, and all three are worth deciding about.

- **`spec/viz-trace-format.md` contradicts itself about values.** Line 193 says "**Values.** Nothing here records what was in a variable", while lines 112–117 document `args.values` populated from `@show`, and both recorders implement it. The bullet was written when values were an unstarted Draft-3 change and was never revised, under a header that still reads "Draft 2". One line to fix, and the article's §9 already describes the true behaviour.
- **`asedit.allspeak`'s pane doc block states the false path rule** — that the recording is "a file beside the script… which the runtime writes with `--trace=`" — eliding that the host refuses to guess a filename (`tools/asviz-run.py`: "guessing writes files"). `TODO.md` already logs this as a doc/code disagreement.
- **The demo script's marker is off by one from a plain reading**, which is why this review's first finding existed. For the exhibit, either change it to `is 0` so the recording is of the *first* formula and the caption is unambiguous, or pass the formula explicitly and say so.

**Method note worth keeping.** The reviewer could not execute anything and said so plainly, grading §5's figures *unverifiable-from-repo* rather than wrong. It was right about its own limits and right that the figures cannot be checked by a reader — which is the argument for shipping the recording as part of the exhibit. This is the second time this session that an instrument caught something reading did not.

### Review 1, addendum — the marker, re-verified (2026-10-04, later)

Graham read the §5 finding and replied "Yes, it's the first formula in the list" — which is the *intended* target, and is exactly what the code does not do. So the reading was re-verified, and the first attempt to verify it was wrong in a way worth writing down.

- **The probe that failed, and why.** A copy of the parser with the worked examples cut down to `H2O` alone recorded a window with **both** `is 1` and `is 0`. That reads as "the marker selects the first formula" and it is not: `SelfChecks` calls `MeasureFormula` directly and never touches `FormulaIndex`, so after a one-item loop the index is left at `1` and the marker trips *inside the self-checks*. The probe had changed two things at once — it removed the other formulas **and** left a second caller of the instrumented subroutine in the run. A probe that changes two things teaches nothing.
- **The probe that settles it.** The same copy with `gosub SelfChecks` removed: `is 1` → **0 windows**; `is 0` → **1 window**. The first formula is index 0, so `is 1` is the second.
- **Corroboration on the trace the article's numbers come from.** Its window spans lines 206–481 and touches no line at or past the self-checks (568), so it came from the main loop; after a five-formula loop the index is 5, so the marker cannot have fired anywhere else. And the two-formula probe recorded the bracket-expansion lines, which only `Mg(OH)2` — the second item — can reach.

So for the script as it stood the recording was of `NaCl`, and `is 0` was the one-character change that makes it `H₂O`.

**Decided by Graham the same day: change it.** Done. `MeasureFormula`'s doc-block hash was refreshed to `6bedc61e`, and its `@verified` was deliberately **left at `8d8fe6ab`**, so the analyser reports `verify-stale` at line 216 — which is the convention doing its job and must not be cleared except by a person who has re-read the section. §5's figures for the `H₂O` run: **301 commands, 103 lines, 41 arrivals, 13 calls, 13 returns, 67 compiler branches, hottest line 18** (and the second busiest, 16, moved from `ReadCount`'s loop to `ReadSymbol`'s, so §5's reading of the heat changed with the formula — the single most useful thing this exercise turned up).

Two notes on the state of `examples/chemical/parser.allspeak` after the edit. It reports **19 `code-outside-section` errors**, all pre-existing and already listed in `TODO.md`'s doc-block sweep — the edit neither caused nor touched them. And the millisecond figure for the same window came out at 11.7 ms and 13.6 ms on two runs, which is why §5 now treats the clock as the number to distrust and the command count as the number to trust.

**A second figure, asked for by Graham.** §2 now carries a bare pair of axes — `what` up the side, `when` along the bottom — because it is the shortest true statement of what the picture is: a mark at *this part of the program, at this moment of the run*. Two things about it are worth keeping straight when it is drawn and when the §4 row above is re-read: the vertical axis is the program's own parts, not line numbers, and the horizontal axis is **order**, not duration — which is why the record carries a command count as well as a clock.

**And the "another toy" reflex now gets answered where AllSpeak is named.** §1 ends with what AllSpeak is for and what it takes nothing away from, so a professional reader meets the qualification before the pitch rather than in §9; §9 keeps the formal bound and no longer restates it.

---

## Review triggers for the next pass

Each of these is a named moment to come back to this file, and each comes with the sections it puts at risk.

- **Values in the recording settle.** Rewrites §9's first bound ("it shows flow, not data") and gives §5 its best material. It is the single change that most improves the article, and §9 is the row that currently undersells the tool.
- **Hover and the other gestures land.** Touches §4 and §5, and removes the "not built" item from §11.
- **The exhibit ships** — a script and its recording in the deploy tree, and the pane on a page. This turns §5's figures from unverifiable into checkable, converts both figures from `[to be produced]` to real, and is the moment to re-measure every number in §5.
- **The per-draw cost changes.** §9's weakest figure.
- **The AI Manual is retired and `TabWhy` is added** (`TODO.md`). Not the article's claim, but the article becomes the page behind that button, so the two need to agree about what the site says.
