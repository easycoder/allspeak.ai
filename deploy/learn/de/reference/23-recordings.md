# Aufzeichnungen

Eine **Aufzeichnung** ist das, was ein Lauf getan hat: welche Teile des Programms erreicht wurden, in welcher Reihenfolge und wie oft — mit den Zeitpunkten, zu denen sie erreicht wurden. Sie wird als JSON-Datei neben dem Skript geschrieben und kann danach gelesen werden — im Visualisierer oder von jedem anderen Werkzeug —, ohne etwas erneut auszuführen.

Das ist der ganze Sinn. Ein Stacktrace sagt dir, dass ein Programm fehlgeschlagen ist; ein Log ist etwas, das du selbst zu schreiben beschlossen hast; ein Profiler ist eine Zusammenfassung über viele Läufe. Eine Aufzeichnung ist ein Lauf, aufbewahrt.

Zwei Wörter öffnen und schließen eine:

```as
    viz start [on <label>] [once|every] [until thread] [limit <n>]
    viz stop  [on <label>]
```

## Die beiden Markierungen

| Markierung | Was sie tut |
|---|---|
| `viz start` | Armiert einen Recorder, wenn das Skript keinen hat, und öffnet ein Fenster. |
| `viz stop` | Schließt das Fenster und schreibt es in die Trace-Datei. |

`@viz start` und `@viz stop` sind die Attributschreibweisen und bedeuten genau dasselbe wie die Anweisungen. Beide werden akzeptiert, und das ist Absicht: Ein instrumentiertes Skript, das schon funktioniert, darf nicht dadurch aufhören zu funktionieren, dass es eine zusätzliche Art gibt, dasselbe zu sagen. Es ist das Attributpaar, auf das der Visualisierer reagiert; Attribute im Allgemeinen beschreibt `22-attributes` in der englischen Referenz, die noch nicht übersetzt ist.

Die Optionen — jede ist eine Verfeinerung und nicht etwas, das man zuerst lernen müsste:

- **`once`** (die Voreinstellung) — ein Fenster zur Zeit. Ein start/stop-Paar innerhalb einer Unterroutine würde sonst bei jedem Aufruf sein eigenes Fenster öffnen und schließen, was der Autor selten gemeint hat; `once` lässt das erste Fenster stehen.
- **`every`** — das jüngste Fenster gewinnt: Ein zweiter start schließt den vorherigen. Das ist die für eine Schleife.
- **`until thread`** — das Fenster schließt, wenn der Thread endet, der es geöffnet hat, statt an einem stop, den man schreiben muss und leicht vergisst. Das ist es, was mehrere Stopppunkte funktionieren lässt, ohne jeden einzelnen zu instrumentieren.
- **`limit <n>`** — die größte Zahl von Besuchen, die dieses Fenster sammelt, standardmäßig 100.000. Die Obergrenze beendet das *Sammeln*; das Programm läuft weiter.
- **`on <label>`** — die Markierung wird an eine Sprungmarke gesetzt statt an ihre eigene Zeile. Die Sprungmarke wird so benannt, wie `gosub` eine benennt, sodass ein Vorwärtsverweis funktioniert, und ein Name, der auf nichts verweist, ist der Analyse zu melden und nicht dem Compiler.

Ein `viz start` ohne `viz stop` ist kein Fehler. Es ist der Fall „bis zum Ende beobachten“, und ein Host, der den Lauf beendet, schließt sein Fenster für es.

**Eine Markierung ändert nichts an einem Lauf.** `viz start` kompiliert zu einem Befehl, den die Laufzeitumgebung überschreitet, ohne ihn auszuführen, und die Syntax liegt im Kern statt im Plugin — ein instrumentiertes Skript bleibt also ein gewöhnliches Skript, `viz start` kompiliert unabhängig davon, ob der Visualisierer geladen ist, und eine versehentlich stehen gelassene Markierung ist harmlos. Ohne angehängten Recorder öffnet eine Markierung überhaupt kein Fenster: Es wird nichts gesammelt und keine Datei geschrieben.

