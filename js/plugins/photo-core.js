// The photo core — promises over the browser's image pipeline, and nothing about AllSpeak in it.
//
// **Why it is a file of its own.** The vocabulary half can be wrong about a sentence while the
// pipeline is right about a photograph, and the other way round; split, each half can be asked its
// own questions. A page loads this file first and `photo.js` after it, exactly as `idb-core.js` is
// loaded before `idb.js`.
//
// **A handle holds encoded bytes, never a decoded bitmap.** Every transform decodes, draws and
// re-encodes, and the bitmap is closed on the way out: a decoded 4000×3000 photograph is 48 MB
// held for as long as it lives, and a script that keeps three sizes would keep three of them.
// The cost is that a transform decodes twice over its life — once when the handle was filled, to
// learn its size, and once when it is transformed. The alternative is a cache with a lifetime no
// script can see, and that is the trade this file makes.
//
// **The platform is an argument.** `createImageBitmap`, a canvas, `URL`, `fetch` and `document`
// are looked up in one place and may be supplied by the caller, so `tools/photo-check.js` can run
// this half in Node over a native canvas, where a real 4000×3000 decode is cheap.
//
// **Metadata is lost only when bytes are rewritten.** A resize that need not happen returns the
// blob it was handed — the identical object — so EXIF and GPS survive it. Every path through a
// canvas re-encodes, and a canvas carries pixels and nothing else, which is what makes `encode`
// the command that strips a photograph of where it was taken.

