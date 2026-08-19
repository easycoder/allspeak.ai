# Variabili e array

Le variabili in AllSpeak sono contenitori. Una variabile può contenere un valore (numero, stringa, booleano) o rappresentare un'entità (un elemento DOM, un file, un modulo). Ogni dominio — Core, Browser, REST, MQTT, i domini plugin — definisce i propri tipi di variabile con il proprio vocabolario.

## Nomi e ambito

- I nomi di variabile iniziano con una lettera maiuscola. Il camel case va bene — `Counter`, `UserName`, `MessageList`.
- Tutte le variabili sono globali. AllSpeak non ha scope a blocchi né variabili locali a una funzione. L'unico modo per avere stato privato è eseguire un modulo figlio (vedi [moduli](modules.md)).
- Chiama le variabili per quello che contengono, non per come vengono usate. Un pulsante che rappresenta l'azione principale è `PrimaryButton`, non `Btn1`.
- Raggruppa le variabili per tipo e per funzione, non in ordine alfabetico.
- Le variabili di servizio — riutilizzabili di breve vita come `I`, `N`, `Temp` — vanno raggruppate insieme e separate dalle variabili principali con una riga vuota.

## Tutte le variabili sono array

Ogni variabile è un array. Di default ha un solo elemento, quindi per la maggior parte del tempo puoi ignorare del tutto la natura di array:

```as
variabile Counter
metti 0 in Counter        ! Counter[0] = 0
aggiungi 1 a Counter          ! Counter[0] = 1
```

Quando ti servono più slot, fai crescere l'array con `imposta gli elementi di`:

```as
imposta gli elementi di Counter a 5    ! Counter ora ha 5 slot, [0]..[4]
```

Far crescere preserva i contenuti esistenti; ridurre perde i valori con indice alto.

## Il modello del cursore

L'accesso a un elemento specifico avviene tramite un puntatore interno impostato con `indice`:

```as
indice Counter a 2
metti 42 in Counter       ! scrive in Counter[2]
```

Una volta indicizzata, la variabile si comporta come se avesse un solo elemento. **Non esiste altra sintassi per l'accesso indicizzato** — niente notazione `Counter[2]`, niente `elemento 2 di Counter`. Il cursore è l'unica via d'accesso, simile ai cursori di SQL. È voluto: la maggior parte del codice può ignorare che gli array esistano, e il codice che ne ha bisogno è costretto a essere esplicito su quale elemento tocca.

### Leggere la posizione del cursore

Per scoprire su quale slot si trova il cursore, usa `l indice di`:

```as
metti l indice di Counter in N    ! N = numero dello slot corrente
```

Viene usato spesso dentro i gestori di clic per identificare quale elemento dell'array è stato cliccato (vedi [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md)).

## Errori comuni con il modello del cursore

### ❌ L'inverso sbagliato: `metti N in indice di X`

Le sintassi di lettura e scrittura **non sono simmetriche**:

```as
metti l indice di X in N      ! ✅ lettura — forma a parola chiave "l indice di X"
indice X a N                   ! ✅ scrittura — comando, non una metti
```

Un inverso naturale ma **sbagliato** è:

```as
metti N in indice di X          ! ❌ non valido — indice non è una proprietà in cui mettere
```

La forma di scrittura è sempre `indice X a N` — non esiste una forma `metti … in indice di X`.

### ❌ Indicizzare oltre la dimensione

Ogni variabile inizia con esattamente un elemento (lo slot 0). Prima di chiamare `indice X a N` con N > 0, devi prima far crescere l'array:

```as
imposta gli elementi di X a 10    ! slot [0]..[9]
indice X a 5                   ! ✅ sicuro
```

Il sintomo più comune di un `imposta gli elementi di` mancante è un errore a runtime quando si tenta `indice X a 1` su una variabile a un solo slot.

### ❌ Impostare il cursore dopo aver creato l'elemento

Quando costruisci elementi DOM in un array, imposta il cursore **prima** di `crea`:

```as
indice DataRowDivs a I         ! ✅ imposta il cursore prima
crea DataRowDivs in LogBody   ! l'elemento va nello slot I
```

Creare senza impostare prima il cursore scrive sempre nello slot corrente (per default lo slot 0), sovrascrivendo qualsiasi elemento precedente.

### ❌ Mescolare il modello del cursore con l'accesso agli array JSON

`indice X a N` indirizza **gli slot di X** (l'array proprio della variabile). Non ha nulla a che fare con `elemento N di X` (che legge dentro un valore JSON contenuto nello slot corrente). Non si sovrappongono mai:

```as
indice X a 0                   ! cursore allo slot 0
metti `[10, 20, 30]` in X       ! lo slot 0 ora contiene un array JSON
metti elemento 1 di X in N      ! N = 20 (dentro il valore JSON)
```

Un errore AI comune è trattare `elemento N di X` come destinazione di scrittura: `metti V in elemento N di X`. **Non è AllSpeak valido** — le uniche destinazioni di `metti` sono `in {variabile}` e `in archivio`. Il modello corretto per scrivere in uno slot di array è `indice X a N` e poi `metti V in X`. La parola chiave `elemento` serve per *leggere* dagli array JSON contenuti dentro uno slot, non per scrivere negli slot di variabile.

Vedi [collezioni](collections.md) per approfondire.

## Tipi misti in un array

Gli elementi di un array sono indipendenti. Una singola variabile può contenere un numero in uno slot e una stringa in un altro — anche se farlo di solito segnala un'occasione di modellazione mancata (vedi [scegliere la forma di una collezione](../idioms/picking-a-collection-shape.md)).

## Quando ricorrere agli array

Il segnale più chiaro è **più variabili che fanno più o meno la stessa cosa**. Tre pulsanti chiamati `SaveButton`, `LoadButton`, `QuitButton` che condividono tutti gestori e stili vogliono essere un unico array `Button` di 3 elementi. Questo vale per gli elementi DOM come per i dati scalari — gli array di `div`, `input`, `bottone` sono routine in qualsiasi UI non banale.

Se ti ritrovi a chiamare le variabili `Item1`, `Item2`, `Item3`: fermati, usa un array.

Nota: dichiarare `div X` **non** limita X alle sole operazioni DOM — resta una variabile AllSpeak che supporta l'intero modello del cursore (`indice`, `imposta gli elementi di`). Il prefisso `div` controlla solo che tipo di elemento produce `crea X`.

## Il tipo `variabile`

`variabile` è l'unica forma debolmente tipizzata: può contenere valori numerici, stringhe o booleani, con conversione quasi del tutto automatica. Gli altri tipi — `file`, `bottone`, `dictionary`, handle di modulo — sono severi su che cosa accettano.

## JS contro Python

Entrambe le implementazioni seguono lo stesso modello per variabili scalari e array. Divergono sulle collezioni: Python espone `dictionary` e `list` come forme tipizzate distinte; JS unifica l'archiviazione come stringhe e converte in oggetti all'ingresso e all'uscita. Vedi [collezioni](collections.md) per le implicazioni.

## Vedi anche

- [collezioni](collections.md) — quando un elemento dell'array dovrebbe essere a sua volta un dizionario o una lista.
- [scegliere la forma di una collezione](../idioms/picking-a-collection-shape.md) — come scegliere tra array, dict e lista.
- [gestori di eventi e indice di array](../idioms/event-handlers-and-array-index.md) — come i gestori di eventi scoprono quale elemento dell'array ha scattato.
