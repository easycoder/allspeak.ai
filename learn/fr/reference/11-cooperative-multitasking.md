# Multitâche coopératif

AllSpeak exécute plusieurs fils de manière coopérative. Le script principal, chaque gestionnaire d'événement et chaque fil bifurqué sont des fils d'exécution distincts qui partagent le même état global. Ils s'exécutent à tour de rôle ; le runtime n'interrompt jamais un fil en plein milieu d'une instruction.

C'est fondamentalement différent des fils de système d'exploitation. Il n'y a ni parallélisme, ni condition de course dans une instruction isolée, ni besoin de verrous. Le coût : un travail de longue durée doit explicitement céder la main, sinon les autres fils ne peuvent pas s'exécuter.

## Comment naissent les fils

Un fil peut naître de trois façons :

1. **Le fil principal.** Le code de premier niveau du script est le fil principal. Il s'exécute jusqu'à ce qu'il atteigne `arrête`.
2. **Un gestionnaire d'événement.** `sur clic X vasous à Handler` enregistre Handler. Lorsque l'événement se déclenche, le runtime démarre un nouveau fil à Handler.
3. **Un fil bifurqué.** `bifurque à Label` crée un nouveau fil à Label et le démarre immédiatement. Le fil qui lance se met en attente et met sa prochaine instruction en file pour reprendre plus tard.

Tous les fils s'exécutent dans le même processus, partagent toutes les variables globales et cèdent la main uniquement aux points décrits ci-dessous.

## Quand les fils cèdent la main

Le runtime n'interrompt jamais un fil en plein milieu d'une instruction. Des instructions comme `définis X à Y`, `ajoute A à B`, `imprime Z` s'exécutent jusqu'au bout avant qu'un autre fil ait son tour. Un fil cède la main uniquement à ces points :

- **`attends N <unité>`** — dort pendant au moins la durée donnée, puis reprend. Le fil est en attente ; les autres fils s'exécutent pendant qu'il dort.
- **`arrête`** — termine définitivement le fil.
- **Fin d'un fil de gestionnaire d'événement** — le fil se termine lorsque `retourne` sort du cadre de distribution, après un `arrête`, ou après le `fin` final d'un bloc de gestionnaire en ligne (voir [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md)).
- **Entrées-sorties bloquantes** — `rest obtiens`, `mqtt publish`, `attends message` et autres, qui rendent la main à la boucle d'événements du runtime pendant qu'ils attendent.

En dehors de ces points, un fil détient le runtime. Une boucle `tant que vrai début ... fin` sans `attends` à l'intérieur affamera tous les autres fils — bloquant les actions de l'utilisateur et risquant la surchauffe du processeur. Le runtime dispose d'une protection de base qui sort de toute boucle exécutant trop d'instructions sans céder la main, mais il ne faut pas compter dessus : insère un `attends` délibérément.

## `bifurque`

`bifurque à Label` (ou `bifurque Label` — le `à` est facultatif) démarre un nouveau fil à Label :

```as
Main:
    bifurque à Animator
    bifurque à NetworkPoller
    sur clic StartButton vasous à StartGame
    arrête

Animator:
    tant que vrai début
        ! ... avance d'une image ...
        attends 16 millis
    fin

NetworkPoller:
    tant que vrai début
        rest obtiens Status depuis `/health`
        attends 1 seconde
    fin
```

Lorsque `bifurque` s'exécute, le nouveau fil démarre immédiatement et le fil qui lance se met en attente, mettant en file sa prochaine instruction. Le contrôle revient au lanceur lorsque le fil bifurqué cède la main (via `attends`, des entrées-sorties bloquantes ou `arrête`). Chaque fil bifurqué s'exécute ensuite indépendamment ; ils partagent les variables globales avec le fil principal et entre eux. La coordination entre fils passe par l'état partagé — définis une variable dans l'un, lis-la dans l'autre.

## `attends`

Le moyen de céder la main au quotidien. Les unités sont `millis` / `milli`, `ticks` / `tick` (10 ms), `secondes` / `seconde` (la valeur par défaut) et `minutes` / `minute` :

```as
attends 5 millis           ! 5 millisecondes
attends 100 ticks          ! 100 × 10 ms = 1 s
attends 2 secondes         ! l'unité par défaut, peut être omise
attends 2                  ! 2 secondes (par défaut)
attends 5 minutes
```

Dans une boucle d'animation, le corps fait le travail d'une image puis `attends` quelques millisecondes avant l'image suivante. Dans une boucle de sondage, `attends` est l'intervalle entre deux sondages. Dans toute boucle de longue durée, un `attends` est le minimum pour partager le runtime — sans lui, aucun autre fil ne peut s'exécuter et l'interface se fige.

## Coordonner les fils

Il n'y a ni sémaphores, ni mutex, ni canaux — le modèle coopératif supprime l'essentiel du besoin. La coordination se fait par variables partagées et sondage :

```as
! Le fil producteur pose un drapeau ; le consommateur le remarque.
variable Ready

Producer:
    ! ... prépare des données ...
    définis Ready
    arrête

Consumer:
    tant que pas Ready attends 10 millis
    ! ... consomme les données ...
    efface Ready
    arrête
```

Comme aucun fil ne peut être interrompu en plein milieu d'une instruction, `définis Ready` est atomique. Le `tant que pas Ready attends 10 millis` du consommateur est un sondage à gros grains — parfait quand la latence de réveil n'a pas d'importance.

Pour une coordination plus riche, les modules et le passage de messages conviennent généralement mieux que de simples drapeaux — voir [modules](modules.md).

## Modules et fils

Un module chargé avec `exécute X` s'exécute comme enfant du parent. Par défaut, le parent se bloque pendant que le module s'exécute. Le module peut appeler `release parent` pour laisser le parent continuer en parallèle — à ce moment-là, le module devient un autre fil coopératif. Le parent et l'enfant peuvent alors communiquer avec `message …` et le gestionnaire `sur message`.

C'est la structure canonique pour les gros morceaux de travail asynchrone. Voir [modules](modules.md) pour le mécanisme et la compétence `as-modularize` pour des exemples travaillés.

## Pourquoi le coopératif

Le modèle troque le parallélisme contre la simplicité. Les bénéfices :

- Pas de conditions de course sur une instruction isolée ; on peut raisonner directement sur l'état.
- Pas de verrous, pas d'opérations atomiques, pas de surprises d'ordonnancement mémoire.
- Les fils se composent : un gestionnaire d'événement est un fil, un `bifurque` est un fil, un module libéré est un fil — toujours la même chose.

Le coût :

- Un travail gourmand en CPU dans un fil bloque tout le reste.
- L'auteur doit insérer des `attends` dans les longues boucles pour partager le runtime.
- Le vrai parallélisme pour la performance n'est pas au menu — pour cela, utilise une extension qui enveloppe un worker natif, ou délègue à un processus séparé.

## Voir aussi

- [flux de contrôle](control-flow.md) — `arrête`, `vasous`, `va à` — les mécanismes de contrôle par fil.
- [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md) — les gestionnaires d'événements en tant que fils.
- [modules](modules.md) — `release parent`, le passage de messages, des unités de concurrence plus grandes.
