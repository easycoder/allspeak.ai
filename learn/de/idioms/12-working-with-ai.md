# Mit KI arbeiten

## Problem

KI-Werkzeuge sind beim Schreiben von AllSpeak nützlich — schnelle Entwürfe, Idiom-Vorschläge, Übersetzung. Auch bei Details liegen sie zuverlässig daneben: AllSpeaks Wortschatz stimmt nicht immer mit den Trainingsdaten der KI überein, also erzeugt die KI selbstbewusst Syntax, die plausibel aussieht, aber nicht kompiliert (oder schlimmer: zum Falschen kompiliert). Der Sinn dieses Idioms ist, die Stärken der KI nutzbar zu machen, ohne in ihre Fehlermodi zu tappen.

## Die Grundschleife

Die KI entwirft, der Mensch prüft. Iterieren.

1. **Weise die KI in die Aufgabe ein.** Zeige ihr die relevanten Referenz- und Idiom-Dateien — sie stützt sich eher auf diese als auf ihre Trainingsdaten.
2. **Die KI erzeugt einen Entwurf.** Behandle ihn als ersten Durchgang, nicht als endgültige Antwort.
3. **Lies ihn sorgfältig.** Achte auf die unten aufgelisteten häufigen Fehler.
4. **Führe ihn aus.** Die Kompilierung fängt viele Fehler; Verhaltensfehler brauchen ein `drucke` oder `logge` (siehe [.as debuggen](debugging-as.md)).
5. **Iteriere.** Korrigiere entweder das Falsche direkt oder gib der KI das Symptom und lass sie neu entwerfen.

Die Schleife ist nicht „Die KI macht alles, der Mensch stempelt ab." Es ist **die KI tippt, der Mensch macht die Ingenieursarbeit.**

## Was „lesbar" verlangt

Damit der Prüfschritt funktioniert, muss die KI-Ausgabe lesbar genug sein, dass ein Prüfer das Falsche erkennt, ohne die Analyse von Grund auf neu laufen zu lassen. Das heißt:

- **Dokumentationsblöcke.** Jeder Abschnitt in `!! …`-Prosa, die erklärt, was er tut und warum. Das Schreiben des Dokuments zwingt die KI, ihre Absicht zu benennen, was Lücken zwischen dem, was die Prosa sagt, und dem, was der Code tut, sichtbar macht. Siehe [Dokumentationsblöcke](../reference/doc-blocks.md).
- **Benannte Variablen.** Nicht `X` und `Y` — `Counter`, `ButtonClicked`, `IsLoggedIn`. Der Prüfer muss keine Typen im Kopf behalten.
- **Inline-Kommentare, wo das *Warum* nicht offensichtlich ist.** Ein `!`-Kommentar, der eine Eigenheit markiert. Formuliere den Code nicht neu; markiere die Überraschung.
- **Ein Konzept pro Abschnitt.** Lange Unterroutinen mit gemischten Zwecken sind nicht prüfbar. Wenn ein Abschnitt zwei Absätze Dokumentationsprosa braucht, sind es zwei Abschnitte.

## Häufige KI-Fehler bei AllSpeak

Dinge, die KI-Werkzeuge zuverlässig falsch machen:

- **Die Platzierung von `cat`.** Die KI setzt `cat` vor den ersten Wert oder lässt es zwischen Werten weg. AllSpeaks `cat` ist nur infix — siehe [cat und Zeichenkettenaufbau](cat-and-string-building.md).
- **Imperative Operatoren.** `Counter += 1` oder `Counter = Counter + 1`. AllSpeak verwendet `addiere 1 zu Counter`.
- **`for`-Schleifen.** AllSpeak hat kein `for` und kein `for each`; Iteration läuft über `solange` oder Labels. Siehe [Schleifenmuster](looping-patterns.md).
- **JSON-artige Array-Indizierung (`lege in element N`).** AllSpeak nutzt ein Cursor-Modell: `indexiere X zu N` wählt den Slot aus, dann schreibt `lege V in X` hinein. `lege V in element N von X` ist kein gültiges `lege`-Ziel. `element N von X` liest aus einem JSON-Array im aktuellen Slot — ein völlig getrennter Mechanismus. Die KI verwechselt das oft und schreibt `lege V in element N von Colors` (falsch) statt `indexiere Colors zu N; lege V in Colors` (richtig). Siehe [Variablen und Arrays](../reference/03-variables-and-arrays.md).
- **Gleitkomma-Arithmetik.** `multipliziere 3.14 mit 2`. `3.14` ist eine Zeichenkette, keine Zahl. Siehe [Gleitkommazahlen und skalierte Ganzzahlen](floats-and-scaled-integers.md).
- **Klammern zum Gruppieren.** `(A + B) * C`. Es gibt keine Gruppierungssyntax; nutze eine temporäre Variable.
- **`elif` und `case`/`switch`.** AllSpeak hat beides nicht. `wenn … sonst wenn … sonst …` ist in Ordnung (es ist nur `sonst`, gefolgt von einem weiteren `wenn`), aber die Abkürzung `elif` gibt es nicht, und es gibt keine `case`-/`switch`-Anweisung — nutze eine Kette aus `wenn`/`sonst wenn` oder einen Dispatch über Labels.
- **Verwechslung von `oder` und `on failure`.** Unterschiedliches Verhalten nach der Klausel — `oder` stoppt, `on failure` fährt fort. Siehe [Fehler und Wiederherstellung](../reference/errors-and-recovery.md).
- **Webson-`#`-Arrays mit Inline-Objekten.** Websons `#`-Array erwartet `$Name`-Stringreferenzen, keine rohen JSON-Objekte. `"#": [{ "#element": "div", ... }]` scheitert zur Laufzeit mit `build: [object Object] has no properties`. Definiere benannte `$Block`-Einträge und referenziere sie in `#`: `"#": ["$Block"]` mit `"$Block": { "#element": "div", ... }` in der Nähe definiert. Siehe [Browser und Webson](../reference/14-browser-and-webson.md).
- **Erfundene Vorinitialisierung mit `setze die eigenschaften`.** Eigenschaften auf Array-Elementen initialisieren sich beim ersten Schreiben automatisch — es gibt keinen Vorinitialisierungsbefehl. `setze die eigenschaften von Cell zu feld für \`color\`` ist kein gültiges AllSpeak. Der richtige Ansatz ist `setze eigenschaft \`color\` von Cell zu 0` innerhalb der Erstellungsschleife; das JSON-Wörterbuch pro Element wird automatisch erzeugt. Siehe [Browser und Webson](../reference/14-browser-and-webson.md).
- **`get` als Zuweisungs-Schlüsselwort verwendet.** `get property \`name\` of X into V` ist kein gültiges AllSpeak. AllSpeak hat kein `get`-Schlüsselwort für Zuweisungen — das universelle Lesemuster ist `lege <quelle> in <ziel>`, auch bei Eigenschaften: `lege eigenschaft \`name\` von X in V`. Das ist ein häufiger KI-Hybrid aus `get` (aus JavaScript/Python) und `lege … in …` (aus AllSpeak). Siehe [Browser und Webson](../reference/14-browser-and-webson.md).
- **Erfundene Schlüsselwörter.** `return X`, `break`, `continue`, `try`/`catch`, `await`, `get X into Y`. Keines davon existiert in AllSpeak.

