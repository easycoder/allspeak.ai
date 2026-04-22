# Grundrechenarten #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

~ec~ ist für das Web entworfen: um Anwendungen zu bauen, die im Browser Dinge tun. Die Browser-Welt ist in erster Linie visuell geprägt, mit vielen Bildern und Texten, aber ein bisschen Grundrechnen wird immer gebraucht, also schreiben wir ein paar Skripte, die zeigen, was es gibt.

In den meisten Programmiersprachen sieht es aus wie die Algebra aus der Schule, wenn Sie Zahlen addieren möchten:

~pre:Z = X + Y~

aber so würden Sie es im Deutschen weder sagen noch schreiben. Eher würden Sie etwas sagen wie

~pre:addiere X zu Y ergibt Z~

wobei ~code:ergibt~ eine Kurzform für „und lege das Ergebnis in" ist.

Wie es sich trifft, macht ~ec~ es genau so. Hier addieren Sie die Werte X und Y und legen das Ergebnis in eine Variable namens Z.

Die Wörter ~code:Wert~ und ~code:Variable~ haben bestimmte Bedeutungen. Ein ~code:Wert~ ist alles, was Sie messen oder zählen können, zum Beispiel Autos, Cent oder Tage. ~ec~ ist es gleich, was das ist; es weiß nur, dass Sie einen X-Haufen und einen Y-Haufen haben und diese zu einem Z-Haufen zusammenzählen möchten.

Eine ~code:Variable~ ist etwas spezifischer; es ist ein Behälter, in dem etwas aufbewahrt wird. Ihre Geldbörse enthält Geld mit einem bestimmten Wert, also hat auch die Geldbörse diesen Wert. Eine Ein-Euro-Münze dagegen hat zwar einen festen Wert, kann aber nichts anderes enthalten, und kann deshalb keine Variable sein. All das bedeutet lediglich, dass in der obigen Summe X und Y entweder Werte oder Variablen (die Werte enthalten) sein können, Z aber kein einfacher Wert sein kann; es muss eine Variable sein, weil wir etwas (die Summe von X und Y) darin ablegen.

Eine Variante dieser Summe ist, wenn Sie den Wert X zu dem addieren möchten, was schon in Y steht. Die Rechnung ist einfacher:

~pre:addiere X zu Y~

Auch hier kann X ein beliebiger Wert sein, Y muss aber eine Variable sein.

Natürlich ist Arithmetik mehr als nur Addition. Es gibt auch Subtraktion, Multiplikation und Division. So sehen sie alle aus:

~pre:addiere X zu Y          addiere X zu Y ergibt Z
subtrahiere X von Y       subtrahiere X von Y ergibt Z
multipliziere Y mit X     multipliziere Y mit X ergibt Z
dividiere Y durch X       dividiere Y durch X ergibt Z~
Beachten Sie, dass in der linken Spalte Multiplikation und Division umgekehrt zu Addition und Subtraktion funktionieren: Das Ergebnis der Rechnung (Y) ist hier das erste Element, nicht das zweite. Im Gegensatz zu praktisch allen anderen Programmiersprachen folgt ~ec~ der Art, wie es in der natürlichen Sprache ausgedrückt wird, damit es für Anwender intuitiver ist.

Obwohl ich nur X und Y verwendet habe, können Sie auch mit Zahlen rechnen:

~pre:addiere 4 zu X
subtrahiere 3 von 13 ergibt Y~

und so weiter. An diesem Punkt fangen wir an zu programmieren. Kopieren Sie diesen Code in den Editor:

~step~
~copy~

Im Alarm-Befehl sehen Sie das Wort ~code:cat~, das zum „Verketten" (engl. „concatenate") zweier Zeichenketten verwendet wird. Davon abgesehen hoffe ich, dass alles leicht zu verstehen ist, selbst wenn Sie gerade erst mit dem Programmieren anfangen.

Wenn Sie sich zu irgendeinem Zeitpunkt über einen bestimmten Befehl informieren möchten, klicken Sie auf die Schaltfläche oben in diesem Bereich, und Sie werden zum Programmierer-Referenzhandbuch von ~ec~ weitergeleitet. Sie müssen ein Paket auswählen — die meisten Befehle, die wir verwenden, sind entweder in Core oder Browser — und dann Commands, Values oder Conditions wählen. Eine Auswahlliste zeigt alle Schlüsselwörter dieses Abschnitts. Klicken Sie auf die Schaltfläche **Tutorial**, um wieder hierher zurückzukehren, wenn Sie fertig sind.

~next:Zeichenketten verarbeiten~
