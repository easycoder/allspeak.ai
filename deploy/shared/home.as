!   home.as — Shared home page script for all languages
!   Receives Lang variable from the caller (e.g. "en", "it")

    script HomePage

    import variable Lang

    div Body
    div Header
    div TopNav
    div Content
    div Nav
    variable Markdown
    variable BasePath

    put `` into BasePath

    set the title to `AllSpeak`

    create Body
    set style `max-width` of Body to `800px`
    set style `margin` of Body to `0 auto`
    set style `padding` of Body to `2em`
    set style `font-family` of Body to `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
    set style `color` of Body to `#e0e0e0`
    set style `background` of Body to `#0f1923`
    set style `min-height` of Body to `100vh`
    set style `background` of body to `#0f1923`

    create Header in Body
    set style `text-align` of Header to `center`
    set style `margin-bottom` of Header to `2em`
    set the content of Header to `<img src="../icon/duckthink.png" style="width:80px;height:80px;border-radius:16px;margin-bottom:0.5em" /><h1 style="color:#00d4ff;font-size:2.5em">AllSpeak</h1>`

    create TopNav in Body
    set style `text-align` of TopNav to `center`
    set style `margin-bottom` of TopNav to `2em`

    rest get Markdown from BasePath cat `topnav.md?v=` cat now
        or go to LoadError
    set the content of TopNav to Markdown

    create Content in Body
    set style `line-height` of Content to `1.8`

    rest get Markdown from BasePath cat `home.md?v=` cat now
        or go to LoadError
    set the content of Content to Markdown

    create Nav in Body
    set style `margin-top` of Nav to `2em`
    set style `text-align` of Nav to `center`

    rest get Markdown from BasePath cat `nav.md?v=` cat now
        or go to LoadError
    set the content of Nav to Markdown

    stop

LoadError:
    set the content of Content to `<p style="color:#ff4444">Failed to load content.</p>`
    stop
