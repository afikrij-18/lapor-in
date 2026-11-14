// Vercel Serverless Function: POST /api/process-report
// Memproses rekaman suara atau ketikan awal warga menjadi draf laporan terstruktur via Gemini 2.5 Flash.

import { GoogleGenAI, Type } from "@google/genai";
import {
  MAX_AUDIO_BYTES,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  REPORT_CATEGORIES,
  URGENCY_LEVELS,
} from "../src/config/constants.js";

const ALLOWED_URGENCIES = Object.values(URGENCY_LEVELS);

// Instruksi sistem padat (< 250 token) dengan aturan normalisasi gagap & dialek
const SYSTEM_INSTRUCTION = `Asisten AI pelaporan warga Lapor.in. Ekstrak audio/teks warga menjadi JSON terstruktur.
Aturan:
1. Abaikan suara bising latar; fokus pada ucapan pelapor.
2. Disfluency normalization: rapikan gagap/pengulangan suku kata menjadi kalimat baku utuh tanpa mengubah makna.
3. Terjemahkan bahasa daerah (misal Minang) ke bahasa Indonesia baku pada title & summary; pertahankan nama tempat lokal; simpan ucapan asli di rawTranscript.
4. Jangan menebak info yang tidak diucapkan.
5. Jika hanya bising kosong/spam, set isValidReport: false dan audioQuality: "unusable".
6. title maks 60 karakter, summary maks 1000 karakter.
7. aiMessage: 1-2 kalimat ramah merangkum laporan dan menanyakan apakah ada foto lokasi (atau tekan Lewati).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    draft: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        category: { type: Type.STRING, enum: REPORT_CATEGORIES },
        urgency: { type: Type.STRING, enum: ALLOWED_URGENCIES },
        summary: { type: Type.STRING },
        rawTranscript: { type: Type.STRING },
        isValidReport: { type: Type.BOOLEAN },
        audioQuality: {
          type: Type.STRING,
          enum: ["clear", "low", "unusable", "text_input"],
        },
      },
      required: [
        "title",
        "category",
        "urgency",
        "summary",
        "rawTranscript",
        "isValidReport",
        "audioQuality",
      ],
    },
    aiMessage: { type: Type.STRING },
  },
  required: ["draft", "aiMessage"],
};

// Mengirim balasan error seragam dan mencatat detail teknis di log server
function sendError(res, status, code, userMessage, devError = null) {
  if (devError) {
    console.error(`Error pada processReport [${code}]:`, devError);
  }
  return res.status(status).json({
    success: false,
    error: {
      code,
      message: userMessage,
    },
  });
}

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

// Memverifikasi token Cloudflare Turnstile ke server Cloudflare
async function verifyTurnstile(token, remoteIp) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return process.env.NODE_ENV !== "production";
  }
  if (!token) {
    // Token kosong berarti widget Turnstile di halaman chat tidak menghasilkan token
    console.error("Turnstile gagal: token kosong (widget di browser tidak mengeluarkan token)");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );
    const result = await verifyResponse.json();
    if (!result.success) {
      // Kode error dari Cloudflare hanya dicatat di log server, tidak dikirim ke warga
      console.error("Turnstile gagal: token ditolak Cloudflare:", result["error-codes"]);
    }
    return Boolean(result.success);
  } catch (error) {
    console.error("Error pada verifikasi Cloudflare Turnstile:", error);
    return false;
  }
}

// Format rekaman yang diterima (PRD bagian 4.1): WebM, MP4, atau OGG
const ALLOWED_AUDIO_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "INVALID_INPUT", "Metode permintaan tidak didukung.");
  }

  try {
    // Langkah 1: Validasi token anti-bot Cloudflare Turnstile
    const turnstileToken = req.headers["x-turnstile-token"];
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress;

    const isVerified = await verifyTurnstile(turnstileToken, clientIp);
    if (!isVerified) {
      return sendError(
        res,
        403,
        "TURNSTILE_FAILED",
        "Verifikasi keamanan gagal. Silakan muat ulang halaman."
      );
    }

    // Langkah 2: Ambil dan validasi input dari body JSON (PRD bagian 8.2).
    // Rekaman dikirim sebagai base64 (audioBase64 + audioMimeType); ketikan sebagai textInput.
    const body = await parseJsonBody(req);
    const textInput = typeof body.textInput === "string" ? body.textInput.trim() : "";
    const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64.trim() : "";
    const audioMimeType =
      typeof body.audioMimeType === "string" ? body.audioMimeType.split(";")[0].trim() : "";

    const hasAudio = audioBase64.length > 0;
    const hasText = textInput.length > 0;

    if (!hasAudio && !hasText) {
      return sendError(
        res,
        400,
        "INVALID_INPUT",
        "Data yang dikirim belum lengkap atau tidak sesuai."
      );
    }

    if (hasAudio && !ALLOWED_AUDIO_MIME_TYPES.includes(audioMimeType)) {
      return sendError(
        res,
        400,
        "INVALID_INPUT",
        "Data yang dikirim belum lengkap atau tidak sesuai."
      );
    }

    if (hasAudio && Buffer.byteLength(audioBase64, "base64") > MAX_AUDIO_BYTES) {
      return sendError(
        res,
        400,
        "INVALID_INPUT",
        "Ukuran rekaman melebihi batas maksimal 120 detik."
      );
    }

    // Langkah 3: Siapkan payload multimodal untuk Gemini
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

    // Batas waktu per percobaan (minimal 10 detik menurut API): jika satu model macet,
    // endpoint pindah ke model berikutnya
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 15000 } });
    const contents = [];

    if (hasAudio) {
      contents.push({
        inlineData: {
          mimeType: audioMimeType,
          data: audioBase64,
        },
      });
      contents.push("Ekstrak laporan warga dari rekaman audio di atas sesuai aturan sistem.");
    } else {
      contents.push(
        `<laporan_warga>\n${textInput.slice(0, 1500)}\n</laporan_warga>\nEkstrak laporan warga di atas dan set audioQuality ke "text_input".`
      );
    }

    // Langkah 4: Panggil Gemini dengan JSON schema terkunci dan auto-fallback saat server sibuk (503).
    // gemini-2.5-flash (nama di PRD awal) sudah tidak tersedia untuk API key baru (404).
    // Model utama gemini-3.5-flash: saat diuji menjawab sekitar 2 detik, sedangkan
    // gemini-3.8-flash melewati batas waktu. GEMINI_MODEL dapat menggantinya lewat environment.
    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ];
    // maxOutputTokens 1024: balasan memuat ringkasan (maks 1000 karakter) dan transkrip 120 detik.
    // thinkingBudget 0 (ditambahkan per model di bawah): token "thinking" ikut memakan jatah
    // keluaran dan terbukti memotong JSON. Model "lite" menolak pengaturan ini (400) dan
    // memang tidak memakai thinking, jadi untuk model itu pengaturannya tidak dikirim.
    const modelConfig = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 1024,
    };

    let response = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
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
          console.warn(`Model ${modelName} tidak tersedia (${status}), mencoba model berikutnya...`);
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error("Seluruh model Gemini sedang sibuk.");
    }
   

    const parsedResult = safeParseJson(response.text);

    // Langkah 5: Sanitasi panjang karakter sesuai aturan Firestore Rules sebelum dikirim
    const cleanDraft = {
      title: String(parsedResult.draft.title || "Laporan Warga").slice(0, MAX_TITLE_LENGTH),
      category: REPORT_CATEGORIES.includes(parsedResult.draft.category)
        ? parsedResult.draft.category
        : "Lainnya",
      urgency: ALLOWED_URGENCIES.includes(parsedResult.draft.urgency)
        ? parsedResult.draft.urgency
        : URGENCY_LEVELS.NORMAL,
      summary: String(parsedResult.draft.summary || "").slice(0, MAX_SUMMARY_LENGTH),
      rawTranscript: String(parsedResult.draft.rawTranscript || textInput).slice(0, 2000),
      isValidReport: Boolean(parsedResult.draft.isValidReport),
      audioQuality: hasAudio ? parsedResult.draft.audioQuality || "clear" : "text_input",
    };

    return res.status(200).json({
      success: true,
      draft: cleanDraft,
      aiMessage:
        parsedResult.aiMessage ||
        "Saya sudah merangkum laporan Anda. Apakah Anda memiliki foto kondisi di lokasi? Jika ada silakan unggah, atau tekan Lewati.",
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