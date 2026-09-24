!   parser.as
!   Chemical formula parser.
!   Usage: allspeak parser.as [-u unit] [formula ...]
!   Example: allspeak parser.as H2O NaCl Na2CO3
!     H2O -> {"H":2,"O":1} 18.015 g/mol
!   Options: -u mg/mol | g/mol | kg/mol   (default g/mol)
!   Browser version: parser.html — same parser, same atomic-weights.json.
!   With no arguments the worked examples below are parsed instead.
!   Supported: element symbols (an uppercase letter, then any lowercase letters)
!   followed by an optional whole-number count, and (...) or [...] groups whose
!   contents are multiplied by a count after the closing bracket: K4[Fe(CN)6]
!   gives {"K":4,"Fe":1,"C":6,"N":6}. Repeated symbols sum, so CH3COOH gives
!   {"C":2,"H":4,"O":2}. Anything else — a leading coefficient, a hydrate dot, a
!   charge — is refused rather than guessed at, as is a formula whose groups
!   would spell out to more than 10000 characters.
!   Masses are summed from 3-decimal atomic weights held as milligrams per mole,
!   so they are exact. A formula containing an element outside the table still
!   reports its counts, with the missing weight named.

    script Parser
!! Constants: the digit characters, and the size at which a group expansion is refused.
!!
!! Element symbols are an uppercase letter followed by lowercase letters, and both halves of that are conditions in the language, so no alphabet needs listing here. Digits have no equivalent test — `is numeric` asks whether a value *is* a number, and a single-character string never is — so the ten digits are listed and membership is asked with `includes`.
!!
!! `includes` counts the empty string as a member of every string, so the count loop below also carries a position test.
!!
!! `ExpansionLimit` bounds how far a group may be spelt out. Expanding is what makes a repeated group cost time in proportion to the atoms it stands for, so a multiplier in the tens of thousands would grind rather than fail; refusing at the limit trades an unbounded wait for one clear line. Every chemically plausible formula sits far below it — even a polymeric `(C6H10O5)1000` comes to nine thousand characters.
    variable Digits
    variable ExpansionLimit

    put `0123456789` into Digits
    put 10000 into ExpansionLimit
!! @hash 26e67ab4
!! @verified 26e67ab4
!!!
!! Atomic weights: the data table, loaded from the file the browser version reads too.
!!
!! `atomic-weights.json` holds the standard 3-decimal atomic weights as exact integers in milligrams per mole — the unit the whole calculation already works in — and its `#doc` entry says so for anyone opening the file. Keeping the table out of the script is what lets the command-line version and the browser page weigh formulas from one set of numbers instead of two that can drift apart.
!!
!! Loading into a `dictionary` parses the JSON as it arrives, so no conversion step is needed and there is no `scale` call: the file already holds integers. The `#doc` entry loads as a key like any other and is never looked up, because an element symbol always starts with an uppercase letter.
!!
!! A formula naming an element that is not in the file is still counted — the counts are true whatever the table holds — but its mass is refused by name rather than treated as zero.
    dictionary AtomicWeights

    load AtomicWeights from `atomic-weights.json`
!! @hash 03fe9dd2
!! @verified 03fe9dd2
!!!
!! Units: the mass is stored once, in milligrams per mole, and the unit only decides how it is shown.
!!
!! Every conversion is a division of that stored integer, so no value is ever re-rounded: `18.015` in g/mol, `0.018015` in kg/mol and `18015` in mg/mol are three renderings of one integer, 18015. The two tables are written side by side, divisor then decimal places, so a unit cannot pick up one without the other.
    dictionary UnitDivisors
    dictionary UnitDigits

    reset UnitDivisors
    reset UnitDigits
    set entry `mg/mol` of UnitDivisors to 1
    set entry `mg/mol` of UnitDigits to 0
    set entry `g/mol` of UnitDivisors to 1000
    set entry `g/mol` of UnitDigits to 3
    set entry `kg/mol` of UnitDivisors to 1000000
    set entry `kg/mol` of UnitDigits to 6
