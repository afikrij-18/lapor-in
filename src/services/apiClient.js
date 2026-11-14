// Pembungkus fetch ke endpoint /api/* (kontrak PRD bagian 7.5).
// Balasan gagal diubah menjadi Error dengan properti code (format error: PRD bagian 8.2).

import { CLIENT_ERROR_CODES, createAppError } from "../utils/appError.js";

// Bahasa antarmuka saat ini. "en" menyusul apabila bahasa Inggris dikerjakan.
const LANGUAGE = "id";

// Mengirim request lalu mengembalikan isi JSON, atau melempar Error dengan code.
async function request(path, options) {
  // Langkah 1: Kirim request. Kegagalan di sini berarti masalah jaringan
  let response;
  try {
    response = await fetch(path, options);
  } catch (error) {
    console.error(`Error jaringan saat memanggil ${path}:`, error);
    throw createAppError(CLIENT_ERROR_CODES.NETWORK_ERROR, error);
  }

  // Langkah 2: Baca balasan sebagai JSON. Balasan bukan JSON dianggap error tak dikenal
  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    console.error(`Balasan ${path} bukan JSON:`, error);
  }

  // Langkah 3: Jika gagal, lempar Error dengan code dari server
  if (!response.ok || !body || body.success !== true) {
    const code =
      body && body.error && body.error.code
        ? body.error.code
        : CLIENT_ERROR_CODES.UNKNOWN_ERROR;
    throw createAppError(code);
  }

  return body;
}

// Menentukan nama file rekaman dari tipe MIME-nya, misalnya "audio/webm;codecs=opus".
function getAudioFileName(audioBlob) {
  if (audioBlob.type.includes("mp4")) {
    return "recording.mp4";
  }
  if (audioBlob.type.includes("ogg")) {
    return "recording.ogg";
  }
  return "recording.webm";
}

// Memproses input pertama warga menjadi draf laporan (POST /api/process-report).
// Salah satu dari audioBlob atau textInput wajib ada. Mengembalikan { draft, aiMessage }.
export async function processReport({ audioBlob, textInput, turnstileToken }) {
  // Langkah 1: Tolak pemanggilan tanpa isi
  if (!audioBlob && !textInput) {
    throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT);
  }

  const headers = { "x-turnstile-token": turnstileToken || "" };
  let body;

  if (audioBlob) {
    // Langkah 2a: Rekaman dikirim sebagai multipart/form-data.
    // Content-Type tidak diisi manual; browser yang menambahkan boundary-nya
    body = new FormData();
    body.append("audioFile", audioBlob, getAudioFileName(audioBlob));
    body.append("language", LANGUAGE);
  } else {
    // Langkah 2b: Teks dikirim sebagai JSON
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ textInput, language: LANGUAGE });
  }

  // Langkah 3: Kirim dan kembalikan bagian yang dipakai halaman chat
  const result = await request("/api/process-report", { method: "POST", headers, body });
  return { draft: result.draft, aiMessage: result.aiMessage };
}

// Mengirim pesan warga ke asisten AI (POST /api/chat-assistant).
// Mengembalikan { updatedFields, aiMessage }.
export async function sendChatMessage({ userMessage, currentDraft, recentHistory }) {
  const result = await request("/api/chat-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage,
      currentDraft,
      recentHistory: recentHistory || [],
      language: LANGUAGE
    })
  });
  return { updatedFields: result.updatedFields || {}, aiMessage: result.aiMessage };
}

// Mengubah koordinat menjadi alamat (GET /api/reverse-geocode).
// Mengembalikan { address, geohash, source }.
export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });
  const result = await request(`/api/reverse-geocode?${params.toString()}`, { method: "GET" });
  return { address: result.address, geohash: result.geohash, source: result.source };
}
