# Lapor.in

Platform pelaporan dan aspirasi warga yang inklusif: warga cukup menekan satu tombol mikrofon, bercerita dengan bahasanya sendiri, dan AI menyusunnya menjadi laporan yang rapi.

- **Tema:** AI for Access and Digital Life
- **Tim:** Minimize
- **Demo:** `ISI ALAMAT VERCEL DI SINI`

## Masalah yang diselesaikan

Di tingkat RT/RW, kelurahan, atau desa, melaporkan jalan rusak atau lampu mati masih sulit bagi banyak warga:

- **Formulir digital panjang** menyulitkan lansia, penyandang disabilitas netra, dan warga dengan gangguan bicara.
- **Bahasa daerah.** Warga yang sehari-hari berbahasa daerah (misalnya bahasa Minang) ragu menulis laporan dalam bahasa Indonesia formal.
- **Takut identitas terbuka** saat melaporkan masalah keamanan atau ketertiban.
- **Biaya.** Solusi tingkat komunitas harus bisa berjalan tanpa biaya operasional.

## Cara kerja

1. **Warga bercerita.** Tekan tombol mikrofon dan bicara (maksimal 120 detik), atau ketik laporan secara manual. Tanpa daftar akun, tanpa login.
2. **AI menyusun laporan.** Gemini mengabaikan suara bising, merapikan ucapan yang terbata-bata, menerjemahkan bahasa daerah ke bahasa Indonesia baku, lalu mengisi judul, kategori, tingkat urgensi, dan ringkasan.
3. **Warga memeriksa dan melengkapi.** Draf tampil sebagai kartu di halaman chat. Warga bisa mengoreksinya lewat percakapan atau langsung di kartu, menentukan lokasi (GPS atau pin di peta), dan menambah foto.
4. **Laporan dikirim.** Warga mendapat kode tiket. Admin memverifikasi laporan, dan laporan yang lolos tampil di peta publik.

## Fitur

### Untuk warga
- Lapor lewat suara atau ketikan, dengan asisten AI yang bisa diajak mengoreksi draf.
- Balasan asisten bisa dibacakan (text-to-speech), dengan tombol untuk mematikannya.
- Lokasi dari GPS perangkat atau dipilih di peta; alamat diisi otomatis.
- Foto bukti opsional, dikompresi di perangkat warga sebelum dikirim.
- Selalu ada jalan keluar saat sesuatu gagal: mikrofon ditolak, AI sibuk, rekaman tidak jelas, atau GPS ditolak, warga tetap bisa melanjutkan dengan mengetik, mengisi manual, atau memilih lokasi di peta.

### Untuk admin
- Antrean verifikasi yang diurutkan dari laporan paling mendesak.
- Detail laporan lengkap: transkrip asli, foto, dan rekaman suara warga untuk dicek silang dengan hasil AI.
- Koreksi isi laporan, verifikasi dan publikasi, tolak dengan alasan, ubah status penanganan, dan hapus.
- Pencarian, filter, statistik ringkas, dan peta sebaran semua laporan.

### Peta publik
- Sebaran laporan yang sudah diverifikasi, dengan pengelompokan pin.
- Pencarian dan filter berdasarkan kategori, urgensi, dan status penanganan.
- Detail laporan beserta foto, tanpa data pribadi pelapor.

## Aksesibilitas dan privasi

- **Suara lebih dulu.** Tombol mikrofon besar menjadi pusat halaman utama; mengetik adalah pilihan kedua.
- **Kontras tinggi.** Palet hitam, merah, dan putih, dengan ukuran teks yang ramah lansia.
- **Tanpa akun.** Warga memakai sesi anonim yang dibuat otomatis di latar belakang.
- **Data pribadi dipisah.** Identitas sesi pelapor, transkrip asli, dan catatan admin disimpan di koleksi terpisah yang hanya bisa dibaca admin.
- **Foto tanpa metadata.** Informasi lokasi dan perangkat (EXIF) dihapus sebelum foto disimpan.
- **Rekaman suara hanya untuk admin** dan dihapus otomatis setelah 30 hari.

## Teknologi

Seluruh layanan berjalan di paket gratis.

| Bagian | Teknologi |
|---|---|
| Antarmuka | React 19, Vite 8, Tailwind CSS 4, React Router 7, lucide-react |
| Peta | Leaflet, react-leaflet, leaflet.markercluster, OpenStreetMap |
| Autentikasi dan data | Firebase Authentication (anonim dan email admin), Cloud Firestore |
| Server | Vercel Serverless Functions (Node.js) |
| AI | Gemini 3.5 Flash lewat `@google/genai` |
| Alamat dari koordinat | OpenStreetMap Nominatim, dengan cache di Firestore |

