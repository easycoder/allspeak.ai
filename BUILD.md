# Build & Deploy

The repo has four dev scripts at the root. Each one has a narrow purpose; this file is the "what should I run after editing X?" reference.

## Quick lookup

| You edited… | Run… |
|---|---|
| `js/allspeak/*.js` (runtime, plugins, language packs) | `./build-allspeak` |
| `allspeak-py/**` (the Python runtime and its plugins) | nothing here — **release `allspeak-ai`**, then a deploy if a script on the other side calls it |
| `js/allspeak/LanguagePack_*.js` | `./build-allspeak` **and** `./sync-language-packs` |
| `starter/<lang>/*` (the agent instructions, and nothing else) | `./build-starters` — a pack is three files: `AGENTS.md`, `CLAUDE.md` and `.allspeak-init` |
| a tool an agent uses (`tools/asdoc-check.py` / `plotview-check.js` / `viz-align-measure.py` / `guard-check.js` / `capture-check.js` / `encoding-check.js` / `flush-check.js`) | `./build-starters` (it fails if one has gone missing) **and deploy** — the deploy publishes them at `/code/tools/`, which is where a project fetches one from. They are not shipped in a pack |
| `server.allspeak`, on its way to projects | **deploy** — `allspeak server <port>` fetches `https://allspeak.ai/code/server.allspeak` at every start when the directory has none, so a deploy puts a change in front of every project at once. No version file, no bump, nothing to remember. A project's own `server.allspeak`, if it keeps one, is used instead and never replaced |
| `edit.html` | **deploy** — the dev server fetches the deployed page for any project that has none of its own, and fills in that project's language from its `.allspeak-init` |
| `codex/*` or `resources/doc/*` | `./deploy-sync` (then commit) |
| Any of the above, shipping to allspeak.ai | `./deploy-allspeak` (local) **or** trigger the GitHub `Deploy to allspeak.ai` workflow |

Editing either of the two `asedit` files needs no build — what it needs is a check:
`node tools/asedit-check.js asedit.allspeak`, `node tools/asedit-check.js asedit-graph.allspeak`,
`node tools/asedit-check.js asedit-side.allspeak`, `node tools/asedit-modes-check.js` (which runs the editor,
drives both modules' load and the pane's report to the sidebar), `node tools/plotview-check.js <trace>`
(which drives the drawing, cutting the view out of the module) and `node tools/guard-check.js` (which drives
both run hosts on two deliberately bad scripts, to prove the recorder's guard still guards) and
`node tools/encoding-check.js` (which serves a page the awkward way — `text/html`, no charset — and
insists the text the Python runtime fetched arrives exactly, accents and all).

**After editing `js/plugins/asviz.js` or `js/allspeak/Run.js`**: `./build-allspeak` (they are in the bundle and
the copied plugins), and `node tools/guard-check.js` — the recorder's guard lives in the plugin and the
runtime is what reads its answer.

## The four scripts

### `./build-allspeak`
Concatenates the JS runtime sources under `js/allspeak/` into `dist/allspeak.js`, minifies to `dist/allspeak-min.js`, copies plugins, and fetches CodeMirror + Showdown vendor assets if missing. Run after any edit under `js/allspeak/` or `js/plugins/`.

### `./sync-language-packs`
Extracts the JS object literal from each `js/allspeak/LanguagePack_<lang>.js` and writes it to `allspeak-py/allspeak/languages/<lang>.json`. The JS pack is the source of truth; this keeps the Python runtime in sync. Run after editing any language pack — otherwise the `allspeak` CLI sees a different vocabulary than the browser.

### `./build-starters`
Bundles the per-language starter zip `deploy/allspeak-<lang>.zip`, auto-discovering languages from `starter/*/`. **A pack is the project's own files and nothing else**: `AGENTS.md` (the agent's instructions for that language), `CLAUDE.md` (a short pointer at it) and `.allspeak-init`, which declares the language the project speaks (`lang: fr`). No tooling is in a pack — see "what a project holds" below. Run after editing anything under `starter/`.

### The dev server script: fetched, not shipped
`allspeak server <port>` names a script — the extension is optional, so `server` resolves to `server.allspeak` — and **if there is no such file in the directory, the CLI fetches the published one** (`https://allspeak.ai/code/server.allspeak`) and runs that. The port and `-t` arguments go to whichever file runs, so nothing about the command changed; what changed is that a project no longer has to hold a copy of the server for it to start.

