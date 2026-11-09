# Plugins

A plugin is an external domain — a unit of code, usually JavaScript or Python, that contributes new vocabulary, types, conditions, and runtime behaviour to AllSpeak without being part of the bundled runtime. Plugins follow the same contract as the bundled domains (Core, Browser, REST, MQTT, …); the loader treats them identically.

Use a plugin when:

- A body of specialised functionality (graphics, hardware integration, third-party APIs) is large enough to deserve its own vocabulary.
- The functionality needs to call out to native code (browser APIs, system libraries) that AllSpeak can't reach directly.
- The functionality is performance-critical and needs to run at native speed.
- The same mechanism is repeated across scripts and is awkward or verbose in AllSpeak.
- The functionality should be optional — loaded only when a script needs it.

Use a [module](modules.md) instead when the extension is pure AllSpeak **policy** — business rules, flow, decisions — and doesn't introduce new vocabulary.

## Performance: the mixed-stack principle

A common objection to running an interpreted language on top of another interpreted language (AllSpeak on JS, or AllSpeak on Python) is that the layering will be too slow. The objection has a kernel of truth, but it misses the pattern that plugins enable.

In most applications, performance only matters in a small part of the code. The bulk — UI plumbing, state transitions, control flow, message routing — is far better served by readability and maintainability than by raw speed. Optimising those parts for speed is bad engineering even when it's possible.

What does matter is the hot path: the inner loop of a graphics renderer, the FFT in a signal processor, the layout pass over thousands of points. For those, AllSpeak hands off to a plugin written in JavaScript or Python — code that runs at the same speed as any plugin written in the same language for any other framework.

The result: AllSpeak script for the bulk (readable, maintainable, multilingual), plugins for the hot path (full native speed). The performance of the resulting application is close to what an all-native build would deliver, but the codebase is substantially more readable and maintainable.

This is a core architectural principle of AllSpeak, not an after-the-fact rescue. The plugin mechanism exists *because* the design assumes mixed-stack development; it isn't a feature bolted on to cover for the interpreted layer's limits.

**The split is policy and mechanism.** Keep the policy — what the application decides, in what order, for whom — in AllSpeak, where a human can review it. Move the mechanism — parsing, indexing, arithmetic, protocol handling, rendering, the inner loop — into a plugin when it is repeated, measured hot, or needs a library AllSpeak cannot reach. The shorthand is *thin readable shell, thick tested kernel*: the layer a person reviews stays small and declarative, and the layer that needs libraries or speed lives behind a small vocabulary.

## Deciding to extract

Try the options in this order before writing a plugin:

1. **A built-in command.** Check the core vocabulary and the standard domains first. A command that already exists costs nothing and needs no new vocabulary.
2. **An existing plugin.** Check the bundled plugins and the project's own before adding another. Two plugins that do the same thing are two things to learn.
3. **A module.** If the work is pure AllSpeak policy that needs its own state and namespace, extract a [module](modules.md) instead. Modules stay in the language a reviewer reads, and they are much cheaper to add.
4. **A plugin.** If the work is a mechanism that is repeated, measured hot, or native-only, put it behind a plugin. That is the case this page is about.
5. **An external service.** If the work is long-running, owns a hardware or security boundary, or speaks its own protocol, keep it in a separate process and expose a thin command over it. The controller's Zigbee bridge is a service; a script's `rest` or `process` call is the thin edge.
6. **Nothing.** If it is a one-off, keep it inline. A plugin is a vocabulary commitment; a single use does not repay it.

**Signals that a plugin is the right answer:**

- A profile or a recording shows one loop or one subroutine dominating the run.
- The same twenty to fifty lines of low-level AllSpeak appear in three or more scripts.
- The code exists mainly to work around a missing native API or library.
- A module has become a de facto domain: its vocabulary is stable and other scripts want it.
- The AI keeps getting the same mechanism wrong, and a small vocabulary would remove the error surface.
- The block is large, mechanical and token-heavy, and its details are not what a reviewer needs to see.

**Signals that it is not:**

- The work is business policy or flow — the layer a human reviews.
- It is used once.
- The vocabulary is still changing.
- It must run in both runtimes and cannot be given a shared interface.
- The plugin would have to be loaded by every script.
- The code is readable and fast enough.

**What a plugin costs.** A plugin is a vocabulary commitment, not just a file. It costs:

