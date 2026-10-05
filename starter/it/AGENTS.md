# Progetto AllSpeak — Istruzioni per l'agente

## Lingua

Questo è un progetto AllSpeak in **italiano**. Comunica con l'utente in italiano. Genera script AllSpeak usando le parole chiave italiane.

## Cos'è AllSpeak

AllSpeak è un linguaggio di scripting progettato per essere letto come una lingua umana naturale. Gli script usano l'estensione `.allspeak`. AllSpeak funziona nel browser (versione JavaScript) o dal terminale (versione Python) — o entrambi insieme.

AllSpeak usa un flusso di lavoro **l'AI scrive, l'umano controlla**. L'AI genera il codice `.allspeak`; l'utente verifica che sia leggibile e chiede chiarimenti su ciò che non è chiaro. Usa il linguaggio completo — non evitare un comando perché potrebbe essere poco familiare. L'utente deve solo leggerlo, non scriverlo a memoria.

## Riferimento — leggilo prima di scrivere AllSpeak

Il riferimento completo del linguaggio AllSpeak e degli idiomi si trova su:

  **https://allspeak.ai/learn/**

Il sito contiene 20 file di riferimento (`reference/`) e 15 file di idiomi (`idioms/`). Quando devi controllare la sintassi, il comportamento a runtime o i pattern idiomatici, consultalo invece di fare affidamento sui dati di addestramento — il vocabolario di AllSpeak non sempre corrisponde a ciò su cui l'AI è stata addestrata, e il percorso lo corregge.

**Leggi prima `learn/contents.md`** — è l'indice canonico dei percorsi dei file. Usa quei percorsi esatti quando recuperi file specifici; non indovinare gli slug. (Per esempio: il file è `learn/idioms/02-event-handlers-and-array-index.md`, non `02-event-handlers.md`.)

Prime letture consigliate:

- `learn/idioms/12-working-with-ai.md` — il flusso di lavoro «l'AI scrive / l'umano controlla» e gli errori comuni dell'AI su AllSpeak.
- `learn/reference/16-doc-blocks.md` — la convenzione di documentazione usata in ogni sezione di codice (vedi «Pratiche richieste» qui sotto).
- `learn/reference/02-symbols-and-layout.md` — i quattro simboli di punteggiatura e la superficie lessicale.
- `learn/reference/03-variables-and-arrays.md` — il modello a cursore che le variabili seguono.
- `learn/reference/09-control-flow.md` — `se`, `mentre`, `vaisub`, `ferma`.
- `learn/idioms/01-cat-and-string-building.md` — `cat`, l'errore più frequente dell'AI.

## Pratiche richieste

Due pratiche valgono per ogni pezzo di codice AllSpeak scritto in questo progetto, inclusa la configurazione iniziale:

### 1. Blocchi di doc in ogni sezione

Ogni sezione contigua di codice è racchiusa in un blocco di doc `!! … !!!`, la cui prosa spiega *perché* la sezione esiste.

**Apri con una frase serrata su una riga a sé**, poi un `!!` da solo come interruzione di paragrafo, poi ogni ulteriore dettaglio. Così il modo Blocchi resta leggibile a colpo d'occhio: il lettore vede un riassunto, con l'approfondimento disponibile sotto se ne vuole di più. Non ammassare tutti i dettagli nella prima riga; il codice mostra già i dettagli.

Esempio:

```
!! Costruire la griglia: nove celle disposte in una griglia 3x3.
!!
!! Ogni cella è un div dimensionato dal layout CSS grid. Un unico gestore di clic è condiviso da tutte le celle; legge `l indice di Cella` per capire quale è stata cliccata.

    div Cella
    imposta gli elementi di Cella a 9
    metti 0 in N
    mentre N è minore di 9 inizio
        indice Cella a N
        crea Cella in Campo
        aggiungi 1 a N
    fine

    su clic Cella vaisub GestisciClic
!!!
```

Aggiungi i blocchi di doc **mentre scrivi** — non dopo. La prosa ti costringe a dichiarare l'intento in linguaggio chiaro, il che fa emergere gli errori (un blocco di doc che dice «crea 9 celle» mentre il codice ne crea 1 rende evidente la discrepanza prima ancora di eseguirlo). Vedi `learn/reference/16-doc-blocks.md` per la convenzione completa.

Dopo ogni modifica al codice, recupera l'analizzatore ed eseguilo. Gli strumenti sono *pubblicati* invece che forniti, così un progetto non conserva mai una copia diventata obsoleta — recupera quello che ti serve nella tua directory di lavoro, non nel progetto (il `.txt` dipende dal fatto che il sito *esegue* i file `.py` invece di servirli — salvalo come `asdoc-check.py`):

