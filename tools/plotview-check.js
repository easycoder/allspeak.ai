#!/usr/bin/env node
//
// Run the plot view in node against a stub DOM, and say what it drew — and then drive the gestures
// and say what each of them did to it.
//
// The view is AllSpeak, so it needs the JS runtime and a document — but nothing here needs layout
// or a browser: the geometry is in viewBox units, so the whole script runs headlessly and the
// stub records what it asked the DOM to create. This is the development loop for the view.
//
// Usage:  node various/plotview-check.js <trace.json> [page.html]
//
// A trace to run it against is made from a script with markers in it, so there is no fixture to
// keep in step with the view:
//
//     python3 tools/asviz-run.py --run --trace=/tmp/trace.json tools/trace-run.allspeak
//     node various/plotview-check.js /tmp/trace.json
//
// `PLOTVIEW=<path>` runs a different copy of the view, which is how a change to it is shown not to
// have altered the fitted picture: run the version before the change and the version after it
// against the same trace and diff the two reports.
//
// Two modes exist for asking what the view *costs*, which the phases above cannot answer: they redraw about
// fifty times over, and a big recording never finishes them — which is the complaint that prompted both.
//
//   PLOTVIEW_ONEDRAW=1     draw the picture, print the milliseconds, stop. A whole-load figure, covering the
//                          two drawings the host script makes; the per-drawing number is the pane's own
//                          `DrawMillis`. **The `wait` is stood down in this mode** (`Core.js`, `Wait`), because
//                          otherwise a drawing hands the thread back every hundred marks and returns — so the
//                          figure covered only the part before the first yield, which is not what the name
//                          says and not what a reader of it would take it for.
//   PLOTVIEW_GESTURES=1    run every phase and print the dearest five by what the *view* measured for each
//                          (`DrawMillis`, which each drawing writes at its own two ends). Not this harness's
//                          wall clock, which is dominated by its own patient settling.
//   PLOTVIEW_CLIP=<f>-<t>  clip to a range of steps before the load-time drawings, so the same two questions
//                          can be asked of a *clipped* draw on a recording whose phases cannot finish.
//
const fs = require('fs');
// **This harness runs the drawing, so it needs the runtime it runs on.** A copy shipped inside a
// starter pack sits beside the editor but not beside `js/`, because a pack is a client of the CDN
// rather than a checkout — so say that plainly instead of failing on a missing file much later.
if (!fs.existsSync(require('path').join(__dirname, '..', 'js', 'allspeak'))) {
	process.stderr.write(`plotview-check: no js/allspeak beside this script. This harness runs the view on the\n`
		+ `runtime sources, so it needs a checkout of the AllSpeak repository — or a path to one via\n`
		+ `PLOTVIEW. It cannot run from a starter pack, which loads the runtime from the CDN.\n`);
	process.exit(2);
}
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, `..`);

// **The panel's box and the canvas's, and they are not the same box.** The canvas is a drawing a
// thousand units wide and 740 tall; the panel is whatever the editor's layout gives it. The browser
// fits the drawing inside the panel and *centres* what is left over, so the canvas's top-left corner is
// not the panel's and the gap is the letterbox — 247 pixels here. A fixture that made the two boxes
// equal would hide exactly that, and the hit test is the one thing in the view that has to know it.
// The canvas's box is the one the fit produces from the panel's, so neither number is free.
const PANEL = { left: 0, top: 0, width: 1440, height: 700 };
const CANVAS = { left: 247, top: 0, width: 946, height: 700 };
// The panel's pixels per viewBox unit: `meet` takes the smaller of the two ratios, and 946 of the
// 1440 is what is left for the drawing once that is done.
const SCALE = Math.min(PANEL.width, PANEL.height * 1000 / 740) / 1000;
// Where a point in the drawing's units is on screen, which is what a reader's pointer gives.
const toClient = (x, y) => [CANVAS.left + Math.round(x * SCALE), CANVAS.top + Math.round(y * SCALE)];

const created = [];
const byId = {};
const mk = tag => ({
	tagName: tag, style: {}, children: [], attributes: {},
	appendChild(c) { created.push([this.attributes.id || tag, (c && c.attributes && c.attributes.id) || c.tagName]); this.children.push(c); return c; },
	setAttribute(k, v) { if (k === `id`) byId[v] = this; this.attributes[k] = v; },
	removeChild() {}, addEventListener() {}, classList: { add() {}, remove() {} },
	box: CANVAS,
	// `null` for an attribute that was never set, which is what a real element reports: the plugin reads
	// an element's `x` and `y` as part of setting either, and a fixture returning `undefined` would let
	// arithmetic on a missing attribute come out as NaN rather than as the zero the browser gives. It is
	// here because the scrollbar's handles are the first `rect` created with a style of its own, and the
	// plugin takes a different path for that.
	getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
	getBoundingClientRect() { return this.box; },
});
const noop = () => {};
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
// A host has to provide this: the runtime reports an error by alerting, so without it a value that
// will not evaluate surfaces as "alert is not defined" and hides what actually went wrong.
global.alert = m => process.stderr.write(`alert: ${m}\n`);
global.document = {
	getElementById: id => byId[id] || null,
	querySelector: () => null,
	createElement: mk, createElementNS: (ns, tag) => mk(tag),
	addEventListener: noop, body: mk(`body`), head: mk(`head`),
};

for (const f of [`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`, `Language.js`,
	`LanguagePack_en.js`, `Compile.js`, `Main.js`]) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, f), `utf8`), { filename: f });
}
vm.runInThisContext(`globalThis.__x = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en } = globalThis.__x;
for (const f of fs.readdirSync(path.join(root, `js/plugins`)).filter(f => f.endsWith(`.js`))) {
	try { vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, f), `utf8`), { filename: f }); }
	catch (err) { /* needs a browser */ }
}
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.timestamp = Date.now();
AllSpeak.scripts = {};

// The host side. The view is a section, not a program: it is given a panel (`VizHost`) and a fetched
// trace (`VizTrace`), and it is called with `gosub`. This harness plays that host — and calls the
// section **twice**, which is the idempotence check: the second draw must replace the marks rather
// than add a second set of elements.
const tracePath = process.argv[2];
// The view under test is normally the working copy — which is now the editor's Graph pane *module*,
// where the view and the way it is reached live in one file. `PLOTVIEW=<path>` runs another one, which
// is how a change to the view is proved not to have changed the fitted picture: run the version before
// it and the version after it against the same trace, and diff the two reports.
const viewPath = process.env.PLOTVIEW || path.join(root, `asedit-graph.allspeak`);
// **The view is cut out of that module.** Everything before its own doc-block header is the module's
// plumbing — the declarations, the attachments, the message that hands it a run — and none of that
// exists when the view is compiled as a section here; the harness stands in for it instead (the panel,
// the run, the words below). Everything from the header on is the view, verbatim: the same text the
// editor's page compiles when the pane is loaded, so what is checked is what ships.
const moduleSource = fs.readFileSync(viewPath, `utf8`);
// **The view's half of the module starts at a marker comment**, because the module is one file now
// and this harness compiles only the half that a host would run. `various/plotview.allspeak` was that
// half's own file until it grew into the module; the marker is all that is left of the name, and it is
// a comment so that neither the compiler nor the doc-block analyser has to know about it.
const viewStart = moduleSource.indexOf(`! ---- the view, below here, is what a host runs ----`);
if (viewStart < 0) {
	process.stderr.write(`plotview-check: ${path.basename(viewPath)} has no '!! plotview.allspeak' header — `
		+ `has the view marker moved?\n`);
	process.exit(1);
}
// The view is run on its own, so the three language words its flow key reads are declared here. In the
// module they are declared with the rest of its plumbing and set from the editor's string table, which
// this file does not carry — the same standing-in that the DOM stub and the host's variables do below.
// `VizPending` joins them for the same reason: it is declared at the top of the module (a use in
// `VizDrawRun` comes first, and the compiler is single-pass) so the cut does not carry it, and the
// view's own draw hands over to it. `VizSlide` is the same case again, and it is declared with the
// *gestures* up there rather than with the view's own state for exactly the reason it has to be
// repeated here: `on drag` reads it before any of the view's declarations have been reached.
const view = `variable StrFlowCall\nvariable StrFlowJump\nvariable StrFlowReturn\nvariable VizPending\nvariable VizSlide\nvariable DrawMillis\nvariable VizEstimate\nvariable DrawStarted\nsvgtext VizBusy\n`
	+ moduleSource.slice(viewStart);
const trace = fs.readFileSync(tracePath, `utf8`);
// What the recording says the transfers were, by kind. The view decides which of these to draw and
// in which colour, so the recording is the witness for both — and it is the only witness for the one
// claim that cannot be read off the picture: that the compiler's own jumps are *not* in it.
const transferKinds = (() => {
	try {
		return (JSON.parse(trace).traceEvents || [])
			.filter(e => e.cat === `transfer`)
			.map(e => (e.args && e.args.kind) || `?`);
	} catch (err) {
		return [];
	}
})();
// And the lines it names: an arrival, or either end of a transfer. This is the set the rules are
// supposed to cover — and the one the counts in the window are *not*. A recording that walks a chain
// of labels executes far more lines than it names, so drawing a rule for every executed line gave a
// grid more than twice as dense as anything in the picture, which is what Graham saw.
const namedLines = (() => {
	try {
		const events = (JSON.parse(trace).traceEvents || []).filter(e => e.cat && e.cat !== `window`);
		const lines = new Set();
		for (const e of events) {
			const a = e.args || {};
			if (e.cat === `anchor` && a.line !== undefined) lines.add(Number(a.line));
			if (e.cat === `transfer`) {
				if (a.from_line !== undefined) lines.add(Number(a.from_line));
				if (a.to_line !== undefined) lines.add(Number(a.to_line));
			}
		}
		return lines;
	} catch (err) {
		return new Set();
	}
})();
// How many records the pane counts — an arrival, or either end of a transfer, and nothing else. It
// is the denominator the clip's notice prints (`238 of 2488 records`), so it is read here from the
// recording rather than from the view, which is the only way the number can be checked and not
// merely echoed. The `window` records are excluded for the same reason the pane excludes them: their
// `steps` is how long a window ran, not a step anything is at.
// The recording's own last step, read from the trace. The pane measures this too, and the two agreeing is
// what says the picture's steps axis is the recording's — the bar's claims are placed in those steps, so
// they mean nothing when the pane's extent has collapsed (a recording that opens more than one `viz`
// window does that to it; `TODO-viz.md` has it as a standing fault).
const traceMaxSteps = (() => {
	try {
		const steps = (JSON.parse(trace).traceEvents || [])
			.filter(e => e.cat === `anchor` || e.cat === `window`)
			.map(e => Number((e.args || {}).steps) || 0);
		return steps.length ? Math.max(...steps) : 0;
	} catch (err) {
		return -1;
	}
})();
const recordCount = (() => {
	try {
		return (JSON.parse(trace).traceEvents || [])
			.filter(e => e.cat === `anchor` || e.cat === `transfer`).length;
	} catch (err) {
		return -1;
	}
})();
// The second thing the host gives the view: the script itself, which the view draws behind the heat.
// A fixture of its own rather than the recorded file, because what is being checked is the mechanism
// — the row count, the escaping, the width — and because the source has to be embedded in an AllSpeak
// backtick string, where a backtick of its own would end it. The line numbers are deliberately well
// long enough to name every line the recordings reference, and the special lines sit inside the run
// so they arrive in the window at some point in the phases below.
//
// The longest line is deliberately wider than the frame can show at the legible floor — about a
// hundred and ten columns — because that is the only case where the source's horizontal offset can
// be anything but zero. A narrower document cannot tell an anchored source from a sliding one.
//
// Line 32 is a doc-block line and line 34 a bare `!` comment, because the two are drawn differently:
// the first is an empty row and the second is not. A fixture with only one of them could not tell the
// rule from its opposite.
//
// Line 179 is one of the lines the recording names *and* one that is in the window at the legible
// floor, and it is deliberately far longer than the frame can show there — 204 columns against the
// hundred and ten or so a pane that size holds. That is the one case where a rule cannot begin after its
// line's text, because the text it would begin after is not on the frame.
//
// Lines 32, 150, 151, 152 and 153 are the cases the diagnostic's label test has to tell apart, and the
// colon is deliberate in every one: a doc block (blanked, so not a label), a label proper, an indented line
// that merely ends in a colon, a bare comment that does, and a second doc block. Only line 150 may be named
// at the frame's edge. They sit at 150 and not higher up because the diagnostic draws nothing until the
// copy is large enough to read, and the phases reach that zoom around lines 140 to 247 — a case the phases
// never look at would be a case the check only appears to cover.
const source = Array.from({ length: 260 }, (_, i) => {
	const n = i + 1;
	if (n % 7 === 0) return ``;                                  // blank lines keep their row
	if (n === 30) return `    a <tag> and an & ampersand`;       // the three entities
	if (n === 31) return `    # a note, 100% certain, "quoted"`; // and the two characters a data URL needs
	if (n === 32) return `!! a doc block line:`;                 // drawn as an empty row: not a label
	if (n === 33) return `    ` + `x`.repeat(160);               // 164 columns: wider than the pane can show
	if (n === 34) return `    ! a note beside the code`;         // a bare comment: drawn as it is
	if (n === 150) return `ChooseUnit:`;                         // a label: named at the frame's edge
	if (n === 151) return `    not a label, indented:`;          // ends in a colon, but not at the margin
	if (n === 152) return `! not a label, a comment ends in a colon:`;    // and neither is a comment
	if (n === 153) return `!! not a label, a doc line ends in a colon:`;  // nor is a doc block
	if (n === 179) return `    ` + `y`.repeat(200);              // named by the recording, and wider still
	return `    line ${n} of the fixture`;
}).join(`\n`);
// The host's "the script is edited" phase. It has to leave the file file-shaped — one line longer, which
// is what an edit to a real script does. It used to replace the source with a *single* line, which broke
// this fixture's own rule two paragraphs up: a one-line file beside a recording naming lines 25-44 has no
// rows for the marks to sit on, so every check about where a mark lands was asking about a picture that
// could not hold the answer. Four checks failed for a change that was sound, and that is what they were.
const editedSource = source + `\n    one line more`;
// The order matters: the host's main flow comes *first*, and the view's section after it, so that
// execution stops before falling into the section's body. That is how it will sit in asedit too.
// **`PLOTVIEW_CLIP=<from>-<to>` sets a clip before the load-time drawings.** The phases below cannot be
// run on a big recording — a 435KB trace never finishes them — so the only way to ask what a *clipped*
// draw costs on one is to hand the view a range before it draws. It is the same two variables `VizClip`
// sets, which is what keeps it honest: nothing here reaches past the entry the pane has.
// **`PLOTVIEW_CLIP=<from>-<to>` clips through the pane's own `VizClip`, *after* the load-time drawings.**
// That order is the whole of the fix and it cost a wrong answer once: an earlier version wrote
// `VizClipFrom`/`VizClipTo` through the symbol record *before* the first drawing, and the pane clears a clip
// when the recording changes ("a clip is a range over *this* recording") — so the range was wiped on the
// way in and **both halves of the comparison it was built for were unclipped runs**. Clipping afterwards,
// by setting the window and calling the entry a reader's gesture calls, cannot be wiped: by then the
// recording is the one the pane has drawn.
const clipFirst = (() => {
	const spec = process.env.PLOTVIEW_CLIP;
	if (!spec) return null;
	const [from, to] = spec.split(`-`).map(Number);
	if (!Number.isFinite(from) || !Number.isFinite(to)) {
		process.stderr.write(`plotview-check: PLOTVIEW_CLIP wants <from>-<to>, e.g. PLOTVIEW_CLIP=0-300\n`);
		process.exit(2);
	}
	return [from, to];
})();

