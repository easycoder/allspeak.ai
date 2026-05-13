# Conditions

A condition is something that evaluates to true or false. AllSpeak uses keyword-driven conditions; there are no infix comparison operators (`==`, `>`, `<` etc.).

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

Use these when the variable's role is specifically a flag and you want the test self-documenting.

To negate a value-as-condition:

```as
if not Found ...                    ! true if Found is falsy
```

## Type and shape tests

```as
if Value is numeric ...             ! parses as a number
if Value is even ...
if Value is odd ...
if Value is an array ...            ! JSON-shaped
if Value is an object ...           ! JSON-shaped
```

## String tests

```as
if Path starts with `/api/` ...
if File ends with `.json` ...
if Text includes `error` ...
```

`includes` doubles as the membership test for collection contents (substring in a string, element in a JSON array).

## Presence tests

```as
if Dict has property `width` ...
if List has element 3 ...
if Spec has entry `colour` ...
if Dict has no property `legacy` ...
```

Use the access keyword that matches the collection shape — `property` for object-shaped variables, `element` for array-shaped, `entry` for Python dictionaries. See [collections](collections.md).

## Combining

`and` binds tighter than `or`:

```as
if A is 1 and B is 2 ...
if A is 1 or B is 2 and C is 3 ...     ! parses as: A is 1 OR (B is 2 AND C is 3)
```

There are no parentheses for grouping. If the precedence isn't what you want, restructure with a nested `if` or assign an interim flag to a temporary variable.

## Module and runtime state

```as
if MyModule is running ...
if MyModule is not running ...
if tracing ...                      ! the runtime trace flag is on
if not tracing ...
```

## Domain conditions

Each domain contributes its own conditions on the objects in its vocabulary. The Browser domain has tests like `if Checkbox is checked` and `if Element is hidden`; the MQTT domain has connectivity tests on subscribers. See the domain's language pack — or the AllSpeak reference for that domain — for the specific vocabulary.

## Related

- [control-flow](control-flow.md) — `if`, `else`, `while` — what consumes a condition.
- [values-and-types](values-and-types.md) — what sits on either side of `is`.
- [collections](collections.md) — `property`, `element`, `entry` access keywords.
