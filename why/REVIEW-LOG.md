# `why/article.md` — review log

This file exists so that reviewing the article is a **checklist rather than a re-read**. Every checkable claim in the article is listed against what it depends on, so a review that starts from here takes minutes instead of hours, and a review that starts from the article takes all afternoon.

It has a second life once the article is published as a work in progress: the reviews below are the "what changed in this revision" note, which is the honest way to publish something that is still moving.

How to use it: when any of the features named in **Review triggers** changes, read the rows it names, re-measure what they report, and add a dated entry. Do not re-read the whole piece looking for trouble — that is how a review becomes a chore and stops happening.

---

## Checkable claims, and what would make each one stale

| § | Claim | Depends on | Stale when |
|---|---|---|---|
| §1 | The four questions a reviewer has, and that a stack trace answers one and a log another | — | An instrument the table omits answers all four |
| §1 | A runtime decides what can be seen: Python's `sys.settrace`/`sys.monitoring`, V8's inspector protocol, and nothing can be built on a hook that is not published | The runtimes, not this repo | Either runtime changes or withdraws a hook |
| §1 | **Six claims in the pasted draft were corrected on 2026-10-04** — see Review 2. The one that matters: a Python or JavaScript debugger *can* answer the four questions, so the claim is not that AllSpeak can and others cannot | `coverage`, `viztracer`, DevTools | A reader who knows `viztracer` dismisses the piece — this is the row to re-read first |
| §2 | The bars are the **code**; doc-block lines are blanked and get no bar, so the silhouette is of the code rather than the file | `asedit-graph.allspeak` `VizRedact`, the `!!` test | The blanking changes, or the bars start being drawn for prose |
| §2 | Each bar runs **from its line's first character to its last** — the left edges are the block structure and the right edges are the lines' own ends, so the shape carries the nesting as well as the length | `asedit-graph.allspeak` `VizLineIndent`, and the `M<x> <y>h<w>` the pass writes | The indent stops being drawn, or the eight units a column changes — **this one was false in the code until 2026-10-08: see Review 3** |
| §2 | A column of text is the same eight units as a column of geometry, because the pane **measures the font** and sets the em from it — so the text's own columns land on the bars' | `asedit-graph.allspeak` `VizMeasureEm` + the `VizRuler` element, and the `font-size` the `<text>` carries | The ruler stops measuring, the em stops being written, or the guard's bounds stop covering a real monospace — **measured 7.984 units a column against the pane's 8.000; it was 7.827 before, see Review 4** |
| §2 | Dots mark four kinds of place — label, `while`, event handler, `return` — plus the two markers | `js/plugins/asviz.js` `kind=label\|loop\|event\|viz` | The anchor kinds change |
| §2 | The three transfer colours are call/jump/return, keyed `gosub`/`go`/`return`; an arriving arrow does not imply a call | `asedit-graph.allspeak` `VizColourCall`/`Jump`/`Return` | A fourth transfer kind, or the colours move |
| §2 | Values appear in the **existing** Docs tab's bar, chosen by `@show`, with no effect on the run | `asedit-side.allspeak`, `asviz.js` | A second tab is added, or the values move out of the bar |
| §2 | The image in Figure 3 shows steps 0–116 and lines 168–510 of a 626-line script at 376%/194% | `why/viz-example.png` | The screenshot is retaken — **re-read every claim in the tour against the new image** |
| §2 | Figure 2's bars are the parser's **sections**, one bar each, at their real positions in the file and as wide as each section's longest line — the pane's own low-zoom reading, not one bar per line | `why/figure-2-axes.png`, drawn by `various/make-figure-2.py` | The parser is restructured, or the pane's low-zoom behaviour changes — re-run `python3 various/make-figure-2.py why/figure-2-axes.png` |
| §2 | Figure 2's dots are real arrivals at their real line and step, taken from the busiest lines plus each labelled stage | `various/h2o.viz.json`, in the generator | The recording is regenerated, or the marker moves |
| §1–§2 | Both figures use the pane's own colours, copied by value: bars `#d6d6d6`, heat `#3b7dd8`/`#8f5fd8`/`#d2467f`/`#e5484d`, wires `#e0a44a`/`#43c6a8`/`#c07ad0` | `asedit-graph.allspeak` | Any of them changes — a figure would then silently disagree with the pane |
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

## Review 2 — 2026-10-04, later

**What happened.** Graham wrote a draft of a new §1 and a walkthrough of the picture, to be checked for accuracy and tidied, with two editorial instructions: present the case for AllSpeak **earlier and more assertively**, stressing that it is one layer of a project and does not compete with JavaScript or Python; and **keep the document to code review alone**, because internationalisation belongs in a separate document. The draft is now in §1 and §2's new "The picture itself"; §10's multilingual paragraph is out.

