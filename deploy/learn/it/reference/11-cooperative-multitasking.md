# Multitasking cooperativo

AllSpeak esegue più thread in modo cooperativo. Lo script principale, ogni gestore di eventi e ogni thread biforcato sono thread di esecuzione separati che condividono lo stesso stato globale. Si alternano nell'esecuzione; il runtime non ne interrompe mai uno a metà di un'istruzione.

Questa è una differenza fondamentale rispetto ai thread del sistema operativo. Non c'è parallelismo, nessuna race condition dentro una singola istruzione e nessun bisogno di lock. Il costo è che un lavoro di lunga durata deve cedere il controllo esplicitamente, altrimenti gli altri thread non possono girare.

## Come nascono i thread

Un thread nasce in tre modi:

1. **Il thread principale.** Il codice di livello superiore dello script è il thread principale. Gira finché non incontra `ferma`.
2. **Un gestore di eventi.** `su clic X vaisub Handler` registra Handler. Quando l'evento scatta, il runtime avvia un nuovo thread in Handler.
3. **Un thread biforcato.** `biforca a Label` crea un nuovo thread in Label e lo avvia subito. Il thread che lancia si mette in attesa e mette in coda la sua prossima istruzione, da riprendere più tardi.

Tutti i thread girano nello stesso processo, condividono tutte le variabili globali e cedono il controllo solo nei punti descritti qui sotto.

## Quando i thread cedono il controllo

Il runtime non interrompe mai un thread a metà di un'istruzione. Istruzioni come `imposta X a Y`, `aggiungi A a B`, `stampa Z` vengono eseguite fino in fondo prima che un altro thread possa girare. Un thread cede il controllo solo in questi punti:

- **`attendi N <unità>`** — dorme per almeno il tempo indicato, poi riprende. Il thread resta in attesa; gli altri thread girano mentre dorme.
- **`ferma`** — termina il thread in modo permanente.
- **Fine di un thread gestore di eventi** — il thread termina quando `ritorna` esce dal frame di dispatch, oppure dopo un `ferma`, oppure dopo il `fine` finale di un blocco gestore inline (vedi [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md)).
- **I/O bloccante** — `rest ottieni`, `mqtt publish`, `attendi messaggio` e simili, che restituiscono il controllo all'event loop del runtime mentre aspettano.

Fuori da questi punti, un thread tiene il runtime tutto per sé. Un ciclo `mentre vero inizio … fine` senza `attendi` al suo interno farà morire di fame tutti gli altri thread, bloccando le azioni dell'utente e rischiando il surriscaldamento della CPU. Il runtime ha una salvaguardia di base che esce da qualsiasi ciclo che esegue troppe istruzioni senza cedere il controllo, ma non dovresti farci affidamento: inserisci un `attendi` in modo deliberato.

## `biforca`

`biforca a Label` (o `biforca Label` — la `a` è opzionale) avvia un nuovo thread in Label:

```as
Main:
    biforca a Animator
    biforca a NetworkPoller
    su clic StartButton vaisub StartGame
    ferma

Animator:
    mentre vero inizio
        ! ... avanza di un frame ...
        attendi 16 millis
    fine

NetworkPoller:
    mentre vero inizio
        rest ottieni Status da `/health`
        attendi 1 secondo
    fine
```

Quando `biforca` viene eseguito, il nuovo thread parte subito e il thread che lancia si mette in attesa, mettendo in coda la sua prossima istruzione. Il controllo torna al lanciatore quando il thread biforcato cede il controllo (con `attendi`, I/O bloccante o `ferma`). Da lì in poi ogni thread biforcato gira in modo indipendente; condividono le variabili globali con il thread principale e tra loro. La coordinazione tra i thread avviene tramite lo stato condiviso: imposti una variabile in uno, la leggi in un altro.

## `attendi`

La cessione del controllo di tutti i giorni. Le unità sono `millis` / `milli`, `ticks` / `tick` (10 ms), `secondi` / `secondo` (il valore predefinito) e `minuti` / `minuto`:

```as
attendi 5 millis           ! 5 millisecondi
attendi 100 ticks          ! 100 × 10 ms = 1 s
attendi 2 secondi          ! l'unità predefinita, si può omettere
attendi 2                  ! 2 secondi (predefinito)
attendi 5 minuti
```

In un ciclo di animazione, il corpo fa il lavoro di un frame e poi `attendi` qualche millisecondo prima del frame successivo. In un ciclo di polling, `attendi` è l'intervallo tra un sondaggio e l'altro. In qualsiasi ciclo di lunga durata, un `attendi` è il minimo necessario per condividere il runtime: senza, nessun altro thread può girare e l'interfaccia si blocca.

## Coordinare i thread

Non esistono semafori, mutex o canali: il modello cooperativo elimina gran parte della necessità. La coordinazione si fa con variabili condivise e polling:

```as
! Il thread produttore imposta un flag; il consumatore se ne accorge.
variabile Ready

Producer:
    ! ... prepara dei dati ...
    imposta Ready
    ferma

Consumer:
    mentre non Ready attendi 10 millis
    ! ... consuma i dati ...
    svuota Ready
    ferma
```

Poiché nessun thread può essere interrotto a metà istruzione, `imposta Ready` è atomico. Il `mentre non Ready attendi 10 millis` del consumatore è un polling a grana grossa, va bene quando la latenza di risveglio non conta.

Per una coordinazione più ricca, di solito moduli e passaggio di messaggi vanno meglio dei flag grezzi: vedi [moduli](modules.md).

## Moduli e thread

Un modulo caricato con `esegui X` gira come figlio del genitore. Di default il genitore si blocca mentre il modulo gira. Il modulo può chiamare `release parent` per lasciare che il genitore continui in parallelo — a quel punto il modulo diventa un altro thread cooperativo. Genitore e figlio possono poi comunicare con `invia …` e il gestore `su messaggio`.

Questa è la struttura canonica per i lavori asincroni più grandi. Vedi [moduli](modules.md) per il meccanismo e la skill `as-modularize` per esempi svolti.

## Perché cooperativo

Il modello scambia il parallelismo con la semplicità. I vantaggi:

- Nessuna race condition sulle singole istruzioni; puoi ragionare direttamente sullo stato.
- Niente lock, niente atomic, nessuna sorpresa di memory-ordering.
- I thread si compongono: un gestore di eventi è un thread, una biforcazione è un thread, un modulo rilasciato è un thread — tutti la stessa cosa.

Il costo:

- Un lavoro CPU-bound in un thread blocca tutto il resto.
- L'autore deve inserire `attendi` nei cicli lunghi per condividere il runtime.
- Il parallelismo vero per le prestazioni non è previsto: per quello usa un plugin che incapsula un worker nativo, oppure scarica il lavoro in un processo separato.

## Vedi anche

- [controllo di flusso](control-flow.md) — `ferma`, `vaisub`, `vai a` — i meccanismi di controllo per thread.
- [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md) — i gestori di eventi come thread.
- [moduli](modules.md) — `release parent`, passaggio di messaggi, unità di concorrenza più grandi.
