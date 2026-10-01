# AllSpeak — Language Enhancement TODO

Items identified during real project work. Each should be implemented in both JS and Python.
## Where things stand

**The house style is written down, in four languages** (2026-10-01). `learn/reference/21-house-style.md` is new — `begin` and `end` on their own lines (the one exception being `else begin`, and `then begin` where `then` opens a block), and how a long statement is split: **a join that fits comfortably on one line stays on one line**, and the advice is for the builds that would wrap in a narrow editor pane or a diff. Where one is broken, it is broken before the joining word (`cat`, `and`, `or`, `with`), continuation one indent deeper, one fragment per line. Graham's rule, and a recommendation rather than a rule the compiler enforces — his correction after the first draft made it the other way round. Every example on the page was compiled with its own language pack — 28 blocks across EN/FR/IT/DE, plus the 8 examples on the `cat` idiom page — and `tools/learn-link-check.py` is clean. `reference/02-symbols-and-layout.md` now leads with the house form and points at the page, `09-control-flow.md` points at it too, and `idioms/01-cat-and-string-building.md` leaves its short build on one line and shows the six-fragment one split. **Translations carry it as item `20.` in their own contents lists** because their reference list has no `20-graphics`; the file is `21-house-style.md` everywhere. `./deploy-sync` has run, so `deploy/learn/` is in step.

**And `then` turns out to belong to `run` alone** — the finding behind that exception. `then` is a word in all four packs, but the only grammar that uses it is `run {script} with {imports} then {handler}`; `if … then` and `while … then` are rejected by both runtimes with *I don't understand 'then'*, although both compilers call the `if` body "the 'then' code" in their comments — which is probably where the impression that `if … then` exists came from. **`nowait` and `then` are JS-only on `run`:** the Python `k_run` implements neither, while the packs advertise both (`run {script} with {imports} dann {handler}`, `Sansattente`, `ohnewarten`). A gap to close in the Python runtime, not a documentation problem.

