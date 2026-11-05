#!/usr/bin/env node
//
// Does the `photo` plugin do what its vocabulary says — and does it do it through the real runtime,
// or only through the core's own promises? The vocabulary is
// `sherpa/requests/allspeak-photo-plugin.md`; this file is what asks the questions of it here.
//
// **Why this exists.** The plugin is two halves that fail differently. The core half
// (`photo-core.js`) can satisfy its promise API while leaving EXIF in the bytes or upscaling a
// photograph no browser would upscale; the vocabulary half (`photo.js`) can compile a sentence into
// a shape nobody runs, and a script with no runtime error and no effect is the hardest kind of fault
// to notice. So each half is asked its own questions, and then both are asked together: a script is
// compiled by the real compiler and run by the real run loop over a native canvas.
//
// **The metadata cases are the ones that need asserting, not assuming.** "A no-op resize keeps the
// bytes" and "encode strips the location" are the two claims a script relies on when it decides
// whether to call `encode` before storing a photograph, and a plausible implementation can be wrong
// about both. Each fixture carries a GPS marker inserted into a real APP1 segment, and the marker is
// looked for in the output bytes rather than inferred from the code path.
//
// **What a terminal cannot hold.** A real file picker is a browser gesture, so the element is
// attached by hand — the handle and its commands are tested, the picker is not. EXIF orientation is a
// browser's decode: this platform (`@napi-rs/canvas`) has no `createImageBitmap`, so the check drives
// the same seam the vocabulary uses and says so, rather than pretending to have measured a browser.
//
// **What it needs.** `@napi-rs/canvas` is a dev dependency and not a runtime one, so this says how
// to get it rather than dying on a require:
//
//     npm install --no-save @napi-rs/canvas
//     node tools/photo-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles the runtime from source, so it needs a checkout rather than a starter pack — the
// same sentence the other checks say, for the same reason: a pack is a client of the CDN.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`photo-check: no js/allspeak beside this script. This check compiles the runtime`
		+ ` from source and runs it, so it needs a checkout of the AllSpeak repository rather than a`
		+ ` starter pack.\n`);
	process.exit(2);
}
let canvasApi = null;
try {
	canvasApi = require(`@napi-rs/canvas`);
} catch (err) {
	process.stderr.write(`photo-check: @napi-rs/canvas is not installed. It is the decoder, canvas and`
		+ ` encoder this check runs against, and it is a dev dependency rather than a runtime one:\n\n`
		+ `    npm install --no-save @napi-rs/canvas\n\n`);
	process.exit(2);
}
const { createCanvas, loadImage } = canvasApi;

let failures = 0;
let checks = 0;
// The runtime's own `print` goes to the console, so the console is captured below; the report has
// to be written through the original or it disappears into the same buffer.
const say = console.log.bind(console);
const check = (ok, text) => {
	checks++;
	say(`  ${ok ? `OK` : `FAIL`}  ${text}`);
	if (!ok) failures++;
};
const section = text => say(`\n${text}`);

// ---- the runtime, loaded the way a page loads it ----------------------------------------------
// The stub is the one `tools/idb-check.js` uses, for the same reason: the compiler needs a
// `document` to exist, and nothing here should ever reach it.

const noop = () => {};
global.window = global;
global.location = { search: `` };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.removeEventListener = noop;
global.document = {
	getElementById: () => null,
	querySelector: () => null,
	createElement: () => ({ style: {}, appendChild: noop, setAttribute: noop, files: [] }),
	addEventListener: noop,
	body: { appendChild: noop, style: {}, classList: { add: noop, remove: noop } },
	head: { appendChild: noop }
};

const alerts = [];
global.alert = message => alerts.push(String(message));
const printed = [];
console.log = (...args) => printed.push(args.join(` `));

