# Animazione semplice #
Questo è un altro strumento nella cassetta degli attrezzi del programmatore. Anche se si può facilmente esagerare, la giusta quantità di movimento dà vita a una pagina web e dirige l'attenzione dell'utente verso le parti fondamentali.

Questo esempio disegna 3 cerchi colorati e li accende e spegne in rapida successione. Ho scelto questo esempio per mettere in evidenza alcune utili tecniche di programmazione e introdurre un po' più di CSS.

Da questo punto in poi alcuni esempi diventano piuttosto lunghi, quindi non li riprodurremo qui. Invece, clicca il pulsante qui sotto per caricare l'esempio nell'editor:

~copy~

Quando hai cose simili da fare su diversi oggetti, il tuo codice inizia a diventare ripetitivo. La ripetizione è un male perché se devi cambiare qualche caratteristica fondamentale devi farlo in tutti i punti in cui compare. E naturalmente, più codice c'è, più posti ci sono in cui possono insinuarsi errori (bug) per semplici refusi.

Un buon modo per evitare questo è usare gli array. Un array è una variabile che ha valori multipli. Come un sistema di cassette postali a scomparti, dove le cassette sono tutte uguali ma hanno contenuti diversi.

Nella maggior parte dei linguaggi di programmazione, gli array usano le parentesi quadre per indicare cosa sta succedendo. Quindi, per accedere al terzo elemento dell'array ~code:data~ vedresti

~code:data[3]~

~ec~ non ama i simboli, usandone il meno possibile per mantenere le cose il più vicino possibile all'inglese naturale. Avremmo potuto sostituire questo con

~code:the third element of Data~

ma è piuttosto macchinoso, quindi abbiamo adottato un approccio più pulito. In ~ec~ tutte le variabili sono array ma la maggior parte di esse ha un solo elemento. Hanno anche un valore interno che punta all'elemento corrente. Se ce n'è solo uno, il puntatore contiene zero. (In informatica, il primo elemento di qualsiasi cosa è 0, non 1). Puoi richiedere quanti elementi vuoi per un array, e il puntatore interno — chiamato _indice_ — va da 0 fino a 1 in meno rispetto al numero di elementi nell'array.

In questo script ho aggiunto alcune righe di commento per aiutarti a vedere dove vengono fatte le cose. Non hanno alcun effetto sul programma.

Alla riga 11 richiediamo 3 elementi per l'array ~code:Button~. Questi saranno indirizzati come indice 0, 1 e 2. Poi abbiamo un ciclo che si ripete 3 volte, incrementando il contatore ~code:N~ ogni volta. 'Indicizziamo' il pulsante al valore di ~code:N~ così l'array presenta ciascuno degli elementi a turno, e facciamo tutte le cose che sono uguali per tutti i pulsanti. Queste sono:

- La larghezza e l'altezza.
- Un margine su ogni lato che li tiene separati.
- Il raggio del bordo. I pulsanti sono rettangolari per impostazione predefinita; questo dà loro angoli arrotondati. Usando il valore 50% rendiamo il pulsante un cerchio o un'ellisse, a seconda che larghezza e altezza siano uguali.
L'impostazione del valore display a ~code:inline-block~ mantiene tutti i pulsanti su una singola riga. (Hai ragione; non è affatto ovvio, vero?)

I pulsanti iniziano invisibili (ma occupando comunque spazio).

Ora dobbiamo impostare il colore di sfondo, che è diverso per ogni pulsante, quindi testiamo il valore di ~code:N~ per vedere quale colore usare. I CSS hanno 140 colori con nome, più puoi usare combinazioni di rosso, verde, blu e trasparenza per un totale di 4.294.967.296 colori distinti tra cui scegliere.

Infine, alla riga 29 l'animazione vera e propria inizia. Abbiamo un ciclo dentro un ciclo; quello esterno gira all'infinito mentre quello interno conta attraverso i pulsanti, impostando l'indice dell'array ~code:Button~ ogni volta, poi rendendo il pulsante visibile per un breve istante prima di renderlo di nuovo invisibile. Nota come ~ec~ ha 2 modi diversi di impostare gli stili; uno gestisce un singolo stile mentre l'altro ne imposta diversi contemporaneamente e sovrascrive qualsiasi cosa fosse stata impostata in precedenza.

Lo script non ha bisogno di un comando ~code:stop~ alla fine perché non lo raggiungerà mai.

~next:Il rettangolo rimbalzante~