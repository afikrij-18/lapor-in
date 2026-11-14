// Komponen Tabel Lapor.in - Tata Letak Tombol Aksi Dirapikan

import { Check, X, Eye, Clock, CheckCircle2, Loader2, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function ReportQueueTable({ reports, onUpdateStatus, onDetail, onEdit, onDelete, showActions = true }) {
  const { t } = useLanguage();

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12 text-[#D4D4D4] text-base">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-50 text-[#D4D4D4]" />
        <p>{t('admin.emptyQueue')}</p>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <CheckCircle2 size={14} />
            <span>{t('status.verified')}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Loader2 size={14} className="animate-spin" />
            <span>{t('status.in_progress')}</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check size={14} />
            <span>{t('status.resolved')}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <X size={14} />
            <span>{t('status.rejected')}</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock size={14} />
            <span>{t('status.pending')}</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#D4D4D4]/10 text-xs text-[#D4D4D4] uppercase tracking-wider">
            <th className="py-3 px-4 w-28">{t('admin.columnTicket')}</th>
            <th className="py-3 px-4">{t('admin.columnTitle')}</th>
            <th className="py-3 px-4 w-28">{t('admin.columnUrgency')}</th>
            <th className="py-3 px-4 w-36">{t('admin.columnStatus')}</th>
            <th className="py-3 px-4 w-28">{t('admin.columnAiValid')}</th>
            {showActions && <th className="py-3 px-4 text-right">{t('admin.columnAction')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D4D4D4]/10">
          {reports.map((report) => {
            const isEmergency = report.urgency === 'Darurat';
            const status = report.status || 'pending';

            return (
              <tr 
                key={report.id} 
                className={`transition-colors text-sm align-middle ${
                  isEmergency && status === 'pending' ? 'bg-[#DC2626]/15 border-l-4 border-[#DC2626]' : 'hover:bg-[#0A0A0A]'
                }`}
              >
                <td className="py-4 px-4 font-mono text-xs text-[#D4D4D4] whitespace-nowrap">
                  {report.ticketCode || report.id.slice(0, 8)}
                </td>
                <td className="py-4 px-4 max-w-xs sm:max-w-md">
                  <div className="font-semibold text-[#FFFFFF] text-base truncate">{report.title}</div>
                  <div className="text-xs text-[#D4D4D4] line-clamp-1 mt-0.5">{report.summary}</div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                    report.urgency === 'Darurat'
                      ? 'bg-[#DC2626] text-[#FFFFFF]' 
                      : report.urgency === 'Tinggi'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-[#262626] text-[#D4D4D4]'
                  }`}>
                    {report.urgency || 'Normal'}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {renderStatusBadge(status)}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                    report.isValidReport !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {report.isValidReport !== false ? t('admin.aiValid') : t('admin.aiInvalid')}
                  </span>
                </td>

                {showActions && (
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Tombol Detail (Ikon Saja di Layar Kecil, Teks di Layar Sedang+) */}
                      <button
                        onClick={() => onDetail && onDetail(report)}
                        title={t('admin.detail')}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[#171717] hover:bg-[#262626] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-lg text-xs font-medium inline-flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Tombol Edit */}
                      <button
                        onClick={() => onEdit && onEdit(report)}
                        title="Edit"
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[#171717] hover:bg-[#262626] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-lg text-xs font-medium inline-flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => onDelete && onDelete(report.id)}
                        title="Hapus"
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[#171717] hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium inline-flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>

                      {/* Tombol Status Pending (Terima / Tolak) */}
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(report.id, 'verified')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-lg text-xs font-medium inline-flex items-center cursor-pointer transition-colors shadow-sm"
                          >
                            <Check size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Terima</span>
                          </button>
                          <button
                            onClick={() => onUpdateStatus(report.id, 'rejected')}
                            className="px-2.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] rounded-lg text-xs font-medium inline-flex items-center cursor-pointer transition-colors shadow-sm"
                          >
                            <X size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Tolak</span>
                          </button>
                        </>
                      )}

                      {status === 'verified' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(report.id, 'in_progress')}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-[#FFFFFF] rounded-lg text-xs font-medium inline-flex items-center cursor-pointer transition-colors shadow-sm"
                          >
                            <Loader2 size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Proses</span>
                          </button>
                          <button
                            onClick={() => onUpdateStatus(report.id, 'resolved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-lg text-xs font-medium inline-flex items-center cursor-pointer transition-colors shadow-sm"
                          >
                            <CheckCircle2 size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Selesai</span>
                          </button>
                        </>
                      )}

                      {status === 'in_progress' && (
                        <button
                          onClick={() => onUpdateStatus(report.id, 'resolved')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-lg text-xs font-medium inline-flex items-center cursor-pointer transition-colors shadow-sm"
                        >
                          <CheckCircle2 size={14} className="sm:mr-1" />
                          <span className="hidden sm:inline">Selesai</span>
                        </button>
                      )}
                    </div>
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