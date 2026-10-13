# The Primer page

**Four trees, one per language**, and the English one is at the root:

```
primer/            English  -> deploy/en/primer/
primer/fr/         French   -> deploy/fr/primer/
primer/de/         German   -> deploy/de/primer/
primer/it/         Italian  -> deploy/it/primer/
```

`./deploy-sync` mirrors each into its page directory — the four `run_sync` lines are in that script, and the language trees are excluded from the English one so they cannot land in the wrong page directory. The layout is the one `learn/` uses, and it was adopted on 2026-10-13 for a reason worth keeping in view: **before that the three translated trees existed only under `deploy/`**, so nothing mirrored them and nothing flagged them, and three of them came to teach a setup command that the English page had already replaced. A source tree the sync owns is what makes that drift visible.

**`project.allspeak` is English-only and shared.** All four `primer.html` loaders fetch `deploy/shared/primer/project.allspeak`, so it is not in the language trees; `deploy-sync` copies it there from here.

Every tree holds the same fifteen files:

- `project.json` — the Webson layout, and the tab bar's labels, which are per-language strings.
- `strings.json` — the page's title and the Manual's status lines.
- `tab1.md` — **Why**: what AllSpeak is and why it exists. No instructions.
- `tab2.md` — **Get started**: setup, the colour-grid prompts, and what to look at in Viz. Self-contained on purpose — it is the tab a new reader is sent to.
- `tab3.md` and `ch01..ch08.md` — the AI Manual.
- `color-memory.png`, `duckthink.png` — the worked example's screenshot and the title bar's logo.

The tab bodies are markdown, rendered by the runtime because `StartCard` and `ExampleCard` carry `@data-markdown: 1` — so a paragraph must be a single line, or the renderer turns it into several.

**Translating is a pass over these trees, not an edit to `deploy/`.** For a reader, the entry points are <https://allspeak.ai/en/primer.html> and the same path under `/fr/`, `/de/` and `/it/`.
