# 2026-08-03

## 11:11

At the bottom of the AllSpeak home page are links to "Change language" and "Primer". I would like these to also be buttons at the top of the page, to avoid the need to scroll to the bottom each visit.

**Assistant**

The home page is deploy/shared/home.as, which renders home.md (content) and nav.md (the bottom "Change language" / "Primer" links) — each of the four languages (en/de/fr/it) has its own copy of those files. After confirming the design choice (bottom stays plain links), I made:

- deploy/shared/home.as — new TopNav section between the header and the content, loading a new topnav.md file with the same two destinations.
- deploy/{en,de,fr,it}/topnav.md — new files with button-styled links (each language's wording), matching the site's dark theme (cyan text, dark button background, rounded border).
- Bottom nav.md links left exactly as they were.

Verification: compiled deploy/shared/home.as against the shipped deploy/dist/allspeak.js runtime in a headless Node harness (initial harness failures were due to the language pack not being initialised outside window.onload; fixed by calling AllSpeak_Language.init like AllSpeak_Startup does) — compiles cleanly, no errors.

Note: deploy/dist/allspeak-min.js and the allspeak-*.zip starter packs were already modified in the working tree from earlier work — not touched here. The GitHub deploy workflow rsyncs deploy/ as-is, so these committed changes ship directly.
