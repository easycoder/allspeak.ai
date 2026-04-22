# Gestaltung und CSS #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Der vorherige Schritt hat uns eine Textzeile am oberen Bildschirmrand beschert, die jedoch auf eher unschöne Weise an den linken Rand gedrückt ist. Das können wir beheben, indem wir ihr etwas Gestaltung mitgeben. Hier ist derselbe Skript mit einigen Stilen ergänzt:

~step~
~copy~

Wie zuvor klicken Sie  , um das Skript auszuführen.

Das sieht viel besser aus; der Text ist größer, er steht in der Mitte des Panels und hat einen schönen Blauton. Wie wurde das gemacht?

Im Web wird der Inhalt Ihrer Seite — _das, was Sie sehen_ — durch HTML bestimmt. Das umfasst sowohl den sichtbaren Text und die Bilder als auch die Blockstruktur, aus der Ihre Seite besteht. Absätze und andere Komponenten, die in Ihren AllSpeak-Skripten definiert sind, werden direkt in die entsprechenden Formen in der Webseite übersetzt. Die Typnamen sind identisch, auch wenn die Syntax ganz anders ist.

Die Gestaltung hingegen bestimmt, wie die Seite aussieht, und das wird durch CSS gesteuert, was für _Cascading Style Sheets_ (kaskadierende Stilvorlagen) steht. Diese beiden Dinge getrennt zu halten, erlaubt uns, das Aussehen zu ändern, ohne den Inhalt ändern zu müssen. Wie nützlich diese Technik ist, werden Sie vielleicht erst richtig schätzen, wenn Sie eine Weile damit gearbeitet haben.

Mit CSS lässt sich praktisch jeder Aspekt des Aussehens eines Elements steuern. Zum Beispiel:

- Größe
- Farbe
- Ränder und Innenabstände
- Rahmen
- Hintergründe
- Positionierung
- Sichtbarkeit

und so weiter. In unserem Beispiel haben wir Folgendes verwendet:

~code:text-align:center;color:blue;font-size:1.4em~

und das hat 3 Teile. Der erste Teil sorgt dafür, dass der Text im Absatz zentriert ausgerichtet ist; der zweite Teil legt die Textfarbe fest und der letzte Teil setzt die Schriftgröße auf das 1,4-fache des aktuellen Standardwerts, was auch immer dieser sein mag. Die Einheit 'em' stammt aus der Welt des Schriftsatzes und steht für die Größe des Buchstabens 'm' in der aktuellen Schrift und im aktuellen Stil.

CSS-Stile sind einfach Textzeichenfolgen, und wir verwenden sie in ~ec~ genau so, wie es in der umfangreichen Dokumentation online und in Büchern beschrieben ist, daher werden wir hier nicht ins Detail gehen. Alle Stile, die wir in unseren Beispielen verwenden, sind sehr gut dokumentiert. Wenn Sie also zum Beispiel herausfinden möchten, was der Stil text-align bewirkt, googeln Sie einfach "css text-align".

~next:Bilder hinzufügen~