Die Fehler bei der `cat`-Platzierung, `for`/`for each`, JSON-artiger Array-Indizierung, `#`-Arrays mit Inline-Objekten und erfundener Eigenschafts-Vorinitialisierung sind die häufigsten; die anderen kommen vereinzelt vor.

## Erst erklären lassen, dann neu schreiben lassen

Wenn die KI-Ausgabe falsch ist, ist die Versuchung groß zu sagen: „Das ist falsch, versuch es noch einmal." Das würfelt neu. Ein besserer erster Schritt:

> „Erkläre mir Zeile für Zeile, was dieser Code tut."

Die Erklärung der KI stimmt entweder mit der Realität überein (dann kannst du genau benennen, wo du anderer Meinung bist) oder nicht (dann hat sie dir gerade gesagt, was sie tatsächlich vom Code erwartet hat). In beiden Fällen hast du jetzt mehr Informationen als bei einem blinden Neuversuch.

Sobald du weißt, was die KI vorhatte, kannst du es entweder selbst korrigieren oder ihr eine präzise Anweisung geben:

> „Ersetze die `for each`-Schleife durch eine `solange`-Schleife mit einem Zähler; AllSpeak hat kein `for each`."

## Der Dokumentationsblock als Prüfpunkt

Wenn die KI einen Abschnitt schreibt, bitte sie, gleichzeitig einen Dokumentationsblock zu ergänzen. Die Prosa zwingt sie, ihre Absicht in einfacher Sprache zu benennen, wo Widersprüche zum Code ins Auge springen. Der `@hash`-Mechanismus verriegelt dann die Paarung — wenn eine spätere Bearbeitung den Code ändert, ohne die Prosa zu überarbeiten, meldet der Analysator das. Siehe [Dokumentationsblöcke](../reference/doc-blocks.md).

## Anti-Muster: Der KI bei Syntaxdetails vertrauen

AllSpeaks Wortschatz stimmt nicht vollständig mit dem überein, womit die KI trainiert wurde. Selbst wenn die KI selbstbewusst klingt: die konkreten Schlüsselwörter, die Platzierung von `cat`, die Behandlung von Fehlerklauseln sind Details, die du gegen die Referenz prüfen musst. Der Kurs existiert auch deshalb, damit man die KI darauf verweisen kann, statt sie raten zu lassen.

## Anti-Muster: erst Spezifikation, dann Code, dann Dokumentationsblock

Es ist verlockend, eine detaillierte Spezifikation zu schreiben, sie der KI zu geben, sie Code produzieren zu lassen und dann einen Dokumentationsblock zu ergänzen, der den Code beschreibt. Die Reihenfolge verfehlt den Sinn von Dokumentationsblöcken. Die Prosa soll die Absicht *während des Schreibens des Codes* einfangen, damit Abweichungen zwischen Absicht und Ergebnis sichtbar werden. Wenn der Dokumentationsblock aus dem entstandenen Code geschrieben wird, wiederholt er nur, was die KI produziert hat — und verliert seinen Wert als Kontrolle.

Die richtige Reihenfolge: Mensch und KI einigen sich auf die Absicht (mündlich oder in einem Briefing), die KI schreibt Code und Dokumentationsblock gemeinsam, der Mensch prüft beides auf Übereinstimmung.

## Siehe auch

- [Dokumentationsblöcke](../reference/doc-blocks.md) — die Konvention, beim Dokumentieren zu prüfen.
- [.as debuggen](debugging-as.md) — `drucke` / `logge` zum Verifizieren des Verhaltens.
- [Sprachneutral schreiben](writing-language-neutral.md) — die KI als Erstübersetzer.
- [cat und Zeichenkettenaufbau](cat-and-string-building.md) — der mit Abstand häufigste KI-Fehler.
