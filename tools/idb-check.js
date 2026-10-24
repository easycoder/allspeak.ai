#!/usr/bin/env node
//
// Does the `idb` plugin do what its vocabulary says — and does it do it through the real runtime,
// or only through the core's own promises? The vocabulary is Sherpa's `specs/allspeak-idb-plugin.md`;
// this file is what asks the questions of it here.
//
// **Why this exists.** The plugin is two halves that fail differently, and neither failure looks
// like one from the other side. The core half (`idb-core.js`) can satisfy its promise API while
// losing a write it reported as saved, or committing half a batch; the vocabulary half (`idb.js`)
// can compile a sentence into a shape nobody runs, and a script with no runtime error and no
// effect is the hardest kind of fault to notice. So this asks each half its own questions, and then
// asks both together: a script is compiled by the real compiler and run by the real run loop over
// `fake-indexeddb`, which is the closest thing to a browser that a terminal can hold.
//
// **The transaction rules are asserted, not assumed.** Cases 6 and 7 of the spec's list — a failed
// batch leaving nothing behind, and a cursor deleting the record it is on — are the two where a
// plausible-looking implementation is wrong in a way no single successful command reveals. Both
// are checked by reading the store afterwards.
//
// **Where the file stores cannot go.** `idb blob B from file F` reads a DOM `file` input, and a
// browser is the only instrument for the gesture that fills one; here the element is attached by
// hand instead, which tests the handle and not the picker. `navigator.storage` does not exist in
// Node at all, so the Storage commands are asserted through their **failure clause** — which is
// the half a script can observe anyway.
//
// **What it needs.** `fake-indexeddb` is a dev dependency and not a runtime one, so this says how
// to get it rather than dying on a require:
//
//     npm install --no-save fake-indexeddb
//     node tools/idb-check.js
//
const fs = require(`fs`);
const path = require(`path`);
const vm = require(`vm`);

const root = path.resolve(__dirname, `..`);
// It compiles the runtime from source, so it needs a checkout rather than a starter pack — the
// same sentence the other checks say, for the same reason: a pack is a client of the CDN.
if (!fs.existsSync(path.join(root, `js/allspeak`))) {
	process.stderr.write(`idb-check: no js/allspeak beside this script. This check compiles the runtime`
		+ ` from source and runs it, so it needs a checkout of the AllSpeak repository rather than a`
		+ ` starter pack.\n`);
	process.exit(2);
}
try {
	require(`fake-indexeddb/auto`);
} catch (err) {
	process.stderr.write(`idb-check: fake-indexeddb is not installed. It is the database this check`
		+ ` runs against, and it is a dev dependency rather than a runtime one:\n\n`
		+ `    npm install --no-save fake-indexeddb\n\n`);
	process.exit(2);
}

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

// ---- the runtime, loaded the way a page loads it ----------------------------------------
// The stub is the one `tools/attr-check.js` uses, for the same reason: the compiler needs a
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
// `print` and `log` reach the console through `AllSpeak.writeToDebugConsole`; holding the lines
// here is how a script's output is read back, and it is the same text a reader would see.
console.log = (...args) => printed.push(args.join(` `));

