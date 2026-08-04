# AllSpeak — Publication, Outreach, and Timing Plan

**Prepared:** 10 July 2026

## Overview

Four concurrent workstreams, sequenced so that each approach is made when the supporting evidence is strongest.

---

## Workstream A: Zenodo Publication

**What:** Upload the completed whitepaper to Zenodo, obtain a DOI, and — if the Aurora community is the right home — deposit it there.

**Current state:** The whitepaper (`documents/whitepaper.md`) is complete at 6,200 words across 9 sections plus references and appendix. It has the new abstract, the laser analogy, the Doclets application case study (§7.2, with the Account application as a scale data point), and the collaboration-first conclusion. Open follow-ups for the Doclets feature are tracked in `documents/doclets-feature-checklist.md`.

**What's needed:**

1. **Convert to PDF.** The whitepaper is currently Markdown. On a machine with pandoc installed, this is one command:
   ```
   pandoc whitepaper.md -o whitepaper.pdf --pdf-engine=xelatex
   ```
   If pandoc isn't available, a simple HTML→PDF route via the browser (Print → Save as PDF) works fine for Zenodo's requirements — they accept any readable PDF.

2. **Create a Zenodo account** at zenodo.org (free, requires email).

3. **Find the Aurora community** and submit to it. If "Aurora" refers to the Aurora Communities initiative within Zenodo, the deposit form has a "Community" field where you select the community. If it's a different Aurora repository, the same principles apply — DOI, metadata, open access.

4. **Metadata:** Title, author (Graham Trott), date, abstract (from the whitepaper), keywords, license (recommend CC-BY 4.0 for a white paper).

5. **Upload PDF** and supplementary files (the dev.to article, the Account project README — optional).

**Estimated effort:** 1–2 hours, once.

**Result:** A citable DOI that can be referenced in every approach email.

---

## Workstream B: The Video

**What:** Screen capture of the colour grid demo running under AllSpeak, with professional voice-over. Uploaded to YouTube.

**Current state:** The user is already working on this. The colour grid demo is a good choice — it's visual, immediate, and demonstrates that AllSpeak produces real output.

**What's needed:** Completion of recording, voice-over track, YouTube upload, and ideally a short link.

**Strategic value:** A 3–4 minute video is far more effective than a white paper at getting a busy person's attention. The email can say "here's a 3-minute demo" with the YouTube link, and attach the white paper for those who want detail.

**Note:** The voice-over script should lead with the same framing as the abstract (language as foundation, human-AI lingua franca) — not with technical architecture. The first 30 seconds need to answer "why does this matter?" not "how does it work?"

---

## Workstream C: Validation (parallel)

**What:** Execute the validation roadmap for FR/DE/IT.

**Current state:** The validation roadmap exists at `documents/validation-roadmap.md`. No validators identified yet.

**Strategic note:** This is the longest-lead item (8 weeks) and doesn't need to block the UNESCO approach. The approach can say "four languages operational, three awaiting native-speaker validation" — that's honest and shows momentum. A validated language pack is a nice-to-have for the first contact, not a must-have.

---

## Workstream D: Outreach

### Target priority

| Priority | Body | Contact | Readiness needed | Best timing |
|---|---|---|---|---|
| **1** | **UNESCO** | Guilherme Canela (Director) | DOI + video | When video is live |
| **2** | **ITU AI for Good** | Innovation Factory | DOI + video | Next cycle (likely early 2027) |
| **3** | **UNDP** | Accelerator Lab (Francophone) | DOI + video + validated FR | When FR is validated |
| **4** | **UN Global Pulse** | Partnerships team | DOI + video | After any of the above |

### Why UNESCO first

- No application cycle — direct email is the normal approach
- The Global Roadmap on Multilingualism in the Digital Era was published recently and explicitly calls for "inclusive Language Technologies" — AllSpeak is a direct, working implementation of that call
- The Director's contact details are known (g.godoi@unesco.org)
- If the response is positive, that builds credibility for ITU and UNDP approaches

### Why ITU is second, not first

The AI for Good Innovation Factory Summit (7–10 July 2026) closed today. That's the natural entry point and it's passed. The next cycle's dates aren't published yet — typically annual, so likely mid-2027. However, the ITU contact is worth making sooner to understand the timeline, because if submissions open in Q1 2027, you want to be ready.

### Why UNDP and Global Pulse are later

Both respond better to concrete proposals than to introductory emails. Having a Zenodo DOI, a published video, and ideally one validated language pack turns "here's an idea" into "here's what we've done and where we could work together."

---

## The Sequencing

```
Month 1 (July 2026)
├── Zenodo deposit → DOI obtained
├── Complete and upload YouTube video
├── Optional: Send UNESCO email (if video is ready)
└── Identify FR/DE/IT validators

Month 2 (August 2026)
├── UNESCO follow-up if no response within 2 weeks
├── Begin FR/DE/IT validation (if validators found)
├── Enquire about ITU AI for Good 2027 cycle opening dates
└── Prepare ITU submission materials

Month 3+ (September 2026+)
├── Complete validation of one language (likely French or Italian)
├── ITU application if cycle is open
├── UNDP pilot conversation (with validated language as proof)
├── Global Pulse introductory email (if relevant)
└── Update Zenodo whitepaper with validation outcomes
```

---

## What the approach email for UNESCO should contain

1. **Subject line:** Short, specific, references the Roadmap
2. **Opening:** One sentence — who you are, what AllSpeak is
3. **The hook:** "Your Roadmap calls for inclusive Language Technologies — AllSpeak is a working implementation"
4. **Evidence:** Four languages operational, 3-minute demo video link, whitepaper DOI
5. **The ask:** A conversation, not funding. "Is this relevant to your current work?"
6. **Close:** Simple, with links

The revised letter is in `documents/revised-approach-letters.md`.

---

## What success looks like at each stage

| Stage | Success marker |
|---|---|
| Zenodo | DOI assigned, paper publicly accessible |
| Video | YouTube link that can be shared in an email |
| UNESCO | Reply, even if it's "not quite our area but try X" |
| ITU | Application acknowledged, placed in pipeline |
| Validation | Any one of FR/DE/IT validated by a native speaker |
| UNDP | A conversation with an Accelerator Lab lead |
| Global Pulse | A referral to the right person or programme |
