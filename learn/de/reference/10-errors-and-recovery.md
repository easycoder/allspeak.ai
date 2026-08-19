# Fehler und Wiederherstellung

Einige Befehle in AllSpeak können zur Laufzeit fehlschlagen — `rest hole` erreicht seinen Endpunkt vielleicht nicht, `load` findet seine Datei nicht, `laufe` findet sein Modul nicht. Diese Befehle akzeptieren eine optionale Fehlerklausel, die läuft, wenn die Operation fehlschlägt.

Wenn ein Befehl fehlschlagen kann und du keine Klausel anhängst, endet der Thread mit einem Laufzeitfehler.

Es gibt zwei Fehlerklauseln — `oder` und `on failure` — mit derselben äußeren Syntax, aber unterschiedlichem Verhalten nach der Klausel. Die Wahl drückt aus, was als Nächstes passieren soll.

## `oder` — ausführen und stoppen

`oder <anweisung>` nach einem fehlschlagfähigen Befehl führt die Anweisung bei einem Fehlschlag aus und stoppt dann den Thread:

```as
rest hole Strings von `/strings.json` oder gehe zu StringsFailed
```

Wenn der Aufruf gelingt, geht die Ausführung mit der nächsten Anweisung weiter. Schlägt er fehl, läuft der `oder`-Rumpf und der Thread endet. Der Rumpf kann eine einzelne Anweisung oder ein `beginn … ende`-Block sein:

```as
rest hole Config von `/config.json`
    oder beginn
        drucke `Konfiguration konnte nicht geladen werden`
        gosub Cleanup
    ende
```

Verwende `oder` für nicht behebbare Fehlschläge — das Skript kann sinnvoll nicht weitermachen, also räumt die Klausel auf und stoppt.

## `on failure` — ausführen und weiterlaufen

`on failure <anweisung>` nach einem fehlschlagfähigen Befehl führt die Anweisung bei einem Fehlschlag aus und setzt die Ausführung dann bei der nächsten Anweisung fort:

```as
load Content von Filename
on failure setze Content zu leer
drucke Content
```

Wenn das Laden gelingt, zeigt `drucke` den geladenen Inhalt. Schlägt es fehl, setzt `on failure` einen Standardwert und `drucke` zeigt die leere Zeichenkette. In beiden Fällen läuft die Ausführung weiter.

Verwende `on failure`, wenn ein Fehlschlag voraussichtlich behebbar ist — das Skript setzt einen sinnvollen Standardwert ein und macht weiter.

## Seite an Seite

Dieselbe Wiederherstellungsanweisung verhält sich unter jeder Klausel anders:

```as
! Form mit `oder`
load Content von Filename oder setze Content zu leer
drucke Content                                ! wird bei Fehlschlag NICHT ausgeführt

! Form mit `on failure`
load Content von Filename
on failure setze Content zu leer
drucke Content                                ! wird bei Fehlschlag DOCH ausgeführt
```

Wähle die Form, die zu dem passt, was als Nächstes passieren soll — `oder` für „melden und aussteigen", `on failure` für „ersetzen und weiterlaufen".

## Den Fehler auslesen

In beiden Klauseln ist `der fehler` (oder die längere Form `der fehler nachricht`) ein Wert, der die Laufzeit-Fehlerzeichenkette enthält. Hinweis: die Tokenisierung unterscheidet Groß-/Kleinschreibung, daher werden deutsche Substantive im Code kleingeschrieben — `der Fehler` (mit großem F) wird nicht erkannt:

```as
rest hole Config von `/config.json` oder beginn
    drucke `Laden fehlgeschlagen: ` cat der fehler
    gosub Cleanup
ende
```

## Welche Befehle fehlschlagen können

Fehlschlagfähige Befehle sind I/O-artige Operationen; die englischen Formen in der Liste (`read`, `write`, `save`, `rest put`, `rest delete`, `mqtt publish`, `mqtt subscribe`) sind noch nicht übersetzt:

- `rest hole`, `rest poste`, `rest put`, `rest delete`
- `read` (Dateien)
- `write` (Dateien)
- `load` (Dateien / URLs)
- `save` (Dateien)
- `laufe` (Laden eines Moduls)
- `mqtt publish`, `mqtt subscribe`

Domänen und Plugins können eigene fehlschlagfähige Operationen hinzufügen — prüfe das jeweilige Sprachpaket. Reine Core-Operationen (`setze`, `addiere`, `multipliziere`, `wenn`, `solange`) haben keine Laufzeit-Fehlschläge; sie sind entweder gültig (gelingen) oder ungültig (Kompilierfehler).

## Anti-Muster: einen Fehlschlag ignorieren

```as
rest hole X von URL    ! ohne Klausel — der Thread endet bei Fehlschlag
```

Wenn der Befehl fehlschlagen kann und du nicht gesagt hast, was zu tun ist, endet der Thread. Für Prototypen ist das manchmal in Ordnung. Für Produktionscode hängst du eine Klausel an und entscheidest, was beabsichtigt ist.

## Anti-Muster: stille Wiederherstellung

```as
load Config von `/config.json` on failure setze Config zu `{}`    ! läuft stillschweigend weiter
```

Einen Standardwert zu setzen, ohne zu protokollieren, verbirgt echte Fehlschläge (Netzwerkausfälle, Serverfehler) hinter scheinbar funktionierendem Code. Wenn ein Standardwert akzeptabel ist, protokolliere die Ersetzung mindestens einmal, damit das Problem nicht unsichtbar bleibt.

## Siehe auch

- [Kontrollfluss](control-flow.md) — `stoppe`, `gehe zu`, die Ziele, die eine `oder`-Klausel üblicherweise nutzt.
- [Struktur](structure.md) — welche Domäne welchen fehlschlagfähigen Befehl besitzt.
- [REST und asynchron](../idioms/rest-and-async.md) — typische Muster für REST.
