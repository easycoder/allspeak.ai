# Zeichenketten und Text

AllSpeaks Zeichenketten-Typ ist der Alltags-Behälter für Text. Diese Datei listet die Operationen auf, die Core zum Untersuchen und Transformieren von Zeichenketten bereitstellt.

Backtick-Literale und `cat`-Verkettung werden in [Symbole und Layout](symbols-and-layout.md) und [cat und Zeichenkettenaufbau](../idioms/cat-and-string-building.md) behandelt.

## Länge

`die länge von X` gibt die Zeichenanzahl zurück:

```as
lege die länge von `Hallo, Welt!` in N
! N ist 12
```

## Schneiden

Vier Formen, die alle eine Teilzeichenkette erzeugen, ohne das Original zu verändern:

```as
lege links 5 von `Hallo, Welt!` in A         ! "Hallo"
lege rechts 6 von `Hallo, Welt!` in B        ! " Welt!"
lege von 7 von `Hallo, Welt!` in C           ! "Welt!"   (von Position 7 bis zum Ende)
lege von 7 zu 12 von `Hallo, Welt!` in D     ! "Welt"    (Positionen 7..11, Ende exklusiv)
```

- `links N von X` — die ersten N Zeichen. N muss eine nicht-negative Ganzzahl sein.
- `rechts N von X` — die letzten N Zeichen. N muss eine nicht-negative Ganzzahl sein.
- `von N von X` — alles von Position N bis zum Ende.
- `von N zu M von X` — die Teilzeichenkette über die Positionen N..M (M exklusiv).

Positionsindizes sind 0-basiert.

### Häufige Schneide-Fehler

**❌ Negatives N mit `links`/`rechts`**

AllSpeak unterstützt **keine** negativen Anzahlen. `links -2 von X` ist nicht gültig — es wird nicht als „alles außer den letzten 2 Zeichen" behandelt.

Um **alle außer den letzten N Zeichen** zu bekommen, verwende Längen-Arithmetik mit `von`:

```as
! „1998" in Pfund="19" und Pence="98" aufteilen
lege `1998` in MoneyStr
lege die länge von MoneyStr in MoneyLen  ! 4
lege MoneyLen in Pos
subtrahiere 2 von Pos                     ! Pos = 2
lege von 0 zu Pos von MoneyStr in Whole   ! "19"   (Positionen 0..1)
lege von Pos von MoneyStr in Cents        ! "98"   (Positionen 2..3)
```

Oder äquivalent mit `links` plus `rechts`:

```as
lege `1998` in MoneyStr
lege die länge von MoneyStr in MoneyLen  ! 4
subtrahiere 2 von MoneyLen                ! MoneyLen = 2
lege links MoneyLen von MoneyStr in Whole ! "19"
lege rechts 2 von MoneyStr in Cents       ! "98"
```

## Positionssuche

`position von X in Y` gibt den Index des ersten Vorkommens von X innerhalb von Y zurück, oder -1, wenn nicht gefunden:

```as
lege position von `,` in `Hallo, Welt!` in Comma
! Comma ist 5
```

Um das *letzte* Vorkommen zu finden, verwende `die position von der letzten`:

```as
lege die position von der letzten `,` in Text in P
```

Für das Parsen einfacher strukturierter Eingaben — `` `12.50` `` in Pfund und Pence aufteilen, den Trenner in einer „Schlüssel=Wert"-Zeile finden — geben `position von` plus die Schneide-Operatoren einen brauchbaren Parser. Siehe [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md) für ein ausgearbeitetes Beispiel.

## Umwandlung der Groß-/Kleinschreibung

```as
lege kleinbuchstaben `Hallo` in X        ! "hallo"
lege uppercase `Hallo` in Y              ! "HALLO"
```

Beide erzeugen eine neue Zeichenkette; das Original bleibt unverändert.

## Kürzen

`kürze X` entfernt führenden und abschließenden Leerraum:

```as
lege kürze `   geräumig   ` in Tidy
! Tidy ist "geräumig"
```

## Teilzeichenkette ersetzen

`ersetze X durch Y in Var` verändert `Var` direkt und ersetzt **jedes** Vorkommen von X durch Y:

```as
lege `rotes Auto, rotes Fahrrad, rote Schuhe` in List
ersetze `rot` durch `blau` in List
! List ist "blaues Auto, blaues Fahrrad, blaue Schuhe"
```

Zwei Dinge sind zu beachten:

- Es ist eine Anweisung, kein Wert — sie schreibt in die benannte Variable zurück.
- Sie ersetzt immer alle Vorkommen; es gibt keine Einzelersetzungs-Variante.

Um das Original zu erhalten, kopiere zuerst:

```as
lege OriginalText in Working
ersetze `foo` durch `bar` in Working
! OriginalText bleibt unberührt
```

## Einschluss-Test

`X enthält Y` testet, ob X Y als Teilzeichenkette enthält (in einer Bedingung verwendet):

```as
wenn Path enthält `/api/` ...
wenn Email enthält `@` ...
```

Siehe [Bedingungen](conditions.md) für den vollständigen Satz der zeichenkettenbezogenen Bedingungen (`ist`, `beginnt mit`, `endet mit`, `enthält`).

## Mehrzeilige Zeichenketten

Backtick-Literale können sich über Zeilen erstrecken. Jede Fortsetzungszeile beginnt nach ihrem führenden Leerraum mit einem Backtick; Zeilen werden ohne Zeilenumbrüche verbunden:

```as
setze Css zu `position:relative;
    `width:90%;
    `border:1px solid black;`
```

Um ein echtes Zeilenumbruch-, Tabulator- oder Backtick-Zeichen einzubetten, verwende die Wert-Schlüsselwörter mit `cat`:

```as
lege `Zeile 1` cat zeilenumbruch cat `Zeile 2` in Two
```

`zeilenumbruch`, `tabulator` und `backtick` sind drei aus einer kleinen geschlossenen Menge von nackten Wert-Schlüsselwörtern — `leer`, `jetzt`/`zeitstempel`, `heute`, `umbruch` und `uuid` sind die anderen. Siehe [Werte und Typen](values-and-types.md#special-value-keywords) für die vollständige Liste sowie [Symbole und Layout](symbols-and-layout.md) und [cat und Zeichenkettenaufbau](../idioms/cat-and-string-building.md) für `cat`-Muster.

## Zeichenketten und Zahlen

Eine Zeichenkette, die nur Ziffern enthält, wird als numerisch behandelt, wenn Arithmetik eine Zahl verlangt:

```as
lege `42` in N
addiere 1 zu N         ! N ist jetzt 43
```

Eine Zeichenkette mit dezimalartigem Inhalt (`3.14`) wird *nicht* automatisch befördert; AllSpeaks Arithmetik ist ganzzahl-zuerst. Siehe [Arithmetik](arithmetic.md) und [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md).

Um zu testen, ob ein Wert als Zahl verwendet werden kann, verwende die `ist numerisch`-Bedingung:

```as
wenn Input ist numerisch ...
```

## Siehe auch

- [Symbole und Layout](symbols-and-layout.md) — Backtick-Literale, mehrzeilige Zeichenketten.
- [cat und Zeichenkettenaufbau](../idioms/cat-and-string-building.md) — `cat`-Infix-Verkettung, Vorlagenmuster.
- [Bedingungen](conditions.md) — zeichenkettenbezogene Bedingungen.
- [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md) — dezimal aussehende Zeichenketten parsen.
- [Werte und Typen](values-and-types.md) — das numerisch/nicht-numerisch-Flag.
