# Enregistrements

Un **enregistrement** est ce qu'a fait une exécution : quelles parties du programme ont été atteintes, dans quel ordre, et à quelle fréquence — avec les instants où elles l'ont été. Il est écrit sous forme de fichier JSON à côté du script, et peut être relu ensuite — dans le visualiseur, ou par n'importe quel autre outil — sans rien réexécuter.

C'est tout l'intérêt. Une trace d'appel te dit qu'un programme a échoué ; un journal est quelque chose que tu as choisi d'écrire ; un profileur est une agrégation sur de nombreuses exécutions. Un enregistrement, c'est une exécution, conservée.

Deux mots en ouvrent et en ferment un :

```as
    viz start [on <label>] [once|every] [until thread] [limit <n>]
    viz stop  [on <label>]
```

## Les deux marqueurs

| Marqueur | Ce qu'il fait |
|---|---|
| `viz start` | Arme un enregistreur si le script n'en a pas, et ouvre une fenêtre. |
| `viz stop` | Ferme la fenêtre et l'écrit dans le fichier de trace. |

`@viz start` et `@viz stop` sont les orthographes en attribut et signifient exactement la même chose que les instructions. Les deux sont acceptées, et c'est délibéré : un script instrumenté qui fonctionne déjà ne doit pas cesser de fonctionner pour avoir une façon de plus de dire la même chose. C'est la paire d'attributs sur laquelle agit le visualiseur ; les attributs en général sont décrits dans `22-attributes` de la référence anglaise, qui n'est pas encore traduite.

Les options, chacune étant un raffinement plutôt qu'une chose à apprendre d'abord :

- **`once`** (la valeur par défaut) — une fenêtre à la fois. Une paire start/stop à l'intérieur d'un sous-programme ouvrirait et fermerait sinon sa propre fenêtre à chaque appel, ce que l'auteur ne veut que rarement ; `once` laisse la première fenêtre tenir.
- **`every`** — la dernière fenêtre l'emporte : un second start ferme celui qui précède. C'est celle des boucles.
- **`until thread`** — la fenêtre se ferme quand le fil qui l'a ouverte se termine, au lieu d'attendre un stop qu'il faut penser à écrire. C'est ce qui permet à plusieurs points d'arrêt de fonctionner sans instrumenter chacun d'eux.
- **`limit <n>`** — le nombre maximal de visites que cette fenêtre collectera, 100 000 par défaut. Le plafond arrête la *collecte* ; le programme continue.
- **`on <label>`** — le marqueur est placé sur une étiquette plutôt que sur sa propre ligne. L'étiquette est nommée comme `gosub` nomme la sienne, si bien qu'une référence en avant fonctionne, et un nom qui ne résout rien est à signaler par l'analyse, pas par le compilateur.

Un `viz start` sans `viz stop` n'est pas une erreur. C'est le cas « observe jusqu'à la fin », et un hôte qui termine l'exécution ferme sa fenêtre pour lui.

**Un marqueur ne change rien à une exécution.** `viz start` se compile en une commande que le runtime franchit sans l'exécuter, et la syntaxe vit dans le noyau plutôt que dans le greffon — un script instrumenté reste donc un script ordinaire, `viz start` se compile que le visualiseur soit chargé ou non, et un marqueur laissé par accident est inoffensif. Sans enregistreur attaché, un marqueur n'ouvre aucune fenêtre : rien n'est collecté et aucun fichier n'est écrit.

## Les valeurs à observer

`@show` nomme les valeurs que tu veux voir à côté du flux :

```as
    while Total is less than Limit @show Total, Row
    begin
        add Row to Total @show Total
    end
```

Les valeurs voyagent sur la **visite** dans laquelle elles tombent — une visite étant le séjour d'une ancre, de son arrivée à la suivante — si bien qu'un `@show` sur un `while` s'attache à l'arrivée à laquelle il appartient, et qu'un `@show` plus bas dans le bloc s'attache à la visite en cours, qui le couvre. Un second `@show` dans une même portée réécrit les mêmes noms au lieu d'ajouter une seconde lecture : une valeur par nom et par visite est ce qu'un lecteur peut saisir sans que le panneau devienne un journal.

Elles voyagent dans l'enregistrement, sur le champ `values` de l'enregistrement d'ancre. Ce que le visualiseur en fait est encore en cours de construction.

Deux détails valent la peine d'être connus. Un nom que le programme ne porte pas est capturé comme `?` plutôt que de disparaître — une faute de frappe se montre donc dans l'enregistrement au lieu d'escamoter silencieusement la valeur. Et un `@show` à l'intérieur d'un bloc est lu au moment où l'instruction est atteinte, *avant* qu'elle s'exécute : il rapporte donc ce que le test a vu, et non ce que l'instruction a laissé derrière elle.

