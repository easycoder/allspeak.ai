!   Die Mexikanische Welle

    language deutsch

    script Welle

    div Behälter
    div Rechteck
    variable Höhe
    variable Winkel
    variable Beginn
    variable Fertig
    variable AlleFertig
    variable Zeit
    variable N
    variable NRecht

    lege 10 in NRecht

    erstelle Behälter
    setze den stil von Behälter zu
        `position:relative;width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding-bottom:10px;text-align:center`

    setze die elemente von Rechteck zu NRecht
    setze die elemente von Winkel zu NRecht
    setze die elemente von Beginn zu NRecht
    setze die elemente von Fertig zu NRecht

    lege 0 in N
    solange N ist kleiner als NRecht
    beginn
        ! Rechtecke initialisieren
        indexiere Rechteck zu N
        erstelle Rechteck in Behälter
        setze den stil von Rechteck zu
           `position:absolute;width:9%;background:peru;`
            cat `display:inline-block;margin-left:0.5%`
        setze stil `top` von Rechteck zu 200
        setze stil `left` von Rechteck zu `calc(10% * ` cat N cat `)`
        setze stil `height` von Rechteck zu `1px`
        addiere 1 zu N
    ende

Schleife:
    warte 2 sekunden

    lege 0 in N
    solange N ist kleiner als NRecht
    beginn
        ! Winkel usw. initialisieren
        indexiere Winkel zu N
        indexiere Beginn zu N
        indexiere Fertig zu N
        lege 0 in Winkel
        lege N in Beginn
        multipliziere Beginn mit 10
        leere Fertig
        addiere 1 zu N
    ende

    lege 0 in Zeit
    solange wahr
    beginn
        setze AlleFertig
        lege 0 in N
        solange N ist kleiner als NRecht
        beginn
            indexiere Rechteck zu N
            indexiere Winkel zu N
            indexiere Beginn zu N
            indexiere Fertig zu N
            wenn nicht Fertig
            beginn
                leere AlleFertig ! noch nicht fertig
                wenn Zeit ist größer als Beginn
                beginn
                    lege cos Winkel radius 100 in Höhe
                    negiere Höhe
                    setze stil `top` von Rechteck zu `calc(50% - ` cat Höhe cat `px)`
                    setze stil `height` von Rechteck zu `calc(100px + ` cat Höhe cat `px)`
                    addiere 1 zu Winkel
                    wenn Winkel ist größer als 360 setze Fertig
                ende
            ende
            addiere 1 zu N
        ende
        addiere 1 zu Zeit
        warte 5 millis
        wenn AlleFertig gehe Schleife
    ende
    stoppe
