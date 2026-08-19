# MQTT pub/sub

## Problema

Ti serve messaggistica in tempo reale, bidirezionale, tra uno script e altri client — chat, presenza, telemetria. REST è richiesta/risposta e solo pull; MQTT è publish-subscribe e push. Usa MQTT quando il server (o un altro client) deve dirti qualcosa *nel momento* in cui accade, non quando ti ricordi di chiederlo.

## Il vocabolario

Il supporto MQTT di AllSpeak usa un piccolo insieme di parole chiave:

- **`topic Name`** — dichiara una variabile di argomento.
- **`init Topic name X qos N`** — inizializza un argomento con il suo nome lato broker e il livello QoS.
- **`mqtt …`** — apre un blocco di connessione verso un broker.
- **`on mqtt connect`** / **`on mqtt message`** / **`on mqtt error`** — i gestori di eventi.
- **`the mqtt message`** — il valore del messaggio ricevuto più di recente.
- **`send to Topic …`** — pubblica un messaggio.

> **Localizzazione :** il plugin MQTT non è ancora localizzato in italiano. I suoi comandi restano in inglese negli esempi, e in uno script `language italiano` non vengono riconosciuti — usali in uno script in inglese.

## Il blocco di connessione

Un singolo blocco `mqtt` configura la connessione al broker:

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

L'argomento sottoscritto consegna i messaggi a `on mqtt message`. Nello stesso blocco possono comparire più clausole `subscribe`.

## I gestori

Tre gestori di eventi coprono il ciclo di vita della connessione:

```as
on mqtt connect
begin
    set the content of Status to `Connesso al broker`
    go to AfterConnect
end

on mqtt message
begin
    put the mqtt message into Received
    ! ... smista in base al contenuto di Received ...
end

on mqtt error
begin
    alert `Connessione MQTT fallita`
end
```

Ogni gestore è un thread (vedi [gestori di eventi e indice di array](event-handlers-and-array-index.md)), quindi il gestore di per sé non blocca il resto dello script. Il gestore di connessione gira una volta dopo che la connessione è riuscita; il gestore dei messaggi gira una volta per ogni messaggio in arrivo.

## Payload a forma di dict

MQTT trasporta stringhe, ma tratta il payload come un dizionario strutturato. Il pattern canonico è `sender` / `action` / `message`:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `action` of Received into Action
    if Action is `ping` go to HandlePing
    if Action is `login` go to HandleLogin
    if Action is `message` go to HandleChat
    print `Azione sconosciuta: ` cat Action
end
```

Includere l'argomento di risposta del mittente permette al ricevente di rispondere:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `sender` of Received into ReplyTopic
    put property `action` of Received into Action
    ! ... gestisci ...
    send to ReplyTopic
        sender MyTopic
        action `ok`
        message Result
end
```

È lo stesso pattern un-dict-per-direzione che usano i moduli (vedi [estrarre un modulo](extracting-a-module.md)). Impacchetta il payload lato mittente, spacchettalo lato ricevente, non mescolare i due.

## Il pattern richiesta/risposta

Per una richiesta che si aspetta una risposta, invia all'argomento del destinatario con `sender` impostato sul tuo, poi attendi la risposta su un flag:

```as
clear Replied
send to ServerTopic
    sender MyTopic
    action `query`
    message Query

while not Replied wait 100 millis
! Reply è stato riempito dal gestore dei messaggi
```

Il gestore dei messaggi imposta `Reply` e `Replied` quando vede un messaggio corrispondente:

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

Per le query monouso basta il pattern del flag sondato del multitasking cooperativo. Per casi più ricchi — più query concorrenti, timeout — tieni traccia delle richieste in sospeso con un ID incorporato nel dict del messaggio.

## Il pattern chat-server

Un'applicazione di chat è l'esempio canonico di pub/sub. Ogni utente ha un argomento personale (il proprio ID univoco); il server ha un argomento ben noto. Gli utenti inviano i comandi di sistema della chat (login, message-to-room) all'argomento del server con il loro argomento personale come `sender`. Il server elabora il comando e pubblica sull'argomento personale del destinatario (per i messaggi diretti) o su un argomento di stanza (per la chat di gruppo).

L'argomento di sistema per un'installazione può essere ricavato con un hash da una chiave pubblica, così gli ID utente sono derivabili ma non indovinabili.

## Anti-pattern: lavoro pesante nel gestore dei messaggi

```as
on mqtt message
begin
    put the mqtt message into Received
    ! ... 200 righe di decodifica, validazione, aggiornamenti dell'interfaccia ...
end
```

Il gestore è un thread, quindi non blocca gli altri gestori. Ma se i messaggi arrivano più velocemente di quanto il gestore riesca a elaborarli, si accumula un arretrato. Tieni i gestori piccoli: estrai il lavoro in una subroutine etichettata, smista con `go to` oppure imposta una coda e `fork to Worker`, e lascia che il gestore ritorni in fretta.

## Anti-pattern: polling sopra MQTT

```as
while true begin
    rest get Status from `/api/status`
    wait 1 second
end
```

Se il server pubblica già aggiornamenti di stato su un argomento MQTT, sottoscrivere quell'argomento costa meno del polling. La push è il *motivo* per usare MQTT.

## Correlati

- [gestori di eventi e indice di array](event-handlers-and-array-index.md) — i gestori `on mqtt …` sono thread.
- [REST e asincrono](rest-and-async.md) — REST come alternativa richiesta/risposta.
- [scegliere la forma di una raccolta](picking-a-collection-shape.md) — un dict per direzione.
- [multitasking cooperativo](../reference/cooperative-multitasking.md) — `biforca`, `attendi`, sondaggio dei flag per le risposte.
