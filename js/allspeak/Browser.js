const AllSpeak_Browser = {

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
			const name = compiler.nextToken();
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
					if (token === `url`) {
						url = compiler.getNextValue();
					} else if (token === `state`) {
						state = compiler.getNextValue();
					} else if (token === `title`) {
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
				if ([`left`, `right`].includes(compiler.nextToken())) {
					const direction = compiler.getToken();
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
			if (compiler.nextToken() === `fullscreen`) {
				let option = ``;
				if (compiler.nextToken() === `exit`) {
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
					if (token === `from`) {
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
				if (token === `the`) {
					token = compiler.nextToken();
				}
				if (token === `title`) {
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
				} else if (token === `content`) {
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
				} else if (token === `class`) {
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
				} else if (token === `id`) {
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
				} else if (token === `text`) {
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
				} else if (token === `size`) {
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
				} else if (token === `attribute`) {
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
				} else if (token === `attributes`) {
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
				} else if (token === `style`) {
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
					if (token === `of`) {
						if (compiler.nextToken() === `body`) {
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
					else if (token === `to`) {
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
				} else if (token === `default`) {
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
				} else if (token === `tracer`) {
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
