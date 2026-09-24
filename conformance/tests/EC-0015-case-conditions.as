! EC-0015: uppercase / lowercase conditions

variable Upper
variable Lower
variable Mixed
variable Digits

put `HELLO WORLD-2` into Upper
put `hello` into Lower
put `Hello` into Mixed
put `123` into Digits

if Upper is uppercase
begin
    log `uppercase ok`
end

if Upper is upper case
begin
    log `upper case ok`
end

if Lower is lowercase
begin
    log `lowercase ok`
end

if Lower is lower case
begin
    log `lower case ok`
end

if Upper is not lowercase
begin
    log `not lowercase ok`
end

if Lower is not uppercase
begin
    log `not uppercase ok`
end

if Mixed is uppercase
begin
    log `bad mixed uppercase`
end

if Mixed is lowercase
begin
    log `bad mixed lowercase`
end

if Digits is uppercase
begin
    log `bad digits uppercase`
end

if Digits is lowercase
begin
    log `bad digits lowercase`
end
