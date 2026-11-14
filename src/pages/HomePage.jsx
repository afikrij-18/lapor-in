import { useState } from 'react';
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
  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder();
  const [turnstileToken, setTurnstileToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleMicClick = async () => {
    setErrorMessage('');
    if (!isRecording) {
      try {
        await startRecording();
      } catch (err) {
        console.error('Gagal mengakses mikrofon:', err);
        setErrorMessage(t('home.micPermissionError') || 'Izin mikrofon ditolak atau perangkat tidak mendukung. Silakan gunakan opsi ketik manual di bawah.');
      }
    } else {
      // Tunggu blob rekaman selesai diproses sebelum navigasi
      const blob = await stopRecording();
      navigate('/chat', { 
        state: { 
          mode: 'audio', 
          audioBlob: blob, 
          turnstileToken 
        } 
      });
    }
  };

  const handleManualClick = () => {
    navigate('/chat', { state: { mode: 'manual', turnstileToken } });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {t('home.title') || 'Suarakan Masalah Lingkungan Anda Secara Aman'}
        </h1>
        <p className="text-[#D4D4D4] text-base md:text-lg mb-8">
          {t('home.subtitle') || 'Tanpa Login Rumit • Mendukung Bahasa Daerah & Suara'}
        </p>

        {/* Notifikasi galat inline jika mikrofon ditolak (Menggantikan alert) */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-base font-medium max-w-md">
            {errorMessage}
          </div>
        )}

        <div className="my-4">
          <MicHeroButton 
            isRecording={isRecording} 
            recordingTime={recordingTime} 
            onClick={handleMicClick} 
          />
        </div>

        <div className="w-full max-w-xs mt-6">
          <ManualInputBtn onClick={handleManualClick} />
        </div>

        <p className="mt-10 text-base text-[#D4D4D4]">
          {t('home.retentionNotice') || 'Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin.'}
        </p>

        <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />
      </main>
    </div>
  );
}