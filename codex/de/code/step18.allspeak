    language deutsch

    script Solitär

! Die Karte des Bretts.

  variable Karte
  setze Karte zu
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0
    2 2 2 2 2 2 2
    2 2 2 1 2 2 2
    2 2 2 2 2 2 2
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Variablen.

  div Behälter
  div Brett
  div Spielende
  div Grau
  div Rot
  variable Breite
  variable N
  variable M
  variable X
  variable Y
  variable R
  variable C
  variable S
  variable Größe
  variable Versatz
  variable Gewählt
  variable Zeile
  variable Spalte
  variable Gültig
  variable Index
  variable Oben
  variable Unten
  variable Links
  variable Rechts
  variable WähleP
  variable ZiehP
  variable Linkse
  variable Obense
  variable Ziel

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Alle Elemente erstellen.
  erstelle Brett

  setze die elemente von Grau zu 49
  setze die elemente von Rot zu 49
  setze die elemente von Linkse zu 49
  setze die elemente von Obense zu 49

  wenn mobil
  beginn
    lege die breite von Brett in Breite
    multipliziere Breite mit 90
    dividiere Breite durch 100
    setze stil `touch-action` von Brett zu `none`;
  ende
  sonst
  beginn
    lege 500 in Breite
  ende
  setze stil `width` von Brett zu Breite cat `px`
  setze stil `height` von Brett zu Breite cat `px`
  setze stil `background-size` von Brett zu Breite cat `px`
  setze stil `margin` von Brett zu `2em auto 0 auto`
  setze stil `border` von Brett zu `1px solid #888`
  setze stil `border-radius` von Brett zu `50%`
  setze stil `background-image` von Brett zu
    `url('https://allspeak.software/public/skybg.jpg')`

  erstelle Behälter in Brett
  setze den stil von Behälter zu
    `position:relative;width:100%,height:100%;margin:5%`

  multipliziere Breite mit 90
  dividiere Breite durch 100
  dividiere Breite durch 7 ergibt S
  dividiere S durch 7 ergibt Größe
  multipliziere Größe mit 6
  multipliziere Größe mit 7 ergibt Versatz
  subtrahiere Versatz von Breite ergibt Versatz
  dividiere Versatz durch 14

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Anfangslayout des Bretts zeichnen.
  lege 0 in N
  solange N ist kleiner als 49
  beginn
    indexiere Karte zu N
    wenn Karte ist nicht 0
    beginn
      dividiere N durch 7 ergibt Zeile
      multipliziere Zeile mit S ergibt Y
      addiere Versatz zu Y
      indexiere Obense zu N
      lege Y in Obense
      lege N modulo 7 in Spalte
      multipliziere Spalte mit S ergibt X
      addiere Versatz zu X
      indexiere Linkse zu N
      lege X in Linkse
      indexiere Grau zu N
      erstelle Grau in Behälter
      setze den stil von Grau zu `position:absolute;left:` cat X cat `px;top:` cat Y
        cat `px;width:` cat Größe cat `px;height:` cat Größe cat `px;background:gray`
        cat `;border:1px solid darkgray;border-radius:50%`
      indexiere Rot zu N
      erstelle Rot in Behälter
      setze den stil von Rot zu `position:absolute;left:` cat X cat `px;top:` cat Y
        cat `px;width:` cat Größe cat `px;height:` cat Größe cat `px;background:red`
        cat `;border:1px solid darkred;border-radius:50%`
      wenn Karte ist 1 setze stil `opacity` von Rot zu `0`
    ende
    addiere 1 zu N
  ende
  bei wähle Rot gehe zu Wählen
  bei ziehe gehe zu Ziehen
  bei ablege gehe zu Ablegen
  stoppe

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Einen Stein wählen
Wählen:
  leere Gültig
  lege die wähle position in WähleP
  lege der index von Rot in Index
  lege -1 in Links
  lege -1 in Rechts
  lege -1 in Oben
  lege -1 in Unten
