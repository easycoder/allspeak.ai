# JSON

AllSpeak traite le JSON comme un concept de première classe plutôt que comme une corvée de manipulation de chaînes. La plupart des scripts qui doivent lire ou écrire du JSON n'appellent pas d'étape `stringify` ou `parse` explicite — les commandes environnantes le font pour eux, selon le type de la valeur. Cette page rassemble les règles pour que tu n'aies pas à les découvrir mot-clé par mot-clé.

## Écrire du JSON

Les deux chemins principaux sont `save` pour les écritures de valeur complète et `append … to json file` pour les écritures incrémentales.

### `save Var to <path>` — encode automatiquement dict et liste

Le `save` du runtime Python inspecte le type de son contenu. Si c'est un `dict` ou une `list`, la valeur est sérialisée avec `json.dumps` avant l'écriture ; si c'est une chaîne, elle est écrite telle quelle.

```
variable Rows
list Rows
! ... remplir Rows ...
save Rows to `data/2024-25/04.json`
```

La sortie JSON est **joliment imprimée par défaut** (indentation de deux espaces) pour que les fichiers sauvegardés puissent être ouverts directement pour examen humain. Cela s'applique à deux chemins :

- **Dict ou liste à encodage automatique.** Le sérialiseur utilise `indent=2`, quel que soit le chemin du fichier.
- **Contenu chaîne sauvegardé vers un chemin `.json`.** Si le contenu est déjà une chaîne JSON (par exemple le corps de requête d'un POST vers le point d'extrémité `/write/<file>` de `server.as`, qui est écrit tel quel par `save`), il est analysé et ré-émis avec `indent=2`. Si la chaîne ne s'analyse pas comme du JSON, elle est écrite telle quelle — le contenu non-JSON dans un fichier `.json` est laissé seul plutôt que de faire échouer la sauvegarde.

L'extension de fichier est une convention de documentation pour *l'encodage* — un dict ou une liste sauvegardé vers un fichier sans extension est quand même encodé en JSON ; une chaîne non-JSON sauvegardée dans `report.json` est quand même écrite telle quelle — mais pour *la mise en forme*, l'extension `.json` déclenche bien le passage de jolie impression sur le contenu chaîne.

### `append Item to json file <path>` — ajout incrémental au tableau

```
append NewRow to json file `data/2024-25/04.json`
```

Lit le tableau existant, y ajoute `Item`, réécrit le fichier. Crée le fichier (contenant un tableau à un seul élément) s'il n'existe pas. Utilise-le quand tu veux faire couler des lignes dans un fichier sans garder toute la liste en mémoire.

Le fichier doit contenir un tableau JSON — ajouter à un fichier-objet déclenche une erreur d'exécution.

### Les dossiers parents sont créés automatiquement

`save Var to data/2024-25/04.json` crée `data/` et `data/2024-25/` à la demande s'ils n'existent pas déjà. Aucune étape `create directory` n'est nécessaire au préalable — cette commande reste disponible pour les cas où tu veux créer un dossier sans y écrire quoi que ce soit. (Utilise-la avec parcimonie : le `create directory` explicite est rarement nécessaire maintenant que `save` gère son propre arbre.)

## Lire du JSON

### `load Var from <path>` — lit comme une chaîne

`load` lit le contenu du fichier tel quel et stocke le résultat comme une chaîne. Il ne fait *pas* d'analyse JSON, quelle que soit l'extension du fichier.

```
variable Text
load Text from `data/2024-25/04.json`
```

`Text` contient maintenant le contenu brut du fichier.

### `json de <chaîne>` — analyse en dict ou liste

Pour transformer la chaîne chargée en valeur utilisable, prends son `json de` :

```
variable Text
variable Rows
load Text from `data/2024-25/04.json`
mets json de Text dans Rows
```

`Rows` est maintenant un dict ou une liste (selon la forme JSON de niveau supérieur) et peut être indexé, parcouru ou compté avec les commandes usuelles de tableaux/dictionnaires.

