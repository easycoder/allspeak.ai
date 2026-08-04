# Doclets

Doclets is a searchable note/document system for a small team, and the fullest example of the ~ec~ model in one small system. The browser client and the MQTT-connected server are both written in ~ec~ script; the screens are declared as Webson JSON; and the heavy logic lives in a native plugin behind simple script commands. It is client–server development without a conventional web framework and without a separate client language.

The live application runs at <https://doclets.eclecity.net>. The source is in the [Doclets repository](https://github.com/easycoder/doclets).

## One language, full stack

The client (~code:doclets.as~) renders its screens from Webson JSON and talks to the server entirely by MQTT request/reply: no polling, no hand-written API layer. The server (~code:docletServer.as~) is a short ~ec~ script that subscribes to a topic, queues incoming messages, and dispatches each action:

```
on mqtt message append the mqtt message to MessageQueue
...
if Action is `topics` gosub to GetTopics
else if Action is `query` gosub to DoQuery
else if Action is `view` gosub to GetDoclet
```

## Declarative UI via Webson

Screens are JSON, not hand-written DOM code. A screen is described in ~code:doclets.json~ with element IDs, styling, and layout; the ~ec~ script attaches to those IDs and wires the behaviour. Because the layout is data, an AI tool or a non-specialist can produce or adjust a screen without touching the script.

## A clear plugin boundary

You can see exactly where the scripting language stops and the host runtime begins. The heavy logic — file management, plain and semantic search, local-LLM query and ranking, per-topic access control — lives in the Python plugin ~code:as_doclets.py~, exposed to the script as simple commands:

```
doclets topics TopicsList from ReceivedMessage
doclets query ResultList from ReceivedMessage
```

## Local-LLM search (experimental)

The query bar has two buttons — Plain query and LLM query. Synthesis questions ("summarize what these doclets cover") are answered by a local Ollama model from the doclets' subject lines; semantic searches with no literal match are retrieved by embedding similarity over a per-topic cached index, then ranked by the model. If the model declines, the embedding-retrieved candidates are returned anyway, so a fickle model cannot turn a good query into "no results".

## Genuinely incremental

Semantic LLM search and per-topic access control were added to Doclets as features, not rewrites — the architecture absorbed both. That is the ~ec~ promise: features grow on top of a readable core instead of restructuring it.

## Multilingual-ready

~ec~ separates language from logic. The same Doclets architecture can be re-expressed in French, German, or Italian — the keywords resolve automatically through the language pack, and only the script text and user-visible strings need to be authored in the target language.

## Fits small teams

Token-based identity, a browser-only client, and a single Python process behind a static host. No database server, no build pipeline, no mobile app.
