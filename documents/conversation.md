# AllSpeak internationalisation project scope and feasibility  
Shared by Graham  
This is a copy of a chat between Claude and Graham. Content may include unverified or unsafe content that do not represent the views of Anthropic. Shared snapshot may contain attachments and data not displayed here.

>*** AllSpeak Internationalisation***

>***I want to get a feel for the likely size and cost of a UNESCO project to promote/facilitate language inclusivity for coding, using Allspeak or equivalent. Here are some brief notes.***

>***AllSpeak is currently running in 4 languages; English, French, German and Italian. The 3 translations are functional but not yet validated linguistically.***

>***To handle full internationalisation a number of resources will be needed, including***

>** Administration***

>**Overall project management, liaising with language representatives, budgetary allocation.***

>***Technical***
> This is where I see myself in the role of technical coordinator.  
> - Run AI sessions to translate from the reference (English) into each new language.  
> - Deal with issues arising from types of language difference not previously encountered.  
> - Manage Weblate setup and feedback.  
> - Provision server capacity and handle AI resources, particularly where updates need to be implemented across every language variant.

>*** Consultancy***

>***A team that oversees the introduction of AllSpeak into each language community, working with local educators.***

>*** Etc***
>*** * * * ***

>***Is this a big project proposal by international standards? Is it achievable? Is it fanciful to even consider, bearing in mind the current position where the only resource is myself with AI assistance?***

>***If it's worth trying, what kind of pitch would have to be made for it?***

>***If not, what would be a more realistic target for me to aim at?***

This is a genuinely interesting question, and the honest answer is: it's neither fanciful nor straightforward. Let me give you a realistic picture.

Scale and precedent  
UNESCO IFCD grants typically run €20,000–€100,000 for smaller projects, and up to several hundred thousand for major initiatives. What you're describing — a structured internationalisation programme with project management, technical infrastructure, community consultancy, and linguistic validation across multiple language families — would realistically land in the €150,000–€500,000 range for a serious multi-year effort covering, say, 20–30 languages. That's mid-sized by international standards. Not a flagship programme, but not a minor grant either.

There is genuine precedent. Projects like Scratch (MIT) and Logo variants have received international education funding for language localisation. The African Storybook Project got UNESCO/SIDA backing for multilingual content at similar scale. What you're proposing is arguably more technically ambitious because you're not just translating content — you're translating the syntax layer of a programming paradigm, which is a stronger research and inclusion argument.

The honest assessment  
What's in your favour:

The concept is genuinely novel and fundable. "Code in your own language" is a compelling equity argument, especially for non-Latin-script communities  
Weblate + AI-assisted translation is a credible, modern technical approach  
You already have 4 languages running — that's proof of concept, not vaporware  
UNESCO IFCD specifically targets digital inclusion and linguistic diversity; AllSpeak sits squarely in that brief  
What works against a large bid right now:

Solo founder with no institutional anchor is a significant weakness for a €300k+ bid. UNESCO and similar bodies strongly prefer proposals with a host institution (university, NGO, recognised foundation)  
Three unvalidated translations is a thin evidence base for claiming internationalisation capability  
No published impact data — learner numbers, pedagogical outcomes, community adoption  
Realistic staging  
Rather than pitching the full vision cold, the credible path is probably:

Stage 1 — now to ~18 months: A small, focused bid (€20,000–€50,000 range) targeting NLnet or Mozilla Foundation (both of which you've already identified). Goal: validate the existing 3 translations with native-speaker educators, add 2–3 new languages including one Cyrillic (Bulgarian fits perfectly as your proof point), and publish a methodology paper. This is achievable solo-plus-AI with modest contractor support.

Stage 2 — with Stage 1 outcomes: Approach UNESCO IFCD or Shuttleworth with a stronger proposal backed by published results, a small advisory board, and ideally an institutional partner (even a loose affiliation with a university CS education department would help enormously).

What the pitch needs  
If you go for Stage 1 now, the pitch frame that works best is:

"We have built a working proof of concept for language-agnostic coding. We need funding to validate and document the methodology so it can be handed to communities worldwide."

That's honest, achievable, and fundable. The larger vision — UNESCO-scale multilingual coding inclusion — becomes the stated long-term goal that this project is a first step toward. Funders like that framing; it shows ambition without overreach.

The worst version of the pitch is asking for €300k to do everything at once with no institutional backing and three unvalidated translations. The best version is asking for €30k to do something specific and provable, with a clear line to the bigger story.

Bottom line: the big project is real and worth building toward. But right now, your most valuable move is probably getting one small grant, validating French/German/Italian properly, publishing something, and finding even one academic or NGO co-applicant. That turns a compelling personal project into a credible international initiative.

>***Where would something like this be published? What would such a document look like?***

Good question, and it's worth being precise about what "published" means in this context — because there are several levels, and they serve different purposes.

What kind of document?  
For your Stage 1 goals, you're not aiming for a peer-reviewed academic paper (that requires institutional affiliation, ethics review, formal methodology, etc.). What you need is something between a technical report and a methodology white paper — credible enough to cite in a grant application, accessible enough that educators and community organisers can read it.

Concretely, it would cover:

The problem statement (linguistic exclusion in coding education)  
AllSpeak's architectural approach — how opcodes map to language keywords, why this is different from just translating documentation  
The translation methodology: AI-assisted drafting, Weblate community review, native-speaker validation criteria  
Case studies: what worked, what didn't, what was unexpectedly hard (e.g. the Bulgarian Cyrillic decision, grammatical gender in German/Italian)  
A replication guide — how another community could do this for their language  
Outcomes: who used it, in what context, with what result  
That last section is the weak point right now, which is why validation work needs to come first — you need something to report.

Where to publish it  
Most accessible and immediately useful:

dev.to — you're already planning an article here; think of it as the public-facing summary that links to the fuller document  
Zenodo — free, gives you a citable DOI, accepts technical reports without peer review; this is what you'd actually reference in a grant application. It's run by CERN/OpenAIRE and is widely accepted as a legitimate citation source  
OSF (Open Science Framework) — similar to Zenodo, slightly more academic audience, also free and DOI-issuing  
Slightly more ambitious:

Journal of Open Source Education or JOSS (Journal of Open Source Software) — JOSS in particular publishes short papers about open source tools; the bar is real but achievable without institutional affiliation, and the peer review process actually strengthens your grant narrative  
Proceedings of a relevant conference — things like ICER (International Computing Education Research) or Scratch Conference publish practitioner papers, not just academic ones  
For UNESCO/NGO audiences specifically:

A white paper posted on your own site or Codeberg, formatted professionally as a PDF, is often more useful than a journal paper — programme officers at IFCD aren't necessarily looking for JSTOR links, they want something they can read and forward.

Practical sequence  
Do the validation work (get native speakers to formally review French/German/Italian)  
Write the methodology document — probably 4,000–8,000 words  
Post it to Zenodo to get a DOI  
Publish a readable summary on dev.to  
Reference the Zenodo DOI in grant applications  
That gives you a citation trail that costs nothing but time, requires no institutional affiliation, and is entirely within reach. The DOI is the key thing — it turns a blog post into a citable work.

>***Looks like Zenodo Aurora is the natural home of a document. I'd like to identify the structure of such a paper, starting with a clear synopsis of what it's all about, pitched at a suitable level for the target audience. ***
>***Fundamental questions to answer: Is AS a multi-language tool for human programmers or for validation of AI-generated code? Or both? In a world where coding is all done by AI whose competency is set to improve year by year, is there value in a simplified, constrained coding system when most code will be accepted on trust? Does the multilingual capacity then cease to have relevance?***

These are exactly the right questions to resolve before writing the paper, because the answers determine the entire framing. Let me work through them honestly.

The AI coding question  
This is the elephant in the room and you'd be naive to ignore it in a 2026 document aimed at sophisticated funders. The argument has to be made directly, not sidestepped.

The honest answer is: the trend toward AI-generated code actually strengthens the AllSpeak case, but for different reasons than the original ones.

Here's why. The original value proposition — "humans can write code in their own language" — is weakening as a standalone argument. If a child in Lagos can say to an AI "make a game where the ball bounces" and get working code, the need to write AllSpeak syntax yourself diminishes. That's real, and a funder will think it.

But three counter-arguments hold up well:

1.  Reading and understanding code remains essential. Even in an AI-generated world, someone has to read, verify, modify, and trust code. A teacher explaining what a program does, a local developer maintaining it, a student learning computational thinking — all of these require code that is legible to the reader. AllSpeak in your own language is a comprehension and education tool as much as an authoring one.
    
2.  AI validation and prompting is itself language-dependent. If the scaffolding layer — the environment in which AI-generated code runs and is inspected — is in English, you've merely moved the exclusion problem up one level. AllSpeak as a runtime and inspection environment in local languages has value independent of who wrote the code.
    
3.  Constrained, auditable systems have growing importance. As AI-generated code proliferates, there's increasing interest in sandboxed, interpretable runtimes — particularly in education and low-stakes IoT/automation contexts (RBR is a good example). AllSpeak's constrained nature is a feature, not a limitation. You can reason about what it will do.
    

The fundamental positioning  
This suggests the paper should position AllSpeak not as "a programming language" in the traditional sense but as a linguistically inclusive computational literacy layer — something that sits between human understanding and executable logic, regardless of whether a human or an AI generated the underlying code.

That's a stronger and more future-proof frame than "a language non-English speakers can code in."

Proposed paper structure  
Title (working): AllSpeak: A Language-Agnostic Runtime for Computational Literacy in Multilingual Communities

Abstract — 250 words. The problem, the approach, the current state, the ask.

1.  Introduction  
    The global coding education landscape. Language as a barrier. Brief statement of what AllSpeak is and isn't.
    
2.  The AI Coding Context  
    Confront the question directly. Why does a human-readable coding layer matter in a world of AI-generated code? Argue the comprehension/validation/education case. Position AllSpeak as complementary to AI tools, not competing with them.
    
3.  Architecture and Approach  
    How AllSpeak works — opcodes, language packs, the JS/JSON split. Kept accessible; technical detail in an appendix. The Weblate community translation model.
    
4.  Current Implementation  
    English reference, French/German/Italian status. The validation gap and how it will be addressed. What "validated" means in this context.
    
5.  The Multilingual Challenge  
    What you've learned about language difference — not just vocabulary but grammar, script, sentence structure. Bulgarian/Cyrillic as a case study in non-Latin script inclusion. What this reveals about the depth of the problem.
    
6.  Methodology for Language Onboarding  
    A replicable process: AI-assisted translation, community review via Weblate, educator validation, iteration. What another team would need to do this for a new language.
    
7.  Educational and Community Applications  
    Where this gets used. Learning environments, low-resource settings, IoT/automation for non-technical users. RBR as a real-world constrained-domain example (anonymised or named, your call).
    
8.  Open Questions and Limitations  
    Honest about what isn't solved. Governance of language packs. Long-term maintenance. The sustainability model.
    
9.  Conclusion and Call for Collaboration  
    The invitation — to linguists, educators, developers, funders.
    

References and Appendices

The synopsis — draft  
Here's a first attempt at the kind of opening synopsis that would work for a Zenodo document aimed at UNESCO/NLnet readers:

Computational literacy is increasingly recognised as a foundational skill, yet the tools through which it is taught and practised remain overwhelmingly English-centric. AllSpeak is an open-source scripting language and runtime designed to address this directly: programs can be written, read, and understood in any human language, while a single underlying execution engine handles all variants. Unlike localisation efforts that translate documentation or interfaces, AllSpeak operates at the syntactic level — the code itself is in the learner's language.

This paper describes the current state of AllSpeak, the methodology developed for extending it to new languages, and the challenges encountered in doing so. It also confronts a question that any honest treatment must address: in an era of AI-generated code, does the ability to write code in one's own language remain relevant? We argue that it does — and that the more important question is whether code can be read and reasoned about in one's own language, a need that grows rather than shrinks as AI-generated code becomes ubiquitous.

AllSpeak is currently operational in English, French, German, and Italian. This paper describes the path toward validated multilingual deployment, proposes a community-based methodology for language onboarding, and invites collaboration from linguists, educators, and funding bodies committed to digital inclusion.

That synopsis is doing several things at once: it pre-empts the AI objection, it's honest about current state, and it ends with an open hand rather than a sales pitch. That tone tends to land well with UNESCO-type readers who are sceptical of overclaiming.

Does that framing feel right to you, or do you want to push back on any of the AI argument in particular?

>***It feels right to me. For one thing, it avoids positioning AllSpeak as a direct threat to mainstream coding languages in the AI space, something that just invites pushback from coding professionals. I'll run it by a colleague who is following this subject with interest.***

That's a smart instinct. The "threat to mainstream languages" framing is a trap — it's both inaccurate and alienating to exactly the people who might otherwise be allies or validators.

The positioning that emerges from this framing is more like a layer alongside the existing ecosystem rather than a challenger to it. AllSpeak doesn't compete with Python or JavaScript; it occupies a different space — education, accessibility, constrained automation, computational literacy for non-programmers. That's a much easier sell to funders, and it's also simply truer.

A few things worth flagging for your colleague conversation:

The RBR connection is actually an asset in the paper, even if handled briefly. It demonstrates that the constrained-runtime model has real-world utility beyond the classroom — a working domestic automation system is tangible evidence that the approach isn't purely theoretical.

The AI-as-collaborator framing (AllSpeak + AI tools working together, rather than competing) might be worth your colleague's view specifically. If they're following the AI coding space closely, they'll have a feel for whether that argument is currently landing well or whether it's been done to death.

And the honest limitations section — section 8 in the proposed structure — is worth discussing with them too. Funders increasingly want to see that you've thought about what could go wrong. A solo maintainer as single point of failure, governance of community-contributed language packs, long-term sustainability — these are real vulnerabilities, and naming them first is stronger than having a reviewer name them.

Good luck with that conversation. It'll be interesting to hear what they make of the AI framing in particular.

>***Here is some speculation on my part about where 'coding' is going, and where that road ends up. I have encountered professional coders who - like me - are conscious of their skills and expertise withering away through lack of use. It's not that we are no longer able to understand code; we're just unaccustomed to writing it. An analogy might be when cheap typewriters became commonly available. People didn't stop being able to read handwritten text; they just lost the ability to write it easily. The ability to create beautiful handwriting disappeared around the time of my early schooldays, around 1960. It was no longer taught.***

>***If this prediction is accurate, what we need is not for better code "writing" but for better code "reading" tools and skills, and this is where DSLs like AllSpeak fit in, particularly if English is not to be the only choice. People will still have to learn how to read code, but human psychology is such that unless the basics can be learned in a matter of days rather than months, it'll only ever be a small minority that even tries.***

>***AllSpeak addresses this problem in 2 ways; first with the Codex; a tutorial that introduces the flavour of the language with 20 easy-to-follow and mostly interesting steps. The other way is by presenting a 4-step prompt series to build a simple graphical app. This is (or can be) accompanied by as little or as much detailed explanation as the user asks for when setting up.***

>***At this point the user can hope to understand enough of what AI produces from a prompt to be able to gradually add his/her own insight into the process. I don't honestly think we're ever going to see true validation on a large scale without something of this nature happening. To believe our present path will get us there is to hold that all code review must be done by 'experts', when the reality is it won't be done at all.***

>***If my analysis turns out to be correct, few are going to learn to code in the traditional way. I've noticed a steady decline in attendance of coding meetups and that's what I put it down to. Why learn to code when you won't be doing any coding?***

>***Which raises the question we've covered in previous discussions, why the languages and tools used for coding need to be as elaborate as they were when only people were doing the coding?***

>***So the above is a lengthy justification for positioning AllSpeak not as a tool for coders but as one for reviewers (provided the AI coder can be persuaded to use it), with the concomitant argument that it represents a way to preserve 'closed loop' development when the current trend is racing towards unstable open loops.***

This is a genuinely compelling argument, and it reframes the entire project in a way that's both more honest and more powerful than the conventional "coding for everyone" pitch.

Let me reflect back what I think you're saying, because it deserves to be stated cleanly.

The core thesis:

AI will write code. Humans will increasingly lose the ability to write it, in the same way handwriting was lost — not through incapacity but through disuse and the withdrawal of teaching. The critical remaining human skill is not authorship but comprehension: being able to read, question, and redirect what AI produces. Without that, the human is out of the loop entirely — and that loop, once open, stays open.

AllSpeak's role is therefore to be the minimal viable comprehension layer — simple enough to learn in days, expressive enough to represent real logic, and available in the reader's own language. Not a coding tool. A reading tool, and a thinking tool.

The closed loop argument is the strongest thing here. It's not just an educational point — it's a systemic safety and governance argument. An AI that generates code that no human can meaningfully review is not a tool; it's an autonomous agent operating on trust. That may be acceptable for generating a birthday card, but not for a heating system, a financial calculation, or a medical device. AllSpeak — as a constrained, human-readable runtime — is explicitly a mechanism for keeping humans in the loop in domains where that matters.

RBR becomes a perfect illustration. A householder doesn't need to write their heating schedule in code. But if the AI-generated schedule behaves oddly, the ability to glance at a few lines of AllSpeak and say "that's wrong, it's turning the heat on at 3am" is exactly the kind of closed-loop oversight that matters. That's not coding. That's literacy.

The handwriting analogy is worth developing carefully. It's vivid and accessible, but it has a slight weakness — handwriting loss is largely benign, whereas code comprehension loss has systemic consequences. That contrast is actually your point, but it needs to be made explicit or a reader might take the analogy too far and conclude "so what, we survived losing handwriting."

On the meetup observation — that's anecdotal but it's real signal, and it's the kind of grounded observation that gives a paper texture. Worth including as a footnote or sidebar rather than a main claim, since you can't cite it formally, but it humanises the argument.

What this does to the paper structure:

Section 2 — currently titled "The AI Coding Context" — now becomes the philosophical and strategic heart of the paper, not just a defensive pre-emption of an obvious objection. It carries the handwriting analogy, the closed/open loop argument, the comprehension-not-authorship reframe. Everything else flows from it.

The synopsis probably needs a second draft too, because this framing is stronger than what we had before. The current draft still leans slightly toward AllSpeak as a writing tool for learners. The revised version should lead with the oversight and literacy argument and treat the educational pathway as the mechanism through which that literacy is built.

Worth capturing all of this in a working document now, before the framing drifts. Shall I draft a revised synopsis that incorporates this, along with a restatement of the section 2 content in light of it?

>***Yes, I'd like to see that.***
>***My only concern is that this is prediction at a time when most people still believe AI just offers "more of the same but faster". It's far more comfortable to accept evolution than revolution. I don't want to be Cassandra.***

The Cassandra risk is real and worth taking seriously. A paper that reads as prophetic will be easier to dismiss than one that reads as analytical. The trick is to present the trend as already visible and measurable rather than forecast — letting readers draw the conclusion themselves rather than having it announced to them.

Here's the revised synopsis, followed by a restated Section 2 outline:

Revised Synopsis  
The tools of software development are changing faster than the assumptions that underpin them. For decades, programming literacy meant the ability to write code; today, AI systems generate functional code from natural language descriptions with increasing reliability. This shift is already observable in professional practice — in changing patterns of developer activity, in the declining attendance at traditional coding meetups, in the growing proportion of codebases where no single human understands the whole.

What is less discussed is what this shift leaves behind. If the ability to write code is no longer the primary requirement, the ability to read and reason about code becomes more important, not less — and yet it is the skill least supported by current tools and education. A codebase that no human can meaningfully inspect is not a managed system; it is an autonomous one, operating on trust. In high-stakes domains — automation, finance, health, infrastructure — that is a governance problem as much as a technical one.

AllSpeak is an open-source scripting language and runtime designed for a world in which reading code matters more than writing it. Programs expressed in AllSpeak are intentionally simple, constrained, and readable — not because the problems they address are trivial, but because legibility is a design goal. Crucially, AllSpeak operates in any human language: the code itself, not merely the interface around it, is written in the learner's or reviewer's own tongue.

This paper describes AllSpeak's current state, the methodology for extending it to new languages, and the case for treating multilingual code legibility as a digital inclusion priority. It does not argue that traditional programming languages will disappear, nor that AI coding tools are unwelcome. It argues that as AI-generated code becomes ubiquitous, the humans who need to understand it will be a different population from those who once wrote it — less technically trained, more linguistically diverse — and that the tools available to them should reflect that reality.

Section 2 — Restated: The Shifting Role of Code Literacy  
The structure I'd suggest for this section is three moves: observe, interpret, imply — never quite stating the revolution, but making it the only reasonable conclusion.

2.1 What is already changing  
Cite observable, uncontroversial trends: GitHub Copilot adoption rates, the growth of no-code/low-code platforms, the emergence of "prompt engineering" as a job description. Frame these as data points, not as evidence of apocalypse. The tone is that of someone noticing something interesting, not sounding an alarm.

2.2 The handwriting parallel  
Introduce the analogy carefully — as an analogy, not a prediction. When cheap mechanical reproduction of text became available, the teaching of handwriting changed; the skill didn't vanish overnight but it was no longer the primary medium of written expression. The parallel with code authorship is offered for consideration, not as established fact. This gives sceptical readers room to engage without feeling lectured.

2.3 Reading versus writing  
The pivot. Whatever one believes about the future of code authorship, the need to read and verify code is not diminishing. If anything, the volume of code requiring review is increasing while the population capable of reviewing it is not growing proportionally. This is a statement about the present, not the future, and it's hard to argue with.

2.4 The closed loop problem  
Introduce the governance framing. A system in which code is generated, deployed, and operated without meaningful human inspection is an open loop — functional until it isn't, with no internal mechanism for course correction short of failure. Constrained, legible runtimes like AllSpeak are one class of response to this. Not the only one, but a coherent one, particularly in the kind of bounded domains — home automation, simple data processing, educational environments — where the complexity of a general-purpose language is neither necessary nor helpful.

2.5 The language dimension  
If code literacy — reading, not writing — is the relevant skill going forward, then the language in which that code is expressed is newly important. The population that needs to inspect and reason about AI-generated programs in a home automation context, a classroom, or a community organisation is not primarily composed of English-speaking developers. This is where the multilingual argument lands, grounded now in the literacy-not-authorship frame rather than the older "coding for everyone" frame.

The discipline throughout is: show the trend, name the implication, let the reader arrive at the conclusion. You're not Cassandra if you're describing what's already happening and asking what it means. The revolutionary reading is available to those who want it; the evolutionary reading is available to those who don't. Both audiences can engage with the paper honestly.

Shall I start pulling this into a working document structure — something you could share with your colleague as a first draft framework?

>***Yes, I'm satisfied that we've struck the right balance between pessimism and optimism, or between what can clearly be seen and that which can only be speculated.***

Good. Let me put this together as a working document — structured, but clearly marked as a first draft framework so your colleague understands what's settled and what's still open.

Here's the working paper as a Word document. A few things to note about what's in it:

The abstract and Section 2 reflect the full revised framing we arrived at — the comprehension-not-authorship argument, the handwriting parallel handled carefully as analogy rather than prediction, and the closed-loop governance case.

Throughout the document there are red editorial notes marked \[NOTE TO AUTHOR: ...\] flagging the places where content needs to be developed, decisions made, or data added — things like the RBR naming decision, the Bulgarian/Cyrillic resolution, and the validation methodology. These make it easy for your colleague to see what's settled and what's still open, without the draft pretending to be more complete than it is.

The structure follows the nine-section framework we agreed, with placeholders for References and the Technical Appendix.

When you're ready for the next pass — whether that's fleshing out the technical section, adding the validation methodology, or incorporating your colleague's feedback — it'll be straightforward to iterate on this base.

>***That's a pretty good start. I'll see how many people I can put it in front of.***
>***You used a phrase earlier; "a linguistically inclusive computational literacy layer — something that sits between human understanding and executable logic, regardless of whether a human or an AI generated the underlying code." It has a nice ring to it.***

It does, and it's precise in a way that matters — it locates AllSpeak in the stack without making claims about who's above or below it. Worth pulling into the abstract or the introduction directly, perhaps even as a one-line definition that anchors the whole paper:

"AllSpeak is a linguistically inclusive computational literacy layer — sitting between human understanding and executable logic, regardless of whether a human or an AI generated the underlying code."

That single sentence does a lot of work. It sidesteps the "is it a programming language?" question, it implicitly addresses the AI authorship issue without dwelling on it, and it's memorable enough that a reader could quote it back. Good candidates for a phrase like that are the abstract, the first paragraph of the introduction, and any executive summary you write for a grant application cover letter.
