// Synchronous SHA-256 over a UTF-8 string, returning a 64-char lowercase hex
// digest. Used by the `hash` value primitive to match Python's hashlib output.
const _AllSpeak_sha256 = (() => {
	const K = new Uint32Array([
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
		0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
		0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
		0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
		0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	]);
	const rotr = (x, n) => (x >>> n) | (x << (32 - n));
	return function sha256(input) {
		const utf8 = new TextEncoder().encode(String(input));
		const len = utf8.length;
		const bitLen = len * 8;
		const padLen = (((len + 9 + 63) >>> 6) << 6);
		const buf = new Uint8Array(padLen);
		buf.set(utf8);
		buf[len] = 0x80;
		const dv = new DataView(buf.buffer);
		dv.setUint32(padLen - 4, bitLen >>> 0, false);
		dv.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
		let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
		let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
		const w = new Uint32Array(64);
		for (let chunk = 0; chunk < padLen; chunk += 64) {
			for (let t = 0; t < 16; t++) w[t] = dv.getUint32(chunk + t * 4, false);
			for (let t = 16; t < 64; t++) {
				const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
				const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
				w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
			}
			let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
			for (let t = 0; t < 64; t++) {
				const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
				const ch = (e & f) ^ (~e & g);
				const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
				const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
				const maj = (a & b) ^ (a & c) ^ (b & c);
				const t2 = (S0 + maj) >>> 0;
				h = g; g = f; f = e; e = (d + t1) >>> 0;
				d = c; c = b; b = a; a = (t1 + t2) >>> 0;
			}
			h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0;
			h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
			h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0;
			h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
		}
		const hex = n => ('00000000' + (n >>> 0).toString(16)).slice(-8);
		return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
	};
})();

