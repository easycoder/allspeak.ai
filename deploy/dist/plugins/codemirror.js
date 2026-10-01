const AllSpeak_CodeMirror = {

	name: `AllSpeak_CodeMirror`,

	CodeMirror: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `init`:
				const mode = compiler.nextToken();
				let profile = ``;
				if (compiler.nextIsWord(`profile`)) {
					profile = compiler.getNextValue();
				}
				compiler.addCommand({
					domain: `codemirror`,
					keyword: `codemirror`,
					lino,
					action,
					mode,
					profile
				});
				return true;
			case `attach`:
				if (compiler.nextIsWord(`to`)) {
					if (compiler.nextIsSymbol()) {
						const editor = compiler.getToken();
						let mode = `ecs`;
						if (compiler.nextIsWord(`mode`)) {
							mode = compiler.nextToken();
							compiler.next();
						}
						compiler.addCommand({
							domain: `codemirror`,
							keyword: `codemirror`,
							lino,
							action,
							editor,
							mode
						});
						return true;
					}
				}
				break;
			case `set`:
				if (compiler.nextIsWord(`content`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const editor = compiler.getSymbolRecord();
							if (compiler.nextIsWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `codemirror`,
									keyword: `codemirror`,
									lino,
									action: `setContent`,
									editor: editor.name,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `find`:
				if (compiler.nextIsWord(`in`)) {
					if (compiler.nextIsSymbol()) {
						const editor = compiler.getSymbolRecord();
						compiler.next();
						compiler.addCommand({
							domain: `codemirror`,
							keyword: `codemirror`,
							lino,
							action: `find`,
							editor: editor.name
						});
						return true;
					}
				}
				return false;
			case `close`:
				if (compiler.nextIsSymbol()) {
					const editor = compiler.getSymbolRecord();
					compiler.next();
					compiler.addCommand({
						domain: `codemirror`,
						keyword: `codemirror`,
						lino,
						action: `close`,
						editor: editor.name
					});
					return true;
				}
				return false;
			case `get`:
				if (compiler.nextIsWord(`content`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const editor = compiler.getSymbolRecord();
							if (compiler.nextIsWord(`into`)) {
								if (compiler.nextIsSymbol()) {
									const target = compiler.getSymbolRecord();
									compiler.next();
									compiler.addCommand({
										domain: `codemirror`,
										keyword: `codemirror`,
										lino,
										action: `getContent`,
										editor: editor.name,
										target: target.name
									});
									return true;
								}
							}
						}
					}
				}
				// The failed nextIsWord above leaves the index on `cursor` —
				// check it without advancing, then continue as before.
				if (compiler.isWord(`cursor`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const editor = compiler.getSymbolRecord();
							if (compiler.nextIsWord(`into`)) {
								if (compiler.nextIsSymbol()) {
									const target = compiler.getSymbolRecord();
									compiler.next();
									compiler.addCommand({
										domain: `codemirror`,
										keyword: `codemirror`,
										lino,
										action: `getCursor`,
										editor: editor.name,
										target: target.name
									});
									return true;
								}
							}
						}
					}
				}
				return false;
			// The scroll offset of the viewport, read and written. Separate from the caret on purpose:
			// scrolling must not move the insertion point, and coming back to a file must not move the
			// view. The editor keeps both per tab so that neither disturbs the other — which is the
			// behaviour a video editor teaches you to expect and a text editor usually does not.
			case `view`:
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const editor = compiler.getSymbolRecord();
						if (compiler.nextIsWord(`into`)) {
							if (compiler.nextIsSymbol()) {
								const target = compiler.getSymbolRecord();
								compiler.next();
								compiler.addCommand({
									domain: `codemirror`,
									keyword: `codemirror`,
									lino,
									action: `getView`,
									editor: editor.name,
									target: target.name
								});
								return true;
							}
						}
					}
				}
				// `isWord` and not `nextIsWord`: the failed test above left the index *on* the action
				// word, and `getNextValue` reads the token after the one the index is on — so advancing
				// here would step over the value and read `in` as it. That is the same trap the `get`
				// chain carries a warning about, and it cost a compile to find.
				if (compiler.isWord(`to`)) {
					const offset = compiler.getNextValue();
					// Value compilation consumes the expression, so `in` sits at the current index and is
					// checked without advancing.
					if (compiler.isWord(`in`)) {
						if (compiler.nextIsSymbol()) {
							const editor = compiler.getSymbolRecord();
							compiler.next();
							compiler.addCommand({
								domain: `codemirror`,
								keyword: `codemirror`,
								lino,
								action: `setView`,
								editor: editor.name,
								offset
							});
							return true;
						}
					}
				}
				return false;
			case `cursor`:
				if (compiler.nextIsWord(`to`)) {
					if (compiler.nextIsWord(`line`)) {
						const line = compiler.getNextValue();
						if (compiler.isWord(`in`)) {
							if (compiler.nextIsSymbol()) {
								const editor = compiler.getSymbolRecord();
								compiler.next();
								compiler.addCommand({
									domain: `codemirror`,
									keyword: `codemirror`,
									lino,
									action: `setCursor`,
									editor: editor.name,
									line
								});
								return true;
							}
						}
					}
				}
				return false;
			case `scroll`:
				if (compiler.nextIsWord(`to`)) {
					if (compiler.nextIsWord(`line`)) {
						const line = compiler.getNextValue();
						// Value compilation consumes the expression, so `in`
						// sits at the current index — check without advancing.
						if (compiler.isWord(`in`)) {
							if (compiler.nextIsSymbol()) {
								const editor = compiler.getSymbolRecord();
								compiler.next();
								compiler.addCommand({
									domain: `codemirror`,
									keyword: `codemirror`,
									lino,
									action: `scrollToLine`,
									editor: editor.name,
									line
								});
								return true;
							}
						}
					}
				}
				return false;
			default:
				throw new Error(`Unrecognized action '${action}'`);
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			var editor;
			switch (command.action) {
			case `init`:
				switch (command.mode) {
				case `basic`:
					program.require(`css`, `/dist/plugins/codemirror/codemirror.css`,
						function () {
							program.require(`js`, `/dist/plugins/codemirror/codemirror.js`,
								function () {
									if (command.profile) {
										program.require(`js`, program.getValue(command.profile),
											function () {
												program.run(command.pc + 1);
											});
									} else {
										program.run(command.pc + 1);
									}
								});
						});
					return 0;
				}
				break;
			case `attach`:
				try {
					editor = program.getSymbolRecord(command.editor);
					const element = document.getElementById(editor.element[editor.index].id);
					editor.editor = CodeMirror.fromTextArea(element, {
						mode: command.mode,
						theme: `default`,
						lineNumbers: true
					});
					editor.editor.setSize(`100%`, `100%`);
				} catch (err) { alert(err); }
				break;
			case `setContent`:
				editor = program.getSymbolRecord(command.editor);
				const value = program.getValue(command.value);
				editor.editor.setValue(value);
				break;
			case `find`:
				editor = program.getSymbolRecord(command.editor);
				editor.editor.execCommand(`find`);
				break;
			case `close`:
				editor = program.getSymbolRecord(command.editor);
				editor.editor.toTextArea();
				break;
			case `getContent`:
				editor = program.getSymbolRecord(command.editor);
				const content = editor.editor.getValue();
				const targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content
				};
				targetRecord.used = true;
				break;
			case `getCursor`:
				editor = program.getSymbolRecord(command.editor);
				const cursorPos = editor.editor.getCursor();
				const cursorTarget = program.getSymbolRecord(command.target);
				cursorTarget.value[cursorTarget.index] = {
					type: `constant`,
					numeric: true,
					content: cursorPos.line
				};
				cursorTarget.used = true;
				break;
			case `scrollToLine`:
				editor = program.getSymbolRecord(command.editor);
				const scrollLine = program.getValue(command.line);
				// The editor may have been hidden since its last measure (e.g.
				// Blocks mode) — refresh so the coordinates are current.
				editor.editor.refresh();
				const lineTop = editor.editor.charCoords({ line: scrollLine, ch: 0 }, `local`).top;
				editor.editor.scrollTo(null, Math.max(lineTop - 20, 0));
				break;
			case `getView`:
				editor = program.getSymbolRecord(command.editor);
				const viewTarget = program.getSymbolRecord(command.target);
				viewTarget.value[viewTarget.index] = {
					type: `constant`,
					numeric: true,
					content: editor.editor.getScrollInfo().top
				};
				viewTarget.used = true;
				break;
			case `setView`:
				editor = program.getSymbolRecord(command.editor);
				const viewOffset = program.getValue(command.offset);
				// Refresh first, for the same reason `scrollToLine` does: an editor hidden since its
				// last measure would otherwise scroll within a stale layout.
				editor.editor.refresh();
				editor.editor.scrollTo(null, viewOffset);
				break;
			case `setCursor`:
				editor = program.getSymbolRecord(command.editor);
				// `setCursor` deliberately does not scroll: the caret and the view are independent, so
				// putting the caret back must not drag the view to it. That is the whole distinction
				// between this and `scrollToLine`.
				editor.editor.setCursor({ line: program.getValue(command.line), ch: 0 });
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `codemirror`:
			return AllSpeak_CodeMirror.CodeMirror;
		default:
			return null;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = AllSpeak_CodeMirror.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown keyword '${command.keyword}' in 'codemirror' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: () => {
			return null;
		},
		get: () => {}
	},

	condition: {

		compile: () => {},
		test: () => {}
	}
};

// eslint-disable-next-line no-unused-vars
AllSpeak.domain.codemirror = AllSpeak_CodeMirror;
