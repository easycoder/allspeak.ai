#!/usr/bin/env python3
"""clipboard-check.py — the Python half of `tools/clipboard-check.js`.

**Why this exists.** A clipboard command has no return value, so the only way to know it worked is to
read the text back — and reading it back *through the command under test* is the trap. `clipboard copy`
followed by `clipboard paste into` would agree with itself even if both halves wrote to the same
process-local buffer and the system clipboard was never touched, which is exactly what the Qt
`offscreen` platform does. So the middle of this check reads the clipboard with a **different
program** (`xsel`, `xclip`, `wl-paste`, `pbpaste`), and the skip is said out loud when none of them
exists rather than being counted as a pass.

The rest of the file is the two failures a copy command has: a paste into something that is not a
declared variable, and a copy on a host with no clipboard at all. Both must be a sentence, not a
traceback — the second one is what a headless CI run sees.

Usage:  python3 tools/clipboard-check.py
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if not (ROOT / 'allspeak-py' / 'allspeak').exists():
	sys.stderr.write('clipboard-check: no allspeak-py beside this script. This check runs the Python'
		' runtime, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n')
	sys.exit(2)

# The checkout is what runs, not an installed older release — the trap `tools/attr-check.py` names.
BOOTSTRAP = 'import sys; from allspeak import Main; Main()'

failures = 0
skips = 0


def check(ok, text):
	global failures
	print(f'  {"OK" if ok else "FAIL"}  {text}')
	if not ok:
		failures += 1


def skip(text):
	global skips
	skips += 1
	print(f'  ..    {text}')


def run(source, env=None):
	"""Run a script through the checkout's CLI and hand back what it said."""
	with tempfile.TemporaryDirectory(prefix='clipboard-check-') as scratch:
		script = Path(scratch) / 'Fixture.allspeak'
		script.write_text(source, encoding='utf-8')
		full = dict(os.environ)
		full['PYTHONPATH'] = str(ROOT / 'allspeak-py')
		if env:
			full.update(env)
		return subprocess.run([sys.executable, '-c', BOOTSTRAP, str(script)],
			capture_output=True, text=True, timeout=120, env=full)


# The text carries an accent and an em dash: a clipboard that mangles UTF-8 is a real failure mode, and
# a plain ASCII fixture could not see it.
VALUE = 'Résumé — order 42 confirmed'

# `clipboard copy` then `clipboard paste into`, with the variable cleared in between so that a paste
# which quietly did nothing cannot pass on the value the copy started from.
round_trip = run('\n'.join([
	'variable ClipboardText',
	f'put `{VALUE}` into ClipboardText',
	'clipboard copy ClipboardText',
	'clear ClipboardText',
	'clipboard paste into ClipboardText',
	'print ClipboardText',
]) + '\n')
check(round_trip.returncode == 0, f'the round-trip script ran (exit {round_trip.returncode})')
check(VALUE in round_trip.stdout,
	f'the pasted value is the copied one, accents and all ({VALUE!r})')

# The same copy, read back by a *different* program. This is the claim the round trip above cannot make.
readers = [('xsel', ['xsel', '-b', '-o']), ('xclip', ['xclip', '-selection', 'clipboard', '-o']),
	('wl-paste', ['wl-paste', '--no-newline']), ('pbpaste', ['pbpaste'])]
reader = next(((name, command) for name, command in readers if shutil.which(name)), None)
if reader is None:
	skip('no xsel, xclip, wl-paste or pbpaste here, so the system clipboard itself was not read — the'
		' round trip above only proves the two halves agree')
else:
	copied = run(f'clipboard copy `{VALUE}`\n')
	seen = subprocess.run(reader[1], capture_output=True, text=True, timeout=30)
	check(copied.returncode == 0 and seen.stdout == VALUE,
		f'another program reads the copied text off the system clipboard ({reader[0]} saw'
		f' {seen.stdout!r})')

# A target that is not a variable: refused at compile time, with the symbol named.
not_a_variable = run('clipboard paste into Undeclared\n')
check('Symbol Undeclared is not a variable' in (not_a_variable.stdout + not_a_variable.stderr),
	'the failure names the symbol it cannot paste into')
check('Traceback' not in (not_a_variable.stdout + not_a_variable.stderr),
	'and it is a sentence rather than a traceback')

# No window, no helper: the copy must say so instead of succeeding quietly.
headless = run('clipboard copy `x`\n', env={'PATH': str(ROOT / 'tools' / 'no-such-path')})
said = headless.stdout + headless.stderr
check('no system clipboard' in said, 'a host with neither a window nor a helper says so')
check('Traceback' not in said, 'and that failure is a sentence too')

print(f'\nclipboard-check: {failures} failure(s), {skips} skipped')
sys.exit(1 if failures else 0)
