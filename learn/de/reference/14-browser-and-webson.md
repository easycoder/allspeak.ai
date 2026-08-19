# Browser und Webson

Die Browser-Domäne von AllSpeak liefert den Wortschatz zum Erzeugen und Manipulieren von DOM-Elementen: Knöpfe, divs, inputs, Formulare, alles. Die Begleitsprache Webson ist ein JSON-Dialekt zum Beschreiben von Layout — du kannst die UI-Struktur in einer separaten `.json`-Ressource halten, getrennt von der AllSpeak-Logik.

Eine typische AllSpeak-Oberfläche legt das Layout in Webson ab, das Verhalten in `.as` und nutzt `befestige`, um beides zu verbinden.

## DOM-Variablentypen

Jede Art von DOM-Element ist eine typisierte Variable:

```as
knopf SaveButton
div Container
input NameField
formular LoginForm
span Status
h1 Title
p Para
image Logo
select Dropdown
label NameLabel
```

Eine typisierte Variable wie `knopf SaveButton` deklariert die Variable; das Element existiert im DOM erst, wenn du es erzeugst oder an ein gerendertes anbindest.

### Der vollständige Satz an Elementtypen

Jedes gängige HTML-Element hat einen AllSpeak-Typ. Stand heute: `a`, `audioclip`, `blockquote`, `knopf`, `canvas`, `div`, `datei`, `fieldset`, `formular`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `image` (Alias für `img`), `img`, `input`, `label`, `legend`, `li`, `option`, `p`, `pre`, `progress`, `select`, `span`, `table`, `textfeld`, `td`, `th`, `tr`, `video`. Wenn du einen Elementtyp brauchst, der nicht in dieser Liste steht, deklariere ihn als `div` und gib ihm mit `setze attribut` das richtige Tag — die Browser-Domäne begrenzt nicht, was der Renderer erzeugen kann.

## `befestige` — Skript an Layout binden

`befestige` verbindet eine Skriptvariable über ihre HTML-`id` mit einem gerenderten DOM-Element:

```as
erstelle Body
rest hole Layout von `app.json`
rendere Layout in Body

befestige LoginPanel an `login-panel`
befestige UsernameField an `username-input`
befestige LoginButton an `login-button`
```

Nach `befestige` verweist die Variable auf das lebende DOM-Element — `setze den inhalt von`, `bei klick`, `setze den stil von` usw. funktionieren darauf.

`befestige` kann Elemente auch innerhalb einer gerenderten Komponente finden, indem du das Element zum Durchsuchen übergibst:

```as
befestige Panel an `side-panel`
befestige Button an `save-btn` inside Panel
```

Der Typ der Variable sollte zur Elementart im Layout passen — eine `div`-Variable an ein `div`, ein `knopf` an einen `knopf`.

## Häufige Elementoperationen

Sobald du eine Elementvariable hast (erzeugt oder angebunden), sind die Alltagsoperationen:

```as
setze den inhalt von X zu `Hallo`            ! Textinhalt des Elements
setze den text von X zu `Hallo`              ! Synonym für inhalt
setze den stil von X zu `color:red; font-weight:bold`
setze stil `width` von X zu `90%`            ! eine CSS-Eigenschaft auf einmal
setze attribut `href` von X zu `https://example.com`   ! HTML-Attribut am DOM-Element
setze attribut `data-id` von X zu `42`       ! beliebiges Attribut, gleiche Form
setze eigenschaft `color` von X zu `#ff0000` ! eine JSON-Eigenschaft am Element setzen
lege der inhalt von X in V                   ! zurücklesen
lege eigenschaft `color` von X in V           ! eine Eigenschaft zurücklesen
```

`setze den stil von X` ist Bulk-Inline-CSS; `setze stil \`name\` von X` schreibt eine einzelne CSS-Eigenschaft. `setze attribut \`name\` von X` schreibt ein HTML-Attribut auf das lebende DOM-Element, indem es `element.setAttribute(name, value)` aufruft.

### Die Auswahl lesen

`der ausgewählt text von <element>` liefert den markierten Teil eines textfeld oder input zurück (leer, wenn nichts markiert ist). Für ein `<select>` liefert `der ausgewählt index von <element>` die Position der gewählten Option und `der ausgewählt element von <element>` deren Text.

