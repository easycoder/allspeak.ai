# AllSpeak Conformance Tests

This folder contains implementation-neutral language tests.

Layout:
- `tests/`: canonical test scripts (`.allspeak`) and metadata (`.json`).
- `runner-contract.md`: shared runner input/output expectations.
- `parity-report-template.json`: report schema template.
- `parity-report.initial.json`: starter report before first execution.
- `run_conformance.py`: parity report generator from test metadata + optional actuals.
- `plugin-interface-matrix.json`: JS/Python plugin interface capability mapping.
- `ec_js_runner.js`: the JavaScript actuals producer. It loads the **built** bundle, so run
  `./build-allspeak` first — a runtime change is invisible to it until then.
- `as_py_runner.py` — the Python actuals producer, and it is the *one* file of this suite that
  lives elsewhere: `allspeak-py/conformance/as_py_runner.py`. Run it with
  `--conformance-root conformance` from the repository root so it reads *these* tests and not the
  older copy beside it in `allspeak-py/conformance/tests/`.
- `actuals-js-browser.json` and `actuals-python-cli.json`: the two records, one per implementation.
  Each is what its runner produced last; regenerate rather than edit.

Quick usage:
- `node conformance/ec_js_runner.js --dist-path deploy/dist/allspeak.js`
- `python3 allspeak-py/conformance/as_py_runner.py --conformance-root conformance`
- `python3 conformance/run_conformance.py --implementation js-browser --actuals conformance/actuals-js-browser.json`
- `python3 conformance/run_conformance.py --implementation python-cli --actuals conformance/actuals-python-cli.json`

Measured 2026-10-06, both records regenerated against the same 17 tests:
**js-browser 17 pass, 0 fail; python-cli 16 pass, 1 fail** — `EC-0008`, and the failure is the
runtime's, not the test's: `char N of` is a JavaScript-only value form. See that case's `note`.

Actuals file format:
- JSON object keyed by test id.
- Value shape: `{ "logs": ["..."], "error": null }`.

Execution model:
- Each implementation runs the same `.allspeak` scripts.
- Harness compares actual output/errors against each `.json` expectation.

Result categories:
- `pass`: behavior matches expected result.
- `fail`: behavior differs from expected result.
- `skip`: unsupported by current implementation target (must be justified).

Future work:
- Add plugin behavior conformance tests on top of interface mapping.
- Promote plugin contract from Draft 0.1 after behavior tests exist.
