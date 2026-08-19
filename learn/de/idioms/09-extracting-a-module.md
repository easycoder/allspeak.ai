# Ein Modul extrahieren

## Problem

Dein Skript ist über ein paar tausend Zeilen gewachsen. Navigation, Review und Neuladen sind mühsam geworden. Ein bestimmter Abschnitt taucht in Reviews immer wieder auf, weil er neben dem Rest schwer zu verfolgen ist. Zeit, ihn als Modul zu extrahieren.

## Wann du extrahieren solltest

Anlässe, über eine Extraktion nachzudenken:

- Skript über ~2500 Zeilen und weiter wachsend.
- Ein bestimmter funktionaler Bereich taucht in Reviews immer wieder auf, weil er neben dem Rest schwer zu verfolgen ist.
- Eine in sich geschlossene Transformation, die sich über Skripte hinweg wiederverwenden ließe.

Ein Block ist ein guter Kandidat, wenn:

1. **Ein Zweck.** Ein einziger Satz beschreibt, was er tut. Wenn die Beschreibung zweimal „und außerdem" braucht, ist es kein Modul — es sind mehrere.
2. **Die richtige Größe: 200–500 Zeilen.** Darunter dominiert der Grenz-Overhead den Gewinn. Darüber wird das neue Modul selbst schwer zu navigieren.
3. **Überwiegend eigene Variablen.** Eine Handvoll Ein- und Ausgaben; der Rest ist intern. Wenn die Verwendung „von außen" überall verstreut ist, ist der Block nicht wirklich trennbar.
4. **Minimale DOM-/MQTT-/globale Kopplung.** Reine Transformationen (Daten rein, Daten raus) sind am saubersten. DOM-lastige Bereiche sind am schlimmsten — jeder Paint wird zu einer Nachrichten-Round-Trip, es sei denn, das Modul besitzt auch das DOM.

## Wann du *nicht* extrahieren solltest

Extrahiere nicht:

- **Eng an das DOM gekoppelte Pfade**, es sei denn, das Modul besitzt auch das DOM. Ein Modul, das den Parent bei jedem Klick per Nachricht bittet, „Button X rot zu färben", wird langsamer und schwerer zu debuggen sein als die Inline-Version.
- **Blöcke kleiner als ~150 Zeilen.** Der Schnittstellen-Overhead frisst den Gewinn.
- **Mechanismen, die pro Benutzeraktion oft feuern.** Ein Klick, der 10 kleine UI-Updates auslöst, erzeugt 10 Round-Trips.
- **Zustand, der in beide Richtungen geteilt wird.** Extraktion funktioniert, wenn der Datenfluss pro Aufruf überwiegend eine Richtung hat (Parent → Modul → Antwort → Parent). Wenn beide Seiten denselben Wert weiter verändern, bricht die Snapshot-Semantik zusammen.

## Die Form der Extraktion

Module kommunizieren per Nachrichtenübermittlung. Ein Parent lädt das Modul und sendet ihm Wörterbücher:

```as
! Elternskript
laufe `mod.as` als ModName
...
sende Input zu ModName und zuweise antwort zu Output
```

Das Modul deklariert einen Nachrichten-Handler, gibt den Parent frei und wartet:

```as
! Modul
script Mod
... Variablendeklarationen ...

bei nachricht gehe zu Handler
release parent
stoppe

Handler:
    lege die nachricht in Input
    ! ... verarbeiten ...
    sende Output zu absender
    stoppe
```

`release parent` bewirkt, dass `laufe` beim Parent sofort zurückkehrt. Ohne die Anweisung blockiert der Parent beim `laufe` und wartet darauf, dass das Kind fertig wird — in Ordnung, wenn das Modul einmalig läuft, nutzlos für einen dauerhaften Helfer.

Siehe [Module](../reference/modules.md) für den vollständigen Mechanismus.

## Das nebenläufige Muster

Dieselbe Mechanik — `release parent`, `bei nachricht`, `stoppe` — aber das Modul besitzt langlebigen Zustand und kann sein eigenes DOM, abgezweigte Aufgaben oder periodische Schleifen antreiben. Verwende es, wenn das Modul einen Tabellen-Editor, einen Unterbildschirm oder eine eigene Ereignisschleife besitzt. Die Grenze ist dieselbe; was sich ändert, ist die interne Struktur des Moduls.

## Schnittstellendesign

Ein paar Leitlinien, die sich auszahlen:

- **Ein Dict pro Richtung.** Mehrwertige Ein- und Ausgaben reisen als ein einziges Wörterbuch, nicht als mehrere getrennte Variablen an der Grenze.
- **Keine Live-Referenzen über die Grenze.** Sobald ein Wert die Grenze überquert, darf der Empfänger ihn frei verändern; der Sender behält seine eigene Kopie. Geh nicht davon aus, dass der Parent beim nächsten Round-Trip noch dieselben Daten hat.
- **Der Parent behält den Besitz von Netzwerk/MQTT.** Module schicken Ergebnisse an den Parent zurück; der Parent macht den eigentlichen Serveraufruf. Sonst würde jedes Modul Verbindungszustand und Zugangsdaten duplizieren.
- **Kleine Nutzdaten.** Ganze Datensätze sind in Ordnung. Ganze Layout-Bäume pro Klick nicht.

## Ausgearbeitete Beispiele

Zwei Muster, ausführlich dokumentiert in der Fähigkeit `as-modularize`:

- **controller ↔ deviceControl** (Python-Dialekt) — die kanonische Extraktion im Unterroutinen-Stil.
- **shell ↔ map-to-rooms** (JS-Dialekt) — eine reine Transformations-Extraktion ohne DOM, zweistufiges Laden mit `rest hole` + `laufe`.

## Siehe auch

- [Module](../reference/modules.md) — die Mechanik: `laufe`, `release parent`, `sende`, `bei nachricht`, `beende`.
- [Kooperatives Multitasking](../reference/cooperative-multitasking.md) — freigegebene Module sind kooperative Threads.
- [Eine Sammlungsform wählen](picking-a-collection-shape.md) — zur Leitlinie „ein Dict pro Richtung".
