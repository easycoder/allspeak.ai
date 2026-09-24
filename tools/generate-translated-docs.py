#!/usr/bin/env python3
"""
Generate pack-aware Programmer's Reference docs for a target language.

Reads the English /resources/doc/en/*.json files and a target language pack
(e.g. allspeak-py/allspeak/languages/fr.json) and emits translated doc JSON
files where:

  - dict keys (the keywords shown in the list) are translated via the pack's
    `words` map
  - syntax and examples strings have literal words translated, with
    {placeholders}, [brackets], slash/alternatives, and ~markup~ preserved
  - descriptions are pulled from an optional overrides file per language
    (keyed by the English keyword) when available; otherwise the English
    description is used unchanged, with any ~l:target~ / ~m:target~ link
    targets translated via the words map so internal references resolve

Usage:
  tools/generate-translated-docs.py <lang>  [<lang> ...]

Override files live at tools/translations/<lang>/<package>.json with shape:
  {"commands": {"add": "Ajoute ...", ...}, "values": {...}, "conditions": {...}}
keyed by the ORIGINAL English keyword (not the translated one).

Produces files under /resources/doc/<lang>/ and /deploy/resources/doc/<lang>/.
"""
import json
import os
import sys
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN_DOC_DIR = os.path.join(REPO, 'resources', 'doc', 'en')
PACK_DIR = os.path.join(REPO, 'allspeak-py', 'allspeak', 'languages')

SUPPORTED_LANGS = ('fr', 'de')
OVERRIDES_ROOT = os.path.join(REPO, 'tools', 'translations')


def load_overrides(lang, package_basename):
    """Load per-entry description overrides for a package in a language.

    Returns {group: {english_key: translated_description}} or {} if none."""
    path = os.path.join(OVERRIDES_ROOT, lang, package_basename)
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_pack(lang):
    """Return the `words` map from the language pack."""
    path = os.path.join(PACK_DIR, f'{lang}.json')
    with open(path, 'r', encoding='utf-8') as f:
        pack = json.load(f)
    return pack.get('words', {})


def translate_token(tok, words):
    """Translate a single whitespace-separated token.

    Preserves placeholders, markup, backtick strings, numbers, variable
    names (anything that doesn't look like a lowercase English word).
    Recursively handles bracketed [optional] and slash/pipe alternatives.
    """
    if not tok:
        return tok
    # Backtick-quoted string literals — pass through
    if '`' in tok:
        return tok
    # Placeholder {name}
    if tok.startswith('{') and tok.endswith('}'):
        return tok
    # Markup ~l:X~, ~m:X~, etc. — translate the target so internal links resolve.
    # Shape: ~<kind>:<target>~ where <target> is typically a lowercase keyword.
    mm = re.match(r'^(~[a-z]+:)([^~]+)(~)(.*)$', tok)
    if mm:
        prefix, target, close, rest = mm.groups()
        translated_target = translate_token(target, words)
        return prefix + translated_target + close + (translate_token(rest, words) if rest else '')
    if tok.startswith('~') and tok.endswith('~'):
        return tok
    # Bracketed optional (complete) — recurse on the contents
    if tok.startswith('[') and tok.endswith(']') and len(tok) > 2:
        return '[' + translate_token(tok[1:-1], words) + ']'
    # Leading bracket only — multi-token bracketed span, e.g. "[else"
    if tok.startswith('[') and not tok.endswith(']') and len(tok) > 1:
        return '[' + translate_token(tok[1:], words)
    # Trailing bracket only — closing of a multi-token bracketed span
    if tok.endswith(']') and not tok.startswith('[') and len(tok) > 1:
        return translate_token(tok[:-1], words) + ']'
    # Punctuation-trailed word (e.g. "module.")
    m = re.match(r'^([A-Za-z_][A-Za-z_0-9-]*)([.,;:!?]+)$', tok)
    if m:
        return translate_token(m.group(1), words) + m.group(2)
    # Slash alternatives — e.g. "css/js", "array/object"
    if '/' in tok and not tok.startswith('/'):
        parts = tok.split('/')
        return '/'.join(translate_token(p, words) for p in parts)
    # Pipe alternatives (rare in docs)
    if '|' in tok:
        parts = tok.split('|')
        return '|'.join(translate_token(p, words) for p in parts)
    # Lowercase ASCII-looking word → try the words map
    if tok and tok[0].islower() and re.match(r'^[a-z][a-z0-9_-]*$', tok):
        if tok in words:
            forms = words[tok].split('|')
            if len(forms) == 1:
                return forms[0]
            # Show all accepted forms joined by '/' so the reference
            # tells the reader what tokens the parser will accept
            return '/'.join(forms)
    return tok