**Six corrections, and the last is the one that matters.**

1. **"Languages arrive in three shapes" named two.** A count that does not survive its own paragraph. Now two *routes* — compiled to the processor's own instructions, or to a virtual machine's — with JavaScript given its own sentence, because V8 both interprets bytecode and compiles the hot parts further at run time.
2. **"watching it instruction by instruction is impractical"** was wrong: `gdb`/`lldb`, `perf`, eBPF and record-and-replay debuggers all observe a compiled binary without recompiling. Rewritten: a binary *can* be watched one instruction at a time, and it is a hard place to read a program; the practical recourse for anything larger is instrumentation, which costs a rebuild.
3. **"there is no way for you to change it or add to it"** was wrong twice over, and it was the load-bearing sentence for §10. Python publishes `sys.settrace` and `sys.monitoring` — which is how `coverage` and a family of tracing tools exist — and V8 publishes an inspector protocol, which is why its debugger has more than one front end.
4. **"it leaves nothing behind when the session ends"** was true of stock interactive debuggers and false as a general claim: `python -m trace`, `coverage.py`, DevTools Coverage (which answers "where did it *not* go", one of the article's own four questions) and DevTools Performance all record and export.
5. **The bars are not the file.** "Every line of it is a bar whose width is that line's length" is contradicted by `asedit-graph.allspeak`, which blanks every `!!` line — "a row that draws nothing gets no bar… the blanked doc blocks are most of a file written to this convention" — **and by the screenshot itself**, whose bars are dense in the upper third and sparse below because the lower rows are prose. The picture's silhouette is of the code, not of the file.
6. **And the draft's central claim was too strong, which turned out to be an opportunity.** It said AllSpeak "has a debugger that is able to reveal answers to the questions above — the ones that can't be answered by a Python or JS debugger." They can be, and `viztracer` will even write a trace file in the very format §4 claims for AllSpeak. **§1 and §10 now name that prior art and say precisely what differs**: those tools watch through a general-purpose hook and therefore know about lines of text in a file, whereas AllSpeak's record is made *by the language*, so it carries the author's own sections, their names and their documentation. The piece is more credible for conceding the point, and a professional reader who knows `viztracer` is exactly the reader it is written for.

Three smaller ones went with them: the dots mark **four** kinds of place (label, `while`, event handler, `return`) rather than three; an arriving arrow does not imply a call, and the colour says which transfer it was (there is no rule that a dot without one is a loop — that was invented); and the values paragraph is true except for placement, since they appear in the **existing** Docs tab's bar, not a second tab, which is unbuilt.

**The one thing the picture settled that prose could not.** The vertical-axis caution said the axis "is not line numbers" while the screenshot's own ruler reads 168, 282, 396, 510. Both are true of different things — the axis is *laid out* by the file's lines, and *means* the program's parts — and the wording now says so. Reading the image rather than the prose is what found it, which is the third time an instrument has beaten reasoning in this project.

**The internationalisation paragraph is out of §10**, and the draft note records where it went. It is recoverable from `git log -p -- why/article.md`.

**Method worth repeating.** Two independent review passes were run over this revision, and both found real errors in prose I had just written and re-read: the second found all six above plus four of the smaller ones. Asking for a check *of the new material specifically*, with the checkable categories named, is what made it productive.

## Review 3 — 2026-10-08, and the fault was in the code rather than the prose

**Graham used the picture and asked for the indent.** *"The first one concerns the redaction bars. I realise they should show code indentation. Instead of starting at the margin they should start on the first character of the script."* He was describing the pane's own drawing, and **the prose had been right all along and the pane was wrong.**

**What §2 already claimed, in two places.** §2's opening says the silhouette is something you recognise your own work in — *"where a block starts, **how deep it nests**, which sections are long and which are stubs"* — and the bars paragraph said a bar's width was the line's length with no mention of where it started. So one sentence in the article was **silent where it should have been specific**, and the row above is the one that now names the left edge.

**The figure generator had it right and the pane did not, which is where this becomes a finding rather than a slips.** `various/make-redacted.py` — the throwaway that draws Figure 1 — has said since it was written: *"Every line becomes one bar, running from its indentation column to its last character, so the bars' left edges are the block structure and their right edges are the line lengths."* So **the prototype and the prose agreed with each other and the shipped pane disagreed with both**, and nothing noticed because the pane's own check measured *width* and never *where a bar began* — a check that passed on a build whose bars claimed every line started at column zero. That is the shape of fault this log exists to catch, and it was caught by a person looking at a picture.

**What changed.** `asedit-graph.allspeak` gained `VizLineIndent` (the language has no `trim` and no `position of`, so the walk trims its own copy with `from 1 of` until the copy no longer begins with a space) and the pass now writes `M<indent×8> <y>h<remaining×8>`. **Two coincidental differences from the generator are worth knowing rather than chasing**, since the figures are drawn from files that have neither: the generator counts a tab as four columns where the pane counts the one column its own text gives it, and the generator strips a line's *trailing* whitespace where the pane draws the bar to the line's own end. Both are deliberate on the pane's side — **the bar has to cover the text the pane draws**, which is the invariant the harness checks — and neither can bite on a space-indented file with no trailing spaces.

**And the check that would have caught it now exists.** `plotview-check`'s bar claim compares each bar's **left edge** as well as its width against the row the picture drew, and a second claim counts the distinct left edges so that a fixture of flush-left lines cannot pass an indent check by accident (the fixture gained a second and a third indentation level for it: **four distinct left edges, at 0, 32, 64 and 96 units**). Teeth demonstrated by reverting the pane's one line: `219 of 221 bars mismatched` and *"every bar begins at 0 units, so the indent is not being drawn at all"*.

**The lesson, which is new here.** The article's claims are checked against the *code* in the rows above; this is the first time the code has been checked against a claim in the article and found wanting. **A design that is written down and prototyped in two places can still be absent from the product**, and the third place — the shipped one — is the only one nobody compared.

## Review 4 — 2026-10-11, and the fault was in the *font* rather than in either prose

**Graham used the picture again, and the indent was right but too far.** After Review 3 put the indent in, his next look was: *"the offsets are too much — see `various/redaction.png`. Can we determine the actual width of a space in the current font and indent by 4 of them?"* He was describing the same fault from the other side, and the answer was in the second half of his sentence.

**What was wrong.** The geometry is in whole units — **a column is eight of them**, and the rules, the label names, the document's width and the bars are all built from that number — while the *text* is laid out by the browser at whatever advance the monospace font it picks actually has. Those two only agree by luck, and the luck does not hold: **measured in chromium on this machine, `monospace` at an em of 13 has an advance of 7.827 units.** So every column of text sat 2.2% left of the column the pane drew — and because the error is *per column*, it grows with the indent and with the length of the line, which is exactly what a deeply nested block shows and what "too much" means.

**Measured, in the pane's own output.** The document the pane builds for `plotview-check`'s fixture — a 164-column row at an indent of 4, rendered and read pixel by pixel at 2×:

| | ink starts | ink ends | advance a column |
|---|---|---|---|
| before | 32.00 | 1283.00 | **7.8187** |
| after | 32.50 | 1310.00 | **7.9844** |

The pane's claim is 8.0000. So the text ends **29 units** — three and a half characters — short of the bar at 164 columns before, and **2 units** (the glyph's own right bearing) after.

