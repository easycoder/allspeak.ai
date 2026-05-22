# 2026-05-22

## 09:14

There is a problem with asedit, that when it is in Blocks mode, opening a new tab causes much confusion. It woud be best either to disable the Open button while in that mode or to switch back automatically before opening. I favour the latter.

**Assistant**

Fix landed in `asedit.as`:

- Extracted the body of `ExitBlocks` into a new gosub-able `DoExitBlocks` subroutine. `ExitBlocks` itself now just `gosub to DoExitBlocks` then `stop`, so the existing `ToggleBlocks` path is unchanged.
- `ShowBrowser` now starts with `if BlocksMode is 1 gosub to DoExitBlocks`, so clicking Open while in Blocks mode flushes the current block, restores the flat pane, and then shows the file browser.
- Updated the doc-block prose above the Blocks-view section to mention the new helper.
- Ran `python3 tools/asdoc-check.py --write asedit.as` to refresh the hashes for the two doc blocks I touched (the ShowBrowser-area block at line 556 and the Blocks-view block at line 1011). The `@verified` marks for those two blocks are now stale, as expected — review and re-verify in asedit's Blocks mode when you next open the file. The other three pre-existing verify-stale warnings (lines 139, 175, 343) were already there and are untouched.
