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
						if (compiler.isWord(`or`)) {
							compiler.next();
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
					if (compiler.isWord(`or`)) {
						compiler.next();
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
				const result = array.filter(function (a) {
					variable.a = a;
					program.run(func);
					return variable.v;
				});
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
					if (compiler.isWord(`or`)) {
						compiler.next();
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
			if (compiler.getToken()== `parent`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						lino,
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
			if (compiler.isWord(`to`)) {
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
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const message = program.getValue(command.message);
			let target = null;
			if (command.recipient === `parent`) {
				if (program.parent) {
					target = AllSpeak.scripts[program.parent];
				}
				// Intercept: if the caller is awaiting a direct reply
				if (target && target.replyVar) {
					target.message = message;
					const replyTarget = target.getSymbolRecord(target.replyVar);
					replyTarget.value[replyTarget.index] = {
						type: `text`,
						numeric: false,
						content: message
					};
					target.replyVar = null;
					return command.pc + 1;
				}
			} else if (command.recipient === `sender`) {
				if (program.sender) {
					target = AllSpeak.scripts[program.sender];
				}
				// Intercept: if the caller is awaiting a direct reply
				if (target && target.replyVar) {
					target.message = message;
					const replyTarget = target.getSymbolRecord(target.replyVar);
					replyTarget.value[replyTarget.index] = {
						type: `text`,
						numeric: false,
						content: message
					};
					target.replyVar = null;
					return command.pc + 1;
				}
			} else {
				const recipient = program.getSymbolRecord(command.recipient);
				if (recipient.program) {
					target = AllSpeak.scripts[recipient.program];
				}
			}
			if (command.replyVar) {
				program.replyVar = command.replyVar;
				if (target && target.onMessage) {
					target.sender = program.script;
					target.message = message;
					target.run(target.onMessage);
				}
				if (program.replyVar) {
					program.replyVar = null;
					program.runtimeError(command.lino, `No reply received from '${command.recipient}'`);
					return 0;
				}
				return command.pc + 1;
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
					if (compiler.isWord(`or`)) {
						compiler.next();
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
				array.sort(function (a, b) {
					variable.a = a;
					variable.b = b;
					program.run(func);
					return variable.v;
				});
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
		handlers[`log`] = this.Log;           // compiles to PRINT with log flag
		handlers[`release`] = this.Release;   // compiles to SET_READY
		handlers[`continue`] = this.Continue; // sets compiler flag
		handlers[`no`] = this.No;             // no cache directive
		handlers[`test`] = this.Test;
		handlers[`goto`] = this.Go;           // alias for go
		handlers[`subtract`] = this.Take;     // alias for take
		handlers[`endTry`] = this.EndTry;     // internal
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
					const type = AllSpeak_Language.reverseWord(compiler.nextToken());
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
			if ([`now`, `timestamp`, `today`, `newline`, `backtick`, `break`, `empty`, `uuid`].includes(AllSpeak_Language.reverseWord(token))) {
				compiler.next();
				return {
					domain: `core`,
					type: token
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
			if ([`encode`, `decode`, `lowercase`, `hash`, `reverse`, `trim`].includes(AllSpeak_Language.reverseWord(token))) {
				compiler.next();
				const value = compiler.getValue();
				return {
					domain: `core`,
					type: token,
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
						if (compiler.peek() === AllSpeak_Language.word(`in`)) {
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
				const fmtValue = program.getValue(fmtRecord.value[fmtRecord.index]) * 1000;
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
                const d = new Date();
                const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
                const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
                const isDST = Math.max(jan, jul) !== d.getTimezoneOffset();  
                let now = Math.floor(Date.now() / 1000)
				if (isDST) {
					now += 3600
				}
				return {
					type: `constant`,
					numeric: true,
					content: now
				};
			case `timestamp`:
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(Date.now() / 1000)
				};
			case `millisecond`:
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(Date.now())
				};
			case `time`:
				let date = new Date()
				let date2 = new Date()
				date2.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor((date.getTime() - date2.getTime())/1000)
				};
			case `today`:
				date = new Date()
				date.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(date.getTime() / 1000)
				};
			case `date`:
				content = Date.parse(program.getValue(value.value)) / 1000;
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
				const hashval = program.getValue(value.value);
				let hash = 0;
				if (hashval.length === 0) return hash;
				for (let i = 0; i < hashval.length; i++) {
					const chr = hashval.charCodeAt(i);
					hash = ((hash << 5) - hash) + chr;
					//					hash |= 0; // Convert to 32bit integer
				}
				return {
					type: `constant`,
					numeric: true,
					content: hash
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
						if (propertyContent != `` && [`{`, `]`].includes(propertyContent.charAt(0))) {
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
				try {
					content = JSON.parse(value2).indexOf(value1);
					return {
						type: `constant`,
						numeric: true,
						content
					};
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse ${value2}`);
				}
				break;
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
				const token = compiler.getToken();
				if (token === AllSpeak_Language.word(`includes`)) {
					const value2 = compiler.getNextValue();
					return {
						domain: `core`,
						type: `includes`,
						value1,
						value2
					};
				}
				if (token === AllSpeak_Language.word(`starts`)) {
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
				if (token === AllSpeak_Language.word(`ends`)) {
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
				if (token === AllSpeak_Language.word(`is`)) {
					compiler.next();
					const negate = AllSpeak_Core.isNegate(compiler);
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
			}
			return false;
		}
	}
};const AllSpeak_Browser = {

	name: `AllSpeak_Browser`,

	renderMarkdownToHtml: (markdown) => {
		if (typeof AllSpeak_Markdown !== `undefined` && AllSpeak_Markdown && typeof AllSpeak_Markdown.renderToHtml === `function`) {
			return AllSpeak_Markdown.renderToHtml(markdown);
		}
		return `${markdown == null ? `` : markdown}`;
	},

	A: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `a`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Alert: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			compiler.addCommand({
				domain: `browser`,
				keyword: `alert`,
				lino,
				value
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const value = program.getFormattedValue(command.value);
			alert(value);
			return command.pc + 1;
		}
	},

	Attach: {

		nowMs: () => {
			if (typeof performance !== `undefined` && typeof performance.now === `function`) {
				return performance.now();
			}
			return Date.now();
		},

		reportTiming: (message) => {
			if (!(typeof AllSpeak !== `undefined` && AllSpeak.timingEnabled)) {
				return;
			}
			if (typeof AllSpeak !== `undefined` && typeof AllSpeak.writeToDebugConsole === `function`) {
				AllSpeak.writeToDebugConsole(message);
			} else {
				console.log(message);
			}
		},

		compile: (compiler) => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				//				const symbol = compiler.getProgram()[compiler.getSymbol().pc];
				const symbol = compiler.getSymbolRecord();
				let type = symbol.keyword;
				switch (type) {
				case `a`:
				case `blockquote`:
				case `button`:
				case `canvas`:
				case `div`:
				case `fieldset`:
				case `file`:
				case `form`:
				case `h1`:
				case `h2`:
				case `h3`:
				case `h4`:
				case `h5`:
				case `h6`:
				case `image`:
				case `img`:
				case `input`:
				case `label`:
				case `legend`:
				case `li`:
				case `option`:
				case `p`:
				case `pre`:
				case `select`:
				case `span`:
				case `table`:
				case `td`:
				case `text`:
				case `textarea`:
				case `tr`:
				case `ul`:
					compiler.next();
					if (compiler.isWord(`to`)) {
						let cssId = null;
						if (compiler.nextIsWord(`body`)) {
							if (type=== `div`) {
								cssId = `body`;
								compiler.next();
							} else {
								throw Error(`Body variable must be a div`);
							}
						}
						else cssId = compiler.getValue();
						let onError = 0;
						if (compiler.isWord(`or`)) {
							compiler.next();
							onError = compiler.getPc() + 1;
							compiler.completeHandler();
						}
						compiler.addCommand({
							domain: `browser`,
							keyword: `attach`,
							lino,
							type,
							symbol: symbol.name,
							cssId,
							onError
						});
						return true;
					}
					break;
				default:
					compiler.addWarning(`type '${symbol.keyword}' not recognized in browser 'attach'`);
					return false;
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'attach'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let content = null;
			let element = null;
			if (command.cssId === `body`) {
				const target = program.getSymbolRecord(command.symbol);
				target.element[target.index] = document.body;
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content
				};
			} else {
				content = program.value.evaluate(program, command.cssId).content;
				const waitMs = (typeof AllSpeak !== `undefined` && Number.isFinite(AllSpeak.attachWaitMs))
					? AllSpeak.attachWaitMs
					: 1000;
				const waitUntil = Date.now() + waitMs;
				const trace = {
					id: content,
					type: command.type,
					symbol: command.symbol,
					startedAt: AllSpeak_Browser.Attach.nowMs(),
					lookupAttempts: 0,
					waitMs
				};
				AllSpeak_Browser.Attach.getElementById(program, command, content, waitUntil, trace);
				return 0;
			}
			if (command.type === `popup`) {
				// Register a popup
				program.popups.push(element.id);
				// Handle closing of the popup
				window.onclick = function (event) {
					if (program.popups.includes(event.target.id)) {
						event.target.style.display = `none`;
					}
				};
			}
			return command.pc + 1;
		},

		getElementById: (program, command, id, waitUntil, trace) => {
			trace.lookupAttempts += 1;
			const element = document.getElementById(id);
			if (element) {
				const isImageTarget = [`img`, `image`].includes(command.type);
				if (isImageTarget && !AllSpeak_Browser.Attach.isImageReady(element)) {
					AllSpeak_Browser.Attach.waitForImageReady(program, command, id, element, waitUntil, trace);
				} else {
					AllSpeak_Browser.Attach.completeAttach(program, command, element, id, trace);
				}
			} else if (Date.now() < waitUntil) {
				const retry = () => AllSpeak_Browser.Attach.getElementById(program, command, id, waitUntil, trace);
				if (typeof window !== `undefined` && typeof window.requestAnimationFrame === `function`) {
					window.requestAnimationFrame(retry);
				} else {
					setTimeout(retry, 16);
				}
			} else {
				const elapsed = Math.round(AllSpeak_Browser.Attach.nowMs() - trace.startedAt);
				AllSpeak_Browser.Attach.reportTiming(`[AttachTiming] FAILED id='${id}' symbol='${trace.symbol}' type='${trace.type}' attempts=${trace.lookupAttempts} elapsed=${elapsed}ms waitLimit=${trace.waitMs}ms`);
				if (command.onError) {
					program.errorMessage = `No such element: '${id}'`;
					program.run(command.onError);
				} else {
					program.runtimeError(command.lino, `No such element: '${id}'`);
				}
			}
		},

		completeAttach: (program, command, element, id, trace) => {
			if (program.run) {
				const elapsed = Math.round(AllSpeak_Browser.Attach.nowMs() - trace.startedAt);
				AllSpeak_Browser.Attach.reportTiming(`[AttachTiming] id='${id}' symbol='${trace.symbol}' type='${trace.type}' attempts=${trace.lookupAttempts} elapsed=${elapsed}ms`);
				const target = program.getSymbolRecord(command.symbol);
				target.element[target.index] = element;
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					id
				};
				program.run(command.pc + 1);
			}
		},

		isImageReady: (element) => {
			if (!element) {
				return false;
			}
			if (element.tagName !== `IMG`) {
				return true;
			}
			return element.complete;
		},

		waitForImageReady: (program, command, id, element, waitUntil, trace) => {
			if (AllSpeak_Browser.Attach.isImageReady(element) || Date.now() >= waitUntil) {
				AllSpeak_Browser.Attach.completeAttach(program, command, element, id, trace);
				return;
			}
			let finished = false;
			let timer = null;
			const finish = () => {
				if (finished) {
					return;
				}
				finished = true;
				element.removeEventListener(`load`, finish);
				element.removeEventListener(`error`, finish);
				if (timer) {
					clearTimeout(timer);
				}
				AllSpeak_Browser.Attach.completeAttach(program, command, element, id, trace);
			};
			element.addEventListener(`load`, finish);
			element.addEventListener(`error`, finish);
			timer = setTimeout(finish, Math.max(0, waitUntil - Date.now()));
		}
	},

	Audioclip: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `audioclip`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	BLOCKQUOTE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `blockquote`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	BUTTON: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `button`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	CANVAS: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `canvas`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Clear: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const name = AllSpeak_Language.reverseWord(compiler.nextToken());
			if ([`body`, `styles`].includes(name)) {
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `clear`,
					lino,
					name
				});
				return true;
			}
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.extra === `dom`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `clear`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.name) {
			case `body`:
				document.body.innerHTML = ``;
				break;
			case `styles`:
				// document.querySelectorAll(`[style]`).forEach(el => el.removeAttribute(`style`));
				document.querySelectorAll(`link[rel="stylesheet"]`)
					.forEach(el => el.parentNode.removeChild(el));
				document.querySelectorAll(`style`).forEach(el => el.parentNode.removeChild(el)); 
				break;
			default:
				const targetRecord = program.getSymbolRecord(command.name);
				const target = targetRecord.element[targetRecord.index];
				switch (targetRecord.keyword) {
				case `input`:
				case `textarea`:
					target.value = ``;
					break;
				default:
					target.innerHTML = ``;
					break;
				}
			}
			return command.pc + 1;
		}
	},

	Click: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (targetRecord.keyword === `select`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `click`,
						lino,
						target: targetRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			const element = targetRecord.element[targetRecord.index];
			element.dispatchEvent(new Event(`click`));
			return command.pc + 1;
		}
	},

	Convert: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`whitespace`)) {
				if (compiler.nextIsWord(`in`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.isVHolder) {
							if (compiler.nextIsWord(`to`)) {
								const mode = compiler.nextToken();
								compiler.next();
								compiler.addCommand({
									domain: `browser`,
									keyword: `convert`,
									lino,
									name: symbolRecord.name,
									mode
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const content = targetRecord.value[targetRecord.index].content;
			let value = content;
			switch (command.mode) {
			case `print`:
				value = value.split(`%0a`).join(`\n`).split(`%0A`).join(`\n`).split(`%0d`).join(``).split(`$0D`).join(``);
				break;
			case `html`:
				value = value.split(`%0a`).join(`<br />`).split(`%0A`).join(`<br />`).split(`%0d`).join(``).split(`$0D`).join(``);
				break;
			}
			targetRecord.value[targetRecord.index].content = value;
			return command.pc + 1;
		}
	},

	Copy: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `input`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `copy`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const element = targetRecord.element[targetRecord.index];
			element.select();
			element.setSelectionRange(0, 99999); // For mobile devices
			document.execCommand(`copy`);
			return command.pc + 1;
		}
	},

	Create: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword === `audioclip`) {
					if (compiler.nextIsWord(`from`)) {
						const value = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `create`,
							type: `audioclip`,
							name: symbolRecord.name,
							lino,
							value
						});
						return true;
					}
					return false;
				}
				if ([`a`,
					`blockquote`,
					`button`,
					`canvas`,
					`div`,
					`fieldset`,
					`file`,
					`form`,
					`h1`,
					`h2`,
					`h3`,
					`h4`,
					`h5`,
					`h6`,
					`hr`,
					`image`,
					`img`,
					`input`,
					`label`,
					`legend`,
					`li`,
					`option`,
					`p`,
					`pre`,
					`progress`,
					`select`,
					`span`,
					`table`,
					`tr`,
					`td`,
					`th`,
					`text`,
					`textarea`,
					`ul`
				].includes(keyword)) {
					if (compiler.nextIsWord(`in`)) {
						if (compiler.nextIsWord(`body`)) {
							compiler.next();
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: `body`
							});
							return true;
						}
						if (compiler.isSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							compiler.next();
							const pc = compiler.getPc();
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: parentRecord.name,
								onError: 0
							});
							if (compiler.isWord(`or`)) {
								compiler.next();
								compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
								compiler.completeHandler();
							}
							return true;
						}
					} else {
						const imports = compiler.imports;
						if (imports && imports.length > 0 && compiler.parent === `Codex`) {
							// && compiler.program[compiler.parent.symbols[imports[0]].pc].keyword === `div`) {
							// This is used by Codex to force run in Run panel, which must be the first import
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: imports[0],
								imported: true
							});
							return true;
						}
						compiler.addCommand({
							domain: `browser`,
							keyword: `create`,
							lino,
							name: symbolRecord.name,
							parent: `body`
						});
						return true;
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			switch (command.type) {
			case `audioclip`:
				targetRecord.value[targetRecord.index] = command.value;
				break;
			default:
				let parent;
				if (command.parent === `body`) {
					parent = document.body;
				} else {
					const p = command.imported ? AllSpeak.scripts[program.parent] : program;
					const parentRecord = p.getSymbolRecord(command.parent);
					if (!parentRecord.element[parentRecord.index]) {
						const msg = `Element ${parentRecord.name} does not exist.`;
						if (command.onError) {
							program.errorMessage = msg;
							program.run(command.onError);
							return 0;
						}
						program.runtimeError(command.pc, msg);
					}
					parent = parentRecord.element[parentRecord.index];
				}
				targetRecord.element[targetRecord.index] = document.createElement(targetRecord.keyword);
				targetRecord.element[targetRecord.index].id =
					`ec-${targetRecord.name}-${targetRecord.index}-${AllSpeak.elementId++}`;
				if (targetRecord.keyword === `a`) {
					targetRecord.element[targetRecord.index].setAttribute(`href`, `#`);
				}
				parent.appendChild(targetRecord.element[targetRecord.index]);
				break;
			}
			return command.pc + 1;
		}
	},

	Disable: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `disable`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'disable'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			let target = symbol.element[symbol.index];
			if (!target) {
				const symbolValue = symbol.value[symbol.index] || {};
				const targetId = symbolValue.content || symbolValue.id;
				target = targetId ? document.getElementById(targetId) : null;
			}
			if (!target) {
				program.runtimeError(command.lino, `Variable '${symbol.name}' is not attached to a DOM element.`);
				return 0;
			}
			target.disabled = true;
			return command.pc + 1;
		}
	},

	DIV: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `div`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Enable: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `enable`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'enable'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			let target = symbol.element[symbol.index];
			if (!target) {
				const symbolValue = symbol.value[symbol.index] || {};
				const targetId = symbolValue.content || symbolValue.id;
				target = targetId ? document.getElementById(targetId) : null;
			}
			if (!target) {
				program.runtimeError(command.lino, `Variable '${symbol.name}' is not attached to a DOM element.`);
				return 0;
			}
			target.disabled = false;
			return command.pc + 1;
		}
	},

	FIELDSET: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `fieldset`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	FILE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `file`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Focus: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `focus`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'focus'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const element = symbol.element[symbol.index];
			element.focus();
			return command.pc + 1;
		}
	},

	FORM: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `form`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Get: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				let targetRecord = compiler.getSymbolRecord();
				if (compiler.nextIsWord(`from`)) {
					if (compiler.nextIsWord(`storage`)) {
						if (compiler.nextIsWord(`as`)) {
							const key = compiler.getNextValue();
							compiler.addCommand({
								domain: `browser`,
								keyword: `get`,
								action: `getStorage`,
								lino,
								target,
								key
							});
							return true;
						} else {
							compiler.addCommand({
								domain: `browser`,
								keyword: `get`,
								action: `listStorage`,
								lino,
								target
							});
							return true;
						}
					}
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `select`) {
							if (targetRecord.keyword === `option`) {
								compiler.next();
								compiler.addCommand({
									domain: `browser`,
									keyword: `get`,
									action: `getOption`,
									lino,
									target,
									select: symbolRecord.name
								});
								return true;
							}
							return false;
						}
						if (symbolRecord.keyword !== `form`) {
							return false;
						}
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `get`,
							action: `getForm`,
							lino,
							target,
							form: symbolRecord.name
						});
						return true;
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			switch (command.action) {
			case `getForm`:
				const formRecord = program.getSymbolRecord(command.form);
				const form = document.getElementById(formRecord.value[formRecord.index].content);
				const data = new FormData(form);
				const content = {};
				for (const entry of data) {
					content[entry[0]] = entry[1].replace(/\r/g, ``).replace(/\n/g, `%0a`);
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(content)
				};
				break;
			case `listStorage`:
				const items = [];
				for (let i = 0, len = window.localStorage.length; i < len; i++) {
					items.push(localStorage.key(i));
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(items)
				};
				break;
			case `getStorage`:
				let value = window.localStorage.getItem(program.getValue(command.key));
				if (typeof value === `undefined`) {
					value = null;
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: value
				};
				break;
			case `getOption`:
				let selectRecord = program.getSymbolRecord(command.select);
				let select = selectRecord.element[selectRecord.index];
				let option = select.options[select.selectedIndex];
				targetRecord.element[targetRecord.index] = option;
				break;
			}
			return command.pc + 1;
		}
	},

	H1: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h1`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H2: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h2`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H3: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h3`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H4: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h4`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H5: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h5`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H6: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h6`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Highlight: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.extra === `dom`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `highlight`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const element = targetRecord.element[targetRecord.index];
			element.select();
			return command.pc + 1;
		}
	},

	History: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const type = compiler.nextToken();
			switch (type) {
			case `push`:
			case `set`:
			case `replace`:
				compiler.next();
				let url = ``;
				let state = ``;
				let title = ``;
				while (true) {
					const token = compiler.getToken();
					if (token === AllSpeak_Language.word(`url`)) {
						url = compiler.getNextValue();
					} else if (token === AllSpeak_Language.word(`state`)) {
						state = compiler.getNextValue();
					} else if (token === AllSpeak_Language.word(`title`)) {
						title = compiler.getNextValue();
					} else {
						break;
					}
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `history`,
					lino,
					type,
					url,
					state,
					title
				});
				return true;
			case `pop`:
			case `back`:
			case `forward`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `history`,
					lino,
					type
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			if (!program.script) {
				program.script = `script${Date.now()/1000}`;
			}
			const command = program[program.pc];
			let state = program.getValue(command.state);
			if (state == ``) {
				state = `{"script":"${program.script}"}`;
			}
			let title = program.getValue(command.title);
			const url = program.getValue(command.url);
			switch (command.type) {
			case `push`:
				if (!window.history.state) {
					program.runtimeError(command.lino, `No state history; you need to call 'history set' on the parent`);
					return 0;
				}
				window.history.pushState(state, ``, url);
				break;
			case `set`:
			case `replace`:
				window.history.replaceState(state, title, url);
				break;
			case `pop`:
			case `back`:
				window.history.back();
				break;
			case `forward`:
				window.history.forward();
				break;
			}
			return command.pc + 1;
		}
	},

	HR: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `hr`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	IMAGE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `image`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	IMG: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `img`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	INPUT: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `input`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LABEL: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `label`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LEGEND: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `legend`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LI: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `li`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Location: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			let newWindow = false;
			if (compiler.nextIsWord(`new`)) {
				newWindow = true;
				compiler.next();
			}
			const location = compiler.getValue();
			compiler.addCommand({
				domain: `browser`,
				keyword: `location`,
				lino,
				location,
				newWindow
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const location = program.getValue(command.location);
			if (command.newWindow) {
				window.open(location, `_blank`);
			} else {
				window.location = location;
			}
			return command.pc + 1;
		}
	},

	Mail: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`to`)) {
				const to = compiler.getNextValue();
				let subject = ``;
				let body = ``;
				if (compiler.isWord(`subject`)) {
					subject = compiler.getNextValue();
					if (compiler.isWord(`body`) || compiler.isWord(`message`)) {
						compiler.next();
						body = compiler.getValue();
					}
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `mail`,
					lino,
					to,
					subject,
					body
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.subject) {
				window.location.href = `mailto:${program.getValue(command.to)}` +
					`?subject=${program.getValue(command.subject)}&body=${encodeURIComponent(program.getValue(command.body))}`;
			} else {
				window.location.href = `mailto:${program.getValue(command.to)}`;
			}
			return command.pc + 1;
		}
	},

	On: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `change`:
				compiler.next();
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				break;
			case `click`:
				if (compiler.nextIsWord(`document`)) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `clickDocument`
					});
					return compiler.completeHandler();
				}
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				break;
			case `key`:
			case `leave`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			case `window`:
				if (compiler.nextIsWord(`resize`)) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `windowResize`
					});
					return compiler.completeHandler();
				}
				return false;
			case `browser`:
			case `restore`:
				if (action === `browser` && !compiler.nextIsWord(`back`)) {
					return false;
				}
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action: `browserBack`
				});
				return compiler.completeHandler();
			case `swipe`:
				if ([`left`, `right`].includes(AllSpeak_Language.reverseWord(compiler.nextToken()))) {
					const direction = AllSpeak_Language.reverseWord(compiler.getToken());
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `swipe`,
						direction
					});
					return compiler.completeHandler();
				}
				return false;
			case `pick`:
				if (compiler.nextIsSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				return false;
			case `resume`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			case `drag`:
			case `drop`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			}
			compiler.addWarning(`Unrecognised syntax in 'on'`);
			return false;
		},

		run: (program) => {
			let targetRecord;
			const command = program[program.pc];
			switch (command.action) {
			case `change`:
				targetRecord = program.getSymbolRecord(command.symbol);
				targetRecord.program = program.script;
				targetRecord.element.forEach(function (target, index) {
					if (target) {
						target.targetRecord = targetRecord;
						target.targetIndex = index;
						target.targetPc = command.pc + 2;
						target.addEventListener(`change`, (event) => {
							event.stopPropagation();
							if (program.length > 0) {
								const eventTarget = event.target;
								if (typeof eventTarget.targetRecord !== `undefined`) {
									eventTarget.targetRecord.index = eventTarget.targetIndex;
									setTimeout(function () {
										AllSpeak.timestamp = Date.now();
										let p = AllSpeak.scripts[eventTarget.targetRecord.program];
										p.run(eventTarget.targetPc);
									}, 1);
								}
							}
						});
					}
				});
				break;
			case `click`:
				targetRecord = program.getSymbolRecord(command.symbol);
				targetRecord.program = program.script;
				targetRecord.element.forEach(function (target, index) {
					if (target) {
						target.targetRecord = targetRecord;
						target.targetIndex = index;
						target.targetPc = command.pc + 2;
						target.onclick = function (event) {
							event.stopPropagation();
							AllSpeak_Browser.clickData = {
								target,
								clientX: event.clientX,
								clientY: event.clientY
							};
							if (program.length > 0) {
								const eventTarget = event.target;
								const boundTarget = event.currentTarget || target;
								if (eventTarget && eventTarget.type != `radio` && typeof eventTarget.blur === `function`) {
									eventTarget.blur();
								}
								if (typeof boundTarget.targetRecord !== `undefined`) {
									boundTarget.targetRecord.index = boundTarget.targetIndex;
									setTimeout(function () {
										AllSpeak.timestamp = Date.now();
										let p = AllSpeak.scripts[boundTarget.targetRecord.program];
										p.run(boundTarget.targetPc);
									}, 1);
								} else {
								}
							}
							return false;
						};
					}
				});
				break;
			case `clickDocument`:
				program.targetPc = command.pc + 2;
				const interceptClickEvent = (e) => {
					AllSpeak.timestamp = Date.now();
					let target = e.target || e.srcElement;
					let href = ``;
					while (target.parentNode) {
						if (target.tagName === `A`) {
							href = target.href;
							program.docPath = href.slice(-(href.length - window.location.href.length));
							break;
						}
						target = target.parentNode;
					}
					while (target.parentNode) {
						if (target.id.indexOf(`ec-`) === 0) {
							let id = target.id.slice(3);
							let pos = id.indexOf(`-`);
							program.varName = id.slice(0, pos);
							id = id.slice(pos + 1);
							pos = id.indexOf(`-`);
							program.varIndex = parseInt(id.slice(0, pos));
							break;
						}
						target = target.parentNode;
					}
					if (href.indexOf(window.location.href) === 0) {
						program.run(program.targetPc);
						e.preventDefault();
					}
				};
				if (document.addEventListener) {
					document.addEventListener(`click`, interceptClickEvent);
				} else if (document.attachEvent) {
					document.attachEvent(`onclick`, interceptClickEvent);
				}
				break;
			case `swipe`:
				let xDown;
				const getTouches = (evt) => {
					return evt.touches || // browser API
							evt.originalEvent.touches; // jQuery
				};
				const handleTouchStart = (evt) => {
					const firstTouch = getTouches(evt)[0];
					xDown = firstTouch.clientX;
				};
				const handleTouchMove = (evt) => {
					evt.stopImmediatePropagation();
					if (!xDown) {
						return;
					}
					const xUp = evt.touches[0].clientX;
					const xDiff = xDown - xUp;
					if (Math.abs(xDiff) > 150) {
						xDown = null;
						if (xDiff > 0 && program.onSwipeLeft) {
							program.run(program.onSwipeLeft);
						} else if (xDiff < 0 && program.onSwipeRight) {
							program.run(program.onSwipeRight);
						}
					}
				};
				switch (command.direction) {
				case `left`:
					program.onSwipeLeft = command.pc + 2;
					break;
				case `right`:
					program.onSwipeRight = command.pc + 2;
					break;
				}
				document.addEventListener(`touchstart`, handleTouchStart, false);
				document.addEventListener(`touchmove`, handleTouchMove, false);
				break;
			case `pick`:
				const pickRecord = program.getSymbolRecord(command.symbol);
				document.pickRecord = pickRecord;
				pickRecord.element.forEach(function (element, index) {
					if (!element) {
						return;
					}
					document.pickIndex = index;
					element.pickIndex = index;
					// Set up the mouse down and up listeners
					element.mouseDownPc = command.pc + 2;
					// Check if touch device
					let isTouchDevice = `ontouchstart` in element;
					if (isTouchDevice) {
						element.addEventListener(`touchstart`, function (e) {
							const element = e.targetTouches[0].target;
							document.pickX = e.touches[0].clientX;
							document.pickY = e.touches[0].clientY;
							element.blur();
							setTimeout(function () {
								document.pickRecord.index = element.pickIndex;
								program.run(element.mouseDownPc);
							}, 1);
						}, false);
						element.addEventListener(`touchmove`, function (e) {
							document.dragX = e.touches[0].clientX;
							document.dragY = e.touches[0].clientY;
							setTimeout(function () {
								program.run(document.mouseMovePc);
							}, 1);
							return false;
						}, false);
						element.addEventListener(`touchend`, function () {
							setTimeout(function () {
								program.run(document.mouseUpPc);
							}, 1);
							return false;
						});
					} else {
						element.onmousedown = function (event) {
							let e = event ? event : window.event;
							e.stopPropagation();
							// IE uses srcElement, others use target
							if (program.length > 0) {
								const element = e.target ? e.target : e.srcElement;
								element.offsetX = e.offsetX;
								element.offsetY = e.offsetY;
								document.pickX = e.clientX;
								document.pickY = e.clientY;
								element.blur();
								setTimeout(function () {
									document.pickRecord.index = element.pickIndex;
									program.run(element.mouseDownPc);
								}, 1);
							}
							document.onmousemove = function (event) {
								let e = event ? event : window.event;
								e.stopPropagation();
								document.dragX = e.clientX;
								document.dragY = e.clientY;
								if (document.onmousemove) {
									setTimeout(function () {
										program.run(document.mouseMovePc);
									}, 1);
								}
								return false;
							};
							window.onmouseup = function () {
								document.onmousemove = null;
								document.onmouseup = null;
								setTimeout(function () {
									if (program && program.run) {
										program.run(document.mouseUpPc);
									}
								}, 1);
								return false;
							};
							return false;
						};
					}
				});
				break;
			case `drag`:
				// Set up the move listener
				document.mouseMovePc = command.pc + 2;
				break;
			case `drop`:
				// Set up the move listener
				document.mouseUpPc = command.pc + 2;
				break;
			case `key`:
				if (typeof document.onKeyListeners === `undefined`) {
					document.onKeyListeners = [];
				}
				if (!document.onKeyListeners.includes(program)) {
					document.onKeyListeners.push(program);
				}
				program.onKeyPc = command.pc + 2;
				document.onkeydown = function (event) {
					for (const program of document.onKeyListeners) {
						program.key = event.key;
						try {
							setTimeout(function () {
								program.run(program.onKeyPc);
							}, 1);
						} catch (err) {
							AllSpeak.writeToDebugConsole(`Error: ${err.message}`);
						}
					}
					return true;
				};
				break;
			case `windowResize`:
				program.onWindowResize = command.pc + 2;
				window.addEventListener(`resize`, function() {
					program.run(program.onWindowResize);
				});
				break;
			case `browserBack`:
				program.onBrowserBack = command.pc + 2;
				break;
			case `resume`:
				program.onResume = command.pc + 2;
				document.addEventListener(`visibilitychange`, function () {
					if (!document.hidden && program.running) {
						AllSpeak.timestamp = Date.now();
						program.run(program.onResume);
					}
				});
				break;
			case `leave`:
				window.addEventListener(`beforeunload`, function () {
					program.run(command.pc + 2);
				});
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	OPTION: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `option`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	P: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `p`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Play: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (targetRecord.keyword === `audioclip`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `play`,
						lino,
						target: targetRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			const url = program.value.evaluate(program, targetRecord.value[targetRecord.index]).content;
			new Audio(url).play();
			return command.pc + 1;
		}
	},

	PRE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `pre`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	PROGRESS: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `progress`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Put: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			// Get the value
			const value = compiler.getNextValue();
			if (compiler.isWord(`into`)) {
				if (compiler.nextIsWord(`storage`)) {
					if (compiler.nextIsWord(`as`)) {
						const key = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `put`,
							lino,
							value,
							key
						});
						return true;
					}
				}
			}
			return false;
		},

		// runtime

		run: (program) => {
			const command = program[program.pc];
			window.localStorage.setItem(program.getValue(command.key), program.getValue(command.value));
			return command.pc + 1;
		}
	},

	Remove: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsWord(`element`)) {
				if (compiler.nextIsSymbol()) {
					const element = compiler.getSymbolRecord();
					if (element.extra != `dom`) {
						compiler.warning(`'${element.name}' is not a DOM element`);
						return false;
					}
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `remove`,
						type: `removeElement`,
						lino,
						element: element.name
					});
					return true;
				}
			}
			if (compiler.isWord(`attribute`)) {
				const attribute = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.extra !== `dom`) {
							throw new Error(`Inappropriate type '${targetRecord.keyword}'`);
						}
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `remove`,
							type: `removeAttribute`,
							lino,
							attribute,
							target: targetRecord.name
						});
						return true;
					}
				}
			}
			try {
				const key = compiler.getValue();
				if (compiler.isWord(`from`)) {
					if (compiler.nextIsWord(`storage`)) {
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `remove`,
							type: `removeStorage`,
							key
						});
						return true;
					}
				}
			} catch (err) {
				return false;
			}
			return false;
		},

		// runtime

		run: (program) => {
			const command = program[program.pc];
			switch (command.type) {
			case `removeAttribute`:
				const attribute = program.getValue(command.attribute);
				const targetRecord = program.getSymbolRecord(command.target);
				target = targetRecord.element[targetRecord.index];
				target.removeAttribute(attribute);
				break;
			case `removeElement`:
				const elementRecord = program.getSymbolRecord(command.element);
				const element = elementRecord.element[elementRecord.index];
				if (element) {
					element.parentElement.removeChild(element);
				}
				break;
			case `removeStorage`:
				const key = program.getValue(command.key);
				window.localStorage.removeItem(key);
				break;
			}
			return command.pc + 1;
		}
	},

	Render: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const script = compiler.getNextValue();
			if (compiler.isWord(`in`)) {
				if (compiler.nextIsSymbol()) {
					const parentRecord = compiler.getSymbolRecord();
					if (parentRecord.extra === `dom`) {
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `render`,
							lino,
							parent: parentRecord.name,
							script
						});
						return true;
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (typeof AllSpeak_Webson === `undefined`) {
				program.runtimeError(command.lino, `Webson engine is not loaded`);
				return 0;
			}
			const parent = program.getSymbolRecord(command.parent);
			const element = parent.element[parent.index];
			const script = program.getValue(command.script);
			AllSpeak_Webson.render(element, `main`, script, {
				debug: 0,
				state: `default`,
				timingEnabled: typeof AllSpeak !== `undefined` && !!AllSpeak.timingEnabled,
				timingReporter: typeof AllSpeak !== `undefined` && typeof AllSpeak.writeToDebugConsole === `function`
					? (message) => AllSpeak.writeToDebugConsole(message)
					: null
			})
				.then(() => {
					program.run(command.pc + 1);
				})
				.catch((err) => {
					program.runtimeError(command.lino, err.message ? err.message : String(err));
				});
			return 0;
		}
	},

	Request: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (AllSpeak_Language.reverseWord(compiler.nextToken()) === `fullscreen`) {
				let option = ``;
				if (AllSpeak_Language.reverseWord(compiler.nextToken()) === `exit`) {
					option = `exit`;
					compiler.next();
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `request`,
					lino,
					option
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.option === `exit`) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
			return command.pc + 1;
		}
	},

	Scroll: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			let name = null;
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				name = symbolRecord.name;
				compiler.next();
			}
			if (compiler.isWord(`to`)) {
				const to = compiler.getNextValue();
				compiler.addCommand({
					domain: `browser`,
					keyword: `scroll`,
					lino,
					name,
					to
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const to = program.getValue(command.to);
			if (command.name) {
				const symbolRecord = program.getSymbolRecord(command.name);
				const div = symbolRecord.element[symbolRecord.index];

				// Method 1: Standard smooth scroll
				div.scrollTo({ top: 0, behavior: 'smooth' });

				// Method 2: Immediate fallback
				div.scrollTop = 0;

				// Method 3: Force reflow by accessing layout properties
				void div.offsetHeight; // This triggers a reflow

				// Final attempt
				div.scrollTop = 0;
			} else {
				window.scrollTo(0, to);
			}
			return command.pc + 1;
		}
	},

	SECTION: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `section`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	SELECT: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `select`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Set: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				const target = targetRecord.name;
				if (targetRecord.extra === `dom`) {
					const token = compiler.nextToken();
					if (token === AllSpeak_Language.word(`from`)) {
						if (compiler.nextIsSymbol()) {
							if (targetRecord.keyword === `select`) {
								const sourceRecord = compiler.getSymbolRecord();
								if (sourceRecord.keyword === `variable`) {
									var display = null;
									if (compiler.nextIsWord(`as`)) {
										display = compiler.getNextValue();
									}
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setSelect`,
										select: target,
										source: sourceRecord.name,
										display
									});
									return true;
								}
								return false;
							}
							const source = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setContentVar`,
								source,
								target
							});
							return true;
						}
					}
				}
			} else {
				let token = compiler.getToken();
				if (token === AllSpeak_Language.word(`the`)) {
					token = compiler.nextToken();
				}
				if (token === AllSpeak_Language.word(`title`)) {
					if (compiler.nextIsWord(`to`)) {
						const value = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `set`,
							lino,
							type: `setTitle`,
							value
						});
						return true;
					}
				} else if (token === AllSpeak_Language.word(`content`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const target = compiler.getToken();
							if (compiler.nextIsWord(`from`)) {
								if (compiler.nextIsSymbol()) {
									const source = compiler.getToken();
									compiler.next();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setContentVar`,
										source,
										target
									});
									return true;
								}
							}
							if (compiler.isWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `browser`,
									keyword: `set`,
									lino,
									type: `setContent`,
									value,
									target
								});
								return true;
							}
						}
						throw new Error(`'${compiler.getToken()}' is not a symbol`);
					}
				} else if (token === AllSpeak_Language.word(`class`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if (symbol.extra === `dom`) {
								if (compiler.nextIsWord(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setClass`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === AllSpeak_Language.word(`id`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if (symbol.extra === `dom`) {
								if (compiler.nextIsWord(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setId`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === AllSpeak_Language.word(`text`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							switch (symbol.keyword) {
							case `button`:
							case `input`:
							case `span`:
							case `label`:
							case `legend`:
							case `textarea`:
								if (compiler.nextIsWord(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setText`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
								break;
							default:
								break;
							}
						}
					}
				} else if (token === AllSpeak_Language.word(`size`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							switch (symbol.keyword) {
							case `input`:
								if (compiler.nextIsWord(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setSize`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === AllSpeak_Language.word(`attribute`)) {
					compiler.next();
					const attributeName = compiler.getValue();
					if (compiler.isWord(`of`)) {
						if (compiler.nextIsSymbol(true)) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							compiler.next();
							let attributeValue = {
								type: `boolean`,
								content: true
							};
							if (compiler.isWord(`to`)) {
								attributeValue = compiler.getNextValue();
							}
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setAttribute`,
								symbolName,
								attributeName,
								attributeValue
							});
							return true;
						}
					}
				} else if (token === AllSpeak_Language.word(`attributes`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								compiler.warning(`'${symbolName}' is not a DOM type`);
								return false;
							}
							if (compiler.nextIsWord(`to`)) {
								const attributes = compiler.getNextValue();
								if (attributes) {
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setAttributes`,
										symbolName,
										attributes
									});
									return true;
								}
							}
						}
					}
					compiler.warning(`'${compiler.getToken()}' is not a symbol`);
					return false;
				} else if (token === AllSpeak_Language.word(`style`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								compiler.warning(`'${symbolName}' is not a DOM type`);
								return false;
							}
							if (compiler.nextIsWord(`to`)) {
								const styleValue = compiler.getNextValue();
								if (styleValue) {
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setStyles`,
										symbolName,
										styleValue
									});
									return true;
								}
							}
						}
						compiler.warning(`'${compiler.getToken()}' is not a symbol`);
						return false;
					}
					const styleName = compiler.getValue();
					let type = `setStyle`;
					let symbolName = ``;
					token = compiler.getToken();
					if (token === AllSpeak_Language.word(`of`)) {
						if (AllSpeak_Language.reverseWord(compiler.nextToken()) === `body`) {
							type = `setBodyStyle`;
						} else if (compiler.isSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								throw Error(`'${symbolName}' is not a DOM type`);
							}
						} else {
							throw Error(`'${compiler.getToken()}' is not a known symbol`);
						}
						if (compiler.nextIsWord(`to`)) {
							const styleValue = compiler.getNextValue();
							if (styleValue) {
								compiler.addCommand({
									domain: `browser`,
									keyword: `set`,
									lino,
									type,
									symbolName,
									styleName,
									styleValue
								});
								return true;
							}
						}
					}
					else if (token === AllSpeak_Language.word(`to`)) {
						const styleValue = compiler.getNextValue();
						if (styleValue) {
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setHeadStyle`,
								styleName,
								styleValue
							});
							return true;
						}
					}
				} else if (token === AllSpeak_Language.word(`default`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							if (symbolRecord.keyword === `select`) {
								if (compiler.nextIsWord(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setDefault`,
										name: symbolRecord.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === AllSpeak_Language.word(`tracer`)) {
					if (compiler.nextIsWord(`rows`)) {
						if (compiler.nextIsWord(`to`)) {
							const value = compiler.getNextValue();
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setTracerRows`,
								value
							});
							return true;
						}
					}
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'set'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let symbol;
			let value;
			let target;
			let targetId;
			let targetRecord;
			let cssId;
			let selectRecord;
			switch (command.type) {
			case `setContentVar`:
				const sourceVar = program.getSymbolRecord(command.source);
				targetRecord = program.getSymbolRecord(command.target);
				const source = document.getElementById(sourceVar.value[sourceVar.index].content);
				target = targetRecord.element[targetRecord.index];
				if (!target) {
					targetId = program.getValue(targetRecord.value[targetRecord.index]);
					target = document.getElementById(targetId);
				}
				target.innerHTML = source.innerHTML;
				break;
			case `setContent`:
				value = program.getValue(command.value);
				targetRecord = program.getSymbolRecord(command.target);
				target = targetRecord.element[targetRecord.index];
				if (!target) {
					cssId = targetRecord.value[targetRecord.index].content;
					if (!cssId) {
						program.runtimeError(command.lino,
							`Variable '${targetRecord.name}' has not been attached to a DOM element.`);
						return 0;
					}
					target = document.getElementById(cssId);
				}
				targetRecord.element[targetRecord.index] = target;
				switch (targetRecord.keyword) {
				case `text`:
				case `textarea`:
				case `input`:
					target.value = value;
					break;
				default:
					if (target && target.dataset && target.dataset.markdown === `1`) {
						target.innerHTML = AllSpeak_Browser.renderMarkdownToHtml(value);
					} else {
						target.innerHTML = value;
					}
					break;
				}
				break;
			case `setSelect`:
				// The source is assumed to be an array
				sourceRecord = program.getSymbolRecord(command.source);
				const sourceData = program.getValue(sourceRecord.value[sourceRecord.index]);
				var itemArray = ``;
				try {
					itemArray = JSON.parse(sourceData);
				} catch (err) {
					program.runtimeError(command.lino, `Can't parse JSON`);
					return 0;
				}
				// The target is assumed to be a SELECT
				selectRecord = program.getSymbolRecord(command.select);
				const select = selectRecord.element[selectRecord.index];
				select.options.length = 0;
				// Get the name of the display field
				const display = program.getValue(command.display);
				// For each item, set the title and inner HTML
				itemArray.forEach(function (item) {
					const title = display ? program.decode(item[display]) : null;
					const opt = document.createElement(`option`);
					const innerHTML = title ? title : item;
					opt.innerHTML = innerHTML;
					const value = title ? JSON.stringify(item) : item;
					opt.value = value;
					select.appendChild(opt);
				});
				if (display) {
					select.selectedIndex = itemArray.indexOf(display);
				} else {
					select.selectedIndex = -1;
				}
				break;
			case `setClass`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				program.getValue(command.value).split(` `).forEach(function(item) {
					target.classList.remove(item);
					target.classList.add(item);
				});
				break;
			case `setId`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				target.id = program.getValue(command.value);
				break;
			case `setText`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				value = program.getValue(command.value);
				switch (symbol.keyword) {
				case `button`:
				case `span`:
				case `label`:
				case `legend`:
					target.innerHTML = value;
					break;
				case `input`:
				case `textarea`:
					target.value = value;
					break;
				default:
					break;
				}
				break;
			case `setSize`:
				symbol = program.getSymbolRecord(command.symbolName);
				if (symbol.keyword === `input`) {
					target = symbol.element[symbol.index];
					if (!target) {
						targetId = program.getValue(symbol.value[symbol.index]);
						target = document.getElementById(targetId);
					}
					target.size = program.getValue(command.value);
				} else {
					program.runtimeError(command.lino, `Inappropriate variable type '${symbol.name}'`);
				}
				break;
			case `setAttribute`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				const attributeName = program.getValue(command.attributeName);
				if (command.attributeValue.type === `boolean`) {
					target.setAttribute(attributeName, command.attributeValue.content);
				} else {
					target.setAttribute(attributeName, program.getValue(command.attributeValue));
				}
				break;
			case `setAttributes`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				for (let n = target.attributes.length - 1; n >= 0; n--) {
					target.removeAttribute(target.attributes[n].name);
				}
				let attributes = program.getValue(command.attributes);
				let list = attributes.split(` `);
				for (let n = 0; n < list.length; n++) {
					let attribute = list[n];
					let p = attribute.indexOf(`=`);
					if (p > 0) {
						target.setAttribute(attribute.substr(0, p), attribute.substr(p + 1));
					}
					else {
						target.setAttribute(attribute, attribute);
					}
				}
				break;
			case `setStyle`:
			case `setStyles`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					const symbolElement = symbol.value[symbol.index];
					if (!symbolElement.type) {
						program.runtimeError(command.lino,
							`Variable '${symbol.name}' is not attached to a DOM element.`);
						return 0;
					}
					targetId = program.getValue(symbolElement);
					target = document.getElementById(targetId);
				}
				const styleValue = program.getValue(command.styleValue);
				if (!symbol.element[symbol.index]) {
					program.runtimeError(command.lino, `Variable '${symbol.name}' has no DOM element.`);
					return 0;
				}
				switch (command.type) {
				case `setStyle`:
					target.style[command.styleName.content] = styleValue;
					break;
				case `setStyles`:
					target.style.cssText = styleValue;
					break;
				}
				break;
			case `setHeadStyle`:
				const headStyleName = program.getValue(command.styleName);
				const headStyleValue = program.getValue(command.styleValue);
				var style = document.createElement(`style`);
				style.innerHTML = `${headStyleName} ${headStyleValue}`;
				for (let i = 0; i < document.head.childNodes.length; i++) {
					let node = document.head.childNodes[i];
					if (node.tagName === `STYLE`) {
						let data = node.innerHTML;
						if (data.indexOf(`${headStyleName} `) === 0) {
							document.head.removeChild(node);
							break;
						}
					}
				}	
				document.head.appendChild(style);
				break;
			case `setBodyStyle`:
				const bodyStyleValue = program.getValue(command.styleValue);
				switch (command.styleName.content) {
				case `background`:
					document.body.style.background = bodyStyleValue;
					break;
				default:
					program.runtimeError(command.lino,
						`Unsupported body attribute '${command.styleName.content}'`);
					return 0;
				}
				break;
			case `setTitle`:
				document.title = program.getValue(command.value);
				break;
			case `setTracerRows`:
				program.tracerRows = parseInt(program.getValue(command.value));
				break;
			case `setDefault`:
				selectRecord = program.getSymbolRecord(command.name);
				value = program.getValue(command.value);
				const element = selectRecord.element[selectRecord.index];
				for (let n = 0; n < element.options.length; n++) {
					if (element.options[n].value === value) {
						element.selectedIndex = n;
						break;
					}
				}
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	SPAN: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `span`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TABLE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `table`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TD: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `td`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TEXTAREA: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `textarea`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TH: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `th`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TR: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `tr`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Trace: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const variables = [];
			if (compiler.nextIsSymbol()) {
				while (compiler.isSymbol()) {
					variables.push(compiler.getToken());
					compiler.next();
				}
				let alignment = `horizontal`;
				if (compiler.isWord(`horizontal`) || compiler.isWord(`vertical`)) {
					alignment = compiler.getToken();
					compiler.next();
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `trace`,
					variant: `setup`,
					lino,
					variables,
					alignment
				});
				return true;
			}
			compiler.addCommand({
				domain: `browser`,
				keyword: `trace`,
				variant: `run`,
				lino
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.variant) {
			case `setup`:
				AllSpeak.writeToDebugConsole(`Set up tracer`);
				program.tracer = {
					variables: command.variables,
					alignment: command.alignment
				};
				break;
			case `run`:
				AllSpeak.writeToDebugConsole(`Run tracer`);
				if (!program.tracer) {
					program.tracer = {
						variables: [],
						alignment: `horizontal`
					};
				}
				if (!program.tracing) {
					const tracer = document.getElementById(`allspeak-tracer`);
					if (tracer) {
						tracer.innerHTML =
								`<div><input id="allspeak-run-button" type="button" value="Run" />` +
								`<input id="allspeak-step-button" type="button" value="Step" />` +
								`<div id="allspeak-tracer-content" style="border:1px solid black;padding:4px";width:100%>` +
								`</div>`;
						tracer.style.display = `none`;
					}
					program.tracing = true;
				}
				program.stop = false;
				break;
			}
			return program.pc + 1;
		}
	},

	UL: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `ul`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Upload: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const file = compiler.getToken();
				if (compiler.nextIsWord(`to`)) {
					const path = compiler.getNextValue();
					if (compiler.isWord(`with`)) {
						if (compiler.nextIsSymbol()) {
							const progress = compiler.getToken();
							if (compiler.nextIsWord(`and`)) {
								if (compiler.nextIsSymbol()) {
									const status = compiler.getToken();
									compiler.next();
									compiler.addCommand({
										domain: `browser`,
										keyword: `upload`,
										lino,
										file,
										path,
										progress,
										status
									});
									return true;
								}
							}
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			program.runtimeError(command.lino, `File upload is disabled in static hosting mode`);
			return 0;

		}
	},

	// Compile-time keyword → handler map, built from the language pack.
	_compileHandlers: null,

	_buildCompileHandlers: function() {
		const lang = AllSpeak_Language;
		const opcodeMap = this.getOpcodeMap();
		const elementMap = this.getElementHandlerMap();
		const handlers = {};

		// Map opcode keywords from language pack to handlers
		if (lang.pack) {
			const opcodes = lang.pack.opcodes;
			for (const opcode in opcodes) {
				const handler = opcodeMap[opcode];
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

		// Element type declarations — map each type keyword to its handler
		for (const type in elementMap) {
			handlers[type] = elementMap[type];
		}

		// Handlers not covered by opcode map
		handlers[`fullscreen`] = this.FullScreen;

		this._compileHandlers = handlers;
	},

	getHandler: function(name) {
		if (!this._compileHandlers) {
			this._buildCompileHandlers();
		}
		return this._compileHandlers[name] || null;
	},

	opcodeMap: null,

	getOpcodeMap: function() {
		if (this.opcodeMap) return this.opcodeMap;
		this.opcodeMap = {
			// Element declarations — all map to the same handler per element type
			DECLARE_ELEMENT: null, // resolved dynamically below

			// DOM manipulation
			CREATE_ELEMENT: this.Create,
			ATTACH_ELEMENT: this.Attach,
			REMOVE_ELEMENT: this.Remove,
			REMOVE_ATTRIBUTE: this.Remove,
			CLICK_ELEMENT: this.Click,
			FOCUS_ELEMENT: this.Focus,
			DISABLE_ELEMENT: this.Disable,
			ENABLE_ELEMENT: this.Enable,
			HIGHLIGHT_ELEMENT: this.Highlight,

			// Content & styling
			SET_CONTENT: this.Set,
			SET_CONTENT_VAR: this.Set,
			SET_TEXT: this.Set,
			SET_TITLE: this.Set,
			SET_SELECT: this.Set,
			SET_STYLE: this.Set,
			SET_STYLES: this.Set,
			SET_BODY_STYLE: this.Set,
			SET_HEAD_STYLE: this.Set,
			SET_CLASS: this.Set,
			SET_ID: this.Set,
			SET_SIZE: this.Set,
			SET_ATTRIBUTE: this.Set,
			SET_ATTRIBUTES: this.Set,
			SET_DEFAULT: this.Set,
			SET_TRACER_ROWS: this.Set,
			CLEAR_ELEMENT: this.Clear,
			RENDER: this.Render,
			CONVERT: this.Convert,

			// Events
			ON_CHANGE: this.On,
			ON_CLICK: this.On,
			ON_CLICK_DOCUMENT: this.On,
			ON_KEY: this.On,
			ON_LEAVE: this.On,
			ON_WINDOW_RESIZE: this.On,
			ON_BROWSER_BACK: this.On,
			ON_SWIPE: this.On,
			ON_PICK: this.On,
			ON_RESUME: this.On,
			ON_DRAG: this.On,
			ON_DROP: this.On,

			// Navigation
			ALERT: this.Alert,
			NAVIGATE: this.Location,
			HISTORY_PUSH: this.History,
			HISTORY_SET: this.History,
			HISTORY_REPLACE: this.History,
			HISTORY_BACK: this.History,
			HISTORY_FORWARD: this.History,
			SCROLL: this.Scroll,
			FULLSCREEN: this.Request,
			MAIL: this.Mail,
			COPY_TO_CLIPBOARD: this.Copy,

			// Storage
			PUT_STORAGE: this.Put,
			GET_STORAGE: this.Get,
			LIST_STORAGE: this.Get,
			GET_FORM: this.Get,
			GET_OPTION: this.Get,
			REMOVE_STORAGE: this.Remove,

			// Media
			PLAY_AUDIO: this.Play,
			UPLOAD_FILE: this.Upload,

			// Debug
			TRACE_SETUP: this.Trace,
			TRACE_RUN: this.Trace
		};
		return this.opcodeMap;
	},

	// Map element keyword back to its handler for DECLARE_ELEMENT runtime dispatch
	elementHandlerMap: null,

	getElementHandlerMap: function() {
		if (this.elementHandlerMap) return this.elementHandlerMap;
		this.elementHandlerMap = {
			a: this.A, audioclip: this.Audioclip, blockquote: this.BLOCKQUOTE,
			button: this.BUTTON, canvas: this.CANVAS, div: this.DIV,
			fieldset: this.FIELDSET, file: this.FILE, form: this.FORM,
			h1: this.H1, h2: this.H2, h3: this.H3, h4: this.H4, h5: this.H5, h6: this.H6,
			hr: this.HR, image: this.IMAGE, img: this.IMG, input: this.INPUT,
			label: this.LABEL, legend: this.LEGEND, li: this.LI, option: this.OPTION,
			p: this.P, pre: this.PRE, progress: this.PROGRESS, section: this.SECTION,
			select: this.SELECT, span: this.SPAN, table: this.TABLE, td: this.TD,
			textarea: this.TEXTAREA, th: this.TH, tr: this.TR, ul: this.UL
		};
		return this.elementHandlerMap;
	},

	run: (program) => {
		const command = program[program.pc];
		let handler;
		if (command.opcode) {
			if (command.opcode === `DECLARE_ELEMENT`) {
				handler = AllSpeak_Browser.getElementHandlerMap()[command.keyword];
			} else {
				handler = AllSpeak_Browser.getOpcodeMap()[command.opcode];
			}
		}
		if (!handler) {
			handler = AllSpeak_Browser.getHandler(command.keyword);
		}
		if (!handler) {
			program.runtimeError(command.lino, `Unknown command '${command.opcode || command.keyword}' in 'browser' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (compiler.nextIsWord(`exists`)) {
					if (symbolRecord.extra === `dom`) {
						compiler.next();
						return {
							domain: `browser`,
							type: `exists`,
							value: symbolRecord.name
						};
					}
					return null;
				}
				switch (symbolRecord.keyword) {
				case `file`:
				case `input`:
				case `select`:
				case `textarea`:
					return {
						domain: `browser`,
						type: symbolRecord.keyword,
						value: symbolRecord.name
					};
				}
				return null;
			}

			if (compiler.isWord(`the`)) {
				compiler.next();
			}
			let offset = false;
			if (compiler.isWord(`offset`)) {
				offset = true;
				compiler.next();
			}

			let type = AllSpeak_Language.reverseWord(compiler.getToken());
			let text;
			let attribute;
			switch (type) {
			case `mobile`:
			case `portrait`:
			case `landscape`:
			case `br`:
			case `location`:
			case `key`:
			case `hostname`:
				compiler.next();
				return {
					domain: `browser`,
					type
				};
			case `browser`:
				if (compiler.nextIsWord(`name`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `browserName`
					};
				}
				break;
			case `content`:
			case `text`:
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbol = compiler.getSymbolRecord();
						compiler.next();
						return {
							domain: `browser`,
							type: `contentOf`,
							symbol: symbol.name
						};
					}
					throw new Error(`'${compiler.getToken()}' is not a symbol`);
				}
				break;
			case `selected`:
				let arg = AllSpeak_Language.reverseWord(compiler.nextToken());
				if ([`index`, `item`].includes(arg)) {
					if ([`in`, `of`].includes(AllSpeak_Language.reverseWord(compiler.nextToken()))) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if ([`ul`, `ol`, `select`].includes(symbol.keyword)) {
								compiler.next();
								return {
									domain: `browser`,
									type: `selected`,
									symbol: symbol.name,
									arg
								};
							}
						}
					}
				}
				break;
			case `color`:
				compiler.next();
				const value = compiler.getValue();
				return {
					domain: `browser`,
					type,
					value
				};
			case `attribute`:
				attribute = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					compiler.next();
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.extra === `dom`) {
							compiler.next();
							return {
								domain: `browser`,
								type: `attributeOf`,
								attribute,
								symbol: symbolRecord.name
							};
						}
					}
				}
				break;
			case `style`:
				const style = compiler.getNextValue();
				if (compiler.isWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.extra === `dom`) {
							compiler.next();
							return {
								domain: `browser`,
								type,
								style,
								target: symbolRecord.name
							};
						}
					}
				}
				break;
			case `confirm`:
				text = compiler.getNextValue();
				return {
					domain: `browser`,
					type: `confirm`,
					text
				};
			case `prompt`:
				text = compiler.getNextValue();
				let pre = null;
				if (compiler.isWord(`with`)) {
					pre = compiler.getNextValue();
				}
				return {
					domain: `browser`,
					type: `prompt`,
					text,
					pre
				};
			case `screen`:
				attribute = AllSpeak_Language.reverseWord(compiler.nextToken());
				if ([`width`, `height`].includes(attribute)) {
					compiler.next();
					return {
						domain: `browser`,
						type,
						attribute
					};
				}
				break;
			case `top`:
			case `bottom`:
			case `left`:
			case `right`:
			case `width`:
			case `height`:
				return AllSpeak_Browser.value.getCoord(compiler, type, offset);
			case `scroll`:
				if (compiler.nextIsWord(`position`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `scrollPosition`
					};
				}
				break;
			case `document`:
				if (compiler.nextIsWord(`path`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `docPath`
					};
				}
				break;
			case `storage`:
				if (compiler.nextIsWord(`keys`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `storageKeys`
					};
				}
				break;
			case `parent`:
				switch (AllSpeak_Language.reverseWord(compiler.nextToken())) {
				case `name`:
					compiler.next();
					return {
						domain: `browser`,
						type: `varName`
					};
				case `index`:
					compiler.next();
					return {
						domain: `browser`,
						type: `varIndex`
					};
				}
				break;
			case `history`:
				if (compiler.nextIsWord(`state`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `historyState`
					};
				}
				break;
			case `pick`:
			case `drag`:
				if (compiler.nextIsWord(`position`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `${type}Position`
					};
				}
				break;
			case `click`:
				const which = AllSpeak_Language.reverseWord(compiler.nextToken());
				if ([`left`, `top`].includes(which)) {
					compiler.next();
					return {
						domain:`browser`,
						type: `click`,
						which
					};
				}
				break;
			}
			return null;
		},

		getCoord: (compiler, type, offset) => {
			if (compiler.nextIsWord(`of`)) {
				if (compiler.nextIsWord(`the`)) {
					compiler.nextToken();
				}
				const symbol = AllSpeak_Language.reverseWord(compiler.getToken());
				if ([`window`, `viewport`].includes(symbol)) {
					compiler.next();
					return {
						domain: `browser`,
						type,
						symbol,
						offset
					};
				}
				let symbolRecord = null;
				if (compiler.isSymbol()) {
					symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.extra === `dom`) {
						compiler.next();
						return {
							domain: `browser`,
							type,
							symbol: symbolRecord.name,
							offset
						};
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			let symbolRecord;
			let element;
			let target;
			let content;
			switch (value.type) {
			case `file`:
			case `input`:
			case `select`:
			case `textarea`:
				symbolRecord = program.getSymbolRecord(value.value);
				target = symbolRecord.element[symbolRecord.index];
				if (!target) {
					program.runtimeError(program[program.pc].lino,
						`Variable '${symbolRecord.name}' is not attached to a DOM element.`);
					return null;
				}
				if (value.type === `input` && target.type === `checkbox`) {
					return {
						type: `boolean`,
						numeric: false,
						content: target.checked
					};
				}
				return {
					type: `constant`,
					numeric: false,
					content: target.value
				};
			case `exists`:
				symbolRecord = program.getSymbolRecord(value.value);
				return {
					domain: `browser`,
					type: `boolean`,
					content: typeof symbolRecord.element[symbolRecord.index] !== `undefined`
				};
			case `mobile`:
				const isMobile = {
					Android: function() {
						return navigator.userAgent.match(/Android/i);
					},
					BlackBerry: function() {
						return navigator.userAgent.match(/BlackBerry/i);
					},
					iOS: function() {
						return navigator.userAgent.match(/iPhone|iPad|iPod/i);
					},
					Opera: function() {
						return navigator.userAgent.match(/Opera Mini/i);
					},
					Windows: function() {
						return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
					},
					any: function() {
						return (isMobile.Android() || isMobile.BlackBerry()
						|| isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
					}
				};
				return {
					domain: `browser`,
					type: `boolean`,
					content: isMobile.any()
					// content: (typeof window.orientation !== `undefined`) || (navigator.userAgent.indexOf(`IEMobile`) !== -1)
					//content: (/Android|iPhone/i.test(navigator.userAgent))
				};
			case `browserName`:
				let userAgent = navigator.userAgent;
				let browserName;
			
				if (userAgent.match(/chrome|chromium|crios/i)) {
					browserName = "Chrome";
				} else if (userAgent.match(/firefox|fxios/i)) {
					browserName = "Firefox";
				} else if (userAgent.match(/safari/i)) {
					browserName = "Safari";
				} else if (userAgent.match(/opr\//i)) {
					browserName = "Opera";
				} else if (userAgent.match(/edg/i)) {
					browserName = "Edge";
				} else if (userAgent.match(/android/i)) {
					browserName = "Android";
				} else if (userAgent.match(/iphone/i)) {
					browserName = "iPhone";
				} else {
					browserName = "Unknown";
				}
				return {
					domain: `browser`,
					type: `constant`,
					numeric: false,
					content: browserName
				};  
			case `portrait`:
				return {
					domain: `browser`,
					type: `boolean`,
					content: document.documentElement.clientWidth < document.documentElement.clientHeight
				};
			case `landscape`:
				return {
					domain: `browser`,
					type: `boolean`,
					content: document.documentElement.clientWidth >= document.documentElement.clientHeight
				};
			case `br`:
				return {
					type: `constant`,
					numeric: false,
					content: decodeURIComponent(`%3Cbr%20%2F%3E`)
				};
			case `attributeOf`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				const attribute = program.getValue(value.attribute);
				target = symbolRecord.element[symbolRecord.index];
				if (attribute.indexOf(`data-`) === 0) {
					return program.getSimpleValue(target.dataset[attribute.substr(5)]);
				}
				return program.getSimpleValue(target[attribute]);
			case `style`:
				symbolRecord = program.getSymbolRecord(value.target);
				const style = program.getValue(value.style);
				target = symbolRecord.element[symbolRecord.index];
				return program.getSimpleValue(target.style[style]);
			case `confirm`:
				return {
					type: `boolean`,
					content: window.confirm(program.getValue(value.text))
				};
			case `prompt`:
				const text = program.getValue(value.text);
				const pre = program.getValue(value.pre);
				return {
					type: `constant`,
					numeric: false,
					content: pre ? window.prompt(text, pre) : window.prompt(text)
				};
			case `contentOf`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				target = symbolRecord.element[symbolRecord.index];
				if (target === null || typeof target === `undefined`) {
					program.runtimeError(program[program.pc].lino,
						`Variable '${symbolRecord.name}' is not attached to a DOM element.`);
					return null;
				}
				switch (symbolRecord.keyword) {
				case `input`:
				case `textarea`:
					content = target.value;
					break;
				case `pre`:
					content = target.innerHTML;
					break;
				default:
					content = target.innerHTML.split(`\n`).join(``);
					break;
				}
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `selected`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				target = symbolRecord.element[symbolRecord.index];
				let selectedIndex = target.selectedIndex;
				let selectedText = selectedIndex  >= 0 ? target.options[selectedIndex].text : ``;
				content = (value.arg === `index`) ? selectedIndex : selectedText;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `top`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenY
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				element = symbolRecord.element[symbolRecord.index];
				content = Math.round(value.offset ? element.offsetTop : element.getBoundingClientRect().top);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `bottom`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenY + window.innerHeight
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().bottom);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `left`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenLeft
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				element = symbolRecord.element[symbolRecord.index];
				content = Math.round(value.offset ? element.offsetLeft : element.getBoundingClientRect().left);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `right`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenX + window.innerWidth
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().right);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `width`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.innerWidth
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().width);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `height`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.innerHeight
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().height);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `color`:
				const styleValue = program.value.evaluate(program, value.value).content;
				const hex = styleValue.toString(16).padStart(6, `0`);
				return {
					type: `constant`,
					numeric: false,
					content: `#${hex}`
				};
			case `docPath`:
				return {
					type: `constant`,
					numeric: false,
					content: program.docPath
				};
			case `storageKeys`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(Object.keys(localStorage))
				};
			case `location`:
				return {
					type: `constant`,
					numeric: false,
					content: window.location.href
				};
			case `historyState`:
				return {
					type: `constant`,
					numeric: false,
					content: window.history.state
				};
			case `scrollPosition`:
				return {
					type: `constant`,
					numeric: true,
					content: scrollPosition
				};
			case `varName`:
				return {
					type: `constant`,
					numeric: false,
					content: program.varName
				};
			case `varIndex`:
				return {
					type: `constant`,
					numeric: true,
					content: program.varIndex
				};
			case `key`:
				return {
					type: `constant`,
					numeric: false,
					content: program.key
				};
			case `hostname`:
				return {
					type: `constant`,
					numeric: false,
					content: location.hostname
				};
			case `screen`:
				return {
					type: `constant`,
					numeric: true,
					content: screen[value.attribute]
				};
			case `pickPosition`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify({
						"x": document.pickX,
						"y": document.pickY
					})
				};
			case `dragPosition`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify({
						"x": document.dragX,
						"y": document.dragY
					})
				};
			case `click`:
				const clickData = AllSpeak_Browser.clickData;
				if (typeof clickData === `undefined`) {
					return 0;
				}
				const boundingRect = clickData.target.getBoundingClientRect();
				return {
					type: `constant`,
					numeric: true,
					content: value.which === `left`
						? clickData.clientX - Math.round(boundingRect.left)
						: clickData.clientY - Math.round(boundingRect.top)
				};
			}
		}
	},

	condition: {

		compile: (compiler) => {
			if (compiler.isWord(`confirm`)) {
				const value = compiler.getNextValue();
				return {
					domain: `browser`,
					type: `confirm`,
					value
				};
			} else if (compiler.isWord(`element`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.extra === `dom`) {
						const token = compiler.nextToken();
						if (token === `has`) {
							if (compiler.nextIsWord(`the`)) {
								compiler.next();
							}
							if (compiler.isWord(`focus`)) {
								compiler.next();
								return {
									domain: `browser`,
									type: `focus`,
									element: symbolRecord.name
								};
							}
						} else if (token === `contains`) {
							const position = compiler.getNextValue();
							return {
								domain: `browser`,
								type: `contains`,
								element: symbolRecord.name,
								position
							};
						}
					}
				}
			}
			return null;
		},

		test: (program, condition) => {
			switch (condition.type) {
			case `confirm`:
				return confirm(program.getValue(condition.value));
			case `focus`:
				const focusRecord = program.getSymbolRecord(condition.element);
				return focusRecord.element[focusRecord.index] === document.activeElement;
			case `contains`:
				const containsRecord = program.getSymbolRecord(condition.element);
				const element = containsRecord.element[containsRecord.index];
				const bounds = element.getBoundingClientRect();
				const left = Math.round(bounds.left);
				const right = Math.round(bounds.right);
				const top = Math.round(bounds.top);
				const bottom = Math.round(bounds.bottom);
				const position = JSON.parse(program.getValue(condition.position));
				const x = position.x;
				const y = position.y;
				if (x >= left && x <= right && y >= top && y <= bottom) {
					return true;
				}
				return false;
			}
		}
	},

	setStyles: (id, styleString) => {
		const element = document.getElementById(id);
		const styles = styleString.split(`;`);
		for (const item of styles) {
			const style = item.split(`:`);
			element.setAttribute(style[0], style[1]);
		}
	}
};

