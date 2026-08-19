# Aritmetica

L'aritmetica di AllSpeak è **intera per prima**. Non esistono letterali a virgola mobile a livello di linguaggio; tutta l'aritmetica opera su interi. I numeri che sembrano float (`3.14`) sono stringhe, non valori numerici. Quando serve precisione frazionaria, usa il modello degli interi scalati (più sotto).

## Operatori

Tutta l'aritmetica è basata su parole chiave — non esistono operatori infissi come `+`, `-`, `*`, `/`.

Binari (a livello di istruzione):

```
aggiungi A a B
aggiungi A a B dando C
togli A da B
togli A da B dando C
moltiplica A per B
moltiplica A per B dando C
dividi A per B
dividi A per B dando C
```

`modulo` è un altro animale: un operatore binario **a livello di valore** piuttosto che un'istruzione — vedi [la sezione sul resto](#remainder) più sotto.

Unari:

```
nega X
nega X dando Y
```

`dando` scrive il risultato in una nuova variabile senza modificare la sorgente.

## Esempi

```as
aggiungi 1 a Counter         ! Counter ora è Counter + 1
togli 5 da Total    ! Total ora è Total - 5
moltiplica Width per 2      ! Width ora è Width × 2
dividi Total per 100      ! Total ora è Total ÷ 100 (divisione intera)
aggiungi 1 a Counter dando NewCounter   ! Counter invariato, NewCounter = Counter + 1
nega Height            ! Height ora è -Height
nega Balance dando Opposite       ! Balance invariato, Opposite = -Balance
```

## Che cosa conta come valore numerico

L'aritmetica funziona solo su **veri valori numerici**. Un valore prodotto da un'**operazione su stringhe** (`sinistra N di`, `destra N di`, `da N di`, `cat`, `il contenuto di`) è una stringa — anche se la stringa contiene solo cifre. L'aritmetica su un valore del genere può essere respinta o produrre risultati inattesi.

Per convertire una stringa dall'aspetto numerico in un vero numero, usa `il valore di`:

```as
metti sinistra 4 di BookingDate in FY          ! FY = "2025" (stringa)
aggiungi 1 a FY                                 ! può fallire — FY è una stringa
metti il valore di FY in NextYr             ! NextYr = 2025 (numero)
aggiungi 1 a NextYr                             ! NextYr = 2026 (numero) ✓
```

`il valore di` è documentato in [valori e tipi](values-and-types.md).

## Interi scalati

Per denaro, percentuali, misure e altre quantità che concettualmente hanno precisione frazionaria, memorizza il valore come un intero moltiplicato per un fattore di scala, e dividi solo quando lo mostri.

```as
! Salva £12.50 come 1250 penny
metti 1250 in Price

! Mostra come «£12.50»
dividi Price per 100 dando Pounds
metti Price modulo 100 in Pence
```

Il modello degli interi scalati è trattato in dettaglio in [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md).

## Note sulla divisione

La divisione intera tronca verso zero:

```as
dividi 10 per 3         ! 3
dividi -10 per 3        ! -3
```

Per il resto, usa `modulo` — un vero operatore binario utilizzabile ovunque sia atteso un valore (non un'istruzione come `aggiungi`/`dividi`):

```as
metti 10 modulo 3 in R    ! R = 1
metti 17 modulo 5 in N    ! l'operando di sinistra può essere qualsiasi valore
se Score modulo 2 è 0 ...    ! funziona anche nelle condizioni
metti I modulo Max in I   ! avvolgimento ciclico classico: 0..Max-1, poi si torna a 0
```

L'operando di sinistra può essere una costante, una variabile o qualsiasi espressione di valore; entrambi gli operandi vengono valutati e il risultato è il resto intero. `modulo` è un comodo strumento di avvolgimento per far girare un indice su un intervallo fisso.

## `scala` — dalle stringhe decimali agli interi scalati

`<stringa decimale> scala <intero positivo>` converte una rappresentazione testuale di un numero in un intero scalato, arrotondando **la metà allontanandosi da zero** quando la stringa porta più cifre decimali di quelle richieste dalla scala:

```as
metti `3.14` scala 100 in Pi        ! 314
metti `12.345` scala 100 in Pence   ! 1235 — 12.345 arrotonda a 1234,5 → 1235
metti `-3.14` scala 100 in Pi       ! -314
metti `42` scala 100 in Pence       ! 4200 — funzionano anche le stringhe intere
metti `.5` scala 100 in Half        ! 50
```

L'operando di sinistra deve essere una stringa decimale pulita (`3`, `3.14`, `.5`, `-3.14`); qualsiasi altra cosa (`` `abc` ``, `` `3.1.4` ``) è un **errore a runtime**, così come una scala che non sia un intero positivo. La conversione usa l'aritmetica intera, quindi i risultati sono esatti — `12.345 scala 100` non è mai 1234 nonostante il rumore dei float. L'uso canonico è analizzare i valori REST/form in arrivo nel modello degli interi scalati — vedi [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md).

## Componenti di tempo

`l anno di X`, `il mese di X`, `il giorno di X`, `il daynumber di X`, `l ora di X`, `il minuto di X`, `il secondo di X` estraggono componenti da un timestamp Unix (secondi dall'epoca). Restituiscono sempre un numero:

| Accessore | Restituisce | Intervallo |
|---|---|---|
| `l anno di` | Anno completo | es. 2026 |
| `il mese di` | Numero del mese, da 0 | 0–11 |
| `il giorno di` | Giorno della settimana | 0–6 (0=domenica) |
| `il daynumber di` | Giorno del mese | 1–31 |
| `l ora di` | Ora del giorno | 0–23 |
| `il minuto di` | Minuto nell'ora | 0–59 |
| `il secondo di` | Secondo nel minuto | 0–59 |

```as
metti il timestamp in Now
metti l anno di Now in YYYY               ! es. 2026
metti il mese di Now in MM                ! 0=gen, 5=giu (da 0)
aggiungi 1 a MM                                 ! passa alla numerazione da 1
metti il daynumber di Now in DD            ! giorno del mese, 1-31
```

In alternativa, analizza una stringa di data ISO con `data X`:

```as
metti data `2026-05-15` in Stamp
metti il mese di Stamp in MM              ! 5
```

## Vedi anche

- [valori e tipi](values-and-types.md) — che cosa conta come numero; il flag numerico/non numerico; `il valore di`.
- [virgola mobile e interi scalati](../idioms/floats-and-scaled-integers.md) — il modello degli interi scalati per i valori frazionari.
- [condizioni](conditions.md) — `è pari`, `è dispari`, `è numerico`.
- [simboli e layout](symbols-and-layout.md) — `-` come prefisso numerico.
