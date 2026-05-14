!   project.as

    script Project

!    debug compile

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Doclet query system

    div Body
    variable Mobile

    variable MainScreenWebson

    div StartCard
    div ExampleCard
    div StartContainer
    div ExampleContainer
    div ManualContainer
    button TabStart
    button TabExample
    button TabManual
    button TabCodex
    div ManualStatus
    div ManualBody
    button RetryManualButton
    div ManualChapterList
    button ManualBackButton
    button ManualChapter1
    button ManualChapter2
    button ManualChapter3
    button ManualChapter4
    button ManualChapter5
    button ManualChapter6
    button ManualChapter7
    button ManualChapter8

    variable StartMarkdown
    variable StartLoaded
    variable ExampleMarkdown
    variable ExampleLoaded
    variable ManualMarkdown
    variable ManualLoaded
    variable ManualOverviewContent
    variable ManualChapterContent
    variable ManualChapterPath
    variable CurrentLocation
    variable Strings
    variable StrTitle
    variable StrManualLoaded
    variable StrManualLoading
    variable StrManualFailed
    variable StrChapterFailed
    variable StrViewing
    variable StrLang

!    debug step

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Load localised strings
    rest get Strings from `primer/strings.json?v=` cat now
        or go to AbandonShip
    put property `title` of Strings into StrTitle
    put property `manualLoaded` of Strings into StrManualLoaded
    put property `manualLoading` of Strings into StrManualLoading
    put property `manualFailed` of Strings into StrManualFailed
    put property `chapterFailed` of Strings into StrChapterFailed
    put property `viewing` of Strings into StrViewing
    put property `lang` of Strings into StrLang

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Set up the main screen
SetupScreen:

    set the title to StrTitle

    clear Mobile
    if mobile
    begin
        if portrait
        begin
        	set Mobile
        end
    end

	create Body
    set style `max-width` of Body to `800px`
    set style `margin` of Body to `0 auto`
    set style `padding` of Body to `0`
    set style `min-height` of Body to `100vh`
    set style `background` of body to `#0f1923`
    if Mobile
    begin
        set style `width` of Body to `100%`
        set style `overscroll-behavior-y` of Body to `none`
    end

!	Render the main screen layout
    rest get MainScreenWebson from `primer/project.json?v=` cat now
		or go to AbandonShip
	render MainScreenWebson in Body

    history set url the location

    attach StartCard to `StartCard` or go to AbandonShip
    attach ExampleCard to `ExampleCard` or go to AbandonShip
    attach StartContainer to `StartContainer` or go to AbandonShip
    attach ExampleContainer to `ExampleContainer` or go to AbandonShip
    attach ManualContainer to `ManualContainer` or go to AbandonShip
    attach TabStart to `TabStart` or go to AbandonShip
    attach TabExample to `TabExample` or go to AbandonShip
    attach TabManual to `TabManual` or go to AbandonShip
    attach TabCodex to `TabCodex` or go to AbandonShip
    attach ManualStatus to `ManualStatus` or go to AbandonShip
    attach ManualBody to `ManualBody` or go to AbandonShip
    attach RetryManualButton to `RetryManualButton` or go to AbandonShip
    attach ManualChapterList to `ManualChapterList` or go to AbandonShip
    attach ManualBackButton to `ManualBackButton` or go to AbandonShip
    attach ManualChapter1 to `ManualChapter1` or go to AbandonShip
    attach ManualChapter2 to `ManualChapter2` or go to AbandonShip
    attach ManualChapter3 to `ManualChapter3` or go to AbandonShip
    attach ManualChapter4 to `ManualChapter4` or go to AbandonShip
    attach ManualChapter5 to `ManualChapter5` or go to AbandonShip
    attach ManualChapter6 to `ManualChapter6` or go to AbandonShip
    attach ManualChapter7 to `ManualChapter7` or go to AbandonShip
    attach ManualChapter8 to `ManualChapter8` or go to AbandonShip

    clear StartLoaded
    clear ExampleLoaded
    clear ManualLoaded

    put the location into CurrentLocation
    gosub to RestoreFromLocation

    on click TabStart
    begin
        gosub to ShowStartTab
        history push url `#start`
    end

    on click TabExample
    begin
        gosub to ShowExampleTab
        history push url `#example`
    end

    on click TabManual
    begin
        gosub to ShowManualTab
        history push url `#manual/overview`
        gosub to EnsureManualLoaded
    end

    on click TabCodex
    begin
        location `../codex.html?lang=` cat StrLang
    end

    on click ManualBackButton
    begin
        history back
    end

    on click ManualChapter1
    begin
        put `primer/ch01.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter2
    begin
        put `primer/ch02.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter3
    begin
        put `primer/ch03.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter4
    begin
        put `primer/ch04.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter5
    begin
        put `primer/ch05.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter6
    begin
        put `primer/ch06.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter7
    begin
        put `primer/ch07.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on click ManualChapter8
    begin
        put `primer/ch08.md` into ManualChapterPath
        gosub to OpenManualChapter
    end

    on browser back
    begin
        gosub to RestoreFromLocation
    end

    on click RetryManualButton
    begin
        clear ManualLoaded
        gosub to EnsureManualLoaded
    end

    stop

ShowStartTab:
    set style `display` of StartContainer to `flex`
    set style `display` of ExampleContainer to `none`
    set style `display` of ManualContainer to `none`
    set style `background` of TabStart to `#1e3450`
    set style `background` of TabExample to `#0b1018`
    set style `background` of TabManual to `#0b1018`
    set style `background` of TabCodex to `#0b1018`
    set style `display` of RetryManualButton to `none`
    gosub to EnsureStartLoaded
    return

