// State global draf laporan aktif (PRD bagian 7.1 dan 7.5).
// Draf, termasuk rekaman suara dan foto, hanya hidup di memori browser. Jika halaman dimuat
// ulang, draf hilang dan warga memulai lagi dari halaman utama.
// Cara memakainya di komponen: lihat src/hooks/useReportDraft.js.

import { useCallback, useMemo, useState } from "react";
import { INITIAL_REPORT_DRAFT } from "../config/constants.js";
import { ReportDraftContext } from "../hooks/useReportDraft.js";

// Melepas URL pratinjau foto dari memori browser
function releasePreviewUrl(previewUrl) {
  if (previewUrl && previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}

export function ReportDraftProvider({ children }) {
  const [draft, setDraft] = useState(INITIAL_REPORT_DRAFT);
  const [inputMode, setInputMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Langkah 1: Memulai draf baru. Dipanggil halaman utama sebelum pindah ke /chat
  const startDraft = useCallback(
    ({ inputMode: nextInputMode, audioBlob }) => {
      releasePreviewUrl(photoPreviewUrl);
      setDraft({
        ...INITIAL_REPORT_DRAFT,
        audioBlob: audioBlob || null,
        // Laporan yang diketik ditandai "text_input"; untuk rekaman, nilainya diisi AI nanti
        audioQuality:
          nextInputMode === "manual" ? "text_input" : INITIAL_REPORT_DRAFT.audioQuality
      });
      setInputMode(nextInputMode);
      setMessages([]);
      setPhotoFile(null);
      setPhotoPreviewUrl(null);
      setIsProcessing(false);
    },
    [photoPreviewUrl]
  );

  // Langkah 2: Mengubah sebagian isi draf (hasil AI, koreksi warga, atau lokasi)
  const updateDraft = useCallback((fields) => {
    setDraft((current) => ({ ...current, ...fields }));
  }, []);

  // Langkah 3: Menambah pesan ke riwayat percakapan. role: "user" atau "model"
  const addMessage = useCallback((role, text, meta = {}) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role,
      text,
      timestamp: new Date().toISOString(),
      ...meta
    };
    setMessages((current) => [...current, newMessage]);
    return newMessage;
  }, []);

  // Langkah 4: Menyimpan foto hasil kompresi beserta URL pratinjaunya
  const attachPhoto = useCallback(
    (file, previewUrl) => {
      releasePreviewUrl(photoPreviewUrl);
      setPhotoFile(file);
      setPhotoPreviewUrl(previewUrl);
      setDraft((current) => ({ ...current, hasPhoto: true }));
    },
    [photoPreviewUrl]
  );

  // Langkah 5: Menghapus foto yang dilampirkan
  const removePhoto = useCallback(() => {
    releasePreviewUrl(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setDraft((current) => ({ ...current, hasPhoto: false }));
  }, [photoPreviewUrl]);

  // Langkah 6: Mengosongkan semuanya setelah laporan terkirim atau dibatalkan
  const resetDraft = useCallback(() => {
    releasePreviewUrl(photoPreviewUrl);
    setDraft(INITIAL_REPORT_DRAFT);
    setInputMode(null);
    setMessages([]);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setIsProcessing(false);
  }, [photoPreviewUrl]);

  const value = useMemo(
    () => ({
      draft,
      inputMode,
      startDraft,
      updateDraft,
      resetDraft,
      messages,
      addMessage,
      photoFile,
      photoPreviewUrl,
      attachPhoto,
      removePhoto,
      isProcessing,
      setIsProcessing
    }),
    [
      draft,
      inputMode,
      startDraft,
      updateDraft,
      resetDraft,
      messages,
      addMessage,
      photoFile,
      photoPreviewUrl,
      attachPhoto,
      removePhoto,
      isProcessing
    ]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}
