# Registrazioni

Una **registrazione** è quello che ha fatto un'esecuzione: quali parti del programma sono state raggiunte, in quale ordine e quante volte — con i momenti in cui sono state raggiunte. Viene scritta come file JSON accanto allo script, e può essere riletta in seguito — nel visualizzatore, o da qualunque altro strumento — senza rieseguire nulla.

È tutto qui il punto. Uno stack trace ti dice che un programma è fallito; un log è qualcosa che hai scelto di scrivere; un profiler è un'aggregazione su molte esecuzioni. Una registrazione è un'esecuzione, conservata.

Due parole ne aprono e ne chiudono una:

```as
    viz start [on <label>] [once|every] [until thread] [limit <n>]
    viz stop  [on <label>]
```

## I due marcatori

| Marcatore | Cosa fa |
|---|---|
| `viz start` | Arma un registratore se lo script non ne ha uno, e apre una finestra. |
| `viz stop` | Chiude la finestra e la scrive nel file di traccia. |

`@viz start` e `@viz stop` sono le grafie come attributo e significano esattamente la stessa cosa delle istruzioni. Entrambe sono accettate, ed è voluto: uno script instrumentato che già funziona non deve smettere di funzionare perché esiste un modo in più di dire la stessa cosa. È la coppia di attributi su cui agisce il visualizzatore; gli attributi in generale sono descritti in `22-attributes` del riferimento inglese, che non è ancora tradotto.

Le opzioni — ognuna è un affinamento, non qualcosa da imparare per prima:

- **`once`** (la predefinita) — una finestra alla volta. Una coppia start/stop dentro una subroutine altrimenti aprirebbe e chiuderebbe una finestra propria a ogni chiamata, cosa che l'autore raramente intende; `once` lascia reggere la prima finestra.
- **`every`** — vince la finestra più recente: un secondo start chiude quello precedente. È quella per un ciclo.
- **`until thread`** — la finestra si chiude quando termina il thread che l'ha aperta, invece che a uno stop che devi ricordarti di scrivere. È ciò che fa funzionare più punti di arresto senza instrumentarli uno per uno.
- **`limit <n>`** — il numero massimo di visite che questa finestra raccoglierà, 100.000 per impostazione predefinita. Il tetto ferma la *raccolta*; il programma continua.
- **`on <label>`** — il marcatore viene posto su un'etichetta invece che sulla propria riga. L'etichetta si nomina come `gosub` nomina la sua, così un riferimento in avanti funziona, e un nome che non risolve nulla è da segnalare all'analisi, non al compilatore.

Un `viz start` senza `viz stop` non è un errore. È il caso «osserva fino alla fine», e un host che termina l'esecuzione chiude la sua finestra per esso.

**Un marcatore non cambia nulla di un'esecuzione.** `viz start` si compila in un comando che il runtime oltrepassa senza eseguirlo, e la sintassi vive nel core invece che nel plugin — uno script instrumentato resta quindi uno script ordinario, `viz start` si compila che il visualizzatore sia caricato o no, e un marcatore lasciato per errore è innocuo. Senza un registratore agganciato un marcatore non apre alcuna finestra: non si raccoglie nulla e non si scrive alcun file.

## I valori che vale la pena osservare

`@show` nomina i valori che vuoi vedere accanto al flusso:

```as
    while Total is less than Limit @show Total, Row
    begin
        add Row to Total @show Total
    end
```

I valori viaggiano sulla **visita** in cui cadono — una visita essendo la permanenza di un'ancora, da un arrivo al successivo — così un `@show` su un `while` si attacca all'arrivo a cui appartiene, e un `@show` più in basso nel blocco si attacca alla visita in corso, che lo comprende. Un secondo `@show` entro la stessa estensione riscrive gli stessi nomi invece di aggiungere una seconda lettura: un valore per nome e per visita è ciò che un lettore può cogliere senza che il pannello diventi un log.

Viaggiano nella registrazione, nel campo `values` della registrazione dell'ancora. Quello che il visualizzatore ne fa è ancora in costruzione.

Due dettagli vale la pena conoscerli. Un nome che il programma non possiede viene catturato come `?` invece di sparire — un refuso quindi si mostra nella registrazione invece di far cadere in silenzio il valore. E un `@show` dentro un blocco viene letto quando l'istruzione viene raggiunta, *prima* che venga eseguita: riferisce quindi quello che il test ha visto, non quello che l'istruzione ha lasciato dietro di sé.

