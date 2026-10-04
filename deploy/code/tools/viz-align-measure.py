#!/usr/bin/env python3
"""Measure a Graph-pane screenshot against the picture's own grid.

Written for a question no headless check can answer — whether the drawing and the text are aligned on
screen — and kept because it took four attempts to get right, all four of them wasted on constants
guessed by eye rather than measured. So it measures its own grid and prints it.

What it does:
  * finds the frame (the dark border) and the y-axis labels, and derives the row pitch from the labels'
    *measured* pixel positions — 20 lines apart by construction, whatever the zoom;
  * reads the horizontal rules (the grey hairlines) and the source text (blue-grey glyphs);
  * reports, for each rule, how far it sits above or below the glyph row of the line it belongs to —
    which is the alignment claim;
  * with a script and its recording, checks each rule's left end against `8 x line length + 1em`,
    which is the leader claim.

Usage:
    python3 various/viz-align-measure.py shot.png [script.allspeak [trace.viz.json]]

Assumptions, which are theme-dependent and worth checking first if the numbers look wrong: the frame's
border is near #3a4048, the rules are near #eee, the source text is near #5b6472 (and is told from the
coloured marks by green ~= red), and the axis labels are in the canvas's own #8b93a1. Every one of
those is printed alongside the measurement, so a bad reading is visible rather than merely wrong.
"""
import json
import sys

from PIL import Image


def group(values, gap):
    out = []
    for v in values:
        if out and v - out[-1][-1] <= gap:
            out[-1].append(v)
        else:
            out.append([v])
    return out


