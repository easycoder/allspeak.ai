# Project Overview (for AI)

## What this repo is
Doclets is a searchable note/doclet system with:
- AllSpeak scripts for app logic and UI flow
- a Python doclet server/plugin for data access
- MQTT for request/response communication
- browser UI rendered from Webson JSON

## Key files
- `doclets-js.as`: main JS/browser reader behavior in AllSpeak
- `doclets.json`: Webson UI layout
- `docletServer.as`: server-side AllSpeak script
- `as_doclets.py`: Python plugin with doclet search logic
- `codex/codex.as`: substantial reference script for AllSpeak constructs and script-structure patterns
- `Browser.js`, `Core.js`, `JSON.js`, etc.: AllSpeak JS runtime modules
- `Webson.js`: Webson renderer used by AllSpeak browser render command

## Main design choices
- High-level behavior lives in AllSpeak scripts
- MQTT is the preferred path for low-latency interaction
- Webson is the preferred way to define/build screens

## External references
- AllSpeak repo: https://github.com/allspeak/allspeak.github.io
- Webson repo (older, README still relevant): https://github.com/allspeak/webson
- AllSpeak Codex intro: https://allspeak.github.io

## Current practical workflow
- Keep local JS runtime files as symlinks in this repo
- Build AllSpeak dist in allspeak repo using `build-allspeak`
- For debugging runtime errors, prefer unminified `allspeak.js`
