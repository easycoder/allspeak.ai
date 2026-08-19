# Debug di .as

## Problema

Uno script non fa ciò che ti aspetti — un valore è sbagliato, un gestore non scatta, un thread affama il runtime. Ti serve visibilità su ciò che sta davvero accadendo, e devi riprodurre il problema in modo abbastanza affidabile da sistemarlo.

## Gli strumenti di tutti i giorni

### `stampa` e `registra`

Scrivono un valore nel log del runtime. Le due parole chiave fanno la stessa cosa — `registra` si legge meglio quando tracci il flusso del programma, `stampa` si legge meglio quando mostri un risultato:

```as
stampa `Contatore: ` cat Counter
registra `Entro in MessageHandler con ` cat il messaggio mqtt
```

Il log appare nella console del browser (JS) o su stdout (Python). Usali liberamente durante lo sviluppo; in produzione rimuovili o proteggili con un flag.

### Log condizionale tramite il flag `tracciamento`

Il runtime ha un flag di traccia globale, testato con la condizione `tracciamento`:

```as
se tracciamento registra `Entro nello stato Idle`
```

Quando la traccia è attiva, il log scatta; quando è spenta, l'istruzione non fa nulla (viene comunque valutata — c'è un piccolo costo). Utile per istruzioni di log che vuoi nel codice ma che scattano solo durante le diagnosi.

### `debug step` e compagni

`debug step` registra ogni riga nel momento in cui il runtime la raggiunge — comodo quando vuoi trovare dove le cose sono andate storte. I suffissi `step` e `stop` restano in inglese: il motore accetta solo queste due forme.

```as
debug step
vaisub ComplicatedRoutine
```

`debug stop` annulla il passo a passo. `debug breakpoint` segna un punto in cui il debugger degli strumenti di sviluppo del browser può fermarsi nel sorgente JS sottostante. La parola chiave `debug` ha altri modi che vanno e vengono con le versioni del motore; tratta le forme documentate come il sottoinsieme stabile e controlla l'implementazione corrente per qualsiasi cosa di più esotico.

### `nulla`

Un'istruzione senza effetto. Il suo scopo è darti un punto noto nel JS/Python compilato o in esecuzione dove impostare un breakpoint lato nativo, in vista di un problema sospetto:

```as
nulla
stampa Result        ! il debugger JS/Python può fermarsi sulla riga sopra
```

Quando il runtime raggiunge `nulla`, il debugger del browser (o di Python) si ferma se c'è un breakpoint impostato sul gestore di `nulla`, lasciandoti ispezionare lo stato del runtime subito prima dell'istruzione successiva.

### Il tracciatore

Il pannello del tracciatore mostra gli eventi recenti del runtime. Attivalo dallo script:

```as
imposta le righe traccia a 10
```

Il Codex ha una pagina dedicata al tracciatore; vedi lì per l'insieme completo delle opzioni.

## Un flusso di lavoro di debug

Lento ma affidabile:

1. **Dichiara cosa ti aspetti** in un commento vicino al punto in cui sospetti il bug.
2. **Aggiungi istruzioni `stampa` o `registra`** nei punti di svolta rilevanti: l'inizio di un gestore, l'ingresso in una subroutine, l'uscita da un ciclo. Stampa i valori che dovrebbero corrispondere alla tua aspettativa.
3. **Esegui e leggi il log.** Dove la realtà diverge dall'aspettativa?
4. **Riduci il divario.** Avvicina le stampe finché non hai isolato l'istruzione che produce il valore sbagliato.
5. **Correggi.** Poi rimuovi le stampe, o proteggile con `se tracciamento`.

Questo forza un pensiero esplicito e produce una traccia scritta che puoi rileggere. Il debugger dell'IDE è più veloce quando riesci a isolare il bug su un singolo thread; il log è più affidabile per i problemi cross-thread, dove la pausa distorce i tempi.

## Riprodurre in `conformance/`

`/conformance/` contiene script che esercitano comportamenti specifici del motore. Quando un bug sembra stare nel motore (non nel tuo script), ridurlo a uno script `conformance/` minimale:

- Forza una dichiarazione precisa del malfunzionamento.
- Dà ai manutentori del motore qualcosa da eseguire.
- Diventa un test di regressione una volta sistemato.

Un buon script di conformità è piccolo (una schermata), autonomo (nessuna risorsa esterna) e chiamato in base a ciò che testa.

## Anti-pattern: modificare le cose senza leggere il log

È tentante ritoccare il codice finché il sintomo non sparisce. Di solito il bug si sposta invece di svanire. Leggi il log, trova la divergenza, poi modifica esattamente ciò che produce il valore sbagliato.

## Anti-pattern: `stampa` nei cicli stretti

```as
mentre N è minore di 10000 inizio
    stampa N
    ! ... lavoro ...
    aggiungi 1 a N
fine
```

Diecimila righe di log annegano il segnale. Campiona invece:

```as
mentre N è minore di 10000 inizio
    se N modulo 100 è 0 stampa `Raggiunto ` cat N
    ! ... lavoro ...
    aggiungi 1 a N
fine
```

Oppure usa il tracciatore, che mostra gli eventi recenti e scarta quelli vecchi.

## Anti-pattern: lasciare i log di produzione attivi

`stampa` e `registra` girano sempre. Una volta sistemato il bug, rimuovi l'istruzione o avvolgila con `se tracciamento`. Altrimenti la console di produzione si riempie di rumore che il prossimo debug dovrà attraversare.

## Correlati

- [flusso di controllo](../reference/control-flow.md) — `ferma`, `vaisub`, dove mettere le voci di debug.
- [multitasking cooperativo](../reference/cooperative-multitasking.md) — il tracciatore mostra l'alternanza dei thread.
- [lavorare con l'IA](working-with-ai.md) — quando il bug è un errore dell'IA.
