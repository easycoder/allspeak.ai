# Examples and Patterns

Patterns that are already used in this repo. For the rules behind them, see `AI/ALLSPEAK_CODING_GUIDELINES.md`; for the doc-block convention that new `.allspeak` code is expected to follow, see the root `AGENTS.md`.

## Example: Webson for shape, script for data
Use Webson for the parts whose shape is fixed at template time, and the script for the parts whose shape comes from the data. `asedit` does this for its file list: a Webson-attached scroller container, with the rows created by the script inside it. The layout knows nothing about how many files there might be. The same split applies to table bodies, list items, and repeated cards.

## Example: one array, one handler
For repeated UI items — a grid of cells, a row of buttons:
1. Declare one array-style variable and set its element count (`set the elements of Cell to 12`).
2. Create the items in a loop, using one variable for the whole group.
3. Register one handler on the array (`on click Cell`), not one handler per item.
4. Find the item inside the handler with `the index of Cell`, and drive the logic from that index.

## Example: follow a request with an `or` clause
Every REST or MQTT call that can fail should say what happens when it does. There is no try/catch and no callback:

```
rest get Config from `/read/config.json` or
begin
    set the content of Status to `Could not load configuration`
    stop
end
```

The clause runs on any failure, for any reason.

## Example: explicit state, recompute the derived UI
Keep one explicit state variable per concern, and recompute the labels, badges and enabled/disabled states after every transition that can change them, rather than setting them where the change happened. `asedit` does this for its toolbar: one badge and one sidebar colour are derived from the current block's hash and verification states, and every transition re-derives them.

## Example: the dist/debug pattern
- Use the unminified `allspeak.js` while diagnosing runtime errors; switch to `allspeak-min.js` once stable.
- Keep `Webson.js` loaded whenever the `render` command is used.

## Example: the Codex as a training reference
`codex/codex.allspeak` is the largest worked script in the repo — a feature map (it exercises most core AllSpeak constructs in one real script) and a style map (structure, flow organisation, readable composition). When proposing an architecture for a new script, prefer patterns already visible there unless the user asks for something different.

## Candidate onboarding task for an unfamiliar AI
Tic-Tac-Toe applet (human vs computer):
- UI via Webson JSON
- game logic in AllSpeak: an explicit state machine for turns, win and draw
- one array for the board, one click handler, `the index of` to identify the cell
- no direct DOM string manipulation outside the established patterns
