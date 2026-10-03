#!/usr/bin/env python3
"""attr-check.py — the Python half of `tools/attr-check.js`.

The two runtimes compile attributes to the same *thing* and say it in their own vocabulary: this one
records `variable`, `while` and `print` where the JS one records the opcodes `DECLARE_VARIABLE`, `WHILE`
and `LOG`. So the claims below are the claims the JS half makes, spelled in the words this runtime uses —
and the fixture is not written out twice. `tools/attr-check.js` compiles the same two sources from the
same text and hands them over as paths, so there is one copy of the fixture and no chance of the two
halves drifting apart about what they are looking at.

Usage:  python3 tools/attr-check.py <attributed.allspeak> <plain.allspeak>

Run it through `node tools/attr-check.js`, which is the front door: it runs this and folds the failures
into its own count, as `tools/guard-check.js` does for the two record hosts.
"""
import io
import os
import re
import sys
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if not (ROOT / 'allspeak-py' / 'allspeak').exists():
	sys.stderr.write('attr-check: no allspeak-py beside this script. This check compiles the runtime'
		' itself, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n')
	sys.exit(2)
# Before the import, so the checkout is what is compiled rather than an installed copy of an
# older release — the trap this file is most likely to fall into on the machine that has both.
sys.path.insert(0, str(ROOT / 'allspeak-py'))

from allspeak import Program                                   # noqa: E402

failures = 0
def check(ok, text):
	global failures
	print(f'  {"OK" if ok else "FAIL"}  {text}')
	if not ok:
		failures += 1

def note(text):
	print(f'  ..    {text}')

# `log` prints `HH:MM:SS.fraction:name:lino->value`, so the value is what follows the arrow.
LOG_TAIL = re.compile(r'->(.*)$')

def run(path):
	"""Compile and run one fixture, and hand back the program and what it printed."""
	source = Path(path).read_text(encoding='utf-8')
	out = io.StringIO()
	with redirect_stdout(out):
		program = Program(path, testMode=True, source=source, name=os.path.basename(path))
		program.start()
	printed = [m.group(1) for m in (LOG_TAIL.search(line) for line in out.getvalue().splitlines()) if m]
	return program, printed

def carrying(program):
	"""The entries that hold an attribute, in program order, as `lino:keyword=attr`."""
	return [f'{c.get("lino")}:{c.get("keyword")}={c["attr"]}'
		for c in program.code if isinstance(c.get('attr'), str)]

def outline(program):
	"""Every entry except the attribute-only ones, as `lino:keyword`."""
	return ' '.join(f'{c.get("lino")}:{c.get("keyword")}'
		for c in program.code if c.get('keyword') != 'attr')

def label_pc(program, name):
	"""The pc a label addresses. This runtime keeps the colon in the symbol name; JS strips it."""
	for key in (name, name + ':'):
		if key in program.symbols:
			return program.symbols[key]
	return None

def main():
	argv = sys.argv[1:]
	if len(argv) != 2:
		sys.stderr.write('Usage: python3 tools/attr-check.py <attributed.allspeak> <plain.allspeak>\n')
		return 2
	attributed, printed = run(argv[0])
	plain, plain_printed = run(argv[1])

	# ---- what the tokeniser did with the `@` ----
	sigils = [t for t in attributed.script.tokens if t.token == '@']
	check(len(sigils) == 2 and [t.lino for t in sigils] == [0, 1],
		f'one `@` token per attribute-only line, and no more: {[(t.lino, t.attr) for t in sigils]}')
	strayed = [(t.lino, t.token, t.attr) for t in attributed.script.tokens
		if t.attr is not None and t.token != '@']
	check(strayed == [(3, 'variable', 'running total'), (6, 'Main:', 'the entry point, in full'),
		(8, 'while', 'show Total, N'), (14, 'log', 'show Total'),
		(17, 'Report:', 'where the total is reported')],
		f'every other attribute is on the first token of its own line: {strayed}')
	at_tokens = [t.token for t in attributed.script.tokens if '@' in t.token]
	check(at_tokens == ['@', '@', '`done @ last`'],
		f'an `@` inside a backtick literal stays in the token: {at_tokens}')
	check(not [t for t in attributed.script.tokens
		if t.token.endswith(('show', 'running', 'point', 'reported'))],
		'no attribute text is left in the token stream as a token')

	# ---- where the attributes landed ----
	with_attr = carrying(attributed)
	note('entries carrying an attribute:')
	for s in with_attr:
		print(f'          {s}')
	check(len(with_attr) == 7, f'seven entries carry one: {len(with_attr)}')
	check(len([c for c in attributed.code if c.get('keyword') == 'attr']) == 2,
		'two of them are entries of their own — the attribute-only lines; the two labels carry theirs'
		' on the label record, which is the entry a label has in this runtime')
	check(with_attr[0] == '0:attr=this file parses chemical weights',
		f'the first is an attribute-only line, as a marker: {with_attr[0]}')
	check(with_attr[1] == '1:attr=the `@` sigil is the whole statement',
		f'the second proves a second `@` is text and a `!` comment ends the run: {with_attr[1]}')
	check('3:variable=running total' in with_attr,
		"a statement's attribute is on the command the runtime arrives at for it")
	check('8:while=show Total, N' in with_attr,
		'including a `while`, whose condition parser never saw the `@`')
	check('14:print=show Total' in with_attr,
		'a trailing `!` comment is not part of the text')
	# This runtime gives a label a record of its own, so the attribute rides on the record the
	# label addresses rather than needing an entry made for it.
	main_pc, report_pc = label_pc(attributed, 'Main'), label_pc(attributed, 'Report')
	check(attributed.code[main_pc].get('attr') == 'the entry point, in full'
		and attributed.code[main_pc].get('domain') is None,
		"a label's attribute is at the pc the label addresses, so following the label finds it")
	check(attributed.code[report_pc].get('attr') == 'where the total is reported',
		'and the same for the second label')

	# ---- and nothing else followed it ----
	check(not [c for c in plain.code if 'attr' in c],
		'the attribute-free twin compiles with no attribute entry and no `attr` field anywhere')
	check(outline(attributed) == outline(plain),
		'the two compile to the same statements, on the same lines, in the same order')
	if outline(attributed) != outline(plain):
		note(f'attributed: {outline(attributed)}')
		note(f'plain:      {outline(plain)}')
	check(printed and printed == plain_printed,
		f'and they do the same thing when run: {printed}')
	if not printed:
		note('no output at all — the fixture, or the harness, is not running')
	# The attributed program starts at the marker — pc 0 is its own attribute-only line — so a
	# marker that did anything at all would be visible in that output.
	check(attributed.code[0].get('keyword') == 'attr' and attributed.code[0].get('domain') == 'core',
		f'the run began on the marker at pc 0 and reached the end: {attributed.code[0].get("keyword")}')

	print()
	print('ATTR-PY-OK: every check passed' if failures == 0
		else f'ATTR-PY-FAILED: {failures} check(s) failed')
	return 1 if failures else 0

if __name__ == '__main__':
	sys.exit(main())
