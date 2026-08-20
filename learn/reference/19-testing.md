# Testing

AllSpeak's testing vocabulary is deliberately small: `check` asserts a fact, `test … end test` groups related assertions into a named case, and the `--test` runner mode turns a script into a suite with a summary and a usable exit code. The vocabulary runs in both implementations (JS and Python) and in any language once the pack translates the keywords.

## `check` — an assertion

`check that <condition>` evaluates a condition and reports the result. The condition grammar is exactly the one used by `if` — equality, comparison, presence, and `and` / `or` combinations all work unchanged:

```as
variable RoomCount
variable A
variable B
put 4 into RoomCount
put 1 into A
put 2 into B

check that RoomCount is 4
check that RoomCount is less than 6
check that RoomCount is numeric
check that A is 1 and B is 2
```

The word `that` is a natural-language joiner and may be omitted:

```as
check RoomCount is 4
```

- **Pass** — recorded silently; nothing is printed.
- **Fail** — recorded, and a report line is logged through the normal log channel:

  ```
  FAIL: RoomCount is 5 (schedule.as:12)
  ```

  The parenthesised part is the script name (as set by `script <name>`, else the file name) and the line number of the check. After logging, execution **continues** — a failed check is a report, not a crash.

Checks outside any `test` block belong to an implicit default case; they count toward the aggregate but are not listed as a named test.

## `test … end test` — a named case

`test <name> … end test` groups statements into a named case. The name is a value (usually a literal):

```as
variable RoomCount
put 1 into RoomCount

test `Adding a room`
    check that RoomCount is 1
end test
```

- The body may contain any statements — setup, checks, `gosub`s, `begin … end` blocks.
- `test` blocks are a statement pair like `begin … end`; they may not be nested.
- Outside `--test` mode they are transparent grouping: checks inside them behave exactly as bare checks (failures log `FAIL` and continue).

## Failure clauses — `or` and `on failure`

`check` accepts the same failure clauses as the fail-capable commands, with their documented semantics:

```as
variable X
put 3 into X

check that X is 3 on failure gosub to FixUp    ! record failure, run FixUp, continue
check that X is 3 or gosub to Cleanup          ! record failure, run Cleanup, end this test
```

- `on failure <action>` — the check fails, the action runs, and execution continues at the next statement.
- `or <action>` — the check fails, the action runs, and the current `test` block ends immediately (marked failed). Outside any `test` block, `or` ends the script, like a bare `stop`.

Inside the action, `the error` holds the failure message.

## `--test` — the runner

The Python CLI runs a script (or a whole directory) as a test suite:

```
allspeak --test schedule.as
allspeak --test conformance/tests/
```

A directory runs every `.as` file as its own suite, then prints an aggregate line. In test mode, the summary is printed at `exit` (or at end of script):

```
Test suite: schedule.as
  ✓ Adding a room (2 checks)
  ✗ Advance roll-over (FAIL: the room count is 4 — line 12)
  ✓ Boost expiry (3 checks)

3 tests, 2 passed, 1 failed — 7 checks, 6 passed, 1 failed
```

The per-case line shows the case name and outcome; for a failing case it shows the first failed condition and its line, and for a case that errored it shows the error message:

```
  ✗ Advance roll-over (error: Arithmetic error in divide: integer division or modulo by zero)
```

### Error isolation

In `--test` mode an unhandled runtime error inside a `test` block does not abort the run. The case is marked **errored** and the runner skips to the next block, so one broken case does not hide the others:

```as
variable X
put 5 into X

test `Bad case`
    divide 10 by 0 giving X    ! runtime error — case marked errored
    check that X is 1          ! skipped
end test
test `Still runs`              ! this block still executes
    check that X is 5
end test
```

Which statements raise a runtime error differs slightly between the two runtimes: the Python runtime raises on division by zero, the JS runtime on non-numeric arithmetic (e.g. `add 1 to` a text value). Either way the case is marked errored and the runner moves on.

An error outside any `test` block still terminates the script (the run itself broke).

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | every check passed, no test errored |
| 1 | at least one check failed or a test errored |
| 2 | the script could not be compiled or run |

### The JS runtime

The JS runtime runs in the browser and has no CLI. The vocabulary and summary are identical; the host enables test mode by setting the runtime flag before starting:

```js
AllSpeak.testMode = true;
AllSpeak.start(scriptSource);
```

With the flag set, `test` blocks isolate errors and a summary is written to the debug console at exit, mirroring the Python runner's output.

## Related

- [conditions](06-conditions.md) — every condition `check` accepts.
- [errors-and-recovery](10-errors-and-recovery.md) — `or` vs `on failure` semantics shared with the fail-capable commands.