def bands(rows, pred, x0, x1, min_pixels):
    """Runs of adjacent scanlines that hold at least `min_pixels` matching pixels."""
    hits = [y for y in rows if sum(1 for x in range(x0, x1) if pred(y, x)) >= min_pixels]
    return group(hits, 3)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__ + "\nAlso needed: the value the *first* y-axis label reads. The labels cannot be read"
                   "\nfrom the image without OCR, so the script is told it and prints it back.")
    shot = sys.argv[1]
    first_label = int(sys.argv[2])          # what the top y-axis label says, e.g. 338
    script = sys.argv[3] if len(sys.argv) > 3 else None
    trace = sys.argv[4] if len(sys.argv) > 4 else None
    im = Image.open(shot).convert("RGB")
    W, H = im.size
    px = im.load()
    print(f"{shot}: {W}x{H}")

    near = lambda c, t, tol: all(abs(c[i] - t[i]) <= tol for i in range(3))

    # --- the frame: the dark border rectangle ---
    border = (58, 64, 72)
    fr = [y for y in range(H) if sum(1 for x in range(W // 6, 5 * W // 6) if near(px[x, y], border, 30)) > 800]
    fc = [x for x in range(W) if sum(1 for y in range(H // 8, 7 * H // 8) if near(px[x, y], border, 30)) > 600]
    if len(fr) < 2 or len(fc) < 2:
        sys.exit(f"  FAIL: could not find the frame's border (rows {fr[:3]}, cols {fc[:3]})")
    top, bot, left, right = fr[0], fr[-1], fc[0], fc[-1]
    print(f"  frame: y {top}..{bot} ({bot - top} px), x {left}..{right} ({right - left} px)")
    print(f"  the frame is 880x580 units, so {((right - left) / 880):.3f} and {((bot - top) / 580):.3f} px a unit"
          f" — they should agree, or the aspect is not being preserved")

    # --- the y-axis labels, which give the grid: they are 20 lines apart ---
    lab = [y for y in range(H) if sum(1 for x in range(0, left - 6) if near(px[x, y], (139, 147, 161), 45)) >= 3]
    lb = group(lab, 8)
    if len(lb) < 2:
        sys.exit(f"  FAIL: found {len(lb)} axis label(s) left of the frame — the labels are at x < {left - 6}")
    centres = [(b[0] + b[-1]) / 2 for b in lb]
    pitch = (centres[-1] - centres[0]) / (20 * (len(centres) - 1))
    print(f"  axis labels at y {[round(c, 1) for c in centres]} -> {pitch:.3f} px a line"
          f" ({20 * (len(centres) - 1)} lines between the first and last)")
    rows_in_frame = (bot - top) / pitch
    print(f"  so the window holds {rows_in_frame:.1f} rows")

    # The first label's baseline is the frame's own y for the line it names, and the labels are 20 lines
    # apart, so the whole line-to-y mapping follows from the label's *value* and its measured position.
    anchor_y, anchor_line = lb[0][-1], first_label
    line_at = lambda y: anchor_line + (y - anchor_y) / pitch
    print(f"  the top label reads {anchor_line}, and its baseline is at y={anchor_y}: so a line L is at"
          f" y = {anchor_y} + (L - {anchor_line}) x {pitch:.3f}")

    # --- the text and the rules inside the frame ---
    X0, X1 = left + 5, right - 5
    istext = lambda c: 55 <= c[0] <= 155 and 0 <= (c[1] - c[0]) <= 20 and 10 <= (c[2] - c[0]) <= 40
    isrule = lambda c: abs(c[0] - c[1]) <= 3 and abs(c[1] - c[2]) <= 3 and 232 <= c[0] <= 245
    tb = bands(range(top + 1, bot), lambda y, x: istext(px[x, y]), X0, X1, 2)
    text_rows = [{"top": b[0], "bot": b[-1], "c": (b[0] + b[-1]) / 2,
                  "end": max(max(x for x in range(X0, X1) if istext(px[x, y])) for y in b)} for b in tb]
    rules, last = [], -99
    for y in range(top + 1, bot):
        xs = [x for x in range(X0, X1) if isrule(px[x, y])]
        if len(xs) > 300 and y - last > 3:
            rules.append((y, min(xs), max(xs)))
            last = y
    print(f"  text rows found: {len(text_rows)};  rules found: {len(rules)}")
    if not text_rows:
        sys.exit("  FAIL: no text pixels found inside the frame — suspect the text colour check")

    # --- the alignment claim: where does each rule sit among the glyph rows? ---
    # A rule is placed at the line's own y, which should be the *middle* of that line's glyph row. So
    # the nearest glyph row to a rule should be the one whose middle is closest, and the gap should be
    # about half a row at most. Reported as a fraction of a row so the zoom drops out.
    print("\n  rule y | nearest glyph row below (centre, gap in rows) | nearest above (centre, gap in rows)")
    worst = 0.0
    for y, x0, x1 in rules:
        below = next((r for r in text_rows if r["c"] > y), None)
        above = next((r for r in reversed(text_rows) if r["c"] <= y), None)
        def f(r):
            return "-" if r is None else f"c={r['c']:7.1f} ({(r['c'] - y) / pitch:+.2f} rows)"
        print(f"   {y:6d} | below {f(below)} | above {f(above)}")
        if below:
            worst = max(worst, abs(below["c"] - y) / pitch)
    print(f"\n  the nearest glyph row to a rule: worst {worst:.2f} rows away."
          "\n  0.0-0.5 means the rule is inside its own row; ~1.0 means it is a whole row out, which is"
          "\n  the fault this was written for — a rule drawn at the top of its row sits half a row above"
          "\n  the glyphs and reads as belonging to the line above.")

    # --- is the text in the row the axis names it? ---
    # The one measurement a *rendering* fault leaves behind, and the one every check on the document
    # missed. The picture's rows draw nothing where the file has a blank line or a doc block, so the
    # pattern of empty rows is a fingerprint of the text's true position; the offset that best matches it
    # is the drift between the text and the drawing's grid. It was 144 lines on this file when the rows
    # were placed by accumulating `dy` — an empty `<tspan>` does not advance the text position, so every
    # empty row collapsed and pulled the rows above it up.
    if script:
        # One pass over the scanlines, because the search below is over the whole file and this test is
        # otherwise the expensive part of it: an offset of a hundred and forty rows is well outside a
        # window chosen by eye.
        blank_here = {}
        for i in range(int(rows_in_frame) + 4):
            yy = anchor_y + i * pitch
            blank_here[i] = not any(sum(1 for x in range(X0, X1) if istext(px[x, int(yy) + d])) >= 2
                                    for d in range(-5, 7))
        src = open(script).read().split("\n")
        draws = lambda ln: 1 <= ln <= len(src) and bool(src[ln - 1].strip()) and not src[ln - 1].startswith("!!")
        rows_n = int(rows_in_frame) - 2
        agree = lambda off: sum(1 for i in range(rows_n)
                                if blank_here[i] == (1 - draws(anchor_line + i + off)))
        at_zero = agree(0)
        want = sum(1 for i in range(rows_n) if not draws(anchor_line + i))
        print(f"\n  rows that draw nothing, against the file's blank lines: {at_zero}/{rows_n} agree where the axis"
              f" puts them, and the file has {want} such rows in this window")
        print("  ... they should agree: every row the file leaves blank is a row the picture should leave blank."
              "\n  A shortfall here is the drift this instrument was extended for — the text drawn compacted by"
              "\n  the number of empty rows above it, which happens when rows are placed by accumulating `dy`"
              "\n  and an empty `<tspan>` does not advance the text position. Fix the rows, not the mapping:"
              "\n  the drawing is right and it is the text that has moved. (This count is a detector rather than"
              "\n  a measurement — the blank pattern alone does not pin the offset, so read the *shortfall* and"
              "\n  use the label names the pane draws, or a crop, to find the size of it.)")

    # --- with the source and the recording: the leader claim ---
    if not script or not trace:
        return
    src = open(script).read().split("\n")
    named = set()
    for e in json.load(open(trace)).get("traceEvents", []):
        a = e.get("args", {})
        if e.get("cat") == "anchor" and a.get("line") is not None:
            named.add(int(a["line"]))
        if e.get("cat") == "transfer":
            for k in ("from_line", "to_line"):
                if a.get(k) is not None:
                    named.add(int(a[k]))
    # A document unit's length on screen: the pane maps `rows_in_frame * 18` document units onto the
    # frame's 580, and the frame's aspect does the same to the width. A column is 8 of those units and
    # the rule's gap is 13 (one em), which is why this is the number both of those are built from.
    px_per_unit = ((bot - top) / 580) * (580 / (rows_in_frame * 18))
    px_per_column = 8 * px_per_unit
    print(f"\n  a document unit is {px_per_unit:.4f} px, so a column is {px_per_column:.2f} px"
          f" and one em (13 units) is {13 * px_per_unit:.2f} px")
    print("  rule y | line by the label | named? | file line (len) | rule x0 | expected (x0-want)")
    bad = 0
    for y, x0, x1 in rules:
        line = round(line_at(y))
        text = src[line - 1] if 1 <= line <= len(src) else ""
        want = left + (8 * len(text) + 13) * px_per_unit
        good = line in named and abs(x0 - want) <= 2
        bad += 0 if good else 1
        print(f"   {y:6d} | {line:4d} | {'yes' if line in named else 'NO '} | {text[:30]:30s} ({len(text):3d})"
              f" | {x0:5d} | {want:7.0f} ({x0 - want:+5.0f}){'' if good else '   <- not a match'}")
    print(f"  {len(rules) - bad} of {len(rules)} rules match their line to within 2 px. A rule 15-20 px"
          "\n  past it is one whose first characters a vertical flow line is drawn over; anything else is a"
          "\n  mismatch worth looking at. Rows reading 'NO' mean the recording does not name that line, so"
          "\n  the label anchor is a line or two out — the pitch and the first label's value are the two"
          "\n  numbers to re-check first.")


if __name__ == "__main__":
    main()
