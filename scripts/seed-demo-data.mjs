// Skrip pengisi data contoh untuk pengembangan dan demo.
// Mengisi 15 laporan contoh di Kota Padang ke Firestore, lengkap dengan data privat,
// beberapa foto, dan beberapa rekaman, agar peta publik dan dashboard admin punya isi.
//
// Cara pakai (dari folder project):
//   node scripts/seed-demo-data.mjs           -> mengisi atau memperbarui data contoh
//   node scripts/seed-demo-data.mjs --hapus   -> menghapus data contoh
//
// Syarat: FIREBASE_SERVICE_ACCOUNT_JSON terisi di .env.local.
// Skrip ini memakai Firebase Admin SDK, jadi melewati Security Rules. Jangan dijalankan
// oleh kode aplikasi. ID dokumen contoh selalu "demo-01" sampai "demo-15", sehingga
// menjalankan skrip berulang kali tidak menggandakan data.

import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import ngeohash from "ngeohash";

const COLLECTIONS = ["reports", "report_private", "report_photos", "report_audio"];

// Langkah 1: Baca kunci service account dari .env.local tanpa menampilkannya
function readServiceAccount() {
  const line = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((text) => text.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON="));
  if (!line) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON tidak ditemukan di .env.local");
  }

  let raw = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
  if (/^'.*'$/.test(raw) || /^".*"$/.test(raw)) {
    raw = raw.slice(1, -1);
  }
  return JSON.parse(raw);
}

// Membuat gambar PNG polos berwarna sebagai foto contoh (tanpa library tambahan)
function createSamplePng(red, green, blue) {
  const width = 320;
  const height = 240;

  // Tiap baris: 1 byte filter + 3 byte per piksel. Sisi kiri dibuat lebih gelap agar tidak polos
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) {
    const shade = x < width / 3 ? 0.6 : 1;
    row[1 + x * 3] = Math.round(red * shade);
    row[2 + x * 3] = Math.round(green * shade);
    row[3 + x * 3] = Math.round(blue * shade);
  }
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));

  const crcTable = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
  const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // kedalaman warna 8 bit
  header[9] = 2; // jenis warna RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// Membuat rekaman WAV berisi nada pendek sebagai rekaman contoh (bukan suara orang)
function createSampleWav(seconds) {
  const sampleRate = 8000;
  const sampleCount = sampleRate * seconds;
  const data = Buffer.alloc(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    // Nada 440 Hz yang berdenyut tiap setengah detik
    const isOn = Math.floor(index / (sampleRate / 2)) % 2 === 0;
    const wave = Math.sin((2 * Math.PI * 440 * index) / sampleRate);
    data[index] = 128 + Math.round(isOn ? wave * 60 : 0);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + sampleCount, 4);
  header.write("WAVEfmt ", 8, "ascii");
  header.writeUInt32LE(16, 16); // panjang blok fmt
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28); // byte per detik
  header.writeUInt16LE(1, 32); // byte per sampel
  header.writeUInt16LE(8, 34); // 8 bit
  header.write("data", 36, "ascii");
  header.writeUInt32LE(sampleCount, 40);

  return Buffer.concat([header, data]);
}

