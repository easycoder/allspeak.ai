# Chaînes et texte

Le type chaîne d'AllSpeak est le conteneur de texte de tous les jours. Ce fichier liste les opérations que le noyau fournit pour inspecter et transformer les chaînes.

Les littéraux entre apostrophes inversées et la concaténation `cat` sont couverts dans [symboles et mise en page](symbols-and-layout.md) et [cat et construction de chaînes](../idioms/cat-and-string-building.md).

## Longueur

`la longueur de X` renvoie le nombre de caractères :

```as
mets la longueur de `Hello, world!` dans N
! N vaut 13
```

## Découpage

Quatre formes, qui produisent toutes une sous-chaîne sans modifier l'original :

```as
mets gauche 5 de `Hello, world!` dans A         ! "Hello"
mets droite 6 de `Hello, world!` dans B        ! "world!"
mets depuis 7 de `Hello, world!` dans C         ! "world!"   (de la position 7 à la fin)
mets depuis 7 à 12 de `Hello, world!` dans D   ! "world"    (positions 7..11, fin exclue)
```

- `gauche N de X` — les N premiers caractères. N doit être un entier non négatif.
- `droite N de X` — les N derniers caractères. N doit être un entier non négatif.
- `depuis N de X` — tout depuis la position N jusqu'à la fin.
- `depuis N à M de X` — la sous-chaîne couvrant les positions N..M (M exclu).

Les indices de position commencent à 0.

### Erreurs courantes de découpage

**❌ N négatif avec `gauche`/`droite`**

AllSpeak ne prend **pas** en charge les compteurs négatifs. `gauche -2 de X` n'est pas valide — ce n'est pas traité comme « tout sauf les 2 derniers caractères ».

Pour obtenir **tout sauf les N derniers caractères**, utilise l'arithmétique de longueur avec `depuis` :

```as
! Scinder « 1998 » en livres="19" et pence="98"
mets `1998` dans MoneyStr
mets la longueur de MoneyStr dans MoneyLen  ! 4
mets MoneyLen dans Pos
soustrais 2 depuis Pos                       ! Pos = 2
mets depuis 0 à Pos de MoneyStr dans Whole  ! "19"   (positions 0..1)
mets depuis Pos de MoneyStr dans Cents       ! "98"   (positions 2..3)
```

Ou de façon équivalente avec `gauche` et `droite` :

```as
mets `1998` dans MoneyStr
mets la longueur de MoneyStr dans MoneyLen  ! 4
soustrais 2 depuis MoneyLen                  ! MoneyLen = 2
mets gauche MoneyLen de MoneyStr dans Whole  ! "19"
mets droite 2 de MoneyStr dans Cents        ! "98"
```

## Recherche de position

`position de X dans Y` renvoie l'indice de la première occurrence de X dans Y, ou -1 si introuvable :

```as
mets position de `,` dans `Hello, world!` dans Comma
! Comma vaut 5
```

Pour trouver la *dernière* occurrence, utilise `la position de le dernier` :

```as
mets la position de le dernier `,` dans Text dans P
```

Pour analyser des entrées structurées simples — scinder `` `12.50` `` en livres et pence, trouver le délimiteur dans une ligne « clé=valeur » — `position de` plus les opérateurs de découpage donnent un analyseur utilisable. Voir [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md) pour un exemple détaillé.

## Conversion de casse

```as
mets minuscule `Bonjour` dans X        ! "bonjour"
mets uppercase `Bonjour` dans Y        ! "BONJOUR"
```

Les deux produisent une nouvelle chaîne ; l'original est inchangé.

## Rogne

`rogne X` retire les espaces de début et de fin :

```as
mets rogne `   spacieux   ` dans Tidy
! Tidy est "spacieux"
```

## Remplacement de sous-chaîne

`remplace X avec Y dans Var` modifie `Var` sur place, en substituant **chaque** occurrence de X par Y :

```as
mets `voiture rouge, vélo rouge, chaussures rouges` dans List
remplace `rouge` avec `bleu` dans List
! List est "voiture bleue, vélo bleu, chaussures bleues"
```

Deux choses à noter :

- C'est une instruction, pas une valeur — elle réécrit dans la variable nommée.
- Elle remplace toujours toutes les occurrences ; il n'y a pas de variante à occurrence unique.

Pour préserver l'original, copie d'abord :

```as
mets OriginalText dans Working
remplace `foo` avec `bar` dans Working
! OriginalText est intact
```

## Test d'inclusion

`X contient Y` teste si X contient Y comme sous-chaîne (utilisé dans une condition) :

```as
si Path contient `/api/` ...
si Email contient `@` ...
```

Voir [conditions](conditions.md) pour l'ensemble complet des conditions liées aux chaînes (`est`, `commence avec`, `termine avec`, `contient`).

## Chaînes multi-lignes

Les littéraux entre apostrophes inversées peuvent s'étendre sur plusieurs lignes. Chaque ligne de continuation commence par une apostrophe inversée après son espace de début ; les lignes sont jointes sans saut de ligne :

```as
définis Css à `position:relative;
    `width:90%;
    `border:1px solid black;`
```

Pour insérer un vrai saut de ligne, une tabulation ou une apostrophe inversée, utilise les mots-clés de valeur avec `cat` :

```as
mets `Ligne 1` cat nouvelleligne cat `Ligne 2` dans Deux
```

`nouvelleligne`, `tabulation` et `backtick` font partie d'un petit ensemble fermé de mots-clés de valeur nue — les autres sont `vide`, `maintenant`/`horodatage`, `aujourdhui`, `saut` et `uuid`. Voir [valeurs et types](values-and-types.md#special-value-keywords) pour la liste complète, et [symboles et mise en page](symbols-and-layout.md) et [cat et construction de chaînes](../idioms/cat-and-string-building.md) pour les motifs de `cat`.

## Chaînes et nombres

Une chaîne qui ne contient que des chiffres est traitée comme numérique quand l'arithmétique demande un nombre :

```as
mets `42` dans N
ajoute 1 à N         ! N vaut maintenant 43
```

Une chaîne à contenu décimal (`3.14`) n'est *pas* promue automatiquement ; l'arithmétique d'AllSpeak est entière d'abord. Voir [arithmétique](arithmetic.md) et [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md).

Pour tester si une valeur peut être utilisée comme nombre, utilise la condition `est numérique` :

```as
si Input est numérique ...
```

## Voir aussi

- [symboles et mise en page](symbols-and-layout.md) — littéraux entre apostrophes inversées, chaînes multi-lignes.
- [cat et construction de chaînes](../idioms/cat-and-string-building.md) — concaténation infixe `cat`, motifs de gabarits.
- [conditions](conditions.md) — conditions liées aux chaînes.
- [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md) — analyser les chaînes à allure décimale.
- [valeurs et types](values-and-types.md) — l'indicateur numérique/non numérique.
