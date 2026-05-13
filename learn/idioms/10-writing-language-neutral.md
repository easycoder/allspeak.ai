# Writing language-neutral

## Problem

AllSpeak's language packs translate keywords automatically — the same script structure works in any supported language. But pack translation doesn't cover everything. A script that hard-codes English assumptions about strings, names, or constructs will trip up its translator (or break entirely under a different pack).

## What the language pack handles for you

Vocabulary. When you write a verb (`print`, `set`, `add`), a connector (`to`, `into`, `of`), or a condition (`is`, `is less than`), the language layer substitutes the right surface form for the active pack. The same source-script shape compiles to the same internal program regardless of language. See [multilingual](../reference/multilingual.md).

## What the pack doesn't translate

Four areas the author has to own.

### String literals

Backtick-delimited text passes through unchanged:

```as
print `Hello, world!`
```

Translation means editing the source. To make a script easy to localise, gather user-facing strings near the top (or in a separate Webson resource), not scattered inline. Translation is then a single pass over one section, not the whole script.

### Variable and label names

Names are author-chosen; the pack doesn't touch them. Conventional practice: pick one language for names per script and use it consistently. Mixing English variables with French keywords (or vice versa) is technically legal but reads as a translation half-done.

When porting a script to a new language, the variables are commonly translated too — the result reads naturally to a speaker of the target language.

### Constructs that don't exist in every pack

Some packs have a richer set of synonyms than others. If you write idiomatic English that depends on a specific phrasing — an unusual `the … of` chain, say — the translator may not have a one-to-one mapping in the target language. Prefer constructs that appear in every pack — the ones used in the [codex](../../codex) tutorials are a safe set.

A concrete example: `for each` is hard to express clearly in spoken English and worse in many other languages, so the curriculum drops it in favour of `while` loops with explicit indices. Idioms like that one are easier to translate than constructs that lean on a specific English phrasing.

### Data formats

Numbers, dates, and similar formats are culture-specific. AllSpeak doesn't enforce a single format. If your script builds a display string with `cat`, the result is English-style. To localise:

- Route format-sensitive output through a helper that consults a per-language formatter, or
- Build the locale-aware string at the point of display, keeping internal storage in a canonical form (e.g. integers for money).

## Testing

The most reliable test: translate the `language` directive and a handful of keywords, then run the script under another pack. Surprises that compile in English but fail in French usually point to a keyword that the FR pack didn't pick up — or a literal string the author forgot was language-bound.

A script that runs unmodified under at least two language packs (apart from the directive) is a strong signal of language-neutrality.

## Patterns that pay off

- **Externalise user-facing strings.** Put them in a Webson `.json` resource or a single section of the script. Translation is a single pass.
- **One language per script for names.** Pick the script's primary language and stay consistent.
- **Stick to documented constructs.** The reference tier shows what's universally available; idiosyncratic phrasings may not translate.
- **Format on display, not on storage.** Keep internal values canonical; localise only at the boundary.

## Related

- [multilingual](../reference/multilingual.md) — how the language pack works.
- [structure](../reference/structure.md) — why domain code never sees localised tokens.
- [working-with-ai](working-with-ai.md) — AI translation is a useful first pass for ports.