// Langkah 2: Daftar laporan contoh. hoursAgo menentukan urutan waktu laporan
const SAMPLE_REPORTS = [
  {
    title: "Pohon Tumbang Menutup Jalan",
    category: "Infrastruktur",
    urgency: "Darurat",
    status: "pending",
    summary: "Pohon besar tumbang dan menutup seluruh badan jalan. Kabel listrik ikut tertarik dan menjuntai ke jalan.",
    rawTranscript: "pak ado batang kayu gadang rabah di jalan ko, kabel listrik tajulai ka bawah, bahayo bana",
    address: "Jl. Khatib Sulaiman, Kecamatan Padang Utara, Kota Padang",
    latitude: -0.9086,
    longitude: 100.3601,
    hoursAgo: 1,
    audioQuality: "clear",
    photo: [120, 150, 90],
    audio: true
  },
  {
    title: "Banjir Setinggi Lutut di Permukiman",
    category: "Infrastruktur",
    urgency: "Darurat",
    status: "pending",
    summary: "Air meluap dari selokan dan masuk ke rumah warga setinggi lutut orang dewasa. Beberapa lansia perlu dibantu mengungsi.",
    rawTranscript: "aia lah masuak ka rumah, satinggi lutuik, ado urang gaek nan indak bisa bajalan",
    address: "Jl. Jati, Kecamatan Padang Timur, Kota Padang",
    latitude: -0.9396,
    longitude: 100.3712,
    hoursAgo: 2,
    audioQuality: "low",
    photo: null,
    audio: true
  },
  {
    title: "Jalan Berlubang Depan Pasar",
    category: "Infrastruktur",
    urgency: "Tinggi",
    status: "pending",
    summary: "Terdapat lubang besar di badan jalan depan pasar yang membahayakan pengendara motor, terutama saat malam.",
    rawTranscript: "anu pak ini jalan di depan pasar lubang besar sekali, sudah ada motor yang jatuh",
    address: "Jl. Pasar Raya, Kecamatan Padang Barat, Kota Padang",
    latitude: -0.9492,
    longitude: 100.3606,
    hoursAgo: 4,
    audioQuality: "clear",
    photo: [110, 110, 115],
    audio: false
  },
  {
    title: "Lampu Jalan Mati Sepanjang Gang",
    category: "Fasilitas Umum",
    urgency: "Tinggi",
    status: "pending",
    summary: "Seluruh lampu jalan di gang mati sejak tiga hari lalu sehingga gang gelap gulita dan rawan kejahatan.",
    rawTranscript: "",
    address: "Jl. Gajah Mada, Kecamatan Nanggalo, Kota Padang",
    latitude: -0.9003,
    longitude: 100.3667,
    hoursAgo: 6,
    audioQuality: "text_input",
    photo: null,
    audio: false
  },
  {
    title: "Sampah Menumpuk di Pinggir Jalan",
    category: "Kebersihan",
    urgency: "Normal",
    status: "pending",
    summary: "Tumpukan sampah rumah tangga belum diangkut selama satu minggu dan mulai menimbulkan bau.",
    rawTranscript: "",
    address: "Jl. Belanti Raya, Kecamatan Padang Utara, Kota Padang",
    latitude: -0.9152,
    longitude: 100.3558,
    hoursAgo: 9,
    audioQuality: "text_input",
    photo: null,
    audio: false
  },
  {
    title: "Rekaman Tidak Jelas",
    category: "Lainnya",
    urgency: "Normal",
    status: "pending",
    summary: "Rekaman didominasi suara bising kendaraan. Isi laporan tidak dapat dipastikan.",
    rawTranscript: "(suara bising) ... di siko ... (tidak jelas)",
    address: "Jl. Bypass, Kecamatan Kuranji, Kota Padang",
    latitude: -0.9248,
    longitude: 100.4087,
    hoursAgo: 11,
    audioQuality: "unusable",
    isValidReport: false,
    photo: null,
    audio: false
  },
  {
    title: "Tiang Listrik Miring",
    category: "Infrastruktur",
    urgency: "Darurat",
    status: "verified",
    summary: "Tiang listrik miring ke arah rumah warga setelah hujan angin dan dikhawatirkan roboh.",
    rawTranscript: "tiang listrik lah miriang ka rumah urang, takuik rabah",
    address: "Jl. Sutan Syahrir, Kecamatan Padang Selatan, Kota Padang",
    latitude: -0.9665,
    longitude: 100.3647,
    hoursAgo: 20,
    audioQuality: "clear",
    photo: [90, 100, 130],
    audio: false
  },
  {
    title: "Selokan Tersumbat Sampah",
    category: "Kebersihan",
    urgency: "Tinggi",
    status: "verified",
    summary: "Selokan tersumbat sampah plastik sehingga air meluap ke jalan setiap kali hujan.",
    rawTranscript: "banda lah panuah dek sarok, tiok hujan aia naiak ka jalan",
    address: "Jl. Veteran, Kecamatan Padang Barat, Kota Padang",
    latitude: -0.9371,
    longitude: 100.3549,
    hoursAgo: 26,
    audioQuality: "clear",
    photo: null,
    audio: false
  },
  {
    title: "Halte Bus Rusak",
    category: "Fasilitas Umum",
    urgency: "Normal",
    status: "verified",
    summary: "Atap halte bus bocor dan bangku patah sehingga tidak bisa dipakai menunggu.",
    rawTranscript: "",
    address: "Jl. Jenderal Sudirman, Kecamatan Padang Barat, Kota Padang",
    latitude: -0.9443,
    longitude: 100.3634,
    hoursAgo: 30,
    audioQuality: "text_input",
    photo: null,
    audio: false
  },
  {
    title: "Pencurian Sepeda Motor Berulang",
    category: "Keamanan",
    urgency: "Tinggi",
    status: "verified",
    summary: "Dalam satu bulan terjadi tiga kali pencurian sepeda motor di lingkungan yang sama pada malam hari.",
    rawTranscript: "",
    address: "Jl. Raya Siteba, Kecamatan Nanggalo, Kota Padang",
    latitude: -0.8957,
    longitude: 100.3743,
    hoursAgo: 40,
    audioQuality: "text_input",
    photo: null,
    audio: false
  },
  {
    title: "Jembatan Kecil Retak",
    category: "Infrastruktur",
    urgency: "Tinggi",
    status: "in_progress",
    summary: "Lantai jembatan penghubung permukiman retak memanjang dan bergetar saat dilewati kendaraan.",
    rawTranscript: "jambatan ko lah ratak, bagoyang kalau oto lalu",
    address: "Jl. Raya Kuranji, Kecamatan Kuranji, Kota Padang",
    latitude: -0.9121,
    longitude: 100.4012,
    hoursAgo: 52,
    audioQuality: "clear",
    photo: [140, 120, 100],
    audio: false
  },
  {
    title: "Taman Bermain Anak Tidak Terawat",
    category: "Fasilitas Umum",
    urgency: "Normal",
    status: "in_progress",
    summary: "Ayunan dan perosotan berkarat serta rumput tinggi, sehingga taman tidak aman untuk anak-anak.",
    rawTranscript: "",
    address: "Jl. Ujung Gurun, Kecamatan Padang Barat, Kota Padang",
    latitude: -0.9318,
    longitude: 100.3572,
    hoursAgo: 60,
    audioQuality: "text_input",
    photo: null,
    audio: false
  },
  {
    title: "Lubang Galian Tidak Ditutup",
    category: "Infrastruktur",
    urgency: "Tinggi",
    status: "resolved",
    summary: "Bekas galian pipa di tepi jalan dibiarkan terbuka tanpa tanda peringatan.",
    rawTranscript: "",
    address: "Jl. Perintis Kemerdekaan, Kecamatan Padang Timur, Kota Padang",
    latitude: -0.9433,
    longitude: 100.3768,
    hoursAgo: 96,
    audioQuality: "text_input",
    adminNotes: "Sudah ditutup oleh petugas pada hari berikutnya.",
    photo: null,
    audio: false
  },
  {
    title: "Tempat Sampah Umum Penuh",
    category: "Kebersihan",
    urgency: "Normal",
    status: "resolved",
    summary: "Tempat sampah umum di depan sekolah penuh dan sampah berserakan ke trotoar.",
    rawTranscript: "tong sarok di muko sakolah lah panuah, baserak ka jalan",
    address: "Jl. Ahmad Yani, Kecamatan Padang Barat, Kota Padang",
    latitude: -0.9402,
    longitude: 100.3589,
    hoursAgo: 120,
    audioQuality: "clear",
    adminNotes: "Sudah diangkut dan jadwal pengangkutan ditambah.",
    photo: null,
    audio: false
  },
  {
    title: "Tes Tes Tes",
    category: "Lainnya",
    urgency: "Normal",
    status: "rejected",
    summary: "Isi laporan hanya berupa percobaan dan tidak memuat masalah yang dapat ditindaklanjuti.",
    rawTranscript: "tes tes satu dua tiga",
    address: "Jl. Proklamasi, Kecamatan Padang Timur, Kota Padang",
    latitude: -0.9521,
    longitude: 100.3698,
    hoursAgo: 130,
    audioQuality: "clear",
    isValidReport: false,
    adminNotes: "Ditolak: bukan laporan.",
    photo: null,
    audio: false
  }
];

