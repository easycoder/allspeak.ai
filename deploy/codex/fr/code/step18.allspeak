    language français

    script Solitaire

! La carte du plateau.

  variable Carte
  définis Carte à
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0
    2 2 2 2 2 2 2
    2 2 2 1 2 2 2
    2 2 2 2 2 2 2
    0 0 2 2 2 0 0
    0 0 2 2 2 0 0

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Variables.

  div Conteneur
  div Plateau
  div FinPartie
  div Gris
  div Rouge
  variable Largeur
  variable N
  variable M
  variable X
  variable Y
  variable R
  variable C
  variable S
  variable Taille
  variable Decalage
  variable Selectionne
  variable Ligne
  variable Colonne
  variable Valide
  variable Index
  variable Haut
  variable Bas
  variable Gauche
  variable Droite
  variable PosChoisi
  variable PosGlisse
  variable Gauches
  variable Hauts
  variable Destination

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Créer tous les éléments.
  crée Plateau

  définis les éléments de Gris à 49
  définis les éléments de Rouge à 49
  définis les éléments de Gauches à 49
  définis les éléments de Hauts à 49

  si mobile
  début
    mets la largeur de Plateau dans Largeur
    multiplie Largeur par 90
    divise Largeur par 100
    définis style `touch-action` de Plateau à `none`;
  fin
  sinon
  début
    mets 500 dans Largeur
  fin
  définis style `width` de Plateau à Largeur cat `px`
  définis style `height` de Plateau à Largeur cat `px`
  définis style `background-size` de Plateau à Largeur cat `px`
  définis style `margin` de Plateau à `2em auto 0 auto`
  définis style `border` de Plateau à `1px solid #888`
  définis style `border-radius` de Plateau à `50%`
  définis style `background-image` de Plateau à
    `url('https://allspeak.software/public/skybg.jpg')`

  crée Conteneur dans Plateau
  définis le style de Conteneur à
    `position:relative;width:100%,height:100%;margin:5%`

  multiplie Largeur par 90
  divise Largeur par 100
  divise Largeur par 7 donnant S
  divise S par 7 donnant Taille
  multiplie Taille par 6
  multiplie Taille par 7 donnant Decalage
  soustrais Decalage depuis Largeur donnant Decalage
  divise Decalage par 14

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Dessiner la disposition initiale du plateau.
  mets 0 dans N
  tant que N est inférieur à 49
  début
    indexe Carte à N
    si Carte est pas 0
    début
      divise N par 7 donnant Ligne
      multiplie Ligne par S donnant Y
      ajoute Decalage à Y
      indexe Hauts à N
      mets Y dans Hauts
      mets N modulo 7 dans Colonne
      multiplie Colonne par S donnant X
      ajoute Decalage à X
      indexe Gauches à N
      mets X dans Gauches
      indexe Gris à N
      crée Gris dans Conteneur
      définis le style de Gris à `position:absolute;left:` cat X cat `px;top:` cat Y
        cat `px;width:` cat Taille cat `px;height:` cat Taille cat `px;background:gray`
        cat `;border:1px solid darkgray;border-radius:50%`
      indexe Rouge à N
      crée Rouge dans Conteneur
      définis le style de Rouge à `position:absolute;left:` cat X cat `px;top:` cat Y
        cat `px;width:` cat Taille cat `px;height:` cat Taille cat `px;background:red`
        cat `;border:1px solid darkred;border-radius:50%`
      si Carte est 1 définis style `opacity` de Rouge à `0`
    fin
    ajoute 1 à N
  fin
  sur choisi Rouge va à Choisir
  sur glisse va à Glisser
  sur dépose va à Deposer
  arrête

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Choisir un pion
Choisir:
  efface Valide
  mets la choisi position dans PosChoisi
  mets l index de Rouge dans Index
  mets -1 dans Gauche
  mets -1 dans Droite
  mets -1 dans Haut
  mets -1 dans Bas
! Obtenir la ligne
  mets Index modulo 7 dans R
! Doit être > 1 pour pouvoir aller à gauche
  si R est supérieur à 1
  début
    soustrais 2 depuis Index donnant N
    indexe Carte à N
    si Carte est 1
    début
      ajoute 1 à N donnant M
      indexe Carte à M
      si Carte est 2 mets N dans Gauche
    fin
  fin
! Doit être < 5 pour pouvoir aller à droite
  si R est inférieur à 5
  début
    ajoute 2 à Index donnant N
    indexe Carte à N
    si Carte est 1
    début
      soustrais 1 depuis N donnant M
      indexe Carte à M
      si Carte est 2 mets N dans Droite
    fin
  fin
  soustrais 14 depuis Index donnant N
! N doit être >= 0 pour aller en haut
  si N est pas inférieur à 0
  début
    indexe Carte à N
    si Carte est 1
    début
      ajoute 7 à N donnant M
      indexe Carte à M
      si Carte est 2 mets N dans Haut
    fin
  fin
  ajoute 14 à Index donnant N
! N doit être < 49 pour aller en bas
  si N est inférieur à 49
  début
    indexe Carte à N
    si Carte est 1
    début
      soustrais 7 depuis N donnant M
      indexe Carte à M
      si Carte est 2 mets N dans Bas
    fin
  fin
! Si un mouvement est possible, sélectionner ce pion
  si Gauche est pas -1 va Selection
  si Droite est pas -1 va Selection
  si Haut est pas -1 va Selection
  si Bas est pas -1 va Selection
  arrête

