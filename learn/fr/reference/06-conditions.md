# Conditions

Une condition est quelque chose qui s'évalue à vrai ou faux. AllSpeak utilise des conditions pilotées par des mots-clés ; il n'y a pas d'opérateurs de comparaison infixes (`==`, `!=`, `>`, `<`, `>=`, `<=`) — en fait, la quasi-totalité des symboles de ponctuation est interdite par conception. AllSpeak vise à être **parlable** : chaque construction se lit comme une phrase de conversation.

Ce fichier liste le vocabulaire de conditions du noyau, que consomment `si` et `tant que`. Les domaines et les extensions peuvent fournir leurs propres conditions — voir [structure](structure.md).

## Égalité et comparaison

`est` teste l'égalité :

```as
si Counter est 0 ...
si Name est `admin` ...
```

`est pas` teste l'inégalité. Pour les langues dont la grammaire le préfère, `pas est` est aussi accepté :

```as
si Status est pas `error` ...
```

La comparaison numérique utilise `est inférieur à` et `est supérieur à` :

```as
si Count est supérieur à 0 ...
si Index est inférieur à la longueur de List ...
```

Pour ≤ et ≥, inverse le test — il n'y a pas de mots-clés du genre « est au plus » / « est au moins » :

```as
si Score est pas inférieur à 60 ...        ! ≥ 60
si Items est pas supérieur à Max ...       ! ≤ Max
```

## Erreurs courantes avec les opérateurs de style C

AllSpeak utilise des conditions à mots-clés. Les opérateurs de style C ne sont **pas valides** :

| Incorrect (style C) | Correct (AllSpeak) |
|---|---|
| `if X == 0` | `si X est 0` |
| `if X != 0` | `si X est pas 0` |
| `if X > 5` | `si X est supérieur à 5` |
| `if X < 5` | `si X est inférieur à 5` |
| `if X >= 5` | `si X est pas inférieur à 5` |
| `if X <= 5` | `si X est pas supérieur à 5` |

Les formes à mots-clés se lisent de gauche à droite, comme une phrase naturelle. Une IA qui retombe par défaut sur les opérateurs de style C produira du code invalide — utilise toujours les formes à mots-clés.

## Erreurs courantes : comparaison de chaînes contre nombres

`est` compare les valeurs comme texte par défaut. En comparant une chaîne comme `"04"` avec un nombre, la comparaison est lexicale (caractère par caractère), pas numérique :

```as
si Mm est pas inférieur à `04`     ! comparaison de chaînes — marche pour "05" mais casse pour "10" < "04"
```

Pour comparer numériquement, utilise `la valeur de` pour convertir la chaîne en nombre d'abord :

```as
si la valeur de Mm est pas inférieur à 4    ! comparaison numérique — marche pour toutes les valeurs
```

`la valeur de X` est documenté dans [valeurs et types](values-and-types.md).

## Négation

Négue une condition avec `pas` au début, ou utilise `est pas` dans la condition :

```as
si pas Clicked ...
si Count est pas 0 ...
```

La négation par parenthèses n'existe pas — `si pas (Count est 0)` n'est pas de l'AllSpeak valide. Utilise `si Count est pas 0` à la place.

## Tests booléens

Une valeur nue est un test de vérité :

```as
si Clicked ...                      ! vrai si Clicked est truthy
si Found définis le contenu de Status à `OK`
```

Pour un test booléen explicite :

```as
si Clicked est vrai ...
si Clicked est faux ...
```

## Tests de type

`est numérique` teste si une valeur peut être utilisée comme nombre :

```as
si Input est numérique ...
```

`est un tableau` et `est un objet` testent si une valeur contient une collection en forme de JSON :

```as
si Response est un tableau ...
si Config est un objet ...
```

`est pair` et `est impair` testent la parité :

```as
si Counter est pair ...
```

## Conditions sur les chaînes

`contient` teste la présence d'une sous-chaîne :

```as
si Path contient `/api/` ...
si Email contient `@` ...
```

`commence avec` et `termine avec` testent le préfixe/le suffixe :

```as
si Name commence avec `Dr ` ...
si File termine avec `.json` ...
```

## Conditions composées

`et` et `ou` relient deux conditions :

```as
si Count est supérieur à 0 et Count est inférieur à 100 ...
si Status est `error` ou Status est `timeout` ...
```

Il n'y a pas de précédence d'opérateur entre `et` et `ou` — utilise des instructions `si` séparées ou des blocs `début`/`fin` imbriqués pour lever l'ambiguïté d'une logique complexe.

Une chaîne de deux conditions reste généralement lisible. Pour trois conditions ou plus, envisage d'extraire les conditions dans des variables booléennes :

```as
si Count est supérieur à 0
    et Count est inférieur à 100
    et Status est pas `error` ...
```

## Voir aussi

- [valeurs et types](values-and-types.md) — règles de vérité, l'indicateur numérique, `la valeur de`.
- [chaînes et texte](strings-and-text.md) — `contient`, `commence avec`, `termine avec`.
- [flux de contrôle](control-flow.md) — `si`, `tant que`, `début`/`fin`.
