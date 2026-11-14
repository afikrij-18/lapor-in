# Perbedaan PRD Awal dan PRD Terakhir

- **PRD awal:** `PRD - laporin.pdf` (21 halaman)
- **PRD terakhir:** `PRD.md`, revisi 13 dan 14 November 2026
- **Dokumen ini:** ringkasan perbedaan saja. Jika ada selisih dengan `PRD.md`, yang berlaku adalah `PRD.md`.

## Ringkasan

Fitur dan alur utama produk tidak berubah: warga melapor lewat suara atau ketikan, dipandu asisten AI di halaman chat, lalu admin tunggal memverifikasi dan laporan tampil di peta publik. Yang berubah ada di lima kelompok:

1. Cara kerja tim dan pemilik beberapa file.
2. Teknologi: model Gemini, SDK, Tailwind, dan daftar library.
3. Aturan rekaman suara dan penyimpanan audio.
4. Privasi: data pelapor dipisah dari data publik.
5. Kontrak baru: alur gagal, format error, dan nama fungsi service.

## 1. Tim dan Cara Kerja

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Cara menulis kode | Seluruh kode ditulis manual oleh kelima anggota, tanpa AI code-agent | Fikri memakai Claude Code dan bertindak sebagai project manager; cara kerja empat anggota lain belum diputuskan. Apa pun alatnya, kontrak di PRD wajib diikuti | 1.3 |
| Status Dokumen | "Disusun untuk pengembangan kode manual oleh tim tanpa ketergantungan AI code-agent" | "Baseline Blueprint (cara kerja tim: lihat bagian 1.3)" | Kepala dokumen |
| File tanpa pemilik | `apiClient.js`, `App.jsx`, `main.jsx`, `index.css`, `Footer.jsx`, `firebase.json`, `vercel.json`, `package.json`, `.env.example`, `.eslintrc.cjs` tidak tercantum di matriks tugas | Semuanya menjadi tanggung jawab Fikri, termasuk scaffold project | 9.2 |
| Tugas bahasa (Fikri) | `public/locales/*` dan fitur toggle bahasa `ID/EN` | `public/locales/id.json` saja | 9.2 |

Pembagian tugas anggota lain (Irfan, Nugi, Zikri, Taqi) sama dengan PRD awal.

## 2. Teknologi dan Library

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Model AI | Gemini 2.0 Flash (`gemini-2.0-flash`) | Gemini 2.5 Flash (`gemini-2.5-flash`), tier gratis | 4.1, 7.2, 8.2 |
| SDK Gemini | `@google/generative-ai` `^0.21.0` | `@google/genai` `^3.3` | 7.2 |
| API key Gemini | Satu `GEMINI_API_KEY` | Dua key dengan nama variabel yang sama: satu untuk development, satu khusus demo (Production) | 7.4 |
| Tailwind CSS | `^4.14` (versi ini tidak ada), dikonfigurasi lewat `tailwind.config.js` | `^4.3`, dikonfigurasi lewat CSS; `tailwind.config.js` dihapus dari struktur folder | 7.1, 7.2 |
| Build tool | Tidak tercantum | `vite` `^8.3`, `@vitejs/plugin-react` `^6.3`, `@tailwindcss/vite` `^4.3` | 7.2 |
| Versi Node.js | Tidak disebut | `^20.19.0` atau `>=22.12.0` (syarat Vite 8) | 7.2 |
| `CRON_SECRET` | Tertulis lepas di akhir dokumen | Masuk daftar environment | 7.4 |
| React | `react`, `react-dom` `^18.3.1` | `^19.3` | 7.2 |
| Routing | `react-router-dom` `^6.28.0` | `^7.18` | 7.2 |
| Ikon | `lucide-react` `^0.454.0` | `^1.72` | 7.2 |
| Firebase (browser) | `firebase` `^11.0.1` | `^13.3` | 7.2 |
| Firebase (server) | `firebase-admin` `^12.7.0` | `^14.5` | 7.2 |
| Peta | `react-leaflet` `^4.2.1` (hanya mendukung React 18); `leaflet.markercluster` `^1.9.4` (versi ini tidak ada) | `react-leaflet` `^5.0`; `leaflet.markercluster` `^1.5.3` | 7.2 |
| Geohash | `ngeohash` `^0.6.3` | `^0.6.4` | 7.2 |
| Anti-bot | `@marsidev/react-turnstile` `^0.9.1` | `^1.6.3` | 7.2 |
| Linting | File `.eslintrc.cjs`; package `eslint` tidak tercantum | File `eslint.config.js`; `eslint` `^10.14` beserta pluginnya masuk daftar | 7.1, 7.2 |
| Sumber versi | Tabel di PRD | `package.json` dan `package-lock.json` di repository; tabel PRD mengikutinya | 7.2 |

