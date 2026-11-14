// Footer yang tampil di semua halaman, kecuali halaman chat.

import { useLocation } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage.js";

function Footer() {
  const { t } = useLanguage();
  const location = useLocation();

  // Halaman chat memakai satu layar penuh (header di atas, kolom ketik di bawah),
  // jadi footer tidak ditampilkan di sana agar halaman tidak ikut tergulir.
  if (location.pathname === "/chat") {
    return null;
  }

  return (
    <footer className="border-t border-border-gray bg-white-surface px-4 py-4 text-center text-base text-text-muted">
      <p>{t("footer.tagline")}</p>
      <p>{t("footer.team")}</p>
    </footer>
  );
}

export default Footer;
