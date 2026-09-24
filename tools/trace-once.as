!   trace-once.as — one subroutine, called three times, with a window inside it.
!
!   Built to pin down what `once` means. With `once` the first call is recorded and the
!   later ones are ignored; with `each` all three are recorded as separate windows.
!
!       python3 tools/asviz-run.py --run tools/trace-once.as
!
!   Expected: N prints 3 either way; one window with `once`, three with `each`.

    variable N

Main:
    put 0 into N
    gosub to Work
    gosub to Work
    gosub to Work
    print N
    stop

Work:
    viz start
    add 1 to N
    viz stop
    return