## 3. Bahasa Antarmuka

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Bahasa | Indonesia dan Inggris, dengan toggle `ID \| EN` di header | Indonesia saja. Bahasa Inggris dikerjakan di akhir project apabila masih ada waktu | 2.2 |
| Wireframe | Ada `[ID \| EN]` di header homepage dan peta publik | Dihapus | 6.1, 6.3 |
| `en.json` | Wajib | Opsional | 7.1 |

## 4. Rekaman Suara dan Audio

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Durasi rekaman | Tidak dibatasi | Maksimal 120 detik; perekaman berhenti otomatis | 3, 4.1, 7.3 |
| Alasan bitrate 24 kbps | Menghemat token Gemini hingga 65% | Agar unggahan cepat di jaringan lemah. Token audio dihitung dari durasi, sehingga penghematan token berasal dari batas 120 detik | 4.1, 4.2 |
| Nasib rekaman setelah laporan dikirim | Dihapus, atau ditandai untuk dibersihkan cron | Disimpan 30 hari di folder `report_audio/`, hanya bisa didengar admin | 3, 8.3 |
| Waktu unggah rekaman | Tidak dijelaskan | Saat "Kirim Laporan". Laporan yang dibatalkan tidak meninggalkan rekaman | 3 |
| Pemberitahuan ke warga | Tidak ada | Kalimat di homepage: rekaman disimpan maksimal 30 hari untuk verifikasi admin | 3, 6.1 |
| Dashboard admin | Admin membandingkan ringkasan, transkrip, foto, dan lokasi | Ditambah tombol "Putar Rekaman" | 5.1, 6.4 |
| `cleanup-audio` | Membersihkan file sementara di Storage | Menghapus rekaman berumur lebih dari 30 hari dan mengosongkan `audioPath` | 8.2 |

## 5. Privasi dan Keamanan Data

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Data privat laporan | `reporterUid`, `rawTranscript`, dan `adminNotes` berada di dokumen `reports`, yang terbaca publik setelah diverifikasi | Dipindah ke koleksi baru `report_private` yang hanya bisa dibaca admin, bersama `audioPath` | 8.1, 8.3 |
| Jumlah koleksi Firestore | Tiga: `reports`, `geocode_cache`, `rate_limits` | Empat: ditambah `report_private` | 8.1 |
| Metadata foto | Tidak diatur | Dibuang oleh `imageCompressor.js` sebelum diunggah | 7.1, 8.3 |
| Folder Storage | Satu folder `reports/` untuk foto dan audio; setiap pengguna terautentikasi bisa menulis ke mana saja di folder itu | Foto di `reports/{uid}/` (terbaca publik) dan audio di `report_audio/{uid}/` (khusus admin); pengguna hanya bisa mengunggah ke folder miliknya | 8.3 |
| Hapus laporan oleh admin | Dokumen laporan dan lampiran media | Ditambah dokumen `report_private` dan rekaman audio | 5.1 |
| Koordinat lokasi | Persis dan publik | Tidak berubah | 8.1 |

Catatan: baris "Folder Storage" di atas adalah keadaan revisi 14 November sebelum hackathon dimulai. Keadaan akhirnya ada di bagian 5a.

## 5a. Penyimpanan Foto dan Rekaman (Revisi Saat Hackathon Dimulai)

Firebase Storage ternyata membutuhkan paket Blaze, sehingga tidak dipakai. Rincian pertimbangannya ada di `USULAN-FIRESTORE.md`.

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Tempat foto dan rekaman | Firebase Storage | Firestore, sebagai `Bytes`, di koleksi baru `report_photos` dan `report_audio` | 8.1 |
| Jumlah koleksi Firestore | Tiga | Enam: `reports`, `report_private`, `report_photos`, `report_audio`, `geocode_cache`, `rate_limits` | 8.1 |
| Penanda foto di laporan | `photoUrl` (string URL atau `null`) | `hasPhoto` (boolean) | 7.3, 8.1 |
| Penanda rekaman | Tidak ada | `hasAudio` (boolean) di `report_private` | 8.1 |
| Ukuran foto tersimpan | Di bawah 1 MB | Maksimal 500 KB | 3, 7.1 |
| Security Rules | `firestore.rules` dan `storage.rules` | `firestore.rules` saja | 8.3 |
| Environment | Ada `VITE_FIREBASE_STORAGE_BUCKET` | Dihapus | 7.4 |
| Kontrak service | Tidak ada | Fungsi `getReportPhotoUrl(reportId)` ditambahkan; `getReportAudioUrl` menerima `reportId` | 7.5 |
| Nama branch | `feat/anggota-N-...` | Nama anggota: `fikri`, `irfan`, `nugi`, `zikri`, `taqi` | 9.1 |

