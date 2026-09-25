!! The Codex IDE: a single-page reader that walks the Primer a step at a time, showing each step's code beside its prose.
!!
!! Every element the script shows is declared before anything runs, because `create` and `attach` take a declared name rather than a string — so this list is the script's vocabulary, and an element missing from it cannot be drawn at all. That is also why the run is long and repetitive: it is a map of the interface, not of the logic.
!!
!! This first group is the reading surface itself: the screen, the code and prose panes, the panels that replace them, and the buttons that drive it.

!	AllSpeak Codex

    script Codex

	div Body
    div Screen
    div CodePanel
    div NonCodePanel
    div RunPanel
    div HelpOuter
    div HelpInner
    div HelpPanel
    div ReferencePanel
    div Container
    div Controls
    div Buttons
    div HelpButtons
    div ScriptName
    div ContentDiv
    div Clear
!    div Tracer
    input NameEditor
    textarea ContentEditor
    span Status
    span Span
    img New
    img Open
    img Save
    img RunStop
    img Delete
    img Cycle
    img Back
    img Forward
    img Banner
    img Reference
    img Tools
    img Exit
    img Contents
    a Copy
    a Next
    a Link
    a Index
    module TestModule
	module DocManModule
  	callback DecoratorCallback
!! @hash 94fa0edc
!!!
!! The state the reader keeps: which step and view are showing, the script being demonstrated, and the strings loaded for the chosen language.
!!
!! They are declared together rather than beside first use, so the names, and the fact that they are shared for the whole session, are visible in one place. `Pages`, `Strings` and `List` all arrive from the server during startup, which is why they exist before it runs.

    variable Args
    variable Arg
    variable Name
    variable CallStack
    variable CurrentName
    variable Content
    variable Current
    variable Pages
    variable Page
    variable Script
    variable List
    variable Fragment
    variable Mobile
    variable Running
    variable View
    variable Step
    variable Message
    variable ShowRun
    variable LinkCount
    variable Data
    variable Payload
    variable ECPayload
    variable Size
    variable A
    variable B
    variable IA
    variable IB
    variable CopyDelay
    variable V
    variable Lang
    variable Strings
    variable BasePath
!! @hash 7fd9e82b
!!!

!! The file browser: an overlay that lists the server's own scripts, so a reader can open one without leaving the page.
!!
!! It is declared apart from the reading surface because it is a mode rather than a panel — it covers everything and is torn down again — and its own nouns (`FileListing`, `FileRow`, `Scroller`) are the vocabulary the listing code works in.

  ! The browser
    div Overlay
    div Scroller
    div Media
    div FileListing
    div FileRow
    div LowerPanel
    button CloseButton
    a FileName
    variable Alpha
    variable FileList
    variable FileCount
    variable File
    variable Files
    variable N
    variable FileIsOpen
    variable Item
    variable Items
!! @hash 56ef15f1
!!!

!    debug step
    
!! Before anything is drawn the reader's language is decided and the strings for it are fetched, because every word in the interface comes from that file rather than from this script.
!!
!! The language arrives as `?lang=xx` on the URL, which is how one build serves every language without a server-side router; anything after an ampersand is dropped because other arguments may follow. The fallback to `en` matters — without it a missing argument leaves the interface with no words at all — and if the strings themselves cannot be fetched the script stops rather than drawing an interface it cannot label.
!!
!! `BasePath` is the single place where a language becomes a path, so a second language needs no change anywhere else.

    load showdown
	rest get ECPayload from `/codex/fragments/ec.txt`
	or put `<strong>AllSpeak</strong>` into ECPayload
  	json parse url the location as Args
    put property `arg` of Args into Arg
    if left 5 of Arg is `lang=`
    begin
        put from 5 of Arg into Lang
!       Strip anything after an ampersand
        put the position of `&` in Lang into N
        if N is greater than -1 put left N of Lang into Lang
    end
    else put `en` into Lang
    put Lang into storage as `.docman-lang`
    put `/codex/` cat Lang into BasePath

    rest get Strings from BasePath cat `/strings.json`
        or go to StringsFailed
