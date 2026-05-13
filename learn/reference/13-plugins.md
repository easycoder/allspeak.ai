# Plugins

A plugin is an external domain — a unit of code, usually JavaScript or Python, that contributes new vocabulary, types, conditions, and runtime behaviour to AllSpeak without being part of the bundled runtime. Plugins follow the same contract as the bundled domains (Core, Browser, REST, MQTT, …); the loader treats them identically.

Use a plugin when:

- A body of specialised functionality (graphics, hardware integration, third-party APIs) is large enough to deserve its own vocabulary.
- The functionality needs to call out to native code (browser APIs, system libraries) that AllSpeak can't reach directly.
- The functionality is performance-critical and needs to run at native speed.
- The functionality should be optional — loaded only when a script needs it.

Use a [module](modules.md) instead when the extension is pure AllSpeak and doesn't introduce new vocabulary.

## Performance: the mixed-stack principle

A common objection to running an interpreted language on top of another interpreted language (AllSpeak on JS, or AllSpeak on Python) is that the layering will be too slow. The objection has a kernel of truth, but it misses the pattern that plugins enable.

In most applications, performance only matters in a small part of the code. The bulk — UI plumbing, state transitions, control flow, message routing — is far better served by readability and maintainability than by raw speed. Optimising those parts for speed is bad engineering even when it's possible.

What does matter is the hot path: the inner loop of a graphics renderer, the FFT in a signal processor, the layout pass over thousands of points. For those, AllSpeak hands off to a plugin written in JavaScript or Python — code that runs at the same speed as any plugin written in the same language for any other framework.

The result: AllSpeak script for the bulk (readable, maintainable, multilingual), plugins for the hot path (full native speed). The performance of the resulting application is close to what an all-native build would deliver, but the codebase is substantially more readable and maintainable.

This is a core architectural principle of AllSpeak, not an after-the-fact rescue. The plugin mechanism exists *because* the design assumes mixed-stack development; it isn't a feature bolted on to cover for the interpreted layer's limits.

## The contract

Both runtimes follow a shared plugin contract documented in [`spec/allspeak-plugin-contract.md`](../../spec/allspeak-plugin-contract.md). A plugin is a registered domain that exposes:

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

The class derives from a `Handler` base and provides keyword methods with the standard `k_<token>` / `r_<token>` naming, plus `compileValue()`/`v_<type>` and `compileCondition()`/`c_<type>` for values and conditions respectively. See the plugin contract for the exact method names.

## Bundled JS plugins

In `/js/plugins/`:

- **`ui`** — additional UI vocabulary (date pickers, panes, etc.).
- **`svg`** — SVG drawing.
- **`gmap`** — Google Maps.
- **`float`** — extended floating-point support (where the integer-first model is too restrictive).
- **`anagrams`**, **`life`** — example plugins demonstrating the contract.

MQTT started life as a plugin and was later promoted to a bundled domain. The same path is available to any plugin that proves widely useful.

## Plugins vs modules

| | Plugin | Module |
|---|--------|--------|
| Language | JS / Python | AllSpeak (`.as`) |
| Adds vocabulary | Yes | No |
| Reaches native APIs | Yes | No (only via plugins) |
| Loaded by | `<script>` tag (JS) or `import plugin` (Py) | `run <path> as <name>` |
| Communication | Direct calls via vocabulary | Message-passing (`send` / `on message`) |
| Best for | Specialised tech (graphics, hardware) | Large chunks of pure script logic |

A plugin extends the language; a module extends the application. Both have their place.

## Anti-pattern: plugin for pure AllSpeak logic

If the work could have been written in AllSpeak, a [module](modules.md) is usually the better choice — modules are self-contained, debuggable from inside AllSpeak, and don't require native build steps. Plugins are for when AllSpeak can't directly express what's needed.

## Anti-pattern: monolithic plugins

A 5000-line plugin that does graphics, networking, and storage is a sign the boundary has been drawn too widely. Split into focused plugins (each owning one concern), and let the script load only the ones it needs.

## Related

- [structure](structure.md) — domains and the compile-tries-each-domain model.
- [modules](modules.md) — the AllSpeak-side extension mechanism.
- The plugin contract spec: `spec/allspeak-plugin-contract.md`.
