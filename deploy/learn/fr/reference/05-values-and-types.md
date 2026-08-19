# Valeurs et types

Une valeur en AllSpeak est de trois sortes : **nombre**, **chaîne** ou **booléen**. Ce sont les valeurs que manipule l'arithmétique, que comparent les conditions et que concatène `cat`. Les variables contiennent des valeurs ; les conversions entre sortes de valeurs sont en grande partie automatiques.

## Les trois sortes de valeurs

**Nombre** — les valeurs entières. Les littéraux sont des suites nues de chiffres (`42`, `-3`). Toute l'arithmétique produit des résultats entiers. Voir [arithmétique](arithmetic.md).

**Chaîne** — le texte. Les littéraux sont délimités par des apostrophes inversées (`` `Bonjour` ``). Voir [chaînes et texte](strings-and-text.md) pour les opérations.

**Booléen** — vrai ou faux. Les mots-clés `vrai` et `faux` produisent des valeurs booléennes (`tant que vrai …`, `définis Ready à vrai`). La forme abrégée `définis X` met X à vrai ; `efface X` le met à faux. Les booléens apparaissent dans les conditions et comme tests de vérité. Voir [conditions](conditions.md).

Le runtime maintient un indicateur `numérique` sur chaque valeur. Une chaîne qui ne contient que des chiffres a l'indicateur activé et participe à l'arithmétique ; une chaîne avec un contenu non numérique ne l'a pas.

## Le type `variable`

`variable X` déclare un conteneur faiblement typé. Il peut contenir n'importe laquelle des trois sortes de valeurs, et la sorte qu'il contient est celle qu'on y a mise en dernier :

```as
variable X
mets 42 dans X         ! X est maintenant un nombre
mets `Bonjour` dans X    ! X est maintenant une chaîne
définis X                 ! X est maintenant vrai (booléen)
```

`variable` est la seule forme faiblement typée d'AllSpeak. Utilise-la pour un état à usage général dont on ne connaît pas la sorte à l'avance ou qui change au fil du temps.

## Variables typées

Les autres types de variables sont plus stricts — ils n'acceptent que les valeurs que leur domaine connaît :

```as
bouton SaveButton           ! contient une poignée d'élément DOM
fichier ConfigFile             ! contient une référence de fichier
dictionary Spec             ! contient une structure clé/valeur (Python)
module Helper               ! contient un module chargé
```

`mets 42 dans SaveButton` est une erreur — SaveButton n'est pas un conteneur de valeurs, c'est une poignée vers un objet typé. Les opérations qu'une variable typée accepte sont définies par son domaine propriétaire. Voir [structure](structure.md) et [collections](collections.md).

## Conversion automatique

Les valeurs se convertissent entre sortes selon le contexte :

| Contexte | Conversion |
|----------|------------|
| Entrée d'arithmétique | Chaîne numérique → nombre ; une chaîne non numérique est une erreur |
| Opérande de `cat` | Nombre → chaîne ; booléen → « vrai »/« faux » |
| `si X` (test de vérité) | Nombre → faux si 0, vrai sinon ; chaîne → faux si vide, vrai sinon |
| Comparaison `est` | Opérandes comparés comme texte, avec conscience numérique des deux côtés |

```as
mets `42` dans N
ajoute 1 à N            ! N vaut maintenant 43 (la chaîne « 42 » promue en nombre)

mets 5 dans Count
mets `Vous avez ` cat Count cat ` articles` dans Message
                      ! Count converti en « 5 » pour cat
```

La conversion est à sens unique par opération — la valeur stockée de la variable n'est pas transformée en permanence. Après `ajoute 1 à N`, N contient 43 comme nombre ; après `cat Count`, Count est toujours 5 comme nombre.

Dans une chaîne de `cat`, chaque opérande garde son identité de type jusqu'au bout ; la conversion en texte se fait une seule fois, quand la chaîne est repliée en une seule chaîne. C'est particulièrement important pour les valeurs produites au runtime — `l horodatage`, `le contenu de Input`, `l index de X` — qui s'évaluent en une valeur typée et ne deviennent du texte qu'à la frontière, pas à chaque étape de `cat`.

## Mots-clés de valeur spéciaux

Un petit ensemble fermé de mots-clés nus s'évalue en une valeur qui leur est propre — pas d'opérande, pas de variable de tête. Utilise-les partout où une valeur est attendue : comme valeur de droite de `mets`/`définis`, dans une chaîne de `cat`, dans une condition. Le mot de remplissage facultatif `le` est accepté devant chacun d'eux (`l horodatage`, `le aujourdhui`).

