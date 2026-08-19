# Entwicklungsbefehle

Eine kleine Familie von Core-Schlüsselwörtern existiert für die Interaktion mit dem Host-Betriebssystem und dem Desktop des Benutzers. Sie sind **nur für die Python-Laufzeit** — die JS-Browser-Laufzeit definiert sie nicht, denn ein Browser-Skript hat keine Shell, kein Dateisystem und läuft bereits in einem Browser-Tab.

Diese Befehle existieren, um Dev-Zeit-Skripte zu unterstützen (Entwicklungsserver, Launcher, Build-Helfer, Einmal-Werkzeuge) statt Laufzeit-Anwendungslogik. Sie sind bewusst schmal gehalten: Wenn du dich aus Produktionscode heraus nach `system` greifst, ziehe ein fokussiertes Schlüsselwort oder ein Plugin vor.

| Schlüsselwort | Zweck |
|---|---|
| `system [background] {befehl}` | Einen Shell-Befehl ausführen. Mit `background` abzweigen und sofort zurückkehren. |
| `download [binary] {url} zu {pfad} [oder {klausel}]` | Eine URL in eine lokale Datei holen. |
| `browse {url}` | Eine URL im Standard-Browser des Benutzers öffnen. |

## browse

Öffnet eine URL im Standard-Browser des Benutzers über das `webbrowser`-Modul von Python. Betriebssystem-unabhängig — kein Shell-Out an `xdg-open` / `open` / `start`, also funktioniert dasselbe Skript auf Linux, macOS und Windows ohne bedingte Logik.

```
browse `http://localhost:8080/edit.html`
```

Der Aufruf kehrt sofort zurück; das Betriebssystem übergibt die URL asynchron an den Browser. Es gibt keinen Rückgabewert und keine Möglichkeit, aus dem Skript zu erfahren, ob der Browser wirklich geöffnet hat — `browse` ist Feuer-und-vergiss.

Der typische Einsatz ist ein Launcher-Skript, das den Benutzer auf eine oder mehrere Seiten weisen muss — siehe [Der Server als Anwendung](../idioms/13-server-as-application.md) für das kanonische Muster.

### Die Reihenfolge ist wichtig, wenn du in deinen eigenen Server öffnest

Wenn ein Skript einen Server `startet` und dann `browse` für URLs aufruft, die derselbe Server bedienen wird, müssen die `browse`-Aufrufe *nach* dem `on … request`-Handler-Block kommen. Bis dieser Block ausgeführt ist, hat der Server den Port akzeptiert, aber keinen Handler registriert, sodass eingehende Anfragen ein 503 „Server handler not ready" bekommen. Der Handler-Block setzt einen Handler-Befehlszeiger und springt dann über seinen Rumpf hinweg, also läuft Code nach dem Block normal — dort gehören die `browse`-Aufrufe hin.

## system

Einen Shell-Befehl ausführen. Mit `background` wird der Befehl in einen separaten Prozess abgezweigt und `system` kehrt sofort zurück; ohne wartet das Skript, bis der Befehl fertig ist.

```
system `ls -l > files.txt`
system background `sleep 2 && allspeak server.as 8080`
```

`system` ist praktisch, bindet das Skript aber an ein bestimmtes Betriebssystem. Bevorzuge `browse`, wenn das Ziel das Öffnen einer URL ist, und `download`, wenn das Ziel das Holen einer Datei ist — beides ist betriebssystem-unabhängig.

## download

Eine URL in eine lokale Datei holen, mit optionaler `oder`- / `on failure`-Klausel für die Fehlerbehandlung:

```
download `https://allspeak.ai/code/server.as` zu BaseDir cat `/server.as` oder beginn
    drucke `Update-Prüfung fehlgeschlagen`
ende
```

Füge `binary` für Nicht-Text-Nutzdaten hinzu (Bilder, Archive). Die vollständige Grammatik und Beispiele pro Schlüsselwort stehen in `allspeak-py/doc/core/keywords/{system,download,browse}.md`.

## Wenn es sie nicht gibt

In der JS-Browser-Laufzeit sind `system`, `download` und `browse` nicht definiert. Die Browser-Sandbox macht sie entweder unmöglich (`system`) oder überflüssig (`browse` — ein Skript kann über `window.location` navigieren oder über `window.open` öffnen, und `download` ist mit `rest hole` möglich). Schreibe keinen Code mit diesen Schlüsselwörtern, wenn er auch im Browser laufen könnte; halte sie in Skripten, die klar Python-seitig sind, wie `server.as` und CLI-Werkzeuge.
