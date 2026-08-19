# Gestori di eventi e indice di array

## Problema

Hai un array di elementi dell'interfaccia — diciamo cinque bottoni — e vuoi un unico gestore che sappia quale è stato cliccato.

## Il pattern

Collega un unico gestore alla variabile. Scatterà su qualsiasi elemento e imposterà il suo indice a quello dell'elemento che ha scatenato l'evento. Dentro il gestore, leggi `l indice di` dell'array per scoprire quale ha scattato.

```as
bottone Button
imposta gli elementi di Button a 5
! ... crea i bottoni, assegna loro le didascalie ...

imposta N a 0
mentre N è minore di 5
    ! Configurazione, ecc.
    aggiungi 1 a N

su clic Button vaisub HandleClick

ferma

HandleClick:
    imposta Which a l indice di Button
    stampa `Bottone ` cat Which cat ` è stato cliccato`
    ritorna
```

Il runtime posiziona il cursore su `Button` all'indice dell'elemento che ha scatenato l'evento *prima* di entrare nel gestore. `l indice di Button` dentro `HandleClick` è lo slot corretto.

## Dimensionare l'array per prima cosa

Prima di poter usare `indice` o rispondere ai clic su un array, **devi** dimensionarlo con `imposta gli elementi di`:

```as
imposta gli elementi di Button a 5    ! slot [0]..[4]
```

Ogni variabile parte con esattamente un elemento (lo slot 0). Senza dimensionamento, `indice Button a N` fallisce per N > 0 e gli eventi `su clic` vedono solo lo slot 0.

Un pattern comune è determinare prima il conteggio (da un recupero di dati o dal layout), poi dimensionare l'array:

```as
rest ottieni Bookings da `bookings.php`
metti json conteggio di Bookings in Count
imposta gli elementi di RowDivs a Count
```

## Impostare il cursore prima di `crea`

Quando costruisci elementi DOM in un array, sposta il cursore sullo slot di destinazione **prima** di chiamare `crea`:

```as
indice RowDivs a I           ! ✅ cursore allo slot I
crea RowDivs in TableBody   ! l'elemento va nello slot I
```

Se crei prima e poi fai `indice`, l'elemento sta nello slot 0 e lo spostamento del cursore non lo riassegna retroattivamente.

## Che cos'è un gestore

Un gestore è un thread che gira fino in fondo quando si verifica il suo evento. La registrazione `su …` è solo predisposizione; il thread parte quando l'evento scatta e termina quando si raggiunge l'ultima istruzione del gestore. Nessuno attende il suo valore di ritorno perché nessuno l'ha chiamato.

## Perché funziona

`vaisub HandleClick` è un'istruzione qualsiasi o un blocco. Il runtime `su` ha già determinato la sorgente dell'evento e ha impostato l'indice della variabile a quello dell'elemento che l'ha scatenato. Spesso sarà 0, ma come nell'esempio sopra la variabile può avere un numero qualsiasi di elementi. Il gestore vede solo l'elemento che ha scatenato l'evento — lo stesso modello di cursore usato ovunque (vedi [variabili e array](../reference/variables-and-arrays.md)).

Nota: funziona con **qualsiasi** tipo di variabile che supporta il modello del cursore, compresi `div X`, `bottone X`, `input X`, ecc. Il prefisso di dichiarazione (`div`, `bottone`, `file`) controlla che cosa produce `crea X`, ma il modello del cursore sottostante è lo stesso di `variabile X`.

## Anti-pattern: variabili separate per ogni elemento

```as
su clic Button0 vaisub HandleClick0
su clic Button1 vaisub HandleClick1
...
```

Funziona ma è più prolisso: richiede che il gestore tratti ogni variabile separatamente quando in realtà sono la stessa cosa solo ripetuta. Cinque subroutine quasi identiche che differiscono solo per una costante dovrebbero essere una sola subroutine che legge `l indice di`.

## Anti-pattern: catturare la variabile del ciclo

```as
mentre N è minore di 5 inizio
    indice Button a N
    ! Fai qualcosa
    aggiungi 1 a N
fine
su clic Button vaisub HandleClick

HandleClick:
    stampa `Bottone ` cat N cat ` è stato cliccato`   ! SBAGLIATO — N è quello che il ciclo ha lasciato
    ritorna
```

Non c'è alcuna chiusura. `N` al momento del gestore è qualunque cosa l'ultimo codice ci abbia scritto — di solito 5, non l'indice che ha scattato. Leggi sempre `l indice di` dentro il gestore.

## Gestori su più righe

Tre opzioni, ognuna delle quali termina il thread del gestore nel suo modo naturale:

**1. Delega a una subroutine etichettata.** `vaisub` dalla registrazione; `ritorna` alla fine della subroutine termina il thread (non c'è nulla a cui ritornare).

```as
su clic Button vaisub HandleClick

HandleClick:
    imposta Which a l indice di Button
    se Which è 0 inizio
        ! caso speciale per il primo bottone
        vaisub HandleSpecial
        ritorna
    fine
    stampa `Gestore generico per ` cat Which
    ritorna
```

**2. Blocco inline.** Il thread *è* il blocco `inizio…fine`. Usa `ferma` per terminare in anticipo.

```as
su clic Button inizio
    imposta Which a l indice di Button
    se Which è 0 inizio
        ! caso speciale per il primo bottone
        vaisub HandleSpecial
        ferma
    fine
    stampa `Gestore generico per ` cat Which
fine
```

**3. Blocco inline con trasferimento di controllo.** Usa `vai a Etichetta` per mandare il thread ad altro codice (che a sua volta termina).

```as
su clic Button inizio
    imposta Which a l indice di Button
    se Which è 0 vai a HandleSpecial
    stampa `Gestore generico per ` cat Which
fine
```

Nota: `inizio...fine` è un'unica istruzione. Quale forma usare dipende dalle preferenze individuali, ma se il gestore è molto complesso merita di vivere in una sezione etichettata dove può essere documentato più facilmente.

## Correlati

- [variabili e array](../reference/variables-and-arrays.md) — il modello del cursore su cui si basa questo idioma.
- [controllo di flusso](../reference/control-flow.md) — `vaisub`, `ritorna`, `ferma`, `vai a`.
- [separazione Webson e AS](webson-and-as-separation.md) — come di solito gli array di Button vengono creati dal layout.