## Chiedere una registrazione

Ci sono diversi modi di chiederla, e quale sia quello giusto dipende da chi chiede.

### Dal visualizzatore

Il pulsante **Record** dell'editor registra lo script nel buffer aperto. Uno script che nomina un'applicazione è un caso a parte — vedi *Nominare la pagina dell'applicazione* più sotto — e al suo posto viene aperta quella pagina, armata dall'esterno e scritta alla chiusura della finestra.

### Il file flag, per un servizio in esecuzione

Un processo avviato su una macchina che raggiungi solo via SSH non può essere riavviato per guardarlo, ma un file può essere messo accanto al suo script. La richiesta è quindi un file:

```
touch thermostat.allspeak.record      chiede una registrazione
rm    thermostat.allspeak.record      ritira la richiesta
```

La flag viene letta **ai marcatori e in nessun altro punto** — nulla fa polling e nulla gira su un timer, così uno script senza marcatori non viene mai interrogato, e uno script i cui marcatori stanno nel suo ciclo di controllo viene interrogato una volta per ciclo, alla granularità che il suo autore ha scelto. Togliere la flag e poi rimetterla comincia una registrazione dal nulla, così il file precedente regge finché questo non viene scritto e un breve episodio non può distruggere una buona registrazione; rimetterla e poi toglierla la termina e la scrive.

È il meccanismo proprio del runtime Python, ed è l'unico punto in cui una registrazione viene chiesta a mano invece che da uno strumento — vedi *I runtime differiscono* più sotto per il motivo per cui il browser non può fare lo stesso.

### Da un altro script

```as
    record the script in Path as Source giving Trace reporting Verdict
```

Esegue uno script scelto da chi chiama sotto un registratore, e restituisce due cose: la registrazione come testo in `Trace`, e il verdetto in una riga in `Verdict`. `in <path>` è facoltativo e nomina lo script; `as <source>` è quello che passa chi possiede il testo stesso, così un editor con un buffer non salvato non deve scrivere un file e rileggerlo. Entrambi i runtime hanno questo.

Sul lato JavaScript ce ne sono altri due, per uno script che registra se stesso o un'applicazione già in esecuzione:

```as
    record this run
    save the recording to Path
```

`record this run` arma un registratore per il programma che lo chiama — ciò di cui ha bisogno un pulsante *dentro* un'applicazione, dato che nulla fuori da un programma vivo può agganciargli un registratore. `save the recording to` nomina il file di traccia e scrive quello che è già stato fermato; **crea** anche il file, vuoto, ed è questo che fa sì che una seconda esecuzione sostituisca la prima invece di aggiungersi a essa.

### Dalla riga di comando

```
allspeak --record=parser.viz.json parser H2O
```

Esegue lo script esattamente come farebbe `allspeak parser H2O`, e scrive quello che ha fatto nel file nominato. Senza la flag non si arma nulla, quindi un semplice `allspeak parser` si comporta come sempre.

## Dove finisce

Accanto allo script e nominato da esso, estensione compresa — `thermostat.allspeak` registra in `thermostat.allspeak.viz.json`. L'editor cerca quel nome, quindi una registrazione riportata con `scp` si visualizza aprendo lo script e premendo **Graph**.

Il file è un documento JSON descritto in `spec/viz-trace-format.md`. Lo scrittore attuale produce la **versione 2**, che ha aggiunto i record di trasferimento che dicono da dove veniva il controllo quando non cadeva semplicemente nella riga successiva. Un documento può essere accresciuto mentre la registrazione procede: `viz start`/`viz stop` delimitano un *segmento*, l'indice di finestra di ogni segmento continua da quello precedente, e un file contiene quindi quanti segmenti si vuole, uno dopo l'altro, nell'ordine in cui sono accaduti.

## Il verdetto

Una registrazione riferisce in una riga quanto vale, e quella riga è la stessa frase ovunque la si legga:

> `12 visite in 1 finestra`

Due delle letture contano più delle altre, perché entrambe sembrano dall'esterno un'esecuzione riuscita — una è uno script che non ha mai aperto una finestra, l'altra uno script che la protezione ha dovuto fermare:

> `niente registrato: l'esecuzione è terminata senza raggiungere un marcatore`

> `fermato: <motivo>`

