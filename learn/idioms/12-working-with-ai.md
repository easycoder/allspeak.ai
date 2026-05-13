# Working with AI

## Problem

AI tools are useful for writing AllSpeak — fast drafts, idiom suggestions, translation. They are also reliably wrong about details: AllSpeak's vocabulary doesn't always match AI training data, so AI confidently produces syntax that looks plausible but doesn't compile (or worse, compiles to the wrong thing). The point of this idiom is to make the AI's strengths usable without falling into its failure modes.

## The basic loop

AI drafts, human reviews. Iterate.

1. **Brief the AI** on the task. Point it at the relevant reference and idiom files — it will lean on them rather than its training data.
2. **AI produces a draft.** Treat it as a first pass, not a final answer.
3. **Read it carefully.** Look for the common mistakes listed below.
4. **Run it.** Compilation catches many errors; behavioural bugs need a `print` or `log` (see [debugging-as](debugging-as.md)).
5. **Iterate.** Either fix what's wrong directly or hand the AI the symptom and let it re-draft.

The loop is not "AI does it all, human rubber-stamps." It's **AI does the typing, human does the engineering.**

## What "readable" demands

For the review step to work, AI output has to be readable enough that a reviewer can spot what's wrong without re-running the analysis from scratch. That means:

- **Doc blocks.** Every section wrapped in `!! …` prose explaining what it does and why. The act of writing the doc forces the AI to state its intent, which surfaces gaps between what the prose says and what the code does. See [doc-blocks](../reference/doc-blocks.md).
- **Named variables.** Not `X` and `Y` — `Counter`, `ButtonClicked`, `IsLoggedIn`. The reviewer doesn't have to keep types in their head.
- **Inline comments where the *why* is non-obvious.** A `!`-comment flagging a quirk. Don't restate the code; flag the surprise.
- **One concept per section.** Long mixed-purpose subroutines are unreviewable. If a section needs two paragraphs of doc-block prose, it's two sections.

## Common AI mistakes on AllSpeak

Things AI tools reliably get wrong:

- **`cat` placement.** AI puts `cat` before the first value or omits it between values. AllSpeak's `cat` is infix only — see [cat-and-string-building](cat-and-string-building.md).
- **Imperative operators.** `Counter += 1` or `Counter = Counter + 1`. AllSpeak uses `add 1 to Counter`.
- **`for` loops.** AllSpeak has no `for` or `for each`; iteration is `while` or label-driven. See [looping-patterns](looping-patterns.md).
- **Float arithmetic.** `multiply 3.14 by 2`. `3.14` is a string, not a number. See [floats-and-scaled-integers](floats-and-scaled-integers.md).
- **Parentheses for grouping.** `(A + B) * C`. No grouping syntax; use a temporary variable.
- **`elif` and `case`/`switch`.** AllSpeak has neither. `if … else if … else …` is fine (it's just `else` followed by another `if`), but the shortcut `elif` doesn't exist, and there's no `case` / `switch` statement — use a chain of `if`/`else if` or a labelled dispatch.
- **`or` vs `on failure` confusion.** Different post-clause behaviour — `or` stops, `on failure` continues. See [errors-and-recovery](../reference/errors-and-recovery.md).
- **Invented keywords.** `return X`, `break`, `continue`, `try`/`catch`, `await`. None of these exist in AllSpeak.

The `cat` placement and `for`/`for each` mistakes are the most common; the others are sporadic.

## Ask-it-to-explain before ask-it-to-rewrite

When AI output is wrong, the temptation is to say "this is wrong, try again." That re-rolls the dice. A better first move:

> "Walk me through what this does, line by line."

The AI's explanation either matches reality (in which case you can pinpoint where you disagree) or doesn't (in which case it has just told you what it actually expected the code to do). Either way you now have more information than a blind retry.

Once you know what the AI was trying to do, you can either fix it yourself or give it a precise instruction:

> "Replace the `for each` loop with a `while` loop using a counter; AllSpeak has no `for each`."

## The doc-block pass as review point

When AI writes a section, ask it to add a doc block at the same time. The prose forces it to state its intent in plain language, where contradictions with the code stand out. The `@hash` mechanism then locks the pairing — if a future edit changes the code without revisiting the prose, the analyser flags it. See [doc-blocks](../reference/doc-blocks.md).

## Anti-pattern: trusting AI on syntax details

AllSpeak's vocabulary doesn't fully match what AI was trained on. Even when the AI sounds confident, the specific keywords, the placement of `cat`, the handling of failure clauses are details to verify against the reference. The curriculum exists in part so the AI can be pointed at it instead of guessing.

## Anti-pattern: spec first, code second, doc-block third

Tempting to write a detailed spec, hand it to the AI, let it produce code, then add a doc block describing the code. The order misses the point of doc blocks. The prose is meant to capture intent *as the code is written*, so disagreements between intent and result surface. If the doc-block is written from the resulting code, it just restates whatever the AI produced — losing its value as a check.

The right order: human and AI agree on intent (verbally or in a brief), AI writes code and doc-block together, human reviews both for agreement.

## Related

- [doc-blocks](../reference/doc-blocks.md) — the review-while-documenting convention.
- [debugging-as](debugging-as.md) — `print` / `log` for verifying behaviour.
- [writing-language-neutral](writing-language-neutral.md) — AI as first-pass translator.
- [cat-and-string-building](cat-and-string-building.md) — the single most common AI mistake.
