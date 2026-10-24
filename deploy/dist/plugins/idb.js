// The `idb` plugin — IndexedDB in AllSpeak's words.
//
// **A page loads two files: this one and `idb-core.js` beside it, core first.** The core is the
// database half and knows nothing about the language; this file is the vocabulary half and knows
// nothing about transactions. The vocabulary is the one written for Sherpa's storage layer
// (`allspeak-idb-plugin.md`, in that project's `specs/`); `tools/idb-check.js` is what holds it to
// that document, and the reasons for each choice are beside the code below.
//
// **The commands read as sentences, and each preposition carries a meaning.** `put … into` inserts
// or replaces, `add … to` refuses a duplicate, `with key` supplies an out-of-line key and `giving`
// receives the key that was written. A store name is a string value in backticks — so it can come
// from a variable — while a handle (a database, cursor, batch, blob) is a declared symbol, which is
// what lets the compiler refuse a cursor used where a database belongs.
//
// **A batch exists because a transaction cannot be held across commands.** An IndexedDB
// transaction commits when its request queue empties, and every command here waits for its own
// request, so `begin … commit` around two writes would commit after the first. A batch records
// descriptors in memory and issues them together at `commit`, in one transaction over every store
// it names — which is the atomic unit a script actually wants.
//
// **`where` names the key path or an index, and nothing else.** An unindexed field is refused
// with `NotFoundError` rather than scanned: the scan is the cost a script cannot see, so a store
// that needs one says so by declaring an index.

