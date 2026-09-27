# Strumenti e Tecniche di AllSpeak #

## Plugin ##
Il linguaggio standard di ~ec~ include un'ampia gamma di costrutti di programmazione generici necessari a qualsiasi linguaggio: variabili, valori, condizioni, stringhe, numeri e così via. Tutto il resto è fornito dai plugin. Alcuni di questi, in particolare le funzionalità del browser, JSON e REST, vengono caricati automaticamente (anche se questo comportamento può essere modificato se necessario) e diversi altri sono disponibili come plugin opzionali. I plugin aggiungono comandi al linguaggio e devono essere caricati prima che qualsiasi script che utilizza quelle parole chiave possa essere compilato.

Il meccanismo per richiedere un plugin è molto semplice. Supponiamo che tu voglia includere una mappa di Google nella tua pagina web. Avrai bisogno del plugin ~code:gmap~, che si carica così, dove i file di ~ec~ sono tutti in una cartella di primo livello `allspeak`:

~pre:require js `allspeak/plugins/gmap.js`~

In questo esempio il plugin è uno standard di ~ec~ ma puoi anche caricare plugin di terze parti da qualsiasi URL, gestendo le questioni CORS.

Una volta caricato, il plugin è disponibile per qualsiasi script che ne abbia bisogno (ma non per quello che lo ha caricato). Qui, qualsiasi script che includa comandi per le mappe può essere caricato e compilato, come in

~pre:rest get Script from `/resources/ecs/myscript.allspeak`
run Script~

(Questa è la forma più semplice, che presuppone che non tu debba comunicare con lo script una volta in esecuzione.)

Dovrebbe essere abbastanza ovvio che quando i plugin vengono usati in questo modo, il codice che vuoi eseguire deve trovarsi in uno script separato che viene caricato ed eseguito _dopo_ che il plugin è pronto. Un'alternativa è dichiarare il plugin globalmente nel punto in cui ~ec~ si avvia. Nella cartella allspeak di primo livello c'è un file chiamato ~code:plugins.js~, che ti permette di specificare quali plugin devono essere caricati all'avvio e quali saranno disponibili per il caricamento su richiesta. Questo rallenterà leggermente il caricamento iniziale della pagina, ma in pratica la differenza è molto piccola.
