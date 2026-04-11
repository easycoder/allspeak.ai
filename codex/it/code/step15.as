!   Lista della spesa 3

    language italiano

    script ListaSpesa3

    div Pannello
    div Riga
    button Ordinato
    button NonOrdinato
    button Filtrato
    variabile ListaOriginale
    variabile ListaVisualizzata
    variabile A
    variabile B
    variabile Risultato
    variabile N
    variabile Articolo

    metti vuoto in ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Pesce`
    imposta proprieta `price` di Articolo a 349
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Patate`
    imposta proprieta `price` di Articolo a 105
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Formaggio`
    imposta proprieta `price` di Articolo a 275
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Vino`
    imposta proprieta `price` di Articolo a 749
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Zucchero`
    imposta proprieta `price` di Articolo a 85
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Ananas`
    imposta proprieta `price` di Articolo a 93
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Latte`
    imposta proprieta `price` di Articolo a 85
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Uova`
    imposta proprieta `price` di Articolo a 125
    accoda Articolo a ListaOriginale
    imposta Articolo a oggetto
    imposta proprieta `name` di Articolo a `Burro`
    imposta proprieta `price` di Articolo a 185
    accoda Articolo a ListaOriginale

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
        ordina ListaVisualizzata con OrdinamentoPrezzo
        vaisub a Mostra
    fine

    crea Filtrato
    imposta lo stile di Filtrato a `margin:1em`
    imposta il testo di Filtrato a `Filtrato`
    su clic Filtrato
    inizio
        metti ListaOriginale in ListaVisualizzata
        filtra ListaVisualizzata con FiltroPrezzo
        ordina ListaVisualizzata con OrdinamentoPrezzo
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
        metti elemento N di ListaVisualizzata in Articolo
        imposta il contenuto di Riga a proprieta `name` di Articolo
    aggiungi 1 a N
    fine
    ritorna

FiltroPrezzo:
    metti arg `a` di ListaVisualizzata in A
    se proprieta `price` di A non è minore di 100 imposta Risultato
    altrimenti svuota Risultato
    imposta arg `v` di ListaVisualizzata a Risultato
    ferma

OrdinamentoPrezzo:
    metti arg `a` di ListaVisualizzata in A
    metti arg `b` di ListaVisualizzata in B
    se proprieta `price` di A è maggiore di proprieta `price` di B
        metti 1 in Risultato
    altrimenti se proprieta `price` di A è minore di proprieta `price` di B
        metti -1 in Risultato
    altrimenti metti 0 in Risultato
    imposta arg `v` di ListaVisualizzata a Risultato
    ferma
