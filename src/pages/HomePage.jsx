// Route: /
// Halaman Utama (Homepage) - Lapor.in (Anggota 2 - Irfan)
// Sesuai PRD bagian 1, 2, 3 (Langkah 1), dan 4.1.
// Desain berwibawa, bersih, tanpa badge berlebih (anti-AI slop), fokus pada aksi utama pelaporan warga.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  Keyboard,
} from 'lucide-react';
import Navbar from '../components/common/Navbar.jsx';
import MicHeroButton from '../components/home/MicHeroButton.jsx';
import ManualInputBtn from '../components/home/ManualInputBtn.jsx';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { useReportDraft } from '../hooks/useReportDraft.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { startDraft } = useReportDraft();
  const [errorMessage, setErrorMessage] = useState('');

  // Langkah 1: Hook pembaca suara TTS untuk aksesibilitas lansia dan disabilitas netra
  const { isSpeaking, toggleSpeak, isSupported: isTtsSupported } = useSpeechSynthesis();

  // Simpan rekaman ke draf laporan, lalu pindah ke halaman chat
  const goToChatWithAudio = (blob) => {
    startDraft({ inputMode: 'audio', audioBlob: blob });
    navigate('/chat');
  };

  // Langkah 2: Perekaman audio dengan batas maksimal 120 detik (PRD bagian 4.1)
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder({
    onLimitReached: goToChatWithAudio,
  });

  // Langkah 3: Handler klik tombol mikrofon utama
  const handleMicClick = async () => {
    setErrorMessage('');

    if (!isRecording) {
      try {
        await startRecording();
      } catch (error) {
        console.error('Gagal mengakses mikrofon:', error);
        setErrorMessage(
          t(
            'home.micDenied',
            null,
            'Izin mikrofon ditolak atau perangkat tidak mendukung. Silakan gunakan opsi ketik manual di bawah.',
          ),
        );
      }
      return;
    }

    // Jika sedang merekam, hentikan rekaman dan langsung buka chat
    const blob = await stopRecording();
    goToChatWithAudio(blob);
  };

  // Langkah 4: Handler batalkan rekaman (buang audio tanpa navigasi)
  const handleCancelRecording = () => {
    cancelRecording();
    setErrorMessage('');
  };

  // Langkah 5: Handler alur ketik manual
  const handleManualClick = () => {
    startDraft({ inputMode: 'manual' });
    navigate('/chat');
  };

  // Langkah 6: Handler pembaca panduan suara selamat datang
  const handleToggleVoiceGuide = () => {
    const guideText = t(
      'home.voiceGuideText',
      null,
      'Selamat datang di Lapor.in. Tekan tombol mikrofon merah besar di tengah untuk mulai berbicara menceritakan masalah Anda, atau tekan tombol putih di bawahnya untuk mengetik secara manual. Anda dapat berbicara menggunakan bahasa daerah atau bahasa Indonesia.',
    );
    toggleSpeak(guideText);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col justify-between selection:bg-[#DC2626] selection:text-white overflow-hidden">
      {/* Latar Belakang Atmosferik: Tekstur Dot Matrix Mikro Halus dengan Radial Vignette Fade */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgba(212, 212, 212, 0.14) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, black 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, black 35%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Latar Belakang Opsi 2: Garis Kontur Gelombang Suara Warga Abstrak (Soundwave Topography Contour) */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        style={{
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 40%, transparent 100%)',
        }}
        aria-hidden="true"
      >
        <svg
          className="w-full h-full min-w-[1000px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Gelombang 1: Aksen Kontur Merah Halus */}
          <path
            d="M-100 460 C 240 340, 480 580, 720 460 C 960 340, 1200 580, 1540 460"
            stroke="rgba(220, 38, 38, 0.18)"
            strokeWidth="1.5"
          />
          {/* Gelombang 2: Garis Kontur Abu-abu Halus */}
          <path
            d="M-100 490 C 280 370, 520 610, 720 490 C 920 370, 1160 610, 1540 490"
            stroke="rgba(212, 212, 212, 0.10)"
            strokeWidth="1"
          />
          {/* Gelombang 3: Garis Harmonik Putus-putus Merah */}
          <path
            d="M-100 430 C 200 310, 440 550, 720 430 C 1000 310, 1240 550, 1540 430"
            stroke="rgba(220, 38, 38, 0.14)"
            strokeWidth="1.2"
            strokeDasharray="6 8"
          />
          {/* Gelombang 4: Kontur Rendah Abu-abu Netral */}
          <path
            d="M-100 520 C 320 400, 560 640, 720 520 C 880 400, 1120 640, 1540 520"
            stroke="rgba(212, 212, 212, 0.08)"
            strokeWidth="1"
          />
          {/* Gelombang 5: Kontur Tinggi Tipis */}
          <path
            d="M-100 400 C 160 280, 400 520, 720 400 C 1040 280, 1280 520, 1540 400"
            stroke="rgba(212, 212, 212, 0.06)"
            strokeWidth="1"
          />
          {/* Gelombang 6: Garis Aliran Sekunder Merah */}
          <path
            d="M-100 370 C 220 250, 460 490, 720 370 C 980 250, 1220 490, 1540 370"
            stroke="rgba(220, 38, 38, 0.10)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Pendaran Cahaya Radial Merah Lembut di Balik Tombol Mic Hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#DC2626]/[0.07] rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Pendaran Aksen Halus di Area Header */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[220px] bg-[#DC2626]/[0.04] rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Sticky Navbar Bersih */}
      <Navbar />

      {/* Konten Utama Hero Section (Single Screen Hero yang Terfokus & Berwibawa, Mobile-First) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center max-w-3xl mx-auto py-6 sm:py-8 md:py-10 w-full">
        
        {/* Judul & Subjudul Utama Platform (Skala Responsif Halus) */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 sm:mb-3 text-[#FFFFFF] max-w-2xl leading-tight">
          {t('home.title', null, 'Suarakan Masalah Lingkungan Anda Secara Aman')}
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 max-w-xl font-normal leading-relaxed text-[#D4D4D4]">
          {t('home.subtitle', null, 'Tanpa Login Rumit • Mendukung Bahasa Daerah & Suara')}
        </p>

        {/* Aksesibilitas Suara Tenang & Bersahaja (Bebas Pill Badges Mengambang) */}
        {isTtsSupported && (
          <div className="mb-4 sm:mb-6">
            <button
              type="button"
              onClick={handleToggleVoiceGuide}
              className="text-xs text-[#D4D4D4]/70 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#171717]"
              aria-label={t('home.voiceGuide', null, 'Dengarkan Panduan Suara')}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} className="text-[#DC2626] animate-pulse" />
                  <span className="underline decoration-dotted text-red-400">
                    {t('home.voiceGuidePlaying', null, 'Sedang membaca panduan... (Klik untuk henti)')}
                  </span>
                </>
              ) : (
                <>
                  <Volume2 size={14} className="text-emerald-400" />
                  <span className="hover:underline">
                    {t('home.voiceGuide', null, 'Dengarkan Panduan Suara')}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Kartu Bantuan Ramah jika Izin Mikrofon Ditolak */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 bg-[#FEE2E2] border border-[#DC2626]/30 text-[#0A0A0A] rounded-2xl text-sm font-medium max-w-md text-left shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-[#B91C1C] font-semibold">{errorMessage}</p>
                <button
                  type="button"
                  onClick={handleManualClick}
                  className="w-full py-2 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Keyboard size={14} />
                  <span>{t('home.micDeniedAction', null, 'Beralih ke Ketik Manual Sekarang')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tombol Mikrofon Utama (Mic Hero Button) */}
        <div className="my-1 sm:my-2">
          <MicHeroButton
            isRecording={isRecording}
            recordingTime={recordingTime}
            onClick={handleMicClick}
            onCancel={handleCancelRecording}
          />
        </div>

        {/* Tombol Sekunder Input Manual (Disesuaikan agar teks tetap 1 baris utuh) */}
        <div className="w-full max-w-[300px] xs:max-w-xs sm:max-w-sm md:max-w-md mt-3 sm:mt-4 px-2">
          <ManualInputBtn onClick={handleManualClick} />
        </div>

        {/* Pemberitahuan Retensi Audio 30 Hari Sesuai PRD Bagian 3 Langkah 1 (Teks 1 Baris Utuh Anti-Wrap) */}
        <p className="mt-6 sm:mt-8 text-[11px] sm:text-xs md:text-sm text-[#D4D4D4]/60 inline-flex items-center justify-center gap-1.5 whitespace-nowrap leading-none max-w-xl sm:max-w-2xl">
          <ShieldCheck size={14} className="text-[#D4D4D4]/40 shrink-0" />
          <span className="whitespace-nowrap">{t('home.retentionNotice', null, 'Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin.')}</span>
        </p>

      </main>
    </div>
  );
}
