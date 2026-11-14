// Pembungkus fetch ke endpoint /api/* (kontrak PRD bagian 7.5).
// Balasan gagal diubah menjadi Error dengan properti code (format error: PRD bagian 8.2).

import { CLIENT_ERROR_CODES, createAppError } from "../utils/appError.js";
import { mockProcessReport, mockReverseGeocode, mockSendChatMessage } from "./apiMocks.js";
import { getIdToken } from "./authService.js";

// Bahasa antarmuka saat ini. "en" menyusul apabila bahasa Inggris dikerjakan.
const LANGUAGE = "id";

// Mode mock: balasan contoh tanpa memanggil /api/*. Hanya bisa aktif saat development
// (npm run dev) dengan VITE_USE_MOCK_API=true di .env.local. Di build produksi selalu mati.
const USE_MOCK_API = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true";

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

// Menyusun header untuk endpoint yang memanggil AI. Server memeriksa tanda pengenal sesi ini
// dan membatasi jumlah permintaan per pengguna per jam (pengganti Turnstile).
async function buildAiHeaders() {
  const idToken = await getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`
  };
}

// Mengubah Blob rekaman menjadi teks base64 (tanpa awalan "data:...;base64,").
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Memproses input pertama warga menjadi draf laporan (POST /api/process-report).
// Salah satu dari audioBlob atau textInput wajib ada. Mengembalikan { draft, aiMessage }.
export async function processReport({ audioBlob, textInput }) {
  // Langkah 1: Tolak pemanggilan tanpa isi
  if (!audioBlob && !textInput) {
    throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT);
  }

  if (USE_MOCK_API) {
    return mockProcessReport({ audioBlob, textInput });
  }

  // Langkah 2: Susun isi request. Rekaman dikirim sebagai base64 di dalam JSON
  let payload;
  if (audioBlob) {
    try {
      payload = {
        audioBase64: await blobToBase64(audioBlob),
        audioMimeType: audioBlob.type,
        language: LANGUAGE
      };
    } catch (error) {
      console.error("Error pada processReport (membaca rekaman):", error);
      throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT, error);
    }
  } else {
    payload = { textInput, language: LANGUAGE };
  }

  // Langkah 3: Kirim dan kembalikan bagian yang dipakai halaman chat
  const result = await request("/api/process-report", {
    method: "POST",
    headers: await buildAiHeaders(),
    body: JSON.stringify(payload)
  });
  return { draft: result.draft, aiMessage: result.aiMessage };
}

// Mengirim pesan warga ke asisten AI (POST /api/chat-assistant).
// Mengembalikan { updatedFields, aiMessage }.
export async function sendChatMessage({ userMessage, currentDraft, recentHistory }) {
  if (USE_MOCK_API) {
    return mockSendChatMessage({ userMessage, currentDraft, recentHistory });
  }

  const result = await request("/api/chat-assistant", {
    method: "POST",
    headers: await buildAiHeaders(),
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
  if (USE_MOCK_API) {
    return mockReverseGeocode(latitude, longitude);
  }

  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });
  const result = await request(`/api/reverse-geocode?${params.toString()}`, { method: "GET" });
  return { address: result.address, geohash: result.geohash, source: result.source };
}
