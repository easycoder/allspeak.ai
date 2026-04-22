# Bilder hinzufügen #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Webseiten sind oft sehr visuell, mit vielen Bildern, daher zeige ich Ihnen, bevor wir mit klassischeren Programmierthemen fortfahren, wie man eine Seite mit einem Bild und einer Überschrift erstellt.

Wenn Sie sich den HTML-Code einer Webseite ansehen, sehen Sie nie irgendwelche Bilder; es ist nur ein Textdokument. Wie kommen die Bilder also auf die Seite?

Wenn wir ein Bild benötigen, geben wir Informationen an, die dem Browser sagen, wie er es findet — irgendwo da draußen im Internet, wo es auf einem Computer gespeichert ist. Diese Informationen geben wir in Form einer URL an, was für _Uniform Resource Locator_ steht. Man bezeichnet sie auch als "Adresse" des Bildes.

Der folgende Code holt ein Bild von unserem eigenen Webserver, skaliert es so, dass es 70 % der Seitenbreite einnimmt, und platziert es mittig ausgerichtet mit einer Überschrift darunter.

~step~
~copy~

Das Skript beginnt nicht mit Programmcode, sondern mit einem Kommentar. Kommentare sind für menschliche Leser gedacht; Sie können sie überall dort einfügen, wo Sie das Bedürfnis haben, jemand anderem — oder Ihrem zukünftigen Ich — zu erklären, was in Ihrem Code vor sich geht. Kommentare beginnen mit einem Ausrufezeichen und gehen bis zum Ende derselben Zeile, Sie können sie also entweder in eine eigene Zeile setzen (wie hier) oder hinter — und auf derselben Zeile wie — einem Skriptbefehl.

Kommentare sind Gegenstand mancher Diskussion unter Programmierern. Einige mögen es nicht, Kommentare zu schreiben, und behaupten, der Code selbst sollte selbsterklärend sein, während andere das Bedürfnis haben, welche hinzuzufügen, um die Absicht hinter dem Code zu erklären, die sonst oft fehlt. Wir überlassen es Ihnen, es so zu halten, wie es Ihnen lieber ist.

Als Nächstes haben wir 3 Variablen verschiedener Typen. Ein ~code:div~ ist ein Abschnitt einer Seite; ein Behälter, in dem andere Elemente platziert werden können. Viele Webseiten bestehen aus vielen divs innerhalb anderer divs, die meisten davon unsichtbar und stellen einfach die Gesamtstruktur bereit.

Die Variable ~code:img~ ist die Stelle, an der wir unser Bild platzieren werden, und die Variable ~code:p~ ist für die Überschrift, die darunter sitzt.

Zuerst erstellen wir den Behälter und geben ihm mittige Ausrichtung, einen Rand um sich herum, einen grauen Rahmen, etwas Innenabstand, um seinen Inhalt vom Rahmen fernzuhalten, und eine Hintergrundfarbe. Wie im vorherigen Schritt erklärt, sind das alles Standard-CSS-Attribute, die Sie nachschlagen können. Die Stilliste ist ziemlich lang, daher habe ich sie in 2 Teile aufgeteilt, mit einem ~code:cat~ dazwischen, damit die Zeile im Editor nicht umbricht. "Cat" ist die Kurzform von "catenate" (verketten), was einfach zwei Textstücke zusammenfügt.

Anschließend wird das Bildelement erstellt. Beachten Sie, dass der Befehl verlangt, es innerhalb des Behälters zu erstellen; standardmäßig würde es darunter sitzen. Die Bildbreite wird auf 70 % seines umschließenden Elements gesetzt, und standardmäßig passt sich die Höhe so an, dass das gleiche Seitenverhältnis erhalten bleibt. Dann fordern wir das Bild selbst von unserem Server an. Wenn sich Ressourcen wie Grafiken auf demselben Server wie der Code befinden, der sie verwendet, ist es üblich, dass die URL nicht mit dem gewohnten ~code:http://~ beginnt; hier haben wir einen relativen Pfad, der sich auf einen Ordner auf dem Server bezieht. Als Programmierer wissen Sie natürlich, wo Ihre Bilder aufbewahrt werden.

Der Überschriftentext umfasst mehrere Zeilen. In einer Webseite wird ein Zeilenumbruch mit dem Wort ~code:break~ angefordert, und um hier alles aufgeräumt zu halten, wird die gesamte Zeichenkette in Zeilen aufgeteilt und zusammen verkettet.

~next:Einfache Animation~
