# Module

Ein Modul ist ein AllSpeak-Skript, das von einem anderen AllSpeak-Skript geladen und ausgeführt wird. Der Parent kann es wie eine Unterroutine aufrufen, es nebenläufig als weiteren kooperativen Thread laufen lassen — oder beides. Module haben eigene private Variablen und einen eigenen Label-Namensraum; die Kommunikation mit dem Parent läuft über Nachrichtenübermittlung.

Für die Design-Kriterien und ausgearbeitete Beispiele, *wann* man ein Modul extrahiert, siehe [Ein Modul extrahieren](../idioms/extracting-a-module.md). Dieses Dokument behandelt den Mechanismus.

## Die Modulvariable

Ein Modul wird über eine Variable vom Typ `modul` referenziert:

```as
modul DeviceController
```

Die Variable startet leer. `laufe` lädt ein Skript hinein.

## `laufe`

`laufe` lädt, kompiliert und startet das Skript. Die Syntax unterscheidet sich zwischen den Dialekten.

**Python** — das Argument ist ein Pfad; die Laufzeit öffnet und kompiliert die Datei:

```as
laufe `deviceControl.as` als DeviceController
```

**JS** — das Argument ist eine Variable, die den Quelltext hält. Hole sie zuerst mit `rest hole`:

```as
variable ModuleSrc
rest hole ModuleSrc von `resources/as/device-control.as?v=` cat jetzt
    oder gehe zu LoadFailed
laufe ModuleSrc als DeviceController
```

In beiden Dialekten beginnt das Kind-Skript nach `laufe` mit der Ausführung. Standardmäßig blockiert der Parent beim `laufe`, bis das Kind `beende` erreicht oder sich mit `release parent` explizit freigibt.

## `release parent`

Wenn das Modul `release parent` aufruft, kehrt das `laufe` des Parents sofort zurück und das Modul wird ein separater kooperativer Thread neben dem Parent:

```as
! Modul
bei nachricht gehe zu Handler
release parent          ! das `laufe` des Parents kehrt von hier zurück
stoppe                  ! parken und auf Nachrichten warten
```

Ohne `release parent` bleibt der Parent blockiert, bis das Modul endet. Das ist der Unterschied zwischen einem Modul als synchronem Helfer (kein Release) und einem langlebigen Mitarbeiter, der neben dem Parent besteht (freigegeben). Nebenläufigkeit bedeutet nicht, dass beide aktiv sind — ein freigegebenes Modul, das nur auf die nächste Nachricht wartet, zählt trotzdem. Es ist Sache des Aufrufers von `sende`, ob er auf eine Antwort wartet oder weitermacht.

## Nachrichtenübermittlung

Nach dem Release kommunizieren Parent und Kind per Nachrichten. Der Parent sendet:

```as
sende InputDict zu Helper
sende InputDict zu Helper und zuweise antwort zu OutputDict
```

Beide Formen senden den Wert (typischerweise ein Wörterbuch). Die zweite Form wartet, bis das Modul `sende … zu absender` aufruft, und weist dann die Antwort zu.

Das Modul deklariert den Nachrichten-Handler einmal, nahe seinem Anfang:

```as
bei nachricht gehe zu Handler

Handler:
    lege die nachricht in InputDict
    ! ... die Arbeit erledigen ...
    sende ResultDict zu absender
    stoppe
```

Es ist auch gültig, den Handler als `beginn … ende`-Block direkt nach `bei nachricht` zu schreiben, aber ein separat beschrifteter Block liest sich meist klarer.

Im Handler:

- **`lege die nachricht in X`** liest die eingehende Nachricht in X.
- **`sende Y zu absender`** sendet einen Wert zurück an das Skript, das die ursprüngliche Nachricht gesendet hat.
- **`stoppe` (nicht `retourniere`)** beendet den Handler-Thread und wartet auf die nächste Nachricht. `retourniere` kann nur einen Block beenden, der per `gosub` erreicht wurde; anderswo führt es dazu, dass die Laufzeit einen korrupten Stapel erkennt und eine Ausnahme wirft.

Die gleiche Form funktioniert in jede Richtung — ein Modul kann an sein `parent`, an `absender` oder an ein anderes Modul senden, das es selbst geladen hat; Parents können ihren eigenen `bei nachricht gehe zu …`-Handler haben. Die Begriffe „Parent" und „Kind" bedeuten keine Rangordnung — beide haben gleiche Rechte und Fähigkeiten. Die einzige Ausnahme ist das Recht des primären (obersten) Moduls, die Anwendung herunterzufahren.

## `beende`

Wenn ein Modul fertig ist, ruft es `beende` auf. Das:

- Beendet den Thread des Moduls.
- Gibt die Kontrolle an den Parent zurück, wenn der beim `laufe` blockiert war.
- Gibt den gesamten Laufzeitspeicher des Moduls für die Garbage Collection frei.

Der letzte Punkt ist wichtig: Eine Anwendung kann über viele Module hinweg viel Funktionalität ansammeln, ohne ungenutzte im Speicher zu behalten.

Für ein langlebiges nebenläufiges Modul, das Nachrichten auf unbestimmte Zeit behandelt, rufst du normalerweise kein `beende` auf — der Handler ruft `stoppe` auf und wartet für immer.

## Privater Zustand und Namensräume

In einem Modul sind alle Variablen privat. Zwei Module, die jeweils ein `Counter` deklarieren, haben ihr eigenes. Die Variablen des Parents sind für das Modul unsichtbar, es sei denn, sie werden mit `mit` exportiert und mit `importiere` importiert (nächster Abschnitt).

Module haben auch einen unabhängigen **Label**-Namensraum. Eine Helfer-Unterroutine wie `ParseDate`, die in Parent und Kind verwendet wird, muss entweder dupliziert werden — eine Kopie in jedem Skript — oder in einem eigenen Modul leben, das Parent und Kind unabhängig instanziieren und laufen lassen. Der Preis der Trennung ist real; die Alternative (alles geteilt) würde den Sinn zunichtemachen.

## `mit` und `importiere`

Um Variablen über die Grenze zu teilen, exportiert der Parent mit `mit` beim `laufe`, und das Modul importiert die passenden Namen am Anfang seines Skripts:

```as
! Elternskript
laufe Script als MyModule mit Specification und MainPanel
```

```as
! Modul
script ModuleName
importiere variable Specification und div MainPanel
```

Die Namen und Typen müssen auf beiden Seiten übereinstimmen, und die importierten Namen dürfen nicht mit den selbst deklarierten Variablen des Moduls kollidieren. Änderungen auf beiden Seiten sieht die jeweils andere — das sind gemeinsame Referenzen, keine Kopien.

## Die `script`-Zeile

Üblicherweise beginnt eine Moduldatei mit einer `script`-Deklaration, die sich selbst benennt:

```as
script DeviceController
```

Das ist informativ — es setzt den Programmnamen für Logs und Diagnosen. Es ist optional; Nicht-Modul-Skripte lassen es oft weg.

## Siehe auch

- [Kooperatives Multitasking](cooperative-multitasking.md) — `release parent` macht das Modul zu einem kooperativen Thread.
- [Ein Modul extrahieren](../idioms/extracting-a-module.md) — wann und wie ein Skript aufgeteilt wird (nutzt die Fähigkeit `as-modularize`).
- [REST und asynchron](../idioms/rest-and-async.md) — das Hole-dann-Laufe-Muster des JS-Dialekts.
