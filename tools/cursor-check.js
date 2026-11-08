#!/usr/bin/env node
//
// Does `set the cursor of Win to wait` reach the element's `style.cursor`, and does the name a script
// writes become the CSS value it meant?
//
// **Why this exists.** A cursor is invisible in every other instrument: nothing in the 323-script sweep
// sets one, and a browser silently ignores a cursor value it does not know, so a misspelt name or a
// branch wired to the wrong element would change nothing anybody could see. The value the test reads is
// therefore the *style property itself*, on the element the runtime created — not a returned object, and
// not a drawing.
//
// **The instrument's own premise.** The stub element's `style` is an ordinary object, so a write to
// `style.cursor` is visible here exactly as it would be on a real element. The first check asserts that
// much before anything is concluded from later ones: if the stub swallowed the write, every passing
// assertion below would be about a value nothing had set.
//
// **One host, and the other cannot be asked.** A cursor is DOM, and the Python runtime has no DOM at
// all, so its packs carry the word for parity and no behaviour goes with it — the same sentence
// `tools/hover-check.js` and `tools/capture-check.js` make.
//
// Usage:  node tools/cursor-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles and runs the runtime from source, so it needs a checkout rather than a starter pack — the
// same sentence the other checks say, for the same reason: the packs are clients of the CDN and carry no
// `js/`.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`cursor-check: no js/allspeak beside this script. This check compiles and runs a`
		+ ` cursor statement on the runtime sources, so it needs a checkout of the AllSpeak repository`
		+ ` rather than a starter pack.\n`);
	process.exit(2);
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};

// ---- the stub ------------------------------------------------------------------------------------
const byId = {};
const noop = () => {};
const mk = tag => ({
	tagName: tag, style: {}, children: [], attributes: {}, listeners: {},
	appendChild(c) { this.children.push(c); return c; },
	removeChild() {},
	setAttribute(k, v) { if (k === `id`) byId[v] = this; this.attributes[k] = v; },
	getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
	getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
	blur() {},
	classList: { add: noop, remove: noop, contains: () => false },
	addEventListener() {},
	removeEventListener() {},
});
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
global.document = {
	getElementById: id => byId[id] || null,
	querySelector: () => null,
	createElement: mk, createElementNS: (ns, tag) => mk(tag),
	addEventListener: noop, body: mk(`body`), head: mk(`head`),
};
// The runtime reports a runtime error by alerting, so the message is collected here rather than standing
// the host still. A check that expects a refusal reads it back.
let alerts = [];
global.alert = message => { alerts.push(`${message}`); };

// Bundle order from ./build-allspeak, then the other packs, then the plugins the way a page loads them.
const RUNTIME = [`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`, `Language.js`,
	`LanguagePack_en.js`, `Compile.js`, `Main.js`];
for (const file of RUNTIME) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
}
const packs = [];
for (const file of fs.readdirSync(path.join(root, `js/allspeak`))
	.filter(f => /^LanguagePack_\w+\.js$/.test(f)).sort()) {
	if (RUNTIME.includes(file)) continue;
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
	packs.push(file.replace(/^LanguagePack_/, ``).replace(/\.js$/, ``));
}
for (const file of fs.readdirSync(path.join(root, `js/plugins`)).filter(f => f.endsWith(`.js`)).sort()) {
	try { vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, file), `utf8`), { filename: file }); }
	catch (err) { /* a plugin that needs a browser: not this check's business */ }
}
vm.runInThisContext(`globalThis.__cursor = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en,`
	+ ` AllSpeak_Run, AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,`
	+ ` AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT };`);
const {
	AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run,
	AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,
	AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT
} = globalThis.__cursor;
const packOf = { en: AllSpeak_LanguagePack_en, fr: AllSpeak_LanguagePack_fr,
	de: AllSpeak_LanguagePack_de, it: AllSpeak_LanguagePack_it };
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};
// The compiler's `script` handler reads a counter the page normally sets at startup; without it a
// refused script is reported under the name `NaN`, which hides which fixture said what.
AllSpeak.scriptIndex = AllSpeak.scriptIndex || 0;

// The premise, asserted before anything is concluded from it: the stub's `style` is where a cursor lands,
// and a write stays there.
const premise = mk(`div`);
premise.style.cursor = `wait`;
check(premise.style.cursor === `wait`,
	`the stub element keeps a cursor written to its \`style\`, so the value read below is the value set `
	+ `(${premise.style.cursor})`);

