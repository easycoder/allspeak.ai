# Agent Entry Instructions

Any AI agent working in this repository must read the onboarding files before making changes.

Required first read:
1. `AI/README.md`
2. Follow the mandatory order listed there, starting with `AI/ALLSPEAK_CODING_GUIDELINES.md`.

If the task is to get oriented rather than to change something, read `resources/md/ai-article.md` first: it is the project's quick brief — what AllSpeak is, how the two runtimes and the editor fit together, and the review workflow everything else serves.

Working rule:
- Treat `AI/ALLSPEAK_CODING_GUIDELINES.md` as required policy for AllSpeak and Webson implementation choices.

---

# AllSpeak Project — Claude Context

## What is AllSpeak

AllSpeak is a multilingual scripting engine forked from EasyCoder. Where EasyCoder uses English-like syntax, AllSpeak's goal is to let users write scripts in **any human language** — English, French, Japanese, Arabic, etc. — while sharing a single language-neutral runtime.

Scripts use the `.allspeak` extension. The name "AllSpeak" references the Marvel Comics Asgardian ability to communicate in any language.

## Origin

Forked from [EasyCoder](https://github.com/easycoder/easycoder.github.io) on 2026-04-06. The entire EasyCoder codebase was copied and globally renamed:
- `EasyCoder` → `AllSpeak`, `easycoder` → `allspeak`, `ec_` → `as_`, `.ecs` → `.as` (the source extension is now `.allspeak` — see below)

The original EasyCoder repo continues unchanged as the stable English-only product.

## Repository Structure

```
/js/allspeak/      JS runtime source (Core.js, Browser.js, Compile.js, Run.js, etc.) + language packs
/js/plugins/       JS plugin modules (codemirror, svg, gmap, ui, asviz, webson, etc.)
/deploy/dist/      Build output — do not edit directly; produced by ./build-allspeak
/allspeak-py/      Python implementation (CLI + desktop); language packs mirrored as JSON
/spec/             Language and plugin contracts, opcodes, versioning policy
/conformance/      Cross-implementation test suite (.allspeak tests + expected JSON output)
/vendor/           Third-party libraries (showdown, codemirror)
/resources/        Website assets; resources/md/ holds the article material
/codex/<lang>/     Tutorial curriculum (codex/<lang>/code/step*.allspeak) per language
/learn/<lang>/     Language reference and idiom collections, per language
/starter/<lang>/   Source for the per-language AI-agent starter packs
/tools/            Doc-block analysers and other dev scripts
/primer/           Primer materials for AI-assisted project starts
/examples/         Demo apps
```

### Canonical source — this repo owns these files

This repository is the **primary source of truth** for the JS runtime (`js/allspeak/`), the editor (`asedit.allspeak`), the doc-block analysers (`tools/asdoc-check*.py/.allspeak`), and the learning material (`learn/`). Other projects may mirror or symlink these files locally (e.g. the doclets project symlinks `allspeak-js/*.js` here via `relink-allspeak.sh` and keeps copies of `asedit.allspeak` / `asdoc-check.py`).

- Make changes to shared files **here first**, then let consumer projects pick up the mirror.
- **A tool that an agent can use to speed development or improve reliability is published, not shipped in the packs.** `https://allspeak.ai/code/tools/` carries seven of them: the analyser (`tools/asdoc-check.py`), the visualiser's own instruments (`tools/plotview-check.js`, `tools/viz-align-measure.py`), the two recorder checks (`tools/guard-check.js`, `tools/capture-check.js`) and the two runtime checks (`tools/encoding-check.js`, `tools/flush-check.js`). An agent working in a project fetches the one it needs — into its own scratch directory, not into the project — and each starter `AGENTS.md` says so. **The list is `./build-starters`' loop, not this sentence**: that script fails if one of them has gone missing from this repository, and `./deploy-allspeak`'s `cp` line is what publishes them — one set, current for every project, instead of a copy per pack that goes stale unannounced. (This replaced the rule that they ship *in* the packs, which is what made a superseded check possible to run without anything noticing.)
- **A tool that needs this repo's sources has to say so.** The starter packs are clients of the CDN, not checkouts, so they carry no `js/` — which means a tool that runs the runtime (the Graph pane's harness, for one) cannot work from a pack, and should fail with that sentence rather than a missing-file stack trace.
- **`various/` is gitignored, so it is not a home for anything that has to travel.** Dev rigs that answer *this* repo's questions live there; a tool worth keeping or shipping belongs in `tools/`.
- **Never "fix" a shared file in a consumer project's copy** — that silently forks the mirror and the divergence is hard to spot later.
- If you're working in a consumer project and need a change to a file this repo owns, switch to this repo (a separate agent session anchored here) rather than editing the copy in place.

