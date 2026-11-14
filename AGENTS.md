# AI AGENT CODING RULES & INSTRUCTIONS
## Project Lapor.in — Platform Pelaporan & Aspirasi Warga Inklusif
**Tim**: Minimize | **Tema**: AI for Access and Digital Life

Dokumen ini berisi instruksi dan aturan kerja wajib (*mandatory rules*) bagi seluruh AI Code-Agent (Claude Code, Gemini, Cursor, Antigravity, dsb.) yang bekerja pada repositori `lapor.in`. Setiap kali membuat atau memodifikasi kode, seluruh aturan di bawah ini **wajib dipatuhi sepenuhnya**.

---

## 1. Lingkungan, Tech Stack, & Manajemen Dependency

- **Runtime & Arsitektur**:
  - Node.js versi `^20.19.0` atau `>=22.12.0` (wajib untuk Vite 8).
  - Backend menggunakan **Vercel Serverless Functions** (`api/*.js`) berbasis **Node.js ESM** (`"type": "module"`).
  - **Zero-Cost Architecture**: Seluruh layanan berjalan pada tier gratis Firebase, Vercel, OpenStreetMap Nominatim, Cloudflare Turnstile, dan Gemini API.
- **Frontend Stack**:
  - React `^19.3` (tanpa React Compiler), `react-router-dom` `^7.18`, Vite `^8.3` (`@vitejs/plugin-react` `^6.3`).
  - Styling menggunakan **Tailwind CSS v4** (`tailwindcss` `^4.3` + `@tailwindcss/vite`). Konfigurasi tema dan CSS Variables dilakukan langsung di `src/index.css`. **DILARANG membuat file `tailwind.config.js`**.
  - Peta interaktif menggunakan `leaflet` `^1.9.4`, `react-leaflet` `^5.0`, `leaflet.markercluster` `^1.5.3`, dan `ngeohash` `^0.6.4`.
  - Anti-bot menggunakan `@marsidev/react-turnstile` `^1.6.3`.
- **Backend & AI SDK**:
  - Client Firebase SDK: `firebase` `^13.3` (Auth dan Firestore). **Firebase Storage TIDAK dipakai** karena membutuhkan paket Blaze; foto dan rekaman disimpan di Firestore sebagai `Bytes`.
  - Server Firebase SDK: `firebase-admin` `^14.5` (verifikasi admin & cron cleanup).
  - Server AI SDK: `@google/genai` `^3.3` menggunakan model **`gemini-3.5-flash`** (tier gratis).
- **Aturan Dependency & Linter**:
  - **DILARANG** menginstal package tambahan secara sepihak (`npm install <nama-package>`). Gunakan hanya library yang tercantum di `package.json` dan `package-lock.json` repositori.
  - Linter menggunakan **ESLint 10+ Flat Config** (`eslint.config.js`). Setiap perubahan kode **wajib menghasilkan 0 errors dan 0 warnings** saat menjalankan `npm run lint`.

---

## 2. Standar Gaya Penulisan Kode (Junior-Friendly & Konsisten)

1. **Bahasa Penamaan (Identifiers)**:
   - Seluruh nama variabel, konstanta, fungsi, parameter, nama file, dan direktori **WAJIB menggunakan bahasa Inggris standar industri** yang deskriptif dan sesuai kontrak PRD (contoh: `ticketCode`, `isValidReport`, `audioQuality`, `rawTranscript`, `reporterUid`).
2. **Bahasa Komentar (Comments)**:
   - Seluruh komentar penjelas di dalam kode (baik frontend maupun serverless `api/*.js`) **WAJIB menggunakan bahasa Indonesia** yang ramah pemula, komunikatif, dan memiliki nomor urut langkah:
     ```javascript
     // Langkah 1: Validasi token Cloudflare Turnstile dari header request
     // Langkah 2: Kirim rekaman audio ke Gemini 3.5 Flash dengan schema terkunci
     // Langkah 3: Kembalikan draf terstruktur ke frontend
     ```