!! @hash e2a0da92
!! @verified e2a0da92
!!!
!! State for the formula being walked: the text, how far along we are, the symbol and count read most recently, and the bracket-free form that the counting stage will read.
!!
!! `Formula` means "the text being walked right now" — the text the user typed during the expansion stage, and the expansion itself during the counting stage. The text as typed is kept separately, because error messages and the result line both quote that one.
!!
!! AllSpeak has a single global scope, so none of these are private to the section that uses them — the names are chosen so that the owner of each one is obvious.
!!
!! `IsValid` is the on/off flag, and its contract is what keeps a failure from passing silently: a reader sets it when it reads cleanly and the flag is cleared when anything is refused, so a stage can check it between steps, stop immediately, and leave it clear for the caller. Each stage sets it once more when the whole formula has been walked.
    variable Formula
    variable FormulaLength
    variable Pos
    variable Tail
    variable Ch
    variable Symbol
    variable CountText
    variable CountStart
    variable Count
    variable Total
    variable Reading
    variable Problem
    variable IsValid
    variable Expanded
!! @hash 07c05ca8
!! @verified 07c05ca8
!!!
!! State for the group expansion: one partial expansion per nesting level, the character that would close each open group, where each group began, how deep the walk currently is, and how much text the group being closed is about to add.
!!
!! The three stacks are variable arrays rather than dictionaries, sized once per formula. Depth cannot exceed the number of characters, so the bound costs nothing to compute. Level 0's text is the finished expansion — by then every `(...)` and `[...]` has been spelt out.
    variable TextStack
    variable BracketStack
    variable OpenAtStack
    variable StackSize
    variable Level
    variable Expected
    variable Inner
    variable Growth
    variable RepeatIndex
!! @hash 9cccfe22
!! @verified 9cccfe22
!!!
!! State for weighing a formula: the running total, the pieces each element contributes, and the unit the total will be shown in.
!!
!! `Mass` and `MassText` are the same number twice: an integer in milligrams per mole, and how that integer reads in the chosen unit. `MassProblem` is separate from `IsValid` on purpose — a formula can parse perfectly and still have no weight to show, and then the counts are still worth printing.
    variable Mass
    variable MassText
    variable MassProblem
    variable MassKeyCount
    variable MassIndex
    variable MassSymbol
    variable MassCount
    variable MassWeight
    variable Whole
    variable Frac
    variable FracText

    list MassKeys
    variable Unit
    variable UnitDivisor
    variable DecimalPlaces
!! @hash 6e27443f
!! @verified 6e27443f
!!!
!! State for the run as a whole: the formulas to report on, the text of the one in hand, the counts for it, and the pieces the JSON line is assembled from.
!!
!! `Counts` is the parser's actual result — one entry per distinct element symbol, which is what lets a repeated symbol add up instead of appearing twice.
    variable FormulaCount
    variable FormulaIndex
    variable ArgCount
    variable ArgIndex
    variable Original
    variable CurrentArg

    dictionary Counts
    list Formulas
    list Keys
    variable KeyCount
    variable KeyName
    variable KeyIndex
    variable Json
!! @hash 2a0d9476
!! @verified 2a0d9476
!!!
!! Entry point: report each formula given on the command line.
!!
!! `-u` picks the unit the masses are shown in and every other argument is a formula. With no formulas at all the worked examples stand in, so `allspeak parser.as` on its own shows what the parser does — `allspeak parser.as -u kg/mol` shows the same five in kilograms. A bad command line ends the run instead of guessing: a `-u` with nothing after it, or a unit that is not in the table.
!!
!! Each formula passes through MeasureFormula and prints as one line; the self-checks have the last word before the run ends.
    put `g/mol` into Unit
    reset Formulas
    put argc into ArgCount
    put 0 into ArgIndex
    while ArgIndex is less than ArgCount begin
        put arg ArgIndex into CurrentArg
        if CurrentArg is `-u` or CurrentArg is `--unit` begin
            add 1 to ArgIndex
            if ArgIndex is less than ArgCount begin
                put arg ArgIndex into Unit
            end
            else begin
                print `-u needs a unit: -u mg/mol, -u g/mol or -u kg/mol`
                exit
            end
        end
        else
            append CurrentArg to Formulas
        add 1 to ArgIndex
    end
    if UnitDivisors has no entry Unit begin
        print `unknown unit ` cat Unit cat `: use mg/mol, g/mol or kg/mol`
        exit
    end
    if the count of Formulas is 0 begin
        append `H2O` to Formulas
        append `NaCl` to Formulas
        append `Na2CO3` to Formulas
        append `Mg(OH)2` to Formulas
        append `K4[Fe(CN)6]` to Formulas
    end

    gosub ChooseUnit
    put the count of Formulas into FormulaCount
    put 0 into FormulaIndex
    while FormulaIndex is less than FormulaCount begin
        put item FormulaIndex of Formulas into Formula
        put Formula cat empty into Formula   ! a digit-only formula comes back from the list as a number; this forces text
        gosub MeasureFormula
        if IsValid gosub ShowCounts
        add 1 to FormulaIndex
    end

    gosub SelfChecks
    exit
