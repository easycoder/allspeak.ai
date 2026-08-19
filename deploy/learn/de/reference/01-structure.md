# Struktur

AllSpeak hat zwei Hälften: eine kleine, sprachneutrale Laufzeit und einen Stapel von **Domänenmodulen**, die den eigentlichen Wortschatz beisteuern. Die Laufzeit weiß nichts über bestimmte Schlüsselwörter. Domänen sind der Grund, warum `drucke`, `bei klick`, `rest hole` und `mqtt publish` in derselben Sprache leben können, ohne dass die Engine eines davon als eingebauten Befehl mitführt.

## Domänen

Eine Domäne ist ein Modul, das Folgendes besitzt:

- **Einen Wortschatz** — die Schlüsselwörter und Befehlformen, die es kompilieren kann.
- **Einen Satz von Variablentypen** — z. B. kennt die Browser-Domäne `button`, `div`, `input`; die REST-Domäne kennt `request`.
- **Einen Satz von Bedingungen und Werten** — domänenspezifische Tests und Ausdrücke.
- **Einen Compiler-Stub für jedes Konstrukt** — Code, der die Syntax erkennt und sie in eine ausführbare Form überführt.
- **Einen Laufzeit-Executor für jedes Konstrukt** — was zu tun ist, wenn diese Form ausgeführt wird.

Domänen sind unabhängig. Eine neue hinzuzufügen — ob gebündelt oder als Plugin — führt neue Schlüsselwörter ein, ohne eine bestehende Domäne zu berühren.

## Die Standard-Domänen

Im JS-Build gebündelt:

| Domäne | Liefert |
|--------|----------|
| Core | Kontrollfluss, Variablen, Arithmetik, Zeichenketten, Dateien |
| Browser | DOM-Typen, Ereignisse, Styling, Layout |
| JSON | JSON-Parsen, -Aufbau, -Traversierung |
| Webson | Den Layout-Bindungsmechanismus zwischen Webson-Markup und AllSpeak-Variablen |
| REST | HTTP-Anfragen, Antwortverarbeitung |
| MQTT | Pub/Sub-Nachrichtenübermittlung |

Der Python-Build hat einen ähnlichen Satz, mit einigen Abweichungen bei Sammlungen und I/O.

`MarkdownRenderer` ist ebenfalls gebündelt, aber ein Dienstprogramm, das von Core aufgerufen wird, und keine eigene Domäne — es hat keinen Wortschatz.

## Wie die Kompilierung funktioniert

Der Compiler liest den Quelltext Anweisung für Anweisung. Für jede Anweisung fragt er jede geladene Domäne der Reihe nach: *kannst du das übernehmen?* Die erste Domäne, die das Konstrukt erkennt, erzeugt einen kompilierten Datensatz — eine kleine Datenstruktur, die die Operation und ihre Operanden erfasst — und dieser Datensatz wird an das **Programm-Array** angehängt, eine lineare Folge kompilierter Anweisungen.

Wenn keine Domäne die Anweisung beansprucht, ist das ein Kompilierfehler.

```
Quellzeile  →  domain.compile()  →  Programm-Array-Eintrag
```

Die Reihenfolge, in der die Domänen versucht werden, ist für den Skriptautor selten von Bedeutung, weil jede Domäne einen eigenen Wortschatz besitzt.

## Wie die Ausführung funktioniert

Die Laufzeit — `Run.js` im JS-Build — durchläuft das Programm-Array und leitet jeden Eintrag an den Executor seiner Besitzer-Domäne weiter. Der Executor liest Operanden, manipuliert Variablen, wertet Bedingungen aus und kann abgeben (`stoppe`, `warte`) oder die Kontrolle übertragen (`gehe zu`, `gosub`, `zweige` in einen neuen Thread).

Die Laufzeit selbst ist klein und sprachagnostisch. Sie weiß nicht, was `bei klick` bedeutet; sie weiß nur, wie sie den Domänen-Handler aufruft, der zur Kompilierzeit gebunden wurde.

## Die Mehrsprachigkeits-Ebene

Eine zweite Ebene sitzt zwischen dem Quellskript und den Domänen-Compilern: das **Sprachpaket**. Quell-Tokens in jeder unterstützten Sprache (Englisch, Französisch, Italienisch, Deutsch, …) werden über das Sprachpaket in eine kanonische Form aufgelöst und dann an die Domänen übergeben. Domänen sehen nie die lokalisierten Tokens — sie arbeiten vollständig im kanonischen Wortschatz.

Das bedeutet, dass ein französisches `.as`-Skript und ein englisches `.as`-Skript zum selben Programm-Array kompilieren und auf derselben Engine laufen. Siehe [Mehrsprachigkeit](multilingual.md) für die Funktionsweise der Sprachpakete und wie die `language`-Direktive eines auswählt.

## Plugins

Ein Plugin ist eine Domäne, die getrennt von der gebündelten Laufzeit ausgeliefert wird. Der Vertrag ist derselbe wie für gebündelte Domänen — Wortschatz, Typen, Compiler, Executoren bereitstellen — und der Loader behandelt es identisch. Die MQTT-Domäne begann als Plugin und wurde später gebündelt; Google Maps ist ein aktuelles externes Plugin.

Plugins sind angemessen, wenn ein Bestand an spezialisierter Funktionalität (Grafik, Hardware-Integration, APIs Dritter) groß genug ist, um einen eigenen Wortschatz zu verdienen, aber nicht zentral genug, um in das Standardprodukt zu gehören. Siehe [Plugins](plugins.md).

## Begleittools

Einige Teile von AllSpeak sind wesentlich, sind aber keine Sprachfeatures. Das bekannteste ist der **Webson-Renderer** — die Komponente, die Webson-Markup (einen JSON-Dialekt zur Beschreibung von HTML/CSS) in DOM umwandelt. Die Webson-Domäne stellt die `befestige`-Bindung bereit, mit der AllSpeak-Skripte in gerenderte Elemente hineinreichen; der Renderer ist das, was diese Elemente tatsächlich erzeugt. Siehe [Browser und Webson](browser-and-webson.md).

## Warum die Struktur so aussieht

Aus dem Domänenmodell ergeben sich vier Konsequenzen:

1. **Erweiterbarkeit ohne Engine-Änderungen.** Eine neue Domäne fügt Wortschatz hinzu, ohne den Code irgendjemandes anderen zu berühren.
2. **Parallele Evolution.** Domänen können unabhängig überarbeitet werden — die MQTT-Domäne kümmert sich nicht darum, was die Browser-Domäne tut.
3. **Sprachneutralität.** Weil Domänen mit kanonischen Tokens arbeiten, dient derselbe Domänencode jeder menschlichen Sprache, die die Engine unterstützt.
4. **Leistung durch native Ausstiegsluken.** Heiße Pfade können ein in JS oder Python geschriebenes Plugin sein, das mit voller nativer Geschwindigkeit läuft, während der Großteil der Anwendung in lesbarem AllSpeak bleibt. Das Ergebnis nähert sich der Leistung eines vollständig nativen Builds mit deutlich besserer Lesbarkeit. Siehe [Plugins](plugins.md).

## Siehe auch

- [Symbole und Layout](symbols-and-layout.md) — die lexikalische Oberfläche, die Domänen nie direkt sehen.
- [Variablen und Arrays](variables-and-arrays.md) — Variablentypen sind domäneneigen.
- [Mehrsprachigkeit](multilingual.md) — das Sprachpaket und die `language`-Direktive.
- [Plugins](plugins.md) — externe Domänen.
