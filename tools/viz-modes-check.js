#!/usr/bin/env node
//
// Run viz.allspeak headlessly, click its buttons, and say what state the editor is in.
//
// **Why this exists.** The editor's UI state — which pane is up, what the three buttons say, how many
// slots each per-tab array has — is invisible to every other check in this repo. `viz-check.js`
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
// Usage:  node tools/viz-modes-check.js
//
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, `..`);
// Which editor to run. An older revision can be pointed at to put a number on how much the editor's
// compile time — its load time — has moved since, which is the one thing worth watching as it grows.
const target = process.argv[2] || `viz.allspeak`;

const noop = () => {};

// ---- a DOM just real enough ----------------------------------------------------------------
//
// Elements are looked up by id, and an element registers itself when its id is set — which is how the
// page's own UI is built: the editor renders `viz.json` into the body, the renderer makes elements
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
			if (k === `id`) this.id = String(v);
		},
		getAttribute(k) { return this.attributes[k]; },
		removeAttribute(k) { delete this.attributes[k]; },
		addEventListener() {}, removeEventListener() {},
		classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
		focus: noop, blur: noop, click: noop, select: noop,
		setSelectionRange: noop, scrollIntoView: noop,
		querySelector: () => null, querySelectorAll: () => [],
		getElementsByTagName: () => [],
		// **The id registers however it is set.** The runtime's `create` gives a new element its id by
		// *assignment* (`element.id = ec-…`), where the svg plugin uses `setAttribute` — and this stub used
		// to register only the second, so every element the editor or a module *created* was invisible to
		// `byId` while every element the JSON renderer made was not. A browser answers for both, and a
		// check that looks an element up by id is a check on what a reader would see.
		get id() { return this.attributes.id || ``; },
		set id(v) { this.attributes.id = String(v); byId[String(v)] = this; },
		// A box a check can set, so an element's size is its own rather than every element being the whole
		// window: the splitter arithmetic reads the widths either side of it, and a stub that gave them all
		// the same one could not tell a sidebar from the area it sits in.
		getBoundingClientRect: () => el.box || { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 },
	};
	return el;
};

// The two elements the page fills before the runtime starts: the UI to render, and the script to run.
// Read from the same files the page fetches, so a check runs what the page runs.
const uiElement = mk(`pre`);
uiElement.setAttribute(`id`, `viz-ui`);
uiElement.innerHTML = fs.readFileSync(path.join(root, `viz.json`), `utf8`);

const scriptElement = mk(`pre`);
scriptElement.setAttribute(`id`, `allspeak-script`);
scriptElement.innerText = fs.readFileSync(path.resolve(root, target), `utf8`);

// **The page's answer to "which runtime is this project for".** `#editor-runtime` is how a project's
// `.allspeak-init` `runtime:` reaches a browser — a browser cannot read a file — and the editor reads it beside
// the language, with the same `or go` fallback. Created here before the runtime boots, because the editor's
// *branch* cannot be reached without it: with the element absent the project is JavaScript, which is the other
// half of the same check.
const runtimeElement = mk(`div`);
runtimeElement.setAttribute(`id`, `editor-runtime`);
// A browser gives a div's text in both fields; this stub keeps them apart, and the plugin reads `textContent`.
runtimeElement.innerHTML = `js`;
runtimeElement.textContent = `js`;

const bodyElement = mk(`body`);
const headElement = mk(`head`);

