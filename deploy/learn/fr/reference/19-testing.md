# Test

Le vocabulaire de test d'AllSpeak est volontairement petit : `check` vérifie un fait, `test … fin test` regroupe des assertions liées dans un cas nommé, et le mode d'exécution `--test` transforme un script en suite de tests avec un résumé et un code de sortie exploitable. Le vocabulaire fonctionne dans les deux implémentations (JS et Python) et dans n'importe quelle langue dès que le pack de langue traduit les mots-clés.

## `check` — une assertion

`check que <condition>` évalue une condition et rapporte le résultat. La grammaire des conditions est exactement celle de `if` — égalité, comparaison, présence et combinaisons `et` / `ou` fonctionnent toutes sans changement :

```as
variable Compteur
variable Premier
variable Second
mets 4 dans Compteur
mets 1 dans Premier
mets 2 dans Second

check que Compteur est 4
check que Compteur est numérique
check que Premier est 1 et Second est 2
```

Le mot `que` est une liaison naturelle et peut être omis :

```as
check Compteur est 4
```

- **Réussite** — enregistrée silencieusement ; rien n'est imprimé.
- **Échec** — enregistré, et une ligne de rapport est émise par le canal de journalisation normal :

  ```
  FAIL: Compteur est 5 (planning.as:12)
  ```

  La partie entre parenthèses est le nom du script (comme défini par `script <nom>`, sinon le nom du fichier) et le numéro de ligne de la vérification. Après la journalisation, l'exécution **continue** — une vérification en échec est un rapport, pas un crash.

Les vérifications hors de tout bloc `test` appartiennent à un cas par défaut implicite ; elles comptent dans le total mais ne sont pas listées comme un test nommé.

## `test … fin test` — un cas nommé

`test <nom> … fin test` regroupe des instructions dans un cas nommé. Le nom est une valeur (généralement un littéral) :

```as
variable Compteur
mets 1 dans Compteur

test `Ajout d'une salle`
    check que Compteur est 1
fin test
```

- Le corps peut contenir n'importe quelles instructions — préparation, vérifications, `vasous`, blocs `début … fin`.
- Les blocs `test` sont une paire d'instructions comme `début … fin` ; ils ne peuvent pas être imbriqués.
- Hors du mode `--test`, ils sont un regroupement transparent : les vérifications qui s'y trouvent se comportent exactement comme des vérifications libres (un échec journalise `FAIL` et continue).

## Clauses d'échec — `ou` et `sur échec`

`check` accepte les mêmes clauses d'échec que les commandes susceptibles d'échouer, avec leur sémantique documentée :

```as
variable X
mets 3 dans X

check que X est 3 sur échec vasous FixUp      ! enregistre l'échec, exécute FixUp, continue
check que X est 3 ou vasous Cleanup           ! enregistre l'échec, exécute Cleanup, termine ce test
```

- `sur échec <action>` — la vérification échoue, l'action s'exécute, et l'exécution reprend à l'instruction suivante.
- `ou <action>` — la vérification échoue, l'action s'exécute, et le bloc `test` courant se termine immédiatement (marqué comme échoué). Hors de tout bloc `test`, `ou` termine le script, comme un `stop` nu.

Dans l'action, `le erreur` contient le message d'échec.

## `--test` — le mode d'exécution

La CLI Python exécute un script (ou tout un répertoire) comme une suite de tests :

```
allspeak --test planning.as
allspeak --test conformance/tests/
```

Un répertoire exécute chaque fichier `.as` comme sa propre suite, puis imprime une ligne agrégée. En mode test, le résumé est imprimé à `quitte` (ou à la fin du script) :

```
Test suite: schedule.as
  ✓ Adding a room (2 checks)
  ✗ Advance roll-over (FAIL: the room count is 4 — line 12)
  ✓ Boost expiry (3 checks)

3 tests, 2 passed, 1 failed — 7 checks, 6 passed, 1 failed
```

La ligne de chaque cas montre le nom et le résultat ; pour un cas en échec, la première condition en échec et sa ligne, et pour un cas en erreur, le message d'erreur :

```
  ✗ Advance roll-over (error: Arithmetic error in divide: integer division or modulo by zero)
```

### Isolation des erreurs

En mode `--test`, une erreur d'exécution non traitée à l'intérieur d'un bloc `test` n'interrompt pas l'exécution. Le cas est marqué **en erreur** et l'exécuteur saute au bloc suivant, de sorte qu'un cas cassé ne cache pas les autres :

```as
variable X
mets 5 dans X

test `Cas en erreur`
    divise 10 par 0 donnant X    ! erreur d'exécution — le cas est marqué en erreur
    check que X est 1            ! sauté
fin test
test `Continue quand même`       ! ce bloc s'exécute toujours
    check que X est 5
fin test
```

Les instructions qui déclenchent une erreur d'exécution diffèrent légèrement entre les deux runtimes : le runtime Python lève sur une division par zéro, le runtime JS sur une arithmétique non numérique (par exemple `ajoute 1 à` une valeur texte). Dans les deux cas, le cas est marqué en erreur et l'exécuteur continue.

Une erreur hors de tout bloc `test` termine toujours le script (l'exécution elle-même est cassée).

### Codes de sortie

| Code | Signification |
|------|---------------|
| 0 | chaque vérification a réussi, aucun test en erreur |
| 1 | au moins une vérification a échoué ou un test est en erreur |
| 2 | le script n'a pas pu être compilé ou exécuté |

### Le runtime JS

Le runtime JS s'exécute dans le navigateur et n'a pas de CLI. Le vocabulaire et le résumé sont identiques ; l'hôte active le mode test en définissant le drapeau du runtime avant de démarrer :

```js
AllSpeak.testMode = true;
AllSpeak.start(scriptSource);
```

Avec le drapeau défini, les blocs `test` isolent les erreurs et un résumé est écrit dans la console de débogage à `quitte`, reflétant la sortie du mode Python.

## Sujets liés

- [Conditions](06-conditions.md) — chaque condition que `check` accepte.
- [Erreurs et reprise](10-errors-and-recovery.md) — la sémantique `ou` vs `sur échec`, partagée avec les commandes susceptibles d'échouer.
