! Animation simple

    language français

  div Conteneur
  div Bouton
  variable N

  crée Conteneur
  définis le style de Conteneur à `text-align:center`

! Créer le tableau
  définis les éléments de Bouton à 3

! Créer les boutons
  mets 0 dans N
  tant que N est inférieur à 3
  début
    indexe Bouton à N
    crée Bouton dans Conteneur
    définis le style de Bouton à
        `width:50px;height:50px;margin:0.5em;border-radius:50%`
      cat `;display:inline-block;visibility:hidden`
    si N est 0 définis style `background` de Bouton à `red`
    sinon si N est 1 définis style `background` de Bouton à `green`
    sinon définis style `background` de Bouton à `blue`
    ajoute 1 à N
  fin

! Animer les boutons
  tant que vrai
  début
    mets 0 dans N
    tant que N est inférieur à 3
    début
        indexe Bouton à N
        définis style `visibility` de Bouton à `visible`
        attends 20 ticks
        définis style `visibility` de Bouton à `hidden`
        ajoute 1 à N
    fin
  fin
