# Kontrollfluss

AllSpeaks Kontrollfluss ist aus einer kleinen Menge frei kombinierbarer Konstrukte aufgebaut: sequenzielle Anweisungen, gruppiert mit `beginn … ende`, bedingtes `wenn … sonst`, die `solange`-Schleife, Labels mit `gehe zu` und `gosub`, sowie Thread-Ebene `stoppe` und `beende`. AllSpeak spiegelt die natürliche Sprache wider; die Konstrukte sind bewusst einfach, und du bist frei, dich im Code nach Belieben zu bewegen.

Es gibt keinen Operator-Stil-Fluss (kein frühes Zurückkehren über Ausdrücke, keine Ausnahmen). Fehlerbehandlung für bestimmte Befehle wird in [Fehler und Wiederherstellung](errors-and-recovery.md) behandelt; Thread-Start in [Kooperatives Multitasking](cooperative-multitasking.md).

## Sequenz und Blöcke

Anweisungen innerhalb eines beschrifteten Abschnitts laufen von oben nach unten:

```as
Main:
    setze Counter zu 0
    addiere 1 zu Counter
    drucke Counter
    stoppe
```

Um eine Sequenz zu einer einzigen zusammengesetzten Anweisung zu gruppieren, umschließe sie mit `beginn … ende`. Überall, wo eine einzelne Anweisung erwartet wird, kann ein `beginn … ende`-Block einspringen.

```as
solange N ist kleiner als 5 beginn
    addiere 1 zu N
    drucke N
ende
```

Ein `beginn … ende`-Block ist für den Parser eine Anweisung; der Rumpf darin ist sequenziell. Siehe [Symbole und Layout](symbols-and-layout.md) für den alternativen Stil, bei dem `beginn` auf einer eigenen Zeile mit passender Einrückung steht.

## `wenn` / `sonst`

Bedingte Ausführung. Einzelanweisungs- und Blockformen:

```as
wenn Counter ist 0 drucke `Counter ist null`

wenn Counter ist 0 beginn
    drucke `Counter ist null`
    setze Reset
ende
```

Mit `sonst` kann jeder Zweig eine Einzelanweisung oder ein Block sein:

```as
wenn Counter ist 0
    drucke `null`
sonst beginn
    drucke `nicht null, Wert:`
    drucke Counter
ende
```

Bedingungen sind schlüsselwortgetrieben (`ist`, `ist kleiner als`, `ist größer als`, `ist nicht`, `enthält` usw.) — siehe [Bedingungen](conditions.md). Ein Konstrukt, das nicht direkt verfügbar ist, kann meist umgekehrt werden: `ist größer als oder gleich` kann als `ist nicht kleiner als` geschrieben werden.

Ein nackter Wahrheitstest liest den aktuellen Zustand der Variable:

```as
wenn Clicked setze den inhalt von Button zu `Erledigt`
```

`Clicked` wird hier als Boolean behandelt. `setze Clicked` macht es wahr; `leere Clicked` macht es falsch. Für einen expliziten Test sind `wenn Clicked ist wahr …` und `wenn Clicked ist falsch …` ebenfalls akzeptiert. Obwohl jeder nicht-leere Wert allgemein als wahr behandelt wird, ist es sicherer, dass die Variable explizit mit `setze` oder `leere` auf einen Boolean gesetzt wurde.

## `solange`

Schleifen. Dieselbe Einzel-/Block-Aufteilung wie `wenn`:

```as
setze N zu 0
solange N ist kleiner als 5 beginn
    drucke N
    addiere 1 zu N
ende
```

Endlosschleife, durch einen internen Ausstieg gebrochen:

```as
solange wahr beginn
    ! ... eine Nachricht verarbeiten ...
    wenn Done stoppe
ende
```

Beendigung: entweder die Bedingung falsch werden lassen oder über `gehe zu Label`, `stoppe`, `retourniere` oder `beende` ausbrechen. Es gibt kein eigenes `umbruch` oder `weiter` — wähle das Konstrukt, das zu dem passt, was du als Nächstes tun willst. Die Verwendung von `gehe zu` zum Verlassen einer Schleife hat keine Stapel-Auswirkungen; AllSpeak behandelt Labels als freie Ziele.

## Labels und `gehe zu`

Jedes Wort am linken Rand, das mit `:` endet, ist ein Label. Labels sind Ziele für `gehe zu`, `gosub` und Event-Handler-Registrierungen:

```as
Start:
    setze Counter zu 0
    gehe zu Loop

Loop:
    addiere 1 zu Counter
    wenn Counter ist kleiner als 10 gehe zu Loop
    drucke Counter
    stoppe
```

