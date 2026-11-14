import { useState, useCallback } from 'react';

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

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}