## Die Werte, die es zu beobachten lohnt

`@show` benennt die Werte, die du neben dem Ablauf sehen möchtest:

```as
    while Total is less than Limit @show Total, Row
    begin
        add Row to Total @show Total
    end
```

Die Werte reiten auf dem **Besuch**, in den sie fallen — ein Besuch ist der Aufenthalt eines Ankers, von einer Ankunft bis zur nächsten —, sodass ein `@show` an einem `while` sich an die Ankunft hängt, zu der es gehört, und ein `@show` weiter unten im Block sich an den laufenden Besuch hängt, der ihn umfasst. Ein zweites `@show` innerhalb derselben Spanne schreibt dieselben Namen neu, statt eine zweite Lesung hinzuzufügen: ein Wert pro Name und Besuch ist das, was ein Leser aufnehmen kann, ohne dass das Panel zu einem Log wird.

Sie reisen in der Aufzeichnung, im Feld `values` des Anker-Datensatzes. Was der Visualisierer damit tut, entsteht noch.

Zwei Einzelheiten sind es wert, gekannt zu werden. Ein Name, den das Programm nicht führt, wird als `?` erfasst, statt zu verschwinden — ein Tippfehler zeigt sich also in der Aufzeichnung, statt den Wert stillschweigend fallen zu lassen. Und ein `@show` innerhalb eines Blocks wird gelesen, wenn die Anweisung erreicht wird, *bevor* sie läuft: Es berichtet also, was der Test gesehen hat, und nicht, was die Anweisung hinterlassen hat.

## Eine Aufzeichnung anfordern

Es gibt mehrere Wege, sie anzufordern, und welcher der richtige ist, hängt davon ab, wer fragt.

### Aus dem Visualisierer

Die Schaltfläche **Record** des Editors zeichnet das Skript im geöffneten Puffer auf. Ein Skript, das eine Anwendung benennt, ist ein Sonderfall — siehe *Die Seite der Anwendung benennen* unten — und stattdessen wird diese Seite geöffnet, von außen armiert und beim Schließen des Fensters geschrieben.

### Die Flag-Datei, für einen laufenden Dienst

Ein Prozess, der auf einer Maschine gestartet wurde, die du nur über SSH erreichst, kann nicht neu gestartet werden, nur um ihn anzusehen — aber eine Datei kann neben sein Skript gelegt werden. Die Anfrage ist also eine Datei:

```
touch thermostat.allspeak.record      fordert eine Aufzeichnung an
rm    thermostat.allspeak.record      zieht die Anfrage zurück
```

Die Flag wird **an den Markierungen und nirgends sonst** gelesen — nichts pollt und nichts läuft auf einem Timer, ein Skript ohne Markierungen wird also nie gefragt, und ein Skript, dessen Markierungen in seiner Steuerschleife sitzen, wird einmal pro Zyklus gefragt, in der Granularität, die sein Autor gewählt hat. Die Flag zu löschen und dann zu setzen beginnt eine Aufzeichnung aus dem Nichts, sodass die vorherige Datei steht, bis diese geschrieben wird, und eine kurze Episode eine gute Aufzeichnung nicht zerstören kann; sie zu setzen und dann zu löschen beendet sie und schreibt sie.

Das ist der eigene Mechanismus der Python-Laufzeitumgebung, und es ist die einzige Stelle, an der eine Aufzeichnung von Hand angefordert wird statt von einem Werkzeug — siehe *Die Laufzeitumgebungen unterscheiden sich* unten, warum der Browser dasselbe nicht kann.

### Aus einem anderen Skript

```as
    record the script in Path as Source giving Trace reporting Verdict
```

Führt ein Skript der Wahl des Aufrufers unter einem Recorder aus und gibt zwei Dinge zurück: die Aufzeichnung als Text in `Trace` und das einzeilige Urteil in `Verdict`. `in <path>` ist optional und benennt das Skript; `as <source>` ist das, was ein Aufrufer übergibt, der den Text selbst hat, damit ein Editor mit ungespeichertem Puffer keine Datei schreiben und wieder einlesen muss. Beide Laufzeitumgebungen haben dieses.

