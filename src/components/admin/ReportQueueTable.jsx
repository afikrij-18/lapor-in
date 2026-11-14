// Komponen Tabel & Kartu Antrean Laporan Admin - Lapor.in
// Tampilan tabel ergonomis desktop (clickable row, anti-overflow) dan kartu mobile 44px ramah jempol.
// Menerapkan alur verifikasi terpadu: pending memprioritaskan Verifikasi (Cross-Check) & Tolak.

import { useState } from 'react';
import {
  Check,
  X,
  Eye,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
  Mic,
  Image as ImageIcon,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function ReportQueueTable({
  reports,
  onVerify,
  onUpdateStatus,
  onDetail,
  onDelete,
  showActions = true
}) {
  const { t } = useLanguage();
  const [copiedTicketId, setCopiedTicketId] = useState(null);

  // Fungsi menyalin kode tiket dengan feedback visual sementara
  const handleCopyTicket = (e, ticketCode, reportId) => {
    e.stopPropagation();
    if (!ticketCode) return;
    navigator.clipboard.writeText(ticketCode).then(() => {
      setCopiedTicketId(reportId);
      setTimeout(() => setCopiedTicketId(null), 1800);
    }).catch((err) => {
      console.warn('Gagal menyalin tiket:', err);
    });
  };

  // Langkah 1: Tampilkan status kosong jika tidak ada laporan dalam antrean
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/20">
          <ShieldCheck size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">
          {t('admin.emptyQueueTitle', null, 'Semua Beres!')}
        </h3>
        <p className="text-sm text-[#D4D4D4] max-w-md mx-auto">
          {t('admin.emptyQueueDesc', null, 'Semua laporan warga telah selesai diverifikasi dan diproses.')}
        </p>
      </div>
    );
  }

  // Langkah 2: Helper pembuat badge status siklus hidup laporan
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            <CheckCircle2 size={12} />
            <span>{t('admin.statusVerifiedShort', null, 'Terverifikasi')}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
            <Loader2 size={12} className="animate-spin" />
            <span>{t('admin.statusInProgressShort', null, 'Diproses')}</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <Check size={12} />
            <span>{t('admin.statusResolvedShort', null, 'Selesai')}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
            <X size={12} />
            <span>{t('admin.statusRejectedShort', null, 'Ditolak')}</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
            <Clock size={12} />
            <span>{t('admin.statusPendingShort', null, 'Menunggu')}</span>
          </span>
        );
    }
  };

  // Langkah 3: Helper pembuat badge urgensi (Darurat, Tinggi, Normal)
  const renderUrgencyBadge = (urgency) => {
    const isEmergency = urgency === 'Darurat';
    const isHigh = urgency === 'Tinggi';

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${isEmergency
          ? 'bg-[#DC2626] text-[#FFFFFF] shadow-sm animate-pulse'
          : isHigh
            ? 'bg-amber-500 text-black'
            : 'bg-[#262626] text-[#D4D4D4] border border-[#D4D4D4]/30'
          }`}
      >
        {urgency || 'Normal'}
      </span>
    );
  };

  return (
    <div>
      {/* ---------------- TAMPILAN MOBILE (< 768px): KARTU RAMAH JEMPOL ---------------- */}
      <div className="block md:hidden space-y-4">
        {reports.map((report) => {
          const isEmergency = report.urgency === 'Darurat';
          const status = report.status || 'pending';

          return (
            <div
              key={report.id}
              className={`p-4 rounded-xl border transition-all ${isEmergency && status === 'pending'
                ? 'bg-[#DC2626]/10 border-[#DC2626] shadow-md shadow-red-950/20'
                : 'bg-[#171717] border-[#D4D4D4]/20 hover:border-[#D4D4D4]/40'
                }`}
            >
              {/* Header Kartu: Kode Tiket & Badge Urgensi */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={(e) => handleCopyTicket(e, report.ticketCode || report.id.slice(0, 8), report.id)}
                  className="font-mono text-xs px-2 py-0.5 bg-[#0A0A0A] border border-[#D4D4D4]/20 hover:border-[#D4D4D4]/40 rounded text-[#D4D4D4] inline-flex items-center space-x-1 cursor-pointer"
                  title={copiedTicketId === report.id ? t('admin.ticketCopied', null, 'Tersalin!') : t('admin.clickToCopy', null, 'Klik untuk salin kode tiket')}
                >
                  <span>{report.ticketCode || report.id.slice(0, 8)}</span>
                  {copiedTicketId === report.id ? (
                    <Check size={11} className="text-emerald-400" />
                  ) : (
                    <Copy size={10} className="opacity-40" />
                  )}
                </button>
                <div className="flex items-center space-x-2">
                  {renderUrgencyBadge(report.urgency)}
                  {renderStatusBadge(status)}
                </div>
              </div>

              {/* Judul & Ringkasan Laporan */}
              <div className="mb-3">
                <h3 className="font-semibold text-base text-[#FFFFFF] line-clamp-1">{report.title}</h3>
                <p className="text-xs text-[#D4D4D4] line-clamp-2 mt-1">{report.summary}</p>
              </div>

              {/* Baris Meta: Kategori & Indikator Media */}
              <div className="flex items-center justify-between text-xs text-[#D4D4D4] border-t border-[#D4D4D4]/10 pt-2.5 mb-3">
                <span className="font-medium px-2 py-0.5 bg-[#0A0A0A] rounded border border-[#D4D4D4]/10">
                  {report.category || 'Lainnya'}
                </span>
                <div className="flex items-center space-x-2">
                  {report.hasPhoto && (
                    <span
                      title={t('admin.hasPhoto', null, 'Memiliki lampiran foto')}
                      className="p-1 bg-[#0A0A0A] border border-[#D4D4D4]/20 rounded text-[#FFFFFF]"
                    >
                      <ImageIcon size={13} />
                    </span>
                  )}
                  {(report.hasAudio || report.audioQuality !== 'text_input') && (
                    <span
                      title={t('admin.hasAudio', null, 'Memiliki rekaman suara')}
                      className="p-1 bg-[#0A0A0A] border border-[#D4D4D4]/20 rounded text-[#DC2626]"
                    >
                      <Mic size={13} />
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${report.isValidReport !== false
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                      }`}
                  >
                    {report.isValidReport !== false ? t('admin.aiValid', null, 'Valid') : t('admin.aiInvalid', null, 'Perlu Dicek')}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi Mobile (Tertata 2 Baris, Ukuran Minimal 44px) */}
              {showActions && (
                <div className="pt-2 border-t border-[#D4D4D4]/10 space-y-2">
                  {/* Status Pending: Verifikasi (Buka Modal Cross-Check) & Tolak */}
                  {status === 'pending' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => (onVerify ? onVerify(report) : onDetail && onDetail(report))}
                          className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <Check size={16} />
                          <span>{t('admin.actionVerify', null, 'Verifikasi')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(report.id, 'rejected')}
                          className="h-11 px-4 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <X size={16} />
                          <span>{t('admin.actionReject', null, 'Tolak')}</span>
                        </button>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => onDelete && onDelete(report)}
                          className="text-xs text-[#D4D4D4] hover:text-red-400 inline-flex items-center space-x-1 p-2 cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>{t('admin.delete', null, 'Hapus Laporan')}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Status Verified: Proses & Selesai */}
                  {status === 'verified' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(report.id, 'in_progress')}
                          className="h-11 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <Loader2 size={16} />
                          <span>{t('admin.actionProcess', null, 'Proses')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(report.id, 'resolved')}
                          className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <CheckCircle2 size={16} />
                          <span>{t('admin.actionResolve', null, 'Selesai')}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onDetail && onDetail(report)}
                          className="h-10 bg-[#0A0A0A] hover:bg-[#262626] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Eye size={15} />
                          <span>{t('admin.detail', null, 'Detail')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete && onDelete(report)}
                          className="h-10 bg-[#0A0A0A] hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 size={15} />
                          <span>{t('admin.delete', null, 'Hapus')}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Status In Progress: Selesai */}
                  {status === 'in_progress' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus && onUpdateStatus(report.id, 'resolved')}
                        className="w-full h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <CheckCircle2 size={16} />
                        <span>{t('admin.actionResolve', null, 'Selesai')}</span>
                      </button>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onDetail && onDetail(report)}
                          className="h-10 bg-[#0A0A0A] hover:bg-[#262626] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Eye size={15} />
                          <span>{t('admin.detail', null, 'Detail')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete && onDelete(report)}
                          className="h-10 bg-[#0A0A0A] hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 size={15} />
                          <span>{t('admin.delete', null, 'Hapus')}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Status Resolved atau Rejected */}
                  {(status === 'resolved' || status === 'rejected') && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onDetail && onDetail(report)}
                        className="h-10 bg-[#0A0A0A] hover:bg-[#262626] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <Eye size={15} />
                        <span>{t('admin.detail', null, 'Detail')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(report)}
                        className="h-10 bg-[#0A0A0A] hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 size={15} />
                        <span>{t('admin.delete', null, 'Hapus')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------------- TAMPILAN DESKTOP (>= 768px): TABEL PRESISI (TABLE-FIXED, ZERO OVERFLOW) ---------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D4D4D4]/10 text-xs text-[#D4D4D4] uppercase tracking-wider">
              <th className="py-3 px-3 w-32 shrink-0 whitespace-nowrap">{t('admin.columnTicket')}</th>
              <th className="py-3 px-3">{t('admin.columnTitle')}</th>
              <th className="py-3 px-3 w-24 whitespace-nowrap text-center">{t('admin.columnUrgency')}</th>
              <th className="py-3 px-3 w-32 whitespace-nowrap text-center">{t('admin.columnStatus')}</th>
              {showActions && <th className="py-3 px-3 w-40 whitespace-nowrap text-right">{t('admin.columnAction')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4D4D4]/10">
            {reports.map((report) => {
              const isEmergency = report.urgency === 'Darurat';
              const status = report.status || 'pending';

              return (
                <tr
                  key={report.id}
                  onClick={() => (onVerify ? onVerify(report) : onDetail && onDetail(report))}
                  className={`transition-colors text-sm align-middle cursor-pointer group ${
                    isEmergency && status === 'pending'
                      ? 'bg-[#DC2626]/15 hover:bg-[#DC2626]/25 border-l-4 border-[#DC2626]'
                      : 'hover:bg-[#1a1a1a] border-l-4 border-transparent hover:border-l-[#D4D4D4]/40'
                  }`}
                >
                  {/* Kolom 1: Kode Tiket (Click-to-Copy Instan & Terkunci 1 Baris) */}
                  <td className="py-3.5 px-3 font-mono text-xs text-[#D4D4D4] whitespace-nowrap shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyTicket(e, report.ticketCode || report.id.slice(0, 8), report.id)}
                      className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/20 hover:border-[#D4D4D4]/50 transition-colors cursor-pointer text-[#D4D4D4] hover:text-[#FFFFFF]"
                      title={copiedTicketId === report.id ? t('admin.ticketCopied', null, 'Tersalin!') : t('admin.clickToCopy', null, 'Klik untuk salin kode tiket')}
                    >
                      <span>{report.ticketCode || report.id.slice(0, 8)}</span>
                      {copiedTicketId === report.id ? (
                        <Check size={11} className="text-emerald-400" />
                      ) : (
                        <Copy size={10} className="opacity-40" />
                      )}
                    </button>
                  </td>

                  {/* Kolom 2: Judul, Ringkasan, Indikator Media & Badge Validitas AI */}
                  <td className="py-3.5 px-3 max-w-0 overflow-hidden">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-semibold text-[#FFFFFF] text-sm lg:text-base truncate min-w-0">
                        {report.title}
                      </span>
                      {/* Indikator Media & AI Badge dalam satu grup ringkas */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {report.hasPhoto && (
                          <span title={t('admin.hasPhoto', null, 'Memiliki lampiran foto')} className="text-[#D4D4D4]">
                            <ImageIcon size={14} />
                          </span>
                        )}
                        {(report.hasAudio || report.audioQuality !== 'text_input') && (
                          <span title={t('admin.hasAudio', null, 'Memiliki rekaman suara')} className="text-[#DC2626]">
                            <Mic size={14} />
                          </span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 ${report.isValidReport !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          title={report.isValidReport !== false ? 'Laporan Dinilai Valid oleh AI' : 'Laporan Perlu Dicek Ulang oleh Admin'}
                        >
                          {report.isValidReport !== false ? t('admin.aiValid', null, 'Valid') : t('admin.aiInvalid', null, 'Perlu Dicek')}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[#D4D4D4] truncate mt-0.5">
                      {report.summary}
                    </div>
                  </td>

                  {/* Kolom 3: Urgensi */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-center">
                    {renderUrgencyBadge(report.urgency)}
                  </td>

                  {/* Kolom 4: Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-center overflow-hidden">
                    {renderStatusBadge(status)}
                  </td>

                  {/* Kolom 5: Aksi Desktop Ringkas Berbasis Ikon (Fit di Layar Tanpa Overflow) */}
                  {showActions && (
                    <td className="py-3.5 px-3 text-right whitespace-nowrap w-40">
                      <div className="inline-flex items-center justify-end gap-1">
                        {/* Aksi Laporan Pending: Verifikasi (Membuka Modal Cross-Check) & Tolak */}
                        {status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onVerify) onVerify(report);
                                else if (onDetail) onDetail(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-emerald-600 hover:text-[#FFFFFF] hover:border-emerald-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.actionVerify', null, 'Verifikasi & Cross-Check')}
                              aria-label={t('admin.actionVerify', null, 'Verifikasi & Cross-Check')}
                            >
                              <ShieldCheck size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUpdateStatus) onUpdateStatus(report.id, 'rejected');
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#DC2626] hover:text-[#FFFFFF] hover:border-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.actionReject', null, 'Tolak')}
                              aria-label={t('admin.actionReject', null, 'Tolak')}
                            >
                              <X size={14} />
                            </button>
                            <span className="h-3.5 w-px bg-[#D4D4D4]/20 mx-0.5" aria-hidden="true" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#DC2626] hover:text-[#FFFFFF] hover:border-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.delete', null, 'Hapus')}
                              aria-label={t('admin.delete', null, 'Hapus')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {/* Aksi Laporan Verified: Proses, Selesai, Detail, Hapus */}
                        {status === 'verified' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUpdateStatus) onUpdateStatus(report.id, 'in_progress');
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-purple-600 hover:text-[#FFFFFF] hover:border-purple-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.actionProcess', null, 'Proses (Tandai Sedang Ditangani)')}
                              aria-label={t('admin.actionProcess', null, 'Proses (Tandai Sedang Ditangani)')}
                            >
                              <Loader2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUpdateStatus) onUpdateStatus(report.id, 'resolved');
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-emerald-600 hover:text-[#FFFFFF] hover:border-emerald-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.actionResolve', null, 'Selesai (Tandai Laporan Selesai)')}
                              aria-label={t('admin.actionResolve', null, 'Selesai (Tandai Laporan Selesai)')}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <span className="h-3.5 w-px bg-[#D4D4D4]/20 mx-0.5" aria-hidden="true" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDetail) onDetail(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#262626] hover:text-[#FFFFFF] hover:border-[#D4D4D4]/50 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.detail', null, 'Detail Laporan')}
                              aria-label={t('admin.detail', null, 'Detail Laporan')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#DC2626] hover:text-[#FFFFFF] hover:border-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.delete', null, 'Hapus')}
                              aria-label={t('admin.delete', null, 'Hapus')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {/* Aksi Laporan In Progress: Selesai, Detail, Hapus */}
                        {status === 'in_progress' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUpdateStatus) onUpdateStatus(report.id, 'resolved');
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-emerald-600 hover:text-[#FFFFFF] hover:border-emerald-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.actionResolve', null, 'Selesai (Tandai Laporan Selesai)')}
                              aria-label={t('admin.actionResolve', null, 'Selesai (Tandai Laporan Selesai)')}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <span className="h-3.5 w-px bg-[#D4D4D4]/20 mx-0.5" aria-hidden="true" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDetail) onDetail(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#262626] hover:text-[#FFFFFF] hover:border-[#D4D4D4]/50 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.detail', null, 'Detail Laporan')}
                              aria-label={t('admin.detail', null, 'Detail Laporan')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#DC2626] hover:text-[#FFFFFF] hover:border-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.delete', null, 'Hapus')}
                              aria-label={t('admin.delete', null, 'Hapus')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {/* Aksi Laporan Resolved / Rejected: Detail, Hapus */}
                        {(status === 'resolved' || status === 'rejected') && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDetail) onDetail(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#262626] hover:text-[#FFFFFF] hover:border-[#D4D4D4]/50 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.detail', null, 'Detail Laporan')}
                              aria-label={t('admin.detail', null, 'Detail Laporan')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(report);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#D4D4D4]/20 text-[#D4D4D4] hover:bg-[#DC2626] hover:text-[#FFFFFF] hover:border-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
                              title={t('admin.delete', null, 'Hapus')}
                              aria-label={t('admin.delete', null, 'Hapus')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
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
    </div>
  );
}
