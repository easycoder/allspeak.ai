# Modules

Un module est un script AllSpeak chargé et exécuté par un autre script AllSpeak. Le parent peut l'appeler comme un sous-programme, l'exécuter en parallèle comme un autre fil coopératif, ou les deux. Les modules ont leurs propres variables privées et leur propre espace de noms d'étiquettes ; la communication avec le parent se fait par passage de messages.

Pour les critères de conception et les exemples travaillés de *quand* extraire un module, voir [extraire un module](../idioms/extracting-a-module.md). Cette page couvre le mécanisme.

## La variable de module

Un module est référencé par une variable de type `module` :

```as
module DeviceController
```

La variable commence vide. `exécute` y charge un script.

## `exécute`

`exécute` charge, compile et démarre le script. La syntaxe diffère selon le dialecte.

**Python** — l'argument est un chemin ; le runtime ouvre et compile le fichier :

```as
exécute `deviceControl.as` comme DeviceController
```

**JS** — l'argument est une variable contenant le texte source. Récupère-le d'abord avec `rest obtiens` :

```as
variable ModuleSrc
rest obtiens ModuleSrc depuis `resources/as/device-control.as?v=` cat maintenant
    ou va à LoadFailed
exécute ModuleSrc comme DeviceController
```

Dans les deux dialectes, le script enfant commence à s'exécuter après `exécute`. Par défaut, le parent se bloque sur `exécute` jusqu'à ce que l'enfant atteigne `quitte` ou le libère explicitement avec `release parent`.

## `release parent`

Si le module appelle `release parent`, le `exécute` du parent revient immédiatement et le module devient un fil coopératif séparé, aux côtés du parent :

```as
! Module
sur message va à Handler
release parent          ! le `exécute` du parent revient d'ici
arrête                  ! se met en attente et attend les messages
```

Sans `release parent`, le parent reste bloqué jusqu'à la sortie du module. C'est la différence entre utiliser un module comme aide synchrone (sans libération) et comme collaborateur durable qui coexiste avec le parent (libéré). La coexistence n'implique pas que les deux soient actifs — un module libéré qui attend simplement le prochain message compte quand même. C'est à l'appelant de `envoie` de décider s'il attend une réponse ou s'il continue.

## Le passage de messages

Après la libération, le parent et l'enfant communiquent par messages. Le parent envoie :

```as
envoie InputDict à Helper
envoie InputDict à Helper et assigne réponse à OutputDict
```

Les deux formes envoient la valeur (généralement un dictionnaire). La seconde forme attend que le module appelle `envoie … à sender`, puis assigne la réponse.

Le module déclare un gestionnaire de messages une fois, près de son début :

```as
sur message va à Handler

Handler:
    mets le message dans InputDict
    ! ... fais le travail ...
    envoie ResultDict à sender
    arrête
```

Il est aussi valide d'écrire le gestionnaire comme un bloc `début … fin` immédiatement après `sur message`, mais un bloc avec son propre libellé se lit généralement plus clairement.

Dans le gestionnaire :

- **`mets le message dans X`** lit le message entrant dans X.
- **`envoie Y à sender`** renvoie une valeur au script qui a envoyé le message d'origine.
- **`arrête` (pas `retourne`)** termine le fil du gestionnaire et attend le prochain message. `retourne` ne peut servir qu'à terminer un bloc atteint via `vasous` ; l'utiliser ailleurs fera détecter par le runtime une pile corrompue et lever une exception.

La même forme fonctionne dans tous les sens — un module peut faire `envoie` à son `parent`, à `sender`, ou à un autre module qu'il a lui-même chargé ; les parents peuvent avoir leur propre gestionnaire `sur message va à …`. Les termes « parent » et « enfant » n'impliquent aucune hiérarchie — les deux ont des droits et des capacités égaux. La seule exception est le droit du module principal (de premier niveau) de fermer l'application.

## `quitte`

Lorsqu'un module a terminé, il appelle `quitte`. Cela :

- Termine le fil du module.
- Rend la main au parent si le parent était bloqué sur `exécute`.
- Libère toute la mémoire d'exécution du module pour le ramasse-miettes.

Le dernier point compte : une application peut accumuler beaucoup de fonctionnalités réparties sur de nombreux modules sans garder en mémoire ceux qui ne servent plus.

Pour un module concurrent durable qui traite des messages indéfiniment, on n'appelle généralement pas `quitte` — le gestionnaire fait `arrête` et attend pour toujours.

## État privé et espaces de noms

Dans un module, toutes les variables sont privées. Deux modules qui déclarent chacun un `Counter` ont chacun le leur. Les variables du parent sont invisibles pour le module, sauf si elles sont explicitement exportées avec `avec` et importées avec `importe` (section suivante).

Chaque module a aussi un espace de noms **d'étiquettes** indépendant. Un sous-programme utilitaire comme `ParseDate` utilisé à la fois dans le parent et l'enfant doit être dupliqué — une copie dans chaque script — ou vivre dans son propre module que le parent et l'enfant instancient et exécutent indépendamment. Le coût de la séparation est réel ; l'alternative (tout partagé) irait à l'encontre du but.

## `avec` et `importe`

Pour partager des variables à travers la frontière, le parent exporte avec `avec` au moment du `exécute`, et le module importe les noms correspondants en tête de son script :

```as
! Parent
exécute Script comme MyModule avec Specification et MainPanel
```

```as
! Module
script ModuleName
importe variable Specification et div MainPanel
```

Les noms et les types doivent correspondre des deux côtés, et les noms importés ne doivent pas entrer en conflit avec les variables déclarées par le module lui-même. Les modifications faites d'un côté sont visibles de l'autre — ce sont des références partagées, pas des copies.

## La ligne `script`

Par convention, un fichier module commence par une déclaration `script` qui le nomme :

```as
script DeviceController
```

C'est informatif — cela fixe le nom du programme pour les journaux et les diagnostics. C'est facultatif ; les scripts qui ne sont pas des modules l'omettent souvent.

## Voir aussi

- [multitâche coopératif](cooperative-multitasking.md) — `release parent` fait du module un fil coopératif.
- [extraire un module](../idioms/extracting-a-module.md) — quand et comment scinder un script (utilise la compétence `as-modularize`).
- [rest-and-async](../idioms/rest-and-async.md) — le motif récupère-puis-exécute du dialecte JS.
