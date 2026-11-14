// Konteks state global untuk draf laporan aktif pada alur pelaporan warga.

import { useState, useCallback } from "react";
import { INITIAL_REPORT_DRAFT } from "../config/constants.js";
import { ReportDraftContext } from "../hooks/useReportDraft.js";

export function ReportDraftProvider({ children }) {
  const [draft, setDraft] = useState(INITIAL_REPORT_DRAFT);
  const [messages, setMessages] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Langkah 1: Fungsi pembaruan sebagian field pada draf laporan (dipakai edit AI maupun edit inline)
  const updateDraftFields = useCallback((updatedFields) => {
    setDraft((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  }, []);

  // Langkah 2: Fungsi penambahan pesan baru ke riwayat percakapan
  const addMessage = useCallback((role, text, meta = {}) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role,
      text,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Langkah 3: Fungsi penyimpanan file foto hasil kompresi beserta URL pratinjau lokal
  const attachPhoto = useCallback(
    (file, previewUrl) => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoFile(file);
      setPhotoPreviewUrl(previewUrl);
      setDraft((prev) => ({ ...prev, hasPhoto: true }));
    },
    [photoPreviewUrl]
  );

  // Langkah 4: Fungsi penghapusan foto yang dilampirkan dan pelepasan URL memori browser
  const removePhoto = useCallback(() => {
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setDraft((prev) => ({ ...prev, hasPhoto: false }));
  }, [photoPreviewUrl]);

  // Langkah 5: Fungsi penyimpanan rekaman audio sementara di memori browser
  const setAudioBlob = useCallback((blob) => {
    setDraft((prev) => ({ ...prev, audioBlob: blob }));
  }, []);

  // Langkah 6: Fungsi reset seluruh state setelah laporan terkirim atau dibatalkan
  const resetDraft = useCallback(() => {
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setDraft(INITIAL_REPORT_DRAFT);
    setMessages([]);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setIsProcessing(false);
  }, [photoPreviewUrl]);

  return (
    <ReportDraftContext.Provider
      value={{
        draft,
        setDraft,
        updateDraftFields,
        messages,
        setMessages,
        addMessage,
        photoFile,
        photoPreviewUrl,
        attachPhoto,
        removePhoto,
        setAudioBlob,
        turnstileToken,
        setTurnstileToken,
        isProcessing,
        setIsProcessing,
        resetDraft,
      }}
    >
      {children}
    </ReportDraftContext.Provider>
  );
}