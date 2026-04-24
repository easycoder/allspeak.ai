# i18n Polish — Nice-to-haves

Running list of translation / i18n rough edges found while reviewing the 4-language pack (en / it / fr / de). Nothing here is a compile-or-crash blocker — that class of issue gets fixed immediately. This is for "would be nicer if..." items.

Add new items at the end. When an item is fixed, mention the commit or drop the item.

---

## Runtime — value display

### Uninitialised variables render as literal `undefined`
*Noticed 2026-04-24 in FR Codex step 10 (tracer).*

When a variable hasn't been assigned and is interpolated into a string / alert, the user sees the English word `undefined`. Ideally the runtime would either render an empty string or a localised placeholder (e.g. `non défini`, `nicht definiert`, `non definito`). The underlying representation is presumably JS `undefined`; the string form leaks through.

Likely fix site: the runtime textify path (`js/allspeak/Run.js` / `Value.js`) — coerce `undefined` / `null` to `""` at the display boundary, or route through a pack-provided placeholder.

---

## Compiler / runtime diagnostics — still English-only

The pack-driven diagnostics system exists (see `pack.diagnostics` consulted by `AllSpeak_Language.diagnostic(...)` in `js/allspeak/Language.js`), and `unknownCommand` / `undeclaredVariable` fallbacks are wired up there. But several message sites bypass it and hardcode English strings.

Examples the user will see today, even with a non-English `language` directive in force:

- **`Compile error in 'ScriptName'`** — `js/allspeak/Main.js:141`. Hardcoded.
- **`Warnings:`** (label above warning list) — `js/allspeak/Main.js:153`.
- **`Unrecognised syntax in 'on'`** (and similarly in `attach`, `disable`, `enable`, `focus`, `set`) — `js/allspeak/Browser.js` at lines 140, 649, 698, 759, 1381, 2371. Each literal call to `compiler.addWarning(\`Unrecognised syntax in '<keyword>'\`)`.

A consistent fix would add a `unrecognisedSyntax` template key to `pack.diagnostics` (with a `{keyword}` placeholder), route all those sites through `AllSpeak_Language.diagnostic('unrecognisedSyntax', {keyword: 'on'})`, and add translations in each pack's `diagnostics` block. Same treatment for `compileErrorIn` / `warningsLabel`.

Scope is wider than just these sites — a grep for string literals in `addWarning(` / user-facing error throws in Compile.js, Run.js, Browser.js will surface others.

---

## Language-specific asides in tutorial prose

Translators adapted some English-specific asides thoughtfully (step4's "works like English (and French)") but a few may still read awkwardly in the target language. Flag any that jar on re-read and list them here with file+line so a proofreader can rework.

*(No specific items yet — add as you come across them.)*

---

## Starter-zip UI strings still in English

*Noticed 2026-04-24 while producing the FR and DE starter zips.*

The per-language starter zips (`deploy/allspeak-{en,it,fr,de}.zip`) bundle five files: `CLAUDE.md`, `allspeak.as`, `edit.html`, `asedit.json`, `asedit.as`. Of these, only `CLAUDE.md` and `edit.html` are per-language. The three shared files are English across every pack, including Italian:

- `code/allspeak.as` — the dev-server program. User-visible strings include startup prints (`AllSpeak dev server running on port …`, `Serving files from …`, `Press Ctrl+C to stop`) and error messages (`Warning: could not check for updates`, `Updating from version … to …`, `Update complete`, `Restart requested`, `Forbidden`, `Not found`). All hardcoded English.
- `code/asedit.as` — the browser editor script. Builds UI strings for the editor (labels, prompts, error messages) — all hardcoded English.
- `code/asedit.json` — Webson layout for the editor UI. Labels inside values (button text, tab names, etc.) are English.

A proper fix would externalise user-visible strings from these three files into per-language JSON (e.g. `strings-<lang>.json`) that gets picked based on the active language directive, and then `zip.sh` bundles the matching strings file. Not a blocker for the UNESCO pitch — the zip's agent-facing `CLAUDE.md` is what gets Claude behaving in the target language, and that is fully translated.

---

## Untracked: translation word-choice quibbles

Individual word-choice issues spotted while reading the packs (e.g. "dieser Text ist holprig, besser wäre X") don't belong here — they go to volunteer proofreaders via the contribution notice on each page. This list is for things that need a code or structural fix.
