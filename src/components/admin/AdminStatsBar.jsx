// Komponen Bilah Statistik Admin - Lapor.in
// Menampilkan metrik ringkas interaktif: Total Laporan, Menunggu Verifikasi, Darurat, dan Selesai.
// Dapat diklik untuk memfilter data antrean secara instan (Quick Filter).

import { FileText, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function AdminStatsBar({ stats, activeFilter = 'all', onFilterClick }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Laporan (Klik untuk Reset / Tampilkan Semua) */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('total')}
        className={`w-full text-left bg-[#171717] rounded-xl p-4 flex items-center justify-between shadow-md transition-all duration-200 cursor-pointer border active:scale-[0.98] ${
          activeFilter === 'total'
            ? 'border-[#FFFFFF] ring-2 ring-[#FFFFFF]/40 bg-[#222222]'
            : 'border-[#D4D4D4]/30 hover:border-[#D4D4D4] hover:bg-[#202020]'
        }`}
        title={t('admin.clickToFilter', null, 'Klik untuk melihat semua laporan')}
      >
        <div>
          <p className="text-sm text-[#D4D4D4]">{t('admin.statTotal', null, 'Total')}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.total || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-[#FFFFFF] shadow-inner">
          <FileText size={20} />
        </div>
      </button>

      {/* 2. Menunggu Verifikasi (Klik untuk Filter Pending) */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('pending')}
        className={`w-full text-left bg-[#171717] rounded-xl p-4 flex items-center justify-between shadow-md transition-all duration-200 cursor-pointer border active:scale-[0.98] ${
          activeFilter === 'pending'
            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-[#222222]'
            : 'border-[#D4D4D4]/30 hover:border-amber-500/60 hover:bg-[#202020]'
        }`}
        title={t('admin.clickToFilter', null, 'Klik untuk menyaring laporan yang menunggu verifikasi')}
      >
        <div>
          <p className="text-sm text-[#D4D4D4]">{t('admin.statPending', null, 'Menunggu')}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.pending || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-amber-500 shadow-inner">
          <Clock size={20} />
        </div>
      </button>

      {/* 3. Darurat (Sorotan Merah Berdenyut, Klik untuk Filter Darurat) */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('emergency')}
        className={`w-full text-left bg-[#171717] rounded-xl p-4 flex items-center justify-between shadow-md shadow-red-950/20 transition-all duration-200 cursor-pointer border active:scale-[0.98] ${
          activeFilter === 'emergency'
            ? 'border-[#DC2626] ring-2 ring-[#DC2626]/50 bg-[#222222]'
            : 'border-[#DC2626] hover:border-[#B91C1C] hover:bg-[#202020]'
        }`}
        title={t('admin.clickToFilter', null, 'Klik untuk menyaring laporan darurat')}
      >
        <div>
          <p className="text-sm text-[#FEE2E2] font-semibold">{t('admin.statEmergency', null, 'Darurat')}</p>
          <h3 className="text-2xl font-bold text-[#DC2626] mt-1">{stats.emergency || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#DC2626] flex items-center justify-center text-[#FFFFFF] animate-pulse shadow-md">
          <AlertTriangle size={20} />
        </div>
      </button>

      {/* 4. Selesai (Klik untuk Filter Selesai) */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('resolved')}
        className={`w-full text-left bg-[#171717] rounded-xl p-4 flex items-center justify-between shadow-md transition-all duration-200 cursor-pointer border active:scale-[0.98] ${
          activeFilter === 'resolved'
            ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-[#222222]'
            : 'border-[#D4D4D4]/30 hover:border-emerald-500/60 hover:bg-[#202020]'
        }`}
        title={t('admin.clickToFilter', null, 'Klik untuk menyaring laporan selesai')}
      >
        <div>
          <p className="text-sm text-[#D4D4D4]">{t('admin.statResolved', null, 'Selesai')}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.resolved || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-emerald-500 shadow-inner">
          <CheckCircle2 size={20} />
        </div>
      </button>
    </div>
  );
}
