// Standalone check of AllSpeak_Value.scale against the built bundle.
global.window = { addEventListener: () => {}, location: { search: `` }, localStorage: undefined };
global.document = { addEventListener: () => {}, getElementById: () => null };
global.fs = require(`fs`);
const vm = require(`vm`);
const bundle = fs.readFileSync(`deploy/dist/allspeak.js`, `utf8`);
vm.runInThisContext(bundle);
AllSpeak.scripts = {};
AllSpeak_Language.init(AllSpeak_LanguagePack_en);
const prog = { pc: 0, 0: { lino: 1 }, runtimeError: (l, m) => { throw new Error(`ERR: ` + m); } };
const ok = [[`3.14`, 100, 314], [`-3.14`, 100, -314], [`12.345`, 100, 1235],
  [`12.344`, 100, 1234], [`42`, 100, 4200], [`.5`, 100, 50], [`3.`, 100, 300],
  [`3.995`, 100, 400], [`0.995`, 100, 100], [`3.999`, 10, 40]];
for (const [s, f, exp] of ok) {
  const r = AllSpeak_Value.scale(prog, s, f);
  if (r !== exp) { console.log(`FAIL`, s, f, `got`, r, `want`, exp); process.exit(1); }
}
for (const [s, f] of [[`abc`, 100], [`3.1.4`, 100], [`3.14`, 0], [`3.14`, -5], [`3.14`, 2.5]]) {
  try { AllSpeak_Value.scale(prog, s, f); console.log(`FAIL: no error for`, s, f); process.exit(1); }
  catch (e) { if (!String(e.message).startsWith(`ERR`)) throw e; }
}
console.log(`SCALE-ALGO-OK: all cases + error cases pass`);