const AllSpeak_IDB = {

	name: `AllSpeak_IDB`,

	// The only token this domain claims is `idb`. Everything else in a script belongs to some
	// other domain, and a handler that answered more would be asked about every token there is.
	getHandler: (token) => {
		return AllSpeak_Language.reverseWord(token) === `idb` ? AllSpeak_IDB.Idb : null;
	},

	// ---- compile -------------------------------------------------------------------------------
	//
	// `Idb` is what `getHandler('idb')` answers, as `Rest` is what `rest` answers for `rest get`.
	// The action word after `idb` is read here and dispatched to a compile function below; each of
	// those is entered with the index on the action and leaves it past the statement's last token.

	Idb: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = AllSpeak_Language.reverseWord(compiler.nextToken());
			switch (action) {
			case `database`:
				return idbCompileDatabase(compiler);
			case `schema`:
				return idbCompileSchema(compiler);
			case `store`:
				return idbCompileStore(compiler);
			case `index`:
				return idbCompileIndex(compiler, false);
			case `unique`:
				return idbCompileIndex(compiler, true);
			case `drop`:
				return idbCompileDrop(compiler);
			case `open`:
				return idbCompileOpen(compiler, lino);
			case `close`:
				return idbCompileClose(compiler, lino);
			case `delete`:
				return idbCompileDelete(compiler, lino);
			case `put`:
				return idbCompileWrite(compiler, lino, `put`);
			case `add`:
				return idbCompileWrite(compiler, lino, `add`);
			case `get`:
				return idbCompileGet(compiler, lino);
			case `has`:
				return idbCompileKeyed(compiler, lino, `has`);
			case `count`:
				return idbCompileCount(compiler, lino);
			case `clear`:
				return idbCompileClear(compiler, lino);
			case `batch`:
				return idbCompileBatch(compiler);
			case `start`:
				return idbCompileStartBatch(compiler, lino);
			case `commit`:
				return idbCompileBatchAction(compiler, lino, `commit`);
			case `abort`:
				return idbCompileBatchAction(compiler, lino, `abortBatch`);
			case `cursor`:
				return idbCompileCursor(compiler);
			case `scan`:
				return idbCompileScan(compiler, lino);
			case `advance`:
				return idbCompileCursorAction(compiler, lino, `advance`, true);
			case `update`:
				return idbCompileUpdateCurrent(compiler, lino);
			case `blob`:
				return idbCompileBlob(compiler, lino);
			case `release`:
				return idbCompileCursorAction(compiler, lino, `release`, false, `idb blob`);
			case `estimate`:
				return idbCompileStorage(compiler, lino, `estimate`, `storage`);
			case `request`:
				return idbCompileStorage(compiler, lino, `persist`, `persistence`);
			case `check`:
				return idbCompileStorage(compiler, lino, `persisted`, `persistence`);
			}
			compiler.warning(`Unknown idb command '${action}'`);
			return false;
		}
	},

	// ---- run -----------------------------------------------------------------------------------
	//
	// Every asynchronous command answers 0, which parks the thread: the core's promise resumes it
	// from the callback. `idbAsync` is the one place that knows how — how a result reaches its
	// target, how a failure reaches the clause, and how a program that has gone away is left alone.

	run: (program) => {
		const command = program[program.pc];
		if (command.isSymbol) {
			// A handle declaration: it exists in the program, and there is nothing to do.
			return command.pc + 1;
		}
		switch (command.keyword) {
		case `open`:
			return idbRunOpen(program, command);
		case `closeDatabase`:
			return idbRunCloseDatabase(program, command);
		case `deleteDatabase`:
			return idbRunDeleteDatabase(program, command);
		case `put`:
		case `add`:
			return idbRunWrite(program, command);
		case `get`:
			return idbRunGet(program, command);
		case `getFirst`:
			return idbRunGetAll(program, command, 1);
		case `getAll`:
			return idbRunGetAll(program, command);
		case `has`:
			return idbRunHas(program, command);
		case `count`:
			return idbRunCount(program, command);
		case `deleteByKey`:
			return idbRunDeleteByKey(program, command);
		case `deleteWhere`:
			return idbRunDeleteWhere(program, command);
		case `clear`:
			return idbRunClear(program, command);
		case `startBatch`:
			return idbRunStartBatch(program, command);
		case `batchWrite`:
			return idbRunBatchWrite(program, command);
		case `commit`:
			return idbRunCommit(program, command);
		case `abortBatch`:
			return idbRunAbort(program, command);
		case `scan`:
			return idbRunScan(program, command);
		case `advance`:
			return idbRunAdvance(program, command);
		case `closeCursor`:
			return idbRunCloseCursor(program, command);
		case `deleteCurrent`:
			return idbRunDeleteCurrent(program, command);
		case `updateCurrent`:
			return idbRunUpdateCurrent(program, command);
		case `blobFromFile`:
			return idbRunBlobFromFile(program, command);
		case `release`:
			return idbRunRelease(program, command);
		case `estimate`:
			return idbRunEstimate(program, command);
		case `persist`:
			return idbRunPersist(program, command);
		case `persisted`:
			return idbRunPersisted(program, command);
		}
		program.runtimeError(command.lino, `Unknown command '${command.keyword}' in the 'idb' plugin`);
		return 0;
	},

	// ---- values --------------------------------------------------------------------------------

	value: {

		// Entered at the value's first token — possibly `the`. Every form here starts with it, and
		// a bare blob handle is a value too, so that `idb put Photo into …` has something to
		// receive: a blob cannot travel as a normal value, which is why `get` says so plainly.
		compile: (compiler) => {
			const mark = compiler.getIndex();
			if (compiler.isSymbol()) {
				const record = compiler.getSymbolRecord();
				if (record.keyword === `idb blob`) {
					compiler.next();
					return {
						domain: `idb`,
						type: `blob`,
						name: record.name
					};
				}
				return null;
			}
			if (!compiler.isWord(`the`)) {
				return null;
			}
			compiler.next();
			let type = AllSpeak_Language.reverseWord(compiler.getToken());
			switch (type) {
			case `key`:
				compiler.next();
				break;
			case `record`:
				compiler.next();
				break;
			case `primary`:
				if (!compiler.nextIsWord(`key`)) {
					compiler.rewindTo(mark);
					return null;
				}
				compiler.next();
				type = `primaryKey`;
				break;
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
			case `version`:
			case `name`:
				compiler.next();
				break;
			default:
				compiler.rewindTo(mark);
				return null;
			}
			if (!idbTake(compiler, `of`)) {
				compiler.rewindTo(mark);
				return null;
			}
			if (!compiler.isSymbol()) {
				compiler.rewindTo(mark);
				return null;
			}
			const record = compiler.getSymbolRecord();
			const expected = [`key`, `record`, `primaryKey`].includes(type)
				? `idb cursor`
				: ([`byteSize`, `mimeType`, `blobUrl`].includes(type) ? `idb blob` : `idb database`);
			if (record.keyword !== expected) {
				compiler.rewindTo(mark);
				return null;
			}
			compiler.next();
			return {
				domain: `idb`,
				type,
				name: record.name
			};
		},

		get: (program, value) => {
			const record = program.getSymbolRecord(value.name);
			switch (value.type) {
			case `blob`: {
				// A bare blob handle. It has no value of its own to give — `the blob url of`
				// is the way to point an element at it — so this is where the refusal belongs.
				const err = new Error(`'${value.name}' is a blob. Use it with 'idb put', or read`
					+ ` 'the blob url of ${value.name}' to show it.`);
				err.name = `InvalidAccessError`;
				throw err;
			}
			case `version`:
				return {
					type: `constant`,
					numeric: true,
					content: record.version || 0
				};
			case `name`:
				return {
					type: `constant`,
					numeric: false,
					content: record.dbName || ``
				};
			case `key`:
			case `primaryKey`:
				idbRequireCursor(record, value.type);
				return idbValueRecord(value.type === `key` ? record.key : record.primaryKey);
			case `record`:
				idbRequireCursor(record, `record`);
				if (idbIsBlob(record.recordValue)) {
					throw new Error(`the record at '${record.name}' is a blob — read it into an`
						+ ` 'idb blob' handle instead`);
				}
				return idbValueRecord(record.recordValue);
			case `byteSize`:
				idbRequireBlob(record);
				return {
					type: `constant`,
					numeric: true,
					content: record.blob.size
				};
			case `mimeType`:
				idbRequireBlob(record);
				return {
					type: `constant`,
					numeric: false,
					content: record.blob.type || ``
				};
			case `blobUrl`:
				idbRequireBlob(record);
				if (!record.url) {
					if (typeof URL === `undefined` || typeof URL.createObjectURL !== `function`) {
						throw new Error(`this environment cannot make an object URL for a blob`);
					}
					record.url = URL.createObjectURL(record.blob);
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
	// `DB is open` reaches here only after the core condition parser has tried `DB` as a value and
	// given up on it — which is why the handle types are what this claims, and nothing else.

	condition: {

		compile: (compiler) => {
			const mark = compiler.getIndex();
			if (!compiler.isSymbol()) {
				return null;
			}
			const record = compiler.getSymbolRecord();
			if (record.keyword !== `idb database` && record.keyword !== `idb cursor`) {
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
			if (AllSpeak_Language.reverseWord(compiler.getToken()) !== `open`) {
				compiler.rewindTo(mark);
				return null;
			}
			compiler.next();
			return {
				domain: `idb`,
				type: `open`,
				name: record.name,
				sense
			};
		},

		test: (program, condition) => {
			const record = program.getSymbolRecord(condition.name);
			const open = !!record && !!record.isOpen;
			return condition.sense ? open : !open;
		}
	}
};

// ---------------------------------------------------------------------------------------------
// Compile helpers
// ---------------------------------------------------------------------------------------------

// The words below are ordinary language words, so they are asked through the language layer:
// `isWord('into')` answers for French `dans` and English `into` alike.
function idbTake(compiler, word) {
	if (!compiler.isWord(word)) {
		return false;
	}
	compiler.next();
	return true;
}

function idbExpect(compiler, word, why) {
	if (!idbTake(compiler, word)) {
		throw new Error(`Expected '${word}'${why ? ` ${why}` : ``}`);
	}
}

function idbHasToken(compiler, offset) {
	return compiler.getIndex() + offset < compiler.getTokens().length;
}

// A schema is a declaration, so its names are literals. The store names in the read and write
// commands are values and may come from a variable; these cannot, because the schema is applied
// inside the upgrade, where nothing can be evaluated.
function idbName(compiler, what) {
	const token = compiler.getToken();
	if (!token || token.length < 2 || token[0] !== `\`` || token[token.length - 1] !== `\``) {
		throw new Error(`${what} must be a name in backticks, like \`routes\``);
	}
	compiler.next();
	return token.slice(1, -1);
}

function idbSymbol(compiler, keyword, what) {
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

function idbAnySymbol(compiler, keywords, what) {
	if (!compiler.isSymbol()) {
		throw new Error(`Expected ${what}`);
	}
	const record = compiler.getSymbolRecord();
	if (!keywords.includes(record.keyword)) {
		throw new Error(`'${record.name}' is not ${what}`);
	}
	compiler.next();
	return record;
}

function idbVHolder(compiler, why) {
	if (!compiler.isSymbol()) {
		throw new Error(`Expected a variable${why ? ` ${why}` : ``}`);
	}
	const record = compiler.getSymbolRecord();
	if (!record.isVHolder) {
		throw new Error(`'${record.name}' cannot hold a value${why ? ` — ${why}` : ``}`);
	}
	compiler.next();
	return record;
}

// A command that performs I/O. `or clause` and `on failure clause` are compiled exactly as the
// runtime compiles them for `rest`: the command carries the clause's pc, and `idbAsync` runs it.
function idbFailable(compiler, command) {
	const pc = compiler.getPc();
	command.onError = null;
	compiler.addCommand(command);
	if (compiler.consumeFailureClause()) {
		compiler.getCommandAt(pc).onError = compiler.getPc() + 1;
		compiler.completeHandler();
	}
	return true;
}

function idbPlain(compiler, command) {
	compiler.addCommand(command);
	return true;
}

// `where` is compiled into a descriptor, and its bounds are values: they are evaluated when the
// command runs, not when it compiles, so a `Since` that has moved since is the one that is used.
function idbWhere(compiler) {
	if (!idbTake(compiler, `where`)) {
		return null;
	}
	const field = compiler.getValue();
	idbExpect(compiler, `is`, `after the field name in 'where'`);
	if (idbTake(compiler, `between`)) {
		const low = compiler.getValue();
		idbExpect(compiler, `and`, `between the two ends of the range`);
		return { field, form: `between`, low, high: compiler.getValue() };
	}
	if (idbTake(compiler, `above`)) {
		return { field, form: `above`, low: compiler.getValue() };
	}
	if (idbTake(compiler, `below`)) {
		return { field, form: `below`, high: compiler.getValue() };
	}
	if (idbTake(compiler, `at`)) {
		if (idbTake(compiler, `least`)) {
			return { field, form: `atLeast`, low: compiler.getValue() };
		}
		if (idbTake(compiler, `most`)) {
			return { field, form: `atMost`, high: compiler.getValue() };
		}
		throw new Error(`Expected 'least' or 'most' after 'at' in 'where'`);
	}
	return { field, form: `is`, low: compiler.getValue() };
}

// ---------------------------------------------------------------------------------------------
// Compile — declarations and schema (no runtime command at all)
// ---------------------------------------------------------------------------------------------

function idbCompileDatabase(compiler) {
	// The index is on `database`, which is where `compileVariable` expects to find the type word.
	const record = compiler.compileVariable(`idb`, `idb database`);
	record.db = null;
	record.dbName = null;
	record.version = 0;
	record.isOpen = false;
	record.cursors = [];
	return true;
}

function idbCompileSchema(compiler) {
	const record = compiler.compileVariable(`idb`, `idb schema`);
	record.version = 1;
	record.stores = new Map();
	record.dropStores = [];
	record.dropIndexes = [];
	idbExpect(compiler, `version`, `after the schema name, as in 'idb schema S version 1'`);
	const value = compiler.getValue();
	if (!value || value.type !== `constant` || !value.numeric) {
		throw new Error(`A schema version must be a whole number`);
	}
	record.version = value.content;
	return true;
}

function idbCompileStore(compiler) {
	compiler.next();
	const name = idbName(compiler, `A store name`);
	idbExpect(compiler, `in`);
	const schema = idbSymbol(compiler, `idb schema`, `a schema`);
	let keyPath = null;
	let autoIncrement = false;
	if (idbTake(compiler, `with`)) {
		idbExpect(compiler, `key`);
		keyPath = idbName(compiler, `A key path`);
		if (idbTake(compiler, `and`)) {
			idbExpect(compiler, `auto`);
			idbExpect(compiler, `increment`);
			autoIncrement = true;
		}
	} else if (idbTake(compiler, `without`)) {
		idbExpect(compiler, `key`);
	}
	schema.stores.set(name, {
		name,
		keyPath,
		autoIncrement,
		indexes: new Map()
	});
	return true;
}

function idbCompileIndex(compiler, unique) {
	compiler.next();
	if (unique) {
		idbExpect(compiler, `index`);
	}
	const name = idbName(compiler, `An index name`);
	idbExpect(compiler, `on`);
	const storeName = idbName(compiler, `A store name`);
	idbExpect(compiler, `in`);
	const schema = idbSymbol(compiler, `idb schema`, `a schema`);
	let multiEntry = false;
	if (idbTake(compiler, `with`)) {
		idbExpect(compiler, `multiple`);
		idbExpect(compiler, `entries`);
		multiEntry = true;
	}
	const store = schema.stores.get(storeName);
	if (!store) {
		throw new Error(`Schema '${schema.name}' has no store named '${storeName}'`);
	}
	// The index name is its key path. A schema that needs the two to differ can be given the
	// distinction later; the commands stay short until somebody wants it.
	store.indexes.set(name, {
		name,
		keyPath: name,
		unique,
		multiEntry
	});
	return true;
}

function idbCompileDrop(compiler) {
	compiler.next();
	if (idbTake(compiler, `store`)) {
		const name = idbName(compiler, `A store name`);
		idbExpect(compiler, `from`);
		const schema = idbSymbol(compiler, `idb schema`, `a schema`);
		schema.dropStores.push(name);
		return true;
	}
	if (idbTake(compiler, `index`)) {
		const name = idbName(compiler, `An index name`);
		idbExpect(compiler, `from`);
		const storeName = idbName(compiler, `A store name`);
		idbExpect(compiler, `in`);
		const schema = idbSymbol(compiler, `idb schema`, `a schema`);
		schema.dropIndexes.push({ store: storeName, index: name });
		return true;
	}
	throw new Error(`Expected 'store' or 'index' after 'idb drop'`);
}

function idbCompileBatch(compiler) {
	const record = compiler.compileVariable(`idb`, `idb batch`);
	record.db = null;
	record.operations = [];
	return true;
}

function idbCompileCursor(compiler) {
	const record = compiler.compileVariable(`idb`, `idb cursor`);
	record.cursor = null;
	record.db = null;
	record.isOpen = false;
	record.key = undefined;
	record.primaryKey = undefined;
	record.recordValue = undefined;
	return true;
}

// ---------------------------------------------------------------------------------------------
// Compile — the commands
// ---------------------------------------------------------------------------------------------

function idbCompileOpen(compiler, lino) {
	compiler.next();
	const name = compiler.getValue();
	idbExpect(compiler, `as`);
	const target = idbSymbol(compiler, `idb database`, `a database`);
	let schema = null;
	if (idbTake(compiler, `using`)) {
		schema = idbSymbol(compiler, `idb schema`, `a schema`).name;
	}
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `open`,
		lino,
		name,
		target: target.name,
		schema
	});
}

function idbCompileClose(compiler, lino) {
	compiler.next();
	if (!compiler.isSymbol()) {
		throw new Error(`Expected a database or a cursor after 'idb close'`);
	}
	const record = compiler.getSymbolRecord();
	if (record.keyword === `idb database`) {
		compiler.next();
		return idbPlain(compiler, {
			domain: `idb`,
			keyword: `closeDatabase`,
			lino,
			target: record.name
		});
	}
	if (record.keyword === `idb cursor`) {
		compiler.next();
		return idbPlain(compiler, {
			domain: `idb`,
			keyword: `closeCursor`,
			lino,
			target: record.name
		});
	}
	throw new Error(`'${record.name}' is neither a database nor a cursor`);
}

function idbCompileDelete(compiler, lino) {
	compiler.next();
	if (idbTake(compiler, `current`)) {
		const cursor = idbSymbol(compiler, `idb cursor`, `a cursor`);
		return idbFailable(compiler, {
			domain: `idb`,
			keyword: `deleteCurrent`,
			lino,
			target: cursor.name
		});
	}
	if (idbTake(compiler, `database`)) {
		const name = compiler.getValue();
		return idbFailable(compiler, {
			domain: `idb`,
			keyword: `deleteDatabase`,
			lino,
			name
		});
	}
	if (idbTake(compiler, `from`)) {
		return idbCompileDeleteFrom(compiler, lino);
	}
	throw new Error(`Expected 'database', 'from' or 'current' after 'idb delete'`);
}

function idbCompileDeleteFrom(compiler, lino) {
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const holder = idbAnySymbol(compiler, [`idb database`, `idb batch`], `a database or a batch`);
	if (idbTake(compiler, `with`)) {
		idbExpect(compiler, `key`);
		const key = compiler.getValue();
		if (holder.keyword === `idb batch`) {
			return idbPlain(compiler, {
				domain: `idb`,
				keyword: `batchWrite`,
				lino,
				op: `delete`,
				store,
				key,
				value: null,
				target: holder.name
			});
		}
		return idbFailable(compiler, {
			domain: `idb`,
			keyword: `deleteByKey`,
			lino,
			store,
			key,
			target: holder.name
		});
	}
	const where = idbWhere(compiler);
	if (!where) {
		throw new Error(`'idb delete from' needs 'with key <key>' or 'where …'`);
	}
	if (holder.keyword === `idb batch`) {
		return idbPlain(compiler, {
			domain: `idb`,
			keyword: `batchWrite`,
			lino,
			op: `deleteWhere`,
			store,
			where,
			value: null,
			target: holder.name
		});
	}
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `deleteWhere`,
		lino,
		store,
		where,
		target: holder.name
	});
}

function idbCompileWrite(compiler, lino, op) {
	compiler.next();
	const value = compiler.getValue();
	idbExpect(compiler, op === `put` ? `into` : `to`, `after the value`);
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const holder = idbAnySymbol(compiler, [`idb database`, `idb batch`], `a database or a batch`);
	let key = null;
	if (idbTake(compiler, `with`)) {
		idbExpect(compiler, `key`);
		key = compiler.getValue();
	}
	let giving = null;
	if (idbTake(compiler, `giving`)) {
		giving = idbVHolder(compiler, `after 'giving'`).name;
	}
	if (holder.keyword === `idb batch`) {
		if (giving) {
			throw new Error(`A batch cannot give a key — the key is not written until 'idb commit'`
				+ ` writes it. Use 'with key', or a direct 'idb put' if the key is needed now.`);
		}
		return idbPlain(compiler, {
			domain: `idb`,
			keyword: `batchWrite`,
			lino,
			op,
			store,
			key,
			value,
			target: holder.name
		});
	}
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: op,
		lino,
		store,
		key,
		value,
		target: holder.name,
		giving
	});
}

