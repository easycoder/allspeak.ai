# REST et asynchrone

## Problème

Tu as besoin de parler à un endpoint HTTP : récupérer un blob de configuration, poster un formulaire, tirer une liste d'enregistrements. L'appel peut échouer ; le script doit gérer ça, et doit garder le reste de l'application réactif pendant l'attente.

## Les formes de base

```as
rest obtiens Result depuis `/api/users` ou va à FetchFailed
rest poste Payload à `/api/users` ou va à PostFailed
rest put Payload à `/api/users/42` ou va à PutFailed
rest delete depuis `/api/users/42` ou va à DeleteFailed
```

Les quatre acceptent une clause d'échec facultative. Le corps d'une réponse GET va dans une variable (le premier argument) ; le corps d'un POST ou d'un PUT est une valeur qui est envoyée.

`Result` arrive typiquement comme une chaîne en forme de JSON, prête à être inspectée avec les accès `propriété`, `élément` ou `entrée` (voir [collections](../reference/collections.md)).

## Gérer l'échec

Deux clauses, deux intentions — voir [errors-and-recovery](../reference/errors-and-recovery.md) :

- `ou` pour « signaler et abandonner » — le fil s'arrête après le corps de la clause.
- `on failure` pour « substituer et continuer » — l'exécution reprend.

```as
rest obtiens Config depuis `/api/config`
    ou début
        imprime `Serveur injoignable : ` cat l'erreur
        vasous à UseLocalConfig
    fin
! jamais atteint si l'appel a échoué
```

```as
rest obtiens Config depuis `/api/config`
    on failure définis Config à `{}`
imprime Config       ! toujours atteint ; Config est soit récupérée, soit vide
```

## Céder la main en attendant

`rest obtiens` et ses semblables bloquent le fil courant jusqu'à l'arrivée de la réponse, mais le runtime continue de distribuer les autres fils. L'interface reste réactive, les gestionnaires d'événements se déclenchent toujours, les fils bifurqués tournent toujours.

Si tu as besoin de travailler en parallèle d'une longue récupération — montrer un spinner, animer quelque chose — lance un fil séparé avant l'appel :

```as
bifurque à Spinner
rest obtiens Data depuis `/api/slow-endpoint` ou va à FetchFailed
efface Spinning
! ... utilise Data ...

Spinner:
    définis Spinning
    tant que Spinning début
        ! ... avance l'image du spinner ...
        attends 50 millis
    fin
    arrête
```

Le fil principal se bloque sur `rest obtiens` ; le fil du spinner continue de tourner parce que le runtime lui donne son tour à chaque `attends`. Quand la réponse arrive, le fil principal reprend et efface le drapeau ; le spinner le remarque à son prochain `attends` et s'arrête.

## Itération côté serveur ou côté script

Quand tu récupères une collection, préfère laisser le serveur filtrer et paginer quand c'est possible. Un script qui fait :

```as
rest obtiens All depuis `/api/items` ou arrête
! ... puis boucle sur All pour retenir les 5 que l'utilisateur veut vraiment
```

force le serveur à tout envoyer et le réseau à tout transporter. Si l'API supporte des paramètres de requête :

```as
rest obtiens Subset depuis `/api/items?limit=5&category=Books` ou arrête
```

Le principe : fais le travail là où vivent les données. N'utilise l'itération côté script que quand le serveur ne peut pas aider.

## Envoyer un dictionnaire

Construis la charge utile comme une variable en forme de JSON et passe-la à `rest poste` :

```as
variable Payload
définis Payload à objet
définis propriété `name` de Payload à NameField
définis propriété `email` de Payload à EmailField

rest poste Payload à `/api/users`
    ou début
        imprime `Échec de l'inscription : ` cat l'erreur
        arrête
    fin
```

Le runtime sérialise la charge utile en JSON pour la transmission. Voir [picking-a-collection-shape](picking-a-collection-shape.md) pour la règle du « un dictionnaire par direction ».

## Anti-motif : sonder sans céder la main

```as
tant que pas Ready début
    rest obtiens Status depuis `/api/status` ou arrête
    ! ... vérifie Status ...
fin
```

Ça martèle le serveur à chaque itération de la boucle. Ajoute un `attends` entre les vérifications pour limiter la cadence :

```as
tant que pas Ready début
    rest obtiens Status depuis `/api/status` ou arrête
    ! ... vérifie Status ...
    attends 1 seconde
fin
```

Pour des attentes plus longues, préfère le push côté serveur (WebSocket, abonnement MQTT, événements envoyés par le serveur) au sondage — voir [mqtt-pubsub](mqtt-pubsub.md) pour le schéma de push canonique d'AllSpeak.

## Anti-motif : échec silencieux sur les chargements critiques

```as
rest obtiens Config depuis `/config.json` on failure définis Config à `{}`
! ... le script continue avec une config vide ...
```

Si Config est critique, `on failure définis à vide` laisse le script tourner avec des hypothèses cassées partout en aval. Utilise `ou` et abandonne, ou `on failure` plus un mode dégradé clairement journalisé. Ne dissimule pas le problème.

## À voir aussi

- [errors-and-recovery](../reference/errors-and-recovery.md) — `ou` contre `on failure`.
- [collections](../reference/collections.md) — les charges utiles en forme de JSON.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — `bifurque` et `attends`.
- [mqtt-pubsub](mqtt-pubsub.md) — le push plutôt que le sondage.