// ---- compiling and running, with the pack and handler tables restored ------------------------------
// A script's `language` directive switches the pack while compiling and a compile that fails leaves it
// switched; the handler tables are nulled by that directive, so they are restored too. Without both, the
// next English fixture compiles against the previous language's words — the fault `tools/hover-check.js`
// records.
const compile = lines => {
	const saved = AllSpeak_Language.pack;
	alerts = [];
	try {
		const source = AllSpeak.tokeniseFile(lines.join(`\n`).split(`\n`));
		const program = AllSpeak.compileScript(source, null, null, null);
		delete AllSpeak.scripts[program.script];
		program.script = AllSpeak.scriptIndex++;
		AllSpeak.scripts[program.script] = program;
		program.running = true;
		AllSpeak_Run.run(program, 0);
		return program;
	} finally {
		AllSpeak_Language.init(saved);
		for (const domain of [AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT]) {
			if (domain && domain._compileHandlers) {
				domain._compileHandlers = null;
			}
		}
	}
};
const quiet = fn => {
	try {
		return { ok: true, error: null, value: fn() };
	} catch (err) {
		return { ok: false, error: String(err.message).split(`\n`)[0], value: null };
	}
};
const elementOf = (program, name) => {
	const record = program.getSymbolRecord(name);
	return record.element[0] || null;
};
const fixture = (lines, name) => [
	`    script ${name}`,
	`    div Win`,
	`Main:`,
	`    create Win`,
	...lines,
	`    stop`
];

// ---- what a script writes, and what CSS gets ------------------------------------------------------
// One element, one statement at a time, so each assertion is about its own name rather than about the
// last assignment of a run. The words in the table are the friendly ones plus two CSS names that are
// reachable only because the check knows them.
const caseOf = (name, expected) => {
	const program = quiet(() => compile(fixture([
		`    set the cursor of Win to ${name}`,
	], `Cursor${expected.replace(/[^A-Za-z]/g, ``)}`)));
	const element = program.ok ? elementOf(program.value, `Win`) : null;
	check(program.ok && element !== null && element.style.cursor === expected,
		`'set the cursor of Win to ${name}' sets \`${expected}\` `
		+ `(${program.ok ? (element ? element.style.cursor : `no element`) : program.error})`);
};
caseOf(`arrow`, `default`);
caseOf(`hand`, `pointer`);
caseOf(`wait`, `wait`);
caseOf(`progress`, `progress`);
caseOf(`text`, `text`);
caseOf(`move`, `move`);
caseOf(`crosshair`, `crosshair`);
caseOf(`help`, `help`);
caseOf(`not-allowed`, `not-allowed`);
caseOf(`grab`, `grab`);
caseOf(`grabbing`, `grabbing`);
caseOf(`none`, `none`);

// A backticked name and a variable holding one, because a name is a value like any other and the bare
// word is the convenience rather than the only form.
const backtick = quiet(() => compile(fixture([
	`    set the cursor of Win to \`grabbing\``,
], `CursorBacktick`)));
check(backtick.ok && elementOf(backtick.value, `Win`).style.cursor === `grabbing`,
	`a backticked name reaches the same table (\`grabbing\`)`);

const variable = quiet(() => compile(fixture([
	`    variable Shape`,
	`    put \`grab\` into Shape`,
	`    set the cursor of Win to Shape`,
], `CursorVariable`)));
check(variable.ok && elementOf(variable.value, `Win`).style.cursor === `grab`,
	`and a variable holding one does too (\`grab\`)`);

// ---- both flavours publish the same names --------------------------------------------------------
// **A cursor name is a published contract, and AllSpeak has two runtimes.** A name the browser can
// render and the desktop cannot would make the same script behave differently in the two, so the
// table in `as_graphics.py` is compared against this one here rather than trusted to stay in step.
const pythonSource = fs.readFileSync(path.join(root, `allspeak-py/allspeak/as_graphics.py`), `utf8`);
const pythonBlock = pythonSource.match(/CURSORS = \{([\s\S]*?)\n\}/);
const pythonNames = pythonBlock
	? [...pythonBlock[1].matchAll(/^\s*'([^']+)':/gm)].map(m => m[1]).sort()
	: [];
const jsNames = Object.keys(AllSpeak_BrowserCursors.names).sort();
check(pythonNames.length > 0 && pythonNames.join(`,`) === jsNames.join(`,`),
	`the Python flavour accepts exactly the browser's names `
	+ `(${pythonNames.length} in Python, ${jsNames.length} here: ${jsNames.join(`, `)})`);

// The other half of that contract: a CSS name neither flavour renders is refused rather than passed
// through, so the vocabulary stays the one documented set.
const cssOnly = quiet(() => compile(fixture([
	`    set the cursor of Win to col-resize`,
], `CursorCssOnly`)));
check(cssOnly.ok && alerts.some(message => message.indexOf(`'col-resize' is not a cursor`) >= 0),
	`a CSS-only name outside the published set is refused rather than half-supported `
	+ `(${alerts.map(m => m.split(`\n`).filter(Boolean).pop()).join(`; `) || `no alert`})`);

