    script LearnReader

!! Reader state: handles for the four toolbar buttons and the two content-area divs, plus scratch variables for navigation lookups.
!!
!! CurrentIndex is the cursor into the manifest's `pages` array. It has just two states: -1 means "viewing the contents page", 0..Count-1 means "viewing page N". The two are mutually exclusive — there is no third state. The toolbar derives its enabled/disabled appearance entirely from CurrentIndex.
!!
!! NavTrigger and NavTarget are hidden DOM elements that exist solely as the bridge from the JS click-intercept shim in `index.html` — JS writes a slug into NavTarget's content and clicks NavTrigger, and the AllSpeak on-click handler reads from NavTarget. They are not user-facing.

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
!! @hash 97292271
!!!

!! Boot: render the layout into the body, attach the AllSpeak variables to their DOM elements, prime the markdown renderer on the content pane, load the manifest of pages, register event handlers, and land on the contents page.
!!
!! The `set attribute data-markdown of Content to 1` line is the trigger that makes the rendering pipeline auto-convert markdown to HTML whenever the content of the Content variable is set. Without it, set-content writes the raw markdown to innerHTML.

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
!! @hash 9db0ddec
!!!

!! Render the contents page and put the toolbar in its "you are here" state by disabling all three navigation buttons. CurrentIndex is set to -1 as the marker for "no page is selected".

ShowContents:
    put -1 into CurrentIndex
    rest get Markdown from `contents.md`
        or alert `Could not load contents page`
    set the content of Content to Markdown
    disable ContentsButton
    disable PrevButton
    disable NextButton
    return
!! @hash 31d236d9
!!!

!! Render the page at CurrentIndex and update the toolbar to reflect bounds. ContentsButton is always enabled here (we're not on the contents page); PrevButton is disabled at the start of the sequence (index 0); NextButton is disabled at the end (index Count-1).
!!
!! Called from ShowPrev, ShowNext, and NavigateFromTarget — those callers are responsible for setting CurrentIndex first.

ShowPage:
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
!! @hash 1e1cb99f
!!!

!! Move back one page in the sequence. The early return on `CurrentIndex less than 1` covers both the contents page (-1) and the first page (0); in either case there's nowhere earlier to go.

ShowPrev:
    if CurrentIndex is less than 1 return
    take 1 from CurrentIndex
    gosub ShowPage
    return
!! @hash 627ab556
!!!

!! Move forward one page in the sequence. N is the proposed next index; if it would exceed the manifest's bounds, the return is taken without changing state.

ShowNext:
    add 1 to CurrentIndex giving N
    if N is not less than Count return
    put N into CurrentIndex
    gosub ShowPage
    return
!! @hash 1e4b77a2
!!!

!! Triggered by the JS shim when an in-page link is clicked. The shim has placed the bare slug (no number prefix, no `.md` extension) into NavTarget's content and clicked NavTrigger; this handler reads the slug and walks the manifest to find a matching page.
!!
!! The label-driven loop is here because the search has two exits — found and exhausted — and label-style is more honest for that than a `while` with a sentinel. The alert is the failure mode and should only fire if a page's cross-reference points at a slug not in the manifest.

NavigateFromTarget:
    put the content of NavTarget into Slug
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
!! @hash fb5f9dee
!!!
