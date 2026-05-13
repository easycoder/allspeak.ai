# Control flow

AllSpeak's control flow is built from a small set of constructs that compose freely: sequential statements grouped with `begin … end`, conditional `if … else`, the `while` loop, labels with `go to` and `gosub`, and thread-level `stop` and `exit`. AllSpeak mirrors natural language; the constructs are deliberately simple, and you are free to move around the code at your convenience.

There is no operator-style flow (no early-return-via-expression, no exceptions). Failure handling for specific commands is covered in [errors-and-recovery](errors-and-recovery.md); thread launching in [cooperative-multitasking](cooperative-multitasking.md).

## Sequence and blocks

Statements within a labelled section run top to bottom:

```as
Main:
    set Counter to 0
    add 1 to Counter
    print Counter
    stop
```

To group a sequence into a single composite statement, wrap it with `begin … end`. Anywhere a single statement is expected, a `begin … end` block can substitute.

```as
while N is less than 5 begin
    add 1 to N
    print N
end
```

A `begin … end` block is one statement to the parser; the body inside it is sequential. See [symbols-and-layout](symbols-and-layout.md) for the alternative style where `begin` sits on its own line with matching indentation.

## `if` / `else`

Conditional execution. Single-statement and block forms:

```as
if Counter is 0 print `Counter is zero`

if Counter is 0 begin
    print `Counter is zero`
    set Reset
end
```

With `else`, either branch can be single-statement or block:

```as
if Counter is 0
    print `zero`
else begin
    print `non-zero, value:`
    print Counter
end
```

Conditions are keyword-driven (`is`, `is less than`, `is greater than`, `is not`, `contains`, etc.) — see [conditions](conditions.md). A construct that isn't directly available can usually be inverted: `is greater than or equal to` can be written `is not less than`.

A bare truthy test reads the variable's current state:

```as
if Clicked set the content of Button to `Done`
```

`Clicked` here is treated as a boolean. `set Clicked` makes it true; `clear Clicked` makes it false. For an explicit test, `if Clicked is true …` and `if Clicked is false …` are also accepted. Although any non-empty value is generally treated as true, it is safer for the variable to have been explicitly set to a Boolean with `set` or `clear`.

## `while`

Looping. Same single/block split as `if`:

```as
set N to 0
while N is less than 5 begin
    print N
    add 1 to N
end
```

Infinite loop, broken by an internal exit:

```as
while true begin
    ! ... process a message ...
    if Done stop
end
```

Termination: either let the condition fall false, or break out via `go to Label`, `stop`, `return`, or `exit`. There is no dedicated `break` or `continue` — pick the construct that matches what you want to do next. There are no stack implications from using `go to` to exit a loop; AllSpeak treats labels as free destinations.

## Labels and `go to`

Any word at the left margin ending with `:` is a label. Labels are targets for `go to`, `gosub`, and event-handler registrations:

```as
Start:
    set Counter to 0
    go to Loop

Loop:
    add 1 to Counter
    if Counter is less than 10 go to Loop
    print Counter
    stop
```

`go to` transfers control unconditionally and does not push a return address. The destination runs until it hits its own `stop`, `exit`, or another `go to` — whatever it does next is the new flow.

## `gosub` and `return`

A subroutine call: push return address, jump to label, run until `return`, pop return address.

```as
Main:
    gosub Setup
    gosub Render
    stop

Setup:
    set Counter to 0
    return

Render:
    print Counter
    return
```

Both `gosub Label` and `gosub to Label` are accepted; the codex examples use `gosub to`. Pick one and stay consistent.

Subroutines have no parameters and no local variables. To pass data in, write the relevant globals before `gosub`; to return a result, the subroutine writes globals before `return`. This is rough by modern standards, deliberately mirroring natural language — for anything bigger than a few-line helper, reach for a [module](modules.md), which provides private variables, message-passing, and concurrency.

## `stack`, `push`, and `pop`

To reuse a scratch variable across a subroutine call without losing its value, push it onto a stack first and pop it back afterwards:

```as
stack MyStack
...
set X to 99
push X onto MyStack
set X to 0            ! reuse X for something else
pop X from MyStack
print X               ! prints 99
```

Use this when a subroutine needs the same scratch names (`I`, `N`, `Temp`) as its caller and you want to avoid the rare-but-real bug of one stomping the other.

## `stop` and `exit`

Two ways to end something:

- **`stop`** parks the current thread. The main thread always ends with `stop` (otherwise it runs off the end of its labelled section). Event handlers and forked threads use `stop` to terminate themselves early.
- **`exit`** ends the entire script. In a module, `exit` returns control to the parent; in the main script, it shuts the runtime down. When a module exits, all of its runtime memory is released for garbage collection — this is what lets an application accrete a large amount of functionality without all of it sitting in memory at once.

`stop` is per-thread; `exit` is per-script.

## When to use which

- A single conditional action → `if`.
- A repeating action → `while`.
- A reusable block called from several places → `gosub` to a label.
- A piece of logic large enough to need private state → a module ([modules](modules.md)).
- An asynchronous-looking flow on a UI event → an `on …` registration that `gosub`s a handler ([event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md)).

## Related

- [symbols-and-layout](symbols-and-layout.md) — labels, indentation rules, and `begin`/`end` style.
- [conditions](conditions.md) — what goes after `if` and `while`; combining conditions.
- [errors-and-recovery](errors-and-recovery.md) — `or` and `on failure` for command-level failure handling.
- [cooperative-multitasking](cooperative-multitasking.md) — `fork`, thread yield, `wait`.
- [modules](modules.md) — private state and message-passing for big chunks.
