!   Einkaufsliste 2

    language deutsch

    script Einkaufsliste2

    div Panel
    div Zeile
    knopf Sortiert
    knopf Unsortiert
    variable OriginalListe
    variable AnzeigeListe
    variable A
    variable B
    variable Ergebnis
    variable N
    variable Artikel

    lege leer in OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Fisch`
    setze eigenschaft `price` von Artikel zu 349
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Kartoffeln`
    setze eigenschaft `price` von Artikel zu 105
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Käse`
    setze eigenschaft `price` von Artikel zu 275
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Wein`
    setze eigenschaft `price` von Artikel zu 749
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Zucker`
    setze eigenschaft `price` von Artikel zu 85
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Ananas`
    setze eigenschaft `price` von Artikel zu 93
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Milch`
    setze eigenschaft `price` von Artikel zu 85
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Eier`
    setze eigenschaft `price` von Artikel zu 125
    ergänze Artikel zu OriginalListe
    setze Artikel zu objekt
    setze eigenschaft `name` von Artikel zu `Butter`
    setze eigenschaft `price` von Artikel zu 185
    ergänze Artikel zu OriginalListe

    erstelle Panel
    setze den stil von Panel zu `border:1px solid black;margin:1em;padding:1em`

    erstelle Unsortiert
    setze den stil von Unsortiert zu `margin:1em`
    setze den text von Unsortiert zu `Unsortiert`
    bei klick Unsortiert gehe zu ZeigeUnsortiert

    erstelle Sortiert
    setze den stil von Sortiert zu `margin:1em`
    setze den text von Sortiert zu `Sortiert`
    bei klick Sortiert
    beginn
        lege OriginalListe in AnzeigeListe
        sortiere AnzeigeListe mit PreisSort
        gosub zu Anzeige
    ende

ZeigeUnsortiert:
    lege OriginalListe in AnzeigeListe
    gosub zu Anzeige

    stoppe

Anzeige:
    leere Panel
    lege 0 in N
    solange N ist kleiner als die json anzahl von AnzeigeListe
    beginn
        erstelle Zeile in Panel
        lege element N von AnzeigeListe in Artikel
        setze den inhalt von Zeile zu eigenschaft `name` von Artikel
        addiere 1 zu N
    ende
    retourniere

PreisSort:
    lege arg `a` von AnzeigeListe in A
    lege arg `b` von AnzeigeListe in B
    wenn eigenschaft `price` von A ist größer als eigenschaft `price` von B
        lege 1 in Ergebnis
    sonst wenn eigenschaft `price` von A ist kleiner als eigenschaft `price` von B
        lege -1 in Ergebnis
    sonst lege 0 in Ergebnis
    setze arg `v` von AnzeigeListe zu Ergebnis
    stoppe
