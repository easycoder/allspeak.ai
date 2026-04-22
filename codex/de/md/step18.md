# Solitär #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Solitär ist ein Sammelbegriff für verschiedene Aktivitäten, Spiele und Übungen für einen einzelnen Spieler. Die bekanntesten Varianten sind wahrscheinlich Kartenspiele, aber eine der traditionellsten ist ein Spiel, das auf einem Holzbrett mit einem Raster von Löchern gespielt wird, die anfangs mit Steinen gefüllt sind. Ein Loch bleibt zu Beginn leer, und die Regeln sind sehr einfach: Wenn Sie einen Stein nehmen und über seinen Nachbarn in ein leeres Feld springen, wird der Nachbar vom Brett entfernt. Die Herausforderung besteht darin, alle Steine bis auf einen zu entfernen. Es ist überraschend schwierig.

Hier haben wir eine elektronische Version von Solitär. Steine werden per Ziehen und Ablegen bewegt, wie auf der vorherigen Seite skizziert, aber hier wird es etwas komplizierter. Hinweis: Obwohl dieses Skript auf einem mobilen Gerät läuft, ist es weniger ideal, da ein Finger die Sicht darauf verdeckt, wohin der Stein gezogen wird, und es scheint keinen zuverlässigen Weg zu geben, den Browser daran zu hindern, den gesamten Bildschirminhalt mit dem aufgenommenen Element mitzuziehen. Es gibt eine Version dieses Skripts unter [https://allspeak.software/solitaire/](https://allspeak.software/solitaire/), die Auswahl anstelle von Ziehen verwendet und besser für mobile Browser geeignet ist.

~copy~

Der Code, der das Brett zeichnet, ist ziemlich typisch für Spiele und ähnliche grafische Programme, da er Bildschirmpositionen und -größen nicht mit festen Werten berechnet, sondern Werte relativ zu einem Ausgangspunkt berechnet. In diesem Fall sind es für PC 500 Pixel und für mobile Geräte die Breite des Bildschirms. Obwohl die Prüfung des Codes eine Weile dauern kann, erlaubt er, Änderungen recht einfach vorzunehmen. Hier beziehen sich die Zahlen 7 und 14 auf die Anzahl der Steine in einer Reihe, die 6 macht die Steine einfach kleiner und die 95 und 100 zwingen den Spielbereich dazu, kleiner zu sein, damit alles in den Kreis passt. Den Rest überlasse ich Ihnen zum Herausfinden.

Das Skript macht ausgiebigen Gebrauch von Arrays mit je 49 Elementen, eines für jede Zelle auf dem Brett; ein 7-mal-7-Array von Zellen, von denen nicht alle genutzt werden. Das erste dieser Arrays ist eine Karte, die den aktuellen Zustand des Bretts beschreibt. Jede Position hat einen von 3 Werten: 0 bedeutet eine Zelle, die nicht zum Spiel gehört, 1 ist eine leere Zelle und 2 bedeutet, dass ein Stein die Zelle belegt. Jede Zelle hat einen Stein; sie bewegen sich nie außer vorübergehend beim Ziehen, danach werden sie nur sichtbar oder unsichtbar gemacht.

Zwei Arrays — ~code:Linkse~ und ~code:Obense~ — enthalten die Positionen jeder Zelle relativ zum Behälter.

Jede Zelle wird durch ein Array grauer Kreise dargestellt, und jeder Stein durch einen roten Kreis. Jeder Stein kann nur ein Loch belegen. Anfangs gibt es einen Stein weniger als Löcher; die mittlere Zelle ist leer. Der erste Teil des Skripts kümmert sich um den Aufbau des Bretts, danach haben wir die 3 Ereignisbehandler für Auswählen, Ziehen und Ablegen.

Wenn Sie einen Stein auswählen, ermittelt das Skript, bevor Sie ihn ziehen, ob es irgendwo einen legalen Zielpunkt (innerhalb der Solitär-Regeln) gibt, zu dem er bewegt werden kann. Steine können sich 2 Positionen nach oben, unten, links oder rechts bewegen, aber nur, wenn dort eine leere Zelle und ein Stein zum Überspringen vorhanden ist. Wenn ein Zug möglich ist, wird der Stein in einer anderen Farbe gezeichnet und durch Setzen seines z-index in den Vordergrund gebracht. Die Variable ~code:Gewählt~ wird auf den Steinindex gesetzt, der andernfalls den Wert false enthält.

Wenn Sie den Stein ziehen, berechnet das Skript seine neue Position und zeichnet ihn dort neu. Dann prüft es, ob sich die aktuelle Zeigerposition innerhalb eines der 4 möglichen Ziele befindet. Wenn ja, färbt es das Loch gelb als visuelles Signal, dass Sie den Stein ablegen können.

Wenn Sie einen Stein ablegen, gibt es 2 mögliche Szenarien. Sind Sie an einem gültigen Ziel angekommen, wird der Stein auf seinen ursprünglichen z-index zurückgesetzt, an seinen ursprünglichen Platz zurückgebracht, aber entfernt (unsichtbar gemacht). Der übersprungene Stein wird ebenfalls entfernt, und der zuvor unsichtbare Stein am Ziel wird sichtbar gemacht.

Das zweite Szenario ist, wenn Sie einen Stein an einer anderen Stelle als an einem gültigen Ziel ablegen. Alles, was wir hier tun müssen, ist, die Dinge in den Zustand vor dem Auswählen des Steins zurückzuversetzen.

Was noch zu tun bleibt, ist zu prüfen, ob noch weitere Züge möglich sind, und wenn nicht, eine Nachricht anzuzeigen, um den Spieler zu informieren. Es gibt keine Neustart-Schaltfläche, aber es wäre nicht schwer, eine hinzuzufügen.

Aufmerksamen Programmierern mag auffallen, dass die Algorithmen zum Finden gültiger Züge zweimal, aber unterschiedlich, implementiert sind. Das liegt größtenteils daran, dass das Skript eine Ableitung einer früheren Version ist (die kein Ziehen und Ablegen verwendete). Die Technik, mit der getestet wird, ob ein bestimmter Stein bewegt werden kann, ist prägnanter, aber ich habe beschlossen, den Code, der prüft, ob überhaupt Züge verfügbar sind, so zu belassen, wie er war. Jede Technik verwendet eine Reihe arithmetischer Berechnungen, und es zeigt, wie es oft 2 oder mehr Wege gibt, um ein bestimmtes Ziel zu erreichen.

~next:Schwenken und Zoomen~
