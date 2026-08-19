# REST e asincrono

## Problema

Devi parlare con un endpoint HTTP: recuperare un blob di configurazione, inviare un form, tirare giù una lista di record. La chiamata può fallire; lo script deve gestirlo, e deve tenere reattivo il resto dell'applicazione mentre aspetta.

## Le forme di base

```as
rest ottieni Result da `/api/users` o vai a FetchFailed
rest invia Payload a `/api/users` o vai a PostFailed
rest put Payload a `/api/users/42` o vai a PutFailed
rest delete da `/api/users/42` o vai a DeleteFailed
```

Tutti e quattro accettano una clausola di fallimento opzionale. Il corpo di una risposta GET finisce in una variabile (il primo argomento); il corpo di una POST o PUT è un valore che viene inviato.

`Result` di solito arriva come una stringa a forma di JSON, pronta per essere ispezionata con l'accesso `proprieta`, `elemento` o `voce` (vedi [collezioni](../reference/collections.md)).

## Gestire i fallimenti

Due clausole, due intenti — vedi [errori e recupero](../reference/errors-and-recovery.md):

- `o` per «segnala e abbandona» — il thread si ferma dopo il corpo della clausola.
- `on failure` per «sostituisci e continua» — l'esecuzione prosegue.

```as
rest ottieni Config da `/api/config`
    o inizio
        stampa `Server non raggiungibile: ` cat l errore
        vaisub UseLocalConfig
    fine
! mai raggiunto se la chiamata fallisce
```

```as
rest ottieni Config da `/api/config`
    on failure imposta Config a `{}`
stampa Config       ! sempre raggiunto; Config è o recuperato o vuoto
```

## Cedere il controllo durante l'attesa

`rest ottieni` e i suoi fratelli bloccano il thread corrente finché non arriva la risposta, ma il runtime continua a smistare gli altri thread. L'interfaccia resta reattiva, i gestori di eventi scattano ancora, i thread biforcati girano ancora.

Se devi fare lavoro in parallelo con un recupero lungo — mostrare uno spinner, animare qualcosa — genera un thread separato prima della chiamata:

```as
biforca a Spinner
rest ottieni Data da `/api/slow-endpoint` o vai a FetchFailed
svuota Spinning
! ... usa Data ...

Spinner:
    imposta Spinning
    mentre Spinning inizio
        ! ... avanza il frame dello spinner ...
        attendi 50 millis
    fine
    ferma
```

Il thread principale si blocca su `rest ottieni`; il thread dello spinner continua a ciclare perché il runtime gli dà i suoi turni a ogni `attendi`. Quando arriva la risposta, il thread principale riprende e svuota il flag, lo spinner se ne accorge al prossimo `attendi` e si ferma.

## Iterazione lato server vs iterazione lato script

Quando recuperi una raccolta, preferisci lasciare che sia il server a filtrare e impaginare dove possibile. Uno script che fa:

```as
rest ottieni All da `/api/items` o ferma
! ... poi scorre All, scegliendo i 5 che l'utente vuole davvero
```

costringe il server a mandare tutto e la rete a trasportarlo. Se l'API supporta i parametri di query:

```as
rest ottieni Subset da `/api/items?limit=5&category=Books` o ferma
```

Il principio: fai il lavoro dove vivono i dati. Ricorri all'iterazione lato script solo quando il server non può aiutarti.

## Inviare un dizionario

Costruisci il payload come variabile a forma di JSON e passalo a `rest invia`:

```as
variabile Payload
imposta Payload a oggetto
imposta proprieta `name` di Payload a NameField
imposta proprieta `email` di Payload a EmailField

rest invia Payload a `/api/users`
    o inizio
        stampa `Registrazione fallita: ` cat l errore
        ferma
    fine
```

Il runtime serializza il payload in JSON per la trasmissione. Vedi [scegliere la forma di una raccolta](picking-a-collection-shape.md) per la regola «un dict per direzione».

## Anti-pattern: polling senza cedere il controllo

```as
mentre non Ready inizio
    rest ottieni Status da `/api/status` o ferma
    ! ... controlla Status ...
fine
```

Questo martella il server a ogni iterazione del ciclo. Aggiungi un `attendi` tra un controllo e l'altro per limitare la frequenza:

```as
mentre non Ready inizio
    rest ottieni Status da `/api/status` o ferma
    ! ... controlla Status ...
    attendi 1 secondo
fine
```

Per attese più lunghe, preferisci la push lato server (WebSocket, sottoscrizione MQTT, eventi inviati dal server) al polling — vedi [MQTT pub/sub](mqtt-pubsub.md) per il pattern push canonico di AllSpeak.

## Anti-pattern: fallimento silenzioso su carichi critici

```as
rest ottieni Config da `/config.json` on failure imposta Config a `{}`
! ... lo script prosegue con una configurazione vuota ...
```

Se Config è critico, `on failure imposta a vuoto` lascia girare lo script con assunzioni rotte ovunque a valle. Usa `o` e interrompi, oppure `on failure` più una modalità degradata chiaramente registrata nei log. Non nascondere il problema.

## Correlati

- [errori e recupero](../reference/errors-and-recovery.md) — `o` vs `on failure`.
- [collezioni](../reference/collections.md) — i payload a forma di JSON.
- [multitasking cooperativo](../reference/cooperative-multitasking.md) — `biforca` e `attendi`.
- [MQTT pub/sub](mqtt-pubsub.md) — push invece di polling.
