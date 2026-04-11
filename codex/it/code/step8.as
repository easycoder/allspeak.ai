!   Il rettangolo rimbalzante

    language italiano

    div Contenitore
    div Rettangolo
    variabile Altezza
    variabile Angolo

    crea Contenitore
    imposta lo stile di Contenitore a
        `width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding:10px`

    crea Rettangolo in Contenitore
    imposta lo stile di Rettangolo a
       `position:relative;width:9%;border:1px solid gray;`
        cat `background:lightgray`
    imposta stile `top` di Rettangolo a `50%`
    imposta stile `height` di Rettangolo a `100px`

    attendi 2 secondi

    metti 0 in Angolo
    mentre Angolo è minore di 360
    inizio
        metti sin Angolo radius 100 in Altezza
        imposta stile `top` di Rettangolo a `calc(50% - ` cat Altezza cat `px)`
        imposta stile `height` di Rettangolo a `calc(100px + ` cat Altezza cat `px)`
        aggiungi 1 a Angolo
        attendi 5 milli
    fine

    ferma
