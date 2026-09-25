#!/usr/bin/env python3
"""Node-host counterpart for the Python runtime: run viz.as against a script.

The framework (viz.as) is the same file the JS side uses. What differs is the
host: this one registers the plugin domain and points it at a target, exactly as
a browser page would load the plugin and hand it the editor buffer.

Usage:  python3 tools/asviz-run.py <script.as> [...]
        python3 tools/asviz-run.py --run <script.as> [...]   (also run it, and report
                                                              the recording its markers made)
        python3 tools/asviz-run.py --run --trace=<file.json> <script.as>
                                                             (also write the recording as a
                                                              Chrome trace; load it at
                                                              ui.perfetto.dev)
        python3 tools/asviz-run.py --run --trace=<file.json> --trace-pretty <script.as>
                                                             (indent it for reading; the
                                                              default is compact, since a
                                                              trace is mostly read by a
                                                              viewer)

Paths are relative to the current directory, which is where `Program` resolves
them from too, so run it from the repository root.
"""

import json
import os
import subprocess
import sys

USAGE = """usage: asviz-run.py [--run|-r] [--trace=<file.json>] [--trace-pretty[=<file.json>]]
                       [--trace-compact[=<file.json>]] <script.as> [...]
       A trace needs --run, and one target. Either trace flag may carry the path, so
       --trace-pretty=pretrace.json is the same as --trace=pretrace.json --trace-pretty.
"""

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'allspeak-py'))
sys.path.insert(0, os.path.join(ROOT, 'allspeak-py', 'plugins'))

from allspeak import Program          # noqa: E402
import as_viz                         # noqa: E402
from as_viz import Viz, VizState, Recorder      # noqa: E402

FRAMEWORK = os.path.join(ROOT, 'viz.as')
ANALYSER = os.path.join(ROOT, 'tools', 'asdoc-check.py')


def sectionsFor(target):
    """The doc-block model, from the canonical analyser rather than a second parser.

    Shelling out keeps the analyser's --json output as the single contract between
    the two: the host acquires, the plugin interprets. A missing analyser just means
    no prose, and the narrative falls back to the anchors.
    """
    try:
        done = subprocess.run([sys.executable, ANALYSER, '--json', target],
                              capture_output=True, text=True, timeout=60)
        return done.stdout
    except (OSError, subprocess.SubprocessError):
        return ''


def runTarget(target):
    """Run the instrumented script so the markers have something to record.

    This executes the target, side effects and all. That is the point of a recording:
    the data cannot be collected without the work being done, so the tool is meant to be
    used with care rather than fenced in.
    """
    program = Program(target, testMode=True)
    program.summaryPrinted = True
    # The markers are core syntax now, so the target needs no plugin domain to compile.
    # The recorder is the facility that makes a run a *recording*: it watches the markers
    # go past and collects the trace. Attached here rather than by a keyword, because
    # collecting data is not something the script should have to ask for.
    program.recorder = Recorder()
    VizState.trace[program.scriptName] = program.recorder
    program.start()
    # The run is over, so a window still open ends here rather than whenever a reader looks.
    program.recorder.finish()
    return program.recorder


def main(argv):
    argv = list(argv)
    run = False
    trace = None
    pretty = False
    while argv and argv[0].startswith('-'):
        flag = argv.pop(0)
        if flag in ('--run', '-r'):
            run = True
        elif flag.startswith('--trace='):
            trace = flag.split('=', 1)[1]
        elif flag == '--trace-pretty':
            pretty = True
        elif flag == '--trace-compact':
            pass                       # the default, accepted so both spellings work
        elif flag.startswith('--trace-pretty='):
            pretty = True
            trace = flag.split('=', 1)[1]
        elif flag.startswith('--trace-compact='):
            trace = flag.split('=', 1)[1]
        elif flag == '--trace':
            # `--trace` alone would have to guess a filename, and guessing writes files
            # nobody asked for. The equals form is unambiguous beside a list of targets.
            sys.stderr.write('asviz-run: --trace needs a path: --trace=<file.json>\n')
            return 1
        else:
            # A mistyped flag is the likeliest reason to land here, so say what the
            # flags are rather than only what this one is not.
            sys.stderr.write(f'asviz-run: unknown option: {flag}\n')
            sys.stderr.write(USAGE)
            return 1
    targets = argv or ['codex/en/code/step13.as']
    if trace and not run:
        sys.stderr.write('asviz-run: a trace records a run, so it needs --run too\n')
        return 1
    if trace and len(targets) > 1:
        sys.stderr.write('asviz-run: --trace takes one target, not several\n')
        return 1
    for target in targets:
        if not os.path.exists(target):
            sys.stderr.write(f'asviz-run: no such file: {target}\n')
            return 1

    with open(FRAMEWORK, 'r', encoding='utf-8') as f:
        framework = f.read()

    failures = 0
    for target in targets:
        # The host side of the contract: which script, and its text. Unlike the JS
        # host this one need not supply the text — the plugin can read a file — but
        # supplying it keeps the two hosts comparable.
        VizState.target = target
        with open(target, 'r', encoding='utf-8') as f:
            VizState.sources[target] = f.read()
        VizState.sections[target] = sectionsFor(target)
        VizState.problems = []

        if run:
            sys.stderr.write(f'asviz-run: running {target}\n')
            recorder = runTarget(target)
            # Written before the framework runs so a trace survives a framework failure,
            # and because a recording is a fact about the run, not about the report.
            if trace:
                windows = recorder.finishedWindows()
                document = as_viz.traceDocument(target, windows)
                try:
                    with open(trace, 'w', encoding='utf-8') as f:
                        # Compact by default: whitespace does not matter to a JSON reader,
                        # and a trace's first consumer is a viewer, not a person. Nothing is
                        # lost when someone does want to read one, since a compact file can
                        # be indented without re-running: python3 -m json.tool <file>
                        if pretty:
                            json.dump(document, f, indent=2)
                        else:
                            json.dump(document, f, separators=(',', ':'))
                except OSError as e:
                    sys.stderr.write(f'asviz-run: cannot write {trace}: {e}\n')
                    return 1
                sys.stderr.write(
                    f'asviz-run: trace: {trace} '
                    f'({len(document["traceEvents"])} events, '
                    f'{len(windows)} window(s))\n')

        program = Program(FRAMEWORK, testMode=True)
        program.useClass(Viz)          # the domain must exist before viz.as compiles
        # testMode keeps the compile quiet; this keeps its end-of-run test summary
        # quiet too, so the only thing on stdout is the model.
        program.summaryPrinted = True
        try:
            program.start()
        except BaseException as e:     # noqa: BLE001 - report per target, keep going
            # AllSpeak's RuntimeError does not stringify, so fall back to the type
            # name and point at the log the runtime already printed.
            detail = str(e) or f'{type(e).__name__} (see the log above)'
            sys.stderr.write(f'FAIL {target}: {detail}\n')
            failures += 1
            continue
        if VizState.problems:
            failures += 1
            sys.stderr.write(f'FAIL {target}: {VizState.problems[0]}\n')

    if failures:
        sys.stderr.write(f'{failures} of {len(targets)} target(s) failed\n')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
