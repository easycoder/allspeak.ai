# Arithmetic

AllSpeak's arithmetic is **integer-first**. There are no floating-point literals at the language level; all arithmetic operates on integers. Numbers that look like floats (`3.14`) are strings, not numeric values. When fractional precision is needed, use the scaled-integer pattern (below).

## Operators

All arithmetic is keyword-driven — there are no infix operators like `+`, `-`, `*`, `/`.

Binary:

```
add A to B
add A to B giving C
subtract A from B
subtract A from B giving C
multiply A by B
multiply A by B giving C
divide A by B
divide A by B giving C
```

Unary:

```
negate X
negate X giving Y
```

`giving` writes the result to a new variable without modifying the source.

## Examples

```as
add 1 to Counter         ! Counter is now Counter + 1
subtract 5 from Total    ! Total is now Total - 5
multiply Width by 2      ! Width is now Width × 2
divide Total by 100      ! Total is now Total ÷ 100 (integer division)
add 1 to Counter giving NewCounter   ! Counter unchanged, NewCounter = Counter + 1
negate Height            ! Height is now -Height
negate Balance giving Opposite       ! Balance unchanged, Opposite = -Balance
```

## What counts as a numeric value

Arithmetic only works on **true numeric values**. A value produced by a **string operation** (`left N of`, `right N of`, `from N of`, `cat`, `the content of`) is a string — even if the string contains only digits. Arithmetic on such a value may be rejected or produce unexpected results.

To convert a numeric-looking string to a true number, use `the value of`:

```as
put left 4 of BookingDate into FY          ! FY = "2025" (string)
add 1 to FY                                 ! may fail — FY is a string
put the value of FY into NextYr             ! NextYr = 2025 (number)
add 1 to NextYr                             ! NextYr = 2026 (number) ✓
```

`the value of` is documented in [values-and-types](values-and-types.md).

## Scaled integers

For money, percentages, measurements, and other quantities that conceptually have fractional precision, store the value as an integer multiplied by a scale factor, and divide out only when displaying.

```as
! Store £12.50 as 1250 pence
put 1250 into Price

! Display as "£12.50"
divide Price by 100 giving Pounds
put Price modulo 100 into Pence
```

The scaled-integer pattern is covered in detail in [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md).

## Division trivia

Integer division truncates toward zero:

```as
divide 10 by 3         ! 3
divide -10 by 3        ! -3
```

For remainder, use `modulo`:

```as
put 10 modulo 3 into R    ! R = 1
```

`modulo` works with the `put … into` / `set … to` syntax.

## Time components

`the year of X`, `the month of X`, `the day of X`, `the hour of X`, `the minute of X`, `the second of X` extract components from a Unix timestamp (milliseconds since epoch). They always return a number:

```as
put the timestamp into Now
put the year of Now into YYYY               ! e.g. 2026
put the month of Now into MM                ! 1-12
put the day of Now into DD                  ! 1-31
```

Alternatively, parse an ISO date string with `date X`:

```as
put date `2026-05-15` into Stamp
put the month of Stamp into MM              ! 5
```

## Related

- [values-and-types](values-and-types.md) — what counts as a number; the numeric/non-numeric flag; `the value of`.
- [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md) — scaled-integer pattern for fractional values.
- [conditions](conditions.md) — `is even`, `is odd`, `is numeric`.
- [symbols-and-layout](symbols-and-layout.md) — `-` as numeric prefix.