const RUNTIME = [
	`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`,
	`Language.js`, `LanguagePack_en.js`, `Compile.js`, `Main.js`
];
for (const file of RUNTIME) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
}
// Core first, as a page must: the vocabulary adapter reads the core's global. `idb.js` is loaded
// for its declaration alone — `photo copy … into` names an `idb blob` handle, and the declaration is
// what gives the compiler a type to check.
for (const file of [`idb.js`, `photo-core.js`, `photo.js`]) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, file), `utf8`), { filename: file });
}
vm.runInThisContext(`globalThis.__photoCheck = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en,`
	+ ` AllSpeak_Photo, AllSpeak_Photo_Core };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_Photo, AllSpeak_Photo_Core } =
	globalThis.__photoCheck;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.scripts = {};
AllSpeak.scriptIndex = 0;

// ---- the platform ----------------------------------------------------------------------------
//
// The core takes its decoder, canvas, URL and document as one object, which is what makes a terminal
// a usable instrument: `createImageBitmap` is the one part @napi-rs/canvas has no counterpart for,
// and it is supplied here over `loadImage`. Resize options are honoured by drawing into a canvas at
// the requested size, which is exactly the work a browser does while decoding.

const urls = { created: [], revoked: [] };
const urlApi = {
	createObjectURL(blob) {
		const url = `blob:check/${urls.created.length + 1}`;
		urls.created.push(url);
		return url;
	},
	revokeObjectURL(url) {
		urls.revoked.push(url);
	}
};

const anchors = [];
const documentStub = {
	body: { appendChild: noop, removeChild: noop },
	createElement(tag) {
		const anchor = {
			tag,
			style: {},
			href: ``,
			download: ``,
			clicked: 0,
			click() {
				this.clicked++;
			}
		};
		anchors.push(anchor);
		return anchor;
	}
};

const makePlatform = (overrides) => Object.assign({
	createImageBitmap: async (blob, options) => {
		const image = await loadImage(Buffer.from(await blob.arrayBuffer()));
		const width = options && options.resizeWidth;
		const height = options && options.resizeHeight;
		if (!width && !height) {
			return image;
		}
		const targetWidth = width || Math.round(image.width * (height / image.height));
		const targetHeight = height || Math.round(image.height * (width / image.width));
		const canvas = createCanvas(targetWidth, targetHeight);
		canvas.getContext(`2d`).drawImage(image, 0, 0, targetWidth, targetHeight);
		return canvas;
	},
	createCanvas: (width, height) => createCanvas(width, height),
	URL: urlApi,
	document: documentStub,
	fetch: null
}, overrides);

const platform = makePlatform();

// ---- fixtures --------------------------------------------------------------------------------

const encodeCanvas = async (canvas, type, quality) =>
	new Blob([await canvas.encode(type.slice(`image/`.length), quality)], { type });

const solid = async (width, height, colour = `#3366cc`) => {
	const canvas = createCanvas(width, height);
	const context = canvas.getContext(`2d`);
	context.fillStyle = colour;
	context.fillRect(0, 0, width, height);
	return encodeCanvas(canvas, `image/jpeg`, 85);
};

// A real APP1 segment, inserted after the start-of-image marker. A decoder skips it, which is the
// point: the photograph draws perfectly and the bytes still say where it was taken.
const withExif = (bytes, text) => {
	const payload = Buffer.concat([
		Buffer.from(`Exif\0\0`, `latin1`),
		Buffer.from(text, `latin1`)
	]);
	const head = Buffer.alloc(4);
	head[0] = 0xFF;
	head[1] = 0xE1;
	head.writeUInt16BE(payload.length + 2, 2);
	return Buffer.concat([bytes.subarray(0, 2), head, payload, bytes.subarray(2)]);
};

const gpsText = `GPSLatitude=51.505;GPSLongitude=-0.09;`;
const gpsBlob = async (width, height) => {
	const bytes = Buffer.from(await (await solid(width, height)).arrayBuffer());
	return {
		original: bytes,
		blob: new Blob([withExif(bytes, gpsText)], { type: `image/jpeg` })
	};
};
const hasGps = bytes => Buffer.from(bytes).includes(Buffer.from(`GPSLatitude`));

const bytesOf = async blob => Buffer.from(await blob.arrayBuffer());
const tick = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));

// ---- driving a script -------------------------------------------------------------------------

const takePrinted = () => printed.splice(0, printed.length);
const failedAlerts = () => alerts.splice(0, alerts.length);

const compileProgram = (source) => {
	const tokens = AllSpeak.tokeniseFile(source.split(`\n`));
	const program = AllSpeak.compileScript(tokens, {}, null, null);
	program.script = AllSpeak.scriptIndex++;
	return program;
};

// A compiled program is registered and run by hand, which is what lets a file input be filled
// between the two — the one thing a page's picker does that a terminal cannot.
const drive = (program, options) => new Promise((resolve, reject) => {
	const settings = options || {};
	const timeoutMs = settings.timeoutMs || 8000;
	AllSpeak.scripts[program.script] = program;
	program.running = true;
	program.run(0);
	const deadline = Date.now() + timeoutMs;
	const poll = () => {
		if (program.aborted) {
			reject(new Error(`runtime error: ${failedAlerts().slice(-1)[0] || `not reported`}`));
			return;
		}
		if (settings.finishWhen && settings.finishWhen(printed)) {
			// A parked script is done when the line it was asked for appears; a moment's grace
			// lets the statement after it have its chance to print.
			setTimeout(() => resolve({ program, out: takePrinted() }), 40);
			return;
		}
		if (!AllSpeak.scripts[program.script]) {
			resolve({ program, out: takePrinted() });
			return;
		}
		if (Date.now() > deadline) {
			reject(new Error(`timed out; printed: ${printed.join(` | `)}`));
			return;
		}
		setTimeout(poll, 2);
	};
	setTimeout(poll, 0);
});

