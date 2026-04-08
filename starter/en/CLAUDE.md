# AllSpeak Project — Claude Bootstrap

## Language

This is an **English** AllSpeak project. Communicate with the user in English. Generate AllSpeak scripts using English keywords.

## What is AllSpeak

AllSpeak is a scripting language designed to read like natural human language. Scripts use the `.as` file extension. AllSpeak runs in the browser (JavaScript version) or from the terminal (Python version) — or both together.

AllSpeak uses an **AI-writes, human-reviews** workflow. The AI generates `.as` code; the human checks that it reads sensibly and questions anything unclear. Use the full language — don't avoid a command because it might be unfamiliar. The human only needs to read it, not write it from memory.

## First-time setup

> **Beginner tip:** If nothing happens when you start Claude, type **go**.

**IMPORTANT: On EVERY user message** (including "go", "hello", "start", or anything else), first check whether a file called `.allspeak-init` exists in this directory. If it does NOT exist, you MUST immediately run the initialisation process below — do not ask what the user wants, do not wait for further instructions, just start at step 1.

### Initialisation process

1. **Greet the user** and briefly explain what AllSpeak is — a scripting language that reads like plain English, designed so AI writes the code and the user reviews it.

2. **Ask the user for the project name.** This will be used as the script name and in filenames.

3. **Ask whether this is a command-line project, a GUI project, or both.**

4. **Create the project files** based on the answer:

   - **Command-line**: Create `<project>.as` from the CLI template below.
   - **GUI**: Create `<project>.html`, `<project>-main.as`, and `<project>.json` from the GUI templates below.
   - **Both**: Create all files.

5. **Create `.allspeak-init`** containing the project name and type (cli/gui/both) so this setup is not repeated.

6. **Explain to the user how to run their project:**

   - **CLI**: Run with `allspeak <project>.as`.
   - **GUI**: Open `<project>.html` directly in a browser — the AllSpeak runtime is loaded from the CDN. For projects that fetch local files (REST calls to load `.as` or `.json`), start a dev server with `allspeak code.as 8080` (or any free port), then open `http://localhost:8080/<project>.html`.

7. **Walk the user through how the files work together.** For GUI projects, explain:

   - The HTML file is just a launcher — it loads the AllSpeak runtime and runs a tiny bootstrap script that fetches the main `.as` file.
   - The `.as` file is the program logic. It creates a body element, fetches the `.json` layout, and uses `render` to turn the JSON into real page elements. It then `attach`es to those elements by their `@id` to interact with them.
   - The `.json` file defines the page layout using Webson — a JSON format where keys like `#element` create HTML elements, `@id` sets attributes, `#content` sets text, `$Name` defines named components, `#` lists children, and any other key (like `padding` or `color`) is a CSS style.
   - This separation means the layout can be changed without touching the code, and vice versa.

   For CLI projects, explain that the `.as` file is a standalone script run from the terminal, and walk through what each line does.

8. **Explain the included editor.** The project directory includes `edit.html` and `code.as`, which provide a browser-based editor with syntax highlighting:

   - Start the dev server with `allspeak code.as 8080` (or any free port).
   - Open `http://localhost:8080/edit.html` in a browser.
   - The editor lets you open, edit, and save `.as`, `.json`, `.html` and other project files with colour-coded syntax highlighting.
   - The same server also serves the project files, so you can test GUI projects at `http://localhost:8080/<project>.html` on the same port.

9. **Ask what they'd like to build.** From here, just respond to what the user wants.

---

**If `.allspeak-init` DOES exist**, skip initialisation and proceed normally. Read `.allspeak-init` to learn the project name and type.

---

## CLI template

```
!   <project>.as

    script <Project>

    variable Message
    put `Hello from <Project>` into Message
    log Message

    exit
```

## GUI template

A GUI project uses three files:

- **`<project>.html`** — minimal HTML launcher
- **`<project>-main.as`** — AllSpeak script (code)
- **`<project>.json`** — Webson layout (UI definition as JSON)

### `<project>.html`