def translate_line(line, words):
    """Translate a single syntax/examples line (word-level)."""
    if not line:
        return line
    tokens = line.split(' ')
    return ' '.join(translate_token(t, words) for t in tokens)


def translate_multiline(value, words):
    """Translate a '%0a'-separated string."""
    if not value:
        return value
    return '%0a'.join(translate_line(line, words) for line in value.split('%0a'))


def translate_description(text, words):
    """Translate link targets inside an English description without rewriting prose.

    Matches ~l:target~ and ~m:target~ markup and runs the target through
    the words map so it points to the translated doc entry.
    """
    if not text:
        return text
    def repl(m):
        prefix, target, close = m.group(1), m.group(2), m.group(3)
        return prefix + translate_token(target, words) + close
    return re.sub(r'(~[a-z]+:)([^~]+)(~)', repl, text)


def translate_entry(entry, words, lang, override_desc=None):
    """Produce a translated entry from an en doc entry.

    `override_desc` — pre-translated description for this entry, or None.
    """
    # Markup-target translation applies to both override and English prose,
    # so agents can write markup with English targets and still get working links.
    source_desc = override_desc if override_desc is not None else entry.get('description', '')
    description = translate_description(source_desc, words)
    out = {
        'syntax': translate_multiline(entry.get('syntax', ''), words),
        'description': description,
        'examples': translate_multiline(entry.get('examples', ''), words),
        'versions': entry.get('versions', []),
    }
    # Preserve any extra fields unchanged
    for k, v in entry.items():
        if k not in out:
            out[k] = v
    return out


def translate_package(en_doc, words, lang, overrides):
    """Produce a translated package doc from an English one.

    `overrides` — {group: {english_key: translated_description}} for this package.
    """
    out = {}
    for group_name, entries in en_doc.items():
        if not isinstance(entries, dict):
            out[group_name] = entries
            continue
        group_overrides = overrides.get(group_name, {}) if isinstance(overrides, dict) else {}
        new_group = {}
        for key, entry in entries.items():
            # Key translation: map each word in a multi-word key
            new_key = translate_line(key, words)
            # Translate the entry body (using override for description if available)
            if isinstance(entry, dict):
                new_entry = translate_entry(entry, words, lang,
                                            override_desc=group_overrides.get(key))
            else:
                new_entry = entry
            # Handle collisions: if two English keys translate to the same
            # target form, keep the first and skip subsequent (logging).
            if new_key in new_group:
                # Merge: append extra syntax/examples under the existing key
                existing = new_group[new_key]
                if isinstance(existing, dict) and isinstance(new_entry, dict):
                    for field in ('syntax', 'examples'):
                        parts = []
                        if existing.get(field):
                            parts.append(existing[field])
                        if new_entry.get(field):
                            parts.append(new_entry[field])
                        existing[field] = '%0a'.join(parts)
                continue
            new_group[new_key] = new_entry
        out[group_name] = new_group
    return out


def main(argv):
    if len(argv) < 2:
        print('usage: generate-translated-docs.py <lang> [<lang> ...]')
        return 1
    targets = argv[1:]
    for lang in targets:
        if lang not in SUPPORTED_LANGS:
            print(f'  skipping {lang}: not in SUPPORTED_LANGS')
            continue
        print(f'=== {lang} ===')
        words = load_pack(lang)
        out_dirs = [
            os.path.join(REPO, 'resources', 'doc', lang),
            os.path.join(REPO, 'deploy', 'resources', 'doc', lang),
        ]
        for d in out_dirs:
            os.makedirs(d, exist_ok=True)
        en_files = sorted(f for f in os.listdir(EN_DOC_DIR) if f.endswith('.json'))
        for fn in en_files:
            with open(os.path.join(EN_DOC_DIR, fn), 'r', encoding='utf-8') as f:
                en_doc = json.load(f)
            overrides = load_overrides(lang, fn)
            translated = translate_package(en_doc, words, lang, overrides)
            body = json.dumps(translated, ensure_ascii=False)
            for d in out_dirs:
                out_path = os.path.join(d, fn)
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(body)
            # Summary
            group_counts = {g: len(translated[g]) for g in translated if isinstance(translated[g], dict)}
            print(f'  {fn}: {group_counts}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