const getDemoId = (index) => `demo-${String(index + 1).padStart(2, "0")}`;

// Langkah 3: Isi atau perbarui data contoh
async function seed(db) {
  const now = Date.now();
  let photoCount = 0;
  let audioCount = 0;

  for (const [index, sample] of SAMPLE_REPORTS.entries()) {
    const reportId = getDemoId(index);
    const createdAt = Timestamp.fromMillis(now - sample.hoursAgo * 60 * 60 * 1000);
    const batch = db.batch();

    // Dokumen publik: bentuknya sama dengan yang ditulis createReport di reportService.js
    batch.set(db.collection("reports").doc(reportId), {
      ticketCode: `LPR-2026-9${String(index + 1).padStart(3, "0")}`,
      title: sample.title,
      category: sample.category,
      urgency: sample.urgency,
      summary: sample.summary,
      hasPhoto: Boolean(sample.photo),
      latitude: sample.latitude,
      longitude: sample.longitude,
      address: sample.address,
      geohash: ngeohash.encode(sample.latitude, sample.longitude, 7),
      status: sample.status,
      isValidReport: sample.isValidReport !== false,
      audioQuality: sample.audioQuality,
      createdAt,
      updatedAt: createdAt
    });

    // Dokumen privat. isDemoData menandai data contoh; tidak ada di data laporan asli
    batch.set(db.collection("report_private").doc(reportId), {
      reporterUid: "demo-seed",
      rawTranscript: sample.rawTranscript,
      adminNotes: sample.adminNotes || "",
      hasAudio: Boolean(sample.audio),
      isDemoData: true,
      createdAt
    });

    // Foto contoh: gambar polos PNG (laporan asli memakai JPEG atau WebP)
    const photoRef = db.collection("report_photos").doc(reportId);
    if (sample.photo) {
      batch.set(photoRef, {
        data: createSamplePng(...sample.photo),
        contentType: "image/png",
        createdAt
      });
      photoCount += 1;
    } else {
      batch.delete(photoRef);
    }

    // Rekaman contoh: nada pendek WAV (laporan asli memakai WebM atau MP4)
    const audioRef = db.collection("report_audio").doc(reportId);
    if (sample.audio) {
      batch.set(audioRef, {
        data: createSampleWav(4),
        contentType: "audio/wav",
        reporterUid: "demo-seed",
        createdAt
      });
      audioCount += 1;
    } else {
      batch.delete(audioRef);
    }

    await batch.commit();
  }

  console.log(
    `Selesai: ${SAMPLE_REPORTS.length} laporan contoh, ${photoCount} foto, ${audioCount} rekaman.`
  );
}

// Langkah 4: Hapus data contoh (hanya dokumen ber-ID demo-01 sampai demo-15)
async function remove(db) {
  const batch = db.batch();
  SAMPLE_REPORTS.forEach((_, index) => {
    COLLECTIONS.forEach((name) => {
      batch.delete(db.collection(name).doc(getDemoId(index)));
    });
  });
  await batch.commit();
  console.log(`Selesai: data contoh (${SAMPLE_REPORTS.length} laporan) dihapus.`);
}

// Langkah 5: Jalankan sesuai argumen
try {
  initializeApp({ credential: cert(readServiceAccount()) });
  const db = getFirestore();

  if (process.argv.includes("--hapus")) {
    await remove(db);
  } else {
    await seed(db);
  }
} catch (error) {
  console.error("Error pada seed-demo-data:", error.message);
  process.exitCode = 1;
}
