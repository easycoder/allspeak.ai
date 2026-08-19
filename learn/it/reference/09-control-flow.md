# Flusso di controllo

Il flusso di controllo di AllSpeak è costruito da un piccolo insieme di costrutti che si compongono liberamente: istruzioni sequenziali raggruppate con `inizio … fine`, il condizionale `se … altrimenti`, il ciclo `mentre`, le etichette con `vai a` e `vaisub`, e la terminazione a livello di thread con `ferma` ed `esci`. AllSpeak rispecchia il linguaggio naturale; i costrutti sono volutamente semplici, e sei libero di spostarti nel codice come preferisci.

Non esiste un flusso in stile operatore (niente return anticipato tramite espressione, niente eccezioni). La gestione dei fallimenti per i comandi specifici è trattata in [errori e recupero](errors-and-recovery.md); l'avvio dei thread in [multitasking cooperativo](cooperative-multitasking.md).

## Sequenze e blocchi

Le istruzioni dentro una sezione etichettata vengono eseguite dall'alto verso il basso:

```as
Main:
    imposta Counter a 0
    aggiungi 1 a Counter
    stampa Counter
    ferma
```

Per raggruppare una sequenza in un'unica istruzione composita, avvolgila con `inizio … fine`. Ovunque sia attesa un'istruzione singola, un blocco `inizio … fine` può fare le sue veci.

```as
mentre N è minore di 5 inizio
    aggiungi 1 a N
    stampa N
fine
```

Un blocco `inizio … fine` è una sola istruzione per il parser; il corpo al suo interno è sequenziale. Vedi [simboli e layout](symbols-and-layout.md) per lo stile alternativo in cui `inizio` sta su una riga sua con indentazione abbinata.

## `se` / `altrimenti`

Esecuzione condizionale. Forme a istruzione singola e a blocco:

```as
se Counter è 0 stampa `Counter è zero`

se Counter è 0 inizio
    stampa `Counter è zero`
    imposta Reset
fine
```

Con `altrimenti`, ciascun ramo può essere a istruzione singola o a blocco:

```as
se Counter è 0
    stampa `zero`
altrimenti inizio
    stampa `non zero, valore:`
    stampa Counter
fine
```

Le condizioni sono basate su parole chiave (`è`, `è minore di`, `è maggiore di`, `non è`, `contiene`, ecc.) — vedi [condizioni](conditions.md). Un costrutto non disponibile direttamente di solito si può invertire: «è maggiore o uguale a» si può scrivere come `non è minore di`.

Un test di verità nudo legge lo stato corrente della variabile:

```as
se Clicked imposta il contenuto di Button a `Fatto`
```

Qui `Clicked` è trattato come un booleano. `imposta Clicked` lo mette a vero; `svuota Clicked` lo mette a falso. Per un test esplicito sono accettati anche `se Clicked è vero …` e `se Clicked è falso …`. Anche se qualsiasi valore non vuoto viene di solito trattato come vero, è più sicuro che la variabile sia stata impostata esplicitamente a un booleano con `imposta` o `svuota`.

## `mentre`

Ciclo. La stessa divisione istruzione singola/blocco di `se`:

```as
imposta N a 0
mentre N è minore di 5 inizio
    stampa N
    aggiungi 1 a N
fine
```

Ciclo infinito, interrotto da un'uscita interna:

```as
mentre vero inizio
    ! ... elabora un messaggio ...
    se Done ferma
fine
```

Terminazione: o lasci che la condizione diventi falsa, oppure esci tramite `vai a Label`, `ferma`, `ritorna` o `esci`. Non esistono `break` o `continue` dedicati — scegli il costrutto che corrisponde a quello che vuoi fare dopo. Usare `vai a` per uscire da un ciclo non ha implicazioni sullo stack; AllSpeak tratta le etichette come destinazioni libere.

## Etichette e `vai a`

Qualsiasi parola al margine sinistro che termina con `:` è un'etichetta. Le etichette sono le destinazioni di `vai a`, `vaisub` e delle registrazioni dei gestori di eventi:

