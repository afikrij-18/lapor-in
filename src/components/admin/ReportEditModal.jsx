// Komponen Modal Edit Laporan - Lapor.in (Koreksi Admin dengan Batas Panjang Karakter)
// Memungkinkan admin mengoreksi data laporan (judul, kategori, urgensi, ringkasan, alamat) sebelum dipublikasikan.

import { useState } from 'react';
import { X, Edit3, Save, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';
import { updateReport } from '../../services/reportService.js';
import { REPORT_CATEGORIES, URGENCY_LEVELS, MAX_TITLE_LENGTH, MAX_SUMMARY_LENGTH } from '../../config/constants.js';

export default function ReportEditModal({ report, onClose, onUpdated }) {
  const { t } = useLanguage();

  // Langkah 1: Normalisasi daftar kategori & urgensi resmi dari konstanta
  const categoriesList = Array.isArray(REPORT_CATEGORIES)
    ? REPORT_CATEGORIES
    : REPORT_CATEGORIES ? Object.values(REPORT_CATEGORIES) : ['Infrastruktur', 'Kebersihan', 'Keamanan', 'Fasilitas Umum', 'Lainnya'];

  const urgencyList = Array.isArray(URGENCY_LEVELS)
    ? URGENCY_LEVELS
    : URGENCY_LEVELS ? Object.values(URGENCY_LEVELS) : ['Normal', 'Tinggi', 'Darurat'];

  // Langkah 2: State lokal formulir koreksi
  const [title, setTitle] = useState(report?.title || '');
  const [category, setCategory] = useState(report?.category || categoriesList[0] || 'Lainnya');
  const [urgency, setUrgency] = useState(report?.urgency || urgencyList[0] || 'Normal');
  const [summary, setSummary] = useState(report?.summary || '');
  const [address, setAddress] = useState(report?.address || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!report) return null;

  // Langkah 3: Submit pembaruan data laporan ke Firestore via service
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateReport(report.id, {
        title: title.trim().slice(0, MAX_TITLE_LENGTH || 60),
        category,
        urgency,
        summary: summary.trim().slice(0, MAX_SUMMARY_LENGTH || 1000),
        address: address.trim()
      });

      if (onUpdated) {
        onUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Gagal memperbarui laporan:', error);
      const errCode = error?.code || 'default';
      setErrorMsg(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base">
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-[#FFFFFF] relative overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-[#D4D4D4]/20 p-6 pb-4">
          <div className="flex items-center space-x-3 text-[#FFFFFF]">
            <div className="p-2.5 bg-[#DC2626]/20 border border-[#DC2626]/50 rounded-xl text-[#DC2626]">
              <Edit3 size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('admin.editTitle', null, 'Koreksi Data Laporan')}</h3>
              <span className="font-mono text-xs text-[#D4D4D4]">
                ID: {report.ticketCode || report.id.slice(0, 8)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-4 bg-[#DC2626]/20 border border-[#DC2626] rounded-xl flex items-center space-x-2 text-[#FFFFFF]">
              <AlertCircle size={20} className="text-[#DC2626] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul Laporan dengan Counter Karakter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold">
                {t('admin.editTitleLabel', null, 'Judul Laporan')}
              </label>
              <span className="text-xs text-[#D4D4D4] font-mono">
                {title.length}/{MAX_TITLE_LENGTH || 60}
              </span>
            </div>
            <input
              type="text"
              value={title}
              maxLength={MAX_TITLE_LENGTH || 60}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors"
              required
            />
          </div>

          {/* Kategori & Urgensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
                {t('admin.editCategoryLabel', null, 'Kategori')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#171717] text-[#FFFFFF]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
                {t('admin.editUrgencyLabel', null, 'Tingkat Urgensi')}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors cursor-pointer"
              >
                {urgencyList.map((urg) => (
                  <option key={urg} value={urg} className="bg-[#171717] text-[#FFFFFF]">
                    {urg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ringkasan dengan Counter Karakter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold">
                {t('admin.editSummaryLabel', null, 'Ringkasan Masalah')}
              </label>
              <span className="text-xs text-[#D4D4D4] font-mono">
                {summary.length}/{MAX_SUMMARY_LENGTH || 1000}
              </span>
            </div>
            <textarea
              rows={4}
              value={summary}
              maxLength={MAX_SUMMARY_LENGTH || 1000}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
              required
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
              {t('admin.editAddressLabel', null, 'Alamat Lokasi Kejadian')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors"
              required
            />
          </div>

          {/* Tombol Aksi Footer Form */}
          <div className="pt-4 border-t border-[#D4D4D4]/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 text-[#FFFFFF] rounded-xl text-base font-medium transition-colors cursor-pointer"
            >
              {t('admin.cancel', null, 'Batal')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-[#FFFFFF] rounded-xl text-base font-semibold transition-colors inline-flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <Save size={18} />
              <span>{isSubmitting ? t('admin.saving', null, 'Menyimpan...') : t('admin.saveChanges', null, 'Simpan Perubahan')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
