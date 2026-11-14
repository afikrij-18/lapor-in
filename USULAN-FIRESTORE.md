# Usulan: Menyimpan Foto dan Rekaman di Firestore

- **Tanggal:** 14 November 2026
- **Status:** Disetujui (pilihan B, Firestore saja) saat hackathon dimulai. Sudah diterapkan ke `PRD.md`; jika ada selisih, yang berlaku adalah `PRD.md`.
- **Menyangkut PRD bagian:** 3, 7.1, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3

## 1. Masalah

PRD menyimpan foto bukti dan rekaman audio di Firebase Storage. Saat Storage diaktifkan di Firebase Console, muncul pesan:

> Storage requires a billing account (Blaze). Upgrade your project now and get $300 in free-of-charge credit to try Storage.

Artinya Storage tidak tersedia di paket gratis (Spark). Untuk memakainya, project harus dinaikkan ke paket Blaze, yang mewajibkan akun billing dengan kartu pembayaran.

## 2. Pilihan

| | A. Blaze + Storage | B. Firestore saja |
|---|---|---|
| Kartu pembayaran | Wajib | Tidak perlu |
| Biaya pada skala demo | Kemungkinan Rp 0, karena Blaze tetap punya jatah gratis (angkanya belum diverifikasi) | Rp 0 |
| Perubahan PRD | Tidak ada | Tujuh bagian (lihat bagian 4) |
| Ukuran foto tersimpan | Sampai 1 MB | Sekitar 500 KB |
| Kecepatan memuat foto | Lebih cepat (lewat CDN) | Lebih lambat |
| Prinsip "Zero-Cost Architecture" (PRD 1.1) | Melemah, karena butuh akun billing | Tetap utuh |

**Usul: pilihan B.** Biaya Rp 0 tertulis sebagai latar belakang produk di PRD, dan tim tidak perlu mendaftarkan kartu. Kelemahannya dapat diterima untuk skala hackathon.

## 3. Cara Kerja Pilihan B

Firestore punya tipe data `Bytes` untuk menyimpan data biner. Batasnya: satu dokumen maksimal 1 MiB.

| File | Ukuran | Muat dalam satu dokumen? |
|---|---|---|
| Rekaman 120 detik pada 24 kbps | sekitar 360 KB | Ya |
| Foto hasil kompresi | diturunkan ke maksimal 500 KB | Ya |

Tiga aturan rancangan:

1. **File disimpan sebagai `Bytes`, bukan teks base64.** Base64 menambah ukuran sekitar sepertiga.
2. **File tidak ditaruh di dokumen `reports`.** Peta publik memuat daftar laporan sekaligus; kalau foto ada di dokumen itu, semua foto ikut terunduh. Foto dan rekaman mendapat koleksi sendiri dan baru dimuat saat dibutuhkan.
3. **ID dokumen file sama dengan `reportId`.** Satu laporan punya paling banyak satu foto dan satu rekaman, sehingga tidak perlu field penunjuk lokasi.

Cara menampilkan file di browser: ambil dokumen, ubah `Bytes` menjadi `Blob`, lalu buat alamat sementara dengan `URL.createObjectURL`. Alamat itu dipakai sebagai `src` pada `<img>` atau `<audio>`.

## 4. Perubahan PRD yang Diusulkan

### 4.1 Koleksi baru (bagian 8.1)

