!   Glisser-déposer

    language français

    script GlisseDepose

    div Conteneur
    div Composant
    variable PosChoisi
    variable PosGlisse
    variable X
    variable Y
    variable DecalageX
    variable DecalageY

    crée Conteneur
    définis style `position` de Conteneur à `relative`

    crée Composant dans Conteneur
    définis le style de Composant à
        `position:absolute;left:1em;top:1em;cursor:default`
    définis le contenu de Composant à `Ce texte est déplaçable`

    sur choisi Composant
    début
        mets la choisi position dans PosChoisi
        mets le décalage gauche de Composant dans DecalageX
        mets le décalage haut de Composant dans DecalageY
    fin

    sur glisse
    début
        mets la glisse position dans PosGlisse
        mets propriété `x` de PosGlisse dans X
        mets propriété `y` de PosGlisse dans Y
        soustrais propriété `x` de PosChoisi depuis X
        soustrais propriété `y` de PosChoisi depuis Y
        ajoute DecalageX à X
        ajoute DecalageY à Y
        définis style `left` de Composant à X cat `px`
        définis style `top` de Composant à Y cat `px`
    fin

    arrête
