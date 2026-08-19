# Werte und Typen

Ein Wert in AllSpeak ist eine von drei Arten: **Zahl**, **Zeichenkette** oder **Boolean**. Werte sind das, worauf Arithmetik operiert, was Bedingungen vergleichen und was `cat` konkateniert. Variablen halten Werte; Konvertierungen zwischen Wertarten sind weitgehend automatisch.

## Die drei Wertarten

**Zahl** — Ganzzahlwerte. Literale sind nackte Ziffernfolgen (`42`, `-3`). Alle Arithmetik erzeugt Ganzzahl-Ergebnisse. Siehe [Arithmetik](arithmetic.md).

**Zeichenkette** — Text. Literale werden durch Backticks begrenzt (`` `Hallo` ``). Siehe [Zeichenketten und Text](strings-and-text.md) für die Operationen.

**Boolean** — wahr oder falsch. Die Schlüsselwörter `wahr` und `falsch` erzeugen Boolean-Werte (`solange wahr …`, `setze Ready zu wahr`). Die Kurzform `setze X` macht X wahr; `leere X` macht es falsch. Booleans erscheinen in Bedingungen und als Wahrheitstests. Siehe [Bedingungen](conditions.md).

Die Laufzeit verfolgt ein `numerisch`-Flag auf jedem Wert. Eine Zeichenkette, die nur Ziffern enthält, hat das Flag gesetzt und nimmt an der Arithmetik teil; eine Zeichenkette mit nicht-numerischem Inhalt nicht.

## Der Typ `variable`

`variable X` deklariert einen schwach typisierten Behälter. Er kann jede der drei Wertarten halten, und die Art, die er hält, ist die, die zuletzt hineingelegt wurde:

```as
variable X
lege 42 in X         ! X ist jetzt eine Zahl
lege `Hallo` in X    ! X ist jetzt eine Zeichenkette
setze X              ! X ist jetzt wahr (Boolean)
```

`variable` ist die einzige schwach typisierte Form in AllSpeak. Verwende sie für allgemeinen Zustand, bei dem die Art nicht im Voraus bekannt ist oder sich im Laufe der Zeit ändert.

## Typisierte Variablen

Andere Variablentypen sind strenger — sie akzeptieren nur die Werte, die ihre Domäne kennt:

```as
knopf SaveButton           ! hält einen DOM-Element-Handle
datei ConfigFile           ! hält einen Dateiverweis
dictionary Spec            ! hält eine Schlüssel/Wert-Struktur (Python)
modul Helper               ! hält ein geladenes Modul
```

`lege 42 in SaveButton` ist ein Fehler — SaveButton ist kein Wertbehälter, sondern ein Handle auf ein typisiertes Objekt. Die Operationen, die eine typisierte Variable akzeptiert, werden von ihrer Besitzer-Domäne definiert. Siehe [Struktur](structure.md) und [Sammlungen](collections.md).

## Automatische Konvertierung

Werte konvertieren je nach Kontext zwischen den Arten:

| Kontext | Konvertierung |
|---------|------------|
| Arithmetik-Eingabe | Numerische Zeichenkette → Zahl; nicht-numerische Zeichenkette ist ein Fehler |
| `cat`-Operand | Zahl → Zeichenkette; Boolean → „wahr"/„falsch" |
| `wenn X` (Wahrheitstest) | Zahl → falsch, wenn 0, sonst wahr; Zeichenkette → falsch, wenn leer, sonst wahr |
| `ist`-Vergleich | Operanden werden als Text verglichen, mit numerischem Bewusstsein auf beiden Seiten |

```as
lege `42` in N
addiere 1 zu N            ! N ist jetzt 43 (Zeichenkette „42" wird zu Zahl befördert)

lege 5 in Count
lege `Du hast ` cat Count cat ` Artikel` in Message
                          ! Count wird für cat zu „5" konvertiert
```

Die Konvertierung ist pro Operation einseitig — der gespeicherte Wert der Variable wird nicht dauerhaft transformiert. Nach `addiere 1 zu N` hält N 43 als Zahl; nach `cat Count` ist Count immer noch 5 als Zahl.

Innerhalb einer `cat`-Kette behalten einzelne Operanden ihre Typ-Identität durchgehend; die Konvertierung zu Text passiert einmal, wenn die Kette zu einer einzigen Zeichenkette zusammengezogen wird. Das ist am wichtigsten für Werte, die zur Laufzeit erzeugt werden — `der zeitstempel`, `der inhalt von Input`, `der index von X` — die zu einem typisierten Wert ausgewertet werden und erst an der Grenze zu Text werden, nicht bei jedem `cat`-Schritt.

## Spezielle Wert-Schlüsselwörter

Eine kleine geschlossene Menge nackter Schlüsselwörter wertet zu einem Wert seiner eigenen Art aus — ohne Operand, ohne führende Variable. Verwende sie überall, wo ein Wert erwartet wird: als rechte Seite von `lege`/`setze`, innerhalb einer `cat`-Kette, in einer Bedingung. Der optionale Füllartikel `der` wird vor jedem davon akzeptiert (`der zeitstempel`, `der heute`).