// **`PLOTVIEW_ONEDRAW=1` stands the `wait` down**, so that a drawing runs from end to end inside one pass.
// Otherwise it hands the thread back every hundred marks and returns to its caller, and the figure the
// pane prints at its own two ends is not written until much later — the reason the mode used to report a
// figure that covered only the part of a drawing that ran before the first yield. The stub is the one the
// runtime's own `wait` is, minus the timer: `Core.js`, `Wait`, whose `run` resumes the program itself.
const standDownTheWait = () => {
	if (!process.env.PLOTVIEW_ONEDRAW) return;
	const wait = AllSpeak.domain && AllSpeak.domain.core && AllSpeak.domain.core.Wait;
	if (!wait || typeof wait.run !== `function`) {
		process.stderr.write(`plotview-check: no \`Wait\` in the core domain to stand down\n`);
		return;
	}
	wait.run = program => {
		const command = program[program.pc];
		program.run(command.pc + 1);
		return 0;
	};
};
// Writing a variable the view owns, from the host side, is what `viewVar` already does for reading — and
// it is the only way to clip a big recording *before* the load-time drawings, because the host half of the
// compiled script sits above the view's own declarations and cannot name them. The shape is the runtime's
// own (`Core.Put`), so what this writes is exactly what `put 300 into VizClipTo` would have written.
const setViewVar = (name, number) => {
	const record = program && program.getSymbolRecord(name);
	if (!record) throw new Error(`the view declares no '${name}'`);
	record.value[record.index] = { type: `constant`, numeric: true, content: number };
};
// And reading one, here rather than through the `viewVar` the checks use: that one is declared much lower
// down, and this file's measurement block runs at load time, where reaching for it is a `ReferenceError`
// (the second time this file has been caught by its own declaration order, and the reason the first
// attempt at this measurement looked slow — the throw landed in the catch and the phases then ran).
const readViewVar = name => {
	const record = program && program.getSymbolRecord(name);
	if (!record) throw new Error(`the view declares no '${name}'`);
	const v = record.value && record.value[record.index];
	return v ? v.content : undefined;
};

const script = [
	`! the host: the panel the view draws in, the trace it is given, and the script behind it`,
	`    div VizHost`,
	`    variable VizTrace`,
	`    variable VizSource`,
	`Main:`,
	`    create VizHost in body`,
	`    put \`${trace}\` into VizTrace`,
	`    put \`${source}\` into VizSource`,
	`    gosub Draw`,
	`    gosub Draw          ! twice, on purpose: a redraw must not add a second set of elements`,
	`    stop`,
	`! The two things the picture and the window are built from, changed from a phase — so a check can`,
	`! tell a redraw from a change. The recording is the same recording with a space on the end: a`,
	`! different file, the same run.`,
	`SetBriefSource:`,
	`    put \`${editedSource}\` into VizSource`,
	`    return`,
	`TweakTrace:`,
	`    put VizTrace cat \` \` into VizTrace`,
	`    return`,
	view,
].join(`\n`);

let program = null;
try {
	program = AllSpeak.compileScript(AllSpeak.tokeniseFile(script.split(`\n`)), null, null, null);
	standDownTheWait();
	program.running = true;
	const out = process.stdout.write.bind(process.stdout);
	console.log = (...a) => out(a.join(` `) + `\n`);
	const at = name => {
		const record = program.symbols[name];
		if (!record) throw new Error(`the view exposes no '${name}'`);
		AllSpeak_Run.run(program, record.pc);
	};
	const drawClock = Date.now();
	AllSpeak_Run.run(program, 0);
	// The second of the load's drawings is the one the pane's own clock has just written, so it is the
	// unclipped figure — a redraw with pass one gated, which is what a gesture costs.
	const whole = Number(readViewVar(`DrawMillis`));
	if (clipFirst) {
		// The window is the selector, so the range is chosen by giving the pane a window and calling the
		// entry: `VizViewXW` is the width, and `VizClip` takes the last step as `from + width - 1`.
		setViewVar(`VizViewX0`, clipFirst[0]);
		setViewVar(`VizViewXW`, clipFirst[1] - clipFirst[0] + 1);
		at(`VizClip`);
		const clippedFirst = Number(readViewVar(`DrawMillis`));
		at(`Draw`);
		const clippedThen = Number(readViewVar(`DrawMillis`));
		process.stdout.write(`clip ${clipFirst[0]}-${clipFirst[1]}: whole ${whole} ms, `
			+ `the drawing that applies it ${clippedFirst} ms, and a redrawing of it ${clippedThen} ms\n`);
	}
	if (process.env.PLOTVIEW_ONEDRAW) {
		const ms = Date.now() - drawClock;
		process.stdout.write(`load and both drawings: ${ms} ms for ${trace.length} bytes = `
			+ `${(ms * 1024 / trace.length).toFixed(2)} ms/KB\n`);
		process.exit(0);
	}
} catch (err) {
	process.stderr.write(`FAIL: ${String(err.message || err).split(`\n`)[0]}\n`);
	if (err && err.stack) process.stderr.write(String(err.stack).split(`\n`).slice(0, 6).join(`\n`) + `\n`);
}

// The module's host is the *panel*, and it is the only box the view reads. Set after the run, because
// the attach happens inside it and the gestures — the only things that measure — come later.
//
// **The element is found through the view's own symbol, not by the page's id.** It used to be looked up
// as `se-graph-area` — the id the editor's page gives the pane's host — and the page's elements are not
// created here, so the lookup found nothing, the box stayed at the stub's default and *the letterbox
// this fixture's own comment says is 247 was always zero*. It cost nothing visible, because the two
// offsets cancel: the view subtracts the host's corner and `toClient` below adds it back. That is
// exactly why it is worth fixing rather than leaving — the fixture could not have told anyone — and it
// matters now that the panel is the graph area *less the sidebar*, so its width is a number the
// sidebar's cost is measured in.
if (program) {
	const hostRecord = program.getSymbolRecord(`VizHost`);
	const hostEl = hostRecord && hostRecord.element && hostRecord.element[0];
	if (!hostEl) {
		process.stderr.write(`plotview-check: the view has no panel element — the fixture's two boxes `
			+ `would not be applied, so nothing below would mean what it says.\n`);
		process.exit(1);
	}
	hostEl.box = PANEL;
}

// Report once the drawing has stopped changing, not when `run` returns.
//
// The view yields to the browser every hundred marks (`wait 1 millis`), and a `wait` resumes from a
// timer — so `AllSpeak_Run.run` returns with the picture half drawn and the rest of it arrives a
// tick later. Reporting there describes that half-drawn state as though it were the whole answer:
// it is what made Graham's 44-arrival recording look like it drew *nothing*, because its 147 events
// cross the yield threshold while a nine-event fixture never does. A settle detector rather than a
// fixed delay, since how many times the view yields depends on the size of the recording.
//
// The same detector drives the gestures. A gesture redraws, and the redraw may yield, so one cannot
// simply be called after the other: each waits for the picture to settle before the next is fired.
// The gestures are entered through the view's own entry points (`VizGrab`, `VizPan`, `VizWheel`,
// `VizReset`) with the DOM values a browser would have set, so what is exercised is the shipped path
// rather than a private one.
// The frame's geometry in the drawing's own viewBox units, which several checks below need to turn a
// coordinate back into a line or a column. It is the pane's frame: 60,60 to 940,640 in a 1000x740
// canvas, and eighteen units to a row.
const FRAME_TOP = 60;
const FRAME_WIDTH = 880;
const FRAME_HEIGHT = 580;
const LEGIBLE_ROWS = Math.floor(FRAME_HEIGHT / 18);   // the row count at which the text is its own size

