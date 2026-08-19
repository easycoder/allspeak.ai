# Der Server als Anwendung

## Problem

Ein typisches AllSpeak-GUI-Projekt erzeugt zwei Artefakte, mit denen der Benutzer interagiert: einen browserbasierten Editor (`edit.html`) und eine oder mehrere Projektseiten (`<projekt>.html`). Als getrennte Artefakte behandelt, muss der Benutzer in einem Terminal einen Dev-Server starten, die Editor-URL in einem Tab öffnen, die Projekt-URL in einem anderen Tab öffnen und sich den Port merken. Das sind vier Schritte und drei Teile mentalen Zustands für etwas, das konzeptionell eine einzige laufende Sache ist.

Der einfachere Rahmen: **der Server ist die Anwendung, und die Browser-Tabs sind seine Oberfläche.** Der Benutzer führt einen Befehl aus; die Tabs öffnen sich von selbst; den Server zu schließen schließt die App.

## Das Muster

`server.as` akzeptiert ein `-t`-/`--tabs`-Flag, dessen Wert eine kommaseparierte Liste von Seitennamen ist (ohne `.html`):

```
allspeak server.as -t edit,<projekt>
allspeak server.as --tabs edit,<projekt> 8080
```

Für jeden Namen baut der Server `http://localhost:<port>/<name>.html` und öffnet ihn mit [`browse`](../reference/17-dev-environment.md#browse) im Standard-Browser des Benutzers. Der Port ist standardmäßig 8080 und darf vor oder nach dem Flag stehen.

Die Launcher-Konvention in den Starter-Packs ist, diesen Befehl im Hintergrund auszuführen, sobald die GUI-Gerüstdateien existieren, damit der Benutzer eine einzige App entstehen sieht statt drei getrennter Schritte.

## Aufbau eines Startskripts

Ein Startskript, das dieses Muster nutzt, hat vier geordnete Phasen:

1. **Die CLI-Argumente parsen.** Über `argc` / `arg N` iterieren, das Flag erkennen, alles andere als Port behandeln.
2. **Den Server starten.** `start MyServer on port Port` akzeptiert den Port, hat aber noch keinen Handler.
3. **Den Request-Handler registrieren.** `on MyServer request begin … end` setzt den Befehlszeiger des Handlers und springt über den Rumpf hinweg.
4. **Die Tabs öffnen.** Die kommaseparierte Liste aufteilen, jede URL bauen und `browse` darauf aufrufen.

Die Reihenfolge ist tragend: Phase 3 und 4 müssen in dieser Reihenfolge stehen. Wenn `browse` vor dem Handler-Block läuft, wetteifern die frisch geöffneten Tabs mit dem Server und laufen in ein 503 „Server handler not ready", bevor der Handler installiert ist. Die Lösung ist, die Schleife zum Öffnen der Tabs ans *Ende* des Skripts zu setzen, nach dem `on … request begin … end`-Block.

```
    start Files on port Port

    on Files request
    beginn
        ! ... Anfragen bearbeiten ...
    ende

    ! Nach der Registrierung des Handlers — niemals davor.
    wenn TabList ist nicht leer
    beginn
        trenne TabList bei `,`
        lege 0 in TabIndex
        solange TabIndex ist kleiner als die elemente von TabList
        beginn
            indexiere TabList zu TabIndex
            lege TabList in TabName
            wenn TabName ist nicht leer
            beginn
                lege `http://localhost:` cat Port cat `/` cat TabName cat `.html` in TabUrl
                browse TabUrl
            ende
            increment TabIndex
        ende
    ende
```

Die vollständige Referenzimplementierung ist `server.as` in den Starter-Packs.

## Wann du dieses Muster verwendest

- **GUI-Projekte**, bei denen der Benutzer sowohl den Editor als auch eine Projektseite geöffnet haben muss. Der Standard im `CLAUDE.md` der Starter-Packs ist der Start mit `-t edit,<projekt>`.
- **CLI-Projekte**, bei denen der Benutzer den Editor vielleicht auch für browserbasierte Bearbeitung nutzen will. Starte nur mit `-t edit` — der Server bedient die Projektdateien weiterhin, aber standardmäßig wird kein Projekt-Tab geöffnet.
- **Mehrseitige Apps**, bei denen zwei oder drei Seiten immer zusammen geöffnet werden. Liste sie alle im Flag auf.

## Wann du dieses Muster *nicht* verwendest

- **Für eine deployed App.** Produktionsnutzer werden `server.as` nicht ausführen. Dieses Muster ist nur für den Entwicklungsablauf.
- **Wenn das Skript keinen Server betreibt.** `browse` funktioniert für sich allein, aber der Server-als-App-Rahmen ergibt nur Sinn, wenn es Seiten auszuliefern gibt.
- **Für Ad-hoc-Einmalstarts.** Tippe die URL einfach in den Browser. Das Muster rechtfertigt seine Komplexität erst, wenn der Start wiederholt wird.

## Mentales Modell für KI-Agenten

Wenn eine KI gebeten wird, mit dem Starter-Pack ein GUI-Projekt zu erstellen, ist die erwartete Abfolge:

1. `<projekt>.html`, `<projekt>-main.as`, `<projekt>.json` erzeugen.
2. `python3 asdoc-check.py --write` auf allen neuen `.as`-Dateien ausführen.
3. **Sofort** `allspeak server.as -t edit,<projekt>` im Hintergrund ausführen.
4. Dem Benutzer sagen, dass die App gestartet ist und sich zwei Tabs geöffnet haben sollten.

Der Benutzer soll das Gefühl haben, dass „die App gestartet ist" — nicht, dass er drei Infrastrukturteile zusammensetzen muss, um zu sehen, was gerade gebaut wurde.
