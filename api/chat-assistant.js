// Vercel Serverless Function: POST /api/chat-assistant
// Memandu kelengkapan laporan dan memproses perintah edit draf laporan secara natural.

import { GoogleGenAI, Type } from "@google/genai";
import {
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  REPORT_CATEGORIES,
  URGENCY_LEVELS,
} from "../src/config/constants.js";
import { guardRequest } from "./_lib/requestGuard.js";

const ALLOWED_URGENCIES = Object.values(URGENCY_LEVELS);

// Instruksi sistem padat (< 250 token) dengan isolasi input pengguna
const SYSTEM_INSTRUCTION = `Asisten AI pelaporan warga Lapor.in di halaman chat.
Tugas:
1. Perbarui field pada updatedFields jika warga meminta edit (title, category, urgency, summary, address). Hanya isi field yang berubah.
2. Jika warga meminta hapus foto, set removePhotoRequested: true.
3. Pandu warga melengkapi lokasi kejadian jika address masih kosong dengan bahasa Indonesia singkat dan ramah lansia.
4. title maks 60 karakter, summary maks 1000 karakter.
5. aiMessage maksimal 2 kalimat singkat.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    updatedFields: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        category: { type: Type.STRING, enum: REPORT_CATEGORIES },
        urgency: { type: Type.STRING, enum: ALLOWED_URGENCIES },
        summary: { type: Type.STRING },
        address: { type: Type.STRING },
        removePhotoRequested: { type: Type.BOOLEAN },
      },
    },
    aiMessage: { type: Type.STRING },
  },
  required: ["updatedFields", "aiMessage"],
};

// Parsing JSON aman untuk mengatasi format markdown code fences dari model AI
function safeParseJson(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Teks balasan AI kosong.");
  }
  const clean = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(clean);
}

// Membaca body JSON secara fleksibel baik di serverless runtime maupun lokal
async function parseJsonBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

// Mengirim balasan error seragam dan mencatat detail teknis di log server
function sendError(res, status, code, userMessage, devError = null) {
  if (devError) {
    console.error(`Error pada chatAssistant [${code}]:`, devError);
  }
  return res.status(status).json({
    success: false,
    error: {
      code,
      message: userMessage,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "INVALID_INPUT", "Metode permintaan tidak didukung.");
  }

  try {
    // Langkah 0: Periksa sesi pengguna dan batas pemakaian per jam
    const guard = await guardRequest(req, {
      bucket: "chat",
      envName: "AI_CHAT_LIMIT_PER_HOUR",
      defaultLimit: 60,
    });
    if (!guard.allowed) {
      return sendError(res, guard.status, guard.code, guard.message);
    }

    // Langkah 1: Validasi payload pesan warga
    const body = await parseJsonBody(req);
    const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
    const currentDraft = body.currentDraft || {};

    // Strategi 1: Sliding Window History maksimal 4 pesan terakhir
    const recentHistory = Array.isArray(body.recentHistory)
      ? body.recentHistory.slice(-4)
      : [];

    if (!userMessage) {
      return sendError(
        res,
        400,
        "INVALID_INPUT",
        "Data yang dikirim belum lengkap atau tidak sesuai."
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendError(
        res,
        500,
        "INTERNAL_ERROR",
        "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.",
        new Error("GEMINI_API_KEY belum diatur pada environment")
      );
    }

    // Langkah 2: Susun State-Driven Context Injection ringkas (< 120 token)
    const compactDraftState = {
      title: currentDraft.title || "",
      category: currentDraft.category || "Lainnya",
      urgency: currentDraft.urgency || URGENCY_LEVELS.NORMAL,
      summary: currentDraft.summary || "",
      address: currentDraft.address || "",
      hasPhoto: Boolean(currentDraft.hasPhoto),
    };

    const historyText = recentHistory
      .map(
        (item) =>
          `${item.role === "user" ? "Warga" : "AI"}: ${String(item.text || "").slice(0, 200)}`
      )
      .join("\n");

    const prompt = `State draf saat ini:
${JSON.stringify(compactDraftState)}

Riwayat singkat terakhir:
${historyText || "(Belum ada)"}

<pesan_warga>
${userMessage.slice(0, 600)}
</pesan_warga>`;

    // Langkah 3: Panggil Gemini dengan JSON schema terkunci dan auto-fallback saat server sibuk (503)
    // Batas waktu per percobaan (minimal 10 detik menurut API): jika satu model macet,
    // endpoint pindah ke model berikutnya
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 10000 } });
    // gemini-2.5-flash (nama di PRD awal) sudah tidak tersedia untuk API key baru (404).
    // Model utama gemini-3.5-flash: saat diuji menjawab sekitar 2 detik, sedangkan
    // gemini-3.8-flash melewati batas waktu. GEMINI_MODEL dapat menggantinya lewat environment.
    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ];
    // thinkingBudget 0 (ditambahkan per model di bawah): token "thinking" ikut memakan jatah
    // keluaran dan terbukti memotong JSON. Model "lite" menolak pengaturan ini (400) dan
    // memang tidak memakai thinking, jadi untuk model itu pengaturannya tidak dikirim.
    const modelConfig = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 350,
    };

    let response = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: modelName.includes("lite")
            ? modelConfig
            : { ...modelConfig, thinkingConfig: { thinkingBudget: 0 } },
        });
        break;
      } catch (err) {
        lastError = err;
        const status = err?.status;
        // Tanpa status berarti request terputus atau melewati batas waktu
        if (!status || [400, 404, 429, 500, 503, 504].includes(status)) {
          console.warn(
            `Model ${modelName} tidak tersedia (${status}), mencoba model berikutnya...`
          );
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error("Seluruh model Gemini sedang sibuk.");
    }

    const parsed = safeParseJson(response.text);
    const rawUpdates = parsed.updatedFields || {};
    const sanitizedUpdates = {};

    // Langkah 4: Sanitasi setiap field yang diubah agar sesuai aturan panjang karakter Firestore
    if (rawUpdates.title && rawUpdates.title.trim()) {
      sanitizedUpdates.title = rawUpdates.title.trim().slice(0, MAX_TITLE_LENGTH);
    }
    if (rawUpdates.category && REPORT_CATEGORIES.includes(rawUpdates.category)) {
      sanitizedUpdates.category = rawUpdates.category;
    }
    if (rawUpdates.urgency && ALLOWED_URGENCIES.includes(rawUpdates.urgency)) {
      sanitizedUpdates.urgency = rawUpdates.urgency;
    }
    if (rawUpdates.summary && rawUpdates.summary.trim()) {
      sanitizedUpdates.summary = rawUpdates.summary.trim().slice(0, MAX_SUMMARY_LENGTH);
    }
    if (rawUpdates.address && rawUpdates.address.trim()) {
      sanitizedUpdates.address = rawUpdates.address.trim().slice(0, 250);
    }
    if (rawUpdates.removePhotoRequested === true) {
      sanitizedUpdates.removePhotoRequested = true;
    }

    return res.status(200).json({
      success: true,
      updatedFields: sanitizedUpdates,
      aiMessage:
        parsed.aiMessage ||
        "Perubahan sudah dicatat. Silakan periksa kartu pratinjau di atas.",
    });
  } catch (error) {
    const errorMessage = String(error?.message || "");
    if (
      error?.status === 429 ||
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota")
    ) {
      return sendError(
        res,
        429,
        "AI_QUOTA_EXCEEDED",
        "Asisten sedang sibuk. Anda dapat mengisi laporan sendiri.",
        error
      );
    }

    return sendError(
      res,
      502,
      "AI_UNAVAILABLE",
      "Asisten sedang tidak tersedia. Silakan coba lagi.",
      error
    );
  }
}