3. **Pemisahan Error Developer vs Pengguna (WAJIB)**:
   - **Untuk Developer (Server Logs / Terminal)**: Catat detail teknis error secara lengkap (termasuk stack trace dan pesan mentah dari Gemini/Firebase) di server menggunakan `console.error('Error pada [NamaEndpoint/Fungsi]:', error)`.
   - **Untuk Pengguna (HTTP Response `4xx` / `5xx`)**: **DILARANG KERAS** mengirimkan `error.message` internal, stack trace, atau detail konfigurasi ke client (*Information Disclosure Prevention*). Seluruh endpoint `/api/*` yang gagal **WAJIB** membalas dengan format JSON seragam berikut:
     ```javascript
     try {
       // ... logika endpoint ...
     } catch (error) {
       console.error('Error pada processReport:', error);
       return res.status(500).json({
         success: false,
         error: {
           code: 'INTERNAL_ERROR',
           message: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
         },
       });
     }
     ```
   - **Kode Error Resmi yang Berlaku**: `INVALID_INPUT` (`400`), `UNAUTHORIZED` (`401`), `TURNSTILE_FAILED` (`403`), `RATE_LIMITED` (`429`), `AI_QUOTA_EXCEEDED` (`429`), `AI_UNAVAILABLE` (`502`), `GEOCODE_FAILED` (`502`), dan `INTERNAL_ERROR` (`500`).
   - Pada sisi frontend, `apiClient.js` mengubah balasan gagal menjadi `Error` dengan properti `error.code`. Komponen UI menentukan alur pemulihan dan teks pesan berdasarkan `error.code` dari `public/locales/id.json`, bukan dari string `message` server.

---

## 3. Kontrak Arsitektur, Struktur Folder, & Service Layer

1. **Larangan Pemanggilan Langsung dari Komponen/Halaman**:
   - File di dalam `src/pages/*` dan `src/components/*` **DILARANG KERAS** mengimpor atau memanggil Firestore maupun `fetch('/api/*')` secara langsung.
   - Seluruh akses data dan API **WAJIB** melewati fungsi kontrak pada `src/services/`:
     - `src/services/reportService.js`: `createReport`, `listPublicReports`, `listReportsForAdmin`, `getReportPrivate`, `getReportPhotoUrl`, `getReportAudioUrl`, `updateReport`, `updateReportStatus`, `deleteReport`.
     - `src/services/authService.js`: `signInAnonymouslySilent`, `signInAdmin`, `signOutAdmin`, `onAuthChange`, `isAdminUser`.
     - `src/services/apiClient.js`: `processReport`, `sendChatMessage`, `reverseGeocode`. Dengan `VITE_USE_MOCK_API=true` di `.env.local` dan `npm run dev`, ketiganya membalas data contoh dari `src/services/apiMocks.js` tanpa memanggil `/api/*` (mode mock; tidak pernah aktif di build produksi).
   - Draf laporan dibaca dan diubah **hanya** lewat `useReportDraft()` (`src/hooks/useReportDraft.js`): `draft`, `inputMode`, `startDraft({ inputMode, audioBlob })`, `updateDraft(fields)`, `resetDraft()`. Halaman utama memanggil `startDraft(...)` lalu `navigate("/chat")`. **DILARANG** mengirim rekaman atau data laporan lewat state navigasi (`navigate(path, { state })`). Jika `/chat` dibuka saat `inputMode` bernilai `null`, warga dikembalikan ke halaman utama.
   - Teks antarmuka diambil lewat `useLanguage()` dari `src/hooks/useLanguage.js`.
   - Nama fungsi, urutan parameter, dan bentuk nilai kembalian service tidak boleh diubah tanpa persetujuan Project Lead.
