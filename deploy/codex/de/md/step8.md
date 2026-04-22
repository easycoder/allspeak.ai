# Ein springendes Rechteck #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Hier ist ein weiteres einfaches Animationsbeispiel. Diesmal zeichnen wir ein Rechteck, dessen Höhe gemäß einer Sinusberechnung variiert. Keine Sorge wegen der Mathematik; ich erkläre es Ihnen. Hier ist der Code; kopieren Sie ihn in den Editor und führen Sie ihn aus, damit Sie wissen, was er tut.

~copy~

Das graue Rechteck startet mit der halben Höhe des umschließenden Behälters, dann wächst und schrumpft es und kehrt schließlich zu seiner ursprünglichen Größe zurück.

Wir beginnen damit, den Behälter zu erstellen, und geben ihm eine Breite von 90 % des umschließenden Panels. Ohne den margin-Stil würde dies dazu führen, dass er fest am linken Rand des Panels sitzt. Sie müssen sich über den CSS-Stil ~code:margin~ informieren, um die vollständigen Syntaxdetails zu erhalten, aber kurz gesagt zwingt die Verwendung von auto für die linken und rechten Ränder diese dazu, den freien Platz zwischen ihnen aufzuteilen, sodass die Box mittig sitzt.

Das Rechteck ist so eingestellt, dass es 9 % der Breite des Behälters einnimmt sowie einen Rahmen und einen Hintergrund hat. Der Stil ~code:position~ ist eine weitere CSS-Feinheit, die zu umfangreich ist, um hier erklärt zu werden; grundsätzlich erlaubt er uns, die Position der Oberseite des Elements festzulegen. Ohne ~code:position~ und ~code:top~ würde es einfach am oberen Rand der Box kleben. Das Rechteck wird gezwungen, seine Oberseite auf halber Höhe des Behälters zu haben (in der Computerwelt ist die Oberseite eines Behälters immer null, und größere Werte gehen nach unten).

Lassen Sie sich nicht von der scheinbaren Komplexität von CSS abschrecken. Es lohnt sich sehr, etwas Zeit in das Nachlesen zu investieren, aber am Ende muss man einfach Dinge ausprobieren. Das Tolle am ~ec~-Editor ist, dass Sie experimentieren können, bis es funktioniert.

Bisher haben wir ein graues Rechteck in einer größeren Box. Der nächste Befehl ist ~code:warte 2 sekunden~, der genau das tut. Sie können ~code:warte~ verwenden, um ein Skript für eine beliebige Anzahl von ~code:millis~ (Millisekunden), ~code:ticks~ (Hundertstelsekunden), ~code:sekunden~ oder ~code:minuten~ anzuhalten. In allen Fällen ist das abschließende ~code:s~ optional.

Nun zur eigentlichen Animation. Wir verwenden eine Variable ~code:Winkel~, um von 0 bis 360 zu zählen. Das ist die Anzahl der Grad in einem Kreis. Wenn Sie nicht mathematisch veranlagt sind, versuchen Sie sich eine Uhr mit einem Sekundenzeiger vorzustellen, der um sie herumläuft. Es ist ein eher seltsamer Sekundenzeiger, der sich quer über die ganze Uhr von einem Rand zum anderen erstreckt. Würden Sie die Uhr von der Kante aus betrachten, würden Sie die Drehbewegung nicht sehen; der Sekundenzeiger würde einfach länger und kürzer erscheinen, während er um das Zifferblatt wandert. Die mathematische Sinusfunktion sagt uns die scheinbare Länge des Sekundenzeigers an jedem Punkt seines Fortschreitens um das Zifferblatt. In unserem Beispiel beträgt der Durchmesser der Uhr 200 Pixel (also ist der Radius 100 Pixel), und die scheinbare Länge, von der Kante aus gesehen, variiert zwischen 0 und 200 Pixeln. (Genau dasselbe Prinzip gilt für die Länge des Tages beim Wechsel der Jahreszeiten. Sie sehen also, Mathematik kann nützlich sein.)

Die Berechnung ~code:sin Winkel radius 100~ kümmert sich um all das, also sage ich nicht mehr dazu. Wir verwenden den resultierenden Wert ~code:Höhe~, um die neue Oberseite des Rechtecks und seine neue Höhe zu berechnen.

In den CSS-Stilen werden ein paar Berechnungen durchgeführt. Die Oberseite des Rechtecks ist der 50 %-Punkt wie zuvor, aber mit abgezogenem Sinuswert. Ebenso beträgt die Höhe des Rechtecks grundsätzlich 100 Pixel, jedoch mit hinzuaddiertem Sinuswert.

~next:Die Welle~
