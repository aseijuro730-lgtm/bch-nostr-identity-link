// BCH x Nostr Identity Link — browser UI (bundled with esbuild; see package.json)
import { sha256 } from '@noble/hashes/sha256';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { base58 } from '@scure/base';
import {
  newIdentity, deriveIdentity, privFromNsec,
  createSameKeyAttestation, createCrossKeyAttestation, verifyAttestation,
  attestationToNostrEvent, verifyNostrEvent,
} from './core.mjs';

const $ = (id) => document.getElementById(id);
const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net'];

let state = { mode: null, bchPriv: null, nostrPriv: null, identity: null, attestation: null };

/* ------------------------------------------------------------------ WIF */
function wifToPriv(wif) {
  const raw = base58.decode(wif.trim());
  if (raw.length !== 37 && raw.length !== 38) throw new Error('bad WIF length');
  if (raw[0] !== 0x80) throw new Error('not a mainnet WIF (must start with 0x80)');
  const payload = raw.slice(0, -4);
  const check = raw.slice(-4);
  const expect = sha256(sha256(payload)).slice(0, 4);
  if (bytesToHex(check) !== bytesToHex(expect)) throw new Error('bad WIF checksum');
  const compressed = payload.length === 34 && payload[33] === 0x01;
  if (!compressed) throw new Error('only compressed WIF supported');
  return payload.slice(1, 33);
}

/* ------------------------------------------------------------------ UI */
function showIdentity() {
  const id = state.identity;
  $('id-mode').textContent = state.mode === 'same-key'
    ? 'Same key — one private key, BCH address + Nostr pubkey'
    : 'Cross key — separate BCH and Nostr keys, mutually attested';
  $('id-bch').textContent = id.bchAddress;
  $('id-bchpub').textContent = id.pubkeyCompressedHex;
  $('id-npubkey').textContent = id.nostrPubkeyHex;
  $('id-npub').textContent = id.npub;
  $('id-nsec').textContent = state.nsecText || '— (imported key — kept in memory only)';
  $('identity-out').classList.remove('hidden');
  $('btn-sign').disabled = false;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent; btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = old; }, 1500);
  });
}

// tabs
$('tab-new').onclick = () => {
  $('tab-new').classList.add('on'); $('tab-import').classList.remove('on');
  $('pane-new').classList.remove('hidden'); $('pane-import').classList.add('hidden');
};
$('tab-import').onclick = () => {
  $('tab-import').classList.add('on'); $('tab-new').classList.remove('on');
  $('pane-import').classList.remove('hidden'); $('pane-new').classList.add('hidden');
};

$('btn-generate').onclick = () => {
  const id = newIdentity();
  state = { mode: 'same-key', bchPriv: hexToBytes(id.privHex), nostrPriv: hexToBytes(id.privHex), identity: id, attestation: null, nsecText: id.nsec };
  showIdentity();
  $('att-out').classList.add('hidden');
  $('btn-copy-att').disabled = true; $('btn-dl-att').disabled = true; $('btn-publish').disabled = true;
};

$('btn-import').onclick = () => {
  const status = $('import-status');
  try {
    const nsec = $('in-nsec').value.trim();
    if (!nsec) throw new Error('paste an nsec first');
    const nostrPriv = privFromNsec(nsec);
    const nostrId = deriveIdentity(nostrPriv);
    const wif = $('in-wif').value.trim();
    if (wif) {
      const bchPriv = wifToPriv(wif);
      const bchId = deriveIdentity(bchPriv);
      state = { mode: 'cross-key', bchPriv, nostrPriv, identity: bchId, attestation: null, nsecText: nsec };
      // show the Nostr side too: stash npub on the BCH identity object for display
      state.identity = { ...bchId, npub: nostrId.npub, nostrPubkeyHex: nostrId.nostrPubkeyHex };
      status.innerHTML = '<b>Imported.</b> Cross-key mode: BCH ' + bchId.bchAddress + ' + Nostr ' + nostrId.npub;
    } else {
      state = { mode: 'same-key', bchPriv: nostrPriv, nostrPriv, identity: nostrId, attestation: null, nsecText: nsec };
      status.innerHTML = '<b>Imported.</b> Same-key mode: this nsec derives both identities.';
    }
    showIdentity();
    $('att-out').classList.add('hidden');
    $('btn-copy-att').disabled = true; $('btn-dl-att').disabled = true; $('btn-publish').disabled = true;
  } catch (e) {
    status.textContent = 'Import failed: ' + e.message;
  }
};

