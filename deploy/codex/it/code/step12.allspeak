    language italiano

  script Tris

  div Pannello
  div Tavola
  div Riga
  div Cella
  div Messaggio
  variabile Modello
  variabile Indice
  variabile Turno
  variabile Mosse
  variabile Vincitore
  variabile Punteggio
  variabile CombinazioniVincenti

! Inizializzazione
  imposta gli elementi di Cella a 9
  imposta gli elementi di Modello a 9
  svuota Turno
  metti 0 in Mosse
  metti vuoto in Vincitore
  imposta CombinazioniVincenti a
    0 1 2
    3 4 5
    6 7 8
    0 3 6
    1 4 7
    2 5 8
    0 4 8
    2 4 6

! Prepara la tavola
  crea Pannello
  crea Messaggio in Pannello
  imposta il contenuto di Messaggio a `Clicca per fare la tua mossa`
  crea Tavola in Pannello
  imposta stile `font-size` di Tavola a `24px`
  metti 0 in Indice
  mentre Indice è minore di 9
  inizio
    se Indice modulo 3 è 0
    inizio
      crea Riga in Tavola
      imposta lo stile di Riga a `width:105px;height:34px`
    fine
    indice Cella a Indice
    crea Cella in Riga
    imposta stile `display` di Cella a `inline-block`
    imposta stile `border` di Cella a `1px solid gray`
    imposta stile `float` di Cella a `left`
    imposta stile `font-size` di Cella a `24px`
    imposta stile `font-weight` di Cella a `bold`
    imposta stile `line-height` di Cella a `34px`
    imposta stile `width` di Cella a `34px`
    imposta stile `height` di Cella a `34px`
    imposta stile `margin-right` di Cella a `-1px`
    imposta stile `margin-top` di Cella a `-1px`
    imposta stile `padding` di Cella a `0`
    imposta stile `text-align` di Cella a `center`
    indice Modello a Indice
    metti 0 in Modello
    aggiungi 1 a Indice
  fine
  su clic Cella
  inizio
    se Mosse è 9 ferma
    se Vincitore ferma
    metti lo indice di Cella in Indice
    indice Modello a Indice
    se Modello non è 0 ferma
    se Turno
    inizio
      metti 1 in Modello
      imposta il contenuto di Cella a `X`
    fine
    altrimenti
    inizio
      metti -1 in Modello
      imposta il contenuto di Cella a `O`
    fine
    vaisub a ControllaVincitore
    se Vincitore
    inizio
      imposta il contenuto di Messaggio a `Il vincitore è ` cat Vincitore
      ferma
    fine
    inverti Turno
    aggiungi 1 a Mosse
    se Mosse è 9
    inizio
      imposta il contenuto di Messaggio a `Pareggio - nessun vincitore`
      ferma
    fine
  fine
  ferma

ControllaVincitore:
  metti 0 in Indice
  mentre Indice è minore di 24
  inizio
    metti 0 in Punteggio
    indice CombinazioniVincenti a Indice
    indice Modello a CombinazioniVincenti
    aggiungi Modello a Punteggio
    aggiungi 1 a Indice
    indice CombinazioniVincenti a Indice
    indice Modello a CombinazioniVincenti
    aggiungi Modello a Punteggio
    aggiungi 1 a Indice
    indice CombinazioniVincenti a Indice
    indice Modello a CombinazioniVincenti
    aggiungi Modello a Punteggio
    aggiungi 1 a Indice
    se Punteggio è -3
    inizio
      metti `O` in Vincitore
      ritorna
    fine
    se Punteggio è 3
    inizio
      metti `X` in Vincitore
      ritorna
    fine
  fine
  ritorna
