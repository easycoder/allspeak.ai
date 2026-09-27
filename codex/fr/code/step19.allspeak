!   Pan et Zoom

    language français

    script PanZoom

    div Div
    animation Anim
    variable Spec
    variable AspectL
    variable AspectH
    variable Largeur
    variable Hauteur
    variable Article
    variable Fini

    mets 16 dans AspectL
    mets 9 dans AspectH

    définis Spec à objet
    définis propriété `type` de Spec à `panzoom`
    définis propriété `width` de Spec à `100%`
    définis propriété `height` de Spec à `100%`
    définis propriété `url` de Spec à `/resources/img/demo3.jpg`
    définis propriété `steps` de Spec à 100
    définis propriété `trigger` de Spec à 100
    définis Article à objet
    définis propriété `left` de Article à 30
    définis propriété `top` de Article à 37
    définis propriété `width` de Article à 20
    définis propriété `start` de Spec à Article
    définis Article à objet
    définis propriété `left` de Article à 0
    définis propriété `top` de Article à 0
    définis propriété `width` de Article à 100
    définis propriété `finish` de Spec à Article

!   Obtenir la largeur et la hauteur
    crée Div
    définis style `margin` de Div à `1em 0 0 5%`
    définis style `width` de Div à `90%`
    mets la largeur de Div dans Largeur
    multiplie Largeur par AspectH donnant Hauteur
    divise Hauteur par AspectL
    définis style `height` de Div à Hauteur cat `px`

!   Créer les composants
    crée Anim dans Div
    définis style `width` de Anim à `100%`
    définis style `height` de Anim à Hauteur cat `px`
    définis la specification de Anim à Spec
    sur déclencheur Anim définis Fini

    attends 2

!   Démarrer l'animation
    efface Fini
    démarre Anim
    tant que pas Fini
    début
        pas Anim
        attends 5 ticks
    fin
    imprime `Fini`
    arrête