e quando l'esecuzione era in attesa su un timer invece che finita, la riga delle visite guadagna una proposizione: `, e l'esecuzione attende lì — la registrazione finisce alla sua prima attesa`.

La prima è ciò che produce uno script senza finestra aperta, ed è per questo che i marcatori qui sopra sono la sola cosa da sapere a questo punto.

## Nominare la pagina dell'applicazione

```as
    @app color-memory.html
```

Su una riga propria, questo dice in quale pagina lo script viene eseguito. È ciò che apre **Launch**, ed è ciò che decide come **Record** tratti lo script: uno script che nomina un'applicazione è guidato dalla propria pagina — i suoi marcatori vengono raggiunti da una *persona* che clicca, non dall'avvio dello script — quindi l'editor apre quella pagina, la arma dall'esterno e salva la registrazione alla chiusura della finestra. Uno script che non nomina alcuna applicazione viene invece eseguito direttamente.

## La protezione

Un registratore osserva il lavoro proprio del programma e termina l'esecuzione se questa scappa:

- **2 secondi di lavoro** — il tempo che hanno preso i comandi *propri* del programma, attese escluse: `wait`, `every`, `release`, `input`, `download`, `alert`, e tutto ciò che recupera una `url`. Un intervallo più lungo di 20 ms è attesa, non lavoro.
- **20 secondi di orologio** — perché il budget da solo limita solo ciò che il programma *fa*, e un ciclo che attende tra un'iterazione e l'altra non lo spende mai. I due vengono distinti nel rapporto, perché uno è codice lento e l'altro di solito è codice sbagliato.

**Il registratore della flag non porta alcuna protezione, e non è una dimenticanza.** Il suo scopo è osservare uno script che probabilmente sta facendo qualcosa di utile — un controllore, un servizio — e una protezione lì *fermerebbe la cosa osservata*. È limitato invece da un tetto su ciò che può raccogliere: 50.000 visite, dopo le quali scrive quello che ha e lo dice su stderr, dove la persona che ha digitato il `touch` lo troverà.

## I runtime differiscono

`record the script …` c'è in entrambi. Il resto no, e la divisione vale la pena di essere conosciuta prima di scrivere uno script che deve funzionare in entrambi:

| | JavaScript (browser) | Python (terminale) |
|---|---|---|
| `viz start` / `viz stop` | sì | sì |
| `record the script … giving …` | sì | sì |
| `@viz start` arma il proprio script | sì | no |
| `record this run`, `save the recording to <path>` | sì | no |
| il file flag (`thermostat.allspeak.record`) | no | sì |
| `allspeak --record=<path>` | non applicabile | sì |

Il ciclo di controllo del runtime Python è un file che un processo può notare; quello del browser è un'applicazione il cui registratore va agganciato dall'esterno prima che il suo primo marcatore venga eseguito. Ogni runtime ha la forma che gli si addice, e nessuno dei due ha ancora quella dell'altro.

## Lo script, senza eseguirlo

Una registrazione ha bisogno di un'esecuzione. L'altra domanda — *di cosa è fatto questo script?* — non ne ha bisogno:

```as
    model the script in Path as Source giving Model
```

Questo riferisce le **ancore** dello script: i punti in cui il flusso di controllo non è semplicemente la riga successiva — etichette, test dei `while`, e i punti in cui si entra in un gestore di eventi — insieme a quanto basta del grafo di flusso per dire se ogni ancora sia raggiungibile. Nulla viene eseguito e nulla viene disegnato; è ciò che dice alla vista Blocks del visualizzatore quali sezioni nessuno entra e quali righe una finestra `viz` potrebbe coprire.

## Vedi anche

- [Comandi dell'ambiente di sviluppo](dev-environment.md) — `browse`, `system` e `download`, le parole chiave del runtime Python che usa uno script di avvio.
- [Fare il debug di .allspeak](debugging-as.md) — gli strumenti più economici: `log`, `print` e il tracer.
- [Multilingue](multilingual.md) — `@` non è una parola, e nemmeno il vocabolario dei marcatori viene tradotto: `viz`, `start`, `stop` e le opzioni si scrivono allo stesso modo in ogni lingua.
- [Lavorare con l'AI](working-with-ai.md) — dove una registrazione si inserisce nel ciclo «l'AI scrive, l'umano rilegge».
- `spec/viz-trace-format.md` nel repository — il formato del file, campo per campo.
