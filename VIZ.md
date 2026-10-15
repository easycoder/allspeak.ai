# Viz

*The AllSpeak editor and visualiser: what it is, where it sits, and what it does.*

Viz is the browser page you edit AllSpeak in, and the same page you review a run in. It is one
program with two halves, and they answer two different questions.

- **The editor** shows you a project and lets you change it — a file browser, tabs, find, syntax
  colouring and auto-save.
- **The visualiser** draws a *run* of a script as a picture, so you can see what the code did
  without reading all of it.

You usually meet both at once. You open viz, edit a script in one tab, press **Graph**, and read
the picture of the last run beside the code that produced it.

This document is the orientation: how viz fits the rest of AllSpeak, how it is split between a
server and a page, and what it can do. The deeper material lives elsewhere, and the last section
says where.

---

## Where viz fits

AllSpeak runs on two runtimes — JavaScript in the browser, and Python on the command line — and a
program is a set of `.allspeak` files. Viz is where you look at those files and, when a script has
been asked to record what it did, where you look at the record. It exists for the **review** half
of the workflow AllSpeak is built around: an agent writes the script, and a person has to be able to
tell whether the script is right.

Two facts about where it lives are worth holding on to.

**Viz is not part of your project.** A project holds its own code, its agent instructions and its
`.allspeak-init` file — and nothing else. The visualiser, its modules and the development server
are *fetched* when they are needed, so a project never carries a copy of the tooling that can go
stale. Everything a project runs is the current version.

**It is started with one command.**

```sh
allspeak viz
```

That starts the AllSpeak development server on port 8080 (or the port you name), serving the
directory you are in, and opens the visualiser in your browser. If a dev server is already running
on that port, the command opens the page and leaves the running server alone. `allspeak server`
starts the same server without opening anything, for when you want to open the page yourself.

---

## The server and the client

Viz is split across a page and a process, and the split is the clearest way to understand it: one
language, two runtimes, two processes.

| Piece | Runtime | Role |
|---|---|---|
| `viz.html` | — | The bootstrap page. Fetches the editor's own files as text, loads the runtime and its plugins, and starts the editor. |
| `viz.json` | — | The layout — the fixed shape of the page (chrome, panes, buttons, divider), as a Webson document. |
| `viz.allspeak` | JavaScript, in the browser | The editor's entire behaviour: tabs, the file browser, blocks, auto-save, and the wiring to every pane. |
| `server.allspeak` | Python, on your machine | Serves your project files and the editor, and runs a Python-side recording when asked. |

The browser half runs on the same JavaScript runtime as the applications viz is used to write. The
server half is an ordinary AllSpeak script using the `server` plugin. The file on disk is the
interface between them.

### What the server provides

Alongside serving static files from the project directory, the dev server answers a small set of
routes. They are the whole protocol between the page and the disk.

| Route | Method | Does |
|---|---|---|
| `/list/<path>` | GET | A JSON array of the files and directories at `<path>` — what the file browser reads. |
| `/read/<file>` | GET | The contents of a file. |
| `/write/<file>` | POST | Writes the request body to the file — this is what auto-save calls. |
| `/record/<script>` | GET | Runs a script under the Python runtime, records the run, and answers with the verdict. This is how a `@py` script — one the browser's runtime cannot run — is recorded. |
| `/version` | GET | Whether a newer dev server has been published than the one running, and therefore whether a restart would change anything. The page uses it to tell you when to restart; it never restarts the server itself. |
| `/<file>` | GET | Serves any other file — the pages and assets of your own project. |

### Two loops, and why there is no Save button

What lets viz sit alongside an agent is that both directions are kept in sync continuously, with
the file on disk as the shared state.

- **Outward, every half second.** Each tab keeps a copy of the last content written to the server.
  Every 500 ms the editor compares its buffer with that copy and, if they differ, writes the buffer
  to `/write/<path>`. There is no save button; saving is a background process, and the only sign of
  it is a brief *Saved* on the status line.
- **Inward, every three seconds.** The editor re-reads the active file and compares it with what it
  last saved. If the disk changed and the buffer has no unsaved work, it reloads silently and says
  *Reloaded* — this is the agent writing a change and you watching it appear. If the disk changed
  *and* you have unsaved edits, it does **not** overwrite your buffer: it reports *External change
  detected* and leaves the choice to you. If nothing changed, nothing happens.

### No build step

Nothing is compiled ahead of time. `viz.html` fetches `viz.json` and `viz.allspeak` as text, hands
the markup to the Webson renderer and the script to the runtime, and that is the whole apparatus.
Changing the editor is editing a text file and reloading the page.

### The companion modules

Three parts of viz are large, are needed only some of the time, and are therefore separate files
that viz brings in and compiles only when they are first wanted, and talks to by message from then
on.

- **`viz-graph.allspeak`** — the Graph pane itself: the picture of a run, its drawing, and its
  gestures.
