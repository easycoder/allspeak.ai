// eslint-disable-next-line no-unused-vars
const AllSpeak_Compiler = {

	name: `AllSpeak_Compiler`,

	getTokens: function() {
		return this.tokens;
	},

	addWarning: function(message) {
		this.warnings.push(message);
	},

	warning: function(message) {
		this.addWarning(message);
	},

	unrecognisedSymbol: function(item) {
		this.addWarning(`Unrecognised symbol '${item}'`);
	},

	getWarnings: function() {
		return this.warnings;
	},

	getIndex: function() {
		return this.index;
	},

	next: function(step = 1) {
		this.index = this.index + step;
	},

	peek: function() {
		return this.tokens[this.index + 1].token;
	},

	more: function() {
		return this.index < this.tokens.length;
	},

	getToken: function() {
		if (this.index >= this.tokens.length) {
			return null;
		}
		const item = this.tokens[this.index];
		return item ? this.tokens[this.index].token : null;
	},

	nextToken: function() {
		this.next();
		return this.getToken();
	},

	tokenIs: function(token) {
		if (this.index >= this.tokens.length) {
			return false;
		}
		return token === this.tokens[this.index].token;
	},

	nextTokenIs: function(token) {
		this.next();
		return this.tokenIs(token);
	},

	// Language-aware token checks: look up canonical name in the active language pack.
	// Use these instead of tokenIs('into') etc. — write isWord('into') instead.
	// Supports multiple forms (e.g. isWord('the') matches 'il', 'lo', 'la', 'gli', 'le').
	isWord: function(canonical) {
		if (this.index >= this.tokens.length) {
			return false;
		}
		return AllSpeak_Language.matchesWord(this.tokens[this.index].token, canonical);
	},

	nextIsWord: function(canonical) {
		this.next();
		return this.isWord(canonical);
	},

	skipWord: function(canonical) {
		if (this.index >= this.tokens.length) {
			return null;
		}
		this.next();
		if (this.isWord(canonical)) {
			this.next();
		}
	},

	skip: function(token) {
		if (this.index >= this.tokens.length) {
			return null;
		}
		this.next();
		if (this.tokenIs(token)) {
			this.next();
		}
	},

	prev: function() {
		this.index--;
	},

	getLino: function() {
		if (this.index >= this.tokens.length) {
			return 0;
		}
		return this.tokens[this.index].lino;
	},

	getTarget: function(index = this.index) {
		return this.tokens[index].token;
	},

	getTargetPc: function(index = this.index) {
		return this.symbols[this.getTarget(index)].pc;
	},

	getCommandAt: function(pc) {
		return this.program[pc];
	},

	isSymbol: function(required = false) {
		const isSymbol = this.getTarget() in this.symbols;
		if (isSymbol) return true;
		if (required) {
			throw new Error(`Unknown symbol: '${this.getTarget()}'`);
		}
		return false;
	},

	nextIsSymbol: function(required = false) {
		this.next();
		return this.isSymbol(required);
	},

	getSymbol: function(required = false) {
		if (this.isSymbol(required)) {
			return this.symbols[this.getToken()];
		}
	},

	getSymbolPc: function(required = false) {
		return this.getSymbol(required).pc;
	},

	getSymbolRecord: function() {
		const record = this.program[this.getSymbolPc(true)];
		record.used = true;
		return record;
	},

	getSymbols: function() {
		return this.symbols;
	},

	getProgram: function() {
		return this.program;
	},

	getPc: function() {
		return this.program.length;
	},

	getValue: function() {
		return this.value.compile(this);
	},

	getNextValue: function() {
		this.next();
		return this.getValue();
	},

	getCondition: function() {
		return this.condition.compile(this);
	},

	constant: function(content, numeric = false) {
		return this.value.constant(content, numeric);
	},

	addCommand: function(item) {
		item.pc = this.program.length;
		// Stamp the canonical opcode
		const opcode = AllSpeak_Opcodes.resolve(item);
		if (opcode) {
			item.opcode = opcode;
		}
		this.program.push(item);
	},

	addSymbol: function(name, pc) {
		this.symbols[name] = {
			pc
		};
	},

	rewindTo: function(index) {
		this.index = index;
	},

	rewindto: function(index) {
		this.rewindTo(index);
	},

	completeHandler: function() {
		const lino = this.getLino();
		// Add a 'goto' to skip the action
		const goto = this.getPc();
		this.addCommand({
			domain: `core`,
			keyword: `goto`,
			lino,
			goto: 0
		});
		// Add the action
		this.compileOne();
		// If `continue` is set
		if (this.continue) {
			this.addCommand({
				domain: `core`,
				keyword: `goto`,
				lino,
				goto: this.getPc() + 1
			});
			this.continue = false;
		}
		// else add a 'stop'
		else {
			this.addCommand({
				domain: `core`,
				keyword: `stop`,
				lino,
				next: 0
			});
		} 
		// Fixup the 'goto'
		this.getCommandAt(goto).goto = this.getPc();
		return true;
	},

	compileVariable: function(domain, keyword, isVHolder = false, extra = null) {
		this.next();
		const lino = this.getLino();
		const item = this.getTokens()[this.getIndex()];
		if (this.symbols[item.token]) {
			throw new Error(`Duplicate variable name '${item.token}'`);
		}
		const pc = this.getPc();
		this.next();
		this.addSymbol(item.token, pc);
		const command = {
			domain,
			keyword,
			lino,
			isSymbol: true,
			used: false,
			isVHolder,
			name: item.token,
			elements: 1,
			index: 0,
			value: [{}],
			element: [],
			extra
		};
		if (extra === `dom`) {
			command.element = [];
		}
		this.addCommand(command);
		return command;
	},

	compileToken: function() {
		// Try each domain in turn until one can handle the command
		const token = this.getToken();
		if (!token) {
			return;
		}
		// console.log(`Compile ${token}`);
		const mark = this.getIndex();
		for (const domainName of Object.keys(this.domain)) {
			// console.log(`Try domain ${domainName} for token ${token}`);
			const domain = this.domain[domainName];
			if (domain) {
				const handler = domain.getHandler(token);
				if (handler) {
					if (handler.compile(this)) {
						return;
					}
				}
			}
			this.rewindTo(mark);
		}
		AllSpeak.writeToDebugConsole(`No handler found`);
		const lino = this.getLino() + 1;
		if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) && !(token in this.symbols)) {
			throw new Error(AllSpeak_Language.diagnostic(`unknownCommand`, {token, line: lino}));
		}
		throw new Error(AllSpeak_Language.diagnostic(`unknownCommand`, {token: token + `...`, line: lino}));
	},

	compileOne: function() {
		const keyword = this.getToken();
		if (!keyword) {
			return;
		}
		// console.log(`Compile keyword '${keyword}'`);
		this.warnings = [];
		const pc = this.program.length;
		// First check for a label
		if (keyword.endsWith(`:`)) {
			// console.log(`Label: ${keyword}`);
			const name = keyword.substring(0, keyword.length - 1);
			if (this.symbols[name]) {
				throw new Error(`Duplicate symbol: '${name}'`);
			}
			this.symbols[name] = {
				pc
			};
			this.index++;
		} else {
			this.compileToken();
		}
	},

	compileFromHere: function(stopOn) {
		while (this.index < this.tokens.length) {
			const token = this.tokens[this.index];
			const keyword = token.token;
			if (keyword === AllSpeak_Language.word(`else`)) {
				return this.program;
			}
			this.compileOne();
			if (stopOn.indexOf(keyword) > -1) {
				break;
			}
		}
	},

	// Check for a language declaration at the start of the script.
	// Syntax: "language <name>" e.g. "language italiano" or "language english"
	// This must appear before any other code. It loads the named language pack
	// and resets compile handler caches.
	checkLanguageDirective: function() {
		if (this.index >= this.tokens.length) return;
		const token = this.tokens[this.index].token;
		// Accept 'language' in any already-loaded language, or the English word
		if (token === `language` || token === AllSpeak_Language.word(`language`)) {
			this.index++;
			if (this.index >= this.tokens.length) return;
			const langName = this.tokens[this.index].token;
			this.index++;
			// Look for a global language pack variable: AllSpeak_LanguagePack_<name>
			// Try direct match first (e.g. "it"), then scan loaded packs for a
			// matching meta.label (e.g. "italiano" → AllSpeak_LanguagePack_it)
			let pack = null;
			const directName = `AllSpeak_LanguagePack_${langName}`;
			if (typeof window !== `undefined`) {
				pack = window[directName] || null;
				if (!pack) {
					const lowerName = langName.toLowerCase();
					for (const key of Object.keys(window)) {
						if (key.startsWith(`AllSpeak_LanguagePack_`) && window[key] && window[key].meta) {
							const meta = window[key].meta;
							if ((meta.label || ``).toLowerCase() === lowerName ||
								(meta.language || ``) === lowerName) {
								pack = window[key];
								break;
							}
						}
					}
				}
			}
			if (pack) {
				AllSpeak_Language.init(pack);
				// Reset cached compile handler tables
				if (AllSpeak_Core._compileHandlers) AllSpeak_Core._compileHandlers = null;
				if (AllSpeak_Browser._compileHandlers) AllSpeak_Browser._compileHandlers = null;
				if (AllSpeak_Browser.elementHandlerMap) AllSpeak_Browser.elementHandlerMap = null;
				if (AllSpeak_REST._compileHandlers) AllSpeak_REST._compileHandlers = null;
				if (AllSpeak_MQTT._compileHandlers) AllSpeak_MQTT._compileHandlers = null;
			} else {
				this.addWarning(`Language pack '${langName}' not found (looked for ${packName})`);
			}
		}
	},

	compile: function(tokens) {
		this.tokens = tokens;
		this.index = 0;
		this.program = [];
		this.program.script = 0;
		this.program.symbols = {};
		this.symbols = this.program.symbols;
		this.warnings = [];
		this.checkLanguageDirective();
		this.compileFromHere([]);
		this.addCommand({
			domain: `core`,
			keyword: `exit`,
			lino: this.getLino(),
			next: 0
		});
		//    console.log('Symbols: ' + JSON.stringify(this.symbols, null, 2));
		for (const symbol in this.symbols) {
			const record = this.program[this.symbols[symbol].pc];
			if (record.isSymbol && !record.used && !record.exporter) {
				AllSpeak.writeToDebugConsole(`Symbol '${record.name}' has not been used.`);
			}
		}
		return this.program;
	}
};
