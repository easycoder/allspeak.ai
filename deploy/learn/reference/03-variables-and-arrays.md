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

## Mixed types within an array

Elements of an array are independent. A single variable can hold a number in one slot and a string in another — though doing so usually signals a missed modelling opportunity (see [picking-a-collection-shape](../idioms/picking-a-collection-shape.md)).

## When to reach for arrays

The clearest signal is **several variables doing much the same thing**. Three buttons named `SaveButton`, `LoadButton`, `QuitButton` that all share handlers and styling want to be one 3-element `Button` array. This applies to DOM elements as much as to scalar data — arrays of `div`, `input`, `button` are routine in any non-trivial UI.

If you find yourself naming variables `Item1`, `Item2`, `Item3`: stop, use an array.

## The `variable` type

`variable` is the one weakly-typed shape: it can hold numeric, string, or boolean values, with mostly-automatic conversion. Other types — `file`, `button`, `dictionary`, module-handles — are strict about what they accept.

## JS vs Python

Both implementations follow the same model for scalar variables and arrays. They diverge on collections: Python exposes `dictionary` and `list` as distinct typed shapes; JS unifies storage as strings and converts to objects on the way in and out. See [collections](collections.md) for the implications.

## Related

- [collections](collections.md) — when an array element should itself be a dictionary or list.
- [picking-a-collection-shape](../idioms/picking-a-collection-shape.md) — choosing between array, dict, and list.
- [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) — how event handlers find out which array element fired.
