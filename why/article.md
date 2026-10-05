> **Draft — not for publication.** Started 2026-10-04. Written to be read and argued with while the visualiser is still moving, which is why the claims are deliberately drawn at a level the implementation is unlikely to invalidate.
>
> **Before it goes anywhere, seven things need doing:**
>
> 1. **The figures.** Four are marked below, and **two are in place** — Figure 2 (`why/figure-2-axes.png`, drawn by `various/make-figure-2.py`) and Figure 3 (`why/viz-example.png`, the screenshot), both beside this file and rendering in any markdown viewer. Figure 1 (the redacted silhouette, from `various/make-redacted.py`) and Figure 4 (the same recording seen whole) still need making. Recordings come from one command: `python3 tools/asviz-run.py --run --trace=<file.json> examples/chemical/parser.allspeak`.
> 2. **The numbers in §5.** They were taken from the `H₂O` run on 2026-10-04, with the marker at `is 0` so that it records the first worked example, and they will drift as the parser and the recorder change. Re-run and re-read them before publishing, and say in the caption that they are one run of one script. The per-draw cost in §9 is a console measurement from an earlier session and is the least settled figure in the piece.
> 3. **The state of the tools.** §11 says what is unfinished. Check it is still true, rather than still unfinished in the same way.
> 4. **The title.** *Reading a program without reading it* is the working one. Alternatives that fit the same argument: *Nobody ships the run*, *The record and the picture*.
> 5. **The marker was corrected, on Graham's call (2026-10-04).** `examples/chemical/parser.allspeak:206` read `if FormulaIndex is 1 viz start`; because the loop counts from zero that selected the *second* worked example, and with a single formula on the command line it recorded a self-check case instead. It now reads `is 0`, so the recording is of the first formula, `H₂O`. `MeasureFormula`'s doc-block hash was refreshed, and its `@verified` stamp is deliberately stale — that is the convention reporting the change, not a fault.
> 6. **This document is about code review and nothing else.** §10's third paragraph — the picture's own words coming from the language packs, a French team reading a French picture — was **removed** on 2026-10-04 and belongs in the internationalisation document. It is recoverable from `git log -p -- why/article.md`.
> 7. **§1 and §2 were revised from Graham's draft on 2026-10-04, and five of its claims were corrected rather than copied.** The sidebar's values appear in the **existing** tab's status bar, not in a second tab — there is one tab, and a second is unbuilt but ready (a tab is a name and a branch). The picture's bars are the **code**; the documentation is blanked and gets no bar, because on a file written to this convention the prose would bury the flow. The dots mark four kinds of place, not three — label, `while`, event handler, `return` — plus the two markers. An arrow arriving says only that control came from somewhere else, and the colour says how; there is no rule that a dot without one is a loop. And the draft's claim that a Python or JavaScript debugger *cannot* answer the four questions was **too strong and is now the article's sharpest point**: those runtimes do publish hooks, and `coverage` and `viztracer` exist on them. §1 and §10 now name that prior art and say precisely what differs — the record is made *by the language*, so it carries the author's own sections, names and documentation. **A reader who knows `viztracer` will otherwise dismiss the piece**, which is why this matters more than the rest of the list.
>
> Placement on the site, when it is ready: source lives here, `deploy-sync` mirrors `why/` into `deploy/shared/why/`, and `deploy/<lang>/why.html` is a thin loader in the manner of `deploy/<lang>/primer.html`. See the synopsis for the front door.

---

# Reading a program without reading it

*How to review code an AI wrote, when you didn't write it either.*

---

## 1. The thing nobody ships

Consider what you actually receive when someone hands you a program. Some text, a list of dependencies, and instructions for running it. What you do not receive is any record of what the program did.

That gap is stranger than it first looks. Software exists in order to run; running is the only thing it does. And yet the artefact that gets reviewed, versioned, handed between teams and argued about is the *text*, while the *behaviour* — the thing everybody actually cares about — leaves no trace once the process exits.

We do have tools that watch a program execute. None of them produces something you can hand to another person as evidence:

| Instrument | What it is a record of | Why it does not travel |
|---|---|---|
| A stack trace | A crash | It starts at the failure and shows only one path through the code. It is the shape of what went wrong, not of what the program does. |
| A log file | The lines somebody chose to write | Coverage is a series of decisions made in advance, by a person who had to guess what would matter. |
| A debugger | A live session | It is interactive, so it exists only while somebody is sitting at it. There is nothing to attach to a review. |
| A profiler | Aggregates | Useful for cost, silent about order — it will tell you a function is hot, not how the program got there. |

Each of these is good at its job. What none of them gives you is **the run**: this program, on this input, doing this, in this order, as a document. You can read a stack trace, but you cannot review it a month later as evidence of what the software does.

**The questions a reviewer actually has are these.**

- **Where did it go?** Which parts of the code ran, and in what order.
- **Where did it not go at all?** The branch never taken; the subroutine nothing calls.
- **How often did it visit a particular piece of code?** The loop that ran eight times, or eight hundred.
- **What were the values?** The ones the program never printed.

A stack trace answers the first, for one path, after a failure. A log answers the fourth, for the lines somebody thought to instrument in advance. None of the four answers all of them, and none answers any of them in a form you can hand to somebody else.

**Of the four, only the debugger can go further — and few people do.** A debugger is not short of power; it is short of patience. It answers these questions a breakpoint at a time, in a live session, for a reader who already reads the language — and by the time the session ends, the answers are gone. There *are* tools that record: Python's `coverage` will tell you which lines never ran, and a tracing profiler will write down what happened and keep it. But each of them is about one of the questions, has its own conventions for being asked, and knows nothing of what a program's sections are called or what they are for. This article is about a runtime whose answers are part of the language.

**How a program reaches the machine decides how much of that is possible.** A **compiled** language is translated ahead of time into the processor's own instructions. That is fast, and it is a harder place to read a program: a binary can be watched one machine instruction at a time, and people do exactly that, but the practical recourse for anything larger than a small question is to add code at the points you care about — which costs a recompilation before it can be run. An **interpreted** language such as Python takes the other route: the source is translated into the instructions of a **virtual machine**, a conceptual layer sitting above the CPU's assembly, and a runtime engine carries those out using whatever the hardware actually does. That indirection is what lets one program run on x86 or on ARM — what Java meant by *write once, run anywhere*. JavaScript sits between the two and has moved over the years: V8 compiles to its own bytecode, and then compiles the hot parts of it again, at run time, into the processor's own instructions.

**And the runtime engine is where the debugger sits.** That is worth stating plainly, because it is where this article's subject comes from. A runtime chooses what to expose, and everything anybody builds to watch a program is built on what it exposes. Python publishes hooks for it — `sys.settrace`, and `sys.monitoring` in recent versions — which is how `coverage` and a family of tracing tools exist at all; V8 publishes an inspector protocol, which is why its debugger has more than one front end. What no runtime exposes, nothing can be built on: **the capabilities available to a reviewer are decided by the runtime**, and the only way to decide them yourself is to own the runtime.

**But not all of your code needs the same level of debugging.** As a product matures, the parts that rarely change get baked into function libraries, and you seldom need to watch inside them — a JSON parser, a date library, a database driver. What keeps changing, and what keeps being wrong, is the layer above: the human interface. What the screen does, what happens when somebody clicks, what order the steps go in. That layer is the part that can be described in English — and, not by coincidence, it is the part that *was* described in English, in the prompt that the AI turned into code.

**AllSpeak occupies that layer, and only that layer.** This is the case for using it, so let me put it as directly as I can. AllSpeak is **one layer of a project**, not a replacement for the project. It does not compete with JavaScript or Python; those go on doing the work they are good at, and AllSpeak is not attempting that work. If it competes with anything, it is with a front-end framework — React and its neighbours occupy that same top layer, the one where behaviour is written down — and choosing AllSpeak there need not disturb anything underneath it. What AllSpeak brings to that layer is that its runtime is ours, so it can be asked what it did.

