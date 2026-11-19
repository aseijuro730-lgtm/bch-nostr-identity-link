# BCH × Nostr Identity Link — presentation content

Copy these slides into the BCH Blaze **Widget Factory** template:
https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?usp=sharing
(Make a copy → paste → File → Share → “Anyone with the link can view” → paste that
link into the DoraHacks BUIDL form.)

## Slide 1 — Title
**BCH × Nostr Identity Link — one key, two networks**
Paytaca Decentralized Identity bounty · BCH BLAZE 2026
Live demo: <Pages URL> · Code: <GitHub repo URL>

## Slide 2 — Problem
BCH tips and Nostr posts live in separate worlds. A creator can receive BCH tips and
post on Nostr, but nobody can prove the tip jar and the account belong to the same
person — so reputation, tips and social graphs are locked inside single apps, and
Sybil accounts are free. Identity today is a username on someone else’s server.

## Slide 3 — Insight
Bitcoin Cash and Nostr both use the **secp256k1** curve. One private key already
derives both identities: a BCH address (compressed pubkey → HASH160 → cashaddr) and a
Nostr pubkey (the x-only BIP340 pubkey). The x-coordinate is identical — the link is
provable from public data alone. No registry, no platform, no transaction.

## Slide 4 — Solution
A static web app that (1) generates or imports a key, (2) has both sides sign the
same statement — BCH as a standard Bitcoin signed-message (ECDSA, recoverable,
verifiable in any BCH wallet), Nostr as a BIP340 Schnorr signature — (3) lets anyone
verify the link with 7 offline checks, and (4) optionally publishes it as a signed
Nostr event to public relays. Cross-key mode links pre-existing BCH + Nostr accounts.

## Slide 5 — Demo (screenshot / live link)
Generate → Sign → Verify (7/7 green) → Publish. Screenshot the demo’s green
“LINK VERIFIED” verdict. Live demo link on this slide, clickable.

## Slide 6 — Why it’s real (verification)
- Textbook vector: privkey `1` → generator point, HASH160 `751e76e8…`, cashaddr round-trip.
- 17 core tests + headless UI smoke test (generate → sign → verify → tamper → red).
- BCH signature independently verified in Python (`ecdsa` lib): (r, s) verifies under
  an independently recomputed Bitcoin-message hash; recovery id reproduces the pubkey.
  It is a standard, wallet-interoperable signature.
- Zero cost: no transaction, no gas, no server, keys never leave the browser.

## Slide 7 — Why it matters / what’s next
Primitive for Paytaca + BCHNostr: portable, Sybil-resistant identity for tips,
reputation and creator payouts that survive any single app. Next: Nostr relay
directory of verified links, Paytaca wallet “verify message” one-tap flow, CashTokens
gated communities for verified BCH↔Nostr accounts.
Bounty: Paytaca Decentralized Identity ($500 PUSD).
