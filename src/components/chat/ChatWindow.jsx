// Kontainer riwayat percakapan antara warga dan asisten AI dengan auto-scroll ke pesan terbaru.

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";
import ChatBubble from "./ChatBubble.jsx";

export default function ChatWindow({
  messages,
  isProcessing,
  onSpeak,
  children,
}) {
  const { t } = useLanguage();
  const bottomRef = useRef(null);

  // Langkah 1: Gulir otomatis ke bagian bawah setiap kali ada pesan baru atau status proses berubah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F5F5] px-4 py-5 [scrollbar-gutter:stable_both-edges]">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {/* Langkah 2: Render seluruh gelembung pesan */}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onSpeak={onSpeak} />
        ))}

        {/* Langkah 3: Tampilkan indikator pemrosesan AI apabila sedang menunggu balasan */}
        {isProcessing && (
          <div className="flex items-center gap-2 self-start rounded-2xl rounded-tl-none bg-[#171717] px-4 py-3 text-base text-[#FFFFFF]">
            <Loader2 className="h-5 w-5 animate-spin text-[#DC2626]" />
            <span>{t("chat.processing")}</span>
          </div>
        )}

        {/* Langkah 4: Area slot untuk kartu pratinjau laporan, input foto, dan banner alur gagal */}
        {children}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}