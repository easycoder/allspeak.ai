# Boolean flags

## Problem

You need to track an on/off state — hide/show a widget, pause/resume a task, run a one-time guard. The clumsy version uses a numeric flag (which the original `graphics-demo.as` did):

```as
variable HiddenFlag

ToggleClick:
    if HiddenFlag is 1           ! error on the first click
    begin
        hide StatusLabel
        put 0 into HiddenFlag
    end
    else
    begin
        show StatusLabel
        put 1 into HiddenFlag
    end
    stop
```

Three things are wrong here. The flag is **compared before it holds anything** — `if HiddenFlag is 1` fails with "Both items must have a value for comparison" until some earlier line has assigned it. The `1`/`0` values read poorly next to the English-like syntax. And `put 1 into` / `put 0 into` obscure the intent: this is a boolean, not a counter.

## Pattern

AllSpeak has a dedicated boolean vocabulary: `set X` makes X true, `clear X` makes it false, and a bare `if X` is the truthy test.

```as
variable HiddenFlag
clear HiddenFlag                 ! initialize: false — never test a flag you haven't set or cleared

ToggleClick:
    if HiddenFlag
    begin
        hide StatusLabel
        clear HiddenFlag
    end
    else
    begin
        show StatusLabel
        set HiddenFlag
    end
    stop
```

The lifecycle is always the same:

1. **Declare** — `variable Flag` (booleans are a value kind; see [values-and-types](../reference/values-and-types.md)).
2. **Initialize** — `clear Flag` at setup. `clear` and `set` are the boolean assignment commands; `clear` doubles as the initializer so no "value for comparison" error can occur.
3. **Change** — `set Flag` / `clear Flag`, exactly where you'd say "flag is now true/false" in prose.
4. **Test** — `if Flag` for true, `if not Flag` for false.

Negation and explicit forms are available when they read better:

```as
if not Flag
begin
    ! ... Flag is false ...
end
if Flag is true ...              ! explicit, equivalent to `if Flag`
```

## The truthy test

`if X` is not a kind test — it's truthiness, and it applies to all three value kinds:

| `X` holds | `if X` |
|---|---|
| boolean `true` (from `set X`) | true |
| boolean `false` (from `clear X`) | false |
| `0` | false |
| any other number | true |
| empty string | false |
| any non-empty string | true |

So a flag should be a **boolean**, not a number: `if Counter` happens to work for a counter (true unless 0), but it's easy to misread and it breaks the moment you test a negative or textual state. Keep the state boolean and the test bare.

## Anti-patterns

- **Numeric flags** — `put 1 into Flag` / `if Flag is 1` works only after initialization, reads poorly, and makes Flag a number when a boolean is meant. Prefer `set Flag` / `if Flag`.
- **Comparing before initializing** — the "Both items must have a value for comparison" error in the Problem section. `clear Flag` in setup.
- **`put true into` / `put false into`** — works (booleans are a value kind), but `set`/`clear` are the dedicated, shorter commands.
- **Testing the kind instead of the value** — `if X is numeric` asks *what X is*, not *whether it's on*; a flag test is `if X` (or `if X is true`).

## Why this works

Booleans are one of the three value kinds, so a `variable` holds them natively and `cat` renders them as "true"/"false" (handy for status text: `set the text of Status to `Hidden: ` cat HiddenFlag`). `set`/`clear` are core commands that assign a boolean, and the bare `if` is the truthy test described in [conditions](../reference/conditions.md). The pattern is the same in both runtimes — the JS and Python engines implement the same value model.

## See also

- [values-and-types](../reference/values-and-types.md) — the boolean kind and the `set X`/`clear X` shorthand.
- [conditions](../reference/conditions.md) — truthy tests, `is true`/`is false`, type tests.
- [building a desktop window](desktop-gui.md) — a worked example using this flag pattern for hide/show and window guards.
