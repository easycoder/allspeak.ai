#!/usr/bin/env node
//
// Node host for the AllSpeak visualiser framework.
//
// It loads the JS runtime in the bundle order documented in build-allspeak,
// loads the viz plugin, registers the requested source files as the host side of
// the plugin contract, and then runs viz.allspeak exactly as a browser page would.
// Nothing here draws: it is the same "text first" increment, just with a
// command line instead of a page.
//
// Usage:  node tools/asviz-run.js [script.allspeak ...]
//         node tools/asviz-run.js --run [--trace=<file.json>] [--budget=<ms>] [--ceiling=<ms>] <script.allspeak>
//
// `--budget` and `--ceiling` arm the recorder's guard — see the constants in plugins/asviz.js. "Armed from the
// editor" is what a trigger does, so a host that can do it too is what makes the guard testable without one.
//         (default target: codex/en/code/step13.allspeak)
//
// `--run` also runs the target with a recorder attached, so the markers it carries produce a
// recording — the same "text first" increment the Python host made, now on this runtime. The
// trace is written before the framework runs, because a recording is a fact about the run and
// not about the report, and it should survive a framework failure.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, `..`);
const ANALYSER = path.join(root, `tools`, `asdoc-check.py`);

// Targets resolve against the repository root, so the tool can be run from anywhere — but an
// absolute path is taken as given, which is what lets a throwaway script be tried without
// putting it in the tree.
const resolve = (target) => path.isAbsolute(target) ? target : path.join(root, target);

// The doc-block model comes from the canonical analyser rather than a second parser:
// shelling out keeps its --json output as the single contract between host and
// plugin. A missing analyser just means no prose, and the narrative falls back to the
// anchors instead.
function sectionsFor(target) {
	try {
		return execFileSync(`python3`, [ANALYSER, `--json`, target], { encoding: `utf8` });
	} catch (err) {
		// The analyser exits non-zero when a file has doc-block errors, but it still
		// writes its report to stdout.
		return typeof err.stdout === `string` ? err.stdout : ``;
	}
}

// The runtime expects a browser. Nothing below needs to do anything: compile and
// print never touch the DOM, they only reach for elements that aren't there.
const noop = () => {};

// In a browser, `window` *is* the global object. That matters here: language
// packs are declared with a top-level `var`, and `checkLanguageDirective` finds
// them only as properties of `window`. So model it the same way rather than
// shimming a separate object.
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;

// **`alert`, because that is how this runtime reports a runtime error** — and without it the host died with
// `ReferenceError: alert is not defined`, which reads as a host crash rather than as the script's own message.
// It cost a diagnosis today: a JS runtime error looked like a script that produced no output at all, while the
// Python host printed the same error plainly. A dialog box is the wrong thing in a terminal, so this writes the
// message the way the rest of the host's own reporting does — to stderr — and the *next* alert is still a
// dialog in a browser, which is where that belongs.
global.alert = message => process.stderr.write(String(message) + `\n`);

global.document = {
	getElementById: () => null,
	querySelector: () => null,
	createElement: () => ({ style: {}, appendChild: noop, setAttribute: noop }),
	addEventListener: noop,
	body: { appendChild: noop, style: {}, classList: { add: noop, remove: noop } },
	head: { appendChild: noop }
};

// Bundle order from ./build-allspeak (AllSpeak.js is the browser startup hook,
// so it is deliberately omitted — this host starts the framework itself).
const RUNTIME = [
	`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`,
	`Language.js`, `LanguagePack_en.js`, `Compile.js`, `Main.js`
];

const load = (file, from) => {
	vm.runInThisContext(fs.readFileSync(path.join(root, from, file), `utf8`), { filename: file });
};

for (const file of RUNTIME) {
	load(file, `js/allspeak`);
}

// The other language packs. Only the English pack is in the runtime bundle; the
// rest are loaded per page, and a script declaring `language français` cannot be
// compiled without them. This is the multilingual requirement in concrete form.
const packs = [];
for (const file of fs.readdirSync(path.join(root, `js/allspeak`))
	.filter(f => /^LanguagePack_.+\.js$/.test(f)).sort()) {
	if (RUNTIME.includes(file)) continue;
	load(file, `js/allspeak`);
	packs.push(file.replace(/^LanguagePack_/, ``).replace(/\.js$/, ``));
}

