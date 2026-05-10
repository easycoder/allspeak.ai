// Italian language pack for AllSpeak — JS is source of truth; sync-language-packs writes allspeak-py/allspeak/languages/it.json from this
// eslint-disable-next-line no-unused-vars
var AllSpeak_LanguagePack_it = {
  "meta": {
    "language": "it",
    "label": "Italiano",
    "version": "0.1.0",
    "description": "Italian language pack for AllSpeak — maps Italian surface syntax to canonical opcodes"
  },
  "opcodes": {
    "ADD": {
      "keyword": "aggiungi",
      "patterns": [
        "aggiungi {value} a {variable}",
        "aggiungi {value1} a {value2} dando {variable}"
      ]
    },
    "ALERT": {
      "keyword": "avviso",
      "patterns": [
        "avviso {value}"
      ]
    },
    "APPEND": {
      "keyword": "accoda",
      "patterns": [
        "accoda {value} a {variable}"
      ]
    },
    "ATTACH_ELEMENT": {
      "keyword": "collega",
      "patterns": [
        "collega {element} a corpo",
        "collega {element} a {cssId}"
      ]
    },
    "CLEAR": {
      "keyword": "svuota",
      "patterns": [
        "svuota {variable}"
      ]
    },
    "CLEAR_ELEMENT": {
      "keyword": "svuota",
      "patterns": [
        "svuota {element}",
        "svuota corpo",
        "svuota stili"
      ]
    },
    "CLICK_ELEMENT": {
      "keyword": "clicca",
      "patterns": [
        "clicca {element}"
      ]
    },
    "CLOSE_MODULE": {
      "keyword": "chiudi",
      "patterns": [
        "chiudi {module}"
      ]
    },
    "CONTINUE": {
      "keyword": "continua",
      "patterns": [
        "continua"
      ]
    },
    "CONVERT": {
      "keyword": "converti",
      "patterns": [
        "converti spazi in {variable} a stampa|html"
      ]
    },
    "COPY_TO_CLIPBOARD": {
      "keyword": "copia",
      "patterns": [
        "copia {element}"
      ]
    },
    "CREATE_ELEMENT": {
      "keyword": "crea",
      "patterns": [
        "crea {element} in corpo",
        "crea {element} in {parent}",
        "crea {audioclip} da {url}"
      ]
    },
    "DEBUG_PROGRAM": {
      "keyword": "debug",
      "patterns": [
        "debug programma"
      ]
    },
    "DEBUG_STEP": {
      "keyword": "debug",
      "patterns": [
        "debug passo"
      ]
    },
    "DEBUG_STOP": {
      "keyword": "debug",
      "patterns": [
        "debug ferma"
      ]
    },
    "DEBUG_SYMBOL": {
      "keyword": "debug",
      "patterns": [
        "debug simbolo {name}"
      ]
    },
    "DEBUG_SYMBOLS": {
      "keyword": "debug",
      "patterns": [
        "debug simboli"
      ]
    },
    "DECLARE_ALIAS": {
      "keyword": "alias",
      "patterns": [
        "alias {name} a {symbol}"
      ]
    },
    "DECLARE_CALLBACK": {
      "keyword": "callback",
      "patterns": [
        "callback {name}"
      ]
    },
    "DECLARE_ELEMENT": {
      "keyword": "div|span|button|bottone|input|textarea|select|option|a|p|pre|h1|h2|h3|h4|h5|h6|img|image|canvas|table|tr|td|th|ul|li|form|fieldset|legend|label|blockquote|hr|section|file|audioclip|progress",
      "patterns": [
        "{elementType} {name}"
      ],
      "elementTypes": {
        "a": "a",
        "blockquote": "blockquote",
        "bottone": "button",
        "button": "button",
        "canvas": "canvas",
        "div": "div",
        "fieldset": "fieldset",
        "file": "file",
        "form": "form",
        "h1": "h1",
        "h2": "h2",
        "h3": "h3",
        "h4": "h4",
        "h5": "h5",
        "h6": "h6",
        "hr": "hr",
        "image": "image",
        "img": "img",
        "input": "input",
        "label": "label",
        "legend": "legend",
        "li": "li",
        "option": "option",
        "p": "p",
        "pre": "pre",
        "progress": "progress",
        "section": "section",
        "select": "select",
        "span": "span",
        "table": "table",
        "td": "td",
        "textarea": "textarea",
        "th": "th",
        "tr": "tr",
        "ul": "ul",
        "audioclip": "audioclip"
      }
    },
    "DECLARE_MODULE": {
      "keyword": "modulo",
      "patterns": [
        "modulo {name}"
      ]
    },
    "DECLARE_SYMBOL": {
      "keyword": "simbolo",
      "patterns": [
        "simbolo {name}"
      ]
    },
    "DECLARE_VARIABLE": {
      "keyword": "variabile",
      "patterns": [
        "variabile {name}"
      ]
    },
    "DECODE": {
      "keyword": "decodifica",
      "patterns": [
        "decodifica {variable}"
      ]
    },
    "DECREMENT": {
      "keyword": "decrementa",
      "patterns": [
        "decrementa {variable}"
      ]
    },
    "DISABLE_ELEMENT": {
      "keyword": "disabilita",
      "patterns": [
        "disabilita {element}"
      ]
    },
    "DIVIDE": {
      "keyword": "dividi",
      "patterns": [
        "dividi {variable} per {value}",
        "dividi {value1} per {value2} dando {variable}"
      ]
    },
    "DUMMY": {
      "keyword": "nulla",
      "patterns": [
        "nulla"
      ]
    },
    "ENABLE_ELEMENT": {
      "keyword": "abilita",
      "patterns": [
        "abilita {element}"
      ]
    },
    "ENCODE": {
      "keyword": "codifica",
      "patterns": [
        "codifica {variable}"
      ]
    },
    "END_TRY": {
      "keyword": "fine",
      "patterns": [
        "fine prova"
      ]
    },
    "EVERY": {
      "keyword": "ogni",
      "patterns": [
        "ogni {value} minuto|minuti|secondo|secondi|tick|ticks"
      ]
    },
    "EXIT": {
      "keyword": "esci",
      "patterns": [
        "esci"
      ]
    },
    "FILTER": {
      "keyword": "filtra",
      "patterns": [
        "filtra {array} con {function}"
      ]
    },
    "FOCUS_ELEMENT": {
      "keyword": "focus",
      "patterns": [
        "focus {element}"
      ]
    },
    "FORK": {
      "keyword": "biforca",
      "patterns": [
        "biforca [a] {label}"
      ]
    },
    "FULLSCREEN": {
      "keyword": "richiedi",
      "patterns": [
        "richiedi schermointero",
        "richiedi schermointero esci"
      ]
    },
    "GET_FORM": {
      "keyword": "ottieni",
      "patterns": [
        "ottieni {variable} da {form}"
      ]
    },
    "GET_OPTION": {
      "keyword": "ottieni",
      "patterns": [
        "ottieni {variable} da {select}"
      ]
    },
    "GET_STORAGE": {
      "keyword": "ottieni",
      "patterns": [
        "ottieni {variable} da archivio come {key}"
      ]
    },
    "GOSUB": {
      "keyword": "vaisub",
      "patterns": [
        "vaisub [a] {label}"
      ]
    },
    "GOTO": {
      "keyword": "vai",
      "patterns": [
        "vai [a] {label}"
      ]
    },
    "HIGHLIGHT_ELEMENT": {
      "keyword": "evidenzia",
      "patterns": [
        "evidenzia {element}"
      ]
    },
    "HISTORY_BACK": {
      "keyword": "cronologia",
      "patterns": [
        "cronologia indietro"
      ]
    },
    "HISTORY_FORWARD": {
      "keyword": "cronologia",
      "patterns": [
        "cronologia avanti"
      ]
    },
    "HISTORY_PUSH": {
      "keyword": "cronologia",
      "patterns": [
        "cronologia aggiungi [url {url}] [stato {state}] [titolo {title}]"
      ]
    },
    "HISTORY_REPLACE": {
      "keyword": "cronologia",
      "patterns": [
        "cronologia sostituisci [url {url}] [stato {state}] [titolo {title}]"
      ]
    },
    "HISTORY_SET": {
      "keyword": "cronologia",
      "patterns": [
        "cronologia imposta [url {url}] [stato {state}] [titolo {title}]"
      ]
    },
    "IF": {
      "keyword": "se",
      "patterns": [
        "se {condition}"
      ]
    },
    "IMPORT": {
      "keyword": "importa",
      "patterns": [
        "importa {symbols}"
      ]
    },
    "INCREMENT": {
      "keyword": "incrementa",
      "patterns": [
        "incrementa {variable}"
      ]
    },
    "INDEX": {
      "keyword": "indice",
      "patterns": [
        "indice {variable} a {value}"
      ]
    },
    "JSON_ADD": {
      "keyword": "json",
      "patterns": [
        "json aggiungi {item} a {variable}"
      ]
    },
    "JSON_DELETE": {
      "keyword": "json",
      "patterns": [
        "json elimina proprieta|elemento {value} da|di {variable}"
      ]
    },
    "JSON_FORMAT": {
      "keyword": "json",
      "patterns": [
        "json formatta {variable}"
      ]
    },
    "JSON_PARSE": {
      "keyword": "json",
      "patterns": [
        "json analizza url {url} come {variable}"
      ]
    },
    "JSON_RENAME": {
      "keyword": "json",
      "patterns": [
        "json rinomina {oldName} a {newName} in {variable}"
      ]
    },
    "JSON_REPLACE": {
      "keyword": "json",
      "patterns": [
        "json sostituisci elemento {index} di {variable} con {value}"
      ]
    },
    "JSON_SET_LIST": {
      "keyword": "json",
      "patterns": [
        "json imposta {select} da {variable} [come {display}]"
      ]
    },
    "JSON_SET_VAR": {
      "keyword": "json",
      "patterns": [
        "json imposta {variable} a vettore|oggetto"
      ]
    },
    "JSON_SHUFFLE": {
      "keyword": "json",
      "patterns": [
        "json mescola {variable}"
      ]
    },
    "JSON_SORT": {
      "keyword": "json",
      "patterns": [
        "json ordina {variable}"
      ]
    },
    "JSON_SPLIT": {
      "keyword": "json",
      "patterns": [
        "json dividi {value} [su {delimiter}] dando|in {variable}"
      ]
    },
    "LIST_STORAGE": {
      "keyword": "ottieni",
      "patterns": [
        "ottieni {variable} da archivio"
      ]
    },
    "LOG": {
      "keyword": "registra",
      "patterns": [
        "registra {value}"
      ]
    },
    "MAIL": {
      "keyword": "email",
      "patterns": [
        "email a {email} [oggetto {subject}] [corpo|messaggio {body}]"
      ]
    },
    "MQTT_INIT": {
      "keyword": "mqtt",
      "patterns": [
        "mqtt inizializza {topic} nome {name} qos {qos}"
      ]
    },
    "MQTT_ON_CONNECT": {
      "keyword": "su",
      "patterns": [
        "su mqtt connessione"
      ]
    },
    "MQTT_ON_MESSAGE": {
      "keyword": "su",
      "patterns": [
        "su mqtt messaggio"
      ]
    },
    "MQTT_SEND": {
      "keyword": "invia",
      "patterns": [
        "invia mqtt {message} a {topic}"
      ]
    },
    "MQTT_SUBSCRIBE": {
      "keyword": "mqtt",
      "patterns": [
        "mqtt argomento {name}"
      ]
    },
    "MULTIPLY": {
      "keyword": "moltiplica",
      "patterns": [
        "moltiplica {variable} per {value}",
        "moltiplica {value1} per {value2} dando {variable}"
      ]
    },
    "NAVIGATE": {
      "keyword": "posizione",
      "patterns": [
        "posizione {url}",
        "posizione nuova {url}"
      ]
    },
    "NEGATE": {
      "keyword": "nega",
      "patterns": [
        "nega {variable}"
      ]
    },
    "ON_BROWSER_BACK": {
      "keyword": "su",
      "patterns": [
        "su browser indietro",
        "su ripristina"
      ]
    },
    "ON_CALLBACK": {
      "keyword": "su",
      "patterns": [
        "su {callback}"
      ]
    },
    "ON_CHANGE": {
      "keyword": "su",
      "patterns": [
        "su cambio {element}"
      ]
    },
    "ON_CLICK": {
      "keyword": "su",
      "patterns": [
        "su clic {element}"
      ]
    },
    "ON_CLICK_DOCUMENT": {
      "keyword": "su",
      "patterns": [
        "su clic documento"
      ]
    },
    "ON_CLOSE": {
      "keyword": "su",
      "patterns": [
        "su chiusura"
      ]
    },
    "ON_DRAG": {
      "keyword": "su",
      "patterns": [
        "su trascina"
      ]
    },
    "ON_DROP": {
      "keyword": "su",
      "patterns": [
        "su rilascia"
      ]
    },
    "ON_ERROR": {
      "keyword": "su",
      "patterns": [
        "su errore"
      ]
    },
    "ON_KEY": {
      "keyword": "su",
      "patterns": [
        "su tasto"
      ]
    },
    "ON_LEAVE": {
      "keyword": "su",
      "patterns": [
        "su lascia"
      ]
    },
    "ON_MESSAGE": {
      "keyword": "su",
      "patterns": [
        "su messaggio"
      ]
    },
    "ON_PICK": {
      "keyword": "su",
      "patterns": [
        "su scegli {element}"
      ]
    },
    "ON_RESUME": {
      "keyword": "su",
      "patterns": [
        "su riprendi"
      ]
    },
    "ON_SWIPE": {
      "keyword": "su",
      "patterns": [
        "su scorri sinistra|destra"
      ]
    },
    "ON_WINDOW_RESIZE": {
      "keyword": "su",
      "patterns": [
        "su finestra ridimensiona"
      ]
    },
    "PLAY_AUDIO": {
      "keyword": "riproduci",
      "patterns": [
        "riproduci {audioclip}"
      ]
    },
    "POP": {
      "keyword": "estrai",
      "patterns": [
        "estrai [in] {variable}"
      ]
    },
    "PRINT": {
      "keyword": "stampa",
      "patterns": [
        "stampa {value}"
      ]
    },
    "PUSH": {
      "keyword": "inserisci",
      "patterns": [
        "inserisci {value}"
      ]
    },
    "PUT": {
      "keyword": "metti",
      "patterns": [
        "metti {value} in {variable}"
      ]
    },
    "PUT_STORAGE": {
      "keyword": "metti",
      "patterns": [
        "metti {value} in archivio come {key}"
      ]
    },
    "REMOVE_ATTRIBUTE": {
      "keyword": "rimuovi",
      "patterns": [
        "rimuovi attributo {name} di {element}"
      ]
    },
    "REMOVE_ELEMENT": {
      "keyword": "rimuovi",
      "patterns": [
        "rimuovi elemento {element}"
      ]
    },
    "REMOVE_STORAGE": {
      "keyword": "rimuovi",
      "patterns": [
        "rimuovi {key} da archivio"
      ]
    },
    "RENDER": {
      "keyword": "renderizza",
      "patterns": [
        "renderizza {script} in {parent}"
      ]
    },
    "REPLACE": {
      "keyword": "sostituisci",
      "patterns": [
        "sostituisci {original} con {replacement} in {variable}"
      ]
    },
    "REQUIRE": {
      "keyword": "richiedi",
      "patterns": [
        "richiedi css|js {url}"
      ]
    },
    "REST_GET": {
      "keyword": "ottieni",
      "patterns": [
        "rest ottieni {variable} da {url}"
      ]
    },
    "REST_PATH": {
      "keyword": "rest",
      "patterns": [
        "rest percorso {path}"
      ]
    },
    "REST_POST": {
      "keyword": "invia",
      "patterns": [
        "rest invia [a] {url} dando {variable}",
        "rest invia {value} a {url} dando {variable}"
      ]
    },
    "RETURN": {
      "keyword": "ritorna",
      "patterns": [
        "ritorna"
      ]
    },
    "RUN_MODULE": {
      "keyword": "esegui",
      "patterns": [
        "esegui {script}",
        "esegui {script} con {imports}",
        "esegui {script} come {module}",
        "esegui {script} senzattesa",
        "esegui {script} con {imports} poi {handler}"
      ]
    },
    "SANITIZE": {
      "keyword": "sanifica",
      "patterns": [
        "sanifica {variable}"
      ]
    },
    "SCROLL": {
      "keyword": "scorri",
      "patterns": [
        "scorri a {value}",
        "scorri {element} a {value}"
      ]
    },
    "SEND_MESSAGE": {
      "keyword": "invia",
      "patterns": [
        "invia {message} a {recipient}",
        "invia {message} a genitore",
        "invia {message} a mittente",
        "invia a {recipient}"
      ]
    },
    "SET_ARG": {
      "keyword": "imposta",
      "patterns": [
        "imposta arg {name} di {variable} a {value}"
      ]
    },
    "SET_ARRAY": {
      "keyword": "imposta",
      "patterns": [
        "imposta {variable} a {value} {value} ..."
      ]
    },
    "SET_ATTRIBUTE": {
      "keyword": "imposta",
      "patterns": [
        "imposta attributo {name} di {element} a {value}",
        "imposta attributo {name} di {element}"
      ]
    },
    "SET_ATTRIBUTES": {
      "keyword": "imposta",
      "patterns": [
        "imposta [gli] attributi di {element} a {value}"
      ]
    },
    "SET_BODY_STYLE": {
      "keyword": "imposta",
      "patterns": [
        "imposta {styleName} di corpo a {value}"
      ]
    },
    "SET_BOOLEAN": {
      "keyword": "imposta",
      "patterns": [
        "imposta {variable}"
      ]
    },
    "SET_CLASS": {
      "keyword": "imposta",
      "patterns": [
        "imposta [la] classe di {element} a {value}"
      ]
    },
    "SET_CONTENT": {
      "keyword": "imposta",
      "patterns": [
        "imposta [il] contenuto di {element} a {value}"
      ]
    },
    "SET_CONTENT_VAR": {
      "keyword": "imposta",
      "patterns": [
        "imposta [il] contenuto di {element} da {source}",
        "imposta {element} da {source}"
      ]
    },
    "SET_DEFAULT": {
      "keyword": "imposta",
      "patterns": [
        "imposta [il] predefinito di {element} a {value}"
      ]
    },
    "SET_ELEMENT_VALUE": {
      "keyword": "imposta",
      "patterns": [
        "imposta elemento {index} di {variable} a {value}"
      ]
    },
    "SET_ELEMENTS": {
      "keyword": "imposta",
      "patterns": [
        "imposta [gli] elementi di {variable} a {value}"
      ]
    },
    "SET_ENCODING": {
      "keyword": "imposta",
      "patterns": [
        "imposta codifica a {value}"
      ]
    },
    "SET_HEAD_STYLE": {
      "keyword": "imposta",
      "patterns": [
        "imposta {styleName} a {value}"
      ]
    },
    "SET_ID": {
      "keyword": "imposta",
      "patterns": [
        "imposta [l] id di {element} a {value}"
      ]
    },
    "SET_PAYLOAD": {
      "keyword": "imposta",
      "patterns": [
        "imposta payload di {callback} a {value}"
      ]
    },
    "SET_PROPERTY": {
      "keyword": "imposta",
      "patterns": [
        "imposta proprieta {name} di {variable} a {value}"
      ]
    },
    "SET_READY": {
      "keyword": "imposta",
      "patterns": [
        "imposta pronto"
      ]
    },
    "SET_SELECT": {
      "keyword": "imposta",
      "patterns": [
        "imposta {select} da {variable} [come {display}]"
      ]
    },
    "SET_SIZE": {
      "keyword": "imposta",
      "patterns": [
        "imposta [la] dimensione di {element} a {value}"
      ]
    },
    "SET_STYLE": {
      "keyword": "imposta",
      "patterns": [
        "imposta [lo] stile di {element} a {value}",
        "imposta {styleName} di {element} a {value}"
      ]
    },
    "SET_STYLES": {
      "keyword": "imposta",
      "patterns": [
        "imposta [gli] stili di {element} a {value}"
      ]
    },
    "SET_TEXT": {
      "keyword": "imposta",
      "patterns": [
        "imposta [il] testo di {element} a {value}"
      ]
    },
    "SET_TITLE": {
      "keyword": "imposta",
      "patterns": [
        "imposta [il] titolo a {value}"
      ]
    },
    "SET_TRACER_ROWS": {
      "keyword": "imposta",
      "patterns": [
        "imposta [le] righe traccia a {value}"
      ]
    },
    "SET_VAR_TYPE": {
      "keyword": "imposta",
      "patterns": [
        "imposta {variable} a vettore",
        "imposta {variable} a oggetto"
      ]
    },
    "SORT": {
      "keyword": "ordina",
      "patterns": [
        "ordina {array} con {function}"
      ]
    },
    "SPLIT": {
      "keyword": "dividi",
      "patterns": [
        "dividi {value} su|per {separator} dando|in {variable}"
      ]
    },
    "STOP": {
      "keyword": "ferma",
      "patterns": [
        "ferma",
        "ferma {module}"
      ]
    },
    "SUBTRACT": {
      "keyword": "togli|sottrai",
      "patterns": [
        "togli {value} da {variable}",
        "togli {value1} da {value2} dando {variable}"
      ]
    },
    "TOGGLE": {
      "keyword": "inverti",
      "patterns": [
        "inverti {variable}"
      ]
    },
    "TRACE_RUN": {
      "keyword": "traccia",
      "patterns": [
        "traccia"
      ]
    },
    "TRACE_SETUP": {
      "keyword": "traccia",
      "patterns": [
        "traccia {variables} [orizzontale|verticale]"
      ]
    },
    "TRY": {
      "keyword": "prova",
      "patterns": [
        "prova"
      ]
    },
    "UPLOAD_FILE": {
      "keyword": "carica",
      "patterns": [
        "carica {file} a {path} con {progress} e {status}"
      ]
    },
    "WAIT": {
      "keyword": "attendi",
      "patterns": [
        "attendi {value} minuto|minuti|secondo|secondi|tick|ticks"
      ]
    },
    "WHILE": {
      "keyword": "mentre",
      "patterns": [
        "mentre {condition}"
      ]
    }
  },
  "words": {
    "and": "e",
    "as": "come",
    "assign": "assegna",
    "attribute": "attributo",
    "back": "indietro",
    "body": "corpo",
    "by": "per",
    "cache": "cache",
    "confirm": "conferma",
    "delimited": "delimitato",
    "document": "documento",
    "element": "elemento",
    "else": "altrimenti",
    "end": "fine",
    "exists": "esiste",
    "focus": "focus",
    "from": "da",
    "giving": "dando",
    "handle": "gestisci",
    "horizontal": "orizzontale",
    "in": "in",
    "into": "in",
    "is": "è|e",
    "json": "json",
    "keys": "chiavi",
    "last": "ultimo",
    "message": "messaggio",
    "name": "nome",
    "new": "nuova",
    "nocase": "nocase",
    "not": "non",
    "nowait": "senzattesa",
    "number": "numero",
    "of": "di",
    "offset": "offset",
    "on": "su",
    "or": "o|oppure",
    "path": "percorso",
    "position": "posizione",
    "program": "programma",
    "reply": "risposta",
    "resize": "ridimensiona",
    "rows": "righe",
    "running": "esecuzione",
    "state": "stato",
    "storage": "archivio",
    "subject": "oggetto",
    "symbol": "simbolo",
    "symbols": "simboli",
    "than": "di",
    "the": "il|lo|la|i|gli|le|l",
    "then": "poi",
    "to": "a",
    "tracing": "tracciamento",
    "unsorted": "nonordinato",
    "url": "url",
    "vertical": "verticale",
    "whitespace": "spazi",
    "with": "con",
    "begin": "inizio",
    "length": "lunghezza",
    "elements": "elementi",
    "index": "indice",
    "value": "valore",
    "left": "sinistra",
    "right": "destra",
    "field": "campo",
    "property": "proprieta",
    "random": "casuale",
    "cos": "cos",
    "sin": "sin",
    "tan": "tan",
    "acos": "acos",
    "asin": "asin",
    "atan": "atan",
    "now": "now",
    "timestamp": "timestamp",
    "today": "today",
    "newline": "newline",
    "tab": "tabulazione|tab",
    "backtick": "backtick",
    "empty": "vuoto",
    "uuid": "uuid",
    "date": "data",
    "encode": "encode",
    "decode": "decode",
    "lowercase": "minuscolo",
    "hash": "hash",
    "reverse": "inverti",
    "trim": "taglia",
    "char": "carattere",
    "character": "carattere",
    "true": "vero",
    "false": "falso",
    "year": "anno",
    "month": "mese",
    "monthnumber": "monthnumber",
    "day": "giorno",
    "daynumber": "daynumber",
    "hour": "ora",
    "minute": "minuto",
    "second": "secondo",
    "millisecond": "millisecondo",
    "modulo": "modulo",
    "time": "tempo",
    "radius": "radius",
    "cat": "cat",
    "greater": "maggiore",
    "less": "minore",
    "even": "pari",
    "odd": "dispari",
    "includes": "contiene",
    "starts": "inizia",
    "ends": "finisce",
    "has": "ha",
    "no": "nessuna|nessun|nessuno",
    "entry": "voce",
    "numeric": "numerico",
    "array": "vettore",
    "object": "oggetto",
    "an": "un|uno|una",
    "arg": "arg",
    "payload": "payload",
    "ready": "pronto",
    "format": "formato|formatta",
    "forward": "avanti",
    "failure": "fallimento",
    "topic": "argomento",
    "error": "errore",
    "sender": "mittente",
    "encoding": "codifica",
    "module": "modulo",
    "variable": "variabile",
    "callback": "callback",
    "set": "imposta",
    "sort": "ordina",
    "shuffle": "mescola",
    "parse": "analizza",
    "delete": "elimina",
    "rename": "rinomina",
    "add": "aggiungi",
    "split": "dividi",
    "replace": "sostituisci",
    "count": "conteggio",
    "size": "dimensione",
    "mobile": "mobile",
    "portrait": "ritratto",
    "landscape": "paesaggio",
    "br": "br",
    "location": "posizione",
    "key": "tasto",
    "hostname": "hostname",
    "query": "query",
    "browser": "browser",
    "content": "contenuto",
    "text": "testo",
    "selected": "selezionato",
    "color": "colore",
    "style": "stile",
    "screen": "schermo",
    "top": "alto",
    "bottom": "basso",
    "width": "larghezza",
    "height": "altezza",
    "scroll": "scorrimento",
    "parent": "genitore",
    "history": "cronologia",
    "pick": "scegli",
    "drag": "trascina",
    "drop": "rilascia",
    "change": "cambio",
    "leave": "lascia",
    "restore": "ripristina",
    "resume": "riprendi",
    "that": "che",
    "click": "clic",
    "window": "finestra",
    "viewport": "viewport",
    "item": "elemento",
    "prompt": "prompt",
    "styles": "stili",
    "fullscreen": "schermointero",
    "exit": "esci",
    "title": "titolo",
    "default": "predefinito",
    "tracer": "traccia",
    "class": "classe",
    "id": "id",
    "attributes": "attributi",
    "milli": "milli",
    "millis": "millis",
    "seconds": "secondi",
    "minutes": "minuti",
    "tick": "tick",
    "ticks": "ticks",
    "swipe": "scorri",
    "language": "lingua",
    "alert": "avviso",
    "append": "accoda",
    "attach": "collega",
    "clear": "svuota",
    "continue": "continua",
    "convert": "converti",
    "copy": "copia",
    "create": "crea",
    "debug": "debug",
    "alias": "alias",
    "div": "div",
    "span": "span",
    "button": "button",
    "input": "input",
    "textarea": "textarea",
    "select": "select",
    "option": "option",
    "a": "a",
    "p": "p",
    "pre": "pre",
    "h1": "h1",
    "h2": "h2",
    "h3": "h3",
    "h4": "h4",
    "h5": "h5",
    "h6": "h6",
    "img": "img",
    "image": "image",
    "canvas": "canvas",
    "table": "table",
    "tr": "tr",
    "td": "td",
    "th": "th",
    "ul": "ul",
    "li": "li",
    "form": "form",
    "fieldset": "fieldset",
    "legend": "legend",
    "label": "label",
    "blockquote": "blockquote",
    "hr": "hr",
    "section": "section",
    "file": "file",
    "audioclip": "audioclip",
    "progress": "progress",
    "disable": "disabilita",
    "divide": "dividi",
    "dummy": "nulla",
    "enable": "abilita",
    "every": "ogni",
    "filter": "filtra",
    "fork": "biforca",
    "request": "richiedi",
    "get": "ottieni",
    "gosub": "vaisub",
    "go": "vai",
    "highlight": "evidenzia",
    "if": "se",
    "import": "importa",
    "log": "registra",
    "mail": "email",
    "mqtt": "mqtt",
    "send": "invia",
    "multiply": "moltiplica",
    "negate": "nega",
    "increment": "incrementa",
    "decrement": "decrementa",
    "play": "riproduci",
    "pop": "estrai",
    "print": "stampa",
    "push": "inserisci",
    "put": "metti",
    "remove": "rimuovi",
    "render": "renderizza",
    "require": "richiedi",
    "rest": "rest",
    "post": "invia",
    "return": "ritorna",
    "run": "esegui",
    "sanitize": "sanifica",
    "stop": "ferma",
    "take": "togli|sottrai",
    "toggle": "inverti",
    "trace": "traccia",
    "try": "prova",
    "upload": "carica",
    "wait": "attendi",
    "while": "mentre",
    "close": "chiudi|chiusura",
    "binary": "binario",
    "directory": "cartella",
    "exist": "esiste",
    "plugin": "plugin",
    "timeout": "timeout",
    "line": "riga",
    "for": "per",
    "round": "arrotonda",
    "animation": "animazione",
    "trigger": "attiva",
    "specification": "specificazione",
    "spec": "spec",
    "opacity": "opacita",
    "start": "avvia",
    "step": "passo",
    "load": "carica",
    "circle": "cerchio",
    "ellipse": "ellisse",
    "group": "gruppo",
    "rect": "rettangolo",
    "move": "sposta",
    "svgtext": "svgtesto",
    "gmap": "gmap",
    "marker": "marcatore",
    "show": "mostra",
    "update": "aggiorna",
    "latitude": "latitudine",
    "longitude": "longitudine",
    "bounds": "limiti",
    "init": "inizializza",
    "find": "trova",
    "profile": "profilo",
    "mode": "modalita",
    "neighbours": "vicini",
    "cell": "cella",
    "anagrams": "anagrammi",
    "server": "server",
    "status": "stato",
    "port": "porta",
    "email": "email",
    "password": "password",
    "user": "utente",
    "html": "html",
    "broker": "broker",
    "subscribe": "sottoscrivi",
    "qos": "qos",
    "token": "token",
    "connect": "connetti|connessione",
    "layout": "layout",
    "panel": "pannello",
    "dialog": "dialogo",
    "checkbox": "checkbox",
    "combobox": "combobox",
    "listbox": "listbox",
    "pushbutton": "pulsante",
    "lineinput": "lineainput",
    "multiline": "multilinea",
    "mdpanel": "mdpannello",
    "groupbox": "grupposcatola",
    "icon": "icona",
    "background": "sfondo",
    "spacing": "spaziatura",
    "stretch": "estendi",
    "expand": "espandi",
    "spacer": "spazio",
    "alignment": "allineamento",
    "align": "allinea",
    "blocked": "bloccato",
    "current": "corrente",
    "hide": "nascondi",
    "center": "centra",
    "adjust": "regola",
    "type": "tipo",
    "zoom": "zoom",
    "via": "via",
    "memory": "memoria"
  },
  "diagnostics": {
    "unknownCommand": "Non capisco '{token}' alla riga {line}.",
    "undeclaredVariable": "La variabile '{name}' non e stata dichiarata.",
    "unexpectedToken": "Atteso '{expected}' ma trovato '{actual}' alla riga {line}.",
    "divisionByZero": "Divisione per zero alla riga {line}.",
    "indexOutOfRange": "Indice {index} fuori intervallo alla riga {line}.",
    "moduleNotFound": "Modulo '{name}' non trovato.",
    "syntaxError": "Errore di sintassi alla riga {line}: {detail}."
  }
};
