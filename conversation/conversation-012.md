# 2026-08-20

## 16:01

I have a feature request for a testing vocabulary. Can you look at the following and if possible, implement it in both versions.
~/dev/rbr/doc/PROPOSAL-allspeak-testing.md.
Any questions - please ask.

**Assistant**

Implemented Phase 1 of the testing vocabulary in both runtimes (JS + Python). Scope confirmed with the user: Phase 1 only; JS gets vocabulary + summary via a runtime flag (no node-runner changes).

What was added (both runtimes, bit-identical parity verified):
- `check [that] <condition>` — asserts a condition, logs `FAIL: <condition> (<script>:<line>)` on failure and continues; works in non-test mode too.
- `check ... or <action>` (record failure, run action, end the test block) and `check ... on failure <action>` (record failure, run action, continue).
- `test <name> ... end test` — named case; body is any statements; nesting forbidden at compile time.
- `--test <file|dir>` runner mode in the Python CLI: per-suite summary + aggregate line for directories, exit codes 0/1/2 (0 = all passed, 1 = failures/errored tests, 2 = script broke). Error isolation: an unhandled runtime error inside a test block marks the case errored and skips to the next block.
- JS: `AllSpeak.testMode = true` before `AllSpeak.start(...)` enables the same summary via the debug console.

Files: js/allspeak/{Core,Main,Run,Compile,Opcodes}.js, allspeak-py/allspeak/{as_core,as_program,as_classes,as_condition}.py, 4 language packs + synced JSONs, spec/opcodes.json, conformance EC-0011..14 (+ index.json), learn/reference/19-testing.md (+ contents.md), rebuilt deploy/dist.

Key mechanisms:
- Test blocks compile to `test → body → endTest → testError` with fixup pcs; onError routed to testError in test mode only; `or`-bail jumps to endTest so the case is finalized and onError restored.
- JS runtimeError had a dead onError-routing branch (`this.program` was always undefined when called on a program) — fixed it and made the run loop break on `errorRouted` so the rest of a failing block is skipped. Python's flush loop mirrors that with an `errorRouted` flag; a raised/re-wrapped RuntimeError after routing keeps the original message.
- Condition parsers (both) now rewind a failed `or` right-side so `check ... or <action>` is disambiguated from compound conditions.
- Python end-of-script hang fixed (running=False at natural end; scripts without `exit` now terminate cleanly — pre-existing bug, matches JS).

Notes:
- Pre-existing gaps surfaced by the conformance suite, not regressions: `string`/`char` vocabulary missing (EC-0007/0008/0009 fail in Python; 0007/0009 in JS); Python `add` on non-numeric is lenient where JS errors; Python `convert` missing. JS `try ... or handle` is broken in both runtimes (vestigial; not documented).
- Parity caveat: the FAIL line uses the script name (from `script <name>`), so conformance tests set it; the errored-case conformance test isn't possible cross-runtime because the two runtimes error on different inputs (divide-by-zero errors only in Python; non-numeric add only in JS) — errored isolation verified per-runtime instead.
- The Python package is installed as a copy in site-packages; `allspeak --test` requires reinstalling (`pip install allspeak-py/` or `-e`).

## 20:52

Have you updated the learn/ documents?

**Assistant**

Follow-up on learn/ docs. Initial answer: I had created learn/reference/19-testing.md and added the English contents.md entry — but the user's question exposed a real omission: learn/manifest.json (the reader's page list for prev/next navigation and slug resolution) did not include the new page, so the reader couldn't reach it. Fixed that, then — per the user's choice — translated the page into de/fr/it and registered it in each localized tree (manifest.json + contents.md).

While validating the translated examples against the Python runtime (PYTHONPATH), several pre-existing issues surfaced and the examples were corrected:
- Undeclared variables in conditions/put are compile errors in both runtimes — all doc examples now declare variables before use.
- `has entry` / membership conditions need a proper map — removed those examples.
- fr `inférieur à` and it compound `e` (and) conditions are broken in the Python runtime (pre-existing i18n gaps) — dropped those from the fr/it docs; de compound `und` verified working.
- fr `put ... into le <var>` (article) not accepted — removed the article.
- No single statement raises a runtime error on BOTH runtimes (divide-by-zero only Python, non-numeric add only JS) — the isolation example keeps divide-by-zero and now carries an honest note about the JS difference.
- The "the error" value forms follow the existing translated docs: de `der fehler`, fr `le erreur`, it `l errore`.

Verified by compiling the exact final example blocks per language under the Python runtime with `language deutsch/français/italiano`, and the English block on both runtimes (0 FAIL lines = all pass).
