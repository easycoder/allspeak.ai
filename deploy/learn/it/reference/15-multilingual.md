# Multilingua

AllSpeak permette di scrivere codice nella propria lingua. Uno script `.as` francese e uno `.as` inglese compilano nello stesso programma interno e girano sullo stesso motore; cambia solo il vocabolario sorgente.

Questo file descrive come funziona il livello multilingue. Per indicazioni su come scrivere script la cui *logica* sopravvive alla traduzione (evitando assunzioni sulla forma dei dati incentrate sull'inglese, stranezze sull'ordine delle parole, ecc.), vedi [scrivere in linguaggio neutro](../idioms/writing-language-neutral.md).

## La direttiva `language`

Uno script può dichiarare la lingua del proprio vocabolario sulla prima riga:

```as
language français

alerte `Bonjour, tout le monde !`
```

```as
language italiano

avviso `Ciao, mondo!`
```

```as
language deutsch

alarm `Hallo, Welt!`
```

La direttiva dice al compilatore quale pacchetto linguistico caricare. Se è omessa, si assume l'inglese:

```as
alert `Hello, world!`
```

I tre esempi localizzati qui sopra compilano nella stessa operazione interna di avviso-con-stringa e girano sullo stesso motore.

## Che cos'è un pacchetto linguistico

Un pacchetto linguistico è una corrispondenza tra i token canonici (interni) e una o più forme di superficie nella lingua di destinazione. Copre sei categorie:

- **Opcode** — le parole chiave verbo come `stampa`, `imposta`, `se`.
- **Connettivi** — le piccole parole grammaticali come `a`, `in`, `di`, `con`.
- **Letterali** — parole chiave che producono valori: `vero`, `falso`, `now`, `today`, `newline`.
- **Unità di tempo** — `secondi`, `millisecondi`, `ticks`.
- **Condizioni** — `è`, `è minore di`, `contiene`, ecc.
- **Parole** — articoli, particelle, qualsiasi altra cosa traducibile.

Dove vivono i pacchetti:

- **JS:** `js/allspeak/LanguagePack_<codice>.js` — per es. `LanguagePack_fr.js`.
- **Python:** `allspeak-py/allspeak/languages/<codice>.json` — per es. `fr.json`.

I due sono tenuti in sincronia: per una data lingua, gli stessi token canonici corrispondono alle stesse forme di superficie in entrambi i runtime.

## Come il pipeline di compilazione usa il pacchetto

Il flusso durante la compilazione:

```
source token  →  AllSpeak_Language.reverseWord()  →  canonical token  →  domain compiler
```

Quando il compilatore legge un token dalla sorgente, il livello linguistico lo cerca nell'indice inverso del pacchetto attivo e restituisce la forma canonica. `alerte` → `alert`, `avviso` → `alert`, `alert` → `alert`. I compilatori di dominio (Core, Browser, ecc.) operano esclusivamente sui token canonici.

I domini non vedono mai i token localizzati. È per questo che uno script francese e uno inglese producono lo stesso array di programma: entrambi si riducono allo stesso flusso di token canonici prima che qualsiasi codice di dominio venga eseguito.

## Più forme di superficie per parola canonica

Una voce del pacchetto può far corrispondere una parola canonica a più forme di superficie — utile per le lingue con flessione grammaticale. Le forme sono separate da barre verticali:

```
"the": "il|lo|la|gli|le"
```

Il compilatore accetta una qualsiasi delle forme elencate; la forma canonica è ciò che si propaga a valle. La ricerca `word()` restituisce la prima forma (l'ortografia principale per l'output); `wordForms()` restituisce l'intera lista (per il confronto durante la compilazione).

## Lingue attualmente fornite

Entrambi i runtime forniscono quattro pacchetti:

- **Inglese** (`en`) — l'originale; il default se non c'è alcuna direttiva `language`.
- **Italiano** (`it`) — completo.
- **Francese** (`fr`) — completo.
- **Tedesco** (`de`) — completo.

Le quattro sono state scelte per la sensibilizzazione verso le agenzie delle Nazioni Unite. La copertura del francese e del tedesco è ampia; alcune traduzioni sono ancora in fase di rifinitura.

## Scrivere logica in linguaggio neutro

Il *vocabolario* indipendente dalla lingua è fornito automaticamente dal pacchetto. La *logica* indipendente dalla lingua — una struttura di script che non incorpora assunzioni inglesi sull'ordine delle parole, sulla forma dei dati o sui pattern culturali — è responsabilità dell'autore. L'idioma [scrivere in linguaggio neutro](../idioms/writing-language-neutral.md) raccoglie i pattern e i tranelli.

## Aggiungere una nuova lingua

Meccanicamente:

1. Copia `LanguagePack_en.js` (e `languages/en.json` per Python) nel codice della nuova lingua.
2. Traduci le voci di parole chiave, connettivi, letterali, unità di tempo, condizioni e parole.
3. Aggiungi la lingua all'indice del loader.
4. Scrivi una riga `language <nome-nativo>` e scrivi dei test.

La parte difficile non è meccanica — è la scelta del vocabolario. Le parole chiave inglesi di AllSpeak sono volutamente simili al linguaggio naturale (`take A from B`, `add A to B`, `the index of`), e le traduzioni devono leggersi naturalmente nella lingua di destinazione, non come calchi letterali dell'inglese. La traduzione con l'IA produce una prima bozza decente; la revisione umana da parte di un madrelingua la porta alla qualità di pubblicazione.

I problemi di vocabolario aperti sono tracciati in `language-pack-issues.md` alla radice del repository.

## Vedi anche

- [struttura](structure.md) — dove si colloca il livello linguistico nel compilatore.
- [simboli e layout](symbols-and-layout.md) — la superficie lessicale, identica in ogni lingua.
- [scrivere in linguaggio neutro](../idioms/writing-language-neutral.md) — i pattern per un codice che sopravvive alla traduzione.