**The editor's guards, simplified** (2026-10-01). Ten `if`s became one where two guards said the same thing: `VizRemember`'s `TraceSize`/`DrawMillis` pair (Graham's), `VizPan`'s `VizDrawing`/`VizGrabbed` pair, and `PollFile`'s two mode guards, whose two comments folded into one statement of the rule. A fourth case was the same family under a different operator: the axis placed each of eight tick labels as `if <past the margin>` / `begin` / `if <inside the plot> set its text` / `end`, which is `and`, not `or` — each collapse drops a `begin`/`end`, and they are **the first places in asedit that split a condition onto a continuation line**, at Graham's suggestion. Net −17 lines. `asedit` compiles at 2008 commands, 359 symbols, 0 errors, and `various/plotview-check.js` reports a **byte-identical picture** before and after, on two recordings. Three sections want a re-verify (`PollFile`, the Graph-mode section holding `VizRemember`, and the view holding the axis and `VizPan`). Same-shape pairs left alone in `resources/ecs/*`, `tools/asdoc-check*.allspeak`, `chat/chat-main.allspeak`, `codex/en/code/step18.allspeak` and `resources/scripts/solitaire.allspeak`.

**A harness finding worth keeping:** `various/plotview-check.js`'s two *escaping* checks look for source lines 30–31 of its own fixture, so they **fail on any trace whose line span excludes them** — they fail on `examples/chemical/parser.allspeak.viz.json` (span 205–480) and pass on a window that covers them. Trace-dependent, not code: the same two fail identically before and after the change above, which is how they were caught. The fix is for those checks to assert on lines inside the trace's own span.

**The visualiser is in the editor and working.** `asedit.allspeak` has a **Graph** pane: a third view fed by a
run recording, drawn in AllSpeak with the `svg` plugin. It gained the **heat** (the marks coloured by how
much work each line carried, four bands, now the only scheme), a **caption** naming the run it drew,
**yielding** every hundred marks so a long draw cannot freeze the browser, and a **prediction** of how long
a draw will take — learned from the previous one and kept in `.viz-calibration.json` (gitignored,
per-machine). It also gained the **JSON prettify** on open (one-line files only) and the `Marks`/`Heat`
toggle was **folded away** on Graham's call, so there are two buttons for two panes. Since 2026-09-30 it also
shows a **window on the run** rather than the whole of it — wheel alone scrolls, shift-wheel zooms the
lines, control-wheel the steps, and a drag pans — and draws **the source itself behind the heat**, so a mark
says what ran rather than only that something did.

**Corrected this session — the "stale copy" diagnosis did not fit Graham's page.** He runs the editor at
`http://localhost:8080/edit.html`, served from the **repo root** by the `allspeak server` started there, and
its `/asedit.allspeak` is **byte-identical to the root file** (both `bbd58e04…`, 82,668 bytes). So the root
copy is what he sees, always: `./deploy-sync` was never needed for him, and `deploy-sync` in any case does
**not** touch `deploy/code/` (only `deploy-allspeak` step 3, `cp asedit.allspeak … deploy/code/`, does).
The stale copy is real but it is the **live site's**: `https://allspeak.ai/code/asedit.allspeak` is
**byte-identical to `deploy/code/asedit.allspeak`** — 77,488 bytes, **no `Heat` anywhere** — i.e. the editor
published at allspeak.ai/code is the one from the 19:03 deploy, and it is what anybody off this machine
gets. Reachable locally too, one URL away: `localhost:8080/deploy/code/edit.html` runs that same old copy.

**The tiny dots on a return to Graph are diagnosed and fixed — and it was never the cap.** The two
renders differ in exactly one thing: `stroke-width`, **14 on the first draw and 3 on every redraw**.
Measured by running the view once and twice through the harness and diffing the serialised SVG: the five
mark paths and the axis are otherwise byte-identical, caps included in both. The cause is an
order-of-passes fault in `VizBuilt`: the size was computed in the per-draw block at the *top* of the pass,
which is before pass one has measured the span, so the first draw divided `VizPlotH` by an empty
`VizSpanLines` (Infinity → the ceiling, 14) and each redraw divided it by the *previous* draw's span
(580/249 = 2 → the floor, 3). Hence "right the first time, tiny from the second onwards", in his words and
now in the arithmetic. Fixed by computing the size after `VizSpanLines` is known and dropping the
row-proportional rule that produced the 3: it only ever applied to spans of 41–193 lines (shorter ones
were clamped up to 14 anyway), and on a long run a row is about two units, so its floor was a pinprick by
construction. One size, 14 — which is what the first draw has always shown him. The per-draw block at the
top is now purely a reset, and the invariant is worth keeping: **nothing before pass one may depend on what
pass one measures.** Verified: first draw and redraw are now byte-identical, his recording still draws 44
arrivals and 99 transfers, the fixture is unchanged, and `asedit` compiles at 1656 commands, 0 errors.

**The harness puzzle is solved, and it was the yield — not the trace.** `wait 1 millis` resumes from a
timer, so `AllSpeak_Run.run` returns with the picture half drawn; the harness reported in that same tick,
before the rest arrived. Graham's 147 events cross the hundred-mark yield threshold, a nine-event fixture
never does, and his browser is fine because yielding is what it is for. With the report moved to a settle
detector, his recording draws **44 arrivals (15+9+8+12) and 99 transfers** — and the inert
`VizArrivalDots` path stays empty in the same run, which is the evidence that deleting it was safe.

**The fold is finished** (2026-09-29): the inert plain marks path, `VizArrivals`, the two `set attribute d`
lines that wrote it, the dead `if VizBands is 1` / `if VizBands is greater than 1` guards and the duplicated
string-clearing at the top of pass two are all gone — 1656 commands down to **1635**, 286 symbols to 284.
Proved rather than assumed: the old view (commit `e4106ff`) and the new one were run against the same trace
and their serialised SVG diffed — the only difference is the removed `<path id="ec-VizArrivalDots-0">`, with
every shared element byte-identical. `VizBands` stays as the one statement of the band count, which the
band-size division uses.

**The legend is done** (2026-09-29): four swatches in the ramp's own colours on the caption's line, each
beside the counts its band covers, computed per draw from `VizMaxCount / VizBands` — `1-5  6-11  12-17  18+`
for Graham's recording, and `0-0  1-1  2-2  3+` for a fixture where nothing ran twice, which is the case
that shows the key describing the mark loop's own boundary rather than decorating it. 1716 commands,
0 analysis errors, 25 elements where there were 17.

**The wheel event is in** (2026-09-30), because zoom needs it and the language had no wheel event at all.
`on wheel <Element>` in `js/allspeak/Browser.js`, element-scoped on purpose: its whole use is to take over
the gesture *on a pane*, and a zoom that scrolled the page underneath would be unusable, so the listener
is registered `{passive: false}` and calls `preventDefault`. Two values come with it — `the wheel amount`
(signed, away from the user is positive) and `the wheel position` (x/y, the point a zoom keeps still) —
which is what the pick/drag pair already does for their gestures. Words added to all four packs (`wheel`:
`molette`/`rotella`/`Mausrad|mausrad`; `amount`: `quantité|quantite`/`quantità|quantita`/`Menge|menge`, the
fr/it/de forms **provisional and for native review**, as the `viz` option words were), `./sync-language-packs`
run, `resources/doc/en/browser.json` updated, and `./build-allspeak` rebuilt so the editor's own page can
use it. Verified by a new scratch harness, `various/wheel-check.js`: it attaches a pane, registers the event,
fires a synthetic wheel event and reports what the handler saw — **all four languages** attach, run, read
amount `-120` and position `300,42`, and call `preventDefault`. `asedit` still compiles at 1716 commands,
0 errors.

**Two traps found while building it, both worth knowing beyond this event.** `nextIsWord(canonical)`
advances *before* it answers, so two of them in a row test the token after the one being read and walk past
the value's last word — the failure reads as `Undefined value: 'the'` on a whole expression, which points at
the wrong thing entirely. Use `peek()` and check. And a local form can stand for more than one canonical
word — Italian `posizione` is both `position` and `location` — so `reverseWord` is ambiguous and the form
test has to be `matchesWord`, which is what `isWord` uses.

**And one thing about handlers in general, met while testing:** the compiler appends an `exit` to every
program, and `AllSpeak_Run.exit` deletes every binding on the program object — `run` included. So **an event
handler registered by a script whose flow then ends is dead**: the editor only works because its poll loop
keeps the program alive. The harness now ends with a `wait` for that reason, and it is worth knowing before
anyone writes a script that is nothing but handlers.

**The off-screen buffer's element is in: `svgimage`** (2026-09-30). An SVG `<image>` element in
`js/plugins/svg.js`, wired at every site a declared element type needs — and the count is worth keeping,
because **a site left out fails silently**: the declaration handler, `create`'s compile list, the keyword →
tag mapping, the create-time location bookkeeping, `Move`'s compile *and* its two runtime case lists (a
group's children and a standalone element), and `getHandler`. Two of those were missed on the first pass and
caught only by the new check.

It is called **`svgimage`, not `image`**, because `image` is already the browser domain's HTML `<img>` and the
browser domain wins the token — the same reason `svgtext` is not `text`. Verified by
`various/svg-image-check.js` (scratch): a script creates one in a canvas, moves it to 10,20, sizes it and
sets a data URL, and the check reports the tag (`image`, not `svgimage`), the position, the size and the
`href` — which is all an SVG image is drawn from.

**And the plugin was English-only in practice, which this exposed.** Every other domain builds its compile
table from the pack's own keyword list — that is why `mets` and `crée` work — while `svg.js` switched on
canonical names, so the element names the packs carry (`chemin`, `rettangolo`, `svgtesto`) resolved to
nothing at all. One line in its `getHandler` (`reverseWord`) fixes the class; the proof is that the Italian
declaration moved from failing on `svgimmagine` to compiling. Worth a look by Graham, since the svg
vocabulary is now localisable by a mechanism the other domains do not use.

**The wheel amount now reads whichever axis the wheel moved furthest on.** Browsers report a shift-wheel as
a *horizontal* scroll on most platforms, so a `deltaY`-only reading would have made the very gesture Graham
chose for zoom arrive as no movement at all. The axis does not need telling apart for a zoom, so the value
takes the larger magnitude and keeps the sign. Both cases are in `various/wheel-check.js`: `-120` for a
plain wheel, `120` for the same gesture reported on x.

**The modifier reading is in** (2026-09-30), which was the one thing between here and a zoom. `on wheel`
exposes `the wheel shift` and `the wheel control` beside the amount and the position, each **0 or 1** rather
than true/false so the reader can add or multiply it without a conversion first; the listener stores
`event.shiftKey` and `event.ctrlKey` that way. The compile side folds the four readings into one
`[amount, position, shift, control].find(matchesWord)` and builds the type name from it, so a fifth reading
is one word in that list; the runtime cases sit together in `getValue`. Words added to all four packs —
`shift`: `maj`/`maiusc`/`Umschalt|umschalt`, `control`: `ctrl`/`ctrl`/`Strg|strg` — **fr/it/de provisional
and for native review**, as `wheel`/`amount` are; `./sync-language-packs` run, `resources/doc/en/browser.json`
gained a `wheel shift` and a `wheel control` value and the missing `on wheel {element} ...` line in `on`'s
syntax, and `./deploy-sync` was run so the doc ship matches the source (it touched only the two doc files).
Verified by `various/wheel-check.js`, now three events — plain, shift and control — **in all four
languages**: the plain wheel reads `-120/0/0`, the shift-wheel `120/1/0`, the control-wheel `-50/0/1`, and
every reading is the pack's own local word. `asedit` still compiles at 1716 commands, 0 errors.

**The viewport is in, and with it the zoom and the pan** (2026-09-30) — which was item 1 of "where the work
goes next", and item 2 as well. `Draw` now shows a **window** on the run rather than the whole of it: two
ranges in the trace's own units (steps across, lines down), fitted to the whole recording when a run is
opened, and moved by three gestures — **wheel alone scrolls, shift-wheel zooms, drag pans**, Graham's scheme
from Kdenlive and Audacity. The three are the view's own entry points (`VizGrab`, `VizPan`, `VizWheel`), with
`VizReset` for the host to call on entry; the editor registers `on pick VizHost`, `on wheel VizHost` and
branches its existing document-level `on drag` on `GraphMode`, which is possible because the two views never
share the screen.

Four things about it are worth keeping. **A window, not a scale factor** — a factor has to be relative to a
fit that changes with the recording, and an absolute one sits pinned at one end, which is the prototype's own
lesson. **The steps are exact inverses**: in shrinks the window by a fifth, out grows it by a quarter, and
4/5 × 5/4 is 1, so the harness can demand that two notches in and two out land back on the fitted picture
byte for byte — and it does, on both fixtures. **The clamp is the reset**: zooming out and panning both stop
at the edges of the run, so there is no reset button to find. And **the marks are left out rather than
clipped** when they fall outside the window, because the plugin has no clip element and a mark outside the
frame paints over the axis — while a *transfer* whose ends straddle the window is kept and its ends clamped
to the frame, which is what a clip would have done.

Verified the way the project verifies a drawing: `various/plotview-check.js` now drives the four gestures
through the view's own entry points with the DOM values a browser would set, and reports the picture at each
step. On a 25-step fixture and a 284-step one, all five checks pass — every phase's marks inside the frame,
the zoom round-trip exact, every scroll and every drag moving the picture, and `VizReset` restoring the fit.
And the fitted picture is **byte-identical to the pre-viewport view** on both, proved by running the section
from `git show HEAD:asedit.allspeak` through the same harness (`PLOTVIEW=…`) and diffing. `asedit` compiles
at 1907 commands, 330 symbols, 0 errors.

**Two harness faults were found on the way, both worth keeping.** The settle detector counted *quiet ticks*
alone, and a draw blanks the picture before it draws it — so a big recording was declared finished while it
was still blank, which is what made the old view look like it drew nothing on the 284-step fixture. It now
requires having seen the picture change at least once. And the first observation was itself counted as a
change, which put the same mistake back one line later.

**The source is behind the heat** (2026-09-30) — the "program behind the heat" half of Graham's four
requirements, and the raster he asked for, with one substitution he agreed to. Where he proposed a
**canvas raster** (a plugin draws the source into a canvas and hands back a PNG data URL), the picture is
instead an **SVG document the view builds itself**: one `<image>` (the `svgimage` element) whose `href` is
`data:image/svg+xml,…`, assembled from `json split` (which splits on newlines by default and yields a JSON
array `element N of` can read) and `replace` (a global literal replace). So no canvas is reached, no new
vocabulary is invented, and the text stays vector — it cannot go soft past the scale it was rendered at,
and there is no 16,384-pixel ceiling to split around. The rows are `<tspan dy="18">` under one `<text>`, so
the offset accumulates and the whole file is one element with no per-line coordinate to compute.

**The picture is the window, and that is also the clipping** (2026-09-30, revised the same day on
Graham's report that text was showing above and below the panel). It is stretched to the frame with
`preserveAspectRatio: none`, x and y independently, which is what puts each row on the line the axis names
— and the *document holds only the lines the window shows*, so the picture is exactly the frame and cannot
spill onto the axis or the caption. An `<image>` lays its content out inside its own box and paints nothing
outside it, so the rectangle being the frame is a structural guarantee rather than a mask; the alternative,
a document per run with the element made taller than the frame to keep the rows in step, is what let the
text past the edges. The cost of the revision is that the document is rebuilt on every draw rather than
once per run — the rows in view, not the whole file, so at the fit it is the biggest it gets and at a zoom
it is small; a control-wheel notch that leaves the rows alone still rebuilds them, which is a known and
unfixed cost. The lines' `<`, `>` and `&` are escaped first (ampersand first, or it would escape its own
escapes), then `%` and `#` are percent-encoded for the URL. Host side: `VizSource` is read from the active
tab beside the recording, and a source that will not read leaves the pane plain rather than failing the
draw.

**The zoom is per axis** (2026-09-30, Graham's second correction): **shift-wheel zooms the lines**,
**control-wheel the steps**, both together both, and the wheel with neither modifier still scrolls down the
run. His first scheme had shift-wheel zooming both, and he called that a mistake — the steps are *when* and
the lines are *where*, and how far apart two arrivals are in time says nothing about how far apart the lines
they land on are. `VizWheel` therefore reads the two modifiers and marks the axes; `VizZoom` touches only
the marked ones, and an unmarked axis keeps its size and so is moved by nothing in the centring. Control is
taken over from the browser's own page zoom, which the pane's listener already `preventDefault`s.

Verified by `various/plotview-check.js`, which now hands the view a source of its own — fifty lines with a
blank row every seventh, one with `<`, `>` and `&`, one with `#`, `%` and `"`, and one 68 characters long —
and checks the things that matter rather than the things that are easy. Fifteen statements, all passing on
both fixtures: **every row sits on the line the axis names it**, with the document *saying which line it
starts at* so the grid is placed against the axis rather than merely sized like it (80 comparisons, worst
0.9 units out); **each axis moves only itself** (the check that would catch both wired to one modifier, and
which nothing else in the file would notice); the picture's rectangle is the frame in every phase; the
document's row count follows the window (20, 16, 13, 11); the round trip lands exactly on the fit once per
axis; the tags balance (`svg 1/1, text 1/1, tspan 20/20`); and the two awkward lines survive the URL byte
for byte. The marks and labels are **still unchanged** from before any of this landed, on both fixtures.
`asedit` compiles at 1985 commands, 346 symbols, 0 errors.

**One sign error was caught by arithmetic rather than by the harness, and it is worth knowing why.** The
picture's top was written `take VizMinLine from VizViewY0` — which is `ViewY0 - MinLine`, the negation of
what the mapping needs, and it put the text *below* where it belonged, moving the wrong way as the window
moved. The harness's checks at the time all passed: nothing outside the frame, a rectangle that changed,
rows that balanced. **A wrong value that is still a plausible value is what a check has to be written to
catch**, and the one that catches it is the one that compares the picture against an independent witness —
the axis. It is in the harness now. The same fault reappeared a moment later in the harness itself, where
`take`-style destructuring took a `[name, state]` pair for the state; that one was caught in seconds
because a value that is there but is the wrong shape fails loudly.

**Graham's four points, and where they stand** (2026-10-01). He raised them after looking at the pane, and
said of them that "much of the above is guesswork and will have to be resolved by trial and error" — which is
the tracking instruction, and it is being answered by landing one point at a time so he can look at it, in
the editor, before the next changes what it looks like.

1. **One drawing, zoomed and panned — LANDED.** The source was being redrawn at every gesture, so a zoom
   changed the *document's* proportions while its line lengths stayed put, and at high zoom the letters were
   pulled tall. It is now drawn once when the run is opened, at the size the text is really written at, and
   shown through `VizPane` — a nested `<svg>` the size of the frame whose `viewBox` is the whole of the zoom
   and the pan, one attribute per draw. The pane is also the clipping, which is what a picture cannot do for
   itself. **The consequence to look at, and it is a real one:** the window's width is what the frame's
   aspect allows at that row height, so at the fitted view — hundreds of rows in a 580-unit frame — the
   source is a *narrow column* down the left of the panel rather than a full-width texture, which is the
   opposite of what he expected ("longer lines will fall outside the right side"). If he would rather have
   the full-width shape at low zoom and the natural proportions only once the text is legible, that is
   `VizWindowW` set to `VizGlyphWidth` — **one line**, and it is not taken because what he asked for is what
   is built. **He has since looked and answered: "you're right, I had a faulty mental image... it's almost
   exactly right"**, so the coupling stands and the narrow column at the fit is accepted.
   **And one fault, found by him and fixed:** at the legible floor a further shift-wheel notch slid the
   window up a few lines, with a redraw flash. The cause was order: `VizZoom` centred the window on the
   size it had *computed*, and `VizClamp` then refused half of it, so the origin kept the centring's share
   of a change that never happened. The size is now clamped before the origin is moved to follow it — and
   because a refused notch now leaves the window identical, `VizRedraw` skips the draw entirely, which is
   the flash gone as well as the drift. `VizNote`/`VizRedraw` are the general form: a gesture that changes
   nothing does nothing, for the pan and the scroll as well as the zoom.
   **And he asked the follow-up question that found the rest of it — "does the graphics system clear then
   redraw, or redraw and switch buffers?"** The answer was: clear, then redraw, in the live DOM, with no
   buffer — and the clear was *paintable*, because the passes yield to the browser every hundred marks. So
   the flash had two causes and the second was structural. Every draw now builds all of its output in
   variables and writes nothing to the DOM until the end, in a run of statements with no yield in it: **the
   buffer is the variables and the swap is the last block.** The evidence is positional and easy to re-check
   — no `set attribute` or `set the text` appears anywhere in `VizBuilt` before the final block, so nothing
   the browser could paint is ever half-built. A redraw therefore leaves the previous picture up until the
   next one is complete, which is what a double buffer would do, and the blanking block at the top of the
   draw is gone (its accumulator resets stay, because those strings are grown by `cat`).
2. **The zoom stops at the text's own size — LANDED.** `VizGlyphRows` is `PlotH / 18` rows, derived rather
   than chosen, and `VizClamp` will not go below it. Applied *before* the clamp to the run, so a recording
   shorter than that many lines has no vertical zoom at all — which is right (there is nothing to zoom into)
   and is now the reason the harness reports those phases as "nothing to move" rather than as failures.
3. **Arrow heads, and a colour per kind — LANDED** (2026-10-01). One path per kind instead of one
   `VizFlowLines`, in the prototype's own colours: `call` `#e0a44a`, `jump` `#43c6a8`, `return` `#c07ad0`.
   The head is a chevron in the path data — the plugin has no marker element and a stroked chevron needs no
   fill — placed at the destination end with its wings behind the tip, which side depending on which way
   the segment runs; a transfer whose ends are the same line gets no head, since a head with no direction
   would be claiming one. **`branch` is now not drawn at all**, and that is a visible change: the trace has
   recorded the compiler's `if`/`while`/`wait` jumps as `branch` since draft 2, the settle note says they
   are "drawn only when asked for", and the view had been drawing all four kinds alike — so about a fifth
   of the flow on `trace-run.allspeak` was machinery. The prototype's default agrees (they sit behind a
   "compiler jumps" checkbox), and a fourth path plus a button is what it would take to offer them.
4. **A faint rule per recorded line — LANDED** (2026-10-01, then corrected the same day). One hairline
   across the frame at every line the run *names* — an arrival, or either end of a transfer — so a line
   visited forty times gets one rule and not forty, and a line the run merely passed through gets none.
   Only the rules *in view* are drawn, since the loop covers the run and the window is a slice of it.
   **Two faults, and both were found by a check rather than by reading.** The first version drew rules for
   *every line the run executed* — taken from the window's per-line counts — which on `trace-wide.allspeak`
   is 148 lines where only 62 carry anything; the other 86 are the `add` and `go to` between one label and
   the next, and a rule on each is a grid over lines with nothing on them. **Graham saw it before any check
   did**: "too many of them... is it possible some belong to the internal gotos from if, wait etc?" They were
   not the gotos — those are already out of the flow — but the instinct was exact, and the counts were the
   wrong source. And the first version also drew the off-window rules, which map outside the frame and cross
   the axis: *that* one the "every coordinate is inside the frame" check caught, on twenty of twenty-eight
   phases. The harness now checks the converse too — **the rules are exactly the lines the recording names,
   and nothing else** — which is the statement whose absence let the wrong version pass 20 of 20.
   The set is a padded string with an `includes` test, because the language has one of those and no set type;
   the padding is what stops ` 15 ` matching inside ` 115 `. Its colour is `#eee`, on Graham's eye: the pane
   sits on the editor's white, and `#2b3138` was a near-black grid there.
   **What is missing, and it needs a word from Graham before it is drawn:** the flow colours mean something
   and nothing says what. The key names the four heat bands and has no room on the caption's line for three
   more entries, though the space between the caption and the key (about 280 units) would take them. What
   wants settling first is the *vocabulary* — the trace says `call`/`jump`/`return`, and a reader's words
   are probably `gosub`/`go`/`return`.

**The mode invariant, and the bug that wasn't one (2026-10-01).** Graham reached a state by the one path that
shows it — Graph, then Blocks — where both the Graph and the Blocks buttons read `Edit`, and in the same state
the graph was left lying under the Blocks pane. Both faces are one omission: `EnterBlocks` never turned the
Graph pane off. `EnterGraph` had always turned Blocks off, and `ActivateTab` turned both off, so the *other*
direction was fine and had been since the Graph pane was added — `EnterBlocks` was written before it existed
and nothing pointed at the assumption it was making.

**Fixed by closing the class rather than the instance.** `DoExitPanes` is now the single statement of "which
other modes there are", and the three entry points call it — `EnterBlocks`, `EnterGraph`, `ActivateTab`. A
fourth pane means changing that one subroutine; the entrance still has to remember to *call* it, which is the
part that is not enforceable and is why the comment sits at both entry points. The verification is a click
rather than a check: the two harnesses drive the drawing, not the editor's UI state, and nothing headless can
see a button's label.

**A mode comes back as it was left (2026-10-01).** Graham's requirement: *"The first visit needs to set things up,
but subsequent visits should avoid any form of reset. So the current line number remains the same in Edit mode,
and the zoom/pan setting in Graph mode."* And for the open question — what to do when the user changes one thing
and returns to the other view — his call: *"just restoring it as it was previously is the best"*.

The window was being fitted on **every visit**, because the host called `VizReset` on the way in. The view now
decides for itself, and the thing it decides from is **the recording**: the same recording is the same run, so the
window is kept, and a different one re-fits. The comparison is over the whole string, and that is the honest
key — a recording is a file beside the script, so editing the script leaves the recording alone and the window
still means what it meant, while re-running writes a new one.

**The two inputs are different, and that is the whole of the design.** The picture answers to the *script* and
the window to the *recording*: a redraw touches only the window it was given; an edited script rebuilds the
picture and leaves the window exactly alone; a new recording re-fits. **And the near-miss is worth keeping**:
moving the fit out of the per-visit path took `VizSourceMeasure` with it, which would have left an edited script
showing its old text — silent, plausible, and caught only by the check written for it.

**The flat editor's line** is read when the pane opens and put back on the way out. **The one thing to revisit is
how it goes back:** `codemirror scroll to line` is the only command that calls `refresh`, and the plugin's own
note says a hidden CodeMirror needs one — so the line comes back near the *top* of the pane rather than at the
height it was. A plain `codemirror refresh` command would re-measure without moving; it is a small addition to
the plugin, and it is the difference between "the line is right" and "the view is right".

**A tab keeps the caret *and* the view (2026-10-01).** Graham, from Kdenlive: scrolling must not move the
insertion point, and the view must not be dragged to the caret on return — the jump that catches him out there.
Two faults, which are the two halves of it: **a tab switch reset both** (`ActivateTab` sets the content, and
`setValue` resets the caret and the view), and **leaving the Graph pane scrolled the view back onto the caret** —
the same jump, in the same shape.

**The fix is a pair, kept apart.** Each tab remembers the caret's line *and* the viewport's scroll offset, and both
go back on return — through the same two subroutines for a tab switch, the Blocks button and the Graph pane, so
there is one answer to "where was I" rather than one per way of leaving. Three commands were added to the
`codemirror` plugin, which is the editor's own plumbing (the domain is undocumented and no user writes it):
`view of` / `view to` for the scroll offset, and `cursor to line` for the caret — and that last one deliberately
does **not** scroll, which is what stops the pair disturbing each other. **The column is not remembered**, only the
line, because that is all `get cursor` returns.

**Two traps, both paid for.** `getNextValue` reads the token *after* the one the index is on, and `nextIsWord`
advances before it answers — so `nextIsWord('to')` followed by `getNextValue()` steps over the value. It surfaced
as a runtime error about a value called `in`, which points at nothing. The plugin's own `get` chain carries a
warning about exactly this, now in its second paying. And `deploy/code/asedit.allspeak` went stale again the moment
the root copy moved — which is the two-copies item below, and this is its third reminder.

**Not verifiable headlessly**, and it is the same class as the mode-invariant bug: which caret, which scroll, which
pane is editor UI state, and no check can see it. **And that prediction came true within the hour**: opening a
second tab from the *file browser* died with *"Array index 1 is out of range for 'TabCursor'"*, because the two new
per-tab arrays were grown in `NewFile` (the + button) and not in `OpenFile` (the browser). Fixed by the same move
as `DoExitPanes` — **one `TabGrow` subroutine makes room for a tab**, and both callers use it, so a seventh
per-tab array is one line in one place. `CloseTab` is the only other site that knows the list, and it shifts the
value arrays back down; the element arrays are rebuilt from the count.

**That is the third paying for one shape** — a list kept in step in more than one place: `svgimage`'s seven sites
(two missed), the mode panes' one entry point that did not exit the others, and now the tab arrays' two ways to
open a tab. The fix has been the same each time: make one place responsible. It is worth watching for, because the
*failure* is not the same each time — two were silent and this one was loud — while the cause always is.

**Where the work goes next, in order** — the flow's key first (it is the one thing the colours need to be
readable, and it waits on Graham's words for the three kinds), then:

5. **The side panel, and the hover rule.** The settled note above: at low zoom show the current marker and
   any doc prose, not the line's command, which is meaningless at that size. The panel is a reuse of the
   Blocks split — draggable divider and doc pane — so the work is the rule rather than the furniture, and
   the rule needs the pointer→line mapping (a pixel → a viewBox y → a line). That is the letterboxed
   arithmetic the *zoom* deliberately avoided; `VizPixelScale` already computes the scale, so what is
   missing is the centring offset and the inversion.
6. **Per-marker data** — wants his idea in words. The anchor is the designed extension point, and the trace
   format deliberately carries no values.

**Done, for the record:** the modifier reading (`the wheel shift` / `the wheel control`), then the viewport
with its zoom and pan, then the source behind the heat — items 1 and 2 of this list, and the first half of
what was item 3, all landed 2026-09-30.

**Smaller items, in any order:**

- **Four `verify-stale` sign-offs** — his by convention: the editor's declarations, its handler block, the
  Graph host's section, and the view's own. Until he clears them the analyser reports four warnings.
- **The source picture wants a browser, and this is the one thing a check cannot say.** Three things are
  unverifiable here and none of them is subtle if wrong: that a browser renders an `<image>` whose `href` is
  an SVG data URL at all (plain `href`, SVG 2 — every current browser takes it, and `xlink:href` is the
  fallback if one does not); that `xml:space="preserve"` keeps the indentation; and that the monospace
  advance is close enough to the 8 units a column is assumed to be, where a mismatch only widens the right
  margin. Decoding the URL and checking the document is well formed, and that its rows sit on the axis, is as
  far as a headless check reaches. **The clipping is no longer on this list** — the picture is the frame, so
  a browser that draws it at all cannot draw it outside the panel.
- **A horizontal notch rebuilds the picture even when the lines in view have not changed.** The document is
  the rows in view, so the cost is the window's height rather than the file's, but at the fit a control-wheel
  notch rebuilds the largest document there is for no change in its content. A guard — rebuild only when
  `VizViewY0`/`VizViewYH` have moved — removes it, and is not there because the standing call is to leave
  optimisation until the functionality is finished.
- **Tabs.** A tab in the source is one character in the document, and SVG's whitespace rules turn it into a
  single space, so a tab-indented file would lose its column alignment. `.allspeak` files are space-indented
  so nothing in the tool shows it; `as_condition.py`, which is what the redacted picture is of, is not.
- **The cost of a live pan** — the drag redraws on every drag event, so the picture follows the pointer at a
  few frames a second on a big recording. Graham's call (2026-09-30): leave it until the functionality is
  finished. The fix, if it reads badly then, is to translate the five path attributes with an SVG
  `transform` during the drag and redraw once on release.
- The ramp's bottom end: with a band size of 1 a once-visited line lands in band 1, so a quiet run shows
  amber for its least-worked lines. One line to change (`take 1 from VizCount` before the division), and it
  moves every boundary; the legend makes either choice legible.
- The two copies of `asedit.allspeak` — hygiene, not a bug: nothing he runs reads the second one. The
  options are in `DIFF.md`; the recommendation is to have `deploy-sync` refresh `deploy/code/` from the root,
  so the local published copy cannot be stale *and* so `BUILD.md`'s claim that the `cp` step is enough
  becomes true. Publishing to the live site is still `./deploy-allspeak`.
- The size of a mark — settled in code at 14 units, one line if he wants it tuned. It does not shrink as the
  window narrows, which is deliberate: a mark has to stay legible to be a mark.
- The provisional fr/it/de words for `wheel`, `amount`, `shift`, `control` and `svgimage`, and the
  `reverseWord` line in the svg plugin's `getHandler` — all awaiting his eye.

**Working methods that earned their place**, worth keeping: `tools/asedit-check.js` exists because a check
that loads every plugin verifies a program nobody runs — it caught `I don't understand 'VizBands'` when
"declare before use" turned out to be positional in the file. **Never redirect stderr on a check whose
stderr is its verdict** — hours were lost running the harness `2>/dev/null`, which discarded the
`Non-numeric value` report it was written to produce. **"Fail closed" means build the result in memory,
assert, then write once**: a patch that wrote per-file left the sketch half-changed and broke the harness
for a turn. And **a check that reads a value mid-flight reports the half-finished state as the answer** —
which is the whole of the puzzle above, and a cousin of the stderr lesson: the instrument was measuring at
the wrong moment. And the tiny dots had a third cousin, the most expensive of the three: **a value computed
before the pass that measures it silently uses the previous draw's number.** Both readings are plausible, so
the fault never looks like a fault — the first render is "right" and every later one is not, which is what
made it read as a cap problem for two rounds.

## High priority

### 1. ~~String split by delimiter~~ ✓ Done
Implemented in both JS and Python. The `split` command now accepts `by` in addition to `on`:
```
split MessageText by `|` into Parts
put element 0 of Parts into TopicName
```
New value expression for single-field extraction:
```
put field 0 of MessageText delimited by `|` into TopicName
```

### 2. ~~Append to JSON array in file~~ ✓ Done (Python only)
Implemented in Python. Creates `[]` if the file doesn't exist. Supports `or` error handling.

```
append `{"name":"test"}` to json file `data/topics.json`
```
JS not applicable — browser file writes use `rest post` to a server; the existing in-memory `append` command covers the JS use case.

## Medium priority

### 3. Storage get with defaults
`get X from storage` returns the string `"null"` or `"undefined"` when a key is missing, requiring repeated cleanup. Should return empty instead, or support a fallback:

**Proposed syntax:**
```
get Broker from storage as `chat-broker` or clear
```

### 4. Multi-field unpack with remainder
For protocols using delimited fields where the last field may contain the delimiter:

**Proposed syntax:**
```
unpack MessageText by `|` into TopicName Subject Author Body
```
Last variable gets the remainder.

---

*Source: friction points from the chat/forum project, April 2026.*

---

## Housekeeping (not language work)

### 5. Prune `resources/ecs` — scheduled, not yet done

`resources/ecs/` is a **superseded site generation**. `documents/doclets-feature-checklist.md`
already records the reason: the deploy pipeline never ships it (`deploy-allspeak` mirrors only
`codex/`, `learn/`, `primer/`). What remains is a mixture of ages and purposes, which is the
argument for pruning it rather than keeping it as one unit:

- **18 files dated 2026-04-06** (the fork day) — the old site's pages.
- `scripted.allspeak` / `scripted-server.allspeak` / `scripted.html` / `scripted.json` / `README.md`
  (04-08) — the self-contained "scripted" colour-coded editor, a five-file bundle described in
  `resources/ecs/README.md`, which now sits among unrelated pages.
- `docman.allspeak` (04-17), `doclets.allspeak` (08-04), `main.allspeak` (08-19) — the more recent page work.

Renaming the folder is not worth doing on its own: if it is pruned, the name goes with it; if a
subset survives, name it after what it is (`scripted/`).

**Clear these first — each is a reference the prune would leave dangling:**

1. `project.html:13` loads `/resources/ecs/project-main.allspeak`, which does not exist. Fix or retire
   `project.html`.
2. `codex/{en,de,fr,it}/md/tools.md` use `/resources/ecs/myscript.allspeak` as an example path. Repoint
   to a path that exists.
3. The four `resources/doc/*/core.json` translation caches link to `resources/ecs/sample/factory`,
   which does not exist. Repoint or drop the links.
4. `index.html:21` and `codex/codex.allspeak:303` load `main.allspeak` and `docman.allspeak` from the folder. Decide
   whether those entry points survive.
5. `resources/ecs/README.md` describes a five-file bundle but sits in a folder of unrelated pages.
   Move the `scripted*` files out together with their README, or drop them.

**Why nothing can be lost:** all 33 files under `resources/ecs/` are tracked, so any of them is
recoverable with `git log -- resources/ecs/<file>` after deletion. Run `./deploy-sync` afterwards,
because `deploy/` holds a mirror of the tree.

**When:** together with the `resources/` prune as a whole — not during a deploy freeze, and not
with a release in flight.


## Language packs

### 6. ~~The `viz` marker's option words~~ ✓ Reviewed 2026-09-28 — the words stand, provisional fr/it forms included

`viz` is core syntax (a no-op command) with the grammar
`viz start|stop [on <label>] [once|every] [until thread] [limit <count>]`. Every option
word now has a local spelling in all four packs, so a marker can be written entirely in the
local language — verified by compiling each of these to the same internal marker
(`request=start, mode=once, until=thread, limit=2`):

    fr   viz démarre une-fois jusqu'à fil limite 2      viz arrête
    it   viz avvia una-volta fino-a discussione limite 2   viz ferma
    de   viz starte einmal bis Thread Limit 2            viz stoppe

`viz` itself stays `viz` in all four languages, as `json` and `mqtt` do: technical keywords
are not translated.

| canonical | en | fr | it | de |
|---|---|---|---|---|
| `on` | on | sur | su | bei |
| `start` / `stop` | start / stop | démarre / arrête | avvia / ferma | starte / stoppe |
| `every` | every | chaque | ogni | jede |
| `once` | once | une-fois *(provisional)* | una-volta *(provisional)* | einmal |
| `limit` | limit | limite | limite | Limit\|limit |
| `until` | until | jusqu'à † | fino-a | bis |
| `thread` | thread | fil | discussione\|thread | Thread\|thread |

† Four spellings — `jusqu'à|jusqu’à|jusqu'a|jusqu’a` — because the match is exact and a
French writer chooses the apostrophe (ASCII or typographic) and the accent independently.
Verified end to end. This is the first apostrophe in any of the four packs.

**Constraints a local word must satisfy** (learned the hard way, worth keeping for any
future vocabulary):
- **One token.** The tokeniser splits on whitespace and `reverse_word` is a whole-token
  lookup, so a phrase can never match: `une fois` is two tokens and no entry can bind it.
  The failure is loud rather than silent — `viz start une fois` stops with
  `Je ne comprends pas 'une'` — but it is still a failure. Hyphens and apostrophes are fine
  inside a word, which is what makes `une-fois`, `una-volta`, `fino-a` and `jusqu'à` work.
  This is also why the label form is `on <label>`: `une` and `una` on their own are already
  the article (`an`), and `on` needed no new word at all.
- **Case matters.** The lookup is exact and every existing German keyword is lowercase
  (`körper`, `nachricht`, `zahl`), so the correct German noun spellings — `Limit`, `Thread` —
  are entered as `Limit|limit` and `Thread|thread`, keeping the proper spelling canonical
  without making them the only keywords a German script must capitalise.

**For the native reviewers:** the French and Italian `once` forms are provisional guesses
(`une-fois`, `una-volta`); Italian `discussione` is the forum-thread sense, whereas the
marker means a thread of execution, so `thread` may be the better primary there; and the
German capitalisation call (`Limit`/`Thread` first, or lowercase-first) is a matter of taste.

**One follow-up.** `tools/generate-translated-docs.py` reads this same `words` table and
substitutes word by word (`words[tok].split('|')`, line 107), and the English doc source in
`resources/doc/en` contains the new words — `once` 4 times, `thread` 3, `until` 5 — so the
next doc regeneration will change some French/Italian/German lines. That is mostly what you
want for syntax lines, but the substitution is word-level and will also touch prose
containing those words. Worth eyeballing those diffs before the next `deploy-sync`.

### 7. `dictionary` / `list` in the JS flavour — measured 2026-09-29, see `language-pack-issues.md` #14

The assumption that implementing them in JS "would have severe implications" is recorded nowhere
and was never tested. Measuring it says they cost almost nothing: JS already has both *shapes*
under the spellings the reference documents, and the keywords would lower to the two lines it
already tells JS authors to write. `entry` is half-wired (`has entry` works, `set entry` and
`put entry` do not) — that looks accidental. The scripts actually kept out of the browser by these
two keywords number **one** (`examples/chemical/parser.allspeak`), and file I/O blocks it anyway.
Full measurements and three options in `language-pack-issues.md` #14.

**Also prototyped 2026-09-29 (#14b):** feasible in **four edits, all in `Core.js`, with no pack
change** — `dictionary`/`list` are untranslated keywords in all four packs already, like `json` and
`mqtt` — provided the declarations lower to `keyword: 'variable'` (18 places test that). It works,
and it moves `parser.allspeak` from failing at line 43 to line 45. **But it would mislead:** the two
runtimes' lists are different structures — Python has no `element` (it is `item`), JS has no `reset`,
Python dies on index-assign to a non-existent slot where JS auto-extends — so `list` + `element`
would compile on both, run on JS and fail on Python. Doing it properly means settling one idiom for
both runtimes first, which is a language decision.

**Decided 2026-09-29 — leave it alone.** Graham's rule is that the JS variant must follow "adding without taking away"; testing the prototype against it **passes** (319 scripts compiled with and without: 149 OK either way, **0 regressions**, the 4 verdict changes all `FAIL` → `FAIL`) but it still should not be done: it moves a boundary rather than closing a gap (the sweep found a fifth `entry` site), and it would advertise a portability that the list semantics do not support. **No visualiser workaround is needed** — the trace format is portable, so a script the JS runtime cannot run is recorded by Python and drawn by the same picture; `viz.allspeak` itself uses no containers and runs on both. See `language-pack-issues.md` #14b and #14c.

### 7b. `modifyValue` is still undocumented in the plugin contract

`as_value.py` calls `domain.modifyValue(value)` on every registered domain, and the JS twin
of that bug was fixed earlier by guarding `handler.value`. Any plugin domain must define
`modifyValue` to avoid an AttributeError; `spec/allspeak-plugin-contract.md` does not say so.

## Visualiser (`viz`) — decisions and next steps

**Governing principle** (Graham, and it overrides anything below that conflicts with it): *make
complex things simple.* The aim is a **fully-integrated solution with a concise feature set and a
minimal learning curve**, for an audience that includes people who will only stay aboard while
each learning step is small. Three rules follow, and future work should be checked against them:

1. **No new commands to see the picture.** The view is simply there for a script you have run. The
   two marker words a user has already learned — `viz start` and `viz stop` — are enough for every
   review; `on`, `once`, `every`, `until` and `limit` are refinements, not a curriculum. `viz` is a
   no-op without a recorder, so a script carrying markers runs like any other.
2. **Nothing in the onboarding depends on this.** The Primer's first steps carry no markers at all.
3. **Perfetto is not the product.** It is a development instrument and an optional escape hatch;
   users are never asked to learn it. Its UI is also English-only and has no notion of the script's
   own language, whereas our records already carry the user's own names and prose.

**The visualiser speaks the script's language for free.** The language packs already carry a
`diagnostics` section of user-facing strings in all four languages (`Je ne comprends pas '{token}'
à la ligne {line}.`), so the view's own labels belong there rather than in a translation layer of
our own. Anchor names and doc-block prose arrive in the author's language already, because they
*are* the author's text.

**Proposed, and no longer settled:** a **dual-pane** view — the script on one side, the picture on
the other, with the script *following* the user's navigation. The sketches below suggest one pane
can carry it; two may re-surface if one turns out too cluttered (Graham, 2026-09-28). Two
consequences hold either way, and are already built into the trace format: every event names a
`line` (the join key the editor scrolls to), and every event carries `steps` alongside its timing
(the deterministic axis, since timings are not comparable across runs or runtimes).

**In place:** `viz` markers as core syntax (no-ops without a recorder); the static model
(sections, prose, anchors, routes, windows, findings); the Python recorder; and now the recording
as a **file** — `spec/viz-trace-format.md` (Chrome Trace Event Format, the subset used and the
meaning of each `args` field) with `tools/check-trace.py` as the conformance check both runtimes
must pass. `tools/asviz-run.py --run --trace=<file.json>` writes one. As of 2026-09-29 the file
also carries **control transfers** (`cat: "transfer"`, `ph: "i"`, format **draft 2**): one instant
per arrival that is not the command after the last, with `from_line`, `to_line`, `steps` and a
`kind` of `call`/`jump`/`return`/`branch`. That closes the gap that left the flow invisible — a
call, a return, a jump and a loop's back-edge are now in the record. `branch` is the compiler's own
jumps (`if`/`while`/`wait`/`try` scaffolding), kept apart from `jump` because **a written jump
names a label and a generated one carries a numeric target** — Python's conditions compile to
`gotoPC` but JS's compile to `goto`, the same keyword its `Go` uses, so the keyword alone would
report the `else` of every `if` as an author's `go`. `pretrace.json` was regenerated. And
`./various/plot` (2026-09-29, `various/`, gitignored) draws it: **the script down the left, the
sequence across** — two bands in one canvas sharing y, because the script cannot share the plot's
x, where x means *when* and text has no position on it. Text appears once a row can hold it (both
sample scripts fit at 22–26 px/line), the anchor *names* take over below that, the arrival dots
keep their own column so none is lost to the sampling, and hovering a row lights it in both bands.

**Sketches, and what they established** (2026-09-28; `various/`, gitignored — run
`./various/silhouette <script>`, which prints the path and opens it). They render the *static*
model only: no trace, no runtime change, because the riskiest assumption was whether an unreadable
shape is useful at all.

- A whole-file view of a 626-line script **cannot** show per-line shape: 1.26 px per line leaves
  indentation sub-pixel. Resolution is the limit, not the encoding.
- The block rows have no zoom dimension — the whole file's form always fits — so a single zoom
  control cannot govern them and per-line rows at once.
- A block's bounding box cannot show nesting: every AllSpeak block starts at column 0, so the
  shallowest indent is 0 for all of them.
- The x-axis cannot be both glyph-proportional and whole-file legible. `parser.allspeak`'s longest
  line is 461 chars, which at glyph scale fills 238 px of a 1400 px pane — 17%, i.e. collapsed
  into the left margin. Hence the per-density x (percentage for blocks, glyphs for lines) — which
  Graham's read below now calls into question.

**From Graham's read of the sketches (2026-09-28):**

- Hover in the **compressed** view should show the **current marker and any doc prose**, not the
  line's text — individual commands are meaningless at that zoom. Line text belongs there only
  once zoom makes it legible; a toggle in the detail pane should offer either.
- The bars-without-text rendering is a poorer navigation aid than the compressed one. He would
  rather have **one continuous view**: the compressed picture at different levels of zoom, ending
  where the text's line height reaches normal. That replaces the mode switch, and implies one
  geometry rather than two.
- The gutter of marker dots and the doc-block prose are the parts he would keep.

**Settled by Graham, 2026-09-28** (after the sketches above; his own words noted where the choice
was made without confidence):

- **One view, and lines from the start.** Every line is a row; at low zoom they are sub-pixel and
  read as one compressed band per block, with the block label above it. *"I'll go with 2, but
  without being confident the one or the other is the right choice."* — so build it cheaply and
  judge it from the picture.
- **The bar is not a shape device — it is the heat channel.** *"What should be visible behind the
  text is a series of rectangular elements whose colours represent how busy that block is at that
  point in time (the sequence). Once the program flow moves away they revert to blue."* So "what
  should the bar measure" (extent, nesting) was the wrong question, and the per-density x argument
  goes with it.
- **The hover rule.** At low zoom, show the current marker and any doc prose — not the line's
  command, which is meaningless at that size. Line text belongs there only once zoom makes it
  legible; a toggle in the detail pane should offer either.

**Settled by Graham, 2026-09-29** — the colour channel, and the transfers:

- **Colour: both, behind a toggle, in one prototype.** The two readings of "how busy" are (a) two
  colours — blue for an anchor the program *has* against red for an arrival the run *made*, which
  shows the shape of the flow without ranking it — and (b) one ramp, each arrival shaded by that
  line's visit count *so far* against the busiest line in the window, so the most-revisited line
  ends at full red. He is not sure which reads better and a toggle is the cheap way to find out.
  Whether the **instruction count** should drive the shade instead of the visit count is
  unanswered, so the sketch shows the line's instruction count in the readout, where the two can be
  compared before choosing.
- **Transfers: recorded, not inferred.** The faint lines at each `go`/`gosub`/`return` come from the
  run (`cat: "transfer"`, built 2026-09-29), so each lands at its own moment. The compiler's own
  jumps are recorded too, but as `branch` and drawn only when asked for: `if`/`while`/`wait`
  scaffolding is not a program jump, and Graham's own caution about that is what the separate kind
  is for. Static edges from the model were the alternative — no runtime change, but not tied to the
  run, and only section-to-section.
- **Build: a throwaway sketch first** — `various/plot` (gitignored), judged from the picture,
  before anything in `asedit.allspeak`.
- **The pane count is still open.** Graham's 2026-09-29 note: *"when I say left and right panes I
  forgot it may be a single pane."* What follows from the plot having x = sequence is that the
  script cannot share that axis — in the sequence plot the text has no place — which is exactly why
  a second pane would have to follow the first vertically. Two panes side by side, or one pane
  whose x means something different once zoom crosses the text-legible threshold, is the question
  left open. **Built as the cheapest reading of it, not as a decision:** one canvas holding two
  bands — the script on the left, the sequence on the right — sharing y and nothing else, with the
  script toggleable so the plot can have the full width. It is a sketch, so the question is still
  where it was; the difference is that there is now a picture to argue about.

**Asked by Graham, 2026-09-29 — the picture's controls, and the source behind it.** Four requirements,
audited against the code the same day. The shape is consistent with the decisions above; the work is mostly
capability that does not exist yet, and one item is blocked by the language.

1. **Zoom, independent X and Y.** Not in the pane: it asserts a fixed frame (`viewBox 0 0 1000 700`,
   `preserveAspectRatio`, and the `VizMargin`/`VizPlotW`/`VizPlotH` constants) and recomputes the fit per
   draw, so the two axes already scale independently — but nothing can change them. Prototyped in
   `various/make-viz-plot.py` (independent view state, sliders relative to the fitted scale, wheel zoom
   with shift for X alone and alt for Y alone), and its lesson carries: **the axes have to be relative to
   the fitted scale, not absolute.** **The blocker is gone** — `on wheel` and its two values now exist
   (above) — but the prototype's axis-selective zoom wants **modifier keys**, and the runtime exposes none
   anywhere (`shiftKey`/`altKey`/`ctrlKey` appear nowhere in `js/allspeak`). So either the event grows a
   modifier reading, or axis selection comes from keys or clicks instead of the wheel.
   **Graham's scheme (2026-09-30), from Kdenlive and Audacity:** wheel alone scrolls up and down,
   **shift-wheel zooms**, drag does the panning, and there is no wheel-based left-right scroll unless a
   second or dual modifier is added. It makes sense and it lands as: wheel-alone and drag are expressible
   today; shift-wheel needs the modifier reading above, and shift is the *right* modifier to take because
   `ctrl`+wheel is the browser's own page zoom; drag already covers left-right, so the dual-modifier binding
   would buy a gesture the mouse already has at the cost of a step to learn. The axis-selective zoom the
   prototype used (shift for X alone, alt for Y alone) is **dropped** by this scheme, which is simpler: a
   zoom takes both axes, and the user has pan for the rest.
2. **Pan by mouse drag.** Not in the pane, and **expressible today**: `on pick`/`on drag`/`on drop` with
   `the pick position` and `the drag position` exist, and `asedit.allspeak` already uses them for the
   Blocks divider. Prototyped in `various/make-viz-plot.py:511-527`.
3. **The program behind the heat: one pane, code only.** Nothing in the pane — it draws a frame, marks,
   flow, axis, caption and key, no source text at all, and `$GraphArea`'s `"#"` is empty. The nearest
   prototype draws the source *beside* the plot in a left band sharing only y (`various/make-viz-plot.py`,
   `BAND=0.46`) and it *draws the prose* rather than excluding it. Two consequences worth settling before
   building: **the text is a bounded pool** — an element is a declared symbol, so there cannot be one
   `svgtext` per source line; the pool covers the rows in view at legible zoom, which is the cost of "at
   some zoom levels it can't be read anyway". And **the side panel is already an idiom here**: the Blocks
   view is a split with a draggable divider and a doc pane (`$BlocksSplit`, `$BlocksCodePane`,
   `$BlocksDivider`, `$BlocksDocPane`), so the textual detail is a reuse rather than new machinery.
4. **Program-related data per marker.** **No hook, and deliberately so.**
   `spec/viz-trace-format.md`'s "What the format deliberately does not carry" excludes prose, static
   structure and *values* — "nothing here records what was in a variable. That is the debugger's job, and
   the only honest bridge between the two is that they can agree on anchors." The one per-marker extra
   today is the marker's own label (`viz start on <label>` → `at=`). So the anchor is the designed
   extension point, and anything beyond a label is a versioned change to a format that
   `tools/check-trace.py` enforces on both runtimes — Graham's idea wants words before code.

**Graham's answer to item 3's bounded-pool problem** (2026-09-30): render the *whole* text at normal size
into an off-screen buffer once, then place it suitably scaled in X and Y behind the heat map — one render,
and everything after that is SVG. It removes the pool entirely: one element for the whole file instead of a
declared `svgtext` per visible row, and independent scaling in X and Y is exactly what an `<image>` does.
What it needs: an **`image` element in the svg plugin** — a fifth element type, the same five small additions
`path` needed — and a way to rasterise, since the language has no canvas vocabulary: a plugin that draws the
source into a canvas and hands back a data URL for the element's `href`. Two costs to decide on rather than
discover: a raster is resolution-fixed, so zooming past the scale it was rendered at goes soft (mitigated by
rendering well above 1:1, at the price of the buffer — 1400×8000 pixels is about 45 MB), and the text
becomes a picture, so nothing but an eye can read it. The side panel keeps its own copy of the truth: the
line under the pointer and its doc block come from the script and the analyser, not from the raster.

The prose half of item 3 is already solved off-trace: doc-block text comes from
`tools/asdoc-check.py --json` and joins the trace on script path and line numbers, which is where the side
panel's doc block would come from.

**A data gap that constrains the heat.** The recorder keeps per-line activity as **totals**
(`line_counts`) and a *sequence* only for anchors (`visits`: pc, steps, timestamp). So activity
over the run is derivable at **block granularity** — between consecutive visits, which is the
original "all the rows under the marked line, down to the next marker, take the same shade" rule —
but not per line. A per-line timeline would need the recorder to keep a series rather than a total.
The *transfers* are a sequence now (2026-09-29), so the flow has a timeline even though the work
does not.

**Next, in order — deliberately trimmed:**
1. **Look at the run picture** — `./various/plot` (2026-09-29). The script down the left with its
   marker dots, the run across the right: x is the sequence in steps, y is the line, arrivals are
   dots, transfers are faint vertical strokes, the two colour rules are on a toggle, and each axis
   stretches on its own with drag-to-pan. Judgement is the next input, and the questions it should
   answer are: does the row height the fit chooses want to be bigger; does the band want to be
   wider than 46% (one constant, `BAND`); and is the split honest, or is a *second* pane with its
   own scroll the better shape after all. One trap found while building it, and worth carrying into
   the real screen: the axes have to be *relative to the fitted scale*, not absolute — the fitted
   scale is whatever makes the window fit, which is 51.6 px/step for a 25-step window and 0.7 for a
   2000-step one, so any fixed slider range is pinned at one end before the user touches it.
2. **The doc-block prose, in the band.** The 2026-09-28 read said the prose is one of the parts to
   keep, and the block list is not in the sketch yet: the sections and their paragraphs are already
   in the model the generator reads (`section |` and `prose |`), so this is a draw pass and a
   decision about where a paragraph goes in a one-row-per-line layout. It is the cheapest remaining
   step that adds interpretation rather than decoration.
3. The first screen in `asedit.allspeak`, reading a **trace file** — agreed 2026-09-28: work from a
   trace for now; it needs nothing new from the runtime.
4. Only if it earns its place: running the script in-browser (needs the JS recorder), an
   overlay/code-map mode, and `viz diff`.

### The editor route — agreed 2026-09-29, and the next work

**The aim, in Graham's words:** the job of visualisation is to help the user *review new code as it
is created*, so the best place to invoke it is from inside `asedit`, where the new code lands. For
Python that means adding `viz` commands (by hand or by prompt), running the code to capture the
record, and then a **third editor view** — the picture. The JS route is similar. **A crucial aim is
to hide the plumbing.**

**Revised 2026-09-29, after Graham's note that some projects — RBR is the example — have to run on
remote hardware.** He does not expect asedit to reach that over SSH, so there must still be a way to
*record a run and bring it back for display*. That is not a complication: **the trace file is the
transport, which is what the format exists for** — its own purpose section says a recording is more
useful as a file than as an object held by the process that made it. Two consequences, and they
reorder the work:

- **The view must be fed by a *recording*, and a recording can arrive two ways** — recorded here, or
  opened from a file. The file route is both **smaller and required** for remote runs, so it comes
  first. The remote flow needs nothing new: the run writes the trace into the project
  (`tools/asviz-run.py --run --trace=<project>/…`, already supported), and whatever brings the
  project back — scp, git, a memory stick — brings the recording with it; the editor then opens it.
- **It needs no new server capability at all.** `/read` fetches the trace and the script, and
  `viz model <path>` gives the anchors and prose *statically* — both exist today. So the third view
  can be built and judged **before** `viz record` exists, which also means the remote case works on
  day one rather than after the in-editor path.

**A second worry removed, tested rather than assumed: the view needs no plugin command to read a
trace.** AllSpeak can walk the nested document directly — parse it with `json of`, reach
`traceEvents` with `property \`traceEvents\` of …`, index it with `element N of`, and iterate with
`while Events has element Index` (verified, including past the end); nested fields read with
`property \`args\` of …` then `property \`line\` of …`; and `X has entry \`k\`` tells the two event
shapes apart, so anchors (which have `line`) and transfers (which have `from_line`) can be handled in
one loop. The one thing that does *not* work from the shared reference is `the count of` — see
`language-pack-issues.md` #15.

**Drawing from AllSpeak is feasible, and verifiable without a browser — both tested.** The `svg`
vocabulary turned out thinner than the plugin's opcode list suggests, and the whole of it was
established by running a real script against a stub DOM in node (a harness that records
`appendChild`/`setAttribute` calls), which is how the view can be developed and checked at all:

- `create` fills a **parent symbol**, not `body` — so a root needs a host element first
  (`div Host` + `create Host in body`), then `svg Canvas` + `create Canvas in Host`. Children go in
  the root: `line Stroke` + `create Stroke in Canvas` ✓.
- `move <symbol> to <x> <y>` is how geometry is placed (a line's `move` sets `x1`/`y1`), and
  **`set attribute \`x2\` of Stroke to 30`** — the *browser* domain's attribute set — covers the
  rest, working on an SVG element like any other ✓. `set the text of <svgtext> to …` is text.
- So a mark costs three or four statements: `create`, `move`, then attributes.

**And the view cannot be drawn yet: the svg plugin has no `path` element — which is the real
finding.** Performance settled the plugin question in the other direction, and my own framing was
overstated: "three or four statements per mark" is a loop *body*, written once. But building the
first cut showed the thing that actually bites. An AllSpeak element is a **declared symbol**, so a
script cannot create N elements for N marks; a picture with a variable number of marks therefore
needs one element per *layer*, drawn from a `d` attribute grown by concatenation. `js/plugins/svg.js`
declares `circle`, `ellipse`, `group`, `line`, `rect`, `svg` and `svgtext` and **no `path`** — the
word does not appear in the file at all. So the requirement is one more element type in the
*existing* plugin, about five small additions mirroring `rect` (a declaration handler, a `Create`
case, the create-run case, and `getHandler`), which is additive and needs no new plugin. Sketch and
its stub-DOM harness are in `various/` (gitignored), failing at the declaration until then.

**The view is in the editor** (2026-09-29). `asedit.allspeak` gained a **Graph** pane: a third view
beside flat and Blocks, with its own button in the top bar (`asedit.json` gained `$GraphBtn` and
`$GraphArea`), a `GraphMode`, and the plot view appended as a portable section kept byte-for-byte
from `various/plotview.allspeak`.

**The recording is a file beside the script** — `<script>.viz.json`, written by
`tools/asviz-run.py --run --trace=<script>.viz.json <script>`. That is what makes the remote case
work: a run captured on the rig arrives with the project however the project travels, and reviewing a
script in the editor never executes it. When the file is absent the pane says so and *names it*,
which is the whole of the plumbing a reader needs.

**What was verified, and what could not be:** `asedit` still compiles to a program — **1489 commands,
253 symbols**, which is the check that matters because a broken editor analyses clean — all eleven new
symbols (`ToggleGraph`, `EnterGraph`, `GraphNone`, `DoExitGraph`, `Draw`, `VizCanvas`, `VizHost`,
`VizTrace`, `GraphBtn`, `GraphMode`, `VizBuilt`) resolve, the analyser reports **0 errors** and no new
warnings, and the layout JSON is valid with the button and pane in place. The one thing not verified
is the editor *in a browser* — there is none here — so the look and the click are for Graham.

**And the editor could not compile it — a real error, reproduced and fixed** (2026-09-29). Graham hit
`I don't understand 'svg' at line 1633` opening the editor. The cause: `edit.html` loads the runtime
and its plugins from a **fixed list**, and that list had no svg plugin — so `svg VizCanvas`, the
view's first declaration, had no handler.

**The diagnosis was a hole in my own verification, and this is the part worth remembering.** My
compile harness loaded *every* plugin in `js/plugins`, so it passed while the editor failed: it was
verifying a program nobody runs. `tools/asedit-check.js` now **derives the plugin list from
`edit.html` itself** and compiles `asedit.allspeak` with exactly those, so the two cannot drift. It
reproduces the failure when the plugin is removed — *"I don't understand 'svg' at line 1633"*, the
same line — and reports `commands=1489 symbols=253 OK` with it present. It also covers the standing
gap the repo's notes describe: `asdoc-check.py` reports doc blocks, and a broken editor analyses
clean, so the command count is the check that matters and now has a tool.

**And the page now prefers the working tree's build** (`deploy/dist/…`) with the deployed copy as a
fallback, so a change to the runtime or a plugin is visible without deploying — which the view needs
twice over, since it depends on the new `svg` plugin *and* on the `path` element added to it.

**First real picture** (2026-09-29). With the markers moved onto the parser's own loop (lines 206–213),
Graham ran `tools/asviz-run.py` and clicked Graph: **41 arrivals, 93 transfers, lines 206–481, 301
steps**, and the plot matches those numbers exactly. It reads as a parser walking a document — the
descending staircase *is* the run advancing down the file, and the tall amber verticals are control
going back up to the loop. The window's own seven lines are a sliver at the top for the honest
reason that the window calls code 275 lines below it.

**A defect the picture found and the harness could not:** the arrival dot was a constant 9 units on a
2.1-unit row, so each arrival was a bead four rows deep. It is now sized to the row and clamped
(3…14). Third time this session that looking at the rendered thing caught something measuring did
not (the pan bug, the faint strokes, now this) — worth remembering as a method, not an anecdote.

**Two traps worth carrying:** a declaration must precede its **use**, not merely its section, which is
why the host declares `VizTrace` rather than the view (the harness failed with "I don't understand
'put'" the other way round); and the analyser rejects `!!` prose *between* labels in a section, so the
parts of a multi-label block use `!` comments and the prose belongs in its opening.

**And the deployed copy is stale:** `deploy/code/asedit.json` differs from the root one, so
`./deploy-sync` is needed before the site shows the Graph button. Opening `edit.html` from the working
tree shows it as it is — and that page cache-busts its own fetches (`?v=` + a timestamp), so no
hard-reload is needed.

**The view is visible** (2026-09-29). `various/plotview-check.js` now writes a page containing the
view's own SVG output — not a redrawing of it — so `various/plotview-trace-run.html` and
`various/plotview-parser.html` can simply be opened. That is the honest route to "seeing it" from a
session with no browser: the harness serialises what the AllSpeak actually created.

**And looking at it caught three things the harness could not**, which is the argument for the page
rather than a nicety: the arrival dots were *filled* hairline segments and would have rendered as
**nothing**; the axis labels had no `text-anchor` or font size, so the y labels would have run into
the plot; and the serialiser itself tested `innerHTML` for truthiness, so a label legitimately
reading `0` — the first step tick, every time — came out blank. Every one of those passed the frame
check and the element counts.

**And looking at it immediately caught something the harness could not.** The arrival dots were
*filled* hairline segments (`M x y h0.01` with `fill=#e5484d`), which render as **nothing at all** —
a dot has to be a stroked hairline with a round cap. Every coordinate was inside the frame, every
count was right, and the picture would have been blank. Worth remembering as the reason the page is
a step and not a nicety.

**The view is now editor-ready, and one of my own plan steps was wrong** (2026-09-29). I had "the
fetch" as the next piece; it does not belong in the view at all — the plugin contract puts
*acquisition* on the host side ("file read, fetch, editor buffer — stays on the host side, because
that is where the platform differences live"), so the view takes a trace and draws it. What it
actually needed was to be shaped for embedding, and it now is:

- **Every symbol is prefixed `Viz…`.** Names are the scarce resource in a flat table of declared
  symbols, so the section has to be able to sit beside asedit's own drawings, variables and elements
  without colliding.
- **The host owns the panel and the trace** — `VizHost` and `VizTrace` are declared and filled by
  whoever embeds it, so nothing is fetched or created behind the host's back.
- **`Draw:` builds its elements once and replaces the marks on every later call.** Verified by
  drawing twice: 13 elements either way, where a rebuild would give 26, with the marks landing
  correctly from each trace (9+10 for `trace-run`, 4+4 for `parser`) and every coordinate inside the
  frame. That is what makes a redraw a redraw rather than a second picture.
- **`return`, not `stop`** — inside the editor this is a section of the editor's own program, and
  stopping would end the editor.

**And a placement rule found by getting it wrong: a label is not a barrier.** The body below `Draw:`
runs by *falling through*, so a section placed before the host's main flow draws before the host has
created the panel — which is exactly what happened, and showed up as
`Cannot read properties of undefined (reading 'appendChild')`. The section must sit after the host's
`stop`, and that is now said in the sketch rather than left to be rediscovered when it is pasted into
`asedit`.

**And the first cut of the view now draws, and is fitted** (2026-09-29). The geometry is no longer a
guessed scale: it is fitted to the trace's own ranges (min/max line, total steps), so a run stays
inside the frame whatever its size. Verified on three real traces — `trace-run` (9 arrivals, 10
transfers), `parser` (4 and 4), `trace-fixture` (2 and 0) — with every coordinate inside the 1000×700
viewBox, and on a synthetic **600-line span** that would have collapsed onto a single line before the
fix below. Still two path elements in every case.

**The fit needed a fix that is worth remembering, and it is a language behaviour rather than a
mistake in the code:** AllSpeak's arithmetic is integer-first and **division truncates**
(`divide 10 by 3` is 3), so a scale factor like 580/626 is **0** — the picture would silently flatten.
The fix is the documented scaled-integer pattern, multiplying *before* dividing, so the intermediate
stays large and the result is exact to a unit. It is in `learn/reference/07-arithmetic.md`, which is
where I should have looked first. Worth knowing because a *fractional* layout looks like the obvious
way to write a fit, and the failure is a wrong picture rather than an error.

**The axis is in, and the element count is now constant** (2026-09-29). Ticks are a **fixed pool of
four labels a side** — a label is an element, so it cannot be made per tick any more than a mark can
be made per arrival — spaced by a third of the span and placed with the same fit the marks use, so a
label sits exactly on the line it names. Verified on two traces: `trace-run` labels lines 25/31/37/43
at y 60/234/408/582 and steps 0/8/16/24 at x 60/341/623/904; `parser` labels lines 379/387/395/403
and steps 0/6/12/18. **The whole picture is 13 elements** — host, canvas, frame, eight labels and two
mark layers — whatever the number of marks, because only the `d` strings grow.

Two consequences worth keeping. **The pool size is the axis's resolution**, so a 4-tick axis is what
the design has until someone wants more. And **in the editor the y labels may be redundant**: if the
plot's rows are kept in register with the editor's text, the editor's own line numbers label the same
lines, and the pool drops to one side.

**And the static-element model bites in a second way:** the axis's tick positions collided with the
marks' existing `Y2`, which surfaced as *"Duplicate variable name 'Y2'"*. Not a trap in the notes —
just what happens when every element and every value is a name in one flat table.

**Documentation fixed 2026-09-29** (Graham: "certainly worth adding"). Three defects, each found by
using the thing and none of them knowable from the page: the **Python list example** in
`learn/reference/04-collections.md` showed the JS spelling (`set element 0 of Items to`, which does
not compile in Python) and the table said the two accessors agree — neither does, so the row and the
example now show `append` + `item`; the page gained the **stack/queue shape** it never mentioned; and
`learn/reference/18-json.md` now gives the iteration loop **each runtime actually needs** (Python
`the count of` + `item`, JS `has element` + `element`) instead of claiming a parsed value "can be
counted". Both loops were run before being written down. The fr/de/it copies of `04-collections.md`
still need the same three changes — they are hand-kept, not generated.

**Graham's note on that, and what checking it turned up (2026-09-29):** the collision applies to
*scratch* variables rather than elements, and he added a **stack** type so a name can be pushed on
entry and popped on exit and re-used in between. Verified in Python — `stack S` + `push 10 onto S` +
`pop V from S` gives `popped: 20` ✓. **But it is Python-only, and in JS the same two words mean
something else entirely**: `stack S` is not a keyword there, while `push {value}` and
`pop [into] {variable}` are the *argument* and *call* stacks. So the idiom is unavailable to anything
that has to run in the browser — including this view, which names its scratch values by role instead.
Recorded as `language-pack-issues.md` #16, with the note that the type is undocumented in
`04-collections.md`'s "four shapes".

**And the project's own trap about undeclared variables caught me live**: five declarations dropped
in a rewrite surfaced as "I don't understand 'put'" at the first statement using one, not as "not
declared" — exactly as the root `AGENTS.md` warns. With `path` added, `various/plotview.allspeak`
reads a trace, walks it in AllSpeak, and emits two `d` attributes — and the stub-DOM harness
(`various/plotview-check.js`, which is the development loop for this piece since there is no browser
here) confirms it against the trace of `tools/trace-run.allspeak`: **9 arrivals and 10 transfers
drawn as two elements in total**, with the geometry checked by hand (`M72 360` is steps 1 × 12 + 60,
line 25 × 12 + 60 — the first arrival). What it does not yet have: a real fit to the trace's ranges
rather than a fixed 12 units per step/line, the axis, and the fetch. Both files live in `various/`
(gitignored); the plugin change is real and additive.

**Which also settles per-mark colour:** one path carries one colour, so the accumulated heat ramp
(scheme B) becomes one path *per colour band* — quantised, which is what a heat map reads fine at.

**Which makes the drawing-plugin question one of *concision*, not capability** — which is where
Graham's opening instinct ("maybe a new plugin for drawing tasks") lands, now with evidence rather
than a guess. One `draw line from … to … in Canvas` would replace four statements per mark, and a
picture is hundreds of marks; against that, a plugin is a new artefact to maintain and one more
vocabulary to learn. Worth deciding *when the first view is drawn*, from how the script reads —
which is the same "build it cheaply and judge it from the picture" rule the sketches followed.

**A finding that removes a worry: the picture needs no new drawing plugin.** AllSpeak has no canvas
2D context (there is none anywhere in the JS runtime), but the existing `svg` plugin creates `line`,
`rect`, `circle` and `svgtext` — which is the whole vocabulary the picture uses for tracks, arrival
dots, transfer strokes and the script text. And because AllSpeak generates the elements it can cull
to what is *visible*, so a long run does not create a node per visit despite `limit` defaulting to
100,000.

**And the third view may be smaller than the sketch.** `asedit` already renders the script — it is a
CodeMirror editor — so the view may need only the **plot** panel, scrolled in sympathy with the
editor's own text, which is the two-panes-held-in-register idea Graham described in his first
message. That is a simplification of `various/make-viz-plot.py`, which draws both bands in one canvas
because it had no editor to sit inside.

**The shape it takes, given what already exists** (`server.allspeak` already serves `/list`,
`/read`, `/write`, `/version`, `/restart` in AllSpeak, and asedit already talks to them with
`rest get`/`rest post`):

1. **`viz record`** — a plugin command that runs a script (from a path *or from the buffer text*)
   with a recorder attached and hands back what the picture needs. The counterpart of the existing
   `viz model`, and the piece every host below needs. *(Not built yet — see the two findings below,
   which the groundwork turned up and which it depends on.)*

**Groundwork done 2026-09-29, before writing `viz record`:**

- **A plugin can run a nested program, and the host survives it.** Verified directly: a plugin
  command that constructs and starts another `Program` runs it (`[inner] X = 42`), the host
  continues correctly, and a nested run that *fails* — compile error or runtime error — is caught
  and leaves the host unharmed. So in-process recording is viable.
- **The pattern to copy already exists.** `compileOnly` documents the two hazards in its own
  docstring and handles both: `Program.__init__` resets the module-global `queue` that belongs to
  the running host, and a failing compile calls `sys.exit()`, which would take the host down with
  it. `viz record`'s runner must save/restore the queue and catch `SystemExit` exactly the same way.
- ~~**A defect, and it is the editor's core case: `viz model ... as <source>` did not analyse the
  supplied text.**~~ **Fixed 2026-09-29.** `compileOnly(path, lines)` never used `lines` — it
  compiled the file at `path`. Demonstrated before the fix: supplying a one-line `stop` for a file
  that has a label gave `model | lines=1 ... labels=1` with `anchor | ... | line=3 | name=Inner` —
  the *text's* dimensions and the *file's* anchors in one report, a plausible wrong answer rather
  than an error, which is the worse kind. **The JS plugin never had this**: it tokenises the text it
  is given and compiles that, so this was a Python-only divergence between the two analysers.
- **The buffer question, decided 2026-09-29: the runtime compiles lines, not just a path.**
  `Program(arg, testMode, source=None, name=None)` now takes source with no file behind it — the
  editor's unsaved buffer is the case it exists for, and text should not have to be written to disk
  to be compiled, looked at or recorded. The command-line branches (`-v`, `debug `, argv splitting)
  sit in the else, where they belong. Verified end to end on a buffer that has never been saved: it
  compiles, **runs** (`counted to 3`) and analyses (`lines=10 | labels=1 | anchors=3`, with the
  label and both markers at their buffer lines).
2. **A `/viz` route** in `server.allspeak` — a handful of AllSpeak lines, mirroring `/read`.
3. **A third view in `asedit.allspeak`** — **drawing from a trace file first**, since that is the
   smaller step and the one the remote case needs. Then `viz record` and the `/viz` route add the
   "record here" button to the same view. The drawing uses the `svg` plugin, culled to what is
   visible; the code that proves the layout exists in `various/make-viz-plot.py`.

**Run safety — decided and built (2026-09-29).** Recording *runs* the script, so a runaway would
hang the editor. The guard is a **time budget on the program's own work** rather than a count of
commands, because a loop that waits or calls out between iterations reaches any command count
eventually. Graham's refinement: *ignore programmed delays, and actions that are known to time out
themselves such as REST calls*. Measured, and it works — a busy loop stops after **2000.0 ms of own
work**, while a loop of `wait 200 ms` accumulates only 25.6 ms and is left alone.

**But the budget alone cannot be the only bound, and the test proved it:** a loop that *waits*
between iterations never spends its budget, so the first version ran until the test harness killed
it. So there are two, with distinct jobs — `budget` (own work, 2 s: "this script is computing too
much") and `ceiling` (wall clock, 20 s: "this script has been running too long to be a review of
anything"). Graham's reading of the second: *a wait loop that never returns is likely to be a
coding error* — so the ceiling is not a compromise set high enough to spare honest scripts, it is
the guard for a mistake. That is why the two reasons are told apart and *reported*, not just
recorded: `stopped | reason=wall | elapsed-ms=20000 | own-work-ms=26 | the run was stopped: a loop
that never returns is usually a mistake`, against `reason=work` for slow code. An overrun that
shows only as a short trace is a puzzle; said out loud it is a diagnosis.

**One defect found by testing the guard, worth remembering.** Halting a run by setting
`program.running = False` from inside the recorder does *not* stop it cleanly: the command already
being dispatched runs anyway, finds the program stopped, and reports *"Improper use of runtime
function"* — a lie about what happened. The recorder's `tick` now returns `False` to mean "end the
run", and `as_program.py`'s loop breaks on it, so no command runs with the program already stopped.
That is a one-line hook in the runtime's loop, alongside the recorder call it already had.

The JS recorder has neither bound yet — a deliberate divergence to close when the JS route is
attempted.

### The agent-assisted flow (Graham, 2026-09-29)

The idea, in his words: since an agent is writing the code it can also place the markers. *"Show
me what happens when I click the Add button"* — the agent works out where `viz start` and `viz
stop` belong, runs the script, captures the recording and shows the picture.

**Settled: the markers are reverted after capturing.** The author's file goes back exactly as it
was; the markers were scaffolding for one question. `viz start on <label>` is the preferred form
where a label exists, because it puts the edit a line or two *outside* the block being studied
rather than an opening brace inside it.

**Three obstacles, and only one of them is the prompt.** They are worth knowing before the flow is
built, because each lands on different work:

1. **Placing markers mutates the author's file.** Runtime-safe — `viz` is a no-op without a
   recorder — but the doc-block `@hash`es go stale, so a revert is the only clean end state.
2. **Running is the hard half for a browser app**, and "when I click Add" makes the *event* the
   subject, so the run has to be a real click in a real DOM. Both jsdom and Playwright are already
   devDependencies.
3. **Displaying** is currently `./various/plot`, a Python generator writing an HTML file, and now
   `./various/plot --js`. That covers a trace from either runtime, but "in the browser, in the
   editor" is the asedit screen, which is not built.

**The cheap kill:** the workflow half needs nothing new on the Python side — `./various/plot`
already finds a script, runs it, records it and draws it. So the prompt and the marker step can be
tested today, before any browser work, which is the cheapest way to find out whether the idea
survives contact.

**Cut for now,** because they add artefacts or steps without answering the first screen's
question: a separate report document, and `viz diff`. The JS recorder is no longer a prerequisite
for the visualiser either — a trace written by the Python runtime is a complete input, which is
what the portable format was for.

**Unverified here:** that a trace renders as expected in Perfetto or `chrome://tracing`. The
documents validate against the format as specified, but the rendering needs an eye on a browser —
`ui.perfetto.dev` accepts the file directly, so that is a one-minute check for whoever has one.

**The two halves of the visualiser are now in line** (2026-09-29). The JS plugin gained the
**recording report** — `AllSpeak_Viz.trace` for the host to hand the recorder to, and
`traceRecords()`, emitting `trace`, `seq`, `unvisited`, `cold-anchor`, `hot-anchor` and `hot-line`
records exactly as the Python plugin does. Measured: with no recording the two sides' record kinds
are **identical**; with one, the only difference is `hot-line` 7 against 8 — Python's extra line
being the label command it executes and JS does not, which is the documented `steps` difference
showing through. The mirror-image wart was fixed at the same time: the Python host's target output
now goes to stderr like the JS host's, so a `print` can no longer land in the middle of the model
records. The spec gained a fourth runtime difference, observed concretely here: a label and the
command after it are one pc in JS and two in Python (`Worker:` + `viz start`), so an anchor list
can differ in size as well as in lines.

**Working from a trace file is agreed for now** (Graham, 2026-09-28). Still open: whether the
editor *also* runs the script itself in-browser — the difference between JS-Recorder-first and
Editor-first. The **JS recorder landed 2026-09-29**, so the first half of that question is
answered: `js/allspeak/Run.js` ticks a `program.vizRecorder` once per command, `js/plugins/asviz.js`
carries the Recorder and the draft-2 writer, and `tools/asviz-run.js --run --trace=` writes one.
`./various/plot --js` draws it, and the two runtimes' traces agree event for event on
`tools/trace-run.allspeak`. What is still missing for the browser is an *attach point*: the node
CLI attaches the recorder, and nothing in a page does, so a browser run records only if the page
wires it.

### 8. Flags: `it` / `fr` / `de` are provisional

The three flags now in `deploy/icon/` are flat PNG tricolours copied out of `resources/flags/`,
a plain ISO-code set. The intended look is the **wavy banner** of `en-flag.svg`, which is
OpenClipart's "US/UK flag" by **klainen** — `openclipart.org/detail/168121/usuk-flag`, and the
attribution is inside the file itself. Graham is looking for where the wavy set came from; when
it turns up, replace the three PNGs and the three `flagImage` values in `deploy/config.json`.

Two things already established, so nobody re-derives them:

- **OpenClipart is public domain** by contributor dedication. Artwork from there carries no
  attribution obligation; the comment in `en-flag.svg` is a courtesy, not a requirement.
- The PNG set in `resources/flags/` records no provenance of its own. `en-flag.svg` documents
  its source *inside* the file, which is the habit worth copying.

**JSON display in the editor** (2026-09-29). `OpenFile` now calls a `FormatJson` step for any `.json`
name (including `.viz.json`), formatting **only a single-line file** — the case Graham named — and
leaving a laid-out file at its author's indent. It uses the runtime's own `json format`
(`JSON.stringify(val, null, 2)`), and catches malformed input so a file that will not parse still
opens. The call sits **before** the tab's saved text is recorded, so opening a file does not mark it
modified. Verified with five cases against the routine extracted from `asedit`. The guard exists
because `asedit.json` is four-space: always reformatting would have rewritten the editor's own layout.

**The revert was the poll, and the fix is symmetry** (2026-09-29). Graham saw the JSON format itself
and then revert to one line after a couple of seconds. Cause: `asedit` has **no Save button** — it
auto-saves every 500 ms and `PollFile` re-reads the current file every 3 s — and the formatter sat
only in the *loader*, so the tab held formatted text while the file on disk was still one line. The
poll compared them, found a difference every pass, and silently reloaded the minified text over the
tab; three seconds per round, which is why it read as a delay rather than a loop.

**The rule to carry: a transformation applied to data that is read on two paths must be applied on
both.** The routine now takes its text in `JsonText` and runs in the loader *and* the poll, so the
comparison is like with like and the tab settles. It also converges rather than oscillates — a
formatted file is multi-line, so the guard leaves it alone, and formatting twice equals formatting
once. The file on disk is *not* rewritten by looking at it; it becomes pretty once the user edits it,
because the auto-save writes what they see.


**The Graph pane now names the run it drew** (2026-09-29). A recording is a file beside the script, so
a *failed* recording leaves the previous one in place, and a stale picture is exactly as convincing as
a fresh one. The view draws a caption under the plot — `lines 152-493, 328 steps` — which is the only
thing that can tell the two apart. Both copies of the view carry it (they must stay in step by hand).

**Measured while chasing an unexplained freeze:** the wrapped script compiles in 48 ms (JS) and fails
cleanly on `viz end` in 13 ms; the Python analyser takes 0.27 s; the host runs and fails fast; the view
draws the on-disk recording in 1.0 s and a **whole-script** window in 0.98 s (46 marks, 24.7 KB — a
whole-script window is *not* big, so a scaling hang is ruled out). **The freeze itself is still
unexplained** — everything reachable headlessly is fast, so the browser console is the next evidence.

**Marker words, worth remembering:** `viz start` … `viz stop`. Not `viz end` — the compiler says
*"viz: expected `start` or `stop`"*, and `examples/chemical/parser.allspeak` already carries a pair at
lines 206/213 (that is the recording in `parser.allspeak.viz.json`).


**The graph is slow because `element N of <array>` re-parses the array — measured at ~8 ms per access
on a 2472-event trace** (2026-09-29), and the view makes about four such accesses per event across its
two passes, so the cost is quadratic in the trace: 493 marks 6.8 s, 740 14.6 s, 1481 54.5 s, 2468 over
two minutes. Isolated: `element` 8.7 ms/iteration, `property` 0.24 ms, an empty loop 0.18 ms.

**Shipped:** the view yields every hundred marks (`wait 1 millis`, measured free — 6.75 → 6.83 s) so
the browser is never blocked for the whole pass, the host prints `Drawing the recording - please wait`
before the wait and clears it after, and the view captions the run it drew so a stale recording is
visible. A `wait` inside the `gosub`'d draw resumes correctly, verified by the marks still coming out
right.

**Not yet done, and the real prize:** stop `element N` re-parsing — a runtime change, ~1000× on this
pane and on any script using lists. Graham's call, since it touches the core.


**The editor now predicts a slow recording and learns the rate** (2026-09-29). `VizPredict` (before the
draw) and `VizRemember` (after) sit in the Graph block: milliseconds per kilobyte, measured from the
draw that just happened, kept in `.viz-calibration.json` in the project root. Over five seconds and it
pops up a warning naming the estimate in seconds and suggesting narrower markers. Silent on a first
run, because there is no measurement yet. Verified verbatim: 58,900 ms / 402,000 bytes → 150 ms/Kb →
58 s. **Per-machine file, so it wants gitignoring.**

Graham's ruling, worth remembering: the wait is *acceptable* — other machines will be faster, the
example is extreme, and a visualiser should highlight parts of a run rather than trace whole ones. He
also made the good point that having to wait makes the next request more considered. So **the slow
case stays slow**: the message explains it and nothing refuses to draw. The `element N` re-parse stays.


**A tab change now leaves Graph mode** (2026-09-29). Opening a file while the graph was up loaded it
into `ContentEditor`, which the pane had hidden — so the file opened correctly and invisibly, and only
the **Edit** button revealed it. This was not a new rule but an old one not applied: `ActivateTab`
already began `if BlocksMode is 1 gosub to DoExitBlocks`, so it now does the same for `GraphMode`, and
`ActivateTab` is the one place every route to showing a file passes through. `DoExitGraph` already
restored the pane, so the fix is a call rather than new code.

Worth carrying as a *shape* of bug: **a mode that owns a global flag has to be left by every path that
wants the screen back**, and the tell is a pane that hides the thing you just asked for.


**Two simplifications from Graham's validation of `asedit`** (2026-09-29). The empty block 24 was the
view's own documentation header, closed by a `!!!` of its own — prose with no code, which Blocks
renders as a blank pane. The prose was right and the terminator wrong: it now opens the section
holding the view's code, in both copies, 25 sections → 24. And the nested `if` at line 1459 collapsed
to one range test with `and` — verified equivalent, since both sides are plain integer comparisons and
nothing on the right can fail when the left is false. **It is the only one of that shape in the file**,
so the pattern is not widespread. `and` itself was checked before use.


**The heat is built and verified, but not yet switchable** (2026-09-29). Four band paths with a
cool-to-hot ramp whose hottest band is the plain marks' own colour; `line_counts` from the window
("the number of times each command on a line executed") read per arrival; bands over the counts' range
across the marks' own lines, so the ramp fits the run. **`VizBands` is the toggle** — view-declared,
host-settable, and unset means 1, which is exactly the old picture. Verified both ways: the default
carries the same 9 marks with the bands empty, and at four bands the bands carry 2+3+0+4 = 9 — no mark
lost, none double-counted. 18 elements now (was 14).

**Next, both small:** a top-bar control that sets `VizBands` (1 and 4), and a legend — a heat picture
without one is a mystery, since the colours say nothing until a reader can see what each band covers.


**A corruption found in `examples/chemical/parser.allspeak` and repaired** (2026-09-29): two lines
joined — `!! Constants: …` welded onto `    script Parser` — plus rewritten hashes, which is the
signature of a doc-block write-back from Blocks mode. **And his `viz start`/`viz stop` markers are not
in the file**, so something wrote it back without them. Candidates: the Blocks write-back (rewrites the
buffer from parsed sections) and `PollFile` (reloads from disk when the tab is clean). **A write path
that silently drops an edit outranks the rest of the visualiser work.**


**The heat is switchable** (2026-09-29): a `Heat` button in the top bar that flips `VizBands` between 1
(plain marks) and 4 (the ramp), redrawing on the spot. **`VizBands` is a host input like `VizTrace`** —
declared by the host, read by the view, so a host that never sets it gets the old picture. Verified: the
toggle flips 1→4→1 (handler extracted and run), the bands carry 2+3+0+4 = 9 marks with none lost, and
the default path is byte-identical. 1670 commands, 0 errors.

**And the checker earned its keep:** it refused the first attempt with `I don't understand 'VizBands' at
line 1580` — the view declared it *after* the host code using it, because "declare before use" is
**positional in the file**, which I had reasoned my way around and got wrong. The tool written this
morning for a different bug caught this one.

**Left: the legend** — the colours mean nothing until a reader can see which counts each band covers.


**`Non-numeric value` on the first Graph, fixed** (2026-09-29). `add 1 to VizBreathe` ran before anything
put a number in it — declared but never initialised, unlike every other scratch value in the view. The
runtime's report is not fatal, so the picture appeared anyway and the *yield silently never ran* — which
matters, because the yield is what keeps the browser alive on a long pass. Fixed with `put 0 into
VizBreathe` at the top of the draw.

**And the harness had reported it all along:** `various/plotview-check.js` writes runtime errors to
stderr — with a comment saying that is the point — and I had been running it `2>/dev/null` for hours,
discarding the evidence the line exists to preserve. **Never redirect stderr on a check whose stderr is
its verdict.**

**Unexplained:** on Graham's recording (44 arrivals, 99 transfers) the harness draws nothing at all and
reports no error, while the same harness draws a small recording correctly. His browser shows the graph,
which points at the harness, but that is a guess. **First job next session.**


**The learned rate, seen working** (2026-09-29): the first Graph warned 51 s for a drawing that took
under 1 s. The calibration explains it — it now holds **7 ms/Kb** (predicting 166 ms for the 24 KB
recording) while 51 s implies **2140 ms/Kb**, so the sample was **~306x slower** than the machine is.
That sample was genuine: it was the tens-of-seconds drawing made while the yielding was dead from the
`VizBreathe` bug. **A broken yield made a run slow, and the slowness was learned as the machine's
speed** — then corrected by the next run, because `VizRemember` overwrites rather than averages. The
warning now says its number is a measurement of the last drawing rather than a promise.


**Marks and Heat are one view: the fold is agreed but NOT landed** (2026-09-29). Graham's call: with the
heat always on, Marks differs only in the colour of the markers, which does not justify a second view.
The fold: the heat becomes the only scheme, the view owns the band count (fixed at four), the button,
its handler, and the plain `VizArrivalDots` path all go.

**The attempt failed halfway and left nothing changed in the editor.** My patch wrote the scratch sketch
*before* asserting the result was sane, so a failed assertion left the sketch half-changed — its
`path VizArrivalDots` declaration and creation gone, five references still in place. `asedit.json` lost
its Heat button mid-attempt; **I put it back**, so it matches `asedit.allspeak` again (verified).
`asedit.allspeak` itself was untouched and compiles at 1671 commands, 0 errors.

**The lesson, and it is operative: "fail closed" means build the whole result in memory, assert, then
write once.** Earlier patches here did that; this one wrote per-file and did not.

**First job next session, before the legend:** regenerate `various/plotview.allspeak` **from
`asedit.allspeak`**, which holds the view verbatim — then make the fold properly. Until then the
harness cannot run, so no headless verification is available, and the "draws nothing on his recording"
puzzle stays open.


**The tiny dots in Heat, fixed** (2026-09-29): the four band paths never got `stroke-linecap: round`,
so `M x y h0.01` drew a 0.01-long rectangle instead of a dot — while the plain path had the line **and
a comment explaining why**. The rule was documented one screen above the code that broke it. Fixed in
all four; verified in the generated HTML (5 round caps; band 0 = colour + cap + width 14).

**And the sketch is repaired by regeneration:** `various/plotview.allspeak` now comes **from
`asedit.allspeak`**, which holds the view verbatim — one source and a one-line regeneration, rather than
two copies kept in step by hand. The harness works again, so headless verification is back.

**Next: the fold.** Heat becomes the only scheme, the view owns the band count (four), and the button,
its handler and the plain `VizArrivalDots` path all go. **Build the whole result in memory, assert, then
write once** — the discipline whose absence broke the sketch last turn.


**The fold landed: two buttons, one colour scheme** (2026-09-29). Graham's point was exact — three
buttons for two panes, and the third was mine. The heat is the only scheme now: the `Heat`/`Marks`
button, its handler and its layout entry are gone, and **the view owns the band count** (fixed at four),
so nothing carries across a re-open. His question about disabling the current view's button is answered
by the editor's own convention, which is better: **the current pane's button offers the way back**,
reading `Edit` — what Blocks has always done, and now what Graph does. Verified: 1659 commands, 0
errors, layout valid, and the heat drawing 2+3+0+4 = 9 marks on the small recording with no stderr. The
plain marks path is left **inert** and should be removed next time that code is open.

**Open puzzle, two explanations dead:** Graham's recording draws nothing **in the harness** while his
browser draws it and the harness draws a small one. Not backticks or `${` (0 of each — so not the
harness's template literal) and not the 24 KB single source line (pretty-printing changes nothing).
**The browser is ground truth and it works**, so it is a harness limitation — cause still unknown, and
I stopped guessing rather than dressing one up.


**Small dots from the second Graph onward, fixed** (2026-09-29). An asymmetry: `stroke-width` was set in
**both** the built-once block and the per-draw block, while `stroke-linecap` was set in the built-once
block **only** — so a redraw restored the width and lost the cap, and a mark without a round cap is a
0.01-long rectangle. Fixed by setting the cap beside the width in the per-draw block; the build-time
copies stay, as the width's do.

**The class, named — it has bitten twice:** **an attribute that must survive a redraw belongs in the
per-draw block.** The plain marks path had its cap right; when I added the band paths I copied the
colours faithfully and missed the cap. That is an argument for deleting the inert plain path rather than
leaving it: it is the template the mistake came from.

Verified: compiles, 0 errors, the cap at line 463 beside the width at 462, sketch in step. **Not
verifiable headlessly** — the harness's stub DOM does not reproduce whatever the browser does between
draws, the same limitation as the recording that draws nothing there and fine in his browser. His click
is the test.


**SOLVED: the tiny dots were a STALE COPY, not a code bug** (2026-09-29). `edit.html` fetches
`asedit.allspeak` **relative to the page**, and Graham was running the **deployed** copy —
`deploy/code/asedit.allspeak`, **77,488 bytes vs the root's 82,668**, with **no heat paths at all** and
its single `VizArrivalDots` path taking its `stroke-linecap` **only at build** while restating
`stroke-width` per draw. That is precisely "right the first time, small from the second onwards". The
fix had been in the root copy for two rounds and **never reached the copy he runs**.

**Fix: `./deploy-sync`.** Found by a read-only `explore` subagent after I had spent two rounds editing
the wrong file — a good argument for delegating a hunt when the obvious suspect is exhausted.

**Landing lesson:** there are **two copies of the editor** and the page runs whichever is beside it, so a
root change is invisible until synced. **Next session: make the deployed editor load the way the plugins
do — one copy, not two to keep in step.**

**Also landed:** `PollFile` now skips Graph mode as it already skipped Blocks (the poll was replacing the
editor's content every three seconds behind an open pane). **Still to do:** delete the inert plain
`VizArrivalDots` path from the root copy — it is the template this whole class of mistake came from.
