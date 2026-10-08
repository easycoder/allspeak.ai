> **Draft — not for publication.** Started 2026-10-07. The umbrella piece: what AllSpeak is for, and why it is about intent as much as about code. `why/article.md` ("Reading a program without reading it") stays as it is and is the deep dive this points at — the worked example, the measurements, and the prior art it argues with.
>
> **Before this goes anywhere:**
>
> 1. **Its own review log.** `why/REVIEW-LOG.md` exists so that reviewing the article is a checklist rather than a re-read. This piece makes *broader* claims, so it needs the same treatment before it goes out — every checkable claim listed against what would make it stale — and a row added for each claim that refers to the article or to `STRATEGY.md`.
> 2. **One worked story, and it has to be real.** §3 is written as a short narrative on purpose. It should be replaced by something that actually happened, with a figure, once the debugger exists. A story the tooling cannot demonstrate is the first thing a sceptic will pull on.
> 3. **The title.** *Code without coding* is Graham's phrase and it is the door. Alternatives that carry the same argument without the slogan: *Intent, with the code beside it*, *Reading intent without reading code*. Test whichever goes on the page against §4, because the slogan and the honesty have to survive each other.
> 4. **The honest half is not optional.** §4 and §5 are the load-bearing sections. If the piece ever gets trimmed for the site, trim §6, not those.
> 5. **The tool's name.** It is being renamed to **Viz** (decided 2026-10-07; the plan and the compatibility problem are in `STRATEGY.md`, step 1). Once the rename has shipped, this piece should *use* the name — a product nobody has named reads as a prototype — and until then it deliberately says "the tool", because a published page naming something that does not exist yet is worse than a page that is plain.

---

# Code without coding

*How you review what an AI wrote for you, without reading the code — and how far you go is your choice.*

---

## 1. You asked for something, and you got code

That is where most AI-assisted work ends, and it is a strange place to stop. You described an outcome in words. Something produced a program. The program may or may not be what you meant, and the only instrument you have been given to find out is **trust** — with a test run if the program is the kind that can be tested, and a look at the code if the program is the kind you can read.

The problem is not that code is unreadable in principle. It is that **code is intent, compressed**. A great deal of what you meant is not in the text: it is in the arrangement, in what happens first, in what happens when a request fails, in what the program does the fourth time the same thing happens. Reading the code back means decompressing all of that, and the skill of doing it is exactly the skill you were trying to avoid needing.

So the gap is not "can you code". The gap is **"can you tell whether this is what you meant"** — and for most people the honest answer today is: not without taking somebody's word for it.

## 2. Intent, kept beside the code

AllSpeak approaches it from a different direction. Not by hiding the code, and not by replacing it with a form to fill in — but by writing the **intent down beside the code, as the unit of work**, and then building the tools around that unit.

A script is divided into **blocks**. A block is a short synopsis, then the prose explaining what it is for and why it exists, and then the code itself. The prose is the author's own, in the author's own words and language. The block is what the editor shows you first, what it names when you look at a run, and what a reviewer reports on.

From there, three things follow, and all three exist today:

**A vocabulary a person can read.** AllSpeak's syntax is deliberately plain — labels, `put`, `add`, `if`, `while` — and its vocabulary is **per language**: the keywords, the messages and the tool's own words come from a language pack, so a French team writes French and reads a French tool. That is not a translation layer bolted on the side; the per-language front-ends are the design.

**A run you can be handed.** This is the part no conventional language ships. Two words anywhere in a script — `viz start` and `viz stop` — and the run between them is recorded to a file that sits beside the script. It carries the program's own names and the author's own prose, it is plain text, and it can be read on a machine that cannot run the code. Nothing else that watches a program produces something you can hand to another person: a stack trace starts at a failure, a log holds the lines somebody thought to write, a debugger exists only while somebody is sitting at it, a profiler tells you what was hot and nothing about what happened in what order.

**A picture of that run, in the tool.** Click one button and the recording is drawn: every line the run touched, how busy each was, the order it moved in, and where it went back to. Click a mark and the panel shows the prose of the block that line belongs to, so you are reading the *intent* of the part that ran. If the script asked to watch particular values — one line of annotation, `@show Total` — the numbers it captured appear beside the mark.