const AllSpeak_Core = {

	name: `AllSpeak_Core`,

	Add: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Get the (first) value
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.isWord(`to`)) {
				compiler.next();
				// Check if a value holder is next
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					const variable = compiler.getCommandAt(symbol.pc);
					if (variable.isVHolder) {
						if (compiler.peek() === AllSpeak_Language.word(`giving`)) {
							// This variable must be treated as a second value
							const value2 = compiler.getValue();
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `add`,
								lino,
								value1,
								value2,
								target
							});
						} else {
							// Here the variable is the target.
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `add`,
								lino,
								value1,
								target
							});
						}
						return true;
					}
					compiler.warning(`core 'add': Expected value holder`);
				} else {
					// Here we have 2 values so 'giving' must come next
					const value2 = compiler.getValue();
					if (compiler.isWord(`giving`)) {
						compiler.next();
						const target = compiler.getToken();
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `add`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					}
					compiler.warning(`core 'add'': Expected "giving"`);
				}
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value2) {
					const result = program.getValue(value2) +
						program.getValue(value1);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseInt(value.content) + parseInt(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Alias: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const alias = compiler.getToken();
				compiler.next();
				if (compiler.isWord(`to`)) {
					compiler.next();
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						symbolRecord.used = true;
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `alias`,
							lino,
							alias,
							symbol: symbolRecord.name
						});
						return true;
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const aliasPc = program.symbols[command.alias].pc;
			const aliasRecord = program[aliasPc];
			const symbolRecord = program.getSymbolRecord(command.symbol);
			program[aliasPc] = {
				pc: aliasRecord.pc,
				domain: symbolRecord.domain,
				keyword: symbolRecord.keyword,
				lino: aliasRecord.lino,
				name: aliasRecord.name,
				alias: command.symbol
			};
			return command.pc + 1;
		}
	},

	Append: {

		compile: compiler => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			if (compiler.isWord(`to`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.isVHolder) {
						compiler.next();
						const pc = compiler.getPc();
						compiler.addCommand({
							domain: `core`,
							keyword: `append`,
							lino,
							value,
							select: symbolRecord.name,
							onError: 0
						});
						if (compiler.consumeFailureClause()) {
							compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
							compiler.completeHandler();
						}
						return true;
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const array = program.getSymbolRecord(command.select);
			try {
				const v = program.getValue(command.value);
				const value = [`{`, `[`].includes(v[0]) ? JSON.parse(v) : v;
				const item = array.value[array.index];
				let a = item.content;
				if (a) {
					a = JSON.parse(a);
				} else {
					a = [];
				}
				a.push(value);
				item.content = JSON.stringify(a);
				return command.pc + 1;
			} catch (err) {
				if (command.onError) {
					program.errorMessage = `JSON: Unable to parse value`;
					program.run(command.onError);
					return 0;
				}
				program.runtimeError(command.lino, `JSON: Unable to parse value`);
				return false;
			}
		}
	},

	Begin: {

		compile: compiler => {
			compiler.next();
			compiler.compileFromHere([AllSpeak_Language.word(`end`)]);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Callback: {

		compile: compiler => {
			compiler.compileVariable(`core`, `callback`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Clear: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.isVHolder) {
					const symbol = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `clear`,
						lino,
						symbol
					});
					return true;
				}
				compiler.warning(`'Variable '${symbolRecord.name}' does not hold a value`);
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			if (symbol.isVHolder) {
				const handler = program.domain[symbol.domain];
				handler.value.put(symbol, {
					type: `boolean`,
					content: false
				});
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	Close: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const moduleRecord = compiler.getSymbolRecord();
				if (moduleRecord.keyword === `module`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `close`,
						lino,
						module: moduleRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const moduleRecord = program.getSymbolRecord(command.module);
			const p = AllSpeak.scripts[moduleRecord.program];
			p.run(p.onClose);
			return command.pc + 1;
		}
	},

	Continue: {

		compile: compiler => {
			compiler.next();
			compiler.continue = true;
			return true;
		}
	},

	Debug: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`program`)) {
				compiler.next();
				if ([`item`, `pc`].includes(compiler.getToken())) {
					const item = compiler.getNextValue();
					compiler.addCommand({
						domain: `core`,
						keyword: `debug`,
						lino,
						item
					});
					return true;
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `program`
				});
				return true;
			} else if (compiler.isWord(`symbols`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `symbols`
				});
				return true;
			} else if (compiler.isWord(`symbol`)) {
				const name = compiler.nextToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `symbol`,
					name
				});
				return true;
			} else {
				const item = compiler.getToken();
				if ([`step`, `stop`].includes(item)) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `debug`,
						lino,
						item
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const item = command.item;
			switch (item) {
			case `symbols`:
				AllSpeak.writeToDebugConsole(`Symbols: ${JSON.stringify(program.symbols, null, 2)}`);
				break;
			case `symbol`:
				const record = program.getSymbolRecord(command.name);
				const exporter = record.exporter.script;
				delete record.exporter;
				AllSpeak.writeToDebugConsole(`Symbol: ${JSON.stringify(record, null, 2)}`);
				record.exporter.script = exporter;
				break;
			case `step`:
				program.debugStep = true;
				break;
			case `stop`:
				program.debugStep = false;
				break;
			case `program`:
				AllSpeak.writeToDebugConsole(`Debug program: ${JSON.stringify(program, null, 2)}`);
				break;
			default:
				if (item.content >= 0) {
					AllSpeak.writeToDebugConsole(`Debug item ${item.content}: ${JSON.stringify(program[item.content], null, 2)}`);
				}
				break;
			}
			return command.pc + 1;
		}
	},

	Decode: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `decode`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.symbol);
			if (target.isVHolder) {
				const content = program.getValue(target.value[target.index]);
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content: program.decode(content)
				};
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Decrement: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `decrement`,
					lino,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (!value.numeric && isNaN(value.content)) {
					program.nonNumericValueError(command.lino);
				}
				target.value[target.index] = {
					type: `constant`,
					numeric: true,
					content: parseInt(value.content) - 1
				};
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Divide: {

		compile: compiler => {
			const lino = compiler.getLino();
			let target;
			if (compiler.nextIsSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.isWord(`by`)) {
				compiler.next();
			}
			// The next item is always a value
			const value2 = compiler.getValue();
			// If we now have 'giving' then the target follows
			if (compiler.isWord(`giving`)) {
				compiler.next();
				// Get the target
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					target = compiler.getCommandAt(symbol.pc).name;
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `divide`,
						lino,
						value1,
						value2,
						target
					});
					return true;
				}
				compiler.warning(`core 'divide'': Expected value holder`);
			} else {
				// Here we should already have the target.
				if (typeof target === `undefined`) {
					compiler.warning(`core 'divide': No target variable given`);
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `divide`,
					lino,
					value2,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value1) {
					const result = program.getValue(value1) / program.getValue(value2);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: Math.trunc(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseInt(value.content) / parseInt(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: Math.trunc(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Dummy: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `dummy`,
				lino
			});
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Encode: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `encode`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.symbol);
			if (target.isVHolder) {
				const content = program.getValue(target.value[target.index]);
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content: program.encode(content)
				};
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	End: {

		compile: compiler => {
			compiler.next();
			return true;
		},

		run: () => {
			return 0;
		}
	},

	Every: {
		compile: compiler => {
			const lino = compiler.getLino();
			const rate = compiler.getNextValue();
			const m = AllSpeak_Language.reverseWord(compiler.getToken());
			let multiplier = 1000;
			if ([`minute`, `minutes`, `second`, `seconds`, `tick`, `ticks`].includes(m)) {
					switch (m) {
						case `minute`:
						case `minutes`:
							multiplier = 60000;
							break;
						case `second`:
						case `seconds`:
							multiplier = 1000;
							break;
						case `tick`:
						case `ticks`:
							multiplier = 10;
							break;
					}
					compiler.next();
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `every`,
				lino,
				rate,
				multiplier
			});
			return compiler.completeHandler();
		},

		run: program => {
			const command = program[program.pc];
			const cb = command.pc + 2;
			const rate = program.getValue(command.rate) * command.multiplier;
			const theProgram = program;
			if (!theProgram.everyCallbacks) {
				theProgram.everyCallbacks = {};
			}
			theProgram.everyCallbacks[cb] = true;
			setInterval(function() {
				if (!theProgram.running || theProgram.tracing) {
					return;
				}
				theProgram.run(cb);
			}, rate);
			return command.pc + 1;
		}
	},

	Exit: {

		compile: compiler => {
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `exit`
			});
			return true;
		},

		run: program => {
			let parent = AllSpeak.scripts[program.parent];
			let unblocked = program.unblocked;
			program.exit();
			if (!unblocked && parent) {
				parent.run(parent.nextPc);
				parent.nextPc = 0;
			}
			return 0;
		}
	},

	Filter: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const arrayRecord = compiler.getSymbolRecord();
				if (compiler.nextIsWord(`with`)) {
					const func = compiler.nextToken();
					compiler.next();
					const pc = compiler.getPc();
					compiler.addCommand({
						domain: `core`,
						keyword: `filter`,
						lino,
						array: arrayRecord.name,
						func,
						onError: 0
					});
					if (compiler.consumeFailureClause()) {
						compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
						compiler.completeHandler();
					}
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const variable = program.getSymbolRecord(command.array);
			const value = variable.value[variable.index].content;
			const func = program.getSymbolRecord(command.func).pc;
			try {
				const array = JSON.parse(value);
				const savedRunningQueue = program.runningQueue;
				program.runningQueue = false;
				const result = array.filter(function (a) {
					variable.a = a;
					program.run(func);
					return variable.v;
				});
				program.runningQueue = savedRunningQueue;
				variable.value[variable.index].content = JSON.stringify(result);
			} catch (err) {
				if (command.onError) {
					program.errorMessage = `Can't parse this array`;
					program.run(command.onError);
					return 0;
				}
				program.runtimeError(command.lino, `Can't parse this array`);
			}
			return command.pc + 1;
		}
	},

	Fork: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.nextIsWord(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `fork`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			try {
				program.run(program.symbols[command.label].pc);
			} catch (err) {
				AllSpeak.writeToDebugConsole(err.message);
				alert(err.message);
			}
			return command.pc + 1;
		}
	},

	Go: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `go`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (command.label) {
				if (program.verifySymbol(command.label)) {
					const pc = program.symbols[command.label];
					if (pc) {
						return pc.pc;
					}
				}
				program.runtimeError(command.lino, `Unknown symbol '${command.label}'`);
				return 0;
			}
			return command.goto;
		}
	},

	Gosub: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `gosub`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (program.verifySymbol(command.label)) {
				program.programStack.push(program.pc + 1);
				return program.symbols[command.label].pc;
			}
			program.runtimeError(command.lino, `Unknown symbol '${command.label}'`);
			return 0;
		}
	},

	If: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const condition = compiler.condition.compile(compiler);
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `if`,
				lino,
				condition
			});
			// Get the 'then' code
			compiler.compileOne();
			if (!compiler.getToken()) {
				compiler.getCommandAt(pc).else = compiler.getPc();
				return true;
			}
			if (compiler.isWord(`else`)) {
				const goto = compiler.getPc();
				// Add a 'goto' to skip the 'else'
				compiler.addCommand({
					domain: `core`,
					keyword: `goto`,
					lino,
					goto: 0
				});
				// Fixup the link to the 'else' branch
				compiler.getCommandAt(pc).else = compiler.getPc();
				// Process the 'else' branch
				compiler.next();
				// Add the 'else' branch
				compiler.compileOne(true);
				// Fixup the 'goto'
				compiler.getCommandAt(goto).goto = compiler.getPc();
			} else {
				// We're at the next command
				compiler.getCommandAt(pc).else = compiler.getPc();
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const condition = command.condition;
			const test = program.condition.test(program, condition);
			if (test) {
				return command.pc + 1;
			}
			return command.else;
		}
	},

	Import: {

		compile: compiler => {
			const imports = compiler.imports;
			let caller = AllSpeak.scripts[imports.caller];
			const program = compiler.getProgram();
			if (imports.length) {
				for (const name of imports) {
					let symbolRecord = caller.getSymbolRecord(name);
					const thisType = compiler.nextToken();
					const exportedType = symbolRecord.keyword;
					if (thisType === exportedType) {
						const command = compiler.compileVariable(symbolRecord.domain, exportedType, true);
						const newRecord = program[compiler.getSymbols()[command.name].pc];
						newRecord.element = symbolRecord.element;
						newRecord.exporter = symbolRecord.exporter ? symbolRecord.exporter : caller.script;
						newRecord.exportedName = symbolRecord.name;
						newRecord.extra = symbolRecord.extra;
						newRecord.isVHolder = symbolRecord.isVHolder;
						if (symbolRecord.program) {
							newRecord.program = symbolRecord.program.script;
						}
						newRecord.imported = true;
						if (!compiler.isWord(`and`)) {
							break;
						}
					} else {
						throw new Error(`Mismatched import variable type for '${symbolRecord.name}'`);
					}
				}
				if (compiler.isWord(`and`)) {
					throw new Error(`Imports do not match exports`);
				}
			} else {
				compiler.next();
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			return command.pc + 1;
		}
	},

	Increment: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `increment`,
					lino,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (!value.numeric && isNaN(value.content)) {
					program.nonNumericValueError(command.lino);
				}
				target.value[target.index] = {
					type: `constant`,
					numeric: true,
					content: parseInt(value.content) + 1
				};
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Index: {

		compile: compiler => {
			const lino = compiler.getLino();
			// get the variable
			if (compiler.nextIsSymbol(true)) {
				const symbol = compiler.getToken();
				if (compiler.nextIsWord(`to`)) {
					// get the value
					const value = compiler.getNextValue();
					const pc = compiler.getPc();
					compiler.addCommand({
						domain: `core`,
						keyword: `index`,
						lino,
						symbol,
						value,
						onError: 0
					});
					if (compiler.consumeFailureClause()) {
						compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
						compiler.completeHandler();
					}
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const index = program.getValue(command.value);
			if (index >= symbol.elements) {
				const msg = `Array index ${index} is out of range for '${symbol.name}'`;
				if (command.onError) {
					program.errorMessage = msg;
					program.run(command.onError);
					return 0;
				}
				program.runtimeError(command.lino, msg);
			}
			symbol.index = index;
			if (symbol.imported) {
				const exporterRecord = AllSpeak.symbols[symbol.exporter].getSymbolRecord(symbol.exportedName);
				exporterRecord.index = index;
			}
			return command.pc + 1;
		}
	},

	Log: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `print`,
				lino,
				value,
				log: true
			});
			return true;
		}
	},

	Module: {

		compile: compiler => {
			compiler.compileVariable(`core`, `module`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Multiply: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			let target;
			if (compiler.isSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.isWord(`by`)) {
				compiler.next();
			}
			// The next item is always a value
			const value2 = compiler.getValue();
			// If we now have 'giving' then the target follows
			if (compiler.isWord(`giving`)) {
				compiler.next();
				// Get the target
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					target = compiler.getCommandAt(symbol.pc).name;
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `multiply`,
						lino,
						value1,
						value2,
						target
					});
					return true;
				}
				compiler.warning(`core multiply: Expected value holder`);
			} else {
				// Here we should already have the target.
				if (typeof target === `undefined`) {
					compiler.warning(`core multiply: No target variable given`);
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `multiply`,
					lino,
					value2,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value1) {
					const result = program.getValue(value1) *
						program.getValue(value2);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseInt(value.content) * parseInt(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Negate: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `negate`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			if (symbol.isVHolder) {
				symbol.value[symbol.index] = {
					type: `constant`,
					numeric: true,
					content: -symbol.value[symbol.index].content
				};
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	No: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`cache`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `no`,
					lino
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			AllSpeak.noCache = true;
			return command.pc + 1;
		}
	},

	On: {

		compile: compiler => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `close`:
			case `message`:
			case `error`:
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			}
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `callback`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `on`,
						lino,
						action: symbolRecord.name
					});
					return compiler.completeHandler();
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const cb = command.pc + 2;
			switch (command.action) {
			case `close`:
				program.onClose = cb;
				break;
			case `message`:
				program.onMessage = cb;
				break;
			case `error`:
				program.onError = cb;
				break;
			default:
				const callbacklRecord = program.getSymbolRecord(command.action);
				if (callbacklRecord) {
					callbacklRecord.cb = cb;
				} else {
					program.runtimeError(command.lino, `Unknown action '${command.action}'`);
					return 0;
				}
			}
			return command.pc + 1;
		}
	},

	Pop: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `pop`,
					lino,
					target
				});
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (!target.isVHolder) {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			const value = program.dataStack.pop();
			target.value[target.index] = value;
			if (target.imported) {
				const exporterRecord = AllSpeak.scripts[target.exporter].getSymbolRecord(target.exportedName);
				exporterRecord.value[exporterRecord.index] = value;
			}
			return command.pc + 1;
		}
	},

	Print: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `print`,
				lino,
				value
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const raw = program.getFormattedValue(command.value);
			const value = (raw === null || typeof raw === `undefined` || raw === ``) ? `<empty>` : raw;
			if (command.log) {
				const now = new Date();
				const hh = String(now.getHours()).padStart(2, `0`);
				const mm = String(now.getMinutes()).padStart(2, `0`);
				const ss = String(now.getSeconds()).padStart(2, `0`);
				const ms = String(now.getMilliseconds()).padStart(3, `0`);
				AllSpeak.writeToDebugConsole(`${hh}:${mm}:${ss}.${ms}:${program.script}:${command.lino}->${value}`);
			} else {
				AllSpeak.writeToDebugConsole(value);
			}
			return command.pc + 1;
		}
	},

	Push: {

		compile: compiler => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `push`,
				lino,
				value
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const value = program.getValue(command.value);
			program.dataStack.push({
				type: command.value.type,
				numeric: command.value.numeric,
				content: value
			});
			return command.pc + 1;
		}
	},

	Put: {

		compile: compiler => {
			const lino = compiler.getLino();
			// Get the value
			const value = compiler.getNextValue();
			if (compiler.isWord(`into`)) {
				if (compiler.nextIsSymbol()) {
					const target = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `put`,
						lino,
						value,
						target
					});
					return true;
				}
				compiler.warning(`core:put: No such variable: '${compiler.getToken()}'`);
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (!target.isVHolder) {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			const value = program.evaluate(command.value);
			// target.value[target.index] = value;
			target.value[target.index] = {
				type: value.type,
				numeric: value.numeric,
				content: value.content
			};
			if (target.imported) {
				const exporterRecord = AllSpeak.scripts[target.exporter].getSymbolRecord(target.exportedName);
				exporterRecord.value[exporterRecord.index] = value;
			}
			return command.pc + 1;
		}
	},

	Release: {

		compile: compiler => {
			if (compiler.nextTokenIs(`parent`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `set`,
					lino: compiler.getLino(),
					request: `setReady`
				});
				return true;
			}
			else {
				return false
			}
		}
	},


	Replace: {

		compile: compiler => {
			const lino = compiler.getLino();
			const original = compiler.getNextValue();
			if (compiler.isWord(`with`)) {
				const replacement = compiler.getNextValue();
				if (compiler.isWord(`in`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.isVHolder) {
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `replace`,
								lino,
								original,
								replacement,
								target: targetRecord.name
							});
							return true;
						} else {
							throw new Error(`'${targetRecord.name}' does not hold a value`);
						}
					}
				}
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const original = program.getValue(command.original);
			const replacement = program.getValue(command.replacement);
			const target = program.getSymbolRecord(command.target);
			const value = program.getValue(target.value[target.index]);
			let content = ``;
			try {
				content = value.split(original).join(replacement);
			// eslint-disable-next-line no-empty
			} catch (err) {}
			target.value[target.index] = {
				type: `constant`,
				numeric: false,
				content
			};
			return command.pc + 1;
		}
	},

	Require: {

		compile: compiler => {
			const lino = compiler.getLino();
			const type = compiler.nextToken();
			if ([`css`, `js`].includes(type)) {
				const url = compiler.getNextValue();
				compiler.addCommand({
					domain: `core`,
					keyword: `require`,
					lino,
					type,
					url
				});
				return true;
			}
			throw new Error(`File type must be 'css' or 'js'`);
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			program.require(command.type, program.getValue(command.url),
				function () {
					program.run(command.pc + 1);
				});
			return 0;
		}
	},

	Return: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `return`,
				lino
			});
			return true;
		},

		// runtime

		run: program => {
			return program.programStack.pop();
		}
	},

	Run: {

		compile: compiler => {
			const lino = compiler.getLino();
			const script = compiler.getNextValue();
			const imports = [];
			if (compiler.isWord(`with`)) {
				while (true) {
					if (compiler.nextIsSymbol(true)) {
						const symbolRecord = compiler.getSymbolRecord();
						imports.push(symbolRecord.name);
						compiler.next();
						if (!compiler.isWord(`and`)) {
							break;
						}
					}
				}
			}
			let module;
			if (compiler.isWord(`as`)) {
				if (compiler.nextIsSymbol(true)) {
					const moduleRecord = compiler.getSymbolRecord();
					// moduleRecord.program = program.script;
					compiler.next();
					if (moduleRecord.keyword !== `module`) {
						throw new Error(`'${moduleRecord.name}' is not a module`);
					}
					module = moduleRecord.name;
				}
			}
			let nowait = false;
			if (compiler.isWord(`nowait`)) {
				compiler.next();
				nowait = true;
			}
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `run`,
				lino,
				script,
				imports,
				module,
				nowait,
				then: 0
			});
			// Get the 'then' code, if any
			if (compiler.isWord(`then`)) {
				const goto = compiler.getPc();
				// Add a 'goto' to skip the 'then'
				compiler.addCommand({
					domain: `core`,
					keyword: `goto`,
					goto: 0
				});
				// Fixup the link to the 'then' branch
				compiler.getCommandAt(pc).then = compiler.getPc();
				// Process the 'then' branch
				compiler.next();
				compiler.compileOne(true);
				compiler.addCommand({
					domain: `core`,
					keyword: `stop`
				});
				// Fixup the 'goto'
				compiler.getCommandAt(goto).goto = compiler.getPc();
			}
			return true;
		},

		// runtime

		run: program => {
			program.nextPc = program.pc + 1;
			program.runScript(program);
			return 0;
		}
	},

	Sanitize: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const name = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `sanitize`,
					lino,
					name
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			const value = symbolRecord.value[symbolRecord.index];
			value.content = JSON.stringify(JSON.parse(value.content));
			return command.pc + 1;
		}
	},

	Script: {

		compile: compiler => {
			const program = compiler.getProgram();
			program.script = compiler.nextToken();
			compiler.script = program.script;
			if (AllSpeak.scripts[program.script]) {
				delete compiler.script;
				throw new Error(`Script '${program.script}' is already running.`);
			}
			AllSpeak.scripts[program.script] = program;
			compiler.next();
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Send: {

		compile: compiler => {
			const lino = compiler.getLino();
			let message = ``;
			if (!compiler.nextIsWord(`to`)) {
				message = compiler.getValue();
			}
			// Require an explicit `to <target>` clause. Previously a missing
			// `to` silently compiled to no command, which masked typos like
			// `send 'Hi` to parent` (mismatched quotes) — the line ran as
			// nothing and the recipient's reply never arrived.
			if (!compiler.isWord(`to`)) {
				return false;
			}
			let recipient;
			let replyVar = null;
			compiler.next();
			if ([`parent`, `sender`].includes(compiler.getToken())) {
				recipient = compiler.getToken();
				compiler.next();
			} else if (compiler.isSymbol()) {
				const moduleRecord = compiler.getSymbolRecord();
				if (moduleRecord.keyword !== `module`) {
					return false;
				}
				recipient = moduleRecord.name;
				compiler.next();
			} else {
				return false;
			}
			if (compiler.isWord(`and`)) {
				compiler.next();
				if (!compiler.isWord(`assign`)) return false;
				compiler.next();
				if (!compiler.isWord(`reply`)) return false;
				compiler.next();
				if (!compiler.isWord(`to`)) return false;
				if (!compiler.nextIsSymbol()) return false;
				replyVar = compiler.getSymbolRecord().name;
				compiler.next();
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `send`,
				lino,
				message,
				recipient,
				replyVar
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const message = program.getValue(command.message);
			let target = null;
			// Helper: deliver a reply to a parked sender that's awaiting one,
			// then resume it (queued onto its run-loop if still active, or
			// kicked off as a fresh run if it has already parked).
			const deliverReply = (sender, msg) => {
				sender.message = msg;
				const replyTarget = sender.getSymbolRecord(sender.replyVar);
				replyTarget.value[replyTarget.index] = {
					type: `constant`,
					numeric: false,
					content: msg
				};
				sender.replyVar = null;
				const resume = sender.replyResume;
				sender.replyResume = null;
				if (resume) {
					sender.run(resume);
				}
			};
			if (command.recipient === `parent`) {
				if (program.parent) {
					target = AllSpeak.scripts[program.parent];
				}
				if (target && target.replyVar) {
					deliverReply(target, message);
					return command.pc + 1;
				}
			} else if (command.recipient === `sender`) {
				if (program.sender) {
					target = AllSpeak.scripts[program.sender];
				}
				if (target && target.replyVar) {
					deliverReply(target, message);
					return command.pc + 1;
				}
			} else {
				const recipient = program.getSymbolRecord(command.recipient);
				if (recipient.program) {
					target = AllSpeak.scripts[recipient.program];
				}
			}
			if (command.replyVar) {
				if (!target || !target.onMessage) {
					program.runtimeError(command.lino, `Target '${command.recipient}' has no 'on message' handler`);
					return 0;
				}
				// Park the sender until the reply arrives. The intercept above
				// will clear replyVar and call program.run(replyResume) — which
				// queues onto our run-loop if the handler replies synchronously,
				// or starts a fresh run if it replies later (after wait/REST/etc).
				program.replyVar = command.replyVar;
				program.replyResume = command.pc + 1;
				target.sender = program.script;
				target.message = message;
				target.run(target.onMessage);
				return 0;
			}
			if (target && target.onMessage) {
				target.sender = program.script;
				target.message = message;
				target.run(target.onMessage);
			}
			return command.pc + 1;
		}
	},

	Set: {

		compile: compiler => {
			let name;
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (!targetRecord.isVHolder) {
					return false;
				}
				if (compiler.nextIsWord(`to`)) {
					const token = compiler.nextToken();
					if ([`array`, `object`].includes(AllSpeak_Language.reverseWord(token))) {
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `set`,
							lino,
							request: `setVarTo`,
							target: targetRecord.name,
							type: AllSpeak_Language.reverseWord(token)
						});
						return true;
					}
					const value = [compiler.getValue()];
					const mark = compiler.getIndex();
					try {
						value.push(compiler.getValue());
					} catch (err) {
						compiler.rewindTo(mark);
						compiler.addCommand({
							domain: `core`,
							keyword: `put`,
							lino,
							value: value[0],
							target: targetRecord.name
						});
						return true;
					}
					while (true) {
						const mark = compiler.getIndex();
						try {
							value.push(compiler.getValue());
						} catch (err) {
							compiler.rewindTo(mark);
							break;
						}
					}
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						lino,
						request: `setArray`,
						target: targetRecord.name,
						value
					});
					return true;
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `set`,
					lino,
					request: `setBoolean`,
					target: targetRecord.name
				});
				return true;
			}
			switch (AllSpeak_Language.reverseWord(compiler.getToken())) {
			case `ready`:
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `set`,
					lino,
					request: `setReady`
				});
				return true;
			case `element`:
				const index = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							if (compiler.nextIsWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									lino,
									request: `setElement`,
									target: targetRecord.name,
									index,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `property`:
				name = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							if (compiler.nextIsWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									lino,
									request: `setProperty`,
									target: targetRecord.name,
									name,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `arg`:
				name = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (compiler.nextIsWord(`to`)) {
							const value = compiler.getNextValue();
							compiler.addCommand({
								domain: `core`,
								keyword: `set`,
								lino,
								request: `setArg`,
								target: targetRecord.name,
								name,
								value
							});
							return true;
						}
					}
				}
			}
			if (compiler.isWord(`the`)) {
				compiler.next();
			}
			switch (AllSpeak_Language.reverseWord(compiler.getToken())) {
			case `elements`:
				compiler.next();
				if (compiler.isWord(`of`)) {
					compiler.next();
					if (!compiler.isSymbol()) {
						throw new Error(`Unknown variable '${compiler.getToken()}'`);
					}
					const symbol = compiler.getToken();
					compiler.next();
					if (compiler.isWord(`to`)) {
						compiler.next();
						// get the value
						const value = compiler.getValue();
						compiler.addCommand({
							domain: `core`,
							keyword: `set`,
							lino,
							request: `setElements`,
							symbol,
							value
						});
						return true;
					}
				}
				break;
			case `encoding`:
				if (compiler.nextIsWord(`to`)) {
					const encoding = compiler.getNextValue();
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						request: `encoding`,
						lino,
						encoding
					});
					return true;
				}
				compiler.addWarning(`Unknown encoding option`);
				break;
			case `payload`:
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const callbackRecord = compiler.getSymbolRecord();
						if (callbackRecord.keyword === `callback`) {
							if (compiler.nextIsWord(`to`)) {
								const payload = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									request: `setPayload`,
									lino,
									callback: callbackRecord.name,
									payload
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: program => {
			let targetRecord;
			const command = program[program.pc];
			switch (command.request) {
			case `setBoolean`:
				const target = program.getSymbolRecord(command.target);
				if (target.isVHolder) {
					target.value[target.index] = {
						type: `boolean`,
						content: true
					};
					command.numeric = false;
				} else {
					program.variableDoesNotHoldAValueError(command.lino, target.name);
				}
				break;
			case `setReady`:
				let parent = AllSpeak.scripts[program.parent];
				if (parent) {
					parent.run(parent.nextPc);
					parent.nextPc = 0;
					program.unblocked = true;
				}
				break;
			case `setArray`:
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.elements = command.value.length;
				targetRecord.value = command.value;
				break;
			case `encoding`:
				program.encoding = program.getValue(command.encoding);
				break;
			case `setElements`:
				const symbol = program.getSymbolRecord(command.symbol);
				const oldCount = symbol.elements;
				symbol.elements = program.getValue(command.value);
				if (symbol.elements > oldCount) {
					for (var n = oldCount; n < symbol.elements; n++) {
						symbol.value.push({});
						symbol.element.push(null);
					}
				} else {
					symbol.value = symbol.value.slice(0, symbol.elements);
					symbol.element = symbol.element.slice(0, symbol.elements);
				}
				if (symbol.index >= symbol.elements) {
					symbol.index = symbol.elements - 1;
				}
				break;
			case `setElement`:
				targetRecord = program.getSymbolRecord(command.target);
				const index = program.getValue(command.index);
				const elements = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
				let value = program.getValue(command.value);
				if (program.isJsonString(value)) {
					value = JSON.parse(value);
				}
				elements[index] = value;
				targetRecord.value[targetRecord.index].content = JSON.stringify(elements);
				break;
			case `setProperty`:
				// This is the name of the property
				const itemName = program.getValue(command.name);
				// This is the value of the property
				let itemValue = program.getValue(command.value);
				if (program.isJsonString(itemValue)) {
					itemValue = JSON.parse(itemValue);
				}
				targetRecord = program.getSymbolRecord(command.target);
				let targetValue = targetRecord.value[targetRecord.index];
				// Get the existing JSON
				if (!targetValue.numeric) {
					let content = targetValue.content;
					if (content === ``) {
						content = {};
					}
					else if (program.isJsonString(content)) {
						content = JSON.parse(content);
					}
					// Set the property
					content[itemName] = itemValue;
					// Put it back
					content = JSON.stringify(content);
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content
					};
				}
				break;
			case `setPayload`:
				program.getSymbolRecord(command.callback).payload = program.getValue(command.payload);
				break;
			case `setArg`:
				const name = program.getValue(command.name);
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord[name] = program.getValue(command.value);
				break;
			case `setVarTo`:
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: command.type === `array` ? `[]` : `{}`
				};
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	Sort: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const arrayRecord = compiler.getSymbolRecord();
				if (compiler.nextIsWord(`with`)) {
					const func = compiler.nextToken();
					compiler.next();
					const pc = compiler.getPc();
					compiler.addCommand({
						domain: `core`,
						keyword: `sort`,
						lino,
						array: arrayRecord.name,
						func,
						onError: 0
					});
					if (compiler.consumeFailureClause()) {
						compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
						compiler.completeHandler();
					}
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const variable = program.getSymbolRecord(command.array);
			const value = variable.value[variable.index].content;
			const func = program.getSymbolRecord(command.func).pc;
			try {
				const array = JSON.parse(value);
				const savedRunningQueue = program.runningQueue;
				program.runningQueue = false;
				array.sort(function (a, b) {
					variable.a = a;
					variable.b = b;
					program.run(func);
					return variable.v;
				});
				program.runningQueue = savedRunningQueue;
				variable.value[variable.index].content = JSON.stringify(array);
			} catch (err) {
				if (command.onError) {
					program.errorMessage = `Can't parse this array`;
					program.run(command.onError);
					return 0;
				}
				program.runtimeError(command.lino, `Can't parse this array`);
			}
			return command.pc + 1;
		}
	},

	Split: {

		compile: compiler => {
			const lino = compiler.getLino();
			var targetRecord = null;
			if (compiler.nextIsSymbol()) {
				targetRecord = compiler.getSymbolRecord();
			}
			item = compiler.getValue();
			let on = {
				type: `constant`,
				numeric: false,
				content: `\n`
			};
			if (compiler.isWord(`on`) || compiler.isWord(`by`)) {
				on = compiler.getNextValue();
			}
			if ([AllSpeak_Language.word(`giving`), AllSpeak_Language.word(`into`)].includes(compiler.getToken())) {
				if (compiler.nextIsSymbol()) {
					targetRecord = compiler.getSymbolRecord();
					compiler.next();
				} else {
					return false;
				}
			}
			if (targetRecord == null) {
				throw new Error(`No target variable given`);
			}
			if (targetRecord.keyword === `variable`) {
				compiler.addCommand({
					domain: `core`,
					keyword: `split`,
					lino,
					item,
					on,
					target: targetRecord.name
				});
				return true;
			}
			throw new Error(`'{targetRecord.name}' is not a variable`);
		},

		run: program => {
			let command = program[program.pc];
			let content = program.getValue(command.item);
			let on = program.getValue(command.on);
			content = content.split(on);
			let elements = content.length;
			targetRecord = program.getSymbolRecord(command.target);
			targetRecord.elements = elements;
			for (let n = 0; n < elements; n++) {
				targetRecord.value[n] = {
					type: `constant`,
					numeric: false,
					content: content[n]
				};
			}
			targetRecord.index = 0;
			return command.pc + 1;
		}
	},

	Stop: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.more() && compiler.isSymbol() && !compiler.getToken().endsWith(`:`)) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `module`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `stop`,
						lino,
						name: symbolRecord.name
					});
					return true;
				} else {
					return false;
				}
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `stop`,
				lino,
				next: 0
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (command.name) {
				const symbolRecord = program.getSymbolRecord(command.name);
				AllSpeak.scripts[symbolRecord.program].exit();
				symbolRecord.program = null;
			} else {
				return 0;
			}
			return command.pc + 1;
		}
	},

	Take: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Get the (first) value
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.isWord(`from`)) {
				compiler.next();
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					const variable = compiler.getCommandAt(symbol.pc);
					if (variable.isVHolder) {
						if (compiler.peek() === AllSpeak_Language.word(`giving`)) {
							// This variable must be treated as a second value
							const value2 = compiler.getValue();
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `take`,
								lino,
								value1,
								value2,
								target
							});
						} else {
							// Here the variable is the target.
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `take`,
								lino,
								value1,
								target
							});
						}
						return true;
					} else {
						compiler.warning(`core 'take'': Expected value holder`);
					}
				} else {
					// Here we have 2 values so 'giving' must come next
					const value2 = compiler.getValue();
					if (compiler.isWord(`giving`)) {
						compiler.next();
						const target = compiler.getToken();
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `take`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					} else {
						compiler.warning(`core 'take'': Expected "giving"`);
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value2) {
					const result = program.getValue(value2) -
						program.getValue(value1);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseInt(program.getValue(value)) - parseInt(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Test: {

		compile: compiler => {
			compiler.next();
			return true;
		},

		run: program => {
			AllSpeak.writeToDebugConsole(`Test`);
			return program[program.pc].pc + 1;
		}
	},

	Toggle: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbolPc = compiler.getSymbolPc();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `toggle`,
					lino,
					symbol: symbolPc
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program[command.symbol];
			if (symbol.isVHolder) {
				const handler = program.domain[symbol.domain];
				const content = handler.value.get(program, symbol.value[symbol.index]).content;
				handler.value.put(symbol, {
					type: `boolean`,
					content: !content
				});
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	Try: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Add the try command (handlerPC will be fixed up later)
			const tryPC = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `try`,
				lino,
				handlerPC: 0
			});
			// Compile the try body up to 'or'
			compiler.compileFromHere([AllSpeak_Language.word(`or`)]);
			// Expect 'handle' after 'or'
			if (!compiler.isWord(`handle`)) {
				throw new Error(`Expected 'handle' after 'or' in try block`);
			}
			compiler.next();
			// Add a goto to skip the handler on success
			const skipPC = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `goto`,
				lino,
				goto: 0
			});
			// Fix up the try command's handlerPC
			compiler.getCommandAt(tryPC).handlerPC = compiler.getPc();
			// Compile the handler body up to 'end'
			compiler.compileFromHere([AllSpeak_Language.word(`end`)]);
			// Add the endTry command
			const endPC = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `endTry`,
				lino
			});
			// Fix up the skip goto
			compiler.getCommandAt(skipPC).goto = endPC;
			return true;
		},

		run: program => {
			const command = program[program.pc];
			// Save current onError and set up the try handler
			if (!program.onErrorStack) {
				program.onErrorStack = [];
			}
			program.onErrorStack.push(program.onError);
			program.onError = command.handlerPC;
			return command.pc + 1;
		}
	},

	EndTry: {

		compile: compiler => {
			// This is compiled inline by Try, not as a standalone keyword
			return true;
		},

		run: program => {
			const command = program[program.pc];
			// Restore onError from the stack
			if (program.onErrorStack && program.onErrorStack.length > 0) {
				program.onError = program.onErrorStack.pop();
			} else {
				program.onError = 0;
			}
			return command.pc + 1;
		}
	},

	Variable: {

		compile: compiler => {
			compiler.compileVariable(`core`, `variable`, true);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Wait: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue(compiler);
			const scale = AllSpeak_Language.reverseWord(compiler.getToken());
			let multiplier = 1000;
			switch (scale) {
			case `milli`:
			case `millis`:
				compiler.next();
				multiplier = 1;
				break;
			case `tick`:
			case `ticks`:
				compiler.next();
				multiplier = 10;
				break;
			case `second`:
			case `seconds`:
				compiler.next();
				multiplier = 1000;
				break;
			case `minute`:
			case `minutes`:
				compiler.next();
				multiplier = 60000;
				break;
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `wait`,
				lino,
				value,
				multiplier
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const value = program.getValue(command.value);
			setTimeout(function () {
				if (program.run) {
					program.run(command.pc + 1);
				}
			}, value * command.multiplier);
			return 0;
		}
	},

	While: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Optional joiner word (e.g. French 'que' in 'tant que X'); the canonical
			// is 'that', which language packs can map to their natural form.
			if (compiler.isWord(`that`)) compiler.next();
			const condition = compiler.getCondition();
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `while`,
				lino,
				condition
			});
			// Skip when test fails
			const skip = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `goto`,
				goto: 0
			});
			// Do the body
			compiler.compileOne();
			// Repeat the test
			compiler.addCommand({
				domain: `core`,
				keyword: `goto`,
				goto: pc
			});
			// Fixup the 'goto' on completion
			compiler.getCommandAt(skip).goto = compiler.getPc();
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const condition = command.condition;
			const test = program.condition.test(program, condition);
			if (test) {
				return program.pc + 2;
			}
			return program.pc + 1;
		}
	},

	// Compile-time keyword → handler map, built from the language pack.
	_compileHandlers: null,

	_buildCompileHandlers: function() {
		const lang = AllSpeak_Language;
		// Map each opcode's language-specific keyword to its compile handler.
		// Multiple opcodes may share a keyword (e.g. all SET_* → Set handler).
		const opcodeToHandler = this.getOpcodeMap();
		const handlers = {};
		if (lang.pack) {
			const opcodes = lang.pack.opcodes;
			for (const opcode in opcodes) {
				const handler = opcodeToHandler[opcode];
				if (handler) {
					const keywords = opcodes[opcode].keyword.split(`|`);
					for (const kw of keywords) {
						if (!handlers[kw]) {
							handlers[kw] = handler;
						}
					}
				}
			}
		}
		// Add compile-only handlers not represented by runtime opcodes.
		// These compile to other commands or set compiler flags.
		handlers[lang.word(`begin`)] = this.Begin;
		handlers[lang.word(`end`)] = this.End;
		handlers[lang.word(`script`)] = this.Script;
		handlers[lang.word(`log`)] = this.Log;           // compiles to PRINT with log flag
		handlers[lang.word(`release`)] = this.Release;   // compiles to SET_READY
		handlers[lang.word(`continue`)] = this.Continue; // sets compiler flag
		handlers[lang.word(`no`)] = this.No;             // no cache directive
		handlers[lang.word(`test`)] = this.Test;
		handlers[lang.word(`goto`)] = this.Go;           // alias for go
		handlers[lang.word(`subtract`)] = this.Take;     // alias for take
		handlers[lang.word(`endTry`)] = this.EndTry;     // internal
		this._compileHandlers = handlers;
	},

	getHandler: function(name) {
		if (!this._compileHandlers) {
			this._buildCompileHandlers();
		}
		return this._compileHandlers[name] || false;
	},

	opcodeMap: null,

	getOpcodeMap: function() {
		if (this.opcodeMap) return this.opcodeMap;
		this.opcodeMap = {
			ADD: this.Add,
			SUBTRACT: this.Take,
			MULTIPLY: this.Multiply,
			DIVIDE: this.Divide,
			NEGATE: this.Negate,
			INCREMENT: this.Increment,
			DECREMENT: this.Decrement,
			PUT: this.Put,
			SET_VAR_TYPE: this.Set,
			SET_ARRAY: this.Set,
			SET_BOOLEAN: this.Set,
			SET_READY: this.Set,
			SET_ELEMENT_VALUE: this.Set,
			SET_PROPERTY: this.Set,
			SET_ARG: this.Set,
			SET_ELEMENTS: this.Set,
			SET_ENCODING: this.Set,
			SET_PAYLOAD: this.Set,
			APPEND: this.Append,
			PUSH: this.Push,
			POP: this.Pop,
			CLEAR: this.Clear,
			REPLACE: this.Replace,
			SORT: this.Sort,
			SPLIT: this.Split,
			FILTER: this.Filter,
			INDEX: this.Index,
			IF: this.If,
			WHILE: this.While,
			GOTO: this.Go,
			GOSUB: this.Gosub,
			RETURN: this.Return,
			FORK: this.Fork,
			EXIT: this.Exit,
			STOP: this.Stop,
			WAIT: this.Wait,
			EVERY: this.Every,
			TRY: this.Try,
			END_TRY: this.EndTry,
			CONTINUE: this.Continue,
			TOGGLE: this.Toggle,
			DECLARE_VARIABLE: this.Variable,
			DECLARE_MODULE: this.Module,
			DECLARE_SYMBOL: this.Variable,
			DECLARE_CALLBACK: this.Callback,
			DECLARE_ALIAS: this.Alias,
			ENCODE: this.Encode,
			DECODE: this.Decode,
			SANITIZE: this.Sanitize,
			PRINT: this.Print,
			LOG: this.Print,
			SEND_MESSAGE: this.Send,
			ON_CLOSE: this.On,
			ON_MESSAGE: this.On,
			ON_ERROR: this.On,
			ON_CALLBACK: this.On,
			DEBUG_PROGRAM: this.Debug,
			DEBUG_SYMBOLS: this.Debug,
			DEBUG_SYMBOL: this.Debug,
			DEBUG_STEP: this.Debug,
			DEBUG_STOP: this.Debug,
			RUN_MODULE: this.Run,
			REQUIRE: this.Require,
			IMPORT: this.Import,
			CLOSE_MODULE: this.Close,
			DUMMY: this.Dummy,
			NO_CACHE: this.No,
			TEST: this.Test,
			BEGIN: this.Begin,
			END: this.End,
			SCRIPT: this.Script
		};
		return this.opcodeMap;
	},

	run: program => {
		const command = program[program.pc];
		// Dispatch by opcode if available, fall back to keyword
		let handler;
		if (command.opcode) {
			handler = AllSpeak_Core.getOpcodeMap()[command.opcode];
		}
		if (!handler) {
			handler = AllSpeak_Core.getHandler(command.keyword);
		}
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown command '${command.opcode || command.keyword}' in 'core' package`);
		}
		return handler.run(program);
	},

	isNegate: (compiler) => {
		const token = compiler.getToken();
		if (token === AllSpeak_Language.word(`not`)) {
			compiler.next();
			return true;
		}
		return false;
	},

	value: {

		compile: compiler => {
			if (compiler.isSymbol()) {
				const name = compiler.getToken();
				const symbolRecord = compiler.getSymbolRecord();
				switch (symbolRecord.keyword) {
				case `module`:
					compiler.next();
					return {
						domain: `core`,
						type: `module`,
						name
					};
				case `variable`:
					const nextTok = compiler.nextToken();
					let type = AllSpeak_Language.reverseWord(nextTok);
					if (AllSpeak_Language.matchesWord(nextTok, `modulo`)) {
						type = `modulo`;
					} else if (AllSpeak_Language.matchesWord(nextTok, `format`)) {
						type = `format`;
					}
					if ([`format`, `modulo`].includes(type)) {
						const value = compiler.getNextValue();
						return {
							domain: `core`,
							type,
							name,
							value
						};
					}
					return {
						domain: `core`,
						type: `symbol`,
						name
					};
				}
				return null;
			}
			
			if (compiler.isWord(`the`)) {
				compiler.next();
			}

			var token = compiler.getToken();
			if (token === AllSpeak_Language.word(`true`)) {
				compiler.next();
				return {
					domain: `core`,
					type: `boolean`,
					content: true
				};
			}
			if (token === AllSpeak_Language.word(`false`)) {
				compiler.next();
				return {
					domain: `core`,
					type: `boolean`,
					content: false
				};
			}
			if (token === AllSpeak_Language.word(`random`)) {
				compiler.next();
				const range = compiler.getValue();
				return {
					domain: `core`,
					type: `random`,
					range
				};
			}
			if (token === AllSpeak_Language.word(`cos`)) {
				compiler.next();
				const angle_c = compiler.getValue();
				compiler.skipWord(`radius`);
				const radius_c = compiler.getValue();
				return {
					domain: `core`,
					type: `cos`,
					angle_c,
					radius_c
				};
			}
			if (token === AllSpeak_Language.word(`sin`)) {
				compiler.next();
				const angle_s = compiler.getValue();
				compiler.skipWord(`radius`);
				const radius_s = compiler.getValue();
				return {
					domain: `core`,
					type: `sin`,
					angle_s,
					radius_s
				};
			}
			if (token === AllSpeak_Language.word(`tan`)) {
				compiler.next();
				const angle_t = compiler.getValue();
				compiler.skipWord(`radius`);
				const radius_t = compiler.getValue();
				return {
					domain: `core`,
					type: `tan`,
					angle_t,
					radius_t
				};
			}
			if (token === AllSpeak_Language.word(`acos`)) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `acos`,
					dy,
					dx
				};
			}
			if (token === AllSpeak_Language.word(`asin`)) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `asin`,
					dy,
					dx
				};
			}
			if (token === AllSpeak_Language.word(`atan`)) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `atan`,
					dy,
					dx
				};
			}
			const canonicalToken = AllSpeak_Language.reverseWord(token);
			if ([`now`, `timestamp`, `today`, `newline`, `tab`, `backtick`, `break`, `empty`, `uuid`].includes(canonicalToken)) {
				compiler.next();
				return {
					domain: `core`,
					type: canonicalToken
				};
			}
			if (token === AllSpeak_Language.word(`date`)) {
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `date`,
					value
				};
			}
			const canonicalToken2 = AllSpeak_Language.reverseWord(token);
			if ([`encode`, `decode`, `lowercase`, `hash`, `reverse`, `trim`].includes(canonicalToken2)) {
				compiler.next();
				const value = compiler.getValue();
				return {
					domain: `core`,
					type: canonicalToken2,
					value
				};
			}
			if (token === AllSpeak_Language.word(`field`)) {
				const index = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					const value = compiler.getNextValue();
					if (compiler.isWord(`delimited`)) {
						if (compiler.nextIsWord(`by`)) {
							const delimiter = compiler.getNextValue();
							return {
								domain: `core`,
								type: `field`,
								index,
								value,
								delimiter
							};
						}
					}
				}
				return null;
			}
			if (token === AllSpeak_Language.word(`element`)) {
				const element = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `element`,
								element,
								symbol: symbolRecord.name
							};
						}
					}
				}
				return null;
			}
			if (token === AllSpeak_Language.word(`item`)) {
				const item = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `item`,
								item,
								symbol: symbolRecord.name
							};
						}
					}
				}
				return null;
			}
			if (token === AllSpeak_Language.word(`property`)) {
				const property = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `property`,
								property,
								symbol: symbolRecord.name
							};
						}
					}
				}
				return null;
			}
			if (token === AllSpeak_Language.word(`arg`)) {
				const value = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const target = compiler.getSymbolRecord();
						compiler.next();
						return {
							domain: `core`,
							type: `arg`,
							value,
							target: target.name
						};
					}
				}
			}
			if ([`character`, `char`].includes(token)) {
				let index = compiler.getNextValue();
				compiler.next();
				if (compiler.isWord(`of`)) {
					let value = compiler.getNextValue();
					return {
						domain: `core`,
						type: `char`,
						index,
						value
					};
				}
			}
			const type = AllSpeak_Language.reverseWord(compiler.getToken());
			switch (type) {
			case `elements`:
				if ([AllSpeak_Language.word(`of`), AllSpeak_Language.word(`in`)].includes(compiler.nextToken())) {
					if (compiler.nextIsSymbol()) {
						const name = compiler.getToken();
						compiler.next();
						return {
							domain: `core`,
							type,
							name
						};
					}
				}
				break;
			case `index`:
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRec = compiler.getSymbolRecord();
						if (symbolRec.keyword === `variable`
							&& compiler.peek() === AllSpeak_Language.word(`in`)) {
							const value1 = compiler.getValue();
							const value2 = compiler.getNextValue();
							return {
								domain: `core`,
								type: `indexOf`,
								value1,
								value2
							};
						} else {
							const name = compiler.getToken();
							compiler.next();
							return {
								domain: `core`,
								type,
								name
							};
						}
					} else {
						const value1 = compiler.getValue();
						if (compiler.isWord(`in`)) {
							const value2 = compiler.getNextValue();
							return {
								domain: `core`,
								type: `indexOf`,
								value1,
								value2
							};
						}
					}
				}
				break;
			case `value`:
				if (compiler.nextIsWord(`of`)) {
					compiler.next();
					const value = compiler.getValue();
					return {
						domain: `core`,
						type: `valueOf`,
						value
					};
				}
				break;
			case `length`:
				if (compiler.nextIsWord(`of`)) {
					compiler.next();
					const value = compiler.getValue();
					return {
						domain: `core`,
						type: `lengthOf`,
						value
					};
				}
				break;
			case `left`:
			case `right`:
				try {
					const count = compiler.getNextValue();
					if (compiler.isWord(`of`)) {
						const value = compiler.getNextValue();
						return {
							domain: `core`,
							type,
							count,
							value
						};
					}
				} catch (err) {
					return null;
				}
				break;
			case `from`:
				const from = compiler.getNextValue();
				const to = compiler.isWord(`to`) ? compiler.getNextValue() : null;
				if (compiler.isWord(`of`)) {
					const value = compiler.getNextValue();
					return {
						domain: `core`,
						type,
						from,
						to,
						value
					};
				}
				break;
			case `position`:
				let nocase = false;
				if (compiler.nextIsWord(`nocase`)) {
					nocase = true;
					compiler.next();
				}
				if (compiler.isWord(`of`)) {
					var last = false;
					if (compiler.nextIsWord(`the`)) {
						if (compiler.nextIsWord(`last`)) {
							compiler.next();
							last = true;
						}
					}
					const needle = compiler.getValue();
					if (compiler.isWord(`in`)) {
						const haystack = compiler.getNextValue();
						return {
							domain: `core`,
							type: `position`,
							needle,
							haystack,
							last,
							nocase
						};
					}
				}
				break;
			case `payload`:
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const callbackRecord = compiler.getSymbolRecord();
						if (callbackRecord.keyword === `callback`) {
							compiler.next();
							return {
								domain: `core`,
								type: `payload`,
								callback: callbackRecord.name
							};
						}
					}
				}
				break;
			case `message`:
			case `sender`:
			case `millisecond`:
			case `time`:
				compiler.next();
				return {
					domain: `core`,
					type
				};
			case `error`:
				compiler.next();
				// Accept both 'the error' and 'the error message'
				if (compiler.isWord(`message`)) {
					compiler.next();
				}
				return {
					domain: `core`,
					type
				};
			case `year`:
			case `hour`:
			case `minute`:
			case `second`:
				var timestamp = null;
				if (compiler.nextIsWord(`of`)) {
					timestamp = compiler.getNextValue();
				}
				return {
					domain: `core`,
					type,
					timestamp
				}
			case `day`:
			case `month`:
				if (compiler.nextIsWord(`number`)) {
					var timestamp = null;
					if (compiler.nextIsWord(`of`)) {
						timestamp = compiler.getNextValue();
					}
					return {
						domain: `core`,
						type: `${type}number`,
						timestamp
					};
				} else {
					var timestamp = null;
					if (compiler.isWord(`of`)) {
						timestamp = compiler.getNextValue();
					}
					return {
						domain: `core`,
						type,
						timestamp
					}
					}
			}
			return null;
		},

		get: (program, value) => {
			let content = ``;
			switch (value.type) {
			case `boolean`:
				return {
					type: `boolean`,
					numeric: false,
					content: value.content
				};
			case `elements`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getSymbolRecord(value.name).elements
				};
			case `index`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getSymbolRecord(value.name).index
				};
			case `random`:
				const range = program.evaluate(value.range);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor((Math.random() * range.content))
				};
			case `cos`:
				const angle_c = program.getValue(value.angle_c);
				const radius_c = program.getValue(value.radius_c);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.cos(parseFloat(angle_c) * 0.01745329) * radius_c, 10)
				};
			case `sin`:
				const angle_s = program.getValue(value.angle_s);
				const radius_s = program.getValue(value.radius_s);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.sin(parseFloat(angle_s) * 0.01745329) * radius_s, 10)
				};
			case `tan`:
				const angle_t = program.getValue(value.angle_t);
				const radius_t = program.getValue(value.radius_t);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.tan(parseFloat(angle_t) * 0.01745329) * radius_t, 10)
				};
			case `acos`:
				const cdy = program.getValue(value.dy);
				const cdx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.acos(cdy / cdx) * (180/Math.PI), 10)
				};
			case `asin`:
				const ady = program.getValue(value.dy);
				const adx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.asin(ady / adx) * (180/Math.PI), 10)
				};
			case `atan`:
				const tdy = program.getValue(value.dy);
				const tdx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.atan2(tdy, tdx) * (180/Math.PI), 10)
				};
			case `valueOf`:
				const v = parseInt(program.getValue(value.value));
				return {
					type: `constant`,
					numeric: true,
					content: v ? v : 0
				};
			case `lengthOf`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getValue(value.value).length
				};
			case `left`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).substr(0, program.getValue(value.count))
				};
			case `right`:
				const str = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: str.substr(str.length - program.getValue(value.count))
				};
			case `from`:
				const from = program.getValue(value.from);
				const to = value.to ? program.getValue(value.to) : null;
				const fstr = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: to ? fstr.substr(from, to) : fstr.substr(from)
				};
			case `position`:
				let needle = program.getValue(value.needle);
				let haystack = program.getValue(value.haystack);
				if (value.nocase) {
					needle = needle.toLowerCase();
					haystack = haystack.toLowerCase();
				}
				return {
					type: `constant`,
					numeric: true,
					content: value.last ? haystack.lastIndexOf(needle) : haystack.indexOf(needle)
				};
			case `payload`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.callback).payload
				};
			case `modulo`:
				const symbolRecord = program.getSymbolRecord(value.name);
				const modval = program.evaluate(value.value);
				return {
					type: `constant`,
					numeric: true,
					content: symbolRecord.value[symbolRecord.index].content % modval.content
				};
			case `format`:
				const fmtRecord = program.getSymbolRecord(value.name);
				const fmtValue = program.getValue(fmtRecord.value[fmtRecord.index]);
				try {
					const spec = JSON.parse(program.getValue(value.value));
					switch (spec.mode) {
					case `time`:
						
						return {
							type: `constant`,
							numeric: true,
							content: new Date(fmtValue).toLocaleTimeString(spec.locale, spec.options)
						};
					case `date`:
					default:
						const date = new Date(fmtValue);
						const content = (spec.format === `iso`)
							? `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
							: date.toLocaleDateString(spec.locale, spec.options);
						return {
							type: `constant`,
							numeric: false,
							content
						};
					}
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse ${value.value}`);
					return null;
				}
			case `empty`:
				return {
					type: `constant`,
					numeric: false,
					content: ``
				};
			case `now`:
			case `timestamp`:
				return {
					type: `constant`,
					numeric: true,
					content: Date.now()
				};
			case `time`:
				let date = new Date()
				let date2 = new Date()
				date2.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: date.getTime() - date2.getTime()
				};
			case `today`:
				date = new Date()
				date.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: date.getTime()
				};
			case `date`:
				content = Date.parse(program.getValue(value.value));
				if (isNaN(content)) {
					program.runtimeError(program[program.pc].lino, `Invalid date format; expecting 'yyyy-mm-dd'`);
					return null;
				}
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `newline`:
				return {
					type: `constant`,
					numeric: false,
					content: `\n`
				};
			case `tab`:
				return {
					type: `constant`,
					numeric: false,
					content: `\t`
				};
			case `backtick`:
				return {
					type: `constant`,
					numeric: false,
					content: `\``
				};
			case `break`:
				return {
					type: `constant`,
					numeric: false,
					content: `<br />`
				};
			case `uuid`:
				return {
					type: `constant`,
					numeric: false,
					content: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function(c) {
						var r = Math.random() * 16 | 0, v = c == `x` ? r : (r & 0x3 | 0x8);
						return v.toString(16);
					})
				};
			case `encode`:
				return {
					type: `constant`,
					numeric: false,
					content: program.encode(program.getValue(value.value))
				};
			case `decode`:
				return {
					type: `constant`,
					numeric: false,
					content: program.decode(program.getValue(value.value))
				};
			case `reverse`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).split(``).reverse().join(``)
				};
			case `trim`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).trim()
				};
			case `lowercase`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).toLowerCase()
				};
			case `hash`:
				return {
					type: `constant`,
					numeric: false,
					content: _AllSpeak_sha256(program.getValue(value.value))
				};
			case `field`:
				const fieldIndex = parseInt(program.getValue(value.index));
				const fieldStr = program.getValue(value.value);
				const delimiter = program.getValue(value.delimiter);
				const fields = fieldStr.split(delimiter);
				return {
					type: `constant`,
					numeric: false,
					content: (fieldIndex >= 0 && fieldIndex < fields.length) ? fields[fieldIndex] : ``
				};
			case `element`:
				const element = program.getValue(value.element);
				const elementRecord = program.getSymbolRecord(value.symbol);
				var elementContent = ``;
				try {
					elementContent = JSON.parse(program.getValue(elementRecord.value[elementRecord.index]))[element];
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse JSON`);
					return null;
				}
				return {
					type: `constant`,
					numeric: false,
					content: typeof elementContent === `object` ?
						JSON.stringify(elementContent) : elementContent
				};
			case `item`:
				const item = program.getValue(value.item);
				const itemRecord = program.getSymbolRecord(value.symbol);
				var itemContent = ``;
				try {
					const rawContent = program.getValue(itemRecord.value[itemRecord.index]);
					itemContent = JSON.parse(rawContent)[item];
					// AllSpeak.writeToDebugConsole(itemContent)
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse JSON`);
					return null;
				}
				return {
					type: `constant`,
					numeric: false,
					content: typeof itemContent === `object` ?
						JSON.stringify(itemContent) : itemContent
				};
			case `property`:
				const property = program.getValue(value.property);
				const propertyRecord = program.getSymbolRecord(value.symbol);
				let propertyContent = program.getValue(propertyRecord.value[propertyRecord.index]);
				if (property && propertyContent) {
					if (typeof propertyContent === `object`) {
						content = propertyContent[property];
					} else {
						content = ``;
						propertyContent = ``+propertyContent;
						if (propertyContent != `` && [`{`, `[`].includes(propertyContent.charAt(0))) {
							try {
								content = JSON.parse(propertyContent);
								content = content[property];
							} catch (err) {
								program.runtimeError(program[program.pc].lino, `${err.message}: ${propertyContent}`);
							}
						}
					}
				}
				return {
					type: `constant`,
					numeric: !Array.isArray(content) && !isNaN(content),
					content: typeof content === `object` ? JSON.stringify(content) : content
				};
			case `module`:
				const module = program.getSymbolRecord(value.name);
				return {
					type: `boolean`,
					numeric: false,
					content: module.program
				};
			case `message`:
				content = program.message;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `sender`:
				content = program.sender || ``;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `error`:
				content = program.errorMessage;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `indexOf`:
				const value1 = program.getValue(value.value1);
				const value2 = program.getValue(value.value2);
				let searchIn = value2;
				try {
					const parsed = JSON.parse(value2);
					if (Array.isArray(parsed)) searchIn = parsed;
				} catch (err) {
					// Not JSON - search value2 as a plain string.
				}
				return {
					type: `constant`,
					numeric: true,
					content: searchIn.indexOf(value1)
				};
			case `arg`:
				const name = program.getValue(value.value);
				const target = program.getSymbolRecord(value.target);
				content = target[name];
				return {
					type: `constant`,
					numeric: !isNaN(content),
					content
				};
			case `char`:
				let index = program.getValue(value.index);
				let string = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: string[index]
				};
			case `year`:
				var year = new Date().getFullYear();
				if (value.timestamp) {
					year = new Date(program.getValue(value.timestamp) * 1000).getFullYear();
				}
				return {
					type: `constant`,
					numeric: true,
					content: year
				};
			case `month`:
				var month = new Date().getMonth();
				if (value.timestamp) {
					month = new Date(program.getValue(value.timestamp) * 1000).getMonth();
				}
				return {
					type: `constant`,
					numeric: true,
					content: month
				};
			case `day`:
				var day = new Date().getDay();
				if (value.timestamp) {
					day = new Date(program.getValue(value.timestamp) * 1000).getDay();
				}
				return {
					type: `constant`,
					numeric: true,
					content: day
				};
			case `hour`:
				var hour = new Date().getHours();
				if (value.timestamp) {
					hour = new Date(program.getValue(value.timestamp) * 1000).getHours();
				}
				return {
					type: `constant`,
					numeric: true,
					content: hour
				};
			case `minute`:
				var minute = new Date().getMinutes();
				if (value.timestamp) {
					minute = new Date(program.getValue(value.timestamp) * 1000).getMinutes();
				}
				return {
					type: `constant`,
					numeric: true,
					content: minute
				};
			case `second`:
				var second = new Date().getSeconds();
				if (value.timestamp) {
					second = new Date(program.getValue(value.timestamp) * 1000).getSeconds();
				}
				return {
					type: `constant`,
					numeric: true,
					content: second
				};
			case `monthnumber`:
				var monthNumber = new Date().getMonth();
				if (value.timestamp) {
					monthNumber = new Date(program.getValue(value.timestamp) * 1000).getMonth();
				}
				return {
					type: `constant`,
					numeric: true,
					content: monthNumber
				};
			case `daynumber`:
				var dayNumber = new Date().getDate();
				if (value.timestamp) {
					dayNumber = new Date(program.getValue(value.timestamp) * 1000).getDate();
				}
				return {
					type: `constant`,
					numeric: true,
					content: dayNumber
				};
			default:
				return null;
			}
		},

		put: (symbol, value) => {
			symbol.value[symbol.index] = value;
		}
	},

	condition: {

		// Parse a single condition term (no AND/OR)
		parseConditionTerm: compiler => {
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `module`) {
					if (compiler.nextIsWord(`is`)) {
						let sense = true;
						if (compiler.nextIsWord(`not`)) {
							compiler.next();
							sense = false;
						}
						if (compiler.isWord(`running`)) {
							compiler.next();
							return {
								domain: `core`,
								type: `moduleRunning`,
								name: symbolRecord.name,
								sense
							};
						}
					}
					return null;
				}
			}
			if (compiler.isWord(`tracing`)) {
				compiler.next();
				return {
					domain: `core`,
					type: `tracing`,
					sense: true
				};
			}
			if (compiler.isWord(`not`)) {
				if (compiler.peek() === AllSpeak_Language.word(`tracing`)) {
					compiler.next(2);
					return {
						domain: `core`,
						type: `tracing`,
						sense: false
					};
				}
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `not`,
					value
				};
			}
			try {
				const value1 = compiler.getValue();
				let token = compiler.getToken();
				if (AllSpeak_Language.matchesWord(token, `includes`)) {
					const value2 = compiler.getNextValue();
					return {
						domain: `core`,
						type: `includes`,
						value1,
						value2
					};
				}
				if (AllSpeak_Language.matchesWord(token, `has`)) {
					compiler.next();
					let negate = false;
					if (AllSpeak_Language.matchesWord(compiler.getToken(), `no`)) {
						negate = true;
						compiler.next();
					}
					const kind = AllSpeak_Language.reverseWord(compiler.getToken());
					if ([`property`, `element`, `entry`].includes(kind)) {
						const key = compiler.getNextValue();
						return {
							domain: `core`,
							type: `has`,
							kind,
							value1,
							key,
							negate
						};
					}
					return null;
				}
				if (AllSpeak_Language.matchesWord(token, `starts`)) {
					if (compiler.nextIsWord(`with`)) {
						compiler.next();
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `startsWith`,
							value1,
							value2
						};
					}
					return null;
				}
				if (AllSpeak_Language.matchesWord(token, `ends`)) {
					if (compiler.nextIsWord(`with`)) {
						compiler.next();
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `endsWith`,
							value1,
							value2
						};
					}
					return null;
				}
				// Handle both "is not" (English order) and "not is" (e.g. Italian "non è")
				let preNegate = false;
				if (AllSpeak_Language.matchesWord(token, `not`)
					&& AllSpeak_Language.matchesWord(compiler.peek(), `is`)) {
					preNegate = true;
					compiler.next();
					token = compiler.getToken();
				}
				if (AllSpeak_Language.matchesWord(token, `is`)) {
					compiler.next();
					const negate = preNegate || AllSpeak_Core.isNegate(compiler);
					const test = AllSpeak_Language.reverseWord(compiler.getToken());
					switch (test) {
					case `numeric`:
						compiler.next();
						return {
							domain: `core`,
							type: `numeric`,
							value1,
							negate
						};
					case `even`:
						compiler.next();
						return {
							domain: `core`,
							type: `even`,
							value1
						};
					case `odd`:
						compiler.next();
						return {
							domain: `core`,
							type: `odd`,
							value1
						};
					case `greater`:
						if (compiler.nextIsWord(`than`)) {
							compiler.next();
							const value2 = compiler.getValue();
							return {
								domain: `core`,
								type: `greater`,
								value1,
								value2,
								negate
							};
						}
						return null;
					case `less`:
						if (compiler.nextIsWord(`than`)) {
							compiler.next();
							const value2 = compiler.getValue();
							return {
								domain: `core`,
								type: `less`,
								value1,
								value2,
								negate
							};
						}
						return null;
					case `an`:
						switch (AllSpeak_Language.reverseWord(compiler.nextToken())) {
							case `array`:
								compiler.next();
								return {
									domain: `core`,
									type: `array`,
									value1
								};
								break;
							case `object`:
								compiler.next();
								return {
									domain: `core`,
									type: `object`,
									value1
								};
								break;
						}
						return null;
					default:
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `is`,
							value1,
							value2,
							negate
						};
					}
				} else if (value1) {
					// It's a boolean if
					return {
						domain: `core`,
						type: `boolean`,
						value: value1
					};
				}
			} catch (err) {
				compiler.warning(`Can't get a value`);
				return 0;
			}
			return null;
		},

		// Parse AND expressions (higher precedence than OR)
		parseAndExpression: compiler => {
			let left = AllSpeak_Core.condition.parseConditionTerm(compiler);
			if (!left) {
				return null;
			}
			while (compiler.isWord(`and`)) {
				compiler.next();
				const right = AllSpeak_Core.condition.parseConditionTerm(compiler);
				if (!right) {
					compiler.warning(`Expected condition after 'and'`);
					return left;
				}
				left = {
					domain: `core`,
					type: `and`,
					left,
					right
				};
			}
			return left;
		},

		// Parse OR expressions (lower precedence than AND)
		parseOrExpression: compiler => {
			let left = AllSpeak_Core.condition.parseAndExpression(compiler);
			if (!left) {
				return null;
			}
			while (compiler.isWord(`or`)) {
				compiler.next();
				const right = AllSpeak_Core.condition.parseAndExpression(compiler);
				if (!right) {
					compiler.warning(`Expected condition after 'or'`);
					return left;
				}
				left = {
					domain: `core`,
					type: `or`,
					left,
					right
				};
			}
			return left;
		},

		// Main compile method that starts the recursive descent parser
		compile: compiler => {
			return AllSpeak_Core.condition.parseOrExpression(compiler);
		},

		test: (program, condition) => {
			var comparison;
			switch (condition.type) {
			case `or`:
				return program.condition.test(program, condition.left) ||
					program.condition.test(program, condition.right);
			case `and`:
				return program.condition.test(program, condition.left) &&
					program.condition.test(program, condition.right);
			case `tracing`:
				return condition.sense ? !!program.tracing : !program.tracing;
			case `boolean`:
				return program.getValue(condition.value);
			case `numeric`:
				let v = program.getValue(condition.value1);
				let test = v === ` ` || isNaN(v);
				return condition.negate ? test : !test;
			case `even`:
				return (program.getValue(condition.value1) % 2) === 0;
			case `odd`:
				return (program.getValue(condition.value1) % 2) === 1;
			case `is`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison !== 0 : comparison === 0;
			case `greater`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison <= 0 : comparison > 0;
			case `less`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison >= 0 : comparison < 0;
			case `array`:
				const isArray = program.getValue(condition.value1)[0] === `[`;
				return condition.negate ? !isArray : isArray;
			case `object`:
				const isObject = program.getValue(condition.value1)[0] === `{`;
				return condition.negate ? !isObject : isObject;
			case `not`:
				return !program.getValue(condition.value);
			case `moduleRunning`:
				let moduleRecord = program.getSymbolRecord(condition.name);
				if (typeof moduleRecord.program !== `undefined`) {
					let p = AllSpeak.scripts[moduleRecord.program];
					if (!p) {
						return !condition.sense;
					}
					return condition.sense ? p.running : !p.running;
				}
				return !condition.sense;
			case `includes`:
				const value1 = program.getValue(condition.value1);
				const value2 = program.getValue(condition.value2);
				return value1.includes(value2);
			case `startsWith`:
				return program.getValue(condition.value1).startsWith(program.getValue(condition.value2));
			case `endsWith`:
				return program.getValue(condition.value1).endsWith(program.getValue(condition.value2));
			case `has`:
				const haystack = program.getValue(condition.value1);
				const needle = program.getValue(condition.key);
				let parsed = haystack;
				if (typeof haystack === `string`) {
					try {
						parsed = JSON.parse(haystack);
					} catch (err) {
						return condition.negate;
					}
				}
				let result;
				if (condition.kind === `element`) {
					const idx = Number(needle);
					result = Array.isArray(parsed) && Number.isInteger(idx)
						&& idx >= 0 && idx < parsed.length;
				} else {
					result = parsed !== null && typeof parsed === `object` && (needle in parsed);
				}
				return condition.negate ? !result : result;
			}
			return false;
		}
	}
};
