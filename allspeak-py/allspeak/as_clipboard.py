"""The system clipboard, for `clipboard copy` and `clipboard paste into`.

**Two routes, and the host decides which.** The Python runtime is both a desktop app and a CLI, and
the clipboard is reached differently in each:

- **Desktop mode has a Qt application already running**, and `QGuiApplication.clipboard()` *is* the
  system clipboard — synchronously, with no permission and no user gesture. That is the route a
  script running under `use graphics` takes, and the one a `paste` needs: reading the clipboard is
  the half a browser cannot do, which is why the browser flavour has no `paste` (see
  `learn/reference/27-clipboard.md`).
- **A CLI script has no Qt application**, and creating one just to reach the clipboard would take
  over the process — Qt allows a single application object, so a script that copied something at
  line 1 and opened a window later would fail to open it. So the CLI route is the platform's own
  helper program (`wl-copy`/`wl-paste`, `xclip`, `xsel`, `pbcopy`/`pbpaste`, `clip`), which needs
  nothing from Qt and owns the selection after the script has finished.

**Nothing here creates a clipboard out of nothing.** On a headless machine with no display and no
helper installed, both directions raise `ClipboardUnavailable` with a sentence a script user can act
on, rather than reporting a copy that went nowhere. The offscreen Qt platform is the trap here: it
has a clipboard that round-trips *within the process*, so a check that only wrote and read it back
would pass while nothing was on the system clipboard at all.
"""

import os
import platform
import shutil
import subprocess


class ClipboardUnavailable(Exception):
    """No route to the system clipboard on this host."""


# The helper programs, best first, per platform. A tuple is the command; `copy` feeds it the text on
# stdin and `paste` reads stdout.
def _copy_commands():
    system = platform.system()
    if system == 'Darwin':
        return [('pbcopy',)]
    if system == 'Windows':
        return [('clip',)]
    commands = []
    if os.environ.get('WAYLAND_DISPLAY'):
        commands.append(('wl-copy',))
    commands.append(('xclip', '-selection', 'clipboard'))
    commands.append(('xsel', '-b', '-i'))
    return commands


def _paste_commands():
    system = platform.system()
    if system == 'Darwin':
        return [('pbpaste',)]
    if system == 'Windows':
        return [('powershell', '-NoProfile', '-Command', 'Get-Clipboard')]
    commands = []
    if os.environ.get('WAYLAND_DISPLAY'):
        commands.append(('wl-paste', '--no-newline'))
    commands.append(('xclip', '-selection', 'clipboard', '-o'))
    commands.append(('xsel', '-b', '-o'))
    return commands


def _helper(commands):
    for command in commands:
        if shutil.which(command[0]):
            return command
    return None


def _qt_clipboard():
    """The running Qt application's clipboard, or None when there is no application.

    Deliberately *not* `QGuiApplication([])` as a fallback: see the module note. Imported here rather
    than at module scope so a CLI run pays nothing for a Qt it will not use.
    """
    try:
        from PySide6.QtGui import QGuiApplication
    except Exception:
        return None
    app = QGuiApplication.instance()
    return app.clipboard() if app is not None else None


def copy_text(text):
    """Put `text` on the system clipboard."""
    if text is None:
        text = ''
    clipboard = _qt_clipboard()
    if clipboard is not None:
        clipboard.setText(text)
        return
    command = _helper(_copy_commands())
    if command is None:
        raise ClipboardUnavailable(
            'there is no system clipboard to copy to: no desktop window is open and none of '
            'wl-copy, xclip, xsel, pbcopy or clip is installed')
    subprocess.run(list(command), input=text, text=True, check=True, timeout=10)


def paste_text():
    """Read the system clipboard as text."""
    clipboard = _qt_clipboard()
    if clipboard is not None:
        return clipboard.text()
    command = _helper(_paste_commands())
    if command is None:
        raise ClipboardUnavailable(
            'there is no system clipboard to paste from: no desktop window is open and none of '
            'wl-paste, xclip, xsel, pbpaste or Get-Clipboard is available')
    result = subprocess.run(list(command), capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise ClipboardUnavailable(
            f'"{command[0]}" could not read the clipboard'
            + (f': {result.stderr.strip()}' if result.stderr.strip() else ''))
    return result.stdout
