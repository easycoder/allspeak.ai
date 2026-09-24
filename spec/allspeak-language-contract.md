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