!! @hash 3a57b8b2
!!!
!! The browser's back and forward buttons are wired to the step the reader was on, so moving through the Primer behaves like moving through any other page instead of dropping the reader out of it.
!!
!! `CallStack` is the record: each step shown is pushed on, and a restore pops two entries before showing the one beneath. The `go to SHP2` is the part that does not explain itself — `SHP2` sits in a family whose neighbours put the help panel up, and `StepBack` reaches the same family to redraw the page, so it is almost certainly that shared continuation — but the name still does not say so.

    print `Static site`
    put empty into CallStack
    history set
    on restore
    begin
        put the json count of CallStack into N
        if N is less than 2 stop
        take 1 from N
        json delete element N of CallStack
        take 1 from N
        put element N of CallStack into Step
        go to SHP2
    end
!! @hash 59cbceb3
!!!

!! What the reader is reading on decides two things: whether the layout is a column or full width, and whether the run panel is offered at all. `portrait` and `mobile` are the runtime's own questions, so the script asks them rather than inspecting the user agent.
!!
!! The requires are the editor's dependencies, grouped because they arrive together: gmap and svg for the steps that use them, and CodeMirror with the search add-ons for the code panes. Each carries a version, so a browser cannot serve a stale plugin after a release. `Pages` is fetched here because it is the reader's index, and everything after this point assumes it exists.

    if portrait
    begin
    	if mobile set Mobile else clear Mobile
    end
    set ShowRun

    require js `dist/plugins/gmap.js?v=26041102`
    require js `dist/plugins/svg.js?v=26041102`

    codemirror init basic profile `/dist/plugins/codemirror-ecs.js`
    require css `/dist/plugins/codemirror/addon/dialog/dialog.css`
    require js `/dist/plugins/codemirror/addon/dialog/dialog.js`
    require js `/dist/plugins/codemirror/addon/search/search.js`
    require js `/dist/plugins/codemirror/addon/search/searchcursor.js`
    require js `/dist/plugins/codemirror/addon/search/jump-to-line.js`

    rest get Pages from BasePath cat `/pages.json`
!! @hash b093b8de
!!!

!! The reader's place is remembered in storage, so returning to the page resumes where they stopped rather than at the beginning. The check is on the shape of the stored name rather than on its value, which is all the storage contract needs, and `step0` is the fallback.

    get Step from storage as `.step`
    if left 4 of Step is not `step`
    begin
    	put `step0` into Step
        put Step into storage as `.step`
    end
!! @hash 39c3e5b2
!!!
    
!! The interface is built from the outside in as a flex column — a screen, a container, a control bar — and the order is forced by the DOM: `create ... in ...` needs its parent to exist already, so this run is the structure written once, in the order the browser will build it.
!!
!! The buttons are made the same way each time, a link wrapping an image with a width, a right margin and a tooltip taken from the strings, which is why the run repeats itself. The repetition is preferred to a rule: the buttons differ only in those three values, and naming the differences would cost more than writing them out.
!!
!! `Status` is the one element whose style is chosen by device rather than by panel: on desktop it floats at the right of the bar, on mobile it takes a line of its own. The rest of the responsive layout is done by swapping panels instead.

    create Body
    if Mobile
	    set the style of Body to `width:100%;height:100%`
    else
	    set the style of Body to `width:100%;height:100%;display:flex`

    create Screen in Body    
    create Container in Screen
	set the style of Container to `width:100%;height:100%;display:flex;flex-direction: column`
    
    create Controls in Container
    set the style of Controls to `flex:5em`

    create Buttons in Controls
    set the style of Buttons to `width:100%;padding:0.5em`

    create Link in Buttons
    create New in Link
    set the style of New to `width:40px;margin-right:0.5em`
    set attribute `src` of New to `codex/icon/new.png`
    set attribute `title` of New to property `tooltipNew` of Strings
    create Open in Link
    set the style of Open to `width:40px;margin-right:0.5em`
    set attribute `src` of Open to `codex/icon/open.png`
    set attribute `title` of Open to property `tooltipOpen` of Strings
    create Link in Buttons
    create Save in Link
    set the style of Save to `width:40px;margin-right:1.5em`
    set attribute `src` of Save to `codex/icon/save.png`
    set attribute `title` of Save to property `tooltipSave` of Strings
    create Link in Buttons
    create Delete in Link
    set the style of Delete to `width:40px;margin-right:1.5em`
    set attribute `src` of Delete to `codex/icon/trash.png`
    set attribute `title` of Delete to property `tooltipDelete` of Strings
    create Link in Buttons
    create RunStop in Link
    set the style of RunStop to `width:40px;margin-right:1.5em`
    set attribute `src` of RunStop to `codex/icon/run.png`
    set attribute `title` of RunStop to property `tooltipRun` of Strings
   	create Link in Buttons
   	create Cycle in Link
   	set the style of Cycle to `width:40px`
   	set attribute `src` of Cycle to `codex/icon/cycle.png`
   	set attribute `title` of Cycle to property `tooltipCycle` of Strings

    create Status in Buttons
    if Mobile set the style of Status to `height:1em;color:green`
    else set the style of Status to `float:right;margin:0.5em 2em 0 0;color:green`
