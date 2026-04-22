# Der Tracer #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Der schwierigste Teil beim Programmieren ist herauszufinden, warum Dinge nicht wie erwartet funktionieren, und für viele von uns ist das die meiste Zeit der Fall. Um dabei zu helfen, haben Entwicklungsumgebungen meist eine Funktion, mit der man ein laufendes Programm anhalten, seine Variablen untersuchen und die Anweisungen eine nach der anderen durchgehen kann. Ihr Browser verfügt über einen sehr guten Debugger, aber er zeigt Ihnen nur, was innerhalb der ~ec~-Engine geschieht, nicht, was Ihr Skript tut. Deshalb haben wir eine Funktion hinzugefügt, die diese Dinge erledigt. Sie ist etwas einfach gehalten, aber es gibt Situationen, in denen sie enorm helfen kann.

Der ~ec~-Tracer benötigt von Ihnen die Angabe, wo er seine Informationen anzeigen kann, und das wird im Skript selbst festgelegt. Zurück zum hüpfenden Rechteck: Klicken Sie auf die Schaltfläche, um dasselbe Skript mit hinzugefügtem Tracer-Code zu erhalten:

~copy~

Ganz oben haben wir ein zusätzliches ~code:div~ namens ~code:Tracer~. Das Erste, was das Skript tut, ist, dieses div zu erstellen und ihm eine bestimmte id zu geben; einen speziellen Wert, den ~ec~ kennt.

Später im Programm, am Anfang der Hauptschleife, wollen wir damit beginnen, unser laufendes Skript zu untersuchen. In diesem Beispiel können wir nur zu 2 Dingen Informationen anfordern: den Werten von ~code:Angle~ und ~code:Height~. Sie können nur die Werte gewöhnlicher numerischer oder Zeichenketten-Variablen abfragen; andere Typen zu unterstützen würde die Größe von ~ec~ für etwas, das relativ selten genutzt wird, enorm erhöhen. In Zeile 26 nimmt der erste ~code:trace~-Befehl eine Liste der Variablen entgegen, die wir inspizieren möchten, und gibt an, ob sie horizontal auf einer Zeile oder vertikal angezeigt werden sollen. Dieser Befehl ist optional; manchmal möchten Sie nur wissen, wo Sie sich befinden, ohne Variablenwerte kennen zu müssen.

Der zweite ~code:trace~-Befehl bewirkt, dass das Programm anhält, sobald es diese Stelle erreicht. Es zeigt die von Ihnen angeforderten Variablen sowie die letzten 5 Zeilen an, die vor dem Erreichen des trace-Befehls ausgeführt wurden, und stoppt dann. Sie können es anweisen, einen Schritt fortzusetzen oder erneut ohne Unterbrechung weiterzulaufen.

Wenn Sie dieses Skript ausführen, werden Sie das beobachten, und während Sie den Code schrittweise durchlaufen, werden die Werte von ~code:Angle~ und ~code:Height~ zunehmen, der eine schneller als der andere.

Sobald Sie das jeweilige Problem diagnostiziert und behoben haben, können Sie den Tracer-Code entfernen, und das Programm läuft normal weiter.

~next:Interaktivität~
