# Outils et techniques AllSpeak #

## Plugins ##
Le langage ~ec~ standard inclut un large éventail de constructions de programmation générales dont tout langage a besoin : variables, valeurs, conditionnelles, chaînes de caractères, nombres, etc. Tout le reste est fourni par des plugins. Certains d'entre eux, notamment les fonctionnalités du navigateur, JSON et REST, sont chargés automatiquement (bien que ce comportement puisse être modifié si nécessaire) et plusieurs autres sont disponibles en tant que plugins optionnels. Les plugins ajoutent des commandes au langage et doivent être chargés avant que tout script utilisant ces mots-clés ne puisse être compilé.

Le mécanisme pour demander un plugin est très simple. Suppose que tu veuilles inclure une carte Google dans ta page web. Tu auras besoin du plugin ~code:gmap~, qui se charge ainsi, où les fichiers ~ec~ se trouvent tous dans un dossier de premier niveau `allspeak` :

~pre:requiert js `allspeak/plugins/gmap.js`~

Dans cet exemple, le plugin est un plugin ~ec~ standard mais tu peux aussi charger des plugins tiers depuis n'importe quelle URL si tu traites les questions de CORS.

Une fois le plugin chargé, il est disponible pour tout script qui en a besoin (mais pas pour celui qui l'a chargé). Ici, tout script qui inclut des commandes de carte peut être chargé et compilé, comme dans

~pre:rest obtiens Script depuis `/resources/ecs/myscript.allspeak`
exécute Script~

(C'est la forme la plus simple, qui suppose que tu n'as pas besoin de communiquer avec le script une fois qu'il est en cours d'exécution.)

Il devrait être assez évident que lorsque les plugins sont utilisés de cette façon, le code que tu veux exécuter doit se trouver dans un script séparé qui est chargé et exécuté _après_ que le plugin est prêt. Une alternative à cela est de déclarer le plugin globalement au moment où ~ec~ démarre. Dans le dossier allspeak de premier niveau se trouve un fichier appelé ~code:plugins.js~, qui te permet de spécifier quels plugins doivent être chargés au démarrage et lesquels seront disponibles pour un chargement à la demande. Cela ralentira légèrement le chargement initial de la page, mais en pratique la différence est très faible.
