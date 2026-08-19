# AllSpeak-Kurs

> **Übersetzung in Arbeit** — dieser Kurs ist eine erste Übersetzung, noch nicht von Muttersprachlern geprüft. Wenn du einen Fehler findest, melde ihn in den [GitHub-Issues](https://github.com/easycoder/allspeak.ai/issues).

Ein praktischer Leitfaden zum Schreiben idiomatischen AllSpeak. Zwei Ebenen :

- **Referenz** beantwortet *was ist das in AllSpeak ?* — Symbole, Variablen, Kontrollfluss, Module. Stabil, enzyklopädisch.
- **Idiome** beantwortet *wie mache ich X auf die AllSpeak-Art ?* — Muster mit ausgearbeiteten Beispielen und expliziten Anti-Mustern.

Siehe [README.md](../README.md) für die Nutzung dieses Kurses und das Hinzufügen oder Bearbeiten einer Seite.

## Referenz

1. [Struktur](reference/01-structure.md) — die Domänen, das Modell « der Compiler probiert jede Domäne », wie Erweiterungen den Wortschatz erweitern.
2. [Symbole und Layout](reference/02-symbols-and-layout.md) — die vier Satzzeichen ; die Marker für Dokumentationsblöcke ; Einrückung und Namen.
3. [Variablen und Arrays](reference/03-variables-and-arrays.md) — das Cursor-Modell ; Arbeitsvariablen ; `variable` vs typisiert.
4. [Sammlungen](reference/04-collections.md) — Arrays, Wörterbücher, Listen, Eigenschaften ; JS/Python-Abweichung.
5. [Werte und Typen](reference/05-values-and-types.md) — Zahlen, Zeichenketten, Booleans ; automatische Konvertierung.
6. [Bedingungen](reference/06-conditions.md) — Gleichheit, Vergleich, Vorhandensein ; Kombination mit `und` / `oder`.
7. [Arithmetik](reference/07-arithmetic.md) — das Ganzzahl-zuerst-Modell ; das skalierte-Ganzzahl-Muster ; Trigonometrie.
8. [Zeichenketten und Text](reference/08-strings-and-text.md) — `länge von`, Schneiden, `position von`, `ersetze`.
9. [Kontrollfluss](reference/09-control-flow.md) — `wenn`, `solange`, `gosub` mit Parametern, `lege parameter`, `stack`, `stoppe`, `beende`.
10. [Fehler und Wiederherstellung](reference/10-errors-and-recovery.md) — `oder` (Stopp) vs `on failure` (weiter).
11. [Kooperatives Multitasking](reference/11-cooperative-multitasking.md) — `zweige`, `warte`, nie mitten in einer Anweisung unterbrochen.
12. [Module](reference/12-modules.md) — `laufe`, `release parent`, Nachrichtenübermittlung.
13. [Plugins](reference/13-plugins.md) — der Vertrag ; das Leistungsprinzip des gemischten Stapels.
14. [Browser und Webson](reference/14-browser-and-webson.md) — DOM-Typen, `befestige`, der Webson-Layout-Dialekt.
15. [Mehrsprachigkeit](reference/15-multilingual.md) — die Direktive `language` und das Paketmodell.
16. [Dokumentationsblöcke](reference/16-doc-blocks.md) — die Konvention `!!` / `!!!` ; `asdoc-check`.
17. [Entwicklungsbefehle](reference/17-dev-environment.md) — `system`, `download`, `browse` der Python-Laufzeit für Shell, Abruf und Tab-Start.
18. [JSON](reference/18-json.md) — `save` kodiert dict/Liste automatisch ; `ergänze … zur json-Datei` ; `json von` für das Parsen ; der Elternverzeichnis-Vorbehalt.

## Idiome

1. [`cat` und Zeichenkettenaufbau](idioms/01-cat-and-string-building.md) — infix `cat`, Vorlagenmuster, die Falle der gierigen Analyse.
2. [Ereignishandler und Array-Index](idioms/02-event-handlers-and-array-index.md) — ein einziger Handler für ein Array von Elementen.
3. [Schleifenmuster](idioms/03-looping-patterns.md) — `solange` vs labelgesteuerte Schleifen.
4. [Eine Sammlungsform wählen](idioms/04-picking-a-collection-shape.md) — Variablen-Array vs dict vs Liste vs Eigenschaft.
5. [Gleitkommazahlen und skalierte Ganzzahlen](idioms/05-floats-and-scaled-integers.md) — fraktionale Genauigkeit ohne Gleitkomma.
6. [REST und asynchron](idioms/06-rest-and-async.md) — `rest hole`, Fehlerklauseln, Abgabe der Kontrolle während des Wartens.
7. [MQTT pub/sub](idioms/07-mqtt-pubsub.md) — der Verbindungsblock, dict-förmige Nutzdaten, Anfrage/Antwort.
8. [Webson-und-AS-Trennung](idioms/08-webson-and-as-separation.md) — Layout in `.json`, Logik in `.as`.
9. [Ein Modul extrahieren](idioms/09-extracting-a-module.md) — wann und wie ein Skript aufgeteilt wird.
10. [Sprachneutral schreiben](idioms/10-writing-language-neutral.md) — was das Sprachpaket nicht übersetzt.
11. [.as debuggen](idioms/11-debugging-as.md) — `drucke`, `logge`, Tracer, `attrappe`.
12. [Mit KI arbeiten](idioms/12-working-with-ai.md) — der Arbeitsablauf « KI schreibt, Mensch prüft ».
13. [Der Server als Anwendung](idioms/13-server-as-application.md) — `server.as -t edit,<projekt>` ausführen, damit der Server *die* Anwendung ist und die Browser-Tabs seine Oberfläche sind.