| Mot-clé | Type | Valeur |
|---|---|---|
| `vide` | chaîne | La chaîne vide. Équivalente à ``, mais plus naturelle dans les conditions : `si Name est vide …`. |
| `maintenant`, `horodatage` | nombre | Heure Unix actuelle en millisecondes. Les deux sont des alias. |
| `temps` | nombre | Millisecondes depuis minuit aujourd'hui (heure locale). |
| `aujourdhui` | nombre | Horodatage Unix de minuit aujourd'hui, en millisecondes. |
| `nouvelleligne` | chaîne | Un caractère `\n`. |
| `tabulation` | chaîne | Un caractère `\t`. |
| `backtick` | chaîne | Un caractère `` ` ``. |
| `saut` | chaîne | Le fragment HTML `<br />`. Pour construire du texte destiné à un élément DOM. |
| `uuid` | chaîne | Un UUID fraîchement généré. Chaque évaluation renvoie un nouveau. |

`date X` est une construction apparentée mais prend un opérande — elle analyse une chaîne de date ISO en un horodatage Unix. Voir [arithmétique](arithmetic.md) pour les accesseurs de composantes de temps (`l année de …`, `le mois de …`, etc.).

Les mots-clés liés aux chaînes existent parce que les littéraux entre apostrophes inversées n'ont pas de syntaxe d'échappement. Pour mettre un saut de ligne, une tabulation ou une apostrophe inversée littérale dans une chaîne, concatène le mot-clé avec `cat` :

```as
mets `Appuyez sur la ` cat backtick cat `~` cat backtick cat ` touche.` dans Message
mets `Ligne 1` cat nouvelleligne cat `Ligne 2` dans DeuxLignes
```

Ce sont les seules façons d'introduire ces caractères dans une chaîne littérale.

## Quand la conversion automatique ne suffit pas

### `la valeur de` — conversion explicite chaîne-à-nombre

`la valeur de X` convertit une chaîne en sa valeur numérique. Utilise-la quand une chaîne ressemble à un nombre mais ne se convertit pas automatiquement dans une condition :

```as
mets `04` dans Mm
si la valeur de Mm est pas inférieur à 4 ...   ! comparaison numérique, vrai
si Mm est pas inférieur à `04` ...             ! comparaison de chaînes — donne un mauvais résultat pour « 10 » < « 04 »
```

Sans `la valeur de`, l'opérateur `est` compare les valeurs comme texte. `"04"` et `"10"` comparées comme chaînes traitent `"0"` < `"1"` et donnent la mauvaise réponse. `la valeur de` garantit une vraie comparaison numérique.

`la valeur de` fonctionne aussi avec des opérations de chaîne enchaînées :

```as
si la valeur de gauche 2 de depuis 5 de BookingDate est pas inférieur à 4 ...
```

Ça se lit de gauche à droite : prends `BookingDate`, récupère `depuis position 5`, prends `gauche 2`, puis convertis en valeur. L'enchaînement fonctionne parce qu'AllSpeak évalue de gauche à droite — naturel pour l'anglais, inhabituel pour la plupart des langages de programmation.

### Les chaînes décimales

Pour les chaînes à allure décimale (`3.14`), la conversion n'est pas automatique — l'arithmétique est entière d'abord, et `3.14` reste une chaîne. Voir [arithmétique](arithmetic.md) et [flottants et entiers mis à l'échelle](../idioms/floats-and-scaled-integers.md).

### Inspecter les types

Pour l'inspection, les tests de type sont des conditions :

```as
si X est numérique ...
si X est un tableau ...       ! en forme de JSON
si X est un objet ...      ! en forme de JSON
si X est pair ...
si X est impair ...
```

Voir [conditions](conditions.md).

## JS contre Python

Le modèle de valeurs est partagé entre les runtimes. Les implémentations diffèrent en dessous — JS unifie le stockage par la représentation en chaîne ; Python utilise des `int`, `str`, `bool` natifs et convertit aux frontières des opérations — mais le comportement au niveau script est le même dans les deux. La différence ne compte que si on lit le code source du moteur ou qu'on écrit un greffon.

## Pourquoi trois sortes et pas plus

AllSpeak évite délibérément les hiérarchies de types plus riches des langages grand public. Les trois sortes couvrent tout ce dont tu as besoin pour la logique d'interface, le traitement de données et le flux de contrôle ; les structures plus riches (formes JSON, éléments DOM, modules) sont gérées par des variables typées fournies par le domaine concerné. Garder la couche des valeurs simple rend le moteur petit, le langage uniformément lisible, et la correspondance multilingue directe — chaque sorte a un nom d'un mot facile à traduire.

## Voir aussi

- [variables et tableaux](variables-and-arrays.md) — les variables comme tableaux d'un seul élément ; le modèle du curseur.
- [arithmétique](arithmetic.md) — opérations numériques entières d'abord.
- [chaînes et texte](strings-and-text.md) — opérations sur les chaînes.
- [conditions](conditions.md) — égalité, comparaison, tests de type.
- [collections](collections.md) — types de valeurs en forme de JSON (tableau, objet).
