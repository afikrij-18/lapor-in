// Penjaga permintaan untuk endpoint yang memanggil Gemini (PRD bagian 8.1 dan 8.2).
// Pengganti Cloudflare Turnstile: setiap permintaan harus membawa tanda pengenal sesi Firebase
// (termasuk sesi anonim warga), dan tiap pengguna dibatasi jumlah permintaannya per jam.
//
// Folder berawalan garis bawah (_lib) tidak dijadikan endpoint oleh Vercel.
//
// Prinsip: kesalahan PENGATURAN SERVER tidak boleh memblokir warga. Jika kunci service account
// tidak terbaca, library gagal dimuat, atau Firestore gagal, permintaan tetap diizinkan dan
// sebabnya dicatat di log. Yang ditolak hanya dua: tanda pengenal tidak ada atau tidak sah (401),
// dan batas terlampaui (429).
//
// Catatan teknis:
// - Tanda pengenal sesi diperiksa sendiri dengan node:crypto, BUKAN dengan firebase-admin/auth.
//   Di Vercel, firebase-admin/auth gagal dimuat (ERR_REQUIRE_ESM dari jwks-rsa dan jose) dan
//   membuat seluruh fungsi berhenti.
// - firebase-admin dimuat dengan import() di dalam try/catch, supaya kegagalan memuat library
//   tidak ikut menghentikan endpoint.

import { createVerify } from "node:crypto";

// Jendela hitung: satu jam
const WINDOW_MS = 60 * 60 * 1000;

// Sertifikat publik Google untuk memeriksa tanda tangan ID token Firebase
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// Penanda bahwa tanda pengenal dari browser memang tidak sah (bukan gangguan server)
class InvalidTokenError extends Error {}

let cachedCerts = null;
let cachedCertsExpireAt = 0;

// Membaca kunci service account dari environment variable. Mengembalikan null jika tidak bisa.
function readServiceAccount() {
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
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.project_id) {
      throw new Error("project_id tidak ada");
    }
    return serviceAccount;
  } catch (error) {
    console.error(
      "Penjaga permintaan: FIREBASE_SERVICE_ACCOUNT_JSON tidak bisa dibaca; batas pemakaian tidak berlaku:",
      error.message
    );
    return null;
  }
}

// Mengambil sertifikat publik Google, disimpan di memori sampai masa berlakunya habis.
async function getGoogleCerts(forceRefresh = false) {
  if (!forceRefresh && cachedCerts && Date.now() < cachedCertsExpireAt) {
    return cachedCerts;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Gagal mengambil sertifikat Google: HTTP ${response.status}`);
  }

  const maxAgeMatch = /max-age=(\d+)/.exec(response.headers.get("cache-control") || "");
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = await response.json();
  cachedCertsExpireAt = Date.now() + maxAgeSeconds * 1000;
  return cachedCerts;
}

// Membaca satu bagian token (base64url berisi JSON).
function decodeTokenPart(part) {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    throw new InvalidTokenError("bagian token bukan JSON");
  }
}

// Memeriksa ID token Firebase: tanda tangan, penerbit, tujuan, dan masa berlaku.
// Mengembalikan UID pengguna. Melempar InvalidTokenError jika token tidak sah.
async function verifyFirebaseIdToken(idToken, projectId) {
  // Langkah 1: Token harus berbentuk tiga bagian yang dipisah titik
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new InvalidTokenError("bentuk token salah");
  }
  const header = decodeTokenPart(parts[0]);
  const payload = decodeTokenPart(parts[1]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new InvalidTokenError("algoritma atau kid tidak sesuai");
  }

  // Langkah 2: Cari sertifikat Google yang cocok; ambil ulang sekali jika belum dikenal
  let certs = await getGoogleCerts();
  if (!certs[header.kid]) {
    certs = await getGoogleCerts(true);
  }
  const certificate = certs[header.kid];
  if (!certificate) {
    throw new InvalidTokenError("sertifikat penanda tangan tidak dikenal");
  }

  // Langkah 3: Periksa tanda tangan
  const isSignatureValid = createVerify("RSA-SHA256")
    .update(`${parts[0]}.${parts[1]}`)
    .verify(certificate, Buffer.from(parts[2], "base64url"));
  if (!isSignatureValid) {
    throw new InvalidTokenError("tanda tangan tidak cocok");
  }

  // Langkah 4: Periksa isi token (project, penerbit, masa berlaku, pemilik)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) {
    throw new InvalidTokenError("token milik project lain");
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new InvalidTokenError("penerbit token salah");
  }
  if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) {
    throw new InvalidTokenError("token kedaluwarsa");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new InvalidTokenError("token tanpa pemilik");
  }

  return payload.sub;
}

// Menyiapkan Firestore lewat Firebase Admin. Library dimuat di sini (bukan di awal file)
// supaya kegagalan memuatnya bisa ditangkap pemanggil.
async function getAdminFirestore(serviceAccount) {
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app =
    getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  return getFirestore(app);
}

// Membaca batas per jam dari environment variable, atau memakai nilai bawaan.
function readLimit(envName, defaultLimit) {
  const value = Number.parseInt(process.env[envName] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : defaultLimit;
}

const UNAUTHORIZED_RESULT = {
  allowed: false,
  status: 401,
  code: "UNAUTHORIZED",
  message: "Sesi belum siap. Silakan muat ulang halaman.",
};

// Memeriksa satu permintaan.
// bucket: nama penghitung ("report" atau "chat"); envName dan defaultLimit: batas per jam.
// Mengembalikan { allowed: true } atau { allowed: false, status, code, message }.
export async function guardRequest(req, { bucket, envName, defaultLimit }) {
  // Langkah 1: Baca kunci service account. Tidak terbaca: izinkan (lihat prinsip di atas)
  const serviceAccount = readServiceAccount();
  if (!serviceAccount) {
    return { allowed: true };
  }

  // Langkah 2: Ambil tanda pengenal sesi dari header "Authorization: Bearer <idToken>"
  const authHeader = String(req.headers.authorization || "");
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!idToken) {
    console.error("Penjaga permintaan: header Authorization kosong (sesi browser belum siap)");
    return UNAUTHORIZED_RESULT;
  }

  // Langkah 3: Periksa tanda pengenal itu
  let uid;
  try {
    uid = await verifyFirebaseIdToken(idToken, serviceAccount.project_id);
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      console.error("Penjaga permintaan: tanda pengenal sesi tidak sah:", error.message);
      return UNAUTHORIZED_RESULT;
    }
    // Error lain berasal dari server atau jaringan (misalnya sertifikat gagal diambil): izinkan
    console.error("Penjaga permintaan: pemeriksaan sesi gagal karena server; diizinkan:", error);
    return { allowed: true };
  }

  // Langkah 4: Hitung pemakaian pengguna ini dalam satu jam terakhir
  const limit = readLimit(envName, defaultLimit);
  try {
    const db = await getAdminFirestore(serviceAccount);
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
    // Library atau Firestore gagal: izinkan, agar gangguan penghitung tidak menghentikan pelaporan
    console.error("Penjaga permintaan: penghitung pemakaian gagal; diizinkan:", error);
  }

  return { allowed: true };
}
