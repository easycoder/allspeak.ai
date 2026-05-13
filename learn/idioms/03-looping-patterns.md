# Looping patterns

## Problem

You need to repeat work — iterate over a list, animate a frame, poll for a condition, drive a state machine. AllSpeak offers `while` and label-driven loops. Each fits some shapes of problem better than the other.

## The `while` form

The everyday loop. Body runs while the condition holds:

```as
set N to 0
while N is less than 5 begin
    print N
    add 1 to N
end
```

Use `while` when:

- A single condition decides whether to continue.
- The body is straightforward sequential code.
- You want one entry and one exit point.

The single-statement form is fine for trivial cases:

```as
while not Ready wait 10 millis
```

See [control-flow](../reference/control-flow.md) for the formal mechanics.

## The label-driven form

A label with a `go to` back to it forms a loop with more flexibility than `while`. There are two natural framings.

**Test-for-exit.** Check at the top whether to leave; otherwise do the work and loop back:

```as
set N to 0
Loop:
    if N is greater than 4 go to Done
    print N
    add 1 to N
    go to Loop
Done:
    ! ...
```

**Test-for-continue.** Wrap the body in an `if` for the continue condition; the loop exits by falling out of the `if`:

```as
set N to 0
Loop:
    if N is not greater than 4 begin
        print N
        add 1 to N
        go to Loop
    end
    ! ...
```

The two are equivalent in this simple case. For multi-exit loops (several reasons to stop), the test-for-exit form generalises more readily. For a single clear continuation condition, test-for-continue is closer to `while` in structure.

Use a label-driven loop when:

- The exit condition is messy (multiple paths out, mid-body decisions).
- You want a `continue`-like skip without restructuring the whole loop.
- You're integrating with `gosub` flows that already use labels.
- The "loop" is really a state machine with a labelled state per phase.

Compared with `while`, this is more verbose for simple cases but more honest when the loop control is complex.

## Counted iteration

The canonical loop. Initialise counter, loop while in range, increment at the end:

```as
set N to 0
while N is less than Count begin
    ! ... work using N ...
    add 1 to N
end
```

`Count` is whatever holds the size — typically a separate variable set earlier (e.g. when the array was sized). AllSpeak doesn't expose a built-in length for variable arrays at the read side; track the count yourself.

Place the increment at the end of the body so every iteration both does its work and advances the counter.

## Iteration with the cursor model

When the loop walks several parallel arrays in lockstep, set the cursor on each inside the body:

```as
set N to 0
while N is less than Count begin
    index Caption to N
    index Target to N
    index Visited to N
    ! ... work using the indexed values ...
    add 1 to N
end
```

This is the idiomatic AllSpeak shape for record-by-position access (see [picking-a-collection-shape](picking-a-collection-shape.md)).

## Polling

Wait for a flag with a yield in the body:

```as
while not Ready wait 50 millis
```

The `wait` lets other threads (event handlers, forks, network callbacks) run. Without it, the runtime starves. See [cooperative-multitasking](../reference/cooperative-multitasking.md).

## Animation

A `while true` loop that runs forever, yielding every frame:

```as
while true begin
    ! ... advance one frame ...
    wait 16 millis
end
```

End it from outside (a stop flag, a thread terminator). The `wait` defines the frame rate — 16 ms ≈ 60 fps.

## Skipping iterations

There's no `continue`. To skip the rest of an iteration, jump to the end-of-body step:

```as
set N to 0
while N is less than 10 begin
    if N modulo 2 is 0 go to Skip
    print N
Skip:
    add 1 to N
end
```

The `go to Skip` skips the print but lets the increment run. For more elaborate skip logic, the label-driven form often reads better.

## Reverse counting

The same patterns work counting down. Initialise the counter at the high end, loop while still non-negative, decrement at the bottom:

```as
set N to 9
while N is not less than 0 begin
    print N
    take 1 from N
end
```

`is not less than 0` reads as ≥ 0 — see [conditions](../reference/conditions.md) for inverted comparisons.

## Anti-pattern: loop without yielding

```as
while not Ready begin
    ! ... check ...
end
```

A loop with no `wait` and no `stop` blocks every other thread in the runtime. The UI freezes, event handlers don't fire, forked threads stall. Always include a `wait` or terminate quickly.

## Anti-pattern: off-by-one with the wrong operator

```as
while N is less than 5 begin          ! runs for N = 0,1,2,3,4 → five times
while N is not greater than 5 begin   ! runs for N = 0,1,2,3,4,5 → six times
```

If you start at 0 and need exactly N iterations, the condition is `is less than N`. If you start at 1, it's `is not greater than N`. Picking the wrong one is the canonical off-by-one bug.

## Related

- [control-flow](../reference/control-flow.md) — `while`, `if`, `begin … end`.
- [variables-and-arrays](../reference/variables-and-arrays.md) — the cursor model that loops often use.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — why `wait` is mandatory in long loops.
- [event-handlers-and-array-index](event-handlers-and-array-index.md) — loops + handlers for arrays of UI elements.
