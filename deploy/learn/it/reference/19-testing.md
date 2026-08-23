# Test

Il vocabolario di test di AllSpeak è volutamente piccolo: `check` verifica un fatto, `test … fine test` raggruppa asserzioni correlate in un caso nominato, e la modalità di esecuzione `--test` trasforma uno script in una suite di test con un riepilogo e un codice di uscita utilizzabile. Il vocabolario funziona in entrambe le implementazioni (JS e Python) e in qualsiasi lingua, una volta che il language pack traduce le parole chiave.

## `check` — un'asserzione

`check che <condizione>` valuta una condizione e riporta il risultato. La grammatica delle condizioni è esattamente quella di `if` — uguaglianza, confronto, presenza e combinazioni `e` / `o` funzionano tutte senza modifiche:

```as
variabile Contatore
variabile Valore
metti 4 in Contatore
metti 7 in Valore

check che Contatore è 4
check che Contatore è minore di 6
check che Valore è numerico
```

La parola `che` è un collegamento naturale e può essere omessa:

```as
check Contatore è 4
```

- **Superato** — registrato in silenzio; non viene stampato nulla.
- **Fallito** — registrato e viene emessa una riga di rapporto attraverso il normale canale di log:

  ```
  FAIL: Contatore è 5 (pianificazione.as:12)
  ```

  La parte tra parentesi è il nome dello script (come impostato da `script <nome>`, altrimenti il nome del file) e il numero di riga della verifica. Dopo la registrazione l'esecuzione **continua** — una verifica fallita è un rapporto, non un crash.

Le verifiche al di fuori di qualsiasi blocco `test` appartengono a un caso predefinito implicito; contano nel totale ma non vengono elencate come test nominato.

## `test … fine test` — un caso nominato

`test <nome> … fine test` raggruppa le istruzioni in un caso nominato. Il nome è un valore (di solito un letterale):

```as
variabile Contatore
metti 1 in Contatore

test `Aggiunta di una sala`
    check che Contatore è 1
fine test
```

- Il corpo può contenere qualsiasi istruzione — preparazione, verifiche, `vaisub`, blocchi `inizio … fine`.
- I blocchi `test` sono una coppia di istruzioni come `inizio … fine`; non possono essere annidati.
- Al di fuori della modalità `--test` sono un raggruppamento trasparente: le verifiche al loro interno si comportano esattamente come verifiche libere (i fallimenti registrano `FAIL` e continuano).

## Clausole di fallimento — `o` e `on failure`

`check` accetta le stesse clausole di fallimento dei comandi che possono fallire, con la loro semantica documentata:

```as
variabile X
metti 3 in X

check che X è 3 on failure vaisub FixUp      ! registra il fallimento, esegui FixUp, continua
check che X è 3 o vaisub Cleanup             ! registra il fallimento, esegui Cleanup, termina questo test
```

- `on failure <azione>` — la verifica fallisce, l'azione viene eseguita e l'esecuzione riprende dall'istruzione successiva.
- `o <azione>` — la verifica fallisce, l'azione viene eseguita e il blocco `test` corrente termina immediatamente (marcato come fallito). Al di fuori di qualsiasi blocco `test`, `o` termina lo script, come un `stop` nudo.

Dentro l'azione, `l errore` contiene il messaggio di fallimento.

## `--test` — la modalità di esecuzione

La CLI Python esegue uno script (o un intero elenco di file) come suite di test:

```
allspeak --test pianificazione.as
allspeak --test conformance/tests/
```

Una directory esegue ogni file `.as` come propria suite, poi stampa una riga aggregata. In modalità test il riepilogo viene stampato a `esci` (o alla fine dello script):

```
Test suite: schedule.as
  ✓ Adding a room (2 checks)
  ✗ Advance roll-over (FAIL: the room count is 4 — line 12)
  ✓ Boost expiry (3 checks)

3 tests, 2 passed, 1 failed — 7 checks, 6 passed, 1 failed
```

La riga di ogni caso mostra il nome e il risultato; per un caso fallito mostra la prima condizione fallita e la sua riga, e per un caso in errore mostra il messaggio di errore:

```
  ✗ Advance roll-over (error: Arithmetic error in divide: integer division or modulo by zero)
```

### Isolamento degli errori

In modalità `--test` un errore di runtime non gestito dentro un blocco `test` non interrompe l'esecuzione. Il caso viene marcato **in errore** e l'esecutore salta al blocco successivo, così un caso rotto non nasconde gli altri:

```as
variabile X
metti 5 in X

test `Caso in errore`
    dividi 10 per 0 dando X    ! errore di runtime — il caso è marcato in errore
    check che X è 1            ! saltato
fine test
test `Continua comunque`       ! questo blocco viene comunque eseguito
    check che X è 5
fine test
```

Le istruzioni che sollevano un errore di runtime differiscono leggermente tra i due runtime: il runtime Python solleva sulla divisione per zero, il runtime JS sull'aritmetica non numerica (ad esempio `aggiungi 1 a` un valore testuale). In entrambi i casi il caso viene marcato in errore e l'esecutore continua.

Un errore al di fuori di qualsiasi blocco `test` termina comunque lo script (l'esecuzione stessa è rotta).

### Codici di uscita

| Codice | Significato |
|--------|-------------|
| 0 | ogni verifica superata, nessun test in errore |
| 1 | almeno una verifica fallita o un test in errore |
| 2 | lo script non ha potuto essere compilato o eseguito |

### Il runtime JS

Il runtime JS viene eseguito nel browser e non ha una CLI. Vocabolario e riepilogo sono identici; l'host abilita la modalità test impostando il flag del runtime prima di avviare:

```js
AllSpeak.testMode = true;
AllSpeak.start(scriptSource);
```

Con il flag impostato, i blocchi `test` isolano gli errori e a `esci` viene scritto un riepilogo nella console di debug, che rispecchia l'output della modalità Python.

## Argomenti correlati

- [Condizioni](06-conditions.md) — ogni condizione che `check` accetta.
- [Errori e recupero](10-errors-and-recovery.md) — la semantica `o` vs `on failure`, condivisa con i comandi che possono fallire.
