# Project Overview (for AI)

## What this repo is
AllSpeak is a high-level scripting language for an age where AI writes most of the code. Scripts read like a natural sentence — *"set the content of Heading to `Welcome`"* — so the human can verify what the agent produced without learning a programming language, and the same script can be written in any supported human language and run on one shared, language-neutral runtime.

This repository is the primary source of truth for:
- `js/allspeak/` — the JavaScript (browser) runtime and the language packs
- `allspeak-py/` — the Python (CLI and desktop) runtime
- `asedit.allspeak`, `asedit.json`, `edit.html`, `server.allspeak` — the review editor and its dev server
- `tools/asdoc-check*.py`, `tools/asdoc-check*.allspeak` — the doc-block analysers
- `learn/` — the language reference and idiom collections, per language

Forked from [EasyCoder](https://github.com/easycoder/easycoder.github.io) on 2026-04-06; the original repo continues unchanged as the stable English-only product. Scripts use the `.allspeak` extension.

## Where to start, by question
| Question | File |
|---|---|
| What is this, briefly? | `resources/md/ai-article.md` |
| What does the language do? | `spec/allspeak-language-contract.md`, `learn/<lang>/reference/` |
| How do I write good AllSpeak? | `AI/ALLSPEAK_CODING_GUIDELINES.md`, `learn/<lang>/idioms/` |
| Worked examples | `codex/<lang>/code/step*.allspeak`, `codex/codex.allspeak` |
| How does it hang together? | `AI/ARCHITECTURE.md` |
| How do I build and deploy? | `BUILD.md` |
| What is broken / open? | `language-pack-issues.md`, `TODO.md` (the handover, which points at `TODO-viz.md`, `TODO-language.md` and `TODO-site.md`) |

## Main design choices
- **One runtime, many front-ends.** Source tokens are resolved through a language pack to a canonical vocabulary before any domain compiler sees them, so a French script and an English script compile to the same program and run on the same engine.
- **Domains own their vocabulary.** Core keywords live in `Core.js` and `Browser.js`; anything large enough to deserve its own vocabulary ships as a plugin under `js/plugins/`, per `spec/allspeak-plugin-contract.md`.
- **Webson for structure, AllSpeak for behaviour.** UI layout is Webson JSON; scripts attach to element IDs and drive them. HTML is never embedded in script logic.
- **The editor is built for review as much as for writing.** That is why its feature set is deliberately small, and why its Blocks mode — where the doc-block convention is checked — is the part that matters.

## Current practical workflow
- Rebuild what you touched: `./build-allspeak` (runtime bundles into `deploy/dist/`), `./build-starters` (per-language zips), `./deploy-sync` (mirror `codex/`, `learn/`, `primer/`, `resources/doc/` into `deploy/`). `BUILD.md` is the lookup table.
- Never edit `deploy/dist/` by hand — it is build output, and the CDN path `https://allspeak.ai/dist/…` is served from it.
- After changing code inside a doc block, refresh the hashes: `python3 tools/asdoc-check.py --write <file>`.
- Prefer the unminified `allspeak.js` when diagnosing runtime errors.
- Changing a language pack? Edit `js/allspeak/LanguagePack_<lang>.js`, then run `./sync-language-packs` to regenerate the Python JSON.

## External references
- AllSpeak repo: https://github.com/easycoder/allspeak.ai (mirror: https://codeberg.org/allspeak/allspeak)
- Webson repo (older, README still relevant): https://github.com/allspeak/webson
- AllSpeak site and Codex: https://allspeak.ai
- Whitepaper: https://doi.org/10.5281/zenodo.22018537
