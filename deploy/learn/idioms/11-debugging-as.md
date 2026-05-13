# Debugging .as

## Problem

A script isn't doing what you expect — a value is wrong, a handler isn't firing, a thread is starving the runtime. You need visibility into what's actually happening, and you need to reproduce the problem reliably enough to fix it.

## The everyday tools

### `print` and `log`

Output a value to the runtime log. Both keywords do the same thing — `log` reads better when you're tracing program flow, `print` reads better when you're showing a result:

```as
print `Counter is ` cat Counter
log `Entering MessageHandler with ` cat the mqtt message
```

The log appears in the browser console (JS) or stdout (Python). Use freely while developing; remove or guard with a flag for production.

### Conditional logging via the `tracing` flag

The runtime has a global trace flag, tested with the `tracing` condition:

```as
if tracing log `State entering Idle`
```

When tracing is on, the log fires; when off, the statement is a no-op (still evaluated — there's a small cost). Useful for log statements you want in the code but only firing during diagnostics.

### `debug step` and friends

`debug step` logs each line as the runtime reaches it — handy when you want to find where things went wrong:

```as
debug step
gosub ComplicatedRoutine
```

`debug stop` cancels the stepping. `debug breakpoint` marks a spot where the browser's developer-tools debugger can stop in the underlying JS source. The `debug` keyword has further modes that come and go with engine versions; treat the documented forms as the stable subset and check the current implementation for anything more exotic.

### `dummy`

A no-op statement. Its purpose is to give you a known spot in the compiled or running JS/Python where you can set a native-side breakpoint, ahead of a suspected problem:

```as
dummy
print Result        ! the JS/Python debugger can stop on the line above
```

When the runtime hits `dummy` the browser (or Python) debugger stops if a breakpoint is set on the dummy handler, letting you inspect runtime state right before the next statement runs.

### The tracer

The tracer panel shows recent runtime events. Enable it from the script:

```as
set the tracer rows to 10
```

The Codex has a dedicated tracer page; see there for the full set of options.

## A debugging workflow

Slow but reliable:

1. **State what you expect** in a comment near where the bug is suspected.
2. **Add `print` or `log` statements** at the relevant turn-points: the start of a handler, the entry to a subroutine, the exit from a loop. Print the values that should match your expectation.
3. **Run and read the log.** Where does reality diverge from expectation?
4. **Narrow the gap.** Move the prints closer together until you've isolated the statement that produces the wrong value.
5. **Fix.** Then remove the prints, or guard them with `if tracing`.

This forces explicit thinking and produces a written trace you can re-read. The IDE debugger is faster when you can isolate the bug to a single thread; the log is more reliable for cross-thread issues where pausing distorts the timing.

## Reproducing in `conformance/`

`/conformance/` holds scripts that exercise specific engine behaviours. When a bug seems to be in the engine (not in your script), reducing it to a minimal `conformance/` script:

- Forces a precise statement of the misbehaviour.
- Gives engine maintainers something they can run.
- Becomes a regression test once fixed.

A good conformance script is small (one screenful), self-contained (no external resources), and named after what it tests.

## Anti-pattern: changing things without reading the log

Tempting to tweak the code until the symptom goes away. The bug usually moves rather than vanishing. Read the log, find the divergence, then change exactly what produces the wrong value.

## Anti-pattern: `print` in tight loops

```as
while N is less than 10000 begin
    print N
    ! ... work ...
    add 1 to N
end
```

Ten thousand log lines drown the signal. Sample instead:

```as
while N is less than 10000 begin
    if N modulo 100 is 0 print `Reached ` cat N
    ! ... work ...
    add 1 to N
end
```

Or use the tracer, which shows recent events and discards old ones.

## Anti-pattern: leaving production logs on

`print` and `log` always run. Once a bug is fixed, either remove the statement or wrap it with `if tracing`. Otherwise the production console fills with noise that future debugging has to wade through.

## Related

- [control-flow](../reference/control-flow.md) — `stop`, `gosub`, where to place debug entries.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — the tracer shows thread interleaving.
- [working-with-ai](working-with-ai.md) — when an AI mistake is the bug.