! Zeile holen
  lege Index modulo 7 in R
! Muss > 1 sein, um nach links zu gehen
  wenn R ist größer als 1
  beginn
    subtrahiere 2 von Index ergibt N
    indexiere Karte zu N
    wenn Karte ist 1
    beginn
      addiere 1 zu N ergibt M
      indexiere Karte zu M
      wenn Karte ist 2 lege N in Links
    ende
  ende
! Muss < 5 sein, um nach rechts zu gehen
  wenn R ist kleiner als 5
  beginn
    addiere 2 zu Index ergibt N
    indexiere Karte zu N
    wenn Karte ist 1
    beginn
      subtrahiere 1 von N ergibt M
      indexiere Karte zu M
      wenn Karte ist 2 lege N in Rechts
    ende
  ende
  subtrahiere 14 von Index ergibt N
! N muss >= 0 sein, um nach oben zu gehen
  wenn N ist nicht kleiner als 0
  beginn
    indexiere Karte zu N
    wenn Karte ist 1
    beginn
      addiere 7 zu N ergibt M
      indexiere Karte zu M
      wenn Karte ist 2 lege N in Oben
    ende
  ende
  addiere 14 zu Index ergibt N
! N muss < 49 sein, um nach unten zu gehen
  wenn N ist kleiner als 49
  beginn
    indexiere Karte zu N
    wenn Karte ist 1
    beginn
      subtrahiere 7 von N ergibt M
      indexiere Karte zu M
      wenn Karte ist 2 lege N in Unten
    ende
  ende
! Wenn ein Zug möglich ist, diesen Stein auswählen
  wenn Links ist nicht -1 gehe Auswahl
  wenn Rechts ist nicht -1 gehe Auswahl
  wenn Oben ist nicht -1 gehe Auswahl
  wenn Unten ist nicht -1 gehe Auswahl
  stoppe

Auswahl:
  setze stil `z-index` von Rot zu 10
  setze stil `background` von Rot zu `orange`
  lege der index von Rot in Gewählt
  stoppe

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Den Stein ziehen
Ziehen:
  wenn nicht Gewählt stoppe
  lege die ziehe position in ZiehP
  lege eigenschaft `x` von ZiehP in X
  lege eigenschaft `y` von ZiehP in Y
  subtrahiere eigenschaft `x` von WähleP von X
  subtrahiere eigenschaft `y` von WähleP von Y
  indexiere Linkse zu Gewählt
  indexiere Obense zu Gewählt
  addiere Linkse zu X
  addiere Obense zu Y
  setze stil `left` von Rot zu X cat `px`
  setze stil `top` von Rot zu Y cat `px`
  wenn Links ist nicht -1
  beginn
    indexiere Grau zu Links
    wenn element Grau enthält ZiehP gehe zu ZeigeGültig
  ende
  wenn Rechts ist nicht -1
  beginn
    indexiere Grau zu Rechts
    wenn element Grau enthält ZiehP gehe zu ZeigeGültig
  ende
  wenn Oben ist nicht -1
  beginn
    indexiere Grau zu Oben
    wenn element Grau enthält ZiehP gehe zu ZeigeGültig
  ende
  wenn Unten ist nicht -1
  beginn
    indexiere Grau zu Unten
    wenn element Grau enthält ZiehP gehe zu ZeigeGültig
  ende
  leere Gültig
  setze stil `background` von Grau zu `gray`
  stoppe

