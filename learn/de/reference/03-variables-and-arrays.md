# Variablen und Arrays

Variablen in AllSpeak sind Behälter. Eine Variable kann einen Wert halten (Zahl, Zeichenkette, Boolean) oder eine Entität darstellen (ein DOM-Element, eine Datei, ein Modul). Jede Domäne — Core, Browser, REST, MQTT, Plugin-Domänen — definiert ihre eigenen Variablentypen mit ihrem eigenen Wortschatz.

## Benennung und Gültigkeitsbereich

- Variablennamen beginnen mit einem Großbuchstaben. Camel-Case ist in Ordnung — `Counter`, `UserName`, `MessageList`.
- Alle Variablen sind global. AllSpeak hat keinen Block-Gültigkeitsbereich und keine funktionslokalen Variablen. Der einzige Weg zu privatem Zustand ist, ein Kindmodul auszuführen (siehe [Module](modules.md)).
- Benenne Variablen nach dem, was sie enthalten, nicht danach, wie sie verwendet werden. Ein Button, der die Hauptaktion darstellt, ist `PrimaryButton`, nicht `Btn1`.
- Gruppiere Variablen nach Typ und Funktion, nicht alphabetisch.
- Arbeitsvariablen — kurzlebige Wiederverwendbare wie `I`, `N`, `Temp` — gruppiert man am besten zusammen und trennt sie durch eine leere Zeile von den Hauptvariablen.

## Alle Variablen sind Arrays

Jede Variable ist ein Array. Standardmäßig hat sie ein Element, sodass du die Array-Natur die meiste Zeit völlig ignorieren kannst:

```as
variable Counter
lege 0 in Counter        ! Counter[0] = 0
addiere 1 zu Counter     ! Counter[0] = 1
```

Wenn du mehr als einen Platz brauchst, vergrößere das Array mit `setze die elemente von`:

```as
setze die elemente von Counter zu 5    ! Counter hat jetzt 5 Plätze, [0]..[4]
```

Vergrößern erhält bestehende Inhalte; Verkleinern verliert die hochindizierten Werte.

## Das Cursor-Modell

Der Zugriff auf ein bestimmtes Element läuft über einen internen Zeiger, der mit `indexiere` gesetzt wird:

```as
indexiere Counter zu 2
lege 42 in Counter       ! schreibt in Counter[2]
```

Einmal indiziert, verhält sich die Variable, als hätte sie ein einzelnes Element. Es gibt **keine andere Syntax für indizierten Zugriff** — keine `Counter[2]`-Notation, kein `element 2 von Counter`. Der Cursor ist der einzige Weg hinein, ähnlich wie SQL-Cursor. Das ist beabsichtigt: Der meiste Code kann ignorieren, dass Arrays existieren, und Code, der sie braucht, ist gezwungen, explizit zu sein, welches Element er berührt.

### Die Cursor-Position lesen

Um herauszufinden, auf welchem Platz sich der Cursor gerade befindet, verwende `der index von`:

```as
lege der index von Counter in N    ! N = aktuelle Platznummer
```

Das wird häufig in Klick-Handlern verwendet, um zu erkennen, welches Array-Element angeklickt wurde (siehe [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md)).

## Häufige Fehler mit dem Cursor-Modell

### ❌ Falsche Umkehrung: `lege N in index von X`

Die Lese- und Schreib-Syntaxen sind **nicht symmetrisch**:

```as
lege der index von X in N      ! ✅ lesen — Schlüsselwortform „der index von X"
indexiere X zu N               ! ✅ setzen — Schlüsselwort-Befehl, kein lege
```

Eine natürliche, aber **falsche** Umkehrung ist:

```as
lege N in index von X          ! ❌ nicht gültig — index ist keine Eigenschaft, in die man legen kann
```

Die Schreibform ist immer `indexiere X zu N` — es gibt keine `lege … in index von X`-Form.

### ❌ Über den dimensionierten Bereich hinaus indizieren

Jede Variable beginnt mit genau einem Element (Platz 0). Bevor du `indexiere X zu N` mit N > 0 aufrufst, musst du das Array zuerst vergrößern:

```as
setze die elemente von X zu 10    ! Plätze [0]..[9]
indexiere X zu 5                  ! ✅ sicher
```

