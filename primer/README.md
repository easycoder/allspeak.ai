# The Primer page

`project.allspeak` is the page's script, `project.json` its Webson layout and `strings.json` its strings. This source is the English tree; `./deploy-sync` copies all of it to `deploy/en/primer/` (excluding this file and `project.allspeak`, which the page fetches from `deploy/shared/primer/` — one canonical copy for all four languages).

The three tab bodies are markdown, rendered by the runtime because `StartCard` and `ExampleCard` carry `@data-markdown: 1`:

- `tab1.md` — **Why**: what AllSpeak is and why it exists. No instructions.
- `tab2.md` — **Get started**: setup, the colour-grid prompts, and what to look at in Viz. Self-contained on purpose — it is the tab a new reader is sent to.
- `tab3.md` — the AI Manual overview, with `ch01..ch08.md` beside it.

`duckthink.png` is the title bar's logo.

For a reader, the entry point is <https://allspeak.ai/en/primer.html>.
