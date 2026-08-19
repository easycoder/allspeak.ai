# Browser e Webson

Il dominio Browser di AllSpeak fornisce il vocabolario per costruire e manipolare elementi DOM: bottoni, div, input, form, e chi più ne ha più ne metta. Il linguaggio compagno Webson è un dialetto JSON per descrivere il layout: ti permette di tenere la struttura dell'interfaccia in una risorsa `.json` separata, lontana dalla logica AllSpeak.

Una tipica interfaccia AllSpeak mette il layout in Webson, il comportamento in `.as`, e usa `collega` per legare le due cose.

## I tipi di variabile DOM

Ogni tipo di elemento DOM è una variabile tipizzata:

```as
bottone SaveButton
div Container
input NameField
form LoginForm
span Status
h1 Title
p Para
image Logo
select Dropdown
label NameLabel
```

Una variabile tipizzata come `bottone SaveButton` dichiara la variabile; l'elemento non esiste nel DOM finché non lo crei o non lo colleghi a uno renderizzato.

### L'insieme completo dei tipi di elemento

Ogni elemento HTML comune ha un tipo AllSpeak. Ad oggi: `a`, `audioclip`, `blockquote`, `bottone`, `canvas`, `div`, `file`, `fieldset`, `form`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `image` (alias di `img`), `img`, `input`, `label`, `legend`, `li`, `option`, `p`, `pre`, `progress`, `select`, `span`, `table`, `textarea`, `td`, `th`, `tr`, `video`. Se ti serve un tipo di elemento che non è in questa lista, dichiaralo come `div` e usa `imposta attributo` per dargli il tag giusto: il dominio Browser non limita ciò che il renderer può creare.

## `collega` — legare lo script al layout

`collega` connette una variabile dello script a un elemento DOM renderizzato tramite il suo `id` HTML:

```as
crea Body in corpo
rest ottieni Layout da `app.json`
renderizza Layout in Body

collega LoginPanel a `login-panel`
collega UsernameField a `username-input`
collega LoginButton a `login-button`
```

Dopo `collega`, la variabile si riferisce all'elemento DOM vivo: `imposta il contenuto di`, `su clic`, `imposta lo stile di`, ecc. funzionano tutti su di esso.

`collega` può anche trovare elementi dentro un componente renderizzato, passando l'elemento entro cui cercare:

```as
collega Panel a `side-panel`
collega Button a `save-btn` in Panel
```

Il tipo della variabile deve corrispondere al tipo di elemento del layout: una variabile `div` per un `div`, un `bottone` per un `bottone`.

## Le operazioni comuni sugli elementi

Una volta che hai una variabile di elemento (creata o collegata), le operazioni di tutti i giorni sono:

```as
imposta il contenuto di X a `Ciao`            ! contenuto testuale dell'elemento
imposta il testo di X a `Ciao`                ! sinonimo di contenuto
imposta lo stile di X a `color:red; font-weight:bold`
imposta stile `width` di X a `90%`            ! una proprietà CSS alla volta
imposta attributo `href` di X a `https://example.com`   ! attributo HTML sull'elemento DOM
imposta attributo `data-id` di X a `42`       ! attributo arbitrario, stessa forma
imposta proprieta `color` di X a `#ff0000`    ! scrive una proprietà JSON sull'elemento
metti il contenuto di X in V                  ! lettura di ritorno
metti proprieta `color` di X in V             ! lettura di ritorno di una proprietà
```

`imposta lo stile di X` è CSS inline in blocco; `imposta stile \`nome\` di X` scrive una singola proprietà CSS. `imposta attributo \`nome\` di X` scrive un attributo HTML sull'elemento DOM vivo chiamando `element.setAttribute(nome, valore)`.

### Leggere la selezione

