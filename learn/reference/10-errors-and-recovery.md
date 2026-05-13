# Errors and recovery

Some commands in AllSpeak can fail at runtime — `rest get` may not reach its endpoint, `load` may not find its file, `run` may not find its module. These commands accept an optional failure clause that runs if the operation fails.

If a command can fail and you don't attach a clause, the thread terminates with a runtime error.

Two failure clauses are available — `or` and `on failure` — with the same outer syntax but different post-clause behaviour. The choice expresses what should happen next.

## `or` — run and stop

`or <statement>` after a fail-capable command runs the statement on failure, then stops the thread:

```as
rest get Strings from `/strings.json` or go to StringsFailed
```

If the call succeeds, execution continues with the next statement. If it fails, the `or` body runs and the thread terminates. The body can be a single statement or a `begin … end` block:

```as
rest get Config from `/config.json`
    or begin
        print `Could not load config`
        gosub Cleanup
    end
```

Use `or` for irrecoverable failures — the script can't usefully continue, so the clause cleans up and stops.

## `on failure` — run and continue

`on failure <statement>` after a fail-capable command runs the statement on failure, then resumes execution at the next statement:

```as
load Content from Filename
on failure set Content to empty
print Content
```

If the load succeeds, `print` shows the loaded content. If it fails, `on failure` sets a default and `print` shows the empty string. Either way, execution continues.

Use `on failure` when failure is expected to be recoverable — the script substitutes a sensible default and carries on.

## Side-by-side

The same recovery statement under each clause behaves differently:

```as
! `or` form
load Content from Filename or set Content to empty
print Content                                ! does NOT execute on failure

! `on failure` form
load Content from Filename
on failure set Content to empty
print Content                                ! DOES execute on failure
```

Pick the form that matches what you want to happen next — `or` for "report and bail", `on failure` for "substitute and continue".

## Reading the error

Inside either clause, `the error` (or the longer `the error message`) is a value containing the runtime error string:

```as
rest get Config from `/config.json` or begin
    print `Load failed: ` cat the error
    gosub Cleanup
end
```

## Which commands can fail

Fail-capable commands are I/O-style operations:

- `rest get`, `rest post`, `rest put`, `rest delete`
- `read` (files)
- `write` (files)
- `load` (files / URLs)
- `save` (files)
- `run` (loading a module)
- `mqtt publish`, `mqtt subscribe`

Domains and plugins may add their own fail-capable operations — check the relevant language pack. Plain Core operations (`set`, `add`, `multiply`, `if`, `while`) have no runtime failure modes; they're either valid (succeed) or invalid (compile error).

## Anti-pattern: ignoring a failure

```as
rest get X from URL    ! no clause — thread terminates on failure
```

If the command can fail and you haven't said what to do, the thread ends. For prototypes that's sometimes fine. For production code, attach a clause and decide what's intended.

## Anti-pattern: silent recovery

```as
load Config from `/config.json` on failure set Config to `{}`    ! continues silently
```

Substituting a default without logging will hide real failures (network outages, server errors) behind apparently-working code. If a default is acceptable, log the substitution at least once so the problem isn't invisible.

## Related

- [control-flow](control-flow.md) — `stop`, `go to`, the destinations an `or` clause typically uses.
- [structure](structure.md) — which domain owns which fail-capable command.
- [rest-and-async](../idioms/rest-and-async.md) — typical patterns for REST.
