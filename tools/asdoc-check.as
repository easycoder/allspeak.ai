!! Doc-block validator for AllSpeak (.as) source files — AllSpeak version.
!!
!! Reads a target file via the local server's /read endpoint, walks its
!! lines through a section-aware state machine, and reports for each
!! section whether its stored @hash matches the current code (drift) and
!! whether any @verified mark is still fresh.
!!
!! This is the AllSpeak counterpart to tools/asdoc-check.py — same
!! convention, same SHA-256 hashing (truncated to 8 hex chars), same
!! state names. The intended consumer is the upcoming two-pane editor,
!! which will drive this script per-block and turn the results into
!! green/yellow/grey badges.
!!
!! V1 is read-only: refreshing stored @hash lines (the Python tool's
!! --write mode) is not implemented yet and will land when the editor
!! is ready to call it on save.
!!!

    script ASDocCheck

!! Variable declarations, grouped by purpose so a reader can scan one
!! block at a time without flipping back and forth. Anything starting
!! with Sec... resets each time a new section opens.
!!
!   -- DOM --
    div Body
    input FilenameInput
    button CheckBtn
    pre Output

!   -- File under analysis --
    variable Filename
    variable Source
    variable Lines
    variable LineCount

!   -- Per-line lex state (rebuilt every iteration) --
    variable N
    variable Line
    variable Kind         ! `TERM`, `DOC`, `META`, `CODE`
    variable Content      ! body of a DOC/META line, after the `!! ` prefix
    variable MetaKey
    variable MetaValue

!   -- Per-section accumulators (rebuilt at OpenSection) --
    variable InSection    ! 0 outside any section, 1 inside one
    variable SecStart     ! 1-based line number of the opener
    variable SecCode      ! all CODE lines in this section, joined by newline
    variable SecHash      ! @hash value seen in this section, or empty
    variable SecVerified  ! @verified value seen in this section, or empty
    variable SecHasCode   ! 0 / 1; tracks any non-blank code line

!   -- Cross-section bookkeeping & report buffer --
    variable SecCount
    variable Errors
    variable Warnings
    variable CurHash
    variable HashState
    variable VerifyState
    variable Report
    variable Tmp
    variable Pos
    variable LineNum
!! @hash a1553da5
!!!

!! UI bootstrap. The page provides a filename input, a Check button, and
!! a <pre> for the report. We default to asedit.as because that is the
!! file we're dogfooding the doc-block convention on.
!!
    attach Body to body
    attach FilenameInput to `asdoc-filename`
    attach CheckBtn to `asdoc-check-btn`
    attach Output to `asdoc-output`
    set the content of FilenameInput to `asedit.as`
    on click CheckBtn go to RunCheck
    stop
!! @hash 0f0ee849
!!!

!! Main entry point. A click flushes the previous run's state, fetches
!! the file, drives the parser, and renders whatever Report has been
!! accumulated. Each downstream subroutine appends to Report — by the
!! time we paint, Report is the full output.
!!
RunCheck:
    put the value of FilenameInput into Filename
    set the content of Output to `Checking ` cat Filename cat ` ...`
    rest get Source from `/read/` cat Filename or go ReadFailed
    put `=== Doc-block check: ` cat Filename cat ` ===` cat newline cat newline into Report
    put 0 into SecCount
    put 0 into Errors
    put 0 into Warnings
    put 0 into InSection
    gosub to ParseFile
    if InSection is 1 gosub to AppendUnclosedError
    put Report cat newline into Report
    put Report cat SecCount cat ` section(s), ` cat Errors cat ` error(s), ` cat Warnings cat ` warning(s)` cat newline into Report
    set the content of Output to Report
    stop

ReadFailed:
    set the content of Output to `Could not read ` cat Filename cat ` — is the dev server running?`
    stop
!! @hash df7045e6
!!!

!! Line classifier. Reads the global Line and writes Kind, plus Content /
!! MetaKey / MetaValue when the line is DOC or META. The rules mirror
!! the Python tool exactly:
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

!! Parser & section state machine. Splits the source on newline (default
!! behaviour of `split ... into`), then walks every line. Two dispatch
!! subroutines keep the inner loop flat: one for "outside any section",
!! one for "inside one". Section bodies are accumulated into SecCode and
!! handed to CloseSection for scoring.
!!
ParseFile:
    split Source into Lines
    put the count of Lines into LineCount
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
!! @hash 833f45c7
!!!

!! Per-section scoring. When a TERM closes a section, hash whatever
!! code we collected and classify both the hash state and the verify
!! state using the same names the Python tool emits, so the editor can
!! treat both back-ends identically:
!!   hash:    fresh / stale / no-baseline / no-code
!!   verify:  verified-fresh / verified-stale / unverified / verified-no-code
!! One report line per section. Stale or missing-baseline conditions
!! also bump the warning / info counters in Report's footer.
!!
CloseSection:
    add 1 to SecCount
    if SecHasCode is 0 gosub to ScoreNoCode
    else gosub to ScoreWithCode
    put Report cat `line ` cat SecStart cat `: ` cat HashState cat `, ` cat VerifyState into Report
    if HashState is `stale`
    begin
        put Report cat `  (stored ` cat SecHash cat `, current ` cat CurHash cat `)` into Report
        add 1 to Warnings
    end
    if HashState is `no-baseline` and SecHasCode is 1
        put Report cat `  (current ` cat CurHash cat `)` into Report
    if VerifyState is `verified-stale`
    begin
        put Report cat `  [verified ` cat SecVerified cat ` is stale]` into Report
        add 1 to Warnings
    end
    put Report cat newline into Report
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
!! @hash df027596
!!!

!! Structural-error issuers. These are conditions the analyser should
!! always loudly surface because they mean the file's section structure
!! is broken — a stray `!!` outside any section, or an opener with no
!! matching terminator before EOF.
!!
AppendOrphanError:
    add 1 to Errors
    put N into LineNum
    add 1 to LineNum
    put Report cat `line ` cat LineNum cat `: ERROR orphan-terminator (!! with no open section)` cat newline into Report
    return

AppendUnclosedError:
    add 1 to Errors
    put Report cat `line ` cat SecStart cat `: ERROR unclosed-section (no terminator before EOF)` cat newline into Report
    return
!! @hash c12860ce
!!!