`il selezionato testo di <elemento>` restituisce la sottostringa evidenziata di una textarea o di un input (vuota quando non c'è selezione). Per un `<select>`, `il selezionato indice di <elemento>` dà la posizione dell'opzione scelta e `il selezionato elemento di <elemento>` il suo testo.

`il selezionato testo` da solo (senza elemento) restituisce ciò che è selezionato nell'elemento modificabile **focalizzato**, ripiegando sulla selezione del documento: utile per le azioni della barra degli strumenti che operano sulla selezione corrente senza sapere in quale campo si trova:

```as
metti il selezionato testo di Notes in V    ! parte evidenziata della textarea
metti il selezionato testo in V             ! selezione dell'elemento attivo
imposta selection di Notes da 6 a 11        ! evidenzia i caratteri 6..11 e focalizza il campo
```

`imposta selection di <textarea/input> da <inizio> a <fine>` imposta l'evidenziazione a livello di programma (offset di caratteri a base 0) e focalizza l'elemento.

### `imposta attributo` vs `imposta proprieta` — non sono la stessa cosa

Questo tranello becca gli agenti IA di sicuro e gli umani ogni tanto:

- **`imposta attributo \`nome\` di X a V`** scrive sull'**elemento DOM**. Usalo per `href`, `target`, `title`, `src`, `type`, `checked`, `data-*`, attributi ARIA: tutto ciò che deve vivere sull'elemento HTML vivo perché il browser agisca di conseguenza.
- **`imposta proprieta \`nome\` di X a V`** scrive in un **dizionario JSON per-elemento memorizzato sulla variabile**. Funziona su qualsiasi variabile tipizzata — `variabile`, `div`, `bottone`, `input`, ecc. Non tocca *il* DOM. Usalo per metadati a livello applicativo che vuoi trasportare insieme all'elemento (per es. l'ID di record di una riga, che i tuoi gestori di eventi rileggono tramite `proprieta \`nome\` di X`).

I due hanno una sintassi di superficie simile ma effetti completamente diversi. Un sintomo comune della confusione: `imposta proprieta \`href\` di LinkAnchor a URL` viene eseguito senza errori, ma il link non naviga al clic — perché il `<a>` del DOM non ha mai ricevuto l'`href`; lo ha ricevuto solo il dict di dati della variabile. La correzione è cambiare `proprieta` in `attributo`.

Se il tuo obiettivo è «fai agire il browser su questo», usa `attributo`. Se il tuo obiettivo è «ricorda questo fatto sull'elemento perché il mio codice lo rilegga più tardi», usa `proprieta`.

Le proprietà sugli elementi di un array **si inizializzano da sole alla prima scrittura**: non esiste un comando `imposta le proprieta di X a vettore`. Basta fare `imposta proprieta \`nome\` di X a V` dentro il ciclo di creazione; il dizionario JSON per-elemento viene creato automaticamente. Gli agenti IA spesso inventano un passo di pre-inizializzazione tipo `imposta le proprieta di Cell a vettore per \`color\`` — non è AllSpeak valido.

## Eventi

Gli eventi degli elementi si registrano con `su <evento> <elemento> vaisub Handler`:

```as
su clic Save vaisub HandleSave
su cambio NameField vaisub NameChanged
su submit Form vaisub Submit
```

Il gestore è un thread; il cursore sulla variabile di elemento viene posizionato sull'istanza che ha scatenato l'evento prima che il gestore giri. Vedi [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md) per il pattern canonico con array di elementi.

## Dialoghi nativi del browser

Due parole chiave portano ai dialoghi modali integrati del browser. Entrambi bloccano la pagina finché l'utente non li chiude, quindi usali con parsimonia: per un'interfaccia sostanziosa, costruisci una modale in Webson e un normale form basato su elementi.

`avviso` mostra un messaggio informativo:

```as
avviso `Salvato.`
```

`conferma` mostra un dialogo OK/Annulla e si dirama in base alla scelta dell'utente tramite `vaisub`:

```as
conferma `Eliminare questa prenotazione?` vaisub OnYes o vaisub OnNo
```

La clausola `o vaisub <Etichetta>` è opzionale: se ti interessa solo il caso OK, toglila; su Annulla lo script si limita a continuare con il comando successivo. Entrambe le diramazioni si comportano come normali chiamate `vaisub`: spingono un PC di ritorno e la subroutine chiamata termina con `ritorna`, quindi l'esecuzione riprende dal comando successivo qualunque diramazione sia stata presa.

Il testo mostrato è qualsiasi valore stringa tu passi: non è influenzato dal pacchetto linguistico, quindi traducilo tu stesso.

## Webson

Webson è un dialetto JSON che descrive layout HTML/CSS. Usa convenzioni proprie:

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$SaveButton"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Benvenuto"
    },

    "$SaveButton": {
        "#element": "button",
        "@id": "save-button",
        "#content": "Salva"
    }
}
```

`renderizza Layout in Body` percorre l'albero Webson ed emette DOM reale. Il punto del dialetto è la separazione: il layout è una risorsa `.json` statica che si può modificare (o tradurre) senza toccare l'AllSpeak. Per una discussione approfondita della separazione, vedi [separazione Webson e AS](../idioms/webson-and-as-separation.md).

### Riferimento delle chiavi

Ogni chiave in un oggetto Webson cade in una di queste categorie:

| Prefisso | Scopo | Esempio |
|--------|---------|---------|
| `#element` | Nome del tag HTML | `"div"`, `"button"`, `"h1"` |
| `#content` | Contenuto testuale | `"Benvenuto"` |
| `#doc` | Documentazione — ignorata dal renderer | qualsiasi stringa |
| `#` | Lista ordinata di riferimenti figli | `["$Title", "$SaveButton"]` |
| `@<nome>` | Attributo HTML | `@id`, `@class`, `@href`, `@type` |
| `$<nome>` | Definizione di figlio nominato | `$Title`, `$SaveButton` |
| chiave semplice | Proprietà CSS | `padding`, `font-family`, `color` |

