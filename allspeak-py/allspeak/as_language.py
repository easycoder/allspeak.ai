"""
AllSpeak Language Pack Loader (Python)

Loads a language pack JSON file and provides lookup methods
for translating between the active language and canonical English keywords.
Mirrors the JS Language.js module.
"""

import json
import os

# The English diagnostics, read once. **They live in the English pack and nowhere else** — see
# `Language.diagnostic`, whose fallback used to be a second copy of them inside the class. A module-level cache
# rather than a class attribute because it is a fact about the *files*, not about whichever pack is active.
_english_diagnostics = None


def _english():
    """The English pack's `diagnostics`, or an empty table when it cannot be read."""
    global _english_diagnostics
    if _english_diagnostics is None:
        _english_diagnostics = {}
        for lang_dir in (os.path.join(os.path.dirname(__file__), 'languages'),):
            path = os.path.join(lang_dir, 'en.json')
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    _english_diagnostics = json.load(f).get('diagnostics', {})
                break
            except (IOError, OSError, ValueError):
                continue
    return _english_diagnostics


class Language:

    def __init__(self):
        self.pack = None
        self._reverse_words = None
        self._canonicals = None
        self._keyword_index = None

    def init(self, pack_data):
        """Initialize with a language pack dictionary."""
        self.pack = pack_data
        self._reverse_words = None
        self._canonicals = None
        self._build_keyword_index()

    def load_file(self, path):
        """Load a language pack from a JSON file path."""
        with open(path, 'r', encoding='utf-8') as f:
            self.init(json.load(f))

    def _language_dirs(self):
        """Return the list of directories to search for language pack files."""
        return [
            os.path.join(os.path.dirname(__file__), 'languages'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'languages'),
            os.path.join('languages'),
        ]

    def load_by_name(self, name):
        """Load a language pack by name or language code (e.g. 'en', 'it', 'italiano').
        First tries a direct filename match, then scans all packs for a
        matching meta.label or meta.language (case-insensitive)."""
        # Try direct filename match first
        for lang_dir in self._language_dirs():
            path = os.path.join(lang_dir, f'{name}.json')
            if os.path.exists(path):
                self.load_file(path)
                return True
        # Scan language packs for a matching meta.label or meta.language
        lower_name = name.lower()
        for lang_dir in self._language_dirs():
            if not os.path.isdir(lang_dir):
                continue
            for filename in os.listdir(lang_dir):
                if not filename.endswith('.json'):
                    continue
                path = os.path.join(lang_dir, filename)
                with open(path, 'r', encoding='utf-8') as f:
                    pack = json.load(f)
                meta = pack.get('meta', {})
                if (meta.get('label', '').lower() == lower_name or
                        meta.get('language', '') == lower_name):
                    self.init(pack)
                    return True
        return False

    def _build_keyword_index(self):
        """Build reverse lookup: from each opcode's keyword, map back to opcode list."""
        self._keyword_index = {}
        if self.pack and 'opcodes' in self.pack:
            for opcode, entry in self.pack['opcodes'].items():
                for kw in entry['keyword'].split('|'):
                    if kw not in self._keyword_index:
                        self._keyword_index[kw] = []
                    self._keyword_index[kw].append(opcode)

    def _build_reverse_words(self):
        """Build reverse lookup: translated word -> canonical name."""
        self._reverse_words = {}
        if self.pack and 'words' in self.pack:
            for canonical, translated in self.pack['words'].items():
                # Support pipe-separated multi-forms (e.g. "il|lo|la|gli|le")
                for form in translated.split('|'):
                    self._reverse_words[form] = canonical

    def connector(self, canonical):
        """Look up a canonical connector word.
        e.g. connector('into') -> 'dans' (French)"""
        if not self.pack or 'connectors' not in self.pack:
            return canonical
        return self.pack['connectors'].get(canonical, canonical)

    def literal(self, canonical):
        """Look up a canonical literal.
        e.g. literal('body') -> 'corps' (French)"""
        if not self.pack or 'literals' not in self.pack:
            return canonical
        return self.pack['literals'].get(canonical, canonical)

    def time_unit(self, canonical):
        """Look up a canonical time unit.
        e.g. time_unit('seconds') -> 'secondi' (Italian)"""
        if not self.pack or 'timeUnits' not in self.pack:
            return canonical
        return self.pack['timeUnits'].get(canonical, canonical)

    def condition(self, canonical):
        """Look up a canonical condition keyword.
        e.g. condition('greater') -> 'maggiore' (Italian)"""
        if not self.pack or 'conditions' not in self.pack:
            return canonical
        return self.pack['conditions'].get(canonical, canonical)

    def word(self, canonical):
        """Look up the primary translated form of a canonical word.
        e.g. word('into') -> 'in' (Italian) or 'into' (English)"""
        if not self.pack or 'words' not in self.pack:
            return canonical
        entry = self.pack['words'].get(canonical, canonical)
        # Return first form if pipe-separated
        return entry.split('|')[0]

    def word_forms(self, canonical):
        """Return all translated forms for a canonical word.
        e.g. word_forms('the') -> ['il', 'lo', 'la', 'gli', 'le'] (Italian)"""
        if not self.pack or 'words' not in self.pack:
            return [canonical]
        entry = self.pack['words'].get(canonical, canonical)
        return entry.split('|')

    def matches_word(self, token, canonical):
        """Check if a token matches any form of a canonical word."""
        return token in self.word_forms(canonical)

    def reverse_word(self, token):
        """Reverse lookup: given a word in the active language, return its canonical name.
        e.g. reverse_word('dando') -> 'giving' (from Italian)

        **Many-to-one, and therefore lossy.** Where a language spells two English words the same — French
        `pas` is `not` and `step`, Italian `e` is `and` and `is` — this answers with one of them and the
        other becomes invisible. `canonicals_of` is what a caller wants when it needs a name the runtime
        can actually answer to.
        """
        if self._reverse_words is None:
            self._build_reverse_words()
        return self._reverse_words.get(token, token)

    def canonicals_of(self, token):
        """Every canonical word this token is a form of, not only the one a reverse lookup keeps.

        Nothing needs this to *read* a word — `reverse_word` answers that, and `matches_word` answers "is
        this token a form of X?". It exists for the few places that turn a word into a *name*: a condition
        type the runtime then looks a handler up by, where the lossy answer names a handler that does not
        exist. French `contient` is a form of `includes` and answers `contains`; there is no such
        condition, and the fallback in `compileCondition` asks this instead.
        """
        if self._canonicals is None:
            self._canonicals = {}
            for canonical, spelled in ((self.pack or {}).get('words') or {}).items():
                for form in str(spelled).split('|'):
                    self._canonicals.setdefault(form, []).append(canonical)
        return self._canonicals.get(token, [])

    def is_keyword(self, token):
        """Check if a token is a known keyword in the active language."""
        return self._keyword_index is not None and token in self._keyword_index

    def get_opcodes_for_keyword(self, keyword):
        """Get opcodes that start with a given keyword."""
        if not self._keyword_index:
            return []
        return self._keyword_index.get(keyword, [])

    def diagnostic(self, key, params=None):
        """Get a localized diagnostic message with placeholder substitution.

        **The fallback is the English pack, not a table copied into this function.** It used to be a copy of the
        seven keys English carries, which meant every English message lived in two places that nothing kept in
        step — and a *new* message was written twice, so the copy was the thing most likely to drift. Now the
        English text has one home (`LanguagePack_en.js`, mirrored to `languages/en.json` by
        `./sync-language-packs`, which refuses a pack that is behind), so the fallback is a safety net rather
        than the normal path. An unmatched key comes back as itself: loud, and not a silent English leak.
        """
        msg = None
        if self.pack and 'diagnostics' in self.pack:
            msg = self.pack['diagnostics'].get(key)
        if not msg:
            msg = _english().get(key) or key
        if params:
            for k, v in params.items():
                msg = msg.replace(f'{{{k}}}', str(v))
        return msg


# Global singleton instance
language = Language()
