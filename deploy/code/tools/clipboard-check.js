#!/usr/bin/env node
//
// clipboard-check.js — the JS half of `tools/clipboard-check.py`.
//
// **Why this exists.** The browser's copy is two things that fail invisibly on their own: the statement has to
// compile to `COPY_TO_CLIPBOARD` at all, and the run has to *put the value where the browser will copy it* —
// a textarea that is in the document, selected, and handed to `document.execCommand('copy')`. A compile check
// sees only the first; a run with no assertion sees neither. So the page is stubbed (a textarea that records
// what it was given, an `execCommand` that records its own name and says whether it copied) and the compiled
// command is driven through the dispatcher the runtime would use.
//
// **What a stub can and cannot say.** It cannot prove that a real browser then puts the text on the system
// clipboard — that was measured by hand in Chrome, `execCommand('copy')` returning true while
// `navigator.clipboard.writeText` rejected with `NotAllowedError`, and the text read back with `xsel -b -o`
// (see the note on `Copy` in `js/allspeak/Browser.js` and `learn/reference/27-clipboard.md`). What this file
// can say is that the value reaches the textarea, that the copy is the command that was asked for, and that a
// refusal is reported rather than swallowed.
//
// It compiles the runtime from source, so it needs a checkout — the same sentence the other checks say, for
// the same reason: the starter packs are clients of the CDN and carry no `js/`.
//
// Usage:  node tools/clipboard-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`clipboard-check: no js/allspeak beside this script. This check compiles the runtime`
		+ ` from source, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
	process.exit(2);
}

let failures = 0;
const check = (ok, text) => {
	if (!ok) failures++;
	console.log(`  ${ok ? `OK  ` : `FAIL`} ${text}`);
};

// ---- the stubs the runtime needs, and the two that record -----------------------------------------------
const noop = () => {};
let execCalls = [];
let execResult = true;
const areas = [];
const textarea = () => {
	const area = {
		tagName: `textarea`, value: ``, style: {}, selected: false, range: null,
		inDocument: false,
		setAttribute: noop,
		select() { this.selected = true; },
		setSelectionRange(start, end) { this.range = [start, end]; },
	};
	areas.push(area);
	return area;
};
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
global.alert = m => process.stderr.write(`alert: ${m}\n`);
global.document = {
	getElementById: () => null,
	querySelector: () => null,
	createElement: tag => (tag === `textarea` ? textarea() : { style: {}, appendChild: noop, setAttribute: noop }),
	createElementNS: () => ({ style: {}, appendChild: noop, setAttribute: noop }),
	addEventListener: noop,
	body: {
		appendChild: node => { if (node) node.inDocument = true; return node; },
		removeChild: node => { if (node) node.inDocument = false; return node; },
	},
	head: { appendChild: noop },
	execCommand: name => { execCalls.push(name); return execResult; },
};

const RUNTIME = [`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`, `Language.js`,
	`LanguagePack_en.js`, `Compile.js`, `Main.js`];
for (const file of RUNTIME) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
}
vm.runInThisContext(`globalThis.__clipboard = { AllSpeak, AllSpeak_Browser, AllSpeak_Language,`
	+ ` AllSpeak_LanguagePack_en };`);
const { AllSpeak, AllSpeak_Browser, AllSpeak_Language, AllSpeak_LanguagePack_en } = globalThis.__clipboard;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};

const compile = source => {
	const saved = AllSpeak_Language.pack;
	const stdout = console.log;
	console.log = noop;          // the compiler writes "No handler found" to the debug console before throwing
	try {
		return { program: AllSpeak.compileScript(AllSpeak.tokeniseFile(source.split(`\n`)), null, null, null),
			error: null };
	} catch (err) {
		return { program: null, error: String(err.message).split(`\n`)[0] };
	} finally {
		console.log = stdout;
		AllSpeak_Language.init(saved);
	}
};

const copyCommand = program => program.find(c => c && c.keyword === `copy`);

// ---- the spellings that must compile to the same opcode --------------------------------------------------
const VALUE = `Résumé — order 42 confirmed`;
const forms = {
	[`clipboard copy \`literal\``]: { source: `clipboard copy \`${VALUE}\``, expect: `value` },
	[`clipboard copy Variable`]: { source: `variable MyVar\nput \`v\` into MyVar\nclipboard copy MyVar`, expect: `value` },
	[`copy \`literal\` (older spelling)`]: { source: `copy \`${VALUE}\``, expect: `value` },
	[`copy Input element`]: { source: `input MyInput\ncopy MyInput`, expect: `name` },
	[`clipboard copy Input element`]: { source: `input MyInput\nclipboard copy MyInput`, expect: `name` },
};
for (const [label, { source, expect }] of Object.entries(forms)) {
	const { program, error } = compile(source);
	const command = program && copyCommand(program);
	check(command && command.opcode === `COPY_TO_CLIPBOARD` && command[expect] !== undefined,
		`${label} compiles to COPY_TO_CLIPBOARD carrying \`${expect}\``
		+ ` (${error ? error : JSON.stringify({ opcode: command && command.opcode,
			name: command && command.name, value: command && command.value && command.value.content })})`);
}

// ---- the run: the value has to reach a selected textarea, and the copy has to be asked for ---------------
const runCommand = value => {
	areas.length = 0;
	execCalls = [];
	const { program } = compile(`clipboard copy \`${value}\``);
	const command = copyCommand(program);
	const errors = [];
	const fake = {
		pc: command.pc,
		[command.pc]: command,
		getFormattedValue: () => value,
		runtimeError: (lino, message) => errors.push(message),
	};
	const next = AllSpeak_Browser.getOpcodeMap().COPY_TO_CLIPBOARD.run(fake);
	return { areas: areas.slice(), execCalls: execCalls.slice(), errors, next, pc: command.pc };
};

const copied = runCommand(VALUE);
check(copied.areas.length === 1 && copied.areas[0].value === VALUE,
	`the value goes into the textarea the browser copies from (${JSON.stringify(copied.areas[0] && copied.areas[0].value)})`);
check(copied.areas.length === 1 && copied.areas[0].selected && copied.areas[0].range !== null,
	`and that textarea is selected, range included, which is what makes the copy cover the whole value`);
check(copied.execCalls.length === 1 && copied.execCalls[0] === `copy`,
	`and \`document.execCommand('copy')\` is what is asked for (${JSON.stringify(copied.execCalls)})`);
check(copied.areas.length === 1 && copied.areas[0].inDocument === false,
	`and the textarea is taken out of the document again — it does not stay in the page`);
check(copied.errors.length === 0 && copied.next === copied.pc + 1,
	`and the command is a plain statement: no error, and it steps to the next one (pc ${copied.pc} -> ${copied.next})`);

// ---- a refusal is reported, not swallowed ---------------------------------------------------------------
execResult = false;
const refused = runCommand(VALUE);
check(refused.errors.length === 1 && /refused the clipboard/i.test(refused.errors[0]),
	`a browser that refuses the copy produces a runtime error (${JSON.stringify(refused.errors)})`);
execResult = true;

// ---- the half that is not here --------------------------------------------------------------------------
const paste = compile(`variable X\nclipboard paste into X`);
check(paste.error !== null && /python/i.test(paste.error),
	`\`clipboard paste into X\` is refused and names the Python runtime (${JSON.stringify(paste.error)})`);

console.log(`\nclipboard-check: ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
