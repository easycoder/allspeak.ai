# The Graph pane: clip a recording to a range of steps — where this stands, 2026-10-05

A work order for a session picking this up cold. Read `AI/README.md` and `AI/ALLSPEAK_CODING_GUIDELINES.md`
first, as `AGENTS.md` requires, then `TODO-viz.md`'s 2026-10-05 sections: the performance work, and "The clip:
built, checked, and withdrawn".

## What is wanted, and why

A recording of a big run is slow to draw, and the pane is only useful as an overview: past a certain size the
reader wants one region of it, and everything outside that region is what costs the time. Graham's requirement,
2026-10-05: **the script must not be edited** to narrow a recording, so the clip works on a recording as it was
made. **Nothing is in the tree** — an attempt was built and reverted the same evening because its check failed,
and the failure turned out to be the check. See below.

## The design, as settled with Graham

- **The window is the selector.** `VizViewX0` and `VizViewXW` are in the recording's own *steps* — the unit an
  IN/OUT bar would mark — so the reader chooses a range with gestures already in use: shift-wheel zooms the
  lines, control-wheel the steps, a drag pans.
- **Two entries**: `VizClip` sets the range from the window and asks for a draw; `VizUnclip` clears it. **Prove
  these before building any control on top of them.**
- **The notice.** After a clip, `visit 23 of 44` counts the arrivals *in the range* and the heat's reddest mark is
  the range's busiest line. Stated, that is a reading; unstated, a lie — so the status line leads with something
  like `clipped to steps 400-900: 238 of 2488 records`.
- **The range joins the re-fit key.** The window is remembered per tab and keyed on the recording's *text*,
  deliberately. A clip does not change that text, so the range must join the key or the fit stays fitted to the
  cut-away part. Both places that decide a new picture: `VizBuildFrame`'s guard (`VizPictureNew`) and `Draw`'s
  own comparison (`VizNewRun`).
- **Nothing is stored anywhere.** The recording is re-read from `VizTrace` on every draw, so clearing the range
  restores the whole of it and `VizUnclip` is two assignments. A clip does not survive leaving the pane, which is
  the same deal the window itself makes.

## The mechanism, proved before the rebuild

A filter over the records works, and was probed in isolation on 2026-10-05 **in the pane's own runtime**:

    json set <kept> to array                                ! make the list
    json add <event> to <kept>                              ! append each kept record
    the json count of <kept>                                ! how many were kept
    element 0 of <kept>                                     ! read one back
    property `args` of <ev>, property `steps` of <args>      ! the step a record carries

Three records were filtered to two, and `steps` — `5` — was read out of the first kept one. **So the language is
not the problem, and the `join` keyword is not needed for this.** Records are read and written exactly as the
pane already reads `.traceEvents`.

## The check, and how NOT to pose it — this is what cost the evening

The reverted attempt passed `asedit-check` (1368 commands, 284 symbols) and then failed its check with:

    FAIL: a clip drew as many marks as the whole recording (242 then 242)

**That was the check's fault, not the code's.** The harness's phases end *at the fit* — several are "in and out
again (back to the fit)" — so the window at the end is the whole run, and a clip to the whole run is a no-op **by
design**. 242 then 242 is the right answer to a badly posed question. So:

- **a clip check must narrow the window first** — zoom in, then clip — or clip to an explicit step range rather
  than to whatever the window happens to be;
- **the harness's phases are order-sensitive.** Two new phases placed before the mark-press phase broke *its*
  checks (`a press on a mark named line 0`), because a clip and its unclip re-fit the window and those checks
  assume the window the earlier gestures left. The harness says as much of its own last phase: "It is last, so the
  line it leaves behind is the one the checks below read." A phase that moves the window goes after every check
  that reads it, or those checks get their own fixture.

`PLOTVIEW=<old copy>` runs the previous version of the pane against the same trace, and the verdicts can be
diffed between the two — how a change is shown not to have altered the unclipped picture.

## The controls, which cannot go in the pane's picture

**A pane element cannot take a click.** `svg` is the one element type the plugin registers *without* the `dom`
extra — `AGENTS.md`'s trap list — so `on click VizClipBtn` fails to compile with `I don't understand 'on'`. The
editor's buttons work because they are `div`/`button`. Two ways out, and the second fits the pane:

1. a **dom surface**: two buttons in the editor's toolbar or on the page, sending the pane a message;
2. the pane's **own idiom, an arithmetic hit test on the pointer** — how every one of its gestures works, "there
   is nothing for the DOM to hit and the answer has to be arithmetic". The pane already converts a pointer into
   drawing units for its scrollbars.

## Graham's two caveats, which the design keeps open

- **Zooming to choose a range is only pleasant in Preview mode**, because zooming a full-size recording is slow.
  Once a clip is applied the picture is small; only the *first* clip on a big recording must be chosen through a
  slow window. Preview is unbuilt — see `TODO-viz.md`.
- **The X zoom's granularity is coarse** and needs panning to land on a particular range, so he reserves the
  right to ask for a **clip bar** with IN and OUT markers afterwards. The design keeps that open: a bar is a
  second way to set the same range, and neither entry changes to accommodate it.

## Verify, and what done looks like

1. **The entries, by name**, in the harness: clip to a *narrow* window, assert fewer marks and the notice on the
   status line; unclip, assert the marks come back.
2. **The unclipped picture unchanged**, by the `PLOTVIEW=` diff — a clip that is off must alter nothing.
3. **`asedit-check` and `asdoc-check`**, and the harness green on `tools/trace-run.allspeak`'s trace with only
   the two known window expectations failing.
4. **Then the controls**, as a separate slice, with the entries already proved.

## Deploy, no release

The pane is payload, and the `json` commands it needs already ship. `./build-allspeak` rebuilds
`deploy/dist/asedit.js` and the pane's own copy; the four `deploy/dist/asedit.*` files are restored afterwards
if the build overwrites them. Nothing in the runtimes changes for the clip.
