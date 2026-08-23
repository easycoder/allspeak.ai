# Testen

AllSpeaks Testvokabular ist bewusst klein: `check` prüft eine Tatsache, `test … ende test` gruppiert zusammengehörige Prüfungen zu einem benannten Fall, und der `--test`-Laufmodus macht aus einem Skript eine Testsuite mit einer Zusammenfassung und einem brauchbaren Exit-Code. Das Vokabular läuft in beiden Implementierungen (JS und Python) und in jeder Sprache, sobald das Sprachpaket die Schlüsselwörter übersetzt.

## `check` — eine Prüfung

`check dass <bedingung>` wertet eine Bedingung aus und meldet das Ergebnis. Die Bedingungsgrammatik ist exakt die von `if` — Gleichheit, Vergleich, Vorhandensein sowie `und`- und `oder`-Kombinationen funktionieren alle unverändert:

```as
variable ZimmerZahl
variable A
variable B
lege 4 in ZimmerZahl
lege 1 in A
lege 2 in B

check dass ZimmerZahl ist 4
check dass ZimmerZahl ist kleiner als 6
check dass ZimmerZahl ist numerisch
check dass A ist 1 und B ist 2
```

Das Wort `dass` ist ein natürlicher Bindepartikel und kann weggelassen werden:

```as
check ZimmerZahl ist 4
```

- **Bestanden** — wird still vermerkt; es wird nichts ausgegeben.
- **Fehlgeschlagen** — wird vermerkt und eine Meldung über den normalen Log-Kanal ausgegeben:

  ```
  FAIL: ZimmerZahl ist 5 (terminplan.as:12)
  ```

  Der eingeklammerte Teil ist der Skriptname (wie mit `script <name>` gesetzt, sonst der Dateiname) und die Zeilennummer der Prüfung. Nach der Meldung läuft die Ausführung **weiter** — eine fehlgeschlagene Prüfung ist ein Bericht, kein Absturz.

Prüfungen außerhalb eines `test`-Blocks gehören zu einem impliziten Standardfall; sie zählen in die Gesamtsumme, werden aber nicht als benannter Test aufgelistet.

## `test … ende test` — ein benannter Fall

`test <name> … ende test` gruppiert Anweisungen zu einem benannten Fall. Der Name ist ein Wert (meist ein Literal):

```as
variable ZimmerZahl
lege 1 in ZimmerZahl

test `Raum hinzufügen`
    check dass ZimmerZahl ist 1
ende test
```

- Der Rumpf darf beliebige Anweisungen enthalten — Vorbereitung, Prüfungen, `gosub`s, `beginn … ende`-Blöcke.
- `test`-Blöcke sind ein Anweisungspaar wie `beginn … ende`; sie dürfen nicht verschachtelt werden.
- Außerhalb des `--test`-Modus sind sie eine transparente Gruppierung: Prüfungen darin verhalten sich exakt wie freie Prüfungen (Fehlschläge loggen `FAIL` und laufen weiter).

## Fehlerklauseln — `oder` und `on failure`

`check` akzeptiert dieselben Fehlerklauseln wie die fehlschlagfähigen Befehle, mit ihrer dokumentierten Semantik:

```as
variable X
lege 3 in X

check dass X ist 3 on failure gosub FixUp    ! Fehlschlag vermerken, FixUp ausführen, weitermachen
check dass X ist 3 oder gosub Cleanup        ! Fehlschlag vermerken, Cleanup ausführen, diesen Test beenden
```

- `on failure <aktion>` — die Prüfung schlägt fehl, die Aktion läuft, und die Ausführung geht bei der nächsten Anweisung weiter.
- `oder <aktion>` — die Prüfung schlägt fehl, die Aktion läuft, und der aktuelle `test`-Block endet sofort (als fehlgeschlagen vermerkt). Außerhalb eines `test`-Blocks beendet `oder` das Skript wie ein nacktes `stop`.

Innerhalb der Aktion hält `der fehler` die Fehlermeldung.

## `--test` — der Laufmodus

Die Python-CLI führt ein Skript (oder ein ganzes Verzeichnis) als Testsuite aus:

```
allspeak --test terminplan.as
allspeak --test konformanz/tests/
```

Ein Verzeichnis führt jede `.as`-Datei als eigene Suite aus und gibt dann eine Gesamtzeile aus. Im Testmodus wird die Zusammenfassung bei `beende` (oder am Skriptende) ausgegeben:

```
Test suite: schedule.as
  ✓ Adding a room (2 checks)
  ✗ Advance roll-over (FAIL: the room count is 4 — line 12)
  ✓ Boost expiry (3 checks)

3 tests, 2 passed, 1 failed — 7 checks, 6 passed, 1 failed
```

Die Zeile pro Fall zeigt Namen und Ergebnis; bei einem fehlgeschlagenen Fall die erste fehlgeschlagene Bedingung samt Zeile, bei einem Fall mit Fehler die Fehlermeldung:

```
  ✗ Advance roll-over (error: Arithmetic error in divide: integer division or modulo by zero)
```

### Fehler-Isolation

Im `--test`-Modus bricht ein unbehandelter Laufzeitfehler innerhalb eines `test`-Blocks den Lauf nicht ab. Der Fall wird als **fehlgeschlagen mit Fehler** vermerkt und der Laufmodus springt zum nächsten Block — ein kaputter Fall versteckt die anderen nicht:

```as
variable X
lege 5 in X

test `Fehlerhafter Fall`
    dividiere 10 durch 0 ergibt X    ! Laufzeitfehler — Fall als fehlerhaft vermerkt
    check dass X ist 1               ! wird übersprungen
ende test
test `Läuft trotzdem`                ! dieser Block wird weiter ausgeführt
    check dass X ist 5
ende test
```

Welche Anweisungen einen Laufzeitfehler auslösen, unterscheidet sich zwischen den beiden Laufzeiten: Die Python-Laufzeit meldet einen Fehler bei der Division durch null, die JS-Laufzeit bei nicht-numerischer Arithmetik (z. B. `addiere 1 zu` einem Textwert). In beiden Fällen wird der Fall als fehlerhaft vermerkt und der Laufmodus macht weiter.

Ein Fehler außerhalb eines `test`-Blocks beendet das Skript weiterhin (der Lauf selbst ist kaputt).

### Exit-Codes

| Code | Bedeutung |
|------|-----------|
| 0 | jede Prüfung bestanden, kein Test mit Fehler |
| 1 | mindestens eine Prüfung fehlgeschlagen oder ein Test mit Fehler |
| 2 | das Skript konnte nicht kompiliert oder ausgeführt werden |

### Die JS-Laufzeit

Die JS-Laufzeit läuft im Browser und hat keine CLI. Vokabular und Zusammenfassung sind identisch; der Host aktiviert den Testmodus, indem er das Laufzeit-Flag vor dem Start setzt:

```js
AllSpeak.testMode = true;
AllSpeak.start(scriptSource);
```

Mit gesetztem Flag isolieren `test`-Blöcke Fehler und bei `exit` wird eine Zusammenfassung in die Debug-Konsole geschrieben, die die Ausgabe des Python-Laufmodus spiegelt.

## Verwandte Themen

- [Bedingungen](06-conditions.md) — jede Bedingung, die `check` akzeptiert.
- [Fehler und Wiederherstellung](10-errors-and-recovery.md) — `oder`- vs. `on failure`-Semantik, geteilt mit den fehlschlagfähigen Befehlen.
