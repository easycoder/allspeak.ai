// Compile-only smoke test for the new codemirror plugin commands.
// Loads the built bundle + plugin in a stubbed Node context, compiles
// asedit.as and a focused snippet, and asserts the new commands compile.
const fs = require(`fs`);
const vm = require(`vm`);
global.fs = fs;

// Minimal browser stubs: load-time code registers listeners and reads
// window.location/localStorage inside try/catch, so inert stubs suffice.
global.window = {
  addEventListener: () => {},
  location: { search: `` },
  localStorage: undefined,
  innerWidth: 1024,
  innerHeight: 768,
  getComputedStyle: () => ({ lineHeight: `16px` })
};
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({ style: {} })
};

const bundle = fs.readFileSync(`deploy/dist/allspeak.js`, `utf8`);
const plugin = fs.readFileSync(`js/plugins/codemirror.js`, `utf8`);

const testCode = `
AllSpeak.scripts = {};
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
const asedit = fs.readFileSync('asedit.as', 'utf8');
const source = AllSpeak.tokeniseFile(asedit.split('\\n'));
const program = AllSpeak.compileScript(source);
const warnings = AllSpeak_Compiler.warnings;
console.log('COMPILED asedit.as: lines=' + source.scriptLines.length + ' tokens=' + source.tokens.length + ' commands=' + program.length);
console.log('WARNINGS: ' + JSON.stringify(warnings));

const cm = program.filter(c => c.domain === 'codemirror');
const getCursor = cm.filter(c => c.action === 'getCursor');
const scrollToLine = cm.filter(c => c.action === 'scrollToLine');
console.log('codemirror commands: ' + cm.length + ', getCursor: ' + getCursor.length + ', scrollToLine: ' + scrollToLine.length);
if (getCursor.length < 1) throw new Error('no getCursor command compiled from asedit.as');
if (scrollToLine.length < 1) throw new Error('no scrollToLine command compiled from asedit.as');

// Focused snippet exercising both new syntaxes with a variable and literal.
const snip = AllSpeak.tokeniseFile([
  'script T',
  '    variable Ed',
  '    variable Ln',
  '    codemirror get cursor of Ed into Ln',
  '    codemirror scroll to line Ln in Ed',
  '    codemirror scroll to line 42 in Ed',
  '    stop'
]);
const sp = AllSpeak.compileScript(snip);
const scm = sp.filter(c => c.domain === 'codemirror');
console.log('SNIPPET codemirror commands: ' + JSON.stringify(scm.map(c => c.action)));
if (scm.length !== 3) throw new Error('expected 3 codemirror commands in snippet, got ' + scm.length);
console.log('SNIPPET-OK');

// --- Run-level test with a fake CodeMirror instance ---
const calls = { refresh: 0, scrollTo: null, charCoords: null, cursor: { line: 17, ch: 3 } };
const fakeEditor = {
  getCursor: () => calls.cursor,
  refresh: () => { calls.refresh++; },
  charCoords: (pos, mode) => { calls.charCoords = { pos, mode }; return { top: 500 }; },
  scrollTo: (x, y) => { calls.scrollTo = { x, y }; }
};
const fakeRecords = {
  Ed: { element: [{ id: 'x' }], editor: fakeEditor },
  Ln: { value: [null], index: 0, used: false }
};
const fakeProgram = {
  getSymbolRecord: (name) => fakeRecords[name],
  getValue: (v) => {
    if (v.type === 'constant') return v.content;
    if (v.type === 'symbol') {
      const rec = fakeRecords[v.name];
      return rec.value[rec.index] ? rec.value[rec.index].content : null;
    }
    return null;
  }
};
const gc = scm[0]; // getCursor
const stl = scm[1]; // scrollToLine with variable line
AllSpeak_CodeMirror.run({ ...fakeProgram, 0: gc, pc: 0 });
if (!fakeRecords.Ln.used) throw new Error('getCursor did not mark target used');
const got = fakeRecords.Ln.value[0];
if (got.type !== 'constant' || got.numeric !== true || got.content !== 17) {
  throw new Error('getCursor result wrong: ' + JSON.stringify(got));
}
console.log('RUNTIME getCursor -> ' + JSON.stringify(got));
fakeRecords.Ln.value[0] = { type: 'constant', numeric: true, content: 5 };
AllSpeak_CodeMirror.run({ ...fakeProgram, 0: stl, pc: 0 });
if (calls.refresh !== 1) throw new Error('scrollToLine did not refresh editor');
if (!calls.charCoords || calls.charCoords.pos.line !== 5 || calls.charCoords.mode !== 'local') {
  throw new Error('charCoords wrong: ' + JSON.stringify(calls.charCoords));
}
if (!calls.scrollTo || calls.scrollTo.y !== 480) {
  throw new Error('scrollTo wrong: ' + JSON.stringify(calls.scrollTo));
}
console.log('RUNTIME scrollToLine -> refresh=' + calls.refresh + ' charCoords=' + JSON.stringify(calls.charCoords) + ' scrollTo=' + JSON.stringify(calls.scrollTo));
console.log('RUNTIME-OK');

// --- scroll <element> into view (browser domain) ---
const ivCalls = { scrollIntoView: null };
fakeRecords.Row = { element: [{}, {}], index: 1, used: false };
const ivSnip = AllSpeak.tokeniseFile([
  'script V',
  '    div Row',
  '    scroll Row into view',
  '    stop'
]);
const ivProgram = AllSpeak.compileScript(ivSnip);
const ivCmds = ivProgram.filter(c => c.keyword === 'scroll');
console.log('INTOVIEW compiled: ' + JSON.stringify(ivCmds.map(c => c.type)));
if (ivCmds.length !== 1 || ivCmds[0].type !== 'intoView' || ivCmds[0].name !== 'Row') {
  throw new Error('intoView command wrong: ' + JSON.stringify(ivCmds));
}
fakeRecords.Row.element[1].scrollIntoView = (opts) => { ivCalls.scrollIntoView = opts; };
AllSpeak_Browser.run({ ...fakeProgram, 0: ivCmds[0], pc: 0 });
if (!ivCalls.scrollIntoView || ivCalls.scrollIntoView.block !== 'nearest') {
  throw new Error('intoView runtime wrong: ' + JSON.stringify(ivCalls.scrollIntoView));
}
console.log('RUNTIME scroll into view -> ' + JSON.stringify(ivCalls.scrollIntoView));
console.log('INTOVIEW-OK');

// --- textarea selection getter / setter (browser domain) ---
const selSnip = AllSpeak.tokeniseFile([
  'script W',
  '    textarea Pane',
  '    variable Txt',
  '    put the selected text of Pane into Txt',
  '    set the selection of Pane from 2 to 5',
  '    stop'
]);
const selProgram = AllSpeak.compileScript(selSnip);
const selCmds = selProgram.filter(c => c.type === 'setSelection');
console.log('SETSELECTION compiled: ' + JSON.stringify(selCmds.map(c => ({ type: c.type, symbolName: c.symbolName, start: c.start, end: c.end }))));
if (selCmds.length !== 1 || selCmds[0].symbolName !== 'Pane') {
  throw new Error('setSelection compile wrong: ' + JSON.stringify(selCmds));
}
const fakePane = {
  tagName: 'TEXTAREA',
  value: 'hello world',
  selectionStart: 6,
  selectionEnd: 11,
  focus: () => {},
  setSelectionRange: (a, b) => { fakePane.setRange = [a, b]; }
};
fakeRecords.Pane = { element: [fakePane], index: 0, used: false };
const selValue = { domain: 'browser', type: 'selected', symbol: 'Pane', arg: 'text' };
const selResult = AllSpeak_Browser.value.get(fakeProgram, selValue);
if (selResult.content !== 'world') {
  throw new Error('the selected text getter wrong: ' + JSON.stringify(selResult));
}
console.log('RUNTIME the selected text of -> ' + JSON.stringify(selResult.content));
AllSpeak_Browser.run({ ...fakeProgram, 0: selCmds[0], pc: 0 });
if (!fakePane.setRange || fakePane.setRange[0] !== 2 || fakePane.setRange[1] !== 5) {
  throw new Error('setSelection runtime wrong: ' + JSON.stringify(fakePane.setRange));
}
console.log('RUNTIME set the selection of -> ' + JSON.stringify(fakePane.setRange));
console.log('SELECTION-OK');

// setSelection scroll nudge: caret line far below the viewport must scroll.
const bigPane = {
  tagName: 'TEXTAREA',
  value: Array.from({ length: 30 }, (_, i) => 'line' + i).join('\\n'),
  selectionStart: 0, selectionEnd: 0,
  scrollHeight: 600, clientHeight: 100, scrollTop: 0,
  focus: () => {},
  setSelectionRange: (a, b) => { bigPane.setRange = [a, b]; }
};
fakeRecords.Big = { element: [bigPane], index: 0, used: false };
const bigCmd = {
  domain: 'browser', keyword: 'set', type: 'setSelection', symbolName: 'Big',
  start: { type: 'constant', numeric: true, content: 140 },
  end: { type: 'constant', numeric: true, content: 145 }
};
AllSpeak_Browser.run({ ...fakeProgram, 0: bigCmd, pc: 0 });
// char 140 falls on line ~23 of 30, well below the 100px viewport
if (!(bigPane.scrollTop > 0)) throw new Error('scroll nudge failed: scrollTop=' + bigPane.scrollTop);
console.log('RUNTIME setSelection scroll nudge -> scrollTop=' + bigPane.scrollTop);
console.log('NUDGE-OK');

// --- binary modulo operator (core domain) ---
const modSnip = AllSpeak.tokeniseFile([
  'script M',
  '    variable N',
  '    put 17 modulo 5 into N',
  '    put N modulo 3 into N',
  '    stop'
]);
const modProgram = AllSpeak.compileScript(modSnip);
const puts = modProgram.filter(c => c.keyword === 'put');
const modTypes = puts.map(c => c.value && c.value.type);
console.log('MODULO compiled types: ' + JSON.stringify(modTypes));
if (modTypes.join(',') !== 'modulo,modulo') throw new Error('modulo compile wrong: ' + modTypes);
// run-level: evaluate the two modulo values directly
const modVals = modProgram.filter(c => c.keyword === 'put' && c.value.type === 'modulo').map(c => c.value);
const m1 = AllSpeak_Value.doValue({ getSymbolRecord: () => ({ isVHolder: true, value: [{ type: 'constant', numeric: true, content: 17 }], index: 0 }) }, modVals[0]);
const m2 = AllSpeak_Value.doValue({ getSymbolRecord: () => ({ isVHolder: true, value: [{ type: 'constant', numeric: true, content: 17 }], index: 0 }) }, modVals[1]);
if (m1.content !== 2 || m2.content !== 2) throw new Error('modulo run wrong: ' + m1.content + ',' + m2.content);
console.log('RUNTIME modulo -> ' + m1.content + ' ' + m2.content);
console.log('MODULO-OK');

// --- bare the selected text (browser domain) ---
const bareSnip = AllSpeak.tokeniseFile([
  'script Q',
  '    variable Txt',
  '    put the selected text into Txt',
  '    stop'
]);
const bareProgram = AllSpeak.compileScript(bareSnip);
const bareValue = bareProgram.filter(c => c.keyword === 'put')[0].value;
console.log('BARE selected text compiled: ' + JSON.stringify(bareValue));
if (bareValue.type !== 'selected' || bareValue.symbol !== null || bareValue.arg !== 'text') {
  throw new Error('bare selected text compile wrong: ' + JSON.stringify(bareValue));
}
global.document.activeElement = { tagName: 'TEXTAREA', value: 'hello world', selectionStart: 6, selectionEnd: 11 };
const bareResult = AllSpeak_Browser.value.get(fakeProgram, bareValue);
if (bareResult.content !== 'world') throw new Error('bare selected text run wrong: ' + JSON.stringify(bareResult));
console.log('RUNTIME bare the selected text -> ' + JSON.stringify(bareResult.content));
console.log('BARE-OK');

// --- scale operator (core domain) ---
const scaleSnip = AllSpeak.tokeniseFile([
  'script P',
  '    variable Pi',
  '    put \`3.14\` scale 100 into Pi',
  '    put \`-3.14\` scale 100 into Pi',
  '    put \`12.345\` scale 100 into Pi',
  '    put \`42\` scale 100 into Pi',
  '    stop'
]);
const scaleProgram = AllSpeak.compileScript(scaleSnip);
const scalePuts = scaleProgram.filter(c => c.keyword === 'put');
const scaleTypes = scalePuts.map(c => c.value && c.value.type);
console.log('SCALE compiled types: ' + JSON.stringify(scaleTypes));
if (scaleTypes.join(',') !== 'scale,scale,scale,scale') throw new Error('scale compile wrong: ' + scaleTypes);
const scaleVals = scalePuts.filter(c => c.value.type === 'scale').map(c => c.value);
const scaleProg = { pc: 0, 0: { lino: 1 }, runtimeError: (l, m) => { throw new Error('ERR: ' + m); } };
const scaleResults = scaleVals.map(v => AllSpeak_Value.doValue(scaleProg, v).content);
console.log('RUNTIME scale -> ' + JSON.stringify(scaleResults));
if (scaleResults.join(',') !== '314,-314,1235,4200') throw new Error('scale run wrong: ' + scaleResults);
console.log('SCALE-OK');
`;

// Share the host global so `global.window`/`global.document` stubs are visible.
vm.runInThisContext(bundle + `\n` + plugin + `\n` + testCode, { filename: `smoke.js` });
