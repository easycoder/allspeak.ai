# Extracting a plugin

## Problem

A script has grown a block of low-level mechanism that is slow, repeated, or awkward to express: a cursor loop that walks an array and sums it, a parser for a quoted format, a numerical kernel, a protocol handshake. The readable policy around it is now a minority of the section, and the same block turns up in other scripts.

This is the signal for the opposite move to [extracting a module](09-extracting-a-module.md). A module keeps pure AllSpeak logic in AllSpeak. A plugin moves a **mechanism** into JavaScript or Python and gives it a small vocabulary — but only when the evidence says the move will pay.

## When to extract

Triggers to consider a plugin:

- **A measured hot path.** A recording or a profile shows one loop or one subroutine dominating the run.
- **Repetition.** The same twenty to fifty lines of low-level AllSpeak appear in three or more scripts.
- **A missing native API.** The code exists mainly to work around a library or platform call AllSpeak cannot reach.
- **A de facto domain.** A module's vocabulary has stabilised and other scripts want it; it is no longer application policy but a mechanism with a name.
- **A recurring AI error.** The AI keeps getting the same mechanism wrong, and a small vocabulary would remove the error surface.
- **A large mechanical block.** The section is token-heavy and its details are not what a reviewer needs to see.

A good candidate also has these properties:

1. **One mechanism.** A single sentence describes it without "and also". If it needs two "and also"s, it is several plugins or none.
2. **A stable vocabulary.** You can name the two or three commands and they are unlikely to change next month.
3. **A testable boundary.** Data in, data out. The platform half can be tested without AllSpeak, and the vocabulary half with a small script.
4. **Repetition or measured cost.** It is used more than once, or it dominates a run. A one-off is cheaper to leave inline.
5. **No policy.** The rules and decisions stay in AllSpeak; only the mechanism moves.

## When *not* to extract

Do not extract:

- **The policy.** Business rules, flow, choices, thresholds — the layer a human reviews — stay in AllSpeak even when they are verbose. A plugin there hides the thing under review.
- **A one-off.** A plugin is a vocabulary commitment; one use does not repay it.
- **An unstable vocabulary.** If the words are still changing, the plugin will be rewritten before it is read.
- **A shared script's runtime-specific path.** If the script must run in both the JS and Python runtimes, a plugin that exists in only one makes it dialect-specific. Either provide both, or keep the mechanism in the script.
- **Something a module can do.** Pure AllSpeak logic with its own state and namespace belongs in a [module](../reference/modules.md).
- **Code that is readable and fast enough.** "Could be faster" is not a measurement.

## The decision order

1. **A built-in command.** Check the core vocabulary and the standard domains first.
2. **An existing plugin.** Check the bundled plugins and the project's own before adding another.
3. **A module.** Use it for pure AllSpeak policy that needs private state.
4. **A new plugin.** Use it for a mechanism that is repeated, measured hot, or native-only.
5. **An external service.** Use it for long-running work, a hardware bridge, or a security boundary, and expose a thin command.
6. **Nothing.** Leave a one-off inline.

