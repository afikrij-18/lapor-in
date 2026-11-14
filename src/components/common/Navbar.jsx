// Komponen Navigasi Utama (Header Navbar) - Lapor.in (Anggota 2 - Irfan)
// Sesuai PRD bagian 2 & 9.2.
// Sticky glassmorphism header, logo resmi, badge status sistem siaga/anonim, dan navigasi ramah sentuh.

import { ShieldCheck, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function Navbar() {
  const { t } = useLanguage();
  const location = useLocation();

  const isMapActive = location.pathname === '/peta';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#171717] px-4 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between transition-all">
      {/* Langkah 1: Logo & Identitas Resmi Lapor.in (Ikon Perisai, Teks Lapor.in Lebih Besar, Garis Aksen Halus Tipis, & Tagline Proporsional) */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 text-white focus:outline-none group select-none shrink-0"
          aria-label={t('common.appName', null, 'Lapor.in')}
        >
          {/* Ikon Perisai Verifikasi / Shield Check sesuai logo resmi */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border-2 border-[#DC2626] flex items-center justify-center text-white shadow-[0_0_14px_rgba(220,38,38,0.35)] group-hover:scale-105 transition-transform shrink-0">
            <ShieldCheck className="w-5.5 h-5.5 sm:w-6 sm:h-6 md:w-6.5 md:h-6.5 text-white" strokeWidth={2.5} />
          </div>

          {/* Tipografi Brand Lebih Besar, Garis Lebih Tipis, & Tagline Proporsional */}
          <div className="flex flex-col justify-center">
            <span className="font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight text-[#FFFFFF] leading-none">
              Lapor<span className="text-[#DC2626]">.in</span>
            </span>
            <div className="h-px bg-[#DC2626] w-full my-0.5 sm:my-1 opacity-90" />
            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-medium text-[#FFFFFF] tracking-wider whitespace-nowrap leading-none">
              {t('common.brandTagline', null, 'Aman. Terverifikasi. Terlindungi.')}
            </span>
          </div>
        </Link>
      </div>

      {/* Langkah 2: Tautan Navigasi Publik (Peta Publik) dengan Background & Border Seimbang */}
      <nav className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Navigasi Utama">
        <Link
          to="/peta"
          className={`group h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer shrink-0 select-none ${
            isMapActive
              ? 'bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] text-[#FFFFFF] border-2 border-[#DC2626] shadow-[0_0_12px_rgba(220,38,38,0.3)]'
              : 'bg-[#171717] hover:bg-[#1F1F1F] text-[#FFFFFF] border border-[#2E2E2E] hover:border-[#DC2626]/50 hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]'
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isMapActive
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#DC2626]/15 text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white'
            }`}
          >
            <MapPin size={13} className="shrink-0 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="tracking-tight text-white font-medium whitespace-nowrap">
            {t('nav.publicMap', null, 'Peta Publik')}
          </span>
        </Link>
      </nav>
    </header>
  );
}
