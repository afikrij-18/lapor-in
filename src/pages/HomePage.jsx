import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import TurnstileWidget from '../components/common/TurnstileWidget';
import MicHeroButton from '../components/home/MicHeroButton';
import ManualInputBtn from '../components/home/ManualInputBtn';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLanguage } from '../hooks/useLanguage.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [turnstileToken, setTurnstileToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pindah ke halaman chat membawa rekaman suara
  const goToChatWithAudio = (blob) => {
    navigate('/chat', {
      state: {
        mode: 'audio',
        audioBlob: blob,
        turnstileToken,
      },
    });
  };

  // Jika rekaman berhenti otomatis di batas 120 detik, rekaman tetap diproses
  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder({
    onLimitReached: goToChatWithAudio,
  });

  const handleMicClick = async () => {
    setErrorMessage('');

    if (!isRecording) {
      // Langkah 1: Mulai merekam. Jika izin mikrofon ditolak, arahkan warga ke ketik manual
      try {
        await startRecording();
      } catch (error) {
        console.error('Gagal mengakses mikrofon:', error);
        setErrorMessage(t('home.micDenied'));
      }
      return;
    }

    // Langkah 2: Tunggu rekaman selesai diproses, lalu pindah ke halaman chat
    const blob = await stopRecording();
    goToChatWithAudio(blob);
  };

  const handleManualClick = () => {
    navigate('/chat', { state: { mode: 'manual', turnstileToken } });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {t('home.title')}
        </h1>
        <p className="text-[#D4D4D4] text-base md:text-lg mb-8">{t('home.subtitle')}</p>

        {/* Pesan di halaman jika mikrofon ditolak (pengganti alert) */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 bg-[#FEE2E2] text-[#B91C1C] rounded-xl text-base font-medium max-w-md"
          >
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

        <p className="mt-10 text-base text-[#D4D4D4]">{t('home.retentionNotice')}</p>

        <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />
      </main>
    </div>
  );
}
