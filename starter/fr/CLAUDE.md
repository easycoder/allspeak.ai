# Projet AllSpeak — Bootstrap Claude

## Langue

Ceci est un projet AllSpeak en **français**. Communique avec l'utilisateur en français. Génère les scripts AllSpeak en utilisant les mots-clés français. Réponds toujours en français, quelle que soit la langue utilisée par l'utilisateur dans ses prompts.

## Qu'est-ce qu'AllSpeak

AllSpeak est un langage de script conçu pour se lire comme une langue humaine naturelle. Les scripts utilisent l'extension `.as`. AllSpeak fonctionne dans le navigateur (version JavaScript) ou depuis le terminal (version Python) — ou les deux ensemble.

AllSpeak utilise un flux de travail **l'IA écrit, l'humain relit**. L'IA génère le code `.as` ; l'utilisateur vérifie qu'il est lisible et demande des clarifications sur ce qui n'est pas clair. Utilise le langage complet — n'évite pas une commande parce qu'elle pourrait être peu familière. L'utilisateur doit seulement le lire, pas l'écrire de mémoire.

## Note sur l'interface de Claude Code

Claude Code est un outil créé par Anthropic. Son interface (les messages système, les demandes de confirmation, les boutons) est en anglais. Voici ce que signifient les messages les plus courants :

| Message anglais | Signification |
|---|---|
| **Allow** / **Deny** | Autoriser / Refuser — Claude demande la permission d'effectuer une action |
| **Do you want to proceed?** | Voulez-vous continuer ? |
| **Press Enter to continue** | Appuyez sur Entrée pour continuer |
| **Yes / No** | Oui / Non |
| **Retry** | Réessayer |
| **Tool blocked** | Outil bloqué — une action a été refusée |

Les réponses de l'IA (explications, questions, commentaires dans le code) seront en français.

## Première configuration

> **Astuce pour débutants :** Si rien ne se passe quand tu lances Claude, tape **go**.

**IMPORTANT : À CHAQUE message de l'utilisateur** (y compris « go », « bonjour », « commence », ou n'importe quoi d'autre), vérifie d'abord si un fichier nommé `.allspeak-init` existe dans ce répertoire. S'il N'existe PAS, tu DOIS immédiatement exécuter le processus d'initialisation ci-dessous — ne demande pas ce que veut l'utilisateur, n'attends pas d'autres instructions, commence directement à l'étape 1.

### Processus d'initialisation

1. **Salue l'utilisateur** et explique brièvement ce qu'est AllSpeak — un langage de script qui se lit comme du français naturel, conçu pour que l'IA écrive le code et que l'utilisateur le relise.

2. **Demande le nom du projet.** Il sera utilisé comme nom du script et dans les noms de fichiers.

3. **Demande s'il s'agit d'un projet en ligne de commande, d'un projet GUI, ou des deux.**

4. **Crée les fichiers du projet** selon la réponse :

   - **Ligne de commande** : Crée `<projet>.as` à partir du modèle CLI ci-dessous.
   - **GUI** : Crée `<projet>.html`, `<projet>-main.as` et `<projet>.json` à partir des modèles GUI ci-dessous.
   - **Les deux** : Crée tous les fichiers.

5. **Crée `.allspeak-init`** contenant le nom du projet et le type (cli/gui/both) pour ne pas répéter la configuration.

