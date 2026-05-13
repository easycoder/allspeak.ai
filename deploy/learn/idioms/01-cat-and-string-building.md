# cat and string building

## Problem

You need to build a string from several pieces — a constant prefix, a variable value, a literal separator. AllSpeak's `cat` keyword joins two values; where it goes is the single most common mistake when starting out, and the most common mistake AI tools make when writing AllSpeak.

## Pattern

`cat` is **infix**. It goes *between* two values, never before the first and never after the last.

```as
put `Hello, ` cat Name cat `!` into Greeting
```

Read this as: `` `Hello, ` `` then `Name` then `` `!` ``, with `cat` separating each pair. There is no leading `cat`; there is no trailing `cat`.

Any number of pieces can chain — each adjacent pair joined by one `cat`.

## Anti-pattern: leading `cat`

```as
put cat `Hello, ` cat Name into Greeting   ! WRONG
```

The leading `cat` makes the compiler look for a value before it, find nothing, and report a parse error. Drop it.

## Anti-pattern: missing `cat`

```as
put `Hello, ` Name `!` into Greeting   ! WRONG
```

Adjacent values without `cat` between them are not implicitly joined. AllSpeak has no C-style string adjacency rule. Every join must be explicit.

## Values `cat` can join

`cat` joins any pair of values, not just strings. Numbers, timestamps, properties, results of `the content of …` — anything that produces a value:

```as
set Count to 7
put `You have ` cat Count cat ` messages.` into Status
put `Logged at ` cat the timestamp
    cat ` — Name field: ` cat the content of Name into Log
```

Numbers are converted to their textual form on the spot. `Status` is now `` `You have 7 messages.` ``.

## Gotcha: greedy value parsing

AllSpeak has no operator precedence and no expression-grouping syntax (no parentheses). When a construct like `left N of X` reads its value for X, the parser consumes as much as it can — including any trailing `cat … cat …` chain.

This mirrors spoken English, which has no operator precedence either. *"I can see Anne and Bob in the park"* doesn't tell you whether both are in the park or just Bob; the same ambiguity is exploited regularly for comic and rhetorical effect. AllSpeak inherits the trait; the cost is that you have to be deliberate about where each value ends.

So:

```as
put left 4 of `Hello!` cat newline into Result
```

does **not** mean `(left 4 of \`Hello!\`) cat newline`. The parser reads `` `Hello!` `` `cat newline` as one combined value, then applies `left 4 of` to it. `Result` ends up as `Hell`, with no newline — the newline was already inside the value that `left 4 of` then truncated.

To force the intended order, assign to a temporary first:

```as
put left 4 of `Hello!` into Result
put Result cat newline into Result
```

This temporary-variable pattern is the AllSpeak idiom for forcing evaluation order in any expression involving value-consuming operators.

## Inserting newline, tab, and backtick

Backtick strings have no escape syntax. To include a literal newline, tab, or backtick character, use the value keywords `newline`, `tab`, `backtick` with `cat`:

```as
put `Line 1` cat newline cat `Line 2` into Output
```

`Output` is now two lines separated by an actual newline character. There is no `\n` notation inside backticks; this `cat`-with-keyword pattern is canonical.

## Multi-line backtick literals

For long constant strings, a multi-line backtick literal can substitute for several `cat`-joined fragments:

```as
set Css to `position:relative;
    `width:90%;
    `margin:1em auto 0;
    `border:1px solid black;`
```

Continuation lines start with a backtick after any leading whitespace; the lines are joined without newlines. See [symbols-and-layout](../reference/symbols-and-layout.md) for the lexical rule.

Use this when you have a single long literal value. When you need to interleave constants and variables, stick with `cat`.

## Template-style construction

Constant fragments inside backticks, variable inserts with `cat` between, in one expression:

```as
put `User ` cat UserName cat ` (id ` cat UserId cat `) logged in at ` cat Time into LogLine
```

For long templates, break across lines at `cat` boundaries:

```as
put `User ` cat UserName
    cat ` (id ` cat UserId
    cat `) logged in at ` cat Time
    into LogLine
```

The `cat` at the start of a continuation line is a normal token — AllSpeak doesn't care about line breaks inside a statement, only about whitespace between tokens.

## Related

- [symbols-and-layout](../reference/symbols-and-layout.md) — backtick syntax and the multi-line rule.
- [strings-and-text](../reference/strings-and-text.md) — string operations (`replace`, length-of, position-of).
- [variables-and-arrays](../reference/variables-and-arrays.md) — what's being interpolated.
