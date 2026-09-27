!	Pan e Zoom

    language italiano

	script PanZoom

    div Div
    animazione Anim
    variabile Spec
    variabile AspettoL
    variabile AspettoA
    variabile Larghezza
    variabile Altezza
    variabile Articolo
    variabile Finito

    metti 16 in AspettoL
    metti 9 in AspettoA

    imposta Spec a oggetto
    imposta proprieta `type` di Spec a `panzoom`
    imposta proprieta `width` di Spec a `100%`
    imposta proprieta `height` di Spec a `100%`
    imposta proprieta `url` di Spec a `/resources/img/demo3.jpg`
    imposta proprieta `steps` di Spec a 100
    imposta proprieta `trigger` di Spec a 100
    imposta Articolo a oggetto
    imposta proprieta `left` di Articolo a 30
    imposta proprieta `top` di Articolo a 37
    imposta proprieta `width` di Articolo a 20
    imposta proprieta `start` di Spec a Articolo
    imposta Articolo a oggetto
    imposta proprieta `left` di Articolo a 0
    imposta proprieta `top` di Articolo a 0
    imposta proprieta `width` di Articolo a 100
    imposta proprieta `finish` di Spec a Articolo

!	Ottieni larghezza e altezza
    crea Div
    imposta stile `margin` di Div a `1em 0 0 5%`
    imposta stile `width` di Div a `90%`
	metti la larghezza di Div in Larghezza
    moltiplica Larghezza per AspettoA dando Altezza
    dividi Altezza per AspettoL
    imposta stile `height` di Div a Altezza cat `px`

!	Crea i componenti
    crea Anim in Div
    imposta stile `width` di Anim a `100%`
    imposta stile `height` di Anim a Altezza cat `px`
    imposta la specificazione di Anim a Spec
    su attiva Anim imposta Finito

    attendi 2

!	Avvia l'animazione
	svuota Finito
    avvia Anim
    mentre non Finito
    inizio
    	passo Anim
        attendi 5 ticks
    fine
    stampa `Finito`
    ferma
