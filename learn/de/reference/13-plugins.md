# Plugins

Ein Plugin ist eine externe Domäne — eine Code-Einheit, meist JavaScript oder Python, die AllSpeak neuen Wortschatz, neue Typen, Bedingungen und Laufzeitverhalten beiträgt, ohne Teil der gebündelten Laufzeit zu sein. Plugins folgen demselben Vertrag wie die gebündelten Domänen (Core, Browser, REST, MQTT, …); der Loader behandelt sie identisch.

Verwende ein Plugin, wenn:

- Ein Block spezialisierter Funktionalität (Grafik, Hardware-Integration, Drittanbieter-APIs) groß genug ist, um einen eigenen Wortschatz zu verdienen.
- Die Funktionalität nativen Code aufrufen muss (Browser-APIs, Systembibliotheken), den AllSpeak nicht direkt erreichen kann.
- Die Funktionalität leistungskritisch ist und mit nativer Geschwindigkeit laufen muss.
- Die Funktionalität optional sein soll — nur geladen, wenn ein Skript sie braucht.

Verwende stattdessen ein [Modul](modules.md), wenn die Erweiterung reines AllSpeak ist und keinen neuen Wortschatz einführt.

## Leistung: das Prinzip des gemischten Stapels

Ein häufiger Einwand gegen eine interpretierte Sprache auf einer anderen interpretierten Sprache (AllSpeak auf JS oder AllSpeak auf Python) ist, dass die Schichtung zu langsam sei. Der Einwand hat einen Kern Wahrheit, übersieht aber das Muster, das Plugins ermöglichen.

In den meisten Anwendungen ist Leistung nur in einem kleinen Teil des Codes wichtig. Der Rest — UI-Gerüst, Zustandsübergänge, Kontrollfluss, Nachrichtenrouting — profitiert weit mehr von Lesbarkeit und Wartbarkeit als von roher Geschwindigkeit. Diese Teile für Geschwindigkeit zu optimieren, ist schlechtes Engineering, selbst wenn es möglich wäre.

Was zählt, ist der heiße Pfad: die innere Schleife eines Grafik-Renderers, die FFT in einem Signalprozessor, der Layout-Durchlauf über Tausende Punkte. Dafür gibt AllSpeak an ein Plugin in JavaScript oder Python ab — Code, der mit derselben Geschwindigkeit läuft wie jedes Plugin in derselben Sprache für jedes andere Framework.

Das Ergebnis: AllSpeak-Skript für den Großteil (lesbar, wartbar, mehrsprachig), Plugins für den heißen Pfad (volle native Geschwindigkeit). Die Leistung der resultierenden Anwendung kommt einem rein nativen Build nahe, aber die Codebasis ist deutlich lesbarer und wartbarer.

Das ist ein architektonisches Kernprinzip von AllSpeak, keine nachträgliche Rettung. Der Plugin-Mechanismus existiert *weil* das Design gemischten Stapel-Entwicklung voraussetzt; er ist kein nachträglich angebautes Feature, um die Grenzen der interpretierten Ebene zu kaschieren.

## Der Vertrag

