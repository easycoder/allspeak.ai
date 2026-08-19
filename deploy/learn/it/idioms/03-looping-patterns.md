# Modelli di ciclo

## Problema

Devi ripetere del lavoro — iterare su una lista, animare un frame, sondare una condizione, pilotare una macchina a stati. AllSpeak offre `mentre` e cicli guidati da etichette. Ciascuna forma si adatta meglio di altre a certe forme di problema.

## La forma `mentre`

Il ciclo di tutti i giorni. Il corpo gira finché la condizione regge:

```as
imposta N a 0
mentre N è minore di 5 inizio
    stampa N
    aggiungi 1 a N
fine
```

Usa `mentre` quando:

- Una sola condizione decide se continuare.
- Il corpo è codice sequenziale semplice.
- Vuoi un punto di ingresso e uno di uscita.

La forma a istruzione singola va bene per i casi banali:

```as
mentre non Ready attendi 10 millis
```

Vedi [controllo di flusso](../reference/control-flow.md) per la meccanica formale.

## La forma guidata da etichette

Un'etichetta con un `vai a` che ci torna forma un ciclo con più flessibilità di `mentre`. Ci sono due impostazioni naturali.

**Test per l'uscita.** Controlla in cima se uscire; altrimenti fai il lavoro e torna in cima al ciclo:

```as
imposta N a 0
Loop:
    se N è maggiore di 4 vai a Done
    stampa N
    aggiungi 1 a N
    vai a Loop
Done:
    ! ...
```

**Test per continuare.** Avvolgi il corpo in un `se` per la condizione di continuazione; il ciclo esce cadendo fuori dal `se`:

```as
imposta N a 0
Loop:
    se N non è maggiore di 4 inizio
        stampa N
        aggiungi 1 a N
        vai a Loop
    fine
    ! ...
```

Nel caso semplice le due sono equivalenti. Per i cicli con più uscite (diversi motivi per fermarsi), la forma a test-per-l'uscita si generalizza più facilmente. Per una singola condizione di continuazione chiara, il test-per-continuare è più vicino a `mentre` nella struttura.

Usa un ciclo guidato da etichette quando:

