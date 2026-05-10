!!  Tabbed script editor with auto-save and external change detection.
!!  Served by server.as locally, or any web server with /list, /read, /write routes.
!   asedit.as

    script ASEditor
!! @hash 7ad312d2
!!!
!!	Variable declarations
!! The script uses a lot of variables; they are grouped here by function.
!   -- DOM --
    div Body
    div TabBar
    div TabBtn
    div Overlay
    div Scroller
    div FileRow
    textarea ContentEditor
    span StatusSpan
    span TabLabel
    button OpenBtn
    button FindBtn
    button CloseBtn
    img PlusBtn
    img TabClose
    a FileName
    pre UIPre

!   -- State --
    variable Lang
    variable StrOpen
    variable StrFind
    variable StrClose
    variable StrSaved
    variable StrSaveFailed
    variable StrReloaded
    variable StrExtChange
    variable StrNoConnect
    variable StrSaveAs
    variable StrEmpty
    variable StrUpLevel
    variable StrRoot
    variable StrUpdated
    variable StrRestart
    variable TabPath       ! array: full file path per tab (relative to project root)
    variable TabName       ! array: display name (basename) per tab
    variable TabSaved      ! array: last content saved to server per tab
    variable TabCount
    variable ActiveTab
    variable Content       ! scratch: current editor content
    variable FileContent   ! scratch: content fetched from server
    variable FileList      ! scratch: JSON array from /list
    variable N
    variable M
    variable Item          ! scratch: single entry object from list
    variable File          ! scratch: single filename
    variable FileCount
    variable TabItem
    variable UIWebson
    variable VersionResult
    variable CurrentPath   ! current directory being browsed (relative, no leading /)
    variable EntryName
    variable EntryType
!! @hash b95a2cc1
!!!

!!	The UI is described by a DOM element 'asedit-ui',
!!	a <pre> element that contains all the DOM elements that go to make up the editor.
!!	These are formatted using Webson, a JSON representation of any number of DOM elements,
!!	which is rendered into an existing element using the 'render' command
!!	'body' without a capital, is the HTML <body> element
!!	'Body', where the first letter is a capital, is a variable that is attached to the page body
!!	so that other elements - in this case those represented by the Webson -  can be added to it.
!   -- Build UI --
    attach Body to body
    attach UIPre to `asedit-ui`
    put the content of UIPre into UIWebson
    render UIWebson in Body
    attach TabBar to `se-tabbar`
    attach ContentEditor to `se-textarea`
    attach StatusSpan to `se-status`
    attach OpenBtn to `se-open`
    attach FindBtn to `se-findbtn`
    attach PlusBtn to `se-plusbtn`
    attach Overlay to `se-overlay`
    attach Scroller to `se-scroller`
    attach CloseBtn to `se-closebtn`
!! @hash d006ed09
!!!

!!	Some general initialisation
!   -- CodeMirror --
    codemirror attach to ContentEditor

    put 0 into TabCount
    put 0 into ActiveTab
    put `` into CurrentPath
!! @hash 3a601096
!!!

!!	Language detection
!!	The command 'language xx' switches the system to the given language (fr, de, it etc.)
!!	and defaults to 'en'. All of the language-specific strings are then defined for each language.
!   -- Detect language and set strings for each supported language --
    div LangDiv
    put `en` into Lang
    attach LangDiv to `editor-lang` or go to SetStrings
    put the text of LangDiv into Lang
    replace ` ` with `` in Lang
    replace newline with `` in Lang
    if Lang is empty put `en` into Lang

