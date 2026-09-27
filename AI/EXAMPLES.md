# Examples and Patterns

## Example: Doclets reader pattern
Use this pattern when building AllSpeak browser apps:
1. Render screen from Webson JSON
2. Attach all required elements by stable IDs
3. Register click/change handlers once
4. Maintain explicit state variable for response processing
5. Recompute button/label state after every relevant transition

## Example: Topic selection UX pattern
- Dialog has select all / deselect all / confirm
- Persist selected topics to storage
- Display label states:
  - "No topics chosen" (warning color)
  - "All topics chosen" (success/info color)
  - explicit topic list for partial

## Example: Dist/debug pattern
- Use `allspeak.js` (unminified) while diagnosing runtime errors
- Switch to `allspeak-min.js` once stable
- Keep `Webson.js` loaded when `render` command is used

## Example: Codex training script pattern
- Use `codex/codex.allspeak` as a primary training reference when learning or generating non-trivial AllSpeak scripts.
- Treat it as both a feature map and a style map:
  - feature map: it exercises many core AllSpeak constructs in one real script.
  - style map: it demonstrates practical structure, flow organization, and readable script composition.
- When proposing architecture for new scripts, prefer patterns already visible in `codex/codex.allspeak` unless the user requests a different style.

## Candidate onboarding task for unfamiliar AI
Tic-Tac-Toe applet (human vs computer):
- UI via Webson JSON
- game logic in AllSpeak script
- explicit state machine for turns/win/draw
- no direct DOM string hacks outside established patterns
