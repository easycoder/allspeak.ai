# Stilkonventionen

Der Compiler akzeptiert mehr, als diese Seite empfiehlt. Was folgt, sind die **Stilkonventionen** des Projekts — die Entscheidungen, die es dort trifft, wo die Sprache mehrere offen lässt, damit ein Skript, das diesen Monat geschrieben wird, von einer Person oder von einem KI-Werkzeug, sich wie der übrige Code liest. Das ist eine Empfehlung und keine Regel: nichts davon wird erzwungen, und ein Skript, das davon abweicht, kompiliert trotzdem.

Zwei Themen, beide zum Layout: **wohin `beginn` und `ende` gehören**, und **wie eine lange Anweisung über mehrere Zeilen gebrochen wird**.

## `beginn` und `ende` auf eigenen Zeilen

`beginn` darf sich die Zeile mit der Anweisung teilen, die den Block öffnet:

```as
solange N ist kleiner als 3 beginn
    drucke N
    addiere 1 zu N
ende
```

Die Stilkonventionen geben ihm eine eigene Zeile, auf der Einrückung der Anweisung, der der Block gehört — der Rumpf eine Ebene tiefer, und `ende` zurück auf der Einrückung der Anweisung:

```as
solange N ist kleiner als 3
beginn
    drucke N
    addiere 1 zu N
ende
```

Drei Gründe:

- **Die Ausdehnung eines Blocks ist sichtbar, ohne seine Bedingung zu lesen.** `beginn` und `ende` stehen untereinander, also lässt sich die Form des Blocks auf einen Blick messen.
- **Ein `beginn` am Ende einer langen Zeile ist das, was am leichtesten übersehen wird**, und es entscheidet, ob die folgenden Zeilen ein Block sind.
- **Eine strukturelle Änderung kostet eine Zeile im Diff**, statt ein paar angehängter Zeichen an einer langen Zeile.

### Die einzige Ausnahme: `sonst beginn`

Ein Klausel-Eröffner darf sich die Zeile mit `beginn` teilen, sofern nichts anderes auf dieser Zeile steht. `sonst beginn` ist die Form, die vorkommt, und so wird ein verwaistes `sonst` vermieden, das allein auf seiner Zeile steht:

```as
wenn Name ist leer
beginn
    setze Missing
ende
sonst beginn
    leere Missing
ende
```

`dann beginn` ist aus demselben Grund erlaubt. Das einzige `dann` der Sprache folgt auf `laufe` — ``laufe `Other` als Panel ohnewarten dann beginn … ende`` — es ist also selten; `sonst beginn` ist das, was man sich merken sollte.

Nichts anderes teilt sich eine Zeile mit `beginn`: die Bedingungen von `wenn` und `solange` bekommen ihren Zeilenumbruch.

## Eine lange Anweisung brechen

Eine Verbindung, die bequem auf eine Zeile passt, bleibt auf einer Zeile. Dieser Abschnitt handelt von den **langen** — denen, die in einem schmalen Editorbereich, in einem Diff oder in einer Prüfansicht umbrechen, wo der umbrochene Rest einer Zeile wie eine eigene Anweisung aussieht und man die Verbindung suchen muss.

Muss eine Anweisung wirklich gebrochen werden, wird sie **vor** dem Verbindungswort gebrochen — `cat`, `und`, `oder`, `mit` — wobei die Fortsetzungszeile eine Ebene tiefer eingerückt wird als die Anweisung. Der eigene Schwanz der Anweisung (`in X`, `ergibt Y`, `zu Z`) beendet die letzte Zeile.

### Kurzes in Ruhe lassen

```as
lege `Du hast ` cat Count cat ` Nachrichten.` in Status
```

### Ein `cat` pro Zeile, wo gebrochen werden muss

Sechs Fragmente ergeben eine lange Zeile, also beginnt jedes `cat` eine:

```as
lege `Benutzer `
    cat UserName
    cat ` (id `
    cat UserId
    cat `) angemeldet um `
    cat Time
    in LogLine
```

Das bringt außerdem den Fehler, den `cat` anzieht — eine fehlende Verbindung oder ein führendes `cat` — an den linken Rand der Seite, wo ein Blick ihn findet, statt mitten in einer umbrochenen Zeile.

### `und` und `oder`, dieselbe Regel

Kurz genug, um zu passen, also bleibt es:

```as
wenn Name ist leer oder Email ist leer gehe zu Reject
```

Lang genug, um umzubrechen, also wird vor jedem Verbindungswort gebrochen, wobei die Aktion an der letzten Bedingung bleibt:

```as
wenn BookingDate ist leer
    oder BookingTime ist leer
    oder GuestCount ist kleiner als 1 gehe zu RejectBooking
```

Eine Argumentliste bricht auf dieselbe Weise und unter derselben Bedingung — `gosub Render mit Panel` / `und Title` / `und Rows` passt auf eine Zeile und bleibt dort; ein Aufruf mit einem Dutzend Argumenten passt nicht und bricht vor jedem `und`.

### Die Einrückung ist für den Leser, nicht für den Compiler

Der Compiler fügt eine Fortsetzung zusammen, weil die **Grammatik** weitergeht — ein `cat` nach einem Wert, ein `und` nach einer Liste — und die Einrückung ist ihm gleichgültig: eine Fortsetzung direkt am linken Rand kompiliert genau wie eine um drei Ebenen eingerückte. Die zusätzliche Einrückung hat also einen einzigen Zweck: dass das Auge eine gebrochene Anweisung sieht statt mehrerer Anweisungen hintereinander.

Was die Grammatik nicht tut, ist eine bereits geschlossene Anweisung fortzusetzen. Ein `lege … in D`, das auf einer Zeile abgeschlossen ist, gefolgt von einer Zeile, die mit `cat` beginnt, ist ein Kompilierfehler — die häufigste Überraschung an dieser Stelle, und der Grund, *vor* dem Verbindungswort zu brechen statt danach.

## Siehe auch

- [Symbole und Layout](symbols-and-layout.md) — Labels, Einrückung, Kommentare, Backtick-Zeichenketten.
- [Kontrollfluss](control-flow.md) — `beginn … ende`-Blöcke, `wenn` / `sonst`, `solange`.
- [`cat` und Zeichenkettenaufbau](../idioms/01-cat-and-string-building.md) — das `cat`-Idiom vollständig, einschließlich der gierigen Auswertung.
- [Dokumentationsblöcke](doc-blocks.md) — die Prosa-Konvention, die zu Stilkonventionen gehört.