global.window = global;
// **A window that remembers what it was asked to open.** `location new <page>` is how the Launch button opens
// the project's app, and a stub without `open` would make the whole button unobservable — the browser window
// again, which is the fault storage had.
const openedPages = [];
global.open = url => { openedPages.push(String(url)); return null; };
global.location = { search: ``, pathname: `/`, href: `http://localhost/` };
global.navigator = { userAgent: `node` };
// **Storage that remembers.** The editor persists two splitter widths through this, and a stub that
// swallowed every write made the whole round trip unobservable — a width could be saved to nowhere and no
// check could tell. A real browser keeps it, so this does too.
const store = {};
// Every write the editor performs, so a check can see what a path actually put on disk.
const written = [];
// Every recording it asked for, so a check can see which tab it was asking about.
const served = [];
// **Which script the editor asked the *server* to run, and record.** A `@py` script is not run in the page at
// all, so the only evidence that the button did its job is the request — the same reason `written` exists for
// the JS half and `openedPages` for the app half. Not called `recorded`: this file has one of those further
// down, for what the plugin collects, and a name that collides silently is worse than a long one.
const askedOfServer = [];
global.localStorage = {
	getItem: k => (k in store ? store[k] : null),
	setItem: (k, v) => { store[String(k)] = String(v); },
	removeItem: k => { delete store[k]; },
	get length() { return Object.keys(store).length; },
	key: i => Object.keys(store)[i],
};
global.addEventListener = noop;
global.removeEventListener = noop;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.alert = m => process.stderr.write(`alert: ${m}\n`);
// The page's two dialogs, which the editor does reach: a tab with content and no path asks for a name
// on the next auto-save, and the update check asks before it reloads. Answering them the way a browser
// would — and saying what was asked — keeps the editor's own paths runnable here instead of throwing
// out of a timer, and makes the answer visible in the log rather than in the failure.
global.prompt = text => {
	process.stdout.write(`  [prompt] ${text}\n`);
	return ``;
};
global.confirm = text => {
	process.stdout.write(`  [confirm] ${text}\n`);
	return false;
};
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
//
// A path with no `/read/` in it is a *static* fetch, which is how the editor loads its own companion
// module (`viz-graph.allspeak`), and the dev server serves those by name from the same directory —
// so the stub strips the cache-busting query and looks the file up. Without this the module load takes
// its `or go` failure path, the Graph pane never appears, and the checks about the pane would pass on
// an editor that had quietly gone back to flat mode.
global.fetch = (url, opts) => {

	// **A POST is remembered rather than dropped.** `rest post` is how the editor writes a file — a saved tab,
	// and now a recording — so a write is the *outcome* of those paths, and a stub that swallowed it could
	// not tell a save from a no-op. Only the method and the path are kept: the body is the file.
	if (opts && opts.method === `POST`) written.push({ url: String(url), body: String(opts.body || ``) });
	// **And which recording was asked for, and by whom.** The editor keys a recording by the *tab's* path, so
	// the request is the evidence for "each tab keeps its own" — and it is the only place that fact is visible,
	// since a tab with no recording and a tab whose recording is empty look the same on screen.
	if (/\.viz\.json/.test(String(url))) served.push(String(url));

	const body = (() => {
		const read = rel => {
			try { return fs.readFileSync(path.join(root, decodeURIComponent(rel)), `utf8`); }
			catch (err) { return null; }
		};
		// **A write this harness saw is a file the server would serve.** The editor does not only write a file,
		// it goes on to *read it back* — the pane fetches the recording the button just made — so a stub that
		// remembered a POST but not its body would report a successful write and then fail the read, and the
		// failure would land on the status line as if the recording had never been made.
		const posted = rel => {
			const want = String(rel).replace(/^\.\//, ``);
			for (let n = written.length - 1; n >= 0; n--) {
				if (written[n].url.replace(/^.*?\/write\//, ``) === want) return written[n].body;
			}
			return null;
		};
		// **The Python half of Record.** A `@py` script is not run here: the editor asks the project's dev server,
	// which runs it under Python and answers with a sentence naming the verdict and the file the output went to.
	// The path asked for is recorded, because it is the whole of what the editor contributes.
	//
	// **It returns a *body*, like every other branch here, and not a response.** The first version returned
	// `Promise.resolve({ok, status, text})` from inside this IIFE, which builds the body — so the stub wrapped a
	// promise in a promise, `text()` handed the runtime a promise where it expects a string, and the editor took
	// its `or` failure path while the *request* had plainly been made. A stub has to answer in the shape the
	// other answers are in.
	const rec = /\/record\/(.*)$/.exec(String(url));
	if (rec) {
		const script = decodeURIComponent(rec[1]);
		askedOfServer.push(script);
		return `41 visits in 1 window · output in ${script}-stdout.txt`;
	}
	const m = /\/read\/(.*)$/.exec(url);
		if (m) return read(m[1]) !== null ? read(m[1]) : posted(m[1]);
		// A static fetch is a plain path, with or without a directory part, plus the
		// cache-busting query the editor appends.
		const stat = /([^/?#]+)(?:\?[^#]*)?$/.exec(url.split(`/read/`).pop());
		if (stat) {
			const found = read(stat[1]);
			if (found !== null) return found;
		}
		return ``;
	})();
	if (opts && opts.method === `POST`) {
		return Promise.resolve({ ok: true, status: 200, statusText: `OK`, text: () => Promise.resolve(``) });
	}
	// **A file that is not there is a 404, which is what a server says and what the editor's `or go` waits for.**
	// Answering `ok` with an empty body instead was the stub being kinder than reality in the way that hides
	// faults: the editor took its *success* path with nothing to read, the pane kept whatever it was already
	// showing, and a tab with no recording looked like a tab with the last one's.
	if (body === null) {
		return Promise.resolve({ ok: false, status: 404, statusText: `Not Found`, text: () => Promise.resolve(``) });
	}
	return Promise.resolve({ ok: true, status: 200, statusText: `OK`, text: () => Promise.resolve(body) });
};

// ---- the runtime and the page's plugins ------------------------------------------------------
// The list comes from the editor's own page, not from a list here: a check that loads every plugin
// verifies a program nobody runs. That mistake has been made once already, in viz-check.js.
const page = fs.readFileSync(path.join(root, `viz.html`), `utf8`);
const listed = page.match(/const bundles = \[([\s\S]*?)\]/);
if (!listed) {
	process.stderr.write(`viz-modes-check: no 'bundles' list in viz.html — has the page changed shape?\n`);
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
// **The renderer is stubbed; the editor is not.** The page builds its elements out of `viz.json`
// through Webson, and Webson's build is asynchronous all the way down — which is fine in a browser and
// stalls headlessly somewhere inside, on an await that never settles. Chasing that would make this file
// about the renderer, and the renderer is not what it asks about: it asks what the editor's *state* is,
// not what the page looks like. So the ids the editor attaches to are created here directly, from the
// same JSON the page renders, and `render` resolves at once.
//
// The consequence, stated honestly: **a fault in the UI's markup is invisible to this check.** What it
// covers is every mode, every button label and every per-tab array — the state, which is where both of
// this afternoon's faults were.
const UI_JSON = JSON.parse(fs.readFileSync(path.join(root, `viz.json`), `utf8`));
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
		// **And every other `@name`, because that is what a renderer does with them** (`Webson.js`:
		// `element.setAttribute(aName, aValue)` for any key starting `@`) — which is how the layout states an
		// `href`, a `target` or a `title`. Seeding only `@id` and `#content` made every attribute the *file*
		// states invisible here while the same attribute written by the script was recorded, and the first
		// control whose tooltip lives in the file would have read as a control with no tooltip at all.
		for (const [key, value] of Object.entries(items)) {
			if (key.startsWith(`@`) && key !== `@id` && typeof value === `string`) {
				el.setAttribute(key.slice(1), value);
			}
		}
		parent.appendChild(el);
	}
	Object.values(items).forEach(v => seed(v, parent));
};
// The script arrives as the *text* of `#viz-ui`, which is what the editor hands over, so it is
// parsed here exactly as the real renderer parses it.
AllSpeak_Webson.render = async (parent, name, script) => {
	seed(typeof script === `string` ? JSON.parse(script) : script, parent);
};

// The runtime measures its own compile against this, and a host is expected to set it — leaving it out
// is what made the compile line read `NaN ms`, which is the one number this file exists to keep an eye
// on: the editor is compiled on every page load, so its compile time is the editor's load time.
AllSpeak.timestamp = Date.now();

// ---- run the editor -----------------------------------------------------------------------
const failures = [];
const check = (ok, message) => {
	console.log(`  ${ok ? `OK  ` : `FAIL`} ${message}`);
	if (!ok) failures.push(message);
};

try {
	AllSpeak.start(scriptElement.innerText);
} catch (err) {
	process.stderr.write(`viz-modes-check: the editor threw: ${String(err.message || err).split(`\n`)[0]}\n`);
	process.exit(1);
}

const scriptName = Object.keys(AllSpeak.scripts)[0];
const program = AllSpeak.scripts[scriptName];
if (!program) {
	process.stderr.write(`viz-modes-check: the editor did not register a program\n`);
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

console.log(`\nviz-modes-check: ${scriptName}, ${skipped.length} plugin(s) not loadable`);
for (const note of skipped) console.log(`  not loaded: ${note}`);

(async () => {
const booted = await waitFor(() => !!byId[`se-textarea`] && !!(program.getSymbolRecord(`ContentEditor`) || {}).editor);
check(booted, `the editor boots: the page's UI is rendered and an editor is attached to it`);
if (!booted) {
	console.log(`  boot: #se-textarea=${!!byId[`se-textarea`]} rendered=${bodyElement.children.length} elements`);
	process.exit(1);
}

// ---- the handler that is registered, not just written ------------------------------------------
//
// **A handler runs because its line was *executed*, and this editor's own flow stops in the middle of the
// file** — everything after `fork to AutoSave` is a subroutine. So an `on message` written with the code
// it runs, at the end, is a dead line: the pane's report arrives at a program with no handler and is
// dropped without a word. That is exactly what happened the first time the sidebar was wired up, and the
// relay check below did not catch it, because it called the handler by name — which is the fault a
// harness repeats every time it enters a path the reader cannot. This asks the program the question that
// decides, and it is here rather than with the relay checks for the reason it exists: it is about
// *registration*, which every other check in this file silently depends on. It waits, because booting is
// asynchronous — the page is up before the flow has finished — and a registration that never happens is
// what the wait is for.
check(await waitFor(() => !!program.onMessage), `the editor's inbound message handler is registered, not merely written (onMessage=${program.onMessage})`);

// ---- every control says what it does ---------------------------------------------------------
//
// **A tooltip is a `title`, and a title exists because a line that sets it ran.** That is the same rule
// the registration above obeys: this file's flow stops after the startup loops, so a tooltip written
// beside the code it belongs to at the end of the file would never be set — which is exactly the trap an
// earlier session hit with a marker word in the wrong place. It is checked here, at boot, for the same
// reason the registration is.
//
// **Every control, and not just the interesting ones.** The ones that matter least — a `Previous block`
// arrow — are precisely the ones a later change would drop without noticing, and `title` is invisible
// until a pointer rests on it, so nothing else would complain.
const titles = {
	[`se-logo`]: `AllSpeak.ai — the website, the Primer and the documentation`,
	[`se-open`]: `Open a file from this project`,
	[`se-plusbtn`]: `Start a new file`,
	[`se-findbtn`]: `Find a block holding the text you have selected`,
	[`se-blocksbtn`]: `Show this script as blocks, one block at a time`,
	[`se-graphbtn`]: `Show the run this script recorded, as a picture`,
	[`se-recordbtn`]: `Run this script and save its recording beside it`,
	[`se-launchbtn`]: `Open the page this script names with '@app', in a new window`,
	[`se-closebtn`]: `Close the file browser`,
	[`se-blocks-prev`]: `Previous block`,
	[`se-blocks-next`]: `Next block`,
	[`se-blocks-verify`]: `Mark this block verified, at its present hash`,
	[`se-blocks-verify-all`]: `Mark every block in this file verified`,
	[`se-alert-close`]: `Put this message away`,
};
const titleOf = id => ((byId[id] || {}).attributes || {}).title;
// **Waited for, because the renderer builds the page asynchronously and `@` entries lag the element's
// existence.** An element is in `byId` as soon as its `@id` is applied, while its attributes and styles
// arrive an await later — so a check that read them the moment the id appeared would report every
// tooltip missing and be describing the harness rather than the editor. Measured, 2026-10-07: both maps
// were still empty six hundred milliseconds after `se-alert` existed.
const untooled = await waitFor(() => Object.keys(titles).every(id => titleOf(id) === titles[id])) ? [] : Object.keys(titles).filter(id => titleOf(id) !== titles[id]);
check(untooled.length === 0,
	`every control carries its own tooltip (${Object.keys(titles).length} checked`
	+ (untooled.length ? `, ${untooled.length} wrong: `
		+ untooled.map(id => `${id}=${JSON.stringify(titleOf(id))}`).join(`, `) : ``) + `)`);

// ---- the first screen: the welcome, and the route that outlives it ----------------------------------
//
// **A new reader's first sight of Viz is a blank editor, and this is what stops that being a wall.** Graham,
// 2026-10-12: *"I'm acutely aware of the sense of bafflement many products create when they present a mass of
// unfamiliar artefacts with no obvious route to using them."* The help message sends them to `allspeak viz`;
// from there the panel above the editor has to take over — what AllSpeak is, what the buttons do, and where
// the worked example is.
//
// **It is *shown* by the file, and *put away* by eight things.** `viz.json` has it as `display: flex`, so it
// is up as soon as the page renders — before a line of the script has run, which is the point for a
// first-time reader — and the script owns only the way it goes. **There is no one line that means "any
// click"**: `on click document` reads like it and is not — the runtime runs a document click handler only for
// an `<a href>` into the same page (`Browser.js`, `clickDocument`), which is what the editor's own file links
// need. Measured in a browser, 2026-10-12: a click on `Blocks` left the panel standing. So the dismissal is
// the first line of each control's handler, and the panel is clickable itself for a reader who clicks the
// prose. Those eight *are* the mechanism, which is why each is run here: a button added without its `gosub`
// would leave a panel sitting over a page the reader has already started using.
check(!!byId[`se-welcome`] && (UI_JSON[`$Welcome`] || {}).display !== `none`,
	`the welcome panel is on the first screen (element ${!!byId[`se-welcome`]}, `
	+ `file display ${JSON.stringify((UI_JSON[`$Welcome`] || {}).display)})`);
check(typeof (byId[`se-welcome`] || {}).targetPc === `number`,
	`and the panel itself is clickable, so clicking the prose puts it away as a button does `
	+ `(targetPc=${(byId[`se-welcome`] || {}).targetPc})`);

// One real handler, chosen because it is the harmless one: with no tab open `ToggleBlocks` puts the panel away
// and then returns without a tab to show.
run(`ToggleBlocks`);
check((displayOf(`se-welcome`) || {}).display === `none`,
	`and a button's own handler puts it away as it starts (display=`
	+ `${JSON.stringify((displayOf(`se-welcome`) || {}).display)})`);

// **And the other six are asked about in the source, not by running them.** Running each would *do* what that
// button does — open the file browser, start a new file, record this script — and every check below would then
// be describing a different editor; the first version of this check did exactly that, and the sidebar checks
// began failing with a panel that had never been built. What matters is one property, and the source states
// it: **the first statement of every handler a bar control reaches is the dismissal.** The behaviour itself
// was watched in a browser (a click on `Open` puts the panel away and shows the file list) — that is the
// instrument for a gesture, and this is the instrument for the class.
const source = scriptElement.innerText.split(`\n`);
const opensWithDismissal = label => {
	const at = source.findIndex(l => l.trim() === label + `:`);
	if (at < 0) return `no such handler`;
	const first = source.slice(at + 1).find(l => l.trim() !== `` && !l.trim().startsWith(`!`));
	return (first || ``).trim();
};
const bars = [[`OpenBtn`, `ShowBrowser`], [`PlusBtn`, `NewFile`], [`FindBtn`, `DoFind`],
	[`BlocksBtn`, `ToggleBlocks`], [`GraphBtn`, `ToggleGraph`], [`RecordBtn`, `RecordRun`],
	[`LaunchBtn`, `LaunchApp`]];
const unwired = bars.filter(([symbol, label]) =>
	!source.some(l => l.trim() === `on click ` + symbol + ` go to ` + label)
	|| !opensWithDismissal(label).startsWith(`gosub to DismissWelcome`));
check(unwired.length === 0,
	`and every button that does something dismisses it first — ${bars.length} handlers asked`
	+ (unwired.length ? `, ${unwired.length} not: `
		+ unwired.map(([, label]) => `${label}=${JSON.stringify(opensWithDismissal(label))}`).join(`, `) : ``) + `)`);

// **And the logo is the route that outlives it.** The panel is gone for the rest of the page load once
// anything is clicked, so a reader who wants the Primer later needs a door that does not close — the logo,
// which is where a reader looks for the site a tool belongs to. It is an `<a>` around the image in the file,
// with the `title` above as its tooltip, so nothing about it is the script's business.
check((UI_JSON[`$Logo`] || {})[`#element`] === `a`
	&& (UI_JSON[`$Logo`] || {})[`@href`] === `https://allspeak.ai`
	&& (UI_JSON[`$Logo`] || {})[`@target`] === `_blank`,
	`the logo is a link to the website, in a window of its own, so it does not navigate the editor away `
	+ `(${JSON.stringify((UI_JSON[`$Logo`] || {})[`@href`])} ${JSON.stringify((UI_JSON[`$Logo`] || {})[`@target`])})`);

// ---- the alert panel: one box, named by the page, shared with the Graph pane -------------------
//
// **The panel is `viz.json`'s, and both programs write to the same two elements by id.** The editor's
// half is what is checked here: that the page named every part of it, that it is hidden until something
// asks for it, and that the Close button's own entry point puts it away. The editor's callers are the two
// module-load failures, and `ShowAlert` is what they use, so driving it *is* driving them.
//
// **The pane's half is exercised elsewhere and this says so rather than pretending otherwise.** The
// pane's `VizDrawRun` writes the panel before it draws, from the module's plumbing — which
// `tools/plotview-check.js` cuts away, because it compiles the view alone — so the long-drawing notice
// and its ticker are not reachable from a headless harness. They were measured in a browser instead:
// the panel appears a second into a drawing that is still going, counts the seconds, and reports what it
// cost, with the learned estimate and the clip-bar advice printed alongside when the pane has a rate to
// judge by. `TODO.md` records the measurement.
const panelShown = () => (displayOf(`se-alert`) || {}).display === `flex`;
// The same wait, and for the same reason: the panel's own `display` is one of the styles that arrives late.
await waitFor(() => (displayOf(`se-alert`) || {}).display === `none`);
// **The panel ships hidden, and that is checked against the JSON rather than the DOM.** This harness's
// DOM stub does not record the styles `viz.json` applies (measured: `se-status`'s own `font-size` is
// absent from it too, and the editor's own checks have never depended on them), so `se-alert`'s
// `display` reads as `undefined` here whether the file says `none` or nothing at all. `viz.json` is
// read for this check the same way the page reads it, which is the honest instrument for the question.
const uiJson = JSON.parse(fs.readFileSync(path.join(root, `viz.json`), `utf8`));
check(uiJson.$AlertPanel && uiJson.$AlertPanel[`@id`] === `se-alert`
	&& uiJson.$AlertPanel.display === `none` && uiJson.$AlertText[`@id`] === `se-alert-text`
	&& uiJson.$AlertCloseBtn[`@id`] === `se-alert-close`
	&& Array.isArray(uiJson[`#`]) && uiJson[`#`].includes(`$AlertPanel`),
	`the alert panel is in the page, hidden until something asks for it, and every part of it is named `
	+ `(display=${JSON.stringify(uiJson.$AlertPanel && uiJson.$AlertPanel.display)})`);
check(!!byId[`se-alert`] && !!byId[`se-alert-text`] && !!byId[`se-alert-close`],
	`and the page has built all three elements from it `
	+ `(panel=${!!byId[`se-alert`]}, text=${!!byId[`se-alert-text`]}, close=${!!byId[`se-alert-close`]})`);
const alertWords = `A message a reader has to understand`;
program.getSymbolRecord(`AlertMsg`).value[0] = { type: `constant`, numeric: false, content: alertWords };
run(`ShowAlert`);
check(panelShown() && String(contentOf(`se-alert-text`)) === alertWords,
	`and showing it puts the message on screen (display=${(displayOf(`se-alert`) || {}).display}, `
	+ `text=${JSON.stringify(String(contentOf(`se-alert-text`)))})`);
run(`HideAlert`);
check(!panelShown(), `and the Close button's own entry point puts it away again`);

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
// **A control that changes what it does says so in both states.** The label flips to `Edit` while the
// pane is up, so the tooltip is set beside it — a button that promised to *show* blocks while it actually
// left them would be worse than no tooltip at all.
check(titleOf(`se-blocksbtn`) === `Back to the plain editor`,
	`and its tooltip changes with it (${JSON.stringify(titleOf(`se-blocksbtn`))})`);

// ---- and the file the editor is editing can be the editor's own ------------------------------------
//
// **Blocks mode models the *buffer*, and here the buffer is `viz.allspeak`** — the harness loads the
// editor's own source into the page, as the page does. So this is the real path for a fault Graham met with
// the message *"problem | script=viz.allspeak | Script 'Viz' is already running."* on the status
// line: the model compile ran `script Viz` while the editor was running under that very name, the
// runtime's duplicate guard refused it — a rule about *running* two copies, applied to a compile that never
// runs — and the plugin reported the refusal as a problem with the file, which it was not. The registry is
// the witness: the editor is still registered, under its own name, after a pass that borrowed it.
const model = (program.getSymbolRecord(`Model`) || {}).value || [];
const complaints = model.map(v => String(v.content)).filter(line => line.startsWith(`problem |`));
check(valueOf(`SecCount`) > 0 && complaints.length === 0,
	`the editor's own file models cleanly while the editor is running under the name it declares `
	+ `(sections=${valueOf(`SecCount`)}, ${complaints.length} problem record(s)`
	+ (complaints.length ? `: ${JSON.stringify(complaints.slice(0, 2))}` : ``) + `)`);
check(!!AllSpeak.scripts[`Viz`] && AllSpeak.scripts[`Viz`] === program,
	`and the running program still owns its name after the pass borrowed it `
	+ `(Viz=${AllSpeak.scripts[`Viz`] === program ? `this program` : JSON.stringify(!!AllSpeak.scripts[`Viz`])})`);

run(`ToggleGraph`);
shown = up(panes());
text = labels();
check(shown.length === 1 && shown[0] === `graph`, `Graph mode shows one pane, the Graph one (${shown.join(`,`) || `none`})`);
check(text.graph === `Edit` && text.blocks === `Blocks`, `and only its own button offers the way out (${text.blocks} | ${text.graph} | ${text.find})`);
check(titleOf(`se-graphbtn`) === `Back to the plain editor` && titleOf(`se-blocksbtn`) === `Show this script as blocks, one block at a time`,
	`with both tooltips back to what the buttons now do `
	+ `(${JSON.stringify(titleOf(`se-graphbtn`))}, ${JSON.stringify(titleOf(`se-blocksbtn`))})`);
check(panes().blocks === `none`, `with the Blocks pane gone rather than lying under it`);

// ---- the pane is a module, loaded on demand -------------------------------------------------
//
// The drawing lives in `viz-graph.allspeak`, fetched and compiled on this first click and messaged
// from then on. Each of these can fail on its own, which is why they are separate: the module loads (a
// static fetch of a file beside the page), it takes the pane over (an `attach` by id, in a program
// that never declared that element), and the dict arrives — its own `VizShown`, and the run's own
// fields, which the editor can set in its variables and the module can only get from the message.
//
// **The status line is deliberately not what is checked here.** It is the page's one status line and it
// has two writers: the pane says "no recording beside this script" and the analysis says its piece, and
// which lands last is timing. What is checked is the boundary — the values that could only have crossed.
const viz = () => AllSpeak.scripts[`VizGraph`];
const vizRecord = name => (viz() && viz().getSymbolRecord(name)) || null;
const vizValue = name => {
	const record = vizRecord(name);
	const v = record && record.value && record.value[record.index];
	return v ? v.content : undefined;
};
const loaded = await waitFor(() => valueOf(`VizLoaded`) === 1 && !!viz());
check(loaded, `the Graph pane loads as a module on the first click (VizLoaded=${valueOf(`VizLoaded`)}, program=${!!viz()})`);
// The message is *asynchronous*: `send` queues the delivery and the recipient resumes on a turn of its
// own, so this waits for the pane to have taken it rather than reading straight afterwards.
const took = await waitFor(() => vizValue(`VizShown`) === 1);
check(took, `and the editor's message got there (its own VizShown=${vizValue(`VizShown`)})`);
const attached = vizRecord(`VizHost`) && vizRecord(`VizHost`).element[vizRecord(`VizHost`).index];
check(attached === byId[`se-graph-host`],
	`and it attached the pane by id, in a program that never declared the element (${attached ? attached.tagName : `nothing`})`);
check(String(vizValue(`TracePath`)).endsWith(`.viz.json`),
	`and the run's fields came with the message (the path it was told to report: ${JSON.stringify(vizValue(`TracePath`))})`);

// ---- the sidebar, the pane's co-module ------------------------------------------------------
//
// The panel is `viz-side.allspeak`, loaded the same way and for the same reason: the editor needs none
// of it until somebody looks at a run, and the panel is bulky enough to want its own file. What is checked
// here is the **relay**, because the relay is the editor's — the pane reports the line under a clicked
// mark, this file looks it up in the doc-block model it already holds for Blocks mode, and the sidebar is
// shown the result. Three programs, and the only place the look-up can be wrong is this one.
//
// **The pane's own hit test cannot be reached from here.** This harness stubs the DOM with no layout
// engine, so no mark has a place to point at; `tools/plotview-check.js` is where a press on a mark is
// checked, against the picture's own axis. And the line arrives here the way `send … to parent` delivers
// it — as `message`, with the handler run — rather than by reaching into any module's internals.
const side = () => AllSpeak.scripts[`VizSide`];
const sideRecord = name => (side() && side().getSymbolRecord(name)) || null;
const sideValue = name => {
	const record = sideRecord(name);
	const v = record && record.value && record.value[record.index];
	return v ? v.content : undefined;
};
// A panel element's text, found by the name the module gave it: the elements it builds are its own, so
// they are looked up the way the view's are in `plotview-check` — by prefix, since the plugin numbers them.
const sideElText = prefix => {
	const el = Object.values(byId).find(e => String(e.attributes.id || ``).startsWith(prefix));
	return el ? el.innerHTML : undefined;
};
const sideLoaded = await waitFor(() => valueOf(`SideLoaded`) === 1 && !!side());
check(sideLoaded, `the sidebar loads as a second module beside the pane (SideLoaded=${valueOf(`SideLoaded`)}, program=${!!side()})`);
// Its own handler, by the same rule the editor's is checked against: a handler runs only if its line was
// executed, and a module whose registration sat after its `stop` would load, attach, build its panel and
// then never hear a word — the failure that looks most like nothing being wrong.
check(!!(side() && side().onMessage), `and the sidebar's own message handler is registered (onMessage=${side() && side().onMessage})`);
const sideHost = sideRecord(`SideHost`);
const sideAttached = sideHost && sideHost.element[sideHost.index];
check(sideAttached === byId[`se-graph-side`],
	`and it attached to its own box, not the pane's (${sideAttached ? sideAttached.tagName : `nothing`})`);
// **Two elements, which is the whole of what the split buys.** Neither module lays the other out, so
// neither can be broken by the other's size — which is the fault this arrangement exists to avoid, and
// the one the pane's own geometry has no defence against (it cannot measure its own canvas).
check(byId[`se-graph-host`] && byId[`se-graph-side`] && byId[`se-graph-host`] !== byId[`se-graph-side`],
	`with the page giving each module its own element (host=${!!byId[`se-graph-host`]}, side=${!!byId[`se-graph-side`]})`);
check(!!sideValue(`SideBuilt`) && !!sideRecord(`SideTabs`) && !!sideRecord(`SideProse`),
	`and it built the panel itself — the tab strip, the body and the three things the body shows — because the editor declares no element for any of them (built=${!!sideValue(`SideBuilt`)})`);

// ---- the grip that sizes the sidebar ---------------------------------------------------------
//
// The width control is a divider beside the sidebar, driven through the same document-level `on drag` the
// Blocks splitter uses. Two things about it are invisible to the eye and are the reason this is checked
// rather than looked at: **the sign** — the sidebar's *left* edge moves, so a pointer travelling left makes
// the panel wider, which is the opposite sense to the Blocks splitter and exactly what a copy of it would
// get wrong — and **the floor**, where a drag past the limit must stop rather than invert.
//
// The path driven is the shipped one: the grip's own pick handler, then the editor's `on drag` body, both
// entered at the pc the runtime registered for them.
const sideWidth = () => {
	const m = /0 0 (\d+)px/.exec(((byId[`se-graph-side`].style || {}).flex) || ``);
	return m ? Number(m[1]) : null;
};
const sideBox = width => {
	byId[`se-graph-side`].box = { left: 1440 - width, top: 0, right: 1440, width, height: 700 };
};
const gripDrag = (from, to, startWidth = 340) => {
	byId[`se-graph-area`].box = { left: 0, top: 0, right: 1440, width: 1440, height: 700 };
	// The width the drag begins from, put in explicitly rather than left as whatever the last case left: a
	// drag reads the *element's* width at the pick, so the fixture has to say what that is, or each of the
	// four checks below would be measuring the one before.
	sideBox(startWidth);
	global.document.pickX = from; global.document.pickY = 300;
	AllSpeak_Run.run(program, byId[`se-graph-grip`].mouseDownPc);
	global.document.dragX = to; global.document.dragY = 300;
	AllSpeak_Run.run(program, program.mouseMovePc);
	const width = sideWidth();
	// **The browser re-lays out, so the stub does too.** A drop reads the element's *width*, and a stub
	// whose box never followed the style it was handed would report the width the drag started from — a
	// fixture that would agree with an implementation that never stored anything.
	if (width !== null) sideBox(width);
	return width;
};
const gripDrop = () => AllSpeak_Run.run(program, program.mouseUpPc);
check(!!byId[`se-graph-grip`] && byId[`se-graph-grip`] !== byId[`se-graph-side`] && !!byId[`se-graph-grip`].mouseDownPc,
	`the sidebar has a width control of its own, a divider that takes a press (mouseDownPc=${byId[`se-graph-grip`] && byId[`se-graph-grip`].mouseDownPc})`);
const widened = gripDrag(1100, 1000);
check(widened === 440, `a drag to the left makes the panel wider (340 + 100 = ${widened})`);
const narrowed = gripDrag(1100, 1200);
check(narrowed === 240, `and a drag to the right makes it narrower (340 - 100 = ${narrowed})`);
const floored = gripDrag(1100, 3000);
check(floored === 200, `and a drag past the limit stops at the floor rather than inverting (${floored})`);
const chosen = gripDrag(1100, 940);
gripDrop();
check(chosen === 500 && store[`viz-graph-side-width`] === `500`,
	`and the width the reader chose is kept (${chosen}, stored ${JSON.stringify(store[`viz-graph-side-width`])})`);
run(`ToggleGraph`); run(`ToggleGraph`);
check(sideWidth() === 500, `and put back when the pane is opened again (${sideWidth()})`);

// The look-up, with the model put in by hand. Which section holds a line is the one question here that
// The look-up, spread over three checks: a line inside each of the fixture's two blocks, and one in
// neither. Which block holds a line is the one question here that cannot be read off the run, so the
// fixture supplies the structure and the editor's own parser supplies the model.
//
// **The fixture is not the editor's own source, on purpose.** The editor does parse itself in Blocks mode,
// and the temptation is to point the look-up at it too and pick line numbers out of `viz.allspeak` — a
// check that would then fail whenever this file was edited, for a reason of its own making.
const SIDEFIX = [
	`!! The first block, and this line is its title.`,            // 1
	`!!`,                                                          // 2
	`!! Its prose, which is what the panel shows.`,                // 3
	`Alpha:`,                                                      // 4
	`    return`,                                                  // 5
	`!! @hash 00000000`,                                           // 6
	`!!!`,                                                         // 7
	`!! The second block, and this one holds line twelve.`,        // 8
	`!!`,                                                          // 9
	`!! Its prose too.`,                                           // 10
	`Beta:`,                                                       // 11
	`    return`,                                                  // 12
	`    put \`Total < 20 & Row\` into Msg`,                        // 13
	`!!!`,                                                         // 14
	`!   the code between the blocks, which no doc block holds`,    // 15
	`Gamma:`,                                                      // 16
	`    return`,                                                  // 17
	`!! The third block, so the gap above it has a block on each side.`, // 18
	`!!`,                                                          // 19
	`!! Its prose the third.`,                                     // 20
	`!!!`,                                                         // 21
	`!   and the code after the last block`,                       // 22
	`Delta:`,                                                      // 23
	`    return`,                                                  // 24
].join(`\n`);
// **The fixture is set and then Graph is entered again, because entering is what builds the model** —
// `EnterGraph` parses the buffer with the same `ParseSource` Blocks mode uses. That is not decoration: the
// first version of this check set the buffer and called the handler, so it read the model left behind by
// whatever was parsed last (the editor's own source, from the Blocks checks), and *two of the three checks
// passed anyway* — lines 5 and 12 of `viz.allspeak` happen to fall inside its first two sections. Hence
// the exact titles below: a title that could belong to the wrong file is not a check.
run(`ToggleGraph`);                    // out — the pane is already up from the checks above
scriptElement.innerText = SIDEFIX;
run(`ToggleGraph`);                    // and in again: this is the parse
const modelled = await waitFor(() => Number(valueOf(`SecCount`)) === 3);
check(modelled, `entering the pane builds the section model for the file being reviewed (SecCount=${valueOf(`SecCount`)})`);
// **The report is delivered as the dict the pane actually sends, and that is the point of it.** A dict in
// this language is a *JSON string* in a variable, so `send VizMark to parent` puts
// `{"kind":"mark","line":N,"visit":V,"total":T}` into `message` — not a number. The first version of this
// check put a bare number there, which is kinder than reality in exactly the way that cost an afternoon:
// the handler was written to convert its message rather than to read its property, the check agreed with
// it, and the editor threw in the browser on the first real click. Anything a `send` can carry, this must
// carry too — which is why the visit figures are here as well, the moment the pane began sending them.
const report = (line, visit, total, values) =>
	`{"kind":"mark","line":${line},"visit":${visit},"total":${total}`
	+ (values === undefined ? `` : `,"values":${JSON.stringify(values)}`) + `}`;
program.message = report(12, 3, 7);
run(`SideMarkLine`);
const relayed = await waitFor(() => Number(sideValue(`SideLine`)) === 12);
check(relayed, `a line the pane reports is looked up here and shown in the sidebar (line=${sideValue(`SideLine`)}, found=${sideValue(`SideFound`)})`);
check(sideValue(`SideFound`) === 1 && sideValue(`SideTitle`) === `2. The second block, and this one holds line twelve.`,
	`and the block it names is the one holding that line, numbered as Blocks numbers it (${JSON.stringify(sideValue(`SideTitle`))})`);

// ---- the Code tab, which shows the section's code with the doc blocks taken out --------------------
// **The tab is the one thing the pointer does not carry, so it is set before the report is delivered** — and
// put back afterwards, because the claims below it are about the other tab. Written the way a browser writes
// it (`Core.Put`'s own shape), since this harness stubs the DOM too far down to click a tab for real.
const setSide = (name, content, numeric) => {
	const record = sideRecord(name);
	if (!record) throw new Error(`the sidebar declares no '${name}'`);
	const slot = { type: `constant`, numeric: !!numeric, content };
	record.value[record.index] = slot;
	record.value[0] = slot;
};
// **And the script the sidebar is told about is the one the *pane* was given**, which in this harness has to
// be put there: the editor fetches it over `/read/` for the pane, and a harness with no server reads nothing.
// It is the same text either way, which is the point — the sidebar slices the picture's own script.
const setEditorSource = text => {
	const record = program.getSymbolRecord(`SourceText`);
	const slot = { type: `constant`, numeric: false, content: text };
	record.value[record.index] = slot;
	record.value[0] = slot;
};
const codeHtml = () => String(sideElText(`ec-SideCode`) || ``);
const deliver = async () => {
	program.message = report(12, 3, 7);
	run(`SideMarkLine`);
	await waitFor(() => Number(sideValue(`SideLine`)) === 12);
};
setEditorSource(SIDEFIX);
run(`SendRunToSide`);
setSide(`SideTabSel`, 1, true);
await deliver();
const codePlain = () => codeHtml().replace(/<span[^>]*>/g, ``).replace(/<\/span>/g, ``);
check(codePlain() === `Beta:\n    return\n    put \`Total &lt; 20 &amp; Row\` into Msg\n`,
	`the Code tab shows the section's code with the doc-block lines taken out (${JSON.stringify(codePlain())})`);
check(String(sideElText(`ec-SideProse`) || ``) === `` && String(sideElText(`ec-SideHead`)).includes(`The second block`),
	`and the prose is not presented while it is up, though the heading still names the section`);
check(codeHtml().includes(`&lt; 20 &amp; Row`),
	`and code that looks like markup is escaped rather than eaten, so a script full of it reads as written`);
check(/<span[^>]*>    return<\/span>/.test(codeHtml()),
	`and the line the pointer named is picked out — the section's own line 12, not the line above it`);
// **And the same for a line in the *first* block, which is the claim that catches a pair of bounds being
// taken from the wrong block.** `From` and `To` are written on *every* pass of the look-up's walk, so a walk
// that does not stop at its match leaves them holding the last section in the model — and every code claim
// above this one passes anyway, because line 12 happens to be in that last block. **Which is the fault
// Graham found in the browser on 2026-10-12**: *"the code displayed is always that of the final doc-blocked
// item in the script"*, with the heading right. A fixture whose matched block is also the last one cannot
// see this, so this claim names a block that is not.
program.message = report(5, 1, 4);
run(`SideMarkLine`);
await waitFor(() => Number(sideValue(`SideLine`)) === 5);
check(codePlain() === `Alpha:\n    return\n`,
	`and a line in the first block shows the *first* block's code (${JSON.stringify(codePlain())})`);
check(sideValue(`SideTitle`) === `1. The first block, and this line is its title.`,
	`with the heading naming that block, so the two halves of the report agree (${JSON.stringify(sideValue(`SideTitle`))})`);

// **And a line no doc block holds, which is the case this tab used to answer with a sentence.** The file's
// shape is blocks *and* the code between them, so the editor hands the sidebar the *gap's* bounds for such a
// line — the run from the line after the block before it to the line before the block after it — and the tab
// shows that run. Graham's rule for this panel is why (a tab brings the reading to the reader: `TODO-viz.md`,
// "Settled decisions"), and the case is a fair one, because a script written to the doc-block convention still
// has code between its blocks and after its last one.
program.message = report(17, 2, 2);
run(`SideMarkLine`);
await waitFor(() => Number(sideValue(`SideLine`)) === 17);
check(sideValue(`SideFound`) === 0,
	`a line between two blocks is in no doc block (found=${sideValue(`SideFound`)})`);
check(codePlain() === `Gamma:\n    return\n`,
	`and the code tab shows the code between the blocks rather than a sentence (${JSON.stringify(codePlain())})`);
check(/<span[^>]*>    return<\/span>/.test(codeHtml()),
	`with the line the pointer named picked out in that run, as it is inside a block`);
check(String(sideElText(`ec-SideHead`)) === `Line 17`
	&& String(sideElText(`ec-SideHint`)).includes(`outside any doc block`),
	`and the heading names the line with the sentence kept as a footnote under the code `
	+ `(${JSON.stringify(String(sideElText(`ec-SideHead`)))}, ${JSON.stringify(String(sideElText(`ec-SideHint`)))})`);
// The other end of the file's shape: a gap with no block *after* it, where the walk has no next block to be
// bounded by. The slice runs to the end of the script the sidebar holds — the same guard that keeps a bound
// from another file's message from reading past it.
program.message = report(24, 2, 2);
run(`SideMarkLine`);
await waitFor(() => Number(sideValue(`SideLine`)) === 24);
check(codePlain() === `Delta:\n    return\n`,
	`and the code after the last block is shown to the end of the script (${JSON.stringify(codePlain())})`);
setSide(`SideTabSel`, 0, true);
await deliver();
check(String(sideElText(`ec-SideCode`) || ``) === `` && String(sideElText(`ec-SideProse`) || ``).includes(`Its prose too`),
	`and switching back to the doc block takes the code away again`);
// **The mark's own figures reach the panel's status bar**, which is the one thing that can tell two dots
// on a row apart — they share a line and so a block, and differ only in which arrival they are.
check(String(sideElText(`ec-SideStatus`)).includes(`3 of 7`),
	`and the mark's visit number lands in the panel's status bar (${JSON.stringify(sideElText(`ec-SideStatus`))})`);
program.message = report(5, 1, 4);
run(`SideMarkLine`);
const firstBlock = await waitFor(() => Number(sideValue(`SideLine`)) === 5);
check(firstBlock && sideValue(`SideFound`) === 1 && sideValue(`SideTitle`) === `1. The first block, and this line is its title.`,
	`and the nearer block for a line inside it (${JSON.stringify(sideValue(`SideTitle`))})`);
// A line in *no* block is an answer rather than a failure: the code before the first doc block, and
// between two of them, is outside the convention by design, and saying so beats showing the last block
// somebody looked at.
program.message = report(17, 2, 2);
run(`SideMarkLine`);
const outside = await waitFor(() => Number(sideValue(`SideLine`)) === 17);
check(outside && sideValue(`SideFound`) === 0,
	`and a line in no block says so rather than leaving the last one up (found=${sideValue(`SideFound`)})`);
// **And the status bar still says its piece**, which is the point of it being about the mark rather than
// about the block: a line with no doc block still had its second visit.
check(String(sideElText(`ec-SideStatus`)).includes(`2 of 2`),
	`with the mark's own figures still in the status bar, because they are about the mark (${JSON.stringify(sideElText(`ec-SideStatus`))})`);

// **And the values a script asked to have watched travel the whole way**: pane → editor → sidebar → the
// status bar. This is what `@show Total` buys at the moment somebody clicks the arrival it sits beside, and it
// is the half of attributes that no other check can see — `capture-check` proves the values reach the trace,
// and this proves they reach the reader.
program.message = report(5, 1, 4, { Total: `0`, N: `0` });
run(`SideMarkLine`);
const valuesShown = await waitFor(() => String(sideElText(`ec-SideStatus`)).includes(`N=0`));
check(valuesShown && String(sideElText(`ec-SideStatus`)).includes(`Total=0`),
	`and a mark's captured values are shown with it, in name order `
	+ `(${JSON.stringify(String(sideElText(`ec-SideStatus`)))})`);
// A mark with nothing captured must clear the last one's values rather than leave them standing — the same
// fault the block's own state had, one field along: a reader would be shown the numbers of a different arrival
// under the line and visit of this one.
program.message = report(5, 1, 4);
run(`SideMarkLine`);
const valuesCleared = await waitFor(() => !String(sideElText(`ec-SideStatus`)).includes(`Total=`));
check(valuesCleared,
	`and a mark with no captured values clears the last one's rather than leaving them standing `
	+ `(${JSON.stringify(String(sideElText(`ec-SideStatus`)))})`);

// ---- the popup menu: what opens it, what it offers, and what its rows do --------------------------
//
// **This section sits here rather than with the Graph pane's own work, and the placement is the point.**
// The menu is the editor's box: `viz.json` renders it, the editor's registration opens it, and the
// editor's handler answers its rows. So it needs no drawing at all — it needs both modules *loaded*, to
// say what its two kinds of row do, and that is exactly where this is: inside Graph mode, with the pane
// and the sidebar both running. **This file stops in the Record section** (the pane's first draw throws
// on `VizBusy`; see TODO-viz.md), so a menu check written below that line would never run and would still
// read as coverage — which is how this file came to report fewer checks than it contains.
//
// The gesture is driven the way a browser drives it: the runtime attaches `contextmenu` as a *property*
// on the element the registration named, so calling that property is a right-click — coordinates,
// prevention and all — and the handler's own `the pick position` then reads what the event carried. The
// rows are driven one step in from that, and the same way: `on click` sets the pool's `index` and runs the
// handler, so setting the index and running `MenuItemClick` is the body of a row's click with nothing
// invented.
const rightClick = (element, x, y) => {
	if (!element || typeof element.oncontextmenu !== `function`) return null;
	let prevented = false;
	element.oncontextmenu({ clientX: x, clientY: y, preventDefault: () => { prevented = true; } });
	return prevented;
};
const menuRows = () => Object.values(byId)
	.filter(e => String((e.attributes && e.attributes.id) || ``).startsWith(`ec-MenuItem-`))
	.sort((a, b) => Number(a.attributes.id.replace(/\D+/g, ``)) - Number(b.attributes.id.replace(/\D+/g, ``)));
const menuLabels = () => menuRows().map(e => String(e.innerHTML));
const pickRow = i => {
	const rec = program.getSymbolRecord(`MenuItem`);
	rec.index = i;
	run(`MenuItemClick`);
};

const pictureClick = rightClick(byId[`se-graph-host`], 300, 200);
check(pictureClick === true,
	`a right-click on the picture opens the menu and cancels the browser's own (preventDefault=${pictureClick})`);
check(displayOf(`se-menu`).display === `block` && displayOf(`se-menu-mask`).display === `block`,
	`and what comes up is the menu and its click-away sheet together `
	+ `(menu=${displayOf(`se-menu`).display}, mask=${displayOf(`se-menu-mask`).display})`);
check(displayOf(`se-menu`).left === `300px` && displayOf(`se-menu`).top === `200px`,
	`and it opens where the pointer was rather than in a corner `
	+ `(${displayOf(`se-menu`).left}, ${displayOf(`se-menu`).top})`);
check(JSON.stringify(menuLabels()) === JSON.stringify([`Doc block`, `Code`, `Freeze`]),
	`and its rows are the sidebar's two tabs and the freeze, in that order (${JSON.stringify(menuLabels())})`);

// The click-away, checked as the *wiring* rather than by driving it: the runtime attaches `onclick` to the
// sheet when `on click MenuMask go to HideMenu` is executed, so a function being there is that registration
// having run — and `HideMenu` is the two-line subroutine above. **It is not driven, because this file is on
// borrowed time in exactly this way**: the pane's first draw arms a one-second tick that writes into the
// drawing before the build that creates its element (Graham's open item), so every extra `await` here spends
// the interval this file's live portion has left. What the sheet's click *does* — putting the menu away —
// is asserted where a row does the same thing, on the check below.
check(typeof byId[`se-menu-mask`].onclick === `function`,
	`and the sheet carries its own dismiss handler, which is the whole of a click-away here `
	+ `(onclick=${typeof byId[`se-menu-mask`].onclick})`);

// The sidebar is the other surface it answers on, and the two are separate boxes with separate
// registrations: the fault this catches is one of them registered and the other forgotten, which is
// invisible until somebody right-clicks the half that does nothing.
const sideClick = rightClick(byId[`se-graph-side`], 900, 400);
check(sideClick === true && displayOf(`se-menu`).left === `900px`,
	`and the sidebar answers it too, with the menu moved to that pointer `
	+ `(preventDefault=${sideClick}, ${displayOf(`se-menu`).left}, ${displayOf(`se-menu`).top})`);

// A row acts by *message*, because the tab is the sidebar's state and the freeze is the pane's — so what
// is checked is the round trip: the editor's own row handler, the message it sends, and the state that
// ends up changed on the other side. The report comes first, so the panel has a block in hand either way.
program.message = report(12, 3, 7);
run(`SideMarkLine`);
await waitFor(() => Number(sideValue(`SideLine`)) === 12);
pickRow(1);
const switched = await waitFor(() => Number(sideValue(`SideTabSel`)) === 1);
check(switched && displayOf(`se-menu`).display === `none`,
	`choosing Code puts the menu away and switches the sidebar's tab `
	+ `(SideTabSel=${sideValue(`SideTabSel`)}, menu=${displayOf(`se-menu`).display})`);
check(String(sideElText(`ec-SideCode`)).includes(`return`),
	`and the tab it switched to is showing the section's code `
	+ `(${JSON.stringify(String(sideElText(`ec-SideCode`)).slice(0, 48))})`);

// **The freeze is deliberately not driven from here, and the reason is worth the paragraph.** Its row
// sends a message to the *pane*, and this harness cannot survive one: the pane's first draw arms a ticker
// and a `wait` (see `VizBusyNotice`), and the ticker writes into the drawing before the build that creates
// its element — so a message that arrives while that ticker is armed lets it fire, and the run dies on
// `Cannot set properties of null`. That is Graham's open item, the same one that stops this file in the
// Record section, and it is *not* the menu's: what the menu does with the pane is set a flag through
// `VizFreeze`, which is three statements. So the freeze's crossing, its row reading `Cancel`, and the lift
// the pane makes when the pointer comes back are measured in a browser — `various/menu-measure.js`, the
// rig this change was verified with — and the headless claims for them are owed with the `VizBusy` fix.
//
// What is checked here is what the editor owns and can be asked without waking the pane: that the row is
// there, in the right place, named for the state it would change.

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
// And the module was told, which is the whole reason leaving is a message at all. It is also the check
// that catches the race the guard in `SendRunToViz` exists for: entering and leaving again before the
// recording fetch comes back must not leave the pane believing it is on screen.
check(await waitFor(() => vizValue(`VizShown`) === 0),
	`and the pane is told it is off screen, and not told otherwise by a late reply (VizShown=${vizValue(`VizShown`)})`);

// ---- the bar's order, and the one button that is not always on it -------------------------------
//
// **This is deliberately placed above the Record section, and that placement is the message.** The Record
// section's first act — running the buffer and then reading the recording back — draws in the pane, and the
// pane's first draw throws on `VizBusy` (its element is written before the picture builds it; see TODO-viz.md).
// Everything from there to the end of this file therefore does not run at all: 22 of its 75 checks never
// execute, and these two would have been among them. Measured 2026-10-11. **A check that cannot run is worse
// than no check**, because it reads as coverage.

// **The order asked for, read from the one place that decides it.** `viz.json`'s `$TopBar` `#` list is what
// the page renders, in that order — so that list *is* the bar, and asking it is asking what a reader sees. (The
// seeded DOM above cannot answer: it registers every id in the file but builds no hierarchy, so the top bar it
// knows has no children. A check on that would have been a check on this harness, not on the page.)
//
// Graham, 2026-10-11: *"the order of the buttons in edit mode should be Blocks - Launch - Record - Graph -
// Find"*. This was the first change to the bar since it was built, which is why the order had never been
// asserted at all. The button *definitions* in the file were put in the same order as the list, so the file
// reads the way the bar does — a courtesy to the next reader, and not something this check rests on.
const TOP_ORDER = [`Blocks`, `Launch`, `Record`, `Graph`, `Find`];
const FIVE_IDS = [`se-blocksbtn`, `se-launchbtn`, `se-recordbtn`, `se-graphbtn`, `se-findbtn`];
const byIdOf = Object.fromEntries(Object.entries(UI_JSON)
	.filter(([, v]) => v && typeof v === `object` && typeof v[`@id`] === `string`)
	.map(([, v]) => [v[`@id`], v]));
const listed = (UI_JSON[`$TopBar`][`#`] || []).map(k => (UI_JSON[k] || {})[`@id`])
	.filter(id => FIVE_IDS.includes(id))
	.map(id => ({ id, label: (byIdOf[id] || {})[`#content`] }));
check(JSON.stringify(listed.map(t => t.id)) === JSON.stringify(FIVE_IDS)
	&& JSON.stringify(listed.map(t => t.label)) === JSON.stringify(TOP_ORDER),
	`the bar's tabs are in the order asked for — ${listed.map(t => t.label).join(`, `)} `
	+ `— which is what '$TopBar' renders, so it is what a reader sees (${JSON.stringify(listed.map(t => t.id))})`);

// **The sequence a reader sees is that DOM order *modified by* `order`, and `order` is the part the DOM
// cannot carry.** The button that leaves a pane relabels itself `Edit`, and `Edit` has to be the *first* of
// the five — so each of them states an `order` in `viz.json`, and the two pane toggles take the first two
// places when one of them is the `Edit`. A hidden button is `display: none`: it keeps its `order` and takes
// no place, which is what makes a missing `Launch` — or a missing pane — shuffle nothing.
//
// The stub does not apply the file's styles (measured, as `se-status`'s own `font-size` is absent too), so
// the file's `order` is the fallback here — the value a browser would have applied and the code had not yet
// overwritten. **Graham, 2026-10-12:** *"the sequence is always Edit - Blocks - Launch - Record - Graph -
// Find, including when 1 or more is missing"*, after finding that the `Edit` simply replaced `Graph` where
// `Graph` was — second from the end, rather than first.
const barSequence = () => FIVE_IDS
	.map((id, dom) => ({
		id,
		label: contentOf(id) || (byIdOf[id] || {})[`#content`],
		order: Number(((byId[id] || {}).style || {}).order ?? (byIdOf[id] || {})[`order`] ?? 0),
		dom,
	}))
	.filter(t => ((byId[t.id] || {}).style || {}).display !== `none`)
	.sort((a, b) => (a.order - b.order) || (a.dom - b.dom))
	.map(t => t.label);
check(JSON.stringify(barSequence()) === JSON.stringify(TOP_ORDER),
	`and with each button's place taken into account it is that same sequence (${barSequence().join(`, `)})`);

// In the Graph pane the `Edit` takes that first place, which is what the `order`s are for. Before this the
// bar read `Blocks, Launch, Record, Edit, Find`. Toggling in and straight back out leaves the editor where
// these checks found it.
run(`ToggleGraph`);
check(JSON.stringify(barSequence()) === JSON.stringify([`Edit`, `Blocks`, `Launch`, `Record`, `Find`]),
	`and in Graph mode the Edit leads, so the sequence is Edit - Blocks - Launch - Record - Find `
	+ `(${barSequence().join(`, `)})`);
run(`ToggleGraph`);
check(JSON.stringify(barSequence()) === JSON.stringify(TOP_ORDER),
	`and leaving the pane puts the bar back as it was (${barSequence().join(`, `)})`);

// **And Launch is put away for a script this page cannot run.** Launching hands the script to the JavaScript
// runtime, and a `@py` script is by definition one it cannot compile — so the button would open a window that
// does nothing. The flavour is the parse's, so the button follows the tab's script rather than a memory of it:
// the marker is *added and taken away below*, and the button has to move with it both ways.
//
// The project is set to `js` for both halves, so the only thing that can make the script Python-side is its
// own `@py` marker, which is the case Graham described. The value the button goes back to is the one
// `viz.json` states for it, read from there rather than written a second time in this file.
//
// **The two fixtures, and the Python one has to be a script this runtime cannot compile.** `dictionary` is
// Python's, so the marker lands on a script whose only visible fault *is* Python vocabulary — which is the
// case the flavour reader exists for, and the case the Record section's own note records as having passed on a
// fixture that was compilable and therefore proved nothing. The buffer is saved and put back, because
// everything below the Record section reviews the file this check was run with.
//
// The check asserts the flavour it got, so a fixture that stopped being Python-side fails the check rather
// than passing it quietly.
const PY_TAB = [
	`    @py`,
	`    script LaunchTabIsPython`,
	`    variable Lookup`,
	`Main:`,
	`    dictionary Lookup`,
	`    stop`,
].join(`\n`) + `\n`;
const JS_TAB = [
	`    script LaunchTabIsJavaScript`,
	`    variable N`,
	`Main:`,
	`    put 0 into N`,
	`    stop`,
].join(`\n`) + `\n`;
const bufferWas = scriptElement.innerText;
runtimeElement.innerHTML = `js`;
runtimeElement.textContent = `js`;
const launchShown = () => ((displayOf(`se-launchbtn`) || {}).display) || ``;
const launchStyle = (UI_JSON[`$LaunchBtn`] || {}).display;
scriptElement.innerText = PY_TAB;
run(`ParseSource`);
check(String(valueOf(`TabFlavour`)) === `py` && launchShown() === `none`,
	`a tab whose script is Python-side has no Launch button, because launching it would do nothing `
	+ `(flavour ${JSON.stringify(String(valueOf(`TabFlavour`)))}, display ${JSON.stringify(launchShown())})`);
scriptElement.innerText = JS_TAB;
run(`ParseSource`);
check(String(valueOf(`TabFlavour`)) === `js` && launchShown() === launchStyle,
	`and taking the marker away puts it back, so the button follows the tab's script rather than remembering `
	+ `one (flavour ${JSON.stringify(String(valueOf(`TabFlavour`)))}, display ${JSON.stringify(launchShown())}, `
	+ `which is what viz.json states for it)`);
scriptElement.innerText = bufferWas;

// ---- and the Record button does what it says ------------------------------------------------
//
// **The trigger, end to end through the editor's own path.** `RecordRun` is what the button runs: it reads the
// buffer, has the plugin run it with a recorder and the guard armed, and writes `<script>.viz.json` back
// through the route a saved tab uses. What is checked here is that a recording comes out and reaches the
// server under the name the pane will look for — the rest of the loop (the pane drawing it) is the harness
// next door.
//
// **It is last in this file on purpose**: opening a tab drops out of whatever mode was up, and the checks above
// are fastidious about which pane is showing.
//
// The buffer is then replaced with a small script rather than left as the file's own text: recording *that*
// file would run a second copy of the editor inside the harness — slow, and writing to the stubs — which is not
// what this asks about.
program.getSymbolRecord(`TabItem`).value[0] = { type: `constant`, numeric: false, content: `tools/trace-wide.allspeak` };
program.getSymbolRecord(`File`).value[0] = { type: `constant`, numeric: false, content: `trace-wide.allspeak` };
run(`OpenFile`);
// The read is a `rest get`, so it hands control back and resumes: the tab is not open yet without this wait.
await waitFor(() => String(valueOf(`TabPath`)).endsWith(`.allspeak`));
scriptElement.innerText = [
	`    script Tiny`,
	`    variable N`,
	`Main:`,
	`    viz start`,
	`    put 0 into N`,
	`    while N is less than 5`,
	`    begin`,
	`        add 1 to N`,
	`    end`,
	`    viz stop`,
	`    stop`,
].join(`\n`);
written.length = 0;
run(`RecordRun`);
const posted = written.find(w => /\.viz\.json$/.test(w.url));
let recorded = null;
try { recorded = JSON.parse(posted.body); } catch (err) { recorded = null; }
check(!!posted && !!recorded && Array.isArray(recorded.traceEvents),
	`the Record button runs the buffer with a recorder and writes the recording beside the script `
	+ `(POST ${posted ? posted.url.replace(/^.*?\/write\//, `/write/`) : `nothing`}, `
	+ `${recorded && recorded.traceEvents ? recorded.traceEvents.length : 0} event(s))`);
check(!!posted && /"cat":\s*"window"/.test(posted.body),
	`and what it wrote is a recording of that run rather than an empty document `
	+ `(${posted ? posted.body.length : 0} bytes)`);
// **And the recording is reported for what it *is*, not just as a write that happened.** The buffer is a loop
// of five over one mark line, and the count is exact and in the pane's own unit: seven visits is what that run
// does, five of them through the marked line.
//
// **It was eight until 2026-10-04, and the difference is a fixed faulty reading rather than a change of
// unit.** `@viz stop` never closed its window — the handler sat below the recorder's early return for a
// command that is not an anchor, and a marker line never is one — so a window ran on past its own stop until
// `finish()` closed it at the end of the run, and the recording carried one visit that happened after the
// marker. Seven is the window measured from its start to its stop.
//
// **This is asserted on the verdict rather than on the status line, and that is not a shortcut.** The status
// line has three writers — this, the auto-save ("Saved"), and the pane when it fetches a run — and any of them
// can land between the button's press and the next line of a check, so a check reading it is a race dressed as
// an assertion. The verdict is what the status line is *built from*, so it is the same fact without the race.
check(/\b7 visits in 1 window\b/.test(String(valueOf(`RecordVerdict`))),
	`and what the recording amounted to is reported rather than only that a file was written `
	+ `(verdict ${JSON.stringify(String(valueOf(`RecordVerdict`)))})`);
check(!!AllSpeak.scripts[`Viz`] && AllSpeak.scripts[`Viz`] === program,
	`with the editor still registered under its own name afterwards, the recording having borrowed it`);

// **And Record opens an app rather than running it** — one button, two acts, and the *script* says which. The
// observable half is the window: a buffer naming an app must make the editor open that page, and a buffer naming
// none must not. The arming itself happens across a window boundary and cannot be reached from here; the honest
// note is on the assertion below rather than a pretence that it was covered.
scriptElement.innerText = [
	`@app parser.html`,
	`    script TinyApp`,
	`    variable N`,
	`Main:`,
	`    @viz start`,
	`    @viz stop`,
	`    stop`,
].join(`\n`) + `\n`;
written.length = 0;
openedPages.length = 0;
run(`RecordRun`);
check(openedPages.length === 1 && openedPages[0] === `parser.html` && written.length === 0,
	`Record opens the page an app script names, instead of running it here `
	+ `(opened ${JSON.stringify(openedPages)}, ${written.length} write(s))`);
console.log(`  ..    the arming across the window boundary is not asserted: it needs two live windows, and the `
	+ `editor's own harness has one`);

// A script with no app still takes the other path, so the branch is not a switch that lost its other half.
scriptElement.innerText = [
	`    script PlainAgain`,
	`    variable N`,
	`Main:`,
	`    @viz start`,
	`    put 0 into N`,
	`    add 1 to N`,
	`    @viz stop`,
	`    stop`,
].join(`\n`) + `\n`;
written.length = 0;
openedPages.length = 0;
run(`RecordRun`);
check(openedPages.length === 0 && written.some(w => /\.viz\.json$/.test(w.url)),
	`and a script with no app is still run and recorded here `
	+ `(opened ${openedPages.length}, ${written.length} write(s))`);

// **A recording that comes back empty has to say why, and this is the case that was reported.** A script
// written for the *other* runtime compiles to a refusal, not to a recording — `dictionary` exists in the Python
// flavour and in no JS one — and "Could not record this script" on its own sends a reader looking for a fault in
// a script that is perfectly good, in a runtime it was never meant for. So the refusal's own words are shown:
// the word, the line, and therefore the reason. Reported by Graham, 2026-10-03, from a two-variant project.
written.length = 0;
scriptElement.innerText = [
	`    script PythonFlavour`,
	`    variable Lookup`,
	`Main:`,
	`    dictionary Lookup`,
	`    viz start`,
	`    viz stop`,
	`    stop`,
].join(`\n`);
written.length = 0;
run(`RecordRun`);
const verdict = String(valueOf(`RecordVerdict`));
check(written.length === 0 && /could not run/.test(verdict) && /dictionary/.test(verdict),
	`a script this runtime cannot compile is refused with the runtime's own words, not a silent empty recording `
	+ `(verdict ${JSON.stringify(verdict.slice(0, 80))}, ${written.length} write(s))`);

// ---- and a script for the Python runtime is run by the project's server -------------------------
//
// **This is the branch the editor could not take until 2026-10-05.** The editor is a page, so it has the
// JavaScript runtime and nothing else, and a script written for Python could only be *refused* — in a sentence,
// once the flavour was known. Now the project's own dev server runs it: `/record/<script>` runs it exactly as
// `allspeak <script>` would, and answers with the verdict and the name of the output file.
//
// **The script below carries no marker at all, and that is the point.** What is being checked is the *project's*
// answer arriving through `#editor-runtime` — the half that had no check, and the half that keeps a Python
// project's scripts marker-free. So the page says `py`, the buffer says nothing, and the request is the evidence.
const PLAIN_FOR_PY = [
	`    script NoMarkerAtAll`,
	`    variable N`,
	`Main:`,
	`    viz start`,
	`    put 0 into N`,
	`    viz stop`,
	`    stop`,
].join(`\n`) + `\n`;

// **The page element itself, and that is the point.** The editor no longer reads `#editor-runtime` — the
// *plugin* does, when it models the script, and the model carries the answer as a `flavour |` record. So
// setting the element here is what a dev server does with a project's `.allspeak-init`, and it reaches the
// editor through the plugin exactly as it does in a project. That also closes the gap this file used to have:
// the element was unread by anything the harness could reach.
runtimeElement.innerHTML = `py`;
runtimeElement.textContent = `py`;
scriptElement.innerText = PLAIN_FOR_PY;
askedOfServer.length = 0;
written.length = 0;
run(`RecordRun`);
check(askedOfServer.length === 1 && /\.allspeak$/.test(askedOfServer[0]) && written.length === 0,
	`a project whose page says 'py' has its unmarked script run by the server, not in the page `
	+ `(asked for ${JSON.stringify(askedOfServer)}, ${written.length} write(s))`);
// **And the reply is awaited, because `rest get` continues on a later tick.** `run('RecordRun')` returns at the
// request; the editor's `set the content of StatusSpan` happens after the response arrives.
//
// **What is asserted is the reply, not the status line, and that is deliberate.** The status line has three
// writers — a transient action, the auto-save, and the pane when it fetches a run (TODO-viz names the same
// three) — so by the time a check reads it the auto-save may have put `Saved` there instead. The reply is the
// thing the button computed and handed to the line, so it is the stable evidence; a check on the line would be
// a check on which writer went last.
await waitFor(() => /-stdout\.txt/.test(String(valueOf(`RecordReply`))));
check(/41 visits in 1 window/.test(String(valueOf(`RecordReply`)))
	&& /-stdout\.txt/.test(String(valueOf(`RecordReply`))),
	`and the reply says what the run amounted to and where its output is `
	+ `(${JSON.stringify(String(valueOf(`RecordReply`)).slice(0, 70))})`);

// **And the same buffer, in a project that says `js`, still runs here** — so the branch is the project's answer
// and not a change to what Record does with every script.
runtimeElement.innerHTML = `js`;
runtimeElement.textContent = `js`;
askedOfServer.length = 0;
written.length = 0;
run(`RecordRun`);
check(askedOfServer.length === 0 && written.some(w => /\.viz\.json$/.test(w.url)),
	`the same script in a project that says 'js' is run and recorded here as it always was `
	+ `(asked the server ${askedOfServer.length} time(s), ${written.length} write(s))`);

// **And a marker beats the project**, which is the rule both sides of the editor use: a `@py` script in a `js`
// project goes to the server too. Without this the project's answer would be a default rather than an override.
//
// **The marker's script has to be one this runtime cannot compile, and the first version of this check was not
// — which is how the fault it now guards got in.** It used `PLAIN_FOR_PY`, plain core vocabulary that the
// JavaScript runtime compiles happily, so the model still carried an `attr | … | py` record and the editor's
// resolution worked. The real case is the opposite by construction: a script carrying `@py` uses Python
// vocabulary, so the model emits **no attribute records at all** (`commands=0`) and a reader that asks the
// compiled program for the marker finds none exactly when the marker matters. Measured 2026-10-05, and it is
// why the model reports the flavour itself, from the token stream. A check on this boundary has to carry what
// the boundary carries.
const PY_ONLY_BODY = [
	`    script MarkerOnAPythonScript`,
	`    variable Lookup`,
	`Main:`,
	`    dictionary Lookup`,
	`    viz start`,
	`    viz stop`,
	`    stop`,
].join(`\n`) + `\n`;
runtimeElement.innerHTML = `js`;
runtimeElement.textContent = `js`;
scriptElement.innerText = `    @py\n` + PY_ONLY_BODY;
askedOfServer.length = 0;
written.length = 0;
run(`RecordRun`);
check(askedOfServer.length === 1 && written.length === 0,
	`and a script marked '@py' goes to the server even in a project that says 'js' `
	+ `(asked for ${JSON.stringify(askedOfServer)}, ${written.length} write(s))`);


// ---- and Launch opens the page the script names ----------------------------------------------
//
// **The app is named by an attribute, and the attribute is read by the same parse the Blocks view uses** — so
// what is being checked is not a scan of its own but that the editor's one reading of the buffer feeds the
// button. `@app parser.html` arrives through `MaybeMeta`, where the key and value are already apart.
//
// The page is opened relative to the editor's own location, so the editor hands the browser the string as it
// stands; that the app then resolves it against the project root is the browser's business, and it is why no
// path is assembled here.
const TINY_APP = [
	`    script TinyApp`,
	`    variable N`,
	`Main:`,
	`    viz start`,
	`    viz stop`,
	`    stop`,
].join(`\n`);
// **The real spelling, as an attribute of the program** — a line of its own, which the tokeniser lifts into the
// compiled program. Read from there rather than from the buffer's text, so it is the *tokeniser* that decides
// what an attribute is and not a scan of this file.
scriptElement.innerText = `@app parser.html\n` + TINY_APP + `\n`;
openedPages.length = 0;
run(`LaunchApp`);
check(openedPages.length === 1 && openedPages[0] === `parser.html`,
	`Launch opens the page the script's '@app' names, in a window of its own `
	+ `(opened ${JSON.stringify(openedPages)})`);

// Removing the attribute must stop the launch rather than leave the last one standing: the parse clears the
// page before it reads the buffer, and this is what says so.
scriptElement.innerText = TINY_APP + `\n`;
openedPages.length = 0;
run(`LaunchApp`);
// **And the message has to say *where*, which is the part this check did not ask for and a reader had to.**
// The first version said "to a doc block" — the one place an attribute cannot go, since a `@`-line inside a `!!`
// block is the analyser's metadata and never reaches the compiler. So the assertion is no longer "it complains":
// it is that the complaint names the line and denies the comment.
// **And the spelling has to be *there*, which is the part this check still did not ask for.** The message's
// whole job is to show a reader the attribute to write, and it was written with a placeholder — `'@app <page>'` —
// which `set the content of` parses as an HTML tag, so the reader got `add '@app ' on a line of its own`: the one
// thing the sentence exists for, silently gone. This harness could not see it because its stub element stores
// the string it is assigned instead of parsing it (a browser parses `innerHTML`), so the assertion is on what a
// reader *gets*: `@app` and a **filename**, which is a token with a dot in it.
//
// **And the first version of this assertion was too loose, which is worth keeping.** `@app \S+` passed on the
// broken form, because the quote after `@app ` is a non-space character — so it said nothing. The dotted token is
// what distinguishes an example from a placeholder, and it fails on both `'@app '<page>'` (eaten) and on a
// second placeholder written the same way.
const launchMessage = String(contentOf(`se-status`));
check(openedPages.length === 0
	&& /No app named/.test(launchMessage)
	&& /line of its own/.test(launchMessage)
	&& /not a comment/.test(launchMessage)
	&& /@app \S*\.\S*/.test(launchMessage)
	&& !/</.test(launchMessage),
	`and a script with no '@app' is told so, how to declare one, and *what to write* — rather than the button `
	+ `doing nothing (opened ${openedPages.length}, status ${JSON.stringify(launchMessage.slice(0, 46))})`);

// ---- is returning to Graph the same recording, and does each tab keep its own? ----------------
//
// **Two questions of Graham's, asked of the code rather than answered from reading it** — this session has twice
// proved that reading the drawing is a poor substitute for measuring it. The pane is reopened on every entry, so
// the *file* is refetched each time; what needs saying is whether that lands on the same recording, and whose
// recording it is when the tab changes.
const enterWith = async file => {
	program.getSymbolRecord(`TabItem`).value[0] = { type: `constant`, numeric: false, content: file };
	run(`OpenFile`);
	await waitFor(() => String(valueOf(`TabPath`)) === file);
	served.length = 0;
	run(`ToggleGraph`);
	await waitFor(() => up(panes()).includes(`GraphArea`));
	// **Wait for the recording to have been *asked for*, not merely for the pane to hold something.** The pane
	// keeps what it was last told, so `VizEvents` is already non-empty the moment a look begins — which is the
	// very thing the checks below exist to catch — and that satisfied this wait at once, on the *previous* tab's
	// arrivals. It happened to be harmless while the editor fetched the recording first and the pane was
	// messaged a tick later; it is not harmless in principle, and the fetch is the boundary these checks are
	// about, so the fetch is what to wait on.
	await waitFor(() => served.some(u => u.endsWith(file + `.viz.json`)));
	await waitFor(() => vizValue(`VizEvents`) !== undefined && vizValue(`VizEvents`) !== ``);
	return { events: String(vizValue(`VizEvents`) || ``), asked: served.slice() };
};

// A recording to look at, made the way the Record button makes one, so this needs no fixture on disk: the
// stub serves what was posted — which is how the pane reads it back.
program.getSymbolRecord(`TabItem`).value[0] = { type: `constant`, numeric: false, content: `tools/trace-wide.allspeak` };
run(`OpenFile`);
await waitFor(() => String(valueOf(`TabPath`)) === `tools/trace-wide.allspeak`);
scriptElement.innerText = [
	`    script GraphKeeps`,
	`    variable N`,
	`Main:`,
	`    @viz start`,
	`    put 0 into N`,
	`    while N is less than 3 @show N`,
	`    begin`,
	`        add 1 to N`,
	`    end`,
	`    @viz stop`,
	`    stop`,
].join(`\n`) + `\n`;
written.length = 0;
run(`RecordRun`);
const madeRecording = await waitFor(() => written.some(w => /\.viz\.json$/.test(w.url)));
check(madeRecording, `a recording is made for the tab under test (${written.length} write(s))`);

const firstLook = await enterWith(`tools/trace-wide.allspeak`);
run(`ToggleGraph`);                       // out to the flat editor
const secondLook = await enterWith(`tools/trace-wide.allspeak`);
check(firstLook.events !== `` && firstLook.events === secondLook.events,
	`leaving the pane and coming back shows the same recording, because the recording is the file `
	+ `(${firstLook.events.length} bytes both times)`);
check(secondLook.asked.some(u => /trace-wide\.allspeak\.viz\.json/.test(u)),
	`and it is fetched again rather than remembered, so an edited and re-recorded script is not shown stale `
	+ `(${JSON.stringify(secondLook.asked)})`);

const otherLook = await enterWith(`viz-side.allspeak`);
// **And here is the answer to "does each tab keep its own", which is not quite what it looked like.** The tab
// does ask for its own recording — but the pane is a panel, not a tab: it holds what it was last told, so a tab
// whose recording is missing would go on showing the previous tab's unless the editor clears it. So the check
// asks for the *empty* state, which is the behaviour a reader needs, not merely for a different one.
// The cleared pane holds an **empty list** of arrivals (`[]`), not an absent one — that is what the draw sets
// when there is no recording to read, and asserting the spelling rather than "no events" is what made this
// check red for a round after the fault itself was fixed.
check(otherLook.asked.some(u => /viz-side\.allspeak\.viz\.json/.test(u))
	&& (otherLook.events === `` || otherLook.events === `[]`),
	`and another tab asks for its own recording and the pane is cleared to no arrivals rather than left `
	+ `showing the last one (asked ${JSON.stringify(otherLook.asked)}, events=${JSON.stringify(otherLook.events)})`);

const backLook = await enterWith(`tools/trace-wide.allspeak`);
check(backLook.events === firstLook.events,
	`so returning to the first tab shows that tab's recording again (${backLook.events.length} bytes)`);

console.log(failures.length === 0
	? `\nviz-modes-check: all checks passed`
	: `\nviz-modes-check: ${failures.length} check(s) failed`);
process.exit(failures.length === 0 ? 0 : 1);
})();
