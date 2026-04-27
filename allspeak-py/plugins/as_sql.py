import sqlite3
from allspeak import Handler, ECValue, RuntimeError
from allspeak.as_language import language

class SQL(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)
        # target symbol name -> {'tableName': str, 'keys': list}
        self.tables = {}
        # database symbol name -> sqlite3.Connection
        self.connections = {}

    def getName(self):
        return 'sql'

    #############################################################################
    # Keyword handlers

    # table {name}
    def k_table(self, command):
        return self.compileVariable(command, 'ECVariable')

    def r_table(self, command):
        return self.nextPC()

    # create {table} {name} [key/include ...]
    # {name} {flag(s)} {type} [default {value}] [check {expr}]
    def k_create(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record.get('keyword') == 'table':
                command['target'] = record['name']
                command['tableName'] = self.nextValue()
                keys = []
                while self.peek() in ['key', 'include']:
                    item = {}
                    token = self.nextToken()
                    if token == 'include':
                        item['include'] = self.nextValue()
                    else:
                        item['name'] = self.nextValue()
                        token = self.peek()
                        if token == 'primary':
                            item['primary'] = True
                            self.nextToken()
                        elif token == 'secondary':
                            item['secondary'] = True
                            self.nextToken()
                        elif token == 'required':
                            item['required'] = True
                            self.nextToken()
                        elif token == 'auto':
                            item['required'] = True
                            self.nextToken()
                        item['type'] = self.nextToken()
                        if self.peek() in ['default', '=']:
                            self.nextToken()
                            item['default'] = self.nextValue()
                        elif self.peek() == 'check':
                            self.nextToken()
                            item['check'] = self.nextValue()
                    keys.append(item)
                command['keys'] = keys
                self.add(command)
                return True
        return False

    def r_create(self, command):
        self.tables[command['target']] = {
            'tableName': self.textify(command['tableName']),
            'keys': command['keys'],
        }
        return self.nextPC()

    # get {variable} from {table} [as {form}]
    def k_get(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record.get('keyword') == 'variable':
                command['target'] = record['name']
                self.skip('from')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if record.get('keyword') == 'table':
                        command['entity'] = record['name']
                        if self.peek() == 'as':
                            self.nextToken()
                            command['form'] = self.nextToken()
                        else:
                            command['form'] = 'sql'
                        self.add(command)
                return True
        return False

    # Mapping from AllSpeak table column types to SQL type literals
    TYPE_MAP = {
        'string':   'VARCHAR(255)',
        'text':     'TEXT',
        'u64':      'BIGINT',
        'datetime': 'TIMESTAMPTZ',
        'uuid':     'UUID',
    }

    def r_get(self, command):
        target_record = self.getVariable(command['target'])
        entity_name = command['entity']
        form = command['form']
        config = self.tables.get(entity_name)
        if config is None:
            raise RuntimeError(self.program, f'Table "{entity_name}" has not been defined with "create"')

        output = []
        if form == 'sql':
            # -----------------------------------------------------------------
            # Rules for generating SQL
            table_name = config['tableName']
            keys = config['keys']
            output.append(f'DROP TABLE IF EXISTS {table_name} CASCADE;')
            output.append(f'CREATE TABLE {table_name} {{')
            includes = []
            for index, key in enumerate(keys):
                if 'include' in key:
                    name = self.textify(key['include'])
                    includes.append(f'{name}_id')
                    item = f'{name}_id BIGINT REFERENCES {name}'
                else:
                    parts = []
                    if 'secondary' in key:
                        output.append('  id BIGSERIAL PRIMARY KEY,')
                    parts.append(self.textify(key['name']))
                    vartype = key['type']
                    parts.append(self.TYPE_MAP.get(vartype, vartype.upper()))
                    if 'secondary' in key:
                        parts.append('UNIQUE NOT NULL')
                    if 'primary' in key:
                        parts.append('PRIMARY KEY')
                    if 'required' in key:
                        parts.append('NOT NULL')
                    if 'default' in key:
                        default = self.textify(key['default'])
                        parts.append(f"DEFAULT '{default}'")
                    if 'check' in key:
                        check = self.textify(key['check'])
                        parts.append(f'CHECK ({check})')
                    item = ' '.join(parts)
                if index < len(keys) - 1 or len(includes) > 0:
                    item = f'{item},'
                output.append(f'  {item}')
            if len(includes) > 0:
                joined = ', '.join(includes)
                output.append(f'  PRIMARY KEY ({joined})')
            output.append('};')
            # -----------------------------------------------------------------

        result = ECValue(domain='sql', type=str, content='\n'.join(output))
        self.putSymbolValue(target_record, result)
        return self.nextPC()

    def processOr(self, command, orHere):
        self.add(command)
        if language.reverse_word(self.peek()) == 'or':
            self.nextToken()
            self.nextToken()
            cmd = {}
            cmd['lino'] = command['lino']
            cmd['domain'] = 'core'
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            skip = self.getCodeSize()
            self.add(cmd)
            self.getCommandAt(orHere)['or'] = self.getCodeSize()
            self.compileOne()
            self.getCommandAt(skip)['goto'] = self.getCodeSize()

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    # database {name}
    def k_database(self, command):
        return self.compileVariable(command, 'ECVariable')

    def r_database(self, command):
        return self.nextPC()

    # connect {database} to sqlite {path} [or {command}]
    def k_connect(self, command):
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        if record.get('keyword') != 'database':
            return False
        command['target'] = record['name']
        if not self.nextIsWord('to'):
            return False
        engine = self.nextToken()
        if engine != 'sqlite':
            return False
        command['engine'] = engine
        command['path'] = self.nextValue()
        command['or'] = None
        orPC = self.getCodeSize()
        self.processOr(command, orPC)
        return True

    def r_connect(self, command):
        try:
            path = self.textify(command['path'])
            conn = sqlite3.connect(path)
            conn.row_factory = sqlite3.Row
            self.connections[command['target']] = conn
            return self.nextPC()
        except Exception as e:
            self.program.errorMessage = str(e)
            if command.get('or') is not None:
                return command['or']
            RuntimeError(self.program, str(e))

    # ------------------------------------------------------------------
    # Query execution
    # ------------------------------------------------------------------
    #
    # sql select {dict|list} from {database} with {query} [and {v} ...] [or {command}]
    # sql exec on {database} with {query} [and {v} ...] [giving {variable}] [or {command}]
    # sql begin {database} [or {command}]
    # sql commit {database} [or {command}]
    # sql rollback {database} [or {command}]

    def k_sql(self, command):
        action = self.nextToken()
        command['action'] = action
        if action == 'select':
            return self._compile_sql_select(command)
        if action == 'exec':
            return self._compile_sql_exec(command)
        if action in ('begin', 'commit', 'rollback'):
            return self._compile_sql_txn(command)
        return False

    def _compile_sql_select(self, command):
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        kw = record.get('keyword')
        if kw not in ('dictionary', 'list'):
            return False
        command['target'] = record['name']
        command['multi'] = (kw == 'list')
        if not self.nextIsWord('from'):
            return False
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        if record.get('keyword') != 'database':
            return False
        command['database'] = record['name']
        if not self.nextIsWord('with'):
            return False
        command['query'] = self.nextValue()
        command['params'] = self._read_params()
        command['or'] = None
        orPC = self.getCodeSize()
        self.processOr(command, orPC)
        return True

    def _compile_sql_exec(self, command):
        if not self.nextIsWord('on'):
            return False
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        if record.get('keyword') != 'database':
            return False
        command['database'] = record['name']
        if not self.nextIsWord('with'):
            return False
        command['query'] = self.nextValue()
        command['params'] = self._read_params()
        command['result'] = None
        if language.reverse_word(self.peek()) == 'giving':
            self.nextToken()
            if self.nextIsSymbol():
                command['result'] = self.getSymbolRecord()['name']
        command['or'] = None
        orPC = self.getCodeSize()
        self.processOr(command, orPC)
        return True

    def _compile_sql_txn(self, command):
        if not self.nextIsSymbol():
            return False
        record = self.getSymbolRecord()
        if record.get('keyword') != 'database':
            return False
        command['database'] = record['name']
        command['or'] = None
        orPC = self.getCodeSize()
        self.processOr(command, orPC)
        return True

    def _read_params(self):
        """Read 'and value [value ...]' parameter list. Each value must be
        an atom: a backtick string, a signed integer, or a registered
        symbol name. Reads stop at the first non-value token. Whitespace-
        separated; commas in source are not supported because AllSpeak's
        tokeniser splits on whitespace only."""
        params = []
        if language.reverse_word(self.peek()) != 'and':
            return params
        self.nextToken()  # consume 'and'
        while self._is_value_atom(self.peek()):
            params.append(self.nextValue())
        return params

    def _is_value_atom(self, token):
        if token is None:
            return False
        if token.startswith('`'):
            return True
        if token.isnumeric():
            return True
        if len(token) > 1 and token[0] == '-' and token[1:].isnumeric():
            return True
        return token in self.symbols

    # ------------------------------------------------------------------
    # SQL runtime dispatch
    # ------------------------------------------------------------------

    def r_sql(self, command):
        action = command['action']
        try:
            conn = self.connections.get(command['database'])
            if conn is None:
                raise Exception(f"Database '{command['database']}' is not connected")
            if action == 'select':
                self._run_select(command, conn)
            elif action == 'exec':
                self._run_exec(command, conn)
            elif action == 'begin':
                conn.execute('BEGIN')
            elif action == 'commit':
                conn.commit()
            elif action == 'rollback':
                conn.rollback()
            return self.nextPC()
        except Exception as e:
            self.program.errorMessage = str(e)
            if command.get('or') is not None:
                return command['or']
            RuntimeError(self.program, str(e))

    def _materialise_params(self, command):
        return tuple(self.textify(p) for p in command.get('params', []))

    def _row_to_dict(self, row):
        return {k: row[k] for k in row.keys()}

    def _run_select(self, command, conn):
        params = self._materialise_params(command)
        query = self.textify(command['query'])
        cursor = conn.execute(query, params)
        target_record = self.getVariable(command['target'])
        if command['multi']:
            rows = [self._row_to_dict(r) for r in cursor.fetchall()]
            self.putSymbolValue(target_record, ECValue(domain='sql', type='list', content=rows))
        else:
            row = cursor.fetchone()
            if row is None:
                # Empty single-row select: fire 'or' if present, else leave dict empty.
                self.putSymbolValue(target_record, ECValue(domain='sql', type='dict', content={}))
                if command.get('or') is not None:
                    raise Exception('No row matched')
            else:
                self.putSymbolValue(target_record, ECValue(domain='sql', type='dict', content=self._row_to_dict(row)))

    def _run_exec(self, command, conn):
        params = self._materialise_params(command)
        query = self.textify(command['query'])
        cursor = conn.execute(query, params)
        if command.get('result'):
            target_record = self.getVariable(command['result'])
            self.putSymbolValue(target_record, ECValue(domain='sql', type=int, content=cursor.lastrowid))

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition

    #############################################################################
    # Condition handlers
