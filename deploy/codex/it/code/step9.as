!   L'onda messicana

    language italiano

	script Onda

    div Contenitore
    div Rettangolo
    variabile Altezza
    variabile Angolo
    variabile Inizio
    variabile Fatto
    variabile TuttiFatti
    variabile Tempo
    variabile N
    variabile NRett

    metti 10 in NRett

    crea Contenitore
    imposta lo stile di Contenitore a
        `position:relative;width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding-bottom:10px;text-align:center`

    imposta gli elementi di Rettangolo a NRett
    imposta gli elementi di Angolo a NRett
    imposta gli elementi di Inizio a NRett
    imposta gli elementi di Fatto a NRett

    metti 0 in N
    mentre N è minore di NRett
    inizio
    	! Inizializza i rettangoli
    	indice Rettangolo a N
	    crea Rettangolo in Contenitore
	    imposta lo stile di Rettangolo a
	       `position:absolute;width:9%;background:peru;`
	        cat `display:inline-block;margin-left:0.5%`
	    imposta stile `top` di Rettangolo a 200
        imposta stile `left` di Rettangolo a `calc(10% * ` cat N cat `)`
	    imposta stile `height` di Rettangolo a `1px`
    	aggiungi 1 a N
    fine

Ciclo:
    attendi 2 secondi

    metti 0 in N
    mentre N è minore di NRett
    inizio
        ! Inizializza gli angoli ecc.
        indice Angolo a N
        indice Inizio a N
        indice Fatto a N
        metti 0 in Angolo
        metti N in Inizio
        moltiplica Inizio per 10
        svuota Fatto
    	aggiungi 1 a N
    fine

	metti 0 in Tempo
    mentre vero
    inizio
	    imposta TuttiFatti
		metti 0 in N
	    mentre N è minore di NRett
	    inizio
	    	indice Rettangolo a N
	    	indice Angolo a N
	    	indice Inizio a N
	    	indice Fatto a N
            se non Fatto
            inizio
            	svuota TuttiFatti
		        se Tempo è maggiore di Inizio
	            inizio
	        		metti cos Angolo radius 100 in Altezza
                    nega Altezza
	        		imposta stile `top` di Rettangolo a `calc(50% - ` cat Altezza cat `px)`
	        		imposta stile `height` di Rettangolo a `calc(100px + ` cat Altezza cat `px)`
        			aggiungi 1 a Angolo
            		se Angolo è maggiore di 360 imposta Fatto
	            fine
            fine
	    	aggiungi 1 a N
	    fine
     	aggiungi 1 a Tempo
        attendi 5 milli
        se TuttiFatti vai a Ciclo
    fine
    ferma
