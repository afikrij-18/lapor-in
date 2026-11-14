// Layanan autentikasi (kontrak PRD bagian 7.5).
// Warga memakai sesi anonim tanpa form; admin memakai email dan kata sandi.

import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../config/firebase.js";
import { ADMIN_EMAIL } from "../config/constants.js";
import { CLIENT_ERROR_CODES, createAppError, toAppError } from "../utils/appError.js";

// Masuk sebagai warga anonim di latar belakang. Dipanggil sekali saat aplikasi dibuka.
export async function signInAnonymouslySilent() {
  try {
    // Langkah 1: Tunggu Firebase selesai memuat sesi yang tersimpan di browser
    await auth.authStateReady();

    // Langkah 2: Jika sudah ada sesi (anonim atau admin), pakai sesi itu
    if (auth.currentUser) {
      return auth.currentUser;
    }

    // Langkah 3: Jika belum ada, buat sesi anonim baru
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    throw toAppError(error, "signInAnonymouslySilent");
  }
}

// Login admin di halaman /admin/login.
export async function signInAdmin(email, password) {
  try {
    // Langkah 1: Login dengan email dan kata sandi
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Langkah 2: Tolak akun selain admin tunggal, lalu kembalikan ke sesi anonim
    if (!isAdminUser(credential.user)) {
      await signOut(auth);
      await signInAnonymously(auth);
      throw createAppError(CLIENT_ERROR_CODES.NOT_ADMIN);
    }

    return credential.user;
  } catch (error) {
    throw toAppError(error, "signInAdmin");
  }
}

// Logout admin. Setelah logout, aplikasi kembali ke sesi anonim agar warga tetap bisa melapor.
export async function signOutAdmin() {
  try {
    await signOut(auth);
    await signInAnonymously(auth);
  } catch (error) {
    throw toAppError(error, "signOutAdmin");
  }
}

// Mendengarkan perubahan sesi. Mengembalikan fungsi unsubscribe.
// Satu-satunya fungsi di file ini yang tidak async.
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Mengambil tanda pengenal sesi (ID token) pengguna saat ini, untuk dikirim ke endpoint /api/*
// lewat header "Authorization: Bearer <token>". Server memakainya untuk membatasi pemakaian
// per pengguna. Mengembalikan "" jika sesi tidak bisa dibuat; server yang memutuskan penolakannya.
export async function getIdToken() {
  try {
    // Langkah 1: Pastikan ada sesi (anonim atau admin)
    const user = await signInAnonymouslySilent();

    // Langkah 2: Ambil token; Firebase memperbaruinya sendiri jika hampir kedaluwarsa
    return await user.getIdToken();
  } catch (error) {
    console.error("Error pada getIdToken:", error);
    return "";
  }
}

// Mengecek apakah pengguna adalah admin tunggal.
export function isAdminUser(user) {
  return Boolean(user && user.email === ADMIN_EMAIL);
}
