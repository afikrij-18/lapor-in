// Komponen Modal Verifikasi & Audit Terpadu (Smart Verification Modal) - Lapor.in
// Menyediakan layout 2 kolom: Sisi kiri bukti warga (audio, foto, transkrip, AI), sisi kanan formulir publikasi aktif.
// Mendukung tombol: Verifikasi & Publikasikan, Simpan Draf Saja, Tolak Laporan, serta pintasan Space & Esc.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  MapPin,
  Mic,
  Image as ImageIcon,
  Play,
  Pause,
  Shield,
  Activity,
  UserCheck,
  Check,
  CheckCircle2,
  Loader2,
  Save,
  Edit3,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';
import { getReportPrivate, getReportPhotoUrl, getReportAudioUrl } from '../../services/reportService.js';
import {
  REPORT_CATEGORIES,
  URGENCY_LEVELS,
  MAX_TITLE_LENGTH,
  MAX_SUMMARY_LENGTH
} from '../../config/constants.js';

export default function ReportDetailModal({
  report,
  isVerificationMode = false,
  onClose,
  onVerifyAndPublish,
  onSaveDraft,
  onReject,
  onUpdateStatus
}) {
  const { t } = useLanguage();

  // Langkah 1: State bukti privat dan media dari Firestore
  const [privateData, setPrivateData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(true);

  // Langkah 2: State formulir data yang dapat disunting sebelum publikasi
  const [title, setTitle] = useState(report?.title || '');
  const [category, setCategory] = useState(report?.category || 'Lainnya');
  const [urgency, setUrgency] = useState(report?.urgency || 'Normal');
  const [summary, setSummary] = useState(report?.summary || '');
  const [address, setAddress] = useState(report?.address || '');
  const [isEditing, setIsEditing] = useState(isVerificationMode);

  // Langkah 3: State penolakan terintegrasi (inline rejection)
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fungsi menyalin kode tiket
  const handleCopyTicket = () => {
    const code = report?.ticketCode || report?.id;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    }).catch((err) => {
      console.warn('Gagal menyalin tiket:', err);
    });
  };

  // Menggunakan useRef untuk pemutar audio HTML5 agar bebas memory leak dan warning dependencies
  const audioRef = useRef(null);

  // Langkah 4: Memuat foto, rekaman audio, dan data privat laporan
  useEffect(() => {
    let activePhotoUrl = null;
    let activeAudioUrl = null;

    async function loadPrivateAndMedia() {
      if (!report || !report.id) return;
      setIsLoadingPrivate(true);
      try {
        const priv = await getReportPrivate(report.id);
        setPrivateData(priv);

        // Muat URL foto bukti jika ada
        if (report.hasPhoto) {
          activePhotoUrl = await getReportPhotoUrl(report.id);
          setPhotoUrl(activePhotoUrl);
        }

        // Muat rekaman audio jika ada
        const hasAudioRecord = Boolean(report.hasAudio || report.audioBlob || priv?.hasAudio);
        if (hasAudioRecord) {
          try {
            activeAudioUrl = await getReportAudioUrl(report.id);
            setAudioUrl(activeAudioUrl);
          } catch (audioError) {
            console.warn('Audio tidak tersedia atau gagal dimuat:', audioError);
          }
        }
      } catch (error) {
        console.error('Gagal memuat detail privat laporan:', error);
      } finally {
        setIsLoadingPrivate(false);
      }
    }

    loadPrivateAndMedia();

    // Pembersihan Object URL saat komponen ditutup
    return () => {
      if (activePhotoUrl) URL.revokeObjectURL(activePhotoUrl);
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [report]);

  // Langkah 5: Fungsi kontrol pemutaran rekaman suara warga
  const togglePlayAudio = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().then(() => setIsPlayingAudio(true)).catch((err) => {
        console.error('Gagal memutar audio:', err);
        setIsPlayingAudio(false);
      });
    } else {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch((err) => {
          console.error('Gagal memutar audio:', err);
          setIsPlayingAudio(false);
        });
      }
    }
  }, [audioUrl, isPlayingAudio]);

  // Langkah 6: Listener tombol pintasan keyboard (Space: Play/Pause audio, Esc: Tutup)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Tombol Spasi memutar audio jika pengguna tidak sedang mengetik di input/textarea
      const tag = document.activeElement?.tagName;
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, togglePlayAudio]);

  if (!report) return null;

  const isEmergency = urgency === 'Darurat';
  const status = report.status || 'pending';

  // Objek field yang telah disunting
  const currentFields = {
    title: title.trim().slice(0, MAX_TITLE_LENGTH || 60),
    category,
    urgency,
    summary: summary.trim().slice(0, MAX_SUMMARY_LENGTH || 1000),
    address: address.trim()
  };

  // Langkah 7: Handler "Verifikasi & Publikasikan"
  const handleConfirmVerification = async () => {
    setIsSubmitting(true);
    try {
      if (onVerifyAndPublish) {
        await onVerifyAndPublish(report.id, currentFields);
      } else if (onUpdateStatus) {
        await onUpdateStatus(report.id, 'verified');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Langkah 8: Handler "Simpan Draf Saja" (status tetap pending)
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft(report.id, currentFields);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Langkah 9: Handler "Konfirmasi Tolak" (inline rejection)
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      if (onReject) {
        await onReject(report.id, rejectReason.trim());
      } else if (onUpdateStatus) {
        await onUpdateStatus(report.id, 'rejected', rejectReason.trim());
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 text-base">
      <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl text-[#FFFFFF] relative overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-[#D4D4D4]/20 p-5 sm:px-8 py-4 bg-[#141414]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#DC2626]/20 border border-[#DC2626]/50 rounded-xl text-[#DC2626]">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 mb-0.5">
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="font-mono text-xs px-2.5 py-0.5 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 hover:border-[#D4D4D4]/60 rounded text-[#D4D4D4] hover:text-[#FFFFFF] inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title={isCopied ? t('admin.ticketCopied', null, 'Tersalin!') : t('admin.clickToCopy', null, 'Klik untuk salin kode tiket')}
                >
                  <span>{report.ticketCode || report.id.slice(0, 8)}</span>
                  {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="opacity-40" />}
                </button>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    isEmergency
                      ? 'bg-[#DC2626] text-[#FFFFFF] animate-pulse'
                      : 'bg-[#0A0A0A] border border-[#D4D4D4]/30 text-[#D4D4D4]'
                  }`}
                >
                  {urgency || 'Normal'}
                </span>
                <span className="text-xs text-[#D4D4D4] font-medium hidden sm:inline">
                  • {t(`status.${status}`)}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#FFFFFF]">
                {isVerificationMode
                  ? t('admin.verifyModalTitle', null, 'Cross-Check & Verifikasi Laporan')
                  : report.title || t('admin.detailModalTitle', null, 'Detail Laporan')}
              </h2>
            </div>
          </div>

          {/* Pintasan & Tombol Tutup */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2 text-xs text-[#D4D4D4] mr-2">
              <span className="px-2 py-1 bg-[#0A0A0A] rounded border border-[#D4D4D4]/20 font-mono">
                {t('admin.spaceShortcutHint', null, 'Spasi: Putar/Jeda')}
              </span>
              <span className="px-2 py-1 bg-[#0A0A0A] rounded border border-[#D4D4D4]/20 font-mono">
                {t('admin.escShortcutHint', null, 'Esc: Tutup')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl transition-all hover:border-[#FFFFFF] cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Konten Utama: 2 Kolom Responsif */}
        <div className="p-5 sm:p-8 overflow-y-auto max-h-[82vh] space-y-6">
          
          {/* Bagian Penolakan Terintegrasi (Jika tombol Tolak ditekan di dalam modal) */}
          {isRejecting && (
            <div className="p-5 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626] space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#DC2626]">
                <AlertCircle size={22} />
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  {t('admin.rejectModalTitle', null, 'Konfirmasi Penolakan Laporan')}
                </h3>
              </div>
              <form onSubmit={handleConfirmReject} className="space-y-3">
                <label className="block text-sm text-[#D4D4D4]">
                  {t('admin.rejectReasonLabel', null, 'Alasan Penolakan:')}
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t(
                    'admin.rejectReasonPlaceholder',
                    null,
                    'Tuliskan alasan penolakan secara jelas (contoh: lokasi tidak jelas atau laporan duplikat)...'
                  )}
                  className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-3 text-[#FFFFFF] text-sm focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 text-[#FFFFFF] rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    {t('admin.cancel', null, 'Batal Tolak')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rejectReason.trim()}
                    className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-[#FFFFFF] rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-md"
                  >
                    {isSubmitting ? t('admin.processing', null, 'Memproses...') : t('admin.confirmReject', null, 'Tolak Laporan Ini')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid 2 Kolom (Kiri Bukti Warga, Kanan Form Publikasi) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* ---------------- SISI KIRI: BUKTI ASLI WARGA ---------------- */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold text-[#D4D4D4] pb-1 border-b border-[#D4D4D4]/15">
                <Activity size={15} className="text-[#DC2626]" />
                <span>{t('admin.evidenceSection', null, 'Bukti Asli Lapangan (Warga)')}</span>
              </div>

              {/* Lampiran Foto */}
              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20">
                <span className="text-[#D4D4D4] text-xs uppercase tracking-wider block mb-2 font-semibold flex items-center space-x-1.5">
                  <ImageIcon size={14} />
                  <span>{t('admin.attachedPhotoSection', null, 'Lampiran Foto Lapangan')}</span>
                </span>
                {report.hasPhoto && photoUrl ? (
                  <div className="overflow-hidden rounded-xl border border-[#D4D4D4]/25 bg-[#171717]">
                    <img
                      src={photoUrl}
                      alt="Bukti Laporan"
                      className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="py-6 text-center text-[#D4D4D4] italic text-sm border border-dashed border-[#D4D4D4]/20 rounded-xl">
                    {t('report.photoEmpty', null, 'Tidak ada foto dilampirkan')}
                  </div>
                )}
              </div>

              {/* Pemutar Rekaman Audio Suara Warga */}
              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#D4D4D4] text-xs uppercase tracking-wider font-semibold flex items-center space-x-1.5">
                    <Mic size={14} />
                    <span>{t('admin.voiceRecordingSection', null, 'Rekaman Suara Warga (120 Detik)')}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#D4D4D4] px-2 py-0.5 bg-[#171717] rounded border border-[#D4D4D4]/20">
                    {report.audioQuality || 'clear'}
                  </span>
                </div>
                {audioUrl ? (
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md ${
                      isPlayingAudio
                        ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF]'
                        : 'bg-[#171717] hover:bg-[#262626] text-[#FFFFFF] border border-[#FFFFFF]/30'
                    }`}
                  >
                    {isPlayingAudio ? <Pause size={17} /> : <Play size={17} />}
                    <span>{isPlayingAudio ? t('admin.pauseAudio', null, 'Jeda Rekaman') : t('admin.playAudio', null, 'Putar Rekaman Suara')}</span>
                  </button>
                ) : (
                  <div className="py-4 text-center text-[#D4D4D4] italic text-xs border border-dashed border-[#D4D4D4]/20 rounded-xl">
                    {t('admin.audioUnavailable', null, 'Rekaman suara tidak tersedia (laporan teks).')}
                  </div>
                )}
              </div>

              {/* Transkrip Mentah Asli Ucapan Warga */}
              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 space-y-2">
                <span className="text-[#D4D4D4] text-xs uppercase tracking-wider block font-semibold">
                  {t('admin.rawTranscriptTitle', null, 'Transkrip Asli Ucapan Warga:')}
                </span>
                {isLoadingPrivate ? (
                  <p className="text-xs text-[#D4D4D4] italic">{t('common.loading', null, 'Memuat transkrip...')}</p>
                ) : (
                  <p className="text-sm text-[#FFFFFF] italic bg-[#171717] p-3 rounded-lg border border-[#D4D4D4]/15 leading-relaxed">
                    "{privateData?.rawTranscript || report.rawTranscript || t('admin.noAudioTranscript', null, 'Tidak ada transkrip audio (input teks manual).')}"
                  </p>
                )}
              </div>

              {/* Lokasi & Geospasial */}
              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#D4D4D4]/20 space-y-1.5 text-xs">
                <span className="text-[#D4D4D4] uppercase tracking-wider block font-semibold flex items-center space-x-1.5">
                  <MapPin size={14} className="text-[#DC2626]" />
                  <span>{t('admin.locationSection', null, 'Informasi Geospasial')}</span>
                </span>
                <p className="text-[#FFFFFF] text-sm">
                  <strong>{t('admin.addressLabel', null, 'Alamat:')}</strong> {report.address || t('report.locationEmpty', null, 'Lokasi belum ditentukan')}
                </p>
                <div className="font-mono text-[#D4D4D4] pt-1">
                  Lat: <span className="text-[#FFFFFF]">{report.latitude || 'N/A'}</span>, Long: <span className="text-[#FFFFFF]">{report.longitude || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* ---------------- SISI KANAN: FORMULIR PUBLIKASI (BISA DIEDIT) ---------------- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#D4D4D4]/15">
                <div className="flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold text-[#D4D4D4]">
                  <FileText size={15} className="text-[#DC2626]" />
                  <span>{t('admin.publicationSection', null, 'Data Laporan Siap Publikasi')}</span>
                </div>
                {!isVerificationMode && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-[#D4D4D4] hover:text-[#FFFFFF] inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditing ? 'Mode Baca' : t('admin.toggleEditData', null, 'Koreksi Data')}</span>
                  </button>
                )}
              </div>

              {/* Form Input Judul */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold">
                    {t('admin.editTitleLabel', null, 'Judul Laporan')}
                  </label>
                  <span className="text-xs font-mono text-[#D4D4D4]">
                    {title.length}/{MAX_TITLE_LENGTH || 60}
                  </span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    maxLength={MAX_TITLE_LENGTH || 60}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626]"
                    required
                  />
                ) : (
                  <p className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#D4D4D4]/20 text-sm font-semibold text-[#FFFFFF]">
                    {title}
                  </p>
                )}
              </div>

              {/* Dropdown Kategori & Urgensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold mb-1.5">
                    {t('admin.editCategoryLabel', null, 'Kategori')}
                  </label>
                  {isEditing ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626] cursor-pointer"
                    >
                      {REPORT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#D4D4D4]/20 text-sm text-[#FFFFFF]">
                      {category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold mb-1.5">
                    {t('admin.editUrgencyLabel', null, 'Tingkat Urgensi')}
                  </label>
                  {isEditing ? (
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626] cursor-pointer"
                    >
                      {Object.values(URGENCY_LEVELS).map((urg) => (
                        <option key={urg} value={urg}>
                          {urg}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#D4D4D4]/20 text-sm font-semibold text-[#FFFFFF]">
                      {urgency}
                    </p>
                  )}
                </div>
              </div>

              {/* Textarea Ringkasan */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold">
                    {t('admin.editSummaryLabel', null, 'Ringkasan Masalah')}
                  </label>
                  <span className="text-xs font-mono text-[#D4D4D4]">
                    {summary.length}/{MAX_SUMMARY_LENGTH || 1000}
                  </span>
                </div>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={summary}
                    maxLength={MAX_SUMMARY_LENGTH || 1000}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626] resize-none"
                    required
                  />
                ) : (
                  <p className="bg-[#0A0A0A] p-3 rounded-xl border border-[#D4D4D4]/20 text-sm text-[#FFFFFF] leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>

              {/* Input Alamat */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4D4D4] font-semibold mb-1.5">
                  {t('admin.editAddressLabel', null, 'Alamat Lokasi Kejadian')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-xl p-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626]"
                    required
                  />
                ) : (
                  <p className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#D4D4D4]/20 text-sm text-[#FFFFFF]">
                    {address || t('report.locationEmpty', null, 'Lokasi belum ditentukan')}
                  </p>
                )}
              </div>

              {/* Penilaian Validitas AI */}
              <div className="bg-[#0A0A0A] p-3 rounded-xl border border-[#D4D4D4]/20 flex items-center justify-between text-xs">
                <span className="text-[#D4D4D4] font-medium flex items-center space-x-1.5">
                  <UserCheck size={15} />
                  <span>{t('admin.columnAiValid', null, 'Penilaian Validitas AI')}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    report.isValidReport !== false
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {report.isValidReport !== false ? t('admin.aiValid', null, 'Valid') : t('admin.aiInvalid', null, 'Perlu Dicek')}
                </span>
              </div>
            </div>

          </div>

          {/* Footer Modal: Tombol Aksi Moderasi Terpadu */}
          <div className="pt-5 border-t border-[#D4D4D4]/20 flex flex-wrap items-center justify-between gap-3">
            {/* Sisi Kiri: Opsi Tolak Laporan Langsung */}
            <div>
              {status === 'pending' && !isRejecting && (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2 bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <X size={15} />
                  <span>{t('admin.rejectDirect', null, 'Tolak Laporan Ini')}</span>
                </button>
              )}
            </div>

            {/* Sisi Kanan: Opsi Batal, Simpan Draf Saja, & Verifikasi Publikasikan */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {t('admin.cancel', null, 'Batal')}
              </button>

              {/* Khusus Laporan Pending: Simpan Draf Saja & Verifikasi Publikasikan */}
              {status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-[#171717] hover:bg-[#262626] border border-[#D4D4D4]/40 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow transition-colors disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{t('admin.saveDraftOnly', null, 'Simpan Draf Saja')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmVerification}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>{t('admin.verifyAndPublish', null, 'Verifikasi & Publikasikan')}</span>
                  </button>
                </>
              )}

              {/* Status Verified: Tombol Proses & Selesai */}
              {status === 'verified' && onUpdateStatus && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(report.id, 'in_progress');
                      onClose();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow transition-colors"
                  >
                    <Loader2 size={15} />
                    <span>{t('admin.markInProgress', null, 'Tandai Sedang Ditangani')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(report.id, 'resolved');
                      onClose();
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    <span>{t('admin.markResolved', null, 'Tandai Selesai')}</span>
                  </button>
                </>
              )}

              {/* Status In Progress: Tombol Selesai */}
              {status === 'in_progress' && onUpdateStatus && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(report.id, 'resolved');
                    onClose();
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] rounded-xl text-xs sm:text-sm font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow transition-colors"
                >
                  <CheckCircle2 size={16} />
                  <span>{t('admin.markResolved', null, 'Tandai Selesai')}</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
