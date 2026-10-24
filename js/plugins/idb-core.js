// The IndexedDB core — promises over the browser API, and nothing about AllSpeak in it.
//
// **Why it is a file of its own.** A vocabulary adapter and a storage wrapper fail in different
// ways: the adapter can be wrong about a sentence while the wrapper is right about a database, and
// the other way round. Split, `tools/idb-check.js` can run this half against `fake-indexeddb` in
// Node, where a real database is cheap and a real browser is not, and blame the right half. A page
// loads this file first and `idb.js` after it.
//
// **The two rules this file exists to keep.**
//
// *The transaction is the unit, not the request.* A write answers when its transaction commits, so
// `put` never reports success for a record the browser later drops. Reads answer at the request,
// which is the same thing for a read.
//
// *Awaiting is safe inside a transaction, and a fetch is not.* A transaction commits when it has no
// pending request and control returns to the event loop; a microtask runs before that return, so a
// promise that resolves in a request's `onsuccess` may be awaited and the next request issued from
// the continuation. That is what lets a batch run one operation after another in one transaction,
// and what lets a cursor survive from one AllSpeak command to the next. It also means a script must
// not `wait`, fetch or ask the user while a cursor is open: that returns to the event loop for real,
// and the transaction is gone.

const AllSpeak_IDB_Core = (() => {

	// A failure always leaves here in one shape: the DOMException's own name, and a sentence a
	// script can print. `the error` is what a failure clause reads, so the sentence names the
	// operation — a bare `ConstraintError` does not say which write met it.
	const failure = (operation, err) => {
		if (err && err.idbFailure) {
			return err;
		}
		const name = (err && err.name) || `Error`;
		const detail = (err && err.message) || String(err);
		return {
			idbFailure: true,
			name,
			message: `IndexedDB ${operation} failed: ${name}: ${detail}`
		};
	};

	// A mistake in the script rather than in the database — a missing store, a key used where the
	// store takes one from the value. `InvalidAccessError` is the spec's name for the key-and-range
	// family, and it is what a script's failure table lists.
	const invalid = (message) => {
		const err = new Error(message);
		err.name = `InvalidAccessError`;
		return err;
	};

	// One settle, one answer. IndexedDB reports a failed request twice — once on the request and
	// once on the transaction that aborts because of it — and both listeners would otherwise
	// resolve or reject a promise that has already been answered.
	const deferred = () => {
		let settled = false;
		let resolveFn = null;
		let rejectFn = null;
		const promise = new Promise((resolve, reject) => {
			resolveFn = resolve;
			rejectFn = reject;
		});
		return {
			promise,
			get settled() {
				return settled;
			},
			resolve(value) {
				if (!settled) {
					settled = true;
					resolveFn(value);
				}
			},
			reject(err) {
				if (!settled) {
					settled = true;
					rejectFn(err);
				}
			}
		};
	};

	const hasName = (list, name) => {
		if (!list) {
			return false;
		}
		if (typeof list.contains === `function`) {
			return list.contains(name);
		}
		return Array.from(list).includes(name);
	};

	const requireApi = () => {
		if (typeof indexedDB === `undefined` || indexedDB === null) {
			const err = new Error(`this environment has no IndexedDB — the browser runtime is the only one that has it`);
			err.name = `NotSupportedError`;
			throw err;
		}
		return indexedDB;
	};

	// An open connection, or the sentence that says why there is not one. A `versionchange` closes
	// the connection from underneath the script, so "closed" is a state a command can meet.
	const connection = (db) => {
		if (!db) {
			const err = new Error(`the database is closed`);
			err.name = `InvalidStateError`;
			throw err;
		}
		return db;
	};

	const withTransaction = (db, stores, mode, body, operation) => {
		try {
			const tx = connection(db).transaction(stores, mode);
			return body(tx);
		} catch (err) {
			throw failure(operation, err);
		}
	};

	// ---- schema --------------------------------------------------------------------------------

	// Applied inside `onupgradeneeded`, where nothing may be awaited. Drops first, then stores, then
	// indexes: a store cannot be created twice, and an index cannot be created on a store that is
	// not there yet.
	const applySchema = (db, schema, transaction) => {
		if (!schema) {
			return;
		}
		for (const name of schema.dropStores || []) {
			if (hasName(db.objectStoreNames, name)) {
				db.deleteObjectStore(name);
			}
		}
		for (const drop of schema.dropIndexes || []) {
			if (!hasName(db.objectStoreNames, drop.store)) {
				continue;
			}
			const store = transaction.objectStore(drop.store);
			if (hasName(store.indexNames, drop.index)) {
				store.deleteIndex(drop.index);
			}
		}
		const created = [];
		for (const spec of schema.stores || []) {
			let store;
			if (hasName(db.objectStoreNames, spec.name)) {
				store = transaction.objectStore(spec.name);
			} else {
				const options = {};
				if (spec.keyPath !== null && typeof spec.keyPath !== `undefined`) {
					options.keyPath = spec.keyPath;
				}
				if (spec.autoIncrement) {
					options.autoIncrement = true;
				}
				store = db.createObjectStore(spec.name, options);
			}
			created.push([store, spec]);
		}
		for (const entry of created) {
			const store = entry[0];
			const spec = entry[1];
			for (const index of spec.indexes || []) {
				if (!hasName(store.indexNames, index.name)) {
					store.createIndex(index.name, index.keyPath, {
						unique: !!index.unique,
						multiEntry: !!index.multiEntry
					});
				}
			}
		}
	};

	const describeKeyPath = (keyPath) => {
		if (keyPath === null || typeof keyPath === `undefined`) {
			return `none`;
		}
		if (Array.isArray(keyPath)) {
			return keyPath.join(` + `);
		}
		return String(keyPath);
	};

	// The schema declares a shape; the database already has one. At the same version they must be
	// the same shape, and the argument for refusing rather than repairing is that changing a store
	// without a version bump is the mistake this check exists to catch — silently going along with
	// it hides the fact that the caller's version number no longer means anything.
	const verify = (db, schema) => {
		const stores = (schema && schema.stores) || [];
		const problems = [];
		for (const spec of stores) {
			if (!hasName(db.objectStoreNames, spec.name)) {
				problems.push(`store '${spec.name}' is missing`);
			}
		}
		if (problems.length) {
			return Promise.reject(mismatch(db, schema, problems));
		}
		if (!stores.length) {
			return Promise.resolve();
		}
		let tx;
		try {
			tx = db.transaction(stores.map(spec => spec.name), `readonly`);
		} catch (err) {
			return Promise.reject(failure(`open`, err));
		}
		for (const spec of stores) {
			const store = tx.objectStore(spec.name);
			const expected = spec.keyPath === null || typeof spec.keyPath === `undefined` ? null : spec.keyPath;
			const actual = store.keyPath === null || typeof store.keyPath === `undefined` ? null : store.keyPath;
			if (expected !== actual) {
				problems.push(`store '${spec.name}' has key path ${describeKeyPath(actual)},`
					+ ` not ${describeKeyPath(expected)}`);
			}
			if (!!spec.autoIncrement !== !!store.autoIncrement) {
				problems.push(`store '${spec.name}' is ${store.autoIncrement ? `auto-incrementing` : `not auto-incrementing`},`
					+ ` not ${spec.autoIncrement ? `auto-incrementing` : `not auto-incrementing`}`);
			}
			for (const index of spec.indexes || []) {
				if (!hasName(store.indexNames, index.name)) {
					problems.push(`index '${index.name}' on store '${spec.name}' is missing`);
					continue;
				}
				const actualIndex = store.index(index.name);
				if (actualIndex.keyPath !== index.keyPath) {
					problems.push(`index '${index.name}' on store '${spec.name}' is on`
						+ ` ${describeKeyPath(actualIndex.keyPath)}, not ${describeKeyPath(index.keyPath)}`);
				}
				if (!!actualIndex.unique !== !!index.unique) {
					problems.push(`index '${index.name}' on store '${spec.name}' is`
						+ ` ${actualIndex.unique ? `unique` : `not unique`}, not`
						+ ` ${index.unique ? `unique` : `not unique`}`);
				}
				if (!!actualIndex.multiEntry !== !!index.multiEntry) {
					problems.push(`index '${index.name}' on store '${spec.name}' is`
						+ ` ${actualIndex.multiEntry ? `multi-entry` : `single-entry`}, not`
						+ ` ${index.multiEntry ? `multi-entry` : `single-entry`}`);
				}
			}
		}
		if (problems.length) {
			return Promise.reject(mismatch(db, schema, problems));
		}
		return Promise.resolve();
	};

	const mismatch = (db, schema, problems) => {
		const err = new Error(`database '${db.name}' is at version ${db.version}, which matches schema`
			+ ` version ${schema.version}, but its structure does not: ${problems.join(`; `)}.`
			+ ` Bump the schema version to change the structure.`);
		err.name = `VersionError`;
		return failure(`open`, err);
	};

	// ---- opening and closing -------------------------------------------------------------------

	const open = (options) => {
		const settings = options || {};
		const d = deferred();
		const blockedMs = settings.blockedMs || 2000;
		let timer = null;
		let upgraded = false;
		let request;
		try {
			const api = requireApi();
			request = settings.version === undefined || settings.version === null
				? api.open(settings.name)
				: api.open(settings.name, settings.version);
		} catch (err) {
			d.reject(failure(`open`, err));
			return d.promise;
		}
		const stopTimer = () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};
		request.onupgradeneeded = () => {
			upgraded = true;
			try {
				applySchema(request.result, settings.schema, request.transaction);
			} catch (err) {
				// The upgrade transaction is abandoned rather than left half-applied: a later
				// `open` at this version must not find a database that is part of the way there.
				try {
					request.transaction.abort();
				} catch (ignored) {
					// Already finished, in which case there is nothing to undo.
				}
				stopTimer();
				d.reject(failure(`open`, err));
			}
		};
		request.onblocked = () => {
			if (timer || d.settled) {
				return;
			}
			timer = setTimeout(() => {
				timer = null;
				d.reject(failure(`open`, {
					name: `BlockedError`,
					message: `another tab or window still has '${settings.name}' open.`
						+ ` Close it, then try again.`
				}));
			}, blockedMs);
		};
		request.onerror = () => {
			stopTimer();
			d.reject(failure(`open`, request.error));
		};
		request.onsuccess = () => {
			stopTimer();
			const db = request.result;
			if (d.settled) {
				// A blocked upgrade already answered for this attempt. Holding the connection open
				// would then be what blocks the other tab, which is the fault this branch avoids.
				try {
					db.close();
				} catch (ignored) {
					// Nothing to close.
				}
				return;
			}
			const answer = () => d.resolve({ db, name: db.name, version: db.version });
			if (settings.schema && !upgraded) {
				verify(db, settings.schema).then(answer).catch(err => {
					try {
						db.close();
					} catch (ignored) {
						// Nothing to close.
					}
					d.reject(failure(`open`, err));
				});
			} else {
				answer();
			}
		};
		return d.promise;
	};

	const close = (db) => {
		if (db) {
			try {
				db.close();
			} catch (ignored) {
				// A connection the browser has already dropped.
			}
		}
	};

	const deleteDatabase = (name, blockedMs) => {
		const d = deferred();
		let timer = null;
		let request;
		try {
			request = requireApi().deleteDatabase(name);
		} catch (err) {
			d.reject(failure(`delete database`, err));
			return d.promise;
		}
		const stopTimer = () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};
		request.onblocked = () => {
			if (timer || d.settled) {
				return;
			}
			timer = setTimeout(() => {
				timer = null;
				d.reject(failure(`delete database`, {
					name: `BlockedError`,
					message: `another tab or window still has '${name}' open.`
						+ ` Close it, then try again.`
				}));
			}, blockedMs || 2000);
		};
		request.onsuccess = () => {
			stopTimer();
			d.resolve();
		};
		request.onerror = () => {
			stopTimer();
			d.reject(failure(`delete database`, request.error));
		};
		return d.promise;
	};

	// ---- keys and ranges -----------------------------------------------------------------------

	const rangeFor = (where) => {
		if (!where) {
			return undefined;
		}
		const invalidRange = (err) => invalid(`'\`${where.field}\`' does not name a valid set of keys:`
			+ ` ${err && err.message ? err.message : err}`);
		try {
			switch (where.form) {
			case `is`:
				return IDBKeyRange.only(where.low);
			case `between`:
				return IDBKeyRange.bound(where.low, where.high);
			case `above`:
				return IDBKeyRange.lowerBound(where.low, true);
			case `below`:
				return IDBKeyRange.upperBound(where.high, true);
			case `atLeast`:
				return IDBKeyRange.lowerBound(where.low, false);
			case `atMost`:
				return IDBKeyRange.upperBound(where.high, false);
			default:
				throw new Error(`unknown range form '${where.form}'`);
			}
		} catch (err) {
			throw invalidRange(err);
		}
	};

	// A `where` names the key path or an index, and nothing else. An unindexed field is refused
	// rather than scanned: the scan is the cost that has no number in the script, so a store that
	// needs one has to say so by declaring an index.
	const sourceFor = (store, where) => {
		if (!where) {
			return store;
		}
		const keyPath = typeof store.keyPath === `string` ? store.keyPath : null;
		if (keyPath !== null && keyPath === where.field) {
			return store;
		}
		if (hasName(store.indexNames, where.field)) {
			return store.index(where.field);
		}
		const err = new Error(`'\`${where.field}\`' is neither the key path nor an index of store`
			+ ` '${store.name}'. Declare an index for it, or read the whole store without 'where'.`);
		err.name = `NotFoundError`;
		throw err;
	};

	// A store with a key path takes its key from the value; a store without one needs it supplied.
	// Both mistakes are refused here, where the sentence can say which store and which rule.
	const checkKey = (store, key) => {
		const takesKeyPath = store.keyPath !== null && typeof store.keyPath !== `undefined`;
		if (takesKeyPath && key !== undefined) {
			throw invalid(`store '${store.name}' takes its key from the value`
				+ ` (key path '${describeKeyPath(store.keyPath)}'), so 'with key' cannot be used`);
		}
		if (!takesKeyPath && key === undefined) {
			throw invalid(`store '${store.name}' has no key path, so the write needs`
				+ ` 'with key <key>'`);
		}
	};

	// ---- single writes -------------------------------------------------------------------------

	const write = (operation, options) => {
		const d = deferred();
		let result;
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], `readwrite`);
			const store = tx.objectStore(options.store);
			checkKey(store, options.key);
			request = options.key === undefined
				? store[operation](options.value)
				: store[operation](options.value, options.key);
			request.onsuccess = () => {
				result = request.result;
			};
			// **The transaction, not the request.** A request that succeeds can still be undone by
			// an abort, and a record the script has been told is saved is worse than one it has
			// been told is not.
			tx.oncomplete = () => d.resolve(result);
			tx.onabort = () => d.reject(failure(operation, tx.error || request.error
				|| { name: `AbortError`, message: `the transaction was aborted` }));
		} catch (err) {
			d.reject(failure(operation, err));
		}
		return d.promise;
	};

	const put = (options) => write(`put`, options);
	const add = (options) => write(`add`, options);

	// ---- single reads --------------------------------------------------------------------------

	const read = (operation, options, prepare) => {
		const d = deferred();
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], `readonly`);
			request = prepare(tx.objectStore(options.store));
			request.onsuccess = () => d.resolve(request.result);
			request.onerror = () => d.reject(failure(operation, request.error));
		} catch (err) {
			d.reject(failure(operation, err));
		}
		return d.promise;
	};

	const get = (options) => read(`get`, options, store => store.get(options.key));

	const getAll = (options) => read(`get`, options, store => {
		const source = sourceFor(store, options.where);
		const range = rangeFor(options.where);
		if (options.limit === 1) {
			return source.getAll(range, 1);
		}
		return source.getAll(range);
	});

	const count = (options) => read(`count`, options, store => {
		const source = sourceFor(store, options.where);
		return source.count(rangeFor(options.where));
	});

	const has = (options) => read(`has`, options, store => store.count(options.key))
		.then(total => total > 0);

	// ---- deleting ------------------------------------------------------------------------------

	const remove = (operation, options) => {
		const d = deferred();
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], `readwrite`);
			request = tx.objectStore(options.store).delete(options.key);
			request.onerror = () => d.reject(failure(operation, request.error));
			tx.oncomplete = () => d.resolve();
			tx.onabort = () => d.reject(failure(operation, tx.error || request.error
				|| { name: `AbortError`, message: `the transaction was aborted` }));
		} catch (err) {
			d.reject(failure(operation, err));
		}
		return d.promise;
	};

	const removeByKey = (options) => remove(`delete`, options);

	const clear = (options) => {
		const d = deferred();
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], `readwrite`);
			request = tx.objectStore(options.store).clear();
			request.onerror = () => d.reject(failure(`clear`, request.error));
			tx.oncomplete = () => d.resolve();
			tx.onabort = () => d.reject(failure(`clear`, tx.error || request.error
				|| { name: `AbortError`, message: `the transaction was aborted` }));
		} catch (err) {
			d.reject(failure(`clear`, err));
		}
		return d.promise;
	};

	// A `where` on a delete walks a cursor inside the one transaction, so the set it deletes is
	// the set it found: a record inserted behind the cursor is not visited, and one deleted by a
	// concurrent writer cannot arrive in the middle.
	const removeWhere = (options) => {
		const d = deferred();
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], `readwrite`);
			const store = tx.objectStore(options.store);
			const source = sourceFor(store, options.where);
			request = source.openCursor(rangeFor(options.where));
			request.onsuccess = () => {
				const cursor = request.result;
				if (!cursor) {
					return;
				}
				cursor.delete();
				cursor.continue();
			};
			request.onerror = () => d.reject(failure(`delete`, request.error));
			tx.oncomplete = () => d.resolve();
			tx.onabort = () => d.reject(failure(`delete`, tx.error || request.error
				|| { name: `AbortError`, message: `the transaction was aborted` }));
		} catch (err) {
			d.reject(failure(`delete`, err));
		}
		return d.promise;
	};

	// ---- batches -------------------------------------------------------------------------------

	// One operation, issued on the transaction the batch owns. Resolving happens at the request,
	// which is enough inside a transaction: the next operation is issued from the microtask the
	// resolution runs in, before the transaction has any chance to commit.
	const runOperation = (transaction, operation) => new Promise((resolve, reject) => {
		const store = transaction.objectStore(operation.store);
		switch (operation.op) {
		case `put`:
		case `add`: {
			checkKey(store, operation.key);
			const request = operation.key === undefined
				? store[operation.op](operation.value)
				: store[operation.op](operation.value, operation.key);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(failure(operation.op, request.error));
			break;
		}
		case `delete`: {
			const request = store.delete(operation.key);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(failure(`delete`, request.error));
			break;
		}
		case `deleteWhere`: {
			const source = sourceFor(store, operation.where);
			const request = source.openCursor(rangeFor(operation.where));
			request.onsuccess = () => {
				const cursor = request.result;
				if (!cursor) {
					resolve();
					return;
				}
				cursor.delete();
				cursor.continue();
			};
			request.onerror = () => reject(failure(`delete`, request.error));
			break;
		}
		case `clear`: {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(failure(`clear`, request.error));
			break;
		}
		default:
			reject(failure(`commit`, new Error(`unknown batch operation '${operation.op}'`)));
		}
	});

	const runBatch = async (options) => {
		const operations = options.operations || [];
		if (!operations.length) {
			return;
		}
		const stores = [];
		for (const operation of operations) {
			if (!stores.includes(operation.store)) {
				stores.push(operation.store);
			}
		}
		let tx;
		try {
			tx = connection(options.db).transaction(stores, `readwrite`);
		} catch (err) {
			throw failure(`commit`, err);
		}
		const finished = new Promise((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onabort = () => reject(failure(`commit`, tx.error
				|| { name: `AbortError`, message: `the transaction was aborted` }));
		});
		try {
			for (const operation of operations) {
				await runOperation(tx, operation);
			}
		} catch (err) {
			// The batch's whole promise is that a failure leaves nothing behind, so the
			// transaction is abandoned rather than finished with the operations that did work.
			try {
				tx.abort();
			} catch (ignored) {
				// Already aborted by the failed request.
			}
			await finished.catch(() => {});
			throw failure(`commit`, err);
		}
		await finished;
	};

	// ---- cursors -------------------------------------------------------------------------------

	const openCursor = (options) => new Promise((resolve, reject) => {
		let request;
		try {
			const tx = connection(options.db).transaction([options.store], options.mode || `readonly`);
			const store = tx.objectStore(options.store);
			const source = sourceFor(store, options.where);
			request = source.openCursor(rangeFor(options.where));
			request.onsuccess = () => resolve({
				transaction: tx,
				request,
				source,
				store,
				mode: options.mode || `readonly`,
				cursor: request.result
			});
			request.onerror = () => reject(failure(`scan`, request.error));
		} catch (err) {
			reject(failure(`scan`, err));
		}
	});

	const advance = (handle) => new Promise((resolve, reject) => {
		if (!handle || !handle.cursor) {
			resolve(null);
			return;
		}
		handle.request.onsuccess = () => {
			handle.cursor = handle.request.result;
			resolve(handle.cursor);
		};
		handle.request.onerror = () => reject(failure(`advance`, handle.request.error));
		try {
			handle.cursor.continue();
		} catch (err) {
			reject(failure(`advance`, err));
		}
	});

	const deleteCurrent = (handle) => new Promise((resolve, reject) => {
		if (!handle || !handle.cursor) {
			reject(failure(`delete current`, {
				name: `InvalidStateError`,
				message: `the cursor is not on a record`
			}));
			return;
		}
		let request;
		try {
			request = handle.cursor.delete();
		} catch (err) {
			reject(failure(`delete current`, err));
			return;
		}
		request.onsuccess = () => resolve();
		request.onerror = () => reject(failure(`delete current`, request.error));
	});

	const updateCurrent = (handle, value) => new Promise((resolve, reject) => {
		if (!handle || !handle.cursor) {
			reject(failure(`update current`, {
				name: `InvalidStateError`,
				message: `the cursor is not on a record`
			}));
			return;
		}
		let request;
		try {
			request = handle.cursor.update(value);
		} catch (err) {
			reject(failure(`update current`, err));
			return;
		}
		request.onsuccess = () => resolve();
		request.onerror = () => reject(failure(`update current`, request.error));
	});

	// A cursor is ended by letting its transaction finish. `commit()` says so now rather than at
	// the next turn of the event loop, which releases the read lock on the store sooner — and the
	// lock is what an upgrade in another tab is waiting for.
	const closeCursor = (handle) => {
		if (!handle) {
			return;
		}
		handle.cursor = null;
		try {
			if (handle.transaction && typeof handle.transaction.commit === `function`) {
				handle.transaction.commit();
			}
		} catch (ignored) {
			// The transaction has already finished, which is what closing wanted.
		}
	};

	// ---- storage -------------------------------------------------------------------------------

	const storage = () => {
		if (typeof navigator === `undefined` || !navigator.storage) {
			const err = new Error(`the Storage API is not available in this browser`);
			err.name = `NotSupportedError`;
			throw err;
		}
		return navigator.storage;
	};

	const estimate = () => {
		let api;
		try {
			api = storage();
		} catch (err) {
			return Promise.reject(failure(`estimate storage`, err));
		}
		if (typeof api.estimate !== `function`) {
			return Promise.reject(failure(`estimate storage`, {
				name: `NotSupportedError`,
				message: `this browser has no storage estimate`
			}));
		}
		return api.estimate().then(estimate => ({
			usage: estimate && typeof estimate.usage === `number` ? estimate.usage : 0,
			quota: estimate && typeof estimate.quota === `number` ? estimate.quota : 0
		})).catch(err => {
			throw failure(`estimate storage`, err);
		});
	};

	const persist = () => {
		let api;
		try {
			api = storage();
		} catch (err) {
			return Promise.reject(failure(`request persistence`, err));
		}
		if (typeof api.persist !== `function`) {
			return Promise.reject(failure(`request persistence`, {
				name: `NotSupportedError`,
				message: `this browser cannot request persistent storage`
			}));
		}
		return api.persist().catch(err => {
			throw failure(`request persistence`, err);
		});
	};

	const persisted = () => {
		let api;
		try {
			api = storage();
		} catch (err) {
			return Promise.reject(failure(`check persistence`, err));
		}
		if (typeof api.persisted !== `function`) {
			return Promise.reject(failure(`check persistence`, {
				name: `NotSupportedError`,
				message: `this browser does not report persistent storage`
			}));
		}
		return api.persisted().catch(err => {
			throw failure(`check persistence`, err);
		});
	};

	return {
		failure,
		invalid,
		open,
		close,
		deleteDatabase,
		verify,
		put,
		add,
		get,
		getAll,
		count,
		has,
		removeByKey,
		removeWhere,
		clear,
		runBatch,
		openCursor,
		advance,
		deleteCurrent,
		updateCurrent,
		closeCursor,
		estimate,
		persist,
		persisted
	};
})();

// A starter pack loads this as a plain script beside the runtime, where `module` does not exist;
// under Node it is what lets `tools/idb-check.js` require the half it can test.
if (typeof module !== `undefined` && module.exports) {
	module.exports = AllSpeak_IDB_Core;
}
