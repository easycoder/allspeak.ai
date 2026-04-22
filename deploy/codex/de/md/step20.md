# Der Ken-Burns-Effekt #

> 📝 *Diese deutsche Übersetzung von AllSpeak ist ein laufendes Projekt, mit KI-Unterstützung erstellt. Wenn Ihnen holprige Formulierungen oder Fehler auffallen, schreiben Sie uns gern an [info@allspeak.ai](mailto:info@allspeak.ai) — Ihre Korrekturvorschläge helfen, die Übersetzung für künftige Nutzer zu verfeinern.*

In diesem Tutorial-Schritt vervollständigen wir den Ken-Burns-Effekt, indem wir weitere Bilder und eine Überblendung zwischen ihnen hinzufügen. Jedes der Bilder wird nach seinem eigenen Regelsatz animiert, sodass der Gesamteindruck einer ununterbrochenen Bewegung entsteht. Im Fernsehen vermittelt das den Eindruck, ein Video anzuschauen statt einer Diashow, und deshalb ist der Effekt so beliebt.

~copy~

Der größte Teil des Codes besteht aus den Spezifikationen für jedes der 9 Bilder. (Die Bilder zeigen alle zufällige Szenen in Norditalien.) Der Code macht im Grunde dasselbe wie beim Schwenk-/Zoom-Beispiel, nur dass er sich in einer Schleife wiederholt, einmal für jedes Bild. All das wird dadurch gehandhabt, dass ~code:Anim~ und ~code:Spec~ jeweils Felder mit 9 Elementen sind.

Der Schlüssel zum Effekt liegt in den Übergängen. Oben definieren wir den Stil, der ein Bild von einer Deckkraftstufe zur anderen ein- oder ausblenden lässt. Der Code sorgt dafür, dass das aktuelle Bild ausgeblendet wird, während das nächste Bild eingeblendet wird, und erzeugt so eine Überblendung. Wir setzen auf jedem Bild einen Auslöser auf eine Sekunde vor dem Ende seines Zooms/Schwenks, damit die Überblendung am Ende eines Bildes und am Anfang des nächsten stattfindet. Die Zooms/Schwenks der 2 Bilder laufen gleichzeitig, und die Bilder sind als zirkuläre Liste angeordnet, sodass der Effekt unendlich weiterläuft.

---

## Das war's!

Herzlichen Glückwunsch — Sie haben das ~ec~-Codex-Tutorial abgeschlossen. Auf dem Weg haben Sie Variablen, Arithmetik, die Verarbeitung von Zeichenketten, das DOM, Styling, Bilder, Animation, Nutzerinteraktion, Spiele, Listen, Sortieren, Filtern, Google Maps, Drag-and-Drop und visuelle Effekte behandelt. Das ist ein solides Fundament für den Bau echter Websites.

Alles, was Sie hier gelernt haben, lässt sich direkt auf den Bau vollständiger Webanwendungen übertragen. Die Seite ~link:background:Hintergrundinformationen~ bietet mehr über die Philosophie hinter ~ec~, und das Programmierer-Referenzhandbuch (klicken Sie auf das Buchsymbol oben) ist Ihre Anlaufstelle, um einen beliebigen Befehl nachzuschlagen.

Viel Freude beim Programmieren!
