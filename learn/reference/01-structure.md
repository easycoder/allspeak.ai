# Structure

AllSpeak has two halves: a small, language-neutral runtime and a stack of **domain modules** that contribute the actual vocabulary. The runtime knows nothing about specific keywords. Domains are how `print`, `on click`, `rest get`, and `mqtt publish` can all live in the same language without the engine carrying any of them as built-ins.

## Domains

A domain is a module that owns:

- **A vocabulary** — the keywords and command shapes it can compile.
- **A set of variable types** — e.g. the Browser domain knows about `button`, `div`, `input`; the REST domain knows about `request`.
- **A set of conditions and values** — domain-specific tests and expressions.
- **A compiler stub for each construct** — code that recognises the syntax and turns it into a runnable form.
- **A runtime executor for each construct** — what to do when that form is executed.

Domains are independent. Adding a new one — whether bundled or as a plugin — introduces new keywords without touching any existing domain.

## The standard domains

Bundled in the JS build:

| Domain | Provides |
|--------|----------|
| Core | Control flow, variables, arithmetic, strings, files |
| Browser | DOM types, events, styling, layout |
| JSON | JSON parsing, building, traversal |
| Webson | The layout-binding mechanism between Webson markup and AllSpeak variables |
| REST | HTTP requests, response handling |
| MQTT | Pub/sub messaging |

The Python build has a similar set, with some divergence on collections and I/O.

`MarkdownRenderer` is bundled too but is a utility called from Core rather than a domain in its own right — it has no vocabulary.

## How compilation works

The compiler reads the source one statement at a time. For each statement, it asks each loaded domain in turn: *can you handle this?* The first domain that recognises the construct produces a compiled record — a small data structure capturing the operation and its operands — and that record is appended to the **program array**, a linear sequence of compiled statements.

If no domain claims the statement, that's a compile error.

```
source line  →  domain.compile()  →  program array entry
```

The order in which domains are tried rarely matters to the script writer, because each domain owns distinct vocabulary.

## How execution works

The runtime — `Run.js` in the JS build — steps through the program array, dispatching each entry back to its owning domain's executor. The executor reads operands, manipulates variables, evaluates conditions, and may yield (`stop`, `wait`) or transfer control (`go to`, `gosub`, fork into a new thread).

The runtime itself is small and language-agnostic. It does not know what `on click` means; it only knows how to invoke the domain handler that was bound at compile time.

## The multilingual layer

A second layer sits between the source script and the domain compilers: the **language pack**. Source tokens in any supported language (English, French, Italian, German, …) are resolved through the language pack to a canonical form, then handed to the domains. Domains never see the localised tokens — they work entirely in the canonical vocabulary.

This means a French `.as` script and an English `.as` script compile to the same program array and run on the same engine. See [multilingual](multilingual.md) for how language packs work and how the `language` directive selects one.

## Plugins

A plugin is a domain that ships separately from the bundled runtime. The contract is the same as for bundled domains — provide vocabulary, types, compilers, executors — and the loader treats it identically. The MQTT domain started as a plugin and was later promoted to bundled; Google Maps is a current external plugin.

Plugins are appropriate when a body of specialised functionality (graphics, hardware integration, third-party APIs) is large enough to deserve its own vocabulary but not core enough to belong in the standard product. See [plugins](plugins.md).

## Companion tools

Some pieces of AllSpeak are essential but aren't language features. The most prominent is the **Webson renderer** — the component that turns Webson markup (a JSON dialect describing HTML/CSS) into DOM. The Webson domain provides the `attach` binding that AllSpeak scripts use to reach into rendered elements; the renderer is what actually emits those elements. See [browser-and-webson](browser-and-webson.md).

## Why the structure looks like this

Three consequences follow from the domain model:

1. **Extensibility without engine changes.** A new domain adds vocabulary without touching anyone else's code.
2. **Parallel evolution.** Domains can be revised independently — the MQTT domain doesn't care what the Browser domain does.
3. **Language-neutrality.** Because domains operate on canonical tokens, the same domain code serves every human language the engine supports.

## Related

- [symbols-and-layout](symbols-and-layout.md) — the lexical surface that domains never see directly.
- [variables-and-arrays](variables-and-arrays.md) — variable types are domain-owned.
- [multilingual](multilingual.md) — the language pack and the `language` directive.
- [plugins](plugins.md) — external domains.
