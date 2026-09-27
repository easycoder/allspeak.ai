!	Doclets

	script Doclets
    
    import module Showdown
    
    variable Script
    
    rest get Script from `/resources/md/doclets.md`

    on message go to Start
    
    set ready
    stop

Start:
    send Script to Showdown
    stop