const RUNTIME = [
	`Core.js`, `Browser.js`, `MarkdownRenderer.js`, `Webson.js`, `JSON.js`, `MQTT.js`,
	`REST.js`, `Compare.js`, `Condition.js`, `Value.js`, `Run.js`, `Opcodes.js`,
	`Language.js`, `LanguagePack_en.js`, `Compile.js`, `Main.js`
];
for (const file of RUNTIME) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/allspeak`, file), `utf8`), { filename: file });
}
// Core first, as a page must: the vocabulary adapter reads the core's global.
for (const file of [`idb-core.js`, `idb.js`]) {
	vm.runInThisContext(fs.readFileSync(path.join(root, `js/plugins`, file), `utf8`), { filename: file });
}
vm.runInThisContext(`globalThis.__idbCheck = { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en,`
	+ ` AllSpeak_IDB, AllSpeak_IDB_Core };`);
const { AllSpeak, AllSpeak_Language, AllSpeak_LanguagePack_en, AllSpeak_IDB, AllSpeak_IDB_Core } =
	globalThis.__idbCheck;
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
AllSpeak.scripts = {};
AllSpeak.scriptIndex = 0;

// ---- driving a script -------------------------------------------------------------------
// A script ends with `exit` and this waits for the program to be removed from `AllSpeak.scripts`,
// which is what `exit` does. A script whose last act is `stop`, or whose failure clause ends with
// one, is parked rather than ended — `finishWhen` covers those.

const takePrinted = () => printed.splice(0, printed.length);
const failedAlerts = () => alerts.splice(0, alerts.length);

const execute = (source, options) => new Promise((resolve, reject) => {
	const settings = options || {};
	const timeoutMs = settings.timeoutMs || 5000;
	const before = AllSpeak.scriptIndex;
	failedAlerts();
	takePrinted();
	AllSpeak.tokeniseAndCompile(source.split(`\n`));
	const program = AllSpeak.scripts[before];
	if (!program) {
		reject(new Error(`did not compile: ${failedAlerts().slice(-1)[0] || `no reason given`}`));
		return;
	}
	const deadline = Date.now() + timeoutMs;
	let settled = false;
	const finish = () => {
		if (settled) return;
		settled = true;
		resolve({ program, out: takePrinted(), alerts: failedAlerts() });
	};
	const poll = () => {
		if (settled) return;
		if (settings.finishWhen && settings.finishWhen(printed)) {
			// A parked script is done when the line it was asked for appears; a moment's grace
			// lets the statement after it (the one it must not reach) have its chance to print.
			setTimeout(finish, 40);
			return;
		}
		if (!AllSpeak.scripts[before]) {
			finish();
			return;
		}
		if (program.aborted) {
			settled = true;
			reject(new Error(`runtime error: ${failedAlerts().slice(-1)[0] || `not reported`}`));
			return;
		}
		if (Date.now() > deadline) {
			settled = true;
			reject(new Error(`timed out; printed: ${printed.join(` | `)}`));
			return;
		}
		setTimeout(poll, 2);
	};
	setTimeout(poll, 0);
});

// Compiling without running, for the questions that are about the shape of a command.
const compile = (source) => {
	const tokens = AllSpeak.tokeniseFile(source.split(`\n`));
	const program = AllSpeak.compileScript(tokens, {}, null, null);
	program.running = true;
	return program;
};
const commands = (program, keyword) => program.filter(c => c && c.keyword === keyword);
const symbolRecord = (program, name) => program[program.symbols[name].pc];

// ---------------------------------------------------------------------------------------------
// 1. The vocabulary compiles into the shapes the spec describes
// ---------------------------------------------------------------------------------------------

section(`The vocabulary`);
try {
	const program = compile(`
variable Route
variable Found
variable Total
variable Key
idb database DB
idb schema S version 1
idb store \`routes\` in S with key \`id\`
idb store \`outbox\` in S with key \`opId\` and auto increment
idb store \`photos\` in S without key
idb index \`updatedAt\` on \`routes\` in S
idb unique index \`slug\` on \`routes\` in S
idb index \`tags\` on \`routes\` in S with multiple entries
idb drop store \`old\` from S
idb drop index \`stale\` from \`routes\` in S
idb open \`sherpa\` as DB using S
idb put Route into \`routes\` of DB
idb put Route into \`routes\` of DB with key Key giving Key
idb add Route to \`photos\` of DB giving Key
idb get Route from \`routes\` of DB with key 1
idb get first from \`routes\` of DB where \`updatedAt\` is between 1 and 2 into Route
idb get all from \`routes\` of DB where \`tags\` is at least 2 into Route
idb has \`routes\` of DB with key 1 into Found
idb count \`routes\` of DB where \`updatedAt\` is at most 9 into Total
idb delete from \`routes\` of DB with key 1
idb delete from \`routes\` of DB where \`updatedAt\` is below 4
idb clear \`routes\` of DB
idb batch B
idb start batch B on DB
idb put Route into \`routes\` of B
idb add Route to \`photos\` of B
idb delete from \`routes\` of B where \`updatedAt\` is above 3
idb clear \`photos\` of B
idb commit B
idb abort B
idb cursor C
idb scan C in \`routes\` of DB for update where \`updatedAt\` is 5
idb advance C
idb delete current C
idb update current C with Route
idb close C
idb blob P
idb release P
idb estimate storage into Total
idb request persistence into Found
idb check persistence into Found
idb close DB
idb delete database \`sherpa\`
`);
	const schema = symbolRecord(program, `S`);
	check(schema.keyword === `idb schema`, `a schema is a symbol of its own kind`);
	check(schema.version === 1, `its version is a number (got ${schema.version})`);
	const routes = schema.stores.get(`routes`);
	check(!!routes && routes.keyPath === `id` && !routes.autoIncrement,
		`a store is a key path (${routes && routes.keyPath})`);
	check(!!schema.stores.get(`outbox`).autoIncrement, `and may auto-increment`);
	check(schema.stores.get(`photos`).keyPath === null, `or have no key path`);
	check(routes.indexes.get(`updatedAt`).unique === false, `an index is not unique by default`);
	check(routes.indexes.get(`slug`).unique === true, `a unique index is`);
	check(routes.indexes.get(`tags`).multiEntry === true, `a multi-entry index is`);
	check(schema.dropStores.includes(`old`) && schema.dropIndexes.length === 1,
		`drops are recorded for the upgrade`);

	check(commands(program, `open`).length === 1, `'idb open' compiles to one command`);
	const open = commands(program, `open`)[0];
	check(open.domain === `idb` && open.target === `DB` && open.schema === `S`,
		`which names its database and its schema`);
	check(commands(program, `put`).length === 2 && commands(program, `add`).length === 1,
		`'put' and 'add' are different commands`);
	check(commands(program, `put`)[1].giving === `Key`, `'giving' records the variable`);
	check(commands(program, `get`)[0].target === `Route`, `'get' names the variable it fills`);
	check(commands(program, `getFirst`).length === 1 && commands(program, `getAll`).length === 1,
		`'get first' and 'get all' are their own commands`);
	const where = commands(program, `getAll`)[0].where;
	check(where && where.form === `atLeast`, `a 'where' carries the range form (${where && where.form})`);
	check(commands(program, `batchWrite`).length === 4, `batch writes are recorded, not issued`);
	check(commands(program, `commit`).length === 1 && commands(program, `abortBatch`).length === 1,
		`commit and abort are their own commands`);
	check(commands(program, `scan`)[0].mode === `readwrite`, `'for update' asks for a writable scan`);
	check(commands(program, `updateCurrent`)[0].value !== undefined,
		`'update current' carries its new record`);
	check(commands(program, `estimate`).length === 1
		&& commands(program, `persist`).length === 1
		&& commands(program, `persisted`).length === 1,
		`the three Storage commands compile`);
	check(commands(program, `closeDatabase`).length === 1
		&& commands(program, `closeCursor`).length === 1,
		`'close' tells a database from a cursor`);
	check(commands(program, `deleteDatabase`).length === 1,
		`'delete database' is a command of its own`);
} catch (err) {
	check(false, `the command catalogue compiles — ${err.message}`);
}

