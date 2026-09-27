!	Trascina e rilascia

    language italiano

	script TrascinaRilascia

    div Contenitore
    div Componente
    variabile PosPresa
    variabile PosTrascinamento
    variabile X
    variabile Y
    variabile OffsetX
    variabile OffsetY

    crea Contenitore
    imposta stile `position` di Contenitore a `relative`

    crea Componente in Contenitore
    imposta lo stile di Componente a
    	`position:absolute;left:1em;top:1em;cursor:default`
	imposta il contenuto di Componente a `Questo testo è trascinabile`

    su scegli Componente
    inizio
		metti la scegli posizione in PosPresa
        metti lo offset sinistra di Componente in OffsetX
        metti lo offset alto di Componente in OffsetY
    fine

    su trascina
    inizio
		metti la trascina posizione in PosTrascinamento
        metti proprieta `x` di PosTrascinamento in X
        metti proprieta `y` di PosTrascinamento in Y
        togli proprieta `x` di PosPresa da X
        togli proprieta `y` di PosPresa da Y
        aggiungi OffsetX a X
        aggiungi OffsetY a Y
        imposta stile `left` di Componente a X cat `px`
        imposta stile `top` di Componente a Y cat `px`
    fine

    ferma
