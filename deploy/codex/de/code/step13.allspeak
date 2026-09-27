!   Einkaufsliste

    language deutsch

    script Einkaufsliste

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

    lege leer in OriginalListe
    ergänze `Fisch` zu OriginalListe
    ergänze `Kartoffeln` zu OriginalListe
    ergänze `Käse` zu OriginalListe
    ergänze `Wein` zu OriginalListe
    ergänze `Zucker` zu OriginalListe
    ergänze `Ananas` zu OriginalListe
    ergänze `Milch` zu OriginalListe
    ergänze `Eier` zu OriginalListe
    ergänze `Butter` zu OriginalListe

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
        sortiere AnzeigeListe mit AlphabetSort
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
        setze den inhalt von Zeile zu element N von AnzeigeListe
        addiere 1 zu N
    ende
    retourniere

AlphabetSort:
    lege arg `a` von AnzeigeListe in A
    lege arg `b` von AnzeigeListe in B
    wenn A ist größer als B lege 1 in Ergebnis
    sonst wenn A ist kleiner als B lege -1 in Ergebnis
    sonst lege 0 in Ergebnis
    setze arg `v` von AnzeigeListe zu Ergebnis
    stoppe
