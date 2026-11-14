// Kontrak global Lapor.in (PRD bagian 7.3).
// Nama key dan nilai string di file ini DILARANG diubah tanpa persetujuan Project Lead.

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

// 5. Batas panjang teks (sama dengan firestore.rules)
export const MAX_TITLE_LENGTH = 60;
export const MAX_SUMMARY_LENGTH = 1000;

// Batas ukuran file yang disimpan di Firestore (satu dokumen maksimal 1 MiB)
export const MAX_PHOTO_BYTES = 500 * 1024; // target hasil imageCompressor.js
export const MAX_AUDIO_BYTES = 700 * 1024; // sama dengan batas di firestore.rules

// 6. Email akun admin tunggal (PRD bagian 5)
export const ADMIN_EMAIL = "admin@laporin.id";

// 7. Palet warna resmi (PRD bagian 2.1).
// Dipakai di JavaScript saat kelas Tailwind tidak bisa dipakai, misalnya warna pin peta Leaflet.
// Untuk tampilan biasa, gunakan CSS Variables di src/index.css.
export const COLOR_PALETTE = {
  BLACK_PRIMARY: "#0A0A0A",
  BLACK_SURFACE: "#171717",
  RED_PRIMARY: "#DC2626",
  RED_HOVER: "#B91C1C",
  RED_TINT: "#FEE2E2",
  WHITE_PRIMARY: "#FFFFFF",
  WHITE_SURFACE: "#F5F5F5",
  BORDER_GRAY: "#D4D4D4",
  TEXT_MUTED: "#525252"
};