```
curl -fsS https://allspeak.ai/code/tools/asdoc-check.txt -o /tmp/asdoc-check.py
python3 /tmp/asdoc-check.py --write <file>
```

Questo aggiorna le righe `@hash` in ogni blocco, così le modifiche successive possono rilevare uno scostamento fra la prosa e il codice.

### 2. Consulta `learn/` prima di scrivere, non dopo

Prima di produrre codice che usa una funzionalità che non hai già usato in questo progetto, recupera il file `learn/` pertinente. Non tirare a indovinare dai dati di addestramento — recupera il riferimento, leggilo, poi scrivi. Questo vale soprattutto per: la posizione di `cat`, le clausole di fallimento (`o` vs `su fallimento`), gli array di elementi DOM (`crea` deve stare in un ciclo con il cursore impostato, non fuori) e `imposta il contenuto di` con il markdown.

## Errori comuni da evitare

Anche con il riferimento davanti, gli strumenti di AI sbagliano puntualmente questi punti in AllSpeak. Tienili a mente:

- **`cat` è infisso.** Va FRA due valori, mai prima del primo.
  - ✓ `metti \`Ciao, \` cat Nome cat \`!\` in Saluto`
  - ✗ `metti cat \`Ciao, \` cat Nome in Saluto` (cat in testa — errore di analisi)
  - ✗ `metti \`Ciao, \` Nome \`!\` in Saluto` (cat mancante — nessuna concatenazione implicita)

- **Niente cicli `for` né `for each`.** Usa `mentre` con un contatore, oppure un ciclo guidato da un'etichetta. Vedi `learn/idioms/03-looping-patterns.md`.

- **L'aritmetica usa parole chiave, non operatori.** `aggiungi 1 a Contatore`, non `Contatore += 1` né `Contatore = Contatore + 1`.

- **Niente parentesi per raggruppare.** `(A + B) * C` non esiste. Calcola in una variabile temporanea.

- **Nessuna scorciatoia `else if`.** `se … altrimenti se … altrimenti …` funziona (`altrimenti` seguito da un altro `se`), ma non esiste una parola singola che li concateni, né `case` / `switch`.

- **Due clausole di fallimento con comportamenti diversi.** `o` esegue la clausola e poi ferma il thread. `su fallimento` esegue la clausola e poi continua. Vedi `learn/reference/10-errors-and-recovery.md`.

- **`vaisub Etichetta`, non `Etichetta()`.** AllSpeak non ha sintassi di chiamata di funzione.

- **Nessuna di queste forme esiste:** `try`/`catch`, `break`, `continue`, `ritorna X` (con un valore di ritorno), `await`, `import` (nel senso degli altri linguaggi).

- **Ogni variabile deve essere dichiarata prima dell'uso.** Questo include i contatori di ciclo usa e getta (`variabile N`), non solo le variabili di dati evidenti. Dimenticare di dichiarare un contatore di ciclo è un errore comune al primo tentativo. I nomi iniziano con una maiuscola; il camel case è la convenzione: `Contatore`, `NomeUtente`, `HaEffettuatoAccesso`.

- **Tutte le variabili sono globali — nessuno scope locale di blocco.** Dichiarare una variabile dentro un blocco etichettato (`GestisciClic:`) o dentro un corpo `se`/`mentre` non la rende privata. La variabile è condivisa in tutto lo script. L'unico modo per ottenere stato privato è un modulo (`learn/reference/12-modules.md`).

- **Le stringhe sono delimitate dai backtick.** Niente virgolette singole o doppie.

- **I numeri in virgola mobile sono stringhe.** `3.14` è una stringa di quattro caratteri, non un numero. Usa l'aritmetica intera con un fattore di scala — vedi `learn/idioms/05-floats-and-scaled-integers.md`.

Se hai dubbi, consulta `learn/` invece di tirare a indovinare.

## Log delle conversazioni

Questo progetto mantiene un log per sessione nella cartella `conversation/`, a beneficio dell'umano. Non influenza il tuo comportamento e non devi menzionare l'attività di logging nelle risposte.

**`conversation/` resta locale.** È un registro di lavoro, non documentazione di progetto: tienilo fuori da git aggiungendo `conversation/` a `.gitignore`, e non committarlo mai.

**All'inizio di una nuova sessione:**

