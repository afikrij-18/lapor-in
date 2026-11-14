// Balasan contoh untuk endpoint /api/* (mode mock).
// Dipakai apiClient.js saat development dengan VITE_USE_MOCK_API=true di .env.local,
// supaya tampilan bisa dikerjakan sebelum endpoint jadi dan kuota Gemini tidak terpakai.
// Bentuk balasan sama dengan PRD bagian 8.2. Mode ini tidak pernah aktif di build produksi.

import ngeohash from "ngeohash";

// Jeda singkat agar tampilan "sedang memproses" tetap terlihat seperti aslinya
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Contoh balasan POST /api/process-report
export async function mockProcessReport({ audioBlob, textInput }) {
  await wait(1200);

  const rawTranscript = audioBlob
    ? "anu pak ini jalan di depan pasar lubang besar sekali, sudah ada motor yang jatuh"
    : textInput;

  return {
    draft: {
      title: "Jalan Berlubang Depan Pasar",
      category: "Infrastruktur",
      urgency: "Tinggi",
      summary:
        "Terdapat lubang besar di badan jalan depan pasar yang membahayakan pengendara motor.",
      rawTranscript,
      isValidReport: true,
      audioQuality: audioBlob ? "clear" : "text_input"
    },
    aiMessage:
      "(Contoh) Saya sudah merangkum laporan Anda. Apakah Anda memiliki foto kondisi jalan tersebut? Jika ada silakan unggah, atau tekan Lewati."
  };
}

// Contoh balasan POST /api/chat-assistant.
// Hanya mengenali satu perintah sederhana: pesan yang menyebut tingkat urgensi.
export async function mockSendChatMessage({ userMessage }) {
  await wait(800);

  const message = String(userMessage || "").toLowerCase();
  const updatedFields = {};

  if (message.includes("darurat")) {
    updatedFields.urgency = "Darurat";
  } else if (message.includes("tinggi")) {
    updatedFields.urgency = "Tinggi";
  } else if (message.includes("normal")) {
    updatedFields.urgency = "Normal";
  }

  const aiMessage = updatedFields.urgency
    ? `(Contoh) Baik, tingkat urgensi sudah saya ubah menjadi ${updatedFields.urgency}. Silakan periksa kartu pratinjau.`
    : "(Contoh) Pesan Anda sudah saya terima. Silakan periksa kartu pratinjau lalu tekan Kirim Laporan jika sudah sesuai.";

  return { updatedFields, aiMessage };
}

// Contoh balasan GET /api/reverse-geocode
export async function mockReverseGeocode(latitude, longitude) {
  await wait(500);

  return {
    address: "Kelurahan Belakang Tangsi, Kecamatan Padang Barat, Kota Padang (contoh)",
    geohash: ngeohash.encode(latitude, longitude, 7),
    source: "mock"
  };
}
