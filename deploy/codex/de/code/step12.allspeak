    language deutsch

    script TicTacToeDE

  div Panel
  div Brett
  div Zeile
  div Zelle
  div Nachricht
  variable Modell
  variable Index
  variable Zug
  variable Züge
  variable Gewinner
  variable Punkte
  variable Gewinnkombinationen

! Initialisierung
  setze die elemente von Zelle zu 9
  setze die elemente von Modell zu 9
  leere Zug
  lege 0 in Züge
  lege leer in Gewinner
  setze Gewinnkombinationen zu
    0 1 2
    3 4 5
    6 7 8
    0 3 6
    1 4 7
    2 5 8
    0 4 8
    2 4 6

! Brett vorbereiten
  erstelle Panel
  erstelle Nachricht in Panel
  setze den inhalt von Nachricht zu `Klicke, um deinen Zug zu machen`
  erstelle Brett in Panel
  setze stil `font-size` von Brett zu `24px`
  lege 0 in Index
  solange Index ist kleiner als 9
  beginn
    wenn Index modulo 3 ist 0
    beginn
      erstelle Zeile in Brett
      setze den stil von Zeile zu `width:105px;height:34px`
    ende
    indexiere Zelle zu Index
    erstelle Zelle in Zeile
    setze stil `display` von Zelle zu `inline-block`
    setze stil `border` von Zelle zu `1px solid gray`
    setze stil `float` von Zelle zu `left`
    setze stil `font-size` von Zelle zu `24px`
    setze stil `font-weight` von Zelle zu `bold`
    setze stil `line-height` von Zelle zu `34px`
    setze stil `width` von Zelle zu `34px`
    setze stil `height` von Zelle zu `34px`
    setze stil `margin-right` von Zelle zu `-1px`
    setze stil `margin-top` von Zelle zu `-1px`
    setze stil `padding` von Zelle zu `0`
    setze stil `text-align` von Zelle zu `center`
    indexiere Modell zu Index
    lege 0 in Modell
    addiere 1 zu Index
  ende
  bei klick Zelle
  beginn
    wenn Züge ist 9 stoppe
    wenn Gewinner stoppe
    lege der index von Zelle in Index
    indexiere Modell zu Index
    wenn Modell ist nicht 0 stoppe
    wenn Zug
    beginn
      lege 1 in Modell
      setze den inhalt von Zelle zu `X`
    ende
    sonst
    beginn
      lege -1 in Modell
      setze den inhalt von Zelle zu `O`
    ende
    gosub zu PrüfeGewinner
    wenn Gewinner
    beginn
      setze den inhalt von Nachricht zu `Der Gewinner ist ` cat Gewinner
      stoppe
    ende
    wechsle Zug
    addiere 1 zu Züge
    wenn Züge ist 9
    beginn
      setze den inhalt von Nachricht zu `Unentschieden - kein Gewinner`
      stoppe
    ende
  ende
  stoppe

PrüfeGewinner:
  lege 0 in Index
  solange Index ist kleiner als 24
  beginn
    lege 0 in Punkte
    indexiere Gewinnkombinationen zu Index
    indexiere Modell zu Gewinnkombinationen
    addiere Modell zu Punkte
    addiere 1 zu Index
    indexiere Gewinnkombinationen zu Index
    indexiere Modell zu Gewinnkombinationen
    addiere Modell zu Punkte
    addiere 1 zu Index
    indexiere Gewinnkombinationen zu Index
    indexiere Modell zu Gewinnkombinationen
    addiere Modell zu Punkte
    addiere 1 zu Index
    wenn Punkte ist -3
    beginn
      lege `O` in Gewinner
      retourniere
    ende
    wenn Punkte ist 3
    beginn
      lege `X` in Gewinner
      retourniere
    ende
  ende
  retourniere
