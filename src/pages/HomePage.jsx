// Route: /
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Irfan) mengganti isi file ini.

import { useLanguage } from "../hooks/useLanguage.js";

function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("home.title")}</h1>
    </main>
  );
}

export default HomePage;
