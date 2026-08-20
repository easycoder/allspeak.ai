import time, sys, json, traceback, threading, os, glob as globmod
from copy import deepcopy
from collections import deque

from .as_classes import (
	Script,
	Token,
	FatalError,
	RuntimeError,
	NoValueRuntimeError,
	ECObject,
	ECValue,
	normalize_type
)
from .as_compiler import Compiler
from .as_core import Core
from .as_language import language
import importlib
from importlib.metadata import PackageNotFoundError, version

# Intent queue for callbacks from other threads (e.g., MQTT)
intent_queue = deque()
intent_lock = threading.Lock()

flushes = 0

# Flush the queue
def flush():
	global queue, intent_queue, flushes
#	print('Start flush',flushes)
	# First process any pending intents from other threads
	with intent_lock:
		while len(intent_queue):
			intent = intent_queue.popleft()
			queue.append(intent)
	# Then process the main queue
	while len(queue):
		item = queue.popleft()
		item.program.flush(item.pc)
#	print('End flush',flushes)
	flushes += 1

class Program:

	def __init__(self, arg, testMode=False):
		global queue
		self.testMode = testMode
		try:
			allspeak_version = version("allspeak-ai")
		except PackageNotFoundError:
			from . import __version__ as allspeak_version
		if not testMode:
			print(f'AllSpeak version {allspeak_version}')
		if len(arg) == 0:
			print('No script supplied')
			exit()
		if arg in ['-v', '--version']: return
		if arg[0:6] == 'debug ':
			print('Debug mode requested')
			parts = arg[6:].split()
			self.scriptName = parts[0]
			self.argv = parts[1:]
			self.debugging = True
		else:
			parts = arg.split()
			self.scriptName = parts[0]
			self.argv = parts[1:]
			self.debugging = False

		f = open(self.scriptName, 'r')
		source = f.read()
		f.close()
		queue = deque()
		self.domains = []
		self.domainIndex = {}
		self.name = os.path.basename(self.scriptName) if testMode else '<anon>'
		self.code = []
		self.pc = 0
		self.symbols = {}
		self.onError = 0
		self.errorMessage = ''
		self.debugStep = False
		self.debugSkip = False
		self.stack = []
		self.script = Script(source)
		self.compiler = Compiler(self)
		# Load the default (English) language pack if none is loaded
		if not language.pack:
			language.load_by_name('en')
		self.object = ECObject()
		self.value = self.compiler.value
		self.condition = self.compiler.condition
		self.graphics = None
		self.mqtt = None
		self.psutil = None
		self.server = None
		self.email = None
		self.useClass(Core)
		self.ticker = 0
		self.graphicsRunning = False
		self.debugger = None
		self.graphics_app = None
		self.running = False
		self.parent = None
		self.message = None
		self.replyVar = None
		self.onMessagePC = 0
		self.breakpoint = False
		# Test-runner state (see printTestSummary)
		self.testExitCode = 0
		self.summaryPrinted = False
		self.errorRouted = False
		self.testSuite = {
			'name': None,
			'tests': [],
			'default': {
				'checks': 0,
				'passed': 0,
				'failed': 0,
				'errored': False,
				'errorMsg': None,
				'firstFailure': None,
			},
		}
		self.currentTest = None
	# Queue an intent to run at a given PC (thread-safe for MQTT callbacks)
	def queueIntent(self, pc):
		global intent_queue
		with intent_lock:
			item = ECValue()
			item.program = self # type: ignore
			item.pc = pc # type: ignore
			intent_queue.append(item)
	# This is called at 10msec intervals by the GUI code
	def flushCB(self):
		self.ticker += 1
		# if self.ticker % 1000 == 0: print(f'GUI Tick {self.ticker}')
		flush()

	def start(self, parent=None, module = None, exports=[]):
		self.parent = parent
		self.exports = exports
		if self.debugging:
			self.useGraphics()
		if module != None:
			module['child'] = self
		startCompile = time.time()
		self.tokenise(self.script)
		if self.compiler.compileFromStart():
			finishCompile = time.time()
			if not self.testMode:
				s = len(self.script.lines)
				t = len(self.script.tokens)
				print(f'Compiled {self.name}: {s} lines ({t} tokens) in ' +
					f'{round((finishCompile - startCompile) * 1000)} ms')
				for name in self.symbols.keys():
					record = self.code[self.symbols[name]]
					if name[-1] != ':' and not record['used']:
						print(f'Variable "{name}" not used')
				print(f'Run {self.name}')
			self.run(0)
		else:
			self.compiler.showWarnings()

		# If debugging is enabled and graphics module is available,
		# launch debugger and event loop
		if self.debugging and self.graphics is not None and self.debugger is None:
			print('Starting debugger...')
			try:
				from PySide6.QtWidgets import QApplication
				from .debugger.as_debug import Debugger
				
				# Create QApplication if needed
				app = QApplication.instance()
				if app is None:
					print('Creating QApplication for debugger...')
					app = QApplication(sys.argv)
					self.graphics_app = app
				
				# Create debugger
				self.debugger = Debugger(self)
				self.debugger.enableBreakpoints()
				
				# If this is the main script and graphics are enabled, run event loop
				if parent == None and not self.graphicsRunning:
					print('Running debugger event loop...')
					self.graphics_app.exec() if self.graphics_app else app.exec()
			except Exception as e:
				print(f'Warning: Could not start debugger: {e}')
				import traceback
				traceback.print_exc()
		# If this is the main script and there's no graphics/debugger, run a main loop
		elif parent == None and not self.graphicsRunning:
			delay_event = threading.Event()
			while not self.graphicsRunning:
				if self.running == True:
					flush()
					delay_event.wait(0.01)
				else:
					break
	
	# Use the graphics module
	def useGraphics(self):
		if self.graphics == None:
			print('Loading graphics module')
			from .as_graphics import Graphics
			self.graphics = Graphics
			self.useClass(Graphics)
		return True

	# Print the test-mode summary and compute the exit code (0 = all passed,
	# 1 = at least one check failed or a test errored). Output shape matches
	# the JS runtime for conformance parity.
	def printTestSummary(self):
		suite = self.testSuite
		self.summaryPrinted = True
		lines = []
		lines.append(f'Test suite: {self.name}')
		for t in suite['tests']:
			if t['errored']:
				lines.append(f'  \u2717 {t["name"]} (error: {t["errorMsg"]})')
			elif t['failed'] > 0:
				lines.append(f'  \u2717 {t["name"]} (FAIL: {t["firstFailure"]["condition"]} '
					f'\u2014 line {t["firstFailure"]["lino"]})')
			else:
				lines.append(f'  \u2713 {t["name"]} ({t["checks"]} checks)')
		totalChecks = suite['default']['checks']
		totalPassed = suite['default']['passed']
		totalFailed = suite['default']['failed']
		failedTests = 0
		for t in suite['tests']:
			totalChecks += t['checks']
			totalPassed += t['passed']
			totalFailed += t['failed']
			if t['failed'] > 0 or t['errored']:
				failedTests += 1
		passedTests = len(suite['tests']) - failedTests
		lines.append('')
		lines.append(f'{len(suite["tests"])} tests, {passedTests} passed, {failedTests} failed '
			f'\u2014 {totalChecks} checks, {totalPassed} passed, {totalFailed} failed')
		for line in lines:
			print(line)
		self.testExitCode = 1 if (failedTests > 0 or totalFailed > 0) else 0
	
	# Use the MQTT module
	def useMQTT(self):
		if self.mqtt == None:
			print('Loading MQTT module')
			from .as_mqtt import MQTT
			self.mqtt = MQTT
			self.useClass(MQTT)
		return True
	
	# Use the server module
	def useServer(self):
		if self.server == None:
			print('Loading server module')
			from .as_server import Server
			self.server = Server
			self.useClass(Server)
		return True

	# Use the psutil module
	def usePSUtil(self):
		if self.psutil == None:
			print('Loading psutil module')
			from .as_psutil import PSUtil
			self.psutil = PSUtil
			self.useClass(PSUtil)
		return True

	# Use the email module
	def useEmail(self):
		if self.email == None:
			print('Loading email module')
			from .as_email import Email
			self.email = Email
			self.useClass(Email)
		return True

	# Indicate that graphics are running
	def startGraphics(self):
		self.graphicsRunning = True

	# Import a plugin
	def importPlugin(self, source):
		args=source.split(':')
		if len(args)<2:
			RuntimeError(None, f'Invalid plugin spec "{source}"')
		idx=args[0].rfind('/')
		if idx<0:
			sys.path.append('.')
			module=args[0]
		else:
			sys.path.append(args[0][0:idx])
			module=args[0][idx+1:len(args[0])]
		module = module.replace('/','.').replace('.py','')
		module = importlib.import_module(module)
		plugin = getattr(module, args[1])
		self.useClass(plugin)

	# Use a specified class
	def useClass(self, clazz):
		handler = clazz(self.compiler)
		self.domains.append(handler)
		self.domainIndex[handler.getName()] = handler

	# This is the runtime callback for event handlers
	def callback(self, item, record, goto):
		object = self.getObject(record)
		values = object.getValues() # type: ignore
		for i, v in enumerate(values):
			if isinstance(v, ECValue): v = v.getContent()
			if v == item:
				object.setIndex(i) # type: ignore
				self.run(goto)
				return
	
	# Ensure the program is running
	def ensureRunning(self):
		if not self.running:
			raise FatalError(self.compiler, 'Improper use of runtime function')
	
	# Ensure the program is not running
	def ensureNotRunning(self):
		if self.running:
			raise RuntimeError(self, 'Improper use of non-runtime function')

	# Get the domain list
	def getDomains(self):
		return self.domains
	
	def isSymbol(self, name):
		return name in self.symbols

	# Get the symbol record for a given name
	def getVariable(self, name):
		self.ensureRunning()
		if isinstance(name, dict): name = name['name']
		if not name in self.symbols:
			RuntimeError(self, f'Unknown symbol \'{name}\'')
		target = self.code[self.symbols[name]]
		if 'import' in target:
			target = target['import']
		return target
	
	# Get the object represented by a symbol record
	def getObject(self, record):
		if isinstance(record, dict) and 'object' in record:
			return record['object']
		return record

	# Check if an object is an instance of a given class
	# This can either be  variable record (a dict) or an instance of ECObject
	def isObjectType(self, object, classes):
		if isinstance(object, dict) and 'object' in object and isinstance(object['object'], ECObject):
			object = object['object']
		return isinstance(object, classes)

    # Check if the object is an instance of one of a set of classes. Compile and runtime
	def checkObjectType(self, object, classes):
		if isinstance(object, dict): return
		if not isinstance(object, classes):
			if isinstance(classes, tuple):
				class_names = ", ".join([c.__name__ for c in classes])
				message = f"Variable {object.name} should be one of {class_names}"
			else:
				class_names = classes.__name__
				message = f"Variable {object.name} should be {class_names}"
			if self.running:
				raise RuntimeError(self, message)
			else:
				raise FatalError(self.compiler, message)

	# Get the inner (non-EC) object from a name, record or object
	def getInnerObject(self, object):
		if isinstance(object, dict): object = object['object']
		elif isinstance(object, str):
			record = self.getVariable(object) # type: ignore
			object = self.getObject(record) # type: ignore
		value = object.getValue() # type: ignore
		if isinstance(value, ECValue) and value.getType() == 'object':
			return value.getContent()
		else: return value

	def constant(self, content, numeric):
		result = {}
		result['type'] = int if numeric else str
		result['content'] = content
		return result
	
	# Test if an item is a string or a number
	def getItemType(self, value):
		return int if isinstance(value, int) else str

	# Get the value of an item that may be an ECValue or a raw value. Return as an ECValue
	def getValueOf(self, item):
		value = ECValue()
		if isinstance(item, ECValue):
			if item.getType() == 'object':
				return item.getContent()
			else: value = item
		else:
			varType = type(item).__name__
			if varType == 'int': value.setValue(type=int, content=item)
			elif varType == 'str': value.setValue(type=str, content=item)
			elif varType == 'bool': value.setValue(type=bool, content=item)
			elif varType == 'float': value.setValue(type=str, content=str(item))
			elif varType == 'list': value.setValue(type=list, content=item)
			elif varType == 'dict': value.setValue(type=dict, content=item)
			else: value.setValue(type=None, content=None)
		return value
	
	# Get the value of an item from its domain handler
	def textifyInDomain(self, value):
		domainName = value.getDomain()  # type: ignore
		if domainName == None: domainName = 'core'
		domain = self.domainIndex[domainName]
		handler = domain.valueHandler(value.getType()) # type: ignore
		result = handler(value) if handler else None
		return result

	# Runtime function to evaluate an ECObject or ECValue. Returns another ECValue
	# This function may be called recursively by value handlers.
	def evaluate(self, item):
		self.ensureRunning()
		if isinstance(item, ECObject):
			value = item.getValue()
			if value == None:
				raise RuntimeError(self, f'Symbol {item.getName()} not initialized')
		else: value = item
		try:
			valType = normalize_type(value.getType()) # type: ignore
		except:
			RuntimeError(self, 'Value does not hold a valid ECValue')
		result = ECValue(type=valType)
	
		if valType in ('str', 'int', 'bool', 'list', 'dict', None):
			# Simple value - just return the content
			result.setContent(value.getContent()) # type: ignore
		
		elif valType == 'object':
			# Object other than ECVariable
			record = self.getVariable(value.getName())
			object = self.getObject(record) # type: ignore
			result = object.getContent() # type: ignore

		elif valType == 'symbol': # type: ignore
			# If it's a symbol, get its value
			record = self.getVariable(value.getName()) # type: ignore
			if not 'object' in record: return None # type: ignore
			variable = self.getObject(record) # type: ignore
			result = variable.getValue() # type: ignore
			if isinstance(result, ECValue): return self.evaluate(result)
			if isinstance(result, ECObject): return result.getValue()
			if isinstance(result, dict) or isinstance(result, list):
				return result
			# See if one of the domains can handle this value
			value = result
			result = None
			for domain in self.domains:
				result = domain.getUnknownValue(value)
				if result != None: break
				
		elif valType == 'cat':
			# Handle concatenation
			content = ''
			for part in value.getContent():  # pyright: ignore[reportOptionalMemberAccess]
				val = self.evaluate(part) # pyright: ignore[reportAttributeAccessIssue]
				if val != None:
					if isinstance(val, ECValue): val = str(val.getContent())
					if val == None: val = ''
					else: content += str(val)
			result.setValue(type=str, content=content)
	
		else:
			result = self.textifyInDomain(value)

		return result

	# Get the runtime value of a value object (as a string or integer)
	def textify(self, value):
		self.ensureRunning()
		if value is None:
			return None
		
		if isinstance(value, dict):
			value = value['object']
		if isinstance(value, ECObject):
			value = value.textify() # type: ignore
		if isinstance(value, ECValue): # type: ignore
			v = self.evaluate(value) # type: ignore
		else:
			v = value
		if v is None: return None
		if isinstance(v, ECValue):
			if v.getType() == 'object':
				return value.getContent() # type: ignore
			return v.getContent() 
		elif isinstance(v, ECObject):
			return v.textify() # type: ignore
		if isinstance(v, (dict, list)): 
			return json.dumps(v)
		return v

	# Get the content of a symbol
	def getSymbolContent(self, record):
		if len(record['value']) == 0:
			return None
		try: return record['value'][record['index']]
		except: raise RuntimeError(self, f'Cannot get content of symbol "{record["name"]}"')

	# Get the value of a symbol as an ECValue
	def getSymbolValue(self, record):
		self.ensureRunning()
		object = self.getObject(record)
		self.checkObjectType(object, ECObject)
		value = object.getValue() # type: ignore
		if value is None:
			raise NoValueRuntimeError(self, f'Symbol "{record["name"]}" has no value')
		copy = ECValue(domain=value.getDomain(),type=value.getType(),content=deepcopy(value.getContent()))
		return copy

	# Set the value of a symbol to either an ECValue or a raw value
	def putSymbolValue(self, record, value):
		variable = self.getObject(record)
		name = record['name']
		if variable.isLocked(): # type: ignore
			raise RuntimeError(self, f'Symbol "{name}" is locked')
		result = variable.setValue(self.getValueOf(value)) # type: ignore
		if result != None:
			raise RuntimeError(self, f'Failed to set value for symbol "{name}": ') # type: ignore

	def encode(self, value):
		return value

	def decode(self, value):
		return value

	# Tokenise the script
	def tokenise(self, script):
		token = ''
		literal = False
		literal_open_lino = -1
		for lino in range(0, len(script.lines)):
			line = script.lines[lino]
			length = len(line)
			if length == 0:
				if literal:
					token += '\n'
				continue
			if literal:
				# Continuing a multi-line literal: every char including leading
				# whitespace is part of the content. Append the newline crossed,
				# then parse from column 0.
				token += '\n'
				start = 0
			else:
				# Look for the first non-space
				n = 0
				while n < length and line[n].isspace():
					n += 1
				# The whole line may be blank
				if n == length:
					continue
				start = n
			for n in range(start, length):
				c = line[n]
				# Test if we are in a literal
				if not literal:
					if c.isspace():
						if len(token) > 0:
							script.tokens.append(Token(lino, token))
							token = ''
						continue
					elif c == '!':
						break
				# Test for the start or end of a literal
				if c == '`':
					if literal:
						token += c
						literal = False
					else:
						token += c
						literal = True
						literal_open_lino = lino
						continue
				else:
					token += c
			if len(token) > 0 and not literal:
				script.tokens.append(Token(lino, token))
				token = ''
		if literal:
			print(f'Compile error in {self.name} at line {literal_open_lino + 1}:\n-> Unclosed `…` literal — the opening backtick is here but no closing backtick was found before end of file. If the string spans multiple lines, that is now allowed; check that you typed the trailing backtick.')
			sys.exit()
		return

	def releaseParent(self):
		if self.parent and self.parent.waiting and self.parent.program.running:  # type: ignore[union-attr]
			self.parent.waiting = False  # type: ignore[union-attr]
			self.parent.program.run(self.parent.pc)  # type: ignore[union-attr]

	# Flush the queue
	def flush(self, pc):
		global queue
		self.pc = pc
		while self.running:
			command = self.code[self.pc]
			
			# Check if debugger wants to halt before executing this command
			if self.debugger != None:
				# pc==1 is the first real command (pc==0 is the debug loader)
				is_first = (self.pc == 1)
				if self.debugger.checkIfHalt(is_first):
					# Debugger says halt - break out and wait for user
					break
			
			domainName = command['domain']
			if domainName == None:
				self.pc += 1
			else:
				keyword = command['keyword']
				if self.debugStep and not self.debugSkip and 'debug' in command:
					lino = command['lino'] + 1
					line = self.script.lines[command['lino']].strip()
					print(f'{self.name}: Line {lino}: {domainName}:{keyword}:  {line}')
				domain = self.domainIndex[domainName]
				handler = domain.runHandler(keyword)
				if handler:
					command = self.code[self.pc]
					command['program'] = self
					try:
						if self.breakpoint:
							pass	# Place a breakpoint here for a debugger to catch
						self.pc = handler(command)
						# A runtime error was routed to an onError handler (e.g. a
						# test block's error handler): stop this statement sequence
						# now so the handler runs before any further statements of
						# the failing block.
						if getattr(self, 'errorRouted', False):
							self.errorRouted = False
							break
					except RuntimeError:
						# A runtime error that was re-raised after routing (e.g.
						# NoValueRuntimeError): the constructor already queued the
						# onError handler, so just stop the sequence and let the
						# queue drain. Any other RuntimeError propagates.
						if getattr(self, 'errorRouted', False):
							self.errorRouted = False
							break
						raise
					except Exception as e:
						tb = traceback.format_exc()
						if getattr(self, 'errorRouted', False):
							# The handler already routed the original error (queueing
							# the onError handler); this secondary exception is fallout
							# from that. Keep the original message and stop here.
							self.errorRouted = False
							break
						# The constructor routes to onError (queueing the handler) or
						# sys.exit()s when no handler is set. If it routed, stop this
						# statement sequence so the handler runs before any further
						# statements of the failing block.
						RuntimeError(self, f'Error during execution of {domainName}:{keyword}: {str(e)}\n\nTraceback:\n{tb}')
						if getattr(self, 'errorRouted', False):
							self.errorRouted = False
							break
						raise
					# Deal with 'exit'
					if self.pc == -1:
						queue = deque()
						if self.parent == None:
							if self.testMode:
								# In test mode a normal exit triggers the summary and
								# ends the run cleanly (no sys.exit) so the caller can
								# still read the results off the program object.
								if not self.summaryPrinted:
									self.printTestSummary()
							else:
								print('Program exiting')
								sys.exit()
						else:
							self.releaseParent()
						self.running = False
						break
					elif self.pc == None or self.pc == 0 or self.pc >= len(self.code):
						# Natural end of program (or 'stop'), or a handler returned
						# None after routing an error to onError — in the latter case
						# the queue still holds the recovery handler, so keep running
						# and let the module-level flush() drain it.
						if len(queue) == 0:
							# In test mode a natural end also triggers the summary.
							# running is cleared so start() terminates instead of
							# spinning forever (scripts without an explicit exit).
							if self.testMode and not self.summaryPrinted:
								self.printTestSummary()
							self.running = False
						break

	# Run the script at a given PC value
	def run(self, pc):
		global queue
		item = ECValue()
		item.program = self # type: ignore
		item.pc = pc # type: ignore
		queue.append(item)
		self.running = True

	def kill(self):
		self.running = False
		if self.parent != None: self.parent.program.kill()

	def nonNumericValueError(self):
		FatalError(self.compiler, 'Non-numeric value')

	def compare(self, value1, value2):
		if value1 == None or value2 == None:
			RuntimeError(self, 'Cannot compare a value with None')
		v1 = self.textify(value1)
		v2 = self.textify(value2)
		if v1 == None or v2 == None:
			raise RuntimeError(self, 'Both items must have a value for comparison')
		if type(v1) == str and type(v2) == str:
			# String comparison
			if v1 < v2: return -1
			if v1 > v2: return 1
			return 0
		
		if type(v1) is str:
			try:
				v1 = int(v1)
			except:
				# print(f'{v1} is not an integer')
				return None
		if type(v2) is str:
			try:
				v2 = int(v2)
			except:
				# print(f'{v2} is not an integer')
				return None
		if v1 < v2:  # type: ignore[operator]
			return -1
		if v1 > v2:  # type: ignore[operator]
			return 1
		return 0

	# Set up a message handler
	def onMessage(self, pc):
		self.onMessagePC = pc

	# Handle a message
	def handleMessage(self, sender, message):
		self.sender = sender
		self.message = message
		if self.onMessagePC:
			self.run(self.onMessagePC)

