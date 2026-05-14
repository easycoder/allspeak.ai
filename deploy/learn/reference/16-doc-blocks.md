# Doc blocks

A doc block is a structured prose explanation attached to a section of `.as` code. The convention exists to force close reading: writing the *why* down forces you to notice what the code actually does, and reviewers see what the author intended without inferring it from variable names.

Doc blocks are optional per file but mandatory once a file adopts them — a file with zero doc blocks is treated as opting out, with no warnings either way.

## Structure

A doc block wraps a contiguous section of code, beginning with one or more `!!` prose lines and ending with `!!!` (three bangs):

```as
!! Brief explanation of what this section does and why it exists.
!! Use multiple !! lines as needed. A bare !! line is a paragraph break.
Section:
    ! the code
    return
!! @hash <managed>
!!!
```

- `!!` opens or continues a doc block. Each `!!` line is one paragraph of prose. A bare `!!` (no following text) is a paragraph break.
- `!!!` (three bangs) terminates the block.
- `@hash` is a metadata line, inserted and maintained by the analyser; don't write it by hand.

The block surrounds the code so the prose and the code form one logical unit.

## Writing the prose

Lead with the **why**, the design constraint, or the non-obvious context — not a paraphrase of the code. The reader can see what the code does; the prose adds what the code can't say:

- Why this section exists.
- What invariants it preserves.
- What it deliberately does NOT do.
- What earlier attempts looked like.

Avoid restating the obvious. Avoid line-by-line commentary; that's what `!` end-of-line comments are for, when they're needed at all.

**First sentence on its own line, with a paragraph break after it.** The opening sentence should stand alone as a one-line summary of what the section is for. Follow it with a bare `!!` (paragraph break), then any further detail. This makes Blocks mode legible at a glance — the reader sees one tight sentence beside the code, with the elaboration available below for when more is needed.

```
!! Build the 4x3 grid: create 12 cells and prime each one's colour state.
!!
!! Attach to Board, then loop 12 times — `index Cell to N` followed by `create Cell in Board` builds the Nth cell. Parallel ColourIndex array starts every cell at 0 (grey).
```

Not:

```
!! Build the 4x3 grid and prime per-cell state. Attach to Board, create 12 plain Cell divs as its children — each gets a grey background, a thin black border, and aspect-ratio 1 to stay square — and initialise the parallel ColourIndex array to 0 for every cell so all start in the grey state. Finally, register one shared click handler …
```

The wall-of-text form pushes detail that's already visible in the code (the colour, the border, the array initialisation) and crowds out the *why*. The two-line form gives the reader a summary they can use without reading further.

**One paragraph = one line.** Each paragraph of prose is a single `!!` line, however long. Don't insert hard line breaks for visual wrapping — they render badly in Blocks mode (which word-wraps automatically) and fight you when editing. Use a bare `!!` to break paragraphs.

Don't start a prose line with `@hash` or `@verified`; those are reserved metadata tokens. Quote them ("`@verified`") if you must mention the names.

## The `@hash` mechanism

Each doc block includes a hash of the wrapped code as `@hash <managed>`. The analyser maintains it. After any code change inside a block, refresh the hashes:

```
python3 tools/asdoc-check.py --write <file>
```

A stale hash means the code changed without the prose being re-reviewed — the analyser flags it as a warning. The author re-reads the prose, decides whether it still describes the code accurately, and either edits the prose or marks the block verified.

## The `@verified` mechanism

`@verified` is a stronger statement than `@hash` alone — a deliberate signal that a human has read the code and the prose together and approved the pairing. The verified hash is then locked. Subsequent code changes break the verification (`verified-stale`), requiring a fresh human pass.

Asedit's Blocks mode provides a one-click "Mark verified" button for this.

## Opt-out: files with no doc blocks

A file with no doc blocks at all is treated as opt-out — no errors, no warnings. This lets the convention be adopted file-by-file as you touch existing code, without forcing a flag day across the codebase.

Once a file has any doc block, the analyser expects the whole file to be covered: subsequent unwrapped sections surface as warnings.

## Validators

Two tools validate the same convention:

- `tools/asdoc-check.py` — Python CLI; recursive over a directory. Run with `--write` to refresh hashes.
- `tools/asdoc-check-cli.as` — runs under the Python AllSpeak runtime, exercising the same logic from inside AllSpeak itself.

Asedit's Blocks mode also performs in-editor validation as you type.

## Review while documenting

Adding doc blocks to existing code should be a review pass, not just a documentation pass. While reading each section closely enough to write its prose, also surface anything that looks off:

- **Unreachable symbols** — subroutines or labels with no caller; variables declared but never assigned, or assigned but never read.
- **Dead code** — branches that can never be taken; lines after an unconditional `stop`/`exit`/`return` that nothing jumps to.
- **Suspicious patterns** — duplicated logic, hardcoded values that look like they should be variables, hidden coupling between sections.
- **Doc/code disagreement** — comments, names, or nearby docs that contradict what the code actually does.

Surface findings as a short list at the start of the response, separate from the doc-block edits. Don't silently fix them — let the author decide.

The point of the convention is to force close reading; reporting what that reading turned up is the natural payoff.

## Related

- [symbols-and-layout](symbols-and-layout.md) — `!!` and `!!!` as lexical markers.
- [structure](structure.md) — doc blocks are stripped before the domain compilers see anything.
