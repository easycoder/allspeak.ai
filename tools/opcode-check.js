#!/usr/bin/env node
//
// Does every event carry its own opcode — in the resolver, in the browser's dispatch map, in the packs and in
// the canonical table?
//
// **Why this exists.** `wheel` was declared in all four language packs and missing from `Opcodes.js`'s `on`
// group and from `Browser.js`'s opcode map. It ran perfectly: the map sends every `ON_*` opcode to the same
// `On` handler, and that handler dispatches on the command's action, so the missing case cost nothing a script
// could see. What it cost was the *opcode* — the thing tools print and a reader trusts — which came out as
// `ON_CLICK`, because that is what the group's `default` returns for an action it has no case for. Nothing in
// the 323-script sweep registers an event, so no check in the tree could see the difference, and that is the
// shape of fault this file is for.
//
// **The trap, asserted rather than described.** The `default` above is why a missing case is silent here, and
// it is asserted as the instrument's own premise below — an event the resolver does not know must come back as
// `ON_CLICK` and not as `null`. A resolver that refused would fail loudly and need no check like this one; this
// resolver mislabels, so each event has to be asked for its *own* opcode by name.
//
// **One host, and the other cannot be asked.** The Python runtime has no pointer events and no resolver of
// this kind, so the pack parity is all there is on that side — the same sentence `tools/hover-check.js` says,
// and the same shape of note `tools/capture-check.js` makes.
//
// Usage:  node tools/opcode-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles the runtime from source, so it needs a checkout rather than a starter pack — the same sentence
// the other checks say, for the same reason: the packs are clients of the CDN and carry no `js/`.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`opcode-check: no js/allspeak beside this script. This check compiles an event on the`
		+ ` runtime sources, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
	process.exit(2);
}

let failures = 0;
let skips = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};

// ---- the stub the runtime needs to load, and nothing more ---------------------------------------------------
// Nothing here is fired: this check reads what the compiler *stamped*, so the elements are as inert as the
// other harnesses' and the listener that gets attached is never called.
const noop = () => {};
const mk = tag => ({
	tagName: tag, style: {}, children: [], attributes: {},
	appendChild(c) { this.children.push(c); return c; },
	removeChild() {},
	setAttribute(k, v) { this.attributes[k] = v; },
	getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
	getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
	classList: { add: noop, remove: noop, contains: () => false },
	addEventListener: noop, removeEventListener: noop,
});
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
global.alert = m => process.stderr.write(`alert: ${m}\n`);
global.document = {
	getElementById: () => null,
	querySelector: () => null,
	createElement: mk, createElementNS: (ns, tag) => mk(tag),
	addEventListener: noop, body: mk(`body`), head: mk(`head`),
};

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
vm.runInThisContext(`globalThis.__opcode = { AllSpeak, AllSpeak_Browser, AllSpeak_Language,`
	+ ` AllSpeak_Opcodes, AllSpeak_LanguagePack_en };`);
const { AllSpeak, AllSpeak_Browser, AllSpeak_Language, AllSpeak_Opcodes, AllSpeak_LanguagePack_en } =
	globalThis.__opcode;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};

const specPath = path.join(root, `spec/opcodes.json`);
const spec = JSON.parse(fs.readFileSync(specPath, `utf8`)).opcodes;

// ---- the premise, asserted before anything is concluded from it ---------------------------------------------
const known = AllSpeak_Opcodes.resolve({ domain: `browser`, keyword: `on`, action: `click` });
const unknown = AllSpeak_Opcodes.resolve({ domain: `browser`, keyword: `on`, action: `no-such-event` });
check(known === `ON_CLICK`,
	`the resolver answers for an event it knows (on click -> ${known}) — the instrument can see a resolved`
	+ ` opcode at all`);
check(unknown === `ON_CLICK`,
	`and it answers \`ON_CLICK\` for one it does not (a missing case is not refused — it is *mislabelled*,`
	+ ` which is why every event below is asked for its own opcode by name rather than trusted to resolve)`);

// ---- the events, and what each must carry ---------------------------------------------------------------
// **The list under test comes from the *packs*, not from the dispatch map — and that is deliberate.** A list
// taken from the map cannot catch an event the map has dropped, which is one of the two ways `wheel` was
// wrong (declared by all four packs, absent from the map): the loop would simply never ask about it. Taking
// the list from the pack is what gives the map assertion below its teeth. Measured, by reverting each half
// in turn: with the resolver's case removed this check fails on `ON_CLICK, not ON_WHEEL`, and with the map
// entry removed it fails on the missing entry — and before this line was written, the second of those two
// passed on the fault.
const map = AllSpeak_Browser.getOpcodeMap();
const events = Object.keys(AllSpeak_LanguagePack_en.opcodes)
	.filter(k => k.indexOf(`ON_`) === 0).sort();
check(events.length > 0, `the English pack declares events to check (${events.length}: `
	+ `${events.join(`, `)})`);