!! @hash 672591bc
!!!

!! The script's name sits above its code and is editable in place, so a reader can rename what they are working on without leaving the step. On mobile the row is hidden — there is no width to spare beside the code, and the name is already in the tab title.

    create ScriptName in Controls
    set the style of ScriptName to `display:flex;margin:0.5em 0;padding:0.5em`
    if Mobile set style `display` of ScriptName to `none`
    create Span in ScriptName
    set the style of Span to `flex:15`
    set the content of Span to property `scriptName` of Strings
    create NameEditor in ScriptName
    set the style of NameEditor to `flex:85;display:inline-block`
!! @hash 9781de03
!!!

!! The code area scrolls sideways instead of wrapping, which is the reason for the explicit `overflow-x:scroll` and the matching hidden vertical. A wrapped line of code breaks the correspondence between a line number and a line, and on a phone it would reflow every step at once.
!!
!! The mobile branch sets both dimensions explicitly, where the desktop branch leaves them implicit. The difference matters once the editor positions its own content inside: a scroll container sized implicitly collapses around absolutely positioned children.

	create ContentDiv in Container
    set the style of ContentDiv to `flex:1`
    if Mobile
    begin
    	set the style of ContentDiv to
        	`position:relative;width:100%;height:100%;overflow-x:scroll;overflow-y:hidden`
	end
    else
    begin
    	set the style of ContentDiv to `width:100%;height:100%;overflow-x:scroll;overflow-y:hidden`
!! @hash 707eb796
!!!
	end

!! Where the code, the output and the help appear depends on the device, and the two branches are the two answers. On desktop all three are rows of the screen, each half its height; on mobile they replace one another, so the panels are created in a different parent and the code panel starts hidden.
!!
!! The panels are built inside the branch rather than above it because `create ... in ...` needs the parent that this branch decides, and there is no one parent that suits both devices.

   	create CodePanel in ContentDiv
   	create ContentEditor in CodePanel
	set the style of ContentEditor to `width:100%;height:100%;border:none`
    
	codemirror attach to ContentEditor
    set FileIsOpen

    if Mobile
    begin
        set the style of CodePanel to `display:none`
        create NonCodePanel in ContentDiv
	    create RunPanel in NonCodePanel
    	set the style of RunPanel to `display:none`

		create HelpOuter in NonCodePanel
        set the style of HelpOuter to `width:100%;height:100%;overflow-y:scroll`
    end
    else
    begin
		set the style of Screen to `flex:50;height:100%;overflow:hidden;border:1px solid gray`
	    create RunPanel in Body
    	set the style of RunPanel to `display:none;flex:50;margin-left:1em;border:1px solid gray`

		create HelpOuter in Body
    	set the style of HelpOuter to
        	`flex:50;margin-left:1em;`
            cat `border:1px solid gray;padding:0 0.5em;overflow-y:scroll`
    end
!! @hash eb6e24db
!!!

!! The help panel carries its own navigation — back, forward, contents, the reference, the tools and the way out — because help is a place the reader can wander into, and everything needed to leave it again should be reachable from inside it.
!!
!! Each button is a link wrapping an icon with a tooltip taken from the strings, so the words a reader sees are translated with the rest of the interface instead of being baked into the images.

    create Banner in HelpOuter
    set the style of Banner to `width:100%`
    set attribute `src` of Banner to `codex/images/banner.png`
    
    create HelpButtons in HelpOuter
    set the style of HelpButtons to `text-align:center;height:40px`
    create Link in HelpButtons
    create Back in Link
       set the style of Back to `width:40px`
    set attribute `src` of Back to `codex/icon/arrow-back.png`
    set attribute `title` of Back to property `tooltipPrev` of Strings
    create Link in HelpButtons
    create Forward in Link
       set the style of Forward to `margin-left:1em;width:40px`
    set attribute `src` of Forward to `codex/icon/arrow-forward.png`
    set attribute `title` of Forward to property `tooltipNext` of Strings
    create Link in HelpButtons
    create Contents in Link
    set the style of Contents to `margin-left:1em;width:40px`
    set attribute `src` of Contents to `codex/icon/list.png`
    set attribute `title` of Contents to property `tooltipContents` of Strings
    create Link in HelpButtons
    create Reference in Link
    set the style of Reference to `margin-left:1em;width:40px`
    set attribute `src` of Reference to `codex/icon/book.png`
    set attribute `title` of Reference to property `tooltipReference` of Strings
    create Link in HelpButtons
    create Tools in Link
    set the style of Tools to `margin-left:1em;width:40px`
    set attribute `src` of Tools to `codex/icon/tools.png`
    set attribute `title` of Tools to property `tooltipTools` of Strings
    create Link in HelpButtons
    create Exit in Link
    set the style of Exit to `margin-left:1em;width:40px`
    set attribute `src` of Exit to `codex/icon/exit.png`
    set attribute `title` of Exit to property `tooltipExit` of Strings
