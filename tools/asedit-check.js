#!/usr/bin/env node
//
// Compile asedit.allspeak the way the editor page does, and report what came out.
//
// Two things this exists for.
//
// **The plugin set comes from the page, not from a list here.** The editor loads its runtime and
// plugins from its own page, so a check that loads *every* plugin in js/plugins verifies a program
// nobody runs. That is not hypothetical: a version of this check passed while the editor failed to
// compile with "I don't understand 'svg'", because the page's list had no svg plugin and the check
// had all of them. Reading the list out of edit.html is what stops the two drifting.
//
// **A non-zero command count, not just the analyser's clean bill.** `asdoc-check.py` reports doc
// blocks, not compilability, and a broken editor still analyses clean. Compiling is the check the
// repo's own notes assume somebody runs after editing asedit.
//
// Usage:  node tools/asedit-check.js [script.allspeak]     (default asedit.allspeak)
//
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, `..`);

const target = process.argv[2] || `asedit.allspeak`;

// The truth about what the editor loads: its own page.
const page = fs.readFileSync(path.join(root, `edit.html`), `utf8`);
const listed = page.match(/const bundles = \[([\s\S]*?)\]/);
if (!listed) {
	process.stderr.write(`asedit-check: no 'bundles' list in edit.html — has the page changed shape?\n`);
	process.exit(1);
}
const bundles = [...listed[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
const runtime = bundles.filter(n => !n.startsWith(`plugins/`));
const plugins = bundles.filter(n => n.startsWith(`plugins/`)).map(n => n.replace(`plugins/`, ``));

const noop = () => {};
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
// A host must provide this: the runtime reports an error by alerting, so without it a value that
// will not evaluate surfaces as "alert is not defined" and hides what actually went wrong.
global.alert = m => process.stderr.write(`alert: ${m}\n`);
const byId = {};
const mk = () => ({ style: {}, children: [], appendChild: noop, setAttribute: noop,
	addEventListener: noop, classList: { add: noop, remove: noop } });
global.document = { getElementById: () => null, querySelector: () => null,
	createElement: mk, createElementNS: () => mk(), addEventListener: noop,
	body: mk(), head: mk() };

const BUNDLE_ORDER = [`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`, `Language.js`,
	`LanguagePack_en.js`, `Compile.js`, `Main.js`];
for (const f of BUNDLE_ORDER) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, f), `utf8`), { filename: f });
}
vm.runInThisContext(`globalThis.__x = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en } = globalThis.__x;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};        // a host must initialise this, or a script-name lookup fails

const skipped = [];
for (const f of plugins) {
	try {
		vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, f), `utf8`), { filename: f });
	} catch (err) {
		// A plugin needing CodeMirror, or a second copy of something already bundled, cannot load
		// headlessly. Said out loud rather than swallowed, because a silently missing domain is
		// exactly the failure this tool is here to catch.
		skipped.push(`${f} (${String(err.message).split(`\n`)[0]})`);
	}
}

console.log(`asedit-check: runtime ${runtime.join(`, `)}`);
console.log(`asedit-check: plugins ${plugins.join(`, `)}`);
for (const note of skipped) console.log(`  not loaded headlessly: ${note}`);

const text = fs.readFileSync(path.join(root, target), `utf8`);
try {
	const program = AllSpeak.compileScript(AllSpeak.tokeniseFile(text.split(`\n`)), null, null, null);
	const commands = Object.keys(program).filter(k => /^\d+$/.test(k)).length;
	const symbols = Object.keys(program.symbols || {}).length;
	console.log(`  ${target}: commands=${commands} symbols=${symbols}`);
	if (commands === 0) {
		process.stderr.write(`ASEDITCHECK-FAIL: compiled to nothing — the editor is broken\n`);
		process.exitCode = 1;
	} else {
		console.log(`  OK`);
	}
} catch (err) {
	process.stderr.write(`ASEDITCHECK-FAIL: ${String(err.message || err).split(`\n`)[0]}\n`);
	process.exitCode = 1;
}
