# 2026-08-09

## 15:47

The AllSpeak whitepaper cites the Doclets project as an example. There is now a published article, at https://dev.to/gtanyware/ai-writes-the-code-humans-review-it-review-is-the-coming-skill-330i, that in part describes Doclets, after arguing that coding systems should cater for review rather than just coding.

**Assistant**

Added the new article to the whitepaper. §7.3 ("The dev.to articles: public positioning") now cites it alongside "AI Doesn't Need Your Programming Language", summarising its review-first argument and its use of Doclets (§7.2) as the working example, with the article URL. Regenerated `documents/whitepaper.html` with the canonical `python3 md-to-html.py whitepaper.md whitepaper.html` — this also restored §7.4 (Video demonstration), which was present in the .md but missing from the hand-synced HTML, and re-rendered the §7.2 code blocks via codehilite. Fact-checked the new paragraph against the article before writing it. Left the pre-existing `.reasonix/desktop-*.json` modifications untouched; not committed.

## 15:53

Yes, adding it to the website is a good idea.
I can't remember what the Reasonix JSON mods were. Can you remind me?

**Assistant**

Added a "Read more" section to `resources/md/doclets.md` linking the dev.to article, mirroring its Doclets claims (AI writes, humans review block by block; customising means recognising and adjusting existing code). The page is fetched at runtime by `resources/ecs/doclets.as`, so the .md edit is all that's needed.

The Reasonix JSON mods are harmless bookkeeping: `.reasonix/desktop-topic-*.json` records one entry per desktop-session conversation — created-at timestamp, title, and title source (manual/auto). The diff simply appends two new conversations: "Title screen for video" (Aug 7, manual) and "Whitepaper" (Aug 9 — this session, manual). No content, purely additive metadata; safe to leave or commit.

## 15:52

Yes, let's commit and push to keep the repo up to date

**Assistant**

Committed everything (whitepaper.md, whitepaper.html, resources/md/doclets.md, conversation log, .reasonix bookkeeping) as `b692bc6 2608091552` and pushed to origin (master: 1f63d62..b692bc6).

## 15:56

That's all for this session - a short one this time. I'm hoping to have the YouTube video ready in a day or two, so we'll resume then.

**Assistant**

Noted — see you in a day or two. When the video is ready, the whitepaper §7.4 placeholder (https://www.youtube.com/watch?v=XXXXXXX) needs the real link; the demo-video item in documents/doclets-feature-checklist.md tracks that follow-up.
