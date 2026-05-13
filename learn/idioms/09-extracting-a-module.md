# Extracting a module

## Problem

Your script has grown past a few thousand lines. Navigating, reviewing, and reloading it have become painful. A particular section keeps reappearing in reviews because it's hard to follow alongside the rest. Time to extract it as a module.

## When to extract

Trigger to consider extraction:

- Script over ~2500 lines and growing.
- A specific functional region keeps coming back in reviews because it's hard to follow alongside the rest.
- A self-contained transformation that could be reused across scripts.

A block makes a good candidate when:

1. **One purpose.** A single sentence describes what it does. If the description needs "and also" twice, it's not one module — it's several.
2. **Right size: 200–500 lines.** Smaller and the boundary overhead dominates the gain. Larger and the new module is itself getting hard to navigate.
3. **Mostly its own variables.** A handful of inputs and outputs; the rest is internal. If "outside" use is sprayed everywhere, the block isn't really separable.
4. **Minimal DOM / MQTT / global coupling.** Pure transformations (data in, data out) are cleanest. DOM-heavy regions are worst — every paint becomes a message round-trip unless the module also owns the DOM.

## When *not* to extract

Don't extract:

- **Tightly DOM-coupled paths** unless the module also owns the DOM. A module that asks the parent "paint button X red" via messages on every click will be slower and harder to debug than the inline version.
- **Blocks smaller than ~150 lines.** Interface overhead eats the gain.
- **Mechanisms that fire many times per user action.** A click triggering 10 small UI updates would generate 10 round trips.
- **State that's shared bidirectionally.** Extraction works when data flow is mostly one-way per call (parent → module → reply → parent). When both sides keep mutating the same value, snapshot semantics break down.

## The extraction shape

Modules talk by message-passing. A parent loads the module and sends it dictionaries:

```as
! Parent
run `mod.as` as ModName
...
send Input to ModName and assign reply to Output
```

The module declares a message handler, releases the parent, and waits:

```as
! Module
script Mod
... variable declarations ...

on message go to Handler
release parent
stop

Handler:
    put the message into Input
    ! ... process ...
    send Output to sender
    stop
```

`release parent` makes the parent's `run` return immediately. Without it the parent blocks at `run` waiting for the child to finish — fine if the module is a one-shot, useless for an ongoing helper.

See [modules](../reference/modules.md) for the full mechanism.

## Concurrent pattern

Same mechanics — `release parent`, `on message`, `stop` — but the module owns long-lived state and may drive its own DOM, forked tasks, or periodic loops. Use this when the module owns a sheet editor, sub-screen, or its own event loop. The boundary is the same; what changes is the module's internal structure.

## Interface design

A few guidelines that pay off:

- **One dict per direction.** Multi-value inputs and outputs travel as a single dictionary, not as several separate variables on the boundary.
- **No live refs across the boundary.** Once a value crosses, the receiver may mutate it freely; the sender keeps its own copy. Don't assume the parent still has the same data on the next round trip.
- **Parent retains network / MQTT ownership.** Modules ship results back to the parent; the parent does the actual server call. Otherwise each module would duplicate connection state and credentials.
- **Small payloads.** Whole records are fine. Whole layout trees per click are not.

## Worked examples

Two patterns documented in detail in the `as-modularize` skill:

- **controller ↔ deviceControl** (Python dialect) — the canonical subroutine-style extraction.
- **shell ↔ map-to-rooms** (JS dialect) — a pure-transformation extraction with no DOM, two-step `rest get` + `run` load.

## Related

- [modules](../reference/modules.md) — the mechanism: `run`, `release parent`, `send`, `on message`, `exit`.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — released modules are cooperative threads.
- [picking-a-collection-shape](picking-a-collection-shape.md) — for the dict-per-direction guideline.