2. **Kepatuhan Konstanta & Enum Global (`src/config/constants.js`)**:
   - **DILARANG** mengubah nama key maupun nilai string pada `REPORT_CATEGORIES`, `URGENCY_LEVELS`, `URGENCY_SORT_ORDER`, `MAX_RECORDING_SECONDS` (`120`), `AUDIO_RETENTION_DAYS` (`30`), `REPORT_STATUS`, dan `INITIAL_REPORT_DRAFT`.
   - Batas panjang teks wajib dijaga: `title` maksimal **60 karakter**, `summary` maksimal **1000 karakter**.
   - Pengurutan antrean di Dashboard Admin dilakukan di frontend mengikuti `URGENCY_SORT_ORDER` (`"Darurat"` -> `"Tinggi"` -> `"Normal"`, lalu `createdAt` terbaru di atas), bukan lewat query `orderBy` Firestore pada field string urgensi.
3. **Kepatuhan Struktur Direktori**:
   - Tempatkan seluruh file sesuai peta folder resmi pada bagian 7.1 `PRD.md` (`api/`, `public/locales/`, `src/components/{common,home,chat,map,admin}`, `src/config/`, `src/context/`, `src/hooks/`, `src/pages/`, `src/services/`, `src/utils/`).

---

## 4. Standar Keamanan, Privasi Warga, & Database

