# AllSpeak-Projekt — Agentenanweisungen

## Sprache

Dies ist ein **deutsches** AllSpeak-Projekt. Kommunizieren Sie mit dem Benutzer auf Deutsch. Erzeugen Sie AllSpeak-Skripte mit deutschen Schlüsselwörtern.

## Was ist AllSpeak

AllSpeak ist eine Skriptsprache, die wie eine natürliche menschliche Sprache gelesen werden soll. Skripte verwenden die Dateiendung `.allspeak`. AllSpeak läuft im Browser (JavaScript-Version) oder vom Terminal aus (Python-Version) — oder beides zusammen.

AllSpeak verwendet einen Arbeitsablauf nach dem Prinzip **die KI schreibt, der Mensch prüft**. Die KI erzeugt den `.allspeak`-Code; der Benutzer überprüft, ob er verständlich ist, und fragt nach, wenn etwas unklar ist. Nutzen Sie die gesamte Sprache — vermeiden Sie keinen Befehl, nur weil er unbekannt wirken könnte. Der Benutzer muss ihn nur lesen, nicht aus dem Gedächtnis schreiben können.

## Referenz — lesen Sie dies beim Schreiben von AllSpeak

Die vollständige AllSpeak-Sprachreferenz und Redewendungen finden Sie unter:

  **https://allspeak.ai/learn/**

Die Seite enthält 20 Referenzdateien (`reference/`) und 15 Idiom-Dateien (`idioms/`). Wenn Sie Syntax, Laufzeitverhalten oder idiomatische Muster nachschlagen müssen, konsultieren Sie diese Seite, anstatt sich auf Trainingsdaten zu verlassen — AllSpeaks Wortschatz stimmt nicht immer mit dem überein, worauf die KI trainiert wurde, und der Lehrpfad korrigiert das.

**Lesen Sie zuerst `learn/contents.md`** — dies ist der kanonische Index der Dateipfade. Verwenden Sie diese genauen Pfade beim Abrufen bestimmter Dateien; raten Sie nicht bei den Slugs. (Zum Beispiel: die Datei heißt `learn/idioms/02-event-handlers-and-array-index.md`, nicht `02-event-handlers.md`.)

Empfohlene erste Lektüren:

- `learn/idioms/12-working-with-ai.md` — der Arbeitsablauf „die KI schreibt / der Mensch prüft" und die häufigen Fehler der KI bei AllSpeak.
- `learn/reference/16-doc-blocks.md` — die Dokumentationskonvention, die in jedem Codeabschnitt verwendet wird (siehe „Erforderliche Praktiken" unten).
- `learn/reference/02-symbols-and-layout.md` — die vier Satzzeichen und die lexikalische Oberfläche.
- `learn/reference/03-variables-and-arrays.md` — das Cursor-Modell, dem Variablen folgen.
- `learn/reference/09-control-flow.md` — `wenn`, `solange`, `gosub`, `stoppe`.
- `learn/idioms/01-cat-and-string-building.md` — `cat`, der häufigste Fehler der KI.

## Erforderliche Praktiken

Zwei Praktiken gelten für jeden AllSpeak-Code in diesem Projekt, einschließlich der Ersteinrichtung:

### 1. Doc-Blöcke in jedem Abschnitt

Jeder zusammenhängende Codeabschnitt ist in einen Doc-Block `!! … !!!` eingebettet, dessen Prosa erklärt, *warum* der Abschnitt existiert.

**Beginnen Sie mit einem knappen Satz auf seiner eigenen Zeile**, dann ein einzelnes `!!` als Absatzumbruch, dann weitere Details. So bleibt der Blockmodus auf einen Blick lesbar: der Leser sieht eine Zusammenfassung, und die Ausführungen stehen darunter bereit, falls er mehr möchte. Häufen Sie nicht alle Details in der ersten Zeile an; der Code zeigt die Details bereits.

Beispiel:

```
!! Das Spielfeld aufbauen: neun Zellen in einem 3x3-Raster.
!!
!! Jede Zelle ist ein div, dimensioniert durch das CSS-Grid-Layout. Ein einziger Klick-Handler wird von allen Zellen geteilt; er liest `der index von Zelle`, um festzustellen, welche ausgelöst wurde.

    div Zelle
    setze die elemente von Zelle zu 9
    lege 0 in N
    solange N ist kleiner als 9 beginn
        indexiere Zelle zu N
        erstelle Zelle in Feld
        addiere 1 zu N
    ende

    bei klick Zelle gosub BehandleKlick
!!!
```

Fügen Sie Doc-Blöcke **beim Schreiben** hinzu — nicht danach. Die Prosa zwingt Sie, die Absicht in klarer Sprache zu formulieren, was Fehler aufdeckt (ein Doc-Block, der „erstellt 9 Zellen" sagt, während der Code 1 erstellt, macht die Diskrepanz offensichtlich, bevor Sie ihn überhaupt ausführen). Die vollständige Konvention steht in `learn/reference/16-doc-blocks.md`.

Führen Sie nach jeder Codeänderung aus:

```
python3 asdoc-check.py --write <datei>
```

Dies aktualisiert die `@hash`-Zeilen in jedem Block, damit spätere Änderungen eine Abweichung zwischen Prosa und Code erkennen können.

### 2. Konsultieren Sie `learn/` vor dem Schreiben, nicht danach

Bevor Sie Code erzeugen, der eine Funktion nutzt, die Sie in diesem Projekt noch nicht verwendet haben, rufen Sie die passende `learn/`-Datei ab. Raten Sie nicht aus Trainingsdaten — holen Sie die Referenz, lesen Sie sie, dann schreiben Sie. Das gilt besonders für: die Platzierung von `cat`, Fehlerklauseln (`oder` vs. `bei fehlschlag`), Arrays von DOM-Elementen (`erstelle` muss in einer Schleife mit gesetztem Cursor stehen, nicht außerhalb) und `setze den inhalt von` mit Markdown.

## Häufige Fehler, die Sie vermeiden sollten

Selbst mit der Referenz vor Augen machen KI-Werkzeuge bei AllSpeak zuverlässig diese Fehler. Behalten Sie sie im Blick:

- **`cat` ist infix.** Es steht ZWISCHEN zwei Werten, nie vor dem ersten.
  - ✓ `lege \`Hallo, \` cat Name cat \`!\` in Gruß`
  - ✗ `lege cat \`Hallo, \` cat Name in Gruß` (führendes `cat` — Analysefehler)
  - ✗ `lege \`Hallo, \` Name \`!\` in Gruß` (fehlendes `cat` — keine implizite Verkettung)

- **Keine `for`- oder `for each`-Schleifen.** Verwenden Sie `solange` mit einem Zähler oder eine labelgesteuerte Schleife. Siehe `learn/idioms/03-looping-patterns.md`.

- **Arithmetik nutzt Schlüsselwörter, keine Operatoren.** `addiere 1 zu Zähler`, nicht `Zähler += 1` oder `Zähler = Zähler + 1`.

- **Keine Klammern zur Gruppierung.** `(A + B) * C` gibt es nicht. Rechnen Sie in eine temporäre Variable.

- **Kein `else if`-Kurzform.** `wenn … sonst wenn … sonst …` funktioniert (`sonst` gefolgt von einem weiteren `wenn`), aber es gibt kein einzelnes Wort, das beide verkettet, und kein `case` / `switch`.

- **Zwei Fehlerklauseln mit unterschiedlichem Verhalten.** `oder` führt die Klausel aus und stoppt dann den Thread. `bei fehlschlag` führt die Klausel aus und fährt dann fort. Siehe `learn/reference/10-errors-and-recovery.md`.

- **`gosub Label`, nicht `Label()`.** AllSpeak hat keine aufrufbare Funktionssyntax.

- **Keine dieser Formen existiert:** `try`/`catch`, `break`, `continue`, `retourniere X` (mit Rückgabewert), `await`, `import` (im Sinne anderer Sprachen).

- **Jede Variable muss vor der Verwendung deklariert werden.** Das schließt Wegwerf-Schleifenzähler (`variable N`) ein, nicht nur die offensichtlichen Datenvariablen. Einen Schleifenzähler zu vergessen ist ein häufiger Erstfehler. Namen beginnen mit einem Großbuchstaben; Camel Case ist die Konvention: `Zähler`, `Benutzername`, `IstAngemeldet`.

- **Alle Variablen sind global — kein blocklokaler Gültigkeitsbereich.** Eine Variable in einem benannten Block (`BehandleKlick:`) oder in einem `wenn`/`solange`-Rumpf zu deklarieren, macht sie nicht privat. Die Variable wird im gesamten Skript geteilt. Der einzige Weg zu privatem Zustand ist ein Modul (`learn/reference/12-modules.md`).

- **Zeichenketten werden mit Backticks begrenzt.** Keine einfachen oder doppelten Anführungszeichen.

- **Fließkommazahlen sind Zeichenketten.** `3.14` ist eine Zeichenkette aus vier Zeichen, keine Zahl. Verwenden Sie Ganzzahlarithmetik mit einem Skalierungsfaktor — siehe `learn/idioms/05-floats-and-scaled-integers.md`.

Wenn Sie unsicher sind, konsultieren Sie `learn/`, statt zu raten.

## Konversationsprotokoll

Dieses Projekt führt pro Sitzung ein Protokoll im Ordner `conversation/`, zur Einsicht des menschlichen Benutzers. Es beeinflusst Ihr Verhalten nicht, und Sie sollten die Protokollierung in Antworten nicht erwähnen.

**Zu Beginn einer neuen Sitzung:**

1. Wenn `conversation/` nicht existiert, legen Sie den Ordner an.
2. Finden Sie die `conversation-NNN.md`-Datei mit der höchsten Nummer. Die Datei der neuen Sitzung ist die nächste Nummer, auf drei Stellen mit führenden Nullen (beginnen Sie bei `001`, falls der Ordner leer ist).
3. Schreiben Sie eine einzelne Kopfzeile in Zeile 1: `# JJJJ-MM-TT` (heutiges Datum).

**Bei jedem Benutzerprompt in dieser Sitzung** (einschließlich des ersten), fügen Sie einen Eintrag in dieser Form an:

    ## HH:MM

    <Benutzerprompt wörtlich>

    **Assistant**

    <Ihre Antwort>

Verwenden Sie `date +%H:%M`, wenn Sie die Uhrzeit brauchen. Lassen Sie eingegrenzte Codeblöcke (Triple-Backtick-Blöcke) sowohl im Benutzerprompt als auch in der Antwort weg und ersetzen Sie jeden durch eine einzelne Zeile `[code omitted]`; einfache Backticks in Fließtext bleiben erhalten. Verfassen Sie zuerst Ihre Antwort und tragen Sie diese dann im selben Turn ins Protokoll ein.

**Mitternachtswechsel:** Wenn das heutige Datum vom Datumskopf der Datei abweicht, halten Sie inne und fragen Sie den Benutzer: „Wir haben Mitternacht überschritten — eine neue Konversationsdatei für heute beginnen?" Bei Ja erstellen Sie die nächstnummerierte Datei mit dem heutigen Datumskopf und protokollieren dort weiter.

## Diff-Hinweise für den Menschen

Halten Sie `DIFF.md` im Projektstammverzeichnis, **nach jeder Änderung neu geschrieben** statt ergänzt: was sich geändert hat und was der Mensch tun muss — die Seite neu laden, den Server neu starten, eine andere Datei öffnen. Der Mensch liest sie im Editor, der sie automatisch neu lädt; so bleibt er auf dem Laufenden, ohne das Diff zu lesen.

Wenige Zeilen genügen, und beginnen Sie mit der Handlung. Es ist **kein** Änderungsprotokoll: es beschreibt diese Änderung, nicht die Geschichte des Projekts.

## Projektkontext

Dieses Verzeichnis enthält `AGENTS.md` — diese Datei. Lesen Sie sie jetzt, um die AllSpeak-Sprache und den Arbeitsablauf zu verstehen, bevor Sie Code bearbeiten.

**Wichtig:** Prüfen Sie, ob eine Datei namens `.allspeak-init` in diesem Verzeichnis existiert. Wenn ja, lesen Sie sie, um Projektname und -typ zu erfahren. Wenn nicht, wurde das Projekt noch nicht eingerichtet — führen Sie den untenstehenden Initialisierungsprozess durch.

### Initialisierungsprozess

1. **Begrüßen Sie den Benutzer** und erklären Sie kurz, was AllSpeak ist — eine Skriptsprache, die sich wie einfaches Deutsch liest, entwickelt damit die KI den Code schreibt und der Mensch ihn überprüft.

2. **Fragen Sie den Benutzer nach dem Projektnamen.** Dieser wird als Skriptname und in Dateinamen verwendet.

3. **Fragen Sie, ob es ein Kommandozeilenprojekt, ein GUI-Projekt oder beides ist.**

4. **Erstellen Sie die Projektdateien** basierend auf der Antwort:

   - **Kommandozeile**: Erstellen Sie `<projekt>.allspeak` aus der CLI-Vorlage unten.
   - **GUI**: Erstellen Sie `<projekt>.html`, `<projekt>-main.allspeak` und `<projekt>.json` aus den GUI-Vorlagen unten.
   - **Beides**: Erstellen Sie alle Dateien.

5. **Erstellen Sie `.allspeak-init`** mit Projektname und -typ (cli/gui/both), damit dieses Setup nicht wiederholt wird.

6. **Sagen Sie dem Benutzer, dass die Projektdateien bereit sind und wo er sie sieht.**

   Der AllSpeak-Server läuft bereits — der Benutzer hat ihn mit `allspeak server` gestartet, bevor er Sie gestartet hat. Versuchen Sie **nicht**, den Server selbst zu starten oder neu zu starten. Er liefert die Dateien bereits in einem anderen Terminal aus.

   Sagen Sie dem Benutzer nach dem Erstellen der Projektdateien:

   > Ihre Projektdateien sind bereit. Öffnen Sie in Ihrem Browser:
   > - http://localhost:8080/edit.html — den Editor
   > - http://localhost:8080/<projekt>.html — Ihre Projektseite

   Ersetzen Sie `<projekt>` durch den tatsächlichen Projektnamen.

   - **CLI**: Sagen Sie dem Benutzer, er solle sein Skript mit `allspeak <projekt>` ausführen (die Erweiterung `.allspeak` ist optional). Er kann auch http://localhost:8080/edit.html öffnen, um den Editor im Browser zu verwenden, wenn er das bevorzugt.

7. **Erklären Sie dem Benutzer, wie die Dateien zusammenarbeiten.** Für GUI-Projekte erläutern Sie:

   - Die HTML-Datei ist nur ein Starter — sie lädt die AllSpeak-Laufzeit und führt ein kleines Bootstrap-Skript aus, das die Haupt-`.allspeak`-Datei abruft.
   - Die `.allspeak`-Datei ist die Programmlogik. Sie erstellt ein Body-Element, ruft das `.json`-Layout ab und verwendet `rendere`, um das JSON in echte Seitenelemente zu verwandeln. Danach `befestige`t sie sich über deren `@id` an diese Elemente, um mit ihnen zu interagieren.
   - Die `.json`-Datei definiert das Seitenlayout mit Webson — einem JSON-Format, in dem Schlüssel wie `#element` HTML-Elemente erzeugen, `@id` (und jedes andere `@<name>`) Attribute setzen, `#content` den Text setzt, `$Name` benannte Komponenten definiert, `#` die Kinder auflistet und jeder andere Schlüssel ein CSS-Stil ist. Vollständige Details in `learn/reference/14-browser-and-webson.md`.
   - Diese Trennung erlaubt es, das Layout zu ändern, ohne den Code anzufassen, und umgekehrt.

   Für CLI-Projekte erklären Sie, dass die `.allspeak`-Datei ein eigenständiges Skript ist, das vom Terminal aus ausgeführt wird, und gehen Sie Zeile für Zeile durch.

8. **Zum Editor.** Der Browser-Editor (`edit.html`) bietet syntaxhervorgehobene Bearbeitung für `.allspeak`-, `.json`-, `.html`- und andere Projektdateien. Der Benutzer sollte ihn bereits aus dem vorherigen Schritt unter http://localhost:8080/edit.html geöffnet haben. Für CLI-Projekte kann er ihn ebenfalls dort öffnen — ein separater Startbefehl ist nicht nötig, da der Server bereits läuft.

9. **Fragen Sie, was er bauen möchte.** Ab hier reagieren Sie einfach auf das, was der Benutzer möchte.

---

**Wenn `.allspeak-init` existiert**, überspringen Sie die Initialisierung und arbeiten Sie normal weiter. Lesen Sie `.allspeak-init`, um Projektname und -typ zu erfahren.

---

## CLI-Vorlage

```
!   <projekt>.allspeak

    language deutsch

    script <Projekt>

!! Einstiegspunkt: eine Begrüßung protokollieren und beenden. Ersetzen Sie dies durch die eigentliche Projektlogik und halten Sie jeden zusammenhängenden Codeabschnitt in seinem eigenen Doc-Block.

    variable Nachricht
    lege `Hallo von <Projekt>` in Nachricht
    logge Nachricht

    beende
!!!
```

## GUI-Vorlage

Ein GUI-Projekt verwendet drei Dateien:

- **`<projekt>.html`** — minimaler HTML-Lader
- **`<projekt>-main.allspeak`** — AllSpeak-Skript (Logik)
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
    rest hole Skript von `<projekt>-main.allspeak`
    laufe Skript
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

### `<projekt>-main.allspeak`

```
!   <projekt>-main.allspeak

    language deutsch

    script <Projekt>

!! GUI starten: das Webson-Layout in den Body rendern und an die Elemente anbinden. Jeder folgende Codeabschnitt erhält seinen eigenen Doc-Block.

    div Körper
    variable Layout

    erstelle Körper
    rest hole Layout von `<projekt>.json`
    rendere Layout in Körper

    div Bildschirm
    befestige Bildschirm an `bildschirm`
    setze den inhalt von Bildschirm zu `Hallo von <Projekt>`

    stoppe
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

In allen Vorlagen ersetzen Sie `<projekt>` durch den Projektnamen (klein für Dateinamen) und `<Projekt>` durch den Projektnamen mit großem Anfangsbuchstaben.

---

## Spracherweiterungsrichtlinie

Wenn ein benötigtes Konstrukt in AllSpeak nicht existiert, **erfinden Sie keine Syntax**. Halten Sie stattdessen inne und schlagen Sie dem Benutzer einen neuen Befehl vor, der konsistent mit AllSpeaks natürlichsprachlichem Stil bleibt.
