# Le serveur comme application

## Problème

Un projet GUI AllSpeak typique produit deux artefacts avec lesquels l'utilisateur interagit : le **visualiseur** (`viz.html`) et une ou plusieurs pages de projet (`<projet>.html`). Considérés comme des choses séparées, y arriver demande de démarrer un serveur de développement dans un terminal, d'ouvrir une URL dans un onglet et une autre dans un second onglet, et de se souvenir du port — quatre étapes et trois morceaux d'état mental pour ce qui est, conceptuellement, une seule chose en cours d'exécution.

Le cadre plus simple : **le serveur est l'application, et le navigateur est son interface.**

## Le schéma

**Une commande pour une personne ; `server` pour une session à plusieurs onglets.** `allspeak viz` est la porte d'entrée :

```
allspeak viz
allspeak viz 9000
```

Elle demande à la route `/version` du serveur — sa propre route — si un serveur de développement est déjà sur ce port. S'il y en a un, elle ouvre le visualiseur et laisse celui qui tourne tranquille ; s'il n'y a rien, elle démarre le serveur dans ce terminal et ouvre le visualiseur dès que son gestionnaire de requêtes est enregistré. Le port par défaut est 8080.

`allspeak server {port}` est le même serveur sans rien ouvrir — ce qu'on veut quand on compte ouvrir plusieurs pages soi-même :

```
allspeak server
```

La page du projet est alors une URL — `http://localhost:<port>/<projet>.html` — et, dans le visualiseur, le bouton **Launch**, qui ouvre la page qu'un script nomme avec `@app` et, pour un projet GUI, enregistre l'exécution.

## Écrire son propre lanceur

Si un projet veut son propre lanceur plutôt que le mot de la CLI, la forme est en quatre phases ordonnées :

1. **Analyse les arguments de la ligne de commande.** Boucle sur `argc` / `arg N`, prends le port et note les pages à ouvrir.
2. **Démarre le serveur.** `start MyServer on port Port` accepte le port mais n'a pas encore de gestionnaire.
3. **Enregistre le gestionnaire de requêtes.** `on MyServer request début … fin` positionne le compteur de programme du gestionnaire et saute au-delà du corps.
4. **Ouvre les pages.** Construit chaque URL et appelle `browse` dessus.

L'ordre est déterminant : les phases 3 et 4 doivent être dans cet ordre. Si `browse` s'exécute avant le bloc du gestionnaire, les pages fraîchement ouvertes font la course avec le serveur et se prennent un 503 « Server handler not ready » avant que le gestionnaire soit installé. La solution est de placer la boucle d'ouverture à la *fin* du script, après le bloc `on … request début … fin`.

```
    start Files on port Port

    on Files request
    début
        ! ... gérer les requêtes ...
    fin

    ! Après l'enregistrement du gestionnaire — jamais avant.
    if PageList is not empty
    début
        split PageList on `,`
        put 0 into PageIndex
        while PageIndex is less than the elements of PageList
        début
            index PageList to PageIndex
            put PageList into PageName
            if PageName is not empty
            début
                put `http://localhost:` cat Port cat `/` cat PageName cat `.html` into PageUrl
                browse PageUrl
            fin
            increment PageIndex
        fin
    fin
```

L'implémentation de référence est `server.allspeak`, qui fait exactement cela pour le visualiseur quand la CLI lui passe `--viz`.

## Quand le schéma gagne sa place

- **Projets GUI**, où l'utilisateur a besoin du visualiseur et d'une page de projet — une commande, et la page est à une URL ou à un clic sur Launch.
- **Projets CLI** où l'utilisateur peut aussi vouloir le visualiseur pour éditer côté navigateur. `allspeak viz` seul suffit ; le serveur sert toujours les fichiers du projet.
- **Applications multi-pages**, où un lanceur à soi ouvre deux ou trois pages ensemble.

## Quand il ne la gagne pas

- **Pour une application déployée.** Les utilisateurs en production ne lanceront pas `server.allspeak`. C'est pour le flux de développement uniquement.
- **Quand le script ne lance aucun serveur.** `browse` marche tout seul, mais le cadre suppose des pages à servir.
- **Pour un lancement ponctuel.** Tape l'URL dans le navigateur. Le schéma gagne sa complexité quand le lancement se répète.

## Modèle mental pour les agents IA

Quand on demande à une IA de créer un projet GUI avec le pack de démarrage, la séquence attendue est :

1. Générer `<projet>.html`, `<projet>-main.allspeak`, `<projet>.json`.
2. Exécuter `python3 asdoc-check.py --write` sur tout nouveau fichier `.allspeak`.
3. **Ne démarre pas le serveur toi-même.** L'utilisateur l'a démarré avec `allspeak viz` avant de te lancer, et le visualiseur est déjà ouvert.
4. Dis à l'utilisateur que la page de son projet est à `http://localhost:8080/<projet>.html`, à côté du visualiseur.

L'utilisateur doit sentir que « l'application a démarré » — pas qu'il doit assembler trois morceaux d'infrastructure pour voir ce qui vient d'être construit.
