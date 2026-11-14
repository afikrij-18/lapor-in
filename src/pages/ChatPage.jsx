// Route: /chat
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Nugi) mengganti isi file ini.

import { useLanguage } from "../hooks/useLanguage.js";

function ChatPage() {
  const { t } = useLanguage();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("chat.title")}</h1>
    </main>
  );
}

export default ChatPage;
