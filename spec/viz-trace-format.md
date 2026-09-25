# AllSpeak Viz Trace Format (Draft 1)

Status: Draft
Version: 1
Applies to:
- AllSpeak JS browser runtime (`allspeak.ai`)
- AllSpeak Python CLI runtime (`allspeak-py`)

## Purpose

A recording is more useful as a **file** than as an object held by the process that made it.
Writing one out lets the editor show a trace without running anything, lets a trace recorded by
one runtime be read by the other, and gives the two runtimes a neutral container in which their
behaviour can be compared.

The container is the **Chrome Trace Event Format**, which is the de-facto interchange for
execution traces: Perfetto opens it, as does `chrome://tracing`, and it is what the HPC tools
export to. Writing that rather than a private shape means a viewer works on day one, and it
keeps this document small: it specifies the subset used and the contract for the `args` fields,
not the file format itself.

## Document shape

A JSON object with a `traceEvents` array. The bare-array form of the format is also valid, but
writers emit the object so `displayTimeUnit` and provenance can travel with the trace.

    {
      "traceEvents": [ ... ],
      "displayTimeUnit": "ms",
      "otherData": { "vizTrace": 1, "script": "<path as given to the host>" }
    }

Timestamps (`ts`) and durations (`dur`) are **integer microseconds**, as the format requires.
The recorder measures nanoseconds, so writers divide by 1000 and truncate.

`ts` is a reading of a monotonic clock — the Python recorder uses `perf_counter_ns`, which on
Linux counts from boot — so its absolute value means nothing and only differences do. Two runs
of the same script will not agree on those differences either: they are elapsed time, and include
waiting, reading files and printing. Anything compared across runs must use `steps` (below).

## Formatting

Whitespace is not significant, so writers may indent the document for someone to read and
viewers will not notice. The reference writer is **compact by default** and indents only on
request (`--trace-pretty`), on the grounds that a trace's first consumer is a viewer rather than
a person, and a recording can be large. Nothing is lost to a reader who wants one indented, since
a compact document can be pretty-printed without recording again (`python3 -m json.tool`), and
`tools/check-trace.py` prints a summary of any trace without either.

## Lanes

- `pid` is 1. The trace is one script.
- `tid` is the **window index**, 1-based, in the order the windows were recorded.
- One `process_name` metadata event carries the script path.
- Each window emits `thread_name` (e.g. `window 1 (line 379)`) and `thread_sort_index`, so a
  viewer keeps the lanes in window order.

## Events

Two event kinds are written. Both are `X` (complete) events, carrying `ts` and `dur` together.

### `cat: "window"`

One per lane, spanning the window from the marker that opened it to the moment it closed.

    { "name": "window 1", "cat": "window", "ph": "X", "pid": 1, "tid": 1,
      "ts": 1234567, "dur": 253000,
      "args": { "from_line": 379, "mode": "once", "limit": 100000, "until": null,
                "visits": 4, "anchors": 3, "steps": 20, "truncated": false,
                "line_counts": { "379": 1, "387": 2, "403": 1 } } }

`line_counts` is the number of times each **command** on a line executed, keyed by line number
as a string, omitting lines that never ran. It is the per-line channel: with it the file is
self-sufficient for line-level display, so a viewer need not re-run anything to shade the source.

### `cat: "anchor"`

One per anchor arrival, spanning from that arrival to the next. Each interval is therefore time
spent inside the block the arrival named, and the intervals **tile the window without
overlapping** — they sum to the window's span. Tools may rely on that; it is what makes the
height of a row mean something.

    { "name": "loop@387", "cat": "anchor", "ph": "X", "pid": 1, "tid": 1,
      "ts": 1234567, "dur": 41000,
      "args": { "line": 387, "pc": 275, "name": "loop@387", "steps": 8, "visit": 1 } }

Required `args`, emitted by both runtimes:

- `line` — the 1-based source line. **This is the join key**, and it is the reason the format is
  shaped this way: the editor's dual-pane view navigates *from the picture to the script*, so
  every event must name a line that the script can be scrolled to and highlighted.
- `pc` — the runtime's program counter for the anchor. Runtime-specific: the two runtimes number
  commands differently, so this is never compared across runtimes.
- `name` — the anchor's display name (a label name, `loop@<line>`, `event@<line>`, or
  `viz-<request>@<line>`). May be empty for an unnamed anchor.
- `steps` — the cumulative count of executed commands at this arrival. **This is the comparable
  axis**: it is deterministic, so two runs of one script, or one script on two runtimes, can be
  laid against each other even where their timings differ.
- `visit` — 1-based index of the arrival within its window.

When a window has `truncated: true`, visit collection stopped at the cap while counting went on:
the final interval therefore covers everything after the last collected arrival, and a viewer
should say so rather than presenting it as one block's residence.

## What the format deliberately does not carry

- **Prose.** Doc-block text comes from the canonical analyser (`tools/asdoc-check.py --json`),
  not from the trace. A viewer joins the two on the script path and the line numbers.
- **Static structure.** Sections, routes and declaration sites are the analyser's model. The
  trace is execution only.
- **Values.** Nothing here records what was in a variable. That is the debugger's job, and the
  only honest bridge between the two is that they can agree on anchors.

## Conformance

`tools/check-trace.py <trace.json> [script.as]` validates a document against this spec: the
document shape, required per-event fields, integer microsecond timestamps, non-overlapping
intervals per lane, one window span per lane, intervals summing to their window's span, and —
if a script is named — that every `line` exists in it. Any writer for either runtime must
produce a document that passes it.
