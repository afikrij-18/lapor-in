// Footer Resmi Lapor.in (Anggota 2 - Irfan / Fikri)
// Tema gelap WCAG AAA, identitas brand lengkap, pilar keamanan warga, dan navigasi publik.

import { ShieldCheck, MapPin, Home, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage.js";

function Footer() {
  const { t } = useLanguage();
  const location = useLocation();

  // Langkah 1: Sembunyikan footer pada halaman interaktif penuh
  // /chat (sesi laporan satu layar) dan /peta (kanvas peta GIS h-screen) agar tidak memicu scrollbar ganda.
  if (location.pathname === "/chat" || location.pathname === "/peta") {
    return null;
  }

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-[#1F1F1F] text-[#D4D4D4] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-12">
        {/* Langkah 2: Grid 3 Kolom Responsif (Brand & Misi, Navigasi Publik, Jaminan Privasi) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-8 sm:pb-10 border-b border-[#1A1A1A]">
          
          {/* Kolom 1: Identitas Brand Resmi & Deskripsi Misi */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 sm:gap-3 text-white focus:outline-none group select-none w-fit"
              aria-label={t("common.appName", null, "Lapor.in")}
            >
              {/* Ikon Perisai Verifikasi / Shield Check sesuai logo resmi */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border-2 border-[#DC2626] flex items-center justify-center text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" strokeWidth={2.5} />
              </div>

              {/* Tipografi Brand & Tagline Berlapis */}
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#FFFFFF] leading-none">
                  Lapor<span className="text-[#DC2626]">.in</span>
                </span>
                <div className="h-px bg-[#DC2626] w-full my-0.5 opacity-90" />
                <span className="text-[7.5px] sm:text-[8.5px] font-medium text-[#FFFFFF] tracking-wider whitespace-nowrap leading-none">
                  {t("common.brandTagline", null, "Aman. Terverifikasi. Terlindungi.")}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed max-w-sm mt-1">
              {t("footer.desc", null, "Platform pelaporan dan aspirasi warga yang inklusif, aman, dan terverifikasi untuk perbaikan fasilitas serta kenyamanan lingkungan bersama.")}
            </p>
          </div>

          {/* Kolom 2: Tautan Navigasi Cepat */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
              {t("footer.navTitle", null, "Navigasi")}
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-[#A3A3A3]">
              <li>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 hover:text-[#FFFFFF] transition-colors focus:outline-none"
                >
                  <Home size={14} className="text-[#DC2626]" />
                  <span>{t("footer.home", null, "Beranda")}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/peta"
                  className="inline-flex items-center gap-2 hover:text-[#FFFFFF] transition-colors focus:outline-none"
                >
                  <MapPin size={14} className="text-[#DC2626]" />
                  <span>{t("footer.publicMap", null, "Peta Publik")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Jaminan Keamanan & Privasi Warga */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
              {t("footer.trustTitle", null, "Jaminan Keamanan Warga")}
            </h3>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm text-[#A3A3A3]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#DC2626] shrink-0 mt-0.5" />
                <span>{t("footer.trustAnonymous", null, "100% Bebas Registrasi (Sesi Anonim)")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#DC2626] shrink-0 mt-0.5" />
                <span>{t("footer.trustExif", null, "Pembersihan Metadata EXIF Foto")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#DC2626] shrink-0 mt-0.5" />
                <span>{t("footer.trustAudio", null, "Retensi Suara Maksimal 30 Hari")}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Langkah 3: Bilah Bawah (Hak Cipta, Tim, & Tema Kompetisi) */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737373]">
          <p className="text-center sm:text-left">
            {t("footer.copyright", null, "© 2026 Lapor.in • Tim Minimize. Seluruh hak cipta dilindungi.")}
          </p>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#A3A3A3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>{t("footer.themeTag", null, "AI for Access and Digital Life")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;