!! @hash 1fc7094e
!!!
    
!! Two panels share the space below those buttons: the help page itself and the language reference, each hidden until something shows it. They are built here rather than on demand, so that switching between them is a style change rather than a rebuild — a reference opened from a step is expected to appear at once.
!!
!! Neither panel holds any text of its own. The words arrive from the server, from `pages.json` beside the language's strings, so a step's help is data rather than markup.

    create HelpInner in HelpOuter
    set the style of HelpInner to `width:100%;line-height:1.5em`

	create HelpPanel in HelpInner
	set the style of HelpPanel to `display:none;width:100%;height:100%`
	create ReferencePanel in HelpInner
	set the style of ReferencePanel to `display:none;width:100%;height:100%`
!! @hash 1b208ddf
!!!

	gosub to ShowHelpPage
    rest get Script from `/resources/ecs/docman.as?v=` cat now
	run Script with ReferencePanel as DocManModule
	put empty into storage as `.ref`

	get Item from storage as `.ref`
    if Item
    begin
	    set style `display` of ReferencePanel to `block`
        set style `display` of HelpButtons to `none`
    end
    else set style `display` of HelpPanel to `block`

    on click Back go to StepBack
    on click Forward go to StepForward
    on click Contents go to ShowContents
    on click Reference
    begin
	    set style `display` of ReferencePanel to `block`
        set style `display` of HelpPanel to `none`
        set style `display` of HelpButtons to `none`
        put `y` into storage as `.ref`
    end
    on click Tools
    begin
    	put `tools` into Step
		gosub to ShowHelpPage
    end
	on click Exit
    begin
		stop DocManModule
    	remove element Body
        location `https://allspeak.ai/` cat Lang cat `/primer.html`
        exit
    end
    
    on message
    begin
    	put the message into Message
    	if Message is `next` go to StepForward
        if Message is `tutorial`
        begin
		    	set style `display` of ReferencePanel to `none`
	        set style `display` of HelpPanel to `block`
	        set style `display` of HelpButtons to `block`
	        put empty into storage as `.ref`
        end
    end
    
    on error
    begin
    	gosub to StopTestModule
        clear Running
        set attribute `src` of RunStop to `codex/icon/run.png`
    end
   
!! The file browser is an overlay rather than a panel because a reader opens it over whatever they were doing and expects to come back to it: the listing floats centred, and the backdrop is fully transparent (`rgba(0,0,0,0.0)`) rather than dimmed, so the step stays visible behind it.
!!
!! `Scroller` exists because the listing can outgrow the space it is given, and `LowerPanel` holds the controls that are not files — starting with the way to close it again.

    create Overlay in Body
    set the style of Overlay to
      `position:absolute;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.0);display:none`

    create Media in Overlay
    set style of Media to `display:none;width:100%;height:100%;text-align:center`

    create FileListing in Media
    set the style of FileListing to
      `display:none;width:50%;height:75%;margin:auto;background-color:white;`
      cat `padding:2em 2em 3em 2em;text-align:center;position: absolute;top: 50%;left: 50%;`
      cat `transform: translateX(-50%) translateY(-50%)`

    create Scroller in FileListing
    set the style of Scroller to `height:100%;overflow:scroll;text-align:left`
    
    create LowerPanel in FileListing
    
    create CloseButton in LowerPanel
    set the style of CloseButton to `margin-left:2em`
