!   graphics-demo.as
!   An on-screen tour of the graphics domain: one of every widget type and
!   command form. Run it with a display:
!
!       cd allspeak-py
!       python3 -m allspeak.as_program tests/graphics-demo.as
!
!   (The icon on IconButton is loaded relative to the working directory, so
!   run from allspeak-py as above. Everything else is position-independent.)
!   Click around; the status bar at the bottom reports what each handler saw.

    script GraphicsDemo

    use graphics

    ! ---- widget declarations ----
    window MainWindow
    window ExtraWindow
    dialog NameDlg
    dialog GenericDlg
    messagebox MessageBox
    layout MainPanel
    layout LeftPanel
    layout RightPanel
    layout InputsGroup
    layout SelectionGroup
    layout ButtonsGroup
    layout ExtraLayout
    layout GenericLayout
    layout Grid
    layout PanelGroup
    group InputsBox
    group SelectionBox
    group ButtonsBox
    group PanelBox
    label TitleLabel
    label PromptLabel
    label GenericPrompt
    label PanelLabel
    label ClockLabel
    label StatusLabel
    label GridLabelA
    label GridLabelB
    label GridLabelC
    label GridLabelD
    label ExtraStatusLabel
    panel Placeholder
    pushbutton SaveButton
    pushbutton IconButton
    pushbutton TapButton
    pushbutton DisableMeButton
    pushbutton AskButton
    pushbutton NameDialogButton
    pushbutton GenericDialogButton
    pushbutton OpenExtraButton
    pushbutton ExtraCloseButton
    pushbutton CenterExtraButton
    pushbutton AdjustExtraButton
    pushbutton ClearListButton
    pushbutton RemoveListButton
    pushbutton PauseButton
    pushbutton ResumeButton
    pushbutton ToggleHideButton
    checkbox InvertCheckbox
    lineinput NameInput
    multiline NotesInput
    mdpanel HelpPanel
    listbox DeviceList
    combobox SystemCombo
    list Devices
    variable V
    variable N
    variable TickCount
    variable Answer
    variable ExtraOpen
    variable HiddenFlag

    init graphics

    ! ---- main window and top-level layout ----
    create MainPanel type QVBoxLayout
    set the spacing of MainPanel to 6
    create LeftPanel type QHBoxLayout
    create RightPanel type QVBoxLayout
    add LeftPanel to MainPanel
    add RightPanel to MainPanel
    add stretch to LeftPanel

    create TitleLabel text `AllSpeak graphics demo` size 20 expand align center
    set the style of TitleLabel to `font-weight:bold;`
    add TitleLabel to MainPanel

    ! ---- group box with a grid layout (add at {col} {row}) ----
    create InputsBox title `Grid`
    set the height of InputsBox to 90
    create Grid type QGridLayout
    add Grid to InputsBox
    create GridLabelA text `A` align center
    set the background color of GridLabelA to `#ddeeff`
    set the color of GridLabelA to `#0000aa`
    add GridLabelA at 0 0 in Grid
    create GridLabelB text `B`
    set the background color of GridLabelB to `#eeffdd`
    add GridLabelB at 0 1 in Grid
    create GridLabelC text `C`
    set the background color of GridLabelC to `#ffeedd`
    add GridLabelC at 1 0 in Grid
    create GridLabelD text `D`
    set the background color of GridLabelD to `#ffddff`
    add GridLabelD at 1 1 in Grid
    add InputsBox to LeftPanel

    ! ---- inputs: lineinput and multiline ----
    create InputsBox title `Inputs`
    create InputsGroup type QVBoxLayout
    add InputsGroup to InputsBox
    create PromptLabel text `Name:`
    add PromptLabel to InputsGroup
    create NameInput text `guest` size 20
    set the width of NameInput to 180
    add NameInput to InputsGroup
    create NotesInput cols 24 rows 4
    set the text of NotesInput to `line one` cat newline cat `line two`
    add NotesInput to InputsGroup
    create InvertCheckbox text `Invert polarity`
    set the state of InvertCheckbox to checked
    add InvertCheckbox to InputsGroup
    add InputsBox to LeftPanel

    ! ---- selection: listbox and combobox (populated from a list) ----
    create SelectionBox title `Selection`
    create SelectionGroup type QHBoxLayout
    add SelectionGroup to SelectionBox
    put json `["sensor-01","sensor-02","sensor-03"]` into Devices
    create DeviceList
    set DeviceList to Devices
    add DeviceList to SelectionGroup
    on select DeviceList go to DevicePicked
    create SystemCombo
    add Devices to SystemCombo
    select index 1 of SystemCombo
    select `sensor-03` in SystemCombo
    add SystemCombo to SelectionGroup
    on select SystemCombo go to SystemChanged
    add SelectionBox to LeftPanel

    ! ---- a plain panel with its own layout (set the layout of {panel}) ----
    create PanelBox title `Panel`
    create PanelGroup type QVBoxLayout
    create Placeholder
    set the layout of Placeholder to PanelGroup
    create PanelLabel text `A panel with a layout.`
    add PanelLabel to PanelGroup
    add Placeholder to PanelBox
    add PanelBox to LeftPanel

    ! ---- markdown preview panel ----
    create HelpPanel cols 30 rows 5
    set the text of HelpPanel to `# Help` cat newline cat `Read me in markdown.`
    add HelpPanel to LeftPanel
    add spacer size 12 to LeftPanel

    ! ---- buttons group ----
    create ButtonsBox title `Buttons`
    create ButtonsGroup type QVBoxLayout
    add ButtonsGroup to ButtonsBox
    create SaveButton text `Save`
    on click SaveButton go to SaveClick
    add SaveButton to ButtonsGroup
    create IconButton text `Stop` icon `allspeak/icons/stop.png` size 16
    on click IconButton go to IconClick
    add IconButton to ButtonsGroup
    create TapButton text `Tap me`
    on tap TapButton go to TapClick
    add TapButton to ButtonsGroup
    create DisableMeButton text `Disable me`
    on click DisableMeButton go to DisableClick
    add DisableMeButton to ButtonsGroup
    create AskButton text `Ask (message box)`
    on click AskButton go to AskClick
    add AskButton to ButtonsGroup
    create NameDialogButton text `Name dialog`
    on click NameDialogButton go to NameDialogClick
    add NameDialogButton to ButtonsGroup
    create GenericDialogButton text `Generic dialog`
    on click GenericDialogButton go to GenericDialogClick
    add GenericDialogButton to ButtonsGroup
    add stretch to ButtonsGroup
    add ButtonsBox to RightPanel

    ! ---- list maintenance and state buttons ----
    create ClearListButton text `Clear device list`
    on click ClearListButton go to ClearListClick
    add ClearListButton to RightPanel
    create RemoveListButton text `Remove selected device`
    on click RemoveListButton go to RemoveListClick
    add RemoveListButton to RightPanel
    create ToggleHideButton text `Hide / show status`
    on click ToggleHideButton go to ToggleHideClick
    add ToggleHideButton to RightPanel
    create PauseButton text `Pause tick (blocked)`
    on click PauseButton go to PauseClick
    add PauseButton to RightPanel
    create ResumeButton text `Resume tick`
    on click ResumeButton go to ResumeClick
    add ResumeButton to RightPanel
    create OpenExtraButton text `Open extra window`
    on click OpenExtraButton go to OpenExtraClick
    add OpenExtraButton to RightPanel

    ! ---- status line and clock ----
    create StatusLabel text `Ready` align right
    set the style of StatusLabel to `color:#006600;`
    set the alignment of StatusLabel to hcenter
    add StatusLabel to MainPanel
    create ClockLabel text `Ticks: 0` align right
    add ClockLabel to MainPanel

    ! ---- the tick handler updates the clock every 250 ms ----
    put 0 into TickCount
    clear HiddenFlag
    clear ExtraOpen
    on tick go to Tick

    ! ---- create the window with its layout attached up front ----
    create MainWindow title `Graphics demo` at 60 60 size 900 600 layout MainPanel
    show MainWindow
    stop

    ! ============================================================
    SaveClick:
        put NameInput into V
        put InvertCheckbox into Answer
        put `Saved ` cat V cat ` (invert=` cat Answer cat `)` into V
        set the text of StatusLabel to V
        log V
        enable DisableMeButton
        stop

    IconClick:
        set the text of StatusLabel to `Icon button clicked`
        stop

    TapClick:
        set the text of StatusLabel to `Tap button tapped`
        stop

    DisableClick:
        disable DisableMeButton
        set the text of StatusLabel to `Button disabled — click Save to re-enable`
        stop

    AskClick:
        create MessageBox on MainWindow style question title `Really?` message `Delete the selected device?`
        show MessageBox giving Answer
        set the text of StatusLabel to `Answer: ` cat Answer
        stop

    NameDialogClick:
        create NameDlg on MainWindow type lineedit title `Name` prompt `Enter a name:` value `guest`
        show NameDlg
        put NameDlg into V
        set the text of StatusLabel to `Dialog returned: ` cat V
        log `dialog: ` cat V
        stop

    GenericDialogClick:
        create GenericLayout type QVBoxLayout
        create GenericPrompt text `A generic dialog with its own layout.`
        add GenericPrompt to GenericLayout
        create GenericDlg on MainWindow type generic with GenericLayout
        show GenericDlg
        put GenericDlg into V
        set the text of StatusLabel to `Generic dialog returned: ` cat V
        stop

    DevicePicked:
        put the current item in DeviceList into V
        put the current index of DeviceList into N
        set the text of StatusLabel to `Picked ` cat V cat ` (index ` cat N cat `)`
        stop

    SystemChanged:
        put the current of SystemCombo into V
        set the text of StatusLabel to `System: ` cat V
        stop

    ClearListClick:
        clear DeviceList
        set the text of StatusLabel to `Device list cleared`
        stop

    RemoveListClick:
        remove the current item from DeviceList
        set the text of StatusLabel to `Removed current device`
        stop

    ToggleHideClick:
        if HiddenFlag
        begin
            show StatusLabel
            clear HiddenFlag
        end
        else
        begin
            hide StatusLabel
            set HiddenFlag
        end
        stop

    PauseClick:
        set blocked true
        set the text of StatusLabel to `Blocked — tick paused`
        stop

    ResumeClick:
        set blocked false
        set the text of StatusLabel to `Unblocked`
        stop

    OpenExtraClick:
        if ExtraOpen
        begin
            show ExtraWindow
            stop
        end
        create ExtraLayout type QVBoxLayout
        create ExtraStatusLabel text `An extra window` align center
        add ExtraStatusLabel to ExtraLayout
        add stretch to ExtraLayout
        create ExtraCloseButton text `Close`
        on click ExtraCloseButton go to ExtraCloseClick
        add ExtraCloseButton to ExtraLayout
        create CenterExtraButton text `Center on main`
        on click CenterExtraButton go to CenterExtraClick
        add CenterExtraButton to ExtraLayout
        create AdjustExtraButton text `Adjust size`
        on click AdjustExtraButton go to AdjustExtraClick
        add AdjustExtraButton to ExtraLayout
        create ExtraWindow title `Extra` at 700 120 size 280 200 layout ExtraLayout
        show ExtraWindow
        set ExtraOpen
        stop

    ExtraCloseClick:
        close ExtraWindow
        stop

    CenterExtraClick:
        center ExtraWindow on MainWindow
        stop

    AdjustExtraClick:
        adjust ExtraWindow
        stop

    Tick:
        add 1 to TickCount
        put TickCount into V
        set the text of ClockLabel to `Ticks: ` cat V
        stop
