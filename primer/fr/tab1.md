# Coder sans coder

Vous avez sans doute entendu parler du *vibe coding* — vous dites à une IA ce que vous voulez et elle écrit le logiciel. Cela semble magique, et parfois ça l'est. Mais il y a un piège : le langage dans lequel elle écrit est JavaScript, ou Python, ou autre chose avec des crochets et des points-virgules, et si vous ne lisez pas déjà ce langage, vous n'avez aucun moyen de juger si le travail a été bien fait. Vous faites confiance à l'IA, et quand quelque chose casse — et cela arrivera — vous êtes coincé.

Apprendre à programmer vraiment est l'autre route, et il faut des mois avant la première chose utile. La plupart des gens n'ont pas ce temps.

AllSpeak se place entre les deux. C'est un langage de script qui se lit comme du français — ou de l'anglais, ou de l'italien : le même moteur exécute les quatre langues, chacune avec sa propre syntaxe naturelle.

## À quoi ça ressemble ?

Voici un vrai extrait :

```
    language français

    variable Salutation
    mets `Bonjour !` dans Salutation
    journalise Salutation
```

Pas de crochets, pas de points-virgules, pas de mystère. Si vous savez lire une phrase, vous savez lire AllSpeak.

## Ce n'est pas un jouet

AllSpeak construit de vrais logiciels. Des applications web avec pages interactives et mises en page stylisées. Des outils en ligne de commande qui dialoguent avec des API, traitent des données et gèrent des fichiers. Des applications multi-écrans avec navigation, formulaires et saisies utilisateur. Des connexions temps réel via REST et MQTT. AllSpeak tourne dans n'importe quel navigateur (la version JavaScript) ou depuis le terminal (la version Python) — ou les deux ensemble.

Le secret, c'est qu'une IA se moque du langage dans lequel elle écrit. Donnez-lui un langage de haut niveau capable, et elle fournit les mêmes fonctionnalités qu'en JavaScript — mais sous une forme que vous pouvez lire, vérifier et modifier.

## Et il existe un outil qui sait déjà tout cela

C'est la partie que les autres langages ne vous donnent pas, et c'est pourquoi nous avons écrit **Viz** — l'éditeur AllSpeak, que la commande `allspeak viz` ouvre.

Viz n'est pas un éditeur générique qui se trouverait prendre AllSpeak en charge. Il connaît le langage, et c'est ce qui lui permet de vous montrer un seul fichier de trois façons, dont aucune n'exige un second fichier ni un second outil :

- **Comme texte.** Tout le script, les mots mis en évidence — et avec le compilateur du langage derrière lui, de sorte qu'il peut vérifier ce que vous regardez sans étape de compilation. La moins remarquable des trois, et celle qu'il partage avec tous les autres éditeurs.
- **Comme blocs**, ce qui change votre façon de lire un script. Il cesse d'être un mur de texte et devient une suite de sections : une courte note dans les mots de celui qui l'a écrite, à côté du code qu'elle décrit, avec la liste des sections sur le côté pour passer de l'une à l'autre. Vous lisez la note, et le code dont elle parle est juste là. Cela fonctionne parce que la prose est *dans le fichier*, écrite dans la syntaxe de commentaire du langage — et non dans un document séparé qu'il faudrait tenir en accord avec lui.
- **Comme image d'une exécution** : quelles parties du programme ont été atteintes, dans quel ordre, et à quelle fréquence. Chaque exécution est conservée sous forme de fichier et peut donc être rouverte plus tard — par vous, ou par quelqu'un d'autre, sur une machine qui ne sait même pas exécuter le code.

Ces trois choses seraient trois produits ailleurs : un générateur de documentation, un débogueur ou un profileur, un rapport de couverture — chacun avec ses propres conventions, et aucun n'étant tenu de s'accorder avec la source. Ici, le langage porte déjà la prose et les marqueurs : ce sont donc des **vues d'un seul fichier** plutôt que des choses distinctes à tenir en accord.

Une trace d'appel vous dit qu'un programme a échoué. Un journal est quelque chose que vous avez choisi d'écrire. Un enregistrement, c'est l'exécution elle-même — et même ses marqueurs, `viz start` et `viz stop`, sont des mots-clés ordinaires : un script qui les porte s'exécute exactement comme sans eux, et il n'y a pas de « version de débogage » à tenir à côté de la vraie.

## Ce que vous faites, en réalité

Vous n'écrivez pas le code. Vous décrivez ce que vous voulez à un agent — Claude Code, Reasonix, ou celui que vous utilisez déjà — et il écrit l'AllSpeak. Votre travail est de lire ce qu'il a écrit et de dire si c'est juste.

C'est pourquoi le langage est aussi simple, et pourquoi chaque section d'un script porte une courte note en langage clair, écrite par l'IA, disant ce qu'elle voulait dire. Vous relisez de l'*intention*, pas du code à déchiffrer.

**Ensuite : l'onglet Démarrer.** Il installe un projet et en construit un avec vous, en cinq minutes environ.
