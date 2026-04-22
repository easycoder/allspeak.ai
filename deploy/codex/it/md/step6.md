# Aggiungere immagini #
Le pagine web sono spesso molto visuali, con abbondanza di immagini, quindi prima di continuare con argomenti di programmazione più tradizionali ti mostrerò come creare una pagina con un'immagine e un titolo.

Quando guardi l'HTML di una pagina web non vedi mai delle immagini; è solo un documento di testo. Allora come fanno le immagini ad apparire sulla pagina?

Quando abbiamo bisogno di un'immagine forniamo delle informazioni che dicono al browser come trovarla, da qualche parte là fuori su Internet dove è memorizzata su un computer. Forniamo queste informazioni sotto forma di URL, che sta per _Uniform Resource Locator_. Questo viene anche chiamato l'"indirizzo" dell'immagine.

Il codice che segue recupera un'immagine dal nostro server web, la ridimensiona in modo che occupi il 70% della larghezza della pagina e la posiziona allineata al centro con un titolo sotto.

~step~
~copy~

Lo script inizia non con codice di programma ma con un commento. I commenti servono ai lettori umani; puoi metterli ovunque senti il bisogno di spiegare — a qualcun altro o al tuo futuro te stesso — cosa sta succedendo nel tuo codice. I commenti iniziano con un punto esclamativo e continuano fino alla fine della stessa riga, quindi puoi metterli su una riga a sé (come qui) oppure dopo — e sulla stessa riga di — un comando dello script.

I commenti sono oggetto di molte discussioni tra programmatori. Alcuni non amano scrivere commenti, sostenendo che il codice stesso dovrebbe essere autoesplicativo, mentre altri sentono il bisogno di aggiungerne per spiegare l'intenzione dietro al codice, che altrimenti spesso manca. Ti lasciamo fare come preferisci.

Poi abbiamo 3 variabili di tipi diversi. Un ~code:div~ è una divisione di una pagina; un contenitore all'interno del quale possono essere posizionati altri elementi. Molte pagine web sono composte da molti div dentro altri div, la maggior parte invisibili e che forniscono solo la struttura complessiva.

La variabile ~code:img~ è dove posizioneremo la nostra immagine, e la variabile ~code:p~ è per il titolo che si trova sotto di essa.

Per prima cosa creiamo il contenitore, dandogli allineamento al centro, un margine attorno, un bordo grigio, del padding interno per tenere il contenuto lontano dal bordo e un colore di sfondo. Come spiegato nel passo precedente, questi sono tutti attributi CSS standard che puoi cercare. La lista di stili è piuttosto lunga, quindi per evitare che la riga vada a capo nell'editor l'ho divisa in 2 parti con un ~code:cat~ tra di esse. "Cat" è l'abbreviazione di "catenate" (concatenare), che semplicemente unisce 2 pezzi di testo insieme.

L'elemento immagine viene poi creato. Nota che il comando richiede che venga creato all'interno del contenitore; il comportamento predefinito sarebbe di posizionarlo sotto. La larghezza dell'immagine è impostata al 70% dell'elemento che la contiene e per impostazione predefinita l'altezza si adatterà per mantenere le stesse proporzioni. Poi richiediamo l'immagine stessa dal nostro server. Quando risorse come le grafiche si trovano sullo stesso server del codice che le usa, è comune che l'URL non inizi con il solito ~code:http://~; qui abbiamo un percorso relativo che si riferisce a una cartella sul server. Come programmatore ovviamente saprai dove sono conservate le tue immagini.

Il testo del titolo comprende diverse righe. In una pagina web un'interruzione di riga si richiede usando la parola ~code:break~, e per mantenere tutto ordinato qui l'intera stringa è divisa in righe e concatenata insieme.

~next:Animazione~