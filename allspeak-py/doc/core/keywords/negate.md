# negate

## Syntax:
`negate {variable}`
`negate {value} giving {variable}`
## Examples:
`negate N`
`negate N giving Result`
## Description:
Negates a numeric value (multiplies its value by -1).

The in-place form (`negate X`) mutates the variable directly. The `giving` form
(`negate X giving Y`) negates the source and writes the result to Y, leaving X
unchanged.

Next: [on](on.md)  
Prev: [multiply](multiply.md)

[Back](../../README.md)
