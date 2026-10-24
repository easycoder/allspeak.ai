# IndexedDB (`idb`)

The `idb` plugin gives a script the browser's own database: persistent, transactional, origin-scoped storage for records and binary files. It is what to reach for when data has to survive the tab being closed — offline records, a write queue that drains when the network returns, a local cache, or a photo kept as a photo rather than base64 stuffed into a field.

It is a **browser** plugin. The Python runtime has no IndexedDB, so a script that uses `idb` runs in the browser and nowhere else.

## Loading it

Two files, and the core comes first:

```html
<script src="https://allspeak.ai/dist/allspeak.js"></script>
<script src="https://allspeak.ai/dist/plugins/idb-core.js"></script>
<script src="https://allspeak.ai/dist/plugins/idb.js"></script>
<script>AllSpeak_Startup();</script>
```

`idb-core.js` is the database half and `idb.js` is the vocabulary; neither does anything on its own. The order matters: loaded the other way round, the vocabulary has no core to call, and the first `idb` command fails.

## The shape of a script

A database, a cursor, a batch and a blob are all **declared symbols**, like a `div` or a `gmap`. Declaring one says what it is; the command that opens or creates it fills it in. Store names are **string values in backticks**, so a store can also be named by a variable.

A schema is built in memory first, and applied by `idb open`:

```as
variable Route
variable Nearby
idb database DB
idb schema Sherpa version 1
idb store `routes` in Sherpa with key `id`
idb index `updatedAt` on `routes` in Sherpa
idb open `sherpa` as DB using Sherpa
```

The `idb store` / `idb index` lines touch nothing — they describe a shape. `idb open` is what creates the database, or upgrades it, or checks it.

**The snippets on this page show the commands, not a whole script.** The variables and handles they name are assumed to be declared above them, the way the example above declares `DB`; a file input is declared with `file <name>`, the other handles as shown.

| Command | Meaning |
|---|---|
| `idb open <name> as <DB> [using <S>]` | Open a database, creating, upgrading or checking it |
| `idb close <DB>` | Close it, and any cursors opened from it |
| `idb delete database <name>` | Delete it and everything in it |

Without `using`, an existing database is opened at its current version and a missing one is created at version 1 with no stores — which is fine for a scratch database and wrong for one whose shape you manage.

## Schema and upgrades

| Command | Meaning |
|---|---|
| `idb schema <S> version <N>` | An empty schema at version `N` |
| `idb store <name> in <S> with key <path>` | A store keyed by a field of the record |
| `idb store <name> in <S> with key <path> and auto increment` | The same, with a generated key |
| `idb store <name> in <S> without key` | A store whose key is supplied on each write |
| `idb index <name> on <store> in <S>` | An index (its key path is its name) |
| `idb unique index <name> on <store> in <S>` | An index that refuses duplicates |
| `idb index <name> on <store> in <S> with multiple entries` | An index over an array field |
| `idb drop store <name> from <S>` | Delete a store during the upgrade |
| `idb drop index <name> from <store> in <S>` | Delete an index during the upgrade |

The version is the whole of the upgrade story:

- **No database yet** — created at the schema's version, with every store and index.
- **At a lower version** — upgraded: new stores and indexes are created, drops are applied, and existing records are left alone.
- **At the same version** — opened, and the declared shape is *checked* against the real one. A mismatch fails the open and tells you to bump the version. Silently going along with it is how a version number stops meaning anything.
- **At a higher version** — `idb open` fails with `VersionError`.
- **Another tab holding an old connection** — the upgrade is blocked, and `idb open` fails with `BlockedError` after two seconds rather than hanging. Close the other tab.

**Only the structure migrates; there is no data-transform step.** A version can add and remove stores and indexes, and it cannot rewrite a record. To change how records are shaped, open the database at the old version, read the records, write them back in the new shape, and bump the version for the structural change.

## Reading and writing

```as
idb put Route into `routes` of DB
idb put Route into `photos` of DB with key PhotoKey
idb add Job to `outbox` of DB giving Key
```

- **`put`** inserts or replaces. **`add`** inserts only — a duplicate key fails with `ConstraintError`, which is what you want when a duplicate is a bug rather than an update.
- **`with key`** supplies an out-of-line key. It is required for a store declared `without key` and refused for a store with a key path, where the key comes from the value.
- **`giving`** receives the key that was actually written, including a generated one.
- A write completes when its **transaction** commits, not when the request answers — so a `put` that returns has been saved.

