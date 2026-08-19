# Kooperatives Multitasking

AllSpeak führt mehrere Threads kooperativ aus. Das Hauptskript, jeder Event-Handler und jeder abgezweigte Thread sind getrennte Ausführungs-Threads, die denselben globalen Zustand teilen. Sie wechseln sich ab; die Laufzeit unterbricht einen nie mitten in einer Anweisung.

Das ist grundlegend anders als Betriebssystem-Threads. Es gibt keine Parallelität, keine Race-Condition innerhalb einer einzelnen Anweisung und keinen Bedarf für Sperren. Der Preis: Lang laufende Arbeit muss die Kontrolle explizit abgeben, sonst kommen andere Threads nicht zum Zug.

## Wie Threads entstehen

Drei Wege, auf denen ein Thread entsteht:

1. **Der Haupt-Thread.** Der Code der obersten Ebene ist der Haupt-Thread. Er läuft, bis er auf `stoppe` trifft.
2. **Ein Event-Handler.** `bei klick X gosub Handler` registriert Handler. Wenn das Ereignis feuert, startet die Laufzeit einen neuen Thread bei Handler.
3. **Ein abgezweigter Thread.** `zweige zu Label` erzeugt einen neuen Thread bei Label und startet ihn sofort. Der startende Thread parkt sich selbst und stellt seine nächste Anweisung in die Warteschlange, um später fortzufahren.

Alle Threads laufen im selben Prozess, teilen alle globalen Variablen und geben die Kontrolle nur an den gleich beschriebenen Stellen ab.

## Wann Threads die Kontrolle abgeben

Die Laufzeit unterbricht einen Thread nie mitten in einer Anweisung. Anweisungen wie `setze X zu Y`, `addiere A zu B`, `drucke Z` laufen vollständig durch, bevor ein anderer Thread an die Reihe kommt. Ein Thread gibt die Kontrolle nur an diesen Stellen ab:

- **`warte N <einheit>`** — mindestens die angegebene Zeit schlafen, dann fortfahren. Der Thread ist geparkt; andere Threads laufen, während er schläft.
- **`stoppe`** — den Thread dauerhaft beenden.
- **Ende eines Event-Handler-Threads** — der Thread endet, wenn `retourniere` vom Dispatch-Frame abfällt, oder nach einem `stoppe`, oder nach dem abschließenden `ende` eines Inline-Handler-Blocks (siehe [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md)).
- **Blockierende I/O** — `rest hole`, `mqtt publish`, `wait for message` und Ähnliches, die die Kontrolle an die Ereignisschleife der Laufzeit zurückgeben, während sie warten.

Außerhalb dieser Stellen hält ein Thread die Laufzeit fest. Eine `solange wahr beginn … ende`-Schleife ohne `warte` darin hungert jeden anderen Thread aus — blockiert Benutzeraktionen und riskiert CPU-Überhitzung. Die Laufzeit hat eine grundlegende Schutzmaßnahme, die aus jeder Schleife ausbricht, die zu viele Anweisungen ohne Kontrollabgabe ausführt, aber du solltest dich nicht darauf verlassen: setze bewusst ein `warte` ein.

## `zweige`

`zweige zu Label` (oder `zweige Label` — das `zu` ist optional) startet einen neuen Thread bei Label:

```as
Main:
    zweige zu Animator
    zweige zu NetworkPoller
    bei klick StartButton gosub StartGame
    stoppe

Animator:
    solange wahr beginn
        ! ... einen Frame weiterbewegen ...
        warte 16 millis
    ende

NetworkPoller:
    solange wahr beginn
        rest hole Status von `/health`
        warte 1 sekunde
    ende
```

Wenn `zweige` läuft, startet der neue Thread sofort und der startende Thread parkt sich selbst und stellt seine nächste Anweisung in die Warteschlange. Die Kontrolle kehrt zum Starter zurück, wenn der abgezweigte Thread die Kontrolle abgibt (per `warte`, blockierende I/O oder `stoppe`). Von da an läuft jeder abgezweigte Thread unabhängig; sie teilen die Globals mit dem Haupt-Thread und untereinander. Die Koordination zwischen Threads läuft über gemeinsamen Zustand — setze in einem eine Variable, lies sie in einem anderen.

