# Scrivere in linguaggio neutro

## Problema

I pacchetti linguistici di AllSpeak traducono automaticamente le parole chiave — la stessa struttura di script funziona in qualsiasi lingua supportata. Ma la traduzione del pacchetto non copre tutto. Uno script che dà per scontate assunzioni inglesi su stringhe, nomi o costrutti farà inciampare il suo traduttore (o si romperà del tutto sotto un altro pacchetto).

## Cosa fa il pacchetto linguistico per te

Il vocabolario. Quando scrivi un verbo (`stampa`, `imposta`, `aggiungi`), un connettivo (`a`, `in`, `di`) o una condizione (`è`, `è minore di`), il livello linguistico sostituisce la forma di superficie giusta per il pacchetto attivo. La stessa forma di script sorgente compila nello stesso programma interno, a prescindere dalla lingua. Vedi [multilingua](../reference/multilingual.md).

## Cosa non traduce il pacchetto

Quattro aree di cui è responsabile l'autore.

### Stringhe letterali

Il testo delimitato da backtick passa invariato:

```as
stampa `Ciao, mondo!`
```

Tradurre significa modificare la sorgente. Per rendere uno script facile da localizzare, raccogli le stringhe visibili all'utente in cima (o in una risorsa Webson separata), non sparse inline. La traduzione diventa così un unico passaggio su una sezione, non sull'intero script.

### Nomi di variabili ed etichette

I nomi li sceglie l'autore; il pacchetto non li tocca. Pratica convenzionale: scegli una lingua per i nomi per ogni script e usala in modo coerente. Mescolare variabili inglesi con parole chiave francesi (o viceversa) è tecnicamente legale ma si legge come una traduzione a metà.

Quando porti uno script in una nuova lingua, spesso si traducono anche le variabili — il risultato risulta naturale a chi parla la lingua di destinazione.

### Costrutti che non esistono in ogni pacchetto

Alcuni pacchetti hanno un insieme di sinonimi più ricco di altri. Se scrivi un inglese idiomatico che dipende da una formulazione specifica — una catena insolita di `il … di`, per esempio — il traduttore potrebbe non avere una corrispondenza uno-a-uno nella lingua di destinazione. Preferisci i costrutti presenti in ogni pacchetto — quelli usati nei tutorial del [codex](/codex.html) sono un insieme sicuro.

Un esempio concreto: `for each` è difficile da esprimere chiaramente in inglese parlato, e peggio ancora in molte altre lingue, quindi il corso lo abbandona in favore di cicli `mentre` con indici espliciti. Idiomi come questo si traducono più facilmente dei costrutti che si appoggiano su una formulazione inglese specifica.

### Formati dei dati

Numeri, date e formati simili dipendono dalla cultura. AllSpeak non impone un formato unico. Se il tuo script costruisce una stringa di visualizzazione con `cat`, il risultato è in stile inglese. Per localizzare:

- Instrada l'output sensibile al formato attraverso un helper che consulta un formattatore per lingua, oppure
- Costruisci la stringa consapevole della locale nel punto di visualizzazione, tenendo l'archiviazione interna in forma canonica (per es. interi per il denaro).

## Test

Il test più affidabile: traduci la direttiva `language` e una manciata di parole chiave, poi esegui lo script sotto un altro pacchetto. Le sorprese che compilano in inglese ma falliscono in francese di solito puntano a una parola chiave che il pacchetto FR non ha recepito — o a una stringa letterale di cui l'autore ha dimenticato che era legata alla lingua.

Uno script che gira senza modifiche sotto almeno due pacchetti linguistici (a parte la direttiva) è un forte segnale di neutralità linguistica.

## Pattern che ripagano

- **Esternalizza le stringhe visibili all'utente.** Mettile in una risorsa Webson `.json` o in un'unica sezione dello script. La traduzione è un solo passaggio.
- **Una lingua per script per i nomi.** Scegli la lingua principale dello script e sii coerente.
- **Attieniti ai costrutti documentati.** Il livello di riferimento mostra ciò che è universalmente disponibile; formulazioni idiosincratiche potrebbero non tradursi.
- **Formatta alla visualizzazione, non all'archiviazione.** Tieni i valori interni canonici; localizza solo al confine.

## Correlati

- [multilingua](../reference/multilingual.md) — come funziona il pacchetto linguistico.
- [struttura](../reference/structure.md) — perché il codice di dominio non vede mai token localizzati.
- [lavorare con l'IA](working-with-ai.md) — la traduzione con l'IA è un utile primo passaggio per i porting.
