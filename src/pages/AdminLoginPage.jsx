// Route: /admin/login
// KERANGKA SEMENTARA dari scaffold. Pemilik halaman (Taqi) mengganti isi file ini.

import { useLanguage } from "../hooks/useLanguage.js";

function AdminLoginPage() {
  const { t } = useLanguage();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.loginTitle")}</h1>
    </main>
  );
}

export default AdminLoginPage;
