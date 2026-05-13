# Cooperative multitasking

AllSpeak runs multiple threads cooperatively. The main script, every event handler, and every forked thread are separate threads of execution that share the same global state. They take turns running; the runtime never preempts one mid-statement.

This is fundamentally different from operating-system threads. There is no parallelism, no race condition within a single statement, and no need for locks. The cost is that long-running work must explicitly yield, or other threads can't run.

## How threads arise

Three ways a thread comes into existence:

1. **The main thread.** The script's top-level code is the main thread. It runs until it hits `stop`.
2. **An event handler.** `on click X gosub Handler` registers Handler. When the event fires, the runtime starts a new thread at Handler.
3. **A forked thread.** `fork to Label` creates a new thread at Label and starts it immediately. The launching thread parks itself and queues its next instruction to resume later.

All threads run in the same process, share all global variables, and yield only at the points described next.

## When threads yield

The runtime never interrupts a thread mid-statement. Statements like `set X to Y`, `add A to B`, `print Z` run to completion before any other thread gets a turn. A thread yields only at these points:

- **`wait N <unit>`** — sleep for at least the given time, then resume. The thread is parked; other threads run while it sleeps.
- **`stop`** — terminate the thread permanently.
- **End of an event-handler thread** — the thread terminates after `return` falls off the dispatch frame, or after a `stop`, or after the trailing `end` of an inline handler block (see [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md)).
- **Blocking I/O** — `rest get`, `mqtt publish`, `wait for message` and similar that hand control back to the runtime's event loop while they wait.

Outside these points, a thread holds the runtime. A `while true begin ... end` loop with no `wait` inside it will starve every other thread — blocking user actions and risking CPU overheat. The runtime has a basic safeguard that breaks out of any loop running too many instructions without yielding, but you shouldn't rely on it: insert a `wait` deliberately.

## `fork`

`fork to Label` (or `fork Label` — the `to` is optional) starts a new thread at Label:

```as
Main:
    fork to Animator
    fork to NetworkPoller
    on click StartButton gosub StartGame
    stop

Animator:
    while true begin
        ! ... advance one frame ...
        wait 16 millis
    end

NetworkPoller:
    while true begin
        rest get Status from `/health`
        wait 1 second
    end
```

When `fork` runs, the new thread starts immediately and the launching thread parks itself, queuing its next instruction. Control returns to the launcher when the forked thread yields (via `wait`, blocking I/O, or `stop`). Each forked thread runs independently from then on; they share globals with the main thread and each other. Coordination between threads is by shared state — set a variable in one, read it in another.

## `wait`

The everyday yield. Units are `millis` / `milli`, `ticks` / `tick` (10 ms), `seconds` / `second` (the default), and `minutes` / `minute`:

```as
wait 5 millis           ! 5 milliseconds
wait 100 ticks          ! 100 × 10 ms = 1 s
wait 2 seconds          ! the default unit, may be omitted
wait 2                  ! 2 seconds (default)
wait 5 minutes
```

In an animation loop, the body does a frame's work and `wait`s a few milliseconds before the next frame. In a poll loop, `wait` is the interval between polls. In any long-running loop, a `wait` is the minimum needed to share the runtime — without one, no other thread can run and the UI freezes.

## Coordinating threads

There are no semaphores, mutexes, or channels — the cooperative model removes most of the need. Coordination is done with shared variables and polling:

```as
! Producer thread sets a flag; consumer notices.
variable Ready

Producer:
    ! ... prepare some data ...
    set Ready
    stop

Consumer:
    while not Ready wait 10 millis
    ! ... consume the data ...
    clear Ready
    stop
```

Because no thread can be interrupted mid-statement, `set Ready` is atomic. The consumer's `while not Ready wait 10 millis` is coarse-grained polling — fine when wakeup latency doesn't matter.

For richer coordination, modules and message-passing usually fit better than raw flags — see [modules](modules.md).

## Modules and threads

A module loaded with `run X` runs as a child of the parent. By default the parent blocks while the module runs. The module can call `release parent` to let the parent continue concurrently — at which point the module becomes another cooperative thread. Parent and child can then communicate with `message …` and the `on message` handler.

This is the canonical structure for larger pieces of asynchronous work. See [modules](modules.md) for the mechanism and the `as-modularize` skill for worked examples.

## Why cooperative

The model trades parallelism for simplicity. The benefits:

- No race conditions on single statements; you can reason about state directly.
- No locks, no atomics, no memory-ordering surprises.
- Threads compose: an event handler is a thread, a fork is a thread, a released module is a thread — all the same kind of thing.

The cost:

- CPU-bound work in one thread blocks everything else.
- The author has to insert `wait`s in long loops to share the runtime.
- True parallelism for performance isn't on offer — for that, use a plugin that wraps a native worker, or offload to a separate process.

## Related

- [control-flow](control-flow.md) — `stop`, `gosub`, `go to` — the per-thread control mechanisms.
- [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) — event handlers as threads.
- [modules](modules.md) — `release parent`, message passing, larger concurrency units.
