# Esempio pratico (passo per passo)

Costruisci una griglia di colori interattiva. Una volta configurato il sistema (vedi la scheda Inizio), invia questi prompt uno alla volta al tuo agente AI. Ogni passo aggiunge una funzionalità a quella precedente.

![App Colour Memory che mostra una griglia 4×3 di celle in colori misti con un pulsante Reset sotto](primer/color-memory.png)

Quando tutti e quattro i passi funzioneranno, la pagina apparirà più o meno come quella sopra — una griglia 4×3 di celle, ciascuna nel proprio colore, con un pulsante Reset che le riporta tutte al grigio.

## Prompt 1: Fondamenta — Costruisci la griglia

Crea una griglia 3×4 di celle quadrate centrata nella pagina. Ogni cella deve essere grigia con un sottile bordo nero. La griglia deve occupare circa un terzo della larghezza dello schermo. Niente clic, niente pulsanti — solo il layout visivo per ora.

## Prompt 2: Interazione — Clic per cambiare ciclicamente

Fai in modo che ogni cella cambi colore quando viene cliccata. Cicla attraverso questa sequenza: grigio, rosso, blu, verde, giallo, viola, e di nuovo grigio. Ogni cella tiene traccia del proprio colore indipendentemente dalle altre.

## Prompt 3: Controllo — Reset

Aggiungi un pulsante Reset sotto la griglia. Cliccandolo si devono riportare tutte le celle al grigio. Non rendere il pulsante a tutta larghezza — solo di dimensione ragionevole.

## Prompt 4: Persistenza — Sopravvivere a un ricaricamento

Fai in modo che lo stato della griglia sopravviva ai ricaricamenti della pagina. Quando aggiorno la pagina, ogni cella deve ancora avere il colore che le ho lasciato per ultimo. Il pulsante Reset deve anche cancellare lo stato salvato, così un aggiornamento dopo il Reset mostra una griglia pulita.

## Cosa osservare

Dopo ogni prompt, controlla cosa ha creato l'AI. Dovresti riuscire a leggere il codice AllSpeak e capire cosa fa — è proprio il punto. Se qualcosa non va, di' all'AI cosa correggere in linguaggio naturale.

Alcune piccole cose potrebbero dover essere corrette al primo tentativo — una dichiarazione di variabile mancante, una scelta di layout poco felice, un colore che vorresti regolare. È normale; il flusso di lavoro è progettato perché sia l'umano a individuare e guidare, non perché l'AI produca prime versioni perfette.
