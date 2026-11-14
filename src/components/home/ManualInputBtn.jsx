// Komponen Tombol Input Manual Sekunder - Lapor.in (Anggota 2 - Irfan)
// Sesuai PRD bagian 2.1 & 3 (Langkah 1).
// Warna Putih berbingkai Hitam (#0A0A0A) dengan teks "Ketik Laporan Secara Manual".

import { Keyboard } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function ManualInputBtn({ onClick }) {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Langkah 1: Tombol Sekunder Putih Berbingkai Hitam (#0A0A0A) dengan Teks 1 Baris Utuh (Anti-Wrap, Mobile-First) */}
      <button
        type="button"
        onClick={onClick}
        className="w-full py-3 sm:py-3.5 md:py-4 px-4 sm:px-6 bg-[#FFFFFF] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:bg-[#F5F5F5] active:scale-[0.98] transition-all text-xs sm:text-sm md:text-base shadow-lg cursor-pointer whitespace-nowrap"
      >
        <Keyboard className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A0A0A] shrink-0" />
        <span className="whitespace-nowrap">{t('home.manualButton', null, 'Ketik Laporan Secara Manual')}</span>
      </button>
    </div>
  );
}
