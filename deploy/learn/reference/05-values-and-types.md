# Values and types

A value in AllSpeak is one of three kinds: **number**, **string**, or **boolean**. Values are what arithmetic operates on, what conditions compare, and what `cat` concatenates. Variables hold values; conversions between value kinds are mostly automatic.

## The three value kinds

**Number** — integer values. Literals are bare digit sequences (`42`, `-3`). All arithmetic produces integer results. See [arithmetic](arithmetic.md).

**String** — text. Literals are backtick-delimited (`` `Hello` ``). See [strings-and-text](strings-and-text.md) for the operations.

**Boolean** — true or false. The keywords `true` and `false` produce boolean values (`while true …`, `set Ready to true`). The shorthand `set X` makes X true; `clear X` makes it false. Booleans appear in conditions and as truthy tests. See [conditions](conditions.md).

The runtime tracks a `numeric` flag on each value. A string that contains only digits has the flag set and participates in arithmetic; a string with non-numeric content does not.

## The `variable` type

`variable X` declares a weakly-typed container. It can hold any of the three value kinds, and the kind it holds is whatever was last put into it:

```as
variable X
put 42 into X         ! X is now a number
put `Hello` into X    ! X is now a string
set X                 ! X is now true (boolean)
```

`variable` is the only weakly-typed shape in AllSpeak. Use it for general-purpose state where the kind isn't known up front or changes over time.

## Typed variables

Other variable types are stricter — they accept only the values their domain knows about:

```as
button SaveButton           ! holds a DOM element handle
file ConfigFile             ! holds a file reference
dictionary Spec             ! holds a key/value structure (Python)
module Helper               ! holds a loaded module
```

`put 42 into SaveButton` is an error — SaveButton isn't a value container, it's a handle to a typed object. The operations a typed variable accepts are defined by its owning domain. See [structure](structure.md) and [collections](collections.md).

## Automatic conversion

Values convert between kinds based on context:

| Context | Conversion |
|---------|------------|
| Arithmetic input | Numeric string → number; non-numeric string is an error |
| `cat` operand | Number → string; boolean → "true"/"false" |
| `if X` (truthy test) | Number → false if 0, true otherwise; string → false if empty, true otherwise |
| `is` comparison | Operands compared as text, with numeric awareness on both sides |

```as
put `42` into N
add 1 to N            ! N is now 43 (string "42" promoted to number)

put 5 into Count
put `You have ` cat Count cat ` items` into Message
                      ! Count converted to "5" for cat
```

Conversion is one-way per operation — the variable's stored value isn't permanently transformed. After `add 1 to N`, N holds 43 as a number; after `cat Count`, Count is still 5 as a number.

Within a `cat` chain, individual operands keep their type identities all the way through; conversion to text happens once, when the chain is collapsed into a single string. This matters most for values produced at runtime — `the timestamp`, `the content of Input`, `the index of X` — which evaluate to a typed value and only become text at the boundary, not at each `cat` step.

## When automatic conversion isn't enough

For decimal-looking strings (`3.14`), conversion is not automatic — arithmetic is integer-first, and `3.14` stays a string. See [arithmetic](arithmetic.md) and [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md).

For inspection, the type tests are conditions:

```as
if X is numeric ...
if X is an array ...       ! JSON-shaped
if X is an object ...      ! JSON-shaped
if X is even ...
if X is odd ...
```

See [conditions](conditions.md).

## JS vs Python

The value model is shared across runtimes. The implementations differ underneath — JS unifies storage through string representation; Python uses native `int`, `str`, `bool` and converts at operation boundaries — but script-level behaviour is the same in both. The difference matters only when reading the engine source or writing a plugin.

## Why three kinds and no more

AllSpeak deliberately avoids the richer type hierarchies of mainstream languages. The three kinds cover everything you need for UI logic, data handling, and control flow; richer structures (JSON shapes, DOM elements, modules) are handled by typed variables provided by the relevant domain. Keeping the value layer simple makes the engine small, the language uniformly readable, and the multilingual mapping straightforward — every kind has a one-word name that's easy to translate.

## Related

- [variables-and-arrays](variables-and-arrays.md) — variables as one-element arrays; the cursor model.
- [arithmetic](arithmetic.md) — integer-first numeric operations.
- [strings-and-text](strings-and-text.md) — string operations.
- [conditions](conditions.md) — equality, comparison, type tests.
- [collections](collections.md) — JSON-shaped value types (array, object).