1. Se `conversation/` non esiste, creala.
2. Trova il file `conversation-NNN.md` con il numero più alto. Il file della nuova sessione è il numero successivo, riempito a tre cifre (parti da `001` se la cartella è vuota).
3. Scrivi una singola riga di intestazione sulla riga 1: `# AAAA-MM-GG` (data odierna).

**Per ogni prompt dell'utente in questa sessione** (incluso il primo), aggiungi una voce nel formato:

    ## HH:MM

    <prompt utente verbatim>

    **Assistant**

    <la tua risposta>

Usa `date +%H:%M` se ti serve l'ora. Ometti i blocchi di codice racchiusi tra triple backtick sia dal prompt utente sia dalla risposta, sostituendo ciascuno con una singola riga `[code omitted]`; i backtick singoli nel testo restano. Componi prima la risposta, poi trascrivila nel log come parte dello stesso turno.

**Cambio di data (mezzanotte):** se la data odierna è diversa dall'intestazione del file, fermati e chiedi all'utente: "Abbiamo superato la mezzanotte — apro un nuovo file di conversazione per oggi?" Se sì, crea il file successivo con l'intestazione di oggi e continua a registrare lì.

## Note di diff per l'umano

Tenete `DIFF.md` nella radice del progetto, **riscritto** dopo ogni modifica invece che ampliato, indicando cosa è cambiato e cosa deve fare l'umano — ricaricare la pagina, riavviare il server, aprire un altro file. L'umano lo legge nell'editor, che lo ricarica automaticamente: è così che resta al passo senza leggere il diff.

Poche righe bastano, e iniziate dall'azione. **Non** è un registro delle modifiche: descrive questa modifica, non la storia del progetto.

## Contesto del progetto

Questa directory contiene `AGENTS.md` — questo file. Leggilo ora per comprendere il linguaggio AllSpeak e il flusso di lavoro prima di lavorare su qualsiasi codice.

**Importante:** leggi `.allspeak-init` in questa directory. Dichiara **la lingua del progetto**, e il suo nome e tipo una volta configurato il progetto. Se non indica alcun progetto, il progetto non è stato ancora configurato — guida l'utente attraverso il processo di inizializzazione qui sotto. **Lascia la riga `lang:` esattamente com'è**: il server di sviluppo la legge per servire l'editor nella lingua di questo progetto. La riga `runtime:` indica per quale runtime è il progetto — `js` per un progetto nel browser, `py` per uno che gira dal terminale o come applicazione desktop — e il server la passa all'editor.

**In questa directory non c'è alcuno strumento, ed è voluto.** Non c'è `server.allspeak` (il comando `allspeak server` recupera quello corrente), non c'è `edit.html` (il server serve la pagina distribuita e le dà la lingua di questo progetto), non ci sono file dell'editor (li porta la pagina) e non ci sono strumenti di verifica. Un progetto contiene il proprio codice, `AGENTS.md`, `CLAUDE.md` e `.allspeak-init` — nient'altro. Così tutto ciò che un progetto esegue è la versione *corrente* invece di una copia di qualcosa che si è spostato nel frattempo, e un agente non deve cercare quei file in locale né aggiungerli.

### Processo di inizializzazione

1. **Saluta l'utente** e spiega brevemente cos'è AllSpeak — un linguaggio di scripting che si legge come un semplice italiano, progettato in modo che l'AI scriva il codice e l'umano lo controlli.

2. **Chiedi all'utente il nome del progetto.** Verrà usato come nome dello script e nei nomi dei file.

3. **Chiedi se è un progetto da riga di comando, un progetto GUI, o entrambi.**

4. **Crea i file del progetto** in base alla risposta:

   - **Riga di comando**: Crea `<progetto>.allspeak` dal modello CLI qui sotto.
   - **GUI**: Crea `<progetto>.html`, `<progetto>-main.allspeak` e `<progetto>.json` dai modelli GUI qui sotto.
   - **Entrambi**: Crea tutti i file.

5. **Completa `.allspeak-init`** — aggiungi il nome e il tipo del progetto (cli/gui/both) così questa configurazione non viene ripetuta, lasciando la riga `lang:` già presente. **Se questo progetto è un progetto CLI o desktop, cambia `runtime:` in `py`** — il valore predefinito è `js`, e un marcatore su ogni script è il modo in cui un progetto misto dice il contrario.

