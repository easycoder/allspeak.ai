# Erreurs et reprise

Certaines commandes d'AllSpeak peuvent échouer au moment de l'exécution — `rest obtiens` peut ne pas atteindre son endpoint, `charge` peut ne pas trouver son fichier, `exécute` peut ne pas trouver son module. Ces commandes acceptent une clause d'échec facultative qui s'exécute si l'opération échoue.

Si une commande peut échouer et que tu n'attaches pas de clause, le fil se termine sur une erreur d'exécution.

Deux clauses d'échec existent — `ou` et `sur échec` — avec la même syntaxe externe mais un comportement différent après la clause. Le choix exprime ce qui doit se passer ensuite.

## `ou` — exécute puis arrête

`ou <instruction>` après une commande susceptible d'échouer exécute l'instruction en cas d'échec, puis arrête le fil :

```as
rest obtiens Strings depuis `/strings.json` ou va à StringsFailed
```

Si l'appel réussit, l'exécution se poursuit avec l'instruction suivante. S'il échoue, le corps du `ou` s'exécute puis le fil se termine. Le corps peut être une instruction unique ou un bloc `début … fin` :

```as
rest obtiens Config depuis `/config.json`
    ou début
        imprime `Impossible de charger la configuration`
        vasous à Cleanup
    fin
```

Utilise `ou` pour les échecs irrécupérables — le script ne peut pas continuer utilement, la clause fait donc le ménage et s'arrête.

## `sur échec` — exécute puis continue

`sur échec <instruction>` après une commande susceptible d'échouer exécute l'instruction en cas d'échec, puis reprend l'exécution à l'instruction suivante :

```as
charge Content depuis Filename
sur échec définis Content à vide
imprime Content
```

Si le chargement réussit, `imprime` affiche le contenu chargé. S'il échoue, `sur échec` définit une valeur par défaut et `imprime` affiche la chaîne vide. Dans les deux cas, l'exécution se poursuit.

Utilise `sur échec` lorsque l'échec est censé être récupérable — le script substitue une valeur par défaut raisonnable et continue.

## Côte à côte

La même instruction de reprise se comporte différemment selon la clause :

```as
! forme `ou`
charge Content depuis Filename ou définis Content à vide
imprime Content                                ! ne s'exécute PAS en cas d'échec

! forme `sur échec`
charge Content depuis Filename
sur échec définis Content à vide
imprime Content                                ! s'exécute en cas d'échec
```

Choisis la forme qui correspond à ce que tu veux qu'il se passe ensuite — `ou` pour « signaler et abandonner », `sur échec` pour « substituer et continuer ».

## Lire l'erreur

Dans l'une ou l'autre clause, `le erreur` est une valeur contenant la chaîne d'erreur du runtime (la forme longue `le erreur message` existe aussi, mais `l'erreur` avec apostrophe n'est pas encore reconnue par le découpeur) :

```as
rest obtiens Config depuis `/config.json` ou début
    imprime `Échec du chargement : ` cat le erreur
    vasous à Cleanup
fin
```

## Quelles commandes peuvent échouer

Les commandes susceptibles d'échouer sont des opérations de type entrées-sorties ; les formes anglaises de la liste (`read`, `write`, `save`, `rest put`, `rest delete`, `mqtt publish`, `mqtt subscribe`) n'ont pas encore de traduction française :

- `rest obtiens`, `rest poste`, `rest put`, `rest delete`
- `read` (fichiers)
- `write` (fichiers)
- `charge` (fichiers / URLs)
- `save` (fichiers)
- `exécute` (chargement d'un module)
- `mqtt publish`, `mqtt subscribe`

Les domaines et les extensions peuvent ajouter leurs propres opérations susceptibles d'échouer — consulte le pack de langue concerné. Les opérations pures du noyau (`définis`, `ajoute`, `multiplie`, `si`, `tant que`) n'ont pas de mode d'échec à l'exécution ; elles sont soit valides (elles réussissent), soit invalides (erreur de compilation).

## Anti-motif : ignorer un échec

```as
rest obtiens X depuis URL    ! pas de clause — le fil se termine en cas d'échec
```

Si la commande peut échouer et que tu n'as rien prévu, le fil se termine. Pour les prototypes, c'est parfois acceptable. Pour du code de production, attache une clause et décide ce qui est voulu.

## Anti-motif : une reprise silencieuse

```as
charge Config depuis `/config.json` sur échec définis Config à `{}`    ! continue en silence
```

Substituer une valeur par défaut sans journaliser masquera de vrais échecs (panne réseau, erreur serveur) derrière un code qui semble fonctionner. Si une valeur par défaut est acceptable, journalise au moins une fois la substitution pour que le problème ne reste pas invisible.

## Voir aussi

- [flux de contrôle](control-flow.md) — `arrête`, `va à`, les destinations qu'utilise typiquement une clause `ou`.
- [structure](structure.md) — quel domaine possède quelle commande susceptible d'échouer.
- [rest-and-async](../idioms/rest-and-async.md) — les motifs classiques pour REST.
