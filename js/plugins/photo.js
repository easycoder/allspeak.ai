// The `photo` plugin — photographs in AllSpeak's words.
//
// **A page loads two files: `photo-core.js` first and this one after it.** The core is a promise API
// over the browser's image pipeline and knows nothing about the language; this file is the
// vocabulary and knows nothing about canvases. `tools/photo-check.js` is what holds the two halves
// to the vocabulary, and the reasons for each choice are beside the code below.
//
// **A photo is a declared handle, never a hidden current one.** `photo image Original`, `photo image
// Large` and `photo image Thumb` are three things a script can hold at once, and every command names
// the one it acts on. A transform writes a handle named by `into`, so the original survives the
// making of a display copy — and the copy may be the original itself when only one is wanted.
//
// **Every command that reads a file, a URL or a decoder is fail-capable.** The clause is the
// runtime's own — `or` and `on failure` compile exactly as they do for `rest` — because a cancelled
// picker and a photograph that will not decode are ordinary events, not crashes.
//
// **Metadata is lost only when bytes are rewritten.** A resize that need not happen hands the bytes
// straight on, EXIF and GPS included; `photo encode` always rewrites, and that is the command a
// script calls before storing or saving when it must not leak where a photograph was taken.

const AllSpeak_Photo = {

	name: `AllSpeak_Photo`,

	// A test may hand the vocabulary a platform of its own, because a terminal has no
	// `createImageBitmap`; a page never sets it and the core falls back to the browser's own.
	platform: null,

	// The only token this domain claims is `photo`. Everything else in a script belongs to some
	// other domain, and a handler that answered more would be asked about every token there is.
	getHandler: (token) => {
		return AllSpeak_Language.reverseWord(token) === `photo` ? AllSpeak_Photo.Photo : null;
	},

	// ---- compile -------------------------------------------------------------------------------
	//
	// `Photo` is what `getHandler('photo')` answers. The action word after `photo` is read here and
	// dispatched to a compile function below; each of those is entered with the index on the action
	// and leaves it past the statement's last token.

	Photo: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = AllSpeak_Language.reverseWord(compiler.nextToken());
			switch (action) {
			case `image`:
				return photoCompileImage(compiler, lino);
			case `resize`:
				return photoCompileResize(compiler, lino);
			case `thumbnail`:
				return photoCompileThumbnail(compiler, lino);
			case `encode`:
				return photoCompileEncode(compiler, lino);
			case `save`:
				return photoCompileSave(compiler, lino);
			case `release`:
				return photoCompileRelease(compiler, lino);
			case `copy`:
				return photoCompileCopy(compiler, lino);
			case `clear`:
				return photoCompileClear(compiler, lino);
			}
			compiler.warning(`Unknown photo command '${action}'`);
			return false;
		}
	},

	// ---- run -----------------------------------------------------------------------------------
	//
	// Every asynchronous command answers 0, which parks the thread: the core's promise resumes it
	// from the callback. `photoAsync` is the one place that knows how — how a result reaches its
	// target, how a failure reaches the clause, and how a program that has gone away is left alone.

	run: (program) => {
		const command = program[program.pc];
		if (command.isSymbol) {
			// A handle declaration: it exists in the program, and there is nothing to do.
			return command.pc + 1;
		}
		switch (command.keyword) {
		case `fromFile`:
			return photoRunFromFile(program, command);
		case `fromUrl`:
			return photoRunFromUrl(program, command);
		case `fromBlob`:
			return photoRunFromBlob(program, command);
		case `fromCanvas`:
			return photoRunFromCanvas(program, command);
		case `resize`:
			return photoRunResize(program, command);
		case `thumbnail`:
			return photoRunThumbnail(program, command);
		case `encode`:
			return photoRunEncode(program, command);
		case `save`:
			return photoRunSave(program, command);
		case `release`:
			return photoRunRelease(program, command);
		case `copy`:
			return photoRunCopy(program, command);
		case `clear`:
			return photoRunClear(program, command);
		}
		program.runtimeError(command.lino, `Unknown command '${command.keyword}' in the 'photo' plugin`);
		return 0;
	},

	// ---- values --------------------------------------------------------------------------------
	//
	// Entered at the value's first token — possibly `the`. A bare photo handle is a value too, so
	// that `put Photo into X` has something to receive: it is not a value that can be stored, and
	// saying so here is the difference between a compile error and a mystery.

	value: {

		compile: (compiler) => {
			const mark = compiler.getIndex();
			if (compiler.isSymbol()) {
				const record = compiler.getSymbolRecord();
				if (record.keyword === `photo image`) {
					compiler.next();
					return {
						domain: `photo`,
						type: `handle`,
						name: record.name
					};
				}
				return null;
			}
			if (!compiler.isWord(`the`)) {
				return null;
			}
			compiler.next();
			let type;
			switch (AllSpeak_Language.reverseWord(compiler.getToken())) {
			case `pixel`: {
				// `pixel` is the qualifier that keeps these clear of `the width of <element>`, which
				// is the browser domain's layout measurement. The reading is chosen by the word
				// after it: `the pixel width of P`, `the pixel height of P`.
				const which = AllSpeak_Language.reverseWord(compiler.peek());
				if (which !== `width` && which !== `height`) {
					compiler.rewindTo(mark);
					return null;
				}
				compiler.next();
				compiler.next();
				type = which === `width` ? `pixelWidth` : `pixelHeight`;
				break;
			}
			case `byte`:
				if (!compiler.nextIsWord(`size`)) {
					compiler.rewindTo(mark);
					return null;
				}
				compiler.next();
				type = `byteSize`;
				break;
			case `mime`:
				if (!compiler.nextIsWord(`type`)) {
					compiler.rewindTo(mark);
					return null;
				}
				compiler.next();
				type = `mimeType`;
				break;
			case `blob`:
				if (!compiler.nextIsWord(`url`)) {
					compiler.rewindTo(mark);
					return null;
				}
				compiler.next();
				type = `blobUrl`;
				break;
			default:
				compiler.rewindTo(mark);
				return null;
			}
			if (!photoTake(compiler, `of`)) {
				compiler.rewindTo(mark);
				return null;
			}
			if (!compiler.isSymbol()) {
				compiler.rewindTo(mark);
				return null;
			}
			const record = compiler.getSymbolRecord();
			if (record.keyword !== `photo image`) {
				compiler.rewindTo(mark);
				return null;
			}
			compiler.next();
			return {
				domain: `photo`,
				type,
				name: record.name
			};
		},

		get: (program, value) => {
			const record = program.getSymbolRecord(value.name);
			switch (value.type) {
			case `handle`:
				// A photo is bytes and two numbers. It has no value of its own to give — the blob
				// url is how it reaches an element — and pretending otherwise would put its size
				// in a variable and lose the photograph.
				throw AllSpeak_Photo_Core.failure(`read`, AllSpeak_Photo_Core.named(
					`InvalidAccessError`,
					`'${value.name}' is a photo, not a value. Use it with a 'photo' command,`
					+ ` or read 'the blob url of ${value.name}' to show it.`));
			case `pixelWidth`:
				photoRequireImage(record, `pixel width`);
				return {
					type: `constant`,
					numeric: true,
					content: record.width
				};
			case `pixelHeight`:
				photoRequireImage(record, `pixel height`);
				return {
					type: `constant`,
					numeric: true,
					content: record.height
				};
			case `byteSize`:
				photoRequireImage(record, `byte size`);
				return {
					type: `constant`,
					numeric: true,
					content: record.blob.size
				};
			case `mimeType`:
				photoRequireImage(record, `mime type`);
				return {
					type: `constant`,
					numeric: false,
					content: record.blob.type || ``
				};
			case `blobUrl`:
				photoRequireImage(record, `blob url`);
				if (!record.url) {
					record.url = AllSpeak_Photo_Core.objectUrl(record.blob, {
						platform: AllSpeak_Photo.platform
					});
				}
				return {
					type: `constant`,
					numeric: false,
					content: record.url
				};
			}
			return null;
		}
	},

	// ---- conditions ----------------------------------------------------------------------------
	//
	// `Photo is loaded` reaches here only after the core condition parser has tried `Photo` as a
	// value and given up on it — which is why the handle type is what this claims, and nothing else.

	condition: {

		compile: (compiler) => {
			const mark = compiler.getIndex();
			if (!compiler.isSymbol()) {
				return null;
			}
			const record = compiler.getSymbolRecord();
			if (record.keyword !== `photo image`) {
				return null;
			}
			compiler.next();
			if (!compiler.isWord(`is`)) {
				compiler.rewindTo(mark);
				return null;
			}
			compiler.next();
			let sense = true;
			if (compiler.isWord(`not`)) {
				sense = false;
				compiler.next();
			}
			if (AllSpeak_Language.reverseWord(compiler.getToken()) !== `loaded`) {
				compiler.rewindTo(mark);
				return null;
			}
			compiler.next();
			return {
				domain: `photo`,
				type: `loaded`,
				name: record.name,
				sense
			};
		},

		test: (program, condition) => {
			const record = program.getSymbolRecord(condition.name);
			const loaded = !!record && !!record.blob;
			return condition.sense ? loaded : !loaded;
		}
	}
};

