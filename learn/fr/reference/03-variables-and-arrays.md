# Variables et tableaux

En AllSpeak, les variables sont des conteneurs. Une variable peut contenir une valeur (nombre, chaîne, booléen) ou représenter une entité (un élément DOM, un fichier, un module). Chaque domaine — Core, Navigateur, REST, MQTT, les domaines greffons — définit ses propres types de variables avec son propre vocabulaire.

## Nommage et portée

- Les noms de variables commencent par une majuscule. Le CamelCase est parfait — `Counter`, `UserName`, `MessageList`.
- Toutes les variables sont globales. AllSpeak n'a ni portée de bloc ni variables locales à une fonction. La seule façon d'obtenir un état privé, c'est d'exécuter un module enfant (voir [modules](modules.md)).
- Nomme les variables pour ce qu'elles contiennent, pas pour la façon dont elles sont utilisées. Un bouton représentant l'action principale s'appelle `PrimaryButton`, pas `Btn1`.
- Regroupe les variables par type et par fonction, pas par ordre alphabétique.
- Les variables de travail — des variables réutilisables à courte durée de vie comme `I`, `N`, `Temp` — sont mieux regroupées entre elles et séparées des variables principales par une ligne vide.

## Toutes les variables sont des tableaux

Chaque variable est un tableau. Par défaut, elle a un seul élément, donc la plupart du temps tu peux ignorer complètement la nature de tableau :

```as
variable Counter
mets 0 dans Counter        ! Counter[0] = 0
ajoute 1 à Counter          ! Counter[0] = 1
```

Quand tu as besoin de plus d'une case, développe le tableau avec `définis les éléments de` :

```as
définis les éléments de Counter à 5    ! Counter a maintenant 5 cases, [0]..[4]
```

Développer préserve le contenu existant ; réduire perd les valeurs d'indices élevés.

## Le modèle du curseur

L'accès à un élément précis passe par un pointeur interne positionné avec `indexe` :

```as
indexe Counter à 2
mets 42 dans Counter       ! écrit dans Counter[2]
```

Une fois indexée, la variable se comporte comme si elle n'avait qu'un seul élément. Il n'y a **aucune autre syntaxe d'accès indexé** — pas de notation `Counter[2]`, pas de `élément 2 de Counter`. Le curseur est la seule voie d'entrée, à l'image des curseurs SQL. C'est voulu : la plupart du code peut ignorer l'existence des tableaux, et le code qui en a besoin est contraint d'être explicite sur l'élément qu'il touche.

### Lire la position du curseur

Pour savoir sur quelle case se trouve le curseur, utilise `l index de` :

```as
mets l index de Counter dans N    ! N = numéro de la case actuelle
```

C'est couramment utilisé dans les gestionnaires de clic pour identifier quel élément du tableau a été cliqué (voir [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md)).

## Erreurs fréquentes avec le modèle du curseur

### ❌ Le mauvais inverse : `mets N dans index de X`

Les syntaxes de lecture et d'écriture ne sont **pas symétriques** :

```as
mets l index de X dans N      ! ✅ lecture — la forme « l index de X »
indexe X à N                   ! ✅ écriture — une commande, pas un mets
```

Un inverse naturel mais **faux** serait :

```as
mets N dans index de X          ! ❌ invalide — index n'est pas une propriété dans laquelle on peut mettre
```

La forme d'écriture est toujours `indexe X à N` — il n'existe pas de forme `mets … dans index de X`.

### ❌ Indexer au-delà de la taille dimensionnée

Chaque variable commence avec exactement un élément (la case 0). Avant d'appeler `indexe X à N` avec N > 0, il faut d'abord développer le tableau :

```as
définis les éléments de X à 10    ! cases [0]..[9]
indexe X à 5                   ! ✅ sûr
```

Le symptôme le plus courant d'un `définis les éléments de` manquant est une erreur d'exécution quand on tente `indexe X à 1` sur une variable à une seule case.

### ❌ Positionner le curseur après avoir créé l'élément

Quand on construit des éléments DOM dans un tableau, positionne le curseur **avant** `crée` :

```as
indexe DataRowDivs à I         ! ✅ curseur d'abord
crée DataRowDivs dans LogBody   ! l'élément va dans la case I
```

Créer sans avoir positionné le curseur écrit toujours dans la case courante (la case 0 par défaut), en écrasant tout élément précédent.

### ❌ Mélanger le modèle du curseur avec l'accès aux tableaux JSON

`indexe X à N` adresse les **cases de X** (le tableau propre de la variable). Cela n'a rien à voir avec `élément N de X` (qui lit à l'intérieur d'une valeur JSON détenue par la case courante). Ils ne se recouvrent jamais :

```as
indexe X à 0                   ! curseur sur la case 0
mets `[10, 20, 30]` dans X       ! la case 0 contient maintenant un tableau JSON
mets élément 1 de X dans N      ! N = 20 (à l'intérieur de la valeur JSON)
```

Une erreur d'IA courante consiste à traiter `article N de X` comme une cible d'écriture : `mets V dans article N de X`. Ce n'est **pas du AllSpeak valide** — les seules cibles de `mets` sont `dans {variable}` et `dans stockage`. Le bon motif pour écrire dans une case de variable-tableau est `indexe X à N` puis `mets V dans X`. Le mot-clé `article` sert à *lire* des tableaux JSON détenus dans une case, pas à écrire dans des cases de variable.

Voir [collections](collections.md) pour plus de détails.

## Types mixtes dans un tableau

Les éléments d'un tableau sont indépendants. Une seule variable peut contenir un nombre dans une case et une chaîne dans une autre — même si le faire signale en général une occasion manquée de modélisation (voir [choisir la forme d'une collection](../idioms/picking-a-collection-shape.md)).

## Quand utiliser des tableaux

Le signal le plus net, c'est **plusieurs variables qui font à peu près la même chose**. Trois boutons nommés `SaveButton`, `LoadButton`, `QuitButton` qui partagent des gestionnaires et des styles veulent être un seul tableau `Button` à trois éléments. Cela vaut pour les éléments DOM comme pour les données scalaires — des tableaux de `div`, `input`, `bouton` sont monnaie courante dans toute interface un peu sérieuse.

Si tu te surprends à nommer des variables `Item1`, `Item2`, `Item3` : arrête-toi, utilise un tableau.

À noter : déclarer `div X` ne **limite pas** X aux opérations DOM — c'est quand même une variable AllSpeak qui supporte tout le modèle du curseur (`indexe`, `définis les éléments de`). Le préfixe `div` contrôle seulement quel type d'élément `crée X` produit.

## Le type `variable`

`variable` est la seule forme faiblement typée : elle peut contenir des valeurs numériques, des chaînes ou des booléens, avec une conversion presque automatique. Les autres types — `fichier`, `bouton`, `dictionary`, poignées de module — sont stricts sur ce qu'ils acceptent.

## JS contre Python

Les deux implémentations suivent le même modèle pour les variables scalaires et les tableaux. Elles divergent sur les collections : Python expose `dictionary` et `list` comme des formes typées distinctes ; JS unifie le stockage comme chaînes et convertit en objets à l'entrée comme à la sortie. Voir [collections](collections.md) pour les implications.

## Voir aussi

- [collections](collections.md) — quand un élément de tableau devrait lui-même être un dictionnaire ou une liste.
- [choisir la forme d'une collection](../idioms/picking-a-collection-shape.md) — choisir entre tableau, dict et liste.
- [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md) — comment les gestionnaires d'événements savent quel élément du tableau a déclenché l'événement.
