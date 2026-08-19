# Commandes de l'environnement de développement

Une petite famille de mots-clés du noyau existe pour interagir avec le système d'exploitation hôte et le bureau de l'utilisateur. Ils sont **réservés au runtime Python** — le runtime navigateur JS ne les définit pas, car un script de navigateur n'a ni shell, ni système de fichiers, et tourne déjà dans un onglet de navigateur.

Ces commandes existent pour soutenir les scripts de développement (serveurs de développement, lanceurs, aides de construction, utilitaires ponctuels) plutôt que la logique applicative du runtime. Elles sont volontairement étroites : si tu te surprends à utiliser `system` depuis du code de production, préfère un mot-clé ciblé ou un greffon.

| Mot-clé | Rôle |
|---|---|
| `system [background] {command}` | Exécute une commande shell. Avec `background`, lance-la dans un processus séparé et reviens immédiatement. |
| `download [binary] {url} to {path} [or {clause}]` | Récupère une URL dans un fichier local. |
| `browse {url}` | Ouvre une URL dans le navigateur par défaut de l'utilisateur. |

## browse

Ouvre une URL dans le navigateur par défaut de l'utilisateur via le module `webbrowser` de Python. Indépendant du système d'exploitation — pas de recours au shell `xdg-open` / `open` / `start`, donc le même script fonctionne sous Linux, macOS et Windows sans logique conditionnelle.

```
browse `http://localhost:8080/edit.html`
```

L'appel revient immédiatement ; le système d'exploitation remet l'URL au navigateur de manière asynchrone. Il n'y a pas de valeur de retour et aucun moyen de savoir depuis le script si le navigateur s'est réellement ouvert — `browse` est du feu-et-oubli.

L'usage typique est dans un script lanceur qui doit pointer l'utilisateur vers une ou plusieurs pages — voir [le serveur comme application](../idioms/13-server-as-application.md) pour le motif canonique.

### L'ordre compte quand tu ouvres dans ton propre serveur

Si un script `démarre` un serveur puis appelle `browse` pour des URL que le même serveur va prendre en charge, les appels `browse` doivent venir *après* le bloc de gestionnaire `on … request`. Tant que ce bloc n'a pas été exécuté, le serveur a accepté le port mais n'a aucun gestionnaire enregistré, donc les requêtes entrantes reçoivent un 503 « Server handler not ready ». Le bloc de gestionnaire définit un PC de gestionnaire puis saute par-dessus son corps, donc le code qui suit le bloc s'exécute normalement — c'est là que les appels `browse` ont leur place.

## system

Exécute une commande shell. Avec `background`, la commande est lancée dans un processus séparé et `system` revient immédiatement ; sans elle, le script attend que la commande se termine.

```
system `ls -l > files.txt`
system background `sleep 2 && allspeak server.as 8080`
```

`system` est pratique mais attache le script à un système d'exploitation particulier. Préfère `browse` quand le but est d'ouvrir une URL, et `download` quand le but est de récupérer un fichier — les deux sont indépendants du système d'exploitation.

## download

Récupère une URL dans un fichier local, avec une clause `or` / `on failure` facultative pour la gestion d'erreurs :

```
download `https://allspeak.ai/code/server.as` to BaseDir cat `/server.as` ou début
    imprime `Échec de la vérification de mise à jour`
fin
```

Ajoute `binary` pour les charges utiles non textuelles (images, archives). La grammaire complète et des exemples par mot-clé se trouvent dans `allspeak-py/doc/core/keywords/{system,download,browse}.md`.

## Quand elles n'existent pas

Dans le runtime navigateur JS, `system`, `download` et `browse` ne sont pas définis. Le bac à sable du navigateur les rend soit impossibles (`system`) soit redondantes (`browse` — un script peut naviguer via `window.location` ou ouvrir via `window.open`, et `download` peut se faire avec `rest obtiens`). N'écris pas de code qui utilise ces mots-clés s'il doit aussi tourner dans le navigateur ; garde-les dans les scripts clairement côté Python, comme `server.as` et les utilitaires CLI.
