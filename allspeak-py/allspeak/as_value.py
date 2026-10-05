from typing import Optional, List
from .as_language import language
from .as_classes import ECObject, FatalError, ECValue

# Create a constant
def getConstant(str):
	return ECValue(type=str, content=str)

class Value:

	def __init__(self, compiler):
		self.compiler = compiler
		self.getToken = compiler.getToken
		self.nextToken = compiler.nextToken
		self.peek = compiler.peek
		self.skip = compiler.skip
		self.tokenIs = compiler.tokenIs

	def getItem(self) -> Optional[ECValue]:
		token = self.getToken()
		if not token:
			return None

		value = ECValue()

		if token.lower() == 'true':
			value.setValue(bool, True)
			return value

		if token.lower() == 'false':
			value.setValue(bool, False)
			return value

		# Check for a string constant
		if token[0] == '`':
			if token[len(token) - 1] == '`':
				value.setValue(type=str, content=token[1 : len(token) - 1])
				return value
			FatalError(self.compiler, f'Unterminated string "{token}"')
			return None

		# Check for a numeric constant
		if token.isnumeric() or (token[0] == '-' and token[1:].isnumeric):
			val = eval(token)
			if isinstance(val, int):
				value.setValue(int, val)
				return value
			FatalError(self.compiler, f'{token} is not an integer')

		# See if any of the domains can handle it
		mark = self.compiler.getIndex()
		for domain in self.compiler.program.getDomains():
			item = domain.compileValue()
			if item != None: return item
			self.compiler.rewindTo(mark)
		# self.compiler.warning(f'I don\'t understand \'{token}\'')
		return None

	# Get a list of items following 'the cat of ...'
	def getCatItems(self) -> Optional[List[ECValue]]:
		items: List[ECValue] = []
		item = self.getItem()
		if item == None: return None
		items.append(item)
		while self.peek() in ['cat', 'and']:
			self.nextToken()
			self.nextToken()
			element = self.getItem()
			if element != None:
				items.append(element) # pyright: ignore[reportOptionalMemberAccess]
		return items

	# Check if any domain has something to add to the value
	def checkDomainAdditions(self, value):
		for domain in self.compiler.program.getDomains():
			value = domain.modifyValue(value)
		return value
	
	# Compile a value
	def compileValue(self) -> Optional[ECValue]:
		token = self.getToken()
		# Special-case the plugin-safe full form: "the cat of ..."
		if token == 'the' and language.reverse_word(self.peek()) == 'cat':
			self.nextToken()  # move to 'cat'
			self.skip('of')
			self.nextToken()
			items = self.getCatItems()
			value = ECValue(type='cat', content=items)
			return self.checkDomainAdditions(value)

		# **Otherwise, consume any leading articles before normal parsing — and they are *at* the cursor, not
		# ahead of it.** `getToken()` does not advance, while `skipArticles()` only looks *past* the cursor, so
		# the article was never skipped: `log the json count of T` took `the` for the value and refused to
		# compile, and with it every `journalise la valeur de N` in French, `registra il conteggio di T` in
		# Italian and `logge der Wert von N` in German — because an article is how a value phrase *starts* in
		# all four packs. The JavaScript runtime accepts them, having one value compiler rather than two.
		# Measured 2026-10-05. The special case above still comes first: it is the article case with `cat`,
		# which the general path cannot express.
		while language.matches_word(self.getToken(), 'the') or language.matches_word(self.getToken(), 'an'):
			self.nextToken()
		token = self.getToken()

		item: ECValue|None = self.getItem()
		if item == None:
			self.compiler.warning(f'as_value.compileValue: Cannot get the value of "{token}"')
			return None
		if item.getType() == 'symbol':
			object = self.compiler.getSymbolRecord(item.getName())['object']
			if not object.hasRuntimeValue(): return None
			item.setContent(object.name)

		if language.reverse_word(self.peek()) == 'cat':
			self.nextToken()  # consume 'cat'
			self.nextToken()
			items = self.getCatItems()
			if items != None: items.insert(0, item)
			value = ECValue(type='cat', content=items)
		else:
			value = item

		return self.checkDomainAdditions(value)

	def compileConstant(self, token):
		value = ECValue()
		if isinstance(token, str):
			value.setValue(type=int, content=token)
		elif isinstance(token, int):
			value.setValue(type=int, content=token)
		elif isinstance(token, float):
			value.setValue(type=float, content=token)
		else:
			value.setValue(type=str, content=str(token))
		return value
