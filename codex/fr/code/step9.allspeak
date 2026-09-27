!   La Ola mexicaine

    language français

    script Ola

    div Conteneur
    div Rectangle
    variable Hauteur
    variable Angle
    variable Debut
    variable Fini
    variable ToutFini
    variable Temps
    variable N
    variable NRect

    mets 10 dans NRect

    crée Conteneur
    définis le style de Conteneur à
        `position:relative;width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding-bottom:10px;text-align:center`

    définis les éléments de Rectangle à NRect
    définis les éléments de Angle à NRect
    définis les éléments de Debut à NRect
    définis les éléments de Fini à NRect

    mets 0 dans N
    tant que N est inférieur à NRect
    début
        ! Initialiser les rectangles
        indexe Rectangle à N
        crée Rectangle dans Conteneur
        définis le style de Rectangle à
           `position:absolute;width:9%;background:peru;`
            cat `display:inline-block;margin-left:0.5%`
        définis style `top` de Rectangle à 200
        définis style `left` de Rectangle à `calc(10% * ` cat N cat `)`
        définis style `height` de Rectangle à `1px`
        ajoute 1 à N
    fin

Boucle:
    attends 2 secondes

    mets 0 dans N
    tant que N est inférieur à NRect
    début
        ! Initialiser les angles, etc.
        indexe Angle à N
        indexe Debut à N
        indexe Fini à N
        mets 0 dans Angle
        mets N dans Debut
        multiplie Debut par 10
        efface Fini
        ajoute 1 à N
    fin

    mets 0 dans Temps
    tant que vrai
    début
        définis ToutFini
        mets 0 dans N
        tant que N est inférieur à NRect
        début
            indexe Rectangle à N
            indexe Angle à N
            indexe Debut à N
            indexe Fini à N
            si pas Fini
            début
                efface ToutFini ! pas encore terminé
                si Temps est supérieur à Debut
                début
                    mets cos Angle rayon 100 dans Hauteur
                    oppose Hauteur
                    définis style `top` de Rectangle à `calc(50% - ` cat Hauteur cat `px)`
                    définis style `height` de Rectangle à `calc(100px + ` cat Hauteur cat `px)`
                    ajoute 1 à Angle
                    si Angle est supérieur à 360 définis Fini
                fin
            fin
            ajoute 1 à N
        fin
        ajoute 1 à Temps
        attends 5 millis
        si ToutFini va Boucle
    fin
    arrête
