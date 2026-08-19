# Collezioni

AllSpeak ti offre diversi modi per raccogliere dati, e scegliere quello giusto dà forma al resto del codice. Il modello concettuale è condiviso tra i runtime; la sintassi di superficie di alcune operazioni differisce tra JS e Python (vedi la tabella alla fine).

## Le quattro forme

### 1. Array di variabili — il modello del cursore

La forma predefinita, trattata in dettaglio in [variabili e array](variables-and-arrays.md). Ogni variabile è implicitamente un array di un solo elemento; lo fai crescere con `imposta gli elementi di`; accedi a uno slot impostando il cursore con `indice X a N`.

```as
variabile Counter
imposta gli elementi di Counter a 5
indice Counter a 2
metti 42 in Counter        ! scrive in Counter[2]
```

Gli elementi possono essere di tipi misti. Il modello del cursore è la firma di AllSpeak; usalo quando più variabili fanno lo stesso lavoro in parallelo (per esempio un pulsante, la sua didascalia e l'indice del suo gestore come array paralleli).

### 2. Proprietà degli oggetti

Qualsiasi oggetto — un oggetto tipizzato come un pulsante o un div, o una variabile inizializzata come oggetto — può portare proprietà arbitrarie e nominate:

```as
bottone Save
crea Save in Container
imposta proprieta `rank` di Save a `primary`
se proprieta `rank` di Save è `primary` inizio
    ! ...
fine
```

Le proprietà sono metadati chiave-valore attaccati a un oggetto. Usali per fatti sparsi e semantici che appartengono all'oggetto stesso piuttosto che a una struttura separata.

### 3. Collezioni chiave/valore (dizionari)

Per una mappa da chiavi di stringa a valori, AllSpeak offre la forma dizionario. **I due runtime usano parole chiave diverse, e non sono intercambiabili.**

**Python** — dichiarazione tipizzata `dictionary`, parola chiave `entry`:

```as
dictionary Spec
reset Spec
imposta voce `width` di Spec a 100
imposta voce `colour` di Spec a `blue`
metti voce `width` di Spec in Width
```

**JS** — `variabile` generica inizializzata come oggetto, parola chiave `proprieta` (JS non ha la dichiarazione `dictionary`):

```as
variabile Spec
imposta Spec a oggetto
imposta proprieta `width` di Spec a 100
imposta proprieta `colour` di Spec a `blue`
metti proprieta `width` di Spec in Width
```

Il modello mentale è lo stesso — una mappa da chiavi a valori, che accetta strutture annidate — ma la sintassi di superficie è specifica del runtime. **Non portare lo stile JS `variabile X` + `imposta proprieta K di X` negli script Python.** Può sembrare che funzioni perché il `set property` di Python *scrive anche* in un dict creato automaticamente sulla variabile, ma: (a) il tipo non è dichiarato, quindi il runtime non può cogliere gli errori in anticipo, (b) su Python `property` è anche un livello di metadati (vedi riga 4 della tabella JS-contro-Python qui sotto), il che significa che la stessa parola chiave fa due cose contemporaneamente e si rilegge in modi inattesi, e (c) ignora l'idioma Python canonico che strumenti e revisione si aspettano.

Su Python: scrivi `dictionary X; reset X; imposta voce K di X a V`. Su JS: scrivi `variabile X; imposta X a oggetto; imposta proprieta K di X a V`.

Per iterare un dizionario, materializza prima le sue chiavi in una lista e percorri la lista. Non esiste un accesso `indice` diretto sui dizionari; vedi [iterare un dizionario](../idioms/03-looping-patterns.md#iterating-a-dictionary) per il modello canonico.

### 4. Sequenze ordinate (liste)

Per una sequenza di valori di tipo omogeneo:

**Python** — dichiarazione tipizzata `list`:

```as
list Items
reset Items
imposta elemento 0 di Items a `primo`
imposta elemento 1 di Items a `secondo`
metti elemento 0 di Items in First
```

**JS** — `variabile` generica inizializzata come array:

```as
variabile Items
imposta Items a vettore
imposta elemento 0 di Items a `primo`
imposta elemento 1 di Items a `secondo`
metti elemento 0 di Items in First
```

## Tranello: non mescolare il modello del cursore con `imposta X a vettore` / `imposta X a oggetto`

I due modelli sembrano vicini ma sono livelli diversi. `imposta gli elementi di X a N` rende X una variabile a più slot e il cursore seleziona lo slot su cui stai operando. `imposta X a vettore` (o `imposta X a oggetto`) imposta *il valore dello slot corrente* su un contenitore JSON. Sono indipendenti. Mescolarli è dove il codice scritto dall'IA sbaglia più spesso:

```as
! SBAGLIATO — sembra ragionevole, ma non fa quello che ti aspetti
variabile Bucket
imposta Bucket a vettore               ! slot del cursore = []
imposta gli elementi di Bucket a 1   ! nessun effetto; lo slot contiene ancora []
indice Bucket a 0
metti Row in Bucket               ! lo slot del cursore ora è Row (il [] è sparito)
rest invia Bucket a URL           ! invia Row, non [Row]
```

`metti V in X` scrive V nello slot del cursore, sostituendo quello che c'era — esattamente come se X fosse una variabile mai usata. Il runtime tratta ogni slot in modo uniforme; non sa né gli importa che tu abbia inizializzato lo slot come array. Per aggiungere a un array JSON contenuto nello slot del cursore, usa la parola chiave che conosce gli array:

```as
! GIUSTO — mantieni l'array intatto
variabile Bucket
imposta Bucket a vettore
json aggiungi Row a Bucket            ! slot del cursore = [Row]
rest invia Bucket a URL           ! invia [Row]
```

Oppure, quando ti serve un controllo posizionale:

```as
imposta elemento 0 di Bucket a Row    ! slot del cursore = [Row]
imposta elemento 1 di Bucket a OtherRow
```

Il cursore (`indice X a N`) indirizza *gli slot di X*. Le parole chiave elemento/proprietà (`imposta elemento N di`, `imposta proprieta K di`, `json aggiungi … a`) indirizzano *dentro il valore JSON contenuto dallo slot corrente*. Non si sovrappongono mai.

## Scegliere una forma

La scelta di solito dipende dal modello di accesso:

- **Per posizione, con record paralleli** → array di variabili. Il modello del cursore coordina più variabili che avanzano all'unisono.
- **Per posizione, come un'unica sequenza** → lista (o `imposta X a vettore` in JS).
- **Per chiave di stringa** → dizionario (o `imposta X a oggetto` in JS).
- **Come metadati su un oggetto** → proprietà.

Una confusione comune: gli array di variabili sembrano liste ma non lo sono. Gli array di variabili espongono un elemento alla volta tramite un cursore; l'iterazione è un ciclo `mentre` con un indice che avanza. Le liste espongono tutti gli elementi come una sequenza e supportano l'iterazione sull'intera sequenza. Usa un array di variabili quando gli elementi sono coordinati con altre variabili (`Button`, `Caption`, `Handler` tutti in parallelo). Usa una lista quando gli elementi sono solo una sequenza senza struttura parallela.

## JS contro Python

| Concetto | JS | Python |
|----------|-----|--------|
| Array di variabili | `variabile X` + `imposta gli elementi di X a N` | identico |
| Dizionario | `variabile X` + `imposta X a oggetto`; `proprieta K di X` | `dictionary X`; `reset X`; `voce K di X` |
| Lista | `variabile X` + `imposta X a vettore`; `elemento N di X` | `list X`; `reset X`; `elemento N di X` |
| Proprietà di oggetto | `imposta proprieta K di X a V` — stesso meccanismo dell'accesso al dizionario; la variabile deve essere impostata come oggetto | `set property K of X to V` — un livello di metadati separato, indipendente da qualsiasi valore la variabile contenga |

Python ha dichiarazioni di tipo più esplicite, una parola chiave `entry` dedicata all'accesso ai dizionari, e tratta le proprietà degli oggetti come un livello che coesiste con il valore della variabile. JS memorizza i contenuti di dizionari e liste come dati in forma JSON dentro una `variabile` e usa `proprieta` per l'accesso tramite chiave; in JS non c'è distinzione tra una voce di dizionario e una proprietà di oggetto. Entrambe le implementazioni supportano strutture arbitrariamente annidate.

Il punto critico: **la colonna JS non è un ripiego valido quando scrivi in Python**, e viceversa. I runtime si sovrappongono solo sulla riga 1 (array di variabili). Se stai scrivendo uno script Python e ricorri a `variabile X; imposta X a oggetto; imposta proprieta K di X a V`, hai importato il modello JS: può eseguire senza errori, ma il codice risultante non è tipizzato, si comporta in modo inatteso intorno al livello delle proprietà-metadati e non si rilegge come la forma Python `entry`. Scegli la colonna del tuo runtime e restaci.

## Vedi anche

- [variabili e array](variables-and-arrays.md) — il modello del cursore in dettaglio.
- [scegliere la forma di una collezione](../idioms/picking-a-collection-shape.md) — esempi svolti per la scelta.
- [browser e Webson](browser-and-webson.md) — gli elementi DOM sono oggetti tipizzati con proprietà.
