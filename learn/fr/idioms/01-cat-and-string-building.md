# cat et construction de chaînes

## Problème

Tu as besoin de construire une chaîne à partir de plusieurs morceaux — un préfixe constant, une valeur de variable, un séparateur littéral. Le mot-clé `cat` d'AllSpeak assemble deux valeurs ; l'endroit où on le place est l'erreur la plus courante quand on commence, et l'erreur la plus courante que font les outils d'IA en écrivant de l'AllSpeak.

## Le schéma

`cat` est **infixe**. Il se place *entre* deux valeurs, jamais avant la première et jamais après la dernière.

```as
mets `Bonjour, ` cat Name cat `!` dans Greeting
```

Lis ça comme : `` `Bonjour, ` `` puis `Name` puis `` `!` ``, avec `cat` qui sépare chaque paire. Pas de `cat` en tête ; pas de `cat` en queue.

N'importe quel nombre de morceaux peut s'enchaîner — chaque paire adjacente reliée par un `cat`.

## Anti-motif : `cat` en tête

```as
mets cat `Bonjour, ` cat Name dans Greeting   ! FAUX
```

Le `cat` en tête fait chercher au compilateur une valeur avant lui ; il n'en trouve aucune et signale une erreur d'analyse. Enlève-le.

## Anti-motif : `cat` manquant

```as
mets `Bonjour, ` Name `!` dans Greeting   ! FAUX
```

Des valeurs adjacentes sans `cat` entre elles ne sont pas jointes implicitement. AllSpeak n'a pas de règle d'adjacence de chaînes façon C. Chaque assemblage doit être explicite.

## Les valeurs que `cat` peut assembler

`cat` assemble n'importe quelle paire de valeurs, pas seulement des chaînes. Des nombres, des horodatages, des propriétés, des résultats de `le contenu de …` — tout ce qui produit une valeur :

```as
définis Count à 7
mets `Vous avez ` cat Count cat ` messages.` dans Status
mets `Journalisé à ` cat l horodatage
    cat ` — champ Nom : ` cat le contenu de Name dans Log
```

Les nombres sont convertis en leur forme textuelle sur-le-champ. `Status` vaut maintenant `` `Vous avez 7 messages.` ``.

## Piège : l'analyse gloutonne des valeurs

AllSpeak n'a ni précédence des opérateurs ni syntaxe de regroupement d'expressions (pas de parenthèses). Quand une construction comme `gauche N de X` lit sa valeur pour X, l'analyseur consomme autant qu'il peut — y compris toute chaîne `cat … cat …` en fin de ligne.

Cela reflète l'anglais parlé, qui n'a pas non plus de précédence des opérateurs. *« Je vois Anne et Bob dans le parc »* ne dit pas si tous deux sont dans le parc ou seulement Bob ; la même ambiguïté est exploitée régulièrement pour des effets comiques et rhétoriques. AllSpeak hérite de ce trait ; le coût, c'est qu'il faut être délibéré sur l'endroit où chaque valeur se termine.

Donc :

```as
mets gauche 4 de `Hello!` cat nouvelleligne dans Result
```

ne signifie **pas** ``(gauche 4 de `Hello!`) cat nouvelleligne``. L'analyseur lit `` `Hello!` ` cat nouvelleligne` `` comme une valeur combinée, puis lui applique `gauche 4 de`. `Result` se retrouve avec `Hell`, sans saut de ligne — le saut de ligne était déjà dans la valeur que `gauche 4 de` a ensuite tronquée.

Pour forcer l'ordre voulu, affecte d'abord à une temporaire :

```as
mets gauche 4 de `Hello!` dans Result
mets Result cat nouvelleligne dans Result
```

Ce schéma de variable temporaire est l'idiome AllSpeak pour forcer l'ordre d'évaluation dans toute expression impliquant des opérateurs qui consomment des valeurs.

## Insérer un saut de ligne, une tabulation et une apostrophe inversée

Les chaînes entre apostrophes inversées n'ont pas de syntaxe d'échappement. Pour inclure un saut de ligne, une tabulation ou une apostrophe inversée littérale, utilise les mots-clés de valeur `nouvelleligne`, `tabulation` et `backtick` avec `cat` :

```as
mets `Ligne 1` cat nouvelleligne cat `Ligne 2` dans Output
```

`Output` contient maintenant deux lignes séparées par un vrai caractère de saut de ligne. Il n'y a pas de notation `\n` entre apostrophes inversées ; ce schéma `cat`-avec-mot-clé est canonique.

Pour insérer une apostrophe inversée littérale — facile à oublier parce que les noms des mots-clés *sont* l'échappement :

```as
mets `Appuyez sur ` cat backtick cat `Entrée` cat backtick cat ` pour continuer.` dans Prompt
```

`nouvelleligne`, `tabulation` et `backtick` font partie d'un ensemble plus large de mots-clés de valeur nue — qui comprend aussi `vide`, `maintenant`/`horodatage`, `aujourdhui`, `saut`, `uuid`. Voir [values-and-types](../reference/values-and-types.md#special-value-keywords) pour la liste complète.

## Littéraux multi-lignes entre apostrophes inversées

Pour les chaînes constantes longues, un littéral multi-lignes entre apostrophes inversées peut remplacer plusieurs fragments reliés par `cat` :

```as
définis Css à `position:relative;
    `width:90%;
    `margin:1em auto 0;
    `border:1px solid black;`
```

Les lignes de continuation commencent par une apostrophe inversée après l'espace de tête ; les lignes sont jointes sans sauts de ligne. Voir [symbols-and-layout](../reference/symbols-and-layout.md) pour la règle lexicale.

Utilise-le quand tu as une seule valeur littérale longue. Quand tu dois entrelacer constantes et variables, reste avec `cat`.

## Construction façon gabarit

Des fragments constants entre apostrophes inversées, des insertions de variables reliées par `cat`, en une seule expression :

```as
mets `Utilisateur ` cat UserName cat ` (id ` cat UserId cat `) s'est connecté à ` cat Time dans LogLine
```

Pour les longs gabarits, coupe les lignes aux frontières de `cat` :

```as
mets `Utilisateur ` cat UserName
    cat ` (id ` cat UserId
    cat `) s'est connecté à ` cat Time
    dans LogLine
```

Le `cat` en début de ligne de continuation est un jeton normal — AllSpeak ne se soucie pas des sauts de ligne dans une instruction, seulement des espaces entre les jetons.

## À voir aussi

- [symbols-and-layout](../reference/symbols-and-layout.md) — la syntaxe des apostrophes inversées et la règle multi-lignes.
- [strings-and-text](../reference/strings-and-text.md) — les opérations sur les chaînes (`remplace`, longueur de, position de).
- [variables-and-arrays](../reference/variables-and-arrays.md) — ce qui est interpolé.
