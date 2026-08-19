# cat e costruzione di stringhe

## Problema

Devi costruire una stringa da più pezzi — un prefisso costante, un valore di variabile, un separatore letterale. La parola chiave `cat` di AllSpeak unisce due valori; il punto in cui va messa è l'errore più comune quando si comincia, e l'errore più comune che gli strumenti di IA fanno scrivendo AllSpeak.

## Il pattern

`cat` è **infisso**. Va *tra* due valori, mai prima del primo e mai dopo l'ultimo.

```as
metti `Ciao, ` cat Name cat `!` in Greeting
```

Leggilo così: `` `Ciao, ` `` poi `Name` poi `` `!` ``, con `cat` a separare ogni coppia. Non c'è un `cat` iniziale; non c'è un `cat` finale.

Qualsiasi numero di pezzi può concatenarsi — ogni coppia adiacente unita da un `cat`.

## Anti-pattern: `cat` iniziale

```as
metti cat `Ciao, ` cat Name in Greeting   ! SBAGLIATO
```

Il `cat` iniziale fa cercare al compilatore un valore prima di sé, non ne trova nessuno e segnala un errore di analisi. Toglilo.

## Anti-pattern: `cat` mancante

```as
metti `Ciao, ` Name `!` in Greeting   ! SBAGLIATO
```

I valori adiacenti senza `cat` tra loro non vengono uniti implicitamente. AllSpeak non ha la regola di adiacenza delle stringhe in stile C. Ogni unione deve essere esplicita.

## I valori che `cat` può unire

`cat` unisce qualsiasi coppia di valori, non solo stringhe. Numeri, timestamp, proprietà, risultati di `il contenuto di …` — qualsiasi cosa produca un valore:

```as
imposta Count a 7
metti `Hai ` cat Count cat ` messaggi.` in Status
metti `Registrato alle ` cat il timestamp
    cat ` — Campo nome: ` cat il contenuto di Name in Log
```

I numeri vengono convertiti nella loro forma testuale al momento. `Status` ora è `` `Hai 7 messaggi.` ``.

## Tranello: analisi golosa dei valori

AllSpeak non ha precedenza degli operatori né sintassi di raggruppamento delle espressioni (niente parentesi). Quando un costrutto come `sinistra N di X` legge il suo valore per X, l'analizzatore consuma quanto più può — compresa qualsiasi catena `cat … cat …` finale.

Questo rispecchia l'inglese parlato, che non ha precedenza degli operatori neanche lui. *"I can see Anne and Bob in the park"* non ti dice se sono entrambi nel parco o solo Bob; la stessa ambiguità viene sfruttata regolarmente per effetto comico e retorico. AllSpeak eredita il tratto; il costo è che devi essere deliberato su dove finisce ogni valore.

Quindi:

```as
metti sinistra 4 di `Ciao!` cat newline in Result
```

**non** significa ``(sinistra 4 di `Ciao!`) cat newline``. L'analizzatore legge `` `Ciao!` ` cat newline` `` come un unico valore combinato, poi vi applica `sinistra 4 di`. `Result` finisce come `Ciao`, senza newline — il newline era già dentro il valore che `sinistra 4 di` ha poi troncato.

Per forzare l'ordine voluto, assegna prima a una variabile temporanea:

```as
metti sinistra 4 di `Ciao!` in Result
metti Result cat newline in Result
```

Questo pattern della variabile temporanea è l'idioma di AllSpeak per forzare l'ordine di valutazione in qualsiasi espressione che coinvolga operatori che consumano valori.

## Inserire newline, tab e backtick

Le stringhe con backtick non hanno sintassi di escape. Per includere un carattere letterale newline, tab o backtick, usa le parole chiave di valore `newline`, `tabulazione` e `backtick` con `cat`:

```as
metti `Riga 1` cat newline cat `Riga 2` in Output
```

`Output` ora è due righe separate da un vero carattere newline. Non esiste la notazione `\n` dentro i backtick; questo pattern `cat`-con-parola-chiave è canonico.

Per incorporare un backtick letterale — facile da dimenticare perché i nomi delle parole chiave *sono* l'escape:

```as
metti `Premi ` cat backtick cat `Invio` cat backtick cat ` per continuare.` in Prompt
```

`newline`, `tabulazione` e `backtick` fanno parte di un insieme più ampio di parole chiave di valore nudo — anche `vuoto`, `now`/`timestamp`, `today`, `interruzione`, `uuid`. Vedi [valori e tipi](../reference/values-and-types.md#special-value-keywords) per l'elenco completo.

## Letterali backtick su più righe

Per le stringhe costanti lunghe, un letterale backtick su più righe può sostituire diversi frammenti uniti con `cat`:

```as
imposta Css a `position:relative;
    `width:90%;
    `margin:1em auto 0;
    `border:1px solid black;`
```

Le righe di continuazione iniziano con un backtick dopo qualsiasi spazio iniziale; le righe vengono unite senza newline. Vedi [simboli e layout](../reference/symbols-and-layout.md) per la regola lessicale.

Usalo quando hai un unico valore letterale lungo. Quando devi alternare costanti e variabili, resta con `cat`.

## Costruzione in stile template

Frammenti costanti dentro i backtick, inserimenti di variabili con `cat` in mezzo, in un'unica espressione:

```as
metti `Utente ` cat UserName cat ` (id ` cat UserId cat `) ha effettuato l'accesso alle ` cat Time in LogLine
```

Per i template lunghi, vai a capo in corrispondenza dei `cat`:

```as
metti `Utente ` cat UserName
    cat ` (id ` cat UserId
    cat `) ha effettuato l'accesso alle ` cat Time
    in LogLine
```

Il `cat` all'inizio di una riga di continuazione è un token normale — ad AllSpeak non importano gli a capo dentro un'istruzione, solo gli spazi tra i token.

## Correlati

- [simboli e layout](../reference/symbols-and-layout.md) — la sintassi dei backtick e la regola delle righe multiple.
- [stringhe e testo](../reference/strings-and-text.md) — le operazioni sulle stringhe (`sostituisci`, lunghezza di, posizione di).
- [variabili e array](../reference/variables-and-arrays.md) — che cosa viene interpolato.
