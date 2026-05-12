# Symbols and layout

AllSpeak has a deliberately small lexical surface. **Four punctuation symbols** carry meaning; everything else is a word. Doc-block markers add a fifth lexical category for prose, layered on top.

Any non-alphanumeric character outside a string or comment that isn't one of these is a compile error. There are no parentheses, no braces, no brackets, no semicolons, no infix `+`, `=`, `*`. Operators are keywords; grouping is by layout, not by punctuation.

## The four symbols

| Symbol | Meaning |
|--------|---------|
| `!` | Comment. From the `!` to end of line is ignored. (Inside a backtick string, `!` is just text.) |
| `` ` `` | String literal delimiter. Matched pairs enclose constant text, possibly multi-line. |
| `:` | Label terminator. A word followed by `:` at the start of a line declares a label. |
| `-` | Negation prefix on a numeric literal: `-3`. There is no infix `-`; subtraction is the keyword `take`. |

## Comments

Comments start with `!` and run to end of line:

```as
! This is a comment.
add 1 to Counter   ! Trailing comment on a code line.
```

Use them to mark functional blocks of the script. Don't rely on variable names alone to convey intent. Trailing single-line comments are fine where an explanation is non-obvious; for anything longer than a sentence, prefer a doc-block (below).

## String literals

Backticks delimit constant text:

```as
put `Hello, world!` into Greeting
```

A backtick string can span multiple source lines:

```as
put `line 1
    `line 2
    `line 3` into Message
```

Each continuation line begins with a backtick after any leading whitespace. The leading whitespace and the continuation backtick are stripped, and the lines are joined without newlines. The example above produces the string `line 1line 2line 3`.

There is no escape syntax inside backticks. To include a literal newline, tab, or backtick character, use the value keywords `newline`, `tab`, and `backtick` with `cat`:

```as
put `Line 1` cat newline cat `Line 2` into Message
```

See [strings-and-text](strings-and-text.md) for `cat` patterns.

## Labels

A label is a word followed by `:` at the start of a line:

```as
Loop:
    add 1 to Counter
    if Counter is less than 10 go to Loop
```

Labels are the targets of `go to`, `gosub`, and event-handler registrations (`on click X gosub Label`).

## Numbers

Integer literals are just digits. Negative numbers are written with a `-` prefix:

```as
put -3 into Offset
```

There are no floating-point literals at the syntactic level — numbers that look like floats (`3.14`) are strings. See [arithmetic](arithmetic.md) for the scaled-integer pattern.

## Doc-block markers

A separate lexical category, used for the documentation-block convention rather than for runtime semantics:

- `!!` opens and continues a doc block. Each `!!` line is one paragraph of prose.
- `!!!` (three bangs) closes the block.

```as
!! Brief explanation of what this section does and why.
!! A bare !! line separates paragraphs.
Section:
    ! the code
    return
!!!
```

Doc blocks are stripped before compilation. Full convention in [doc-blocks](doc-blocks.md).

## Layout

Code is structured by indentation, not by punctuation.

- Labels start at the **left-hand margin** — column 1.
- Code under a label is indented one tab in.
- Code inside `begin … end` is indented one further tab, like nested blocks in other languages.

```as
Main:
    set Counter to 0
    while Counter is less than 5 begin
        add 1 to Counter
        print Counter
    end
    stop
```

If you prefer `begin` and `end` to have matching indents — a common preference borrowed from other languages — put `begin` on its own line:

```as
Main:
    set Counter to 0
    while Counter is less than 5
    begin
        add 1 to Counter
        print Counter
    end
    stop
```

Either form compiles. Pick one and use it consistently throughout a script.

The compiler is tolerant of whitespace, but consistent layout is essential for reviewability. Misaligned blocks are a strong signal of structural error — particularly in AI-generated code.

## Blank lines

Use a blank line to separate logical groups:

- Between variable declarations of different kinds.
- Between the main variable group and scratch variables (`I`, `N`, `Temp`).
- Between major labelled sections.

One blank line says "these things belong together as a group, but are distinct from the next group." Two or more carry no extra meaning but are harmless.

## Variable names

Names start with an uppercase letter; CamelCase from there. Full conventions in [variables-and-arrays](variables-and-arrays.md) — this file covers only the lexical rule.

## Related

- [structure](structure.md) — where this lexical layer sits in the compile pipeline.
- [variables-and-arrays](variables-and-arrays.md) — full naming conventions.
- [strings-and-text](strings-and-text.md) — building strings with `cat`.
- [doc-blocks](doc-blocks.md) — `!!` and `!!!` in detail.
- [arithmetic](arithmetic.md) — why `-` is only a numeric prefix.