# List all .as files in the current directory
def listScripts():
	files = sorted(globmod.glob('*.as'))
	if files:
		print('AllSpeak scripts in current directory:')
		for f in files:
			print(f'  {f}')
	else:
		print('No .as files found in current directory.')

# Extract and display the info text from a script file
def showScriptInfo(name):
	if not name.endswith('.as'):
		name += '.as'
	if not os.path.exists(name):
		print(f"Script '{name}' not found.")
		return
	with open(name, 'r', encoding='utf-8') as f:
		source = f.read()
	# Tokenise the script and look for an 'info' token
	script = Script(source)
	token = ''
	literal = False
	for lino in range(len(script.lines)):
		line = script.lines[lino]
		length = len(line)
		if length == 0:
			if literal:
				token += '\n'
			continue
		n = 0
		while n < length and line[n].isspace():
			n += 1
		if n == length:
			if literal:
				token += '\n'
			continue
		if literal:
			if line[n] != '`':
				if len(token) > 0:
					script.tokens.append(Token(lino, token))
					token = ''
					literal = False
			n += 1
		for n in range(n, length):
			c = line[n]
			if not literal:
				if c.isspace():
					if len(token) > 0:
						script.tokens.append(Token(lino, token))
						token = ''
					continue
				elif c == '!':
					break
			if c == '`':
				if literal:
					token += c
					literal = False
				else:
					token += c
					literal = True
					continue
			else:
				token += c
		if len(token) > 0 and not literal:
			script.tokens.append(Token(lino, token))
			token = ''
	# Find the 'info' token and grab the next token as its text
	for i, tok in enumerate(script.tokens):
		if tok.token == 'info' and i + 1 < len(script.tokens):
			text = script.tokens[i + 1].token
			# Strip surrounding backticks if present
			if text.startswith('`') and text.endswith('`'):
				text = text[1:-1]
			# If it's valid JSON, pretty-print it
			try:
				parsed = json.loads(text)
				print(json.dumps(parsed, indent=2, ensure_ascii=False))
			except (json.JSONDecodeError, ValueError):
				print(text)
			return
	print(f"No 'info' command found in '{name}'.")

