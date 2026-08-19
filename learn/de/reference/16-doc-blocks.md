# Dokumentationsblöcke

Ein Dokumentationsblock ist eine strukturierte Prosa-Erklärung, die an einen Abschnitt von `.as`-Code angehängt ist. Die Konvention existiert, um genaues Lesen zu erzwingen: Das *Warum* aufzuschreiben zwingt dich, wahrzunehmen, was der Code tatsächlich tut, und Prüfer sehen, was der Autor beabsichtigt hat, ohne es aus Variablennamen ableiten zu müssen.

Dokumentationsblöcke sind pro Datei optional, aber Pflicht, sobald eine Datei sie übernimmt — eine Datei ohne einen einzigen Dokumentationsblock gilt als abgemeldet, ohne Warnungen in beide Richtungen.

## Struktur

Ein Dokumentationsblock umschließt einen zusammenhängenden Code-Abschnitt, beginnt mit einer oder mehreren `!!`-Prosa-Zeilen und endet mit `!!!` (drei Ausrufezeichen):

```as
!! Kurze Erklärung, was dieser Abschnitt tut und warum er existiert.
!! Nutze nach Bedarf mehrere !!-Zeilen. Eine nackte !!-Zeile ist ein Absatzumbruch.
Section:
    ! der Code
    retourniere
!! @hash <managed>
!!!
```

- `!!` öffnet oder setzt einen Dokumentationsblock fort. Jede `!!`-Zeile ist ein Prosa-Absatz. Ein nacktes `!!` (ohne folgenden Text) ist ein Absatzumbruch.
- `!!!` (drei Ausrufezeichen) beendet den Block.
- `@hash` ist eine Metadaten-Zeile, die der Analysator einfügt und pflegt; schreibe sie nicht von Hand.

Der Block umschließt den Code, sodass Prosa und Code eine logische Einheit bilden.

## Die Prosa schreiben

Führe mit dem **Warum**, der Design-Beschränkung oder dem nicht-offensichtlichen Kontext an — nicht mit einer Paraphrase des Codes. Der Leser kann sehen, was der Code tut; die Prosa ergänzt, was der Code nicht sagen kann:

- Warum dieser Abschnitt existiert.
- Welche Invarianten er erhält.
- Was er bewusst NICHT tut.
- Wie frühere Versuche aussahen.

Vermeide es, das Offensichtliche zu wiederholen. Vermeide Zeile-für-Zeile-Kommentare; dafür sind die `!`-Endkommentare da, wenn überhaupt welche nötig sind.

**Der erste Satz auf einer eigenen Zeile, mit einem Absatzumbruch danach.** Der Eröffnungssatz sollte allein als einzeilige Zusammenfassung stehen, wofür der Abschnitt ist. Lass ein nacktes `!!` (Absatzumbruch) folgen, dann weitere Details. Das macht den Blocks-Modus auf einen Blick lesbar — der Leser sieht neben dem Code einen knappen Satz, mit der Ausführung darunter für den Fall, dass mehr nötig ist.

```
!! Erzeuge das 4x3-Raster: erstelle 12 Zellen und bereite den Farbzustand jeder Zelle vor.
!!
!! Befestige an Board, dann 12-mal durchlaufen — `indexiere Cell zu N` gefolgt von `erstelle Cell in Board` baut die N-te Zelle. Das parallele ColourIndex-Array startet jede Zelle bei 0 (grau).
```

Nicht so:

```
!! Erzeuge das 4x3-Raster und bereite den Zustand jeder Zelle vor. Befestige an Board, erzeuge 12 schlichte Cell-divs als seine Kinder — jede bekommt einen grauen Hintergrund, eine dünne schwarze Umrandung und ein Seitenverhältnis von 1, um quadratisch zu bleiben — und initialisiere das parallele ColourIndex-Array für jede Zelle auf 0, sodass alle im grauen Zustand starten. Registriere schließlich einen gemeinsamen Klick-Handler …
```

Die Textwand-Form schiebt Details hinein, die im Code schon sichtbar sind (die Farbe, die Umrandung, die Array-Initialisierung) und verdrängt das *Warum*. Die zweizeilige Form gibt dem Leser eine Zusammenfassung, die er nutzen kann, ohne weiterzulesen.