## Working in non-English languages (FR / IT / DE / …)

When writing or debugging `.allspeak` scripts in a non-English language, the English-only utility scripts (`server.allspeak`, `asedit.allspeak`) are **not** a reliable vocabulary reference. Use these instead:

- **Canonical keyword/token map per language:** `js/allspeak/LanguagePack_<lang>.js` — e.g. `LanguagePack_fr.js`, `LanguagePack_it.js`, `LanguagePack_de.js`. Each entry lists the keyword, its grammar patterns, and accepted spelling variants (with/without accents).
- **Idiomatic working examples:** `codex/<lang>/code/step*.allspeak` — full tutorial scripts already written in the target language.

Note: the `patterns` strings in language packs are descriptive hints, not strict grammars. The compiler in `Core.js` may accept tokens not listed in a pattern (e.g. `attends N millis` works in French even though `millis` isn't in the FR `wait` pattern, because `Core.js` `Wait.compile` reads the scale word loosely). When in doubt, check the relevant `compile:` function in `Core.js`, then confirm with a working example under `codex/<lang>/code/`.

Don't ask the user for the equivalent of an English keyword in another language — look it up in the language pack first.

## Architecture — The Multilingual Goal

The key architectural challenge is separating **language-neutral runtime** from **language-specific front-ends**.

### What is language-neutral (the engine)
- Runtime execution: `Run.js`, `Value.js`, `Condition.js`, `Compare.js`
- DOM/browser interaction: `Browser.js` (the runtime parts)
- Data handling: `JSON.js`, `REST.js`, `MQTT.js`, `Webson.js`
- Plugin execution logic

### What must become language-specific (the front-ends)
- Keyword definitions and grammar patterns in `Core.js` and `Browser.js`
- The compiler/parser: `Compile.js`
- Error messages
- Plugin keyword definitions

### Design
- **Declarative language definitions** — each human language maps its keywords/grammar to the internal command set via a language-pack file (`js/allspeak/LanguagePack_<lang>.js`, mirrored as JSON for Python under `allspeak-py/allspeak/languages/<lang>.json`).
- **Table-driven compilation** — the compiler resolves source tokens through `AllSpeak_Language.word()` / `reverseWord()` rather than hardcoding English keywords. `Core.js`, `Browser.js`, and `Compile.js` all go through this layer.
- **One runtime, many front-ends** — a French `.allspeak` script and an English `.allspeak` script compile to the same internal representation and run on the same engine.

### Current state
The JS multilingual layer is implemented and in active use: language packs ship for EN, FR, IT, and DE, and the JS runtime resolves keywords through the language layer throughout. The Python runtime has the same loader (`as_language.py`) and JSON packs, but i18n coverage is incomplete — see the project memory notes on Python and JS i18n gaps for known issues.

## Two Implementations

| | JS | Python |
|--|--|--|
| Source | `/js/allspeak/` | `/allspeak-py/allspeak/` |
| Build output | `deploy/dist/allspeak.js`, `deploy/dist/allspeak-min.js` | pip package |
| Runtime | Browser | CLI |
| Core files | `Core.js`, `Browser.js`, `Compile.js`, `Run.js`, `Main.js` | `as_core.py`, `as_compiler.py`, `as_program.py` |

Both implementations have the multilingual layer wired in (loader + language packs), but JS is where the work is most complete; Python lags and has known i18n gaps. JS is the primary focus.

## Build System

See [BUILD.md](BUILD.md) for the "edited X → run Y" lookup table covering all four dev scripts (`build-allspeak`, `sync-language-packs`, `build-starters`, `deploy-sync`) and the GitHub deploy workflow.

`./build-allspeak` concatenates the JS runtime into `deploy/dist/allspeak.js` and minifies to `deploy/dist/allspeak-min.js`. Bundle order: `Core.js` → `Browser.js` → `MarkdownRenderer.js` → `Webson.js` → `JSON.js` → `MQTT.js` → `REST.js` → `Compare.js` → `Condition.js` → `Value.js` → `Run.js` → `Compile.js` → `Main.js` → `AllSpeak.js`. **Never edit anything under `deploy/dist/` directly** — it is build output, and the rolling CDN path `https://allspeak.ai/dist/allspeak.js` is served from it.

## Versioning

Date-time-based: `YYMMDDHHMM` (e.g. `2605101119` = 2026-05-10 at 11:19). Set in `js/allspeak/AllSpeak.js` line 1. Same format used for commit messages — see below.

## Key Conventions

- Scripts are embedded in HTML inside a `<pre id="allspeak-script">` element
- Runtime loaded as `allspeak.js` or `allspeak-min.js`
- Plugins loaded separately from the `plugins/` path served alongside the runtime
- Each plugin follows the contract in `/spec/allspeak-plugin-contract.md`

## Doc blocks — required for new `.allspeak` code

Every section of new `.allspeak` code must be wrapped in a doc block:

    !! A brief synopsis, and it is the section's title.
    !!
    !! What this section does and why it exists. One paragraph = one line;
    !! a bare `!!` line separates paragraphs.
    SomeLabel:
        ! the code
        return
    !! @hash <managed>      ← inserted by the analyser (don't write by hand)
    !! @verified <managed>  ← set by a reviewer's sign-off
    !!!                     ← required terminator (three bangs)

**A block contains its code.** The first line is its **title**, which is what the
Blocks view lists down the left, so it must be a short synopsis and not the
opening paragraph of the prose — `tools/asdoc-check.py` warns past 100
characters. The `@` attributes and the `!!!` are the block's **tail**, so they
come *after* the code: a terminator written before its code closes the section
early, the editor shows a block with no script under it, and the code falls
through the gap. The analyser reports that as `code-outside-section`.

Rules:
- Lead with the **why** or the design constraint, not a paraphrase of the code.
- **Use the convention properly or not at all.** A file with no doc blocks is opt-out and says nothing either way; a file that has one must keep to the convention throughout, because half a file of blocks is what makes the editor's view misleading. Existing files that break this are being fixed as they are found — `python3 tools/asdoc-check.py <path>` lists them.
- **One paragraph = one line.** Each paragraph of prose is a single `!! ...` line, however long. Bare `!!` separates paragraphs. Don't insert hard line breaks for visual wrapping — they render badly in Blocks mode (which word-wraps the doc pane) and they fight you when editing. The flat-mode editor will show very long source lines; that's accepted, since the prose is meant to be read in Blocks mode and AI tools don't care about line length.
- Don't start a prose line with `@hash` or `@verified` — the parser treats those as metadata. Quote them ("@verified") if you must mention the names.
- After any code change inside a block, refresh hashes with `python3 tools/asdoc-check.py --write <file>`. Verifies that go stale show up as warnings — review the change and re-verify (asedit's Blocks mode has a one-click "Mark verified" button).

Both implementations of the analyser validate the same convention:
- `tools/asdoc-check.py` — Python CLI, recursive over a directory
- `tools/asdoc-check-cli.allspeak` — runs under the Python AllSpeak runtime
- (browser-side parsing also lives inline in `asedit.allspeak` for the editor)

Spec & history: `prompt-260509.md`.

## Code review while documenting

When adding doc blocks to existing code, treat it as a review pass, not just a documentation pass. While reading each section closely enough to write its prose, also surface anything that looks off:

- **Unreachable symbols** — subroutines or labels with no caller; variables declared but never assigned, or assigned but never read.
- **Dead code** — branches that can never be taken; lines after an unconditional `stop`/`exit`/`return` that nothing jumps to.
- **Suspicious patterns** — duplicated logic that might want consolidating; hardcoded values that look like they should be variables; hidden coupling between sections (one writes a global the other quietly depends on).
- **Doc/code disagreement** — comments, names, or nearby docs that contradict what the code actually does.

Surface findings as a short list at the **start** of your response, separately from the doc-block edits. Don't silently fix them — let the user decide.

The point of the doc-block convention is to force close reading; reporting what that reading turned up is the natural payoff.

## Diagnostics while debugging

Reach for a log before reaching for a theory. `log` writes to the browser console, and the same line prints in the terminal runtime, so a script can tell you what it is actually doing rather than what you assume it is doing.

The reason to prefer a log over a dialog box is not that it is cheap — it is that it is **copyable**. A copied line can be quoted into a conversation, a bug report or a commit message, compared against earlier output, and read by somebody else; a dialog box leaves you to paraphrase it from memory, and that is where wrong ideas take hold. A stuck afternoon usually ends the moment the numbers become copyable.

Be liberal with them, and cheerful about intrusive ones — they are not permanent. Remove each one once the question it was asked has an answer, and have each line name its own subject (`records: 8  flags: 1`) so the copy still makes sense on its own.

## Traps worth knowing before editing

Standing knowledge rather than next steps, which is why they live here and not in `TODO*.md`. Every one of these has cost real time in this project.

- **`or` on a `rest get` stops the thread.** The rest of the section is abandoned; use `on failure` to continue.
- **`element N of X` parses the whole array, and stringifies the element it returns.** A json variable is
  held as *text*, so every indexed read is `JSON.parse(<the whole array>)[N]` — plus `JSON.stringify` when
  the element is an object, which every trace record is. Measured 2026-10-06 on a 435 KB recording (2,300
  anchor/transfer records): **~15 ms per access**, so `~35 s` for one loop over the recording, and the
  visualiser's pane walks it several times a draw. **Any loop over a json array is therefore quadratic in
  what it walks**, and the two things that follow from it are worth the sentence: a recording has to be
  *read once* and a filtered copy *cached* (`json add` parses and re-stringifies the array it appends to,
  so building that copy one record at a time is quadratic as well), and in the visualiser the **number of
  records walked** is the cost that matters, not the number of marks drawn — which is why the clip is the
  only lever the language offers and why a gesture that walks the whole recording cannot be made quick by
  drawing fewer marks.
- **A status code does not mean the file arrived.** The dev server answers an unknown path with `200`, the editor's own page, and the MIME guessed from the extension — so a fetch checks its body for a leading `<`.
- **A variable must be declared before the statement that *writes* it**, not merely before the section that reads it: the compiler is single-pass. A declaration below the point where a handler is *registered* is not there yet.
- **A duplicate declaration is an error.**
- **`index X to N` selects a *slot*; `item N of X` reads from inside a JSON array.** `put V into item N of X` is not a valid target.
- **`cat`'s right-hand side is the whole rest of the expression.** `left 1 of X cat '.' cat right 3 of X` parses as `left 1 of (X cat '.' cat right 3 of X)`. Build it in steps.
- **A number that arrived as text stays text, and text compares lexically** — `9` is not less than `10`. Convert with `the value of`, or `add 0 to` when it is already in a variable.
- **A handler is registered by executing the line.** An `on message` written after the `stop` that ends a script's linear flow is never registered, and a check that calls the handler by name will not notice.
- **`svg` is the one element type the plugin registers without the `dom` extra**, so `the width of` will not compile for it — the pane maps the pointer from the panel's corner instead.
- **CORS on allspeak.ai is by file type:** `.js` and `.css` carry it, `.allspeak` does not, which is why the editor reaches a project as a script (`dist/asedit.js`) rather than a fetch.
- **Never redirect stderr on a check whose stderr is its verdict.**
- **A check on a boundary must carry what the boundary carries** — the JSON string, the registered handler — and set up what the real path sets up. Two green harnesses have sat over browser faults for want of this.
- **A value computed before the pass that measures it silently uses the previous draw's number.** The first render looks right and every later one does not.
- **An HTTP client's default charset is latin-1, not UTF-8.** `response.text` decodes a `text/*` response with the charset it declares and, with none declared — which is how a plain web server serves its own pages — assumes ISO-8859-1, so a UTF-8 page arrives with every accent and em dash doubled (`—` → `â€"`). The Python runtime's URL fetches now decode UTF-8 explicitly, like the browser's `fetch().text()` always did; `tools/encoding-check.js` holds that, and asserts its own premise (a response with no charset) before it asserts anything about the runtime.
- **An `attr` record exists only for a program the runtime *compiled*, so a marker must be read from the
  tokens.** The model reports the attributes it finds on the compiled program — so a script the runtime cannot
  compile yields **none**, and a script carrying `@py` is by definition one the JavaScript runtime cannot
  compile (`dictionary`, `list`). A tool that needs the marker, the editor included, must therefore be given it
  from the *token stream*: the model reports `flavour | py | from=script` for exactly this reason. Measured
  2026-10-05: `@py` on line 1 with `dictionary` at line 9 modelled to `commands=0` and no `attr` records at all,
  so the editor's Record fell through to the project's answer and refused a script it had been built to run.
  **The general shape: a reader that asks a compiled program about the source cannot see anything that stops it
  compiling — and those are exactly the things a tool is usually asked about.**
- **`set the content of` writes `innerHTML`, so a message meant for a person must not carry markup.** The
  Launch message told a reader the attribute to write as `add '@app <page>' on a line of its own`, and `<page>`
  was parsed as an HTML tag and never rendered — so what appeared was `add '@app ' on a line of its own`: the
  one thing the sentence exists for, silently gone. Measured 2026-10-05, from Graham's own status line. A
  **placeholder in angle brackets wants a concrete example instead** (`@app mypage.html`), which reads better and
  cannot be eaten. **And the check could not see it**: the harness's stub element stores the string it is
  assigned while a browser parses it, so an assertion on such a message has to be on what a reader *gets* —
  untested, the first version of the new assertion passed on the broken text (`@app \S+` matches `@app '`,
  because a quote is not a space).
- **`the text of` an element reads it by the *symbol's declared type*, not by the element's tag.** A `div` symbol takes `innerHTML.split('\n').join('')` — every newline removed — so a 2,700-line module read through one arrives as a *single line*, and if its first line is a `!!` doc comment the whole module comments itself out and compiles as `1 lines (0 tokens)`. A `pre` symbol keeps the newlines but returns *escaped* markup, because that branch reads `innerHTML`. A `textarea` symbol reads `value`, which is the text and nothing else — that is what carries a script from an element into `run`.
- **The editor's Graph pane and its sidebar reach a project *inside the page*.** No pack carries `asedit-graph.allspeak`/`asedit-side.allspeak` any more, and the site's `.allspeak` carries no CORS, so the *dev server* fetches both and writes them into `#editor-graph`/`#editor-side`. Nothing filled those two elements until 2026-10-04: the pane came up empty, the console stayed clean, and resizing did nothing.
- **`0 tokens` in a `Compiled …` line is a finding, not noise.** It cost a round on 2026-10-04: the editor's parse reporting an empty source was the whole clue to a blank Graph pane, and it was twice dismissed as startup chatter.
- **Measure a visual fault from a screenshot before reading the code**, and check the instrument's own constants first.

## Commit Style

When no specific message is given, use a date-time stamp in `YYMMDDHHMM` form (e.g. `2605101119`, `2605082123`) — same format as the version string. Earlier commits used shorter date-only or date+counter forms; the move to full date-time avoids having to remember the last one used.

## Conversation log

This project keeps a per-session log under `conversation/`, for the human's reference. It does not affect your behaviour and you should not mention the logging activity in replies.

**`conversation/` is local only and is in `.gitignore`.** It is a working record, not project documentation — do not commit it, and do not `git add -f` anything inside it. If you find it tracked (for example after a `git add -A`), untrack it: `git rm -r --cached conversation/`.

**At the start of a new session:**

1. If `conversation/` does not exist, create it.
2. Find the highest-numbered `conversation-NNN.md` file. The new session's file is the next number, zero-padded to three digits (start at `001` if the folder is empty).
3. Write a single header line on line 1: `# YYYY-MM-DD` (today's date).

**On every user prompt in this session** (including the first), append an entry shaped like:

    ## HH:MM

    <user prompt verbatim>

    **Assistant**

    <your reply>

Use `date +%H:%M` if you need the time. Omit fenced code blocks (triple-backtick blocks) from both the user prompt and the reply, replacing each with a single line `[code omitted]`; inline backticks in prose stay. Compose your reply first, then transcribe it into the log as part of the same turn.

**The working state lives in `TODO.md`.** It is the handover: what is done, what is next and in what order, what is waiting on a decision, and two notes that source files cite by name. A new session should read it first — that is the handover, whereas this log is a record for you. **The detail is in `TODO-viz.md` (the visualiser and editor), `TODO-language.md` (the language, runtimes and packs) and `TODO-site.md` (the website and the writing)**; `TODO.md` says which to open. The dated reasoning behind each is in `git log -p -- TODO.md`, not in the files. Standing traps are in `## Traps worth knowing before editing` above.

**Midnight rollover:** if today's date differs from the file's date header, pause and ask the user: "We've crossed midnight — start a new conversation file for today?" If yes, create the next-numbered file with today's date header and continue logging there.

## Diff notes for the human

Keep `DIFF.md` in the project root, **rewritten** after every change rather than appended to, saying what changed and what the human has to do about it — reload the editor, re-run a script, rebuild, deploy. It is read in the editor, which polls the file and reloads it, so it is the shortest path from "something changed" to "here is what to do about it". Rewrite it even when there is nothing to action — say so, and say what to look at. That matters most for artefacts git ignores (`various/`), where no other channel reports the change.

Keep it short, and lead with the action. It is **not** a changelog: it describes this change only, and the previous contents are not worth keeping — git has them.