Selection:
  définis style `z-index` de Rouge à 10
  définis style `background` de Rouge à `orange`
  mets l index de Rouge dans Selectionne
  arrête

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Glisser le pion
Glisser:
  si pas Selectionne arrête
  mets la glisse position dans PosGlisse
  mets propriété `x` de PosGlisse dans X
  mets propriété `y` de PosGlisse dans Y
  soustrais propriété `x` de PosChoisi depuis X
  soustrais propriété `y` de PosChoisi depuis Y
  indexe Gauches à Selectionne
  indexe Hauts à Selectionne
  ajoute Gauches à X
  ajoute Hauts à Y
  définis style `left` de Rouge à X cat `px`
  définis style `top` de Rouge à Y cat `px`
  si Gauche est pas -1
  début
    indexe Gris à Gauche
    si élément Gris contient PosGlisse va à MontreValide
  fin
  si Droite est pas -1
  début
    indexe Gris à Droite
    si élément Gris contient PosGlisse va à MontreValide
  fin
  si Haut est pas -1
  début
    indexe Gris à Haut
    si élément Gris contient PosGlisse va à MontreValide
  fin
  si Bas est pas -1
  début
    indexe Gris à Bas
    si élément Gris contient PosGlisse va à MontreValide
  fin
  efface Valide
  définis style `background` de Gris à `gray`
  arrête

MontreValide:
  mets l index de Gris dans Destination
  définis style `background` de Gris à `yellow`
  définis Valide
  arrête

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Déposer le pion
Deposer:
  si pas Selectionne arrête
  si Valide
  début
    indexe Gauches à Selectionne
    indexe Hauts à Selectionne
    définis style `left` de Rouge à Gauches cat `px`
    définis style `top` de Rouge à Hauts cat `px`
    mets Selectionne dans N
    vasous à Retirer
    indexe Rouge à Destination
    indexe Gauches à Destination
    indexe Hauts à Destination
    définis style `left` de Rouge à Gauches cat `px`
    définis style `top` de Rouge à Hauts cat `px`
    mets Destination dans N
    vasous à Placer
    ajoute Destination à Selectionne donnant N
    divise N par 2
    vasous à Retirer
  fin
  sinon
  début
    mets Selectionne dans N
    indexe Gauches à N
    indexe Hauts à N
    définis style `left` de Rouge à Gauches cat `px`
    définis style `top` de Rouge à Hauts cat `px`
    vasous à Placer
  fin
  définis style `z-index` de Rouge à 1
  efface Selectionne
  va à VerifieFini

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Placer un pion
Placer:
  indexe Carte à N
  indexe Rouge à N
  indexe Gris à N
  mets 2 dans Carte
  définis style `opacity` de Rouge à `1`
  définis style `background` de Rouge à `red`
  définis style `background` de Gris à `gray`
  retourne

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!  Retirer un pion
Retirer:
   indexe Carte à N
   indexe Rouge à N
   mets 1 dans Carte
   définis style `opacity` de Rouge à `0`
   retourne

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Vérifier s'il reste des coups.
VerifieFini:
  mets 0 dans N
  tant que N est inférieur à 49
  début
    indexe Carte à N
    si Carte est 2
    début
      divise N par 7 donnant Ligne
      mets N modulo 7 dans Colonne
      ! Essayer à gauche
      soustrais 1 depuis Colonne donnant C
      si C est pas inférieur à 0
      début
        multiplie Ligne par 7 donnant M
        ajoute C à M
        indexe Carte à M
        si Carte est 2
        début
          soustrais 1 depuis C
          si C est pas inférieur à 0
          début
            multiplie Ligne par 7 donnant M
            ajoute C à M
            indexe Carte à M
            si Carte est 1 arrête
          fin
        fin
      fin
      ! Essayer à droite
      ajoute 1 à Colonne donnant C
      si C est inférieur à 7
      début
        multiplie Ligne par 7 donnant M
        ajoute C à M
        indexe Carte à M
        si Carte est 2
        début
          ajoute 1 à C
          si C est inférieur à 7
          début
            multiplie Ligne par 7 donnant M
            ajoute C à M
            indexe Carte à M
            si Carte est 1 arrête
          fin
        fin
      fin
      ! Essayer en haut
      soustrais 1 depuis Ligne donnant R
      si R est pas inférieur à 0
      début
        multiplie R par 7 donnant M
        ajoute Colonne à M
        indexe Carte à M
        si Carte est 2
        début
          soustrais 1 depuis R
          si R est pas inférieur à 0
          début
            multiplie R par 7 donnant M
            ajoute Colonne à M
            indexe Carte à M
            si Carte est 1 arrête
          fin
        fin
      fin
      ! Essayer en bas
      ajoute 1 à Ligne donnant R
      si R est inférieur à 7
      début
        multiplie R par 7 donnant M
        ajoute Colonne à M
        indexe Carte à M
        si Carte est 2
        début
          ajoute 1 à R
          si R est inférieur à 7
          début
            multiplie R par 7 donnant M
            ajoute Colonne à M
            indexe Carte à M
            si Carte est 1 arrête
          fin
        fin
      fin
    fin
    ajoute 1 à N
  fin
  crée FinPartie
  définis le style de FinPartie à `text-align:center`
  définis le contenu de FinPartie à `Partie terminée - plus aucun coup possible`
  arrête
