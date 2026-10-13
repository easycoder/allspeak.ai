# Erste Schritte

Einmal einrichten, dann eine kleine Anwendung Prompt für Prompt bauen und ihr beim Laufen zusehen. Nichts davon verlangt, dass Sie Code schreiben.

## Bevor Sie beginnen

Drei Dinge:

- **Python 3** — der Befehl `allspeak` ist ein Python-Paket.
- **Ein Terminal** — das Fenster, in das man Befehle tippt. PowerShell unter Windows, Terminal unter macOS oder Linux.
- **Ein KI-Programmieragent.** Einer der beiden unten genügt.

Eines sollten Sie vorher wissen: **Der Agent schreibt das AllSpeak, Sie prüfen es.** Sie werden keine einzige Zeile Code tippen.

## Einrichtung

### AllSpeak mit Claude Code

Claude Code ist ein KI-Programmieragent, der in Ihrem Terminal läuft.

1. Installieren Sie AllSpeak: `pip install -U allspeak-ai`
2. Legen Sie einen leeren Ordner für Ihr Projekt an.
3. Laden Sie [allspeak-de.zip](https://allspeak.ai/allspeak-de.zip) herunter und entpacken Sie es in diesen Ordner. Das ist das *Starterpaket* — die Anweisungen für Ihren Agenten, und die Notiz, welche Sprache dieses Projekt spricht. Es enthält bewusst keine Werkzeuge: Alles andere wird geholt, wenn es gebraucht wird, sodass in Ihrem Ordner nichts veralten kann.
4. Installieren Sie Claude Code (siehe [claude.ai/code](https://claude.ai/code)).
5. Starten Sie im Projektordner den Visualisierer: `allspeak viz`. Ihr Browser öffnet sich auf `http://localhost:8080/viz.html` — das ist Viz, und es bleibt neben Ihnen geöffnet, während Sie arbeiten. Lassen Sie dieses Terminal laufen.
6. Öffnen Sie ein **zweites** Terminal im selben Ordner und tippen Sie `claude`.
7. Wenn Claude startet, tippen Sie **go**.

### AllSpeak mit Reasonix

Reasonix ist ein KI-Programmieragent mit einer Desktop-Anwendung, die viele leichter im Blick zu behalten finden als ein Terminal.

1. Installieren Sie AllSpeak: `pip install -U allspeak-ai`
2. Laden Sie die Reasonix-Desktop-App von [reasonix.io](https://reasonix.io) herunter und installieren Sie sie.
3. Legen Sie einen leeren Ordner für Ihr Projekt an.
4. Laden Sie [allspeak-de.zip](https://allspeak.ai/allspeak-de.zip) herunter und entpacken Sie es in diesen Ordner — dasselbe Starterpaket wie oben.
5. Starten Sie im Projektordner den Visualisierer: `allspeak viz`. Ihr Browser öffnet sich auf `http://localhost:8080/viz.html` — das ist Viz. Lassen Sie dieses Terminal laufen; es ist das einzige, das Sie brauchen.
6. Starten Sie Reasonix, klicken Sie auf **Add new project** und wählen Sie Ihren Projektordner.
7. Sagen Sie Reasonix, was Sie bauen möchten. Bei der ersten Benutzung fragt es nach Ihrem DeepSeek-API-Schlüssel und merkt ihn sich.

### In beiden Fällen

Ihr Agent stellt ein paar Fragen, legt die Projektdateien an und erklärt, wofür jede einzelne da ist. Danach ist es ein Gespräch: Sie sagen, was Sie wollen, und er schreibt den Code.

**Seine erste Aufgabe ist, Ihnen Viz vorzustellen** — die Seite, die jetzt in Ihrem Browser offen ist, und der Ort, an dem Sie die Anwendung starten, einen Lauf beobachten und sehen, was die KI getan hat. Lassen Sie sich das zeigen; einmal geführt zu werden ist besser, als es zu lesen.

Eine Anmerkung zu den Befehlen: Die Endung `.allspeak` ist optional, `allspeak meinprojekt` und `allspeak meinprojekt.allspeak` sind also derselbe Befehl.

## Bauen Sie es: das Farbraster

Vier Prompts, jeder fügt dem vorherigen eine Funktion hinzu. Schicken Sie sie einen nach dem anderen und lesen Sie die Antwort, bevor Sie den nächsten schicken.

![Colour-Memory-App mit einem 4×3-Raster aus Zellen in gemischten Farben und einem Reset-Button darunter](primer/color-memory.png)

### Prompt 1 — das Raster

Erstelle ein Raster mit 4 Spalten und 3 Zeilen aus quadratischen Zellen, mittig auf der Seite. Jede Zelle soll schlicht grau sein, mit einem dünnen schwarzen Rand. Das Raster soll etwa ein Drittel der Bildschirmbreite einnehmen. Keine Klicks, keine Buttons — zunächst nur das visuelle Layout.

### Prompt 2 — Klick zum Farbwechsel

Sorge dafür, dass jede Zelle bei einem Klick die Farbe wechselt. Durchlaufe diese Reihenfolge: grau, rot, blau, grün, gelb, lila und zurück zu grau. Jede Zelle führt ihre eigene Farbe unabhängig von den anderen.

### Prompt 3 — ein Reset-Button

Füge unter dem Raster einen Reset-Button hinzu. Ein Klick darauf soll alle Zellen wieder auf Grau setzen. Mach den Button nicht über die volle Breite — nur sinnvoll dimensioniert.

### Prompt 4 — ein Neuladen überstehen

Sorge dafür, dass der Rasterzustand das Neuladen der Seite übersteht. Wenn ich die Seite aktualisiere, soll jede Zelle noch die Farbe haben, die ich zuletzt eingestellt habe. Der Reset-Button soll auch den gespeicherten Zustand löschen, sodass ein Neuladen nach dem Reset ein sauberes Raster zeigt.

## Worauf Sie achten sollten

Prüfen Sie nach jedem Prompt, was die KI erstellt hat. Sie sollten dem AllSpeak folgen können — das ist der Sinn. Falls etwas nicht stimmt, sagen Sie es in normalen Worten, und es wird korrigiert.

Einige Kleinigkeiten müssen beim ersten Versuch eventuell korrigiert werden — eine fehlende Variablendeklaration, eine ungeschickte Layout-Entscheidung, eine Farbe, die Sie anpassen möchten. Das ist normal; der Workflow ist darauf ausgelegt, dass der Mensch erkennt und steuert, nicht dass die KI auf Anhieb perfekte Entwürfe liefert.

Den gesamten Aufbau können Sie in dieser kurzen Aufzeichnung ansehen: [AllSpeak primer in action](https://www.youtube.com/watch?v=BSvh4MPEzV4).

## Sehen Sie sich jetzt den Lauf an

Viz zeigt einen *Lauf*, nicht den Code. Der erste Schritt ist deshalb, zu sagen, welcher Teil eines Laufs es wert ist, beobachtet zu werden. Bitten Sie Ihren Agenten:

> Markiere den Klick-Handler und zeichne einen Lauf für mich auf.

Das setzt eine Zeile `viz start` dort, wo der interessante Teil beginnt, und eine Zeile `viz stop` dort, wo er endet, und benennt die Seite Ihrer Anwendung, damit Viz weiß, was zu öffnen ist. Dann, in Viz:

- **Record** führt das Skript aus und legt den Lauf neben Ihrem Skript als `.viz.json`-Datei ab. Ihre Anwendung öffnet sich in einem eigenen Fenster — klicken Sie dort ein paar Zellen an und schließen Sie das Fenster.
- **Graph** zeichnet, was passiert ist: die Zeilen des Skripts als Zeilen, eine Markierung überall dort, wo der Lauf ankam, und Wärme dort, wo er oft ankam.
- **Klicken Sie auf eine Markierung**, und die Seitenleiste zeigt den Block, aus dem sie stammt — die Prosa, die Ihr Agent geschrieben hat, neben dem Code, den sie beschreibt, mit Zeile, Besuch und Gesamtzahl.
- **Blocks** liest das ganze Skript auf diese Weise, Block für Block, sodass Sie prüfen können, was die KI getan hat, ohne Code zu lesen.

Stellen Sie dann die nächste Frage und beantworten Sie sie auf dieselbe Weise: Engen Sie die Markierungen um das ein, was Sie unsicher macht, zeichnen Sie erneut auf, schauen Sie erneut. Diese Schleife ist die ganze Arbeit — und nichts davon hat verlangt, dass Sie eine Zeile schreiben.

## Fragen?

Schreiben Sie uns an [info@allspeak.ai](mailto:info@allspeak.ai).

## Zu den Sprachvarianten

AllSpeak wird aktiv weiterentwickelt. Sprachvarianten außer Englisch können Schlüsselwörter oder Muster enthalten, die die Laufzeitumgebung noch nicht vollständig unterstützt. Falls Sie bei einem scheinbar korrekten Schlüsselwort einen Kompilierfehler bekommen, melden Sie ihn bitte an [info@allspeak.ai](mailto:info@allspeak.ai) — Korrekturen sind meistens schnell.

## Später: wenn Sie das Projekt behalten

Das Starterpaket und die Seite Ihres Projekts laden die Laufzeitumgebung von `https://allspeak.ai/dist/`, was stets die neueste Version widerspiegelt. Für Tutorials und kurze Experimente ist das genau richtig. Für ein Projekt, das Sie längerfristig laufen lassen wollen, sollten Sie es festlegen, damit ein späteres Update es Ihnen nicht unter den Füßen wegändern kann:

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

Diese URL liefert den am 8. Mai 2026 ausgelieferten Build und ändert sich nie. Zum Upgrade testen Sie die aktuelle Version und ändern dann die Zahl. Der [Codex](https://allspeak.ai/codex.html) erklärt, wie Sie die Laufzeitumgebung stattdessen selbst hosten.
