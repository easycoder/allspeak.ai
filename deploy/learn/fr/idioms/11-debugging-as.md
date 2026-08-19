# Déboguer .as

## Problème

Un script ne fait pas ce que tu attends — une valeur est fausse, un gestionnaire ne se déclenche pas, un fil d'exécution affame le runtime. Tu as besoin de visibilité sur ce qui se passe réellement, et de reproduire le problème assez fiablement pour le corriger.

## Les outils du quotidien

### `imprime` et `journalise`

Écrivent une valeur dans le journal du runtime. Les deux mots-clés font la même chose — `journalise` se lit mieux quand tu suis le déroulement du programme, `imprime` se lit mieux quand tu montres un résultat :

```as
imprime `Compteur : ` cat Counter
journalise `Entrée dans MessageHandler avec ` cat le mqtt message
```

Le journal apparaît dans la console du navigateur (JS) ou sur la sortie standard (Python). Utilise-les librement pendant le développement ; supprime-les ou protège-les par un indicateur en production.

### Journalisation conditionnelle via l'indicateur `traçage`

Le runtime a un indicateur de trace global, testé avec la condition `traçage` :

```as
si traçage journalise `Entrée dans l'état Idle`
```

Quand le traçage est actif, la journalisation se déclenche ; sinon, l'instruction est sans effet (elle est quand même évaluée — il y a un petit coût). Utile pour les instructions de journalisation que tu veux garder dans le code mais qui ne doivent se déclencher que pendant le diagnostic.

### `debug` et ses amis

`debug step` journalise chaque ligne au moment où le runtime l'atteint — pratique quand tu veux trouver où les choses ont mal tourné. Les suffixes `step` et `stop` restent en anglais (le pack annonce `debug pas` / `debug arrête`, mais le moteur ne les reconnaît pas encore) :

```as
debug step
vasous à ComplicatedRoutine
```

`debug stop` annule le pas à pas. `debug breakpoint` marque un endroit où le débogueur des outils de développement du navigateur peut s'arrêter dans la source JS sous-jacente. Le mot-clé `debug` a d'autres modes qui vont et viennent avec les versions du moteur ; traite les formes documentées comme le sous-ensemble stable et vérifie l'implémentation actuelle pour tout ce qui est plus exotique.

### `factice`

Une instruction sans effet. Son but est de te donner un endroit connu dans le JS/Python compilé ou en cours d'exécution où poser un point d'arrêt natif, juste avant un problème suspecté :

```as
factice
imprime Result        ! le débogueur JS/Python peut s'arrêter sur la ligne ci-dessus
```

Quand le runtime atteint `factice`, le débogueur du navigateur (ou de Python) s'arrête si un point d'arrêt est posé sur le gestionnaire de factice, te laissant inspecter l'état du runtime juste avant l'exécution de l'instruction suivante.

### Le traceur

Le panneau du traceur montre les événements runtime récents. Active-le depuis le script :

```as
définis les lignes traceur à 10
```

Le Codex a une page dédiée au traceur ; consulte-la pour l'ensemble complet des options.

## Une méthode de débogage

Lente mais fiable :

1. **Énonce ce que tu attends** dans un commentaire près de l'endroit où le bug est suspecté.
2. **Ajoute des instructions `imprime` ou `journalise`** aux points de retournement pertinents : le début d'un gestionnaire, l'entrée dans une sous-routine, la sortie d'une boucle. Imprime les valeurs qui devraient correspondre à ton attente.
3. **Exécute et lis le journal.** Où la réalité diverge-t-elle de l'attente ?
4. **Resserre l'écart.** Rapproche les impressions jusqu'à isoler l'instruction qui produit la mauvaise valeur.
5. **Corrige.** Puis retire les impressions, ou protège-les avec `si traçage`.

Ça force une réflexion explicite et produit une trace écrite que tu peux relire. Le débogueur de l'EDI est plus rapide quand tu peux isoler le bug sur un seul fil ; le journal est plus fiable pour les problèmes inter-fils, où la pause fausse le minutage.

## Reproduire dans `conformance/`

`/conformance/` contient des scripts qui exercent des comportements précis du moteur. Quand un bug semble être dans le moteur (pas dans ton script), le réduire à un script `conformance/` minimal :

- Force un énoncé précis du comportement défaillant.
- Donne aux mainteneurs du moteur quelque chose qu'ils peuvent exécuter.
- Devient un test de régression une fois corrigé.

Un bon script de conformité est petit (une seule page d'écran), autonome (aucune ressource externe) et nommé d'après ce qu'il teste.

## Anti-schéma : modifier sans lire le journal

Il est tentant de bricoler le code jusqu'à ce que le symptôme disparaisse. Le bug se déplace généralement au lieu de disparaître. Lis le journal, trouve la divergence, puis modifie exactement ce qui produit la mauvaise valeur.

## Anti-schéma : `imprime` dans des boucles serrées

```as
tant que N est inférieur à 10000 début
    imprime N
    ! ... travail ...
    ajoute 1 à N
fin
```

Dix mille lignes de journal noient le signal. Échantillonne plutôt :

```as
tant que N est inférieur à 10000 début
    si N modulo 100 est 0 imprime `Atteint ` cat N
    ! ... travail ...
    ajoute 1 à N
fin
```

Ou utilise le traceur, qui montre les événements récents et jette les anciens.

## Anti-schéma : laisser les journaux de production actifs

`imprime` et `journalise` s'exécutent toujours. Une fois le bug corrigé, supprime l'instruction ou enveloppe-la avec `si traçage`. Sinon, la console de production se remplit de bruit que le prochain débogage devra traverser.

## À voir aussi

- [control-flow](../reference/control-flow.md) — `arrête`, `vasous`, où placer les entrées de débogage.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — le traceur montre l'entrelacement des fils.
- [working-with-ai](working-with-ai.md) — quand une erreur de l'IA est le bug.
