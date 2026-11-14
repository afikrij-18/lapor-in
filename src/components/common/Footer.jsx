// Footer yang tampil di semua halaman.

import { useLanguage } from "../../hooks/useLanguage.js";

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border-gray bg-white-surface px-4 py-4 text-center text-base text-text-muted">
      <p>{t("footer.tagline")}</p>
      <p>{t("footer.team")}</p>
    </footer>
  );
}

export default Footer;
