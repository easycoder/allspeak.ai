# Motifs de boucles

## Problème

Tu as besoin de répéter du travail — itérer sur une liste, animer une image, sonder une condition, piloter une machine à états. AllSpeak offre `tant que` et des boucles pilotées par des étiquettes. Chacune convient mieux à certaines formes de problèmes que l'autre.

## La forme `tant que`

La boucle de tous les jours. Le corps s'exécute tant que la condition tient :

```as
définis N à 0
tant que N est inférieur à 5 début
    imprime N
    ajoute 1 à N
fin
```

Utilise `tant que` quand :

- Une seule condition décide de continuer ou pas.
- Le corps est du code séquentiel simple.
- Tu veux un seul point d'entrée et un seul point de sortie.

La forme à instruction unique convient aux cas triviaux :

```as
tant que pas Ready attends 10 millis
```

Voir [control-flow](../reference/control-flow.md) pour la mécanique formelle.

## La forme pilotée par les étiquettes

Une étiquette avec un `va à` qui y revient forme une boucle plus flexible que `tant que`. Il y a deux cadrages naturels.

**Test de sortie.** Vérifie en haut s'il faut partir ; sinon, fais le travail et reboucle :

```as
définis N à 0
Loop:
    si N est supérieur à 4 va à Done
    imprime N
    ajoute 1 à N
    va à Loop
Done:
    ! ...
```

**Test de continuation.** Enveloppe le corps dans un `si` pour la condition de continuation ; la boucle sort en tombant hors du `si` :

```as
définis N à 0
Loop:
    si N est pas supérieur à 4 début
        imprime N
        ajoute 1 à N
        va à Loop
    fin
    ! ...
```

