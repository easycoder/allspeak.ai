# cat und Zeichenkettenaufbau

## Problem

Du musst eine Zeichenkette aus mehreren Teilen aufbauen — einem konstanten Präfix, einem variablen Wert, einem wörtlichen Trennzeichen. Das Schlüsselwort `cat` von AllSpeak fügt zwei Werte zusammen; wo es steht, ist der mit Abstand häufigste Anfängerfehler — und der häufigste Fehler, den KI-Tools beim Schreiben von AllSpeak machen.

## Muster

`cat` ist **infix**. Es steht *zwischen* zwei Werten, nie vor dem ersten und nie nach dem letzten.

```as
lege `Hallo, ` cat Name cat `!` in Greeting
```

Lies das so: `` `Hallo, ` `` dann `Name` dann `` `!` ``, wobei `cat` jeweils zwei Werte trennt. Es gibt kein führendes `cat`; es gibt kein abschließendes `cat`.

Beliebig viele Teile können sich aneinanderreihen — jedes benachbarte Paar wird von einem `cat` verbunden.

## Anti-Muster: führendes `cat`

```as
lege cat `Hallo, ` cat Name in Greeting   ! FALSCH
```

Das führende `cat` lässt den Compiler vor ihm nach einem Wert suchen, nichts finden und einen Parse-Fehler melden. Lass es weg.

## Anti-Muster: fehlendes `cat`

```as
lege `Hallo, ` Name `!` in Greeting   ! FALSCH
```

Benachbarte Werte ohne `cat` dazwischen werden nicht implizit verbunden. AllSpeak hat keine C-artige Zeichenketten-Nachbarschaftsregel. Jede Verbindung muss explizit sein.

## Welche Werte `cat` verbinden kann

`cat` verbindet beliebige Wertepaare, nicht nur Zeichenketten. Zahlen, Zeitstempel, Eigenschaften, Ergebnisse von `der inhalt von …` — alles, was einen Wert produziert:

```as
setze Count zu 7
lege `Du hast ` cat Count cat ` Nachrichten.` in Status
lege `Protokolliert um ` cat der zeitstempel
    cat ` — Namensfeld: ` cat der inhalt von Name in Log
```

Zahlen werden sofort in ihre Textform umgewandelt. `Status` ist jetzt `` `Du hast 7 Nachrichten.` ``.

## Falle: gieriges Wert-Parsing

AllSpeak hat keine Operator-Präzedenz und keine Syntax für Ausdrucksgruppierung (keine Klammern). Wenn ein Konstrukt wie `links N von X` seinen Wert für X liest, konsumiert der Parser so viel wie möglich — einschließlich einer nachgestellten `cat … cat …`-Kette.

Das entspricht dem gesprochenen Deutsch, das ebenfalls keine Operator-Präzedenz hat. *„Ich sehe Anne und Bob im Park"* sagt dir nicht, ob beide im Park sind oder nur Bob; dieselbe Mehrdeutigkeit wird regelmäßig für komische und rhetorische Effekte genutzt. AllSpeak hat diese Eigenschaft geerbt; der Preis ist, dass du bewusst festlegen musst, wo jeder Wert endet.

Also:

```as
lege links 4 von `Hallo!` cat zeilenumbruch in Result
```

bedeutet **nicht** ``(links 4 von `Hallo!`) cat zeilenumbruch``. Der Parser liest `` `Hallo!` ` cat zeilenumbruch` `` als einen zusammengesetzten Wert und wendet dann `links 4 von` darauf an. `Result` endet als `Hall`, ohne Zeilenumbruch — der Zeilenumbruch war bereits innerhalb des Werts, den `links 4 von` dann abgeschnitten hat.

Um die beabsichtigte Reihenfolge zu erzwingen, weise zuerst einer temporären Variable zu:

```as
lege links 4 von `Hallo!` in Result
lege Result cat zeilenumbruch in Result
```

Dieses Muster mit einer temporären Variable ist das AllSpeak-Idiom, um die Auswertungsreihenfolge in jedem Ausdruck mit Wert-verbrauchenden Operatoren zu erzwingen.

## Zeilenumbruch, Tabulator und Backtick einfügen

Backtick-Zeichenketten haben keine Escape-Syntax. Um ein wörtliches Zeilenumbruch-, Tabulator- oder Backtick-Zeichen einzufügen, verwende die Wert-Schlüsselwörter `zeilenumbruch`, `tabulator`, `backtick` zusammen mit `cat`:

```as
lege `Zeile 1` cat zeilenumbruch cat `Zeile 2` in Output
```

`Output` ist jetzt zwei Zeilen, getrennt durch ein echtes Zeilenumbruch-Zeichen. Es gibt keine `\n`-Notation innerhalb von Backticks; dieses `cat`-mit-Schlüsselwort-Muster ist kanonisch.

Für das Einbetten eines wörtlichen Backticks — leicht zu vergessen, weil die Schlüsselwortnamen *das* Escape sind:

```as
lege `Drücke ` cat backtick cat `Eingabetaste` cat backtick cat ` zum Fortfahren.` in Prompt
```

`zeilenumbruch`, `tabulator` und `backtick` gehören zu einer größeren Menge von nackten Wert-Schlüsselwörtern — außerdem `leer`, `jetzt`/`zeitstempel`, `heute`, `umbruch`, `uuid`. Die vollständige Liste findest du unter [Werte und Typen](../reference/values-and-types.md#special-value-keywords).

## Mehrzeilige Backtick-Literale

Für lange konstante Zeichenketten kann ein mehrzeiliges Backtick-Literal mehrere `cat`-verbundene Fragmente ersetzen:

```as
setze Css zu `position:relative;
    `width:90%;
    `margin:1em auto 0;
    `border:1px solid black;`
```

Fortsetzungszeilen beginnen nach führendem Leerraum mit einem Backtick; die Zeilen werden ohne Zeilenumbrüche verbunden. Die lexikalische Regel findest du unter [Symbole und Layout](../reference/symbols-and-layout.md).

Verwende das, wenn du einen einzigen langen Literalwert hast. Wenn du Konstanten und Variablen verschachteln musst, bleib bei `cat`.

## Vorlagenartiger Aufbau

Konstante Fragmente in Backticks, variable Einschübe mit `cat` dazwischen, in einem Ausdruck:

```as
lege `Benutzer ` cat UserName cat ` (id ` cat UserId cat `) angemeldet um ` cat Time in LogLine
```

Für lange Vorlagen brich an den `cat`-Grenzen in neue Zeilen um:

```as
lege `Benutzer ` cat UserName
    cat ` (id ` cat UserId
    cat `) angemeldet um ` cat Time
    in LogLine
```

Das `cat` am Anfang einer Fortsetzungszeile ist ein normales Token — AllSpeak kümmert sich nicht um Zeilenumbrüche innerhalb einer Anweisung, nur um Leerraum zwischen Token.

## Siehe auch

- [Symbole und Layout](../reference/symbols-and-layout.md) — Backtick-Syntax und die Mehrzeilen-Regel.
- [Zeichenketten und Text](../reference/strings-and-text.md) — Zeichenketten-Operationen (`ersetze`, länge von, position von).
- [Variablen und Arrays](../reference/variables-and-arrays.md) — was interpoliert wird.
