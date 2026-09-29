# Building Applications with AllSpeak and Agentic AI

*A practical approach to AI-assisted development that works for every level of programmer*

---

## Introduction

The rise of AI coding assistants has transformed software development, but it has also created a new problem: the gap between what the AI produces and what you can understand and maintain. "Vibe coding" — asking ChatGPT or Claude to write JavaScript, Python, or React for you — works for generating code, but leaves many developers stranded when it comes time to modify, debug, or understand what they've been given.

This article describes a different approach: using [AllSpeak](https://allspeak.ai) — a high-level, English-like scripting language — together with an agentic AI coding assistant: [Claude Code](https://claude.ai/claude-code), [Reasonix](https://reasonix.io), or any comparable tool. The combination lets developers of any experience level build real, working applications quickly, with code that reads almost like plain English.

---

## What is AllSpeak?

AllSpeak is a scripting language designed around readability. Instead of:

```javascript
document.getElementById('myButton').addEventListener('click', function() {
    document.getElementById('output').style.backgroundColor = 'pink';
});
```

you write:

```
on click MyButton
begin
    set style `background` of Output to `pink`
end
```

AllSpeak runs in two environments:

- **In the browser** — load a single JavaScript file and write scripts embedded in your HTML page
- **As a command-line tool** — install via `pip install allspeak-ai` and run `.allspeak` script files directly

Scripts use the `.allspeak` extension and require no build step, no package manager, and no compiler toolchain.

---

## The Problem with Vibe Coding

"Vibe coding" is the practice of prompting an AI to write application code in a mainstream language and accepting the result without fully understanding it. It is seductive — you describe what you want, the AI produces something that looks plausible, and you copy it in. But there are serious drawbacks.

**AI hallucination is amplified in complex languages.** JavaScript, TypeScript, Python — these languages have enormous surface areas. APIs change between versions, library names shift, browser behaviours vary. AI models frequently generate code that uses methods that don't exist, imports that fail, or patterns that were deprecated years ago.

**The output is often not what you asked for.** Complex languages allow many ways to solve a problem. The AI picks one, but it may not be the one you want, and understanding enough to redirect it requires the very expertise you were hoping to avoid.

**Dependency hell.** A React project might require dozens of npm packages. An AI-generated Python app might depend on libraries you don't have. Debugging installation failures is a poor use of anyone's time.

**You can't read it.** If the AI generates 200 lines of JavaScript with callbacks, closures, and async/await, you are trusting code you don't understand. When it breaks — and it will — you are helpless.

**Maintenance becomes expensive.** Today's vibe-coded application is tomorrow's legacy mystery. Nobody — not even the AI — can reliably modify code they didn't fully understand when it was written.

---

## Why AllSpeak + Agentic AI Works

AllSpeak changes the equation in four important ways.

**The language is simple enough that the AI rarely makes mistakes.** AllSpeak has a small, consistent vocabulary. Commands read like English sentences. There are no semicolons, no curly braces, no type declarations. Claude Code — the agent used for the examples in this article — generates correct AllSpeak on the first attempt almost every time, and when it doesn't, the error is obvious and easy to fix.

**You can read what the AI wrote.** This is the most important difference. Even a non-programmer can look at:

```
on click SaveButton
begin
    put the content of NameField into Name
    rest post Name to `/api/save`
    set the content of Status to `Saved`
end
```

...and understand exactly what it does.

**There is no build system.** Browser applications are a single HTML file and a script. CLI applications are a single `.allspeak` file. No `npm install`, no Webpack, no virtual environments to configure.

**The agent can modify the code it wrote.** Because AllSpeak scripts are concise and readable, an agent can re-read them and make targeted changes. This is fundamentally different from asking an AI to modify 500 lines of opaque JavaScript.

> **Key insight:** The limiting factor in AI-assisted development is not the AI's ability to generate code — it's the human's ability to understand, verify, and maintain what the AI produces. AllSpeak removes that bottleneck.

---

## What AllSpeak Is Best Suited For

AllSpeak is not a general-purpose replacement for Python or JavaScript. It occupies a specific and valuable niche.

**Ideal use cases:**

- **Internal tools and dashboards** — forms, data viewers, admin panels, status pages
- **Personal productivity apps** — note-taking, task lists, habit trackers, timers
- **Prototyping** — turn a concept into a working demo quickly, before committing to a full implementation
- **Educational applications** — where the goal is learning, and complexity in the tooling is a distraction
- **Automation scripts** — file processing, report generation, data transformation
- **Kiosk and display applications** — single-purpose browser apps with predictable, contained state
- **Glue code** — connecting APIs together, transforming data between formats

**Scaling up with scripts and plugins:**

AllSpeak applications are not limited to single scripts. A script can call other scripts, which can call further scripts, covering as large a domain as needed. This "script-calls-script" architecture means there is no practical upper limit on application complexity — only each individual script needs to be simple and readable.

Beyond this, AllSpeak supports **plugins** — extension modules that add specialised vocabulary for domains where the core language would be verbose or awkward. A plugin wraps complex functionality behind simple, English-like commands, much as the word "laser" lets you refer to a complex physical process without describing it every time. For example, an SVG plugin lets you write `svg circle` rather than manually constructing SVG DOM elements.

Plugins can be written by AI agents on an as-needed basis. They don't need central approval or registration — if your application needs a new capability, your agent can write a plugin for it and your scripts can load it immediately.

**Less suitable for:**

- Complex UI component trees (React/Vue-style architectures)
- Applications requiring deep OS integration

Note that performance-critical work can be handled by plugins. AllSpeak scripts manage the human-level logic — the flow, the decisions, the user interaction — while plugins encapsulate the messy detail in optimised native code. At the ridiculous extreme, an entire application could be reduced to a single command `doit`, but in practice the split falls naturally: readable scripts for the parts humans need to understand, plugins for the parts that need raw speed or complex low-level integration.

---

## Getting Started

### Install the Python runtime (for CLI applications)

```bash
pip install allspeak-ai
```

This installs the `allspeak` command. Test it:

```bash
allspeak
```

### For browser applications

No installation needed. Here is a complete working page:

```html
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <script src="https://allspeak.ai/dist/allspeak-min.js"></script>
</head>
<body>
    <button id="my-button">Click me</button>
    <span id="my-output"></span>

    <pre id="allspeak-script" style="display:none">
        script MyApp

        button ClickMe
        span Output

        attach ClickMe to `my-button`
        attach Output to `my-output`

        on click ClickMe
        begin
            set the content of Output to `Hello, World!`
        end
        stop
    </pre>
</body>
</html>
```

---

## Working with your AI agent

The examples in this article use Claude Code, Anthropic's agentic command-line tool. You install it once, then invoke it within any project directory:

```bash
npm install -g @anthropic-ai/claude-code
claude
```

![Claude Code terminal session](/ai-article/1%20claude-session.png)

When you give Claude Code a task, it reads your existing files, writes or modifies code, and explains what it did. For AllSpeak projects, a typical session might look like this:

**You:** "Add a button that fetches the current weather from this API and displays the temperature in the Output span."

**Claude Code:** *(reads your .allspeak file, adds the button declaration, the REST call, and the display logic, then explains the changes)*

Because AllSpeak scripts are short and readable, an agent can read the whole script in seconds and produce targeted changes without creating conflicts or unintended side effects.

### Other agents worth knowing about

Claude Code is the example used throughout this article, but nothing here depends on it: any agent that can read and write files in a project directory works the same way. [Reasonix](https://reasonix.io) is one worth knowing about. It is a single local engine with several ways into it — a terminal command (`npm install -g reasonix`), a desktop app, a browser, or an editor plugin — and the front-ends share that engine and its configuration, so a session started in one can be picked up in another. It uses DeepSeek's models by default and can be pointed at any OpenAI-compatible endpoint instead.

The desktop app is the part worth pausing on for this article's audience. Claude Code is a terminal tool, and the terminal is exactly where a reader who has never used one gets stuck — usually before the agent has done anything at all. Reasonix Desktop is the same engine and the same agent in an ordinary window, not a cut-down companion app: install it, click **Add new project**, point it at your project folder, and type what you want built. Given that the whole point of AllSpeak is to shorten the first step for people who are not programmers, an agent you can launch from a Start menu closes the loop.

---

## Building a Browser UI Application

Let's walk through building a simple note-taking application.

**Step 1: Create the HTML file.**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Notes</title>
    <script src="https://allspeak.ai/dist/allspeak-min.js"></script>
</head>
<body>
    <h1>My Notes</h1>
    <textarea id="editor" rows="10" cols="50"></textarea><br>
    <button id="save-btn">Save</button>
    <button id="load-btn">Load</button>
    <span id="status"></span>

    <pre id="allspeak-script" style="display:none">
        script Notes

        textarea Editor
        button SaveBtn
        button LoadBtn
        span Status
        variable Content

        attach Editor to `editor`
        attach SaveBtn to `save-btn`
        attach LoadBtn to `load-btn`
        attach Status to `status`

        on click SaveBtn
        begin
            put the content of Editor into Content
            put Content into storage as `my-notes`
            set the content of Status to `Saved`
        end

        on click LoadBtn
        begin
            get Content from storage as `my-notes`
            set the content of Editor to Content
            set the content of Status to `Loaded`
        end
        stop
    </pre>
</body>
</html>
```

![The notes application running in the browser](/ai-article/2%20note-taking-app.png)

**Step 2: Ask your agent to extend it.**

> "Add a character count that updates as the user types, shown next to the Save button."

The agent adds a few lines to the script:

```
        span CharCount

        attach CharCount to `char-count`

        on change Editor
        begin
            put the content of Editor into Content
            set the content of CharCount to the length of Content cat ` characters`
        end
```

That's the complete extension. No refactoring, no framework changes, no new dependencies.

---

## Building a CLI Application

The Python AllSpeak runtime runs `.allspeak` files from the command line. This is ideal for automation scripts, data processing tools, and personal utilities.

Here's a simple file-line counter:

```
    script LineCounter

    variable FileName
    file Lines
    variable Line
    variable Count

    put arg 0 into FileName
    if FileName is empty
    begin
        print `Usage: ec line-counter.allspeak <filename>`
        stop
    end

    put 0 into Count
    open FileName as Lines for reading
    while not at end of Lines
    begin
        read Line from Lines
        add 1 to Count
    end
    close Lines

    print FileName cat ` contains ` cat Count cat ` lines`
    exit
```

Run it:

```bash
allspeak line-counter.allspeak mydata.csv
```

Ask your agent to add filtering, CSV parsing, summary statistics, or output to a file. The script stays readable throughout.

---

## The AllSpeak Editor

For writing and editing AllSpeak scripts there is a dedicated web-based editor — **asedit** — included in the starter pack. It provides syntax highlighting, a file browser with directory navigation, multiple tabs, and auto-save — all running in your browser against a local file server.

![asedit editor with a file open and the file browser popup displayed](/ai-article/3%20scripted.png)

The screenshot above shows a script open in the editor — note the syntax highlighting — with the file browser popup in front, listing the available files in the project.

### Setup

The editor files (`edit.html` and `server.allspeak`) are included in the [starter pack](https://allspeak.ai/code.zip). Unzip into your project root. The editor script and UI definition are fetched automatically from GitHub when you open the page.

### Start the server

```bash
allspeak server.allspeak 8080
```

You should see:

```
AllSpeak dev server running on port 8080
Serving files from /your/project/directory
Press Ctrl+C to stop
```

### Open the editor

Navigate to:

```
http://localhost:8080/edit.html
```

Click **Open** to browse your project files and directories. Navigate into subdirectories, open files for editing. Changes are auto-saved every half second.

### Working with your agent alongside the editor

The recommended workflow is:

1. **Your agent** handles larger changes — creating new scripts, adding features, restructuring logic
2. **The editor** handles smaller edits — tweaking values, fixing typos, reading through the code

Because both work on the same files on disk, they complement each other naturally. The agent saves a change, and the editor picks it up and reloads automatically.

---

## Setting Up a Client/Server Application

For applications that need to read from or write to the server (rather than just using browser localStorage), you need a server that provides `/read/` and `/write/` routes. The `server.allspeak` server already provides exactly this — it acts as both the editor's file server and as a general-purpose backend for your applications.

### Routes provided

| Route | Method | Description |
|-------|--------|-------------|
| `/list/<path>` | GET | Returns a JSON array of entries (files and directories) at the given path |
| `/read/<path>` | GET | Returns the contents of a file |
| `/write/<path>` | POST | Writes the request body to the file |

### Saving data from the browser

```
    variable UserData

    put the content of FormField into UserData
    rest post UserData to `/write/userdata.txt`
    set the content of Status to `Data saved`
```

### Loading data from the server

```
    variable Config

    rest get Config from `/read/config.json`
    json parse Config as Settings
    put property `theme` of Settings into Theme
```

### Handling failures gracefully

```
    rest get Config from `/read/config.json` or
    begin
        set the content of Status to `Could not load configuration`
        stop
    end
```

The `or` clause runs if the request fails — for any reason. No try/catch, no promise chains, no error callback functions.

---

## Inside asedit: an editor built for review

asedit is worth understanding how it is built, because nearly every decision in it follows from a single purpose — **reviewing code written by an AI, as much as writing it**. That purpose explains what the editor does, and, more tellingly, what it refuses to do.

### Purpose: review first

asedit has tabs, a file browser with directory navigation, find, syntax colouring, auto-save, and Blocks mode. That is the whole feature list. There is no git integration, no debugger, no test runner, no package manager, no autocomplete, no build step, and no settings file.

The absences are the design. Each of those is something that would have to be learned, and the person this editor is for has just asked an agent to write them a program and now wants to know whether the program is right. In that moment an extra panel is not a convenience; it is one more thing standing between the reader and the code. The tool that gets used is the one whose learning curve ends at "click Open, click Blocks".

Tabs and the file browser exist because a project is more than one file. Find exists so you can follow a variable across a script. Auto-save exists so there is no save button to forget. Everything else is Blocks mode, which is what the editor was built around, and which the second half of this section is about.

### Architecture: AllSpeak on both sides

The editor is itself an AllSpeak application, split the way any AllSpeak application is:

| Piece | Runtime | Role |
|---|---|---|
| `edit.html` | — | About fifty lines of bootstrap: fetch the UI and the script as text, load the runtime and plugins, call `AllSpeak_Startup()` |
| `asedit.json` | — | The Webson layout — the fixed shape of the page |
| `asedit.allspeak` | JS, in the browser | ~1500 lines: the editor's entire behaviour |
| `server.allspeak` | Python, on your machine | ~200 lines: serves the project files and the editor |

One language, two runtimes, two processes. The browser half runs on the same JavaScript runtime as the applications this editor is used to write; the server half is an ordinary AllSpeak script using the `server` plugin.

`server.allspeak` exposes the three routes described in the previous section — `/list/<path>`, `/read/<file>`, `/write/<file>` — plus two of its own: `/version`, which reports whether a newer editor has been published, and `/restart`, which re-execs the server process. It also serves static files, and it is short enough to read in one sitting, which matters, because it is the thing holding write permission on your project.

Two properties follow from "the editor is an AllSpeak script".

**The editor is its own worked example.** `asedit.allspeak` is written under the documentation convention from end to end — 22 doc blocks across 1500 lines — and it is reviewed in the Blocks mode it implements, which also makes it the largest script in the project that follows the convention. If you want to show an agent what the convention looks like at scale, that file is the reference. (`server.allspeak`, by contrast, has no doc blocks at all: the convention is adopted file by file, and that file hasn't been.)

**There is no build step.** `edit.html` fetches `asedit.json` and `asedit.allspeak` as text, hands the markup to the Webson renderer and the script to the runtime, and that is the whole apparatus. Compilation takes tens of milliseconds in the browser. Changing the editor is editing a text file and reloading the page — and, as described below, the editor will even pick up its own updates without you doing that.

### CodeMirror does the text, AllSpeak does the behaviour

The text editing is [CodeMirror](https://codemirror.net/5/) 5.46, loaded from a CDN with its `dialog`, `search` and `jump-to-line` addons. AllSpeak reaches it through a small plugin (`js/plugins/codemirror.js`, about 300 lines) that exposes a script-level vocabulary:

```
codemirror init basic profile <script>      ! load CodeMirror, optionally a mode definition
codemirror attach to ContentEditor [mode ecs]
codemirror get content of ContentEditor into Content
codemirror set content of ContentEditor to Source
codemirror get cursor of ContentEditor into Line
codemirror scroll to line 200 in ContentEditor
codemirror find in ContentEditor
```

The plugin is thin on purpose. AllSpeak never touches CodeMirror's JavaScript API; it asks for a buffer, sets one, reads a cursor position, scrolls to a line. Everything interesting — the parser, the block states, the panes, the file protocol — is written in AllSpeak on top of those half-dozen verbs. This is the standard plugin pattern: wrap a substantial JavaScript library, give it a script-friendly vocabulary, and keep the application logic in the readable language. The editor's whole behaviour fits in 1500 lines because none of it is DOM plumbing.

### Colour-coded source, without a keyword table

Syntax colouring is where the multilingual design shows through most neatly. The CodeMirror mode for AllSpeak (`js/plugins/codemirror-ecs.js`) is **63 lines**, and it does not contain a keyword list. It colours tokens by *shape*:

| Token | Role |
|---|---|
| `` `...` `` | string |
| `!` to end of line | comment |
| A capitalised word (`ContentEditor`, `TabSaved`) | symbol / variable |
| Digits | number |

That is all of it. Every keyword, in every supported human language, is left unstyled and reads as an ordinary word — which is correct, because in AllSpeak the keywords *are* ordinary words. `put`, `mets`, `metti` and `lege` are the same instruction, so a mode that coloured keywords would have to be rewritten for each language, and would quietly make a French script look like a different kind of program from the English one that compiles to identical bytecode.

The trade is real: an AllSpeak script looks plainer than a JavaScript file. In exchange, the highlighting is language-neutral in exactly the way the runtime is, and adding a human language to AllSpeak costs nothing here. The one coloured token that carries meaning is the capitalised symbol — because that is what a reviewer scans for.

Modes are pluggable, so this is not a dead end: `codemirror init basic profile <script>` loads a mode definition from a URL and `codemirror attach to X mode <mode>` uses it, which is how another CodeMirror mode — for JavaScript or Python — could be dropped in without touching the editor's logic.

### Two-way updating: the file on disk is the interface

What lets the editor sit alongside an agent is that it treats the file on disk as the shared state and keeps both directions in sync continuously. Three loops do it.

**Outward, every 500 ms.** A per-tab copy of the last content written to the server is kept. Every half second the editor compares the buffer to that copy and, if they differ, POSTs the buffer to `/write/<path>`. There is no save button: saving is a background process, and the only sign of it is a brief "Saved" in the status bar.

**Inward, every 3 seconds.** The editor re-reads the active file from `/read/<path>` and compares it with what was last saved. There are three outcomes, and the distinction between them is the whole point:

- **Disk changed, editor clean** — the file was changed by something else and the buffer has no unsaved work, so the editor reloads silently and says "Reloaded". This is the agent writing a change and the human watching it appear.
- **Disk changed, editor dirty** — the editor *does not* clobber the buffer. It reports "External change detected" and leaves the resolution to the human, who can copy out what they need and reload. Silent last-writer-wins would destroy work; the editor declines to guess.
- **Nothing changed** — nothing happens.

**Itself, at startup.** The editor asks `/version`; if a newer `asedit.allspeak` has been published since the copy on disk, it offers to restart, and `/restart` re-execs the server so the next page load fetches the new code. The server makes the same check for its own files when it starts, comparing a `.code-version` stamp against the published one. This is a development tool that is being changed while people are using it, so the update path is part of the tool rather than an instruction in a README.

There is one exception. **Blocks mode suspends the inward poll**, because inside Blocks mode the parsed section array is the source of truth and the CodeMirror buffer is being rebuilt from it; a silent reload part-way through would clobber the pane edits. The editor waits until you leave Blocks mode. This is the kind of thing that is invisible until it eats half an hour of somebody's work.

### Could it edit languages other than AllSpeak?

That is two different questions with two different answers.

**Other human languages: yes, already.** The editor's own interface is localised into English, Italian, French and German. `edit.html` carries a hidden `<div id="editor-lang">en</div>`; the script reads it and selects a string table for the Open / Find / Close / Saved / error messages. The per-language starter packs ship the div pre-set. The file browser also lists ordinary project files — `.allspeak`, `.md`, `.txt`, `.json`, `.html`, `.css`, `.js`, `.py` — not just scripts.

**Other programming languages: partly.** Flat mode will open any text file and give it the CodeMirror treatment: colouring by shape, find, tabs, auto-save. That is a perfectly usable small text editor, and with a mode profile loaded it would colour another language properly.

Blocks mode does not generalise, and it is honest that it does not. Its parser is hard-coded to the AllSpeak doc-block markers — `!!` to open, `!!!` to close, `@hash` and `@verified` as reserved metadata — the save-as prompt appends `.allspeak` to a new filename, and the unreachable-code analysis compiles the buffer as AllSpeak. Making Blocks mode work for another language would mean that language adopting the *same* documentation convention, and a parser for it that can compute a block hash over exactly the bytes being reviewed. Nothing about that is specific to AllSpeak as a syntax, but all of it depends on the code being written under the convention.

The fair summary: a general small text editor with one deep feature that exists only for AllSpeak — and the deep feature exists because AllSpeak code is meant to be reviewed by the person who asked for it, which is what makes the convention worth the effort.

### Blocks mode

Blocks mode is the reason the editor exists. Press **Blocks** and the page becomes two panes separated by a draggable divider — the doc-block prose on one side, the code it describes on the other — with one block shown at a time, prev/next buttons, a badge naming the block's state, and a sidebar listing every block in the file.

What makes it more than a preview is that it round-trips:

- **Entering** parses the buffer into parallel arrays: each block's start and end line, its prose, its verbatim code, its stored `@hash` and `@verified`, and two computed states — plus a parallel array of whatever text sits between blocks, so nothing outside a block is lost. The block containing the cursor line is opened, so you land where you were working.
- **While open** you edit both panes as ordinary text. The sidebar row for the current block is highlighted and scrolled into view.
- **Leaving, or moving to another block** flushes: the pane text is pushed back into the section arrays, that block's hash is recomputed, and the whole file is reassembled as `outside + block + outside + …` and written back into the CodeMirror buffer. The auto-save loop then persists it as usual. Returning to flat mode scrolls the editor to the block you were reading.

The file on disk therefore stays plain `.allspeak` source, exactly as an agent would write it. Blocks mode is a projection over that file, not a second format — which is what lets an agent and a human work on the same file without either needing to know about the other's editor.

The classifier inside the editor is the same one as the `tools/asdoc-check*` validators, duplicated rather than shared because one runs in a browser and one in a terminal. The doc-block *spec* is one source of truth; the code implementing it is two.

And the convention costs the language nothing. `!` already ends a line, so `!! ...` and `!!!` produce no tokens at all: the compiler never sees them, in either runtime. The markers are ordinary comments whose first character happens to be a second bang. That is why a documentation convention could be adopted without touching the compiler, the grammar, or any existing script.

#### Hashes: tying the prose to the code it describes

Each block carries two metadata values, and the difference between them is the core of the design.

`@hash` is a hash of the block's code text — SHA-256, truncated to eight hex characters, in both the browser editor and the Python CLI, so the two agree to the character. It is machine-managed: the analyser writes it, the editor recomputes it on every parse and every flush. Comparing the stored value against the current code gives a state.

| `@hash` state | Meaning |
|---|---|
| `fresh` | The stored hash matches the code below it — the prose was last written for *this* code |
| `stale` | The code has changed since the prose was written |
| `no-baseline` | There is prose but no hash yet |
| `no-code` | A prose-only block, such as the one describing the whole script |

`@verified` is a *human* claim, not a machine one: it stores the hash of the code at the moment a person read the prose and the code together and agreed they matched. That yields a second state — `verified-fresh`, `verified-stale`, or `unverified` — shown as a badge in the toolbar and as the colour of the block's row in the sidebar. Mark verified is one click per block and rewrites `@verified` with that block's current hash. There is a "verify all" button, but it asks for confirmation first, because it is a bulk self-attestation that would throw away the file's whole verification record in one misclick.

Two values rather than one, because they answer different questions:

- **`@hash` stale** asks: *has anyone looked at this prose since the code changed?*
- **`@verified` stale** answers the stronger one: *a person read these two together, and the code below has moved since.*

Neither prevents an edit. What they prevent is *forgetting* — the specific failure of AI-assisted development where the code is regenerated, the prose quietly goes on describing the previous version, and the documentation becomes worse than useless because it is confidently wrong. A stale hash is a small, local question — does this paragraph still describe this block? — and it is a question a non-programmer can answer, which is the whole point.

The convention is validated in three places: `tools/asdoc-check.py` (a Python CLI, recursive over a directory, with `--write` to refresh hashes and never touching `@verified`), `tools/asdoc-check-cli.allspeak` (the same logic running under the Python runtime), and asedit itself, in the editor, as you type.

#### Prose that describes the code, rather than restating it

Doc-block prose is written to rules that exist to stop it degrading into a paraphrase of the code:

- It leads with the **why** — the constraint, the invariant, what the block deliberately does *not* do, what was tried first.
- **One paragraph is one line.** Each `!!` line is one paragraph however long it is, and a bare `!!` is a paragraph break. There is no hard wrapping: the pane word-wraps for you, and wrapped source lines fight you when you edit the file flat.
- **The first sentence stands alone**, as the one-line summary the sidebar shows beside the code, so the reader meets a tight claim with the elaboration available below it rather than a wall of text.
- The prose is plain text — no markup, no HTML, no formatting syntax — so it reads identically in the editor, in the CLI analyser, in a `diff`, and in a terminal.

`@hash` and `@verified` are reserved metadata tokens, and a prose line may not begin with them, or the parser would eat the prose as metadata. Doc blocks do not replace `!` comments; both are present. `!` remains for line-level notes, where a block-level explanation would be disproportionate.

One rule attaches the convention to reality rather than to good intentions: **a file with any doc block is expected to be covered end to end.** A file with none is treated as opting out, with no warnings — so the convention can spread file by file without a flag day — but once a file has one block, unwrapped sections in it are reported. Half-documented is the state the convention exists to prevent.

#### Validation, block by block

In Blocks mode the unit of review is the block, and the editor's job is to make the state of every block readable at a glance without opening it. The sidebar carries one row per block, and each row's colour and tooltip are decided together, so a row can never show a state without saying what it means:

| Row | Meaning |
|---|---|
| Blue | The block you are reading |
| Green | Verified, and the code has not changed since |
| Amber | Verified once, but the code has changed since — worth a look |
| Grey | Not yet verified |
| Red | **Orphaned** — nothing enters this block, with a struck-through label and a tooltip saying so |

That last one is the interesting case, because it is a *code* defect rather than a documentation one. On each parse the editor hands the buffer to the `asviz` plugin — the same static analyser the visualiser uses — which compiles the script without running it and derives enough of the control-flow graph to say whether each label and loop is reachable. Any block containing an unreachable anchor gets the red row. Red therefore wins over the verification colour: an orphaned block shows as orphaned first, and its verification state second, because unreachable code is the more urgent fact. So a file opened in Blocks mode is simultaneously being checked for dead code, and an orphaned subroutine — the classic residue of a rewrite that moved a caller and left its target behind — appears as a red stripe in a sidebar rather than as a mystery months later.

The analysis is deliberately forgiving. A buffer mid-edit frequently does not compile, and then the plugin simply reports fewer records and the editor explains why in the status line. It never raises an error for it, because "your file is currently syntactically incomplete" is the ordinary condition of a file being typed into, not a fault. But it does say so — an analyser that silently reports nothing looks exactly like a file with nothing wrong in it, and that is the worse of the two failures.

#### Why the author still has to insist

The tooling can prove one thing and not the other. A hash can prove that prose was written against this code. Nothing can prove the prose is *true*, or worth reading.

`@verified` is where that distinction becomes visible in the workflow: it is a claim made by a person. Applied thoughtlessly — hitting "verify all" because the sidebar is full of amber — the file's verification record stops recording anything, and the discipline it supports is gone while the tooling still reports success. That is worse than having no convention, because the amber rows were the only signal that something was outstanding.

So the convention lives or dies on the reviewer insisting: that the agent writes prose leading with *why*; that a code change comes back with the prose reviewed; that a stale block is actually read rather than re-stamped. The editor makes the state of every block impossible to miss and cheap to check. It cannot want it for you. And the honest personal habit is to leave a block's hash stale until you have read it — stale records are not failures, they are the record working.

### Other things worth knowing

- **No build, and nothing to install beyond the runtime.** The runtime, the plugins and CodeMirror come from a CDN; the editor's own files are fetched as text. Nothing is compiled ahead of time, and nothing needs updating by hand.
- **The layout is declarative, the data is scripted.** `asedit.json` holds the fixed shape of the page — chrome, panes, buttons, divider — and the script creates the rows that come from data: the file list, the tabs, the block sidebar. The layout knows nothing about how many files there are. This split is worth copying for any AllSpeak screen with a list in it.
- **Find works in both modes, and searches the prose too.** In flat mode it is CodeMirror's dialog. In Blocks mode you select a term in either pane, press Find, and the editor walks forward through the blocks, wrapping at the end, to the first block whose *code or prose* contains it — so the documentation can be searched as a document.
- **The toolbar counts blocks** — "Block 7 of 23" — which is how a reviewer keeps track of how much of a file they have actually read.
- **The divider position is remembered** in browser storage, so a working layout survives a reload.
- **The editor is served with a cache-busting stamp** (`?v=<timestamp>`), because a stale cached copy of a thing that is being changed constantly looks exactly like a bug in that thing. If a change to the editor does not appear, check the fetch before the code.

---

## Comparing Approaches

| | Vibe Coding (mainstream) | AllSpeak + Agentic AI | Traditional Development |
|---|--------------------------|-------------------------|------------------------|
| **Time to first working app** | Minutes (but fragile) | Minutes (and readable) | Hours to days |
| **AI error rate** | High (complex syntax) | Low (simple syntax) | n/a |
| **Code readability** | Low | High | Varies |
| **Non-programmer can understand** | Rarely | Usually | No |
| **Ongoing maintenance** | Difficult | Easy | Depends on skill |
| **Dependencies** | Many | None | Many |
| **Build step required** | Often | Never | Usually |
| **Suitable for production** | Yes (with care) | Yes (scales via scripts + plugins) | Yes |

---

## Conclusion

The most effective use of AI in software development is not to generate code you can't understand — it's to generate code you *can* understand, so you can verify it, modify it, and maintain it with confidence.

AllSpeak gives the AI a language it can use without making mistakes, and gives you a codebase you can read, understand, and own. An agentic AI assistant — Claude Code, Reasonix, or whatever comes next — provides the capability to make meaningful changes to a working project, not just generate one-off snippets.

Together, they represent a practical middle path: not the complexity of full-stack development, and not the opacity of generated black-box code. Just working applications, written in something close to plain English.

**Where to start:**

- [AllSpeak Codex](https://allspeak.ai/codex.html) — interactive 20-part tutorial
- [AllSpeak Primer](/aidev/agent-primer-js.md) — practical reference for AI agents and developers
- [Claude Code](https://claude.ai/claude-code) — Anthropic's agentic CLI tool, used for the examples in this article
- [Reasonix](https://reasonix.io) — the same category of agent, as a terminal command or a desktop app
- [Starter pack](https://allspeak.ai/code.zip) — download, unzip, and start coding
- [AllSpeak website](https://allspeak.ai) — overview and documentation

**Get in touch:**

- [Discord](https://discord.gg/AhaJkJHr) — join the AllSpeak community
- Email: info@allspeak.ai