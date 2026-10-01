# House style

The compiler accepts more than this page recommends. What follows is the **house style** — the choices this project makes where the language leaves one open, so that a script written this month, by a person or by an AI tool, reads like the rest of the codebase. It is a recommendation rather than a rule: nothing here is enforced, and a script that breaks it still compiles.

Two subjects, both of them layout: **where `begin` and `end` go**, and **how a long statement is split across lines**.

## `begin` and `end` on their own lines

`begin` may share the line of the statement that opens the block:

```as
while N is less than 3 begin
    print N
    add 1 to N
end
```

House style gives `begin` a line of its own, at the indent of the statement that owns the block — the body one level deeper, and `end` back at the statement's indent:

```as
while N is less than 3
begin
    print N
    add 1 to N
end
```

Three reasons:

- **A block's extent is visible without reading its condition.** `begin` and `end` line up, so the shape of the block can be measured at a glance.
- **A `begin` at the end of a long line is the one easiest to miss**, and it is the one that decides whether the lines after it are a block at all.
- **A structural change costs a line in the diff**, rather than a few characters appended to a long one.

### The one exception: `else begin`

A clause opener may share its line with `begin`, provided nothing else is on that line. `else begin` is the form that comes up, and it is how a dangling `else`, alone on a line of its own, is avoided:

```as
if Name is empty
begin
    set Missing
end
else begin
    clear Missing
end
```

`then begin` is allowed on the same grounds. The only `then` in the language follows `run` — ``run `Other` as Panel nowait then begin … end`` — so it is rare; `else begin` is the one worth remembering.

Nothing else shares a line with `begin`. `if <condition> begin`, `while <condition> begin` and `on click Element begin` all take the line break.

## Splitting a long statement

A join that fits comfortably on one line stays on one line. This section is about the **long** ones — the builds that wrap in a narrow editor pane, in a diff, or in a review view, where the wrapped tail of a line reads like a statement of its own and the join has to be hunted for.

Where a statement does have to be broken, it is broken **before** the joining word — `cat`, `and`, `or`, `with` — with the continuation indented one level deeper than the statement. The statement's own tail (`into X`, `giving Y`, `to Z`) ends the last line.

### Leave a short one alone

```as
put `You have ` cat Count cat ` messages.` into Status
```

### One `cat` per line, where it has to be broken

Six fragments make a long line, so each `cat` starts one:

```as
put `User `
    cat UserName
    cat ` (id `
    cat UserId
    cat `) logged in at `
    cat Time
    into LogLine
```

This also puts the mistake `cat` invites — a missing join, or a leading `cat` — at the left edge of the page, where a glance finds it, rather than somewhere inside a wrapped line.

### `and` and `or`, the same rule

Short enough to fit, so it stays:

```as
if Name is empty or Email is empty go to Reject
```

Long enough to wrap, so it breaks before each joining word, with the action left on the last condition:

```as
if BookingDate is empty
    or BookingTime is empty
    or GuestCount is less than 1 go to RejectBooking
```

An argument list breaks the same way, and on the same condition — `gosub Render with Panel` / `and Title` / `and Rows` is a line that fits and stays one; a call with a dozen arguments is not, and breaks before each `and`.

### The indent is for the reader, not the compiler

The compiler joins a continuation because the **grammar** continues — a `cat` after a value, an `and` after a list — and it is indifferent to how the line is indented: a continuation flush at the left margin compiles exactly the same as one indented three levels. So the extra indent has one purpose, which is that the eye sees a statement that has been broken rather than several statements in a row.

What the grammar will not do is continue a statement that has already closed. A `put … into D` completed on one line, followed by a line beginning `cat`, is a compile error — the commonest surprise in this area, and the reason to split *before* the joining word rather than after it.

## Related

- [symbols-and-layout](symbols-and-layout.md) — labels, indentation, comments, backtick strings.
- [control-flow](control-flow.md) — `begin … end` blocks, `if` / `else`, `while`.
- [cat and string building](../idioms/01-cat-and-string-building.md) — the `cat` idiom in full, including the greedy-parsing gotcha.
- [doc blocks](doc-blocks.md) — the prose convention that goes with a house style.
