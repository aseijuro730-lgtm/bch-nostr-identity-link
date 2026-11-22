# Uji Mini App Musehood — verify.py + web_app_data

Dijalankan 22 Nov 2026 ~15:22 WIB. Tidak ada token, initData lengkap,
atau rahasia lain di file ini — hanya kasus, harapan, hasil, dan exit code.
Semua uji dijalankan lokal tanpa pesan ke pengguna nyata.

## verify.py — `python3 scripts/telegram-bot/verify.py <initData>`

initData VALID dibuat di dalam proses uji: hash dihitung dari token `.env`
dengan rumus Telegram (secret = HMAC_SHA256(key "WebAppData", token);
hash = HMAC_SHA256(secret, data-check-string)). User contoh: id 123456789,
username "contoh", first_name "Contoh".

| # | Kasus | Harapan | Hasil | Exit |
|---|-------|---------|-------|------|
| 1 | initData valid (auth_date sekarang) | `ok:true`, user_id 123456789, username "contoh", first_name "Contoh" | PASS — `ok:true`, user_id 123456789 | 0 |
| 2 | initData tanpa hash | `ok:false`, error "hash hilang" | PASS — `ok:false` | 1 |
| 3 | Hash dipalsukan (1 karakter diubah) | `ok:false`, error "tidak cocok" | PASS — `ok:false` | 1 |
| 4 | auth_date 25 jam lalu (hash valid untuk auth_date itu) | `ok:false`, error "kedaluwarsa" | PASS — `ok:false` | 1 |
| 5 | user.id hilang | `ok:false`, error "user.id" | PASS — `ok:false` | 1 |
| 6 | Payload web_app_data contoh `{"initData": ..., "text": "Halo Muse"}` | JSON ter-parse, text "Halo Muse" terambil; initData-nya lolos verify | PASS — text terambil, verify `ok:true`, user_id 123456789 | 0 |

Tambahan (di luar tabel): tanpa argv → `ok:false` "hash hilang", exit 1.

**Ringkasan: 6/6 PASS.**

## index.html — pengecekan statis

- `grep` untuk `token|api-key|secret|TELEGRAM_BOT` di `miniapp-site/index.html`:
  hanya kena satu baris komentar "TIDAK ada token/key di sini" — tidak ada
  token/key di halaman.
- Halaman memanggil `Telegram.WebApp.ready()` + `expand()`, kirim via
  `sendData(JSON.stringify({initData, text}))`, batas 1000 karakter,
  pesan kosong tidak dikirim, dan bila dibuka di luar Telegram menampilkan
  "Buka lewat tombol Mini App di @musehood_ai_bot" dengan form tersembunyi.
- Belum diuji di browser Telegram nyata (butuh URL HTTPS publik + Menu Button).

## Menu gaya SATSET — uji perilaku lokal (22 Nov 2026 ~15:30 WIB)

Harness: `/tmp/test-miniapp-menu.js` (Node, DOM tiruan + stub
`Telegram.WebApp`, menjalankan `<script>` inline halaman apa adanya).
Perintah: `node /tmp/test-miniapp-menu.js`. Tidak ada pesan ke pengguna
nyata; tidak ada token/key di harness.

**Ringkasan: 27/27 PASS**, antara lain:

- `ready()` + `expand()` dipanggil; app tampil bila initData ada.
- Menu awalnya hidden; klik "☰ Menu" membuka (aria-expanded=true),
  klik lagi menutup; klik di luar menu menutup, klik di dalam tidak.
- Klik "Tugas: …" → kolom ketik `Tugas: `, menu tertutup, input fokus,
  counter `7 / 1000`.
- Awalan diganti bukan ditumpuk: `Tugas: hello` + klik @Opus →
  `@Opus hello`; "Ngobrol dengan Muse" → `hello` (awalan dibuang, teks
  bebas tetap ada).
- "Tanya Progres" → `Tanya Progres`; "Gambar: …" → `Gambar: `.
- Submit kosong tidak memanggil `sendData`; submit `Halo Muse` →
  `sendData` 1x dengan payload `{initData, text}` yang benar, bubble
  ditambahkan ke log, input dikosongkan, tombol Kirim disabled.
- Di luar Telegram (tanpa initData): kartu luar tampil, form tetap hidden.
- `grep` token/key di `index.html` baru: 0 kena; halaman memuat
  `telegram-web-app.js`; 10 item menu ditemukan.
- Catatan: dua kegagalan awal berasal dari harness-nya sendiri
  (elemen `hidden` tidak ikut ter-`stub`, `this` di listener), bukan dari
  halaman — keduanya diperbaiki di harness, halaman tidak diubah untuk itu.
