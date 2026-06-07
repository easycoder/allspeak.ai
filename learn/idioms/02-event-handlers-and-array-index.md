# Event handlers and array index

## Problem

You have an array of UI elements — say five buttons — and you want a single handler that knows which one was clicked.

## Pattern

Attach a single handler to the variable. This will trigger on any element and set its index to that of the triggered element. Inside the handler, read `the index of` the array to find out which one fired.

```as
button Button
set the elements of Button to 5
! ... create the buttons, give them captions ...

set N to 0
while N is less than 5
    ! Set up, etc.
    add 1 to N

on click Button gosub HandleClick

stop

HandleClick:
    set Which to the index of Button
    print `Button ` cat Which cat ` was clicked`
    return
```

The runtime sets the cursor on `Button` to the firing element's index *before* entering the handler. `the index of Button` inside `HandleClick` is the correct slot.

## Size the array first

Before you can use `index` or respond to clicks on an array, you **must** size it with `set the elements of`:

```as
set the elements of Button to 5    ! slots [0]..[4]
```

Every variable starts with exactly one element (slot 0). Without sizing, `index Button to N` fails for N > 0, and `on click` events only ever see slot 0.

A common pattern is to determine the count first (from a data fetch or layout), then size the array:

```as
rest get Bookings from `bookings.php`
put json count of Bookings into Count
set the elements of RowDivs to Count
```

## Set the cursor before `create`

When building DOM elements into an array, move the cursor to the target slot **before** calling `create`:

```as
index RowDivs to I           ! ✅ cursor to slot I
create RowDivs in TableBody   ! element goes into slot I
```

If you create first and then index, the element is in slot 0 and the cursor move doesn't retroactively reassign it.

## What a handler is

A handler is a thread that runs to completion when its event occurs. The `on …` registration is just setup; the thread starts when the event fires and ends when the handler's last statement is reached. Nothing waits on its return value because nothing called it.

## Why this works

`gosub HandleClick` is any statement or block. The `on` runtime has already determined the source of the event and has set the index of the variable to that of the triggering element. Often this will be 0, but as in the example above, the variable can have any number of elements. The handler only sees the element that triggered the event — the same cursor model used everywhere else (see [variables-and-arrays](../reference/variables-and-arrays.md)).

Note: this works with **any** variable type that supports the cursor model, including `div X`, `button X`, `input X`, etc. The declaration prefix (`div`, `button`, `file`) controls what `create X` produces, but the underlying cursor model is the same as `variable X`.

## Anti-pattern: separate variables per element

```as
on click Button0 gosub HandleClick0
on click Button1 gosub HandleClick1
...
```

This works but is more verbose, requiring the handler to treat each variable separately when they are conceptually the same thing just repeated. Five near-identical subroutines that differ only in a constant should be one subroutine that reads `the index of`.

## Anti-pattern: capturing the loop variable

```as
while N is less than 5 begin
    index Button to N
    ! Do something
    add 1 to N
end
on click Button gosub HandleClick

HandleClick:
    print `Button ` cat N cat ` was clicked`   ! WRONG — N is whatever the loop left it
    return
```

There is no closure. `N` at handler-time is whatever the most recent code wrote to it — usually 5, not the firing index. Always read `the index of` inside the handler.

## Multi-line handlers

Three options, each terminating the handler thread in its natural way:

**1. Delegate to a labelled subroutine.** `gosub` from the registration; `return` at the end of the subroutine terminates the thread (nothing to return to).

```as
on click Button gosub HandleClick

HandleClick:
    set Which to the index of Button
    if Which is 0 begin
        ! special case for the first button
        gosub HandleSpecial
        return
    end
    print `Generic handler for ` cat Which
    return
```

**2. Inline block.** The thread *is* the `begin…end` block. Use `stop` to terminate early.

```as
on click Button begin
    set Which to the index of Button
    if Which is 0 begin
        ! special case for the first button
        gosub HandleSpecial
        stop
    end
    print `Generic handler for ` cat Which
end
```

**3. Inline block with control transfer.** Use `go to Label` to send the thread on to other code (which itself terminates).

```as
on click Button begin
    set Which to the index of Button
    if Which is 0 go to HandleSpecial
    print `Generic handler for ` cat Which
end
```

Note: `begin...end` is a single statement. Which form to use depends on individual preferences, but if the handler is very complex it deserves to live in a labelled section where it can be documented more easily.

## Related

- [variables-and-arrays](../reference/variables-and-arrays.md) — the cursor model this idiom relies on.
- [control-flow](../reference/control-flow.md) — `gosub`, `return`, `stop`, `go to`.
- [webson-and-as-separation](webson-and-as-separation.md) — how Button arrays usually get created from layout.
