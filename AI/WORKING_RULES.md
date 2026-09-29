# Working Rules for AI Contributors

## Primary goal
Fix or implement the requested behaviour with minimal collateral change.

The project's standing rules are in the root `AGENTS.md` — doc blocks, the `DIFF.md` habit, the conversation log, diagnostics, commit style — and the language rules are in `AI/ALLSPEAK_CODING_GUIDELINES.md`. Read those. What follows is only what they do not cover.

## Repo-specific rules
- Behaviour and flow go in AllSpeak scripts; UI structure goes in Webson JSON. Never embed HTML in script logic.
- Check whether a command already exists in core or in a plugin before writing a plugin of your own.
- Keep element IDs stable unless every reference to them is updated in the same change.
- Variables are global within a script. For private working state, move the logic into its own script and pass data by shared variable or by `send` / `on message`.
- For repeated UI items, use one array-style variable and one handler registered on the array; find the item with `the index of`.
- Offline or in a consumer project? Do not change a file this repo owns (see `AGENTS.md`, "Canonical source").

## Build and update rules
- Rebuild what you touched. `./build-allspeak` (runtime bundles), `./build-starters` (per-language zips), `./deploy-sync` (mirror `codex/`, `learn/`, `primer/`, `resources/doc/` into `deploy/`). `BUILD.md` is the lookup table.
- Never edit `deploy/dist/` — it is build output.
- Editing a language pack? Change `js/allspeak/LanguagePack_<lang>.js`, then run `./sync-language-packs` to regenerate the Python JSON mirror.
- Change code inside a doc block, and the block's hash is now stale: `python3 tools/asdoc-check.py --write <file>` refreshes `@hash` and leaves `@verified` alone, so the stale verifications stay yours to review.

## Debug checklist
- Reach for `log` before a theory. It writes to the browser console and prints in the Python runtime, and unlike a dialog the line is copyable.
- **An undeclared `variable`** is reported as a *token* error at the first statement that uses it ("I don't understand 'put'"), not as "not declared". A compile failing that way usually means a missing declaration.
- **A number read out of text stays text.** Comparison is then lexical, so `` `29` `` is not less than `` `1000001` ``. Convert with `add 0 to X` or `the value of X`.
- **"Webson engine is not loaded"** — verify the page loads `Webson.js`.
- **A served file is cached** — check the fetch (the editor uses a `?v=` stamp) before the code.

## Document as you go
Add short notes for any non-obvious fix that would save another AI 15+ minutes.
