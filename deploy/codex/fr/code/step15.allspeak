!   Liste de courses 3

    language français

    script ListeCourses3

    div Panneau
    div Ligne
    bouton Triee
    bouton NonTriee
    bouton Filtree
    variable ListeOriginale
    variable ListeAffichage
    variable A
    variable B
    variable Resultat
    variable N
    variable Article

    mets vide dans ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Poisson`
    définis propriété `price` de Article à 349
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Pommes de terre`
    définis propriété `price` de Article à 105
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Fromage`
    définis propriété `price` de Article à 275
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Vin`
    définis propriété `price` de Article à 749
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Sucre`
    définis propriété `price` de Article à 85
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Ananas`
    définis propriété `price` de Article à 93
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Lait`
    définis propriété `price` de Article à 85
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Oeufs`
    définis propriété `price` de Article à 125
    accole Article à ListeOriginale
    définis Article à objet
    définis propriété `name` de Article à `Beurre`
    définis propriété `price` de Article à 185
    accole Article à ListeOriginale

    crée Panneau
    définis le style de Panneau à `border:1px solid black;margin:1em;padding:1em`

    crée NonTriee
    définis le style de NonTriee à `margin:1em`
    définis le texte de NonTriee à `Non triée`
    sur clic NonTriee va à AfficheNonTriee

    crée Triee
    définis le style de Triee à `margin:1em`
    définis le texte de Triee à `Triée`
    sur clic Triee
    début
        mets ListeOriginale dans ListeAffichage
        trie ListeAffichage avec TriParPrix
        vasous à Affiche
    fin

    crée Filtree
    définis le style de Filtree à `margin:1em`
    définis le texte de Filtree à `Filtrée`
    sur clic Filtree
    début
        mets ListeOriginale dans ListeAffichage
        filtre ListeAffichage avec FiltrePrix
        trie ListeAffichage avec TriParPrix
        vasous à Affiche
    fin

AfficheNonTriee:
    mets ListeOriginale dans ListeAffichage
    vasous à Affiche

    arrête

Affiche:
    efface Panneau
    mets 0 dans N
    tant que N est inférieur à le json compte de ListeAffichage
    début
        crée Ligne dans Panneau
        mets élément N de ListeAffichage dans Article
        définis le contenu de Ligne à propriété `name` de Article
        ajoute 1 à N
    fin
    retourne

FiltrePrix:
    mets arg `a` de ListeAffichage dans A
    si propriété `price` de A est pas inférieur à 100 définis Resultat
    sinon efface Resultat
    définis arg `v` de ListeAffichage à Resultat
    arrête

TriParPrix:
    mets arg `a` de ListeAffichage dans A
    mets arg `b` de ListeAffichage dans B
    si propriété `price` de A est supérieur à propriété `price` de B
        mets 1 dans Resultat
    sinon si propriété `price` de A est inférieur à propriété `price` de B
        mets -1 dans Resultat
    sinon mets 0 dans Resultat
    définis arg `v` de ListeAffichage à Resultat
    arrête
