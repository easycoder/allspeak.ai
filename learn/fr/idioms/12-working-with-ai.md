# Travailler avec l'IA

## Problème

Les outils d'IA sont utiles pour écrire de l'AllSpeak — brouillons rapides, suggestions d'idiomes, traduction. Mais ils se trompent régulièrement sur les détails : le vocabulaire d'AllSpeak ne correspond pas toujours aux données d'entraînement de l'IA, qui produit donc avec assurance une syntaxe d'apparence plausible mais qui ne compile pas (ou pire, qui compile vers la mauvaise chose). L'objectif de cet idiome est de rendre utilisables les forces de l'IA sans tomber dans ses modes d'échec.

## La boucle de base

L'IA rédige, l'humain relit. On itère.

1. **Briefer l'IA** sur la tâche. Pointe-la vers les fichiers de référence et d'idiomes pertinents — elle s'appuiera dessus plutôt que sur ses données d'entraînement.
2. **L'IA produit un brouillon.** Traite-le comme un premier passage, pas comme une réponse finale.
3. **Lis-le attentivement.** Cherche les erreurs courantes listées plus bas.
4. **Exécute-le.** La compilation attrape beaucoup d'erreurs ; les bugs de comportement ont besoin d'un `imprime` ou d'un `journalise` (voir [debugging-as](debugging-as.md)).
5. **Itère.** Soit corrige directement ce qui ne va pas, soit donne à l'IA le symptôme et laisse-la refaire un brouillon.

La boucle n'est pas « l'IA fait tout, l'humain tamponne ». C'est **l'IA tape, l'humain fait l'ingénierie.**

## Ce qu'exige la « lisibilité »

Pour que l'étape de relecture fonctionne, la sortie de l'IA doit être assez lisible pour qu'un relecteur repère ce qui ne va pas sans refaire l'analyse depuis zéro. Ça veut dire :

- **Des blocs de documentation.** Chaque section enveloppée dans du texte `!! …` qui explique ce qu'elle fait et pourquoi. Le fait d'écrire la documentation force l'IA à énoncer son intention, ce qui fait remonter les écarts entre ce que dit le texte et ce que fait le code. Voir [doc-blocks](../reference/doc-blocks.md).
- **Des variables nommées.** Pas de `X` ni de `Y` — `Counter`, `ButtonClicked`, `IsLoggedIn`. Le relecteur n'a pas besoin de garder les types en tête.
- **Des commentaires en ligne là où le *pourquoi* n'est pas évident.** Un commentaire `!` qui signale un caprice. Ne reformule pas le code ; signale la surprise.
- **Un concept par section.** Les sous-routines longues à usages mélangés ne sont pas relisables. Si une section a besoin de deux paragraphes de prose en bloc de documentation, c'est deux sections.

## Erreurs courantes de l'IA sur AllSpeak

Ce que les outils d'IA ratent régulièrement :

- **La place de `cat`.** L'IA met `cat` avant la première valeur ou l'omet entre les valeurs. Le `cat` d'AllSpeak est uniquement infixe — voir [cat-and-string-building](cat-and-string-building.md).
- **Les opérateurs impératifs.** `Counter += 1` ou `Counter = Counter + 1`. AllSpeak utilise `ajoute 1 à Counter`.
- **Les boucles `for`.** AllSpeak n'a ni `for` ni `for each` ; l'itération se fait avec `tant que` ou par étiquettes. Voir [looping-patterns](looping-patterns.md).
- **L'indexation de tableau façon JSON (`mets dans article N`).** AllSpeak utilise un modèle à curseur : `indexe X à N` sélectionne l'emplacement, puis `mets V dans X` écrit dedans. `mets V dans article N de X` n'est pas une cible de `mets` valide. `article N de X` lit dans un tableau JSON tenu dans l'emplacement courant — un mécanisme complètement séparé. L'IA confond souvent les deux, écrivant `mets V dans article N de Colors` (faux) au lieu de `indexe Colors à N ; mets V dans Colors` (juste). Voir [variables-and-arrays](../reference/03-variables-and-arrays.md).
- **L'arithmétique des flottants.** `multiplie 3.14 par 2`. `3.14` est une chaîne, pas un nombre. Voir [floats-and-scaled-integers](floats-and-scaled-integers.md).
- **Les parenthèses pour grouper.** `(A + B) * C`. Pas de syntaxe de groupement ; utilise une variable temporaire.
- **`elif` et `case`/`switch`.** AllSpeak n'a ni l'un ni l'autre. `si … sinon si … sinon …` est parfaitement valable (c'est juste `sinon` suivi d'un autre `si`), mais le raccourci `elif` n'existe pas, et il n'y a pas d'instruction `case` / `switch` — utilise une chaîne de `si`/`sinon si` ou une répartition par étiquettes.
- **La confusion entre `ou` et `on failure`.** Des comportements post-clause différents — `ou` arrête, `on failure` continue. Voir [errors-and-recovery](../reference/errors-and-recovery.md).
- **Les tableaux `#` de Webson avec objets en ligne.** Le tableau `#` de Webson attend des références de chaînes `$Name`, pas des objets JSON bruts. `"#": [{ "#element": "div", ... }]` échouera à l'exécution avec `build: [object Object] has no properties`. Définis des entrées `$Block` nommées et référence-les dans `#` : `"#": ["$Block"]` avec `"$Block": { "#element": "div", ... }` défini juste à côté. Voir [browser-and-webson](../reference/14-browser-and-webson.md).
- **Une pré-initialisation `définis les propriétés` inventée.** Les propriétés sur les éléments d'un tableau s'auto-initialisent à la première écriture — il n'existe aucune commande de pré-initialisation. `définis les propriétés de Cell à tableau pour \`color\`` n'est pas de l'AllSpeak valide. La bonne approche est `définis propriété \`color\` de Cell à 0` dans la boucle de création ; le dictionnaire JSON par élément est créé automatiquement. Voir [browser-and-webson](../reference/14-browser-and-webson.md).
- **`get` utilisé comme mot-clé d'assignation.** `get property \`name\` of X into V` n'est pas de l'AllSpeak valide. AllSpeak n'a pas de mot-clé `get` pour l'assignation — le modèle de lecture universel est `mets <source> dans <cible>`, propriétés comprises : `mets propriété \`name\` de X dans V`. C'est un hybride courant chez l'IA entre `get` (venu de JavaScript/Python) et `mets … dans …` (venu d'AllSpeak). Voir [browser-and-webson](../reference/14-browser-and-webson.md).
- **Des mots-clés inventés.** `return X`, `break`, `continue`, `try`/`catch`, `await`, `get X into Y`. Aucun n'existe dans AllSpeak.

