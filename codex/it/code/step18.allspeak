    language italiano

  script Solitario

! La mappa della tavola.

  variabile Mappa
  imposta Mappa a
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0
    2 2 2 2 2 2 2
    2 2 2 1 2 2 2
    2 2 2 2 2 2 2
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Variabili.

  div Contenitore
  div Tavola
  div FineGioco
  div Grigio
  div Rosso
  variabile Larghezza
  variabile N
  variabile M
  variabile X
  variabile Y
  variabile R
  variabile C
  variabile S
  variabile Dimensione
  variabile Offset
  variabile Selezionato
  variabile Riga
  variabile Colonna
  variabile Valido
  variabile Indice
  variabile Su
  variabile Giu
  variabile Sinistra
  variabile Destra
  variabile PosPresa
  variabile PosTrascinamento
  variabile Sinistre
  variabile Alti
  variabile Destinazione

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Crea tutti gli elementi.
  crea Tavola

  imposta gli elementi di Grigio a 49
  imposta gli elementi di Rosso a 49
  imposta gli elementi di Sinistre a 49
  imposta gli elementi di Alti a 49

  se mobile
  inizio
    metti la larghezza di Tavola in Larghezza
    moltiplica Larghezza per 90
    dividi Larghezza per 100
    imposta stile `touch-action` di Tavola a `none`
  fine
  altrimenti
  inizio
    metti 500 in Larghezza
  fine
  imposta stile `width` di Tavola a Larghezza cat `px`
  imposta stile `height` di Tavola a Larghezza cat `px`
  imposta stile `background-size` di Tavola a Larghezza cat `px`
  imposta stile `margin` di Tavola a `2em auto 0 auto`
  imposta stile `border` di Tavola a `1px solid #888`
  imposta stile `border-radius` di Tavola a `50%`
  imposta stile `background-image` di Tavola a
  	`url('https://allspeak.software/public/skybg.jpg')`

  crea Contenitore in Tavola
  imposta lo stile di Contenitore a
  	`position:relative;width:100%,height:100%;margin:5%`

  moltiplica Larghezza per 90
  dividi Larghezza per 100
  dividi Larghezza per 7 dando S
  dividi S per 7 dando Dimensione
  moltiplica Dimensione per 6
  moltiplica Dimensione per 7 dando Offset
  togli Offset da Larghezza dando Offset
  dividi Offset per 14

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Disegna il layout iniziale della tavola.
  metti 0 in N
  mentre N è minore di 49
  inizio
    indice Mappa a N
    se Mappa non è 0
    inizio
      dividi N per 7 dando Riga
      moltiplica Riga per S dando Y
      aggiungi Offset a Y
      indice Alti a N
      metti Y in Alti
      metti N modulo 7 in Colonna
      moltiplica Colonna per S dando X
      aggiungi Offset a X
      indice Sinistre a N
      metti X in Sinistre
      indice Grigio a N
      crea Grigio in Contenitore
      imposta lo stile di Grigio a `position:absolute;left:` cat X cat `px;top:` cat Y
		cat `px;width:` cat Dimensione cat `px;height:` cat Dimensione cat `px;background:gray`
        cat `;border:1px solid darkgray;border-radius:50%`
      indice Rosso a N
      crea Rosso in Contenitore
      imposta lo stile di Rosso a `position:absolute;left:` cat X cat `px;top:` cat Y
		cat `px;width:` cat Dimensione cat `px;height:` cat Dimensione cat `px;background:red`
        cat `;border:1px solid darkred;border-radius:50%`
      se Mappa è 1 imposta stile `opacity` di Rosso a `0`
    fine
    aggiungi 1 a N
  fine
  su scegli Rosso vai a Prendi
  su trascina vai a Trascina
  su rilascia vai a Rilascia
  ferma

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Prendi una pedina
Prendi:
  svuota Valido
  metti la scegli posizione in PosPresa
  metti lo indice di Rosso in Indice
  metti -1 in Sinistra
  metti -1 in Destra
  metti -1 in Su
  metti -1 in Giu
! Ottieni la riga
  metti Indice modulo 7 in R
! Deve essere > 1 per poter andare a sinistra
  se R è maggiore di 1
  inizio
    togli 2 da Indice dando N
    indice Mappa a N
    se Mappa è 1
    inizio
      aggiungi 1 a N dando M
      indice Mappa a M
      se Mappa è 2 metti N in Sinistra
    fine
  fine
! Deve essere < 5 per poter andare a destra
  se R è minore di 5
  inizio
  	aggiungi 2 a Indice dando N
    indice Mappa a N
    se Mappa è 1
    inizio
	  togli 1 da N dando M
      indice Mappa a M
      se Mappa è 2 metti N in Destra
    fine
  fine
  togli 14 da Indice dando N
! N deve essere >= 0 per andare su
  se N non è minore di 0
  inizio
  	indice Mappa a N
    se Mappa è 1
    inizio
      aggiungi 7 a N dando M
      indice Mappa a M
      se Mappa è 2 metti N in Su
    fine
  fine
  aggiungi 14 a Indice dando N
! N deve essere < 49 per andare giù
  se N è minore di 49
  inizio
  	indice Mappa a N
    se Mappa è 1
    inizio
      togli 7 da N dando M
      indice Mappa a M
      se Mappa è 2 metti N in Giu
    fine
  fine
! Se qualsiasi mossa è possibile seleziona questa pedina
  se Sinistra non è -1 vai a Seleziona
  se Destra non è -1 vai a Seleziona
  se Su non è -1 vai a Seleziona
  se Giu non è -1 vai a Seleziona
  ferma

