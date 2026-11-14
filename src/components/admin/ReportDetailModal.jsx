// Komponen Modal Detail Laporan - Lapor.in
// Menampilkan isi laporan, data privat (transkrip, catatan admin), foto, dan rekaman suara.

import { useState, useEffect } from 'react';
import { X, FileText, MapPin, Mic, Image as ImageIcon, Shield, Activity, UserCheck } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';
import { getReportPrivate, getReportPhotoUrl, getReportAudioUrl } from '../../services/reportService.js';

export default function ReportDetailModal({ report, onClose }) {
  const { t } = useLanguage();
  const [privateData, setPrivateData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(true);

  const reportId = report ? report.id : null;
  const hasPhoto = Boolean(report && report.hasPhoto);

  useEffect(() => {
    let isActive = true;
    let activePhotoUrl = null;
    let activeAudioUrl = null;

    async function loadPrivateAndMedia() {
      if (!reportId) return;

      // Langkah 1: Muat data privat (transkrip, catatan admin, ada tidaknya rekaman)
      let hasAudio = false;
      try {
        const priv = await getReportPrivate(reportId);
        hasAudio = priv.hasAudio;
        if (isActive) setPrivateData(priv);
      } catch (error) {
        console.error('Gagal memuat data privat laporan:', error);
      } finally {
        if (isActive) setIsLoadingPrivate(false);
      }

      // Langkah 2: Muat foto. Dipisah agar tetap tampil walau data privat gagal dimuat
      if (hasPhoto) {
        try {
          const url = await getReportPhotoUrl(reportId);
          if (isActive) {
            activePhotoUrl = url;
            setPhotoUrl(url);
          } else if (url) {
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Gagal memuat foto laporan:', error);
        }
      }

      // Langkah 3: Muat rekaman. Tanda hasAudio hanya ada di data privat, bukan di dokumen publik
      if (hasAudio) {
        try {
          const url = await getReportAudioUrl(reportId);
          if (isActive) {
            activeAudioUrl = url;
            setAudioUrl(url);
          } else if (url) {
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Gagal memuat rekaman laporan:', error);
        }
      }
    }

    loadPrivateAndMedia();

    // Langkah 4: Lepas URL sementara saat modal ditutup
    return () => {
      isActive = false;
      if (activePhotoUrl) URL.revokeObjectURL(activePhotoUrl);
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
    };
  }, [reportId, hasPhoto]);

  if (!report) return null;

  const isEmergency = report.urgency === 'Darurat';
  const isRejected = report.status === 'rejected';
  const adminNotes = privateData ? privateData.adminNotes : '';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base">
      {/* Bungkus luar dengan overflow-hidden agar sudut membulat berlaku di semua sisi */}
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-[#FFFFFF] relative overflow-hidden">

        {/* Area yang bisa digulir di dalam modal */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[92vh] space-y-6">

          {/* Header Modal */}
          <div className="flex justify-between items-start border-b border-[#D4D4D4]/20 pb-5">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#DC2626]/20 border border-[#DC2626]/50 rounded-xl text-[#DC2626]">
                <Shield size={28} />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-mono text-sm px-2.5 py-0.5 bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded text-[#D4D4D4]">
                    {report.ticketCode || report.id.slice(0, 8)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    isEmergency ? 'bg-[#DC2626] text-[#FFFFFF] animate-pulse' : 'bg-[#171717] border border-[#D4D4D4]/40 text-[#FFFFFF]'
                  }`}>
                    {report.urgency}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FFFFFF]">
                  {report.title || t('map.detailTitle')}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              title={t('common.close')}
              className="p-2.5 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all hover:border-[#FFFFFF] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Baris Informasi Utama (Kategori, Status, Penilaian AI) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-1">{t('report.category')}</span>
              <span className="font-medium text-base text-[#FFFFFF] flex items-center space-x-2">
                <FileText size={16} className="text-[#D4D4D4]" />
                <span>{report.category}</span>
              </span>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-1">{t('report.status')}</span>
              <span className="font-semibold text-base uppercase text-[#FFFFFF] flex items-center space-x-2">
                <Activity size={16} className="text-[#DC2626]" />
                <span>{t(`status.${report.status || 'pending'}`)}</span>
              </span>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-1">{t('admin.columnAiValid')}</span>
              <span className={`font-semibold text-base flex items-center space-x-2 ${report.isValidReport !== false ? 'text-[#FFFFFF]' : 'text-[#DC2626]'}`}>
                <UserCheck size={16} />
                <span>{report.isValidReport !== false ? t('admin.aiValid') : t('admin.aiInvalid')}</span>
              </span>
            </div>
          </div>

          {/* Alasan Penolakan (hanya untuk laporan yang ditolak; alasannya disimpan di catatan admin) */}
          {isRejected && !isLoadingPrivate && (
            <div className="bg-[#DC2626]/10 p-5 rounded-xl border border-[#DC2626]/40 space-y-2">
              <span className="text-xs text-[#DC2626] block font-semibold uppercase tracking-wider">
                {t('admin.rejectionReasonTitle')}
              </span>
              <p className="text-[#FFFFFF] text-base leading-relaxed">
                {adminNotes || t('admin.rejectionReasonEmpty')}
              </p>
            </div>
          )}

          {/* Ringkasan Laporan */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20">
            <span className="text-[#D4D4D4] text-xs uppercase tracking-wider block mb-2 font-semibold">{t('report.summary')}</span>
            <p className="text-[#FFFFFF] leading-relaxed text-base">{report.summary || t('admin.summaryEmpty')}</p>
          </div>

          {/* Transkrip Asli & Catatan Admin */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20 space-y-4">
            <div className="flex items-center space-x-2 text-[#D4D4D4] text-xs uppercase tracking-wider font-semibold">
              <Mic size={16} className="text-[#DC2626]" />
              <span>{t('admin.rawTranscript')}</span>
            </div>
            {isLoadingPrivate ? (
              <p className="text-[#D4D4D4] italic text-base">{t('common.loading')}</p>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#171717] p-4 rounded-lg border border-[#D4D4D4]/20">
                  <p className="text-[#FFFFFF] italic text-base">
                    {privateData && privateData.rawTranscript ? privateData.rawTranscript : t('admin.transcriptEmpty')}
                  </p>
                </div>
                {adminNotes && !isRejected && (
                  <div className="bg-[#171717] p-4 rounded-lg border border-[#D4D4D4]/20">
                    <span className="text-xs text-[#D4D4D4] block mb-1 font-semibold uppercase">{t('admin.adminNotes')}</span>
                    <p className="text-[#FFFFFF] text-base">{adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lokasi */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20 space-y-3">
            <div className="flex items-center space-x-2 text-[#D4D4D4] text-xs uppercase tracking-wider font-semibold">
              <MapPin size={16} className="text-[#DC2626]" />
              <span>{t('report.location')}</span>
            </div>
            <p className="text-[#FFFFFF] font-medium text-base">
              {report.address || t('report.locationEmpty')}
            </p>
            {typeof report.latitude === 'number' && typeof report.longitude === 'number' && (
              <div className="pt-2 border-t border-[#D4D4D4]/10 text-sm font-mono text-[#D4D4D4]">
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </div>
            )}
          </div>

          {/* Lampiran Media (Foto & Rekaman) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Kotak Foto */}
            <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/25 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-3 flex items-center space-x-2 font-semibold">
                <ImageIcon size={16} />
                <span>{t('report.photo')}</span>
              </span>
              {photoUrl ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-[#D4D4D4]/30 bg-[#171717]">
                  <img src={photoUrl} alt={t('report.photo')} className="w-full h-52 object-cover" />
                </div>
              ) : (
                <div className="py-8 text-center text-[#D4D4D4] italic text-base border border-dashed border-[#D4D4D4]/20 rounded-xl">
                  {t('report.photoEmpty')}
                </div>
              )}
            </div>

            {/* Kotak Rekaman */}
            <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/25 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-3 flex items-center space-x-2 font-semibold">
                <Mic size={16} />
                <span>{t('admin.playAudio')}</span>
              </span>
              {audioUrl ? (
                // Pemutar bawaan browser: berhenti sendiri saat modal ditutup
                <audio controls src={audioUrl} className="w-full" />
              ) : (
                <div className="py-8 text-center text-[#D4D4D4] italic text-base border border-dashed border-[#D4D4D4]/20 rounded-xl">
                  {t('admin.audioUnavailable')}
                </div>
              )}
            </div>

          </div>

          {/* Footer Modal */}
          <div className="pt-4 border-t border-[#D4D4D4]/20 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-semibold rounded-xl text-base transition-colors cursor-pointer shadow-lg"
            >
              {t('common.close')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
