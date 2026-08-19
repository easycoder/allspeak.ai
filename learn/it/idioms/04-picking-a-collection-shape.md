# Scegliere la forma di una raccolta

## Problema

Devi memorizzare più valori che stanno insieme. AllSpeak offre quattro forme — array di variabili, proprietà, dizionari, liste (vedi [collezioni](../reference/collections.md)). Scegliere quella sbagliata presto causa attriti in tutto lo script: accessori prolissi, iterazione scomoda, frammentazione accidentale dei dati.

## I criteri

La scelta si mappa quasi meccanicamente sul pattern di accesso:

| Se accedi ai dati … | Usa |
|----------------------|-----|
| Per posizione, con più variabili che avanzano in sincronia | Array di variabili |
| Per posizione, come singola sequenza tipizzata | Lista |
| Per chiave stringa | Dizionario |
| Come metadati su un oggetto | Proprietà |

La linea più difficile è tra array di variabili e lista, perché si assomigliano. Regola di decisione: **se allunghi la mano verso lo stesso indice `N` su due o più variabili, quelle variabili vogliono essere array di variabili paralleli**. Se una singola sequenza basta, una lista è più semplice.

## Array di variabili — per record paralleli

Cinque elementi cliccabili, ognuno con una didascalia, un URL di destinazione e un flag «visitato»:

```as
bottone Item
variabile Caption
variabile Target
variabile Visited

imposta gli elementi di Item a 5
imposta gli elementi di Caption a 5
imposta gli elementi di Target a 5
imposta gli elementi di Visited a 5

! ... riempi ogni array parallelo ...

su clic Item vaisub HandleClick

HandleClick:
    indice Caption a l indice di Item
    indice Target a l indice di Item
    indice Visited a l indice di Item
    ! Tutti e tre ora puntano allo slot corrispondente
    ritorna
```

Un cursore che scatta, tre letture coordinate. Questo è l'idioma di AllSpeak per l'accesso record-per-posizione.

## Dizionario — per configurazione con chiavi

Un blocco di configurazione con campi nominati:

```as
variabile Config
imposta Config a oggetto
imposta proprieta `theme` di Config a `dark`
imposta proprieta `pageSize` di Config a 50
imposta proprieta `apiKey` di Config a il contenuto di KeyField

se proprieta `theme` di Config è `dark` inizio
    ! applica lo stile scuro
fine
```

Usa un dizionario quando le chiavi sono nomi di stringa ben noti e l'accesso è per nome, non per posizione.

## Lista — per una sequenza ordinata senza struttura parallela

Un buffer di log:

```as
variabile Log
imposta Log a vettore
imposta elemento 0 di Log a `Utente connesso`
imposta elemento 1 di Log a `Carrello riempito`
imposta elemento 2 di Log a `Ordine effettuato`
```

Gli elementi sono uniformi e non legati ad alcun'altra variabile. Nessuna coordinazione di cursore necessaria. Allunga la mano verso una lista piuttosto che un array di variabili.

## Anti-pattern: lista di dizionari quando vanno bene gli array paralleli

```as
! Evita questo quando i record vengono acceduti per indice
variabile Items
imposta Items a vettore
variabile Item
imposta Item a oggetto
imposta proprieta `caption` di Item a `Compra`
imposta proprieta `target` di Item a `/buy`
imposta elemento 0 di Items a Item
! ... ripeti per ogni elemento ...
```

Funziona ma è prolisso. Se il tuo pattern di accesso è costantemente «dammi il record N», gli array di variabili paralleli sono più corti e si integrano in modo più naturale con i gestori `su clic` (nessuna estrazione di proprietà per record dentro il gestore).

Ricorri alla lista-di-dict quando i record sono concettualmente documenti — eterogenei, acceduti di rado o trasmessi come JSON. Ricorri agli array di variabili paralleli quando i record vengono acceduti in sincronia con l'interfaccia o altro stato.

## Anti-pattern: un dizionario separato quando basterebbe una proprietà

Se ti servono uno o due fatti nominati collegati a un oggetto esistente (bottone, div, file), usa `imposta proprieta … di Obj a …` direttamente sull'oggetto invece di dichiarare un dizionario parallelo indicizzato da qualche tipo di ID oggetto. L'informazione resta collegata alla cosa che descrive.

## Correlati

- [collezioni](../reference/collections.md) — le quattro forme in dettaglio.
- [variabili e array](../reference/variables-and-arrays.md) — il modello del cursore.
- [gestori di eventi e indice di array](02-event-handlers-and-array-index.md) — perché gli array paralleli + il cursore ripagano nei gestori.
