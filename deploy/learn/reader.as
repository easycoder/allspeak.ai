    script LearnReader

    variable Layout
    variable Manifest
    variable Pages
    variable Page
    variable Markdown
    variable Path
    variable Slug
    variable CurrentIndex
    variable Count
    variable N
    variable Found

    div Body
    div Content
    div NavTarget
    button ContentsButton
    button PrevButton
    button NextButton
    button NavTrigger

    create Body
    rest get Layout from `reader.json`
    render Layout in Body

    attach Content to `content`
    attach ContentsButton to `contents-button`
    attach PrevButton to `prev-button`
    attach NextButton to `next-button`
    attach NavTrigger to `nav-trigger`
    attach NavTarget to `nav-target`

    set attribute `data-markdown` of Content to `1`

    rest get Manifest from `manifest.json`
        or alert `Could not load manifest`
    put property `pages` of Manifest into Pages
    put the json count of Pages into Count

    on click ContentsButton gosub ShowContents
    on click PrevButton gosub ShowPrev
    on click NextButton gosub ShowNext
    on click NavTrigger gosub NavigateFromTarget

    gosub ShowContents
    stop

ShowContents:
    put -1 into CurrentIndex
    rest get Markdown from `contents.md`
        or alert `Could not load contents page`
    set the content of Content to Markdown
    disable ContentsButton
    disable PrevButton
    disable NextButton
    return

ShowPage:
    ! Renders the page at CurrentIndex.
    put element CurrentIndex of Pages into Page
    put property `path` of Page into Path
    rest get Markdown from Path
        or alert `Could not load ` cat Path
    set the content of Content to Markdown
    enable ContentsButton
    if CurrentIndex is 0
        disable PrevButton
    else
        enable PrevButton
    add 1 to CurrentIndex giving N
    if N is less than Count
        enable NextButton
    else
        disable NextButton
    return

ShowPrev:
    if CurrentIndex is less than 1 return
    take 1 from CurrentIndex
    gosub ShowPage
    return

ShowNext:
    add 1 to CurrentIndex giving N
    if N is not less than Count return
    put N into CurrentIndex
    gosub ShowPage
    return

NavigateFromTarget:
    ! JS shim has placed the link slug in NavTarget's content.
    get the content of NavTarget into Slug
    put 0 into N
    put -1 into Found
Lookup:
    if N is not less than Count go to LookupEnd
    put element N of Pages into Page
    if property `slug` of Page is Slug begin
        put N into Found
        go to LookupEnd
    end
    add 1 to N
    go to Lookup
LookupEnd:
    if Found is less than 0 begin
        alert `Page not found: ` cat Slug
        return
    end
    put Found into CurrentIndex
    gosub ShowPage
    return
