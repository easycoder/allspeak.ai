# Cursus AllSpeak

> **Traduction en cours** — ce cursus est une première traduction, pas encore relue par un locuteur natif. Si tu repères une erreur, signale-la sur [les issues GitHub](https://github.com/easycoder/allspeak.ai/issues).

Un guide pratique pour écrire un AllSpeak idiomatique. Deux niveaux :

- **Référence** répond à *qu'est-ce que cette chose dans AllSpeak ?* — symboles, variables, flux de contrôle, modules. Stable, encyclopédique.
- **Idiomes** répond à *comment faire X à la manière d'AllSpeak ?* — des motifs avec des exemples travaillés et des anti-motifs explicites.

Voir [README.md](../README.md) pour savoir comment consulter ce cursus et comment ajouter ou modifier une page.

## Référence

1. [Structure](reference/01-structure.md) — les domaines, le modèle « le compilateur essaie chaque domaine », comment les extensions enrichissent le vocabulaire.
2. [Symboles et mise en page](reference/02-symbols-and-layout.md) — les quatre symboles de ponctuation ; les marqueurs de blocs de documentation ; l'indentation et les noms.
3. [Variables et tableaux](reference/03-variables-and-arrays.md) — le modèle du curseur ; les variables de travail ; `variable` vs typé.
4. [Collections](reference/04-collections.md) — tableaux, dictionnaires, listes, propriétés ; divergence JS/Python.
5. [Valeurs et types](reference/05-values-and-types.md) — nombres, chaînes, booléens ; conversion automatique.
6. [Conditions](reference/06-conditions.md) — égalité, comparaison, présence ; combinaison avec `et` / `ou`.
7. [Arithmétique](reference/07-arithmetic.md) — modèle entier d'abord ; motif des entiers mis à l'échelle ; trigonométrie.
8. [Chaînes et texte](reference/08-strings-and-text.md) — `longueur de`, découpage, `position de`, `remplace`.
9. [Flux de contrôle](reference/09-control-flow.md) — `si`, `tant que`, `vasous` avec paramètres, `mets paramètre`, `stack`, `arrête`, `quitte`.
10. [Erreurs et reprise](reference/10-errors-and-recovery.md) — `ou` (arrêt) vs `on failure` (continuer).
11. [Multitâche coopératif](reference/11-cooperative-multitasking.md) — `bifurque`, `attends`, jamais interrompu en milieu d'instruction.
12. [Modules](reference/12-modules.md) — `exécute`, `release parent`, passage de messages.
13. [Extensions](reference/13-plugins.md) — le contrat ; le principe de performance de la pile mixte.
14. [Navigateur et Webson](reference/14-browser-and-webson.md) — types DOM, `attache`, le dialecte de mise en page Webson.
15. [Multilingue](reference/15-multilingual.md) — la directive `language` et le modèle des packs.
16. [Blocs de documentation](reference/16-doc-blocks.md) — la convention `!!` / `!!!` ; `asdoc-check`.
17. [Commandes de l'environnement de développement](reference/17-dev-environment.md) — `system`, `download`, `browse` du runtime Python pour le shell, l'extraction et l'ouverture d'onglets.
18. [JSON](reference/18-json.md) — `save` encode automatiquement les dict/listes ; `accole … au fichier json` ; `json de` pour l'analyse ; la réserve du dossier parent.
19. [Test](reference/19-testing.md) — assertions `check`, cas `test … fin test`, clauses d'échec, le mode d'exécution `--test` et les codes de sortie.

## Idiomes

1. [`cat` et construction de chaînes](idioms/01-cat-and-string-building.md) — `cat` infixe, motifs de gabarits, piège de l'analyse gloutonne.
2. [Gestionnaires d'événements et index de tableau](idioms/02-event-handlers-and-array-index.md) — un seul gestionnaire pour un tableau d'éléments.
3. [Motifs de boucles](idioms/03-looping-patterns.md) — `tant que` vs boucles pilotées par étiquettes.
4. [Choisir la forme d'une collection](idioms/04-picking-a-collection-shape.md) — variable-tableau vs dict vs liste vs propriété.
5. [Flottants et entiers mis à l'échelle](idioms/05-floats-and-scaled-integers.md) — précision fractionnaire sans flottants.
6. [REST et asynchrone](idioms/06-rest-and-async.md) — `rest obtiens`, clauses d'échec, rendu de la main pendant l'attente.
7. [MQTT pub/sub](idioms/07-mqtt-pubsub.md) — le bloc de connexion, les charges utiles en forme de dict, requête/réponse.
8. [Séparation Webson et AS](idioms/08-webson-and-as-separation.md) — la mise en page dans `.json`, la logique dans `.as`.
9. [Extraire un module](idioms/09-extracting-a-module.md) — quand et comment scinder un script.
10. [Écrire en langage neutre](idioms/10-writing-language-neutral.md) — ce que le pack de langue ne traduit pas.
11. [Déboguer .as](idioms/11-debugging-as.md) — `imprime`, `journalise`, traceur, `factice`.
12. [Travailler avec l'IA](idioms/12-working-with-ai.md) — le flux de travail « l'IA écrit, l'humain relit ».
13. [Le serveur comme application](idioms/13-server-as-application.md) — exécuter `server.as -t edit,<projet>` pour que le serveur *soit* l'application et que les onglets du navigateur soient son interface.