!! @hash 8a6c91c5
!! @verified 8a6c91c5
!!!
!! MeasureFormula: run one formula through the whole pipeline and weigh it.
!!
!! The report loop and the self-checks both come through here, so there is one code path from text to mass: spell the groups out, count the elements, add up the weights. `Original` is set first because the counting stage overwrites `Formula`, and the counts and the mass are left in `Counts` and `Mass`.
!!
!! Input: `Formula`, holding the formula as typed.
MeasureFormula:
    put Formula into Original
    gosub ExpandGroups
    if not IsValid return
    gosub ParseFormula with Expanded
    if not IsValid return
    gosub ComputeMass
    return
!! @hash 608b8d3e
!! @verified 608b8d3e
!!!
!! ExpandGroups: spell every bracketed group out in full, leaving a bracket-free formula in `Expanded`.
!!
!! Counting groups and their multipliers in one pass would need a separate tally per nesting level, and AllSpeak dictionaries are declared rather than created on demand. Expanding is the simpler way round: `(OH)2` becomes `OHOH`, the brackets disappear, and the counting stage runs on a formula it already knows how to read. The expansion is exact for the same reason CH3COOH counts C twice — repeated symbols add up.
!!
!! Validation happens here, while the text the user typed is still in hand, so each refusal can quote that text and a position within it. Symbols and counts go through the same readers the counting stage uses; all this stage adds is the brackets themselves.
!!
!! Every symbol is written out with an explicit count, so `H2O` expands to `H2O1` and each token in the expansion looks like every other.
ExpandGroups:
    clear IsValid
    put the length of Formula into FormulaLength
    if FormulaLength is 0 begin
        put `the formula is empty` into Problem
        gosub RejectFormula with Problem
        return
    end
    put FormulaLength into StackSize
    add 1 to StackSize
    set the elements of TextStack to StackSize
    set the elements of BracketStack to StackSize
    set the elements of OpenAtStack to StackSize
    put 0 into Level
    index TextStack to 0
    put empty into TextStack
    put 0 into Pos
    while Pos is less than FormulaLength begin
        put from Pos of Formula into Tail
        put left 1 of Tail into Ch
        if Ch is uppercase begin
            gosub ReadSymbol
            if not IsValid return
            gosub ReadCount
            if not IsValid return
            index TextStack to Level
            put TextStack cat Symbol cat Count into TextStack
        end
        else if Ch is `(` or Ch is `[` begin
            gosub OpenGroup
        end
        else if Ch is `)` or Ch is `]` begin
            gosub CloseGroup
            if not IsValid return
        end
        else begin
            put `expected an element symbol at position ` cat Pos into Problem
            gosub RejectFormula with Problem
            return
        end
    end
    if Level is not 0 begin
        index OpenAtStack to 1
        put `unclosed group opened at position ` cat OpenAtStack into Problem
        gosub RejectFormula with Problem
        return
    end
    index TextStack to 0
    put TextStack into Expanded
    if Expanded is empty begin
        put `the formula names no elements` into Problem
        gosub RejectFormula with Problem
        return
    end
    set IsValid
    return
!! @hash 3ea85314
!! @verified 3ea85314
!!!
!! OpenGroup: open a nesting level at a bracket and remember how it must close.
!!
!! The bracket is remembered as the character that would close it rather than as the character seen, which makes the check at the closing end a single comparison. Its position is kept too, so a group left open can be reported by position rather than by guessing which one it was.
OpenGroup:
    add 1 to Level
    index TextStack to Level
    put empty into TextStack
    index BracketStack to Level
    if Ch is `(` put `)` into BracketStack
    else put `]` into BracketStack
    index OpenAtStack to Level
    put Pos into OpenAtStack
    add 1 to Pos
    return
