import { Mic, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MicHeroButton({ isRecording, recordingTime, onClick }) {
  const { t } = useLanguage();

  // Format detik ke MM:SS (contoh: 01:20)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center my-6">
      {/* Langkah 1: Tombol Lingkaran Besar Utama (#DC2626) dengan Efek Denyut saat Merekam */}
      <button
        onClick={onClick}
        aria-label={isRecording ? 'Selesai Bicara' : 'Tekan & Ceritakan Masalah Anda'}
        className={`relative w-36 h-36 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 ${
          isRecording 
            ? 'bg-[#B91C1C] animate-pulse ring-8 ring-[#DC2626]/40' 
            : 'bg-[#DC2626] hover:bg-[#B91C1C]'
        }`}
      >
        {/* Langkah 2: Menampilkan ikon vektor berganti antara Mic atau Square (Stop) */}
        {isRecording ? (
          <Square className="w-10 h-10 mb-1 fill-current" />
        ) : (
          <Mic className="w-12 h-12 mb-1" />
        )}

        {/* Langkah 3: Label dinamis status tombol */}
        <span className="text-xs md:text-sm font-bold tracking-wide uppercase px-2">
          {isRecording ? formatTime(recordingTime) : 'Mulai Rekam'}
        </span>
      </button>

      {/* Langkah 4: Keterangan helper di bawah tombol */}
      <p className="mt-4 text-sm font-medium text-[#F5F5F5]">
        {isRecording 
          ? 'Sedang merekam... Tekan kembali jika sudah selesai.' 
          : t('home.micButton') || 'Tekan & Ceritakan Masalah Anda'}
      </p>
    </div>
  );
}