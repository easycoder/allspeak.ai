# Estrarre un modulo

## Problema

Il tuo script è cresciuto oltre qualche migliaio di righe. Navigarlo, revisionarlo e ricaricarlo sono diventati dolorosi. Una sezione in particolare continua a riapparire nelle review perché è difficile da seguire accanto al resto. È ora di estrarla come modulo.

## Quando estrarre

Segnali che invitano a considerare l'estrazione:

- Script oltre ~2500 righe e in crescita.
- Una specifica zona funzionale continua a riapparire nelle review perché è difficile da seguire accanto al resto.
- Una trasformazione autonoma che potrebbe essere riusata tra script diversi.

Un blocco è un buon candidato quando:

1. **Un solo scopo.** Una singola frase descrive ciò che fa. Se la descrizione ha bisogno di due «e anche», non è un modulo — sono più d'uno.
2. **La dimensione giusta: 200–500 righe.** Più piccolo e il sovraccarico del confine mangia il guadagno. Più grande e il nuovo modulo diventa a sua volta difficile da navigare.
3. **Per lo più variabili proprie.** Una manciata di input e output; il resto è interno. Se l'uso «dall'esterno» è sparso ovunque, il blocco non è davvero separabile.
4. **Accoppiamento minimo a DOM / MQTT / globale.** Le trasformazioni pure (dati dentro, dati fuori) sono le più pulite. Le zone pesanti di DOM sono le peggiori — ogni paint diventa un andata-e-ritorno di messaggi a meno che il modulo possieda anche il DOM.

## Quando *non* estrarre

Non estrarre:

- **Percorsi strettamente accoppiati al DOM**, a meno che il modulo possieda anche il DOM. Un modulo che chiede al genitore «dipingi il bottone X di rosso» tramite messaggi a ogni clic sarà più lento e più difficile da debuggare della versione inline.
- **Blocchi più piccoli di ~150 righe.** Il sovraccarico d'interfaccia mangia il guadagno.
- **Meccanismi che scattano molte volte per azione utente.** Un clic che innesca 10 piccoli aggiornamenti dell'interfaccia genererebbe 10 andate-e-ritorni.
- **Stato condiviso in entrambe le direzioni.** L'estrazione funziona quando il flusso di dati è per lo più unidirezionale per chiamata (genitore → modulo → risposta → genitore). Quando entrambe le parti continuano a mutare lo stesso valore, la semantica dello snapshot crolla.

## La forma dell'estrazione

I moduli comunicano tramite passaggio di messaggi. Un genitore carica il modulo e gli invia dizionari:

```as
! Genitore
esegui `mod.as` come ModName
...
invia Input a ModName e assegna risposta a Output
```

Il modulo dichiara un gestore di messaggi, rilascia il genitore e attende:

```as
! Modulo
script Mod
... dichiarazioni di variabili ...

su messaggio vai a Handler
release parent
ferma

Handler:
    metti il messaggio in Input
    ! ... elabora ...
    invia Output a mittente
    ferma
```

`release parent` fa sì che l'`esegui` del genitore ritorni subito. Senza, il genitore si blocca su `esegui` aspettando che il figlio finisca — va bene se il modulo è usa-e-getta, inutile per un helper di lunga vita.

Vedi [moduli](../reference/modules.md) per il meccanismo completo.

## Pattern concorrente

Stessi meccanismi — `release parent`, `su messaggio`, `ferma` — ma il modulo possiede stato longevo e può pilotare il proprio DOM, task biforcati o cicli periodici. Usalo quando il modulo possiede un editor di fogli, un sotto-schermo o il proprio loop di eventi. Il confine è lo stesso; ciò che cambia è la struttura interna del modulo.

## Progettazione dell'interfaccia

Alcune linee guida che ripagano:

- **Un dizionario per direzione.** Input e output multivalore viaggiano come un unico dizionario, non come più variabili separate al confine.
- **Niente riferimenti vivi attraverso il confine.** Una volta che un valore attraversa, il ricevente può mutarlo liberamente; il mittente tiene la propria copia. Non dare per scontato che il genitore abbia ancora gli stessi dati al prossimo giro.
- **Il genitore mantiene la proprietà di rete / MQTT.** I moduli rimandano i risultati al genitore; il genitore fa la vera chiamata al server. Altrimenti ogni modulo duplicherebbe stato di connessione e credenziali.
- **Payload piccoli.** I record interi vanno bene. Interi alberi di layout a ogni clic no.

## Esempi svolti

Due pattern documentati in dettaglio nella skill `as-modularize`:

- **controller ↔ deviceControl** (dialetto Python) — l'estrazione canonica in stile subroutine.
- **shell ↔ map-to-rooms** (dialetto JS) — un'estrazione a trasformazione pura senza DOM, caricamento in due passi `rest ottieni` + `esegui`.

## Correlati

- [moduli](../reference/modules.md) — il meccanismo: `esegui`, `release parent`, `invia`, `su messaggio`, `esci`.
- [multitasking cooperativo](../reference/cooperative-multitasking.md) — i moduli rilasciati sono thread cooperativi.
- [scegliere la forma di una raccolta](picking-a-collection-shape.md) — per la linea guida del dizionario per direzione.
