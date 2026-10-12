#!/usr/bin/env python3
"""Does the recording flag do what it says? Ask for a recording of a running script and watch what happens.

**Why this exists.** The flag is a *trigger*, and a trigger that silently does nothing looks exactly like a
script with nothing worth recording. It has two halves that no amount of reading settles: that asking for a
recording does not disturb the thing being watched — the flag recorder carries **no** guard, because the
editor's guard would *stop* a service — and that the recording opens and closes at the markers rather than
whenever the runtime felt like it. Both are properties of a run, so this runs one.

**It drives the command line**, which is how a service is asked: a script with a `@viz` marker pair in its
control loop, a flag file touched and removed while it runs, and the file that lands beside it afterwards.

    python3 tools/record-flag-check.py

It needs a checkout — it imports `allspeak-py/` — so it says that plainly rather than failing on a missing
path. The script it writes into a temporary directory is not the one in `various/`: this needs cycles short
enough to poke between, and it should not depend on a rig that is not in the repository.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE = os.path.join(ROOT, 'allspeak-py')
if not os.path.isdir(os.path.join(PACKAGE, 'allspeak')):
    sys.stderr.write('record-flag-check: no allspeak-py/allspeak beside this script. It imports the runtime, '
                     'so it needs a checkout rather than a copy of a tool.\n')
    sys.exit(2)

failures = []


def check(ok, text):
    print(('  OK: ' if ok else '  FAIL: ') + text)
    if not ok:
        failures.append(text)


def note(text):
    print('  ..    ' + text)


# A control loop with a marker pair in it: the shape a controller is asked for a recording in.
SCRIPT = """!   loop.allspeak — a control loop with markers, written by record-flag-check.py.
    variable N
    variable I
    variable Cycles
    put 0 into N
    put 0 into I
    put 6 into Cycles
Loop:
    while N is less than Cycles
    begin
        gosub to Cycle
        add 1 to N
    end
    print `done`
    stop
Cycle:
    @viz start
    put 0 into I
    while I is less than 5
    begin
        increment I
    end
    @viz stop
    wait 250 millis
    return
"""

# The run, driven the way the CLI drives it: the runtime's own `Main`, over the checkout's package.
RUNNER = """
import sys
sys.path.insert(0, {package!r})
sys.argv = ['allspeak', {script!r}]
{prologue}
from allspeak import Main
Main()
"""


def run(script, prologue=''):
    """One run of the script, and nothing about it suppressed: the verdict is on stderr."""
    code = RUNNER.format(package=PACKAGE, script=script, prologue=prologue)
    return subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, cwd=os.path.dirname(script))


def recordingOf(script):
    return script + '.viz.json'


def visits(path):
    with open(path, encoding='utf-8') as f:
        document = json.load(f)
    return len([e for e in document['traceEvents'] if e.get('ph') == 'X'])


work = tempfile.mkdtemp(prefix='record-flag-check-')
try:
    script = os.path.join(work, 'loop.allspeak')
    with open(script, 'w', encoding='utf-8') as f:
        f.write(SCRIPT)
    flag = script + '.record'

    # ---- 1. Nothing asked for: the markers must do nothing at all -----------------------------------
    print('a script that was not asked for a recording')
    first = run(script)
    check('done' in first.stdout and os.path.exists(recordingOf(script)) is False,
          'the markers are inert and no recording is written — the annotations stay in the script and '
          'nothing is collected until somebody asks')

    # ---- 2. Asked for, and then not: the edges, while the run carries on -----------------------------
    print('a request made and withdrawn while the script runs')
    # **The guard's own bounds are set to nothing, and that is how this claim can fail.** The recorder an
    # editor drives must be guarded, so the runtime's flag recorder uses *no* bounds — and a claim that it is
    # undisturbed by them cannot be made with bounds so generous that a quick script never reaches them: the
    # first version of this check passed against a recorder with the guard wrongly on, because six cycles of a
    # quarter second is nothing like twenty seconds of wall clock. Set to a nanosecond, a recorder that reads
    # them dies at its first command and the run never reaches its end — which is the whole of what is wrong
    # with guarding a service.
    UNGUARDED = ('from allspeak.plugins import as_viz\nas_viz.DEFAULT_BUDGET_NS = 1\n'
                 'as_viz.DEFAULT_CEILING_NS = 1\n')
    held = subprocess.Popen([sys.executable, '-c', RUNNER.format(package=PACKAGE, script=script,
                                                                 prologue=UNGUARDED)],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                            cwd=os.path.dirname(script))
    time.sleep(0.5)
    open(flag, 'w').close()                      # touch: the request
    time.sleep(0.8)
    whileAsking = os.path.exists(recordingOf(script))
    os.remove(flag)                              # rm: withdrawn at the next marker
    time.sleep(1.0)
    wrote = os.path.exists(recordingOf(script))
    out, err = held.communicate(timeout=60)
    check(not whileAsking, 'nothing is written while the recording is still being collected — the file is '
                           'closed by the request going away, not by a timer')
    check(wrote, 'withdrawing the request writes the recording beside the script, mid-run')
    check(held.returncode == 0 and 'done' in out,
          'and the run was not disturbed by any of it: it reached its own end with the guard\'s bounds set '
          'to a nanosecond, which a recorder that used them would have died on — the claim that fails if the '
          'flag recorder is ever given the editor\'s guard')
    if wrote:
        n = visits(recordingOf(script))
        check(n > 0, f'the recording holds {n} visit(s), so the markers were collected while the flag was set')

    # ---- 3. The cap: stops collecting, writes, and leaves the run alone ------------------------------
    print('a request left standing past the cap on what may be collected')
    os.remove(recordingOf(script))
    open(flag, 'w').close()
    capped = run(script, prologue=UNGUARDED + 'as_viz.FLAG_CAP = 12')
    check('reached 12 visits' in capped.stderr,
          'the cap says so on stderr, where the reader who typed the `touch` will find it')
    check(os.path.exists(recordingOf(script)),
          'and it writes what it has rather than waiting for a flag that may never be cleared')
    check('done' in capped.stdout,
          'and a capped recording leaves the run alone as well')
finally:
    shutil.rmtree(work, ignore_errors=True)

print()
if failures:
    print(f'{len(failures)} claim(s) failed')
    sys.exit(1)
print('every claim holds')
