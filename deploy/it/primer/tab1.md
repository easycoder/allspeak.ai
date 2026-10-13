# Programmare senza programmare

Probabilmente hai sentito parlare del *vibe coding* — dici a un'AI cosa vuoi e lei scrive il software. Sembra magia, e a volte lo è. Ma c'è un problema: il linguaggio in cui scrive è JavaScript, o Python, o qualcos'altro con parentesi e punti e virgola, e se non lo leggi già non hai modo di capire se il lavoro è stato fatto bene. Ti fidi dell'AI, e quando qualcosa si rompe — e succederà — sei bloccato.

Imparare a programmare davvero è l'altra strada, e passano mesi prima della prima cosa utile. La maggior parte delle persone non ha tutto quel tempo.

AllSpeak sta in mezzo. È un linguaggio di scripting che si legge come italiano — o come inglese, francese o tedesco: la stessa runtime esegue tutte e quattro, ciascuna con la propria sintassi naturale.

## Come si presenta?

Ecco un esempio reale:

```
    language it

    variabile Saluto
    metti `Ciao!` in Saluto
    registra Saluto
```

Niente parentesi, niente punto e virgola, nessun mistero. Se sai leggere una frase, puoi leggere AllSpeak.

## Non è un giocattolo

AllSpeak costruisce software vero. Applicazioni web con pagine interattive e layout stilizzati. Strumenti da riga di comando che comunicano con API, elaborano dati e gestiscono file. Applicazioni multi-schermo con navigazione, moduli e input utente. Connessioni in tempo reale tramite REST e MQTT. Funziona in qualsiasi browser (la versione JavaScript) o dal terminale (la versione Python) — o entrambi insieme.

Il segreto è che all'AI non importa in quale linguaggio scrive. Dagli un linguaggio ad alto livello capace e fornirà le stesse funzionalità che darebbe in JavaScript — ma in una forma che puoi effettivamente leggere, controllare e modificare.

## E c'è uno strumento che sa già tutto questo

Questa è la parte che gli altri linguaggi non ti danno, ed è per questo che abbiamo scritto **Viz** — l'editor di AllSpeak, che il comando `allspeak viz` apre.

Viz non è un editor generico che si trova a supportare AllSpeak. Conosce il linguaggio, ed è proprio questo che gli permette di mostrarti un unico file in tre modi, nessuno dei quali richiede un secondo file o un secondo strumento:

- **Come testo.** Tutto lo script, con le parole evidenziate — e con il compilatore del linguaggio dietro, così può controllare quello che stai guardando senza uno step di build. Il meno notevole dei tre, e quello che condivide con ogni altro editor.
- **Come blocchi**, che cambia il modo in cui leggi uno script. Smette di essere un muro di testo e diventa una serie di sezioni: una breve nota nelle parole di chi l'ha scritta, accanto al codice che descrive, con l'elenco delle sezioni sul lato per passare dall'una all'altra. Leggi la nota, e il codice di cui parla è proprio lì. Funziona perché la prosa è *nel file*, scritta nella sintassi dei commenti del linguaggio — e non in un documento separato da tenere allineato con esso.
- **Come immagine di un'esecuzione**: quali parti del programma sono state raggiunte, in quale ordine e quante volte. Ogni esecuzione viene conservata come file e può quindi essere riaperta più tardi — da te o da qualcun altro, su una macchina che non sa nemmeno eseguire il codice.

Queste tre cose altrove sarebbero tre prodotti: un generatore di documentazione, un debugger o un profiler, un report di copertura — ciascuno con le proprie convenzioni, e nessuno obbligato a essere d'accordo con il sorgente. Qui il linguaggio porta già la prosa e i marcatori: sono quindi **viste di un unico file** invece di cose distinte da tenere allineate.

Uno stack trace ti dice che un programma è fallito. Un log è qualcosa che hai scelto di scrivere. Una registrazione è l'esecuzione stessa — e persino i suoi marcatori, `viz start` e `viz stop`, sono parole chiave ordinarie: uno script che li porta si esegue esattamente come senza, e non c'è nessuna «build di debug» da mantenere accanto a quella vera.

## Cosa fai davvero

Non scrivi il codice. Descrivi a un agente quello che vuoi — Claude Code, Reasonix, o quello che già usi — e lui scrive l'AllSpeak. Il tuo compito è leggere quello che ha scritto e dire se è giusto.

È per questo che il linguaggio è così semplice, e per questo ogni sezione di uno script porta una breve nota in linguaggio chiaro, scritta dall'AI, che dice cosa intendeva. Stai rileggendo l'*intenzione*, non codice da decifrare.

**Poi: la scheda Iniziare.** Prepara un progetto e ne costruisce uno con te, in circa cinque minuti.
