#!/usr/bin/env node
//
// Do attributes reach the compiled program, and does adding them change nothing else?
//
// **Why this exists.** An attribute's whole promise is that it is *carried* and *ignored*, and those two
// halves fail in ways that are invisible to each other. An attribute that never reaches the program still
// runs perfectly — the script behaves, so nothing looks wrong until a tool finds nothing to read. An
// attribute that reaches the program through the grammar rather than the tokeniser still compiles the
// examples it was written for, and then breaks on the first keyword whose condition parser swallows the
// `@`-tail as part of its expression. Neither shows up in a run, and only one of them shows up in a shape.
//
// So this asks both, and the two fixtures are written out **separately** rather than one being derived from
// the other: a check that strips the attributes out of the attributed source to make its control would be
// testing the stripper it shares with the feature, and would agree with the feature about anything the two
// of them got wrong together.
//
// It needs a checkout — it loads `js/allspeak` in the bundle's order, as `tools/asviz-run.js` does — so it
// says that plainly rather than failing on a missing file. A starter pack is a client of the CDN and
// carries no `js/`.
//
// Usage:  node tools/attr-check.js
//
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, `..`);
for (const needed of [`js/allspeak`, `allspeak-py/allspeak`]) {
	if (!fs.existsSync(path.join(root, needed))) {
		process.stderr.write(`attr-check: no ${needed} beside this script. This check compiles both`
			+ ` runtimes itself, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
		process.exit(2);
	}
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};
const note = text => console.log(`  ..    ${text}`);

// ---- the runtime, loaded the way a page loads it ----------------------------------------

const noop = () => {};
// In a browser, `window` *is* the global object, and the language pack is declared with a
// top-level `var` that only a property of `window` can be found through.
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

// Bundle order from ./build-allspeak, minus AllSpeak.js, which is the browser startup hook.
// Compiling this way rather than through `deploy/dist/allspeak.js` is deliberate: the check
// should fail on the source it is about, not on a bundle somebody forgot to rebuild.
const RUNTIME = [
	`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`,
	`Language.js`, `LanguagePack_en.js`, `Compile.js`, `Main.js`
];
for (const file of RUNTIME) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
}
vm.runInThisContext(`globalThis.__attrCheck = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en } = globalThis.__attrCheck;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);

// ---- the two fixtures ----------------------------------------------------------------------

// Every spelling the syntax has, on one page: an attribute on a line of its own, one on a
// statement, one on a label, one whose text holds a second `@`, one on a line whose literal
// holds an `@`, and one with a `!` comment after it.
const ATTRIBUTED = [
	`@this file parses chemical weights`,
	`@the \`@\` sigil is the whole statement ! with a comment after it`,
	``,
	`variable Total  @running total`,
	`variable N`,
	``,
	`Main: @the entry point, in full`,
	`    put 0 into Total`,
	`    while Total is less than 3 @show Total, N`,
	`    begin`,
	`        add 1 to Total`,
	`        log Total   ! the running total`,
	`    end`,
	`    gosub to Report`,
	`    log Total @show Total ! the comment ends the attribute`,
	`    stop`,
	``,
	`Report: @where the total is reported`,
	`    log \`done @ last\``,
	`    return`,
].join(`\n`);

// The same script with no attributes on it — the same lines, in the same places, so a
// difference between the two programs is a difference the attributes made.
const PLAIN = [
	`! this file parses chemical weights`,
	`! the sigil is the whole statement, with a comment after it`,
	``,
	`variable Total  ! running total`,
	`variable N`,
	``,
	`Main:`,
	`    put 0 into Total`,
	`    while Total is less than 3`,
	`    begin`,
	`        add 1 to Total`,
	`        log Total   ! the running total`,
	`    end`,
	`    gosub to Report`,
	`    log Total`,
	`    stop`,
	``,
	`Report:`,
	`    log \`done @ last\``,
	`    return`,
].join(`\n`);

// ---- compiling them, and running them ------------------------------------------------------

const compile = (source) => {
	const lines = source.split(`\n`);
	const tokenised = AllSpeak.tokeniseFile(lines);
	return { source, tokens: tokenised.tokens, program: AllSpeak.compileScript(tokenised, [], null, null) };
};

const LOG_RE = /->(.*)$/;
let reported = [];
const run = (source) => {
	reported = [];
	const saved = AllSpeak.writeToDebugConsole;
	AllSpeak.writeToDebugConsole = (msg) => reported.push(msg);
	AllSpeak.scripts = {};
	AllSpeak.scriptIndex = 0;
	// `start` refuses a second pass over the same process: without this, the second run is
	// silently no run at all, and "the two outputs match" would be two empty lists agreeing.
	AllSpeak.tokenising = false;
	try {
		AllSpeak.start(source);
	} finally {
		AllSpeak.writeToDebugConsole = saved;
	}
	return reported.map(line => {
		const m = LOG_RE.exec(line);
		return m ? m[1] : null;
	}).filter(v => v !== null);
};

const attributed = compile(ATTRIBUTED);
const plain = compile(PLAIN);

// ---- what the tokeniser did with the `@` ---------------------------------------------------

const sigils = attributed.tokens.filter(t => t.token === `@`);
check(sigils.length === 2 && sigils[0].lino === 1 && sigils[1].lino === 2,
	`one \`@\` token per attribute-only line, and no more: ${JSON.stringify(sigils.map(t => [t.lino, t.attr]))}`);
const strayed = attributed.tokens.filter(t => t.attr !== undefined && t.token !== `@`);
check(JSON.stringify(strayed.map(t => [t.lino, t.token, t.attr])) === JSON.stringify([
	[4, `variable`, `running total`],
	[7, `Main:`, `the entry point, in full`],
	[9, `while`, `show Total, N`],
	[15, `log`, `show Total`],
	[18, `Report:`, `where the total is reported`],
]), `every other attribute is on the first token of its own line: ${JSON.stringify(strayed.map(t => [t.lino, t.token, t.attr]))}`);
// That the literal keeps its `@` is the point: the tokeniser is inside a literal when it
// reaches it, so it cannot be the start of an attribute. Two sigils and one literal, and
// nothing else on the page holds an `@` at all.
check(JSON.stringify(attributed.tokens.filter(t => t.token.indexOf(`@`) >= 0).map(t => t.token))
	=== JSON.stringify([`@`, `@`, `\`done @ last\``]),
	`an \`@\` inside a backtick literal stays in the token: ${JSON.stringify(attributed.tokens.filter(t => t.token.indexOf(`@`) >= 0).map(t => t.token))}`);
check(attributed.tokens.every(t => !/(show|running|entry point|reported)$/.test(t.token)),
	`no attribute text is left in the token stream as a token`);

// ---- where the attributes landed -------------------------------------------------------------

const withAttr = [];
for (let pc = 0; pc < attributed.program.length; pc++) {
	if (typeof attributed.program[pc].attr === `string`) withAttr.push(attributed.program[pc]);
}
const shape = withAttr.map(c => `${c.lino}:${c.opcode || c.keyword}=${c.attr}`);
console.log(`  ..    entries carrying an attribute:`);
for (const s of shape) console.log(`          ${s}`);

check(withAttr.length === 7, `seven entries carry one: ${withAttr.length}`);
check(attributed.program.filter(c => c.keyword === `attr`).length === 4,
	`four of them are entries of their own (two attribute-only lines, and the two labels)`);
check(shape[0] === `1:ATTR=this file parses chemical weights`,
	`the first is an attribute-only line, as a marker: ${shape[0]}`);
check(shape[1] === `2:ATTR=the \`@\` sigil is the whole statement`,
	`the second proves a second \`@\` is text and a \`!\` comment ends the run: ${shape[1]}`);
const entry = (opcode, lino) => shape.find(s => s.startsWith(`${lino}:${opcode}=`));
check(entry(`DECLARE_VARIABLE`, 4) === `4:DECLARE_VARIABLE=running total`,
	`a statement's attribute is on the command the runtime arrives at for it: ${entry(`DECLARE_VARIABLE`, 4)}`);
check(entry(`WHILE`, 9) === `9:WHILE=show Total, N`,
	`including a \`while\`, whose condition parser never saw the \`@\`: ${entry(`WHILE`, 9)}`);
check(entry(`LOG`, 15) === `15:LOG=show Total`,
	`and a trailing \`!\` comment is not part of the text: ${entry(`LOG`, 15)}`);

// The two halves of a label: it is a symbol, and the entry it addresses carries its attribute.
const labelEntry = (program, name) => program[program.symbols[name].pc];
check(labelEntry(attributed.program, `Main`).attr === `the entry point, in full` &&
	labelEntry(attributed.program, `Main`).keyword === `attr`,
	`a label's attribute is at the pc the label addresses, so following the label finds it`);
check(labelEntry(attributed.program, `Report`).attr === `where the total is reported`,
	`and the same for the second label`);

// ---- and nothing else followed it -----------------------------------------------------------------

check(plain.program.filter(c => c.keyword === `attr`).length === 0 &&
	plain.program.every(c => c.attr === undefined),
	`the attribute-free twin compiles with no attribute entry and no \`attr\` field anywhere`);

const outline = program => program
	.filter(c => c.keyword !== `attr`)
	.map(c => `${c.lino}:${c.opcode || c.keyword}`)
	.join(` `);
check(outline(attributed.program) === outline(plain.program),
	`the two compile to the same statements, on the same lines, in the same order`);
if (outline(attributed.program) !== outline(plain.program)) {
	note(`attributed: ${outline(attributed.program)}`);
	note(`plain:      ${outline(plain.program)}`);
}

const outA = run(ATTRIBUTED);
const outP = run(PLAIN);
check(outA.length > 0 && JSON.stringify(outA) === JSON.stringify(outP),
	`and they do the same thing when run: ${JSON.stringify(outA)}`);
if (outA.length === 0) note(`no output at all — the fixture, or the harness, is not running`);

// ---- and the marker is really a no-op ----------------------------------------------------------------

// The output above proves it only if a marker is on a path the run takes, so step one by
// hand: the program counter after an `attr` entry must be the next command and nothing else.
const markerPc = attributed.program.findIndex(c => c.keyword === `attr`);
const stepped = AllSpeak_Core.Attr.run({ pc: markerPc });
check(stepped === markerPc + 1, `running an \`attr\` entry steps to the next command (${markerPc} → ${stepped})`);

// ---- and the other runtime, on the same two fixtures ---------------------------------------------------

// Written out here rather than kept as files in the tree: they exist only for this check, and a
// fixture beside the tool would be one more thing to keep in step with what the tool means.
const work = fs.mkdtempSync(path.join(os.tmpdir(), `attr-check-`));
const attributedFile = path.join(work, `attributed.allspeak`);
const plainFile = path.join(work, `plain.allspeak`);
fs.writeFileSync(attributedFile, ATTRIBUTED + `\n`);
fs.writeFileSync(plainFile, PLAIN + `\n`);

note(`the Python runtime, on the same two fixtures:`);
let pythonOut = ``;
try {
	pythonOut = execFileSync(`python3`, [path.join(root, `tools/attr-check.py`), attributedFile, plainFile],
		{ cwd: work, encoding: `utf8`, stdio: [`ignore`, `pipe`, `pipe`] });
} catch (err) {
	// A failing half exits non-zero, so its report arrives on the error rather than as a result.
	// Reading it from there is the difference between reporting what it found and reporting
	// nothing — the second of which reads like agreement.
	pythonOut = typeof err.stdout === `string` ? err.stdout : ``;
	if (typeof err.stderr === `string` && err.stderr) process.stderr.write(err.stderr);
}
process.stdout.write(pythonOut);
// That the whole file ran is not what this counts: it counts what the half said about itself, so a
// check added there is picked up here without this file knowing what it asserts.
failures += (pythonOut.match(/^  FAIL/mg) || []).length;
// A half that crashed prints no verdict line, and its traceback goes to stderr above. Silence must
// not read as agreement, so it counts as a failure of its own.
check(/ATTR-PY-OK|ATTR-PY-FAILED/.test(pythonOut), `the Python half ran as far as its verdict`);
fs.rmSync(work, { recursive: true, force: true });

console.log(``);
console.log(failures === 0 ? `ATTR-OK: every check passed, both runtimes` : `ATTR-FAILED: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
