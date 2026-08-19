# Choisir la forme d'une collection

## Problème

Tu as besoin de stocker plusieurs valeurs qui vont ensemble. AllSpeak offre quatre formes — les tableaux de variables, les propriétés, les dictionnaires, les listes (voir [collections](../reference/collections.md)). Choisir la mauvaise trop tôt crée des frictions dans tout le script : des accesseurs verbeux, une itération maladroite, une fragmentation accidentelle des données.

## Les critères

Le choix se mappe presque mécaniquement sur le motif d'accès :

| Si tu accèdes aux données … | Utilise |
|----------------------|-----|
| Par position, avec plusieurs variables en pas synchronisé | Tableau de variables |
| Par position, comme une seule séquence typée | Liste |
| Par clé de chaîne | Dictionnaire |
| Comme métadonnées sur un objet | Propriété |

La frontière la plus difficile est entre tableau de variables et liste, parce qu'ils se ressemblent. Règle de décision : **si tu utilises le même index `N` sur deux variables ou plus, ces variables veulent être des tableaux de variables parallèles**. Si une seule séquence suffit, une liste est plus simple.

## Tableau de variables — pour les enregistrements parallèles

Cinq éléments cliquables, chacun avec une légende, une URL cible et un drapeau « visité » :

```as
bouton Item
variable Caption
variable Target
variable Visited

définis les éléments de Item à 5
définis les éléments de Caption à 5
définis les éléments de Target à 5
définis les éléments de Visited à 5

! ... remplis chaque tableau parallèle ...

sur clic Item vasous à HandleClick

HandleClick:
    indexe Caption à l index de Item
    indexe Target à l index de Item
    indexe Visited à l index de Item
    ! Les trois pointent maintenant sur la case correspondante
    retourne
```

Un curseur qui se déclenche, trois lectures coordonnées. C'est l'idiome AllSpeak pour l'accès aux enregistrements par position.

## Dictionnaire — pour la configuration par clés

Un bloc de configuration avec des champs nommés :

```as
variable Config
définis Config à objet
définis propriété `theme` de Config à `dark`
définis propriété `pageSize` de Config à 50
définis propriété `apiKey` de Config à le contenu de KeyField

si propriété `theme` de Config est `dark` début
    ! applique le style sombre
fin
```

Utilise un dictionnaire quand les clés sont des noms de chaînes bien connus et que l'accès se fait par nom, pas par position.

## Liste — pour une séquence ordonnée sans structure parallèle

Un tampon de journalisation :

```as
variable Log
définis Log à tableau
définis élément 0 de Log à `Utilisateur connecté`
définis élément 1 de Log à `Panier rempli`
définis élément 2 de Log à `Commande passée`
```

Les éléments sont uniformes et sans lien avec toute autre variable. Aucune coordination de curseur nécessaire. Prends une liste plutôt qu'un tableau de variables.

## Anti-motif : liste de dictionnaires alors que des tableaux parallèles suffisent

```as
! Évite ça quand les enregistrements sont accédés par index
variable Items
définis Items à tableau
variable Item
définis Item à objet
définis propriété `caption` de Item à `Acheter`
définis propriété `target` de Item à `/buy`
définis élément 0 de Items à Item
! ... recommence pour chaque élément ...
```

Ça marche mais c'est verbeux. Si ton motif d'accès est constamment « donne-moi l'enregistrement N », les tableaux de variables parallèles sont plus courts et s'intègrent plus naturellement avec les gestionnaires `sur clic` (pas d'extraction de propriété par enregistrement dans le gestionnaire).

Prends une liste de dictionnaires quand les enregistrements sont conceptuellement des documents — hétérogènes, accédés rarement, ou transmis en JSON. Prends des tableaux de variables parallèles quand les enregistrements sont accédés en synchronisation avec l'interface ou d'autre état.

## Anti-motif : un dictionnaire séparé alors qu'une propriété suffirait

Si tu as besoin d'un ou deux faits nommés attachés à un objet existant (bouton, div, fichier), utilise `définis propriété … de Obj à …` directement sur l'objet plutôt que de déclarer un dictionnaire parallèle indexé par une sorte d'identifiant d'objet. L'information reste attachée à la chose qu'elle décrit.

## À voir aussi

- [collections](../reference/collections.md) — les quatre formes en détail.
- [variables-and-arrays](../reference/variables-and-arrays.md) — le modèle du curseur.
- [event-handlers-and-array-index](02-event-handlers-and-array-index.md) — pourquoi les tableaux parallèles + le curseur paient dans les gestionnaires.
