# REST und asynchron

## Problem

Du musst mit einem HTTP-Endpunkt sprechen: einen Konfigurationsblob holen, ein Formular posten, eine Liste von Datensätzen ziehen. Der Aufruf kann fehlschlagen; das Skript muss das behandeln und den Rest der Anwendung während des Wartens reaktionsfähig halten.

## Die grundlegenden Formen

```as
rest hole Result von `/api/users` oder gehe zu FetchFailed
rest poste Payload zu `/api/users` oder gehe zu PostFailed
rest put Payload to `/api/users/42` oder gehe zu PutFailed
rest delete from `/api/users/42` oder gehe zu DeleteFailed
```

Alle vier nehmen eine optionale Fehlerklausel. Der Body einer GET-Antwort landet in einer Variable (dem ersten Argument); der Body eines POST oder PUT ist ein Wert, der gesendet wird.

`Result` kommt typischerweise als JSON-förmige Zeichenkette an, bereit, per `eigenschaft`-, `element`- oder `eintrag`-Zugriff untersucht zu werden (siehe [Sammlungen](../reference/collections.md)).

## Fehlerbehandlung

Zwei Klauseln, zwei Absichten — siehe [Fehler und Wiederherstellung](../reference/errors-and-recovery.md):

- `oder` für „melden und aussteigen" — der Thread stoppt nach dem Klausel-Body.
- `on failure` für „ersetzen und weitermachen" — die Ausführung geht weiter.

```as
rest hole Config von `/api/config`
    oder beginn
        drucke `Server nicht erreichbar: ` cat der fehler
        gosub UseLocalConfig
    ende
! nie erreicht, wenn der Aufruf fehlschlug
```

```as
rest hole Config von `/api/config`
    on failure setze Config zu `{}`
drucke Config       ! immer erreicht; Config ist entweder geholt oder leer
```

## Während des Wartens nachgeben

`rest hole` und seine Geschwister blockieren den aktuellen Thread, bis die Antwort eintrifft, aber die Laufzeit verteilt weiterhin andere Threads. Die UI bleibt reaktionsfähig, Ereignis-Handler feuern weiter, abgezweigte Threads laufen weiter.

Wenn du parallel zu einem langen Abruf arbeiten musst — einen Spinner zeigen, etwas animieren — starte vor dem Aufruf einen separaten Thread:

```as
zweige zu Spinner
rest hole Data von `/api/slow-endpoint` oder gehe zu FetchFailed
leere Spinning
! ... Data verwenden ...

Spinner:
    setze Spinning
    solange Spinning beginn
        ! ... das Spinner-Bild weiterdrehen ...
        warte 50 millis
    ende
    stoppe
```

Der Hauptthread blockiert bei `rest hole`; der Spinner-Thread läuft weiter, weil die Laufzeit ihm bei jedem `warte` einen Zug gibt. Wenn die Antwort eintrifft, läuft der Hauptthread weiter und leert das Flag; der Spinner merkt es beim nächsten `warte` und stoppt.

## Server-seitige vs. skript-seitige Iteration

Wenn du eine Sammlung abrufst, lass den Server nach Möglichkeit filtern und paginieren. Ein Skript, das das tut:

```as
rest hole All von `/api/items` oder stoppe
! ... dann durch All iterieren und die 5 heraussuchen, die der Benutzer wirklich will
```

zwingt den Server, alles zu senden, und das Netzwerk, es zu transportieren. Wenn die API Query-Parameter unterstützt:

```as
rest hole Subset von `/api/items?limit=5&category=Books` oder stoppe
```

Das Prinzip: erledige die Arbeit dort, wo die Daten leben. Greife nur dann zur skript-seitigen Iteration, wenn der Server nicht helfen kann.

## Ein Wörterbuch posten

Baue die Nutzdaten als JSON-förmige Variable und gib sie an `rest poste`:

```as
variable Payload
setze Payload zu objekt
setze eigenschaft `name` von Payload zu NameField
setze eigenschaft `email` von Payload zu EmailField

rest poste Payload zu `/api/users`
    oder beginn
        drucke `Registrierung fehlgeschlagen: ` cat der fehler
        stoppe
    ende
```

Die Laufzeit serialisiert die Nutzdaten für die Übertragung zu JSON. Siehe [Eine Sammlungsform wählen](picking-a-collection-shape.md) für die „ein Dict pro Richtung"-Regel.

## Anti-Muster: Polling ohne Nachgeben

```as
solange nicht Bereit beginn
    rest hole Status von `/api/status` oder stoppe
    ! ... Status prüfen ...
ende
```

Das belastet den Server bei jeder Iteration der Schleife. Füge zwischen den Prüfungen ein `warte` ein, um zu drosseln:

```as
solange nicht Bereit beginn
    rest hole Status von `/api/status` oder stoppe
    ! ... Status prüfen ...
    warte 1 sekunde
ende
```

Für längere Wartezeiten bevorzuge Server-seitigen Push (WebSocket, MQTT-Abonnement, Server-sent Events) gegenüber Polling — siehe [MQTT pub/sub](mqtt-pubsub.md) für das kanonische AllSpeak-Push-Muster.

## Anti-Muster: stiller Fehlschlag bei kritischen Laden

```as
rest hole Config von `/config.json` on failure setze Config zu `{}`
! ... das Skript arbeitet mit einer leeren Config weiter ...
```

Wenn Config kritisch ist, lässt `on failure setze zu leer` das Skript überall nachgelagert mit kaputten Annahmen laufen. Verwende `oder` und brich ab, oder `on failure` plus einen klar protokollierten Degradiert-Modus. Vertusche es nicht.

## Siehe auch

- [Fehler und Wiederherstellung](../reference/errors-and-recovery.md) — `oder` vs. `on failure`.
- [Sammlungen](../reference/collections.md) — JSON-förmige Nutzdaten.
- [Kooperatives Multitasking](../reference/cooperative-multitasking.md) — `zweige` und `warte`.
- [MQTT pub/sub](mqtt-pubsub.md) — Push statt Polling.
