# Navigateur et Webson

Le domaine Navigateur d'AllSpeak fournit le vocabulaire pour construire et manipuler les éléments DOM : boutons, divs, inputs, formulaires, tout l'attirail. Le langage compagnon Webson est un dialecte JSON pour décrire la mise en page — il te permet de garder la structure de l'interface dans une ressource `.json` séparée, loin de la logique AllSpeak.

Une interface AllSpeak typique met la mise en page dans Webson, le comportement dans `.as`, et utilise `attache` pour lier les deux.

## Les types de variables DOM

Chaque genre d'élément DOM est une variable typée :

```as
bouton SaveButton
div Container
input NameField
formulaire LoginForm
span Status
h1 Title
p Para
image Logo
select Dropdown
label NameLabel
```

Une variable typée comme `bouton SaveButton` déclare la variable ; l'élément n'existe dans le DOM qu'une fois que tu le crées ou que tu l'attaches à un élément rendu.

### L'ensemble complet des types d'éléments

Chaque élément HTML courant possède un type AllSpeak. À ce jour : `a`, `audioclip`, `blockquote`, `bouton`, `canvas`, `div`, `fichier`, `fieldset`, `formulaire`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `image` (alias de `img`), `img`, `input`, `label`, `legend`, `li`, `option`, `p`, `pre`, `progress`, `select`, `span`, `table`, `zonetexte`, `td`, `th`, `tr`, `video`. Si tu as besoin d'un type d'élément absent de cette liste, déclare-le comme `div` et utilise `définis attribut` pour lui donner la bonne balise — le domaine Navigateur ne limite pas ce que le moteur de rendu peut créer.

## `attache` — lier le script à la mise en page

`attache` connecte une variable de script à un élément DOM rendu par son `id` HTML :

```as
crée Body
rest obtiens Layout depuis `app.json`
rends Layout dans Body

attache LoginPanel à `login-panel`
attache UsernameField à `username-input`
attache LoginButton à `login-button`
```

Après `attache`, la variable pointe vers l'élément DOM vivant — `définis le contenu de`, `sur clic`, `définis le style de`, etc. fonctionnent tous dessus.

`attache` peut aussi trouver des éléments à l'intérieur d'un composant rendu en passant l'élément dans lequel chercher :

```as
attache Panel à `side-panel`
attache Button à `save-btn` dans Panel
```

Le type de la variable doit correspondre au genre d'élément de la mise en page — une variable `div` vers un `div`, un `bouton` vers un `bouton`.

## Les opérations courantes sur les éléments

Une fois que tu as une variable d'élément (créée ou attachée), les opérations du quotidien sont :

```as
définis le contenu de X à `Hello`            ! contenu texte de l'élément
définis le texte de X à `Hello`              ! synonyme de contenu
définis le style de X à `color:red; font-weight:bold`
définis style `width` de X à `90%`           ! une propriété CSS à la fois
définis attribut `href` de X à `https://example.com`   ! attribut HTML sur l'élément DOM
définis attribut `data-id` de X à `42`       ! attribut quelconque, même forme
définis propriété `color` de X à `#ff0000`   ! écrit une propriété JSON sur l'élément
mets le contenu de X dans V                  ! lecture retour
mets propriété `color` de X dans V           ! lecture retour d'une propriété
```

`définis le style de X` applique du CSS en ligne en bloc ; `définis style \`name\` de X` écrit une propriété CSS unique. `définis attribut \`name\` de X` écrit un attribut HTML sur l'élément DOM vivant en appelant `element.setAttribute(name, value)`.

### Lire la sélection

