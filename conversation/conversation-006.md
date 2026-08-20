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

## 14:19

There's now a recording of the primer example being run, at https://www.youtube.com/watch?v=BSvh4MPEzV4, so I'd like to see it referred to at "What to look for". The recorded run didn't encounter any problems (which kept the video short) but in practice "your mileage may vary", which leads into the points made in the final couple of paragraphs.

**Assistant**

The primer's canonical source is primer/tab2.md (deploy-sync mirrors it to deploy/en/primer/; de/fr/it primer copies are separately translated and untouched by deploy-sync). Added a paragraph to the "What to look for" section, between the "review what the AI created" paragraph and the closing "a few small things may need correcting" paragraph, linking the YouTube recording and noting the run needed no fixes (hence the short video) but "your mileage may vary" — which leads straight into the existing final paragraph. Ran ./deploy-sync to mirror; confirmed primer/tab2.md and deploy/en/primer/tab2.md are identical and only those two files changed. The de/fr/it translated copies were left alone.
