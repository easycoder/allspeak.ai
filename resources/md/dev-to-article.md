# I Built an Italian Programming Language in a Day — Here's Why That Matters

*What happens when you make a scripting language that works in any human language, and let AI do the heavy lifting?*

---

## The Experiment

Last week I took an English-like scripting language I'd been building for years and, with the help of Claude Code, produced a fully working Italian variant — complete with documentation — in a single day.

Not a translation layer. Not string substitution. A genuine Italian programming language where you write:

```
language it

variabile Messaggio
metti `Ciao dal mondo!` in Messaggio
registra Messaggio
```

instead of:

```
variable Message
put `Hello from the world!` into Message
log Message
```

Both compile to the same internal representation. Both run on the same engine. The Italian version isn't a wrapper around the English one — it's an equal peer.

The language is called [AllSpeak](https://allspeak.ai), and the multilingual capability changes what's possible with AI-assisted development.

---

## Why Does This Matter?

There are roughly 1.5 billion English speakers in the world. There are roughly 6.5 billion who aren't.

Every mainstream programming language uses English keywords. `if`, `while`, `function`, `return` — these are English words. For a French speaker, a Japanese speaker, or an Arabic speaker, learning to code means first learning to think in someone else's language.

AI is changing who can code. But if the output is always in English, we've just moved the barrier — from "can you write syntax?" to "can you read English syntax?"

AllSpeak removes that barrier entirely.

---

## How It Works

AllSpeak uses **language packs** — JSON files that map each human language's keywords, grammar patterns, and connector words to a shared set of internal opcodes.

Here's a simplified look at the English pack:

```json
{
  "opcodes": {
    "ADD": {
      "keyword": "add",
      "patterns": ["add {value} to {variable}"]
    },
    "PUT": {
      "keyword": "put",
      "patterns": ["put {value} into {variable}"]
    }
  },
  "words": {
    "while": "while",
    "if": "if",
    "into": "into"
  }
}
```

And the Italian equivalent:

```json
{
  "opcodes": {
    "ADD": {
      "keyword": "aggiungi",
      "patterns": ["aggiungi {value} a {variable}"]
    },
    "PUT": {
      "keyword": "metti",
      "patterns": ["metti {value} in {variable}"]
    }
  },
  "words": {
    "while": "mentre",
    "if": "se",
    "into": "in"
  }
}
```

The opcode IDs stay constant. The compiler reads the active language pack and maps surface syntax to internal commands. At runtime, there is no difference — an Italian script and an English script produce identical bytecode.

---

## A Real Example: Side by Side

Here's a prime number finder in English:

```
script Primes

variable Candidate
variable Divisor
variable Remainder
variable Found
variable Square

put 0 into Found
put 2 into Candidate

while Found is less than 20
begin
    put 2 into Divisor
    multiply Divisor by Divisor giving Square
    while Square is less than Candidate
    begin
        put Candidate into Remainder
        divide Remainder by Divisor
        multiply Remainder by Divisor
        take Remainder from Candidate giving Remainder
        if Remainder is 0 go to NextCandidate
        add 1 to Divisor
        multiply Divisor by Divisor giving Square
    end
    log Candidate
    add 1 to Found
NextCandidate:
    add 1 to Candidate
end
```

And in Italian:

```
language it

script Primi

variabile Candidato
variabile Divisore
variabile Resto
variabile Trovati
variabile Quadrato

metti 0 in Trovati
metti 2 in Candidato

mentre Trovati è minore di 20
inizio
    metti 2 in Divisore
    moltiplica Divisore per Divisore dando Quadrato
    mentre Quadrato è minore di Candidato
    inizio
        metti Candidato in Resto
        dividi Resto per Divisore
        moltiplica Resto per Divisore
        togli Resto da Candidato dando Resto
        se Resto è 0 vai a ProssimoCandidato
        aggiungi 1 a Divisore
        moltiplica Divisore per Divisore dando Quadrato
    fine
    registra Candidato
    aggiungi 1 a Trovati
ProssimoCandidato:
    aggiungi 1 a Candidato
fine
```

Both produce the same output: the first 20 prime numbers. An Italian speaker reading the second version understands exactly what it does — no English required.

---

## The AI Angle

AllSpeak was originally designed for readability — code that reads like natural language so that non-programmers can follow what's happening. But the multilingual architecture turns out to be a perfect fit for AI-assisted development.

**Why?**

1. **AI generates correct AllSpeak almost every time.** The grammar is constrained and consistent. There are no semicolons, no curly braces, no type declarations. Claude Code gets it right on the first attempt far more often than with JavaScript or Python.

2. **You can read what the AI wrote.** Even a non-programmer can look at `metti il contenuto di Campo in Nome` and understand it means "put the content of Field into Name."

3. **AI can work in any language the user speaks.** Give Claude Code the Italian language pack and a brief explanation, and it writes Italian AllSpeak scripts fluently.

4. **There is no build system.** Browser applications are a single HTML file and a script. CLI applications are a single `.as` file. No npm, no webpack, no virtual environments.

> **Key insight:** The limiting factor in AI-assisted development is not the AI's ability to generate code — it's the human's ability to understand and maintain what the AI produces. AllSpeak removes that bottleneck. The multilingual layer extends this to the 80% of the world that doesn't speak English.

There's something deeper here too. Working with AI isn't just doing what you always did, but faster. It's a fundamentally different way of working. Traditional development tends to be bottom-up: you define your data structures, write your utility functions, build your components, and gradually assemble them into a working system. You start with what you can hold in your head.

AI-assisted development inverts this. You start at the top — describe the whole application, sketch out the flow, name the pieces — and then drill down into the details. The AI generates a working skeleton from your high-level description, and you refine from there. With AllSpeak, this feels even more natural: you're describing what you want in something close to plain language, and the AI fills in the structure underneath.

This isn't a minor productivity gain. It changes *how you think about the problem*.

---

## What AllSpeak Is Best Suited For

AllSpeak is not trying to replace Python or JavaScript. It occupies a specific niche:

- **Internal tools and dashboards** — forms, data viewers, admin panels
- **Personal productivity apps** — task lists, habit trackers, timers
- **Prototyping** — working demos before committing to a full stack
- **Education** — where tooling complexity is a distraction from learning
- **Automation scripts** — file processing, report generation, data transformation
- **IoT and kiosk applications** — single-purpose apps with predictable state

For anything requiring deep OS integration or complex UI component trees, use a mainstream language. AllSpeak handles the human-level logic — flow, decisions, user interaction — while plugins handle the heavy lifting in native code.

---

## The Workflow

The recommended development setup uses three tools:

1. **Claude Code** — Anthropic's agentic CLI tool, for writing and modifying AllSpeak scripts
2. **AllSpeak Editor** — a browser-based editor with syntax highlighting, auto-save, and file browsing
3. **AllSpeak runtime** — `pip install allspeak-ai` for CLI, or a single `<script>` tag for browser apps

The editor and Claude Code work on the same files on disk. Claude Code handles larger changes; the editor handles quick tweaks and code review. Changes sync automatically.

### Getting started is just a few easy steps:

```bash
mkdir myproject && cd myproject
pip install -U allspeak-ai
# Download the starter pack for your language from allspeak.ai
unzip code-xx.zip # where xx is your language code
```

Then launch Claude Code and say: "I want to build a weather dashboard."

---

## Adding a New Language

This is the part that surprised me.

Creating the Italian variant required:

1. **A language pack JSON file** — mapping ~150 opcodes and ~80 connector words to Italian equivalents
2. **Compiler adjustments** — making the parser read the active language pack instead of hardcoded English keywords
3. **Runtime adjustments** — ensuring error messages, diagnostics, and status output respect the active language
4. **Documentation** — translating the primer, tutorial content, and editor UI

With Claude Code doing the heavy lifting, and me providing Italian knowledge and reviewing the output, the whole thing took a day.

The process for adding a third language (Spanish, French, German, Japanese, Arabic...) is now well-understood:

- **A native speaker with basic programming familiarity** can create a new variant in a few days
- **No deep expertise required** — the contributor needs to understand the concepts (variables, loops, conditions), not the implementation
- **The engine doesn't change** — only the language pack and documentation need to be created

---

## What's Next

AllSpeak is open source and actively looking for contributors — particularly native speakers who want to bring programming to their language community.

If you speak a language that isn't English and you've ever wished you could code in your own words, this is your chance to make that real. Not just for yourself, but for every speaker of your language.

**Get started:**

- [AllSpeak website](https://allspeak.ai) — overview, primer, and AI manual
- [GitHub](https://github.com/easycoder/allspeak.ai) — source code and language packs
- [Claude Code](https://claude.ai/claude-code) — the AI assistant that makes it practical
- Email: info@allspeak.ai

---

*AllSpeak is named after the Asgardian ability to communicate in any language. It started as an English-only scripting language called EasyCoder. The multilingual architecture was added in April 2026 with AI assistance.*
