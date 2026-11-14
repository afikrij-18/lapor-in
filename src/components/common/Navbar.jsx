import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="w-full bg-[#0A0A0A] border-b border-[#171717] px-6 py-4 flex items-center justify-between">
      {/* Langkah 1: Logo dan nama aplikasi */}
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg md:text-xl focus:outline-none">
        <Shield className="w-6 h-6 text-[#DC2626]" />
        <span>{t('common.appName')}</span>
      </Link>

      {/* Langkah 2: Navigasi ke Peta Publik dan halaman admin */}
      <nav className="flex items-center gap-6">
        <Link
          to="/peta"
          className="text-base font-medium text-[#F5F5F5] hover:text-[#DC2626] transition-colors"
        >
          {t('nav.publicMap')}
        </Link>
        <Link
          to="/admin/login"
          className="text-base font-medium text-[#D4D4D4] hover:text-white transition-colors"
        >
          {t('nav.admin')}
        </Link>
      </nav>
    </header>
  );
}
