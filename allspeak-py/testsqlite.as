!   testsqlite.as -- exercises the SQL plugin's SQLite execution surface

    use plugin SQL from plugins/as_sql.py

    script TestSQLite

    database Pins
    dictionary Row
    list Rows
    variable NewId
    variable Status
    variable RowCount

!   --- Connect (file in /tmp so it's writable; remove first to start clean)

    connect Pins to sqlite `/tmp/allspeak-sqlite-test.db`
        or begin
            print `connect failed: ` cat the error message
            exit
        end

!   --- Schema (ad-hoc CREATE; the DDL generator is a separate concern)

    sql exec on Pins with `drop table if exists pins`
    sql exec on Pins with `create table pins (id integer primary key autoincrement, lat real not null, lng real not null, body text)`

!   --- Inserts inside a transaction

    sql begin Pins

    sql exec on Pins
        with `insert into pins (lat, lng, body) values (?, ?, ?)`
        and `51.5` `-0.12` `Big Ben`
        giving NewId
    print `Inserted id=` cat NewId

    sql exec on Pins
        with `insert into pins (lat, lng, body) values (?, ?, ?)`
        and `48.85` `2.35` `Eiffel Tower`
        giving NewId
    print `Inserted id=` cat NewId

    sql exec on Pins
        with `insert into pins (lat, lng, body) values (?, ?, ?)`
        and `40.69` `-74.04` `Statue of Liberty`
        giving NewId
    print `Inserted id=` cat NewId

    sql commit Pins

!   --- Single-row select (match)

    sql select Row from Pins
        with `select id, body from pins where id = ?`
        and 2
        or begin
            put `not found` into Status
        end
    print `Row 2 body: ` cat entry `body` of Row

!   --- Single-row select (no match — fires 'or' block)

    put `found` into Status
    sql select Row from Pins
        with `select id from pins where id = ?`
        and 999
        or begin
            put `not found` into Status
        end
    print `Lookup of id 999: ` cat Status

!   --- Multi-row select with bound parameters
!   The list is populated; iterating list-of-dict is an AllSpeak
!   idiom question separate from the SQL plugin and not exercised here.

    sql select Rows from Pins
        with `select id, body from pins where lat between ? and ?`
        and `-90` `90`
    put the count of Rows into RowCount
    print `Multi-row count: ` cat RowCount

!   --- Rollback demo

    sql begin Pins
    sql exec on Pins with `insert into pins (lat, lng, body) values (?, ?, ?)`
        and `0` `0` `should be rolled back`
        giving NewId
    print `Inserted (will rollback) id=` cat NewId
    sql rollback Pins

    sql select Row from Pins
        with `select count(*) as n from pins`
    print `Final row count: ` cat entry `n` of Row

    exit
