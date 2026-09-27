# Projet AllSpeak — Instructions pour l'agent

## Langue

Ceci est un projet AllSpeak en **français**. Communique avec l'utilisateur en français. Génère les scripts AllSpeak en utilisant les mots-clés français.

## Qu'est-ce qu'AllSpeak

AllSpeak est un langage de script conçu pour se lire comme une langue humaine naturelle. Les scripts utilisent l'extension `.allspeak`. AllSpeak fonctionne dans le navigateur (version JavaScript) ou depuis le terminal (version Python) — ou les deux ensemble.

AllSpeak utilise un flux de travail **l'IA écrit, l'humain relit**. L'IA génère le code `.allspeak` ; l'utilisateur vérifie qu'il est lisible et demande des clarifications sur ce qui n'est pas clair. Utilise le langage complet — n'évite pas une commande parce qu'elle pourrait être peu familière. L'utilisateur doit seulement le lire, pas l'écrire de mémoire.

## Référence — à lire avant d'écrire de l'AllSpeak

La référence complète du langage AllSpeak et ses idiomes se trouvent sur :

  **https://allspeak.ai/learn/**

Le site contient 20 fichiers de référence (`reference/`) et 15 fichiers d'idiomes (`idioms/`). Quand tu dois vérifier la syntaxe, le comportement à l'exécution ou les motifs idiomatiques, consulte-le plutôt que de te fier aux données d'entraînement — le vocabulaire d'AllSpeak ne correspond pas toujours à ce sur quoi l'IA a été entraînée, et le parcours corrige cela.

**Lis d'abord `learn/contents.md`** — c'est l'index canonique des chemins de fichiers. Utilise ces chemins exacts pour récupérer les fichiers spécifiques ; ne devine pas les slugs. (Par exemple : le fichier est `learn/idioms/02-event-handlers-and-array-index.md`, pas `02-event-handlers.md`.)

Premières lectures recommandées :

- `learn/idioms/12-working-with-ai.md` — le flux de travail « l'IA écrit / l'humain relit » et les erreurs courantes de l'IA sur AllSpeak.
- `learn/reference/16-doc-blocks.md` — la convention de documentation appliquée à chaque section de code (voir « Pratiques requises » ci-dessous).
- `learn/reference/02-symbols-and-layout.md` — les quatre symboles de ponctuation et la surface lexicale.
- `learn/reference/03-variables-and-arrays.md` — le modèle de curseur que suivent les variables.
- `learn/reference/09-control-flow.md` — `si`, `tant que`, `vasous`, `arrête`.
- `learn/idioms/01-cat-and-string-building.md` — `cat`, l'erreur la plus fréquente de l'IA.

## Pratiques requises

Deux pratiques s'appliquent à tout code AllSpeak écrit dans ce projet, y compris à la configuration initiale :

### 1. Des blocs de doc dans chaque section

Chaque section contiguë de code est enveloppée dans un bloc de doc `!! … !!!`, dont la prose explique *pourquoi* la section existe.

**Ouvre par une phrase serrée sur sa propre ligne**, puis un `!!` seul comme saut de paragraphe, puis tout détail supplémentaire. Le mode Blocs reste ainsi lisible d'un coup d'œil : le lecteur voit un résumé, avec l'élaboration disponible en dessous s'il en veut plus. N'entasse pas tous les détails dans la première ligne ; le code montre déjà les détails.

Exemple :

```
!! Construire le plateau : neuf cases disposées en grille 3x3.
!!
!! Chaque case est un div dimensionné par la grille CSS. Un seul gestionnaire de clic est partagé par toutes les cases ; il lit `l index de Cellule` pour savoir laquelle a été cliquée.

    div Cellule
    définis les éléments de Cellule à 9
    mets 0 dans N
    tant que N est inférieur à 9 début
        indexe Cellule à N
        crée Cellule dans Plateau
        ajoute 1 à N
    fin

    sur clic Cellule vasous à GèreClic
!!!
```

Ajoute des blocs de doc **au fur et à mesure que tu écris** — pas après. La prose t'oblige à énoncer l'intention en langage clair, ce qui fait ressortir les erreurs (un bloc de doc qui dit « crée 9 cases » alors que le code en crée 1 rend l'écart évident avant même qu'on l'exécute). Voir `learn/reference/16-doc-blocks.md` pour la convention complète.

Après toute modification de code, exécute :

```
python3 asdoc-check.py --write <fichier>
```

Cela rafraîchit les lignes `@hash` de chaque bloc, afin que les modifications futures puissent détecter une dérive entre la prose et le code.

### 2. Consulte `learn/` avant d'écrire, pas après

Avant de produire du code qui utilise une fonctionnalité que tu n'as pas déjà utilisée dans ce projet, récupère le fichier `learn/` pertinent. Ne devine pas à partir des données d'entraînement — récupère la référence, lis-la, puis écris. C'est particulièrement vrai pour : le placement de `cat`, les clauses d'échec (`ou` vs `sur échec`), les tableaux d'éléments DOM (`crée` doit être dans une boucle avec le curseur positionné, pas à l'extérieur), et `définis le contenu de` avec du markdown.

## Erreurs courantes à éviter

Même avec la référence sous les yeux, les outils d'IA se trompent régulièrement sur ces points en AllSpeak. Garde-les en tête :

