# Mehrsprachigkeit

AllSpeak lässt Menschen Code in ihrer eigenen Sprache schreiben. Ein französisches `.as`-Skript und ein englisches `.as`-Skript kompilieren zu demselben internen Programm und laufen auf derselben Engine; nur der Quellwortschatz ändert sich.

Dieses Dokument beschreibt, wie die Mehrsprachigkeits-Ebene funktioniert. Für Leitlinien zum Schreiben von Skripten, deren *Logik* eine Übersetzung überlebt (englisch-zentrierte Datenform-Annahmen, Wortstellungs-Eigenheiten usw. vermeiden), siehe [Sprachneutral schreiben](../idioms/writing-language-neutral.md).

## Die `language`-Direktive

Ein Skript kann die Sprache seines Wortschatzes in der ersten Zeile deklarieren:

```as
language français

alerte `Bonjour, tout le monde !`
```

```as
language italiano

avviso `Ciao, mondo!`
```

```as
language deutsch

alarm `Hallo, Welt!`
```

Die Direktive sagt dem Compiler, welches Sprachpaket er laden soll. Wenn sie fehlt, wird Englisch angenommen:

```as
alert `Hello, world!`
```

Alle drei lokalisierten Beispiele oben kompilieren zu derselben internen alarm-mit-Zeichenkette-Operation und laufen auf derselben Engine.

## Was ein Sprachpaket ist

Ein Sprachpaket ist eine Abbildung von kanonischen (internen) Tokens auf eine oder mehrere Oberflächenformen der Zielsprache. Es deckt sechs Kategorien ab:

- **Opcodes** — Verb-Schlüsselwörter wie `drucke`, `setze`, `wenn`.
- **Verknüpfer** — kleine grammatische Wörter wie `zu`, `in`, `von`, `mit`.
- **Literale** — Schlüsselwörter, die Werte erzeugen: `wahr`, `falsch`, `jetzt`, `heute`, `zeilenumbruch`.
- **Zeiteinheiten** — `sekunden`, `millisekunden`, `ticks`.
- **Bedingungen** — `ist`, `ist kleiner als`, `enthält` usw.
- **Wörter** — Artikel, Partikel, alles andere Übersetzbare.

Wo die Pakete liegen:

- **JS:** `js/allspeak/LanguagePack_<code>.js` — z. B. `LanguagePack_fr.js`.
- **Python:** `allspeak-py/allspeak/languages/<code>.json` — z. B. `fr.json`.

Die beiden werden synchron gehalten — dieselben kanonischen Tokens bilden für eine gegebene Sprache in beiden Laufzeiten auf dieselben Oberflächenformen ab.

## Wie die Compiler-Pipeline das Paket nutzt

Der Ablauf während der Kompilierung:

```
Quell-Token  →  AllSpeak_Language.reverseWord()  →  kanonisches Token  →  Domänen-Compiler
```

Wenn der Compiler ein Token aus der Quelle liest, schlägt die Sprachebene es im Reverse-Index des aktiven Pakets nach und liefert die kanonische Form. `alerte` → `alert`, `avviso` → `alert`, `alert` → `alert`. Die Domänen-Compiler (Core, Browser usw.) arbeiten rein mit kanonischen Tokens.

Domänen sehen nie lokalisierte Tokens. Deshalb erzeugen ein französisches und ein englisches Skript dasselbe Programm-Array: Beide reduzieren sich auf denselben kanonischen Tokenstrom, bevor irgendein Domänencode läuft.

## Mehrere Oberflächenformen pro kanonischem Wort

Ein Paket-Eintrag kann ein kanonisches Wort auf mehrere Oberflächenformen abbilden — nützlich für Sprachen mit grammatischer Beugung. Die Formen werden mit senkrechten Strichen getrennt:

```
"the": "il|lo|la|gli|le"
```

Der Compiler akzeptiert jede der gelisteten Formen; die kanonische Form ist das, was nachgelagert weitergereicht wird. Der `word()`-Lookup liefert die erste Form (die primäre Schreibweise für die Ausgabe); `wordForms()` liefert die ganze Liste (zum Abgleichen während der Kompilierung).

## Derzeit mitgelieferte Sprachen

Beide Laufzeiten liefern vier Pakete mit:

- **Englisch** (`en`) — das Original; der Standard, wenn keine `language`-Direktive vorhanden ist.
- **Italienisch** (`it`) — vollständig ausgeliefert.
- **Französisch** (`fr`) — vollständig ausgeliefert.
- **Deutsch** (`de`) — vollständig ausgeliefert.

Die vier wurden für die Öffentlichkeitsarbeit gegenüber UN-Organisationen gewählt. Die Abdeckung von Französisch und Deutsch ist breit; einige Übersetzungen werden noch verfeinert.

## Sprachneutrale Logik schreiben

Sprachneutraler *Wortschatz* kommt automatisch vom Paket. Sprachneutrale *Logik* — Skriptstruktur, die keine englischen Annahmen über Wortstellung, Datenform oder kulturelle Muster einbackt — ist Sache des Autors. Das Idiom [Sprachneutral schreiben](../idioms/writing-language-neutral.md) sammelt die Muster und Fallstricke.

## Eine neue Sprache hinzufügen

Mechanisch:

1. Kopiere `LanguagePack_en.js` (und für Python `languages/en.json`) auf den neuen Sprachcode.
2. Übersetze die Schlüsselwort-, Verknüpfer-, Literal-, Zeiteinheiten-, Bedingungs- und Wörter-Einträge.
3. Füge die Sprache in den Index des Loaders ein.
4. Verfasse eine Zeile `language <muttersprachlicher-name>` und schreibe Tests.

Der schwierige Teil ist nicht mechanisch — es ist die Wortwahl. AllSpeaks englische Schlüsselwörter sind bewusst natürlichsprachlich gestaltet (`take A from B`, `add A to B`, `the index of`), und die Übersetzungen müssen in der Zielsprache natürlich klingen, nicht wie wörtliche Calques des Englischen. KI-Übersetzung liefert einen brauchbaren ersten Entwurf; menschliche Prüfung durch einen Muttersprachler bringt sie auf Ablieferqualität.

Offene Wortschatz-Fragen werden in `language-pack-issues.md` im Repo-Root verfolgt.

## Siehe auch

- [Struktur](structure.md) — wo die Sprachebene im Compiler sitzt.
- [Symbole und Layout](symbols-and-layout.md) — die lexikalische Oberfläche, die in jeder Sprache gleich ist.
- [Sprachneutral schreiben](../idioms/writing-language-neutral.md) — Muster für Code, der Übersetzung überlebt.
