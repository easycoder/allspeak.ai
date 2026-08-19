# Blocs de documentation

Un bloc de documentation est une explication en prose structurée attachée à une section de code `.as`. La convention existe pour forcer la lecture attentive : écrire le *pourquoi* sur le papier t'oblige à remarquer ce que le code fait réellement, et les relecteurs voient ce que l'auteur voulait sans avoir à le deviner à partir des noms de variables.

Les blocs de documentation sont facultatifs par fichier mais obligatoires dès qu'un fichier les adopte — un fichier sans aucun bloc est considéré comme ayant refusé la convention, sans avertissement d'un côté comme de l'autre.

## Structure

Un bloc de documentation entoure une section contiguë de code, commençant par une ou plusieurs lignes de prose `!!` et se terminant par `!!!` (trois points d'exclamation) :

```as
!! Explication brève de ce que fait cette section et pourquoi elle existe.
!! Utilise plusieurs lignes !! si nécessaire. Une ligne !! nue est un saut de paragraphe.
Section:
    ! le code
    retourne
!! @hash <managed>
!!!
```

- `!!` ouvre ou continue un bloc de documentation. Chaque ligne `!!` est un paragraphe de prose. Une ligne `!!` nue (sans texte qui suit) est un saut de paragraphe.
- `!!!` (trois points d'exclamation) termine le bloc.
- `@hash` est une ligne de métadonnée, insérée et maintenue par l'analyseur ; ne l'écris pas à la main.

Le bloc entoure le code pour que la prose et le code forment une seule unité logique.

## Écrire la prose

Commence par le **pourquoi**, la contrainte de conception ou le contexte non évident — pas un résumé du code. Le lecteur voit ce que le code fait ; la prose ajoute ce que le code ne peut pas dire :

- Pourquoi cette section existe.
- Quels invariants elle préserve.
- Ce qu'elle ne fait délibérément PAS.
- À quoi ressemblaient les tentatives précédentes.

Évite de répéter l'évidence. Évite le commentaire ligne par ligne ; c'est à ça que servent les commentaires de fin de ligne `!`, quand ils sont nécessaires.

**La première phrase sur sa propre ligne, avec un saut de paragraphe ensuite.** La phrase d'ouverture doit se suffire à elle-même comme résumé d'une ligne de ce à quoi sert la section. Suis-la d'une ligne `!!` nue (saut de paragraphe), puis de tout détail supplémentaire. Cela rend le mode Blocs lisible d'un coup d'œil — le lecteur voit une phrase serrée à côté du code, avec le développement disponible en dessous pour quand il en faut plus.

```
!! Construis la grille 4x3 : crée 12 cellules et initialise l'état de couleur de chacune.
!!
!! Attache au Board, puis boucle 12 fois — `indexe Cell à N` suivi de `crée Cell dans Board` construit la N-ième cellule. Le tableau parallèle ColourIndex démarre chaque cellule à 0 (gris).
```

Pas ainsi :

```
!! Construis la grille 4x3 et initialise l'état de chaque cellule. Attache au Board, crée 12 divs Cell simples comme enfants — chacune reçoit un fond gris, une fine bordure noire et un aspect-ratio de 1 pour rester carrée — et initialise le tableau parallèle ColourIndex à 0 pour chaque cellule pour que tout démarre dans l'état gris. Enfin, enregistre un gestionnaire de clic partagé …
```

La forme mur-de-texte pousse le détail déjà visible dans le code (la couleur, la bordure, l'initialisation du tableau) et écrase le *pourquoi*. La forme en deux lignes donne au lecteur un résumé utilisable sans lire plus loin.

**Un paragraphe = une ligne.** Chaque paragraphe de prose est une ligne `!!` unique, quelle que soit sa longueur. N'insère pas de sauts de ligne durs pour le retour à la ligne visuel — ils s'affichent mal en mode Blocs (qui fait le retour à la ligne automatiquement) et se battent contre toi à l'édition. Utilise une ligne `!!` nue pour séparer les paragraphes.

Ne commence pas une ligne de prose par `@hash` ou `@verified` ; ce sont des jetons de métadonnée réservés. Cite-les (« `@verified` ») si tu dois mentionner ces noms.

## Le mécanisme `@hash`

Chaque bloc de documentation inclut un hash du code enveloppé sous la forme `@hash <managed>`. L'analyseur le maintient. Après toute modification du code à l'intérieur d'un bloc, rafraîchis les hashes :

```
python3 tools/asdoc-check.py --write <file>
```

Un hash périmé signifie que le code a changé sans que la prose ait été relue — l'analyseur le signale comme un avertissement. L'auteur relit la prose, décide si elle décrit toujours le code avec exactitude, puis édite la prose ou marque le bloc comme vérifié.

## Le mécanisme `@verified`

`@verified` est une déclaration plus forte que `@hash` seul — un signal délibéré qu'un humain a lu le code et la prose ensemble et a approuvé l'association. Le hash vérifié est ensuite verrouillé. Les modifications ultérieures du code cassent la vérification (`verified-stale`), exigeant un nouveau passage humain.

Le mode Blocs d'Asedit fournit un bouton « Marquer vérifié » en un clic pour cela.

## Refus : fichiers sans bloc de documentation

Un fichier sans aucun bloc de documentation est traité comme ayant refusé la convention — ni erreurs, ni avertissements. Cela permet d'adopter la convention fichier par fichier au fil de la reprise du code existant, sans imposer un jour de bascule à tout le codebase.

Une fois qu'un fichier contient un bloc, l'analyseur attend que tout le fichier soit couvert : les sections non enveloppées suivantes remontent comme avertissements.

## Les validateurs

Deux outils valident la même convention :

- `tools/asdoc-check.py` — CLI Python ; récursif sur un répertoire. Lance-le avec `--write` pour rafraîchir les hashes.
- `tools/asdoc-check-cli.as` — tourne sous le runtime Python AllSpeak, exerçant la même logique depuis AllSpeak lui-même.

Le mode Blocs d'Asedit effectue aussi une validation dans l'éditeur pendant que tu tapes.

## Relire tout en documentant

Ajouter des blocs de documentation au code existant doit être un passage de relecture, pas seulement un passage de documentation. En lisant chaque section assez attentivement pour écrire sa prose, fais aussi remonter tout ce qui semble bizarre :

- **Symboles inaccessibles** — sous-routines ou étiquettes sans appelant ; variables déclarées mais jamais assignées, ou assignées mais jamais lues.
- **Code mort** — branches qui ne peuvent jamais être prises ; lignes après un `arrête`/`quitte`/`retourne` inconditionnel vers lesquelles rien ne saute.
- **Motifs suspects** — logique dupliquée, valeurs codées en dur qui devraient probablement être des variables, couplage caché entre sections.
- **Désaccord doc/code** — commentaires, noms ou documentation voisine qui contredisent ce que le code fait réellement.

Présente les constats comme une courte liste au début de la réponse, séparée des modifications de blocs. Ne les corrige pas en silence — laisse l'auteur décider.

Le but de la convention est de forcer la lecture attentive ; rapporter ce que cette lecture a trouvé est la contrepartie naturelle.

## Voir aussi

- [symboles et mise en page](symbols-and-layout.md) — `!!` et `!!!` comme marqueurs lexicaux.
- [structure](structure.md) — les blocs de documentation sont retirés avant que les compilateurs de domaines voient quoi que ce soit.
