# Arithmétique

L'arithmétique d'AllSpeak est **entière d'abord**. Il n'y a pas de littéraux à virgule flottante au niveau du langage ; toute l'arithmétique travaille sur des entiers. Les nombres qui ressemblent à des flottants (`3.14`) sont des chaînes, pas des valeurs numériques. Quand une précision fractionnaire est nécessaire, utilise le motif des entiers mis à l'échelle (plus bas).

## Opérateurs

Toute l'arithmétique est pilotée par des mots-clés — il n'y a pas d'opérateurs infixes comme `+`, `-`, `*`, `/`.

Binaire (au niveau instruction) :

```
ajoute A à B
ajoute A à B donnant C
soustrais A depuis B
soustrais A depuis B donnant C
multiplie A par B
multiplie A par B donnant C
divise A par B
divise A par B donnant C
```

`modulo` est un animal différent : un opérateur binaire **au niveau valeur** plutôt qu'une instruction — voir [la section sur le reste](#remainder) plus bas.

Unaire :

```
oppose X
oppose X donnant Y
```

`donnant` écrit le résultat dans une nouvelle variable sans modifier la source.

## Exemples

```as
ajoute 1 à Counter         ! Counter est maintenant Counter + 1
soustrais 5 depuis Total    ! Total est maintenant Total - 5
multiplie Width par 2       ! Width est maintenant Width × 2
divise Total par 100        ! Total est maintenant Total ÷ 100 (division entière)
ajoute 1 à Counter donnant NewCounter   ! Counter inchangé, NewCounter = Counter + 1
oppose Height               ! Height est maintenant -Height
oppose Balance donnant Opposite         ! Balance inchangé, Opposite = -Balance
```

## Ce qui compte comme valeur numérique

L'arithmétique ne travaille que sur de **vraies valeurs numériques**. Une valeur produite par une **opération de chaîne** (`gauche N de`, `droite N de`, `depuis N de`, `cat`, `le contenu de`) est une chaîne — même si la chaîne ne contient que des chiffres. L'arithmétique sur une telle valeur peut être rejetée ou produire des résultats inattendus.

Pour convertir une chaîne à allure numérique en un vrai nombre, utilise `la valeur de` :

```as
mets gauche 4 de BookingDate dans FY          ! FY = "2025" (chaîne)
ajoute 1 à FY                                 ! peut échouer — FY est une chaîne
mets la valeur de FY dans NextYr              ! NextYr = 2025 (nombre)
ajoute 1 à NextYr                             ! NextYr = 2026 (nombre) ✓
```

`la valeur de` est documenté dans [valeurs et types](values-and-types.md).

## Entiers mis à l'échelle

Pour l'argent, les pourcentages, les mesures et autres quantités qui ont conceptuellement une précision fractionnaire, stocke la valeur comme un entier multiplié par un facteur d'échelle, et ne divise que lors de l'affichage.

```as
! Stocker 12,50 £ comme 1250 pence
mets 1250 dans Price

! Afficher comme « 12,50 £ »
divise Price par 100 donnant Pounds
mets Price modulo 100 dans Pence
```

Le motif des entiers mis à l'échelle est traité en détail dans [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md).

## Notes sur la division

La division entière tronque vers zéro :

```as
divise 10 par 3         ! 3
divise -10 par 3        ! -3
```

Pour le reste, utilise `modulo` — un vrai opérateur binaire utilisable partout où une valeur est attendue (pas une instruction comme `ajoute`/`divise`) :

```as
mets 10 modulo 3 dans R    ! R = 1
mets 17 modulo 5 dans N    ! l'opérande de gauche peut être n'importe quelle valeur
si Score modulo 2 est 0 ...    ! fonctionne aussi dans les conditions
mets I modulo Max dans I   ! bouclage cyclique classique : 0..Max-1, puis retour à 0
```

L'opérande de gauche peut être une constante, une variable ou n'importe quelle expression de valeur ; les deux opérandes sont évalués et le résultat est le reste entier. `modulo` est un outil pratique de bouclage pour faire tourner un index sur une plage fixe.

## `échelle` — des chaînes décimales aux entiers mis à l'échelle

`<chaîne décimale> échelle <entier positif>` convertit une représentation textuelle d'un nombre en entier mis à l'échelle, en arrondissant **loin de zéro** quand la chaîne porte plus de décimales que ne le demande l'échelle :

```as
mets `3.14` échelle 100 dans Pi        ! 314
mets `12.345` échelle 100 dans Pence   ! 1235 — 12.345 arrondi à 1234,5 → 1235
mets `-3.14` échelle 100 dans Pi       ! -314
mets `42` échelle 100 dans Pence       ! 4200 — les chaînes entières marchent aussi
mets `.5` échelle 100 dans Half        ! 50
```

L'opérande de gauche doit être une chaîne décimale propre (`3`, `3.14`, `.5`, `-3.14`) ; toute autre chose (`` `abc` ``, `` `3.1.4` ``) est une **erreur d'exécution**, de même qu'une échelle qui n'est pas un entier positif. La conversion utilise l'arithmétique entière, donc les résultats sont exacts — `12.345 échelle 100` n'est jamais 1234 malgré le bruit des flottants. L'usage canonique est d'analyser les valeurs REST/formulaires entrantes vers le motif des entiers mis à l'échelle — voir [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md).

## Composantes de temps

`l année de X`, `le mois de X`, `le jour de X`, `le numerodujour de X`, `l heure de X`, `la minute de X`, `la seconde de X` extraient des composantes d'un horodatage Unix (secondes depuis l'époque). Elles renvoient toujours un nombre :

| Accesseur | Renvoie | Plage |
|---|---|---|
| `l année de` | Année complète | p. ex. 2026 |
| `le mois de` | Numéro de mois, à partir de 0 | 0–11 |
| `le jour de` | Jour de la semaine | 0–6 (0=dimanche) |
| `le numerodujour de` | Jour du mois | 1–31 |
| `l heure de` | Heure du jour | 0–23 |
| `la minute de` | Minute dans l'heure | 0–59 |
| `la seconde de` | Seconde dans la minute | 0–59 |

```as
mets l horodatage dans Now
mets l année de Now dans YYYY               ! p. ex. 2026
mets le mois de Now dans MM                 ! 0=janv., 5=juin (à partir de 0)
ajoute 1 à MM                               ! passer en numérotation à partir de 1
mets le numerodujour de Now dans DD          ! jour du mois, 1-31
```

Autre option : analyser une chaîne de date ISO avec `date X` :

```as
mets date `2026-05-15` dans Stamp
mets le mois de Stamp dans MM               ! 5
```

## Voir aussi

- [valeurs et types](values-and-types.md) — ce qui compte comme nombre ; l'indicateur numérique/non numérique ; `la valeur de`.
- [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md) — le motif des entiers mis à l'échelle pour les valeurs fractionnaires.
- [conditions](conditions.md) — `est pair`, `est impair`, `est numérique`.
- [symboles et mise en page](symbols-and-layout.md) — `-` comme préfixe numérique.