- Belum diuji di browser Telegram nyata (butuh URL HTTPS publik + Menu
  Button, repo `musehood-miniapp` masih menunggu dibuat).

## Tampilan Musehood asli — uji perilaku lokal (22 Nov 2026 ~15:45 WIB)

Harness baru: `/tmp/test-miniapp-musehood.js` (Node, DOM tiruan + stub
`Telegram.WebApp`, menjalankan `<script>` inline halaman apa adanya).
Perintah: `node /tmp/test-miniapp-musehood.js`. Tidak ada pesan ke
pengguna nyata; tidak ada token/key di harness.

**Ringkasan: 43/43 PASS**, antara lain:

- Semua uji menu SATSET sebelumnya tetap lolos (menu buka/tutup,
  awalan Tugas:/Gambar:/Tanya Progres/@kursi, ganti awalan bukan
  menumpuk, submit kosong tidak memanggil `sendData`, payload
  `{initData, text}` benar, bubble lokal, luar Telegram).
- Strip kursi: 7 kursi terikat; klik kursi Opus → kolom ketik
  `@Opus `; klik kursi Muse membuang awalan; klik kursi Fable
  mengganti awalan (`Tugas: riset` → `@Fable riset`).
- Statis: background indigo #1e1b4b, header kuning #fde047, bubble
  Malik biru #3b82f6, ketujuh warna kursi (#bbf7d0, #fef08a, #fecaca,
  #bae6fd, #e9d5ff, #99f6e4, #fbcfe8), border 2.5px solid #000 +
  shadow 4px 4px 0 #000, pill "Pemilik: Malik" dan "Admin Muse •
  Hadir 8/8", catatan jujur "Yang membalas di sini: Muse", font
  Space Grotesk, peran ketujuh kursi tampil.
- `grep` token/key di `index.html` baru: 0 kena; halaman memuat
  `telegram-web-app.js`; 10 item menu + 7 chip kursi ditemukan.
- Catatan: dua kegagalan awal berasal dari harness-nya sendiri
  (input tidak di-reset sebelum uji "Tugas:" setelah uji kursi) —
  diperbaiki di harness, halaman tidak diubah untuk itu.
- Belum diuji di browser Telegram nyata (butuh URL HTTPS publik +
  Menu Button, yang sudah aktif dari penerbitan sebelumnya).

## Perapian tamu — uji perilaku lokal (22 Nov 2026 ~15:55 WIB)

Harness baru: `/tmp/test-miniapp-guest.js` (Node, DOM tiruan + stub
`Telegram.WebApp` + stub penangkap `setTimeout`, menjalankan `<script>`
inline halaman apa adanya). Perintah: `node /tmp/test-miniapp-guest.js`.
Tidak ada pesan ke pengguna nyata; tidak ada token/key di harness.

**Ringkasan: 66/66 PASS, 0 FAIL**, antara lain:

- Semua uji menu SATSET + tampilan Musehood sebelumnya tetap lolos
  (menu buka/tutup, awalan Tugas:/Gambar:/Tanya Progres/@kursi, ganti
  awalan bukan menumpuk, submit kosong tidak memanggil `sendData`,
  payload `{initData, text}` benar, bubble lokal, luar Telegram).
- Badge tamu: pill "Pemilik: Malik" sudah TIDAK ada; pill "Mode Tamu •
  15 pesan/hari" tampil; kartu info menyebut tamu tanpa akses ruang
  pribadi + balasan di chat Telegram @musehood_ai_bot dalam ~1 menit;
  pill "Admin Muse • Hadir 8/8" tetap ada.
- Feedback kirim: setelah submit, log menampilkan status hijau
  "Terkirim ke bot ✓ — balasan Muse muncul di chat Telegram
  @musehood_ai_bot (≤ ~1 menit)"; tombol Kirim disabled sesaat dengan
  label "Terkirim ✓"; timer re-enable 1500ms dijadwalkan; setelah timer
  berjalan tombol aktif lagi dan label kembali "Kirim".
- Layout HP 360px (cek CSS sistematis + aritmetika): body
  `overflow-x: hidden`, `.wrap` width 100%, `#text` `min-width: 0` +
  `flex: 1 1 auto`, tombol `flex-shrink: 0`, media query ≤420px ada
  (kursi 62px, MenuBtn padding 0 10px, Kirim padding 0 12px, h1 26px,
  body padding 10px); aritmetika 360px: konten 340px − MenuBtn ~73px −
  Kirim ~69px − gap 16px = sisa textarea 182px → baris composer muat;
  strip kursi total 482px > konten 340px → di-scroll horizontal
  internal (`overflow-x: auto`), halaman sendiri tidak bergeser;
  menu popup `min(320px, 100%)` muat; placeholder "Tulis pesan untuk
  Muse" ada.
