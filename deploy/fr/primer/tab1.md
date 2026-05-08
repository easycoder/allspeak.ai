# Coder sans coder

Vous avez sans doute entendu parler du *vibe coding* — vous dites à une IA ce que vous voulez et elle écrit le logiciel. Cela semble magique, et parfois ça l'est. Mais il y a un piège : le code produit est dans des langages comme JavaScript ou Python, et si vous ne connaissez pas déjà ces langages, vous n'avez aucun moyen de juger si l'IA a fait du bon travail. Vous avancez à l'aveugle, et quand quelque chose casse — et cela arrivera — vous êtes coincé.

À l'autre extrême, la programmation traditionnelle demande des mois d'apprentissage avant de produire quoi que ce soit d'utile. La plupart des gens n'ont pas ce temps.

AllSpeak se place entre les deux. C'est un langage de script conçu pour se lire comme du français (ou de l'anglais, ou toute autre langue), de sorte que lorsque l'IA écrit du code pour vous, vous pouvez suivre ce qu'elle fait. Vous gardez le contrôle sans avoir besoin d'un diplôme d'informatique.

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

Le secret, c'est que l'IA se moque du langage dans lequel elle écrit. Donnez-lui un langage de haut niveau capable, et elle fournit les mêmes fonctionnalités qu'en JavaScript — mais sous une forme que vous pouvez lire, vérifier et modifier.

## Comment commencer

La voie la plus rapide est **AllSpeak + Claude Code**. Claude Code est un agent IA de programmation qui tourne dans votre terminal. Combiné à notre pack de démarrage, il mettra en place un projet fonctionnel en moins de cinq minutes — avec une explication de chaque fichier créé.

Voici la marche à suivre :

1. Créez un dossier vide pour votre projet.
2. Téléchargez [allspeak-fr.zip](https://allspeak.ai/allspeak-fr.zip) et décompressez-le dans ce dossier.
3. Installez AllSpeak : `pip install -U allspeak-ai`
4. Installez Claude Code (voir [claude.ai/code](https://claude.ai/code)).
5. Ouvrez un terminal dans ce dossier et tapez `claude`.
6. Quand Claude démarre, tapez **go**.

Claude vous posera quelques questions, créera les fichiers de votre projet et vous expliquera comment tout s'articule. Ensuite, il vous suffit de lui dire ce que vous voulez construire.

## Pour aller plus loin

- **Onglet Exemple** — une construction guidée pas à pas pour voir le flux de travail en action.
- **Onglet Manuel IA** — l'argumentaire complet en faveur du développement IA structuré par opposition au vibe coding.
- **[Codex](https://allspeak.ai/codex.html)** — un tutoriel interactif, une référence et un bac à sable pour le langage AllSpeak.

## À propos des variantes linguistiques

AllSpeak est en développement actif. Les variantes autres que l'anglais peuvent contenir des mots-clés ou des tournures que le moteur ne prend pas encore pleinement en charge. Si vous rencontrez une erreur de compilation sur un mot-clé qui paraît correct, signalez-le à [info@allspeak.ai](mailto:info@allspeak.ai) — les corrections sont généralement rapides.

## Auto-hébergement pour la stabilité

Le starter et les modèles chargent le runtime depuis `https://allspeak.ai/dist/`, qui reflète toujours la dernière version. C'est parfait pour les tutoriels et les expériences courtes — mais pour les projets que vous comptez maintenir, fixez une version stable afin qu'une future mise à jour ne casse pas votre script de façon imprévue.

Deux options s'offrent à vous :

### 1. Fixer un instantané daté (recommandé)

Chaque déploiement est aussi archivé sous un chemin daté :

```html
<script src="https://allspeak.ai/dist/260508/allspeak.js"></script>
```

Cette URL sert le build déployé le 8 mai 2026 et ne changera pas — le `/dist/allspeak.js` glissant continue d'avancer en parallèle. Pour mettre à niveau, changez un seul nombre après avoir testé.

### 2. Auto-héberger

Pour un contrôle total ou un usage hors-ligne, copiez le runtime sur votre propre serveur. Les fichiers essentiels sont :

- `dist/allspeak.js` (ou `dist/allspeak-min.js`) — le runtime
- `dist/LanguagePack_*.js` — les packs de langue non anglais
- `dist/plugins/` — les plugins utilisés par votre projet
- `dist/vendor/` — Showdown et les extensions CodeMirror

Modifiez ensuite les URL `src=` de votre HTML pour pointer vers votre copie. Pour mettre à jour ultérieurement, récupérez un instantané daté depuis `https://allspeak.ai/dist/<AAMMJJ>/` et remplacez les fichiers.

Pour les tutoriels et les expériences courtes, aucune de ces étapes n'est nécessaire — gardez l'URL glissante.

## Des questions ?

Contactez-nous à [info@allspeak.ai](mailto:info@allspeak.ai).