// The source line for an event comes from the pack's own pattern, so the wording tested is the wording
// published — a placeholder filled with the name the script declares, and the declaration that name needs.
// (A callback's name is not a label: `On.compile` accepts a symbol declared `callback`, which is what the
// refusal `I don't understand 'on'` meant when this check first compiled `on Main`.) A `|` is a choice, so
// the first alternative is the one compiled.
const scriptFor = (name, line) => {
	const wantsElement = line.indexOf(`{element}`) >= 0;
	const wantsCallback = line.indexOf(`{callback}`) >= 0;
	const source = sourceOf(line);
	return [
		`script Opcode${name}`,
		...(wantsElement ? [`input Host`] : []),
		...(wantsCallback ? [`callback Done`] : []),
		`Main:`,
		...(wantsElement ? [`    create Host`] : []),
		`    ${source}`,
		`    begin`,
		`        log \`x\``,
		`    end`,
		`    stop`,
	];
};
// The compiler writes `No handler found` to the debug console as it refuses a token, and *then* throws, so the
// noise is collected rather than printed above the report. The pack is saved and restored around the compile,
// because a script's `language` directive switches it while compiling and a failed compile leaves it switched
// just as surely — the guard `tools/asviz-run.js` and `tools/hover-check.js` both carry.
const compile = lines => {
	const saved = AllSpeak_Language.pack;
	const noise = [];
	const stdout = console.log;
	console.log = (...args) => { noise.push(args.join(` `)); };
	try {
		const source = AllSpeak.tokeniseFile(lines.join(`\n`).split(`\n`));
		const program = AllSpeak.compileScript(source, null, null, null);
		return { program, error: null, noise };
	} catch (err) {
		return { program: null, error: String(err.message).split(`\n`)[0], noise };
	} finally {
		console.log = stdout;
		AllSpeak_Language.init(saved);
	}
};

// The same substitution `scriptFor` makes, defined once so that a caption cannot describe a script other
// than the one compiled — the first version of this file printed `on Main` beside a compilation of `on Done`.
const sourceOf = line => line.replace(`{element}`, `Host`).replace(`{callback}`, `Done`).split(`|`)[0];
for (const name of events) {
	const entry = AllSpeak_LanguagePack_en.opcodes[name];
	const pattern = entry && entry.patterns && entry.patterns[0];
	if (!pattern) {
		skips++;
		console.log(`  SKIP  ${name}: the English pack publishes no pattern to compile`);
		continue;
	}
	const source = sourceOf(pattern);
	const compiled = compile(scriptFor(name, pattern));
	const command = compiled.program && compiled.program.find(c => c && c.keyword === `on`);
	if (!command) {
		skips++;
		console.log(`  SKIP  ${name}: '${source}' did not compile`
			+ ` (${compiled.error}; the compiler said ${JSON.stringify(compiled.noise.slice(0, 2))})`);
		continue;
	}
	// **The fault this file exists for**: a wheel carried `ON_CLICK` until 2026-10-07.
	check(command.opcode === name,
		`'${source}' carries its own opcode (${command.opcode}`
		+ `${command.opcode === name ? `` : `, not ${name}`})`);
	// A core event — `on message`, `on close`, `on error`, a named callback — has no browser dispatch to enter,
	// so its opcode is the whole of what it must carry.
	if (command.domain !== `browser`) {
		console.log(`  ..    ${name} is a \`${command.domain}\` event: its opcode is checked, and there is no`
			+ ` browser dispatch to enter`);
		continue;
	}
	check(map[name] === AllSpeak_Browser.On,
		`and ${name} has an entry in the dispatch map, pointing at the shared \`On\` handler`);
	const specEntry = spec[name];
	check(specEntry !== undefined && specEntry.current.action === command.action,
		`and \`spec/opcodes.json\` lists it with the action the compiler gave it`
		+ ` (${specEntry ? `${specEntry.current.action} vs ${command.action}` : `no ${name} entry`})`);
}

// ---- what the packs say, against what the runtime has --------------------------------------------------------
// Asked through the language layer rather than by reading the pack file: the index the resolver itself consults
// — the one built when a pack is loaded — is what must name every event.
const declared = AllSpeak_Language.getOpcodesForKeyword(`on`);
const undeclared = events.filter(name => declared.indexOf(name) < 0);
check(undeclared.length === 0,
	`the language layer's own index names every event the pack declares (${declared.length} names in the`
	+ ` index; ${undeclared.length ? `missing: ${undeclared.join(`, `)}` : `none missing`})`);

// The other direction, and the one the loop above cannot make: an opcode in the dispatch map that no pack
// declares is unreachable from a script, and walking the packs would never ask about it.
const unpacked = Object.keys(map).filter(k => k.indexOf(`ON_`) === 0).filter(k => events.indexOf(k) < 0);
check(unpacked.length === 0,
	`every opcode in the dispatch map is one the packs declare too`
	+ ` (${unpacked.length ? `unpacked: ${unpacked.join(`, `)}` : `none unpacked`})`);

// A skip is not a pass. If a pattern stops compiling the assertions above stop running, and this says so
// rather than letting the report stand on checks that never happened.
check(skips === 0, `nothing was skipped for want of a script that compiles (${skips} skipped)`);

// ---- one host, said out loud ----------------------------------------------------------------------------------
// Not a skipped assertion: there is nothing on the other side to assert. The Python runtime has no pointer
// events and no opcode resolver, so the word in its packs is parity and no behaviour goes with it.
console.log(`  ..    nothing is asserted of the Python runtime: it has no pointer event and no opcode`
	+ ` resolver, so its packs' entries are parity and no behaviour (the shape of note`
	+ ` tools/capture-check.js makes)`);
console.log(`  ..    packs loaded: en, ${packs.filter(p => p !== `en`).join(`, `)}`);

console.log(failures === 0
	? `\nopcode-check: all checks passed`
	: `\nopcode-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
