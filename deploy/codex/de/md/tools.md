# AllSpeak-Werkzeuge und -Techniken #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

## Plugins ##
Die Standardsprache ~ec~ umfasst ein breites Spektrum an allgemeinen Programmierkonstrukten, die jede Sprache benötigt: Variablen, Werte, Bedingungen, Zeichenketten, Zahlen und so weiter. Alles Weitere wird von Plugins bereitgestellt. Einige davon, insbesondere Browser-Funktionen, JSON und REST, werden automatisch geladen (obwohl dieses Verhalten bei Bedarf geändert werden kann), und mehrere weitere stehen als optionale Plugins zur Verfügung. Plugins fügen der Sprache Befehle hinzu und müssen geladen werden, bevor ein Skript, das diese Schlüsselwörter verwendet, kompiliert werden kann.

Der Mechanismus zum Anfordern eines Plugins ist sehr einfach. Angenommen, Sie möchten eine Google-Karte in Ihre Webseite einbinden. Sie benötigen das Plugin ~code:gmap~, das wie folgt geladen wird, wobei die ~ec~-Dateien sich alle in einem Ordner `allspeak` auf oberster Ebene befinden:

~pre:require js `allspeak/plugins/gmap.js`~

In diesem Beispiel handelt es sich um ein Standard-~ec~-Plugin, aber Sie können auch Plugins von Drittanbietern von jeder URL laden, sofern Sie die CORS-Fragen klären.

Sobald das Plugin geladen ist, steht es jedem Skript zur Verfügung, das es benötigt (nicht aber demjenigen, das es geladen hat). Hier kann jedes Skript, das Kartenbefehle enthält, geladen und kompiliert werden, etwa so

~pre:rest hole Skript von `/resources/ecs/myscript.as`
laufe Skript~

(Dies ist die einfachste Form, die voraussetzt, dass Sie nicht mit dem Skript kommunizieren müssen, sobald es läuft.)

Es sollte ziemlich offensichtlich sein, dass, wenn Plugins auf diese Weise verwendet werden, der Code, den Sie ausführen möchten, in einem separaten Skript stehen muss, das geladen und ausgeführt wird, _nachdem_ das Plugin bereit ist. Eine Alternative dazu ist, das Plugin global an der Stelle zu deklarieren, an der ~ec~ startet. Im obersten allspeak-Ordner befindet sich eine Datei namens ~code:plugins.js~, in der Sie angeben können, welche Plugins beim Start geladen werden sollen und welche bei Bedarf zum Laden verfügbar sein werden. Dadurch wird das anfängliche Laden der Seite etwas langsamer, aber in der Praxis ist der Unterschied sehr gering.
