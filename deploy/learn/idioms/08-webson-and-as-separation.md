# Webson and AS separation

## Problem

You have a UI larger than a handful of elements. Creating each one inline in AllSpeak — `create`, `set the content of`, `set the style of`, repeat — quickly drowns the actual logic in DOM-construction noise. The structure of the UI gets tangled with the script's behaviour.

## The pattern

Split the UI in two:

- **Layout in a Webson `.json` file.** Element tree, styling, IDs.
- **Logic in a `.as` file.** Loading data, handling events, transforming state.
- **`attach` bridges them.** After rendering the Webson, the AS script claims each element by ID.

```as
variable Layout

create Body
rest get Layout from `app.json`
render Layout in Body

attach LoginPanel to `login-panel`
attach UsernameField to `username-input`
attach LoginButton to `login-button`
attach Status to `status`

on click LoginButton gosub HandleLogin
```

The script never says how the login panel looks — that's the layout file's job. The layout file never says what happens when the button is clicked — that's the script's job. Each side gets the rest of itself out of the way.

## When to reach for it

Webson + attach pays off when:

- The UI has more than a handful of elements.
- The layout might change without behaviour changing (visual redesign, translation).
- Multiple people (or a designer + a coder) work on the same screen.
- You want to load the layout dynamically (different layouts for different users, A/B tests).

Inline `create` is fine when:

- The UI is small (a couple of buttons, a status div).
- The elements are built procedurally (one button per data record).
- You're prototyping and don't want a separate file yet.

## Worked example

`app.json` (Webson layout):

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$LoginPanel"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Welcome"
    },

    "$LoginPanel": {
        "#element": "div",
        "@id": "login-panel",
        "#": ["$Username", "$LoginButton"],

        "$Username": {
            "#element": "input",
            "@id": "username-input"
        },

        "$LoginButton": {
            "#element": "button",
            "@id": "login-button",
            "#content": "Log in"
        }
    }
}
```

`app.as` (AllSpeak logic):

```as
variable Layout
div Title
div LoginPanel
input Username
button LoginButton

create Body
rest get Layout from `app.json`
render Layout in Body

attach Title to `title`
attach LoginPanel to `login-panel`
attach Username to `username-input`
attach LoginButton to `login-button`

on click LoginButton gosub HandleLogin
stop

HandleLogin:
    get the content of Username into Name
    ! ... validate, etc ...
    return
```

The script declares each typed variable, attaches it to the rendered element, and works with it from there. Visual changes (styling the button, repositioning the panel) happen entirely in `app.json`.

## Create-then-index for arrays of elements

When a UI has a repeating element rendered N times, declare an array on the AllSpeak side, **then create each element inside a loop while the cursor is set**:

```as
button Tab
set the elements of Tab to 5

set N to 0
while N is less than 5 begin
    index Tab to N
    create Tab in TabBar
    set the content of Tab to element N of TabNames
    add 1 to N
end

on click Tab gosub TabClicked
```

`set the elements of Tab to 5` reserves five slots. Each `index Tab to N` followed by `create Tab in TabBar` builds the element at slot N and inserts it into the container. A single `create` outside the loop would only build one element — not five — so the `create` must be inside the loop. The handler reads `the index of Tab` to discover which fired (see [event-handlers-and-array-index](event-handlers-and-array-index.md)).

This is the same array-plus-cursor pattern that applies to scalar arrays, extended to DOM elements.

## Anti-pattern: styling in the script

```as
create Save in Container
set the style of Save to `padding:1em; background:#48f; color:white; border-radius:0.3em`
```

CSS in the script is fragile and noisy. Move it to Webson where styling belongs. Keep the script for behaviour that the layout can't express — data binding, event handling, transitions.

## Anti-pattern: behaviour in Webson

Webson is layout; it can't express conditions, loops, or event handlers. If you find yourself wanting to encode behaviour in JSON keys, that's a sign to put the variable element on the script side and `attach` it.

## Related

- [browser-and-webson](../reference/browser-and-webson.md) — DOM types, `attach`, `render`.
- [event-handlers-and-array-index](event-handlers-and-array-index.md) — array-of-elements with shared handler.
- [writing-language-neutral](writing-language-neutral.md) — externalising user-facing strings in Webson for translation.
