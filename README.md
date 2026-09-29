# AllSpeak

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22018537.svg)](https://doi.org/10.5281/zenodo.22018537)

This project is primarily hosted on GitHub. An automatic mirror is maintained at https://codeberg.org/allspeak/allspeak for users who prefer non-corporate infrastructure. Issues and pull requests should be filed on GitHub.

**AllSpeak is a high-level scripting language designed for an age where AI writes most of the code.** Scripts read like a natural human sentence — *"set the content of Heading to `Welcome`"* — so the human can verify what the AI produced without learning a programming language. The same script can be written in any of several human languages and run on a single shared, language-neutral runtime.

Currently shipping language packs for **English, Italian, French, and German** (with `language` directives `en`, `it`, `français`, `deutsch`). Adding a new language is a JSON-pack contribution, not an engine change.

```text
    language français
    script Bonjour
    variable Salutation
    mets `Bonjour, AllSpeak !` dans Salutation
    journalise Salutation
```

```text
    language deutsch
    script Hallo
    variable Gruss
    lege `Hallo, AllSpeak!` in Gruss
    logge Gruss
```

Both scripts compile to identical internal opcodes and run on the same engine.

## Start here

Three ways in, depending on how much time you have:

- **Ten minutes** — [*Building Applications with AllSpeak and Agentic AI*](resources/md/ai-article.md) is the project's quick brief: what AllSpeak is, how the two runtimes, the editor and the review workflow fit together, and what its limits are.
- **Hands on** — the [Codex](https://allspeak.ai/codex.html) is an interactive tutorial; the scripts it teaches live in `codex/<lang>/code/`.
- **Working in the repo** — [`AGENTS.md`](AGENTS.md) and [`AI/`](AI/) for agents, and [`learn/`](learn/) for the language reference and idiom collection.

## Why AllSpeak

- **AI-native.** Mainstream languages have huge surface areas that lead AI to hallucinate. AllSpeak's small, regular grammar collapses that surface — AI writes correct AllSpeak almost reliably, and when it doesn't, the error sits in plain sight on a single line.
- **Readable by domain experts, not just programmers.** A doctor, accountant, or operations lead can read a maintained AllSpeak script and tell whether it's doing what the business needs. JavaScript, even more so React or Python frameworks, are opaque to that audience.
- **Multilingual by design.** The runtime is language-neutral. A French team and a German team can share one engine, one set of plugins, one set of tutorials — each in their own language.
- **No build environment for browser apps.** Drop a `<script>` tag, write your script in a `<pre>`, refresh. Compilation is tens of milliseconds, even on a phone.
- **Pluggable.** Anything wrappable in JavaScript or Python — Google Maps, Markdown, MQTT, REST, SVG, SQLite — becomes a plugin with a script-friendly vocabulary. See [`spec/allspeak-plugin-contract.md`](spec/allspeak-plugin-contract.md).

## Two implementations

| | JavaScript (browser) | Python (CLI) |
|--|--|--|
| Runtime | `dist/allspeak.js` (loaded via CDN or self-hosted) | `pip install allspeak-ai`, then `allspeak script` |
| Source | `js/allspeak/` | `allspeak-py/allspeak/` |
| State | Production | Production; some i18n gaps tracked in [`language-pack-issues.md`](language-pack-issues.md) |

## Quick start — browser

```html
<html>
<body>
    <pre id="allspeak-script" style="display:none">
    language en
    script Hello
    div Heading
    create Heading
    set the content of Heading to `Hello, AllSpeak!`
    </pre>
    <script src="https://allspeak.ai/dist/allspeak-min.js"></script>
</body>
</html>
```

For a non-English script, also load the relevant language pack (e.g. `LanguagePack_fr.js`) — see the codex examples for full templates.

## Quick start — CLI (Python)

```sh
pip install allspeak-ai
allspeak hello
```

The `.allspeak` extension may be omitted from the script name.

```text
!   hello.allspeak
    script Hello
    print `Hello, AllSpeak!`
    exit
```

## Quick start — AI-assisted

Each non-English language ships a starter pack at `deploy/allspeak-<lang>.zip` containing the agent instructions (`AGENTS.md`, plus a short `CLAUDE.md` pointer), the dev server, and the editor. Drop the contents into a project directory, point an AI coding agent at it, and ask it to build something.

The starter pack drives the **AI writes, human reviews** workflow that is core to using AllSpeak in practice. See [`starter/<lang>/AGENTS.md`](starter/) for the agent-facing instructions.

## Repository layout

```
js/allspeak/         JavaScript runtime + language packs (LanguagePack_<lang>.js)
js/plugins/          JS plugins (codemirror, svg, gmap, ui, asviz, webson, etc.)
allspeak-py/         Python implementation (runtime + CLI + plugins + JSON language packs)
deploy/dist/         Built JS bundles — built by ./build-allspeak; do not edit
deploy/              Web-served mirror, plus the per-language starter zips
spec/                Language contract, plugin contract, versioning policy, opcodes
conformance/         Cross-implementation test suite (.allspeak scripts + expected output)
starter/<lang>/      Source files for the per-language AI-agent starter packs
codex/<lang>/        Tutorial curriculum (codex/<lang>/code/step*.allspeak) per language
learn/<lang>/        Language reference and idiom collections, per language
tools/               Doc-block analysers and other dev scripts
primer/              Primer materials for AI-assisted project starts
examples/            Standalone example projects
chat/                Multilingual chat application (worked example)
AI/                  Onboarding for AI agents working in this repo
resources/md/        Article material, including the project brief (ai-article.md)
```

## Documentation

- [`spec/allspeak-language-contract.md`](spec/allspeak-language-contract.md) — language semantics
- [`spec/allspeak-plugin-contract.md`](spec/allspeak-plugin-contract.md) — how to write a plugin
- [`spec/allspeak-versioning-policy.md`](spec/allspeak-versioning-policy.md) — versioning and compatibility
- [`developer.md`](developer.md) — developer notes
- [`language-pack-issues.md`](language-pack-issues.md) — known gaps, open items, and a static audit script for language packs
- [`AGENTS.md`](AGENTS.md) and [`AI/`](AI/) — guidance for AI agents working on the codebase

For interactive learning, the **Codex** at [https://allspeak.ai](https://allspeak.ai) offers a tutorial course and a programmers' reference. Source under `codex/<lang>/`.

The whitepaper, *[AllSpeak: A Language-Agnostic Runtime for Computational Literacy in Multilingual Communities](https://doi.org/10.5281/zenodo.22018537)*, is published on Zenodo (DOI: 10.5281/zenodo.22018537).

## Building

```sh
./build-allspeak     # bundle and minify the JS runtime into deploy/dist/
./build-starters     # rebuild deploy/allspeak-<lang>.zip from starter/<lang>/
./deploy-sync        # mirror codex/, learn/, primer/, resources/doc/ into deploy/
```

See [`BUILD.md`](BUILD.md) for the "edited X → run Y" lookup table, and `./sync-language-packs` after editing a language pack.

## Contributing

AllSpeak is recently open-sourced. Contributions of language packs, plugins, examples, and curriculum are especially welcome — those are the assets that compound. Issues for runtime gaps and ergonomic problems are tracked in [`language-pack-issues.md`](language-pack-issues.md).

## Origin

Forked from [EasyCoder](https://github.com/easycoder/easycoder.github.io) on 2026-04-06; the original EasyCoder repository continues unchanged as the stable English-only product. AllSpeak adds the multilingual layer and the AI-coding-companion focus.

## License

Apache License 2.0. See [`LICENSE`](LICENSE) for the full text.
