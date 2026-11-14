// Komponen Modal Alasan Penolakan - Lapor.in

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function RejectReasonModal({ reportId, onConfirm, onClose }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reportId, reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base">
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-[#FFFFFF] shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#D4D4D4]/20 pb-4 mb-5">
          <div className="flex items-center space-x-3 text-[#DC2626]">
            <AlertCircle size={24} />
            <h3 className="text-xl font-bold text-[#FFFFFF]">{t('admin.reject') || 'Tolak Laporan'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Alasan */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base text-[#D4D4D4] mb-2 font-medium">
              {t('admin.rejectReason') || 'Masukkan alasan penolakan singkat:'}
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Informasi lokasi tidak valid atau bukti foto tidak jelas..."
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-4 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
              required
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-[#D4D4D4]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 text-[#FFFFFF] rounded-xl text-base font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-[#FFFFFF] rounded-xl text-base font-semibold transition-colors cursor-pointer shadow-md"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}