### `#element` — il tag HTML

Obbligatorio su ogni elemento. Il valore è il nome del tag come stringa: `"div"`, `"button"`, `"input"`, `"h1"`, `"textarea"`, `"img"`, `"a"`, `"span"`, `"label"`, `"select"`, `"option"`, `"form"`, `"p"`, `"pre"`, `"ul"`, `"ol"`, `"li"`, `"table"`, `"tr"`, `"td"`, `"th"`, `"hr"`, `"br"`, `"fieldset"`, `"legend"`.

### `#content` — il contenuto testuale

Il testo interno dell'elemento. Può coesistere con i figli (`#`) — il contenuto viene renderizzato per primo, poi i figli.

```json
{
    "#element": "p",
    "#content": "Totale: ",
    "#": ["$ValueSpan"]
}
```

### `#` — l'array dei figli

Una lista ordinata di stringhe di nomi con prefisso `$`. Il renderer crea gli elementi figli in questo ordine. **Senza `#`, nessun figlio viene renderizzato** — anche se l'oggetto ha chiavi con prefisso `$` definite più sotto.

```json
{
    "#element": "div",
    "#": ["$Label", "$Input"],    ← Label viene renderizzato per primo, Input per secondo

    "$Label": { ... },
    "$Input": { ... }
}
```

Un nome `$` referenziato in `#` deve esistere da qualche parte nello scope di risoluzione (vedi sotto), ma non deve essere annidato nello stesso oggetto: può essere definito a livello di genitore o di radice.

**Le voci devono essere stringhe `$Nome`, non oggetti JSON inline.** È l'errore IA più comune con Webson:

```json
// SBAGLIATO — oggetti inline nell'array #:
"#": [
    { "#element": "div", "background-color": "#ccc" },
    { "#element": "div", "background-color": "#ccc" }
]

// GIUSTO — riferimenti $Nome a blocchi nominati:
"#": ["$Cell", "$Cell"],
"$Cell": {
    "#element": "div",
    "background-color": "#ccc"
}
```

Le voci `#` come oggetti inline falliscono a runtime con l'errore `build: [object Object] has no properties` perché il renderer prova a usare l'oggetto come chiave stringa per consultare la tabella dei simboli. Definisci sempre un blocco `$Nome` e riferiscilo per nome.

### `$<nome>` — definizioni di figli nominati

Le chiavi con prefisso `$` definiscono gli elementi che `#` referenzia. Possono comparire a qualsiasi livello dell'albero: il renderer le risolve cercando verso l'alto.

**Ordine di risoluzione** (dove il renderer cerca `$ModalForm` quando il `#` di `$Modal` lo referenzia):

1. **Stesso oggetto** — le chiavi dell'elemento il cui `#` contiene il riferimento
2. **Oggetto genitore** — le chiavi del genitore dell'elemento nell'albero Webson
3. **Oggetto radice** — le chiavi dell'oggetto di livello superiore (la radice del file)

Questo significa che una definizione di figlio può vivere in uno scope genitore:

```json
{
    "#element": "div",
    "#": ["$Outer"],

    "$Outer": {
        "#element": "div",
        "#": ["$Inner"]
        ← $Inner NON è definito qui — il renderer risale
    },

    "$Inner": {                   ← Trovato qui (scope genitore)
        "#element": "span",
        "#content": "Ciao"
    }
}
```

È utile per condividere elementi comuni tra fratelli senza ripetere la loro definizione.

### `@<nome>` — attributi HTML

Le chiavi che iniziano con `@` impostano attributi HTML sull'elemento DOM. `"@" sta per "@ttributo"`:

```json
{
    "@id": "save-btn",
    "@class": "primary",
    "@type": "checkbox",
    "@checked": true,
    "@placeholder": "Inserisci il nome",
    "@href": "https://example.com",
    "@src": "logo.png",
    "@autocomplete": "username",
    "@disabled": true,
    "@rows": "3"
}
```

