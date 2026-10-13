# Iniziare

Una configurazione una volta sola, poi una piccola applicazione costruita prompt dopo prompt e osservata mentre gira. Niente qui ti chiede di scrivere codice.

## Prima di iniziare

Tre cose:

- **Python 3** — il comando `allspeak` è un pacchetto Python.
- **Un terminale** — la finestra in cui si digitano i comandi. PowerShell su Windows, Terminale su macOS o Linux.
- **Un agente AI di programmazione.** Uno dei due qui sotto andrà bene.

Una cosa da sapere prima di cominciare: **l'agente scrive l'AllSpeak, tu lo rileggi.** Non digiterai una sola riga di codice — con una sola eccezione: il comando che avvia Viz.

## Avviare Viz

Viz è una pagina web, ma non è un sito che si visita. Viene servita dalla tua macchina, e un solo comando la avvia:

```
allspeak viz
```

**Ci sono due metà in questo, e la distinzione merita un momento.** Il comando avvia il *server di sviluppo* di AllSpeak — un piccolo programma AllSpeak, eseguito dal runtime Python — su `localhost:8080`, e apre nel browser la pagina che serve. Il **server** vive in quel terminale e deve continuare a girare; **Viz** è la pagina, e vive nel browser. Chiudi il terminale e Viz smette di rispondere: è per questo che tutte le istruzioni qui sotto ti dicono di lasciarlo aperto.

Il motivo di questa separazione è che una pagina web non può leggere una cartella. Un server sì: è lui che elenca i file del tuo progetto, li apre, li riscrive quando salvi ed esegue i tuoi script. E poiché sta su `localhost` e non su internet, il tuo progetto resta sulla tua macchina.

Lo stesso server risponde anche a `http://localhost:8080/<la-tua-pagina>.html` — la pagina della tua applicazione — così un solo comando ti dà sia lo strumento sia quello che stai costruendo. Rieseguire `allspeak viz` è innocuo: il comando trova il server già lì e si limita a riaprire la pagina.

## Configurazione

### AllSpeak con Claude Code

Claude Code è un agente AI di programmazione che funziona nel tuo terminale.

