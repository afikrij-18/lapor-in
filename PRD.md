# Product Requirements Document (PRD): Lapor.in

- **Versi:** 0.1 (Initial MVP Specification - Manual Coding Blueprint)
- **Nama Project / Repository:** lapor.in
- **Nama Tim:** Minimize (Anggota 1 - Anggota 5)
- **Tema Kompetisi:** AI for Access and Digital Life
- **Status Dokumen:** Baseline Blueprint (cara kerja tim: lihat bagian 1.3)

> Dikonversi dari `PRD - laporin.pdf`. Isi mengikuti PDF, dengan dua perubahan: `CRON_SECRET` yang tertulis lepas di akhir PDF dimasukkan ke daftar environment di bagian 7.4, dan bagian 1.3 beserta Status Dokumen direvisi pada 13 Nov 2026 (semula: seluruh kode ditulis manual tanpa AI code-agent). Revisi lain pada tanggal yang sama: batas judul 60 karakter dan ringkasan 1000 karakter diseragamkan (7.3, 8.1, 8.3), nama field `isValidReport` dan `audioQuality` diseragamkan (4.1 dan 5.1, semula `is_valid_report` dan `audio_quality`), Tailwind CSS menjadi `^4.3` (7.2), `tailwind.config.js` dihapus dari struktur folder (7.1) karena Tailwind v4 dikonfigurasi lewat CSS, file tanpa pemilik diserahkan ke Fikri (9.2), dan antarmuka menjadi Bahasa Indonesia saja dengan bahasa Inggris opsional di akhir project (2.2, 6, 7.1, 8.2, 9.2).
>
> Revisi 14 Nov 2026: rekaman dibatasi 120 detik dan alasan bitrate 24 kbps diluruskan (3, 4.1, 4.2); rekaman audio disimpan khusus admin selama 30 hari, dengan pemberitahuan di homepage dan tombol putar di dashboard admin (3, 5.1, 6.1, 6.4, 8.3); koleksi baru `report_private` untuk `rawTranscript`, `reporterUid`, `adminNotes`, dan `audioPath` (8.1, 8.3); metadata foto dibuang dan folder Storage dipisah per pengguna (7.1, 8.3); alur gagal dan format error seragam ditambahkan (3, 8.2); model menjadi Gemini 3.5 Flash tier gratis dengan SDK `@google/genai` dan API key terpisah untuk development dan demo (4, 7.2, 7.4, 8.2); `vite`, `@vitejs/plugin-react`, dan `@tailwindcss/vite` masuk daftar library (7.2); kontrak fungsi service ditambahkan (7.5); urutan antrean admin ditetapkan (5.1, 7.3). Versi library di 7.2 disamakan dengan yang terpasang di repository (React 19, `react-router-dom` 7, `react-leaflet` 5, `firebase` 13, `firebase-admin` 14, `lucide-react` 1.72, `@marsidev/react-turnstile` 1.6, `leaflet.markercluster` 1.5.3), ESLint masuk daftar library, dan `.eslintrc.cjs` diganti `eslint.config.js` (7.1, 9.2).
>
> Revisi saat hackathon dimulai (14 Nov 2026): Firebase Storage tidak dipakai karena membutuhkan paket Blaze. Foto dan rekaman disimpan di Firestore sebagai `Bytes` pada koleksi baru `report_photos` dan `report_audio`; `photoUrl` menjadi `hasPhoto`, `audioPath` menjadi `hasAudio`, foto hasil kompresi dibatasi 500 KB, `storage.rules` dan `VITE_FIREBASE_STORAGE_BUCKET` dihapus, dan `getReportPhotoUrl` ditambahkan ke kontrak service (3, 7.1, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3). Nama branch kerja menjadi nama anggota (9.1). Rincian: `USULAN-FIRESTORE.md`.
>
> Revisi kedua saat hackathon: rekaman dikirim ke `/api/process-report` sebagai base64 di dalam JSON, bukan `multipart/form-data` (8.2); batas keluaran menjadi 1024 untuk `process-report` dan 350 untuk `chat-assistant`, keduanya dengan `thinkingBudget: 0` (4.2); mode mock `VITE_USE_MOCK_API` ditambahkan (7.1, 7.4, 7.5); serah terima halaman utama ke halaman chat lewat `useReportDraft()`, dan widget Turnstile dipindah ke halaman chat (3, 7.5). File aturan agent bernama `AGENTS.md`.
>
> Revisi ketiga saat hackathon: model menjadi `gemini-3.5-flash` karena `gemini-2.5-flash` sudah tidak tersedia untuk API key baru; model cadangan, batas waktu per percobaan, dan pengecualian `thinkingBudget` untuk model lite ditetapkan (4.2). Seluruh sebutan "Gemini 2.5 Flash" di dokumen ini diganti.
>
> Revisi keempat saat hackathon: Cloudflare Turnstile dihapus dan diganti batas permintaan AI per pengguna per jam di server (3, 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, glosarium). Alasannya: token Turnstile berikutnya butuh sekitar 20 detik untuk dibuat ulang, dan pengaturan kuncinya di Vercel berulang kali gagal. Catatan revisi di atas yang menyebut Turnstile adalah riwayat, bukan keadaan sekarang.

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang Masalah

Warga di tingkat lingkungan mikro (RT/RW, perumahan, kelurahan, atau desa) sering menghadapi hambatan dalam melaporkan masalah fasilitas publik maupun menyampaikan aspirasi:

- **Kesenjangan Literasi Digital & Aksesibilitas:** Warga lansia, penyandang disabilitas netra, dan warga dengan gangguan bicara (seperti gagap atau artikulasi kurang jelas) kesulitan mengisi formulir digital yang panjang dan kaku.
- **Hambatan Bahasa Daerah:** Warga terbiasa menggunakan bahasa daerah sehari-hari (misalnya bahasa Minang) sehingga ragu menulis laporan dalam bahasa Indonesia formal.
- **Kekhawatiran Privasi & Keamanan:** Warga takut identitas pribadinya terekspos saat melaporkan masalah keamanan atau ketertiban lingkungan.
- **Biaya Infrastruktur:** Solusi tingkat komunitas membutuhkan biaya operasional Rp 0 (Zero-Cost Architecture).

### 1.2 Visi & Solusi Lapor.in

**Lapor.in** adalah platform pelaporan dan aspirasi warga berbasis web yang inklusif dengan prinsip **AI for Access and Digital Life**. Warga cukup menekan **satu tombol mikrofon besar** untuk berbicara (atau mengetik manual), kemudian diarahkan ke **halaman chat interaktif bersama asisten AI** yang memandu pelaporan secara bertahap (melengkapi bukti foto opsional, verifikasi lokasi, dan konfirmasi/edit data sebelum dikirim).

### 1.3 Prinsip Pengembangan Tim Minimize

Satu anggota, Fikri (Project Lead), memakai AI code-agent (Claude Code) dan bertindak sebagai project manager. Cara kerja empat anggota lainnya, kode manual atau dengan AI code-agent, belum diputuskan.

Apa pun alatnya, seluruh kode wajib mengikuti kontrak variabel, struktur folder, dan spesifikasi teknis pada dokumen ini, dan setiap anggota tetap menguasai alur logika modul yang menjadi tanggung jawabnya.

---

## 2. Identitas Visual & Design System (Color Palette & Tipografi)

Antarmuka Lapor.in menggunakan skema kontras tinggi **Hitam, Merah, Putih** untuk menjamin keterbacaan maksimal bagi lansia dan pengguna low-vision (memenuhi standar kontras WCAG AAA).

### 2.1 Palet Warna Resmi (Wajib Seragam di Tailwind & CSS Variables)

| Nama Token | Kode HEX | Variabel CSS | Kelas Tailwind | Fungsi Penggunaan |
|---|---|---|---|---|
| **Pitch Black (Primary Dark)** | `#0A0A0A` | `--color-black-primary` | `bg-[#0A0A0A]` / `text-[#0A0A0A]` | Latar utama dark mode, teks utama pada latar putih, header utama |
| **Charcoal Surface** | `#171717` | `--color-black-surface` | `bg-[#171717]` | Card permukaan sekunder, bubble chat AI, kontainer input |
| **Signal Red (Primary Accent)** | `#DC2626` | `--color-red-primary` | `bg-[#DC2626]` / `text-[#DC2626]` | Tombol Mikrofon Utama (Mic Hero), badge status DARURAT, indikator aktif/rekam |
| **Crimson Hover** | `#B91C1C` | `--color-red-hover` | `hover:bg-[#B91C1C]` | State hover/active pada tombol merah utama |
| **Soft Red Tint** | `#FEE2E2` | `--color-red-tint` | `bg-[#FEE2E2]` | Latar alert peringatan, highlight baris darurat di tabel admin |
| **Pure White (Primary Light)** | `#FFFFFF` | `--color-white-primary` | `bg-[#FFFFFF]` / `text-[#FFFFFF]` | Latar utama light mode, teks di atas tombol hitam/merah, bubble chat user |
| **Off-White Surface** | `#F5F5F5` | `--color-white-surface` | `bg-[#F5F5F5]` | Latar area chat, pembatas section, kartu statistik |
| **Neutral Border** | `#D4D4D4` | `--color-border-gray` | `border-[#D4D4D4]` | Garis tepi kartu, input field, pemisah tabel (1px solid) |
| **Muted Text** | `#525252` | `--color-text-muted` | `text-[#525252]` | Label sekunder, timestamp chat, keterangan helper |