!! @hash 96bf9add
!! @verified 96bf9add
!!!
!! CloseGroup: close the innermost group, repeating its contents by the count that follows the bracket.
!!
!! The count arrives after the group it multiplies, which is why the group's contents are still text at this point rather than tallies: the group's own expansion is appended to its parent's once per copy. `(OH)2` appends `OH` twice; `[Fe(CN)6]` appends the already-expanded `FeCNCNCNCNCNCN` once.
!!
!! The size of the result is worked out before a single copy is appended, so a multiplier large enough to be a problem is refused in one step instead of grinding through the copies first.
CloseGroup:
    if Level is 0 begin
        put `unmatched ` cat Ch cat ` at position ` cat Pos into Problem
        gosub RejectFormula with Problem
        return
    end
    index BracketStack to Level
    put BracketStack into Expected
    if Ch is not Expected begin
        put `mismatched bracket at position ` cat Pos into Problem
        gosub RejectFormula with Problem
        return
    end
    add 1 to Pos
    gosub ReadCount
    if not IsValid return
    index TextStack to Level
    put TextStack into Inner
    take 1 from Level
    index TextStack to Level
    put the length of Inner into Growth
    multiply Growth by Count
    add the length of TextStack to Growth
    if Growth is greater than ExpansionLimit begin
        put `spelling these groups out would take more than ` cat ExpansionLimit cat ` characters` into Problem
        gosub RejectFormula with Problem
        return
    end
    put 0 into RepeatIndex
    while RepeatIndex is less than Count begin
        put TextStack cat Inner into TextStack
        add 1 to RepeatIndex
    end
    return
!! @hash 0af49093
!! @verified 0af49093
!!!
!! ParseFormula: walk a bracket-free formula left to right, one symbol-and-count pair at a time, filling `Counts`.
!!
!! `Pos` is the whole state of the walk — each helper advances it past what it consumed. The flag starts cleared and is checked between helpers, so a formula this stage cannot read stops the walk instead of leaving a half-filled dictionary that would print as if it were a real answer.
!!
!! ExpandGroups has already accepted the input by this point, so the guards here are a backstop rather than the usual path; `Counts` is reset on every call, so a rejected formula never inherits the previous one's counts.
!!
!! Argument: parameter 0 is the bracket-free text from ExpandGroups.
ParseFormula:
    put parameter 0 into Formula
    reset Counts
    clear IsValid
    put the length of Formula into FormulaLength
    if FormulaLength is 0 begin
        put `the formula is empty` into Problem
        gosub RejectFormula with Problem
        return
    end
    put 0 into Pos
    while Pos is less than FormulaLength begin
        gosub ReadSymbol
        if not IsValid return
        gosub ReadCount
        if not IsValid return
        gosub AddCount
    end
    set IsValid
    return
!! @hash bd56298b
!! @verified bd56298b
!!!
!! ReadSymbol: read one element symbol at `Pos` and step past it.
!!
!! A symbol is an uppercase letter plus every lowercase letter following it, so `Na` and `Cl` are each one symbol and a bare `H` is another. Anything else at symbol position — the digit of a leading coefficient such as `2H2O`, a stray `.` — is refused with its position, because skipping it would report counts for a formula the user never wrote. ExpandGroups refuses the strays first, in the text as typed, so the refusal here is the counting stage's backstop.
!!
!! Both tests are conditions that an empty value fails, so the loop needs no position guard of its own: past the end of the formula the character is empty, and an empty value is neither uppercase nor lowercase.
!!
!! The flag is set when the symbol has been read cleanly. Each stage checks it between steps, so this is what stops a half-read formula from reaching the next step.
ReadSymbol:
    viz start
    clear IsValid
    put from Pos of Formula into Tail
    put left 1 of Tail into Ch
    if Ch is uppercase begin
        put Ch into Symbol
        add 1 to Pos
        put true into Reading
        while Reading begin
            put from Pos of Formula into Tail
            put left 1 of Tail into Ch
            if Ch is lowercase begin
                put Symbol cat Ch into Symbol
                add 1 to Pos
            end
            else
                clear Reading
        end
        set IsValid
    end
    else begin
        put `expected an element symbol at position ` cat Pos into Problem
        gosub RejectFormula with Problem
    end
    viz stop
    return