```as
idb get Route from `routes` of DB with key RouteId
idb get first from `routes` of DB where `updatedAt` is at least Since into Route
idb get all from `routes` of DB where `routeId` is RouteId into Steps
idb has `routes` of DB with key RouteId into Found
idb count `routes` of DB where `updatedAt` is below now into Due
```

`get` sets its variable to `empty` when the record is not there; it does not fail. `has` is how you tell "missing" from "present but null". `get all` fills a variable with a JSON array in key order.

```as
idb delete from `routes` of DB with key RouteId
idb delete from `outbox` of DB where `nextAttemptAt` is below now
idb clear `routes` of DB
idb delete database `sherpa`
```

`idb delete database` is irreversible, and it is blocked while any connection is open — including one in this script — so close `DB` first.

## `where`

A `where` names a field and one of six ranges:

| Form | Range |
|---|---|
| `where <field> is <value>` | exactly `<value>` |
| `where <field> is between <low> and <high>` | inclusive at both ends |
| `where <field> is above <low>` | above `<low>`, exclusive |
| `where <field> is below <high>` | below `<high>`, exclusive |
| `where <field> is at least <low>` | `<low>`, inclusive |
| `where <field> is at most <high>` | `<high>`, inclusive |

The field must be the store's **key path** or one of its **indexes**. Anything else fails with `NotFoundError`. There is no implicit full scan: a field worth querying on is worth an index, and the error says so.

**The comparison is IndexedDB's, not AllSpeak's.** Numbers sort numerically, strings by UTF-16 code units, and a mixed range follows IndexedDB's key-type order. This is the one place where the language's own text comparison does not apply, and it follows from keys being typed: `` `42` `` and `42` are different keys, in different places in the order.

## Batches: several writes, one transaction

An IndexedDB transaction commits as soon as it has no request pending — and every command here waits for its own request. So a `begin … commit` block around two writes would commit after the first. A **batch** is the answer: it records writes in memory and issues them together.

```as
idb batch Save
idb start batch Save on DB
idb put Route into `routes` of Save
idb delete from `steps` of Save where `routeId` is RouteId
idb put Job into `outbox` of Save
idb commit Save or gosub SaveFailed
```

`commit` opens one transaction over every store the batch named and runs the operations in order. **If any one fails, the transaction aborts and nothing is written** — the previous route is still there. `idb abort Save` discards the list without writing anything.

Two rules are worth knowing before you reach for a batch:

- **`giving` is not available inside one.** The key is not written until `commit`, so there is nothing to give yet. Use `with key`, or a direct `idb put` when the generated key is needed immediately.
- **The writes into a batch cannot fail.** They record a description and move on; it is `commit` that can, and it is the line that takes the failure clause.
- **Reads are not part of a batch.** A batch is for writes; reads and cursors cover the rest.

Store and index names are resolved when `commit` opens its transaction, not when the line is written — so a misspelt store fails the commit, and writes nothing.

## Cursors

For a large store, or for changing records in place, a cursor walks the records without materialising them all.

```as
variable Job
idb cursor C
idb scan C in `outbox` of DB for update where `nextAttemptAt` is below now
while C is open
begin
    put the record of C into Job
    idb delete current C
    idb advance C
end
idb close C
```

| Command | Meaning |
|---|---|
| `idb scan <C> in <store> of <DB> [for update] [where …]` | Open a cursor on the first match |
| `idb advance <C>` | Move to the next record |
| `idb delete current <C>` | Delete the record the cursor is on |
| `idb update current <C> with <value>` | Replace the record the cursor is on |
| `idb close <C>` | End the cursor |

`for update` asks for a writable transaction; without it, `delete current` and `update current` fail. `the key of C` is the index key for a cursor on an index, `the primary key of C` is always the store key, and `the record of C` is the record itself.

**A cursor holds a live transaction, so keep the loop tight.** Do not `wait`, fetch, or ask the user anything while it is open — each of those returns to the event loop and the transaction is gone. Read what you need into variables, close the cursor, then upload or draw. Close it on every path, including failure, and read its values only while `C is open`.

## Blobs

IndexedDB stores `Blob` and `File` values directly, which is why it is the right place for photos.

```as
file PhotoInput
idb blob Photo from file PhotoInput
idb put Photo into `photos` of DB with key PhotoKey

idb blob Stored
idb get Stored from `photos` of DB with key PhotoKey or gosub PhotoMissing
put the blob url of Stored into Url
set attribute `src` of Preview to Url
```