### 2.2 Aturan Tipografi & Aksesibilitas UI

- **Font Family:** `Inter` atau `Plus Jakarta Sans` (Google Fonts), fallback `sans-serif`.
- **Ukuran Teks Minimum:** `16px` (`text-base`) untuk teks tubuh dan bubble chat; `18px-20px` untuk tombol utama agar mudah dibaca lansia.
- **Ukuran Tombol Mikrofon Homepage:** Minimum `140px x 140px` (lingkaran penuh `rounded-full`) dengan efek denyut (`animate-pulse`) merah `#DC2626` saat merekam.
- **Bahasa Antarmuka:** Bahasa Indonesia saja. Seluruh teks antarmuka diambil dari `public/locales/id.json`, tidak ditulis langsung di komponen. Bahasa Inggris (`en.json` dan toggle `ID | EN` di header) dikerjakan di akhir project apabila masih ada waktu.

---

## 3. Alur Pelaporan Pengguna (End-to-End User Journey)

### Langkah 1: Halaman Utama (Homepage - `/`)

1. Pengguna membuka aplikasi Lapor.in. Sistem secara otomatis melakukan **Firebase Silent Anonymous Auth** di latar belakang. Sesi anonim ini juga menjadi dasar perlindungan dari penyalahgunaan: server membatasi jumlah permintaan AI per pengguna per jam (bagian 8.1 dan 8.2). Cloudflare Turnstile tidak dipakai.
2. Di tengah layar terdapat **Tombol Mikrofon Besar** berwarna Merah (`#DC2626`) bertuliskan *"Tekan & Ceritakan Masalah Anda"*.
3. Tepat di bawah tombol mikrofon terdapat **Tombol Sekunder Input Manual** berwarna Putih berbingkai Hitam (`#0A0A0A`) bertuliskan *"Ketik Laporan Secara Manual"*.
4. Pengguna memilih salah satu cara:
   - **Jalur Suara:** Pengguna menekan tombol mikrofon, berbicara (mendukung bahasa Indonesia, dialek daerah seperti Minang, maupun ucapan terbata/gagap), lalu menekan tombol *"Selesai Bicara"*. Rekaman dibatasi maksimal **120 detik**; saat batas tercapai, perekaman berhenti otomatis dan rekaman yang sudah ada tetap diproses. Audio dikompresi di browser dan langsung diarahkan ke halaman `/chat`.
   - **Jalur Manual:** Pengguna menekan tombol ketik manual, lalu langsung diarahkan ke halaman `/chat` dengan kolom teks aktif.
5. Di bawah kedua tombol tertulis pemberitahuan: *"Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin."* Rekaman hanya dapat didengar admin.

### Langkah 2: Halaman Chat Interaktif & Panduan AI (`/chat`)

1. **Pemrosesan Awal & Penanganan Aksesibilitas:**
   - Jika berasal dari rekaman suara, audio dikirim ke endpoint `/api/process-report` untuk dibersihkan dari kebisingan (*noise filtering*), ditranskripsikan, dan dirapikan dari gangguan bicara (gagap/pengulangan suku kata) maupun dialek daerah menjadi kalimat inti yang jelas.
   - Asisten AI menampilkan **Kartu Ringkasan Awal** (Judul, Kategori dugaan, Urgensi dugaan, dan Ringkasan masalah) serta membacakannya melalui **Text-to-Speech (TTS)** browser (dapat dimatikan dengan tombol mute).
2. **Panduan Bertahap oleh AI (Conversational Guidance):**
   - **Tahap Foto (Opsional):** AI bertanya: *"Apakah Anda memiliki foto kondisi di lokasi? Jika ada, silakan unggah. Jika tidak ada, tekan Lewati."* Pengguna dapat mengunggah foto (`JPG/PNG/WebP`, maks `5MB`; dikompresi di browser menjadi maksimal `500 KB` sebelum disimpan) atau menekan tombol **Lewati Foto**.
   - **Tahap Lokasi (Wajib):** AI meminta lokasi kejadian. Pengguna dapat menekan tombol *"Gunakan Lokasi Saya Saat Ini"* (Browser GPS + Reverse Geocoding OSM Nominatim) atau memilih/menggeser pin pada peta mini Leaflet.js.
   - **Tahap Informasi Tambahan (Opsional):** AI menanyakan patokan lokasi atau detail tambahan singkat jika masih diperlukan.
3. **Fitur Edit Laporan di Dalam Chatbot AI:**
   - Sebelum laporan dikirim ke publik/admin, AI menampilkan **Pratinjau Kartu Laporan Final**.
   - Pengguna dapat mengedit bagian mana pun langsung lewat chat menggunakan instruksi natural (contoh: *"Ubah lokasinya jadi di depan Masjid Raya"*, *"Ganti urgensi jadi Darurat"*, *"Hapus foto"*, atau *"Perbaiki ringkasannya menjadi..."*) maupun menekan tombol **Edit Field** pada kartu pratinjau.
   - AI memperbarui state laporan lokal dan menampilkan ulang kartu pratinjau yang sudah direvisi.
4. **Konfirmasi & Pengiriman Final:**
   - Pengguna menekan tombol **"Kirim Laporan Sekarang"**.
   - Sistem mengunggah foto (jika ada, tanpa metadata) dan rekaman audio (jika laporan berasal dari jalur suara) ke Firestore (koleksi `report_photos` dan `report_audio`), menyimpan dokumen laporan ke koleksi `reports` dengan status `"pending"` beserta data privatnya ke koleksi `report_private`, lalu menampilkan **Kode Tiket Pelacakan** (contoh: `LPR-2026-8492`).
   - Rekaman audio baru diunggah pada langkah ini. Sebelum itu rekaman hanya berada di memori browser, sehingga laporan yang dibatalkan tidak meninggalkan rekaman. Rekaman yang tersimpan dihapus otomatis setelah 30 hari oleh cron `cleanup-audio`.

### Langkah 3: Peta Sebaran & Status Publik (`/peta`)

Warga dapat melihat seluruh laporan berstatus `"verified"` maupun `"resolved"` di peta interaktif Leaflet.js (dengan Marker Clustering) tanpa menampilkan identitas pelapor.

### Alur Gagal (Wajib Ditangani)

Setiap kegagalan di bawah ini harus berakhir pada jalan keluar bagi warga, bukan layar buntu. Pesan yang tampil diambil dari `id.json` berdasarkan `error.code` (format error: lihat bagian 8.2).

| Kejadian | Yang Dilakukan Aplikasi |
|---|---|
| Izin mikrofon ditolak, atau browser tidak mendukung perekaman | Tampilkan pesan singkat dan arahkan warga ke jalur ketik manual. |
| `/api/process-report` gagal, timeout, atau kuota Gemini habis | Tampilkan tombol **"Coba Lagi"**. Jika gagal lagi, warga mengisi sendiri judul, kategori, urgensi, dan ringkasan di kartu pratinjau tanpa AI (`audioQuality: "text_input"`). Rekaman yang sudah ada tetap ikut dikirim bersama laporan. |
| AI mengembalikan `isValidReport: false` atau `audioQuality: "unusable"` | Draf tidak dibuat. Warga diminta merekam ulang atau mengetik laporannya. |
| Izin GPS ditolak atau lokasi gagal didapat | Warga menentukan lokasi dengan pin pada peta mini. Jika reverse geocoding gagal, koordinat tetap dipakai dan warga mengetik alamatnya sendiri. |
| Pengiriman laporan gagal | Draf, foto, dan rekaman tetap di memori browser, dan tombol **"Kirim Ulang"** ditampilkan. Jika hanya foto atau rekaman yang gagal disimpan (termasuk foto yang masih di atas `500 KB` setelah dikompresi), warga ditawari mengirim laporan tanpa lampiran tersebut. |
| `/api/chat-assistant` gagal | Tampilkan pesan singkat. Tombol **Edit Field** pada kartu pratinjau dan tombol Quick Actions tetap berfungsi karena tidak memanggil AI. |

---

## 4. Fitur Aksesibilitas Khusus & Strategi Efisiensi Token AI

### 4.1 Filter Kebisingan (Noise Filtering) & Dukungan Gangguan Bicara (Gagap / Stuttering)

