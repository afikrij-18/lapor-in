// Komponen Bilah Statistik Admin - Lapor.in

import { FileText, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function AdminStatsBar({ stats }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Laporan */}
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm text-[#525252]">{t('admin.statTotal') || 'Total'}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.total || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-[#FFFFFF]">
          <FileText size={20} />
        </div>
      </div>

      {/* Menunggu Verifikasi */}
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm text-[#525252]">{t('admin.statPending') || 'Menunggu'}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.pending || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-yellow-500">
          <Clock size={20} />
        </div>
      </div>

      {/* Darurat (Sorotan Merah Berdenyut) */}
      <div className="bg-[#171717] border border-[#DC2626] rounded-xl p-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm text-[#FEE2E2] font-medium">{t('admin.statEmergency') || 'Darurat'}</p>
          <h3 className="text-2xl font-bold text-[#DC2626] mt-1">{stats.emergency || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#DC2626] flex items-center justify-center text-[#FFFFFF] animate-pulse">
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* Selesai */}
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm text-[#525252]">{t('admin.statResolved') || 'Selesai'}</p>
          <h3 className="text-2xl font-bold text-[#FFFFFF] mt-1">{stats.resolved || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/30 flex items-center justify-center text-green-500">
          <CheckCircle2 size={20} />
        </div>
      </div>
    </div>
  );
}