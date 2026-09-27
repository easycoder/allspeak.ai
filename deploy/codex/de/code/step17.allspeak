!   Ziehen und Ablegen

    language deutsch

    script ZiehenAblegen

    div Behälter
    div Komponente
    variable WähleP
    variable ZiehP
    variable X
    variable Y
    variable VersatzX
    variable VersatzY

    erstelle Behälter
    setze stil `position` von Behälter zu `relative`

    erstelle Komponente in Behälter
    setze den stil von Komponente zu
        `position:absolute;left:1em;top:1em;cursor:default`
    setze den inhalt von Komponente zu `Dieser Text ist ziehbar`

    bei wähle Komponente
    beginn
        lege die wähle position in WähleP
        lege der versatz links von Komponente in VersatzX
        lege der versatz oben von Komponente in VersatzY
    ende

    bei ziehe
    beginn
        lege die ziehe position in ZiehP
        lege eigenschaft `x` von ZiehP in X
        lege eigenschaft `y` von ZiehP in Y
        subtrahiere eigenschaft `x` von WähleP von X
        subtrahiere eigenschaft `y` von WähleP von Y
        addiere VersatzX zu X
        addiere VersatzY zu Y
        setze stil `left` von Komponente zu X cat `px`
        setze stil `top` von Komponente zu Y cat `px`
    ende

    stoppe
