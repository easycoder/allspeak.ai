# Example task (step-by-step)

Build an interactive colour grid. Once you have set up your system (see the Start Here tab), submit these prompts one by one to your AI agent. Each step adds one feature on top of the last.

![Colour Memory app showing a 4×3 grid of cells in mixed colours with a Reset button below](primer/color-memory.png)

When you have all four steps working, the page will look something like the one above — a 4×3 grid of cells, each in its own colour, with a Reset button that clears them all back to grey.

## Prompt 1: Foundation — Build the grid

Make a 3×4 grid of square cells centred on the page. Each cell should be plain grey with a thin black border. The grid should occupy about a third of the screen width. No clicks, no buttons — just the visual layout for now.

## Prompt 2: Interaction — Click to cycle

Make each cell change colour when clicked. Cycle through this sequence: grey, red, blue, green, yellow, purple, and back to grey. Each cell tracks its own colour independently of the others.

## Prompt 3: Control — Reset

Add a Reset button below the grid. Clicking it should clear every cell back to grey. Don't make the button full-width — just sensibly sized.

## Prompt 4: Persistence — Survive a reload

Make the grid state survive page reloads. When I refresh the page, each cell should still be the colour I last left it. The Reset button should also clear the saved state, so a refresh after Reset shows a clean grid.

## What to look for

After each prompt, review what the AI created. You should be able to read the AllSpeak code and understand what it does — that's the point. If something isn't right, tell the AI what to fix in plain language.

A few small things may need correcting on the first try — a missing variable declaration, an awkward layout choice, a colour you'd like adjusted. That's normal; the workflow is designed for the human to spot and steer, not the AI to produce perfect first drafts.