- **A local `server.allspeak` still wins**, untouched. That is how the repo runs its own, and how a project pins or changes its server.
- The fetched copy is kept at `~/.cache/allspeak/server.allspeak` — outside the project — so only the first start needs the network; a later start uses the cached copy when the fetch fails, and says so. With neither, it prints one sentence and stops, rather than the raw traceback it used to give.
- This is why `.code-version` is gone. It existed to keep *a project's copy* of this script current, and the number was a number nobody remembered to bump — and any difference fetched, so a copy ahead of the publish was dragged backwards. There is nothing left to keep current: the CLI asks for the published script every start.
- `/version` compares **content** rather than a number: is the published script the one this process is running? It answers `OK` or `updated`, which is what the editor's restart offer needs. `/restart` re-execs `allspeak server <port>`.

The editor, its two modules and `asedit.json` are still not in a project: they arrive as `dist/asedit.js` in the page.

### What a project holds, and where everything else comes from
A project made from a pack carries its own code, `AGENTS.md`, `CLAUDE.md` and `.allspeak-init` — and **no tooling at all**:

| it needs | it comes from |
|---|---|
| `server.allspeak` | fetched by the CLI at every `allspeak server` start, cached in `~/.cache/allspeak/` |
| `edit.html` | fetched by that server from `/code/`, with the project's language filled in from its `.allspeak-init` |
| the editor, its two modules, `asedit.json` | the page's payload, `dist/asedit.js`, written by `./build-allspeak` |
| the checks (`asdoc-check.py`, `plotview-check.js`, `viz-align-measure.py`, `guard-check.js`, `capture-check.js`, `encoding-check.js`, `flush-check.js`) | fetched from `/code/tools/` by whoever wants one, into scratch space rather than the project |

The point is that none of it can be stale without that being obvious: there is no copy to notice. A project that *wants* to pin one of them keeps a file of that name and it is used in preference — which is also how this repository runs its own server and its own page.

### The Python runtime: a release, not a build

**`allspeak-py/` is a pip package, and nothing in this repository publishes it.** The four scripts at the root
are all JS-side or docs-side; a change under `allspeak-py/` reaches users only when `allspeak-ai` is released
(flit, from `allspeak-py/pyproject.toml`) — and a project keeps running its installed copy until it is
upgraded. **The release, in full:**

    # 1. the version, date-time, YYMMDDHHMM — flit reads it from here
    $EDITOR allspeak-py/allspeak/__init__.py
    # 2. build and publish
    cd allspeak-py && flit build && flit publish

**A version bump is not optional, and it is the only thing that changes what a user sees**: `Program.__init__`
asks the *installed distribution* for its version and only falls back to the source tree when there is none, so
a source checkout at a newer version still reports the installed one. Measured 2026-10-06: with
`allspeak-py/allspeak/__init__.py` bumped and `join` working, `allspeak --version` answered the older installed
number.

**And commit the bump, because the two can drift in the direction that hurts.** Measured 2026-10-06: the
installed `allspeak-ai` read `2610061243` — a wheel built from a tree carrying `join` — while the source tree's
`__version__` read `2610061214`, the bump that produced it. A wheel built from *that* tree would carry a **lower**
version than the published one, and pip will not upgrade to a lower number: the next bump must be above the last
*published* version, not merely above the value in the file.

Two consequences worth knowing:

- **A feature that spans the two sides needs both.** `server.allspeak`'s `/record/` route shells out to
  `allspeak --record=<trace>`, so a deploy without a release ships a route whose flag the project's installed
  runtime does not have.
- **The package is the `allspeak/` module and nothing beside it.** `plugins/` as a sibling of the module is
  *not* shipped — which is why the visualiser's plugin lives at `allspeak-py/allspeak/plugins/as_viz.py`.
  Verify what a wheel carries rather than assuming:
  `python3 -c "import zipfile,glob;print([n for n in zipfile.ZipFile(max(glob.glob('allspeak-py/dist/*.whl'))).namelist() if 'as_viz' in n])"`

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

The deploy's own `cp` step is what publishes the tooling: `server.allspeak` and `edit.html` at `/code/` (the CLI fetches the one, the server the other), the editor's four files beside the payload at `/dist/`, and the seven checks at `/code/tools/` — the list `build-starters` refuses if one of them has gone missing. No separate sync is needed for those — but both deploy paths carry that list, so keep them in step.
