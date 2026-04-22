# Google Maps verwenden #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Eine der Stärken von ~ec~ ist die Art, wie es sich mit Plugins erweitern lässt. Das sind JavaScript-Code-Module, die den Benutzern des Systems zusätzliche Sprachfunktionen bereitstellen. AllSpeak wird mit einer Reihe davon ausgeliefert, die bei Bedarf verfügbar sind, daher zeige ich Ihnen, wie Sie eines der interessanteren verwenden.

Google Maps gehört zu den spektakulärsten Funktionen, die auf irgendeiner Website zu finden sind. Es bietet einen großen Funktionsumfang und lässt sich mit sehr wenig Aufwand in die Seite einbinden. Allerdings braucht es einigen Aufwand, um zu lernen, wie man es macht, und diesen Aufwand haben wir Ihnen abgenommen, indem wir unser eigenes ~ec~-Plugin gebaut haben, das die Karten für Sie verwaltet. Derzeit ist es noch etwas einfach gehalten, aber wir hoffen, mit der Zeit weitere Funktionen hinzuzufügen. Klicken Sie hier, um das Kartenskript zu laden:

~copy~

Das Skript baut eine Seite auf, die den gesamten verfügbaren Platz nutzt, und unterteilt sie dann in eine ~code:Bedienung~-Leiste und das eigentliche Hauptkartenpanel. Die ~code:Bedienung~-Leiste hat nur einen Titel, aber es ist Platz, um beliebige Schaltflächen einzufügen, die Sie zur Steuerung der Funktionsweise Ihrer Karte benötigen.

In der Variablenliste sehen Sie ~code:gmap Karte~. Das ist Teil der neuen Funktionalität, die mit dem geladenen Plugin verfügbar ist, ebenso wie die späteren Befehle, die auf die ~code:Karte~ verweisen.

Die Karte selbst benötigt ein div, in dem sie platziert wird, dann können Sie die Karte mit einem sehr kleinen Satz von Befehlen erstellen. Das Erste, was der Karte hinzugefügt werden muss, ist ein 'API-Schlüssel', der von Google bereitgestellt wird, um die Nutzung einer Karte auf dieser Website zu autorisieren. Das Skript holt diesen Schlüssel mittels ~code:rest get~ vom Server, sodass er nicht fest im Skript selbst kodiert ist. Sie können Ihren eigenen API-Schlüssel erhalten, indem Sie sich als Google-Entwickler registrieren und Ihren Schlüssel auf der entsprechenden Seite anfordern. (Leider geht es über den Rahmen dieser Hinweise hinaus zu beschreiben, wie das geht.)

Um eine Karte einzurichten, werden nur 3 Informationen benötigt: ~code:Breitengrad~, ~code:Längengrad~ und ~code:Zoom~. Experimentieren Sie mit jedem davon, um zu entdecken, wie sie funktionieren; versuchen Sie, eine Karte anzuzeigen, die Ihr eigenes Zuhause zeigt.

~next:Auswählen, Ziehen und Ablegen~