const AllSpeak_Photo_Core = (() => {

	// The one shape a failure leaves in. A script reads `the error` and prints it, so the sentence
	// names the operation and then the DOMException's own name — a bare `EncodingError` does not
	// say which step met it.
	const failure = (operation, err) => {
		if (err && err.photoFailure) {
			return err;
		}
		const name = (err && err.name) || `Error`;
		const detail = (err && err.message) || String(err);
		return {
			photoFailure: true,
			name,
			message: `photo ${operation} failed: ${name}: ${detail}`
		};
	};

	const named = (name, message) => {
		const err = new Error(message);
		err.name = name;
		return err;
	};

	// ---- the platform ----------------------------------------------------------------------------
	//
	// Everything outside a Blob is reached through this object. `createImageBitmap` is the decoder
	// and the resizer in one — it takes the orientation and the target size — and an environment
	// without it falls back to an <img>, which is the browser's other decoder. `createCanvas` is
	// the escape hatch a Node adapter uses; a browser reaches `OffscreenCanvas` or the document.

	const browserPlatform = () => ({
		createImageBitmap: typeof createImageBitmap === `function`
			? createImageBitmap.bind(globalThis)
			: null,
		Image: typeof Image === `function` ? Image : null,
		createCanvas: null,
		OffscreenCanvas: typeof OffscreenCanvas === `function` ? OffscreenCanvas : null,
		document: typeof document !== `undefined` ? document : null,
		URL: typeof URL !== `undefined` ? URL : null,
		fetch: typeof fetch === `function` ? fetch.bind(globalThis) : null
	});

	const platformFor = (options) => (options && options.platform) || browserPlatform();

	const objectUrl = (blob, options) => {
		const api = platformFor(options).URL;
		if (!api || typeof api.createObjectURL !== `function`) {
			throw failure(`blob url`, named(`NotSupportedError`,
				`this environment cannot make an object URL for a blob`));
		}
		return api.createObjectURL(blob);
	};

	const revokeUrl = (url, options) => {
		if (!url) {
			return;
		}
		const api = platformFor(options).URL;
		if (!api || typeof api.revokeObjectURL !== `function`) {
			return;
		}
		try {
			api.revokeObjectURL(url);
		} catch (ignored) {
			// A URL this page did not make, or one already revoked: nothing to do either way.
		}
	};

	// ---- types ----------------------------------------------------------------------------------

	const CANONICAL_TYPES = {
		jpeg: `image/jpeg`,
		png: `image/png`,
		webp: `image/webp`
	};

	// `image/jpg` is what some cameras and most Windows software write; it is not a registered
	// type but it is what arrives, and refusing it would refuse a photograph that draws perfectly.
	const normaliseType = (type) => {
		if (!type || typeof type !== `string`) {
			return null;
		}
		const bare = type.split(`;`)[0].trim().toLowerCase();
		if (bare === `image/jpg`) {
			return `image/jpeg`;
		}
		return bare;
	};

	const typeFor = (format) => CANONICAL_TYPES[format] || null;

	// ---- sizing ---------------------------------------------------------------------------------

	// The longest edge is what a photo is bounded by, so the shorter one follows it. Both are
	// rounded and neither may reach 0: a 4000×2 panorama resized to 100 is 100×1, not 100×0.
	const targetSize = (width, height, longest) => {
		const edge = Math.max(width, height);
		if (!(edge > 0)) {
			return { width: 1, height: 1 };
		}
		const scale = longest / edge;
		return {
			width: Math.max(1, Math.round(width * scale)),
			height: Math.max(1, Math.round(height * scale))
		};
	};

	const qualityOf = (value, fallback) => {
		if (value === undefined || value === null || value === ``) {
			return fallback;
		}
		const number = Number(value);
		if (!(number >= 0 && number <= 100)) {
			throw named(`RangeError`, `quality must be between 0 and 100 (it was ${value})`);
		}
		return number;
	};

	const longestOf = (value) => {
		const number = Number(value);
		if (!(number >= 1)) {
			throw named(`RangeError`, `the longest edge must be 1 pixel or more (it was ${value})`);
		}
		return Math.round(number);
	};

	// ---- decoding -------------------------------------------------------------------------------

	// A decoder's refusal, in the spec's own name for it. The browser's sentence is kept because
	// it is the only thing that distinguishes a truncated file from one that is not an image.
	const undecodable = (err) => failure(`decode`, named(`EncodingError`,
		(err && err.message) || `the source image could not be decoded`));

	const closeBitmap = (bitmap) => {
		if (bitmap && typeof bitmap.close === `function`) {
			try {
				bitmap.close();
			} catch (ignored) {
				// Already closed, or an image object that never held a decode.
			}
		}
	};

	const decodeWithImage = (blob, platform) => new Promise((resolve, reject) => {
		const api = platform.URL;
		const ImageConstructor = platform.Image;
		if (!api || typeof api.createObjectURL !== `function` || !ImageConstructor) {
			reject(named(`NotSupportedError`, `this environment cannot decode an image`));
			return;
		}
		let url;
		try {
			url = api.createObjectURL(blob);
		} catch (err) {
			reject(err);
			return;
		}
		const image = new ImageConstructor();
		// `onload` and `decode()` can both answer, and a browser is free to fire either first — so
		// the first answer is the one that settles, and the URL is revoked once.
		let settled = false;
		const finish = (err) => {
			if (settled) {
				return;
			}
			settled = true;
			revokeUrl(url, { platform });
			if (err) {
				reject(err);
			} else {
				resolve({
					width: image.naturalWidth || image.width,
					height: image.naturalHeight || image.height,
					source: image,
					close: null
				});
			}
		};
		image.onload = () => finish(null);
		image.onerror = () => finish(new Error(`the image could not be decoded`));
		image.src = url;
		// `decode()` rejects for the same reasons `onerror` fires, and it is what lets a canvas draw
		// the image as soon as this promise answers rather than one task later.
		if (typeof image.decode === `function`) {
			image.decode().then(() => finish(null), () => finish(new Error(`the image could not be decoded`)));
		}
	});

	// `options.size` asks the decoder for a specific size. `createImageBitmap` is preferred because
	// it can do it *while decoding* — a 4000×3000 photograph resized to 1600 never becomes a
	// 48 MB bitmap — and because `imageOrientation: 'from-image'` is what makes the recorded size
	// the one a viewer sees rather than the one the sensor wrote.
	const decode = async (blob, options) => {
		const settings = options || {};
		const platform = platformFor(settings);
		const size = settings.size || null;
		if (typeof platform.createImageBitmap === `function`) {
			const spec = { imageOrientation: `from-image` };
			if (size) {
				spec.resizeWidth = size.width;
				spec.resizeHeight = size.height;
				spec.resizeQuality = `high`;
			}
			try {
				return await platform.createImageBitmap(blob, spec);
			} catch (err) {
				throw undecodable(err);
			}
		}
		try {
			return await decodeWithImage(blob, platform);
		} catch (err) {
			throw undecodable(err);
		}
	};

	// The bitmap an <img> decode hands back is an `Image`, which the 2d context draws directly;
	// `createImageBitmap` hands back an `ImageBitmap`. Both are drawable, so nothing here needs to
	// know which it has.
	const drawableOf = (bitmap) => bitmap.source || bitmap;

	// A handle's size is measured once, when it is filled. Nothing is kept from the decode beyond
	// the two numbers, which is the point: the bitmap goes out of scope as soon as it is measured.
	const measure = async (blob, options) => {
		const bitmap = await decode(blob, options);
		try {
			return {
				blob,
				width: Math.round(bitmap.width),
				height: Math.round(bitmap.height)
			};
		} finally {
			closeBitmap(bitmap);
		}
	};

	const load = (blob, options) => {
		if (!blob) {
			return Promise.reject(failure(`load`, named(`InvalidStateError`, `there is no image`)));
		}
		return measure(blob, options);
	};

	const fromUrl = async (url, options) => {
		const platform = platformFor(options);
		if (typeof platform.fetch !== `function`) {
			throw failure(`fetch`, named(`NotSupportedError`,
				`this environment cannot fetch a URL`));
		}
		let response;
		try {
			response = await platform.fetch(url);
		} catch (err) {
			// A cross-origin refusal arrives as a TypeError with no detail at all, and the sentence
			// a script prints has to name the likely cause — otherwise the reader is told only that
			// something failed.
			throw failure(`fetch`, named(`NetworkError`,
				`${(err && err.message) || String(err)} — if this is a cross-origin URL,`
				+ ` it needs CORS headers`));
		}
		if (!response || !response.ok) {
			const status = response && typeof response.status === `number` ? response.status : 0;
			throw failure(`fetch`, named(`NetworkError`, `the server answered ${status}`));
		}
		let blob;
		try {
			blob = await response.blob();
		} catch (err) {
			throw failure(`fetch`, named(`NetworkError`,
				(err && err.message) || `the response body could not be read`));
		}
		return measure(blob, options);
	};

	// ---- canvases -------------------------------------------------------------------------------

	const makeCanvas = (width, height, platform) => {
		if (typeof platform.createCanvas === `function`) {
			return platform.createCanvas(width, height);
		}
		if (platform.OffscreenCanvas) {
			return new platform.OffscreenCanvas(width, height);
		}
		const doc = platform.document;
		if (doc && typeof doc.createElement === `function`) {
			const canvas = doc.createElement(`canvas`);
			canvas.width = width;
			canvas.height = height;
			return canvas;
		}
		throw named(`NotSupportedError`, `this environment has no canvas to draw into`);
	};

	const contextOf = (canvas) => {
		const context = canvas.getContext(`2d`);
		if (!context) {
			throw named(`NotSupportedError`, `the canvas has no 2d drawing context`);
		}
		return context;
	};

	// **A photograph drawn over transparency and encoded as JPEG is black unless the canvas is
	// painted first.** JPEG has no alpha channel, so the encoder composites onto black, and a
	// transparent logo comes out as a black rectangle. White is what a person means by "the
	// background", and PNG and WebP keep their transparency untouched.
	const draw = (canvas, bitmap, width, height, type) => {
		const context = contextOf(canvas);
		if (type === `image/jpeg`) {
			context.fillStyle = `#ffffff`;
			context.fillRect(0, 0, width, height);
		}
		context.drawImage(drawableOf(bitmap), 0, 0, width, height);
	};

	// Four spellings of the same operation, because the platform may be a page, an offscreen
	// canvas, or a native canvas in a test. `toBlob` is the standard one and the last two are
	// Node canvas libraries.
	const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
		if (typeof canvas.toBlob === `function`) {
			canvas.toBlob(blob => resolve(blob), type, quality / 100);
			return;
		}
		if (typeof canvas.convertToBlob === `function`) {
			canvas.convertToBlob({ type, quality: quality / 100 }).then(resolve, reject);
			return;
		}
		if (typeof canvas.encode === `function`) {
			canvas.encode(type.slice(`image/`.length), Math.round(quality))
				.then(bytes => resolve(new Blob([bytes], { type })), reject);
			return;
		}
		if (typeof canvas.toBuffer === `function`) {
			try {
				const bytes = canvas.toBuffer(type, Math.round(quality));
				resolve(new Blob([bytes], { type }));
			} catch (err) {
				reject(err);
			}
			return;
		}
		reject(named(`NotSupportedError`, `this canvas cannot encode an image`));
	});

	// A canvas the page did not create crosses the security boundary the moment a cross-origin
	// image is drawn into it, and the browser refuses to read it back. The refusal is preserved
	// under its own name because it is the one failure a script can act on — fetch the image with
	// CORS, or draw it somewhere the page may read.
	const rethrowEncoder = (err, operation) => {
		if (err && (err.name === `SecurityError` || /taint/i.test(err.message || ``))) {
			return failure(operation, named(`SecurityError`,
				`the browser refused to read the canvas — it may be tainted by a cross-origin image`));
		}
		return failure(operation, err);
	};

	const encodeCanvas = async (canvas, type, quality, operation) => {
		if (!type) {
			throw failure(operation, named(`TypeError`,
				`there is no MIME type to encode to — name one with 'as <format>'`));
		}
		if (!Object.values(CANONICAL_TYPES).includes(type)) {
			throw failure(operation, named(`NotSupportedError`,
				`this plugin encodes JPEG, PNG and WebP, not '${type}'`));
		}
		let blob;
		try {
			blob = await canvasToBlob(canvas, type, quality);
		} catch (err) {
			throw rethrowEncoder(err, operation);
		}
		if (!blob) {
			// A tainted canvas answers with no blob rather than throwing, on some browsers.
			throw failure(operation, named(`SecurityError`,
				`the browser produced no image — the canvas may be tainted by a cross-origin image`));
		}
		if (normaliseType(blob.type) !== type) {
			// A browser asked for WebP it cannot write answers PNG silently. Reporting the bytes it
			// did produce is the difference between a script that stores a PNG named .webp and one
			// that stops and says the browser cannot do it.
			throw failure(operation, named(`NotSupportedError`,
				`the browser produced '${blob.type || `an untyped blob`}' instead of '${type}'`));
		}
		return blob;
	};

	// ---- transforms -----------------------------------------------------------------------------

	// **A resize that need not happen does not happen.** The longest edge is compared with the
	// target before anything is decoded, and the answer is the blob that came in — the same bytes,
	// the same metadata, the same quality. Upscaling is refused for the same reason: it adds bytes
	// and no detail, and a phone should not do it because a script asked for a bigger number.
	const resize = async (options) => {
		const settings = options || {};
		let longest;
		try {
			longest = longestOf(settings.longest);
		} catch (err) {
			throw failure(`resize`, err);
		}
		const width = Math.round(settings.width);
		const height = Math.round(settings.height);
		if (!(width > 0) || !(height > 0)) {
			throw failure(`resize`, named(`InvalidStateError`, `there is no image to resize`));
		}
		if (Math.max(width, height) <= longest) {
			return { blob: settings.blob, width, height };
		}
		let quality;
		try {
			quality = qualityOf(settings.quality, 75);
		} catch (err) {
			throw failure(`resize`, err);
		}
		const type = normaliseType(settings.type);
		if (!type) {
			throw failure(`resize`, named(`TypeError`,
				`the image has no MIME type to keep — say what it should be with`
				+ ` 'photo encode … as <format>'`));
		}
		const size = targetSize(width, height, longest);
		const platform = platformFor(settings);
		const bitmap = await decode(settings.blob, { platform, size });
		try {
			let canvas;
			try {
				canvas = makeCanvas(size.width, size.height, platform);
				draw(canvas, bitmap, size.width, size.height, type);
			} catch (err) {
				throw failure(`resize`, err);
			}
			const blob = await encodeCanvas(canvas, type, quality, `resize`);
			return { blob, width: size.width, height: size.height };
		} finally {
			closeBitmap(bitmap);
		}
	};

	// 320 and 70 are part of the vocabulary rather than settings: a script wanting other numbers
	// says `resize` and `encode`, and the two spell out what the thumbnail hides.
	const thumbnail = (options) => resize(Object.assign({}, options, {
		longest: 320,
		quality: 70
	}));

	// **`encode` always rewrites.** That is the whole of its purpose: it is the command a script
	// calls when the bytes must not carry EXIF or GPS, and a no-op would be precisely the case that
	// leaves location data in a photograph that looks as though it had been processed.
	const encode = async (options) => {
		const settings = options || {};
		const format = settings.format ? typeFor(settings.format) : normaliseType(settings.type);
		if (!format) {
			throw failure(`encode`, named(`TypeError`,
				`the image has no MIME type — say what it should be with 'as jpeg', 'as png'`
				+ ` or 'as webp'`));
		}
		let quality;
		try {
			quality = qualityOf(settings.quality, 75);
		} catch (err) {
			throw failure(`encode`, err);
		}
		const platform = platformFor(settings);
		const bitmap = await decode(settings.blob, { platform });
		try {
			const width = Math.round(bitmap.width);
			const height = Math.round(bitmap.height);
			if (!(width > 0) || !(height > 0)) {
				throw failure(`encode`, named(`InvalidStateError`, `there is no image to encode`));
			}
			let canvas;
			try {
				canvas = makeCanvas(width, height, platform);
				draw(canvas, bitmap, width, height, format);
			} catch (err) {
				throw failure(`encode`, err);
			}
			const blob = await encodeCanvas(canvas, format, quality, `encode`);
			return { blob, width, height };
		} finally {
			closeBitmap(bitmap);
		}
	};

	const fromCanvas = async (canvas, options) => {
		let blob;
		try {
			blob = await canvasToBlob(canvas, `image/png`, 100);
		} catch (err) {
			throw rethrowEncoder(err, `canvas`);
		}
		if (!blob) {
			throw failure(`canvas`, named(`SecurityError`,
				`the browser produced no image — the canvas may be tainted by a cross-origin image`));
		}
		return measure(blob, options);
	};

	// ---- showing and saving ---------------------------------------------------------------------

	// **The download is its own object URL, and it is revoked in the next task.** The URL the page
	// shows an <img> with has to survive the download; a second URL for the anchor costs nothing and
	// is freed once the click has read it. Synchronous on purpose: a browser only honours a download
	// started from the gesture that asked for it, and a promise would put a task between the two.
	const save = (options) => {
		const settings = options || {};
		const platform = platformFor(settings);
		const doc = platform.document;
		const api = platform.URL;
		if (!doc || typeof doc.createElement !== `function`
			|| !api || typeof api.createObjectURL !== `function`) {
			throw failure(`save`, named(`NotSupportedError`,
				`saving needs a browser page`));
		}
		const url = api.createObjectURL(settings.blob);
		const anchor = doc.createElement(`a`);
		anchor.href = url;
		anchor.download = settings.name || `image`;
		if (anchor.style) {
			anchor.style.display = `none`;
		}
		const parent = doc.body || doc.documentElement || null;
		if (parent && typeof parent.appendChild === `function`) {
			parent.appendChild(anchor);
		}
		try {
			anchor.click();
		} finally {
			if (parent && typeof parent.removeChild === `function`) {
				parent.removeChild(anchor);
			}
			setTimeout(() => revokeUrl(url, { platform }), 0);
		}
	};

	return {
		failure,
		named,
		objectUrl,
		revokeUrl,
		load,
		fromUrl,
		fromCanvas,
		resize,
		thumbnail,
		encode,
		save
	};
})();

// A starter pack loads this as a plain script beside the runtime, where `module` does not exist;
// under Node it is what lets `tools/photo-check.js` require the half it can test.
if (typeof module !== `undefined` && module.exports) {
	module.exports = AllSpeak_Photo_Core;
}
