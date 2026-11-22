# Musehood — Mini App (GitHub Pages)

Halaman statis Mini App Telegram untuk Musehood. Bot Telegram
(`@musehood_ai_bot`) adalah backend-nya: halaman ini hanya mengirim pesan
lewat `Telegram.WebApp.sendData`, balasan Muse muncul di chat Telegram.

- `index.html` — halaman Mini App (tanpa build step, tanpa token/key).
  Tampilan disamakan dengan aplikasi Musehood asli (Neo-Brutalism +
  Guild Chat): background Indigo #1e1b4b berpola titik, header kuning
  retro "MUSEHOOD" + pill "Mode Tamu • 15 pesan/hari" dan "Admin Muse •
  Hadir 8/8", strip 7 kursi (avatar huruf + nama + peran, warna bubble
  masing-masing) di atas area chat, bubble Malik biru #3b82f6 rata
  kanan, semua kartu/bubble/button border 2.5px solid #000 +
  box-shadow 4px 4px 0 #000, font Space Grotesk + Inter.
  Halaman ini KHUSUS TAMU: badge "Pemilik: Malik" sudah diganti
  indikator Mode Tamu + kuota 15 pesan/hari, dan kartu info menjelaskan
  tamu tanpa akses ruang pribadi serta balasan Muse muncul di chat
  Telegram @musehood_ai_bot (biasanya ~1 menit, bukan di halaman ini).
  Responsif HP: `overflow-x: hidden` di body, `.wrap` width 100%,
  kolom ketik `min-width: 0` + tombol `flex-shrink: 0` agar baris
  Menu/input/Kirim tidak meluber, dan media query ≤420px memperkecil
  padding, h1 26px, kursi 62px, dan padding tombol — diuji muat di
  lebar 360px (sisa textarea ~182px); strip kursi di-scroll horizontal
  secara internal (roster), halaman sendiri tidak bergeser.
  Jujur: halaman statis TIDAK bisa menampilkan percakapan live 7
  kursi — strip kursi hanya roster kehadiran (catatan "Yang membalas
  di sini: Muse"), ketuk kursi mengisi awalan @NamaKursi, pesan
  terkirim tampil sebagai bubble Malik lokal, dan balasan Muse tetap
  masuk ke chat Telegram. SATU tombol biru "☰ Menu" di samping kolom
  ketik; sekali ketuk, muncul popup menu ringkas (bukan grid besar)
  berisi: "Ngobrol dengan Muse", "Tugas: …", "Gambar: …",
  "Tanya Progres", plus kursi @Opus, @Plamo, @GLM, @Argon, @Deepseek,
  @Fable. Ketuk aksi → awalannya terisi di kolom ketik (awalan lama
  diganti, bukan ditumpuk) dan kolom ketik langsung fokus; "Ngobrol
  dengan Muse" hanya membuang awalan. Ketuk di luar menu menutupnya.
  Kirim tetap via `sendData(JSON {initData, text})`, maks 1000 karakter,
  pesan kosong tidak dikirim; setelah kirim tampil status hijau
  "Terkirim ke bot ✓ — balasan Muse muncul di chat Telegram
  @musehood_ai_bot (≤ ~1 menit)", tombol Kirim nonaktif sesaat
  (label "Terkirim ✓") lalu aktif lagi setelah 1,5 detik.
  Di atas kolom ketik ada baris quick chip (scroll horizontal di HP):
  "Ngobrol dengan Muse", "Tugas: …", "Gambar: …", "Tanya Progres"
  (sama seperti aksi menu/kursi — mengisi awalan, belum mengirim),
  plus "Buat Gambar", "Buat Video", "Buat Musik", "Coding App" yang
  bertanda "khusus pemilik" — diketuk hanya menampilkan penjelasan
  bahwa fitur itu khusus pemilik dan tamu hanya bisa ngobrol dengan
  Muse (kuota 15 pesan/hari); TIDAK mengirim perintah apa pun.
  Sisa kuota harian TIDAK bisa tampil dari halaman statis ini (tidak
  ada endpoint backend); penegakan kuota + pesan jelas saat kuota habis
  lewat balasan bot di chat Telegram (`quota.py` + routing cron worker).
- `TESTS.md` — hasil uji verifikasi initData sisi server + uji menu +
  uji perapian tamu (harness Node, DOM tiruan + stub Telegram.WebApp)
  + uji quick chip + verifikasi isolasi backend.

## Jalur hosting / endpoint

- Halaman statis: GitHub Pages, repo `aseijuro730-lgtm/bch-nostr-identity-link`,
  branch `main`, folder `docs/musehood-miniapp/` → URL
  `https://aseijuro730-lgtm.github.io/bch-nostr-identity-link/musehood-miniapp/`.
  Tidak ada server/endpoint di balik halaman ini.
- Backend bot: VM ini — cron `musehood-telegram-bot-poll` tiap 1 menit
  (`poll.py` getUpdates → `state/telegram-inbox/`), cron worker memproses
  inbox: `web_app_data` → parse JSON `{initData, text}` → `verify.py`
  (HMAC server-side) → cek kuota (`quota.py`, 15/hari per tanggal WIB)
  → teruskan ke ruang tamu id 4, kursi Muse (model bawaan, BUKAN gateway
  owner) → balasan dikirim ke chat Telegram via `send.py`. Token bot
  HANYA di `~/workspace/musehood-bridge/.env` (0600); tidak ada token/key
  di berkas statis/repo. Tamu TIDAK PERNAH masuk ruang 1/2/3.

## Cara pakai

1. Folder ini diterbitkan sebagai subfolder `docs/musehood-miniapp/`
   di repo `aseijuro730-lgtm/bch-nostr-identity-link`, yang GitHub
   Pages-nya di-deploy dari branch `main`, folder `/docs`.
2. URL jadinya: `https://aseijuro730-lgtm.github.io/bch-nostr-identity-link/musehood-miniapp/`
3. URL itu didaftarkan sebagai Menu Button bot lewat
   `python3 scripts/telegram-bot/menu.py set <url>` di
   `~/workspace/musehood-bridge/`.

## Catatan keamanan

- TIDAK ada token bot atau API key di repo ini — verifikasi identitas
  (`initData` HMAC) dilakukan sisi server oleh
  `scripts/telegram-bot/verify.py` di mesin jembatan.
- Halaman hanya mode tamu/umum: tanpa ruang pribadi, tanpa kunci pemilik.
