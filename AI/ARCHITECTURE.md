# Architecture Notes (for AI)

## The compile-and-run path
1. **Source** — an `.allspeak` script, in any supported human language.
2. **Language pack** — `js/allspeak/LanguagePack_<lang>.js` resolves every source token to its canonical keyword (`mets` → `put`, `lege` → `put`). `AllSpeak_Language.word()` / `reverseWord()` is the only route in; domains never see the localised vocabulary. Python has the same layer (`allspeak-py/allspeak/as_language.py`) reading JSON generated from the JS packs.
3. **Token stream** — `Main.js` `tokeniseFile` strips comments and blank lines. Prose lines beginning `!!` are comments, so doc blocks emit no tokens at all.
4. **Domain compilers** — each domain owns vocabulary and compiles its own commands into an entry in the **program array**. `Core.js` holds most of the vocabulary, `Browser.js` the DOM and Webson side, and plugins the rest.
5. **Runtime** — `Run.js` steps the program array and dispatches each entry back to its owning domain's executor. The runtime itself is language-agnostic: it does not know what `on click` means, only how to call the handler bound at compile time.

## Two implementations
| | JavaScript | Python |
|--|--|--|
| Source | `js/allspeak/` | `allspeak-py/allspeak/` |
| Runtime | browser | CLI and desktop (Qt via PySide6) |
| Bundle | `deploy/dist/allspeak.js` + min | pip package |

The JS side is the more complete of the two. Known Python gaps are tracked in `language-pack-issues.md`; parity between the two is what `conformance/` measures.

## Bundling
`./build-allspeak` concatenates in a fixed order — `Core.js` → `Browser.js` → `MarkdownRenderer.js` → `Webson.js` → `JSON.js` → `MQTT.js` → `REST.js` → `Compare.js` → `Condition.js` → `Value.js` → `Run.js` → `Compile.js` → `Main.js` → `AllSpeak.js` — and minifies the result. Order matters: these files share top-level globals rather than using modules. Never edit the output.

## UI path
- `render <Webson> in <Body>` → `Browser.js` handles the command, `Webson.js` builds the DOM from Webson JSON.
- `attach <Element> to <id>` binds a script symbol to a rendered element, by the Webson `@id`. Renaming an ID means updating every reference; renaming only a Webson object key is safe.
- Markdown conversion is delegated from `Browser.js` to `MarkdownRenderer.js`.

## Editor
`edit.html` fetches `asedit.json` (Webson layout) and `asedit.allspeak` (all behaviour, ~1500 lines of AllSpeak), loads the runtime and plugins, and calls `AllSpeak_Startup()`. The dev server is `server.allspeak`, a Python AllSpeak script exposing `/list`, `/read`, `/write`, `/version`, `/restart`. CodeMirror is reached only through the `codemirror` plugin's vocabulary — see `resources/md/ai-article.md` for the full account.

## Known integration sensitivities
- **"Webson engine is not loaded"** — check the page loads `Webson.js`, and that the render logic and the Webson symbol name agree (`AllSpeak_Webson` vs legacy `Webson`).
- **A served file is cached** — `edit.html` fetches with a `?v=<timestamp>` stamp. If an edit doesn't appear, check the fetch before the code.
- **Domain handlers are tried in order and may fall through** — a handler must not throw or warn on syntax that could legitimately belong to another domain.
- **Doc blocks are not free of consequence** — they compile to nothing, but they are what the analysers and asedit's Blocks mode check. Changing code inside a block without refreshing the hash leaves the file reporting `verify-stale`.