// ---------------------------------------------------------------------------------------------
// Compile helpers
// ---------------------------------------------------------------------------------------------

// The words below are ordinary language words, so they are asked through the language layer:
// `isWord('into')` answers for French `dans` and English `into` alike.
function photoTake(compiler, word) {
	if (!compiler.isWord(word)) {
		return false;
	}
	compiler.next();
	return true;
}

function photoExpect(compiler, word, why) {
	if (!photoTake(compiler, word)) {
		throw new Error(`Expected '${word}'${why ? ` ${why}` : ``}`);
	}
}

// A handle's fields exist from the moment it is declared, so a command that writes one can look at
// it without asking whether it has been used yet.
function photoInit(record) {
	record.blob = null;
	record.width = 0;
	record.height = 0;
	record.url = null;
}

function photoHandle(compiler, what) {
	if (!compiler.isSymbol()) {
		throw new Error(`Expected ${what}`);
	}
	const record = compiler.getSymbolRecord();
	if (record.keyword !== `photo image`) {
		throw new Error(`'${record.name}' is not a photo — declare it with`
			+ ` 'photo image ${record.name}'`);
	}
	compiler.next();
	return record;
}

// The `into` target of a transform. Declared on first use, so a script does not have to declare the
// handles it only ever receives; an existing symbol is reused, which is what lets a transform
// replace its own source.
function photoTarget(compiler) {
	if (compiler.isSymbol()) {
		return photoHandle(compiler, `the photo to write into`);
	}
	// `compileVariable` advances before it reads the name, so the index is put back one token —
	// onto whatever preceded the name — and the name is the token it lands on.
	compiler.prev();
	const record = compiler.compileVariable(`photo`, `photo image`);
	photoInit(record);
	return record;
}

