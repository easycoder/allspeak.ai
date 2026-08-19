# Extraire un module

## Problème

Ton script a dépassé quelques milliers de lignes. Le parcourir, le relire et le recharger sont devenus pénibles. Une section en particulier ne cesse de revenir dans les revues de code parce qu'elle est difficile à suivre au milieu du reste. Il est temps de l'extraire en module.

## Quand extraire

Des déclencheurs qui invitent à envisager l'extraction :

- Script de plus de ~2500 lignes, et ça continue de grossir.
- Une zone fonctionnelle précise ne cesse de revenir dans les revues de code parce qu'elle est difficile à suivre au milieu du reste.
- Une transformation autonome qui pourrait être réutilisée d'un script à l'autre.

Un bloc est un bon candidat quand :

1. **Un seul objectif.** Une phrase suffit à décrire ce qu'il fait. Si la description a besoin de deux « et aussi », ce n'est pas un module — c'en est plusieurs.
2. **La bonne taille : 200 à 500 lignes.** En dessous, le surcoût de la frontière domine le gain. Au-dessus, le nouveau module devient lui-même difficile à parcourir.
3. **Surtout ses propres variables.** Une poignée d'entrées et de sorties ; le reste est interne. Si l'usage « extérieur » est éparpillé partout, le bloc n'est pas vraiment séparable.
4. **Couplage minimal au DOM / MQTT / global.** Les transformations pures (données en entrée, données en sortie) sont les plus propres. Les zones lourdes en DOM sont les pires — chaque rafraîchissement devient un aller-retour de message, sauf si le module possède aussi son DOM.

## Quand ne pas extraire

Ne pas extraire :

- **Les chemins étroitement couplés au DOM**, sauf si le module possède aussi son DOM. Un module qui demande au parent « peins le bouton X en rouge » par messages à chaque clic sera plus lent et plus difficile à déboguer que la version en ligne.
- **Les blocs de moins de ~150 lignes.** Le surcoût d'interface mange le gain.
- **Les mécanismes qui se déclenchent plusieurs fois par action utilisateur.** Un clic déclenchant 10 petites mises à jour d'interface générerait 10 allers-retours.
- **L'état partagé dans les deux sens.** L'extraction fonctionne quand le flux de données est surtout unidirectionnel par appel (parent → module → réponse → parent). Quand les deux côtés continuent de modifier la même valeur, la sémantique d'instantané s'effondre.

## La forme de l'extraction

Les modules communiquent par passage de messages. Un parent charge le module et lui envoie des dictionnaires :

```as
! Parent
exécute `mod.as` comme ModName
...
envoie Input à ModName et assigne réponse à Output
```

Le module déclare un gestionnaire de messages, libère le parent, puis attend :

```as
! Module
script Mod
... déclarations de variables ...

sur message va à Handler
libère parent
arrête

Handler:
    mets le message dans Input
    ! ... traiter ...
    envoie Output à expéditeur
    arrête
```

`libère parent` fait que le `exécute` du parent retourne immédiatement. Sans lui, le parent reste bloqué sur `exécute` en attendant que l'enfant termine — parfait si le module est à usage unique, inutile pour un assistant durable.

Voir [modules](../reference/modules.md) pour le mécanisme complet.

## Le schéma concurrent

Mêmes mécanismes — `libère parent`, `sur message`, `arrête` — mais le module possède un état durable et peut piloter son propre DOM, des tâches bifurquées ou des boucles périodiques. À utiliser quand le module possède un éditeur de feuille, un sous-écran ou sa propre boucle d'événements. La frontière est la même ; ce qui change, c'est la structure interne du module.

## Conception de l'interface

Quelques règles qui paient :

- **Un dictionnaire par direction.** Les entrées et sorties multi-valeurs voyagent en un seul dictionnaire, pas en plusieurs variables séparées à la frontière.
- **Pas de références vivantes à travers la frontière.** Une fois qu'une valeur traverse, le récepteur peut la modifier librement ; l'expéditeur garde sa propre copie. Ne suppose pas que le parent aura encore les mêmes données au prochain aller-retour.
- **Le parent garde la propriété du réseau / MQTT.** Les modules renvoient leurs résultats au parent ; c'est le parent qui fait le véritable appel serveur. Sinon, chaque module dupliquerait l'état de connexion et les identifiants.
- **Des charges utiles petites.** Les enregistrements complets, c'est bien. Des arbres de mise en page entiers à chaque clic, non.

## Exemples concrets

Deux schémas documentés en détail dans la compétence `as-modularize` :

- **controller ↔ deviceControl** (dialecte Python) — l'extraction canonique façon sous-routine.
- **shell ↔ map-to-rooms** (dialecte JS) — une extraction à transformation pure, sans DOM, un chargement en deux temps `rest obtiens` + `exécute`.

## À voir aussi

- [modules](../reference/modules.md) — la mécanique : `exécute`, `libère parent`, `envoie`, `sur message`, `quitte`.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — les modules libérés sont des fils d'exécution coopératifs.
- [picking-a-collection-shape](picking-a-collection-shape.md) — pour la règle du dictionnaire par direction.
