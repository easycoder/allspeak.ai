# Server as application

## Problem

A typical AllSpeak GUI project produces two artifacts that the user interacts with: a browser-based editor (`edit.html`) and one or more project pages (`<project>.html`). Treated as separate artifacts, the user has to start a dev server in one terminal, open the editor URL in one tab, open the project URL in another tab, and remember the port. That's four steps and three pieces of mental state for what is conceptually one running thing.

The simpler frame: **the server is the application, and the browser tabs are its UI.** The user runs one command; the tabs open themselves; closing the server closes the app.

## The pattern

`server.as` accepts a `-t` / `--tabs` flag whose value is a comma-separated list of page names (without `.html`):

```
allspeak server.as -t edit,<project>
allspeak server.as --tabs edit,<project> 8080
```

For each name, the server builds `http://localhost:<port>/<name>.html` and opens it in the user's default browser using [`browse`](../reference/17-dev-environment.md#browse). Port defaults to 8080 and may appear before or after the flag.

The launcher convention in the starter packs is to run this command in the background as soon as the GUI outline files exist, so the user sees one app come to life rather than three separate steps.

## Anatomy of a launcher script

A launcher that uses this pattern has four ordered phases:

1. **Parse the CLI arguments.** Loop over `argc` / `arg N`, recognise the flag, treat anything else as the port.
2. **Start the server.** `start MyServer on port Port` accepts the port but does not yet have a handler.
3. **Register the request handler.** `on MyServer request begin … end` sets the handler PC and jumps past the body.
4. **Open the tabs.** Split the comma-separated list, build each URL, call `browse` on it.

The ordering is load-bearing: phases 3 and 4 must be in that order. If `browse` runs before the handler block, the freshly-opened tabs race the server and hit a 503 "Server handler not ready" before the handler is installed. The fix is to put the tab-opening loop at the *end* of the script, after the `on … request begin … end` block.

```
    start Files on port Port

    on Files request
    begin
        ! ... handle requests ...
    end

    ! After the handler is registered — never before.
    if TabList is not empty
    begin
        split TabList on `,`
        put 0 into TabIndex
        while TabIndex is less than the elements of TabList
        begin
            index TabList to TabIndex
            put TabList into TabName
            if TabName is not empty
            begin
                put `http://localhost:` cat Port cat `/` cat TabName cat `.html` into TabUrl
                browse TabUrl
            end
            increment TabIndex
        end
    end
```

The full reference implementation is `server.as` in the starter packs.

## When to use this pattern

- **GUI projects** where the user needs both the editor and a project page open. The default in the starter packs' `CLAUDE.md` is to launch with `-t edit,<project>`.
- **CLI projects** where the user might also want the editor for browser-side editing. Launch with `-t edit` alone — the server still serves the project files, but no project page tab is opened by default.
- **Multi-page apps** where two or three pages are always opened together. List them all in the flag.

## When *not* to use this pattern

- **For a deployed app.** Production users won't be running `server.as`. This pattern is for the development workflow only.
- **When the script doesn't run a server.** `browse` works on its own, but the server-as-app framing only makes sense when there are pages to serve.
- **For ad-hoc one-off launches.** Just type the URL into the browser. The pattern earns its complexity when the launch is repeated.

## Mental model for AI agents

When an AI is asked to create a GUI project with the starter pack, the expected sequence is:

1. Generate `<project>.html`, `<project>-main.as`, `<project>.json`.
2. Run `python3 asdoc-check.py --write` on any new `.as` files.
3. **Immediately** run `allspeak server.as -t edit,<project>` in the background.
4. Tell the user that the app has started and two tabs should have opened.

The user should feel that "the app started" — not that they have to assemble three pieces of infrastructure to see what was just built.