# This is the program launcher
def Main():
	args = sys.argv[1:]
	if len(args) > 0 and args[0] == '--test':
		sys.exit(runTestSuite(args[1:]))
	if len(args) > 0:
		if args[0] == 'info':
			if len(args) > 1:
				showScriptInfo(args[1])
			else:
				listScripts()
		else:
			Program(' '.join(args)).start()
	else:
		Program('-v')

# Run one .as file in test mode and return its exit code. A SystemExit here
# means the script could not be compiled or run (exit code 2), as distinct
# from tests that merely failed (exit code 1).
def runOneTestFile(path):
	try:
		program = Program(path, testMode=True)
		program.start()
		return program.testExitCode, program
	except SystemExit as e:
		code = e.code
		return (code if isinstance(code, int) else 2), None

# The '--test' runner: run a file or every .as file in a directory as its own
# suite, print the per-suite summaries plus an overall line for directories,
# and return the process exit code (0 = all passed, 1 = failures, 2 = broke).
def runTestSuite(argv):
	if len(argv) == 0:
		print('Usage: allspeak --test <file.as | directory>')
		return 2
	target = argv[0]
	if os.path.isdir(target):
		files = sorted(globmod.glob(os.path.join(target, '*.as')))
	else:
		files = [target]
	if len(files) == 0:
		print(f'No .as files found in {target}')
		return 2
	worst = 0
	totalTests = totalPassedTests = totalFailedTests = 0
	totalChecks = totalPassed = totalFailed = 0
	for f in files:
		code, program = runOneTestFile(f)
		worst = max(worst, code)
		if program != None:
			suite = program.testSuite
			for t in suite['tests']:
				totalTests += 1
				totalChecks += t['checks']
				totalPassed += t['passed']
				totalFailed += t['failed']
				if t['failed'] > 0 or t['errored']:
					totalFailedTests += 1
				else:
					totalPassedTests += 1
			totalChecks += suite['default']['checks']
			totalPassed += suite['default']['passed']
			totalFailed += suite['default']['failed']
	if len(files) > 1:
		print(f'\nOverall: {len(files)} files \u2014 {totalTests} tests, {totalPassedTests} passed, '
			f'{totalFailedTests} failed \u2014 {totalChecks} checks, {totalPassed} passed, {totalFailed} failed')
	return worst

if __name__ == '__main__':
    Main()

