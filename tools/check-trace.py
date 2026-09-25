#!/usr/bin/env python3
"""Validate a viz trace against spec/viz-trace-format.md.

Two reasons this exists rather than a comment telling writers to be careful. The
format is a contract between two runtimes that cannot see each other's output, and a
contract with no checker drifts. And the property that makes the picture worth drawing
— one lane per window, intervals that tile the window without overlapping, every event
naming a line the script can be scrolled to — is invisible in a file that loads.

Usage:  python3 tools/check-trace.py <trace.json> [script.as]

Exit status is 0 when the document conforms, 1 when it does not. Both runtimes' writers
are expected to produce something that passes this.
"""

import json
import sys


def fail(problems, message):
    problems.append(message)


def isCount(value):
    """A non-negative integer. `True` is an int in Python and is not a count."""
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def events(doc, problems):
    if isinstance(doc, list):
        return doc
    if isinstance(doc, dict) and isinstance(doc.get('traceEvents'), list):
        return doc['traceEvents']
    fail(problems, 'not a Chrome trace document: expected an array, or an object '
                   'with a traceEvents array')
    return []


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        sys.stderr.write(__doc__)
        return 0 if argv else 1
    path = argv[0]
    script = argv[1] if len(argv) > 1 else None
    problems = []

    with open(path, 'r', encoding='utf-8') as f:
        try:
            doc = json.load(f)
        except ValueError as e:
            print(f'FAIL {path}: not valid JSON: {e}')
            return 1

    events_ = events(doc, problems)

    lanes = {}          # tid -> {'window': event or None, 'intervals': [(ts, dur, line)]}
    counts_seen = 0
    counted_lines = set()
    for index, event in enumerate(events_):
        where = f'event {index}'
        if not isinstance(event, dict):
            fail(problems, f'{where}: not an object')
            continue
        phase = event.get('ph')
        if phase not in ('X', 'i', 'M', 'B', 'E'):
            fail(problems, f'{where}: unknown phase {phase!r}')
            continue
        if phase == 'M':
            if not isinstance(event.get('name'), str) or not event.get('name'):
                fail(problems, f'{where}: metadata event with no name')
            continue
        if phase != 'X':
            continue                       # other phases are legal, just not written by us
        tid = event.get('tid')
        pid = event.get('pid')
        if not isCount(pid) or not isCount(tid):
            fail(problems, f'{where}: pid/tid must be non-negative integers')
            continue
        ts = event.get('ts')
        dur = event.get('dur')
        if not isCount(ts):
            fail(problems, f'{where}: ts must be a non-negative integer of microseconds')
            continue
        if not isCount(dur):
            fail(problems, f'{where}: dur must be a non-negative integer of microseconds')
            continue
        lane = lanes.setdefault(tid, {'window': None, 'intervals': []})
        name = event.get('name')
        if not isinstance(name, str) or not name:
            fail(problems, f'{where}: every event needs a name')

        if event.get('cat') == 'window':
            if lane['window'] is not None:
                fail(problems, f'{where}: lane {tid} has more than one window span')
            lane['window'] = event
            args = event.get('args') or {}
            if not isCount(args.get('from_line')) or args.get('from_line') < 1:
                fail(problems, f'{where}: window needs args.from_line, 1-based')
            if not isinstance(args.get('mode'), str):
                fail(problems, f'{where}: window needs args.mode')
            if not isCount(args.get('steps')):
                fail(problems, f'{where}: window needs args.steps')
            counts = args.get('line_counts')
            if not isinstance(counts, dict):
                fail(problems, f'{where}: window needs args.line_counts')
            else:
                for line, count in counts.items():
                    if not line.isdigit() or not isCount(count) or count < 1:
                        fail(problems, f'{where}: line_counts[{line!r}] must be a '
                                       'count against a line number')
                        break
                    counted_lines.add(int(line))
        elif event.get('cat') == 'anchor':
            args = event.get('args') or {}
            if not isCount(args.get('line')) or args.get('line') < 1:
                fail(problems, f'{where}: anchor needs args.line, 1-based')
            if not isCount(args.get('pc')):
                fail(problems, f'{where}: anchor needs args.pc')
            if not isinstance(args.get('name'), str):
                fail(problems, f'{where}: anchor needs args.name (may be empty)')
            if not isCount(args.get('steps')):
                fail(problems, f'{where}: anchor needs args.steps')
            if not isCount(args.get('visit')) or args.get('visit') < 1:
                fail(problems, f'{where}: anchor needs args.visit, 1-based')
            counts_seen += 1
            lane['intervals'].append((ts, dur, args.get('line'), where))

    lines_used = set()
    for tid in sorted(lanes):
        lane = lanes[tid]
        if lane['window'] is None:
            fail(problems, f'lane {tid}: no window span')
        intervals = sorted(lane['intervals'])
        previous_end = None
        for ts, dur, line, where in intervals:
            if line is not None:
                lines_used.add(line)
            if previous_end is not None and ts < previous_end:
                fail(problems, f'{where}: overlaps the interval before it in lane {tid} '
                               f'(starts at {ts}, previous ended at {previous_end})')
            previous_end = ts + dur
        if lane['window'] is not None and intervals:
            span = lane['window']['dur']
            tiled = sum(dur for _ts, dur, _line, _where in intervals)
            if tiled > span + 10:
                fail(problems, f'lane {tid}: intervals tile {tiled}us but the window spans '
                               f'{span}us — they must not exceed it')

    if script:
        try:
            with open(script, 'r', encoding='utf-8') as f:
                total = sum(1 for _ in f)
        except OSError as e:
            fail(problems, f'cannot read {script}: {e}')
        else:
            beyond = sorted(x for x in lines_used | counted_lines if x > total)
            if beyond:
                fail(problems, f'{len(beyond)} event(s) name lines past the end of {script} '
                               f'(its last line is {total}): {beyond[:5]}')

    spans = [lane['window']['dur'] for lane in lanes.values() if lane['window']]
    print(f'  lanes (windows): {len(lanes)}')
    print(f'  anchor intervals: {counts_seen}')
    print(f'  lines referenced: {len(lines_used)} anchor line(s), '
          f'{len(counted_lines)} with counts'
          + (f' of {total}' if script else ''))
    print(f'  span: {max(spans) if spans else 0}us')
    if problems:
        print(f'FAIL {path}')
        for problem in problems[:20]:
            print(f'  - {problem}')
        if len(problems) > 20:
            print(f'  ... and {len(problems) - 20} more')
        return 1
    print(f'OK {path}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
