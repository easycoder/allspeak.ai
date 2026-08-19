# Ereignishandler und Array-Index

## Problem

Du hast ein Array von UI-Elementen — sagen wir fünf Buttons — und willst einen einzigen Handler, der weiß, welcher geklickt wurde.

## Muster

Befestige einen einzigen Handler an der Variable. Er wird bei jedem Element ausgelöst und setzt dessen Index auf den des ausgelösten Elements. Lies innerhalb des Handlers `der index von` des Arrays, um herauszufinden, welches gefeuert hat.

```as
knopf Button
setze die elemente von Button zu 5
! ... die Buttons erstellen, ihnen Beschriftungen geben ...

setze N zu 0
solange N ist kleiner als 5
    ! Einrichten usw.
    addiere 1 zu N

bei klick Button gosub HandleClick

stoppe

HandleClick:
    setze Which zu der index von Button
    drucke `Button ` cat Which cat ` wurde geklickt`
    retourniere
```

Die Laufzeit setzt den Cursor auf `Button` *vor* dem Betreten des Handlers auf den Index des auslösenden Elements. `der index von Button` innerhalb von `HandleClick` ist der richtige Platz.

## Zuerst das Array dimensionieren

Bevor du `index` verwenden oder auf Klicks auf einem Array reagieren kannst, **musst** du es mit `setze die elemente von` dimensionieren:

```as
setze die elemente von Button zu 5    ! Plätze [0]..[4]
```

Jede Variable beginnt mit genau einem Element (Platz 0). Ohne Dimensionierung schlägt `indexiere Button zu N` für N > 0 fehl, und `bei klick`-Ereignisse sehen nur Platz 0.

Ein häufiges Muster ist, zuerst die Anzahl zu bestimmen (aus einem Datenabruf oder Layout) und dann das Array zu dimensionieren:

```as
rest hole Bookings von `bookings.php`
lege die json anzahl von Bookings in Count
setze die elemente von RowDivs zu Count
```

## Den Cursor vor `erstelle` setzen

Wenn du DOM-Elemente in ein Array baust, bewege den Cursor **vor** dem Aufruf von `erstelle` auf den Zielplatz:

```as
indexiere RowDivs zu I           ! ✅ Cursor zu Platz I
erstelle RowDivs in TableBody   ! das Element landet in Platz I
```

Wenn du zuerst erstellst und dann indexierst, liegt das Element in Platz 0, und die Cursor-Bewegung weist es nicht rückwirkend um.

## Was ein Handler ist

Ein Handler ist ein Thread, der bis zum Ende läuft, wenn sein Ereignis eintritt. Die `bei …`-Registrierung ist nur die Einrichtung; der Thread startet, wenn das Ereignis feuert, und endet, wenn die letzte Anweisung des Handlers erreicht ist. Niemand wartet auf seinen Rückgabewert, weil niemand ihn aufgerufen hat.

## Warum das funktioniert

`gosub HandleClick` ist eine beliebige Anweisung oder ein Block. Die `bei`-Laufzeit hat bereits die Quelle des Ereignisses bestimmt und den Index der Variable auf das auslösende Element gesetzt. Oft ist das 0, aber wie im Beispiel oben kann die Variable beliebig viele Elemente haben. Der Handler sieht nur das Element, das das Ereignis ausgelöst hat — dasselbe Cursor-Modell wie überall sonst (siehe [Variablen und Arrays](../reference/variables-and-arrays.md)).

Hinweis: Das funktioniert mit **jedem** Variablentyp, der das Cursor-Modell unterstützt, einschließlich `div X`, `knopf X`, `input X` usw. Das Deklarations-Präfix (`div`, `knopf`, `datei`) steuert, was `erstelle X` erzeugt, aber das zugrunde liegende Cursor-Modell ist dasselbe wie bei `variable X`.

## Anti-Muster: getrennte Variablen pro Element

```as
bei klick Button0 gosub HandleClick0
bei klick Button1 gosub HandleClick1
...
```

Das funktioniert, ist aber wortreicher: Der Handler muss jede Variable getrennt behandeln, obwohl sie konzeptionell dasselbe sind, nur wiederholt. Fünf fast identische Unterroutinen, die sich nur in einer Konstanten unterscheiden, sollten eine einzige Unterroutine sein, die `der index von` liest.

## Anti-Muster: die Schleifenvariable einfangen

```as
solange N ist kleiner als 5 beginn
    indexiere Button zu N
    ! Etwas tun
    addiere 1 zu N
ende
bei klick Button gosub HandleClick

HandleClick:
    drucke `Button ` cat N cat ` wurde geklickt`   ! FALSCH — N ist das, was die Schleife übrig gelassen hat
    retourniere
```

Es gibt kein Closure. `N` ist zur Handler-Zeit das, was der zuletzt ausgeführte Code hineingeschrieben hat — normalerweise 5, nicht der auslösende Index. Lies im Handler immer `der index von`.

## Mehrzeilige Handler

Drei Optionen, die den Handler-Thread jeweils auf seine natürliche Weise beenden:

**1. An eine markierte Unterroutine delegieren.** `gosub` aus der Registrierung heraus; `retourniere` am Ende der Unterroutine beendet den Thread (es gibt nichts, wohin zurückgekehrt würde).

```as
bei klick Button gosub HandleClick

HandleClick:
    setze Which zu der index von Button
    wenn Which ist 0 beginn
        ! Sonderfall für den ersten Button
        gosub HandleSpecial
        retourniere
    ende
    drucke `Allgemeiner Handler für ` cat Which
    retourniere
```

**2. Inline-Block.** Der Thread *ist* der `beginn…ende`-Block. Verwende `stoppe`, um vorzeitig zu beenden.

```as
bei klick Button beginn
    setze Which zu der index von Button
    wenn Which ist 0 beginn
        ! Sonderfall für den ersten Button
        gosub HandleSpecial
        stoppe
    ende
    drucke `Allgemeiner Handler für ` cat Which
ende
```

**3. Inline-Block mit Kontrollübertragung.** Verwende `gehe zu Label`, um den Thread zu anderem Code zu schicken (der selbst endet).

```as
bei klick Button beginn
    setze Which zu der index von Button
    wenn Which ist 0 gehe zu HandleSpecial
    drucke `Allgemeiner Handler für ` cat Which
ende
```

Hinweis: `beginn...ende` ist eine einzige Anweisung. Welche Form du verwendest, hängt von persönlichen Vorlieben ab — aber wenn der Handler sehr komplex ist, gehört er in einen markierten Abschnitt, wo er leichter dokumentiert werden kann.

## Siehe auch

- [Variablen und Arrays](../reference/variables-and-arrays.md) — das Cursor-Modell, auf dem dieses Idiom beruht.
- [Kontrollfluss](../reference/control-flow.md) — `gosub`, `retourniere`, `stoppe`, `gehe zu`.
- [Webson-und-AS-Trennung](webson-and-as-separation.md) — wie Button-Arrays normalerweise aus dem Layout entstehen.
