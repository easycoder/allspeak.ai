!   Le rectangle rebondissant

    language français

    div Conteneur
    div Rectangle
    variable Hauteur
    variable Angle

    crée Conteneur
    définis le style de Conteneur à
        `width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding:10px`

    crée Rectangle dans Conteneur
    définis le style de Rectangle à
       `position:relative;width:9%;border:1px solid gray;`
        cat `background:lightgray`
    définis style `top` de Rectangle à `50%`
    définis style `height` de Rectangle à `100px`

    attends 2 secondes

    mets 0 dans Angle
    tant que Angle est inférieur à 360
    début
        mets sin Angle rayon 100 dans Hauteur
        définis style `top` de Rectangle à `calc(50% - ` cat Hauteur cat `px)`
        définis style `height` de Rectangle à `calc(100px + ` cat Hauteur cat `px)`
        ajoute 1 à Angle
        attends 5 millis
    fin

    arrête
