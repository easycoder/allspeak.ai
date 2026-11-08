#!/usr/bin/env node
//
// Does `set the tooltip of <element> to <text>` reach the element, and does an empty text take it away?
//
// **Why this exists.** A tooltip is invisible to every other instrument: no script in the 323-script
// sweep sets one, and a branch wired to the wrong element would change nothing a run could show. The
// value this check reads is therefore the element's own `title` attribute, on the element the runtime
// created — not a returned object, and not a drawing.
//
// **The empty case is the one worth asserting.** The statement covers both setting and clearing, so a
// path that writes the empty string must remove the attribute rather than leave a `title=""` behind:
// otherwise a tooltip that was taken away still reads as one that was set.
//
// **Both hosts are covered, by the pair of checks.** This file drives the browser flavour; its sister
// `tools/tooltip-check.py` drives the desktop one, where the same statement reaches `setToolTip`.
//
// Usage:  node tools/tooltip-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles and runs the runtime from source, so it needs a checkout rather than a starter pack — the
// same sentence the other checks say, for the same reason: the packs are clients of the CDN and carry no
// `js/`.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`tooltip-check: no js/allspeak beside this script. This check compiles and runs a`
		+ ` tooltip statement on the runtime sources, so it needs a checkout of the AllSpeak repository`
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
	removeAttribute(k) { delete this.attributes[k]; },
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
vm.runInThisContext(`globalThis.__tooltip = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en,`
	+ ` AllSpeak_Run, AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,`
	+ ` AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT };`);
const {
	AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run,
	AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,
	AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT
} = globalThis.__tooltip;
const packOf = { en: AllSpeak_LanguagePack_en, fr: AllSpeak_LanguagePack_fr,
	de: AllSpeak_LanguagePack_de, it: AllSpeak_LanguagePack_it };
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};
AllSpeak.scriptIndex = AllSpeak.scriptIndex || 0;

// The premise, asserted before anything is concluded from it: the stub keeps a `title` set on it and
// loses it again when removed.
const premise = mk(`div`);
premise.setAttribute(`title`, `temporary`);
const kept = premise.getAttribute(`title`);
premise.removeAttribute(`title`);
check(kept === `temporary` && premise.getAttribute(`title`) === null,
	`the stub keeps a title written to it and drops it on remove, so the value read below is the value set `
	+ `(${kept})`);

// ---- compiling and running, with the pack and handler tables restored ------------------------------
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
const titleOf = program => {
	const element = program ? elementOf(program, `Win`) : null;
	return element ? element.getAttribute(`title`) : null;
};

// ---- what a script writes, and what the element gets ------------------------------------------------
const set = quiet(() => compile(fixture([
	`    set the tooltip of Win to \`Save the file\``,
], `TooltipSet`)));
check(set.ok && titleOf(set.value) === `Save the file`,
	`'set the tooltip of Win to \`Save the file\`' sets the title attribute `
	+ `(${set.ok ? titleOf(set.value) : set.error})`);

const noArticle = quiet(() => compile(fixture([
	`    set tooltip of Win to \`Without the article\``,
], `TooltipNoArticle`)));
check(noArticle.ok && titleOf(noArticle.value) === `Without the article`,
	`the article is optional, as it is elsewhere in \`set\` (${noArticle.ok ? titleOf(noArticle.value) : noArticle.error})`);

const variable = quiet(() => compile(fixture([
	`    variable Message`,
	`    put \`Loaded from the address book\` into Message`,
	`    set the tooltip of Win to Message`,
], `TooltipVariable`)));
check(variable.ok && titleOf(variable.value) === `Loaded from the address book`,
	`and a variable holding the text works too (${variable.ok ? titleOf(variable.value) : variable.error})`);

const cleared = quiet(() => compile(fixture([
	`    set the tooltip of Win to \`temporary\``,
	`    set the tooltip of Win to \`\``,
], `TooltipCleared`)));
const clearedElement = cleared.ok ? elementOf(cleared.value, `Win`) : null;
check(cleared.ok && clearedElement !== null && !(`title` in clearedElement.attributes),
	`an empty text removes the attribute rather than leaving an empty title `
	+ `(${cleared.ok ? JSON.stringify(clearedElement.attributes) : cleared.error})`);

