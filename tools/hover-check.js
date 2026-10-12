#!/usr/bin/env node
//
// Does `on hover` fire, does it read what the event carried, and does it cost nothing when nothing asks for it?
//
// **Why this exists.** The runtime's pointer events were four — `pick`, `drag`, `drop`, `wheel` — and a
// rollover is a fifth. An event in this language is vocabulary rather than a keyword: a run half that attaches
// the listener, a reading it can be asked for (`the hover position`), and a word in each pack. Nothing in the
// 323-script sweep registers one, so nothing in the tree fails when the listener is attached to the wrong
// thing, attached to everything, or never attached at all — which is the shape of fault a check is for.
//
// **The instrument is half of the check.** `tools/plotview-check.js` runs the drawing against a stub whose
// `addEventListener` is a **no-op**, which is exactly right for a harness that only asks what was *drawn* —
// but a listener is the whole of what this event is, so that stub cannot tell a registered hover from an
// unregistered one. The stub below **stores** each listener and can **dispatch** one, and the first thing
// asserted is that the stub does that: an instrument that cannot fire the event would report a runtime that
// never fired it too, and the two are indistinguishable from the output.
//
// **One host, and the other cannot be asked.** There is no pointer event in the Python runtime at all — its
// `on` accepts no `pick`, no `drag`, no `wheel` and so no `hover` — so the word in the Python packs is parity
// and nothing more, and there is no behaviour on that side to assert. `tools/capture-check.js` is the
// precedent for a check that drives one host and says so in its own output rather than quietly passing for
// two.
//
// Usage:  node tools/hover-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles and runs the runtime from source, so it needs a checkout rather than a starter pack — the same
// sentence the other checks say, for the same reason: the packs are clients of the CDN and carry no `js/`.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`hover-check: no js/allspeak beside this script. This check compiles and runs a hover`
		+ ` handler on the runtime sources, so it needs a checkout of the AllSpeak repository rather than a`
		+ ` starter pack.\n`);
	process.exit(2);
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};

// ---- the stub, and it is the one stub that can fire an event -----------------------------------
const byId = {};
const noop = () => {};
// **A listener is stored, and the element can be asked to send it.** Everything else about these elements is as
// inert as the other harnesses' — nothing here lays anything out — but a `mousemove` that vanished into a no-op
// would make every assertion below pass on an event that never happened.
const mk = tag => ({
	tagName: tag, style: {}, children: [], attributes: {}, listeners: {},
	box: { left: 0, top: 0, width: 0, height: 0 },
	appendChild(c) { this.children.push(c); return c; },
	removeChild() {},
	setAttribute(k, v) { if (k === `id`) byId[v] = this; this.attributes[k] = v; },
	// A real element reports `null` for an attribute it never got, and the plugin's own arithmetic reads `x`
	// and `y` as part of setting either — `undefined` would let a missing attribute come out as NaN.
	getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
	getBoundingClientRect() { return this.box; },
	// The runtime calls this in the pick handler, and a real element has it. `undefined` would
	// abort the handler before the document-level move listener below it was installed — which is
	// the very fault the pick path has already paid for once (see `Browser.js`'s `onmousedown`).
	blur() {},
	classList: { add: noop, remove: noop, contains: () => false },
	addEventListener(type, fn) {
		if (!this.listeners[type]) this.listeners[type] = [];
		this.listeners[type].push(fn);
	},
	removeEventListener() {},
	// Not something a browser has — a harness's own, so that a test can be the pointer. **A property
	// handler is dispatched too**: the runtime attaches `contextmenu` and `mousedown` as `element.on…`,
	// not through `addEventListener`, and a real dispatch reaches those the same way — so an instrument
	// that walked only `listeners` would report a registered handler as missing, which is exactly the
	// fault this stub exists to be incapable of.
	fire(type, event) {
		let delivered = 0;
		for (const fn of (this.listeners[type] || [])) {
			fn(event);
			delivered++;
		}
		const property = this[`on` + type];
		if (typeof property === `function`) {
			property(event);
			delivered++;
		}
		return delivered;
	},
});
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
// The runtime reports a runtime error by alerting, so without this the host dies with `alert is not defined`
// and the script's own message — which is the finding — is lost behind the host's crash.
global.alert = m => process.stderr.write(`alert: ${m}\n`);
global.document = {
	getElementById: id => byId[id] || null,
	querySelector: () => null,
	createElement: mk, createElementNS: (ns, tag) => mk(tag),
	addEventListener: noop, body: mk(`body`), head: mk(`head`),
};

