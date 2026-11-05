# The clipboard

Two commands move text between a script and the system clipboard, and they are spelled the same way in both runtimes:

```as
clipboard copy `Order 42`
```
```as
clipboard paste into ClipboardText
```

`clipboard copy` works wherever the script runs. `clipboard paste into` works in the **Python runtime only**, because a browser may not read the clipboard — the browser flavour refuses it at compile time and says so, rather than compiling a statement that fails only on some browsers.

## `clipboard copy`

`clipboard copy` takes any value: a literal, a variable, or the content of an `input` element.

```as
variable Confirmation
put `Order 42 confirmed` into Confirmation
clipboard copy Confirmation
clipboard copy `Copied straight from a literal`
clipboard copy OrderField          ! an input element's content
```

In the **browser** this leaves the text on the clipboard with no permission prompt and no user gesture, so it works from a script that runs on page load and from inside an event handler. It is written with `document.execCommand('copy')` over a selected off-screen textarea rather than `navigator.clipboard.writeText`, and that is a measurement: in a page whose clipboards are denied outright, `writeText` rejects with `NotAllowedError: Write permission denied` while `execCommand('copy')` returns `true` and the text is on the system clipboard.

The browser flavour also accepts `copy` on its own — `copy Confirmation`, `copy OrderField` — which is how the command was spelled before the two runtimes shared a vocabulary. New scripts should use `clipboard copy`, which reads the same in both.

In the **Python runtime** the route depends on how the script is running:

- **Desktop, with a window open** — the Qt clipboard, synchronously, with no external program.
- **CLI, with no window** — the platform's own helper: `wl-copy` on Wayland, then `xclip`, then `xsel`; `pbcopy` on macOS; `clip` on Windows.
- **Neither** — a runtime error naming what is missing, not a copy that quietly went nowhere.

## `clipboard paste into`

```as
variable ClipboardText
clipboard paste into ClipboardText
print ClipboardText
```

The target must be a declared variable. The Python runtime reads the clipboard the same way it writes it (Qt when a window is open, the helper program when not), so on a desktop it is one synchronous statement and in a CLI it is a short-lived child process.

**Why the browser has no `clipboard paste`.** Reading the clipboard needs `navigator.clipboard.readText()`, which is gated on a permission and, in some browsers, on a real user gesture — Firefox allows it only inside a paste event. A page that loaded and ran `clipboard paste into X` would either be refused or would prompt, and the same script would behave differently in every browser. So the statement is refused in the browser flavour with a sentence that names the Python runtime, and a browser script that genuinely needs a paste should register a paste handler and read the text from the event.

## Two clipboards on Linux

Wayland and X11 each have their own clipboard, and a client on one does not necessarily see what a client on the other put there. A Qt application writes the Wayland clipboard; a helper like `xsel` writes the X11 one, which is what an XWayland client reads. Copying in one program and pasting in another can therefore come up empty even though both halves of the script worked. That is a property of the desktop, not of the command.
