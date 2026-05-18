# Dev-environment commands

A small family of core keywords exists for interacting with the host operating system and the user's desktop. They are **Python-runtime only** — the JS browser runtime doesn't define them, because a browser script has no shell, no filesystem, and is already running inside a browser tab.

These commands exist to support dev-time scripts (development servers, launchers, build helpers, one-off utilities) rather than runtime application logic. They are intentionally narrow: if you find yourself reaching for `system` from inside production-side code, prefer a focused keyword or a plugin.

| Keyword | Purpose |
|---|---|
| `system [background] {command}` | Run a shell command. With `background`, fork it and return immediately. |
| `download [binary] {url} to {path} [or {clause}]` | Fetch a URL into a local file. |
| `browse {url}` | Open a URL in the user's default browser. |

## browse

Opens a URL in the user's default browser via Python's `webbrowser` module. OS-independent — no shell-out to `xdg-open` / `open` / `start`, so the same script works on Linux, macOS, and Windows without conditional logic.

```
browse `http://localhost:8080/edit.html`
```

The call returns immediately; the OS hands the URL to the browser asynchronously. There is no return value and no way to know from the script whether the browser actually opened — `browse` is fire-and-forget.

The typical use is in a launcher script that needs to point the user at one or more pages — see [server-as-application](../idioms/13-server-as-application.md) for the canonical pattern.

### Ordering matters when opening into your own server

If a script `start`s a server and then calls `browse` for URLs the same server will handle, the `browse` calls must come *after* the `on … request` handler block. Until that block executes, the server has accepted the port but has no handler registered, so inbound requests get a 503 "Server handler not ready". The handler block sets a handler PC and then jumps past its body, so code that follows the block runs as normal — that's where the browse calls belong.

## system

Run a shell command. With `background`, the command is forked into a separate process and `system` returns immediately; without it, the script waits for the command to finish.

```
system `ls -l > files.txt`
system background `sleep 2 && allspeak server.as 8080`
```

`system` is convenient but ties the script to a particular OS. Prefer `browse` when the goal is opening a URL, and `download` when the goal is fetching a file — both are OS-independent.

## download

Fetch a URL into a local file, with an optional `or` / `on failure` clause for error handling:

```
download `https://allspeak.ai/code/server.as` to BaseDir cat `/server.as` or begin
    print `Update check failed`
end
```

Add `binary` for non-text payloads (images, archives). The full grammar and per-keyword examples live in `allspeak-py/doc/core/keywords/{system,download,browse}.md`.

## When these don't exist

In the JS browser runtime, `system`, `download`, and `browse` are not defined. The browser sandbox makes them either impossible (`system`) or redundant (`browse` — a script can navigate via `window.location` or open via `window.open`, and `download` can be done with `rest get`). Don't write code that uses these keywords if it might also need to run in the browser; keep them in scripts that are clearly Python-side, such as `server.as` and CLI utilities.