Beberapa keputusan teknis:

- **Kunci AI tidak pernah sampai ke browser.** Browser hanya memanggil `/api/*`; server yang berbicara dengan Gemini.
- **Hemat kuota AI.** Keluaran AI dikunci dengan skema JSON, riwayat percakapan yang dikirim dibatasi empat pesan terakhir, dan tombol seperti GPS, foto, serta kirim laporan tidak memanggil AI sama sekali.
- **Perlindungan dari penyalahgunaan.** Setiap permintaan AI harus membawa tanda pengenal sesi Firebase, dan tiap pengguna dibatasi jumlah permintaannya per jam.
- **Foto dan rekaman disimpan di Firestore**, sehingga tidak membutuhkan layanan penyimpanan berbayar.

## Menjalankan di komputer sendiri

Butuh Node.js 20.19 ke atas (atau 22.12 ke atas) dan sebuah project Firebase dengan Authentication (Anonymous dan Email/Password) serta Firestore aktif.

```bash
# 1. Pasang dependency
npm install

# 2. Buat .env.local dari contoh, lalu isi nilainya
cp .env.example .env.local

# 3. Jalankan server endpoint /api (port 3001)
node dev-api.mjs

# 4. Di terminal lain, jalankan aplikasi
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya `http://localhost:5173`).

Hal lain yang berguna:

- **Mencoba tanpa kunci Gemini.** Isi `VITE_USE_MOCK_API=true` di `.env.local`, lalu cukup jalankan `npm run dev`. Asisten membalas dengan data contoh.
- **Mengisi data contoh.** `node scripts/seed-demo-data.mjs` membuat 15 laporan contoh; tambahkan `--hapus` untuk menghapusnya.
- **Aturan Firestore.** Salin isi `firestore.rules` ke Firebase Console, bagian Firestore Rules.
- **Akun admin.** Dibuat di Firebase Console dan diberi klaim `admin: true`. Tidak ada pendaftaran publik.
- **Memeriksa kode.** `npm run lint` dan `npm run build`.

## Environment variable

Nilainya tidak disimpan di repositori. Daftar lengkap beserta keterangannya ada di `.env.example`.

| Variabel | Dipakai di | Keterangan |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Browser | Konfigurasi Firebase |
| `VITE_USE_MOCK_API` | Browser | `true` untuk mode contoh saat development |
| `GEMINI_API_KEY` | Server | Kunci Gemini |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server | Kunci service account Firebase, satu baris |
| `OSM_CONTACT_EMAIL` | Server | Email kontak yang diwajibkan Nominatim |
| `CRON_SECRET` | Server | Pengaman endpoint penghapus rekaman |
| `AI_REPORT_LIMIT_PER_HOUR`, `AI_CHAT_LIMIT_PER_HOUR` | Server | Opsional; batas permintaan AI per pengguna per jam (bawaan 20 dan 60) |

## Struktur folder

```
api/                  Endpoint server: process-report, chat-assistant, reverse-geocode, cleanup-audio
public/locales/       Teks antarmuka (id.json)
scripts/              Skrip data contoh
src/
  components/         Komponen per bagian: common, home, chat, map, admin
  config/             Konstanta dan konfigurasi Firebase
  context/            Penyedia state global (bahasa, draf laporan)
  hooks/              Custom hooks
  pages/              Satu file per halaman
  services/           Satu-satunya pintu ke Firestore dan /api
  utils/              Fungsi bantu (kompresi foto, kode tiket, geohash)
firestore.rules       Aturan keamanan Firestore
```

Halaman dan komponen tidak pernah memanggil Firestore atau `/api` secara langsung; semuanya lewat `src/services/`.

## Halaman

| Alamat | Isi |
|---|---|
| `/` | Halaman utama dengan tombol mikrofon |
| `/chat` | Percakapan dengan asisten dan kartu draf laporan |
| `/peta` | Peta publik laporan terverifikasi |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin |

## Tim Minimize

| Anggota | Bagian |
|---|---|
| Fikri | Project lead, fondasi aplikasi, Firebase, service layer, aturan keamanan |
| Irfan | Halaman utama, perekam suara, pembaca balasan, navigasi |
| Nugi | Halaman chat, endpoint AI, kompresi foto |
| Zikri | Peta publik, geolokasi, endpoint alamat dan penghapus rekaman |
| Taqi | Login dan dashboard admin |

Dokumen perancangan lengkap ada di `PRD.md`.
