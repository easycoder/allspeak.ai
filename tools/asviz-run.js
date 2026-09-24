#!/usr/bin/env node
//
// Node host for the AllSpeak visualiser framework.
//
// It loads the JS runtime in the bundle order documented in build-allspeak,
// loads the viz plugin, registers the requested source files as the host side of
// the plugin contract, and then runs viz.as exactly as a browser page would.
// Nothing here draws: it is the same "text first" increment, just with a
// command line instead of a page.
//
// Usage:  node tools/asviz-run.js [script.as ...]
//         (default target: codex/en/code/step13.as)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, `..`);
const ANALYSER = path.join(root, `tools`, `asdoc-check.py`);

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
const targets = process.argv.slice(2);
if (targets.length === 0) {
	targets.push(`codex/en/code/step13.as`);
}

const framework = fs.readFileSync(path.join(root, `viz.as`), `utf8`);

// A failing target is a finding, not a reason to stop: keep going so a whole
// corpus can be swept in one pass, and report each failure against its name.
let failures = 0;
const firstLine = (err) => String((err && err.message) || err).split(`\n`)[0];

for (const target of targets) {
	if (!fs.existsSync(path.join(root, target))) {
		process.stderr.write(`asviz-run: no such file: ${target}\n`);
		failures++;
		continue;
	}
	AllSpeak_Viz.target = target;
	AllSpeak_Viz.sources[target] = fs.readFileSync(path.join(root, target), `utf8`);
	AllSpeak_Viz.sections[target] = sectionsFor(path.join(root, target));
	AllSpeak_Viz.problems = [];

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