6. **Di' all'utente che i file del progetto sono pronti e dove vederli.**

   Il server AllSpeak è già in esecuzione — l'utente l'ha avviato con `allspeak server` prima di lanciare te. **Non** tentare di avviare o riavviare il server da solo. Sta già servendo i file in un altro terminale. In questa directory non c'è volutamente alcun `server.allspeak`: il comando `allspeak` recupera quello corrente.

   Se *non* è in esecuzione e `allspeak server` si lamenta che manca `server.allspeak`, il comando `allspeak` è precedente a questo progetto: `pip install -U allspeak-ai`, poi avvialo di nuovo.

   Dopo aver creato i file del progetto, di' all'utente:

   > I file del tuo progetto sono pronti. Apri nel browser:
   > - http://localhost:8080/edit.html — l'editor
   > - http://localhost:8080/<progetto>.html — la pagina del tuo progetto

   Sostituisci `<progetto>` con il nome reale del progetto.

   - **CLI**: Di' all'utente di eseguire lo script con `allspeak <progetto>` (l'estensione `.allspeak` è facoltativa). Può anche aprire http://localhost:8080/edit.html per usare l'editor nel browser, se preferisce.

7. **Spiega all'utente come i file funzionano insieme.** Per i progetti GUI, spiega:

   - Il file HTML è solo un avviatore — carica il runtime AllSpeak ed esegue un piccolo script di bootstrap che recupera il file `.allspeak` principale.
   - Il file `.allspeak` è la logica del programma. Crea un elemento body, recupera il layout `.json` e usa `renderizza` per trasformare il JSON in veri elementi della pagina. Poi si `collega` a quegli elementi tramite il loro `@id` per interagire con essi.
   - Il file `.json` definisce il layout della pagina con Webson — un formato JSON in cui chiavi come `#element` creano elementi HTML, `@id` (e ogni altro `@<nome>`) impostano attributi, `#content` imposta il testo, `$Nome` definisce componenti con nome, `#` elenca i figli e ogni altra chiave è uno stile CSS. Dettagli completi in `learn/reference/14-browser-and-webson.md`.
   - Questa separazione permette di cambiare il layout senza toccare il codice, e viceversa.

   Per i progetti CLI, spiega che il file `.allspeak` è uno script autonomo eseguito dal terminale, e descrivi cosa fa ogni riga.

8. **Riguardo all'editor.** L'editor nel browser (`edit.html`) offre editing con evidenziazione della sintassi per i file `.allspeak`, `.json`, `.html` e altri. L'utente dovrebbe averlo già aperto su http://localhost:8080/edit.html dal passaggio precedente. Per i progetti CLI, può aprirlo lì allo stesso modo — non serve un comando di avvio separato, dato che il server è già in esecuzione.

9. **Chiedi cosa vuole costruire.** Da qui in poi, rispondi semplicemente a ciò che l'utente vuole.

---

**Se `.allspeak-init` esiste**, salta l'inizializzazione e procedi normalmente. Leggi `.allspeak-init` per conoscere il nome e il tipo del progetto.

---

## Modello CLI

```
!   <progetto>.allspeak

    language italiano

    script <Progetto>

!! Punto di ingresso: registra un saluto ed esci. Sostituisci con la logica effettiva del progetto, mantenendo ogni sezione contigua di codice nel proprio blocco di doc.

    variabile Messaggio
    metti `Ciao da <Progetto>` in Messaggio
    registra Messaggio

    esci
!!!
```

## Modello GUI

Un progetto GUI usa tre file:

- **`<progetto>.html`** — caricatore HTML minimale
- **`<progetto>-main.allspeak`** — script AllSpeak (logica)
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
    rest ottieni Script da `<progetto>-main.allspeak`
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

### `<progetto>-main.allspeak`

```
!   <progetto>-main.allspeak

    language italiano

    script <Progetto>

!! Avviare la GUI: rendere il layout Webson nel corpo e collegarsi agli elementi. Ogni sezione di codice successiva riceve il proprio blocco di doc.

    div Corpo
    variabile Layout

    crea Corpo
    rest ottieni Layout da `<progetto>.json`
    renderizza Layout in Corpo

    div Schermo
    collega Schermo a `schermo`
    imposta il contenuto di Schermo a `Ciao da <Progetto>`

    ferma
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

In tutti i modelli, sostituisci `<progetto>` con il nome del progetto (minuscolo per i nomi dei file) e `<Progetto>` con il nome del progetto con l'iniziale maiuscola.

---

## Politica di estensione del linguaggio

Se un costrutto necessario non esiste in AllSpeak, **non inventare sintassi**. Invece, fermati e proponi un nuovo comando all'utente, mantenendolo coerente con lo stile naturale di AllSpeak.