**The fix keeps the geometry and moves the font**, which is the whole of the decision: eight units a column is the number the rules, the label names, the document's size and the bars are built from, and the prose says so in three files. Correcting it in the geometry would touch five sites and every one of those claims; correcting it in the font touches one attribute. So `VizMeasureEm` reads the advance off a hidden element (`VizRuler`), solves `em = 8 × 13 × count / width`, and the `<text>` is written at that em to two places — 13.28 here. **Two alternatives were tried and rejected on measurement**: `textLength` on a `<tspan>`, which would have forced the columns exactly and which **Blink ignores** (measured: 281.8 either way), and correcting the *column* rather than the font, for the reason above. A guard rejects a width that cannot be a font's — a pane with no layout answers with a box of its own, and solving an em from that would draw a puzzle — which is also what keeps the harness honest: its stub has no text layout, so the fixture gives the ruler a real font's width (1127) and the arithmetic is checked against a known input, with the fallback checked by asking the same routine for a nonsense one.

**Where this leaves the lesson from Review 3, and it is the same lesson twice.** That one found the *prose and the prototype* agreeing while the product did not; this one found **the product naming a font whose metrics it had never asked about** — a constant assumed rather than measured, in a place where both the assumption and the thing assumed are invisible until somebody looks at the picture. Twice in four days the answer came from rendering the thing and reading it, and once from Graham's own eye.

## Review triggers for the next pass

Each of these is a named moment to come back to this file, and each comes with the sections it puts at risk.

- **Values in the recording settle.** Rewrites §9's first bound ("it shows flow, not data") and gives §5 its best material. It is the single change that most improves the article, and §9 is the row that currently undersells the tool.
- **Hover and the other gestures land.** Touches §4 and §5, and removes the "not built" item from §11.
- **The exhibit ships** — a script and its recording in the deploy tree, and the pane on a page. This turns §5's figures from unverifiable into checkable, converts both figures from `[to be produced]` to real, and is the moment to re-measure every number in §5.
- **The per-draw cost changes.** §9's weakest figure.
- **The AI Manual is retired and `TabWhy` is added** (`TODO.md`). Not the article's claim, but the article becomes the page behind that button, so the two need to agree about what the site says.
