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
