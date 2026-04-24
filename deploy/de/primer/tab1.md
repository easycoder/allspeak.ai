# Programmieren ohne zu Programmieren

Sie haben vermutlich schon von *Vibe Coding* gehört — Sie sagen einer KI, was Sie haben möchten, und sie schreibt die Software. Das klingt nach Magie, und manchmal ist es das auch. Aber es gibt einen Haken: Der erzeugte Code ist in Sprachen wie JavaScript oder Python, und wenn Sie diese Sprachen nicht bereits kennen, haben Sie keine Möglichkeit zu beurteilen, ob die KI gute Arbeit geleistet hat. Sie fliegen blind, und wenn etwas bricht — und das wird es — sitzen Sie fest.

Am anderen Ende bedeutet klassische Programmierung Monate des Lernens, bevor Sie etwas Brauchbares bauen. Die meisten Menschen haben diese Zeit nicht.

AllSpeak steht dazwischen. Es ist eine Skriptsprache, die sich wie Deutsch (oder Englisch oder jede andere Sprache) liest. Wenn die KI Code für Sie schreibt, können Sie also nachvollziehen, was sie tut. Sie behalten die Kontrolle, ohne einen Informatikabschluss zu brauchen.

## Wie sieht das aus?

Hier ist ein echter Ausschnitt:

```
    language deutsch

    variable Gruß
    lege `Hallo!` in Gruß
    logge Gruß
```

Keine Klammern, keine Semikolons, kein Rätselraten. Wenn Sie einen Satz lesen können, können Sie AllSpeak lesen.

## Kein Spielzeug

AllSpeak baut echte Software. Webanwendungen mit interaktiven Seiten und gestaltetem Layout. Kommandozeilenwerkzeuge, die mit APIs sprechen, Daten verarbeiten und Dateien verwalten. Mehrseitige Anwendungen mit Navigation, Formularen und Benutzereingabe. Live-Verbindungen über REST und MQTT. AllSpeak läuft in jedem Browser (die JavaScript-Version) oder vom Terminal aus (die Python-Version) — oder beides gemeinsam.

Das Geheimnis ist, dass es der KI egal ist, in welcher Sprache sie schreibt. Geben Sie ihr eine leistungsfähige Hochsprache, und sie liefert denselben Funktionsumfang wie in JavaScript — aber in einer Form, die Sie tatsächlich lesen, prüfen und anpassen können.

## Wie Sie starten

Der schnellste Weg ist **AllSpeak + Claude Code**. Claude Code ist ein KI-Programmieragent, der in Ihrem Terminal läuft. Zusammen mit unserem Starterpaket richtet er ein funktionierendes Projekt in weniger als fünf Minuten für Sie ein — einschließlich einer Erklärung jeder erzeugten Datei.

So gehen Sie vor:

1. Legen Sie einen leeren Ordner für Ihr Projekt an.
2. Laden Sie [allspeak-de.zip](https://allspeak.ai/allspeak-de.zip) herunter und entpacken Sie es in diesen Ordner.
3. Installieren Sie AllSpeak: `pip install -U allspeak-ai`
4. Installieren Sie Claude Code (siehe [claude.ai/code](https://claude.ai/code)).
5. Öffnen Sie ein Terminal in diesem Ordner und tippen Sie `claude`.
6. Wenn Claude startet, tippen Sie **go**.

Claude wird Ihnen ein paar Fragen stellen, die Projektdateien anlegen und erklären, wie alles zusammenpasst. Danach müssen Sie ihm nur noch sagen, was Sie bauen möchten.

## Mehr erfahren

- **Register *Beispiel*** — ein geführter Schritt-für-Schritt-Aufbau, der den Arbeitsablauf zeigt.
- **Register *KI-Handbuch*** — die vollständige Argumentation für strukturiertes KI-Entwickeln gegenüber Vibe Coding.
- **[Codex](https://allspeak.ai/codex.html)** — ein interaktives Tutorial, Referenz und Spielwiese für die AllSpeak-Sprache.

## Zu den Sprachvarianten

AllSpeak wird aktiv weiterentwickelt. Sprachvarianten außer Englisch können Schlüsselwörter oder Muster enthalten, die die Laufzeitumgebung noch nicht vollständig unterstützt. Falls Sie bei einem scheinbar korrekten Schlüsselwort einen Kompilierfehler bekommen, melden Sie ihn bitte an [info@allspeak.ai](mailto:info@allspeak.ai) — Korrekturen sind meistens schnell.

## Fragen?

Schreiben Sie uns an [info@allspeak.ai](mailto:info@allspeak.ai).