1. Installa AllSpeak: `pip install -U allspeak-ai`
2. Crea una cartella vuota per il tuo progetto.
3. Scarica [allspeak-it.zip](https://allspeak.ai/allspeak-it.zip) e decomprimilo in quella cartella. È lo *starter pack* — le istruzioni per il tuo agente, e la nota che dice quale lingua parla questo progetto. Non contiene strumenti, ed è voluto: tutto il resto viene scaricato nel momento in cui serve, così nella tua cartella nulla può diventare obsoleto.
4. Installa Claude Code (vedi [claude.ai/code](https://claude.ai/code)).
5. Nella cartella del progetto, avvia Viz: `allspeak viz`. Lascia girare questo terminale.
6. Apri un **secondo** terminale nella stessa cartella e digita `claude`.
7. Quando Claude si avvia, digita **go**.

### AllSpeak con Reasonix

Reasonix è un agente AI di programmazione con un'applicazione desktop, che molti trovano più facile da tenere d'occhio rispetto a un terminale.

1. Installa AllSpeak: `pip install -U allspeak-ai`
2. Scarica e installa l'app Reasonix da [reasonix.io](https://reasonix.io).
3. Crea una cartella vuota per il tuo progetto.
4. Scarica [allspeak-it.zip](https://allspeak.ai/allspeak-it.zip) e decomprimilo in quella cartella — lo stesso starter pack di sopra.
5. Nella cartella del progetto, avvia Viz: `allspeak viz`. Lascia girare questo terminale; è l'unico che ti serve.
6. Avvia Reasonix, clicca su **Add new project** e scegli la cartella del tuo progetto.
7. Di' a Reasonix cosa vuoi costruire. Al primo utilizzo ti chiederà la chiave API DeepSeek e la conserverà.

### In entrambi i casi

Il tuo agente fa un paio di domande, crea i file del progetto e spiega a cosa serve ciascuno. Da lì in poi è una conversazione: tu dici cosa vuoi, lui scrive il codice.

**Il suo primo compito è presentarti Viz** — la pagina ora aperta nel tuo browser, e il posto dove avvierai l'applicazione, osserverai un'esecuzione e vedrai cosa ha fatto l'AI. Lascia che te lo mostri; essere guidati una volta è meglio che leggerne la descrizione.

Una nota sui comandi: l'estensione `.allspeak` è facoltativa, quindi `allspeak mioprogetto` e `allspeak mioprogetto.allspeak` sono lo stesso comando.

## Costruiscilo: la griglia di colori

Quattro prompt, ognuno aggiunge una funzionalità a quello precedente. Inviali uno alla volta, e leggi la risposta prima di inviare il successivo.

![App Colour Memory che mostra una griglia 4×3 di celle in colori misti con un pulsante Reset sotto](primer/color-memory.png)

### Prompt 1 — la griglia

Crea una griglia di 4 colonne per 3 righe di celle quadrate centrata nella pagina. Ogni cella deve essere grigia con un sottile bordo nero. La griglia deve occupare circa un terzo della larghezza dello schermo. Niente clic, niente pulsanti — solo il layout visivo per ora.

### Prompt 2 — clic per cambiare colore

Fai in modo che ogni cella cambi colore quando viene cliccata. Cicla attraverso questa sequenza: grigio, rosso, blu, verde, giallo, viola, e di nuovo grigio. Ogni cella tiene traccia del proprio colore indipendentemente dalle altre.

### Prompt 3 — un pulsante di azzeramento

Aggiungi un pulsante Reset sotto la griglia. Cliccandolo si devono riportare tutte le celle al grigio. Non rendere il pulsante a tutta larghezza — solo di dimensione ragionevole.

### Prompt 4 — sopravvivere a un ricaricamento

Fai in modo che lo stato della griglia sopravviva ai ricaricamenti della pagina. Quando aggiorno la pagina, ogni cella deve ancora avere il colore che le ho lasciato per ultimo. Il pulsante Reset deve anche cancellare lo stato salvato, così un aggiornamento dopo il Reset mostra una griglia pulita.

## Cosa osservare

Dopo ogni prompt, controlla cosa ha creato l'AI. Dovresti riuscire a seguire l'AllSpeak — è proprio il punto. Se qualcosa non va, dillo in linguaggio naturale e verrà corretto.

Alcune piccole cose potrebbero dover essere corrette al primo tentativo — una dichiarazione di variabile mancante, una scelta di layout poco felice, un colore che vorresti regolare. È normale; il flusso di lavoro è progettato perché sia l'umano a individuare e guidare, non perché l'AI produca prime versioni perfette.

Puoi vedere tutto l'esempio mentre viene costruito in questa breve registrazione: [AllSpeak primer in action](https://www.youtube.com/watch?v=BSvh4MPEzV4).

## Guarda adesso l'esecuzione

Viz mostra un'*esecuzione*, non il codice: il primo passo è quindi dire quale parte di un'esecuzione vale la pena osservare. Chiedi al tuo agente:

> Segna il gestore del clic e registra un'esecuzione per me.

Questo mette una riga `viz start` dove comincia la parte interessante e una riga `viz stop` dove finisce, e nomina la pagina della tua applicazione perché Viz sappia cosa aprire. Poi, in Viz:

- **Record** la esegue e salva l'esecuzione accanto al tuo script, in un file `.viz.json`. La tua applicazione si apre in una finestra propria — clicca qualche cella lì, poi chiudi quella finestra.
- **Graph** disegna quello che è successo: le righe dello script come righe, un segno ovunque l'esecuzione sia arrivata, e calore dove è arrivata spesso.
- **Clicca su un segno** e la barra laterale mostra il blocco da cui proviene — la prosa scritta dal tuo agente, accanto al codice che descrive, con la riga, la visita e il totale.
- **Blocks** legge tutto lo script in questo modo, blocco per blocco, così puoi controllare cosa ha fatto l'AI senza leggere codice.

Poi fai la domanda successiva e rispondi allo stesso modo: restringi i marcatori intorno a ciò che ti lascia incerto, registra di nuovo, guarda di nuovo. Questo ciclo è tutto il lavoro — e niente di tutto ciò ti ha chiesto di scrivere una riga.

## Domande?

Contattaci a [info@allspeak.ai](mailto:info@allspeak.ai).

## Nota sulle varianti linguistiche

AllSpeak è in sviluppo attivo. Le varianti in lingue diverse dall'inglese possono contenere parole chiave o pattern non ancora completamente supportati dal motore. Se incontri un errore di compilazione su una parola chiave che sembra corretta, segnalalo a [info@allspeak.ai](mailto:info@allspeak.ai) — di solito la correzione è rapida.

## Più tardi: se tieni il progetto

Lo starter pack e la pagina del tuo progetto caricano il runtime da `https://allspeak.ai/dist/`, che riflette sempre l'ultima versione. Va bene per i tutorial e gli esperimenti brevi. Per un progetto che intendi mantenere nel tempo, fissalo, così che un aggiornamento successivo non possa cambiarlo sotto di te:

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

Quell'URL serve la build distribuita l'8 maggio 2026, e non cambia mai. Per aggiornare, prova quella corrente e poi cambia il numero. Il [Codex](https://allspeak.ai/codex.html) spiega come ospitare il runtime per conto tuo.
