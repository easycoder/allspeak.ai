# Lavorare con l'IA

## Problema

Gli strumenti di IA sono utili per scrivere AllSpeak — bozze veloci, suggerimenti di idiomi, traduzioni. Sono anche affidabilmente sbagliati sui dettagli: il vocabolario di AllSpeak non sempre corrisponde ai dati di addestramento dell'IA, quindi l'IA produce con sicurezza una sintassi dall'aria plausibile che però non compila (o peggio, compila verso la cosa sbagliata). Lo scopo di questo idioma è rendere sfruttabili i punti di forza dell'IA senza cadere nei suoi modi di fallimento.

## Il ciclo di base

L'IA abbozza, l'umano revisiona. Si itera.

1. **Brieffa l'IA** sul compito. Puntala ai file di riferimento e di idiomi pertinenti — farà leva su quelli piuttosto che sui suoi dati di addestramento.
2. **L'IA produce una bozza.** Trattala come un primo passaggio, non come una risposta finale.
3. **Leggila con attenzione.** Cerca gli errori comuni elencati sotto.
4. **Esegui.** La compilazione cattura molti errori; i bug comportamentali richiedono uno `stampa` o un `registra` (vedi [debug di .as](debugging-as.md)).
5. **Itera.** O sistemi direttamente ciò che è sbagliato, o passa all'IA il sintomo e lascia che riabbozzi.

Il ciclo non è «l'IA fa tutto, l'umano timbra». È **l'IA batte a macchina, l'umano fa ingegneria.**

## Cosa pretende la «leggibilità»

Perché il passo di revisione funzioni, l'output dell'IA deve essere abbastanza leggibile perché un revisore veda ciò che non va senza rifare l'analisi da zero. Questo significa:

- **Blocchi di documentazione.** Ogni sezione avvolta in prosa `!! …` che spiega cosa fa e perché. Scrivere la doc forza l'IA a dichiarare la propria intenzione, il che fa emergere i divari tra ciò che dice la prosa e ciò che fa il codice. Vedi [blocchi di documentazione](../reference/doc-blocks.md).
- **Variabili con nomi parlanti.** Non `X` e `Y` — `Counter`, `ButtonClicked`, `IsLoggedIn`. Il revisore non deve tenere i tipi in testa.
- **Commenti inline dove il *perché* non è ovvio.** Un commento `!` che segnala una stranezza. Non riscrivere il codice; segnala la sorpresa.
- **Un concetto per sezione.** Le subroutine lunghe e promiscue non sono revisionabili. Se una sezione ha bisogno di due paragrafi di prosa in blocco di documentazione, sono due sezioni.

## Errori IA comuni su AllSpeak

Cose che gli strumenti di IA sbagliano in modo affidabile:

- **La posizione di `cat`.** L'IA mette `cat` prima del primo valore o lo omette tra i valori. Il `cat` di AllSpeak è solo infisso — vedi [cat e costruzione di stringhe](cat-and-string-building.md).
- **Operatori imperativi.** `Counter += 1` o `Counter = Counter + 1`. AllSpeak usa `aggiungi 1 a Counter`.
- **Cicli `for`.** AllSpeak non ha `for` né `for each`; l'iterazione è `mentre` o guidata da etichette. Vedi [modelli di ciclo](looping-patterns.md).
- **Indicizzazione di array in stile JSON (`metti in elemento N`).** AllSpeak usa un modello a cursore: `indice X a N` seleziona lo slot, poi `metti V in X` ci scrive. `metti V in elemento N di X` non è una destinazione valida per `metti`. `elemento N di X` legge da dentro un array JSON tenuto nello slot corrente — un meccanismo completamente separato. L'IA li confonde spesso, scrivendo `metti V in elemento N di Colors` (sbagliato) invece di `indice Colors a N; metti V in Colors` (giusto). Vedi [variabili e array](../reference/03-variables-and-arrays.md).
- **Aritmetica in virgola mobile.** `moltiplica 3.14 per 2`. `3.14` è una stringa, non un numero. Vedi [numeri a virgola mobile e interi scalati](floats-and-scaled-integers.md).
- **Parentesi per raggruppare.** `(A + B) * C`. Non esiste sintassi di raggruppamento; usa una variabile temporanea.
- **`elif` e `case`/`switch`.** AllSpeak non ha né l'uno né l'altro. `se … altrimenti se … altrimenti …` va benissimo (è solo `altrimenti` seguito da un altro `se`), ma la scorciatoia `elif` non esiste, e non esiste nemmeno un'istruzione `case` / `switch` — usa una catena di `se`/`altrimenti se` o un dispatch a etichette.
- **Confusione tra `o` e `on failure`.** Comportamento post-clausola diverso — `o` ferma, `on failure` continua. Vedi [errori e recupero](../reference/errors-and-recovery.md).
- **Array `#` di Webson con oggetti inline.** L'array `#` di Webson si aspetta riferimenti stringa `$Name`, non oggetti JSON grezzi. `"#": [{ "#element": "div", ... }]` fallirà a runtime con `build: [object Object] has no properties`. Definisci voci `$Block` nominate e riferiscile in `#`: `"#": ["$Block"]` con `"$Block": { "#element": "div", ... }` definito lì vicino. Vedi [browser e Webson](../reference/14-browser-and-webson.md).
- **Pre-inizializzazione inventata `imposta le proprieta`.** Le proprietà sugli elementi di un array si auto-inizializzano alla prima scrittura — non esiste un comando di pre-inizializzazione. `imposta le proprieta di Cell a vettore per \`color\`` non è AllSpeak valido. L'approccio corretto è `imposta proprieta \`color\` di Cell a 0` dentro il ciclo di creazione; il dizionario JSON per elemento viene creato automaticamente. Vedi [browser e Webson](../reference/14-browser-and-webson.md).
- **`get` usato come parola chiave di assegnazione.** `get property \`name\` of X into V` non è AllSpeak valido. AllSpeak non ha una parola chiave `get` per l'assegnazione — il pattern di lettura universale è `metti <sorgente> in <destinazione>`, proprietà comprese: `metti proprieta \`name\` di X in V`. È un ibrido comune dell'IA tra `get` (da JavaScript/Python) e `metti … in …` (da AllSpeak). Vedi [browser e Webson](../reference/14-browser-and-webson.md).
- **Parole chiave inventate.** `return X`, `break`, `continue`, `try`/`catch`, `await`, `get X into Y`. Nessuna esiste in AllSpeak.