- La condizione di uscita è complessa (più vie d'uscita, decisioni a metà corpo).
- Vuoi un salto simile a `continue` senza ristrutturare tutto il ciclo.
- Ti stai integrando con flussi `vaisub` che usano già etichette.
- Il «ciclo» è in realtà una macchina a stati con uno stato etichettato per fase.

Rispetto a `mentre`, è più prolisso per i casi semplici ma più onesto quando il controllo del ciclo è complesso.

## Iterazione contata

Il ciclo canonico. Inizializza il contatore, cicla finché è nell'intervallo, incrementa alla fine:

```as
imposta N a 0
mentre N è minore di Count inizio
    ! ... lavoro usando N ...
    aggiungi 1 a N
fine
```

`Count` è qualunque cosa contenga la dimensione — di solito una variabile separata impostata prima (per es. quando l'array è stato dimensionato). AllSpeak non espone una lunghezza integrata per gli array di variabili lato lettura; tieni tu il conto.

Metti l'incremento in fondo al corpo, così ogni iterazione fa il suo lavoro e fa avanzare il contatore.

## Iterazione con il modello del cursore

Quando il ciclo percorre più array paralleli in sincronia, imposta il cursore su ciascuno dentro il corpo:

```as
imposta N a 0
mentre N è minore di Count inizio
    indice Caption a N
    indice Target a N
    indice Visited a N
    ! ... lavoro usando i valori indicizzati ...
    aggiungi 1 a N
fine
```

Questa è la forma idiomatica di AllSpeak per l'accesso record-per-posizione (vedi [scegliere la forma di una raccolta](picking-a-collection-shape.md)).

## Iterare un dizionario

Un dizionario non ha una forma di iterazione integrata. Non esiste una forma «per ogni voce» e non puoi fare `indice` su un dizionario direttamente come su un array di variabili. **Il pattern canonico è: estrai prima le chiavi in una lista, poi percorri quella lista e recupera ogni valore per chiave.**

```as
metti le chiavi di Config in Keys
metti 0 in K
mentre K è minore di il conteggio di Keys inizio
    metti elemento K di Keys in Name
    metti voce Name di Config in Value
    ! ... lavoro usando Name (la chiave) e Value (la voce) ...
    aggiungi 1 a K
fine
```

Le due ricerche dentro il ciclo sono la parte portante:

- `elemento K di Keys` è l'accesso posizionale nella *lista delle chiavi* — ecco perché lì funziona il pattern del cursore. `Keys` è una lista normale una volta materializzata.
- `voce Name di Config` è la lettura del dizionario per chiave. (Su JS, è `proprieta Name di Config`; vedi la suddivisione per runtime in [collezioni](../reference/collections.md).)

Non cercare di scrivere `indice Config a K` e leggere i valori in quel modo — `indice` percorre gli slot di una variabile multi-slot, non le voci di un dizionario; sono due forme diverse. Le chiavi di un dizionario sono non ordinate come tipo di dato, ma la lista prodotta da `le chiavi di` è un'istantanea ordinata e congelata nel momento in cui la chiami, ed è questo che fa funzionare il pattern di iterazione contata.

Se ti servono solo i valori (raro), vale lo stesso schema — materializza `le chiavi di` una volta, itera per indice, leggi ogni valore per chiave. Non esiste una scorciatoia `the values of`.

## Polling

Attendi un flag con una cessione del controllo nel corpo:

```as
mentre non Ready attendi 50 millis
```

`attendi` lascia girare gli altri thread (gestori di eventi, biforcazioni, callback di rete). Senza, il runtime muore di fame. Vedi [multitasking cooperativo](../reference/cooperative-multitasking.md).

## Animazione

Un ciclo `mentre vero` che gira per sempre, cedendo il controllo a ogni frame:

```as
mentre vero inizio
    ! ... avanza di un frame ...
    attendi 16 millis
fine
```

Terminalo dall'esterno (un flag di stop, un terminatore di thread). `attendi` definisce il frame rate — 16 ms ≈ 60 fps.

## Saltare le iterazioni

Non esiste `continue`. Per saltare il resto di un'iterazione, salta al passo di fine corpo:

```as
imposta N a 0
mentre N è minore di 10 inizio
    se N modulo 2 è 0 vai a Skip
    stampa N
Skip:
    aggiungi 1 a N
fine
```

`vai a Skip` salta la stampa ma lascia girare l'incremento. Per logiche di salto più elaborate, spesso la forma guidata da etichette si legge meglio.

## Conteggio alla rovescia

Gli stessi pattern funzionano contando all'indietro. Inizializza il contatore all'estremo alto, cicla finché è ancora non negativo, decrementa in fondo:

```as
imposta N a 9
mentre N non è minore di 0 inizio
    stampa N
    togli 1 da N
fine
```

`non è minore di 0` si legge come ≥ 0 — vedi [condizioni](../reference/conditions.md) per i confronti invertiti.

## Anti-pattern: ciclo senza cessione del controllo

```as
mentre non Ready inizio
    ! ... controllo ...
fine
```

Un ciclo senza `attendi` e senza `ferma` blocca ogni altro thread nel runtime. L'interfaccia si congela, i gestori di eventi non scattano, i thread biforcati si bloccano. Includi sempre un `attendi` o termina in fretta.

## Anti-pattern: errore fuori di uno con l'operatore sbagliato

```as
mentre N è minore di 5 inizio          ! gira per N = 0,1,2,3,4 → cinque volte
mentre N non è maggiore di 5 inizio   ! gira per N = 0,1,2,3,4,5 → sei volte
```

Se parti da 0 e ti servono esattamente N iterazioni, la condizione è `è minore di N`. Se parti da 1, è `non è maggiore di N`. Scegliere quella sbagliata è il bug fuori-di-uno canonico.

## Correlati

- [controllo di flusso](../reference/control-flow.md) — `mentre`, `se`, `inizio … fine`.
- [variabili e array](../reference/variables-and-arrays.md) — il modello del cursore che i cicli usano spesso.
- [multitasking cooperativo](../reference/cooperative-multitasking.md) — perché `attendi` è obbligatorio nei cicli lunghi.
- [gestori di eventi e indice di array](event-handlers-and-array-index.md) — cicli + gestori per array di elementi dell'interfaccia.
