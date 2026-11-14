import { Keyboard } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function ManualInputBtn({ onClick }) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="w-full py-4 px-6 bg-white text-[#0A0A0A] border border-[#0A0A0A] rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-[#F5F5F5] transition-colors text-base md:text-lg shadow-sm"
    >
      {/* Langkah 1: Menampilkan ikon keyboard vektor menggunakan lucide-react */}
      <Keyboard className="w-5 h-5 text-[#0A0A0A]" />

      {/* Langkah 2: Menampilkan label tombol teks manual dari kamus lokalisasi */}
      <span>{t('home.manualButton')}</span>
    </button>
  );
}
