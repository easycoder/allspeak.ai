# AllSpeak Viz Trace Format (Draft 2)

Status: Draft
Version: 2
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
      "otherData": { "vizTrace": 2, "script": "<path as given to the host>" }
    }

Timestamps (`ts`) and durations (`dur`) are **integer microseconds**, as the format requires.
The recorder measures nanoseconds, so writers divide by 1000 and truncate.

**A document may be added to as a recording goes on.** `viz start`/`viz stop` delimit a segment, and each
stop writes its segment into the trace file — so one file holds a run's segments, and then the segments of
the next run, in the order they happened, as a single recording. The window index (`tid`, below) continues
across the segments rather than restarting, which is what keeps them in that order for a reader; a writer
that adds a segment reads the document first and numbers its windows from the count already there.

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

Three event kinds are written. Two are `X` (complete) events, carrying `ts` and `dur`
together; the third is an instant, carrying `ts` alone.

### `cat: "window"`

One per lane, spanning the window from the marker that opened it to the moment it closed.

    { "name": "window 1", "cat": "window", "ph": "X", "pid": 1, "tid": 1,
      "ts": 1234567, "dur": 253000,
      "args": { "from_line": 379, "mode": "once", "limit": 100000, "until": null,
                "visits": 4, "anchors": 3, "steps": 20, "truncated": false,
                "line_counts": { "379": 1, "387": 2, "403": 1 } } }

`stopped` is absent when the run ended on its own, `"work"` when a host's budget on the program's
*own* work ended it, and `"wall"` when a host's ceiling on elapsed time did. A viewer should say
so rather than presenting a cut-off recording as a complete one: it is the difference between "this
is all the program did" and "this is as much as it was allowed to do". A host that sets neither
writes nothing here, and the field is optional.

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
  axis**: it is deterministic, so two runs of one script can be laid against each other even where
  their timings differ. Across runtimes it is close but not equal — see "Where the two runtimes
  differ" — so traces from the two are joined on `line`, and `steps` compares within one runtime.
- `visit` — 1-based index of the arrival within its window.

**Optional `args`**, for a writer that has something of its own to add:

- `values` — what the script asked to have watched at this arrival: the text of each named value, keyed by the
  name as written. A script says so with an attribute — `@show Total, Row` on the statement the values belong
  to — and the recorder reads it and resolves it against the program it is watching. **The values are read as
  the statement is *reached*, before it runs**, so an attribute beside the statement that changes a variable
  records the value going in; the language reference's own example puts `@show Total` on the line *after* the
  change, which is that fact written down. Absent when the script asked for nothing, so a recording of a script
  with no `@show` is byte-for-byte what it always was. A name the program does not hold is recorded as `?`
  rather than dropped, because an attribute naming something the runtime cannot see is worth seeing.
  **Text rather than a typed value**, deliberately: it is what the script asked to *see*, so it is rendered the
  way that runtime renders a value in its own output, and the two runtimes differ only where their own printing
  already does.

When a window has `truncated: true`, visit collection stopped at the cap while counting went on:
the final interval therefore covers everything after the last collected arrival, and a viewer
should say so rather than presenting it as one block's residence.

### `cat: "transfer"`

One per control transfer — an arrival that is not the command after the last one. This is
where the program's flow becomes visible: a call, a return, a jump, a loop's back-edge, and an
`if`'s skip all appear here and nowhere else. Instants (`ph: "i"`, `s: "t"`), because a transfer
is a moment rather than a span, and an interval would claim a duration it never had.

    { "name": "call 28->42", "cat": "transfer", "ph": "i", "s": "t", "pid": 1, "tid": 1,
      "ts": 1234567,
      "args": { "from_line": 28, "to_line": 42, "kind": "call", "steps": 3 } }

- `from_line`, `to_line` — the 1-based lines control left and arrived at. Both are join keys
  like an anchor's `line`, and both are attributed to the *author's* line: a written `gosub`
  or `go` names its own, while a compiler jump carries the line of the statement it belongs to
  rather than where the jump happens, so it names the line the previous command ran on.
