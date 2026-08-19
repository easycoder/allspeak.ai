# Multilingue

AllSpeak permet d'écrire le code dans sa propre langue. Un script `.as` français et un script `.as` anglais compilent vers le même programme interne et tournent sur le même moteur ; seul le vocabulaire source change.

Ce fichier décrit comment fonctionne la couche multilingue. Pour des conseils sur l'écriture de scripts dont la *logique* survit à la traduction (en évitant les présupposés de forme de données centrés sur l'anglais, les particularités d'ordre des mots, etc.), voir [écrire en langage neutre](../idioms/writing-language-neutral.md).

## La directive `language`

Un script peut déclarer la langue de son vocabulaire sur sa première ligne :

```as
language français

alerte `Bonjour, tout le monde !`
```

```as
language italiano

avviso `Ciao, mondo!`
```

```as
language deutsch

alarm `Hallo, Welt!`
```

La directive dit au compilateur quel pack de langue charger. Si elle est omise, l'anglais est supposé :

```as
alert `Hello, world!`
```

Les trois exemples localisés ci-dessus compilent vers la même opération interne alerte-avec-chaîne et tournent sur le même moteur.

## Ce qu'est un pack de langue

Un pack de langue est une correspondance entre les jetons canoniques (internes) et une ou plusieurs formes de surface dans la langue cible. Il couvre six catégories :

- **Opcodes** — les mots-clés de verbe comme `imprime`, `définis`, `si`.
- **Connecteurs** — les petits mots grammaticaux comme `à`, `dans`, `de`, `avec`.
- **Littéraux** — les mots-clés qui produisent des valeurs : `vrai`, `faux`, `maintenant`, `aujourdhui`, `nouvelleligne`.
- **Unités de temps** — `secondes`, `millisecondes`, `ticks`.
- **Conditions** — `est`, `est inférieur à`, `contient`, etc.
- **Mots** — articles, particules, tout le reste traduisible.

Où vivent les packs :

- **JS :** `js/allspeak/LanguagePack_<code>.js` — par exemple `LanguagePack_fr.js`.
- **Python :** `allspeak-py/allspeak/languages/<code>.json` — par exemple `fr.json`.

Les deux sont tenus synchronisés — pour une langue donnée, les mêmes jetons canoniques correspondent aux mêmes formes de surface dans les deux runtimes.

## Comment le pipeline de compilation utilise le pack

Le flux pendant la compilation :

```
source token  →  AllSpeak_Language.reverseWord()  →  canonical token  →  domain compiler
```

Quand le compilateur lit un jeton dans la source, la couche de langue le cherche dans l'index inversé du pack actif et renvoie sa forme canonique. `alerte` → `alert`, `avviso` → `alert`, `alert` → `alert`. Les compilateurs de domaines (Core, Navigateur, etc.) opèrent purement sur des jetons canoniques.

Les domaines ne voient jamais les jetons localisés. C'est pourquoi un script français et un script anglais produisent le même tableau de programme : les deux se réduisent au même flux de jetons canoniques avant que le moindre code de domaine ne s'exécute.

## Plusieurs formes de surface par mot canonique

Une entrée de pack peut faire correspondre un mot canonique à plusieurs formes de surface — utile pour les langues à flexion grammaticale. Les formes sont séparées par des barres verticales :

```
"the": "il|lo|la|gli|le"
```

Le compilateur accepte n'importe laquelle des formes listées ; la forme canonique est ce qui se propage en aval. La recherche `word()` renvoie la première forme (l'orthographe principale pour la sortie) ; `wordForms()` renvoie toute la liste (pour la correspondance pendant la compilation).

## Les langues actuellement fournies

Les deux runtimes fournissent quatre packs :

- **Anglais** (`en`) — l'original ; le défaut si aucune directive `language` n'est présente.
- **Italien** (`it`) — complet.
- **Français** (`fr`) — complet.
- **Allemand** (`de`) — complet.

Les quatre ont été choisies pour la sensibilisation auprès des agences de l'ONU. La couverture du français et de l'allemand est large ; certaines traductions sont encore en cours d'affinage.

## Écrire une logique en langage neutre

Le *vocabulaire* indépendant de la langue est fourni automatiquement par le pack. La *logique* indépendante de la langue — une structure de script qui n'intègre pas de présupposés anglais sur l'ordre des mots, la forme des données ou les motifs culturels — relève de la responsabilité de l'auteur. L'idiome [écrire en langage neutre](../idioms/writing-language-neutral.md) rassemble les motifs et les pièges.

## Ajouter une nouvelle langue

Mécaniquement :

1. Copie `LanguagePack_en.js` (et `languages/en.json` pour Python) vers le code de la nouvelle langue.
2. Traduis les entrées de mots-clés, connecteurs, littéraux, unités de temps, conditions et mots.
3. Ajoute la langue à l'index du chargeur.
4. Rédige une ligne `langage <nom-natif>` et écris des tests.

La partie difficile n'est pas mécanique — c'est le choix du vocabulaire. Les mots-clés anglais d'AllSpeak sont volontairement proches du langage naturel (`take A from B`, `add A to B`, `the index of`), et les traductions doivent se lire naturellement dans la langue cible, pas comme des calques littéraux de l'anglais. La traduction par IA produit un premier jet correct ; une relecture humaine par un locuteur natif la mène à la qualité de publication.

Les problèmes de vocabulaire ouverts sont suivis dans `language-pack-issues.md` à la racine du dépôt.

## Voir aussi

- [structure](structure.md) — où se situe la couche de langue dans le compilateur.
- [symboles et mise en page](symbols-and-layout.md) — la surface lexicale, identique dans toutes les langues.
- [écrire en langage neutre](../idioms/writing-language-neutral.md) — les motifs pour un code qui survit à la traduction.