const symbolRecord = (program, name) => program[program.symbols[name].pc];
const commands = (program, keyword) => program.filter(c => c && c.keyword === keyword);

// ---------------------------------------------------------------------------------------------
// 1. The vocabulary compiles into the shapes the spec describes
// ---------------------------------------------------------------------------------------------

section(`The vocabulary`);
try {
	const program = compileProgram(`
variable Width
variable Height
variable Size
variable Type
variable Url
file Input
photo image Original
photo image Large
photo resize Original to 1600 into Large
photo thumbnail Original into Thumb
photo encode Original as jpeg quality 85 into Clean
photo encode Original into Copy
photo save Large to \`route-42-front-grille.jpg\`
photo release Original
photo clear Input
put the pixel width of Original into Width
put the pixel height of Original into Height
put the byte size of Original into Size
put the mime type of Original into Type
put the blob url of Original into Url
`);
	check(commands(program, `resize`)[0].target === `Large`, `'resize … into Q' names its target`);
	check(symbolRecord(program, `Large`).keyword === `photo image`,
		`a declared 'photo image' is a symbol of its own kind`);
	check(commands(program, `thumbnail`).length === 1, `'thumbnail' compiles to its own command`);
	check(commands(program, `encode`)[0].format === `jpeg`
		&& commands(program, `encode`)[0].quality.content === 85,
		`'as jpeg quality 85' carries both`);
	check(commands(program, `encode`)[1].format === null,
		`and 'encode … into' without 'as' keeps the source type`);
	check(commands(program, `save`).length === 1 && commands(program, `release`).length === 1,
		`'save' and 'release' compile`);
	check(commands(program, `clear`)[0].input === `Input`, `'clear' names its file input`);
	const types = program
		.filter(command => command && command.value && command.value.domain === `photo`)
		.map(command => command.value.type);
	for (const type of [`pixelWidth`, `pixelHeight`, `byteSize`, `mimeType`, `blobUrl`]) {
		check(types.includes(type), `'the ${type} of …' compiles to a photo value (${type})`);
	}
} catch (err) {
	check(false, `the command catalogue compiles — ${err.message}`);
}

// A declaration-on-first-use is the spec's convenience: a script does not declare the handles it
// only ever receives.
try {
	const program = compileProgram(`
photo image Original
photo resize Original to 1600 into Large
photo thumbnail Original into Thumb
`);
	check(commands(program, `resize`)[0].target === `Large`
		&& symbolRecord(program, `Large`).keyword === `photo image`,
		`a transform declares its 'into' target on first use`);
	check(commands(program, `thumbnail`)[0].target === `Thumb`
		&& symbolRecord(program, `Thumb`).keyword === `photo image`,
		`each target independently`);
} catch (err) {
	check(false, `a transform declares its target — ${err.message}`);
}

// `photo copy` meets `idb` at the `idb blob` handle, and the two declarations have to be told apart.
try {
	const program = compileProgram(`
photo image Photo
idb blob Bytes
photo copy Photo into Bytes
`);
	check(commands(program, `copy`)[0].target === `Bytes`, `'copy' names the blob handle`);
	check(symbolRecord(program, `Bytes`).keyword === `idb blob`, `which stays an 'idb blob'`);
} catch (err) {
	check(false, `the copy bridge compiles — ${err.message}`);
}

// The condition, which arrives after the core parser has tried the handle as a value.
try {
	const program = compileProgram(`
photo image Photo
if Photo is loaded print \`a\`
if Photo is not loaded print \`b\`
`);
	const conditions = program
		.filter(command => command && command.condition && command.condition.domain === `photo`)
		.map(command => command.condition);
	check(conditions.length === 2, `'P is loaded' and 'P is not loaded' compile`);
	check(conditions[0].sense === true && conditions[1].sense === false,
		`and carry their sense (${conditions.map(c => c.sense).join(`,`)})`);
} catch (err) {
	check(false, `'P is loaded' compiles — ${err.message}`);
}

