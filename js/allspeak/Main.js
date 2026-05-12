const AllSpeak = {

	name: `AllSpeak_Main`,

	domain: {
		core: AllSpeak_Core,
		browser: AllSpeak_Browser,
		json: AllSpeak_JSON,
		rest: AllSpeak_REST,
		mqtt: AllSpeak_MQTT
	},

	elementId: 0,
	attachWaitMs: 3000,
	timingEnabled: false,
	startupTraceCache: null,

	isStartupTraceEnabled: function () {
		if (this.startupTraceCache !== null) {
			return this.startupTraceCache;
		}
		let enabled = false;
		try {
			const params = new URLSearchParams(window.location.search);
			if (params.has(`allspeakStartupTrace`)) {
				const value = (params.get(`allspeakStartupTrace`) || ``).toLowerCase();
				enabled = value === `1` || value === `true`;
				this.startupTraceCache = enabled;
				return enabled;
			}
			const stored = window.localStorage ? window.localStorage.getItem(`allspeak.startupTrace`) : null;
			if (stored !== null) {
				const value = stored.toLowerCase();
				enabled = value === `1` || value === `true`;
			}
		} catch (err) {
			enabled = false;
		}
		this.startupTraceCache = enabled;
		return enabled;
	},

	writeStartupTrace: function (message) {
		if (this.isStartupTraceEnabled()) {
			this.writeToDebugConsole(message);
		}
	},

	getDebugConsoleElement: function () {
		const host = document.getElementById(`stuff`);
		let debugConsole = document.getElementById(`allspeak-debug-console`);
		if (host) {
			if (!debugConsole || debugConsole.parentElement !== host) {
				if (debugConsole && debugConsole.parentElement) {
					debugConsole.parentElement.removeChild(debugConsole);
				}
				debugConsole = document.createElement(`pre`);
				debugConsole.id = `allspeak-debug-console`;
				debugConsole.style.display = `none`;
				host.appendChild(debugConsole);
			}
			debugConsole.style.display = `none`;
			return debugConsole;
		}
		if (debugConsole) {
			debugConsole.style.display = `none`;
			return debugConsole;
		}
		if (!document.body) {
			return null;
		}
		debugConsole = document.createElement(`pre`);
		debugConsole.id = `allspeak-debug-console`;
		debugConsole.style.display = `none`;
		document.body.appendChild(debugConsole);
		return debugConsole;
	},

	writeToDebugConsole: function (message) {
		const params = new URLSearchParams(window.location.search);
		let usePageDebugConsole = params.get(`pageDebugConsole`) === `1`;
		if (!usePageDebugConsole) {
			try {
				const stored = window.localStorage ? window.localStorage.getItem(`allspeak.pageDebugConsole`) : null;
				usePageDebugConsole = stored === `1` || stored === `true`;
			} catch (err) {
				usePageDebugConsole = false;
			}
		}
		if (usePageDebugConsole) {
			const debugConsole = this.getDebugConsoleElement();
			if (debugConsole) {
				const prefix = debugConsole.textContent && debugConsole.textContent.length ? `\n` : ``;
				debugConsole.textContent += `${prefix}${message}`;
				debugConsole.scrollTop = debugConsole.scrollHeight;
				return;
			}
		}
		console.log(message);
	},

	runtimeError: function (lino, message) {
		this.lino = lino;
		if (this.program && this.program.onError) {
			this.program.errorMessage = message;
			this.program.run(this.program.onError);
			return;
		}
		this.reportError({
			message: `Line ${(lino >= 0) ? lino : ``}: ${message}`
		}, this.program);
		if (this.program) {
			this.program.aborted = true;
		}
	},
	nonNumericValueError: function (lino) {
		this.runtimeError(lino, `Non-numeric value`);
	},
	variableDoesNotHoldAValueError: function (lino, name) {
		this.runtimeError(lino, `Variable '${name}' does not hold a value`);
	},

	reportError: function (err, program, source) {
		if (!err.message) {
			AllSpeak.writeToDebugConsole(`An error occurred - origin was ${err.path[0]}`);
			return;
		}
		if (!this.compiling && !program) {
			const errString = `Error: ${err.message}`;
			alert(errString);
			AllSpeak.writeToDebugConsole(errString);
			return;
		}
		const {
			tokens,
			scriptLines
		} = source ? source : program.source;
		const compiler = AllSpeak_Compiler;
		const lino = this.compiling ? tokens[compiler.getIndex()].lino : program[program.pc].lino;
		var errString = this.compiling
			? `Compile error in '${compiler.script}'`
			: `Runtime error in '${program.script}'`;
		errString += `:\n`;
		var start = lino - 5;
		start = start < 0 ? 0 : start;
		for (var n = start; n < lino; n++) {
			const nn = (`` + (n + 1)).padStart(4, ` `);
			errString += nn + ` ` + scriptLines[n].line.split(`\\s`).join(` `) + `\n`;
		}
		errString += `${err.message}\n`;
		const warnings = compiler.getWarnings();
		if (warnings.length) {
			errString += `Warnings:\n`;
			for (const warning of warnings) {
				errString += `${warning}\n`;
			}
		}
		AllSpeak.writeToDebugConsole(errString);
		alert(errString);
	},

	getSymbolRecord: function (name) {
		const target = this[this.symbols[name].pc];
		if (target.alias) {
			return this.getSymbolRecord(target.alias);
		}
		if (target.exporter) {
			// if (target.exporter != this.script) {
			return AllSpeak.scripts[target.exporter].getSymbolRecord(target.exportedName);
			// }
		}
		return target;
	},

	verifySymbol: function (name) {
		return typeof this.symbols[name] !== `undefined`;
	},

	encode: function (value) {
		return AllSpeak_Value.encode(value, this.encoding);
	},

	decode: function (value) {
		return AllSpeak_Value.decode(value, this.encoding);
	},

	evaluate: function (value) {
		return AllSpeak_Value.evaluate(this, value);
	},

	getValue: function (value) {
		return AllSpeak_Value.getValue(this, value);
	},

	getFormattedValue: function (value) {
		const v = AllSpeak_Value.evaluate(this, value);
		if (v.numeric) {
			return v.content;
		}
		if (v.type === `boolean`) {
			return v.content ? `true` : `false`;
		}
		if (v.content === null || typeof v.content === `undefined`) {
			return ``;
		}
		if (typeof v.content === `object`) {
			try {
				return JSON.stringify(v.content, null, 2);
			} catch (err) {
				return String(v.content);
			}
		}
		if (this.isJsonString(v.content)) {
			try {
				const parsed = JSON.parse(v.content);
				return JSON.stringify(parsed, null, 2);
			} catch (err) {
				this.reportError(err);
				return `{}`;
			}
		}
		return v.content;
	},

	getSimpleValue: function (content) {
		if (content === true || content === false) {
			return {
				type: `boolean`,
				content
			};
		}
		return {
			type: `constant`,
			numeric: Number.isInteger(content),
			content
		};
	},

	run: function (pc) {
		if (typeof pc !== `undefined` && pc !== null) {
			this.program = this;
			AllSpeak_Run.run(this, pc);
		}
	},

	queueIntent: function (pc) {
		if (typeof pc === `undefined` || pc === null) {
			return;
		}
		if (this.tracing) {
			if (!this.intentQueue) {
				this.intentQueue = [];
			}
			if (!this.intentQueue.includes(pc)) {
				this.intentQueue.push(pc);
			}
			return;
		}
		this.run(pc);
	},

	exit: function () {
		AllSpeak_Run.exit(this);
	},

	register: (program) => {
		this.program = program;
	},

	require: function(type, src, cb) {
		let resolvedSrc = src[0] === `/`
			? `${window.location.origin}${src}`
			: src;
		if (AllSpeak.noCache) {
			const separator = resolvedSrc.includes(`?`) ? `&` : `?`;
			resolvedSrc += `${separator}_ec=${Date.now()}`;
		}
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = resolvedSrc;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = resolvedSrc;
			break;
		default:
			return;
		}
		element.onload = function () {
			AllSpeak.writeToDebugConsole(`${Date.now() - AllSpeak.timestamp} ms: Library ${resolvedSrc} loaded`);
			cb();
		};
		document.head.appendChild(element);
	},

	isUndefined: item => {
		return typeof item === `undefined`;
	},

	isJsonString: function (str) {
		if (typeof str !== `string` || str.length === 0) {
			return false;
		}
		if ([`{`, `[`].includes(str[0])) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
		return false;
	},

	runScript: function (program) {
		const command = program[program.pc];
		const script = program.getValue(command.script);
		const imports = command.imports;
		imports.caller = program.script;
		const moduleRecord = command.module ? program.getSymbolRecord(command.module) : null;
		try {
			AllSpeak.tokeniseAndCompile(script.split(`\n`), imports, moduleRecord, this.script, command.then);
		} catch (err) {
			AllSpeak.reportError(err, program, program.source);
			if (program.onError) {
				program.errorMessage = err.message || String(err);
				program.run(program.onError);
			} else {
				let parent = AllSpeak.scripts[program.parent];
				if (parent && parent.onError) {
					parent.errorMessage = err.message || String(err);
					parent.run(parent.onError);
				}
			}
			return;
		}
		if (command.nowait) {
			AllSpeak.run(program.nextPc);
		}
	},

	close: function () {},

	compileScript: function (source, imports, module, parent) {
		const {
			tokens
		} = source;
		this.compiling = true;
		const compiler = AllSpeak_Compiler;
		this.compiler = compiler;
		compiler.value = AllSpeak_Value;
		compiler.condition = AllSpeak_Condition;
		compiler.parent = parent;
		compiler.domain = this.domain;
		compiler.imports = imports;
		compiler.continue = false;
		const program = compiler.compile(tokens);
		//    console.log('Program: ' + JSON.stringify(program, null, 2));
		this.compiling = false;

		program.AllSpeak = this;
		program.value = AllSpeak_Value;
		program.condition = AllSpeak_Condition;
		program.compare = AllSpeak_Compare;
		program.source = source;
		program.run = this.run;
		program.queueIntent = this.queueIntent;
		program.exit = this.exit;
		program.runScript = this.runScript;
		program.evaluate = this.evaluate;
		program.getValue = this.getValue;
		program.getFormattedValue = this.getFormattedValue;
		program.getSimpleValue = this.getSimpleValue;
		program.encode = this.encode;
		program.decode = this.decode;
		program.domain = this.domain;
		program.require = this.require;
		program.isUndefined = this.isUndefined;
		program.isJsonString = this.isJsonString;
		program.getSymbolRecord = this.getSymbolRecord;
		program.verifySymbol = this.verifySymbol;
		program.runtimeError = this.runtimeError;
		program.nonNumericValueError = this.nonNumericValueError;
		program.variableDoesNotHoldAValueError = this.variableDoesNotHoldAValueError;
		program.reportError = this.reportError;
		program.register = this.register;
		program.symbols = compiler.getSymbols();
		program.unblocked = false;
		program.encoding = `ec`;
		program.popups = [];
		program.programStack = [];
		program.dataStack = [];
		program.queue = [0];
		program.module = module;
		program.parent = parent;
		if (module) {
			module.program = program.script;
		}
		return program;
	},

	tokeniseFile: function(file) {
		const scriptLines = [];
		const tokens = [];
		let index = 0;
		let token = ``;
		let literal = false;
		file.forEach(function (line, lino) {
			scriptLines.push({
				lino: lino + 1,
				line
			});
			const length = line.length;
			if (length === 0) {
				if (literal) {
					token += `\n`;
				}
				return;
			}
			// Find the first non-space
			let n = 0;
			while (n < length && line[n].trim().length === 0) {
				n++;
			}
			// The whole line may be whitespace
			if (n === length) {
				if (literal) {
					token += `\n`;
				}
				return;
			}
			// If in an unfinished literal, the first char must be a backtick to continue adding to it
			if (literal) {
				if (line[n] !== `\``) {
					if (token.length > 0) {
						tokens.push({
							index,
							lino: lino + 1,
							token
						});
						index++;
						token = ``;
						literal = false;
					}
				}
				n++;
			}
			for (; n < length; n++) {
				const c = line[n];
				if (!literal) {
					if (c.trim().length === 0) {
						if (token.length > 0) {
							tokens.push({
								index,
								lino: lino + 1,
								token
							});
							index++;
							token = ``;
						}
						continue;
					} else if (c === `!`) {
						break;
					}
				}
				if (c === `\``) {
					if (literal) {
						token += c;
						literal = false;
					} else {
						token += c;
						literal = true;
					}
				} else {
					token += c;
				}
			}
			if (token.length > 0 && !literal) {
				tokens.push({
					index,
					lino: lino + 1,
					token
				});
				index++;
				token = ``;
			}
		});
		return {scriptLines, tokens};
	},

	tokeniseAndCompile: function (file, imports, module, parent, then) {
		//  console.log('Tokenise script: ');
		let program = null;
		const startCompile = Date.now();
		const source = this.tokeniseFile(file);
		try {
			program = this.compileScript(source, imports, module, parent);
			if (!program.script) {
				program.script = AllSpeak.scriptIndex;
				AllSpeak.scriptIndex++;
			}
			const finishCompile = Date.now();
			AllSpeak.writeToDebugConsole(`${finishCompile - this.timestamp} ms: ` +
				`Compiled ${program.script}: ${source.scriptLines.length} lines (${source.tokens.length} tokens) in ` +
				`${finishCompile - startCompile} ms`);
		} catch (err) {
			if (err.message !== `stop`) {
				let parentRecord = AllSpeak.scripts[parent];
				this.reportError(err, parentRecord, source);
				if (parentRecord && parentRecord.onError) {
					parentRecord.errorMessage = err.message || String(err);
					parentRecord.run(parentRecord.onError);
				}
				// Remove this script
				if (AllSpeak_Compiler.script) {
					delete AllSpeak.scripts[AllSpeak_Compiler.script];
					delete AllSpeak_Compiler.script;
				}
			}
			return;
		}
		if (program) {
			AllSpeak.scripts[program.script] = program;
			if (module) {
				module.program = program.script;
			}
			program.afterExit = then;
			program.running = true;
			AllSpeak_Run.run(program, 0);
		}
	},

	start: function(source) {
		AllSpeak.restPath = `.`;
		AllSpeak.noCache = false;
		
		AllSpeak.scriptIndex = 0;
		const script = source.split(`\n`);
		AllSpeak.writeStartupTrace(`AllSpeak.start invoked (${script.length} source lines)`);
		if (!this.tokenising) {
			try {
				this.tokeniseAndCompile(script);
				AllSpeak.writeStartupTrace(`tokeniseAndCompile completed`);
			} catch (err) {
				this.reportError(err, null, source);
			}
			this.tokenising = true;
		}
	},
};
