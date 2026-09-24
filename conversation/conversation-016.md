# 2026-09-21

## 17:26

I've had a positive response from UNESCO to my approach. See documents/Response-to-UNESCO-approach.pdf. Can you suggest how I should handle this?

**Assistant**

Read the PDF, plus the existing outreach material (`outreach-plan.md`, `revised-approach-letters.md`, `unesco-executive-summary.md`, `godoi-approach-revision-2.md`) so the advice fits the project's positioning, and verified the two UNESCO calls are live and open.

Two findings that change the picture. First, both calls are real and current: the 6th consultation on the 2003 Recommendation has a questionnaire open until **28 February 2027**, and the IDIL mid-term mapping form has no published deadline but feeds a 2027 milestone. Second, the two colleagues cc'd on the reply are not a deflection — Xianhong Hu owns Internet Universality ROAM-X, Universal Acceptance/multilingualism and IDIL at UNESCO, which is almost exactly the intersection AllSpeak sits in.

The core reading: the reply is positive but non-committal. Three ways in, no funding, no endorsement, no partnership. Treat it as a door opened by a Director, and specifically do not let it become a claim of UNESCO support. The strongest of the three openings is the 2003 consultation, because it is the only one producing a citable artefact — contributions are compiled into a consolidated report going to the Executive Board (227th session) and General Conference (44th session), both Autumn 2027. The real prize is the meeting, since the policy-brief line is where something durable could come from.

Wrote two documents. `documents/unesco-engagement-plan.md` covers what the reply is, the strategic opening to lead with (UNESCO's multilingualism agenda covers content, interfaces, translation and domain names — none of it covers the programming language itself), a sequenced plan of action, the IDIL question, meeting preparation, what not to do, and success markers. `documents/unesco-reply-draft.md` is a reply-all draft with drafting notes and a pre-send checklist.

The two judgment calls flagged rather than made: the IDIL form is a mapping exercise for *planned* activities, and AllSpeak has no Indigenous-language activity, so the recommendation is to ask Hu whether an accurate listing is possible rather than submit a thin entry or retrofit the project's framing to chase the window. And the meeting slots in the draft are placeholders because only Graham can offer his own availability. Also created `conversation/conversation-016.md` for today's session.

## 17:29

Next: The one-page UNESCO-facing note (chosen from the follow-up options).

**Assistant**

Wrote `documents/unesco-one-pager.md` — a meeting pre-read in UNESCO's vocabulary, structured as: the gap (the layer of language nobody has addressed is the one people read and write logic in), what AllSpeak is, evidence, points of contact with the four UNESCO frames (2003 Recommendation, ROAM, Universal Acceptance, Global Roadmap), and one explicit question. Deliberately kept understated — it states plainly that the project is unfunded and seeks collaborators rather than funding, and that the three non-English packs await validation.

Getting it onto one page needed a tooling change. `documents/md-to-html.py` generates the title-page layout used for the whitepaper (h1 margin-top 3cm plus h2 margin-top 1.5cm each), and a brief of this length runs to two pages under it. Rather than cut the note's substance, added an opt-in `--compact` flag that tightens the heading and paragraph spacing. Verified the default path is byte-identical to the previous output by diffing old and new script output on the same input, so `whitepaper.html` and anything else built with it is unaffected. Rendered A4, confirmed one page via pdfinfo, and inspected the page image to check it isn't cramped. One bug caught on the way: the injected CSS initially had doubled braces (valid inside the template f-string, invalid as a standalone string), which silently produced no effect at all — the two-page result gave it away.

Also updated `documents/unesco-engagement-plan.md` §5 to point at the note and record the rebuild command. `documents/unesco-one-pager.html` and `.pdf` are the printable artefacts.

## 20:27

Your reply draft refers to a questionaire, but I can't see a reference to it anywhere. Can you explain?

**Assistant**

Traced it. The word appears nowhere in the PDF — the email says "Call for contributions" with the URL carried as a hyperlink, and the PDF was printed from a mail client, so the links were flattened: styled blue text survives, the targets do not. I confirmed by extracting the link annotations; the only remaining targets are the plain-text ones in the body (DOI, video, repository, mailto). "Questionnaire" is the mechanism described on the destination page, which I found by search.

That audit turned up three genuine problems beyond the one asked about, all fixed:

1. The engagement plan named the Executive Board's 227th session and the General Conference's 44th session as where the 2027 report lands. That came from a search summary, not a UNESCO page, and is not on the authoritative monitoring page for the instrument (`en/node/104380`). Removed; recorded why, and noted that what *is* documented is the Executive Board's 224th session (April 2026) examining the preparation.
2. The plan said IFAP National Committees exist in "~50 countries". UNESCO's own page counts **23 active**. That was the historical figure, wrong by a factor of two. Corrected, with the consequence that a university is probably the better fiscal host than a committee.
3. The draft opened the IDIL paragraph with "I have read the call and the Concept Note" — a claim on Graham's behalf that had not been checked, since I had only located the Concept Note, never read it. Cut to "I have read the call", with a checklist item to restore it if he does read the document.

Also found that UNESCO's own pages disagree on the submission date: the news article says 28 February 2027, the monitoring page says 27 February. Changed the email to "the February deadline" so it does not assert a day the recipient may not recognise, and recorded both dates in the plan. Added the consultation secretariat address for the individual-vs-organisation question the draft raises. And added a sourcing table to the plan separating what I read from a UNESCO page from what came only from search summaries — notably Dr Hu's portfolio and Godoi's full title, neither of which should be relied on in anything sent. Reworked the draft to mirror the recipient's own term ("the call for contributions") rather than introducing "questionnaire", and added a provenance section plus a pre-send check to open both invitation links from the original email and confirm they match the pages cited.

## 20:38

It's not just PDF; the references in the email are not hyperlinks either. Can you post the links you discovered?

**Assistant**

Corrected the diagnosis in both documents. My earlier explanation — that printing the email to PDF stripped the hyperlinks — was wrong: the email itself carries no URL for either invitation, in the body or as a target. The PDF is consistent with that, its only link annotations being the plain-text ones in the message body. Rewrote the provenance sections in `unesco-engagement-plan.md` §1 and `unesco-reply-draft.md` to state that, and dropped the "printed from a mail client" claim and the checklist item that told Graham to open links from the email.

Posted all ten links, and re-checked each one live first. Every unesco.org page resolved HTTP 200 with the expected title, and both Microsoft Forms URLs resolved 200 as "Microsoft Forms". The two unesdoc.unesco.org documents (Concept Note, Global Action Plan) return 403 to a script — Cloudflare bot protection, not missing documents — so the plan records that honestly rather than claiming a clean pass, and the reply draft no longer says "all confirmed live" bare.

The plan's Links section is now a table with per-link verification status, and the audit table below it was trimmed to the genuinely weak claims, since the links table now records which pages were read in full; what remains marked as search-derived only is the IFAP committee count, Xianhong Hu's portfolio, Godoi's IFAP role, and Godoi's full division title.

One reliability note: unesco.org began refusing repeated fetches of the article pages partway through this work (http=000, connection reset) while the site root still answered, so the article pages could not be re-fetched to re-extract the form URLs. Those two form URLs are transcribed from the page markup extracted on the first pass rather than from a fresh fetch; both were independently confirmed live. Left that distinction in place rather than papering over it.