ShowExampleTab:
    set style `display` of StartContainer to `none`
    set style `display` of ExampleContainer to `flex`
    set style `display` of ManualContainer to `none`
    set style `background` of TabStart to `#0b1018`
    set style `background` of TabExample to `#1e3450`
    set style `background` of TabManual to `#0b1018`
    set style `background` of TabCodex to `#0b1018`
    set style `display` of RetryManualButton to `none`
    gosub to EnsureExampleLoaded
    return

ShowManualTab:
    set style `display` of StartContainer to `none`
    set style `display` of ExampleContainer to `none`
    set style `display` of ManualContainer to `flex`
    set style `background` of TabStart to `#0b1018`
    set style `background` of TabExample to `#0b1018`
    set style `background` of TabManual to `#1e3450`
    set style `background` of TabCodex to `#0b1018`
    return

EnsureStartLoaded:
    if StartLoaded return
    rest get StartMarkdown from `primer/tab1.md?v=` cat now
        or begin
            set the content of StartCard to `Content not available.`
            return
        end
    set the content of StartCard to StartMarkdown
    set StartLoaded
    return

EnsureExampleLoaded:
    if ExampleLoaded return
    rest get ExampleMarkdown from `primer/tab2.md?v=` cat now
        or begin
            set the content of ExampleCard to `Content not available.`
            return
        end
    set the content of ExampleCard to ExampleMarkdown
    set ExampleLoaded
    return

EnsureManualLoaded:
    if ManualLoaded
    begin
        set the content of ManualStatus to StrManualLoaded
        set style `display` of RetryManualButton to `none`
        gosub to ShowManualOverview
        return
    end
    set the content of ManualStatus to StrManualLoading
    set style `display` of RetryManualButton to `none`
    set style `display` of ManualBackButton to `none`
    set style `display` of ManualChapterList to `flex`
    rest get ManualMarkdown from `primer/tab3.md?v=` cat now
        or begin
            set the content of ManualStatus to StrManualFailed
            set style `display` of RetryManualButton to `block`
            return
        end
    put ManualMarkdown into ManualOverviewContent
    set the content of ManualBody to ManualOverviewContent
    set ManualLoaded
    set the content of ManualStatus to StrManualLoaded
    set style `display` of RetryManualButton to `none`
    return

ShowManualOverview:
    set style `display` of ManualChapterList to `flex`
    set style `display` of ManualBackButton to `none`
    if ManualOverviewContent is not empty
        set the content of ManualBody to ManualOverviewContent
    set the content of ManualStatus to StrManualLoaded
    return

OpenManualChapter:
    if right 7 of ManualChapterPath is `ch01.md` history push url `#manual/ch01`
    else if right 7 of ManualChapterPath is `ch02.md` history push url `#manual/ch02`
    else if right 7 of ManualChapterPath is `ch03.md` history push url `#manual/ch03`
    else if right 7 of ManualChapterPath is `ch04.md` history push url `#manual/ch04`
    else if right 7 of ManualChapterPath is `ch05.md` history push url `#manual/ch05`
    else if right 7 of ManualChapterPath is `ch06.md` history push url `#manual/ch06`
    else if right 7 of ManualChapterPath is `ch07.md` history push url `#manual/ch07`
    else if right 7 of ManualChapterPath is `ch08.md` history push url `#manual/ch08`
    gosub to LoadManualChapter
    return

LoadManualChapter:
    rest get ManualChapterContent from ManualChapterPath cat `?v=` cat now
        or begin
            set the content of ManualStatus to
                StrChapterFailed cat ManualChapterPath
            set style `display` of RetryManualButton to `block`
            return
        end
    set style `display` of ManualChapterList to `none`
    set style `display` of ManualBackButton to `block`
    set style `display` of RetryManualButton to `none`
    set the content of ManualBody to ManualChapterContent
    set the content of ManualStatus to StrViewing cat ManualChapterPath
    return

RestoreFromLocation:
    put the location into CurrentLocation
    if CurrentLocation includes `#manual/ch01`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch01.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch02`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch02.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch03`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch03.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch04`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch04.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch05`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch05.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch06`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch06.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch07`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch07.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/ch08`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        put `primer/ch08.md` into ManualChapterPath
        gosub to LoadManualChapter
        return
    end
    if CurrentLocation includes `#manual/overview`
    begin
        gosub to ShowManualTab
        gosub to EnsureManualLoaded
        gosub to ShowManualOverview
        return
    end
    if CurrentLocation includes `#example`
    begin
        gosub to ShowExampleTab
        return
    end
    gosub to ShowStartTab
    return

AbandonShip:
    alert `Unable to initialize page.`
    stop
