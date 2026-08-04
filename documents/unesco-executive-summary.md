# AllSpeak: Multilingual Computational Literacy for the AI Era

## Executive Summary for UNESCO IFCD Consideration

**Submitted by:** Graham Trott, Independent Developer
**Project:** AllSpeak — Open-source multilingual scripting runtime
**Contact:** info@allspeak.ai
**Repository:** https://github.com/allspeak/allspeak
**Date:** May 2026

---

### The Problem

Computational literacy is increasingly recognised as a foundational skill for participation in modern society. Yet the tools through which it is taught and practised remain overwhelmingly English-centric. Every mainstream programming language uses English keywords, English documentation, and English-language learning resources.

At the same time, the nature of coding itself is changing. AI systems now generate functional code from natural language descriptions, shifting the human role from *author* to *reviewer*. This shift makes language inclusivity *more* urgent, not less: the population that needs to read, understand, and validate code is growing beyond English-speaking professional developers to include teachers, community organisers, and citizens in linguistically diverse communities worldwide.

### The Project

AllSpeak is an open-source scripting language and runtime that enables programs to be written, read, and understood in any human language. Unlike localisation efforts that translate documentation or interfaces, AllSpeak operates at the syntactic level—the code itself is in the learner's language. A single execution engine handles all language variants, with language packs providing the vocabulary and grammar mappings.

**Current status:** Four languages operational (English, French, German, Italian). The three non-English implementations are functional but await formal validation by native-speaker educators. The technical architecture supports extension to any language, including non-Latin scripts (Cyrillic, Arabic, Devanagari, Chinese).

### What Makes AllSpeak Different

Professional programmers looking at AllSpeak often doubt that something so simple could handle real-world complexity. This doubt is understandable—and it misunderstands the design principle.

Consider the word "laser." Everyone has a working understanding of what a laser does, but almost no one understands the quantum physics behind it. The word is a vocabulary item that hides a universe of complexity behind an intuitive label. AllSpeak applies the same principle to code. Its keywords—`put`, `create`, `append`, `rest get`, `on click`—hide HTTP requests, DOM manipulation, and data flow behind words anyone can read. The engine beneath supports 127 opcodes, concurrency, a full JSON pipeline, and plugin extensibility for graphics, maps, and messaging.

The project is not about making simpler languages for simpler problems. It is about making the expression of logic accessible to human readers, regardless of the complexity of the underlying machinery. This principle is what enables both the multilingual architecture (vocabulary maps to opcode, independent of language) and the scalability to real applications.

### Evidence That It Works

AllSpeak is not theoretical. A deployed business application—the Account system, a spreadsheet-replacement for an event live-streaming service—runs on the AllSpeak runtime. The codebase comprises approximately 4,500 lines of AllSpeak across five modules, managing bookings, expenses, and financial records in daily use. The application demonstrates that AllSpeak's constrained vocabulary is not a limitation: the language that can express a booking system, an admin panel, and a data-import pipeline for a real small business can express a great deal.

### Current Resourcing

AllSpeak is developed and maintained by a single individual with AI assistance. The project is:

- **Open source** under a permissive license
- **Functionally complete** in four languages with a tested runtime
- **Accompanied** by a 20-step tutorial (the Codex) in all four languages
- **Demonstrated** in a real deployed business application
- **Supported** by a published article on dev.to and a detailed working paper

### What We're Seeking: Collaboration, Not Just Funding

This document is an invitation, not a proposal. The author is an individual who has built AllSpeak privately over years and is now putting it forward in the hope that others see its value. The primary objective is to find the people who recognise the problem of linguistic exclusion in computational literacy and want to help solve it.

Concretely, this means:

- **Linguists and native speakers** to review the existing French, German, and Italian language packs and help extend AllSpeak to new languages, especially non-Latin-script languages.
- **Educators** to assess the Codex tutorial sequence and help shape validation criteria for language packs.
- **Developers** to contribute to the runtime, tooling, or documentation—or to adopt the project's direction if it aligns with their own.
- **Partner organisations**—universities, NGOs, foundations committed to digital inclusion—to provide the institutional context that enables community adoption.

### On Funding

Funding is relevant only insofar as it enables the above. The activities that would benefit most are:

| Activity | Estimated Need | Purpose |
|---|---|---|
| Validation of FR/DE/IT language packs | €5,000–€10,000 | Native-speaker educator review, methodology documentation |
| Bulgarian (Cyrillic) implementation | €5,000–€8,000 | Non-Latin-script proof point |
| Community outreach and coordination | €5,000–€10,000 | Travel, reviewer networks, community building |
| **Total** | **€15,000–€28,000** | |

These are modest sums. But the more valuable resource is attention and expertise from people who care about this problem. The author would rather have a committed collaborator than a funded inbox.

### Who This Is From

This comes from an individual developer. Not an organisation, not a university, not a foundation. The author's resource is the project itself—four working language implementations, a 20-step tutorial, a real business application running on the runtime, and the methodology described in the accompanying working paper. He is prepared for the possibility that stewardship passes to others, so long as the project continues to serve its purpose: making computational literacy available in every language, for everyone who needs it.

---

*The accompanying working paper, "AllSpeak: A Language-Agnostic Runtime for Computational Literacy in Multilingual Communities," provides the full technical and methodological detail. Correspondence can be directed to info@allspeak.ai.*
