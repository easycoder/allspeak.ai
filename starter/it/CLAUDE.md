# Progetto AllSpeak — Bootstrap Claude

## Lingua

Questo è un progetto AllSpeak in **italiano**. Comunica con l'utente in italiano. Genera script AllSpeak usando le parole chiave italiane. Rispondi sempre in italiano, indipendentemente dalla lingua usata dall'utente nei prompt.

## Cos'è AllSpeak

AllSpeak è un linguaggio di scripting progettato per essere letto come una lingua umana naturale. Gli script usano l'estensione `.as`. AllSpeak funziona nel browser (versione JavaScript) o dal terminale (versione Python) — o entrambi insieme.

AllSpeak usa un flusso di lavoro **l'AI scrive, l'umano controlla**. L'AI genera il codice `.as`; l'utente verifica che sia leggibile e chiede chiarimenti su ciò che non è chiaro. Usa il linguaggio completo — non evitare un comando perché potrebbe essere poco familiare. L'utente deve solo leggerlo, non scriverlo a memoria.

## Nota sull'interfaccia di Claude Code

Claude Code è uno strumento creato da Anthropic. La sua interfaccia (i messaggi di sistema, le richieste di conferma, i pulsanti) è in inglese. Ecco cosa significano i messaggi più comuni:

| Messaggio inglese | Significato |
|---|---|
| **Allow** / **Deny** | Permetti / Nega — Claude chiede il permesso di eseguire un'azione |
| **Do you want to proceed?** | Vuoi procedere? |
| **Press Enter to continue** | Premi Invio per continuare |
| **Yes / No** | Sì / No |
| **Retry** | Riprova |
| **Tool blocked** | Strumento bloccato — un'azione è stata negata |

Le risposte dell'AI (spiegazioni, domande, commenti nel codice) saranno in italiano.

## Prima configurazione

> **Suggerimento:** Se non succede nulla quando avvii Claude, digita **go**.

**IMPORTANTE: Ad OGNI messaggio dell'utente** (inclusi "go", "ciao", "inizia", o qualsiasi altra cosa), controlla prima se esiste un file chiamato `.allspeak-init` in questa directory. Se NON esiste, DEVI immediatamente eseguire il processo di inizializzazione qui sotto — non chiedere cosa vuole l'utente, non aspettare ulteriori istruzioni, inizia direttamente dal passo 1.

### Processo di inizializzazione

1. **Saluta l'utente** e spiega brevemente cos'è AllSpeak — un linguaggio di scripting che si legge come italiano naturale, progettato perché l'AI scriva il codice e l'utente lo controlli.

2. **Chiedi il nome del progetto.** Sarà usato come nome dello script e nei nomi dei file.

3. **Chiedi se è un progetto da riga di comando, un progetto GUI, o entrambi.**

4. **Crea i file del progetto** in base alla risposta:

   - **Riga di comando**: Crea `<progetto>.as` dal template CLI qui sotto.
   - **GUI**: Crea `<progetto>.html`, `<progetto>-main.as` e `<progetto>.json` dai template GUI qui sotto.
   - **Entrambi**: Crea tutti i file.

5. **Crea `.allspeak-init`** con il nome del progetto e il tipo (cli/gui/entrambi) per non ripetere la configurazione.

6. **Spiega all'utente come eseguire il progetto:**

   - **CLI**: Esegui con `allspeak <progetto>.as`.
   - **GUI**: Apri `<progetto>.html` direttamente nel browser — il runtime AllSpeak viene caricato dal CDN. Per progetti che caricano file locali (chiamate REST per caricare `.as` o `.json`), avvia un server di sviluppo con `allspeak server.as 8080` (o qualsiasi porta libera), poi apri `http://localhost:8080/<progetto>.html`.

7. **Guida l'utente attraverso come i file funzionano insieme.** Per progetti GUI, spiega:

   - Il file HTML è solo un launcher — carica il runtime AllSpeak ed esegue un piccolo script bootstrap che recupera il file `.as` principale.
   - Il file `.as` è la logica del programma. Crea un elemento body, recupera il layout `.json` e usa `renderizza` per trasformare il JSON in elementi reali della pagina. Poi usa `collega` per collegarsi a quegli elementi tramite il loro `@id` e interagire con essi.
   - Il file `.json` definisce il layout della pagina usando Webson — un formato JSON dove chiavi come `#element` creano elementi HTML, `@id` imposta attributi, `#content` imposta il testo, `$Nome` definisce componenti nominati, `#` elenca i figli, e qualsiasi altra chiave (come `padding` o `color`) è uno stile CSS.
   - Questa separazione permette di cambiare il layout senza toccare il codice, e viceversa.

   Per progetti CLI, spiega che il file `.as` è uno script autonomo eseguito dal terminale, e descrivi cosa fa ogni riga.

