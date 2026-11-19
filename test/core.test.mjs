// Tests for src/core.mjs — run: node test/core.test.mjs
import assert from 'node:assert/strict';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import cashaddr from 'cashaddrjs';
import {
  deriveIdentity, newIdentity, makeStatement,
  createSameKeyAttestation, createCrossKeyAttestation, verifyAttestation,
  attestationToNostrEvent, verifyNostrEvent, recoverBitcoinMessagePubkey,
  xOnlyFromNpub, privFromNsec,
} from '../src/core.mjs';

let pass = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS', name); }
  catch (e) { console.error('  FAIL', name, '-', e.message); process.exitCode = 1; }
}

// --- Known vector: private key = 1 ------------------------------------------
// Compressed pubkey 0279be667e... is the textbook secp256k1 generator point;
// hash160 751e76e8199196d454941c45d1b3a323f1433bd6 is the well-known address
// 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH. Nostr x-only = 79be667e...
const priv1 = new Uint8Array(32); priv1[31] = 1;
t('privkey 1: compressed pubkey is the generator point', () => {
  const id = deriveIdentity(priv1);
  assert.equal(id.pubkeyCompressedHex,
    '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
});
t('privkey 1: hash160 matches the textbook value', () => {
  const decoded = cashaddr.decode(deriveIdentity(priv1).bchAddress);
  assert.equal(bytesToHex(decoded.hash), '751e76e8199196d454941c45d1b3a323f1433bd6');
  assert.equal(decoded.prefix, 'bitcoincash');
  assert.equal(decoded.type, 'P2PKH');
});
t('privkey 1: cashaddr round-trips through decode', () => {
  const id = deriveIdentity(priv1);
  assert.equal(cashaddr.encode('bitcoincash', 'P2PKH', cashaddr.decode(id.bchAddress).hash), id.bchAddress);
  console.log('       address:', id.bchAddress);
});
t('privkey 1: Nostr x-only pubkey is the generator x-coordinate', () => {
  const id = deriveIdentity(priv1);
  assert.equal(id.nostrPubkeyHex, '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
});
t('npub/nsec bech32 round-trip', () => {
  const id = deriveIdentity(priv1);
  assert.equal(bytesToHex(xOnlyFromNpub(id.npub)), id.nostrPubkeyHex);
  assert.equal(bytesToHex(privFromNsec(id.nsec)), id.privHex);
  console.log('       npub:', id.npub);
});

// --- Same-key attestation ----------------------------------------------------
const fixedDate = new Date('2026-11-20T00:00:00.000Z');
t('same-key attestation verifies (all checks pass)', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const res = verifyAttestation(att);
  for (const c of res.checks) console.log(`       [${c.pass ? 'x' : ' '}] ${c.name}`);
  assert.equal(res.ok, true);
});
t('same-key attestation is deterministic for a fixed date (except Schnorr aux-rand)', () => {
  const a = createSameKeyAttestation(priv1, fixedDate);
  const b = createSameKeyAttestation(priv1, fixedDate);
  // BIP340 Schnorr uses random aux data, so the two Schnorr sigs differ by design;
  // everything else (incl. the deterministic RFC6979 ECDSA sig) must be identical.
  assert.notEqual(a.nostrSignature, b.nostrSignature);
  delete a.nostrSignature; delete b.nostrSignature;
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
t('tampered statement fails verification', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  att.statement = att.statement.replace('Bitcoin Cash', 'Bitcoin Trash');
  assert.equal(verifyAttestation(att).ok, false);
});
t('tampered BCH signature fails verification', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const raw = Buffer.from(att.bchSignature, 'base64'); raw[10] ^= 1;
  att.bchSignature = raw.toString('base64');
  assert.equal(verifyAttestation(att).ok, false);
});
t('tampered Nostr signature fails verification', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  att.nostrSignature = '00' + att.nostrSignature.slice(2);
  assert.equal(verifyAttestation(att).ok, false);
});
t('swapped address fails verification', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const other = deriveIdentity(hexToBytes('02'.padStart(64, '0')));
  att.bchAddress = other.bchAddress;
  assert.equal(verifyAttestation(att).ok, false);
});
t('BCH message signature recovers the right pubkey', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const rec = recoverBitcoinMessagePubkey(att.statement, att.bchSignature);
  assert.equal(bytesToHex(rec.compressedPubkey), att.bchPubkeyCompressed);
});

// --- Cross-key attestation ---------------------------------------------------
t('cross-key attestation verifies', () => {
  const bchPriv = hexToBytes('11'.repeat(32));
  const nostrPriv = hexToBytes('22'.repeat(32));
  const att = createCrossKeyAttestation(bchPriv, nostrPriv, fixedDate);
  const res = verifyAttestation(att);
  for (const c of res.checks) console.log(`       [${c.pass ? 'x' : ' '}] ${c.name}`);
  assert.equal(res.ok, true);
  // same-key check must NOT be present in cross-key mode
  assert.equal(res.checks.some((c) => c.name.includes('same key')), false);
});
t('cross-key tampered npub fails verification', () => {
  const att = createCrossKeyAttestation(hexToBytes('11'.repeat(32)), hexToBytes('22'.repeat(32)), fixedDate);
  const other = deriveIdentity(hexToBytes('33'.repeat(32)));
  att.npub = other.npub;
  assert.equal(verifyAttestation(att).ok, false);
});

// --- Random identities -------------------------------------------------------
t('5 random identities: full round-trip', () => {
  for (let i = 0; i < 5; i++) {
    const id = newIdentity();
    const att = createSameKeyAttestation(hexToBytes(id.privHex), fixedDate);
    assert.equal(verifyAttestation(att).ok, true);
  }
});

// --- Nostr event -------------------------------------------------------------
t('Nostr event id + signature verify (NIP-01)', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const ev = attestationToNostrEvent(att, priv1, 1793000000);
  const res = verifyNostrEvent(ev);
  assert.equal(res.ok, true);
  assert.equal(ev.pubkey, att.nostrPubkey);
  assert.deepEqual(ev.tags[2], ['bch', att.bchAddress]);
});
t('tampered Nostr event fails', () => {
  const att = createSameKeyAttestation(priv1, fixedDate);
  const ev = attestationToNostrEvent(att, priv1, 1793000000);
  ev.content += '!';
  assert.equal(verifyNostrEvent(ev).ok, false);
});

console.log(`\n${pass} tests passed`);
