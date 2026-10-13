# Démarrer

Une installation, une seule fois, puis un petit programme construit prompt après prompt et observé en train de tourner. Rien ici ne vous demande d'écrire du code.

## Avant de commencer

Trois choses :

- **Python 3** — la commande `allspeak` est un paquet Python.
- **Un terminal** — la fenêtre dans laquelle on tape des commandes. PowerShell sous Windows, Terminal sous macOS ou Linux.
- **Un agent IA de programmation.** L'un des deux ci-dessous fera l'affaire.

Une chose à savoir avant de commencer : **l'agent écrit l'AllSpeak, vous le relisez.** Vous ne taperez pas une seule ligne de code, à une exception près — la seule commande qui lance Viz.

## Lancer Viz

Viz est une page web, mais ce n'est pas un site que l'on visite. Elle est servie depuis votre propre machine, et une seule commande la lance :

```
allspeak viz
```

**Il y a deux moitiés là-dedans, et la distinction vaut un instant d'attention.** La commande démarre le *serveur de développement* d'AllSpeak — un petit programme AllSpeak, exécuté par le runtime Python — sur `localhost:8080`, et ouvre dans votre navigateur la page que ce serveur sert. Le **serveur** vit dans ce terminal et doit continuer de tourner ; **Viz** est la page, et elle vit dans le navigateur. Fermez le terminal et Viz cesse de répondre, d'où les instructions ci-dessous qui vous disent de le laisser ouvert.

La raison de cette séparation est qu'une page web ne peut pas lire un dossier. Un serveur, si : c'est lui qui liste les fichiers de votre projet, les ouvre, les réécrit quand vous enregistrez et exécute vos scripts. Et comme il est sur `localhost` et non sur l'internet, votre projet reste sur votre machine.

Le même serveur répond aussi à `http://localhost:8080/<votre-page>.html` — la page de votre propre application — si bien qu'une seule commande vous donne à la fois l'outil et ce que vous construisez. Relancer `allspeak viz` est sans danger : la commande trouve le serveur déjà là et se contente de rouvrir la page.

## Installation

### AllSpeak avec Claude Code

Claude Code est un agent IA de programmation qui tourne dans votre terminal.

