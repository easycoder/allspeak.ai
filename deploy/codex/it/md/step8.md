# Un rettangolo rimbalzante #
Ecco un altro semplice esempio di animazione. Questa volta disegneremo un rettangolo la cui altezza varia secondo un calcolo del seno. Non preoccuparti della matematica; ti spiegherò. Ecco il codice; copialo nell'editor poi eseguilo così saprai cosa fa.

~copy~

Il rettangolo grigio inizia con un'altezza pari alla metà del contenitore, poi cresce e si restringe, tornando infine alla sua dimensione originale.

Iniziamo creando il contenitore, dandogli una larghezza del 90% del pannello che lo contiene. Senza lo stile margin questo lo farebbe aderire al lato sinistro del pannello. Dovrai documentarti sullo stile CSS ~code:margin~ per avere tutti i dettagli della sintassi, ma in breve, usando auto per i margini sinistro e destro li si costringe a dividersi lo spazio libero tra loro, così il riquadro si posiziona al centro.

Il rettangolo è impostato per occupare il 9% della larghezza del contenitore e avere un bordo e uno sfondo. Lo stile ~code:position~ è un'altra chicca dei CSS troppo articolata da spiegare qui; fondamentalmente permette di impostare la posizione del bordo superiore dell'elemento. Senza ~code:position~ e ~code:top~ resterebbe semplicemente attaccato alla parte superiore del riquadro. Il rettangolo è forzato ad avere il suo bordo superiore a metà del contenitore (nel mondo informatico, la parte superiore di un contenitore è sempre zero e i valori più grandi vanno verso il basso).

Non lasciarti scoraggiare dall'apparente complessità dei CSS. Vale davvero la pena dedicare un po' di tempo a studiarli, ma alla fine devi semplicemente provare le cose. La cosa bella dell'editor di ~ec~ è che puoi sperimentare finché non riesci a far funzionare le cose.

Finora abbiamo un rettangolo grigio in un riquadro più grande. Il comando successivo è ~code:wait 2 seconds~, che fa esattamente quello che dice. Puoi usare ~code:wait~ per mettere in pausa uno script per qualsiasi numero di ~code:millis~ (millisecondi), ~code:ticks~ (centesimi di secondo), ~code:seconds~ (secondi) o ~code:minutes~ (minuti). In tutti i casi la ~code:s~ finale è opzionale.

Ora passiamo all'animazione vera e propria. Usiamo una variabile ~code:Angle~ per contare da 0 a 360. Questo è il numero di gradi in un cerchio. Se non sei portato per la matematica, prova a immaginare un orologio con una lancetta dei secondi che gira. È una lancetta dei secondi un po' particolare che si estende attraverso tutto l'orologio da un bordo all'altro. Se guardassi l'orologio di taglio non vedresti il movimento rotatorio; la lancetta dei secondi sembrerebbe solo allungarsi e accorciarsi mentre procede attorno al quadrante. La funzione matematica del seno ci dice la lunghezza apparente della lancetta in qualsiasi punto della sua progressione attorno al quadrante. Nel nostro esempio il diametro dell'orologio è di 200 pixel (quindi il raggio è 100 pixel) e la lunghezza apparente, vista di taglio, varia da 0 a 200 pixel. (Lo stesso principio si applica alla durata del giorno con il cambio delle stagioni. Vedi, la matematica può essere utile.)

Il calcolo ~code:sin Angle radius 100~ si occupa di tutto questo, quindi non dirò altro. Usiamo il valore risultante ~code:Height~ per calcolare la nuova posizione superiore del rettangolo e la sua nuova altezza.

Ci sono un paio di calcoli fatti negli stili CSS. La parte superiore del rettangolo è il punto 50% come prima ma con il valore del seno sottratto. Allo stesso modo, l'altezza del rettangolo è fondamentalmente 100 pixel ma con il valore del seno aggiunto.

~next:L'Ola~