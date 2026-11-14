// Layanan data laporan (kontrak PRD bagian 7.5).
// Semua akses Firestore untuk laporan, foto, dan rekaman lewat file ini.
//
// Koleksi yang dipakai (PRD bagian 8.1):
// - reports         : data laporan yang boleh tampil publik setelah diverifikasi
// - report_private  : data privat laporan, khusus admin
// - report_photos   : foto bukti (Bytes), ID dokumen = reportId
// - report_audio    : rekaman suara (Bytes), khusus admin, ID dokumen = reportId

import {
  Bytes,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "../config/firebase.js";
import {
  MAX_AUDIO_BYTES,
  MAX_PHOTO_BYTES,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  REPORT_STATUS,
  URGENCY_SORT_ORDER
} from "../config/constants.js";
import { CLIENT_ERROR_CODES, createAppError, toAppError } from "../utils/appError.js";
import { generateTicketCode } from "../utils/ticketGenerator.js";

const REPORTS = "reports";
const REPORT_PRIVATE = "report_private";
const REPORT_PHOTOS = "report_photos";
const REPORT_AUDIO = "report_audio";

// Status yang boleh dilihat publik
const PUBLIC_STATUSES = [
  REPORT_STATUS.VERIFIED,
  REPORT_STATUS.IN_PROGRESS,
  REPORT_STATUS.RESOLVED
];

// Field yang boleh dikoreksi admin lewat updateReport
const EDITABLE_FIELDS = ["title", "category", "urgency", "summary", "address"];

// Mengubah dokumen Firestore menjadi objek report: isi dokumen ditambah id.
function toReport(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

// Mengubah File atau Blob menjadi tipe Bytes Firestore.
async function toFirestoreBytes(blob) {
  const buffer = await blob.arrayBuffer();
  return Bytes.fromUint8Array(new Uint8Array(buffer));
}

// Mengambil dokumen berisi file, lalu membuat URL sementara untuk <img> atau <audio>.
async function getFileUrl(collectionName, reportId) {
  const snapshot = await getDoc(doc(db, collectionName, reportId));
  if (!snapshot.exists()) {
    return null;
  }

  const file = snapshot.data();
  const blob = new Blob([file.data.toUint8Array()], { type: file.contentType });
  return URL.createObjectURL(blob);
}

// Mengurutkan antrean admin: Darurat, Tinggi, Normal; lalu laporan terbaru di atas.
function sortForAdmin(reports) {
  const getUrgencyRank = (report) => {
    const rank = URGENCY_SORT_ORDER.indexOf(report.urgency);
    return rank === -1 ? URGENCY_SORT_ORDER.length : rank;
  };
  const getCreatedMillis = (report) =>
    report.createdAt && typeof report.createdAt.toMillis === "function"
      ? report.createdAt.toMillis()
      : 0;

  return [...reports].sort((first, second) => {
    const rankDifference = getUrgencyRank(first) - getUrgencyRank(second);
    if (rankDifference !== 0) {
      return rankDifference;
    }
    return getCreatedMillis(second) - getCreatedMillis(first);
  });
}

// Mengirim laporan baru. Dipakai halaman chat saat warga menekan "Kirim Laporan Sekarang".
// photoFile harus sudah melewati imageCompressor.js. Mengembalikan { reportId, ticketCode }.
export async function createReport(draft, photoFile, audioBlob) {
  try {
    // Langkah 1: Pastikan warga punya sesi (anonim)
    const user = auth.currentUser;
    if (!user) {
      throw createAppError(CLIENT_ERROR_CODES.NOT_AUTHENTICATED);
    }

    // Langkah 2: Periksa isi wajib sebelum mengirim, agar tidak ditolak Security Rules
    const title = String(draft.title || "").trim().slice(0, MAX_TITLE_LENGTH);
    const summary = String(draft.summary || "").trim().slice(0, MAX_SUMMARY_LENGTH);
    const hasLocation =
      typeof draft.latitude === "number" && typeof draft.longitude === "number";
    if (!title || !hasLocation) {
      throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT);
    }

    // Langkah 3: Periksa ukuran lampiran (satu dokumen Firestore maksimal 1 MiB)
    if (photoFile && photoFile.size > MAX_PHOTO_BYTES) {
      throw createAppError(CLIENT_ERROR_CODES.PHOTO_TOO_LARGE);
    }
    if (audioBlob && audioBlob.size > MAX_AUDIO_BYTES) {
      throw createAppError(CLIENT_ERROR_CODES.AUDIO_TOO_LARGE);
    }

    // Langkah 4: Siapkan ID dokumen dan kode tiket
    const reportRef = doc(collection(db, REPORTS));
    const reportId = reportRef.id;
    const ticketCode = generateTicketCode();
    const batch = writeBatch(db);

    // Langkah 5: Dokumen publik. DILARANG memuat reporterUid, rawTranscript, adminNotes, hasAudio
    batch.set(reportRef, {
      ticketCode,
      title,
      category: draft.category,
      urgency: draft.urgency,
      summary,
      hasPhoto: Boolean(photoFile),
      latitude: draft.latitude,
      longitude: draft.longitude,
      address: draft.address || "",
      geohash: draft.geohash || "",
      status: REPORT_STATUS.PENDING,
      isValidReport: Boolean(draft.isValidReport),
      audioQuality: draft.audioQuality,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Langkah 6: Dokumen privat, hanya terbaca admin
    batch.set(doc(db, REPORT_PRIVATE, reportId), {
      reporterUid: user.uid,
      rawTranscript: draft.rawTranscript || "",
      adminNotes: "",
      hasAudio: Boolean(audioBlob),
      createdAt: serverTimestamp()
    });

    // Langkah 7: Foto bukti (jika ada)
    if (photoFile) {
      batch.set(doc(db, REPORT_PHOTOS, reportId), {
        data: await toFirestoreBytes(photoFile),
        contentType: photoFile.type,
        createdAt: serverTimestamp()
      });
    }

    // Langkah 8: Rekaman suara (jika ada)
    if (audioBlob) {
      batch.set(doc(db, REPORT_AUDIO, reportId), {
        data: await toFirestoreBytes(audioBlob),
        contentType: audioBlob.type,
        reporterUid: user.uid,
        createdAt: serverTimestamp()
      });
    }

    // Langkah 9: Simpan semuanya sekaligus; jika satu gagal, semuanya batal
    await batch.commit();
    return { reportId, ticketCode };
  } catch (error) {
    throw toAppError(error, "createReport");
  }
}

// Mengambil laporan untuk peta publik (hanya yang sudah diverifikasi).
export async function listPublicReports() {
  try {
    // Filter status wajib ada agar query lolos Security Rules
    const publicQuery = query(collection(db, REPORTS), where("status", "in", PUBLIC_STATUSES));
    const snapshot = await getDocs(publicQuery);
    return snapshot.docs.map(toReport);
  } catch (error) {
    throw toAppError(error, "listPublicReports");
  }
}

// Mengambil laporan untuk dashboard admin. status = salah satu REPORT_STATUS, atau null untuk semua.
export async function listReportsForAdmin(status) {
  try {
    // Langkah 1: Ambil laporan, dengan atau tanpa filter status
    const reportsRef = collection(db, REPORTS);
    const adminQuery = status ? query(reportsRef, where("status", "==", status)) : reportsRef;
    const snapshot = await getDocs(adminQuery);

    // Langkah 2: Urutkan di frontend (urgensi berupa teks, tidak bisa diurutkan lewat query)
    return sortForAdmin(snapshot.docs.map(toReport));
  } catch (error) {
    throw toAppError(error, "listReportsForAdmin");
  }
}

// Mengambil data privat laporan. Khusus admin.
export async function getReportPrivate(reportId) {
  try {
    const snapshot = await getDoc(doc(db, REPORT_PRIVATE, reportId));
    if (!snapshot.exists()) {
      throw createAppError(CLIENT_ERROR_CODES.NOT_FOUND);
    }

    const data = snapshot.data();
    return {
      rawTranscript: data.rawTranscript || "",
      reporterUid: data.reporterUid,
      adminNotes: data.adminNotes || "",
      hasAudio: Boolean(data.hasAudio)
    };
  } catch (error) {
    throw toAppError(error, "getReportPrivate");
  }
}

// Mengambil URL sementara foto laporan, atau null jika tidak ada foto.
// Panggil hanya untuk laporan dengan hasPhoto: true, saat laporan dibuka.
// Lepas URL dengan URL.revokeObjectURL saat komponen ditutup.
export async function getReportPhotoUrl(reportId) {
  try {
    return await getFileUrl(REPORT_PHOTOS, reportId);
  } catch (error) {
    throw toAppError(error, "getReportPhotoUrl");
  }
}

// Mengambil URL sementara rekaman laporan, atau null jika tidak ada. Khusus admin.
// Lepas URL dengan URL.revokeObjectURL saat komponen ditutup.
export async function getReportAudioUrl(reportId) {
  try {
    return await getFileUrl(REPORT_AUDIO, reportId);
  } catch (error) {
    throw toAppError(error, "getReportAudioUrl");
  }
}

// Koreksi data laporan oleh admin sebelum publikasi.
// fields = sebagian dari title, category, urgency, summary, address.
export async function updateReport(reportId, fields) {
  try {
    // Langkah 1: Ambil hanya field yang boleh diubah
    const changes = {};
    EDITABLE_FIELDS.forEach((fieldName) => {
      if (fields && fields[fieldName] !== undefined) {
        changes[fieldName] = fields[fieldName];
      }
    });

    // Langkah 2: Jaga batas panjang teks
    if (typeof changes.title === "string") {
      changes.title = changes.title.trim().slice(0, MAX_TITLE_LENGTH);
    }
    if (typeof changes.summary === "string") {
      changes.summary = changes.summary.trim().slice(0, MAX_SUMMARY_LENGTH);
    }

    // Langkah 3: Simpan perubahan beserta waktu pembaruan
    await updateDoc(doc(db, REPORTS, reportId), { ...changes, updatedAt: serverTimestamp() });
  } catch (error) {
    throw toAppError(error, "updateReport");
  }
}

// Mengubah status laporan oleh admin. adminNotes = string, atau null jika tidak ada catatan.
export async function updateReportStatus(reportId, status, adminNotes) {
  try {
    // Langkah 1: Tolak status di luar kontrak
    if (!Object.values(REPORT_STATUS).includes(status)) {
      throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT);
    }

    const batch = writeBatch(db);

    // Langkah 2: Status disimpan di dokumen publik
    batch.update(doc(db, REPORTS, reportId), { status, updatedAt: serverTimestamp() });

    // Langkah 3: Catatan admin disimpan di dokumen privat
    if (typeof adminNotes === "string") {
      batch.set(doc(db, REPORT_PRIVATE, reportId), { adminNotes }, { merge: true });
    }

    await batch.commit();
  } catch (error) {
    throw toAppError(error, "updateReportStatus");
  }
}

// Menghapus laporan beserta data privat, foto, dan rekamannya. Khusus admin.
export async function deleteReport(reportId) {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, REPORTS, reportId));
    batch.delete(doc(db, REPORT_PRIVATE, reportId));
    batch.delete(doc(db, REPORT_PHOTOS, reportId));
    batch.delete(doc(db, REPORT_AUDIO, reportId));
    await batch.commit();
  } catch (error) {
    throw toAppError(error, "deleteReport");
  }
}
