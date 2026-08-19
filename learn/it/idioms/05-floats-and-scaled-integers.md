# Numeri a virgola mobile e interi scalati

## Problema

Hai una quantità con precisione frazionaria — denaro, una percentuale, un angolo, una misura. L'aritmetica di AllSpeak è solo a interi. Come fai a calcolare con il valore senza perdere precisione?

## La realtà: i float come stringhe

I letterali numerici nel sorgente sono interi; `3.14` è una stringa di quattro caratteri, non un numero. Anche le variabili che contengono valori recuperati dall'esterno (una risposta REST, un campo di form Webson) possono arrivare come stringhe dall'aspetto di float. Passano attraverso `cat` senza modifiche ma non partecipano all'aritmetica — `aggiungi 0.5 a Counter` è un errore.

La soluzione è il **pattern degli interi scalati**: tieni tutti i valori come interi, moltiplicati per un fattore di scala scelto, e dividi solo quando mostri.

## Scegliere la scala

Scegli un fattore di scala per la precisione che ti serve:

| Ambito | Scala comune | Significato |
|--------|--------------|-------------|
| Denaro (£/$/€) | 100 | Unità più piccola (penny, centesimi). £12,34 → 1234. |
| Percentuali | 100 o 10000 | Precisione 1% o 0,01%. 12,5% → 125 o 12500. |
| Coordinate | 1000 | Millipixel. 100,5 → 100500. |
| Angoli | 100 o 10 | 0,01° o 0,1°. 45,5° → 4550 o 455. |

Il compromesso: una scala più alta dà più precisione, ma il valore massimo rappresentabile si riduce.

## Esempio svolto: denaro

Un totale di carrello della spesa:

```as
variabile PriceA
variabile PriceB
variabile Total

metti 1250 in PriceA    ! £12,50 conservati come penny
metti 875  in PriceB    ! £8,75 conservati come penny
aggiungi PriceA a PriceB dando Total
! Total è 2125 — cioè £21,25
```

Per mostrarlo, separa sterline e penny, riempiendo i penny a due cifre:

```as
dividi Total per 100 dando Pounds
metti Total modulo 100 in Pence

se Pence è minore di 10
    metti `0` cat Pence in PenceStr
altrimenti
    metti Pence in PenceStr

stampa Pounds cat `.` cat PenceStr     ! "21.25"
```

## Esempio svolto: percentuali

Il 90% di una larghezza, con precisione 1%:

```as
moltiplica Width per 90      ! Width × 90
dividi Width per 100       ! ÷ 100
```

Questo è l'idioma canonico di AllSpeak per l'applicazione delle percentuali. Prima moltiplica, poi dividi — l'ordine conta: dividere-poi-moltiplicare tronca via la precisione che volevi conservare.

Per una precisione sotto l'1%, scala ancora:

```as
moltiplica Width per 9050    ! 90,50% scalato per 100
dividi Width per 10000
```

## Trigonometria

`sin` e `cos` sono operatori integrati a interi scalati — prendono un angolo in gradi e un fattore `radius` che scala il risultato. Vedi [aritmetica](../reference/arithmetic.md). Il radius è solo un fattore di scala sotto un altro nome.

## Ricevere float dall'esterno

Le stringhe che arrivano come `` `12.50` `` da un endpoint REST o da un input di form vanno convertite in interi scalati prima dell'aritmetica. L'operatore di valore `scala` fa esattamente questo — legge una stringa decimale e restituisce l'intero scalato, arrotondando la metà lontano da zero quando la stringa ha più cifre di quante ne servano alla scala:

```as
! Supponi che Input sia `12.50`
metti Input scala 100 in Pence
! Pence ora è 1250
```

```as
metti `3.14` scala 100 in Pi        ! 314
metti `-3.14` scala 100 in Pi       ! -314
metti `42` scala 100 in Pence       ! 4200 — funzionano anche le stringhe intere
metti `12.345` scala 100 in Pence   ! 1235 — le cifre extra arrotondano, metà lontano da zero
metti `.5` scala 100 in Half        ! 50
metti `3.` scala 100 in Three       ! 300
```

Il fattore di scala deve essere un intero positivo, e la stringa deve essere un decimale pulito — qualsiasi altra cosa (`` `abc` ``, `` `3.1.4` ``, scala 0) solleva un errore a runtime, quindi un input sbagliato dall'esterno emerge in modo chiaro. La conversione è fatta con l'aritmetica intera, quindi `12.345 scala 100` è esattamente 1235 — mai 1234 per via del rumore della virgola mobile.

Prima che esistesse `scala`, questo era un ballettino di sei righe di divisione sul punto; guarda la cronologia di git se sei curioso di com'era.

## Anti-pattern: aritmetica sulla forma stringa

```as
aggiungi `0.5` a Counter      ! SBAGLIATO — `0.5` è una stringa
```

Gli operatori aritmetici si aspettano valori numerici. Per fare il lavoro, entrambi i lati devono essere già interi scalati:

```as
aggiungi 5 a Counter          ! se Counter è scalato per 10 (cioè 0.5 → 5)
```

## Anti-pattern: dividere prima di moltiplicare

```as
dividi Total per 100       ! la divisione intera perde i penny
moltiplica Total per 90      ! scala errata
```

La divisione intera tronca. Prima moltiplica, poi dividi:

```as
moltiplica Total per 90
dividi Total per 100
```

## Correlati

- [aritmetica](../reference/arithmetic.md) — il modello intero-per-primo e il vocabolario degli operatori.
- [valori e tipi](../reference/values-and-types.md) — stringhe vs numeri.
- [stringhe e testo](../reference/strings-and-text.md) — `sinistra`, `da`, `posizione di` per l'analisi.