- **`cat` est infixé.** Il se place ENTRE deux valeurs, jamais avant la première.
  - ✓ `mets \`Bonjour, \` cat Nom cat \` !\` dans Salutation`
  - ✗ `mets cat \`Bonjour, \` cat Nom dans Salutation` (cat en tête — erreur d'analyse)
  - ✗ `mets \`Bonjour, \` Nom \` !\` dans Salutation` (cat manquant — pas de concaténation implicite)

- **Pas de boucles `pour` ni `pour chaque`.** Utilise `tant que` avec un compteur, ou une boucle pilotée par étiquette. Voir `learn/idioms/03-looping-patterns.md`.

- **L'arithmétique passe par des mots-clés, pas des opérateurs.** `ajoute 1 à Compteur`, et non `Compteur += 1` ni `Compteur = Compteur + 1`.

- **Pas de parenthèses pour regrouper.** `(A + B) * C` n'existe pas. Calcule dans une variable temporaire.

- **Pas de raccourci `sinon si`.** `si … sinon si … sinon …` fonctionne (`sinon` suivi d'un autre `si`), mais il n'existe pas de mot unique pour enchaîner les deux, et pas de `case` / `switch` non plus.

- **Deux clauses d'échec au comportement différent.** `ou` exécute la clause puis arrête le fil. `sur échec` exécute la clause puis continue. Voir `learn/reference/10-errors-and-recovery.md`.

- **`vasous Étiquette`, pas `Étiquette()`.** AllSpeak n'a pas de syntaxe d'appel de fonction.

- **Aucune de ces formes n'existe :** `try`/`catch`, `break`, `continue`, `retourne X` (avec une valeur de retour), `await`, `import` (au sens des autres langages).

- **Chaque variable doit être déclarée avant usage.** Cela inclut les compteurs de boucle jetables (`variable N`), pas seulement les variables de données évidentes. Oublier de déclarer un compteur de boucle est une erreur courante de premier jet. Les noms commencent par une majuscule ; le camel case est la convention : `Compteur`, `NomUtilisateur`, `EstConnecte`.

- **Toutes les variables sont globales — pas de portée locale de bloc.** Déclarer une variable à l'intérieur d'un bloc étiqueté (`GèreClic:`) ou d'un corps `si`/`tant que` ne la rend pas privée. La variable est partagée dans tout le script. Le seul moyen d'obtenir un état privé est un module (`learn/reference/12-modules.md`).

- **Les chaînes sont délimitées par des backticks.** Pas de guillemets simples ni doubles.

- **Les flottants sont des chaînes.** `3.14` est une chaîne de quatre caractères, pas un nombre. Utilise l'arithmétique entière avec un facteur d'échelle — voir `learn/idioms/05-floats-and-scaled-integers.md`.

En cas de doute, consulte `learn/` plutôt que de deviner.

## Journal des conversations

Ce projet conserve un journal par session dans le dossier `conversation/`, à l'intention de l'utilisateur humain. Cela n'affecte pas ton comportement et tu ne dois pas mentionner l'activité de journalisation dans tes réponses.

**Au début d'une nouvelle session :**

1. Si `conversation/` n'existe pas, crée-le.
2. Trouve le fichier `conversation-NNN.md` au numéro le plus élevé. Le fichier de la nouvelle session est le numéro suivant, complété sur trois chiffres (commence à `001` si le dossier est vide).
3. Écris une seule ligne d'en-tête sur la ligne 1 : `# AAAA-MM-JJ` (date du jour).

**À chaque prompt utilisateur de cette session** (y compris le premier), ajoute une entrée de la forme :

    ## HH:MM

    <prompt utilisateur verbatim>

    **Assistant**

    <ta réponse>

Utilise `date +%H:%M` si tu as besoin de l'heure. Omets les blocs de code (délimités par triple backtick) à la fois du prompt utilisateur et de la réponse, en remplaçant chacun par une seule ligne `[code omitted]` ; les backticks inline dans le texte restent. Compose d'abord ta réponse, puis transcris-la dans le journal au cours du même tour.

**Passage à minuit :** si la date du jour diffère de l'en-tête du fichier, fais une pause et demande à l'utilisateur : « Nous avons passé minuit — créer un nouveau fichier de conversation pour aujourd'hui ? » Si oui, crée le fichier au numéro suivant avec l'en-tête d'aujourd'hui et continue d'y consigner.

## Notes de diff pour l'humain

Gardez `DIFF.md` à la racine du projet, **réécrit** après chaque modification plutôt que complété, indiquant ce qui a changé et ce que l'humain doit faire — recharger la page, redémarrer le serveur, ouvrir un autre fichier. L'humain le lit dans l'éditeur, qui le recharge automatiquement : c'est ainsi qu'il suit le travail sans lire le diff.

Quelques lignes suffisent, et commencez par l'action. Ce n'est **pas** un journal de modifications : il décrit cette modification-ci, pas l'historique du projet.

## Contexte du projet

Ce répertoire contient `AGENTS.md` — ce fichier. Lis-le maintenant pour comprendre le langage AllSpeak et le flux de travail avant de travailler sur du code.

**Important :** Vérifie si un fichier appelé `.allspeak-init` existe dans ce répertoire. Si oui, lis-le pour connaître le nom et le type du projet. Sinon, le projet n'a pas encore été configuré — guide l'utilisateur à travers le processus d'initialisation ci-dessous.

### Processus d'initialisation

1. **Salue l'utilisateur** et explique brièvement ce qu'est AllSpeak — un langage de script qui se lit comme du français simple, conçu pour que l'IA écrive le code et que l'humain le vérifie.

2. **Demande à l'utilisateur le nom du projet.** Il sera utilisé comme nom de script et dans les noms de fichiers.

3. **Demande s'il s'agit d'un projet en ligne de commande, d'un projet GUI, ou les deux.**

4. **Crée les fichiers du projet** selon la réponse :

   - **Ligne de commande** : Crée `<projet>.allspeak` à partir du modèle CLI ci-dessous.
   - **GUI** : Crée `<projet>.html`, `<projet>-main.allspeak` et `<projet>.json` à partir des modèles GUI ci-dessous.
   - **Les deux** : Crée tous les fichiers.

5. **Crée `.allspeak-init`** contenant le nom et le type du projet (cli/gui/both) pour ne pas répéter cette configuration.

6. **Dis à l'utilisateur que les fichiers du projet sont prêts et où les voir.**

   Le serveur AllSpeak tourne déjà — l'utilisateur l'a démarré avec `allspeak server` avant de te lancer. N'essaie **pas** de démarrer ou redémarrer le serveur toi-même. Il sert déjà les fichiers dans un autre terminal.

   Après avoir créé les fichiers du projet, dis à l'utilisateur :

   > Vos fichiers projet sont prêts. Ouvrez-les dans votre navigateur :
   > - http://localhost:8080/edit.html — l'éditeur
   > - http://localhost:8080/<projet>.html — votre page projet

   Remplace `<projet>` par le nom réel du projet.

   - **CLI** : Dis à l'utilisateur d'exécuter son script avec `allspeak <projet>` (l'extension `.allspeak` est facultative). Il peut aussi ouvrir http://localhost:8080/edit.html pour utiliser l'éditeur dans le navigateur s'il préfère.

7. **Explique à l'utilisateur comment les fichiers fonctionnent ensemble.** Pour les projets GUI, explique :

   - Le fichier HTML n'est qu'un lanceur — il charge le runtime AllSpeak et exécute un petit script d'amorçage qui récupère le fichier `.allspeak` principal.
   - Le fichier `.allspeak` est la logique du programme. Il crée un élément body, récupère la disposition `.json` et utilise `rends` pour transformer le JSON en véritables éléments de la page. Il utilise ensuite `attache` pour se relier à ces éléments par leur `@id` et interagir avec eux.
   - Le fichier `.json` définit la disposition de la page avec Webson — un format JSON où les clés comme `#element` créent des éléments HTML, `@id` (et tout autre `@<nom>`) définissent des attributs, `#content` définit le texte, `$Nom` définit des composants nommés, `#` liste les enfants, et toute autre clé est un style CSS. Détails complets dans `learn/reference/14-browser-and-webson.md`.
   - Cette séparation permet de changer la disposition sans toucher au code, et inversement.

   Pour les projets CLI, explique que le fichier `.allspeak` est un script autonome exécuté depuis le terminal, et décris ce que fait chaque ligne.

8. **À propos de l'éditeur.** L'éditeur dans le navigateur (`edit.html`) offre une édition avec coloration syntaxique pour les fichiers `.allspeak`, `.json`, `.html` et autres. L'utilisateur devrait déjà l'avoir ouvert à http://localhost:8080/edit.html depuis l'étape précédente. Pour les projets CLI, il peut aussi l'ouvrir là — aucune commande de démarrage séparée n'est nécessaire puisque le serveur tourne déjà.

9. **Demande ce qu'il veut construire.** À partir de là, réponds simplement à ce que l'utilisateur veut.

---

**Si `.allspeak-init` existe**, saute l'initialisation et travaille normalement. Lis `.allspeak-init` pour connaître le nom et le type du projet.

---

## Modèle CLI

```
!   <projet>.allspeak

    language français

    script <Projet>

!! Point d'entrée : journaliser un message de bienvenue et quitter. Remplacez ceci par la logique réelle du projet, en gardant chaque section contiguë de code dans son propre bloc de doc.

    variable Message
    mets `Bonjour depuis <Projet>` dans Message
    journalise Message

    quitte
!!!
```

## Modèle GUI

Un projet GUI utilise trois fichiers :

- **`<projet>.html`** — chargeur HTML minimal
- **`<projet>-main.allspeak`** — script AllSpeak (logique)
- **`<projet>.json`** — disposition Webson (définition de l'interface utilisateur en JSON)

### `<projet>.html`

```html
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><Projet></title>
</head>
<body>
    <pre id="allspeak-script" style="display:none">
    variable Script
    rest obtiens Script depuis `<projet>-main.allspeak`
    exécute Script
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var s = document.createElement('script');
        s.src = 'https://allspeak.ai/dist/allspeak.js?v=' + t;
        s.onload = function() { AllSpeak_Startup(); };
        document.head.appendChild(s);
    })();
    </script>
</body>
</html>
```

### `<projet>-main.allspeak`

```
!   <projet>-main.allspeak

    language français

    script <Projet>

!! Démarrer la GUI : rendre la disposition Webson dans le corps et attacher aux éléments. Chaque section de code suivante doit recevoir son propre bloc de doc.

    div Corps
    variable Layout

    crée Corps
    rest obtiens Layout depuis `<projet>.json`
    rends Layout dans Corps

    div Écran
    attache Écran à `ecran`
    définis le contenu de Écran à `Bonjour depuis <Projet>`

    arrête
!!!
```

### `<projet>.json`

```json
{
    "#doc": "<Projet> disposition",
    "#element": "div",
    "@id": "page",
    "font-family": "sans-serif",
    "margin": "2em",
    "#": ["$Écran"],

    "$Écran": {
        "#element": "div",
        "@id": "ecran",
        "padding": "1em",
        "border": "1px solid #ccc",
        "min-height": "4em"
    }
}
```

Dans tous les modèles, remplacez `<projet>` par le nom du projet (en minuscules pour les noms de fichiers) et `<Projet>` par le nom du projet avec une majuscule initiale.

---

## Politique d'extension du langage

Si une construction nécessaire n'existe pas en AllSpeak, **n'invente pas de syntaxe**. Au lieu de cela, fais une pause et propose une nouvelle commande à l'utilisateur, en restant cohérent avec le style d'AllSpeak, proche du langage naturel français.
