# BCH × Nostr Identity Link

**One key. Two networks.** Cryptographically link a Bitcoin Cash address to a Nostr
identity — verifiable by anyone, with zero on-chain fees and zero servers.

Built for **BCH BLAZE 2026** (DoraHacks) — Paytaca bounty: *“Build a proof of concept for
self-sovereign identity that cryptographically links Bitcoin Cash and Nostr identities.”*
Prize: **$500 PUSD**.

Live demo: *(GitHub Pages URL — set at submission time, see SUBMIT.md)*
Bounty board: https://bchblaze.cash/bounties/ · Hackathon: https://dorahacks.io/hackathon/bchblaze2026/detail

## The idea

Bitcoin Cash and Nostr both use the **secp256k1** curve. One private key therefore
derives *both* identities:

- **BCH address** — compressed pubkey → HASH160 → cashaddr (`bitcoincash:q…`)
- **Nostr pubkey** — the x-only BIP340 pubkey (`npub1…`)

The x-coordinate is identical. The link is provable from public data alone — no
registry, no platform, no transaction.

On top of that, both keys **mutually sign the same statement**:

- BCH side: standard **Bitcoin signed-message** (double-SHA256, ECDSA, recoverable —
  verifiable in Electron Cash / Paytaca via “verify message”).
- Nostr side: **BIP340 Schnorr** signature (NIP-01 style), plus an optional signed
  kind-1 Nostr event published to public relays.

Already have a BCH address *and* a Nostr account on different keys? **Cross-key mode**
imports both (WIF + nsec) and they mutually attest each other instead.

## Try it

Open the live demo, or run locally — it is a static site, no backend:

```bash
npm install
npm run build   # bundles src/app.js -> public/app.js
npm run serve   # http://localhost:8080
```

1. **Generate** a fresh identity (or import an `nsec` / WIF).
2. **Sign** the link — both signatures are created in your browser.
3. **Verify** — paste any attestation JSON; 7 checks run as pure offline math.
4. **Publish** (optional) — broadcast the signed Nostr event to public relays.

Keys never leave the browser. No funds are involved at any step.

## Verification checklist (what the verifier proves)

1. BCH address is a valid mainnet P2PKH cashaddr
2. BCH pubkey hashes to the claimed address
3. `npub` decodes to the claimed Nostr pubkey
4. (same-key) Nostr pubkey is the x-coordinate of the BCH pubkey
5. BCH signature recovers to the claimed BCH pubkey
6. Nostr Schnorr signature verifies over the statement
7. Statement names both the BCH address and the npub

## Tests

```bash
npm test
```

- `test/core.test.mjs` — 17 tests: textbook secp256k1 vector (privkey `1` →
  generator point, HASH160 `751e76e8…`, cashaddr round-trip), attestation
  round-trips, tamper tests (statement / both signatures / swapped address),
  cross-key mode, NIP-01 event id + signature.
- `test/ui.smoke.mjs` — headless jsdom run of the full UI flow: generate → sign →
  verify green → tamper → red → fresh sample → nsec import.
- The BCH message signature was **independently verified in Python** (`ecdsa`
  lib): the (r, s) pair verifies against the claimed pubkey under an
  independently recomputed Bitcoin-message hash, and recovery id 0 reproduces
  the claimed pubkey. It is a standard, wallet-interoperable signature.

## Stack

- `@noble/curves` + `@noble/hashes` (secp256k1 ECDSA/Schnorr, SHA-256, RIPEMD-160)
- `@scure/base` (bech32 `npub`/`nsec`, base58 WIF, base64 signatures)
- `cashaddrjs` (cashaddr encode/decode)
- esbuild bundle, vanilla HTML/CSS/JS, no framework, no backend

## Why this matters

Paytaca, BCHNostr and the BCH creator economy need Sybil-resistant, portable
identity: tips, reputation and social graphs that survive any single app dying.
A cryptographic BCH↔Nostr link is the primitive that makes “I am the same person
here and there” trustless — the same key that receives your tips *is* the key that
posts your notes.

## License

MIT