| Schlüsselwort | Art | Wert |
|---|---|---|
| `leer` | Zeichenkette | Die leere Zeichenkette. Äquivalent zu ``, liest sich aber in Bedingungen natürlicher: `wenn Name ist leer …`. |
| `jetzt`, `zeitstempel` | Zahl | Aktuelle Unix-Zeit in Millisekunden. Die beiden sind Aliasse. |
| `zeit` | Zahl | Millisekunden seit Mitternacht heute (Ortszeit). |
| `heute` | Zahl | Unix-Zeitstempel von Mitternacht heute, in Millisekunden. |
| `zeilenumbruch` | Zeichenkette | Ein einzelnes `\n`-Zeichen. |
| `tabulator` | Zeichenkette | Ein einzelnes `\t`-Zeichen. |
| `backtick` | Zeichenkette | Ein einzelnes `` ` ``-Zeichen. |
| `umbruch` | Zeichenkette | Das HTML-Fragment `<br />`. Zum Erzeugen von Text für ein DOM-Element. |
| `uuid` | Zeichenkette | Eine frisch erzeugte UUID. Jede Auswertung liefert eine neue. |

`datum X` ist ein verwandtes Konstrukt, nimmt aber einen Operanden — es parst einen ISO-Datumsstring in einen Unix-Zeitstempel. Siehe [Arithmetik](arithmetic.md) für die Zeitkomponenten-Zugriffe (`das jahr von …`, `der monat von …` usw.).

Die zeichenkettenartigen Schlüsselwörter existieren, weil Backtick-Literale keine Escape-Syntax haben. Um einen Zeilenumbruch, Tabulator oder ein literales Backtick in eine Zeichenkette zu bringen, verknüpfe das Schlüsselwort per `cat`:

```as
lege `Drücke die ` cat backtick cat `~` cat backtick cat ` Taste.` in Message
lege `Zeile 1` cat zeilenumbruch cat `Zeile 2` in TwoLines
```

Das sind die einzigen Wege, diese Zeichen in ein String-Literal zu bekommen.

## Wenn automatische Konvertierung nicht reicht

### `der wert von` — explizite Zeichenkette-zu-Zahl-Konvertierung

`der wert von X` konvertiert eine Zeichenkette in ihren numerischen Wert. Verwende das, wenn eine Zeichenkette wie eine Zahl aussieht, sich aber in einer Bedingung nicht automatisch konvertiert:

```as
lege `04` in Mm
wenn der wert von Mm ist nicht kleiner als 4 ...   ! numerischer Vergleich, wahr
wenn Mm ist nicht kleiner als `04` ...             ! Zeichenketten-Vergleich — bricht bei „10" < „04"
```

Ohne `der wert von` vergleicht der `ist`-Operator Werte als Text. `"04"` und `"10"` als Zeichenketten verglichen behandelt `"0"` < `"1"` und liefert die falsche Antwort. `der wert von` stellt einen korrekten numerischen Vergleich sicher.

`der wert von` funktioniert auch mit verketteten Zeichenketten-Operationen:

```as
wenn der wert von links 2 von von 5 von BookingDate ist nicht kleiner als 4 ...
```

Das liest sich von links nach rechts: nimm `BookingDate`, hole `von Position 5`, nimm `links 2`, konvertiere dann zu einem Wert. Die Verkettung funktioniert, weil AllSpeak von links nach rechts auswertet — natürlich fürs Englische, ungewöhnlich für die meisten Programmiersprachen.

### Dezimal-Zeichenketten

Für dezimal aussehende Zeichenketten (`3.14`) ist die Konvertierung nicht automatisch — Arithmetik ist ganzzahl-zuerst, und `3.14` bleibt eine Zeichenkette. Siehe [Arithmetik](arithmetic.md) und [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md).

### Typ-Inspektion

Für die Inspektion sind die Typ-Tests Bedingungen:

```as
wenn X ist numerisch ...
wenn X ist ein feld ...       ! JSON-förmig
wenn X ist ein objekt ...     ! JSON-förmig
wenn X ist gerade ...
wenn X ist ungerade ...
```

Siehe [Bedingungen](conditions.md).

## JS vs Python

Das Wertemodell ist über die Laufzeiten geteilt. Die Implementierungen unterscheiden sich darunter — JS vereinheitlicht die Speicherung über die Zeichenketten-Darstellung; Python verwendet native `int`, `str`, `bool` und konvertiert an den Operationsgrenzen — aber das Skriptverhalten ist in beiden gleich. Der Unterschied ist nur beim Lesen des Engine-Codes oder beim Schreiben eines Plugins von Bedeutung.

## Warum genau drei Arten

AllSpeak vermeidet bewusst die reicheren Typ-Hierarchien gängiger Sprachen. Die drei Arten decken alles ab, was du für UI-Logik, Datenverarbeitung und Kontrollfluss brauchst; reichere Strukturen (JSON-Formen, DOM-Elemente, Module) werden von typisierten Variablen behandelt, die die jeweilige Domäne bereitstellt. Die Wert-Ebene einfach zu halten macht die Engine klein, die Sprache einheitlich lesbar und die mehrsprachige Abbildung unkompliziert — jede Art hat einen einwortigen Namen, der leicht zu übersetzen ist.

## Siehe auch

- [Variablen und Arrays](variables-and-arrays.md) — Variablen als Ein-Element-Arrays; das Cursor-Modell.
- [Arithmetik](arithmetic.md) — ganzzahl-zuerst numerische Operationen.
- [Zeichenketten und Text](strings-and-text.md) — Zeichenketten-Operationen.
- [Bedingungen](conditions.md) — Gleichheit, Vergleich, Typ-Tests.
- [Sammlungen](collections.md) — JSON-förmige Werttypen (feld, objekt).