SetStrings:
    if Lang is `it`
    begin
        put `Apri` into StrOpen
        put `Cerca` into StrFind
        put `Chiudi` into StrClose
        put `Salvato` into StrSaved
        put `Salvataggio fallito` into StrSaveFailed
        put `Ricaricato` into StrReloaded
        put `Modifica esterna rilevata` into StrExtChange
        put `Impossibile connettersi al server` into StrNoConnect
        put `Salva come (nome file senza .as):` into StrSaveAs
        put `(cartella vuota)` into StrEmpty
        put `.. (livello superiore)` into StrUpLevel
        put `/ (radice progetto)` into StrRoot
        put `L'editor è stato aggiornato. Riavviare?` into StrUpdated
        put `Riavvia il server manualmente.` into StrRestart
    end
    else if Lang is `fr`
    begin
        put `Ouvrir` into StrOpen
        put `Rechercher` into StrFind
        put `Fermer` into StrClose
        put `Enregistré` into StrSaved
        put `Échec de l'enregistrement` into StrSaveFailed
        put `Rechargé` into StrReloaded
        put `Modification externe détectée` into StrExtChange
        put `Impossible de se connecter au serveur` into StrNoConnect
        put `Enregistrer sous (nom de fichier sans .as) :` into StrSaveAs
        put `(dossier vide)` into StrEmpty
        put `.. (niveau supérieur)` into StrUpLevel
        put `/ (racine du projet)` into StrRoot
        put `L'éditeur a été mis à jour. Redémarrer ?` into StrUpdated
        put `Veuillez redémarrer le serveur manuellement.` into StrRestart
    end
    else if Lang is `de`
    begin
        put `Öffnen` into StrOpen
        put `Suchen` into StrFind
        put `Schließen` into StrClose
        put `Gespeichert` into StrSaved
        put `Speichern fehlgeschlagen` into StrSaveFailed
        put `Neu geladen` into StrReloaded
        put `Externe Änderung erkannt` into StrExtChange
        put `Verbindung zum Server nicht möglich` into StrNoConnect
        put `Speichern unter (Dateiname ohne .as):` into StrSaveAs
        put `(leerer Ordner)` into StrEmpty
        put `.. (Ebene höher)` into StrUpLevel
        put `/ (Projektstamm)` into StrRoot
        put `Der Editor wurde aktualisiert. Neu starten?` into StrUpdated
        put `Bitte den Server manuell neu starten.` into StrRestart
    end
    else
    begin
        put `Open` into StrOpen
        put `Find` into StrFind
        put `Close` into StrClose
        put `Saved` into StrSaved
        put `Save failed` into StrSaveFailed
        put `Reloaded` into StrReloaded
        put `External change detected` into StrExtChange
        put `Cannot connect to server` into StrNoConnect
        put `Save as (filename without .as):` into StrSaveAs
        put `(empty directory)` into StrEmpty
        put `.. (up one level)` into StrUpLevel
        put `/ (project root)` into StrRoot
        put `asedit has been updated. Restart to apply changes?` into StrUpdated
        put `Please restart the server manually.` into StrRestart
    end
    set the content of OpenBtn to StrOpen
    set the content of FindBtn to StrFind
    set the content of CloseBtn to StrClose
!! @hash 57698f27
!!!

!!	The editor checks on startup and periodically for updates to itself.
!!	(explain)
!!	then 
!   -- Check for updates --
    rest get VersionResult from `/version` or go VersionDone
    if VersionResult is `updated`
    begin
        if confirm StrUpdated
        begin
            rest get VersionResult from `/restart` or begin
                alert StrRestart
                go VersionDone
            end
            wait 3 seconds
            location the location

!			 Is this alternative valid?
!            rest get VersionResult from `/restart`
!            on failure alert StrRestart
!           	else
!            begin
!            	wait 3 seconds
!            	location the location
!            end
        end
    end
VersionDone:
!! @hash 96465c41
!!!

!!	Set up click handlers for the various editor functions
!   -- Handlers --
    on click OpenBtn go to ShowBrowser
    on click PlusBtn go to NewFile
    on click FindBtn go to DoFind
!! @hash 78e093b8
!!!

!!	While editor is running it periodically saves changes made by the user
!!	and updates the display to show updates made externally.
!!	This avoids the need for any Save mechanism.
!   -- Start background loops --
    fork to AutoSave
    fork to PollFile
    stop
!! @hash f86feb98
!!!

!!	Every half-second, changes to the content are saved
!!	TabSaved is an array of tab contents. If its content differs from
!!	that currently held in the editor, the current content is saved to the file
!!	and TabSaved is updated.
!   -- Auto-save loop --
AutoSave:
    wait 500 millis
    if TabCount is 0
    begin
        fork to AutoSave
        stop
    end
    codemirror get content of ContentEditor into Content
    index TabSaved to ActiveTab
    if Content is not TabSaved
    begin
        index TabPath to ActiveTab
        if TabPath is empty
        begin
            if Content is empty
            begin
                fork to AutoSave
                stop
            end
            put prompt StrSaveAs into File
            if File is empty
            begin
                fork to AutoSave
                stop
            end
            put File cat `.as` into File
            ! Save into the currently browsed directory
            if CurrentPath is not empty
                put CurrentPath cat `/` cat File into File
            index TabPath to ActiveTab
            put File into TabPath
            index TabName to ActiveTab
            put File into TabName
            gosub to RebuildTabBar
        end
        rest post Content to `/write/` cat TabPath or go SaveFailed
        index TabSaved to ActiveTab
        put Content into TabSaved
        set the content of StatusSpan to StrSaved
        fork to ClearStatus
    end
    fork to AutoSave
    stop

