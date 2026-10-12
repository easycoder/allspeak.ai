# Der Server als Anwendung

## Problem

Ein typisches AllSpeak-GUI-Projekt erzeugt zwei Artefakte, mit denen der Benutzer interagiert: den **Visualisierer** (`viz.html`) und eine oder mehrere Projektseiten (`<projekt>.html`). Als getrennte Dinge betrachtet heißt das: einen Entwicklungsserver in einem Terminal starten, eine URL in einem Tab öffnen und eine andere in einem zweiten Tab, und sich den Port merken — vier Schritte und drei Stücke mentalen Zustands für etwas, das konzeptionell eine laufende Sache ist.

Der einfachere Rahmen: **Der Server ist die Anwendung, und der Browser ist seine Oberfläche.**

## Das Muster

**Ein Befehl für eine Person; `server` für eine Sitzung mit mehreren Tabs.** `allspeak viz` ist die Tür:

```
allspeak viz
allspeak viz 9000
```

Er fragt die eigene `/version`-Route des Servers, ob auf diesem Port schon ein Entwicklungsserver läuft. Wenn ja, öffnet er den Visualisierer und lässt den laufenden in Ruhe; wenn nichts da ist, startet er den Server in diesem Terminal und öffnet den Visualisierer, sobald dessen Request-Handler registriert ist. Der Port ist standardmäßig 8080.

`allspeak server {port}` ist derselbe Server, ohne etwas zu öffnen — das will man, wenn man selbst mehrere Seiten öffnen möchte:

```
allspeak server
```

Die Seite des Projekts ist dann eine URL — `http://localhost:<port>/<projekt>.html` — und im Visualisierer die Schaltfläche **Launch**, die die Seite öffnet, die ein Skript mit `@app` benennt, und bei einem GUI-Projekt den Lauf aufzeichnet.

## Einen eigenen Launcher schreiben

Wenn ein Projekt einen eigenen Launcher will statt des Wortes der CLI, hat die Form vier geordnete Phasen:

1. **Die CLI-Argumente auswerten.** Über `argc` / `arg N` schleifen, den Port nehmen und die Seiten notieren, die geöffnet werden sollen.
2. **Den Server starten.** `start MyServer on port Port` nimmt den Port an, hat aber noch keinen Handler.
3. **Den Request-Handler registrieren.** `on MyServer request begin … end` setzt den Handler-PC und springt über den Rumpf hinweg.
4. **Die Seiten öffnen.** Jede URL bauen und `browse` darauf aufrufen.

Die Reihenfolge ist tragend: Phasen 3 und 4 müssen in dieser Reihenfolge stehen. Läuft `browse` vor dem Handler-Block, laufen die frisch geöffneten Seiten dem Server davon und bekommen ein 503 „Server handler not ready“, bevor der Handler installiert ist. Die Lösung ist, die Öffnungsschleife ans *Ende* des Skripts zu setzen, hinter den Block `on … request begin … end`.

```
    start Files on port Port

    on Files request
    begin
        ! ... Anfragen behandeln ...
    end

    ! Nach der Registrierung des Handlers — niemals davor.
    if PageList is not empty
    begin
        split PageList on `,`
        put 0 into PageIndex
        while PageIndex is less than the elements of PageList
        begin
            index PageList to PageIndex
            put PageList into PageName
            if PageName is not empty
            begin
                put `http://localhost:` cat Port cat `/` cat PageName cat `.html` into PageUrl
                browse PageUrl
            end
            increment PageIndex
        end
    end
```

Die Referenzimplementierung ist `server.allspeak`, das genau das für den Visualisierer tut, wenn die CLI ihm `--viz` übergibt.

## Wann das Muster seinen Platz verdient

- **GUI-Projekte**, in denen der Benutzer den Visualisierer und eine Projektseite braucht — ein Befehl, und die Seite ist eine URL oder ein Klick auf Launch entfernt.
- **CLI-Projekte**, in denen der Benutzer vielleicht auch den Visualisierer zum Bearbeiten im Browser möchte. `allspeak viz` allein genügt; der Server liefert die Projektdateien weiterhin aus.
- **Mehrseitige Anwendungen**, in denen ein eigener Launcher zwei oder drei Seiten zusammen öffnet.

## Wann es das nicht tut

- **Für eine ausgelieferte Anwendung.** Produktionsbenutzer starten kein `server.allspeak`. Das ist nur für den Entwicklungsablauf.
- **Wenn das Skript keinen Server startet.** `browse` funktioniert allein, aber der Rahmen setzt Seiten voraus, die ausgeliefert werden.
- **Für einen einmaligen Start.** Tippen Sie die URL in den Browser. Das Muster verdient seine Komplexität, wenn sich der Start wiederholt.

## Gedankenmodell für KI-Agenten

Wenn eine KI gebeten wird, mit dem Starter-Pack ein GUI-Projekt zu erstellen, ist die erwartete Reihenfolge:

1. `<projekt>.html`, `<projekt>-main.allspeak`, `<projekt>.json` erzeugen.
2. `python3 asdoc-check.py --write` auf alle neuen `.allspeak`-Dateien anwenden.
3. **Starten Sie den Server nicht selbst.** Der Benutzer hat ihn mit `allspeak viz` gestartet, bevor er Sie gestartet hat, und der Visualisierer ist bereits offen.
4. Sagen Sie dem Benutzer, dass seine Projektseite unter `http://localhost:8080/<projekt>.html` liegt, neben dem Visualisierer.

Der Benutzer soll das Gefühl haben, dass „die Anwendung gestartet ist“ — nicht, dass er drei Stücke Infrastruktur zusammensetzen muss, um zu sehen, was gerade gebaut wurde.