- **`viz-side.allspeak`** — the sidebar beside the picture, whose tabs show what the pointer is on.
- **`viz-alert.allspeak`** — the panel that says what is happening and stays until it is read.

Splitting them keeps the editor from carrying the picture's weight until somebody opens a run, and
lets either side grow without the other's file growing with it.

---

## What viz does

The editor has three modes, and the toolbar switches between them. **Blocks** and **Graph** are
toggles: their label becomes **Edit** while their view is up, and the way back sits in the same
place whichever view you are in.

### Opening and editing

**Open** brings up a file browser over the page. It lists the project's directory, navigates into
folders and back to the root, and opens the file you pick. Anything text-shaped will open —
`.allspeak`, `.md`, `.txt`, `.json`, `.html`, `.css`, `.js`, `.py` — not just scripts.

Alongside it:

- **Tabs**, because a project is more than one file, with a **+** to start a new one.
- **Find**, so you can follow a variable across a script.
- **Syntax colouring**, and it is worth knowing how it works. The mode colours tokens by *shape* —
  a string is `` `backticked` ``, a comment runs from `!` to the end of the line, a capitalised
  word is a symbol or variable, digits are numbers. There is no keyword list, deliberately: in
  AllSpeak the keywords *are* ordinary words, and they are translated, so a mode that coloured
  keywords would have to be rewritten for every human language. A French script and its English
  twin look the same kind of program, which is the point.
- **Auto-save**, described above.

### Blocks mode — reading a script by its sections

Blocks mode is the reason viz exists. AllSpeak code is written under a documentation convention: a
block of prose wraps each section, says why the section exists, and carries two metadata values in
its tail. Press **Blocks** and the page becomes two panes with a draggable divider — the prose on
one side, the code it describes on the other — showing one block at a time, with previous/next
buttons, a badge naming the block's state, and a sidebar listing every block in the file.

The two metadata values are the heart of it.

- **`@hash`** is a hash of the block's code text. The analyser and the editor write it, and compare
  it against the current code to give the block a state: the prose is **fresh** against this code,
  **stale** because the code has changed since the prose was written, or has no baseline yet.
- **`@verified`** is a *human* claim, not a machine one. Mark verified records the hash of the code
  at the moment a person read the prose and the code together and agreed they matched. Where the
  hash detects change, `@verified` records judgement.

The sidebar colours each block's row by those states, and by one more: red means **orphaned** —
unreachable code. On every parse viz hands the buffer to a static analyser, which compiles the
script without running it and works out whether each label and loop can be reached at all. A
subroutine with no caller is the classic residue of a rewrite, and Blocks mode shows it as a red
row rather than as a mystery months later.

Editing in Blocks mode round-trips: the file on disk stays plain `.allspeak` source, exactly as an
agent would write it, and Blocks mode is a projection over it. That is what lets a person and an
agent work on the same file without either needing to know about the other's tool.

### Graph mode — the picture of a run

Press **Graph** and the editor draws the last recorded run of the open script. The picture has two
axes, and they are the two questions anybody asks of a program. Up the side is **what**: the parts
of the script, in the order the file lays them out. Along the bottom is **when**: not clock time,
but the order things actually happened in. Every mark in the picture is *this part of the program,
at this moment of the run*.

- **The grey bars are the program itself.** Each line of code is a bar from its first character to
  its last, so the bars' left edges are the block structure and their right edges are the lines'
  own ends. Documentation is blanked rather than drawn — the prose is longer than the code and would
  bury the flow — but a blanked line keeps its row, so the axis still numbers the file as the
  editor does. At low zoom the text is unreadable; zoom in and the source appears inside the bars.
- **The marks are the places a program can be watched from** — a labelled subroutine, a loop, an
  event handler, a `return`, and the recording markers — and a mark appears only where the run
  actually reached one. **Its colour is how busy that line is**, warming from blue through violet
  and magenta to red as the line is visited more often.
- **The vertical lines are the moments control stopped being linear** — a call, a jump, a return —
  drawn from the run, not inferred from the text.
- **The two scrollbars** are the window drawn as a proportion: a handle's length is how much of the
  run you are looking at, and its position is how far in you have gone.

The gestures are the ones an editor user already knows: the wheel scrolls, **shift-wheel** zooms
the lines, **control-wheel** zooms the steps, and a drag pans. A **clip bar** above the picture has
two markers you drag to keep just a range of the run — which is what you reach for when a recording
is large enough that a redraw takes seconds.

Right-clicking the picture opens a menu, and the sidebar beside it has three tabs, all of which
follow the pointer rather than sending you hunting for the code:

- **Doc block** — the prose for the section the line under the pointer belongs to.
- **Code** — that section's code, with the prose taken out and the pointed line picked out.
- **Values** — the values the script asked to have watched, at the arrival the pointer is in effect
  at, in a table so a name's column does not move as the values change.

The menu also carries a **Freeze** row, which holds the reading still while you look at it.

### Launch and Record

Two toolbar buttons connect an editor tab to a running program.

