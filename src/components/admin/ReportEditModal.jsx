// Komponen Modal Edit Laporan - Lapor.in (Aman terhadap format konstanta)

import { useState } from 'react';
import { X, Edit3, Save, AlertCircle } from 'lucide-react';
import { updateReport } from '../../services/reportService.js';
import { REPORT_CATEGORIES, URGENCY_LEVELS } from '../../config/constants.js';

export default function ReportEditModal({ report, onClose, onUpdated }) {
  // Normalisasi data kategori & urgensi (mendukung array maupun object)
  const categoriesList = Array.isArray(REPORT_CATEGORIES) 
    ? REPORT_CATEGORIES 
    : REPORT_CATEGORIES ? Object.values(REPORT_CATEGORIES) : ['Infrastruktur', 'Fasilitas Umum', 'Keamanan', 'Lainnya'];
  
  const urgencyList = Array.isArray(URGENCY_LEVELS) 
    ? URGENCY_LEVELS 
    : URGENCY_LEVELS ? Object.values(URGENCY_LEVELS) : ['Normal', 'Tinggi', 'Darurat'];

  const [title, setTitle] = useState(report?.title || '');
  const [category, setCategory] = useState(report?.category || categoriesList[0] || 'Infrastruktur');
  const [urgency, setUrgency] = useState(report?.urgency || urgencyList[0] || 'Normal');
  const [summary, setSummary] = useState(report?.summary || '');
  const [address, setAddress] = useState(report?.address || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateReport(report.id, {
        title: title.trim(),
        category,
        urgency,
        summary: summary.trim(),
        address: address.trim()
      });

      if (onUpdated) {
        onUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Gagal memperbarui laporan:', error);
      setErrorMsg(error?.message || 'Gagal menyimpan perubahan laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base">
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-[#FFFFFF] relative overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-[#D4D4D4]/20 p-6 pb-4">
          <div className="flex items-center space-x-3 text-[#FFFFFF]">
            <div className="p-2.5 bg-[#DC2626]/20 border border-[#DC2626]/50 rounded-xl text-[#DC2626]">
              <Edit3 size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Edit Laporan</h3>
              <span className="font-mono text-xs text-[#D4D4D4]">ID: {report.ticketCode || report.id.slice(0, 8)}</span>
            </div>
          </div>
          <button
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

          {/* Judul Laporan */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
              Judul Laporan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors"
              required
            />
          </div>

          {/* Kategori & Urgensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
                Kategori
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
                Urgensi
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

          {/* Ringkasan */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
              Ringkasan Masalah
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-base focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
              required
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] mb-2 font-semibold">
              Alamat Lokasi
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
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-[#FFFFFF] rounded-xl text-base font-semibold transition-colors inline-flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}