1. **Autentikasi & Otorisasi**:
   - Warga pelapor menggunakan **Firebase Silent Anonymous Auth** (`signInAnonymouslySilent()`) di latar belakang tanpa form pendaftaran.
   - Hanya terdapat **1 akun Admin tunggal** (`admin@laporin.id`) dengan Custom Claim `admin: true`. Tidak ada fitur registrasi publik.
   - Endpoint `POST /api/process-report` wajib memverifikasi token **Cloudflare Turnstile** ke `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Komponen `TurnstileWidget` dipasang **satu kali** oleh `TurnstileProvider` di `App.jsx`; **DILARANG** memasangnya lagi di halaman atau komponen. Token diambil dengan `const { takeToken } = useTurnstileToken()` lalu `const token = await takeToken()`, dan diteruskan ke `processReport({ ..., turnstileToken: token })`. Token hanya berlaku sekali; `takeToken()` otomatis meminta token baru untuk pemanggilan berikutnya, termasuk "Coba Lagi".
   - Rekaman dikirim ke `POST /api/process-report` sebagai **JSON** berisi `audioBase64` dan `audioMimeType`. **DILARANG** memakai `multipart/form-data` (membutuhkan package pengurai di server).
   - Endpoint cron `GET /api/cleanup-audio` wajib memvalidasi header `Authorization: Bearer <CRON_SECRET>` dan selesai di bawah batas timeout Vercel Free Tier (`< 10 detik`).
2. **Isolasi Data Publik vs Data Privat (`reports` vs `report_private`)**:
   - Koleksi `reports` dapat dibaca publik setelah status menjadi `verified`, `in_progress`, atau `resolved`. Dokumen `reports` **DILARANG KERAS** menyimpan `reporterUid`, `rawTranscript`, `adminNotes`, atau `hasAudio`. Dokumen `reports` memakai `hasPhoto` (boolean), bukan `photoUrl`.
   - Data sensitif tersebut wajib disimpan ke koleksi `report_private/{reportId}` secara bersamaan (batch write) saat `createReport` dipanggil, dan hanya dapat dibaca/diubah oleh Admin.
3. **Privasi Media (Foto & Rekaman Audio)**:
   - **Foto**: Wajib melewati `src/utils/imageCompressor.js` untuk dikompresi (maksimal `500 KB`; batas file pilihan warga `5MB`) dan **menghapus seluruh metadata EXIF** (lokasi GPS/perangkat) sebelum disimpan sebagai `Bytes` ke dokumen Firestore `report_photos/{reportId}`. Foto dimuat lewat `getReportPhotoUrl(reportId)` hanya saat laporan dibuka.
   - **Audio**: Rekaman suara dibatasi maksimal **120 detik** (`24 kbps` mono, `audio/webm;codecs=opus` atau fallback `audio/mp4`) dengan constraint Web Audio API (`echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`).
   - Rekaman audio hanya disimpan di memori browser (`ReportDraftContext`) selama sesi `/chat`, dan **baru disimpan** sebagai `Bytes` ke dokumen Firestore `report_audio/{reportId}` (khusus admin) saat warga menekan tombol **"Kirim Laporan Sekarang"**. Rekaman dihapus otomatis setelah **30 hari** oleh cron `/api/cleanup-audio`.
4. **Pemisahan Environment API Key**:
   - Gunakan `GEMINI_API_KEY` terpisah antara environment lokal/development (`.env.local`) dan environment Production (demo) agar kuota demo tidak habis saat pengujian.

---

## 5. Aturan AI, Efisiensi Token (7 Strategi Wajib), & Alur Gagal

1. **Aksesibilitas Suara & Normalisasi Gangguan Bicara**:
   - System prompt pada `/api/process-report` wajib menginstruksikan Gemini 3.5 Flash untuk mengabaikan kebisingan latar (*ambient noise*), melakukan **disfluency normalization** (merapikan ucapan gagap/pengulangan suku kata tanpa mengubah makna), menerjemahkan bahasa daerah (misal bahasa Minang) ke bahasa Indonesia baku, serta menandai `isValidReport: false` jika rekaman hanya berisi suara bising/kosong.
2. **7 Strategi Wajib Efisiensi Token AI**:
   - **Sliding Window History**: `/api/chat-assistant` hanya boleh mengirim maksimal **4 pesan terakhir** ke Gemini API.
   - **State-Driven Context Injection**: Kirim ringkasan state draf laporan dalam JSON padat (`< 120 token`) di setiap request, bukan riwayat panjang.
   - **Rule-Based Shortcut (0 Token)**: Klik tombol cepat di UI (`"Lewati Foto"`, `"Gunakan GPS"`, `"Edit Field"` inline, `"Kirim Laporan"`) wajib memperbarui state lokal React tanpa memanggil API Gemini.
   - **Batas Durasi Audio 120 Detik**: Batasi durasi rekaman agar konsumsi token audio tetap terkendali.
   - **Locked JSON Schema**: Wajib gunakan `responseSchema` terkunci. Batas keluaran: `maxOutputTokens: 1024` untuk `/api/process-report` dan `maxOutputTokens: 350` untuk `/api/chat-assistant`. Kedua endpoint wajib memakai `thinkingConfig: { thinkingBudget: 0 }`, karena token "thinking" Gemini 3.5 Flash ikut memakan jatah keluaran dan dapat memotong JSON. Pengecualian: model cadangan `gemini-3.5-flash-lite` menolak pengaturan itu (error 400), jadi untuk model lite pengaturannya tidak dikirim. Urutan model: `gemini-3.5-flash`, lalu `gemini-3.5-flash-lite`, lalu `gemini-3.8-flash` (dapat diganti lewat `GEMINI_MODEL`). **DILARANG** memakai `gemini-2.5-flash`: model itu sudah tidak tersedia untuk API key baru.
   - **System Instruction Padat (`< 250 token`)**: Pisahkan teks input pengguna secara eksplisit di dalam prompt untuk mencegah *prompt injection*.
   - **Geocoding Tanpa AI**: Reverse geocoding menggunakan `/api/reverse-geocode` yang mengecek cache Firestore `geocode_cache/{geohash}` (presisi 7, berlaku 30 hari) dan mengantrekan request ke OSM Nominatim dengan jeda minimal `1100 ms`.
3. **Penanganan Alur Gagal (Zero Dead-End Policy)**:
   - Setiap kegagalan (izin mic ditolak, `/api/process-report` gagal/kuota habis, `isValidReport: false`, GPS ditolak, `/api/chat-assistant` gagal, atau gagal kirim laporan) **wajib menyediakan jalur alternatif** bagi warga (misal: beralih ke ketik manual, tombol *"Coba Lagi"*, pengisian form manual tanpa AI dengan `audioQuality: "text_input"`, pin peta manual, atau pengiriman laporan tanpa lampiran foto/audio yang gagal).

---

## 6. Standar UI/UX, Design System, Lokalisasi, & Zero Emoji Policy

1. **Palet Warna Kontras Tinggi WCAG AAA (Wajib Seragam)**:
   - Hanya gunakan palet resmi **Hitam, Merah, Putih** dari `PRD.md` bagian 2.1:
     - Pitch Black: `#0A0A0A` (`--color-black-primary`)
     - Charcoal Surface: `#171717` (`--color-black-surface`)
     - Signal Red: `#DC2626` (`--color-red-primary`) & Crimson Hover: `#B91C1C` (`--color-red-hover`)
     - Soft Red Tint: `#FEE2E2` (`--color-red-tint`)
     - Pure White: `#FFFFFF` (`--color-white-primary`) & Off-White Surface: `#F5F5F5` (`--color-white-surface`)
     - Neutral Border: `#D4D4D4` (`--color-border-gray`) & Muted Text: `#525252` (`--color-text-muted`)