function idbCompileGet(compiler, lino) {
	compiler.next();
	let which = null;
	if (compiler.isWord(`first`)) {
		which = `getFirst`;
		compiler.next();
	} else if (compiler.isWord(`all`)) {
		which = `getAll`;
		compiler.next();
	}
	if (which) {
		idbExpect(compiler, `from`);
		const store = compiler.getValue();
		idbExpect(compiler, `of`);
		const db = idbSymbol(compiler, `idb database`, `a database`);
		const where = idbWhere(compiler);
		idbExpect(compiler, `into`, `before the variable to read the record into`);
		const target = idbVHolder(compiler);
		return idbFailable(compiler, {
			domain: `idb`,
			keyword: which,
			lino,
			store,
			where,
			target: target.name,
			database: db.name
		});
	}
	// `idb get <target> from <store> of <DB> with key <key>` — the target is a variable, or an
	// `idb blob` handle when the stored value is binary.
	if (!compiler.isSymbol()) {
		throw new Error(`Expected a variable, 'first' or 'all' after 'idb get'`);
	}
	const target = compiler.getSymbolRecord();
	if (target.keyword !== `variable` && target.keyword !== `idb blob`) {
		throw new Error(`'${target.name}' cannot hold a record — use a variable or an 'idb blob'`
			+ ` handle`);
	}
	compiler.next();
	idbExpect(compiler, `from`);
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const db = idbSymbol(compiler, `idb database`, `a database`);
	idbExpect(compiler, `with`, `before the key — 'idb get' reads one record by key`);
	idbExpect(compiler, `key`);
	const key = compiler.getValue();
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `get`,
		lino,
		store,
		key,
		target: target.name,
		database: db.name
	});
}

