# Doclets feature: prerequisites & follow-ups (authoritative tracker)

Doclets is AllSpeak's primary working example (whitepaper §7.2 + the allspeak.ai
Doclets page). The drafted content is in place; the items below are the work
that must happen around it. **This file is the single place these are tracked**
— items are easy to forget once the prose is committed, so anything added to
the whitepaper or website copy should be checked off here too.

Status legend: `[ ]` not done · `[~]` in progress · `[x]` done

## Claims & copy (must be true before anything ships)

- [ ] **Multilingual phrasing is honest.** Any published copy must say: the
      keywords resolve automatically through the language pack; the script
      text and user-visible strings must be authored in the target language.
      Do NOT claim "the same .as logic runs under any language pack" or name
      Arabic as a supported language (only EN/FR/DE/IT exist; Bulgarian is the
      non-Latin roadmap target).
- [ ] **Canonical links confirmed.** Whitepaper and website cite
      `https://github.com/easycoder/doclets` (git origin: `git@github.com:easycoder/doclets.git`)
      and `https://doclets.eclecity.net`. Confirm both resolve and are the
      URLs we want public.
- [ ] **"One person can change the entire stack"** is phrased as a property of
      deliberate smallness, not an anecdote about the author.

## Artifacts & deployment

- [ ] **Screenshots** (desktop + phone) of the live Doclets UI → add to
      `resources/img/` and wire into `resources/md/doclets.md`.
- [~] **Regenerate whitepaper outputs** from the edited `documents/whitepaper.md`.
      `whitepaper.html` was hand-synced to match (sandbox couldn't `pip install markdown`);
      the canonical refresh is `python3 -m pip install markdown` then
      `python3 md-to-html.py whitepaper.md whitepaper.html` (in `documents/`).
      `whitepaper.pdf` is produced from the HTML via browser Print
      (see `documents/zenodo-deposit-guide.md`) or pandoc
      (`pandoc whitepaper.md -o whitepaper.pdf --pdf-engine=xelatex`).
      DECIDED: wait for the §7.4 YouTube video URL, then regenerate ALL outputs
      (html + pdf) in one pass — html is currently up to date via `md-to-html.py`.
- [ ] **Deploy the website** so the new Doclets page + nav button go live
      (`deploy-allspeak`); verify the page renders and the sidebar shows the
      Doclets button.
- [ ] **Verify the live Doclets instance** works with no setup, and that the
      LLM query button degrades gracefully when the model is absent (README
      claims it does — check live before claiming it publicly).
- [ ] **Embedded-client decision:** embedding the live client on the website
      page needs the MQTT token path (`mqtt_token.php`) to work from the
      allspeak.ai origin. Currently the page links out — revisit only if we
      want an in-page demo.

## Follow-up material (recommended, not blocking)

- [ ] **French-language Doclets client** — the multilingual demonstration
      promised in whitepaper §7.2. Highest-value next step: turns "any
      language" from an architectural claim into a visible demo.
- [ ] **Plugin contract example** — add `doclets query` / `doclets topics`
      to `spec/allspeak-plugin-contract.md` as the worked example of the
      compile/run plugin pattern.
- [ ] **Full-stack conformance test** — client ⇄ MQTT ⇄ server ⇄ plugin in
      `conformance/` (currently covers scripts only).
- [ ] **Demo video** — whitepaper §7.4 placeholder should feature the Doclets
      client.

## Learn curriculum (whitepaper §7.5 + website)

Status: drafted in this session; deploy pending.

- [x] **Whitepaper §7.5** added ("The Learn curriculum: documentation as demonstration") to
      `documents/whitepaper.md`; `whitepaper.html` regenerated with `python3 md-to-html.py`.
- [x] **Website Learn links** added to the live site: `deploy/{en,de,fr,it}/nav.md` and
      `topnav.md` (button beside Primer → `../learn/`) and the "Where do I start?" sections
      of `deploy/{en,de,fr,it}/home.md` (incl. JSON-LD FAQ answers). Note: an initial attempt
      in `resources/ecs/main.as` was reverted — `resources/` is a superseded site generation
      that the deploy pipeline never ships (deploy-allspeak mirrors only codex/, learn/, primer/).
- [x] **French pilot (first draft)** — `learn/fr/` with the full curriculum (18 reference +
      13 idioms pages + contents/manifest/strings.json), the reader made language-aware
      (`learn/reader.as` + `learn/index.html`: `?lang=fr` → `fr/` tree, UI strings per
      language; English stays at the root for backward compat). Mirrored to `deploy/learn/fr/`.
- [x] **German + Italian first drafts** — same structure under `learn/de/` and `learn/it/`
      (no codex/it exists, so IT relied on the pack alone). Draft-translation banners
      ("traduction en cours / Übersetzung in Arbeit / Traduzione in corso" → GitHub issues)
      added to all three non-English contents pages. `deploy/{de,it}` nav/home links and the
      primer TabLearn now point at `?lang=de` / `?lang=it`.
- [x] **Directive correction** — the language directive word is English `language` in ALL
      packs (`language français` / `language italiano` / `language deutsch`); the pages
      originally used `langage`/`lingua`/`sprache` — fixed across the trees.
- [x] **DE case-sensitivity note** — German nouns are capitalized in prose but the
      tokenizer is case-sensitive: code uses lowercase (`der fehler`, `der inhalt`), noted
      on the DE errors page. IT/FR verified clean; all three languages pass the
      compile-check scan (no untranslated EN keywords).
- [ ] **Review the FR pilot** — read `learn/fr/` (start with `contents.md` + a few reference
      pages) to judge quality before committing to IT/DE. Prose is informal "tu" register.
- [ ] **Runtime i18n gaps surfaced by the pilot** (docs currently use English forms with
      notes where French doesn't compile; fixing these is follow-up work):
      - MQTT plugin is not French-aware at all (FR pack has MQTT opcodes but the plugin
        matches literal English tokens; `on mqtt …`, `send to`, `init … name`, block clauses).
      - `debug` suffixes: only `debug step` / `debug stop` work (FR pack advertises
        `debug pas` / `debug arrête` but Core.js Debug checks literal `step`/`stop`).
      - `stack` / `push` / `pop` have no FR keywords (FR pack lacks STACK/PUSH/POP opcodes;
        words map has `empile`/`dépile` but no registration).
      - `the error` value: `le erreur` works; the apostrophe form `l'erreur` isn't tokenized.
      - REST: `rest obtiens` / `rest poste` work; `rest put` / `rest delete` stay English.
- [ ] **Claims are honest.** §7.5 states Learn is currently English-only (no multilingual
      claim) and that the reader is itself an AllSpeak app — both true. Verify the rendered
      page reads correctly before shipping.
- [ ] **Deploy the website** (`deploy-allspeak`) so the sidebar button + home mention go live;
      verify the sidebar shows the Learn button.
- [ ] **Multilingual Learn** (FR/DE/IT) — follow-up; §7.5 already frames it as the natural
      next candidate for the Section 6 pipeline. Do not imply it exists yet.

## Files touched by the initial draft (for review)

- `documents/whitepaper.md` — §7.2 rewritten (Doclets primary, Account as scale data point)
- `documents/whitepaper.html` — §7.2 hand-synced to match the .md
- `resources/md/doclets.md` — new page content
- `resources/ecs/doclets.as` — new page module
- `resources/ecs/main.as` — nav wiring (Doclets button + module)
- `resources/md/examples.md` — list entry + section
- `documents/outreach-plan.md` — state line updated
