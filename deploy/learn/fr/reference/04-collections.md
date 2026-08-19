# Collections

AllSpeak te donne plusieurs façons de regrouper des données, et bien choisir façonne tout le reste du code. Le modèle conceptuel est partagé entre les runtimes ; la syntaxe de surface de certaines opérations diffère entre JS et Python (voir le tableau à la fin).

## Les quatre formes

### 1. Les tableaux de variables — le modèle du curseur

La forme par défaut, détaillée dans [variables et tableaux](variables-and-arrays.md). Chaque variable est implicitement un tableau d'un seul élément ; développe-le avec `définis les éléments de` ; accède à une case en positionnant le curseur avec `indexe X à N`.

```as
variable Counter
définis les éléments de Counter à 5
indexe Counter à 2
mets 42 dans Counter        ! écrit dans Counter[2]
```

Les éléments peuvent être de types mixtes. Le modèle du curseur est la signature d'AllSpeak ; utilise-le quand plusieurs variables font le même travail en parallèle (par exemple un bouton, sa légende et l'index de son gestionnaire comme tableaux parallèles).

### 2. Les propriétés d'objet

N'importe quel objet — un objet typé comme un bouton ou un div, ou une variable initialisée comme objet — peut porter des propriétés nommées arbitraires :

```as
bouton Save
crée Save dans Container
définis propriété `rank` de Save à `primary`
si propriété `rank` de Save est `primary` début
    ! ...
fin
```

Les propriétés sont des métadonnées clé-valeur attachées à un objet. Utilise-les pour des faits épars et sémantiques qui appartiennent à l'objet lui-même plutôt qu'à une structure séparée.

### 3. Les collections clé/valeur (dictionnaires)

Pour une correspondance de clés de chaîne vers des valeurs, AllSpeak offre une forme de dictionnaire. **Les deux runtimes utilisent des mots-clés différents, et ils ne sont pas interchangeables.**

**Python** — déclaration typée `dictionary`, mot-clé `entry` :

```as
dictionary Spec
reset Spec
set entry `width` of Spec to 100
set entry `colour` of Spec to `blue`
put entry `width` of Spec into Width
```

