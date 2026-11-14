import http from "node:http";
import fs from "node:fs";
import processReport from "./api/process-report.js";
import chatAssistant from "./api/chat-assistant.js";

// Baca variabel dari .env.local
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

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

// Baca body JSON seperti yang dilakukan runtime Vercel secara otomatis
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
  await parseJsonBody(req);

  if (req.url.startsWith("/api/process-report")) {
    return processReport(req, res);
  }
  if (req.url.startsWith("/api/chat-assistant")) {
    return chatAssistant(req, res);
  }
  // Mock sementara untuk pengujian GPS lokal (file asli dibuat oleh Zikri)
  if (req.url.startsWith("/api/reverse-geocode")) {
    const urlObj = new URL(req.url, "http://localhost:3001");
    const lat = urlObj.searchParams.get("lat") || "-0.9279";
    const lng = urlObj.searchParams.get("lng") || "100.3600";
    return res.status(200).json({
      success: true,
      address: `Lokasi Uji Lokal (${lat},${lng}), Padang, Sumatera Barat`,
      geohash: "w22b6",
    });
  }

  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Not found" },
  });
});

server.listen(3001, () => {
  console.log("API lokal berjalan di http://localhost:3001");
});