function idbCompileKeyed(compiler, lino, keyword) {
	// `idb has <store> of <DB> with key <key> into <variable>`
	compiler.next();
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const db = idbSymbol(compiler, `idb database`, `a database`);
	idbExpect(compiler, `with`);
	idbExpect(compiler, `key`);
	const key = compiler.getValue();
	idbExpect(compiler, `into`);
	const target = idbVHolder(compiler);
	return idbFailable(compiler, {
		domain: `idb`,
		keyword,
		lino,
		store,
		key,
		target: target.name,
		database: db.name
	});
}

function idbCompileCount(compiler, lino) {
	compiler.next();
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const db = idbSymbol(compiler, `idb database`, `a database`);
	const where = idbWhere(compiler);
	idbExpect(compiler, `into`, `before the variable to read the count into`);
	const target = idbVHolder(compiler);
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `count`,
		lino,
		store,
		where,
		target: target.name,
		database: db.name
	});
}

function idbCompileClear(compiler, lino) {
	compiler.next();
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const holder = idbAnySymbol(compiler, [`idb database`, `idb batch`], `a database or a batch`);
	if (holder.keyword === `idb batch`) {
		return idbPlain(compiler, {
			domain: `idb`,
			keyword: `batchWrite`,
			lino,
			op: `clear`,
			store,
			value: null,
			target: holder.name
		});
	}
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `clear`,
		lino,
		store,
		target: holder.name
	});
}

