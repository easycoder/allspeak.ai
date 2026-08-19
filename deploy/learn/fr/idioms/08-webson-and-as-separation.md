# Séparation Webson et AS

## Problème

Tu as une interface plus grande qu'une poignée d'éléments. Créer chacun en ligne dans AllSpeak — `crée`, `définis le contenu de`, `définis le style de`, et on recommence — noie rapidement la vraie logique sous le bruit de la construction du DOM. La structure de l'interface s'emmêle avec le comportement du script.

## Le schéma

Sépare l'interface en deux :

- **La mise en page dans un fichier Webson `.json`.** L'arbre des éléments, le style, les identifiants.
- **La logique dans un fichier `.as`.** Charger les données, gérer les événements, transformer l'état.
- **`attache` fait le pont.** Après le rendu du Webson, le script AS récupère chaque élément par son identifiant.

```as
variable Layout

crée Body
rest obtiens Layout depuis `app.json`
rends Layout dans Body

attache LoginPanel à `login-panel`
attache UsernameField à `username-input`
attache LoginButton à `login-button`
attache Status à `status`

sur clic LoginButton vasous à HandleLogin
```

Le script ne dit jamais à quoi ressemble le panneau de connexion — c'est le rôle du fichier de mise en page. Le fichier de mise en page ne dit jamais ce qui se passe quand on clique sur le bouton — c'est le rôle du script. Chacun reste dans son rôle, sans empiéter sur l'autre.

## Quand l'utiliser

Webson + attache est rentable quand :

- L'interface a plus d'une poignée d'éléments.
- La mise en page risque de changer sans que le comportement change (refonte visuelle, traduction).
- Plusieurs personnes (ou un designer + un codeur) travaillent sur le même écran.
- Tu veux charger la mise en page dynamiquement (des mises en page différentes selon les utilisateurs, des tests A/B).

Le `crée` en ligne convient quand :

- L'interface est petite (deux boutons, un div de statut).
- Les éléments sont construits de façon procédurale (un bouton par enregistrement de données).
- Tu es en phase de prototype et tu ne veux pas encore de fichier séparé.

## Exemple concret

`app.json` (mise en page Webson) :

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$LoginPanel"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Bienvenue"
    },

    "$LoginPanel": {
        "#element": "div",
        "@id": "login-panel",
        "#": ["$Username", "$LoginButton"],

        "$Username": {
            "#element": "input",
            "@id": "username-input"
        },

        "$LoginButton": {
            "#element": "button",
            "@id": "login-button",
            "#content": "Se connecter"
        }
    }
}
```

`app.as` (logique AllSpeak) :

```as
variable Layout
div Title
div LoginPanel
input Username
bouton LoginButton

crée Body
rest obtiens Layout depuis `app.json`
rends Layout dans Body

attache Title à `title`
attache LoginPanel à `login-panel`
attache Username à `username-input`
attache LoginButton à `login-button`

sur clic LoginButton vasous à HandleLogin
arrête

HandleLogin:
    mets le contenu de Username dans Name
    ! ... valider, etc. ...
    retourne
```

Le script déclare chaque variable typée, l'attache à l'élément rendu et travaille avec elle à partir de là. Les changements visuels (styler le bouton, repositionner le panneau) se font entièrement dans `app.json`.

## Créer puis indexer pour les tableaux d'éléments

Quand une interface comporte un élément répété rendu N fois, déclare un tableau côté AllSpeak, **puis crée chaque élément dans une boucle pendant que le curseur est positionné** :

```as
bouton Tab
définis les éléments de Tab à 5

mets 0 dans N
tant que N est inférieur à 5 début
    indexe Tab à N
    crée Tab dans TabBar
    définis le contenu de Tab à élément N de TabNames
    ajoute 1 à N
fin

sur clic Tab vasous à TabClicked
```

`définis les éléments de Tab à 5` réserve cinq emplacements. Chaque `indexe Tab à N` suivi de `crée Tab dans TabBar` construit l'élément à l'emplacement N et l'insère dans le conteneur. Un seul `crée` hors de la boucle ne construirait qu'un élément — pas cinq — donc le `crée` doit être dans la boucle. Le gestionnaire lit `l index de Tab` pour savoir lequel a déclenché l'événement (voir [event-handlers-and-array-index](event-handlers-and-array-index.md)).

C'est le même schéma tableau-plus-curseur qui s'applique aux tableaux scalaires, étendu aux éléments DOM.

## Contenu piloté par les données : Webson pour le cadre, le script pour les lignes

Le schéma Webson + attache cesse de suffire quand la forme n'est pas connue au moment du gabarit. Webson est un langage de gabarit : chaque élément est déclaré statiquement, chaque `#content` est une chaîne littérale dans le JSON. Deux choses en particulier ne collent pas :

