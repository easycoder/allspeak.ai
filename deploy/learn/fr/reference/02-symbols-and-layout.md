# Symboles et mise en page

AllSpeak possède une surface lexicale volontairement réduite. **Quatre symboles de ponctuation** portent du sens ; tout le reste, ce sont des mots. Les marqueurs de blocs de documentation ajoutent une cinquième catégorie lexicale pour la prose, posée par-dessus.

Tout caractère non alphanumérique hors d'une chaîne ou d'un commentaire qui n'est pas l'un de ces quatre symboles est une erreur de compilation. Il n'y a ni parenthèses, ni accolades, ni crochets, ni points-virgules, ni `+`, `=`, `*` infixes. Les opérateurs sont des mots-clés ; le regroupement se fait par la mise en page, pas par la ponctuation.

## Les quatre symboles

| Symbole | Signification |
|---------|---------------|
| `!` | Commentaire. Tout ce qui suit `!` jusqu'à la fin de la ligne est ignoré. (Dans une chaîne entre apostrophes inversées, `!` n'est que du texte.) |
| `` ` `` | Délimiteur de chaîne littérale. Des paires appariées encadrent un texte constant, éventuellement sur plusieurs lignes. |
| `:` | Terminaison d'étiquette. Un mot suivi de `:` en début de ligne déclare une étiquette. |
| `-` | Préfixe de négation sur un littéral numérique : `-3`. Il n'y a pas de `-` infixe ; la soustraction est le mot-clé `soustrais`. |

## Commentaires

Les commentaires commencent par `!` et vont jusqu'à la fin de la ligne :

```as
! Ceci est un commentaire.
ajoute 1 à Counter   ! Commentaire en fin de ligne.
```

Utilise-les pour marquer les blocs fonctionnels du script. Ne te repose pas uniquement sur les noms de variables pour faire passer l'intention. Les commentaires de fin de ligne sont parfaits quand l'explication n'est pas évidente ; pour tout ce qui dépasse une phrase, préfère un bloc de documentation (ci-dessous).

## Chaînes littérales

Les apostrophes inversées délimitent un texte constant :

```as
mets `Bonjour, le monde !` dans Greeting
```

Une chaîne entre apostrophes inversées peut s'étendre sur plusieurs lignes de source :

```as
mets `ligne 1
    `ligne 2
    `ligne 3` dans Message
```

Chaque ligne de continuation commence par une apostrophe inversée après l'éventuel espace de début. L'espace de début et l'apostrophe inversée de continuation sont retirés, et les lignes sont jointes sans saut de ligne. L'exemple ci-dessus produit la chaîne `ligne 1ligne 2ligne 3`.

Il n'y a pas de syntaxe d'échappement dans les apostrophes inversées. Pour inclure un saut de ligne, une tabulation ou une apostrophe inversée littérale, utilise les mots-clés de valeur `nouvelleligne`, `tabulation` et `backtick` avec `cat` :

```as
mets `Ligne 1` cat nouvelleligne cat `Ligne 2` dans Message
```

`nouvelleligne`, `tabulation` et `backtick` font partie d'un ensemble plus large de mots-clés de valeur nue (qui comprend aussi `vide`, `maintenant`/`horodatage`, `aujourdhui`, `saut`, `uuid`) ; voir [valeurs et types](values-and-types.md#special-value-keywords) pour la liste complète. Voir [chaînes et texte](strings-and-text.md) pour les motifs de `cat`.

## Étiquettes

Une étiquette est un mot suivi de `:` en début de ligne :

```as
Loop:
    ajoute 1 à Counter
    si Counter est inférieur à 10 va à Loop
```

Les étiquettes sont les cibles de `va à`, `vasous` et de l'enregistrement des gestionnaires d'événements (`sur clic X vasous Label`).

## Nombres

Les littéraux entiers ne sont que des chiffres. Les nombres négatifs s'écrivent avec un préfixe `-` :

```as
mets -3 dans Offset
```

Il n'existe pas de littéraux à virgule flottante au niveau syntaxique — les nombres qui ressemblent à des flottants (`3.14`) sont des chaînes. Voir [arithmétique](arithmetic.md) pour le motif des entiers mis à l'échelle.

## Marqueurs de blocs de documentation

Une catégorie lexicale à part, utilisée pour la convention des blocs de documentation plutôt que pour la sémantique d'exécution :

- `!!` ouvre et poursuit un bloc de documentation. Chaque ligne `!!` est un paragraphe de prose.
- `!!!` (trois points d'exclamation) ferme le bloc.

```as
!! Brève explication de ce que fait cette section et pourquoi.
!! Une ligne !! nue sépare les paragraphes.
Section:
    ! le code
    retourne
!!!
```

Les blocs de documentation sont retirés avant la compilation. Convention complète dans [blocs de documentation](doc-blocks.md).

## Mise en page

Le code est structuré par l'indentation, pas par la ponctuation.

- Les étiquettes commencent à la **marge de gauche** — colonne 1.
- Le code sous une étiquette est indenté d'une tabulation.
- Le code à l'intérieur de `début … fin` est indenté d'une tabulation supplémentaire, comme les blocs imbriqués dans d'autres langages.

```as
Main:
    définis Counter à 0
    tant que Counter est inférieur à 5 début
        ajoute 1 à Counter
        imprime Counter
    fin
    arrête
```

Si tu préfères que `début` et `fin` aient des indentations assorties — une préférence courante empruntée à d'autres langages — mets `début` sur sa propre ligne :

```as
Main:
    définis Counter à 0
    tant que Counter est inférieur à 5
    début
        ajoute 1 à Counter
        imprime Counter
    fin
    arrête
```

Les deux formes compilent. Choisis-en une et applique-la de façon cohérente dans tout le script.

Le compilateur tolère les espaces, mais une mise en page cohérente est essentielle pour la relecture. Des blocs désalignés sont un signal fort d'erreur structurelle — en particulier dans le code généré par IA.

## Lignes vides

Utilise une ligne vide pour séparer les groupes logiques :

- Entre les déclarations de variables de types différents.
- Entre le groupe principal de variables et les variables de travail (`I`, `N`, `Temp`).
- Entre les grandes sections étiquetées.

Une seule ligne vide dit : « ces choses vont ensemble comme groupe, mais se distinguent du groupe suivant. » Deux lignes ou plus n'ajoutent aucun sens mais ne font pas de mal.

## Noms de variables

Les noms commencent par une majuscule ; CamelCase ensuite. Conventions complètes dans [variables et tableaux](variables-and-arrays.md) — ce fichier ne couvre que la règle lexicale.

## Voir aussi

- [structure](structure.md) — où se situe cette couche lexicale dans le pipeline de compilation.
- [variables et tableaux](variables-and-arrays.md) — conventions complètes de nommage.
- [chaînes et texte](strings-and-text.md) — construire des chaînes avec `cat`.
- [blocs de documentation](doc-blocks.md) — `!!` et `!!!` en détail.
- [arithmétique](arithmetic.md) — pourquoi `-` n'est qu'un préfixe numérique.