```as
Start:
    imposta Counter a 0
    vai a Loop

Loop:
    aggiungi 1 a Counter
    se Counter è minore di 10 vai a Loop
    stampa Counter
    ferma
```

`vai a` trasferisce il controllo in modo incondizionato e non inserisce un indirizzo di ritorno. La destinazione gira finché non incontra un suo `ferma`, `esci` o un altro `vai a` — qualunque cosa faccia dopo è il nuovo flusso.

### Etichetta calcolata (`vai a label <expr>`)

Quando una catena di `se … altrimenti` diventa lunga, puoi calcolare a runtime il nome dell'etichetta:

```as
variabile Outcome
vaisub a ComputeOutcome      ! imposta Outcome a es. `Edit`, `Save`, `Delete`
vai a label Outcome          ! salta all'etichetta che la stringa indica
```

L'espressione dopo `label` può essere qualsiasi espressione di valore — una variabile, una stringa letterale o una catena `cat`:

```as
vaisub a label `Option` cat N     ! salta a Option1, Option2, …
vai a label `SharedHandler`       ! stringa costante
```

L'etichetta viene risolta a runtime — se non esiste un'etichetta corrispondente, viene segnalato un errore a runtime. Non c'è validazione in fase di compilazione, quindi scrivere un nome di etichetta inesistente è sicuro (l'errore arriverà a runtime, dove puoi catturarlo con una clausola `on failure` sul `vaisub`).

## `vaisub` e `ritorna`

Una chiamata di subroutine: mette l'indirizzo di ritorno sullo stack, salta all'etichetta, esegue fino a `ritorna`, toglie l'indirizzo di ritorno dallo stack.

```as
Main:
    vaisub Setup
    vaisub Render
    ferma

Setup:
    imposta Counter a 0
    ritorna

Render:
    stampa Counter
    ritorna
```

Sono accettate entrambe le forme `vaisub Label` e `vaisub a Label`; gli esempi del codex usano `vaisub a`. Scegline una e resta coerente.

### Vaisub calcolato (`vaisub a label <expr>`)

La stessa sintassi di etichetta calcolata funziona con `vaisub` e `biforca`:

```as
vaisub a label `Handler` cat Event      ! chiamata di subroutine calcolata
biforca a label `Task` cat N            ! biforcazione parallela calcolata
```

`biforca a label <expr>` si comporta in modo identico: valuta l'espressione, risolve l'etichetta e lancia lì un thread parallelo. Come per `vai a label`, l'etichetta viene risolta a runtime e dà errore se manca.

### Passare parametri con `vaisub … con`

Usa `vaisub … con` per passare valori e `metti parametro` per leggerli per posizione:

```as
variabile Key
variabile BodyText
variabile Y
variabile M
variabile D
variabile Year
variabile Month
variabile Day

Main:
    vaisub JsonAddString con `slug`
    vaisub FormatDate con Year e Month e Day
    ferma

JsonAddString:
    metti parametro 0 in Key
    metti `{"` cat Key cat `":` in BodyText
    ...
    ritorna

FormatDate:
    metti parametro 0 in Y
    metti parametro 1 in M
    metti parametro 2 in D
    ...
    ritorna
```

`vaisub Label con Expr1 e Expr2 …` accetta qualsiasi cosa `getValue()` sappia analizzare — variabili, letterali, catene `cat`, `conteggio di`, ecc. Gli argomenti partono da zero; `metti parametro 0 in Var` legge il primo valore passato.

`parametro` è una **espressione di valore**, quindi puoi leggere un argomento ovunque sia atteso un valore:

```as
JsonAddString:
    metti parametro 0 in Key
    registra parametro 1                             ! registra il secondo argomento
    se parametro 0 è `slug`
        vaisub Warn
    fine
    vaisub Forward con parametro 0              ! passa l'argomento oltre
    ritorna
```

L'indice è un singolo token numerico, quindi una catena `cat` successiva non viene inghiottita: `metti parametro 1 cat `-` cat parametro 2 in DateStr` legge l'argomento 1, poi l'argomento 2, poi concatena.

La forma più breve `param` è accettata ovunque sia accettato `parametro` — `param 0 in Key` (un comando dedicato) e `metti param 0 in Key` funzionano entrambi — così come la forma completa tradotta in ogni pacchetto linguistico (`paramètre` in francese, `parametro` in italiano, `Parameter` in tedesco).

Se una subroutine viene chiamata senza `con`, `parametro` restituisce `0` (numerico) — le subroutine esistenti non sono influenzate.

### Gestione dei fallimenti

Una chiamata `vaisub … con` può avere una clausola `o` / `on failure`:

```as
vaisub FetchData con Url o vaisub OnError
```

### Lo stack degli argomenti di chiamata

I parametri vivono su uno stack implicito creato quando si usa `con` e scartato quando la subroutine fa `ritorna`. Le chiamate annidate funzionano correttamente:

```as
vaisub Outer con A
  ...
  vaisub Inner con X e Y   ! nuovo frame messo sullo stack
  metti parametro 0 in Z     ! legge X (il frame di Inner)
  ...
  ritorna                    ! il frame di Inner viene rimosso dallo stack
  metti parametro 0 in W     ! legge A (il frame di Outer)
  ...
  ritorna                    ! il frame di Outer viene rimosso dallo stack
```

Lo stack è locale al thread (secondo il modello del multitasking cooperativo). Per qualcosa di più grande di qualche helper, valuta un [modulo](modules.md), che fornisce variabili private, passaggio di messaggi e concorrenza.

## `stack`, `push` e `pop`

Per riusare una variabile di servizio attraverso una chiamata di subroutine senza perdere il suo valore, mettila prima su uno stack con `push` e riprendila dopo con `pop`. Le istruzioni `stack`, `push` e `pop` non hanno una forma italiana: restano in inglese anche in uno script italiano:

```as
stack MyStack
...
imposta X a 99
push X onto MyStack
imposta X a 0            ! riusa X per altro
pop X from MyStack
stampa X               ! stampa 99
```

Usa questo quando una subroutine ha bisogno degli stessi nomi di servizio (`I`, `N`, `Temp`) del suo chiamante e vuoi evitare il bug raro ma reale di uno che sovrascrive l'altro.

## `ferma` ed `esci`

Due modi per porre fine a qualcosa:

- **`ferma`** parcheggia il thread corrente. Il thread principale termina sempre con `ferma` (altrimenti esce dalla fine della sua sezione etichettata). I gestori di eventi e i thread biforcati usano `ferma` per terminarsi da soli in anticipo.
- **`esci`** termina l'intero script. In un modulo, `esci` restituisce il controllo al genitore; nello script principale spegne il runtime. Quando un modulo esce, tutta la sua memoria di runtime viene rilasciata per la garbage collection — è questo che permette a un'applicazione di accumulare molte funzionalità senza tenerle tutte in memoria contemporaneamente.

`ferma` è per-thread; `esci` è per-script.

## Quando usare cosa

- Un'azione condizionale singola → `se`.
- Un'azione ripetuta → `mentre`.
- Un blocco riutilizzabile chiamato da più punti → `vaisub` a un'etichetta.
- Un dispatch a più vie che richiederebbe una catena di `se … altrimenti` → **`vai a label`** (goto calcolato). Vedi [la sezione etichetta calcolata](#computed-label-go-to-label-expr).
- Un pezzo di logica abbastanza grande da richiedere stato privato → un modulo ([moduli](modules.md)).
- Un flusso dall'aria asincrona su un evento di interfaccia → una registrazione `su …` che chiama un gestore con `vaisub` ([gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md)).

## Vedi anche

- [simboli e layout](symbols-and-layout.md) — etichette, regole di indentazione e stile `inizio`/`fine`.
- [condizioni](conditions.md) — cosa va dopo `se` e `mentre`; come combinare le condizioni.
- [errori e recupero](errors-and-recovery.md) — `o` e `on failure` per la gestione dei fallimenti a livello di comando.
- [multitasking cooperativo](cooperative-multitasking.md) — `biforca`, cessione del controllo, `attendi`.
- [moduli](modules.md) — stato privato e passaggio di messaggi per i pezzi grossi.
