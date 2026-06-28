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

### The full set of element types

Every common HTML element has an AllSpeak type. As of today: `a`, `audioclip`, `blockquote`, `button`, `canvas`, `div`, `file`, `fieldset`, `form`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `image` (alias for `img`), `img`, `input`, `label`, `legend`, `li`, `option`, `p`, `pre`, `progress`, `select`, `span`, `table`, `textarea`, `td`, `th`, `tr`, `video`. If you need an element type not in this list, declare it as `div` and use `set attribute` to give it the right tag — the Browser domain doesn't limit what the renderer can create.

## `attach` — binding script to layout

`attach` connects a script variable to a rendered DOM element by its HTML `id`:

```as
create Body
rest get Layout from `app.json`
render Layout in Body

attach LoginPanel to `login-panel`
attach UsernameField to `username-input`
attach LoginButton to `login-button`
```

After `attach`, the variable refers to the live DOM element — `set the content of`, `on click`, `set the style of`, etc. all work on it.

Attach can also find elements inside a rendered component by passing the element to search within:

```as
attach Panel to `side-panel`
attach Button to `save-btn` inside Panel
```

The variable's type should match the element kind in the layout — a `div` variable to a `div`, a `button` to a `button`.

## Common element operations

Once you have an element variable (created or attached), the everyday operations are:

```as
set the content of X to `Hello`            ! text content of the element
set the text of X to `Hello`               ! synonym for content
set the style of X to `color:red; font-weight:bold`
set style `width` of X to `90%`            ! one CSS property at a time
set attribute `href` of X to `https://example.com`   ! HTML attribute on the DOM element
set attribute `data-id` of X to `42`       ! arbitrary attribute, same form
put the content of X into V                ! read back
```

`set the style of X` is bulk inline CSS; `set style \`name\` of X` writes a single CSS property. `set attribute \`name\` of X` writes an HTML attribute on the live DOM element by calling `element.setAttribute(name, value)`.

### `set attribute` vs `set property` — they are not the same

This trap bites AI agents reliably and humans occasionally:

- **`set attribute \`name\` of X to V`** writes to the **DOM element**. Use this for `href`, `target`, `title`, `src`, `type`, `checked`, `data-*`, ARIA attributes — anything that needs to live on the live HTML element so the browser acts on it.
- **`set property \`name\` of X to V`** writes to a **JSON dictionary stored in the variable's data slot**. It does *not* touch the DOM. Use this for application-level metadata you want to carry alongside the element (e.g. a row's record ID for your own event handlers to read back via `property \`name\` of X`).

The two have similar surface syntax but completely different effects. A common symptom of the mix-up: `set property \`href\` of LinkAnchor to URL` runs without error, but the link doesn't navigate when clicked — because the DOM `<a>` never got the `href`; only the variable's data dict did. The fix is to change `property` to `attribute`.

If your goal is "make the browser act on this", reach for `attribute`. If your goal is "remember this fact about the element for my own code to read later", reach for `property`.

## Events

Element events register with `on <event> <element> gosub Handler`:

```as
on click Save gosub HandleSave
on change NameField gosub NameChanged
on submit Form gosub Submit
```

The handler is a thread; the cursor on the element variable is set to the firing instance before the handler runs. See [event-handlers-and-array-index](../idioms/event-handlers-and-array-index.md) for the canonical pattern with arrays of elements.

## Native browser dialogs

Two keywords route to the browser's built-in modal dialogs. Both block the page until the user dismisses them, so use sparingly — for substantive UI, build a modal in Webson and a normal element-based form.

`alert` shows an informational message:

```as
alert `Saved.`
```

`confirm` shows an OK/Cancel dialog and branches on the user's choice via `gosub`:

```as
confirm `Delete this booking?` gosub OnYes or gosub OnNo
```

The `or gosub <Label>` clause is optional — if you only care about the OK case, drop it; on Cancel the script just continues to the next command. Both branches behave as ordinary `gosub` calls: they push a return PC and the called subroutine ends with `return`, so execution resumes at the next command regardless of which branch ran.

The displayed text is whatever string value you pass — it's not affected by the language pack, so translate it yourself.

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

`render Layout in Body` walks the Webson tree and emits real DOM. The point of the dialect is separation: the layout is a static `.json` resource that can be edited (or translated) without touching the AllSpeak. For a worked discussion of the split, see [webson-and-as-separation](../idioms/webson-and-as-separation.md).

### Key reference

Every key in a Webson object falls into one of these categories:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `#element` | HTML tag name | `"div"`, `"button"`, `"h1"` |
| `#content` | Text content | `"Welcome"` |
| `#doc` | Documentation — ignored by renderer | any string |
| `#` | Ordered list of child references | `["$Title", "$SaveButton"]` |
| `@<name>` | HTML attribute | `@id`, `@class`, `@href`, `@type` |
| `$<name>` | Named child definition | `$Title`, `$SaveButton` |
| plain key | CSS property | `padding`, `font-family`, `color` |

### `#element` — the HTML tag

Required on every element. Value is the tag name as a string: `"div"`, `"button"`, `"input"`, `"h1"`, `"textarea"`, `"img"`, `"a"`, `"span"`, `"label"`, `"select"`, `"option"`, `"form"`, `"p"`, `"pre"`, `"ul"`, `"ol"`, `"li"`, `"table"`, `"tr"`, `"td"`, `"th"`, `"hr"`, `"br"`, `"fieldset"`, `"legend"`.

### `#content` — text content

The element's inner text. Can coexist with children (`#`) — content is rendered first, then children.

```json
{
    "#element": "p",
    "#content": "Total: ",
    "#": ["$ValueSpan"]
}
```