!! @hash b3a5a1db
!! @verified b3a5a1db
!!!
!! ReadCount: read the digits after a symbol, taking a missing count as one atom.
!!
!! Counts are whole digit runs rather than single digits, so C12H22O11 reads twelve and twenty-two. A count of zero is refused: `H0O` is a slip, not a formula, and reporting H:0 would invent an element the user never wrote.
!!
!! Like ReadSymbol, this sets the flag when it reads cleanly, because a caller may check it straight after — reading a group's multiplier is the one place where a reader runs before any symbol has been read.
!!
!! This loop is the one that still needs the position test: the digit test is `includes` on the listed digits, and an empty character is included by every string, so the flag alone would never clear at the end of the formula.
ReadCount:
    put empty into CountText
    put Pos into CountStart
    put true into Reading
    while Reading and Pos is less than FormulaLength begin
        put from Pos of Formula into Tail
        put left 1 of Tail into Ch
        if Digits includes Ch begin
            put CountText cat Ch into CountText
            add 1 to Pos
        end
        else
            clear Reading
    end
    if CountText is empty
        put 1 into Count
    else
        put the value of CountText into Count
    if Count is 0 begin
        put `a count of zero at position ` cat CountStart into Problem
        gosub RejectFormula with Problem
        return
    end
    set IsValid
    return
!! @hash f385187e
!! @verified f385187e
!!!
!! AddCount: fold the symbol just read into the running totals.
!!
!! This is where repeats collapse: CH3COOH lands on C, then H, then C again, and the second C adds to the first rather than starting a new entry. `has entry` is what separates a first sighting from a later one, because reading an entry that does not exist is an error rather than an empty value.
AddCount:
    if Counts has entry Symbol begin
        put entry Symbol of Counts into Total
        add Count to Total
        set entry Symbol of Counts to Total
    end
    else
        set entry Symbol of Counts to Count
    return
!! @hash 57dbaf9b
!! @verified 57dbaf9b
!!!
!! ComputeMass: add up the atomic weights behind the counts.
!!
!! The work is one multiplication per distinct element — its count times its weight, both exact integers — so the total carries no rounding at all: summing 18015 is the same however the elements were grouped in the formula, which is why `Mg(OH)2` and a formula written out flat weigh the same.
!!
!! A symbol the table does not know stops the sum and leaves a message in `MassProblem`. The counts it leaves behind are still true, so the caller prints them and names the weight it could not find rather than reporting a total that quietly omits an element.
ComputeMass:
    put empty into MassProblem
    put 0 into Mass
    put the keys of Counts into MassKeys
    put the count of MassKeys into MassKeyCount
    put 0 into MassIndex
    while MassIndex is less than MassKeyCount begin
        put item MassIndex of MassKeys into MassSymbol
        if AtomicWeights has no entry MassSymbol begin
            put `no atomic weight for ` cat MassSymbol into MassProblem
            return
        end
        put entry MassSymbol of AtomicWeights into MassWeight
        put entry MassSymbol of Counts into MassCount
        multiply MassWeight by MassCount
        add MassWeight to Mass
        add 1 to MassIndex
    end
    return
!! @hash 6a6c664f
!! @verified 6a6c664f
!!!
!! ChooseUnit: work out how the stored mass is to be shown in the chosen unit.
!!
!! Two numbers decide it: the divisor that turns milligrams per mole into the unit's own count, and the decimal places to print the fraction to. Both come straight from the unit's entries in the table above, and the unit has already been checked against that table, so there is nothing to fall back on here.
ChooseUnit:
    put entry Unit of UnitDivisors into UnitDivisor
    put entry Unit of UnitDigits into DecimalPlaces
    return
!! @hash 84104de6
!! @verified 84104de6
!!!
!! FormatMass: write the stored mass as a decimal string in the chosen unit.
!!
!! This is the display half of the scaled-integer pattern: divide out the scale for the whole part, keep the remainder for the fraction, then pad the fraction to the unit's width so that 18.015 does not come out as 18.15. `18.015` g/mol, `0.018015` kg/mol and `18015` mg/mol are the one stored integer 18015 with different divisors, which is why moving between units cannot change the mass.
FormatMass:
    divide Mass by UnitDivisor giving Whole
    put Mass modulo UnitDivisor into Frac
    put empty into FracText
    if DecimalPlaces is greater than 0 begin
        put Frac into FracText
        put FracText cat empty into FracText   ! the length test below needs text, and a number is not
        while the length of FracText is less than DecimalPlaces begin
            put `0` cat FracText into FracText
        end
        put `.` cat FracText into FracText
    end
    put Whole cat FracText into MassText
    return
