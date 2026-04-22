# Primo passo: Ciao, mondo! #
Inizieremo con cose molto semplici e ti introdurremo gradualmente a sempre più funzionalità del sistema ~ec~. Puoi interrompere in qualsiasi momento e tornare più tardi (sullo stesso computer e browser); il sistema ricorderà dove eri rimasto. Sopra questo testo ci sono pulsanti di navigazione che ti permettono di tornare al passo precedente del tutorial o passare a quello successivo. Quindi cominciamo.

Sulla sinistra puoi vedere un pannello vuoto con solo il numero di riga '1'. (Su uno smartphone dovrai toccare il pulsante ~icon:cycle:20px:Cycle screens~ (Ciclo) per andare al pannello Codice.) Qui è dove inserirai il codice del tuo programma. Sopra di esso ci sono pulsanti per salvare il codice, caricare codice salvato in precedenza ed eseguire ciò che hai sullo schermo al momento.

È tradizione nella programmazione che il primo programma si chiami "Hello, world". Semplicemente mostra un messaggio — tutto qui. Quindi onoreremo la tradizione facendolo qui. Digita il testo che vedi qui sotto nel pannello sulla sinistra, oppure clicca il pulsante "Copia nell'editor". (Se sei su smartphone, potresti voler leggere ancora un po' prima di farlo, ma ricorda che puoi tornare qui in qualsiasi momento toccando il pulsante ~icon:cycle:20px:Cycle screens~.)

~pre:alert &#96;Hello, world!&#96;~
~copy~

Noterai che nel nostro editor il testo tra i backtick è colorato mentre la parola 'alert' è nera. Questo perché l'editor 'capisce' come sono fatti gli script ~ec~. Nota anche che le righe vuote o gli spazi a inizio riga vengono ignorati, e che un comando può occupare più di una riga purché non si inserisca un'interruzione di riga nel mezzo di una stringa tra virgolette (come ~quot:Hello, world!~).

La parola ~code:alert~ è un comando di ~ec~ e il testo tra i backtick è testo fisso. Noi programmatori lo chiamiamo stringa. Le parole colorate in nero fanno tutte parte di ~ec~ stesso; tutto il resto ha un colore che indica il ruolo che svolge nel linguaggio. Le stringhe sono sempre in ~code:rosso~ ~code:spento~.

Quando clicchi il pulsante ~icon:run:20px:Run~ la sua icona cambierà in ~icon:runstop:20px:Stop~ e apparirà una finestra popup con il tuo messaggio. Quando clicchi il pulsante OK nella finestra, tutto tornerà come prima. Il tuo script ha terminato il suo compito.

Il programma in realtà si è comportato come se avessi digitato

~pre:alert &#96;Hello, world!&#96;
exit~

Se ometti l'istruzione ~code:exit~, il compilatore di ~ec~ ne inserisce una per te, ma ci sono momenti in cui non vuoi che il programma semplicemente termini. Potrebbe essere in attesa che l'utente interagisca, quindi deve mantenersi attivo. Per fare questo ci serve un'altra variante:

~pre:alert &#96;Hello, world!&#96;
stop~

In questo caso, dopo aver cliccato il pulsante OK e la chiusura del popup, il pulsante non torna a ~icon:run:20px:Run~. Questo perché lo script è ancora in stato 'in esecuzione' ma in realtà non sta facendo nulla. Se clicchi il pulsante ~icon:runstop:20px:Stop~ lo script sarà costretto a terminare. Provalo e vedrai.

Il popup di alert è molto utile quando vuoi fermare lo script e controllare cosa sta facendo. Puoi costruire un messaggio che contiene tutte le informazioni di cui hai bisogno. Per i prossimi due passi di questo tutorial useremo gli alert per esplorare alcune funzionalità base della programmazione e fare un po' di calcoli aritmetici prima di passare alla parte visuale.

Prima di continuare, aggiungiamo un'altra cosa qui.

Questo script può essere di una sola riga, ma è il tuo primo script. Potresti aver fatto delle modifiche per vedere che effetto hanno (spero proprio di sì; è il modo migliore per imparare). Se vuoi tornare un'altra volta e rieseguirlo, per evitare di doverlo ridigitare, che ne dici di salvarlo? Fallo digitando un nome adatto — come ~code:hello~ — nella casella Nome Script e poi cliccando il pulsante ~icon:save:20px:Save~. Se stai usando il Codex dal nostro server web, i tuoi script vengono salvati in un'area di memoria gestita dal tuo browser e sono visibili solo a te mentre usi questo sito. Questo significa che non sono permanenti, quindi se vuoi davvero salvare uno script dovresti copiarlo e incollarlo in un documento di testo o in una email.

Quando clicchi ~icon:open:20px:Open~ vedrai tutti gli script che hai salvato mentre usavi ~ec~. Clicca su uno qualsiasi di essi per caricarlo nell'editor, dove puoi apportare modifiche ed eseguirlo.

Per cancellare lo script corrente (senza rimuoverlo dalla memoria), clicca ~icon:new:20px:New~, e per eliminare lo script corrente dalla memoria clicca ~icon:trash:20px:Delete~.

~next:Aritmetica di base~