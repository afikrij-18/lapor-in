// Server API lokal untuk pengembangan: menjalankan endpoint di folder api/ tanpa Vercel CLI.
//
// Cara pakai (dua terminal):
//   node dev-api.mjs      -> API lokal di http://localhost:3001
//   npm run dev           -> Vite meneruskan /api/* ke server ini (lihat vite.config.js)
//
// Agar aplikasi memakai endpoint ini (bukan balasan contoh), isi VITE_USE_MOCK_API=false
// di .env.local. File ini tidak dipakai di produksi; di Vercel folder api/ berjalan sendiri.

import http from "node:http";
import fs from "node:fs";

// Langkah 1: Baca variabel dari .env.local SEBELUM endpoint dimuat
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      let value = match[2].trim();
      // Buang tanda kutip pembungkus, misalnya pada FIREBASE_SERVICE_ACCOUNT_JSON='{...}'
      if (/^'.*'$/.test(value) || /^".*"$/.test(value)) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

// Langkah 2: Muat endpoint asli dari folder api/
const { default: processReport } = await import("./api/process-report.js");
const { default: chatAssistant } = await import("./api/chat-assistant.js");
const { default: reverseGeocode } = await import("./api/reverse-geocode.js");
const { default: cleanupAudio } = await import("./api/cleanup-audio.js");

const ROUTES = [
  ["/api/process-report", processReport],
  ["/api/chat-assistant", chatAssistant],
  ["/api/reverse-geocode", reverseGeocode],
  ["/api/cleanup-audio", cleanupAudio]
];

// Menambahkan res.status() dan res.json() seperti yang disediakan runtime Vercel
function enhanceRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

// Membaca body JSON seperti yang dilakukan runtime Vercel secara otomatis
async function parseJsonBody(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  req.body = raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  enhanceRes(res);

  try {
    // Langkah 3: Siapkan req.body dan req.query seperti di Vercel
    await parseJsonBody(req);
    const url = new URL(req.url, "http://localhost:3001");
    req.query = Object.fromEntries(url.searchParams.entries());

    // Langkah 4: Teruskan ke endpoint yang cocok
    const route = ROUTES.find(([path]) => url.pathname === path);
    if (route) {
      return await route[1](req, res);
    }

    return res.status(404).json({
      success: false,
      error: { code: "INVALID_INPUT", message: "Endpoint tidak ditemukan." }
    });
  } catch (error) {
    console.error("Error pada dev-api:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
      }
    });
  }
});

server.listen(3001, () => {
  console.log("API lokal berjalan di http://localhost:3001");
});
