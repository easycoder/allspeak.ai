import sys
from .as_classes import FatalError
from .as_value import Value
from .as_condition import Condition
from .as_language import language

class Compiler:

	def __init__(self, program):
		self.program = program
		self.value = Value(self)
		self.condition = Condition(self)
		self.marker = 0
		self.script = self.program.script
		self.tokens = self.script.tokens
		self.symbols = self.program.symbols
		self.code = self.program.code
		self.program.compiler = self
		self.compileConstant = self.value.compileConstant
		self.debugCompile = False
		self.index = 0
		self.warnings = []
		self.valueTypes = {}

	# Get the current code size. Used during compilation
	def getCodeSize(self):
		return len(self.program.code)

	# Get the current index (the program counter)
	def getIndex(self):
		return self.index

	# Move the index along
	def next(self):
		self.index += 1

	# Get the current token
	def getToken(self):
		if self.index >= len(self.tokens):
			FatalError(self, 'Premature end of script')
		return self.tokens[self.index].token

	# Get the next token
	def nextToken(self):
		self.index += 1
		return self.getToken()

	# Peek ahead to see the next token without advancing the index
	def peek(self):
		try:
			return self.tokens[self.index + 1].token
		except:
			return None

	# Peek ahead at the line number of the next token, without advancing. getLino()
	# reports the line of the token already consumed, which cannot answer "is the next
	# token still on this statement's line?"
	def peekLino(self):
		try:
			return self.tokens[self.index + 1].lino
		except:
			return None

	# Get a constant
	def getConstant(self, token):
		self.index += 1
		return self.compileConstant(token)

	# Get a value
	def getValue(self):
		self.program.ensureNotRunning()
		return self.value.compileValue()

	# Get the next value
	def nextValue(self):
		self.program.ensureNotRunning()
		self.index += 1
		return self.value.compileValue()

	# Get a condition
	def getCondition(self):
		return self.condition.compileCondition()

	# Get the next condition
	def nextCondition(self):
		self.index += 1
		return self.condition.compileCondition()

	# Test if the current token has a specified value
	def tokenIs(self, value):
		return self.getToken() == value

	# Test if the next token has the specified value
	def nextIs(self, value):
		return self.nextToken() == value

	# Language-aware token check: matches any form of a canonical word
	# e.g. isWord('into') matches 'in' (Italian) or 'into' (English)
	def isWord(self, canonical):
		return language.matches_word(self.getToken(), canonical)

	# Language-aware next token check
	def nextIsWord(self, canonical):
		self.index += 1
		return self.isWord(canonical)

	# Get the canonical form of the current token
	def canonicalToken(self):
		return language.reverse_word(self.getToken())

	# Get the canonical form of the next token
	def nextCanonicalToken(self):
		self.index += 1
		return language.reverse_word(self.getToken())

	# Get the command at a given pc in the code list
	def getCommandAt(self, pc):
		return self.program.code[pc]

	# Add a command to the code list
	def addCommand(self, command, debug=True):
		command['debug'] = debug
		command['bp'] = False
		self.code.append(command)

	# Test if the current token is a symbol
	def isSymbol(self):
		token = self.getToken()
		try:
			self.symbols[token]
		except:
			return False
		return True

	# Test if the next token is a symbol
	def nextIsSymbol(self):
		self.next()
		return self.isSymbol()
	
	# Skip the next token if it matches the value given
	def skip(self, token):
		next = self.peek()
		if type(token) == list:
			for item in token:
				if next == item:
					self.nextToken()
					return
		elif next == token:
			self.nextToken()

	# Language-aware skip: skip next token if it matches any form of a canonical word
	def skipWord(self, canonical):
		next = self.peek()
		if next and language.matches_word(next, canonical):
			self.nextToken()

	# Skip common articles (optional syntactic noise for readability/disambiguation)
	# Language-aware: matches all forms of 'the', 'a', 'an' in the active language
	def skipArticles(self):
		while True:
			next_tok = self.peek()
			if next_tok and (language.matches_word(next_tok, 'the')
				or language.matches_word(next_tok, 'an')):
				self.nextToken()
			else:
				break

	# Rewind to a given position in the code list
	def rewindTo(self, index):
		self.index = index

	# Get source line number containing the current token
	def getLino(self):
		if self.index >= len(self.tokens):
			return 0
		return self.tokens[self.index].lino

	# Issue a warning
	def warning(self, message):
		self.warnings.append(f'Warning at line {self.getLino() + 1} of {self.program.name}: {message}')

	# Print all warnings
	def showWarnings(self):
		for warning in self.warnings:
			print(warning)

	# Get the symbol record for the current token (assumes it is a symbol name)
	def getSymbolRecord(self, name=None):
		self.program.ensureNotRunning()
		if name == None: name = self.getToken()
		if not name in self.symbols:
			FatalError(self, f'Undefined symbol name "{name}"')
			return None
		symbol = self.symbols[name]
		if symbol == None: return None
		record = self.code[symbol]
		record['used'] = True
		return record

	# Add a value type
	def addValueType(self):
		name = self.peek()
		record = None
		try:
			record = self.symbols[name]
		except:
			pass
		if record != None:
			raise FatalError(self, f'Duplicate symbol name "{name}"')
		self.valueTypes[name] = True

	# Test if a given value is in the value types list
	def hasValue(self, type):
		return type in self.valueTypes
	
	# Instantiate an object of the given class name
	def instantiate(self, classname):
		# Search through all loaded modules for the class
		items = list(sys.modules.items())
		for module_name, module in items:
			if module is None:
				continue
			try:
				if hasattr(module, classname):
					cls = getattr(module, classname)
					# Verify it's actually a class
					if isinstance(cls, type):
						# Attempt to instantiate
						try:
							return cls()
						except TypeError as ex:
							raise FatalError(self, f"Object instantiation error: {ex}")
			except Exception:
				continue
		return None

	# Compile a variable
	def compileVariable(self, command, classname):
		return self.compileSymbol(command, self.nextToken(), classname)

	# Compile a symbol
	def compileSymbol(self, command, name, classname):
		# January 2026
		# try:
		# 	self.symbols[name]
		# 	raise FatalError(self, f'Duplicate symbol name "{name}"')
		# except: pass
		command['name'] = name
		command['classname'] = classname
		command['program'] = self.program
		command['used'] = False
		self.symbols[name] = self.getCodeSize()
		if classname != ':':
			object = self.instantiate(classname)
			command['object'] = object
			if object != None:
				command['type'] = 'symbol'
				object.setName(name) # type: ignore
		self.addCommand(command, False)
		return True

	# Compile a program label (a symbol ending with ':')
	def compileLabel(self, command):
		return self.compileSymbol(command, self.getToken(), ':')

	# Compile the current token
	def compileToken(self):
		self.warnings = []
		token = self.getToken()
		# print(f'Compile {token}')
		if not token:
			return False
		mark = self.getIndex()
		for domain in self.program.getDomains():
			handler = domain.keywordHandler(token)
			if handler:
				command = {}
				command['domain'] = domain.getName()
				command['lino'] = self.tokens[self.index].lino
				# Store the canonical keyword, not the translated one
				command['keyword'] = language.reverse_word(token)
				result = handler(command)
				if result:
					return result
				else:
					self.rewindTo(mark)
			else:
				self.rewindTo(mark)
		FatalError(self, language.diagnostic('unknownCommand',
			{'token': token, 'line': self.getLino() + 1}))

	# Compile a single command
	def compileOne(self):
		keyword = self.getToken()
		if not keyword:
			return False