function idbCompileStartBatch(compiler, lino) {
	compiler.next();
	idbExpect(compiler, `batch`);
	const batch = idbSymbol(compiler, `idb batch`, `a batch`);
	idbExpect(compiler, `on`);
	const db = idbSymbol(compiler, `idb database`, `a database`);
	return idbPlain(compiler, {
		domain: `idb`,
		keyword: `startBatch`,
		lino,
		target: batch.name,
		database: db.name
	});
}

function idbCompileBatchAction(compiler, lino, keyword) {
	compiler.next();
	const batch = idbSymbol(compiler, `idb batch`, `a batch`);
	return idbFailable(compiler, {
		domain: `idb`,
		keyword,
		lino,
		target: batch.name
	});
}

function idbCompileScan(compiler, lino) {
	compiler.next();
	const cursor = idbSymbol(compiler, `idb cursor`, `a cursor`);
	idbExpect(compiler, `in`);
	const store = compiler.getValue();
	idbExpect(compiler, `of`);
	const db = idbSymbol(compiler, `idb database`, `a database`);
	let mode = `readonly`;
	if (idbTake(compiler, `for`)) {
		idbExpect(compiler, `update`, `after 'for' — 'for update' asks for a writable cursor`);
		mode = `readwrite`;
	}
	const where = idbWhere(compiler);
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `scan`,
		lino,
		target: cursor.name,
		store,
		mode,
		where,
		database: db.name
	});
}

function idbCompileCursorAction(compiler, lino, keyword, failable, keywordOf) {
	compiler.next();
	const symbol = keywordOf
		? idbSymbol(compiler, keywordOf, `a blob handle`)
		: idbSymbol(compiler, `idb cursor`, `a cursor`);
	const command = {
		domain: `idb`,
		keyword,
		lino,
		target: symbol.name
	};
	return failable ? idbFailable(compiler, command) : idbPlain(compiler, command);
}

function idbCompileUpdateCurrent(compiler, lino) {
	compiler.next();
	idbExpect(compiler, `current`);
	const cursor = idbSymbol(compiler, `idb cursor`, `a cursor`);
	idbExpect(compiler, `with`, `before the new record`);
	const value = compiler.getValue();
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `updateCurrent`,
		lino,
		target: cursor.name,
		value
	});
}

