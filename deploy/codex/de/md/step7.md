# Einfache Animation #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Dies ist ein weiteres Werkzeug im Werkzeugkasten des Programmierers. Obwohl man es leicht übertreiben kann, erweckt das richtige Maß an Bewegung eine Webseite zum Leben und lenkt die Aufmerksamkeit des Nutzers auf die wichtigsten Stellen.

Dieses Beispiel zeichnet 3 farbige Kreise und schaltet sie in rascher Folge ein und aus. Ich habe dieses Beispiel gewählt, um einige nützliche Programmiertechniken aufzuzeigen und etwas mehr CSS einzuführen.

Ab diesem Punkt werden manche Beispiele ziemlich lang, deshalb geben wir sie hier nicht vollständig wieder. Klicken Sie stattdessen auf die Schaltfläche unten, um das Beispiel in den Editor zu laden:

~copy~

Wenn Sie auf mehreren verschiedenen Objekten ähnliche Dinge tun, wird Ihr Code schnell repetitiv. Wiederholung ist schlecht, denn wenn Sie ein zentrales Merkmal ändern müssen, müssen Sie es an allen Stellen ändern, an denen es vorkommt. Und natürlich gilt: je mehr Code es gibt, desto mehr Stellen gibt es, an denen sich Fehler (Bugs) durch simple Tippfehler einschleichen können.

Eine gute Möglichkeit, das zu vermeiden, ist der Einsatz von Feldern (Arrays). Ein Feld ist eine Variable, die mehrere Werte enthält. Ähnlich einem Postfachsystem, bei dem die Fächer zwar alle gleich sind, aber unterschiedliche Inhalte haben.

In den meisten Programmiersprachen verwenden Felder eckige Klammern, um anzuzeigen, was vor sich geht. Um also auf das dritte Element der Feldvariablen ~code:data~ zuzugreifen, würden Sie sehen:

~code:data[3]~

~ec~ mag keine Symbole und verwendet so wenige wie möglich, um möglichst nah an der natürlichen Sprache zu bleiben. Wir hätten das ersetzen können durch

~code:das dritte Element von Data~

aber das ist ziemlich umständlich, also haben wir einen saubereren Weg gewählt. In ~ec~ sind alle Variablen Felder, aber die meisten haben nur ein einziges Element. Sie haben außerdem einen internen Wert, der auf das aktuelle Element zeigt. Wenn es nur eines gibt, enthält der Zeiger null. (In der Informatik ist das erste Element von allem 0, nicht 1). Sie können beliebig viele Elemente für ein Feld anfordern, und der interne Zeiger — der _Index_ genannt wird — reicht von 0 bis zu 1 weniger als die Anzahl der Elemente im Feld.

In diesem Skript habe ich einige Kommentarzeilen hinzugefügt, damit Sie besser sehen, wo was passiert. Sie haben keinen Einfluss auf das Programm.

In Zeile 11 fordern wir 3 Elemente für das Feld ~code:Button~ an. Diese werden mit den Indizes 0, 1 und 2 angesprochen. Dann folgt eine Schleife, die sich 3-mal wiederholt und dabei den Zähler ~code:N~ jedes Mal um eins erhöht. Wir „indizieren" den Knopf auf den Wert von ~code:N~, damit das Feld jedes Element nacheinander bereitstellt, und wir erledigen alle Dinge, die für alle Knöpfe gleich sind. Das sind:

- Die Breite und die Höhe.
- Ein Rand auf jeder Seite, der sie voneinander trennt.
- Der Rahmenradius. Knöpfe sind standardmäßig rechteckig; das gibt ihnen abgerundete Ecken. Mit dem Wert 50% machen wir den Knopf zu einem Kreis oder einer Ellipse, je nachdem, ob Breite und Höhe gleich sind oder nicht.
Indem wir den display-Wert auf ~code:inline-block~ setzen, halten wir alle Knöpfe auf einer einzigen Zeile. (Sie haben recht; das ist überhaupt nicht offensichtlich, oder?)

Die Knöpfe sind anfangs unsichtbar (belegen aber trotzdem Platz).

Nun müssen wir die Hintergrundfarbe festlegen, die für jeden Knopf anders ist; deshalb testen wir den Wert von ~code:N~, um zu sehen, welche Farbe zu verwenden ist. CSS bietet 140 benannte Farben, und Sie können zusätzlich Kombinationen aus Rot, Grün, Blau und Transparenz verwenden, sodass sich insgesamt 4.294.967.296 unterschiedliche Farben ergeben, aus denen Sie wählen können.

Schließlich beginnt in Zeile 29 die eigentliche Animation. Wir haben eine Schleife innerhalb einer Schleife; die äußere läuft unendlich, während die innere die Knöpfe durchzählt, jedes Mal den Index des Feldes ~code:Button~ setzt und den Knopf dann für kurze Zeit sichtbar macht, bevor er wieder unsichtbar wird. Beachten Sie, wie ~ec~ 2 verschiedene Wege hat, Stile zu setzen; der eine bearbeitet nur einen einzelnen Stil, während der andere mehrere auf einmal setzt und alles andere überschreibt, was zuvor gesetzt war.

Das Skript braucht am Ende keinen ~code:stoppe~-Befehl, weil es ihn nie erreichen wird.

~next:Ein springendes Rechteck~
