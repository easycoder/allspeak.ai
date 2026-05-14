# Beispielaufgabe (Schritt für Schritt)

Bauen Sie ein interaktives Farbraster. Sobald Ihr System eingerichtet ist (siehe Register *Start*), geben Sie diese Prompts einen nach dem anderen an Ihren KI-Agenten. Jeder Schritt fügt dem vorherigen eine Funktion hinzu.

![Colour-Memory-App mit einem 4×3-Raster aus Zellen in gemischten Farben und einem Reset-Button darunter](primer/color-memory.png)

Wenn alle vier Schritte funktionieren, sieht die Seite etwa so aus wie oben — ein 4×3-Raster aus Zellen, jede in eigener Farbe, mit einem Reset-Button, der sie alle wieder auf Grau setzt.

## Prompt 1: Fundament — Das Raster bauen

Erstelle ein 3×4-Raster aus quadratischen Zellen, mittig auf der Seite. Jede Zelle soll schlicht grau sein, mit einem dünnen schwarzen Rand. Das Raster soll etwa ein Drittel der Bildschirmbreite einnehmen. Keine Klicks, keine Buttons — zunächst nur das visuelle Layout.

## Prompt 2: Interaktion — Klick zum Durchschalten

Sorge dafür, dass jede Zelle bei einem Klick die Farbe wechselt. Durchlaufe diese Reihenfolge: grau, rot, blau, grün, gelb, lila und zurück zu grau. Jede Zelle führt ihre eigene Farbe unabhängig von den anderen.

## Prompt 3: Steuerung — Reset

Füge unter dem Raster einen Reset-Button hinzu. Ein Klick darauf soll alle Zellen wieder auf Grau setzen. Mach den Button nicht über die volle Breite — nur sinnvoll dimensioniert.

## Prompt 4: Persistenz — Seitenneuladen überstehen

Sorge dafür, dass der Rasterzustand das Neuladen der Seite übersteht. Wenn ich die Seite aktualisiere, soll jede Zelle noch die Farbe haben, die ich zuletzt eingestellt habe. Der Reset-Button soll auch den gespeicherten Zustand löschen, sodass ein Neuladen nach dem Reset ein sauberes Raster zeigt.

## Worauf Sie achten sollten

Prüfen Sie nach jedem Prompt, was die KI erstellt hat. Sie sollten den AllSpeak-Code lesen und verstehen können — das ist der Sinn. Falls etwas nicht stimmt, sagen Sie der KI in normalen Worten, was sie korrigieren soll.

Einige Kleinigkeiten müssen beim ersten Versuch eventuell korrigiert werden — eine fehlende Variablendeklaration, eine ungeschickte Layout-Entscheidung, eine Farbe, die Sie anpassen möchten. Das ist normal; der Workflow ist darauf ausgelegt, dass der Mensch erkennt und steuert, nicht dass die KI auf Anhieb perfekte Entwürfe liefert.