1. Installez AllSpeak : `pip install -U allspeak-ai`
2. Créez un dossier vide pour votre projet.
3. Téléchargez [allspeak-fr.zip](https://allspeak.ai/allspeak-fr.zip) et décompressez-le dans ce dossier. C'est le *pack de démarrage* — les instructions de votre agent, et la note disant quelle langue parle ce projet. Il ne contient aucun outil, volontairement : tout le reste est récupéré au moment où il devient nécessaire, de sorte que rien dans votre dossier ne peut devenir obsolète.
4. Installez Claude Code (voir [claude.ai/code](https://claude.ai/code)).
5. Dans le dossier du projet, lancez Viz : `allspeak viz`. Laissez ce terminal tourner.
6. Ouvrez un **second** terminal dans le même dossier et tapez `claude`.
7. Quand Claude démarre, tapez **go**.

### AllSpeak avec Reasonix

Reasonix est un agent IA de programmation doté d'une application de bureau, que beaucoup trouvent plus facile à garder à l'œil qu'un terminal.

1. Installez AllSpeak : `pip install -U allspeak-ai`
2. Téléchargez et installez l'application Reasonix depuis [reasonix.io](https://reasonix.io).
3. Créez un dossier vide pour votre projet.
4. Téléchargez [allspeak-fr.zip](https://allspeak.ai/allspeak-fr.zip) et décompressez-le dans ce dossier — le même pack de démarrage que ci-dessus.
5. Dans le dossier du projet, lancez Viz : `allspeak viz`. Laissez ce terminal tourner ; c'est le seul dont vous aurez besoin.
6. Démarrez Reasonix, cliquez sur **Add new project**, et choisissez le dossier de votre projet.
7. Dites à Reasonix ce que vous voulez construire. À la première utilisation, il vous demandera votre clé API DeepSeek et la conservera.

### Dans les deux cas

Votre agent pose quelques questions, crée les fichiers du projet et explique à quoi sert chacun. Ensuite, c'est une conversation : vous dites ce que vous voulez, il écrit le code.

**Son premier travail est de vous présenter Viz** — la page maintenant ouverte dans votre navigateur, et l'endroit où vous exécuterez le programme, observerez une exécution et verrez ce que l'IA a fait. Laissez-le vous la montrer ; être guidé une fois vaut mieux qu'en lire la description.

Une note sur les commandes : l'extension `.allspeak` est facultative, donc `allspeak monprojet` et `allspeak monprojet.allspeak` sont la même commande.

## Construisez-le : la grille de couleurs

Quatre prompts, chacun ajoutant une fonctionnalité à la précédente. Envoyez-les un par un, et lisez la réponse avant d'envoyer le suivant.

![Application Colour Memory montrant une grille 4×3 de cellules de couleurs variées avec un bouton Reset en dessous](primer/color-memory.png)

### Prompt 1 — la grille

Crée une grille de 4 colonnes sur 3 rangées de cellules carrées centrée sur la page. Chaque cellule doit être grise unie avec une fine bordure noire. La grille doit occuper environ un tiers de la largeur de l'écran. Pas de clics, pas de boutons — juste la disposition visuelle pour l'instant.

### Prompt 2 — cliquer pour changer de couleur

Fais en sorte que chaque cellule change de couleur quand on clique dessus. Parcours cette séquence : gris, rouge, bleu, vert, jaune, violet, et retour au gris. Chaque cellule suit sa propre couleur indépendamment des autres.

### Prompt 3 — un bouton de réinitialisation

Ajoute un bouton Reset sous la grille. Cliquer dessus doit ramener toutes les cellules au gris. Ne fais pas le bouton sur toute la largeur — juste une taille raisonnable.

### Prompt 4 — survivre à un rechargement

Fais en sorte que l'état de la grille survive aux rechargements de la page. Quand je rafraîchis la page, chaque cellule doit encore être de la couleur que je lui ai laissée en dernier. Le bouton Reset doit aussi effacer l'état sauvegardé, pour qu'un rafraîchissement après Reset affiche une grille propre.

## Ce qu'il faut observer

Après chaque prompt, examinez ce que l'IA a produit. Vous devriez pouvoir suivre l'AllSpeak — c'est tout l'intérêt. Si quelque chose ne va pas, dites-le en langage courant et ce sera corrigé.

Quelques petites choses peuvent demander correction au premier essai — une déclaration de variable manquante, une mise en page maladroite, une couleur que vous voudriez ajuster. C'est normal ; le flux de travail est conçu pour que l'humain repère et oriente, pas pour que l'IA produise des premiers jets parfaits.

Vous pouvez voir tout l'exemple en train d'être construit dans cette courte vidéo : [AllSpeak primer in action](https://www.youtube.com/watch?v=BSvh4MPEzV4).

## Regardez maintenant l'exécution

Viz montre une *exécution*, pas le code : la première étape est donc de dire quelle partie d'une exécution mérite d'être observée. Demandez à votre agent :

> Marque le gestionnaire de clic, et enregistre une exécution pour moi.

Cela place une ligne `viz start` là où commence la partie intéressante et une ligne `viz stop` là où elle se termine, et nomme la page de votre application pour que Viz sache quoi ouvrir. Ensuite, dans Viz :

- **Record** exécute le script et enregistre l'exécution à côté de celui-ci, dans un fichier `.viz.json`. Votre application s'ouvre dans sa propre fenêtre — cliquez quelques cases, puis fermez cette fenêtre.
- **Graph** dessine ce qui s'est passé : les lignes du script en rangées, une marque partout où l'exécution est passée, et de la chaleur là où elle est passée souvent.
- **Cliquez sur une marque** et la barre latérale montre le bloc dont elle vient — la prose écrite par votre agent, à côté du code qu'elle décrit, avec la ligne, la visite et le total.
- **Blocks** lit tout le script de cette manière, bloc par bloc, pour que vous puissiez vérifier ce que l'IA a fait sans lire du code.

Posez ensuite la question suivante et répondez-y de la même façon : resserrez les marqueurs autour de ce qui vous laisse perplexe, enregistrez à nouveau, regardez à nouveau. Cette boucle est tout le travail — et rien de tout cela ne vous a demandé d'écrire une ligne.

## Des questions ?

Contactez-nous à [info@allspeak.ai](mailto:info@allspeak.ai).

## À propos des variantes linguistiques

AllSpeak est en développement actif. Les variantes autres que l'anglais peuvent contenir des mots-clés ou des tournures que le moteur ne prend pas encore pleinement en charge. Si vous rencontrez une erreur de compilation sur un mot-clé qui paraît correct, signalez-le à [info@allspeak.ai](mailto:info@allspeak.ai) — les corrections sont généralement rapides.

## Plus tard : si vous gardez le projet

Le pack de démarrage et la page de votre projet chargent le runtime depuis `https://allspeak.ai/dist/`, qui reflète toujours la dernière version. C'est ce qu'il faut pour les tutoriels et les expériences courtes. Pour un projet que vous comptez maintenir, fixez-le afin qu'une mise à jour ultérieure ne puisse pas le changer sous vous :

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

Cette URL sert le build déployé le 8 mai 2026, et ne change jamais. Pour mettre à niveau, testez la version courante puis changez le nombre. Le [Codex](https://allspeak.ai/codex.html) explique comment auto-héberger le runtime à la place.