!! @hash 2493956c
!! @verified 2493956c
!!!
!! RejectFormula: report why a formula could not be read and mark the parse failed.
!!
!! Refusing is the point of this section. A formula this parser does not understand — a leading coefficient, a hydrate dot, a charge — must not come back with counts that look as authoritative as a real answer, so the caller checks the flag and prints no counts at all.
!!
!! The line quotes `Original`, not `Formula`: by the time a refusal happens the stages have put their own working text in `Formula`, and the user needs to see what they typed.
!!
!! Argument: parameter 0 is the message shown to the user.
RejectFormula:
    put parameter 0 into Problem
    clear IsValid
    print Original cat ` -> not parsed: ` cat Problem
    return
!! @hash 531631d1
!! @verified 531631d1
!!!
!! ShowCounts: print the formula, its counts, and its mass as one line.
!!
!! The formula as the user typed it sits at the left — `Original`, not the expanded working text — so a run over several formulas stays legible without counting lines. The mass comes from `Mass` and `MassProblem`, both already filled in by MeasureFormula; when a weight was missing the counts still print, with the missing element named in brackets rather than a total that leaves it out.
ShowCounts:
    gosub FormatCounts
    if MassProblem is empty begin
        gosub FormatMass
        print Original cat ` -> ` cat Json cat ` ` cat MassText cat ` ` cat Unit
    end
    else
        print Original cat ` -> ` cat Json cat ` (` cat MassProblem cat `)`
    return
!! @hash 73f0980b
!! @verified 73f0980b
!!!
!! FormatCounts: render the current `Counts` dictionary as compact JSON text.
!!
!! The keys are snapshotted in insertion order, so elements come out in the order the formula presents them — Na, C, O for Na2CO3 — rather than sorted or in hash order. The text is built by hand because AllSpeak's JSON keywords write a dictionary to a file; no keyword returns a compact string.
FormatCounts:
    put the keys of Counts into Keys
    put the count of Keys into KeyCount
    put `{` into Json
    put 0 into KeyIndex
    while KeyIndex is less than KeyCount begin
        put item KeyIndex of Keys into KeyName
        put entry KeyName of Counts into Total
        if KeyIndex is greater than 0 put Json cat `,` into Json
        put Json cat `"` cat KeyName cat `":` cat Total into Json
        add 1 to KeyIndex
    end
    put Json cat `}` into Json
    return
!! @hash bee40440
!! @verified bee40440
!!!
!! Self-checks: the masses from the specification, the unit conversions, and what happens to an element with no weight.
!!
!! Every run ends here, so these are live checks rather than a suite that only runs on request — a passing check says nothing, and a failing one prints its line and carries on. `allspeak --test parser.as` reports the same blocks as a named suite, which is the quicker way to see them. Each case sets its own formula and goes through MeasureFormula, so no case depends on what the one before it left in `Counts` or `Mass`.
SelfChecks:
    test `Water is 18.015 g/mol`
        put `H2O` into Formula
        gosub MeasureFormula
        check that IsValid is true
        check that entry `H` of Counts is 2
        check that entry `O` of Counts is 1
        check that Mass is 18015
    end test

    test `Washing soda is 105.988 g/mol`
        put `Na2CO3` into Formula
        gosub MeasureFormula
        check that entry `Na` of Counts is 2
        check that entry `C` of Counts is 1
        check that entry `O` of Counts is 3
        check that Mass is 105988
    end test

    test `A group weighs exactly what it stands for`
        put `Mg(OH)2` into Formula
        gosub MeasureFormula
        check that entry `Mg` of Counts is 1
        check that entry `O` of Counts is 2
        check that entry `H` of Counts is 2
        check that Mass is 58319
    end test

    test `One mass reads out in every unit`
        put `H2O` into Formula
        gosub MeasureFormula
        put `g/mol` into Unit
        gosub ChooseUnit
        gosub FormatMass
        check that MassText is `18.015`
        put `kg/mol` into Unit
        gosub ChooseUnit
        gosub FormatMass
        check that MassText is `0.018015`
        put `mg/mol` into Unit
        gosub ChooseUnit
        gosub FormatMass
        check that MassText is `18015`
        put `18.015` scale 1000 into Whole
        check that Whole is 18015
    end test

    test `An element with no weight is named, not ignored`
        put `Xx2O` into Formula
        gosub MeasureFormula
        check that IsValid is true
        check that entry `O` of Counts is 1
        check that MassProblem is `no atomic weight for Xx`
    end test

    return
!! @hash 6867d825
!! @verified 6867d825
!!!
