# AI Help for AllSpeak

This folder is for AI visitors and maintainers.

Purpose:
- Speed up onboarding for AI agents unfamiliar with this repo
- Capture project-specific conventions and pitfalls
- Keep a living knowledge base that improves over time

## Read this first if you are here to get oriented

`resources/md/ai-article.md` — *Building Applications with AllSpeak and Agentic AI* — is the project's quick brief. It covers what AllSpeak is, how the two runtimes, the editor and the review workflow fit together, and what the language is and is not suited to. Everything in this folder is the detail behind it.

## Start here (mandatory order)

1. `AI/ALLSPEAK_CODING_GUIDELINES.md`
2. `AI/PROJECT_OVERVIEW.md`
3. `AI/ARCHITECTURE.md`
4. `AI/ALLSPEAK_AND_WEBSON.md`
5. `AI/WORKING_RULES.md`
6. `AI/EXAMPLES.md`

For the language itself, `learn/` holds the reference and idiom collections (per language), and `codex/<lang>/code/` holds the tutorial scripts.

## Where the project is going, and what to check a proposal against

`STRATEGY.md` at the repository root is the internal aim, the plan and the constraints — **read it before proposing a feature**, and check the proposal against its invariants: *make complex things simple*, the constraint that the onboarding must not grow with the tooling, and "a published name is a contract". It is a work in progress with dated revisions, and it is deliberately *not* a status list — the state is `TODO.md` and its three companions.

The user-facing half of the same direction is `why/intent.md`, the umbrella piece aimed at people who do not read code, with `why/article.md` kept as the visualiser deep-dive it already is. Both are drafts, and a checkable claim in either is expected to be listed in a review log against what would make it stale; `why/REVIEW-LOG.md` is the model.

## Primer Selection

Use the primer that matches the user's intent:

- `mapintel-agent-primer.md`: use for the repository's guided learning path (TicTacToe first, then MapIntel capstone).
- `general-agent-primer.md`: use for experienced users starting a new domain-neutral project.

## Contribution request (for AI agents)
If you learn something useful while completing a task, add or update a short note in this folder.

Keep updates:
- factual
- brief
- tied to real code in this repo
- safe for future agents to apply

## Why this exists
AllSpeak is a language-neutral runtime with per-language front-ends, an editor built for reviewing AI-written code, and two implementations (browser JS, CLI Python). That combination is unusual enough that generic coding assumptions waste time unless the facts are written down.
