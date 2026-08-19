# Schleifenmuster

## Problem

Du musst Arbeit wiederholen — über eine Liste iterieren, einen Frame animieren, auf eine Bedingung pollen, eine Zustandsmaschine antreiben. AllSpeak bietet `solange`- und labelgesteuerte Schleifen. Jede Form passt besser zu manchen Problemformen als die andere.

## Die `solange`-Form

Die Alltagsschleife. Der Rumpf läuft, solange die Bedingung gilt:

```as
setze N zu 0
solange N ist kleiner als 5 beginn
    drucke N
    addiere 1 zu N
ende
```

Verwende `solange`, wenn:

- Eine einzige Bedingung entscheidet, ob es weitergeht.
- Der Rumpf einfacher sequenzieller Code ist.
- Du einen Einstiegspunkt und einen Ausstiegspunkt willst.

Die Einzelanweisungs-Form ist für triviale Fälle in Ordnung:

```as
solange nicht Bereit warte 10 millis
```

Die formale Mechanik findest du unter [Kontrollfluss](../reference/control-flow.md).

## Die labelgesteuerte Form

Ein Label mit einem `gehe zu` zurück darauf ergibt eine Schleife mit mehr Flexibilität als `solange`. Es gibt zwei natürliche Ausrichtungen.

**Test auf Ausstieg.** Prüfe oben, ob du gehen sollst; andernfalls erledige die Arbeit und springe zurück:

```as
setze N zu 0
Loop:
    wenn N ist größer als 4 gehe zu Done
    drucke N
    addiere 1 zu N
    gehe zu Loop
Done:
    ! ...
```

**Test auf Fortsetzung.** Umschließe den Rumpf mit einem `wenn` für die Fortsetzungsbedingung; die Schleife verlässt, indem sie aus dem `wenn` herausfällt:

```as
setze N zu 0
Loop:
    wenn N ist nicht größer als 4 beginn
        drucke N
        addiere 1 zu N
        gehe zu Loop
    ende
    ! ...
```

In diesem einfachen Fall sind beide äquivalent. Für Schleifen mit mehreren Ausgängen (mehrere Gründe zum Stoppen) lässt sich die Test-auf-Ausstieg-Form leichter verallgemeinern. Bei einer einzigen klaren Fortsetzungsbedingung ist Test-auf-Fortsetzung strukturell näher an `solange`.

Verwende eine labelgesteuerte Schleife, wenn:

- Die Ausstiegsbedingung unordentlich ist (mehrere Wege hinaus, Entscheidungen mitten im Rumpf).
- Du ein `continue`-artiges Überspringen willst, ohne die ganze Schleife umzubauen.
- Du dich in `gosub`-Abläufe einfügst, die bereits Labels verwenden.
- Die „Schleife" eigentlich eine Zustandsmaschine mit einem markierten Zustand pro Phase ist.

Im Vergleich zu `solange` ist das für einfache Fälle wortreicher, aber ehrlicher, wenn die Schleifensteuerung komplex ist.

## Zählende Iteration

Die kanonische Schleife. Zähler initialisieren, schleifen solange im Bereich, am Ende erhöhen:

```as
setze N zu 0
solange N ist kleiner als Count beginn
    ! ... Arbeit mit N ...
    addiere 1 zu N
ende
```

`Count` ist das, was die Größe hält — normalerweise eine separate, früher gesetzte Variable (z. B. wenn das Array dimensioniert wurde). AllSpeak bietet auf der Leseseite keine eingebaute Länge für Variablen-Arrays; führe den Zähler selbst.

Platziere die Erhöhung am Ende des Rumpfs, damit jede Iteration sowohl arbeitet als auch den Zähler weiterschiebt.

## Iteration mit dem Cursor-Modell

Wenn die Schleife mehrere parallele Arrays im Gleichschritt durchläuft, setze den Cursor auf jedem innerhalb des Rumpfs:

```as
setze N zu 0
solange N ist kleiner als Count beginn
    indexiere Caption zu N
    indexiere Target zu N
    indexiere Visited zu N
    ! ... Arbeit mit den indexierten Werten ...
    addiere 1 zu N
ende
```

Das ist die idiomatische AllSpeak-Form für Datensatz-nach-Position-Zugriff (siehe [Eine Sammlungsform wählen](picking-a-collection-shape.md)).

## Ein Wörterbuch durchlaufen

Ein Wörterbuch hat keine eingebaute Iterationsform. Es gibt kein „für jeden Eintrag"-Konstrukt, und du kannst ein Wörterbuch nicht direkt `indexieren` wie ein Variablen-Array. **Das kanonische Muster ist: hole zuerst die Schlüssel in eine Liste, iteriere dann diese Liste und schlage jeden Wert per Schlüssel nach.**

