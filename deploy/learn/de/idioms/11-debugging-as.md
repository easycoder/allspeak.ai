# .as debuggen

## Problem

Ein Skript tut nicht, was du erwartest — ein Wert ist falsch, ein Handler feuert nicht, ein Thread hungert die Laufzeit aus. Du brauchst Sichtbarkeit darüber, was tatsächlich passiert, und du musst das Problem zuverlässig genug reproduzieren, um es zu beheben.

## Die Alltagswerkzeuge

### `drucke` und `logge`

Geben einen Wert an das Laufzeit-Log aus. Beide Schlüsselwörter tun dasselbe — `logge` liest sich besser, wenn du den Programmfluss verfolgst, `drucke` liest sich besser, wenn du ein Ergebnis zeigst:

```as
drucke `Zähler ist ` cat Counter
logge `Betrete MessageHandler mit ` cat die mqtt nachricht
```

Das Log erscheint in der Browser-Konsole (JS) oder auf der Standardausgabe (Python). Verwende sie beim Entwickeln großzügig; für die Produktion entferne sie oder schütze sie mit einem Flag.

### Bedingte Ausgabe über das `verfolgung`-Flag

Die Laufzeit hat ein globales Trace-Flag, geprüft mit der Bedingung `verfolgung`:

```as
wenn verfolgung logge `Zustand wechselt zu Leerlauf`
```

Wenn Tracing an ist, feuert das Log; wenn aus, ist die Anweisung wirkungslos (wird trotzdem ausgewertet — ein kleiner Preis). Nützlich für Log-Anweisungen, die du im Code behalten willst, die aber nur während der Diagnose feuern sollen.

### `debug step` und Verwandte

`debug step` protokolliert jede Zeile, sobald die Laufzeit sie erreicht — praktisch, wenn du herausfinden willst, wo etwas schiefgelaufen ist. Die Suffixe `step` und `stop` bleiben englisch (das Paket kündigt zwar `debug schritt` / `debug stoppe` an, aber die Laufzeit erkennt nur `step` und `stop`):

```as
debug step
gosub ComplicatedRoutine
```

`debug stop` bricht das Schritt-für-Schritt-Laufen ab. `debug breakpoint` markiert eine Stelle, an der der Debugger der Browser-Entwicklertools im darunterliegenden JS-Quellcode stoppen kann. Das Schlüsselwort `debug` hat weitere Modi, die mit den Engine-Versionen kommen und gehen; behandle die dokumentierten Formen als stabile Teilmenge und prüfe für Exotischeres die aktuelle Implementierung.

### `attrappe`

Eine Anweisung ohne Wirkung. Ihr Zweck ist, dir eine bekannte Stelle im kompilierten oder laufenden JS/Python zu geben, an der du einen nativen Haltepunkt setzen kannst, kurz vor einem vermuteten Problem:

```as
attrappe
drucke Result        ! der JS/Python-Debugger kann auf der Zeile darüber stoppen
```

Wenn die Laufzeit auf `attrappe` trifft, stoppt der Browser- (oder Python-)Debugger, falls auf dem attrappe-Handler ein Haltepunkt gesetzt ist, und du kannst den Laufzeitzustand direkt vor der nächsten Anweisung inspizieren.

### Der Tracer

Das Tracer-Panel zeigt die letzten Laufzeit-Ereignisse. Du aktivierst es aus dem Skript:

```as
setze die traceur zeilen zu 10
```

Der Codex hat eine eigene Tracer-Seite; dort findest du die vollständigen Optionen.

## Ein Ablauf zum Debuggen

Langsam, aber zuverlässig:

1. **Formuliere, was du erwartest**, in einem Kommentar nahe der vermuteten Fehlerstelle.
2. **Füge `drucke`- oder `logge`-Anweisungen ein** an den relevanten Wendepunkten: am Anfang eines Handlers, beim Eintritt in eine Unterroutine, beim Verlassen einer Schleife. Gib die Werte aus, die deiner Erwartung entsprechen sollten.
3. **Führe aus und lies das Log.** Wo weicht die Realität von der Erwartung ab?
4. **Verenge die Lücke.** Rücke die Ausgaben näher zusammen, bis du die Anweisung isoliert hast, die den falschen Wert erzeugt.
5. **Behebe.** Entferne danach die Ausgaben oder schütze sie mit `wenn verfolgung`.

Das erzwingt explizites Denken und erzeugt eine schriftliche Spur, die du erneut lesen kannst. Der IDE-Debugger ist schneller, wenn du den Fehler auf einen einzelnen Thread eingrenzen kannst; das Log ist zuverlässiger bei threadübergreifenden Problemen, wo Pausieren die Zeitabläufe verfälscht.

## In `conformance/` reproduzieren

`/conformance/` enthält Skripte, die bestimmte Verhaltensweisen der Engine testen. Wenn ein Fehler in der Engine zu liegen scheint (nicht in deinem Skript), bedeutet das Reduzieren auf ein minimales `conformance/`-Skript:

- Erzwingt eine präzise Beschreibung des Fehlverhaltens.
- Gibt den Engine-Maintainern etwas, das sie ausführen können.
- Wird nach der Behebung zu einem Regressionstest.

Ein gutes Conformance-Skript ist klein (eine Bildschirmlänge), in sich geschlossen (keine externen Ressourcen) und nach dem benannt, was es testet.

## Anti-Muster: Dinge ändern, ohne das Log zu lesen

Es ist verlockend, am Code herumzudrehen, bis das Symptom verschwindet. Der Fehler zieht meist um, statt zu verschwinden. Lies das Log, finde die Abweichung und ändere dann genau das, was den falschen Wert erzeugt.

## Anti-Muster: `drucke` in engen Schleifen

```as
solange N ist kleiner als 10000 beginn
    drucke N
    ! ... Arbeit ...
    addiere 1 zu N
ende
```

Zehntausend Log-Zeilen ersäufen das Signal. Nimm stattdessen Stichproben:

```as
solange N ist kleiner als 10000 beginn
    wenn N modulo 100 ist 0 drucke `Erreicht ` cat N
    ! ... Arbeit ...
    addiere 1 zu N
ende
```

Oder nutze den Tracer, der die letzten Ereignisse zeigt und alte verwirft.

## Anti-Muster: Produktions-Logs anlassen

`drucke` und `logge` laufen immer. Sobald ein Fehler behoben ist, entferne die Anweisung oder umschließe sie mit `wenn verfolgung`. Sonst füllt sich die Produktions-Konsole mit Rauschen, durch das sich künftiges Debuggen kämpfen muss.

## Siehe auch

- [Kontrollfluss](../reference/control-flow.md) — `stoppe`, `gosub`, wo Debug-Einträge platziert werden.
- [Kooperatives Multitasking](../reference/cooperative-multitasking.md) — der Tracer zeigt die Thread-Verschachtelung.
- [Mit KI arbeiten](working-with-ai.md) — wenn ein KI-Fehler der Bug ist.