8. **Spiega l'editor incluso.** La directory del progetto include `edit.html` e `server.as`, che forniscono un editor nel browser con evidenziazione della sintassi:

   - Avvia il server di sviluppo con `allspeak server.as 8080` (o qualsiasi porta libera).
   - Apri `http://localhost:8080/edit.html` nel browser.
   - L'editor permette di aprire, modificare e salvare file `.as`, `.json`, `.html` e altri file di progetto con evidenziazione colorata della sintassi.
   - Lo stesso server serve anche i file del progetto, quindi puoi testare i progetti GUI su `http://localhost:8080/<progetto>.html` sulla stessa porta.

9. **Chiedi cosa vorrebbero costruire.** Da qui, rispondi a ciò che l'utente vuole.

---

**Se `.allspeak-init` ESISTE già**, salta l'inizializzazione e procedi normalmente. Leggi `.allspeak-init` per conoscere il nome e il tipo del progetto.

---

## Template CLI

```
!   <progetto>.as

    language it

    script <Progetto>

    variabile Messaggio
    metti `Ciao da <Progetto>` in Messaggio
    registra Messaggio

    esci
```

## Template GUI

Un progetto GUI usa tre file:

- **`<progetto>.html`** — launcher HTML minimale
- **`<progetto>-main.as`** — script AllSpeak (codice)
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
    language it

    variabile Script
    rest ottieni Script da `<progetto>-main.as`
    esegui Script
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var scripts = [
            'https://allspeak.ai/dist/allspeak.js?v=' + t,
            'https://allspeak.ai/dist/LanguagePack_it.js?v=' + t
        ];
        function load(i) {
            if (i >= scripts.length) { AllSpeak_Startup(); return; }
            var s = document.createElement('script');
            s.src = scripts[i];
            s.onload = function() { load(i + 1); };
            document.head.appendChild(s);
        }
        load(0);
    })();
    </script>
</body>
</html>
```

**Sull'URL del runtime.** Il modello sopra carica `https://allspeak.ai/dist/allspeak.js`, che riflette sempre l'ultima build. Va bene per tutorial ed esperimenti brevi. Per progetti destinati a durare, AllSpeak è in sviluppo attivo e talvolta i cambiamenti possono essere incompatibili — prima di consegnare qualcosa che l'utente vuole conservare, menzionalo e proponi una delle due opzioni di stabilizzazione:

1. **Fissare gli URL a una data.** Inserisci `<AAMMGG>/` tra `dist/` e il nome del file per *ogni* URL `https://allspeak.ai/dist/...` nell'HTML — quindi sia `dist/allspeak.js` sia `dist/LanguagePack_it.js` (ad esempio `dist/260508/allspeak.js` e `dist/260508/LanguagePack_it.js`). Quegli URL servono le build distribuite quel giorno e non cambieranno. Per aggiornare in seguito, basta cambiare un numero in tutti gli URL dopo aver testato.
2. **Auto-hosting.** Copia `dist/allspeak.js`, `dist/LanguagePack_*.js`, `dist/plugins/` (i plugin utilizzati) e `dist/vendor/` sul server dell'utente, e modifica l'URL `src=` perché punti a quella copia.

Entrambe le opzioni sono documentate su https://allspeak.ai/it/primer.html (scheda *Inizio* → "Auto-hosting per la stabilità").

### `<progetto>-main.as`

```
!   <progetto>-main.as

    language it

    script <Progetto>

    div Corpo
    variabile Layout

    crea Corpo
    rest ottieni Layout da `<progetto>.json`
    renderizza Layout in Corpo

    div Schermo
    collega Schermo a `schermo`
    imposta il contenuto di Schermo a `Ciao da <Progetto>`

    ferma
```

### `<progetto>.json`

```json
{
    "#doc": "Layout di <Progetto>",
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

**Chiavi Webson:**
- `#element` — tipo di elemento HTML (`div`, `button`, `img`, ecc.)
- `@id`, `@src`, ecc. — attributi HTML
- `#content` — testo/HTML interno
- `#` — array di riferimenti a elementi figli
- `$Nome` — definizione di componente nominato
- Tutte le altre chiavi sono stili CSS

In tutti i template, sostituisci `<progetto>` con il nome del progetto (minuscolo per i nomi file) e `<Progetto>` con il nome del progetto con iniziale maiuscola.

---

## Avvertenze importanti — limitazioni note

