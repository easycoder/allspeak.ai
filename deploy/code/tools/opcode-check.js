#!/usr/bin/env node
//
// Does every command carry its own opcode — in the resolver, in the browser's dispatch map, in the packs and in
// the canonical table — and does the table name exactly what the resolver can return?
//
// **Why this exists.** `wheel` was declared in all four language packs and missing from `Opcodes.js`'s `on`
// group and from `Browser.js`'s opcode map. It ran perfectly: the map sends every `ON_*` opcode to the same
// `On` handler, and that handler dispatches on the command's action, so the missing case cost nothing a script
// could see. What it cost was the *opcode* — the thing tools print and a reader trusts — which came out as
// `ON_CLICK`, because that is what the group's `default` returns for an action it has no case for. Nothing in
// the 323-script sweep registers an event, so no check in the tree could see the difference, and that is the
// shape of fault this file is for.
//
// **And the same shape one level out.** `spec/opcodes.json` turned out to be **eleven opcodes behind** the
// resolver — twelve, said the work order, and one of those was already there — plus one entry (`MQTT_INIT`)
// naming an opcode the resolver had renamed. So the file has two sections now: the events, asked of the packs
// because each one is a word a pack declares; and every opcode the resolver can return, asked of the resolver
// because ten of them are syntax no pack names. See the second section for what each instrument is worth.
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
		+ ` runtime sources and asks the opcode resolver about every opcode it returns, so it needs a checkout of`
		+ ` the AllSpeak repository rather than a starter pack.\n`);
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

