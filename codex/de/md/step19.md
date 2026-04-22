# Schwenken und Zoomen #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

Wenn Fernsehsendungen eine Serie von Bildern zeigen, wenden sie häufig etwas an, das man den „Ken-Burns-Effekt" nennt (benannt nach dem amerikanischen Dokumentarfilmer, der diese Technik bekannt gemacht hat). Dabei wird jedes Bild langsam geschwenkt und/oder gezoomt, bevor es in das nächste übergeblendet wird, wodurch ein Gefühl von Bewegung entsteht. Der Effekt wurde ausgiebig von dem amerikanischen Dokumentarfilmer verwendet, nach dem er benannt ist.

In diesem Tutorial-Schritt behandeln wir nur das Schwenken und Zoomen; die Überblendung kann bis später warten.

Der Großteil der Arbeit in der Animation wird von einem ~ec~-`vfx`-Plugin-Modul erledigt. Alles, was das Skript tun muss, ist, die Dinge einzurichten und dann auszuführen.

~copy~

Der Code hier ist so konzipiert, dass er mit jeder Größe eines Bildcontainers funktioniert, sodass alle Abmessungen als Prozentsatz des übergeordneten Elements berechnet werden. Die Daten für die Animation sind alle in einer Variable namens ~code:Spec~ gespeichert, mit 2 Datenblöcken für Anfang und Ende der Animation. Die zentralen Elemente sind die Werte ~code:left~, ~code:top~ und ~code:width~. ~code:width~ ist der Prozentsatz des gesamten Bildes, der am Anfang oder am Ende der Animation gezeigt wird. ~code:left~ ist der Prozentsatz, der links vom Anzeigebereich „hervorragt", und ~code:top~ der entsprechende Betrag, der oben hervorragt. Da die Höhe des Bildes immer seiner Breite folgt und das Seitenverhältnis gleich bleibt, ist das alles, was wir brauchen. Das Datenpaket enthält außerdem die URL des Bildes, die Anzahl der beteiligten Schritte und welcher Schritt das Skript dazu veranlassen soll, etwas Besonderes zu tun, in diesem Fall die Animation zu stoppen.

Alles, was wir jetzt noch tun müssen, ist, regelmäßige Anforderungen zu senden, um die Animation schrittweise voranzutreiben. Dies wird vom Skript und nicht vom Plugin erledigt, damit wir die Kontrolle über den Prozess behalten können.

Wenn Sie mehr als eine Animation erstellen, diese aber alle in derselben Variable als Array ablegen, führt der ~code:step~-Befehl alle aus, wobei die einzigen, die tatsächlich etwas tun, diejenigen sind, deren Schrittzähler noch nicht die Anzahl der vorgesehenen Schritte erreicht hat. Sie können eine Animation jederzeit neu starten, indem Sie verwenden

```
    indexiere Anim zu N
    starte Anim
```

~next:Der Ken-Burns-Effekt~
