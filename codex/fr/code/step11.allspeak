!   Interactivité de base

    language français

    div Conteneur
    div Bouton
    a Lien
    variable Compte
    variable N
    variable Clique

    mets invite `Combien de boutons ?` avec `5` dans Compte
    définis les éléments de Lien à Compte
    définis les éléments de Clique à Compte

!   Initialiser les boutons
    mets 0 dans N
    tant que N est inférieur à Compte
    début
        indexe Clique à N
        efface Clique
        ajoute 1 à N
    fin

    crée Conteneur

!   Redessiner l'écran chaque fois que l'utilisateur clique un bouton
Redessine:
    efface Conteneur
    mets 0 dans N
    tant que N est inférieur à Compte
    début
        indexe Lien à N
        indexe Clique à N
        crée Bouton dans Conteneur
        définis le style de Bouton à
            `margin:0.5em 0 0 2em;border:1px solid red;`
            cat `padding:0.5em;width:10em;text-align:center`
        ajoute 1 à N
        si Clique définis le contenu de Bouton à `Fait`
        sinon
        début
            crée Lien dans Bouton
            définis le contenu de Lien à `Bouton ` cat N
        fin
    fin
    sur clic Lien
    début
        indexe Clique à l index de Lien
        définis Clique
        va à Redessine
    fin

    arrête
