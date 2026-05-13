# Floats and scaled integers

## Problem

You have a quantity with fractional precision — money, a percentage, an angle, a measurement. AllSpeak's arithmetic is integer-only. How do you compute with the value without losing precision?

## The float-as-string reality

Numeric literals in source are integers; `3.14` is a string with four characters, not a number. Variables that hold values fetched from outside (a REST response, a Webson form field) may also arrive as float-looking strings. They pass through `cat` unchanged but don't participate in arithmetic — `add 0.5 to Counter` is an error.

The solution is the **scaled-integer pattern**: keep all values as integers, multiplied by a chosen scale factor, and divide out only when displaying.

## Picking a scale

Pick a scale factor for the precision you need:

| Domain | Common scale | Meaning |
|--------|--------------|---------|
| Money (£/$/€) | 100 | Smallest unit (pence, cents). £12.34 → 1234. |
| Percentages | 100 or 10000 | 1% or 0.01% precision. 12.5% → 125 or 12500. |
| Coordinates | 1000 | Millipixels. 100.5 → 100500. |
| Angles | 100 or 10 | 0.01° or 0.1°. 45.5° → 4550 or 455. |

The trade-off: higher scale gives more precision, but the maximum representable value shrinks.

## Worked example: money

A shopping-cart total:

```as
variable PriceA
variable PriceB
variable Total

put 1250 into PriceA    ! £12.50 stored as pence
put 875  into PriceB    ! £8.75 stored as pence
add PriceA to PriceB giving Total
! Total is 2125 — i.e. £21.25
```

To display, split out pounds and pence, padding pence to two digits:

```as
divide Total by 100 giving Pounds
put Total modulo 100 into Pence

if Pence is less than 10
    put `0` cat Pence into PenceStr
else
    put Pence into PenceStr

print Pounds cat `.` cat PenceStr     ! "21.25"
```

## Worked example: percentages

90% of a width, with 1% precision:

```as
multiply Width by 90      ! Width × 90
divide Width by 100       ! ÷ 100
```

This is the canonical AllSpeak idiom for percentage application. Multiply first, then divide — the order matters: divide-then-multiply truncates away the precision you wanted to keep.

For sub-percent precision, scale further:

```as
multiply Width by 9050    ! 90.50% scaled by 100
divide Width by 10000
```

## Trigonometry

`sin` and `cos` are built-in scaled-integer operators — they take an angle in degrees and a `radius` factor that scales the result. See [arithmetic](../reference/arithmetic.md). The radius is just a scale factor under another name.

## Receiving floats from outside

Strings that arrive as `` `12.50` `` from a REST endpoint or a form input need converting to scaled integers before arithmetic. The canonical pattern is to split on the decimal point and combine:

```as
! Suppose Input is `12.50`
put position of `.` in Input into Dot
put left Dot of Input into Pounds
add 1 to Dot
put from Dot of Input into FracStr
multiply Pounds by 100
add FracStr to Pounds giving Pence
! Pence is now 1250
```

In practice, the calling code usually knows the format and inlines this, or wraps it in a parsing subroutine.

## Anti-pattern: arithmetic on the string form

```as
add `0.5` to Counter      ! WRONG — `0.5` is a string
```

Arithmetic operators expect numeric values. To do the work, both sides must already be scaled integers:

```as
add 5 to Counter          ! if Counter is scaled by 10 (i.e. 0.5 → 5)
```

## Anti-pattern: divide before multiply

```as
divide Total by 100       ! integer divide loses pence
multiply Total by 90      ! scaled wrong
```

Integer divide truncates. Multiply first, then divide:

```as
multiply Total by 90
divide Total by 100
```

## Related

- [arithmetic](../reference/arithmetic.md) — the integer-first model and the operator vocabulary.
- [values-and-types](../reference/values-and-types.md) — strings vs numbers.
- [strings-and-text](../reference/strings-and-text.md) — `left`, `from`, `position of` for parsing.