// The value expressions. `the key of C` is the one that has to be asked carefully: the Browser
// domain owns a bare `the key` (the last key event), and a value compiler that claims the two
// words leaves `of …` behind — so the form is asserted here rather than assumed.
try {
	const program = compile(`
variable K
variable V
variable S
variable N
idb database DB
idb cursor C
idb blob B
put the key of C into K
put the primary key of C into K
put the record of C into V
put the version of DB into N
put the name of DB into S
put the byte size of B into S
put the mime type of B into S
put the blob url of B into S
idb release B
`);
	// The value sits inside the `put` that carried it, which is where a reader of the program
	// finds it: `{ domain: 'core', keyword: 'put', value: { domain: 'idb', type: … } }`.
	const types = program
		.filter(command => command && command.value && command.value.domain === `idb`)
		.map(command => command.value.type);
	for (const type of [`key`, `primaryKey`, `record`, `version`, `name`, `byteSize`, `mimeType`, `blobUrl`]) {
		check(types.includes(type), `'the ${type} of …' compiles to an idb value (${type})`);
	}
	check(commands(program, `release`).length === 1, `'idb release' compiles`);
} catch (err) {
	check(false, `the value expressions compile — ${err.message}`);
}

// A failure clause is the runtime's own, so its shape is asked of the compiler: the command
// carries the clause's pc, and the clause is a separate run of commands after a goto.
try {
	const program = compile(`
variable Total
idb database DB
idb open \`x\` as DB or gosub Done
idb estimate storage into Total on failure put 1 into Total
Done:
exit
`);
	const open = commands(program, `open`)[0];
	check(typeof open.onError === `number` && open.onError > 0, `'or' compiles to a failure clause`);
	check(commands(program, `estimate`)[0].onError > 0, `'on failure' compiles to a failure clause`);
	const stopIndex = program.findIndex(c => c.keyword === `stop`);
	check(stopIndex > 0, `an 'or' clause is followed by a stop, which is what ends the thread`);
} catch (err) {
	check(false, `failure clauses compile — ${err.message}`);
}

// ---------------------------------------------------------------------------------------------
// 2. The core, against a database that behaves
// ---------------------------------------------------------------------------------------------
//
// The spec's conformance list, less the two cases a browser owns (a real quota, and a file input
// being filled by a person). Each case reads the store back afterwards rather than trusting the
// return value of the command that made it.

