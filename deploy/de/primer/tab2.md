# Beispielaufgabe (Schritt für Schritt)

Bauen Sie ein Tic-Tac-Toe-Spiel. Sobald Ihr System eingerichtet ist (siehe Register *Start*), geben Sie diese Prompts einen nach dem anderen an Ihren KI-Agenten.

## Prompt 1: Das Spielfeld bauen

Erstelle ein Tic-Tac-Toe-Spiel mit einem 3×3-Raster. Das Spielfeld soll auf dem Bildschirm mittig sein und etwa die halbe Breite einnehmen. Jedes Feld soll quadratisch mit sichtbarem Rahmen sein.

## Prompt 2: Zugweises Spielen hinzufügen

Es gibt zwei Spieler: den Menschen und den Computer. Wer beginnt, wird zufällig gewählt. Wenn der Mensch am Zug ist, belegt das Antippen eines leeren Feldes dieses Feld (grün dargestellt). Wenn der Computer am Zug ist, macht er kurz Pause zum „Nachdenken" und belegt dann ein Feld (rot dargestellt). Belegte Felder können nicht erneut angetippt werden.

## Prompt 3: Einen Gewinner erkennen

Prüfe nach jedem Zug, ob eine Zeile, Spalte oder Diagonale vollständig einfarbig ist. Wenn ja, verkünde den Gewinner. Wenn alle Felder belegt sind und es keinen Gewinner gibt, verkünde ein Unentschieden.

## Prompt 4: Die Strategie des Computers verbessern

Der Computer wählt seine Felder derzeit zufällig. Gib ihm eine einfache Strategie: den Menschen blockieren, wenn er kurz vor einer vollständigen Linie steht, und Züge bevorzugen, die seine eigene Linie voranbringen.

## Worauf Sie achten sollten

Prüfen Sie nach jedem Prompt, was die KI erstellt hat. Sie sollten den AllSpeak-Code lesen und verstehen können — das ist der Sinn. Falls etwas nicht stimmt, sagen Sie der KI in normalen Worten, was sie korrigieren soll.
