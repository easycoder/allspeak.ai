# Introduzione al DOM #
Tutte le pagine web sono composte da componenti HTML; una specie di concetto a matrioska dove contenitori contengono altri contenitori che contengono immagini o testo... e così via. Questa struttura si chiama Document Object Model, o DOM in breve. In questo passo creeremo una pagina web con un singolo componente che contiene del testo. Non ci aspettiamo che tu sappia nulla del DOM o dell'HTML; tutto ciò che ti serve verrà introdotto man mano.

Esistono diversi tipi di componenti che possono contenere testo. Intestazioni, elementi paragrafo, span, campi di testo e divisioni sono tra i più comuni. In questo esempio creeremo un elemento paragrafo e ci metteremo una frase ben nota. Lo script è il seguente:
~step~
Quando lo script viene eseguito, il testo apparirà nel pannello di esecuzione e nasconderà il testo di questo tutorial. Puoi passare dal pannello Esecuzione a quello Guida cliccando il pulsante  (Ciclo). Provalo e vedrai. (Su dispositivi mobili il pulsante  scorre tra i tre pannelli Codice-Esecuzione-Guida.)

~copy~

Qui sta succedendo parecchio, quindi spiegherò. La prima riga è un commento che può essere ignorato. Dopo c'è ~code:p Para~, che è una dichiarazione di variabile, un termine tecnico dei programmatori che significa una definizione di un posto dove puoi conservare informazioni. Nel mondo reale potresti avere 2 cani, chiamati Fido e Pluto. Quando ti riferisci al primo in una conversazione potresti dire "Questo è il mio cane Fido". Il tuo interlocutore (la persona con cui stai parlando) sa cos'è un cane, e nella scrittura confermiamo che Fido è un nome perché lo scriviamo con la lettera maiuscola. Una volta che abbiamo identificato l'animale in questione possiamo riferirci a lui semplicemente come Fido senza dover ripetere 'il mio cane'.

~ec~ funziona allo stesso modo dell'inglese. Devo essere chiaro su questo punto perché, per qualche curioso motivo, la maggior parte degli altri linguaggi di programmazione fa le cose esattamente al contrario, iniziando i nomi con lettere minuscole e i tipi con lettere maiuscole. Per molti principianti questo è controintuitivo, quindi noi preferiamo seguire il modo inglese.

Da quanto sopra potresti aver dedotto che ~code:Para~ è il nome di qualcosa e ~code:p~ è il nome di quel tipo di cosa. Se è così, hai indovinato. Un oggetto di tipo ~code:p~ è un paragrafo di testo, e qui ne abbiamo uno chiamato ~code:Para~. Dandogli un nome possiamo distinguerlo da un altro paragrafo chiamato ~code:Para2~, proprio come Fido e Pluto non sono lo stesso cane. Quello che stiamo facendo è dire a ~ec~ che useremo un paragrafo e che vorremmo riferirci ad esso come ~code:Para~.

Uno script ~ec~ tipico può avere molte variabili ed è convenzione metterle tutte all'inizio, poi mettere una riga vuota dopo di esse per aiutare il programmatore, proprio come i libri suddividono il testo in paragrafi, elenchi e intestazioni. È più facile per l'occhio seguire. Le righe vuote non hanno assolutamente alcun effetto sul funzionamento del programma.

La riga successiva è create ~code:Para~. Abbiamo già annunciato che vorremo un paragrafo, quindi qui lo creiamo. In alcuni linguaggi di programmazione (JavaScript, per esempio), le variabili non hanno tipi; sono tutte _cose_ generiche. (Nel mondo reale è inconcepibile che potremmo funzionare se la lingua non ci permettesse di dire se qualcosa è un cane, un gatto o una poltrona, ma sembra funzionare abbastanza bene nel mondo informatico.) La maggior parte degli altri linguaggi ha bisogno di sapere di che tipo è una variabile per poterla creare. Questo approccio si chiama _tipizzazione forte_. ~ec~ si trova a metà strada tra i due; sebbene le sue variabili siano 'tipizzate', a volte possono contenere dati di tipi diversi. In particolare, numeri e stringhe possono essere entrambi contenuti in una variabile ordinaria e nella maggior parte dei casi ~ec~ capisce quando convertire l'uno nell'altro.

Un paragrafo è il posto dove metti il testo nella tua pagina web; è un _contenitore_ di testo. ~ec~ posiziona il tuo nuovo paragrafo in cima alla pagina, contro il margine sinistro, ma finché non ci aggiungi del testo non riuscirai a vederlo perché è trasparente. Quindi la riga successiva dello script aggiunge del testo.

Infine, il comando ~code:stop~ impedisce allo script di terminare prima ancora che tu abbia avuto la possibilità di vedere il testo.

Come negli esempi precedenti, l'editor ha fatto della colorazione del codice. Le variabili sono sempre visualizzate in blu e i numeri in verde. Qualsiasi parola mostrata in nero fa parte di ~ec~ stesso.

~next:Stili e CSS~