!! @hash 20d919ff
!!!
    set the text of CloseButton to property `close` of Strings

    put empty into Current
    
    on click New
    begin
    	gosub to StopTestModule
    	if Mobile
        begin
	    	put `code` into View
        	gosub to SetView
		end
        codemirror close ContentEditor
    	put the content of ContentEditor into Content
    	if Content is not Current
    	begin
			if confirm property `confirmSave` of Strings
			begin
      			put the content of NameEditor into Name
      			if Name is empty
      			begin
        			set the content of Status to property `noScriptName` of Strings
        			go to ResetStatus
      			end
    	  		put Content into storage as CurrentName
            end
    	end
    	clear FileIsOpen
        set the content of ContentEditor to empty
      	codemirror attach to ContentEditor
        set the content of NameEditor to empty
        put empty into Content
        put Content into Current
	end

    on click Save
    begin
        put the content of NameEditor into Name
        if Name is empty
        begin
            set the content of Status to property `noScriptName` of Strings
            go to ResetStatus
        end
        if the position of `.as` in Name is -1 put Name cat `.as` into Name
        replace ` ` with `_` in Name
        codemirror close ContentEditor
        put the content of ContentEditor into Content
        codemirror attach to ContentEditor
        if Content is not Current
        begin
            put Content into storage as Name
            put Content into Current
            set the content of Status to `'` cat Name cat `' ` cat property `saved` of Strings
            fork to ResetStatus
        end
        else
        begin
            set the content of Status to property `nothingChanged` of Strings
            fork to ResetStatus
        end
    end
    
    on click Delete
    begin
        put the content of NameEditor into Name
        if Name is empty
        begin
            alert property `nothingToDelete` of Strings
            stop
        end
        if confirm property `confirmDelete` of Strings cat ` "` cat Name cat `"?`
        begin
            codemirror close ContentEditor
            set the content of ContentEditor to empty
            codemirror attach to ContentEditor
            remove Name from storage
            set the content of Status to `"` cat Name cat `" ` cat property `deleted` of Strings
            set the content of NameEditor to empty
            put empty into Content
            put Content into Current
            go to ResetStatus
        end
    end
    
    clear Running
    put `help` into View

    on click Open go to DoOpen
    on click RunStop go to DoRunStop
    
    on click Cycle
    begin
    	if Mobile
        begin
    		if View is `help`
            begin
            	put `code` into View
            end
        	else if View is `code`
        	begin
        		if Running put `run` into View
            	else put `help` into View
        	end
        	else if View is `run` put `help` into View
        	goto SetView
        end
        else
        begin
    		if View is `help`
            begin
            	if Running
                begin
	            	set style `display` of RunPanel to `block`
    	        	set style `display` of HelpOuter to `none`
        	    	put `run` into View
                end
            end
        	else
            begin
            	set style `display` of RunPanel to `none`
            	set style `display` of HelpOuter to `block`
            	put `help` into View
            end
        end
    end

    put property `arg` of Args into Arg
    if left 2 of Arg is `s=`
    begin
    	put from 2 of Arg into Step
        gosub to SHP2
        history set url `.`
    end
    
    set ready
    stop

DoOpen:
	gosub to StopTestModule

    if Mobile
    begin
    	put `code` into View
    	gosub to SetView
    end
	codemirror close ContentEditor
    clear FileIsOpen
    put the content of ContentEditor into Content
    if Content is not Current
    begin
      if confirm property `confirmSave` of Strings
      begin
      	put Content into storage as Name
      end
    end

  ! Animate the background
    set style `display` of Overlay to `block`
    put 0 into Alpha
    while Alpha is less than 8
    begin
      set style `background-color` of Overlay to `rgba(0,0,0,0.` cat Alpha cat `)`
      wait 4 ticks
      add 1 to Alpha
    end
    wait 10 ticks

  ! Make the browser panel visible
    set style `display` of Media to `block`
    set style `display` of FileListing to `inline-block`

  ! Fill the browser with content from the server
    get Files from storage
    put the json count of Files into FileCount
    put empty into Content
    put 0 into N
    while N is less than FileCount
    begin
        put element N of Files into Item
        if left 1 of Item is not `.` json add Item to Content
        add 1 to N
    end
    json sort Content
    put empty into FileList
    put the json count of Content into FileCount
    set the elements of File to FileCount
    set the elements of FileName to FileCount
  ! Add a row for each file
    put 0 into N
    while N is less than FileCount
    begin
      index File to N
      index FileName to N
      put `<div id="ec-file-row-INDEX" style="clear:both;padding:0.25em 0;">`
        cat `<a id="ec-file-name-INDEX" href="#"></a></div>` into File
      replace `INDEX` with N in File
      if N is even replace `ODDEVEN` with `ec-even` in File
      else replace `ODDEVEN` with `ec-odd` in File
      put FileList cat File into FileList
      add 1 to N
    end

    set the content of Scroller to FileList
  ! Add the document names
    put 0 into N
    while N is less than FileCount
    begin
      index File to N
      index FileName to N
      put element N of Content into File
      attach FileRow to `ec-file-row-` cat N
      attach FileName to `ec-file-name-` cat N
      set the content of FileName to File
      if N is even set style `background` of FileRow to `lightgray`
      on click FileName go to SelectFile
      add 1 to N
    end
    on click CloseButton
    begin
      put Current into Content
      go to CloseBrowser
    end
    stop
    
