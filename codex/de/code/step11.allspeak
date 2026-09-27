!   Einfache Interaktivität

    language deutsch

    div Behälter
    div Knopf
    a Verweis
    variable Anzahl
    variable N
    variable Geklickt

    lege eingabeaufforderung `Wie viele Knöpfe?` mit `5` in Anzahl
    setze die elemente von Verweis zu Anzahl
    setze die elemente von Geklickt zu Anzahl

!   Knöpfe initialisieren
    lege 0 in N
    solange N ist kleiner als Anzahl
    beginn
        indexiere Geklickt zu N
        leere Geklickt
        addiere 1 zu N
    ende

    erstelle Behälter

!   Bildschirm jedes Mal neu zeichnen, wenn der Benutzer einen Knopf klickt
NeuZeichne:
    leere Behälter
    lege 0 in N
    solange N ist kleiner als Anzahl
    beginn
        indexiere Verweis zu N
        indexiere Geklickt zu N
        erstelle Knopf in Behälter
        setze den stil von Knopf zu
            `margin:0.5em 0 0 2em;border:1px solid red;`
            cat `padding:0.5em;width:10em;text-align:center`
        addiere 1 zu N
        wenn Geklickt setze den inhalt von Knopf zu `Fertig`
        sonst
        beginn
            erstelle Verweis in Knopf
            setze den inhalt von Verweis zu `Knopf ` cat N
        ende
    ende
    bei klick Verweis
    beginn
        indexiere Geklickt zu der index von Verweis
        setze Geklickt
        gehe zu NeuZeichne
    ende

    stoppe
