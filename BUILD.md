# Build & Deploy

The repo has four dev scripts at the root. Each one has a narrow purpose; this file is the "what should I run after editing X?" reference.

## Quick lookup

| You edited… | Run… |
|---|---|
| `js/allspeak/*.js` (runtime, plugins, language packs) | `./build-allspeak` |
| `js/allspeak/LanguagePack_*.js` | `./build-allspeak` **and** `./sync-language-packs` |
| `starter/<lang>/*`, repo-root `server.allspeak` / `edit.html` / `asedit.allspeak` / `asedit-graph.allspeak` / `asedit-side.allspeak` / `asedit.json`, or a tool an agent uses (`tools/asdoc-check.py` / `plotview-check.js` / `viz-align-measure.py` / `guard-check.js` / `capture-check.js`) | `./build-starters` — and refresh any extracted starter directory (`edit.html`, `asedit.allspeak`, `asedit-graph.allspeak`, `asedit-side.allspeak`, `server.allspeak`), since a running server serves the copy on disk, not the repository |
| `server.allspeak` or `edit.html`, on its way to a project that already exists | also bump `.code-version` (one digit) and **deploy** — a project compares its own number with `https://allspeak.ai/code/code-version` at startup, and only a *greater* published number makes it fetch the new server script. It fetches nothing else: the editor and its modules travel in the page's payload. **Nothing on disk tells you a project is behind unless that number moves** |
| `codex/*` or `resources/doc/*` | `./deploy-sync` (then commit) |
| Any of the above, shipping to allspeak.ai | `./deploy-allspeak` (local) **or** trigger the GitHub `Deploy to allspeak.ai` workflow |

Editing either of the two `asedit` files needs no build — what it needs is a check:
`node tools/asedit-check.js asedit.allspeak`, `node tools/asedit-check.js asedit-graph.allspeak`,
`node tools/asedit-check.js asedit-side.allspeak`, `node tools/asedit-modes-check.js` (which runs the editor,
drives both modules' load and the pane's report to the sidebar), `node tools/plotview-check.js <trace>`
(which drives the drawing, cutting the view out of the module) and `node tools/guard-check.js` (which drives
both run hosts on two deliberately bad scripts, to prove the recorder's guard still guards).

**After editing `js/plugins/asviz.js` or `js/allspeak/Run.js`**: `./build-allspeak` (they are in the bundle and
the copied plugins), and `node tools/guard-check.js` — the recorder's guard lives in the plugin and the
runtime is what reads its answer.

## The four scripts

### `./build-allspeak`
Concatenates the JS runtime sources under `js/allspeak/` into `dist/allspeak.js`, minifies to `dist/allspeak-min.js`, copies plugins, and fetches CodeMirror + Showdown vendor assets if missing. Run after any edit under `js/allspeak/` or `js/plugins/`.

### `./sync-language-packs`
Extracts the JS object literal from each `js/allspeak/LanguagePack_<lang>.js` and writes it to `allspeak-py/allspeak/languages/<lang>.json`. The JS pack is the source of truth; this keeps the Python runtime in sync. Run after editing any language pack — otherwise the `allspeak` CLI sees a different vocabulary than the browser.

### `./build-starters`
Bundles the per-language starter zip `deploy/allspeak-<lang>.zip`, auto-discovering languages from `starter/*/`. Each zip contains the language's `AGENTS.md` + `CLAUDE.md` (a short pointer) plus, **from the repo root**, `server.allspeak` and `edit.html` (the page is generated from the root's, with the language and the payload base substituted) — and the shared `asedit.allspeak` + `asedit-graph.allspeak` (the Graph pane, a companion module the editor fetches on demand) + `asedit-side.allspeak` (its sidebar, a second one) + `asedit.json`. Nothing that a pack's page can fetch from the deploy is copied from a `starter/` directory: four copies of a file are four things to keep in step, and both `edit.html` and `server.allspeak` had already drifted that way. Run after editing anything under `starter/`, or after touching repo-root `server.allspeak` / `edit.html` / `asedit.allspeak` / `asedit-side.allspeak` / `asedit.json`.

### A project's copy of `server.allspeak`
`allspeak server <port>` runs `server.allspeak` from the current directory, so a project holds one — and `allspeak server.allspeak <port>` in the repo runs the repo's. At startup it asks `https://allspeak.ai/code/code-version` for a number and compares it with its own `.code-version`: **only a greater published number fetches**, and the comparison is numeric, so `9` and `10` order correctly. That direction matters in both ways. A project behind the deploy is brought forward; a copy *ahead* of it — the repo, where the number is authored, or a project somebody updated by hand — is left alone, which is what makes a bump in this repo survive a server started here (until 2026-10-04 any difference fetched, so the repo's own bump was undone by its own next `allspeak server`). So: bump, deploy, and the projects follow at their next start. The editor, its two modules and `asedit.json` are deliberately not downloaded: they arrive as `dist/asedit.js` in the page, and a copy in a project directory does nothing but shadow the deployed one.

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

Edits to `server.allspeak`, `edit.html`, `.code-version`, `asedit.allspeak`, `asedit.json` are picked up directly by both paths' `cp` step — no separate sync needed for those.