6. **Explique à l'utilisateur comment exécuter son projet :**

   - **CLI** : Exécute avec `allspeak <projet>.as`.
   - **GUI** : Ouvre `<projet>.html` directement dans un navigateur — le runtime AllSpeak est chargé depuis le CDN. Pour les projets qui récupèrent des fichiers locaux (appels REST pour charger des `.as` ou `.json`), démarre un serveur de développement avec `allspeak server.as 8080` (ou n'importe quel port libre), puis ouvre `http://localhost:8080/<projet>.html`.

7. **Guide l'utilisateur à travers la façon dont les fichiers fonctionnent ensemble.** Pour les projets GUI, explique :

   - Le fichier HTML n'est qu'un lanceur — il charge le runtime AllSpeak et exécute un petit script bootstrap qui récupère le fichier `.as` principal.
   - Le fichier `.as` est la logique du programme. Il crée un élément body, récupère le layout `.json` et utilise `rends` pour transformer le JSON en véritables éléments de la page. Il utilise ensuite `attache` pour se relier à ces éléments par leur `@id` et interagir avec eux.
   - Le fichier `.json` définit la mise en page à l'aide de Webson — un format JSON où les clés comme `#element` créent des éléments HTML, `@id` définit des attributs, `#content` définit le texte, `$Nom` définit des composants nommés, `#` liste les enfants, et toute autre clé (comme `padding` ou `color`) est un style CSS.
   - Cette séparation permet de changer la mise en page sans toucher au code, et vice versa.

   Pour les projets CLI, explique que le fichier `.as` est un script autonome exécuté depuis le terminal, et décris ce que fait chaque ligne.

8. **Explique l'éditeur inclus.** Le répertoire du projet inclut `edit.html` et `server.as`, qui fournissent un éditeur dans le navigateur avec coloration syntaxique :

   - Démarre le serveur de développement avec `allspeak server.as 8080` (ou n'importe quel port libre).
   - Ouvre `http://localhost:8080/edit.html` dans un navigateur.
   - L'éditeur permet d'ouvrir, de modifier et d'enregistrer des fichiers `.as`, `.json`, `.html` et d'autres fichiers du projet avec coloration syntaxique.
   - Le même serveur sert aussi les fichiers du projet, donc tu peux tester les projets GUI sur `http://localhost:8080/<projet>.html` sur le même port.

9. **Demande ce que l'utilisateur aimerait construire.** À partir de là, réponds simplement à ce que l'utilisateur veut.

---

**Si `.allspeak-init` EXISTE déjà**, saute l'initialisation et procède normalement. Lis `.allspeak-init` pour connaître le nom et le type du projet.

---

## Modèle CLI

```
!   <projet>.as

    language français

    script <Projet>

    variable Message
    mets `Bonjour depuis <Projet>` dans Message
    journalise Message

    quitte
```

## Modèle GUI

Un projet GUI utilise trois fichiers :

- **`<projet>.html`** — lanceur HTML minimal
- **`<projet>-main.as`** — script AllSpeak (code)
- **`<projet>.json`** — layout Webson (définition de l'UI en JSON)

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
    language français

    variable Script
    rest obtiens Script depuis `<projet>-main.as`
    exécute Script
    </pre>
    <script>
    (function() {
        var t = Date.now();
        var scripts = [
            'https://allspeak.ai/dist/allspeak.js?v=' + t,
            'https://allspeak.ai/dist/LanguagePack_fr.js?v=' + t
        ];
        function load(i) {
            if (i >= scripts.length) { AllSpeak_Startup(); return; }
            var s = document.createElement('script');
            s.src = scripts[i];
            s.onload = function() { load(i + 1); };
            document.head.appendChild(s);
        }
        load(0);
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

    div Corps
    variable Layout

    crée Corps
    rest obtiens Layout depuis `<projet>.json`
    rends Layout dans Corps

    div Écran
    attache Écran à `ecran`
    définis le contenu de Écran à `Bonjour depuis <Projet>`

    arrête
```

### `<projet>.json`

```json
{
    "#doc": "Layout de <Projet>",
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

**Clés Webson :**
- `#element` — type d'élément HTML (`div`, `button`, `img`, etc.)
- `@id`, `@src`, etc. — attributs HTML
- `#content` — texte/HTML interne
- `#` — tableau de références aux éléments enfants
- `$Nom` — définition de composant nommé
- Toutes les autres clés sont des styles CSS

Dans tous les modèles, remplace `<projet>` par le nom du projet (minuscules pour les noms de fichiers) et `<Projet>` par le nom du projet avec une majuscule initiale.

---

## Avertissements importants — limitations connues

### Pas d'arithmétique en ligne dans les conditions
Tu ne peux pas faire de calculs à l'intérieur d'une condition. Calcule d'abord dans une variable temporaire :
```text
! FAUX — ne compile pas
tant que Diviseur par Diviseur est inférieur à N début ... fin

! CORRECT — calcule d'abord
multiplie Diviseur par Diviseur donnant Carre
tant que Carre est inférieur à N début ... fin
```

### Pas d'opérateur modulo
AllSpeak n'a pas d'opérateur modulo/reste. Calcule le reste manuellement :
```text
! Reste = Candidat - (Candidat / Diviseur) * Diviseur
mets Candidat dans Quotient
divise Quotient par Diviseur
multiplie Quotient par Diviseur donnant Temp
mets Candidat dans Reste
soustrais Temp depuis Reste
```
La division est entière (tronquée), donc cela fonctionne correctement.

---

## Règles de syntaxe strictes

- Déclare les variables une par ligne — pas de déclarations avec virgule.
- Déclare les variables avant leur utilisation.
- Boucles : `tant que ... début ... fin` — jamais `fin tant que`.
- Conditionnels : `si ... début ... fin` — jamais `fin si`.
- Gestionnaires d'événements : `sur clic X vasous Gestionnaire` (instruction unique) ou `sur clic X début ... fin` (bloc) — **jamais** `fin sur`. Idem pour `sur changement`, `sur touche`, etc.
- Les blocs `début ... fin` doivent appartenir à une instruction de contrôle.
- Pas de `fonction`, `fin fonction`, `définis` (au sens « definir une fonction »), `sinon` mal placé, `finsi`.
- Pas de forme appelable `Nom(...)` — utilise `vasous Étiquette` et `retourne`.
- Affectation : `mets ... dans Nom`.
- Si tu n'es pas sûr d'une commande, **demande avant d'écrire du code**.
- Les chaînes utilisent les backticks : `comme ceci`
- Les commentaires commencent par `!`
- Chaque script commence par `language français` suivi de `script NomDuScript`
- Les éléments DOM doivent être déclarés avant utilisation (ex. `div X`, `bouton Y`, `input Z`)
- **Pas de précédence implicite dans les chaînes `cat`.** Découpe les expressions complexes en étapes séparées.

## Référence rapide

```text
! Commentaire
language français
script Nom

variable V          ! variable générique

mets 0 dans V
ajoute 1 à V
soustrais 1 depuis V
multiplie V par 2
mets `bonjour` dans V

! Concaténation avec cat — va TOUJOURS entre les valeurs
journalise `Valeur : ` cat V      ! CORRECT
! journalise cat `Valeur : ` V    ! FAUX — cat ne va pas avant la première valeur

si V est 3 début ... fin
tant que V est inférieur à 10 début ... fin

Etiquette:
    vasous FaisTravail
    arrête

FaisTravail:
    retourne

! Pause non-bloquante (aussi : secondes, minutes, ticks)
attends 500 millis

! Entier aléatoire entre 0 et N-1
mets aléatoire 9 dans X

! Lance une routine en arrière-plan (ne fige pas l'UI)
bifurque à NomDeRoutine
```

## Gestion des erreurs

```text
! Par commande : attrape l'échec d'une seule commande
rest obtiens Données depuis `/api`
ou début
  mets le message d'erreur dans Statut
fin

! Par bloc : attrape toute erreur dans le bloc
essaie
  divise Total par Compte
ou gère
  mets le message d'erreur dans Statut
fin
```

## Tableaux

Une variable peut contenir un tableau indexé de valeurs. Déclare la taille avec `définis les éléments de X à N`, puis pointe sur un élément précis avec `indexe X à N` avant de lire ou d'écrire.

```text
variable Cellule
définis les éléments de Cellule à 9    ! tableau de 9 cases

mets 0 dans Index
tant que Index est inférieur à 9
début
    indexe Cellule à Index             ! pointe sur la case Index
    mets 0 dans Cellule                ! écrit Cellule[Index]
    ajoute 1 à Index
fin

indexe Cellule à 4
mets Cellule dans Milieu               ! lit Cellule[4]
```

Une variable d'élément DOM peut aussi être un tableau (`div Cellule`, puis `définis les éléments de Cellule à 9`). Un seul `crée Cellule` dans une boucle crée chaque case, et `sur clic Cellule` se déclenche pour n'importe laquelle ; `mets l index de Cellule dans Index` indique au gestionnaire laquelle.

**Ne crée pas** de variables numérotées en parallèle (`variable Score0`, `variable Score1`, …). Utilise un seul tableau (`variable Score`, `définis les éléments de Score à 9`) et indexe-le. Les boucles deviennent possibles, le script raccourcit, et le modèle de données correspond au problème.

## Spécifique GUI (JS/navigateur)

```text
div Element
bouton Btn
input Champ
img Image

attache Element à `dom-id`
crée Element dans Parent
définis le contenu de Element à `texte`
définis style `color` de Element à `red`
sur clic Btn vasous GèreClic
rest obtiens Var depuis `/api/data`
journalise `message`         ! console du navigateur
alerte `message`             ! boîte de dialogue du navigateur
```

## Spécifique CLI (Python)

```text
obtiens Var depuis url `https://example.com/api`
mets json ChaineVar dans DictVar
mets entrée `clé` de DictVar dans Var
input Var                              ! lit l'entrée utilisateur (prompt par défaut ': ')
input Var with `Entrez une valeur : `  ! avec prompt personnalisé
! NOTE : input est une commande autonome, PAS une valeur. N'utilise pas 'mets input dans Var'
quitte
```

## Politique d'extension du langage

Si une construction nécessaire n'existe pas dans AllSpeak, **n'invente pas de syntaxe**. À la place, arrête-toi et propose une nouvelle commande à l'utilisateur, en la gardant cohérente avec le style naturel français d'AllSpeak.
