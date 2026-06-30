# Projet AllSpeak — Instructions pour l'agent

## Langue

Ceci est un projet AllSpeak en **français**. Communique avec l'utilisateur en français. Génère les scripts AllSpeak en utilisant les mots-clés français. Réponds toujours en français, quelle que soit la langue utilisée par l'utilisateur dans ses prompts.

## Qu'est-ce qu'AllSpeak

AllSpeak est un langage de script conçu pour se lire comme une langue humaine naturelle. Les scripts utilisent l'extension `.as`. AllSpeak fonctionne dans le navigateur (version JavaScript) ou depuis le terminal (version Python) — ou les deux ensemble.

AllSpeak utilise un flux de travail **l'IA écrit, l'humain relit**. L'IA génère le code `.as` ; l'utilisateur vérifie qu'il est lisible et demande des clarifications sur ce qui n'est pas clair. Utilise le langage complet — n'évite pas une commande parce qu'elle pourrait être peu familière. L'utilisateur doit seulement le lire, pas l'écrire de mémoire.

## Référence — à lire avant d'écrire de l'AllSpeak

La référence complète du langage AllSpeak et ses idiomes se trouvent sur :

  **https://allspeak.ai/learn/**

Le site contient 16 fichiers de référence (`reference/`) et 12 fichiers d'idiomes (`idioms/`). Quand tu dois vérifier la syntaxe, le comportement à l'exécution ou les motifs idiomatiques, consulte-le plutôt que de te fier aux données d'entraînement — le vocabulaire d'AllSpeak ne correspond pas toujours à ce sur quoi l'IA a été entraînée.

**Lis d'abord `learn/contents.md`** — c'est l'index canonique des chemins de fichiers. Utilise ces chemins exacts pour récupérer les fichiers spécifiques.

## Contexte du projet

Ce répertoire contient `AGENTS.md` — ce fichier. Lis-le maintenant pour comprendre le langage AllSpeak et le flux de travail avant de travailler sur du code.

**Important :** Vérifie si un fichier appelé `.allspeak-init` existe dans ce répertoire. Si oui, lis-le pour connaître le nom et le type du projet. Sinon, le projet n'a pas encore été configuré — guide l'utilisateur à travers le processus d'initialisation ci-dessous.

### Processus d'initialisation

1. **Salue l'utilisateur** et explique brièvement ce qu'est AllSpeak — un langage de script qui se lit comme du français simple, conçu pour que l'IA écrive le code et que l'humain le vérifie.

2. **Demande à l'utilisateur le nom du projet.** Il sera utilisé comme nom de script et dans les noms de fichiers.

3. **Demande s'il s'agit d'un projet en ligne de commande, d'un projet GUI, ou les deux.**

4. **Crée les fichiers du projet** selon la réponse :

   - **Ligne de commande** : Crée `<projet>.as` à partir du modèle CLI ci-dessous.
   - **GUI** : Crée `<projet>.html`, `<projet>-main.as` et `<projet>.json` à partir des modèles GUI ci-dessous.
   - **Les deux** : Crée tous les fichiers.

5. **Crée `.allspeak-init`** contenant le nom et le type du projet (cli/gui/both) pour ne pas répéter cette configuration.

6. **Lance l'application (GUI) ou explique comment l'exécuter (CLI).**

   - **GUI** : Exécute immédiatement `allspeak server.as -t edit,<projet>` en arrière-plan. Cela démarre le serveur de développement et ouvre deux onglets de navigateur : l'éditeur (`edit.html`) et la page du projet (`<projet>.html`). Dis à l'utilisateur : "J'ai démarré l'application — l'éditeur et votre page projet devraient maintenant être ouverts dans des onglets."
   - **CLI** : Dis à l'utilisateur d'exécuter son script avec `allspeak <projet>.as`.

7. **Explique à l'utilisateur comment les fichiers fonctionnent ensemble.** Pour les projets GUI, explique l'interaction entre HTML (chargeur), `.as` (logique) et `.json` (disposition/Webson).

8. **Demande ce qu'il veut construire.**

---

**Si `.allspeak-init` existe**, saute l'initialisation et travaille normalement. Lis `.allspeak-init` pour connaître le nom et le type du projet.

---

## Modèle CLI

```
!   <projet>.as

    language français

    script <Projet>

!! Point d'entrée : journaliser un message de bienvenue et quitter. Remplacez ceci par la logique réelle du projet.

    variable Message
    mets `Bonjour depuis <Projet>` dans Message
    journalise Message

    quitte
!!!
```

## Modèle GUI

Un projet GUI utilise trois fichiers :

- **`<projet>.html`** — chargeur HTML minimal
- **`<projet>-main.as`** — script AllSpeak (logique)
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
    rest obtiens Script depuis `<projet>-main.as`
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

### `<projet>-main.as`

```
!   <projet>-main.as

    language français

    script <Projet>

!! Démarrer la GUI : rendre la disposition Webson dans le corps et attacher aux éléments.

    div Corps
    variable Layout

    crée Corps
    rest obtiens Layout depuis `<projet>.json`
    rends Layout dans Corps

    div Écran
    attache Écran à `ecran`
    définis le contenu de Écran à `Bonjour depuis <Projet>`

    stop
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

Dans tous les modèles, remplacez `<projet>` par le nom du projet (en minuscules pour les noms de fichiers) et `<Projet>` par le nom du projet en majuscules.

---

## Politique d'extension du langage

Si une construction nécessaire n'existe pas en AllSpeak, **n'invente pas de syntaxe**. Au lieu de cela, fais une pause et propose une nouvelle commande à l'utilisateur, en restant cohérent avec le style proche de l'anglais d'AllSpeak.