2. **Tipografi & Aksesibilitas Lansia**:
   - Font: `Inter` atau `Plus Jakarta Sans`.
   - Ukuran teks tubuh & bubble chat minimal `16px` (`text-base`); tombol aksi utama `18px–20px`.
   - Tombol mikrofon utama di Homepage minimal berukuran `140px x 140px` (`rounded-full`) berwarna `#DC2626` dengan efek denyut (`animate-pulse`) saat merekam, disertai pemberitahuan retensi audio 30 hari di bawahnya.
   - Dukung pembacaan balasan AI menggunakan Web Speech Synthesis (`useSpeechSynthesis.js`) dengan tombol mute yang mudah diakses.
3. **Lokalisasi Terpusat (`public/locales/id.json`)**:
   - Antarmuka menggunakan **Bahasa Indonesia**. **DILARANG menulis string teks antarmuka secara langsung (hardcoded) di dalam komponen JSX**. Seluruh label, tombol, placeholder, dan pesan error wajib diambil dari `public/locales/id.json` melalui `LanguageContext`. (`en.json` hanya dikerjakan di akhir proyek jika waktu memungkinkan).
4. **Zero Emoji Policy (Standar Ikon Vektor)**:
   - **DILARANG KERAS** menggunakan karakter emoji mentah (*raw Unicode emojis* seperti 🎤, 📍, 🚨, ✅, ⚠️, dsb.) di dalam komponen UI maupun teks `id.json`.
   - Seluruh simbol visual/ikon wajib menggunakan komponen vektor standar dari pustaka **`lucide-react`**.

---

## 7. Alur Kerja GitHub, Matriks Tim, & Kepatuhan Pengujian

1. **Strategi Branching & Commit**:
   - **DILARANG** `git push` langsung ke branch `main`. Seluruh perubahan wajib melalui **Pull Request (PR)** dari branch kerja masing-masing anggota. Nama branch adalah nama anggota (huruf kecil); **DILARANG** membuat branch dengan nama lain:
     - `fikri` (Fikri — Project Lead, Scaffold, Firebase Core, Services, Rules, `id.json`)
     - `irfan` (Irfan — Homepage UI, MicHeroButton, Audio Recorder, TTS, Navbar, TurnstileWidget)
     - `nugi` (Nugi — ChatPage, Chat Components, ReportDraftContext, Gemini Endpoints, Image Compressor)
     - `zikri` (Zikri — PublicMapPage, Leaflet Map & Cluster, Geolocation, Geohash, Reverse Geocode & Cleanup Cron)
     - `taqi` (Taqi — AdminLoginPage, AdminDashboardPage, Admin Components, Ticket Generator)
   - Gunakan format Conventional Commits: `feat: ...`, `fix: ...`, `style: ...`, `docs: ...`.
   - Sebelum mengedit file milik anggota lain, pastikan tidak melanggar kontrak interface di bagian 7.3 dan 7.5 `PRD.md`.
2. **Kepatuhan Pemeriksaan Kode**:
   - Sebelum menyelesaikan setiap tugas atau membuat PR, selalu jalankan `npm run lint` dan `npm run build` untuk memastikan **0 errors, 0 warnings**, dan tidak ada import/konfigurasi yang rusak.