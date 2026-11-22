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