## `warte`

Die Kontrollabgabe für den Alltag. Einheiten sind `millis` / `milli`, `ticks` / `tick` (10 ms), `sekunden` / `sekunde` (die Standardeinheit) und `minuten` / `minute`:

```as
warte 5 millis           ! 5 Millisekunden
warte 100 ticks          ! 100 × 10 ms = 1 s
warte 2 sekunden         ! die Standardeinheit, darf weggelassen werden
warte 2                  ! 2 Sekunden (Standard)
warte 5 minuten
```

In einer Animationsschleife erledigt der Rumpf die Arbeit eines Frames und `warte`t einige Millisekunden vor dem nächsten Frame. In einer Poll-Schleife ist `warte` das Intervall zwischen den Abfragen. In jeder lang laufenden Schleife ist ein `warte` das Minimum, um die Laufzeit zu teilen — ohne eines kann kein anderer Thread laufen und die Oberfläche friert ein.

## Threads koordinieren

Es gibt keine Semaphore, Mutexe oder Kanäle — das kooperative Modell beseitigt den meisten Bedarf. Koordination läuft über gemeinsame Variablen und Polling:

```as
! Der Produzent-Thread setzt ein Flag; der Konsument bemerkt es.
variable Ready

Producer:
    ! ... Daten vorbereiten ...
    setze Ready
    stoppe

Consumer:
    solange nicht Ready warte 10 millis
    ! ... Daten verarbeiten ...
    leere Ready
    stoppe
```

Da kein Thread mitten in einer Anweisung unterbrochen werden kann, ist `setze Ready` atomar. Das `solange nicht Ready warte 10 millis` des Konsumenten ist grobes Polling — in Ordnung, wenn die Aufwach-Latenz keine Rolle spielt.

Für reichhaltigere Koordination passen Module und Nachrichtenübermittlung meist besser als rohe Flags — siehe [Module](modules.md).

## Module und Threads

Ein mit `laufe X` geladenes Modul läuft als Kind des Parents. Standardmäßig blockiert der Parent, während das Modul läuft. Das Modul kann `release parent` aufrufen, damit der Parent nebenläufig weitermachen kann — ab dann wird das Modul ein weiterer kooperativer Thread. Parent und Kind können dann über `nachricht …` und den `bei nachricht`-Handler kommunizieren.

Das ist die kanonische Struktur für größere asynchrone Arbeit. Siehe [Module](modules.md) für den Mechanismus und die Fähigkeit `as-modularize` für ausgearbeitete Beispiele.

## Warum kooperativ

Das Modell tauscht Parallelität gegen Einfachheit. Die Vorteile:

- Keine Race-Conditions bei einzelnen Anweisungen; du kannst direkt über den Zustand nachdenken.
- Keine Sperren, keine Atomics, keine Überraschungen bei der Speicherordnung.
- Threads fügen sich zusammen: ein Event-Handler ist ein Thread, ein Zweig ist ein Thread, ein freigegebenes Modul ist ein Thread — alles dieselbe Art von Ding.

Der Preis:

- CPU-gebundene Arbeit in einem Thread blockiert alles andere.
- Der Autor muss in langen Schleifen `warte`s einfügen, um die Laufzeit zu teilen.
- Echte Parallelität für Leistung gibt es nicht — dafür nimm ein Plugin, das einen nativen Worker umschließt, oder lagere in einen separaten Prozess aus.

## Siehe auch

- [Kontrollfluss](control-flow.md) — `stoppe`, `gosub`, `gehe zu` — die Kontrollmechanismen pro Thread.
- [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md) — Event-Handler als Threads.
- [Module](modules.md) — `release parent`, Nachrichtenübermittlung, größere Nebenläufigkeitseinheiten.
