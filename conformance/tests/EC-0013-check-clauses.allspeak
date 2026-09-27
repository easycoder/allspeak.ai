! EC-0013: check failure clauses — 'or' bails out, 'on failure' recovers

script CheckClauses
variable X
put 3 into X
test `Recovery`
    check that X is 3 on failure gosub to FixUp
    log `recovered`
end test
test `Bail out`
    check that X is 9 or gosub to Cleanup
    log `unreachable`
end test
exit
FixUp:
    log `fixup`
    return
Cleanup:
    log `cleanup`
    return
