# AllSpeak-Projekt — Agentenanweisungen

## Sprache

Dies ist ein **deutsches** AllSpeak-Projekt. Kommunizieren Sie mit dem Benutzer auf Deutsch. Erzeugen Sie AllSpeak-Skripte mit deutschen Schlüsselwörtern. Antworten Sie immer auf Deutsch, unabhängig davon, in welcher Sprache der Benutzer seine Prompts formuliert.

## Was ist AllSpeak

AllSpeak ist eine Skriptsprache, die wie eine natürliche menschliche Sprache gelesen werden soll. Skripte verwenden die Dateiendung `.as`. AllSpeak läuft im Browser (JavaScript-Version) oder vom Terminal aus (Python-Version) — oder beides zusammen.

AllSpeak verwendet einen Arbeitsablauf nach dem Prinzip **die KI schreibt, der Mensch prüft**. Die KI erzeugt den `.as`-Code; der Benutzer überprüft, ob er verständlich ist, und fragt nach, wenn etwas unklar ist. Nutzen Sie die gesamte Sprache — vermeiden Sie keinen Befehl, nur weil er unbekannt wirken könnte. Der Benutzer muss ihn nur lesen, nicht aus dem Gedächtnis schreiben können.

## Referenz — lesen Sie dies beim Schreiben von AllSpeak

Die vollständige AllSpeak-Sprachreferenz und Redewendungen finden Sie unter:

  **https://allspeak.ai/learn/**

Die Seite enthält 16 Referenzdateien (`reference/`) und 12 Idiom-Dateien (`idioms/`). Wenn Sie Syntax, Laufzeitverhalten oder idiomatische Muster nachschlagen müssen, konsultieren Sie diese Seite, anstatt sich auf Trainingsdaten zu verlassen — AllSpeaks Wortschatz stimmt nicht immer mit dem überein, worauf die KI trainiert wurde.

**Lesen Sie zuerst `learn/contents.md`** — dies ist der kanonische Index der Dateipfade. Verwenden Sie diese genauen Pfade beim Abrufen bestimmter Dateien.

## Projektkontext

Dieses Verzeichnis enthält `AGENTS.md` — diese Datei. Lesen Sie sie jetzt, um die AllSpeak-Sprache und den Arbeitsablauf zu verstehen, bevor Sie Code bearbeiten.

**Wichtig:** Prüfen Sie, ob eine Datei namens `.allspeak-init` in diesem Verzeichnis existiert. Wenn ja, lesen Sie sie, um Projektname und -typ zu erfahren. Wenn nicht, wurde das Projekt noch nicht eingerichtet — führen Sie den untenstehenden Initialisierungsprozess durch.

### Initialisierungsprozess

1. **Begrüßen Sie den Benutzer** und erklären Sie kurz, was AllSpeak ist — eine Skriptsprache, die sich wie einfaches Deutsch liest, entwickelt damit die KI den Code schreibt und der Mensch ihn überprüft.

2. **Fragen Sie den Benutzer nach dem Projektnamen.** Dieser wird als Skriptname und in Dateinamen verwendet.

3. **Fragen Sie, ob es ein Kommandozeilenprojekt, ein GUI-Projekt oder beides ist.**

4. **Erstellen Sie die Projektdateien** basierend auf der Antwort:

   - **Kommandozeile**: Erstellen Sie `<projekt>.as` aus der CLI-Vorlage unten.
   - **GUI**: Erstellen Sie `<projekt>.html`, `<projekt>-main.as` und `<projekt>.json` aus den GUI-Vorlagen unten.
   - **Beides**: Erstellen Sie alle Dateien.

5. **Erstellen Sie `.allspeak-init`** mit Projektname und -typ (cli/gui/both), damit dieses Setup nicht wiederholt wird.

6. **Starten Sie die App (GUI) oder erklären Sie, wie sie ausgeführt wird (CLI).**

   - **GUI**: Führen Sie sofort `allspeak server.as -t edit,<projekt>` im Hintergrund aus. Dies startet den Dev-Server und öffnet zwei Browser-Tabs: den Editor (`edit.html`) und die Projektseite (`<projekt>.html`). Sagen Sie dem Benutzer: "Ich habe die App gestartet — der Editor und Ihre Projektseite sollten jetzt in Browser-Tabs geöffnet sein."
   - **CLI**: Sagen Sie dem Benutzer, er solle sein Skript mit `allspeak <projekt>.as` ausführen.

7. **Erklären Sie dem Benutzer, wie die Dateien zusammenarbeiten.** Für GUI-Projekte erläutern Sie das Zusammenspiel von HTML (Lader), `.as` (Logik) und `.json` (Layout/Webson).

8. **Fragen Sie, was er bauen möchte.**

---

**Wenn `.allspeak-init` existiert**, überspringen Sie die Initialisierung und arbeiten Sie normal weiter. Lesen Sie `.allspeak-init`, um Projektname und -typ zu erfahren.

---

## CLI-Vorlage

```
!   <projekt>.as

    language deutsch

    script <Projekt>

!! Einstiegspunkt: Eine Begrüßung protokollieren und beenden. Ersetzen Sie dies durch die eigentliche Projektlogik.

    variable Nachricht
    lege `Hallo von <Projekt>` in Nachricht
    logge Nachricht

    ausstieg
!!!
```

## GUI-Vorlage

Ein GUI-Projekt verwendet drei Dateien:

- **`<projekt>.html`** — minimaler HTML-Lader
- **`<projekt>-main.as`** — AllSpeak-Skript (Logik)
- **`<projekt>.json`** — Webson-Layout (UI-Definition als JSON)

### `<projekt>.html`

```html
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><Projekt></title>
</head>
<body>
    <pre id="allspeak-script" style="display:none">
    variable Skript
    rest hole Skript von `<projekt>-main.as`
    führe Skript aus
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var s = document.createElement('script');
        s.src = 'https://allspeak.ai/dist/allspeak.js?v=' + t;
        s.onload = function() { AllSpeak_Startup(); };
        document.head.appendChild(s);
    })();
    </script>
</body>
</html>
```

### `<projekt>-main.as`

```
!   <projekt>-main.as

    language deutsch

    script <Projekt>

!! GUI starten: Das Webson-Layout in den Body rendern und an die Elemente anbinden.

    div Körper
    variable Layout

    erstelle Körper
    rest hole Layout von `<projekt>.json`
    rendere Layout in Körper

    div Bildschirm
    befestige Bildschirm an `bildschirm`
    setze den inhalt von Bildschirm zu `Hallo von <Projekt>`

    stop
!!!
```

### `<projekt>.json`

```json
{
    "#doc": "<Projekt> Layout",
    "#element": "div",
    "@id": "seite",
    "font-family": "sans-serif",
    "margin": "2em",
    "#": ["$Bildschirm"],

    "$Bildschirm": {
        "#element": "div",
        "@id": "bildschirm",
        "padding": "1em",
        "border": "1px solid #ccc",
        "min-height": "4em"
    }
}
```

In allen Vorlagen ersetzen Sie `<projekt>` durch den Projektnamen (klein für Dateinamen) und `<Projekt>` durch den großgeschriebenen Projektnamen.

---

## Spracherweiterungsrichtlinie

Wenn ein benötigtes Konstrukt in AllSpeak nicht existiert, **erfinden Sie keine Syntax**. Halten Sie stattdessen inne und schlagen Sie dem Benutzer einen neuen Befehl vor, der konsistent mit AllSpeaks englisch-ähnlichem Stil bleibt.
