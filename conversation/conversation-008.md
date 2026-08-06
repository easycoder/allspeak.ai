# 2026-08-06

## 22:11

I would like to rearrange the tabs/buttons on the AllSpeak website. Presently they are Start, Example, AI Manual, Codex but I would like them to be Start, Example, Learn, Codex, AI Manual. The new Learn button calls up the learn/ reference manual, which deserves greater visibility than it has at present.

**Assistant**

Found the tabs in the primer page (primer/project.json + primer/project.as). Asked the user whether the change should apply to the translated de/fr/it primer copies too; they chose English only (Learn tab added to English until the whole thing is translated).

Changes:
- primer/project.json: added $TabLearn (label "Learn"), reordered TabBar to Start, Example, Learn, Codex, AI Manual.
- primer/project.as: declared/attached TabLearn, added on-click handler navigating to `../learn/` (the learn/ reference manual reader), reset its highlight in ShowStartTab/ShowExampleTab/ShowManualTab.
- Ran ./deploy-sync to regenerate deploy/en/primer/project.json and deploy/shared/primer/project.as.
- de/fr/it primer copies left untouched per user decision.

## 22:15

Near the top of the AllSpeak Learn page there is a link to https://allspeak.ai/learn/README.md, but this does not appear to exist. Is this unfinished work?

**Assistant**

Investigated: the file exists and is served — https://allspeak.ai/learn/README.md returns 200 (text/markdown), and README.md is synced into deploy/learn/ by deploy-sync. The link appears broken because of the click shim in learn/index.html: it intercepts every relative .md link inside #content, stashes a bare slug, and asks the reader to navigate. README.md is not in manifest.json, so the reader alerts "Page not found: README" — which reads as "does not exist" even though the URL works.

Fix: learn/index.html shim now only intercepts .md links containing a path separator (i.e. curriculum pages under reference/ and idioms/). Root-level .md files like README.md are left for the browser to load normally. Synced to deploy/learn/index.html via ./deploy-sync.

## 22:35

Actually, the same problem appears in numerous places, for example 'See plugins' or 'See multilingual'. These will be seen by visitors as destinations of interest, so they should really render usefully. Can you scope this?

**Assistant**

Scoped: audited all 98 unique link targets (220 occurrences) in learn/. Root cause: the reader's click shim decided what to intercept by link shape, not by "is this a curriculum page". My earlier directory-heuristic had also stopped routing bare links like plugins.md, so they 404'd. Plan approved and implemented:

1. Manifest-aware shim (learn/index.html + deploy copy): intercepts exactly .md links whose slug is in manifest.json; everything else (README.md, external, same-page anchors) falls through to the browser. Fragment-aware so page.md#section links route to the page. Restored all 31 bare curriculum links + anchored variants.
2. Repointed two links that can't render in the reader: 13-plugins.md spec link → GitHub blob URL (200), 10-writing-language-neutral.md codex link → /codex.html (200).
3. Added tools/learn-link-check.py regression guard (local tool like asdoc-check.py; tools/ is gitignored): flags any .md target whose slug is missing from manifest.json. Real tree: 0 errors; planted broken link caught with exit 1.
4. deploy-sync run; source and deploy trees byte-identical for all changed files; /learn/README.md still 200.

Known limitation noted: MarkdownRenderer emits headings without ids, so same-page #anchors and the section part of page.md#section links don't scroll — the page opens, the section jump is a no-op. Would need runtime heading ids for true anchor jumps.
