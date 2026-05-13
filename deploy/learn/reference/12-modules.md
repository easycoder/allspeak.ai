# Modules

A module is an AllSpeak script loaded and run by another AllSpeak script. The parent can call into it like a subroutine, run it concurrently as another cooperative thread, or both. Modules have their own private variables and their own label namespace; communication with the parent is by message-passing.

For the design criteria and worked examples of *when* to extract a module, see [extracting-a-module](../idioms/extracting-a-module.md). This file covers the mechanism.

## The module variable

A module is referenced through a variable of type `module`:

```as
module DeviceController
```

The variable starts empty. `run` loads a script into it.

## `run`

`run` loads, compiles, and starts the script. The syntax differs between dialects.

**Python** — the argument is a path; the runtime opens and compiles the file:

```as
run `deviceControl.as` as DeviceController
```

**JS** — the argument is a variable holding the source text. Fetch it first with `rest get`:

```as
variable ModuleSrc
rest get ModuleSrc from `resources/as/device-control.as?v=` cat now
    or go to LoadFailed
run ModuleSrc as DeviceController
```

In either dialect, after `run` the child script begins executing. By default the parent blocks at `run` until the child reaches `exit` or explicitly releases it with `release parent`.

## `release parent`

If the module calls `release parent`, the parent's `run` returns immediately and the module becomes a separate cooperative thread alongside the parent:

```as
! Module
on message go to Handler
release parent          ! parent's `run` returns from here
stop                    ! park and wait for messages
```

Without `release parent`, the parent stays blocked until the module exits. This is the difference between using a module as a synchronous helper (no release) and a long-lived collaborator that co-exists with the parent (released). Co-existence does not imply that both are active — a released module that's just waiting for the next message still counts. It's up to the caller of `send` whether to wait for a reply or carry on.

## Message-passing

After release, the parent and child communicate by messages. The parent sends:

```as
send InputDict to Helper
send InputDict to Helper and assign reply to OutputDict
```

Both forms send the value (typically a dictionary). The second form waits for the module to call `send … to sender`, then assigns the reply.

The module declares a message handler once, near its top:

```as
on message go to Handler

Handler:
    put the message into InputDict
    ! ... do the work ...
    send ResultDict to sender
    stop
```

It is also valid to write the handler as a `begin … end` block immediately after `on message`, but a separately labelled block usually reads more clearly.

Inside the handler:

- **`put the message into X`** reads the incoming message into X.
- **`send Y to sender`** sends a value back to whichever script sent the original message.
- **`stop` (not `return`)** ends the handler thread and waits for the next message. `return` can only be used to end a block that was reached via `gosub`; using it elsewhere will cause the runtime to detect a corrupted stack and throw an exception.

The same form works in every direction — a module can `send` to its `parent`, to `sender`, or to another module it has loaded itself; parents can have their own `on message go to …` handler. The terms "parent" and "child" do not imply a ranking — both have equal rights and abilities. The one exception is the right that the primary (top-level) module has to shut the application down.

## `exit`

When a module is done, it calls `exit`. This:

- Terminates the module's thread.
- Returns control to the parent if the parent was blocked at `run`.
- Releases all the module's runtime memory for garbage collection.

The last point matters: an application can accrete a large amount of functionality across many modules without keeping unused ones in memory.

For a long-lived concurrent module that handles messages indefinitely, you usually don't `exit` — the handler `stop`s and waits forever.

## Private state and namespaces

Inside a module, all variables are private. Two modules each declaring a `Counter` have their own. The parent's variables are invisible to the module unless explicitly exported with `with` and imported with `import` (next section).

Modules each have an independent **label** namespace too. A helper subroutine like `ParseDate` used in both parent and child must either be duplicated — one copy in each script — or live in its own module that both parent and child instantiate and run independently. The cost of separation is real; the alternative (everything-shared) would defeat the point.

## `with` and `import`

To share variables across the boundary, the parent exports with `with` at `run` time, and the module imports the matching names at the top of its script:

```as
! Parent
run Script as MyModule with Specification and MainPanel
```

```as
! Module
script ModuleName
import variable Specification and div MainPanel
```

The names and types must match on both sides, and the imported names must not clash with the module's own declared variables. Changes made on either side are seen by the other — these are shared references, not copies.

## The `script` line

By convention, a module file starts with a `script` declaration that names itself:

```as
script DeviceController
```

This is informational — it sets the program's name for logs and diagnostics. It is optional; non-module scripts often omit it.

## Related

- [cooperative-multitasking](cooperative-multitasking.md) — `release parent` makes the module a cooperative thread.
- [extracting-a-module](../idioms/extracting-a-module.md) — when and how to split a script (uses the `as-modularize` skill).
- [rest-and-async](../idioms/rest-and-async.md) — the JS-dialect fetch-then-run pattern.
