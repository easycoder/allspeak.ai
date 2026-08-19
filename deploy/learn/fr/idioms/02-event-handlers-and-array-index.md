# Gestionnaires d'événements et index de tableau

## Problème

Tu as un tableau d'éléments d'interface — disons cinq boutons — et tu veux un seul gestionnaire qui sache lequel a été cliqué.

## Le schéma

Attache un seul gestionnaire à la variable. Il se déclenche sur n'importe quel élément et met son index à celui de l'élément déclencheur. À l'intérieur du gestionnaire, lis `l index de` du tableau pour savoir lequel a déclenché l'événement.

```as
bouton Button
définis les éléments de Button à 5
! ... crée les boutons, donne-leur des légendes ...

définis N à 0
tant que N est inférieur à 5
    ! Mise en place, etc.
    ajoute 1 à N

sur clic Button vasous à HandleClick

arrête

HandleClick:
    définis Which à l index de Button
    imprime `Bouton ` cat Which cat ` cliqué`
    retourne
```

Le runtime positionne le curseur de `Button` sur l'index de l'élément déclencheur *avant* d'entrer dans le gestionnaire. `l index de Button` dans `HandleClick` est la bonne case.

## Dimensionne le tableau d'abord

Avant de pouvoir utiliser `indexe` ou répondre aux clics sur un tableau, tu **dois** le dimensionner avec `définis les éléments de` :

```as
définis les éléments de Button à 5    ! cases [0]..[4]
```

Chaque variable commence avec exactement un élément (la case 0). Sans dimensionnement, `indexe Button à N` échoue pour N > 0, et les événements `sur clic` ne voient jamais que la case 0.

Un schéma courant consiste à déterminer le compte d'abord (depuis une récupération de données ou la mise en page), puis à dimensionner le tableau :

```as
rest obtiens Bookings depuis `bookings.php`
mets json compte de Bookings dans Count
définis les éléments de RowDivs à Count
```

## Positionne le curseur avant `crée`

Quand tu construis des éléments DOM dans un tableau, positionne le curseur sur la case cible **avant** d'appeler `crée` :

```as
indexe RowDivs à I           ! ✅ curseur sur la case I
crée RowDivs dans TableBody   ! l'élément va dans la case I
```

Si tu crées d'abord puis indexes, l'élément est dans la case 0 et le déplacement du curseur ne le réaffecte pas rétroactivement.

## Ce qu'est un gestionnaire

Un gestionnaire est un fil qui s'exécute jusqu'au bout quand son événement se produit. L'enregistrement `sur …` n'est que la mise en place ; le fil démarre quand l'événement se déclenche et se termine quand la dernière instruction du gestionnaire est atteinte. Personne n'attend sa valeur de retour parce que personne ne l'a appelé.

## Pourquoi ça marche

`vasous à HandleClick` peut être n'importe quelle instruction ou bloc. Le runtime de `sur` a déjà déterminé la source de l'événement et a mis l'index de la variable à celui de l'élément déclencheur. Ce sera souvent 0, mais comme dans l'exemple ci-dessus, la variable peut avoir n'importe quel nombre d'éléments. Le gestionnaire ne voit que l'élément qui a déclenché l'événement — le même modèle de curseur qu'ailleurs (voir [variables-and-arrays](../reference/variables-and-arrays.md)).

À noter : ça marche avec **n'importe quel** type de variable qui supporte le modèle du curseur, y compris `div X`, `bouton X`, `input X`, etc. Le préfixe de déclaration (`div`, `bouton`, `fichier`) contrôle ce que produit `crée X`, mais le modèle du curseur sous-jacent est le même que pour `variable X`.

## Anti-motif : une variable par élément

```as
sur clic Button0 vasous à HandleClick0
sur clic Button1 vasous à HandleClick1
...
```

Ça marche mais c'est plus verbeux : le gestionnaire doit traiter chaque variable séparément alors qu'elles sont conceptuellement la même chose répétée. Cinq sous-routines presque identiques qui ne diffèrent que par une constante devraient être une seule sous-routine qui lit `l index de`.

## Anti-motif : capturer la variable de boucle

```as
tant que N est inférieur à 5 début
    indexe Button à N
    ! Fais quelque chose
    ajoute 1 à N
fin
sur clic Button vasous à HandleClick

HandleClick:
    imprime `Bouton ` cat N cat ` cliqué`   ! FAUX — N vaut ce que la boucle a laissé
    retourne
```

Il n'y a pas de fermeture. `N` au moment du gestionnaire vaut ce que le code le plus récent y a écrit — généralement 5, pas l'index déclencheur. Lis toujours `l index de` dans le gestionnaire.

## Gestionnaires multi-lignes

Trois options, chacune terminant le fil du gestionnaire de façon naturelle :

**1. Déléguer à une sous-routine étiquetée.** `vasous` depuis l'enregistrement ; `retourne` à la fin de la sous-routine termine le fil (rien à quoi retourner).

```as
sur clic Button vasous à HandleClick

HandleClick:
    définis Which à l index de Button
    si Which est 0 début
        ! cas particulier pour le premier bouton
        vasous à HandleSpecial
        retourne
    fin
    imprime `Gestionnaire générique pour ` cat Which
    retourne
```

**2. Bloc en ligne.** Le fil *est* le bloc `début…fin`. Utilise `arrête` pour terminer tôt.

```as
sur clic Button début
    définis Which à l index de Button
    si Which est 0 début
        ! cas particulier pour le premier bouton
        vasous à HandleSpecial
        arrête
    fin
    imprime `Gestionnaire générique pour ` cat Which
fin
```

**3. Bloc en ligne avec transfert de contrôle.** Utilise `va à Label` pour envoyer le fil vers d'autre code (qui se termine lui-même).

```as
sur clic Button début
    définis Which à l index de Button
    si Which est 0 va à HandleSpecial
    imprime `Gestionnaire générique pour ` cat Which
fin
```

À noter : `début...fin` est une instruction unique. Le choix de la forme dépend des préférences de chacun, mais si le gestionnaire est très complexe, il mérite de vivre dans une section étiquetée où il est plus facile à documenter.

## À voir aussi

- [variables-and-arrays](../reference/variables-and-arrays.md) — le modèle du curseur sur lequel repose cet idiome.
- [control-flow](../reference/control-flow.md) — `vasous`, `retourne`, `arrête`, `va à`.
- [webson-and-as-separation](webson-and-as-separation.md) — comment les tableaux de Button sont généralement créés depuis la mise en page.