## Demander un enregistrement

Il y a plusieurs façons de le demander, et la bonne dépend de qui demande.

### Depuis le visualiseur

Le bouton **Record** de l'éditeur enregistre le script présent dans le tampon ouvert. Un script qui nomme une application est un cas particulier — voir *Nommer la page de l'application* ci-dessous — et c'est cette page qui est ouverte : elle est armée de l'extérieur et l'enregistrement est écrit à la fermeture de la fenêtre.

### Le fichier drapeau, pour un service en cours d'exécution

Un processus lancé sur une machine joignable seulement par SSH ne peut pas être redémarré pour être observé, mais un fichier peut être posé à côté de son script. C'est donc un fichier qui fait office de demande :

```
touch thermostat.allspeak.record      demande un enregistrement
rm    thermostat.allspeak.record      retire la demande
```

Le drapeau est lu **aux marqueurs et nulle part ailleurs** — rien ne sonde et rien ne tourne sur une minuterie, si bien qu'un script sans marqueurs n'est jamais interrogé, et qu'un script dont les marqueurs sont dans sa boucle de contrôle est interrogé une fois par cycle, à la granularité que son auteur a choisie. Poser le drapeau après l'avoir retiré commence un enregistrement à partir de rien, de sorte que le fichier précédent tient jusqu'à ce que celui-ci soit écrit et qu'un court épisode ne puisse pas détruire un bon enregistrement ; le retirer après l'avoir posé termine l'enregistrement et l'écrit.

C'est le mécanisme propre au runtime Python, et c'est le seul endroit où un enregistrement est demandé à la main plutôt que par un outil — voir *Les runtimes diffèrent* ci-dessous pour la raison pour laquelle le navigateur ne peut pas faire de même.

### Depuis un autre script

```as
    record the script in Path as Source giving Trace reporting Verdict
```

Exécute un script choisi par l'appelant sous un enregistreur, et rend deux choses : l'enregistrement sous forme de texte dans `Trace`, et le verdict en une ligne dans `Verdict`. `in <path>` est facultatif et nomme le script ; `as <source>` est ce que passe un appelant qui détient le texte lui-même, de sorte qu'un éditeur avec un tampon non enregistré n'a pas besoin d'écrire un fichier pour le relire. Les deux runtimes l'ont.

Côté JavaScript, il y en a deux de plus, pour un script qui s'enregistre lui-même ou une application déjà en cours d'exécution :

```as
    record this run
    save the recording to Path
```

`record this run` arme un enregistreur pour le programme qui l'appelle — ce dont a besoin un bouton *à l'intérieur* d'une application, puisque rien d'extérieur à un programme vivant ne peut lui attacher un enregistreur. `save the recording to` nomme le fichier de trace et écrit ce qui a déjà été arrêté ; il **crée** aussi le fichier, vide, ce qui fait qu'une seconde exécution remplace la première au lieu de s'y ajouter.

### Depuis la ligne de commande

```
allspeak --record=parser.viz.json parser H2O
```

Exécute le script exactement comme `allspeak parser H2O` le ferait, et écrit ce qu'il a fait dans le fichier nommé. Rien n'est armé sans ce drapeau, si bien qu'un simple `allspeak parser` se comporte comme toujours.

## Où il va

À côté du script et nommé d'après lui, extension comprise — `thermostat.allspeak` s'enregistre dans `thermostat.allspeak.viz.json`. L'éditeur cherche ce nom, de sorte qu'un enregistrement rapporté par `scp` s'affiche en ouvrant le script et en appuyant sur **Graph**.

Le fichier est un document JSON décrit par `spec/viz-trace-format.md`. L'écrivain actuel produit la **version 2**, qui a ajouté les enregistrements de transfert disant d'où venait le contrôle quand il ne tombait pas simplement à la ligne suivante. Un document peut être complété au fil d'un enregistrement : `viz start`/`viz stop` délimitent un *segment*, l'index de fenêtre de chaque segment continue à partir du précédent, et un fichier contient donc autant de segments bout à bout qu'il y en a eu, dans l'ordre où ils se sont produits.

## Le verdict

Un enregistrement rapporte ce qu'il vaut, en une ligne, et cette ligne est la même phrase où qu'on la lise :

> `12 visites dans 1 fenêtre`

Deux des lectures comptent plus que les autres, parce que toutes deux ressemblent de l'extérieur à une exécution réussie — l'une est un script qui n'a jamais ouvert de fenêtre, l'autre un script que le garde-fou a dû arrêter :

