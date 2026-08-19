# Simboli e layout

AllSpeak ha una superficie lessicale volutamente piccola. **Quattro simboli di punteggiatura** portano significato; tutto il resto sono parole. I marcatori dei blocchi di documentazione aggiungono una quinta categoria lessicale per la prosa, sopra il livello di base.

Qualsiasi carattere non alfanumerico fuori da una stringa o un commento che non sia uno di questi è un errore di compilazione. Non ci sono parentesi tonde, né graffe, né quadre, né punti e virgola, né `+`, `=`, `*` infissi. Gli operatori sono parole chiave; il raggruppamento avviene tramite il layout, non la punteggiatura.

## I quattro simboli

| Simbolo | Significato |
|---------|-------------|
| `!` | Commento. Da `!` fino a fine riga viene ignorato. (Dentro una stringa con backtick, `!` è solo testo.) |
| `` ` `` | Delimitatore di stringa letterale. Coppie appaiate racchiudono testo costante, eventualmente su più righe. |
| `:` | Terminatore di etichetta. Una parola seguita da `:` all'inizio di una riga dichiara un'etichetta. |
| `-` | Prefisso di negazione su un letterale numerico: `-3`. Non esiste un `-` infisso; la sottrazione è la parola chiave `togli`. |

## Commenti

I commenti iniziano con `!` e arrivano fino a fine riga:

```as
! Questo è un commento.
aggiungi 1 a Counter   ! Commento a fine riga.
```

Usali per marcare i blocchi funzionali dello script. Non affidarti ai soli nomi di variabile per comunicare l'intento. I commenti a fine riga vanno bene dove la spiegazione non è ovvia; per qualcosa di più lungo di una frase, preferisci un blocco di documentazione (più sotto).

## Stringhe letterali

I backtick delimitano testo costante:

```as
metti `Ciao, mondo!` in Greeting
```

Una stringa con backtick può estendersi su più righe di sorgente:

```as
metti `riga 1
    `riga 2
    `riga 3` in Message
```

Ogni riga di continuazione inizia con un backtick dopo l'eventuale spazio iniziale. Lo spazio iniziale e il backtick di continuazione vengono tolti, e le righe sono unite senza newline. L'esempio qui sopra produce la stringa `riga 1riga 2riga 3`.

Non esiste una sintassi di escape dentro i backtick. Per includere un carattere newline, una tabulazione o un backtick letterale, usa le parole chiave di valore `newline`, `tabulazione` e `backtick` con `cat`:

```as
metti `Riga 1` cat newline cat `Riga 2` in Message
```

`newline`, `tabulazione` e `backtick` fanno parte di un insieme più ampio di parole chiave di valore nudo (che include anche `vuoto`, `now`/`timestamp`, `today`, `interruzione`, `uuid`); vedi [valori e tipi](values-and-types.md#special-value-keywords) per l'elenco completo. Vedi [stringhe e testo](strings-and-text.md) per i modelli di `cat`.

## Etichette

Un'etichetta è una parola seguita da `:` all'inizio di una riga:

```as
Loop:
    aggiungi 1 a Counter
    se Counter è minore di 10 vai a Loop
```

Le etichette sono le destinazioni di `vai a`, `vaisub` e delle registrazioni dei gestori di eventi (`su clic X vaisub Label`).

## Numeri

I letterali interi sono solo cifre. I numeri negativi si scrivono con un prefisso `-`:

```as
metti -3 in Offset
```

Non esistono letterali a virgola mobile a livello sintattico — i numeri che sembrano float (`3.14`) sono stringhe. Vedi [aritmetica](arithmetic.md) per il modello degli interi scalati.

## Marcatori dei blocchi di documentazione

Una categoria lessicale a parte, usata per la convenzione dei blocchi di documentazione piuttosto che per la semantica a runtime:

- `!!` apre e prosegue un blocco di documentazione. Ogni riga `!!` è un paragrafo di prosa.
- `!!!` (tre punti esclamativi) chiude il blocco.

```as
!! Breve spiegazione di che cosa fa questa sezione e perché.
!! Una riga !! nuda separa i paragrafi.
Section:
    ! il codice
    ritorna
!!!
```

I blocchi di documentazione vengono rimossi prima della compilazione. Convenzione completa in [blocchi di documentazione](doc-blocks.md).

## Layout

Il codice è strutturato dall'indentazione, non dalla punteggiatura.

- Le etichette iniziano al **margine sinistro** — colonna 1.
- Il codice sotto un'etichetta è indentato di una tabulazione.
- Il codice dentro `inizio … fine` è indentato di un'altra tabulazione, come i blocchi annidati negli altri linguaggi.

```as
Main:
    imposta Counter a 0
    mentre Counter è minore di 5 inizio
        aggiungi 1 a Counter
        stampa Counter
    fine
    ferma
```

Se preferisci che `inizio` e `fine` abbiano indentazioni abbinate — una preferenza comune presa in prestito da altri linguaggi — metti `inizio` su una riga sua:

```as
Main:
    imposta Counter a 0
    mentre Counter è minore di 5
    inizio
        aggiungi 1 a Counter
        stampa Counter
    fine
    ferma
```

Entrambe le forme compilano. Scegline una e usala in modo coerente in tutto lo script.

Il compilatore tollera gli spazi bianchi, ma un layout coerente è essenziale per la revisione. I blocchi disallineati sono un forte segnale di errore strutturale — soprattutto nel codice generato dall'IA.

## Righe vuote

Usa una riga vuota per separare i gruppi logici:

- Tra dichiarazioni di variabili di tipo diverso.
- Tra il gruppo principale di variabili e le variabili di servizio (`I`, `N`, `Temp`).
- Tra le sezioni etichettate principali.

Una riga vuota dice: «queste cose stanno insieme come gruppo, ma sono distinte dal gruppo successivo». Due o più non aggiungono significato, ma sono innocue.

## Nomi di variabile

I nomi iniziano con una lettera maiuscola; da lì in CamelCase. Le convenzioni complete sono in [variabili e array](variables-and-arrays.md) — questo file copre solo la regola lessicale.

## Vedi anche

- [struttura](structure.md) — dove si colloca questo livello lessicale nella pipeline di compilazione.
- [variabili e array](variables-and-arrays.md) — le convenzioni complete per i nomi.
- [stringhe e testo](strings-and-text.md) — costruire stringhe con `cat`.
- [blocchi di documentazione](doc-blocks.md) — `!!` e `!!!` in dettaglio.
- [aritmetica](arithmetic.md) — perché `-` è solo un prefisso numerico.
