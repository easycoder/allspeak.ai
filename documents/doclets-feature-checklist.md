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

## Files touched by the initial draft (for review)

- `documents/whitepaper.md` — §7.2 rewritten (Doclets primary, Account as scale data point)
- `documents/whitepaper.html` — §7.2 hand-synced to match the .md
- `resources/md/doclets.md` — new page content
- `resources/ecs/doclets.as` — new page module
- `resources/ecs/main.as` — nav wiring (Doclets button + module)
- `resources/md/examples.md` — list entry + section
- `documents/outreach-plan.md` — state line updated
