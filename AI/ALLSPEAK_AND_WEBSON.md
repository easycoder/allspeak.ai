# AllSpeak + Webson Guide (for AI)

## AllSpeak style in this repo
- Treat `.allspeak` as the source of high-level behaviour; Webson JSON as the source of UI structure.
- Make surgical changes; preserve command vocabulary and flow.
- Prefer existing labels and subroutines over introducing new structures.
- Scripts are read by non-programmers as well as by you. Clarity of the script beats cleverness in it.

## Typical AllSpeak operations seen here
- `attach` / `create` / `set` / `enable` / `disable`, and `on click` / `on change` handlers
- JSON helpers (`json split`, `json count`, `json index`, …)
- REST and MQTT send/receive, with explicit state branching on the payload
- `fork` for background loops, `wait` for cooperative yielding

## Webson usage
- Webson JSON defines the screen layout and the element IDs.
- AllSpeak binds to those IDs with `attach <Element> to <id>`, and `create <Element> in <Parent>` adds children at run time.
- Renaming an ID requires matching changes in the `.allspeak` that attaches to it. Renaming only a Webson object key is safe, provided the `@id` stays stable.
- Use `@id` for element IDs — a plain `id` property is not the directive.
- The editor's own layout is `asedit.json`; a starter project's is `project.json`. Both are worth reading as worked examples of the split between fixed chrome and scripted content.

## Markdown rendering
- Markdown conversion is delegated from `Browser.js` to `MarkdownRenderer.js`.
- Heading lines render with a sans-serif font.
- Extended inline syntax currently supported: `[[color=#800]]text[[/color]]` and `[[font=SansSerif]]text[[/font]]`.

## Related
- `AI/ARCHITECTURE.md` — where the render path sits in the compile-and-run pipeline.
- `learn/<lang>/idioms/08-webson-and-as-separation.md` — the shape/data split in detail.