`gehe zu` überträgt die Kontrolle unbedingt und schiebt keine Rückkehradresse. Das Ziel läuft, bis es auf sein eigenes `stoppe`, `beende` oder ein anderes `gehe zu` trifft — was es als Nächstes tut, ist der neue Fluss.

### Berechnetes Label (`gehe zu label <Ausdruck>`)

Wenn eine `wenn … sonst`-Kette lang wird, kannst du den Label-Namen zur Laufzeit berechnen:

```as
variable Outcome
gosub zu ComputeOutcome      ! setzt Outcome z. B. auf `Edit`, `Save`, `Delete`
gehe zu label Outcome        ! springt zu dem Label, das die Zeichenkette nennt
```

Der Ausdruck nach `label` kann jeder Wertausdruck sein — eine Variable, ein String-Literal oder eine `cat`-Kette:

```as
gosub zu label `Option` cat N     ! springt zu Option1, Option2, …
gehe zu label `SharedHandler`     ! konstante Zeichenkette
```

Das Label wird zur Laufzeit aufgelöst — wenn kein passendes Label existiert, wird ein Laufzeitfehler gemeldet. Es gibt keine Kompilierzeit-Validierung, sodass das Tippen eines nicht existierenden Label-Namens sicher ist (es wird zur Laufzeit einen Fehler werfen, wo du ihn mit einer `on failure`-Klausel auf `gosub` fangen kannst).

## `gosub` und `retourniere`

Ein Unterroutine-Aufruf: Rückkehradresse schieben, zum Label springen, bis `retourniere` laufen, Rückkehradresse ziehen.

```as
Main:
    gosub Setup
    gosub Render
    stoppe

Setup:
    setze Counter zu 0
    retourniere

Render:
    drucke Counter
    retourniere
```

Sowohl `gosub Label` als auch `gosub zu Label` sind akzeptiert; die Codex-Beispiele verwenden `gosub zu`. Wähle eine und bleib konsistent.

### Berechnetes gosub (`gosub zu label <Ausdruck>`)

Dieselbe berechnete-Label-Syntax funktioniert mit `gosub` und `zweige`:

```as
gosub zu label `Handler` cat Event      ! berechneter Unterroutine-Aufruf
zweige zu label `Task` cat N            ! berechneter paralleler Zweig
```

`zweige zu label <Ausdruck>` verhält sich identisch: Es wertet den Ausdruck aus, löst das Label auf und startet einen parallelen Thread dort. Wie bei `gehe zu label` wird das Label zur Laufzeit aufgelöst und meldet einen Fehler, wenn es fehlt.

### Parameter mit `gosub … mit` übergeben

Verwende `gosub … mit`, um Werte zu übergeben, und `lege parameter`, um sie nach Position zu lesen:

```as
variable Key
variable BodyText
variable Y
variable M
variable D
variable Year
variable Month
variable Day

Main:
    gosub JsonAddString mit `slug`
    gosub FormatDate mit Year und Month und Day
    stoppe

JsonAddString:
    lege parameter 0 in Key
    lege `{"` cat Key cat `":` in BodyText
    ...
    retourniere

FormatDate:
    lege parameter 0 in Y
    lege parameter 1 in M
    lege parameter 2 in D
    ...
    retourniere
```

`gosub Label mit Expr1 und Expr2 …` akzeptiert alles, was `getValue()` parsen kann — Variablen, Literale, `cat`-Ketten, `anzahl von` usw. Argumente sind null-basiert; `lege parameter 0 in Var` liest den ersten übergebenen Wert.

`parameter` ist ein **Wertausdruck**, sodass du ein Argument überall lesen kannst, wo ein Wert erwartet wird:

```as
JsonAddString:
    lege parameter 0 in Key
    logge parameter 1                            ! das zweite Argument loggen
    wenn parameter 0 ist `slug`
        gosub Warn
    ende
    gosub Forward mit parameter 0                ! das Argument weiterreichen
    retourniere
```

Der Index ist ein einzelnes Zahlen-Token, sodass eine folgende `cat`-Kette nicht verschluckt wird: `lege parameter 1 cat `-` cat parameter 2 in DateStr` liest Argument 1, dann Argument 2 und verkettet dann.

Die kürzere Form `param` wird überall akzeptiert, wo `parameter` akzeptiert wird — `param 0 in Key` (ein eigener Befehl) und `lege param 0 in Key` funktionieren beide — ebenso wie die übersetzte Vollform in jedem Sprachpaket (`paramètre` auf Französisch, `parametro` auf Italienisch, `Parameter` auf Deutsch).

Wenn eine Unterroutine ohne `mit` aufgerufen wird, gibt `parameter` `0` (numerisch) zurück — bestehende Unterroutinen sind davon nicht betroffen.

### Fehlerbehandlung

Ein `gosub … mit`-Aufruf kann eine `oder`- / `on failure`-Klausel haben:

```as
gosub FetchData mit Url oder gosub OnError
```

### Der Aufruf-Argumente-Stapel

Parameter leben auf einem impliziten Stapel, der erzeugt wird, wenn `mit` verwendet wird, und verworfen wird, wenn die Unterroutine `retourniere`t. Verschachtelte Aufrufe funktionieren korrekt:

```as
gosub Outer mit A
  ...
  gosub Inner mit X und Y   ! neuer Frame wird geschoben
  lege parameter 0 in Z     ! liest X (Inners Frame)
  ...
  retourniere               ! Inners Frame wird gezogen
  lege parameter 0 in W     ! liest A (Outers Frame)
  ...
  retourniere               ! Outers Frame wird gezogen
```

Der Stapel ist thread-lokal (gemäß dem kooperativen Multitasking-Modell). Für alles, was größer als ein paar Helfer ist, erwäge ein [Modul](modules.md), das private Variablen, Nachrichtenübermittlung und Nebenläufigkeit bereitstellt.

## `stack`, `push` und `pop`

Um eine Arbeitsvariable über einen Unterroutine-Aufruf hinweg wiederzuverwenden, ohne ihren Wert zu verlieren, schiebe sie zuerst auf einen Stapel und ziehe sie danach wieder. Die Befehle `stack`, `push` und `pop` haben noch keine deutsche Form — sie bleiben englisch, auch in einem deutschen Skript:

```as
stack MyStack
...
setze X zu 99
push X onto MyStack
setze X zu 0            ! X für etwas anderes wiederverwenden
pop X from MyStack
drucke X               ! druckt 99
```

Verwende das, wenn eine Unterroutine dieselben Arbeitsnamen (`I`, `N`, `Temp`) wie ihr Aufrufer braucht und du den seltenen, aber realen Fehler vermeiden willst, dass einer den anderen überschreibt.

## `stoppe` und `beende`

Zwei Wege, etwas zu beenden:

- **`stoppe`** parkt den aktuellen Thread. Der Haupt-Thread endet immer mit `stoppe` (sonst läuft er über das Ende seines beschrifteten Abschnitts hinaus). Event-Handler und abgezweigte Threads verwenden `stoppe`, um sich früh zu beenden.
- **`beende`** beendet das gesamte Skript. In einem Modul gibt `beende` die Kontrolle an den Parent zurück; im Hauptskript fährt es die Laufzeit herunter. Wenn ein Modul endet, wird sein gesamter Laufzeitspeicher für die Garbage Collection freigegeben — das ist es, was einer Anwendung erlaubt, viel Funktionalität anzusammeln, ohne dass alles auf einmal im Speicher sitzt.

`stoppe` ist pro Thread; `beende` ist pro Skript.

## Wann welches verwenden

- Eine einzelne bedingte Aktion → `wenn`.
- Eine sich wiederholende Aktion → `solange`.
- Ein wiederverwendbarer Block, der von mehreren Stellen aufgerufen wird → `gosub` zu einem Label.
- Eine Mehrweg-Verzweigung, die eine Kette von `wenn … sonst` bräuchte → **`gehe zu label`** (berechneter goto). Siehe [den Abschnitt über berechnete Labels](#computed-label-go-to-label-expr).
- Ein Stück Logik, das groß genug für privaten Zustand ist → ein Modul ([Module](modules.md)).
- Ein asynchron wirkender Fluss bei einem UI-Ereignis → eine `bei …`-Registrierung, die einen Handler per `gosub` aufruft ([Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md)).

## Siehe auch

- [Symbole und Layout](symbols-and-layout.md) — Labels, Einrückungsregeln und der `beginn`/`ende`-Stil.
- [Bedingungen](conditions.md) — was nach `wenn` und `solange` kommt; Bedingungen kombinieren.
- [Fehler und Wiederherstellung](errors-and-recovery.md) — `oder` und `on failure` für die Fehlerbehandlung auf Befehlsebene.
- [Kooperatives Multitasking](cooperative-multitasking.md) — `zweige`, Thread-Abgabe, `warte`.
- [Module](modules.md) — privater Zustand und Nachrichtenübermittlung für große Brocken.
