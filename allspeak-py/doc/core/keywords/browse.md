# browse

## Syntax

`browse {url}`

## Parameters

- `url`: A string value containing the URL to open.

## Description

Opens the given URL in the user's default browser via Python's `webbrowser` module. The call is OS-independent — no shell-out to `xdg-open`, `open`, or `start` — and fire-and-forget: it returns immediately, with no indication of whether the browser actually opened.

The keyword exists in the Python runtime only. It is not defined in the JS browser runtime.

## Examples

```
browse `https://allspeak.ai/learn/`
```

Open a page on a local dev server:

```
variable Url
put `http://localhost:` cat Port cat `/edit.html` into Url
browse Url
```

## Ordering note

When a script `start`s a server and then calls `browse` for URLs that the same server will handle, the `browse` calls must come *after* the `on … request begin … end` handler block. Until that block executes, the server has accepted the port but has no handler registered, so inbound requests get a 503 "Server handler not ready". See `learn/idioms/13-server-as-application.md` for the full pattern.

## See Also

- [system](system.md)
- [download](download.md)

Next: [clear](clear.md)
Prev: [begin](begin.md)

[Back](../../README.md)