SelectFile:
    index File to the index of FileName
    set the content of NameEditor to File
	get Content from storage as File
    put Content into Current
    set the content of Status to `'` cat File cat `' ` cat property `loaded` of Strings
    fork to ResetStatus
    set ShowRun

CloseBrowser:
    set style `background-color` of Overlay to `rgba(0,0,0,0.0)`
    set style `display` of Overlay to `none`
    set style `display` of Media to `none`
    codemirror attach to ContentEditor
    codemirror set content of ContentEditor to Content
    stop

SetView:
	if View is `code`
    begin
    	set style `display` of CodePanel to `block`
    	set style `display` of NonCodePanel to `none`
        set style `display` of ScriptName to `block`
        codemirror attach to ContentEditor
    end
	else if View is `run`
    begin        
    	set style `display` of CodePanel to `none`
    	set style `display` of NonCodePanel to `block`
    	set style `display` of RunPanel to `block`
    	set style `display` of HelpOuter to `none`
        set style `display` of ScriptName to `none`
    end
	else if View is `help`
    begin     
    	set style `display` of CodePanel to `none`
    	set style `display` of NonCodePanel to `block`
    	set style `display` of RunPanel to `none`
    	set style `display` of HelpOuter to `block`
        set style `display` of ScriptName to `none`
    end
	return

ResetStatus:
    wait 2
    set the content of Status to ``
    stop

ShowContents:
	put `contents` into Step
	gosub to ShowHelpPage
    stop

ShowHelpPage:
    append Step to CallStack
SHP1:
    history push url `codex.html?s=` cat Step
SHP2:
	put Step into storage as `.step`
    put BasePath cat `/code/` cat Step cat `.as` into Item
    rest get Fragment from Item or put empty into storage as `.step`
    put property Step of Pages into Page
    if property `prev` of Page is empty set style `visibility` of Back to `hidden`
    else set style `visibility` of Back to `visible`
    if property `next` of Page is empty set style `visibility` of Forward to `hidden`
    else set style `visibility` of Forward to `visible`

    if Step is `contents`
    begin
    	put empty into List
		put 0 into N
		while N is less than 100
		begin
			put `step` cat N into Item
			put property Item of Pages into Page
			if Page is empty put 100 into N
			else
			begin
				append Page to List
				add 1 to N
			end
		end
		put property `gap` of Pages into Page
		if Page is not empty append Page to List
        put the json keys of Pages into Items
        put 0 into N
        while N is less than the json count of Items
        begin
            put element N of Items into Item
            if left 4 of Item is not `step`
            begin
                if Item is not `gap`
                begin
                    if Item is not `background`
                    begin
                        if Item is not `tools`
                        begin
                            if Item is not `contact`
                            begin
                                put property Item of Pages into Item
                                if property `index` of Item is greater than 21 append Item to List
                            end
                        end
                    end
                end
            end
            add 1 to N
        end
		put property `background` of Pages into Page
		if Page append Page to List
		put property `tools` of Pages into Page
		if Page append Page to List
		put property `contact` of Pages into Page
		if Page append Page to List
    	put property `contentsHeading` of Strings into Script
        put 0 into N
        while N is less than the json count of List
        begin
        	put element N of List into Item
            if property `title` of Item is `gap` put Script cat `<br>` into Script
            else
            begin
	            put Script cat `<a id="list-` cat N cat `" href="#" data-file="` cat property `file` of Item into Script
	            put Script cat `">` cat property `title` of Item into Script
	            put Script cat `</a><br>` into Script
            end
            add 1 to N
        end
    end
    else
    begin
		put BasePath cat `/md/` cat Step cat `.md` into Item
    	rest get Script from Item or
        begin
        	alert `'` cat Item cat `' ` cat property `scriptNotFound` of Strings
            put empty into Script
        end
      replace `<` with `&lt;` in Script
      replace `>` with `&gt;` in Script
	  put `<pre>` cat Fragment cat `</pre>` into Payload
	  replace `~step~` with Payload in Script
    end
    gosub to ProcessMarkdown
    if Step is `contents`
    begin
        set the elements of Index to the json count of List
        put 0 into N
        while N is less than the json count of List
        begin
        	index Index to N
        	put element N of List into Item
        	if property `title` of Item is not `gap` attach Index to `list-` cat N
        	on click Index
        	begin
            	put attribute `data-file` of Index into Step
            	goto ShowHelpPage
        	end
            add 1 to N
        end
    end
    scroll HelpOuter to 0

