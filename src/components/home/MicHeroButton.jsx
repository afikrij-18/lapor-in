// Komponen Tombol Mikrofon Utama (Mic Hero Button) - Lapor.in (Anggota 2 - Irfan)
// Sesuai PRD bagian 2.2, 3 (Langkah 1), dan 4.1.
// Ukuran >= 140px, warna #DC2626, efek denyut radar saat merekam, visualizer gelombang suara,
// dan opsi batalkan rekaman.

import { Mic, Square, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function MicHeroButton({ isRecording, recordingTime = 0, onClick, onCancel }) {
  const { t } = useLanguage();

  // Langkah 1: Format detik ke MM:SS (contoh: 01:20)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center my-3 sm:my-4 md:my-6">
      <div className="relative flex items-center justify-center">
        
        {/* Langkah 2: Cincin Denyut Radar Konsentris saat Perekaman Berlangsung */}
        {isRecording && (
          <>
            <span
              className="absolute w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-[#DC2626]/20 animate-ping pointer-events-none"
              style={{ animationDuration: '2s' }}
            />
            <span
              className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border border-[#DC2626]/30 animate-pulse pointer-events-none"
            />
          </>
        )}

        {/* Langkah 3: Tombol Lingkaran Besar Utama (Minimal 140px x 140px sesuai PRD, Responsif Mobile-First) */}
        <button
          type="button"
          onClick={onClick}
          aria-label={isRecording ? t('home.stopRecording', null, 'Selesai Bicara') : t('home.micButton', null, 'Tekan & Ceritakan Masalah Anda')}
          className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-2xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-[0.98] ${
            isRecording
              ? 'bg-[#B91C1C] ring-6 sm:ring-8 ring-[#DC2626]/50 shadow-red-950/60'
              : 'bg-[#DC2626] hover:bg-[#B91C1C] hover:shadow-red-600/30 hover:scale-105'
          }`}
        >
          {isRecording ? (
            <>
              {/* Ikon Stop & Visualizer Gelombang Suara */}
              <Square className="w-6 h-6 sm:w-8 sm:h-8 fill-current mb-0.5 sm:mb-1" />
              
              {/* Animasi Gelombang Suara (Voice Wave Bars) */}
              <div className="flex items-center gap-1 my-0.5 sm:my-1 h-4 sm:h-5" aria-hidden="true">
                {[0.4, 0.9, 1.2, 0.7, 1.1, 0.6, 0.9].map((scale, i) => (
                  <span
                    key={i}
                    className="w-0.5 sm:w-1 bg-white rounded-full"
                    style={{
                      height: `${scale * 16}px`,
                      animation: `pulse 0.8s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>

              {/* Teks Durasi Aktif */}
              <span className="text-sm sm:text-base font-extrabold tracking-wider font-mono">
                {formatTime(recordingTime)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white/90">
                {t('home.stopRecording', null, 'Selesai Bicara')}
              </span>
            </>
          ) : (
            <>
              {/* Tampilan Default: Ikon Mikrofon Besar */}
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
              <span className="text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase px-2 text-center leading-tight">
                {t('home.micStart', null, 'Mulai Rekam')}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Langkah 4: Keterangan Status / Helper Text di Bawah Tombol */}
      <div className="mt-4 sm:mt-5 text-center max-w-sm px-2">
        {isRecording ? (
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium text-[#F5F5F5]">
              {t('home.micRecordingHint', null, 'Sedang merekam... Tekan tombol merah jika sudah selesai.')}
            </p>

            {/* Tombol Batalkan Rekaman Bersih */}
            {onCancel && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-[#D4D4D4] hover:text-[#DC2626] inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-[#171717]"
                >
                  <X size={13} />
                  <span>{t('home.cancelRecording', null, 'Batalkan Rekaman')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm sm:text-base font-semibold text-[#FFFFFF]">
            {t('home.micButton', null, 'Tekan & Ceritakan Masalah Anda')}
          </p>
        )}
      </div>
    </div>
  );
}
