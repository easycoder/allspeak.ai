# Il server come applicazione

## Problema

Un tipico progetto GUI AllSpeak produce due artefatti con cui l'utente interagisce: il **visualizzatore** (`viz.html`) e una o più pagine di progetto (`<progetto>.html`). Trattati come cose separate, arrivarci significa avviare un server di sviluppo in un terminale, aprire un URL in una scheda e un altro in una seconda scheda, e ricordare la porta — quattro passi e tre pezzi di stato mentale per quello che concettualmente è una sola cosa in esecuzione.

La cornice più semplice: **il server è l'applicazione, e il browser è la sua interfaccia.**

## Lo schema

**Un comando per una persona; `server` per una sessione con più schede.** `allspeak viz` è la porta d'ingresso:

```
allspeak viz
allspeak viz 9000
```

Chiede alla rotta `/version` del server — la sua rotta — se su quella porta c'è già un server di sviluppo. Se c'è, apre il visualizzatore e lascia in pace quello in esecuzione; se non c'è nulla, avvia il server in questo terminale e apre il visualizzatore appena il suo gestore delle richieste è registrato. La porta predefinita è 8080.

`allspeak server {port}` è lo stesso server senza aprire nulla — quello che serve quando si vogliono aprire più pagine da soli:

```
allspeak server
```

La pagina del progetto è allora un URL — `http://localhost:<port>/<progetto>.html` — e nel visualizzatore è il pulsante **Launch**, che apre la pagina che uno script nomina con `@app` e, per un progetto GUI, registra l'esecuzione.

## Scrivere un launcher proprio

Se un progetto vuole un launcher proprio invece della parola della CLI, la forma è in quattro fasi ordinate:

1. **Analizza gli argomenti della riga di comando.** Cicla su `argc` / `arg N`, prendi la porta e annota le pagine da aprire.
2. **Avvia il server.** `start MyServer on port Port` accetta la porta ma non ha ancora un gestore.
3. **Registra il gestore delle richieste.** `on MyServer request inizio … fine` imposta il PC del gestore e salta oltre il corpo.
4. **Apri le pagine.** Costruisci ogni URL e chiama `browse` su di essa.

L'ordine è portante: le fasi 3 e 4 devono stare in quest'ordine. Se `browse` viene eseguito prima del blocco del gestore, le pagine appena aperte corrono contro il server e prendono un 503 «Server handler not ready» prima che il gestore sia installato. La soluzione è mettere il ciclo di apertura alla *fine* dello script, dopo il blocco `on … request inizio … fine`.

```
    start Files on port Port

    on Files request
    inizio
        ! ... gestisci le richieste ...
    fine

    ! Dopo la registrazione del gestore — mai prima.
    if PageList is not empty
    inizio
        split PageList on `,`
        put 0 into PageIndex
        while PageIndex is less than the elements of PageList
        inizio
            index PageList to PageIndex
            put PageList into PageName
            if PageName is not empty
            inizio
                put `http://localhost:` cat Port cat `/` cat PageName cat `.html` into PageUrl
                browse PageUrl
            fine
            increment PageIndex
        fine
    fine
```

L'implementazione di riferimento è `server.allspeak`, che fa esattamente questo per il visualizzatore quando la CLI gli passa `--viz`.

## Quando lo schema si guadagna il suo posto

- **Progetti GUI**, dove l'utente ha bisogno del visualizzatore e di una pagina di progetto — un comando, e la pagina è a un URL o a un clic su Launch.
- **Progetti CLI** dove l'utente può volere anche il visualizzatore per modificare nel browser. `allspeak viz` da solo basta; il server serve comunque i file del progetto.
- **Applicazioni multi-pagina**, dove un launcher proprio apre due o tre pagine insieme.

## Quando non se lo guadagna

- **Per un'applicazione distribuita.** Gli utenti in produzione non avvieranno `server.allspeak`. Questo è solo per il flusso di sviluppo.
- **Quando lo script non avvia alcun server.** `browse` funziona da solo, ma la cornice presuppone pagine da servire.
- **Per un avvio estemporaneo.** Digita l'URL nel browser. Lo schema guadagna la sua complessità quando l'avvio si ripete.

## Modello mentale per gli agenti IA

Quando a un'IA viene chiesto di creare un progetto GUI con lo starter pack, la sequenza attesa è:

1. Generare `<progetto>.html`, `<progetto>-main.allspeak`, `<progetto>.json`.
2. Eseguire `python3 asdoc-check.py --write` su ogni nuovo file `.allspeak`.
3. **Non avviare il server da solo.** L'utente l'ha avviato con `allspeak viz` prima di lanciarti, e il visualizzatore è già aperto.
4. Di' all'utente che la pagina del suo progetto è a `http://localhost:8080/<progetto>.html`, accanto al visualizzatore.

L'utente deve sentire che «l'applicazione è partita» — non che deve montare tre pezzi di infrastruttura per vedere quello che è appena stato costruito.
