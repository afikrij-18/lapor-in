// Komponen Modal Konfirmasi Hapus Laporan - Lapor.in (Aksi Destruktif Admin)
// Menggantikan window.confirm dengan modal terpadu dark-mode WCAG AAA,
// memberikan pratinjau laporan dan peringatan penghapusan permanen dari Firestore.

import { useState, useEffect } from 'react';
import { Trash2, X, AlertTriangle, Loader2, ImageIcon, Mic } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function DeleteConfirmModal({ report, onConfirm, onClose }) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Ambil ID dan data laporan secara aman
  const reportId = typeof report === 'object' && report !== null ? report.id : report;
  const ticketCode = report?.ticketCode || (typeof reportId === 'string' ? reportId.slice(0, 8) : '-');
  const title = report?.title || t('admin.reportDefaultTitle', null, 'Laporan Warga');
  const category = report?.category || 'Umum';
  const urgency = report?.urgency || 'Normal';
  const hasPhoto = Boolean(report?.hasPhoto);
  const hasAudio = Boolean(report?.hasAudio || (report?.audioQuality && report.audioQuality !== 'text_input'));

  // Langkah 1: Pasang shortcut keyboard Escape untuk membatalkan dialog secara cepat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onClose]);

  // Langkah 2: Eksekusi penghapusan laporan secara permanen
  const handleExecuteDelete = async () => {
    if (!reportId || isDeleting) return;

    try {
      setIsDeleting(true);
      setLocalError(null);
      await onConfirm(reportId);
    } catch (err) {
      console.error('Gagal menghapus laporan di modal:', err);
      setLocalError(t('admin.deleteFailed', null, 'Gagal menghapus laporan. Pastikan koneksi atau izin admin memadai.'));
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base"
      onClick={(e) => {
        // Tutup modal jika admin mengklik backdrop luar
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-[#171717] border border-[#DC2626]/40 rounded-2xl max-w-lg w-full p-6 sm:p-7 text-[#FFFFFF] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Tombol Tutup Silang di Sudut Kanan Atas */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label={t('admin.cancel', null, 'Batal')}
          className="absolute top-5 right-5 p-2 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {/* Header Modal & Ikon Peringatan */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#DC2626] shrink-0">
            <Trash2 size={24} />
          </div>
          <div className="pr-8">
            <h3 id="delete-modal-title" className="text-xl font-bold text-[#FFFFFF] leading-snug">
              {t('admin.deleteModalTitle', null, 'Hapus Laporan Secara Permanen?')}
            </h3>
            <p className="text-sm text-[#D4D4D4] mt-1.5 leading-relaxed">
              {t(
                'admin.deleteModalDesc',
                null,
                'Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh data laporan, data privat moderator, rekaman suara warga, serta foto bukti lapangan akan dihapus dari sistem.',
              )}
            </p>
          </div>
        </div>

        {/* Kartu Ringkasan Laporan Sasaran */}
        <div className="bg-[#0A0A0A] border border-[#D4D4D4]/20 rounded-xl p-4 my-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#D4D4D4]/70 uppercase tracking-wider">
              {t('admin.deleteTargetLabel', null, 'Laporan yang akan dihapus:')}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 bg-[#171717] border border-[#D4D4D4]/20 rounded text-[#D4D4D4]">
              {ticketCode}
            </span>
          </div>

          <h4 className="text-base font-semibold text-[#FFFFFF] line-clamp-2">
            {title}
          </h4>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D4D4D4]/10 text-xs text-[#D4D4D4]">
            <span className="px-2 py-0.5 bg-[#171717] rounded border border-[#D4D4D4]/15 font-medium">
              {category}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[11px] ${
                urgency === 'Darurat'
                  ? 'bg-[#DC2626] text-[#FFFFFF]'
                  : urgency === 'Tinggi'
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#262626] text-[#D4D4D4]'
              }`}
            >
              {urgency}
            </span>
          </div>

          {/* Indikator Media Lapangan yang Ikut Dibersihkan */}
          {(hasPhoto || hasAudio) && (
            <div className="pt-2 border-t border-[#D4D4D4]/10 flex items-center gap-3 text-xs text-[#D4D4D4]/80">
              <span className="text-[11px] text-[#DC2626] font-medium flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{t('admin.deleteEvidencePurge', null, 'Lampiran terkait yang akan ikut dibersihkan:')}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {hasPhoto && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#171717] border border-[#D4D4D4]/20 rounded text-[11px] text-[#FFFFFF]"
                    title={t('admin.hasPhoto', null, 'Memiliki lampiran foto')}
                  >
                    <ImageIcon size={11} />
                    <span>Foto</span>
                  </span>
                )}
                {hasAudio && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#171717] border border-[#DC2626]/30 rounded text-[11px] text-[#DC2626]"
                    title={t('admin.hasAudio', null, 'Memiliki rekaman suara')}
                  >
                    <Mic size={11} />
                    <span>Audio</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pesan Kesalahan Jika Penghapusan Gagal */}
        {localError && (
          <div className="mb-4 p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
            <AlertTriangle size={14} className="shrink-0 text-[#DC2626]" />
            <span>{localError}</span>
          </div>
        )}

        {/* Tombol Aksi Batal dan Hapus Permanen */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#D4D4D4]/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 text-[#FFFFFF] rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('admin.cancel', null, 'Batal')}
          </button>
          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-[0.98] text-[#FFFFFF] rounded-xl text-sm font-semibold inline-flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-red-950/40 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('admin.deleting', null, 'Menghapus...')}</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{t('admin.deleteConfirmButton', null, 'Hapus Permanen')}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
