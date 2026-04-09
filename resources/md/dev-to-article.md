# AI Doesn't Need Your Programming Language

*Why the future of code is simpler than you think — and why that matters for everyone, not just non-English speakers.*

---

## The Question Nobody's Asking

Here's something odd about the current AI coding revolution: we're using AI to generate JavaScript, Python, TypeScript — languages that were designed for *humans* to write. But humans aren't writing the code any more. The AI is.

So why are we still optimising for human writability?

The answer, of course, is that humans still need to *read* the code — to verify it, debug it, and maintain it. But here's the thing: the languages we use make that harder than it needs to be. A hundred lines of React with hooks, closures, and async/await is not easy for a human to verify. It wasn't easy when a human wrote it. It's certainly not easy when an AI wrote it and you're trying to decide whether to trust it.

What if the AI wrote in something simpler?

---

## The Case for Simpler Languages

This isn't about dumbing things down. It's about recognising that the economics of code have changed.

**AI makes fewer mistakes in constrained grammars.** Give an LLM a language with a small, consistent vocabulary and no syntactic ambiguity, and its error rate drops dramatically compared to JavaScript or Python. Fewer mistakes means less debugging, less rework, less cost.

**AI uses fewer resources with simpler output.** Generating 30 lines of readable script costs less in tokens than generating 200 lines of framework code that does the same thing. At scale, this is a real cost difference.

**Humans can actually verify simple code.** This is the critical point. The value of AI-generated code is zero if you can't tell whether it's correct. A non-specialist can look at:

```
on click SaveButton
begin
    put the content of NameField into Name
    rest post Name to `/api/save`
    set the content of Status to `Saved`
end
```

...and know exactly what it does. Try that with the equivalent React component.

**Simple languages can be made fast.** A high-level scripting language that compiles to WebAssembly or C would be indistinguishable in performance from today's mainstream languages for most applications. The simplicity is in the surface syntax, not the execution model.

---

## Where This Is Heading

Let me make a prediction that might be uncomfortable:

Before long, most code will be written by AI and validated — if at all — by humans. The role of the human shifts from *author* to *reviewer*. And reviewers need readable code far more than authors do.

When that happens, the value proposition of complex languages changes. JavaScript's flexibility, Python's ecosystem depth, TypeScript's type system — these are advantages for human authors. For AI authors with human reviewers, they're liabilities. They increase the surface area for errors and make verification harder.

What you want instead is a lingua franca — something simple enough that AI rarely gets it wrong, readable enough that humans can verify it at a glance, and powerful enough to build real applications. The complex languages don't disappear, but they move to the edges: systems programming, performance-critical code, specialised domains. The broad middle — the apps, the tools, the dashboards, the automations — gets written in something more like natural language.

This isn't science fiction. It's already starting.

---

## AllSpeak: A Working Example