- `kind` — one of `call` (`gosub`), `jump` (a written `go`/`goto`), `return`, `branch` (a jump
  the compiler generated — a loop's back-edge or exit, an `if`'s or `wait`'s skip, a `try`'s
  recovery skip). A writer must not file a compiler jump under `jump`: **a written jump names
  a label, a generated one carries a numeric target**, and that is the test, because the two
  runtimes spell the scaffolding differently — Python's conditions compile to `gotoPC`, while
  JS's compile to `goto`, the same keyword its `Go` uses. Filed together, the `else` of every
  `if` would read as a `go` the author wrote.
- `steps` — the cumulative command count at the transfer, on the same axis as an anchor's
  `steps`, so a transfer can be placed against the visits around it.

Transfers carry no `dur` and take no part in tiling: the anchor intervals still cover the
window between them and still sum to its span. A window with no transfers is a conforming
document — the kind is optional and records only what the run did.

**How a writer finds them, and the bound that comes with it.** A transfer is inferred from the pc
sequence — an arrival that is not the command after the last one — because that one rule catches a
call, a return, a jump, a loop's back-edge and an `if`'s skip without knowing how any of them work.
The bound is that a run which *suspends and resumes* through the runtime's queue can present the
same shape: the resume pc is not the command after the last one either, and if the last command to
run was a jump, the arrival is reported as a transfer of that jump's kind. The record is still true
as a statement of where control arrived from; only its `kind` — and therefore its `to_line` as a
call or return target — may be misleading. A viewer that treats a transfer as "the flow went from
here to there" is unaffected; one that counts calls is.

## Where the two runtimes differ

Both runtimes now write this format, and comparing their traces is what it is for. Three
differences are expected and none of them is a conformance failure:

- **`pc` is runtime-specific.** The two number commands differently, so it is never compared.
- **The two compile different numbers of commands for the same source.** The JS runtime emits no
  command for a label — a label is a symbol pointing at the command after it — while Python emits
  one. So the same run reports a different `steps` total (on a three-iteration loop into a
  subroutine, `25` against `22`) and Python's `line_counts` carries an entry for the label's own
  line that a JS trace cannot have. Every arrival, transfer and other line count still agrees.
- **A label and the command after it are one pc in the JS runtime and two in Python**, so an
  anchor list can differ in *size* as well as in lines: where a label is immediately followed by a
  marker — `Worker:` then `viz start` — Python reports two arrivals and JS one, named for the label.
  A viewer should treat an arrival as "this pc was reached" rather than as a count of landmarks.
- **A command the compiler emitted with no source line of its own** is attributed to the line of
  the last command that had one. Python's compiler jumps carry the line of the statement they
  belong to, so they need no such rule; JS's carry none, which would otherwise name line 0 — not
  a line anything can scroll to. A compiler jump that goes *backwards* is attributed to the loop
  test it returns to, which is where Python puts it too, so a loop's cost lands on the loop.

## What the format deliberately does not carry

- **Prose.** Doc-block text comes from the canonical analyser (`tools/asdoc-check.py --json`),
  not from the trace. A viewer joins the two on the script path and the line numbers.
- **Static structure.** Sections, routes and declaration sites are the analyser's model. The
  trace is execution only.
- **Values.** Nothing here records what was in a variable. That is the debugger's job, and the
  only honest bridge between the two is that they can agree on anchors.

## Conformance

`tools/check-trace.py <trace.json> [script.allspeak]` validates a document against this spec: the
document shape, required per-event fields, integer microsecond timestamps, non-overlapping
intervals per lane, one window span per lane, intervals summing to their window's span, the
`cat: "transfer"` instants being instants with both lines named, and — if a script is named —
that every `line`, `from_line` and `to_line` exists in it. Any writer for either runtime must
produce a document that passes it.