SaveFailed:
    set the content of StatusSpan to StrSaveFailed
    fork to ClearStatus
    fork to AutoSave
    stop
!! @hash a9c8ba92
!!!

!!	Every 3 seconds, the curret file is re-read into FileContent
!!	If this differs from what is currently held in TabSaved for this tab,
!!	the editor content is updated and a message is displayed briefly.
!   -- External change polling --
PollFile:
    wait 3 seconds
    if TabCount is 0
    begin
        fork to PollFile
        stop
    end
    index TabPath to ActiveTab
    if TabPath is empty go to PollNext
    rest get FileContent from `/read/` cat TabPath or go PollNext
    codemirror get content of ContentEditor into Content
    index TabSaved to ActiveTab
    if FileContent is not TabSaved
    begin
        if Content is TabSaved
        begin
            ! Editor is clean -- silently reload
            put FileContent into TabSaved
            codemirror set content of ContentEditor to FileContent
            set the content of StatusSpan to StrReloaded
            fork to ClearStatus
        end
        else
        begin
            set the content of StatusSpan to StrExtChange
        end
    end
PollNext:
    fork to PollFile
    stop
!! @hash b40404be
!!!

!!	(explain)
!   -- File browser with directory navigation --
ShowBrowser:
    rest get FileList from `/list/` cat CurrentPath or go BrowserError
    put the json count of FileList into FileCount
    set the elements of FileRow to FileCount
    set the elements of FileName to FileCount
    set the content of Scroller to ``

    ! Show current path at top
    create FileRow in Scroller
    set the style of FileRow to `padding:4px 8px;font-size:0.85em;color:#666;border-bottom:1px solid #ddd`
    if CurrentPath is empty
        set the content of FileRow to StrRoot
    else
        set the content of FileRow to `/` cat CurrentPath

    ! Show "back" row if inside a subdirectory
    if CurrentPath is not empty
    begin
        create FileRow in Scroller
        set the style of FileRow to `padding:4px 8px;cursor:pointer;background:#f0f0ff`
        set the content of FileRow to StrUpLevel
        on click FileRow go to GoUp
    end

    if FileCount is 0
    begin
        create FileRow in Scroller
        set the style of FileRow to `padding:4px 8px;color:#999`
        set the content of FileRow to StrEmpty
    end

    put 0 into N
    while N is less than FileCount
    begin
        put element N of FileList into Item
        put property `name` of Item into EntryName
        put property `type` of Item into EntryType
        index FileRow to N
        create FileRow in Scroller
        set the style of FileRow to `padding:3px 8px;cursor:pointer`
        index FileName to N
        create FileName in FileRow
        if EntryType is `dir`
        begin
            set the style of FileName to `display:block;padding:3px 0;cursor:pointer;font-weight:bold`
            set the content of FileName to `📁 ` cat EntryName
        end
        else
        begin
            set the style of FileName to `display:block;padding:3px 0;cursor:pointer`
            set the content of FileName to EntryName
        end
        on click FileName go to SelectEntry
        add 1 to N
    end
    on click CloseBtn go to CloseBrowser
    set style `display` of Overlay to `block`
    stop

GoUp:
    put the position of the last `/` in CurrentPath into N
    if N is less than 0
        put `` into CurrentPath
    else
        put left N of CurrentPath into CurrentPath
    go to ShowBrowser

BrowserError:
    set the content of StatusSpan to StrNoConnect
    fork to ClearStatus
    stop

!   -- Entry selected in browser --
SelectEntry:
    put the index of FileName into N
    put element N of FileList into Item
    put property `name` of Item into EntryName
    put property `type` of Item into EntryType
    if EntryType is `dir`
    begin
        ! Navigate into directory
        if CurrentPath is empty
            put EntryName into CurrentPath
        else
            put CurrentPath cat `/` cat EntryName into CurrentPath
        go to ShowBrowser
    end
    ! Build full relative path and open file
    if CurrentPath is empty
        put EntryName into TabItem
    else
        put CurrentPath cat `/` cat EntryName into TabItem
    set style `display` of Overlay to `none`
    put EntryName into File
    go to OpenFile

CloseBrowser:
    set style `display` of Overlay to `none`
    stop
!! @hash 90558828
!!!

