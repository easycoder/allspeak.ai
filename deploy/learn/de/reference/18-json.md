# JSON

AllSpeak behandelt JSON als erstklassiges Konzept statt als lästige Zeichenketten-Bastelei. Die meisten Skripte, die JSON lesen oder schreiben, rufen keinen expliziten `stringify`- oder `parse`-Schritt auf — die umgebenden Befehle erledigen das, basierend auf dem Typ des Werts. Diese Seite sammelt die Regeln, damit du sie nicht Schlüsselwort für Schlüsselwort entdecken musst.

## JSON schreiben

Die beiden Hauptwege sind `save` für Ganzwert-Schreibvorgänge und `ergänze … zur json-Datei` für inkrementelle Schreibvorgänge.

### `save Var zu <pfad>` — kodiert dict und Liste automatisch

Das `save` der Python-Laufzeit prüft den Typ seines Inhalts. Ist es ein `dict` oder eine `list`, wird der Wert vor dem Schreiben mit `json.dumps` serialisiert; ist es eine Zeichenkette, wird sie unverändert geschrieben.

```
variable Rows
list Rows
! ... Rows befüllen ...
save Rows zu `data/2024-25/04.json`
```

JSON-Ausgabe ist **standardmäßig hübsch formatiert** (Einrückung mit zwei Leerzeichen), sodass gespeicherte Dateien direkt zur menschlichen Prüfung geöffnet werden können. Das gilt für zwei Wege:

- **Automatisch kodiertes dict oder Liste.** Der Serialisierer nutzt `indent=2`, unabhängig vom Dateipfad.
- **Zeichenketten-Inhalt, der in einen `.json`-Pfad gespeichert wird.** Wenn der Inhalt bereits eine JSON-Zeichenkette ist (z. B. der Request-Body eines POST an den `/write/<file>`-Endpunkt von `server.as`, der von `save` unverändert geschrieben wird), wird er geparst und mit `indent=2` neu ausgegeben. Wenn die Zeichenkette nicht als JSON parst, wird sie unverändert geschrieben — Nicht-JSON-Inhalt in einer `.json`-Datei bleibt unangetastet, statt den Save zum Absturz zu bringen.

Die Dateiendung ist eine Dokumentations-Konvention für die *Kodierung* — ein dict oder eine Liste, die in eine Datei ohne Endung gespeichert wird, wird trotzdem als JSON kodiert; eine Nicht-JSON-Zeichenkette, die in `report.json` gespeichert wird, wird trotzdem unverändert geschrieben — aber für die *Formatierung* löst die `.json`-Endung den Pretty-Print-Durchlauf bei Zeichenketten-Inhalt aus.

### `ergänze Item zur json-Datei <pfad>` — inkrementelles Anhängen an ein Array

```
ergänze NewRow zur json-Datei `data/2024-25/04.json`
```

Liest das bestehende Array, hängt `Item` an, schreibt zurück. Erzeugt die Datei (mit einem Ein-Element-Array), wenn sie nicht existiert. Verwende das, wenn du Zeilen in eine Datei strömen willst, ohne die ganze Liste im Speicher zu halten.

Die Datei muss ein JSON-Array enthalten — das Anhängen an eine Objekt-Datei wirft einen Laufzeitfehler.

### Übergeordnete Verzeichnisse werden automatisch angelegt

`save Var zu data/2024-25/04.json` legt `data/` und `data/2024-25/` bei Bedarf an, wenn sie nicht existieren. Kein `create directory`-Schritt nötig — dieser Befehl bleibt für Fälle verfügbar, in denen du ein Verzeichnis anlegen willst, ohne etwas hineinzuschreiben. (Nutze ihn sparsam: explizites `create directory` ist selten nötig, seit `save` seinen eigenen Baum verwaltet.)

## JSON lesen

### `load Var von <pfad>` — liest als Zeichenkette

`load` liest den Dateiinhalt unverändert und speichert das Ergebnis als Zeichenkette. Es parst kein JSON, egal welche Dateiendung.

```
variable Text
load Text von `data/2024-25/04.json`
```

`Text` ist jetzt der rohe Dateiinhalt.

### `json von <zeichenkette>` — parst zu dict oder Liste

Um die geladene Zeichenkette in einen brauchbaren Wert zu verwandeln, nimm ihr `json von`:

```
variable Text
variable Rows
load Text von `data/2024-25/04.json`
lege json von Text in Rows
```

`Rows` ist jetzt ein dict oder eine Liste (je nach oberster JSON-Form) und kann mit den üblichen Array-/Wörterbuch-Befehlen indiziert, durchlaufen oder gezählt werden.

