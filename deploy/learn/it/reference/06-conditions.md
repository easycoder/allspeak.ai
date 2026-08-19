# Condizioni

Una condizione è qualcosa che si valuta come vero o falso. AllSpeak usa condizioni basate su parole chiave; non esistono operatori di confronto infissi (`==`, `!=`, `>`, `<`, `>=`, `<=`) — anzi, praticamente tutti i simboli di punteggiatura sono vietati per progettazione. AllSpeak punta a essere **parlabile**: ogni costrutto si legge come una frase parlata.

Questo file elenca il vocabolario delle condizioni di Core, che è ciò che `se` e `mentre` consumano. I domini e i plugin possono contribuire con proprie condizioni — vedi [struttura](structure.md).

## Uguaglianza e confronto

`è` verifica l'uguaglianza:

```as
se Counter è 0 ...
se Name è `admin` ...
```

`non è` verifica la disuguaglianza. Per le lingue la cui grammatica preferisce l'ordine inverso, è accettata anche la forma `è non`:

```as
se Status non è `error` ...
```

Il confronto numerico usa `è minore di` e `è maggiore di`:

```as
se Count è maggiore di 0 ...
se Index è minore di la lunghezza di List ...
```

Per ≤ e ≥, inverti il test — non esistono parole chiave esplicite `è al massimo` / `è almeno`:

```as
se Score non è minore di 60 ...        ! ≥ 60
se Items non è maggiore di Max ...    ! ≤ Max
```

## Errori comuni con gli operatori in stile C

Le condizioni di AllSpeak sono a parole chiave. Gli operatori in stile C **non sono validi**:

| Sbagliato (stile C) | Corretto (AllSpeak) |
|---|---|
| `if X == 0` | `se X è 0` |
| `if X != 0` | `se X non è 0` |
| `if X > 5` | `se X è maggiore di 5` |
| `if X < 5` | `se X è minore di 5` |
| `if X >= 5` | `se X non è minore di 5` |
| `if X <= 5` | `se X non è maggiore di 5` |

Le forme a parola chiave si leggono da sinistra a destra, come nel linguaggio naturale. Un'IA che ricade di default sugli operatori in stile C produrrà codice non valido — usa sempre le forme a parola chiave.

## Errori comuni: confronto tra stringhe e numeri

Di default `è` confronta i valori come testo. Quando confronti una stringa come `"04"` con un numero, il confronto è lessicale (carattere per carattere), non numerico:

```as
se Mm non è minore di `04`     ! confronto tra stringhe — funziona per "05" ma fallisce per "10" < "04"
```

Per confrontare numericamente, usa `il valore di` per convertire prima la stringa in numero:

```as
se il valore di Mm non è minore di 4    ! confronto numerico — funziona per tutti i valori
```

`il valore di X` è documentato in [valori e tipi](values-and-types.md).

## Negazione

Negare una condizione con `non` all'inizio, oppure usa `non è` dentro la condizione:

```as
se non Clicked ...
se Count non è 0 ...
```

Non esiste una negazione basata su parentesi — `se non (Count è 0)` non è AllSpeak valido. Usa invece `se Count non è 0`.

## Test booleani

Un valore nudo è un test di verità:

```as
se Clicked ...                      ! vero se Clicked è veritiero
se Found imposta il contenuto di Status a `OK`
```

Per un test booleano esplicito:

```as
se Clicked è vero ...
se Clicked è falso ...
```

## Test di tipo

`è numerico` verifica se un valore può essere usato come numero:

```as
se Input è numerico ...
```

`è un vettore` e `è un oggetto` verificano se un valore contiene una collezione in forma JSON:

```as
se Response è un vettore ...
se Config è un oggetto ...
```

`è pari` e `è dispari` verificano la parità:

```as
se Counter è pari ...
```

## Condizioni sulle stringhe

`contiene` verifica la presenza di una sotto-stringa:

```as
se Path contiene `/api/` ...
se Email contiene `@` ...
```

`inizia con` e `finisce con` verificano prefisso/suffisso:

```as
se Name inizia con `Dr ` ...
se File finisce con `.json` ...
```

## Condizioni composte

`e` e `o` uniscono due condizioni:

```as
se Count è maggiore di 0 e Count è minore di 100 ...
se Status è `error` o Status è `timeout` ...
```

Non esiste precedenza tra `e` e `o` — usa istruzioni `se` separate o blocchi `inizio`/`fine` annidati per disambiguare la logica complessa.

Una catena di due condizioni di solito si legge bene. Per tre o più, valuta di estrarre le condizioni in variabili booleane:

```as
se Count è maggiore di 0
    e Count è minore di 100
    e Status non è `error` ...
```

## Vedi anche

- [valori e tipi](values-and-types.md) — le regole di verità/falsità, il flag numerico, `il valore di`.
- [stringhe e testo](strings-and-text.md) — `contiene`, `inizia con`, `finisce con`.
- [controllo di flusso](control-flow.md) — `se`, `mentre`, `inizio`/`fine`.
