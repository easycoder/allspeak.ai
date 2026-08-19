# Valori e tipi

Un valore in AllSpeak è di uno di tre tipi: **numero**, **stringa** o **booleano**. I valori sono ciò su cui opera l'aritmetica, ciò che le condizioni confrontano e ciò che `cat` concatena. Le variabili contengono valori; le conversioni tra i tipi di valore sono per lo più automatiche.

## I tre tipi di valore

**Numero** — valori interi. I letterali sono sequenze nude di cifre (`42`, `-3`). Tutta l'aritmetica produce risultati interi. Vedi [aritmetica](arithmetic.md).

**Stringa** — testo. I letterali sono delimitati da backtick (`` `Ciao` ``). Vedi [stringhe e testo](strings-and-text.md) per le operazioni.

**Booleano** — vero o falso. Le parole chiave `vero` e `falso` producono valori booleani (`mentre vero …`, `imposta Ready a vero`). La forma abbreviata `imposta X` mette X a vero; `svuota X` lo mette a falso. I booleani compaiono nelle condizioni e come test di verità. Vedi [condizioni](conditions.md).

Il runtime tiene traccia di un flag `numerico` su ogni valore. Una stringa che contiene solo cifre ha il flag attivo e partecipa all'aritmetica; una stringa con contenuto non numerico no.

## Il tipo `variabile`

`variabile X` dichiara un contenitore debolmente tipizzato. Può contenere uno qualsiasi dei tre tipi di valore, e il tipo che contiene è quello che ci è stato messo per ultimo:

```as
variabile X
metti 42 in X         ! X ora è un numero
metti `Ciao` in X    ! X ora è una stringa
imposta X                 ! X ora è vero (booleano)
```

`variabile` è l'unica forma debolmente tipizzata di AllSpeak. Usala per stato di uso generale dove il tipo non è noto a priori o cambia nel tempo.

## Variabili tipizzate

Gli altri tipi di variabile sono più severi — accettano solo i valori che il loro dominio conosce:

```as
bottone SaveButton           ! contiene un handle di elemento DOM
file ConfigFile             ! contiene un riferimento a file
dictionary Spec             ! contiene una struttura chiave/valore (Python)
modulo Helper               ! contiene un modulo caricato
```

`metti 42 in SaveButton` è un errore — SaveButton non è un contenitore di valori, è un handle verso un oggetto tipizzato. Le operazioni che una variabile tipizzata accetta sono definite dal dominio che la possiede. Vedi [struttura](structure.md) e [collezioni](collections.md).

## Conversione automatica

I valori si convertono tra tipi in base al contesto:

| Contesto | Conversione |
|----------|-------------|
| Ingresso aritmetico | Stringa numerica → numero; una stringa non numerica è un errore |
| Operando di `cat` | Numero → stringa; booleano → "vero"/"falso" |
| `se X` (test di verità) | Numero → falso se 0, vero altrimenti; stringa → falso se vuota, vero altrimenti |
| Confronto `è` | Operandi confrontati come testo, con consapevolezza numerica su entrambi i lati |

```as
metti `42` in N
aggiungi 1 a N            ! N ora è 43 (la stringa "42" promossa a numero)

metti 5 in Count
metti `Hai ` cat Count cat ` elementi` in Message
                      ! Count convertito in "5" per cat
```

La conversione è a senso unico per operazione — il valore memorizzato nella variabile non viene trasformato in modo permanente. Dopo `aggiungi 1 a N`, N contiene 43 come numero; dopo `cat Count`, Count è ancora 5 come numero.

All'interno di una catena `cat`, i singoli operandi mantengono la loro identità di tipo fino in fondo; la conversione in testo avviene una sola volta, quando la catena viene compressa in un'unica stringa. Questo conta soprattutto per i valori prodotti a runtime — `il timestamp`, `il contenuto di Input`, `l indice di X` — che si valutano come valore tipizzato e diventano testo solo al confine, non a ogni passo di `cat`.

## Parole chiave di valore speciali

Un piccolo insieme chiuso di parole chiave nude si valuta in un valore proprio — nessun operando, nessuna variabile di testa. Usale ovunque sia atteso un valore: come lato destro di `metti`/`imposta`, dentro una catena `cat`, in una condizione. La particella facoltativa `il` è accettata prima di ciascuna di esse (`il timestamp`, `il today`).