let scrollPosition = 0;

window.addEventListener(`scroll`, function () {
	scrollPosition = this.scrollY;
});

window.onpopstate = function (event) {
	window.AllSpeak.timestamp = Date.now();
	const state = JSON.parse(event.state);
	if (state && state.script) {
		const program = window.AllSpeak.scripts[state.script];
		if (program) {
			if (program.onBrowserBack) {
				program.run(program.onBrowserBack);
			}
		} else {
			AllSpeak.writeToDebugConsole(`No script property in window state object`);
		}
	}
};
const AllSpeak_Markdown = {

	escapeHtml: (text) => {
		return `${text}`
			.replace(/&/g, `&amp;`)
			.replace(/</g, `&lt;`)
			.replace(/>/g, `&gt;`)
			.replace(/\"/g, `&quot;`)
			.replace(/'/g, `&#39;`);
	},

	normalizeColor: (value) => {
		const color = `${value || ``}`.trim();
		if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
			return color;
		}
		if (/^[a-zA-Z]+$/.test(color)) {
			return color.toLowerCase();
		}
		return null;
	},

	normalizeFontFamily: (value) => {
		const key = `${value || ``}`.trim().toLowerCase();
		const map = {
			sansserif: `sans-serif`,
			serif: `serif`,
			monospace: `monospace`,
			system: `system-ui`
		};
		return map[key] || null;
	},

	applyExtendedInline: (html) => {
		let output = html;
		output = output.replace(/\[\[color=([^\]]+)\]\]([\s\S]*?)\[\[\/color\]\]/gi,
			(match, rawColor, content) => {
				const color = AllSpeak_Markdown.normalizeColor(rawColor);
				if (!color) {
					return content;
				}
				return `<span style="color:${color};">${content}</span>`;
			});
		output = output.replace(/\[\[font=([^\]]+)\]\]([\s\S]*?)\[\[\/font\]\]/gi,
			(match, rawFont, content) => {
				const fontFamily = AllSpeak_Markdown.normalizeFontFamily(rawFont);
				if (!fontFamily) {
					return content;
				}
				return `<span style="font-family:${fontFamily};">${content}</span>`;
			});
		return output;
	},

	renderToHtml: (markdown) => {
		const source = `${markdown == null ? `` : markdown}`.replace(/\r\n?/g, `\n`);
		const parseInline = (text) => {
			let html = AllSpeak_Markdown.escapeHtml(text);
			html = html.replace(/`([^`]+)`/g, `<code>$1</code>`);
			html = html.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);
			html = html.replace(/__([^_]+)__/g, `<strong>$1</strong>`);
			html = html.replace(/(^|[^*])\*([^*]+)\*/g, `$1<em>$2</em>`);
			html = html.replace(/(^|[^_])_([^_]+)_/g, `$1<em>$2</em>`);
			html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
			html = AllSpeak_Markdown.applyExtendedInline(html);
			return html;
		};

		const out = [];
		let inCodeBlock = false;
		let inBlockquote = false;
		let listType = ``;
		let tableRows = [];
		const closeList = () => {
			if (listType) {
				out.push(`</${listType}>`);
				listType = ``;
			}
		};
		const closeBlockquote = () => {
			if (inBlockquote) {
				closeList();
				out.push(`</blockquote>`);
				inBlockquote = false;
			}
		};
		const parseTableRow = (line) => {
			return line.replace(/^\|/, ``).replace(/\|$/, ``).split(`|`).map(c => c.trim());
		};
		const flushTable = () => {
			if (tableRows.length === 0) return;
			const hasHeader = tableRows.length >= 2 && /^[\s|:-]+$/.test(tableRows[1]);
			out.push(`<table style="border-collapse:collapse;border:1px solid #ccc;">`);
			if (hasHeader) {
				const headers = parseTableRow(tableRows[0]);
				out.push(`<thead><tr>`);
				for (const cell of headers) {
					out.push(`<th style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</th>`);
				}
				out.push(`</tr></thead>`);
				out.push(`<tbody>`);
				for (let i = 2; i < tableRows.length; i++) {
					const cells = parseTableRow(tableRows[i]);
					out.push(`<tr>`);
					for (const cell of cells) {
						out.push(`<td style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</td>`);
					}
					out.push(`</tr>`);
				}
				out.push(`</tbody>`);
			} else {
				out.push(`<tbody>`);
				for (const row of tableRows) {
					const cells = parseTableRow(row);
					out.push(`<tr>`);
					for (const cell of cells) {
						out.push(`<td style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</td>`);
					}
					out.push(`</tr>`);
				}
				out.push(`</tbody>`);
			}
			out.push(`</table>`);
			tableRows = [];
		};

		for (const rawLine of source.split(`\n`)) {
			const line = rawLine;
			if (line.trim().startsWith(`\`\`\``)) {
				closeBlockquote();
				closeList();
				if (!inCodeBlock) {
					out.push(`<pre><code>`);
					inCodeBlock = true;
				} else {
					out.push(`</code></pre>`);
					inCodeBlock = false;
				}
				continue;
			}
			if (inCodeBlock) {
				out.push(`${AllSpeak_Markdown.escapeHtml(line)}\n`);
				continue;
			}

			if (line.trim().startsWith(`|`)) {
				closeBlockquote();
				closeList();
				tableRows.push(line.trim());
				continue;
			}
			flushTable();

			if (line.trim() === ``) {
				closeBlockquote();
				closeList();
				continue;
			}

			const quote = /^>\s?(.*)$/.exec(line);
			if (quote) {
				closeList();
				if (!inBlockquote) {
					out.push(`<blockquote>`);
					inBlockquote = true;
				}
				out.push(`<p>${parseInline(quote[1])}</p>`);
				continue;
			}
			closeBlockquote();

			const heading = /^(#{1,6})\s+(.*)$/.exec(line);
			if (heading) {
				closeList();
				const level = heading[1].length;
				out.push(`<h${level} style="font-family:sans-serif;">${parseInline(heading[2])}</h${level}>`);
				continue;
			}

			const ulist = /^[-*]\s+(.*)$/.exec(line);
			if (ulist) {
				if (listType !== `ul`) {
					closeList();
					listType = `ul`;
					out.push(`<ul>`);
				}
				out.push(`<li>${parseInline(ulist[1])}</li>`);
				continue;
			}

			const olist = /^\d+\.\s+(.*)$/.exec(line);
			if (olist) {
				if (listType !== `ol`) {
					closeList();
					listType = `ol`;
					out.push(`<ol>`);
				}
				out.push(`<li>${parseInline(olist[1])}</li>`);
				continue;
			}

			closeList();
			out.push(`<p>${parseInline(line)}</p>`);
		}

		flushTable();
		closeList();
		closeBlockquote();
		if (inCodeBlock) {
			out.push(`</code></pre>`);
		}
		return out.join(`\n`);
	}
};
// AllSpeak_Webson is a rendering engine for JSON-based markup scripts.

