#!/usr/bin/env node
//
// Run asedit.allspeak headlessly, click its buttons, and say what state the editor is in.
//
// **Why this exists.** The editor's UI state — which pane is up, what the three buttons say, how many
// slots each per-tab array has — is invisible to every other check in this repo. `asedit-check.js`
// compiles the editor without running it, and the view harnesses drive the drawing. Two faults in one
// afternoon came out of that gap: `EnterBlocks` never turned the Graph pane off (so two buttons both
// read `Edit` and the graph lay under the Blocks pane), and `TabCursor`/`TabView` were grown in the
// two ways of opening a tab in only one of them (so a second tab from the file browser died on
// "Array index 1 is out of range"). Both were found by Graham clicking, which is a good instrument
// but a slow one.
//
// **What it is not.** It does not test the drawing, the parsing, or anything that needs a layout
// engine. It stubs the DOM and CodeMirror just far enough to *run*, and then reads the editor's own
// variables and the elements it wrote. So it asks "is the state consistent", not "does it look right".
//
// Usage:  node tools/asedit-modes-check.js
//
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, `..`);

const noop = () => {};

// ---- a DOM just real enough ----------------------------------------------------------------
//
// Elements are looked up by id, and an element registers itself when its id is set — which is how the
// page's own UI is built: the editor renders `asedit.json` into the body, the renderer makes elements
// and gives them ids, and the editor then attaches its variables to those ids. A stub that returned
// fresh objects on every lookup would lose that, and every `attach` would fail.
const byId = {};
const mk = tag => {
	const el = {
		tagName: String(tag || `div`).toUpperCase(),
		// The renderer sets styles through the CSSOM, not by assigning to `style.display`, so a plain
		// object is not enough — the setters have to be there or the whole UI stops half-built.
		style: {
			setProperty(k, v) { this[k] = v; },
			getPropertyValue(k) { return this[k] || ``; },
			removeProperty(k) { delete this[k]; },
		},
		children: [], attributes: {},
		innerHTML: ``, innerText: ``, textContent: ``, value: ``,
		appendChild(c) { this.children.push(c); return c; },
		insertBefore(c) { return this.appendChild(c); },
		removeChild() {}, replaceChild() {},
		setAttribute(k, v) {
			this.attributes[k] = String(v);
			if (k === `id`) { this.id = String(v); byId[this.id] = this; }
		},
		getAttribute(k) { return this.attributes[k]; },
		removeAttribute(k) { delete this.attributes[k]; },
		addEventListener() {}, removeEventListener() {},
		classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
		focus: noop, blur: noop, click: noop, select: noop,
		setSelectionRange: noop, scrollIntoView: noop,
		querySelector: () => null, querySelectorAll: () => [],
		getElementsByTagName: () => [],
		getBoundingClientRect: () => ({ left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 }),
	};
	return el;
};

// The two elements the page fills before the runtime starts: the UI to render, and the script to run.
// Read from the same files the page fetches, so a check runs what the page runs.
const uiElement = mk(`pre`);
uiElement.setAttribute(`id`, `asedit-ui`);
uiElement.innerHTML = fs.readFileSync(path.join(root, `asedit.json`), `utf8`);

const scriptElement = mk(`pre`);
scriptElement.setAttribute(`id`, `allspeak-script`);
scriptElement.innerText = fs.readFileSync(path.join(root, `asedit.allspeak`), `utf8`);

const bodyElement = mk(`body`);
const headElement = mk(`head`);

