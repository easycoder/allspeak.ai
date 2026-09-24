# 2026-09-24

## 18:55

In ~/bin there is 'asbuild', which calls 'flit' to build a new AllSpeak version. Can you modify this to first bump the version number in allspeak-py/allspeak/__init__.py, using the YYMMDDhhmm format already used.

**Assistant**

Done — `~/bin/asbuild` now stamps a fresh version before building:

[code omitted]

Why this shape: `pyproject.toml` has `dynamic = ["version"]`, so flit names the wheel/sdist after `__version__` in `allspeak/__init__.py`. A stale stamp therefore produces a filename PyPI has already seen — exactly the failure you hit on 2026-08-23 in conversation-013 (400 Bad Request on re-upload of `allspeak_ai-2608202121`), so bumping inside `asbuild` is the right place for it.

Notes:
- Local time, matching the existing constant (`2609231916` was a local-time stamp); `date +%y%m%d%H%M` → `2609241855` right now.
- `set -e` so a failed bump aborts before `git add`/`flit build` rather than silently building the old version.
- Guard: `grep -c '^__version__ = "'` must find exactly one line, otherwise the script exits 1 with a message and touches nothing.
- `sed` writes to a temp file then `mv`s, so it works with BSD `sed` too, not just GNU `sed -i`.
- The existing `git add .` (now after the bump) keeps the new version in the same commit as the code that ships with it.

Verified with a harness in `/tmp` (same script, `cd` retargeted at a temp work dir, stub `git`/`flit` on `PATH`, a copy of `__init__.py`): normal run wrote the correct stamp and invoked `flit build`/`flit install`; a second run in the same minute is a no-op bump; 0 and 2 `__version__` lines each exited 1 without calling flit; no `.tmp` left behind. Scratch removed. The real repo and `~/bin` were not otherwise touched — the version constant still reads `2609231916` (your staged edit).

One thing I did not do, since you asked for `asbuild` only: `~/bin/aspublish` runs `flit publish` with no bump, so publishing straight after a previous publish in the same state will still 400. Say the word if you want the same bump in the publish path — it would need a slightly different guard, since double-publishing an identical version means the version has to be *newer* than what's on PyPI, not merely non-empty.

## 18:56

No, leave aspublish as it is - it always follows asbuild.

**Assistant**

Understood — `aspublish` stays untouched. That works because the ordering guarantees freshness: `asbuild` stamps a new `__version__` (and stages it) before `flit build`/`flit install`, so as long as `aspublish` runs after it, `flit publish` names a wheel PyPI hasn't seen. Worth remembering the one case that still bites: `aspublish` run *without* a preceding `asbuild`, or two `aspublish` runs in a row, will re-upload an existing filename and get the bare 400. Nothing further to change here — `asbuild` is the single place the version moves.