const drawing = () => {
	const paths = Object.values(byId).filter(e => e.tagName === `path`);
	const texts = Object.values(byId).filter(e => e.tagName === `text` || e.tagName === `svgtext`);
	// Every coordinate the picture contains, so a phase can be checked for staying inside the frame.
	// The fit used to guarantee that on its own; a window is what can break it, and a mark outside
	// the frame lands on the axis.
	const inFrame = [], inFlow = [];
	// **A third coordinate system, and it is the source's own.** `VizPane` is a nested viewport whose
	// `viewBox` is the *document* — eighteen units to a row and eight to a column — so anything drawn
	// inside it is in document units and scaled by the browser into the frame. The redaction lives there,
	// beside the very text it covers, which is exactly why it needs no re-rendering on a zoom. The frame's
	// test can therefore say nothing about it, and asking it to would have failed on a picture that is
	// right: the whole point of the layer is that its coordinates are the file's, not the canvas's.
	const paneEl = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizPane`));
	const insidePane = p => !!paneEl && (paneEl.children || []).includes(p);
	for (const p of paths) {
		if (insidePane(p)) continue;
		const isFlow = /Flow/.test(String(p.attributes.id || ``));
		for (const pair of (p.attributes.d || ``).matchAll(/([0-9.-]+) ([0-9.-]+)/g)) {
			const x = Number(pair[1]);
			const y = Number(pair[2]);
			(isFlow ? inFlow : inFrame).push([x, y]);
		}
	}
	// **The frame bounds what is clipped to it, and the flow is not.** The plot is a nested viewport, so a
	// transfer whose other end is off-screen is now drawn at its true position and cut off by the mask —
	// which is the whole point of drawing it, and means its coordinates leave the frame on purpose. So the
	// two are measured apart: everything else must stay inside the canvas, and the flow is *expected* to
	// leave it in the phases where the run is sliced.
	const extent = points => (points.length
		? [Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0])),
			Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[1]))]
		: [0, 0, 0, 0]);
	const [lowX, highX, lowY, highY] = extent(inFrame);
	const [fLowX, fHighX, fLowY, fHighY] = extent(inFlow);
	const bounds = inFrame.length
		? `x ${lowX}-${highX}, y ${lowY}-${highY}`
		: `nothing drawn`;
	// The source's picture, and the pane it is shown through. The pane is a nested `<svg>` the size of
	// the frame, which is the clipping; the picture inside it is drawn once at the size the text is
	// written at; and the pane's `viewBox` is the whole of the zoom and the pan. All three are
	// reported, because "one drawing, zoomed and panned" is the claim and each part of it can fail on
	// its own.
	const dOf = id => {
		const e = Object.values(byId).find(x => String(x.attributes.id || ``).startsWith(id));
		return (e && e.attributes.d) || ``;
	};
	// Every y a path draws at. `M x y h…` and `L x y` both carry it, and the `h`/`l` forms do not,
	// so this reads a path's rows without caring which command produced them.
	const ysIn = d => [...d.matchAll(/[ML]([0-9.]+) ([0-9.]+)/g)].map(m => Number(m[2]));
	const flow = [`ec-VizFlowCall`, `ec-VizFlowJump`, `ec-VizFlowReturn`].map(dOf);
	const ruleYs = ysIn(dOf(`ec-VizRules`));
	// Each rule as it is drawn: `M x y h width` — where it begins, which line it sits on, and how far
	// it runs. All three are the feature: a rule is a leader from one line of code to the marks.
	const rules = [...dOf(`ec-VizRules`).matchAll(/M([0-9.]+) ([0-9.]+)h([0-9.]+)/g)]
		.map(m => ({ x: Number(m[1]), y: Number(m[2]), w: Number(m[3]) }));
	// A transfer is written as a segment (`M x y L x y2`) and, unless both its ends are on the same
	// line, a head (`M x-5 hy L x y2 L x+5 hy`). So a group of two points is a segment and its ends are
	// the transfer's own; a group of three is a head, whose outer points are the wings of the chevron
	// and not places the transfer goes. Only the segments' ends are collected here, for that reason.
	const segEnds = flow.flatMap(d => [...d.split(`M`).slice(1)]
		.map(g => [...g.matchAll(/([0-9.]+) ([0-9.]+)/g)].map(m => Number(m[2])))
		.filter(ys => ys.length === 2)
		.flatMap(ys => ys));
	const markYs = [`ec-VizHeat0`, `ec-VizHeat1`, `ec-VizHeat2`, `ec-VizHeat3`].flatMap(id => ysIn(dOf(id)));
	const pane = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizPane`));
	// Two images now — the source's picture and the diagnostic's copy of the label lines — so the source's
	// is picked by its id rather than by being the only one.
	const picture = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizGlyphs`));
	const href = (picture && picture.attributes.href) || ``;
	const annotation = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizLabelText`));
	const annHref = (annotation && annotation.attributes.href) || ``;
	let annDoc = ``;
	try {
		annDoc = annHref ? decodeURIComponent(annHref.slice(annHref.indexOf(`,`) + 1)) : ``;
	} catch (err) { /* reported as no document */ }
	const notes = [...annDoc.matchAll(/<text x="([0-9.]+)" y="([0-9.]+)"[^>]*>([^<]*)<\/text>/g)]
		.map(m => ({ x: Number(m[1]), y: Number(m[2]), text: m[3] }));
	const viewBox = (pane && pane.attributes.viewBox) || ``;
	const box = viewBox.trim().split(/\s+/).map(Number);
	// The y-axis ticks, as "line → where the axis says it is". They are the picture's yardstick: the
	// document's rows and the axis have to be the same grid, which is the whole claim the feature
	// makes and the one a sign error breaks invisibly.
	const ticks = texts
		.filter(t => String(t.attributes.id || ``).startsWith(`ec-VizYLabel`))
		.filter(t => String(t.innerHTML).trim() !== ``)
		.map(t => ({ line: Number(t.innerHTML), y: Number(t.attributes.y) }));

	return {
		marks: paths.map(p => [p.attributes.id, ((p.attributes.d || ``).match(/M/g) || []).length]),
		// The marks by layer, with their places: the ramp is a claim about *where* a colour appears,
		// so a count per layer cannot check it and the coordinates can.
		heat: [`ec-VizHeat0`, `ec-VizHeat1`, `ec-VizHeat2`, `ec-VizHeat3`].map((id, band) =>
			[...dOf(id).matchAll(/[ML]([0-9.]+) ([0-9.]+)/g)].map(m => ({ band, x: Number(m[1]), y: Number(m[2]) }))),
		labels: texts.map(t => `${t.attributes.id} = "${t.innerHTML}"`),
		bounds,
		framed: inFrame.length === 0 || (lowX >= 0 && highX <= 1000 && lowY >= 0 && highY <= 740),
		flowBounds: inFlow.length ? `x ${fLowX}-${fHighX}, y ${fLowY}-${fHighY}` : `nothing drawn`,
		flowOutside: inFlow.some(p => p[1] < FRAME_TOP || p[1] > FRAME_TOP + FRAME_HEIGHT),
		picture: picture
			? `drawn at ${picture.attributes.width}x${picture.attributes.height}, href=${href.length} chars, ${(href.match(/<tspan/g) || []).length} row(s); window ${viewBox || `(none)`}`
			: `no picture element`,
		pane: pane ? {
			x: Number(pane.attributes.x), y: Number(pane.attributes.y),
			width: Number(pane.attributes.width), height: Number(pane.attributes.height),
		} : null,
		viewBox,
		box,
		flow,
		notes,
		annHref,
		rules,
		segEnds,
		flowMarks: flow.map(d => (d.match(/M/g) || []).length),
		ruleYs,
		markYs,
		rows: (href.match(/<tspan/g) || []).length,
		// The redaction, as drawn: one bar per line that shows anything, in the document's own units —
		// plus the `transform` that pins its width while the zoom moves.
		redact: dOf(`ec-VizRedact`),
		redactScale: (() => {
			const el = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizRedact`));
			const m = el && /scale\(([0-9.]+) 1\)/.exec(String(el.attributes.transform || ``));
			return m ? Number(m[1]) : null;
		})(),
		ticks,
		// The status line is the one that says which lines the *window* is on; the caption says which
		// lines the *recording* covered, and they are different things — a check that read the caption
		// as the window would report a window that never moves.
		// The status is `<zoom x N% y M%>  <first>-<last>` where the last is the first plus the
		// window's *height*, so it is one past the last line on screen. That is the view's own
		// convention and the span below uses the difference for it; the number printed is what it is.
		lines: (() => {
			const status = texts.find(t => String(t.attributes.id || ``).startsWith(`ec-VizStatus`));
			const m = /(\d+)-(\d+)\s*$/.exec(String((status || {}).innerHTML || ``));
			return m ? [Number(m[1]), Number(m[2])] : null;
		})(),
		// **What the pane says about the mark under the pointer**, on a line of its own under the status
		// line. Read with the view's own variables beside it, so this is a known-answer check rather than
		// one output compared with another: the words have to agree with the counts they name.
		hit: String((texts.find(t => String(t.attributes.id || ``).startsWith(`ec-VizHitStatus`)) || {}).innerHTML || ``),
		// ...and the counts it was built from, read here rather than at the check: a press clears them when
		// the next press's walk starts, and the checks below press more marks on the way past.
		hitLine: viewVar(`VizHit`),
		hitVisit: viewVar(`VizHitVisit`),
		hitTotal: viewVar(`VizHitTotal`),
		handles: { v: boxOf(`ec-VizHandleV`), h: boxOf(`ec-VizHandleH`) },
		// **The clip bar as drawn**: the two markers' x and the band. Kept in the snapshot rather than
		// read off the DOM at the check, because the phases after this one move the markers again and
		// the live DOM is then a different picture — the same reason the press checks keep their phase.
		clipBar: [`ec-VizClipMarkIn`, `ec-VizClipMarkOut`, `ec-VizClipBand`,
			`ec-VizClipGuideIn`, `ec-VizClipGuideOut`, `ec-VizClipMaskIn`, `ec-VizClipMaskOut`].map(id => {
			const el = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(id));
			return { id, x: el ? Number(el.attributes.x) : null, w: el ? Number(el.attributes.width) : null };
		}),
		steps: texts
			.filter(t => String(t.attributes.id || ``).startsWith(`ec-VizXLabel`))
			.map(t => Number(t.innerHTML))
			.filter(n => !Number.isNaN(n)),
		href,
		raw: JSON.stringify([
			paths.map(p => p.attributes.d),
			// **The mark's own report is left out, and it is the one thing a press is *for* changing.** The
			// rest of the snapshot has to be byte-identical across a press — that is the property the checks
			// below rest on — and the figures on the pane's foot are the news a press produces, so including
			// them here would make the check fail for doing its job. Moved to the pane on 2026-10-05.
			//
			// **And the working readout, for the same reason in another place.** It says what the last
			// drawing cost, and consecutive phases are drawings of different costs — so it changes between
			// any two of them and would make "the picture is byte-identical across the press" false for a
			// reason that has nothing to do with the picture. It is a measurement *about* the pane, not
			// part of what the pane shows.
			//
			// **And the clip notice, which a drag *is* allowed to move.** It names the range being
			// dragged, so it changes while the marker moves — by attribute write, like the marker itself,
			// which is also outside this snapshot. Leaving it in would make "the drag redrew nothing"
			// fail for the feedback the drag exists to give: what that check is about is the *picture*
			// (marks, rules, flow, axis, source, status), and that is what it still compares.
			texts.filter(t => {
				const id = String(t.attributes.id || ``);
				return !id.startsWith(`ec-VizHitStatus`) && !id.startsWith(`ec-VizBusy`)
					&& !id.startsWith(`ec-VizClipNotice`);
			})
				.map(t => [t.attributes.x, t.attributes.y, t.innerHTML]),
			picture ? [picture.attributes.x, picture.attributes.y, picture.attributes.width, picture.attributes.height] : null,
		]),
	};
};

// The drawn box of one of the scrollbar handles, by its id prefix — the numbers the view wrote, which
// are the whole of what these checks compare against.
const boxOf = prefix => {
	const el = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(prefix));
	return el ? {
		x: Number(el.attributes.x), y: Number(el.attributes.y),
		width: Number(el.attributes.width), height: Number(el.attributes.height),
	} : null;
};

const entry = name => {
	const record = program && program.symbols && program.symbols[name];
	if (!record) throw new Error(`the view exposes no '${name}'`);
	AllSpeak_Run.run(program, record.pc);
};
// The gestures, in the order they are fired. Nothing is asserted here — the check is the report:
// what the fitted picture is, and what each gesture did to it.
//
// **Two notches in and two out must land exactly on the fit**, which is the strongest statement the
// harness can make, because it exercises the mapping in both directions and the clamp as well. The
// two steps are exact inverses for that reason: in shrinks the window by a fifth and out grows it by
// a quarter.
//
// **The axes are marked separately** — shift for the lines, control for the steps — so the phases do
// each on its own, and a later check asks whether the other axis stayed exactly where it was. Wiring
// both to one modifier would pass every other check in this file.
//
// **The gestures that move rather than scale come after a zoom**, and that is not incidental: a
// window fitted to the whole run cannot scroll or pan anywhere, because the clamp stops it at the
// edges on the first notch. A run of a few hundred lines hides that; a twenty-line fixture makes it
// the whole story, which is why the phases zoom in first.
const wheelWith = (amount, shift, control) => {
	global.document.wheelAmount = amount;
	global.document.wheelShift = shift;
	global.document.wheelControl = control;
	entry(`VizWheel`);
};
const linesIn = () => wheelWith(-120, 1, 0);
const linesOut = () => wheelWith(120, 1, 0);
const stepsIn = () => wheelWith(-120, 0, 1);
const stepsOut = () => wheelWith(120, 0, 1);
const scrollDown = () => wheelWith(120, 0, 0);
// Both modifiers, which is the gesture that scrolls *across* the run — the one thing the wheel could
// not do before this, since the run's time axis could only be moved by a drag. Named for the
// modifiers rather than for the axis, because "the steps" is already the name of a zoom.
const scrollRight = () => wheelWith(120, 1, 1);
const scrollLeft = () => wheelWith(-120, 1, 1);

// ---- the scrollbars, driven the way a reader drives them ----
// The press is given in the *drawing's* units and converted here, because that conversion is the thing
// the view has to do for itself and this is the check that it did it: 949 is inside the lines handle,
// which is ten units wide from 944, and 651 is inside the steps handle, which is ten tall from 646.
const pressAt = (x, y) => {
	const [cx, cy] = toClient(x, y);
	global.document.pickX = cx; global.document.pickY = cy;
	entry(`VizGrab`);
	return [cx, cy];
};
// **A press on a mark, which is the whole of the sidebar's input.** The mark's place is read off the
// drawn path rather than recomputed, so the press lands where the dot actually is — which is all a
// reader does. And every mark's place is collected too, for the check that a press *away* from all of
// them names nothing.
const MARK_LAYERS = [`ec-VizHeat0`, `ec-VizHeat1`, `ec-VizHeat2`, `ec-VizHeat3`];
const drawnById = id => {
	const el = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(id));
	return el ? String(el.attributes.d || ``) : ``;
};
const marksById = id => [...drawnById(id).matchAll(/[ML]([0-9.]+) ([0-9.]+)/g)]
	.map(m => [Number(m[1]), Number(m[2])]);
const allMarks = () => MARK_LAYERS.flatMap(marksById);
const markPlace = () => allMarks()[0] || null;
// How many marks a phase drew — the four heat layers together. Read from the phase's own snapshot
// rather than from the live DOM, so a phase earlier in the list can still be asked about after the
// phases that follow it have redrawn the picture. The clip's check rests on this.
const markCount = st => (st && st.heat ? st.heat.flat().length : -1);
// The pane's status line as text, out of a phase's snapshot of the text elements. It is how a phase
// says whether it is clipped, and what range it is showing.
const noticeOf = st => {
	const line = ((st && st.labels) || []).find(l => l.startsWith(`ec-VizClipNotice-`)) || ``;
	const m = /ec-VizClipNotice-\d+ = "(.*)"$/.exec(line);
	return m ? m[1] : ``;
};
const statusOf = st => {
	const line = ((st && st.labels) || []).find(l => l.startsWith(`ec-VizStatus-`)) || ``;
	const m = /ec-VizStatus-\d+ = "(.*)"$/.exec(line);
	return m ? m[1] : ``;
};
// A view variable by name, read the way `asedit-modes-check` reads the editor's: the report compares
// what the view *drew*, and the one thing a press leaves behind is a number it keeps.
const viewVar = name => {
	const record = program && program.getSymbolRecord(name);
	if (!record) throw new Error(`the view declares no '${name}'`);
	const v = record.value && record.value[record.index];
	return v ? v.content : undefined;
};
const dragTo = (cx, cy) => {
	global.document.dragX = cx; global.document.dragY = cy;
	entry(`VizDrag`);
};
const handleSize = axis => Number(boxOf(`ec-VizHandle` + axis)[axis === `V` ? `height` : `width`]);
// A pointer movement of a fraction of the bar's travel — one bar being one windowful of content, since
// the mapping is the ratio of the run to the window. Three quarters of a travel is the slope check and
// three times it is the clamp: the numbers are arranged so that the first cancels exactly, and the
// second cannot overshoot because reaching the end of the run is a clamp rather than an accident.
const dragLinesBy = fraction => {
	const size = handleSize(`V`);
	const cy = Number(boxOf(`ec-VizHandleV`).y) + size / 2;
	const [cx] = pressAt(949, cy);
	dragTo(cx, cy + Math.round((580 - size) * SCALE * fraction));
};
const slideLinesByTravel = () => dragLinesBy(1);
const slideLinesHalfTravel = () => dragLinesBy(0.5);
const slideLinesPastTheEnd = () => dragLinesBy(3);
const slideStepsByTravel = () => {
	const size = handleSize(`H`);
	const cx = Number(boxOf(`ec-VizHandleH`).x) + size / 2;
	const [, cy] = pressAt(cx, 651);
	dragTo(cx + Math.round((880 - size) * SCALE), cy);
};
const pressTroughAndDrag = () => {
	// The trough, not the handle: four units below the top of the bar, which the handle clears once the
	// window has moved off the top of the run — and the phase before this one dragged it to the bottom.
	// The movement is a large one because a pan is one drawing unit per pointer unit: on the short
	// recording's steps axis a small drag is a fraction of a step, and truncation then leaves the axis
	// where it was for a reason that has nothing to do with the hit test.
	const [cx, cy] = pressAt(949, 64);
	dragTo(cx - 140, cy + 180);
};

// ---- the clip bar, driven the way a reader drives it ----
// The marker's own place on the bar: the rect is four units wide and the view centres it on the step it
// names, so the step's x is the box's x plus two. Read off the drawn rect rather than recomputed, which
// is what a reader's pointer actually meets.
const markerStepX = which => {
	const box = boxOf(`ec-VizClipMark${which}`);
	return box ? box.x + 2 : null;
};
const CLIP_STRIP_Y = 41;   // inside the strip above the plot: the markers are drawn 31..51
// Press a marker, drag it to a place on the bar, and **let go** — and the release is the whole of it.
// `VizRelease` is what applies the range: a drag on its own moves the marker and nothing else, which is
// why the phases above hold the two halves apart rather than hiding them in here.
const dragClipMarker = (which, toX) => {
	const cx = markerStepX(which);
	if (cx === null) throw new Error(`the ${which} clip marker was not drawn`);
	pressAt(cx, CLIP_STRIP_Y);
	const [dx, dy] = toClient(toX, CLIP_STRIP_Y);
	dragTo(dx, dy);
	entry(`VizRelease`);
};

const PHASES = [
	{ name: `fitted`, act: null },
	{ name: `shift-wheel (lines) in`, act: linesIn },
	{ name: `shift-wheel (lines) in again`, act: linesIn },
	{ name: `shift-wheel (lines) out`, act: linesOut },
	{ name: `shift-wheel (lines) out again (back to the fit)`, act: linesOut },
	{ name: `control-wheel (steps) in`, act: stepsIn },
	{ name: `control-wheel (steps) in again`, act: stepsIn },
	{ name: `control-wheel (steps) out`, act: stepsOut },
	{ name: `control-wheel (steps) out again (back to the fit)`, act: stepsOut },
	{ name: `control-wheel (steps) in`, act: stepsIn },
	{ name: `control-wheel (steps) in`, act: stepsIn },
	{ name: `control-wheel (steps) in (a window with room across)`, act: stepsIn },
	{ name: `shift-wheel (lines) in`, act: linesIn },
	{ name: `shift-wheel (lines) in`, act: linesIn },
	{ name: `shift-wheel (lines) in (and room down)`, act: linesIn },
	{ name: `wheel alone: scroll down`, act: scrollDown },
	{ name: `wheel alone: scroll down again`, act: scrollDown },
	// **Both modifiers down, which is now ignored.** It was the scroll-across for a day and the accidental
	// two-at-once zoom before that; Graham asked for the pair to go, having found the modifier gestures
	// over-weighted. So these two phases fire the pair and assert that *nothing* happens — no scroll, no
	// zoom, and in particular not the both-axes zoom that comes back the moment the special case is
	// deleted rather than made to do nothing.
	{ name: `shift+control-wheel, both modifiers: ignored`, act: scrollRight },
	{ name: `shift+control-wheel again: still ignored`, act: scrollLeft },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, to the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in (and one past it)`, act: linesIn },
	{ name: `shift-wheel (lines) in, at the floor`, act: linesIn },
	{ name: `shift-wheel (lines) in, at the floor`, act: linesIn },
	{ name: `drag: grab at 400,300 and move to 200,150`, act: () => {
		global.document.pickX = 400; global.document.pickY = 300; entry(`VizGrab`);
		global.document.dragX = 200; global.document.dragY = 150; entry(`VizPan`);
	} },
	{ name: `drag: move on to 100,100`, act: () => {
		global.document.dragX = 100; global.document.dragY = 100; entry(`VizPan`);
	} },
	// A plain redraw, which is what coming back to the pane now is. The host no longer re-fits on
	// entry — the view decides from the recording — so this must land exactly where the last gesture
	// left the window.
	{ name: `a redraw, as returning to the pane is`, act: () => { entry(`Draw`); } },
	{ name: `VizReset, for a host that wants the window fitted afresh`, act: () => { entry(`VizReset`); entry(`Draw`); } },
	// Zoomed in again, so that the two input changes below are judged with a window that is *not* the
	// fit — otherwise "it re-fitted" would be indistinguishable from "it never moved".
	{ name: `shift-wheel (lines) in, before the inputs change`, act: linesIn },
	{ name: `the script is edited`, act: () => { entry(`SetBriefSource`); entry(`Draw`); } },
	{ name: `the recording changes`, act: () => { entry(`TweakTrace`); entry(`Draw`); } },
	{ name: `the fit again, for the bars`, act: () => entry(`VizReset`) },
	{ name: `at the fit: grab the lines handle and drag it the length of its travel`, act: slideLinesByTravel },
	{ name: `zoomed in, with somewhere to drag to`, act: linesIn },
	{ name: `zoomed in again`, act: linesIn },
	{ name: `grab the lines handle and drag it down half its travel`, act: slideLinesHalfTravel },
	{ name: `grab the lines handle and drag it down well past the end`, act: slideLinesPastTheEnd },
	{ name: `the steps axis, zoomed in so its handle has somewhere to go`, act: stepsIn },
	{ name: `the steps axis, zoomed in again`, act: stepsIn },
	{ name: `grab the steps handle and drag it along by its own travel`, act: slideStepsByTravel },
	{ name: `grab the trough beside the lines handle and drag: the picture pans`, act: pressTroughAndDrag },
	// **A press on a mark, which is the whole of the sidebar's input.** A phase rather than a check
	// afterwards, because it also has to be shown to change *nothing on screen*: the picture is the
	// picture and the selection is a panel beside it. That comparison is made in the checks below
	// against this phase and the one before it — **not** by the "one picture, drawn once" check, which
	// stops at the script edit and so never sees this far down the list. It is last, so the line it
	// leaves behind is the one the checks below read.
	{ name: `a press on a mark: it names its line and changes nothing`, act: () => {
		const place = markPlace();
		if (!place) throw new Error(`no mark was drawn to press on`);
		pressAt(place[0], place[1]);
	} },
	// **The clip, and it is last on purpose.** A phase that moves the window has to go after every
	// check that reads it — the press phase above reads the picture the press left, and the checks
	// below now find it *by name* for exactly this reason. Two phases: a clip, and the unclip that
	// gives the recording back.
	//
	// **The steps axis is zoomed in first, and that is the lesson this pair was written from.** The
	// phases end at the fit, and a clip taken at the fit is a clip to the whole run — a no-op by
	// design. The first version of this check did not narrow the window first, read `242 then 242`,
	// and the clip was reverted as broken when it was the *question* that was broken. Narrowing
	// first is what makes "fewer marks" a claim about the clip rather than about the fixture.
	{ name: `the steps axis, zoomed in, so a clip is not the whole run`, act: stepsIn },
	{ name: `clipped to the window`, act: () => entry(`VizClip`) },
	{ name: `unclipped, so the whole recording is back`, act: () => entry(`VizUnclip`) },
	// **The bar, which is the control a person actually has.** It is last of all for the same reason the
	// clip pair is: it moves the window. The drag and the drop are two phases on purpose — between them
	// the picture must be *unchanged*, and that the marker moved anyway is what says the drag costs no
	// drawing. See the checks below.
	{ name: `the clip bar: grab the OUT marker and drag it in, without letting go`, act: () => {
		const cx = markerStepX(`Out`);
		if (cx === null) throw new Error(`the OUT clip marker was not drawn to grab`);
		pressAt(cx, CLIP_STRIP_Y);
		const [dx, dy] = toClient(400, CLIP_STRIP_Y);
		dragTo(dx, dy);
	} },
	{ name: `the clip bar: let go, which applies the range`, act: () => entry(`VizRelease`) },
	{ name: `the clip bar: drag the marker home and let go, which clears the clip`, act: () => dragClipMarker(`Out`, 940) },
];

// **What each gesture cost.** Reported rather than asserted, because the pane's cost is a property of the
// recording and the machine, not of correctness — and because the split it decides was proposed from reading
// the code, which has already been wrong twice in this file's history. `-- gestures` prints it.
const GESTURE_REPORT = process.env.PLOTVIEW_GESTURES === `1`;
const taken = [];
// When the phase's gesture was issued, so the settled picture that follows it can be charged to it. Module
// scope rather than the loop body: the phase's own `act` runs after the *previous* one has settled, and the
// figure wanted here is how long the picture took to catch up with it.
let actClock = 0;
let phase = 0;
let lastSnapshot = null;
let quietTicks = 0;
let sawChange = false;
const settle = setInterval(() => {
	const now = JSON.stringify(Object.values(byId).map(e => [e.tagName, e.attributes.d, e.innerHTML]));
	// The first observation is not a change: comparing against "nothing seen yet" would set
	// `sawChange` before the drawing had done anything, which is the same mistake in a new place.
	if (lastSnapshot !== null) {
		if (now === lastSnapshot) {
			quietTicks++;
		} else {
			quietTicks = 0;
			sawChange = true;
		}
	}
	lastSnapshot = now;
	// A draw blanks the picture first and writes it again at the end of the pass, and it yields
	// between the two — so a *blank* DOM is not a settled one, and counting quiet ticks alone
	// declared a big recording finished before it had started. Having seen the picture change at
	// least once is what tells the two apart. The long stop is the way out of a phase whose gesture
	// was clamped and so redrew exactly what was already there: without it that phase would hang,
	// and two seconds of stillness is longer than any draw these fixtures produce.
	if (!((sawChange && quietTicks >= 4) || quietTicks >= 80)) {
		return;
	}
	// **One drawing, timed, and then stop — `PLOTVIEW_ONEDRAW=1`.** The phases below redraw the picture about
	// fifty times over, which is the right way to exercise the gestures and no way at all to measure a big
	// recording: Graham's 472KB trace never finishes them, and that is the whole complaint. This is the first
	// moment the number means anything — a drawing is atomic, so the run returns when the two load-time
	// drawings are behind it.
	// **The drawing's own number, not this harness's patience.** Reading the wall clock here measures the
	// settle waiting (four quiet ticks at the poll's period, ~3s) far more than it measures the gesture, which
	// is what the first version of this did. `Draw` times itself end to end, gestures included.
	taken.push([PHASES[phase].name, drawing(), viewVar(`DrawMillis`)]);
	phase++;
	if (phase >= PHASES.length) {
		clearInterval(settle);
		report();
		return;
	}
	quietTicks = 0;
	sawChange = false;
	lastSnapshot = null;
	actClock = Date.now();
	try {
		if (PHASES[phase].act) PHASES[phase].act();
	} catch (err) {
		// Not fatal: a view with no gestures at all still has a fitted picture worth reporting, and
		// this is how the version before the viewport is run for comparison.
		process.stderr.write(`FAIL in '${PHASES[phase].name}': ${String(err.message || err).split(`\n`)[0]}\n`);
	}
}, 25);

function report() {
// The gestures, in the order they were fired. Each entry is the picture at that point: the marks in
// each layer, and the axis labels — which are the part that has to follow the window, since a label
// that stays put while the window moves is a label that lies about where it sits.
console.log(`\nThe fitted picture, and what each gesture did to it:`);
for (const [name, state] of taken) {
	console.log(`  ${name}`);
	console.log(`    marks:   ${state.marks.map(([id, n]) => `${id}:${n}`).join(` `)}`);
	console.log(`    inside:  ${state.bounds} ${state.framed ? `(all inside the 1000x740 frame)` : `(OUTSIDE THE FRAME)`}`);
	console.log(`    source:  ${state.picture}`);
	console.log(`    diag:    ${state.notes.length} label name(s)${state.notes.length ? `, first at y=${state.notes[0].y} x=${state.notes[0].x}` : ``}`);
	console.log(`    labels:  ${state.labels.join(` | `)}`);
}
// ---- the ramp ----
// **The marks are a picture of the run warming up, not of its totals.** Each mark's colour is its
// line's own heat, dialled back by how early in the run it happened, so the first mark of any line is
// the coldest colour and a line's marks climb the ramp as that line heats. Two things follow, and both
// are checkable. A picture coloured by totals alone would fail the second, because a hot line would be
// one flat colour; one that ignored the shading would fail both.
const heatMarks = (taken.find(([n]) => n.startsWith(`fitted`)) || [, { heat: [] }])[1].heat.flat();
const layersUsed = new Set(heatMarks.map(m => m.band));
const firstStep = heatMarks.length ? Math.min(...heatMarks.map(m => m.x)) : 0;
// **Every line starts at the coldest colour.** The count behind each mark is the view's own — how many
// times that line has been reached so far — so the first time a line runs its mark is the coldest
// colour, whatever that line goes on to do. A picture coloured by a line's *total* would fail this on
// every hot line, and the first attempt at this, which shaded by the clock instead, would fail it too.
const firstOfEachRow = [];
for (const [y, marks] of (() => {
	const rows = new Map();
	for (const m of heatMarks) {
		if (!rows.has(m.y)) rows.set(m.y, []);
		rows.get(m.y).push(m);
	}
	return rows;
})()) {
	firstOfEachRow.push([...marks].sort((a, b) => a.x - b.x)[0]);
}
const notCold = firstOfEachRow.filter(m => m.band !== 0);
console.log(heatMarks.length && notCold.length === 0
	? `  OK: the first mark of every line is the coldest colour (${firstOfEachRow.length} line(s), ${layersUsed.size} layer(s) in use)`
	: `  FAIL: ${notCold.length} of ${firstOfEachRow.length} line(s) start above the coldest layer: ${notCold.slice(0, 4).map(m => `y=${m.y} band ${m.band}`).join(`; `)}`);

// And within a line the layer never goes backwards as the run proceeds. A row is a line — the picture
// gives every line one y — so the marks sharing a y are that line's own visits, in the order the run
// made them.
const byRow = new Map();
for (const m of heatMarks) {
	if (!byRow.has(m.y)) byRow.set(m.y, []);
	byRow.get(m.y).push(m);
}
const backwards = [];
for (const [y, marks] of byRow) {
	const inOrder = [...marks].sort((a, b) => a.x - b.x);
	for (let i = 1; i < inOrder.length; i++) {
		if (inOrder[i].band < inOrder[i - 1].band) backwards.push(`y=${y}: ${inOrder[i - 1].band} then ${inOrder[i].band}`);
	}
}
const climbing = [...byRow.values()].filter(ms => new Set(ms.map(m => m.band)).size > 1).length;
console.log(backwards.length === 0
	? climbing > 0
		? `  OK: within a line the colour never goes backwards down the ramp, and ${climbing} line(s) visibly climb it (${heatMarks.length} marks over ${byRow.size} line(s))`
		: `  -- no line is visited twice in this window, so no mark can be seen climbing the ramp`
	: `  FAIL: ${backwards.length} line(s) run backwards down the ramp: ${backwards.slice(0, 4).join(`; `)}`);

// ---- the scrollbars ----
// **At the fit each handle fills its bar**, which is the whole of what "at a hundred per cent it is
// immovable" means: the handle *is* the bar, so there is nowhere along the bar for it to go.
const fit = taken[0][1];
const vFit = fit.handles.v, hFit = fit.handles.h;
console.log(vFit && vFit.height === 580 && hFit && hFit.width === 880
	? `  OK: at the fit each handle fills its bar (${vFit.height} of 580 down, ${hFit.width} of 880 along), so neither can be moved`
	: `  FAIL: at the fit the handles are ${vFit && vFit.height} of 580 and ${hFit && hFit.width} of 880 — a handle that does not fill its bar at the fit reports the wrong fraction`);

// **The handle is the window's share of its axis, and where it sits is the window's share of the
// travel.** Every phase, because it is one rule and every window is an instance of it. Two things have
// to agree: the length with the caption's line count over the file's, and the position with how far the
// window's first line has come through the lines it could still move. The minimum handle is allowed for,
// and it only ever makes the handle too *long*; and the travel is the bar *minus the handle* rather than
// the bar, which is the part a naive version gets wrong — the ends of the run put the handle at the ends
// of the bar.
const barsWrong = [];
let barsChecked = 0;
for (const [name, st] of taken) {
	if (!st.handles.v || !st.lines) continue;
	barsChecked++;
	// The view draws one row per line of the source it was given, so `rows` is the extent — and it is the
	// *view's own* number rather than this file's, which matters in the phases where the source has been
	// edited: those are a different, longer file, and a single constant had me chasing a fault that was
	// in the check.
	const fileLines = st.rows;
	const span = st.lines[1] - st.lines[0] + 1;
	const wantSize = Math.max(10, Math.floor(580 * span / fileLines));
	const travel = 580 - wantSize, room = fileLines - span;
	const wantPos = travel === 0 || room === 0 ? 0 : Math.floor((st.lines[0] - 1) * travel / room);
	if (Math.abs(st.handles.v.height - wantSize) > 1 || Math.abs(st.handles.v.y - 60 - wantPos) > 1) {
		barsWrong.push(`${name}: ${st.handles.v.height} long (${wantSize} due) at ${st.handles.v.y - 60} (${wantPos} due), window ${st.lines.join(`-`)} of ${st.rows}`);
	}
}
console.log(barsWrong.length === 0
	? `  OK: the lines handle is the window's share of the run and sits at the window's place in it (${barsChecked} phases)`
	: `  FAIL: the lines handle misreports ${barsWrong.length} of ${barsChecked} phases: ${barsWrong.slice(0, 4).join(`; `)}`);

// **So half a bar of pointer travel is half a window of content, and three times the bar reaches the end
// of the run and stops.** The first is the mapping's slope; the second is the clamp, and it is exact
// rather than approximate because reaching the end is a clamp and not an arithmetic coincidence — which
// is also why it is a better test than a tolerance on a proportional move.
const indexOf = prefix => taken.findIndex(([n]) => n.startsWith(prefix));
const halfAt = indexOf(`grab the lines handle and drag it down half its travel`);
const halfFrom = taken[halfAt - 1][1], halfTo = taken[halfAt][1];
const spanBefore = halfFrom.lines[1] - halfFrom.lines[0] + 1;
const linesBefore = halfFrom.rows;
const predicted = halfFrom.lines[0] + Math.floor((linesBefore - spanBefore) / 2);
console.log(Math.abs(halfTo.lines[0] - predicted) <= 1 && halfTo.lines[0] > halfFrom.lines[0]
	? `  OK: half a bar of pointer travel moves the window half its remaining room (line ${halfFrom.lines[0]} to ${halfTo.lines[0]}, ${predicted} predicted)`
	: `  FAIL: half a bar of travel moved the window to line ${halfTo.lines[0]} where the mapping predicts ${predicted} (from ${halfFrom.lines.join(`-`)} to ${halfTo.lines.join(`-`)})`);
const endState = taken[indexOf(`grab the lines handle and drag it down well past the end`)][1];
console.log(endState.lines[1] === endState.rows
	? `  OK: dragging past the end of the bar leaves the window at the end of the run (its last line is ${endState.lines[1]} of ${endState.rows})`
	: `  FAIL: a drag past the end left the window at ${endState.lines.join(`-`)} where the run's last line is ${endState.rows}`);

// **And at the fit the same drag moves nothing at all.** Not "almost nothing": the bar is the whole of a
// window that is the whole of the run, so there is no travel to give and no room to give it in.
const resetAt = indexOf(`the fit again, for the bars`);
const fitBefore = taken[resetAt][1], fitAfter = taken[resetAt + 1][1];
console.log(JSON.stringify(fitBefore.lines) === JSON.stringify(fitAfter.lines)
	&& fitBefore.viewBox === fitAfter.viewBox
	&& fitBefore.handles.v.height === fitAfter.handles.v.height
	? `  OK: and at the fit a drag of the handle moves nothing — still lines ${fitBefore.lines.join(`-`)} at the same scale`
	: `  FAIL: a drag at the fit moved the window from ${fitBefore.lines.join(`-`)} to ${fitAfter.lines.join(`-`)}`);

// **The handle slides one axis; the trough pans both.** A press on the handle moves the window along its
// own axis and leaves the other exactly where it was; a press on the bar beside the handle is the
// picture's own pan, which moves both. That difference is the whole of what the hit test has to get
// right, and it is why the trough is not a jump-to-page: a jump is the one movement nothing undoes.
const stepsOf = st => (st.steps.length ? [Math.min(...st.steps), Math.max(...st.steps)] : null);
const sameSteps = (a, b) => JSON.stringify(stepsOf(a)) === JSON.stringify(stepsOf(b));
const linesAt = indexOf(`grab the lines handle and drag it down half its travel`);
const stepsAt = indexOf(`grab the steps handle and drag it along`);
const linesFrom = taken[linesAt - 1][1], linesTo = taken[linesAt][1];
const stepsFrom = taken[stepsAt - 1][1], stepsTo = taken[stepsAt][1];
console.log(sameSteps(linesFrom, linesTo) && !sameSteps(stepsFrom, stepsTo)
	? `  OK: a handle drag moves its own axis and leaves the other exactly where it was (the lines bar took the window from lines ${linesFrom.lines.join(`-`)} to ${linesTo.lines.join(`-`)} and the steps stayed at ${JSON.stringify(stepsOf(linesFrom))}; the steps bar took the steps from ${JSON.stringify(stepsOf(stepsFrom))} to ${JSON.stringify(stepsOf(stepsTo))} and the lines stayed at ${stepsFrom.lines.join(`-`)})`
	: `  FAIL: a handle drag crossed axes: lines ${sameSteps(linesFrom, linesTo) ? `held` : `moved`}, steps ${sameSteps(stepsFrom, stepsTo) ? `held` : `moved`}`);
const troughAt = indexOf(`grab the trough beside the lines handle`);
const troughFrom = taken[troughAt - 1][1], troughTo = taken[troughAt][1];
// Both axes only where the other axis has somewhere to go: a steps window that is already the whole run
// is held by its own clamp, and the short recording is nearly that. Its handle filling its bar is what
// says so — the same evidence the fit check uses.
const panRoom = troughFrom.handles.h.width < 880;
const panned = JSON.stringify(troughFrom.lines) !== JSON.stringify(troughTo.lines) && !sameSteps(troughFrom, troughTo);
console.log(panned
	? `  OK: a press on the trough pans the picture on both axes, which is what the trough is for (lines ${troughFrom.lines.join(`-`)} to ${troughTo.lines.join(`-`)}, steps ${JSON.stringify(stepsOf(troughFrom))} to ${JSON.stringify(stepsOf(troughTo))})`
	: panRoom
		? `  FAIL: a press on the trough did not pan both axes: lines ${troughFrom.lines.join(`-`)} to ${troughTo.lines.join(`-`)}, steps ${JSON.stringify(stepsOf(troughFrom))} to ${JSON.stringify(stepsOf(troughTo))}`
		: `  -- the steps window is the whole steps axis here, so a trough press can only move the lines (${troughFrom.lines.join(`-`)} to ${troughTo.lines.join(`-`)})`);

// **The mask is a nested viewport, and this is the half of it a check can hold.** The clipping itself is the
// renderer's, so what is asserted is the structure that makes it happen: a `<svg>` over the frame, with the
// frame in its `viewBox`, holding the rules, the marks and the flow. If those were quietly reparented — or a
// viewBox added to the plot that mapped its contents somewhere else — a transfer drawn past the frame would
// be *painted* over the axis, the key and the caption instead of hidden, and only this would say so before
// it was seen on screen.
const plotId = `ec-VizPlot-0`;
const plot = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(`ec-VizPlot`));
const plotBox = plot ? String(plot.attributes.viewBox || ``) : ``;
// `created` records a child by its tag, because the id is set *after* the element is parented — so the
// count is what identifies the plot's contents: eight paths, which is the rules, the four mark layers and
// the three flow layers, and nothing else parented there.
const inPlot = created.filter(([parent, child]) => parent === plotId && child === `path`).length;
const others = created.filter(([parent, child]) => parent === plotId && child !== `path`).length;
console.log(plot && plot.tagName === `svg` && plotBox.trim() === `60 60 880 580` && inPlot === 8 && others === 0
	? `  OK: the plot is a nested <svg> whose viewBox is the frame holding exactly the rules, the four mark layers and the three flow layers — so what they draw outside the frame is clipped by the mask`
	: `  FAIL: the mask is not the structure it claims: <${plot && plot.tagName} viewBox="${plotBox}"> with ${inPlot} path(s) and ${others} other child(ren)`);

const strays = taken.filter(([, state]) => !state.framed);
console.log(strays.length === 0
	? `  OK: every mark of every phase is inside the frame`
	: `  FAIL: ${strays.length} phase(s) put a mark outside the frame: ${strays.map(([n]) => n).join(`, `)}`);

// The flow, which the recording is the witness for. Each transfer is drawn as a segment plus its
// head — two `M`s — and which of the three paths it lands in is its kind. `branch` is the compiler's
// own `if`/`while`/`wait` jumping about, and it must be in none of them: it is scaffolding, not
// program flow, and drawing it would put machinery into a picture of the run.
//
// The phases that carry a picture are separated out here rather than in the section that reads them,
// because the rules are checked with the flow: a rule's geometry is a statement about a line of code,
// and the flow's ends are statements about a rule.
const fittedState = taken.length ? taken[0][1] : null;
const withPicture = taken.filter(([, state]) => state.href);
if (!fittedState) {
	console.log(`  FAIL: no fitted phase to read`);
} else {
	const drawn = fittedState.flowMarks.reduce((a, b) => a + b, 0);
	const expected = transferKinds.filter(k => k !== `branch`).length * 2;
	const scaffolding = transferKinds.filter(k => k === `branch`).length;
	console.log(drawn === expected
		? `  OK: ${expected / 2} transfer(s) drawn, each as a segment and a head; the ${scaffolding} compiler jump(s) in the recording are in no path`
		: `  FAIL: the flow has ${drawn} mark(s) where the recording accounts for ${expected} (${scaffolding} of its transfers are compiler jumps)`);
	const perKind = [`call`, `jump`, `return`].map((k, i) => `${k}:${fittedState.flowMarks[i] / 2}`);
	console.log(`    by kind: ${perKind.join(` `)}`);

	// And the rules. Two claims, and the second is the one that failed first time round: every line
	// with a mark must have a rule, because that is what a rule is for — and the rules must be the
	// lines the *recording* names, no more. A rule for every line the run executed is a grid drawn
	// over lines with nothing on them, which reads as noise rather than as a guide.
	const missing = [...new Set(fittedState.markYs)].filter(y => !fittedState.ruleYs.includes(y));
	console.log(missing.length === 0
		? `  OK: every mark sits on a rule (${fittedState.ruleYs.length} rules, ${new Set(fittedState.markYs).size} lines marked)`
		: `  FAIL: ${missing.length} marked line(s) have no rule: ${missing.join(`, `)}`);
	const more = fittedState.ruleYs.length - namedLines.size;
	console.log(more === 0
		? `  OK: the rules are exactly the ${namedLines.size} lines the recording names, and nothing else`
		: more > 0
			? `  FAIL: ${more} rule(s) more than the recording names — lines the run only passed through (${fittedState.ruleYs.length} drawn, ${namedLines.size} named)`
			: `  FAIL: ${-more} of the recording's named lines have no rule (${fittedState.ruleYs.length} drawn, ${namedLines.size} named)`);

	// **And every transfer that is drawn begins and ends at a line's own y.** That is the claim the two
	// rejected answers both failed: a clamped end lands on the frame's *border*, which is a y that belongs
	// to no line unless one happens to be there, and an end at anything else arrives nowhere. A rule is
	// drawn only for lines *in view*, so the rule is the right comparison only where the end is inside the
	// frame — an end outside it is beyond the mask and must still be at its own line's y. The head's wings
	// are excluded throughout: they are a chevron's shape and not a place the flow goes.
	const lineY = (s, line) => FRAME_TOP + ((line - 1) * 18 + 9 - s.box[1]) * FRAME_HEIGHT / s.box[3];
	const strays = [];
	let endsChecked = 0;
	let endsOutside = 0;
	for (const [name, s] of taken) {
		for (const y of s.segEnds) {
			endsChecked++;
			const onALine = [...namedLines].some(line => Math.abs(lineY(s, line) - y) <= 1);
			const outside = y < FRAME_TOP || y > FRAME_TOP + FRAME_HEIGHT;
			if (outside) endsOutside++;
			if (!onALine || (!outside && !s.ruleYs.includes(y))) strays.push(`${name} y=${y}`);
		}
	}
	console.log(strays.length === 0
		? `  OK: every transfer begins and ends at a line's own y — ${endsChecked} ends over ${taken.length} phases, ${endsOutside} of them outside the frame and hidden by the mask`
		: `  FAIL: ${strays.length} transfer end(s) are not on a rule: ${strays.slice(0, 6).join(`; `)}`);

	// And the rule *bites*: at the fit every transfer the recording holds is in view, and at the legible
	// floor most are not, so the number drawn has to fall. Without that the check above would pass by
	// drawing nothing, which is the other way to have no line ending in mid-air.
	// **And a crossing transfer is drawn, not dropped — the shoulders of the check above.** Much of a chain
	// recording is *legitimately* left out at a zoom, because a transfer wholly above or wholly below the
	// window is nowhere in the picture; what must not be left out is one that *crosses* it, and the evidence
	// is the ends measured outside the frame. A count comparison would be the wrong instrument: on this
	// trace most transfers are wholly outside a thirty-two row window, so the number drawn falls by design.
	const floorHit = taken.find(([n]) => n.startsWith(`shift-wheel (lines) in, to the floor`));
	const sliced = floorHit ? floorHit[1].segEnds.filter(y => y < FRAME_TOP || y > FRAME_TOP + FRAME_HEIGHT).length : 0;
	const drawnAtFloor = floorHit ? floorHit[1].segEnds.length / 2 : 0;
	console.log(sliced > 0
		? `  OK: and at a zoom the transfers that cross the frame are drawn in full (${sliced} end(s) beyond it at the legible floor, where ${drawnAtFloor} transfer(s) are drawn at all)`
		: `  -- no transfer crosses the frame at the legible floor in this recording (${drawnAtFloor} drawn), so this fixture cannot show the mask at work`);

	// **Each rule begins one em past the last character of the line it names, and runs to the frame's
	// right edge.** The claim is now checked *forwards*: the recording says which lines have a rule,
	// the fixture's own text says how long each of those lines is, and the mapping says where the line
	// is — so the check predicts a rule and looks for it, rather than reading a rule's coordinates and
	// guessing which line it came from. That matters here because a rule's `y` is the *middle* of its
	// row, so inverting it is one step more fragile than it needs to be.
	//
	// A rule that began at the frame's left edge, which is what it used to do, is tens of units out
	// wherever the line has text on it — and that is the only check here that would notice.
	//
	// The second branch is the one line in the fixture too long to fit the pane at any zoom: its text
	// reaches the frame's edge, so there is nowhere after it for a rule to begin, and the rule falls
	// back to the left edge — across text that is itself cut off. The count says whether that branch was
	// reached, which is what stops this from being a check of one case wearing another's name.
	const drawnLine = n => {
		const text = source.split(`\n`)[n - 1];
		return text === undefined || text.startsWith(`!!`) ? `` : text;
	};
	// The harness's own reading of `VizLabelCheck`, because the right end of a rule depends on it: the
	// name of the label on this line, or null when the line is not one. Two readings of the same rule is
	// the point — an expectation written twice is how the two get compared.
	const labelName = n => {
		const text = source.split(`\n`)[n - 1];
		if (!text || text.startsWith(` `) || text.startsWith(`!`) || !text.endsWith(`:`)) return null;
		return text.slice(0, -1);
	};
	let worstRule = { off: -1 };
	let rulesChecked = 0;
	let overflows = 0;
	let labelRules = 0;
	let clippedSkipped = 0;
	for (const [name, s] of withPicture) {
		if (!s.rules.length || !s.box || !s.box[2] || !s.box[3]) continue;
		// **A clipped phase is left out, and it is the one phase that may not have the rule.** The
		// claim below is that every line the *recording* names has a rule; a clip draws rules for the
		// lines the *range* names, which is a subset, so a clipped phase would fail this for doing
		// exactly what it is for. Its own claim — that it draws no rule the recording does not name —
		// is made in the clip's section.
		if (/clipped to steps/.test(noticeOf(s))) { clippedSkipped++; continue; }
		for (const line of namedLines) {
			// Where the phase's window puts that line: the middle of its row, one row being 18 units.
			const y = FRAME_TOP + ((line - 1) * 18 + 9 - s.box[1]) * FRAME_HEIGHT / s.box[3];
			if (y < FRAME_TOP + 1 || y > FRAME_TOP + FRAME_HEIGHT - 1) continue;   // not in view, or on an edge
			const past = FRAME_TOP + (8 * drawnLine(line).length + 13) * FRAME_WIDTH / s.box[2];
			const want = past > FRAME_TOP + FRAME_WIDTH ? FRAME_TOP : past;
			if (past > FRAME_TOP + FRAME_WIDTH) overflows++;
			// And the right end: the frame's edge, or one em short of the name when the line is a label —
			// the name is drawn at that edge, and the gap is what keeps the two from reading as one line.
			const label = labelName(line);
			if (label !== null) labelRules++;
			const wantEnd = FRAME_TOP + FRAME_WIDTH
				- (label === null ? 0 : (8 * label.length + 13) * FRAME_WIDTH / s.box[2]);
			const hit = s.rules.find(r => Math.abs(r.y - y) <= 1);
			rulesChecked++;
			const off = hit ? Math.max(Math.abs(hit.x - want), Math.abs(hit.x + hit.w - wantEnd)) : Infinity;
			if (off > worstRule.off) {
				worstRule = { off, name, line, got: hit ? `${hit.x}+${hit.w} at y=${hit.y}` : `no rule at y=${Math.round(y)}`, want: `${Math.round(want * 10) / 10}..${Math.round(wantEnd * 10) / 10}` };
			}
		}
	}
	console.log(worstRule.off <= 2
		? `  OK: every rule the recording asks for begins one em past that line's code, and ends at the frame's edge or one em short of a label's name (${rulesChecked} rules over all phases, ${labelRules} of them on a label, worst ${worstRule.off.toFixed(1)} units out; ${overflows} too wide to lead from, so their rules span the frame${clippedSkipped ? `; ${clippedSkipped} clipped phase(s) left out, their rules being the range's lines and not the recording's` : ``})`
		: `  FAIL: a rule is ${worstRule.off} units from where the line's text ends: ${JSON.stringify(worstRule)}`);
	// **The label layer's claim — the half of it a check can make.** It puts each label's name, without its
	// colon, at the frame's right-hand edge on the y the *drawing* gives that line, so that what the eye
	// compares is the picture's own text against the drawing's claim about where the line is. That
	// comparison is what the layer was built for and only an eye can make it; what this can do is say the
	// name is drawn for the right lines and placed where the *rule* for the same line is.
	//
	// The fixture has one label (line 150) and four near-misses, all ending in a colon: two doc blocks, an
	// indented line, and a bare comment. Only the label may be named, and only where the name is big enough
	// to read — the layer deliberately draws nothing when the source's own text is a smudge, so the claim
	// is checked across the phases where it does draw, and *both* directions matter: a phase that should
	// have the name and has not is as wrong as a name where none belongs.
	const labelLine = 150;
	const dropFor = s => Math.floor(5 * FRAME_WIDTH / s.box[2]);
	const labelYFor = s => {
		// The drawing's own arithmetic, mirrored rather than re-derived: `VizPlaceY` adds half a row before
		// dividing and the runtime truncates, so this must truncate in the same place or be a unit out.
		const y0 = 1 + s.box[1] / 18;                    // the picture is the whole file, so its first line is 1
		const rows = s.box[3] / 18;
		return FRAME_TOP + Math.floor(((labelLine - y0) * FRAME_HEIGHT + FRAME_HEIGHT / 2) / rows);
	};
	const readableFor = s => Math.floor((13 * FRAME_WIDTH + s.box[2] / 2) / s.box[2]) >= 4;
	const inWindowFor = s => {
		const first = 1 + s.box[1] / 18;
		return labelLine >= first && labelLine < first + s.box[3] / 18;
	};
	let notesBad = 0;
	let notesSeen = 0;
	let notesPhases = 0;
	for (const [name, s] of withPicture) {
		const want = readableFor(s) && inWindowFor(s);
		if (want) notesPhases++;
		if (s.notes.length !== (want ? 1 : 0)) notesBad++;
		for (const n of s.notes) {
			notesSeen++;
			const y = labelYFor(s);
			if (n.text !== `ChooseUnit`) notesBad++;
			if (Math.abs(n.x - (FRAME_TOP + FRAME_WIDTH)) > 1) notesBad++;
			if (n.y < y || n.y - y > dropFor(s)) notesBad++;
		}
	}
	console.log(notesBad === 0 && notesPhases > 0 && notesSeen > 0
		? `  OK: the labels name the fixture's one label wherever the name is legible — without its colon, at the frame's edge, on the y the drawing gives that line (${notesSeen} name(s) over ${notesPhases} phase(s), and no lookalike named)`
		: `  FAIL: the label layer is wrong in ${notesBad} way(s) — ${notesSeen} name(s) over ${notesPhases} phase(s) that should have one`);
}

// The source's picture and the window it is shown through. Three things have to hold at once, and
// each can fail on its own: the pane is the frame (that is the clipping), the picture is drawn once
// (that is what "a single text drawing operation" means), and the window moves over it.
const docOf = state => {
	try {
		return decodeURIComponent(state.href.slice(state.href.indexOf(`,`) + 1));
	} catch (err) {
		return ``;
	}
};

if (withPicture.length === 0) {
	console.log(`  FAIL: no picture was built at all`);
} else {
	const badPane = withPicture.filter(([, s]) => !s.pane
		|| s.pane.x !== FRAME_TOP || s.pane.y !== FRAME_TOP
		|| s.pane.width !== FRAME_WIDTH || s.pane.height !== FRAME_HEIGHT);
	console.log(badPane.length === 0
		? `  OK: the pane is the frame in every phase, so nothing the picture shows can spill`
		: `  FAIL: ${badPane.length} phase(s) put the pane outside the frame: ${badPane.map(([n, s]) => `${n} - ${JSON.stringify(s.pane)}`).slice(0, 3).join(`; `)}`);

	// **The source is anchored to the left edge of the pane.** The window's `x` in the document is
	// zero in every phase, whatever the recording is doing — the step axis is *when* and the source is
	// where, and moving one must not move the other. Asserted rather than assumed because it used to
	// be the opposite: the window's `x` was derived from the horizontal window, so panning along the
	// run dragged the source sideways and took the indentation and the first word out of view. The
	// fixture's longest line is wider than the frame can show, so there is something to drag.
	const dragged = withPicture.filter(([, s]) => s.box[0] !== 0);
	console.log(dragged.length === 0
		? `  OK: the source's window never slides sideways, so the script stays anchored to the pane's left edge (${withPicture.length} phases)`
		: `  FAIL: ${dragged.length} phase(s) dragged the source sideways: ${dragged.map(([n, s]) => `${n} - ${s.viewBox}`).slice(0, 3).join(`; `)}`);

	// One drawing. The document is built when the run is opened and never again, so its data URL has
	// to be the same in every phase — which is the whole of what Graham asked for, and a `href` that
	// changed would be the way it failed silently.
	const swapAt = taken.findIndex(([n]) => n.startsWith(`the script is edited`));
	const steady = swapAt === -1 ? withPicture : withPicture.slice(0, swapAt);
	const hrefs = new Set(steady.map(([, s]) => s.href));
	console.log(hrefs.size === 1
		? `  OK: one picture, drawn once, and all ${steady.length} phases still point at it`
		: `  FAIL: the picture was rebuilt ${hrefs.size} times, which is the redraw this was meant to remove`);

	// **And the redaction is built once with it, which is what makes a zoom free.** The bars are a
	// function of the *source*, not of the window, so they belong with the document and not with the marks
	// and rules that every draw rebuilds — and the check is the same instrument: their path data has to be
	// byte-identical across every phase before the source changes. That is the whole of the claim Graham
	// expected to cost something: *"rendering this costs more CPU time, so if it becomes too slow let's
	// defer rendering while zooming"*. There is nothing to defer, because a zoom does not rebuild it — and
	// this is the check that would fail if that ever stopped being true.
	const redactions = new Set(steady.map(([, s]) => s.redact));
	console.log(redactions.size === 1 && String(steady[0][1].redact || ``).length > 0
		? `  OK: the redaction rides with the picture rather than being rebuilt — one path of `
			+ `${(String(steady[0][1].redact).match(/M0 /g) || []).length} bar(s) across all ${steady.length} `
			+ `phases, unchanged by every zoom and pan in them`
		: redactions.size === 1
			? `  FAIL: the redaction is empty in every phase (${String(steady[0][1].redact).length} chars)`
			: `  FAIL: the redaction was rebuilt ${redactions.size} times across ${steady.length} phases, `
				+ `so a zoom is rebuilding it`);
	// And it does follow the source: an edit has to change it, or the bars would be the shape of a file
	// that is no longer on screen.
	const after = withPicture.slice(swapAt);
	if (swapAt > 0 && after.length) {
		const changed = after.some(([, s]) => s.redact !== steady[0][1].redact);
		console.log(changed
			? `  OK: and an edited script redraws the redaction with it, so the bars follow the text`
			: `  FAIL: the script was edited and the redaction did not change`);
	}

	// And the window moves over it. How much room there is depends on the recording: a run shorter
	// than the legible row count cannot zoom vertically at all, and a source narrower than the
	// window cannot be panned horizontally, so a short fixture shows no movement — which is the
	// design and not a fault, and is reported as such rather than as a pass.
	const span = withPicture[0][1].rows;
	const floor = Math.min(LEGIBLE_ROWS, span);
	const boxes = [...new Set(withPicture.map(([, s]) => s.viewBox))];
	const movable = span > LEGIBLE_ROWS;
	console.log(boxes.length > 1
		? `  OK: the window moves over the picture (${boxes.length} different viewBoxes)`
		: movable
			? `  FAIL: the viewBox never changed, so the picture never zoomed or panned`
			: `  -- this recording is ${span} lines, under the ${LEGIBLE_ROWS} at which the text is its own size, so there is no window to move`);

	// The zoom stops where the text is drawn at its own size. A source line is eighteen document
	// units tall, so a window of fewer rows than that is one where the rows are taller than the text
	// in them — no more detail to be had, and the letters blown up. The floor is the run's own length
	// when that is shorter: a twenty-line run cannot show thirty-two rows.
	const tooTall = withPicture.filter(([, s]) => !(s.box[3] >= floor * 18));
	console.log(tooTall.length === 0
		? `  OK: the window never goes below ${floor} rows, so a source line is never taller than it is drawn`
		: `  FAIL: ${tooTall.length} phase(s) zoomed past the text's own size: ${tooTall.map(([n, s]) => `${n} - ${s.viewBox}`).slice(0, 3).join(`; `)}`);

	const href = withPicture[0][1].href;
	console.log(href.startsWith(`data:image/svg+xml`) && !href.includes(`#`)
		? `  OK: the href is an SVG data URL with no raw '#' to cut it short`
		: `  FAIL: the href is not a usable data URL (starts "${href.slice(0, 40)}")`);
	const fittedDoc = docOf(withPicture[0][1]);
	if (!fittedDoc) {
		console.log(`  FAIL: the fitted picture's data URL does not decode`);
	} else {
		const counts = tag => [
			(fittedDoc.match(new RegExp(`<${tag}[ >]`, `g`)) || []).length,
			(fittedDoc.match(new RegExp(`</${tag}>`, `g`)) || []).length,
		];
		const balanced = [`svg`, `text`, `tspan`].map(tag => `${tag} ${counts(tag).join(`/`)}`).join(`, `);
		const ok = [`svg`, `text`, `tspan`].every(tag => counts(tag)[0] === counts(tag)[1]);
		console.log(ok
			? `  OK: the document's tags balance (${balanced})`
			: `  FAIL: the document's tags do not balance (${balanced})`);
		console.log(fittedDoc.includes(`a &lt;tag&gt; and an &amp; ampersand`)
			? `  OK: a line with angle brackets and an ampersand comes back exactly as written`
			: `  FAIL: the escaping mangled a line with angle brackets and an ampersand`);
		console.log(fittedDoc.includes(`# a note, 100% certain, "quoted"`)
			? `  OK: a line with a hash, a percent and a quote survives the URL as well`
			: `  FAIL: a line with a hash, a percent and a quote did not survive the URL`);

		// **A doc block is an empty row, and the rows still line up.** The picture is of the program, so
		// the rows a doc block occupies keep their place and show nothing — and the row *after* one still
		// holds its own line, which is the property the whole rule turns on: the pane's numbering has to
		// match the editor's, or a mark and the line it belongs to are two different statements. The
		// fixture carries both a `!!` line (32) and a bare `!` comment (34), because a fixture with only
		// one of them could not tell this rule from its opposite.
		const rows = fittedDoc.split(`<tspan`).slice(1).map(r => r.slice(r.indexOf(`>`) + 1, r.indexOf(`</tspan>`)));
		const drawnAs = n => rows[n - 1];
		const lineCount = source.split(`\n`).length;
		console.log(drawnAs(32) === `` && rows.length === lineCount
			? `  OK: the doc line is drawn as an empty row, and there is one row per line (${rows.length} for ${lineCount}), so nothing was skipped`
			: `  FAIL: line 32 drew "${drawnAs(32)}" and there are ${rows.length} rows for ${lineCount} lines`);
		console.log(drawnAs(34) === `    ! a note beside the code`
			? `  OK: a bare '!' comment is a note to its line rather than a doc block, and is drawn as it is`
			: `  FAIL: line 34 is a bare '!' comment and was drawn as "${drawnAs(34)}"`);
		console.log(drawnAs(36) === `    line 36 of the fixture`
			? `  OK: the line after the doc block still sits on row 36, so the numbering is the file's own`
			: `  FAIL: row 36 reads "${drawnAs(36)}" where line 36 is '    line 36 of the fixture'`);

		// **And every row names its own place, eighteen units below the last.** This is the check for the
		// fault that the three above it — and every other check in this file — could not see. The rows used
		// to lean on `dy` accumulating, so no coordinate was written; and an empty `<tspan>` does not
		// advance the text position, so every row that drew nothing collapsed and pulled the text above it
		// up. The document was perfect to any reader of it — one row per line, the right text in each — and
		// the screen was compacted by exactly the number of empty rows above each line, which is why the
		// drawing and the text drifted apart as the doc blocks were blanked. A check can only ask about
		// attributes here, since the rendering is the one thing it cannot see; asking whether each row is
		// placed is enough, because a placed row cannot be skipped.
		const rowYs = [...fittedDoc.matchAll(/<tspan x="0" y="(-?\d+)">/g)].map(m => Number(m[1]));
		const gaps = [...new Set(rowYs.slice(1).map((y, i) => y - rowYs[i]))];
		console.log(rowYs.length === lineCount && gaps.length === 1 && gaps[0] === 18
			? `  OK: every row carries its own y and they are 18 apart (${rowYs.length} rows, ${rowYs[0]} to ${rowYs[rowYs.length - 1]}), so no empty row can shift the text above it`
			: `  FAIL: ${rowYs.length} placed row(s) of ${lineCount}, gaps ${JSON.stringify(gaps)} — a row placed by accumulation would leave this empty`);

		// **The redaction is the text's shape, and that is checkable rather than a matter of taste.** The
		// bars are built from the same lines in the same pass, so either they agree with the text or the
		// arithmetic is wrong — and "agree" is two numbers per line: a bar's top must be its own row's top
		// (the baseline the document names, less the fourteen units the row holds above it) and its width
		// must be that line's own length at eight units a column. That is what "preserve the visible shape
		// of the text" means once it is written down. **And the zoom cannot spoil it**: the bars are in the
		// document's units, beside the glyphs, so the two are scaled by one `viewBox` and no zoom can move
		// one without the other — which is why this is a check on geometry and not on a rendered frame.
		const bars = [...String(withPicture[0][1].redact || ``).matchAll(/M0 (-?\d+)h(\d+)v18h-\d+z/g)]
			.map(m => ({ top: Number(m[1]), w: Number(m[2]) }));
		// **The row's text is the text a reader sees, not the document's transport encoding.** An SVG
		// document cannot spell `&`, `<` or `>` for itself, so the picture writes `&amp;`, `&lt;` and
		// `&gt;` — and the fixture deliberately carries a line with all three, which is how this was
		// caught: the bar was measured against forty-one characters where thirty are drawn. `&amp;` goes
		// last, because unescaping the other two first cannot invent one for it to eat.
		const shown = text => text.replace(/&lt;/g, `<`).replace(/&gt;/g, `>`).replace(/&amp;/g, `&`);
		const drawnRows = rows.map((text, i) => ({ text: shown(text), y: rowYs[i] }))
			.filter(r => r.text !== `` && r.y !== undefined);
		const wrong = drawnRows.filter(r => {
			const bar = bars.find(b => b.top === r.y - 14);
			return !bar || bar.w !== r.text.length * 8;
		});
		console.log(bars.length === drawnRows.length && wrong.length === 0
			? `  OK: every line's redaction is its own row exactly — ${bars.length} bar(s), each spanning the full `
				+ `18-unit row and as wide as its text at 8 units a column`
			: `  FAIL: ${bars.length} bar(s) for ${drawnRows.length} drawn row(s), ${wrong.length} mismatched`
				+ (wrong.length ? ` — first "${wrong[0].text}" on row y=${wrong[0].y}, bar ${JSON.stringify(bars.find(b => b.top === wrong[0].y - 14))}` : ``));

		// **The width is pinned and the height is not, which is the whole of the ask.** What a reader sees is
		// two numbers multiplied: the `transform` that widens the bars inside the document, and the pane's
		// `viewBox` that shrinks the document into the frame. Their product is the width on screen, and the
		// claim is that it *does not move* while the zoom does — the same bar at the same width at every
		// notch, so the file's shape reads the same however far in the reader is. The height is the other half
		// of the claim: it follows the row, so it does move. A build that rebuilt the bars per zoom to keep
		// their width would pass this too — and the check above, that the path is unchanged across the
		// phases, is what tells the two apart.
		const pinnedAcross = withPicture
			.filter(([, s]) => s.redactScale && /M0 /.test(String(s.redact)))
			.map(([name, s]) => {
				const bar = /M0 (-?\d+)h(\d+)v18h-\d+z/.exec(String(s.redact));
				const shrink = 580 / s.box[3];          // the pane's viewBox height against the frame's
				return {
					name,
					width: Number(bar[2]) * s.redactScale * shrink,
					height: 18 * shrink,
					view: s.viewBox,
				};
			});
		const widthSpread = pinnedAcross.length
			? (Math.max(...pinnedAcross.map(p => p.width)) - Math.min(...pinnedAcross.map(p => p.width)))
				/ Math.min(...pinnedAcross.map(p => p.width))
			: 1;
		const rowHeights = [...new Set(pinnedAcross.map(p => p.height.toFixed(2)))];
		console.log(pinnedAcross.length && widthSpread < 0.01 && rowHeights.length > 1
			? `  OK: and its width is pinned while its height follows the row — ${pinnedAcross.length} phase(s), `
				+ `${pinnedAcross[0].width.toFixed(1)} units wide at every one (${(widthSpread * 100).toFixed(2)}% spread), `
				+ `rows ${Math.min(...pinnedAcross.map(p => p.height)).toFixed(2)} to ${Math.max(...pinnedAcross.map(p => p.height)).toFixed(2)} units tall`
			: `  FAIL: the bars' on-screen width should not move with the zoom and their height should — `
				+ `${pinnedAcross.length} phase(s), spread ${(widthSpread * 100).toFixed(2)}%, `
				+ `${rowHeights.length} distinct row height(s) ${JSON.stringify(rowHeights.slice(0, 4))}`);
		if (process.env.PICTURE) {
			fs.writeFileSync(process.env.PICTURE, fittedDoc);
			console.log(`    the document written to ${process.env.PICTURE}`);
		}
	}

	// **The alignment, and it is the claim of the whole feature.** The axis and the picture are two
	// independent statements of where a line is: the pane shows the document through a window whose `y`
	// is `box[1]`, and one division takes a document row to a frame y. Every y-axis tick must land on
	// **the middle of the row it names**, because that is where that row's glyphs are drawn — a row is
	// eighteen document units and its text is centred in it.
	//
	// This is the check that was stale for a fortnight, and the half-row is why it could not simply be
	// repaired. It used to take the origin of the document's rows from the *caption*, which names the
	// recording's range while the picture is the whole file, so it was out by (range[0]-1) rows — and
	// its model put a line at the *top* of its row, which is what the view used to do and what Graham
	// saw as a misalignment. Both are fixed by stating the claim properly: the row's middle, from the
	// file's first line. The picture's first line is 1 because the picture is the whole file.
	const offsets = [];
	for (const [name, state] of withPicture) {
		if (!state.box || state.box.length !== 4 || !state.box[3]) continue;
		for (const tick of state.ticks) {
			const rowCentre = (tick.line - 1) * 18 + 9;
			const row = FRAME_TOP + (rowCentre - state.box[1]) * FRAME_HEIGHT / state.box[3];
			offsets.push({ name, line: tick.line, row: Math.round(row * 10) / 10, axis: tick.y, off: Math.abs(row - tick.y) });
		}
	}
	const worst = offsets.reduce((a, b) => (b.off > a.off ? b : a), { off: 0 });
	console.log(offsets.length === 0
		? `  FAIL: no tick could be compared with a row`
		: worst.off <= 1
			? `  OK: every tick sits on the middle of the row it names (${offsets.length} checked, worst ${worst.off.toFixed(1)} units out)`
			: `  FAIL: a tick is ${worst.off.toFixed(1)} units from the middle of its row: ${JSON.stringify(worst)}`);
}

const stateOf = prefix => { const hit = taken.find(([n]) => n.startsWith(prefix)); return hit ? hit[1] : null; };
const fitted = stateOf(`fitted`);
// Two notches in and two out must land exactly on the fit, once for each axis. It is the strongest
// statement here, because it exercises the mapping in both directions and the clamp with it, and it
// is only true because the two steps are exact inverses: in shrinks a window by a fifth and out
// grows it by a quarter.
const roundTrips = [
	[`shift-wheel (the lines) in and out`, stateOf(`shift-wheel (lines) out again`)],
	[`control-wheel (the steps) in and out`, stateOf(`control-wheel (steps) out again`)],
];
for (const [what, state] of roundTrips) {
	if (!fitted || !state) {
		console.log(`  FAIL: the ${what} round trip did not run`);
		continue;
	}
	console.log(state.raw === fitted.raw
		? `  OK: ${what} land exactly on the fitted picture (the steps invert)`
		: `  FAIL: ${what} did NOT return to the fitted picture`);
}
// And each axis must move only itself. Nothing else here would notice both wired to one modifier:
// every other statement would still hold, so this is the check that names the axis that must not
// have moved. It reads the tick *values*, which is what a zoom changes — the positions follow them.
const labelsOf = (state, axis) => state.labels.filter(l => l.includes(`Viz${axis}Label`)).join(` | `);
const axisTest = (prefix, moved, stayed) => {
	const hits = taken
		.map(([name, state], i) => ({ name, state, before: i > 0 ? taken[i - 1][1] : null }))
		.filter(e => e.name.startsWith(prefix) && e.before);
	if (!hits.length) {
		console.log(`  FAIL: no '${prefix}' phase ran, so the axes were never told apart`);
		return;
	}
	// A notch the clamp refuses is not a notch: it moves neither axis, which is the point of it. So a
	// phase where nothing at all changed is left out, and what remains must have moved the one axis
	// and only that one. The test is the axis labels rather than the viewBox, because the viewBox
	// answers to the lines only: the picture's window is as wide as its row height allows, so a
	// *horizontal* zoom moves the recording and leaves the text exactly where it is — which is the
	// design, and reading the viewBox would have hidden it.
	const applied = hits.filter(e => labelsOf(e.state, moved) !== labelsOf(e.before, moved)
		|| labelsOf(e.state, stayed) !== labelsOf(e.before, stayed));
	const wrong = applied.filter(e => labelsOf(e.state, moved) === labelsOf(e.before, moved)
		|| labelsOf(e.state, stayed) !== labelsOf(e.before, stayed));
	const refused = hits.length - applied.length;
	console.log(wrong.length === 0
		? `  OK: '${prefix}' moved the ${moved} ticks and left the ${stayed} ticks alone (${applied.length} applied${refused ? `, ${refused} refused by the clamp` : ``})`
		: `  FAIL: ${wrong.length} of ${applied.length} '${prefix}' did not move only the ${moved} axis: ${wrong.map(e => e.name).join(`, `)}`);
};
// The vertical one is only meaningful where the vertical zoom has room: a run at or under the
// legible row count is already as zoomed in as it may be, and its notches do nothing by design.
const yCanZoom = fitted ? fitted.rows > LEGIBLE_ROWS : true;
if (yCanZoom) {
	axisTest(`shift-wheel (lines) in`, `Y`, `X`);
} else {
	console.log(`  -- this recording is under ${LEGIBLE_ROWS} lines, so the lines axis cannot zoom and is not tested`);
}
axisTest(`control-wheel (steps) in`, `X`, `Y`);
// A gesture must *change* the picture, and it is compared against the state it was fired from rather
// than against the fit — by now the window is a slice of the run, so a scroll inside it is a small
// move and comparing with the fit would say nothing.
const changedSince = prefix => taken
	.map(([name, state], i) => ({ name, changed: i > 0 && state.raw !== taken[i - 1][1].raw }))
	.filter(e => e.name.startsWith(prefix));
const gesture = (prefix, what) => {
	const hits = changedSince(prefix);
	if (!hits.length) {
		return;
	}
	const still = hits.filter(h => !h.changed);
	console.log(still.length === 0
		? `  OK: every ${what} moved the picture (${hits.length})`
		: `  FAIL: ${still.length} of ${hits.length} ${what} left the picture where it was`);
};
// A gesture that cannot change anything must change nothing. At the legible floor a further notch
// used to slide the window up a few lines — the size was clamped back, but the centring that holds
// the middle still had already used the *unclamped* size — and it redrew the whole picture to do it,
// which is the flash Graham saw. These two phases are the same gesture twice at the floor, so a
// window that moved between them is the fault.
const atFloor = taken.filter(([n]) => n.startsWith(`shift-wheel (lines) in, at the floor`));
if (atFloor.length === 2) {
	console.log(atFloor[0][1].viewBox === atFloor[1][1].viewBox
		? `  OK: a notch at the legible floor changes nothing at all`
		: `  FAIL: a notch at the floor moved the window anyway: ${atFloor[0][1].viewBox} then ${atFloor[1][1].viewBox}`);
}
// The two inputs, changed one at a time. The picture answers to the *script* and the window to the
// *recording*, and the interesting part is that they are different inputs: editing the code redraws
// the text without disturbing the window, because the run it was fitted to has not changed, while a
// new recording has to re-fit, because a window fitted to the last run means nothing in this one.
const editAt = taken.findIndex(([n]) => n.startsWith(`the script is edited`));
const rerunAt = taken.findIndex(([n]) => n.startsWith(`the recording changes`));
if (editAt > 0 && rerunAt > editAt) {
	const before = taken[editAt - 1][1];
	const edited = taken[editAt][1];
	const rerun = taken[rerunAt][1];
	console.log(edited.href !== before.href
		? `  OK: an edited script redraws the picture`
		: `  FAIL: the picture was not redrawn for an edited script`);
	console.log(edited.viewBox === before.viewBox
		? `  OK: and leaves the window exactly where it was, because it is the same run`
		: `  FAIL: an edited script moved the window: ${before.viewBox} then ${edited.viewBox}`);
	console.log(rerun.viewBox === taken[0][1].viewBox
		? `  OK: a new recording re-fits the window to it`
		: `  FAIL: a new recording kept a window fitted to the last one: ${rerun.viewBox} — a fit would be ${taken[0][1].viewBox}`);
}

// Coming back to the pane must not reset it. This is the whole of what Graham asked for when he said
// subsequent visits should avoid any form of reset: the window is fitted once per *recording*, so a
// redraw with the same recording has to land exactly where the last gesture left it. A re-fit here
// would show as the picture jumping back to the whole run.
const back = taken.findIndex(([n]) => n.startsWith(`a redraw, as returning`));
if (back > 0) {
	console.log(taken[back][1].viewBox === taken[back - 1][1].viewBox
		? `  OK: a redraw on the same recording keeps the window exactly as it was left`
		: `  FAIL: a redraw moved the window: ${taken[back - 1][1].viewBox} then ${taken[back][1].viewBox}`);
}
// And the scroll only has anywhere to go when the vertical zoom has: at the floor the window is the whole
// visible run in both directions, so a notch is clamped — true of a short recording, and by design.
if (yCanZoom) {
	gesture(`wheel alone: scroll`, `wheel-alone scroll`);
}
gesture(`drag:`, `drag`);
// **Both modifiers down must change nothing at all.** The pair is parked by returning early in
// `VizWheel`, and the failure mode of deleting that early return instead is that the two flags are both
// set and the zoom applies both axes — which looks like the picture sliding diagonally under the wheel
// rather than like a broken gesture. So this asserts the picture is byte-identical across the pair, and
// the status line's window with it.
const pairAt = taken.findIndex(([n]) => n.startsWith(`shift+control-wheel, both modifiers`));
if (pairAt > 0) {
	const before = taken[pairAt - 1][1];
	const after = taken[pairAt][1];
	const later = taken[pairAt + 1] ? taken[pairAt + 1][1] : after;
	console.log(after.raw === before.raw && later.raw === before.raw
		? `  OK: a notch with both modifiers down changes nothing at all — not the window, not the picture`
		: `  FAIL: both modifiers down changed the picture: ${before.viewBox} -> ${after.viewBox} -> ${later.viewBox}`);
}
const reset = taken.find(([n]) => n.startsWith(`VizReset`));
if (fitted && reset) {
	console.log(reset[1].raw === fitted.raw
		? `  OK: VizReset put the fitted picture back`
		: `  FAIL: VizReset did not put the fitted picture back`);
}

// **The line a press on a mark names.** This is the one thing the view reports rather than draws, and it
// is what the sidebar is filled from, so it is checked against the picture's own ruler rather than
// against a recomputation of the view's mapping: the axis says where a line is, and the line a press
// names must be the one the axis puts at that mark's height. A sign error or a half-row offset — both
// of which this file has paid for — would show here as a line one or two out.
// **Found by name rather than by position.** The clip phases come after this one, and a phase
// appended to the end of the list must not silently become "the press" for the checks below.
const pressed = taken.find(([n]) => n.startsWith(`a press on a mark`));
const beforePress = taken[taken.indexOf(pressed) - 1];
if (pressed && beforePress) {
	console.log(pressed[1].raw === beforePress[1].raw
		? `  OK: and the press changed nothing on screen — the picture is byte-identical across it, `
			+ `the mark's figures on the foot being the one thing a press is for`
		: `  FAIL: a press on a mark repainted the picture`);
}
const pressedTicks = (pressed && pressed[1].ticks) || [];
// **The place is read from the press phase's own snapshot, not from the picture on screen.** The
// clip phases that follow re-fit the window, so the live DOM at this point is no longer the picture
// the press was made on; the marks that phase drew are the ones its line has to agree with.
const pressedMarks = (pressed && pressed[1].heat ? pressed[1].heat.flat() : []);
const pressedPlace = pressedMarks.length ? [pressedMarks[0].x, pressedMarks[0].y] : null;
const named = Number(viewVar(`VizHit`));
if (!pressedPlace || pressedTicks.length < 2) {
	console.log(`  ..: a press on a mark cannot be checked here (${allMarks().length} mark(s) drawn, `
		+ `${pressedTicks.length} axis tick(s)) — the fixture is too small to say`);
} else {
	const first = pressedTicks[0];
	const lastTick = pressedTicks[pressedTicks.length - 1];
	const slope = (lastTick.y - first.y) / (lastTick.line - first.line);
	const expected = Math.round(first.line + (pressedPlace[1] - first.y) / slope);
	console.log(Math.abs(expected - named) <= 1
		? `  OK: a press on a mark names the line the axis puts at that mark's height `
			+ `(pressed y=${pressedPlace[1]}, the axis says line ${expected}, the pane reported ${named})`
		: `  FAIL: a press on a mark named line ${named}; the axis puts line ${expected} at that height`);
}
// And a press *away* from every mark must name nothing at all: the selection the reader made a moment
// ago is still what they are looking at, so a pan that began on empty picture must not clear the panel
// on its way past. The point chosen is the frame's corner furthest from any mark, and the check says
// when the fixture has no such point rather than failing on a mark it could not avoid.
const marks = allMarks();
if (!marks.length) {
	console.log(`  ..: no marks drawn, so there is no empty picture to press on`);
} else {
	const corners = [[70, 70], [930, 70], [70, 630], [930, 630]];
	const away = corners
		.map(c => ({ c, d: Math.min(...marks.map(m => Math.hypot(m[0] - c[0], m[1] - c[1]))) }))
		.sort((a, b) => b.d - a.d)[0];
	if (away.d < 30) {
		console.log(`  ..: every corner is within ${Math.round(away.d)} units of a mark, so an empty `
			+ `press cannot be made on this recording`);
	} else {
		pressAt(away.c[0], away.c[1]);
		const empty = Number(viewVar(`VizHit`));
		console.log(empty === 0
			? `  OK: a press ${Math.round(away.d)} units clear of every mark names no line, so the last `
				+ `selection stands`
			: `  FAIL: a press on empty picture named line ${empty}`);
	}
}

// **Two dots on one row, told apart by their number.** Along a row every dot names the same line and so
// the same doc block, which is exactly what cannot distinguish them; what differs is *which arrival* each
// one is, and that is the count the dot's own colour is drawn from. So the check takes a row carrying more
// than one mark, presses its first and its last, and asks that the numbers differ, rise along the row, and
// agree about how many times the line ran. A pane that reported the line and nothing else — which is what
// it did until the status bar was asked for — passes every other check in this file.
const rowWithTwo = (() => {
	const byY = new Map();
	for (const [x, y] of allMarks()) {
		if (!byY.has(y)) byY.set(y, []);
		byY.get(y).push(x);
	}
	const rows = [...byY.entries()].filter(([, xs]) => xs.length > 1)
		.map(([y, xs]) => ({ y, xs: xs.sort((a, b) => a - b) }));
	return rows.length ? rows[0] : null;
})();
if (!rowWithTwo) {
	console.log(`  ..: no row here carries two marks, so there is nothing on a row to tell apart`);
} else {
	const visitOf = x => {
		pressAt(x, rowWithTwo.y);
		return {
			x,
			line: Number(viewVar(`VizHit`)),
			visit: Number(viewVar(`VizHitVisit`)),
			total: Number(viewVar(`VizHitTotal`)),
		};
	};
// **The mark's figures are on the pane's own foot, and they have to match the counts they name.** They
// moved there from the sidebar on 2026-10-05 — a reader pointing at a dot was reading the numbers at the
// other side of a big screen — and this is the check that the two did not part company on the way: the
// expected line is built from the view's own variables rather than copied from a run.
const saidLine = pressed[1].hit;
const wantLine = `line ${pressed[1].hitLine}   visit ${pressed[1].hitVisit}`
	+ (Number(pressed[1].hitTotal) > 0 ? ` of ${pressed[1].hitTotal}` : ``);
console.log(saidLine === wantLine
	? `  OK: the pane says the mark's line and visit under its status line ("${saidLine}")`
	: `  FAIL: the pane's foot says "${saidLine}" where its own counts make it "${wantLine}"`);

	const first = visitOf(rowWithTwo.xs[0]);
	const last = visitOf(rowWithTwo.xs[rowWithTwo.xs.length - 1]);
	const told = first.line === last.line && first.line > 0
		&& first.visit >= 1 && last.visit > first.visit && first.total === last.total && first.total >= last.visit;
	console.log(told
		? `  OK: two dots on one row are told apart by their visit number `
			+ `(line ${first.line}: x=${first.x} is visit ${first.visit}, x=${last.x} is visit ${last.visit}, `
			+ `both of ${first.total})`
		: `  FAIL: the dots on row y=${rowWithTwo.y} reported line ${first.line}/${last.line}, `
			+ `visits ${first.visit}/${last.visit}, totals ${first.total}/${last.total} — they should share `
			+ `a line and a total, and rise along the row`);
}

// ---- the clip ----
// **The two entries, by name, and what each must do to the picture.** Read carefully, because the
// first version of this check was wrong in a way that cost an evening: it clipped at the fit, where
// the window *is* the whole run, and a clip to the whole run is a no-op by design — so `242 then 242`
// was the right answer to a question that asked nothing, and the clip was reverted as broken. The
// window is narrowed by the phase before the clip, and the comparison below is against the *whole
// recording*, which is the claim worth making: the clipped picture has fewer marks than the fit.
//
// **And the marks in view are not expected to change.** A mark outside the window is not drawn, so a
// clip to the window removes records the picture was already leaving out; what the clip buys is the
// work it no longer does, and what it *says* — the notice, and counts over the range. So the checks
// are: fewer marks than the whole recording, the notice naming the window's own range, no rule for a
// line the recording does not name, the unclip restoring the fit exactly, and the notice gone.
const clipAt = indexOf(`clipped to the window`);
const clippedState = clipAt >= 0 ? taken[clipAt][1] : null;
const beforeClipState = clipAt > 0 ? taken[clipAt - 1][1] : null;
const unclippedState = clipAt >= 0 ? taken[clipAt + 1][1] : undefined;
const fitAgainState = (taken.find(([n]) => n.startsWith(`the fit again, for the bars`)) || [])[1];
if (!clippedState || !beforeClipState || !unclippedState || !fitAgainState) {
	console.log(`  ..: the clip phases did not run, so the clip cannot be checked`);
} else {
	const wholeRun = markCount(fitAgainState), inRange = markCount(clippedState);
	console.log(inRange < wholeRun
		? `  OK: a clip to a window narrower than the recording draws fewer marks than the whole `
			+ `recording does (${inRange} against ${wholeRun})`
		: `  FAIL: a clip drew as many marks as the whole recording (${inRange} then ${wholeRun}) — the `
			+ `range is not filtering the records, or the window was not narrowed before the clip`);
	// The notice, against the numbers rather than against itself: the range must be the window the
	// clip was taken from, and the denominator must be the recording's own count of arrivals and
	// transfers, read from the trace above. A notice that agreed with nothing would pass a check
	// that only looked for the words.
	const notice = noticeOf(clippedState);
	const clipRange = /clipped to steps (-?\d+)-(-?\d+): (\d+) of (\d+) records/.exec(notice);
	const windowSteps = /steps (-?\d+)-(-?\d+),/.exec(statusOf(beforeClipState));
	console.log(clipRange && windowSteps
		&& clipRange[1] === windowSteps[1] && clipRange[2] === windowSteps[2]
		&& Number(clipRange[3]) > 0 && Number(clipRange[3]) <= Number(clipRange[4])
		&& Number(clipRange[4]) === recordCount
		? `  OK: and the picture's own line carries the notice, naming the window's own range and the `
			+ `recording's ${recordCount} records — "${notice}"`
		: `  FAIL: the clip notice does not agree with the window it was taken from `
			+ `("${notice}", window ${windowSteps && windowSteps.slice(1, 3).join(`-`)}, `
			+ `${recordCount} records in the recording)`);
	// A clip may only *remove* rules, never invent one: every rule it draws is a line the recording
	// names. The y a line is drawn at is read here from the phase's own box, the same formula the
	// rule check uses — a second reading of one rule, which is what makes the two comparands.
	const lineYOf = (s, line) => FRAME_TOP + ((line - 1) * 18 + 9 - s.box[1]) * FRAME_HEIGHT / s.box[3];
	const strayRules = (clippedState.ruleYs || [])
		.filter(y => ![...namedLines].some(line => Math.abs(lineYOf(clippedState, line) - y) <= 1));
	console.log(strayRules.length === 0
		? `  OK: and it draws no rule for a line the recording does not name (${(clippedState.ruleYs || []).length} rules in the range, ${namedLines.size} lines named in all)`
		: `  FAIL: the clipped picture draws ${strayRules.length} rule(s) at a line the recording does not name: ${strayRules.slice(0, 4).join(`, `)}`);
	console.log(unclippedState.raw === fitAgainState.raw
		? `  OK: and the unclip gives the whole recording back — the picture is the fit again, byte for byte`
		: `  FAIL: the unclip did not give the whole recording back (${markCount(unclippedState)} marks `
			+ `against the fit's ${markCount(fitAgainState)})`);
	console.log(!/clipped to steps/.test(noticeOf(unclippedState))
		? `  OK: and the notice is gone`
		: `  FAIL: the clip notice survived the unclip: "${noticeOf(unclippedState)}"`);
}

// ---- the clip bar ----
// **The control, and the three claims it makes.** A marker dragged inward clips the recording with no
// zoom at all — the expensive gesture the bar exists to replace — and the notice, the picture and the
// markers must agree about the range. Dragged home again there is no clip, because a range that *is*
// the recording is not a range.
//
// And the claim in between, which is the design rather than a detail: **the drag itself draws
// nothing.** The picture between the grab and the drop has to be byte-identical to the one before it
// while the marker has visibly moved — that is what makes choosing a range cost one drawing instead
// of five or six, and it is the one thing about this control that a later change could quietly lose.
const barAt = indexOf(`the clip bar: grab the OUT marker`);
const barDragged = barAt >= 0 ? taken[barAt][1] : null;
const barBefore = barAt > 0 ? taken[barAt - 1][1] : null;
const barApplied = barAt >= 0 && taken[barAt + 1] ? taken[barAt + 1][1] : null;
const barHome = barAt >= 0 && taken[barAt + 2] ? taken[barAt + 2][1] : null;
// The recording's steps, as the view holds them. Read *here* rather than inside one of the branches
// below, because the guard itself needs them — and a name read before its declaration is a ReferenceError
// that takes the whole report with it, silently if the harness's own stderr is being dropped.
const barRunFrom = Number(viewVar(`VizRunFrom`));
const barRunTo = Number(viewVar(`VizRunTo`));
// **The bar's claims all need a picture whose steps axis is the recording's.** They are placed in the
// recording's steps — that is what the bar is measured in — and a recording whose extent the pane has
// collapsed (it opens more than one `viz` window; `TODO-viz.md` has that as a standing fault) has a fit
// that spans neither. On the fixture this harness is tuned to, the two agree and every claim below is
// made; on the JS recording of the same script they do not, and *saying so* is the honest answer rather
// than failing the pane for the recording's own fault.
if (!barDragged || !barBefore || !barApplied || !barHome) {
	console.log(`  ..: the clip bar phases did not run, so the bar cannot be checked`);
} else if (barRunTo !== traceMaxSteps) {
	console.log(`  ..: the clip bar's claims need a picture whose steps axis is the recording's, and this `
		+ `recording's last step is ${traceMaxSteps} where the pane measured ${barRunTo} — so they are not asked`);
} else {
	// The rect is four units wide and the view centres it on the step it names, so a marker's *step* x is
	// its box's x plus two — the same correction the drag helper makes, and the reason a marker read
	// straight off the box is a step out when the mapping is inverted.
	const boxX = (state, id) => (state.clipBar.find(m => m.id === id) || {}).x;
	const barW = (state, id) => (state.clipBar.find(m => m.id === id) || {}).w;
	const barInX = state => boxX(state, `ec-VizClipMarkIn`) + 2;
	const barOutX = state => boxX(state, `ec-VizClipMarkOut`) + 2;
	const inStep = barInX(barDragged), outStep = barOutX(barDragged);

	console.log(barOutX(barDragged) !== barOutX(barBefore) && barInX(barDragged) === barInX(barBefore)
		? `  OK: dragging the OUT marker moves it and leaves IN where it was (x ${boxX(barBefore, `ec-VizClipMarkOut`)} to ${boxX(barDragged, `ec-VizClipMarkOut`)}, IN at ${boxX(barDragged, `ec-VizClipMarkIn`)})`
		: `  FAIL: the marker drag moved the wrong thing (OUT ${boxX(barBefore, `ec-VizClipMarkOut`)} to ${boxX(barDragged, `ec-VizClipMarkOut`)}, IN ${boxX(barDragged, `ec-VizClipMarkIn`)})`);

	console.log(barDragged.raw === barBefore.raw
		? `  OK: and the picture was not redrawn while the marker moved — the drag costs no drawing, `
			+ `which is the whole reason for a bar rather than a zoom`
		: `  FAIL: the marker drag redrew the picture, so choosing a range costs a drawing per move`);

	// **The guides and the wash, which are what make the bar a control rather than a readout.** While a
	// marker is being dragged the plot is still the whole recording, so the guides run down it at the two
	// marker positions and the wash covers exactly what the range leaves out — checked on the *drag* phase,
	// which is where the reader is choosing.
	const guidesOk = boxX(barDragged, `ec-VizClipGuideIn`) === inStep
		&& boxX(barDragged, `ec-VizClipGuideOut`) === outStep;
	const washOk = boxX(barDragged, `ec-VizClipMaskIn`) === 60 && barW(barDragged, `ec-VizClipMaskIn`) === inStep - 60
		&& boxX(barDragged, `ec-VizClipMaskOut`) === outStep && barW(barDragged, `ec-VizClipMaskOut`) === 940 - outStep;
	console.log(guidesOk && washOk
		? `  OK: and the guides run down the plot at the two markers while the wash covers what the range `
			+ `leaves out (guides at ${inStep} and ${outStep}; wash 60-${inStep} and ${outStep}-940)`
		: `  FAIL: the guides or the wash disagree with the markers (guides ${boxX(barDragged, `ec-VizClipGuideIn`)} `
			+ `and ${boxX(barDragged, `ec-VizClipGuideOut`)} against ${inStep} and ${outStep}; wash `
			+ `${boxX(barDragged, `ec-VizClipMaskIn`)}-${barW(barDragged, `ec-VizClipMaskIn`)} and `
			+ `${boxX(barDragged, `ec-VizClipMaskOut`)}-${barW(barDragged, `ec-VizClipMaskOut`)})`);

	// Nothing to wash when the range *is* the recording: untouched, both washes are empty and the picture is
	// unmarked — the state a reader should find on opening a run.
	console.log(barW(barBefore, `ec-VizClipMaskIn`) === 0 && barW(barBefore, `ec-VizClipMaskOut`) === 0
		? `  OK: and with no range chosen there is nothing washed — the picture is unmarked`
		: `  FAIL: the picture is washed before any range is chosen (${barW(barBefore, `ec-VizClipMaskIn`)} `
			+ `and ${barW(barBefore, `ec-VizClipMaskOut`)})`);

	// The range, cross-checked: what the notice says against where the markers are drawn, read back through
	// the bar's own mapping. `VizRunFrom`/`VizRunTo` are the view's, so this is one claim about the picture
	// and the recording rather than a number compared with itself.
	const stepAtX = x => barRunFrom + Math.floor((x - 60) * (barRunTo - barRunFrom) / 880);
	const barRange = /clipped to steps (-?\d+)-(-?\d+): (\d+) of (\d+) records/.exec(noticeOf(barApplied));
	console.log(barRange && Number(barRange[1]) === stepAtX(inStep) && Number(barRange[2]) === stepAtX(outStep)
		&& Number(barRange[4]) === recordCount
		? `  OK: and the notice agrees with the markers — steps ${barRange[1]}-${barRange[2]}, which is where `
			+ `the bar puts x=${inStep} and x=${outStep}, of the recording's ${recordCount} records`
		: `  FAIL: the notice and the bar disagree ("${noticeOf(barApplied)}", markers at x=${inStep} and `
			+ `x=${outStep}, whose steps are ${stepAtX(inStep)} and ${stepAtX(outStep)}, ${recordCount} records)`);
	console.log(barRange && Number(barRange[3]) > 0 && Number(barRange[3]) < Number(barRange[4])
		? `  OK: and it kept some of the recording and not all of it (${barRange[3]} of ${barRange[4]} records)`
		: `  FAIL: the range the bar marked kept ${barRange && barRange[3]} of ${barRange && barRange[4]} records, `
			+ `so it is not a narrowing of the recording`);
	console.log(markCount(barApplied) < markCount(fitAgainState)
		? `  OK: and the clip the bar applied really is narrower — fewer marks than the whole recording `
			+ `(${markCount(barApplied)} against ${markCount(fitAgainState)})`
		: `  FAIL: the clip the bar applied kept the whole recording (${markCount(barApplied)} marks)`);

	// And when a clip *is* on, the picture is the range — so the guides and the wash go. They are placed in
	// the recording's steps, and there is no longer any part of the recording off the picture to point at.
	console.log(barW(barApplied, `ec-VizClipMaskIn`) === 0 && barW(barApplied, `ec-VizClipMaskOut`) === 0
		? `  OK: and once the clip is on they are gone, because the picture is the range`
		: `  FAIL: a clipped picture is still washed`);

	console.log(barHome.raw === fitAgainState.raw
		? `  OK: and dragging the marker home clears the clip — the picture is the fit again, byte for byte`
		: `  FAIL: dragging the marker home left a clip behind (${markCount(barHome)} marks against the `
			+ `fit's ${markCount(fitAgainState)})`);
	console.log(barOutX(barHome) === 940
		? `  OK: with the marker back at the end of the bar (x=${barOutX(barHome)})`
		: `  FAIL: the marker came home to x=${barOutX(barHome)} rather than the bar's end`);

	// The notice is on the bar's own line, not the status row: it used to lead the status line and ran into
	// the flow key's words, which is what moved it.
	console.log(noticeOf(barApplied) && !/clipped to steps/.test(statusOf(barApplied))
		? `  OK: and the notice has its own line, clear of the status line and the flow key`
		: `  FAIL: the notice is missing, or is still on the status line ("${noticeOf(barApplied)}")`);
}

// What it asked the DOM for, and what the layers actually contain.
console.log(`\nDOM: ${created.length} element(s)`);
for (const [parent, child] of created) console.log(`  ${parent} <- ${child}`);
const paths = Object.values(byId).filter(e => e.tagName === `path`);
let outside = 0;
for (const p of paths) {
	const d = p.attributes.d || ``;
	console.log(`  path ${p.attributes.id}: d = ${d.length} chars, ${(d.match(/M/g) || []).length} mark(s)`);
	console.log(`    ${d.slice(0, 130)}`);
	// Every coordinate must land inside the frame: that is what the fit is for.
	for (const pair of d.matchAll(/([0-9.]+) ([0-9.]+)/g)) {
		const [x, y] = [Number(pair[1]), Number(pair[2])];
		if (x < 0 || x > 1000 || y < 0 || y > 700) { outside++; if (outside < 4) console.log(`    OUTSIDE the frame: ${x},${y}`); }
	}
}
console.log(outside === 0 ? `  every coordinate is inside the 1000x700 frame` : `  ${outside} coordinate(s) OUTSIDE the frame`);
// With a third argument, write a page containing this very drawing: the view's own SVG output, so
// what is looked at is the product code's output rather than a redrawing of it.
if (process.argv[3]) {
	const esc = s => String(s).replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/"/g, `&quot;`);
	const attrs = e => Object.entries(e.attributes).map(([k, v]) => `${k}="${esc(v)}"`).join(` `);
	const ser = e => {
		const kids = (e.children || []).map(ser).join(``);
		// Not a truthiness test: a label reading "0" has an innerHTML of 0, which is falsy, and the
		// axis's first tick would silently come out blank.
		const has = e.innerHTML !== undefined && e.innerHTML !== null && e.innerHTML !== ``;
		const inner = has ? esc(e.innerHTML) : ``;
		return `<${e.tagName} ${attrs(e)}>${inner}${kids}</${e.tagName}>`;
	};
	const svg = Object.values(byId).find(e => e.tagName === `svg`);
	const markup = `<svg xmlns="http://www.w3.org/2000/svg" ${attrs(svg)}>${(svg.children || []).map(ser).join(``)}</svg>`;
	fs.writeFileSync(process.argv[3], `<!doctype html>
<meta charset="utf-8">
<title>plot view \u2014 ${path.basename(tracePath)}</title>
<style>
  body { margin:0; background:#15171a; color:#d7dae0; font:13px system-ui,sans-serif; }
  header { padding:10px 14px; border-bottom:1px solid #2b2f34; color:#7d848e; }
  header b { color:#d7dae0; }
  #panel { position:absolute; inset:44px 0 0 0; display:flex; align-items:center; justify-content:center; }
  svg { width:100%; height:100%; }
</style>
<header><b>${path.basename(tracePath)}</b> \u2014 drawn by <code>asedit-graph.allspeak</code> through the svg plugin.
  Each mark is a stroke in a path; the axis is a pool of four labels a side.</header>
<div id="panel">${markup}</div>
`);
	console.log(`\npage written: ${process.argv[3]}`);
}
// **One line per phase, in milliseconds, for whoever is asking what the picture costs to move.** The five
// dearest are the interesting ones: a pan that costs as much as the first drawing is the whole question, and
// the answer decides whether the drawing needs splitting or something else does.
if (GESTURE_REPORT) {
	const rows = taken.map(t => [t[0], Number(t[2])]).filter(([, ms]) => ms >= 0);
	const sorted = rows.slice().sort((a, b) => b[1] - a[1]);
	console.log(`\ngestures: ${rows.length} phase(s), dearest five`);
	for (const [name, ms] of sorted.slice(0, 5)) console.log(`  ${ms} ms  ${name}`);
	const total = rows.reduce((a, [, ms]) => a + ms, 0);
	console.log(`  total ${total} ms; median ${sorted[Math.floor(sorted.length / 2)][1]} ms`);
}
const texts = Object.values(byId).filter(e => e.tagName === `text` || e.tagName === `svgtext`);
for (const e of texts) {
	console.log(`  ${e.attributes.id}: x=${e.attributes.x} y=${e.attributes.y} "${e.innerHTML}"`);
}
// Ends `report`. Its body is deliberately left at the original indentation rather than re-indented
// under the new wrapper: the HTML page it writes is one long template literal, and re-indenting
// would reach inside that string and change the page.
}