Gli errori di posizionamento di `cat`, di `for`/`for each`, di indicizzazione di array in stile JSON, di array `#` con oggetti inline e di pre-inizializzazione delle proprietà inventata sono i più comuni; gli altri sono sporadici.

## Chiedile di spiegare prima di chiederle di riscrivere

Quando l'output dell'IA è sbagliato, la tentazione è dire «è sbagliato, riprova». È rilanciare i dadi. Una prima mossa migliore:

> «Spiegami cosa fa questo codice, riga per riga.»

La spiegazione dell'IA o corrisponde alla realtà (e in quel caso puoi individuare con precisione dove non sei d'accordo) o non corrisponde (e in quel caso ti ha appena detto cosa si aspettava davvero che il codice facesse). In entrambi i casi ora hai più informazioni di un tentativo alla cieca.

Una volta che sai cosa cercava di fare l'IA, puoi sistemarlo da solo o darle un'istruzione precisa:

> «Sostituisci il ciclo `for each` con un ciclo `mentre` usando un contatore; AllSpeak non ha `for each`.»

## Il passaggio dei blocchi di documentazione come punto di revisione

Quando l'IA scrive una sezione, chiedile di aggiungere un blocco di documentazione nello stesso momento. La prosa la forza a dichiarare la propria intenzione in linguaggio semplice, dove le contraddizioni con il codice saltano all'occhio. Il meccanismo `@hash` blocca poi l'abbinamento — se una modifica futura cambia il codice senza rivedere la prosa, l'analizzatore lo segnala. Vedi [blocchi di documentazione](../reference/doc-blocks.md).

## Anti-pattern: fidarsi dell'IA sui dettagli di sintassi

Il vocabolario di AllSpeak non corrisponde del tutto a ciò su cui l'IA è stata addestrata. Anche quando l'IA sembra sicura, le parole chiave specifiche, la posizione di `cat`, la gestione delle clausole di fallimento sono dettagli da verificare contro il riferimento. Il corso esiste in parte proprio perché si possa puntare l'IA lì invece di farla indovinare.

## Anti-pattern: prima il spec, poi il codice, poi il blocco di documentazione

È tentante scrivere un spec dettagliato, darlo all'IA, lasciarle produrre il codice e poi aggiungere un blocco di documentazione che descrive il codice. Quest'ordine manca il punto dei blocchi di documentazione. La prosa serve a catturare l'intenzione *nel momento in cui il codice viene scritto*, così i disaccordi tra intenzione e risultato emergono. Se il blocco di documentazione è scritto a partire dal codice risultante, si limita a ripetere ciò che l'IA ha prodotto — perdendo il suo valore di controllo.

Il giusto ordine: umano e IA si accordano sull'intenzione (a voce o in un brief), l'IA scrive codice e blocco di documentazione insieme, l'umano revisiona entrambi per verificarne la coerenza.

## Correlati

- [blocchi di documentazione](../reference/doc-blocks.md) — la convenzione di revisionare mentre si documenta.
- [debug di .as](debugging-as.md) — `stampa` / `registra` per verificare il comportamento.
- [scrivere in linguaggio neutro](writing-language-neutral.md) — l'IA come primo traduttore.
- [cat e costruzione di stringhe](cat-and-string-building.md) — l'errore IA singolo più comune.
