# MQTT pub/sub

## Problème

Tu as besoin de messagerie temps réel, bidirectionnelle, entre un script et d'autres clients — chat, présence, télémétrie. REST est requête-réponse et uniquement pull ; MQTT est publication-abonnement et peut faire du push. Utilise MQTT quand le serveur (ou un autre client) doit te dire quelque chose *au moment où* ça arrive, pas quand tu penses à le demander.

## Le vocabulaire

> **Localisation :** le plugin MQTT n'est pas encore localisé en français. Ses mots-clés (`topic`, `init`, `mqtt`, `on mqtt …`, `send to`, `the mqtt message`, …) restent en anglais dans les exemples ci-dessous, et dans un script `language français` ils ne sont pas reconnus — utilise-les dans un script en anglais (ou ajoute la prise en charge du plugin au pack français).

Le support MQTT d'AllSpeak utilise un petit ensemble de mots-clés :

- **`topic Name`** — déclare une variable de sujet.
- **`init Topic name X qos N`** — initialise un sujet avec son nom côté broker et son niveau de QoS.
- **`mqtt …`** — ouvre un bloc de connexion à un broker.
- **`on mqtt connect`** / **`on mqtt message`** / **`on mqtt error`** — les gestionnaires d'événements.
- **`the mqtt message`** — la valeur du message le plus récemment reçu.
- **`send to Topic …`** — publie un message.

## Le bloc de connexion

Un seul bloc `mqtt` configure la connexion au broker :

```as
topic MyTopic
topic ServerTopic

init ServerTopic
    name SystemID
    qos 1

init MyTopic
    name MyID
    qos 1

mqtt
    token MqttUsername MqttPassword
    id MyID
    broker Broker
    port 443
    subscribe MyTopic
```

Le sujet souscrit délivre les messages à `on mqtt message`. Plusieurs clauses `subscribe` peuvent apparaître dans le même bloc.

## Les gestionnaires

Trois gestionnaires d'événements couvrent le cycle de vie de la connexion :

```as
on mqtt connect
begin
    set the content of Status to `Connecté au broker`
    go to AfterConnect
end

on mqtt message
begin
    put the mqtt message into Received
    ! ... répartit selon le contenu de Received ...
end

on mqtt error
begin
    alert `Échec de la connexion MQTT`
end
```

Chaque gestionnaire est un fil (voir [event-handlers-and-array-index](event-handlers-and-array-index.md)), donc le gestionnaire lui-même ne bloque pas le reste du script. Le gestionnaire de connexion s'exécute une fois après la réussite de la connexion ; le gestionnaire de messages s'exécute une fois par message entrant.

## Des charges utiles en forme de dictionnaire

MQTT transporte des chaînes, mais traite la charge utile comme un dictionnaire structuré. Le schéma canonique est `sender` / `action` / `message` :

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `action` of Received into Action
    if Action is `ping` go to HandlePing
    if Action is `login` go to HandleLogin
    if Action is `message` go to HandleChat
    print `Action inconnue : ` cat Action
end
```

Inclure le sujet de réponse de l'expéditeur permet au récepteur de répondre :

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `sender` of Received into ReplyTopic
    put property `action` of Received into Action
    ! ... traite ...
    send to ReplyTopic
        sender MyTopic
        action `ok`
        message Result
end
```

C'est le même schéma d'un dictionnaire par direction qu'utilisent les modules (voir [extracting-a-module](extracting-a-module.md)). Empaquète la charge utile chez l'expéditeur, dépaquette chez le récepteur, ne mélange pas les deux.

## Le schéma requête-réponse

Pour une requête qui attend une réponse, envoie au sujet du destinataire en renseignant `sender` avec ton propre sujet, puis attends la réponse via un drapeau :

```as
clear Replied
send to ServerTopic
    sender MyTopic
    action `query`
    message Query

while not Replied wait 100 millis
! Reply a été rempli par le gestionnaire de messages
```

Le gestionnaire de messages définit `Reply` et `Replied` quand il voit un message correspondant :

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `action` of Received into Action
    if Action is `reply`
    begin
        put property `message` of Received into Reply
        set Replied
    end
end
```

Pour les requêtes à usage unique, le schéma de drapeau sondé du multitâche coopératif suffit. Pour des cas plus riches — plusieurs requêtes concurrentes, des délais — suis les requêtes en attente grâce à un identifiant embarqué dans le dictionnaire du message.

## Le schéma serveur de chat

Une application de chat est l'exemple canonique de pub/sub. Chaque utilisateur a un sujet personnel (son identifiant unique) ; le serveur a un sujet bien connu. Les utilisateurs envoient des commandes système de chat (connexion, message-vers-salon) au sujet du serveur avec leur sujet personnel comme `sender`. Le serveur traite la commande et publie sur le sujet personnel du destinataire (pour les messages directs) ou sur un sujet de salon (pour le chat de groupe).

Le sujet système d'une installation peut être haché depuis une clé publique, de sorte que les identifiants utilisateurs sont dérivables mais pas devinables.

## Anti-motif : du travail lourd dans le gestionnaire de messages

```as
on mqtt message
begin
    put the mqtt message into Received
    ! ... 200 lignes de décodage, validation, mises à jour de l'interface ...
end
```

Le gestionnaire est un fil, donc il ne bloque pas les autres gestionnaires. Mais si les messages arrivent plus vite que le gestionnaire ne peut les traiter, tu accumules un retard. Garde les gestionnaires petits : extrais le travail vers une sous-routine étiquetée, répartis via `va à` ou mets en place une file et `bifurque à Worker`, et laisse le gestionnaire retourner rapidement.

## Anti-motif : sonder par-dessus MQTT

```as
tant que vrai début
    rest obtiens Status depuis `/api/status`
    attends 1 seconde
fin
```

Si le serveur publie déjà des mises à jour de statut sur un sujet MQTT, s'abonner à ce sujet coûte moins cher que sonder. Le push est la *raison d'être* de MQTT.

## À voir aussi

- [event-handlers-and-array-index](event-handlers-and-array-index.md) — les gestionnaires `on mqtt …` sont des fils.
- [rest-and-async](rest-and-async.md) — REST comme alternative requête-réponse.
- [picking-a-collection-shape](picking-a-collection-shape.md) — un dictionnaire par direction.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — `bifurque`, `attends`, sondage de drapeau pour les réponses.
