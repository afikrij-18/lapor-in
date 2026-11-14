// Inisialisasi Firebase untuk sisi browser (PRD bagian 7.1).
// File ini hanya boleh diimpor oleh src/services/*. Halaman dan komponen dilarang mengimpornya langsung.
// Firebase Storage tidak dipakai: foto dan rekaman disimpan di Firestore.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Langkah 1: Ambil konfigurasi project dari environment variable (lihat .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Langkah 2: Jika .env.local belum diisi, beri tahu developer dan pakai nilai pengganti.
// Tanpa nilai pengganti, Firebase melempar error saat dimuat dan seluruh halaman menjadi kosong.
// Dengan nilai pengganti, tampilan tetap bisa dikerjakan; login dan akses data akan gagal
// dengan pesan error sampai .env.local diisi.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Konfigurasi Firebase belum lengkap. Salin .env.example menjadi .env.local lalu isi nilainya."
  );
  firebaseConfig.apiKey = firebaseConfig.apiKey || "missing-api-key";
  firebaseConfig.projectId = firebaseConfig.projectId || "missing-project-id";
}

// Langkah 3: Buat satu instance Firebase App yang dipakai seluruh aplikasi
const firebaseApp = initializeApp(firebaseConfig);

// Langkah 4: Ekspor layanan yang dipakai service layer
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
