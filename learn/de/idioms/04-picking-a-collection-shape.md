# Eine Sammlungsform wählen

## Problem

Du musst mehrere Werte speichern, die zusammengehören. AllSpeak bietet vier Formen — Variablen-Arrays, Eigenschaften, Wörterbücher, Listen (siehe [Sammlungen](../reference/collections.md)). Die falsche Form früh zu wählen, verursacht Reibung im ganzen Skript: wortreiche Zugriffe, unhandliche Iteration, versehentliche Datenzersplitterung.

## Die Kriterien

Die Wahl bildet fast mechanisch das Zugriffsmuster ab:

| Wenn du auf Daten zugreifst … | Verwende |
|----------------------|-----|
| Nach Position, wobei mehrere Variablen im Gleichschritt laufen | Variablen-Array |
| Nach Position, als eine einzige typisierte Sequenz | Liste |
| Nach Zeichenketten-Schlüssel | Wörterbuch |
| Als Metadaten an einem Objekt | Eigenschaft |

Die schwierigste Abgrenzung liegt zwischen Variablen-Array und Liste, weil sie ähnlich aussehen. Entscheidungsregel: **wenn du auf zwei oder mehr Variablen mit demselben Index `N` zugreifst, wollen diese Variablen parallele Variablen-Arrays sein**. Wenn eine einzelne Sequenz reicht, ist eine Liste einfacher.

## Variablen-Array — für parallele Datensätze

Fünf klickbare Elemente, jedes mit Beschriftung, Ziel-URL und einem „besucht"-Flag:

```as
knopf Item
variable Caption
variable Target
variable Visited

setze die elemente von Item zu 5
setze die elemente von Caption zu 5
setze die elemente von Target zu 5
setze die elemente von Visited zu 5

! ... jedes parallele Array füllen ...

bei klick Item gosub HandleClick

HandleClick:
    indexiere Caption zu der index von Item
    indexiere Target zu der index von Item
    indexiere Visited zu der index von Item
    ! Alle drei zeigen jetzt auf den passenden Platz
    retourniere
```

Ein auslösender Cursor, drei koordinierte Lesevorgänge. Das ist das AllSpeak-Idiom für Datensatz-nach-Position-Zugriff.

## Wörterbuch — für schlüsselbasierte Konfiguration

Ein Konfigurationsblock mit benannten Feldern:

```as
variable Config
setze Config zu objekt
setze eigenschaft `theme` von Config zu `dunkel`
setze eigenschaft `pageSize` von Config zu 50
setze eigenschaft `apiKey` von Config zu der inhalt von KeyField

wenn eigenschaft `theme` von Config ist `dunkel` beginn
    ! dunkles Styling anwenden
ende
```

Verwende ein Wörterbuch, wenn die Schlüssel wohlbekannte Zeichenketten-Namen sind und der Zugriff per Name erfolgt, nicht per Position.

## Liste — für eine geordnete Sequenz ohne Parallelstruktur

Ein Log-Puffer:

```as
variable Log
setze Log zu feld
setze element 0 von Log zu `Benutzer angemeldet`
setze element 1 von Log zu `Warenkorb befüllt`
setze element 2 von Log zu `Bestellung aufgegeben`
```

Die Elemente sind einheitlich und unabhängig von jeder anderen Variable. Keine Cursor-Koordination nötig. Greife eher zur Liste als zu einem Variablen-Array.

## Anti-Muster: Liste von Wörterbüchern, wenn parallele Arrays passen

```as
! Vermeide das, wenn Datensätze per Index abgerufen werden
variable Items
setze Items zu feld
variable Item
setze Item zu objekt
setze eigenschaft `caption` von Item zu `Kaufen`
setze eigenschaft `target` von Item zu `/buy`
setze element 0 von Items zu Item
! ... für jedes Element wiederholen ...
```

Das funktioniert, ist aber wortreich. Wenn dein Zugriffsmuster konsequent „gib mir Datensatz N" ist, sind parallele Variablen-Arrays kürzer und integrieren sich natürlicher in `bei klick`-Handler (keine Pro-Datensatz-Eigenschafts-Extraktion im Handler).

Greife zur Liste-von-Dicts, wenn die Datensätze konzeptionell Dokumente sind — heterogen, spärlich abgerufen oder als JSON übertragen. Greife zu parallelen Variablen-Arrays, wenn Datensätze im Gleichschritt mit der UI oder anderem Zustand abgerufen werden.

## Anti-Muster: ein separates Wörterbuch, wenn eine Eigenschaft reicht

Wenn du ein oder zwei benannte Fakten an ein bestehendes Objekt hängen musst (Button, div, Datei), verwende `setze eigenschaft … von Obj zu …` direkt am Objekt, statt ein paralleles Wörterbuch zu deklarieren, das nach einer Art Objekt-ID schlüsselt. Die Information bleibt an dem hängen, was sie beschreibt.

## Siehe auch

- [Sammlungen](../reference/collections.md) — die vier Formen im Detail.
- [Variablen und Arrays](../reference/variables-and-arrays.md) — das Cursor-Modell.
- [Ereignishandler und Array-Index](02-event-handlers-and-array-index.md) — warum sich parallele Arrays + Cursor in Handlern auszahlen.