**Ein Absatz = eine Zeile.** Jeder Prosa-Absatz ist eine einzelne `!!`-Zeile, egal wie lang. Füge keine harten Zeilenumbrüche für die visuelle Umbrechung ein — sie rendern im Blocks-Modus schlecht (der automatisch umbricht) und kämpfen beim Bearbeiten gegen dich. Nutze ein nacktes `!!`, um Absätze zu trennen.

Beginne keine Prosa-Zeile mit `@hash` oder `@verified`; das sind reservierte Metadaten-Tokens. Setze sie in Anführungszeichen („`@verified`"), wenn du die Namen erwähnen musst.

## Der `@hash`-Mechanismus

Jeder Dokumentationsblock enthält einen Hash des umschlossenen Codes als `@hash <managed>`. Der Analysator pflegt ihn. Nach jeder Code-Änderung in einem Block aktualisierst du die Hashes:

```
python3 tools/asdoc-check.py --write <datei>
```

Ein veralteter Hash bedeutet, dass der Code sich geändert hat, ohne dass die Prosa erneut geprüft wurde — der Analysator markiert es als Warnung. Der Autor liest die Prosa erneut, entscheidet, ob sie den Code noch genau beschreibt, und bearbeitet entweder die Prosa oder markiert den Block als verifiziert.

## Der `@verified`-Mechanismus

`@verified` ist eine stärkere Aussage als `@hash` allein — ein bewusstes Signal, dass ein Mensch den Code und die Prosa zusammen gelesen und die Paarung gebilligt hat. Der verifizierte Hash ist danach gesperrt. Spätere Code-Änderungen brechen die Verifizierung (`verified-stale`) und erfordern einen frischen menschlichen Durchgang.

Der Blocks-Modus von Asedit bietet dafür einen Ein-Klick-Button „Als verifiziert markieren".

## Abmelden: Dateien ohne Dokumentationsblöcke

Eine Datei ganz ohne Dokumentationsblöcke gilt als abgemeldet — keine Fehler, keine Warnungen. So kann die Konvention Datei für Datei übernommen werden, während du bestehenden Code anfasst, ohne einen Flag Day über die ganze Codebasis zu erzwingen.

Sobald eine Datei einen Dokumentationsblock hat, erwartet der Analysator, dass die ganze Datei abgedeckt ist: Nachfolgende unumschlossene Abschnitte tauchen als Warnungen auf.

## Validatoren

Zwei Werkzeuge validieren dieselbe Konvention:

- `tools/asdoc-check.py` — Python-CLI; rekursiv über ein Verzeichnis. Mit `--write` ausführen, um Hashes aufzufrischen.
- `tools/asdoc-check-cli.as` — läuft unter der Python-AllSpeak-Laufzeit und übt dieselbe Logik aus AllSpeak heraus.

Der Blocks-Modus von Asedit validiert auch beim Tippen im Editor.

## Beim Dokumentieren prüfen

Dokumentationsblöcke zu bestehendem Code hinzuzufügen sollte ein Prüfdurchgang sein, nicht nur ein Dokumentationsdurchgang. Während du jeden Abschnitt genau genug liest, um seine Prosa zu schreiben, bring auch alles zur Sprache, was daneben aussieht:

- **Unerreichbare Symbole** — Unterroutinen oder Labels ohne Aufrufer; Variablen, die deklariert, aber nie zugewiesen sind, oder zugewiesen, aber nie gelesen.
- **Toter Code** — Zweige, die nie genommen werden können; Zeilen nach einem unbedingten `stoppe`/`beende`/`retourniere`, auf die nichts springt.
- **Verdächtige Muster** — duplizierte Logik, hartkodierte Werte, die wie Variablen aussehen, versteckte Kopplung zwischen Abschnitten.
- **Doku/Code-Widersprüche** — Kommentare, Namen oder nahe Dokumentation, die dem widersprechen, was der Code tatsächlich tut.

Bringe Befunde als kurze Liste am Anfang der Antwort, getrennt von den Dokumentationsblock-Bearbeitungen. Korrigiere sie nicht stillschweigend — lass den Autor entscheiden.

Der Sinn der Konvention ist, genaues Lesen zu erzwingen; zu berichten, was dieses Lesen zutage gefördert hat, ist der natürliche Lohn.

## Siehe auch

- [Symbole und Layout](symbols-and-layout.md) — `!!` und `!!!` als lexikalische Marker.
- [Struktur](structure.md) — Dokumentationsblöcke werden entfernt, bevor die Domänen-Compiler irgendetwas sehen.
