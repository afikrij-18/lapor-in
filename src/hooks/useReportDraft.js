// Hook untuk membaca dan mengubah draf laporan yang sedang dibuat warga (kontrak PRD bagian 7.5).
//
// Contoh di halaman utama (sebelum pindah ke /chat):
//   const { startDraft } = useReportDraft();
//   startDraft({ inputMode: "audio", audioBlob });   // atau { inputMode: "manual" }
//   navigate("/chat");
//
// Contoh di halaman chat:
//   const { draft, inputMode, updateDraft, resetDraft } = useReportDraft();
//   updateDraft({ title: "Jalan Berlubang", urgency: "Tinggi" });
//
// Isi yang tersedia:
// - draft                : objek INITIAL_REPORT_DRAFT (src/config/constants.js) yang sedang diisi
// - inputMode            : "audio", "manual", atau null jika belum ada draf
// - startDraft({ inputMode, audioBlob }) : memulai draf baru dari halaman utama
// - updateDraft(fields)  : mengubah sebagian isi draf
// - resetDraft()         : mengosongkan draf, misalnya setelah laporan terkirim
//
// Tambahan untuk halaman chat:
// - messages, addMessage(role, text)        : riwayat percakapan; role "user" atau "model"
// - photoFile, photoPreviewUrl              : foto hasil kompresi dan URL pratinjaunya
// - attachPhoto(file, previewUrl), removePhoto()
// - isProcessing, setIsProcessing           : penanda AI sedang memproses

import { createContext, useContext } from "react";

export const ReportDraftContext = createContext(null);

export function useReportDraft() {
  const context = useContext(ReportDraftContext);
  if (!context) {
    throw new Error("useReportDraft harus dipakai di dalam ReportDraftProvider");
  }
  return context;
}
