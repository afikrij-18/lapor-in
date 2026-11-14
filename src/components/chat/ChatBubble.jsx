// Komponen gelembung percakapan: asisten AI (putih, berbayang) dan warga (hitam).

import { Bot, User, Volume2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";

export default function ChatBubble({ message, onSpeak }) {
  const { t } = useLanguage();
  const isAi = message.role === "model";

  // Langkah 1: Format waktu singkat dari timestamp pesan
  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    // Kelas chat-bubble-in memberi gerakan muncul yang halus (lihat src/index.css)
    <div
      className={`chat-bubble-in flex w-full items-start gap-3 ${
        isAi ? "justify-start" : "justify-end"
      }`}
    >
      {/* Langkah 2: Tampilkan avatar asisten di sisi kiri apabila pesan berasal dari AI */}
      {isAi && (
        <div
          aria-hidden="true"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-[#FFFFFF] shadow-sm"
        >
          <Bot className="h-5 w-5" />
        </div>
      )}

      {/* Langkah 3: Kontainer isi bubble dengan kontras tinggi sesuai palet resmi */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed sm:max-w-[75%] ${
          isAi
            ? "rounded-tl-none border border-[#D4D4D4] bg-[#FFFFFF] text-[#0A0A0A] shadow-md"
            : "rounded-tr-none bg-[#0A0A0A] text-[#FFFFFF] shadow-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        <div
          className={`mt-2 flex items-center gap-3 text-sm ${
            isAi ? "justify-between text-[#525252]" : "justify-end text-[#D4D4D4]"
          }`}
        >
          {isAi && typeof onSpeak === "function" && (
            <button
              type="button"
              onClick={() => onSpeak(message.text)}
              aria-label={t("chat.listen")}
              className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] focus:outline-2 focus:outline-[#DC2626]"
            >
              <Volume2 className="h-4 w-4 text-[#DC2626]" />
              <span>{t("chat.listen")}</span>
            </button>
          )}
          {formattedTime && <span>{formattedTime}</span>}
        </div>
      </div>

      {/* Langkah 4: Tampilkan ikon warga di sisi kanan apabila pesan berasal dari pengguna */}
      {!isAi && (
        <div
          aria-hidden="true"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0A0A0A] bg-[#FFFFFF] text-[#0A0A0A] shadow-sm"
        >
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