Seleziona:
  imposta stile `z-index` di Rosso a 10
  imposta stile `background` di Rosso a `orange`
  metti lo indice di Rosso in Selezionato
  ferma

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Trascina la pedina
Trascina:
  se non Selezionato ferma
  metti la trascina posizione in PosTrascinamento
  metti proprieta `x` di PosTrascinamento in X
  metti proprieta `y` di PosTrascinamento in Y
  togli proprieta `x` di PosPresa da X
  togli proprieta `y` di PosPresa da Y
  indice Sinistre a Selezionato
  indice Alti a Selezionato
  aggiungi Sinistre a X
  aggiungi Alti a Y
  imposta stile `left` di Rosso a X cat `px`
  imposta stile `top` di Rosso a Y cat `px`
  se Sinistra non è -1
  inizio
	indice Grigio a Sinistra
    se elemento Grigio racchiude PosTrascinamento vai a MostraValido
  fine
  se Destra non è -1
  inizio
	indice Grigio a Destra
    se elemento Grigio racchiude PosTrascinamento vai a MostraValido
  fine
  se Su non è -1
  inizio
	indice Grigio a Su
    se elemento Grigio racchiude PosTrascinamento vai a MostraValido
  fine
  se Giu non è -1
  inizio
	indice Grigio a Giu
    se elemento Grigio racchiude PosTrascinamento vai a MostraValido
  fine
  svuota Valido
  imposta stile `background` di Grigio a `gray`
  ferma

MostraValido:
  metti lo indice di Grigio in Destinazione
  imposta stile `background` di Grigio a `yellow`
  imposta Valido
  ferma

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Rilascia la pedina
Rilascia:
  se non Selezionato ferma
  se Valido
  inizio
    indice Sinistre a Selezionato
    indice Alti a Selezionato
    imposta stile `left` di Rosso a Sinistre cat `px`
    imposta stile `top` di Rosso a Alti cat `px`
    metti Selezionato in N
    vaisub a Rimuovi
  	indice Rosso a Destinazione
    indice Sinistre a Destinazione
    indice Alti a Destinazione
    imposta stile `left` di Rosso a Sinistre cat `px`
    imposta stile `top` di Rosso a Alti cat `px`
    metti Destinazione in N
    vaisub a Piazza
    aggiungi Destinazione a Selezionato dando N
    dividi N per 2
    vaisub a Rimuovi
  fine
  altrimenti
  inizio
  	metti Selezionato in N
    indice Sinistre a N
    indice Alti a N
    imposta stile `left` di Rosso a Sinistre cat `px`
    imposta stile `top` di Rosso a Alti cat `px`
    vaisub a Piazza
  fine
  imposta stile `z-index` di Rosso a 1
  svuota Selezionato
  vai a ControllaSeFinito

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Piazza una pedina
Piazza:
  indice Mappa a N
  indice Rosso a N
  indice Grigio a N
  metti 2 in Mappa
  imposta stile `opacity` di Rosso a `1`
  imposta stile `background` di Rosso a `red`
  imposta stile `background` di Grigio a `gray`
  ritorna

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Rimuovi una pedina
Rimuovi:
   indice Mappa a N
   indice Rosso a N
   metti 1 in Mappa
   imposta stile `opacity` di Rosso a `0`
   ritorna

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Controlla se ci sono ancora mosse possibili.
ControllaSeFinito:
  metti 0 in N
  mentre N è minore di 49
  inizio
    indice Mappa a N
    se Mappa è 2
    inizio
      dividi N per 7 dando Riga
      metti N modulo 7 in Colonna
      ! Prova a sinistra
      togli 1 da Colonna dando C
      se C non è minore di 0
      inizio
        moltiplica Riga per 7 dando M
        aggiungi C a M
        indice Mappa a M
        se Mappa è 2
        inizio
          togli 1 da C
          se C non è minore di 0
          inizio
            moltiplica Riga per 7 dando M
            aggiungi C a M
            indice Mappa a M
            se Mappa è 1 ferma
          fine
        fine
      fine
      ! Prova a destra
      aggiungi 1 a Colonna dando C
      se C è minore di 7
      inizio
        moltiplica Riga per 7 dando M
        aggiungi C a M
        indice Mappa a M
        se Mappa è 2
        inizio
          aggiungi 1 a C
          se C è minore di 7
          inizio
            moltiplica Riga per 7 dando M
            aggiungi C a M
            indice Mappa a M
            se Mappa è 1 ferma
          fine
        fine
      fine
      ! Prova su
      togli 1 da Riga dando R
      se R non è minore di 0
      inizio
        moltiplica R per 7 dando M
        aggiungi Colonna a M
        indice Mappa a M
        se Mappa è 2
        inizio
          togli 1 da R
          se R non è minore di 0
          inizio
            moltiplica R per 7 dando M
            aggiungi Colonna a M
            indice Mappa a M
            se Mappa è 1 ferma
          fine
        fine
      fine
      ! Prova giù
      aggiungi 1 a Riga dando R
      se R è minore di 7
      inizio
        moltiplica R per 7 dando M
        aggiungi Colonna a M
        indice Mappa a M
        se Mappa è 2
        inizio
          aggiungi 1 a R
          se R è minore di 7
          inizio
            moltiplica R per 7 dando M
            aggiungi Colonna a M
            indice Mappa a M
            se Mappa è 1 ferma
          fine
        fine
      fine
    fine
    aggiungi 1 a N
  fine
  crea FineGioco
  imposta lo stile di FineGioco a `text-align:center`
  imposta il contenuto di FineGioco a `Partita finita - non ci sono più mosse possibili`
  ferma
