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

## Tooling evaluation: XERJ (optional, not adopted)

[XERJ](https://github.com/xerj-org/xerj) is a local search engine and MCP server (Apache-2.0, one static binary). It is a plausible opt-in for searching *this* checkout, but it is not a dependency and it is not in any starter pack's onboarding.

**Measured 2026-11-05, v1.0.0-rc.100.** `xerj autoindex .` indexed 1,067 files into 6,503 records in 35 s with 4 workers, and returned useful `file:line` passages for docs and code; `xerj mcp` answered `initialize` against the same node. The binary is ~143 MB installed (a ~33 MB download), and the default embedding backend is lexical.

**The two limits that decide the fit.**

- **`.allspeak` is not a tree-sitter language in XERJ.** It is indexed as text, so labels and subroutines are not symbols: `xerj def VizRequest` and `xerj def parseSymbols` both find nothing. `xerj search` still retrieves the text.
- **The tracked `deploy/` mirrors rank alongside the canonical sources.** A query can return `deploy/learn/…` or `deploy/code/tools/…` where the source of truth is the root file; check the path before using a hit, or exclude `deploy/` from the index.

**Why it is not in the onboarding.** An AllSpeak project is usually a handful of scripts and a Webson file — small enough for an agent to read — while XERJ wants a daemon, a data directory and a first index. That is a new install step and a new running service, against the "make complex things simple" and "the onboarding does not grow with the tooling" invariants (`STRATEGY.md`). It also ships a `xerj_field_report` MCP tool that sends a field report by default; set `XERJ_DISABLE_FEEDBACK=true` if you run it.

**If you want it in a local checkout:**

```sh
xerj --insecure --data-dir ~/xerj-data &   # loopback only; --insecure is a trust boundary
xerj autoindex . --state-dir /tmp/xerj-state
xerj search "doc block verified hash"
```

`xerj init` registers the MCP server with the supported clients. None of this is required to work on AllSpeak.

## Primer Selection

Use the primer that matches the user's intent:

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