global.window = global;
global.location = { search: ``, pathname: `/`, href: `http://localhost/` };
global.navigator = { userAgent: `node` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.alert = m => process.stderr.write(`alert: ${m}\n`);
global.document = {
	getElementById: id => byId[id] || null,
	querySelector: () => null,
	querySelectorAll: () => [],
	createElement: t => mk(t),
	createElementNS: (ns, t) => mk(t),
	addEventListener: noop, removeEventListener: noop,
	body: bodyElement, head: headElement,
	getElementsByTagName: () => [],
};

// ---- CodeMirror, just far enough --------------------------------------------------------
//
// The editor drives a real CodeMirror through the plugin, so the plugin and the editor both run here —
// only the library is faked. Every call the plugin makes is recorded, which is what lets the caret and
// view records be checked: a restore is the *pair* of calls, and either half missing is the fault the
// last change existed to fix.
const editorCalls = [];
const fakeEditor = {
	setSize() {}, refresh() { editorCalls.push([`refresh`]); },
	getValue: () => scriptElement.innerText,
	setValue() { editorCalls.push([`setValue`]); },
	getCursor: () => ({ line: fakeEditor._line || 0, ch: 0 }),
	setCursor(pos) { editorCalls.push([`setCursor`, pos.line]); fakeEditor._line = pos.line; },
	getScrollInfo: () => ({ top: fakeEditor._top || 0, left: 0, height: 700, width: 1000 }),
	scrollTo(x, y) { editorCalls.push([`scrollTo`, y]); fakeEditor._top = y; },
	charCoords: pos => ({ top: (pos.line || 0) * 20, left: 0 }),
	execCommand() {}, toTextArea() {},
};
global.CodeMirror = { fromTextArea: () => fakeEditor, version: `stub` };

// ---- the REST transport ---------------------------------------------------------------------
//
// `rest get /read/<path>` is how the editor loads a file, and a path that will not answer sends it down
// an error path instead — so the stub serves the real files under the repo and says "not found" for
// anything else, which is the honest thing for a check to do.
global.fetch = (url, opts) => {

	const body = (() => {
		const m = /\/read\/(.*)$/.exec(url);
		if (!m) return ``;
		try { return fs.readFileSync(path.join(root, decodeURIComponent(m[1])), `utf8`); }
		catch (err) { return null; }
	})();
	if (body === null || (opts && opts.method === `POST`)) {
		return Promise.resolve({ ok: opts && opts.method === `POST`, status: 200, statusText: `OK`, text: () => Promise.resolve(``) });
	}
	return Promise.resolve({ ok: true, status: 200, statusText: `OK`, text: () => Promise.resolve(body) });
};

// ---- the runtime and the page's plugins ------------------------------------------------------
// The list comes from the editor's own page, not from a list here: a check that loads every plugin
// verifies a program nobody runs. That mistake has been made once already, in asedit-check.js.
const page = fs.readFileSync(path.join(root, `edit.html`), `utf8`);
const listed = page.match(/const bundles = \[([\s\S]*?)\]/);
if (!listed) {
	process.stderr.write(`asedit-modes-check: no 'bundles' list in edit.html — has the page changed shape?\n`);
	process.exit(1);
}
const plugins = [...listed[1].matchAll(/'([^']+)'/g)].map(m => m[1])
	.filter(n => n.startsWith(`plugins/`))
	.map(n => n.replace(`plugins/`, ``))
	.filter(n => n !== `codemirror/codemirror.js`);   // the library itself, stubbed above

const BUNDLE_ORDER = [`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`, `Language.js`,
	`LanguagePack_en.js`, `Compile.js`, `Main.js`];
for (const f of BUNDLE_ORDER) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, f), `utf8`), { filename: f });
}
vm.runInThisContext(`globalThis.__x = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Run } = globalThis.__x;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.scripts = {};

const skipped = [];
for (const f of plugins) {
	try {
		vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, f), `utf8`), { filename: f });
	} catch (err) {
		skipped.push(`${f} (${String(err.message).split(`\n`)[0]})`);
	}
}

// ---- the renderer, stubbed ----------------------------------------------------------------
//
// **The renderer is stubbed; the editor is not.** The page builds its elements out of `asedit.json`
// through Webson, and Webson's build is asynchronous all the way down — which is fine in a browser and
// stalls headlessly somewhere inside, on an await that never settles. Chasing that would make this file
// about the renderer, and the renderer is not what it asks about: it asks what the editor's *state* is,
// not what the page looks like. So the ids the editor attaches to are created here directly, from the
// same JSON the page renders, and `render` resolves at once.
//
// The consequence, stated honestly: **a fault in the UI's markup is invisible to this check.** What it
// covers is every mode, every button label and every per-tab array — the state, which is where both of
// this afternoon's faults were.
const UI_JSON = JSON.parse(fs.readFileSync(path.join(root, `asedit.json`), `utf8`));
const seed = (items, parent) => {
	if (Array.isArray(items)) {
		items.forEach(i => seed(i, parent));
		return;
	}
	if (!items || typeof items !== `object`) {
		return;
	}
	if (typeof items[`@id`] === `string`) {
		const el = mk(items[`#element`] || `div`);
		el.setAttribute(`id`, items[`@id`]);
		// The page's own text, which matters: the three buttons carry their labels in the markup, and a
		// check that asked what a button says would otherwise be asking about a stub.
		if (typeof items[`#content`] === `string`) el.innerHTML = items[`#content`];
		parent.appendChild(el);
	}
	Object.values(items).forEach(v => seed(v, parent));
};
// The script arrives as the *text* of `#asedit-ui`, which is what the editor hands over, so it is
// parsed here exactly as the real renderer parses it.
AllSpeak_Webson.render = async (parent, name, script) => {
	seed(typeof script === `string` ? JSON.parse(script) : script, parent);
};

