!   Schwenken und Zoomen

    language deutsch

    script SchwenkZoom

    div Div
    animation Anim
    variable Spec
    variable SeitenB
    variable SeitenH
    variable Breite
    variable Höhe
    variable Artikel
    variable Fertig

    lege 16 in SeitenB
    lege 9 in SeitenH

    setze Spec zu objekt
    setze eigenschaft `type` von Spec zu `panzoom`
    setze eigenschaft `width` von Spec zu `100%`
    setze eigenschaft `height` von Spec zu `100%`
    setze eigenschaft `url` von Spec zu `/resources/img/demo3.jpg`
    setze eigenschaft `steps` von Spec zu 100
    setze eigenschaft `trigger` von Spec zu 100
    setze Artikel zu objekt
    setze eigenschaft `left` von Artikel zu 30
    setze eigenschaft `top` von Artikel zu 37
    setze eigenschaft `width` von Artikel zu 20
    setze eigenschaft `start` von Spec zu Artikel
    setze Artikel zu objekt
    setze eigenschaft `left` von Artikel zu 0
    setze eigenschaft `top` von Artikel zu 0
    setze eigenschaft `width` von Artikel zu 100
    setze eigenschaft `finish` von Spec zu Artikel

!   Breite und Höhe ermitteln
    erstelle Div
    setze stil `margin` von Div zu `1em 0 0 5%`
    setze stil `width` von Div zu `90%`
    lege die breite von Div in Breite
    multipliziere Breite mit SeitenH ergibt Höhe
    dividiere Höhe durch SeitenB
    setze stil `height` von Div zu Höhe cat `px`

!   Komponenten erstellen
    erstelle Anim in Div
    setze stil `width` von Anim zu `100%`
    setze stil `height` von Anim zu Höhe cat `px`
    setze die spezifikation von Anim zu Spec
    bei auslöser Anim setze Fertig

    warte 2

!   Animation starten
    leere Fertig
    starte Anim
    solange nicht Fertig
    beginn
        schritt Anim
        warte 5 ticks
    ende
    drucke `Fertig`
    stoppe