Les deux sont équivalents dans ce cas simple. Pour les boucles à sorties multiples (plusieurs raisons de s'arrêter), la forme test de sortie se généralise plus facilement. Pour une condition de continuation unique et claire, la forme test de continuation est structurellement plus proche de `tant que`.

Utilise une boucle pilotée par les étiquettes quand :

- La condition de sortie est compliquée (plusieurs chemins de sortie, des décisions en plein corps).
- Tu veux un saut façon `continue` sans restructurer toute la boucle.
- Tu intègres des flux `vasous` qui utilisent déjà des étiquettes.
- La « boucle » est en réalité une machine à états avec un état étiqueté par phase.

Comparée à `tant que`, c'est plus verbeux pour les cas simples mais plus honnête quand le contrôle de boucle est complexe.

## Itération comptée

La boucle canonique. Initialise le compteur, boucle tant qu'on est dans la plage, incrémente à la fin :

```as
définis N à 0
tant que N est inférieur à Count début
    ! ... travail utilisant N ...
    ajoute 1 à N
fin
```

`Count` est ce qui détient la taille — typiquement une variable séparée définie plus tôt (par ex. quand le tableau a été dimensionné). AllSpeak n'expose pas de longueur intégrée pour les tableaux de variables côté lecture ; suis le compte toi-même.

Place l'incrément à la fin du corps pour que chaque itération fasse son travail et avance le compteur.

## Itération avec le modèle du curseur

Quand la boucle parcourt plusieurs tableaux parallèles en pas synchronisé, positionne le curseur sur chacun dans le corps :

```as
définis N à 0
tant que N est inférieur à Count début
    indexe Caption à N
    indexe Target à N
    indexe Visited à N
    ! ... travail avec les valeurs indexées ...
    ajoute 1 à N
fin
```

C'est la forme AllSpeak idiomatique pour l'accès aux enregistrements par position (voir [picking-a-collection-shape](picking-a-collection-shape.md)).

## Itérer sur un dictionnaire

Un dictionnaire n'a pas de forme d'itération intégrée. Il n'y a pas de forme « pour chaque entrée », et tu ne peux pas utiliser `indexe` sur un dictionnaire directement comme sur un tableau de variables. **Le schéma canonique est : tire d'abord les clés dans une liste, puis itère cette liste et récupère chaque valeur par clé.**

```as
mets les clés de Config dans Keys
mets 0 dans K
tant que K est inférieur à le compte de Keys début
    mets article K de Keys dans Name
    mets entrée Name de Config dans Value
    ! ... travail avec Name (la clé) et Value (l'entrée) ...
    ajoute 1 à K
fin
```

Les deux recherches dans la boucle sont la partie porteuse :

- `article K de Keys` est un accès positionnel dans la *liste de clés* — c'est pourquoi le schéma du curseur y fonctionne. `Keys` est une liste ordinaire une fois que tu l'as matérialisée.
- `entrée Name de Config` est la lecture du dictionnaire par clé. (Sur JS, c'est `propriété Name de Config` ; voir la séparation des runtimes dans [collections](../reference/collections.md).)

N'essaie pas d'écrire `indexe Config à K` et de lire les valeurs de cette façon — `indexe` parcourt les cases d'une variable multi-cases, pas les entrées d'un dictionnaire ; ce sont deux formes différentes. Les clés d'un dictionnaire sont non ordonnées comme type de données, mais la liste produite par `les clés de` est un instantané ordonné figé au moment où tu l'appelles, ce qui fait marcher le schéma d'itération comptée.

Si tu n'as besoin que des valeurs (rare), le même squelette s'applique — matérialise `les clés de` une fois, itère par index, lis chaque valeur par clé. Il n'y a pas de raccourci `les valeurs de`.

## Sondage

Attends un drapeau avec un rendu de la main dans le corps :

```as
tant que pas Ready attends 50 millis
```

Le `attends` laisse les autres fils (gestionnaires d'événements, fils bifurqués, callbacks réseau) s'exécuter. Sans lui, le runtime est affamé. Voir [cooperative-multitasking](../reference/cooperative-multitasking.md).

## Animation

Une boucle `tant que vrai` qui tourne pour toujours, cédant la main à chaque image :

```as
tant que vrai début
    ! ... avance d'une image ...
    attends 16 millis
fin
```

Termine-la depuis l'extérieur (un drapeau d'arrêt, un terminateur de fil). Le `attends` définit la cadence — 16 ms ≈ 60 images par seconde.

## Sauter des itérations

Il n'y a pas de `continue`. Pour sauter le reste d'une itération, saute jusqu'à l'étape de fin de corps :

```as
définis N à 0
tant que N est inférieur à 10 début
    si N modulo 2 est 0 va à Skip
    imprime N
Skip:
    ajoute 1 à N
fin
```

Le `va à Skip` saute l'impression mais laisse l'incrément s'exécuter. Pour une logique de saut plus élaborée, la forme pilotée par les étiquettes se lit souvent mieux.

## Compte à rebours

Les mêmes schémas fonctionnent en comptant à rebours. Initialise le compteur en haut, boucle tant qu'il est encore non négatif, décrémente en bas :

```as
définis N à 9
tant que N est pas inférieur à 0 début
    imprime N
    soustrais 1 depuis N
fin
```

`est pas inférieur à 0` se lit comme ≥ 0 — voir [conditions](../reference/conditions.md) pour les comparaisons inversées.

## Anti-motif : boucle sans céder la main

```as
tant que pas Ready début
    ! ... vérifie ...
fin
```

Une boucle sans `attends` ni `arrête` bloque tous les autres fils du runtime. L'interface se fige, les gestionnaires d'événements ne se déclenchent pas, les fils bifurqués calent. Inclus toujours un `attends` ou termine rapidement.

## Anti-motif : décalage d'un avec le mauvais opérateur

```as
tant que N est inférieur à 5 début          ! s'exécute pour N = 0,1,2,3,4 → cinq fois
tant que N est pas supérieur à 5 début       ! s'exécute pour N = 0,1,2,3,4,5 → six fois
```

Si tu commences à 0 et qu'il te faut exactement N itérations, la condition est `est inférieur à N`. Si tu commences à 1, c'est `est pas supérieur à N`. Choisir la mauvaise est le bug de décalage d'un canonique.

## À voir aussi

- [control-flow](../reference/control-flow.md) — `tant que`, `si`, `début … fin`.
- [variables-and-arrays](../reference/variables-and-arrays.md) — le modèle du curseur qu'utilisent souvent les boucles.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — pourquoi `attends` est obligatoire dans les longues boucles.
- [event-handlers-and-array-index](event-handlers-and-array-index.md) — boucles + gestionnaires pour les tableaux d'éléments d'interface.