- **Des nombres d'éléments variables.** Webson peut déclarer un nombre fixe de lignes ; il ne peut pas déclarer « une ligne par enregistrement du fichier de données ».
- **Un contenu d'élément issu d'une valeur du script.** `#content` prend une chaîne littérale, pas une expression — impossible de dire « la valeur de `Row.amount` pour cette itération ».

La solution est de séparer la page selon l'axe qui varie. Utilise Webson pour les parties dont la forme est fixée au moment du gabarit — le cadre de la page, la barre d'en-tête, la ligne d'en-tête du tableau, les formulaires modaux. Utilise le script pour les parties dont la forme vient des données — les lignes du corps, les sous-totaux mensuels, les totaux calculés. `asedit.as` fait ça pour sa liste de fichiers : un conteneur à défilement attaché via Webson, avec des entrées créées par le script à l'intérieur ; la mise en page ne sait rien du nombre de fichiers possibles.

### Un tableau piloté par les données

Pour un tableau de journalisation dont les lignes viennent d'un fichier JSON :

```as
div TableBody
attache TableBody à `table-body`

variable Grid
mets `40px 1fr 100px 100px` dans Grid

variable Rows
rest obtiens Rows depuis `/data/2024-25/04.json`

div Row
définis les éléments de Row à le compte de Rows
mets 0 dans N
tant que N est inférieur à le compte de Rows début
    indexe Row à N
    crée Row dans TableBody
    définis le style de Row à `display:grid; grid-template-columns:` cat Grid
    définis le contenu de Row à (élément 0 de élément N de Rows) cat `,` cat (élément 1 de élément N de Rows)
    ajoute 1 à N
fin

sur clic Row vasous à HandleRowClick
```

Le Webson `app.json` déclare le cadre du tableau — le conteneur extérieur, la ligne d'en-tête avec le même `grid-template-columns: 40px 1fr 100px 100px`, le point d'attache `table-body`. Tout ce qui se trouve sous ce point est construit par le script.

La chaîne `grid-template-columns` répétée est le seul coût : la ligne d'en-tête dans Webson et les lignes de données dans le script doivent s'accorder dessus. C'est assez bon marché pour que l'introduction d'une primitive Webson de génération de lignes par gabarit n'en vaille pas la peine. Tire le gabarit de colonnes dans une constante du script (ici `Grid`) et reporte la même valeur en littéral dans la mise en page Webson.

### Alternatives envisagées (et quand les utiliser)

- **Un `<table>` HTML via Webson.** `table`, `tr`, `td`, `th` sont des types AllSpeak déclarables (voir [browser-and-webson](../reference/browser-and-webson.md)), donc c'est techniquement possible. Le schéma en grille gagne pour la plupart des tableaux d'interface, parce que le survol/le clic par ligne et les largeurs adaptatives sont plus faciles sur un div en grille que sur `tr`/`td`. Préfère `<table>` quand tu as besoin d'HTML sémantique pour l'accessibilité, l'export PDF/impression ou la navigation par lecteur d'écran.
- **Un conteneur en grille avec des enveloppes de ligne `display: contents`.** Permet à toutes les cellules de partager un seul gabarit de grille, mais `display: contents` retire la ligne de l'arbre de boîtes — il n'y a plus d'élément de ligne stylable sur lequel attacher survol ou clic. Utile quand les lignes sont purement visuelles ; gênant quand les lignes sont des unités cliquables. Le schéma du div en grille par ligne ci-dessus garde chaque ligne comme un élément stylable et cliquable à part entière.

## Anti-schéma : le style dans le script

```as
crée Save dans Container
définis le style de Save à `padding:1em; background:#48f; color:white; border-radius:0.3em`
```

Du CSS dans le script, c'est fragile et bruyant. Déplace-le dans Webson, là où le style a sa place. Garde le script pour le comportement que la mise en page ne peut pas exprimer — liaison de données, gestion d'événements, transitions.

## Anti-schéma : le comportement dans Webson

Webson, c'est de la mise en page ; il ne peut pas exprimer de conditions, de boucles ni de gestionnaires d'événements. Si tu te surprends à vouloir encoder du comportement dans des clés JSON, c'est le signe qu'il faut placer l'élément variable côté script et le raccorder avec `attache`.

## À voir aussi

- [browser-and-webson](../reference/browser-and-webson.md) — les types DOM, `attache`, `rends`.
- [event-handlers-and-array-index](event-handlers-and-array-index.md) — les tableaux d'éléments avec gestionnaire partagé.
- [writing-language-neutral](writing-language-neutral.md) — externaliser les chaînes visibles par l'utilisateur dans Webson pour la traduction.
