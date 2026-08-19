# Errori e recupero

Alcuni comandi di AllSpeak possono fallire a runtime: `rest ottieni` può non raggiungere il proprio endpoint, `load` può non trovare il file, `esegui` può non trovare il modulo. Questi comandi accettano una clausola di fallimento opzionale che viene eseguita se l'operazione non riesce.

Se un comando può fallire e tu non alleghi nessuna clausola, il thread termina con un errore a runtime.

Esistono due clausole di fallimento — `o` e `on failure` — con la stessa sintassi esterna ma un comportamento diverso dopo la clausola. La scelta esprime che cosa deve succedere dopo.

## `o` — esegui e ferma

`o <istruzione>` dopo un comando che può fallire esegue l'istruzione in caso di fallimento, poi ferma il thread:

```as
rest ottieni Strings da `/strings.json` o vai a StringsFailed
```

Se la chiamata riesce, l'esecuzione prosegue con l'istruzione successiva. Se fallisce, il corpo di `o` viene eseguito e il thread termina. Il corpo può essere una singola istruzione o un blocco `inizio … fine`:

```as
rest ottieni Config da `/config.json`
    o inizio
        stampa `Impossibile caricare la configurazione`
        vaisub Cleanup
    fine
```

Usa `o` per i fallimenti irreversibili: lo script non può continuare utilmente, quindi la clausola fa pulizia e si ferma.

## `on failure` — esegui e continua

`on failure <istruzione>` dopo un comando che può fallire esegue l'istruzione in caso di fallimento, poi riprende l'esecuzione dall'istruzione successiva:

```as
load Content from Filename
on failure imposta Content a vuoto
stampa Content
```

Se `load` riesce, `stampa` mostra il contenuto caricato. Se fallisce, `on failure` imposta un valore predefinito e `stampa` mostra la stringa vuota. In ogni caso, l'esecuzione prosegue.

Usa `on failure` quando ti aspetti che il fallimento sia recuperabile: lo script sostituisce un valore predefinito sensato e va avanti.

## Fianco a fianco

La stessa istruzione di recupero si comporta in modo diverso a seconda della clausola:

```as
! forma `o`
load Content from Filename o imposta Content a vuoto
stampa Content                                ! NON viene eseguito in caso di fallimento

! forma `on failure`
load Content from Filename
on failure imposta Content a vuoto
stampa Content                                ! viene eseguito in caso di fallimento
```

Scegli la forma che corrisponde a quello che vuoi che succeda dopo: `o` per «segnala e abbandona», `on failure` per «sostituisci e continua».

## Leggere l'errore

Dentro l'una o l'altra clausola, `l errore` (o la forma più lunga `l errore messaggio`) è un valore che contiene la stringa dell'errore a runtime:

```as
rest ottieni Config da `/config.json` o inizio
    stampa `Caricamento fallito: ` cat l errore
    vaisub Cleanup
fine
```

## Quali comandi possono fallire

I comandi che possono fallire sono operazioni di tipo I/O; le forme inglesi nell'elenco (`read`, `write`, `save`, `rest put`, `rest delete`, `mqtt publish`, `mqtt subscribe`) non sono ancora tradotte:

- `rest ottieni`, `rest invia`, `rest put`, `rest delete`
- `read` (file)
- `write` (file)
- `load` (file / URL)
- `save` (file)
- `esegui` (caricamento di un modulo)
- `mqtt publish`, `mqtt subscribe`

I domini e i plugin possono aggiungere proprie operazioni che possono fallire: controlla il pacchetto linguistico corrispondente. Le operazioni puramente Core (`imposta`, `aggiungi`, `moltiplica`, `se`, `mentre`) non hanno modalità di fallimento a runtime: sono valide (riescono) o invalide (errore di compilazione).

## Anti-pattern: ignorare un fallimento

```as
rest ottieni X da URL    ! nessuna clausola: il thread termina in caso di fallimento
```

Se il comando può fallire e non hai stabilito che cosa fare, il thread termina. Per i prototipi a volte va bene. Per il codice in produzione, allega una clausola e decidi che cosa intendi.

## Anti-pattern: recupero silenzioso

```as
load Config from `/config.json` on failure imposta Config a `{}`    ! continua in silenzio
```

Sostituire un valore predefinito senza registrarlo nei log nasconde i veri fallimenti (interruzioni di rete, errori del server) dietro un codice che sembra funzionare. Se un valore predefinito è accettabile, registra la sostituzione almeno una volta, così il problema non resta invisibile.

## Vedi anche

- [controllo di flusso](control-flow.md) — `ferma`, `vai a`, le destinazioni che usa tipicamente una clausola `o`.
- [struttura](structure.md) — quale dominio possiede quale comando che può fallire.
- [REST e asincrono](../idioms/rest-and-async.md) — i modelli tipici per REST.
