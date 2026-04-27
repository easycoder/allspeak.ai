# AllSpeak-Projekt — Claude-Bootstrap

## Sprache

Dies ist ein **deutsches** AllSpeak-Projekt. Kommunizieren Sie mit dem Benutzer auf Deutsch. Erzeugen Sie AllSpeak-Skripte mit deutschen Schlüsselwörtern. Antworten Sie immer auf Deutsch, unabhängig davon, in welcher Sprache der Benutzer seine Prompts formuliert.

## Was ist AllSpeak

AllSpeak ist eine Skriptsprache, die wie eine natürliche menschliche Sprache gelesen werden soll. Skripte verwenden die Dateiendung `.as`. AllSpeak läuft im Browser (JavaScript-Version) oder vom Terminal aus (Python-Version) — oder beides zusammen.

AllSpeak verwendet einen Arbeitsablauf nach dem Prinzip **die KI schreibt, der Mensch prüft**. Die KI erzeugt den `.as`-Code; der Benutzer überprüft, ob er verständlich ist, und fragt nach, wenn etwas unklar ist. Nutzen Sie die gesamte Sprache — vermeiden Sie keinen Befehl, nur weil er unbekannt wirken könnte. Der Benutzer muss ihn nur lesen, nicht aus dem Gedächtnis schreiben können.

## Hinweis zur Claude-Code-Oberfläche

Claude Code ist ein von Anthropic entwickeltes Werkzeug. Seine Oberfläche (Systemmeldungen, Bestätigungsanfragen, Schaltflächen) ist auf Englisch. Hier ist die Bedeutung der häufigsten Meldungen:

| Englische Meldung | Bedeutung |
|---|---|
| **Allow** / **Deny** | Erlauben / Verweigern — Claude bittet um Erlaubnis für eine Aktion |
| **Do you want to proceed?** | Möchten Sie fortfahren? |
| **Press Enter to continue** | Drücken Sie die Eingabetaste zum Fortfahren |
| **Yes / No** | Ja / Nein |
| **Retry** | Erneut versuchen |
| **Tool blocked** | Werkzeug blockiert — eine Aktion wurde verweigert |

Die Antworten der KI (Erklärungen, Fragen, Kommentare im Code) werden auf Deutsch verfasst.

## Erste Einrichtung

> **Hinweis für Einsteiger:** Wenn beim Start von Claude nichts geschieht, geben Sie **go** ein.

