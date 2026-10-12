// AllSpeak Language Pack Loader
// Holds the active language pack and provides lookup methods.
// The compiler uses these methods instead of hardcoded English words.

// eslint-disable-next-line no-unused-vars
const AllSpeak_Language = {

	pack: null,

	// Reverse lookup: keyword string → [{opcode, domain}]
	_keywordIndex: null,

	init: function(packData) {
		this.pack = packData;
		this._buildKeywordIndex();
		this._reverseWords = null;
	},

	// Build reverse lookup: from each opcode's keyword, map back to opcode + domain
	_buildKeywordIndex: function() {
		this._keywordIndex = {};
		const opcodes = this.pack.opcodes;
		for (const opcode in opcodes) {
			const entry = opcodes[opcode];
			// keyword may be a pipe-separated list (e.g. DECLARE_ELEMENT)
			const keywords = entry.keyword.split(`|`);
			for (const kw of keywords) {
				if (!this._keywordIndex[kw]) {
					this._keywordIndex[kw] = [];
				}
				this._keywordIndex[kw].push(opcode);
			}
		}
	},

	// Look up the language-specific word for a canonical connector
	// e.g. connector('into') → 'into' (English) or 'dans' (French)
	connector: function(canonical) {
		if (!this.pack || !this.pack.connectors) return canonical;
		return this.pack.connectors[canonical] || canonical;
	},

	// Look up a canonical literal
	// e.g. literal('body') → 'body' (English) or 'corps' (French)
	literal: function(canonical) {
		if (!this.pack || !this.pack.literals) return canonical;
		return this.pack.literals[canonical] || canonical;
	},

	// Look up a canonical time unit
	timeUnit: function(canonical) {
		if (!this.pack || !this.pack.timeUnits) return canonical;
		return this.pack.timeUnits[canonical] || canonical;
	},

	// Look up a canonical condition keyword
	condition: function(canonical) {
		if (!this.pack || !this.pack.conditions) return canonical;
		return this.pack.conditions[canonical] || canonical;
	},

	// Look up a translatable word from the unified words map.
	// Returns the first (primary) form. For checking if a token matches,
	// use isWord() which checks all forms.
	word: function(canonical) {
		if (!this.pack || !this.pack.words) return canonical;
		const entry = this.pack.words[canonical] || canonical;
		// If pipe-separated (e.g. "il|lo|la|gli|le"), return the first form
		return entry.split(`|`)[0];
	},

	// Return all forms for a canonical word (for multi-form languages).
	// e.g. wordForms('the') → ['il', 'lo', 'la', 'gli', 'le'] in Italian
	wordForms: function(canonical) {
		if (!this.pack || !this.pack.words) return [canonical];
		const entry = this.pack.words[canonical] || canonical;
		return entry.split(`|`);
	},

	// Check if a token matches any form of a canonical word.
	// e.g. matchesWord('gli', 'the') → true in Italian
	matchesWord: function(token, canonical) {
		return this.wordForms(canonical).indexOf(token) >= 0;
	},

	// Reverse lookup: given a word in the active language, return its canonical name.
	// Used by switch statements that need to match on canonical keywords.
	_reverseWords: null,

	// The most tokens any one word's form spans in the active pack (`right click` is two).
	// A caller wanting a multi-token form scans no further than this.
	_maxFormTokens: 1,

	_buildReverseWords: function() {
		this._reverseWords = {};
		this._maxFormTokens = 1;
		if (this.pack && this.pack.words) {
			for (const canonical in this.pack.words) {
				const forms = this.pack.words[canonical].split(`|`);
				for (const form of forms) {
					this._reverseWords[form] = canonical;
					const tokens = form.split(` `).length;
					if (tokens > this._maxFormTokens) {
						this._maxFormTokens = tokens;
					}
				}
			}
		}
	},

	reverseWord: function(token) {
		if (!this._reverseWords) {
			this._buildReverseWords();
		}
		return this._reverseWords[token] || token;
	},

	// Reverse lookup for a word whose form spans more than one token — English `right click`,
	// French `clic droit`, Italian `clic destro`, all forms of the one canonical `rightClick`.
	//
	// `reverseWord` reads a single token, so a form written as two words is unreachable through
	// it: the first token reverse-maps to nothing, or to a different canonical, and the statement
	// that wanted the word is refused. The words map already holds the whole form, so this reads
	// the longest one that matches at `index` and reports how many tokens it spans, leaving the
	// caller to move its own index. It returns null when no multi-token form starts there, which
	// is every word but these few.
	//
	// **The longest match wins**, so a one-token form that happens to be the first word of a
	// longer one cannot shadow it. Today no such pair exists in any pack; the rule is what keeps
	// the first one that arrives from being a silent surprise.
	phraseWord: function(tokens, index) {
		if (!this._reverseWords) {
			this._buildReverseWords();
		}
		const limit = Math.min(this._maxFormTokens, tokens.length - index);
		for (let n = limit; n >= 2; n--) {
			const parts = [];
			for (let i = 0; i < n; i++) {
				parts.push(tokens[index + i].token);
			}
			const phrase = parts.join(` `);
			if (this._reverseWords[phrase] !== undefined) {
				return { canonical: this._reverseWords[phrase], tokens: n };
			}
		}
		return null;
	},

	// Get a localized diagnostic message with placeholder substitution.
	// e.g. diagnostic('unknownCommand', {token: 'xyz', line: 5})
	//
	// **The fallback is the English pack, not a table copied into this function.** It used to be a copy of the
	// seven keys English carries, which meant every English message lived in two places that nothing kept in
	// step — and a *new* message was written twice, so the copy was the thing most likely to drift. Now the
	// English text has one home (`LanguagePack_en.js`), and a pack that is behind shows English rather than a
	// key name. `./sync-language-packs` refuses a pack that is behind, so the fallback is a safety net rather
	// than the normal path.
	diagnostic: function(key, params) {
		const mine = this.pack && this.pack.diagnostics;
		let msg = (mine && mine[key]) || null;
		if (!msg && typeof AllSpeak_LanguagePack_en !== `undefined` && AllSpeak_LanguagePack_en.diagnostics) {
			msg = AllSpeak_LanguagePack_en.diagnostics[key] || null;
		}
		if (!msg) msg = key;
		if (params) {
			for (const p in params) {
				msg = msg.replace(`{${p}}`, params[p]);
			}
		}
		return msg;
	},

	// Check if a token is a known keyword in the active language
	isKeyword: function(token) {
		return this._keywordIndex && token in this._keywordIndex;
	},

	// Get opcodes that start with a given keyword
	getOpcodesForKeyword: function(keyword) {
		if (!this._keywordIndex) return [];
		return this._keywordIndex[keyword] || [];
	}
};