// ---- run the editor -----------------------------------------------------------------------
const failures = [];
const check = (ok, message) => {
	console.log(`  ${ok ? `OK  ` : `FAIL`} ${message}`);
	if (!ok) failures.push(message);
};

try {
	AllSpeak.start(scriptElement.innerText);
} catch (err) {
	process.stderr.write(`asedit-modes-check: the editor threw: ${String(err.message || err).split(`\n`)[0]}\n`);
	process.exit(1);
}

const scriptName = Object.keys(AllSpeak.scripts)[0];
const program = AllSpeak.scripts[scriptName];
if (!program) {
	process.stderr.write(`asedit-modes-check: the editor did not register a program\n`);
	process.exit(1);
}
// **The boot is asynchronous, and that is the first thing to know about driving this editor.**
// `render X in Y` returns a promise, and so does every `rest get`, so the editor's flow hands control
// back to the event loop while its own UI is still being built. A check that drives the labels as soon
// as `AllSpeak.start` returns is clicking buttons on a page that does not exist yet — which is what the
// first version of this file did, and it failed on `setValue` of an editor that had never attached.
const waitFor = async (predicate, ms = 5000) => {
	const until = Date.now() + ms;
	while (Date.now() < until) {
		if (predicate()) return true;
		await new Promise(r => setTimeout(r, 20));
	}
	return false;
};

const run = label => {
	const record = program.symbols[label];
	if (!record) throw new Error(`no such label: ${label}`);
	AllSpeak_Run.run(program, record.pc);
};
const valueOf = name => {
	const record = program.getSymbolRecord(name);
	const v = record && record.value && record.value[record.index];
	return v ? v.content : undefined;
};
const sizeOf = name => {
	const record = program.getSymbolRecord(name);
	return record ? record.elements : undefined;
};
// The page's own ids: an attached variable *is* the page's element, so `set the content of GraphBtn`
// writes into `#se-graphbtn` rather than into anything named after the variable.
const displayOf = id => (byId[id] || {}).style || null;
const contentOf = id => (byId[id] || {}).innerHTML;

console.log(`\nasedit-modes-check: ${scriptName}, ${skipped.length} plugin(s) not loadable`);
for (const note of skipped) console.log(`  not loaded: ${note}`);

