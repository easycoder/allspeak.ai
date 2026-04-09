// AllSpeak Opcode Resolver
// Maps compiled command objects (domain + keyword + sub-type) to canonical opcodes.
// Called by Compile.js addCommand() to stamp every command with a language-neutral opcode.

// eslint-disable-next-line no-unused-vars
const AllSpeak_Opcodes = {

	resolve: function(command) {
		const domain = command.domain;
		const keyword = command.keyword;

		switch (domain) {

		case `core`:
			return this.resolveCore(command);

		case `browser`:
			return this.resolveBrowser(command);

		case `json`:
			return this.resolveJson(command);

		case `rest`:
			return this.resolveRest(command);

		case `mqtt`:
			return this.resolveMqtt(command);

		default:
			return null;
		}
	},

	resolveCore: function(command) {
		const keyword = command.keyword;

		switch (keyword) {

		// Arithmetic
		case `add`:       return `ADD`;
		case `take`:      return `SUBTRACT`;
		case `subtract`:  return `SUBTRACT`;
		case `multiply`:  return `MULTIPLY`;
		case `divide`:    return `DIVIDE`;
		case `negate`:    return `NEGATE`;

		// Assignment
		case `put`:       return `PUT`;

		// Collections
		case `append`:    return `APPEND`;
		case `push`:      return `PUSH`;
		case `pop`:       return `POP`;
		case `clear`:     return `CLEAR`;
		case `replace`:   return `REPLACE`;
		case `sort`:      return `SORT`;
		case `split`:     return `SPLIT`;
		case `filter`:    return `FILTER`;
		case `index`:     return `INDEX`;

		// Control flow
		case `if`:        return `IF`;
		case `while`:     return `WHILE`;
		case `goto`:      return `GOTO`;
		case `go`:        return `GOTO`;
		case `gosub`:     return `GOSUB`;
		case `return`:    return `RETURN`;
		case `fork`:      return `FORK`;
		case `exit`:      return `EXIT`;
		case `stop`:      return `STOP`;
		case `wait`:      return `WAIT`;
		case `every`:     return `EVERY`;
		case `try`:       return `TRY`;
		case `endTry`:    return `END_TRY`;
		case `continue`:  return `CONTINUE`;
		case `toggle`:    return `TOGGLE`;

		// Declarations
		case `variable`:  return `DECLARE_VARIABLE`;
		case `module`:    return `DECLARE_MODULE`;
		case `symbol`:    return `DECLARE_SYMBOL`;
		case `callback`:  return `DECLARE_CALLBACK`;
		case `alias`:     return `DECLARE_ALIAS`;

		// Text
		case `encode`:    return `ENCODE`;
		case `decode`:    return `DECODE`;
		case `sanitize`:  return `SANITIZE`;

		// Modules
		case `run`:       return `RUN_MODULE`;
		case `require`:   return `REQUIRE`;
		case `import`:    return `IMPORT`;
		case `close`:     return `CLOSE_MODULE`;
		case `dummy`:     return `DUMMY`;

		// I/O — print/log
		case `print`:
			return command.log ? `LOG` : `PRINT`;

		// I/O — send
		case `send`:      return `SEND_MESSAGE`;

		// I/O — on (event handlers)
		case `on`:
			switch (command.action) {
			case `close`:   return `ON_CLOSE`;
			case `message`: return `ON_MESSAGE`;
			case `error`:   return `ON_ERROR`;
			default:        return `ON_CALLBACK`;
			}

		// Debug
		case `debug`:
			switch (command.item) {
			case `program`:  return `DEBUG_PROGRAM`;
			case `symbols`:  return `DEBUG_SYMBOLS`;
			case `symbol`:   return `DEBUG_SYMBOL`;
			case `step`:     return `DEBUG_STEP`;
			case `stop`:     return `DEBUG_STOP`;
			default:         return `DEBUG_PROGRAM`;
			}

		// Set (sub-typed via request field)
		case `set`:
			switch (command.request) {
			case `setVarTo`:    return `SET_VAR_TYPE`;
			case `setArray`:    return `SET_ARRAY`;
			case `setBoolean`:  return `SET_BOOLEAN`;
			case `setReady`:    return `SET_READY`;
			case `setElement`:  return `SET_ELEMENT_VALUE`;
			case `setProperty`: return `SET_PROPERTY`;
			case `setArg`:      return `SET_ARG`;
			case `setElements`: return `SET_ELEMENTS`;
			case `encoding`:    return `SET_ENCODING`;
			case `setPayload`:  return `SET_PAYLOAD`;
			default:            return `SET_BOOLEAN`;
			}

		// Structural / compile-time
		case `no`:        return `NO_CACHE`;
		case `test`:      return `TEST`;
		case `script`:    return `SCRIPT`;
		case `begin`:     return `BEGIN`;
		case `end`:       return `END`;

		default:
			return null;
		}
	},

	resolveBrowser: function(command) {
		const keyword = command.keyword;

		// Element type declarations — check via language pack keyword index
		const opcodes = AllSpeak_Language.getOpcodesForKeyword(keyword);
		if (opcodes.indexOf(`DECLARE_ELEMENT`) >= 0) {
			return `DECLARE_ELEMENT`;
		}

		switch (keyword) {

		// DOM manipulation
		case `create`:    return `CREATE_ELEMENT`;
		case `attach`:    return `ATTACH_ELEMENT`;
		case `click`:     return `CLICK_ELEMENT`;
		case `focus`:     return `FOCUS_ELEMENT`;
		case `disable`:   return `DISABLE_ELEMENT`;
		case `enable`:    return `ENABLE_ELEMENT`;
		case `highlight`: return `HIGHLIGHT_ELEMENT`;

		// Content
		case `alert`:     return `ALERT`;
		case `render`:    return `RENDER`;
		case `convert`:   return `CONVERT`;

		// Navigation
		case `location`:  return `NAVIGATE`;
		case `request`:   return `FULLSCREEN`;
		case `scroll`:    return `SCROLL`;
		case `mail`:      return `MAIL`;
		case `copy`:      return `COPY_TO_CLIPBOARD`;

		// Media
		case `play`:      return `PLAY_AUDIO`;
		case `upload`:    return `UPLOAD_FILE`;

		// Storage
		case `put`:       return `PUT_STORAGE`;

		// Debug
		case `trace`:
			return command.variant === `setup` ? `TRACE_SETUP` : `TRACE_RUN`;

		// Clear
		case `clear`:     return `CLEAR_ELEMENT`;

		// Remove (sub-typed)
		case `remove`:
			switch (command.type) {
			case `removeElement`:   return `REMOVE_ELEMENT`;
			case `removeAttribute`: return `REMOVE_ATTRIBUTE`;
			case `removeStorage`:   return `REMOVE_STORAGE`;
			default:                return `REMOVE_ELEMENT`;
			}

		// Get (sub-typed)
		case `get`:
			switch (command.action) {
			case `getStorage`:  return `GET_STORAGE`;
			case `listStorage`: return `LIST_STORAGE`;
			case `getForm`:     return `GET_FORM`;
			case `getOption`:   return `GET_OPTION`;
			default:            return `GET_STORAGE`;
			}

		// History (sub-typed)
		case `history`:
			switch (command.type) {
			case `push`:    return `HISTORY_PUSH`;
			case `set`:     return `HISTORY_SET`;
			case `replace`: return `HISTORY_REPLACE`;
			case `back`:    return `HISTORY_BACK`;
			case `forward`: return `HISTORY_FORWARD`;
			default:        return `HISTORY_PUSH`;
			}

		// On (event handlers, sub-typed)
		case `on`:
			switch (command.action) {
			case `change`:       return `ON_CHANGE`;
			case `click`:        return `ON_CLICK`;
			case `clickDocument`: return `ON_CLICK_DOCUMENT`;
			case `key`:          return `ON_KEY`;
			case `leave`:        return `ON_LEAVE`;
			case `windowResize`: return `ON_WINDOW_RESIZE`;
			case `browserBack`:  return `ON_BROWSER_BACK`;
			case `swipe`:        return `ON_SWIPE`;
			case `pick`:         return `ON_PICK`;
			case `resume`:       return `ON_RESUME`;
			case `drag`:         return `ON_DRAG`;
			case `drop`:         return `ON_DROP`;
			default:             return `ON_CLICK`;
			}

		// Set (sub-typed via type field)
		case `set`:
			switch (command.type) {
			case `setContent`:    return `SET_CONTENT`;
			case `setContentVar`: return `SET_CONTENT_VAR`;
			case `setText`:       return `SET_TEXT`;
			case `setTitle`:      return `SET_TITLE`;
			case `setSelect`:     return `SET_SELECT`;
			case `setStyle`:      return `SET_STYLE`;
			case `setStyles`:     return `SET_STYLES`;
			case `setBodyStyle`:  return `SET_BODY_STYLE`;
			case `setHeadStyle`:  return `SET_HEAD_STYLE`;
			case `setClass`:      return `SET_CLASS`;
			case `setId`:         return `SET_ID`;
			case `setSize`:       return `SET_SIZE`;
			case `setAttribute`:  return `SET_ATTRIBUTE`;
			case `setAttributes`: return `SET_ATTRIBUTES`;
			case `setDefault`:    return `SET_DEFAULT`;
			case `setTracerRows`: return `SET_TRACER_ROWS`;
			default:              return `SET_CONTENT`;
			}

		default:
			return null;
		}
	},

	resolveJson: function(command) {
		switch (command.request) {
		case `setVariable`: return `JSON_SET_VAR`;
		case `setList`:     return `JSON_SET_LIST`;
		case `parse`:       return `JSON_PARSE`;
		case `format`:      return `JSON_FORMAT`;
		case `sort`:        return `JSON_SORT`;
		case `shuffle`:     return `JSON_SHUFFLE`;
		case `delete`:      return `JSON_DELETE`;
		case `rename`:      return `JSON_RENAME`;
		case `add`:         return `JSON_ADD`;
		case `split`:       return `JSON_SPLIT`;
		case `replace`:     return `JSON_REPLACE`;
		default:            return null;
		}
	},

	resolveRest: function(command) {
		switch (command.request) {
		case `get`:  return `REST_GET`;
		case `post`: return `REST_POST`;
		case `path`: return `REST_PATH`;
		default:     return null;
		}
	},

	resolveMqtt: function(command) {
		const keyword = command.keyword;
		switch (keyword) {
		case `init`:  return `MQTT_INIT`;
		case `mqtt`:  return `MQTT_INIT`;
		case `topic`: return `MQTT_SUBSCRIBE`;
		case `send`:  return `MQTT_SEND`;
		case `on`:
			switch (command.action) {
			case `connect`: return `MQTT_ON_CONNECT`;
			case `message`: return `MQTT_ON_MESSAGE`;
			default:        return `MQTT_ON_MESSAGE`;
			}
		default:
			return null;
		}
	}
};