`le sélectionné texte de <élément>` renvoie la sous-chaîne surlignée d'une zonetexte ou d'un input (vide quand rien n'est sélectionné). Pour un `<select>`, `le sélectionné index de <élément>` donne la position de l'option choisie et `le sélectionné article de <élément>` son texte.

`le sélectionné texte` tout nu (sans élément) renvoie ce qui est sélectionné dans l'élément éditable **focalisé**, en retombant sur la sélection du document — utile pour les actions de barre d'outils qui opèrent sur la sélection courante sans savoir dans quel champ elle vit :

```as
mets le sélectionné texte de Notes dans V    ! partie surlignée de la zonetexte
mets le sélectionné texte dans V             ! sélection de l'élément actif
définis selection de Notes depuis 6 à 11     ! surligne les caractères 6..11 et met le champ au focus
```

`définis selection de <zonetexte/input> depuis <début> à <fin>` définit le surlignage par programmation (offsets de caractères basés sur 0) et focalise l'élément.

### `définis attribut` vs `définis propriété` — ce ne sont pas la même chose

Ce piège attrape les agents IA à coup sûr et les humains de temps en temps :

- **`définis attribut \`name\` de X à V`** écrit sur **l'élément DOM**. Utilise-le pour `href`, `target`, `title`, `src`, `type`, `checked`, `data-*`, les attributs ARIA — tout ce qui doit vivre sur l'élément HTML vivant pour que le navigateur agisse dessus.
- **`définis propriété \`name\` de X à V`** écrit dans un **dictionnaire JSON par élément stocké sur la variable**. Fonctionne sur toute variable typée — `variable`, `div`, `bouton`, `input`, etc. Cela ne touche *pas* au DOM. Utilise-le pour des métadonnées applicatives que tu veux transporter avec l'élément (par exemple l'identifiant d'enregistrement d'une ligne, pour que tes propres gestionnaires d'événements le relisent via `propriété \`name\` de X`).

Les deux ont une syntaxe de surface similaire mais des effets complètement différents. Un symptôme courant de la confusion : `définis propriété \`href\` de LinkAnchor à URL` s'exécute sans erreur, mais le lien ne navigue pas au clic — parce que le `<a>` du DOM n'a jamais reçu le `href` ; seul le dict de données de la variable l'a reçu. La correction est de changer `propriété` en `attribut`.

Si ton but est « que le navigateur agisse sur ça », prends `attribut`. Si ton but est « me souvenir de ce fait sur l'élément pour que mon propre code le relise plus tard », prends `propriété`.

Les propriétés sur les éléments d'un tableau **s'initialisent automatiquement à la première écriture** — il n'existe pas de commande `définis les propriétés de X à tableau`. Il suffit de faire `définis propriété \`name\` de X à V` dans la boucle de création ; le dictionnaire JSON par élément est créé automatiquement. Les agents IA inventent souvent une étape de pré-initialisation comme `définis les propriétés de Cell à tableau pour \`color\`` — ce n'est pas du AllSpeak valide.

## Les événements

Les événements d'élément s'enregistrent avec `sur <événement> <élément> vasous Gestionnaire` :

```as
sur clic Save vasous à HandleSave
sur changement NameField vasous à NameChanged
sur submit Form vasous à Submit
```

Le gestionnaire est un fil ; le curseur sur la variable d'élément est positionné sur l'instance qui a déclenché avant que le gestionnaire ne s'exécute. Voir [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md) pour le motif canonique avec des tableaux d'éléments.

## Les boîtes de dialogue natives du navigateur

Deux mots-clés aboutissent aux boîtes de dialogue modales intégrées du navigateur. Les deux bloquent la page jusqu'à ce que l'utilisateur les ferme, donc utilise-les avec parcimonie — pour une interface substantielle, construis une modale en Webson et un formulaire normal basé sur des éléments.

`alerte` affiche un message d'information :

```as
alerte `Enregistré.`
```

`confirme` affiche une boîte de dialogue OK/Annuler et bifurque selon le choix de l'utilisateur via `vasous` :

```as
confirme `Supprimer cette réservation ?` vasous OnYes ou vasous OnNo
```

La clause `ou vasous <Étiquette>` est facultative — si seul le cas OK t'intéresse, retire-la ; sur Annuler, le script continue simplement à la commande suivante. Les deux branches se comportent comme des appels `vasous` ordinaires : elles empilent un PC de retour et la sous-routine appelée se termine par `retourne`, donc l'exécution reprend à la commande suivante quel que soit le chemin pris.

Le texte affiché est la valeur de chaîne que tu passes — il n'est pas affecté par le pack de langue, donc traduis-le toi-même.

## Webson

Webson est un dialecte JSON qui décrit la mise en page HTML/CSS. Il a ses propres conventions :

```json
{
    "#element": "div",
    "@id": "main",
    "padding": "1em",
    "#": ["$Title", "$SaveButton"],

    "$Title": {
        "#element": "h1",
        "@id": "title",
        "#content": "Bienvenue"
    },

    "$SaveButton": {
        "#element": "button",
        "@id": "save-button",
        "#content": "Enregistrer"
    }
}
```

`rends Layout dans Body` parcourt l'arbre Webson et émet du vrai DOM. L'intérêt du dialecte est la séparation : la mise en page est une ressource `.json` statique qui peut être éditée (ou traduite) sans toucher à l'AllSpeak. Pour une discussion travaillée de la séparation, voir [séparation Webson et AS](../idioms/webson-and-as-separation.md).

### Référence des clés

Chaque clé d'un objet Webson tombe dans l'une de ces catégories :

| Préfixe | Rôle | Exemple |
|--------|---------|---------|
| `#element` | Nom de la balise HTML | `"div"`, `"button"`, `"h1"` |
| `#content` | Contenu texte | `"Bienvenue"` |
| `#doc` | Documentation — ignorée par le moteur de rendu | n'importe quelle chaîne |
| `#` | Liste ordonnée de références d'enfants | `["$Title", "$SaveButton"]` |
| `@<name>` | Attribut HTML | `@id`, `@class`, `@href`, `@type` |
| `$<name>` | Définition d'enfant nommée | `$Title`, `$SaveButton` |
| clé simple | Propriété CSS | `padding`, `font-family`, `color` |

### `#element` — la balise HTML

Requis sur chaque élément. La valeur est le nom de la balise sous forme de chaîne : `"div"`, `"button"`, `"input"`, `"h1"`, `"textarea"`, `"img"`, `"a"`, `"span"`, `"label"`, `"select"`, `"option"`, `"form"`, `"p"`, `"pre"`, `"ul"`, `"ol"`, `"li"`, `"table"`, `"tr"`, `"td"`, `"th"`, `"hr"`, `"br"`, `"fieldset"`, `"legend"`.

### `#content` — le contenu texte

Le texte interne de l'élément. Peut coexister avec les enfants (`#`) — le contenu est rendu d'abord, puis les enfants.

```json
{
    "#element": "p",
    "#content": "Total : ",
    "#": ["$ValueSpan"]
}
```

### `#` — le tableau des enfants

Une liste ordonnée de chaînes de noms préfixées `$`. Le moteur de rendu crée les éléments enfants dans cet ordre. **Sans `#`, aucun enfant n'est rendu** — même si l'objet a des clés préfixées `$` définies plus bas.

```json
{
    "#element": "div",
    "#": ["$Label", "$Input"],    ← Label est rendu en premier, Input en second

    "$Label": { ... },
    "$Input": { ... }
}
```

Un nom `$` référencé dans `#` doit exister quelque part dans la portée de résolution (voir ci-dessous), mais il n'a pas besoin d'être imbriqué dans le même objet — il peut être défini au niveau d'un parent ou de la racine.

**Les entrées doivent être des chaînes `$Name`, pas des objets JSON en ligne.** C'est l'erreur d'IA la plus courante avec Webson :

```json
// FAUX — objets en ligne dans le tableau # :
"#": [
    { "#element": "div", "background-color": "#ccc" },
    { "#element": "div", "background-color": "#ccc" }
]

// CORRECT — références $Name vers des blocs nommés :
"#": ["$Cell", "$Cell"],
"$Cell": {
    "#element": "div",
    "background-color": "#ccc"
}
```

Les entrées `#` sous forme d'objets en ligne échouent à l'exécution avec l'erreur `build: [object Object] has no properties` parce que le moteur de rendu essaie d'utiliser l'objet comme clé de chaîne pour consulter la table des symboles. Définis toujours un bloc `$Name` et référence-le par son nom.

### `$<name>` — les définitions d'enfants nommés

Les clés préfixées `$` définissent les éléments que `#` référence. Elles peuvent apparaître à n'importe quel niveau de l'arbre — le moteur de rendu les résout en cherchant vers le haut.

**Ordre de résolution** (où le moteur de rendu cherche `$ModalForm` quand le `#` de `$Modal` le référence) :

1. **Même objet** — les clés de l'élément dont le `#` contient la référence
2. **Objet parent** — les clés du parent de l'élément dans l'arbre Webson
3. **Objet racine** — les clés de l'objet de niveau supérieur (la racine du fichier)

Cela signifie qu'une définition d'enfant peut vivre dans une portée parente :

```json
{
    "#element": "div",
    "#": ["$Outer"],

    "$Outer": {
        "#element": "div",
        "#": ["$Inner"]
        ← $Inner n'est PAS défini ici — le moteur de rendu remonte
    },

    "$Inner": {                   ← Trouvé ici (portée du parent)
        "#element": "span",
        "#content": "Bonjour"
    }
}
```

C'est utile pour partager des éléments communs entre frères et sœurs sans répéter leur définition.

### `@<name>` — les attributs HTML

Les clés commençant par `@` posent des attributs HTML sur l'élément DOM. `"@" est pour « @ttribut »` :

```json
{
    "@id": "save-btn",
    "@class": "primary",
    "@type": "checkbox",
    "@checked": true,
    "@placeholder": "Saisir le nom",
    "@href": "https://example.com",
    "@src": "logo.png",
    "@autocomplete": "username",
    "@disabled": true,
    "@rows": "3"
}
```

`@id` est le plus courant — c'est la poignée que la commande `attache` d'AllSpeak cherche après `rends`.

### Les propriétés CSS

Toute clé qui ne commence pas par `#`, `@` ou `$` est traitée comme une propriété CSS. Les noms avec traits d'union passent directement :

```json
{
    "font-family": "sans-serif",
    "font-size": "14px",
    "color": "#333",
    "margin": "1em 0",
    "display": "flex",
    "align-items": "center",
    "gap": "0.5em",
    "grid-template-columns": "1fr 1fr"
}
```

L'ordre des clés parmi les propriétés CSS n'a pas d'importance — le moteur de rendu les collecte toutes et les pose sur l'attribut `style` de l'élément.

### `#doc` — la documentation

Une clé réservée à la documentation. Le moteur de rendu l'ignore complètement. Utilise-la pour des notes en ligne :

```json
{
    "#doc": "Ce panneau s'affiche après la connexion.",
    "#element": "div",
    ...
}
```

### L'ordre des clés n'a pas d'importance

Le moteur de rendu identifie les clés par leur préfixe, pas par leur position dans l'objet. Ceci fonctionne :

```json
{
    "$Modal": { ... },
    "#element": "div",
    "@id": "page",
    "background": "#f5f5f5",
    "#": ["$Modal"]
}
```

Mais par convention, la plupart des mises en page listent les clés dans cet ordre pour la lisibilité :

1. `#doc` (si présent)
2. `#element`
3. `@id`
4. Les propriétés CSS
5. `#` (tableau des enfants)
6. Les définitions d'enfants préfixées `$`

### Exemple travaillé : recouvrement modal avec résolution de portée

Une boîte de dialogue modale où le div de recouvrement, l'enveloppe modale et les champs du formulaire sont chacun des objets séparés, démontrant la résolution `$` à travers les portées :

```json
{
    "#element": "div",
    "@id": "page",
    "#": ["$Overlay"],

    "$Overlay": {
        "#element": "div",
        "@id": "overlay",
        "display": "none",
        "position": "fixed",
        "top": "0", "left": "0", "right": "0", "bottom": "0",
        "background": "rgba(0,0,0,0.5)",
        "#": ["$Modal"],

        "$Modal": {
            "#element": "div",
            "background": "white",
            "border-radius": "8px",
            "padding": "1.5em",
            "#": ["$ModalForm"]
            ← $ModalForm n'est PAS défini ici
        }
    },

    "$ModalForm": {         ← Résolu depuis la racine (portée du parent du parent)
        "#element": "div",
        "@id": "modal-form",
        "#": ["$Title", "$Fields"],

        "$Title": {
            "#element": "h2",
            "@id": "modal-title",
            "#content": "Modifier la réservation"
        },

        "$Fields": {
            "#element": "div",
            "@id": "form-fields",
            "display": "flex",
            "flex-direction": "column",
            "gap": "0.5em",
            "#": ["$DateRow"],

            "$DateRow": {
                "#element": "div",
                "display": "flex",
                "align-items": "center",
                "gap": "0.5em",
                "#": ["$DateLabel", "$DateInput"],

                "$DateLabel": {
                    "#element": "label",
                    "#content": "Date",
                    "width": "120px",
                    "flex-shrink": "0"
                },
                "$DateInput": {
                    "#element": "input",
                    "@id": "date-input",
                    "@type": "date",
                    "flex": "1",
                    "min-width": "0"
                }
            }
        }
    }
}
```

Points clés de cet exemple :

- **Le `#` de `$Modal` référence `$ModalForm`**, qui est défini deux niveaux plus haut (à la racine). Le moteur de rendu cherche : même objet ($Modal → introuvable) → parent ($Overlay → introuvable) → racine (trouvé).
- **`$ModalForm` est défini une seule fois** mais référencé depuis le `#` de `$Modal`. Il n'a pas besoin d'être imbriqué dans `$Modal`.
- **`#` contrôle l'ordre de rendu.** La page rend Overlay (via `#: ["$Overlay"]`), qui rend Modal (via son `#`), qui rend ModalForm (via son `#`). Sans aucun de ces tableaux `#`, les enfants seraient définis mais invisibles.
- **Chaque ligne est un conteneur flex** avec une étiquette à largeur fixe et un input à remplissage flex — le motif standard des formulaires en tableau.

## Les tableaux d'éléments DOM

Une variable DOM typée peut être un tableau, tout comme un scalaire :

```as
bouton Item
définis les éléments de Item à 5
! ... remplir 5 boutons ...

sur clic Item vasous à HandleClick
```

C'est le motif canonique pour « de nombreux éléments semblables ». Voir [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md) et [choisir la forme d'une collection](../idioms/picking-a-collection-shape.md).

