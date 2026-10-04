#!/usr/bin/env node
//
// Do the recorders' guards actually guard? Drive both hosts on two deliberately bad scripts and say what
// happened to each.
//
// **Why this exists.** The guard was proved once by hand and was found *silently off* twice while it was being
// written — the constructor's parameter list had not taken, so both bounds were `null` and nothing guarded
// anything, while every other signal said the feature was in. An unguarded recorder that stays unguarded is
// this project's most-repeated fault, and the two properties that matter are invisible in a recording that has
// already been written: that a script which computes stops, and that a script which only *waits* stops too —
// the second being the one a budget cannot catch, since waiting is not work.
//
// **It drives the hosts rather than the recorders**, because that is how a run is actually started, and because
// it puts the two runtimes' guards on the same footing: `--budget=` and `--ceiling=` are the same two flags on
// both, in milliseconds, so a check that passes here passes for the same reason on each.
//
// Usage:  node tools/guard-check.js
//
// It needs a checkout — it runs `tools/asviz-run.js`, which loads `js/`, and `tools/asviz-run.py`, which imports
// `allspeak-py/` — so it says that plainly rather than failing on a missing file.
//
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, `..`);
for (const needed of [`js/allspeak`, `js/plugins`, `allspeak-py/allspeak`]) {
	if (!fs.existsSync(path.join(root, needed))) {
		process.stderr.write(`guard-check: no ${needed} beside this script. This check drives the two run hosts,`
			+ ` so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
		process.exit(2);
	}
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};
const note = text => console.log(`  ..    ${text}`);

// The two bad scripts, written rather than kept as fixtures: they are twelve lines each, they exist only for
// this check, and a fixture in the tree would be one more thing to keep in step with the guard's meaning.
const work = fs.mkdtempSync(path.join(os.tmpdir(), `guard-check-`));
const BUSY = path.join(work, `busy.allspeak`);
const WAIT = path.join(work, `wait.allspeak`);
fs.writeFileSync(BUSY, [
	`    script Busy`,
	`    variable N`,
	`Main:`,
	`    viz start`,
	`    put 0 into N`,
	`    while N is less than 200000`,
	`    begin`,
	`        add 1 to N`,
	`    end`,
	`    viz stop`,
	`    print N`,
	`    stop`,
].join(`\n`) + `\n`);
// A loop that only waits: no work to run out of, which is exactly the shape the *budget* cannot catch and the
// ceiling is for. Five seconds of its own, so a ceiling of a fraction of one is unmistakable.
fs.writeFileSync(WAIT, [
	`    script Wait`,
	`    variable N`,
	`Main:`,
	`    viz start`,
	`    put 0 into N`,
	`    while N is less than 5000`,
	`    begin`,
	`        wait 1 millis`,
	`        add 1 to N`,
	`    end`,
	`    viz stop`,
	`    print N`,
	`    stop`,
].join(`\n`) + `\n`);

// One host, one script, one trace — and what it cost in wall clock, because the ceiling's whole promise is
// about time. `python3` for the Python host and this same node for the JS one, so each runs as a user runs it.
const TRACE = path.join(work, `trace.json`);
const drive = (host, script, flags) => {
	const [cmd, args] = host === `py`
		? [`python3`, [path.join(root, `tools/asviz-run.py`)]]
		: [process.execPath, [path.join(root, `tools/asviz-run.js`)]];
	const started = Date.now();
	let output = ``;
	try {
		output = execFileSync(cmd, [...args, `--run`, ...flags, `--trace=${TRACE}`, script],
			{ encoding: `utf8`, stdio: [`ignore`, `pipe`, `pipe`] });
	} catch (err) {
		output = String(err.stdout || ``) + String(err.stderr || ``);
	}
	const elapsed = Date.now() - started;
	let trace = null;
	try { trace = JSON.parse(fs.readFileSync(TRACE, `utf8`)); } catch (err) { trace = null; }
	fs.rmSync(TRACE, { force: true });
	const window = trace && (trace.traceEvents || []).find(e => e.cat === `window`);
	return { elapsed, window: window ? window.args : null, output };
};

console.log(`\nguard-check: the recorders' guard, through both runtimes' hosts`);

// ---- what a guarded run does to a script that computes -----------------------------------------
//
// A one-millisecond budget against a loop of two hundred thousand adds. The trace is the witness on both
// runtimes: the window says which bound ended the run, and the spec already carries the two names.
for (const [host, name] of [[`js`, `JS`], [`py`, `Python`]]) {
	const budgeted = drive(host, BUSY, [`--budget=1`]);
	check(budgeted.window && budgeted.window.stopped === `work`,
		`${name}: a 1 ms work budget ends a busy loop, and the recording says so `
		+ `(stopped=${JSON.stringify(budgeted.window && budgeted.window.stopped)}, `
		+ `${budgeted.window && budgeted.window.visits} visit(s) recorded)`);
	const ceiled = drive(host, BUSY, [`--ceiling=1`]);
	check(ceiled.window && ceiled.window.stopped === `wall`,
		`${name}: a 1 ms wall ceiling ends it too, and the recording tells the two apart `
		+ `(stopped=${JSON.stringify(ceiled.window && ceiled.window.stopped)})`);
	// **And with no guard the loop runs to the end**, which is what makes the two above mean something: without
	// this, a host that stopped every run for an unrelated reason would pass them.
	const free = drive(host, BUSY, []);
	check(free.window && free.window.stopped === null && /(^|\D)200000(\D|$)/.test(free.output),
		`${name}: and unguarded it runs to the end, so the guard is what stopped the others `
		+ `(stopped=${JSON.stringify(free.window && free.window.stopped)}, the loop printed its 200000)`);
}

// ---- and what it does to a script that only waits ----------------------------------------------
//
// The budget cannot catch this one — waiting is not work — so the ceiling is the whole of the promise and the
// *clock* is the witness: the script wants five seconds, and a few hundred milliseconds of that is the answer.
const CEILING_MS = 300;
const LIMIT_MS = 2500;
for (const [host, name] of [[`js`, `JS`], [`py`, `Python`]]) {
	const waited = drive(host, WAIT, [`--ceiling=${CEILING_MS}`]);
	check(waited.elapsed < LIMIT_MS,
		`${name}: a ${CEILING_MS} ms ceiling cuts a loop that only waits short of its own five seconds `
		+ `(${waited.elapsed} ms)`);
	if (host === `py`) {
		check(waited.window && waited.window.stopped === `wall`,
			`Python: and its recording says why — the two runtimes differ in the reason they report `
			+ `(stopped=${JSON.stringify(waited.window && waited.window.stopped)})`);
	} else {
		// Said rather than silently skipped, and it is the one place the two hosts disagree: `AllSpeak_Run.run`
		// returns when a `wait` hands the rest of the program to a timer, so the JS host writes its trace one
		// slice in — the clock above still proves the guard fired, but the file cannot say so. The same
		// early write truncates the recording of any script that waits, which is every UI script and the reason
		// the editor's Record button is not built yet.
		note(`JS: its trace cannot be asked this — the host writes it when the first run slice returns, so a `
			+ `script that waits records only that slice (stopped=${JSON.stringify(waited.window && waited.window.stopped)}). `
			+ `Recorded in TODO.md as the piece the editor's Record button needs first.`);
	}
}

fs.rmSync(work, { recursive: true, force: true });
console.log(failures === 0
	? `\nguard-check: all checks passed`
	: `\nguard-check: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