```html
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><Project></title>
    <script type='text/javascript' src='https://allspeak.eclecity.net/dist/allspeak.js'></script>
</head>
<body>
    <pre id="allspeak-script" style="display:none">
    variable Script
    rest get Script from `<project>-main.as`
    run Script
    </pre>
</body>
</html>
```

### `<project>-main.as`

```
!   <project>-main.as

    script <Project>

    div Body
    variable Layout

    create Body
    rest get Layout from `<project>.json`
    render Layout in Body

    div Display
    attach Display to `display`
    set the content of Display to `Hello from <Project>`

    stop
```

### `<project>.json`

```json
{
    "#doc": "<Project> layout",
    "#element": "div",
    "@id": "page",
    "font-family": "sans-serif",
    "margin": "2em",
    "#": ["$Display"],

    "$Display": {
        "#element": "div",
        "@id": "display",
        "padding": "1em",
        "border": "1px solid #ccc",
        "min-height": "4em"
    }
}
```

**Webson keys:**
- `#element` — HTML element type (`div`, `button`, `img`, etc.)
- `@id`, `@src`, etc. — HTML attributes
- `#content` — inner text/HTML
- `#` — array of child element references
- `$Name` — named component definition
- All other keys are CSS styles

In all templates, replace `<project>` with the project name (lowercase for filenames) and `<Project>` with the capitalised project name.

---

## Important warnings — known limitations

### No inline arithmetic in conditions
You cannot do calculations inside a condition. Compute into a temp variable first:
```text
! WRONG — won't compile
while Divisor times Divisor is less than N begin ... end

! RIGHT — compute first
multiply Divisor by Divisor giving Square
while Square is less than N begin ... end
```

### No modulo operator
AllSpeak has no modulo/remainder operator. Compute the remainder manually:
```text
! Remainder = Candidate - (Candidate / Divisor) * Divisor
put Candidate into Quotient
divide Quotient by Divisor
multiply Quotient by Divisor giving Temp
put Candidate into Remainder
take Temp from Remainder
```
Division is integer (truncated), so this works correctly.

---

## Strict syntax guardrails

- Declare variables one per line — no comma declarations.
- Declare variables before use.
- Loops: `while ... begin ... end` — never `end while`.
- Conditionals: `if ... begin ... end` — never `end if`.
- `begin ... end` blocks must belong to a control statement.
- No `function`, `end function`, `define`, `end define`, `otherwise`, `endif`.
- No callable form `Name(...)` — use `gosub Label` and `return`.
- Assignment: `put ... into Name`.
- If unsure about a command, **ask before writing code**.
- Strings use backticks: `like this`
- Comments start with `!`
- Every script starts with `script ScriptName`
- DOM elements must be declared before use (e.g. `div X`, `button Y`, `input Z`)
- **No implicit precedence in `cat` chains.** Break complex expressions into separate steps.

## Quick reference

```text
! Comment
script Name

variable V          ! general-purpose variable

put 0 into V
add 1 to V
take 1 from V
multiply V by 2
put `hello` into V

if V is 3 begin ... end
while V is less than 10 begin ... end

Label:
    gosub DoWork
    stop

DoWork:
    return
```

## Error handling

```text
! Per-command: catch a single command's failure
rest get Data from `/api` or begin
  put the error message into Status
end

! Block-scoped: catch any error in the block
try
  divide Total by Count
or handle
  put the error message into Status
end
```

## GUI-specific (JS/browser)

```text
div Element
button Btn
input Field
img Picture

attach Element to `dom-id`
create Element in Parent
set the content of Element to `text`
set style `color` of Element to `red`
on click Btn gosub HandleClick
rest get Var from `/api/data`
log `message`           ! browser console
alert `message`         ! browser dialog
```

## CLI-specific (Python)

```text
get Var from url `https://example.com/api`
put json StringVar into DictVar
put entry `key` of DictVar into Var
exit
```

## Language extension policy

If a needed construct does not exist in AllSpeak, **do not invent syntax**. Instead, pause and propose a new command to the user, keeping it consistent with AllSpeak's English-like style.