- **A name and a grammar** a reader must learn, and a language-pack entry if it is multilingual.
- **A second implementation and test surface**, plus a contract to keep as the runtime changes.
- **Packaging and deployment**: a JS plugin is a file the page must load; a Python plugin is a module the script must `import plugin`, or a bundled domain that must be present.
- **Cross-runtime divergence**: a plugin that exists in one runtime makes every script that uses it dialect-specific.
- **A review boundary**: the plugin's internals are no longer in the Blocks view, so its own docs and tests have to carry the intent.
- **Python's `modifyValue` hook**, which every registered domain must implement (see the contract).

For the practical procedure, a worked example and a review checklist, see [extracting a plugin](../idioms/extracting-a-plugin.md).

## The contract

Both runtimes follow a shared plugin contract documented in [`spec/allspeak-plugin-contract.md`](https://github.com/easycoder/allspeak.ai/blob/master/spec/allspeak-plugin-contract.md). A plugin is a registered domain that exposes:

- **Keyword handlers** — `compile(...)` for parse-time, `run(...)` for execute-time.
- **Value compilers / runners** — for new value types (e.g. `the gps position`).
- **Condition compilers / testers** — for domain-specific conditions (e.g. `if Subscriber is connected`).

Missing handlers are allowed — a plugin doesn't have to implement every capability. The runtime dispatches based on what's registered.

## JavaScript plugins

A JS plugin registers itself by attaching to `AllSpeak.domain`:

```js
AllSpeak.domain.gmap = {
    name: 'AllSpeak_GMap',
    getHandler: function(token) { ... },
    run: function(program) { ... },
    value: {
        compile: function(compiler) { ... },
        get: function(program, value) { ... }
    },
    condition: {
        compile: function(compiler) { ... },
        test: function(program, condition) { ... }
    }
};
```

Plugins ship as separate `.js` files in `/dist/plugins/`. A page that uses one loads it via a `<script>` tag alongside the AllSpeak runtime.

## Python plugins

A Python plugin is loaded explicitly at script run-time:

```as
import plugin GMap from `gmap.py`
```

This is different from `use <domain>`. `use graphics` and `use process` load **bundled** domains that ship with the runtime; `import plugin` loads a **project-local or third-party** plugin from a file beside the script. Use `use` for a domain the runtime already carries, and `import plugin` for one your project brings.

The class derives from a `Handler` base and provides keyword methods with the standard `k_<token>` / `r_<token>` naming, plus `compileValue()`/`v_<type>` and `compileCondition()`/`c_<type>` for values and conditions respectively. See the plugin contract for the exact method names.

Two Python-specific rules:

- **`modifyValue` is required.** Every registered domain is asked to modify every compiled value (`as_value.py`'s `checkDomainAdditions`). A domain that does not define it raises `AttributeError` on the first value a script compiles. Return the value unchanged when the domain has nothing to add. The JavaScript twin of the hook is guarded, so the omission is invisible there and only Python refuses.
- **Keep the platform half separate from the vocabulary half.** The `idb-core.js`/`idb.js` and `photo-core.js`/`photo.js` pattern applies in Python too: a module or class that does the work and can be tested without AllSpeak, and a thin handler that exposes the words. That is what makes the plugin testable and the vocabulary small.

A Python plugin is a file in the project (or an installed package) and travels with the script that imports it. It is not discovered from a registry; the `import plugin` line is the dependency.

## Bundled JS plugins

In `/js/plugins/`:

- **`idb`** — IndexedDB: persistent, transactional storage, with declarative schema upgrades, atomic batches, cursors, blobs and the Storage API. [Its own page](indexeddb.md).
- **`photo`** — photographs: a file, URL or canvas in, resized and EXIF-stripped bytes out, with display URLs, a download and a bridge to `idb`'s blob handle. [Its own page](photo.md).
- **`svg`** — SVG drawing: shapes, paths, groups, text, events.
- **`gmap`** — Google Maps: maps, markers, clicks, bounds. Needs a Google Maps API key.
- **`ui`** — additional UI vocabulary (date pickers, panes, etc.).
- **`vfx`** — animation: an `animation` element, `create … in`, `on`, `set`, `start`, `step`.
- **`float`** — extended floating-point support (where the integer-first model is too restrictive).
- **`anagrams`**, **`life`** — example plugins demonstrating the contract.

The Python runtime's bundled domains — [graphics](graphics.md), [process](processes.md), [clipboard](clipboard.md) and the recorder in [Recordings](recordings.md) — are loaded with `use`, not `import plugin`. They are domains that ship with the runtime, not project-local plugins.

**A plugin gets a page of its own when it adds vocabulary a script author writes in an application** — not when it is an example, and not when a page already covers it. Four are excluded on that rule: `webson`'s `render` is part of the UI path in [Browser and Webson](browser-and-webson.md), `asviz`'s recorder is [Recordings](recordings.md), and `showdown` and `codemirror` are host and editor plumbing rather than application vocabulary. `codemirror-ecs` is a CodeMirror mode, not a domain at all.

That leaves five that qualify and have no page yet — `svg`, `gmap`, `ui`, `vfx`, `float`. The bullets above name their vocabulary until they do, which is deliberate: **the curriculum must not grow one page per plugin**, because the audience leaves at the first steep step and every page is a step. A plugin that a reader actually needs is a plugin worth a page; the rest stay on this one.

A plugin of more than a few hundred lines is usually split into the part that talks to the platform and the part that talks to AllSpeak — `idb` and `photo` are the models: `idb-core.js` is a promise API over the browser's database and `idb.js` is the vocabulary that compiles to it; `photo-core.js` is the image pipeline and `photo.js` the words. The split is what lets the first half be tested in Node, where a real database and a real canvas are cheap, and the second in a browser, where the runtime is.

MQTT started life as a plugin and was later promoted to a bundled domain. The same path is available to any plugin that proves widely useful.

## Plugin, domain, module, service

| | Plugin | Bundled domain | Module | External service |
|---|---|---|---|---|
| What it is | JS / Python code that adds vocabulary | a domain that ships with the runtime | an AllSpeak script | a separate process or protocol |
| Loaded by | `<script>` tag (JS) or `import plugin` (Py) | `use <name>` (Py); bundled in the JS build | `run <path> as <name>` | `rest`, `mqtt`, `process`, `system` |
| Adds vocabulary | Yes | Yes | No | Only through the thin command that reaches it |
| Private state | Native | Native | Yes, by message-passing | Yes, in its own process |
| Communication | Direct calls via vocabulary | Direct calls | Message-passing (`send` / `on message`) | Its own protocol (`rest`, `mqtt`, stdio) |
| Best for | native mechanism, library wrapper, repeated hot path | standard capabilities | pure AllSpeak policy at scale | hardware bridges, long-running work, security boundaries |

The line to remember: **policy in AllSpeak, mechanism in the plugin, isolation in the service.** A plugin extends the language; a module extends the application. Both have their place.

## Anti-pattern: plugin for pure policy

If the work is the application's policy — the rules, the flow, the decisions a human reviews — keep it in AllSpeak, even when it is verbose. A plugin there hides the thing being reviewed and splits the intent across two languages. Use a [module](modules.md) if it needs its own state and namespace.

The question is not "could this be written in AllSpeak?" — almost everything can. The question is "is this **mechanism** (a parser, an index, a numeric kernel, a protocol, a renderer) that is repeated, measured hot, or native-only?" If yes, a plugin is a good home. If it is the policy, it is not.

## Anti-pattern: monolithic plugins

A 5000-line plugin that does graphics, networking, and storage is a sign the boundary has been drawn too widely. Split into focused plugins (each owning one concern), and let the script load only the ones it needs.

## Reviewing existing code

A plugin review is worth doing occasionally — at a release boundary, or when a recording or a profile shows a hot path — but it should be driven by evidence, not by a wish to tidy. A short review:

1. **Collect signals.** A recording or profile that shows one part dominating; the same low-level pattern in three or more scripts; workarounds recorded in `REQUESTS.md`; a script that is mostly mechanical, token-heavy code; a bug class that keeps returning because the language is awkward.
2. **Score the candidates.** Runtime cost, frequency, stability of the vocabulary, cross-runtime need, onboarding cost, testability and packaging.
3. **Extract the top one or two.** Keep the policy in AllSpeak, test the plugin independently, document the boundary, and measure the before/after.
4. **Leave the rest.** A review that extracts five plugins at once is a rewrite in disguise.

See [extracting a plugin](../idioms/extracting-a-plugin.md) for the checklist and a worked example.

## Token and AI efficiency

The mixed-stack principle is usually argued as a runtime-performance point, but it has a second payoff for AI-written code. A plugin gives a repeated mechanism a short, stable vocabulary, so the script that uses it is smaller, cheaper in tokens, and has fewer places for the AI to go wrong. The plugin's own code is written once and tested once; the script repeats one word.

That is a good reason to extract a **stable, repeated** mechanism. It is not a reason to extract every verbose block: a one-off plugin adds a vocabulary the reader must learn and the project must maintain, and the tokens move from the script into the plugin rather than disappearing. Measure both sides.

## Related

- [structure](structure.md) — domains and the compile-tries-each-domain model.
- [modules](modules.md) — the AllSpeak-side extension mechanism.
- [extracting a plugin](../idioms/extracting-a-plugin.md) — when and how to make the move.
- The plugin contract spec: `spec/allspeak-plugin-contract.md`.
