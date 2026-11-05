# Bedingungen

Eine Bedingung ist etwas, das zu wahr oder falsch ausgewertet wird. AllSpeak verwendet schlüsselwortgetriebene Bedingungen; es gibt keine Infix-Vergleichsoperatoren (`==`, `!=`, `>`, `<`, `>=`, `<=`) — tatsächlich sind praktisch alle Satzzeichen per Design untersagt. AllSpeak zielt darauf ab, **sprechbar** zu sein: jedes Konstrukt liest sich wie gesprochenes Deutsch.

Diese Datei listet Cores Bedingungs-Wortschatz auf, den `wenn` und `solange` verbrauchen. Domänen und Plugins können eigene Bedingungen beisteuern — siehe [Struktur](structure.md).

## Gleichheit und Vergleich

`ist` testet Gleichheit:

```as
wenn Counter ist 0 ...
wenn Name ist `admin` ...
```

`ist nicht` testet Ungleichheit. Für Sprachen, deren Grammatik es bevorzugt, wird auch `nicht ist` akzeptiert:

```as
wenn Status ist nicht `error` ...
```

Numerischer Vergleich verwendet `ist kleiner als` und `ist größer als`:

```as
wenn Count ist größer als 0 ...
wenn Index ist kleiner als die länge von List ...
```

Für ≤ und ≥ kehre den Test um — es gibt keine expliziten `ist höchstens` / `ist mindestens`-Schlüsselwörter:

```as
wenn Score ist nicht kleiner als 60 ...        ! ≥ 60
wenn Items ist nicht größer als Max ...        ! ≤ Max
```

## Häufige Fehler mit C-Stil-Operatoren

AllSpeak verwendet englische Schlüsselwort-Bedingungen. C-Stil-Operatoren sind **nicht gültig**:

| Falsch (C-Stil) | Richtig (AllSpeak) |
|---|---|
| `if X == 0` | `wenn X ist 0` |
| `if X != 0` | `wenn X ist nicht 0` |
| `if X > 5` | `wenn X ist größer als 5` |
| `if X < 5` | `wenn X ist kleiner als 5` |
| `if X >= 5` | `wenn X ist nicht kleiner als 5` |
| `if X <= 5` | `wenn X ist nicht größer als 5` |

Die Schlüsselwort-Formen lesen sich von links nach rechts in natürlicher Sprache. Ein KI-Autor, der standardmäßig C-Stil-Operatoren verwendet, erzeugt ungültigen Code — verwende immer die Schlüsselwort-Formen.

## Häufige Fehler beim Vergleich von Zeichenkette vs. Zahl

`ist` vergleicht Werte standardmäßig als Text. Beim Vergleich einer Zeichenkette wie `"04"` mit einer Zahl ist der Vergleich lexikalisch (Zeichen für Zeichen), nicht numerisch:

```as
wenn Mm ist nicht kleiner als `04`     ! Zeichenketten-Vergleich — funktioniert für „05", bricht aber bei „10" < „04"
```

Für einen numerischen Vergleich verwende `der wert von`, um die Zeichenkette zuerst in eine Zahl zu konvertieren:

```as
wenn der wert von Mm ist nicht kleiner als 4    ! numerischer Vergleich — funktioniert für alle Werte
```

`der wert von X` wird in [Werte und Typen](values-and-types.md) dokumentiert.

## Negation

Negiere eine Bedingung mit `nicht` am Anfang oder verwende `ist nicht` innerhalb der Bedingung:

```as
wenn nicht Clicked ...
wenn Count ist nicht 0 ...
```

Es gibt keine Negation mit Klammern — `wenn nicht (Count ist 0)` ist kein gültiges AllSpeak. Verwende stattdessen `wenn Count ist nicht 0`.

## Boolean-Tests

Ein nackter Wert ist ein Wahrheitstest:

```as
wenn Clicked ...                      ! wahr, wenn Clicked wahrheitsgemäß ist
wenn Found setze den inhalt von Status zu `OK`
```

Für einen expliziten Boolean-Test:

```as
wenn Clicked ist wahr ...
wenn Clicked ist falsch ...
```

## Geräte- und Bildschirmbedingungen

Der Browser liefert drei Booleans — `mobil`, `hochformat` und `querformat` — damit ein Layout sich vor dem Aufbau nach dem Gerät richten kann. Es sind gewöhnliche Werte, also verbinden `und` und `oder` sie:

```as
wenn mobil und hochformat setze Mobile
wenn querformat ...
wenn nicht mobil ...
```

`mobil` testet den **User-Agent**: wahr für Android, BlackBerry, iOS (iPhone, iPad, iPod), Opera Mini, IEMobile und WPDesktop. `hochformat` und `querformat` testen die **Form des Viewports** — `hochformat` ist wahr, wenn die Client-Breite des Dokuments kleiner ist als seine Höhe, und `querformat` ist der andere Fall.

Zwei Konsequenzen überraschen. `wenn mobil und hochformat` heißt „ein mobiler Browser im Hochformat“, nicht „ein schmales Fenster“: Ein schmales Desktop-Fenster ist nicht mobil, und ein iPad, das die Desktop-Seite anfordert, meldet einen Macintosh-User-Agent, ist also auch nicht mobil. Und das sind Tests, keine Listener — die Antwort wird gelesen, wenn die Zeile läuft, also behält eine beim Start getroffene Verzweigung ihre Antwort, und eine Drehung führt sie nicht erneut aus.

Dieses Vokabular gibt es nur im Browser: Die Python-Laufzeit hat keinen Viewport, ein Skript, das es verwendet, ist ein Browser-Skript.

## Typ-Tests

`ist numerisch` testet, ob ein Wert als Zahl verwendet werden kann:

```as
wenn Input ist numerisch ...
```

`ist ein feld` und `ist ein objekt` testen, ob ein Wert eine JSON-förmige Sammlung hält:

```as
wenn Response ist ein feld ...
wenn Config ist ein objekt ...
```

`ist gerade` und `ist ungerade` testen die Parität:

```as
wenn Counter ist gerade ...
```

## Zeichenketten-Bedingungen

`enthält` testet das Vorhandensein einer Teilzeichenkette:

```as
wenn Path enthält `/api/` ...
wenn Email enthält `@` ...
```

`beginnt mit` und `endet mit` testen Präfix/Suffix:

```as
wenn Name beginnt mit `Dr ` ...
wenn File endet mit `.json` ...
```

## Zusammengesetzte Bedingungen

`und` und `oder` verbinden zwei Bedingungen:

```as
wenn Count ist größer als 0 und Count ist kleiner als 100 ...
wenn Status ist `error` oder Status ist `timeout` ...
```

Es gibt keine Operator-Präzedenz zwischen `und` und `oder` — verwende separate `wenn`-Anweisungen oder verschachtelte `beginn`/`ende`-Blöcke, um komplexe Logik zu disambiguieren.

Eine Zwei-Bedingungen-Kette ist meist lesbar. Bei drei oder mehr erwäge, Bedingungen in Boolean-Variablen zu extrahieren:

```as
wenn Count ist größer als 0
    und Count ist kleiner als 100
    und Status ist nicht `error` ...
```

## Siehe auch

- [Werte und Typen](values-and-types.md) — Wahrheit/Falschheit-Regeln, das numerische Flag, `der wert von`.
- [Zeichenketten und Text](strings-and-text.md) — `enthält`, `beginnt mit`, `endet mit`.
- [Kontrollfluss](control-flow.md) — `wenn`, `solange`, `beginn`/`ende`.
- [Browser und Webson](browser-and-webson.md) — das DOM, das diese Entscheidungen meist aufbauen oder gestalten.