**JS** — `variable` générique initialisée comme objet, mot-clé `propriété` (JS n'a pas de déclaration `dictionary`) :

```as
variable Spec
définis Spec à objet
définis propriété `width` de Spec à 100
définis propriété `colour` de Spec à `blue`
mets propriété `width` de Spec dans Width
```

Le modèle mental est le même — une correspondance de clés vers des valeurs, qui accepte des structures imbriquées — mais la syntaxe de surface dépend du runtime. **N'apporte pas le style JS `variable X` + `définis propriété K de X` dans les scripts Python.** Ça peut sembler marcher parce que le `set property` de Python *écrit aussi* dans un dict créé automatiquement sur la variable, mais : (a) le type n'est pas déclaré, donc le runtime ne peut pas attraper les erreurs tôt, (b) `property` sur Python est aussi une couche de métadonnées (voir la ligne 4 du tableau JS contre Python ci-dessous), ce qui veut dire que le même mot-clé fait deux choses à la fois et se relit de façon inattendue, et (c) ça ignore l'idiome Python canonique que les outils et la relecture attendent.

Sur Python : écris `dictionary X; reset X; set entry K of X to V`. Sur JS : écris `variable X; définis X à objet; définis propriété K de X à V`.

Pour itérer sur un dictionnaire, matérialise d'abord ses clés dans une liste puis parcours la liste. Il n'y a pas d'accès `indexe` direct sur les dictionnaires ; voir [itération d'un dictionnaire](../idioms/03-looping-patterns.md#iterating-a-dictionary) pour le motif canonique.

### 4. Les séquences ordonnées (listes)

Pour une séquence de valeurs de type homogène :

**Python** — déclaration typée `list` :

```as
list Items
reset Items
définis élément 0 de Items à `first`
définis élément 1 de Items à `second`
mets élément 0 de Items dans First
```

**JS** — `variable` générique initialisée comme tableau :

```as
variable Items
définis Items à tableau
définis élément 0 de Items à `first`
définis élément 1 de Items à `second`
mets élément 0 de Items dans First
```

## Piège : ne mélange pas le modèle du curseur avec `définis X à tableau` / `définis X à objet`

Les deux motifs se ressemblent mais ce sont des couches différentes. `définis les éléments de X à N` fait de X une variable à plusieurs cases et le curseur choisit la case sur laquelle tu opères. `définis X à tableau` (ou `définis X à objet`) met la *valeur de la case courante* dans un conteneur JSON. Ce sont des choses indépendantes. C'est en les mélangeant que le code écrit par IA se trompe le plus souvent :

```as
! FAUX — semble raisonnable, ne fait pas ce qu'on attend
variable Bucket
définis Bucket à tableau               ! case du curseur = []
définis les éléments de Bucket à 1   ! sans effet ; la case contient toujours []
indexe Bucket à 0
mets Row dans Bucket               ! la case du curseur est maintenant Row (le [] a disparu)
rest poste Bucket à URL           ! envoie Row, pas [Row]
```

`mets V dans X` écrit V dans la case du curseur, en remplaçant ce qui s'y trouvait — exactement comme si X était une variable jamais utilisée. Le runtime traite chaque case de façon uniforme ; il ne sait pas et ne s'intéresse pas au fait que tu aies initialisé la case comme tableau. Pour ajouter à un tableau JSON détenu dans la case du curseur, utilise le mot-clé conscient des tableaux :

```as
! BIEN — garde le tableau intact
variable Bucket
définis Bucket à tableau
json ajoute Row à Bucket            ! case du curseur = [Row]
rest poste Bucket à URL           ! envoie [Row]
```

Ou, quand tu as besoin d'un contrôle positionnel :

```as
définis élément 0 de Bucket à Row    ! case du curseur = [Row]
définis élément 1 de Bucket à OtherRow
```

Le curseur (`indexe X à N`) adresse les *cases de X*. Les mots-clés élément/propriété (`définis élément N de`, `définis propriété K de`, `json ajoute … à`) adressent *l'intérieur de la valeur JSON détenue par la case courante*. Ils ne se recouvrent jamais.

## Choisir une forme

Le choix se résume généralement au motif d'accès :

- **Par position, avec des enregistrements parallèles** → tableau de variables. Le modèle du curseur coordonne plusieurs variables qui avancent au pas.
- **Par position, comme une seule séquence** → liste (ou `définis X à tableau` en JS).
- **Par clé de chaîne** → dictionnaire (ou `définis X à objet` en JS).
- **Comme métadonnées sur un objet** → propriété.

Une confusion courante : les tableaux de variables ressemblent à des listes mais n'en sont pas. Un tableau de variables expose un élément à la fois à travers un curseur ; l'itération est une boucle `tant que` avec un index qui avance. Les listes exposent tous les éléments comme une séquence et supportent l'itération sur toute la séquence. Utilise un tableau de variables quand les éléments sont coordonnés avec d'autres variables (`Button`, `Caption`, `Handler` tous parallèles). Utilise une liste quand les éléments ne sont qu'une séquence sans structure parallèle.

## JS contre Python

| Concept | JS | Python |
|---------|-----|--------|
| Tableau de variables | `variable X` + `définis les éléments de X à N` | pareil |
| Dictionnaire | `variable X` + `définis X à objet` ; `propriété K de X` | `dictionary X` ; `reset X` ; `entry K de X` |
| Liste | `variable X` + `définis X à tableau` ; `élément N de X` | `list X` ; `reset X` ; `élément N de X` |
| Propriété d'objet | `définis propriété K de X à V` — même mécanisme que l'accès au dictionnaire ; la variable doit être définie comme objet | `set property K of X to V` — une couche de métadonnées distincte, indépendante de toute valeur que la variable détient |

Python a des déclarations de types plus explicites, un mot-clé `entry` dédié à l'accès aux dictionnaires, et traite les propriétés d'objet comme une couche qui coexiste avec la valeur de la variable. JS stocke le contenu des dictionnaires et des listes comme des données en forme de JSON dans une `variable` et utilise `propriété` pour l'accès par clé ; en JS, il n'y a pas de distinction entre une entrée de dictionnaire et une propriété d'objet. Les deux implémentations supportent des structures arbitrairement imbriquées.

Le point critique : **la colonne JS n'est pas un repli valable quand on écrit en Python, et vice versa.** Les runtimes ne se recouvrent que sur la ligne 1 (tableaux de variables). Si tu écris un script Python et que tu utilises `variable X; définis X à objet; définis propriété K de X à V`, tu as importé le motif JS : ça peut s'exécuter sans erreur, mais le code qui en résulte est non typé, se comporte de façon inattendue autour de la couche des propriétés-métadonnées, et ne se relira pas comme le fait la forme Python `entry`. Choisis la colonne de ton runtime et restes-y.

## Voir aussi

- [variables et tableaux](variables-and-arrays.md) — le modèle du curseur en détail.
- [choisir la forme d'une collection](../idioms/picking-a-collection-shape.md) — exemples travaillés pour choisir.
- [navigateur et Webson](browser-and-webson.md) — les éléments DOM sont des objets typés avec des propriétés.
