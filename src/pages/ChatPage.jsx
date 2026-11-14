// Route: /chat
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Nugi) mengganti isi file ini.
//
// Catatan untuk pemilik halaman:
// - Draf dan rekaman dari halaman utama dibaca lewat useReportDraft():
//     const { draft, inputMode, updateDraft, resetDraft } = useReportDraft();
//   inputMode berisi "audio" (rekaman ada di draft.audioBlob) atau "manual".
// - Pasang <TurnstileWidget onSuccess={...} /> (src/components/common/TurnstileWidget.jsx)
//   di halaman ini, lalu kirim tokennya ke processReport({ ..., turnstileToken }).
//   Token Turnstile sekali pakai, jadi tombol "Coba Lagi" butuh token baru dari widget.
// - Pertahankan pengecekan di bawah: tanpa draf, warga dikembalikan ke halaman utama.

import { Navigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage.js";
import { useReportDraft } from "../hooks/useReportDraft.js";

function ChatPage() {
  const { t } = useLanguage();
  const { inputMode } = useReportDraft();

  // Halaman chat dibuka tanpa draf (misalnya setelah dimuat ulang): kembali ke halaman utama
  if (!inputMode) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("chat.title")}</h1>
    </main>
  );
}

export default ChatPage;