`@id` è il più comune: è la maniglia che il comando `collega` di AllSpeak cerca dopo `renderizza`.

### Proprietà CSS

Qualsiasi chiave che non inizia con `#`, `@` o `$` viene trattata come proprietà CSS. I nomi con trattino passano direttamente:

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

L'ordine delle chiavi tra le proprietà CSS non conta: il renderer le raccoglie tutte e le imposta sull'attributo `style` dell'elemento.

### `#doc` — documentazione

Una chiave solo-documentazione. Il renderer la ignora del tutto. Usala per note inline:

```json
{
    "#doc": "Questo pannello viene mostrato dopo il login.",
    "#element": "div",
    ...
}
```

### L'ordine delle chiavi non conta

Il renderer identifica le chiavi dal loro prefisso, non dalla loro posizione nell'oggetto. Questo funziona:

```json
{
    "$Modal": { ... },
    "#element": "div",
    "@id": "page",
    "background": "#f5f5f5",
    "#": ["$Modal"]
}
```

Ma per convenzione, la maggior parte dei layout elenca le chiavi in quest'ordine per leggibilità:

1. `#doc` (se presente)
2. `#element`
3. `@id`
4. Proprietà CSS
5. `#` (array dei figli)
6. Definizioni di figli con prefisso `$`

### Esempio svolto: overlay modale con risoluzione di scope

Un dialogo modale in cui il div di overlay, il wrapper della modale e i campi del form sono ciascuno oggetti separati, a dimostrare la risoluzione `$` attraverso gli scope:

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
            ← $ModalForm NON è definito qui
        }
    },

    "$ModalForm": {         ← Risolto dalla radice (scope del genitore del genitore)
        "#element": "div",
        "@id": "modal-form",
        "#": ["$Title", "$Fields"],

        "$Title": {
            "#element": "h2",
            "@id": "modal-title",
            "#content": "Modifica prenotazione"
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
                    "#content": "Data",
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

Punti chiave di questo esempio:

- **Il `#` di `$Modal` referenzia `$ModalForm`**, che è definito due livelli più su (alla radice). Il renderer cerca: stesso oggetto ($Modal → non trovato) → genitore ($Overlay → non trovato) → radice (trovato).
- **`$ModalForm` è definito una sola volta** ma referenziato dal `#` di `$Modal`. Non deve essere annidato dentro `$Modal`.
- **`#` controlla l'ordine di renderizzazione.** La pagina renderizza Overlay (via `#: ["$Overlay"]`), che renderizza Modal (via il suo `#`), che renderizza ModalForm (via il suo `#`). Senza nessuno di quegli array `#`, i figli sarebbero definiti ma invisibili.
- **Ogni riga è un contenitore flex** con un'etichetta a larghezza fissa e un input che si espande in flex: il pattern standard per i form a tabella.

## Array di elementi DOM

Una variabile DOM tipizzata può essere un array, proprio come uno scalare:

```as
bottone Item
imposta gli elementi di Item a 5
! ... popola 5 bottoni ...

su clic Item vaisub HandleClick
```

Questo è il pattern canonico per «molti elementi simili». Vedi [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md) e [scegliere la forma di una raccolta](../idioms/picking-a-collection-shape.md).

## Archiviazione locale del browser

AllSpeak per il browser fornisce `archivio` — un'interfaccia verso l'API `localStorage` del browser:

```as
metti State in archivio come `cells.state`

! Più tardi, al caricamento della pagina:
ottieni State da archivio come `cells.state`
se State è vuoto imposta State a vettore       ! inizializza al primo caricamento
```

L'archivio esiste solo nel browser. Il runtime Python non ha questo vocabolario; per la CLI usa `read` / `write` su un file.

## Renderer Webson vs dominio Browser

Il renderer Webson (che trasforma il JSON Webson in DOM) è uno strumento compagno: non fa parte del linguaggio AllSpeak. Il dominio Browser fornisce il vocabolario del linguaggio (`bottone`, `collega`, `su clic`); il renderer emette gli elementi che `collega` poi lega. Vedi [struttura](structure.md) per il posto degli strumenti compagni.

## Vedi anche

- [struttura](structure.md) — Browser è uno dei domini inclusi; il renderer Webson è uno strumento compagno.
- [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md) — `su clic` e il modello del cursore per gli array di elementi.
- [separazione Webson e AS](../idioms/webson-and-as-separation.md) — quando usare Webson invece della creazione inline.
- [collezioni](collections.md) — le proprietà oggetto sugli elementi DOM.