A blob cannot travel as an ordinary value. Reading one into a variable is refused, and a read into a blob handle that finds nothing fails — there is no `empty` blob — which is why the example above has a failure clause. `idb release Stored` revokes the object URL when the picture is no longer shown.

## Storage API

These three are about the whole origin rather than one database:

```as
idb estimate storage into Estimate
idb request persistence into Granted
idb check persistence into Protected
```

`Estimate` is an object with `usage` and `quota`, in bytes. `request persistence` asks the browser to protect the origin's data from automatic eviction; `check persistence` reports whether it already is. Persistent mode does not protect against the user clearing site data.

## Values and conditions

| Expression | Result |
|---|---|
| `the key of C` | The cursor's current key |
| `the record of C` | The cursor's current record |
| `the primary key of C` | The store key at the cursor |
| `the byte size of B` | A blob's size |
| `the mime type of B` | A blob's MIME type |
| `the blob url of B` | An object URL for the blob, made on first use |
| `the version of DB` | The connection's version |
| `the name of DB` | The connection's name |

`if DB is open` and `if C is open` work, with `not`.

## Failures

Every command that touches the database is fail-capable, in the same two forms as `rest`:

```as
idb open `sherpa` as DB using Schema or gosub OpenFailed
idb commit Save on failure print `Could not save: ` cat the error
```

`or` runs the clause and ends the thread; `on failure` runs it and carries on. With no clause, a failure is a runtime error and the thread stops. `the error` begins with the operation and the DOMException's name:

```
IndexedDB put failed: QuotaExceededError: …
```

The names worth knowing: `VersionError` (the schema is behind the database), `BlockedError` (another tab holds it open), `QuotaExceededError` (no space), `ConstraintError` (`add` met a duplicate, or a unique index did), `NotFoundError` (no such store, index or field), `InvalidStateError` (the database is closed), `DataCloneError` (the value cannot be stored), `InvalidAccessError` (a key or range does not fit the store).

Commands that only rearrange what the script already knows cannot fail, and take no clause: the handle declarations, the schema lines, the writes recorded into a batch, `idb start batch`, `idb release`, `idb close` and `idb abort`.

## What is stored, and what comes back

- Objects and arrays are stored as their **parsed structure**, which is how a `variable` holds them. Reading one back gives the same structure.
- `empty` is stored as `null`, so a value round-trips predictably. A missing record and a stored `null` both read as `empty`; `idb has` tells them apart.
- Numbers stay numbers — a key that came out of the database can be added to.
- A stored blob comes back as a blob, and only into an `idb blob` handle.

## A worked example

```as
variable Route
variable RouteId
variable Step
variable StepList
variable I
variable Nearby

idb database DB
idb batch Save
idb schema Sherpa version 1
idb store `routes` in Sherpa with key `id`
idb index `updatedAt` on `routes` in Sherpa
idb store `steps` in Sherpa with key `id`
idb index `routeId` on `steps` in Sherpa
idb open `sherpa` as DB using Sherpa or gosub StorageFailed

! Build the route and two steps.
set Route to object
put 7 into RouteId
set property `id` of Route to RouteId
set property `name` of Route to `Morning loop`
set StepList to array
set Step to object
set property `id` of Step to 71
set property `routeId` of Step to RouteId
json add Step to StepList
set Step to object
set property `id` of Step to 72
set property `routeId` of Step to RouteId
json add Step to StepList

! Save the route and its steps as one transaction.
idb start batch Save on DB
idb put Route into `routes` of Save
idb delete from `steps` of Save where `routeId` is RouteId
put 0 into I
while StepList has element I
begin
    put element I of StepList into Step
    idb put Step into `steps` of Save
    add 1 to I
end
idb commit Save or gosub SaveFailed

! Read the steps back for that route.
idb get all from `steps` of DB where `routeId` is RouteId into Nearby
print `steps saved: ` cat the json count of Nearby
exit

StorageFailed:
print `Could not open the database: ` cat the error
exit
SaveFailed:
print `Could not save the route: ` cat the error
```

Bumping `Sherpa` to version 2 is what makes the next `idb open` change the structure — a new `idb store` line, an `idb index` line, or an `idb drop`.

## Related

- [Plugins](plugins.md) — the contract, and which plugins have a page.
- [JSON](json.md) — the shape a `get all` result arrives in.
- [Errors and recovery](errors-and-recovery.md) — `or` against `on failure`.
