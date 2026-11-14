// Komponen Modal Detail Laporan - Lapor.in (Perbaikan Radius Sudut & UI)

import { useState, useEffect } from 'react';
import { X, FileText, MapPin, Mic, Image as ImageIcon, Play, Pause, Shield, Activity, UserCheck } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';
import { getReportPrivate, getReportPhotoUrl, getReportAudioUrl } from '../../services/reportService.js';

export default function ReportDetailModal({ report, onClose }) {
  const { t } = useLanguage();
  const [privateData, setPrivateData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(true);

  useEffect(() => {
    let activePhotoUrl = null;
    let activeAudioUrl = null;

    async function loadPrivateAndMedia() {
      if (!report || !report.id) return;
      setIsLoadingPrivate(true);
      try {
        const priv = await getReportPrivate(report.id);
        setPrivateData(priv);

        if (report.hasPhoto) {
          activePhotoUrl = await getReportPhotoUrl(report.id);
          setPhotoUrl(activePhotoUrl);
        }

        if (report.hasAudio || report.audioBlob || report.rawTranscript) {
          try {
            activeAudioUrl = await getReportAudioUrl(report.id);
            setAudioUrl(activeAudioUrl);
          } catch (e) {
            console.warn('Audio tidak tersedia:', e);
          }
        }
      } catch (error) {
        console.error('Gagal memuat detail privat laporan:', error);
      } finally {
        setIsLoadingPrivate(false);
      }
    }

    loadPrivateAndMedia();

    return () => {
      if (activePhotoUrl) URL.revokeObjectURL(activePhotoUrl);
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      if (audioElement) audioElement.pause();
    };
  }, [report]);

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (!audioElement) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      audio.play();
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
    } else {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        audioElement.play();
        setIsPlayingAudio(true);
      }
    }
  };

  if (!report) return null;

  const isEmergency = report.urgency === 'Darurat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-base">
      {/* Bungkus luar dengan overflow-hidden agar border-radius rounded-2xl berfungsi sempurna di semua sudut */}
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-[#FFFFFF] relative overflow-hidden">
        
        {/* Area yang bisa di-scroll di dalam modal */}
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
                    {report.urgency || 'Normal'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FFFFFF]">
                  {report.title || 'Detail Laporan Warga'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all hover:border-[#FFFFFF] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Baris Informasi Utama (Kategori, Status, AI Valid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 flex flex-col justify-between">
              <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-1">{t('report.category')}</span>
              <span className="font-medium text-base text-[#FFFFFF] flex items-center space-x-2">
                <FileText size={16} className="text-[#D4D4D4]" />
                <span>{report.category || 'Lainnya'}</span>
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

          {/* Alasan Penolakan (Hanya muncul jika status rejected) */}
          {(report.status === 'rejected' || report.rejectionReason || privateData?.rejectionReason) && (
            <div className="bg-[#DC2626]/10 p-5 rounded-xl border border-[#DC2626]/40 space-y-2">
              <span className="text-xs text-[#DC2626] block font-semibold uppercase tracking-wider">
                Alasan Penolakan Laporan:
              </span>
              <p className="text-[#FFFFFF] text-base leading-relaxed">
                {report.rejectionReason || privateData?.rejectionReason || privateData?.adminNotes || 'Tidak ada alasan spesifik yang dicatat.'}
              </p>
            </div>
          )}

          {/* Ringkasan Laporan */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20">
            <span className="text-[#D4D4D4] text-xs uppercase tracking-wider block mb-2 font-semibold">Ringkasan Masalah</span>
            <p className="text-[#FFFFFF] leading-relaxed text-base">{report.summary || 'Tidak ada ringkasan.'}</p>
          </div>


          {/* Transkrip Asli & Catatan Admin */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20 space-y-4">
            <div className="flex items-center space-x-2 text-[#D4D4D4] text-xs uppercase tracking-wider font-semibold">
              <Mic size={16} className="text-[#DC2626]" />
              <span>{t('admin.rawTranscript')} & {t('admin.adminNotes')}</span>
            </div>
            {isLoadingPrivate ? (
              <p className="text-[#D4D4D4] italic text-base">{t('common.loading')}</p>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#171717] p-4 rounded-lg border border-[#D4D4D4]/20">
                  <span className="text-xs text-[#D4D4D4] block mb-1 font-semibold uppercase">Transkrip Asli Audio:</span>
                  <p className="text-[#FFFFFF] italic text-base">
                    "{privateData?.rawTranscript || report.rawTranscript || 'Tidak ada transkrip audio (pelapor menggunakan input teks langsung).'}"
                  </p>
                </div>
                {privateData?.adminNotes && (
                  <div className="bg-[#171717] p-4 rounded-lg border border-[#D4D4D4]/20">
                    <span className="text-xs text-[#D4D4D4] block mb-1 font-semibold uppercase">Catatan Moderator:</span>
                    <p className="text-[#FFFFFF] text-base">{privateData.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lokasi & Geospasial */}
          <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/20 space-y-3">
            <div className="flex items-center space-x-2 text-[#D4D4D4] text-xs uppercase tracking-wider font-semibold">
              <MapPin size={16} className="text-[#DC2626]" />
              <span>Informasi Lokasi Kejadian</span>
            </div>
            <p className="text-[#FFFFFF] font-medium text-base">
              <strong>Alamat:</strong> {report.address || t('report.locationEmpty')}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#D4D4D4]/10 text-sm font-mono text-[#D4D4D4]">
              <div>Latitude: <span className="text-[#FFFFFF]">{report.latitude || 'N/A'}</span></div>
              <div>Longitude: <span className="text-[#FFFFFF]">{report.longitude || 'N/A'}</span></div>
            </div>
          </div>

          {/* Lampiran Media (Foto & Audio Player) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Kotak Foto */}
            <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/25 flex flex-col justify-between">
              <div>
                <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-3 flex items-center space-x-2 font-semibold">
                  <ImageIcon size={16} />
                  <span>Lampiran Foto Lapangan</span>
                </span>
              </div>
              {report.hasPhoto && photoUrl ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-[#D4D4D4]/30 bg-[#171717]">
                  <img src={photoUrl} alt="Bukti Laporan" className="w-full h-52 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="py-8 text-center text-[#D4D4D4] italic text-base border border-dashed border-[#D4D4D4]/20 rounded-xl">
                  {t('report.photoEmpty')}
                </div>
              )}
            </div>

            {/* Kotak Audio */}
            <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#D4D4D4]/25 flex flex-col justify-between">
              <div>
                <span className="text-[#D4D4D4] text-xs uppercase tracking-wider mb-3 flex items-center space-x-2 font-semibold">
                  <Mic size={16} />
                  <span>Rekaman Suara Warga</span>
                </span>
                <p className="text-[#D4D4D4] text-sm mb-4">
                  Kualitas Audio: <span className="uppercase font-mono text-[#FFFFFF] px-2 py-0.5 bg-[#171717] border border-[#D4D4D4]/30 rounded">{report.audioQuality || 'clear'}</span>
                </p>
              </div>
              {audioUrl ? (
                <button
                  onClick={togglePlayAudio}
                  className={`w-full py-3.5 px-4 rounded-xl text-base font-semibold inline-flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md ${
                    isPlayingAudio 
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF]' 
                      : 'bg-[#171717] hover:bg-[#262626] text-[#FFFFFF] border border-[#FFFFFF]/40'
                  }`}
                >
                  {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isPlayingAudio ? 'Jeda Pemutaran' : t('admin.playAudio')}</span>
                </button>
              ) : (
                <div className="py-8 text-center text-[#D4D4D4] italic text-base border border-dashed border-[#D4D4D4]/20 rounded-xl">
                  {t('admin.audioUnavailable')}
                </div>
              )}
            </div>

          </div>

          {/* Footer Modal di dalam area scroll */}
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