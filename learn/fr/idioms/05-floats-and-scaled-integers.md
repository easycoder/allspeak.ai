# Flottants et entiers mis à l'échelle

## Problème

Tu as une quantité avec une précision fractionnaire — de l'argent, un pourcentage, un angle, une mesure. L'arithmétique d'AllSpeak est uniquement entière. Comment calculer avec la valeur sans perdre de précision ?

## La réalité du flottant sous forme de chaîne

Les littéraux numériques dans le code source sont des entiers ; `3.14` est une chaîne de quatre caractères, pas un nombre. Les variables qui contiennent des valeurs récupérées de l'extérieur (une réponse REST, un champ de formulaire Webson) peuvent aussi arriver comme des chaînes à allure de flottant. Elles traversent `cat` inchangées mais ne participent pas à l'arithmétique — `ajoute 0.5 à Counter` est une erreur.

La solution est le **motif des entiers mis à l'échelle** : garde toutes les valeurs comme des entiers, multipliés par un facteur d'échelle choisi, et ne divise qu'à l'affichage.

## Choisir une échelle

Choisis un facteur d'échelle pour la précision dont tu as besoin :

| Domaine | Échelle courante | Signification |
|--------|--------------|---------|
| Argent (£/$/€) | 100 | Plus petite unité (pence, cents). £12,34 → 1234. |
| Pourcentages | 100 ou 10000 | Précision de 1 % ou 0,01 %. 12,5 % → 125 ou 12500. |
| Coordonnées | 1000 | Millipixels. 100,5 → 100500. |
| Angles | 100 ou 10 | 0,01° ou 0,1°. 45,5° → 4550 ou 455. |

Le compromis : une échelle plus élevée donne plus de précision, mais la valeur maximale représentable diminue.

## Exemple travaillé : l'argent

Un total de panier d'achat :

```as
variable PriceA
variable PriceB
variable Total

mets 1250 dans PriceA    ! £12,50 stocké en pence
mets 875 dans PriceB    ! £8,75 stocké en pence
ajoute PriceA à PriceB donnant Total
! Total vaut 2125 — soit £21,25
```

Pour afficher, sépare livres et pence, en complétant les pence à deux chiffres :

```as
divise Total par 100 donnant Pounds
mets Total modulo 100 dans Pence

si Pence est inférieur à 10
    mets `0` cat Pence dans PenceStr
sinon
    mets Pence dans PenceStr

imprime Pounds cat `.` cat PenceStr     ! « 21.25 »
```

## Exemple travaillé : les pourcentages

90 % d'une largeur, avec 1 % de précision :

```as
multiplie Width par 90      ! Width × 90
divise Width par 100       ! ÷ 100
```

C'est l'idiome AllSpeak canonique pour appliquer un pourcentage. Multiplie d'abord, puis divise — l'ordre compte : diviser puis multiplier tronque la précision que tu voulais garder.

Pour une précision sub-pourcent, mets encore plus à l'échelle :

```as
multiplie Width par 9050    ! 90,50 % mis à l'échelle par 100
divise Width par 10000
```

## Trigonométrie

`sin` et `cos` sont des opérateurs intégrés sur entiers mis à l'échelle — ils prennent un angle en degrés et un facteur `rayon` qui met le résultat à l'échelle. Voir [arithmetic](../reference/arithmetic.md). Le rayon n'est qu'un facteur d'échelle sous un autre nom.

## Recevoir des flottants de l'extérieur

Les chaînes qui arrivent comme `` `12.50` `` depuis un endpoint REST ou une saisie de formulaire doivent être converties en entiers mis à l'échelle avant l'arithmétique. L'opérateur de valeur `échelle` fait exactement ça — il lit une chaîne décimale et retourne l'entier mis à l'échelle, en arrondissant au demi le plus proche en s'éloignant de zéro quand la chaîne a plus de chiffres que l'échelle n'en demande :

```as
! Suppose que Input vaut `12.50`
mets Input échelle 100 dans Pence
! Pence vaut maintenant 1250
```

```as
mets `3.14` échelle 100 dans Pi        ! 314
mets `-3.14` échelle 100 dans Pi       ! -314
mets `42` échelle 100 dans Pence       ! 4200 — les chaînes entières marchent aussi
mets `12.345` échelle 100 dans Pence   ! 1235 — les chiffres en trop arrondissent, moitié loin de zéro
mets `.5` échelle 100 dans Half        ! 50
mets `3.` échelle 100 dans Three       ! 300
```

Le facteur d'échelle doit être un entier positif, et la chaîne doit être un décimal propre — tout le reste (`` `abc` ``, `` `3.1.4` ``, échelle 0) lève une erreur d'exécution, donc une mauvaise entrée venue de l'extérieur remonte bruyamment. La conversion se fait en arithmétique entière, donc `12.345 échelle 100` vaut exactement 1235 — jamais 1234 à cause du bruit des virgules flottantes.

Avant que `échelle` n'existe, c'était une danse de découpage sur le point en six lignes ; regarde l'historique git si tu es curieux de voir à quoi ça ressemblait.

## Anti-motif : de l'arithmétique sur la forme chaîne

```as
ajoute `0.5` à Counter      ! FAUX — `0.5` est une chaîne
```

Les opérateurs arithmétiques attendent des valeurs numériques. Pour faire le calcul, les deux côtés doivent déjà être des entiers mis à l'échelle :

```as
ajoute 5 à Counter          ! si Counter est mis à l'échelle par 10 (soit 0,5 → 5)
```

## Anti-motif : diviser avant de multiplier

```as
divise Total par 100       ! la division entière perd les pence
multiplie Total par 90      ! échelle fausse
```

La division entière tronque. Multiplie d'abord, puis divise :

```as
multiplie Total par 90
divise Total par 100
```

## À voir aussi

- [arithmetic](../reference/arithmetic.md) — le modèle entier-d'abord et le vocabulaire des opérateurs.
- [values-and-types](../reference/values-and-types.md) — les chaînes contre les nombres.
- [strings-and-text](../reference/strings-and-text.md) — `gauche`, `depuis`, `position de` pour l'analyse.
