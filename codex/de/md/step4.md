# Einführung in das DOM #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Alle Webseiten sind aus HTML-Komponenten aufgebaut; eine Art erweitertes Matrjoschka-Prinzip, bei dem Behälter andere Behälter enthalten, die wiederum Bilder oder Text enthalten... und so weiter. Diese Struktur heißt Document Object Model, kurz DOM. In diesem Schritt erstellen wir eine Webseite mit einer einzigen Komponente, die nur etwas Text enthält. Wir erwarten nicht, dass Sie etwas über das DOM oder über HTML wissen; alles, was Sie brauchen, wird Schritt für Schritt eingeführt.

Es gibt eine Vielzahl unterschiedlicher Komponenten, die Text enthalten können. Überschriften, Absatzelemente, Spans, Textfelder und Bereiche (Divisions) gehören zu den gängigsten. In diesem Beispiel erstellen wir ein Absatzelement und setzen einen bekannten Satz hinein. Das Skript sieht so aus:
~step~
Wenn das Skript ausgeführt wird, erscheint der Text im Ausführungsbereich und verbirgt diesen Tutorial-Text. Sie können zwischen dem Ausführungs- und dem Hilfebereich wechseln, indem Sie auf die Schaltfläche  (Wechseln) klicken. Probieren Sie es aus. (Auf Mobilgeräten wechselt die Schaltfläche  zwischen den drei Bereichen Code-Ausführen-Hilfe.)

~copy~

Hier passiert einiges, deshalb erkläre ich es. Die erste Zeile ist ein Kommentar, der ignoriert werden kann. Danach folgt ~code:p Absatz~, was eine Variablendeklaration ist, ein Fachbegriff der Programmierer, der so viel bedeutet wie die Definition eines Ortes, an dem Sie Informationen ablegen können. In der realen Welt haben Sie vielleicht 2 Hunde, die Rover und Spot heißen. Wenn Sie im Gespräch auf den ersten Bezug nehmen, sagen Sie vielleicht "Das ist mein Hund Rover". Ihr Gesprächspartner weiß, was ein Hund ist, und in Schriftform bestätigen wir, dass Rover ein Name ist, indem wir ihn groß schreiben. Sobald wir das fragliche Tier identifiziert haben, können wir ihn einfach Rover nennen, ohne 'mein Hund' nochmals wiederholen zu müssen.

~ec~ funktioniert wie das Englische (oder Deutsche). Ich muss das deutlich machen, weil die meisten anderen Programmiersprachen aus irgendeinem seltsamen Grund genau das Gegenteil tun: Sie beginnen Namen mit Kleinbuchstaben und Typen mit Großbuchstaben. Für viele Anfänger ist das wenig intuitiv, weshalb wir es lieber nach natürlicher Sprache halten.

Aus dem Obigen haben Sie vielleicht geschlossen, dass ~code:Absatz~ der Name von etwas ist und ~code:p~ der Name des Typs dieses Etwas. Wenn ja, hatten Sie recht. Ein Objekt vom Typ ~code:p~ ist ein Textabsatz, und hier haben wir einen namens ~code:Absatz~. Durch die Benennung können wir ihn von einem anderen Absatz namens ~code:Absatz2~ unterscheiden, genauso wie Rover und Spot nicht derselbe Hund sind. Wir teilen ~ec~ also mit, dass wir einen Absatz verwenden werden und ihn als ~code:Absatz~ bezeichnen wollen.

Ein typisches ~ec~-Skript kann viele Variablen haben, und es ist üblich, sie alle am Anfang zu platzieren und dann eine Leerzeile dahinter einzufügen, um dem Programmierer zu helfen, ähnlich wie Bücher den Text in Absätze, Listen und Überschriften gliedern. Das Auge folgt leichter. Leerzeilen haben überhaupt keine Auswirkung auf die Ausführung des Programms.

Die nächste Zeile ist create ~code:Absatz~. Wir haben bereits angekündigt, dass wir einen Absatz haben wollen, also erstellen wir ihn hier. In einigen Programmiersprachen (zum Beispiel JavaScript) haben Variablen keine Typen; sie sind alle beliebige _Dinge_. (In der realen Welt wäre es undenkbar, dass wir funktionieren könnten, wenn die Sprache es uns nicht erlauben würde zu sagen, ob etwas ein Hund, eine Katze oder ein Sessel ist, aber in der Computerwelt scheint es gut genug zu funktionieren.) Die meisten anderen Sprachen müssen wissen, welchen Typ eine Variable hat, um sie erstellen zu können. Dieser Ansatz heißt _starke Typisierung_. ~ec~ liegt irgendwo dazwischen; obwohl seine Variablen 'typisiert' sind, können sie manchmal Daten unterschiedlicher Typen enthalten. Insbesondere können Zahlen und Zeichenketten beide in einer gewöhnlichen Variablen abgelegt werden, und in den meisten Fällen erkennt ~ec~, wann das eine in das andere umzuwandeln ist.

Ein Absatz ist der Ort, an dem Sie Text auf Ihrer Webseite platzieren; er ist ein Text-_Behälter_. ~ec~ platziert Ihren neuen Absatz oben auf der Seite am linken Rand, aber solange Sie keinen Text hinzufügen, können Sie ihn nicht sehen, weil er transparent ist. Die nächste Zeile im Skript fügt also etwas Text hinzu.

Schließlich verhindert der Befehl ~code:stoppe~, dass das Skript beendet wird, bevor Sie überhaupt die Gelegenheit hatten, den Text zu sehen.

Wie schon in den früheren Beispielen hat der Editor etwas Farbcodierung vorgenommen. Variablen werden immer in Blau dargestellt und Zahlen in Grün. Jedes Wort, das in Schwarz erscheint, ist Teil von ~ec~ selbst.

~next:Gestaltung und CSS~
