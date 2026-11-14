// Route: /peta
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Zikri) mengganti isi file ini.

import { useLanguage } from "../hooks/useLanguage.js";

function PublicMapPage() {
  const { t } = useLanguage();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("map.title")}</h1>
    </main>
  );
}

export default PublicMapPage;
