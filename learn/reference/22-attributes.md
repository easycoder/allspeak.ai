# Attributes

An **attribute** is a note a script writes about itself. It is introduced by `@`, it is carried into the compiled program, and the runtime does nothing with it — which is the whole point: an attribute is for *other tooling* to read.

```as
@this parser reads atomic weights from parser.json

variable Total @the running total

Parse: @the weight table, one row at a time
    while Total is less than Limit @show Total, Row
    begin
        add Row to Total
        log Total @show Total ! the comment is not part of the attribute
    end
    return
```

Nothing above changes what the script does. Run it with the `@`-lines deleted and it logs exactly the same things.

## What an attribute is for

The audience is a tool running alongside the script — an analyser, a viewer, a recorder, a project's own build step — rather than the script itself. So an attribute is a place to say what a tool could not otherwise work out:

- **What a value is worth watching.** `@show Total, Row` on the statement that changes them saves a viewer from guessing which of a loop's variables matter, and it is more honest than a heuristic over the finished picture.
- **What a block is for.** A label is where a reader's question ("what is this?" ) already gets asked, so `Parse: @the weight table, one row at a time` is the natural home for a heading a tool can quote.
- **What the script is.** A file-level attribute names something about the whole script rather than any one statement.
- **Anything else a project invents.** The language does not police the vocabulary, and no tool is obliged to understand it.

Two consequences worth stating plainly, because both are easy to assume the other way round:

- **An attribute is not a comment.** A comment (`!`) is for the person reading the source, and it is gone by the time the program exists. An attribute is *in* the program: a tool receives a compiled script and reads its attributes without the source in front of it.
- **An attribute is not language.** The syntax is `@` in every language — [multilingual](multilingual.md) translation covers words, and `@` is not a word — so a tool written against one language's scripts reads an attribute in another's.

## Which runtime a script is for

AllSpeak has two implementations — one that runs in a browser, one that runs from the command line — and they are near-identical languages with different vocabularies. **A script says which of them it is for with `@py` or `@js` on a line of its own**, and **`@js` is the default**: an unmarked script is a JavaScript one.

```as
@py

script Parser
variable Total
```

This is the file-level attribute above, used for the case it was named for. Nothing in the language needs it — a runtime runs the script it is given, and both runtimes run an attributed script with no tool loaded — but a *tool* that has to choose a runtime cannot work it out any other way, and the alternative is the one thing worse than either answer: a script that says nothing, handed to the runtime that cannot run it, and reporting `I don't understand 'dictionary' at line 46` about a script that is not broken.

So the marker is **read by whatever chooses a runtime**, and there is one such thing so far: the visualiser's `record the script …` command, which runs a script of the caller's choosing. Asking the *other* runtime for a script is refused in a sentence that names the marker and both runtimes, rather than in a compile error.

Two things worth knowing:

- **It is read from the source, before the script is compiled.** A script written for one runtime is exactly the script that will not compile in the other, so a marker read off the compiled program could never be reached. The tokeniser is what lifts an attribute out of a line, so no compile is needed to find one.
- **It changes nothing about a run.** Rule 14 holds: the marker is carried into the program and the runtime ignores it, so the same script runs the same way with the marker deleted — it is simply no longer labelled.

## Where to put it

**On the same line as the statement it belongs to.** The line is the unit: an attribute runs from its `@` to the end of the line, or to a `!` comment, whichever comes first.

```as
while Total is less than 10 @show Total, Row
return @show Result
log Total @show Total ! a comment ends the attribute
```

A line holding *only* an attribute belongs to nothing in particular, and that is the right shape for something said about the script as a whole:

```as
@this parser reads atomic weights from parser.json
```

**Not on the following line.** An attribute describes a statement, and the statement before it has already been compiled by the time the next line is read — so `@`-after-the-fact would be a second way of saying the same thing with worse rules. If the statement you want to annotate ends with `stop`, `exit` or `return`, the next line is not even reachable.

**A label takes it on the label's own line**, which is the one case that is not a statement's line:

```as
Parse: @the weight table, one row at a time
```

## Reading them back

An attribute is a single string: whatever followed the `@`, trimmed, with any `!` comment removed. The runtime does not split a key from a value, and a tool that wants one does its own splitting — `@show Total, Row` is `show Total, Row`, and a project that wants `key=value` or `key: value` may have it, because the language has no opinion.

In the compiled program an attribute is an `attr` field on the element the statement became. Where a statement compiles to no element of its own — a line holding only an attribute, or a label — the attribute is carried by an element of its own, which the runtime steps over; for a label that is the element the label addresses, so following the label finds its attribute.

## Related

- [doc-blocks](doc-blocks.md) — `!!` prose blocks, and `@`-lines *inside* one, which are the analyser's metadata (`@hash`, `@verified`) and never reach the compiler.
- [structure](structure.md) — how a line becomes tokens, and where comments are dropped.
- [symbols-and-layout](symbols-and-layout.md) — the punctuation the language already owns.
