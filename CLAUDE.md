# AllSpeak Project — Claude Context

## What is AllSpeak

AllSpeak is a multilingual scripting engine forked from EasyCoder. Where EasyCoder uses English-like syntax, AllSpeak's goal is to let users write scripts in **any human language** — English, French, Japanese, Arabic, etc. — while sharing a single language-neutral runtime.

Scripts use the `.as` extension. The name "AllSpeak" references the Marvel Comics Asgardian ability to communicate in any language.

## Origin

Forked from [EasyCoder](https://github.com/easycoder/easycoder.github.io) on 2026-04-06. The entire EasyCoder codebase was copied and globally renamed:
- `EasyCoder` → `AllSpeak`, `easycoder` → `allspeak`, `ec_` → `as_`, `.ecs` → `.as`

The original EasyCoder repo continues unchanged as the stable English-only product.

## Repository Structure

```
/js/allspeak/      JS runtime source (Core.js, Browser.js, Compile.js, Run.js, etc.)
/js/plugins/       JS plugin modules (ui, svg, gmap, mqtt, etc.)
/dist/             Build output — do not edit directly
/allspeak-py/      Python implementation (not yet adapted for multilingual)
/spec/             Language and plugin contracts
/conformance/      Cross-implementation test suite (.as tests + expected JSON output)
/vendor/           Third-party libraries (showdown, codemirror)
/resources/        Website assets (carried over from EasyCoder, to be pruned)
/codex/            Tutorial IDE (carried over, to be adapted)
/examples/         Demo apps (carried over)
```

## Working in non-English languages (FR / IT / DE / …)

When writing or debugging `.as` scripts in a non-English language, the English-only utility scripts (`server.as`, `asedit.as`) are **not** a reliable vocabulary reference. Use these instead:

- **Canonical keyword/token map per language:** `js/allspeak/LanguagePack_<lang>.js` — e.g. `LanguagePack_fr.js`, `LanguagePack_it.js`, `LanguagePack_de.js`. Each entry lists the keyword, its grammar patterns, and accepted spelling variants (with/without accents).
- **Idiomatic working examples:** `codex/<lang>/code/step*.as` — full tutorial scripts already written in the target language.

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
- **One runtime, many front-ends** — a French `.as` script and an English `.as` script compile to the same internal representation and run on the same engine.

### Current state
The JS multilingual layer is implemented and in active use: language packs ship for EN, FR, IT, and DE, and the JS runtime resolves keywords through the language layer throughout. The Python runtime has the same loader (`as_language.py`) and JSON packs, but i18n coverage is incomplete — see the project memory notes on Python and JS i18n gaps for known issues.

## Two Implementations

| | JS | Python |
|--|--|--|
| Source | `/js/allspeak/` | `/allspeak-py/allspeak/` |
| Build output | `/dist/allspeak.js`, `/dist/allspeak-min.js` | pip package |
| Runtime | Browser | CLI |
| Core files | `Core.js`, `Browser.js`, `Compile.js`, `Run.js`, `Main.js` | `as_core.py`, `as_compiler.py`, `as_program.py` |

Both implementations have the multilingual layer wired in (loader + language packs), but JS is where the work is most complete; Python lags and has known i18n gaps. JS is the primary focus.

## Build System

See [BUILD.md](BUILD.md) for the "edited X → run Y" lookup table covering all four dev scripts (`build-allspeak`, `sync-language-packs`, `build-starters`, `deploy-sync`) and the GitHub deploy workflow.

`./build-allspeak` concatenates the JS runtime into `/dist/allspeak.js` and minifies to `/dist/allspeak-min.js`. Bundle order: `Core.js` → `Browser.js` → `MarkdownRenderer.js` → `Webson.js` → `JSON.js` → `MQTT.js` → `REST.js` → `Compare.js` → `Condition.js` → `Value.js` → `Run.js` → `Compile.js` → `Main.js` → `AllSpeak.js`. **Never edit files in `/dist/` directly.**

## Versioning

Date-time-based: `YYMMDDHHMM` (e.g. `2605101119` = 2026-05-10 at 11:19). Set in `js/allspeak/AllSpeak.js` line 1. Same format used for commit messages — see below.

## Key Conventions

- Scripts are embedded in HTML inside a `<pre id="allspeak-script">` element
- Runtime loaded as `allspeak.js` or `allspeak-min.js`
- Plugins loaded separately from `/dist/plugins/`
- Each plugin follows the contract in `/spec/allspeak-plugin-contract.md`

## Doc blocks — required for new `.as` code

Every section of new `.as` code must be wrapped in a doc block:

    !! Brief explanation of what this section does and why it exists.
    !! Use multiple lines as needed. A bare `!!` line is a paragraph break.
    SomeLabel:
        ! the code
        return
    !! @hash <managed>      ← inserted by the analyser (don't write by hand)
    !!!                     ← required terminator (three bangs)

Rules:
- Lead with the **why** or the design constraint, not a paraphrase of the code.
- **One paragraph = one line.** Each paragraph of prose is a single `!! ...` line, however long. Bare `!!` separates paragraphs. Don't insert hard line breaks for visual wrapping — they render badly in Blocks mode (which word-wraps the doc pane) and they fight you when editing. The flat-mode editor will show very long source lines; that's accepted, since the prose is meant to be read in Blocks mode and AI tools don't care about line length.
- Don't start a prose line with `@hash` or `@verified` — the parser treats those as metadata. Quote them ("@verified") if you must mention the names.
- After any code change inside a block, refresh hashes with `python3 tools/asdoc-check.py --write <file>`. Verifies that go stale show up as warnings — review the change and re-verify (asedit's Blocks mode has a one-click "Mark verified" button).
- A file with no doc blocks at all is treated as opt-out (no errors, no warnings). Adopt the convention file-by-file as you touch them.

Both implementations of the analyser validate the same convention:
- `tools/asdoc-check.py` — Python CLI, recursive over a directory
- `tools/asdoc-check-cli.as` — runs under the Python AllSpeak runtime
- (browser-side parsing also lives inline in `asedit.as` for the editor)

Spec & history: `prompt-260509.md`.

## Code review while documenting

When adding doc blocks to existing code, treat it as a review pass, not just a documentation pass. While reading each section closely enough to write its prose, also surface anything that looks off:

- **Unreachable symbols** — subroutines or labels with no caller; variables declared but never assigned, or assigned but never read.
- **Dead code** — branches that can never be taken; lines after an unconditional `stop`/`exit`/`return` that nothing jumps to.
- **Suspicious patterns** — duplicated logic that might want consolidating; hardcoded values that look like they should be variables; hidden coupling between sections (one writes a global the other quietly depends on).
- **Doc/code disagreement** — comments, names, or nearby docs that contradict what the code actually does.

Surface findings as a short list at the **start** of your response, separately from the doc-block edits. Don't silently fix them — let the user decide.

The point of the doc-block convention is to force close reading; reporting what that reading turned up is the natural payoff.

## Commit Style

When no specific message is given, use a date-time stamp in `YYMMDDHHMM` form (e.g. `2605101119`, `2605082123`) — same format as the version string. Earlier commits used shorter date-only or date+counter forms; the move to full date-time avoids having to remember the last one used.