Bares `der ausgewählt text` (ohne Element) liefert das, was im **fokussierten** bearbeitbaren Element markiert ist, und fällt auf die Dokument-Auswahl zurück — nützlich für Toolbar-Aktionen, die auf der aktuellen Auswahl arbeiten, ohne zu wissen, in welchem Feld sie lebt:

```as
lege der ausgewählt text von Notes in V    ! der markierte Teil des textfeld
lege der ausgewählt text in V              ! die Auswahl des aktiven Elements
setze die selection von Notes von 6 zu 11  ! Zeichen 6..11 markieren und das Feld fokussieren
```

`setze die selection von <textfeld/input> von <start> zu <ende>` setzt die Markierung programmatisch (nullbasierte Zeichen-Offsets) und fokussiert das Element.

### `setze attribut` vs. `setze eigenschaft` — sie sind nicht dasselbe

Diese Falle erwischt KI-Agenten zuverlässig und Menschen gelegentlich:

- **`setze attribut \`name\` von X zu V`** schreibt auf das **DOM-Element**. Verwende das für `href`, `target`, `title`, `src`, `type`, `checked`, `data-*`, ARIA-Attribute — alles, was auf dem lebenden HTML-Element liegen muss, damit der Browser darauf reagiert.
- **`setze eigenschaft \`name\` von X zu V`** schreibt in ein **pro-Element-JSON-Wörterbuch, das an der Variable hängt**. Funktioniert auf jeder typisierten Variable — `variable`, `div`, `knopf`, `input` usw. Es fasst das DOM *nicht* an. Verwende das für Metadaten auf Anwendungsebene, die du neben dem Element mitführen willst (z. B. die Datensatz-ID einer Zeile, die deine eigenen Event-Handler über `eigenschaft \`name\` von X` zurücklesen).

Die beiden sehen an der Oberfläche ähnlich aus, haben aber völlig unterschiedliche Wirkungen. Ein häufiges Symptom der Verwechslung: `setze eigenschaft \`href\` von LinkAnchor zu URL` läuft ohne Fehler, aber der Link navigiert beim Klicken nicht — weil das DOM-`<a>` nie das `href` bekommen hat; nur das Daten-Dict der Variable. Die Lösung: `eigenschaft` zu `attribut` ändern.

Wenn dein Ziel ist, „den Browser darauf reagieren zu lassen", greif zu `attribut`. Wenn dein Ziel ist, „diese Tatsache über das Element für eigenen Code zum späteren Lesen zu merken", greif zu `eigenschaft`.

Eigenschaften auf Array-Elementen **initialisieren sich beim ersten Schreiben automatisch** — es gibt keinen Befehl `setze die eigenschaften von X zu feld`. Schreibe einfach `setze eigenschaft \`name\` von X zu V` in der Erzeugungsschleife; das Pro-Element-JSON-Wörterbuch entsteht automatisch. KI-Agenten erfinden oft einen Vor-Initialisierungsschritt wie `setze die eigenschaften von Cell zu feld für \`color\`` — das ist kein gültiges AllSpeak.

## Ereignisse

Element-Ereignisse registrieren sich mit `bei <ereignis> <element> gosub Handler`:

```as
bei klick Save gosub HandleSave
bei änderung NameField gosub NameChanged
bei submit Form gosub Submit
```

Der Handler ist ein Thread; der Cursor auf der Elementvariable wird vor dem Handler-Lauf auf das auslösende Exemplar gesetzt. Siehe [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md) für das kanonische Muster mit Arrays von Elementen.

## Native Browser-Dialoge

Zwei Schlüsselwörter führen zu den eingebauten Modal-Dialogen des Browsers. Beide blockieren die Seite, bis der Benutzer sie schließt — verwende sie sparsam; für substanzielle Oberflächen baue ein Modal in Webson und ein normales elementbasiertes Formular.

`alarm` zeigt eine Informationsmeldung:

```as
alarm `Gespeichert.`
```

`bestätige` zeigt einen OK/Abbrechen-Dialog und verzweigt per `gosub` nach der Wahl des Benutzers:

```as
bestätige `Diese Buchung löschen?` gosub OnYes oder gosub OnNo
```

Die Klausel `oder gosub <Label>` ist optional — wenn dir nur der OK-Fall wichtig ist, lass sie weg; bei Abbrechen macht das Skript einfach mit dem nächsten Befehl weiter. Beide Zweige verhalten sich wie gewöhnliche `gosub`-Aufrufe: Sie schieben einen Rückkehr-Befehlszeiger auf den Stapel, und die aufgerufene Unterroutine endet mit `retourniere`, sodass die Ausführung unabhängig davon, welcher Zweig lief, beim nächsten Befehl fortgesetzt wird.

