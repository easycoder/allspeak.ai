# Le serveur comme application

## Problème

Un projet GUI AllSpeak typique produit deux artefacts avec lesquels l'utilisateur interagit : un éditeur basé sur le navigateur (`edit.html`) et une ou plusieurs pages de projet (`<projet>.html`). Considérés comme des artefacts séparés, l'utilisateur doit démarrer un serveur de développement dans un terminal, ouvrir l'URL de l'éditeur dans un onglet, ouvrir l'URL du projet dans un autre onglet, et se souvenir du port. Ça fait quatre étapes et trois morceaux d'état mental pour ce qui est, conceptuellement, une seule chose en cours d'exécution.

Le cadre plus simple : **le serveur est l'application, et les onglets du navigateur sont son interface.** L'utilisateur lance une seule commande ; les onglets s'ouvrent tout seuls ; fermer le serveur ferme l'application.

## Le schéma

`server.as` accepte un indicateur `-t` / `--tabs` dont la valeur est une liste de noms de pages séparés par des virgules (sans `.html`) :

```
allspeak server.as -t edit,<projet>
allspeak server.as --tabs edit,<projet> 8080
```

Pour chaque nom, le serveur construit `http://localhost:<port>/<nom>.html` et l'ouvre dans le navigateur par défaut de l'utilisateur avec [`browse`](../reference/17-dev-environment.md#browse). Le port par défaut est 8080 et peut apparaître avant ou après l'indicateur.

La convention de lancement des packs de démarrage est d'exécuter cette commande en arrière-plan dès que les fichiers de définition de l'interface existent, pour que l'utilisateur voie une seule application prendre vie plutôt que trois étapes séparées.

## Anatomie d'un script de lancement

Un lanceur qui utilise ce schéma a quatre phases ordonnées :

1. **Analyse les arguments de la ligne de commande.** Boucle sur `argc` / `arg N`, reconnais l'indicateur, traite tout le reste comme le port.
2. **Démarre le serveur.** `start MyServer on port Port` accepte le port mais n'a pas encore de gestionnaire.
3. **Enregistre le gestionnaire de requêtes.** `on MyServer request début … fin` positionne le compteur de programme du gestionnaire et saute au-delà du corps.
4. **Ouvre les onglets.** Scinde la liste séparée par des virgules, construit chaque URL, appelle `browse` dessus.

L'ordre est déterminant : les phases 3 et 4 doivent être dans cet ordre. Si `browse` s'exécute avant le bloc du gestionnaire, les onglets fraîchement ouverts font la course avec le serveur et se prennent un 503 « Server handler not ready » avant que le gestionnaire soit installé. La solution est de placer la boucle d'ouverture des onglets à la *fin* du script, après le bloc `on … request début … fin`.

```
    start Files on port Port

    on Files request
    début
        ! ... gérer les requêtes ...
    fin

    ! Après l'enregistrement du gestionnaire — jamais avant.
    si TabList est pas vide
    début
        scinde TabList sur `,`
        mets 0 dans TabIndex
        tant que TabIndex est inférieur à les éléments de TabList
        début
            indexe TabList à TabIndex
            mets TabList dans TabName
            si TabName est pas vide
            début
                mets `http://localhost:` cat Port cat `/` cat TabName cat `.html` dans TabUrl
                browse TabUrl
            fin
            increment TabIndex
        fin
    fin
```

L'implémentation de référence complète est `server.as` dans les packs de démarrage.

## Quand utiliser ce schéma

- **Les projets GUI** où l'utilisateur a besoin que l'éditeur et une page de projet soient ouverts. La valeur par défaut dans le `CLAUDE.md` des packs de démarrage est de lancer avec `-t edit,<projet>`.
- **Les projets CLI** où l'utilisateur pourrait aussi vouloir l'éditeur pour modifier côté navigateur. Lance avec `-t edit` seul — le serveur sert toujours les fichiers du projet, mais aucun onglet de page de projet n'est ouvert par défaut.
- **Les applications multi-pages** où deux ou trois pages sont toujours ouvertes ensemble. Liste-les toutes dans l'indicateur.

## Quand ne pas utiliser ce schéma

- **Pour une application déployée.** Les utilisateurs en production ne lanceront pas `server.as`. Ce schéma est uniquement pour le flux de développement.
- **Quand le script ne fait pas tourner de serveur.** `browse` fonctionne tout seul, mais le cadrage serveur-comme-application n'a de sens que quand il y a des pages à servir.
- **Pour des lancements ponctuels.** Tape simplement l'URL dans le navigateur. Le schéma mérite sa complexité quand le lancement est répété.

## Modèle mental pour les agents IA

Quand on demande à une IA de créer un projet GUI avec le pack de démarrage, la séquence attendue est :

1. Générer `<projet>.html`, `<projet>-main.as`, `<projet>.json`.
2. Exécuter `python3 asdoc-check.py --write` sur tout nouveau fichier `.as`.
3. Exécuter **immédiatement** `allspeak server.as -t edit,<projet>` en arrière-plan.
4. Dire à l'utilisateur que l'application a démarré et que deux onglets devraient s'être ouverts.

L'utilisateur doit avoir le sentiment que « l'application a démarré » — pas qu'il doive assembler trois morceaux d'infrastructure pour voir ce qui vient d'être construit.
