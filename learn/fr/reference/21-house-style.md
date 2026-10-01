# Conventions de style

Le compilateur accepte plus que ce que recommande cette page. Ce qui suit, ce sont les **conventions de style** du projet — les choix qu'il fait là où le langage en laisse plusieurs ouverts, pour qu'un script écrit ce mois-ci, par une personne ou par un outil d'IA, se lise comme le reste du code. C'est une recommandation et non une règle : rien ici n'est imposé, et un script qui s'en écarte compile quand même.

Deux sujets, tous deux de mise en page : **où placer `début` et `fin`**, et **comment couper une instruction longue sur plusieurs lignes**.

## `début` et `fin` sur leurs propres lignes

`début` peut partager la ligne de l'instruction qui ouvre le bloc :

```as
tant que N est inférieur à 3 début
    imprime N
    ajoute 1 à N
fin
```

Les conventions de style lui donnent une ligne à lui, à l'indentation de l'instruction qui possède le bloc — le corps un niveau plus bas, et `fin` revenu à l'indentation de l'instruction :

```as
tant que N est inférieur à 3
début
    imprime N
    ajoute 1 à N
fin
```

Trois raisons :

- **L'étendue d'un bloc est visible sans lire sa condition.** `début` et `fin` s'alignent, donc la forme du bloc se mesure d'un coup d'œil.
- **Un `début` en fin de ligne longue est celui qu'on manque le plus facilement**, et c'est lui qui décide si les lignes suivantes forment un bloc.
- **Un changement de structure coûte une ligne dans le diff**, plutôt que quelques caractères ajoutés à une ligne longue.

### La seule exception : `sinon début`

Un mot d'ouverture de clause peut partager sa ligne avec `début`, à condition que rien d'autre ne soit sur cette ligne. `sinon début` est la forme qui revient, et c'est ainsi qu'on évite un `sinon` orphelin, seul sur sa ligne :

```as
si Name est vide
début
    définis Missing
fin
sinon début
    efface Missing
fin
```

`puis début` est permis pour la même raison. Le seul `puis` du langage suit `exécute` — ``exécute `Other` comme Panel sansattente puis début … fin`` — donc c'est rare ; `sinon début` est celui à retenir.

Rien d'autre ne partage une ligne avec `début` : les conditions de `si` et de `tant que` prennent le saut de ligne, elles.

## Couper une instruction longue

Une jonction qui tient confortablement sur une ligne y reste. Cette section parle des **longues** — celles qui débordent dans un volet d'éditeur étroit, dans un diff ou dans une vue de relecture, là où la queue repliée d'une ligne se lit comme une instruction à part et où il faut partir à la chasse à la jonction.

Quand une instruction doit vraiment être coupée, elle l'est **avant** le mot de jonction — `cat`, `et`, `ou`, `avec` — la ligne de continuation étant indentée d'un niveau de plus que l'instruction. La queue de l'instruction (`dans X`, `donnant Y`, `à Z`) termine la dernière ligne.

### Laisse tranquille ce qui est court

```as
mets `Vous avez ` cat Count cat ` messages.` dans Status
```

### Un `cat` par ligne, quand il faut couper

Six fragments font une longue ligne, donc chaque `cat` en commence une :

```as
mets `Utilisateur `
    cat UserName
    cat ` (id `
    cat UserId
    cat `) connecté à `
    cat Time
    dans LogLine
```

Cela place aussi l'erreur que `cat` attire — une jonction manquante, ou un `cat` en tête — au bord gauche de la page, là où un coup d'œil la trouve, plutôt qu'au milieu d'une ligne repliée.

### `et` et `ou`, la même règle

Assez court pour tenir, donc ça reste :

```as
si Name est vide ou Email est vide va à Reject
```

Assez long pour déborder, donc ça se coupe avant chaque mot de jonction, l'action restant sur la dernière condition :

```as
si BookingDate est vide
    ou BookingTime est vide
    ou GuestCount est inférieur à 1 va à RejectBooking
```

Une liste d'arguments se coupe de la même façon et à la même condition — `vasous Render avec Panel` / `et Title` / `et Rows` tient sur une ligne et y reste ; un appel à une douzaine d'arguments ne tient pas, et se coupe avant chaque `et`.

### L'indentation est pour le lecteur, pas pour le compilateur

Le compilateur joint une continuation parce que la **grammaire** continue — un `cat` après une valeur, un `et` après une liste — et l'indentation lui est indifférente : une continuation collée à la marge de gauche compile exactement comme une continuation indentée de trois niveaux. L'indentation supplémentaire n'a donc qu'un but : que l'œil voie une instruction coupée plutôt que plusieurs instructions à la suite.

Ce que la grammaire ne fera pas, c'est continuer une instruction déjà close. Un `mets … dans D` terminé sur une ligne, suivi d'une ligne commençant par `cat`, est une erreur de compilation — la surprise la plus fréquente ici, et la raison de couper *avant* le mot de jonction plutôt qu'après.

## Voir aussi

- [symboles et mise en page](symbols-and-layout.md) — étiquettes, indentation, commentaires, chaînes entre apostrophes inversées.
- [flux de contrôle](control-flow.md) — blocs `début … fin`, `si` / `sinon`, `tant que`.
- [`cat` et construction de chaînes](../idioms/01-cat-and-string-building.md) — l'idiome `cat` en entier, y compris le piège de l'analyse gourmande.
- [blocs de documentation](doc-blocks.md) — la convention de prose qui accompagne des conventions de style.
