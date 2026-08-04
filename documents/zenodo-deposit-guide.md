# Zenodo Deposit Guide — AllSpeak White Paper

**Prepared:** 31 July 2026
**Purpose:** Everything you need to fill in the Zenodo upload form, copy-paste ready.

---

## Recommended deposit strategy

| Step | Action |
|---|---|
| 1 | Create a Zenodo account (free) at https://zenodo.org — sign in with your email or GitHub/ORCID |
| 2 | Create your own community: click **+** (plus icon, top right) → **New community** → name it **AllSpeak** → identifier (slug): `allspeak` |
| 3 | Deposit the whitepaper PDF via **New upload** (top right) |
| 4 | During the upload form, select your **AllSpeak** community in the Community field |
| 5 | Publish — you get a DOI immediately (also supports a "reserve DOI" option before publishing) |
| 6 | Add the DOI to the whitepaper footer and to your approach letters |

**Why not the existing communities?** None is a close thematic match, and several have closed curation policies where a curator must approve each submission. Your own community gives immediate acceptance and becomes the home for future deposits (validation reports, methodology paper, dev.to article PDF) — building a citable body of work.

---

## Deposit form fields — copy-paste ready

### 1. Resource type

> **Publication** → **Preprint** (a preprint is the honest category for a white paper; alternatively "Technical report" — the choice is not critical, both are fine. I recommend **Preprint**.)

### 2. Title

> AllSpeak: A Language-Agnostic Runtime for Computational Literacy in Multilingual Communities

### 3. Authors

| Given name | Family name | Affiliations | ORCID |
|---|---|---|---|
| Graham | Trott | (independent developer) | — |

*Note: Zenodo recommends linking an ORCID iD. Creating one is free at https://orcid.org — worth doing, it makes you identifiable as the author across deposits.*

### 4. Description (abstract) — copy verbatim

> Language is the foundation of human development. It is what enables us to convey ideas, share knowledge, and build on the discoveries of those who came before us. Since the industrial age, we have extended language into new forms—programming languages that instruct and control the machines we build to serve us. Software engineering, expressed in these languages, now underpins the whole of modern society.
>
> We are now creating new forms of intelligence, expected before long to transform every part of our existence. If humans are to retain a relevant role, we must learn to interact usefully with these entities. The traditional programming languages cannot serve this purpose alone: they exclude most of the world's population from the process, because they are expressed in English and designed for human authors, not human readers.
>
> AllSpeak is an open-source runtime designed to be a lingua franca—a common language comprehensible to both humans and AI, available in any human tongue. Its programs are intentionally simple, constrained, and readable, not because the problems they address are trivial, but because legibility is the design goal that makes human oversight possible. A codebase that no human can meaningfully inspect is not a managed system; it is an autonomous one, operating on trust. In high-stakes domains—automation, finance, health, infrastructure—that is a governance problem as much as a technical one.
>
> This paper describes AllSpeak's architecture, its current implementation in four languages, and the methodology developed for extending it to new linguistic communities. It argues that as AI-generated code becomes ubiquitous, the humans who need to understand it will be a different population from those who once wrote it—less technically trained, more linguistically diverse—and that the tools available to them should reflect that reality.

### 5. Keywords (comma-separated)

> multilingual programming, computational literacy, language inclusivity, AI-generated code, code comprehension, digital inclusion, language-agnostic runtime, open source, computer science education, natural language programming

### 6. Language

> English

### 7. Licence

> **Creative Commons Attribution 4.0 International (CC-BY 4.0)**
> *(This is the recommended choice for a white paper — allows anyone to share and adapt with attribution. If you prefer no derivatives: CC-BY-SA 4.0. Do NOT use "All rights reserved" — it defeats the purpose of open dissemination to funders.)*

### 8. Access right

> **Open Access**

### 9. Upload the file

> `documents/whitepaper.pdf` (the PDF you produce from `whitepaper.html` via browser Print → Save as PDF)
>
> Recommended filename: `allspeak-whitepaper-v1.pdf` (include version in the filename — Zenodo keeps every version)

---

## Additional recommended fields

### Related works / links

Add these in the "Related works" or "Related identifiers" section of the form:

| Type | Identifier | Description |
|---|---|---|
| Is supplement to / Related to | https://github.com/easycoder/allspeak.ai | Project source repository |
| Related to | https://allspeak.ai | Project website |
| Related to | dev.to article "AI Doesn't Need Your Programming Language" | Public-facing companion article |
| Related to | https://github.com/easycoder/stream | Account application (case study in §7.2) |

*If the form asks for DOI vs URL format, use the URL form for these.*

### Version

> v1.0.0 (first published version)

### Contributors (optional)

> None at this stage — single author.

### Funding information

> Leave blank. This paper is not yet grant-funded, and entering "no funding" is honest and correct.

---

## After publishing — housekeeping

1. **Copy the DOI** (format: `10.5281/zenodo.XXXXXXX`)
2. **Update the whitepaper** — add a line under the author block:
   > **Cite as:** Graham Trott (2026). *AllSpeak: A Language-Agnostic Runtime for Computational Literacy in Multilingual Communities*. Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX
3. **Update the approach letters** — replace the `[Zenodo DOI link]` placeholder in `documents/revised-approach-letters.md`
4. **Update the outreach plan** — mark the Zenodo step as done in `documents/outreach-plan.md`
5. **Add the DOI to the repository README** for visibility

---

## When a new version of the paper is published

1. Open your existing deposit on Zenodo
2. Click **New version** (keeps the same DOI prefix, adds a version suffix — e.g. `10.5281/zenodo.XXXXXXX` with version indicator)
3. Upload the new PDF
4. Update the version field to `v1.1.0`, `v2.0.0`, etc.

This preserves the citation trail — old versions remain citable, new versions remain findable.

---

## Common mistakes to avoid

- ❌ Uploading a Markdown or HTML file instead of a PDF — Zenodo accepts PDFs most cleanly
- ❌ Using a personal name with no affiliation — fine for you, just fill in what you have
- ❌ Forgetting the licence — always choose CC-BY 4.0 for open dissemination
- ❌ Publishing immediately without reviewing the preview — use the "Save draft" then review before "Publish"
- ❌ Depositing into the wrong community (e.g. the EU energy "Aurora" community) — use your own `allspeak` community
