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
