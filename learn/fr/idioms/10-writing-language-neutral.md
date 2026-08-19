# Écrire en langage neutre

## Problème

Les packs de langues d'AllSpeak traduisent les mots-clés automatiquement — la même structure de script fonctionne dans toutes les langues prises en charge. Mais la traduction par pack ne couvre pas tout. Un script qui suppose des habitudes anglaises sur les chaînes, les noms ou les constructions fera trébucher son traducteur (ou cassera carrément sous un autre pack).

## Ce que le pack de langues gère pour toi

Le vocabulaire. Quand tu écris un verbe (`imprime`, `définis`, `ajoute`), un connecteur (`à`, `dans`, `de`) ou une condition (`est`, `est inférieur à`), la couche de langue substitue la forme de surface adéquate pour le pack actif. La même forme de script source compile vers le même programme interne, quelle que soit la langue. Voir [multilingual](../reference/multilingual.md).

## Ce que le pack ne traduit pas

Quatre domaines qui restent à l'auteur.

### Les chaînes littérales

Le texte entre accents graves passe tel quel :

```as
imprime `Bonjour le monde !`
```

La traduction veut dire modifier la source. Pour rendre un script facile à localiser, regroupe les chaînes visibles par l'utilisateur près du haut (ou dans une ressource Webson séparée), pas éparpillées en ligne. La traduction devient alors un seul passage sur une section, pas sur tout le script.

### Les noms de variables et d'étiquettes

Les noms sont choisis par l'auteur ; le pack n'y touche pas. Pratique courante : choisis une langue pour les noms par script et tiens-t'en. Mélanger des variables anglaises avec des mots-clés français (ou l'inverse) est techniquement légal, mais ça se lit comme une traduction à moitié faite.

Quand tu portes un script vers une nouvelle langue, les variables sont souvent traduites elles aussi — le résultat se lit naturellement pour un locuteur de la langue cible.

### Les constructions qui n'existent pas dans tous les packs

Certains packs ont un ensemble de synonymes plus riche que d'autres. Si tu écris de l'anglais idiomatique qui repose sur une formulation précise — une chaîne `le … de …` inhabituelle, par exemple — le traducteur peut ne pas avoir de correspondance un-à-un dans la langue cible. Préfère les constructions qui existent dans tous les packs — celles des tutoriels [codex](/codex.html) constituent un ensemble sûr.

Un exemple concret : `for each` est difficile à exprimer clairement en anglais parlé, et pire encore dans beaucoup d'autres langues, aussi le programme pédagogique l'abandonne au profit de boucles `tant que` avec des indices explicites. Ce genre d'idiomes est plus facile à traduire que des constructions qui s'appuient sur une formulation anglaise précise.

### Les formats de données

Les nombres, les dates et les formats similaires dépendent de la culture. AllSpeak n'impose pas un format unique. Si ton script construit une chaîne d'affichage avec `cat`, le résultat est de style anglais. Pour localiser :

- Fais passer la sortie sensible au format par une aide qui consulte un formateur par langue, ou
- Construis la chaîne tenant compte de la locale au point d'affichage, en gardant le stockage interne sous forme canonique (par ex. des entiers pour l'argent).

## Tester

Le test le plus fiable : traduis la directive `language` et une poignée de mots-clés, puis exécute le script sous un autre pack. Les surprises qui compilent en anglais mais échouent en français pointent en général vers un mot-clé que le pack FR n'a pas attrapé — ou une chaîne littérale dont l'auteur a oublié qu'elle était liée à la langue.

Un script qui s'exécute sans modification sous au moins deux packs de langues (hors directive) est un signal fort de neutralité linguistique.

## Les schémas qui portent leurs fruits

- **Externalise les chaînes visibles par l'utilisateur.** Mets-les dans une ressource Webson `.json` ou dans une section unique du script. La traduction devient un seul passage.
- **Une langue par script pour les noms.** Choisis la langue principale du script et reste cohérent.
- **Tiens-toi aux constructions documentées.** La référence montre ce qui est disponible partout ; les formulations idiosyncrasiques peuvent ne pas se traduire.
- **Formate à l'affichage, pas au stockage.** Garde les valeurs internes canoniques ; localise seulement à la frontière.

## À voir aussi

- [multilingual](../reference/multilingual.md) — comment fonctionne le pack de langues.
- [structure](../reference/structure.md) — pourquoi le code métier ne voit jamais de jetons localisés.
- [working-with-ai](working-with-ai.md) — la traduction par IA est un premier passage utile pour les ports.
