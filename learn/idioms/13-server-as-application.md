# Server as application

## Problem

A typical AllSpeak GUI project produces two artefacts the user interacts with: the **visualizer** (`viz.html`) and one or more project pages (`<project>.html`). Treated as separate things, getting to them means starting a dev server in one terminal, opening one URL in one tab and another in a second tab, and remembering the port — four steps and three pieces of mental state for what is conceptually one running thing.

The simpler frame: **the server is the application, and the browser is its UI.**

## The pattern

**One command for a person; `server` for a session with several tabs.** `allspeak viz` is the front door:

```
allspeak viz
allspeak viz 9000
```

It asks the server's own `/version` route whether a dev server is already on that port. If one is, it opens the visualizer and leaves the running one alone; if nothing is there, it starts the server in this terminal and opens the visualizer once its request handler is registered. The port defaults to 8080.

`allspeak server {port}` is the same server with nothing opened, which is what you want when you mean to open several pages yourself:

```
allspeak server
```

A project's own page is then a URL — `http://localhost:<port>/<project>.html` — and in the visualizer it is the **Launch** button, which opens the page a script names with `@app` and, for a GUI project, records the run.

## Writing your own launcher

If a project wants a launcher of its own rather than the CLI's word, the shape is four ordered phases:

1. **Parse the CLI arguments.** Loop over `argc` / `arg N`, take the port, and note the pages you mean to open.
2. **Start the server.** `start MyServer on port Port` accepts the port but does not yet have a handler.
3. **Register the request handler.** `on MyServer request begin … end` sets the handler PC and jumps past the body.
4. **Open the pages.** Build each URL and call `browse` on it.

The ordering is load-bearing: phases 3 and 4 must be in that order. If `browse` runs before the handler block, the freshly-opened pages race the server and hit a 503 "Server handler not ready" before the handler is installed. The fix is to put the opening loop at the *end* of the script, after the `on … request begin … end` block.

```
    start Files on port Port

    on Files request
    begin
        ! ... handle requests ...
    end

    ! After the handler is registered — never before.
    if PageList is not empty
    begin
        split PageList on `,`
        put 0 into PageIndex
        while PageIndex is less than the elements of PageList
        begin
            index PageList to PageIndex
            put PageList into PageName
            if PageName is not empty
            begin
                put `http://localhost:` cat Port cat `/` cat PageName cat `.html` into PageUrl
                browse PageUrl
            end
            increment PageIndex
        end
    end
```

The reference implementation is `server.allspeak`, which does exactly this for the visualizer when the CLI hands it `--viz`.

## When the pattern earns its place

- **GUI projects**, where the user needs the visualizer and a project page — one command, and the page is a URL or the Launch button away.
- **CLI projects** where the user might also want the visualizer for browser-side editing. `allspeak viz` alone is enough; the server still serves the project files.
- **Multi-page apps**, where a launcher of your own opens two or three pages together.

## When it does not

- **For a deployed app.** Production users won't be running `server.allspeak`. This is for the development workflow only.
- **When the script runs no server.** `browse` works on its own, but the framing needs pages to serve.
- **For an ad-hoc launch.** Just type the URL into the browser. The pattern earns its complexity when the launch is repeated.

## Mental model for AI agents

When an AI is asked to create a GUI project with the starter pack, the expected sequence is:

1. Generate `<project>.html`, `<project>-main.allspeak`, `<project>.json`.
2. Run `python3 asdoc-check.py --write` on any new `.allspeak` files.
3. **Do not start the server yourself.** The user started it with `allspeak viz` before launching you and the visualizer is already open.
4. Tell the user their project page is at `http://localhost:8080/<project>.html`, beside the visualizer.

The user should feel that "the app started" — not that they have to assemble three pieces of infrastructure to see what was just built.
