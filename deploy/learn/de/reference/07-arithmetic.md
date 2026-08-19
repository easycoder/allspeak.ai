# Arithmetik

AllSpeaks Arithmetik ist **ganzzahl-zuerst**. Es gibt keine Gleitkomma-Literale auf Sprachebene; alle Arithmetik operiert auf Ganzzahlen. Zahlen, die wie Floats aussehen (`3.14`), sind Zeichenketten, keine numerischen Werte. Wenn fraktionale Präzision gebraucht wird, verwende das Muster der skalierten Ganzzahlen (unten).

## Operatoren

Alle Arithmetik ist schlüsselwortgetrieben — es gibt keine Infix-Operatoren wie `+`, `-`, `*`, `/`.

Binär (Anweisungsebene):

```
addiere A zu B
addiere A zu B ergibt C
subtrahiere A von B
subtrahiere A von B ergibt C
multipliziere A mit B
multipliziere A mit B ergibt C
dividiere A durch B
dividiere A durch B ergibt C
```

`modulo` ist ein anderes Tier: ein **Wert-Ebenen**-Binäroperator statt einer Anweisung — siehe [den Rest-Abschnitt](#remainder) unten.

Unär:

```
negiere X
negiere X ergibt Y
```

`ergibt` schreibt das Ergebnis in eine neue Variable, ohne die Quelle zu verändern.

## Beispiele

```as
addiere 1 zu Counter         ! Counter ist jetzt Counter + 1
subtrahiere 5 von Total      ! Total ist jetzt Total - 5
multipliziere Width mit 2    ! Width ist jetzt Width × 2
dividiere Total durch 100    ! Total ist jetzt Total ÷ 100 (Ganzzahl-Division)
addiere 1 zu Counter ergibt NewCounter   ! Counter unverändert, NewCounter = Counter + 1
negiere Height               ! Height ist jetzt -Height
negiere Balance ergibt Opposite          ! Balance unverändert, Opposite = -Balance
```

## Was als numerischer Wert zählt

Arithmetik funktioniert nur mit **echten numerischen Werten**. Ein Wert, der von einer **Zeichenketten-Operation** erzeugt wurde (`links N von`, `rechts N von`, `von N von`, `cat`, `der inhalt von`), ist eine Zeichenkette — selbst wenn die Zeichenkette nur Ziffern enthält. Arithmetik mit einem solchen Wert kann abgelehnt werden oder unerwartete Ergebnisse liefern.

Um eine numerisch aussehende Zeichenkette in eine echte Zahl zu konvertieren, verwende `der wert von`:

```as
lege links 4 von BookingDate in FY          ! FY = "2025" (Zeichenkette)
addiere 1 zu FY                             ! kann fehlschlagen — FY ist eine Zeichenkette
lege der wert von FY in NextYr              ! NextYr = 2025 (Zahl)
addiere 1 zu NextYr                         ! NextYr = 2026 (Zahl) ✓
```

`der wert von` wird in [Werte und Typen](values-and-types.md) dokumentiert.

## Skalierte Ganzzahlen

Für Geld, Prozentsätze, Maße und andere Größen, die konzeptionell fraktionale Präzision haben, speichere den Wert als Ganzzahl multipliziert mit einem Skalierungsfaktor und dividiere nur beim Anzeigen heraus.

```as
! £12.50 als 1250 Pence speichern
lege 1250 in Price

! Als „£12.50" anzeigen
dividiere Price durch 100 ergibt Pounds
lege Price modulo 100 in Pence
```

Das Muster der skalierten Ganzzahlen wird ausführlich in [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md) behandelt.

## Divisions-Kleinkram

Ganzzahl-Division kürzt in Richtung Null:

```as
dividiere 10 durch 3         ! 3
dividiere -10 durch 3        ! -3
```

Für den Rest verwende `modulo` — ein echter Binäroperator, der überall verwendbar ist, wo ein Wert erwartet wird (keine Anweisung wie `addiere`/`dividiere`):

```as
lege 10 modulo 3 in R    ! R = 1
lege 17 modulo 5 in N    ! der linke Operand darf jeder Wert sein
wenn Score modulo 2 ist 0 ...    ! funktioniert auch in Bedingungen
lege I modulo Max in I   ! klassischer zyklischer Umlauf: 0..Max-1, dann zurück zu 0
```

Der linke Operand darf eine Konstante, eine Variable oder jeder Wertausdruck sein; beide Operanden werden ausgewertet, und das Ergebnis ist der ganzzahlige Rest. `modulo` ist ein praktisches Umlauf-Werkzeug, um einen Index durch einen festen Bereich zu zyklieren.

## `skala` — Float-Zeichenketten zu skalierten Ganzzahlen

`<Dezimal-Zeichenkette> skala <positive Ganzzahl>` konvertiert eine Zeichenketten-Darstellung einer Zahl in eine skalierte Ganzzahl, wobei **halb weg von Null** gerundet wird, wenn die Zeichenkette mehr Nachkommastellen trägt, als die Skala braucht:

```as
lege `3.14` skala 100 in Pi        ! 314
lege `12.345` skala 100 in Pence   ! 1235 — 12.345 rundet zu 1234.5 → 1235
lege `-3.14` skala 100 in Pi       ! -314
lege `42` skala 100 in Pence       ! 4200 — Ganzzahl-Zeichenketten funktionieren auch
lege `.5` skala 100 in Half        ! 50
```

Der linke Operand muss eine saubere Dezimal-Zeichenkette sein (`3`, `3.14`, `.5`, `-3.14`); alles andere (`` `abc` ``, `` `3.1.4` ``) ist ein **Laufzeitfehler**, ebenso wie eine Skala, die keine positive Ganzzahl ist. Die Konvertierung verwendet Ganzzahl-Arithmetik, sodass Ergebnisse exakt sind — `12.345 skala 100` ist trotz Gleitkomma-Rauschens nie 1234. Die kanonische Verwendung ist das Parsen eingehender REST/Formular-Werte in das Muster der skalierten Ganzzahlen — siehe [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md).

## Zeitkomponenten

`das jahr von X`, `der monat von X`, `der tag von X`, `die tagesnummer von X`, `die stunde von X`, `die minute von X`, `die sekunde von X` extrahieren Komponenten aus einem Unix-Zeitstempel (Sekunden seit der Epoche). Sie geben immer eine Zahl zurück:

| Zugriff | Gibt zurück | Bereich |
|---|---|---|
| `das jahr von` | Volles Jahr | z. B. 2026 |
| `der monat von` | Monatsnummer, 0-basiert | 0–11 |
| `der tag von` | Tag der Woche | 0–6 (0=Sonntag) |
| `die tagesnummer von` | Tag des Monats | 1–31 |
| `die stunde von` | Stunde des Tages | 0–23 |
| `die minute von` | Minute innerhalb der Stunde | 0–59 |
| `die sekunde von` | Sekunde innerhalb der Minute | 0–59 |

```as
lege der zeitstempel in Now
lege das jahr von Now in YYYY               ! z. B. 2026
lege der monat von Now in MM                ! 0=Jan, 5=Jun (0-basiert)
addiere 1 zu MM                             ! zu 1-basiert konvertieren
lege die tagesnummer von Now in DD          ! Tag des Monats, 1-31
```

Alternativ parst du einen ISO-Datumsstring mit `datum X`:

```as
lege datum `2026-05-15` in Stamp
lege der monat von Stamp in MM              ! 5
```

## Siehe auch

- [Werte und Typen](values-and-types.md) — was als Zahl zählt; das numerisch/nicht-numerisch-Flag; `der wert von`.
- [Gleitkommazahlen und skalierte Ganzzahlen](../idioms/floats-and-scaled-integers.md) — das Muster der skalierten Ganzzahlen für fraktionale Werte.
- [Bedingungen](conditions.md) — `ist gerade`, `ist ungerade`, `ist numerisch`.
- [Symbole und Layout](symbols-and-layout.md) — `-` als Zahlen-Präfix.
