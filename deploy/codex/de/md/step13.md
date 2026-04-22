# Listen verwalten #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Eine Liste in ~ec~ ist eine Textzeichenkette im JSON-Format, das eine Art und Weise ist, Datenstrukturen darzustellen. Bei einer Liste handelt es sich um eine Menge von Elementen, obwohl es auch andere Möglichkeiten gibt, Daten zu organisieren, auf die wir in einem anderen Schritt eingehen werden.

In diesem Beispiel erstellen wir eine Einkaufsliste und sortieren sie dann in alphabetischer Reihenfolge. Die einfachste Form der Liste ist diejenige, bei der jedes Element nur ein Name ist. Klicken Sie auf diese Schaltfläche, um den Beispielcode in den Editor zu laden:

~copy~

Am Anfang des Skripts stehen die Variablen, die wir verwenden werden. Besonders hervorzuheben sind OriginalListe und AnzeigeListe. Die erste ist die Liste in der eingegebenen Form, mit den Elementen in keiner bestimmten Reihenfolge. Die zweite ist dieselbe Liste, nachdem sie für die Anzeige vorbereitet wurde.

In den Zeilen 16–25 erstellen wir unsere Originalliste. Wir beginnen damit, die Variable ~code:OriginalListe~ zu leeren, und fügen dann die Elemente einzeln hinzu.

Dann bauen wir die Benutzeroberfläche auf: ein Feld für die Liste und 2 Schaltflächen darunter. Für das Design gibt es natürlich keine Preise. Den 2 Schaltflächen sind jeweils Aktionen zugeordnet, die ausgeführt werden, wenn sie angeklickt werden. Die Schaltfläche ~code:Unsortiert~ springt einfach zu einer weiter unten liegenden Marke, um zu vermeiden, dass derselbe Code wiederholt werden muss. Um die Liste anzuzeigen, kopieren wir die Originalliste in die Anzeigeliste und rufen die Subroutine ~code:Anzeige~ auf, die jedes Element der Reihe nach zum Feld hinzufügt.

Wenn wir die Schaltfläche ~code:Sortiert~ anklicken, kopieren wir die Liste und sortieren sie dann, bevor wir sie anzeigen. In ~ec~ werden, wie in JavaScript selbst, keine Annahmen darüber gemacht, wie die Sortierung durchgeführt werden soll. Normalerweise möchten Sie eine alphabetische Sortierung, aber nehmen wir an, Sie möchten die Elemente nach der Länge ihrer Namen ordnen? Um maximale Flexibilität zu ermöglichen, lassen Programmiersprachen Sie eine Vergleichsfunktion definieren, die 2 Elemente aus der Liste nimmt und sie vergleicht. Hier heißt die Funktion ~code:AlphabetSort~, und sie funktioniert so:

Der Sortierbefehl arbeitet, indem er Elemente in der Liste vergleicht, bis sie in der gewünschten Reihenfolge sind. Er erkennt das, indem er die Ergebnisse der vom Benutzer festgelegten Vergleichsfunktion (~code:AlphabetSort~) auswertet. Diese Funktion wird mehrmals aufgerufen, jedes Mal mit einem Paar von Elementen, und muss jedes Mal einen Wert zurückgeben, der angibt, ob sie in der richtigen Reihenfolge stehen. Die 2 Elemente werden als Argumente des Arrays selbst bereitgestellt, mit den speziellen Namen ~code:a~ und ~code:b~. Unsere Vergleichsfunktion vergleicht diese und legt das Ergebnis in einem weiteren Argument namens ~code:v~ ab. Die zurückgegebenen Werte sind 1, 0 oder -1, je nachdem, ob das erste Argument einen Wert hat, der größer, gleich oder kleiner als das zweite Argument ist. Sobald die Liste sortiert ist, wird sie angezeigt.

Beachten Sie, dass die Werte in diesem Fall Zeichenketten sind, keine Zahlen, sodass der Vergleich alphabetisch erfolgt.

Diese Technik erlaubt es Ihnen, jede Art von Sortierung durchzuführen, die Sie benötigen. Sortieren wir jetzt nach Wortlänge. Versuchen Sie, die Zeilen 65 und 66 durch

~pre:wenn die json anzahl von A ist größer als die json anzahl von B lege 1 in Ergebnis
sonst wenn die json anzahl von A ist kleiner als die json anzahl von B lege -1 in Ergebnis~

zu ersetzen und schauen Sie, was passiert. Die Liste ist nun in der Reihenfolge der Wortlänge. Allerdings gibt es 4 Elemente mit 4 Buchstaben und 2 mit 6 Buchstaben, und diese sind nicht alphabetisch sortiert. Um das zu erreichen, müssen wir Zeile 67 wie folgt ändern:

~pre:sonst
beginn
    wenn A ist größer als B lege 1 in Ergebnis
    sonst wenn A ist kleiner als B lege -1 in Ergebnis
    sonst lege 0 in Ergebnis
ende~

Hier haben wir einen zweiten Vergleich hinzugefügt, diesmal auf die eigentlichen Werte wie zuvor, der nur dann stattfindet, wenn die beiden Elemente dieselbe Länge haben.

Im nächsten Schritt werden wir uns mit fortgeschritteneren Sortierungen beschäftigen.

~next:Fortgeschrittenes Sortieren~