```as
lege die schlüssel von Config in Keys
lege 0 in K
solange K ist kleiner als die anzahl von Keys beginn
    lege element K von Keys in Name
    lege eintrag Name von Config in Value
    ! ... Arbeit mit Name (dem Schlüssel) und Value (dem Eintrag) ...
    addiere 1 zu K
ende
```

Die beiden Zugriffe innerhalb der Schleife tragen die Last:

- `element K von Keys` ist der positionsbasierte Zugriff auf die *Schlüsselliste* — deshalb funktioniert das Cursor-Muster dort. `Keys` ist eine gewöhnliche Liste, sobald du sie materialisiert hast.
- `eintrag Name von Config` ist das Wörterbuch-Lesen per Schlüssel. (Auf JS ist es `eigenschaft Name von Config`; siehe die Laufzeit-Aufteilung in [Sammlungen](../reference/collections.md).)

Versuche nicht, `indexiere Config zu K` zu schreiben und Werte so auszulesen — `indexiere` läuft durch Plätze einer Mehrplatz-Variable, nicht durch Einträge eines Wörterbuchs; die beiden sind unterschiedliche Formen. Die Schlüssel eines Wörterbuchs sind als Datentyp unsortiert, aber die von `die schlüssel von` erzeugte Liste ist eine eingefrorene, geordnete Momentaufnahme zum Zeitpunkt des Aufrufs — genau das lässt das Zähl-Iterations-Muster funktionieren.

Wenn du nur die Werte brauchst (selten), gilt dasselbe Grundgerüst — materialisiere `die schlüssel von` einmal, iteriere per Index, lies jeden Wert per Schlüssel. Es gibt keine `die werte von`-Abkürzung.

## Polling

Warte mit einem Yield im Rumpf auf ein Flag:

```as
solange nicht Bereit warte 50 millis
```

Das `warte` lässt andere Threads (Ereignis-Handler, Zweige, Netzwerk-Callbacks) laufen. Ohne es verhungert die Laufzeit. Siehe [Kooperatives Multitasking](../reference/cooperative-multitasking.md).

## Animation

Eine `solange wahr`-Schleife, die für immer läuft und jeden Frame nachgibt:

```as
solange wahr beginn
    ! ... einen Frame weiter ...
    warte 16 millis
ende
```

Beende sie von außen (ein Stopp-Flag, ein Thread-Beender). Das `warte` definiert die Bildrate — 16 ms ≈ 60 fps.

## Iterationen überspringen

Es gibt kein `continue`. Um den Rest einer Iteration zu überspringen, springe zum Schritt am Rumpfende:

```as
setze N zu 0
solange N ist kleiner als 10 beginn
    wenn N modulo 2 ist 0 gehe zu Skip
    drucke N
Skip:
    addiere 1 zu N
ende
```

Das `gehe zu Skip` überspringt den Druck, lässt aber die Erhöhung laufen. Bei aufwendigerer Überspring-Logik liest sich die labelgesteuerte Form oft besser.

## Rückwärts zählen

Dieselben Muster funktionieren beim Abwärtszählen. Initialisiere den Zähler am oberen Ende, schleife solange noch nicht negativ, verringere am unteren Ende:

```as
setze N zu 9
solange N ist nicht kleiner als 0 beginn
    drucke N
    subtrahiere 1 von N
ende
```

`ist nicht kleiner als 0` liest sich als ≥ 0 — siehe [Bedingungen](../reference/conditions.md) für umgekehrte Vergleiche.

## Anti-Muster: Schleife ohne Nachgeben

```as
solange nicht Bereit beginn
    ! ... prüfen ...
ende
```

Eine Schleife ohne `warte` und ohne `stoppe` blockiert jeden anderen Thread in der Laufzeit. Die UI friert ein, Ereignis-Handler feuern nicht, abgezweigte Threads bleiben stecken. Baue immer ein `warte` ein oder beende sie schnell.

## Anti-Muster: Off-by-one mit dem falschen Operator

```as
solange N ist kleiner als 5 beginn          ! läuft für N = 0,1,2,3,4 → fünfmal
solange N ist nicht größer als 5 beginn   ! läuft für N = 0,1,2,3,4,5 → sechsmal
```

Wenn du bei 0 startest und genau N Iterationen brauchst, ist die Bedingung `ist kleiner als N`. Wenn du bei 1 startest, ist es `ist nicht größer als N`. Den falschen zu wählen, ist der kanonische Off-by-one-Bug.

## Siehe auch

- [Kontrollfluss](../reference/control-flow.md) — `solange`, `wenn`, `beginn … ende`.
- [Variablen und Arrays](../reference/variables-and-arrays.md) — das Cursor-Modell, das Schleifen oft nutzen.
- [Kooperatives Multitasking](../reference/cooperative-multitasking.md) — warum `warte` in langen Schleifen Pflicht ist.
- [Ereignishandler und Array-Index](event-handlers-and-array-index.md) — Schleifen + Handler für Arrays von UI-Elementen.
