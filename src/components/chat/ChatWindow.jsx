// Kontainer riwayat percakapan antara warga dan asisten AI dengan auto-scroll ke pesan terbaru.

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
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
    // Kelas chat-wallpaper memberi latar bermotif ikon pelaporan (lihat src/index.css)
    <div className="chat-wallpaper min-h-0 flex-1 overflow-y-auto px-4 py-5 [scrollbar-gutter:stable_both-edges]">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {/* Langkah 2: Render seluruh gelembung pesan */}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onSpeak={onSpeak} />
        ))}

        {/* Langkah 3: Tampilkan tiga titik berdenyut apabila sedang menunggu balasan AI */}
        {isProcessing && (
          <div className="chat-bubble-in flex items-start gap-3" role="status">
            <div
              aria-hidden="true"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-[#FFFFFF] shadow-sm"
            >
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-none border border-[#D4D4D4] bg-[#FFFFFF] px-4 py-3 text-base text-[#525252] shadow-md">
              <span aria-hidden="true" className="flex items-center gap-1">
                <span className="chat-dot h-2 w-2 rounded-full bg-[#DC2626]" />
                <span className="chat-dot h-2 w-2 rounded-full bg-[#DC2626]" />
                <span className="chat-dot h-2 w-2 rounded-full bg-[#DC2626]" />
              </span>
              <span>{t("chat.processing")}</span>
            </div>
          </div>
        )}

        {/* Langkah 4: Area slot untuk contoh laporan, kartu pratinjau laporan, dan pilihan alur gagal */}
        {children}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
