!   Lista della spesa

    language italiano

    script ListaSpesa

    div Pannello
    div Riga
    button Ordinato
    button NonOrdinato
    variabile ListaOriginale
    variabile ListaVisualizzata
    variabile A
    variabile B
    variabile Risultato
    variabile N

    metti vuoto in ListaOriginale
    accoda `Pesce` a ListaOriginale
    accoda `Patate` a ListaOriginale
    accoda `Formaggio` a ListaOriginale
    accoda `Vino` a ListaOriginale
    accoda `Zucchero` a ListaOriginale
    accoda `Ananas` a ListaOriginale
    accoda `Latte` a ListaOriginale
    accoda `Uova` a ListaOriginale
    accoda `Burro` a ListaOriginale

    crea Pannello
    imposta lo stile di Pannello a `border:1px solid black;margin:1em;padding:1em`

    crea NonOrdinato
    imposta lo stile di NonOrdinato a `margin:1em`
    imposta il testo di NonOrdinato a `Non ordinato`
    su clic NonOrdinato vai a MostraNonOrdinato

    crea Ordinato
    imposta lo stile di Ordinato a `margin:1em`
    imposta il testo di Ordinato a `Ordinato`
    su clic Ordinato
    inizio
        metti ListaOriginale in ListaVisualizzata
        ordina ListaVisualizzata con OrdinamentoAlfabetico
        vaisub a Mostra
    fine

MostraNonOrdinato:
    metti ListaOriginale in ListaVisualizzata
    vaisub a Mostra

    ferma

Mostra:
    svuota Pannello
    metti 0 in N
    mentre N è minore di il json conteggio di ListaVisualizzata
    inizio
        crea Riga in Pannello
        imposta il contenuto di Riga a elemento N di ListaVisualizzata
        aggiungi 1 a N
    fine
	ritorna

OrdinamentoAlfabetico:
    metti arg `a` di ListaVisualizzata in A
    metti arg `b` di ListaVisualizzata in B
    se A è maggiore di B metti 1 in Risultato
    altrimenti se A è minore di B metti -1 in Risultato
    altrimenti metti 0 in Risultato
    imposta arg `v` di ListaVisualizzata a Risultato
    ferma
