!   anchors-fixture.as — test input for the viz plugin's anchor analysis.
!
!   Deliberately contains the shapes a healthy script does not: adjacent labels,
!   a loop whose body never runs, a single-line loop body, a nested loop, an
!   unreachable block, a trailing label, and an event handler whose target is
!   reachable only through the event. These are the cases where the analysis is
!   most likely to be wrong, and where a real script cannot falsify it. Not
!   documentation-worthy, so no doc blocks (as tools/modulo-test.as).
!
!   Expected: 10 labels, 5 loop tests, 1 event. The inner `while` of the nested
!   pair reports depth 1; the other four report depth 0. AdjacentA and AdjacentB
!   share a pc, because two labels on consecutive lines point at the same command
!   — so pc alone does not identify an anchor, and the label's own line has to
!   come from the tokeniser. Unreachable and Trailing report reachable=no;
!   EventOnly reports reachable=yes even though nothing jumps to it, because the
!   event registration names it. Deliberately no line numbers here: they are the
!   output under test, and writing them twice guarantees they drift.

    variable N
    variable M
    button Go

First:
    put 0 into N

Loop:
    while N is less than 3
    begin
        add 1 to N
    end

Nested:
    while N is less than 5
    begin
        while N is less than 2
        begin
            add 1 to N
        end
        add 1 to N
    end

NeverEntered:
    while N is greater than 100
    begin
        put 1 into N
    end

OneLine:
    while N is less than 3 add 1 to N

AdjacentA:
AdjacentB:
    put 0 into N

    on click Go go to EventOnly
    stop

Unreachable:
    put 1 into N

EventOnly:
    put 2 into N
    stop

Trailing:
