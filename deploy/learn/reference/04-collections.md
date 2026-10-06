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

**Python** — typed `list` declaration, grown with `append` and read with `item`:

```as
list Items
reset Items
append `first` to Items
append `second` to Items
put item 0 of Items into First
```

Note `item`, not `element`: on the Python side `element N of X` belongs to a variable's *array mode*
(shape 1 above) and does not apply to a declared `list`. Assigning to a slot that does not exist yet
is an error rather than a growth — *list assignment index out of range* — which is why a Python list
is filled with `append`. On JS the same `list` is a JSON array and `set element 4 of X to V` grows it.


**JS** — generic `variable` initialised as an array:

```as
variable Items
set Items to array
set element 0 of Items to `first`
set element 1 of Items to `second`
put element 0 of Items into First
```

### 5. Stacks and queues — Python only

A last-in-first-out or first-in-first-out sequence, for work that nests or arrives in order. It lets
one name serve many scratch uses: push on entry, pop on exit, and the name is free in between.

```as
stack Undo
push `first` onto Undo
pop Last from Undo        ! Last is `first`; the stack is empty again
```

**This is Python only.** There is no `stack` or `queue` declaration in the JS runtime, and — worth
knowing before reaching for it — `push` and `pop` *do* exist there, meaning something else entirely:
`push {value}` and `pop [into] {variable}` manipulate the runtime's own argument and call stacks. So
the Python idiom fails in JS in a way that has nothing to do with what was meant. See
`language-pack-issues.md` #16.

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

## `split` and `join` — between many elements and one value

Two keywords convert between a single value and a holder's many elements — `split` writes the whole element set, and `join` reads it. `join` is also the one place where a bare name means a holder's **whole element set** rather than the slot the cursor stands on.

`split` refills a holder from the value it already holds — one slot per line, or one slot per piece between a delimiter. That form works in both runtimes:

```as
put Text into Lines
split Lines                   ! one slot per line

put Row into Fields
split Fields on `,`           ! one slot per comma-separated field
```

JavaScript additionally takes the value and the holder in one statement — ``split Text on `,` giving Fields``, and ``split Text into Lines`` for the newline case. Python's `split` does neither: it refuses `giving` and `into` (measured), so write the two-statement form, which both runtimes accept.

`join` is its inverse: it takes a whole holder and makes one value out of it.

```as
join Items into Joined                  ! the elements run together
join Items with `,` into Joined         ! ...separated by a comma
join Items as json into Joined          ! one json list
join from 1 to 3 of Items into Joined   ! a range of them, combined with either of the above
```

- **A bare name after `join` always means the whole holder.** Everywhere else a bare name is the slot the cursor is on: `put A into B` copies one slot and `json of` a holder gives one slot (both measured — see the trap above). `join` is the exception, made deliberately in the same way `split` already makes it in reverse.
- **`from N to M of` is the half-open slice `Items[N:M]`**, consistent with string and array handling everywhere else. So `from 4 to 5` is **one** element and `from 4 to 4` is **empty** — an empty string, or `[]` for `as json`. Out-of-range bounds clamp rather than raise, and a range whose end is below its start is empty.
- **`as json` produces the same value the `json` command set produces** — a list whose elements are recognised as json where their text is — so `the json count of`, `the json keys of`, `element N of` and `has element` all read it. Without `as json` the result is ordinary text.
- **The destination is the cursor slot**, exactly as it is for `put`. So `index Items to 2` before `join Items into Items` writes the whole joined value into slot 2, replacing what was there and leaving the other slots alone.

**Reading `as json` is where the runtimes differ**, and it is the same divergence the table below describes — a list is a typed shape on Python and json-shaped text inside a `variable` on JavaScript:

- **JavaScript** — the target is a plain `variable`, holding json text. Read it with `the json count of Joined`, `element N of Joined`, or `Joined has element N`.
- **Python** — declare the target a `list`, which then holds a real list: read it with `the count of Joined` and `item N of Joined`. A plain `variable` takes the value as json text instead, which `json of` parses (into a `list` before it can be counted or indexed).

One more difference, and it is the two models' own rather than `join`'s: a holder that was **never given elements** joins as one *empty* element on JavaScript and as *nothing* on Python — `[""]` against `[]` for `as json`. JavaScript gives every variable one slot from birth; Python gives none until something writes to it, and cannot tell a variable that was never grown from one explicitly set to zero elements. Write `set the elements of X to N` before joining `X` and the two agree.

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
| List | `variable X` + `set X to array`; `set element N of X to V` grows it; `element N of X` reads | `list X`; `reset X`; `append V to X` grows it; `item N of X` reads — `element` is the *array* form, and assigning to a slot that does not exist is an error |
| Object property | `set property K of X to V` — same mechanism as dictionary access; variable must be set as object | `set property K of X to V` — a separate metadata layer, independent of any value the variable holds |

Python has more explicit type declarations, a dedicated `entry` keyword for dictionary access, and treats object properties as a layer that coexists with the variable's value. JS stores dictionary and list contents as JSON-shaped data inside a `variable` and uses `property` for key access; there's no distinction in JS between a dictionary entry and an object property. Both implementations support arbitrarily nested structures.

Critically, **the JS column is not a valid fallback when writing Python**, and vice versa. The runtimes overlap on variable arrays and on object properties, and diverge on how a collection is declared and grown — dictionaries and lists differ in both, and stacks exist on one side only. If you're writing a Python script and reach for `variable X; set X to object; set property K of X to V`, you've imported the JS pattern: it may execute without error but the resulting code is untyped, behaves unexpectedly around the metadata-property layer, and won't read back the way the Python `entry` form does. Pick the column for your runtime and stay in it.

## Related

- [variables-and-arrays](variables-and-arrays.md) — the cursor model in detail.
- [picking-a-collection-shape](../idioms/picking-a-collection-shape.md) — worked examples for choosing.
- [browser-and-webson](browser-and-webson.md) — DOM elements are typed objects with properties.