Auf der JavaScript-Seite gibt es zwei weitere, für ein Skript, das sich selbst aufzeichnet, oder eine Anwendung, die bereits läuft:

```as
    record this run
    save the recording to Path
```

`record this run` armiert einen Recorder für das Programm, das es aufruft — genau das, was eine Schaltfläche *innerhalb* einer Anwendung braucht, denn nichts außerhalb eines lebenden Programms kann ihm einen Recorder anhängen. `save the recording to` benennt die Trace-Datei und schreibt, was bereits gestoppt wurde; es **erstellt die Datei** außerdem, leer, wodurch ein zweiter Lauf den ersten ersetzt, statt sich an ihn anzuhängen.

### Von der Kommandozeile

```
allspeak --record=parser.viz.json parser H2O
```

Führt das Skript genau so aus, wie `allspeak parser H2O` es täte, und schreibt, was es getan hat, in die benannte Datei. Ohne die Flag wird nichts armiert, ein einfaches `allspeak parser` verhält sich also wie immer.

## Wohin es geht

Neben das Skript und nach ihm benannt, samt Endung — `thermostat.allspeak` zeichnet nach `thermostat.allspeak.viz.json` auf. Der Editor sucht diesen Namen, eine mit `scp` zurückgeholte Aufzeichnung wird also angezeigt, indem man das Skript öffnet und **Graph** drückt.

Die Datei ist ein JSON-Dokument, beschrieben in `spec/viz-trace-format.md`. Der aktuelle Schreiber erzeugt **Version 2**, die die Transfer-Datensätze hinzugefügt hat, welche sagen, woher die Kontrolle kam, wenn sie nicht einfach durchfiel. Ein Dokument kann im Verlauf einer Aufzeichnung ergänzt werden: `viz start`/`viz stop` begrenzen ein *Segment*, der Fensterindex jedes Segments setzt den des vorherigen fort, und eine Datei enthält daher beliebig viele Segmente hintereinander, in der Reihenfolge, in der sie geschahen.

## Das Urteil

Eine Aufzeichnung berichtet in einer Zeile, was sie wert ist, und diese Zeile ist derselbe Satz, wo immer man sie liest:

> `12 Besuche in 1 Fenster`

Zwei der Lesungen zählen mehr als die übrigen, weil beide von außen wie ein erfolgreicher Lauf aussehen — die eine ist ein Skript, das nie ein Fenster geöffnet hat, die andere ein Skript, das die Absicherung stoppen musste:

> `nichts aufgezeichnet: der Lauf endete, ohne eine Markierung zu erreichen`

> `gestoppt: <Grund>`

und wenn der Lauf auf einem Timer wartete statt beendet zu sein, gewinnt die Besuchszeile einen Zusatz: `, und der Lauf wartet dort — die Aufzeichnung endet bei seinem ersten Warten`.

Die erste ist das, was ein Skript ohne offenes Fenster erzeugt, weshalb die Markierungen oben das eine sind, was hier zu kennen ist.

## Die Seite der Anwendung benennen

```as
    @app color-memory.html
```

Auf einer eigenen Zeile sagt dies, in welcher Seite das Skript läuft. Es ist, was **Launch** öffnet, und es entscheidet, wie **Record** das Skript behandelt: Ein Skript, das eine Anwendung benennt, wird von seiner eigenen Seite getrieben — seine Markierungen werden von einer *Person* durch Klicken erreicht, nicht dadurch, dass das Skript startet —, der Editor öffnet also diese Seite, armiert sie von außen und speichert die Aufzeichnung, wenn das Fenster schließt. Ein Skript, das keine Anwendung benennt, wird stattdessen direkt ausgeführt.

## Die Absicherung

