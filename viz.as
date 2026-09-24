!! viz.as — the AllSpeak visualiser framework.
!!
!! The framework is deliberately thin, and the thinness is the design. A viz plugin owns the privileged operations — compiling a source file, reading its IR, and consuming the doc-block model — and everything above that line is AllSpeak. That split is what keeps the tool maintainable in the language we would rather read.
!!
!! The same file runs under both runtimes: the host registers the plugin domain and supplies both the source and the analyser's section model, the plugin hands back a list of records, and everything below is plain AllSpeak. Nothing is executed — this is a static narrative, so it works on scripts that cannot be run, including ones that will not compile.

    script Viz

    variable Model
    variable Line
    variable Index
    variable Count
    variable Anchors
    variable UnreachableCount
    variable Sections
    variable Findings
    variable ProblemsCount
    variable Windows
    variable Recorded

    model the script giving Model
!! @hash e988239b
!!!

!! The report loop: walk the records, print them, and count what matters.
!!
!! The plugin emits the records already in narrative order — each section, its prose, the anchors inside it, and the routes that leave it — so presenting them is a walk rather than a join. Records begin with their kind, so every count here is a prefix test rather than a parse. Three kinds are findings rather than description: an anchor nothing enters, prose that matches the code but has not been re-verified since the code last changed, and a target that will not compile.

Report:
    put the elements of Model into Count
    put 0 into Anchors
    put 0 into UnreachableCount
    put 0 into Sections
    put 0 into Findings
    put 0 into ProblemsCount
    put 0 into Windows
    put 0 into Recorded
    put 0 into Index

    print `--- model ---`

    while Index is less than Count
    begin
        index Model to Index
        put Model into Line
        print Line
        if Line starts with `section` add 1 to Sections
        if Line starts with `window` add 1 to Windows
        if Line starts with `trace` add 1 to Recorded
        if Line starts with `finding` add 1 to Findings
        if Line starts with `anchor`
        begin
            add 1 to Anchors
            if Line starts with `anchor | reachable=no` add 1 to UnreachableCount
        end
        if Line starts with `problem` add 1 to ProblemsCount
        add 1 to Index
    end

    print `sections: ` cat Sections
    print `anchors: ` cat Anchors
    print `unreachable: ` cat UnreachableCount
    print `windows declared: ` cat Windows
    print `windows recorded: ` cat Recorded
    print `findings: ` cat Findings
    print `problems: ` cat ProblemsCount
    stop
!! @hash 7aa93e8a
!!!
