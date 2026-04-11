!   Interattività di base

    language italiano

    div Contenitore
    div Bottone
    a Link
    variabile Conteggio
    variabile N
    variabile Cliccato

    metti prompt `Quanti bottoni?` con `5` in Conteggio
    imposta gli elementi di Link a Conteggio
    imposta gli elementi di Cliccato a Conteggio

!   Inizializza i bottoni
    metti 0 in N
    mentre N è minore di Conteggio
    inizio
        indice Cliccato a N
        svuota Cliccato
        aggiungi 1 a N
    fine

    crea Contenitore

!   Ridisegna lo schermo ogni volta che l'utente clicca un bottone
Ridisegna:
    svuota Contenitore
    metti 0 in N
    mentre N è minore di Conteggio
    inizio
        indice Link a N
        indice Cliccato a N
        crea Bottone in Contenitore
        imposta lo stile di Bottone a
            `margin:0.5em 0 0 2em;border:1px solid red;`
            cat `padding:0.5em;width:10em;text-align:center`
        aggiungi 1 a N
        se Cliccato imposta il contenuto di Bottone a `Fatto`
        altrimenti
        inizio
            crea Link in Bottone
            imposta il contenuto di Link a `Bottone ` cat N
        fine
    fine
    su clic Link
    inizio
        indice Cliccato a lo indice di Link
        imposta Cliccato
        vai a Ridisegna
    fine

    ferma
