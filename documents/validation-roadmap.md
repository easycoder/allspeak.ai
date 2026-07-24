# AllSpeak Language Validation Roadmap

**Goal:** Move the French, German, and Italian language packs from "functional" to "validated by native-speaker educators," enabling credible claims of community suitability for UNESCO and other funding bodies.

**Prerequisite:** This roadmap assumes a willing native-speaker validator for each language, access to AI assistance for documentation, and a working AllSpeak development environment.

---

## Phase 1: Validation Criteria Definition (1 week)

**Objective:** Establish clear, documented acceptance criteria before any validation begins.

### Deliverables

1. **Validation checklist** covering:
   - Vocabulary review (all 127 opcodes, 13 connectors, 12 conditions, 10 literals, 6 time units, ~360 word-map entries)
   - Grammar pattern review (each opcode's declared `patterns` array matches natural usage in the target language)
   - Codex walkthrough (all 20 steps execute correctly with natural-sounding code)
   - AI collaboration test (AI generates correct scripts in the target language)
   - Educator assessment (age-appropriateness, pedagogical suitability, cultural context)

2. **Validator guide** — A short document explaining:
   - What AllSpeak is and how language packs work
   - What "validation" means and what qualifies as a pass/fail
   - How to report issues and suggest improvements
   - Expected time commitment (estimated 2–4 hours per language)

3. **Acceptance criteria:**
   - No vocabulary items judged "unacceptable" (must fix) or "ambiguous" (must resolve)
   - All 20 Codex steps execute without compile errors
   - All 20 Codex step descriptions read naturally to a native speaker
   - At least one AI-generated script in the target language runs correctly

---

## Phase 2: French Validation (2 weeks)

**Priority:** French first, because it has the largest number of active learners in the Codex usage data (if available) and benefits from the largest available pool of native-speaker reviewers.

### Steps

1. **Identify validator(s):**
   - Target: French-speaking educator with programming familiarity
   - Channels: personal network, academic contacts, French-language computing education groups
   - Fallback: AI-assisted self-review with subsequent native-speaker spot-check

2. **Validator briefing:**
   - Provide the validation checklist and validator guide
   - Set up a Weblate component for FR validation feedback
   - Schedule a 30-minute walkthrough call

3. **Validator executes:**
   - Reviews vocabulary in `LanguagePack_fr.js` against the checklist
   - Completes the Codex walkthrough in French (all 20 steps)
   - Tests AI collaboration with Claude Code or equivalent
   - Files issues for any problems found

4. **Remediation:**
   - Fix issues identified by validator
   - Re-test Codex steps
   - Re-submit for validator sign-off

5. **Publication:**
   - Update `LanguagePack_fr.js` version to 1.0.0
   - Update `dist/allspeak.js` build
   - Update FR starter zip
   - Add validation badge to the project README
   - Document the validation process as a methodology reference

---

## Phase 3: Italian Validation (2 weeks)

**Priority:** Second, because Italian was the test case for the AI-assisted methodology, providing the strongest comparison point between initial draft and validated version.

### Steps

Same process as Phase 2, applied to `LanguagePack_it.js`:

1. Identify Italian-speaking educator/validator
2. Provide briefing and checklist
3. Validator completes review, Codex walkthrough, and AI test
4. Remediation of any issues
5. Publication and badge

---

## Phase 4: German Validation (2 weeks)

**Priority:** Third, because German had the most structural challenges (word order, compound words, canonical mismatches like the `attach`/`to`/`an` issue) and benefits from additional time for the validator to focus on structural correctness.

### Steps

Same process as Phase 2, applied to `LanguagePack_de.js`. Particular attention to:

- **Connective words:** Verify that all `to`, `from`, `into`, `with`, `by`, `of`, `in`, `as`, `on`, `and`, `or`, `giving`, `the` mappings are correct and natural
- **Compound words:** Ensure that German compound constructions (e.g., `Fehlschlag` for `failure`) are handled consistently
- **Word order:** Verify that any sentence-final verb constructions in conditional patterns are correctly described

---

## Phase 5: Documentation and Publication (1 week)

**Objective:** Publish the validation outcomes as a citable case study.

### Deliverables

1. **Validation report** for each language, including:
   - Summary of findings (what passed, what was fixed, any unresolved issues)
   - Before/after examples of vocabulary or pattern changes
   - Validator credentials (name, title, affiliation—with permission)
   - Time taken and lessons learned

2. **Updated white paper** incorporating validation outcomes

3. **Zenodo deposit** — Upload the working paper (updated) with validation data as a supporting file, obtaining a DOI

4. **Dev.to update** — The existing article receives a validation-status update

---

## Total Timeline: 8 weeks

| Phase | Duration | Start | End |
|---|---|---|---|
| 1. Criteria definition | 1 week | Week 1 | Week 1 |
| 2. French validation | 2 weeks | Week 2 | Week 3 |
| 3. Italian validation | 2 weeks | Week 4 | Week 5 |
| 4. German validation | 2 weeks | Week 6 | Week 7 |
| 5. Publication | 1 week | Week 8 | Week 8 |

**Parallel option:** If multiple validators are available simultaneously, French and Italian could run in parallel, collapsing the timeline to 5 weeks.

---

## Resource Requirements

| Item | Cost/Effort | Notes |
|---|---|---|
| Validator honorarium (×3) | €500–€1,000 each | Optional but recommended; 2–4 hours of skilled work |
| Technical maintainer time | 4–6 days total | Fixes, updates, documentation |
| Weblate setup | Already in place | No additional cost |
| Zenodo deposit | Free | Requires DOI registration |
| Total cash cost | €1,500–€3,000 | If honorariums are paid |

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cannot find willing validator | Medium | High | AI-assisted self-review + public community call |
| Validator finds many issues | Low–Medium | Medium | Build time for remediation into the schedule |
| Validator drops out mid-process | Low | Medium | Identify backup validator upfront |
| Validation reveals architecture limitation | Low | High | Document limitation, defer fix if non-blocking |
| No budget for honorariums | Medium | Medium | Dependent on grant funding; proceed with volunteers |

---

## After Validation: Next Steps

Once FR/DE/IT are validated:

1. **Apply to NLnet Foundation** for a Stage 1 grant (€20k–€50k) to add 2–3 new languages including Bulgarian (Cyrillic)

2. **Approach UNESCO IFCD** with validated methodology and published outcomes from the first four languages

3. **Recruit language maintainers** for new languages, using the validated methodology as a template

4. **Publish the methodology paper** on Zenodo with the validation outcomes as supporting evidence
