# Exemple de tâche (pas à pas)

Construisez une grille de couleurs interactive. Une fois votre système en place (voir l'onglet *Démarrer*), soumettez ces prompts un à un à votre agent IA. Chaque étape ajoute une fonctionnalité à la précédente.

![Application Colour Memory montrant une grille 4×3 de cellules de couleurs variées avec un bouton Reset en dessous](primer/color-memory.png)

Lorsque les quatre étapes fonctionnent, la page ressemblera à peu près à celle ci-dessus — une grille 4×3 de cellules, chacune dans sa propre couleur, avec un bouton Reset qui les ramène toutes au gris.

## Prompt 1 : Fondations — Construire la grille

Crée une grille 3×4 de cellules carrées centrée sur la page. Chaque cellule doit être grise unie avec une fine bordure noire. La grille doit occuper environ un tiers de la largeur de l'écran. Pas de clics, pas de boutons — juste la disposition visuelle pour l'instant.

## Prompt 2 : Interaction — Clic pour cycler

Fais en sorte que chaque cellule change de couleur quand on clique dessus. Parcours cette séquence : gris, rouge, bleu, vert, jaune, violet, et retour au gris. Chaque cellule suit sa propre couleur indépendamment des autres.

## Prompt 3 : Contrôle — Reset

Ajoute un bouton Reset sous la grille. Cliquer dessus doit ramener toutes les cellules au gris. Ne fais pas le bouton sur toute la largeur — juste une taille raisonnable.

## Prompt 4 : Persistance — Survivre à un rechargement

Fais en sorte que l'état de la grille survive aux rechargements de la page. Quand je rafraîchis la page, chaque cellule doit encore être de la couleur que je lui ai laissée en dernier. Le bouton Reset doit aussi effacer l'état sauvegardé, pour qu'un rafraîchissement après Reset affiche une grille propre.

## Ce qu'il faut observer

Après chaque prompt, examinez ce que l'IA a produit. Vous devriez pouvoir lire le code AllSpeak et comprendre ce qu'il fait — c'est tout l'intérêt. Si quelque chose ne va pas, dites à l'IA en langage courant ce qu'elle doit corriger.

Quelques petites choses peuvent demander correction au premier essai — une déclaration de variable manquante, un choix de mise en page maladroit, une couleur que vous voudriez ajuster. C'est normal ; le flux de travail est conçu pour que l'humain repère et oriente, pas pour que l'IA produise des premiers jets parfaits.