// Bundle order from ./build-allspeak, then the other packs (`language` in a script switches to one), then the
// plugins the way a page loads them.
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
vm.runInThisContext(`globalThis.__hover = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en,`
	+ ` AllSpeak_Run, AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,`
	+ ` AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT };`);
const {
	AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run,
	AllSpeak_LanguagePack_fr, AllSpeak_LanguagePack_de, AllSpeak_LanguagePack_it,
	AllSpeak_Core, AllSpeak_Browser, AllSpeak_REST, AllSpeak_MQTT
} = globalThis.__hover;
const packOf = { en: AllSpeak_LanguagePack_en, fr: AllSpeak_LanguagePack_fr,
	de: AllSpeak_LanguagePack_de, it: AllSpeak_LanguagePack_it };
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};

// The premise, asserted before anything is concluded from it: the instrument stores a listener and can send it.
const premise = mk(`div`);
let premiseFired = 0;
premise.addEventListener(`mousemove`, () => { premiseFired++; });
const premiseDelivered = premise.fire(`mousemove`, {});
check(premiseDelivered === 1 && premiseFired === 1,
	`the stub stores a listener and can dispatch one (${premiseDelivered} delivered, ${premiseFired} ran) — `
	+ `plotview-check's stub cannot, which is why this one does not reuse it`);
// And the second half of the same premise, because a right-click attaches its handler the other way: as a
// property (`element.oncontextmenu`), which a real dispatch reaches exactly as it reaches a listener.
let premisePropertyRan = 0;
premise.oncontextmenu = () => { premisePropertyRan++; };
const premisePropertyDelivered = premise.fire(`contextmenu`, {});
check(premisePropertyDelivered === 1 && premisePropertyRan === 1,
	`and it dispatches an \`on…\` property handler the same way (${premisePropertyDelivered} delivered, `
	+ `${premisePropertyRan} ran) — the runtime attaches \`contextmenu\` and \`mousedown\` so`);

