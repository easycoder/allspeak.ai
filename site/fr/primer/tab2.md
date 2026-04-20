# Exemple de tâche (pas à pas)

Construisez un jeu de Morpion. Une fois votre système en place (voir l'onglet *Démarrer*), soumettez ces prompts un à un à votre agent IA.

## Prompt 1 : Construire le plateau

Crée un jeu de Morpion avec une grille de 3×3 cases. Le plateau doit être centré à l'écran et occuper environ la moitié de la largeur. Chaque case doit être carrée avec une bordure visible.

## Prompt 2 : Ajouter le tour par tour

Il y a deux joueurs : l'humain et l'ordinateur. Le joueur qui commence est choisi au hasard. Quand c'est au tour de l'humain, toucher une case vide la revendique (elle apparaît en vert). Quand c'est au tour de l'ordinateur, il marque une courte pause pour « réfléchir » puis revendique une case (affichée en rouge). Les cases déjà prises ne peuvent plus être touchées.

## Prompt 3 : Détecter un vainqueur

Après chaque coup, vérifie si une ligne, une colonne ou une diagonale est entièrement d'une seule couleur. Si oui, annonce le vainqueur. Si toutes les cases sont remplies sans vainqueur, annonce un match nul.

## Prompt 4 : Améliorer la stratégie de l'ordinateur

L'ordinateur choisit actuellement ses cases au hasard. Donne-lui une stratégie de base : bloquer l'humain quand il est sur le point de compléter une ligne, et privilégier les coups qui le rapprochent de compléter la sienne.

## Ce qu'il faut observer

Après chaque prompt, examinez ce que l'IA a produit. Vous devriez pouvoir lire le code AllSpeak et comprendre ce qu'il fait — c'est tout l'intérêt. Si quelque chose ne va pas, dites à l'IA en langage courant ce qu'elle doit corriger.
