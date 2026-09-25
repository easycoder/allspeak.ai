!   strike-fixture.as — test input for the editor's unentered-block flag.
!
!   Blocks mode strikes through the row of any block that nothing enters. No script in the
!   repository has that shape and can also be compiled by the editor, so this one is made to
!   order: it uses nothing but core statements, and one of its blocks is never reached.
!
!   Expected, in Blocks mode: the row for "A block nothing enters" is struck through.
!
!       python3 tools/asviz-run.py tools/strike-fixture.as     (the flag, from the CLI)
!       node tools/asviz-run.js tools/strike-fixture.as        (the same, in the JS runtime)

!! A two-part demo: something that runs, and something that does not. `Total` is declared here because every name a script assigns to has to exist first. It exists so the editor's flag has a file to point at that the editor is able to compile — every other candidate either needs a plugin the editor page does not load, or has nothing wrong with it.
    variable Total

Main:
    put 2 into Total
    add 3 to Total
    gosub to Report
    stop
!! @hash cf126bf4
!!!
!! The part that runs: print the total. Kept separate from the setup above so the file has two reachable blocks, and so a reviewer can see that most of it is ordinary.
Report:
    print Total
    return
!! @hash 6df3b64d
!!!
!! A block nothing enters. Nothing calls it, nothing jumps to it, and no name in the file mentions it, which is the shape the flag looks for: an anchor the analysis can reach from no call site.
UnusedHelper:
    put 99 into Total
    return
!! @hash 086c26fa
!!!
