// AllSpeak viz plugin — static analysis of a script's compiled IR.
//
// It answers "what is this script made of?" by reporting the ANCHORS — the places
// where control flow is not simply the next line: labels, `while` tests, and the
// points where an event handler is entered. It also derives just enough of the
// control-flow graph to say whether each anchor can be reached at all. Nothing is
// executed and nothing is drawn; the AllSpeak framework (viz.allspeak) presents it.
//
// Host contract (this is the seam that later becomes the dev server's /read):
//
//     AllSpeak_Viz.target = `codex/en/code/step13.allspeak`;
//     AllSpeak_Viz.sources[`codex/en/code/step13.allspeak`] = sourceText;
//
// Acquisition — file read, fetch, editor buffer — stays on the host side,
// because that is where the platform differences live. See tools/asviz-run.js
// (Node) and viz.html (browser).
//
// The trigger — the vocabulary a *script* uses, as against the host contract above:
//
//     record the script [in <path>] [as <source>] giving <trace> [reporting <verdict>]
//         run a script of the caller's choosing under a recorder, and hand back the recording
//     record this run
//         arm a recorder for the program that calls this — what a button in an *already running app*
//         needs, since nothing outside a live program can attach a recorder to it
//     save the recording to <path>
//         collect what the recorder has and write it beside the script, through the page's /write/
//
// All three arm the guard with the recorder's own defaults: a script handed over by a tool, or one
// arming its own recording, is not to be trusted with the caller's responsiveness. And the recorder
// reads two attributes, so a script can say where a window opens and what is worth watching there —
// `@viz start` / `@viz stop`, and `@show Total, Row`.
//
// Output: newline-separated records of 'field=value' pairs joined by ' | '. The
// kind is first, and `reachable` comes immediately after the word `anchor`, so the
// framework can classify and filter with prefix tests and core vocabulary alone.

// How many visits a window may collect before the runtime stops collecting. The cap is a
// runaway guard, not a policy: a window with no stop stays open on purpose, so it can
// outlive the thread that opened it and pick up whatever that thread set in motion.
const VIZ_DEFAULT_LIMIT = 100000;