**WICHTIG: Bei JEDER Benutzernachricht** (einschließlich „go", „hallo", „start" oder etwas anderem) prüfen Sie zuerst, ob in diesem Verzeichnis eine Datei namens `.allspeak-init` existiert. Wenn sie NICHT existiert, MÜSSEN Sie sofort den unten beschriebenen Initialisierungsprozess ausführen — fragen Sie nicht, was der Benutzer möchte, warten Sie nicht auf weitere Anweisungen, beginnen Sie direkt mit Schritt 1.

### Initialisierungsprozess

1. **Begrüßen Sie den Benutzer** und erklären Sie kurz, was AllSpeak ist — eine Skriptsprache, die wie natürliches Deutsch gelesen wird und so konzipiert ist, dass die KI den Code schreibt und der Benutzer ihn überprüft.

2. **Fragen Sie nach dem Projektnamen.** Er wird als Skriptname und in Dateinamen verwendet.

3. **Fragen Sie, ob es sich um ein Befehlszeilen-Projekt, ein GUI-Projekt oder beides handelt.**

4. **Erstellen Sie die Projektdateien** entsprechend der Antwort:

   - **Befehlszeile**: Erstellen Sie `<projekt>.as` aus der unten stehenden CLI-Vorlage.
   - **GUI**: Erstellen Sie `<projekt>.html`, `<projekt>-main.as` und `<projekt>.json` aus den unten stehenden GUI-Vorlagen.
   - **Beides**: Erstellen Sie alle Dateien.

5. **Erstellen Sie `.allspeak-init`** mit dem Projektnamen und dem Typ (cli/gui/beides), damit diese Einrichtung nicht wiederholt wird.

6. **Erklären Sie dem Benutzer, wie das Projekt ausgeführt wird:**

   - **CLI**: Ausführen mit `allspeak <projekt>.as`.
   - **GUI**: Öffnen Sie `<projekt>.html` direkt im Browser — die AllSpeak-Laufzeitumgebung wird vom CDN geladen. Für Projekte, die lokale Dateien laden (REST-Aufrufe zum Laden von `.as` oder `.json`), starten Sie einen Entwicklungsserver mit `allspeak allspeak.as 8080` (oder einem beliebigen freien Port) und öffnen Sie dann `http://localhost:8080/<projekt>.html`.

7. **Führen Sie den Benutzer durch das Zusammenspiel der Dateien.** Erklären Sie bei GUI-Projekten:

   - Die HTML-Datei ist nur ein Launcher — sie lädt die AllSpeak-Laufzeitumgebung und führt ein kleines Bootstrap-Skript aus, das die Haupt-`.as`-Datei abruft.
   - Die `.as`-Datei enthält die Programmlogik. Sie erstellt ein Body-Element, ruft das `.json`-Layout ab und verwendet `rendere`, um das JSON in tatsächliche Seitenelemente umzuwandeln. Danach verwendet sie `befestige`, um sich über deren `@id` mit diesen Elementen zu verbinden und mit ihnen zu interagieren.
   - Die `.json`-Datei definiert das Seitenlayout mithilfe von Webson — einem JSON-Format, in dem Schlüssel wie `#element` HTML-Elemente erzeugen, `@id` Attribute setzt, `#content` den Text setzt, `$Name` benannte Komponenten definiert, `#` die Kinder auflistet, und jeder andere Schlüssel (wie `padding` oder `color`) ein CSS-Stil ist.
   - Diese Trennung ermöglicht es, das Layout zu ändern, ohne den Code anzufassen, und umgekehrt.

   Erklären Sie bei CLI-Projekten, dass die `.as`-Datei ein eigenständiges, vom Terminal ausgeführtes Skript ist, und beschreiben Sie, was jede Zeile bewirkt.

8. **Erklären Sie den mitgelieferten Editor.** Das Projektverzeichnis enthält `edit.html` und `allspeak.as`, die einen browserbasierten Editor mit Syntaxhervorhebung bereitstellen:

   - Starten Sie den Entwicklungsserver mit `allspeak allspeak.as 8080` (oder einem beliebigen freien Port).
   - Öffnen Sie `http://localhost:8080/edit.html` im Browser.
   - Der Editor erlaubt das Öffnen, Bearbeiten und Speichern von `.as`-, `.json`-, `.html`- und anderen Projektdateien mit farbiger Syntaxhervorhebung.
   - Derselbe Server liefert auch die Projektdateien aus, sodass Sie GUI-Projekte auf demselben Port unter `http://localhost:8080/<projekt>.html` testen können.

9. **Fragen Sie, was der Benutzer bauen möchte.** Ab hier reagieren Sie einfach auf die Wünsche des Benutzers.

---

**Wenn `.allspeak-init` bereits EXISTIERT**, überspringen Sie die Initialisierung und fahren Sie normal fort. Lesen Sie `.allspeak-init`, um den Projektnamen und -typ zu erfahren.

---

## CLI-Vorlage

```
!   <projekt>.as

    language deutsch

    script <Projekt>

    variable Nachricht
    lege `Hallo von <Projekt>` in Nachricht
    logge Nachricht

    beende
```

## GUI-Vorlage

Ein GUI-Projekt verwendet drei Dateien:

- **`<projekt>.html`** — minimaler HTML-Launcher
- **`<projekt>-main.as`** — AllSpeak-Skript (Code)
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
    language deutsch

    variable Script
    rest hole Script von `<projekt>-main.as`
    laufe Script
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var scripts = [
            'https://allspeak.ai/dist/allspeak.js?v=' + t,
            'https://allspeak.ai/dist/LanguagePack_de.js?v=' + t
        ];
        function load(i) {
            if (i >= scripts.length) { AllSpeak_Startup(); return; }
            var s = document.createElement('script');
            s.src = scripts[i];
            s.onload = function() { load(i + 1); };
            document.head.appendChild(s);
        }
        load(0);
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

    div Körper
    variable Layout

    erstelle Körper
    rest hole Layout von `<projekt>.json`
    rendere Layout in Körper

    div Bildschirm
    befestige Bildschirm an `bildschirm`
    setze den inhalt von Bildschirm zu `Hallo von <Projekt>`

    stoppe
```

### `<projekt>.json`

```json
{
    "#doc": "Layout von <Projekt>",
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

**Webson-Schlüssel:**
- `#element` — HTML-Elementtyp (`div`, `button`, `img` usw.)
- `@id`, `@src` usw. — HTML-Attribute
- `#content` — Innentext/HTML
- `#` — Array von Verweisen auf Kindelemente
- `$Name` — Definition einer benannten Komponente
- Alle anderen Schlüssel sind CSS-Stile

Ersetzen Sie in allen Vorlagen `<projekt>` durch den Projektnamen (kleingeschrieben in Dateinamen) und `<Projekt>` durch den Projektnamen mit großem Anfangsbuchstaben.

---

## Wichtige Warnungen — bekannte Einschränkungen

### Keine Inline-Arithmetik in Bedingungen
Sie können in einer Bedingung keine Berechnungen durchführen. Berechnen Sie zuerst in eine temporäre Variable:
```text
! FALSCH — kompiliert nicht
solange Divisor mit Divisor ist kleiner als N beginn ... ende

! RICHTIG — zuerst berechnen
multipliziere Divisor mit Divisor ergibt Quadrat
solange Quadrat ist kleiner als N beginn ... ende
```

### Kein Modulo-Operator
AllSpeak hat keinen Modulo-/Restoperator. Berechnen Sie den Rest manuell:
```text
! Rest = Kandidat - (Kandidat / Divisor) * Divisor
lege Kandidat in Quotient
dividiere Quotient durch Divisor
multipliziere Quotient mit Divisor ergibt Temp
lege Kandidat in Rest
subtrahiere Temp von Rest
```
Die Division ist ganzzahlig (abgeschnitten), daher funktioniert dies korrekt.

---

## Strenge Syntaxregeln

- Deklarieren Sie Variablen eine pro Zeile — keine Deklarationen mit Komma.
- Deklarieren Sie Variablen vor ihrer Verwendung.
- Schleifen: `solange ... beginn ... ende` — niemals `ende solange`.
- Bedingungen: `wenn ... beginn ... ende` — niemals `ende wenn`.
- Ereignishandler: `bei klick X gosub Handler` (eine einzelne Anweisung) oder `bei klick X beginn ... ende` (Block) — **niemals** `ende bei`. Gilt auch für `bei änderung`, `bei taste` usw.
- `beginn ... ende`-Blöcke müssen zu einer Steueranweisung gehören.
- Kein `funktion`, `ende funktion`, `definiere`, `sonst wenn`.
- Keine aufrufbare Form `Name(...)` — verwenden Sie `gosub Etikett` und `retourniere`.
- Zuweisung: `lege ... in Name`.
- Fragen Sie nach, wenn Sie sich bei einem Befehl unsicher sind, **bevor Sie Code schreiben**.
- Zeichenketten verwenden Backticks: `so hier`
- Kommentare beginnen mit `!`
- Jedes Skript beginnt mit `language deutsch`, gefolgt von `script Skriptname`
- DOM-Elemente müssen vor ihrer Verwendung deklariert werden (z. B. `div X`, `knopf Y`, `input Z`)
- **Keine implizite Rangfolge in `cat`-Ketten.** Zerlegen Sie komplexe Ausdrücke in separate Schritte.

## Kurzreferenz

```text
! Kommentar
language deutsch
script Name

variable V          ! allzweck-variable

lege 0 in V
addiere 1 zu V
subtrahiere 1 von V
multipliziere V mit 2
lege `hallo` in V

! Verkettung mit cat — steht IMMER zwischen Werten
logge `Wert: ` cat V              ! RICHTIG
! logge cat `Wert: ` V            ! FALSCH — cat steht nicht vor dem ersten Wert

wenn V ist 3 beginn ... ende
solange V ist kleiner als 10 beginn ... ende

Etikett:
    gosub MacheArbeit
    stoppe

MacheArbeit:
    retourniere

! Nicht-blockierende Pause (auch: sekunden, minuten, ticks)
warte 500 millis

! Zufallsganzzahl zwischen 0 und N-1
lege zufall 9 in X

! Routine im Hintergrund starten (blockiert die UI nicht)
zweige zu RoutineName
```

## Fehlerbehandlung

```text
! Pro Befehl: Fehler eines einzelnen Befehls abfangen
rest hole Daten von `/api` oder beginn
  lege die fehlermeldung in Status
ende

! Blockweise: beliebigen Fehler im Block abfangen
versuche
  dividiere Gesamt durch Anzahl
oder behandle
  lege die fehlermeldung in Status
ende
```

## Arrays

Eine Variable kann ein indiziertes Array von Werten enthalten. Deklarieren Sie die Größe mit `setze die elemente von X zu N`, dann zeigen Sie mit `indexiere X zu N` auf ein bestimmtes Element, bevor Sie lesen oder schreiben.

```text
variable Zelle
setze die elemente von Zelle zu 9      ! Array mit 9 Slots

lege 0 in Index
solange Index ist kleiner als 9
beginn
    indexiere Zelle zu Index           ! zeigt auf Slot Index
    lege 0 in Zelle                    ! schreibt Zelle[Index]
    addiere 1 zu Index
ende

indexiere Zelle zu 4
lege Zelle in Mitte                    ! liest Zelle[4]
```

Auch eine DOM-Element-Variable kann ein Array sein (`div Zelle`, dann `setze die elemente von Zelle zu 9`). Ein einziges `erstelle Zelle` in einer Schleife erzeugt jeden Slot, und `bei klick Zelle` wird für jeden ausgelöst; `lege der index von Zelle in Index` sagt dem Handler welcher.

**Erstellen Sie keine** parallelen nummerierten Variablen (`variable Punkte0`, `variable Punkte1`, …). Verwenden Sie ein einzelnes Array (`variable Punkte`, `setze die elemente von Punkte zu 9`) und indizieren Sie es. Schleifen werden möglich, das Skript wird kürzer, und das Datenmodell passt zum Problem.

## GUI-spezifisch (JS/Browser)

```text
div Element
knopf Btn
input Feld
img Bild

befestige Element an `dom-id`
erstelle Element in Eltern
setze den inhalt von Element zu `text`
setze stil `color` von Element zu `red`
bei klick Btn gosub BehandleKlick
rest hole Var von `/api/daten`
logge `nachricht`         ! browser-konsole
alarm `nachricht`         ! browser-dialog
```

## CLI-spezifisch (Python)

```text
hole Var von url `https://example.com/api`
lege json ZeichenVar in DictVar
lege eintrag `schlüssel` von DictVar in Var
input Var                              ! benutzereingabe lesen (standard-prompt ': ')
input Var mit `Wert eingeben: `        ! mit eigenem prompt
! HINWEIS: input ist ein eigenständiger Befehl, KEIN Wert. Verwenden Sie nicht 'lege input in Var'
beende
```

## Sprach-Erweiterungsrichtlinie

Wenn ein benötigtes Konstrukt in AllSpeak nicht existiert, **erfinden Sie keine Syntax**. Halten Sie stattdessen inne und schlagen Sie dem Benutzer einen neuen Befehl vor, wobei Sie ihn im Einklang mit dem natürlichen deutschen Stil von AllSpeak halten.