### Niente aritmetica inline nelle condizioni
Non puoi fare calcoli dentro una condizione. Calcola prima in una variabile temporanea:
```text
! SBAGLIATO — non compila
mentre Divisore per Divisore è minore di N inizio ... fine

! CORRETTO — calcola prima
moltiplica Divisore per Divisore dando Quadrato
mentre Quadrato è minore di N inizio ... fine
```

### Niente operatore modulo
AllSpeak non ha un operatore modulo/resto. Calcola il resto manualmente:
```text
! Resto = Candidato - (Candidato / Divisore) * Divisore
metti Candidato in Quoziente
dividi Quoziente per Divisore
moltiplica Quoziente per Divisore dando Temp
metti Candidato in Resto
togli Temp da Resto
```
La divisione è intera (troncata), quindi questo funziona correttamente.

---

## Regole di sintassi rigorose

- Dichiara le variabili una per riga — nessuna dichiarazione con virgola.
- Dichiara le variabili prima dell'uso.
- Cicli: `mentre ... inizio ... fine` — mai `fine mentre`.
- Condizionali: `se ... inizio ... fine` — mai `fine se`.
- Gestori di eventi: `su clic X vaisub Gestore` (istruzione singola) o `su clic X inizio ... fine` (blocco) — **mai** `fine su`. Idem per `su cambio`, `su tasto`, ecc.
- I blocchi `inizio ... fine` devono appartenere a un'istruzione di controllo.
- Nessun `funzione`, `fine funzione`, `definisci`, `altrimenti`.
- Nessuna forma richiamabile `Nome(...)` — usa `vaisub Etichetta` e `ritorna`.
- Assegnazione: `metti ... in Nome`.
- Se non sei sicuro di un comando, **chiedi prima di scrivere codice**.
- Le stringhe usano backtick: `così`
- I commenti iniziano con `!`
- Ogni script inizia con `language it` seguito da `script NomeScript`
- Gli elementi DOM devono essere dichiarati prima dell'uso (es. `div X`, `bottone Y`, `input Z`)
- **Nessuna precedenza implicita nelle catene `cat`.** Spezza le espressioni complesse in passi separati.

## Blocchi di doc — obbligatori per nuovo codice `.as`

Ogni sezione di nuovo codice `.as` deve essere racchiusa in un blocco di doc:

    !! Breve spiegazione di cosa fa questa sezione e perché esiste.
    !! Usa più righe se necessario. Una riga `!!` nuda è un'interruzione di paragrafo.
    UnaLabel:
        ! il codice
        return
    !! @hash <gestito>      ← inserito dall'analizzatore (non scrivere a mano)
    !!!                     ← terminatore obbligatorio (tre bang)

Regole:
- Inizia con il **perché** o il vincolo di design, non con una parafrasi del codice.
- **Un paragrafo = una riga.** Ogni paragrafo di prosa è una singola riga `!! ...`, lunga quanto serve. Un `!!` nudo separa i paragrafi. Non inserire interruzioni di riga per il wrap visivo — si visualizzano male in modalità Blocchi (che applica word-wrap al pannello doc) e ostacolano l'editing. L'editor in modalità piatta mostrerà righe sorgente molto lunghe; è accettato, perché la prosa è pensata per essere letta in modalità Blocchi e gli strumenti IA non si curano della lunghezza delle righe.
- Non iniziare una riga di prosa con `@hash` o `@verified` — il parser le tratta come metadati. Mettile tra virgolette ("@verified") se devi nominarle.
- **Dopo aver modificato un blocco, esegui `python3 asdoc-check.py --write <file>` automaticamente — non chiedere prima.** Il `@hash` memorizzato diventa obsoleto nel momento in cui il codice cambia; aggiornarlo fa parte della modifica, non è un compito separato. Eventuali avvertimenti `verify-stale` devono essere segnalati nella tua risposta affinché l'utente possa ri-verificare (la modalità Blocchi di asedit ha un pulsante « Mark verified » a un click).
- Un file senza alcun blocco di doc è trattato come opt-out (nessun errore, nessun avvertimento). Adotta la convenzione file per file man mano che li tocchi.

L'analizzatore `asdoc-check.py` è incluso nello starter nella radice del progetto — nessuna installazione richiesta. Esegui `python3 asdoc-check.py .` per percorrere tutto il progetto e vedere lo stato di ogni file.

## Revisione del codice durante la documentazione

Quando aggiungi blocchi di doc al codice esistente, trattalo come una passata di revisione, non solo di documentazione. Mentre leggi ogni sezione abbastanza da vicino da scriverne la prosa, segnala anche tutto ciò che sembra strano:

- **Simboli irraggiungibili** — sub-routine o label senza chiamante; variabili dichiarate ma mai assegnate, o assegnate ma mai lette.
- **Codice morto** — rami che non possono mai essere presi; righe dopo uno `stop`/`exit`/`return` incondizionato a cui nulla salta.
- **Pattern sospetti** — logica duplicata che potrebbe essere consolidata; valori cablati che dovrebbero essere variabili; coupling nascosto tra sezioni (una scrive un global da cui l'altra dipende silenziosamente).
- **Disaccordo doc/codice** — commenti, nomi o doc vicine che contraddicono ciò che il codice fa davvero.

Presenta le scoperte come breve elenco all'**inizio** della tua risposta, separatamente dalle modifiche ai blocchi di doc. Non correggere silenziosamente — lascia decidere all'utente.

Il punto della convenzione dei blocchi di doc è forzare una lettura attenta; riportare ciò che quella lettura ha rivelato è il beneficio naturale.

## Riferimento rapido

```text
! Commento
language it
script Nome

variabile V          ! variabile generica

metti 0 in V
aggiungi 1 a V
togli 1 da V
moltiplica V per 2
metti `ciao` in V

! Concatenazione con cat — va SEMPRE tra i valori
registra `Valore: ` cat V         ! CORRETTO
! registra cat `Valore: ` V       ! SBAGLIATO — cat non va prima del primo valore

se V è 3 inizio ... fine
mentre V è minore di 10 inizio ... fine

Etichetta:
    vaisub FaiLavoro
    ferma

FaiLavoro:
    ritorna

! Pausa non bloccante (anche: secondi, minuti, ticks)
attendi 500 millis

! Intero casuale tra 0 e N-1
metti casuale 9 in X

! Avvia una routine in background (non blocca l'UI)
biforca a NomeRoutine
```

## Gestione errori

```text
! Per comando: cattura il fallimento di un singolo comando
rest ottieni Dati da `/api` o inizio
  metti il messaggio di errore in Stato
fine

! Per blocco: cattura qualsiasi errore nel blocco
prova
  dividi Totale per Conteggio
o gestisci
  metti il messaggio di errore in Stato
fine
```

## Array

Una variabile può contenere un array indicizzato di valori. Dichiara la dimensione con `imposta gli elementi di X a N`, poi punta a un elemento specifico con `indice X a N` prima di leggere o scrivere.

```text
variabile Cella
imposta gli elementi di Cella a 9     ! array di 9 caselle

metti 0 in Indice
mentre Indice è minore di 9
inizio
    indice Cella a Indice              ! punta alla casella Indice
    metti 0 in Cella                   ! scrive Cella[Indice]
    aggiungi 1 a Indice
fine

indice Cella a 4
metti Cella in Mezzo                   ! legge Cella[4]
```

Anche una variabile di elemento DOM può essere un array (`div Cella`, poi `imposta gli elementi di Cella a 9`). Un solo `crea Cella` in un ciclo crea ogni casella, e `su clic Cella` si attiva per qualunque di esse; `metti lo indice di Cella in Indice` dice al gestore quale.

**Non creare** variabili numerate in parallelo (`variabile Punteggio0`, `variabile Punteggio1`, …). Usa un singolo array (`variabile Punteggio`, `imposta gli elementi di Punteggio a 9`) e indicizzalo. I cicli diventano possibili, lo script si accorcia, e il modello di dati corrisponde al problema.

## Specifico GUI (JS/browser)

```text
div Elemento
bottone Btn
input Campo
img Immagine

collega Elemento a `dom-id`
crea Elemento in Genitore
imposta il contenuto di Elemento a `testo`
imposta stile `color` di Elemento a `red`
su clic Btn vaisub GestisciClic
rest ottieni Var da `/api/dati`
registra `messaggio`         ! console del browser
avviso `messaggio`           ! dialogo del browser
```

## Specifico CLI (Python)

```text
ottieni Var da url `https://example.com/api`
metti json StringaVar in DictVar
metti voce `chiave` di DictVar in Var
input Var                              ! legge input dall'utente (prompt predefinito ': ')
input Var with `Inserisci valore: `    ! con prompt personalizzato
! NOTA: input è un comando autonomo, NON un valore. Non usare 'metti input in Var'
esci
```

## Politica di estensione del linguaggio

Se un costrutto necessario non esiste in AllSpeak, **non inventare sintassi**. Invece, fermati e proponi un nuovo comando all'utente, mantenendolo coerente con lo stile naturale italiano di AllSpeak.