| Parola chiave | Tipo | Valore |
|---|---|---|
| `vuoto` | stringa | La stringa vuota. Equivalente a ``, ma più naturale nelle condizioni: `se Name è vuoto …`. |
| `now`, `timestamp` | numero | Ora Unix corrente in millisecondi. I due sono alias. |
| `tempo` | numero | Millisecondi dalla mezzanotte di oggi (ora locale). |
| `today` | numero | Timestamp Unix della mezzanotte di oggi, in millisecondi. |
| `newline` | stringa | Un singolo carattere `\n`. |
| `tabulazione` | stringa | Un singolo carattere `\t`. |
| `backtick` | stringa | Un singolo carattere `` ` ``. |
| `interruzione` | stringa | Il frammento HTML `<br />`. Per costruire testo destinato a un elemento DOM. |
| `uuid` | stringa | Un UUID appena generato. Ogni valutazione ne restituisce uno nuovo. |

`data X` è un costrutto imparentato ma prende un operando — analizza una stringa di data ISO in un timestamp Unix. Vedi [aritmetica](arithmetic.md) per gli accessori delle componenti di tempo (`l anno di …`, `il mese di …`, ecc.).

Le parole chiave legate alle stringhe esistono perché i letterali con backtick non hanno sintassi di escape. Per mettere un newline, una tabulazione o un backtick letterale dentro una stringa, concatena la parola chiave con `cat`:

```as
metti `Premi il tasto ` cat backtick cat `~` cat backtick cat `.` in Message
metti `Riga 1` cat newline cat `Riga 2` in TwoLines
```

Questi sono gli unici modi per introdurre quei caratteri in un letterale di stringa.

## Quando la conversione automatica non basta

### `il valore di` — conversione esplicita da stringa a numero

`il valore di X` converte una stringa nel suo valore numerico. Usalo quando una stringa sembra un numero ma non si converte da sola in una condizione:

```as
metti `04` in Mm
se il valore di Mm non è minore di 4 ...   ! confronto numerico, vero
se Mm non è minore di `04` ...             ! confronto tra stringhe — sbaglia per "10" < "04"
```

Senza `il valore di`, l'operatore `è` confronta i valori come testo. `"04"` e `"10"` confrontati come stringhe trattano `"0"` < `"1"` e danno la risposta sbagliata. `il valore di` garantisce un vero confronto numerico.

`il valore di` funziona anche con operazioni su stringhe in catena:

```as
se il valore di sinistra 2 di da 5 di BookingDate non è minore di 4 ...
```

Si legge da sinistra a destra: prendi `BookingDate`, ottieni `dalla posizione 5`, prendi `sinistra 2`, poi converti in valore. La catena funziona perché AllSpeak valuta da sinistra a destra — naturale per l'inglese, insolito per la maggior parte dei linguaggi di programmazione.

### Stringhe decimali

Per le stringhe dall'aspetto decimale (`3.14`), la conversione non è automatica — l'aritmetica è intera per prima, e `3.14` resta una stringa. Vedi [aritmetica](arithmetic.md) e [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md).

### Ispezione dei tipi

Per l'ispezione, i test di tipo sono condizioni:

```as
se X è numerico ...
se X è un vettore ...       ! in forma JSON
se X è un oggetto ...      ! in forma JSON
se X è pari ...
se X è dispari ...
```

Vedi [condizioni](conditions.md).

## JS contro Python

Il modello dei valori è condiviso tra i runtime. Le implementazioni differiscono sotto la superficie — JS unifica l'archiviazione tramite rappresentazione in stringhe; Python usa `int`, `str`, `bool` nativi e converte ai confini delle operazioni — ma il comportamento a livello di script è lo stesso in entrambi. La differenza conta solo quando leggi il sorgente del motore o scrivi un plugin.

## Perché tre tipi e non di più

AllSpeak evita deliberatamente le gerarchie di tipi più ricche dei linguaggi mainstream. I tre tipi coprono tutto ciò che ti serve per la logica di interfaccia, la gestione dei dati e il flusso di controllo; le strutture più ricche (forme JSON, elementi DOM, moduli) sono gestite da variabili tipizzate fornite dal dominio di competenza. Mantenere semplice il livello dei valori rende il motore piccolo, il linguaggio uniformemente leggibile e la mappatura multilingue diretta — ogni tipo ha un nome di una sola parola facile da tradurre.

## Vedi anche

- [variabili e array](variables-and-arrays.md) — le variabili come array di un elemento; il modello del cursore.
- [aritmetica](arithmetic.md) — operazioni numeriche intere per prime.
- [stringhe e testo](strings-and-text.md) — operazioni sulle stringhe.
- [condizioni](conditions.md) — uguaglianza, confronto, test di tipo.
- [collezioni](collections.md) — tipi di valore in forma JSON (array, oggetto).
