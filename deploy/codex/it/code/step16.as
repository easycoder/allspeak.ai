!   Mappa

    language italiano

    script DemoMappa

    div Pannello
    div Controlli
    div PannelloMappa
    span Span
    gmap Mappa
    variabile Chiave
    variabile Latitudine
    variabile Longitudine
    variabile Zoom

    rest ottieni Chiave da `/config/gmap-key.txt`
    oppure inizio
        avviso `Impossibile caricare la chiave API di Google Maps.`
        ferma
    fine

    metti `53.8291119` in Latitudine
    metti `-1.5381586` in Longitudine
    metti `17.0` in Zoom

    crea Pannello
    imposta lo stile di Pannello a
    	`width:100%;height:100%;display:flex;flex-direction:column`

    crea Controlli in Pannello
    imposta lo stile di Controlli a `height:3em;padding:4px`
    crea Span in Controlli
    imposta lo stile di Span a `font-size:120%`
    imposta il contenuto di Span a `Mappa dei luoghi del festival`

    crea PannelloMappa in Pannello
    imposta lo stile di PannelloMappa a `width:100%;flex:1`

    crea Mappa in PannelloMappa
    imposta la chiave di Mappa a Chiave
    imposta la latitudine di Mappa a Latitudine
    imposta la longitudine di Mappa a Longitudine
    imposta lo zoom di Mappa a Zoom
    mostra Mappa

    ferma
