from allspeak import Handler, ECValue, RuntimeError

class SQL(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)
        # target symbol name -> {'tableName': str, 'keys': list}
        self.tables = {}

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
