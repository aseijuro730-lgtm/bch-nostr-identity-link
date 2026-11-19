// BCH x Nostr Identity Link — core cryptography (shared by Node tests & browser app)
// No network, no funds, no keys ever leave the device. Everything runs client-side.
//
// Two link modes:
//  A) SAME-KEY: one secp256k1 private key derives BOTH the BCH address (compressed
//     pubkey -> hash160 -> cashaddr) AND the Nostr pubkey (x-only BIP340 pubkey).
//     Anyone can prove the two identities are the same key, from public data alone.
//  B) CROSS-KEY: an existing BCH key and an existing Nostr key mutually sign a
//     statement binding the BCH address to the Nostr npub.
import { secp256k1, schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bytesToHex, hexToBytes, utf8ToBytes, randomBytes } from '@noble/hashes/utils';
import { bech32, base64 } from '@scure/base';
import cashaddr from 'cashaddrjs';

export const VERSION = 1;

/* ------------------------------------------------------------------ helpers */

export function hash160(bytes) {
  return ripemd160(sha256(bytes));
}

export function bchAddressFromCompressedPubkey(compressedPubkey) {
  const h = hash160(compressedPubkey);
  return cashaddr.encode('bitcoincash', 'P2PKH', h);
}

export function npubFromXOnly(xOnly) {
  return bech32.encode('npub', bech32.toWords(xOnly));
}

export function xOnlyFromNpub(npub) {
  const { prefix, words } = bech32.decode(npub);
  if (prefix !== 'npub') throw new Error('not an npub');
  return new Uint8Array(bech32.fromWords(words));
}

export function nsecFromPriv(priv) {
  return bech32.encode('nsec', bech32.toWords(priv));
}

export function privFromNsec(nsec) {
  const { prefix, words } = bech32.decode(nsec);
  if (prefix !== 'nsec') throw new Error('not an nsec');
  return new Uint8Array(bech32.fromWords(words));
}

/** Derive every public identifier from one 32-byte private key. */
export function deriveIdentity(priv) {
  if (priv.length !== 32) throw new Error('private key must be 32 bytes');
  const compressed = secp256k1.getPublicKey(priv, true); // 33 bytes
  const xOnly = schnorr.getPublicKey(priv); // 32 bytes
  // sanity: x-only must equal the x-coordinate of the compressed key
  if (bytesToHex(xOnly) !== bytesToHex(compressed.slice(1))) {
    throw new Error('internal: x-only mismatch');
  }
  const address = bchAddressFromCompressedPubkey(compressed);
  return {
    privHex: bytesToHex(priv),
    pubkeyCompressedHex: bytesToHex(compressed),
    pubkeyXOnlyHex: bytesToHex(xOnly),
    bchAddress: address,
    nostrPubkeyHex: bytesToHex(xOnly),
    npub: npubFromXOnly(xOnly),
    nsec: nsecFromPriv(priv),
  };
}

export function newIdentity() {
  return deriveIdentity(randomBytes(32));
}

/* ------------------------------------------------------- statement & signing */

export function makeStatement(bchAddress, npub, createdAt = new Date()) {
  const ts = createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
  return [
    'BCH x Nostr Identity Link',
    `I control the Bitcoin Cash address ${bchAddress}`,
    `and the Nostr public key ${npub}.`,
    'Both identities belong to the same person: me.',
    `Created: ${ts}`,
  ].join('\n');
}

/** Bitcoin signed-message hash: sha256(sha256(prefix || varint(len) || msg)). */
export function bitcoinMessageHash(message) {
  const msg = utf8ToBytes(message);
  const prefix = utf8ToBytes('Bitcoin Signed Message:\n');
  const lenByte = new Uint8Array([0x18]); // 24 = prefix length
  // Bitcoin varint for the message length
  let varint;
  if (msg.length < 253) varint = new Uint8Array([msg.length]);
  else if (msg.length <= 0xffff) {
    varint = new Uint8Array([0xfd, msg.length & 0xff, (msg.length >> 8) & 0xff]);
  } else if (msg.length <= 0xffffffff) {
    varint = new Uint8Array([0xfe,
      msg.length & 0xff, (msg.length >> 8) & 0xff,
      (msg.length >> 16) & 0xff, (msg.length >> 24) & 0xff]);
  } else throw new Error('message too long for this demo');
  const buf = new Uint8Array(lenByte.length + prefix.length + varint.length + msg.length);
  buf.set(lenByte, 0);
  buf.set(prefix, lenByte.length);
  buf.set(varint, lenByte.length + prefix.length);
  buf.set(msg, lenByte.length + prefix.length + varint.length);
  return sha256(sha256(buf));
}

