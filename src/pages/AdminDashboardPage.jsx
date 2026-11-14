// Route: /admin
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Taqi) mengganti isi file ini.

import { useLanguage } from "../hooks/useLanguage.js";

function AdminDashboardPage() {
  const { t } = useLanguage();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.dashboardTitle")}</h1>
    </main>
  );
}

export default AdminDashboardPage;
