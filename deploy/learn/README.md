# AllSpeak `learn/`

The AllSpeak curriculum — a small in-browser reader that serves a set of markdown pages organised into two tiers:

- **Reference** (`reference/`) — *what is this thing in AllSpeak?* Symbols, variables, control flow, modules, plugins, the doc-block convention. Encyclopedic; stable.
- **Idioms** (`idioms/`) — *how do I do X the AllSpeak way?* Patterns with worked examples and explicit anti-patterns.

`contents.md` is the human-readable landing page that links into both tiers. `manifest.json` is the same list in machine-readable form — it drives the reader's Prev/Next navigation and slug resolution.

## Viewing it

Run the project's dev server from the repo root and open `learn/index.html`:

    allspeak server.as

then visit `http://localhost:8080/learn/index.html`. The reader is itself an AllSpeak app (`reader.as` + `reader.json`) — the toolbar (Contents · Prev · Next) and the rendered markdown pane are produced by AllSpeak code running on the same engine the curriculum describes.

## Files

| File | Role |
|--|--|
| `index.html` | Loads the AllSpeak runtime and `reader.as`; defines the JS shim that intercepts in-page link clicks and routes them to the reader |
| `reader.as` | The reader app — toolbar handling, manifest lookups, markdown rendering, slug-based navigation |
| `reader.json` | Webson layout for the reader's DOM |
| `manifest.json` | Ordered list of pages (slug, path, title) — the source of truth for Prev/Next order |
| `contents.md` | Landing page, rendered when the reader has no current page (`CurrentIndex = -1`) |
| `reference/NN-*.md` | Reference pages |
| `idioms/NN-*.md` | Idiom pages |

## Adding or editing a page

1. Write or edit the markdown under `reference/` or `idioms/`. The filename prefix (`NN-`) is for human ordering on disk; the reader doesn't depend on it.
2. If you added a new page, append an entry to `manifest.json`:

       { "slug": "my-new-topic", "path": "idioms/14-my-new-topic.md", "title": "My new topic" }

   The slug must be unique across the whole manifest — it's what the URL fragment and inter-page links resolve to.
3. Add a one-line entry to `contents.md` in the appropriate section so the landing page links to it.

Pages can link to each other by slug — the JS shim in `index.html` intercepts any link whose `href` matches a manifest slug and tells the reader to navigate, rather than letting the browser follow the link.
