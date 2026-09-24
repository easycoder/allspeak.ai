!   trace-run.as — a small instrumented script, for looking at collected data.
!
!   Two windows: one bracketing a loop that calls a subroutine, and one left open so it
!   runs to the end of the program. Run it with:
!
!       python3 tools/asviz-run.py --run tools/trace-run.as
!
!   Three windows: a bounded one, an open one, and one scoped with `until thread` inside
!   a forked thread — which is where `until thread` means something, since a fork really
!   does start a thread of its own while a gosub does not.
!
!   Expected: Total prints 4, because a Python `fork` queues the new thread rather than
!   running it at once, so the worker's addition lands after the print. The trace reports
!   visits to the loop test once per iteration plus once for the exit, Work once per call,
!   and the worker's window closing itself when its thread ends. Deliberately no line
!   numbers: they are the output under test.

    variable N
    variable Total

Main:
    put 0 into N
    put 0 into Total

    viz start
    while N is less than 3
    begin
        gosub to Work
        add 1 to N
    end
    viz stop

    viz start
    gosub to Work
    viz stop

    fork to Worker

    print Total
    stop

Work:
    add 1 to Total
    return

Worker:
    viz start until thread
    add 2 to Total
    stop