function photoSymbolOfType(compiler, keyword, what) {
	if (!compiler.isSymbol()) {
		throw new Error(`Expected ${what}`);
	}
	const record = compiler.getSymbolRecord();
	if (record.keyword !== keyword) {
		throw new Error(`'${record.name}' is not ${what}`);
	}
	compiler.next();
	return record;
}

// A command that performs I/O. `or clause` and `on failure clause` are compiled exactly as the
// runtime compiles them for `rest`: the command carries the clause's pc, and `photoAsync` runs it.
function photoFailable(compiler, command) {
	const pc = compiler.getPc();
	command.onError = null;
	compiler.addCommand(command);
	if (compiler.consumeFailureClause()) {
		compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
		compiler.completeHandler();
	}
	return true;
}

function photoPlain(compiler, command) {
	compiler.addCommand(command);
	return true;
}

// ---------------------------------------------------------------------------------------------
// Compile — the commands
// ---------------------------------------------------------------------------------------------

// `compileVariable` reads the name from the token the index lands on, and `isSymbol` reads the
// token at the index — so both need a token there at all.
function photoHasToken(compiler, offset) {
	return compiler.getIndex() + offset < compiler.getTokens().length;
}

function photoCompileImage(compiler, lino) {
	// `photo image P` declares; `photo image P from <source>` also fills it. The source word is read
	// through the language layer, so the four forms read as English reads.
	let record;
	if (!photoHasToken(compiler, 1)) {
		throw new Error(`Expected a photo name after 'photo image'`);
	}
	if (compiler.nextIsSymbol()) {
		const existing = compiler.getSymbolRecord();
		if (existing.keyword !== `photo image`) {
			throw new Error(`'${existing.name}' is not a photo — declare it with`
				+ ` 'photo image ${existing.name}'`);
		}
		compiler.next();
		record = existing;
	} else {
		compiler.prev();
		record = compiler.compileVariable(`photo`, `photo image`);
		photoInit(record);
	}
	if (!photoTake(compiler, `from`)) {
		return true;
	}
	const source = AllSpeak_Language.reverseWord(compiler.getToken());
	switch (source) {
	case `file`: {
		compiler.next();
		if (!compiler.isSymbol()) {
			throw new Error(`Expected a file input after 'from file'`);
		}
		const input = compiler.getSymbolRecord();
		if (input.keyword !== `file` && input.keyword !== `input`) {
			throw new Error(`'${input.name}' is not a file input`);
		}
		compiler.next();
		return photoFailable(compiler, {
			domain: `photo`,
			keyword: `fromFile`,
			lino,
			target: record.name,
			input: input.name
		});
	}
	case `url`: {
		compiler.next();
		const url = compiler.getValue();
		return photoFailable(compiler, {
			domain: `photo`,
			keyword: `fromUrl`,
			lino,
			target: record.name,
			url
		});
	}
	case `blob`: {
		compiler.next();
		const blob = photoSymbolOfType(compiler, `idb blob`, `an 'idb blob' handle`);
		return photoFailable(compiler, {
			domain: `photo`,
			keyword: `fromBlob`,
			lino,
			target: record.name,
			source: blob.name
		});
	}
	case `canvas`: {
		compiler.next();
		const canvas = photoSymbolOfType(compiler, `canvas`, `a canvas`);
		return photoFailable(compiler, {
			domain: `photo`,
			keyword: `fromCanvas`,
			lino,
			target: record.name,
			source: canvas.name
		});
	}
	}
	throw new Error(`Expected 'file', 'url', 'blob' or 'canvas' after 'photo image … from'`);
}

