# Struttura

AllSpeak ha due metà: un piccolo runtime neutrale rispetto alla lingua e uno stack di **moduli di dominio** che contribuiscono il vocabolario vero e proprio. Il runtime non sa nulla di parole chiave specifiche. È grazie ai domini che `stampa`, `su clic`, `rest ottieni` e `mqtt publish` possono convivere nella stessa lingua senza che il motore le abbia come built-in.

## I domini

Un dominio è un modulo che possiede:

- **Un vocabolario** — le parole chiave e le forme dei comandi che sa compilare.
- **Un insieme di tipi di variabile** — per esempio il dominio Browser conosce `bottone`, `div`, `input`; il dominio REST conosce `request`.
- **Un insieme di condizioni e valori** — test ed espressioni specifici del dominio.
- **Uno stub di compilatore per ogni costrutto** — codice che riconosce la sintassi e la trasforma in una forma eseguibile.
- **Un esecutore runtime per ogni costrutto** — che cosa fare quando quella forma viene eseguita.

I domini sono indipendenti. Aggiungerne uno nuovo — integrato o come plugin — introduce nuove parole chiave senza toccare nessun dominio esistente.

## I domini standard

Integrati nella build JS:

| Dominio | Offre |
|---------|-------|
| Core | Flusso di controllo, variabili, aritmetica, stringhe, file |
| Browser | Tipi DOM, eventi, stili, layout |
| JSON | Analisi, costruzione e navigazione di JSON |
| Webson | Il meccanismo di binding del layout tra markup Webson e variabili AllSpeak |
| REST | Richieste HTTP, gestione delle risposte |
| MQTT | Messaggistica pub/sub |

La build Python ha un insieme simile, con qualche divergenza su collezioni e I/O.

Anche `MarkdownRenderer` è integrato, ma è un'utilità chiamata da Core piuttosto che un dominio a sé — non ha alcun vocabolario.

## Come funziona la compilazione

Il compilatore legge la sorgente un'istruzione alla volta. Per ogni istruzione chiede a ogni dominio caricato, uno dopo l'altro: *riesci a gestirla?* Il primo dominio che riconosce il costrutto produce un record compilato — una piccola struttura dati che cattura l'operazione e i suoi operandi — e quel record viene aggiunto all'**array del programma**, una sequenza lineare di istruzioni compilate.

Se nessun dominio reclama l'istruzione, è un errore di compilazione.

```
riga sorgente  →  domain.compile()  →  voce dell'array del programma
```

L'ordine in cui i domini vengono provati raramente interessa a chi scrive lo script, perché ogni dominio possiede un vocabolario distinto.

## Come funziona l'esecuzione

Il runtime — `Run.js` nella build JS — scorre l'array del programma, rimandando ogni voce all'esecutore del dominio che la possiede. L'esecutore legge gli operandi, manipola le variabili, valuta le condizioni e può cedere il controllo (`ferma`, `attendi`) o trasferirlo (`vai a`, `vaisub`, biforca in un nuovo thread).

Il runtime stesso è piccolo e indipendente dalla lingua. Non sa che cosa significa `su clic`; sa solo come invocare il gestore del dominio che è stato collegato in fase di compilazione.

## Il livello multilingue

Un secondo livello si trova tra lo script sorgente e i compilatori dei domini: il **pacchetto linguistico**. I token sorgente in qualsiasi lingua supportata (inglese, francese, italiano, tedesco, …) vengono risolti tramite il pacchetto linguistico in una forma canonica e poi consegnati ai domini. I domini non vedono mai i token localizzati — lavorano interamente nel vocabolario canonico.

Questo significa che uno script `.as` francese e uno `.as` inglese compilano nello stesso array del programma e girano sullo stesso motore. Vedi [multilingua](multilingual.md) per come funzionano i pacchetti linguistici e come la direttiva `language` ne seleziona uno.

## Plugin

Un plugin è un dominio distribuito separatamente dal runtime integrato. Il contratto è lo stesso dei domini integrati — fornire vocabolario, tipi, compilatori ed esecutori — e il loader lo tratta in modo identico. Il dominio MQTT è nato come plugin ed è stato poi promosso a integrato; Google Maps è un plugin esterno attuale.

I plugin sono indicati quando un corpo di funzionalità specializzate (grafica, integrazione hardware, API di terze parti) è abbastanza grande da meritare un vocabolario proprio ma non abbastanza centrale da entrare nel prodotto standard. Vedi [plugin](plugins.md).

## Strumenti di supporto

Alcuni pezzi di AllSpeak sono essenziali ma non sono caratteristiche del linguaggio. Il più importante è il **renderer Webson** — il componente che trasforma il markup Webson (un dialetto JSON che descrive HTML/CSS) in DOM. Il dominio Webson fornisce il binding `collega` che gli script AllSpeak usano per raggiungere gli elementi renderizzati; è il renderer che emette davvero quegli elementi. Vedi [browser e Webson](browser-and-webson.md).

## Perché la struttura è fatta così

Dal modello a domini derivano quattro conseguenze:

1. **Estensibilità senza toccare il motore.** Un nuovo dominio aggiunge vocabolario senza intaccare il codice di nessun altro.
2. **Evoluzione in parallelo.** I domini possono essere rivisti in modo indipendente — al dominio MQTT non interessa che cosa fa il dominio Browser.
3. **Neutralità linguistica.** Poiché i domini operano su token canonici, lo stesso codice di dominio serve ogni lingua umana supportata dal motore.
4. **Prestazioni grazie alle vie di fuga native.** Il codice nei percorsi critici può essere un plugin scritto in JS o Python, che gira a piena velocità nativa, mentre la maggior parte dell'applicazione resta in AllSpeak leggibile. Il risultato si avvicina alle prestazioni di una build tutta nativa con una leggibilità nettamente migliore. Vedi [plugin](plugins.md).

## Vedi anche

- [simboli e layout](symbols-and-layout.md) — la superficie lessicale che i domini non vedono mai direttamente.
- [variabili e array](variables-and-arrays.md) — i tipi di variabile appartengono ai domini.
- [multilingua](multilingual.md) — il pacchetto linguistico e la direttiva `language`.
- [plugin](plugins.md) — i domini esterni.
