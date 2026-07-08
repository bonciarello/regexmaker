/* ============================================================
   Test suite — Regex generation algorithm
   ============================================================ */

const { deepStrictEqual: eq, strictEqual: is, ok, throws } = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed++;
    console.log('  ✗ ' + name);
    console.log('    ' + e.message.replace(/\n/g, '\n    '));
  }
}

// --- Load the app ---
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'https://cristianporco.it/app/regexmaker/',
  runScripts: 'dangerously',
  resources: 'usable'
});

// Extract the IIFE and run it
const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// We need to polyfill/adapt for Node
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock clipboard API
global.navigator.clipboard = {
  writeText: async () => {}
};

// Run the script
eval(scriptContent);

const { document: doc } = dom.window;

console.log('\n=== Test HTML/SEO ===\n');

test('title contiene "Generatore di Regex"', () => {
  const title = doc.querySelector('title');
  ok(title, 'manca <title>');
  ok(title.textContent.includes('Generatore di Regex'), 'titolo errato');
});

test('meta description presente', () => {
  const meta = doc.querySelector('meta[name="description"]');
  ok(meta, 'manca meta description');
  ok(meta.content.length > 50, 'description troppo corta');
});

test('canonical URL corretto', () => {
  const link = doc.querySelector('link[rel="canonical"]');
  ok(link, 'manca canonical');
  is(link.href, 'https://cristianporco.it/app/regexmaker/');
});

test('OG tags presenti', () => {
  ok(doc.querySelector('meta[property="og:title"]'), 'manca og:title');
  ok(doc.querySelector('meta[property="og:description"]'), 'manca og:description');
  ok(doc.querySelector('meta[property="og:url"]'), 'manca og:url');
});

test('JSON-LD presente', () => {
  const ld = doc.querySelector('script[type="application/ld+json"]');
  ok(ld, 'manca JSON-LD');
  const data = JSON.parse(ld.textContent);
  is(data['@type'], 'WebApplication');
  is(data.name, 'Generatore di Regex da Esempi di Testo');
});

test('lang="it" su html', () => {
  is(doc.documentElement.lang, 'it');
});

test('viewport meta presente', () => {
  const vp = doc.querySelector('meta[name="viewport"]');
  ok(vp, 'manca viewport');
  ok(vp.content.includes('width=device-width'), 'viewport incompleto');
});

test('esattamente un h1', () => {
  const h1s = doc.querySelectorAll('h1');
  is(h1s.length, 1, 'dev\'esserci esattamente 1 h1, trovati ' + h1s.length);
});

test('landmark header/main/footer presenti', () => {
  ok(doc.querySelector('header'), 'manca header');
  ok(doc.querySelector('main'), 'manca main');
  ok(doc.querySelector('footer'), 'manca footer');
});

test('label con for su tutti gli input', () => {
  const inputs = doc.querySelectorAll('textarea, input[type="text"]');
  inputs.forEach(el => {
    const id = el.id;
    if (id) {
      const label = doc.querySelector('label[for="' + id + '"]');
      ok(label, 'manca label per #' + id);
    }
  });
});

test('alt text su immagini', () => {
  const imgs = doc.querySelectorAll('img');
  imgs.forEach(img => {
    ok(img.hasAttribute('alt'), 'manca alt su img: ' + img.outerHTML.slice(0, 100));
  });
});

test('width/height su media', () => {
  // Check SVGs have dimensions
  const svgs = doc.querySelectorAll('svg');
  svgs.forEach(svg => {
    ok(svg.hasAttribute('width') && svg.hasAttribute('height'),
       'SVG senza width/height');
  });
});

console.log('\n=== Test Algoritmo Regex ===\n');

const R = dom.window.__regexGen;

// Test Longest Common Prefix
test('longestCommonPrefix: base', () => {
  const prefix = R.longestCommonPrefix(['hello world', 'hello there', 'hello you']);
  is(prefix, 'hello ');
});

// Test Longest Common Suffix
test('longestCommonSuffix: base', () => {
  const suffix = R.longestCommonSuffix(['file.txt', 'data.txt', 'backup.txt']);
  is(suffix, '.txt');
});

// Test regex generation with emails
test('generateRegex: email semplici', () => {
  const result = R.generateRegex(
    'alice@example.com\nbob@test.org\ncarol@dominio.it',
    'non-email\n@mancante'
  );
  ok(!result.error, 'non dovrebbe dare errore: ' + (result.error || ''));
  ok(result.pattern.length > 0, 'pattern vuoto');
  ok(result.pattern.includes('@'), 'dovrebbe includere @');
});

// Test regex generation with numbers
test('generateRegex: numeri fissi', () => {
  const result = R.generateRegex(
    'ABC-123\nABC-456\nABC-789',
    'XYZ-123'
  );
  ok(!result.error, 'non dovrebbe dare errore');
  ok(result.pattern.includes('ABC'), 'dovrebbe includere il prefisso ABC');
  ok(result.pattern.includes('\\d'), 'dovrebbe usare \\d per le cifre');
});

// Test regex generation with single example
test('generateRegex: singolo esempio', () => {
  const result = R.generateRegex(
    'test@example.com',
    ''
  );
  ok(!result.error, 'non dovrebbe dare errore');
  ok(result.pattern.length > 0, 'pattern vuoto');
});

// Test with no match examples
test('generateRegex: nessun esempio', () => {
  const result = R.generateRegex('', '');
  ok(result.error, 'dovrebbe dare errore');
});

// Test escapeRegex
test('escapeRegex: caratteri speciali', () => {
  const escaped = R.escapeRegex('test.com?q=1');
  ok(escaped.includes('\\?'), 'dovrebbe escapare ?');
  ok(escaped.includes('\\.'), 'dovrebbe escapare .');
});

console.log('\n=== Test UI ===\n');

test('pulsante Genera regex presente', () => {
  const btn = doc.getElementById('generate-btn');
  ok(btn, 'manca pulsante genera');
  is(btn.type, 'submit');
});

test('textarea match examples presente', () => {
  const ta = doc.getElementById('match-examples');
  ok(ta, 'manca textarea match');
  is(ta.required, true);
});

test('textarea reject examples presente', () => {
  const ta = doc.getElementById('reject-examples');
  ok(ta, 'manca textarea reject');
});

test('area test presente', () => {
  ok(doc.getElementById('test-input'), 'manca test input');
});

test('pulsante copia presente', () => {
  ok(doc.getElementById('copy-btn'), 'manca copy button');
});

test('area modifica manuale presente', () => {
  ok(doc.getElementById('manual-pattern'), 'manca manual pattern');
});

test('area sintassi presente', () => {
  ok(doc.getElementById('syntax-status'), 'manca syntax status');
});

// --- Summary ---
console.log('\n=== Riepilogo ===\n');
console.log('Passati: ' + passed);
console.log('Falliti: ' + failed);
console.log('Totale:  ' + (passed + failed));

if (failed > 0) {
  process.exit(1);
}