// The main entry point is AllSpeak_Webson.render(), which takes a container element,
// a name for the script, the script itself, and an optional options object.
// The script is a JSON object that describes the structure of the DOM
// to be created, along with any dynamic content or behavior.
// The script can include directives such as #element to specify
// the type of element to create, #content to specify the inner HTML
// or value of an element, #repeat to create multiple instances of an element
// based on an array, and #include to include another script.
// The AllSpeak_Webson engine processes the script recursively,
// building the DOM structure and applying any dynamic content or behavior
// as specified in the script.

// AllSpeak_Webson scripts can easily be generated by AI tools,
// allowing for dynamic and data-driven user interfaces.
// If you wish to take advantage of this you may need to 
// provide the AI engine with a link to the AllSpeak_Webson repository
// (https://github.com/allspeak/webson)
// for training purposes.
    
    const AllSpeak_Webson = {
    
    // Expand all variables in a value.
    // Expressions inside angle braces are fed to eval().
    expand: (element, input, symbols) => {
        let output = input;
        let mod = true;
        let values;
        let changed = false;
        if (typeof input === `object`) {
            const keys = Object.keys(input);
            for (let key of keys) {
                switch (key) {
                    case `#select`:
                        // Process an array selector
                        const value = AllSpeak_Webson.expand(element, input[key], symbols);
                        const index = input[`#index`];
                        if (typeof index === `undefined`) {
                            throw Error(`#select '${input[key]} has no #index`);
                        }
                        output = value[AllSpeak_Webson.expand(element, index, symbols)];
                        mod = true;
                        changed = true;
                        break;
                    default:
                        break;
                }
            }
        } else {
            while (mod) {
                mod = false;
                re = /(?:\#|\$)[a-zA-Z0-9_.]*/g;
                while ((values = re.exec(output)) !== null) {
                    let item = values[0];
                    switch (item[0]) {
                        case `#`:
                            // Evaluate system values
                            switch (item) {
                                case `#element_width`:
                                    output = output.replace(item, element.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#parent_width`:
                                    output = output.replace(
                                        item, element.parentElement.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#random`:
                                    output = output.replace(item, Math.floor(Math.random() * 10));
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#step`:
                                    output = output.replace(item, symbols[`#step`]);
                                    mod = true;
                                    changed = true;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case `$`:
                            let value = item;
                            const val = symbols[item];
                            if (Array.isArray(val)) {
                                output = val;
                            } else {
                                value = AllSpeak_Webson.expand(element, val, symbols);
                                output = output.replace(item, value);
                            }
                            mod = true;
                            changed = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        // Remove braces. Try to evaluate their contents.
        // If this doesn't work, assume it's a value that can't be further simplified.
        changed = true;
        while (changed) {
            changed = false;
            try {
                const p = output.lastIndexOf(`<`);
                if (p >= 0) {
                    const q = output.indexOf(`>`, p);
                    if (q < 0) {
                        throw Error(`Mismatched braces in ${input}`);
                    }
                    const substr = output.substring(p + 1, q);
                    if (!['b', '/b', 'i', '/i', 'br', '/br'].includes(substr)) {
                        let repl = `<${substr}>`;
                        try {
                            const v = eval(substr);
                            output = output.replace(repl, v);
                        } catch (e) {
                            output = output.replace(repl, substr);
                        }
                        changed = true;
                    }
                }
            }
            catch (e) {
            }
        }
        return output;
    },
    
    // Get the definitions from a set of items
    getDefinitions: (items, symbols) => {
        const keys = Object.keys(items);
        for (let key of keys) {
            if (key[0] === `$`) {
                symbols[key] = items[key];
            }
        }
    },
    
    // Include another script
    include: async (parent, name, path, symbols) => {
        if (symbols[`#debug`] >= 2) {
            console.log(`#include ${name}: ${path}`);
        }
        const response = await fetch(path, {
            cache: `no-store`
        });
        const script = await response.text();
        await AllSpeak_Webson.build(parent, name, JSON.parse(script), symbols);
    },

    // Cache for external text files
    textCache: {},

    // Load text content from file (cached)
    loadTextFile: async (path) => {
        if (typeof AllSpeak_Webson.textCache[path] !== `undefined`) {
            return AllSpeak_Webson.textCache[path];
        }
        const response = await fetch(path, {
            cache: `no-store`
        });
        if (!response.ok) {
            throw Error(`Unable to load text file '${path}' (${response.status})`);
        }
        const text = await response.text();
        AllSpeak_Webson.textCache[path] = text;
        return text;
    },

    // Resolve $variables backed by external text files
    resolveFileBackedSymbols: async (items, symbols, element) => {
        for (const key of Object.keys(items)) {
            if (key[0] !== `$`) {
                continue;
            }
            const def = items[key];
            if (typeof def !== `object` || Array.isArray(def) || def === null) {
                continue;
            }
            const filePathSpec = typeof def[`#textFile`] !== `undefined`
                ? def[`#textFile`]
                : def[`#file`];
            if (typeof filePathSpec === `undefined`) {
                continue;
            }
            const filePath = AllSpeak_Webson.expand(element, filePathSpec, symbols);
            const text = await AllSpeak_Webson.loadTextFile(filePath);
            items[key] = text;
            symbols[key] = text;
            if (symbols[`#debug`] >= 2) {
                console.log(`File variable ${key}: ${filePath}`);
            }
        }
    },

    waitForElementReady: (element) => {
        if (!element || element.tagName !== `IMG`) {
            return Promise.resolve();
        }
        if (element.complete) {
            return Promise.resolve();
        }
        const timeoutMs = 5000;
        return new Promise(resolve => {
            let finished = false;
            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                element.removeEventListener(`load`, finish);
                element.removeEventListener(`error`, finish);
                resolve();
            };
            element.addEventListener(`load`, finish);
            element.addEventListener(`error`, finish);
            setTimeout(finish, timeoutMs);
        });
    },

    nowMs: () => {
        if (typeof performance !== `undefined` && typeof performance.now === `function`) {
            return performance.now();
        }
        return Date.now();
    },

    timingEnabled: false,

    timingReporter: null,

    reportTiming: (message) => {
        if (!AllSpeak_Webson.timingEnabled) {
            return;
        }
        if (typeof AllSpeak_Webson.timingReporter === `function`) {
            AllSpeak_Webson.timingReporter(message);
        } else {
            console.log(message);
        }
    },

    // Build a DOM structure
    build: async (parent, name, items, parentSymbols) => {
        const buildStartedAt = AllSpeak_Webson.nowMs();
        if (typeof parent === `undefined`) {
            throw Error(`build: 'parent' is undefined`);
        }
        if (typeof name === `undefined`) {
            throw Error(`build: element is undefined (is the #element directive missing?`);
        }
        if (typeof items === `undefined`) {
            throw Error(`build: ${name} has no properties`);
        }
        const symbols = JSON.parse(JSON.stringify(parentSymbols));
        AllSpeak_Webson.getDefinitions(items, symbols);
        await AllSpeak_Webson.resolveFileBackedSymbols(items, symbols, parent);
        if (typeof items[`#debug`] !== `undefined`) {
            symbols[`#debug`] = items[`#debug`];
        }
        if (symbols[`#debug`] >= 2) {
            console.log(`Build ${name}`);
        }
        if (typeof items[`#doc`] !== `undefined` && symbols[`#debug`] >= 1) {
            console.log(items[`#doc`]);
        }

        let element = parent;
        const elementType = items[`#element`];
        if (typeof elementType !== `undefined`) {
            if (symbols[`#debug`] >= 2) {
                console.log(`#element: ${elementType}`);
            }
            element = document.createElement(elementType);
            parent.appendChild(element);
        }
        symbols[`#element`] = element;

        for (const key of Object.keys(items)) {
            let value = items[key];
            switch (key) {
                case `#`:
                case `#debug`:
                case `#doc`:
                case `#element`:
                    break;
                case `#content`:
                    var val = ``;
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            val += AllSpeak_Webson.expand(element, item, symbols);
                        }
                    } else {
                        val = AllSpeak_Webson.expand(element, value, symbols);
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#content: ${value} -> ${val}`);
                    }
                    symbols[value] = val;
                    switch (element.type) {
                        case `text`:
                        case `textarea`:
                        case `input`:
                            element.value = val;
                            break;
                        default:
                            element.innerHTML = val;
                            break;
                    }
                    break;
                case `#repeat`:
                    symbols[`#steps`] = 0;
                    for (let item in value) {
                        switch (item) {
                            case `#doc`:
                                if (symbols[`#debug`] >= 1) {
                                    console.log(value[item]);
                                }
                                break;
                            case `#target`:
                                symbols[`#target`] = value[item];
                                break;
                            case `#steps`:
                                const stepspec = value[item];
                                for (let stepitem in stepspec) {
                                    switch (stepitem) {
                                        case `#arraysize`:
                                            const targetName = stepspec[stepitem];
                                            symbols[`#steps`] = symbols[targetName].length;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#repeat: ${symbols[`#target`]}, ${symbols[`#steps`]}`);
                    }
                    for (let step = 0; step < symbols[`#steps`]; step++) {
                        symbols[`#step`] = step;
                        await AllSpeak_Webson.build(element, `${name}[${step}]`, symbols[symbols[`#target`]], symbols);
                    }
                    break;
                case `#include`:
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            const defs = Object.keys(item);
                            const includeName = defs[0];
                            const path = item[includeName];
                            await AllSpeak_Webson.include(element, includeName, path, symbols);
                        }
                    } else if (typeof value === `object`) {
                        const defs = Object.keys(value);
                        const includeName = defs[0];
                        const path = value[includeName];
                        await AllSpeak_Webson.include(element, includeName, path, symbols);
                    } else {
                        await AllSpeak_Webson.include(element, value, value, symbols);
                    }
                    break;
                case `#switch`:
                    for (let state of Object.keys(value)) {
                        if (state === symbols[`#state`]) {
                            await AllSpeak_Webson.build(element, value[state], symbols[value[state]], symbols);
                            return;
                        }
                    }
                    await AllSpeak_Webson.build(element, name, symbols[value[`default`]], symbols);
                    return;
                case `#onClick`:
                    element.onClickItems = value;
                    element.onclick = function (event) {
                        event.stopPropagation();
                        for (let state of Object.keys(element.onClickItems)) {
                            if (state === symbols[`#state`]) {
                                AllSpeak_Webson.parent.replaceChildren();
                                void AllSpeak_Webson.build(AllSpeak_Webson.parent, AllSpeak_Webson.name, AllSpeak_Webson.script, {
                                    "debug": 0,
                                    "#state": value[state]
                                });
                                return false;
                            }
                        }
                        return false;
                    };
                    break;
                default:
                    if (key[0] === `@`) {
                        const aName = key.substring(1);
                        const aValue = AllSpeak_Webson.expand(parent, value, symbols);
                        if (typeof aValue === `undefined`) {
                            throw Error(`Element ${value} could not be found`);
                        }
                        element.setAttribute(aName, aValue);
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Attribute ${aName}: ${JSON.stringify(value, 0, 0)} -> ${aValue}`);
                        }
                    } else if (key[0] === `$`) {
                        const userVal = AllSpeak_Webson.expand(element, value, symbols);
                        symbols[key] = userVal;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Variable ${key}: ${JSON.stringify(value, 0, 0)} -> ${userVal}`);
                        }
                    } else {
                        const styleVal = AllSpeak_Webson.expand(element, value, symbols);
                        if (key.includes(`-`) || key.startsWith(`--`)) {
                            element.style.setProperty(key, styleVal);
                        } else {
                            element.style[key] = styleVal;
                        }
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Style ${key}: ${JSON.stringify(value, 0, 0)} -> ${styleVal}`);
                        }
                    }
                    break;
            }
        }

        if (typeof items[`#`] !== `undefined`) {
            const data = items[`#`];
            if (Array.isArray(data)) {
                for (const childName of data) {
                    await AllSpeak_Webson.build(element, childName, symbols[childName], symbols);
                }
            } else if (data[0] === `$`) {
                await AllSpeak_Webson.build(element, data, symbols[data], symbols);
            }
        }

        const waitStartedAt = AllSpeak_Webson.nowMs();
        await AllSpeak_Webson.waitForElementReady(element);
        const waitElapsed = Math.round(Webson.nowMs() - waitStartedAt);
        const totalElapsed = Math.round(AllSpeak_Webson.nowMs() - buildStartedAt);
        const tag = element && element.tagName ? element.tagName.toLowerCase() : `unknown`;
        AllSpeak_Webson.reportTiming(`[WebsonTiming] name='${name}' tag='${tag}' wait=${waitElapsed}ms total=${totalElapsed}ms`);
    },

    // Render a script into a given container
    render: async (parent, name, script, options = {}) => {
        AllSpeak_Webson.parent = parent;
        AllSpeak_Webson.name = name;
        AllSpeak_Webson.script = typeof script === `string` ? JSON.parse(script) : script;
        AllSpeak_Webson.timingEnabled = !!options.timingEnabled;
        AllSpeak_Webson.timingReporter = typeof options.timingReporter === `function`
            ? options.timingReporter
            : null;
        await AllSpeak_Webson.build(parent, name, AllSpeak_Webson.script, {
            "#debug": Number.isFinite(options.debug) ? options.debug : 0,
            "#state": options.state || "default"
        });
    }
};

if (typeof globalThis !== `undefined`) {
    globalThis.Webson = AllSpeak_Webson;
}

if (typeof module !== `undefined` && module.exports) {
    module.exports = AllSpeak_Webson;
}
const AllSpeak_JSON = {

	name: `AllSpeak_JSON`,

	normalizeComparable: (entry) => {
		if (typeof entry !== `string`) {
			return entry;
		}
		const trimmed = entry.trim();
		if ((trimmed.startsWith(`"`) && trimmed.endsWith(`"`)) ||
			(trimmed.startsWith(`'`) && trimmed.endsWith(`'`))) {
			try {
				return JSON.parse(trimmed.replace(/^'/, `"`).replace(/'$/, `"`));
			} catch (err) {
				return trimmed.substring(1, trimmed.length - 1);
			}
		}
		return entry;
	},

	areComparableEqual: (left, right) => {
		return AllSpeak_JSON.normalizeComparable(left) === AllSpeak_JSON.normalizeComparable(right);
	},

	// Helper to add or-handling after a json command
	addOrHandling: (compiler, pc) => {
		if (compiler.isWord(`or`)) {
			compiler.next();
			compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
			compiler.completeHandler();
		}
	},

	Json: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = AllSpeak_Language.reverseWord(compiler.nextToken());
			let item;
			switch (request) {
			case `set`:
				compiler.next();
				if (compiler.isSymbol()) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						if (compiler.nextIsWord(`to`)) {
							const type = compiler.nextToken();
							if ([`array`, `object`].includes(AllSpeak_Language.reverseWord(type))) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request: `setVariable`,
									target: targetRecord.name,
									type: AllSpeak_Language.reverseWord(type)
								});
								return true;
							}
						}
					} else if (targetRecord.keyword === `select`) {
						if (compiler.nextIsWord(`from`)) {
							compiler.next();
							if (compiler.isSymbol()) {
								const sourceRecord = compiler.getSymbolRecord();
								if (sourceRecord.keyword === `variable`) {
									var display = null;
									if (compiler.nextIsWord(`as`)) {
										display = compiler.getNextValue();
									}
									const pc = compiler.getPc();
									compiler.addCommand({
										domain: `json`,
										keyword: `json`,
										lino,
										request: `setList`,
										target: targetRecord.name,
										source: sourceRecord.name,
										display,
										onError: 0
									});
									AllSpeak_JSON.addOrHandling(compiler, pc);
									return true;
								}
							}
						}
					}
					break;
				}
				break;
			case `sort`:
			case `shuffle`:
			case `format`:
				if (compiler.nextIsSymbol()) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						compiler.next();
						const pc = compiler.getPc();
						compiler.addCommand({
							domain: `json`,
							keyword: `json`,
							lino,
							request,
							target: targetRecord.name,
							onError: 0
						});
						AllSpeak_JSON.addOrHandling(compiler, pc);
						return true;
					}
				}
				break;
			case `parse`:
				if (compiler.nextIsWord(`url`)) {
					const source = compiler.getNextValue();
					if (compiler.isWord(`as`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									source,
									target: targetRecord.name
								});
								return true;
							}
						}
					}
				}
				break;
			case `delete`:
				const what = compiler.nextToken();
				if ([`property`, `element`].includes(what)) {
					const value = compiler.getNextValue();
					if ([AllSpeak_Language.word(`from`), AllSpeak_Language.word(`of`)].includes(compiler.getToken())) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								const pc = compiler.getPc();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									what,
									value,
									target: targetRecord.name,
									onError: 0
								});
								AllSpeak_JSON.addOrHandling(compiler, pc);
								return true;
							}
						}
					}
				}
				break;
			case `rename`:
				const oldName = compiler.getNextValue();
				if (compiler.isWord(`to`)) {
					const newName = compiler.getNextValue();
					if (compiler.isWord(`in`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								const pc = compiler.getPc();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									oldName,
									newName,
									target: targetRecord.name,
									onError: 0
								});
								AllSpeak_JSON.addOrHandling(compiler, pc);
								return true;
							}
						}
					}
				}
				break;
			case `add`:
				item = compiler.getNextValue();
				if (compiler.isWord(`to`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							compiler.next();
							const pc = compiler.getPc();
							compiler.addCommand({
								domain: `json`,
								keyword: `json`,
								lino,
								request,
								item,
								target: targetRecord.name,
								onError: 0
							});
							AllSpeak_JSON.addOrHandling(compiler, pc);
							return true;
						}
					}
				}
				break;
			case `split`:
				item = compiler.getNextValue();
				let on = `\n`;
				if (compiler.isWord(`on`)) {
					on = compiler.getNextValue();
				}
				if ([AllSpeak_Language.word(`giving`), AllSpeak_Language.word(`into`)].includes(compiler.getToken())) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							compiler.next();
							compiler.addCommand({
								domain: `json`,
								keyword: `json`,
								lino,
								request,
								item,
								on,
								target: targetRecord.name
							});
							return true;
						}
					}
				}
				break;
			case `replace`:
				if (compiler.nextIsWord(`element`)) {
					const index = compiler.getNextValue();
					if (compiler.isWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								if ([AllSpeak_Language.word(`by`), AllSpeak_Language.word(`with`)].includes(compiler.nextToken())) {
									const value = compiler.getNextValue();
									const pc = compiler.getPc();
									compiler.addCommand({
										domain: `json`,
										keyword: `json`,
										lino,
										request,
										target: targetRecord.name,
										index,
										value,
										onError: 0
									});
									AllSpeak_JSON.addOrHandling(compiler, pc);
									return true;
								}
							}
						}
					}
				}
				break;
			}
			compiler.addWarning(`Unrecognised json command syntax`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let sourceRecord;
			let targetRecord;
			let record;
			let content;
			let array;
			switch (command.request) {
			case `setVariable`:
				targetRecord = program.getSymbolRecord(command.target);
				content = (command.type === `array`) ? `[]` : `{}`;
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content
				};
				break;
			case `setList`:
				// The source is assumed to be a JSON array
				sourceRecord = program.getSymbolRecord(command.source);
				const sourceData = program.getValue(sourceRecord.value[sourceRecord.index]);
				var itemArray = ``;
				try {
					itemArray = JSON.parse(sourceData);
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `Can't parse JSON`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `Can't parse JSON`);
					return 0;
				}
				// The target is assumed to be a SELECT
				targetRecord = program.getSymbolRecord(command.target);
				const target = targetRecord.element[targetRecord.index];
				target.options.length = 0;
				// Get the name of the display field
				const display = program.getValue(command.display);
				// For each item, set the title and inner HTML
				itemArray.forEach(function (item) {
					const title = display ? program.decode(item[display]) : null;
					const opt = document.createElement(`option`);
					const innerHTML = title ? title : item;
					opt.innerHTML = innerHTML;
					const value = title ? JSON.stringify(item) : item;
					opt.value = value;
					target.appendChild(opt);
				});
				target.selectedIndex = -1;
				break;
			case `sort`:
				targetRecord = program.getSymbolRecord(command.target);
				try {
					const list = program.getValue(targetRecord.value[targetRecord.index]);
					content = list ? JSON.stringify(JSON.parse(list).sort()) : null;
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content
					};
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `Can't parse JSON for sort`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `Can't parse JSON for sort`);
					return 0;
				}
				break;
			case `shuffle`:
				targetRecord = program.getSymbolRecord(command.target);
				try {
					array = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
					for (let i = array.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[array[i], array[j]] = [array[j], array[i]];
					}
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content: JSON.stringify(array)
					};
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `Can't parse JSON for shuffle`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `Can't parse JSON for shuffle`);
					return 0;
				}
				break;
			case `format`:
				targetRecord = program.getSymbolRecord(command.target);
				try {
					const val = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content: JSON.stringify(val, null, 2)
					};
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `Can't parse JSON for format`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `Can't parse JSON for format`);
					return 0;
				}
				break;
			case `parse`:
				var source = program.getValue(command.source);
				targetRecord = program.getSymbolRecord(command.target);
				content = {
					url: source
				};
				var n = source.indexOf(`://`);
				if (n >= 0) {
					n += 3;
					content.protocol = source.substr(0, n);
					source = source.substr(n);
				}
				n = source.indexOf(`?`);
				if (n > 0) {
					content.domain = source.substr(0, n);
					content.arg = source.substr(n + 1);
				} else {
					content.domain = source;
				}
				if (content.domain.endsWith(`/`)) {
					content.domain = content.domain.slice(0, -1);
				}
				n = content.domain.indexOf(`/`);
				if (n > 0) {
					content.path = content.domain.substr(n + 1);
					content.domain = content.domain.substr(0, n);
				}
				else {
					content.path = ``;
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(content, null, 2)
				};
				break;
			case `delete`:
				try {
					switch (command.what) {
					case `property`:
						const name = program.getValue(command.value);
						targetRecord = program.getSymbolRecord(command.target);
						record = JSON.parse(targetRecord.value[targetRecord.index].content);
						delete record[name];
						targetRecord.value[targetRecord.index].content = JSON.stringify(record);
						break;
					case `element`:
						const element = program.getValue(command.value);
						targetRecord = program.getSymbolRecord(command.target);
						record = JSON.parse(targetRecord.value[targetRecord.index].content);
						record.splice(element, 1);
						targetRecord.value[targetRecord.index].content = JSON.stringify(record);
						break;
					}
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `JSON delete failed: ${err.message}`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `JSON delete failed: ${err.message}`);
					return 0;
				}
				break;
			case `rename`:
				try {
					const oldName = program.getValue(command.oldName);
					const newName = program.getValue(command.newName);
					targetRecord = program.getSymbolRecord(command.target);
					record = JSON.parse(targetRecord.value[targetRecord.index].content);
					content = record[oldName];
					delete record[oldName];
					record[newName] = content;
					targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `JSON rename failed: ${err.message}`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `JSON rename failed: ${err.message}`);
					return 0;
				}
				break;
			case `add`:
				try {
					content = program.getValue(command.item);
					targetRecord = program.getSymbolRecord(command.target);
					const existing = targetRecord.value[targetRecord.index].content;
					record = existing ? JSON.parse(existing) : [];
					record.push(program.isJsonString(content) ? JSON.parse(content) :content);
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content: JSON.stringify(record)
					};
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `JSON add failed: ${err.message}`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `JSON add failed: ${err.message}`);
					return 0;
				}
				break;
			case `split`:
				content = program.getValue(command.item);
				const on = program.getValue(command.on);
				let splitItems;
				try {
					const parsed = JSON.parse(content);
					splitItems = Array.isArray(parsed) ? parsed : content.split(on);
				} catch (err) {
					splitItems = content.split(on);
				}
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(splitItems)
				};
				break;
			case `replace`:
				try {
					targetRecord = program.getSymbolRecord(command.target);
					const index = program.getValue(command.index);
					const value = program.getValue(command.value);
					const current = targetRecord.value[targetRecord.index].content;
					record = current ? JSON.parse(current) : [];
					if (index > record.length - 1) {
						throw new Error(`Index out of range`);
					}
					record[index] = value;
					targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				} catch (err) {
					if (command.onError) {
						program.errorMessage = `JSON replace failed: ${err.message}`;
						program.run(command.onError);
						return 0;
					}
					program.runtimeError(command.lino, `JSON replace failed: ${err.message}`);
					return 0;
				}
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: function(name) {
		// JSON domain has one compile keyword: 'json' (language-aware)
		if (name === AllSpeak_Language.word(`json`)) {
			return this.Json;
		}
		return null;
	},

	opcodeMap: {
		JSON_SET_VAR: `Json`, JSON_SET_LIST: `Json`, JSON_PARSE: `Json`,
		JSON_FORMAT: `Json`, JSON_SORT: `Json`, JSON_SHUFFLE: `Json`,
		JSON_DELETE: `Json`, JSON_RENAME: `Json`, JSON_ADD: `Json`,
		JSON_SPLIT: `Json`, JSON_REPLACE: `Json`
	},

	run: (program) => {
		const command = program[program.pc];
		let handler;
		if (command.opcode && AllSpeak_JSON.opcodeMap[command.opcode]) {
			handler = AllSpeak_JSON[AllSpeak_JSON.opcodeMap[command.opcode]];
		}
		if (!handler) {
			handler = AllSpeak_JSON.getHandler(command.keyword);
		}
		if (!handler) {
			program.runtimeError(command.lino, `Unknown command '${command.opcode || command.keyword}' in 'json' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.isWord(`the`)) {
				compiler.next();
			}
			if (compiler.isWord(`json`)) {
				const type = AllSpeak_Language.reverseWord(compiler.nextToken());
				if ([`size`, `count`].includes(type)) {
					compiler.skipWord(`of`);
					if (compiler.isSymbol()) {
						const target = compiler.getSymbolRecord();
						compiler.next();
						if (target.isVHolder) {
							return {
								domain: `json`,
								type,
								name: target.name
							};
						}
					}
				} else if (type === `keys`) {
					let sorted = true;
					if (compiler.nextIsWord(`unsorted`)) {
						sorted = false;
						compiler.next();
					}
					if (compiler.isWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const target = compiler.getSymbolRecord();
							compiler.next();
							if (target.isVHolder) {
								return {
									domain: `json`,
									type,
									name: target.name,
									sorted
								};
							}
						}
					}
				} else if (type === `index`) {
					if (compiler.nextIsWord(`of`)) {
						const item = compiler.getNextValue();
						if (compiler.isWord(`in`)) {
							const list = compiler.getNextValue();
							return {
								domain: `json`,
								type,
								item,
								list
							};
						}
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			let symbolRecord;
			let data;
			let content;
			switch (value.type) {
			case `size`:
			case `count`:
				symbolRecord = program.getSymbolRecord(value.name);
				data = program.getValue(symbolRecord.value[symbolRecord.index]);
				let array;
				try {
					array = JSON.parse(data);
				} catch (err) {
					array = [];
				}
				return {
					type: `constant`,
					numeric: true,
					content: array ? array.length : 0
				};
			case `keys`:
				symbolRecord = program.getSymbolRecord(value.name);
				data = program.getValue(symbolRecord.value[symbolRecord.index]);
				content = data ? JSON.stringify(Object.keys(JSON.parse(data)).sort()) : `[]`;
				if (data) {
					content = Object.keys(JSON.parse(data));
					if (value.sorted) {
						content= content.sort();
					}
					content = JSON.stringify(content);
				} else {
					content = `[]`;
				}
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `index`:
				const item = program.getValue(value.item);
				const list = JSON.parse(program.getValue(value.list));
				content = list.findIndex(function (entry) {
					return AllSpeak_JSON.areComparableEqual(entry, item);
				});
				return {
					type: `constant`,
					numeric: true,
					content
				};
			}
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};
/**
 * AllSpeak MQTT Plugin for JavaScript
 *
 * Provides MQTT client functionality with support for:
 * - Topic declaration and subscription
 * - MQTT client connection
 * - Message publishing and receiving
 * - Message chunking for large payloads
 * - Event handlers (on connect, on message)
 *
 * Based on the Python implementation in as_mqtt.py
 * Requires: MQTT.js library (https://github.com/mqttjs/MQTT.js)
 */

const AllSpeak_MQTT = {

    name: `AllSpeak_MQTT`,

    mqttClauseKeywords: new Set(['token', 'id', 'broker', 'port', 'subscribe', 'action']),

    base64UrlToBytes: function(value) {
        const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
            + '='.repeat((4 - (value.length % 4)) % 4);
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let n = 0; n < binary.length; n++) {
            bytes[n] = binary.charCodeAt(n);
        }
        return bytes;
    },

    pkcs7Unpad: function(bytes) {
        if (!bytes || bytes.length === 0) {
            throw new Error('Invalid Fernet payload');
        }
        const pad = bytes[bytes.length - 1];
        if (pad < 1 || pad > 16 || pad > bytes.length) {
            throw new Error('Invalid Fernet padding');
        }
        for (let n = bytes.length - pad; n < bytes.length; n++) {
            if (bytes[n] !== pad) {
                throw new Error('Invalid Fernet padding');
            }
        }
        return bytes.slice(0, bytes.length - pad);
    },

    decryptFernetToken: async function(encryptedToken, key) {
        if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
            throw new Error('Fernet decryption requires browser Web Crypto support');
        }

        const tokenBytes = AllSpeak_MQTT.base64UrlToBytes(encryptedToken);
        const keyBytes = AllSpeak_MQTT.base64UrlToBytes(key);

        if (keyBytes.length !== 32) {
            throw new Error('Invalid Fernet key length');
        }
        if (tokenBytes.length < 1 + 8 + 16 + 32) {
            throw new Error('Invalid Fernet token length');
        }

        const version = tokenBytes[0];
        if (version !== 0x80) {
            throw new Error('Unsupported Fernet token version');
        }

        const signingKey = keyBytes.slice(0, 16);
        const encryptionKey = keyBytes.slice(16, 32);
        const hmacStart = tokenBytes.length - 32;
        const signedPart = tokenBytes.slice(0, hmacStart);
        const providedHmac = tokenBytes.slice(hmacStart);

        const hmacKey = await crypto.subtle.importKey(
            'raw',
            signingKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const valid = await crypto.subtle.verify('HMAC', hmacKey, providedHmac, signedPart);
        if (!valid) {
            throw new Error('Invalid Fernet signature');
        }

        const iv = tokenBytes.slice(1 + 8, 1 + 8 + 16);
        const ciphertext = tokenBytes.slice(1 + 8 + 16, hmacStart);

        const aesKey = await crypto.subtle.importKey(
            'raw',
            encryptionKey,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        let plainBytes;
        try {
            plainBytes = new Uint8Array(await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv },
                aesKey,
                ciphertext
            ));
        } catch (error) {
            throw new Error('Fernet decryption failed');
        }

        // Web Crypto AES-CBC already applies PKCS#7 unpadding.
        return new TextDecoder().decode(plainBytes);
    },

    // MQTT Client class
    MQTTClient: class {
        constructor() {
            this.program = null;
            this.token = null;
            this.clientID = null;
            this.broker = null;
            this.port = null;
            this.topics = [];
            this.client = null;
            this.onConnectPC = null;
            this.onMessagePC = null;
            this.onErrorPC = null;
            this.message = null;
            this.lastError = null;
            this.errorFired = false;
            this.chunkedMessages = {};  // Store incoming chunked messages
            this.chunkSize = 1024;      // Default chunk size
            this.lastSendTime = null;   // Time for last transmission
            this.connected = false;     // Ignore duplicate reconnect callbacks
        }

        create(program, token, clientID, broker, port, topics) {
            this.program = program;
            this.token = token;
            this.clientID = clientID;
            this.broker = broker;
            this.port = parseInt(port, 10);
            this.topics = topics || [];
            const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

            let url;
            const options = {
                clientId: this.clientID
            };

            if (this.broker === 'mqtt.flespi.io') {
                const wsPort = this.port === 8883 ? 443 : this.port;
                url = isBrowser
                    ? `wss://${this.broker}:${wsPort}`
                    : `mqtts://${this.broker}:${this.port}`;
                options.username = this.token;
                options.password = '';
            } else if (this.broker === 'test.mosquitto.org') {
                url = isBrowser
                    ? `wss://${this.broker}:8081`
                    : `mqtt://${this.broker}:${this.port}`;
            } else {
                url = isBrowser
                    ? (this.port === 443 ? `wss://${this.broker}/mqtt` : `wss://${this.broker}:${this.port}`)
                    : `mqtts://${this.broker}:${this.port}`;
                if (this.token && typeof this.token === 'object') {
                    options.username = this.token.username;
                    options.password = this.token.password;
                }
            }

            this.client = mqtt.connect(url, options);

            // Setup event handlers
            this.client.on('connect', () => this.onConnect());
            this.client.on('message', (topic, payload) => this.onMessage(topic, payload));
            this.client.on('error', (error) => {
                console.error('MQTT connection error:', error);
                if (!this.errorFired) {
                    this.errorFired = true;
                    this.lastError = error.message || String(error);
                    this.program.errorMessage = this.lastError;
                    this.client.end(true);
                    this._queueProgramCallback(this.onErrorPC);
                }
            });
            this.client.on('close', () => console.warn('MQTT connection closed'));
        }

        onConnect() {
            const isFirstConnect = !this.connected;
            this.connected = true;
            AllSpeak.writeToDebugConsole(`Client ${this.clientID} connected`);

            // Subscribe to all topics
            for (const topicName of this.topics) {
                const topicRecord = this.program.getSymbolRecord(topicName);
                const topic = topicRecord.object;
                const qos = topic.getQoS();
                this.client.subscribe(topic.getName(), { qos });
                AllSpeak.writeToDebugConsole(`Subscribed to topic: ${topic.getName()} with QoS ${qos}`);
            }

            if (isFirstConnect) {
                this._queueProgramCallback(this.onConnectPC);
            }
        }

        onMessage(topic, payload) {
            const payloadBytes = this._toUint8Array(payload);
            if (this._startsWithAscii(payloadBytes, '!part!')) {
                try {
                    const partEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (partEnd > 6) {
                        const partNum = this._parseAsciiInt(payloadBytes.slice(6, partEnd));
                        const totalEnd = this._indexByte(payloadBytes, 0x20, partEnd + 1);
                        if (totalEnd > partEnd) {
                            const totalChunks = this._parseAsciiInt(payloadBytes.slice(partEnd + 1, totalEnd));
                            const data = payloadBytes.slice(totalEnd + 1);

                            if (partNum === 0) {
                                this.chunkedMessages[topic] = {};
                            }

                            if (this.chunkedMessages[topic]) {
                                this.chunkedMessages[topic][partNum] = data;
                                // AllSpeak.writeToDebugConsole(`Received chunk ${partNum}/${totalChunks - 1} on topic ${topic}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing chunked message:', e);
                }
                return;
            }

            if (this._startsWithAscii(payloadBytes, '!last!')) {
                try {
                    const totalEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (totalEnd > 6) {
                        const totalChunks = this._parseAsciiInt(payloadBytes.slice(6, totalEnd));
                        const data = payloadBytes.slice(totalEnd + 1);

                        if (!this.chunkedMessages[topic]) {
                            this.chunkedMessages[topic] = {};
                        }

                        this.chunkedMessages[topic][totalChunks - 1] = data;

                        const expectedParts = new Set();
                        for (let i = 0; i < totalChunks; i++) {
                            expectedParts.add(i);
                        }
                        const receivedParts = new Set(Object.keys(this.chunkedMessages[topic]).map(k => parseInt(k)));

                        if (expectedParts.size === receivedParts.size &&
                            [...expectedParts].every(p => receivedParts.has(p))) {
                            const messageParts = [];
                            for (let i = 0; i < totalChunks; i++) {
                                messageParts.push(this.chunkedMessages[topic][i]);
                            }
                            const completeMessage = this._decodeUtf8(this._concatBytes(messageParts));
                            delete this.chunkedMessages[topic];

                            try {
                                this.message = JSON.parse(completeMessage);
                                try {
                                    this.message.message = JSON.parse(this.message.message);
                                } catch (e) {
                                }
                            } catch (e) {
                                this.message = completeMessage;
                            }

                            this._queueProgramCallback(this.onMessagePC);
                        } else {
                            console.warn('Warning: Missing chunks for topic ' + topic);
                        }
                    }
                } catch (e) {
                    console.error('Error assembling chunked message:', e);
                }
                return;
            }

            const message = this._decodeUtf8(payloadBytes);

            // Regular non-chunked message
            let parsed;
            try {
                parsed = JSON.parse(message);
                try {
                    parsed.message = JSON.parse(parsed.message);
                } catch (e) {
                    // Leave message as string
                }
            } catch (e) {
                parsed = message;
            }

            // Check if this is a confirmation ack
            if (parsed && typeof parsed === 'object' && parsed.action === 'confirm' && parsed._confirmId) {
                if (this.pendingConfirms && this.pendingConfirms[parsed._confirmId]) {
                    this.pendingConfirms[parsed._confirmId]();
                }
                return;
            }

            this.message = parsed;
            this._queueProgramCallback(this.onMessagePC);
        }

        getReceivedMessage() {
            let value = this.message;
            value = value && value.message ? value.message : value;
            return value;
        }

        getError() {
            return this.lastError || '';
        }

        sendMessage(topic, message, qos, chunkSize) {
            const sendStart = Date.now();
            // Match Python behavior: non-positive chunk size means "single chunk"
            chunkSize = Number(chunkSize || 0);

            // Convert message to string
            let messageStr;
            if (message instanceof Uint8Array) {
                messageStr = this._decodeUtf8(message);
            } else if (typeof message === 'string') {
                messageStr = message;
            } else {
                messageStr = String(message);
            }

            // Convert to UTF-8 bytes
            const encoder = new TextEncoder();
            const messageBytes = encoder.encode(messageStr);
            if (chunkSize <= 0) {
                chunkSize = messageBytes.length || 1;
            }
            const messageLen = messageBytes.length;
            const numChunks = Math.ceil(messageLen / chunkSize);

            // AllSpeak.writeToDebugConsole(`Sending message (${messageLen} bytes) in ${numChunks} chunks of size ${chunkSize} to topic ${topic} with QoS ${qos}`);

            return this._sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks)
                .then((ok) => {
                    this.lastSendTime = (Date.now() - sendStart) / 1000;
                    return ok;
                });
        }

        _sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks) {
            const promises = [];
            for (let i = 0; i < numChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, messageBytes.length);
                const chunkData = messageBytes.slice(start, end);

                let header;
                if (i === numChunks - 1) {
                    header = `!last!${numChunks} `;
                } else {
                    header = `!part!${i} ${numChunks} `;
                }

                const headerBytes = new TextEncoder().encode(header);
                const chunkMsg = this._concatBytes([headerBytes, chunkData]);
                promises.push(new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('PUBACK timeout')), 5000);
                    this.client.publish(topic, chunkMsg, { qos }, (err) => {
                        clearTimeout(timer);
                        if (err) reject(err);
                        else resolve(true);
                    });
                }));
                // AllSpeak.writeToDebugConsole(`Sent chunk ${i}/${numChunks - 1} to topic ${topic} with QoS ${qos}: ${chunkMsg.byteLength} bytes`);
            }
            return Promise.all(promises).then(() => true).catch(() => false);
        }

        _toUint8Array(value) {
            if (value instanceof Uint8Array) {
                return value;
            }
            if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
                return new Uint8Array(value);
            }
            if (typeof value === 'string') {
                return new TextEncoder().encode(value);
            }
            if (value && value.buffer instanceof ArrayBuffer) {
                return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
            }
            return new Uint8Array(0);
        }

        _decodeUtf8(bytes) {
            return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }

        _concatBytes(parts) {
            const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const part of parts) {
                merged.set(part, offset);
                offset += part.byteLength;
            }
            return merged;
        }

        _startsWithAscii(bytes, text) {
            const ascii = new TextEncoder().encode(text);
            if (bytes.byteLength < ascii.byteLength) {
                return false;
            }
            for (let i = 0; i < ascii.byteLength; i++) {
                if (bytes[i] !== ascii[i]) {
                    return false;
                }
            }
            return true;
        }

        _indexByte(bytes, byteValue, fromIndex) {
            for (let i = fromIndex; i < bytes.byteLength; i++) {
                if (bytes[i] === byteValue) {
                    return i;
                }
            }
            return -1;
        }

        _parseAsciiInt(bytes) {
            const parsed = parseInt(new TextDecoder('ascii').decode(bytes), 10);
            if (Number.isNaN(parsed)) {
                throw new Error('Invalid numeric header');
            }
            return parsed;
        }

        _queueProgramCallback(pc) {
            if (pc === null || pc === undefined) {
                return;
            }
            if (this.program && typeof this.program.queueIntent === 'function') {
                this.program.queueIntent(pc);
                return;
            }
            if (this.program && typeof this.program.run === 'function') {
                this.program.run(pc);
            }
        }
    },

    // ECTopic class - represents an MQTT topic
    ECTopic: class {
        constructor() {
            this.value = null;
        }

        setValue(value) {
            this.value = value;
        }

        getValue() {
            return this.value;
        }

        getName() {
            if (!this.value) return '';
            return this.value.name || '';
        }

        getQoS() {
            if (!this.value) return 0;
            return parseInt(this.value.qos) || 0;
        }

        textify() {
            if (!this.value) return '';
            return JSON.stringify({
                name: this.value.name,
                qos: this.value.qos
            });
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: init {topic} name {name} qos {qos}
    Init: {
        compile: compiler => {
            const lino = compiler.getLino();
            if (compiler.nextIsSymbol()) {
                const record = compiler.getSymbolRecord();
                const topic = record.name;
                compiler.skip('name');
                const name = compiler.getValue();
                compiler.skip('qos');
                const qos = compiler.getValue();

                compiler.addCommand({
                    domain: 'mqtt',
                    keyword: 'init',
                    lino,
                    topic,
                    name,
                    qos
                });
                return true;
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const record = program.getSymbolRecord(command.topic);
            const topic = new AllSpeak_MQTT.ECTopic();
            const value = {
                name: program.getValue(command.name),
                qos: parseInt(program.getValue(command.qos))
            };
            topic.setValue(value);
            record.object = topic;
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: mqtt token {token} [{secretKey}] id {clientID} broker {broker} port {port} subscribe {topic} [and {topic} ...]
    MQTT: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'mqtt',
                lino,
                requires: {},
                topics: []
            };

            compiler.nextToken(); // skip 'mqtt'
            while (true) {
                const token = compiler.getToken();
                if (token === 'token') {
                    command.token = compiler.getNextValue();
                    if (!AllSpeak_MQTT.mqttClauseKeywords.has(compiler.getToken())) {
                        command.tokenKey = compiler.getValue();
                    }
                } else if (token === 'id') {
                    command.clientID = compiler.getNextValue();
                } else if (token === 'broker') {
                    command.broker = compiler.getNextValue();
                } else if (token === 'port') {
                    command.port = compiler.getNextValue();
                } else if (token === 'subscribe') {
                    const topics = [];
                    while (compiler.nextIsSymbol()) {
                        const record = compiler.getSymbolRecord();
                        topics.push(record.name);
                        if (compiler.peek() === 'and') {
                            compiler.next();
                        } else {
                            compiler.next();
                            break;
                        }
                    }
                    command.topics = topics;
                } else if (token === 'action') {
                    const action = compiler.nextToken();
                    const reqList = [];
                    if (compiler.nextIs('requires')) {
                        while (true) {
                            reqList.push(compiler.nextToken());
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                compiler.next();
                                break;
                            }
                        }
                    }
                    command.requires[action] = reqList;
                } else {
                    break;
                }
            }

            compiler.addCommand(command);
            return true;
        },

        run: program => {
            const command = program[program.pc];

            if (program.mqttClient) {
                program.runtimeError(command.lino, 'MQTT client already defined');
            }

            const clientID = program.getValue(command.clientID);
            const broker = program.getValue(command.broker);
            const port = program.getValue(command.port);
            const topics = command.topics;

            const finalizeClient = token => {
                const client = new AllSpeak_MQTT.MQTTClient();
                try {
                    client.create(program, token, clientID, broker, port, topics);
                } catch (error) {
                    program.runtimeError(command.lino, error.message || String(error));
                    return false;
                }
                program.mqttClient = client;
                program.mqttRequires = command.requires;
                return true;
            };

            const tokenValue = program.getValue(command.token);
            if (command.tokenKey) {
                const tokenKey = program.getValue(command.tokenKey);
                if (broker === 'mqtt.flespi.io') {
                    AllSpeak_MQTT.decryptFernetToken(tokenValue, tokenKey)
                        .then(plainToken => {
                            if (finalizeClient(plainToken)) {
                                program.run(command.pc + 1);
                            }
                        })
                        .catch(error => {
                            program.runtimeError(command.lino, error.message || String(error));
                        });
                    return 0;
                } else {
                    if (!finalizeClient({ username: tokenValue, password: tokenKey })) {
                        return 0;
                    }
                    return command.pc + 1;
                }
            }

            if (!finalizeClient(tokenValue)) {
                return 0;
            }
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: on mqtt (connect|message) {action}
    On: {
        compile: compiler => {
            const lino = compiler.getLino();
            const token = compiler.peek();

            if (token === 'mqtt') {
                compiler.next();
                const event = compiler.nextToken();

                if (event === 'connect' || event === 'message' || event === 'error') {
                    compiler.next();

                    const command = {
                        domain: 'mqtt',
                        keyword: 'on',
                        lino,
                        event,
                        goto: 0
                    };
                    compiler.addCommand(command);
				    return compiler.completeHandler();
                }
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const event = command.event;

            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }

            if (event === 'connect') {
                program.mqttClient.onConnectPC = command.pc + 2;
            } else if (event === 'message') {
                program.mqttClient.onMessagePC = command.pc + 2;
            } else if (event === 'error') {
                program.mqttClient.onErrorPC = command.pc + 2;
            }

            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: send mqtt {message} to {topic} [with qos {qos}] [sender {sender}] [action {action}] [message {message}]
    Send: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'send',
                lino,
                qos: 1  // default QoS
            };

            // First check for "send mqtt" or "send to"
            if (compiler.nextTokenIs('to')) {
                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;
                    compiler.nextToken()

                    // Parse optional parameters
                    while (true) {
                        const token = compiler.getToken();
                        if (token === 'sender' || token === 'action' ||
                            token === 'qos' || token === 'message' ||
                            token === 'giving' || token === 'confirm') {

                            if (token === 'sender') {
                                if (compiler.nextIsSymbol()) {
                                    const rec = compiler.getSymbolRecord();
                                    command.sender = rec.name;
                                    compiler.nextToken();
                                }
                            } else if (token === 'action') {
                                command.action = compiler.getNextValue();
                            } else if (token === 'qos') {
                                command.qos = compiler.getNextValue();
                            } else if (token === 'message') {
                                command.message = compiler.getNextValue();
                            } else if (token === 'giving') {
                                if (compiler.nextIsSymbol()) {
                                    const rec = compiler.getSymbolRecord();
                                    command.giving = rec.name;
                                    compiler.next();
                                }
                            } else if (token === 'confirm') {
                                command.confirm = true;
                                compiler.nextToken();
                            }
                        } else {
                            break;
                        }
                    }

                    compiler.addCommand(command);
                    return true;
                }
            } else {
                // Format: send mqtt {message} to {topic}
                command.message = compiler.getNextValue();
                compiler.skip('to');

                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;

                    const token = compiler.peek();
                    if (token === 'with') {
                        compiler.next();
                        while (true) {
                            const tok = compiler.nextToken();
                            if (tok === 'qos') {
                                command.qos = compiler.getNextValue();
                            }
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                break;
                            }
                        }
                    }

                    compiler.addCommand(command);
                    return true;
                }
            }

            return false;
        },

        run: program => {
            const command = program[program.pc];
            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }

            const topicRecord = program.getSymbolRecord(command.to);
            const topic = topicRecord.object;
            const qos = command.qos ? parseInt(program.getValue(command.qos)) : 1;

            // Build payload
            const payload = {};

            if (command.sender) {
                const senderRecord = program.getSymbolRecord(command.sender);
                payload.sender = senderRecord.object.textify();
            }

            payload.action = command.action ? program.getValue(command.action) : null;
            payload.message = command.message ? program.getValue(command.message) : null;

            // Validate required fields
            if (!payload.action) {
                program.runtimeError(command.lino, 'MQTT send command missing action field');
            }

            // Check action requirements
            if (program.mqttRequires && program.mqttRequires[payload.action]) {
                const requires = program.mqttRequires[payload.action];
                for (const item of requires) {
                    if (!payload[item]) {
                        program.runtimeError(command.lino, `MQTT send command missing required field: ${item}`);
                    }
                }
            }

            const topicName = topic.getName();
            // AllSpeak.writeToDebugConsole(`MQTT Publish to ${topicName} with QoS ${qos}: ${JSON.stringify(payload)}`);

            if (command.confirm) {
                // Add a unique confirmation ID and wait for ack from receiver
                const confirmId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                payload._confirmId = confirmId;
                if (!program.mqttClient.pendingConfirms) {
                    program.mqttClient.pendingConfirms = {};
                }
                const timeoutMs = 5000;
                const timer = setTimeout(() => {
                    delete program.mqttClient.pendingConfirms[confirmId];
                    console.warn(`MQTT confirm timeout for ${payload.action} to ${topicName}`);
                    program.run(command.pc + 1);
                }, timeoutMs);
                program.mqttClient.pendingConfirms[confirmId] = () => {
                    clearTimeout(timer);
                    delete program.mqttClient.pendingConfirms[confirmId];
                    program.run(command.pc + 1);
                };
                program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024);
                return 0;
            } else if (command.giving) {
                // Async: wait for broker acknowledgment
                program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024)
                    .then((ok) => {
                        const target = program.getSymbolRecord(command.giving);
                        target.value[target.index] = {
                            type: 'boolean',
                            content: ok
                        };
                        program.run(command.pc + 1);
                    })
                    .catch(() => {
                        const target = program.getSymbolRecord(command.giving);
                        target.value[target.index] = {
                            type: 'boolean',
                            content: false
                        };
                        program.run(command.pc + 1);
                    });
                return 0;
            } else {
                // Fire-and-forget: don't wait for PUBACK
                program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024);
                return command.pc + 1;
            }
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: topic {name}
    Topic: {
        compile: compiler => {
			compiler.compileVariable(`mqtt`, `topic`);
			return true;
        },

        run: program => {
            const command = program[program.pc];
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Value handlers
    value: {
        compile: compiler => {
            let token = compiler.getToken();

            if (token === 'the') {
                token = compiler.nextToken();
            }

            if (compiler.isSymbol()) {
                const record = compiler.getSymbolRecord();
                if (record.object && record.object instanceof AllSpeak_MQTT.ECTopic) {
                    return {
                        domain: 'mqtt',
                        type: 'topic',
                        content: record.name
                    };
                }
            } else if (token === 'mqtt') {
                token = compiler.nextToken();
                if (token === 'message') {
                    compiler.nextToken();
                    return {
                        domain: 'mqtt',
                        type: 'mqtt',
                        content: 'message'
                    };
                } else if (token === 'error') {
                    compiler.nextToken();
                    return {
                        domain: 'mqtt',
                        type: 'mqtt',
                        content: 'error'
                    };
                }
            }

            return null;
        },

        get: (program, value) => {
            if (value.type === 'mqtt') {
                if (value.content === 'message') {
                    const message = program.mqttClient ? program.mqttClient.getReceivedMessage() : null;
                    let content = '';
                    if (typeof message === 'string') {
                        content = message;
                    } else if (message === null || typeof message === 'undefined') {
                        content = '';
                    } else {
                        try {
                            content = JSON.stringify(message, null, 2);
                        } catch (error) {
                            content = String(message);
                        }
                    }
                    return {
                        type: 'constant',
                        numeric: false,
                        content
                    };
                } else if (value.content === 'error') {
                    const content = program.mqttClient ? program.mqttClient.getError() : '';
                    return {
                        type: 'constant',
                        numeric: false,
                        content
                    };
                }
            } else if (value.type === 'topic') {
                const record = program.getSymbolRecord(value.content);
                const topic = record.object;
                return {
                    type: 'constant',
                    numeric: false,
                    content: topic.textify()
                };
            }
            return null;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Condition handlers
    condition: {
        compile: () => {
            return {};
        },

        test: () => {
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Dispatcher - routes keywords to handlers
    _compileHandlers: null,

    _buildCompileHandlers: function() {
        const opcodeMap = this.getOpcodeMap();
        const handlers = {};
        if (AllSpeak_Language.pack) {
            const opcodes = AllSpeak_Language.pack.opcodes;
            for (const opcode in opcodes) {
                const handler = opcodeMap[opcode];
                if (handler) {
                    const keywords = opcodes[opcode].keyword.split('|');
                    for (const kw of keywords) {
                        if (!handlers[kw]) {
                            handlers[kw] = handler;
                        }
                    }
                }
            }
        }
        // MQTT 'init' is used at compile time but aliases to MQTT handler
        handlers['init'] = this.Init;
        this._compileHandlers = handlers;
    },

    getHandler: function(name) {
        if (!this._compileHandlers) {
            this._buildCompileHandlers();
        }
        return this._compileHandlers[name] || null;
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main compile handler
    compile: (compiler) => {
        const token = compiler.getToken();
        const handler = AllSpeak_MQTT.getHandler(token);

        if (!handler) {
            return false;
        }

        return handler.compile(compiler);
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main run handler
    opcodeMap: null,

    getOpcodeMap: function() {
        if (this.opcodeMap) return this.opcodeMap;
        this.opcodeMap = {
            MQTT_INIT: this.MQTT,
            MQTT_SUBSCRIBE: this.Topic,
            MQTT_SEND: this.Send,
            MQTT_ON_CONNECT: this.On,
            MQTT_ON_MESSAGE: this.On
        };
        return this.opcodeMap;
    },

    run: (program) => {
        const command = program[program.pc];
        let handler;
        if (command.opcode) {
            handler = AllSpeak_MQTT.getOpcodeMap()[command.opcode];
        }
        if (!handler) {
            handler = AllSpeak_MQTT.getHandler(command.keyword);
        }
        if (!handler) {
            program.runtimeError(command.lino, `Unknown command '${command.opcode || command.keyword}' in 'mqtt' package`);
        }

        return handler.run(program);
    }
};
const AllSpeak_REST = {

	name: `AllSpeak_REST`,

	Get: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			return AllSpeak_REST.Rest.compileRequest(compiler, `get`, lino);
		},

		run: (program) => {
			return AllSpeak_REST.Rest.run(program);
		}
	},

	Post: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			return AllSpeak_REST.Rest.compileRequest(compiler, `post`, lino);
		},

		run: (program) => {
			return AllSpeak_REST.Rest.run(program);
		}
	},

	Rest: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = AllSpeak_Language.reverseWord(compiler.nextToken());
			return AllSpeak_REST.Rest.compileRequest(compiler, request, lino);
		},

		compileRequest: (compiler, request, lino) => {
			switch (request) {
			case `path`:
				const path = compiler.getNextValue();
				compiler.addCommand({
					domain: `rest`,
					keyword: `rest`,
					lino,
					request: `path`,
					path
				});
				return true;
			case `get`:
				if (compiler.nextIsSymbol(true)) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						if (compiler.nextIsWord(`from`)) {
							const url = compiler.getNextValue();
							let fixup = compiler.getPc();
							compiler.addCommand({
								domain: `rest`,
								keyword: `rest`,
								lino,
								request: `get`,
								target: targetRecord.name,
								url,
								onError: null
							});
							if (compiler.isWord(`or`)) {
								compiler.next();
								compiler.getCommandAt(fixup).onError = compiler.getPc() + 1;
								compiler.completeHandler();
							} 
							return true;
						}
					}
				}
				break;
			case `post`:
				let value = null;
				if (compiler.nextIsWord(`to`)) {
					compiler.next();
				} else {
					value = compiler.getValue();
					if (compiler.isWord(`to`)) {
						compiler.next();
					} else {
						break;
					}
				}
				const url = compiler.getValue();
				if (!url) {
					throw new Error(command.lino, `No URL present`);
				}
				let target = null;
				const args = {};
				while (compiler.isWord(`with`)) {
					const argName = compiler.nextToken();
					if (compiler.nextIsWord(`as`)) {
						const argValue = compiler.getNextValue();
						args[argName] = argValue;
					} else {
						break;
					}
				}
				if (compiler.isWord(`giving`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.isVHolder) {
							target = targetRecord.name;
							compiler.next();
						} else {
							throw new Error(`'${targetRecord.name}' cannot hold a value`);
						}
					}
				}
				compiler.addCommand({
					domain: `rest`,
					keyword: `rest`,
					lino,
					request: `post`,
					value,
					url,
					target,
					args,
					onError: compiler.getPc() + 2
				});
				onError = null;
				if (compiler.isWord(`or`)) {
					compiler.next();
					// onError = compiler.getPc() + 1;
					compiler.completeHandler();
				}
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.request == `path`) {
				AllSpeak_REST.restPath = program.getValue(command.path);
				return command.pc + 1;
			}
			const url = program.getValue(command.url);
			if (!AllSpeak_REST.restPath) {
				AllSpeak_REST.restPath = `.`;
			}
			let path = url;
			if (!url.startsWith(`http`)) {
				if (url[0] == `/`) {
					path = `${window.location.origin}${url}`;
				} else {
					path = url;
				}
			}

			// Cache-busting for GET requests (helps Android WebView)
			if (command.request === `get` && AllSpeak.noCache) {
				const separator = path.includes(`?`) ? `&` : `?`;
				path += `${separator}_ec=${Date.now()}`;
			}

			const scriptId = program.script;
			const pc = program.pc;

			const onSuccess = (content) => {
				const p = AllSpeak.scripts[scriptId];
				if (!p) return;
				const c = p[pc];
				if (c.target) {
					const targetRecord = p.getSymbolRecord(command.target);
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content
					};
					targetRecord.used = true;
				}
				p.run(c.pc + 1);
			};

			const onFailure = (error) => {
				const p = AllSpeak.scripts[scriptId];
				if (!p) return;
				const c = p[pc];
				if (c.onError) {
					p.errorMessage = `Exception trapped: ${error}`;
					p.run(c.onError);
				} else {
					p.runtimeError(c.lino, `Error: ${error}`);
				}
			};

			switch (command.request) {
			case `get`:
				fetch(path)
					.then(response => {
						if (response.ok) {
							return response.text().then(text => onSuccess(text.trim()));
						} else {
							onFailure(`${response.status} ${response.statusText}`);
						}
					})
					.catch(err => {
						onFailure(err.message || String(err));
					});
				break;
			case `post`:
				const postValue = program.getValue(command.value);
				AllSpeak.writeToDebugConsole(`POST to ${path}`);
				const headers = {
					'Content-type': `application/json; charset=UTF-8`
				};
				for (const key of Object.keys(command.args)) {
					headers[key] = program.getValue(command.args[key]);
				}
				fetch(path, {
					method: `POST`,
					headers,
					body: postValue
				})
					.then(response => {
						if (response.ok) {
							if (command.target) {
								return response.text().then(text => onSuccess(text.trim()));
							} else {
								const p = AllSpeak.scripts[scriptId];
								if (p) p.run(p[pc].pc + 1);
							}
						} else {
							onFailure(`${response.status} ${response.statusText}`);
						}
					})
					.catch(err => {
						onFailure(err.message || String(err));
					});
				break;
			}
			return 0;
		}
	},

	_compileHandlers: null,

	_buildCompileHandlers: function() {
		const lang = AllSpeak_Language;
		const opcodeMap = this.getOpcodeMap();
		const handlers = {};
		if (lang.pack) {
			const opcodes = lang.pack.opcodes;
			for (const opcode in opcodes) {
				const handler = opcodeMap[opcode];
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
		this._compileHandlers = handlers;
	},

	getHandler: function(name) {
		if (!this._compileHandlers) {
			this._buildCompileHandlers();
		}
		return this._compileHandlers[name] || null;
	},

	opcodeMap: null,

	getOpcodeMap: function() {
		if (this.opcodeMap) return this.opcodeMap;
		this.opcodeMap = {
			REST_GET: this.Get,
			REST_POST: this.Post,
			REST_PATH: this.Rest
		};
		return this.opcodeMap;
	},

	run: (program) => {
		const command = program[program.pc];
		let handler;
		if (command.opcode) {
			handler = AllSpeak_REST.getOpcodeMap()[command.opcode];
		}
		if (!handler) {
			handler = AllSpeak_REST.getHandler(command.keyword);
		}
		if (!handler) {
			program.runtimeError(command.lino, `Unknown command '${command.opcode || command.keyword}' in 'rest' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: () => {
			return null;
		},

		get: () => {
			return null;
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};
// eslint-disable-next-line no-unused-vars
const AllSpeak_Compare = (program, value1, value2) => {

	const val1 = program.value.evaluate(program, value1);
	const val2 = program.value.evaluate(program, value2);
	var v1 = val1.content;
	var v2 = val2.content;
	if (v1 && val1.numeric) {
		if (!val2.numeric) {
			v2 = (v2 === `` || v2 === `-` || typeof v2 === `undefined`) ? 0 : parseInt(v2);
		}
	} else {
		if (v2 && val2.numeric) {
			v2 = v2.toString();
		}
		if (typeof v1 === `undefined`) {
			v1 = ``;
		}
		if (typeof v2 === `undefined`) {
			v2 = ``;
		}
	}
	if (v1 > v2) {
		return 1;
	}
	if (v1 < v2) {
		return -1;
	}
	return 0;
};
// eslint-disable-next-line no-unused-vars
const AllSpeak_Condition = {

	name: `AllSpeak_Condition`,

	compile: (compiler) => {
		// See if any of the domains can handle it
		const mark = compiler.getIndex();
		for (const domainName of Object.keys(compiler.domain)) {
			// console.log(`Try domain '${domainName}' for condition`);
			const domain = compiler.domain[domainName];
			const code = domain.condition.compile(compiler);
			if (code) {
				return code;
			}
			compiler.rewindto(mark);
		}
	},

	// runtime

	test: (program, condition) => {
		const handler = program.domain[condition.domain];
		return handler.condition.test(program, condition);
	}
};
const AllSpeak_Value = {

	name: `AllSpeak_Value`,

	getItem: (compiler) => {
		const token = compiler.getToken();
		if (!token) {
			return null;
		}

		// Check for a boolean
		if (token === AllSpeak_Language.word(`true`)) {
			compiler.next();
			return {
				type: `boolean`,
				content: true
			};
		}

		if (token === AllSpeak_Language.word(`false`)) {
			compiler.next();
			return {
				type: `boolean`,
				content: false
			};
		}

		// Check for a string constant
		if (token.charAt(0) === `\``) {
			compiler.next();
			const value = {
				type: `constant`,
				numeric: false,
				content: token.substring(1, token.length - 1)
			};
			return value;
		}

		// Check for a numeric constant
		if (token.charAt(0).match(/[0-9-]/)) {
			const val = eval(token);
			if (Number.isInteger(val)) {
				compiler.next();
				const value = {
					type: `constant`,
					numeric: true,
					content: val
				};
				return value;
			} else {
				throw new Error(`'${token}' is not an integer`);
			}
		}

		// Character extraction: char N of Value / character N of Value
		if ([`char`, `character`].includes(AllSpeak_Language.reverseWord(token))) {
			const index = compiler.getNextValue();
			if (compiler.isWord(`of`)) {
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `char`,
					index,
					value
				};
			}
		}

		// See if any of the domains can handle it
		const mark = compiler.getIndex();
		for (const name of Object.keys(compiler.domain)) {
			const handler = compiler.domain[name];
			const code = handler.value.compile(compiler);
			if (code) {
				return code;
			}
			compiler.rewindTo(mark);
		}
		return null;
	},

	compile: compiler => {
		const token = compiler.getToken();
		let item = AllSpeak_Value.getItem(compiler);
		if (!item) {
			throw new Error(`Undefined value: '${token}'`);
		}

		if (compiler.getToken() === AllSpeak_Language.word(`cat`)) {
			const value = {
				type: `cat`,
				numeric: false,
				parts: [item]
			};
			while (compiler.isWord(`cat`)) {
				compiler.next();
                item = AllSpeak_Value.getItem(compiler);
                if (!item) {
                    throw new Error(`Undefined value: '${token}'`);
                }
				value.parts.push(item);
			}
			return value;
		}

		return item;
	},

	// runtime

	doValue: (program, value) => {
		//  console.log('Value:doValue:value: '+JSON.stringify(value,null,2));
		// See if it's a constant string, a variable or something else
		if (typeof value.type === `undefined`) {
			if (typeof value === `number`) {
				value = {
					type: `numeric`,
					content: value
				};
			} else if (typeof value === `string` && value.length === 1) {
				value = {
					type: `char`,
					content: value
				};
			} else {
				program.runtimeError(program[program.pc].lino, `Undefined value (variable not initialized?)`);
				return null;
			}
		}
		const type = value.type;
		switch (type) {
		case `numeric`:
			return {
				type: `constant`,
				numeric: true,
				content: value.content
			};
		case `char`:
			if (!value.domain) {
				return {
					type: `constant`,
					numeric: false,
					content: value.content
				};
			}
			break;
		case `cat`:
			return {
				type: `constant`,
				numeric: false,
				content: value.parts.reduce(function (acc, part) {
					let value = AllSpeak_Value.doValue(program, part);
					return acc + (value ? value.content : ``);
				}, ``)
			};
		case `boolean`:
		case `constant`:
			return value;
		case `symbol`:
			const symbol = program.getSymbolRecord(value.name);
			if (symbol.isVHolder) {
				const symbolValue = symbol.value[symbol.index];
				if (symbolValue) {
					const v = symbolValue.content;
					if (v === null || typeof v === `undefined`) {
						symbolValue.content = symbolValue.numeric ? 0 : ``;
					}
					return symbolValue;
				} else {
					return null;
				}
			} else {
				const handler = program.domain[symbol.domain].value;
				return handler.get(program, value);
			}
		default:
			break;
		}
		// Call the given domain to handle a value
		const handler = program.domain[value.domain].value;
		return handler.get(program, value);
	},

	constant: (content, numeric) => {
		return {
			type: `constant`,
			numeric,
			content
		};
	},

	evaluate: (program, value) => {
		if (!value) {
			return {
				type: `constant`,
				numeric: false,
				content: ``
			};
		}
		const result = AllSpeak_Value.doValue(program, value);
		if (result) {
			return result;
		}
		program.runtimeError(program[program.pc].lino, `Can't decode value: ` + value);
	},

	getValue: (program, value) => {
		const v = AllSpeak_Value.evaluate(program, value);
		return v ? v.content : null;
	},

	// tools

	encode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			default:
			case `ec`:
				return value.replace(/\n/g, `~lf~`)
					.replace(/%0a/g, `~lf~`)
					.replace(/\n/g, `~cr~`)
					.replace(/%0d/g, `~cr~`)
					.replace(/"/g, `~dq~`)
					.replace(/'/g, `~sq~`)
					.replace(/\\/g, `~bs~`);
			case `url`:
				return encodeURIComponent(value.replace(/\s/g, `+`));
			case `base64`:
				return btoa(value);
			case `sanitize`:
				return value.normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``);
			}
		}
		return value;
	},

	decode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			default:
			case `ec`:
				return value.replace(/%0a/g, `\n`)
					.replace(/~lf~/g, `\n`)
					.replace(/%0d/g, `\r`)
					.replace(/~cr~/g, `\n`)
					.replace(/~dq~/g, `"`)
					.replace(/~sq~/g, `'`)
					.replace(/~bs~/g, `\\`);
			case `url`:
				const decoded = decodeURIComponent(value);
				return decoded.replace(/\+/g, ` `);
			case `base64`:
				return atob(value);
			}
		}
		return value;
	}
};
const AllSpeak_Run = {

	name: `AllSpeak_Run`,

	run: (program, pc) =>{
		if (typeof pc === `undefined` || pc === null) {
			return;
		}

		// While tracer is paused, suppress only periodic `every` callbacks.
		// Other async continuations (e.g. attach completion) must still resume.
		if (
			program.tracing &&
			typeof program.resume !== `undefined` &&
			pc !== program.resume &&
			program.everyCallbacks &&
			program.everyCallbacks[pc]
		) {
			return;
		}

		if (!program.runQueue) {
			program.runQueue = [];
		}
		if (typeof program.runningQueue === `undefined`) {
			program.runningQueue = false;
		}
		const queue = program.runQueue;

		const minIndent = (scriptLines) => {
			let count = 9999;
			scriptLines.forEach(function (element) {
				const item = element.line;
				let n = 0;
				while (n < item.length) {
					if (item[n] !== ` `) {
						break;
					}
					n++;
				}
				if (n > 0 && n < count) {
					count = n;
				}
			});
			return 0;
		};

		if (program.runningQueue) {
			queue.push(pc);
			return;
		}
		program.runningQueue = true;
		program.register(program);
		queue.push(pc);
		if (!program.tracing && program.intentQueue && program.intentQueue.length > 0) {
			while (program.intentQueue.length > 0) {
				queue.push(program.intentQueue.shift());
			}
		}
		try {
			while (queue.length > 0) {
				let pausedForTrace = false;
				program.pc = queue.shift();
				program.watchdog = 0;
				while (program.running) {
				const activeCommand = program[program.pc];
				if (activeCommand && activeCommand.lino) {
					program.lastLino = activeCommand.lino;
				}
				if (program.watchdog > 1000000) {
					program.lino = program[program.pc].lino;
					program.reportError(
						new Error(`Program runaway intercepted.\nHave you forgotten to increment a loop counter?`, program),
						program);
					break;
				}
				program.watchdog++;
				const domain = program[program.pc].domain;
				if (program.debugStep) {
					const lino = program[program.pc].lino;
					let line = '';
					try {
						line = program.source.scriptLines[lino - 1].line;
					}
					catch (e) {
					}
					const cmd = program[program.pc];
					AllSpeak.writeToDebugConsole(`${program.script}: Line ${lino}: `
					+ `${domain}:${cmd.opcode || cmd.keyword} - ${line}`);
				}
				const handler = program.domain[domain];
				if (!handler) {
					program.runtimeError(program[program.pc].lino, `Unknown domain '${domain}'`);
					break;
				}
				program.pc = handler.run(program);
				if (!program.pc) {
					break;
				}
				if (program.stop) {
					program.tracing = false;
					break;
				}
				if (program.tracing) {
					const command = program[program.pc];
					const scriptLines = program.source.scriptLines;
					const minSpace = minIndent(scriptLines);
					const displayLino = command && command.lino ? command.lino : (program.lastLino || 0);
					const tracer = document.getElementById(`allspeak-tracer`);
					if (!tracer) {
						program.runtimeError(command.lino, `Element 'allspeak-tracer' was not found`);
						return;
					}
					tracer.style.display = `block`;
					tracer.style.visibility = `visible`;
					var variables = ``;
					if (program.tracer) {
						// Drop stale callbacks so step resumes from the traced instruction path.
						queue.length = 0;
						const content = document.getElementById(`allspeak-tracer-content`);
						if (content) {
							program.tracer.variables.forEach(function (name, index, array) {
								const symbol = program.getSymbolRecord(name);
								if (symbol.elements > 1) {
									variables += `${name}: ${symbol.index}/${symbol.elements}: `;
									for (var n = 0; n < symbol.elements; n++) {
										const value = symbol.value[n];
										if (value) {
											variables += `${value.content} `;
										} else {
											variables += `undefined `;
										}
									}
								} else {
									const value = symbol.value[symbol.index];
									if (value) {
										variables += `${name}: ${value.content}`;
									} else {
										variables += `${name}: undefined`;
									}
								}
								switch (program.tracer.alignment) {
								case `horizontal`:
									if (index < array.length - 1) {
										variables += `, `;
									}
									break;
								case `vertical`:
									variables += `<br>`;
									break;
								}
							});
							variables += `<hr>`;
							var trace = ``;
							const tracerRows = program.tracerRows || 5;
							for (var n = tracerRows; n > 0; n--) {
								if (displayLino && scriptLines[displayLino - n]) {
									const text = scriptLines[displayLino - n].line.substr(minSpace);
									trace += `<input type="text" name="${n}"` +
								  `value="${displayLino - n + 1}: ${text.split(`\\s`).join(` `)}"` +
                  `style="width:100%;border:none;enabled:false">`;
								}
								trace += `<br>`;
							}
							content.innerHTML = `${variables} ${trace}`;
							content.style.display = `block`;
							const run = document.getElementById(`allspeak-run-button`);
							const step = document.getElementById(`allspeak-step-button`);

							run.onclick = function () {
								run.blur();
								program.tracing = false;
								const content = document.getElementById(`allspeak-tracer-content`);
								content.style.display = `none`;
								try {
									AllSpeak_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in run handler: ` + err.message;
										AllSpeak.writeToDebugConsole(message);
									alert(message);
								}
							};

							step.onclick = function () {
									AllSpeak.writeToDebugConsole(`step`);
								step.blur();
								program.tracing = true;
								const content = document.getElementById(`allspeak-tracer-content`);
								content.style.display = `block`;
								try {
									AllSpeak_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in step handler: ` + err.message;
										AllSpeak.writeToDebugConsole(message);
									alert(message);
								}
							};
						}

						program.resume = program.pc;
						program.pc = 0;
					}
					pausedForTrace = true;
					break;
				}
				}
				if (pausedForTrace) {
					break;
				}
			}
		} finally {
			program.runningQueue = false;
		}
	},

	exit: (program) => {
		if (program.onExit) {
			program.run(program.onExit);
		}
		let parent = program.parent;
		let afterExit = program.afterExit;
		delete AllSpeak.scripts[program.script];
		if (program.module) {
			delete program.module.program;
		}
		Object.keys(program).forEach(function(key) {
			delete program[key];
		});
		if (parent && afterExit) {
			AllSpeak.scripts[parent].run(afterExit);
		}
	}
};
// AllSpeak Opcode Resolver
// Maps compiled command objects (domain + keyword + sub-type) to canonical opcodes.
// Called by Compile.js addCommand() to stamp every command with a language-neutral opcode.

