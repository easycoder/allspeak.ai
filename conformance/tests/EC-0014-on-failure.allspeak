! EC-0014: check failure clauses — a fired 'on failure' runs the action and continues

script CheckClauses2
variable X
put 9 into X
test `Recovery`
    check that X is 3 on failure gosub to FixUp
    log `continues`
end test
exit
FixUp:
    log `fixup`
    return