Si l'entrée n'est pas du JSON valide, `json de` produit une valeur vide plutôt que de lever une erreur — entoure le code qui suit d'une vérification `si Rows est vide` si tu ne peux pas faire confiance à la source.

## Remise en forme du texte JSON

Deux modificateurs de valeur opèrent sur les chaînes JSON sans toucher aux dicts ni aux listes :

- `stringify Text` — ré-émet comme du JSON compact (sans espace blanc). Utile pour normaliser une charge utile écrite à la main ou joliment imprimée avant transmission.
- `prettify Text` — ré-émet avec une indentation de 4 espaces. Utile pour écrire des fichiers de configuration lisibles par un humain.

Les deux attendent que leur entrée soit déjà une chaîne JSON valide. Pour joliment imprimer directement un dict ou une liste, sauvegarde-le (ce qui l'encode en compact), recharge-le, puis applique `prettify` ; ou passe-le par `stringify` après un aller-retour sauvegarde/chargement.

## Piège JS : `mets V dans X` remplace la case

Côté JS, `définis X à tableau` initialise la case du curseur à `[]`. Un `mets Row dans X` suivant *remplace* la case — l'enveloppe de tableau est perdue, et il ne reste que `Row` dans la case. `rest poste X` envoie alors `Row`, pas `[Row]`.

```as
! FAUX
variable Bucket
définis Bucket à tableau
indexe Bucket à 0
mets Row dans Bucket            ! la case contient maintenant Row ; le [] a disparu
rest poste Bucket à URL         ! envoie Row, pas [Row]
```

Ce n'est pas un bug — `mets V dans X` écrit V dans la case du curseur exactement comme si X avait été une variable inutilisée ; le runtime ne donne aucun traitement privilégié aux tableaux dans les cases. Pour faire grandir le tableau contenu dans la case, utilise le mot-clé conscient des tableaux :

```as
! CORRECT
variable Bucket
définis Bucket à tableau
json ajoute Row à Bucket        ! la case contient maintenant [Row]
rest poste Bucket à URL         ! envoie [Row]
```

Voir [collections](04-collections.md) pour l'explication plus longue de pourquoi le modèle du curseur et `définis X à tableau` sont des couches indépendantes qui ne se composent pas avec `mets`.

## Notes trans-runtimes

Le même vocabulaire de surface fonctionne sur les deux runtimes, mais les détails côté runtime diffèrent :

- **Côté navigateur JS :** `rest obtiens`/`rest poste` gèrent le JSON automatiquement — le corps de réponse d'une réponse `application/json` est analysé avant d'être placé dans la variable cible, et une cible dict/liste est encodée en JSON comme corps de requête. La famille de mots-clés `json` dédiée (`json ajoute`, `json supprime`, `json trie` …) fournit la manipulation en place.
- **Côté Python :** il n'y a pas de famille de mots-clés `rest` à ce jour ; l'E/S HTTP côté Python passe par `get from url`, `download`, et les gestionnaires de requêtes du greffon `server`. Ces gestionnaires du greffon serveur encodent automatiquement la valeur de retour, donc `retourne Rows à Files` transporte du JSON quand `Rows` est un dict ou une liste.

Écris les scripts qui doivent fonctionner sur les deux runtimes contre le noyau `save`/`load`/`json de` et laisse l'E/S HTTP à un runtime ou à l'autre.

## Quand ne PAS utiliser de fichiers JSON

Le JSON est le format évident pour les données structurées, mais :

- Pour une configuration éditée à la main par des humains, demande-toi si un `.json` Webson (voir [Navigateur et Webson](14-browser-and-webson.md)) n'est pas mieux adapté — il peut inclure des commentaires via les clés `#doc` et prend en charge la réutilisation de composants via `$Name`.
- Pour des données tabulaires de millions de lignes, le JSON est lent à analyser et volumineux à stocker ; traite-le comme une étape plutôt que comme le format à long terme.
- Pour les messages inter-processus sur MQTT, le runtime JS encode déjà automatiquement la charge utile (voir [MQTT pub/sub](../idioms/07-mqtt-pubsub.md)) — ne double pas l'encodage en passant d'abord par `stringify`.