function idbCompileBlob(compiler, lino) {
	// `idb blob B` declares; `idb blob B from file F` also initialises. The declaration is the
	// convenient half of the spec's rule — a handle declared and given a file in one line.
	let record;
	if (idbHasToken(compiler, 1) && compiler.nextIsSymbol()) {
		record = compiler.getSymbolRecord();
		if (record.keyword !== `idb blob`) {
			throw new Error(`'${record.name}' is not a blob handle`);
		}
		compiler.next();
	} else {
		compiler.prev();
		record = compiler.compileVariable(`idb`, `idb blob`);
		record.blob = null;
		record.url = null;
	}
	if (!idbTake(compiler, `from`)) {
		return true;
	}
	idbExpect(compiler, `file`);
	if (!compiler.isSymbol()) {
		throw new Error(`Expected a file input after 'from file'`);
	}
	const input = compiler.getSymbolRecord();
	if (input.keyword !== `file` && input.keyword !== `input`) {
		throw new Error(`'${input.name}' is not a file input`);
	}
	compiler.next();
	return idbFailable(compiler, {
		domain: `idb`,
		keyword: `blobFromFile`,
		lino,
		target: record.name,
		input: input.name
	});
}

function idbCompileStorage(compiler, lino, keyword, word) {
	compiler.next();
	idbExpect(compiler, word);
	idbExpect(compiler, `into`, `before the variable to read the result into`);
	const target = idbVHolder(compiler);
	return idbFailable(compiler, {
		domain: `idb`,
		keyword,
		lino,
		target: target.name
	});
}

// ---------------------------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------------------------

function idbIsBlob(value) {
	return typeof Blob !== `undefined` && value instanceof Blob;
}

function idbRequireBlob(record) {
	if (!record.blob) {
		const err = new Error(`'${record.name}' holds no blob`);
		err.name = `InvalidStateError`;
		throw err;
	}
}

function idbRequireCursor(record, what) {
	if (!record.isOpen) {
		const err = new Error(`'${record.name}' is not open, so there is no ${what} to read.`
			+ ` Read a cursor's values only while it is open.`);
		err.name = `InvalidStateError`;
		throw err;
	}
}

// A JS value on its way into AllSpeak. Objects and arrays travel as JSON text, because that is what
// a `variable` holds; a number keeps its number-ness, which is what makes `add 1 to Id` work on a
// key that came out of the database.
function idbValueRecord(value) {
	if (value === null || typeof value === `undefined`) {
		return {
			type: `constant`,
			numeric: false,
			content: ``
		};
	}
	if (typeof value === `number`) {
		return {
			type: `constant`,
			numeric: true,
			content: value
		};
	}
	if (typeof value === `boolean`) {
		return {
			type: `boolean`,
			numeric: false,
			content: value
		};
	}
	if (typeof value === `string`) {
		return {
			type: `constant`,
			numeric: false,
			content: value
		};
	}
	if (typeof value === `object` && typeof value.toISOString === `function`) {
		return {
			type: `constant`,
			numeric: false,
			content: value.toISOString()
		};
	}
	try {
		return {
			type: `constant`,
			numeric: false,
			content: JSON.stringify(value)
		};
	} catch (err) {
		return {
			type: `constant`,
			numeric: false,
			content: ``
		};
	}
}

// An AllSpeak value on its way into the database. A JSON-shaped value is stored as its parsed
// structure — which is what `set X to object` and `set X to array` produce — and `empty` is stored
// as `null`, so what comes back out is what went in.
function idbStorable(program, spec) {
	if (!spec) {
		return null;
	}
	if (spec.domain === `idb`) {
		if (spec.type === `blob`) {
			const record = program.getSymbolRecord(spec.name);
			idbRequireBlob(record);
			return record.blob;
		}
		if (spec.type === `record`) {
			const record = program.getSymbolRecord(spec.name);
			idbRequireCursor(record, `record`);
			return record.recordValue;
		}
	}
	const value = program.value.evaluate(program, spec);
	if (!value) {
		return null;
	}
	if (value.type === `boolean`) {
		return value.content;
	}
	if (value.type !== `constant`) {
		return value.content === undefined ? null : value.content;
	}
	if (value.numeric) {
		return typeof value.content === `number` ? value.content : Number(value.content);
	}
	const content = value.content;
	if (content === null || typeof content === `undefined` || content === ``) {
		return null;
	}
	if (typeof content === `string` && (content[0] === `{` || content[0] === `[`)) {
		try {
			return JSON.parse(content);
		} catch (err) {
			// A string that happens to begin with a brace is stored as the string it is.
		}
	}
	return content;
}

function idbResolvedWhere(program, where) {
	if (!where) {
		return null;
	}
	return {
		field: program.getValue(where.field),
		form: where.form,
		low: where.low ? program.getValue(where.low) : undefined,
		high: where.high ? program.getValue(where.high) : undefined
	};
}

function idbDatabaseRecord(program, name) {
	const record = name ? program.getSymbolRecord(name) : null;
	if (!record || record.keyword !== `idb database`) {
		const err = new Error(`'${name}' is not a database`);
		err.name = `InvalidStateError`;
		throw err;
	}
	return record;
}

// Put a value into a command's target. A blob can only live in an `idb blob` handle — a record that
// is binary has no JSON form, and pretending it has one would quietly store `{}` in a variable.
function idbSetTarget(program, command, name, value) {
	const record = program.getSymbolRecord(name);
	if (!record) {
		return;
	}
	if (record.keyword === `idb blob`) {
		if (typeof value === `undefined`) {
			// A blob handle has no `empty` — there is either a blob under that key or there is
			// not — so this is the one read that fails where a variable would be set to `empty`.
			const err = new Error(`no blob is stored under that key, so '${name}' was not filled`);
			err.name = `NotFoundError`;
			throw err;
		}
		if (!idbIsBlob(value)) {
			const err = new Error(`the stored value for '${name}' is not a blob, so it cannot go`
				+ ` into a blob handle`);
			err.name = `InvalidAccessError`;
			throw err;
		}
		record.blob = value;
		record.url = null;
		return;
	}
	if (idbIsBlob(value)) {
		const err = new Error(`the stored value is a blob — read it into an 'idb blob' handle`);
		err.name = `InvalidAccessError`;
		throw err;
	}
	if (!record.isVHolder) {
		program.variableDoesNotHoldAValueError(command.lino, record.name);
		return;
	}
	record.value[record.index] = idbValueRecord(value);
	record.used = true;
}

