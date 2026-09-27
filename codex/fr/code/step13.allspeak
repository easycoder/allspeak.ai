!   Liste de courses

    language français

    script ListeCourses

    div Panneau
    div Ligne
    bouton Triee
    bouton NonTriee
    variable ListeOriginale
    variable ListeAffichage
    variable A
    variable B
    variable Resultat
    variable N

    mets vide dans ListeOriginale
    accole `Poisson` à ListeOriginale
    accole `Pommes de terre` à ListeOriginale
    accole `Fromage` à ListeOriginale
    accole `Vin` à ListeOriginale
    accole `Sucre` à ListeOriginale
    accole `Ananas` à ListeOriginale
    accole `Lait` à ListeOriginale
    accole `Oeufs` à ListeOriginale
    accole `Beurre` à ListeOriginale

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
        trie ListeAffichage avec TriAlphabetique
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
        définis le contenu de Ligne à élément N de ListeAffichage
        ajoute 1 à N
    fin
    retourne

TriAlphabetique:
    mets arg `a` de ListeAffichage dans A
    mets arg `b` de ListeAffichage dans B
    si A est supérieur à B mets 1 dans Resultat
    sinon si A est inférieur à B mets -1 dans Resultat
    sinon mets 0 dans Resultat
    définis arg `v` de ListeAffichage à Resultat
    arrête
