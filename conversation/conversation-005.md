# 2026-08-02

## 14:58

I've been working on "doclets" (~/dev/doclets) - a tool for creating and managing textual documents in a small team environment, including effective use of a local LLM - and it's emerging as a good example of how to use AllSpeak effectively. I think it should become the primary working example in places such as the whitepaper and on the website. Here are some notes created by the agent. Can you examine them and recommend how best to make use of the project to benefit AllSpeak generally.

[Pasted text #1 · 13 lines]

--- Begin [Pasted text #1 · 13 lines] ---
Paragraph for the AllSpeak project

Doclets is a good example of an AllSpeak application because it exercises the whole model in one small system. The browser client (doclets.as) and the MQTT-connected server (docletServer.as) are both written in AllSpeak, so a single person can understand and change the entire stack — UI, messaging and backend — without a conventional web framework or a separate client language. Screens are defined declaratively in Webson JSON, and the one piece that is genuinely heavy, managing and searching a growing collection of Markdown notes (now with optional local-LLM query support), lives in a custom plugin that exposes simple AllSpeak commands such as doclets query and doclets topics. And because AllSpeak separates language from logic, the same application could be presented in French, Arabic or any other language via a language pack — a property central to AllSpeak's mission of supporting language diversity, and one that makes Doclets a natural demonstration of it.

And the "key features that make the approach attractive" summary (for when you need it):

One language, full stack — client and server both in AllSpeak; one codebase to learn, audit and modify.
Declarative UI via Webson — screens are JSON, so an AI tool or non-specialist can produce or adjust them easily.
MQTT request/reply — low-latency communication between browser and server, works on phones, no polling, no API layer to hand-write.
A clear plugin boundary — heavy logic lives in a native plugin behind simple script commands; you can see exactly where the scripting language stops and the host runtime begins.
Genuinely incremental — semantic LLM search and per-topic access control were added as features, not rewrites; the architecture absorbed both.
Fits small teams — token-based identity, browser-only client, and a single Python process + static host to run.
Multilingual-ready — the same .as logic runs under any language pack, which is precisely the UNESCO-relevant property.
--- End [Pasted text #1 · 13 lines] ---

**Assistant**

Examined the notes against both codebases (doclets at ~/dev/doclets, whitepaper at documents/whitepaper.md, website at resources/). Notes verified accurate, with two wording caveats: (1) the multilingual claim overstates language packs — they localize keywords, not app strings/script text, and Arabic isn't yet supported; (2) "one person can change the entire stack" is true because the stack is deliberately small — phrase as a design property. Recommended: make Doclets the primary §7.2 case study (Account becomes the scale data point), cite `doclets query` as the laser-principle example, add a website page following the site's own module pattern, use Doclets as the plugin-contract worked example, and build a French client as the multilingual proof point. Offered to draft §7.2 and the website page.

## 15:07

Yes. And maintain the prerequisites somewhere they can't get ignored/forgotten.

**Assistant**

Drafted and applied: (1) whitepaper §7.2 rewritten — Doclets primary case study, Account demoted to a scale data point; (2) new website page `resources/md/doclets.md` + `resources/ecs/doclets.as` (module following howitworks.as pattern), wired into `resources/ecs/main.as` (Doclets nav button, module load, deselect); (3) Doclets added to `resources/md/examples.md` list + section; (4) `documents/doclets-feature-checklist.md` created as the authoritative prerequisites tracker (claims/copy rules, artifacts, deploy, follow-ups: French client, plugin-contract example, conformance test, video); (5) `documents/outreach-plan.md` state line updated; (6) project memory saved (project/doclets-primary-example.md). Also discovered `documents/whitepaper.html` was stale (still had the old Account §7.2) and hand-synced it to match the new .md §7.2 — canonical regeneration via `documents/md-to-html.py` is recorded in the checklist (sandbox lacks the `markdown` pip package). `whitepaper.pdf` regeneration remains a checklist item.

## 20:45

Closing here - will resume later

**Assistant**

Session closed. State for resumption: all edits committed to the working tree (not committed to git); prerequisites tracked in `documents/doclets-feature-checklist.md`; memory `project/doclets-primary-example.md` points to it. Suggested next steps on resume: review the doclets.md page copy + §7.2 excerpts, regenerate `whitepaper.pdf`, deploy the website, screenshots.

## 11:37

Coming originally from Claude Code, I used Reasonix CLI for a while, but recently discovered Reasonix-desktop, which I find to be easier to use (I am not a committed console warrior). Given that AllSpeak itself is in large part about making life easier, I feel it should be the desktop version that is featured in the Primer. This impacts the Getting Started section. The Claude Code option can stay as it is, but the AlSpeak + Reasonix section needs updating.
Step 1 is fine.
Step 2 should move to follow what is now step 6
Step 3 is fine
Step 4 needs to refer to the Reasonix website at reasonix.io and tell users to select the "Download desktop" option.
Step 5 needs revising as the .reasonix folder will have been created in step 4.
Step 6 needs revising as there will only be a single terminal tab in use during a session; the one that runs server.as.
The current Step 2 will be moved here.
Step 7 will just be the instruction to start up reasonix-desktop (most users will probably add it to their Start menu).
A new step will instruct the user to click "Add new project" and navigte to the new folder.
Step 8 is fine

**Assistant**

Rewrote the AllSpeak + Reasonix section of the Getting Started steps in `primer/tab1.md` (source; `deploy-sync` mirrors it to `deploy/en/primer/`). New order: 1) create empty folder (unchanged), 2) pip install allspeak-ai (old step 3), 3) download Reasonix desktop from reasonix.io via "Download desktop" (verified the site's wording), 4) API key into the now-existing .reasonix folder, 5) unzip starter pack (old step 2, moved here) + run `allspeak server.as` in the single terminal, 6) start Reasonix desktop (Start menu note), 7) NEW: click "Add new project" and navigate to the folder, 8) tell Reasonix what to build (unchanged). Intro sentence updated: desktop-first ("a terminal version is also available"). Claude Code route untouched. Note: fr/de/it deploy copies will need the same update via the translation workflow.

## 12:28

Having started a test run, it still doesn't feel quite right. Step 1 should be moved down to just past what is now step 4. And I believe Reasonix looks for .env and if it's not present asks for the API key then writes the file, so no need to add it manually.

**Assistant**

Adjusted the Reasonix steps in `primer/tab1.md` per the test-run feedback: removed the manual API-key step (step 4) entirely, moved "Create an empty folder" down to just past where that step was (now step 3, after the Reasonix download), and renumbered 1-7. Added a short parenthetical to the final step noting Reasonix asks for the DeepSeek API key on first use and saves it. New order: 1) install AllSpeak, 2) download Reasonix desktop, 3) create empty folder, 4) unzip starter pack + run `allspeak server.as`, 5) start Reasonix desktop, 6) Add new project → navigate to folder, 7) tell Reasonix what to build.
