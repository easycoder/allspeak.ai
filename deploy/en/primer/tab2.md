# Get started

Set up once, then build a small app one prompt at a time and watch it run. Nothing here needs you to write code.

## Before you start

Three things:

- **Python 3** — the `allspeak` command is a Python package.
- **A terminal** — the window you type commands into. PowerShell on Windows, Terminal on macOS or Linux.
- **An AI coding agent.** Either of the two below will do.

One thing worth knowing before you begin: **the agent writes the AllSpeak, you review it.** You will not type any code at all.

## Set up

### AllSpeak with Claude Code

Claude Code is an AI coding agent that runs in your terminal.

1. Install AllSpeak: `pip install -U allspeak-ai`
2. Create an empty folder for your project.
3. Download [allspeak-en.zip](https://allspeak.ai/allspeak-en.zip) and unzip it into that folder. That is the *starter pack* — your agent's instructions, and the note saying which language this project speaks. There is no tooling in it, deliberately: everything else is fetched when it is needed, so nothing in your folder can go stale.
4. Install Claude Code — see [claude.ai/code](https://claude.ai/code).
5. In the project folder, start the visualiser: `allspeak viz`. Your browser opens at `http://localhost:8080/viz.html` — that is Viz, and it stays open beside you while you work. Leave this terminal running.
6. Open a **second** terminal in the same folder and type `claude`.
7. When Claude starts, type **go**.

### AllSpeak with Reasonix

Reasonix is an AI coding agent with a desktop app, which many people find easier to keep an eye on than a terminal.

1. Install AllSpeak: `pip install -U allspeak-ai`
2. Download and install the Reasonix desktop app from [reasonix.io](https://reasonix.io).
3. Create an empty folder for your project.
4. Download [allspeak-en.zip](https://allspeak.ai/allspeak-en.zip) and unzip it into that folder — the same starter pack as above.
5. In the project folder, start the visualiser: `allspeak viz`. Your browser opens at `http://localhost:8080/viz.html` — that is Viz. Leave this terminal running; it is the only one you will need.
6. Start Reasonix, click **Add new project**, and choose your project folder.
7. Tell Reasonix what you would like to build. On first use it will ask for your DeepSeek API key and keep it for you.

### Either way

Your agent asks a couple of questions, creates the project files and explains what each one is for. From then on it is a conversation: you say what you want, it writes the code.

**Its first job is to introduce you to Viz** — the page now open in your browser, and the place you will run the app, watch a run and see what the AI did. Let it walk you through that; being shown once beats reading about it.

A note on the commands: the `.allspeak` extension is optional, so `allspeak myapp` and `allspeak myapp.allspeak` are the same command.

## Build it: the colour grid

Four prompts, each adding one feature on top of the last. Send them one at a time, and read what comes back before sending the next one.

![Colour Memory app showing a 4×3 grid of cells in mixed colours with a Reset button below](primer/color-memory.png)

### Prompt 1 — the grid

Make a 4‑column by 3‑row grid of square cells centred on the page. Each cell should be plain grey with a thin black border. The grid should occupy about a third of the screen width. No clicks, no buttons — just the visual layout for now.

### Prompt 2 — click to change colour

Make each cell change colour when clicked. Cycle through this sequence: grey, red, blue, green, yellow, purple, and back to grey. Each cell tracks its own colour independently of the others.

### Prompt 3 — a reset button

Add a Reset button below the grid. Clicking it should clear every cell back to grey. Don't make the button full-width — just sensibly sized.

### Prompt 4 — survive a reload

Make the grid state survive page reloads. When I refresh the page, each cell should still be the colour I last left it. The Reset button should also clear the saved state, so a refresh after Reset shows a clean grid.

## What to look for

After each prompt, read what the AI produced. You should be able to follow the AllSpeak — that is the point of it. If something is not right, say so in plain language, and it will be changed.

A small thing may need correcting on the first try: a missing variable declaration, an awkward layout choice, a colour you would like adjusted. That is normal. The workflow is built for you to spot and steer, not for the AI to produce a perfect first draft.

You can watch the whole example being run in this short recording: [AllSpeak primer in action](https://www.youtube.com/watch?v=BSvh4MPEzV4).

## Now look at the run

Viz shows a *run*, not the code, so the first step is to say which part of a run is worth watching. Ask your agent:

> Mark the click handler, and record a run for me.

That puts a `viz start` line where the interesting part begins and a `viz stop` where it ends, and names your app's page so that Viz knows what to open. Then, in Viz:

- **Record** runs it and saves the run beside your script as a `.viz.json` file. Your app opens in a window of its own — click a few cells there, then close that window.
- **Graph** draws what happened: the script's lines as rows, a mark wherever the run arrived, and heat where it arrived often.
- **Click a mark** and the sidebar shows the block it came from — the prose your agent wrote, beside the code it describes, with the line, the visit and the total.
- **Blocks** reads the whole script that way, one block at a time, so you can review what the AI did without reading code.

Then ask the next question and answer it the same way: narrow the markers around what you are unsure of, record again, look again. That loop is the whole of the work — and none of it needed you to write a line.

## Questions?

Contact us at [info@allspeak.ai](mailto:info@allspeak.ai).

## A note on language variants

AllSpeak is under active development. Language variants other than English may contain keywords or patterns not yet fully supported by the engine. If you encounter a compile error on a keyword that looks correct, please report it to [info@allspeak.ai](mailto:info@allspeak.ai) — fixes are usually quick.

## Later: if you keep the project

The starter pack and your project's page load the runtime from `https://allspeak.ai/dist/`, which always reflects the latest version. That is right for tutorials and short experiments. For a project you intend to keep running, pin it so that a later update cannot change it under you:

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

That URL serves the build deployed on 8 May 2026, and never changes. To upgrade, test the current one and change the number. The [Codex](https://allspeak.ai/codex.html) explains how to self-host the runtime instead.