// Failure is a first-class clause on everything that reads or transforms.
try {
	const program = compileProgram(`
file Input
photo image Photo
photo image Large
photo image Original from file Input or gosub NoPhoto
photo image Original from url \`x.jpg\` on failure print the error
photo resize Original to 1600 into Large on failure print the error
photo thumbnail Original into Large
Done:
exit
NoPhoto:
exit
`);
	check(typeof commands(program, `fromFile`)[0].onError === `number`,
		`'or' on 'photo image … from file' compiles to a failure clause`);
	check(commands(program, `fromUrl`)[0].onError > 0, `'on failure' on a URL load compiles`);
	check(commands(program, `resize`)[0].onError > 0, `and on a transform`);
	check(commands(program, `thumbnail`)[0].onError === null,
		`while a command with no clause carries none`);
} catch (err) {
	check(false, `failure clauses compile — ${err.message}`);
}

// The request's own worked example, compiled as written. It is the sentence a reader meets first,
// so a vocabulary that rejects it is wrong however well the parts compile in isolation.
try {
	compileProgram(`
file PhotoInput
image Preview
photo image Original
photo image Large
photo image Thumb
idb blob Bytes
idb database DB
idb schema Sherpa version 1
idb store \`photos\` in Sherpa without key
variable PhotoKey
variable ThumbUrl
set attribute \`accept\` of PhotoInput to \`image/*\`
set attribute \`capture\` of PhotoInput to \`environment\`
on change PhotoInput gosub PhotoChosen
PhotoChosen:
photo image Original from file PhotoInput or gosub NoPhoto
photo resize Original to 1600 into Large
photo encode Large as jpeg quality 75 into Clean
photo thumbnail Original into Thumb
photo release Original
put \`front-grille\` into PhotoKey
photo copy Clean into Bytes
idb put Bytes into \`photos\` of DB with key PhotoKey
    on failure print \`Could not store the photo: \` cat the error
put the blob url of Thumb into ThumbUrl
set attribute \`src\` of Preview to ThumbUrl
photo clear PhotoInput
stop
NoPhoto:
print \`No photo chosen.\`
`);
	check(true, `the request's worked example compiles as written`);
} catch (err) {
	check(false, `the request's worked example compiles — ${err.message}`);
}

// ---------------------------------------------------------------------------------------------
// 2. The core, against a canvas that behaves
// ---------------------------------------------------------------------------------------------

