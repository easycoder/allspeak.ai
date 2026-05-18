# JSON

AllSpeak treats JSON as a first-class concept rather than a string-handling chore. Most scripts that need to read or write JSON do not call a `stringify` or `parse` step explicitly — the surrounding commands do it for them, based on the type of the value. This page collects the rules so you don't have to discover them keyword-by-keyword.

## Writing JSON

The two main paths are `save` for whole-value writes and `append … to json file` for incremental writes.

### `save Var to <path>` — auto-encodes dict and list

The Python runtime's `save` inspects the type of its content. If it is a `dict` or `list`, the value is serialised with `json.dumps` before writing; if it is a string, it is written verbatim.

```
variable Rows
list Rows
! ... populate Rows ...
save Rows to `data/2024-25/04.json`
```

JSON output is **pretty-printed by default** (two-space indentation) so saved files can be opened directly for human examination. This applies to two paths:

- **Auto-encoded dict or list.** The serialiser uses `indent=2`, regardless of the file path.
- **String content saved to a `.json` path.** If the content is already a JSON string (e.g. the request body of a POST to `server.as`'s `/write/<file>` endpoint, which is written verbatim by `save`), it is parsed and re-emitted with `indent=2`. If the string fails to parse as JSON, it is written verbatim — non-JSON content in a `.json` file is left alone rather than crashing the save.

The file extension is a documentation convention for *encoding* — a dict or list saved to a file with no extension is still encoded as JSON; a non-JSON string saved to `report.json` is still written verbatim — but for *formatting*, the `.json` extension does trigger the pretty-print pass on string content.

### `append Item to json file <path>` — incremental array append

```
append NewRow to json file `data/2024-25/04.json`
```

Reads the existing array, appends `Item`, writes back. Creates the file (containing a single-element array) if it does not exist. Use this when you want to stream rows into a file without holding the whole list in memory.

The file must contain a JSON array — appending to an object file raises a runtime error.

### Parent directories are created automatically

`save Var to data/2024-25/04.json` creates `data/` and `data/2024-25/` on demand if they don't already exist. No `create directory` step is needed first — that command remains available for cases where you want to create a directory without writing anything to it. (Use it sparingly: explicit `create directory` is rarely necessary now that `save` handles its own tree.)

## Reading JSON

### `load Var from <path>` — reads as a string

`load` reads the file contents verbatim and stores the result as a string. It does *not* parse JSON, regardless of file extension.

```
variable Text
load Text from `data/2024-25/04.json`
```

`Text` is now the raw file contents.

### `json of <string>` — parses into dict or list

To turn the loaded string into a usable value, take its `json of`:

```
variable Text
variable Rows
load Text from `data/2024-25/04.json`
put json of Text into Rows
```

`Rows` is now a dict or a list (depending on the top-level JSON shape) and can be indexed, iterated, or counted with the usual array/dictionary commands.

If the input isn't valid JSON, `json of` yields an empty value rather than raising — wrap subsequent code in an `if Rows is empty` guard if you can't trust the source.

## Reformatting JSON text

Two value modifiers operate on JSON strings without touching dicts or lists:

- `stringify Text` — re-emits as compact JSON (no whitespace). Useful for normalising a hand-written or pretty-printed payload before transmission.
- `prettify Text` — re-emits with 4-space indentation. Useful for writing human-readable config files.

Both expect their input to already be a valid JSON string. To pretty-print a dict or list directly, save it (which compact-encodes), reload it, then prettify; or pass it through `stringify` after a save/load round-trip.

## JS trap: `put V into X` replaces the slot

On the JS side, `set X to array` initialises the cursor slot to `[]`. A subsequent `put Row into X` *replaces* the slot — the array wrapper is lost, and only `Row` is left in the slot. `rest post X` then sends `Row`, not `[Row]`.

```as
! WRONG
variable Bucket
set Bucket to array
index Bucket to 0
put Row into Bucket            ! slot is now Row; the [] is gone
rest post Bucket to URL        ! posts Row, not [Row]
```

This is not a bug — `put V into X` writes V into the cursor slot exactly as if X had been an unused variable; the runtime does not give arrays in slots any privileged treatment. To grow the array held in the slot, use the array-aware keyword:

```as
! RIGHT
variable Bucket
set Bucket to array
json add Row to Bucket         ! slot is now [Row]
rest post Bucket to URL        ! posts [Row]
```

See [collections](04-collections.md) for the longer explanation of why the cursor model and `set X to array` are independent layers that don't compose with `put`.

## Cross-runtime notes

The same surface vocabulary works on both runtimes, but the runtime-side details differ:

- **JS browser side**: `rest get`/`rest post` handle JSON automatically — the response body of an `application/json` reply is parsed before being placed in the target variable, and a dict/list target is JSON-encoded as the request body. The dedicated `json` keyword family (`json add`, `json delete`, `json sort` …) provides in-place manipulation.
- **Python side**: There is no `rest` keyword family today; HTTP I/O on the Python side goes through `get from url`, `download`, and the `server` plugin's request handlers. Those server-plugin handlers auto-encode the return value, so `return Rows to Files` ships JSON when `Rows` is a dict or list.

Write scripts that need to work on both runtimes against the `save`/`load`/`json of` core and leave HTTP I/O to one runtime or the other.

## When NOT to use JSON files

JSON is the obvious format for structured data, but:

- For configuration that humans edit by hand, consider whether a Webson `.json` (see [Browser and Webson](14-browser-and-webson.md)) is a better fit — it can include comments via `#doc` keys and supports component reuse via `$Name`.
- For tabular data with millions of rows, JSON is slow to parse and bulky to store; treat it as a stepping-stone rather than the long-term format.
- For inter-process messages over MQTT, the JS runtime already auto-encodes the payload (see [MQTT pub/sub](../idioms/07-mqtt-pubsub.md)) — don't double-encode by stringifying first.
