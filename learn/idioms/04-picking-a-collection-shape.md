# Picking a collection shape

## Problem

You need to store multiple values that belong together. AllSpeak offers four shapes — variable arrays, properties, dictionaries, lists (see [collections](../reference/collections.md)). Picking the wrong one early causes friction throughout the script: verbose accessors, awkward iteration, accidental data fragmentation.

## The criteria

The choice maps almost mechanically onto the access pattern:

| If you access data … | Use |
|----------------------|-----|
| By position, with several variables stepping in lockstep | Variable array |
| By position, as a single typed sequence | List |
| By string key | Dictionary |
| As metadata on an object | Property |

The hardest line is between variable array and list, because they look similar. Decision rule: **if you reach for the same index `N` on two or more variables, those variables want to be parallel variable arrays**. If a single sequence is enough, a list is simpler.

## Variable array — for parallel records

Five clickable items, each with a caption, a target URL, and a "visited" flag:

```as
button Item
variable Caption
variable Target
variable Visited

set the elements of Item to 5
set the elements of Caption to 5
set the elements of Target to 5
set the elements of Visited to 5

! ... populate each parallel array ...

on click Item gosub HandleClick

HandleClick:
    index Caption to the index of Item
    index Target to the index of Item
    index Visited to the index of Item
    ! All three now point at the matching slot
    return
```

One firing cursor, three coordinated reads. This is the AllSpeak idiom for record-by-position access.

## Dictionary — for keyed configuration

A config block with named fields:

```as
variable Config
set Config to object
set property `theme` of Config to `dark`
set property `pageSize` of Config to 50
set property `apiKey` of Config to the content of KeyField

if property `theme` of Config is `dark` begin
    ! apply dark styling
end
```

Use a dictionary when keys are well-known string names and access is by name, not position.

## List — for an ordered sequence with no parallel structure

A log buffer:

```as
variable Log
set Log to array
set element 0 of Log to `User logged in`
set element 1 of Log to `Cart populated`
set element 2 of Log to `Order placed`
```

Elements are uniform and unrelated to any other variable. No cursor coordination needed. Reach for a list rather than a variable array.

## Anti-pattern: list of dictionaries when parallel arrays fit

```as
! Avoid this when records are accessed by index
variable Items
set Items to array
variable Item
set Item to object
set property `caption` of Item to `Buy`
set property `target` of Item to `/buy`
set element 0 of Items to Item
! ... repeat for each item ...
```

This works but is verbose. If your access pattern is consistently "give me record N", parallel variable arrays are shorter and integrate with `on click` handlers more naturally (no per-record property extraction inside the handler).

Reach for list-of-dicts when the records are conceptually documents — heterogeneous, accessed sparsely, or transmitted as JSON. Reach for parallel variable arrays when records are accessed in lockstep with the UI or other state.

## Anti-pattern: a separate dictionary when a property would do

If you need one or two named facts attached to an existing object (button, div, file), use `set property … of Obj to …` directly on the object rather than declaring a parallel dictionary keyed by some kind of object ID. The information stays attached to the thing it describes.

## Related

- [collections](../reference/collections.md) — the four shapes in detail.
- [variables-and-arrays](../reference/variables-and-arrays.md) — the cursor model.
- [event-handlers-and-array-index](02-event-handlers-and-array-index.md) — why parallel arrays + cursor pay off in handlers.