// ---- compiling, and reading what a script saw ---------------------------------------------------
const stdout = console.log;
let captured = [];
// A handler's `log` is the witness: what is asserted below is what the *script* saw, not what a returned object
// held, so the runtime's own output is where the answers are read from. `log` prints
// `HH:MM:SS.mmm:script:lino->value`, so the value is what follows the arrow — the prefix carries a wall clock
// and would make every comparison in this file false.
const readValue = line => {
	const at = line.indexOf(`->`);
	return at < 0 ? line : line.slice(at + 2);
};
const witness = fn => {
	captured = [];
	console.log = (...args) => { captured.push(args.join(` `)); };
	try { fn(); } finally { console.log = stdout; }
	return captured.map(readValue);
};
// The compiler writes `No handler found` to the debug console as it refuses a token, and *then* throws — so a
// script this check expects to be refused would print its refusal above the report. Collected here instead, and
// handed back so the check can quote what the compiler said rather than have it scattered through the output.
const quiet = fn => {
	captured = [];
	console.log = (...args) => { captured.push(args.join(` `)); };
	try {
		fn();
		return { ok: true, error: null, noise: captured.map(readValue) };
	} catch (err) {
		return { ok: false, error: String(err.message).split(`\n`)[0], noise: captured.map(readValue) };
	} finally {
		console.log = stdout;
	}
};
// **The pack is saved and restored around the compile**, because a script's `language` directive switches it
// while compiling and a compile that fails leaves it switched just as surely — `tools/asviz-run.js` carries the
// same guard for the same reason.
//
// **And the handler tables with it, or the restore is only half done.** A `language` directive nulls each
// domain's cached keyword→handler table so it is rebuilt from the new pack; putting the pack back without that
// leaves the next script compiling against the *previous* language's words. It cost one run here: the English
// right-click fixture, compiled after the French hover script, was refused with `I don't understand 'create'`.
const compile = lines => {
	const saved = AllSpeak_Language.pack;
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
const record = (program, name) => program.getSymbolRecord(name);
const elementOf = (program, name) => {
	const element = record(program, name).element[0];
	return element || null;
};

// Written rather than kept as fixtures: they exist only for this check, and a fixture in the tree would be one
// more file to keep in step with what the event means.
const HOVER = [
	`    script HoverProbe`,
	`    variable Seen`,
	`    variable Pos`,
	`    div Host`,
	`Main:`,
	`    create Host`,
	`    on hover Host`,
	`    begin`,
	`        put the hover position into Pos`,
	`        put property \`x\` of Pos into Seen`,
	`        log \`x=\` cat Seen`,
	`        put property \`y\` of Pos into Seen`,
	`        log \`y=\` cat Seen`,
	`    end`,
	`    stop`,
];

// The same element with nothing registered on it: the claim that the runtime adds no per-move cost to a page
// that did not ask for a hover, which is the discipline the recorder keeps (`one attribute test and, when
// armed, one or two list writes — nothing when it is not`).
const PLAIN = [
	`    script HoverPlain`,
	`    div Plain`,
	`Main:`,
	`    create Plain`,
	`    stop`,
];

// Two elements, one handler — the half of `pick`'s shape that serves an array. The fired element's index is
// what the handler reads, so firing the *second* is the assertion that the record's index moves.
const ARRAY = [
	`    script HoverArray`,
	`    variable Which`,
	`    div Cell`,
	`    set the elements of Cell to 2`,
	`Main:`,
	`    index Cell to 0`,
	`    create Cell`,
	`    index Cell to 1`,
	`    create Cell`,
	`    on hover Cell`,
	`    begin`,
	`        put the index of Cell into Which`,
	`        log \`cell=\` cat Which`,
	`    end`,
	`    stop`,
];

// A plain `variable` is not a browser element — the fourth script, and the one that must not compile. See the
// assertion below for why it matters.
const NOTDOM = [
	`    script HoverNotDom`,
	`    variable Counter`,
	`Main:`,
	`    put 1 into Counter`,
	`    on hover Counter`,
	`    begin`,
	`        log \`nope\``,
	`    end`,
	`    stop`,
];

// ---- the sixth event: `on right click` -----------------------------------------------------------
// **This statement did not compile until the action word was read across two tokens.** `right click` is two
// words, `reverseWord` reads one, and the compiler therefore saw an action called `right` and refused the
// statement altogether. So the fixture is the one that has to reach a command, and it reads `the pick
// position` — where the runtime puts the right-click's coordinates, the same place `pick` puts its own.
const RIGHTCLICK = [
	`    script RightClickProbe`,
	`    variable Seen`,
	`    variable Pos`,
	`    div Host`,
	`Main:`,
	`    create Host`,
	`    on right click Host`,
	`    begin`,
	`        put the pick position into Pos`,
	`        put property \`x\` of Pos into Seen`,
	`        log \`x=\` cat Seen`,
	`        put property \`y\` of Pos into Seen`,
	`        log \`y=\` cat Seen`,
	`    end`,
	`    stop`,
];

// The pick element, because the right button must stop counting as a pick — and the witness is the side effect
// only a real pick makes, not the handler's `log`: the pick handler's body runs from a `setTimeout`, so it
// would not have run by the time the assertion is made. What the left button installs synchronously is the
// document-level move listener a drag hangs off, and that is what the two presses are compared by.
const PICK = [
	`    script PickProbe`,
	`    div Host`,
	`Main:`,
	`    create Host`,
	`    on pick Host`,
	`    begin`,
	`        log \`picked\``,
	`    end`,
	`    stop`,
];

// ---- what it compiles to, and where the listener landed -----------------------------------------
const hover = compile(HOVER);
const hoverCommand = hover.find(c => c.action === `hover`);
check(hoverCommand !== undefined && hoverCommand.symbol === `Host`,
	`'on hover Host' compiles to an \`on\` command carrying the attached symbol `
	+ `(${hoverCommand ? hoverCommand.symbol : `no such command`})`);
check(hoverCommand !== undefined && hoverCommand.opcode === `ON_HOVER`,
	`and it resolves to an opcode of its own rather than falling through to dispatch by keyword `
	+ `(opcode ${hoverCommand && hoverCommand.opcode})`);

const host = elementOf(hover, `Host`);
const stored = host ? Object.keys(host.listeners) : [];
check(stored.includes(`mousemove`),
	`the listener is attached to the element the runtime attached, for \`mousemove\` `
	+ `(${host ? stored.sort().join(`, `) : `no element found`})`);
check(stored.includes(`mouseleave`),
	`and for \`mouseleave\`, which is what carries a tooltip away again: a hover is pointer-rate, so the last `
	+ `one a pane sees is *inside* the host`);
// Deliberate rather than forgotten: a touch has no pointer merely *over* a thing, so a synthetic hover would be
// a gesture the reader never made. `pick` registers `touchstart` because a tap really is a press; there is
// nothing here for a tap to be.
check(!stored.some(t => t.startsWith(`touch`)),
	`and for no touch event — a touch has no hover, and inventing one would be worse than not having it `
	+ `(${stored.length} listener kind(s))`);

const move = witness(() => host && host.fire(`mousemove`, { clientX: 120, clientY: 45 }));
check(move.join(`|`) === `x=120|y=45`,
	`a dispatched move runs the handler, and \`the hover position\` reads the event's own coordinates `
	+ `(${JSON.stringify(move)})`);

// **The leave is the half a tooltip cannot do without**, and it is asserted separately because it is the half
// that would survive a test made only of moves: a rollover that fires on the way in and never on the way out
// leaves the words on screen for good.
const leave = witness(() => host && host.fire(`mouseleave`, { clientX: 300, clientY: 60 }));
check(leave.join(`|`) === `x=300|y=60`,
	`and a dispatched leave runs it too, carrying the coordinates the pointer crossed the boundary at — which `
	+ `is what lets a hit test find nothing under it (${JSON.stringify(leave)})`);

// ---- nothing changes when nothing registers it --------------------------------------------------
const plain = compile(PLAIN);
const plainElement = elementOf(plain, `Plain`);
const plainListeners = plainElement ? Object.keys(plainElement.listeners) : null;
check(plainListeners !== null && plainListeners.length === 0,
	`an element with no 'on hover' carries no listener at all, so a page that does not ask pays nothing `
	+ `(${plainListeners ? plainListeners.length : `no element found`})`);

// ---- one handler, two elements ------------------------------------------------------------------
const array = compile(ARRAY);
const cellRecord = record(array, `Cell`);
const cells = cellRecord.element.filter(Boolean);
check(cells.length === 2,
	`both of an array's elements carry the handler (${cells.length} element(s) attached)`);
const second = witness(() => cells[1] && cells[1].fire(`mousemove`, { clientX: 40, clientY: 50 }));
check(second.join(`|`) === `cell=1`,
	`and firing the second leaves the record's index on that one, so one handler serves an array as 'pick' `
	+ `does (${JSON.stringify(second)})`);

// ---- a symbol that is not a browser element ------------------------------------------------------
// A plain `variable` is not a browser element, and `pick` and `wheel` both refuse one. A hover must too, or the
// event would register on something that has no element to attach a listener to.
const notDom = quiet(() => compile(NOTDOM));
check(!notDom.ok,
	`'on hover Counter' on a plain \`variable\` is refused rather than registered on nothing `
	+ `(${notDom.error}; the compiler said ${JSON.stringify(notDom.noise)})`);

// ---- the four packs, and the word each one chose --------------------------------------------------
// **The word matters, and it is checked rather than assumed.** The project has paid for a collision once: the
// first German word for `join` was already the German `connect`, so the reverse map sent the compiler looking
// for a handler that does not exist — and JavaScript accepted the word while Python refused it. So for each
// candidate, `reverseWord` of the form must answer `hover` and nothing else.
const form = { en: `hover`, fr: `survole`, it: `sorvola`, de: `schwebe` };
for (const lang of [`en`, `fr`, `it`, `de`]) {
	const pack = packOf[lang];
	const opcode = pack.opcodes.ON_HOVER;
	const spellings = Object.keys(pack.words).filter(c => String(pack.words[c]).split(`|`).includes(form[lang]));
	AllSpeak_Language.init(pack);
	const answers = AllSpeak_Language.reverseWord(form[lang]);
	check(opcode !== undefined && answers === `hover` && spellings.length === 1,
		`${lang}: '${form[lang]}' reverse-maps to '${answers}' and is a form of ${spellings.length} canonical `
		+ `word(s); ON_HOVER carries the pattern '${opcode ? opcode.patterns[0] : `MISSING`}'`);
}
AllSpeak_Language.init(AllSpeak_LanguagePack_en);

// A second language's script, compiled and fired, so the word is exercised and not merely present: `sur
// survole Hote` has to reach the same command and the same reading. Every keyword in it is the French pack's
// own spelling — `crée` for create, `mets … dans` for put … into, `journalise` for log — because a script that
// sprinkled English keywords through would be compiling the English words with a French word for `hover`, which
// is exactly the mismatch this asserts is absent.
const french = compile([
	`    language français`,
	`    script SurvolFr`,
	`    variable Vu`,
	`    variable Pos`,
	`    div Hote`,
	`Principal:`,
	`    crée Hote`,
	`    sur survole Hote`,
	`    début`,
	`        mets le survole position dans Pos`,
	`        mets propriété \`x\` de Pos dans Vu`,
	`        journalise \`x=\` cat Vu`,
	`    fin`,
	`    arrête`,
]);
const frenchCommand = french.find(c => c.action === `hover`);
const frenchHost = elementOf(french, `Hote`);
const frenchFired = witness(() => frenchHost && frenchHost.fire(`mousemove`, { clientX: 7, clientY: 8 }));
check(frenchCommand !== undefined && frenchCommand.opcode === `ON_HOVER` && frenchFired.join(`|`) === `x=7`,
	`and a French script's 'sur survole' reaches the same command and the same reading `
	+ `(${frenchCommand ? frenchCommand.opcode : `no command`}, ${JSON.stringify(frenchFired)})`);

// ---- the sixth event: `on right click` ------------------------------------------------------------
// **Where the fault was.** The word was two tokens and the opcode was `rightClick`, so the statement was
// refused whole — and the first thing asserted is therefore that it now reaches a command of its own.
const right = compile(RIGHTCLICK);
const rightCommand = right.find(c => c.action === `rightClick`);
check(rightCommand !== undefined && rightCommand.symbol === `Host`,
	`'on right click Host' compiles to an \`on\` command carrying the attached symbol `
	+ `(${rightCommand ? rightCommand.symbol : `no such command`})`);
check(rightCommand !== undefined && rightCommand.opcode === `ON_RIGHT_CLICK`,
	`and it resolves to an opcode of its own rather than falling through to dispatch by keyword `
	+ `(opcode ${rightCommand && rightCommand.opcode})`);

const rightHost = elementOf(right, `Host`);
check(rightHost !== null && typeof rightHost.oncontextmenu === `function`,
	`the handler is attached as \`contextmenu\`, the event the browser itself asks about for the right `
	+ `button (${rightHost ? typeof rightHost.oncontextmenu : `no element found`})`);
check(rightHost !== null && Object.keys(rightHost.listeners).length === 0,
	`and as nothing else: a right-click is one event rather than a stream, so there is no leave to attach `
	+ `(${rightHost ? Object.keys(rightHost.listeners).length : `no element found`} listener kind(s))`);

let prevented = 0;
const context = witness(() => rightHost && rightHost.fire(`contextmenu`,
	{ clientX: 210, clientY: 96, preventDefault: () => { prevented++; } }));
check(context.join(`|`) === `x=210|y=96`,
	`a dispatched \`contextmenu\` runs the handler, and \`the pick position\` reads the event's own `
	+ `coordinates (${JSON.stringify(context)})`);
check(prevented === 1,
	`and the browser's own menu is cancelled, or the reader would be shown two at once `
	+ `(preventDefault called ${prevented} time(s))`);

// The words, one language at a time, and **two of the four are two tokens** — which is the whole of what was
// wrong. So the form is resolved through `phraseWord` (the multi-token reading) as well as `reverseWord`, and
// English and French are the cases that prove the reading has to span more than one token.
const rightForm = { en: `right click`, fr: `clic droit`, it: `clic destro`, de: `Rechtsklick` };
for (const lang of [`en`, `fr`, `it`, `de`]) {
	const pack = packOf[lang];
	const opcode = pack.opcodes.ON_RIGHT_CLICK;
	AllSpeak_Language.init(pack);
	const tokens = rightForm[lang].split(` `).map(token => ({ token }));
	const phrase = AllSpeak_Language.phraseWord(tokens, 0);
	const answered = phrase ? phrase.canonical : AllSpeak_Language.reverseWord(tokens[0].token);
	check(opcode !== undefined && answered === `rightClick`,
		`${lang}: '${rightForm[lang]}' resolves to '${answered}' across ${tokens.length} token(s); `
		+ `ON_RIGHT_CLICK carries the pattern '${opcode ? opcode.patterns[0] : `MISSING`}'`);
}
AllSpeak_Language.init(AllSpeak_LanguagePack_en);

// And a French script's `sur clic droit` reaching the same command and the same reading — the multi-token form
// exercised end to end, not merely resolved. **Every word in it is the French pack's own spelling** — `choisi`
// for pick, `propriété` for property, `journalise` for log — the discipline the hover fixture above states, and
// worth restating here because `the pick position` happens to *also* compile under French: the reading's cases
// are the English canonicals, so `reverseWord` of the English word returns it unchanged. A fixture written that
// way would be asserting nothing about the French vocabulary at all.
const frenchRight = compile([
	`    language français`,
	`    script ClicDroitFr`,
	`    variable Vu`,
	`    variable Pos`,
	`    div Hote`,
	`Principal:`,
	`    crée Hote`,
	`    sur clic droit Hote`,
	`    début`,
	`        mets le choisi position dans Pos`,
	`        mets propriété \`x\` de Pos dans Vu`,
	`        journalise \`x=\` cat Vu`,
	`    fin`,
	`    arrête`,
]);
const frenchRightCommand = frenchRight.find(c => c.action === `rightClick`);
const frenchRightHost = elementOf(frenchRight, `Hote`);
const frenchRightFired = witness(() => frenchRightHost &&
	frenchRightHost.fire(`contextmenu`, { clientX: 33, clientY: 44, preventDefault: () => {} }));
check(frenchRightCommand !== undefined && frenchRightCommand.opcode === `ON_RIGHT_CLICK`
	&& frenchRightFired.join(`|`) === `x=33`,
	`and a French script's 'sur clic droit' reaches the same command and the same reading `
	+ `(${frenchRightCommand ? frenchRightCommand.opcode : `no command`}, ${JSON.stringify(frenchRightFired)})`);

// ---- a right-click is not a pick ------------------------------------------------------------------
// **The half of this that was already in the runtime, and the reason it matters.** `onmousedown` never asked
// which button, so a right-click ran the pick handler — moving a pane's selection at the exact moment the
// reader was asking for a menu. The guard is one line, and the witness below is a side effect only a real pick
// produces, because the pick handler's body runs from a `setTimeout` and would not have run yet.
const pick = compile(PICK);
const pickHost = elementOf(pick, `Host`);
const press = button => ({ button, stopPropagation: () => {}, target: pickHost,
	clientX: 5, clientY: 6, offsetX: 1, offsetY: 2 });
check(pickHost !== null && typeof pickHost.onmousedown === `function`,
	`an 'on pick' element carries its press on \`onmousedown\` (${pickHost ? typeof pickHost.onmousedown : `no element found`})`);
delete document.onmousemove;
if (pickHost) pickHost.fire(`mousedown`, press(2));
check(document.onmousemove === undefined,
	`a \`button: 2\` press does not run the pick handler, so asking for a menu no longer moves the selection `
	+ `(the drag listener a pick installs is ${document.onmousemove === undefined ? `absent` : `present`})`);
if (pickHost) pickHost.fire(`mousedown`, press(0));
check(typeof document.onmousemove === `function`,
	`and a \`button: 0\` press still does, which is the half that must not have been lost `
	+ `(the drag listener is ${typeof document.onmousemove})`);

// ---- one host, said out loud ---------------------------------------------------------------------
// Not a skipped assertion: there is nothing on the other side to assert. The Python runtime has no pointer
// event at all, so the Python packs carry the word for parity and no behaviour goes with it.
console.log(`  ..    nothing is asserted of the Python runtime: it has no pointer event to hover with, so the `
	+ `word in its packs is parity and no behaviour (the shape of note tools/capture-check.js makes)`);
console.log(`  ..    packs loaded: en, ${packs.filter(p => p !== `en`).join(`, `)}`);

console.log(failures === 0
	? `\nhover-check: all checks passed`
	: `\nhover-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
