#!/usr/bin/env node
//
// Does text fetched by a URL arrive as UTF-8 — the page a script reads, the accents it contains?
//
// **Why this exists.** `response.text` decodes with the charset a response declares, and for `text/*`
// with no charset at all it is told (RFC 2616) to assume ISO-8859-1. Plenty of servers serve a page that
// way — including allspeak.ai's own, which answers `content-type: text/html` for `code/edit.html` — so a
// UTF-8 page arrived with every em dash and every accented letter doubled: `—` became `â€"`, `café`
// became `cafÃ©`. Measured 2026-10-04, and the JS twin never had it, because `fetch().text()` decodes
// UTF-8 whatever the header says. This check drives the Python runtime over a page served in exactly
// that shape and insists on the text.
//
// It needs a checkout — it runs `allspeak-py` itself, from the repository rather than from an installed
// copy, which is the trap this check is most likely to fall into on a machine that has both — so it says
// that plainly rather than failing on a missing file. A starter pack is a client of the CDN and carries
// no `js/`.
//
// Usage:  node tools/encoding-check.js
//
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');

const root = path.resolve(__dirname, `..`);
if (!fs.existsSync(path.join(root, `allspeak-py`, `allspeak`))) {
	process.stderr.write(`encoding-check: no allspeak-py beside this script. This check runs the runtime`
		+ ` itself, so it needs a checkout of the AllSpeak repository rather than a starter pack.\n`);
	process.exit(2);
}

let failures = 0;
const check = (ok, text) => {
	console.log(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};
const note = text => console.log(`  ..    ${text}`);

// The fixture: one of each kind of character the fault doubled — an em dash, a typographic apostrophe,
// an accent on a vowel, an umlaut, an eszett and a grave — plus the ASCII around them, so a difference
// cannot hide in a length.
const TEXT = `served copy — the editor\u2019s source: café, Grüße, à la carte`;
const MANGLED = `â`;   // the first character of every doubly-encoded one

// ---- the instrument, checked before the subject ------------------------------------------------------
//
// The whole point is a page *served without a charset*. If the served header ever grows one, this check
// would still pass while testing nothing, so the premise is asserted first — the same rule the Graph
// pane's own notes carry.

const header = { type: null };
const server = http.createServer((request, response) => {
	header.type = `text/html`;                       // deliberately no charset: this is the case that bit
	response.writeHead(200, { 'Content-Type': header.type });
	response.end(Buffer.from(TEXT + `\n`, `utf8`));
});
const listens = new Promise(resolve => server.listen(0, `127.0.0.1`, resolve));

const work = fs.mkdtempSync(path.join(os.tmpdir(), `encoding-check-`));
const script = path.join(work, `fetch.allspeak`);
const driver = `
import sys
sys.path.insert(0, ${JSON.stringify(path.join(root, `allspeak-py`))})   # the checkout, before anything
import allspeak
sys.argv = ['allspeak', ${JSON.stringify(script)}]
allspeak.Main()
`;
const source = [
	`script Fetch`,
	``,
	`variable Page`,
	``,
	`get Page from url \`http://127.0.0.1:PORT/fixture.html\``,
	`print Page`,
	`exit`
].join(`\n`);

listens.then(() => {
	const port = server.address().port;
	fs.writeFileSync(script, source.replace(`PORT`, String(port)) + `\n`);
	// **The run is asynchronous on purpose.** This process is the server the runtime is fetching from, and
	// `execFileSync` would block its event loop — so the request would arrive at a server that cannot
	// answer, and the check would report a read timeout from the runtime rather than anything about
	// encoding. (It did, once, while this file was being written.)
	execFile(`python3`, [`-c`, driver], { cwd: work, encoding: `utf8` }, (err, stdout, stderr) => {
		const out = typeof stdout === `string` ? stdout : ``;
		if (typeof stderr === `string` && stderr) process.stderr.write(stderr);
		server.close();

		console.log(`a page served as ${header.type}, with no charset:`);
		check(header.type === `text/html`, `the served header has no charset (${header.type}) — the case under test`);
		check(TEXT.length > 0 && [...TEXT].some(c => c.codePointAt(0) > 127), `the fixture really does carry multibyte characters (${TEXT.length} of them)`);
		check(Buffer.byteLength(TEXT, `utf8`) > TEXT.length, `and they are multibyte in bytes (${Buffer.byteLength(TEXT, `utf8`)} bytes for ${TEXT.length} characters)`);

		console.log(`and the Python runtime, on what it fetched:`);
		check(out.includes(TEXT), `the text arrives exactly: ${JSON.stringify(TEXT)}`);
		check(!out.includes(MANGLED), `and not doubly encoded — no ${JSON.stringify(MANGLED)} anywhere in it`);
		if (err) note(`the run exited with ${err.code}; its output is above this line`);
		note(`not asserted for the JS runtime: node has no URL fetch in the runtime's path, and the browser's`);
		note(`\`fetch().text()\` decodes UTF-8 whatever the header says — which is the rule this brings Python to.`);

		console.log(``);
		console.log(failures === 0 ? `encoding-check: all checks passed` : `encoding-check: ${failures} check(s) failed`);
		process.exit(failures === 0 ? 0 : 1);
	});
});