(async () => {
const booted = await waitFor(() => !!byId[`se-textarea`] && !!(program.getSymbolRecord(`ContentEditor`) || {}).editor);
check(booted, `the editor boots: the page's UI is rendered and an editor is attached to it`);
if (!booted) {
	console.log(`  boot: #se-textarea=${!!byId[`se-textarea`]} rendered=${bodyElement.children.length} elements`);
	process.exit(1);
}

// ---- the invariant that failed last time ----------------------------------------------------
//
// Every per-tab array has to be as long as there are tabs. A seventh one added to one of the two ways
// of opening a tab is exactly the fault this asks about, and it is asked after each way in turn.
// The test is "long enough", not "exactly": growing an array does not shorten it, so a slot vacated by
// a closed tab lingers past the end of the tabs, and nothing reads past `TabCount`. What matters — and
// what failed — is a slot that does not exist at all.
const PER_TAB = [`TabPath`, `TabName`, `TabSaved`, `TabCursor`, `TabView`];
const tabArraysAgree = () => {
	const count = valueOf(`TabCount`);
	const short = PER_TAB.filter(n => !(sizeOf(n) >= count)).map(n => `${n}=${sizeOf(n)}`);
	return [{ ok: short.length === 0, detail: `TabCount=${count}${short.length ? `, ${short.join(` `)}` : ``}` }, count];
};

run(`NewFile`);
let [agree, count] = tabArraysAgree();
check(!valueOf(`TabCursor`) && !valueOf(`TabView`),
	`and the new tab has nowhere to restore to, rather than the last one's record (${JSON.stringify([valueOf(`TabCursor`), valueOf(`TabView`)])})`);
check(agree.ok, `a tab opened by the + button has a slot in every per-tab array (${agree.detail})`);

run(`NewFile`);
[agree, count] = tabArraysAgree();
check(agree.ok, `and a second one (${agree.detail})`);
check(count === 2, `two tabs are two tabs (${count})`);

// The file browser's route: `OpenFile` wants TabItem and File set first, as its caller sets them.
program.getSymbolRecord(`TabItem`).value[0] = { type: `constant`, numeric: false, content: `tools/trace-wide.allspeak` };
program.getSymbolRecord(`File`).value[0] = { type: `constant`, numeric: false, content: `trace-wide.allspeak` };
// **And this one suspends, so it must be waited for.** `OpenFile` reads the file over `rest get`, and
// a `rest get` hands control back to the event loop and resumes on the response — so the tab does not
// exist yet when `run` returns. The first version of this file checked straight afterwards and saw
// nothing happen, then found the editor resumed *later*, mid-way through the next check, with its
// scratch registers trampled by then. Waiting on the thing being asserted is the whole fix.
run(`OpenFile`);
const opened = await waitFor(() => valueOf(`TabCount`) === 3);
[agree, count] = tabArraysAgree();
check(opened, `the file browser opens a tab (TabCount=${count})`);
check(agree.ok, `and it has a slot in every per-tab array (${agree.detail})`);

// Closing one shifts them all back down. `CloseTab` reads which close button was pressed, so the index
// is set the way the event handler would have set it.
program.getSymbolRecord(`TabClose`).index = 2;
run(`CloseTab`);
[agree, count] = tabArraysAgree();
check(agree.ok, `and closing one leaves them level again (${agree.detail})`);
check(count === 2, `with two left (${count})`);

// ---- the other invariant: at most one pane, and the buttons say so --------------------------
//
// `Edit` on a button means "this pane is up and the button leaves it". So exactly one of the three
// reads `Edit` while a pane is up, and none of them does in the flat editor.
const labels = () => ({
	blocks: contentOf(`se-blocksbtn`),
	graph: contentOf(`se-graphbtn`),
	find: contentOf(`se-findbtn`),
});
const panes = () => ({
	editor: (displayOf(`se-editor-area`) || {}).display,
	blocks: (displayOf(`se-blocks-area`) || {}).display,
	graph: (displayOf(`se-graph-area`) || {}).display,
});
const up = p => Object.entries(p).filter(([, v]) => v && v !== `none`).map(([k]) => k);

run(`ToggleBlocks`);
let shown = up(panes());
let text = labels();
check(shown.length === 1 && shown[0] === `blocks`, `Blocks mode shows one pane, the Blocks one (${shown.join(`,`) || `none`})`);
check(text.blocks === `Edit` && text.graph === `Graph`, `and only its own button offers the way out (${text.blocks} | ${text.graph} | ${text.find})`);

run(`ToggleGraph`);
shown = up(panes());
text = labels();
check(shown.length === 1 && shown[0] === `graph`, `Graph mode shows one pane, the Graph one (${shown.join(`,`) || `none`})`);
check(text.graph === `Edit` && text.blocks === `Blocks`, `and only its own button offers the way out (${text.blocks} | ${text.graph} | ${text.find})`);
check(panes().blocks === `none`, `with the Blocks pane gone rather than lying under it`);

// The caret and the view, remembered on the way in and put back on the way out — as a pair, and with
// the caret written before the view so that neither can drag the other.
//
// The numbers matter as much as the calls: a restore that put *something* back would pass a check for
// the calls alone. So the editor is left standing somewhere definite, the pane entered and left, and
// the values read back out of the calls the fake editor recorded.
run(`ToggleGraph`);                       // the checks above left the pane up; back to the flat editor
fakeEditor._line = 12;
fakeEditor._top = 340;
run(`ToggleGraph`);                       // into the pane — this is where the pair is remembered
editorCalls.length = 0;
run(`ToggleGraph`);                       // and out again — this is where it has to come back
const putBack = editorCalls.find(c => c[0] === `setCursor`);
const scrolled = editorCalls.find(c => c[0] === `scrollTo`);
check(!!putBack && !!scrolled, `leaving Graph puts back both the caret and the view (${JSON.stringify(editorCalls)})`);
check(!!putBack && !!scrolled && putBack[1] === 12 && scrolled[1] === 340,
	`and they are the values that were standing there (caret ${putBack && putBack[1]}, view ${scrolled && scrolled[1]})`);
check(editorCalls.indexOf(putBack) < editorCalls.indexOf(scrolled),
	`the caret first, so that the view is the one that ends up exact`);
shown = up(panes());
check(shown.length === 1 && shown[0] === `editor`, `and the flat editor is the one pane up (${shown.join(`,`) || `none`})`);

console.log(failures.length === 0
	? `\nasedit-modes-check: all checks passed`
	: `\nasedit-modes-check: ${failures.length} check(s) failed`);
process.exit(failures.length === 0 ? 0 : 1);
})();
