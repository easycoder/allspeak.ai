! EC-0010: param N as a value expression and the param/parameter command forms
!
! Exercises: gosub ... with argument passing, the `param N` value expression
! (put / cat / forwarding), the `parameter` full form, the `param N into Var`
! command form, and the no-args / out-of-range fallbacks (numeric 0).

variable A
variable B
variable C

Main:
    gosub Greet with `slug` and 2026 and 5
    gosub Empty
    stop

Greet:
    param 0 into A
    log A
    put parameter 1 cat `-` cat param 2 into B
    log B
    gosub Relay with param 0 and param 2
    return

Relay:
    put param 0 cat `+` cat param 1 into C
    log C
    return

Empty:
    put param 0 into A
    log A
    put param 9 into C
    log C
    return