1. **Pra-Pemrosesan Audio di Sisi Klien (Web Audio API):**
   - Mengaktifkan constraint bawaan browser pada `navigator.mediaDevices.getUserMedia`:
     - `echoCancellation: true`
     - `noiseSuppression: true`
     - `autoGainControl: true`
   - Pembatasan bitrate perekaman ke `24 kbps` (`audio/webm;codecs=opus` atau fallback `audio/mp4`) agar unggahan tetap cepat di jaringan lemah. Durasi rekaman dibatasi maksimal `120 detik`, sehingga ukuran file sekitar `360 KB`.
2. **Pemrosesan Multimodal Gemini 3.5 Flash untuk Gangguan Bicara & Dialek:**
   - System prompt secara eksplisit menginstruksikan Gemini untuk:
     - Mengabaikan suara latar bising (*ambient noise*, klakson, angin) dan fokus hanya pada ucapan manusia.
     - **Melakukan disfluency normalization:** menghapus pengulangan suku kata, jeda panjang, atau artikulasi terbata akibat gangguan bicara (gagap/disartria) tanpa mengubah makna laporan warga.
     - Menerjemahkan otomatis bahasa daerah (misal bahasa Minang) ke bahasa Indonesia baku.
     - Menandai `isValidReport: false` apabila rekaman 100% hanya suara bising kosong atau gumaman tanpa konteks laporan.

### 4.2 Strategi Efisiensi Token AI (7 Strategi Wajib)

Agar kuota gratis Gemini API tidak boros dan latensi tetap cepat di bawah 3 detik:

1. **Sliding Window History (Maksimal 4 Pesan Terakhir):** Backend hanya mengirimkan maksimal 4 giliran percakapan terakhir ke Gemini API, bukan seluruh riwayat chat dari awal.
2. **State-Driven Context Injection:** State formulir laporan saat ini (`title`, `category`, `urgency`, `summary`, `address`, `hasPhoto`) diringkas menjadi objek JSON ringkas (< 120 token) di setiap request daripada mengulang percakapan panjang.
3. **Rule-Based Shortcut Tanpa AI untuk Aksi Tombol:** Jika pengguna menekan tombol cepat (`"Lewati Foto"`, `"Gunakan GPS"`, `"Kirim Laporan"`), frontend memperbarui state secara lokal di React tanpa memanggil Gemini API sama sekali (hemat 100% token pada langkah navigasi).
4. **Batas Durasi Rekaman 120 Detik & Audio Low-Bitrate (24 kbps Mono):** Gemini menghitung token audio berdasarkan durasi, bukan bitrate, sehingga penghematan token berasal dari batas durasi 120 detik. Bitrate 24 kbps mono dipakai agar unggahan cepat pada kondisi internet lapangan yang tidak menentu.
5. **Output JSON Schema Terkunci (responseSchema) & Batas maxOutputTokens per Endpoint:** Mencegah AI menghasilkan paragraf basa-basi yang panjang.
   - `/api/process-report`: `maxOutputTokens: 1024`, karena balasannya memuat ringkasan (maksimal 1000 karakter) dan transkrip rekaman 120 detik.
   - `/api/chat-assistant`: `maxOutputTokens: 350`, karena balasannya pendek.
   - Kedua endpoint memakai `thinkingConfig: { thinkingBudget: 0 }`. Pada Gemini 3.5 Flash, token "thinking" ikut memakan jatah keluaran; tanpa pengaturan ini balasan JSON bisa terpotong. Ketelitian klasifikasi dijaga dengan aturan urgensi dan validitas yang tertulis jelas di system prompt.
   - Pengecualian: model cadangan `gemini-3.5-flash-lite` menolak `thinkingBudget: 0` (error 400) dan memang tidak memakai thinking, sehingga untuk model itu pengaturan tersebut tidak dikirim.
   - Model: utama `gemini-3.5-flash`, cadangan `gemini-3.5-flash-lite` lalu `gemini-3.8-flash`; dapat diganti lewat environment `GEMINI_MODEL`. Endpoint pindah ke model berikutnya saat model sibuk, tidak tersedia, atau melewati batas waktu (15 detik untuk `process-report`, 10 detik untuk `chat-assistant`; 10 detik adalah batas terendah yang diterima API). `gemini-2.5-flash`, yang tertulis di revisi sebelumnya, sudah tidak tersedia untuk API key baru.
6. **System Instruction Ringkas & Terisolasi:** System prompt ditulis padat di bawah 250 token dengan pemisah teks input pengguna untuk mencegah prompt injection sekaligus menghemat token input.
7. **Geocoding & Clustering Tanpa AI:** Konversi koordinat ke alamat menggunakan Nominatim OSM + Geohash Cache di Firestore tanpa melibatkan Gemini.

---

## 5. Spesifikasi Akun Admin & Rincian Tugas (Single Admin Architecture)

Sistem hanya memiliki **1 akun Admin tunggal** yang dikelola melalui **Firebase Authentication (Email & Password)** dengan email `admin@laporin.id` dan Custom Claim `admin: true` (serta validasi email whitelist di Firestore Rules).

### 5.1 Rincian Tugas & Wewenang Admin di Dashboard (`/admin`)

1. **Login & Autentikasi Aman:**
   - Masuk melalui halaman `/admin/login` menggunakan `admin@laporin.id` dan kata sandi terenkripsi Firebase Auth.
2. **Memverifikasi Keabsahan Laporan Masuk (pending → verified / rejected):**
   - Memeriksa kesesuaian antara ringkasan teks hasil AI, transkrip asli, rekaman audio (diputar lewat tombol **"Putar Rekaman"**, tersedia selama 30 hari), foto bukti (jika dilampirkan), dan titik koordinat lokasi.
   - Meninjau indikator `isValidReport` dan `audioQuality` dari AI untuk menyaring laporan spam atau rekaman bising palsu.
   - Menekan tombol **"Verifikasi & Publikasikan"** (mengubah status menjadi `verified` sehingga tampil di peta publik) atau **"Tolak Laporan"** (mengubah status menjadi `rejected` disertai alasan singkat).
3. **Menangani Prioritas Darurat (Emergency Priority Triage):**
   - Memantau antrean paling atas yang ditandai badge merah berkedip (`urgency: "Darurat"`), memvalidasi kebenarannya, dan meneruskannya ke pihak terkait/RT/RW/kelurahan.
   - Antrean diurutkan di frontend: `"Darurat"`, lalu `"Tinggi"`, lalu `"Normal"` (mengikuti `URGENCY_SORT_ORDER` di bagian 7.3); di dalam urgensi yang sama, laporan terbaru (`createdAt`) di atas. Pengurutan tidak dilakukan lewat query Firestore karena nilai urgensi berupa teks.
4. **Mengedit / Mengoreksi Data Laporan Sebelum Publikasi:**
   - Admin berhak mengoreksi kategori, tingkat urgensi, atau menyunting alamat/ringkasan apabila terdapat informasi sensitif (seperti nomor telepon pribadi atau pelat nomor warga) sebelum dipublikasikan ke peta umum.
5. **Memperbarui Progres Penanganan (verified → in_progress → resolved):**
   - Mengubah status laporan yang sedang ditindaklanjuti menjadi `in_progress` dan menandainya `resolved` (Selesai) setelah masalah di lapangan teratasi.
6. **Menghapus Laporan Spam / Duplikat:**
   - Menghapus permanen dokumen laporan, data privatnya di `report_private`, dan lampiran medianya (foto dan rekaman audio) apabila terbukti duplikat atau melanggar ketentuan.

---

## 6. Wireframe Antarmuka (Low-Fidelity Text Blueprint)

### 6.1 Wireframe 1: Homepage (`/`)

```
+-------------------------------------------------------------------+
| [LOGO: LAPOR.IN (Hitam/Merah)]           [Peta Publik]            |
+-------------------------------------------------------------------+
|                                                                   |
|           Suarakan Masalah Lingkungan Anda Secara Aman            |
|       Tanpa Login Rumit • Mendukung Bahasa Daerah & Suara         |
|                                                                   |
|                        +-----------------+                        |
|                        |                 |                        |
|                        |   ((  MIC  ))   |  <-- Lingkaran Merah   |
|                        |  TEKAN BICARA   |      (#DC2626) 150px   |
|                        |                 |                        |
|                        +-----------------+                        |
|                                                                   |
|               [  Ketik Laporan Secara Manual  ]  <-- Tombol Putih |
|                                                      Border Hitam |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | [Status Sistem: Aman & Anonim]  |  [124 Laporan Ditangani]  |  |
|  +-------------------------------------------------------------+  |
|  Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin.  |
+-------------------------------------------------------------------+
```

### 6.2 Wireframe 2: Halaman Chat Interaktif & Edit Laporan (`/chat`)

