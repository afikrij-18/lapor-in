// Endpoint cron pembersihan rekaman audio berusia > 30 hari (PRD bagian 8.2).
// Dijalankan harian pada pukul 02:00 WIB (19:00 UTC) melalui Vercel Cron.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Masa retensi rekaman audio: 30 hari (dalam milidetik)
const RETENTION_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Batas maksimal dokumen yang diproses per batch agar tetap di bawah timeout 10 detik
const BATCH_LIMIT = 100;

// Inisialisasi Firebase Admin Firestore
function getAdminFirestore() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        initializeApp({
          credential: cert(credentials)
        });
      } catch (err) {
        console.error("Gagal mengurai FIREBASE_SERVICE_ACCOUNT_JSON:", err);
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

export default async function handler(req, res) {
  // Langkah 1: Hanya menerima metode HTTP GET
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Metode request tidak diizinkan."
      }
    });
  }

  // Langkah 2: Validasi header otorisasi Bearer CRON_SECRET
  const authHeader = req.headers.authorization || "";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Anda tidak memiliki akses."
      }
    });
  }

  try {
    // Langkah 3: Hitung batas waktu kadaluarsa (30 hari yang lalu)
    const db = getAdminFirestore();
    const cutoffTimestamp = Timestamp.fromMillis(Date.now() - RETENTION_DAYS_MS);

    // Langkah 4: Query dokumen audio yang sudah lewat dari masa retensi 30 hari
    const expiredAudioSnapshot = await db
      .collection("report_audio")
      .where("createdAt", "<=", cutoffTimestamp)
      .limit(BATCH_LIMIT)
      .get();

    if (expiredAudioSnapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "Tidak ada rekaman audio kadaluarsa yang perlu dibersihkan.",
        deletedCount: 0
      });
    }

    // Langkah 5: Hapus dari report_audio dan update report_private.hasAudio menjadi false secara batch
    const batch = db.batch();
    let deletedCount = 0;

    expiredAudioSnapshot.docs.forEach((audioDoc) => {
      const reportId = audioDoc.id;

      // Hapus dokumen audio
      batch.delete(audioDoc.ref);

      // Perbarui flag hasAudio di report_private jika dokumen ada
      const privateDocRef = db.collection("report_private").doc(reportId);
      batch.update(privateDocRef, { hasAudio: false });

      deletedCount += 1;
    });

    await batch.commit();

    // Langkah 6: Kembalikan jumlah dokumen yang berhasil dibersihkan
    return res.status(200).json({
      success: true,
      message: `Berhasil membersihkan ${deletedCount} rekaman audio kadaluarsa.`,
      deletedCount
    });
  } catch (error) {
    // Langkah 7: Catat error teknis di server dan kembalikan pesan ramah pengguna
    console.error("Error pada cleanup-audio:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
      }
    });
  }
}