## 5b. Endpoint Gemini dan Serah Terima ke Halaman Chat (Revisi Kedua Saat Hackathon)

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Pengiriman rekaman ke `process-report` | `multipart/form-data` dengan `audioFile` | JSON dengan `audioBase64` dan `audioMimeType` (tanpa package pengurai di server) | 8.2 |
| Batas keluaran Gemini | `maxOutputTokens: 350` untuk semua | 1024 untuk `process-report`, 350 untuk `chat-assistant`; keduanya `thinkingBudget: 0` | 4.2 |
| Mode mock | Tidak ada | `VITE_USE_MOCK_API=true`: `apiClient.js` membalas data contoh saat development | 7.1, 7.4, 7.5 |
| Serah terima halaman utama ke chat | Tidak diatur | Lewat `useReportDraft()`: `startDraft`, `updateDraft`, `resetDraft` | 7.5 |
| Letak widget Turnstile | Halaman utama | Halaman chat, tempat `process-report` dipanggil | 3 |
| Nama file aturan agent | Tidak ada | `AGENTS.md` | - |

## 6. Kontrak Data

| Hal | PRD Awal | PRD Terakhir | Bagian |
|---|---|---|---|
| Batas ringkasan | 500 karakter di tabel database, tidak seragam antar bagian | 1000 karakter di semua bagian | 7.3, 8.1, 8.3 |
| Batas judul | 60 karakter, tidak tertulis di semua bagian | 60 karakter di semua bagian, termasuk Security Rules | 7.3, 8.1, 8.3 |
| Nama field hasil AI | Campuran `is_valid_report`/`audio_quality` dan `isValidReport`/`audioQuality` | `isValidReport` dan `audioQuality` di semua bagian | 4.1, 5.1 |
| Draf laporan | Tanpa field audio | Ditambah `audioBlob` (rekaman di memori browser sampai laporan dikirim) | 7.3 |
| Konstanta | Kategori, urgensi, status | Ditambah `URGENCY_SORT_ORDER`, `MAX_RECORDING_SECONDS`, `AUDIO_RETENTION_DAYS` | 7.3 |
| Urutan antrean admin | "Darurat di paling atas", tanpa aturan pengurutan | Diurutkan di frontend: Darurat, Tinggi, Normal; dalam urgensi yang sama, laporan terbaru di atas | 5.1 |

## 7. Bagian Baru

Tiga hal ini tidak ada di PRD awal.

- **Alur gagal (bagian 3):** enam kejadian beserta jalan keluarnya bagi warga.
  - Izin mikrofon ditolak.
  - `process-report` gagal atau kuota Gemini habis.
  - Laporan dinilai tidak valid.
  - GPS atau reverse geocoding gagal.
  - Pengiriman laporan gagal.
  - `chat-assistant` gagal.
- **Format error seragam (bagian 8.2):** semua endpoint membalas kegagalan dengan bentuk `{ "success": false, "error": { "code", "message" } }`, dengan delapan nilai `code` yang ditetapkan.
- **Kontrak fungsi service (bagian 7.5):** nama fungsi, parameter, dan nilai kembalian untuk `reportService.js`, `authService.js`, dan `apiClient.js`. Halaman dan komponen dilarang memanggil Firestore, Storage, atau `/api/*` secara langsung.

## 8. Yang Tidak Berubah

- Fitur utama, alur pelaporan, dan empat halaman.
- Design system (palet Hitam, Merah, Putih) dan aturan tipografi.
- Struktur folder, kecuali `tailwind.config.js` yang dihapus dan `.eslintrc.cjs` yang diganti `eslint.config.js`.
- Kategori, tingkat urgensi, dan status laporan.
- Keempat endpoint `/api/*`, termasuk pengiriman audio dengan `multipart/form-data`.
- Arsitektur admin tunggal `admin@laporin.id` dengan klaim `admin: true`.
- Rate limit lima laporan per jam.
- Strategi branching GitHub dan pembagian tugas Irfan, Nugi, Zikri, dan Taqi.

## 9. Masih Terbuka

Hal berikut sudah dibahas tetapi belum diputuskan, sehingga belum masuk `PRD.md`.

- **Penghematan request Gemini:** mode mock saat development, satu request per laporan, edit tanpa AI, tanpa retry otomatis, penyaringan input di browser, dan model cadangan.
- **Bahasa Minang:** aturan di system prompt (bahasa `rawTranscript`, nama tempat tidak diterjemahkan, larangan menebak kata, glosarium istilah lokal).
- **Pembagian tugas:** pemilik endpoint Gemini, `LocationPickerModal.jsx`, dan `ticketGenerator.js`, serta pekerjaan baru yang muncul dari revisi ini (`report_private`, Security Rules baru, pemutar rekaman di dashboard admin).
- **Butir notulen 13 November 2026:** relasi antar tabel belum dijabarkan.
