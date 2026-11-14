// Penjaga permintaan untuk endpoint yang memanggil Gemini (PRD bagian 8.1 dan 8.2).
// Pengganti Cloudflare Turnstile: setiap permintaan harus membawa tanda pengenal sesi Firebase
// (termasuk sesi anonim warga), dan tiap pengguna dibatasi jumlah permintaannya per jam.
//
// Folder berawalan garis bawah (_lib) tidak dijadikan endpoint oleh Vercel.
//
// Prinsip: kesalahan PENGATURAN SERVER tidak boleh memblokir warga. Jika kunci service account
// tidak terbaca atau Firestore gagal, permintaan tetap diizinkan dan sebabnya dicatat di log.
// Yang ditolak hanya dua: tanda pengenal tidak ada atau tidak sah (401), dan batas terlampaui (429).

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Jendela hitung: satu jam
const WINDOW_MS = 60 * 60 * 1000;

// Kode error Firebase yang berarti tanda pengenal dari browser memang tidak sah
const INVALID_TOKEN_CODES = [
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-disabled",
];

// Menyiapkan Firebase Admin. Mengembalikan null jika kunci service account tidak bisa dipakai.
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccountJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!serviceAccountJson) {
    console.error(
      "Penjaga permintaan: FIREBASE_SERVICE_ACCOUNT_JSON belum diisi; batas pemakaian tidak berlaku"
    );
    return null;
  }

  // Buang tanda kutip pembungkus jika ikut tersalin ke environment variable
  if (/^'.*'$/s.test(serviceAccountJson) || /^".*"$/s.test(serviceAccountJson)) {
    serviceAccountJson = serviceAccountJson.slice(1, -1);
  }

  try {
    return initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  } catch (error) {
    console.error(
      "Penjaga permintaan: FIREBASE_SERVICE_ACCOUNT_JSON tidak bisa dibaca; batas pemakaian tidak berlaku:",
      error.message
    );
    return null;
  }
}

// Membaca batas per jam dari environment variable, atau memakai nilai bawaan.
function readLimit(envName, defaultLimit) {
  const value = Number.parseInt(process.env[envName] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : defaultLimit;
}

// Memeriksa satu permintaan.
// bucket: nama penghitung ("report" atau "chat"); envName dan defaultLimit: batas per jam.
// Mengembalikan { allowed: true } atau { allowed: false, status, code, message }.
export async function guardRequest(req, { bucket, envName, defaultLimit }) {
  // Langkah 1: Siapkan Firebase Admin. Gagal disiapkan: izinkan (lihat prinsip di atas)
  const app = getAdminApp();
  if (!app) {
    return { allowed: true };
  }

  // Langkah 2: Ambil tanda pengenal sesi dari header "Authorization: Bearer <idToken>"
  const authHeader = String(req.headers.authorization || "");
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!idToken) {
    console.error("Penjaga permintaan: header Authorization kosong (sesi browser belum siap)");
    return {
      allowed: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sesi belum siap. Silakan muat ulang halaman.",
    };
  }

  // Langkah 3: Periksa tanda pengenal itu ke Firebase
  let uid;
  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error) {
    if (INVALID_TOKEN_CODES.includes(error.code)) {
      console.error("Penjaga permintaan: tanda pengenal sesi tidak sah:", error.code);
      return {
        allowed: false,
        status: 401,
        code: "UNAUTHORIZED",
        message: "Sesi belum siap. Silakan muat ulang halaman.",
      };
    }
    // Error lain berasal dari pengaturan server atau jaringan: izinkan
    console.error("Penjaga permintaan: pemeriksaan sesi gagal karena server; diizinkan:", error);
    return { allowed: true };
  }

  // Langkah 4: Hitung pemakaian pengguna ini dalam satu jam terakhir
  const limit = readLimit(envName, defaultLimit);
  try {
    const db = getFirestore(app);
    const limitRef = db.collection("rate_limits").doc(uid);

    const isWithinLimit = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(limitRef);
      const counter = (snapshot.exists && snapshot.data()[bucket]) || null;
      const now = Date.now();
      const windowStart = counter ? counter.windowStart : 0;

      // Jendela lama sudah lewat (atau belum ada): mulai hitungan baru
      if (!counter || now - windowStart >= WINDOW_MS) {
        transaction.set(limitRef, { [bucket]: { count: 1, windowStart: now } }, { merge: true });
        return true;
      }

      if (counter.count >= limit) {
        return false;
      }

      transaction.set(
        limitRef,
        { [bucket]: { count: counter.count + 1, windowStart } },
        { merge: true }
      );
      return true;
    });

    if (!isWithinLimit) {
      return {
        allowed: false,
        status: 429,
        code: "RATE_LIMITED",
        message: "Anda terlalu sering mengirim laporan. Silakan coba lagi nanti.",
      };
    }
  } catch (error) {
    // Firestore gagal: izinkan, agar gangguan penghitung tidak menghentikan pelaporan
    console.error("Penjaga permintaan: penghitung pemakaian gagal; diizinkan:", error);
  }

  return { allowed: true };
}
