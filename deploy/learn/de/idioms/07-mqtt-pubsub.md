# MQTT pub/sub

## Problem

Du brauchst Echtzeit-Nachrichten in beide Richtungen zwischen einem Skript und anderen Clients — Chat, Präsenz, Telemetrie. REST ist Request-Response und nur pull-fähig; MQTT ist publish-subscribe und push-fähig. Verwende MQTT, wenn dir der Server (oder ein anderer Client) etwas *dann* mitteilen soll, wenn es passiert — nicht wenn du dich daran erinnerst zu fragen.

## Das Vokabular

Die MQTT-Unterstützung von AllSpeak verwendet eine kleine Menge an Schlüsselwörtern:

> **Lokalisierung :** das MQTT-Plugin ist noch nicht ins Deutsche übersetzt. Seine Befehle bleiben in den Beispielen englisch und werden in einem `language deutsch`-Skript nicht erkannt — verwende sie in einem englischen Skript.

- **`topic Name`** — deklariert eine Topic-Variable.
- **`init Topic name X qos N`** — initialisiert ein Topic mit seinem Broker-seitigen Namen und der QoS-Stufe.
- **`mqtt …`** — öffnet einen Verbindungsblock zu einem Broker.
- **`on mqtt connect`** / **`on mqtt message`** / **`on mqtt error`** — Ereignis-Handler.
- **`the mqtt message`** — der zuletzt empfangene Nachrichtenwert.
- **`send to Topic …`** — veröffentlicht eine Nachricht.

## Der Verbindungsblock

Ein einziger `mqtt`-Block konfiguriert die Broker-Verbindung:

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

Das abonnierte Topic liefert Nachrichten an `on mqtt message`. Im selben Block können mehrere `subscribe`-Klauseln stehen.

## Ereignis-Handler

Drei Ereignis-Handler decken den Lebenszyklus der Verbindung ab:

```as
on mqtt connect
begin
    set the content of Status to `Mit Broker verbunden`
    go to AfterConnect
end

on mqtt message
begin
    put the mqtt message into Received
    ! ... nach Inhalt von Received verzweigen ...
end

on mqtt error
begin
    alert `MQTT-Verbindung fehlgeschlagen`
end
```

Jeder Handler ist ein Thread (siehe [Ereignishandler und Array-Index](event-handlers-and-array-index.md)), blockiert also den Rest des Skripts nicht. Der Verbindungs-Handler läuft einmal, nachdem die Verbindung hergestellt wurde; der Nachrichten-Handler läuft einmal pro eingehender Nachricht.

## Dict-förmige Nutzdaten

MQTT transportiert Zeichenketten, aber behandle die Nutzdaten als strukturiertes Wörterbuch. Das kanonische Muster ist `sender` / `action` / `message`:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `action` of Received into Action
    if Action is `ping` go to HandlePing
    if Action is `login` go to HandleLogin
    if Action is `message` go to HandleChat
    print `Unbekannte Aktion: ` cat Action
end
```

Wenn der Sender sein Antwort-Topic mitliefert, kann der Empfänger antworten:

```as
on mqtt message
begin
    put the mqtt message into Received
    put property `sender` of Received into ReplyTopic
    put property `action` of Received into Action
    ! ... verarbeiten ...
    send to ReplyTopic
        sender MyTopic
        action `ok`
        message Result
end
```

Das ist dasselbe Ein-Dict-pro-Richtung-Muster, das auch Module verwenden (siehe [Ein Modul extrahieren](extracting-a-module.md)). Verpacke die Nutzdaten beim Sender, entpacke sie beim Empfänger, und vermische die beiden nicht.

## Das Anfrage-Antwort-Muster

Für eine Anfrage, die eine Antwort erwartet, sende an das Topic des Empfängers, mit `sender` auf dein eigenes Topic gesetzt, und warte dann auf einem Flag auf die Antwort:

```as
clear Replied
send to ServerTopic
    sender MyTopic
    action `query`
    message Query

while not Replied wait 100 millis
! Reply wurde vom Nachrichten-Handler befüllt
```

Der Nachrichten-Handler setzt `Reply` und `Replied`, wenn er eine passende Nachricht sieht:

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

Für einmalige Anfragen reicht das Flag-Polling-Muster des kooperativen Multitasking. Für komplexere Fälle — mehrere gleichzeitige Anfragen, Zeitüberschreitungen — verfolge offene Anfragen über eine ID, die im Nachrichten-Dict eingebettet ist.

## Das Chat-Server-Muster

Eine Chat-Anwendung ist das kanonische pub/sub-Beispiel. Jeder Benutzer hat ein persönliches Topic (seine eindeutige ID); der Server hat ein bekanntes Topic. Benutzer senden Chat-Systembefehle (login, message-to-room) an das Topic des Servers, mit ihrem persönlichen Topic als `sender`. Der Server verarbeitet den Befehl und veröffentlicht auf dem persönlichen Topic des Empfängers (bei Direktnachrichten) oder auf einem Raum-Topic (bei Gruppenchat).

Das System-Topic einer Installation kann aus einem öffentlichen Schlüssel gehasht werden, sodass Benutzer-IDs ableitbar, aber nicht erratbar sind.

## Anti-Muster: schwere Arbeit im Nachrichten-Handler

```as
on mqtt message
begin
    put the mqtt message into Received
    ! ... 200 Zeilen Dekodierung, Validierung, UI-Updates ...
end
```

Der Handler ist ein Thread, blockiert also keine anderen Handler. Aber wenn Nachrichten schneller eintreffen, als der Handler sie verarbeiten kann, baut sich ein Rückstau auf. Halte Handler klein: lagere die Arbeit in eine markierte Unterroutine aus, verzweige per `go to` oder setze eine Warteschlange auf und `fork to Worker`, und lass den Handler schnell zurückkehren.

## Anti-Muster: Polling über MQTT

```as
while true begin
    rest get Status from `/api/status`
    wait 1 second
end
```

Wenn der Server Status-Updates bereits auf einem MQTT-Topic veröffentlicht, ist das Abonnieren dieses Topics billiger als Polling. Push ist der *Grund*, MQTT zu verwenden.

## Siehe auch

- [Ereignishandler und Array-Index](event-handlers-and-array-index.md) — `on mqtt …`-Handler sind Threads.
- [REST und asynchron](rest-and-async.md) — REST als Request-Response-Alternative.
- [Eine Sammlungsform wählen](picking-a-collection-shape.md) — ein Dict pro Richtung.
- [Kooperatives Multitasking](../reference/cooperative-multitasking.md) — `zweige`, `warte`, Flag-Polling für Antworten.