// The one place an asynchronous answer is delivered. `assign` runs against the *live* program —
// looked up by script id, as `rest` does — because the command parked this one and a program that
// has since exited must not be resumed.
function idbAsync(program, command, perform, assign) {
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
function idbFail(program, command, err) {
	const message = (err && (err.message || String(err))) || `unknown error`;
	if (command.onError) {
		program.errorMessage = message;
		program.run(command.onError);
	} else {
		program.runtimeError(command.lino, message);
	}
	return 0;
}

function idbSchemaSpec(record) {
	const stores = [];
	record.stores.forEach(spec => {
		stores.push({
			name: spec.name,
			keyPath: spec.keyPath,
			autoIncrement: spec.autoIncrement,
			indexes: Array.from(spec.indexes.values())
		});
	});
	return {
		version: record.version,
		stores,
		dropStores: record.dropStores.slice(),
		dropIndexes: record.dropIndexes.slice()
	};
}

function idbCursorState(record) {
	const handle = record.cursor;
	const cursor = handle && handle.cursor;
	record.isOpen = !!cursor;
	if (cursor) {
		record.key = cursor.key;
		record.primaryKey = cursor.primaryKey;
		record.recordValue = cursor.value;
	} else {
		record.key = undefined;
		record.primaryKey = undefined;
		record.recordValue = undefined;
	}
}

// ---------------------------------------------------------------------------------------------
// Runtime — the commands
// ---------------------------------------------------------------------------------------------

function idbRunOpen(program, command) {
	return idbAsync(program, command, (p, c) => {
		const schemaRecord = c.schema ? p.getSymbolRecord(c.schema) : null;
		const schema = schemaRecord ? idbSchemaSpec(schemaRecord) : null;
		return AllSpeak_IDB_Core.open({
			name: p.getValue(c.name),
			version: schema ? schema.version : undefined,
			schema
		});
	}, (p, c, result) => {
		const record = p.getSymbolRecord(c.target);
		// A handle opened twice is a connection the script can no longer name, so the first is
		// let go rather than leaked: it would keep the database open against another tab's upgrade.
		idbReleaseCursors(p, record);
		AllSpeak_IDB_Core.close(record.db);
		record.db = result.db;
		record.dbName = result.name;
		record.version = result.version;
		record.isOpen = true;
		record.cursors = [];
		// The other tab's upgrade is the good reason to let go of this connection. Without this
		// the upgrade waits for the reader to close a tab they have forgotten about, and the
		// blocked timeout is the only thing that ends it.
		result.db.onversionchange = () => {
			AllSpeak_IDB_Core.close(result.db);
			record.db = null;
			record.isOpen = false;
		};
	});
}

// Every cursor open on a connection, ended. A cursor's transaction keeps a lock on its store, and
// a lock is what an upgrade in another tab is waiting for — so closing the database closes them
// first, and re-opening a handle does the same.
function idbReleaseCursors(program, dbRecord) {
	for (const name of dbRecord.cursors || []) {
		const cursor = program.getSymbolRecord(name);
		if (cursor && cursor.cursor) {
			AllSpeak_IDB_Core.closeCursor(cursor.cursor);
			cursor.cursor = null;
			cursor.isOpen = false;
		}
	}
	dbRecord.cursors = [];
}

function idbRunCloseDatabase(program, command) {
	const record = program.getSymbolRecord(command.target);
	idbReleaseCursors(program, record);
	AllSpeak_IDB_Core.close(record.db);
	record.db = null;
	record.isOpen = false;
	return command.pc + 1;
}

function idbRunDeleteDatabase(program, command) {
	return idbAsync(program, command, (p, c) => AllSpeak_IDB_Core.deleteDatabase(p.getValue(c.name)));
}

function idbRunWrite(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.target);
		return AllSpeak_IDB_Core[c.keyword]({
			db: record.db,
			store: p.getValue(c.store),
			value: idbStorable(p, c.value),
			key: c.key ? p.getValue(c.key) : undefined
		});
	}, (p, c, key) => {
		if (c.giving) {
			idbSetTarget(p, c, c.giving, key);
		}
	});
}

function idbRunGet(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.database);
		return AllSpeak_IDB_Core.get({
			db: record.db,
			store: p.getValue(c.store),
			key: p.getValue(c.key)
		});
	}, (p, c, value) => idbSetTarget(p, c, c.target, value));
}

function idbRunGetAll(program, command, limit) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.database);
		return AllSpeak_IDB_Core.getAll({
			db: record.db,
			store: p.getValue(c.store),
			where: idbResolvedWhere(p, c.where),
			limit
		});
	}, (p, c, values) => {
		const rows = values || [];
		const binary = rows.find(idbIsBlob);
		if (binary !== undefined) {
			const err = new Error(`the records include a blob — read one into an 'idb blob' handle`
				+ ` with 'idb get' instead`);
			err.name = `InvalidAccessError`;
			throw err;
		}
		if (limit === 1) {
			idbSetTarget(p, c, c.target, rows.length ? rows[0] : null);
			return;
		}
		idbSetTarget(p, c, c.target, rows);
	});
}

function idbRunHas(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.database);
		return AllSpeak_IDB_Core.has({
			db: record.db,
			store: p.getValue(c.store),
			key: p.getValue(c.key)
		});
	}, (p, c, found) => {
		const record = p.getSymbolRecord(c.target);
		if (!record || !record.isVHolder) {
			p.variableDoesNotHoldAValueError(c.lino, c.target);
			return;
		}
		record.value[record.index] = {
			type: `boolean`,
			numeric: false,
			content: !!found
		};
		record.used = true;
	});
}