// The trace format version this writer emits — spec/viz-trace-format.md, draft 2, which
// added `cat: "transfer"`. Kept in step with the Python writer's TRACE_VERSION.
const VIZ_TRACE_VERSION = 2;

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
	// Recordings, keyed by path — the recorder the host attached, so the report can say what
	// the run collected as well as what the script is made of. An absent entry means nothing
	// was recorded, and the report simply carries no `trace` records.
	trace: {},

	Model: {

		// model the script [in <path>] [as <source>] giving <variable>
		//
		// `as <source>` is for a caller holding the text itself — an editor with an
		// unsaved buffer is the case that matters — so nothing has to be written out and
		// read back just to be looked at.
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
			let text = null;
			if (compiler.isWord(`as`)) {
				compiler.next();
				text = compiler.getValue();
			}
			if (!compiler.isWord(`giving`)) {
				throw new Error(`viz 'model' (line ${lino + 1}): expected ` +
					`'model the script [in <path>] [as <source>] giving <variable>'`);
			}
			compiler.next();
			const target = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `viz`,
				keyword: `model`,
				lino,
				path,
				text,
				target
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const path = command.path ? program.getValue(command.path) : AllSpeak_Viz.target;
			// A caller that supplies the text registers it under the path, so every other
			// reader in this plugin keeps working from one place.
			if (command.text) {
				AllSpeak_Viz.sources[path] = program.getValue(command.text);
			}
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

	// record the script [in <path>] [as <source>] giving <variable> [reporting <verdict>]
	//
	// **The trigger.** `model` compiles a script to *read* it; this compiles one to *run* it with a recorder
	// attached and the guard armed, and hands back the recording as the Chrome trace — the same document the
	// command-line hosts write, made here so a caller holding the text needs nothing else. An editor with the
	// buffer open is the case that matters: the pane's empty state says "no recording beside this script",
	// and this is what makes one.
	//
	// **Two things it has to get right, and they are the name and the stopping.**
	//
	// The *name*: a compile registers the program under the name the script declares, and this runtime refuses
	// a name a running program already holds — rightly, since two running copies of one script are
	// indistinguishable. And the likeliest collision is the reviewed file's own: recording `asedit.allspeak`
	// while `ASEditor` is the program doing the recording. So the declared name is stepped aside for the
	// compile, the recording's program is re-keyed to a number of its own, and the name is handed back —
	// exactly what `tools/asviz-run.js` does, and for the same reason.
	//
	// The *stopping*: this call returns when the run hands control away or ends, and a `wait` hands the rest of
	// the program to a timer. **So a recording made this way covers a run up to its first wait**, and a script
	// that is still going when this returns says so in its verdict rather than passing a slice off as a whole
	// run. A computation — which is what a capture is usually for — has no waits and is covered whole.
	// Following a waiting run needs the caller to be *told* when it ends rather than to wait for it, which is a
	// different shape; see TODO.md.
	//
	// **And `reporting` is the sentence about the recording, because a caller cannot write one itself.** That is
	// not a convenience: a document with nothing in it but its header is still a *valid* document, so a caller
	// holding only the trace cannot tell "the run recorded a loop" from "the run died on its first statement",
	// and a button that reads only the trace reports the second as a success. The plugin saw the run, so the
	// plugin says what happened. See `verdict` below.
	Record: {

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
			let text = null;
			if (compiler.isWord(`as`)) {
				compiler.next();
				text = compiler.getValue();
			}
			// **`record this run` — the other half of the trigger, and the one a running app needs.** The
			// shape above runs a script of its own with a recorder attached; this arms a recorder for the
			// program *calling* it, which is what a button handler wants: the app is already running, so
			// nothing outside it can attach a recorder, and the recording is taken from the next marker the
			// program reaches onwards.
			//
			// It reads as one command with two shapes — `record the script …` and `record this run` — because
			// they are the same act from two sides: run something under a recorder, or have the recorder watch
			// what is already running.
			// **The third shape of the same verb**, and it belongs here rather than in a handler of its own:
			// the keyword is `record` in all three, so the compiler can only tell them apart by the word that
			// follows. An app is recorded from *outside* its own window, which is what makes it a shape of its
			// own rather than another way of saying `record this run`.
			if (compiler.isWord(`app`)) {
				compiler.next();
				if (!compiler.isWord(`at`)) {
					throw new Error(`viz 'record' (line ${lino + 1}): expected ` +
						`'record the app at <url> to <path>'`);
				}
				compiler.next();
				const appUrl = compiler.getValue();
				if (!compiler.isWord(`to`)) {
					throw new Error(`viz 'record' (line ${lino + 1}): expected ` +
						`'record the app at <url> to <path>'`);
				}
				compiler.next();
				const appPath = compiler.getValue();
				compiler.addCommand({ domain: `viz`, keyword: `record`, lino, appUrl, path: appPath });
				return true;
			}
			if (compiler.isWord(`this`)) {
				compiler.next();
				if (!compiler.isWord(`run`)) {
					throw new Error(`viz 'record' (line ${lino + 1}): expected 'record this run' or ` +
						`'record the script [in <path>] [as <source>] giving <variable>'`);
				}
				compiler.next();
				compiler.addCommand({ domain: `viz`, keyword: `record`, lino, thisRun: true });
				return true;
			}
			if (!compiler.isWord(`giving`)) {
				throw new Error(`viz 'record' (line ${lino + 1}): expected ` +
					`'record this run' or 'record the script [in <path>] [as <source>] giving <variable> ` +
					`[reporting <verdict>]'`);
			}
			compiler.next();
			const target = compiler.getToken();
			compiler.next();
			let verdict = null;
			if (compiler.isWord(`reporting`)) {
				compiler.next();
				verdict = compiler.getToken();
				compiler.next();
			}
			compiler.addCommand({
				domain: `viz`,
				keyword: `record`,
				lino,
				path,
				text,
				target,
				verdict
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.appUrl) {
				const url = String(program.getValue(command.appUrl));
				const path = String(program.getValue(command.path)).replace(/^\/+/, ``);
				if (!AllSpeak_Viz.watchApp(url, path)) {
					// A blocked popup is the one failure worth naming: nothing else about this can be diagnosed
					// from the script, and every browser does it silently when the click was not close enough.
					vizLog(`viz: could not open ${url} — a popup blocker, or no window to open into`);
				}
				return command.pc + 1;
			}
			if (command.thisRun) {
				// **The guard is armed here too, and it matters more than anywhere else.** A script that arms
				// its own recording is a script that may then run for ever, and the editor that launched the
				// app has no say in it — so the recorder's own defaults apply, exactly as they do to a script
				// handed over by a tool.
				if (program.vizRecorder && !program.vizRecorder.stopped) {
					vizLog(`viz: a recording is already armed — 'record this run' left it alone, and ` +
						`'save the recording to <path>' writes it`);
					return command.pc + 1;
				}
				program.vizRecorder = new AllSpeak_Viz_Recorder(VIZ_DEFAULT_BUDGET_NS,
					VIZ_DEFAULT_CEILING_NS);
				vizLog(`viz: recording this run — the next 'viz start' opens the window`);
				return command.pc + 1;
			}
			const path = command.path ? program.getValue(command.path) : AllSpeak_Viz.target;
			// A caller that supplies the text registers it under the path, so every other reader in this
			// plugin keeps working from one place — the same bargain `model` makes.
			if (command.text) {
				AllSpeak_Viz.sources[path] = program.getValue(command.text);
			}
			const text = AllSpeak_Viz.sources[path];
			if (typeof text !== `string`) {
				program.runtimeError(command.lino,
					`viz: no source registered for '${path}' — the host must set ` +
					`AllSpeak_Viz.sources['${path}']`);
				return command.pc + 1;
			}
			const outcome = AllSpeak_Viz.record(path, text);
			const target = program.getSymbolRecord(command.target);
			target.value[0] = {
				type: `constant`,
				numeric: false,
				content: outcome.trace
			};
			target.index = 0;
			if (command.verdict) {
				const verdict = program.getSymbolRecord(command.verdict);
				verdict.value[0] = {
					type: `constant`,
					numeric: false,
					content: outcome.verdict
				};
				verdict.index = 0;
			}
			return command.pc + 1;
		}
	},

	// save the recording to <path>
	//
	// **The other end of `record this run`.** A recording is only worth having if it can be looked at, and the
	// script that made it is the one that knows when it is finished — so this collects what the recorder has and
	// writes it where the pane will find it, through the same `/write/` route a saved tab uses. The path is
	// relative to where the page is served from, the project root, exactly as `@app`'s page is.
	//
	// **It says what it collected, on the console.** The verdict is the same sentence the Record button puts on
	// the status line — `12 visits in 1 window`, or why there is nothing — because a recording that collected
	// nothing and a recording that worked look identical in a file, and this is the moment to say which.
	Save: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isWord(`the`)) compiler.next();
			if (compiler.isWord(`recording`)) compiler.next();
			if (!compiler.isWord(`to`)) {
				throw new Error(`viz 'save' (line ${lino + 1}): expected ` +
					`'save the recording to <path>'`);
			}
			compiler.next();
			const path = compiler.getValue();
			compiler.addCommand({ domain: `viz`, keyword: `save`, lino, path });
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			// The path is relative to where the page is served from — the project root — so a leading slash is
			// the reader's habit rather than part of the name, and joining it as it stands would ask the server
			// for `/write//report.json`.
			const path = String(program.getValue(command.path)).replace(/^\/+/, ``);
			const recorder = program.vizRecorder;
			if (!recorder) {
				vizLog(`viz: nothing to save — 'record this run' has not been run`);
				return command.pc + 1;
			}
			const parked = recorder.parked === true;
			const windows = recorder.finishedWindows();
			recorder.finish();
			program.vizRecorder = null;
			const document = AllSpeak_Viz.traceDocument(path, windows);
			const verdict = AllSpeak_Viz.verdict(windows, recorder.stopped || null, parked);
			fetch(`/write/` + path, { method: `POST`, body: JSON.stringify(document) })
				.then(response => {
					vizLog(response && response.ok
						? `viz: recording saved to ${path} — ${verdict}`
						: `viz: could not write ${path} — ${verdict}`);
				})
				.catch(err => {
					vizLog(`viz: could not write ${path}: ${err} — ${verdict}`);
				});
			return command.pc + 1;
		}
	},

	// Open the app, arm it, and write what it recorded when its window closes.
	//
	// **Everything after the first line is a poll**, because a window has no events this side of the boundary: the
	// app loads its runtime and compiles its script on its own schedule, and the only honest way to know it is
	// ready is to look. One timer does all three waits in turn — for a live document, for the visualiser to be
	// present there, and later for the window to close — so there is one thing to cancel and one thing to read
	// when diagnosing.
	watchApp: function (url, path) {
		if (typeof window === `undefined` || !window.open) return false;
		const win = window.open(url, `_blank`);
		if (!win) return false;
		const plugin = AllSpeak_Viz.pluginUrl();
		let armed = false;
		const timer = setInterval(function () {
			if (win.closed) {
				clearInterval(timer);
				AllSpeak_Viz.collectApp(win, path);
				return;
			}
			if (armed) return;
			let alive = false;
			try { alive = !!win.AllSpeak; } catch (err) { alive = false; }   // cross-origin throws, not false
			if (!alive) return;
			// The visualiser is what builds a recorder, so the app's window needs it as well. It is injected
			// rather than asked for, so an app that has not been changed for any of this still works — and it is
			// injected *now*, after the app is up, which is safe because the script is parked on its first wait
			// and every marker it reaches from here on is reached after the arming.
			if (!win.AllSpeak_Viz) {
				AllSpeak_Viz.injectPlugin(win, plugin);
				return;
			}
			let count = 0;
			const scripts = win.AllSpeak.scripts || {};
			for (const name of Object.keys(scripts)) {
				const target = scripts[name];
				if (!target || target.vizRecorder) continue;    // the app's own `record this run` wins
				try {
					target.vizRecorder = new win.AllSpeak_Viz.Recorder(
						VIZ_DEFAULT_BUDGET_NS, VIZ_DEFAULT_CEILING_NS);
					count++;
				} catch (err) {
					vizLog(`viz: could not arm a program in the app: ${err}`);
				}
			}
			armed = true;
			vizLog(`viz: recording the app — ${count} program(s) armed; close its window to save ${path}`);
		}, 200);
		return true;
	},

	// Collect from an app whose window has closed, and write it where the pane will find it.
	collectApp: function (win, path) {
		let windows = [];
		let stopped = null;
		let parked = false;
		try {
			const scripts = win.AllSpeak.scripts || {};
			for (const name of Object.keys(scripts)) {
				const recorder = scripts[name] && scripts[name].vizRecorder;
				if (!recorder) continue;
				parked = parked || recorder.parked === true;
				stopped = stopped || recorder.stopped || null;
				windows = windows.concat(recorder.finishedWindows());
			}
		} catch (err) {
			vizLog(`viz: the app's window is gone — nothing to collect (${err})`);
			return;
		}
		if (windows.length === 0) {
			vizLog(`viz: nothing recorded — the app reached no marker while it was armed`);
			return;
		}
		const document = AllSpeak_Viz.traceDocument(path, windows);
		const verdict = AllSpeak_Viz.verdict(windows, stopped, parked);
		fetch(`/write/` + path, { method: `POST`, body: JSON.stringify(document) })
			.then(response => {
				vizLog(response && response.ok
					? `viz: the app's recording is saved to ${path} — ${verdict}`
					: `viz: could not write ${path} — ${verdict}`);
			})
			.catch(err => vizLog(`viz: could not write ${path}: ${err} — ${verdict}`));
	},

	// This plugin's own URL, so it can be put into a window that does not have it.
	pluginUrl: function () {
		try {
			for (const tag of document.scripts) {
				if (tag.src && /asviz/.test(tag.src)) return tag.src;
			}
		} catch (err) { /* no scripts to look at */ }
		return null;
	},

	injectPlugin: function (win, url) {
		if (!url) {
			vizLog(`viz: the app has no visualiser and this page cannot find its own copy of it — ` +
				`add the plugin to the app's page`);
			return;
		}
		try {
			const tag = win.document.createElement(`script`);
			tag.src = url;
			win.document.head.appendChild(tag);
		} catch (err) {
			vizLog(`viz: could not load the visualiser into the app: ${err}`);
		}
	},

	// The name a source declares, from its tokens. `script <name>` is untranslated — it is in no language pack
	// — so the raw token is the right test in every language, and taking the token after it is the same small
	// scan `labelLine` does for a label.
	declaredScript: function (tokens) {
		for (let i = 0; i + 1 < tokens.length; i++) {
			if (tokens[i].token === `script`) return tokens[i + 1].token;
		}
		return null;
	},

	// Run a script with a recorder attached and the guard armed, and hand back what it collected *and* what
	// that amounts to.
	//
	// `{ trace, verdict }` — the recording as JSON text, and the one line about it that a caller can say out
	// loud. The command above is a shell over this, and a host that wants the two apart can call this directly
	// (as `tools/guard-check.js` calls the hosts).
	record: function (path, text) {
		const lines = text.split(`\n`);
		if (lines.length > 0 && lines[lines.length - 1] === ``) lines.pop();
		const source = AllSpeak.tokeniseFile(lines);
		// The name the script declares, stepped aside for the compile and handed back after it — see the
		// note on the command for why the collision is expected rather than exceptional.
		const declared = AllSpeak_Viz.declaredScript(source.tokens);
		const held = declared ? AllSpeak.scripts[declared] : undefined;
		if (held) delete AllSpeak.scripts[declared];
		let program;
		try {
			program = AllSpeak.compileScript(source, [], null, null);
		} catch (err) {
			if (held) AllSpeak.scripts[declared] = held;
			// **A refusal is the most useful thing a recording can report**, and the runtime's own sentence is
			// the whole of it: "I don't understand 'dictionary' at line 46" names the word *and* the line, and
			// it is how a caller learns that this runtime is not the one the script was written for.
			const why = AllSpeak_Viz.reasonFor(err);
			AllSpeak_Viz.problems.push(why);
			return { trace: ``, verdict: `could not run: ` + why };
		}
		// **The recording is a run of its own, so it gets a name of its own.** Two programs under one name is
		// what the registry refuses, and the caller may be the program holding the name the script declares —
		// so the recording is re-keyed, exactly as the command-line host does it.
		delete AllSpeak.scripts[program.script];
		program.script = AllSpeak.scriptIndex++;
		AllSpeak.scripts[program.script] = program;
		if (held) AllSpeak.scripts[declared] = held;
		// **The guard, armed with the recorder's own defaults — and this is the caller it was built for.** A
		// script handed over by a tool is not to be trusted with that tool's responsiveness: `while true`
		// busy-loops and never-returning waits both end here, and the recording says which.
		const recorder = new AllSpeak_Viz_Recorder(VIZ_DEFAULT_BUDGET_NS, VIZ_DEFAULT_CEILING_NS);
		program.vizRecorder = recorder;
		let stopped = null;
		try {
			program.running = true;
			AllSpeak_Run.run(program, 0);
		} catch (err) {
			stopped = AllSpeak_Viz.reasonFor(err);
			AllSpeak_Viz.problems.push(stopped);
		}
		// A `wait` hands the rest of the program to a timer, so this call returns with the run parked and the
		// rest of it still to come — and the caller is told rather than left with a slice that looks like a
		// whole run. `parked` is the recorder's own reading of the command stream, which is the only place
		// that fact exists: a program waiting on a timer is registered just like one that has ended.
		const parked = recorder.parked === true;
		const windows = recorder.finishedWindows();
		recorder.finish();
		delete AllSpeak.scripts[program.script];
		return {
			trace: JSON.stringify(AllSpeak_Viz.traceDocument(path, windows)),
			verdict: AllSpeak_Viz.verdict(windows, stopped, parked)
		};
	},

	// The first line of an error, which is the sentence a person needs and the rest of which is a stack.
	reasonFor: function (err) {
		return String((err && err.message) || err).split(`\n`)[0];
	},

	// **What a recording amounts to, in one line, for a caller to say out loud.** The three things worth
	// knowing, in the order they matter: what stopped the run, what was collected, and whether the run was
	// parked on a timer when the call returned — the last of which is why a recording can be a slice of a run
	// rather than the whole of it. Visits are the pane's own unit (`line N visit V of T`), so the number on the
	// status line is the number in the pane's sidebar.
	verdict: function (windows, stopped, parked) {
		if (stopped) return `stopped: ` + stopped;
		let visits = 0;
		for (let n = 0; n < windows.length; n++) visits += windows[n].visits.length;
		if (windows.length === 0) {
			return `nothing recorded: the run finished without reaching a marker`;
		}
		let line = visits === 1 ? `1 visit` : visits.toLocaleString() + ` visits`;
		line += windows.length === 1 ? ` in 1 window` : ` in ${windows.length} windows`;
		if (parked) line += `, and the run waits there — the recording ends at its first wait`;
		return line;
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
		// **A compile-only pass must not be refused by a guard meant for running.** `Script.compile` holds one
		// program per declared name and refuses a name it already has, because two running copies of one script
		// would be indistinguishable — a sound rule, applied here to a compile that will never run. And the name
		// it collides with is usually the reviewed file's own: Blocks mode models the *buffer*, so with
		// `asedit.allspeak` open it compiles a second `ASEditor` while the first is running, the compile is
		// refused, and the file is reported as broken on the status line — *"Script 'ASEditor' is already
		// running."* — which is a fault it does not have. So the name is stepped aside for the pass and put back
		// after it: the running program keeps it, and the pass leaves nothing behind (see the diff below).
		const declared = AllSpeak_Viz.declaredScript(source.tokens);
		const held = declared ? AllSpeak.scripts[declared] : undefined;
		if (held) delete AllSpeak.scripts[declared];
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
			// And the running program gets its name back. It is the one that owns it: this pass only borrowed
			// the registry for as long as it took to read a file's structure.
			if (held) AllSpeak.scripts[declared] = held;
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
		const covered = {};        // every pc the declared windows could reach
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

			for (const key of Object.keys(near)) covered[key] = true;

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
		// **The attributes the program carries, one record each, with the line they sit on.** They are the one
		// thing a script can say to a tool that the language itself has no use for, and a reader of this model
		// is such a tool. They are read from the *compiled* program rather than from the source text because
		// the tokeniser is what knows an `@` inside a literal from an attribute — a reader scanning the text
		// itself would be a second, worse implementation of that rule, and would misread a script that merely
		// mentions `@` in a string.
		for (const element of compiled) {
			if (!element || !element.attr) continue;
			out.push(`attr | line=${element.lino + 1} | ${element.attr}`);
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
		// The recording, when the host supplied one: stated plainly, before the window
		// pre-flight that says what a window *would* capture.
		for (const text of vizTraceRecords(path, covered)) out.push(text);
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
		if (AllSpeak_Language.matchesWord(name, `record`)) {
			return AllSpeak_Viz.Record;
		}
		if (AllSpeak_Language.matchesWord(name, `save`)) {
			return AllSpeak_Viz.Save;
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

// ---------------------------------------------------------------- the guard

// `vizClock` counts microseconds because that is what the trace format stores — but the *guard* must not, and
// that is not a detail: a compiled command can take less than a microsecond, so a budget accrued in
// microseconds would count only the commands that happened to round up, and the same bound would mean a
// different amount of work on every machine. Python's recorder accumulates `perf_counter_ns` for the same
// reason, so this is the nanosecond clock its guard uses.
const vizClockNs = function () {
	if (typeof process !== `undefined` && process.hrtime && process.hrtime.bigint) {
		return Number(process.hrtime.bigint());
	}
	return Math.round(performance.now() * 1e6);
};

// **The same guard the Python recorder has, in the same units of meaning.** A run started from the editor
// — which is what usually asks for one — must not be trusted with the editor's responsiveness, so a
// recording can be *bounded* two ways at once. The bound is a *time budget* rather than a count of
// commands because the two failure shapes are not alike: a loop that waits or calls out between iterations
// reaches any command count eventually, so a step counter either fires early on a script that was only
// waiting or has to be set so high that a genuinely busy loop runs for minutes. The budget measures the
// program's *own* work instead, which is what a runaway actually burns.
//
// And a ceiling on the whole run, because the budget bounds only what the program *does*: a loop that waits
// between iterations never spends it and would run for ever, so the editor would still be hangable by
// `while true ... wait 1 second ... end`. The two reasons are told apart and reported, because one is slow
// code, the other is usually wrong code, and the person reviewing the script needs to know which.
//
// These are the Python recorder's defaults, in its own units: two seconds of work, twenty of wall clock, and
// a gap cap of twenty milliseconds. Kept in step with `allspeak-py/plugins/as_viz.py`, value for value and
// reason for reason.
const VIZ_DEFAULT_BUDGET_NS = 2000000000;
const VIZ_DEFAULT_CEILING_NS = 20000000000;
// A single gap longer than this is waiting rather than work — a scheduled callback arriving, or an idle
// program. Without the cap an idle program would look busy, since only the command *before* a gap can be
// charged with it.
const VIZ_GAP_CAP_NS = 20000000;
// Commands whose time is not the program's own, because they wait by design. A `url` field is checked
// separately rather than by keyword, since the fetch spells itself several ways.
const VIZ_WAITING_KEYWORDS = [`wait`, `every`, `release`, `input`, `download`, `alert`];


// **The recorder's slice of the attribute vocabulary.** An attribute is one unparsed string — the language has no
// opinion on a key and a value, so a tool that wants them apart splits them itself — and this is the recorder's
// answer to that. Two keys, both of which the language reference names as reasons for attributes to exist:
//
//     @viz start / @viz stop          a window, written on the statement's line rather than as a command
//     @show Total, Row                the values worth watching here
//
// Nothing else is read, so a note written for a reader or for another tool passes the recorder by — and the two
// spellings of a window (this and the `viz start` command) are deliberately both accepted, because a script that
// already works must not stop working for having a spare way to say the same thing.
// **A line for the console, named so it still makes sense when it is copied out of one.** The plugin's own
// messages go here rather than to a dialog: a copied line can be quoted into a conversation, a bug report or a
// commit, which is the whole reason to prefer a log to a box — and a recording that collected nothing is
// indistinguishable from one that worked until somebody says which. `console` is absent in some hosts, so this
// checks rather than assuming.
const vizLog = function (message) {
	if (typeof console !== `undefined` && console.log) console.log(message);
};

const VIZ_ATTR_MARKER = `viz`;
const VIZ_ATTR_SHOW = `show`;

// The key of an attribute, as the recorder reads it: the first word, and the rest left alone. Deliberately not a
// parser — `@show Total, Row` and a project's `@key: value` both hand their tail over unexamined.
const vizAttributeKey = function (text) {
	const whole = String(text || ``);
	const gap = whole.indexOf(` `);
	return gap === -1 ? whole : whole.slice(0, gap);
};

// Which marker a command is, from either spelling. The `viz` command is the language's own marker; `@viz start`
// is the same thing said as an attribute, which is the spelling a script wants when the marker belongs to *this*
// statement rather than needing a line of its own.
const vizMarkerOf = function (command, attr) {
	if (command && command.keyword === `viz`) return command.request;
	if (vizAttributeKey(attr) !== VIZ_ATTR_MARKER) return undefined;
	const rest = String(attr).slice(VIZ_ATTR_MARKER.length).trim();
	return rest === `start` || rest === `stop` ? rest : undefined;
};

// A variable's value as text, read out of the program the recorder is watching.
//
// **Read straight off the symbol rather than through the runtime's evaluator, and that is deliberate.** The
// evaluator reports a value it cannot decode as a *runtime error*, and a runtime error can be routed to the
// script's own error handler — so an attribute naming something odd could change what the script does. The
// contract says attributes do not affect behavior, and the cheapest way to keep that promise is not to call
// anything that can route an error. A name the program does not hold comes back marked `?` rather than missing:
// an attribute naming something the runtime cannot see is worth seeing in the picture.
const vizValueText = function (program, name) {
	try {
		const symbol = program.getSymbolRecord(name);
		if (!symbol) return `?`;
		const slot = symbol.index === undefined ? 0 : symbol.index;
		const record = symbol.value ? symbol.value[slot] : undefined;
		const content = record && typeof record === `object` ? record.content : record;
		if (content === null || content === undefined) return ``;
		return typeof content === `object` ? JSON.stringify(content) : String(content);
	} catch (err) {
		return `?`;
	}
};

// ---------------------------------------------------------------- the recording

// The recorder: what the runtime collects while a window is open, and nothing more. The host
// attaches one to a program; the markers arm and stop it. It never changes the program's own
// state, so a run with a recorder behaves exactly like a run without one.
//
// This is the second writer of the trace format, and the reason the format exists: a
// recording made here and one made by the Python runtime have to be the same kind of file, so
// the two can be laid against each other. The parts where the runtimes differ — no command is
// emitted for a label here, so a label is a symbol whose pc is the command that follows it —
// are absorbed below rather than pushed into the format.
const AllSpeak_Viz_Recorder = function (budget, ceiling) {
	this.windows = [];
	this.current = null;
	this.sealed = false;        // a `once` window has been recorded; further starts ignored
	// The guard, off unless a host asks for it. See the constants above for what the two bounds are
	// for; a `null` means that half is not guarding anything.
	this.budget = typeof budget === `number` ? budget : null;
	this.ceiling = typeof ceiling === `number` ? ceiling : null;
	this.busy = 0;              // the program's own work, in nanoseconds, as Python counts it
	this.started = null;
	this.lastCommand = null;
	this.lastAt = null;
	this.stopped = null;        // `work` or `wall` when the guard ended the run
};

AllSpeak_Viz_Recorder.prototype = {

	// The line of a label, which this runtime does not store: a label is a tokeniser token
	// ending in ':', and the compiled symbol points past it. Recovering it here is what makes
	// a label's arrival carry the same line the Python runtime reports — and therefore what
	// makes a `gosub` here and a `gosub` there land on the same line in a comparison.
	labelsOf: function (program) {
		if (!program._vizLabels) {
			const map = {};
			for (const name in program.symbols) {
				const at = program.symbols[name].pc;
				if (typeof at !== `number`) continue;
				const record = program[at];
				if (record && record.isSymbol) continue;      // a variable, not a label
				map[at] = { name: name, lino: this.labelLine(program, name) };
			}
			program._vizLabels = map;
		}
		return program._vizLabels;
	},

	labelLine: function (program, name) {
		const tokens = (program.source && program.source.tokens) || [];
		for (const token of tokens) {
			if (token.token === name + `:`) return token.lino;
		}
		return 0;
	},

	// The line each pc's *instruction* belongs to, with one rule the other runtime gets for
	// free: a command this compiler emitted **with no line of its own** — a loop's back-edge
	// `goto` — takes the line of the last command that had one, and for a block's first
	// command that is the label written just above it. Without that the line is 0: not a line
	// the editor can scroll to, and a `line_counts` entry for a line that is not one.
	lineTable: function (program) {
		if (!program._vizLines) {
			const labels = this.labelsOf(program);
			const table = [];
			let last = 0;
			for (let pc = 0; pc < program.length; pc++) {
				const command = program[pc];
				let line = command && command.lino ? command.lino : 0;
				if (!line && labels[pc]) line = labels[pc].lino;
				// A compiler jump that goes *backwards* is a loop closing, so it belongs to the
				// loop test it returns to rather than to the line it happens to follow: the
				// cost of iterating is the loop's cost, and the test's line is already in the
				// table because the target comes before the jump. That is also the line the
				// Python runtime reports for the same command, whose `gotoPC` carries it.
				if (!line && typeof command.goto === `number` && command.goto < pc) {
					line = table[command.goto];
				}
				if (!line) line = last;
				if (line) last = line;
				table.push(line);
			}
			program._vizLines = table;
		}
		return program._vizLines;
	},

	// Where an *arrival* at a pc is reported: the label's own line where a label owns the pc,
	// the instruction's line otherwise. Kept apart from `lineTable` because here the two
	// genuinely differ — the command following a label is the block's first instruction, so it
	// is *counted* on its own line while the *arrival* is reported at the label. Python has
	// both as commands and reports both, so this is what makes a `gosub` land on the same line
	// in a trace from either runtime.
	anchorLineTable: function (program) {
		if (!program._vizAnchorLines) {
			const labels = this.labelsOf(program);
			program._vizAnchorLines = this.lineTable(program).map(function (line, pc) {
				return (labels[pc] && labels[pc].lino) || line;
			});
		}
		return program._vizAnchorLines;
	},

	// The pcs worth timestamping: labels, loop tests, events, and the markers. Computed from
	// the running program rather than from a file, so it is the same program the numbers come
	// from. A label claims its pc — without that a block entry would be invisible here, since
	// the runtime emits no command for it.
	anchorsOf: function (program) {
		if (!program._vizAnchors) {
			const labels = this.labelsOf(program);
			const found = {};
			for (let pc = 0; pc < program.length; pc++) {
				const command = program[pc];
				if (!command) continue;
				if (labels[pc]) {
					found[pc] = labels[pc].name;
					continue;
				}
				if (command.keyword === `while`) found[pc] = `loop@` + command.lino;
				else if (vizIsEvent(command)) found[pc] = `event@` + command.lino;
				else if (command.keyword === `viz` && command.request) {
					found[pc] = `viz-` + command.request + `@` + command.lino;
				}
			}
			program._vizAnchors = found;
		}
		return program._vizAnchors;
	},

	arm: function (program, command, pc) {
		// `once` records one window and nothing more until the recording is cleared: with a
		// start and a stop inside a subroutine, every call would otherwise open and close its
		// own window, which is what `every` is for.
		if (command.mode === `once` && (this.sealed || this.current !== null)) return;
		if (this.current !== null) this.stop();          // `every`: latest window wins
		const labels = this.labelsOf(program);
		let blockEnd = program.length;
		for (const at of Object.keys(labels)) {
			const n = Number(at);
			if (n > pc && n < blockEnd) blockEnd = n;
		}
		this.current = {
			start_pc: pc,
			line: command.lino,
			mode: command.mode || `once`,
			limit: command.limit || VIZ_DEFAULT_LIMIT,
			until: command.until === undefined ? null : command.until,
			anchors: this.anchorsOf(program),
			block_end: blockEnd,
			depth: (program.programStack || []).length,
			visits: [],
			counts: new Array(program.length).fill(0),
			lines: this.lineTable(program).slice(),
			anchorLines: this.anchorLineTable(program).slice(),
			steps: 0,
			transfers: [],
			// Bookkeeping for the transfer rule: the command that ran before the current one,
			// and the lines the last two commands belong to.
			last_pc: null,
			last_line: command.lino,
			line_before: command.lino,
			t0: vizClock(),
			t1: null,
			truncated: false,
			stopped: null
		};
	},

	stop: function () {
		if (this.current === null) return;
		this.current.t1 = vizClock();
		if (this.current.mode === `once`) this.sealed = true;
		this.windows.push(this.current);
		this.current = null;
	},

	// Close a window left open when the program ended. The end of a window that never saw its
	// stop is the end of the *run*, not the moment some tool next looks at the recorder —
	// otherwise the report and the trace file disagree about how long it lasted.
	finish: function () {
		this.stop();
	},

	// The windows worth reporting: the stopped ones, plus a window still open when the run
	// ended, punched as of now. A `viz start` with no stop is not a mistake — it is the
	// deliberate "watch until the end" case — but it is still a window, and a copy is taken so
	// stamping it cannot surprise a reader holding the original.
	finishedWindows: function () {
		const windows = this.windows.slice();
		if (this.current !== null) {
			const closed = Object.assign({}, this.current);
			closed.t1 = vizClock();
			windows.push(closed);
		}
		return windows;
	},

	// Whether the time a command took is the program's *own*. Two exclusions, the same two Python makes:
	// a command that waits by design or carries a `url` is waiting for something else, and a command
	// outside the `core` domain is a plugin talking to a device, a database or a network. Loop *control*
	// is always core, so a runaway loop still trips on the statements that make it a loop.
	countsAsWork: function (command) {
		if (VIZ_WAITING_KEYWORDS.indexOf(String((command && command.keyword) || ``)) >= 0) return false;
		if (command && command.url !== undefined) return false;
		return !!command && command.domain === `core`;
	},

	// Add this command's share of the clock to the budget, and answer whether the run must end. The gap is
	// the time the *previous* command took, so both the exclusion and the cap are applied to the command
	// that ran rather than to the one about to.
	account: function (program, command) {
		const now = vizClockNs();
		const previous = this.lastCommand;
		const last = this.lastAt;
		this.lastCommand = command;
		this.lastAt = now;
		if (this.started === null) this.started = now;
		if (previous && last !== null && this.countsAsWork(previous)) {
			this.busy += Math.min(now - last, VIZ_GAP_CAP_NS);
		}
		let reason = null;
		if (this.ceiling !== null && now - this.started > this.ceiling) reason = `wall`;
		else if (this.budget !== null && this.busy > this.budget) reason = `work`;
		if (reason === null) return false;
		this.stopped = reason;
		if (this.current) {
			this.current.stopped = reason;
			this.stop();
		}
		// Marked stopped, and *not* halted only from here: `tick` answers false and the runtime breaks its
		// own loop on that, so no command runs with the program already stopped. Setting `running` as well
		// is what the Python recorder does, and for the same reason — the break is what makes it honest,
		// and this is what makes it immediate.
		program.running = false;
		return true;
	},

	tick: function (program, pc) {
		const command = program[pc];
		// **Whether the run has just handed control to a timer**, which is what a `wait` does: the command
		// returns without advancing the pc, the run loop breaks, and `AllSpeak_Run.run` comes back to its
		// caller with the program still to continue. Nothing else records that fact — a program parked on a
		// timer looks exactly like one that has stopped — so the recorder notes it as it passes, and a
		// capture made inside a call can say that its recording ends there rather than pass off a slice as
		// a whole run. It is `waiting`, not `stopped`: nothing has ended.
		this.parked = VIZ_WAITING_KEYWORDS.indexOf(String((command && command.keyword) || ``)) >= 0;
		if (this.account(program, command)) return false;   // the guard ended the run; the runtime breaks
		// **Where attributes stop being inert.** They arrive in the program and nothing else looks at them, so
		// this is the one place they are read — which is what lets a run with a recorder match a run without one.
		const attr = command && command.attr ? String(command.attr) : ``;
		const marker = vizMarkerOf(command, attr);
		if (marker === `start`) this.arm(program, command, pc);
		const window = this.current;
		if (!window || pc >= window.counts.length) return;
		window.counts[pc]++;
		window.steps++;
		this.noteTransfer(program, pc, window);
		// `until thread`: outside the block the window was opened in, and the call stack back
		// to where it was when the window opened. That covers a `return`, falling off the end
		// of the block and a `gosub` inside it — with no thread bookkeeping.
		if (window.until === `thread` && pc >= window.block_end &&
			(program.programStack || []).length <= window.depth) {
			this.stop();
			return;
		}
		if (window.anchors[pc] === undefined) {
			// A statement inside a block: its values belong to the visit in flight, which is the same span.
			this.capture(program, attr, window);
			return;
		}
		if (window.visits.length >= window.limit) {
			window.truncated = true;        // keep counting, stop collecting visits
			return;
		}
		window.visits.push({ pc: pc, steps: window.steps, at: vizClock() });
		this.capture(program, attr, window);
		if (marker === `stop`) this.stop();
	},

	// **`@show Total, Row` — the values worth watching, taken as the recorder passes.**
	//
	// This is the use the language reference leads with, and it is the difference between a viewer that infers
	// which of a loop's variables matter from the finished picture and one that is told. The values ride on the
	// *visit* they fall inside: a visit is an anchor's residence, from the arrival to the next, so
	// `while Total is less than Limit @show Total, Row` attaches to the arrival it belongs to and a `@show`
	// further down the block attaches to the visit in flight, which covers it. A second `@show` in one span
	// rewrites the same names rather than adding a second reading — one value per name per visit is what a pane
	// can show without becoming a log.
	capture: function (program, attr, window) {
		if (!attr || vizAttributeKey(attr) !== VIZ_ATTR_SHOW) return;
		const visit = window.visits[window.visits.length - 1];
		if (!visit) return;
		const values = visit.values || (visit.values = {});
		const names = String(attr).slice(VIZ_ATTR_SHOW.length).split(`,`);
		for (let n = 0; n < names.length; n++) {
			const name = names[n].trim();
			if (name === ``) continue;
			values[name] = vizValueText(program, name);
		}
	},

	// Where control came from, when it did not simply fall through.
	//
	// The test is the pc sequence rather than the command's own type: an arrival that is not
	// the command after the last one *is* a transfer, and that one rule catches a call, a
	// return, a jump, a loop's back-edge and an `if`'s skip without the recorder having to know
	// how any of them work. The command that ran last then names the kind — vizTransferKind
	// decides that, and keeps the compiler's own jumps out of `jump`, since the `else` of an
	// `if` is not something the author wrote a `go` for.
	//
	// The line it is attributed to is the author's, not the compiler's: a written `gosub` or
	// `go` names its own line, while a compiler jump carries the line of the statement it
	// belongs to — the `while` — which is not where the jump happens, so it gets the line of
	// the command that ran last, the end of the loop body.
	//
	// The bound on the rule: a run that suspends and resumes through the runtime's queue looks
	// the same from here, so a resume can be reported as a transfer of the last command's kind.
	// Where control arrived from is still true; the `kind` may not be. See the trace spec.
	noteTransfer: function (program, pc, window) {
		const previous = window.last_pc;
		window.last_pc = pc;
		const line_before = window.line_before;
		window.line_before = window.last_line;
		window.last_line = window.lines[pc];
		if (previous === null || pc === previous + 1) return;
		const source = program[previous] || {};
		const kind = vizTransferKind(source);
		if (kind === null) return;
		window.transfers.push({
			steps: window.steps,
			at: vizClock(),
			// A written jump names its own line. A compiler jump names the line it *belongs*
			// to (a backward one is the loop's, which is what `lines` holds), and that is where
			// the loop is rather than where control left from — so the transfer is attributed
			// to the command before it, the end of the body. Two questions, two lines.
			from_line: kind === `branch` ? line_before : window.lines[previous],
			to_line: window.anchorLines[pc],
			kind: kind
		});
	}
};

// What a jump is called in the trace, and how to tell a written one from the compiler's. The
// test is the *shape* of the target, not the keyword, because this runtime spells its
// scaffolding with `goto` — the same keyword it uses for a written `go`'s numeric sibling —
// while the Python runtime's conditions compile to `gotoPC`. A written jump names a label; a
// generated one carries a numeric target. Filed together, the `else` of every `if` would read
// as a `go` the author wrote.
const vizTransferKind = function (command) {
	const keyword = command.keyword;
	if (keyword === `gosub`) return `call`;
	if (keyword === `return`) return `return`;
	if (keyword === `goto` || keyword === `go`) {
		const namesLabel = typeof command.label === `string` ||
			typeof command.goto === `string` || command.gotoExpr !== undefined;
		return namesLabel ? `jump` : `branch`;
	}
	if (keyword === `gotoPC`) return `branch`;
	return null;
};

// The events this runtime compiles a handler registration to. `on` and `every` both compile
// to a registration, a skip-jump and a body, which is why the entry is pc+2.
const vizIsEvent = function (command) {
	const opcode = String(command.opcode || ``);
	return opcode.indexOf(`ON_`) === 0 || opcode === `EVERY` ||
		command.keyword === `on` || command.keyword === `every`;
};

// Microseconds on a monotonic clock, which is the unit the format wants. Node's hrtime is
// nanoseconds and finer; `performance.now` is milliseconds and exists in both hosts.
const vizClock = function () {
	if (typeof process !== `undefined` && process.hrtime && process.hrtime.bigint) {
		return Number(process.hrtime.bigint() / 1000n);
	}
	return Math.round(performance.now() * 1000);
};

// The whole recording as one Chrome-trace document. One lane per window, one interval per
// anchor arrival: from that arrival to the next, which is time spent inside the block the
// arrival named. The intervals tile the window without overlapping, so their durations sum to
// the window's span — the property that makes the height of a row mean something, and one that
// tools/check-trace.py checks.
const vizTraceDocument = function (script, windows) {
	const events = [{ name: `process_name`, ph: `M`, pid: 1, args: { name: script } }];
	windows.forEach(function (window, index) {
		const tid = index + 1;
		const visits = window.visits;
		const last = visits.length > 0 ? visits[visits.length - 1].at : window.t0;
		const end = window.t1 || last;
		events.push({ name: `thread_name`, ph: `M`, pid: 1, tid: tid,
			args: { name: `window ${tid} (line ${window.line})` } });
		events.push({ name: `thread_sort_index`, ph: `M`, pid: 1, tid: tid,
			args: { sort_index: tid } });

		const counts = {};
		window.counts.forEach(function (count, pc) {
			if (!count) return;
			const line = String(window.lines[pc]);
			counts[line] = (counts[line] || 0) + count;
		});
		// Keyed and ordered by line number: this map is read by people.
		const ordered = {};
		for (const line of Object.keys(counts).sort(function (a, b) { return a - b; })) {
			ordered[line] = counts[line];
		}
		events.push({
			name: `window ${tid}`, cat: `window`, ph: `X`, pid: 1, tid: tid,
			ts: window.t0, dur: Math.max(0, end - window.t0),
			args: {
				from_line: window.line,
				mode: window.mode,
				limit: window.limit,
				until: window.until,
				visits: visits.length,
				anchors: Object.keys(window.anchors).length,
				steps: window.steps,
				truncated: !!window.truncated,
				stopped: window.stopped || null,
				line_counts: ordered
			}
		});

		// The lane's two kinds of event are collected together and written in time order, so
		// the file reads as the run happened and nothing downstream has to sort to find the
		// flow. Transfers are instants, not spans: they are the moment control left one line
		// for another, and something that took no time cannot be an interval without claiming
		// a duration it never had.
		const timeline = [];
		visits.forEach(function (visit, position) {
			const following = position + 1 < visits.length ? visits[position + 1].at : end;
			const line = window.anchorLines[visit.pc];
			const name = window.anchors[visit.pc] || ``;
			const args = { line: line, pc: visit.pc, name: name, steps: visit.steps,
				visit: position + 1 };
			// **A captured value is the one optional thing an anchor carries**, and it is omitted entirely when
			// the script says nothing worth watching — so a trace of a script with no `@show` is byte-for-byte
			// what it was before this existed, and the two runtimes stay comparable on what they share.
			if (visit.values) args.values = visit.values;
			timeline.push([visit.at, {
				name: name || `line ${line}`, cat: `anchor`, ph: `X`, pid: 1, tid: tid,
				ts: visit.at, dur: Math.max(0, following - visit.at),
				args: args
			}]);
		});
		window.transfers.forEach(function (transfer) {
			timeline.push([transfer.at, {
				name: `${transfer.kind} ${transfer.from_line}->${transfer.to_line}`,
				cat: `transfer`, ph: `i`, s: `t`, pid: 1, tid: tid, ts: transfer.at,
				args: { from_line: transfer.from_line, to_line: transfer.to_line,
					kind: transfer.kind, steps: transfer.steps }
			}]);
		});
		timeline.sort(function (a, b) { return a[0] - b[0]; });
		for (const item of timeline) events.push(item[1]);
	});
	return {
		traceEvents: events,
		displayTimeUnit: `ms`,
		otherData: { vizTrace: VIZ_TRACE_VERSION, script: script }
	};
};

// What the run collected, stated plainly: the sequence, then the hot spots. This is the
// text-first half of the visualiser — the picture is drawn from the same recording — and it is
// what makes a recording *reported* as well as written, which the Python side has always done
// and this side had not.
//
// The line numbers come from the run's own program rather than from the file, so editing the
// script afterwards cannot relabel an old recording. Two of them are needed, because an arrival
// names its *anchor* line — a label claims the line it is written on — while a `hot-line` count
// names the line the instruction is on. The trace file makes the same split.
const vizTraceRecords = function (path, covered, seq, top) {
	const recorder = AllSpeak_Viz.trace[path];
	if (!recorder) return [];          // nothing recorded: the report says nothing about a run
	seq = seq === undefined ? 20 : seq;
	top = top === undefined ? 10 : top;
	const out = [];

	recorder.finishedWindows().forEach(function (window, n) {
		const visits = window.visits;
		const anchorLine = (pc) => window.anchorLines[pc];
		const nameOf = (pc) => (window.anchors[pc] === undefined ? `?` : window.anchors[pc]);
		const end = window.t1 || (visits.length ? visits[visits.length - 1].at : window.t0);
		const reached = {};
		for (const visit of visits) reached[visit.pc] = true;
		out.push(`trace | window=${n + 1} | from=line ${window.line} | ` +
			`visits=${visits.length} | anchors=${Object.keys(reached).length} | ` +
			`steps=${window.steps} | span-ms=${((end - window.t0) / 1000).toFixed(3)} | ` +
			(window.truncated ? `limit=${window.limit} | truncated=yes` : `truncated=no`));

		visits.slice(0, seq).forEach(function (visit, i) {
			out.push(`seq | n=${i + 1} | steps=${visit.steps} | line=${anchorLine(visit.pc)} | ` +
				`name=${nameOf(visit.pc)}`);
		});
		if (visits.length > seq) out.push(`seq | ... ${visits.length - seq} more visits`);

		// What the run did not reach is as useful as what it did, and the top-list alone cannot
		// say it — the capped list looks the same either way. Only anchors the declared windows
		// could have reached count: a narrow window leaves most of a program untouched, and
		// listing all of it as "not reached" says nothing useful.
		const cold = [];
		for (const key of Object.keys(window.anchors)) {
			const pc = Number(key);
			if (reached[pc]) continue;
			if (covered && !covered[pc]) continue;
			cold.push([pc, window.anchors[key]]);
		}
		cold.sort((a, b) => a[0] - b[0]);
		if (cold.length > 0) {
			out.push(`unvisited | n=${cold.length} | anchors in this program that ` +
				`the recording did not reach`);
			for (const item of cold.slice(0, top)) {
				out.push(`cold-anchor | line=${anchorLine(item[0])} | name=${item[1]}`);
			}
		}

		const counted = {};
		for (const visit of visits) counted[visit.pc] = (counted[visit.pc] || 0) + 1;
		const hot = Object.keys(counted).map(Number).sort((a, b) => counted[b] - counted[a]);
		for (const pc of hot.slice(0, top)) {
			const share = visits.length ? (100 * counted[pc]) / visits.length : 0;
			out.push(`hot-anchor | count=${counted[pc]} | share=${share.toFixed(1)}% | ` +
				`line=${anchorLine(pc)} | name=${nameOf(pc)}`);
		}

		const byLine = {};
		window.counts.forEach(function (count, pc) {
			if (!count) return;
			const line = window.lines[pc];
			byLine[line] = (byLine[line] || 0) + count;
		});
		const total = window.steps;
		const busiest = Object.keys(byLine).map(Number).sort((a, b) => byLine[b] - byLine[a]);
		for (const line of busiest.slice(0, top)) {
			const share = total ? (100 * byLine[line]) / total : 0;
			out.push(`hot-line | count=${byLine[line]} | share=${share.toFixed(1)}% | ` +
				`line=${line}`);
		}
	});
	return out;
};

// The host's entry points: the recorder to attach, the writer to turn its windows into a trace
// document, and the report that says what the recording holds. Nothing in the runtime reaches for
// these — `Run` tests `program.vizRecorder` and nothing else — so an instrumented script still
// runs with no plugin loaded at all.
AllSpeak_Viz.Recorder = AllSpeak_Viz_Recorder;
// **The guard's defaults, published so a host does not restate them.** A run started from the editor arms
// the recorder with these; the command-line hosts arm it with nothing, because a recording made by hand at a
// terminal is that person's own business and a bounded one would misreport what the program did.
AllSpeak_Viz.DEFAULT_BUDGET_NS = VIZ_DEFAULT_BUDGET_NS;
AllSpeak_Viz.DEFAULT_CEILING_NS = VIZ_DEFAULT_CEILING_NS;
AllSpeak_Viz.traceDocument = vizTraceDocument;
AllSpeak_Viz.traceRecords = vizTraceRecords;
AllSpeak_Viz.transferKind = vizTransferKind;
