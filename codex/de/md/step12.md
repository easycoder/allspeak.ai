# TicTacToe #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Dieser Tutorial-Schritt ist etwas länger. Es geht um das allgegenwärtige Kinderspiel TicTacToe (in Deutschland auch als „Drei gewinnt" bekannt). Es ist eines der einfachsten Spiele, sowohl zu spielen als auch zu programmieren. Ich entdeckte dasselbe Spiel als erstes Beispiel in einem offiziellen Tutorial für das JavaScript-Framework „React" und war erstaunt, wie komplex es wirkte. Konnte man es nicht einfacher programmieren? Also habe ich es mit ~ec~ neu geschrieben, und das ist das Ergebnis. Das Aussehen wird keine Preise gewinnen; es ist im Grunde dasselbe wie in der React-Version. In beiden Fällen liegt der gesamte Schwerpunkt auf dem Code, aber React ist eine Komponentenarchitektur, die alles auf einer Menge von Objekten aufbaut, die die 9 Felder verwalten und zeichnen, während sich diese ~ec~-Version mehr auf den Spielablauf konzentriert und die Visualisierungskomponenten in den Hintergrund rückt.

~copy~

Das Skript beginnt mit den üblichen Deklarationen, einschließlich der Variablen ~code:Cell~ und ~code:Model~. Die eine ist das tatsächliche Feld, das auf dem Bildschirm gezeichnet wird; die andere sind die Daten, die darstellen, ob das Feld leer ist oder ein O oder X enthält. Nach den Variablendeklarationen erhalten diese beiden Variablen jeweils 9 Elemente; eines für jedes Feld des TicTacToe-Bretts.

Das Auffälligste bei der Initialisierung ist das Einrichten einer Tabelle der Gewinnkombinationen. Wir nummerieren die Felder von 0 bis 8, wobei 0 oben links und 8 unten rechts liegt, und zwar zeilenweise. Die Gewinnkombinationen sind die drei Zeilen, die drei Spalten und die zwei Diagonalen; insgesamt 8 Kombinationen. Diese sind in der Tabelle aufgeführt.

Nun richten wir das Brett ein. Oben gibt es ein Nachrichtenfeld, dann das eigentliche Brett, das wir einrichten, indem wir die Felder eines nach dem anderen durchgehen. Sie sind alle im Grunde identisch, daher gilt derselbe Code für jedes einzelne. Das Einzige, was besonders ist, ist, alle 3 Felder eine neue Zeile zu beginnen. Dies geschieht mit der ~code:modulo~-Berechnung in Zeile 41, die ~code:Index~ durch 3 teilt und uns den Rest liefert. Jedes Mal, wenn der Rest null ist (bei den Feldern 0, 3 und 6), beginnen wir eine neue Zeile. Dann fügen wir jedes neue Feld der aktuellen Zeile hinzu. Wir müssen keine Positionsinformationen für die Felder angeben, da jedes seinen Platz natürlich neben dem vorherigen einnimmt; so funktioniert HTML.

Nun können wir einen „Callback" einrichten, der erkennt, wenn eines der Felder angeklickt wird. Wie im vorherigen Beispiel brauchen wir nur einen davon, da sich alle Felder im selben Array befinden. Es gibt nichts, was den Benutzer daran hindert, nach Ende des Spiels zu klicken, daher erlauben wir insgesamt nur 9 Klicks, und entsprechend: Wenn das Spiel bereits gewonnen wurde, unternehmen wir ebenfalls nichts.

Nun ermitteln wir den Index des angeklickten Feldes. Wenn ~code:Model~ anzeigt, dass dieses Feld bereits angeklickt wurde, tun wir nichts.

Wenn der Spieler „X" an der Reihe ist, setzen wir ~code:Cell~ auf 'X' und legen '1' in das entsprechende Element von ~code:Model~. Wenn der Spieler „O" an der Reihe ist, legen wir 'O' in ~code:Cell~ und '-1' in ~code:Model~. Dann rufen wir die Subroutine auf, die prüft, ob es einen Gewinner gibt. (Für Anfänger: Eine Subroutine ist ein Stück Code, das Sie von beliebiger Stelle in Ihrem Programm aufrufen können, um eine bestimmte Aufgabe auszuführen. Wenn sie endet, fährt Ihr Programm mit der Zeile nach derjenigen fort, die die Subroutine aufgerufen hat.)

Die Subroutine ~code:CheckWinner~ sieht kompliziert aus, ist aber tatsächlich recht einfach. Sie geht die 8 Gewinnkombinationen nacheinander durch. Jede besteht aus 3 Feldern, die entweder 0, 1 oder -1 enthalten. Wenn wir die Werte der 3 Felder addieren, und das Ergebnis entweder 3 oder -3 ist, dann haben wir einen Gewinner. Wenn wir aus der Subroutine zurückkommen, prüfen wir, ob ein Gewinner gefunden wurde, und zeigen in diesem Fall eine Nachricht an.

Und das ist im Großen und Ganzen alles. Sie sollten erkennen können, was vor sich geht, aber falls etwas unklar ist, versuchen Sie, den Tracer zu verwenden (siehe einige Schritte zuvor) und lassen Sie sich die Werte der Schlüsselvariablen anzeigen.

~next:Listen verwalten~