### `#` — the children array

An ordered list of `$`-prefixed names. The renderer creates child elements in this order. **Without `#`, no children render** — even if the object has `$`-prefixed keys defined below.

```json
{
    "#element": "div",
    "#": ["$Label", "$Input"],    ← Label renders first, Input second

    "$Label": { ... },
    "$Input": { ... }
}
```

A `$` name referenced in `#` must exist somewhere in resolution scope (see below), but it does not need to be nested in the same object — it can be defined at a parent or root level.

### `$<name>` — named child definitions

`$`-prefixed keys define elements that `#` references. They can appear at any level in the tree — the renderer resolves them by searching upward.

**Resolution order** (where the renderer looks for `$ModalForm` when `$Modal`'s `#` references it):

1. **Same object** — keys of the element whose `#` contains the reference
2. **Parent object** — keys of the element's parent in the Webson tree
3. **Root object** — keys of the top-level object (the file root)

This means a child definition can live at a parent scope:

```json
{
    "#element": "div",
    "#": ["$Outer"],

    "$Outer": {
        "#element": "div",
        "#": ["$Inner"]
        ← $Inner is NOT defined here — the renderer looks up
    },

    "$Inner": {                   ← Found here (parent scope)
        "#element": "span",
        "#content": "Hello"
    }
}
```

This is useful for sharing common elements across siblings without repeating their definition.

### `@<name>` — HTML attributes

Keys starting with `@` set HTML attributes on the DOM element. `"@" is for "@ttribute"`:

```json
{
    "@id": "save-btn",
    "@class": "primary",
    "@type": "checkbox",
    "@checked": true,
    "@placeholder": "Enter name",
    "@href": "https://example.com",
    "@src": "logo.png",
    "@autocomplete": "username",
    "@disabled": true,
    "@rows": "3"
}
```

`@id` is the most common — it's the handle that AllSpeak's `attach` command looks up after `render`.

### CSS properties

Any key that doesn't start with `#`, `@`, or `$` is treated as a CSS property. Hyphenated names go straight through:

```json
{
    "font-family": "sans-serif",
    "font-size": "14px",
    "color": "#333",
    "margin": "1em 0",
    "display": "flex",
    "align-items": "center",
    "gap": "0.5em",
    "grid-template-columns": "1fr 1fr"
}
```

Key order among CSS properties does not matter — the renderer collects them all and sets them on the element's `style` attribute.

### `#doc` — documentation

A documentation-only key. The renderer ignores it entirely. Use it for inline notes:

```json
{
    "#doc": "This panel is shown after login.",
    "#element": "div",
    ...
}
```

### Key order does not matter

The renderer identifies keys by their prefix, not their position in the object. This works:

```json
{
    "$Modal": { ... },
    "#element": "div",
    "@id": "page",
    "background": "#f5f5f5",
    "#": ["$Modal"]
}
```

But by convention, most layouts list keys in this order for readability:

1. `#doc` (if present)
2. `#element`
3. `@id`
4. CSS properties
5. `#` (children array)
6. `$`-prefixed child definitions

### Worked example: modal overlay with scope resolution

A modal dialog where the overlay div, the modal wrapper, and the form fields are each separate objects, demonstrating `$` resolution across scopes:

```json
{
    "#element": "div",
    "@id": "page",
    "#": ["$Overlay"],

    "$Overlay": {
        "#element": "div",
        "@id": "overlay",
        "display": "none",
        "position": "fixed",
        "top": "0", "left": "0", "right": "0", "bottom": "0",
        "background": "rgba(0,0,0,0.5)",
        "#": ["$Modal"],

        "$Modal": {
            "#element": "div",
            "background": "white",
            "border-radius": "8px",
            "padding": "1.5em",
            "#": ["$ModalForm"]
            ← $ModalForm is NOT defined here
        }
    },

    "$ModalForm": {         ← Resolved from root (parent-of-parent scope)
        "#element": "div",
        "@id": "modal-form",
        "#": ["$Title", "$Fields"],

        "$Title": {
            "#element": "h2",
            "@id": "modal-title",
            "#content": "Edit booking"
        },

        "$Fields": {
            "#element": "div",
            "@id": "form-fields",
            "display": "flex",
            "flex-direction": "column",
            "gap": "0.5em",
            "#": ["$DateRow"],

            "$DateRow": {
                "#element": "div",
                "display": "flex",
                "align-items": "center",
                "gap": "0.5em",
                "#": ["$DateLabel", "$DateInput"],

                "$DateLabel": {
                    "#element": "label",
                    "#content": "Date",
                    "width": "120px",
                    "flex-shrink": "0"
                },
                "$DateInput": {
                    "#element": "input",
                    "@id": "date-input",
                    "@type": "date",
                    "flex": "1",
                    "min-width": "0"
                }
            }
        }
    }
}
```

Key points in this example:

- **`$Modal`'s `#` references `$ModalForm`**, which is defined two levels up (at the root). The renderer searches: same object ($Modal → not found) → parent ($Overlay → not found) → root (found).
- **`$ModalForm` is defined once** but referenced from `$Modal`'s `#`. It does not need to be nested inside `$Modal`.
- **`#` controls render order.** The page renders Overlay (via `#: ["$Overlay"]`), which renders Modal (via its `#`), which renders ModalForm (via its `#`). Without any of those `#` arrays, the children would be defined but invisible.
- **Each row is a flex container** with a fixed-width label and a flex-fill input — the standard pattern for tabular forms.

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

AllSpeak for the browser provides `storage` — an interface to the browser's `localStorage` API:

```as
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