Ein Recorder beobachtet die eigene Arbeit des Programms und beendet den Lauf, wenn dieser davonläuft:

- **2 Sekunden Arbeit** — die Zeit, die die *eigenen* Befehle des Programms gebraucht haben, ohne Wartezeiten: `wait`, `every`, `release`, `input`, `download`, `alert` und alles, was eine `url` abruft. Eine Lücke von mehr als 20 ms ist Warten und nicht Arbeit.
- **20 Sekunden Wanduhr** — denn das Budget allein begrenzt nur, was das Programm *tut*, und eine Schleife, die zwischen ihren Durchläufen wartet, gibt es nie aus. Die beiden werden im Bericht auseinandergehalten, weil das eine langsamer Code ist und das andere meist falscher Code.

**Der Recorder der Flag trägt keine Absicherung, und das ist kein Versehen.** Sein Zweck ist, ein Skript zu beobachten, das wahrscheinlich etwas Nützliches tut — einen Regler, einen Dienst —, und eine Absicherung würde dort *das Beobachtete stoppen*. Er ist stattdessen durch eine Obergrenze dessen begrenzt, was er sammeln darf: 50.000 Besuche, danach schreibt er, was er hat, und sagt es auf stderr, wo die Person, die das `touch` getippt hat, es findet.

## Die Laufzeitumgebungen unterscheiden sich

`record the script …` gibt es in beiden. Der Rest nicht, und die Aufteilung ist es wert, gekannt zu werden, bevor man ein Skript schreibt, das in beiden funktionieren muss:

| | JavaScript (Browser) | Python (Terminal) |
|---|---|---|
| `viz start` / `viz stop` | ja | ja |
| `record the script … giving …` | ja | ja |
| `@viz start` armiert sein eigenes Skript | ja | nein |
| `record this run`, `save the recording to <path>` | ja | nein |
| die Flag-Datei (`thermostat.allspeak.record`) | nein | ja |
| `allspeak --record=<path>` | entfällt | ja |

Die Steuerschleife der Python-Laufzeitumgebung ist eine Datei, die ein Prozess bemerken kann; die des Browsers ist eine Anwendung, deren Recorder von außen angehängt werden muss, bevor ihre erste Markierung läuft. Jede Laufzeitumgebung hat die Form, die zu ihr passt, und keine hat bisher die der anderen.

## Das Skript, ohne es auszuführen

Eine Aufzeichnung braucht einen Lauf. Die andere Frage — *woraus besteht dieses Skript?* — braucht keinen:

```as
    model the script in Path as Source giving Model
```

Dies berichtet die **Anker** des Skripts: die Stellen, an denen der Kontrollfluss nicht einfach die nächste Zeile ist — Sprungmarken, `while`-Tests und die Punkte, an denen ein Ereignishandler betreten wird —, zusammen mit gerade genug des Kontrollflussgraphen, um zu sagen, ob jeder Anker überhaupt erreichbar ist. Nichts wird ausgeführt und nichts gezeichnet; es ist das, was der Blocks-Ansicht des Visualisierers sagt, welche Abschnitte niemand betritt und welche Zeilen ein `viz`-Fenster abdecken könnte.

## Siehe auch

- [Entwicklungsumgebungs-Befehle](dev-environment.md) — `browse`, `system` und `download`, die Schlüsselwörter der Python-Laufzeitumgebung, die ein Startskript nutzt.
- [.allspeak debuggen](debugging-as.md) — die billigeren Instrumente: `log`, `print` und der Tracer.
- [Mehrsprachigkeit](multilingual.md) — `@` ist kein Wort, und das Vokabular der Markierungen wird ebenfalls nicht übersetzt: `viz`, `start`, `stop` und die Optionen werden in jeder Sprache gleich geschrieben.
- [Mit KI arbeiten](working-with-ai.md) — wo eine Aufzeichnung in den Kreislauf „die KI schreibt, der Mensch prüft“ passt.
- `spec/viz-trace-format.md` im Repository — das Dateiformat, Feld für Feld.
