# Sammlungen

AllSpeak gibt dir mehrere Möglichkeiten, Daten zu sammeln, und die richtige Wahl prägt den Rest des Codes. Das konzeptionelle Modell ist über die Laufzeiten hinweg geteilt; die Oberflächensyntax einiger Operationen unterscheidet sich zwischen JS und Python (siehe die Tabelle am Ende).

## Die vier Formen

### 1. Variablen-Arrays — das Cursor-Modell

Die Standardform, ausführlich behandelt in [Variablen und Arrays](variables-and-arrays.md). Jede Variable ist implizit ein Ein-Element-Array; vergrößere es mit `setze die elemente von`; greife auf einen Platz zu, indem du den Cursor mit `indexiere X zu N` setzt.

```as
variable Counter
setze die elemente von Counter zu 5
indexiere Counter zu 2
lege 42 in Counter        ! schreibt in Counter[2]
```

Elemente können gemischte Typen haben. Das Cursor-Modell ist AllSpeaks Markenzeichen; greife dazu, wenn mehrere Variablen parallel dieselbe Arbeit erledigen (z. B. ein Button, seine Beschriftung und sein Handler-Index als parallele Arrays).

### 2. Objekt-Eigenschaften

Jedes Objekt — ein typisiertes Objekt wie ein Button oder div, oder eine Variable, die als Objekt initialisiert wurde — kann beliebige benannte Eigenschaften tragen:

```as
knopf Save
erstelle Save in Container
setze eigenschaft `rank` von Save zu `primary`
wenn eigenschaft `rank` von Save ist `primary` beginn
    ! ...
ende
```

Eigenschaften sind Schlüssel-Wert-Metadaten, die an ein Objekt angehängt sind. Verwende sie für spärliche, semantische Fakten, die zum Objekt selbst gehören statt in eine separate Struktur.

### 3. Schlüssel/Wert-Sammlungen (Wörterbücher)

Für eine Abbildung von Zeichenketten-Schlüsseln auf Werte bietet AllSpeak eine Wörterbuch-Form. **Die beiden Laufzeiten verwenden unterschiedliche Schlüsselwörter, und sie sind nicht austauschbar.**

**Python** — typisierte `dictionary`-Deklaration, `eintrag`-Schlüsselwort:

```as
dictionary Spec
reset Spec
setze eintrag `width` von Spec zu 100
setze eintrag `colour` von Spec zu `blue`
lege eintrag `width` von Spec in Width
```

**JS** — generische `variable`, die als Objekt initialisiert wird, `eigenschaft`-Schlüsselwort (JS hat keine `dictionary`-Deklaration):

```as
variable Spec
setze Spec zu objekt
setze eigenschaft `width` von Spec zu 100
setze eigenschaft `colour` von Spec zu `blue`
lege eigenschaft `width` von Spec in Width
```

Das mentale Modell ist dasselbe — eine Abbildung von Schlüsseln auf Werte, die verschachtelte Strukturen akzeptiert — aber die Oberflächensyntax ist laufzeitspezifisch. **Bring JS-Stil `variable X` + `setze eigenschaft K von X` nicht in Python-Skripte.** Es mag funktionieren, weil Pythons `setze eigenschaft` *auch* in ein automatisch erzeugtes Dict auf der Variable schreibt, aber: (a) der Typ ist undeclared, sodass die Laufzeit Fehler nicht früh fangen kann, (b) `eigenschaft` ist in Python auch eine Metadaten-Ebene (siehe Zeile 4 der JS-vs-Python-Tabelle unten), was bedeutet, dass dasselbe Schlüsselwort zwei Dinge gleichzeitig tut und sich auf unerwartete Weise zurückliest, und (c) es ignoriert das kanonische Python-Idiom, das Tooling und Review erwarten.

Auf Python: schreibe `dictionary X; reset X; setze eintrag K von X zu V`. Auf JS: schreibe `variable X; setze X zu objekt; setze eigenschaft K von X zu V`.