SHP3:
    if Script is not empty
    begin
	   	attach Copy to `copy` or goto SHP4
	   	set the style of Copy to
       		`border:1px solid black;border-radius:0.5em;padding:0.3em;background:lightgray;text-decoration:none`
	    on click Copy
	    begin
        	gosub to StopTestModule
        	put `code` into View
            codemirror close ContentEditor
            set the content of ContentEditor to Fragment
            if Mobile gosub to SetView
            else codemirror attach to ContentEditor
            codemirror set content of ContentEditor to Fragment
            if Mobile
            begin
                put the length of Fragment into CopyDelay
                multiply CopyDelay by 20 giving CopyDelay
                divide CopyDelay by 1000
                add 4 to CopyDelay
                if CopyDelay is less than 6 put 6 into CopyDelay
                if CopyDelay is greater than 24 put 24 into CopyDelay
                wait CopyDelay ticks
                codemirror set content of ContentEditor to Fragment
            end
            set the text of NameEditor to empty
            attach Clear to `clear` or stop
            clear ShowRun
 	   	end
    end

SHP4:
    attach Next to `next` or return
    on click Next
    begin
    	put property Step of Pages into Page
        if property `next` of Page is not empty
        begin
	        put property `next` of Page into Step
            goto ShowHelpPage
        end
    end
	return

!! The step's markdown is rendered into the help panel through `showdown`, with `Decorate` consulted as the decorator for every substitution. That is what lets the Primer's prose carry live pieces of AllSpeak — a snippet, a quotation, a runnable example — instead of only text.
!!
!! The links `showdown` produced are wired by hand afterwards, because a link in rendered text is not a click until something attaches it. Each carries a `data-codexid` naming the step it points at, so following one is the same journey as pressing Forward.
!!
!! The comment on this label still asks for the links to be counted and the listeners set up. The code below does both, so the note is spent and only the label line keeps it alive.

ProcessMarkdown: ! TODO Count the links & set up listeners
  on DecoratorCallback go to Decorate
  put 0 into LinkCount
  set the content of HelpPanel to showdown decode Script with DecoratorCallback
  set the elements of Link to LinkCount
  put 0 into N
  while N is less than LinkCount
  begin
    index Link to N
    attach Link to `ec-link-` cat N
    add 1 to N
  end
  on click Link
  begin
    put attribute `data-codexid` of Link into Step
    goto ShowHelpPage
  end
  return
!! @hash a671e565
!!!

!! Where the Primer's prose needs something AllSpeak-aware it writes a short prefix — `ec`, `quot:`, `code:`, `step`, `pre:`, `copy` — and this turns each one into markup. It is a very small markup language, and it exists so that the tutorial's text can hold working examples without the markdown carrying HTML around.
!!
!! The prefixes are tested in order and the first match wins, so the order is also the precedence: a payload beginning with two of them is treated as the earlier one. `ec` is the fragment fetched at startup, which is why its text is not written here.

