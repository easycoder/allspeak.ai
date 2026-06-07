# Variables and arrays

Variables in AllSpeak are containers. A variable can hold a value (number, string, boolean) or represent an entity (a DOM element, a file, a module). Each domain — Core, Browser, REST, MQTT, plugin domains — defines its own variable types with their own vocabulary.

## Naming and scope

- Variable names start with a capital letter. Camel case is fine — `Counter`, `UserName`, `MessageList`.
- All variables are global. AllSpeak has no block scope and no function-local variables. The only way to get private state is to run a child module (see [modules](modules.md)).
- Name variables for what they hold, not how they're used. A button representing the primary action is `PrimaryButton`, not `Btn1`.
- Group variables by type and by function, not alphabetically.
- Scratch variables — short-lived reusables like `I`, `N`, `Temp` — are best grouped together and separated from main variables by a blank line.

## All variables are arrays

Every variable is an array. By default it has one element, so most of the time you can ignore the array nature entirely:

```as
variable Counter
put 0 into Counter        ! Counter[0] = 0
add 1 to Counter          ! Counter[0] = 1
```

When you need more than one slot, grow the array with `set the elements of`:

```as
set the elements of Counter to 5    ! Counter now has 5 slots, [0]..[4]
```

Growing preserves existing contents; shrinking loses the high-indexed values.

## The cursor model

Access to a specific element is via an internal pointer set with `index`:

```as
index Counter to 2
put 42 into Counter       ! writes to Counter[2]
```

Once indexed, the variable behaves as if it has a single element. There is **no other syntax for indexed access** — no `Counter[2]` notation, no `element 2 of Counter`. The cursor is the only way in, similar to SQL cursors. This is intentional: most code can ignore that arrays exist, and code that needs them is forced to be explicit about which element it's touching.

### Reading the cursor position

To find out which slot the cursor is currently on, use `the index of`:

```as
put the index of Counter into N    ! N = current slot number
```

This is commonly used inside click handlers to identify which array element was clicked (see [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md)).

## Common mistakes with the cursor model

### ❌ Wrong inverse: `put N into index of X`

The get and set syntaxes are **not symmetric**:

```as
put the index of X into N      ! ✅ read — keyword form "the index of X"
index X to N                   ! ✅ set — keyword command, not a put
```

A natural but **wrong** inverse is:

```as
put N into index of X          ! ❌ not valid — index is not a property you can put into
```

The write form is always `index X to N` — there is no `put … into index of X` form.

### ❌ Indexing beyond the sized range

Every variable starts with exactly one element (slot 0). Before calling `index X to N` with N > 0, you must grow the array first:

```as
set the elements of X to 10    ! slots [0]..[9]
index X to 5                   ! ✅ safe
```

The most common symptom of a missing `set the elements of` is a runtime error when `index X to 1` is attempted on a 1-slot variable.

### ❌ Setting the cursor after creating the element

When building DOM elements in an array, set the cursor **before** `create`:

```as
index DataRowDivs to I         ! ✅ set cursor first
create DataRowDivs in LogBody   ! element goes into slot I
```

Creating without setting the cursor first always writes to the current slot (slot 0 by default), overwriting any previous element.

### ❌ Mixing the cursor model with JSON array access

`index X to N` addresses the **slots of X** (the variable's own array). It is unrelated to `element N of X` (which reads inside a JSON value held in the current slot). They never overlap:

```as
index X to 0                   ! cursor to slot 0
put `[10, 20, 30]` into X       ! slot 0 now holds a JSON array
put element 1 of X into N      ! N = 20 (inside the JSON value)
```

See [collections](collections.md) for more.

## Mixed types within an array

Elements of an array are independent. A single variable can hold a number in one slot and a string in another — though doing so usually signals a missed modelling opportunity (see [picking-a-collection-shape](../idioms/picking-a-collection-shape.md)).

## When to reach for arrays

The clearest signal is **several variables doing much the same thing**. Three buttons named `SaveButton`, `LoadButton`, `QuitButton` that all share handlers and styling want to be one 3-element `Button` array. This applies to DOM elements as much as to scalar data — arrays of `div`, `input`, `button` are routine in any non-trivial UI.

If you find yourself naming variables `Item1`, `Item2`, `Item3`: stop, use an array.

Note: declaring `div X` does **not** restrict X to DOM-only operations — it's still an AllSpeak variable that supports the full cursor model (`index`, `set the elements of`). The `div` prefix just controls what type of element `create X` produces.

## The `variable` type

`variable` is the one weakly-typed shape: it can hold numeric, string, or boolean values, with mostly-automatic conversion. Other types — `file`, `button`, `dictionary`, module-handles — are strict about what they accept.

## JS vs Python

Both implementations follow the same model for scalar variables and arrays. They diverge on collections: Python exposes `dictionary` and `list` as distinct typed shapes; JS unifies storage as strings and converts to objects on the way in and out. See [collections](collections.md) for the implications.

## Related

- [collections](collections.md) — when an array element should itself be a dictionary or list.
- [picking-a-collection-shape](../idioms/picking-a-collection-shape.md) — choosing between array, dict, and list.
- [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) — how event handlers find out which array element fired.
