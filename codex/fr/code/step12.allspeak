    language français

    script MorpionFR

  div Panneau
  div Plateau
  div Ligne
  div Cellule
  div Message
  variable Modele
  variable Index
  variable Tour
  variable Coups
  variable Gagnant
  variable Score
  variable CombinaisonsGagnantes

! Initialisation
  définis les éléments de Cellule à 9
  définis les éléments de Modele à 9
  efface Tour
  mets 0 dans Coups
  mets vide dans Gagnant
  définis CombinaisonsGagnantes à
    0 1 2
    3 4 5
    6 7 8
    0 3 6
    1 4 7
    2 5 8
    0 4 8
    2 4 6

! Préparer le plateau
  crée Panneau
  crée Message dans Panneau
  définis le contenu de Message à `Cliquez pour jouer votre tour`
  crée Plateau dans Panneau
  définis style `font-size` de Plateau à `24px`
  mets 0 dans Index
  tant que Index est inférieur à 9
  début
    si Index modulo 3 est 0
    début
      crée Ligne dans Plateau
      définis le style de Ligne à `width:105px;height:34px`
    fin
    indexe Cellule à Index
    crée Cellule dans Ligne
    définis style `display` de Cellule à `inline-block`
    définis style `border` de Cellule à `1px solid gray`
    définis style `float` de Cellule à `left`
    définis style `font-size` de Cellule à `24px`
    définis style `font-weight` de Cellule à `bold`
    définis style `line-height` de Cellule à `34px`
    définis style `width` de Cellule à `34px`
    définis style `height` de Cellule à `34px`
    définis style `margin-right` de Cellule à `-1px`
    définis style `margin-top` de Cellule à `-1px`
    définis style `padding` de Cellule à `0`
    définis style `text-align` de Cellule à `center`
    indexe Modele à Index
    mets 0 dans Modele
    ajoute 1 à Index
  fin
  sur clic Cellule
  début
    si Coups est 9 arrête
    si Gagnant arrête
    mets l index de Cellule dans Index
    indexe Modele à Index
    si Modele est pas 0 arrête
    si Tour
    début
      mets 1 dans Modele
      définis le contenu de Cellule à `X`
    fin
    sinon
    début
      mets -1 dans Modele
      définis le contenu de Cellule à `O`
    fin
    vasous à VerifieGagnant
    si Gagnant
    début
      définis le contenu de Message à `Le gagnant est ` cat Gagnant
      arrête
    fin
    bascule Tour
    ajoute 1 à Coups
    si Coups est 9
    début
      définis le contenu de Message à `Match nul - pas de gagnant`
      arrête
    fin
  fin
  arrête

VerifieGagnant:
  mets 0 dans Index
  tant que Index est inférieur à 24
  début
    mets 0 dans Score
    indexe CombinaisonsGagnantes à Index
    indexe Modele à CombinaisonsGagnantes
    ajoute Modele à Score
    ajoute 1 à Index
    indexe CombinaisonsGagnantes à Index
    indexe Modele à CombinaisonsGagnantes
    ajoute Modele à Score
    ajoute 1 à Index
    indexe CombinaisonsGagnantes à Index
    indexe Modele à CombinaisonsGagnantes
    ajoute Modele à Score
    ajoute 1 à Index
    si Score est -3
    début
      mets `O` dans Gagnant
      retourne
    fin
    si Score est 3
    début
      mets `X` dans Gagnant
      retourne
    fin
  fin
  retourne