> `rien enregistré : l'exécution s'est terminée sans atteindre un marqueur`

> `arrêté : <raison>`

et lorsque l'exécution était en attente sur une minuterie plutôt que terminée, la ligne de visites gagne une proposition : `, et l'exécution attend là — l'enregistrement s'arrête à sa première attente`.

La première est ce que produit un script sans fenêtre ouverte, d'où le fait que les marqueurs ci-dessus soient la seule chose à connaître ici.

## Nommer la page de l'application

```as
    @app color-memory.html
```

Sur une ligne à elle, cette note dit dans quelle page le script s'exécute. C'est ce qu'ouvre **Launch**, et c'est ce qui décide comment **Record** traite le script : un script qui nomme une application est piloté par sa propre page — ses marqueurs sont atteints par une *personne* qui clique, non par le démarrage du script — l'éditeur ouvre donc cette page, l'arme de l'extérieur et enregistre l'exécution à la fermeture de la fenêtre. Un script qui ne nomme aucune application est exécuté directement à la place.

## Le garde-fou

Un enregistreur surveille le travail propre du programme et termine l'exécution si celle-ci s'emballe :

- **2 secondes de travail** — le temps qu'ont pris les commandes *propres* du programme, attentes exclues : `wait`, `every`, `release`, `input`, `download`, `alert`, et tout ce qui récupère une `url`. Un écart de plus de 20 ms est de l'attente, pas du travail.
- **20 secondes d'horloge murale** — parce que le budget seul ne borne que ce que le programme *fait*, et qu'une boucle qui attend entre ses itérations ne le dépense jamais. Les deux sont distingués dans le rapport, car l'un est du code lent et l'autre est en général du code faux.

**L'enregistreur du drapeau ne porte aucun garde-fou, et ce n'est pas un oubli.** Son but est d'observer un script qui fait probablement quelque chose d'utile — un contrôleur, un service — et un garde-fou y *arrêterait la chose observée*. Il est borné à la place par un plafond sur ce qu'il peut collecter : 50 000 visites, après quoi il écrit ce qu'il a et le dit sur la sortie d'erreur, là où la personne qui a tapé le `touch` le trouvera.

## Les runtimes diffèrent

`record the script …` est dans les deux runtimes. Le reste n'y est pas, et ce partage vaut la peine d'être connu avant d'écrire un script qui doit fonctionner dans les deux :

| | JavaScript (navigateur) | Python (terminal) |
|---|---|---|
| `viz start` / `viz stop` | oui | oui |
| `record the script … giving …` | oui | oui |
| `@viz start` arme son propre script | oui | non |
| `record this run`, `save the recording to <path>` | oui | non |
| le fichier drapeau (`thermostat.allspeak.record`) | non | oui |
| `allspeak --record=<path>` | sans objet | oui |

La boucle de contrôle du runtime Python est un fichier qu'un processus peut remarquer ; celle du navigateur est une application dont l'enregistreur doit être attaché de l'extérieur avant que son premier marqueur ne s'exécute. Chaque runtime a la forme qui lui convient, et ni l'un ni l'autre n'a encore celle de l'autre.

## Le script, sans l'exécuter

Un enregistrement a besoin d'une exécution. L'autre question — *de quoi ce script est-il fait ?* — n'en a pas besoin :

```as
    model the script in Path as Source giving Model
```

Cela rapporte les **ancres** du script : les endroits où le flux de contrôle n'est pas simplement la ligne suivante — étiquettes, tests de `while`, et les points où l'on entre dans un gestionnaire d'événements — avec juste assez du graphe de flux pour dire si chaque ancre peut être atteinte. Rien n'est exécuté et rien n'est dessiné ; c'est ce qui dit à la vue Blocks du visualiseur quelles sections personne n'aborde, et quelles lignes une fenêtre `viz` pourrait couvrir.

## Voir aussi

- [Commandes de l'environnement de développement](dev-environment.md) — `browse`, `system` et `download`, les mots-clés du runtime Python qu'utilise un script de lancement.
- [Déboguer .allspeak](debugging-as.md) — les instruments plus légers : `log`, `print` et le traceur.
- [Multilingue](multilingual.md) — `@` n'est pas un mot, et le vocabulaire des marqueurs n'est pas traduit non plus : `viz`, `start`, `stop` et les options s'écrivent de la même façon dans toutes les langues.
- [Travailler avec l'IA](working-with-ai.md) — où un enregistrement s'insère dans le cycle « l'IA écrit, l'humain relit ».
- `spec/viz-trace-format.md` dans le dépôt — le format de fichier, champ par champ.