function idbRunCount(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.database);
		return AllSpeak_IDB_Core.count({
			db: record.db,
			store: p.getValue(c.store),
			where: idbResolvedWhere(p, c.where)
		});
	}, (p, c, total) => idbSetTarget(p, c, c.target, total));
}

function idbRunDeleteByKey(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.target);
		return AllSpeak_IDB_Core.removeByKey({
			db: record.db,
			store: p.getValue(c.store),
			key: p.getValue(c.key)
		});
	});
}

function idbRunDeleteWhere(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.target);
		return AllSpeak_IDB_Core.removeWhere({
			db: record.db,
			store: p.getValue(c.store),
			where: idbResolvedWhere(p, c.where)
		});
	});
}

function idbRunClear(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = idbDatabaseRecord(p, c.target);
		return AllSpeak_IDB_Core.clear({
			db: record.db,
			store: p.getValue(c.store)
		});
	});
}

function idbRunStartBatch(program, command) {
	const record = program.getSymbolRecord(command.target);
	record.db = command.database;
	record.operations = [];
	return command.pc + 1;
}

function idbRunBatchWrite(program, command) {
	const record = program.getSymbolRecord(command.target);
	const operation = {
		op: command.op,
		store: program.getValue(command.store)
	};
	if (command.op === `put` || command.op === `add`) {
		operation.value = idbStorable(program, command.value);
		operation.key = command.key ? program.getValue(command.key) : undefined;
	} else if (command.op === `delete`) {
		operation.key = program.getValue(command.key);
	} else if (command.op === `deleteWhere`) {
		operation.where = idbResolvedWhere(program, command.where);
	}
	record.operations.push(operation);
	return command.pc + 1;
}

function idbRunCommit(program, command) {
	return idbAsync(program, command, (p, c) => {
		const batch = p.getSymbolRecord(c.target);
		const database = idbDatabaseRecord(p, batch.db);
		return AllSpeak_IDB_Core.runBatch({
			db: database.db,
			operations: batch.operations.slice()
		});
	}, (p, c) => {
		p.getSymbolRecord(c.target).operations = [];
	});
}

function idbRunAbort(program, command) {
	program.getSymbolRecord(command.target).operations = [];
	return command.pc + 1;
}

function idbRunScan(program, command) {
	return idbAsync(program, command, (p, c) => {
		const database = idbDatabaseRecord(p, c.database);
		return AllSpeak_IDB_Core.openCursor({
			db: database.db,
			store: p.getValue(c.store),
			where: idbResolvedWhere(p, c.where),
			mode: c.mode
		}).then(handle => ({ handle, database: database.name }));
	}, (p, c, result) => {
		const record = p.getSymbolRecord(c.target);
		// A second scan on a cursor that was not closed would leak the first transaction, which
		// pins its store — so the old one is ended, exactly as `idb close` would have ended it.
		AllSpeak_IDB_Core.closeCursor(record.cursor);
		record.cursor = result.handle;
		record.db = result.database;
		idbCursorState(record);
		const database = p.getSymbolRecord(result.database);
		if (database && !(database.cursors || []).includes(record.name)) {
			if (!database.cursors) {
				database.cursors = [];
			}
			database.cursors.push(record.name);
		}
	});
}

function idbRunAdvance(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = p.getSymbolRecord(c.target);
		return AllSpeak_IDB_Core.advance(record.cursor);
	}, (p, c) => idbCursorState(p.getSymbolRecord(c.target)));
}

function idbRunCloseCursor(program, command) {
	const record = program.getSymbolRecord(command.target);
	AllSpeak_IDB_Core.closeCursor(record.cursor);
	record.cursor = null;
	record.isOpen = false;
	return command.pc + 1;
}

function idbRunDeleteCurrent(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = p.getSymbolRecord(c.target);
		return AllSpeak_IDB_Core.deleteCurrent(record.cursor);
	});
}

function idbRunUpdateCurrent(program, command) {
	return idbAsync(program, command, (p, c) => {
		const record = p.getSymbolRecord(c.target);
		return AllSpeak_IDB_Core.updateCurrent(record.cursor, idbStorable(p, c.value));
	});
}

function idbRunBlobFromFile(program, command) {
	const input = program.getSymbolRecord(command.input);
	const element = input && input.element ? input.element[input.index] : null;
	const files = element && element.files;
	if (!files || !files.length) {
		return idbFail(program, command, AllSpeak_IDB_Core.failure(`blob from file`, {
			name: `NotFoundError`,
			message: `the file input '${command.input}' has no file chosen`
		}));
	}
	const record = program.getSymbolRecord(command.target);
	record.blob = files[0];
	record.url = null;
	return command.pc + 1;
}

function idbRunRelease(program, command) {
	const record = program.getSymbolRecord(command.target);
	if (record.url && typeof URL !== `undefined` && typeof URL.revokeObjectURL === `function`) {
		URL.revokeObjectURL(record.url);
	}
	record.url = null;
	return command.pc + 1;
}

function idbRunEstimate(program, command) {
	return idbAsync(program, command, () => AllSpeak_IDB_Core.estimate(),
		(p, c, estimate) => idbSetTarget(p, c, c.target, estimate));
}

function idbRunPersist(program, command) {
	return idbAsync(program, command, () => AllSpeak_IDB_Core.persist(),
		(p, c, granted) => idbSetTarget(p, c, c.target, !!granted));
}

function idbRunPersisted(program, command) {
	return idbAsync(program, command, () => AllSpeak_IDB_Core.persisted(),
		(p, c, protectedAlready) => idbSetTarget(p, c, c.target, !!protectedAlready));
}

// ---------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------

AllSpeak.domain.idb = AllSpeak_IDB;