AllSpeak does ship the run. A script can be told to record what it did; the recording is written to a file; and the file can be drawn as a picture of the execution. The picture can be read by somebody who has never seen the program, and read before a single line of its text is legible — which, it turns out, includes not needing to know what language it was written in.

That sentence is easy to read past, so let me put it plainly: **the record is an artefact of the program's behaviour, and it is a file.** It travels with the project the way a screenshot does. It can be read on a machine that cannot run the code, by a person who cannot install it, in a conversation that happened after the machine that produced it was switched off.

---

## 2. Two pictures, and only one of them is the point

There is an older idea in here, and it is worth separating out, because it is genuinely useful and it is not what this is about.

Take any program, print it out, and redact every line. Join the pages into one tall sheet and pin it to the wall. Step back. What you have is a bar chart — a picture of the program. Every program makes a different one, much as every QR code does, and unlike a QR code you can recognise your own work in it: where a block starts, how deep it nests, which sections are long and which are stubs.

**Figure 1** — *[to be produced: a script redacted line by line and joined into one sheet, from `various/make-redacted.py`]*

Reading unfamiliar code by its silhouette is a real skill and it is not a gimmick. Two blocks that look suspiciously alike probably do a similar job, and if the code was written in one style, that guess is usually right — which means you may only have to understand the thing once, rather than twice. Navigating a long file by shape is the same faculty that lets you read a line of a novel without picking out each word.

But notice two things about it. It works on **any** language — you could redact JavaScript just as well, and the silhouette would be just as informative. And it is a picture of the text. It tells you about the *shape of the writing*, and nothing whatever about what the program does.

The picture this article is about is the other kind. It is a picture of a **run**.

A picture of a run has two axes, and they are the two questions anybody asks of a program. Up the side is **what**: the parts of the program, in the order the script itself lays them out, so the shape of the file runs from top to bottom. Along the bottom is **when**: not clock time, but the order things actually happened in. Everything the picture shows is a mark at a position on those two axes — *this part of the program, at this moment of the run*.

**Figure 2** — the two axes, and the whole of the idea. The grey bars are the parser's own sections at their real positions in the file, each as wide as its longest line; the dots are a handful of the arrivals recorded when §5's run was made, placed at the line they reached and at the step they reached it, and coloured by how often that line had been visited by then. There is no key, no ruler and no numbers, because this is the idea rather than the instrument.

