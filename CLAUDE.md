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

When writing or debugging `.as` scripts in a non-English language, the English-only utility scripts (`allspeak.as`, `asedit.as`) are **not** a reliable vocabulary reference. Use these instead:

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

The build script is `./build-allspeak` (shell script). It:
1. Clears `/dist/`
2. Copies `/js/plugins/` to `/dist/plugins/`
3. Fetches vendor assets from CDN if not in `/vendor/`
4. Concatenates all core JS files into `/dist/allspeak.js`
5. Minifies → `/dist/allspeak-min.js`

**Bundle order:** `Core.js` → `Browser.js` → `MarkdownRenderer.js` → `Webson.js` → `JSON.js` → `MQTT.js` → `REST.js` → `Compare.js` → `Condition.js` → `Value.js` → `Run.js` → `Compile.js` → `Main.js` → `AllSpeak.js`

**Never edit files in `/dist/` directly.**

### Starter packs

The four per-language starter zips at `deploy/allspeak-<lang>.zip` are built by `./build-starters`. It auto-discovers languages from `starter/*/` and bundles each language's `CLAUDE.md` + `allspeak.as` + `edit.html` with the shared `asedit.as` + `asedit.json`. Run it after editing anything under `starter/` or after touching the shared files. Adding a new language is just creating `starter/<lang>/` with the three required files and re-running.

## Versioning

Date-based (e.g. `250824` = 24 Aug 2025). Set in `js/allspeak/AllSpeak.js` line 1.

## Key Conventions

- Scripts are embedded in HTML inside a `<pre id="allspeak-script">` element
- Runtime loaded as `allspeak.js` or `allspeak-min.js`
- Plugins loaded separately from `/dist/plugins/`
- Each plugin follows the contract in `/spec/allspeak-plugin-contract.md`

## Commit Style

Date-based messages (e.g. `26040601`, `26040602`). Follow this pattern unless specified otherwise.
