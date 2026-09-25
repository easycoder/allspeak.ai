# Conditions

A condition is something that evaluates to true or false. AllSpeak uses keyword-driven conditions; there are no infix comparison operators (`==`, `!=`, `>`, `<`, `>=`, `<=`) — in fact virtually all punctuation symbols are disallowed by design. AllSpeak aims to be **speakable**: every construct reads as conversational English.

This file lists Core's condition vocabulary, which is what `if` and `while` consume. Domains and plugins can contribute their own conditions — see [structure](structure.md).

## Equality and comparison

`is` tests equality:

```as
if Counter is 0 ...
if Name is `admin` ...
```

`is not` tests inequality. For languages whose grammar prefers it, `not is` is also accepted:

```as
if Status is not `error` ...
```

Numeric comparison uses `is less than` and `is greater than`:

```as
if Count is greater than 0 ...
if Index is less than the length of List ...
```

For ≤ and ≥, invert the test — there are no explicit `is at most` / `is at least` keywords:

```as
if Score is not less than 60 ...        ! ≥ 60
if Items is not greater than Max ...    ! ≤ Max
```

## Common mistakes with C-style operators

AllSpeak uses English keyword conditions. C-style operators are **not valid**:

| Wrong (C-style) | Correct (AllSpeak) |
|---|---|
| `if X == 0` | `if X is 0` |
| `if X != 0` | `if X is not 0` |
| `if X > 5` | `if X is greater than 5` |
| `if X < 5` | `if X is less than 5` |
| `if X >= 5` | `if X is not less than 5` |
| `if X <= 5` | `if X is not greater than 5` |

The keyword forms read left to right in natural English. An AI writer that defaults to C-style operators will produce invalid code — always use the keyword forms.

## Common mistakes with string vs number comparison

`is` compares values as text by default. When comparing a string like `"04"` with a number, the comparison is lexical (character-by-character), not numeric:

```as
if Mm is not less than `04`     ! string comparison — works for "05" but breaks for "10" < "04"
```

To compare numerically, use `the value of` to convert the string to a number first:

```as
if the value of Mm is not less than 4    ! numeric comparison — works for all values
```

`the value of X` is documented in [values-and-types](values-and-types.md).

Two things make this expensive out of proportion to its size. The first is that it is **silent** — no error, no warning, just a condition that answers the wrong way. The second is that it applies to `is greater than` and `is less than` too, and there the damage is worse than a near-miss: with text comparison the answer depends on the characters, so `\`29\`` is not less than `\`1000001\`` at all.

The two runtimes are not identical here, which is worth knowing before you debug one of them: the terminal converts a text operand in a mixed comparison, while the browser does not. Code that converts explicitly behaves the same on both, and that is the reason to convert rather than to rely on it.

It bites hardest when a number arrives *inside* text — read out of a record, from a DOM element, from `the content of Input`, or from `the index of X`. Convert before comparing, and prefer `the value of X` at the comparison. `add 0 to X` is the shorter form when the value is already sitting in a variable:
```as
add 0 to LineNumber
if LineNumber is less than To                                ! now numeric
```


## Negation

Negate a condition with `not` at the start, or use `is not` within the condition:

```as
if not Clicked ...
if Count is not 0 ...
```

There is no parentheses-based negation — `if not (Count is 0)` is not valid AllSpeak. Use `if Count is not 0` instead.

## Boolean tests

A bare value is a truthy test:

```as
if Clicked ...                      ! true if Clicked is truthy
if Found set the content of Status to `OK`
```

For an explicit boolean test:

```as
if Clicked is true ...
if Clicked is false ...
```

For the full flag lifecycle — declare, initialize with `clear`, toggle with `set`/`clear`, test with bare `if` — see [boolean flags](../idioms/boolean-flags.md).

## Type tests

`is numeric` tests whether a value can be used as a number:

```as
if Input is numeric ...
```

`is an array` and `is an object` test whether a value holds a JSON-shaped collection:

```as
if Response is an array ...
if Config is an object ...
```

`is even` and `is odd` test parity:

```as
if Counter is even ...
```

## String conditions

`includes` tests substring presence:

```as
if Path includes `/api/` ...
if Email includes `@` ...
```

`starts with` and `ends with` test prefix/suffix:

```as
if Name starts with `Dr ` ...
if File ends with `.json` ...
```

`is uppercase` and `is lowercase` test the case of a text value:

```as
if Code is uppercase ...
if Suffix is not lowercase ...
```

A value passes only when it holds at least one cased letter and every cased letter is in that case — `` `ABC-123` `` is uppercase, while `` `Hello` ``, `` `123` `` and an empty value are neither. The two-word spellings `is upper case` and `is lower case` mean the same thing and are equally accepted. Only text can be cased, so `is uppercase` on a number is never true.

To *convert* case rather than test it, use the `uppercase` and `lowercase` value expressions — see [strings-and-text](strings-and-text.md).

## Compound conditions

`and` and `or` join two conditions:

```as
if Count is greater than 0 and Count is less than 100 ...
if Status is `error` or Status is `timeout` ...
```

There is no operator precedence between `and` and `or` — use separate `if` statements or nested `begin`/`end` blocks to disambiguate complex logic.

A two-condition chain is usually readable. For three or more, consider extracting conditions into boolean variables:

```as
if Count is greater than 0
    and Count is less than 100
    and Status is not `error` ...
```

## Related

- [values-and-types](values-and-types.md) — truthy/falsey rules, the numeric flag, `the value of`.
- [strings-and-text](strings-and-text.md) — `includes`, `starts with`, `ends with`.
- [control-flow](control-flow.md) — `if`, `while`, `begin`/`end`.
