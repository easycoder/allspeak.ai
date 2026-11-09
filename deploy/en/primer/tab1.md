# Code without coding

You have probably heard of *vibe coding* — you tell an AI what you want, and it writes the software. It sounds like magic, and sometimes it is. But there is a catch: the language it writes in is JavaScript, or Python, or something else with brackets and semicolons, and unless you already read that language you have no way to tell whether the job was done well. You are trusting the AI, and when something breaks — and it will — you are stuck.

Learning to program properly is the other road, and it is months before the first useful thing. Most people do not have that long.

AllSpeak sits between the two. It is a scripting language that reads like English, so when an AI writes code for you, you can follow what it is doing — and you stay in control without needing a computer science degree.

## What does that look like?

Here is a real snippet:

```
    attach Display to `greeting`
    put `Hello!` into Message
    set the content of Display to Message
```

No brackets, no semicolons, no mystery. If you can read a sentence, you can read AllSpeak.

## Not a toy

AllSpeak builds real software. Web apps with interactive pages and styled layouts. Command-line tools that talk to APIs, process data and manage files. Multi-screen applications with navigation, forms and user input. Live connections using REST and MQTT. It runs in any browser (the JavaScript version) or from the terminal (the Python version) — or both together.

The secret is that an AI does not care what language it writes in. Give it a capable high-level language and it delivers the same functionality as it would in JavaScript — but in a form you can actually read, check and modify.

## A smaller surface for the AI to get wrong

The other reason the language is small is the AI itself. A large language — with a huge standard library, several ways to do the same thing, and APIs that change between versions — gives the model many places to invent something that looks plausible and is not there. That is what people mean by hallucination, and it is worse when the code is long enough that nobody reads it.

AllSpeak narrows that surface. The vocabulary is small and consistent; the grammar is regular; there are no brackets, semicolons or framework conventions to get subtly wrong. When the AI does make a mistake, the compiler usually catches it on the line where it happened, and the error is plain enough to fix in a sentence. The language does not make the AI correct — it cannot know what you meant — but it makes the common failure mode *visible and cheap*, instead of hiding it in code nobody can check.

That is the honest claim: fewer places to go wrong, and a shorter distance from a wrong line to the fix. It does not remove the need to review what the AI produced; it makes that review possible.

## Why not one language?

The obvious objection is that a single stack is simpler: write everything in Python or everything in JavaScript, and there is one language to learn, one runtime, one build.

It is simpler until the two jobs pull in opposite directions. Most of an application is **policy** — what it decides, in what order, for whom. That is the part a person has to read and check, and the part that changes when the requirements change. The **mechanism** — the protocol handler, the hardware driver, the numerical kernel, the renderer — is written once, tested once, and should then get out of the way.

AllSpeak keeps the policy in the readable layer and lets the mechanism live in JavaScript or Python behind a small vocabulary. That is a mixed stack, and it is the design rather than a workaround: the code you review stays small, and the hot paths run at the speed of their own language. The rule is simple — if the code is policy, keep it in AllSpeak; if it is a mechanism that is repeated or measured hot, give it a plugin.

A large application already makes this choice when it puts a database behind SQL or an image pipeline behind a library. AllSpeak makes the boundary explicit, and keeps the readable half in the language you review. The [Learn curriculum](../learn/) carries the decision guide.

## And there is a tool that already knows all of this

This is the part other languages do not give you, and it is why we built **Viz** — the AllSpeak editor, which `allspeak viz` opens.

Viz is not a general-purpose editor that happens to support AllSpeak. It knows the language, and that is what lets it show you one file in three ways, none of which needs a second file or a second tool:

- **As text.** The whole script, with the words highlighted — and with the language's own compiler behind it, so it can check what you are looking at without a build step. The least remarkable of the three, and the one it shares with every other editor.
- **As blocks**, which changes how you read a script. It stops being a wall of text and becomes a series of sections: a short note in the writer's own words, sitting beside the code it describes, with the list of sections down the side to move between them. You read the note, and the code it is talking about is right there. That works because the prose is *in the file*, written in the language's own comment syntax — not in a separate document that has to be kept in step with it.
- **As a picture of a run**: which parts of the program were reached, in what order, and how often. Each run is kept as a file, so it can be opened later — by you, or by somebody else, on a machine that cannot even run the code.

Those three would be three products elsewhere: a documentation generator, a debugger or profiler, a coverage report — each with its own conventions, and none of them obliged to agree with the source. Here the language already carries the prose and the markers, so they are **views of one file** rather than separate things to be kept in step.

A stack trace tells you that a program failed. A log is something you chose to write. A recording is the run itself — and even its markers, `viz start` and `viz stop`, are ordinary keywords, so a script carrying them runs exactly as it would without them and there is no "debug build" to maintain alongside the real one.

## What you actually do

You do not write the code. You describe what you want to an agent — Claude Code, Reasonix, or whichever you already use — and it writes the AllSpeak. Your job is to read what it wrote and say whether it is right.

That is why the language is as plain as it is, and why every section of a script carries a short note in plain language, written by the AI, saying what it meant by it. You are reviewing *intent*, not deciphering code.

**Next: the Get started tab.** It sets up a project and builds one with you, in about five minutes.
