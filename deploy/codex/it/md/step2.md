# Aritmetica di base #
~ec~ è progettato per il web: per costruire app che fanno cose in un browser. Il mondo del browser è principalmente visuale, con molte immagini e testo, ma c'è sempre bisogno di un po' di aritmetica di base, quindi scriveremo un paio di script che illustrano ciò che è disponibile.

Nella maggior parte dei linguaggi di programmazione, se vuoi sommare dei numeri, il risultato assomiglia all'algebra scolastica:

~pre:Z = X + Y~

ma non è così che lo esprimeresti a parole, parlando o scrivendo. Piuttosto, potresti dire

~pre:add X to Y giving Z~

dove ~code:giving~ è un'abbreviazione per "e metti il risultato in".

In effetti, è esattamente così che ~ec~ lo fa. Qui stai sommando i valori X e Y e mettendo il risultato in una variabile chiamata Z.

Le parole ~code:value~ e ~code:variable~ hanno significati specifici. Un ~code:value~ (valore) è qualsiasi cosa che puoi misurare o contare, come automobili o centesimi o giorni. A ~ec~ non importa cosa siano; sa solo che hai un mucchio X e un mucchio Y e vuoi sommarli insieme in un mucchio Z.

Una ~code:variable~ (variabile) è qualcosa di un po' più specifico; è un contenitore dove qualcosa viene conservato. Il tuo portafoglio contiene denaro con un certo valore, quindi anche il portafoglio ha quel valore. Una moneta da un euro, d'altra parte, ha un valore specifico ma non può contenere altre cose, quindi non può essere una variabile. Tutto questo significa che nella somma sopra, X e Y possono essere sia valori che variabili (che contengono valori), ma Z non può essere un semplice valore; deve essere una variabile perché ci stiamo mettendo qualcosa (la somma di X e Y).

Una variante di questa somma è quando vuoi aggiungere il valore X a ciò che è già in Y. L'operazione è più semplice:

~pre:add X to Y~

Anche qui, X può essere qualsiasi valore ma Y deve essere una variabile.

Naturalmente, l'aritmetica non è solo addizione. Ci sono anche sottrazione, moltiplicazione e divisione. Ecco come appaiono tutte:

~pre:add X to Y          add X to Y giving Z
take X from Y       take X from Y giving Z
multiply Y by X     multiply Y by X giving Z
divide Y by X       divide Y by X giving Z~
Nota che nella colonna di sinistra, moltiplicazione e divisione funzionano al contrario rispetto ad addizione e sottrazione, con il risultato dell'operazione (Y) come primo elemento, non il secondo. A differenza di praticamente tutti gli altri linguaggi, ~ec~ segue il modo in cui si esprime in inglese, per renderlo più naturale per gli utenti.

Anche se ho usato solo X e Y, puoi fare aritmetica anche con i numeri:

~pre:add 4 to X
take 3 from 13 giving Y~

e così via. A questo punto iniziamo a programmare. Copia questo codice nell'editor:

~step~
~copy~

Nel comando alert vedrai la parola ~code:cat~ usata per 'concatenare' 2 stringhe insieme. A parte questo, spero che sia tutto facile da seguire anche se sei completamente nuovo alla programmazione.

Se in qualsiasi momento vuoi informarti su un comando specifico, clicca il pulsante  in cima a questo pannello e verrai portato al Manuale di Riferimento per Programmatori di ~ec~. Devi selezionare un pacchetto — la maggior parte dei comandi che useremo sono in Core o Browser — e scegliere Commands, Values o Conditions. C'è un elenco a discesa di tutte le parole chiave in quella sezione. Clicca il pulsante **Tutorial** per tornare qui quando hai finito.

~next:Gestione delle stringhe~