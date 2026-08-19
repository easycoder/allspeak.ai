# Blocchi di documentazione

Un blocco di documentazione è una spiegazione in prosa strutturata, attaccata a una sezione di codice `.as`. La convenzione esiste per forzare una lettura attenta: mettere per iscritto il *perché* ti obbliga a notare che cosa fa davvero il codice, e i revisori vedono ciò che l'autore intendeva senza doverlo dedurre dai nomi delle variabili.

I blocchi di documentazione sono facoltativi per file, ma obbligatori una volta che un file li adotta: un file senza blocchi è considerato fuori dalla convenzione, senza avvisi da nessuna delle due parti.

## Struttura

Un blocco di documentazione avvolge una sezione contigua di codice, iniziando con una o più righe di prosa `!!` e terminando con `!!!` (tre punti esclamativi):

```as
!! Breve spiegazione di che cosa fa questa sezione e perché esiste.
!! Usa più righe !! se serve. Una riga !! nuda è un'interruzione di paragrafo.
Section:
    ! il codice
    ritorna
!! @hash <managed>
!!!
```

- `!!` apre o continua un blocco di documentazione. Ogni riga `!!` è un paragrafo di prosa. Una riga `!!` nuda (senza testo dopo) è un'interruzione di paragrafo.
- `!!!` (tre punti esclamativi) termina il blocco.
- `@hash` è una riga di metadati, inserita e mantenuta dall'analizzatore; non scriverla a mano.

Il blocco avvolge il codice così che la prosa e il codice formino un'unica unità logica.

## Scrivere la prosa

Parti dal **perché**, dal vincolo di progettazione o dal contesto non ovvio — non da un riassunto del codice. Il lettore vede che cosa fa il codice; la prosa aggiunge ciò che il codice non può dire:

- Perché questa sezione esiste.
- Quali invarianti preserva.
- Che cosa deliberatamente NON fa.
- Com'erano i tentativi precedenti.

Evita di ripetere l'ovvio. Evita il commento riga per riga; a quello servono i commenti di fine riga `!`, quando servono.

**Prima frase sulla propria riga, con un'interruzione di paragrafo dopo.** La frase di apertura deve reggersi da sola come riassunto in una riga di a che cosa serve la sezione. Fallo seguire da una `!!` nuda (interruzione di paragrafo), poi da qualsiasi dettaglio ulteriore. Così il modo Blocchi è leggibile a colpo d'occhio: il lettore vede una frase stringata accanto al codice, con l'approfondimento disponibile sotto, per quando serve di più.

```
!! Costruisci la griglia 4x3: crea 12 celle e prepara lo stato di colore di ciascuna.
!!
!! Collega a Board, poi ripeti 12 volte — `indice Cell a N` seguito da `crea Cell in Board` costruisce la cella N-esima. L'array parallelo ColourIndex fa partire ogni cella da 0 (grigio).
```

Non così:

```
!! Costruisci la griglia 4x3 e prepara lo stato di ogni cella. Collega a Board, crea 12 div Cell semplici come figli — ognuna riceve uno sfondo grigio, un sottile bordo nero e aspect-ratio 1 per restare quadrata — e inizializza l'array parallelo ColourIndex a 0 per ogni cella così che tutte partano nello stato grigio. Infine, registra un gestore di clic condiviso …
```

La forma muro-di-testo spinge il dettaglio già visibile nel codice (il colore, il bordo, l'inizializzazione dell'array) e schiaccia il *perché*. La forma in due righe dà al lettore un riassunto utilizzabile senza leggere oltre.

**Un paragrafo = una riga.** Ogni paragrafo di prosa è un'unica riga `!!`, per quanto lunga. Non inserire interruzioni di riga forzate per l'a capo visivo: rendono male nel modo Blocchi (che va a capo automaticamente) e ti combattono durante la modifica. Usa una `!!` nuda per separare i paragrafi.

Non iniziare una riga di prosa con `@hash` o `@verified`; sono token di metadati riservati. Citali (« `@verified` ») se devi menzionare i nomi.

## Il meccanismo `@hash`

Ogni blocco di documentazione include un hash del codice avvolto come `@hash <managed>`. Lo mantiene l'analizzatore. Dopo qualsiasi modifica al codice dentro un blocco, aggiorna gli hash:

```
python3 tools/asdoc-check.py --write <file>
```

Un hash obsoleto significa che il codice è cambiato senza che la prosa sia stata riletta: l'analizzatore lo segnala come avviso. L'autore rilegge la prosa, decide se descrive ancora il codice con precisione, e modifica la prosa o segna il blocco come verificato.

## Il meccanismo `@verified`

`@verified` è un'affermazione più forte del solo `@hash`: un segnale deliberato che un umano ha letto il codice e la prosa insieme e ha approvato l'abbinamento. L'hash verificato viene poi bloccato. Le modifiche successive al codice rompono la verifica (`verified-stale`), richiedendo un nuovo passaggio umano.

Il modo Blocchi di Asedit fornisce un pulsante «Segna verificato» in un clic per questo.

## Fuori dalla convenzione: file senza blocchi

Un file senza alcun blocco di documentazione è trattato come fuori dalla convenzione: niente errori, niente avvisi. Questo permette di adottare la convenzione file per file man mano che tocchi il codice esistente, senza imporre un giorno di transizione a tutto il codebase.

Una volta che un file ha un blocco, l'analizzatore si aspetta che l'intero file sia coperto: le sezioni successive non avvolte emergono come avvisi.

## Validatori

Due strumenti validano la stessa convenzione:

- `tools/asdoc-check.py` — CLI Python; ricorsiva su una directory. Esegui con `--write` per aggiornare gli hash.
- `tools/asdoc-check-cli.as` — gira sotto il runtime Python di AllSpeak, esercitando la stessa logica dall'interno di AllSpeak stesso.

Anche il modo Blocchi di Asedit esegue la validazione nell'editor mentre scrivi.

## Revisione mentre documenti

Aggiungere blocchi di documentazione al codice esistente dovrebbe essere un passaggio di revisione, non solo di documentazione. Mentre leggi ogni sezione abbastanza attentamente da scriverne la prosa, fai emergere anche tutto ciò che stona:

- **Simboli irraggiungibili** — subroutine o etichette senza chiamanti; variabili dichiarate ma mai assegnate, o assegnate ma mai lette.
- **Codice morto** — diramazioni che non possono mai essere prese; righe dopo un `ferma`/`esci`/`ritorna` incondizionato a cui nulla salta.
- **Pattern sospetti** — logica duplicata, valori hardcodati che sembrano dovrebbero essere variabili, accoppiamento nascosto tra sezioni.
- **Disaccordo doc/codice** — commenti, nomi o documentazione vicina che contraddicono ciò che il codice fa davvero.

Presenta i risultati come un breve elenco all'inizio della risposta, separato dalle modifiche ai blocchi. Non correggerli in silenzio: lascia decidere all'autore.

Il punto della convenzione è forzare la lettura attenta; riportare ciò che quella lettura ha trovato è il frutto naturale.

## Vedi anche

- [simboli e layout](symbols-and-layout.md) — `!!` e `!!!` come marcatori lessicali.
- [struttura](structure.md) — i blocchi di documentazione vengono rimossi prima che i compilatori di dominio vedano qualcosa.
