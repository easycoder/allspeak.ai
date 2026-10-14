#!/usr/bin/env python3
"""Does the markdown panel keep the whole file when a stray tag is in it? Ask the panel, on the offscreen Qt.

**Why this exists.** `mdpanel` hands the file's text straight to Qt's markdown importer, and that importer
treats a tag it meets as an element: an element it has no format for contributes none of its text, and an
*unpaired* tag is never closed, so the loss runs to the end of the document. A `<person>` a writer left in a
conversation log emptied every paragraph below it. Nothing about that is visible in the source and nothing
about it is visible in the markdown — the file is intact and the render is not — so it has to be measured on
the panel itself, which is what this does.

**It asserts its own premise first.** Claim 1 is that Qt's *default* reading of these documents loses the
tail, because a fix that is only as good as a bug that may since have been fixed is worth saying out loud:
if Qt ever starts keeping that text, this check fails and the note beside `MARKDOWN_FEATURES` wants rereading.

    python3 tools/mdpanel-check.py [file.md ...]

A file named on the command line is read through the panel as well, and every `##` heading in it must reach
the render — the shape the fault was found in. It needs a checkout — it imports `allspeak-py/` rather than
whatever `allspeak-ai` happens to be installed, since the fix lives in the source tree until it is released —
so it says that plainly rather than failing on a missing path.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('mdpanel-check: no allspeak-py/allspeak beside this script. It imports the runtime, '
                     'so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

sys.path.insert(0, PACKAGE)
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')  # a panel renders without a screen

try:
    from PySide6.QtGui import QTextDocument
    from PySide6.QtWidgets import QApplication, QTextEdit
except ImportError as e:
    sys.stderr.write(f'mdpanel-check: PySide6 is needed to ask the panel anything ({e}).\n')
    sys.exit(2)

from allspeak.as_graphics import ECMDPanelWidget, MARKDOWN_FEATURES  # noqa: E402  — after the path is set

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def note(text):
    print('  ..    ' + text)


# The document the fault was found in, in miniature: a placeholder tag inside a list item, then sections
# that must survive it, then the same tag on its own line, then a bare `<br>` — the one tag a hand-written
# markdown file may carry without meaning anything by it.
DOC = """# A log

## 18:44

- **Posting / Reading** — "Show: Timeline of <person>" reads anyone's timeline, so one user reads another's.
- **Following** — aggregates you plus everyone you follow.

The paragraph after the list, which the tag used to take with it.

## 19:06