function photoCompileResize(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to resize`);
	photoExpect(compiler, `to`, `before the longest edge`);
	const longest = compiler.getValue();
	photoExpect(compiler, `into`, `before the photo to write the result into`);
	const target = photoTarget(compiler);
	return photoFailable(compiler, {
		domain: `photo`,
		keyword: `resize`,
		lino,
		source: source.name,
		longest,
		target: target.name
	});
}

function photoCompileThumbnail(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to make a thumbnail of`);
	photoExpect(compiler, `into`, `before the photo to write the thumbnail into`);
	const target = photoTarget(compiler);
	return photoFailable(compiler, {
		domain: `photo`,
		keyword: `thumbnail`,
		lino,
		source: source.name,
		target: target.name
	});
}

function photoCompileEncode(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to encode`);
	let format = null;
	if (photoTake(compiler, `as`)) {
		const word = AllSpeak_Language.reverseWord(compiler.getToken());
		if (![`jpeg`, `png`, `webp`].includes(word)) {
			throw new Error(`Expected 'jpeg', 'png' or 'webp' after 'as'`);
		}
		compiler.next();
		format = word;
	}
	let quality = null;
	if (photoTake(compiler, `quality`)) {
		quality = compiler.getValue();
	}
	photoExpect(compiler, `into`, `before the photo to write the result into`);
	const target = photoTarget(compiler);
	return photoFailable(compiler, {
		domain: `photo`,
		keyword: `encode`,
		lino,
		source: source.name,
		format,
		quality,
		target: target.name
	});
}

function photoCompileSave(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to save`);
	photoExpect(compiler, `to`, `before the file name`);
	const name = compiler.getValue();
	return photoPlain(compiler, {
		domain: `photo`,
		keyword: `save`,
		lino,
		source: source.name,
		name
	});
}