Decorate:
  put the payload of DecoratorCallback into Payload
  if Payload is `ec` put ECPayload into Payload
  else if left 5 of Payload is `quot:`
  begin
  	put `<span style="font-family:mono;font-size:90%;color:darkred">`
  	cat `&#96;` cat from 5 of Payload into Payload
    put Payload cat `&#96;` cat `</span>` into Payload
  end
  else if left 5 of Payload is `code:`
  begin
  	put `<span style="font-family:Courier New;color:darkred">`
  	cat from 5 of Payload into Payload
    put Payload cat `</span>` into Payload
  end
  else if left 4 of Payload is `step`
  begin
  	put `<pre>` cat Fragment cat `</pre>` into Payload
  end
  else if left 4 of Payload is `pre:`
  begin
  	put `<pre>` cat from 4 of Payload into Payload
    put Payload cat `</pre>` into Payload
  end
  else if left 4 of Payload is `copy`
  begin
  	put `<button id="copy">` cat property `copyToEditor` of Strings cat `</button>` into Payload
  end
  else if left 5 of Payload is `icon:`
  begin
  	put from 5 of Payload into Payload
    put the position of `:` in Payload into N
    put left N of Payload into Name
    add 1 to N
    put from N of Payload into Payload
    put the position of `:` in Payload into N
    put left N of Payload into Size
    add 1 to N
    put from N of Payload into Payload
    put `<img src="codex/icon/` cat Name
    	cat `.png" style="width:` cat Size cat `;height:` cat Size
        cat `" title="` cat Payload cat `" />` into Payload
  end
  else if left 5 of Payload is `link:`
  begin
  	put from 5 of Payload into Payload
    put the position of `:` in Payload into N
    put left N of Payload into Data
    add 1 to N
    put from N of Payload into Payload
  	put `<b><a href="#" id="ec-link-` cat LinkCount cat `" data-codexid="` cat Data cat `">`
    	cat Payload cat `</a></b>` into Payload
  	add 1 to LinkCount
  end
  else if left 5 of Payload is `next:`
  begin
    put `<h2>` cat property `next` of Strings cat `<a href="#" id="next">` cat from 5 of Payload into Payload
    put Payload cat `</a></h2>` into Payload
  end
  set the payload of DecoratorCallback to Payload
  stop
!! @hash fec99f1e
!!!

!! A comparator for `sort ... with ...`: given two entries of the list as `arg a` and `arg b`, it reads the `index` each carries and sets `arg v` to -1, 0 or 1, so the sort knows which comes first.
!!
!! The two `add 0` lines are there to force a numeric comparison. Without them the properties would be compared as text, where `10` sorts before `9`.

ListSorter:
    put arg `a` of List into A
    put arg `b` of List into B
    put property `index` of A into IA
    put property `index` of B into IB
    add 0 to IA
    add 0 to IB
    if IA is greater than IB put 1 into V
    else if IA is less than IB put -1 into V
    else put 0 into V
    set arg `v` of List to V
    stop
!! @hash fb88db29
!!!

StepBack:
    put property Step of Pages into Page
    if property `prev` of Page is not empty
    begin
        put property `prev` of Page into Step
        goto ShowHelpPage
    end
	stop

StepForward:
    put property Step of Pages into Page
    if property `next` of Page is not empty
    begin
        put property `next` of Page into Step
        goto ShowHelpPage
    end
	stop
    
DoRunStop:
    if Running
    begin
    	gosub to StopTestModule
        if Mobile set style `display` of ScriptName to `block`
        stop
    end

    codemirror close ContentEditor
    put the content of ContentEditor into Script
    codemirror attach to ContentEditor

    if Script is empty
    begin
    	alert property `nothingToRun` of Strings
    	stop
    end
    
	put `run` into View
	if Mobile
    begin
    	gosub to SetView
        set style `display` of ScriptName to `none`
    end
    else if ShowRun
    begin
    	set style `display` of HelpOuter to `none`
        set style `display` of RunPanel to `block`
	end

    set attribute `src` of RunStop to `codex/icon/runstop.png`
    set attribute `title` of RunStop to property `tooltipStop` of Strings
    set Running
    wait 10 ticks

    run Script with RunPanel as TestModule nowait then
    begin
        clear Running
    	set attribute `src` of RunStop to `codex/icon/run.png`
    	set attribute `title` of RunStop to property `tooltipRun` of Strings
        set style `display` of RunPanel to `none`
        set style `display` of HelpOuter to `block`
        if Mobile set style `display` of ScriptName to `none`
        put `help` into View
	end
    stop

StopTestModule:
	if TestModule is running
    begin
    	stop TestModule
        clear Running
        clear RunPanel
        if Mobile
        begin
        	put `code` into View
            gosub to SetView
        	codemirror close ContentEditor
    		codemirror attach to ContentEditor
        end
        else put `help` into View
        set style `display` of HelpOuter to `block`
        set attribute `src` of RunStop to `codex/icon/run.png`
    end
	return

StringsFailed:
    alert `Unable to load language strings.`
    stop