// ---- the page itself -----------------------------------------------------------------------------
// A busy cursor usually belongs to the whole page rather than to one element, and `body` is the target
// every language already spells for `set style … of body`.
const page = quiet(() => compile([
	`    script CursorPage`,
	`Main:`,
	`    set the cursor of body to wait`,
	`    stop`,
]));
check(page.ok && document.body.style.cursor === `wait`,
	`'set the cursor of body to wait' sets the page's own cursor (${document.body.style.cursor})`);

// ---- what must be refused -------------------------------------------------------------------------
// The browser ignores a name it does not know, so a typo has to be refused by the runtime or it is
// invisible. The message names the words that would have worked.
const typo = quiet(() => compile(fixture([
	`    set the cursor of Win to wobble`,
], `CursorTypo`)));
check(typo.ok && elementOf(typo.value, `Win`).style.cursor === undefined
	&& alerts.some(message => message.indexOf(`'wobble' is not a cursor`) >= 0),
	`a name no browser knows is a runtime error rather than a silent no-op `
	+ `(${alerts.map(m => m.split(`\n`).filter(Boolean).pop()).join(`; `) || `no alert`})`);

// A plain `variable` is not a DOM element — `pick` and `wheel` refuse one, and so must a cursor.
const notDom = quiet(() => compile([
	`    script CursorNotDom`,
	`    variable Counter`,
	`Main:`,
	`    set the cursor of Counter to hand`,
	`    stop`,
]));
check(!notDom.ok,
	`'set the cursor of Counter to hand' on a plain \`variable\` is refused `
	+ `(${notDom.error || `it compiled`})`);

// ---- the opcode, the dispatch map and the packs ---------------------------------------------------
const opcodeCase = quiet(() => compile(fixture([
	`    set the cursor of Win to hand`,
], `CursorOpcode`)));
const command = opcodeCase.ok ? opcodeCase.value.find(c => c.type === `setCursor`) : null;
check(command !== undefined && command !== null && command.opcode === `SET_CURSOR`,
	`the statement carries an opcode of its own rather than falling through to SET_CONTENT `
	+ `(${command ? command.opcode : `no command`})`);
check(AllSpeak_Browser.getOpcodeMap().SET_CURSOR === AllSpeak_Browser.Set,
	`and the dispatch map sends SET_CURSOR to the \`Set\` handler`);

// The word in each pack, and its collision check — the project has paid for a canonical word that
// reverse-mapped onto another command once (the first German `join`), so each spelling is asked what it
// answers. `cursor` is in all four packs already; the opcode entry is the part this change adds.
const form = { en: `cursor`, fr: `curseur`, it: `cursore`, de: `cursor` };
for (const lang of [`en`, `fr`, `it`, `de`]) {
	const pack = packOf[lang];
	const entry = pack.opcodes.SET_CURSOR;
	AllSpeak_Language.init(pack);
	const answers = AllSpeak_Language.reverseWord(form[lang]);
	check(entry !== undefined && answers === `cursor`,
		`${lang}: '${form[lang]}' reverse-maps to '${answers}'; SET_CURSOR carries `
		+ `'${entry ? entry.patterns[0] : `MISSING`}'`);
}
AllSpeak_Language.init(AllSpeak_LanguagePack_en);

// A French script, compiled and run, so the word is exercised rather than merely present. Every keyword
// in it is the French pack's own spelling — `crée` for create, `définis` for set, `arrête` for stop —
// and the cursor name stays English because the names are the browser's vocabulary, not the language's.
const french = quiet(() => compile([
	`    language français`,
	`    script CurseurFr`,
	`    div Fenetre`,
	`Principal:`,
	`    crée Fenetre`,
	`    définis le curseur de Fenetre à hand`,
	`    arrête`,
]));
check(french.ok && elementOf(french.value, `Fenetre`).style.cursor === `pointer`,
	`and a French script's 'définis le curseur de Fenetre à hand' reaches the same table `
	+ `(${french.ok ? elementOf(french.value, `Fenetre`).style.cursor : french.error})`);

const frenchBody = quiet(() => compile([
	`    language français`,
	`    script CurseurCorpsFr`,
	`Principal:`,
	`    définis le curseur de corps à wait`,
	`    arrête`,
]));
check(frenchBody.ok && document.body.style.cursor === `wait`,
	`and 'définis le curseur de corps à wait' names the page through the French word for body `
	+ `(${frenchBody.ok ? document.body.style.cursor : frenchBody.error})`);

// ---- one host, said out loud ----------------------------------------------------------------------
console.log(`  ..    nothing is asserted of the Python runtime: it has no DOM to put a cursor on, so the `
	+ `word in its packs is parity and no behaviour (the shape of note tools/capture-check.js makes)`);
console.log(`  ..    packs loaded: en, ${packs.filter(p => p !== `en`).join(`, `)}`);

console.log(failures === 0
	? `\ncursor-check: all checks passed`
	: `\ncursor-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