// ---- every opcode the resolver can return, against the canonical table ---------------------------------------
// **Why this is a second instrument rather than more of the loop above.** An event can be asked of the *packs*,
// because each one is a word a pack declares. Ten of the resolver's returns cannot be: `ATTR`, `BEGIN`,
// `CHECK`, `END`, `END_TEST`, `GOTO_TEST_END`, `NO_CACHE`, `SCRIPT`, `TEST` and `TEST_ERROR` have no pack entry
// at all — they are the block syntax and the declarations a script writes rather than words a pack names — so a
// list taken from the packs could never be complete, and this section is built from the resolver's own text.
//
// **Its two halves are different instruments, and the weaker one is said out loud.** The *opcodes* are the
// literals in `Opcodes.js`'s own `return` statements: a text scan, which is weaker than the behaviour every
// other assertion in this file rests on. The *inputs* are lifted from the same text, and each one is then
// **asked of the resolver** — so a pairing rests on the resolver's answer and not on the shape of a regex. What
// the scan cannot do is invent an input for a return it cannot read; that shows up below as an opcode the
// resolver answers nothing for, and a return added without a table entry shows up as a literal the table has
// not got. Neither is silent, and both fail rather than report.
const resolverReturns = () => {
	const source = fs.readFileSync(path.join(root, `js/allspeak/Opcodes.js`), `utf8`).split(`\n`);
	const domainOf = { resolveCore: `core`, resolveBrowser: `browser`, resolveJson: `json`,
		resolveRest: `rest`, resolveMqtt: `mqtt` };
	const literalPattern = /`([A-Z][A-Z0-9_]*)`/g;
	const literalsOf = text => [...text.matchAll(literalPattern)].map(m => m[1]);
	// A group either switches on `keyword` or it does not, and that decides what a 2-tab arm means. `resolveCore`
	// and `resolveBrowser` and `resolveMqtt` open with `switch (keyword)`, so a 2-tab arm is a keyword.
	// `resolveJson` and `resolveRest` open with `switch (command.request)` and have no keyword switch at all:
	// their keyword is the domain's own (`json`, `rest`) and every 2-tab arm is a *sub-value*. Read from the
	// group's own text, which is the only place it is said.
	const keywordSwitches = {};
	for (const name of Object.keys(domainOf)) {
		let inside = false;
		for (const line of source) {
			if (new RegExp(`^\\t${name}\\s*:\\s*function`).test(line)) { inside = true; continue; }
			if (inside && /^\t\},?\s*$/.test(line)) break;
			if (inside && /switch\s*\(\s*keyword\s*\)/.test(line)) { keywordSwitches[name] = true; break; }
		}
	}
	// The one return answered before any arm: `DECLARE_ELEMENT` is decided by the pack's keyword index rather
	// than by a keyword of its own, so the input it answers for is an element type the pack declares.
	const elementWord = Object.keys(AllSpeak_LanguagePack_en.opcodes.DECLARE_ELEMENT.elementTypes)[0];
	const found = new Set();
	const candidates = [];
	const opened = [];
	let group = null, arm = null, depth = 0, groupDepth = 0;
	for (let i = 0; i < source.length; i++) {
		const line = source[i];
		const fn = line.match(/^\t(resolve\w+)\s*:\s*function/);
		if (fn) { group = fn[1]; groupDepth = depth; arm = null; opened.length = 0; }
		const sw = line.match(/switch\s*\(\s*command\.(\w+)\s*\)/);
		if (sw) opened.push(sw[1]);
		const armCase = line.match(/^\t\tcase\s+`([^`]+)`\s*:/);
		const subCase = line.match(/^\t\t\tcase\s+`([^`]+)`\s*:/);
		const subDefault = /^\t\t\tdefault\s*:/.test(line);
		const keywordArms = keywordSwitches[group] === true;
		if (armCase && keywordArms) arm = armCase[1];
		// `\u0000none` is a value no arm names, so an arm reached by `default` is asked for with an input that
		// falls through to it. Seven of the resolver's returns are answered that way (`ON_CALLBACK`,
		// `DEBUG_PROGRAM`, `SET_BOOLEAN`, `REMOVE_ELEMENT`, `GET_STORAGE`, `HISTORY_PUSH`, `MQTT_ON_MESSAGE`).
		let subValue = null;
		if (keywordArms) {
			if (subCase) subValue = subCase[1];
			else if (subDefault) subValue = `\u0000none`;
		} else if (armCase) subValue = armCase[1];
		else if (/^\t\tdefault\s*:/.test(line)) subValue = `\u0000none`;
		const statement = line.match(/return\s+(.*);?\s*$/);
		if (statement) {
			const expression = statement[1];
			const opcodes = literalsOf(expression);
			for (const opcode of opcodes) found.add(opcode);
			// A group with no keyword switch carries the domain name as its keyword; a group with one that has
			// not reached an arm yet takes an element type the pack declares.
			const keyword = keywordArms ? (arm === null ? elementWord : arm) : domainOf[group];
			const subField = opened.length ? opened[opened.length - 1] : `request`;
			const base = Object.assign({ domain: domainOf[group], keyword },
				(keywordArms ? opened.length > 0 : true) ? { [subField]: subValue } : {});
			// A ternary is two returns in one statement, and each arm needs the field set so that arm is taken.
			const ternary = expression.match(/command\.(\w+)\s*===\s*`([^`]*)`\s*\?\s*`([A-Z_]+)`\s*:\s*`([A-Z_]+)`/)
				|| expression.match(/command\.(\w+)\s*\?\s*`([A-Z_]+)`\s*:\s*`([A-Z_]+)`/);
			if (ternary) {
				const field = ternary[1];
				const yes = ternary.length === 5 ? ternary[3] : ternary[2];
				const no = ternary.length === 5 ? ternary[4] : ternary[3];
				const condition = ternary.length === 5 ? ternary[2] : true;
				candidates.push({ command: Object.assign({}, base, { [field]: condition }), opcode: yes, lino: i + 1 });
				candidates.push({ command: Object.assign({}, base, { [field]: null }), opcode: no, lino: i + 1 });
			} else if (opcodes.length) {
				candidates.push({ command: base, opcode: opcodes[0], lino: i + 1 });
			}
		}
		depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
		if (group && depth <= groupDepth && /^\t\},?\s*$/.test(line)) {
			group = null; opened.length = 0; arm = null;
		}
	}
	const answered = new Map();
	const unmatched = [];
	for (const candidate of candidates) {
		const got = AllSpeak_Opcodes.resolve(candidate.command);
		if (got === candidate.opcode) answered.set(got, candidate);
		else unmatched.push(`Opcodes.js:${candidate.lino} ${JSON.stringify(candidate.command)}`
			+ ` -> ${got}, not ${candidate.opcode}`);
	}
	return { literals: found, answered,
		unanswered: [...found].filter(o => !answered.has(o)).sort(), unmatched, candidates };
};

const resolver = resolverReturns();
check(resolver.candidates.length > 0,
	`the resolver's own text yields inputs to ask it about (${resolver.candidates.length} candidate(s)`
	+ ` over ${resolver.answered.size} opcode(s))`);
check(resolver.unmatched.length === 0,
	`every return in the resolver is what the resolver answers for the input beside it`
	+ ` (${resolver.unmatched.length ? resolver.unmatched.slice(0, 3).join(`; `) : `no mismatch`})`);
check(resolver.unanswered.length === 0,
	`and every opcode a return names is one the resolver actually answers`
	+ ` (${resolver.unanswered.length ? `unanswered: ${resolver.unanswered.join(`, `)}` : `none unanswered`})`);
const tableKeys = new Set(Object.keys(spec));
const missedByTable = [...resolver.literals].filter(o => !tableKeys.has(o)).sort();
const notReturned = [...tableKeys].filter(o => !resolver.literals.has(o)).sort();
check(missedByTable.length === 0,
	`\`spec/opcodes.json\` has an entry for every opcode the resolver can return`
	+ ` (${resolver.literals.size} returned, ${missedByTable.length} missing`
	+ `${missedByTable.length ? `: ${missedByTable.join(`, `)}` : ``})`);
check(notReturned.length === 0,
	`and lists nothing the resolver cannot return — such an entry names an opcode no command carries`
	+ ` (${notReturned.length ? `stale: ${notReturned.join(`, `)}` : `none stale`})`);
console.log(`  ..    those opcodes are the *literals* of Opcodes.js's returns, lifted by a text scan — the`
	+ ` weaker instrument; each one's input is then asked of the resolver, which is what the pairing rests on`);

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