[AllSpeak](https://allspeak.ai) is a scripting language built around this idea. Instead of:

```javascript
document.getElementById('myButton').addEventListener('click', function() {
    document.getElementById('output').style.backgroundColor = 'pink';
});
```

you write:

```
on click MyButton
begin
    set style `background` of Output to `pink`
end
```

AllSpeak runs in two environments:

- **In the browser** — load a single JavaScript file, write scripts in your HTML
- **As a command-line tool** — `pip install allspeak-ai`, run `.as` files directly

No build step. No package manager. No framework. One file in, working application out.

### Why AI loves it

Claude Code generates correct AllSpeak on the first attempt almost every time. The grammar is constrained and consistent — no semicolons, no curly braces, no type declarations, no ambiguous syntax. When it does make a mistake, the error is obvious and easy to fix.

And because AllSpeak scripts are short and readable, Claude Code can re-read its own output and make targeted changes. This is fundamentally different from asking an AI to modify 500 lines of opaque JavaScript.

### Working with AI changes how you think

There's something deeper here too. Traditional development is bottom-up: define your data structures, write your utilities, build your components, assemble them into a system. You start with what you can hold in your head.

AI-assisted development inverts this. You start at the top — describe the whole application, sketch out the flow, name the pieces — and drill down into the details. The AI generates a working skeleton from your high-level description, and you refine from there. With AllSpeak, this feels natural: you're describing what you want in something close to plain language, and the AI fills in the structure underneath.

This isn't a minor productivity gain. It changes *how you think about the problem*.

---

## And Then It Gets Interesting: Any Language

Once you have a simple, readable scripting language, something unexpected becomes possible. If the surface syntax is just a mapping from human words to internal opcodes, why does it have to be English?

AllSpeak uses **language packs** — JSON files that map keywords, grammar patterns, and connector words to a shared set of internal commands. The English pack maps `put` to the PUT opcode. The Italian pack maps `metti`. Both compile to identical bytecode.

Last week, with Claude Code doing the heavy lifting and me providing Italian knowledge, I built a fully working Italian variant — complete with documentation — in a single day.

Here's what the same program looks like in both languages:

**English:**
```
variable Message
put `Hello from the world!` into Message
log Message
```

**Italian:**
```
language it

variabile Messaggio
metti `Ciao dal mondo!` in Messaggio
registra Messaggio
```

Same engine. Same bytecode. An Italian speaker reads the second version and understands it immediately — no English required.

There are roughly 1.5 billion English speakers in the world. There are roughly 6.5 billion who aren't. Every mainstream programming language uses English keywords. AllSpeak removes that barrier.

But here's what matters for English-speaking developers too: the architecture that makes multilingual programming possible is the *same* architecture that makes AI-friendly programming possible. The constraint, the simplicity, the clean mapping from intent to behaviour — those properties serve both goals simultaneously.

---

## Adding a New Language

This is the part that surprised me.

Creating the Italian variant required:

1. **A language pack JSON file** — mapping ~150 opcodes and ~80 connector words
2. **Compiler adjustments** — making the parser read the active language pack instead of hardcoded English
3. **Runtime adjustments** — localised error messages and status output
4. **Documentation** — translating the primer and editor UI

The process for adding a third language is now well-understood:

- **A native speaker with basic programming familiarity** can create a new variant in a few days
- **No deep expertise required** — understand variables, loops, and conditions, not the engine internals
- **The engine doesn't change** — only the language pack and docs

---

## What AllSpeak Is Best Suited For

AllSpeak is not trying to replace Python or JavaScript. It occupies the broad middle:

- **Internal tools and dashboards** — forms, data viewers, admin panels
- **Personal productivity apps** — task lists, habit trackers, timers
- **Prototyping** — working demos before committing to a full stack
- **Education** — where tooling complexity distracts from learning
- **Automation scripts** — file processing, report generation, data transformation
- **IoT and kiosk applications** — single-purpose apps with predictable state

For deep OS integration or complex UI component trees, use a mainstream language. AllSpeak handles the human-level logic — flow, decisions, user interaction — while plugins handle the heavy lifting in native code.

---

## The Workflow

The recommended setup uses three tools:

1. **Claude Code** — Anthropic's agentic CLI, for writing and modifying AllSpeak scripts
2. **AllSpeak Editor** — browser-based editor with syntax highlighting, auto-save, and file browsing
3. **AllSpeak runtime** — `pip install allspeak-ai` for CLI, or a single `<script>` tag for browser apps

Getting started:

```bash
mkdir myproject && cd myproject
pip install -U allspeak-ai
# Download the starter pack for your language from allspeak.ai
unzip allspeak-xx.zip # where xx is your language code
```

Then launch Claude Code and say: "I want to build a weather dashboard."

---

## What's Next

AllSpeak is actively looking for contributors — particularly native speakers who want to bring programming to their language community. But also developers who are interested in the broader question: what does programming look like when AI writes most of the code and humans are primarily reviewers?

The answer might be simpler than any of us expected.

**Get started:**

- [AllSpeak website](https://allspeak.ai) — overview, primer, and AI manual
- [Claude Code](https://claude.ai/claude-code) — the AI assistant that makes it practical
- Email: info@allspeak.ai

---

*AllSpeak is named after the Asgardian ability to communicate in any language. It started as an English-only scripting language called EasyCoder. The multilingual architecture was added in April 2026 with AI assistance.*
