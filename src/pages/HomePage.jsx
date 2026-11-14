import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import TurnstileWidget from '../components/common/TurnstileWidget';
import MicHeroButton from '../components/home/MicHeroButton';
import ManualInputBtn from '../components/home/ManualInputBtn';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isRecording, audioBlob, recordingTime, startRecording, stopRecording } = useAudioRecorder();

  // Langkah 1: Tangani aksi klik pada tombol mikrofon utama
  const handleMicClick = async () => {
    if (!isRecording) {
      try {
        await startRecording();
      } catch (err) {
        console.error('Gagal mengakses mikrofon:', err);
        alert('Izin mikrofon ditolak atau perangkat tidak mendukung. Silakan gunakan opsi ketik manual.');
      }
    } else {
      stopRecording();
      // Langkah 2: Navigasi ke halaman chat membawa state audio rekaman
      navigate('/chat', { state: { mode: 'audio', audioBlob } });
    }
  };

  // Langkah 3: Tangani aksi klik pada tombol input manual
  const handleManualClick = () => {
    navigate('/chat', { state: { mode: 'manual' } });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
        {/* Langkah 4: Judul utama dan subjudul aksesibilitas */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {t('home.title') || 'Suarakan Masalah Lingkungan Anda Secara Aman'}
        </h1>
        <p className="text-[#525252] text-sm md:text-base mb-10">
          {t('home.subtitle') || 'Tanpa Login Rumit • Mendukung Bahasa Daerah & Suara'}
        </p>

        {/* Langkah 5: Tombol Mikrofon Utama (Mic Hero) */}
        <div className="my-6">
          <MicHeroButton 
            isRecording={isRecording} 
            recordingTime={recordingTime} 
            onClick={handleMicClick} 
          />
        </div>

        {/* Langkah 6: Tombol Sekunder Input Manual */}
        <div className="w-full max-w-xs mt-4">
          <ManualInputBtn onClick={handleManualClick} />
        </div>

        {/* Langkah 7: Pemberitahuan retensi audio 30 hari */}
        <p className="mt-12 text-xs text-[#525252]">
          {t('home.retentionNotice') || 'Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin.'}
        </p>

        <TurnstileWidget />
      </main>

      <footer className="py-4 text-center text-xs text-[#525252] border-t border-[#171717]">
        Lapor.in • AI for Access and Digital Life (Minimize Team)
      </footer>
    </div>
  );
}