**`report_photos/{reportId}`**: foto bukti, terbaca publik setelah laporan diverifikasi.

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `data` | `bytes` | Ya | Isi foto, maksimal 600 KB |
| `contentType` | `string` | Ya | `"image/jpeg"` atau `"image/webp"` |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()` |

Dokumen ini sengaja tidak memuat `reporterUid`, karena terbaca publik.

**`report_audio/{reportId}`**: rekaman suara, hanya terbaca admin, dihapus setelah 30 hari.

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `data` | `bytes` | Ya | Isi rekaman, maksimal 700 KB |
| `contentType` | `string` | Ya | `audio/webm`, `audio/mp4`, atau `audio/ogg` |
| `reporterUid` | `string` | Ya | UID pelapor |
| `createdAt` | `timestamp` | Ya | `serverTimestamp()`, dipakai cron untuk menghitung umur |

### 4.2 Field yang berubah (bagian 7.3 dan 8.1)

| Lokasi | Sekarang di PRD | Usulan |
|---|---|---|
| `reports` dan `INITIAL_REPORT_DRAFT` | `photoUrl` (string URL atau `null`) | `hasPhoto` (boolean) |
| `report_private` | `audioPath` (string atau `null`) | `hasAudio` (boolean) |

### 4.3 Batas ukuran foto (bagian 3 dan 7.1)

- Batas file yang dipilih warga tetap 5 MB.
- `imageCompressor.js` mengompres sampai maksimal **500 KB** (semula di bawah 1 MB) dan tetap membuang metadata EXIF.
- Jika hasil kompresi masih di atas 500 KB, warga ditawari mengirim laporan tanpa foto.

### 4.4 Security Rules (bagian 8.3)

`storage.rules` dihapus. `firestore.rules` ditambah dua blok berikut. Blok ini belum diuji di Firebase.

```javascript
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
  allow create: if request.auth != null
                && request.resource.data.reporterUid == request.auth.uid
                && request.resource.data.data is bytes
                && request.resource.data.data.size() <= 700 * 1024
                && request.resource.data.contentType.matches('audio/(webm|mp4|ogg).*');

  allow get, delete: if isAdmin();
}
```

Aturan `create` pada `reports` juga disesuaikan: pemeriksaan `photoUrl` diganti `request.resource.data.hasPhoto is bool`.

### 4.5 Kontrak fungsi `reportService.js` (bagian 7.5)

| Fungsi | Sekarang di PRD | Usulan |
|---|---|---|
| `createReport(draft, photoFile, audioBlob)` | Mengunggah file ke Storage, lalu menulis `reports` dan `report_private` | Menulis sampai empat dokumen dalam satu batch: `reports`, `report_private`, `report_photos` (jika ada foto), `report_audio` (jika ada rekaman). Parameter dan nilai kembalian tidak berubah |
| `getReportPhotoUrl(reportId)` | Belum ada | **Baru.** Mengembalikan alamat sementara foto, atau `null` jika tidak ada. Dipakai peta publik, kartu pratinjau, dan dashboard admin |
| `getReportAudioUrl(...)` | Menerima `audioPath` | Menerima `reportId`. Khusus admin |
| `getReportPrivate(reportId)` | Mengembalikan `audioPath` | Mengembalikan `hasAudio` |
| `deleteReport(reportId)` | Menghapus dua dokumen dan dua file Storage | Menghapus empat dokumen |

Alamat sementara dari `getReportPhotoUrl` dan `getReportAudioUrl` dilepas dengan `URL.revokeObjectURL` saat komponen ditutup.

### 4.6 Endpoint `cleanup-audio` (bagian 8.2)

Menghapus dokumen `report_audio` yang `createdAt`-nya lebih dari 30 hari, lalu mengubah `hasAudio` menjadi `false` pada dokumen `report_private` terkait. Tujuannya tetap sama: memenuhi janji retensi 30 hari kepada warga.

### 4.7 Struktur folder, environment, dan alur gagal

- **Bagian 7.1:** `storage.rules` dihapus; komentar `firebase.js`, `reportService.js`, dan `firebase.json` tidak lagi menyebut Storage.
- **Bagian 7.4:** `VITE_FIREBASE_STORAGE_BUCKET` dihapus.
- **Bagian 3 (alur gagal):** "unggahan foto atau rekaman gagal" disesuaikan menjadi "foto atau rekaman gagal disimpan"; jalan keluarnya tetap, yaitu warga ditawari mengirim tanpa lampiran tersebut.
- **Bagian 3 (langkah kirim):** "mengunggah ke Firebase Storage" diganti "menyimpan ke Firestore".

## 5. Yang Tidak Berubah

- Alur pelaporan dari sisi warga dan admin.
- Aturan privasi: rekaman hanya untuk admin, disimpan 30 hari, diunggah saat "Kirim Laporan".
- Nama dan parameter fungsi service yang sudah ada, kecuali `getReportAudioUrl`.
- Daftar library. Package `firebase` yang terpasang sudah mencakup Firestore.

## 6. Risiko

| Risiko | Penjelasan | Penanganan |
|---|---|---|
| Kapasitas | Jatah gratis Firestore sekitar 1 GiB (dari ingatan, belum diverifikasi). Satu laporan dengan foto dan rekaman memakai sekitar 0,9 MB, jadi cukup untuk kira-kira 1000 laporan | Cukup untuk demo; rekaman terhapus otomatis setelah 30 hari |
| Kuota baca harian | Setiap foto yang dibuka menghabiskan dua pembacaan (dokumen foto dan pengecekan status di rules) | Foto dimuat hanya saat laporan diklik, bukan saat peta dimuat |
| Ukuran batch | Batch berisi foto dan rekaman mendekati 1 MB. Batas ukuran request Firestore setahu penulis 10 MiB, tetapi belum diuji | Jika batch ditolak, foto dan rekaman ditulis terpisah setelah dokumen laporan |
| Kualitas foto | Turun karena batas 500 KB | Cukup untuk bukti kondisi lapangan |
| Foto titipan | Dokumen `report_photos` tidak memuat pemilik, sehingga pengguna lain yang tahu `reportId` laporan tanpa foto dapat membuat dokumen foto untuknya | Aplikasi hanya memuat foto jika `hasPhoto` bernilai `true`, dan `hasPhoto` hanya bisa diubah admin |
| Pertanyaan juri | Menyimpan file di database bukan pola yang lazim | Dijelaskan sebagai pilihan sadar demi biaya Rp 0 pada skala komunitas |

## 7. Yang Perlu Diuji Sebelum Hackathon

Pengujian ini dilakukan di Firebase Console dan Rules Playground, tanpa menulis kode aplikasi.

1. Angka jatah gratis Firestore (kapasitas, baca, tulis per hari) di halaman harga Firebase.
2. Kedua blok rules di bagian 4.4 lolos di Rules Playground, termasuk pemeriksaan `is bytes` dan `size()`.
3. Batas ukuran request untuk satu batch.

## 8. Keputusan yang Dibutuhkan

1. Pilihan A (Blaze + Storage) atau pilihan B (Firestore saja).
2. Jika B: persetujuan atas perubahan di bagian 4, lalu `PRD.md` dan `PERUBAHAN-PRD.md` diperbarui.
