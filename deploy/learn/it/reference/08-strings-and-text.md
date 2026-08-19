# Stringhe e testo

Il tipo stringa di AllSpeak è il contenitore quotidiano del testo. Questo file elenca le operazioni che Core fornisce per ispezionare e trasformare le stringhe.

I letterali con backtick e la concatenazione `cat` sono trattati in [simboli e layout](symbols-and-layout.md) e in [cat e costruzione di stringhe](../idioms/cat-and-string-building.md).

## Lunghezza

`la lunghezza di X` restituisce il numero di caratteri:

```as
metti la lunghezza di `Hello, world!` in N
! N è 13
```

## Sotto-stringhe

Quattro forme, che producono tutte una sotto-stringa senza modificare l'originale:

```as
metti sinistra 5 di `Hello, world!` in A         ! "Hello"
metti destra 6 di `Hello, world!` in B        ! "world!"
metti da 7 di `Hello, world!` in C         ! "world!"   (dalla posizione 7 alla fine)
metti da 7 a 12 di `Hello, world!` in D   ! "world"    (posizioni 7..11, fine esclusa)
```

- `sinistra N di X` — i primi N caratteri. N deve essere un intero non negativo.
- `destra N di X` — gli ultimi N caratteri. N deve essere un intero non negativo.
- `da N di X` — tutto dalla posizione N alla fine.
- `da N a M di X` — la sotto-stringa che copre le posizioni N..M (M esclusa).

Gli indici di posizione partono da 0.

### Errori comuni con le sotto-stringhe

**❌ N negativo con `sinistra`/`destra`**

AllSpeak **non** supporta conteggi negativi. `sinistra -2 di X` non è valido — non viene trattato come «tutto tranne gli ultimi 2 caratteri».

Per ottenere **tutto tranne gli ultimi N caratteri**, usa l'aritmetica di lunghezza con `da`:

```as
! Dividi "1998" in sterline="19" e penny="98"
metti `1998` in MoneyStr
metti la lunghezza di MoneyStr in MoneyLen  ! 4
metti MoneyLen in Pos
togli 2 da Pos                       ! Pos = 2
metti da 0 a Pos di MoneyStr in Whole  ! "19"   (posizioni 0..1)
metti da Pos di MoneyStr in Cents       ! "98"   (posizioni 2..3)
```

Oppure, in modo equivalente, con `sinistra` più `destra`:

```as
metti `1998` in MoneyStr
metti la lunghezza di MoneyStr in MoneyLen  ! 4
togli 2 da MoneyLen                  ! MoneyLen = 2
metti sinistra MoneyLen di MoneyStr in Whole  ! "19"
metti destra 2 di MoneyStr in Cents        ! "98"
```

## Ricerca della posizione

`posizione di X in Y` restituisce l'indice della prima occorrenza di X in Y, oppure -1 se non si trova:

```as
metti posizione di `,` in `Hello, world!` in Comma
! Comma è 5
```

Per trovare l'occorrenza *ultima*, usa `la posizione di l ultimo`:

```as
metti la posizione di l ultimo `,` in Text in P
```

Per analizzare input strutturati semplici — dividere `` `12.50` `` in sterline e penny, trovare il delimitatore in una riga «chiave=valore» — `posizione di` più gli operatori di sotto-stringa danno un parser utilizzabile. Vedi [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md) per un esempio svolto.

## Conversione tra maiuscole e minuscole

```as
metti minuscolo `Ciao` in X        ! "ciao"
metti uppercase `Ciao` in Y        ! "CIAO"
```

Entrambe producono una nuova stringa; l'originale resta invariato.

## Taglio degli spazi

`taglia X` rimuove gli spazi bianchi all'inizio e alla fine:

```as
metti taglia `   spazioso   ` in Tidy
! Tidy è "spazioso"
```

## Sostituzione di sotto-stringhe

`sostituisci X con Y in Var` modifica `Var` sul posto, sostituendo **ogni** occorrenza di X con Y:

```as
metti `casa rossa, bici rossa, palla rossa` in List
sostituisci `rossa` con `blu` in List
! List è "casa blu, bici blu, palla blu"
```

Due cose da notare:

- È un'istruzione, non un valore — riscrive nella variabile indicata.
- Sostituisce sempre tutte le occorrenze; non esiste una variante a sostituzione singola.

Per preservare l'originale, copia prima:

```as
metti OriginalText in Working
sostituisci `foo` con `bar` in Working
! OriginalText è intatto
```

## Test di inclusione

`X contiene Y` verifica se X contiene Y come sotto-stringa (usato in una condizione):

```as
se Path contiene `/api/` ...
se Email contiene `@` ...
```

Vedi [condizioni](conditions.md) per l'insieme completo delle condizioni legate alle stringhe (`è`, `inizia con`, `finisce con`, `contiene`).

## Stringhe su più righe

I letterali con backtick possono estendersi su più righe. Ogni riga di continuazione inizia con un backtick dopo il suo spazio iniziale; le righe vengono unite senza newline:

```as
imposta Css a `position:relative;
    `width:90%;
    `border:1px solid black;`
```

Per includere un vero newline, una tabulazione o un backtick, usa le parole chiave di valore con `cat`:

```as
metti `Riga 1` cat newline cat `Riga 2` in Two
```

`newline`, `tabulazione` e `backtick` sono tre di un piccolo insieme chiuso di parole chiave di valore nudo — le altre sono `vuoto`, `now`/`timestamp`, `today`, `interruzione` e `uuid`. Vedi [valori e tipi](values-and-types.md#special-value-keywords) per l'elenco completo, e [simboli e layout](symbols-and-layout.md) e [cat e costruzione di stringhe](../idioms/cat-and-string-building.md) per i modelli di `cat`.

## Stringhe e numeri

Una stringa che contiene solo cifre viene trattata come numerica quando l'aritmetica chiede un numero:

```as
metti `42` in N
aggiungi 1 a N         ! N ora è 43
```

Una stringa con contenuto in stile decimale (`3.14`) *non* viene promossa automaticamente; l'aritmetica di AllSpeak è intera per prima. Vedi [aritmetica](arithmetic.md) e [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md).

Per verificare se un valore può essere usato come numero, usa la condizione `è numerico`:

```as
se Input è numerico ...
```

## Vedi anche

- [simboli e layout](symbols-and-layout.md) — letterali con backtick, stringhe su più righe.
- [cat e costruzione di stringhe](../idioms/cat-and-string-building.md) — concatenazione infissa con `cat`, modelli di template.
- [condizioni](conditions.md) — le condizioni legate alle stringhe.
- [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md) — analizzare le stringhe in stile decimale.
- [valori e tipi](values-and-types.md) — il flag numerico / non numerico.
