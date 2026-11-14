// Komponen Tabel Lapor.in dengan Tombol Aksi Adaptif Berdasarkan Status

import { Check, X, Eye, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function ReportQueueTable({ reports, onUpdateStatus, onDetail, showActions = true }) {
  const { t } = useLanguage();

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12 text-[#525252]">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
        <p>{t('admin.emptyQueue') || 'Tidak ada data laporan yang ditemukan.'}</p>
      </div>
    );
  }

  // Helper untuk merender lencana status
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
            <CheckCircle2 size={12} />
            <span>Disetujui</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800">
            <Loader2 size={12} className="animate-spin" />
            <span>Diproses</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800">
            <Check size={12} />
            <span>Selesai</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800">
            <X size={12} />
            <span>Ditolak</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800">
            <Clock size={12} />
            <span>Menunggu</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#D4D4D4]/30 text-xs text-[#525252] uppercase tracking-wider">
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Judul & Ringkasan</th>
            <th className="py-3 px-4">Urgensi</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">AI Valid</th>
            {showActions && <th className="py-3 px-4 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#171717]">
          {reports.map((report) => {
            const isEmergency = report.urgency === 'Darurat' || report.urgency === 'DARURAT';
            const status = report.status || 'pending';

            return (
              <tr 
                key={report.id} 
                className={`transition-colors ${
                  isEmergency && status === 'pending' ? 'bg-[#DC2626]/10 border-l-4 border-[#DC2626]' : 'hover:bg-[#0A0A0A]'
                }`}
              >
                {/* Kolom ID */}
                <td className="py-4 px-4 font-mono text-sm text-[#D4D4D4]">
                  {report.ticketCode || report.id.slice(0, 8)}
                </td>

                {/* Kolom Judul & Ringkasan */}
                <td className="py-4 px-4">
                  <div className="font-semibold text-[#FFFFFF]">{report.title}</div>
                  <div className="text-sm text-[#525252] line-clamp-1 mt-0.5">{report.summary}</div>
                </td>

                {/* Kolom Urgensi */}
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    isEmergency 
                      ? 'bg-[#DC2626] text-[#FFFFFF] animate-pulse' 
                      : report.urgency === 'Tinggi' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-[#525252] text-[#FFFFFF]'
                  }`}>
                    {report.urgency || 'Normal'}
                  </span>
                </td>

                {/* Kolom Status */}
                <td className="py-4 px-4">
                  {renderStatusBadge(status)}
                </td>

                {/* Kolom AI Valid */}
                <td className="py-4 px-4">
                  <span className={`text-xs px-2 py-1 rounded ${
                    report.isValidReport !== false ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
                  }`}>
                    {report.isValidReport !== false ? 'Valid' : 'Perlu Dicek'}
                  </span>
                </td>

                {/* Kolom Aksi Dinamis Berdasarkan Status */}
                {showActions && (
                  <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {/* Tombol Detail selalu ada untuk semua status */}
                    <button
                      onClick={() => onDetail && onDetail(report)}
                      title="Lihat Detail Laporan"
                      className="px-2.5 py-1.5 bg-[#171717] border border-[#D4D4D4]/30 hover:border-[#FFFFFF] text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                    >
                      <Eye size={14} />
                      <span>Detail</span>
                    </button>

                    {/* Jika status PENDING (Masih Antrean): Muncul Terima & Tolak */}
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(report.id, 'verified')}
                          title="Terima / Verifikasi Laporan"
                          className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                        >
                          <Check size={14} />
                          <span>Terima</span>
                        </button>
                        <button
                          onClick={() => onUpdateStatus(report.id, 'rejected')}
                          title="Tolak Laporan"
                          className="px-2.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                        >
                          <X size={14} />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {/* Jika status VERIFIED (Sudah Diterima): Muncul Proses & Selesai */}
                    {status === 'verified' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(report.id, 'in_progress')}
                          title="Ubah Status Menjadi Diproses"
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                        >
                          <Loader2 size={14} />
                          <span>Proses</span>
                        </button>
                        <button
                          onClick={() => onUpdateStatus(report.id, 'resolved')}
                          title="Tandai Selesai"
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          <span>Selesai</span>
                        </button>
                      </>
                    )}

                    {/* Jika status IN_PROGRESS (Sedang Diproses): Muncul Selesai */}
                    {status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateStatus(report.id, 'resolved')}
                        title="Tandai Selesai"
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-[#FFFFFF] rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>Selesai</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}