A second section, with **bold**, a `code span` and a [link](http://example.com).

## 19:21

Before a break<br>and after it.
"""

TAIL = ['The paragraph after the list', 'A second section', 'Before a break', 'and after it']


def render(md, widget=False, features=None):
    """The document's plain text, read either by Qt as it comes (widget=False) or by the panel as it reads."""
    if widget:
        panel = ECMDPanelWidget()
        panel.setMarkdown(md) if features is None else panel.setMarkdown(md, features)
        return panel.toPlainText(), panel
    d = QTextDocument()
    d.setMarkdown(md) if features is None else d.setMarkdown(md, features)
    return d.toPlainText(), d


def lost(text):
    return [m for m in TAIL if m not in text]


QApplication([])

# ---- 1. The premise: read as Qt reads by default, the tag eats the tail ------------------------------
print('Qt\'s own reading of the document, which is what a panel inheriting Qt\'s defaults would show')
raw, _ = render(DOC)
missing = lost(raw)
note(f'today it arrives as {len(raw)} character(s), {len(missing)} of the {len(TAIL)} probe phrase(s) missing')
for m in missing:
    note(f'missing: {m!r}')
check(len(missing) == len(TAIL),
      'the default reading loses every phrase after an unpaired tag — the fault this check is here for '
      '(if this line fails, Qt has changed and MARKDOWN_FEATURES wants rereading, not this check deleting)')

# ---- 2. The panel: the whole document, and the tag as text ------------------------------------------
print()
print('the panel\'s own reading, which is what a script or a viewer showing a file gets')
shown, panel = render(DOC, widget=True)
note(f'the panel renders {len(shown)} character(s)')
check(not lost(shown), 'every phrase after the tag reaches the render')
check('<person>' in shown and '<br>' in shown,
      'an unpaired tag arrives as the text it was written as rather than as an element')
check(panel.toMarkdown().count('person'), 'and the panel still holds the markdown it was given')

# ---- 3. Nothing is paid for it: the markdown itself is still markdown --------------------------------
print()
print('what the fix may not cost — the markdown around the tag')
doc = panel.document()
blocks, headings, lists = [], 0, 0
b = doc.begin()
while b.isValid():
    blocks.append(b.text())
    if b.blockFormat().headingLevel():
        headings += 1
    if b.textList():
        lists += 1
    b = b.next()
note(f'{len(blocks)} block(s), {headings} heading(s), {lists} list item(s) in the render')
check(headings >= 3, '`##` headings are still headings')
check(lists >= 2, 'list items are still list items')
check('**bold**' not in shown and 'bold' in shown, '`**bold**` is still bold rather than asterisks')
check('`code span`' not in shown and 'code span' in shown, 'a `code span` is still a code span')
check('http://example.com' in panel.toHtml(), 'a link is still a link')

# ---- 4. And the panel is the thing that carries the fix, so say that of the panel, not of a document --
print()
print('the panel itself')
FEATURES = type(MARKDOWN_FEATURES)
check(bool(MARKDOWN_FEATURES & FEATURES.MarkdownNoHTML), 'MARKDOWN_FEATURES carries MarkdownNoHTML')
check(bool(MARKDOWN_FEATURES & FEATURES.MarkdownDialectGitHub), 'and the GitHub dialect it was read in before')
struck, _ = render('~~struck~~ text', widget=True)
check('~~' not in struck and 'struck' in struck,
      'a dialect feature that is not HTML — strikethrough — still renders, so HTML is what was dropped, '
      'not the dialect')
check(ECMDPanelWidget.setMarkdown is not QTextEdit.setMarkdown,
      'the panel overrides Qt\'s own setMarkdown, so a call site that passes no features — which is every '
      'call site in the runtime — cannot miss them')

# ---- 5. A real file, if one was named: every `##` heading must reach the render ----------------------
def plain(text):
    """Markdown punctuation and link targets removed: the comparison is about the words that are shown."""
    text = re.sub(r'!?\[([^\]]*)\]\([^)]*\)', r'\1', text)   # a link shows its text, not its target
    for ch in '`*_~[]':
        text = text.replace(ch, '')
    return text.strip()


def lineText(line):
    """A line as a reader gets it: a block's own markdown markers (`##`, `-`, `1.`) are not words."""
    return plain(re.sub(r'^\s*(#+|[-*+]|\d+[.)]|>)\s*', '', line))


if len(sys.argv) > 1:
    print()
    for path in sys.argv[1:]:
        print(f'{path}')
        try:
            text = open(path, encoding='utf-8').read()
        except OSError as e:
            check(False, f'{path} could not be read: {e}')
            continue
        headings = [line.strip() for line in text.splitlines() if line.startswith('## ')]
        lines = [line for line in text.splitlines() if line.strip()]
        shown, _ = render(text, widget=True)
        gone = [h for h in headings if lineText(h) and lineText(h) not in plain(shown)]
        note(f'{len(text)} character(s), {len(headings)} section heading(s) in the file; '
             f'{len(shown)} character(s) in the render')
        for h in gone:
            note(f'heading missing from the render: {h!r}')
        check(not gone, f'{path}: every section heading reaches the render')
        # The fault ran to the end of the document, so the end of the document is where to look.
        last = lineText(lines[-1])[:60]
        check(last in plain(shown),
              f'{path}: the render reaches the file\'s last line ({last!r}), so nothing on the way was lost')

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