Der angezeigte Text ist der Zeichenkettenwert, den du übergibst — das Sprachpaket beeinflusst ihn nicht, übersetze ihn also selbst.

## Webson

Webson ist ein JSON-Dialekt, der HTML/CSS-Layout beschreibt. Er hat eigene Konventionen:

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$SaveButton"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Willkommen"
    },

    "$SaveButton": {
        "#element": "button",
        "@id": "save-button",
        "#content": "Speichern"
    }
}
```

`rendere Layout in Body` durchläuft den Webson-Baum und erzeugt echtes DOM. Der Sinn des Dialekts ist die Trennung: Das Layout ist eine statische `.json`-Ressource, die bearbeitet (oder übersetzt) werden kann, ohne AllSpeak anzufassen. Für eine ausgearbeitete Diskussion der Trennung siehe [Webson-und-AS-Trennung](../idioms/webson-and-as-separation.md).

### Schlüssel-Referenz

Jeder Schlüssel in einem Webson-Objekt fällt in eine dieser Kategorien:

| Präfix | Zweck | Beispiel |
|--------|---------|---------|
| `#element` | HTML-Tag-Name | `"div"`, `"button"`, `"h1"` |
| `#content` | Textinhalt | `"Willkommen"` |
| `#doc` | Dokumentation — vom Renderer ignoriert | eine beliebige Zeichenkette |
| `#` | Geordnete Liste der Kind-Referenzen | `["$Title", "$SaveButton"]` |
| `@<name>` | HTML-Attribut | `@id`, `@class`, `@href`, `@type` |
| `$<name>` | Benannte Kind-Definition | `$Title`, `$SaveButton` |
| einfacher Schlüssel | CSS-Eigenschaft | `padding`, `font-family`, `color` |

### `#element` — das HTML-Tag

Pflicht auf jedem Element. Der Wert ist der Tag-Name als Zeichenkette: `"div"`, `"button"`, `"input"`, `"h1"`, `"textarea"`, `"img"`, `"a"`, `"span"`, `"label"`, `"select"`, `"option"`, `"form"`, `"p"`, `"pre"`, `"ul"`, `"ol"`, `"li"`, `"table"`, `"tr"`, `"td"`, `"th"`, `"hr"`, `"br"`, `"fieldset"`, `"legend"`.

### `#content` — Textinhalt

Der Innentext des Elements. Kann mit Kindern (`#`) koexistieren — der Inhalt wird zuerst gerendert, dann die Kinder.

```json
{
    "#element": "p",
    "#content": "Gesamt: ",
    "#": ["$ValueSpan"]
}
```

### `#` — das Kinder-Array

Eine geordnete Liste von `$`-präfigierten Namen. Der Renderer erzeugt die Kind-Elemente in dieser Reihenfolge. **Ohne `#` werden keine Kinder gerendert** — selbst wenn das Objekt unten `$`-präfigierte Schlüssel definiert.

```json
{
    "#element": "div",
    "#": ["$Label", "$Input"],    ← Label rendert zuerst, Input als zweites

    "$Label": { ... },
    "$Input": { ... }
}
```

Ein in `#` referenzierter `$`-Name muss irgendwo im Auflösungsbereich existieren (siehe unten), muss aber nicht im selben Objekt verschachtelt sein — er kann auf einer Parent- oder Root-Ebene definiert sein.

**Die Einträge müssen `$Name`-Zeichenketten sein, keine Inline-JSON-Objekte.** Das ist der häufigste KI-Fehler mit Webson:

```json
// FALSCH — Inline-Objekte im #-Array:
"#": [
    { "#element": "div", "background-color": "#ccc" },
    { "#element": "div", "background-color": "#ccc" }
]

// RICHTIG — $Name-Referenzen auf benannte Blöcke:
"#": ["$Cell", "$Cell"],
"$Cell": {
    "#element": "div",
    "background-color": "#ccc"
}
```

Inline-Objekte als `#`-Einträge schlagen zur Laufzeit mit dem Fehler `build: [object Object] has no properties` fehl, weil der Renderer das Objekt als Zeichenketten-Schlüssel für die Symboltabelle zu verwenden versucht. Definiere immer einen `$Name`-Block und referenziere ihn beim Namen.

