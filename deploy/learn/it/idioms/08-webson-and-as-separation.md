# Separazione Webson e AS

## Problema

Hai un'interfaccia più grande di una manciata di elementi. Crearli tutti inline in AllSpeak — `crea`, `imposta il contenuto di`, `imposta lo stile di`, e via ripetendo — annega rapidamente la logica vera nel rumore della costruzione del DOM. La struttura dell'interfaccia si aggroviglia con il comportamento dello script.

## Il pattern

Dividi l'interfaccia in due:

- **Layout in un file Webson `.json`.** Albero degli elementi, stili, id.
- **Logica in un file `.as`.** Caricamento dei dati, gestione degli eventi, trasformazione dello stato.
- **`collega` fa da ponte.** Dopo il rendering del Webson, lo script AS reclama ogni elemento tramite il suo id.

```as
variabile Layout

crea Body
rest ottieni Layout da `app.json`
renderizza Layout in Body

collega LoginPanel a `login-panel`
collega UsernameField a `username-input`
collega LoginButton a `login-button`
collega Status a `status`

su clic LoginButton vaisub HandleLogin
```

Lo script non dice mai com'è fatto il pannello di login — quello è compito del file di layout. Il file di layout non dice mai cosa succede quando si clicca il bottone — quello è compito dello script. Ogni lato si toglie il resto di sé dai piedi.

## Quando usarlo

Webson + collega ripaga quando:

- L'interfaccia ha più di una manciata di elementi.
- Il layout potrebbe cambiare senza che cambi il comportamento (restyling visivo, traduzione).
- Più persone (o un designer + uno sviluppatore) lavorano sullo stesso schermo.
- Vuoi caricare il layout dinamicamente (layout diversi per utenti diversi, test A/B).

Il `crea` inline va bene quando:

- L'interfaccia è piccola (un paio di bottoni, un div di stato).
- Gli elementi sono costruiti in modo procedurale (un bottone per ogni record di dati).
- Stai prototipando e non vuoi ancora un file separato.

## Esempio svolto

`app.json` (layout Webson):

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$LoginPanel"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Benvenuto"
    },

    "$LoginPanel": {
        "#element": "div",
        "@id": "login-panel",
        "#": ["$Username", "$LoginButton"],

        "$Username": {
            "#element": "input",
            "@id": "username-input"
        },

        "$LoginButton": {
            "#element": "button",
            "@id": "login-button",
            "#content": "Accedi"
        }
    }
}
```

`app.as` (logica AllSpeak):

```as
variabile Layout
div Title
div LoginPanel
input Username
bottone LoginButton

crea Body
rest ottieni Layout da `app.json`
renderizza Layout in Body

collega Title a `title`
collega LoginPanel a `login-panel`
collega Username a `username-input`
collega LoginButton a `login-button`

su clic LoginButton vaisub HandleLogin
ferma

HandleLogin:
    metti il contenuto di Username in Name
    ! ... convalida, ecc. ...
    ritorna
```

Lo script dichiara ogni variabile tipizzata, la collega all'elemento renderizzato e da lì lavora con essa. Le modifiche visive (stilizzare il bottone, riposizionare il pannello) avvengono interamente in `app.json`.

## Creare-e-poi-indicizzare per array di elementi

Quando un'interfaccia ha un elemento ripetuto renderizzato N volte, dichiara un array lato AllSpeak, **poi crea ogni elemento dentro un ciclo mentre il cursore è posizionato**:

```as
bottone Tab
imposta gli elementi di Tab a 5

imposta N a 0
mentre N è minore di 5 inizio
    indice Tab a N
    crea Tab in TabBar
    imposta il contenuto di Tab a elemento N di TabNames
    aggiungi 1 a N
fine

su clic Tab vaisub TabClicked
```

`imposta gli elementi di Tab a 5` riserva cinque slot. Ogni `indice Tab a N` seguito da `crea Tab in TabBar` costruisce l'elemento allo slot N e lo inserisce nel contenitore. Un singolo `crea` fuori dal ciclo costruirebbe un solo elemento — non cinque — quindi il `crea` deve stare dentro il ciclo. Il gestore legge `l indice di Tab` per scoprire quale elemento ha scatenato l'evento (vedi [gestori di eventi e indice di array](event-handlers-and-array-index.md)).

È lo stesso pattern array-più-cursore che vale per gli array scalari, esteso agli elementi DOM.

## Contenuto guidato dai dati: Webson per la cornice, script per le righe

Il pattern Webson + collega smette di bastare quando la forma non è nota al momento del template. Webson è un linguaggio a template: ogni elemento è dichiarato staticamente, ogni `#content` è una stringa letterale nel JSON. Due cose in particolare non ci stanno:

- **Conteggi di elementi variabili.** Webson può dichiarare un numero fisso di righe; non può dichiarare «una riga per ogni record del file di dati».
- **Contenuto di un elemento che viene da un valore dello script.** `#content` accetta una stringa letterale, non un'espressione — non c'è modo di dire «il valore di `Row.amount` per questa iterazione».

La soluzione è dividere la pagina secondo l'asse che varia. Usa Webson per le parti la cui forma è fissa al momento del template — la cornice della pagina, la barra dell'intestazione, la riga d'intestazione della tabella, i form modali. Usa lo script per le parti la cui forma arriva dai dati — le righe del corpo, i subtotali mensili, i totali calcolati. `asedit.as` fa così per la sua lista di file: un contenitore a scorrimento collegato via Webson con voci create dallo script al suo interno; il layout non sa nulla di quanti file possano esserci.

### Una tabella guidata dai dati

Per una tabella di log le cui righe arrivano da un file JSON:

```as
div TableBody
collega TableBody a `table-body`

variabile Grid
metti `40px 1fr 100px 100px` in Grid

variabile Rows
rest ottieni Rows da `/data/2024-25/04.json`

div Row
imposta gli elementi di Row a il conteggio di Rows
imposta N a 0
mentre N è minore di il conteggio di Rows inizio
    indice Row a N
    crea Row in TableBody
    imposta lo stile di Row a `display:grid; grid-template-columns:` cat Grid
    imposta il contenuto di Row a (elemento 0 di elemento N di Rows) cat `,` cat (elemento 1 di elemento N di Rows)
    aggiungi 1 a N
fine

su clic Row vaisub HandleRowClick
```

Il Webson `app.json` dichiara la cornice della tabella — contenitore esterno, riga d'intestazione con lo stesso `grid-template-columns: 40px 1fr 100px 100px`, punto di attacco `table-body`. Tutto ciò che sta sotto quel punto è costruito dallo script.

La stringa `grid-template-columns` ripetuta è l'unico costo: la riga d'intestazione in Webson e le righe di dati nello script devono andare d'accordo su di essa. È un prezzo abbastanza basso da non giustificare una primitiva Webson per la generazione di righe a template. Estrai il template di colonna in una costante dello script (qui `Grid`) e riporta lo stesso valore come letterale nel layout Webson.

### Alternative considerate (e quando si applicano)

- **Un `<table>` HTML via Webson.** `table`, `tr`, `td`, `th` sono tipi AllSpeak dichiarabili (vedi [browser e Webson](../reference/browser-and-webson.md)), quindi tecnicamente è possibile. Il pattern a griglia vince per la maggior parte delle tabelle d'interfaccia perché stile hover/clic per riga e larghezze responsive sono più facili su un div a griglia che su `tr`/`td`. Scegli `<table>` quando ti serve HTML semantico per l'accessibilità, l'export in stampa/PDF o la navigazione con lettore di schermo.
- **Un contenitore a griglia con wrapper di riga `display: contents`.** Lascia che tutte le celle condividano un unico template di griglia, ma `display: contents` rimuove la riga dall'albero dei box — non c'è un elemento di riga stilizzabile su cui attaccare hover o clic. Utile quando le righe sono puramente visive; scomodo quando le righe sono unità cliccabili. Il pattern del div a griglia per riga qui sopra mantiene ogni riga come un proprio elemento stilizzabile e cliccabile.

## Anti-pattern: lo stile nello script

```as
crea Save in Container
imposta lo stile di Save a `padding:1em; background:#48f; color:white; border-radius:0.3em`
```

CSS nello script è fragile e rumoroso. Spostalo in Webson, dove lo stile ha casa. Tieni nello script il comportamento che il layout non sa esprimere — data binding, gestione degli eventi, transizioni.

## Anti-pattern: il comportamento in Webson

Webson è layout; non sa esprimere condizioni, cicli o gestori di eventi. Se ti accorgi di voler codificare del comportamento nelle chiavi JSON, è il segno che l'elemento variabile deve stare lato script e va collegato con `collega`.

## Correlati

- [browser e Webson](../reference/browser-and-webson.md) — tipi DOM, `collega`, `renderizza`.
- [gestori di eventi e indice di array](event-handlers-and-array-index.md) — array di elementi con gestore condiviso.
- [scrivere in linguaggio neutro](writing-language-neutral.md) — esternalizzare le stringhe visibili all'utente in Webson per la traduzione.