Beide Laufzeiten folgen einem gemeinsamen Plugin-Vertrag, dokumentiert in [`spec/allspeak-plugin-contract.md`](https://github.com/easycoder/allspeak.ai/blob/master/spec/allspeak-plugin-contract.md). Ein Plugin ist eine registrierte Domäne, die Folgendes bereitstellt:

- **Schlüsselwort-Handler** — `compile(...)` für die Parse-Zeit, `run(...)` für die Ausführungszeit.
- **Wert-Compiler / Runner** — für neue Werttypen (z. B. `der gps position`).
- **Bedingungs-Compiler / Tester** — für domänenspezifische Bedingungen (z. B. `wenn Subscriber ist connected`).

Fehlende Handler sind erlaubt — ein Plugin muss nicht jede Fähigkeit implementieren. Die Laufzeit verteilt anhand dessen, was registriert ist.

## JavaScript-Plugins

Ein JS-Plugin registriert sich, indem es an `AllSpeak.domain` anhängt:

```js
AllSpeak.domain.gmap = {
    name: 'AllSpeak_GMap',
    getHandler: function(token) { ... },
    run: function(program) { ... },
    value: {
        compile: function(compiler) { ... },
        get: function(program, value) { ... }
    },
    condition: {
        compile: function(compiler) { ... },
        test: function(program, condition) { ... }
    }
};
```

Plugins werden als separate `.js`-Dateien in `/dist/plugins/` ausgeliefert. Eine Seite, die eines nutzt, lädt es über ein `<script>`-Tag zusammen mit der AllSpeak-Laufzeit.

## Python-Plugins

Ein Python-Plugin wird zur Laufzeit des Skripts explizit geladen:

```as
importiere erweiterung GMap von `gmap.py`
```

Die Klasse leitet sich von einer `Handler`-Basis ab und stellt Schlüsselwort-Methoden mit der üblichen `k_<token>`- / `r_<token>`-Benennung bereit, plus `compileValue()`/`v_<type>` und `compileCondition()`/`c_<type>` für Werte bzw. Bedingungen. Die genauen Methodennamen stehen im Plugin-Vertrag.

## Mitgelieferte JS-Plugins

In `/js/plugins/`:

- **`ui`** — zusätzlicher UI-Wortschatz (Datumsauswahl, Panels usw.).
- **`svg`** — SVG-Zeichnen.
- **`gmap`** — Google Maps.
- **`float`** — erweiterte Gleitkomma-Unterstützung (wo das Ganzzahl-zuerst-Modell zu einschränkend ist).
- **`anagrams`**, **`life`** — Beispiel-Plugins, die den Vertrag demonstrieren.

MQTT startete als Plugin und wurde später zu einer gebündelten Domäne befördert. Derselbe Weg steht jedem Plugin offen, das sich als breit nützlich erweist.

## Plugins vs. Module

| | Plugin | Modul |
|---|--------|--------|
| Sprache | JS / Python | AllSpeak (`.as`) |
| Erweitert den Wortschatz | Ja | Nein |
| Erreicht native APIs | Ja | Nein (nur über Plugins) |
| Geladen über | `<script>`-Tag (JS) oder `importiere erweiterung` (Py) | `laufe <pfad> als <name>` |
| Kommunikation | Direkte Aufrufe über den Wortschatz | Nachrichtenübermittlung (`sende` / `bei nachricht`) |
| Am besten für | Spezialtechnik (Grafik, Hardware) | Große Teile reiner Skriptlogik |

Ein Plugin erweitert die Sprache; ein Modul erweitert die Anwendung. Beide haben ihren Platz.

## Anti-Muster: ein Plugin für reine AllSpeak-Logik

Wenn die Arbeit in AllSpeak hätte geschrieben werden können, ist ein [Modul](modules.md) meist die bessere Wahl — Module sind in sich geschlossen, aus AllSpeak heraus debugbar und brauchen keine nativen Build-Schritte. Plugins sind für den Fall, dass AllSpeak das Nötige nicht direkt ausdrücken kann.

## Anti-Muster: monolithische Plugins

Ein 5000-Zeilen-Plugin, das Grafik, Netzwerk und Speicher erledigt, ist ein Zeichen, dass die Grenze zu weit gezogen wurde. Teile es in fokussierte Plugins (jedes besitzt genau eine Sorge), und lass das Skript nur die laden, die es braucht.

## Siehe auch

- [Struktur](structure.md) — Domänen und das Modell „der Compiler probiert jede Domäne".
- [Module](modules.md) — der Erweiterungsmechanismus auf AllSpeak-Seite.
- Die Spezifikation des Plugin-Vertrags: `spec/allspeak-plugin-contract.md`.