const schema = (version, extra) => {
	const base = {
		version,
		stores: [
			{ name: `routes`, keyPath: `id`, autoIncrement: false, indexes: [
				{ name: `updatedAt`, keyPath: `updatedAt`, unique: false, multiEntry: false }
			] },
			{ name: `steps`, keyPath: `id`, autoIncrement: false, indexes: [
				{ name: `routeId`, keyPath: `routeId`, unique: false, multiEntry: false }
			] },
			{ name: `photos`, keyPath: null, autoIncrement: false, indexes: [] }
		],
		dropStores: [],
		dropIndexes: []
	};
	if (extra) {
		extra(base);
	}
	return base;
};

const core = async () => {
	section(`The core (fake-indexeddb)`);

	// 1. create, reopen, survive
	let opened = null;
	try {
		opened = await AllSpeak_IDB_Core.open({ name: `check1`, version: 1, schema: schema(1) });
		check(opened.version === 1, `a new database opens at the schema's version`);
		await AllSpeak_IDB_Core.put({ db: opened.db, store: `routes`, value: { id: 1, updatedAt: 10 } });
		await AllSpeak_IDB_Core.put({ db: opened.db, store: `routes`, value: { id: 2, updatedAt: 20 } });
		AllSpeak_IDB_Core.close(opened.db);
		const again = await AllSpeak_IDB_Core.open({ name: `check1`, version: 1, schema: schema(1) });
		const rows = await AllSpeak_IDB_Core.getAll({ db: again.db, store: `routes` });
		check(rows.length === 2, `records survive a reopen`);
		check(Array.from(again.db.objectStoreNames).length === 3, `and so do the stores`);
		opened = again;
	} catch (err) {
		check(false, `a new database opens and reopens — ${err.message}`);
	}

	// 3. put replaces, add refuses, has tells missing from null
	try {
		await AllSpeak_IDB_Core.put({ db: opened.db, store: `routes`, value: { id: 1, updatedAt: 11 } });
		const replaced = await AllSpeak_IDB_Core.get({ db: opened.db, store: `routes`, key: 1 });
		check(replaced.updatedAt === 11, `'put' replaces a record`);
		let refused = false;
		try {
			await AllSpeak_IDB_Core.add({ db: opened.db, store: `routes`, value: { id: 1, updatedAt: 1 } });
		} catch (err) {
			refused = /ConstraintError/.test(err.message);
		}
		check(refused, `'add' refuses a duplicate, naming ConstraintError`);
		await AllSpeak_IDB_Core.put({ db: opened.db, store: `routes`, value: { id: 9, updatedAt: null } });
		check(await AllSpeak_IDB_Core.has({ db: opened.db, store: `routes`, key: 9 }),
			`'has' is true for a record stored as null`);
		check(!(await AllSpeak_IDB_Core.has({ db: opened.db, store: `routes`, key: 99 })),
			`and false for a missing one`);
	} catch (err) {
		check(false, `put, add and has — ${err.message}`);
	}

	// 4. key order
	try {
		const keys = await AllSpeak_IDB_Core.getAll({ db: opened.db, store: `routes` });
		check(keys.map(row => row.id).join(`,`) === `1,2,9`,
			`'get all' is in key order, numbers numerically (${keys.map(row => row.id).join(`,`)})`);
	} catch (err) {
		check(false, `key order — ${err.message}`);
	}

	// 5. every where form, endpoints included
	try {
		const forms = [
			[`is`, `20`, [2]],
			[`between`, `10 20`, [1, 2]],
			[`above`, `10`, [1, 2]],
			[`below`, `20`, [1]],
			[`atLeast`, `20`, [2]],
			[`atMost`, `11`, [1]]
		];
		const bounds = {
			is: w => ({ field: `updatedAt`, form: `is`, low: w[0] }),
			between: w => ({ field: `updatedAt`, form: `between`, low: w[0], high: w[1] }),
			above: w => ({ field: `updatedAt`, form: `above`, low: w[0] }),
			below: w => ({ field: `updatedAt`, form: `below`, high: w[0] }),
			atLeast: w => ({ field: `updatedAt`, form: `atLeast`, low: w[0] }),
			atMost: w => ({ field: `updatedAt`, form: `atMost`, high: w[0] })
		};
		const numbers = { is: [20], between: [10, 20], above: [10], below: [20], atLeast: [20], atMost: [11] };
		for (const row of forms) {
			const name = row[0];
			const expected = row[2].join(`,`);
			const rows = await AllSpeak_IDB_Core.getAll({
				db: opened.db,
				store: `routes`,
				where: bounds[name](numbers[name])
			});
			const got = rows.map(r => r.id).join(`,`);
			check(got === expected, `'where ${name}' gives ${expected || `nothing`} (got ${got})`);
		}
		let refused = ``;
		try {
			await AllSpeak_IDB_Core.getAll({
				db: opened.db,
				store: `routes`,
				where: { field: `notAnIndex`, form: `is`, low: 1 }
			});
		} catch (err) {
			refused = err.name;
		}
		check(refused === `NotFoundError`,
			`a field that is neither key path nor index is refused with NotFoundError (${refused})`);
	} catch (err) {
		check(false, `the where forms — ${err.message}`);
	}

	// 6. a failed batch writes nothing
	try {
		let refused = ``;
		try {
			await AllSpeak_IDB_Core.runBatch({
				db: opened.db,
				operations: [
					{ op: `put`, store: `routes`, value: { id: 30, updatedAt: 30 } },
					{ op: `put`, store: `steps`, value: { id: 1, routeId: 1 } },
					{ op: `add`, store: `routes`, value: { id: 30, updatedAt: 31 } }
				]
			});
		} catch (err) {
			refused = err.message;
		}
		check(/ConstraintError/.test(refused), `a batch whose second write fails reports it`);
		const visible = await AllSpeak_IDB_Core.get({ db: opened.db, store: `routes`, key: 30 });
		check(visible === undefined, `and none of its writes are visible`);
		const step = await AllSpeak_IDB_Core.get({ db: opened.db, store: `steps`, key: 1 });
		check(step === undefined, `in any store, including one that succeeded`);
	} catch (err) {
		check(false, `a failed batch — ${err.message}`);
	}

	// 6b. and a good batch is one transaction
	try {
		await AllSpeak_IDB_Core.runBatch({
			db: opened.db,
			operations: [
				{ op: `put`, store: `routes`, value: { id: 30, updatedAt: 30 } },
				{ op: `put`, store: `steps`, value: { id: 1, routeId: 7 } },
				{ op: `deleteWhere`, store: `steps`, where: { field: `routeId`, form: `is`, low: 0 } }
			]
		});
		check((await AllSpeak_IDB_Core.get({ db: opened.db, store: `routes`, key: 30 })) !== undefined,
			`a batch commits every write`);
		check((await AllSpeak_IDB_Core.get({ db: opened.db, store: `steps`, key: 1 })) !== undefined,
			`across stores`);
	} catch (err) {
		check(false, `a good batch — ${err.message}`);
	}

	// 7. a cursor walks in order and deletes the record it is on
	try {
		for (const id of [3, 4, 5]) {
			await AllSpeak_IDB_Core.put({ db: opened.db, store: `steps`, value: { id, routeId: 8 } });
		}
		const handle = await AllSpeak_IDB_Core.openCursor({
			db: opened.db,
			store: `steps`,
			where: { field: `routeId`, form: `is`, low: 8 },
			mode: `readwrite`
		});
		const seen = [];
		while (handle.cursor) {
			seen.push(handle.cursor.primaryKey);
			if (handle.cursor.primaryKey === 4) {
				await AllSpeak_IDB_Core.deleteCurrent(handle);
			}
			await AllSpeak_IDB_Core.advance(handle);
		}
		AllSpeak_IDB_Core.closeCursor(handle);
		check(seen.join(`,`) === `3,4,5`, `a cursor walks its range in order (${seen.join(`,`)})`);
		const left = await AllSpeak_IDB_Core.getAll({ db: opened.db, store: `steps` });
		check(left.map(row => row.id).join(`,`) === `1,3,5`,
			`'delete current' removes the record it is on (${left.map(row => row.id).join(`,`)})`);
	} catch (err) {
		check(false, `a cursor — ${err.message}`);
	}

	// 8. a blob round-trips
	try {
		const blob = new Blob([`abcdefg`], { type: `image/png` });
		await AllSpeak_IDB_Core.put({ db: opened.db, store: `photos`, value: blob, key: `p` });
		const back = await AllSpeak_IDB_Core.get({ db: opened.db, store: `photos`, key: `p` });
		check(back instanceof Blob, `a blob comes back as a blob`);
		check(back.size === 7 && back.type === `image/png`,
			`with its size and type (${back.size}, ${back.type})`);
	} catch (err) {
		check(false, `a blob round trip — ${err.message}`);
	}

	// 2. an upgrade keeps what was there
	try {
		AllSpeak_IDB_Core.close(opened.db);
		const upgraded = await AllSpeak_IDB_Core.open({
			name: `check1`,
			version: 2,
			schema: schema(2, base => {
				base.stores.push({ name: `outbox`, keyPath: `opId`, autoIncrement: false, indexes: [] });
				base.stores[0].indexes.push({
					name: `name`,
					keyPath: `name`,
					unique: false,
					multiEntry: false
				});
			})
		});
		const rows = await AllSpeak_IDB_Core.getAll({ db: upgraded.db, store: `routes` });
		check(upgraded.version === 2 && rows.length === 4,
			`an upgrade adds stores and indexes and keeps the records (${rows.length})`);
		const store = upgraded.db.transaction([`routes`]).objectStore(`routes`);
		check(Array.from(store.indexNames).includes(`name`), `the new index is there`);
		// Held only long enough to read the upgrade: a connection left open here would block the
		// next upgrade, which is what the versionchange case below is about.
		AllSpeak_IDB_Core.close(upgraded.db);
	} catch (err) {
		check(false, `an upgrade — ${err.message}`);
	}

	// 11. a versionchange closes the connection, and later commands say so
	try {
		let told = false;
		const held = await AllSpeak_IDB_Core.open({ name: `check1` });
		held.db.onversionchange = () => {
			told = true;
			held.db.close();
		};
		const raised = await AllSpeak_IDB_Core.open({
			name: `check1`,
			version: 3,
			schema: schema(3, base => {
				base.stores.push({ name: `outbox`, keyPath: `opId`, autoIncrement: false, indexes: [] });
				base.stores[0].indexes.push({
					name: `name`,
					keyPath: `name`,
					unique: false,
					multiEntry: false
				});
			})
		});
		check(told, `a newer version in another connection raises versionchange`);
		AllSpeak_IDB_Core.close(raised.db);
	} catch (err) {
		check(false, `versionchange — ${err.message}`);
	}

	// 10. a blocked upgrade answers rather than hanging
	try {
		const held = await AllSpeak_IDB_Core.open({ name: `check-blocked`, version: 1 });
		const started = Date.now();
		let refused = ``;
		try {
			await AllSpeak_IDB_Core.open({ name: `check-blocked`, version: 2, blockedMs: 150 });
		} catch (err) {
			refused = err.name;
		}
		const waited = Date.now() - started;
		check(refused === `BlockedError` && waited < 2000,
			`a blocked upgrade fails with BlockedError rather than hanging (${waited} ms)`);
		AllSpeak_IDB_Core.close(held.db);
	} catch (err) {
		check(false, `a blocked upgrade — ${err.message}`);
	}
};

