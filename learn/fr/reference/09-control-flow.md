# Flux de contrôle

Le flux de contrôle d'AllSpeak est construit à partir d'un petit ensemble de constructions qui se composent librement : des instructions séquentielles regroupées avec `début … fin`, l'exécution conditionnelle `si … sinon`, la boucle `tant que`, des étiquettes avec `va à` et `vasous`, et l'arrêt au niveau du fil avec `arrête` et `quitte`. AllSpeak reflète le langage naturel ; les constructions sont délibérément simples, et tu es libre de te déplacer dans le code à ta convenance.

Il n'y a pas de flux façon opérateur (ni retour anticipé par expression, ni exceptions). La gestion des échecs pour des commandes précises est couverte dans [erreurs et reprise](errors-and-recovery.md) ; le lancement de fils dans [multitâche coopératif](cooperative-multitasking.md).

## Séquences et blocs

Les instructions d'une section étiquetée s'exécutent de haut en bas :

```as
Main:
    définis Counter à 0
    ajoute 1 à Counter
    imprime Counter
    arrête
```

Pour regrouper une séquence en une seule instruction composée, enveloppe-la avec `début … fin`. Partout où une instruction unique est attendue, un bloc `début … fin` peut la remplacer.

```as
tant que N est inférieur à 5 début
    ajoute 1 à N
    imprime N
fin
```

Un bloc `début … fin` est une seule instruction pour l'analyseur ; le corps à l'intérieur est séquentiel. Voir [symboles et mise en page](symbols-and-layout.md) pour le style alternatif où `début` se trouve sur sa propre ligne avec une indentation assortie.

## `si` / `sinon`

Exécution conditionnelle. Formes à instruction unique et en bloc :

```as
si Counter est 0 imprime `Counter est zéro`

si Counter est 0 début
    imprime `Counter est zéro`
    définis Reset
fin
```

En utilisant `sinon`, chaque branche peut être à instruction unique ou en bloc :

```as
si Counter est 0
    imprime `zéro`
sinon début
    imprime `non zéro, valeur :`
    imprime Counter
fin
```

Les conditions sont pilotées par des mots-clés (`est`, `est inférieur à`, `est supérieur à`, `est pas`, `contient`, etc.) — voir [conditions](conditions.md). Une construction qui n'est pas directement disponible peut généralement être inversée : « est supérieur ou égal à » peut s'écrire `est pas inférieur à`.

Un test de vérité nu lit l'état courant de la variable :

```as
si Clicked définis le contenu de Button à `Terminé`
```

`Clicked` est ici traité comme un booléen. `définis Clicked` le met à vrai ; `efface Clicked` le met à faux. Pour un test explicite, `si Clicked est vrai …` et `si Clicked est faux …` sont aussi acceptés. Bien que toute valeur non vide soit généralement traitée comme vraie, il est plus sûr que la variable ait été explicitement mise à un booléen avec `définis` ou `efface`.

## `tant que`

Boucle. Même répartition instruction unique/bloc que `si` :

```as
définis N à 0
tant que N est inférieur à 5 début
    imprime N
    ajoute 1 à N
fin
```

Boucle infinie, interrompue par une sortie interne :

```as
tant que vrai début
    ! ... traiter un message ...
    si Done arrête
fin
```

Terminaison : soit laisser la condition devenir fausse, soit en sortir via `va à Label`, `arrête`, `retourne` ou `quitte`. Il n'y a pas de `break` ou `continue` dédiés — choisis la construction qui correspond à ce que tu veux faire ensuite. Sortir d'une boucle avec `va à` n'a aucune implication de pile ; AllSpeak traite les étiquettes comme des destinations libres.

## Étiquettes et `va à`

Tout mot en marge de gauche se terminant par `:` est une étiquette. Les étiquettes sont les cibles de `va à`, `vasous` et de l'enregistrement des gestionnaires d'événements :

```as
Start:
    définis Counter à 0
    va à Loop

Loop:
    ajoute 1 à Counter
    si Counter est inférieur à 10 va à Loop
    imprime Counter
    arrête
```

