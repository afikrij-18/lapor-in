import { useState, useRef, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const MAX_SECONDS = 120; // Batas durasi maksimal 120 detik sesuai PRD

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);

    try {
      // Langkah 1: Meminta izin akses mikrofon dengan filter noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Langkah 2: Pilih mimeType yang didukung browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 24000, // Target bitrate 24 kbps sesuai PRD
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        // Hentikan seluruh track media stream setelah selesai
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Ambil data per detik
      setIsRecording(true);

      // Langkah 3: Jalankan timer durasi & auto-stop pada 120 detik
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Gagal mengakses mikrofon:', error);
      // Mematuhi aturan preserve-caught-error dengan menyertakan cause
      throw new Error('MIC_PERMISSION_DENIED', { cause: error });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
  };
}