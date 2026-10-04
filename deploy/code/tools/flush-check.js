// Does a recording accumulate in one file, segment after segment, as `viz stop` flushes them?
//
// **The claim this checks is the whole reason `viz start`/`viz stop` exist as a pair.** A run's segments are
// meant to land in one trace file end to end — the first written at its stop, the second added to it, and a
// page that reloaded adding its own segments to a file that already has some rather than replacing it. None of
// that is visible from a single run, and a host cannot see it at all: the write goes through the page's
// `/read/` and `/write/`, and a command-line host has no origin to hang those on. So the page is stubbed here
// — an in-memory `/read/` and `/write/`, nothing else — and the plugin drives it.
//
// Run: node tools/flush-check.js
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.dirname(__dirname);
let failures = 0;
const check = (ok, what) => {
	if (!ok) failures++;
	console.log(`  ${ok ? `OK  ` : `FAIL`} ${what}`);
};

const files = {};
const calls = [];
const context = {
	window: {},
	console,
	// The plugin's own load-time references, and nothing more: a domain registry to hang itself on, the run it
	// wraps in order to arm a self-recording script, and a clock.
	AllSpeak: { domain: {} },
	AllSpeak_Run: { run: function () { return true; } },
	performance: { now: () => Date.now() },
	setTimeout,
	clearTimeout,
	fetch: (url, options) => {
		const target = String(url);
		calls.push(target);
		const name = target.replace(/^\/read\//, ``).replace(/^\/write\//, ``);
		if (target.startsWith(`/read/`)) {
			// What the dev server answers for a path it does not hold: 200 with an empty body.
			return Promise.resolve({ ok: !!files[name], text: () => Promise.resolve(files[name] || ``) });
		}
		files[name] = options.body;
		return Promise.resolve({ ok: true });
	},
};
// **A check that needs this repository says so, rather than failing on a missing file.** The plugin is a
// source file, not something a starter pack carries: a pack is a client of the CDN, so an agent working from
// one has the published checks and not this. Saying which of the two it is beats a stack trace from `vm`.
const pluginPath = path.join(root, `js/plugins/asviz.js`);
if (!fs.existsSync(pluginPath)) {
	console.log(`flush-check: this check drives js/plugins/asviz.js, which only a checkout of the AllSpeak`);
	console.log(`repository carries — a starter pack is a client of the CDN and does not have it.`);
	process.exit(1);
}

vm.createContext(context);
vm.runInContext(fs.readFileSync(pluginPath, `utf8`), context);
const AllSpeak_Viz = context.window.AllSpeak_Viz;

if (!AllSpeak_Viz || !AllSpeak_Viz.Recorder || !AllSpeak_Viz.appendTrace) {
	console.log(`flush-check: the plugin did not load, or does not publish a recorder`);
	process.exit(1);
}

const TRACE = `flush-check.viz.json`;
const program = {
	length: 2,
	programStack: [],
	vizTracePath: TRACE,
	0: { domain: `core`, keyword: `put`, lino: 5 },
	1: { domain: `core`, keyword: `stop`, lino: 6 },
};

// A window made by the recorder itself. A hand-built one would be a guess at an internal shape, and this
// check has no business assuming one.
const segment = recorder => {
	recorder.arm(program, { mode: `once`, lino: 5 }, 0);
	recorder.tick(program, 0);
	recorder.tick(program, 1);
	recorder.stop();
};

const settle = () => new Promise(resolve => setTimeout(resolve, 20));
const read = () => {
	const document = JSON.parse(files[TRACE]);
	const windows = document.traceEvents.filter(e => e.name === `thread_name`);
	return {
		windows: windows.length,
		tids: document.traceEvents.filter(e => e.cat === `window`).map(e => e.tid),
		processes: document.traceEvents.filter(e => e.name === `process_name`).length,
	};
};

(async () => {
	// 1. The first segment creates the file, and the window numbering starts at 1.
	const first = new AllSpeak_Viz.Recorder(null, null);
	segment(first);
	await first.flushTo(program, true);
	await settle();
	const one = read();
	check(one.windows === 1 && one.tids[0] === 1,
		`a segment's flush creates the file with one window in it (${JSON.stringify(one)})`);

	// 2. A second segment is added to it, and its window index continues rather than restarting.
	const second = new AllSpeak_Viz.Recorder(null, null);
	segment(second);
	await second.flushTo(program);
	await settle();
	const two = read();
	check(two.windows === 2 && JSON.stringify(two.tids) === JSON.stringify([1, 2]),
		`a second segment is added to the file, its window index continued (${JSON.stringify(two)})`);

	// 3. **A reload.** A fresh recorder holds nothing, and what it flushes must be added to the file that is
	//    already there — which is the read-before-write, and the reason the file is a recording rather than a
	//    snapshot of the last page.
	const reloaded = new AllSpeak_Viz.Recorder(null, null);
	segment(reloaded);
	await reloaded.flushTo(program);
	await settle();
	const three = read();
	check(three.windows === 3 && JSON.stringify(three.tids) === JSON.stringify([1, 2, 3]),
		`a page that reloaded adds its segment to the file rather than replacing it (${JSON.stringify(three)})`);

	// 4. One process in the document, not one per segment.
	check(three.processes === 1,
		`the document keeps a single process, whatever the number of segments (${three.processes})`);

	// 5. A flush with nothing new writes nothing, so a second stop cannot double a segment.
	const reads = calls.filter(c => c.startsWith(`/read/`)).length;
	await reloaded.flushTo(program);
	await settle();
	check(read() .windows === 3 && calls.filter(c => c.startsWith(`/read/`)).length === reads,
		`a flush with nothing new writes nothing at all (${JSON.stringify(read())})`);

	console.log(failures === 0
		? `flush-check: all checks passed`
		: `flush-check: ${failures} check(s) failed`);
	process.exit(failures === 0 ? 0 : 1);
})().catch(err => {
	console.log(`flush-check: could not run — ${err && err.message}`);
	process.exit(1);
});