// The analysis is only as complete as the domains in scope: a value or condition
// that a missing plugin would have handled cannot be compiled at all. So load the
// plugins the way a host page does — and report which ones made it.
const loaded = [];
const skipped = [];
const pluginDir = path.join(root, `js/plugins`);
for (const file of fs.readdirSync(pluginDir).filter(f => f.endsWith(`.js`)).sort()) {
	try {
		vm.runInThisContext(fs.readFileSync(path.join(pluginDir, file), `utf8`), { filename: file });
		loaded.push(file.replace(/\.js$/, ``));
	} catch (err) {
		skipped.push(`${file} (${err.message.split(`\n`)[0]})`);
	}
}

// Top-level `const` in a vm script lands in the realm's global lexical scope,
// visible to later scripts but not to this module. Hand the two we need across.
vm.runInThisContext(`globalThis.__viz = { AllSpeak, AllSpeak_Viz, AllSpeak_Language, ` +
	`AllSpeak_LanguagePack_en, AllSpeak_Run };`);
const {
	AllSpeak, AllSpeak_Viz, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run
} = globalThis.__viz;

AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
// The rest of what AllSpeak_Startup does in a browser before any script runs.
AllSpeak.scripts = {};

process.stderr.write(`domains: ${Object.keys(AllSpeak.domain).join(`, `)}\n`);
process.stderr.write(`plugins loaded: ${loaded.join(`, `)}\n`);
process.stderr.write(`language packs: en, ${packs.join(`, `)}\n`);
for (const note of skipped) {
	process.stderr.write(`plugin skipped: ${note}\n`);
}

// The host side of the plugin contract: which script is being looked at, and its
// source text. A browser host would fill these from the editor buffer instead.
const argv = process.argv.slice(2);
const flag = (name) => argv.indexOf(name) >= 0;
const value = (name) => {
	const at = argv.findIndex(a => a.startsWith(name + `=`));
	return at < 0 ? null : argv[at].slice(name.length + 1);
};
const wantsRun = flag(`--run`) || flag(`-r`);
const tracePath = value(`--trace`) || value(`--trace-pretty`) || value(`--trace-compact`);
const pretty = flag(`--trace-pretty`) || value(`--trace-pretty`) !== null;
// The guard, in milliseconds on the command line and nanoseconds in the recorder, which is where the two
// runtimes' clocks agree. Absent means that half does not guard — so a plain `--run` records an unbounded run,
// exactly as it always has and as the Python host does.
const ms = (name) => {
	const raw = value(name);
	return raw === null ? undefined : Math.round(Number(raw) * 1e6);
};
const guard = { budget: ms(`--budget`), ceiling: ms(`--ceiling`) };
// **`--no-recorder` leaves the arming to the script.** A host has always armed its own recorder, because a
// trace is what a host is for — but a script can now arm its own with `record this run`, and with the host's
// recorder in place that call correctly declines. So there has to be a way to run a self-arming script, or the
// half of the trigger a *running app* needs cannot be exercised at all. This is how `tools/capture-check.js`
// proves the arming.
const noRecorder = flag(`--no-recorder`);
const targets = argv.filter(a => !a.startsWith(`-`));
if (targets.length === 0) {
	targets.push(`codex/en/code/step13.allspeak`);
}
if (tracePath && !wantsRun) {
	process.stderr.write(`asviz-run: a trace records a run, so it needs --run too\n`);
	process.exitCode = 1;
	return;
}

