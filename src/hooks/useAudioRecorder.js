import { useState, useRef, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const resolveStopRef = useRef(null);

  const MAX_SECONDS = 120; // Batas durasi maksimal 120 detik sesuai PRD

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 24000,
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        
        if (resolveStopRef.current) {
          resolveStopRef.current(blob);
          resolveStopRef.current = null;
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      isRecordingRef.current = true;

      // Timer durasi & auto-stop pada 120 detik
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
      throw new Error('MIC_PERMISSION_DENIED', { cause: error });
    }
  };

  // Diubah menjadi fungsi biasa tanpa useCallback agar selaras dengan React Compiler
  const stopRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecordingRef.current) {
        resolveStopRef.current = resolve;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        isRecordingRef.current = false;
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        resolve(audioBlob);
      }
    });
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