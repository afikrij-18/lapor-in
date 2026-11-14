import { useState, useCallback, useEffect } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Langkah 1: Periksa dukungan Web Speech Synthesis secara aman menggunakan lazy initial state
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  });

  const speak = useCallback((text) => {
    if (!isSupported || !text) return;

    // Langkah 2: Hentikan suara yang sedang berjalan sebelumnya
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; // Bahasa Indonesia baku
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  // Langkah 3: Toggle berbicara / henti secara bergantian
  const toggleSpeak = useCallback((text) => {
    if (!isSupported) return;
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  }, [isSupported, isSpeaking, speak, stop]);

  // Langkah 4: Hentikan pembacaan saat komponen ditutup
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    toggleSpeak,
    isSpeaking,
    isSupported,
  };
}