```
+-------------------------------------------------------------------+
| [<- Kembali]   Asisten Lapor.in (AI)                [Suara: ON]   |
+-------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------+                     |
|  | [AI] Saya menangkap laporan Anda:        |                     |
|  | +--------------------------------------+ |                     |
|  | | Judul   : Tiang Listrik Miring       | |                     |
|  | | Kategori: Infrastruktur              | |                     |
|  | | Urgensi : [DARURAT] (Merah)          | |                     |
|  | | Lokasi  : Belum ditentukan           | |                     |
|  | | Foto    : Belum dilampirkan          | |                     |
|  | +--------------------------------------+ |                     |
|  | Silakan unggah foto jika ada, atau       |                     |
|  | tekan Lewati.                            |                     |
|  +------------------------------------------+                     |
|                                                                   |
|                     +------------------------------------------+  |
|                     | [User] Ubah urgensinya jadi Tinggi saja  |  |
|                     +------------------------------------------+  |
|                                                                   |
|  +------------------------------------------+                     |
|  | [AI] Baik, urgensi diubah ke Tinggi.     |                     |
|  | Kartu pratinjau telah diperbarui.        |                     |
|  +------------------------------------------+                     |
|                                                                   |
+-------------------------------------------------------------------+
| Quick Actions: [ + Foto ] [ Lokasi GPS ] [ Kirim Laporan ]        |
| [ Ketik pesan atau perintah edit di sini...           ] [ Kirim ] |
+-------------------------------------------------------------------+
```

### 6.3 Wireframe 3: Halaman Peta Publik (`/peta`)

```
+-------------------------------------------------------------------+
| [LOGO: LAPOR.IN]               [Buat Laporan Baru]                |
+-------------------------------------------------------------------+
| Filter: [Semua Kategori v] [Semua Urgensi v] [Status: Verified v] |
+-------------------------------------------------------------------+
|                                               |                   |
|                                               | DETAIL LAPORAN    |
|        PETA LEAFLET.JS                        | ----------------- |
|     (Marker Clustering Hitam/Merah)           | Tiang Listrik     |
|                                               | Status: Verified  |
|          [ (5) ]   <-- Cluster                | Lokasi: Jl. Sudir |
|     [!] <-- Pin Merah Darurat                 | Foto: [Thumbnail] |
|                                               |                   |
+-------------------------------------------------------------------+
```

### 6.4 Wireframe 4: Dashboard Admin (`/admin`)

```
+-------------------------------------------------------------------+
| [LAPOR.IN ADMIN]  admin@laporin.id                      [Logout]  |
+-------------------------------------------------------------------+
| [Total: 42] | [Pending: 5] | [DARURAT: 2 (Merah)] | [Selesai: 30] |
+-------------------------------------------------------------------+
| Tab: [Antrean Verifikasi (5)] [Semua Laporan] [Peta Sebaran]      |
+-------------------------------------------------------------------+
| ID       | Judul & Ringkasan     | Urgensi | AI Valid | Aksi      |
|----------+-----------------------+---------+----------+-----------|
| LPR-8492 | Pohon tumbang jalan.. | DARURAT | Valid    | [Verif]   |
|          | (Highlight Merah)     |         | (Clear)  | [Edit]    |
|          |                       |         |          | [Tolak]   |
|          |                       |         |          | [Putar]   |
+-------------------------------------------------------------------+
```

---

## 7. Standar Struktur Folder, Library, & Penamaan Variabel (Kontrak Seragam)

Seluruh anggota tim wajib mengikuti struktur direktori, versi library, dan konvensi penamaan variabel berikut agar penggabungan kode (*merge*) berjalan tanpa konflik.

### 7.1 Struktur Folder Project (`lapor.in`)

```
lapor.in/
├── api/                                # Vercel Serverless Functions (Node.js ESM)
│   ├── process-report.js               # Endpoint transkripsi suara & triage awal Gemini
│   ├── chat-assistant.js               # Endpoint percakapan panduan & edit laporan AI
│   ├── reverse-geocode.js              # Endpoint proxy Nominatim OSM + throttling + cache
│   ├── cleanup-audio.js                # Endpoint cron penghapus rekaman audio > 30 hari
│   └── _lib/
│       └── requestGuard.js             # Penjaga permintaan AI: sesi pengguna & batas per jam
├── public/
│   ├── favicon.svg
│   └── locales/
│       ├── id.json                     # Kamus teks antarmuka Bahasa Indonesia
│       └── en.json                     # Kamus Bahasa Inggris (opsional, akhir project bila ada waktu)
├── src/
│   ├── assets/                         # Ikon SVG statis & ilustrasi
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx              # Header hitam/putih
│   │   │   ├── Footer.jsx
│   │   │   └── RequireAdmin.jsx        # Penjaga rute /admin
│   │   ├── home/
│   │   │   ├── MicHeroButton.jsx       # Tombol mikrofon besar #DC2626 + Web Audio API
│   │   │   └── ManualInputBtn.jsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.jsx          # Kontainer riwayat percakapan
│   │   │   ├── ChatBubble.jsx          # Bubble pesan AI (#171717) & User (#FFFFFF)
│   │   │   ├── ReportPreviewCard.jsx   # Kartu ringkasan + tombol edit inline
│   │   │   ├── LocationPickerModal.jsx # Pemilih GPS & pin peta mini
│   │   │   └── PhotoUploadInput.jsx
│   │   ├── map/
│   │   │   └── PublicReportMap.jsx     # Peta Leaflet.js + MarkerCluster
│   │   └── admin/
│   │       ├── AdminLoginForm.jsx
│   │       ├── AdminStatsBar.jsx
│   │       ├── ReportQueueTable.jsx
│   │       └── ReportEditModal.jsx
│   ├── config/
│   │   ├── firebase.js                 # Inisialisasi Firebase App, Auth, dan Firestore
│   │   └── constants.js                # Enum kategori, urgensi, status, palet warna
│   ├── context/
│   │   ├── LanguageContext.jsx         # State global bahasa (ID; EN opsional)
│   │   └── ReportDraftContext.jsx      # State global draf laporan aktif (halaman utama & chat)
│   ├── hooks/
│   │   ├── useAudioRecorder.js         # Logika perekaman suara, noise suppression, bitrate
│   │   ├── useSpeechSynthesis.js       # Logika Text-to-Speech (TTS) browser
│   │   └── useGeolocation.js           # Logika ambil koordinat GPS perangkat
│   ├── pages/
│   │   ├── HomePage.jsx                # Route: /
│   │   ├── ChatPage.jsx                # Route: /chat
│   │   ├── PublicMapPage.jsx           # Route: /peta
│   │   ├── AdminLoginPage.jsx          # Route: /admin/login
│   │   └── AdminDashboardPage.jsx      # Route: /admin
│   ├── services/
│   │   ├── apiClient.js                # Wrapper fetch ke /api/*
│   │   ├── apiMocks.js                 # Balasan contoh /api/* untuk mode mock (development)
│   │   ├── reportService.js            # Operasi CRUD Firestore, termasuk foto & rekaman (Bytes)
│   │   └── authService.js              # Silent Anonymous Auth & Admin Email/Password Auth
│   ├── utils/
│   │   ├── geohashHelper.js            # Generator geohash presisi 7 & 8
│   │   ├── imageCompressor.js          # Kompresi foto (maks 500 KB) & buang metadata EXIF
│   │   └── ticketGenerator.js          # Pembuat kode tiket format LPR-YYYY-XXXX
│   ├── App.jsx                         # Konfigurasi React Router DOM
│   ├── main.jsx                        # Entry point React
│   └── index.css                       # Konfigurasi Tailwind CSS & CSS Variables warna
├── .env.example                        # Template variabel environment
├── eslint.config.js                    # Aturan linting standar tim (ESLint flat config)
├── firebase.json                       # Konfigurasi Firestore Rules
├── firestore.rules                     # Aturan keamanan database (termasuk foto & rekaman)
├── package.json
└── vercel.json                         # Konfigurasi rewrites & cron job
```

### 7.2 Daftar Library & Dependencies Resmi (`package.json`)