### `$<name>` — benannte Kind-Definitionen

`$`-präfigierte Schlüssel definieren Elemente, die `#` referenziert. Sie können auf jeder Ebene des Baums stehen — der Renderer löst sie auf, indem er nach oben sucht.

**Auflösungsreihenfolge** (wo der Renderer nach `$ModalForm` sucht, wenn das `#` von `$Modal` es referenziert):

1. **Dasselbe Objekt** — Schlüssel des Elements, dessen `#` die Referenz enthält
2. **Parent-Objekt** — Schlüssel des Parents des Elements im Webson-Baum
3. **Root-Objekt** — Schlüssel des Objekts auf oberster Ebene (die Datei-Wurzel)

Das bedeutet, eine Kind-Definition kann auf einer Parent-Ebene leben:

```json
{
    "#element": "div",
    "#": ["$Outer"],

    "$Outer": {
        "#element": "div",
        "#": ["$Inner"]
        ← $Inner ist hier NICHT definiert — der Renderer sucht weiter nach oben
    },

    "$Inner": {                   ← Hier gefunden (Parent-Ebene)
        "#element": "span",
        "#content": "Hallo"
    }
}
```

Das ist nützlich, um gemeinsame Elemente über Geschwister hinweg zu teilen, ohne ihre Definition zu wiederholen.

### `@<name>` — HTML-Attribute

Schlüssel, die mit `@` beginnen, setzen HTML-Attribute auf dem DOM-Element. „`@`" steht für „Attribut":

```json
{
    "@id": "save-btn",
    "@class": "primary",
    "@type": "checkbox",
    "@checked": true,
    "@placeholder": "Name eingeben",
    "@href": "https://example.com",
    "@src": "logo.png",
    "@autocomplete": "username",
    "@disabled": true,
    "@rows": "3"
}
```

`@id` ist das häufigste — es ist der Griff, den der `befestige`-Befehl von AllSpeak nach `rendere` nachschlägt.

### CSS-Eigenschaften

Jeder Schlüssel, der nicht mit `#`, `@` oder `$` beginnt, wird als CSS-Eigenschaft behandelt. Bindestrich-Namen gehen direkt durch:

```json
{
    "font-family": "sans-serif",
    "font-size": "14px",
    "color": "#333",
    "margin": "1em 0",
    "display": "flex",
    "align-items": "center",
    "gap": "0.5em",
    "grid-template-columns": "1fr 1fr"
}
```

Die Reihenfolge der Schlüssel unter CSS-Eigenschaften spielt keine Rolle — der Renderer sammelt sie alle und setzt sie auf das `style`-Attribut des Elements.

### `#doc` — Dokumentation

Ein reiner Dokumentations-Schlüssel. Der Renderer ignoriert ihn vollständig. Verwende ihn für Inline-Notizen:

```json
{
    "#doc": "Dieses Panel wird nach dem Anmelden angezeigt.",
    "#element": "div",
    ...
}
```

### Die Reihenfolge der Schlüssel spielt keine Rolle

Der Renderer erkennt Schlüssel an ihrem Präfix, nicht an ihrer Position im Objekt. Das funktioniert:

```json
{
    "$Modal": { ... },
    "#element": "div",
    "@id": "page",
    "background": "#f5f5f5",
    "#": ["$Modal"]
}
```

Aber üblicherweise listen die meisten Layouts die Schlüssel aus Lesbarkeitsgründen in dieser Reihenfolge:

1. `#doc` (falls vorhanden)
2. `#element`
3. `@id`
4. CSS-Eigenschaften
5. `#` (Kinder-Array)
6. `$`-präfigierte Kind-Definitionen

### Ausgearbeitetes Beispiel: Modal-Overlay mit Auflösung über Ebenen hinweg

Ein Modal-Dialog, in dem das Overlay-div, der Modal-Rahmen und die Formularfelder jeweils separate Objekte sind und die `$`-Auflösung über Ebenen hinweg demonstrieren:

```json
{
    "#element": "div",
    "@id": "page",
    "#": ["$Overlay"],

    "$Overlay": {
        "#element": "div",
        "@id": "overlay",
        "display": "none",
        "position": "fixed",
        "top": "0", "left": "0", "right": "0", "bottom": "0",
        "background": "rgba(0,0,0,0.5)",
        "#": ["$Modal"],

        "$Modal": {
            "#element": "div",
            "background": "white",
            "border-radius": "8px",
            "padding": "1.5em",
            "#": ["$ModalForm"]
            ← $ModalForm ist hier NICHT definiert
        }
    },

    "$ModalForm": {         ← Von der Wurzel aus aufgelöst (Eltern-über-Eltern-Ebene)
        "#element": "div",
        "@id": "modal-form",
        "#": ["$Title", "$Fields"],

        "$Title": {
            "#element": "h2",
            "@id": "modal-title",
            "#content": "Buchung bearbeiten"
        },

        "$Fields": {
            "#element": "div",
            "@id": "form-fields",
            "display": "flex",
            "flex-direction": "column",
            "gap": "0.5em",
            "#": ["$DateRow"],

            "$DateRow": {
                "#element": "div",
                "display": "flex",
                "align-items": "center",
                "gap": "0.5em",
                "#": ["$DateLabel", "$DateInput"],

                "$DateLabel": {
                    "#element": "label",
                    "#content": "Datum",
                    "width": "120px",
                    "flex-shrink": "0"
                },
                "$DateInput": {
                    "#element": "input",
                    "@id": "date-input",
                    "@type": "date",
                    "flex": "1",
                    "min-width": "0"
                }
            }
        }
    }
}
```

Kernpunkte in diesem Beispiel:

- **Das `#` von `$Modal` referenziert `$ModalForm`**, das zwei Ebenen höher (an der Wurzel) definiert ist. Der Renderer sucht: dasselbe Objekt ($Modal → nicht gefunden) → Parent ($Overlay → nicht gefunden) → Wurzel (gefunden).
- **`$ModalForm` ist einmal definiert**, wird aber aus dem `#` von `$Modal` referenziert. Es muss nicht in `$Modal` verschachtelt sein.
- **`#` steuert die Render-Reihenfolge.** Die Seite rendert Overlay (über `#: ["$Overlay"]`), das Modal rendert (über sein `#`), das ModalForm rendert (über sein `#`). Ohne diese `#`-Arrays wären die Kinder definiert, aber unsichtbar.
- **Jede Zeile ist ein Flex-Container** mit einem Label fester Breite und einem flex-füllenden Input — das Standardmuster für tabellarische Formulare.

## Arrays von DOM-Elementen

Eine typisierte DOM-Variable kann ein Array sein, genau wie ein Skalar:

```as
knopf Item
setze die elemente von Item zu 5
! ... 5 Knöpfe befüllen ...

bei klick Item gosub HandleClick
```

Das ist das kanonische Muster für „viele ähnliche Elemente". Siehe [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md) und [Eine Sammlungsform wählen](../idioms/picking-a-collection-shape.md).

## Browser-lokaler Speicher

AllSpeak für den Browser bietet `speicher` — eine Schnittstelle zur `localStorage`-API des Browsers:

```as
lege State in speicher als `cells.state`

! Später, beim Laden der Seite:
hole State von speicher als `cells.state`
wenn State ist leer setze State zu feld       ! beim ersten Laden initialisieren
```

Speicher gibt es nur im Browser. Die Python-Laufzeit hat diesen Wortschatz nicht; für die CLI verwende `read` / `write` auf einer Datei.

## Webson-Renderer vs. Browser-Domäne

Der Webson-Renderer (der Webson-JSON in DOM verwandelt) ist ein Begleitwerkzeug — er ist nicht Teil der AllSpeak-Sprache. Die Browser-Domäne liefert den Sprachwortschatz (`knopf`, `befestige`, `bei klick`); der Renderer erzeugt die Elemente, die `befestige` dann anbindet. Siehe [Struktur](structure.md) für den Platz von Begleitwerkzeugen.

## Siehe auch

- [Struktur](structure.md) — Browser ist eine der gebündelten Domänen; der Webson-Renderer ist ein Begleitwerkzeug.
- [Ereignishandler und Array-Index](../idioms/event-handlers-and-array-index.md) — `bei klick` und das Cursor-Modell für Arrays von Elementen.
- [Webson-und-AS-Trennung](../idioms/webson-and-as-separation.md) — wann Webson statt Inline-Erzeugung.
- [Sammlungen](collections.md) — Objekt-Eigenschaften auf DOM-Elementen.
