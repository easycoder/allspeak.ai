# Erster Schritt: Hallo, Welt! #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Wir beginnen mit einigen ganz grundlegenden Dingen und stellen Ihnen nach und nach immer mehr vom ~ec~-System vor. Sie können jederzeit unterbrechen und später zurückkehren (auf demselben Computer und im selben Browser); das System merkt sich, wo Sie waren. Über diesem Text befinden sich Navigationsschaltflächen, mit denen Sie zum vorherigen Schritt des Tutorials zurückkehren oder zum nächsten weitergehen können. Dann fangen wir an.

Auf der linken Seite sehen Sie ein leeres Feld mit nur einer Zeilennummer '1'. (Auf einem Smartphone müssen Sie die Schaltfläche ~icon:cycle:20px:Cycle screens~ (Wechseln) antippen, um zum Code-Bereich zu gelangen.) Hier werden Sie Ihren Programmcode eingeben. Darüber befinden sich Schaltflächen, mit denen Sie Ihren Code speichern, zuvor gespeicherten Code laden und das, was gerade auf dem Bildschirm zu sehen ist, ausführen können.

In der Programmierung ist es Tradition, dass das erste Programm "Hallo, Welt" heißt. Es zeigt einfach eine Nachricht an — das ist alles. Wir werden diese Tradition also hier fortführen. Geben Sie den unten stehenden Text in das Feld auf der linken Seite ein oder klicken Sie auf die Schaltfläche "In Editor kopieren". (Wenn Sie ein Smartphone benutzen, möchten Sie vielleicht noch etwas weiterlesen, bevor Sie das tun, aber denken Sie daran, dass Sie jederzeit hierher zurückkehren können, indem Sie die Schaltfläche ~icon:cycle:20px:Cycle screens~ antippen.)

~pre:alarm &#96;Hallo, Welt!&#96;~
~copy~

Sie werden feststellen, dass in unserem Editor der Text zwischen den Backticks farbig dargestellt wird, während das Wort 'alarm' schwarz ist. Das liegt daran, dass der Editor 'versteht', wie ~ec~-Skripte aussehen. Beachten Sie auch, dass leere Zeilen oder Leerzeichen am Zeilenanfang ignoriert werden und dass ein Befehl mehr als eine Zeile einnehmen kann, solange Sie keinen Zeilenumbruch inmitten einer in Anführungszeichen gesetzten Zeichenkette einfügen (wie bei ~quot:Hallo, Welt!~).

Das Wort ~code:alarm~ ist ein ~ec~-Befehlswort und der Text zwischen den Backticks ist fester Text. Wir Programmierer nennen das eine Zeichenkette (String). Schwarz gefärbte Wörter sind alle Bestandteil von ~ec~ selbst; alles andere hat eine Farbe, die die Rolle im Sprachsystem anzeigt. Zeichenketten sind immer in ~code:gedämpftem~ ~code:Rot~.

Wenn Sie auf die Schaltfläche ~icon:run:20px:Run~ klicken, ändert sich deren Symbol zu ~icon:runstop:20px:Stop~ und ein Popup-Fenster erscheint mit Ihrer Nachricht. Wenn Sie in diesem Fenster auf OK klicken, wird alles wieder so wie vorher. Ihr Skript hat seine Aufgabe erledigt.

Das Programm hat sich tatsächlich so verhalten, als hätten Sie

~pre:alarm &#96;Hallo, Welt!&#96;
ausgang~

eingegeben.

Wenn Sie die Anweisung ~code:ausgang~ weglassen, fügt der ~ec~-Compiler sie für Sie ein, aber es gibt Momente, in denen Sie nicht wollen, dass das Programm einfach beendet wird. Es könnte auf eine Benutzerinteraktion warten und muss daher weiterlaufen. Dazu benötigen wir eine andere Variante:

~pre:alarm &#96;Hallo, Welt!&#96;
stoppe~

In diesem Fall wird die Schaltfläche nach dem Klick auf OK und dem Verschwinden des Popups nicht wieder zu ~icon:run:20px:Run~. Das liegt daran, dass sich das Skript noch im Zustand 'läuft' befindet, aber in Wirklichkeit nichts tut. Wenn Sie auf die Schaltfläche ~icon:runstop:20px:Stop~ klicken, wird das Skript zwangsweise beendet. Probieren Sie es aus.

Das Alarm-Popup ist sehr nützlich, wenn Sie Ihr Skript anhalten und überprüfen möchten, was es gerade tut. Sie können eine Nachricht zusammenstellen, die alle benötigten Informationen enthält. In den nächsten paar Schritten dieses Tutorials verwenden wir Alarme, um einige grundlegende Programmierfunktionen zu erkunden und etwas Rechnen durchzuführen, bevor wir uns dem visuellen Teil zuwenden.

Bevor wir fortfahren, packen wir hier noch eine Sache hinein.

Dieses Skript besteht zwar nur aus einer Zeile, aber es ist Ihr erstes Skript. Sie haben möglicherweise Änderungen vorgenommen, um zu sehen, welche Wirkung diese haben (ich hoffe es sogar; das ist die beste Art zu lernen). Wenn Sie ein anderes Mal zurückkehren und es ausführen möchten, wäre es doch gut, es zu speichern, damit Sie es nicht wieder eintippen müssen. Tun Sie dies, indem Sie einen passenden Namen — etwa ~code:hallo~ — in das Feld "Skriptname" eingeben und dann auf die Schaltfläche ~icon:save:20px:Save~ klicken. Wenn Sie den Codex über unseren Webserver nutzen, werden Ihre Skripte in einem von Ihrem Browser verwalteten Speicherbereich abgelegt und sind nur für Sie sichtbar, solange Sie diese Website benutzen. Das bedeutet, dass sie nicht dauerhaft sind; wenn Sie ein Skript also wirklich sichern möchten, sollten Sie es kopieren und in ein Textdokument oder eine E-Mail einfügen.

Wenn Sie auf ~icon:open:20px:Open~ klicken, sehen Sie alle Skripte, die Sie während der Nutzung von ~ec~ gespeichert haben. Klicken Sie auf eines davon, um es in den Editor zu laden, wo Sie Änderungen vornehmen und es ausführen können.

Um das aktuelle Skript zu löschen (ohne es aus dem Speicher zu entfernen), klicken Sie auf ~icon:new:20px:New~, und um das aktuelle Skript aus dem Speicher zu löschen, klicken Sie auf ~icon:trash:20px:Delete~.

~next:Grundrechenarten~
