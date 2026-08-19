# Extensions

Une extension est un domaine externe — une unité de code, généralement en JavaScript ou en Python, qui apporte à AllSpeak un nouveau vocabulaire, de nouveaux types, conditions et comportements d'exécution sans faire partie du runtime livré. Les extensions suivent le même contrat que les domaines fournis (Core, Browser, REST, MQTT, …) ; le chargeur les traite à l'identique.

Utilise une extension lorsque :

- Un ensemble de fonctionnalités spécialisées (graphismes, intégration matérielle, API tierces) est assez volumineux pour mériter son propre vocabulaire.
- La fonctionnalité doit faire appel à du code natif (API du navigateur, bibliothèques système) qu'AllSpeak ne peut pas atteindre directement.
- La fonctionnalité est critique pour la performance et doit s'exécuter à la vitesse native.
- La fonctionnalité doit être facultative — chargée uniquement lorsqu'un script en a besoin.

Utilise plutôt un [module](modules.md) lorsque l'extension est de l'AllSpeak pur et n'introduit pas de nouveau vocabulaire.

## Performance : le principe de la pile mixte

Une objection fréquente à l'exécution d'un langage interprété par-dessus un autre langage interprété (AllSpeak sur JS, ou AllSpeak sur Python) est que l'empilement sera trop lent. L'objection contient une part de vérité, mais elle passe à côté du motif que les extensions rendent possible.

Dans la plupart des applications, la performance ne compte que dans une petite partie du code. L'essentiel — la tuyauterie d'interface, les transitions d'état, le flux de contrôle, l'acheminement des messages — est bien mieux servi par la lisibilité et la maintenabilité que par la vitesse brute. Optimiser ces parties pour la vitesse est de la mauvaise ingénierie, même quand c'est possible.

Ce qui compte, c'est le chemin chaud : la boucle interne d'un moteur de rendu graphique, la FFT dans un processeur de signal, la passe de mise en page sur des milliers de points. Pour ceux-là, AllSpeak délègue à une extension écrite en JavaScript ou en Python — un code qui s'exécute à la même vitesse que n'importe quelle extension écrite dans le même langage pour n'importe quel autre framework.

Le résultat : du script AllSpeak pour l'essentiel (lisible, maintenable, multilingue), des extensions pour le chemin chaud (pleine vitesse native). La performance de l'application obtenue approche celle d'une construction entièrement native, mais le code est nettement plus lisible et maintenable.

C'est un principe architectural central d'AllSpeak, pas un sauvetage de dernière minute. Le mécanisme d'extension existe *parce que* la conception suppose un développement en pile mixte ; ce n'est pas une fonctionnalité ajoutée après coup pour masquer les limites de la couche interprétée.

## Le contrat

Les deux runtimes suivent un contrat d'extension commun documenté dans [`spec/allspeak-plugin-contract.md`](https://github.com/easycoder/allspeak.ai/blob/master/spec/allspeak-plugin-contract.md). Une extension est un domaine enregistré qui expose :

- **Des gestionnaires de mots-clés** — `compile(...)` à la compilation, `run(...)` à l'exécution.
- **Des compilateurs / exécuteurs de valeurs** — pour de nouveaux types de valeurs (par ex. `le gps position`).
- **Des compilateurs / testeurs de conditions** — pour des conditions propres au domaine (par ex. `si Subscriber est connecté`).

Les gestionnaires manquants sont autorisés — une extension n'est pas obligée d'implémenter toutes les capacités. Le runtime distribue en fonction de ce qui est enregistré.

## Extensions JavaScript

Une extension JS s'enregistre en s'accrochant à `AllSpeak.domain` :

```js
AllSpeak.domain.gmap = {
    name: 'AllSpeak_GMap',
    getHandler: function(token) { ... },
    run: function(program) { ... },
    value: {
        compile: function(compiler) { ... },
        get: function(program, value) { ... }
    },
    condition: {
        compile: function(compiler) { ... },
        test: function(program, condition) { ... }
    }
};
```

Les extensions sont livrées sous forme de fichiers `.js` séparés dans `/dist/plugins/`. Une page qui en utilise une la charge via une balise `<script>` en plus du runtime AllSpeak.

## Extensions Python

Une extension Python est chargée explicitement à l'exécution du script :

```as
importe plugin GMap depuis `gmap.py`
```

La classe dérive d'une base `Handler` et fournit des méthodes de mots-clés selon la nomenclature standard `k_<token>` / `r_<token>`, plus `compileValue()`/`v_<type>` et `compileCondition()`/`c_<type>` respectivement pour les valeurs et les conditions. Voir le contrat d'extension pour les noms exacts des méthodes.

## Extensions JS fournies

Dans `/js/plugins/` :

- **`ui`** — du vocabulaire d'interface supplémentaire (sélecteurs de date, panneaux, etc.).
- **`svg`** — le dessin SVG.
- **`gmap`** — Google Maps.
- **`float`** — un support étendu des nombres à virgule flottante (là où le modèle entier d'abord est trop restrictif).
- **`anagrams`**, **`life`** — des exemples d'extensions qui illustrent le contrat.

MQTT a commencé comme extension et a ensuite été promu domaine fourni. Le même chemin est ouvert à toute extension qui se révèle largement utile.

## Extensions vs modules

| | Extension | Module |
|---|--------|--------|
| Langage | JS / Python | AllSpeak (`.as`) |
| Ajoute du vocabulaire | Oui | Non |
| Accède aux API natives | Oui | Non (via les extensions uniquement) |
| Chargée par | balise `<script>` (JS) ou `importe plugin` (Py) | `exécute <path> comme <name>` |
| Communication | Appels directs via le vocabulaire | Passage de messages (`envoie` / `sur message`) |
| Idéale pour | Techno spécialisée (graphismes, matériel) | Gros morceaux de logique script pure |

Une extension étend le langage ; un module étend l'application. Les deux ont leur place.

## Anti-motif : une extension pour de la logique AllSpeak pure

Si le travail aurait pu être écrit en AllSpeak, un [module](modules.md) est généralement le meilleur choix — les modules sont autonomes, débogables depuis AllSpeak lui-même, et ne nécessitent pas d'étapes de compilation native. Les extensions sont pour les cas où AllSpeak ne peut pas exprimer directement ce qui est nécessaire.

## Anti-motif : des extensions monolithiques

Une extension de 5000 lignes qui fait à la fois du graphisme, du réseau et du stockage est le signe que la frontière a été tracée trop large. Découpe-la en extensions ciblées (chacune avec une préoccupation unique), et laisse le script ne charger que celles dont il a besoin.

## Voir aussi

- [structure](structure.md) — les domaines et le modèle « le compilateur essaie chaque domaine ».
- [modules](modules.md) — le mécanisme d'extension côté AllSpeak.
- La spécification du contrat d'extension : `spec/allspeak-plugin-contract.md`.