Um ein Wörterbuch zu durchlaufen, materialisiere zuerst seine Schlüssel in eine Liste und gehe die Liste ab. Es gibt keinen direkten `indexiere`-Zugriff auf Wörterbücher; siehe [Ein Wörterbuch durchlaufen](../idioms/03-looping-patterns.md#iterating-a-dictionary) für das kanonische Muster.

### 4. Geordnete Sequenzen (Listen)

Für eine homogen typisierte Folge von Werten:

**Python** — typisierte `list`-Deklaration:

```as
list Items
reset Items
setze element 0 von Items zu `first`
setze element 1 von Items zu `second`
lege element 0 von Items in First
```

**JS** — generische `variable`, die als Array initialisiert wird:

```as
variable Items
setze Items zu feld
setze element 0 von Items zu `first`
setze element 1 von Items zu `second`
lege element 0 von Items in First
```

## Falle: Das Cursor-Modell nicht mit `setze X zu feld` / `setze X zu objekt` vermischen

Die beiden Muster sehen benachbart aus, sind aber verschiedene Ebenen. `setze die elemente von X zu N` macht X zu einer Mehr-Platz-Variable, und der Cursor wählt aus, auf welchem Platz du arbeitest. `setze X zu feld` (oder `setze X zu objekt`) setzt den *Wert des aktuellen Platzes* auf einen JSON-Container. Diese sind unabhängig. Genau hier geht KI-geschriebener Code am häufigsten falsch:

```as
! FALSCH — sieht vernünftig aus, tut aber nicht, was du erwartest
variable Bucket
setze Bucket zu feld                ! Cursor-Platz = []
setze die elemente von Bucket zu 1  ! keine Wirkung; der Platz hält weiterhin []
indexiere Bucket zu 0
lege Row in Bucket                  ! der Cursor-Platz ist jetzt Row (die [] sind weg)
rest poste Bucket zu URL            ! postet Row, nicht [Row]
```

`lege V in X` schreibt V in den Cursor-Platz und ersetzt, was dort war — genau so, als wäre X eine unbenutzte Variable gewesen. Die Laufzeit behandelt jeden Platz einheitlich; sie weiß nichts darüber und kümmert sich nicht darum, dass du den Platz zuvor als Array initialisiert hast. Um zu einem JSON-Array hinzuzufügen, das im Cursor-Platz liegt, verwende das Array-bewusste Schlüsselwort:

```as
! RICHTIG — das Array intakt lassen
variable Bucket
setze Bucket zu feld
json addiere Row zu Bucket          ! Cursor-Platz = [Row]
rest poste Bucket zu URL            ! postet [Row]
```

Oder, wenn du Positionskontrolle brauchst:

```as
setze element 0 von Bucket zu Row   ! Cursor-Platz = [Row]
setze element 1 von Bucket zu OtherRow
```

Der Cursor (`indexiere X zu N`) adressiert *Plätze von X*. Die Element-/Eigenschafts-Schlüsselwörter (`setze element N von`, `setze eigenschaft K von`, `json addiere … zu`) adressieren *innerhalb des JSON-Werts, den der aktuelle Platz hält*. Sie überlappen sich nie.

## Eine Form wählen

Die Wahl hängt meist vom Zugriffsmuster ab:

- **Nach Position, mit parallelen Datensätzen** → Variablen-Array. Das Cursor-Modell koordiniert mehrere Variablen, die im Gleichschritt laufen.
- **Nach Position, als einzelne Sequenz** → Liste (oder `setze X zu feld` in JS).
- **Nach Zeichenketten-Schlüssel** → Wörterbuch (oder `setze X zu objekt` in JS).
- **Als Metadaten an einem Objekt** → Eigenschaft.

Eine häufige Verwechslung: Variablen-Arrays sehen aus wie Listen, sind es aber nicht. Variablen-Arrays geben über einen Cursor jeweils ein Element preis; Iteration ist eine `solange`-Schleife mit einem wandernden Index. Listen geben alle Elemente als Sequenz preis und unterstützen die Iteration über die ganze Sequenz. Greife zu einem Variablen-Array, wenn die Elemente mit anderen Variablen koordiniert sind (`Button`, `Caption`, `Handler` alle parallel). Greife zu einer Liste, wenn die Elemente nur eine Sequenz ohne parallele Struktur sind.

## JS vs Python

| Konzept | JS | Python |
|---------|-----|--------|
| Variablen-Array | `variable X` + `setze die elemente von X zu N` | dasselbe |
| Wörterbuch | `variable X` + `setze X zu objekt`; `eigenschaft K von X` | `dictionary X`; `reset X`; `eintrag K von X` |
| Liste | `variable X` + `setze X zu feld`; `element N von X` | `list X`; `reset X`; `element N von X` |
| Objekt-Eigenschaft | `setze eigenschaft K von X zu V` — derselbe Mechanismus wie Wörterbuch-Zugriff; die Variable muss als Objekt gesetzt sein | `setze eigenschaft K von X zu V` — eine separate Metadaten-Ebene, unabhängig von jedem Wert, den die Variable hält |

Python hat explizitere Typdeklarationen, ein eigenes `eintrag`-Schlüsselwort für den Wörterbuch-Zugriff und behandelt Objekt-Eigenschaften als eine Ebene, die mit dem Wert der Variable koexistiert. JS speichert Wörterbuch- und Listeninhalte als JSON-förmige Daten innerhalb einer `variable` und verwendet `eigenschaft` für den Schlüsselzugriff; es gibt in JS keinen Unterschied zwischen einem Wörterbuch-Eintrag und einer Objekt-Eigenschaft. Beide Implementierungen unterstützen beliebig verschachtelte Strukturen.

Entscheidend: **die JS-Spalte ist kein gültiger Fallback beim Schreiben von Python**, und umgekehrt. Die Laufzeiten überschneiden sich nur in Zeile 1 (Variablen-Arrays). Wenn du ein Python-Skript schreibst und zu `variable X; setze X zu objekt; setze eigenschaft K von X zu V` greifst, hast du das JS-Muster importiert: Es mag ohne Fehler ausführen, aber der resultierende Code ist untypisiert, verhält sich um die Metadaten-Eigenschafts-Ebene herum unerwartet und liest sich nicht so zurück wie die Python-`eintrag`-Form. Wähle die Spalte für deine Laufzeit und bleib darin.

## Siehe auch

- [Variablen und Arrays](variables-and-arrays.md) — das Cursor-Modell im Detail.
- [Eine Sammlungsform wählen](../idioms/picking-a-collection-shape.md) — ausgearbeitete Beispiele für die Wahl.
- [Browser und Webson](browser-and-webson.md) — DOM-Elemente sind typisierte Objekte mit Eigenschaften.