$('btn-copy-nsec').onclick = (e) => copyText($('id-nsec').textContent, e.target);
$('btn-copy-npub').onclick = (e) => copyText($('id-npub').textContent, e.target);
$('btn-copy-bch').onclick = (e) => copyText($('id-bch').textContent, e.target);

$('btn-sign').onclick = () => {
  const att = state.mode === 'same-key'
    ? createSameKeyAttestation(state.bchPriv)
    : createCrossKeyAttestation(state.bchPriv, state.nostrPriv);
  state.attestation = att;
  $('att-statement').textContent = att.statement;
  $('att-json').textContent = JSON.stringify(att, null, 2);
  $('att-out').classList.remove('hidden');
  $('btn-copy-att').disabled = false; $('btn-dl-att').disabled = false; $('btn-publish').disabled = false;
  // pre-fill the verifier with our own attestation
  $('in-att').value = JSON.stringify(att, null, 2);
};

$('btn-copy-att').onclick = (e) => copyText(JSON.stringify(state.attestation, null, 2), e.target);
$('btn-dl-att').onclick = () => {
  const blob = new Blob([JSON.stringify(state.attestation, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bch-nostr-attestation.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

/* --------------------------------------------------------------- verify */
function renderVerification(res) {
  $('verify-out').classList.remove('hidden');
  const v = $('verify-verdict');
  v.className = 'verdict ' + (res.ok ? 'ok' : 'bad');
  v.textContent = res.ok
    ? '✓ LINK VERIFIED — this BCH address and this Nostr identity belong to the same person.'
    : '✗ LINK NOT VERIFIED — at least one check failed. Do not trust this link.';
  $('verify-checks').innerHTML = res.checks.map((c) =>
    `<li class="${c.pass ? 'ok' : 'bad'}">${c.name}${c.detail ? `<small>${c.detail}</small>` : ''}</li>`).join('');
}

$('btn-verify').onclick = () => {
  try {
    const att = JSON.parse($('in-att').value);
    renderVerification(verifyAttestation(att));
  } catch (e) {
    renderVerification({ ok: false, checks: [{ name: 'Attestation parses as JSON', pass: false, detail: e.message }] });
  }
};

$('btn-sample').onclick = () => {
  const id = newIdentity();
  const att = createSameKeyAttestation(hexToBytes(id.privHex));
  $('in-att').value = JSON.stringify(att, null, 2);
  renderVerification(verifyAttestation(att));
};

/* -------------------------------------------------------------- publish */
$('btn-publish').onclick = async () => {
  const btn = $('btn-publish');
  const status = $('publish-status');
  btn.disabled = true;
  const event = attestationToNostrEvent(state.attestation, state.nostrPriv);
  const checkEv = verifyNostrEvent(event);
  if (!checkEv.ok) { status.textContent = 'Internal error: event failed self-check.'; btn.disabled = false; return; }
  $('event-json').textContent = JSON.stringify(event, null, 2);
  $('event-out').classList.remove('hidden');
  let done = 0;
  status.innerHTML = 'Publishing to ' + RELAYS.length + ' relays…';
  await Promise.all(RELAYS.map((url) => new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => { if (!settled) { settled = true; if (ok) done++; resolve(); } };
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { try { ws.close(); } catch (_) {} finish(false); }, 8000);
      ws.onopen = () => ws.send(JSON.stringify(['EVENT', event]));
      ws.onmessage = (m) => {
        try {
          const d = JSON.parse(m.data);
          if (d[0] === 'OK' && d[1] === event.id) { clearTimeout(timer); finish(d[2] === true); try { ws.close(); } catch (_) {} }
        } catch (_) {}
      };
      ws.onerror = () => { clearTimeout(timer); finish(false); };
    } catch (_) { finish(false); }
  })));
  status.innerHTML = done > 0
    ? `<b>Published.</b> ${done}/${RELAYS.length} relays accepted the event (id ${event.id.slice(0, 16)}…). Anyone can now find the link on Nostr.`
    : `<b>Not published.</b> No relay accepted the event (offline or relays unreachable). The signed event JSON above is still valid — paste it into any Nostr client to publish later.`;
  btn.disabled = false;
};