ZeigeGültig:
  lege der index von Grau in Ziel
  setze stil `background` von Grau zu `yellow`
  setze Gültig
  stoppe

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Den Stein ablegen
Ablegen:
  wenn nicht Gewählt stoppe
  wenn Gültig
  beginn
    indexiere Linkse zu Gewählt
    indexiere Obense zu Gewählt
    setze stil `left` von Rot zu Linkse cat `px`
    setze stil `top` von Rot zu Obense cat `px`
    lege Gewählt in N
    gosub zu Entferne
    indexiere Rot zu Ziel
    indexiere Linkse zu Ziel
    indexiere Obense zu Ziel
    setze stil `left` von Rot zu Linkse cat `px`
    setze stil `top` von Rot zu Obense cat `px`
    lege Ziel in N
    gosub zu Platziere
    addiere Ziel zu Gewählt ergibt N
    dividiere N durch 2
    gosub zu Entferne
  ende
  sonst
  beginn
    lege Gewählt in N
    indexiere Linkse zu N
    indexiere Obense zu N
    setze stil `left` von Rot zu Linkse cat `px`
    setze stil `top` von Rot zu Obense cat `px`
    gosub zu Platziere
  ende
  setze stil `z-index` von Rot zu 1
  leere Gewählt
  gehe zu PrüfeFertig

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Einen Stein platzieren
Platziere:
  indexiere Karte zu N
  indexiere Rot zu N
  indexiere Grau zu N
  lege 2 in Karte
  setze stil `opacity` von Rot zu `1`
  setze stil `background` von Rot zu `red`
  setze stil `background` von Grau zu `gray`
  retourniere

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Einen Stein entfernen
Entferne:
   indexiere Karte zu N
   indexiere Rot zu N
   lege 1 in Karte
   setze stil `opacity` von Rot zu `0`
   retourniere

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Prüfen, ob noch Züge möglich sind.
PrüfeFertig:
  lege 0 in N
  solange N ist kleiner als 49
  beginn
    indexiere Karte zu N
    wenn Karte ist 2
    beginn
      dividiere N durch 7 ergibt Zeile
      lege N modulo 7 in Spalte
      ! Links versuchen
      subtrahiere 1 von Spalte ergibt C
      wenn C ist nicht kleiner als 0
      beginn
        multipliziere Zeile mit 7 ergibt M
        addiere C zu M
        indexiere Karte zu M
        wenn Karte ist 2
        beginn
          subtrahiere 1 von C
          wenn C ist nicht kleiner als 0
          beginn
            multipliziere Zeile mit 7 ergibt M
            addiere C zu M
            indexiere Karte zu M
            wenn Karte ist 1 stoppe
          ende
        ende
      ende
      ! Rechts versuchen
      addiere 1 zu Spalte ergibt C
      wenn C ist kleiner als 7
      beginn
        multipliziere Zeile mit 7 ergibt M
        addiere C zu M
        indexiere Karte zu M
        wenn Karte ist 2
        beginn
          addiere 1 zu C
          wenn C ist kleiner als 7
          beginn
            multipliziere Zeile mit 7 ergibt M
            addiere C zu M
            indexiere Karte zu M
            wenn Karte ist 1 stoppe
          ende
        ende
      ende
      ! Oben versuchen
      subtrahiere 1 von Zeile ergibt R
      wenn R ist nicht kleiner als 0
      beginn
        multipliziere R mit 7 ergibt M
        addiere Spalte zu M
        indexiere Karte zu M
        wenn Karte ist 2
        beginn
          subtrahiere 1 von R
          wenn R ist nicht kleiner als 0
          beginn
            multipliziere R mit 7 ergibt M
            addiere Spalte zu M
            indexiere Karte zu M
            wenn Karte ist 1 stoppe
          ende
        ende
      ende
      ! Unten versuchen
      addiere 1 zu Zeile ergibt R
      wenn R ist kleiner als 7
      beginn
        multipliziere R mit 7 ergibt M
        addiere Spalte zu M
        indexiere Karte zu M
        wenn Karte ist 2
        beginn
          addiere 1 zu R
          wenn R ist kleiner als 7
          beginn
            multipliziere R mit 7 ergibt M
            addiere Spalte zu M
            indexiere Karte zu M
            wenn Karte ist 1 stoppe
          ende
        ende
      ende
    ende
    addiere 1 zu N
  ende
  erstelle Spielende
  setze den stil von Spielende zu `text-align:center`
  setze den inhalt von Spielende zu `Spiel vorbei - keine Züge mehr möglich`
  stoppe