// ---- the word in every pack, and its collision check ------------------------------------------------
const form = { en: `tooltip`, fr: `infobulle`, de: `tooltip`, it: `suggerimento` };
for (const lang of [`en`, `fr`, `it`, `de`]) {
	const pack = packOf[lang];
	const answers = (() => {
		AllSpeak_Language.init(pack);
		return AllSpeak_Language.reverseWord(form[lang]);
	})();
	const entry = pack.opcodes.SET_TOOLTIP;
	check(answers === `tooltip` && entry !== undefined,
		`${lang}: '${form[lang]}' reverse-maps to '${answers}'; SET_TOOLTIP carries `
		+ `'${entry ? entry.patterns[0] : `MISSING`}'`);
}
AllSpeak_Language.init(AllSpeak_LanguagePack_en);

// A translated script, compiled and run, so each word is exercised rather than merely present.
const french = quiet(() => compile([
	`    language français`,
	`    script InfoFr`,
	`    div Fenetre`,
	`Principal:`,
	`    crée Fenetre`,
	`    définis infobulle de Fenetre à \`Enregistrer le fichier\``,
	`    arrête`,
]));
check(french.ok && elementOf(french.value, `Fenetre`).getAttribute(`title`) === `Enregistrer le fichier`,
	`a French script reaches the same attribute (${french.ok ? elementOf(french.value, `Fenetre`).getAttribute(`title`) : french.error})`);

const german = quiet(() => compile([
	`    language deutsch`,
	`    script TippDe`,
	`    div Fenster`,
	`Haupt:`,
	`    erstelle Fenster`,
	`    setze den tooltip von Fenster zu \`Datei speichern\``,
	`    stoppe`,
]));
check(german.ok && elementOf(german.value, `Fenster`).getAttribute(`title`) === `Datei speichern`,
	`and a German one reaches it too (${german.ok ? elementOf(german.value, `Fenster`).getAttribute(`title`) : german.error})`);

const italian = quiet(() => compile([
	`    language italiano`,
	`    script SuggerimentoIt`,
	`    div Finestra`,
	`Principale:`,
	`    crea Finestra`,
	`    imposta il suggerimento di Finestra a \`Salva il file\``,
	`    ferma`,
]));
check(italian.ok && elementOf(italian.value, `Finestra`).getAttribute(`title`) === `Salva il file`,
	`and an Italian one (${italian.ok ? elementOf(italian.value, `Finestra`).getAttribute(`title`) : italian.error})`);

// ---- the opcode and the dispatch map ----------------------------------------------------------------
const opcodeCase = quiet(() => compile(fixture([
	`    set the tooltip of Win to \`Save\``,
], `TooltipOpcode`)));
const command = opcodeCase.ok ? opcodeCase.value.find(c => c.type === `setTooltip`) : null;
check(command !== undefined && command !== null && command.opcode === `SET_TOOLTIP`,
	`the statement carries an opcode of its own rather than falling through to SET_CONTENT `
	+ `(${command ? command.opcode : `no command`})`);
check(AllSpeak_Browser.getOpcodeMap().SET_TOOLTIP === AllSpeak_Browser.Set,
	`and the dispatch map sends SET_TOOLTIP to the \`Set\` handler`);

// ---- what must be refused ---------------------------------------------------------------------------
// A plain `variable` has no DOM element to put a tooltip on, so the statement is refused rather than
// compiling to something that silently does nothing.
const notDom = quiet(() => compile([
	`    script TooltipNotDom`,
	`    variable Counter`,
	`Main:`,
	`    set the tooltip of Counter to \`no element\``,
	`    stop`,
]));
check(!notDom.ok,
	`'set the tooltip of Counter …' on a plain \`variable\` is refused `
	+ `(${notDom.error || `it compiled`})`);

// ---- both hosts, and which one this is ---------------------------------------------------------------
console.log(`  ..    this is the browser flavour; tools/tooltip-check.py drives the desktop one, where the`);
console.log(`  ..    same statement reaches setToolTip`);
console.log(`  ..    packs loaded: en, ${packs.filter(p => p !== `en`).join(`, `)}`);

console.log(failures === 0
	? `\ntooltip-check: all checks passed`
	: `\ntooltip-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
