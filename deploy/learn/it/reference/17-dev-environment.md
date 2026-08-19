# Comandi dell'ambiente di sviluppo

Una piccola famiglia di parole chiave del core esiste per interagire con il sistema operativo host e con il desktop dell'utente. Sono **solo runtime Python** — il runtime browser JS non le definisce, perché uno script di browser non ha shell, non ha filesystem ed è già in esecuzione dentro una scheda del browser.

Questi comandi esistono per supportare gli script di sviluppo (server di sviluppo, lanciatori, helper di build, utilità usa-e-getta) piuttosto che la logica applicativa di runtime. Sono volutamente ristretti: se ti ritrovi a usare `system` da codice lato produzione, preferisci una parola chiave mirata o un plugin.

| Parola chiave | Scopo |
|---|---|
| `system [background] {comando}` | Esegue un comando shell. Con `background`, lo biforca e ritorna subito. |
| `download [binary] {url} to {path} [or {clause}]` | Recupera un URL in un file locale. |
| `browse {url}` | Apre un URL nel browser predefinito dell'utente. |

## browse

Apre un URL nel browser predefinito dell'utente tramite il modulo `webbrowser` di Python. Indipendente dal sistema operativo: nessun richiamo a shell tipo `xdg-open` / `open` / `start`, quindi lo stesso script funziona su Linux, macOS e Windows senza logica condizionale.

```
browse `http://localhost:8080/edit.html`
```

La chiamata ritorna subito; il sistema operativo passa l'URL al browser in modo asincrono. Non c'è valore di ritorno né modo di sapere dallo script se il browser si è davvero aperto: `browse` è fuoco-e-dimentica.

L'uso tipico è in uno script lanciatore che deve puntare l'utente a una o più pagine — vedi [il server come applicazione](../idioms/13-server-as-application.md) per il pattern canonico.

### L'ordine conta quando apri nel tuo stesso server

Se uno script `avvia` un server e poi chiama `browse` per URL che lo stesso server gestirà, le chiamate `browse` devono venire *dopo* il blocco del gestore `on … request`. Finché quel blocco non viene eseguito, il server ha accettato la porta ma non ha alcun gestore registrato, quindi le richieste in arrivo ricevono un 503 «Server handler not ready». Il blocco del gestore imposta un PC di gestione e poi salta oltre il proprio corpo, quindi il codice che segue il blocco gira normalmente: è lì che devono stare le chiamate `browse`.

## system

Esegue un comando shell. Con `background`, il comando viene biforcato in un processo separato e `system` ritorna subito; senza, lo script attende che il comando finisca.

```
system `ls -l > files.txt`
system background `sleep 2 && allspeak server.as 8080`
```

`system` è comodo ma lega lo script a un particolare sistema operativo. Preferisci `browse` quando l'obiettivo è aprire un URL, e `download` quando l'obiettivo è recuperare un file: entrambi sono indipendenti dal sistema operativo.

## download

Recupera un URL in un file locale, con una clausola `or` / `on failure` opzionale per la gestione degli errori:

```
download `https://allspeak.ai/code/server.as` to BaseDir cat `/server.as` or inizio
    stampa `Controllo aggiornamenti fallito`
fine
```

Aggiungi `binary` per i payload non testuali (immagini, archivi). La grammatica completa e gli esempi per parola chiave vivono in `allspeak-py/doc/core/keywords/{system,download,browse}.md`.

## Quando non esistono

Nel runtime browser JS, `system`, `download` e `browse` non sono definiti. Il sandbox del browser li rende o impossibili (`system`) o ridondanti (`browse` — uno script può navigare tramite `window.location` o aprire tramite `window.open`, e `download` si può fare con `rest ottieni`). Non scrivere codice che usa queste parole chiave se potrebbe dover girare anche nel browser; tienile negli script chiaramente lato Python, come `server.as` e le utility CLI.