(async () => {
	section(`The core (@napi-rs/canvas)`);

	// A photograph is measured from its decode, and its type and size from its bytes.
	try {
		const blob = await solid(4000, 3000);
		const loaded = await AllSpeak_Photo_Core.load(blob, { platform });
		check(loaded.width === 4000 && loaded.height === 3000,
			`a 4000×3000 JPEG measures 4000×3000 (${loaded.width}×${loaded.height})`);
		check(loaded.blob.type === `image/jpeg`, `and keeps its MIME type`);
		check(blob.size > 0 && loaded.blob.size === blob.size, `and its bytes (${blob.size})`);
	} catch (err) {
		check(false, `a JPEG is measured — ${err.message}`);
	}

	// A resize shrinks the longest edge and preserves the ratio.
	try {
		const blob = await solid(4000, 3000);
		const resized = await AllSpeak_Photo_Core.resize({
			blob, type: blob.type, width: 4000, height: 3000, longest: 1600, platform
		});
		check(resized.width === 1600 && resized.height === 1200,
			`4000×3000 resized to 1600 is 1600×1200 (${resized.width}×${resized.height})`);
		check(resized.blob.size < blob.size, `and the bytes are smaller (${resized.blob.size} < ${blob.size})`);
		const portrait = await AllSpeak_Photo_Core.resize({
			blob, type: blob.type, width: 3000, height: 4000, longest: 1600, platform
		});
		check(portrait.width === 1200 && portrait.height === 1600,
			`a portrait shrinks by the same rule (${portrait.width}×${portrait.height})`);
	} catch (err) {
		check(false, `a resize — ${err.message}`);
	}

	// The no-upscale rule, and the metadata that rides on it.
	try {
		const fixture = await gpsBlob(1200, 900);
		const loaded = await AllSpeak_Photo_Core.load(fixture.blob, { platform });
		const resized = await AllSpeak_Photo_Core.resize({
			blob: loaded.blob, type: loaded.blob.type, width: loaded.width, height: loaded.height,
			longest: 1600, platform
		});
		check(resized.blob === loaded.blob,
			`an image already at 1200×900 is returned as the same bytes`);
		check(resized.width === 1200 && resized.height === 900, `with its dimensions unchanged`);
		check(hasGps(await bytesOf(resized.blob)),
			`and its EXIF/GPS kept — the bytes were not touched`);
	} catch (err) {
		check(false, `a no-op resize — ${err.message}`);
	}

	// The same rule through a real resize: bytes rewritten, metadata gone.
	try {
		const fixture = await gpsBlob(4000, 3000);
		check(hasGps(fixture.blob.size ? Buffer.from(await bytesOf(fixture.blob)) : []),
			`fixture premise: the source carries a GPS marker`);
		const loaded = await AllSpeak_Photo_Core.load(fixture.blob, { platform });
		const resized = await AllSpeak_Photo_Core.resize({
			blob: loaded.blob, type: loaded.blob.type, width: loaded.width, height: loaded.height,
			longest: 1600, platform
		});
		check(!hasGps(await bytesOf(resized.blob)),
			`a resize that actually shrinks the image removes EXIF/GPS`);
		const encoded = await AllSpeak_Photo_Core.encode({
			blob: loaded.blob, type: loaded.blob.type, format: `jpeg`, quality: 75, platform
		});
		check(!hasGps(await bytesOf(encoded.blob)), `and 'encode' always does, even at the same size`);
	} catch (err) {
		check(false, `metadata is stripped when bytes are rewritten — ${err.message}`);
	}

	// JPEG has no alpha channel: a transparent source must land on white, not black.
	try {
		const clear = createCanvas(100, 100);
		const png = await encodeCanvas(clear, `image/png`, 100);
		const jpeg = await AllSpeak_Photo_Core.encode({
			blob: png, type: png.type, format: `jpeg`, quality: 85, platform
		});
		const image = await loadImage(await bytesOf(jpeg.blob));
		const probe = createCanvas(1, 1);
		const context = probe.getContext(`2d`);
		context.drawImage(image, 0, 0, 1, 1);
		const pixel = context.getImageData(0, 0, 1, 1).data;
		check(pixel[0] > 240 && pixel[1] > 240 && pixel[2] > 240,
			`a transparent PNG encoded to JPEG is painted white (${pixel[0]},${pixel[1]},${pixel[2]})`);
		const kept = await AllSpeak_Photo_Core.encode({
			blob: png, type: png.type, format: `png`, platform
		});
		const alphaImage = await loadImage(await bytesOf(kept.blob));
		context.clearRect(0, 0, 1, 1);
		context.drawImage(alphaImage, 0, 0, 1, 1);
		const alphaPixel = context.getImageData(0, 0, 1, 1).data;
		check(alphaPixel[3] === 0,
			`and a PNG keeps its alpha (alpha ${alphaPixel[3]})`);
	} catch (err) {
		check(false, `transparency and the JPEG background — ${err.message}`);
	}

	// Failures carry the DOMException's name and the operation that met it.
	try {
		let refusal = null;
		try {
			await AllSpeak_Photo_Core.load(new Blob([Buffer.from(`not an image`)], { type: `image/jpeg` }),
				{ platform });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `EncodingError`,
			`truncated bytes are refused with EncodingError (${refusal && refusal.name})`);
		check(refusal && /^photo decode failed: EncodingError: /.test(refusal.message),
			`and 'the error' begins with the operation and the name (${refusal && refusal.message})`);
	} catch (err) {
		check(false, `an undecodable file — ${err.message}`);
	}

	try {
		let refusal = null;
		const platform404 = makePlatform({ fetch: async () => ({ ok: false, status: 404 }) });
		try {
			await AllSpeak_Photo_Core.fromUrl(`https://example.com/missing.jpg`, { platform: platform404 });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `NetworkError` && /404/.test(refusal.message),
			`a 404 fails with NetworkError and the status (${refusal && refusal.message})`);
	} catch (err) {
		check(false, `a 404 URL — ${err.message}`);
	}

	try {
		let refusal = null;
		const platformCors = makePlatform({
			fetch: async () => {
				throw new TypeError(`Failed to fetch`);
			}
		});
		try {
			await AllSpeak_Photo_Core.fromUrl(`https://example.com/other-origin.jpg`,
				{ platform: platformCors });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `NetworkError` && /CORS/.test(refusal.message),
			`a no-CORS refusal is a NetworkError whose sentence says CORS (${refusal && refusal.message})`);
	} catch (err) {
		check(false, `a no-CORS URL — ${err.message}`);
	}

	// A canvas is a source, and a tainted one is a refusal rather than a broken handle.
	try {
		const canvas = createCanvas(64, 48);
		canvas.getContext(`2d`).fillRect(0, 0, 64, 48);
		const loaded = await AllSpeak_Photo_Core.fromCanvas(canvas, { platform });
		check(loaded.blob.type === `image/png` && loaded.width === 64 && loaded.height === 48,
			`a canvas source round-trips as a 64×48 PNG`);
		const tainted = {
			getContext: () => ({}),
			toBlob: () => {
				const err = new Error(`tainted canvases may not be read`);
				err.name = `SecurityError`;
				throw err;
			}
		};
		let refusal = null;
		try {
			await AllSpeak_Photo_Core.fromCanvas(tainted, { platform });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `SecurityError`,
			`a tainted canvas fails with SecurityError (${refusal && refusal.name})`);
	} catch (err) {
		check(false, `a canvas source — ${err.message}`);
	}

	// A browser asked for a format it cannot write answers with a different one rather than
	// failing; the plugin must not pass that off as the format the script asked for.
	try {
		const blob = await solid(40, 30);
		const png = await encodeCanvas(createCanvas(10, 10), `image/png`, 100);
		const lyingCanvas = {
			getContext: () => ({
				fillStyle: ``,
				fillRect: () => {},
				drawImage: () => {}
			}),
			toBlob: callback => callback(png)
		};
		const lyingPlatform = makePlatform({
			createCanvas: () => lyingCanvas
		});
		let refusal = null;
		try {
			await AllSpeak_Photo_Core.encode({
				blob, type: blob.type, format: `webp`, platform: lyingPlatform
			});
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `NotSupportedError` && /image\/png/.test(refusal.message),
			`a browser that cannot write the format fails with NotSupportedError (${refusal && refusal.name})`);
	} catch (err) {
		check(false, `an unsupported output format — ${err.message}`);
	}

	// The download uses the name it was given, and frees its own URL rather than the display one.
	try {
		const blob = await solid(40, 30);
		const before = anchors.length;
		AllSpeak_Photo_Core.save({ blob, name: `route-42-front-grille.jpg`, platform });
		check(anchors.length === before + 1 && anchors[anchors.length - 1].download
			=== `route-42-front-grille.jpg`,
			`'save' clicks an anchor whose download is the given name`);
		check(anchors[anchors.length - 1].clicked === 1, `once`);
		const saved = anchors[anchors.length - 1].href;
		check(urls.created.includes(saved), `with a fresh object URL (${saved})`);
		await tick();
		check(urls.revoked.includes(saved), `which is revoked after the click`);
	} catch (err) {
		check(false, `'save' — ${err.message}`);
	}

	// ---- 3. The vocabulary through the runtime ------------------------------------------------

	section(`The vocabulary through the runtime`);

	// The plugin's platform, so the vocabulary's own commands reach the same decoder.
	AllSpeak_Photo.platform = platform;

	// Capture, measure, transform, store and display — the worked example's spine, less `idb`.
	try {
		const fixture = await gpsBlob(4000, 3000);
		const program = compileProgram(`
variable Width
variable Height
variable Size
variable Type
variable Url
file PhotoInput
image Preview
photo image Original
photo image Large
photo image Thumb
photo image Clean
idb blob Blob
photo image Original from file PhotoInput
put the pixel width of Original into Width
put the pixel height of Original into Height
put the byte size of Original into Size
put the mime type of Original into Type
put the blob url of Original into Url
photo resize Original to 1600 into Large
photo thumbnail Original into Thumb
photo encode Original as jpeg quality 75 into Clean
photo copy Large into Blob
photo image Shown from blob Blob
print \`original \` cat Width cat \`x\` cat Height
print \`large \` cat the pixel width of Large cat \`x\` cat the pixel height of Large
print \`thumb \` cat the pixel width of Thumb cat \`x\` cat the pixel height of Thumb
print \`shown \` cat the pixel width of Shown cat \`x\` cat the pixel height of Shown
print \`type \` cat Type
print \`size \` cat Size
print \`url \` cat Url
print \`clean \` cat the mime type of Clean
if Original is loaded print \`loaded\`
if Original is not loaded print \`empty\`
exit
`);
		const input = symbolRecord(program, `PhotoInput`);
		input.element[0] = { files: [fixture.blob], value: `C:\\fakepath\\front.jpg` };
		// `exit` empties the program, so the records are held before the run rather than looked up
		// after it.
		const originalRecord = symbolRecord(program, `Original`);
		const largeRecord = symbolRecord(program, `Large`);
		const cleanRecord = symbolRecord(program, `Clean`);
		const blobRecord = symbolRecord(program, `Blob`);
		const result = await drive(program);
		check(result.out.includes(`original 4000x3000`),
			`'from file' measures the chosen file (${result.out.join(` | `)})`);
		check(result.out.includes(`large 1600x1200`), `'resize' writes the longest edge`);
		check(result.out.includes(`thumb 320x240`), `'thumbnail' is 320 on the longest edge`);
		check(result.out.includes(`shown 1600x1200`), `'from blob' round-trips the copy`);
		check(result.out.includes(`type image/jpeg`), `'the mime type of' reads the bytes`);
		check(result.out.includes(`size ${fixture.blob.size}`), `'the byte size of' counts them`);
		check(result.out.some(line => /^url blob:/.test(line)), `'the blob url of' makes one URL`);
		check(result.out.includes(`clean image/jpeg`), `'encode as jpeg' is JPEG`);
		check(result.out.includes(`loaded`), `'P is loaded' is true once filled`);
		check(!result.out.includes(`empty`), `and 'P is not loaded' is false`);
		check(cleanRecord.blob && blobRecord.blob === largeRecord.blob,
			`'copy' puts the same blob into the 'idb blob' handle`);
		check(originalRecord.url && urls.created.includes(originalRecord.url),
			`the display URL is cached on the handle (${originalRecord.url})`);
	} catch (err) {
		check(false, `the worked spine runs — ${err.message}`);
	}

	// A no-op resize through the script keeps the bytes and the metadata.
	try {
		const fixture = await gpsBlob(1200, 900);
		const program = compileProgram(`
file PhotoInput
photo image Original
photo image Same
photo image Original from file PhotoInput
photo resize Original to 1600 into Same
print \`same \` cat the pixel width of Same cat \`x\` cat the pixel height of Same
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [fixture.blob], value: `x` };
		const originalRecord = symbolRecord(program, `Original`);
		const sameRecord = symbolRecord(program, `Same`);
		const result = await drive(program);
		check(result.out.includes(`same 1200x900`), `a no-op resize reports the source size`);
		check(sameRecord.blob === originalRecord.blob,
			`and gives the target the same bytes`);
		check(hasGps(await bytesOf(sameRecord.blob)),
			`so the GPS marker survives it`);
	} catch (err) {
		check(false, `a no-op resize through the script — ${err.message}`);
	}

	// A cancelled picker is an ordinary failure, in both clause forms.
	try {
		const program = compileProgram(`
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput or gosub NoPhoto
print \`SHOULD NOT PRINT\`
NoPhoto:
print \`no photo\`
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [], value: `` };
		const photoRecord = symbolRecord(program, `Photo`);
		const result = await drive(program, { finishWhen: out => out.includes(`no photo`) });
		check(result.out.includes(`no photo`), `an empty input reaches its 'or' clause`);
		check(!result.out.includes(`SHOULD NOT PRINT`), `which ends the thread`);
		check(photoRecord.blob === null, `and leaves the handle unfilled`);
	} catch (err) {
		check(false, `an empty input with 'or' — ${err.message}`);
	}

	try {
		const program = compileProgram(`
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput on failure print \`caught \` cat the error
print \`carried on\`
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [], value: `` };
		const result = await drive(program);
		check(result.out.some(line => line.includes(`caught`) && line.includes(`NotFoundError`)),
			`'on failure' prints the DOMException's name (${result.out.join(` | `)})`);
		check(result.out.includes(`carried on`), `and carries on with the next statement`);
	} catch (err) {
		check(false, `an empty input with 'on failure' — ${err.message}`);
	}

	// The three RangeError and TypeError paths the spec names.
	try {
		const fixture = await solid(400, 300);
		const program = compileProgram(`
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput
photo resize Photo to 0 into Photo on failure print \`range \` cat the error
photo encode Photo as jpeg quality 101 into Photo on failure print \`quality \` cat the error
photo release Photo
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [fixture], value: `x` };
		const result = await drive(program);
		check(result.out.some(line => line.includes(`range`) && line.includes(`RangeError`)),
			`a longest edge below 1 fails with RangeError`);
		check(result.out.some(line => line.includes(`quality`) && line.includes(`RangeError`)),
			`a quality outside 0–100 fails with RangeError`);
	} catch (err) {
		check(false, `the range checks — ${err.message}`);
	}

	try {
		// A file whose type is empty — some files arrive that way — cannot be re-encoded without
		// being told what to encode it as.
		const bytes = Buffer.from(await (await solid(200, 100)).arrayBuffer());
		const untyped = new Blob([bytes], { type: `` });
		const program = compileProgram(`
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput
photo encode Photo into Photo on failure print \`type \` cat the error
photo encode Photo as png into Photo
print \`png \` cat the mime type of Photo
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [untyped], value: `x` };
		const result = await drive(program);
		check(result.out.some(line => line.includes(`type`) && line.includes(`TypeError`)),
			`an untyped image without 'as' fails with TypeError`);
		check(result.out.includes(`png image/png`), `and naming the format fixes it`);
	} catch (err) {
		check(false, `an untyped image — ${err.message}`);
	}

	// A URL load through the script, over an injected fetch.
	try {
		const fixture = await solid(320, 240);
		const bytes = await bytesOf(fixture);
		AllSpeak_Photo.platform = makePlatform({
			fetch: async () => ({
				ok: true,
				status: 200,
				blob: async () => new Blob([bytes], { type: `image/jpeg` })
			})
		});
		const program = compileProgram(`
variable Url
photo image Photo
put \`https://example.com/route.jpg\` into Url
photo image Photo from url Url
print \`url \` cat the pixel width of Photo cat \`x\` cat the pixel height of Photo
exit
`);
		const result = await drive(program);
		check(result.out.includes(`url 320x240`), `'from url' decodes what the fetch returned`);
	} catch (err) {
		check(false, `a URL load — ${err.message}`);
	} finally {
		AllSpeak_Photo.platform = platform;
	}

	// `photo release` revokes the display URL, and doing it twice is a no-op.
	try {
		const fixture = await solid(600, 400);
		const program = compileProgram(`
variable Url
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput
put the blob url of Photo into Url
photo release Photo
photo release Photo
if Photo is loaded print \`SHOULD NOT PRINT\`
print \`released\`
exit
`);
		symbolRecord(program, `PhotoInput`).element[0] = { files: [fixture], value: `x` };
		const before = urls.created.length;
		const record = symbolRecord(program, `Photo`);
		const result = await drive(program);
		const displayUrl = urls.created[before];
		check(result.out.includes(`released`), `'release' leaves an unloaded handle`);
		check(!result.out.includes(`SHOULD NOT PRINT`), `'P is loaded' is false after it`);
		check(record.blob === null && record.width === 0 && record.height === 0,
			`and the bytes and dimensions are dropped`);
		check(record.url === null, `the URL is no longer held on the handle`);
		check(urls.revoked.includes(displayUrl),
			`and it was revoked rather than leaked (${displayUrl})`);
	} catch (err) {
		check(false, `'release' — ${err.message}`);
	}

	// `photo save` from the script, and `photo clear` resetting the input.
	try {
		const fixture = await solid(100, 80);
		const program = compileProgram(`
variable Url
file PhotoInput
photo image Photo
photo image Photo from file PhotoInput
photo save Photo to \`front.jpg\`
put the blob url of Photo into Url
photo clear PhotoInput
print \`done\`
exit
`);
		const input = symbolRecord(program, `PhotoInput`);
		input.element[0] = { files: [fixture], value: `C:\\fakepath\\front.jpg` };
		const record = symbolRecord(program, `Photo`);
		const result = await drive(program);
		check(result.out.includes(`done`), `'save' and 'clear' run`);
		const saved = anchors[anchors.length - 1];
		check(saved.download === `front.jpg`, `the download is named as the script said`);
		check(input.element[0].value === ``, `'clear' empties the file input`);
		check(record.url !== saved.href, `the download's URL is not the display URL`);
		await tick();
		check(urls.revoked.includes(saved.href), `the download's URL is revoked after the click`);
		check(!urls.revoked.includes(record.url),
			`and the display URL the page is showing is not`);
	} catch (err) {
		check(false, `'save' and 'clear' — ${err.message}`);
	}

	// An empty handle is a script bug for `save` and a refusal for a value read.
	try {
		const program = compileProgram(`
variable K
photo image Photo
print \`before\`
put the pixel width of Photo into K
print \`SHOULD NOT PRINT\`
exit
`);
		let refusal = null;
		try {
			AllSpeak_Photo.value.get(program, { type: `pixelWidth`, name: `Photo` });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `InvalidStateError`,
			`a value read from an empty handle fails with InvalidStateError`);
	} catch (err) {
		check(false, `a value read from an empty handle — ${err.message}`);
	}

	try {
		const program = compileProgram(`
photo image Photo
photo save Photo to \`nothing.jpg\`
`);
		AllSpeak.scripts[program.script] = program;
		program.running = true;
		failedAlerts();
		program.run(0);
		await tick();
		const said = failedAlerts().join(` `);
		check(/InvalidStateError/.test(said), `'save' on an empty handle stops the thread with InvalidStateError`);
	} catch (err) {
		check(false, `'save' on an empty handle — ${err.message}`);
	}

	// A bare handle is not a value, and the refusal says what to do instead.
	try {
		const program = compileProgram(`
variable Whole
photo image Photo
put Photo into Whole
`);
		let refusal = null;
		try {
			AllSpeak_Photo.value.get(program, { type: `handle`, name: `Photo` });
		} catch (err) {
			refusal = err;
		}
		check(refusal && refusal.name === `InvalidAccessError` && /blob url/.test(refusal.message),
			`reading a photo as a value is refused, and names 'the blob url of'`);
	} catch (err) {
		check(false, `a bare handle as a value — ${err.message}`);
	}

	say(`\n${checks} checks, ${checks - failures} passed, ${failures} failed`);
	process.exit(failures ? 1 : 0);
})().catch(err => {
	console.error(`\nphoto-check: ${err && err.stack ? err.stack : err}`);
	process.exit(1);
});