None of that needs a new language to read, and none of it works by hiding anything: the code is one click away, the recording is a file you can open, and the block's prose sits next to the code it describes.

## 3. What it looks like

You asked for something that reads a spreadsheet, checks a column against a reference, and emails a list of the exceptions.

The AI writes the script. What you look at first is **not the code**: it is the list of blocks — *read the file*, *check each row against the reference*, *collect the exceptions*, *email them* — each with a paragraph saying what it does and why. That is the intent, and you are the one person who can say whether it is your intent. If a block says "the latest price wins" and you meant the earliest, you have found the disagreement without reading a line of code.

Then you run it. A picture appears: the whole run, in order, with the parts that did most of the work showing hottest. You can see that the check ran four thousand times and the email block ran once, which is what you would expect — or you can see it ran four *hundred* times and start asking why. Click any mark and the block's prose is beside it, so the question "what was it doing here" is answered in the same breath as "where is here". Where the script captured values, the numbers are there too.

And when the picture raises a question it cannot answer — *how often did it retry, and how long did it wait?* — **that is the next thing to build**: the ability to ask the run a question in the language you already read, with the answer coming back as text you can check. (See §6. It is designed and not yet built; the rest of this piece is about what exists.)

## 4. What this is not

- **It is not a no-code builder.** Nobody is claiming you get a working program without code. You get a working program *with* code — and an explanation of that code you can review.
- **It is not "you never need to look at the code".** It is "you can review the intent first, and go as deep as you choose". If the intent is wrong, no amount of code-reading helps; if the intent is right and you want to check the detail, the code and the recording are both there.
- **It is not a proof.** The `@verified` mark you will see on a block is a **record of what a person signed off, at that version of the code** — and it goes visibly stale the moment the code changes. It tells you somebody looked. It does not tell you they were right.
- **It is not interactive.** A recording is of a run that happened, of one input. It is evidence about that run, and it says so.
- **It is not fast on a huge run.** Recording something that runs for ten minutes gives you a big file, and a big file takes seconds to draw the first time. The tool now says how long it expects to wait, and lets you narrow the range — but a very large recording is a lot of data, and pretending otherwise would be the kind of promise this section exists to prevent.

## 5. The bargain

Here is the exchange, stated as plainly as I can.

**You get:** a way to see whether an AI understood what you meant, without first becoming the person who can read what it wrote — and with the evidence attached, in a form you can keep, show, and argue with.

**You give up:** the idea that you can be *sure*. You still have to read. The difference is *what* you read — a paragraph of intent and a picture of a run, rather than a program — and that the choice of how deep to go is yours rather than a skill gate.

**And the code stays visible, deliberately.** A review that hides the thing under review is not a review; it is a subscription. Everything here assumes you may want to look at the code, and nothing here stops you.

## 6. Where this is going *(planned — not built yet)*

The gap left in §3 is the interesting one: a picture tells you *where* and *how often*, and it cannot yet tell you *what was true*. Two things close it, and both are designed:

- **Values, captured by asking.** A script can already name the variables worth watching; the next step is naming them where you want them captured, so a run records what the numbers *were*, not just how many times a line ran.
- **Questions, asked of the run.** Because AllSpeak is the language the tool is written in, a question can be a short AllSpeak *program* run against the recording — written for that question, discarded afterwards. That is what makes richer questions possible without inventing an expression language for the purpose, and it is why the tool can offer it while the syntax stays as small as it is.

There is a second half to that which only makes sense once the first is in place: the AI can use it too — record a run, look, and check a theory about what the program actually does, rather than reasoning about the code and hoping.

## 7. To the two audiences

**If you cannot read code**, this is for you: the review step has been the step you were missing, and it is now a step you can take. Read the blocks, run it, look at the picture, ask the questions you would ask a person.

**If you can read code** — and especially if you have learned that code is only as good as the intent behind it — this is also for you. Its first move is the one you have always made by hand: understand the intent before reading the implementation. AllSpeak just makes that move the default, keeps the intent in the file beside the code, and records what the program actually did so that agreement between the two is something you *check* rather than something you assume.
