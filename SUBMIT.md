# SUBMIT — exact steps for Tuan Arthur (do these yourself)

Deadline: **Sunday 22 Nov 2026, 21:00 WIB** (14:00 UTC). Do the hosting first —
everything else is 30 minutes.

## 0. What you need (all free, $0)
- A GitHub account (you have one: `aseijuro730-lgtm`)
- A Google account (for the slides copy)
- A BCH wallet that can receive PUSD (prize is paid in PUSD on BCH mainnet):
  install **Paytaca** (paytaca.com) on your phone, back up the seed, copy your BCH
  address. No funds needed — only an address to receive the prize.

## 1. Host the demo (GitHub Pages, ~10 min)
1. GitHub → New repository → name `bch-nostr-identity-link` → Public → Create.
2. Upload the whole `identity-link/` folder contents (drag-and-drop on the repo page,
   or `git push` if you prefer CLI).
3. In the repo, create a folder `docs/` and move into it the three files from
   `public/`: `index.html`, `app.js`, `styles.css`. (GitHub web UI: open each file →
   `...` → Move, or re-upload them into `docs/`.)
4. Repo → Settings → Pages → Build and deployment → Source: **Deploy from a branch**
   → Branch: `main`, Folder: **/docs** → Save.
5. Wait ~1 min. Demo URL: `https://aseijuro730-lgtm.github.io/bch-nostr-identity-link/`
   — open it, click Generate → Sign → Verify, confirm the green verdict.

## 2. Make the presentation (~15 min)
1. Open the Widget Factory template:
   https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?usp=sharing
2. File → Make a copy. Paste the slide text from `PITCH.md` (7 slides).
3. Add one screenshot of the demo’s green “LINK VERIFIED” verdict (slide 5).
4. File → Share → “Anyone with the link can view” → copy the link.

## 3. Register + submit on DoraHacks (~10 min)
1. Go to https://dorahacks.io/hackathon/bchblaze2026/detail — click **Log in** (create
   a free DoraHacks account if needed), then click **Register** on the hackathon.
2. Click **Submit Build** → create a BUIDL:
   - Name: `BCH × Nostr Identity Link`
   - Description: one key derives a BCH address and a Nostr pubkey; both keys
     mutually sign the link; anyone can verify it offline. (Full text in README.md.)
   - Demo URL: your GitHub Pages URL from step 1.
   - Repo URL: your GitHub repo URL.
   - Presentation: your Google Slides link from step 2.
   - Track/bounty: select the **Decentralized Identity bounty (Paytaca, $500 PUSD)**.
     If the form has no bounty picker, write “Paytaca Decentralized Identity bounty”
     at the top of the description.
   - Donation/receiving address: paste your **Paytaca BCH address** (from step 0).
     This is also the address the prize would be paid to.
3. Submit before 22 Nov 21:00 WIB.

## 4. Confirm you’re real in Telegram (~2 min)
Join https://t.me/bchblaze and post:
`BCH × Nostr Identity Link — solo builder, demo: <Pages URL>, repo: <GitHub URL>.
Paytaca Decentralized Identity bounty.`
(This is a Mainnet/Media-track requirement, but it also proves the bounty entry is
real. Keep the message.)

## 5. Optional — Nostr proof (2 min, after the demo is live)
Open the demo → Generate (fresh key — do NOT reuse a real wallet key) → Sign →
Publish to relays. Paste the published event id in the Telegram message too.

## Notes
- **No BCH funds are needed** to build, demo, verify or submit. Only the prize
  payout needs your Paytaca address.
- **Do NOT paste your real Paytaca seed or any real wallet private key into the demo.**
  The demo is for fresh keys or throwaway imports.
- Registration closed formally on 13 Nov, but DoraHacks still shows a live Register
  button and the organisers state late joiners CAN still compete (low-priority queue
  for Mainnet/Media tracks). Bounties are sponsor-judged on qualifying requirements,
  so the queue should not block this bounty — but register ASAP, and if the Register
  button ever refuses, post in the Telegram group and ask to join an existing team.