![A pair of axes. Down the left, labelled what, five of the parser's section names sit at their positions in the file with a grey bar beside each; along the bottom, labelled when, are the words first and last. Blue, violet, magenta and red dots are scattered across the bars, and two vertical wires — one orange, one violet — run between them.](figure-2-axes.png)

Two things about that figure, because both are easy to get wrong and both would mislead. The vertical axis is laid out by the file's lines, and the ruler down the side of the picture is numbered accordingly — but what the axis is *for* is what the program is doing, which is why the eye lands on the author's own labels, `ExpandGroups` and `ReadSymbol` and `MeasureFormula`, rather than on a line number. And the horizontal axis is order rather than duration, which is the whole reason the record counts commands as well as milliseconds (§4): two runs of one script put the marks in the same left-to-right sequence at quite different distances apart.

### The picture itself

It is made after the run has finished, from the record — the file described in §4 — so it can be opened later, elsewhere, by somebody who was not there when the program ran. Viewing one needs no more than the editor that shows the code. Here is one, showing a *window* into a run rather than the whole of it:

**Figure 3** — the pane on a window into a run: steps 0–116 and lines 168–510 of a 626-line script, zoomed to 376% horizontally and 194% vertically, with the documentation for the `ReadSymbol` section in the side panel.

![The Graph pane zoomed in, showing the grey bars of the code with coloured marks and vertical transfer lines keyed gosub, go and return along the foot, and the Doc block panel at the right showing the ReadSymbol section](viz-example.png)

**The grey bars are the program.** Each line of *code* is a bar whose width is that line's length, so the code becomes a shape. The documentation is blanked rather than drawn, because on a file written to the convention of §7 the prose is longer than the code by a wide margin and it would bury the flow — but a blanked line keeps its row, so the axis still numbers the file as the editor does. At this magnification the text is unreadable and the language is not identifiable, which is the point: what remains is a **silhouette** a program has and no other program replicates exactly. A forensic examiner would call that valuable evidence, and it is worth not dismissing. Zoom in and the text appears inside the bars; at the top of the scale you are reading the source in place.

**If the vertical axis is *what*, the horizontal axis is *when*.** The run starts at the left and ends at the right, and the scale is counted in commands rather than in nanoseconds (§4 says why). Within one run the two roughly track each other; between two runs only the first is trustworthy.

**The dots mark the places a program can be watched from** — a labelled subroutine, a `while` loop, an event handler, a `return`, and the two marker commands — and a dot appears only where the run actually reached one. **Their colour is how busy that line is**: each starts blue and warms as the line is visited more often, so the busiest parts of the run end up red. A pale dot beside a red one is a comparison a reader can make without arithmetic.

**The vertical lines are the moments control stopped being linear** — the assembly-level `jump`, drawn in three kinds and keyed along the foot of the pane: `gosub`, `go` and `return`. **The colour is what the transfer was** — orange for a call, teal for a jump, pink for a return — and an arrow arriving at a dot says that control reached that line from somewhere else, and how.

**The two scrollbars are the window drawn as a proportion.** A handle's length is how much of the run you are looking at and its position is how far into it you have gone, which is why at a full fit the handle fills its bar and cannot be moved — not because a drag is refused, but because there is nowhere to go.

The picture zooms and pans, so the whole of a large script and the detail of one line are the same view at different distances: the wheel scrolls, shift-wheel and control-wheel zoom the lines and the steps separately, and a drag pans.

**And clicking a dot is where the picture starts answering questions rather than posing them.** A mark brings up, in the side panel, the documentation for the section that line belongs to. In Figure 3 that section is `ReadSymbol` — the very block §5 goes on to quote in full — so a reader can have the picture of what ran and the author's account of why, side by side, without scrolling. That is where AI does a double job: it wrote the code, it wrote the documentation, and the two are kept in step by the mechanism in §7.

**The panel does one more thing, and it is what makes the picture an instrument rather than a diagram.** It can show **values** — the data that arises during a run, which you would otherwise have to scatter `log` commands to see. Here they arrive in context, attached to the visit that produced them: the bar that names the line and the visit also carries the values the program held when it arrived there. What is shown is chosen by an annotation in the code — `@show Total, Row` on the line concerned — and the annotation has no effect whatever on how the program runs. It exists only to say what the recording should carry.

---

## 3. What it takes to record a run

Here is the difficulty, and it is not a small one. To record what a program did, you have to be able to ask the thing that runs it.

For an ordinary compiled program, nobody can ask. The runtime is a fixed black box: it takes your instructions and gives you output, and the interval between the two is not observable, let alone exportable. This is why a debugger has to *stop* the program in order to look at it — that is the only way in. And it is why the instruments in §1 are all either reactive (something went wrong), opt-in (a log line), temporary (a debugger session) or aggregate (a profile). None of them can answer the question *what did this program do, in order*, because none of them is on speaking terms with the machine that knows.

AllSpeak can, because it owns its runtime. It is a small, high-level language in the tradition of BASIC: statements that read like English, named labels as the target of a `goto` or a `gosub`, and an `if` and a `while` for everything a program has to decide or repeat. There is very little beyond that. It runs in two places — a JavaScript runtime in the browser, and a Python runtime on the command line and the desktop — and both of those runtimes are ours to ask. That is the entire reason this works, and it is why the same mechanism could not be bolted onto JavaScript or Python afterwards as a library. A recording needs a cooperating interpreter.

So the language has two commands for it, and a user learns two words:

```
    viz start
    …
    viz stop
```

Between them, every visit the program makes to a labelled subroutine, to a `while` loop and to a `return` is recorded. Outside them nothing is recorded at all, and with no recorder attached the commands do nothing whatsoever — a script carrying markers runs exactly like a script that does not, which is what lets the markers stay in the code permanently, as part of how the script explains itself.

There are refinements — record only on this label, record the first one and not every one, stop when this thread ends, stop after this many visits — but two words are enough to start, and that is deliberate.

---

## 4. The record

A recording is a file. The editor writes it beside the script, as `<script>.viz.json`; from a terminal it goes wherever you tell it to. It is a Chrome Trace Event document: the same format Perfetto and `chrome://tracing` read, chosen because it is the de-facto interchange for execution traces and because writing an existing format means a viewer works on day one rather than in a year. Both runtimes write it, against one specification, so a recording made by the command-line Python runtime can be read by the browser's picturing tool, and two traces of one script can be laid side by side, joined on the lines they share. The asymmetry is worth noting rather than glossing: the Python side writes records but does not draw them, because the picture belongs to the editor and there is only one editor.

What is in it is smaller than you might expect. Every event that records execution names **a line of the script**. A window records where it began, how it ended and how busy it was. Each arrival at a marker records which marker, which arrival in sequence, and how many commands the program had executed by then. Each transfer records where control left and where it arrived. Alongside all of it is a per-line count of how many commands on that line actually executed.

Two details of that are worth dwelling on, because they are what make the record usable rather than merely interesting.

**The comparable axis is a command count, not a clock.** Timestamps are in the file, and they are honest, but they include waiting, reading files and printing, so two runs of the same script will never agree on them and two different runtimes certainly will not. So every event also carries how many commands had executed when it happened. *That* is comparable: across runs and across machines, and it is the axis you lay one trace against another. It is also the one axis the two runtimes do not quite agree on — they compile slightly different numbers of commands for the same source — which is why traces from the two are joined on their line numbers. If you want to say "this happened early" and have it mean something to somebody else, this is the number that does it.

**Nothing is inferred that can be recorded.** The arrows in the picture that show a call, a return or a jump come from the run making them, not from a static reading of the text. This matters more than it sounds. A static analyser can tell you a `gosub` *could* reach a label; only a recording can tell you that it did, four times, from that line, in that order. The two runtimes' own compiler-generated jumps are recorded too, but kept in a separate category and drawn only on request, because a jump produced by an `if` is not a decision the author made.

---

## 5. Reading H₂O

The program I want to look at is a chemical formula parser: you give it `H2O` or `K4[Fe(CN)6]`, and it tells you how many atoms of each element are in it and what it weighs. It handles bracketed groups with multipliers, sums repeated symbols so that `CH3COOH` counts two carbons, and refuses anything it does not understand — a leading coefficient, a hydrate dot, a charge — rather than guessing. It is six hundred and twenty-six lines of AllSpeak: fifteen labelled subroutines, ten loops, and a line of documentation before nearly every section explaining why the section exists.

It is, in other words, exactly the kind of program an unfamiliar reader would struggle with. Not because it is badly written, but because it is *specific*: it knows about chemistry, and it has opinions about what to refuse.

The script carries one pair of markers, placed here:

```
MeasureFormula:
    if FormulaIndex is 0 viz start
    put Formula into Original
    gosub ExpandGroups
    …
    viz stop
```

Which is a way of saying: *record the first formula and nothing else*. That took one more step of reading than it looks, and the step is the point: the loop that drives this counts from zero, so `is 0` is the first formula and `is 1` would be the second. The marker is a condition, and a condition is code.

**Figure 4** — *[to be produced: the same recording seen whole — the frame rather than a window, where the file's 626 lines compress into one band per section and the spine of calls is the shape. Figure 3 shows a window into the same kind of picture; this one is the whole of it.]*

Here is what the record holds. One window, a dozen milliseconds of wall clock give or take, during which the program executed three hundred and one commands across one hundred and three of the file's six hundred and twenty-six lines. Forty-one arrivals at markers, spread across thirteen marker lines. Thirteen calls and thirteen returns, and sixty-seven jumps generated by the compiler itself for its own `if`s and loops. The single busiest line executed eighteen times. The millisecond figure is the one to distrust — two runs of this same script have given me 11.7 and 13.6 ms on a laptop — and the command count is the one that has not moved, which is §4's argument arriving as evidence.

Two of those figures are the ones I would look at first — the thirteen calls that make up the spine, and the eighteen executions of the single hottest line — and neither is visible in the text.

**Thirteen calls and thirteen returns, and one of them was the whole pipeline.** That is the first thing the picture shows and the text does not. `MeasureFormula` hands off to `ExpandGroups`, `ExpandGroups` to `ParseFormula`, `ParseFormula` to `ReadSymbol` and `ReadCount`, and the counting to `AddCount` and `ComputeMass` — six subroutines in a chain, one after another, and then back. A reader who wants to understand this program has just been told where the spine is. Everything else in those six hundred lines is either supporting infrastructure or a refusal path, and the picture has said so in a shape you can take in at a glance — before either of you has read a word of the code.

**Eighteen executions of a single line is where the work is.** The hottest line turned out to be the test of a `while` loop inside `ReadCount` — the loop that reads the digits following an element symbol, one character at a time. Second busiest, at sixteen, is its counterpart in `ReadSymbol`, which collects the lowercase letters of a symbol so that a bare `H` and a `Cl` are each read as one. Neither is a surprise once you think about it: a formula is read a character at a time, so the character-at-a-time loops are intrinsically the busiest places in the program. But it is worth knowing, and it is not something you can see by reading. If you were looking for somewhere that a change would pay, or somewhere that a small mistake would compound, that is the answer the picture gives rather than an argument.

**And one hundred and five lines out of six hundred and twenty-six.** The recording covers a single formula, so about a sixth of the file ran. That is not a defect in the recording, and it is one of the most useful things in it: for this input, the other five hundred lines did nothing at all. When you are trying to understand a program, knowing where the work *isn't* is worth nearly as much as knowing where it is.

What the picture does not do at this point is tell you any of that in words. It shows a shape: the spine of calls, the fan of visits, the heat. The reader does the interpreting, and the paragraph above is what that interpretation looks like. Which is the honest description of the method — the picture does not replace reading the code, it tells you **where to read** and **what to expect when you get there**.

Clicking a mark brings the other half of the story. Every section of the script carries its own prose, sitting in the file as part of the code, and clicking a dot in the picture shows the prose for the section that line belongs to, along with which visit this was and how many there were:

> **ReadSymbol: read one element symbol at `Pos` and step past it.**
>
> A symbol is an uppercase letter plus every lowercase letter following it, so `Na` and `Cl` are each one symbol and a bare `H` is another. Anything else at symbol position — the digit of a leading coefficient such as `2H2O`, a stray `.` — is refused with its position, because skipping it would report counts for a formula the user never wrote.

So the sequence is: see a shape, ask about a mark, read what the author said that corner of the program was for. Nobody has read a line of code yet.

---

## 6. Where it doesn't

The useful half of a claim like this is the half about failure, so let me be specific about what a picture of a run can catch.

**A subroutine nothing calls.** The editor compiles the script without running it and derives enough of the control-flow graph to know which labelled subroutines and which loops can be reached at all. A label with no caller is the classic residue of a rewrite: somebody moved a call and left its target behind, and nothing complained, because a jump to a label that exists *compiles*. The picture shows such a section as unreachable, and it shows it in preference to anything else about it — unreachable code is the more urgent fact. That is a fault found without a test, without a reviewer's memory and without running anything.

**A branch that never ran.** The record knows which lines executed. A line you expected to see lit up, that is not, is a question you can now ask about your own assumptions rather than about the code. It is also the cheapest way to discover that an error path has never once been taken in practice.

**A path that stops short.** The run ends where the record ends. If the program reached a marker and then nothing, the picture says so, and the last thing it shows is where the program was when it stopped being interesting — which is usually the first place to look.

**Heat where you did not expect it.** A line executing fifty times when you thought the loop ran three is arithmetic that no amount of reading reliably gets right. On loops and recursion, reading is worse than counting.

There is an important asymmetry in that list, and it is worth stating rather than sliding over. The first item is mechanised: the editor will tell you a section is unreachable whether or not you were looking for it. The other three depend on the eye, which means they depend on having a question. What the picture does is make the question affordable — a shape you can read in a glance is one you can revisit every time you change something.

---

## 7. The other instrument: prose bound to the code

The picture is one instrument. The second one is not visual at all, and it addresses a failure mode that every codebase has and few admit to.

AllSpeak code carries its own explanation. Not comments sprinkled through a function, but a block of prose wrapped around each section, saying why the section exists and what it has to be careful about. That much is just discipline, and discipline is what most projects rely on. What makes it different here is what happens next.

The analyser — a script that walks the file and reports on it — computes a hash of every section's code and writes it into the section's own tail. So a section's prose is tied to the exact code it describes. When the code changes, the hash no longer matches, and the section is marked as **changed since it was last described**. A description that has become a lie is therefore visible as a lie, rather than sitting there reading perfectly well:

```
!! ExpandGroups: spell every bracketed group out in full, leaving a bracket-free formula in `Expanded`.
!!
!! Counting groups and their multipliers in one pass would need a separate tally per nesting level…
!! @hash 3ea85314
!! @verified 3ea85314
!!!
```

And where the hash detects *change*, the second field records *judgement*:

```
!! @verified <hash>
```

That line means a person read this section against its description and accepted it. It is set by a human, in the editor, one section at a time, and the hash it records is the code the person looked at. If the code changes, the verification goes stale along with the hash — because a sign-off on a different version of the section is not a sign-off on this one.

I want to be honest about how fragile that is, because the honesty is the point. A hash can only tell you the code has not changed since somebody last looked. It cannot tell you the description is true, or that the person was paying attention. And there is a button that marks every section verified in one pass. It asks for confirmation first — whoever built it knew that a misclick would wipe a file's whole record — but confirmation cannot tell judgement from habit. Press it because the sidebar is full of amber and a real record of review becomes a decorative one, which is worse than having no convention at all, because a tool that reports success while the signal is gone is a tool that has taught you to stop looking. The convention earns its place only if the answer to "should I just mark it all verified" stays *no*. What it does is make one specific failure — a description that no longer describes the code — cheap to detect and hard to do by accident. That is worth a great deal, and it is not the same as correctness.

---

## 8. What this means in practice

Put the two instruments into a workflow and it looks like this.

You ask an agent for a change. It writes AllSpeak, and because the language is small and regular it mostly gets it right, and because the language is small and regular you can read what it wrote — which is the older and better-known half of the argument, and not what this article is about.

Then you run it, with the markers on, and you look at the picture before you look at the diff. Three questions, in this order:

- **did it go where I expect?** The spine of calls should be the spine you intended.
- **did it do it as often as I expect?** Heat where there should be none is the cheapest fault to spot and the one reading misses most often.
- **did it go anywhere I don't recognise?** A line lit up in a path you did not know about is the interesting kind of surprise, and the picture puts it in front of you rather than leaving it to be stumbled on.

Only then do you read the sections the picture made you curious about — and each of them is carrying its own explanation, with a hash telling you whether that explanation has been allowed to go stale.

And when somebody else needs to check your work, you hand them **the script and the recording**. Not access to a running system, not a screenshot with a caption you wrote, not a description of what you observed. Two files, both of which can be opened and examined on a machine that has never run the program, by a reviewer who can see the same shape you saw and reach their own conclusions about it.

That last sentence is the part professionals should pay attention to. It is not a claim about readability; it is a claim about *review*. Most of what makes AI-written code hard to accept is that accepting it means taking somebody's word for something. A picture of a run is not proof that the code is right — nothing is — but it is evidence you can inspect, and inspecting evidence is a different activity from trusting a description.

---

## 9. What this is not

The claim would not survive contact with a sceptical reader if I did not say this part, so here it is in full.

**It shows flow, not data.** The picture knows that a line ran, and how often. It does not know what the value in the variable was, unless you have asked for that value to be captured at a marker, which is a newer and narrower facility. A program can have a beautiful, tidy picture and be computing the wrong answer. Nothing here will tell you the arithmetic is right.

**Coverage is the run you made.** One input, one window, one recording. A path that a different input would have taken is simply not in the picture, and a branch that never ran in this recording is not therefore a branch that cannot run. If you want confidence across inputs, you still need tests, and AllSpeak has those too — they are a separate instrument and this one does not replace them.

**It says nothing about static quality.** Whether the code is well organised, whether the abstractions are right, whether this is the design you want: none of that is in a run. The reachability check finds dead subroutines, not bad ones.

**It costs something to draw.** The pane rebuilds its picture on every gesture, and a recording of this size takes a few hundred milliseconds on a laptop. That is fast enough to feel like a gesture and slow enough to notice, and the cost grows with the recording: a megabyte is seconds, not milliseconds. This is a genuine limit and it is the reason the tool is built for reviewing a run you have chosen, rather than for exploring a run of a large program. (Figures in this paragraph are from one machine and one recording, and are the numbers most likely to change.)

**It is not a replacement for a programmer.** Everything in §6 is a way of finding the *question*. None of it is made easier by a picture: not the algorithm, not the data structure, not the concurrency, not the design of the system. §1 said what AllSpeak is for and what it takes nothing away from, and a picture does not move that line — it only makes the English-describable half cheaper to check. That is the half this article is about. The other half is where the judgement is, and it is untouched.

---

## 10. Why it can only be this language

There is one more thing here, and it is the thing that decides whether any of it is available to you, so I want to say it plainly rather than leave it as an implication.

§1 made the point that a runtime decides what can be seen of a program, and that everything built to watch one is built on what the runtime exposes. The consequence is worth following through, because it is where this article's claim actually lies — and the claim is narrower than it first sounds.

**A recording of a run can be built for a language you do not own**, and people have built them. `coverage` will tell you which lines of Python never ran; `viztracer` writes a trace file in the very format §4 describes; a browser's own developer tools will record and export a performance profile. So the *format* is not the differentiator here, and neither is the idea.

What is different is **where the record is made from.** Every tool above watches through a general-purpose hook that the runtime happens to publish — a line event, an inspector message — and so knows about lines of text in a file. None of them knows that this program has sections, what the author called them, or what the author said they were for. AllSpeak's record is made *by the language*: the two commands that start and stop it are spelled in AllSpeak, the anchors are the author's own labels, and the documentation the author wrote travels inside the picture. That is the difference, and it is the one thing on this list that needs the runtime to be yours.

The second consequence is quieter. A picture of a run is only as useful as the relationship between the picture and the code, and that relationship is a property of the *language* — how many things can be happening at once, how control flow is expressed, whether a line means one thing. A language with a small grammar and explicit flow produces a picture with a readable shape. A language in which a page of arithmetic can hide four callbacks produces a picture that is mostly noise, and the honest thing to say about it is that recording would not have helped.

---

## 11. What is still being built

I would rather end with the state of things than with a conclusion, because this is work in progress and the direction is more useful to a reader than a summary.

The parts that are real and in daily use: recording, from either runtime and from a button in the editor, with the record written beside the script; a written specification for the format and a checker for it; the editor's three modes — plain text, the block view that reads a script by its sections, and the picture; and the documentation convention, with its hashes and its human sign-off.

What is still moving is the edge of the picture's usefulness. Capturing named values at a marker, so that a dot can show you not just *that* a line ran but what it was working on, is the newest and narrowest of the facilities. Arrows that explain themselves on a hover rather than needing a click are not built. A script that drives its own page rather than running by itself can be recorded too — by opening that page and arming it from outside — but that is the path least exercised, and I would not put it in a demonstration yet. And the drawing cost in §9 is what limits the size of recording the tool is pleasant to use on, so anything that reduces it widens the range.

Every one of those is a small step, and they are being taken deliberately, because the audience this is built for will leave at the first steep one. Two commands to record a run is a step small enough to ask of somebody who does not program. A picture with a legible shape is a step small enough to ask of somebody who has never seen the code. That constraint is also why the feature list will keep looking shorter than it could.

If the argument of this article can be compressed into one line, it is this:

> You do not have to read the code to find out where to read it.

---

*AllSpeak is open source and runs in the browser or from the command line. The recording format is specified at `spec/viz-trace-format.md` and the chemical formula parser used as the worked example here is `examples/chemical/parser.allspeak`.*
