# Sprachneutral schreiben

## Problem

AllSpeaks Sprachpakete übersetzen Schlüsselwörter automatisch — dieselbe Skriptstruktur funktioniert in jeder unterstützten Sprache. Aber die Paketübersetzung deckt nicht alles ab. Ein Skript, das englische Annahmen über Strings, Namen oder Konstrukte hart verdrahtet, bringt seinen Übersetzer ins Stolpern (oder bricht unter einem anderen Paket ganz).

## Was das Sprachpaket für dich übernimmt

Der Wortschatz. Wenn du ein Verb schreibst (`drucke`, `setze`, `addiere`), einen Verknüpfer (`zu`, `in`, `von`) oder eine Bedingung (`ist`, `ist kleiner als`), setzt die Sprachebene die passende Oberflächenform für das aktive Paket ein. Dieselbe Form des Quellskripts kompiliert unabhängig von der Sprache zu demselben internen Programm. Siehe [Mehrsprachigkeit](../reference/multilingual.md).

## Was das Paket nicht übersetzt

Vier Bereiche, für die der Autor selbst verantwortlich ist.

### Zeichenkettenliterale

In Backticks eingefasster Text geht unverändert durch:

```as
drucke `Hallo, Welt!`
```

Übersetzen heißt: die Quelle bearbeiten. Damit ein Skript leicht zu lokalisieren ist, sammle benutzersichtbare Strings oben (oder in einer separaten Webson-Ressource), statt sie verstreut inline zu platzieren. Übersetzung ist dann ein einziger Durchgang über einen Abschnitt, nicht über das ganze Skript.

### Variablen- und Labelnamen

Namen wählt der Autor; das Paket fasst sie nicht an. Übliche Praxis: Wähle pro Skript eine Sprache für die Namen und bleibe dabei konsequent. Englische Variablen mit deutschen Schlüsselwörtern zu mischen (oder umgekehrt) ist technisch legal, liest sich aber wie eine halb fertige Übersetzung.

Beim Portieren eines Skripts in eine neue Sprache werden die Variablen üblicherweise mitübersetzt — das Ergebnis liest sich für einen Sprecher der Zielsprache natürlich.

### Konstrukte, die es nicht in jedem Paket gibt

Manche Pakete haben einen reicheren Satz an Synonymen als andere. Wenn du idiomatisches Englisch schreibst, das von einer bestimmten Formulierung abhängt — etwa eine ungewöhnliche `the … of`-Kette —, hat der Übersetzer in der Zielsprache vielleicht keine Eins-zu-eins-Entsprechung. Bevorzuge Konstrukte, die in jedem Paket vorkommen — die in den [Codex](/codex.html)-Tutorials verwendeten sind eine sichere Auswahl.

Ein konkretes Beispiel: `for each` ist im gesprochenen Englisch schwer klar auszudrücken und in vielen anderen Sprachen noch schwerer; deshalb verzichtet der Lehrplan darauf zugunsten von `solange`-Schleifen mit expliziten Indizes. Solche Idiome sind leichter zu übersetzen als Konstrukte, die sich auf eine bestimmte englische Formulierung stützen.

### Datenformate

Zahlen, Daten und ähnliche Formate sind kulturspezifisch. AllSpeak erzwingt kein einheitliches Format. Wenn dein Skript mit `cat` einen Anzeige-String baut, ist das Ergebnis englisch geprägt. Zum Lokalisieren:

- Leite formatempfindliche Ausgabe durch einen Helfer, der einen sprachspezifischen Formatierer befragt, oder
- Baue den lokalisierungssensitiven String am Punkt der Anzeige und halte die interne Speicherung in kanonischer Form (z. B. Ganzzahlen für Geld).

## Testen

Der zuverlässigste Test: Übersetze die `language`-Direktive und ein paar Schlüsselwörter und führe das Skript dann unter einem anderen Paket aus. Überraschungen, die in einer Sprache kompilieren, aber unter einem anderen Sprachpaket scheitern, deuten meist auf ein Schlüsselwort hin, das dieses Paket nicht erfasst hat — oder auf ein String-Literal, dessen Sprachgebundenheit der Autor vergessen hat.

Ein Skript, das unverändert unter mindestens zwei Sprachpaketen läuft (abgesehen von der Direktive), ist ein starkes Signal für Sprachneutralität.

## Muster, die sich lohnen

- **Lagere benutzersichtbare Strings aus.** Lege sie in eine Webson-`.json`-Ressource oder in einen einzigen Abschnitt des Skripts. Übersetzung wird zu einem einzigen Durchgang.
- **Eine Sprache pro Skript für Namen.** Wähle die Hauptsprache des Skripts und bleibe konsistent.
- **Halte dich an dokumentierte Konstrukte.** Die Referenzebene zeigt, was überall verfügbar ist; eigenwillige Formulierungen übersetzen sich womöglich nicht.
- **Formatiere bei der Anzeige, nicht bei der Speicherung.** Halte interne Werte kanonisch; lokalisiere nur an der Grenze.

## Siehe auch

- [Mehrsprachigkeit](../reference/multilingual.md) — wie das Sprachpaket funktioniert.
- [Struktur](../reference/structure.md) — warum Domänencode nie lokalisierte Tokens sieht.
- [Mit KI arbeiten](working-with-ai.md) — KI-Übersetzung ist ein nützlicher erster Durchgang beim Portieren.