`va à` transfère le contrôle de façon inconditionnelle et n'empile pas d'adresse de retour. La destination s'exécute jusqu'à ce qu'elle atteigne son propre `arrête`, `quitte` ou un autre `va à` — ce qui se passe ensuite devient le nouveau flux.

### Étiquette calculée (`va à label <expr>`)

Quand une chaîne de `si … sinon` s'allonge, tu peux calculer le nom de l'étiquette au moment de l'exécution :

```as
variable Outcome
vasous à ComputeOutcome      ! met Outcome à p. ex. `Edit`, `Save`, `Delete`
va à label Outcome          ! saute vers l'étiquette désignée par la chaîne
```

L'expression après `label` peut être n'importe quelle expression de valeur — une variable, un littéral de chaîne ou une chaîne de `cat` :

```as
vasous à label `Option` cat N     ! saute vers Option1, Option2, …
va à label `SharedHandler`       ! chaîne constante
```

L'étiquette est résolue au moment de l'exécution — si aucune étiquette correspondante n'existe, une erreur d'exécution est signalée. Il n'y a pas de validation à la compilation, donc mal orthographier un nom d'étiquette inexistant est sans danger (l'erreur se produira à l'exécution, où tu peux l'attraper avec une clause `on failure` sur `vasous`).

## `vasous` et `retourne`

Un appel de sous-routine : empiler l'adresse de retour, sauter à l'étiquette, s'exécuter jusqu'à `retourne`, dépiler l'adresse de retour.

```as
Main:
    vasous Setup
    vasous Render
    arrête

Setup:
    définis Counter à 0
    retourne

Render:
    imprime Counter
    retourne
```

Les deux formes `vasous Label` et `vasous à Label` sont acceptées ; les exemples du codex utilisent `vasous à`. Choisis-en une et reste cohérent.

### Vasous calculé (`vasous à label <expr>`)

La même syntaxe d'étiquette calculée fonctionne avec `vasous` et `bifurque` :

```as
vasous à label `Handler` cat Event      ! appel de sous-routine calculé
bifurque à label `Task` cat N           ! bifurcation parallèle calculée
```

`bifurque à label <expr>` se comporte à l'identique : il évalue l'expression, résout l'étiquette et lance un fil parallèle là-bas. Comme pour `va à label`, l'étiquette est résolue à l'exécution et signale une erreur si elle est absente.

### Passer des paramètres avec `vasous … avec`

Utilise `vasous … avec` pour passer des valeurs et `mets paramètre` pour les lire par position :

```as
variable Key
variable BodyText
variable Y
variable M
variable D
variable Year
variable Month
variable Day

Main:
    vasous JsonAddString avec `slug`
    vasous FormatDate avec Year et Month et Day
    arrête

JsonAddString:
    mets paramètre 0 dans Key
    mets `{"` cat Key cat `":` dans BodyText
    ...
    retourne

FormatDate:
    mets paramètre 0 dans Y
    mets paramètre 1 dans M
    mets paramètre 2 dans D
    ...
    retourne
```

`vasous Label avec Expr1 et Expr2 …` accepte tout ce que `getValue()` sait analyser — variables, littéraux, chaînes de `cat`, `compte de`, etc. Les arguments commencent à zéro ; `mets paramètre 0 dans Var` lit la première valeur passée.

`paramètre` est une **expression de valeur**, tu peux donc lire un argument partout où une valeur est attendue :

```as
JsonAddString:
    mets paramètre 0 dans Key
    journalise paramètre 1                             ! journalise le deuxième argument
    si paramètre 0 est `slug`
        vasous Warn
    fin
    vasous Forward avec paramètre 0                    ! transmet l'argument
    retourne
```

L'index est un seul jeton numérique, donc une chaîne de `cat` qui suit n'est pas avalée : `mets paramètre 1 cat `-` cat paramètre 2 dans DateStr` lit l'argument 1, puis l'argument 2, puis concatène.

La forme courte `param` est acceptée partout où `paramètre` l'est — `param 0 dans Key` (une commande dédiée) et `mets param 0 dans Key` marchent tous les deux — de même que la forme complète traduite dans chaque pack de langue (`paramètre` en français, `parametro` en italien, `Parameter` en allemand).

Si une sous-routine est appelée sans `avec`, `paramètre` renvoie `0` (numérique) — les sous-routines existantes ne sont pas affectées.

### Gestion des échecs

Un appel `vasous … avec` peut avoir une clause `ou` / `on failure` :

```as
vasous FetchData avec Url ou vasous OnError
```

### La pile des arguments d'appel

Les paramètres vivent sur une pile implicite créée quand `avec` est utilisé et supprimée quand la sous-routine fait `retourne`. Les appels imbriqués fonctionnent correctement :

```as
vasous Outer avec A
  ...
  vasous Inner avec X et Y   ! nouveau cadre empilé
  mets paramètre 0 dans Z     ! lit X (le cadre d'Inner)
  ...
  retourne                    ! le cadre d'Inner est dépilé
  mets paramètre 0 dans W     ! lit A (le cadre d'Outer)
  ...
  retourne                    ! le cadre d'Outer est dépilé
```

La pile est propre à chaque fil (selon le modèle de multitâche coopératif). Pour tout ce qui dépasse quelques petites fonctions, envisage un [module](modules.md), qui fournit des variables privées, le passage de messages et la concurrence.

## `stack`, `push` et `pop`

Pour réutiliser une variable de travail au travers d'un appel de sous-routine sans perdre sa valeur, empile-la d'abord et dépile-la ensuite. Les commandes `stack`, `push` et `pop` n'ont pas encore de forme française — elles s'écrivent en anglais, même dans un script français :

```as
stack MyStack
...
définis X à 99
push X onto MyStack
définis X à 0            ! réutilise X pour autre chose
pop X from MyStack
imprime X                ! imprime 99
```

Utilise ça quand une sous-routine a besoin des mêmes noms de travail (`I`, `N`, `Temp`) que son appelant et que tu veux éviter le bug rare mais réel où l'un écrase l'autre.

## `arrête` et `quitte`

Deux façons de mettre fin à quelque chose :

- **`arrête`** gare le fil courant. Le fil principal se termine toujours par `arrête` (sinon il court au-delà de sa section étiquetée). Les gestionnaires d'événements et les fils bifurqués utilisent `arrête` pour se terminer eux-mêmes plus tôt.
- **`quitte`** met fin au script entier. Dans un module, `quitte` rend le contrôle au parent ; dans le script principal, il arrête le runtime. Quand un module se termine, toute sa mémoire d'exécution est libérée pour le ramasse-miettes — c'est ce qui permet à une application d'accumuler beaucoup de fonctionnalités sans que tout reste en mémoire à la fois.

`arrête` est propre à chaque fil ; `quitte` est propre au script.

## Quand utiliser quoi

- Une action conditionnelle unique → `si`.
- Une action répétée → `tant que`.
- Un bloc réutilisable appelé depuis plusieurs endroits → `vasous` vers une étiquette.
- Une répartition multi-branches qui demanderait une chaîne de `si … sinon` → **`va à label`** (goto calculé). Voir [la section étiquette calculée](#computed-label-go-to-label-expr).
- Un morceau de logique assez gros pour avoir besoin d'un état privé → un module ([modules](modules.md)).
- Un flux à allure asynchrone sur un événement d'interface → un enregistrement `sur …` qui appelle un gestionnaire en `vasous` ([gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md)).

## Voir aussi

- [symboles et mise en page](symbols-and-layout.md) — étiquettes, règles d'indentation et style `début`/`fin`.
- [conditions](conditions.md) — ce qui suit `si` et `tant que` ; combiner des conditions.
- [erreurs et reprise](errors-and-recovery.md) — `ou` et `on failure` pour la gestion des échecs au niveau commande.
- [multitâche coopératif](cooperative-multitasking.md) — `bifurque`, rendu de la main, `attends`.
- [modules](modules.md) — état privé et passage de messages pour les gros morceaux.