Wenn die Eingabe kein gültiges JSON ist, liefert `json von` einen leeren Wert statt einen Fehler zu werfen — umschließe Folgecode mit einem `wenn Rows ist leer`-Schutz, wenn du der Quelle nicht traust.

## JSON-Text neu formatieren

Zwei Wert-Modifikatoren arbeiten auf JSON-Zeichenketten, ohne dicts oder Listen anzufassen:

- `stringify Text` — gibt erneut als kompaktes JSON aus (kein Leerraum). Nützlich, um eine handgeschriebene oder hübsch formatierte Nutzlast vor der Übertragung zu normalisieren.
- `prettify Text` — gibt erneut mit 4-Leerzeichen-Einrückung aus. Nützlich, um menschenlesbare Konfigurationsdateien zu schreiben.

Beide erwarten, dass ihre Eingabe bereits eine gültige JSON-Zeichenkette ist. Um ein dict oder eine Liste direkt hübsch zu formatieren, speichere es (das kodiert kompakt), lade es neu und formatiere es hübsch; oder schick es nach einem Save/Load-Round-Trip durch `stringify`.

## JS-Falle: `lege V in X` ersetzt den Slot

Auf der JS-Seite initialisiert `setze X zu feld` den Cursor-Slot auf `[]`. Ein nachfolgendes `lege Row in X` *ersetzt* den Slot — die Array-Hülle ist verloren, und nur `Row` bleibt im Slot. `rest poste X` sendet dann `Row`, nicht `[Row]`.

```as
! FALSCH
variable Bucket
setze Bucket zu feld
indexiere Bucket zu 0
lege Row in Bucket            ! Der Slot ist jetzt Row; die [] sind weg
rest poste Bucket zu URL      ! sendet Row, nicht [Row]
```

Das ist kein Bug — `lege V in X` schreibt V in den Cursor-Slot genau wie bei einer ungenutzten Variable; die Laufzeit behandelt Arrays in Slots nicht bevorzugt. Um das im Slot gehaltene Array zu vergrößern, nutze das array-bewusste Schlüsselwort:

```as
! RICHTIG
variable Bucket
setze Bucket zu feld
json addiere Row zu Bucket    ! Der Slot ist jetzt [Row]
rest poste Bucket zu URL      ! sendet [Row]
```

Siehe [Sammlungen](04-collections.md) für die längere Erklärung, warum das Cursor-Modell und `setze X zu feld` unabhängige Ebenen sind, die sich mit `lege` nicht zusammensetzen.

## Hinweise zu beiden Laufzeiten

Dieselbe Oberflächen-Syntax funktioniert auf beiden Laufzeiten, aber die Details auf Laufzeit-Seite unterscheiden sich:

- **JS-Browser-Seite:** `rest hole`/`rest poste` behandeln JSON automatisch — der Antwort-Body einer `application/json`-Antwort wird geparst, bevor er in die Zielvariable gelegt wird, und ein dict-/Listen-Ziel wird als JSON als Request-Body kodiert. Die eigene `json`-Schlüsselwortfamilie (`json addiere`, `json lösche`, `json sortiere` …) bietet In-Place-Manipulation.
- **Python-Seite:** Es gibt heute keine `rest`-Schlüsselwortfamilie; HTTP-I/O auf der Python-Seite läuft über `hole … von url`, `download` und die Request-Handler des `server`-Plugins. Diese Server-Plugin-Handler kodieren den Rückgabewert automatisch, sodass `retourniere Rows zu Files` JSON liefert, wenn `Rows` ein dict oder eine Liste ist.

Schreibe Skripte, die auf beiden Laufzeiten laufen müssen, gegen den `save`/`load`/`json von`-Kern und überlasse HTTP-I/O der einen oder anderen Laufzeit.

## Wann du keine JSON-Dateien verwenden solltest

JSON ist das offensichtliche Format für strukturierte Daten, aber:

- Für Konfiguration, die Menschen von Hand bearbeiten, überlege, ob eine Webson-`.json` (siehe [Browser und Webson](14-browser-and-webson.md)) besser passt — sie kann Kommentare über `#doc`-Schlüssel enthalten und unterstützt Komponenten-Wiederverwendung über `$Name`.
- Für tabellarische Daten mit Millionen Zeilen ist JSON langsam zu parsen und sperrig zu speichern; behandle es als Zwischenstufe statt als Langzeitformat.
- Für Inter-Prozess-Nachrichten über MQTT kodiert die JS-Laufzeit die Nutzlast bereits automatisch (siehe [MQTT pub/sub](../idioms/07-mqtt-pubsub.md)) — kodiere nicht doppelt, indem du erst `stringify` ausführst.
