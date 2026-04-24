'''AllSpeak for Python'''

import importlib
import math

__version__ = "260423.1"

from .as_classes import *
from .as_compiler import *
from .as_condition import *
from .as_core import *
from .as_email import *
from .as_handler import *
from .as_mqtt import *
from .as_program import *
from .as_server import *
from .as_psutil import *
from .as_timestamp import *
from .as_value import *

_LAZY_MODULES = (
	'as_border',
	'as_gclasses',
	'as_graphics',
	'as_keyboard',
)


def __getattr__(name):
	if name in _LAZY_MODULES:
		module = importlib.import_module(f'.{name}', __name__)
		globals()[name] = module
		return module

	for module_name in _LAZY_MODULES:
		module = importlib.import_module(f'.{module_name}', __name__)
		if hasattr(module, name):
			value = getattr(module, name)
			globals()[name] = value
			return value

	raise AttributeError(f'module {__name__!r} has no attribute {name!r}')
