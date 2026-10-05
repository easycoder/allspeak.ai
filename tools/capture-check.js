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
// **The script records itself, and it names its own file.** No `record this run` and no host recorder: the
// only thing that arms anything here is the script's own `@viz start`, which is the point of the check. The
// path is named *before* the first marker, because naming it is what `save the recording to <path>` now does —
// and two start/stop pairs rather than one, because the second segment is what proves a recording can go on
// after its first `viz stop` and land in the same file.
//
// **Only the JS host is asked, and the reason is the same one as the json check above**: the Python flavour has
// no `record this run` yet, so *this* half of the trigger — the pair a running app needs to record itself — is
// JS for now. Mirrored next, not pretended. The other half, `record the script … giving …`, is in both runtimes
// as of 2026-10-05 and is checked further down, with the flavour marker it reads.
const SELFARM = write(`selfarm`, [
	`    script SelfArm`,
	`    variable N`,
	`    variable Total`,
	`Main:`,
	`    save the recording to \`selfarm.json\``,
	`    @viz start`,
	`    put 0 into N`,
	`    put 0 into Total`,
	`    while N is less than 3 @show N, Total`,
	`    begin`,
	`        add 1 to N`,
	`        add N to Total @show Total`,
	`    end`,
	`    @viz stop`,
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
//
// **`scripts` may be a list**, because one target can name another: a trigger script asks for the script it
// records by name, and a host registers the sources it is given — so both have to be handed over. The list is
// the JS host's own road to `AllSpeak_Viz.sources`, and the Python host reads the file without it; passing both
// to both keeps the two hosts driven the same way.
const logged = (host, scripts, extra = []) => {
	const [cmd, args] = host === `py`
		? [`python3`, [path.join(root, `tools/asviz-run.py`)]]
		: [process.execPath, [path.join(root, `tools/asviz-run.js`)]];
	const list = Array.isArray(scripts) ? scripts : [scripts];
	// **`spawnSync`, not `execFileSync`, because a host logs on stderr** — an `execFileSync` returns stdout
	// alone, so the first version of this check saw an empty list and reported the language wrong. This is the
	// same instrument fault twice over (a `head -8` hid a probe's last line earlier the same day): what is
	// being captured has to be checked before what it says is believed.
	const run = spawnSync(cmd, [...args, `--run`, ...extra, ...list], { encoding: `utf8` });
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
// The witness for the arm is the arming line itself: with `--no-recorder` the host armed nothing, so this can
// only pass because the script's own `@viz start` did. Written deliberately rather than inferred from a
// recording, because "recorded nothing" and "never armed" are different faults that look alike.
check(selfArm.some(l => /this script records itself/.test(l)),
	`a script arms a recorder with its own '@viz start', with no host and no 'record this run' — which is `
	+ `what an app needs if it is to record a run nobody is watching `
	+ `(${JSON.stringify(selfArm.filter(l => /records itself/.test(l)))})`);
// The flush is witnessed by the *verdict* rather than by the write, and deliberately on both branches: the
// line carries "the recording holds …" whether the write succeeded or failed, so a host with no page behind
// it still says what was collected. An empty recording cannot pass as a working one.
check(selfArm.some(l => /the recording holds 4 visits in 1 window/.test(l)),
	`and ending a segment flushes it, reporting what was collected `
	+ `(${JSON.stringify(selfArm.filter(l => /holds/.test(l)))})`);
check(selfArm.some(l => /the recording holds 8 visits in 2 windows/.test(l)),
	`a second start/stop pair after the first segment is written opens a second segment — the first is not `
	+ `written twice and not lost, which is what a file of segments means `
	+ `(${JSON.stringify(selfArm.filter(l => /holds/.test(l)))})`);
console.log(`  ..    the write itself is not asserted here, and cannot be: a relative '/read/' or '/write/' URL `
	+ `has no base in a host, which is why the verdict rides on the failure line too. The read-merge-write is `
	+ `what a page does, and the pane's own check is where that belongs.`);

// ---- which runtime a script is for ------------------------------------------------------------
//
// **Nothing in the language recorded this until 2026-10-05, and that is what made the trigger one-sided.** A
// script said which runtime it was for only by failing to compile in the other one — `I don't understand
// 'dictionary' at line 46`, which names the word and the line but answers a question nobody asked. `@py` and
// `@js` are the script's own answer and `record the script …` is the reader, which asks the *token stream*,
// before anything is compiled, because the script it has to refuse is exactly the one that would not compile: a
// check on the program could never be reached.
//
// **And the default is the project's, which is the part that took a second pass.** A script that says nothing
// has not said "JavaScript" — it has said nothing, and the project answers next, from the `runtime:` line in its
// `.allspeak-init`; only if that is absent too is it `js`. That is what keeps a Python project free of markers,
// and what makes `@js` the override a mixed project needs.
//
// Two hosts, and the same facts on each — the marker is carried into the program and reported by the model, the
// other runtime's script is refused in a sentence, and the host's own flavour runs. **The sentences are
// asserted whole**, because they are what a person reads on the editor's status line and `could not run: …` was
// the verdict of every other failure too — and because each names *where the answer came from*, which is the
// fact a reader needs when they go looking for a marker and there is none to find.

// The body the three marked scripts share. **One shape, deliberate:** a window that opens *not* directly under
// a label, so that the two runtimes agree on what it collected. A label is a command in Python and a bare symbol
// entry in JS, so a window opening right under one gives JS an extra arrival — the difference the trace spec
// documents, and one that would otherwise hide the fact being asserted here. Measured 2026-10-05: `4 visits in
// 1 window` either side.
const FLAVOUR_BODY = [
	`    variable N`,
	`Main:`,
	`    put 0 into N`,
	`    @viz start`,
	`    while N is less than 3`,
	`    begin`,
	`        add 1 to N`,
	`    end`,
	`    @viz stop`,
	`    stop`,
];

const MARKED_PY = write(`marked-py`, [`    script MarkedPy`, `    @py`, ...FLAVOUR_BODY]);

// `@js` written out, so that the two spellings of the same fact are both exercised — and the unmarked script
// below is the third case, which is the default.
const MARKED_JS = write(`marked-js`, [`    script MarkedJs`, `    @js`, ...FLAVOUR_BODY]);

const UNMARKED = write(`unmarked`, [`    script Unmarked`, ...FLAVOUR_BODY]);

// **This check's own project, and it says `lang:` and nothing else.** That is deliberate twice over: it makes
// the "nothing else says, so `js` is the default" case a *stated* one rather than a hope about what happens to
// be above `/tmp`, and it exercises the rule that a project which has answered and said nothing about its
// runtime has answered — the walk stops there rather than going up into a different project.
fs.writeFileSync(path.join(work, `.allspeak-init`), `lang: en\nname: Capture check\n`);

// And one that *does* name a runtime, in a directory of its own, because that is the case the project line
// exists for. `py` with a script that carries no marker: the Python runtime must run it and the JavaScript one
// must refuse it, saying where the answer came from.
const PYP = path.join(work, `pyproject`);
fs.mkdirSync(path.join(PYP, `src`), { recursive: true });
fs.writeFileSync(path.join(PYP, `.allspeak-init`),
	`lang: en\nruntime: py\nname: A Python project\ntype: cli\n`);
const PYP_PLAIN = write(`pyproject/src/plain`, [`    script Plain`, ...FLAVOUR_BODY]);
// The override: the same body, marked `@js`, inside that Python project. A mixed project is what the marker is
// for, and this is the assertion that it still wins over the project.
const PYP_MARKED = write(`pyproject/src/marked`,
	[`    script Marked`, `    @js`, ...FLAVOUR_BODY]);

// What each host should report for its own flavour's copy of that body.
const FLAVOUR_VERDICT = `4 visits in 1 window`;

// A trigger, per host: the command runs another script and says what it collected. The Python one loads the
// plugin, because a Python script has to ask for it; the JS host loads every plugin it finds, which is what a
// page does.
const PY_PLUGIN = path.join(root, `allspeak-py`, `plugins`, `as_viz.py`);
const trigger = (host, target, name) => write(name, host === `py`
	? [
		`    script PyTrigger`,
		`    variable Trace`,
		`    variable Verdict`,
		`    use plugin Viz from ${PY_PLUGIN}`,
		`Main:`,
		`    record the script in \`${target}\` giving Trace reporting Verdict`,
		`    log Verdict`,
		`    stop`,
	]
	: [
		`    script JsTrigger`,
		`    variable Trace`,
		`    variable Verdict`,
		`Main:`,
		`    record the script in \`${target}\` giving Trace reporting Verdict`,
		`    log Verdict`,
		`    stop`,
	]);

// The model's records, which is where the marker has to be visible: an attribute is *carried into the program*
// precisely so a tool with no source in front of it can read it, and `attr | line=N | <text>` is how the model
// reports every one. This is also how the editor reads `@app`, so the same walk sees the flavour for free.
const modelOf = (host, script) => {
	const [cmd, args] = host === `py`
		? [`python3`, [path.join(root, `tools/asviz-run.py`)]]
		: [process.execPath, [path.join(root, `tools/asviz-run.js`)]];
	const run = spawnSync(cmd, [...args, script], { encoding: `utf8` });
	return String(run.stdout || ``) + String(run.stderr || ``);
};

check(/attr \| line=2 \| py\b/.test(modelOf(`py`, MARKED_PY))
	&& /attr \| line=2 \| py\b/.test(modelOf(`js`, MARKED_PY)),
	`'@py' is carried into the program and the model reports it with its line, in both runtimes `
	+ `(${JSON.stringify(modelOf(`py`, MARKED_PY).split(`\n`).filter(l => /^\s*attr \| /.test(l)))})`);
check(/attr \| line=2 \| js\b/.test(modelOf(`py`, MARKED_JS)),
	`and so is '@js', which is the same fact said the other way `
	+ `(${JSON.stringify(modelOf(`py`, MARKED_JS).split(`\n`).filter(l => /^\s*attr \| /.test(l)))})`);

// The refusals. Each host is handed the other flavour's script by a script, which is the one caller that can
// be driven from a host with no editor in the picture. Every expected sentence is written out in full — the
// middle clause is the *origin*, and it is the whole reason there is more than one of these.
const pyRefuses = logged(`py`, [trigger(`py`, MARKED_JS, `py-at-js`), MARKED_JS]);
check(pyRefuses.includes(`could not run: this script is for the JavaScript runtime — @js — `
	+ `and this is the Python runtime`),
	`the Python runtime refuses a script marked '@js', naming the marker that says so `
	+ `(${JSON.stringify(pyRefuses.filter(l => /could not run/.test(l)))})`);

const pyRefusesDefault = logged(`py`, [trigger(`py`, UNMARKED, `py-at-unmarked`), UNMARKED]);
check(pyRefusesDefault.includes(`could not run: this script is for the JavaScript runtime — unmarked, and `
	+ `nothing else says, so @js is the default — and this is the Python runtime`),
	`and an unmarked script is refused the same way, having said so by *saying nothing* — and the sentence `
	+ `says the default is what decided it (${JSON.stringify(pyRefusesDefault.filter(l => /could not run/.test(l)))})`);

const jsRefuses = logged(`js`, [trigger(`js`, MARKED_PY, `js-at-py`), MARKED_PY]);
check(jsRefuses.includes(`could not run: this script is for the Python runtime — @py — `
	+ `and this is the JavaScript runtime`),
	`and the JavaScript runtime refuses '@py' in the matching sentence, so the rule runs both ways `
	+ `(${JSON.stringify(jsRefuses.filter(l => /could not run/.test(l)))})`);

// **The project line, which is the case that keeps a Python project free of markers.** The target carries
// nothing at all — no `@py` — and is three directories under a `.allspeak-init` that says `runtime: py`, so the
// answer can only have come from the project. The walk is the other half: nothing above the project says `py`,
// and the file that does is the *nearest* one.
const jsRefusesProject = logged(`js`, [trigger(`js`, PYP_PLAIN, `js-at-project`), PYP_PLAIN]);
check(jsRefusesProject.includes(`could not run: this script is for the Python runtime — unmarked, and the `
	+ `project's .allspeak-init says @py — and this is the JavaScript runtime`),
	`an unmarked script in a project whose '.allspeak-init' says 'runtime: py' is refused by the JavaScript `
	+ `runtime, and the sentence names the project rather than a marker that is not there `
	+ `(${JSON.stringify(jsRefusesProject.filter(l => /could not run/.test(l)))})`);

const pyRunsProject = logged(`py`, [trigger(`py`, PYP_PLAIN, `py-at-project`), PYP_PLAIN]);
check(pyRunsProject.includes(FLAVOUR_VERDICT),
	`and the same unmarked script runs on the Python runtime with **no marker anywhere in it** — which is what `
	+ `the project line is for (${JSON.stringify(pyRunsProject.filter(l => /visits in/.test(l)))})`);

// The override: the same project, a script that *does* say `@js`. A mixed project is the case the marker exists
// for — this repository is one — so the script has to beat the project.
const jsRunsOverride = logged(`js`, [trigger(`js`, PYP_MARKED, `js-at-override`), PYP_MARKED]);
check(jsRunsOverride.includes(FLAVOUR_VERDICT),
	`and a script in that project which says '@js' still runs here — the script's own word beats the project's `
	+ `(${JSON.stringify(jsRunsOverride.filter(l => /visits in/.test(l)))})`);

// And the other half: the refusal is not a blanket one. Each host runs its own flavour and says what it got —
// the sentence above replaced `I don't understand 'dictionary' at line 46`, which is only reached when the
// target happens to use a word this runtime lacks, and the two runtimes share enough vocabulary that a script
// can be the wrong flavour and still compile.
const pyRuns = logged(`py`, [trigger(`py`, MARKED_PY, `py-at-py`), MARKED_PY]);
check(pyRuns.includes(FLAVOUR_VERDICT),
	`the Python runtime runs a script marked '@py' and reports what it recorded `
	+ `(${JSON.stringify(pyRuns.filter(l => /visits in/.test(l)))})`);

const jsRuns = logged(`js`, [trigger(`js`, UNMARKED, `js-at-unmarked`), UNMARKED]);
check(jsRuns.includes(FLAVOUR_VERDICT),
	`and an unmarked script runs on the JavaScript runtime and records the same thing — which is what the `
	+ `default means, and the two runtimes' verdicts are the same sentence `
	+ `(${JSON.stringify(jsRuns.filter(l => /visits in/.test(l)))})`);


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