- `grep` token/key/secret/`TELEGRAM_BOT_TOKEN` di `index.html` baru:
  0 kena; satu-satunya kata "token" adalah komentar penjelas "TIDAK ada
  token/key di sini" tanpa nilai.
- Belum diuji di browser Telegram nyata (butuh URL HTTPS publik +
  Menu Button, yang sudah aktif dari penerbitan sebelumnya).

## Quick chip + verifikasi isolasi backend (22 Nov 2026 ~16:00 WIB)

Harness: `/tmp/test-miniapp-guest.js` diperluas (chip). Perintah:
`node /tmp/test-miniapp-guest.js`. Tidak ada pesan ke pengguna nyata;
tidak ada token/key di harness.

**Ringkasan: 82/82 PASS, 0 FAIL** (sebelumnya 66/66), antara lain:

- Quick chip: 8 chip tampil; chip "Tugas: …"/"Gambar: …"/"Tanya Progres"
  mengisi/mengganti awalan seperti menu (teks bebas tetap ada); chip
  "Ngobrol dengan Muse" membuang awalan; keempat chip berat ("Buat
  Gambar", "Buat Video", "Buat Musik", "Coding App") TIDAK memanggil
  `sendData`, TIDAK mengubah input, dan menampilkan catatan kuning
  "Fitur '…' khusus pemilik — tamu hanya bisa ngobrol dengan Muse
  (kuota 15 pesan/hari)".
- Statis: `.chips` `overflow-x: auto`; frasa "khusus pemilik" muncul
  ≥5x (4 tag chip + kartu info); kartu info menyebut fitur berat khusus
  pemilik + "Sisa kuota harian tidak tampil di halaman ini".
- `grep` token/key/secret/`TELEGRAM_BOT_TOKEN` di `index.html` baru:
  0 kena.
- Catatan: satu kegagalan awal berasal dari ekspektasi harness (chip
  "Tanya Progres" atas teks "Tugas: riset" — halaman benar
  menghasilkan "Tanya Progres riset", teks bebas dipertahankan seperti
  menu) — diperbaiki di harness, halaman tidak diubah untuk itu.

### Verifikasi isolasi backend (baca kode + state + log, tanpa ubah arsitektur)

- Ruang tamu: `state/telegram-guest-room.json` — "Tamu Telegram",
  `room_id` 4, "hanya kursi Muse (model bawaan, tanpa gateway owner) …
  BUKAN ruang pribadi; guest tidak pernah masuk ke ruang 1/2/3".
- Routing (README jembatan + `logs/telegram-2026-11-22.md`): tamu
  dipisah dari owner lewat `from.id == OWNER_TELEGRAM_ID`; tamu hanya
  kursi Muse di ruang 4, provider "Muse Bawaan", source "muse". Uji
  tercatat 22 Nov: balasan uji ke room 4 (id 89, latency 5660ms) TANPA
  gateway owner; ruang 1/2/3 tidak berubah (51/0/36); 3 slot gateway +
  ruang 1/2/3 utuh.
- Kuota: `quota.py` — 15 pesan/hari per `telegram_user_id`, tanggal WIB,
  state `state/telegram-quota.json` (saat dicek: `{}`, belum ada pemakaian
  hari ini). `quota.py check 999888777` (id dummy, tanpa mengubah state):
  `count 0, remaining 15, allowed true, limit 15`. Log tercatat: initData
  asli diterima (kuota 15 → 14), initData palsu/kedaluwarsa ditolak,
  pesan ke-16 ditolak kuota habis — penegakan + pesan jelas lewat balasan
  bot di chat Telegram.
- Token/key: `TELEGRAM_BOT_TOKEN` hanya dibaca dari `.env` (0600) di
  `poll.py`/`send.py`/`menu.py`/`verify.py` — tidak pernah dicetak;
  tidak ada token/key di berkas statis (grep 0 kena).
- Sisa kuota LIVE tidak bisa tampil dari halaman statis: tidak ada
  endpoint HTTP di jembatan (`grep http.server|Flask|FastAPI|uvicorn`
  di `scripts/`/`state/`: 0 kena) — satu-satunya jalur data adalah
  `sendData` → Bot API → cron worker di VM. Menampilkan sisa kuota
  butuh endpoint backend baru + otentikasi per pengguna — TIDAK dibangun
  (di luar perintah: jangan ubah arsitektur yang sudah berjalan).
  Batasan ini ditulis jujur di halaman (kartu info) dan di README.
- Belum diuji di browser Telegram nyata (butuh URL HTTPS publik +
  Menu Button, yang sudah aktif dari penerbitan sebelumnya).
