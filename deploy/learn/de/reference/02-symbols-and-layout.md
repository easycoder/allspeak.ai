# Symbole und Layout

AllSpeak hat eine bewusst kleine lexikalische Oberfläche. **Vier Satzzeichen** tragen Bedeutung; alles andere ist ein Wort. Doc-Block-Marker fügen eine fünfte lexikalische Kategorie für Prosa hinzu, die obendrauf liegt.

Jedes nicht-alphanumerische Zeichen außerhalb eines Strings oder Kommentars, das keines davon ist, ist ein Kompilierfehler. Es gibt keine runden Klammern, keine geschweiften Klammern, keine eckigen Klammern, keine Semikolons, kein Infix-`+`, `=`, `*`. Operatoren sind Schlüsselwörter; Gruppierung erfolgt über Layout, nicht über Satzzeichen.

## Die vier Symbole

| Symbol | Bedeutung |
|--------|---------|
| `!` | Kommentar. Vom `!` bis zum Zeilenende wird ignoriert. (Innerhalb eines Backtick-Strings ist `!` nur Text.) |
| `` ` `` | Begrenzer für String-Literale. Passende Paare umschließen konstanten Text, möglicherweise mehrzeilig. |
| `:` | Label-Abschluss. Ein Wort, gefolgt von `:` am Zeilenanfang, deklariert ein Label. |
| `-` | Negations-Präfix bei einem numerischen Literal: `-3`. Es gibt kein Infix-`-`; Subtraktion ist das Schlüsselwort `subtrahiere`. |

## Kommentare

Kommentare beginnen mit `!` und laufen bis zum Zeilenende:

```as
! Das ist ein Kommentar.
addiere 1 zu Counter   ! Kommentar am Ende einer Codezeile.
```

Nutze sie, um funktionale Blöcke des Skripts zu markieren. Verlasse dich nicht allein auf Variablennamen, um die Absicht zu vermitteln. Einzeilige Endkommentare sind in Ordnung, wo eine Erklärung nicht offensichtlich ist; für alles, was länger als ein Satz ist, bevorzuge einen Doc-Block (unten).

## String-Literale

Backticks begrenzen konstanten Text:

```as
lege `Hallo, Welt!` in Greeting
```

Ein Backtick-String kann sich über mehrere Quellzeilen erstrecken:

```as
lege `Zeile 1
    `Zeile 2
    `Zeile 3` in Message
```

Jede Fortsetzungszeile beginnt nach führendem Leerraum mit einem Backtick. Der führende Leerraum und der Fortsetzungs-Backtick werden entfernt, und die Zeilen werden ohne Zeilenumbrüche verbunden. Das obige Beispiel erzeugt den String `Zeile 1Zeile 2Zeile 3`.

Es gibt keine Escape-Syntax innerhalb von Backticks. Um ein literales Zeilenumbruch-, Tabulator- oder Backtick-Zeichen einzuschließen, verwende die Wert-Schlüsselwörter `zeilenumbruch`, `tabulator` und `backtick` mit `cat`:

```as
lege `Zeile 1` cat zeilenumbruch cat `Zeile 2` in Message
```

`zeilenumbruch`, `tabulator` und `backtick` sind Teil eines breiteren Satzes von nackten Wert-Schlüsselwörtern (darunter auch `leer`, `jetzt`/`zeitstempel`, `heute`, `umbruch`, `uuid`); siehe [Werte und Typen](values-and-types.md#special-value-keywords) für die vollständige Liste. Siehe [Zeichenketten und Text](strings-and-text.md) für `cat`-Muster.

## Labels

Ein Label ist ein Wort, gefolgt von `:` am Zeilenanfang:

```as
Loop:
    addiere 1 zu Counter
    wenn Counter ist kleiner als 10 gehe zu Loop
```

Labels sind die Ziele von `gehe zu`, `gosub` und Event-Handler-Registrierungen (`bei klick X gosub Label`).

## Zahlen

Ganzzahl-Literale sind einfach Ziffern. Negative Zahlen werden mit einem `-`-Präfix geschrieben:

```as
lege -3 in Offset
```

Es gibt keine Gleitkomma-Literale auf der syntaktischen Ebene — Zahlen, die wie Floats aussehen (`3.14`), sind Strings. Siehe [Arithmetik](arithmetic.md) für das Muster der skalierten Ganzzahlen.

## Doc-Block-Marker

Eine eigene lexikalische Kategorie, die für die Dokumentationsblock-Konvention statt für Laufzeitsemantik verwendet wird:

- `!!` öffnet einen Doc-Block und führt ihn fort. Jede `!!`-Zeile ist ein Prosa-Absatz.
- `!!!` (drei Ausrufezeichen) schließt den Block.

```as
!! Kurze Erklärung, was dieser Abschnitt tut und warum.
!! Eine nackte !!-Zeile trennt Absätze.
Section:
    ! der Code
    retourniere
!!!
```

Doc-Blöcke werden vor der Kompilierung entfernt. Vollständige Konvention in [Dokumentationsblöcke](doc-blocks.md).

## Layout

Code wird durch Einrückung strukturiert, nicht durch Satzzeichen.

- Labels beginnen am **linken Rand** — Spalte 1.
- Code unter einem Label ist einen Tab eingerückt.
- Code innerhalb von `beginn … ende` ist einen weiteren Tab eingerückt, wie verschachtelte Blöcke in anderen Sprachen.

```as
Main:
    setze Counter zu 0
    solange Counter ist kleiner als 5 beginn
        addiere 1 zu Counter
        drucke Counter
    ende
    stoppe
```

Wenn du bevorzugst, dass `beginn` und `ende` übereinstimmende Einrückungen haben — eine verbreitete Vorliebe, die aus anderen Sprachen übernommen wurde —, setze `beginn` auf eine eigene Zeile:

```as
Main:
    setze Counter zu 0
    solange Counter ist kleiner als 5
    beginn
        addiere 1 zu Counter
        drucke Counter
    ende
    stoppe
```

Beide Formen kompilieren. Wähle eine und verwende sie durchgängig in einem Skript.

Der Compiler ist tolerant gegenüber Leerraum, aber konsistentes Layout ist für die Prüfbarkeit unerlässlich. Fehlausgerichtete Blöcke sind ein starkes Signal für strukturelle Fehler — insbesondere bei KI-generiertem Code.

## Leere Zeilen

Verwende eine leere Zeile, um logische Gruppen zu trennen:

- Zwischen Variablendeklarationen verschiedener Art.
- Zwischen der Hauptgruppe der Variablen und Arbeitsvariablen (`I`, `N`, `Temp`).
- Zwischen großen beschrifteten Abschnitten.

Eine leere Zeile sagt: „Diese Dinge gehören als Gruppe zusammen, unterscheiden sich aber von der nächsten Gruppe." Zwei oder mehr tragen keine zusätzliche Bedeutung, sind aber harmlos.

## Variablennamen

Namen beginnen mit einem Großbuchstaben; danach CamelCase. Vollständige Konventionen in [Variablen und Arrays](variables-and-arrays.md) — diese Datei behandelt nur die lexikalische Regel.

## Siehe auch

- [Struktur](structure.md) — wo diese lexikalische Ebene in der Compiler-Pipeline sitzt.
- [Variablen und Arrays](variables-and-arrays.md) — vollständige Namenskonventionen.
- [Zeichenketten und Text](strings-and-text.md) — Zeichenketten mit `cat` aufbauen.
- [Dokumentationsblöcke](doc-blocks.md) — `!!` und `!!!` im Detail.
- [Arithmetik](arithmetic.md) — warum `-` nur ein Zahlen-Präfix ist.
