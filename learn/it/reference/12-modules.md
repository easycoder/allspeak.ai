# Moduli

Un modulo è uno script AllSpeak caricato ed eseguito da un altro script AllSpeak. Il genitore può chiamarlo come una subroutine, eseguirlo in parallelo come un altro thread cooperativo, o entrambe le cose. I moduli hanno variabili private proprie e un proprio namespace di etichette; la comunicazione con il genitore avviene tramite il passaggio di messaggi.

Per i criteri di progettazione e gli esempi svolti su *quando* estrarre un modulo, vedi [estrarre un modulo](../idioms/extracting-a-module.md). Questa pagina copre il meccanismo.

## La variabile di modulo

Un modulo viene referenziato tramite una variabile di tipo `modulo`:

```as
modulo DeviceController
```

La variabile parte vuota. `esegui` vi carica uno script.

## `esegui`

`esegui` carica, compila e avvia lo script. La sintassi differisce tra i dialetti.

**Python** — l'argomento è un percorso; il runtime apre e compila il file:

```as
esegui `deviceControl.as` come DeviceController
```

**JS** — l'argomento è una variabile che contiene il testo sorgente. Recuperalo prima con `rest ottieni`:

```as
variabile ModuleSrc
rest ottieni ModuleSrc da `resources/as/device-control.as?v=` cat now
    o vai a LoadFailed
esegui ModuleSrc come DeviceController
```

In entrambi i dialetti, dopo `esegui` lo script figlio inizia a eseguire. Di default il genitore si blocca su `esegui` finché il figlio non raggiunge `esci` o non lo rilascia esplicitamente con `release parent`.

## `release parent`

Se il modulo chiama `release parent`, il `esegui` del genitore ritorna subito e il modulo diventa un thread cooperativo separato accanto al genitore:

```as
! Modulo
su messaggio vai a Handler
release parent          ! il `esegui` del genitore ritorna da qui
ferma                   ! mettiti in attesa e aspetta i messaggi
```

Senza `release parent`, il genitore resta bloccato finché il modulo non esce. È la differenza tra usare un modulo come aiuto sincrono (senza rilascio) e come collaboratore longevo che coesiste con il genitore (rilasciato). La coesistenza non implica che entrambi siano attivi: un modulo rilasciato che sta solo aspettando il prossimo messaggio conta comunque. Sta a chi chiama `invia` decidere se aspettare una risposta o andare avanti.

## Passaggio di messaggi

Dopo il rilascio, genitore e figlio comunicano tramite messaggi. Il genitore invia:

```as
invia InputDict a Helper
invia InputDict a Helper e assegna risposta a OutputDict
```

Entrambe le forme inviano il valore (di solito un dizionario). La seconda forma attende che il modulo chiami `invia … a mittente`, poi assegna la risposta.

Il modulo dichiara un gestore di messaggi una sola volta, vicino all'inizio:

```as
su messaggio vai a Handler

Handler:
    metti il messaggio in InputDict
    ! ... fai il lavoro ...
    invia ResultDict a mittente
    ferma
```

È valido anche scrivere il gestore come un blocco `inizio … fine` subito dopo `su messaggio`, ma un blocco con un'etichetta propria di solito si legge più chiaramente.

Dentro il gestore:

- **`metti il messaggio in X`** legge il messaggio in arrivo in X.
- **`invia Y a mittente`** rimanda un valore allo script che ha inviato il messaggio originale.
- **`ferma` (non `ritorna`)** termina il thread del gestore e aspetta il messaggio successivo. `ritorna` può essere usato solo per chiudere un blocco raggiunto tramite `vaisub`; usarlo altrove farà rilevare al runtime uno stack corrotto e lanciare un'eccezione.

La stessa forma funziona in ogni direzione: un modulo può fare `invia` al suo `genitore`, a `mittente`, o a un altro modulo che ha caricato lui stesso; i genitori possono avere un loro gestore `su messaggio vai a …`. I termini «genitore» e «figlio» non implicano una gerarchia: entrambi hanno diritti e capacità uguali. L'unica eccezione è il diritto che il modulo primario (di livello superiore) ha di spegnere l'applicazione.

## `esci`

Quando un modulo ha finito, chiama `esci`. Questo:

- Termina il thread del modulo.
- Restituisce il controllo al genitore, se il genitore era bloccato su `esegui`.
- Rilascia tutta la memoria di runtime del modulo per la garbage collection.

L'ultimo punto conta: un'applicazione può accumulare molte funzionalità sparse su molti moduli senza tenere in memoria quelli inutilizzati.

Per un modulo concorrente longevo che gestisce messaggi all'infinito, di solito non fai `esci`: il gestore fa `ferma` e aspetta per sempre.

## Stato privato e namespace

Dentro un modulo tutte le variabili sono private. Due moduli che dichiarano ciascuno un `Counter` hanno ciascuno il proprio. Le variabili del genitore sono invisibili al modulo, a meno che non vengano esportate esplicitamente con `con` e importate con `importa` (prossima sezione).

Anche i **namespace delle etichette** sono indipendenti per ciascun modulo. Una subroutine di supporto come `ParseDate` usata sia nel genitore sia nel figlio deve essere duplicata — una copia in ogni script — oppure vivere in un modulo suo, che genitore e figlio istanziano ed eseguono indipendentemente. Il costo della separazione è reale; l'alternativa (tutto condiviso) andrebbe contro lo scopo.

## `con` e `importa`

Per condividere variabili oltre il confine, il genitore esporta con `con` al momento di `esegui`, e il modulo importa i nomi corrispondenti in cima al proprio script:

```as
! Genitore
esegui Script come MyModule con Specification e MainPanel
```

```as
! Modulo
script ModuleName
importa variabile Specification e div MainPanel
```

I nomi e i tipi devono corrispondere su entrambi i lati, e i nomi importati non devono scontrarsi con le variabili dichiarate dal modulo stesso. Le modifiche fatte da un lato si vedono dall'altro: sono riferimenti condivisi, non copie.

## La riga `script`

Per convenzione, un file modulo inizia con una dichiarazione `script` che si dà un nome:

```as
script DeviceController
```

È informativa: imposta il nome del programma per i log e le diagnostiche. È opzionale; gli script che non sono moduli spesso la omettono.

## Vedi anche

- [multitasking cooperativo](cooperative-multitasking.md) — `release parent` rende il modulo un thread cooperativo.
- [estrarre un modulo](../idioms/extracting-a-module.md) — quando e come dividere uno script (usa la skill `as-modularize`).
- [REST e asincrono](../idioms/rest-and-async.md) — il pattern recupera-poi-esegui del dialetto JS.