| Kategori | Nama Package | Versi Target | Kegunaan Utama |
|---|---|---|---|
| **Core UI** | `react`, `react-dom` | `^19.3` | Library antarmuka utama |
| **Routing** | `react-router-dom` | `^7.18` | Navigasi halaman (`/`, `/chat`, `/peta`, `/admin`) |
| **Build Tool** | `vite`, `@vitejs/plugin-react` | `^8.3` / `^6.3` | Dev server, build, dan dukungan JSX React |
| **Styling** | `tailwindcss`, `@tailwindcss/vite` | `^4.3` | Utility-first CSS styling; plugin Vite untuk Tailwind v4 |
| **Icons** | `lucide-react` | `^1.72` | Ikon mikrofon, peta, kamera, status, dan admin |
| **Backend SDK (Client)** | `firebase` | `^13.3` | Firebase Auth dan Firestore (Firebase Storage tidak dipakai karena butuh paket Blaze) |
| **Maps** | `leaflet`, `react-leaflet`, `leaflet.markercluster` | `^1.9.4` / `^5.0` / `^1.5.3` | Peta interaktif OpenStreetMap & clustering |
| **Geohash** | `ngeohash` | `^0.6.4` | Enkode koordinat lat/lng ke string geohash presisi 7-8 |
| **Anti-Bot** | (tanpa library) | - | Batas permintaan per pengguna di server (`api/_lib/requestGuard.js`). Package `@marsidev/react-turnstile` masih tercantum di `package.json` tetapi tidak dipakai |
| **Server AI SDK** | `@google/genai` | `^3.3` | Pemanggilan model `gemini-3.5-flash` (tier gratis) di `/api/*` |
| **Server Firebase** | `firebase-admin` | `^14.5` | Verifikasi token admin & cron cleanup di server |
| **Linting** | `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | `^10.14` / `^10.0` / `^7.1` / `^0.5` / `^17.13` | Pemeriksaan kode lewat `npm run lint` |

Versi di tabel ini mengikuti `package.json` di repository. Anggota memasang dependency dengan `npm install` dari `package.json` dan `package-lock.json` yang sama, bukan memasang package satu per satu. React Compiler tidak dipakai.

Vite 8 membutuhkan Node.js `^20.19.0` atau `>=22.12.0`. Seluruh anggota memakai versi Node.js dalam rentang tersebut.

### 7.3 Kontrak Penamaan Variabel & Enum Global (`src/config/constants.js`)

Seluruh developer **dilarang** mengubah nama key objek maupun nilai string enum di bawah ini:

```javascript
// 1. Kategori Laporan Resmi
export const REPORT_CATEGORIES = [
  "Infrastruktur",
  "Kebersihan",
  "Keamanan",
  "Fasilitas Umum",
  "Lainnya"
];

// 2. Tingkat Urgensi Resmi
export const URGENCY_LEVELS = {
  EMERGENCY: "Darurat",
  HIGH: "Tinggi",
  NORMAL: "Normal"
};

// Urutan tampil antrean admin (indeks kecil = paling atas)
export const URGENCY_SORT_ORDER = ["Darurat", "Tinggi", "Normal"];

// Batas rekaman suara dan masa simpan rekaman
export const MAX_RECORDING_SECONDS = 120;
export const AUDIO_RETENTION_DAYS = 30;

// 3. Status Siklus Hidup Laporan Resmi
export const REPORT_STATUS = {
  PENDING: "pending",         // Baru dikirim warga, menunggu verifikasi admin
  VERIFIED: "verified",       // Disetujui admin, tampil di peta publik
  IN_PROGRESS: "in_progress", // Sedang ditindaklanjuti di lapangan
  RESOLVED: "resolved",       // Masalah selesai ditangani
  REJECTED: "rejected"        // Ditolak admin (spam/tidak valid)
};

// 4. Struktur State Draf Laporan (ReportDraftContext & API Payload)
export const INITIAL_REPORT_DRAFT = {
  ticketCode: "",             // string, contoh: "LPR-2026-4821"
  title: "",                  // string, maks 60 karakter
  category: "Lainnya",        // salah satu dari REPORT_CATEGORIES
  urgency: "Normal",          // salah satu dari URGENCY_LEVELS
  summary: "",                // string, ringkasan baku maks 1000 karakter
  rawTranscript: "",          // string, transkrip mentah; disimpan ke report_private, bukan reports
  audioBlob: null,            // Blob rekaman, hanya di memori browser sampai laporan dikirim
  hasPhoto: false,            // boolean, true jika laporan punya foto di report_photos
  latitude: null,             // number, wajib terisi sebelum submit
  longitude: null,            // number, wajib terisi sebelum submit
  address: "",                // string alamat hasil reverse geocoding
  geohash: "",                // string geohash presisi 7
  isValidReport: true,        // boolean hasil evaluasi AI
  audioQuality: "clear"       // "clear" | "low" | "unusable" | "text_input"
};
```

### 7.4 Daftar Variabel Environment (`.env.example`)

- **Frontend (Prefix `VITE_`):**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_USE_MOCK_API` (`"true"` atau `"false"`; mode mock, lihat bagian 7.5. Hanya berlaku saat `npm run dev`)
- **Backend Serverless (Rahasia Server):**
  - `GEMINI_API_KEY` (dua key terpisah dengan nama variabel yang sama: key development untuk `.env.local` dan environment Preview/Development di Vercel, key demo hanya untuk environment Production, agar kuota demo tidak terpakai saat pengembangan)
  - `AI_REPORT_LIMIT_PER_HOUR` dan `AI_CHAT_LIMIT_PER_HOUR` (opsional; batas permintaan AI per pengguna per jam, bawaan 20 dan 60)
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - `OSM_CONTACT_EMAIL`
  - `CRON_SECRET` (di PDF tertulis lepas di akhir dokumen; dipakai Endpoint 4)

### 7.5 Kontrak Fungsi Service (`src/services/*`)

Halaman dan komponen **dilarang** memanggil Firestore atau `fetch` ke `/api/*` secara langsung; semuanya lewat fungsi di bawah ini. Nama fungsi, urutan parameter, dan bentuk nilai kembalian tidak boleh diubah tanpa persetujuan Project Lead. Semua fungsi bersifat `async`. Saat gagal, fungsi melempar `Error` dengan properti `code` (lihat format error di bagian 8.2).

#### `reportService.js`

Objek `report` pada tabel ini adalah isi dokumen `reports` ditambah `id` (ID dokumen Firestore).

| Fungsi | Parameter | Nilai Kembalian | Dipakai Oleh | Keterangan |
|---|---|---|---|---|
| `createReport(draft, photoFile, audioBlob)` | `draft`: objek `INITIAL_REPORT_DRAFT` yang sudah terisi; `photoFile`: `File`/`Blob` hasil `imageCompressor.js` atau `null`; `audioBlob`: `Blob` atau `null` | `{ reportId, ticketCode }` | Halaman chat | Membuat kode tiket, lalu menulis sampai empat dokumen dalam satu batch: `reports/{reportId}`, `report_private/{reportId}`, `report_photos/{reportId}` (jika ada foto), dan `report_audio/{reportId}` (jika ada rekaman). Melempar `PHOTO_TOO_LARGE` jika foto di atas 500 KB. |
| `listPublicReports()` | tidak ada | `report[]` | Peta publik | Hanya laporan berstatus `verified`, `in_progress`, atau `resolved`. Query wajib memfilter status agar lolos Security Rules. |
| `listReportsForAdmin(status)` | `status`: salah satu `REPORT_STATUS`, atau `null` untuk semua | `report[]` | Dashboard admin | Hasil sudah diurutkan sesuai aturan antrean di bagian 5.1. |
| `getReportPrivate(reportId)` | `reportId`: string | `{ rawTranscript, reporterUid, adminNotes, hasAudio }` | Dashboard admin | Khusus admin. |
| `getReportPhotoUrl(reportId)` | `reportId`: string | string URL sementara, atau `null` jika tidak ada foto | Peta publik, dashboard admin | Dipanggil hanya untuk laporan dengan `hasPhoto: true`, saat laporan dibuka. |
| `getReportAudioUrl(reportId)` | `reportId`: string | string URL sementara, atau `null` jika tidak ada rekaman | Dashboard admin | Untuk tombol "Putar Rekaman". Khusus admin. |
| `updateReport(reportId, fields)` | `fields`: sebagian dari `title`, `category`, `urgency`, `summary`, `address` | tidak ada | Dashboard admin | Koreksi data sebelum publikasi. Mengisi `updatedAt`. |
| `updateReportStatus(reportId, status, adminNotes)` | `status`: salah satu `REPORT_STATUS`; `adminNotes`: string atau `null` | tidak ada | Dashboard admin | Menulis `status` ke `reports` dan `adminNotes` ke `report_private`. |
| `deleteReport(reportId)` | `reportId`: string | tidak ada | Dashboard admin | Menghapus dokumen `reports`, `report_private`, `report_photos`, dan `report_audio` milik laporan itu. |

URL sementara dari `getReportPhotoUrl` dan `getReportAudioUrl` dibuat dengan `URL.createObjectURL`. Komponen yang memakainya wajib melepasnya dengan `URL.revokeObjectURL` saat ditutup.

#### `authService.js`

| Fungsi | Parameter | Nilai Kembalian | Keterangan |
|---|---|---|---|
| `signInAnonymouslySilent()` | tidak ada | `user` | Dipanggil sekali saat aplikasi dibuka. Jika sudah ada sesi, sesi itu dipakai. |
| `signInAdmin(email, password)` | string, string | `user` | Login admin di `/admin/login`. |
| `signOutAdmin()` | tidak ada | tidak ada | Setelah logout, aplikasi kembali ke sesi anonim. |
| `onAuthChange(callback)` | `callback(user)` | fungsi `unsubscribe` | Satu-satunya fungsi yang tidak `async`. |
| `isAdminUser(user)` | `user` | boolean | `true` jika email pengguna adalah `admin@laporin.id`. |
| `getIdToken()` | tidak ada | string | Tanda pengenal sesi untuk header `Authorization` ke `/api/*`; string kosong jika sesi gagal dibuat. Dipakai `apiClient.js`. |