#		print(f'Compile keyword "{keyword}"')
		# Skip the 'info' directive (used by 'allspeak info <script>')
		if keyword == 'info' or keyword == language.word('info'):
			self.nextToken()  # skip the info text
			return True
		if keyword.endswith(':'):
			command = {}
			command['domain'] = None
			command['lino'] = self.tokens[self.index].lino
			return self.compileLabel(command)
		else:
			return self.compileToken()

	# Compile the script
	def compileFrom(self, index, stopOn):
		self.index = index
		while True:
			token = self.tokens[self.index]
			if self.debugCompile: print(f'{token.lino + 1}: {self.script.lines[token.lino]}')
			if self.compileOne() == True:
				if self.index == len(self.tokens) - 1:
					return True
				token = self.nextToken()
				if token in stopOn or language.reverse_word(token) in stopOn:
					return True
			else:
				return False

	# Compile fom the current location, stopping on any of a list of tokens
	def compileFromHere(self, stopOn):
		return self.compileFrom(self.getIndex(), stopOn)

	# Check for a language directive at the start of the script
	# Syntax: "language <name>" e.g. "language it"
	def checkLanguageDirective(self):
		if len(self.tokens) < 2:
			return
		token = self.tokens[0].token
		if token == 'language' or token == language.word('language'):
			lang_name = self.tokens[1].token
			if language.load_by_name(lang_name):
				self.index = 2  # skip past the directive
			else:
				self.warning(f"Language pack '{lang_name}' not found")

	# Compile from the start of the script
	def compileFromStart(self):
		self.checkLanguageDirective()
		return self.compileFrom(self.index if hasattr(self, 'index') else 0, [])