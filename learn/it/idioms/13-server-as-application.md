# Il server come applicazione

## Problema

Un tipico progetto GUI AllSpeak produce due artefatti con cui l'utente interagisce: un editor basato sul browser (`edit.html`) e una o più pagine di progetto (`<progetto>.html`). Trattati come artefatti separati, l'utente deve avviare un server di sviluppo in un terminale, aprire l'URL dell'editor in una scheda, aprire l'URL del progetto in un'altra scheda e ricordarsi la porta. Sono quattro passaggi e tre pezzi di stato mentale per ciò che concettualmente è un'unica cosa in esecuzione.

Il quadro più semplice: **il server è l'applicazione, e le schede del browser sono la sua interfaccia.** L'utente esegue un solo comando; le schede si aprono da sole; chiudere il server chiude l'app.

## Il pattern

`server.as` accetta un flag `-t` / `--tabs` il cui valore è una lista di nomi di pagine separati da virgole (senza `.html`):

```
allspeak server.as -t edit,<progetto>
allspeak server.as --tabs edit,<progetto> 8080
```

Per ogni nome, il server costruisce `http://localhost:<porta>/<nome>.html` e lo apre nel browser predefinito dell'utente tramite [`browse`](../reference/17-dev-environment.md#browse). La porta predefinita è 8080 e può comparire prima o dopo il flag.

La convenzione di lancio negli starter pack è eseguire questo comando in background appena i file di outline dell'interfaccia esistono, così l'utente vede un'unica app prendere vita invece di tre passaggi separati.

## Anatomia di uno script lanciatore

Un lanciatore che usa questo pattern ha quattro fasi ordinate:

1. **Analizza gli argomenti della CLI.** Cicla su `argc` / `arg N`, riconosci il flag, tratta qualsiasi altra cosa come la porta.
2. **Avvia il server.** `start MyServer on port Port` accetta la porta ma non ha ancora un gestore.
3. **Registra il gestore delle richieste.** `on MyServer request inizio … fine` imposta il PC del gestore e salta oltre il corpo.
4. **Apri le schede.** Dividi la lista separata da virgole, costruisci ogni URL, chiama `browse` su di esso.

L'ordine è portante: le fasi 3 e 4 devono stare in quest'ordine. Se `browse` gira prima del blocco del gestore, le schede appena aperte fanno la corsa con il server e beccano un 503 «Server handler not ready» prima che il gestore sia installato. La soluzione è mettere il ciclo di apertura delle schede alla *fine* dello script, dopo il blocco `on … request inizio … fine`.

```
    start Files on port Port

    on Files request
    inizio
        ! ... gestisci le richieste ...
    fine

    ! Dopo la registrazione del gestore — mai prima.
    se TabList non è vuoto
    inizio
        dividi TabList su `,`
        metti 0 in TabIndex
        mentre TabIndex è minore di gli elementi di TabList
        inizio
            indice TabList a TabIndex
            metti TabList in TabName
            se TabName non è vuoto
            inizio
                metti `http://localhost:` cat Port cat `/` cat TabName cat `.html` in TabUrl
                browse TabUrl
            fine
            incrementa TabIndex
        fine
    fine
```

L'implementazione di riferimento completa è `server.as` negli starter pack.

## Quando usare questo pattern

- **Progetti GUI** in cui l'utente ha bisogno sia dell'editor sia di una pagina di progetto aperta. Il default nel `CLAUDE.md` degli starter pack è lanciare con `-t edit,<progetto>`.
- **Progetti CLI** in cui l'utente potrebbe volere anche l'editor per modificare lato browser. Lancia con `-t edit` da solo — il server continua a servire i file del progetto, ma nessuna scheda di pagina di progetto viene aperta di default.
- **App multi-pagina** in cui due o tre pagine vengono sempre aperte insieme. Elencale tutte nel flag.

## Quando *non* usare questo pattern

- **Per un'app distribuita.** Gli utenti in produzione non eseguiranno `server.as`. Questo pattern è solo per il flusso di sviluppo.
- **Quando lo script non fa girare un server.** `browse` funziona da solo, ma la cornice server-come-app ha senso solo quando ci sono pagine da servire.
- **Per lanci ad hoc usa-e-getta.** Digita semplicemente l'URL nel browser. Il pattern merita la sua complessità quando il lancio è ripetuto.

## Modello mentale per gli agenti IA

Quando a un'IA viene chiesto di creare un progetto GUI con lo starter pack, la sequenza attesa è:

1. Genera `<progetto>.html`, `<progetto>-main.as`, `<progetto>.json`.
2. Esegui `python3 asdoc-check.py --write` su qualsiasi nuovo file `.as`.
3. Esegui **subito** `allspeak server.as -t edit,<progetto>` in background.
4. Di' all'utente che l'app è partita e che dovrebbero essersi aperte due schede.

L'utente deve avere la sensazione che «l'app è partita» — non che debba assemblare tre pezzi di infrastruttura per vedere ciò che è appena stato costruito.