The full decision table is in [Plugins](../reference/13-plugins.md#deciding-to-extract).

## The extraction shape

The point of the move is that the **mechanism** disappears from the script and the **policy** stays in it. A simplified before and after:

```as
! Before: the script walks the array itself
variable Index
variable Total
put 0 into Total
put 0 into Index
while Index is less than the elements of Samples
begin
    index Samples to Index
    add Samples to Total
    add 1 to Index
end
if Total is greater than Threshold print `Over budget`
```

```as
! After: the mechanism is one command; the decision is still visible
put the total of Samples into Total
if Total is greater than Threshold print `Over budget`
```

The vocabulary `the total of` is illustrative — the plugin defines its own words. The second version is shorter, but the important difference is what a reviewer sees: the loop's arithmetic is no longer competing with the rule that matters.

## What moves, and what stays

| Stays in AllSpeak | Moves into the plugin |
|---|---|
| Which data to use, and which window | Walking the array, reading the slots |
| The thresholds and the decision | Summing, scaling, square roots, null handling |
| What to display, log or send | The edge cases of the algorithm |
| The order of operations across mechanisms | The inner loop and the native calls |

The plugin should not decide policy. If the plugin needs to know "what counts as an anomaly", the boundary is in the wrong place; pass the threshold in, and let the script decide.

## Interface design

- **A small vocabulary.** One command per mechanism, or a value form such as `the mean of Samples`. Do not expose the whole native library.
- **Data in, data out.** No live references across the boundary. The plugin receives a value, computes, and returns one.
- **Platform half, vocabulary half.** Keep the part that does the work separate from the part that talks to AllSpeak — the `idb-core.js`/`idb.js` and `photo-core.js`/`photo.js` pattern. The first is testable without the runtime; the second is small enough to read.
- **Units and scaling.** AllSpeak is integer-first and floats are strings. A statistics plugin should state whether it takes scaled integers, returns them, and what it does with a non-numeric value.
- **Clear failure.** A plugin that returns `0` for "could not compute" is indistinguishable from a real zero. Fail with a message the script can catch.
- **Cross-runtime honesty.** Say which runtimes the plugin supports. A JS-only plugin is fine for the browser UI; a Python-only plugin is fine for the controller or Studio. Do not put one on the critical path of a script that must run in both.
- **Python: define `modifyValue`.** Every registered Python domain is asked to modify every compiled value; a missing hook raises `AttributeError` on the first value. Return the value unchanged when there is nothing to add.
- **JavaScript: load before the script runs.** A JS plugin registers on `AllSpeak.domain`, so its `<script>` tag must come before the script that uses the vocabulary.

## Worked example: a statistics plugin

Studio is the natural case. The mechanism is a numeric kernel over a list of samples; the policy is which rooms, which window, what counts as unusual, and what to show.

- **Stays in AllSpeak:** choose the room and the window, call the kernel, compare the result with a threshold, write the sentence or the chart.
- **Moves into the plugin:** walking the samples, converting the scaled integers, summing, dividing, the square root, the percentile sort, the empty-list case.
- **The vocabulary:** `the total of Samples`, `the mean of Samples`, `the standard deviation of Samples` — illustrative names, defined by the plugin.
- **The test:** a known list with a known mean and deviation; an empty list; one value; a negative value; a value that arrived as text. Test the kernel without AllSpeak, then test the words with a four-line script.

The same split works in the UI with a JS plugin, and in the controller with a Python plugin. The shell stays AllSpeak; only the kernel moves.

## Review checklist

Before committing to the extraction:

- [ ] Is this a mechanism, not policy?
- [ ] Is it repeated, or measured hot?
- [ ] Is the vocabulary stable enough to name?
- [ ] Can the platform half be tested without AllSpeak?
- [ ] Does it work in the runtime(s) the project actually uses?
- [ ] What does it cost in onboarding, packaging, parity and review?
- [ ] Would a module be enough?
- [ ] Can the plugin be removed or replaced without changing the script's policy?

If the last answer is no, the boundary is wrong: the script is coupled to the implementation rather than to a vocabulary.

## After the extraction

- Document the vocabulary where a script author will look, and keep the plugin's own README or doc block beside its code.
- Add the plugin to the project's dependency and deployment story: the JS file the page loads, or the Python file the script imports.
- Measure the before and after — runtime, lines and tokens — and record the result. A plugin that does not pay back is a vocabulary cost with no return.
- Re-read the script: if the policy is now clearer, the extraction did its job. If the script merely calls one opaque command and the reviewer cannot tell what it does, the boundary moved too much.

## Related

- [Plugins](../reference/13-plugins.md) — the contract, the mixed-stack principle and the decision table.
- [Extracting a module](09-extracting-a-module.md) — the AllSpeak-side move, and when a module beats a plugin.
- [Modules](../reference/modules.md) — `run`, `release parent`, message passing.
- The plugin contract: `spec/allspeak-plugin-contract.md`.
