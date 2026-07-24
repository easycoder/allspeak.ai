# 2026-07-23

## 19:53

I would like to add a simple alternative to chained if...then..else in the form of a "computed goto". [proposed syntax for goto/gosub/fork with `label <expr>`]

**Assistant**

Researched feasibility: read Core.js (Go/Gosub/Fork compile+run), Compile.js, Value.js, Run.js, Main.js, language packs. Reported that the feature is feasible — the architecture already supports string-based label lookup at runtime, and the value expression parser handles the required `cat` concatenation. ~40–50 lines in Core.js.

[code omitted]

## 20:12

Please go ahead for JS and Python versions.

**Assistant**

Implemented computed goto/gosub/fork in both runtimes:
- JS: `js/allspeak/Core.js` — added `gotoExpr` compile-time detection and runtime evaluation in Go, Gosub, Fork handlers
- Python: `allspeak-py/allspeak/as_core.py` — same logic with `gotoExpr`/`gosubExpr`/`forkExpr` fields
- Built JS dist successfully (`./build-allspeak`)

[code omitted]

## ~20:50

Now to update learn/ to make sure agents are aware of this syntax.

**Assistant**

Added documentation to `learn/reference/09-control-flow.md`:
- New "Computed label" subsection under Labels and `go to` with examples
- New "Computed gosub" subsection showing gosub/fork variants
- Added entry in "When to use which" bullet list
- Saved project memory `computed-goto-feature`

[code omitted]

## ~21:00

OK, that's good for tonight. I'll handle deployment myself. Let's close here.

**Assistant**

Saved a project memory (`computed-goto-feature.md`) and closed the session.