// Run the target with a recorder attached, and hand back the recorder. The script's own
// output goes to stderr: it is not what this tool is for, and on stdout it would land in the
// middle of the model records. Redirected rather than discarded, because a bare `print` is how
// a probe reports what a value turned out to be.
const runTarget = function (target) {
	// **The pack is saved before anything else, and restored whatever happens.** `language français` at the top
	// of a target switches the pack *while compiling*, so a save taken after the compile would save the French
	// pack as if it were the host's own and restore nothing — and a compile that *fails* leaves it switched just
	// as surely, which is why the restore wraps the compile as well as the run. Measured 2026-10-05: without it
	// the framework was compiled in French afterwards and `viz.allspeak` refused with `I don't understand 'put'`
	// at a line of a file the caller never mentioned.
	const savedPack = AllSpeak_Language.pack;
	try {
		const text = fs.readFileSync(resolve(target), `utf8`);
		const source = AllSpeak.tokeniseFile(text.split(`\n`));
		const program = AllSpeak.compileScript(source, null, null, null);
		delete AllSpeak.scripts[program.script];
		program.script = AllSpeak.scriptIndex++;
		AllSpeak.scripts[program.script] = program;
		// Attached by the host rather than asked for by the script, because collecting data is
		// not something a script should have to say. Given to the plugin under the path it was
		// asked for, so the report can say what the run collected — the counterpart of the Python
		// host's `VizState.trace[program.scriptName] = program.recorder`.
		// The guard, off unless the command line asked for it: a recording made by hand at a terminal is that
		// person's own business, and a bounded one would misreport what the program did.
		if (!noRecorder) {
			program.vizRecorder = new AllSpeak_Viz.Recorder(guard.budget, guard.ceiling);
		}
		AllSpeak_Viz.trace[target] = program.vizRecorder;
		const out = console.log;
		console.log = (...args) => { process.stderr.write(args.join(` `) + `\n`); };
		try {
			program.running = true;
			AllSpeak_Run.run(program, 0);
		} finally {
			console.log = out;
			// A window still open ends when the *run* ends, including a run that failed: the
			// recorder is already published for the report, and `finishedWindows` stamps an open
			// window as of whenever it is next read — so without this a failed run would report a
			// duration covering however long the host spent in between.
			//
			// Guarded, because a run can now end with no recorder at all: `--no-recorder` leaves the
			// arming to the script, and a script need not have a marker in it.
			if (program.vizRecorder) program.vizRecorder.finish();
		}
		return program.vizRecorder;
	} finally {
		if (savedPack && AllSpeak_Language.pack !== savedPack) {
			AllSpeak_Language.init(savedPack);
			if (AllSpeak_Viz.clearCompileCaches) AllSpeak_Viz.clearCompileCaches();
		}
	}
};

const framework = fs.readFileSync(path.join(root, `viz.allspeak`), `utf8`);

// A failing target is a finding, not a reason to stop: keep going so a whole
// corpus can be swept in one pass, and report each failure against its name.
let failures = 0;
const firstLine = (err) => String((err && err.message) || err).split(`\n`)[0];

// **The project's runtime declaration, which a browser cannot read and this can.** `.allspeak-init` sits at the
// project root and a script may be several directories in, so the walk goes upward from the script's own
// directory. A directory that *has* the file ends the walk whether or not it names a runtime: a project that has
// answered and said nothing about this has answered, and looking past it would find a different project's.
//
// **A function of the path, not one answer for the run.** `record the script in <path>` names its own target, so
// the plugin has to be able to ask about a script that is not the one this host is looking at — and a target's
// project is its own.
//
// The same reading the Python plugin makes of the file, and deliberately the same shape: the text after
// `runtime:`, up to the end of the line or a `!` comment, with the spaces taken out. A file with two lines is the
// ordinary case — `lang:` is one of them — so a reader that ran to the end of the file would answer `jsnname:My`.
const projectFlavourOf = (target) => {
	let folder = path.dirname(resolve(target));
	while (true) {
		const candidate = path.join(folder, `.allspeak-init`);
		if (fs.existsSync(candidate)) {
			const text = fs.readFileSync(candidate, `utf8`);
			const at = text.indexOf(`runtime:`);
			if (at < 0) return null;
			const said = text.slice(at + `runtime:`.length).split(`\n`)[0].split(`!`)[0]
				.replace(/[ \t]/g, ``);
			return said === `py` || said === `js` ? said : null;
		}
		const parent = path.dirname(folder);
		if (parent === folder) return null;
		folder = parent;
	}
};

