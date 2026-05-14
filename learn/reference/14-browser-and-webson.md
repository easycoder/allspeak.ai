# Browser and Webson

AllSpeak's Browser domain provides the vocabulary for building and manipulating DOM elements: buttons, divs, inputs, forms, the works. The Webson companion language is a JSON dialect for describing layout — it lets you keep UI structure in a separate `.json` resource, away from the AllSpeak logic.

A typical AllSpeak UI puts layout in Webson, behaviour in `.as`, and uses `attach` to bind the two.

## DOM variable types

Each kind of DOM element is a typed variable:

```as
button SaveButton
div Container
input NameField
form LoginForm
span Status
h1 Title
p Para
image Logo
select Dropdown
label NameLabel
```

A typed variable like `button SaveButton` declares the variable; the element doesn't exist in the DOM until you create it or attach it to a rendered one.

The full set of types lives in the Browser domain's vocabulary — every common HTML element has an AllSpeak type.

## Two paths to a live element

There are two ways to put an element on the page.

**Create in code.** Suitable for small UIs or for elements built dynamically:

```as
button Save
create Save in Container
set the content of Save to `Save`
set the style of Save to `padding:0.5em; background:#48f`
on click Save gosub HandleSave
```

`create X in Container` builds the element and inserts it as a child of `Container`. `set the content of X` sets the text inside; `set the style of X` sets the inline CSS.

**Attach to a rendered layout.** Suitable for larger UIs where the layout is described in Webson:

```as
variable Layout
create Body
rest get Layout from `app.json`
render Layout in Body

attach Save to `save-button`
attach Container to `main-panel`
on click Save gosub HandleSave
```

The Webson JSON describes the layout (positions, styling, element IDs); `render` builds the DOM tree from the JSON; `attach` binds AllSpeak variables to elements by their HTML `id`. From there, the variables work the same as if they had been created directly.

## `attach`

`attach <variable> to <id-string>` finds an element in the live DOM by ID and binds it to the variable:

```as
attach Status to `status`
attach LoginPanel to `login-panel`
```

The variable's type should match the element kind in the layout — a `div` variable to a `div`, a `button` to a `button`.

## Common element operations

Once you have an element variable (created or attached), the everyday operations are:

```as
set the content of X to `Hello`            ! text content of the element
set the text of X to `Hello`               ! synonym for content
set the style of X to `color:red; font-weight:bold`
set style `width` of X to `90%`            ! one CSS property at a time
set property `data-id` of X to `42`        ! arbitrary HTML attribute
get the content of X into V                ! read back
```

`set the style of X` is bulk inline CSS; `set style `width` of X` writes a single property. `set property` reaches for HTML attributes other than style.

## Events

Element events register with `on <event> <element> gosub Handler`:

```as
on click Save gosub HandleSave
on change NameField gosub NameChanged
on submit Form gosub Submit
```

The handler is a thread; the cursor on the element variable is set to the firing instance before the handler runs. See [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) for the canonical pattern with arrays of elements.

## Webson

Webson is a JSON dialect that describes HTML/CSS layout. It uses its own conventions:

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$SaveButton"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Welcome"
    },

    "$SaveButton": {
        "#element": "button",
        "@id": "save-button",
        "#content": "Save"
    }
}
```

- `#element` names the HTML tag.
- `@<name>` sets an HTML attribute — "@ is for @ttribute". `@id` is the most common (the handle that AllSpeak `attach` looks up), but the same prefix works for any attribute: `@href`, `@checked`, `@width`, `@src`, `@type`, etc.
- `#content` is the text content.
- `#` is an ordered list of child references, named with a `$` prefix.
- Plain keys (`padding`, `font-family`, …) become CSS properties.

`render Layout in Body` walks the Webson tree and emits real DOM. The point of the dialect is separation: the layout is a static `.json` resource that can be edited (or translated) without touching the AllSpeak. For a worked discussion of the split, see [webson-and-as-separation](../idioms/webson-and-as-separation.md).

## Arrays of DOM elements

A typed DOM variable can be an array, just like a scalar:

```as
button Item
set the elements of Item to 5
! ... populate 5 buttons ...

on click Item gosub HandleClick
```

This is the canonical pattern for "many similar elements". See [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) and [picking-a-collection-shape](../idioms/picking-a-collection-shape.md).

## Browser-local storage

The browser provides a small persistent key/value store that survives page reloads. AllSpeak exposes it via three keywords:

```as
put Lang into storage as `app.lang`           ! write
get Lang from storage as `app.lang`           ! read
remove `app.lang` from storage                ! delete a single key
put empty into storage as `app.lang`          ! also clears the value
```

Reads return empty (`empty`) if the key isn't present, so a missing entry on first load doesn't need an explicit check before reading — the variable just receives empty. Keys are arbitrary strings; convention is to namespace them with your script's name to avoid collisions with other AllSpeak apps on the same origin.

Values are strings as far as storage is concerned. To persist a structured shape (a list, a dictionary), serialise it first with the JSON keywords; deserialise on read.

```as
! Save an integer array (12 small ints) as JSON, then read it back.
variable State
set State to array
! ... populate State[0..11] with element-setters ...
put State into storage as `cells.state`

! Later, on page load:
get State from storage as `cells.state`
if State is empty set State to array       ! initialise on first load
```

Storage is browser-only. The Python runtime does not have this vocabulary; for the CLI, use `read` / `write` on a file instead.

## Webson renderer vs Browser domain

The Webson renderer (which turns Webson JSON into DOM) is a companion tool — it's not part of the AllSpeak language. The Browser domain provides the language vocabulary (`button`, `attach`, `on click`); the renderer emits the elements that `attach` then binds. See [structure](structure.md) for the place of companion tools.

## Related

- [structure](structure.md) — Browser is one of the bundled domains; Webson renderer is a companion tool.
- [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) — `on click` and the cursor model for arrays of elements.
- [webson-and-as-separation](../idioms/webson-and-as-separation.md) — when to use Webson vs inline creation.
- [collections](collections.md) — object properties on DOM elements.
