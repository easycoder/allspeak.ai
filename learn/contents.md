# AllSpeak curriculum

A practical guide to writing idiomatic AllSpeak. Two tiers:

- **Reference** answers *what is this thing in AllSpeak?* — symbols, variables, control flow, modules. Stable, encyclopedic.
- **Idioms** answers *how do I do X the AllSpeak way?* — patterns with worked examples and explicit anti-patterns.

## Reference

1. [Structure](reference/01-structure.md) — domains, the compiler-tries-each-domain model, how plugins extend vocabulary.
2. [Symbols and layout](reference/02-symbols-and-layout.md) — the four punctuation symbols; doc-block markers; indenting and naming.
3. [Variables and arrays](reference/03-variables-and-arrays.md) — the cursor model; scratch variables; `variable` vs typed.
4. [Collections](reference/04-collections.md) — arrays, dictionaries, lists, properties; JS/Python divergence.
5. [Values and types](reference/05-values-and-types.md) — numbers, strings, booleans; automatic conversion.
6. [Conditions](reference/06-conditions.md) — equality, comparison, presence; combining with `and` / `or`.
7. [Arithmetic](reference/07-arithmetic.md) — integer-first model; scaled-integer pattern; trigonometry.
8. [Strings and text](reference/08-strings-and-text.md) — `length of`, slicing, `position of`, `replace`.
9. [Control flow](reference/09-control-flow.md) — `if`, `while`, `gosub`, `stack`, `stop`, `exit`.
10. [Errors and recovery](reference/10-errors-and-recovery.md) — `or` (stop) vs `on failure` (continue).
11. [Cooperative multitasking](reference/11-cooperative-multitasking.md) — `fork`, `wait`, never-interrupted-mid-statement.
12. [Modules](reference/12-modules.md) — `run`, `release parent`, message passing.
13. [Plugins](reference/13-plugins.md) — the contract; the mixed-stack performance principle.
14. [Browser and Webson](reference/14-browser-and-webson.md) — DOM types, `attach`, the Webson layout dialect.
15. [Multilingual](reference/15-multilingual.md) — the `language` directive and the pack model.
16. [Doc blocks](reference/16-doc-blocks.md) — the `!!` / `!!!` convention; `asdoc-check`.

## Idioms

1. [`cat` and string building](idioms/01-cat-and-string-building.md) — infix `cat`, template patterns, greedy-parsing gotcha.
2. [Event handlers and array index](idioms/02-event-handlers-and-array-index.md) — single handler for an array of elements.
3. [Looping patterns](idioms/03-looping-patterns.md) — `while` vs label-driven loops.
4. [Picking a collection shape](idioms/04-picking-a-collection-shape.md) — variable-array vs dict vs list vs property.
5. [Floats and scaled integers](idioms/05-floats-and-scaled-integers.md) — fractional precision without floats.
6. [REST and async](idioms/06-rest-and-async.md) — `rest get`, failure clauses, yielding while waiting.
7. [MQTT pub/sub](idioms/07-mqtt-pubsub.md) — the connection block, dict-shaped payloads, request/reply.
8. [Webson and AS separation](idioms/08-webson-and-as-separation.md) — layout in `.json`, logic in `.as`.
9. [Extracting a module](idioms/09-extracting-a-module.md) — when and how to split a script.
10. [Writing language-neutral](idioms/10-writing-language-neutral.md) — what the language pack doesn't translate.
11. [Debugging .as](idioms/11-debugging-as.md) — `print`, `log`, tracer, `dummy`.
12. [Working with AI](idioms/12-working-with-ai.md) — the AI-writes / human-reviews workflow.
