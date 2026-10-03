#!/usr/bin/env node
//
// Do attributes reach the *recorder*, and does a recording say what the script asked it to say?
//
// **Why this exists.** The language contract splits an attribute's promise in two: it is *carried* into the
// program, and it is *ignored* by the runtime. `tools/attr-check.js` asks the first question and the second. What
// neither asks is the one in between — whether the tool that a script wrote an attribute *for* can read it, and
// read it from the program rather than from a hopeful scan of the source text.
//
// That gap is where this check stands, and it is the same shape of fault the guard check was written for: an
// attribute that reaches the program and is read by nobody runs perfectly, reports nothing, and looks exactly
// like a script that had nothing to say. So this drives both hosts on scripts whose `@show` values are known
// arithmetic, and compares the recording against the arithmetic:
//
//     @viz start / @viz stop      a window named by an attribute rather than by a command
//     @show N, Total              the values worth watching, read off the program as the recorder passes
//
// **Both hosts, and their texts compared**, because the trace format's whole claim is that the two runtimes'
// recordings can be laid against each other. A captured value is *text*, so it is the one part of a trace that
// can differ for a reason that is entirely a tool's — and that is worth a check rather than an assumption.
//
// It needs a checkout — it runs `tools/asviz-run.js`, which loads `js/`, and `tools/asviz-run.py`, which imports
// `allspeak-py/` — so it says that plainly rather than failing on a missing file.
//
// Usage:  node tools/capture-check.js
//
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, `..`);
for (const needed of [`js/allspeak`, `js/plugins`, `allspeak-py/allspeak`]) {
	if (!fs.existsSync(path.join(root, needed))) {
		process.stderr.write(`capture-check: no ${needed} beside this script. This check drives the two run`
			+ ` hosts, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
		process.exit(2);
	}
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};

// The scripts, written rather than kept as fixtures: they are a dozen lines each, they exist only for this
// check, and a fixture in the tree would be one more thing to keep in step with what the recorder means.
const work = fs.mkdtempSync(path.join(os.tmpdir(), `capture-check-`));
const write = (name, lines) => {
	const file = path.join(work, `${name}.allspeak`);
	fs.writeFileSync(file, lines.join(`\n`) + `\n`);
	return file;
};

// A window named by an attribute, and the two values a loop is worth watching for. `add N to Total` carries a
// `@show` of its own so that the recorded values are the *merged* reading: the anchor's own capture plus the
// one from inside the block, on the same visit.
const CAPTURE = write(`capture`, [
	`    script Capture`,
	`    variable N`,
	`    variable Total`,
	`Main:`,
	`    @viz start`,
	`    put 0 into N`,
	`    put 0 into Total`,
	`    while N is less than 3 @show N, Total`,
	`    begin`,
	`        add 1 to N`,
	`        add N to Total @show Total`,
	`    end`,
	`    @viz stop`,
	`    stop`,
]);

// The same loop with no attributes at all, and the window named the *other* way — by the `viz` command. This is
// the control in both directions: the older spelling must still open a window, and a script that says nothing
// worth watching must carry no captured values at all.
const PLAIN = write(`plain`, [
	`    script Plain`,
	`    variable N`,
	`    variable Total`,
	`Main:`,
	`    viz start`,
	`    put 0 into N`,
	`    put 0 into Total`,
	`    while N is less than 3`,
	`    begin`,
	`        add 1 to N`,
	`        add N to Total`,
	`    end`,
	`    viz stop`,
	`    stop`,
]);

// `@show` only on the statement inside the block, which is what pins the *semantic*: the recorder is a
// pre-execution hook, so the value is the one going *into* the statement. Total entering each iteration of a
// triangular sum is 0, 1, 3 — and 1, 3, 6 would mean the value was taken after the add instead.
const INNER = write(`inner`, [
	`    script Inner`,
	`    variable N`,
	`    variable Total`,
	`Main:`,
	`    @viz start`,
	`    put 0 into N`,
	`    put 0 into Total`,
	`    while N is less than 3`,
	`    begin`,
	`        add 1 to N`,
	`        add N to Total @show Total`,
	`    end`,
	`    @viz stop`,
	`    stop`,
]);

// An attribute naming something the program does not hold, and one written as a note for a *person* — both on a
// marked window, so what is being asked is what the recorder did with each.
const ODD = write(`odd`, [
	`    script Odd`,
	`    variable N`,
	`Main:`,
	`    @viz start`,
	`    @this parser reads atomic weights from parser.json`,
	`    put 0 into N`,
	`    while N is less than 2 @show N, Nope`,
	`    begin`,
	`        add 1 to N`,
	`    end`,
	`    @viz stop`,
	`    stop`,
]);

// **A variable's slots, each holding its own json list** — the shape the sidebar's reader leans on, and the one
// Graham asked about when a note here claimed `index` was broken on a json list. It is not: a slot selected by
// `index` carries its own list, and a write to one leaves the others alone. The lists are written as *text* that
// the json vocabulary parses, so the script itself is portable — **but the reading is not**: `the json keys of`
// is refused by the Python runtime, whose json vocabulary is `dictionary`, and JS refuses that in turn. That gap
// is real and known (the dojo's two variants are built on it), so this asserts the JS path and says so rather
// than reporting a Python failure for a construct Python has no spelling for.
const SLOTS = write(`slots`, [
	`    script Slots`,
	`    variable Holder`,
	`    variable Keys`,
	`    variable Seen`,
	`Main:`,
	`    set the elements of Holder to 2`,
	`    index Holder to 0`,
	`    put \`{"a":"1","b":"2"}\` into Holder`,
	`    index Holder to 1`,
	`    put \`{"c":"3"}\` into Holder`,
	`    index Holder to 0`,
	`    put the json keys of Holder into Keys`,
	`    log the json count of Keys`,
	`    index Holder to 1`,
	`    put the json keys of Holder into Keys`,
	`    log the json count of Keys`,
	`    index Holder to 0`,
	`    put property \`a\` of Holder into Seen`,
	`    log Seen`,
	`    index Holder to 1`,
	`    put property \`c\` of Holder into Seen`,
	`    log Seen`,
	`    index Holder to 0`,
	`    set property \`z\` of Holder to \`9\``,
	`    index Holder to 1`,
	`    put the json keys of Holder into Keys`,
	`    log the json count of Keys`,
	`    index Holder to 0`,
	`    put property \`z\` of Holder into Seen`,
	`    log Seen`,
	`    stop`,
]);

// **A script that arms its own recording — the half a running app needs.** A launched app cannot be recorded
// from outside: nothing can attach to a program that is already going, so the script has to ask. That is
// `record this run`, and its other end is `save the recording to <path>`, which is where a recording becomes
// something somebody can look at. Both are exercised here with the host's own recorder switched off, because a
// host that armed one would be recorded already and the call would — rightly — decline.
//
// **Only the JS host is asked, and the reason is the same one as the json check above**: the Python flavour has
// no `record this run` yet, so this half of the trigger is JS for now. Mirrored next, not pretended.
const SELFARM = write(`selfarm`, [
	`    script SelfArm`,
	`    variable N`,
	`    variable Total`,
	`Main:`,
	`    record this run`,
	`    @viz start`,
	`    put 0 into N`,
	`    put 0 into Total`,
	`    while N is less than 3 @show N, Total`,
	`    begin`,
	`        add 1 to N`,
	`        add N to Total @show Total`,
	`    end`,
	`    @viz stop`,
	`    save the recording to \`selfarm.json\``,
	`    stop`,
]);

// One host, one script, one trace. `python3` for the Python host and this same node for the JS one, so each runs
// as a user runs it.
const drive = (host, script) => {
	const [cmd, args] = host === `py`
		? [`python3`, [path.join(root, `tools/asviz-run.py`)]]
		: [process.execPath, [path.join(root, `tools/asviz-run.js`)]];
	const trace = path.join(work, `trace-${host}.json`);
	try {
		execFileSync(cmd, [...args, `--run`, `--trace=${trace}`, script],
			{ encoding: `utf8`, stdio: [`ignore`, `pipe`, `pipe`] });
	} catch (err) {
		// A host that fails still leaves what it wrote; the checks below say what is wrong with it.
	}
	let document = null;
	try { document = JSON.parse(fs.readFileSync(trace, `utf8`)); } catch (err) { document = null; }
	fs.rmSync(trace, { force: true });
	const events = (document && document.traceEvents) || [];
	return {
		document,
		windows: events.filter(e => e.cat === `window`),
		anchors: events.filter(e => e.cat === `anchor`),
	};
};

// What a script logged, out of the host's output. The two hosts prefix a line differently
// (`<time>:<script>:<line>->` in both), and the message is what follows the arrow.
const logged = (host, script, extra = []) => {
	const [cmd, args] = host === `py`
		? [`python3`, [path.join(root, `tools/asviz-run.py`)]]
		: [process.execPath, [path.join(root, `tools/asviz-run.js`)]];
	// **`spawnSync`, not `execFileSync`, because a host logs on stderr** — an `execFileSync` returns stdout
	// alone, so the first version of this check saw an empty list and reported the language wrong. This is the
	// same instrument fault twice over (a `head -8` hid a probe's last line earlier the same day): what is
	// being captured has to be checked before what it says is believed.
	const run = spawnSync(cmd, [...args, `--run`, ...extra, script], { encoding: `utf8` });
	const output = String(run.stdout || ``) + String(run.stderr || ``);
	// **Two kinds of line come back, and the first version of this knew only one.** A script's own `log` is
	// printed as `<time>:<script>:<line>-><message>`; the *plugin's* lines — `viz: recording this run` — have no
	// arrow at all, so a filter written for the first dropped the second and the check reported the feature
	// missing. That is the third instrument fault in one session (a `head -8`, a stdout-only capture, and this),
	// and all three said the subject was wrong: what is captured has to be checked before what it says is.
	return output.split(`\n`)
		.map(l => l.includes(`->`) ? l.slice(l.indexOf(`->`) + 2)
			: (l.trim().startsWith(`viz:`) ? l.trim() : ``))
		.filter(l => l !== ``);
};

const jsSlots = logged(`js`, SLOTS);
check(JSON.stringify(jsSlots) === JSON.stringify([`2`, `1`, `1`, `3`, `1`, `9`]),
	`an array of json lists keeps its lists separate: keys per slot 2 then 1, each slot's own value, and a `
	+ `write to slot 0 leaving slot 1 alone (${JSON.stringify(jsSlots)})`);
console.log(`  ..    not asserted for Python: 'the json keys of' is JS vocabulary and 'dictionary' is Python's`);

const selfArm = logged(`js`, SELFARM, [`--no-recorder`]);
check(selfArm.some(l => /recording this run/.test(l)),
	`a script can arm a recorder for its own run, which is what a button in a running app needs `
	+ `(${JSON.stringify(selfArm.filter(l => /recording this run/.test(l)))})`);
check(selfArm.some(l => /4 visits in 1 window/.test(l)),
	`and saving it reports what was collected, so an empty recording cannot pass as a working one `
	+ `(${JSON.stringify(selfArm.filter(l => /visits in/.test(l)))})`);
console.log(`  ..    the write itself is not asserted here: a relative '/write/' URL has no base in a host, so `
	+ `the verdict is the witness, and the POST is what a page does`);

// The captured values, in visit order, as `name=value` strings — the shape both runtimes are compared in.
const readings = trace => trace.anchors
	.map(a => a.args.values)
	.filter(Boolean)
	.map(v => Object.keys(v).sort().map(k => `${k}=${v[k]}`).join(`,`));

const EXPECTED = [`N=0,Total=0`, `N=1,Total=1`, `N=2,Total=3`, `N=3,Total=6`];

// ---- the JS recorder -------------------------------------------------------------------------
const jsCapture = drive(`js`, CAPTURE);
check(jsCapture.windows.length === 1,
	`a window named by '@viz start' and '@viz stop' opens one window (${jsCapture.windows.length})`);
check(JSON.stringify(readings(jsCapture)) === JSON.stringify(EXPECTED),
	`and '@show N, Total' on the loop's line records the values that test saw, in both variables `
	+ `(${JSON.stringify(readings(jsCapture))})`);

const jsPlain = drive(`js`, PLAIN);
check(jsPlain.windows.length === 1,
	`the 'viz start' command still opens a window, so the older spelling has not been traded away `
	+ `(${jsPlain.windows.length})`);
check(!jsPlain.anchors.some(a => a.args.values),
	`and a script with no '@show' carries no captured values at all, so its trace is what it always was `
	+ `(${jsPlain.anchors.length} anchor(s), none with values)`);

const jsInner = drive(`js`, INNER);
check(JSON.stringify(readings(jsInner)) === JSON.stringify([`Total=0`, `Total=1`, `Total=3`]),
	`a '@show' inside the block is read as the statement is reached, before it runs `
	+ `(${JSON.stringify(readings(jsInner))})`);

const jsOdd = drive(`js`, ODD);
const jsOddReadings = readings(jsOdd);
// Three readings, not two: `while N is less than 2` is *tested* three times — at N of 0, 1 and 2 — and the
// third test is the one that fails and ends the loop. A visitor counts arrivals, not iterations.
check(JSON.stringify(jsOddReadings) === JSON.stringify([`N=0,Nope=?`, `N=1,Nope=?`, `N=2,Nope=?`]),
	`a name the program does not hold reads '?' rather than vanishing, and a note written for a person is `
	+ `ignored (${JSON.stringify(jsOddReadings)})`);

// ---- the Python recorder, and the two compared ------------------------------------------------
const pyCapture = drive(`py`, CAPTURE);
check(pyCapture.windows.length === 1,
	`the Python recorder reads the same two attribute keys (${pyCapture.windows.length} window(s))`);
check(JSON.stringify(readings(pyCapture)) === JSON.stringify(readings(jsCapture)),
	`and the two runtimes agree on the captured text, which is the one part of a trace a tool decides `
	+ `(py ${JSON.stringify(readings(pyCapture))})`);

const pyPlain = drive(`py`, PLAIN);
check(!pyPlain.anchors.some(a => a.args.values),
	`and a Python recording of a script with no '@show' carries none either `
	+ `(${pyPlain.anchors.length} anchor(s))`);

const pyOdd = drive(`py`, ODD);
check(JSON.stringify(readings(pyOdd)) === JSON.stringify(jsOddReadings),
	`with an unknown name reading '?' in Python too (${JSON.stringify(readings(pyOdd))})`);

// ---- one thing the two runtimes deliberately do not share --------------------------------------
// The JS `toLocaleString` grouping is not used for a captured value: a value is *text the script asked to see*,
// so it is rendered the way the runtime renders it in its own output, and the two differ only where the
// runtimes' own printing already does. Recorded here so the next reader knows it was a decision.
console.log(`  ..    a captured value is text, rendered as the runtime renders it in its own output`);

fs.rmSync(work, { recursive: true, force: true });
console.log(failures === 0
	? `\ncapture-check: all checks passed`
	: `\ncapture-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
