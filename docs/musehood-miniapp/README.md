# Musehood — Mini App (GitHub Pages)

Halaman statis Mini App Telegram untuk Musehood. Bot Telegram
(`@musehood_ai_bot`) adalah backend-nya: halaman ini hanya mengirim pesan
lewat `Telegram.WebApp.sendData`, balasan Muse muncul di chat Telegram.

- `index.html` — halaman Mini App (tanpa build step, tanpa token/key).
  Tampilan disamakan dengan aplikasi Musehood asli (Neo-Brutalism +
  Guild Chat): background Indigo #1e1b4b berpola titik, header kuning
  retro "MUSEHOOD" + pill "Pemilik: Malik" dan "Admin Muse • Hadir
  8/8", strip 7 kursi (avatar huruf + nama + peran, warna bubble
  masing-masing) di atas area chat, bubble Malik biru #3b82f6 rata
  kanan, semua kartu/bubble/button border 2.5px solid #000 +
  box-shadow 4px 4px 0 #000, font Space Grotesk + Inter.
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
  pesan kosong tidak dikirim.
- `TESTS.md` — hasil uji verifikasi initData sisi server + uji menu.

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
