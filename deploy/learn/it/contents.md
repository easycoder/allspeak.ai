# Corso AllSpeak

> **Traduzione in corso** — questo corso è una prima traduzione, non ancora revisionata da un madrelingua. Se noti un errore, segnalalo nelle [issue GitHub](https://github.com/easycoder/allspeak.ai/issues).

Una guida pratica per scrivere un AllSpeak idiomatico. Due livelli :

- **Riferimento** risponde a *che cos'è questa cosa in AllSpeak ?* — simboli, variabili, flusso di controllo, moduli. Stabile, enciclopedico.
- **Idiomi** risponde a *come si fa X alla maniera di AllSpeak ?* — modelli con esempi lavorati e anti-modelli espliciti.

Vedi [README.md](../README.md) per come consultare questo corso e come aggiungere o modificare una pagina.

## Riferimento

1. [Struttura](reference/01-structure.md) — i domini, il modello « il compilatore prova ogni dominio », come le estensioni arricchiscono il vocabolario.
2. [Simboli e layout](reference/02-symbols-and-layout.md) — i quattro simboli di punteggiatura ; i marcatori dei blocchi di documentazione ; l'indentazione e i nomi.
3. [Variabili e array](reference/03-variables-and-arrays.md) — il modello del cursore ; le variabili di lavoro ; `variabile` vs tipizzato.
4. [Collezioni](reference/04-collections.md) — array, dizionari, liste, proprietà ; divergenza JS/Python.
5. [Valori e tipi](reference/05-values-and-types.md) — numeri, stringhe, booleani ; conversione automatica.
6. [Condizioni](reference/06-conditions.md) — uguaglianza, confronto, presenza ; combinazione con `e` / `o`.
7. [Aritmetica](reference/07-arithmetic.md) — modello intero-prima ; il modello degli interi scalati ; trigonometria.
8. [Stringhe e testo](reference/08-strings-and-text.md) — `lunghezza di`, affettamento, `posizione di`, `sostituisci`.
9. [Flusso di controllo](reference/09-control-flow.md) — `se`, `mentre`, `vaisub` con parametri, `metti parametro`, `stack`, `ferma`, `esci`.
10. [Errori e recupero](reference/10-errors-and-recovery.md) — `o` (arresto) vs `on failure` (continua).
11. [Multitasking cooperativo](reference/11-cooperative-multitasking.md) — `biforca`, `attendi`, mai interrotto a metà istruzione.
12. [Moduli](reference/12-modules.md) — `esegui`, `release parent`, passaggio di messaggi.
13. [Plugin](reference/13-plugins.md) — il contratto ; il principio di prestazione della pila mista.
14. [Browser e Webson](reference/14-browser-and-webson.md) — tipi DOM, `attacca`, il dialetto di layout Webson.
15. [Multilingua](reference/15-multilingual.md) — la direttiva `language` e il modello dei pacchetti.
16. [Blocchi di documentazione](reference/16-doc-blocks.md) — la convenzione `!!` / `!!!` ; `asdoc-check`.
17. [Comandi dell'ambiente di sviluppo](reference/17-dev-environment.md) — `system`, `download`, `browse` del runtime Python per shell, recupero e apertura di schede.
18. [JSON](reference/18-json.md) — `save` codifica automaticamente dict/liste ; `accoda … al file json` ; `json di` per l'analisi ; la riserva della cartella padre.

## Idiomi

1. [`cat` e costruzione di stringhe](idioms/01-cat-and-string-building.md) — `cat` infisso, modelli di modello, il tranello dell'analisi golosa.
2. [Gestori di eventi e indice di array](idioms/02-event-handlers-and-array-index.md) — un unico gestore per un array di elementi.
3. [Modelli di ciclo](idioms/03-looping-patterns.md) — `mentre` vs cicli guidati da etichette.
4. [Scegliere la forma di una raccolta](idioms/04-picking-a-collection-shape.md) — variabile-array vs dict vs lista vs proprietà.
5. [Numeri a virgola mobile e interi scalati](idioms/05-floats-and-scaled-integers.md) — precisione frazionaria senza virgola mobile.
6. [REST e asincrono](idioms/06-rest-and-async.md) — `rest ottieni`, clausole di errore, resa del controllo durante l'attesa.
7. [MQTT pub/sub](idioms/07-mqtt-pubsub.md) — il blocco di connessione, i payload a forma di dict, richiesta/risposta.
8. [Separazione Webson e AS](idioms/08-webson-and-as-separation.md) — il layout in `.json`, la logica in `.as`.
9. [Estrarre un modulo](idioms/09-extracting-a-module.md) — quando e come suddividere uno script.
10. [Scrivere in linguaggio neutro](idioms/10-writing-language-neutral.md) — ciò che il pacchetto linguistico non traduce.
11. [Debug di .as](idioms/11-debugging-as.md) — `stampa`, `registra`, tracciatore, `nulla`.
12. [Lavorare con l'IA](idioms/12-working-with-ai.md) — il flusso di lavoro « l'IA scrive, l'umano rilegge ».
13. [Il server come applicazione](idioms/13-server-as-application.md) — eseguire `server.as -t edit,<progetto>` perché il server *sia* l'applicazione e le schede del browser siano la sua interfaccia.
