!   trace-fixture.as — test input for the viz markers and the window analysis.
!
!   A coherent program containing one of each window shape, so every case is reachable
!   and easy to check by hand:
!
!     W1  opened and closed in a straight line — the ordinary case
!     W2  bracketing a loop, with a limit — revisits count as visits, so the cap matters
!     W3  opened at a named label and closed by a reachable stop
!     W4  with no stop and no scope — it runs until the limit or the end of the program,
!         which is what a thread that sets a flag needs: the work it triggered happens
!         after that thread has finished
!     W5  scoped with `until thread`, inside an event handler. A handler is a thread of
!         its own, so this closes when the handler ends; note that a `gosub` is not a new
!         thread, so the same marker inside a subroutine would mean the caller's thread
!     plus an extra stop that no window's own flow reaches; it is not reported, because
!         the return model says a call could reach it, so the tool stays quiet rather than
!         claim something it cannot support
!
!   Expected: ends=line where a stop lies on the window's own flow, ends=thread for the
!   scoped handler window, ends=open where the only stops in reach are past a call — with
!   a finding saying so — and W2 showing its own limit rather than the default. Findings
!   cover the loop in W2 and the starts that `once` will ignore. Deliberately no line
!   numbers here: they are the output under test.

    variable N
    variable Flag

Main:
    viz start
    put 0 into N
    viz stop

    viz start limit 50
    while N is less than 3
    begin
        add 1 to N
    end
    viz stop

    viz start on Watch
    gosub to Watch
    viz stop

    viz stop
    gosub to Branchy
    on message gosub to Flagged

    viz start
    put 3 into N
    stop

Watch:
    put 1 into N
    return

Branchy:
    viz start
    if Flag
    begin
        viz stop
    end
    else
    begin
        viz stop
    end
    stop

Flagged:
    viz start until thread
    set Flag
    stop
