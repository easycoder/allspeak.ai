# MQTT pub/sub

## Problem

You need real-time, two-way messaging between a script and other clients — chat, presence, telemetry. REST is request-response and pull-only; MQTT is publish-subscribe and push-able. Use MQTT when the server (or another client) needs to tell you something *when* it happens, not when you remember to ask.

## The vocabulary

AllSpeak's MQTT support uses a small set of keywords:

- **`topic Name`** — declare a topic variable.
- **`init Topic name X qos N`** — initialise a topic with its broker-side name and QoS level.
- **`mqtt …`** — open a connection block to a broker.
- **`on mqtt connect`** / **`on mqtt message`** / **`on mqtt error`** — event handlers.
- **`the mqtt message`** — the most recently received message value.
- **`send to Topic …`** — publish a message.

## The connection block

A single `mqtt` block configures the broker connection:

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

The subscribed topic delivers messages to `on mqtt message`. Multiple `subscribe` clauses can appear in the same block.

## Handlers

Three event handlers cover the connection lifecycle:

```as
on mqtt connect
begin
    set the content of Status to `Connected to broker`
    go to AfterConnect
end

on mqtt message
begin
    put the mqtt message into Received
    ! ... dispatch on Received's contents ...
end

on mqtt error
begin
    alert `MQTT connection failed`
end
```

Each handler is a thread (see [event-handlers-and-array-index](event-handlers-and-array-index.md)), so the handler itself doesn't block the rest of the script. The connect handler runs once after the connection succeeds; the message handler runs once per incoming message.

## Dict-shaped payloads

MQTT carries strings, but treat the payload as a structured dictionary. The canonical pattern is `sender` / `action` / `message`:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `action` of Received into Action
    if Action is `ping` go to HandlePing
    if Action is `login` go to HandleLogin
    if Action is `message` go to HandleChat
    print `Unknown action: ` cat Action
end
```

Including the sender's reply topic lets the receiver respond:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `sender` of Received into ReplyTopic
    put property `action` of Received into Action
    ! ... handle ...
    send to ReplyTopic
        sender MyTopic
        action `ok`
        message Result
end
```

This is the same one-dict-per-direction pattern that modules use (see [extracting-a-module](extracting-a-module.md)). Pack the payload at the sender, unpack at the receiver, don't mix the two.

## The request-reply pattern

For a request that expects a reply, send to the recipient's topic with `sender` set to your own, then wait for the reply on a flag:

```as
clear Replied
send to ServerTopic
    sender MyTopic
    action `query`
    message Query

while not Replied wait 100 millis
! Reply has been populated by the message handler
```

The message handler sets `Reply` and `Replied` when it sees a matching message:

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

For one-shot queries the cooperative-multitasking polled-flag pattern is enough. For richer cases — multiple concurrent queries, timeouts — track outstanding requests by an ID embedded in the message dict.

## The chat-server pattern

A chat application is the canonical pub/sub example. Each user has a personal topic (their unique ID); the server has a well-known topic. Users send chat-system commands (login, message-to-room) to the server's topic with their personal topic as the `sender`. The server processes the command and publishes to the recipient's personal topic (for direct messages) or to a room topic (for group chat).

The system topic for an installation can be hashed from a public key, so user IDs are derivable but not guessable.

## Anti-pattern: heavy work in the message handler

```as
on mqtt message
begin
    put the mqtt message into Received
    ! ... 200 lines of decoding, validation, UI updates ...
end
```

The handler is a thread, so it doesn't block other handlers. But if messages arrive faster than the handler can process them, you'll build up a backlog. Keep handlers small: extract the work to a labelled subroutine, dispatch via `go to` or set a queue and `fork to Worker`, and let the handler return quickly.

## Anti-pattern: polling on top of MQTT

```as
while true begin
    rest get Status from `/api/status`
    wait 1 second
end
```

If the server already publishes status updates on an MQTT topic, subscribing to that topic is cheaper than polling. Push is the *reason* to use MQTT.

## Related

- [event-handlers-and-array-index](event-handlers-and-array-index.md) — `on mqtt …` handlers are threads.
- [rest-and-async](rest-and-async.md) — REST as the request-response alternative.
- [picking-a-collection-shape](picking-a-collection-shape.md) — one dict per direction.
- [cooperative-multitasking](../reference/cooperative-multitasking.md) — `fork`, `wait`, flag-polling for replies.
