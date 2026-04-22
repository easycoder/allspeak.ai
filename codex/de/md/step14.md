# Fortgeschrittenes Sortieren #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Das vorherige Beispiel war einfach, aber manchmal bestehen die Elemente einer Liste aus mehreren Werten. Bei einer Einkaufsliste könnten Sie beispielsweise den Preis, die Artikelnummer und so weiter haben. Hier ändern wir unsere Liste, um Preise hinzuzufügen, und sortieren dann sowohl nach Preis als auch alphabetisch.

~copy~

Die Liste enthält jetzt dieselben Artikel, aber jeder enthält 2 Werte: den Namen des Artikels und seinen Preis (in Cent, Pence oder einer anderen Einheit; AllSpeak verarbeitet keine Gleitkommazahlen). Zu Beginn des vorherigen Schritts habe ich erwähnt, dass das JSON-Format auch andere Dinge als Listen verarbeiten kann; hier haben wir eine Eigenschafts-Map: eine Sammlung von Werten, die jeweils einen Schlüssel haben, der angibt, worum es sich handelt — hier name oder price — und den eigentlichen Wert. Jeder der Artikel wird einzeln einer Liste hinzugefügt, sodass die Gesamtstruktur eine Liste von Artikeln ist, die jeweils 2 Eigenschaften haben.

Alles andere ist genauso wie im vorherigen Beispiel — außer der Vergleichsfunktion, die jetzt in die Eigenschaften hineingreifen muss, um den Preis zu finden und den Vergleich darauf durchzuführen. Ich habe die Funktion umbenannt, um das deutlich zu machen.

Wie zuvor gibt es eine kleine Tücke: Milch und Zucker haben denselben Preis, aber Zucker erscheint zuerst, weil er in der Liste zuerst steht. Wir können erreichen, dass diese 2 Artikel in alphabetischer Reihenfolge erscheinen, indem wir Zeile 98 ändern in

~pre:sonst
beginn
    wenn eigenschaft `name` von A ist größer als eigenschaft `name` von B
        lege 1 in Ergebnis
    sonst wenn eigenschaft `name` von A ist kleiner als eigenschaft `name` von B
        lege -1 in Ergebnis
    sonst lege 0 in Ergebnis
ende~

Die nächste Seite zeigt Ihnen, wie Sie nur einige der Elemente einer Liste extrahieren.

~next:Listen filtern~
