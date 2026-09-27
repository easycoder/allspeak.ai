!   Démo de carte

    language français

    script DemoCarte

    div Panneau
    div Controles
    div PanneauCarte
    span Travee
    gmap Carte
    variable Cle
    variable Latitude
    variable Longitude
    variable Zoom

    rest obtiens Cle depuis `/config/gmap-key.txt`
    ou début
        alerte `Impossible de charger la clé API Google Maps.`
        arrête
    fin

    mets `53.8291119` dans Latitude
    mets `-1.5381586` dans Longitude
    mets `17.0` dans Zoom

    crée Panneau
    définis le style de Panneau à
        `width:100%;height:100%;display:flex;flex-direction:column`

    crée Controles dans Panneau
    définis le style de Controles à `height:3em;padding:4px`
    crée Travee dans Controles
    définis le style de Travee à `font-size:120%`
    définis le contenu de Travee à `Carte des lieux de festival`

    crée PanneauCarte dans Panneau
    définis le style de PanneauCarte à `width:100%;flex:1`

    crée Carte dans PanneauCarte
    définis la clé de Carte à Cle
    définis la latitude de Carte à Latitude
    définis la longitude de Carte à Longitude
    définis le zoom de Carte à Zoom
    montre Carte

    arrête
