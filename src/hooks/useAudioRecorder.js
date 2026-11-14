import { useEffect, useRef, useState } from 'react';
import { MAX_RECORDING_SECONDS } from '../config/constants.js';

// Hook perekam suara untuk halaman utama (PRD bagian 4.1).
// onLimitReached(blob) dipanggil saat rekaman berhenti otomatis di batas 120 detik,
// supaya rekaman yang sudah ada tetap diproses.
export function useAudioRecorder({ onLimitReached } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const isRecordingRef = useRef(false);
  const lastBlobRef = useRef(null);
  const resolveStopRef = useRef(null);
  const onLimitReachedRef = useRef(onLimitReached);

  // Simpan fungsi onLimitReached terbaru, karena timer dibuat sekali saat rekaman dimulai
  useEffect(() => {
    onLimitReachedRef.current = onLimitReached;
  });

  // Menghentikan rekaman. Mengembalikan Promise berisi Blob rekaman.
  const stopRecording = () => {
    return new Promise((resolve) => {
      // Langkah 1: Jika tidak sedang merekam, kembalikan rekaman terakhir (bisa null)
      if (!mediaRecorderRef.current || !isRecordingRef.current) {
        resolve(lastBlobRef.current);
        return;
      }

      // Langkah 2: Hentikan timer dan perekam; Blob dikirim lewat onstop di bawah
      resolveStopRef.current = resolve;
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stop();
    });
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    lastBlobRef.current = null;
    elapsedSecondsRef.current = 0;
    setAudioBlob(null);
    setRecordingTime(0);

    try {
      // Langkah 1: Minta izin mikrofon dengan peredam bising bawaan browser
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Langkah 2: Pilih format yang didukung browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      // Langkah 3: Rekam pada 24 kbps agar unggahan cepat di jaringan lemah
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 24000,
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Langkah 4: Saat perekam berhenti, gabungkan potongan menjadi satu Blob
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        lastBlobRef.current = blob;
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());

        if (resolveStopRef.current) {
          resolveStopRef.current(blob);
          resolveStopRef.current = null;
        }
      };

      mediaRecorderRef.current.start(1000);
      isRecordingRef.current = true;
      setIsRecording(true);

      // Langkah 5: Hitung durasi tiap detik dan berhenti otomatis di batas maksimal
      timerRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1;
        setRecordingTime(elapsedSecondsRef.current);

        if (elapsedSecondsRef.current >= MAX_RECORDING_SECONDS) {
          stopRecording().then((blob) => {
            if (onLimitReachedRef.current) {
              onLimitReachedRef.current(blob);
            }
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Gagal mengakses mikrofon:', error);
      throw new Error('MIC_PERMISSION_DENIED', { cause: error });
    }
  };

  // Saat halaman ditinggalkan, hentikan timer dan matikan mikrofon
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
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
