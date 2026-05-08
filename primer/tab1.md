# Code Without Coding

You've probably heard about vibe coding — tell an AI what you want and it writes the software. It sounds like magic, and sometimes it is. But there's a catch: the code it produces is in languages like JavaScript or Python, and unless you already know those languages, you have no way to tell whether the AI did a good job. You're flying blind, and when something breaks — which it will — you're stuck.

At the other end, traditional coding means months of learning before you build anything useful. Most people don't have that kind of time.

AllSpeak sits in the middle. It's a scripting language designed to read like English, so when AI writes code for you, you can follow what it's doing. You stay in control without needing a computer science degree.

## What does that look like?

Here's a real snippet:

```
    attach Display to `greeting`
    put `Hello!` into Message
    set the content of Display to Message
```

No brackets, no semicolons, no mystery. If you can read a sentence, you can read AllSpeak.

## Not a toy

AllSpeak builds real software. Web apps with interactive pages and styled layouts. Command-line tools that talk to APIs, process data and manage files. Multi-screen applications with navigation, forms and user input. Live connections using REST and MQTT. It runs in any browser (the JavaScript version) or from the terminal (the Python version) — or both together.

The secret is that AI doesn't care what language it writes in. Give it a capable high-level language and it delivers the same functionality as it would in JavaScript — but in a form you can actually read, check and modify.

## How to get started

The fastest route is **AllSpeak + Claude Code**. Claude Code is an AI coding agent that runs in your terminal. Combined with our starter pack, it will set up a working project for you in under five minutes — complete with an explanation of every file it creates.

Here's all you do:

1. Create an empty folder for your project.
2. Download [allspeak-en.zip](https://allspeak.ai/allspeak-en.zip) and unzip it into that folder.
3. Install AllSpeak: `pip install -U allspeak-ai`
4. Install Claude Code (see [claude.ai/code](https://claude.ai/code)).
5. Open a terminal in that folder and type `claude`.
6. When Claude starts, type **go**.

Claude will ask you a couple of questions, create your project files, and walk you through how everything fits together. From there, just tell it what you want to build.

## Learn more

- **Example tab** — a step-by-step guided build to see the workflow in action.
- **AI Manual tab** — the full case for structured AI development vs vibe coding.
- **[Codex](https://allspeak.ai/codex.html)** — an interactive tutorial, reference and playground for the AllSpeak language.

## A note on language variants

AllSpeak is under active development. Language variants other than English may contain keywords or patterns not yet fully supported by the engine. If you encounter a compile error on a keyword that looks correct, please report it to [info@allspeak.ai](mailto:info@allspeak.ai) — fixes are usually quick.

## Self-hosting for stability

The starter pack and templates load the runtime from `https://allspeak.ai/dist/`, which always reflects the latest version. That's perfect for tutorials and short experiments — but for projects you intend to keep running, pin to a stable version so a future update can't break your script unexpectedly.

You have two options:

### 1. Pin to a date-stamped snapshot (recommended)

Every deploy is also archived under a date-stamped path:

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

That URL serves the build deployed on 8 May 2026 and won't change — the rolling `/dist/allspeak.js` keeps advancing alongside it. To upgrade, change one number after testing.

### 2. Self-host

For full control or air-gapped use, copy the runtime to your own server. The essentials are:

- `dist/allspeak.js` (or `dist/allspeak-min.js`) — the runtime
- `dist/LanguagePack_*.js` — non-English language packs
- `dist/plugins/` — whichever plugins your project uses
- `dist/vendor/` — Showdown and the CodeMirror addons

Then change the `src=` URLs in your HTML to point at your copy. To update later, fetch a date-stamped snapshot from `https://allspeak.ai/dist/<YYMMDD>/` and replace the files.

For tutorial users and short experiments, neither step is needed — keep the rolling URL.

## Questions?

Contact us at [info@allspeak.ai](mailto:info@allspeak.ai).
