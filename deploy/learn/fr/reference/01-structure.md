# Structure

AllSpeak se compose de deux moitiés : un petit runtime, neutre vis-à-vis de la langue, et une pile de **modules de domaine** qui apportent le vocabulaire proprement dit. Le runtime ne connaît aucun mot-clé spécifique. C'est grâce aux domaines que `imprime`, `sur clic`, `rest obtiens` et `envoie mqtt` peuvent cohabiter dans la même langue sans que le moteur n'ait à les embarquer comme primitives.

## Domaines

Un domaine est un module qui possède :

- **Un vocabulaire** — les mots-clés et les formes de commandes qu'il sait compiler.
- **Un ensemble de types de variables** — par exemple, le domaine Navigateur connaît `bouton`, `div`, `input` ; le domaine REST connaît `requête`.
- **Un ensemble de conditions et de valeurs** — des tests et des expressions propres au domaine.
- **Un bouchon de compilateur pour chaque construction** — le code qui reconnaît la syntaxe et la transforme en une forme exécutable.
- **Un exécuteur côté runtime pour chaque construction** — ce qu'il faut faire quand cette forme est exécutée.

Les domaines sont indépendants. En ajouter un nouveau — qu'il soit fourni avec le produit ou installé comme greffon — introduit de nouveaux mots-clés sans toucher aux domaines existants.

## Les domaines standard

Fournis avec la version JS :

| Domaine | Apporte |
|---------|---------|
| Core | Flux de contrôle, variables, arithmétique, chaînes, fichiers |
| Browser | Types DOM, événements, styles, mise en page |
| JSON | Analyse, construction et parcours de JSON |
| Webson | Le mécanisme de liaison de mise en page entre le balisage Webson et les variables AllSpeak |
| REST | Requêtes HTTP, gestion des réponses |
| MQTT | Messagerie pub/sub |

La version Python offre un ensemble similaire, avec quelques divergences sur les collections et les entrées/sorties.

`MarkdownRenderer` est aussi fourni, mais c'est un utilitaire appelé par Core plutôt qu'un domaine à part entière — il n'a pas de vocabulaire.

## Comment fonctionne la compilation

Le compilateur lit la source, une instruction à la fois. Pour chaque instruction, il demande tour à tour à chaque domaine chargé : *peux-tu t'en occuper ?* Le premier domaine qui reconnaît la construction produit un enregistrement compilé — une petite structure de données qui capture l'opération et ses opérandes — et cet enregistrement est ajouté au **tableau de programme**, une séquence linéaire d'instructions compilées.

Si aucun domaine ne revendique l'instruction, c'est une erreur de compilation.

```
ligne source  →  domain.compile()  →  entrée du tableau de programme
```

L'ordre dans lequel les domaines sont essayés importe rarement pour qui écrit des scripts, car chaque domaine possède un vocabulaire distinct.

## Comment fonctionne l'exécution

Le runtime — `Run.js` dans la version JS — parcourt le tableau de programme et distribue chaque entrée à l'exécuteur du domaine qui la possède. L'exécuteur lit les opérandes, manipule les variables, évalue les conditions, et peut céder la main (`arrête`, `attends`) ou transférer le contrôle (`va à`, `vasous`, `bifurque` vers un nouveau fil).

Le runtime lui-même est petit et indépendant de la langue. Il ne sait pas ce que signifie `sur clic` ; il sait seulement comment invoquer le gestionnaire du domaine qui a été lié à la compilation.

## La couche multilingue

Une seconde couche se situe entre le script source et les compilateurs de domaines : le **pack de langue**. Les jetons source de n'importe quelle langue prise en charge (anglais, français, italien, allemand, …) sont résolus à travers le pack de langue vers une forme canonique, puis transmis aux domaines. Les domaines ne voient jamais les jetons localisés — ils travaillent entièrement dans le vocabulaire canonique.

Cela signifie qu'un script `.as` français et un script `.as` anglais compilent vers le même tableau de programme et tournent sur le même moteur. Voir [multilingue](multilingual.md) pour comprendre comment fonctionnent les packs de langue et comment la directive `language` en sélectionne un.

## Greffons

Un greffon est un domaine distribué séparément du runtime fourni. Le contrat est le même que pour les domaines fournis — fournir un vocabulaire, des types, des compilateurs, des exécuteurs — et le chargeur le traite à l'identique. Le domaine MQTT a commencé comme greffon avant d'être promu dans le lot standard ; Google Maps est actuellement un greffon externe.

Les greffons sont indiqués quand un ensemble de fonctionnalités spécialisées (graphisme, intégration matérielle, API tierces) est assez gros pour mériter son propre vocabulaire, mais pas assez central pour appartenir au produit standard. Voir [greffons](plugins.md).

## Outils d'accompagnement

Certaines pièces d'AllSpeak sont indispensables sans être des fonctionnalités du langage. La plus en vue est le **moteur de rendu Webson** — le composant qui transforme le balisage Webson (un dialecte JSON décrivant le HTML/CSS) en DOM. Le domaine Webson fournit la liaison `attache` que les scripts AllSpeak utilisent pour atteindre les éléments rendus ; c'est le moteur de rendu qui émet réellement ces éléments. Voir [navigateur et Webson](browser-and-webson.md).

## Pourquoi la structure ressemble à ça

Le modèle des domaines entraîne quatre conséquences :

1. **Extensibilité sans modification du moteur.** Un nouveau domaine ajoute du vocabulaire sans toucher au code de personne d'autre.
2. **Évolution en parallèle.** Les domaines peuvent être révisés indépendamment — le domaine MQTT ne se préoccupe pas de ce que fait le domaine Navigateur.
3. **Neutralité linguistique.** Comme les domaines opèrent sur des jetons canoniques, le même code de domaine sert toutes les langues humaines que le moteur prend en charge.
4. **Performance grâce aux échappatoires natives.** Le code des chemins critiques peut être un greffon écrit en JS ou en Python, tournant à pleine vitesse native, pendant que l'essentiel de l'application reste en AllSpeak lisible. Le résultat approche la performance d'une version 100 % native avec une lisibilité nettement meilleure. Voir [greffons](plugins.md).

## Voir aussi

- [symboles et mise en page](symbols-and-layout.md) — la surface lexicale que les domaines ne voient jamais directement.
- [variables et tableaux](variables-and-arrays.md) — les types de variables appartiennent aux domaines.
- [multilingue](multilingual.md) — le pack de langue et la directive `language`.
- [greffons](plugins.md) — les domaines externes.