## Le stockage local du navigateur

AllSpeak pour le navigateur fournit `stockage` — une interface vers l'API `localStorage` du navigateur :

```as
mets State dans stockage comme `cells.state`

! Plus tard, au chargement de la page :
obtiens State depuis stockage comme `cells.state`
si State est vide définis State à tableau       ! initialisation au premier chargement
```

Le stockage est réservé au navigateur. Le runtime Python n'a pas ce vocabulaire ; pour le CLI, utilise `read` / `write` sur un fichier à la place.

## Moteur de rendu Webson vs domaine Navigateur

Le moteur de rendu Webson (qui transforme le JSON Webson en DOM) est un outil d'accompagnement — il ne fait pas partie du langage AllSpeak. Le domaine Navigateur fournit le vocabulaire du langage (`bouton`, `attache`, `sur clic`) ; le moteur de rendu émet les éléments que `attache` lie ensuite. Voir [structure](structure.md) pour la place des outils d'accompagnement.

## Voir aussi

- [structure](structure.md) — Navigateur est l'un des domaines fournis ; le moteur de rendu Webson est un outil d'accompagnement.
- [gestionnaires d'événements et index de tableau](../idioms/event-handlers-and-array-index.md) — `sur clic` et le modèle du curseur pour les tableaux d'éléments.
- [séparation Webson et AS](../idioms/webson-and-as-separation.md) — quand utiliser Webson plutôt que la création en ligne.
- [collections](collections.md) — les propriétés d'objet sur les éléments DOM.
