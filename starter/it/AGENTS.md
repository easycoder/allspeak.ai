# Progetto AllSpeak — Istruzioni per l'agente

## Lingua

Questo è un progetto AllSpeak in **italiano**. Comunica con l'utente in italiano. Genera script AllSpeak usando le parole chiave italiane. Rispondi sempre in italiano, indipendentemente dalla lingua usata dall'utente nei prompt.

## Cos'è AllSpeak

AllSpeak è un linguaggio di scripting progettato per essere letto come una lingua umana naturale. Gli script usano l'estensione `.as`. AllSpeak funziona nel browser (versione JavaScript) o dal terminale (versione Python) — o entrambi insieme.

AllSpeak usa un flusso di lavoro **l'AI scrive, l'umano controlla**. L'AI genera il codice `.as`; l'utente verifica che sia leggibile e chiede chiarimenti su ciò che non è chiaro. Usa il linguaggio completo — non evitare un comando perché potrebbe essere poco familiare. L'utente deve solo leggerlo, non scriverlo a memoria.

## Riferimento — leggilo prima di scrivere AllSpeak

Il riferimento completo del linguaggio AllSpeak e degli idiomi si trova su:

  **https://allspeak.ai/learn/**

Il sito contiene 16 file di riferimento (`reference/`) e 12 file di idiomi (`idioms/`). Quando devi controllare la sintassi, il comportamento a runtime o i pattern idiomatici, consultalo invece di fare affidamento sui dati di addestramento — il vocabolario di AllSpeak non sempre corrisponde a ciò su cui l'AI è stata addestrata.

**Leggi prima `learn/contents.md`** — è l'indice canonico dei percorsi dei file. Usa quei percorsi esatti quando recuperi file specifici.

## Contesto del progetto

Questa directory contiene `AGENTS.md` — questo file. Leggilo ora per comprendere il linguaggio AllSpeak e il flusso di lavoro prima di lavorare su qualsiasi codice.

**Importante:** verifica se esiste un file chiamato `.allspeak-init` in questa directory. Se esiste, leggilo per conoscere il nome e il tipo del progetto. Se non esiste, il progetto non è stato ancora configurato — guida l'utente attraverso il processo di inizializzazione qui sotto.

### Processo di inizializzazione

1. **Saluta l'utente** e spiega brevemente cos'è AllSpeak — un linguaggio di scripting che si legge come un semplice italiano, progettato in modo che l'AI scriva il codice e l'umano lo controlli.

2. **Chiedi all'utente il nome del progetto.** Verrà usato come nome dello script e nei nomi dei file.

3. **Chiedi se è un progetto da riga di comando, un progetto GUI, o entrambi.**

4. **Crea i file del progetto** in base alla risposta:

   - **Riga di comando**: Crea `<progetto>.as` dal modello CLI qui sotto.
   - **GUI**: Crea `<progetto>.html`, `<progetto>-main.as` e `<progetto>.json` dai modelli GUI qui sotto.
   - **Entrambi**: Crea tutti i file.

5. **Crea `.allspeak-init`** contenente il nome e il tipo del progetto (cli/gui/both) così questa configurazione non viene ripetuta.

6. **Avvia l'app (GUI) o spiega come eseguirla (CLI).**

   - **GUI**: Esegui immediatamente `allspeak server.as -t edit,<progetto>` in background. Questo avvia il server di sviluppo e apre due schede del browser: l'editor (`edit.html`) e la pagina del progetto (`<progetto>.html`). Di' all'utente: "Ho avviato l'app — l'editor e la tua pagina progetto dovrebbero essere aperti nelle schede del browser."
   - **CLI**: Di' all'utente di eseguire lo script con `allspeak <progetto>.as`.

7. **Spiega all'utente come i file funzionano insieme.** Per i progetti GUI, spiega l'interazione tra HTML (caricatore), `.as` (logica) e `.json` (layout/Webson).

8. **Chiedi cosa vuole costruire.**

---

**Se `.allspeak-init` esiste**, salta l'inizializzazione e procedi normalmente. Leggi `.allspeak-init` per conoscere il nome e il tipo del progetto.

---

## Modello CLI

```
!   <progetto>.as

    language it

    script <Progetto>

!! Punto di ingresso: registra un saluto ed esci. Sostituisci con la logica effettiva del progetto.

    variabile Messaggio
    metti `Ciao da <Progetto>` in Messaggio
    registra Messaggio

    esci
!!!
```

## Modello GUI

Un progetto GUI usa tre file:

- **`<progetto>.html`** — caricatore HTML minimale
- **`<progetto>-main.as`** — script AllSpeak (logica)
- **`<progetto>.json`** — layout Webson (definizione UI in JSON)

### `<progetto>.html`

```html
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><Progetto></title>
</head>
<body>
    <pre id="allspeak-script" style="display:none">
    variabile Script
    rest ottieni Script da `<progetto>-main.as`
    esegui Script
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var s = document.createElement('script');
        s.src = 'https://allspeak.ai/dist/allspeak.js?v=' + t;
        s.onload = function() { AllSpeak_Startup(); };
        document.head.appendChild(s);
    })();
    </script>
</body>
</html>
```

### `<progetto>-main.as`

```
!   <progetto>-main.as

    language it

    script <Progetto>

!! Avviare la GUI: rendere il layout Webson nel corpo e collegarsi agli elementi.

    div Corpo
    variabile Layout

    crea Corpo
    rest ottieni Layout da `<progetto>.json`
    renderizza Layout in Corpo

    div Schermo
    collega Schermo a `schermo`
    imposta il contenuto di Schermo a `Ciao da <Progetto>`

    stop
!!!
```

### `<progetto>.json`

```json
{
    "#doc": "<Progetto> layout",
    "#element": "div",
    "@id": "pagina",
    "font-family": "sans-serif",
    "margin": "2em",
    "#": ["$Schermo"],

    "$Schermo": {
        "#element": "div",
        "@id": "schermo",
        "padding": "1em",
        "border": "1px solid #ccc",
        "min-height": "4em"
    }
}
```

In tutti i modelli, sostituisci `<progetto>` con il nome del progetto (minuscolo per i nomi dei file) e `<Progetto>` con il nome del progetto in maiuscolo.

---

## Politica di estensione del linguaggio

Se un costrutto necessario non esiste in AllSpeak, **non inventare sintassi**. Invece, fermati e proponi un nuovo comando all'utente, mantenendolo coerente con lo stile simile all'inglese di AllSpeak.