#### `apiClient.js`

| Fungsi | Parameter | Nilai Kembalian | Endpoint |
|---|---|---|---|
| `processReport({ audioBlob, textInput })` | salah satu dari `audioBlob` atau `textInput` wajib ada | `{ draft, aiMessage }` | `POST /api/process-report` |
| `sendChatMessage({ userMessage, currentDraft, recentHistory })` | sesuai Request JSON Endpoint 2 | `{ updatedFields, aiMessage }` | `POST /api/chat-assistant` |
| `reverseGeocode(latitude, longitude)` | number, number | `{ address, geohash, source }` | `GET /api/reverse-geocode` |

**Mode mock.** Jika `.env.local` berisi `VITE_USE_MOCK_API=true` dan aplikasi dijalankan dengan `npm run dev`, ketiga fungsi di atas membalas data contoh dari `src/services/apiMocks.js` tanpa memanggil `/api/*`. Tujuannya dua: tampilan bisa dikerjakan sebelum endpoint jadi, dan kuota Gemini tidak terpakai saat pengembangan. Bentuk balasannya sama dengan bagian 8.2. Mode ini tidak pernah aktif di build produksi. Untuk menguji endpoint sungguhan, isi `VITE_USE_MOCK_API=false`.

#### `useReportDraft()` (`src/hooks/useReportDraft.js` dan `src/context/ReportDraftContext.jsx`)

Draf laporan dibagi antara halaman utama (memulai) dan halaman chat (mengisi). Draf, termasuk rekaman suara, hanya hidup di memori browser.

| Nama | Bentuk | Dipakai Oleh | Keterangan |
|---|---|---|---|
| `draft` | objek `INITIAL_REPORT_DRAFT` | Halaman chat | Isi laporan yang sedang dibuat. Rekaman ada di `draft.audioBlob`. |
| `inputMode` | `"audio"`, `"manual"`, atau `null` | Halaman chat | `null` berarti belum ada draf. |
| `startDraft({ inputMode, audioBlob })` | `audioBlob`: `Blob`, hanya untuk `"audio"` | Halaman utama | Memulai draf baru, lalu halaman utama pindah ke `/chat`. |
| `updateDraft(fields)` | `fields`: sebagian isi draf | Halaman chat | Menggabungkan `fields` ke draf, misalnya hasil AI atau koreksi warga. |
| `resetDraft()` | tidak ada | Halaman chat | Mengosongkan draf setelah laporan terkirim. |

Aturan serah terima:

- Halaman utama **tidak** mengirim data lewat state navigasi; ia memanggil `startDraft(...)` lalu `navigate("/chat")`.
- Jika `/chat` dibuka saat `inputMode` bernilai `null` (misalnya setelah halaman dimuat ulang), warga dikembalikan ke halaman utama.
- `processReport` dan `sendChatMessage` otomatis menyertakan tanda pengenal sesi pengguna (header `Authorization`, diambil lewat `getIdToken()` di `authService.js`). Halaman tidak perlu mengurus token apa pun.

---

## 8. Arsitektur Backend Detail (Database, Endpoint, & Security Rules)

### 8.1 Struktur Database Cloud Firestore

#### Koleksi 1: `reports` (Dokumen Utama Laporan Warga)

Setiap dokumen menggunakan ID otomatis Firestore (`reportId`):

| Nama Field | Tipe Data | Wajib | Keterangan & Validasi |
|---|---|---|---|
| `ticketCode` | `string` | Ya | Kode unik pelacakan warga (contoh: `"LPR-2026-1094"`) |
| `title` | `string` | Ya | Judul singkat laporan (maksimal 60 karakter) |
| `category` | `string` | Ya | `"Infrastruktur"`, `"Kebersihan"`, `"Keamanan"`, `"Fasilitas Umum"`, `"Lainnya"` |
| `urgency` | `string` | Ya | `"Darurat"`, `"Tinggi"`, `"Normal"` |
| `summary` | `string` | Ya | Ringkasan laporan bahasa Indonesia baku (maksimal 1000 karakter) |
| `hasPhoto` | `boolean` | Ya | `true` jika laporan punya foto di `report_photos/{reportId}` |
| `latitude` | `number` | Ya | Koordinat lintang (`-90` s/d `90`) |
| `longitude` | `number` | Ya | Koordinat bujur (`-180` s/d `180`) |
| `address` | `string` | Ya | Nama jalan/kelurahan/kecamatan hasil reverse geocoding |
| `geohash` | `string` | Ya | Kode geohash presisi 7 karakter untuk clustering peta |
| `status` | `string` | Ya | Default saat dibuat: `"pending"`. Admin dapat mengubah ke `"verified"`, `"in_progress"`, `"resolved"`, `"rejected"` |
| `isValidReport` | `boolean` | Ya | Hasil deteksi keabsahan laporan oleh Gemini AI |
| `audioQuality` | `string` | Ya | `"clear"`, `"low"`, `"unusable"`, atau `"text_input"` |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()` saat laporan dikirim |
| `updatedAt` | `timestamp` | Ya | `serverTimestamp()` saat status diperbarui |

Dokumen `reports` dapat dibaca publik setelah diverifikasi, dan Security Rules Firestore tidak bisa menyembunyikan field satu per satu. Karena itu data yang tidak boleh terlihat publik disimpan di koleksi `report_private`. Koordinat `latitude` dan `longitude` tetap disimpan persis dan tampil di peta publik.

#### Koleksi 2: `report_private` (Data Privat Laporan, Khusus Admin)

Document ID sama dengan `reportId` pada koleksi `reports`. Dibuat oleh pelapor bersamaan dengan dokumen `reports`; setelah itu hanya admin yang dapat membaca, mengubah, dan menghapusnya.

| Nama Field | Tipe Data | Wajib | Keterangan & Validasi |
|---|---|---|---|
| `reporterUid` | `string` | Ya | UID dari Firebase Anonymous Auth (`request.auth.uid`) |
| `rawTranscript` | `string` | Tidak | Teks asli sebelum normalisasi AI, untuk audit admin |
| `hasAudio` | `boolean` | Ya | `true` jika rekaman ada di `report_audio/{reportId}`; `false` jika laporan diketik atau rekaman sudah dihapus cron |
| `adminNotes` | `string` | Tidak | Catatan verifikasi atau alasan penolakan oleh Admin |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()` saat laporan dikirim |

#### Koleksi 3: `report_photos` (Foto Bukti)

Firebase Storage tidak dipakai karena membutuhkan paket Blaze. Foto dan rekaman disimpan di Firestore sebagai tipe `Bytes`, dengan batas satu dokumen 1 MiB. Keduanya tidak ditaruh di dokumen `reports` agar daftar laporan di peta tidak ikut mengunduh semua file. Document ID sama dengan `reportId`.

| Nama Field | Tipe Data | Wajib | Keterangan & Validasi |
|---|---|---|---|
| `data` | `bytes` | Ya | Isi foto hasil kompresi, maksimal 600 KB (target kompresi 500 KB) |
| `contentType` | `string` | Ya | `"image/jpeg"` atau `"image/webp"` |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()` |

Dokumen ini terbaca publik setelah laporannya diverifikasi, sehingga sengaja tidak memuat `reporterUid`.

#### Koleksi 4: `report_audio` (Rekaman Suara, Khusus Admin)

Document ID sama dengan `reportId`. Dihapus cron `cleanup-audio` setelah 30 hari.

| Nama Field | Tipe Data | Wajib | Keterangan & Validasi |
|---|---|---|---|
| `data` | `bytes` | Ya | Isi rekaman, maksimal 700 KB |
| `contentType` | `string` | Ya | `audio/webm`, `audio/mp4`, atau `audio/ogg` |
| `reporterUid` | `string` | Ya | UID pelapor |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()`, dipakai cron untuk menghitung umur |

#### Koleksi 5: `geocode_cache` (Cache Alamat OSM Nominatim)

Document ID menggunakan string `geohash` presisi 7 (contoh: `"w22z9x4"`):

| Nama Field | Tipe Data | Keterangan |
|---|---|---|
| `address` | `string` | Alamat hasil reverse geocoding (kelurahan/jalan umum tanpa nomor rumah) |
| `cachedAt` | `timestamp` | Waktu penyimpanan cache (masa berlaku 30 hari) |

#### Koleksi 6: `rate_limits` (Batas Permintaan AI per Pengguna)

Pengganti Cloudflare Turnstile. Document ID adalah UID pengguna (termasuk sesi anonim). Hanya ditulis server lewat `api/_lib/requestGuard.js`; browser tidak punya akses. Tiap dokumen memuat dua penghitung:

| Nama Field | Tipe Data | Keterangan |
|---|---|---|
| `report.count` | `number` | Jumlah panggilan `/api/process-report` dalam jendela berjalan (bawaan maksimal `20` per jam) |
| `report.windowStart` | `number` | Awal jendela satu jam, dalam milidetik |
| `chat.count` | `number` | Jumlah panggilan `/api/chat-assistant` dalam jendela berjalan (bawaan maksimal `60` per jam) |
| `chat.windowStart` | `number` | Awal jendela satu jam, dalam milidetik |

Angkanya lebih longgar daripada "5 laporan per jam" di PRD awal, karena yang dihitung adalah panggilan AI (termasuk percobaan tidak valid dan "Coba Lagi"), bukan laporan terkirim. Batas dapat diubah lewat `AI_REPORT_LIMIT_PER_HOUR` dan `AI_CHAT_LIMIT_PER_HOUR`.

### 8.2 Spesifikasi Lengkap API Endpoints (`/api/*`)

#### Format Error Seragam (Semua Endpoint)

Setiap endpoint yang gagal membalas dengan status HTTP `4xx` atau `5xx` dan satu bentuk JSON yang sama:

```json
{
  "success": false,
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "Asisten sedang tidak tersedia. Silakan coba lagi."
  }
}
```

- `message` adalah kalimat singkat yang aman ditampilkan ke warga. Rincian teknis (stack trace, pesan asli dari Gemini atau Firebase) hanya ditulis ke log server.
- `apiClient.js` mengubah balasan ini menjadi `Error` dengan properti `code`. Frontend menentukan alur gagal (bagian 3) dari `code`, bukan dari isi `message`.
- Nilai `code` yang berlaku:

| `code` | Status HTTP | Arti |
|---|---|---|
| `INVALID_INPUT` | `400` | Payload kosong, salah format, atau rekaman melebihi 120 detik |
| `UNAUTHORIZED` | `401` | Tanda pengenal sesi tidak ada atau tidak sah (Endpoint 1 dan 2), atau `CRON_SECRET` salah (Endpoint 4) |
| `RATE_LIMITED` | `429` | Batas permintaan AI per pengguna per jam terlampaui |
| `AI_QUOTA_EXCEEDED` | `429` | Kuota Gemini habis |
| `AI_UNAVAILABLE` | `502` | Gemini gagal atau timeout |
| `GEOCODE_FAILED` | `502` | Nominatim gagal atau timeout |
| `INTERNAL_ERROR` | `500` | Kegagalan lain di server |

#### Endpoint 1: `POST /api/process-report`

- **Fungsi:** Memproses input pertama warga (file audio rekaman atau teks manual) menjadi draf laporan terstruktur menggunakan Gemini 3.5 Flash.
- **Headers:** `Content-Type: application/json` (untuk audio maupun teks), `Authorization: Bearer <idToken>` (tanda pengenal sesi Firebase, termasuk sesi anonim).
- **Request Payload (JSON):**
  - `audioBase64` (String, opsional jika `textInput` ada): isi rekaman dalam base64, tanpa awalan `data:`. Rekaman maksimal 120 detik (sekitar 360 KB, menjadi sekitar 480 KB setelah base64). `multipart/form-data` tidak dipakai karena membutuhkan package pengurai di server.
  - `audioMimeType` (String, wajib jika `audioBase64` ada): misalnya `"audio/webm;codecs=opus"` atau `"audio/mp4"`.
  - `textInput` (String, opsional jika `audioBase64` ada)
  - Endpoint ini tidak menyimpan audio; penyimpanan dilakukan frontend saat laporan dikirim.
  - `language` (`"id"`; `"en"` menyusul apabila bahasa Inggris dikerjakan)
- **Proses Backend:**
  1. Jalankan penjaga permintaan (`api/_lib/requestGuard.js`): periksa tanda pengenal sesi, lalu hitung pemakaian pengguna di `rate_limits`. Tanpa tanda pengenal yang sah dibalas `401 UNAUTHORIZED`; melewati batas dibalas `429 RATE_LIMITED`. Jika kunci service account tidak terbaca atau Firestore gagal, permintaan tetap diproses dan sebabnya dicatat di log, agar kesalahan pengaturan server tidak memblokir warga. Endpoint 2 (`chat-assistant`) memakai penjaga yang sama.
  2. Kirim audio/teks ke Gemini 3.5 Flash dengan `responseSchema` terkunci, `maxOutputTokens: 1024`, `thinkingBudget: 0`, dan instruksi normalisasi dialek & gangguan bicara. Audio diteruskan ke Gemini sebagai data inline (base64 dan MIME type dari payload).
- **Response JSON (`200 OK`):**

```json
{
  "success": true,
  "draft": {
    "title": "Jalan Berlubang Depan Pasar",
    "category": "Infrastruktur",
    "urgency": "Tinggi",
    "summary": "Terdapat lubang besar di badan jalan depan pasar yang membahayakan pengendara motor.",
    "rawTranscript": "anu pak ini jalan di depan pasar lubang besar sekali...",
    "isValidReport": true,
    "audioQuality": "clear"
  },
  "aiMessage": "Saya sudah merangkum laporan Anda. Apakah Anda memiliki foto kondisi jalan tersebut? Jika ada silakan unggah, atau tekan Lewati."
}
```

#### Endpoint 2: `POST /api/chat-assistant`

- **Fungsi:** Memandu kelengkapan data di halaman chat dan menangani perintah **edit laporan** secara natural oleh pengguna.
- **Request JSON:**

```json
{
  "userMessage": "Tolong ubah tingkat urgensinya jadi Darurat karena sudah ada motor jatuh",
  "currentDraft": {
    "title": "Jalan Berlubang Depan Pasar",
    "category": "Infrastruktur",
    "urgency": "Tinggi",
    "summary": "Terdapat lubang besar di badan jalan depan pasar.",
    "address": "Jl. Raya Pasar, Padang",
    "hasPhoto": false
  },
  "recentHistory": [
    { "role": "model", "text": "Silakan tentukan lokasi kejadian." }
  ],
  "language": "id"
}
```

- **Response JSON (`200 OK`):**

```json
{
  "success": true,
  "updatedFields": {
    "urgency": "Darurat",
    "summary": "Terdapat lubang besar di badan jalan depan pasar yang sudah menyebabkan pengendara motor terjatuh."
  },
  "aiMessage": "Baik, tingkat urgensi sudah saya ubah menjadi Darurat dan ringkasan diperbarui. Silakan periksa kartu pratinjau lalu tekan Kirim Laporan jika sudah sesuai."
}
```

#### Endpoint 3: `GET /api/reverse-geocode?lat=-0.9471&lng=100.4172`

- **Fungsi:** Mengubah koordinat GPS menjadi alamat terbaca manusia dengan mematuhi batas rate-limit Nominatim OSM (maksimal 1 request/detik) dan Geohash Cache.
- **Proses Backend:**
  1. Hitung `geohash` presisi 7 dari `lat` dan `lng`.
  2. Cek dokumen di koleksi Firestore `geocode_cache/{geohash}`. Jika ada dan belum kedaluwarsa (< 30 hari), langsung kembalikan alamat dari cache tanpa memanggil OSM.
  3. Jika tidak ada di cache, antrekan request (jeda minimal `1100 ms`) lalu panggil `https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...` dengan header `User-Agent: LaporInApp/0.1 (contact@laporin.id)`.
  4. Simpan hasil ke `geocode_cache/{geohash}` dan kembalikan ke frontend.
- **Response JSON (`200 OK`):**

```json
{
  "success": true,
  "address": "Kelurahan Belakang Tangsi, Kecamatan Padang Barat, Kota Padang",
  "geohash": "w0x8z9q",
  "source": "osm_live"
}
```

#### Endpoint 4: `GET /api/cleanup-audio`

- **Fungsi:** Cron job harian (pukul `02:00 WIB`) untuk menghapus dokumen di koleksi `report_audio` yang `createdAt`-nya lebih dari 30 hari dan mengubah `hasAudio` menjadi `false` pada dokumen `report_private` terkait, agar janji retensi kepada warga terpenuhi dan pemakaian Firestore tetap di bawah batas gratis. Eksekusi selesai di bawah `10 detik` (batas timeout Vercel Free Tier).
- **Keamanan:** Memvalidasi header `Authorization: Bearer <CRON_SECRET>`.

### 8.3 Firebase Security Rules (`firestore.rules`)

