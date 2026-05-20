# Collections

AllSpeak gives you several ways to gather data, and choosing the right one shapes the rest of the code. The conceptual model is shared across runtimes; the surface syntax for some operations differs between JS and Python (see the table at the end).

## The four shapes

### 1. Variable arrays — the cursor model

The default shape, covered in detail in [variables-and-arrays](variables-and-arrays.md). Every variable is implicitly a one-element array; grow it with `set the elements of`; access a slot by setting the cursor with `index X to N`.

```as
variable Counter
set the elements of Counter to 5
index Counter to 2
put 42 into Counter        ! writes to Counter[2]
```

Elements can be of mixed types. The cursor model is the AllSpeak signature; reach for it when several variables are doing the same job in parallel (e.g. a button, its caption, and its handler index as parallel arrays).

### 2. Object properties

Any object — a typed object like a button or div, or a variable that's been initialised as an object — can carry arbitrary named properties:

```as
button Save
create Save in Container
set property `rank` of Save to `primary`
if property `rank` of Save is `primary` begin
    ! ...
end
```

Properties are key-value metadata attached to an object. Use them for sparse, semantic facts that belong with the object itself rather than in a separate structure.

### 3. Key/value collections (dictionaries)

For a map from string keys to values, AllSpeak offers a dictionary shape. **The two runtimes use different keywords, and they are not interchangeable.**

**Python** — typed `dictionary` declaration, `entry` keyword:

```as
dictionary Spec
reset Spec
set entry `width` of Spec to 100
set entry `colour` of Spec to `blue`
put entry `width` of Spec into Width
```

**JS** — generic `variable` initialised as an object, `property` keyword (JS has no `dictionary` declaration):

```as
variable Spec
set Spec to object
set property `width` of Spec to 100
set property `colour` of Spec to `blue`
put property `width` of Spec into Width
```

The mental model is the same — a map of keys to values, accepting nested structures — but the surface syntax is runtime-specific. **Don't bring JS-style `variable X` + `set property K of X` into Python scripts.** It may appear to work because Python's `set property` *also* writes into an auto-created dict on the variable, but: (a) the type is undeclared so the runtime can't catch mistakes early, (b) `property` on Python is also a metadata layer (see row 4 of the JS-vs-Python table below), which means the same keyword does two things at once and reads back in unexpected ways, and (c) it ignores the canonical Python idiom that tooling and review expect.

On Python: write `dictionary X; reset X; set entry K of X to V`. On JS: write `variable X; set X to object; set property K of X to V`.

To iterate a dictionary, materialise its keys into a list first and walk the list. There is no direct `index` access on dictionaries; see [iterating a dictionary](../idioms/03-looping-patterns.md#iterating-a-dictionary) for the canonical pattern.

### 4. Ordered sequences (lists)

For a homogeneously-typed sequence of values:

**Python** — typed `list` declaration:

```as
list Items
reset Items
set element 0 of Items to `first`
set element 1 of Items to `second`
put element 0 of Items into First
```

**JS** — generic `variable` initialised as an array:

```as
variable Items
set Items to array
set element 0 of Items to `first`
set element 1 of Items to `second`
put element 0 of Items into First
```

## Trap: don't mix the cursor model with `set X to array` / `set X to object`

The two patterns look adjacent but are different layers. `set the elements of X to N` makes X a multi-slot variable and the cursor selects which slot you're operating on. `set X to array` (or `set X to object`) sets the *current slot's value* to a JSON container. These are independent. Mixing them is where AI-written code most often goes wrong:

```as
! WRONG — looks reasonable, doesn't do what you'd expect
variable Bucket
set Bucket to array               ! cursor slot = []
set the elements of Bucket to 1   ! no-op; the slot still holds []
index Bucket to 0
put Row into Bucket               ! cursor slot is now Row (the [] is gone)
rest post Bucket to URL           ! posts Row, not [Row]
```

`put V into X` writes V into the cursor slot, replacing whatever was there — exactly as if X had been an unused variable. The runtime treats every slot uniformly; it does not know or care that you previously initialised the slot to an array. To add to a JSON array held in the cursor slot, use the array-aware keyword:

```as
! RIGHT — keep the array intact
variable Bucket
set Bucket to array
json add Row to Bucket            ! cursor slot = [Row]
rest post Bucket to URL           ! posts [Row]
```

Or, when you need positional control:

```as
set element 0 of Bucket to Row    ! cursor slot = [Row]
set element 1 of Bucket to OtherRow
```

The cursor (`index X to N`) addresses *slots of X*. The element/property keywords (`set element N of`, `set property K of`, `json add … to`) address *inside the JSON value held by the current slot*. They never overlap.

## Picking a shape

The choice usually comes down to access pattern:

- **By position, with parallel records** → variable array. The cursor model coordinates several variables that step in lockstep.
- **By position, as a single sequence** → list (or `set X to array` in JS).
- **By string key** → dictionary (or `set X to object` in JS).
- **As metadata on an object** → property.

A common confusion: variable arrays look like lists but aren't. Variable arrays expose one element at a time through a cursor; iteration is a `while` loop with a moving index. Lists expose all elements as a sequence and support whole-sequence iteration. Reach for a variable array when the elements are coordinated with other variables (`Button`, `Caption`, `Handler` all parallel). Reach for a list when the elements are just a sequence with no parallel structure.

## JS vs Python

| Concept | JS | Python |
|---------|-----|--------|
| Variable array | `variable X` + `set the elements of X to N` | same |
| Dictionary | `variable X` + `set X to object`; `property K of X` | `dictionary X`; `reset X`; `entry K of X` |
| List | `variable X` + `set X to array`; `element N of X` | `list X`; `reset X`; `element N of X` |
| Object property | `set property K of X to V` — same mechanism as dictionary access; variable must be set as object | `set property K of X to V` — a separate metadata layer, independent of any value the variable holds |

Python has more explicit type declarations, a dedicated `entry` keyword for dictionary access, and treats object properties as a layer that coexists with the variable's value. JS stores dictionary and list contents as JSON-shaped data inside a `variable` and uses `property` for key access; there's no distinction in JS between a dictionary entry and an object property. Both implementations support arbitrarily nested structures.

Critically, **the JS column is not a valid fallback when writing Python**, and vice versa. The runtimes only overlap on row 1 (variable arrays). If you're writing a Python script and reach for `variable X; set X to object; set property K of X to V`, you've imported the JS pattern: it may execute without error but the resulting code is untyped, behaves unexpectedly around the metadata-property layer, and won't read back the way the Python `entry` form does. Pick the column for your runtime and stay in it.

## Related

- [variables-and-arrays](variables-and-arrays.md) — the cursor model in detail.
- [picking-a-collection-shape](../idioms/picking-a-collection-shape.md) — worked examples for choosing.
- [browser-and-webson](browser-and-webson.md) — DOM elements are typed objects with properties.
