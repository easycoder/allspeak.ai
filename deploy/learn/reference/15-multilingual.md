# Multilingual

AllSpeak lets people write code in their own language. A French `.as` script and an English `.as` script compile to the same internal program and run on the same engine; only the source vocabulary changes.

This file describes how the multilingual layer works. For guidance on writing scripts whose *logic* survives translation (avoiding English-centric data-shape assumptions, word-order quirks, etc.), see [writing-language-neutral](../idioms/writing-language-neutral.md).

## The `language` directive

A script may declare the language of its vocabulary on the first line:

```as
language français

alerte `Bonjour, tout le monde !`
```

```as
language italiano

avviso `Ciao, mondo!`
```

```as
language deutsch

alarm `Hallo, Welt!`
```

The directive tells the compiler which language pack to load. If omitted, English is assumed:

```as
alert `Hello, world!`
```

All three localised examples above compile to the same internal alert-with-string operation and run on the same engine.

## What a language pack is

A language pack is a mapping from canonical (internal) tokens to one or more surface forms in the target language. It covers six categories:

- **Opcodes** — verb keywords like `print`, `set`, `if`.
- **Connectors** — small grammatical words like `to`, `into`, `of`, `with`.
- **Literals** — keywords that produce values: `true`, `false`, `now`, `today`, `newline`.
- **Time units** — `seconds`, `milliseconds`, `ticks`.
- **Conditions** — `is`, `is less than`, `contains`, etc.
- **Words** — articles, particles, anything else translatable.

Where the packs live:

- **JS:** `js/allspeak/LanguagePack_<code>.js` — e.g. `LanguagePack_fr.js`.
- **Python:** `allspeak-py/allspeak/languages/<code>.json` — e.g. `fr.json`.

The two are kept in sync — the same canonical tokens map to the same surface forms in both runtimes for a given language.

## How the compile pipeline uses the pack

The flow during compilation:

```
source token  →  AllSpeak_Language.reverseWord()  →  canonical token  →  domain compiler
```

When the compiler reads a token from the source, the language layer looks it up in the active pack's reverse index and returns the canonical form. `alerte` → `alert`, `avviso` → `alert`, `alert` → `alert`. The domain compilers (Core, Browser, etc.) operate purely on canonical tokens.

Domains never see localised tokens. This is why a French script and an English script produce the same program array: both reduce to the same canonical token stream before any domain code runs.

## Multiple surface forms per canonical word

A pack entry can map one canonical word to several surface forms — useful for languages with grammatical inflection. Forms are pipe-separated:

```
"the": "il|lo|la|gli|le"
```

The compiler accepts any of the listed forms; the canonical form is what propagates downstream. The `word()` lookup returns the first form (the primary spelling for output); `wordForms()` returns the whole list (for matching during compile).

## Currently shipped languages

Both runtimes ship four packs:

- **English** (`en`) — the original; the default if no `language` directive is present.
- **Italian** (`it`) — fully shipped.
- **French** (`fr`) — fully shipped.
- **German** (`de`) — fully shipped.

The four were chosen for outreach to UN agencies. French and German coverage is broad; some translations are still being refined.

## Writing language-neutral logic

Language-neutral *vocabulary* is provided automatically by the pack. Language-neutral *logic* — script structure that doesn't bake in English assumptions about word order, data shape, or cultural patterns — is the author's responsibility. The [writing-language-neutral](../idioms/writing-language-neutral.md) idiom collects the patterns and pitfalls.

## Adding a new language

Mechanically:

1. Copy `LanguagePack_en.js` (and `languages/en.json` for Python) to the new language code.
2. Translate the keyword, connector, literal, time-unit, condition, and word entries.
3. Add the language to the loader's index.
4. Author a `language <native-name>` line and write tests.

The hard part is not mechanical — it's vocabulary choice. AllSpeak's English keywords are deliberately natural-language-like (`take A from B`, `add A to B`, `the index of`), and the translations need to read naturally in the target language, not as literal calques of the English. AI translation produces a decent first pass; human review by a native speaker brings it to ship quality.

Open vocabulary issues are tracked in `language-pack-issues.md` at the repo root.

## Related

- [structure](structure.md) — where the language layer sits in the compiler.
- [symbols-and-layout](symbols-and-layout.md) — the lexical surface that's the same in every language.
- [writing-language-neutral](../idioms/writing-language-neutral.md) — patterns for code that survives translation.
