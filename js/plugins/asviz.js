// AllSpeak viz plugin — static analysis of a script's compiled IR.
//
// It answers "what is this script made of?" by reporting the ANCHORS — the places
// where control flow is not simply the next line: labels, `while` tests, and the
// points where an event handler is entered. It also derives just enough of the
// control-flow graph to say whether each anchor can be reached at all. Nothing is
// executed and nothing is drawn; the AllSpeak framework (viz.as) presents it.
//
// Host contract (this is the seam that later becomes the dev server's /read):
//
//     AllSpeak_Viz.target = `codex/en/code/step13.as`;
//     AllSpeak_Viz.sources[`codex/en/code/step13.as`] = sourceText;
//
// Acquisition — file read, fetch, editor buffer — stays on the host side,
// because that is where the platform differences live. See tools/asviz-run.js
// (Node) and viz.html (browser).
//
// Output: newline-separated records of 'field=value' pairs joined by ' | '. The
// kind is first, and `reachable` comes immediately after the word `anchor`, so the
// framework can classify and filter with prefix tests and core vocabulary alone.

// How many visits a window may collect before the runtime stops collecting. The cap is a
// runaway guard, not a policy: a window with no stop stays open on purpose, so it can
// outlive the thread that opened it and pick up whatever that thread set in motion.
const VIZ_DEFAULT_LIMIT = 100000;

