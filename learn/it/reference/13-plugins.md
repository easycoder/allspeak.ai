# Plugin

Un plugin è un dominio esterno: un'unità di codice, di solito JavaScript o Python, che aggiunge ad AllSpeak nuovo vocabolario, nuovi tipi, condizioni e comportamenti di runtime senza fare parte del runtime incluso. I plugin seguono lo stesso contratto dei domini inclusi (Core, Browser, REST, MQTT, …); il loader li tratta in modo identico.

Usa un plugin quando:

- Un insieme di funzionalità specializzate (grafica, integrazione hardware, API di terze parti) è abbastanza grande da meritare un vocabolario proprio.
- La funzionalità deve chiamare del codice nativo (API del browser, librerie di sistema) che AllSpeak non può raggiungere direttamente.
- La funzionalità è critica per le prestazioni e deve girare a velocità nativa.
- La funzionalità deve essere opzionale: caricata solo quando uno script ne ha bisogno.

Usa invece un [modulo](modules.md) quando l'estensione è AllSpeak puro e non introduce nuovo vocabolario.

## Prestazioni: il principio della pila mista

Un'obiezione comune all'idea di far girare un linguaggio interpretato sopra un altro linguaggio interpretato (AllSpeak su JS, o AllSpeak su Python) è che la stratificazione sarà troppo lenta. L'obiezione ha un fondo di verità, ma ignora il pattern che i plugin rendono possibile.

Nella maggior parte delle applicazioni, le prestazioni contano solo in una piccola parte del codice. La massa — tubature dell'interfaccia, transizioni di stato, flusso di controllo, instradamento dei messaggi — è molto meglio servita dalla leggibilità e dalla manutenibilità che dalla velocità grezza. Ottimizzare quelle parti per la velocità è cattiva ingegneria, anche quando è possibile.

Quello che conta davvero è il percorso critico: il loop interno di un renderer grafico, la FFT in un processore di segnale, la passata di layout su migliaia di punti. Per quelli, AllSpeak passa la mano a un plugin scritto in JavaScript o Python: codice che gira alla stessa velocità di qualsiasi plugin scritto nello stesso linguaggio per qualsiasi altro framework.

Il risultato: script AllSpeak per la massa (leggibile, manutenibile, multilingue), plugin per il percorso critico (piena velocità nativa). Le prestazioni dell'applicazione risultante si avvicinano a quelle di una build interamente nativa, ma il codebase è decisamente più leggibile e manutenibile.

Questo è un principio architetturale centrale di AllSpeak, non un salvataggio postumo. Il meccanismo dei plugin esiste *perché* il design presuppone uno sviluppo a pila mista; non è una funzionalità aggiunta per coprire i limiti del livello interpretato.

## Il contratto

Entrambi i runtime seguono un contratto per plugin condiviso, documentato in [`spec/allspeak-plugin-contract.md`](https://github.com/easycoder/allspeak.ai/blob/master/spec/allspeak-plugin-contract.md). Un plugin è un dominio registrato che espone:

- **Gestori di parole chiave** — `compile(...)` per il momento della compilazione, `run(...)` per il momento dell'esecuzione.
- **Compilatori / esecutori di valori** — per nuovi tipi di valore (per es. `il gps posizione`).
- **Compilatori / tester di condizioni** — per condizioni specifiche del dominio (per es. `se Subscriber è connesso`).

I gestori mancanti sono ammessi: un plugin non è obbligato a implementare ogni capacità. Il runtime dispaccia in base a ciò che è registrato.

## Plugin JavaScript

Un plugin JS si registra agganciandosi a `AllSpeak.domain`:

```js
AllSpeak.domain.gmap = {
    name: 'AllSpeak_GMap',
    getHandler: function(token) { ... },
    run: function(program) { ... },
    value: {
        compile: function(compiler) { ... },
        get: function(program, value) { ... }
    },
    condition: {
        compile: function(compiler) { ... },
        test: function(program, condition) { ... }
    }
};
```

I plugin viaggiano come file `.js` separati in `/dist/plugins/`. Una pagina che ne usa uno lo carica tramite un tag `<script>` insieme al runtime AllSpeak.

## Plugin Python

Un plugin Python viene caricato esplicitamente a runtime dello script:

```as
importa plugin GMap da `gmap.py`
```

La classe deriva da una base `Handler` e fornisce metodi per parole chiave con la nomenclatura standard `k_<token>` / `r_<token>`, più `compileValue()`/`v_<type>` e `compileCondition()`/`c_<type>` rispettivamente per valori e condizioni. Vedi il contratto dei plugin per i nomi esatti dei metodi.

## Plugin JS inclusi

In `/js/plugins/`:

- **`ui`** — vocabolario UI aggiuntivo (selettori di data, pannelli, ecc.).
- **`svg`** — disegno SVG.
- **`gmap`** — Google Maps.
- **`float`** — supporto esteso per i numeri a virgola mobile (dove il modello intero-prima è troppo restrittivo).
- **`anagrams`**, **`life`** — plugin di esempio che dimostrano il contratto.

MQTT è nato come plugin e poi è stato promosso a dominio incluso. Lo stesso percorso è aperto a qualsiasi plugin che si riveli ampiamente utile.

## Plugin vs moduli

| | Plugin | Modulo |
|---|--------|--------|
| Linguaggio | JS / Python | AllSpeak (`.as`) |
| Aggiunge vocabolario | Sì | No |
| Raggiunge le API native | Sì | No (solo tramite plugin) |
| Caricato da | tag `<script>` (JS) o `importa plugin` (Py) | `esegui <percorso> come <nome>` |
| Comunicazione | Chiamate dirette tramite il vocabolario | Passaggio di messaggi (`invia` / `su messaggio`) |
| Ideale per | Tecnologie specializzate (grafica, hardware) | Grossi blocchi di logica script pura |

Un plugin estende il linguaggio; un modulo estende l'applicazione. Entrambi hanno il loro posto.

## Anti-pattern: plugin per logica AllSpeak pura

Se il lavoro si poteva scrivere in AllSpeak, di solito un [modulo](modules.md) è la scelta migliore: i moduli sono autonomi, debuggabili dall'interno di AllSpeak e non richiedono passaggi di build nativa. I plugin servono quando AllSpeak non può esprimere direttamente ciò che serve.

## Anti-pattern: plugin monolitici

Un plugin di 5000 righe che fa grafica, rete e storage è un segno che il confine è stato tracciato troppo in largo. Dividilo in plugin focalizzati (ciascuno con un'unica responsabilità) e lascia che lo script carichi solo quelli di cui ha bisogno.

## Vedi anche

- [struttura](structure.md) — i domini e il modello «il compilatore prova ogni dominio».
- [moduli](modules.md) — il meccanismo di estensione dal lato AllSpeak.
- La specifica del contratto dei plugin: `spec/allspeak-plugin-contract.md`.
