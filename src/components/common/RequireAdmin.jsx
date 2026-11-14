// Penjaga rute admin: isi halaman hanya tampil jika yang masuk adalah admin.
// Selain admin (termasuk warga anonim) diarahkan ke halaman login admin.
// Penjaga ini hanya mengatur tampilan; keamanan data tetap dijaga firestore.rules.

import { Navigate } from "react-router-dom";
import { useAuthUser } from "../../hooks/useAuthUser.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function RequireAdmin({ children }) {
  const { t } = useLanguage();
  const { isAdmin, isLoading } = useAuthUser();

  // Langkah 1: Tunggu Firebase selesai memuat sesi, agar admin tidak terlempar saat halaman dimuat ulang
  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-base text-text-muted">{t("common.loading")}</p>
      </main>
    );
  }

  // Langkah 2: Bukan admin, arahkan ke halaman login
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Langkah 3: Admin, tampilkan halaman
  return children;
}

export default RequireAdmin;
