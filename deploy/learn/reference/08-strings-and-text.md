# Strings and text

AllSpeak's string type is the everyday holder of text. This file lists the operations Core provides for inspecting and transforming strings.

Backtick literals and `cat` concatenation are covered in [symbols-and-layout](symbols-and-layout.md) and [cat-and-string-building](../idioms/cat-and-string-building.md).

## Length

`the length of X` returns the character count:

```as
put the length of `Hello, world!` into N
! N is 13
```

## Slicing

Four forms, all producing a substring without modifying the original:

```as
put left 5 of `Hello, world!` into A         ! "Hello"
put right 6 of `Hello, world!` into B        ! "world!"
put from 7 of `Hello, world!` into C         ! "world!"   (from position 7 to end)
put from 7 to 12 of `Hello, world!` into D   ! "world"    (positions 7..11, end exclusive)
```

- `left N of X` — the first N characters.
- `right N of X` — the last N characters.
- `from N of X` — everything from position N to the end.
- `from N to M of X` — the substring covering positions N..M (M exclusive).

Position indices are 0-based.

## Position search

`position of X in Y` returns the index of the first occurrence of X within Y, or -1 if not found:

```as
put position of `,` in `Hello, world!` into Comma
! Comma is 5
```

To find the *last* occurrence, use `the position of the last`:

```as
put the position of the last `,` in Text into P
```

For parsing simple structured input — splitting `` `12.50` `` into pounds and pence, finding the delimiter in a "key=value" line — `position of` plus the slicing operators give a workable parser. See [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md) for a worked example.

## Case conversion

```as
put lowercase `Hello` into X        ! "hello"
put uppercase `Hello` into Y        ! "HELLO"
```

Both produce a new string; the original is unchanged.

## Trim

`trim X` strips leading and trailing whitespace:

```as
put trim `   spacious   ` into Tidy
! Tidy is "spacious"
```

## Substring replacement

`replace X with Y in Var` modifies `Var` in place, substituting **every** occurrence of X with Y:

```as
put `red car, red bike, red shoes` into List
replace `red` with `blue` in List
! List is "blue car, blue bike, blue shoes"
```

Two things to note:

- It's a statement, not a value — it writes back to the named variable.
- It always replaces all occurrences; there is no single-replacement variant.

To preserve the original, copy first:

```as
put OriginalText into Working
replace `foo` with `bar` in Working
! OriginalText is untouched
```

## Inclusion test

`X includes Y` tests whether X contains Y as a substring (used in a condition):

```as
if Path includes `/api/` ...
if Email includes `@` ...
```

See [conditions](conditions.md) for the full set of string-related conditions (`is`, `starts with`, `ends with`, `includes`).

## Multi-line strings

Backtick literals can span lines. Each continuation line starts with a backtick after its leading whitespace; lines are joined without newlines:

```as
set Css to `position:relative;
    `width:90%;
    `border:1px solid black;`
```

To embed an actual newline, tab, or backtick character, use the value keywords with `cat`:

```as
put `Line 1` cat newline cat `Line 2` into Two
```

See [symbols-and-layout](symbols-and-layout.md) and [cat-and-string-building](../idioms/cat-and-string-building.md) for the full story.

## Strings and numbers

A string that contains only digits is treated as numeric when arithmetic asks for a number:

```as
put `42` into N
add 1 to N         ! N is now 43
```

A string that contains decimal-style content (`3.14`) is *not* automatically promoted; AllSpeak arithmetic is integer-first. See [arithmetic](arithmetic.md) and [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md).

To test whether a value can be used as a number, use the `is numeric` condition:

```as
if Input is numeric ...
```

## Related

- [symbols-and-layout](symbols-and-layout.md) — backtick literals, multi-line strings.
- [cat-and-string-building](../idioms/cat-and-string-building.md) — `cat` infix concatenation, template patterns.
- [conditions](conditions.md) — string-related conditions.
- [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md) — parsing decimal-looking strings.
- [values-and-types](values-and-types.md) — the numeric / non-numeric flag.