// ---------------------------------------------------------------------------------------------
// 3. The vocabulary, through the real compiler and run loop
// ---------------------------------------------------------------------------------------------

const vocabulary = async () => {
	section(`The plugin, driven by a script`);

	// The spec's worked example, in its own shape: a declarative schema, an atomic save across
	// three stores, and a query. It is illustrative rather than complete, so it is run for its
	// commands rather than for a result.
	const worked = `
variable Route
variable RouteId
variable StepList
variable Step
variable Job
variable I
variable LowHash
variable HighHash
variable Nearby
idb database DB
idb batch SaveBatch
idb schema SherpaSchema version 1
idb store \`routes\` in SherpaSchema with key \`id\`
idb index \`updatedAt\` on \`routes\` in SherpaSchema
idb store \`steps\` in SherpaSchema with key \`id\`
idb index \`routeId\` on \`steps\` in SherpaSchema
idb index \`geohash\` on \`steps\` in SherpaSchema with multiple entries
idb store \`photos\` in SherpaSchema without key
idb store \`outbox\` in SherpaSchema with key \`opId\`
idb index \`nextAttemptAt\` on \`outbox\` in SherpaSchema
idb open \`check-worked\` as DB using SherpaSchema or gosub StorageFailed
put \`{"id":1,"updatedAt":10}\` into Route
put \`[{"id":11,"routeId":1},{"id":12,"routeId":1}]\` into StepList
put \`{"opId":"a1","nextAttemptAt":5}\` into Job
put 1 into RouteId
put \`a\` into LowHash
put \`z\` into HighHash
idb start batch SaveBatch on DB
idb put Route into \`routes\` of SaveBatch
idb delete from \`steps\` of SaveBatch where \`routeId\` is RouteId
put 0 into I
while StepList has element I
begin
    put element I of StepList into Step
    idb put Step into \`steps\` of SaveBatch
    add 1 to I
end
idb put Job into \`outbox\` of SaveBatch
idb commit SaveBatch or gosub SaveFailed
idb get all from \`steps\` of DB where \`geohash\` is between LowHash and HighHash into Nearby
print \`nearby \` cat the json count of Nearby
exit
StorageFailed:
print \`Could not open: \` cat the error
exit
SaveFailed:
print \`Could not save: \` cat the error
exit
`;
	try {
		const result = await execute(worked);
		check(result.out.some(line => line === `nearby 0`),
			`the spec's worked example runs (${result.out.join(` | `)})`);
	} catch (err) {
		check(false, `the spec's worked example runs — ${err.message}`);
	}

	// put, get, has, count, where — the round trip a script actually makes
	try {
		const result = await execute(`
variable Row
variable Found
variable Total
idb database DB
idb schema S version 1
idb store \`routes\` in S with key \`id\`
idb open \`check-script\` as DB using S or gosub Fail
idb put \`{"id":1,"name":"one"}\` into \`routes\` of DB
idb get Row from \`routes\` of DB with key 1
print Row
idb has \`routes\` of DB with key 1 into Found
print \`has \` cat Found
idb has \`routes\` of DB with key 2 into Found
print \`has \` cat Found
idb count \`routes\` of DB into Total
print \`count \` cat Total
exit
Fail:
print \`FAILED \` cat the error
exit
`);
		check(result.out.includes(`has true`), `'idb has' answers true for a record`);
		check(result.out.includes(`has false`), `and false for a missing one`);
		check(result.out.includes(`count 1`), `'idb count' counts`);
		check(result.out.some(line => line.includes(`"name": "one"`)),
			`'idb get' fills its variable with the record`);
	} catch (err) {
		check(false, `put, get, has and count — ${err.message}`);
	}

	// a batch is atomic through the script's own words
	try {
		const result = await execute(`
variable Total
idb database DB
idb batch Batch
idb schema S version 1
idb store \`routes\` in S with key \`id\`
idb open \`check-atomic\` as DB using S or gosub Fail
idb start batch Batch on DB
idb add \`{"id":1}\` to \`routes\` of Batch
idb add \`{"id":1}\` to \`routes\` of Batch
idb commit Batch or gosub Expected
print \`NO FAILURE\`
exit
Expected:
print \`refused\`
idb count \`routes\` of DB into Total
print \`count \` cat Total
exit
Fail:
print \`FAILED \` cat the error
exit
`);
		check(result.out.includes(`refused`), `a failing batch reaches its failure clause`);
		check(result.out.includes(`count 0`), `and leaves the store empty`);
	} catch (err) {
		check(false, `a failing batch — ${err.message}`);
	}

	// cursor, through the script
	try {
		const result = await execute(`
variable Job
variable Jobs
variable Left
variable Key
variable StoreKey
variable Version
variable DbName
idb database DB
idb cursor C
idb schema S version 1
idb store \`outbox\` in S with key \`opId\`
idb index \`nextAttemptAt\` on \`outbox\` in S
idb open \`check-cursor\` as DB using S or gosub Fail
put the version of DB into Version
put the name of DB into DbName
print \`db \` cat Version cat \` \` cat DbName
idb put \`{"opId":1,"nextAttemptAt":1}\` into \`outbox\` of DB
idb put \`{"opId":2,"nextAttemptAt":2}\` into \`outbox\` of DB
idb put \`{"opId":3,"nextAttemptAt":99}\` into \`outbox\` of DB
set Jobs to array
idb scan C in \`outbox\` of DB for update where \`nextAttemptAt\` is below 50
while C is open
begin
    put the record of C into Job
    put the key of C into Key
    put the primary key of C into StoreKey
    print \`at \` cat Key cat \` \` cat StoreKey
    json add Job to Jobs
    idb delete current C
    idb advance C
end
idb close C
print \`jobs \` cat the json count of Jobs
idb count \`outbox\` of DB into Left
print \`left \` cat Left
if C is not open print \`cursor closed\`
idb close DB
if DB is not open print \`db closed\`
exit
Fail:
print \`FAILED \` cat the error
exit
`);
		check(result.out.includes(`db 1 check-cursor`),
			`'the version of DB' and 'the name of DB' read the connection`);
		check(result.out.includes(`at 1 1`) && result.out.includes(`at 2 2`),
			`'the key of C' and 'the primary key of C' read the cursor`);
		check(result.out.includes(`jobs 2`), `a cursor walks the records its where names`);
		check(result.out.includes(`left 1`), `and deletes each one as it goes`);
		check(result.out.includes(`cursor closed`), `'C is not open' answers after a close`);
		check(result.out.includes(`db closed`), `and 'DB is not open' after the database closes`);
	} catch (err) {
		check(false, `a cursor through the script — ${err.message}`);
	}

	// the two clause forms differ in what happens afterwards
	try {
		const stopped = await execute(`
variable Estimate
idb database DB
idb open \`check-nothing\` as DB
idb delete database \`check-nothing\`
idb estimate storage into Estimate or print \`or ran\`
print \`SHOULD NOT PRINT\`
`, { finishWhen: out => out.some(line => line === `or ran`) });
		check(stopped.out.includes(`or ran`), `'or' runs its clause`);
		check(!stopped.out.includes(`SHOULD NOT PRINT`), `and ends the thread`);
	} catch (err) {
		check(false, `an 'or' clause — ${err.message}`);
	}
	try {
		const continued = await execute(`
variable Estimate
variable After
idb database DB
idb open \`check-nothing\` as DB
idb delete database \`check-nothing\`
idb estimate storage into Estimate on failure put 7 into After
print \`after \` cat After
exit
`);
		check(continued.out.includes(`after 7`), `'on failure' runs its clause and carries on`);
	} catch (err) {
		check(false, `an 'on failure' clause — ${err.message}`);
	}

	// the failure sentence names the operation
	try {
		const result = await execute(`
variable Row
idb database DB
idb schema S version 1
idb store \`routes\` in S with key \`id\`
idb open \`check-error\` as DB using S
idb get Row from \`nowhere\` of DB with key 1 on failure print the error
exit
`);
		check(result.out.some(line => line.startsWith(`IndexedDB get failed:`)),
			`a failure names the operation and the DOMException (${result.out[0]})`);
	} catch (err) {
		check(false, `a failure sentence — ${err.message}`);
	}

	// a blob handle holds a blob and nothing else does
	try {
		const program = compile(`
variable Size
variable Whole
file PhotoInput
idb blob Photo from file PhotoInput
idb blob Stored
put the byte size of Photo into Size
print Size
`);
		takePrinted();
		failedAlerts();
		const input = symbolRecord(program, `PhotoInput`);
		input.element = [{ files: [new Blob([`12345`], { type: `image/png` })] }];
		// Held before the run: `exit` empties the program's own properties, so the record has to
		// be reached while it is still there.
		const handle = symbolRecord(program, `Photo`);
		AllSpeak.scripts[program.script] = program;
		program.running = true;
		program.run(0);
		await new Promise(resolve => setTimeout(resolve, 30));
		const out = takePrinted();
		check(out.includes(`5`), `'idb blob B from file F' wraps the file chosen (${out.join(` | `)})`);
		check(handle.blob instanceof Blob, `the handle holds the blob itself`);
	} catch (err) {
		check(false, `a blob from a file input — ${err.message}`);
	}

	// a read is a read, and a blob is the one thing that cannot travel as a variable
	try {
		const result = await execute(`
variable Whole
idb database DB
idb schema S version 1
idb store \`photos\` in S without key
idb open \`check-read\` as DB using S
idb put \`[1,2]\` into \`photos\` of DB with key \`k\`
idb get Whole from \`photos\` of DB with key \`k\`
print Whole
exit
`);
		check(result.out.some(line => line.includes(`[`)),
			`a JSON record read into a variable is the JSON it was chosen with`);
	} catch (err) {
		check(false, `a JSON record read into a variable — ${err.message}`);
	}

	// A blob handle has no `empty`, so a read that finds nothing is the one read that fails.
	try {
		const result = await execute(`
idb database DB
idb blob Missing
idb schema S version 1
idb store \`photos\` in S without key
idb open \`check-missing\` as DB using S
idb get Missing from \`photos\` of DB with key \`nope\` on failure print \`no blob\`
print \`SHOULD NOT PRINT\`
exit
`);
		check(result.out.includes(`no blob`),
			`a missing blob reaches the failure clause rather than filling the handle`);
	} catch (err) {
		check(false, `a missing blob — ${err.message}`);
	}

	// The one value a variable cannot hold. The blob is attached to the handle after compilation
	// because a real one arrives from a file input, which is a browser's to fill.
	try {
		const program = compile(`
variable Whole
idb database DB
idb blob Photo
idb schema S version 1
idb store \`photos\` in S without key
idb open \`check-binary\` as DB using S
idb put Photo into \`photos\` of DB with key \`p\`
idb get Whole from \`photos\` of DB with key \`p\`
print \`SHOULD NOT PRINT\`
exit
`);
		takePrinted();
		failedAlerts();
		symbolRecord(program, `Photo`).blob = new Blob([`binary`], { type: `image/png` });
		AllSpeak.scripts[program.script] = program;
		program.running = true;
		program.run(0);
		await new Promise(resolve => setTimeout(resolve, 60));
		const out = takePrinted();
		const said = failedAlerts().join(` `);
		check(!out.includes(`SHOULD NOT PRINT`) && /blob/i.test(said),
			`reading a blob into a variable is refused, and says why`);
	} catch (err) {
		check(false, `reading a blob into a variable — ${err.message}`);
	}
};

// ---------------------------------------------------------------------------------------------

(async () => {
	await core();
	await vocabulary();
	say(`\n${checks} checks, ${checks - failures} passed, ${failures} failed`);
	process.exit(failures ? 1 : 0);
})().catch(err => {
	console.error(`\nidb-check: ${err && err.stack ? err.stack : err}`);
	process.exit(1);
});
