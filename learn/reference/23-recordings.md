# Recordings

A **recording** is what a run did: which parts of the program were reached, in what order, and how often — with the times they were reached. It is written as a JSON file beside the script, and it can be read afterwards — in the visualiser, or by any other tool — without running anything again.

That is the whole point of it. A stack trace tells you a program failed; a log is something you chose to write; a profiler is an aggregate over many runs. A recording is one run, kept.

Two words open and close one:

```as
    viz start [on <label>] [once|every] [until thread] [limit <n>]
    viz stop  [on <label>]
```

## The two markers

| Marker | What it does |
|---|---|
| `viz start` | Arm a recorder if the script has none, and open a window. |
| `viz stop` | Close the window and write it into the trace file. |

`@viz start` and `@viz stop` are the attribute spellings and mean exactly the same as the statements. Both are accepted, and it is deliberate: an instrumented script that already works must not stop working for having a spare way to say the same thing. [attributes](attributes.md) is the general shape; this pair is the one the visualiser acts on.

The options, each of which is a refinement rather than something to learn first:

- **`once`** (the default) — one window at a time. A start/stop pair inside a subroutine would otherwise open and close a window of its own on every call, which is rarely what the author meant; `once` lets the first window hold.
- **`every`** — the latest window wins: a second start closes the one before it. This is the one for a loop.
- **`until thread`** — the window closes when the thread that opened it ends, instead of at a stop you have to remember to write. This is what makes several stop points work without instrumenting each one.
- **`limit <n>`** — the most visits this window will collect, 100,000 by default. The cap ends the *collection*; the program runs on.
- **`on <label>`** — the marker is placed at a label rather than at its own line. The label is named the way `gosub` names one, so a forward reference works, and a name that resolves to nothing is the analysis's to report rather than the compiler's.

A `viz start` with no `viz stop` is not a mistake. It is the "watch until the end" case, and a host that ends the run closes its window for it.

**A marker changes nothing about a run.** `viz start` compiles to a command the runtime steps over without executing, and the syntax lives in core rather than in the plugin — so an instrumented script stays an ordinary script, `viz start` compiles whether or not the visualiser is loaded, and one left in by accident is harmless. With no recorder attached a marker opens no window at all, so there is nothing collected and no file.

## The values worth watching

`@show` names the values you want beside the flow:

```as
    while Total is less than Limit @show Total, Row
    begin
        add Row to Total @show Total
    end
```

The values ride on the **visit** they fall inside — a visit being an anchor's residence, from an arrival to the next one — so `@show` on a `while` attaches to the arrival it belongs to, and a `@show` further down a block attaches to the visit in flight, which covers it. A second `@show` within one span rewrites the same names rather than adding a second reading: one value per name per visit is what a reader can take in without the pane becoming a log.

They travel in the recording, on the anchor record's `values`, and the visualiser shows them. In the Graph pane the **Values** tab beside the picture reads out what the run captured at the arrival the pointer is *in effect* at, and it follows the pointer — so watching a value change through a run is a matter of traversing the picture, with no clicks to make. Two arrivals on one line are told apart by their visit number, and a line the run never arrived at says so rather than showing the last one's numbers.

Three details worth knowing. A name the program does not hold is captured as `?` rather than vanishing — so a typo shows itself in the recording instead of silently dropping the value. A `@show` inside a block is read as the statement is reached, *before* it runs, so it reports what the test saw rather than what the statement left behind. And **values are captured only inside a `viz` window** — a reading rides on a *visit*, and a visit needs an anchor, which is emitted only between `viz start` and `viz stop` — so a script that writes `@show` and no markers records nothing at all. Put the two markers beside the values you want to see; they change nothing about what the run does.

## Asking for a recording

There are several ways to ask, and which one is right depends on who is asking.

### From the visualiser

The editor's **Record** button records the script in the open buffer. A script that names an app is a special case — see *Naming the app's page* below — and is opened instead, armed from outside and written when that window closes.

### The flag file, for a running service

A process started on a machine you reach only by SSH cannot be restarted in order to be looked at, but a file can be put beside its script. So a file is the request:

```
touch thermostat.allspeak.record      asks for a recording
rm    thermostat.allspeak.record      withdraws the request
```

The flag is read **at the markers and nowhere else** — nothing polls and nothing runs on a timer, so a script with no markers is never asked, and a script whose markers sit in its control loop is asked once a cycle, which is the granularity its author chose. Clearing the flag to set it begins a recording from nothing, so the previous file stands until this one is written and a short episode cannot destroy a good recording; setting it to clearing finishes and writes it.

This is the Python runtime's own mechanism, and it is the one place a recording is asked for by hand rather than by a tool — see *Runtimes differ* below for why the browser cannot do the same.

### From another script

```as
    record the script in Path as Source giving Trace reporting Verdict
```

