# Build & Deploy

The repo has four dev scripts at the root. Each one has a narrow purpose; this file is the "what should I run after editing X?" reference.

## Quick lookup

| You edited… | Run… |
|---|---|
| `js/allspeak/*.js` (runtime, plugins, language packs) | `./build-allspeak` |
| `js/allspeak/LanguagePack_*.js` | `./build-allspeak` **and** `./sync-language-packs` |
| `starter/<lang>/*` or repo-root `asedit.as` / `asedit.json` | `./build-starters` |
| `code/server.as` or `code/edit.html` (auto-update payload) | nothing locally — committed file is used directly by deploy |
| `codex/*` or `resources/doc/*` | `./deploy-sync` (then commit) |
| Any of the above, shipping to allspeak.ai | `./deploy-allspeak` (local) **or** trigger the GitHub `Deploy to allspeak.ai` workflow |

## The four scripts

### `./build-allspeak`
Concatenates the JS runtime sources under `js/allspeak/` into `dist/allspeak.js`, minifies to `dist/allspeak-min.js`, copies plugins, and fetches CodeMirror + Showdown vendor assets if missing. Run after any edit under `js/allspeak/` or `js/plugins/`.

### `./sync-language-packs`
Extracts the JS object literal from each `js/allspeak/LanguagePack_<lang>.js` and writes it to `allspeak-py/allspeak/languages/<lang>.json`. The JS pack is the source of truth; this keeps the Python runtime in sync. Run after editing any language pack — otherwise the `allspeak` CLI sees a different vocabulary than the browser.

### `./build-starters`
Bundles the per-language starter zip `deploy/allspeak-<lang>.zip`, auto-discovering languages from `starter/*/`. Each zip contains the language's `CLAUDE.md` + `server.as` + `edit.html` plus the shared `asedit.as` + `asedit.json` from the repo root. Run after editing anything under `starter/`, or after touching repo-root `asedit.as` / `asedit.json`.

### `./deploy-sync`
Mirrors `codex/`, `dist/`, and `resources/doc/` into the matching `deploy/` subdirectories so the committed `deploy/` tree matches the source tree. The GitHub deploy workflow rsyncs `deploy/` to the server **as-is**, so anything that lives under `deploy/codex/` or `deploy/resources/doc/` ships whatever was last committed there. Run + commit before deploying when you've changed those source dirs.

## Deploying to allspeak.ai

Two equivalent paths:

### Local: `./deploy-allspeak`
Runs `build-allspeak`, `deploy-sync`, the `cp` into `deploy/code/`, `build-starters`, then rsyncs `deploy/` to `allspeak@allspeak.ai:allspeak.ai/`. Uses your default SSH key. Fastest iteration: skip the commit/push round-trip.

### GitHub: `Deploy to allspeak.ai` workflow
Triggered manually via `workflow_dispatch` on `.github/workflows/deploy.yml`. The workflow itself runs `./build-allspeak` and `./build-starters` on the runner, then rsyncs `deploy/` to the server. Uses the deploy SSH key stored as a repo secret.

**Before triggering the GitHub workflow**, run locally and commit, if relevant to your changes:
- `./sync-language-packs` — the Python `.json` packs aren't shipped by the workflow, but you should commit them in step with the JS source.
- `./deploy-sync` — the workflow rsyncs `deploy/` as-is, so stale `deploy/codex/` or `deploy/resources/doc/` will go out unless you sync first.

The local script does both implicitly so there's nothing extra to remember.

Edits to `code/server.as`, `code/edit.html`, `code-version`, `asedit.as`, `asedit.json` are picked up directly by both paths' `cp` step — no separate sync needed for those.