Les erreurs de placement de `cat`, de `for`/`for each`, d'indexation de tableau façon JSON, de tableaux `#` avec objets en ligne et de pré-initialisation de propriétés inventée sont les plus courantes ; les autres sont sporadiques.

## Fais-lui expliquer avant de lui faire réécrire

Quand la sortie de l'IA est fausse, la tentation est de dire « c'est faux, recommence ». C'est relancer les dés. Un meilleur premier geste :

> « Explique-moi ce que fait ce code, ligne par ligne. »

L'explication de l'IA correspond à la réalité (auquel cas tu peux pointer précisément ce avec quoi tu n'es pas d'accord) ou pas (auquel cas elle vient de te dire ce qu'elle attendait réellement du code). Dans les deux cas, tu as plus d'informations qu'avec un simple nouvel essai à l'aveugle.

Une fois que tu sais ce que l'IA essayait de faire, tu peux soit le corriger toi-même, soit lui donner une instruction précise :

> « Remplace la boucle `for each` par une boucle `tant que` avec un compteur ; AllSpeak n'a pas de `for each`. »

## Le passage des blocs de documentation comme point de relecture

Quand l'IA écrit une section, demande-lui d'ajouter un bloc de documentation en même temps. La prose la force à énoncer son intention en langage simple, là où les contradictions avec le code sautent aux yeux. Le mécanisme `@hash` verrouille ensuite le couple — si une modification future change le code sans retoucher la prose, l'analyseur le signale. Voir [doc-blocks](../reference/doc-blocks.md).

## Anti-schéma : faire confiance à l'IA sur les détails de syntaxe

Le vocabulaire d'AllSpeak ne correspond pas entièrement à ce sur quoi l'IA a été entraînée. Même quand l'IA semble confiante, les mots-clés précis, le placement de `cat`, la gestion des clauses d'échec sont des détails à vérifier contre la référence. Le programme pédagogique existe en partie pour qu'on puisse y pointer l'IA au lieu de la laisser deviner.

## Anti-schéma : d'abord le spec, ensuite le code, enfin le bloc de documentation

Il est tentant d'écrire un spec détaillé, de le donner à l'IA, de la laisser produire le code, puis d'ajouter un bloc de documentation qui décrit le code. Cet ordre rate le sens des blocs de documentation. La prose est censée capturer l'intention *au moment où le code est écrit*, pour que les désaccords entre intention et résultat remontent. Si le bloc de documentation est écrit à partir du code obtenu, il ne fait que reformuler ce que l'IA a produit — perdant sa valeur de contrôle.

Le bon ordre : l'humain et l'IA se mettent d'accord sur l'intention (à l'oral ou dans un brief), l'IA écrit le code et le bloc de documentation ensemble, l'humain relit les deux pour vérifier leur accord.

## À voir aussi

- [doc-blocks](../reference/doc-blocks.md) — la convention de relire tout en documentant.
- [debugging-as](debugging-as.md) — `imprime` / `journalise` pour vérifier le comportement.
- [writing-language-neutral](writing-language-neutral.md) — l'IA comme premier traducteur.
- [cat-and-string-building](cat-and-string-building.md) — l'erreur d'IA la plus courante.
