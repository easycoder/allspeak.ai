# Convenzioni di stile

Il compilatore accetta più di quanto questa pagina raccomandi. Quello che segue sono le **convenzioni di stile** del progetto — le scelte che fa dove il linguaggio ne lascia aperte diverse, perché uno script scritto questo mese, da una persona o da uno strumento di IA, si legga come il resto del codice. È una raccomandazione, non una regola: nulla di quanto segue è imposto, e uno script che se ne allontana compila comunque.

Due argomenti, entrambi di impaginazione: **dove mettere `inizio` e `fine`**, e **come spezzare un'istruzione lunga su più righe**.

## `inizio` e `fine` su righe proprie

`inizio` può condividere la riga dell'istruzione che apre il blocco:

```as
mentre N è minore di 3 inizio
    stampa N
    aggiungi 1 a N
fine
```

Le convenzioni di stile gli danno una riga sua, all'indentazione dell'istruzione che possiede il blocco — il corpo un livello più in basso, e `fine` di nuovo all'indentazione dell'istruzione:

```as
mentre N è minore di 3
inizio
    stampa N
    aggiungi 1 a N
fine
```

Tre ragioni:

- **L'estensione di un blocco si vede senza leggere la sua condizione.** `inizio` e `fine` sono allineati, quindi la forma del blocco si misura a colpo d'occhio.
- **Un `inizio` in fondo a una riga lunga è quello che sfugge più facilmente**, ed è quello che decide se le righe successive sono un blocco.
- **Un cambio di struttura costa una riga nel diff**, invece di qualche carattere aggiunto a una riga lunga.

### L'unica eccezione: `altrimenti inizio`

Una parola che apre una clausola può condividere la riga con `inizio`, purché non ci sia nient'altro su quella riga. `altrimenti inizio` è la forma che ricorre, ed è così che si evita un `altrimenti` orfano, solo sulla sua riga :

```as
se Name è vuoto
inizio
    imposta Missing
fine
altrimenti inizio
    svuota Missing
fine
```

`poi inizio` è ammesso per la stessa ragione. L'unico `poi` del linguaggio segue `esegui` — ``esegui `Other` come Panel senzattesa poi inizio … fine`` — quindi è raro; `altrimenti inizio` è quello da ricordare.

Nient'altro condivide una riga con `inizio`: le condizioni di `se` e di `mentre` prendono il loro a capo.

## Spezzare un'istruzione lunga

Una giunzione che sta comodamente su una riga resta su una riga. Questa sezione parla delle **lunghe** — quelle che vanno a capo in un riquadro dell'editor stretto, in un diff o in una vista di revisione, dove la coda di una riga avvolta si legge come un'istruzione a sé e la giunzione va cercata.

Quando un'istruzione va davvero spezzata, la si spezza **prima** della parola di giunzione — `cat`, `e`, `o`, `con` — con la riga di continuazione indentata di un livello in più rispetto all'istruzione. La coda dell'istruzione (`in X`, `dando Y`, `a Z`) chiude l'ultima riga.

### Lascia in pace quella corta

```as
metti `Hai ` cat Count cat ` messaggi.` in Status
```

### Un `cat` per riga, quando va spezzata

Sei frammenti fanno una riga lunga, quindi ogni `cat` ne inizia una:

```as
metti `Utente `
    cat UserName
    cat ` (id `
    cat UserId
    cat `) ha effettuato l'accesso alle `
    cat Time
    in LogLine
```

Questo mette anche l'errore che `cat` attira — una giunzione mancante, o un `cat` in testa — al bordo sinistro della pagina, dove basta uno sguardo, invece che nel mezzo di una riga avvolta.

### `e` e `o`, la stessa regola

Abbastanza corta da starci, quindi resta:

```as
se Name è vuoto o Email è vuoto vai a Reject
```

Abbastanza lunga da andare a capo, quindi si spezza prima di ogni parola di giunzione, con l'azione che resta sull'ultima condizione:

```as
se BookingDate è vuoto
    o BookingTime è vuoto
    o GuestCount è minore di 1 vai a RejectBooking
```

Una lista di argomenti si spezza allo stesso modo e alla stessa condizione — `vaisub Render con Panel` / `e Title` / `e Rows` sta su una riga e ci resta ; una chiamata con una dozzina di argomenti no, e si spezza prima di ogni `e`.

### L'indentazione è per chi legge, non per il compilatore

Il compilatore unisce una continuazione perché continua la **grammatica** — un `cat` dopo un valore, un `e` dopo un elenco — e l'indentazione gli è indifferente: una continuazione attaccata al margine sinistro compila esattamente come una indentata di tre livelli. L'indentazione in più ha quindi un solo scopo: che l'occhio veda un'istruzione spezzata invece di più istruzioni di seguito.

Quello che la grammatica non fa è continuare un'istruzione già chiusa. Un `metti … in D` completato su una riga, seguito da una riga che inizia con `cat`, è un errore di compilazione — la sorpresa più frequente qui, e la ragione per spezzare *prima* della parola di giunzione invece che dopo.

## Vedi anche

- [simboli e layout](symbols-and-layout.md) — etichette, indentazione, commenti, stringhe fra backtick.
- [flusso di controllo](control-flow.md) — blocchi `inizio … fine`, `se` / `altrimenti`, `mentre`.
- [`cat` e costruzione di stringhe](../idioms/01-cat-and-string-building.md) — l'idioma `cat` per intero, incluso l'inganno dell'analisi avida.
- [blocchi di documentazione](doc-blocks.md) — la convenzione di prosa che accompagna delle convenzioni di stile.