**Launch** opens the page a script names with `@app` — a script whose markers are reached by a
person clicking, rather than by the script starting, lives inside its own page.

**Record** produces a recording of the script in the open tab, and writes it beside the script as
`<script>.viz.json`. A script that names an app is handled the other way round: since its markers
are reached by clicking, viz opens that page instead, arms it from outside, and saves the recording
when the window closes. A `@py` script — one the browser's runtime cannot run — is recorded by the
dev server's Python side, via `/record/<script>`. The button reports a one-line verdict either way.

---

## Getting a run into the picture

The picture is drawn from a **recording**: a file holding what a run did. A script asks to be
recorded with two commands, which a user learns as two words.

```as
    viz start
    …
    viz stop
```

Between them, every visit the program makes to a labelled subroutine, a loop and a `return` is
recorded. Outside them nothing is recorded, and with no recorder attached the commands do nothing
whatsoever — a script carrying markers runs exactly like one that does not, which is what lets the
markers stay in the code as part of how the script explains itself. There are refinements (`once`,
`every`, `until thread`, `limit`, `on <label>`), but the two words are enough to start.

A pair of attributes alongside the markers says what is worth watching. `@show Total, Row` names
values to capture at an arrival, so a mark can show not just *that* a line ran but what it was
working on — that is what the sidebar's **Values** tab reads out. `@app parser.html` names the page
a script runs inside, which is what Launch opens and what tells Record how to treat it.

There are several ways to ask for a recording, and which one is right depends on who is asking:

- **From viz** — the **Record** button, above.
- **From the command line** — `allspeak --record=parser.viz.json parser H2O`.
- **From another script** — `record the script … giving …`, which runs a script of your choosing
  under a recorder and hands the recording back as text.
- **The flag file** — `touch thermostat.allspeak.record` beside a running service asks for a
  recording, and removing the file finishes and writes it. This is for a process you cannot
  restart, such as one you reach only over SSH. It is the Python runtime's own mechanism.

**The recording is a file, and that is the point.** It is written beside the script, named after it
with the extension and all (`thermostat.allspeak` records to `thermostat.allspeak.viz.json`), and
it can be read afterwards on a machine that has never run the program. It is a Chrome Trace Event
document — the format Perfetto and `chrome://tracing` read — so a trace is a portable, inspectable
piece of evidence rather than something that lives only while a debugger is attached. Both runtimes
write it, against one specification, so a recording made by Python can be drawn by the browser.

A recording reports what it amounts to in one line, and the line is the same sentence wherever it
is read — `12 visits in 1 window`, or `nothing recorded: the run finished without reaching a
marker`, or `stopped: <reason>`. And a recorder watches the program it is recording: a script handed
to the editor cannot hang the editor, so a runaway run is stopped and the recording says which
limit it hit.

---

## What viz deliberately leaves out

The absences are the design. Viz has tabs, a file browser, find, syntax colouring, auto-save and
Blocks mode — and it has no git integration, no debugger, no test runner, no package manager, no
autocomplete, no build step and no settings file.

Each of those would have to be learned, and viz is for the moment when somebody has just asked an
agent to write them a program and wants to know whether it is right. In that moment an extra panel
is not a convenience; it is one more thing between the reader and the code. The tool that gets used
is the one whose learning curve ends at *click Open, click Blocks*.

The same rule shapes the picture. It shows **flow, not data** — it knows a line ran and how often,
not what was computed — and the values it can show are the ones the script explicitly asked to
capture. It records **the run you made**: one input, one window, one recording, so a branch that
did not run this time is not a branch that cannot run. It says nothing about whether the code is
well designed, and it is not a replacement for a programmer.

---

## Language

The visualiser speaks the script's language. `viz.html` carries a hidden element naming the
editor's language, and the per-language starter packs ship it pre-set; the editor's own chrome —
Open, Find, Close, Saved and the error messages — is localised into English, Italian, French and
German. The provenance the recording carries is the author's own: anchor names are the author's
labels and doc-block prose is the author's text, so they arrive in the author's language already.
The pane's own labels and the sidebar's tab names are currently English.

---

## Where to read more

- [`why/article.md`](why/article.md) — the long-form case for the visualiser: why a picture of a
  run is worth having, and what it can and cannot catch.
- [`resources/md/ai-article.md`](resources/md/ai-article.md) — the project brief, with a worked
  description of viz's design and the review workflow it serves.
- [`learn/reference/23-recordings.md`](learn/reference/23-recordings.md) — the recording vocabulary,
  chapter and verse, including the routes and the guard.
- [`spec/viz-trace-format.md`](spec/viz-trace-format.md) — the trace file, field by field.
- [`spec/allspeak-plugin-contract.md`](spec/allspeak-plugin-contract.md) — how the plugins viz
  loads are written.
- [`TODO-viz.md`](TODO-viz.md) — what is still being built.
- [`AGENTS.md`](AGENTS.md) — how viz is put together internally, and the traps worth knowing before
  changing it.
