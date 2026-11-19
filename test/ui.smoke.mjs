// Headless UI smoke test — run: node test/ui.smoke.mjs
// Loads public/index.html + the bundled app.js in jsdom and drives the whole flow.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://example.org/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
// minimal clipboard stub (jsdom has no navigator.clipboard)
window.navigator.clipboard = { writeText: async () => {} };
window.WebSocket = class { constructor() { throw new Error('no network in smoke test'); } };

const errors = [];
window.addEventListener('error', (e) => errors.push(e.message));
window.eval(js);

const $ = (id) => window.document.getElementById(id);
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('PASS:', msg); };

// 1. generate identity
$('btn-generate').click();
assert(!$('identity-out').classList.contains('hidden'), 'identity panel appears after Generate');
assert($('id-bch').textContent.startsWith('bitcoincash:q'), 'BCH address shown: ' + $('id-bch').textContent);
assert($('id-npub').textContent.startsWith('npub1'), 'npub shown: ' + $('id-npub').textContent.slice(0, 20) + '…');
assert(!$('btn-sign').disabled, 'Sign button enabled');

// 2. sign attestation
$('btn-sign').click();
assert(!$('att-out').classList.contains('hidden'), 'attestation panel appears after Sign');
const att = JSON.parse($('att-json').textContent);
assert(att.mode === 'same-key' && att.bchSignature && att.nostrSignature, 'attestation JSON complete');
assert($('in-att').value.includes(att.bchAddress), 'verifier pre-filled with own attestation');

// 3. verify own attestation -> green verdict
$('btn-verify').click();
assert($('verify-verdict').textContent.includes('VERIFIED'), 'own attestation verifies green: ' + $('verify-verdict').textContent.slice(0, 40));
assert(window.document.querySelectorAll('#verify-checks li.ok').length === 7, 'all 7 checks pass in UI');

// 4. tamper -> red verdict
const bad = { ...att, statement: att.statement.replace('Bitcoin Cash', 'Bitcoin Trash') };
$('in-att').value = JSON.stringify(bad);
$('btn-verify').click();
assert($('verify-verdict').textContent.includes('NOT VERIFIED'), 'tampered attestation fails in UI');

// 5. sample button generates a fresh verifiable attestation
$('btn-sample').click();
assert($('verify-verdict').textContent.includes('VERIFIED'), 'fresh sample verifies green');

// 6. import flow: nsec round-trip (use the generated nsec from step 1)
$('tab-import').click();
$('in-nsec').value = $('id-nsec').textContent;
$('btn-import').click();
assert($('import-status').textContent.includes('Same-key'), 'import nsec -> same-key mode: ' + $('import-status').textContent);
assert($('id-bch').textContent.startsWith('bitcoincash:q'), 'imported identity shows same BCH address');

assert(errors.length === 0, 'no window errors during flow (got: ' + errors.join(' | ') + ')');
console.log('\nUI smoke test done');