#### `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.token.email == "admin@laporin.id"
      );
    }

    match /reports/{reportId} {
      // Publik hanya bisa membaca laporan yang sudah diverifikasi atau ditindaklanjuti
      allow read: if resource.data.status in ["verified", "in_progress", "resolved"] || isAdmin();

      // Warga anonim terautentikasi dapat membuat laporan baru (foto opsional, lokasi wajib)
      // Data privat (reporterUid, rawTranscript, adminNotes) tidak boleh ada di dokumen ini
      allow create: if request.auth != null
                    && !request.resource.data.keys().hasAny(["reporterUid", "rawTranscript", "adminNotes", "hasAudio"])
                    && request.resource.data.status == "pending"
                    && request.resource.data.latitude is number
                    && request.resource.data.longitude is number
                    && request.resource.data.title is string
                    && request.resource.data.title.size() > 0
                    && request.resource.data.title.size() <= 60
                    && request.resource.data.summary is string
                    && request.resource.data.summary.size() <= 1000
                    && request.resource.data.hasPhoto is bool;

      // Hanya 1 akun Admin yang dapat memverifikasi, mengedit, atau menghapus laporan
      allow update, delete: if isAdmin();
    }

    match /report_private/{reportId} {
      // Pelapor hanya bisa membuat data privat miliknya sendiri, dan tidak bisa membacanya kembali
      allow create: if request.auth != null
                    && request.resource.data.reporterUid == request.auth.uid;

      allow read, update, delete: if isAdmin();
    }

    match /report_photos/{reportId} {
      // Foto hanya terbaca jika laporannya sudah diverifikasi, atau oleh admin
      allow get: if isAdmin()
                 || get(/databases/$(database)/documents/reports/$(reportId)).data.status
                    in ["verified", "in_progress", "resolved"];

      allow create: if request.auth != null
                    && request.resource.data.data is bytes
                    && request.resource.data.data.size() <= 600 * 1024
                    && request.resource.data.contentType in ["image/jpeg", "image/webp"];

      allow delete: if isAdmin();
    }

    match /report_audio/{reportId} {
      // Rekaman hanya bisa didengar admin; dihapus cron setelah 30 hari
      allow create: if request.auth != null
                    && request.resource.data.reporterUid == request.auth.uid
                    && request.resource.data.data is bytes
                    && request.resource.data.data.size() <= 700 * 1024
                    && request.resource.data.contentType.matches('audio/(webm|mp4|ogg).*');

      allow get, delete: if isAdmin();
    }

    match /geocode_cache/{geohash} {
      allow read: if true;
      allow write: if false; // Hanya ditulis oleh server via Firebase Admin SDK
    }
  }
}
```

Foto disimpan setelah melewati `imageCompressor.js`, yang menggambar ulang gambar sehingga metadata EXIF (termasuk koordinat GPS dan model perangkat) tidak ikut tersimpan.

---

## 9. Pembagian Tugas Tim Minimize (5 Anggota) & Alur GitHub

### 9.1 Strategi Branching GitHub (`main` sebagai Branch Utama)

1. **`main`:** Branch produksi stabil. Dilindungi (*Branch Protection*): tidak boleh `git push` langsung ke `main`; semua perubahan wajib melalui **Pull Request (PR)** dan direview minimal oleh 1 anggota lain.
2. **Nama Branch Kerja:** setiap anggota bekerja di satu branch bernama dirinya sendiri (huruf kecil):
   - `fikri`
   - `irfan`
   - `nugi`
   - `zikri`
   - `taqi`
3. **Aturan Commit Message:** Gunakan format konvensional: `feat: ...`, `fix: ...`, `style: ...`, `docs: ...`.

### 9.2 Matriks Pembagian Tugas Detail (Anggota 1 - Anggota 5)

| Anggota | Peran & Fokus Modul | File & Folder Tanggung Jawab Utama | Deliverables Wajib |
|---|---|---|---|
| **Fikri** | **Project Lead, Scaffold Project, Firebase Core, Auth & Security Rules** | `src/config/firebase.js`, `src/config/constants.js`, `src/services/authService.js`, `src/services/reportService.js`, `src/services/apiClient.js`, `src/context/LanguageContext.jsx`, `src/App.jsx`, `src/main.jsx`, `src/index.css`, `src/components/common/Footer.jsx`, `firestore.rules`, `firebase.json`, `vercel.json`, `package.json`, `.env.example`, `eslint.config.js`, `public/locales/id.json` | Setup repo GitHub & Vercel, scaffold project (routing semua halaman di `App.jsx`, konfigurasi Tailwind & CSS Variables, `apiClient`), inisialisasi Firebase (Silent Auth + Akun `admin@laporin.id`), deployment Security Rules, dan kamus teks antarmuka `id.json`. |
| **Irfan** | **Homepage UI, Web Audio Recorder & Aksesibilitas Suara** | `src/pages/HomePage.jsx`, `src/components/home/*`, `src/hooks/useAudioRecorder.js`, `src/hooks/useSpeechSynthesis.js`, `src/components/common/Navbar.jsx` | Membangun Homepage palet Hitam-Merah-Putih, tombol mikrofon besar `#DC2626`, tombol ketik manual, perekaman suara *noise-suppressed*, dan fitur TTS pembaca balasan AI. |
| **Nugi** | **Halaman Chat Interaktif, Integrasi Gemini AI & Fitur Edit Laporan** | `src/pages/ChatPage.jsx`, `src/components/chat/*`, `src/context/ReportDraftContext.jsx`, `api/process-report.js`, `api/chat-assistant.js`, `src/utils/imageCompressor.js` | Membangun halaman chat interaktif, kartu pratinjau laporan yang bisa diedit via chat maupun klik langsung, upload foto opsional, serta endpoint Gemini 3.5 Flash hemat token. |
| **Zikri** | **Geolocation, Nominatim OSM Queue & Peta Publik Leaflet** | `src/pages/PublicMapPage.jsx`, `src/components/map/PublicReportMap.jsx`, `src/hooks/useGeolocation.js`, `src/utils/geohashHelper.js`, `api/reverse-geocode.js`, `api/cleanup-audio.js` | Membangun fitur deteksi lokasi GPS, pemilih pin peta di chat, endpoint reverse geocoding dengan antrean 1 req/dtk & cache Geohash, serta peta publik ber-cluster. |
| **Taqi** | **Dashboard Admin Tunggal & Alur Verifikasi Laporan** | `src/pages/AdminLoginPage.jsx`, `src/pages/AdminDashboardPage.jsx`, `src/components/admin/*`, `src/utils/ticketGenerator.js` | Membangun halaman login khusus `admin@laporin.id`, tabel antrean verifikasi laporan, highlight merah darurat, modal edit koreksi admin, dan tombol ubah status laporan. |

---

## 10. Glosarium Istilah Teknis

| Istilah | Definisi dalam Konteks Project Lapor.in |
|---|---|
| **Anonymous Auth (Silent Auth)** | Metode autentikasi Firebase yang membuatkan identitas sesi (`UID`) secara otomatis di latar belakang tanpa meminta warga mendaftar akun, mengisi email, atau membuat kata sandi. |
| **Batas Permintaan per Pengguna** | Perlindungan dari penyalahgunaan endpoint AI: server memeriksa sesi Firebase pengguna dan membatasi jumlah permintaannya per jam. Menggantikan Cloudflare Turnstile, yang dihapus saat hackathon. |
| **Disfluency Normalization** | Proses pembersihan transkrip suara oleh AI untuk merapikan pengulangan suku kata, jeda panjang, atau artikulasi terbata (seperti pada pengguna gagap) menjadi kalimat yang utuh dan mudah dipahami. |
| **Geohash** | Sistem pengkodean koordinat geografis (`latitude` dan `longitude`) menjadi rangkaian huruf dan angka pendek (presisi 7 karakter mencakup area sekitar `150m x 150m`) untuk efisiensi cache alamat dan pengelompokan pin peta. |
| **Marker Clustering** | Teknik penggabungan beberapa pin laporan yang berdekatan di peta Leaflet.js menjadi satu lingkaran angka agar tampilan peta tetap bersih dan tidak menumpuk. |
| **Noise Suppression** | Fitur pemrosesan sinyal audio pada Web Audio API browser yang meredam suara kebisingan latar belakang (angin, kendaraan) sehingga suara manusia terdengar lebih jernih. |
| **Response Schema Lock** | Teknik penguncian format keluaran pada Gemini API agar AI wajib membalas dalam struktur data JSON tertentu secara konsisten dan tidak menghasilkan teks bebas yang merusak aplikasi. |
| **Reverse Geocoding** | Proses mengubah data koordinat angka GPS (`latitude`, `longitude`) menjadi nama alamat yang dapat dibaca manusia (nama jalan, kelurahan, kecamatan) menggunakan API OpenStreetMap Nominatim. |
| **Sliding Window History** | Strategi efisiensi token AI dengan hanya mengirimkan sejumlah pesan percakapan terakhir (maksimal 4 pesan) ke server AI, bukan seluruh riwayat percakapan dari awal. |
| **Text-to-Speech (TTS)** | Teknologi Web Speech Synthesis bawaan browser yang membacakan teks balasan asisten AI menjadi suara secara otomatis untuk membantu warga lansia dan penyandang disabilitas netra. |

---

## Notulen 13 Nov 2026

Catatan rapat di akhir PDF. Belum dijabarkan di bagian mana pun di atas.

- Relasi antar tabel
- Tambahan backend error untuk developer (lengkap) dengan user (umum dan aman) dipisah
- Tailwind CSS v4
- PRD dalam file md