// **The host's half of the contract, handed over once and asked per path.** A browser would answer from a hidden
// element the dev server filled; a terminal has a filesystem and answers directly, and the plugin asks this for
// whichever script it is about to run — which need not be the one being analysed. Set here rather than beside the
// destructuring above because `projectFlavourOf` is a `const` below it, and a reference there would be in its
// temporal dead zone.
AllSpeak_Viz.projectFlavourFor = projectFlavourOf;

// **Every named target is registered before any of them runs.** A script can now ask for another one by name —
// `record the script in <path> giving …` — and it finds the source where a host put it, so the host has to put
// it there first. Registering a target as it comes up was near enough while nothing could look ahead; it fails
// the moment one target names another, and it fails with `no source registered`, which reads as a fault in the
// script rather than as the host's ordering.
for (const target of targets) {
	if (!fs.existsSync(resolve(target))) continue;
	AllSpeak_Viz.sources[target] = fs.readFileSync(resolve(target), `utf8`);
	AllSpeak_Viz.sections[target] = sectionsFor(resolve(target));
}

for (const target of targets) {
	if (!fs.existsSync(resolve(target))) {
		process.stderr.write(`asviz-run: no such file: ${target}\n`);
		failures++;
		continue;
	}
	// The one target the framework is *looking at*, and the list of things that went wrong on this pass. The
	// project's runtime is not set here — it is a *function of the path* the plugin asks, set once below, because
	// the script being recorded need not be the one being analysed.
	AllSpeak_Viz.target = target;
	AllSpeak_Viz.problems = [];
	if (wantsRun) {
		process.stderr.write(`asviz-run: running ${target}\n`);
		// A target that will not run is still worth analysing: the model is built from a
		// compile-only pass that tolerates failure, so the report below is produced either
		// way. Only the recording is lost, and a failed target must not end the sweep.
		let recorder = null;
		try {
			recorder = runTarget(target);
		} catch (err) {
			process.stderr.write(`FAIL ${target}: run: ${firstLine(err)}\n`);
			failures++;
		}
		if (wantsRun && tracePath && recorder) {
			const windows = recorder.finishedWindows();
			const document = AllSpeak_Viz.traceDocument(target, windows);
			try {
				// Compact by default: whitespace does not matter to a JSON reader, and a
				// trace's first consumer is a viewer rather than a person.
				fs.writeFileSync(tracePath, JSON.stringify(document, null, pretty ? 2 : 0));
			} catch (err) {
				process.stderr.write(`asviz-run: cannot write ${tracePath}: ${err.message}\n`);
				failures++;
				continue;
			}
			process.stderr.write(`asviz-run: trace: ${tracePath} ` +
				`(${document.traceEvents.length} events, ${windows.length} window(s))\n`);
		}
	}

	// Compile the framework ourselves rather than via AllSpeak.start: start() is
	// once-only and routes errors through reportError, which is built for a page
	// with a compiler instance still in scope.
	let program;
	try {
		const source = AllSpeak.tokeniseFile(framework.split(`\n`));
		program = AllSpeak.compileScript(source, null, null, null);
	} catch (err) {
		process.stderr.write(`FAIL ${target}: framework compile: ${firstLine(err)}\n`);
		failures++;
		continue;
	}
	// The framework's own `script Viz` line registers it under that name; give it
	// a numeric id instead, so the name registry stays clean across targets.
	delete AllSpeak.scripts[program.script];
	program.script = AllSpeak.scriptIndex++;
	AllSpeak.scripts[program.script] = program;
	program.running = true;
	try {
		AllSpeak_Run.run(program, 0);
	} catch (err) {
		process.stderr.write(`FAIL ${target}: ${firstLine(err)}\n`);
		failures++;
	}
	if (AllSpeak_Viz.problems.length > 0) {
		process.stderr.write(`FAIL ${target}: ${AllSpeak_Viz.problems[0]}\n`);
		failures++;
	}
}

if (failures > 0) {
	process.stderr.write(`${failures} of ${targets.length} target(s) failed\n`);
	process.exitCode = 1;
}
