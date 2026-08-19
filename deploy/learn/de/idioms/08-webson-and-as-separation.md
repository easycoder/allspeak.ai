# Webson-und-AS-Trennung

## Problem

Du hast eine Oberfläche, die größer ist als eine Handvoll Elemente. Jedes einzelne inline in AllSpeak zu erzeugen — `erstelle`, `setze den inhalt von`, `setze den stil von`, und so weiter — ersäuft die eigentliche Logik schnell im Lärm der DOM-Konstruktion. Die Struktur der Oberfläche verheddert sich mit dem Verhalten des Skripts.

## Das Muster

Teile die Oberfläche in zwei Teile:

- **Layout in einer Webson-`.json`-Datei.** Elementbaum, Styling, IDs.
- **Logik in einer `.as`-Datei.** Daten laden, Ereignisse behandeln, Zustand transformieren.
- **`befestige` verbindet beide.** Nach dem Rendern des Webson übernimmt das AS-Skript jedes Element per ID.

```as
variable Layout

erstelle Body
rest hole Layout von `app.json`
rendere Layout in Body

befestige LoginPanel an `login-panel`
befestige UsernameField an `username-input`
befestige LoginButton an `login-button`
befestige Status an `status`

bei klick LoginButton gosub HandleLogin
```

Das Skript sagt nie, wie das Login-Panel aussieht — das ist Aufgabe der Layout-Datei. Die Layout-Datei sagt nie, was beim Klick auf den Button passiert — das ist Aufgabe des Skripts. So bleibt jede Seite der anderen aus dem Weg.

## Wann sich das Muster lohnt

Webson + `befestige` zahlt sich aus, wenn:

- Die Oberfläche mehr als eine Handvoll Elemente hat.
- Das Layout sich ändern kann, ohne dass sich das Verhalten ändert (visuelles Redesign, Übersetzung).
- Mehrere Personen (oder ein Designer + ein Entwickler) am selben Bildschirm arbeiten.
- Du das Layout dynamisch laden willst (unterschiedliche Layouts für verschiedene Nutzer, A/B-Tests).

Ein `erstelle` direkt im Skript ist in Ordnung, wenn:

- Die Oberfläche klein ist (ein paar Buttons, ein Status-div).
- Die Elemente prozedural aufgebaut werden (ein Button pro Datensatz).
- Du prototypst und noch keine separate Datei willst.

## Ausgearbeitetes Beispiel

`app.json` (Webson-Layout):

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$LoginPanel"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Willkommen"
    },

    "$LoginPanel": {
        "#element": "div",
        "@id": "login-panel",
        "#": ["$Username", "$LoginButton"],

        "$Username": {
            "#element": "input",
            "@id": "username-input"
        },

        "$LoginButton": {
            "#element": "button",
            "@id": "login-button",
            "#content": "Anmelden"
        }
    }
}
```

`app.as` (AllSpeak-Logik):

```as
variable Layout
div Title
div LoginPanel
input Username
knopf LoginButton

erstelle Body
rest hole Layout von `app.json`
rendere Layout in Body

befestige Title an `title`
befestige LoginPanel an `login-panel`
befestige Username an `username-input`
befestige LoginButton an `login-button`

bei klick LoginButton gosub HandleLogin
stoppe

HandleLogin:
    lege der inhalt von Username in Name
    ! ... validieren usw. ...
    retourniere
```

Das Skript deklariert jede typisierte Variable, befestigt sie am gerenderten Element und arbeitet von dort aus damit. Visuelle Änderungen (den Button stylen, das Panel neu positionieren) passieren vollständig in `app.json`.

## Erst erstellen, dann indexieren — für Arrays von Elementen

Wenn eine Oberfläche ein wiederholtes Element N-mal rendert, deklariere auf der AllSpeak-Seite ein Array und **erzeuge dann jedes Element in einer Schleife, während der Cursor gesetzt ist**:

```as
knopf Tab
setze die elemente von Tab zu 5

setze N zu 0
solange N ist kleiner als 5 beginn
    indexiere Tab zu N
    erstelle Tab in TabBar
    setze den inhalt von Tab zu element N von TabNames
    addiere 1 zu N
ende

bei klick Tab gosub TabClicked
```

`setze die elemente von Tab zu 5` reserviert fünf Plätze. Jedes `indexiere Tab zu N` gefolgt von `erstelle Tab in TabBar` baut das Element an Platz N und fügt es in den Container ein. Ein einzelnes `erstelle` außerhalb der Schleife würde nur ein Element bauen — nicht fünf — deshalb muss das `erstelle` innerhalb der Schleife stehen. Der Handler liest `der index von Tab`, um herauszufinden, welches ausgelöst hat (siehe [Ereignishandler und Array-Index](event-handlers-and-array-index.md)).

Das ist dasselbe Array-plus-Cursor-Muster, das für skalare Arrays gilt, erweitert auf DOM-Elemente.

## Datengetriebener Inhalt: Webson für den Rahmen, das Skript für die Zeilen

Das Muster Webson + `befestige` wird unzureichend, wenn die Form zum Vorlagenzeitpunkt nicht bekannt ist. Webson ist eine Vorlagensprache: jedes Element wird statisch deklariert, jedes `#content` ist ein String-Literal im JSON. Zwei Dinge passen dabei besonders schlecht:

- **Variable Elementanzahl.** Webson kann eine feste Anzahl von Zeilen deklarieren; es kann nicht „eine Zeile pro Datensatz in der Datendatei" deklarieren.
- **Elementinhalt aus einem Skriptwert.** `#content` nimmt ein String-Literal, keinen Ausdruck — es gibt keine Möglichkeit zu sagen: „der Wert von `Row.amount` für diese Iteration".

Die Lösung ist, die Seite danach aufzuteilen, welche Achse variiert. Verwende Webson für die Teile, deren Form zum Vorlagenzeitpunkt feststeht — Seitenrahmen, Kopfleiste, Tabellenkopfzeile, modale Formulare. Verwende das Skript für die Teile, deren Form aus den Daten kommt — Körperzeilen, Monatszwischensummen, berechnete Summen. `asedit.as` macht das für seine Dateiliste: ein per Webson befestigter Scroll-Container mit skripterzeugten Einträgen darin; das Layout weiß nichts darüber, wie viele Dateien es geben könnte.

### Eine datengetriebene Tabelle

Für eine Log-Tabelle, deren Zeilen aus einer JSON-Datei kommen:

```as
div TableBody
befestige TableBody an `table-body`

variable Grid
lege `40px 1fr 100px 100px` in Grid

variable Rows
rest hole Rows von `/data/2024-25/04.json`

div Row
setze die elemente von Row zu die anzahl von Rows
setze N zu 0
solange N ist kleiner als die anzahl von Rows beginn
    indexiere Row zu N
    erstelle Row in TableBody
    setze den stil von Row zu `display:grid; grid-template-columns:` cat Grid
    setze den inhalt von Row zu (element 0 von element N von Rows) cat `,` cat (element 1 von element N von Rows)
    addiere 1 zu N
ende

bei klick Row gosub HandleRowClick
```

Der Webson `app.json` deklariert das Tabellen-Chrome — äußerer Container, Kopfzeile mit demselben `grid-template-columns: 40px 1fr 100px 100px`, Befestigungspunkt `table-body`. Alles unterhalb dieses Punkts baut das Skript.

Der wiederholte `grid-template-columns`-String ist der einzige Preis: die Kopfzeile im Webson und die Datenzeilen im Skript müssen sich darauf einigen. Das ist billig genug, dass sich ein Webson-Primitiv für die Erzeugung von Vorlagenzeilen nicht lohnt. Ziehe die Spaltenvorlage in eine Skript-Konstante (hier `Grid`) und verwende im Webson-Layout denselben Wert als Literal.

### Betrachtete Alternativen (und wann sie greifen)

- **HTML-`<table>` über Webson.** `table`, `tr`, `td`, `th` sind deklarierbare AllSpeak-Typen (siehe [Browser und Webson](../reference/browser-and-webson.md)), also ist das technisch möglich. Das Grid-Muster gewinnt bei den meisten UI-Tabellen, weil Hover-/Klick-Styling pro Zeile und responsive Breiten auf einem Grid-div einfacher sind als auf `tr`/`td`. Greife zu `<table>`, wenn du semantisches HTML für Barrierefreiheit, Druck-/PDF-Export oder Screenreader-Navigation brauchst.
- **Ein Grid-Container mit `display: contents` als Zeilen-Wrapper.** Lässt alle Zellen eine einzige Grid-Vorlage teilen, aber `display: contents` entfernt die Zeile aus dem Box-Baum — es gibt kein stylbares Zeilenelement, an das man Hover oder Klick hängen kann. Nützlich, wenn die Zeilen rein visuell sind; unhandlich, wenn Zeilen klickbare Einheiten sind. Das obige Muster mit einem Grid-div pro Zeile hält jede Zeile als eigenes stylbares, klickbares Element.

## Anti-Muster: Styling im Skript

```as
erstelle Save in Container
setze den stil von Save zu `padding:1em; background:#48f; color:white; border-radius:0.3em`
```

CSS im Skript ist fragil und laut. Verschiebe es in den Webson, wo Styling hingehört. Behalte im Skript das Verhalten, das das Layout nicht ausdrücken kann — Datenbindung, Ereignisbehandlung, Übergänge.

## Anti-Muster: Verhalten im Webson

Webson ist Layout; es kann keine Bedingungen, Schleifen oder Ereignis-Handler ausdrücken. Wenn du dich dabei ertappst, Verhalten in JSON-Schlüsseln kodieren zu wollen, ist das ein Zeichen, das variable Element auf die Skript-Seite zu legen und es mit `befestige` anzubinden.

## Siehe auch

- [Browser und Webson](../reference/browser-and-webson.md) — DOM-Typen, `befestige`, `rendere`.
- [Ereignishandler und Array-Index](event-handlers-and-array-index.md) — Array von Elementen mit gemeinsamem Handler.
- [Sprachneutral schreiben](writing-language-neutral.md) — benutzersichtbare Strings im Webson für die Übersetzung auslagern.
