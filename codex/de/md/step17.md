# Auswählen, Ziehen und Ablegen #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Interaktive grafische Oberflächen bieten dem Benutzer häufig die Möglichkeit, Elemente auf dem Bildschirm zu verschieben, als Alternative zum Kopieren und Einfügen. Hinter den Kulissen kann die Implementierung recht komplex sein, da in der Regel viele Dinge zu berücksichtigen sind, die spezifisch für die jeweilige Anwendung sind.

In ~ec~ bildet die grundlegende Drag-and-Drop-Funktion eine solide Basis, auf der Sie viel komplexere Funktionalitäten aufbauen können. Das Beispiel, das wir hier zeigen, ist ungefähr so einfach, wie es nur sein kann; auf der nächsten Seite folgt ein komplexeres Beispiel.

~copy~

Das Skript baut einen einfachen Bildschirm auf, der eine einzelne Komponente enthält, die aufgenommen und bewegt werden kann. Die Komponente kann fast jedes Element sein; das Einzige, was besondere Aufmerksamkeit erfordert, ist Text, der normalerweise einen I-Balken-Cursor anzeigt, wenn der Zeiger darüber fährt. In diesem Beispiel wird der Cursor auf den standardmäßigen Pfeil gezwungen.

Das Skript hat 2 Elemente und eine Handvoll Variablen. Das Container-Element existiert nur, um den CSS-Stil ~code:position:relative~ aufzunehmen, der es Elementen darin erlaubt, absolute Positionierung zu verwenden. (Es ist nicht sehr intuitiv, aber so funktioniert es.) Die ~code:Component~ ist das Objekt, das wir umherziehen werden; es ist einfach eine Textzeichenkette.

Das Skript interessiert sich für 2 Ereignisse: eines, wenn der Benutzer in die Komponente klickt, und das andere, wenn das Element anschließend gezogen wird. Für das erste müssen wir wissen, wo die „Auswahl" relativ zur oberen linken Ecke des Fensters erfolgte. Außerdem muss es wissen, wo sich die Komponente derzeit relativ zu ihrem Eltern­element befindet (damit wir diesen Wert ändern können).

Wenn ein Zieh-Ereignis auftritt, ermittelt das Skript die Position des Zeigers (oder des Fingers auf einem mobilen Bildschirm) und berechnet, wie weit er sich von der „Auswahl"-Position entfernt hat. Dazu addiert es die vorherige Position der Komponente in ihrem Container, und das Ergebnis wird verwendet, um eine neue Position zu setzen.

Das System erlaubt Ihnen auch anzugeben, was passiert, wenn die Komponente losgelassen wird. Hier verwenden wir die Standardaktion, die einfach darin besteht, das Ziehen der Komponente zu beenden.

~next:Solitär~
