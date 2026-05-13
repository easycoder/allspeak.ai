# Arithmetic

AllSpeak's arithmetic is **integer-first**. There are no floating-point literals at the language level; all arithmetic operates on integers. Numbers that look like floats (`3.14`) are strings, not numeric values. When fractional precision is needed, use the scaled-integer pattern (below).

The vocabulary is keyword-driven, mirroring natural English:

```as
add A to B
add A to B giving C
take A from B            ! `subtract` is also accepted
take A from B giving C
multiply A by B
multiply A by B giving C
divide A by B
divide A by B giving C
```

## Two forms: in-place and `giving`

Every operation has two forms:

- **In-place** writes the result back into the target:

  ```as
  add 1 to Counter         ! Counter is now Counter + 1
  ```

- **`giving`** writes the result to a third variable, leaving the operands alone:

  ```as
  add 1 to Counter giving NewCounter
  ```

Use in-place when you're updating the target; `giving` when the operands need to stay intact.

## Negation

`negate X` flips the sign of X in place:

```as
put 100 into Height
negate Height       ! Height is now -100
```

Negative literals are written with the `-` prefix; see [symbols-and-layout](symbols-and-layout.md).

## Modulo

`modulo` is an expression operator, not a statement. It produces a value, so it appears in conditions or as part of a value:

```as
if Index modulo 3 is 0 ...
put N modulo 7 into Row
```

There is no `divide A by B giving Q remainder R` form. To get both quotient and remainder, compute them in two steps:

```as
divide N by 7 giving Q
put N modulo 7 into R
```

## Integer-first arithmetic and floats

All arithmetic produces an integer result. Inputs that look like floats are strings, not numbers, and don't participate in arithmetic. Trying `multiply 3.14 by 2` will not work the way it would in other languages — `3.14` here is just a string.

To work with fractional quantities, **scale to integers**. Two patterns are common:

**Pence / cents for money.** Store amounts in the smallest unit. £1.23 becomes `123`. Arithmetic stays exact:

```as
put 1250 into PriceA    ! £12.50 stored as pence
put 875 into PriceB     ! £8.75
add PriceA to PriceB giving Total
! Total is 2125, i.e. £21.25
! Format on display: 21.25
```

**Fixed-precision via a scale factor.** For percentages, ratios, or angles, multiply by a chosen scale, do the maths in integers, divide out at the end:

```as
multiply Width by 90    ! 90% of Width, scaled by 100
divide Width by 100
```

See [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md) for worked patterns.

## Trigonometry

The trig functions take an angle in degrees and a scaling factor (the "radius"):

```as
put sin Angle radius 100 into Height
put cos Angle radius 100 into Width
```

`sin Angle radius R` returns an integer in the range −R..R — i.e. R × sin(angle). The radius is what scales the otherwise-fractional sine into an integer. Pick R to match the precision you need (100 is a common choice for 1% precision).

## Why integer-first

The model trades expressive range for guaranteed exact results. Benefits:

- No floating-point quirks (no `0.1 + 0.2 != 0.3`).
- No precision drift in long arithmetic.
- Equality tests on numbers are reliable.

Costs:

- The author has to think about scale.
- Some natural expressions need rewriting (`3.14159 * radius` becomes `radius * 314159 / 100000`, or — better — uses `sin` / `cos` with a chosen radius).

For most AllSpeak use cases — UI layout in pixels, percentages, monetary amounts, control systems, simple physics — integer-first is a good fit. For heavy numerical work (statistics, fluid simulation), AllSpeak isn't the tool on its own. It can however provide an effective and simple-to-maintain user interface, with the numerical and specialised graphical work handled by a plug-in.

## Related

- [values-and-types](values-and-types.md) — what counts as a number; the numeric/non-numeric flag.
- [floats-and-scaled-integers](../idioms/floats-and-scaled-integers.md) — worked patterns for fractional quantities.
- [conditions](conditions.md) — `is even`, `is odd`, `is numeric`.
- [symbols-and-layout](symbols-and-layout.md) — `-` as numeric prefix.