function photoCompileRelease(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to release`);
	return photoPlain(compiler, {
		domain: `photo`,
		keyword: `release`,
		lino,
		source: source.name
	});
}

function photoCompileCopy(compiler, lino) {
	compiler.next();
	const source = photoHandle(compiler, `a photo to copy`);
	photoExpect(compiler, `into`, `before the 'idb blob' handle to copy it into`);
	const target = photoSymbolOfType(compiler, `idb blob`, `an 'idb blob' handle`);
	return photoPlain(compiler, {
		domain: `photo`,
		keyword: `copy`,
		lino,
		source: source.name,
		target: target.name
	});
}

function photoCompileClear(compiler, lino) {
	compiler.next();
	if (!compiler.isSymbol()) {
		throw new Error(`Expected a file input after 'photo clear'`);
	}
	const input = compiler.getSymbolRecord();
	if (input.keyword !== `file` && input.keyword !== `input`) {
		throw new Error(`'${input.name}' is not a file input`);
	}
	compiler.next();
	return photoPlain(compiler, {
		domain: `photo`,
		keyword: `clear`,
		lino,
		input: input.name
	});
}

// ---------------------------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------------------------

function photoCorePlatform() {
	return {
		platform: AllSpeak_Photo.platform
	};
}

function photoRequireImage(record, operation) {
	if (!record || !record.blob) {
		throw AllSpeak_Photo_Core.failure(operation, AllSpeak_Photo_Core.named(
			`InvalidStateError`,
			`'${record ? record.name : operation}' holds no image — fill it with`
			+ ` 'photo image … from …' first`));
	}
}

// Revoking the URL is part of replacing the bytes it named. An object URL pins its blob in memory
// until it is revoked, so a handle that is refilled without this leaks every photograph it held.
function photoReleaseUrl(record) {
	if (record.url) {
		AllSpeak_Photo_Core.revokeUrl(record.url, photoCorePlatform());
	}
	record.url = null;
}

// Put a transform's answer into its handle. The dimensions come from the core, which measured them
// from the decoded bitmap — never from a file name or an EXIF field.
function photoAssign(program, command, name, result) {
	const record = program.getSymbolRecord(name);
	if (!record) {
		return;
	}
	photoReleaseUrl(record);
	record.blob = result.blob;
	record.width = result.width;
	record.height = result.height;
	record.used = true;
}

// The one place an asynchronous answer is delivered. `assign` runs against the *live* program —
// looked up by script id, as `rest` does — because the command parked this one and a program that
// has since exited must not be resumed.
function photoAsync(program, command, perform, assign) {
	const scriptId = program.script;
	const pc = program.pc;
	const answer = (ok, payload) => {
		const p = AllSpeak.scripts[scriptId];
		if (!p) {
			return;
		}
		const c = p[pc];
		if (!c) {
			return;
		}
		if (ok) {
			try {
				if (assign) {
					assign(p, c, payload);
				}
			} catch (err) {
				answer(false, err);
				return;
			}
			p.run(c.pc + 1);
			return;
		}
		const message = (payload && (payload.message || String(payload))) || `unknown error`;
		if (c.onError) {
			// The spec's sentence, and no prefix: `the error` begins with the operation and the
			// DOMException's name, which is what a script prints and what a reader searches for.
			p.errorMessage = message;
			p.run(c.onError);
		} else {
			p.runtimeError(c.lino, message);
		}
	};
	try {
		perform(program, command).then(
			result => answer(true, result),
			err => answer(false, err)
		);
	} catch (err) {
		answer(false, err);
	}
	return 0;
}

// A command that can fail without leaving the thread, for the parts that are synchronous — a file
// input with no file, a handle that holds nothing.
function photoFail(program, command, err) {
	const message = (err && (err.message || String(err))) || `unknown error`;
	if (command.onError) {
		program.errorMessage = message;
		program.run(command.onError);
	} else {
		program.runtimeError(command.lino, message);
	}
	return 0;
}

// A script bug rather than a failure clause: `save` and `copy` are not fail-capable, so an empty
// handle stops the thread with the spec's name for it, exactly as reading the content of an element
// that does not exist does.
function photoStops(program, command, operation, message) {
	const err = AllSpeak_Photo_Core.failure(operation, AllSpeak_Photo_Core.named(
		`InvalidStateError`, message));
	program.runtimeError(command.lino, err.message);
	return 0;
}

function photoElementOf(program, name) {
	const record = program.getSymbolRecord(name);
	const element = record && record.element ? record.element[record.index] : null;
	return element || null;
}

// ---------------------------------------------------------------------------------------------
// Runtime — the commands
// ---------------------------------------------------------------------------------------------

function photoRunFromFile(program, command) {
	const element = photoElementOf(program, command.input);
	const files = element && element.files;
	if (!files || !files.length) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`load`,
			AllSpeak_Photo_Core.named(`NotFoundError`,
				`the file input '${command.input}' has no file chosen`)));
	}
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.load(files[0], photoCorePlatform()),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunFromUrl(program, command) {
	return photoAsync(program, command,
		p => AllSpeak_Photo_Core.fromUrl(p.getValue(command.url), photoCorePlatform()),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunFromBlob(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`load`,
			AllSpeak_Photo_Core.named(`InvalidStateError`,
				`the blob handle '${command.source}' holds no blob`)));
	}
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.load(source.blob, photoCorePlatform()),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunFromCanvas(program, command) {
	const element = photoElementOf(program, command.source);
	if (!element) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`canvas`,
			AllSpeak_Photo_Core.named(`InvalidStateError`,
				`'${command.source}' is not attached to a canvas`)));
	}
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.fromCanvas(element, photoCorePlatform()),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunResize(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`resize`,
			AllSpeak_Photo_Core.named(`InvalidStateError`,
				`'${command.source}' holds no image to resize`)));
	}
	const longest = program.getValue(command.longest);
	const settings = {
		blob: source.blob,
		type: source.blob.type,
		width: source.width,
		height: source.height,
		longest,
		quality: 75,
		platform: AllSpeak_Photo.platform
	};
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.resize(settings),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunThumbnail(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`thumbnail`,
			AllSpeak_Photo_Core.named(`InvalidStateError`,
				`'${command.source}' holds no image to make a thumbnail of`)));
	}
	const settings = {
		blob: source.blob,
		type: source.blob.type,
		width: source.width,
		height: source.height,
		platform: AllSpeak_Photo.platform
	};
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.thumbnail(settings),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunEncode(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoFail(program, command, AllSpeak_Photo_Core.failure(`encode`,
			AllSpeak_Photo_Core.named(`InvalidStateError`,
				`'${command.source}' holds no image to encode`)));
	}
	const settings = {
		blob: source.blob,
		type: source.blob.type,
		format: command.format,
		quality: command.quality ? program.getValue(command.quality) : 75,
		platform: AllSpeak_Photo.platform
	};
	return photoAsync(program, command,
		() => AllSpeak_Photo_Core.encode(settings),
		(p, c, result) => photoAssign(p, c, c.target, result));
}

function photoRunSave(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoStops(program, command, `save`,
			`'${command.source}' holds no image to save`);
	}
	try {
		AllSpeak_Photo_Core.save({
			blob: source.blob,
			name: program.getValue(command.name),
			platform: AllSpeak_Photo.platform
		});
	} catch (err) {
		// The core's failure already names the operation and the DOMException, so it is printed as
		// it stands rather than wrapped a second time.
		program.runtimeError(command.lino, (err && (err.message || String(err)))
			|| `the image could not be saved`);
		return 0;
	}
	return command.pc + 1;
}

function photoRunRelease(program, command) {
	const record = program.getSymbolRecord(command.source);
	if (!record) {
		return command.pc + 1;
	}
	photoReleaseUrl(record);
	record.blob = null;
	record.width = 0;
	record.height = 0;
	return command.pc + 1;
}

function photoRunCopy(program, command) {
	const source = program.getSymbolRecord(command.source);
	if (!source || !source.blob) {
		return photoStops(program, command, `copy`,
			`'${command.source}' holds no image to copy`);
	}
	const target = program.getSymbolRecord(command.target);
	if (target) {
		// The target's own URL is revoked rather than left pointing at bytes it no longer holds.
		photoReleaseUrl(target);
		target.blob = source.blob;
		target.url = null;
	}
	return command.pc + 1;
}

function photoRunClear(program, command) {
	const element = photoElementOf(program, command.input);
	if (element) {
		try {
			element.value = ``;
		} catch (ignored) {
			// A file input that refuses the assignment is already empty.
		}
	}
	return command.pc + 1;
}

// ---------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------

AllSpeak.domain.photo = AllSpeak_Photo;