// eslint-disable-next-line no-unused-vars
const AllSpeak_Opcodes = {

	resolve: function(command) {
		const domain = command.domain;
		const keyword = command.keyword;

		switch (domain) {

		case `core`:
			return this.resolveCore(command);

		case `browser`:
			return this.resolveBrowser(command);

		case `json`:
			return this.resolveJson(command);

		case `rest`:
			return this.resolveRest(command);

		case `mqtt`:
			return this.resolveMqtt(command);

		default:
			return null;
		}
	},

	resolveCore: function(command) {
		const keyword = command.keyword;

		switch (keyword) {

		// Arithmetic
		case `add`:       return `ADD`;
		case `take`:      return `SUBTRACT`;
		case `subtract`:  return `SUBTRACT`;
		case `multiply`:  return `MULTIPLY`;
		case `divide`:    return `DIVIDE`;
		case `negate`:    return `NEGATE`;

		// Assignment
		case `put`:       return `PUT`;

		// Collections
		case `append`:    return `APPEND`;
		case `push`:      return `PUSH`;
		case `pop`:       return `POP`;
		case `clear`:     return `CLEAR`;
		case `replace`:   return `REPLACE`;
		case `sort`:      return `SORT`;
		case `split`:     return `SPLIT`;
		case `filter`:    return `FILTER`;
		case `index`:     return `INDEX`;

		// Control flow
		case `if`:        return `IF`;
		case `while`:     return `WHILE`;
		case `goto`:      return `GOTO`;
		case `go`:        return `GOTO`;
		case `gosub`:     return `GOSUB`;
		case `return`:    return `RETURN`;
		case `fork`:      return `FORK`;
		case `exit`:      return `EXIT`;
		case `stop`:      return `STOP`;
		case `wait`:      return `WAIT`;
		case `every`:     return `EVERY`;
		case `try`:       return `TRY`;
		case `endTry`:    return `END_TRY`;
		case `continue`:  return `CONTINUE`;
		case `toggle`:    return `TOGGLE`;

		// Declarations
		case `variable`:  return `DECLARE_VARIABLE`;
		case `module`:    return `DECLARE_MODULE`;
		case `symbol`:    return `DECLARE_SYMBOL`;
		case `callback`:  return `DECLARE_CALLBACK`;
		case `alias`:     return `DECLARE_ALIAS`;

		// Text
		case `encode`:    return `ENCODE`;
		case `decode`:    return `DECODE`;
		case `sanitize`:  return `SANITIZE`;

		// Modules
		case `run`:       return `RUN_MODULE`;
		case `require`:   return `REQUIRE`;
		case `import`:    return `IMPORT`;
		case `close`:     return `CLOSE_MODULE`;
		case `dummy`:     return `DUMMY`;

		// I/O — print/log
		case `print`:
			return command.log ? `LOG` : `PRINT`;

		// I/O — send
		case `send`:      return `SEND_MESSAGE`;

		// I/O — on (event handlers)
		case `on`:
			switch (command.action) {
			case `close`:   return `ON_CLOSE`;
			case `message`: return `ON_MESSAGE`;
			case `error`:   return `ON_ERROR`;
			default:        return `ON_CALLBACK`;
			}

		// Debug
		case `debug`:
			switch (command.item) {
			case `program`:  return `DEBUG_PROGRAM`;
			case `symbols`:  return `DEBUG_SYMBOLS`;
			case `symbol`:   return `DEBUG_SYMBOL`;
			case `step`:     return `DEBUG_STEP`;
			case `stop`:     return `DEBUG_STOP`;
			default:         return `DEBUG_PROGRAM`;
			}

		// Set (sub-typed via request field)
		case `set`:
			switch (command.request) {
			case `setVarTo`:    return `SET_VAR_TYPE`;
			case `setArray`:    return `SET_ARRAY`;
			case `setBoolean`:  return `SET_BOOLEAN`;
			case `setReady`:    return `SET_READY`;
			case `setElement`:  return `SET_ELEMENT_VALUE`;
			case `setProperty`: return `SET_PROPERTY`;
			case `setArg`:      return `SET_ARG`;
			case `setElements`: return `SET_ELEMENTS`;
			case `encoding`:    return `SET_ENCODING`;
			case `setPayload`:  return `SET_PAYLOAD`;
			default:            return `SET_BOOLEAN`;
			}

		// Structural / compile-time
		case `no`:        return `NO_CACHE`;
		case `test`:      return `TEST`;
		case `script`:    return `SCRIPT`;
		case `begin`:     return `BEGIN`;
		case `end`:       return `END`;

		default:
			return null;
		}
	},

	resolveBrowser: function(command) {
		const keyword = command.keyword;

		// Element type declarations — check via language pack keyword index
		const opcodes = AllSpeak_Language.getOpcodesForKeyword(keyword);
		if (opcodes.indexOf(`DECLARE_ELEMENT`) >= 0) {
			return `DECLARE_ELEMENT`;
		}

		switch (keyword) {

		// DOM manipulation
		case `create`:    return `CREATE_ELEMENT`;
		case `attach`:    return `ATTACH_ELEMENT`;
		case `click`:     return `CLICK_ELEMENT`;
		case `focus`:     return `FOCUS_ELEMENT`;
		case `disable`:   return `DISABLE_ELEMENT`;
		case `enable`:    return `ENABLE_ELEMENT`;
		case `highlight`: return `HIGHLIGHT_ELEMENT`;

		// Content
		case `alert`:     return `ALERT`;
		case `render`:    return `RENDER`;
		case `convert`:   return `CONVERT`;

		// Navigation
		case `location`:  return `NAVIGATE`;
		case `request`:   return `FULLSCREEN`;
		case `scroll`:    return `SCROLL`;
		case `mail`:      return `MAIL`;
		case `copy`:      return `COPY_TO_CLIPBOARD`;

		// Media
		case `play`:      return `PLAY_AUDIO`;
		case `upload`:    return `UPLOAD_FILE`;

		// Storage
		case `put`:       return `PUT_STORAGE`;

		// Debug
		case `trace`:
			return command.variant === `setup` ? `TRACE_SETUP` : `TRACE_RUN`;

		// Clear
		case `clear`:     return `CLEAR_ELEMENT`;

		// Remove (sub-typed)
		case `remove`:
			switch (command.type) {
			case `removeElement`:   return `REMOVE_ELEMENT`;
			case `removeAttribute`: return `REMOVE_ATTRIBUTE`;
			case `removeStorage`:   return `REMOVE_STORAGE`;
			default:                return `REMOVE_ELEMENT`;
			}

		// Get (sub-typed)
		case `get`:
			switch (command.action) {
			case `getStorage`:  return `GET_STORAGE`;
			case `listStorage`: return `LIST_STORAGE`;
			case `getForm`:     return `GET_FORM`;
			case `getOption`:   return `GET_OPTION`;
			default:            return `GET_STORAGE`;
			}

		// History (sub-typed)
		case `history`:
			switch (command.type) {
			case `push`:    return `HISTORY_PUSH`;
			case `set`:     return `HISTORY_SET`;
			case `replace`: return `HISTORY_REPLACE`;
			case `back`:    return `HISTORY_BACK`;
			case `forward`: return `HISTORY_FORWARD`;
			default:        return `HISTORY_PUSH`;
			}

		// On (event handlers, sub-typed)
		case `on`:
			switch (command.action) {
			case `change`:       return `ON_CHANGE`;
			case `click`:        return `ON_CLICK`;
			case `clickDocument`: return `ON_CLICK_DOCUMENT`;
			case `key`:          return `ON_KEY`;
			case `leave`:        return `ON_LEAVE`;
			case `windowResize`: return `ON_WINDOW_RESIZE`;
			case `browserBack`:  return `ON_BROWSER_BACK`;
			case `swipe`:        return `ON_SWIPE`;
			case `pick`:         return `ON_PICK`;
			case `resume`:       return `ON_RESUME`;
			case `drag`:         return `ON_DRAG`;
			case `drop`:         return `ON_DROP`;
			default:             return `ON_CLICK`;
			}

		// Set (sub-typed via type field)
		case `set`:
			switch (command.type) {
			case `setContent`:    return `SET_CONTENT`;
			case `setContentVar`: return `SET_CONTENT_VAR`;
			case `setText`:       return `SET_TEXT`;
			case `setTitle`:      return `SET_TITLE`;
			case `setSelect`:     return `SET_SELECT`;
			case `setStyle`:      return `SET_STYLE`;
			case `setStyles`:     return `SET_STYLES`;
			case `setBodyStyle`:  return `SET_BODY_STYLE`;
			case `setHeadStyle`:  return `SET_HEAD_STYLE`;
			case `setClass`:      return `SET_CLASS`;
			case `setId`:         return `SET_ID`;
			case `setSize`:       return `SET_SIZE`;
			case `setAttribute`:  return `SET_ATTRIBUTE`;
			case `setAttributes`: return `SET_ATTRIBUTES`;
			case `setDefault`:    return `SET_DEFAULT`;
			case `setTracerRows`: return `SET_TRACER_ROWS`;
			default:              return `SET_CONTENT`;
			}

		default:
			return null;
		}
	},

	resolveJson: function(command) {
		switch (command.request) {
		case `setVariable`: return `JSON_SET_VAR`;
		case `setList`:     return `JSON_SET_LIST`;
		case `parse`:       return `JSON_PARSE`;
		case `format`:      return `JSON_FORMAT`;
		case `sort`:        return `JSON_SORT`;
		case `shuffle`:     return `JSON_SHUFFLE`;
		case `delete`:      return `JSON_DELETE`;
		case `rename`:      return `JSON_RENAME`;
		case `add`:         return `JSON_ADD`;
		case `split`:       return `JSON_SPLIT`;
		case `replace`:     return `JSON_REPLACE`;
		default:            return null;
		}
	},

	resolveRest: function(command) {
		switch (command.request) {
		case `get`:  return `REST_GET`;
		case `post`: return `REST_POST`;
		case `path`: return `REST_PATH`;
		default:     return null;
		}
	},

	resolveMqtt: function(command) {
		const keyword = command.keyword;
		switch (keyword) {
		case `init`:  return `MQTT_INIT`;
		case `mqtt`:  return `MQTT_INIT`;
		case `topic`: return `MQTT_SUBSCRIBE`;
		case `send`:  return `MQTT_SEND`;
		case `on`:
			switch (command.action) {
			case `connect`: return `MQTT_ON_CONNECT`;
			case `message`: return `MQTT_ON_MESSAGE`;
			default:        return `MQTT_ON_MESSAGE`;
			}
		default:
			return null;
		}
	}
};
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

	_buildReverseWords: function() {
		this._reverseWords = {};
		if (this.pack && this.pack.words) {
			for (const canonical in this.pack.words) {
				const forms = this.pack.words[canonical].split(`|`);
				for (const form of forms) {
					this._reverseWords[form] = canonical;
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

	// Get a localized diagnostic message with placeholder substitution.
	// e.g. diagnostic('unknownCommand', {token: 'xyz', line: 5})
	diagnostic: function(key, params) {
		let msg;
		if (this.pack && this.pack.diagnostics && this.pack.diagnostics[key]) {
			msg = this.pack.diagnostics[key];
		} else {
			// Fallback English messages
			const fallbacks = {
				unknownCommand: `I don't understand '{token}' at line {line}.`,
				undeclaredVariable: `Variable '{name}' has not been declared.`,
				unexpectedToken: `Expected '{expected}' but got '{actual}' at line {line}.`,
				divisionByZero: `Division by zero at line {line}.`,
				indexOutOfRange: `Index {index} is out of range at line {line}.`,
				moduleNotFound: `Module '{name}' not found.`,
				syntaxError: `Syntax error at line {line}: {detail}.`
			};
			msg = fallbacks[key] || key;
		}
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
// English language pack for AllSpeak — auto-generated from languages/en.json
// eslint-disable-next-line no-unused-vars
var AllSpeak_LanguagePack_en = {
  "meta": {
    "language": "en",
    "label": "English",
    "version": "0.1.0",
    "description": "English language pack for AllSpeak — maps English surface syntax to canonical opcodes"
  },
  "opcodes": {
    "ADD": {
      "keyword": "add",
      "patterns": [
        "add {value} to {variable}",
        "add {value1} to {value2} giving {variable}"
      ]
    },
    "ALERT": {
      "keyword": "alert",
      "patterns": [
        "alert {value}"
      ]
    },
    "APPEND": {
      "keyword": "append",
      "patterns": [
        "append {value} to {variable}"
      ]
    },
    "ATTACH_ELEMENT": {
      "keyword": "attach",
      "patterns": [
        "attach {element} to body",
        "attach {element} to {cssId}"
      ]
    },
    "CLEAR": {
      "keyword": "clear",
      "patterns": [
        "clear {variable}"
      ]
    },
    "CLEAR_ELEMENT": {
      "keyword": "clear",
      "patterns": [
        "clear {element}",
        "clear body",
        "clear styles"
      ]
    },
    "CLICK_ELEMENT": {
      "keyword": "click",
      "patterns": [
        "click {element}"
      ]
    },
    "CONTINUE": {
      "keyword": "continue",
      "patterns": [
        "continue"
      ]
    },
    "CONVERT": {
      "keyword": "convert",
      "patterns": [
        "convert whitespace in {variable} to print|html"
      ]
    },
    "COPY_TO_CLIPBOARD": {
      "keyword": "copy",
      "patterns": [
        "copy {element}"
      ]
    },
    "CREATE_ELEMENT": {
      "keyword": "create",
      "patterns": [
        "create {element} in body",
        "create {element} in {parent}",
        "create {audioclip} from {url}"
      ]
    },
    "DEBUG_PROGRAM": {
      "keyword": "debug",
      "patterns": [
        "debug program"
      ]
    },
    "DEBUG_STEP": {
      "keyword": "debug",
      "patterns": [
        "debug step"
      ]
    },
    "DEBUG_STOP": {
      "keyword": "debug",
      "patterns": [
        "debug stop"
      ]
    },
    "DEBUG_SYMBOL": {
      "keyword": "debug",
      "patterns": [
        "debug symbol {name}"
      ]
    },
    "DEBUG_SYMBOLS": {
      "keyword": "debug",
      "patterns": [
        "debug symbols"
      ]
    },
    "DECLARE_ALIAS": {
      "keyword": "alias",
      "patterns": [
        "alias {name} to {symbol}"
      ]
    },
    "DECLARE_CALLBACK": {
      "keyword": "callback",
      "patterns": [
        "callback {name}"
      ]
    },
    "DECLARE_ELEMENT": {
      "keyword": "div|span|button|input|textarea|select|option|a|p|pre|h1|h2|h3|h4|h5|h6|img|image|canvas|table|tr|td|th|ul|li|form|fieldset|legend|label|blockquote|hr|section|file|audioclip|progress",
      "patterns": [
        "{elementType} {name}"
      ],
      "elementTypes": {
        "a": "a",
        "blockquote": "blockquote",
        "button": "button",
        "canvas": "canvas",
        "div": "div",
        "fieldset": "fieldset",
        "file": "file",
        "form": "form",
        "h1": "h1",
        "h2": "h2",
        "h3": "h3",
        "h4": "h4",
        "h5": "h5",
        "h6": "h6",
        "hr": "hr",
        "image": "image",
        "img": "img",
        "input": "input",
        "label": "label",
        "legend": "legend",
        "li": "li",
        "option": "option",
        "p": "p",
        "pre": "pre",
        "progress": "progress",
        "section": "section",
        "select": "select",
        "span": "span",
        "table": "table",
        "td": "td",
        "textarea": "textarea",
        "th": "th",
        "tr": "tr",
        "ul": "ul",
        "audioclip": "audioclip"
      }
    },
    "DECLARE_MODULE": {
      "keyword": "module",
      "patterns": [
        "module {name}"
      ]
    },
    "DECLARE_SYMBOL": {
      "keyword": "symbol",
      "patterns": [
        "symbol {name}"
      ]
    },
    "DECLARE_VARIABLE": {
      "keyword": "variable",
      "patterns": [
        "variable {name}"
      ]
    },
    "DECODE": {
      "keyword": "decode",
      "patterns": [
        "decode {variable}"
      ]
    },
    "DISABLE_ELEMENT": {
      "keyword": "disable",
      "patterns": [
        "disable {element}"
      ]
    },
    "DIVIDE": {
      "keyword": "divide",
      "patterns": [
        "divide {variable} by {value}",
        "divide {value1} by {value2} giving {variable}"
      ]
    },
    "DUMMY": {
      "keyword": "dummy",
      "patterns": [
        "dummy"
      ]
    },
    "ENABLE_ELEMENT": {
      "keyword": "enable",
      "patterns": [
        "enable {element}"
      ]
    },
    "ENCODE": {
      "keyword": "encode",
      "patterns": [
        "encode {variable}"
      ]
    },
    "END_TRY": {
      "keyword": "end",
      "patterns": [
        "end try"
      ]
    },
    "EVERY": {
      "keyword": "every",
      "patterns": [
        "every {value} minute|minutes|second|seconds|tick|ticks"
      ]
    },
    "EXIT": {
      "keyword": "exit",
      "patterns": [
        "exit"
      ]
    },
    "FILTER": {
      "keyword": "filter",
      "patterns": [
        "filter {array} with {function}"
      ]
    },
    "FOCUS_ELEMENT": {
      "keyword": "focus",
      "patterns": [
        "focus {element}"
      ]
    },
    "FORK": {
      "keyword": "fork",
      "patterns": [
        "fork [to] {label}"
      ]
    },
    "FULLSCREEN": {
      "keyword": "request",
      "patterns": [
        "request fullscreen",
        "request fullscreen exit"
      ]
    },
    "GET_FORM": {
      "keyword": "get",
      "patterns": [
        "get {variable} from {form}"
      ]
    },
    "GET_OPTION": {
      "keyword": "get",
      "patterns": [
        "get {variable} from {select}"
      ]
    },
    "GET_STORAGE": {
      "keyword": "get",
      "patterns": [
        "get {variable} from storage as {key}"
      ]
    },
    "GOSUB": {
      "keyword": "gosub",
      "patterns": [
        "gosub [to] {label}"
      ]
    },
    "GOTO": {
      "keyword": "go",
      "patterns": [
        "go [to] {label}"
      ]
    },
    "HIGHLIGHT_ELEMENT": {
      "keyword": "highlight",
      "patterns": [
        "highlight {element}"
      ]
    },
    "HISTORY_BACK": {
      "keyword": "history",
      "patterns": [
        "history back"
      ]
    },
    "HISTORY_FORWARD": {
      "keyword": "history",
      "patterns": [
        "history forward"
      ]
    },
    "HISTORY_PUSH": {
      "keyword": "history",
      "patterns": [
        "history push [url {url}] [state {state}] [title {title}]"
      ]
    },
    "HISTORY_REPLACE": {
      "keyword": "history",
      "patterns": [
        "history replace [url {url}] [state {state}] [title {title}]"
      ]
    },
    "HISTORY_SET": {
      "keyword": "history",
      "patterns": [
        "history set [url {url}] [state {state}] [title {title}]"
      ]
    },
    "IF": {
      "keyword": "if",
      "patterns": [
        "if {condition}"
      ]
    },
    "IMPORT": {
      "keyword": "import",
      "patterns": [
        "import {symbols}"
      ]
    },
    "INDEX": {
      "keyword": "index",
      "patterns": [
        "index {variable} to {value}"
      ]
    },
    "JSON_ADD": {
      "keyword": "json",
      "patterns": [
        "json add {item} to {variable}"
      ]
    },
    "JSON_DELETE": {
      "keyword": "json",
      "patterns": [
        "json delete property|element {value} from|of {variable}"
      ]
    },
    "JSON_FORMAT": {
      "keyword": "json",
      "patterns": [
        "json format {variable}"
      ]
    },
    "JSON_PARSE": {
      "keyword": "json",
      "patterns": [
        "json parse url {url} as {variable}"
      ]
    },
    "JSON_RENAME": {
      "keyword": "json",
      "patterns": [
        "json rename {oldName} to {newName} in {variable}"
      ]
    },
    "JSON_REPLACE": {
      "keyword": "json",
      "patterns": [
        "json replace element {index} of {variable} by|with {value}"
      ]
    },
    "JSON_SET_LIST": {
      "keyword": "json",
      "patterns": [
        "json set {select} from {variable} [as {display}]"
      ]
    },
    "JSON_SET_VAR": {
      "keyword": "json",
      "patterns": [
        "json set {variable} to array|object"
      ]
    },
    "JSON_SHUFFLE": {
      "keyword": "json",
      "patterns": [
        "json shuffle {variable}"
      ]
    },
    "JSON_SORT": {
      "keyword": "json",
      "patterns": [
        "json sort {variable}"
      ]
    },
    "JSON_SPLIT": {
      "keyword": "json",
      "patterns": [
        "json split {value} [on {delimiter}] giving|into {variable}"
      ]
    },
    "LIST_STORAGE": {
      "keyword": "get",
      "patterns": [
        "get {variable} from storage"
      ]
    },
    "LOG": {
      "keyword": "log",
      "patterns": [
        "log {value}"
      ]
    },
    "MAIL": {
      "keyword": "mail",
      "patterns": [
        "mail to {email} [subject {subject}] [body|message {body}]"
      ]
    },
    "MQTT_INIT": {
      "keyword": "mqtt",
      "patterns": [
        "mqtt init {topic} name {name} qos {qos}"
      ]
    },
    "MQTT_ON_CONNECT": {
      "keyword": "on",
      "patterns": [
        "on mqtt connect"
      ]
    },
    "MQTT_ON_MESSAGE": {
      "keyword": "on",
      "patterns": [
        "on mqtt message"
      ]
    },
    "MQTT_SEND": {
      "keyword": "send",
      "patterns": [
        "send mqtt {message} to {topic}",
        "send mqtt to {topic} [sender {sender}] [action {action}] [message {message}]"
      ]
    },
    "MQTT_SUBSCRIBE": {
      "keyword": "mqtt",
      "patterns": [
        "mqtt topic {name}"
      ]
    },
    "MULTIPLY": {
      "keyword": "multiply",
      "patterns": [
        "multiply {variable} by {value}",
        "multiply {value1} by {value2} giving {variable}"
      ]
    },
    "NAVIGATE": {
      "keyword": "location",
      "patterns": [
        "location {url}",
        "location new {url}"
      ]
    },
    "NEGATE": {
      "keyword": "negate",
      "patterns": [
        "negate {variable}"
      ]
    },
    "ON_BROWSER_BACK": {
      "keyword": "on",
      "patterns": [
        "on browser back",
        "on restore"
      ]
    },
    "ON_CALLBACK": {
      "keyword": "on",
      "patterns": [
        "on {callback}"
      ]
    },
    "ON_CHANGE": {
      "keyword": "on",
      "patterns": [
        "on change {element}"
      ]
    },
    "ON_CLICK": {
      "keyword": "on",
      "patterns": [
        "on click {element}"
      ]
    },
    "ON_CLICK_DOCUMENT": {
      "keyword": "on",
      "patterns": [
        "on click document"
      ]
    },
    "ON_CLOSE": {
      "keyword": "on",
      "patterns": [
        "on close"
      ]
    },
    "ON_DRAG": {
      "keyword": "on",
      "patterns": [
        "on drag"
      ]
    },
    "ON_DROP": {
      "keyword": "on",
      "patterns": [
        "on drop"
      ]
    },
    "ON_ERROR": {
      "keyword": "on",
      "patterns": [
        "on error"
      ]
    },
    "ON_KEY": {
      "keyword": "on",
      "patterns": [
        "on key"
      ]
    },
    "ON_LEAVE": {
      "keyword": "on",
      "patterns": [
        "on leave"
      ]
    },
    "ON_MESSAGE": {
      "keyword": "on",
      "patterns": [
        "on message"
      ]
    },
    "ON_PICK": {
      "keyword": "on",
      "patterns": [
        "on pick {element}"
      ]
    },
    "ON_RESUME": {
      "keyword": "on",
      "patterns": [
        "on resume"
      ]
    },
    "ON_SWIPE": {
      "keyword": "on",
      "patterns": [
        "on swipe left|right"
      ]
    },
    "ON_WINDOW_RESIZE": {
      "keyword": "on",
      "patterns": [
        "on window resize"
      ]
    },
    "PLAY_AUDIO": {
      "keyword": "play",
      "patterns": [
        "play {audioclip}"
      ]
    },
    "POP": {
      "keyword": "pop",
      "patterns": [
        "pop [into] {variable}"
      ]
    },
    "PRINT": {
      "keyword": "print",
      "patterns": [
        "print {value}"
      ]
    },
    "PUSH": {
      "keyword": "push",
      "patterns": [
        "push {value}"
      ]
    },
    "PUT": {
      "keyword": "put",
      "patterns": [
        "put {value} into {variable}"
      ]
    },
    "PUT_STORAGE": {
      "keyword": "put",
      "patterns": [
        "put {value} into storage as {key}"
      ]
    },
    "REMOVE_ATTRIBUTE": {
      "keyword": "remove",
      "patterns": [
        "remove attribute {name} of {element}"
      ]
    },
    "REMOVE_ELEMENT": {
      "keyword": "remove",
      "patterns": [
        "remove element {element}"
      ]
    },
    "REMOVE_STORAGE": {
      "keyword": "remove",
      "patterns": [
        "remove {key} from storage"
      ]
    },
    "RENDER": {
      "keyword": "render",
      "patterns": [
        "render {script} in {parent}"
      ]
    },
    "REPLACE": {
      "keyword": "replace",
      "patterns": [
        "replace {original} with {replacement} in {variable}"
      ]
    },
    "REQUIRE": {
      "keyword": "require",
      "patterns": [
        "require css|js {url}"
      ]
    },
    "REST_GET": {
      "keyword": "get",
      "patterns": [
        "rest get {variable} from {url}"
      ]
    },
    "REST_PATH": {
      "keyword": "rest",
      "patterns": [
        "rest path {path}"
      ]
    },
    "REST_POST": {
      "keyword": "post",
      "patterns": [
        "rest post [to] {url} giving {variable}",
        "rest post {value} to {url} giving {variable}",
        "rest post [to] {url} with {args} giving {variable}"
      ]
    },
    "RETURN": {
      "keyword": "return",
      "patterns": [
        "return"
      ]
    },
    "RUN_MODULE": {
      "keyword": "run",
      "patterns": [
        "run {script}",
        "run {script} with {imports}",
        "run {script} as {module}",
        "run {script} nowait",
        "run {script} with {imports} then {handler}"
      ]
    },
    "SANITIZE": {
      "keyword": "sanitize",
      "patterns": [
        "sanitize {variable}"
      ]
    },
    "SCROLL": {
      "keyword": "scroll",
      "patterns": [
        "scroll to {value}",
        "scroll {element} to {value}"
      ]
    },
    "SEND_MESSAGE": {
      "keyword": "send",
      "patterns": [
        "send {message} to {recipient}",
        "send {message} to parent",
        "send {message} to sender",
        "send to {recipient}"
      ]
    },
    "SET_ARG": {
      "keyword": "set",
      "patterns": [
        "set arg {name} of {variable} to {value}"
      ]
    },
    "SET_ARRAY": {
      "keyword": "set",
      "patterns": [
        "set {variable} to {value} {value} ..."
      ]
    },
    "SET_ATTRIBUTE": {
      "keyword": "set",
      "patterns": [
        "set attribute {name} of {element} to {value}",
        "set attribute {name} of {element}"
      ]
    },
    "SET_ATTRIBUTES": {
      "keyword": "set",
      "patterns": [
        "set [the] attributes of {element} to {value}"
      ]
    },
    "SET_BODY_STYLE": {
      "keyword": "set",
      "patterns": [
        "set {styleName} of body to {value}"
      ]
    },
    "SET_BOOLEAN": {
      "keyword": "set",
      "patterns": [
        "set {variable}"
      ]
    },
    "SET_CLASS": {
      "keyword": "set",
      "patterns": [
        "set [the] class of {element} to {value}"
      ]
    },
    "SET_CONTENT": {
      "keyword": "set",
      "patterns": [
        "set [the] content of {element} to {value}"
      ]
    },
    "SET_CONTENT_VAR": {
      "keyword": "set",
      "patterns": [
        "set [the] content of {element} from {source}",
        "set {element} from {source}"
      ]
    },
    "SET_DEFAULT": {
      "keyword": "set",
      "patterns": [
        "set [the] default of {element} to {value}"
      ]
    },
    "SET_ELEMENTS": {
      "keyword": "set",
      "patterns": [
        "set [the] elements of {variable} to {value}"
      ]
    },
    "SET_ELEMENT_VALUE": {
      "keyword": "set",
      "patterns": [
        "set element {index} of {variable} to {value}"
      ]
    },
    "SET_ENCODING": {
      "keyword": "set",
      "patterns": [
        "set encoding to {value}"
      ]
    },
    "SET_HEAD_STYLE": {
      "keyword": "set",
      "patterns": [
        "set {styleName} to {value}"
      ]
    },
    "SET_ID": {
      "keyword": "set",
      "patterns": [
        "set [the] id of {element} to {value}"
      ]
    },
    "SET_PAYLOAD": {
      "keyword": "set",
      "patterns": [
        "set payload of {callback} to {value}"
      ]
    },
    "SET_PROPERTY": {
      "keyword": "set",
      "patterns": [
        "set property {name} of {variable} to {value}"
      ]
    },
    "SET_READY": {
      "keyword": "set",
      "patterns": [
        "set ready"
      ],
      "aliases": [
        "release parent"
      ]
    },
    "SET_SELECT": {
      "keyword": "set",
      "patterns": [
        "set {select} from {variable} [as {display}]"
      ]
    },
    "SET_SIZE": {
      "keyword": "set",
      "patterns": [
        "set [the] size of {element} to {value}"
      ]
    },
    "SET_STYLE": {
      "keyword": "set",
      "patterns": [
        "set [the] style of {element} to {value}",
        "set {styleName} of {element} to {value}"
      ]
    },
    "SET_STYLES": {
      "keyword": "set",
      "patterns": [
        "set [the] styles of {element} to {value}"
      ]
    },
    "SET_TEXT": {
      "keyword": "set",
      "patterns": [
        "set [the] text of {element} to {value}"
      ]
    },
    "SET_TITLE": {
      "keyword": "set",
      "patterns": [
        "set [the] title to {value}"
      ]
    },
    "SET_TRACER_ROWS": {
      "keyword": "set",
      "patterns": [
        "set [the] tracer rows to {value}"
      ]
    },
    "SET_VAR_TYPE": {
      "keyword": "set",
      "patterns": [
        "set {variable} to array",
        "set {variable} to object"
      ]
    },
    "SORT": {
      "keyword": "sort",
      "patterns": [
        "sort {array} with {function}"
      ]
    },
    "SPLIT": {
      "keyword": "split",
      "patterns": [
        "split {value} on|by {separator} giving|into {variable}"
      ]
    },
    "STOP": {
      "keyword": "stop",
      "patterns": [
        "stop",
        "stop {module}"
      ]
    },
    "SUBTRACT": {
      "keyword": "take",
      "patterns": [
        "take {value} from {variable}",
        "take {value1} from {value2} giving {variable}"
      ],
      "aliases": [
        "subtract"
      ]
    },
    "TOGGLE": {
      "keyword": "toggle",
      "patterns": [
        "toggle {variable}"
      ]
    },
    "TRACE_RUN": {
      "keyword": "trace",
      "patterns": [
        "trace"
      ]
    },
    "TRACE_SETUP": {
      "keyword": "trace",
      "patterns": [
        "trace {variables} [horizontal|vertical]"
      ]
    },
    "TRY": {
      "keyword": "try",
      "patterns": [
        "try"
      ]
    },
    "UPLOAD_FILE": {
      "keyword": "upload",
      "patterns": [
        "upload {file} to {path} with {progress} and {status}"
      ]
    },
    "WAIT": {
      "keyword": "wait",
      "patterns": [
        "wait {value} minute|minutes|second|seconds|tick|ticks"
      ]
    },
    "WHILE": {
      "keyword": "while",
      "patterns": [
        "while {condition}"
      ]
    },
    "CLOSE_MODULE": {
      "keyword": "close",
      "patterns": [
        "close {module}"
      ]
    }
  },
  "connectors": {
    "to": "to",
    "into": "into",
    "from": "from",
    "with": "with",
    "by": "by",
    "of": "of",
    "in": "in",
    "as": "as",
    "on": "on",
    "and": "and",
    "or": "or",
    "giving": "giving",
    "the": "the"
  },
  "literals": {
    "true": "true",
    "false": "false",
    "body": "body",
    "array": "array",
    "object": "object",
    "storage": "storage",
    "parent": "parent",
    "sender": "sender",
    "ready": "ready",
    "nowait": "nowait"
  },
  "timeUnits": {
    "second": "second",
    "seconds": "seconds",
    "minute": "minute",
    "minutes": "minutes",
    "tick": "tick",
    "ticks": "ticks"
  },
  "conditions": {
    "is": "is",
    "not": "not",
    "greater": "greater",
    "less": "less",
    "than": "than",
    "includes": "includes",
    "starts": "starts",
    "ends": "ends",
    "empty": "empty",
    "numeric": "numeric",
    "even": "even",
    "odd": "odd"
  },
  "diagnostics": {
    "unknownCommand": "I don't understand '{token}' at line {line}.",
    "undeclaredVariable": "Variable '{name}' has not been declared.",
    "unexpectedToken": "Expected '{expected}' but got '{actual}' at line {line}.",
    "divisionByZero": "Division by zero at line {line}.",
    "indexOutOfRange": "Index {index} is out of range at line {line}.",
    "moduleNotFound": "Module '{name}' not found.",
    "syntaxError": "Syntax error at line {line}: {detail}."
  },
  "words": {
    "and": "and",
    "as": "as",
    "assign": "assign",
    "attribute": "attribute",
    "back": "back",
    "body": "body",
    "by": "by",
    "cache": "cache",
    "confirm": "confirm",
    "delimited": "delimited",
    "document": "document",
    "element": "element",
    "else": "else",
    "exists": "exists",
    "focus": "focus",
    "from": "from",
    "giving": "giving",
    "handle": "handle",
    "horizontal": "horizontal",
    "in": "in",
    "into": "into",
    "is": "is",
    "json": "json",
    "keys": "keys",
    "last": "last",
    "message": "message",
    "name": "name",
    "new": "new",
    "nocase": "nocase",
    "not": "not",
    "nowait": "nowait",
    "number": "number",
    "of": "of",
    "offset": "offset",
    "on": "on",
    "or": "or",
    "path": "path",
    "position": "position",
    "program": "program",
    "reply": "reply",
    "resize": "resize",
    "rows": "rows",
    "running": "running",
    "state": "state",
    "storage": "storage",
    "subject": "subject",
    "symbol": "symbol",
    "symbols": "symbols",
    "than": "than",
    "the": "the",
    "then": "then",
    "to": "to",
    "tracing": "tracing",
    "unsorted": "unsorted",
    "url": "url",
    "vertical": "vertical",
    "whitespace": "whitespace",
    "with": "with",
    "end": "end",
    "length": "length",
    "elements": "elements",
    "index": "index",
    "value": "value",
    "left": "left",
    "right": "right",
    "field": "field",
    "property": "property",
    "random": "random",
    "cos": "cos",
    "sin": "sin",
    "tan": "tan",
    "acos": "acos",
    "asin": "asin",
    "atan": "atan",
    "now": "now",
    "timestamp": "timestamp",
    "today": "today",
    "newline": "newline",
    "backtick": "backtick",
    "empty": "empty",
    "uuid": "uuid",
    "date": "date",
    "encode": "encode",
    "decode": "decode",
    "lowercase": "lowercase",
    "hash": "hash",
    "reverse": "reverse",
    "trim": "trim",
    "char": "char",
    "character": "character",
    "true": "true",
    "false": "false",
    "year": "year",
    "month": "month",
    "monthnumber": "monthnumber",
    "day": "day",
    "daynumber": "daynumber",
    "hour": "hour",
    "minute": "minute",
    "second": "second",
    "millisecond": "millisecond",
    "modulo": "modulo",
    "time": "time",
    "radius": "radius",
    "cat": "cat",
    "greater": "greater",
    "less": "less",
    "even": "even",
    "odd": "odd",
    "includes": "includes",
    "starts": "starts",
    "ends": "ends",
    "numeric": "numeric",
    "array": "array",
    "object": "object",
    "an": "an",
    "arg": "arg",
    "payload": "payload",
    "ready": "ready",
    "format": "format",
    "module": "module",
    "variable": "variable",
    "callback": "callback",
    "set": "set",
    "sort": "sort",
    "shuffle": "shuffle",
    "parse": "parse",
    "delete": "delete",
    "rename": "rename",
    "add": "add",
    "split": "split",
    "replace": "replace",
    "count": "count",
    "size": "size",
    "mobile": "mobile",
    "portrait": "portrait",
    "landscape": "landscape",
    "br": "br",
    "location": "location",
    "key": "key",
    "hostname": "hostname",
    "browser": "browser",
    "content": "content",
    "text": "text",
    "selected": "selected",
    "color": "color",
    "style": "style",
    "screen": "screen",
    "top": "top",
    "bottom": "bottom",
    "width": "width",
    "height": "height",
    "scroll": "scroll",
    "parent": "parent",
    "history": "history",
    "pick": "pick",
    "drag": "drag",
    "click": "click",
    "window": "window",
    "viewport": "viewport",
    "item": "item",
    "prompt": "prompt",
    "styles": "styles",
    "fullscreen": "fullscreen",
    "exit": "exit",
    "title": "title",
    "default": "default",
    "tracer": "tracer",
    "class": "class",
    "id": "id",
    "attributes": "attributes",
    "milli": "milli",
    "millis": "millis",
    "seconds": "seconds",
    "minutes": "minutes",
    "tick": "tick",
    "ticks": "ticks",
    "swipe": "swipe",
    "language": "language",
    "alert": "alert",
    "append": "append",
    "attach": "attach",
    "clear": "clear",
    "continue": "continue",
    "convert": "convert",
    "copy": "copy",
    "create": "create",
    "debug": "debug",
    "alias": "alias",
    "div": "div",
    "span": "span",
    "button": "button",
    "input": "input",
    "textarea": "textarea",
    "select": "select",
    "option": "option",
    "a": "a",
    "p": "p",
    "pre": "pre",
    "h1": "h1",
    "h2": "h2",
    "h3": "h3",
    "h4": "h4",
    "h5": "h5",
    "h6": "h6",
    "img": "img",
    "image": "image",
    "canvas": "canvas",
    "table": "table",
    "tr": "tr",
    "td": "td",
    "th": "th",
    "ul": "ul",
    "li": "li",
    "form": "form",
    "fieldset": "fieldset",
    "legend": "legend",
    "label": "label",
    "blockquote": "blockquote",
    "hr": "hr",
    "section": "section",
    "file": "file",
    "audioclip": "audioclip",
    "progress": "progress",
    "disable": "disable",
    "divide": "divide",
    "dummy": "dummy",
    "enable": "enable",
    "every": "every",
    "filter": "filter",
    "fork": "fork",
    "request": "request",
    "get": "get",
    "gosub": "gosub",
    "go": "go",
    "highlight": "highlight",
    "if": "if",
    "import": "import",
    "log": "log",
    "mail": "mail",
    "mqtt": "mqtt",
    "send": "send",
    "multiply": "multiply",
    "negate": "negate",
    "play": "play",
    "pop": "pop",
    "print": "print",
    "push": "push",
    "put": "put",
    "remove": "remove",
    "render": "render",
    "require": "require",
    "rest": "rest",
    "post": "post",
    "return": "return",
    "run": "run",
    "sanitize": "sanitize",
    "stop": "stop",
    "take": "take",
    "toggle": "toggle",
    "trace": "trace",
    "try": "try",
    "upload": "upload",
    "wait": "wait",
    "while": "while",
    "close": "close",
    "binary": "binary",
    "directory": "directory",
    "exist": "exist",
    "plugin": "plugin",
    "timeout": "timeout",
    "line": "line",
    "for": "for",
    "begin": "begin",
    "round": "round",
    "animation": "animation",
    "trigger": "trigger",
    "specification": "specification",
    "spec": "spec",
    "opacity": "opacity",
    "start": "start",
    "step": "step",
    "load": "load",
    "circle": "circle",
    "ellipse": "ellipse",
    "group": "group",
    "rect": "rect",
    "move": "move",
    "svgtext": "svgtext",
    "gmap": "gmap",
    "marker": "marker",
    "show": "show",
    "update": "update",
    "latitude": "latitude",
    "longitude": "longitude",
    "bounds": "bounds",
    "init": "init",
    "find": "find",
    "profile": "profile",
    "mode": "mode",
    "neighbours": "neighbours",
    "cell": "cell",
    "anagrams": "anagrams",
    "server": "server",
    "status": "status",
    "port": "port",
    "email": "email",
    "password": "password",
    "user": "user",
    "html": "html",
    "broker": "broker",
    "subscribe": "subscribe",
    "qos": "qos",
    "token": "token",
    "connect": "connect",
    "layout": "layout",
    "panel": "panel",
    "dialog": "dialog",
    "checkbox": "checkbox",
    "combobox": "combobox",
    "listbox": "listbox",
    "pushbutton": "pushbutton",
    "lineinput": "lineinput",
    "multiline": "multiline",
    "mdpanel": "mdpanel",
    "groupbox": "groupbox",
    "icon": "icon",
    "background": "background",
    "spacing": "spacing",
    "stretch": "stretch",
    "expand": "expand",
    "spacer": "spacer",
    "alignment": "alignment",
    "align": "align",
    "blocked": "blocked",
    "current": "current",
    "hide": "hide",
    "center": "center",
    "adjust": "adjust",
    "type": "type",
    "zoom": "zoom",
    "via": "via",
    "memory": "memory"
  }
};
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
			const packName = `AllSpeak_LanguagePack_${langName}`;
			const pack = typeof window !== `undefined` ? window[packName] : null;
			if (pack) {
				AllSpeak_Language.init(pack);
				// Reset cached compile handler tables
				if (AllSpeak_Core._compileHandlers) AllSpeak_Core._compileHandlers = null;
				if (AllSpeak_Browser._compileHandlers) AllSpeak_Browser._compileHandlers = null;
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
		file.forEach(function (line, lino) {
			scriptLines.push({
				lino: lino + 1,
				line
			});
			const len = line.length;
			let token = ``;
			let inSpace = true;
			for (let n = 0; n < len; n++) {
				const c = line[n];
				if (c.trim().length == 0) {
					if (inSpace) {
						continue;
					}
					tokens.push({
						index,
						lino: lino + 1,
						token
					});
					index++;
					token = ``;
					inSpace = true;
					continue;
				}
				inSpace = false;
				if (c === `\``) {
					m = n;
					while (++n < line.length) {
						if (line[n] === `\``) {
							break;
						}
					}
					token = line.substr(m, n - m + 1);
				} else if (c == `!`) {
					break;
				} else {
					token += c;
				}
			}
			if (token.length > 0) {
				tokens.push({
					index,
					lino: lino + 1,
					token
				});
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
AllSpeak.version = `250824`;
AllSpeak.timestamp = Date.now();
AllSpeak.writeStartupTrace(`AllSpeak loaded; waiting for page`);

function AllSpeak_Startup() {
	AllSpeak.writeStartupTrace(`window.onload fired`);
	AllSpeak.writeStartupTrace(`${Date.now() - AllSpeak.timestamp} ms: Start AllSpeak`);
	AllSpeak.timestamp = Date.now();
	AllSpeak.scripts = {};
	// Initialize the language pack (default: English, unless one is already loaded)
	if (!AllSpeak_Language.pack && typeof AllSpeak_LanguagePack_en !== `undefined`) {
		AllSpeak_Language.init(AllSpeak_LanguagePack_en);
	}
	window.AllSpeak = AllSpeak;
	const script = document.getElementById(`allspeak-script`);
	if (script) {
		AllSpeak.writeStartupTrace(`Found #allspeak-script (${script.innerText.split(`\n`).length} lines)`);
		script.style.display = `none`;
		try {
			AllSpeak.writeStartupTrace(`Calling AllSpeak.start`);
			AllSpeak.start(script.innerText);
			AllSpeak.writeStartupTrace(`AllSpeak.start returned`);
		}
		catch (err) {
			AllSpeak.reportError(err);
		}
	} else {
		AllSpeak.writeStartupTrace(`No #allspeak-script element found`);
	}
}

// For browsers
window.onload = AllSpeak_Startup;