/** ECDSA Bitcoin-message signature, base64, with recovery header (like Electrum). */
export function signBitcoinMessage(message, priv) {
  const hash = bitcoinMessageHash(message);
  // noble v1 computes sig.recovery by default (low-S normalized); no options object
  const sig = secp256k1.sign(hash, priv);
  const compact = sig.toCompactRawBytes(); // 64 bytes r||s
  const compressed = true; // we always use compressed pubkeys
  const header = 27 + sig.recovery + (compressed ? 4 : 0);
  const out = new Uint8Array(65);
  out[0] = header;
  out.set(compact, 1);
  return base64.encode(out);
}

/** Recover the compressed pubkey that made a Bitcoin-message signature. */
export function recoverBitcoinMessagePubkey(message, sigBase64) {
  const sigBytes = base64.decode(sigBase64);
  if (sigBytes.length !== 65) throw new Error('bad signature length');
  const header = sigBytes[0];
  if (header < 27 || header > 34) throw new Error('bad signature header');
  const recovery = (header - 27) & 3;
  const compressed = header >= 31;
  const hash = bitcoinMessageHash(message);
  const sig = secp256k1.Signature.fromCompact(sigBytes.slice(1, 65)).addRecoveryBit(recovery);
  const pub = sig.recoverPublicKey(hash);
  return { compressedPubkey: pub.toRawBytes(compressed), recovery, compressed };
}

/** BIP340 Schnorr signature (hex) over sha256(statement), Nostr-style. */
export function signNostrStatement(statement, priv) {
  const hash = sha256(utf8ToBytes(statement));
  return bytesToHex(schnorr.sign(hash, priv));
}

export function verifyNostrStatement(statement, sigHex, xOnlyPubkey) {
  const hash = sha256(utf8ToBytes(statement));
  return schnorr.verify(hexToBytes(sigHex), hash, xOnlyPubkey);
}

/* ------------------------------------------------------------ attestations */

/**
 * SAME-KEY attestation: one private key, both signatures.
 * `createdAt` is injectable so tests are deterministic.
 */
export function createSameKeyAttestation(priv, createdAt = new Date()) {
  const id = deriveIdentity(priv);
  const statement = makeStatement(id.bchAddress, id.npub, createdAt);
  return {
    version: VERSION,
    mode: 'same-key',
    created: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    bchAddress: id.bchAddress,
    bchPubkeyCompressed: id.pubkeyCompressedHex,
    nostrPubkey: id.nostrPubkeyHex,
    npub: id.npub,
    statement,
    bchSignature: signBitcoinMessage(statement, priv),
    nostrSignature: signNostrStatement(statement, priv),
  };
}

/**
 * CROSS-KEY attestation: separate BCH + Nostr keys mutually sign the statement.
 */
export function createCrossKeyAttestation(bchPriv, nostrPriv, createdAt = new Date()) {
  const bch = deriveIdentity(bchPriv);
  const nostr = deriveIdentity(nostrPriv);
  const statement = makeStatement(bch.bchAddress, nostr.npub, createdAt);
  return {
    version: VERSION,
    mode: 'cross-key',
    created: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    bchAddress: bch.bchAddress,
    bchPubkeyCompressed: bch.pubkeyCompressedHex,
    nostrPubkey: nostr.nostrPubkeyHex,
    npub: nostr.npub,
    statement,
    bchSignature: signBitcoinMessage(statement, bchPriv),
    nostrSignature: signNostrStatement(statement, nostrPriv),
  };
}