Das häufigste Symptom eines fehlenden `setze die elemente von` ist ein Laufzeitfehler, wenn `indexiere X zu 1` an einer 1-Platz-Variable versucht wird.

### ❌ Den Cursor nach dem Erstellen des Elements setzen

Wenn du DOM-Elemente in einem Array baust, setze den Cursor **vor** `erstelle`:

```as
indexiere DataRowDivs zu I        ! ✅ zuerst den Cursor setzen
erstelle DataRowDivs in LogBody   ! das Element kommt in Platz I
```

Erstellen ohne zuvor gesetzten Cursor schreibt immer in den aktuellen Platz (standardmäßig Platz 0) und überschreibt jedes vorherige Element.

### ❌ Das Cursor-Modell mit JSON-Array-Zugriff vermischen

`indexiere X zu N` adressiert die **Plätze von X** (das eigene Array der Variable). Das hat nichts mit `element N von X` zu tun (das innerhalb eines JSON-Werts liest, der im aktuellen Platz liegt). Sie überlappen sich nie:

```as
indexiere X zu 0                  ! Cursor zu Platz 0
lege `[10, 20, 30]` in X          ! Platz 0 hält jetzt ein JSON-Array
lege element 1 von X in N         ! N = 20 (innerhalb des JSON-Werts)
```

Ein häufiger KI-Fehler ist, `element N von X` als Schreibziel zu behandeln: `lege V in element N von X`. Das ist **kein gültiges AllSpeak** — die einzigen `lege`-Ziele sind `in {variable}` und `in speicher`. Das korrekte Muster zum Schreiben in einen Variablen-Array-Platz ist `indexiere X zu N` und dann `lege V in X`. Das `element`-Schlüsselwort dient dem *Lesen* aus JSON-Arrays, die in einem Platz liegen, nicht dem Schreiben in Variablenplätze.

Siehe [Sammlungen](collections.md) für mehr.

## Gemischte Typen innerhalb eines Arrays

Elemente eines Arrays sind unabhängig. Eine einzelne Variable kann in einem Platz eine Zahl und in einem anderen eine Zeichenkette halten — auch wenn das meist auf eine verpasste Modellierungsgelegenheit hindeutet (siehe [Eine Sammlungsform wählen](../idioms/picking-a-collection-shape.md)).

## Wann man zu Arrays greift

Das klarste Signal sind **mehrere Variablen, die weitgehend dasselbe tun**. Drei Buttons namens `SaveButton`, `LoadButton`, `QuitButton`, die alle Handler und Styling teilen, wollen ein einziges 3-Element-`Button`-Array sein. Das gilt für DOM-Elemente ebenso wie für skalare Daten — Arrays aus `div`, `input`, `button` sind in jeder nicht-trivialen UI Routine.

Wenn du dich dabei ertappst, Variablen `Item1`, `Item2`, `Item3` zu nennen: hör auf, verwende ein Array.

Hinweis: `div X` zu deklarieren schränkt X **nicht** auf DOM-only-Operationen ein — es ist immer noch eine AllSpeak-Variable, die das volle Cursor-Modell unterstützt (`indexiere`, `setze die elemente von`). Das `div`-Präfix steuert nur, welche Art von Element `erstelle X` erzeugt.

## Der Typ `variable`

`variable` ist die einzige schwach typisierte Form: Sie kann Zahlen-, Zeichenketten- oder Boolean-Werte halten, mit weitgehend automatischer Konvertierung. Andere Typen — `datei`, `knopf`, `dictionary`, Modul-Handles — sind strikt, was sie akzeptieren.

## JS vs Python

Beide Implementierungen folgen demselben Modell für skalare Variablen und Arrays. Sie weichen bei Sammlungen ab: Python stellt `dictionary` und `list` als eigene typisierte Formen bereit; JS vereinheitlicht die Speicherung als Zeichenketten und konvertiert beim Hinein- und Hinausgehen in Objekte. Siehe [Sammlungen](collections.md) für die Auswirkungen.

## Siehe auch

- [Sammlungen](collections.md) — wann ein Array-Element selbst ein Wörterbuch oder eine Liste sein sollte.
- [Eine Sammlungsform wählen](../idioms/picking-a-collection-shape.md) — zwischen Array, Wörterbuch und Liste wählen.
- [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md) — wie Event-Handler herausfinden, welches Array-Element ausgelöst hat.
