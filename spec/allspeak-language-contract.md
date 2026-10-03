# AllSpeak Language Contract

Status: Draft 0.1

This document is the normative contract for AllSpeak behavior across implementations.

## 1. Scope

This contract currently covers:
- Core scalar variables and assignment.
- Arithmetic expressions (`add`, `take`, `multiply`, `divide`) for numeric values.
- Conditional branching (`if ... begin ... end`).
- `while ... begin ... end` loops.
- String output behavior (`log`, and equivalent output commands where supported).
- Attributes (`@`), and the promise that they change nothing about a run.

This contract does not yet standardize browser-only commands, DOM interactions, or transport plugins.

## 2. Behavioral Rules

1. Variables are dynamically typed and globally visible within a script runtime context.
2. `set` and `put` must write deterministic values that are immediately readable by following statements.
3. Numeric commands must use base-10 semantics.
4. `while` loop closure form is `end` (not `end while`).
5. Conditions evaluate using AllSpeak comparison semantics (`is`, `is greater than`, `is less than`).
6. Output commands (such as `log`) emit one logical output record per command, preserving order.
7. Compound conditions support `and` (higher precedence) and `or` (lower precedence).
8. The `includes` condition tests whether a string contains a substring.
9. The `starts with` and `ends with` conditions test string prefix and suffix respectively.
10. The `uppercase` and `lowercase` conditions test the case of a text value. A value satisfies either test only when it holds at least one cased letter and every cased letter is in that case, so `ABC-123` is uppercase while `Hello`, `123` and an empty value satisfy neither, and values that cannot be cased (numbers, booleans, null) satisfy neither. `is upper case` and `is lower case` are accepted spellings of `is uppercase` and `is lowercase`.
11. An attribute is introduced by `@` at the start of a token, outside a literal, and its value is everything between that `@` and the end of the line or a `!` comment, whichever comes first, with surrounding whitespace removed. The runtime does not parse the value — a tool that wants a key and a value apart splits them itself — and the syntax is not translated, because `@` is not a word in any language.
12. An attribute written on the same line as a statement belongs to that statement, and the compiled element the statement becomes carries it in an `attr` field whose value is the attribute's text.
13. A line holding only an attribute, and a statement that compiles to no element of its own (a label), carry their attribute in an element of their own, which the runtime steps over. Where a label has an element, the attribute is on the one the label addresses, so following the label finds it.
14. Attributes do not affect behavior. Running a script and running the same script with its attributes removed must produce identical output, and a runtime must run an attributed script with no tool that reads attributes loaded.

## 3. Error Contract (Initial)

Implementations may differ in exact message text, but must expose:
- Error category (`compile` or `runtime`).
- Source location when available (line number preferred).
- Human-readable explanation.

## 4. Compatibility Targets

A runtime is considered compatible with Spec 0.1 when:
- It passes all `required` conformance tests for Spec 0.1.
- Any `optional` test failures are documented.

## 5. Test Mapping

Every conformance test case includes:
- Stable test id (`EC-xxxx`).
- Script source.
- Expected result (stdout and/or structured error).
- Requirement links back to this contract.