/** Verify an attestation (either mode). Returns { ok, checks: [{name, pass, detail}] }. */
export function verifyAttestation(att) {
  const checks = [];
  const check = (name, pass, detail = '') => {
    checks.push({ name, pass: !!pass, detail });
    return !!pass;
  };
  try {
    // 1. cashaddr decodes, mainnet P2PKH
    let decoded;
    try {
      decoded = cashaddr.decode(att.bchAddress);
      check('BCH address is a valid bitcoincash P2PKH address',
        decoded.prefix === 'bitcoincash' && decoded.type === 'P2PKH',
        `${decoded.prefix}:${decoded.type}`);
    } catch (e) {
      check('BCH address is a valid bitcoincash P2PKH address', false, String(e.message));
      return { ok: false, checks };
    }
    // 2. compressed pubkey hashes to the address
    const compressed = hexToBytes(att.bchPubkeyCompressed);
    const h = hash160(compressed);
    check('BCH pubkey hashes to the claimed address',
      bytesToHex(h) === bytesToHex(decoded.hash),
      `hash160=${bytesToHex(h).slice(0, 16)}…`);
    // 3. npub decodes to the claimed Nostr pubkey
    let xOnly;
    try {
      xOnly = xOnlyFromNpub(att.npub);
      check('npub decodes to the claimed Nostr pubkey',
        bytesToHex(xOnly) === att.nostrPubkey.toLowerCase(),
        att.npub.slice(0, 16) + '…');
    } catch (e) {
      check('npub decodes to the claimed Nostr pubkey', false, String(e.message));
      return { ok: false, checks };
    }
    // 4. same-key: Nostr pubkey IS the x-coordinate of the BCH pubkey
    if (att.mode === 'same-key') {
      check('Nostr pubkey is the x-coordinate of the BCH pubkey (same key, two networks)',
        bytesToHex(xOnly) === bytesToHex(compressed.slice(1)));
    }
    // 5. BCH signature recovers to the BCH pubkey
    try {
      const rec = recoverBitcoinMessagePubkey(att.statement, att.bchSignature);
      check('BCH signature recovers to the claimed BCH pubkey',
        bytesToHex(rec.compressedPubkey) === att.bchPubkeyCompressed.toLowerCase(),
        `recovery=${rec.recovery}`);
    } catch (e) {
      check('BCH signature recovers to the claimed BCH pubkey', false, String(e.message));
    }
    // 6. Nostr Schnorr signature verifies
    try {
      const okSig = verifyNostrStatement(att.statement, att.nostrSignature, xOnly);
      check('Nostr Schnorr signature verifies over the statement', okSig);
    } catch (e) {
      check('Nostr Schnorr signature verifies over the statement', false, String(e.message));
    }
    // 7. statement binds both identifiers
    check('Statement names both the BCH address and the npub',
      att.statement.includes(att.bchAddress) && att.statement.includes(att.npub));
  } catch (e) {
    checks.push({ name: 'verification crashed', pass: false, detail: String(e && e.message) });
  }
  return { ok: checks.every((c) => c.pass), checks };
}

/* ------------------------------------------------------------ Nostr event */

/** Build a NIP-01 kind-1 event carrying the attestation, signed by the Nostr key. */
export function attestationToNostrEvent(att, priv, createdAtSec = Math.floor(Date.now() / 1000)) {
  const id = deriveIdentity(priv);
  const tags = [
    ['t', 'bchblaze'],
    ['t', 'bch-identity-link'],
    ['bch', att.bchAddress],
  ];
  const content = `${att.statement}\n\nBCH signature (Bitcoin message): ${att.bchSignature}\nNostr signature (Schnorr): ${att.nostrSignature}`;
  const event = {
    kind: 1,
    created_at: createdAtSec,
    tags,
    content,
    pubkey: id.nostrPubkeyHex,
  };
  const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
  const eventId = bytesToHex(sha256(utf8ToBytes(serialized)));
  const sig = bytesToHex(schnorr.sign(hexToBytes(eventId), priv));
  return { ...event, id: eventId, sig };
}

export function verifyNostrEvent(event) {
  const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
  const id = bytesToHex(sha256(utf8ToBytes(serialized)));
  if (id !== event.id) return { ok: false, reason: 'id mismatch' };
  const ok = schnorr.verify(hexToBytes(event.sig), hexToBytes(event.id), hexToBytes(event.pubkey));
  return { ok, reason: ok ? '' : 'bad schnorr signature' };
}