Runs a script of the caller's choosing under a recorder, and hands back two things: the recording as text in `Trace`, and the one-line verdict in `Verdict`. `in <path>` is optional and names the script; `as <source>` is what a caller holding the text itself passes, so an editor with an unsaved buffer need not write a file out and read it back. Both runtimes have this one.

On the JavaScript side there are two more, for a script that records itself or an app that is already running:

```as
    record this run
    save the recording to Path
```

`record this run` arms a recorder for the program that calls it — the thing a button *inside* an app needs, since nothing outside a live program can attach a recorder to it. `save the recording to` names the trace file and writes what has already been stopped; it also **creates the file**, empty, which is what makes a second run replace the first rather than add to it.

### From the command line

```
allspeak --record=parser.viz.json parser H2O
```

Runs the script exactly as `allspeak parser H2O` would, and writes what it did to the named file. Nothing is armed without the flag, so a plain `allspeak parser` behaves as it always has.

## Where it goes

Beside the script and named after it, extension and all — `thermostat.allspeak` records to `thermostat.allspeak.viz.json`. The editor looks for that name, so a recording brought back with `scp` displays by opening the script and pressing **Graph**.

The file is a JSON document described by `spec/viz-trace-format.md`. The current writer emits **version 2**, which added the transfer records that say where control came from when it did not simply fall through. A document may be added to as a recording goes on: `viz start`/`viz stop` delimit a *segment*, each segment's window index continues from the last, and a file therefore holds any number of segments end to end, in the order they happened.

## The verdict

A recording reports what it amounts to, in one line, and the line is the same sentence wherever it is read:

> `12 visits in 1 window`

Two of the readings matter more than the rest, because both look like a successful run from the outside — one is a script that never opened a window, the other a script the guard had to stop:

> `nothing recorded: the run finished without reaching a marker`

> `stopped: <reason>`

and when the run was parked on a timer rather than finished, the visit line gains a clause: `, and the run waits there — the recording ends at its first wait`.

The first is what a script with no window open produces, which is why the markers above are the one thing worth knowing here.

## Naming the app's page

```as
    @app color-memory.html
```

On a line of its own, this says which page the script runs inside. It is what **Launch** opens, and it is what decides how **Record** treats the script: a script that names an app is driven by its own page — its markers are reached by a *person* clicking, not by the script starting — so the editor opens that page, arms it from outside, and saves the recording when the window closes. A script that names no app is run directly instead.

## The guard

A recorder watches the program's own work and ends the run if it runs away:

- **2 seconds of work** — the time the program's *own* commands took, with waits excluded: `wait`, `every`, `release`, `input`, `download`, `alert`, and anything that fetches a `url`. A gap longer than 20 ms is waiting rather than work.
- **20 seconds of wall clock** — because the budget alone bounds only what the program *does*, and a loop that waits between iterations never spends it. The two are told apart in the report, since one is slow code and the other is usually wrong code.

**The flag recorder carries no guard, and that is not an oversight.** Its purpose is to watch a script that is probably doing something useful — a controller, a service — and a guard there would *stop the thing being watched*. It is bounded instead by a cap on what it may collect: 50,000 visits, after which it writes what it has and says so on stderr, where the person who typed the `touch` will find it.

## Runtimes differ

`record the script …` is in both runtimes. The rest is not, and the split is worth knowing before writing a script that has to work in both:

| | JavaScript (browser) | Python (terminal) |
|---|---|---|
| `viz start` / `viz stop` | yes | yes |
| `record the script … giving …` | yes | yes |
| `@viz start` arming its own script | yes | no |
| `record this run`, `save the recording to <path>` | yes | no |
| the flag file (`thermostat.allspeak.record`) | no | yes |
| `allspeak --record=<path>` | n/a | yes |

The Python runtime's control loop is a file a process can notice; the browser's is an app whose recorder has to be attached from outside before its first marker runs. Each runtime has the shape that suits it, and neither has the other's yet.

## The script, without running it

A recording needs a run. The other question — *what is this script made of?* — does not:

```as
    model the script in Path as Source giving Model
```

This reports the script's **anchors**: the places where control flow is not simply the next line — labels, `while` tests, and the points where an event handler is entered — together with enough of the control-flow graph to say whether each anchor can be reached at all. Nothing is executed and nothing is drawn; it is what tells the visualiser's Blocks view which sections nothing enters, and which lines a `viz` window could cover.

## Related

- [attributes](attributes.md) — `@`-notes a script carries, and why the runtime ignores them; `viz`'s markers and `@app` are two of them.
- [dev-environment](dev-environment.md) — `browse`, `system` and `download`, the Python-runtime keywords a launcher script uses.
- [debugging-as](debugging-as.md) — the cheaper instruments: `log`, `print` and the tracer.
- [multilingual](multilingual.md) — `@` is not a word, and the marker vocabulary is not translated either: `viz`, `start`, `stop` and the options are written the same in every language.
- [working-with-ai](working-with-ai.md) — where a recording fits the AI-writes / human-reviews loop.
- `spec/viz-trace-format.md` in the repository — the file format, field by field.
