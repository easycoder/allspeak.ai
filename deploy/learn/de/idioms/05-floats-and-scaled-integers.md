# Gleitkommazahlen und skalierte Ganzzahlen

## Problem

Du hast eine Größe mit Nachkommagenauigkeit — Geld, einen Prozentsatz, einen Winkel, eine Messung. Die Arithmetik von AllSpeak ist rein ganzzahlig. Wie rechnest du mit dem Wert, ohne Genauigkeit zu verlieren?

## Die Gleitkomma-als-Zeichenkette-Realität

Numerische Literale im Quellcode sind Ganzzahlen; `3.14` ist eine Zeichenkette mit vier Zeichen, keine Zahl. Variablen, die von außen geholte Werte halten (eine REST-Antwort, ein Webson-Formularfeld), können ebenfalls als gleitkommaartige Zeichenketten ankommen. Sie laufen unverändert durch `cat`, nehmen aber nicht an Arithmetik teil — `addiere 0.5 zu Counter` ist ein Fehler.

Die Lösung ist das **skalierte-Ganzzahl-Muster**: halte alle Werte als Ganzzahlen, multipliziert mit einem gewählten Skalierungsfaktor, und dividiere erst beim Anzeigen heraus.

## Einen Skalierungsfaktor wählen

Wähle einen Skalierungsfaktor für die Genauigkeit, die du brauchst:

| Bereich | Üblicher Faktor | Bedeutung |
|--------|--------------|---------|
| Geld (£/$/€) | 100 | Kleinste Einheit (Pence, Cents). £12.34 → 1234. |
| Prozentsätze | 100 oder 10000 | 1 %- oder 0,01 %-Genauigkeit. 12,5 % → 125 oder 12500. |
| Koordinaten | 1000 | Millipixel. 100,5 → 100500. |
| Winkel | 100 oder 10 | 0,01° oder 0,1°. 45,5° → 4550 oder 455. |

Der Kompromiss: ein höherer Faktor gibt mehr Genauigkeit, aber der maximal darstellbare Wert schrumpft.

## Ausgearbeitetes Beispiel: Geld

Eine Warenkorb-Summe:

```as
variable PriceA
variable PriceB
variable Total

lege 1250 in PriceA    ! £12.50 als Pence gespeichert
lege 875 in PriceB    ! £8.75 als Pence gespeichert
addiere PriceA zu PriceB ergibt Total
! Total ist 2125 — also £21.25
```

Zum Anzeigen teile Pfund und Pence auf und polstere die Pence auf zwei Ziffern:

```as
dividiere Total durch 100 ergibt Pounds
lege Total modulo 100 in Pence

wenn Pence ist kleiner als 10
    lege `0` cat Pence in PenceStr
sonst
    lege Pence in PenceStr

drucke Pounds cat `.` cat PenceStr     ! "21.25"
```

## Ausgearbeitetes Beispiel: Prozentsätze

90 % einer Breite, mit 1 %-Genauigkeit:

```as
multipliziere Width mit 90      ! Width × 90
dividiere Width durch 100       ! ÷ 100
```

Das ist das kanonische AllSpeak-Idiom für die Anwendung von Prozentsätzen. Erst multiplizieren, dann dividieren — die Reihenfolge ist wichtig: dividieren-dann-multiplizieren schneidet die Genauigkeit weg, die du behalten wolltest.

Für Genauigkeit unter einem Prozent skaliere weiter:

```as
multipliziere Width mit 9050    ! 90,50 % skaliert mit 100
dividiere Width durch 10000
```

## Trigonometrie

`sin` und `cos` sind eingebaute skalierte-Ganzzahl-Operatoren — sie nehmen einen Winkel in Grad und einen `radius`-Faktor, der das Ergebnis skaliert. Siehe [Arithmetik](../reference/arithmetic.md). Der Radius ist nur ein Skalierungsfaktor unter anderem Namen.

## Gleitkommazahlen von außen empfangen

Zeichenketten, die als `` `12.50` `` von einem REST-Endpunkt oder einer Formulareingabe ankommen, müssen vor der Arithmetik in skalierte Ganzzahlen umgewandelt werden. Der Wert-Operator `skala` macht genau das — er liest eine Dezimalzeichenkette und liefert die skalierte Ganzzahl, wobei er bei mehr Ziffern, als der Faktor benötigt, halb von der Null weg rundet:

```as
! Angenommen, Input ist `12.50`
lege Input skala 100 in Pence
! Pence ist jetzt 1250
```

```as
lege `3.14` skala 100 in Pi        ! 314
lege `-3.14` skala 100 in Pi       ! -314
lege `42` skala 100 in Pence       ! 4200 — Ganzzahl-Zeichenketten funktionieren auch
lege `12.345` skala 100 in Pence   ! 1235 — zusätzliche Ziffern runden, halb von der Null weg
lege `.5` skala 100 in Half        ! 50
lege `3.` skala 100 in Three       ! 300
```

Der Skalierungsfaktor muss eine positive Ganzzahl sein, und die Zeichenkette muss eine saubere Dezimalzahl sein — alles andere (`` `abc` ``, `` `3.1.4` ``, skala 0) löst einen Laufzeitfehler aus, sodass schlechte Eingabe von außen laut auffällt. Die Umwandlung läuft mit Ganzzahl-Arithmetik, daher ist `12.345 skala 100` exakt 1235 — niemals 1234 durch Gleitkomma-Rauschen.

Bevor es `skala` gab, war das ein sechszeiliges Aufteilen-an-der-Punkt-Tänzchen; sieh in der Git-Historie nach, wenn dich interessiert, wie es aussah.

## Anti-Muster: Arithmetik auf der Zeichenkettenform

```as
addiere `0.5` zu Counter      ! FALSCH — `0.5` ist eine Zeichenkette
```

Arithmetische Operatoren erwarten numerische Werte. Um die Arbeit zu erledigen, müssen beide Seiten bereits skalierte Ganzzahlen sein:

```as
addiere 5 zu Counter          ! wenn Counter mit 10 skaliert ist (d. h. 0,5 → 5)
```

## Anti-Muster: dividieren vor multiplizieren

```as
dividiere Total durch 100       ! Ganzzahl-Division verliert Pence
multipliziere Total mit 90      ! falsch skaliert
```

Ganzzahl-Division schneidet ab. Erst multiplizieren, dann dividieren:

```as
multipliziere Total mit 90
dividiere Total durch 100
```

## Siehe auch

- [Arithmetik](../reference/arithmetic.md) — das Ganzzahl-zuerst-Modell und der Operator-Wortschatz.
- [Werte und Typen](../reference/values-and-types.md) — Zeichenketten vs. Zahlen.
- [Zeichenketten und Text](../reference/strings-and-text.md) — `links`, `von`, `position von` zum Parsen.