// eslint-disable-next-line no-unused-vars
const AllSpeak_Viz = {

	name: `AllSpeak_Viz`,

	// The script the framework is currently looking at, and the text to analyse.
	target: ``,
	sources: {},
	// Non-empty when a target could not be compiled. The host clears this before
	// each target and can use it to set an exit code.
	problems: [],
	// The analyser's --json output, keyed by path. The host supplies it; the plugin
	// interprets it. An absent entry just means no prose.
	sections: {},

	Model: {

		// model the script [in <path>] giving <variable>
		compile: (compiler) => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isWord(`the`)) compiler.next();
			if (compiler.isWord(`script`)) compiler.next();
			let path = null;
			if (compiler.isWord(`in`)) {
				compiler.next();
				path = compiler.getValue();
			}
			if (!compiler.isWord(`giving`)) {
				throw new Error(`viz 'model' (line ${lino + 1}): expected ` +
					`'model the script [in <path>] giving <variable>'`);
			}
			compiler.next();
			const target = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `viz`,
				keyword: `model`,
				lino,
				path,
				target
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const path = command.path ? program.getValue(command.path) : AllSpeak_Viz.target;
			const text = AllSpeak_Viz.sources[path];
			if (typeof text !== `string`) {
				program.runtimeError(command.lino,
					`viz: no source registered for '${path}' — the host must set ` +
					`AllSpeak_Viz.sources['${path}']`);
				return command.pc + 1;
			}
			const target = program.getSymbolRecord(command.target);
			const records = AllSpeak_Viz.model(path, text);
			// Hand the framework a list, the way `split` does, so that one framework
			// serves both runtimes — the Python runtime's `split` has a different
			// shape, and `the elements of` reads this in both.
			target.elements = records.length;
			for (let n = 0; n < records.length; n++) {
				target.value[n] = {
					type: `constant`,
					numeric: false,
					content: records[n]
				};
			}
			target.index = 0;
			return command.pc + 1;
		}
	},

	// Compile the source without running it, then report the anchors.
	model: function (path, text) {
		const lines = text.split(`\n`);
		// A trailing newline yields a final empty element; it is not a line.
		if (lines.length > 0 && lines[lines.length - 1] === ``) lines.pop();
		const source = AllSpeak.tokeniseFile(lines);
		// The imports argument must not be null: the `import` compile handler
		// dereferences imports.caller. An empty array means "no imports", and the
		// handler's own length test takes the no-import branch.
		//
		// The language pack is global state, and a `language xx` directive in the
		// target switches it — for the whole runtime, so the framework and the next
		// target would inherit the language of the script just analysed. Save and
		// restore around the compile; the model itself is already built by then.
		const savedPack = AllSpeak_Language.pack;
		// The target's own `script <name>` command registers it in the global script
		// registry during compile. A compile-only pass must not leave it there: a
		// second script declaring the same name would then refuse to compile.
		const knownScripts = Object.keys(AllSpeak.scripts);
		let compiled;
		let problem = null;
		try {
			compiled = AllSpeak.compileScript(source, [], null, null);
		} catch (err) {
			// A target that will not compile is a finding, not a crash. There is no
			// early return either: the narrative is useful for exactly the scripts we
			// cannot run, so the IR analysis simply has nothing to say and the doc
			// blocks carry the report.
			problem = String((err && err.message) || err).split(`\n`)[0];
			AllSpeak_Viz.problems.push(problem);
			compiled = [];
			compiled.symbols = {};
		} finally {
			for (const key of Object.keys(AllSpeak.scripts)) {
				if (knownScripts.indexOf(key) < 0) delete AllSpeak.scripts[key];
			}
			if (savedPack && AllSpeak_Language.pack !== savedPack) {
				AllSpeak_Language.init(savedPack);
				AllSpeak_Viz.clearCompileCaches();
			}
		}

		// ---- the anchors ----

		// A label emits no command in this runtime: it is a symbol-table entry
		// pointing at the next command. So a symbol is a label exactly when its
		// pc does not land on a symbol record. Its own line number is not stored
		// anywhere, so recover it from the tokeniser instead — labels are tokens
		// ending in ':'.
		const labelLine = function (name) {
			for (const token of source.tokens) {
				if (token.token === name + `:`) return token.lino;
			}
			return 0;
		};

		// Loop sites. A `while` compiles to: test @pc, exit 'goto' @pc+1, body
		// from pc+2, back 'goto' at the end. So a loop occupies the half-open
		// interval [pc+2, exit), and nesting depth is just "how many loop
		// intervals contain this pc" — no dominator analysis needed.
		const loops = [];
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			if (command.opcode === `WHILE` || command.keyword === `while`) {
				const exit = compiled[pc + 1];
				const end = (exit && typeof exit.goto === `number` && exit.goto > pc)
					? exit.goto : null;
				loops.push({ lino: command.lino, pc, start: pc + 2, end });
			}
		}

		// Event registrations. `on ...` and `every ...` compile as: the
		// registration @pc, a 'goto' @pc+1 that skips the handler, and the handler
		// itself from pc+2 — which is why the runtime records `const cb = pc + 2`.
		// The handler is entered by an event, not by falling in from the line above,
		// so its entry pc is a root for reachability. The skip-goto is checked
		// rather than assumed, so a domain with a different layout reports no entry
		// instead of a wrong one.
		const events = [];
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			const opcode = String(command.opcode || ``);
			const isEvent = opcode.indexOf(`ON_`) === 0 || opcode === `EVERY` ||
				command.keyword === `on` || command.keyword === `every`;
			if (!isEvent) continue;
			const skip = compiled[pc + 1];
			const hasSkip = skip && typeof skip.goto === `number` && skip.goto > pc + 1;
			const entry = hasSkip ? pc + 2 : null;
			events.push({
				lino: command.lino,
				pc,
				entry,
				end: hasSkip ? skip.goto : null,
				name: command.action
					? (command.symbol ? `${command.action}:${command.symbol}` : command.action)
					: (command.keyword || `?`)
			});
		}

		// `viz start` and `viz stop` are landmarks the author placed deliberately, so they
		// belong in the model alongside labels and loops: the narrative should show where
		// a script is instrumented, and the window analysis is the pre-flight — it says
		// what a window would capture and whether it can close.
		const markers = [];
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			if (command.keyword !== `viz` || !command.request) continue;
			markers.push({
				pc,
				line: command.lino,
				request: command.request,
				mode: command.mode || `once`,
				limit: command.limit || VIZ_DEFAULT_LIMIT,
				until: command.until,
				point: command.point
			});
		}

		// Labels, found by symbol-table shape rather than by name.
		const labels = labelsOf(compiled);

		// ---- the control-flow graph, in the smallest form that answers a question ----

		// A `return` goes wherever the matching `gosub` will resume, which is not
		// statically known — so every pc that follows a gosub is a possible return
		// target. Conservative, and cheap.
		const returnTargets = [];
		const gosubTargets = {};
		const forkTargets = {};
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			if (command.opcode === `GOSUB` || command.keyword === `gosub`) {
				returnTargets.push(pc + 1);
				if (command.label) gosubTargets[command.label] = true;
			}
			if (command.opcode === `FORK` || command.keyword === `fork`) {
				if (command.label) forkTargets[command.label] = true;
			}
		}

		// Jumps that cannot be resolved statically, reported so that an "unreachable"
		// verdict can be read as approximate rather than wrong.
		let dynamic = 0;
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			if (command.gotoExpr || command.gosubExpr || command.forkExpr) dynamic++;
			else if (command.opcode === `RETURN`) dynamic++;
			else if (command.opcode === `RUN_MODULE` || command.opcode === `REQUIRE`) dynamic++;
		}

		const labelPc = function (name) {
			const entry = compiled.symbols[name];
			return entry ? entry.pc : null;
		};

		const baseSuccessors = function (pc) {
			const command = compiled[pc];
			if (!command) return [];
			const opcode = String(command.opcode || ``);
			const keyword = command.keyword;
			const next = pc + 1;

			if (opcode === `EXIT` || keyword === `exit`) return [];
			if (opcode === `STOP` || keyword === `stop`) {
				// `stop <module>` closes a module and falls through; plain `stop`
				// ends the thread.
				return command.name ? [next] : [];
			}
			if (opcode === `GOTO` || keyword === `goto` || keyword === `go`) {
				if (typeof command.goto === `number`) return [command.goto];
				if (command.label) {
					const at = labelPc(command.label);
					return at === null ? [] : [at];
				}
				return [];
			}
			if (opcode === `GOSUB` || keyword === `gosub`) {
				const at = command.label ? labelPc(command.label) : null;
				return at === null ? [next] : [at, next];
			}
			if (opcode === `RETURN` || keyword === `return`) return returnTargets.slice();
			if (opcode === `IF` || keyword === `if`) {
				return typeof command.else === `number` ? [next, command.else] : [next];
			}
			if (opcode === `WHILE` || keyword === `while`) return [next, pc + 2];
			if (opcode === `FORK` || keyword === `fork`) {
				const at = command.label ? labelPc(command.label) : null;
				return at === null ? [next] : [at, next];
			}
			if (opcode === `TRY` || keyword === `try`) {
				return typeof command.handlerPC === `number`
					? [next, command.handlerPC] : [next];
			}
			return [next];
		};

		const successors = function (pc) {
			const out = baseSuccessors(pc);
			const command = compiled[pc];
			// Any command carrying a failure clause can transfer to its handler.
			if (command && typeof command.onError === `number` && command.onError > 0) {
				out.push(command.onError);
			}
			return out;
		};

		// Roots: the program start, plus every event handler entry. Without the
		// latter, an `on ... go to Handler` target would look unreachable, because
		// the skip-goto means it is never reached by falling through.
		const reachable = {};
		const named = {};
		const stack = [0];
		for (const event of events) {
			if (event.entry !== null) stack.push(event.entry);
		}
		while (stack.length > 0) {
			const pc = stack.pop();
			if (typeof pc !== `number` || pc < 0 || reachable[pc]) continue;
			reachable[pc] = true;
			for (const successor of successors(pc)) stack.push(successor);
			// A label can also be *named* rather than jumped to. `sort List with
			// Comparator` is the common case: the runtime calls the label, so it is
			// an entry point with no incoming edge. This is the same "is the name
			// mentioned in the command?" test the compiler uses when it warns about
			// unused symbols, and it errs towards reachable, which is the safe
			// direction for a finding.
			const command = compiled[pc];
			if (!command) continue;
			const text = JSON.stringify(command);
			for (const label of labels) {
				if (reachable[label.pc]) continue;
				if (text.indexOf(`"${label.name}"`) >= 0 ||
					text.indexOf(`"${label.name}:`) >= 0) {
					named[label.name] = true;
					stack.push(label.pc);
				}
			}
		}

		const reachableAt = (pc) => (reachable[pc] ? `yes` : `no`);
		const depthAt = function (pc) {
			let depth = 0;
			for (const loop of loops) {
				if (loop.end === null) continue;
				if (pc >= loop.start && pc < loop.end) depth++;
			}
			return depth;
		};

		// ---- what shape each label block is ----
		//
		// Descriptive, not judgemental. A block can be entered by a call and also by
		// falling in from the line above; it can leave by `return`, by a tail `go`, or
		// by falling out into the next label. All of those are deliberate idioms — the
		// shared exit is how a deep if/else in business logic gets an escape hatch —
		// so this records the shape rather than scoring it. It is also what makes an
		// `unreachable` verdict readable: `reachable=no | entry=none` is a confident
		// claim, while `reachable=no | entry=call` says the analysis missed an edge.
		const eventEntries = {};
		const eventTargets = {};
		for (const event of events) {
			if (event.entry !== null) eventEntries[event.entry] = true;
			if (event.entry === null || event.end === null) continue;
			// A handler's body usually jumps to its real target, so the label an
			// event reaches is the target of a `go` inside the handler body — not the
			// handler body's own first pc.
			for (let pc = event.entry; pc < event.end; pc++) {
				const command = compiled[pc];
				if (!command) continue;
				if (typeof command.goto === `number`) continue;
				if (command.label) eventTargets[command.label] = true;
			}
		}

		const jumpTargets = {};
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			const opcode = String(command.opcode || ``);
			if ((opcode === `GOTO` || command.keyword === `goto` ||
				command.keyword === `go`) && typeof command.goto !== `number` &&
				command.label) {
				jumpTargets[command.label] = true;
			}
		}

		const unique = (list) => list.filter((v, i, a) => a.indexOf(v) === i);

		// Which pcs anything can enter at all, and which are entered by falling out of
		// the command above. One pass, so that `entry=none` can mean "nothing enters
		// this label" rather than just "no bucket matched".
		const incoming = {};
		const fromPrev = {};
		for (let pc = 0; pc < compiled.length; pc++) {
			for (const successor of successors(pc)) {
				incoming[successor] = true;
				if (successor === pc + 1) fromPrev[successor] = true;
			}
		}
		const pcs = [];
		for (const label of labels.slice().sort((a, b) => a.pc - b.pc)) {
			if (pcs.indexOf(label.pc) < 0) pcs.push(label.pc);
		}
		const blockEnd = function (pc) {
			const n = pcs.indexOf(pc);
			return (n >= 0 && n + 1 < pcs.length) ? pcs[n + 1] : compiled.length;
		};

		const shapeOf = function (label) {
			const end = blockEnd(label.pc);
			const entry = [];
			if (gosubTargets[label.name]) entry.push(`call`);
			if (forkTargets[label.name]) entry.push(`fork`);
			if (eventTargets[label.name] || eventEntries[label.pc]) entry.push(`event`);
			if (jumpTargets[label.name]) entry.push(`jump`);
			// `named` is the broad "the name appears as a value" test, so it also
			// fires for call and jump targets. Only report it when it is the *sole*
			// trace of the label — which is the callback case, the one that would
			// otherwise look unreachable.
			if (named[label.name] && !gosubTargets[label.name] && !forkTargets[label.name] &&
				!jumpTargets[label.name] && !eventTargets[label.name]) {
				entry.push(`named`);
			}
			if (label.pc > 0 && successors(label.pc - 1).indexOf(label.pc) >= 0) {
				entry.push(`fall-in`);
			}
			// A label nothing names but something jumps to: the compiler's own loop
			// exits and `if` branches land here, so it is entered, just not by name.
			if (entry.length === 0 && incoming[label.pc]) entry.push(`branch`);
			if (entry.length === 0) entry.push(`none`);
			const exit = [];
			let fallsOut = false;
			let branchOut = false;
			for (let pc = label.pc; pc < end; pc++) {
				const command = compiled[pc];
				if (!command) continue;
				// An inline event handler body sits inside the block but is not part of
				// the block's own flow: it runs when the event fires, and its trailing
				// `stop` and any `go` it contains belong to the handler, not here.
				let inHandler = false;
				for (const event of events) {
					if (event.entry === null || event.end === null) continue;
					if (pc >= event.entry && pc < event.end) {
						inHandler = true;
						break;
					}
				}
				if (inHandler) continue;
				const opcode = String(command.opcode || ``);
				const keyword = command.keyword;
				if (opcode === `RETURN` || keyword === `return`) exit.push(`return`);
				else if (opcode === `STOP` || keyword === `stop`) exit.push(`stop`);
				else if (opcode === `EXIT` || keyword === `exit`) exit.push(`exit`);
				else if ((opcode === `GOTO` || keyword === `go`) && command.label) {
					exit.push(`jump`);
				}
				// Where the block's flow can go. `falls-out` is the shared-continuation
				// case — control runs on into the next label, whether by falling through
				// the last line or by a loop exit landing there. `branch-out` is any
				// other jump leaving the block, including over the top of it. Call and
				// return edges are excluded: they are reported as `call`/`fork` on the
				// entry side, and counting them here would read a call as a fall-through.
				const isCallEdge = opcode === `GOSUB` || keyword === `gosub` ||
					opcode === `FORK` || keyword === `fork` ||
					opcode === `RETURN` || keyword === `return`;
				for (const successor of successors(pc)) {
					// A call's target is reported as `call`/`fork` on the entry side. Its
					// continuation (pc+1) is genuine flow and does count — a block that
					// ends in a call still runs on into the next label when it returns.
					if (isCallEdge && successor !== pc + 1) continue;
					if (successor === end) fallsOut = true;
					else if (successor < label.pc || successor > end) branchOut = true;
				}
			}
			if (fallsOut) exit.push(`falls-out`);
			if (branchOut) exit.push(`branch-out`);
			return {
				entry: entry.length ? unique(entry).join(`,`) : `none`,
				exit: exit.length ? unique(exit).join(`,`) : `no-exit`
			};
		};

		const shapes = {};
		for (const label of labels) {
			shapes[label.pc] = shapeOf(label);
		}

		// ---- the windows the author asked for ----
		//
		// A start opens a window, a stop closes it, and a start with no stop closes when
		// the thread that opened it ends — the case that makes several stop points work
		// without instrumenting each one. Statically the end of that thread is unknown, so
		// it is estimated as the end of the block the start sits in.
		const labelLinesByPc = {};
		for (const label of labels) labelLinesByPc[label.pc] = label.lino;

		const nextLabelAfter = function (pc) {
			for (const at of labels.map((label) => label.pc).sort((a, b) => a - b)) {
				if (at > pc) return at;
			}
			return compiled.length;
		};
		const pointPc = function (marker) {
			if (!marker) return null;
			if (marker.point) return labelPc(marker.point);
			return marker.pc;
		};
		// The pcs a window can cover: reachable from the start without passing through
		// the stop. Distance is no good as a test — a window opened at a label can reach
		// code that sits before its stop in the file, and a call inside the window runs
		// before the stop even when it sits after it in pc order.
		// The pcs the window's own forward flow can reach, not following returns. Used to
		// tell genuine ambiguity — two stops the window's own code could arrive at — from
		// the much looser set the return model makes reachable.
		const flowOnly = function (startPc) {
			const seen = {};
			const stack = [startPc];
			while (stack.length > 0) {
				const pc = stack.pop();
				if (typeof pc !== `number` || pc < 0 || pc >= compiled.length) continue;
				if (seen[pc]) continue;
				seen[pc] = true;
				if (compiled[pc] && compiled[pc].keyword === `return`) continue;
				for (const successor of successors(pc)) stack.push(successor);
			}
			return seen;
		};
		const regionFrom = function (startPc, stopPc) {
			const seen = {};
			const stack = [startPc];
			while (stack.length > 0) {
				const pc = stack.pop();
				if (typeof pc !== `number` || pc < 0 || pc >= compiled.length) continue;
				if (seen[pc]) continue;
				if (stopPc !== null && pc === stopPc) continue;
				seen[pc] = true;
				for (const successor of successors(pc)) stack.push(successor);
			}
			return seen;
		};

		// The pcs a window covers: its own flow and the code it calls, stopping where a call
		// returns and at its stop. Not the looser return-model reach, which spreads from every
		// call site in the program: an open window then looked as if it covered everything
		// after it, and its `once` mode swallowed every later start in the file.
		const windowRegion = function (startPc, stopPc) {
			const seen = {};
			const stack = [startPc];
			while (stack.length > 0) {
				const pc = stack.pop();
				if (typeof pc !== `number` || pc < 0 || pc >= compiled.length) continue;
				if (seen[pc]) continue;
				if (stopPc !== null && pc === stopPc) continue;
				seen[pc] = true;
				if (compiled[pc] && compiled[pc].keyword === `return`) continue;
				for (const successor of successors(pc)) stack.push(successor);
			}
			return seen;
		};

		const starts = markers.filter((marker) => marker.request === `start`);
		const stops = markers.filter((marker) => marker.request === `stop`);
		const claimed = {};
		const reached = {};
		const ignored = {};
		const windowRecords = [];
		const windowFindings = [];
		for (const start of starts) {
			if (ignored[start.pc]) continue;
			const startPc = pointPc(start);
			if (startPc === null) {
				windowFindings.push(`finding | window | line=${start.line} | the start ` +
					`names a point that does not exist`);
				continue;
			}
			// Which stop is predicted to close the window: only ones on the window's own flow.
			// A stop the return model makes reachable may sit on the far side of a call or in
			// another thread, and guessing from that produced nonsense like a window ending
			// above its own start. When the only stops are out there, say so and leave it to
			// the run.
			const ownFlow = flowOnly(startPc);
			const wide = regionFrom(startPc, null);
			const onFlow = [];
			const elsewhere = [];
			for (const candidate of stops) {
				const candidatePc = pointPc(candidate);
				if (candidatePc === null || !wide[candidatePc]) continue;
				reached[candidate.pc] = true;
				if (ownFlow[candidatePc]) onFlow.push([candidatePc, candidate]);
				else elsewhere.push(candidate);
			}
			const reach = {};
			for (const item of onFlow) reach[item[0]] = flowOnly(item[0]);
			const first = onFlow.filter((item) =>
				!onFlow.some((other) => other[0] !== item[0] && reach[other[0]][item[0]]));
			let stop = null;
			let stopPc = null;
			if (onFlow.length > 0) {
				onFlow.sort((a, b) => a[0] - b[0]);
				stopPc = onFlow[0][0];
				stop = onFlow[0][1];
				claimed[stop.pc] = true;
			}
			// A thread-scoped window with no stop is bounded by the thread's own span, which
			// statically is the block the start sits in — exact for a handler body or a
			// subroutine, approximate if the block is the main flow.
			let near = windowRegion(startPc, stopPc);
			if (stopPc === null && start.until === `thread`) {
				const bound = nextLabelAfter(startPc);
				const within = {};
				for (const key of Object.keys(near)) {
					if (Number(key) < bound) within[key] = true;
				}
				near = within;
			}

			// Which anchors fall inside is a graph question, not a line range: a window
			// opened `on <label>` runs from that label until its stop, wherever the calls
			// in between lead, so its ends can even appear in either file order.
			// Counted by point rather than by landmark: two landmarks can share a pc
			// (a label's pc is the command that follows it), and the question here is how
			// much of the program the window covers, not how many records name it.
			const insidePoints = {};
			for (const group of [labels, loops, events, markers]) {
				for (const item of group) if (near[item.pc]) insidePoints[item.pc] = true;
			}
			const inside = Object.keys(insidePoints).length;
			const index = windowRecords.length + 1;
			// Only an `on <label>` start has a label line to prefer: in this runtime a label's
			// pc is the command *after* it, so a label immediately above a marker would
			// otherwise supply the wrong line.
			const fromLine = start.point ? (labelLinesByPc[startPc] || start.line) : start.line;
			// How the window is expected to finish: an explicit stop it can reach, the end
			// of the thread that opened it, or neither — in which case it runs to the limit
			// or the end of the program. Neither is a legitimate answer, not an omission.
			const ends = stop
				? `ends=line ${stop.point ? (labelLinesByPc[stopPc] || stop.line) : stop.line}`
				: (start.until === `thread` ? `ends=thread` : `ends=open`);
			windowRecords.push(`window | index=${index} | from=line ${fromLine}` +
				(start.point ? ` | at=${start.point}` : ``) +
				(start.until === `thread` ? ` | until=thread` : ``) +
				` | ${ends} | mode=${start.mode} | limit=${start.limit} | ` +
				`region-anchors=${inside}`);

			if (first.length > 1) {
				windowFindings.push(`finding | window | index=${index} | ${first.length} stops ` +
					`can close this window by different routes | which one does depends on ` +
					`which route is taken`);
			}
			if (elsewhere.length > 0 && onFlow.length === 0) {
				windowFindings.push(`finding | window | index=${index} | the only stops in ` +
					`reach are past a call or in another thread (line ${elsewhere[0].line}) | ` +
					`whether one closes this window is a runtime question`);
			}
			if (reachableAt(startPc) !== `yes`) {
				windowFindings.push(`finding | window | index=${index} | the start is ` +
					`unreachable, so nothing will ever be recorded`);
			}
			for (const other of starts) {
				if (other === start || ignored[other.pc]) continue;
				const otherPc = pointPc(other);
				if (otherPc === null || !near[otherPc]) continue;
				if (start.mode === `once`) {
					// A start a later instruction can reach while this window is open is
					// ignored by the runtime in `once` mode — worth saying, because the
					// author probably expected two recordings.
					windowFindings.push(`finding | window | index=${index} | the start at ` +
						`line ${other.line} is reachable while this window is open | mode ` +
						`is once, so the runtime ignores it until the recording is reset`);
					ignored[other.pc] = true;
				}
			}
			for (const loop of loops) {
				if (!near[loop.pc]) continue;
				windowFindings.push(`finding | window | index=${index} | contains the loop ` +
					`at line ${loop.lino} | revisits count as visits, so the window may ` +
					`reach its limit`);
				break;
			}
		}
		for (const stop of stops) {
			if (reached[stop.pc]) continue;
			windowFindings.push(`finding | window | line=${stop.line} | ` +
				(pointPc(stop) === null
					? `the stop names a point that does not exist`
					: `no window can reach this stop, so it closes nothing`));
		}


		// ---- the model ----

		const anchors = [];
		for (const label of labels) {
			const shape = shapes[label.pc];
			anchors.push({
				at: label.lino,
				text: `anchor | reachable=${reachableAt(label.pc)} | kind=label | ` +
					`line=${label.lino} | name=${label.name} | pc=${label.pc} | ` +
					`depth=${depthAt(label.pc)} | entry=${shape.entry} | ` +
					`exit=${shape.exit}`
			});
		}
		for (const loop of loops) {
			anchors.push({
				at: loop.lino,
				text: `anchor | reachable=${reachableAt(loop.pc)} | kind=loop | ` +
					`line=${loop.lino} | pc=${loop.pc} | depth=${depthAt(loop.pc)}` +
					(loop.end === null ? ` | open` : ``)
			});
		}
		for (const event of events) {
			anchors.push({
				at: event.lino,
				text: `anchor | reachable=${reachableAt(event.pc)} | kind=event | ` +
					`line=${event.lino} | name=${event.name} | pc=${event.pc} | ` +
					`entry=${event.entry === null ? `?` : event.entry}`
			});
		}
		for (const marker of markers) {
			anchors.push({
				at: marker.line,
				text: `anchor | reachable=${reachableAt(marker.pc)} | kind=viz | ` +
					`line=${marker.line} | request=${marker.request} | pc=${marker.pc} | ` +
					`mode=${marker.mode}` +
					(marker.point ? ` | at=${marker.point}` : ``)
			});
		}
		anchors.sort((a, b) => a.at - b.at);

		const out = [];
		const sections = parseSections(AllSpeak_Viz.sections[path]);
		out.push(`model | script=${path} | lines=${source.scriptLines.length} | ` +
			`sections=${sections.length} | commands=${compiled.length} | ` +
			`labels=${labels.length} | loops=${loops.length} | ` +
			`events=${events.length} | anchors=${anchors.length}` +
			(problem === null ? `` : ` | incomplete=yes`));
		if (problem !== null) out.push(`problem | script=${path} | ${problem}`);
		if (dynamic > 0) {
			out.push(`note | reachability is approximate: ${dynamic} computed jump(s) ` +
				`or returns`);
		}
		// The census of block shapes. A label can appear in more than one entry or
		// exit bucket, so these are counts of labels carrying that shape, not a
		// partition of the label count.
		const bucket = {};
		for (const label of labels) {
			for (const token of shapes[label.pc].entry.split(`,`)) {
				bucket[`entry-${token}`] = (bucket[`entry-${token}`] || 0) + 1;
			}
			for (const token of shapes[label.pc].exit.split(`,`)) {
				bucket[`exit-${token}`] = (bucket[`exit-${token}`] || 0) + 1;
			}
		}
		const tally = (key) => bucket[key] || 0;
		out.push(`shape | labels=${labels.length} | ` +
			`entry-call=${tally(`entry-call`)} | entry-fall-in=${tally(`entry-fall-in`)} | ` +
			`entry-fork=${tally(`entry-fork`)} | entry-event=${tally(`entry-event`)} | ` +
			`entry-jump=${tally(`entry-jump`)} | entry-branch=${tally(`entry-branch`)} | ` +
			`entry-named=${tally(`entry-named`)} | ` +
			`entry-none=${tally(`entry-none`)} | ` +
			`exit-return=${tally(`exit-return`)} | ` +
			`exit-falls-out=${tally(`exit-falls-out`)} | ` +
			`exit-branch-out=${tally(`exit-branch-out`)} | exit-jump=${tally(`exit-jump`)} | ` +
			`exit-stop=${tally(`exit-stop`)} | exit-exit=${tally(`exit-exit`)} | ` +
			`exit-no-exit=${tally(`exit-no-exit`)}`);
		for (const text of windowRecords) out.push(text);

		// ---- the narrative ----
		//
		// The analyser's section model is supplied by the host (AllSpeak_Viz.sections),
		// so the doc-block parser stays owned by tools/asdoc-check.py and this consumes
		// its output rather than forking it. The sections are what turn a list into a
		// story: the author's own prose captions the code, and the routes between
		// sections say how the parts connect.

		const sectionOf = function (line) {
			for (let n = 0; n < sections.length; n++) {
				if (line >= sections[n].start_line && line <= sections[n].end_line) return n;
			}
			return -1;
		};

		const bySection = {};
		const loose = [];
		for (const anchor of anchors) {
			const n = sectionOf(anchor.at);
			if (n < 0) {
				loose.push(anchor.text);
			} else {
				if (!bySection[n]) bySection[n] = [];
				bySection[n].push(anchor.text);
			}
		}

		// How the sections connect, once per distinct route. A call or jump inside a
		// section is internal detail; a route that crosses sections is structure.
		const pcLine = {};
		for (const label of labels) pcLine[label.pc] = label.lino;
		const routes = {};
		const addRoute = function (from, to, via) {
			if (via === undefined) return;
			routes[`${from}|${to}|${via}`] = { from, to, via };
		};
		for (let pc = 0; pc < compiled.length; pc++) {
			const command = compiled[pc];
			if (!command) continue;
			const keyword = command.keyword;
			let target = null;
			let via = null;
			if ((command.opcode === `GOSUB` || keyword === `gosub`) &&
				typeof command.label === `string`) {
				target = labelPc(command.label);
				via = `call`;
			} else if ((keyword === `go` || command.opcode === `GOTO`) &&
				typeof command.label === `string`) {
				target = labelPc(command.label);
				via = `jump`;
			}
			if (target === null || !(target in pcLine)) continue;
			addRoute(sectionOf(command.lino), sectionOf(pcLine[target]), via);
		}
		for (const label of labels) {
			if (shapes[label.pc].exit.indexOf(`falls-out`) < 0) continue;
			const targetPc = blockEnd(label.pc);
			if (!(targetPc in pcLine)) continue;
			addRoute(sectionOf(label.lino), sectionOf(pcLine[targetPc]), `falls-out`);
		}

		for (let n = 0; n < sections.length; n++) {
			const section = sections[n];
			const inside = bySection[n] || [];
			out.push(`section | index=${n + 1} | lines=${section.start_line}-` +
				`${section.end_line} | anchors=${inside.length} | ` +
				`hash=${section.hash_state} | verify=${section.verify_state}`);
			for (const paragraph of section.doc || []) {
				out.push(`prose | ${paragraph}`);
			}
			for (const text of inside) out.push(text);
			for (const key of Object.keys(routes).sort()) {
				const route = routes[key];
				if (route.from !== n || route.to < 0 || route.to === n) continue;
				out.push(`route | from=${n + 1} | to=${route.to + 1} | via=${route.via}`);
			}
			// Prose that matches the code but whose verification has not been refreshed
			// since the code changed: the hash was re-run, the human sign-off was not.
			if (section.hash_state === `stale`) {
				out.push(`finding | stale-prose | line=${section.start_line} | the code has ` +
					`changed since this section's prose was hashed, so the prose may no ` +
					`longer describe it`);
			}
			if (section.verify_state === `verified-stale`) {
				out.push(`finding | stale-verify | line=${section.start_line} | ` +
					`prose matches the code, but has not been re-verified since the ` +
					`code last changed`);
			}
		}

		if (loose.length > 0) {
			// Deliberately not a `section`: with no doc blocks there are no sections,
			// and the framework counts that word.
			out.push(`loose | anchors=${loose.length} | lines outside any doc block`);
			for (const text of loose) out.push(text);
		}

		for (const text of windowFindings) out.push(text);

		for (const anchor of anchors) {
			if (anchor.text.indexOf(`entry=none`) < 0) continue;
			const line = anchor.text.split(`line=`)[1].split(` `)[0];
			const name = anchor.text.indexOf(`name=`) < 0
				? `?` : anchor.text.split(`name=`)[1].split(` `)[0];
			out.push(`finding | unreachable | line=${line} | name=${name} | ` +
				`nothing enters this label`);
		}

		return out;

		// Labels, found by symbol-table shape rather than by name.
		function labelsOf(program) {
			const found = [];
			for (const name in program.symbols) {
				const at = program.symbols[name].pc;
				const record = program[at];
				if (!record || !record.isSymbol) {
					found.push({ name, pc: at, lino: labelLine(name) });
				}
			}
			return found;
		}
	},

	parseSections: (text) => parseSections(text),

	// Compile handlers are cached per language pack, so switching the pack back
	// means the caches have to be rebuilt. This mirrors the reset list in
	// Compile.checkLanguageDirective, which exists for the same reason.
	clearCompileCaches: function () {
		if (AllSpeak_Core) AllSpeak_Core._compileHandlers = null;
		if (AllSpeak_Browser) {
			AllSpeak_Browser._compileHandlers = null;
			AllSpeak_Browser.elementHandlerMap = null;
		}
		if (AllSpeak_REST) AllSpeak_REST._compileHandlers = null;
		if (AllSpeak_MQTT) AllSpeak_MQTT._compileHandlers = null;
	},

	getHandler: (name) => {
		if (AllSpeak_Language.matchesWord(name, `model`)) {
			return AllSpeak_Viz.Model;
		}
		// `viz` itself is core syntax: the plugin never compiles a marker.
		return null;
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = AllSpeak_Viz.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown keyword '${command.keyword}' in 'viz' package`);
			return program.pc + 1;
		}
		return handler.run(program);
	}
};

AllSpeak.domain.viz = AllSpeak_Viz;

// The analyser's section model, as `tools/asdoc-check.py --json` writes it. Absent or
// unreadable means "no doc blocks". Sections without prose are kept, so an older
// analyser still yields the block structure even if it cannot caption it.
function parseSections(text) {
	if (!text) return [];
	let data;
	try {
		data = JSON.parse(text);
	} catch (err) {
		return [];
	}
	const files = (data && data.files) || [];
	return files.length > 0 ? (files[0].sections || []) : [];
}