!!	This secttion is tab management; creating a new tab, opening a file,
!!	selecting a tab and closing a tab.
!   -- New empty tab --
NewFile:
    put TabCount into N
    add 1 to TabCount
    set the elements of TabPath to TabCount
    set the elements of TabName to TabCount
    set the elements of TabSaved to TabCount
    set the elements of TabBtn to TabCount
    set the elements of TabLabel to TabCount
    set the elements of TabClose to TabCount
    index TabPath to N
    put `` into TabPath
    index TabName to N
    put `new` into TabName
    index TabSaved to N
    put `` into TabSaved
    put N into ActiveTab
    go to ActivateTab

!   -- Open a file (TabItem=relative path, File=display name) --
OpenFile:
    ! Check if already open in a tab
    put 0 into N
    while N is less than TabCount
    begin
        index TabPath to N
        if TabPath is TabItem
        begin
            put N into ActiveTab
            go to ActivateTab
        end
        add 1 to N
    end
    ! Not open -- load from server and create a new tab
    rest get Content from `/read/` cat TabItem or go BrowserError
    add 1 to TabCount
    set the elements of TabPath to TabCount
    set the elements of TabName to TabCount
    set the elements of TabSaved to TabCount
    set the elements of TabBtn to TabCount
    set the elements of TabLabel to TabCount
    set the elements of TabClose to TabCount
    index TabPath to N
    put TabItem into TabPath
    index TabName to N
    put File into TabName
    index TabSaved to N
    put Content into TabSaved
    put N into ActiveTab
    go to ActivateTab

!   -- Switch to an existing tab --
SwitchTab:
    put the index of TabLabel into ActiveTab
    go to ActivateTab

!   -- Close a tab --
CloseTab:
    put the index of TabClose into M
    ! Shift elements above M down by one
    put M into N
    add 1 to N
    while N is less than TabCount
    begin
        index TabPath to N
        put TabPath into File
        subtract 1 from N
        index TabPath to N
        put File into TabPath
        add 1 to N
        index TabName to N
        put TabName into File
        subtract 1 from N
        index TabName to N
        put File into TabName
        add 1 to N
        index TabSaved to N
        put TabSaved into FileContent
        subtract 1 from N
        index TabSaved to N
        put FileContent into TabSaved
        add 1 to N
        add 1 to N
    end
    subtract 1 from TabCount
    if TabCount is 0
    begin
        put 0 into ActiveTab
        codemirror set content of ContentEditor to ``
        set the content of TabBar to ``
        stop
    end
    ! Adjust ActiveTab if it was after the closed tab
    if ActiveTab is greater than M subtract 1 from ActiveTab
    ! Clamp ActiveTab to valid range
    put TabCount into FileCount
    subtract 1 from FileCount
    if ActiveTab is greater than FileCount
    begin
        put FileCount into ActiveTab
    end
    go to ActivateTab

ActivateTab:
    index TabSaved to ActiveTab
    codemirror set content of ContentEditor to TabSaved
    gosub to RebuildTabBar
    stop
!! @hash 14377e61
!!!

!!	Rebuilding the tab bar is done by assigning styles to each tab
!!	to indicate which one is current.
RebuildTabBar:
!   -- Rebuild tab bar --
    set the content of TabBar to ``
    put 0 into N
    while N is less than TabCount
    begin
        index TabBtn to N
        create TabBtn in TabBar
        if N is ActiveTab
        begin
            set the style of TabBtn to `display:flex;align-items:center;gap:4px;padding:4px 10px;cursor:pointer;background:#555;color:white;border-bottom:2px solid lightgreen`
        end
        else
        begin
            set the style of TabBtn to `display:flex;align-items:center;gap:4px;padding:4px 10px;cursor:pointer;background:#3a3a3a;color:#aaa`
        end
        index TabLabel to N
        create TabLabel in TabBtn
        index TabName to N
        set the text of TabLabel to TabName
        on click TabLabel go to SwitchTab
        index TabClose to N
        create TabClose in TabBtn
        set attribute `src` of TabClose to `https://allspeak.ai/icon/stop.png`
        set the style of TabClose to `width:12px;height:12px;opacity:0.6;cursor:pointer`
        on click TabClose go to CloseTab
        add 1 to N
    end
    return
!! @hash 1347598c
!!!
!!	Here are some utility functions.
!   -- Find --
DoFind:
    codemirror find in ContentEditor
    stop

!   -- Utilities --
ClearStatus:
    wait 3 seconds
    set the content of StatusSpan to ``
    stop
!! @hash df75e3d8
!!!
