# REST and async

## Problem

You need to talk to an HTTP endpoint: fetch a config blob, post a form, pull a list of records. The call may fail; the script must handle that, and must keep the rest of the application responsive while waiting.

## The basic shapes

```as
rest get Result from `/api/users` or go to FetchFailed
rest post Payload to `/api/users` or go to PostFailed
rest put Payload to `/api/users/42` or go to PutFailed
rest delete from `/api/users/42` or go to DeleteFailed
```

All four take an optional failure clause. The body of a GET response goes into a variable (the first argument); the body of a POST or PUT is a value that gets sent.

`Result` typically arrives as a JSON-shaped string, ready to be inspected with `property`, `element`, or `entry` access (see [collections](../reference/collections.md)).

## Failure handling

Two clauses, two intents — see [errors-and-recovery](../reference/errors-and-recovery.md):

- `or` for "report and bail" — the thread stops after the clause body.
- `on failure` for "substitute and continue" — execution carries on.

```as
rest get Config from `/api/config`
    or begin
        print `Server unreachable: ` cat the error
        gosub UseLocalConfig
    end
! never reached if the call failed
```

```as
rest get Config from `/api/config`
    on failure set Config to `{}`
print Config       ! always reached; Config is either fetched or empty
```

## Yielding while waiting

`rest get` and its siblings block the current thread until the response arrives, but the runtime continues to dispatch other threads. The UI stays responsive, event handlers still fire, forked threads still run.

If you need to do work in parallel with a long fetch — show a spinner, animate something — spawn a separate thread before the call:

```as
fork to Spinner
rest get Data from `/api/slow-endpoint` or go to FetchFailed
clear Spinning
! ... use Data ...

Spinner:
    set Spinning
    while Spinning begin
        ! ... advance the spinner frame ...
        wait 50 millis
    end
    stop
```

The main thread blocks at `rest get`; the spinner thread keeps cycling because the runtime gives it turns every `wait`. When the response arrives, the main thread resumes and clears the flag, the spinner notices on its next `wait`, and stops.

## Server-side iteration vs script-side iteration

When fetching a collection, prefer to let the server filter and paginate where possible. A script that does:

```as
rest get All from `/api/items` or stop
! ... then loops through All, picking the 5 the user actually wants
```

is forcing the server to send everything and the network to carry it. If the API supports query parameters:

```as
rest get Subset from `/api/items?limit=5&category=Books` or stop
```

The principle: do the work where the data lives. Reach for script-side iteration only when the server can't help.

## Posting a dictionary

Build the payload as a JSON-shaped variable and pass it to `rest post`:

```as
variable Payload
set Payload to object
set property `name` of Payload to NameField
set property `email` of Payload to EmailField

rest post Payload to `/api/users`
    or begin
        print `Sign-up failed: ` cat the error
        stop
    end
```

The runtime serialises the payload to JSON for transmission. See [picking-a-collection-shape](picking-a-collection-shape.md) for the "one dict per direction" rule.

## Anti-pattern: polling without yielding

```as
while not Ready begin
    rest get Status from `/api/status` or stop
    ! ... check Status ...
end
```

This hammers the server every iteration of the loop. Add a `wait` between checks to throttle:

```as
while not Ready begin
    rest get Status from `/api/status` or stop
    ! ... check Status ...
    wait 1 second
end
```

For longer waits, prefer server-side push (WebSocket, MQTT subscription, server-sent events) over polling — see [mqtt-pubsub](mqtt-pubsub.md) for the canonical AllSpeak push pattern.

## Anti-pattern: silent failure on critical loads

```as
rest get Config from `/config.json` on failure set Config to `{}`
! ... script proceeds with an empty config ...
```

If Config is critical, `on failure set to empty` lets the script run with broken assumptions everywhere downstream. Use `or` and abort, or `on failure` plus a clearly-logged degraded mode. Don't paper over.

## Related

- [errors-and-recovery](../reference/errors-and-recovery.md) — `or` vs `on failure`.
- [collections](../reference/collections.md) — JSON-shaped payloads.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — `fork` and `wait`.
- [mqtt-pubsub](mqtt-pubsub.md) — push instead of poll.
