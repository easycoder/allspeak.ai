!! Doc-block validator for AllSpeak (.as) source files — CLI version.
!!
!! Runs under the Python AllSpeak runtime. Takes one path argument:
!!   * a single .as file → analysed in place
!!   * a directory       → walked recursively; every .as file under it
!!                         is analysed
!!
!! For each file, reports whether the file uses the convention at all
!! (so green-field projects can see what's ripe for initial doc-blocking),
!! the per-section hash and verification states, and any structural
!! errors (orphan terminators, unclosed sections). The script is
!! self-applying: pointing it at this file gives a meaningful report.
!!
!! Same parsing engine as tools/asdoc-check.as (the browser variant) and
!! tools/asdoc-check.py. They share state names, hash truncation length
!! (8 hex chars of SHA-256), and section semantics so an editor can rely
!! on either back-end interchangeably.
!!
!! Usage: allspeak tools/asdoc-check-cli.as <path>
!!
!! V1 is read-only — refreshing stored @hash lines is left to the
!! Python tool until the AS analyser is mature enough to take over.
!!!

    script ASDocCheckCLI

!! Variable declarations, grouped by purpose. Anything starting Sec...
!! resets each time a new section opens; anything starting Total...
!! accumulates across all files in this run.
!!
!   -- CLI / dispatch --
    variable ArgCount
    variable TargetPath
    variable WorkList         ! stack of directory paths still to walk
    variable WorkCount
    variable WorkIdx
    variable CurDir
    list Entries              ! must be `list` so item N of works in Python runtime
    dictionary Entry          ! must be `dictionary` so entry X of works
    variable EntryCount
    variable Name
    variable EntryType
    variable FullPath
    variable K

!   -- Per-file --
    variable CurFile
    variable Source
    variable Lines
    variable LineCount
    variable FileSecCount     ! sections found in this file
    variable FileErrors
    variable FileWarnings

!   -- Per-line lex state (rebuilt every iteration) --
    variable N
    variable Line
    variable Kind             ! `TERM`, `DOC`, `META`, `CODE`
    variable Content
    variable MetaKey
    variable MetaValue
    variable Pos
    variable Tmp

!   -- Per-section accumulators (rebuilt at OpenSection) --
    variable InSection
    variable SecStart
    variable SecCode
    variable SecHash
    variable SecVerified
    variable SecHasCode
    variable CurHash
    variable HashState
    variable VerifyState

!   -- Cross-file totals --
    variable TotalFiles
    variable TotalWithConv    ! files that contain at least one section
    variable TotalWithoutConv
    variable TotalErrors
    variable TotalWarnings

!   -- Output buffer for the current file --
    variable FileReport
    variable LineNum
!! @hash 8194b8ad
!!!

!! Main entry. Parse the single positional argument, decide whether
!! it's a file or a directory using a `.as` suffix heuristic (the
!! Python runtime doesn't expose a cheap is-dir check), then dispatch.
!! After everything, print a one-line grand total.
!!
    put 0 into TotalFiles
    put 0 into TotalWithConv
    put 0 into TotalWithoutConv
    put 0 into TotalErrors
    put 0 into TotalWarnings

    put argc into ArgCount
    if ArgCount is 0
    begin
        print `Usage: allspeak tools/asdoc-check-cli.as <file-or-directory>`
        exit
    end
    put arg 0 into TargetPath

    if TargetPath ends with `.as`
    begin
        put TargetPath into CurFile
        gosub to CheckFile
    end
    else gosub to WalkTree

    print ``
    print `TOTAL: ` cat TotalFiles cat ` file(s); ` cat TotalWithConv cat ` with doc blocks, ` cat TotalWithoutConv cat ` without; ` cat TotalErrors cat ` error(s), ` cat TotalWarnings cat ` warning(s)`
    exit
!! @hash bce7528a
!!!

!! Iterative directory walker. Maintains WorkList as a LIFO stack of
!! directories still to visit. Recursion via gosub would clobber CurDir
!! across calls (no local scope in AS), so the explicit stack is safer.
!! Hidden entries are already filtered out by `the entries in`, but we
!! also skip generated/vendored trees by name to keep noise down.
!!
WalkTree:
    put 0 into WorkCount
    add 1 to WorkCount
    set the elements of WorkList to WorkCount
    index WorkList to 0
    put TargetPath into WorkList

WalkLoop:
    if WorkCount is 0 return
    take 1 from WorkCount
    index WorkList to WorkCount
    put WorkList into CurDir
    set Entries to the entries in CurDir
    put the count of Entries into EntryCount
    put 0 into K
    while K is less than EntryCount
    begin
        set Entry to item K of Entries
        put entry `name` of Entry into Name
        put entry `type` of Entry into EntryType
        put CurDir cat `/` cat Name into FullPath
        if EntryType is `dir`
        begin
            if Name is not `dist` and Name is not `vendor` and Name is not `deploy` and Name is not `node_modules`
            begin
                put WorkCount into WorkIdx
                add 1 to WorkCount
                set the elements of WorkList to WorkCount
                index WorkList to WorkIdx
                put FullPath into WorkList
            end
        end
        else if EntryType is `file`
        begin
            if Name ends with `.as`
            begin
                put FullPath into CurFile
                gosub to CheckFile
            end
        end
        add 1 to K
    end
    go to WalkLoop
!! @hash 671e8f2b
!!!

!! Analyse one file. Loads the source, runs the parser, then prints
!! the per-file report. A file with zero sections is flagged as having
!! no convention (the green-field case). Errors and warnings are
!! always printed; clean sections are summarised one line each.
!!
CheckFile:
    add 1 to TotalFiles
    load Source from CurFile
        on failure
        begin
            print `=== ` cat CurFile cat ` ===`
            print `  could not load`
            add 1 to TotalErrors
            return
        end

    put `` into FileReport
    put 0 into FileSecCount
    put 0 into FileErrors
    put 0 into FileWarnings
    put 0 into InSection
    gosub to ParseFile
    if InSection is 1 gosub to AppendUnclosedError

    print `=== ` cat CurFile cat ` ===`
    if FileSecCount is 0
    begin
        add 1 to TotalWithoutConv
        print `  no doc blocks (` cat LineCount cat ` lines)`
        return
    end
    add 1 to TotalWithConv
    add FileErrors to TotalErrors
    add FileWarnings to TotalWarnings
    print `  ` cat FileSecCount cat ` section(s), ` cat FileErrors cat ` error(s), ` cat FileWarnings cat ` warning(s)`
    print FileReport
    return
!! @hash 19a1e075
!!!

!! Line classifier. Reads global Line; writes Kind and (for DOC/META)
!! Content / MetaKey / MetaValue. Rules:
!!   Line equals `!!!`                              → TERM
!!   Line equals `!!`                               → DOC (blank prose)
!!   Line begins with `!! ` or `!!<tab>`            → DOC; if the body
!!                                                     starts with `@`,
!!                                                     reclassify as META
!!   Anything else                                  → CODE
!! Terminator and blank-prose lines tolerate trailing whitespace, so an
!! editor that strips it can't corrupt the file structure.
!!
Classify:
    put `CODE` into Kind
    if Line is `!!!`
    begin
        put `TERM` into Kind
        return
    end
    if Line is `!!`
    begin
        put `DOC` into Kind
        put `` into Content
        return
    end
    if Line starts with `!! ` or Line starts with `!!` cat tab
    begin
        put `DOC` into Kind
        put from 3 of Line into Content
        gosub to MaybeMeta
        return
    end
    return

MaybeMeta:
    if Content starts with `@`
    begin
        put `META` into Kind
        put from 1 of Content into Tmp
        put the position of ` ` in Tmp into Pos
        if Pos is less than 0
        begin
            put Tmp into MetaKey
            put `` into MetaValue
        end
        else
        begin
            put left Pos of Tmp into MetaKey
            add 1 to Pos
            put from Pos of Tmp into MetaValue
        end
    end
    return
!! @hash 56771d76
!!!

!! Parser & section state machine. Splits the source on newline (the
!! default for `split ... into`), then walks every line. Two dispatch
!! subroutines keep the inner loop flat: one for outside-a-section,
!! one for inside-a-section. Section bodies accumulate into SecCode and
!! are scored by CloseSection on terminator.
!!
ParseFile:
    put Source into Lines
    split Lines
    put the elements of Lines into LineCount
    put 0 into N
    while N is less than LineCount
    begin
        index Lines to N
        put Lines into Line
        gosub to Classify
        if InSection is 0 gosub to OutsideDispatch
        else gosub to InsideDispatch
        add 1 to N
    end
    return

OutsideDispatch:
    if Kind is `TERM` gosub to AppendOrphanError
    if Kind is `DOC` gosub to OpenSection
    if Kind is `META` gosub to OpenSection
    return

InsideDispatch:
    if Kind is `TERM` gosub to CloseSection
    if Kind is `META` gosub to RecordMeta
    if Kind is `CODE` gosub to AppendCode
    return

OpenSection:
    put N into SecStart
    add 1 to SecStart
    put 1 into InSection
    put `` into SecCode
    put `` into SecHash
    put `` into SecVerified
    put 0 into SecHasCode
    if Kind is `META` gosub to RecordMeta
    return

RecordMeta:
    if MetaKey is `hash` put MetaValue into SecHash
    if MetaKey is `verified` put MetaValue into SecVerified
    return

AppendCode:
    if SecCode is empty put Line into SecCode
    else put SecCode cat newline cat Line into SecCode
    if Line is not `` put 1 into SecHasCode
    return
!! @hash 24b116ad
!!!

!! Per-section scoring. When a TERM closes a section, hash whatever
!! code we collected and classify both the hash state and the verify
!! state, using the same names the Python tool emits so output is
!! interchangeable:
!!   hash:    fresh / stale / no-baseline / no-code
!!   verify:  verified-fresh / verified-stale / unverified / verified-no-code
!! Each section appends one line to FileReport. Stale or no-baseline
!! conditions also bump FileWarnings, contributing to the file's footer.
!!
CloseSection:
    add 1 to FileSecCount
    if SecHasCode is 0 gosub to ScoreNoCode
    else gosub to ScoreWithCode
    put FileReport cat `  line ` cat SecStart cat `: ` cat HashState cat `, ` cat VerifyState into FileReport
    if HashState is `stale`
    begin
        put FileReport cat `  (stored ` cat SecHash cat `, current ` cat CurHash cat `)` into FileReport
        add 1 to FileWarnings
    end
    if HashState is `no-baseline` and SecHasCode is 1
        put FileReport cat `  (current ` cat CurHash cat `)` into FileReport
    if VerifyState is `verified-stale`
    begin
        put FileReport cat `  [verified ` cat SecVerified cat ` is stale]` into FileReport
        add 1 to FileWarnings
    end
    put FileReport cat newline into FileReport
    put 0 into InSection
    return

ScoreNoCode:
    put `` into CurHash
    put `no-code` into HashState
    if SecVerified is empty put `unverified` into VerifyState
    else put `verified-no-code` into VerifyState
    return

ScoreWithCode:
    put hash SecCode into Tmp
    put left 8 of Tmp into CurHash
    if SecHash is empty put `no-baseline` into HashState
    else if SecHash is CurHash put `fresh` into HashState
    else put `stale` into HashState
    if SecVerified is empty put `unverified` into VerifyState
    else if SecVerified is CurHash put `verified-fresh` into VerifyState
    else put `verified-stale` into VerifyState
    return
!! @hash 787512f6
!!!

!! Structural-error issuers. These are conditions the analyser should
!! always loudly surface because they mean the file's section structure
!! is broken — a stray `!!` outside any section, or a section opener
!! with no matching terminator before EOF.
!!
AppendOrphanError:
    add 1 to FileErrors
    put N into LineNum
    add 1 to LineNum
    put FileReport cat `  line ` cat LineNum cat `: ERROR orphan-terminator (!! with no open section)` cat newline into FileReport
    return

AppendUnclosedError:
    add 1 to FileErrors
    put FileReport cat `  line ` cat SecStart cat `: ERROR unclosed-section (no terminator before EOF)` cat newline into FileReport
    return
!! @hash 671a5c9b
!!!