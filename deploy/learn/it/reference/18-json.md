# JSON

AllSpeak tratta il JSON come un concetto di prima classe, non come una fatica di manipolazione di stringhe. La maggior parte degli script che devono leggere o scrivere JSON non chiama esplicitamente un passo `stringify` o `parse`: lo fanno per loro i comandi circostanti, in base al tipo del valore. Questa pagina raccoglie le regole, così non devi scoprirle parola chiave per parola chiave.

## Scrivere JSON

I due percorsi principali sono `save` per le scritture di valori completi e `accoda … al file json` per le scritture incrementali.

### `save Var to <path>` — codifica automaticamente dict e lista

Il `save` del runtime Python ispeziona il tipo del proprio contenuto. Se è un `dict` o una `list`, il valore viene serializzato con `json.dumps` prima della scrittura; se è una stringa, viene scritto verbatim.

```
variable Rows
list Rows
! ... popola Rows ...
save Rows to `data/2024-25/04.json`
```

L'output JSON è **pretty-printed di default** (indentazione di due spazi) così i file salvati possono essere aperti direttamente per l'esame umano. Vale per due percorsi:

- **Dict o lista a codifica automatica.** Il serializzatore usa `indent=2`, indipendentemente dal percorso del file.
- **Contenuto stringa salvato in un percorso `.json`.** Se il contenuto è già una stringa JSON (per es. il corpo della richiesta di un POST verso l'endpoint `/write/<file>` di `server.as`, che `save` scrive verbatim), viene analizzato e riemesso con `indent=2`. Se la stringa non si analizza come JSON, viene scritta verbatim: il contenuto non-JSON in un file `.json` viene lasciato com'è piuttosto che far crashare il salvataggio.

L'estensione del file è una convenzione documentale per la *codifica*: un dict o una lista salvati in un file senza estensione sono comunque codificati come JSON; una stringa non-JSON salvata in `report.json` è comunque scritta verbatim. Ma per la *formattazione*, l'estensione `.json` attiva sì il passaggio di pretty-print sul contenuto stringa.

### `accoda Elemento al file json <path>` — append incrementale all'array

```
accoda NewRow al file json `data/2024-25/04.json`
```

Legge l'array esistente, ci accoda `Elemento`, riscrive. Crea il file (contenente un array di un solo elemento) se non esiste. Usalo quando vuoi far scorrere righe dentro un file senza tenere in memoria l'intera lista.

Il file deve contenere un array JSON: accodare a un file-oggetto solleva un errore a runtime.

### Le cartelle genitore vengono create automaticamente

`save Var to data/2024-25/04.json` crea `data/` e `data/2024-25/` al bisogno se non esistono già. Non serve prima un passo `create directory`: quel comando resta disponibile per i casi in cui vuoi creare una cartella senza scriverci nulla. (Usalo con parsimonia: il `create directory` esplicito è raramente necessario ora che `save` gestisce il proprio albero.)

## Leggere JSON

### `load Var from <path>` — legge come stringa

`load` legge il contenuto del file verbatim e memorizza il risultato come stringa. Non analizza il JSON, indipendentemente dall'estensione del file.

```
variable Text
load Text from `data/2024-25/04.json`
```

`Text` ora contiene il contenuto grezzo del file.

### `json di <stringa>` — analizza in dict o lista

Per trasformare la stringa caricata in un valore utilizzabile, prendine il `json di`:

```
variable Text
variable Rows
load Text from `data/2024-25/04.json`
metti json di Text in Rows
```

`Rows` ora è un dict o una lista (a seconda della forma JSON di livello superiore) e può essere indicizzato, iterato o contato con i soliti comandi per array/dizionari.

Se l'input non è JSON valido, `json di` produce un valore vuoto invece di sollevare un errore: avvolgi il codice successivo in una guardia `se Rows è vuoto` se non puoi fidarti della sorgente.

## Riformattare testo JSON

Due modificatori di valore operano sulle stringhe JSON senza toccare dict o liste:

- `stringify Text` — riemette come JSON compatto (senza spazi bianchi). Utile per normalizzare un payload scritto a mano o pretty-printed prima della trasmissione.
- `prettify Text` — riemette con indentazione di 4 spazi. Utile per scrivere file di configurazione leggibili dall'uomo.

Entrambi si aspettano che l'input sia già una stringa JSON valida. Per fare il pretty-print diretto di un dict o di una lista, salvalo (che lo codifica in compatto), ricaricalo, poi applica `prettify`; oppure fallo passare da `stringify` dopo un giro salva/carica.

## Tranello JS: `metti V in X` sostituisce lo slot

Sul lato JS, `imposta X a vettore` inizializza lo slot del cursore a `[]`. Un successivo `metti Row in X` *sostituisce* lo slot: il wrapper array è perso, e nello slot resta solo `Row`. `rest invia X a URL dando Risposta` invierà allora `Row`, non `[Row]`.

```as
! SBAGLIATO
variabile Bucket
imposta Bucket a vettore
indice Bucket a 0
metti Row in Bucket            ! lo slot ora è Row; il [] è sparito
rest invia Bucket a URL dando Risposta    ! invia Row, non [Row]
```

Non è un bug: `metti V in X` scrive V nello slot del cursore esattamente come se X fosse stata una variabile inutilizzata; il runtime non dà agli array negli slot alcun trattamento privilegiato. Per far crescere l'array tenuto nello slot, usa la parola chiave che conosce gli array:

```as
! GIUSTO
variabile Bucket
imposta Bucket a vettore
json aggiungi Row a Bucket     ! lo slot ora è [Row]
rest invia Bucket a URL dando Risposta    ! invia [Row]
```

Vedi [collezioni](04-collections.md) per la spiegazione più lunga del perché il modello del cursore e `imposta X a vettore` sono livelli indipendenti che non si compongono con `metti`.

## Note tra i due runtime

Lo stesso vocabolario di superficie funziona su entrambi i runtime, ma i dettagli dal lato runtime differiscono:

- **Lato browser JS**: `rest ottieni`/`rest invia` gestiscono il JSON automaticamente — il corpo della risposta di una reply `application/json` viene analizzato prima di essere messo nella variabile di destinazione, e una destinazione dict/lista viene codificata in JSON come corpo della richiesta. La famiglia di parole chiave `json` dedicata (`json aggiungi`, `json elimina`, `json ordina` …) fornisce la manipolazione in place.
- **Lato Python**: oggi non esiste una famiglia di parole chiave `rest`; l'I/O HTTP lato Python passa da `get from url`, `download` e dai gestori di richieste del plugin `server`. Quei gestori del plugin server codificano automaticamente il valore di ritorno, quindi `ritorna Rows a Files` trasporta JSON quando `Rows` è un dict o una lista.

Scrivi gli script che devono funzionare su entrambi i runtime contro il core `save`/`load`/`json di` e lascia l'I/O HTTP a un runtime o all'altro.

## Quando NON usare file JSON

Il JSON è il formato ovvio per i dati strutturati, ma:

- Per una configurazione che gli umani modificano a mano, valuta se un `.json` Webson (vedi [Browser e Webson](14-browser-and-webson.md)) è più adatto: può includere commenti tramite le chiavi `#doc` e supporta il riuso dei componenti tramite `$Nome`.
- Per dati tabellari con milioni di righe, il JSON è lento da analizzare e ingombrante da memorizzare; trattalo come un trampolino piuttosto che come il formato a lungo termine.
- Per i messaggi tra processi su MQTT, il runtime JS codifica già automaticamente il payload (vedi [MQTT pub/sub](../idioms/07-mqtt-pubsub.md)) — non doppia la codifica passando prima da `stringify`.
