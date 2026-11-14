// Halaman chat interaktif Lapor.in (/chat) untuk panduan pelaporan, edit draf, dan pengiriman laporan.

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Mic,
  Navigation,
  RefreshCw,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import LocationPickerModal from "../components/chat/LocationPickerModal.jsx";
import PhotoUploadInput from "../components/chat/PhotoUploadInput.jsx";
import ReportPreviewCard from "../components/chat/ReportPreviewCard.jsx";
import { ReportDraftProvider } from "../context/ReportDraftContext.jsx";
import { useLanguage } from "../hooks/useLanguage.js";
import { useReportDraft } from "../hooks/useReportDraft.js";
import {
  processReport,
  reverseGeocode,
  sendChatMessage,
} from "../services/apiClient.js";
import { createReport } from "../services/reportService.js";

function ChatPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const {
    draft,
    updateDraftFields,
    messages,
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
  } = useReportDraft();

  const [inputText, setInputText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showPhotoBox, setShowPhotoBox] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State pengendali alur gagal & hasil akhir pengiriman
  const [processErrorCode, setProcessErrorCode] = useState("");
  const [processRetryCount, setProcessRetryCount] = useState(0);
  const [forceManualCard, setForceManualCard] = useState(false);
  const [isInvalidReportState, setIsInvalidReportState] = useState(false);
  const [submitErrorCode, setSubmitErrorCode] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const hasInitializedRef = useRef(false);
  const initialAudioRef = useRef(null);
  const initialTextRef = useRef("");

  // Langkah 1: Fungsi Text-to-Speech (TTS) bawaan browser untuk aksesibilitas warga
  const speakText = useCallback(
    (text) => {
      if (
        !voiceEnabled ||
        !text ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  function toggleVoice() {
    setVoiceEnabled((prev) => {
      if (prev && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return !prev;
    });
  }

  // Langkah 2: Jalankan pemrosesan awal laporan dari suara atau ketikan pertama
  const runInitialProcessing = useCallback(
    async ({ audioBlob, textInput, token }) => {
      setIsProcessing(true);
      setProcessErrorCode("");
      setIsInvalidReportState(false);

      try {
        const result = await processReport({
          audioBlob,
          textInput,
          turnstileToken: token,
        });

        updateDraftFields({
          ...result.draft,
          audioBlob: audioBlob || null,
        });

        // Alur gagal: AI menandai audio tidak valid atau tidak terdengar jelas
        if (!result.draft.isValidReport || result.draft.audioQuality === "unusable") {
          setIsInvalidReportState(true);
          const invalidMsg = t("chat.invalidReport");
          addMessage("model", invalidMsg);
          speakText(invalidMsg);
          return;
        }

        setShowPhotoBox(true);
        addMessage("model", result.aiMessage);
        speakText(result.aiMessage);
      } catch (error) {
        const code = error?.code || "AI_UNAVAILABLE";
        setProcessErrorCode(code);
        setProcessRetryCount((prev) => prev + 1);
        const errMsg = t(`errors.${code}`);
        addMessage("model", errMsg);
        speakText(errMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage, setIsProcessing, speakText, t, updateDraftFields]
  );

  // Langkah 3: Baca location.state dari HomePage.jsx secara asinkron saat halaman dimuat
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const state = location.state || {};
    const incomingAudio = state.audioBlob || null;
    const incomingText =
      typeof state.initialText === "string" ? state.initialText.trim() : "";
    const incomingToken = state.turnstileToken || "";

    initialAudioRef.current = incomingAudio;
    initialTextRef.current = incomingText;

    Promise.resolve().then(() => {
      if (incomingToken) {
        setTurnstileToken(incomingToken);
      }
      if (incomingAudio) {
        setAudioBlob(incomingAudio);
      }

      if (incomingAudio || incomingText) {
        if (incomingText) {
          addMessage("user", incomingText);
        }
        runInitialProcessing({
          audioBlob: incomingAudio,
          textInput: incomingText,
          token: incomingToken,
        });
      } else {
        addMessage("model", t("chat.inputPlaceholder"));
      }
    });
  }, [
    addMessage,
    location.state,
    runInitialProcessing,
    setAudioBlob,
    setTurnstileToken,
    t,
  ]);

  // Langkah 4: Tombol Coba Lagi atau beralih ke pengisian manual apabila AI gagal
  function handleRetryInitial() {
    runInitialProcessing({
      audioBlob: initialAudioRef.current,
      textInput: initialTextRef.current,
      token: turnstileToken,
    });
  }

  function handleActivateManualCard() {
    setProcessErrorCode("");
    setForceManualCard(true);
    setShowPhotoBox(true);
    updateDraftFields({
      audioQuality: "text_input",
      isValidReport: true,
    });
  }

  // Langkah 5: Shortcut 0-token saat warga menekan tombol Lewati Foto
  function handleSkipPhoto() {
    setShowPhotoBox(false);
    addMessage("user", t("chat.skipPhoto"));
    const nextQuestion = t("chat.askLocation");
    addMessage("model", nextQuestion);
    speakText(nextQuestion);
  }

  // Langkah 6: Ambil koordinat GPS perangkat dan lakukan reverse geocoding
  function handleUseCurrentGps() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      const geoErr = t("errors.GEOCODE_FAILED");
      addMessage("model", geoErr);
      setIsLocationModalOpen(true);
      return;
    }

    setIsLocating(true);
    addMessage("user", t("chat.useGps"));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const geoResult = await reverseGeocode(lat, lng);
          updateDraftFields({
            latitude: lat,
            longitude: lng,
            address: geoResult.address,
            geohash: geoResult.geohash,
          });
          const confirmLoc = `${t("report.location")}: ${geoResult.address}`;
          addMessage("model", confirmLoc);
          speakText(confirmLoc);
        } catch (error) {
          updateDraftFields({
            latitude: lat,
            longitude: lng,
          });
          const fallbackMsg = t(`errors.${error?.code || "GEOCODE_FAILED"}`);
          addMessage("model", fallbackMsg);
          speakText(fallbackMsg);
          setForceManualCard(true);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        const deniedMsg = t("errors.GEOCODE_FAILED");
        addMessage("model", deniedMsg);
        speakText(deniedMsg);
        setIsLocationModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Langkah 7: Kirim pesan chat atau perintah edit laporan ke Gemini
  async function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isProcessing) {
      return;
    }

    setInputText("");
    addMessage("user", trimmed);

    if (!draft.title && !draft.summary && !forceManualCard) {
      initialTextRef.current = trimmed;
      await runInitialProcessing({
        audioBlob: null,
        textInput: trimmed,
        token: turnstileToken,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const recentHistory = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const result = await sendChatMessage({
        userMessage: trimmed,
        currentDraft: {
          title: draft.title,
          category: draft.category,
          urgency: draft.urgency,
          summary: draft.summary,
          address: draft.address,
          hasPhoto: Boolean(photoPreviewUrl || draft.hasPhoto),
        },
        recentHistory,
      });

      const { removePhotoRequested, ...fieldUpdates } = result.updatedFields || {};
      if (removePhotoRequested) {
        removePhoto();
      }
      if (Object.keys(fieldUpdates).length > 0) {
        updateDraftFields(fieldUpdates);
      }

      addMessage("model", result.aiMessage);
      speakText(result.aiMessage);
    } catch (error) {
      const code = error?.code || "AI_UNAVAILABLE";
      const errMsg = t(`errors.${code}`);
      addMessage("model", errMsg);
      speakText(errMsg);
    } finally {
      setIsProcessing(false);
    }
  }

  // Langkah 8: Kirim laporan final ke Firestore via reportService.createReport
  async function handleSubmitReport({ skipAttachments = false } = {}) {
    if (isSubmitting) {
      return;
    }

    if (!draft.title.trim() || !draft.summary.trim()) {
      setForceManualCard(true);
      addMessage("model", t("errors.INVALID_INPUT"));
      return;
    }

    if (draft.latitude === null || draft.longitude === null) {
      addMessage("model", t("chat.askLocation"));
      setIsLocationModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorCode("");

    try {
      const fileToSend = skipAttachments ? null : photoFile;
      const audioToSend = skipAttachments ? null : draft.audioBlob;

      const payloadDraft = {
        ...draft,
        hasPhoto: Boolean(fileToSend),
      };

      const result = await createReport(payloadDraft, fileToSend, audioToSend);
      setSubmittedTicket(result.ticketCode);
      speakText(
        `${t("chat.ticketTitle")}. ${t("chat.ticketLabel")}: ${result.ticketCode}`
      );
    } catch (error) {
      const code = error?.code || "UNKNOWN_ERROR";
      setSubmitErrorCode(code);
      addMessage("model", t(`errors.${code}`));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Langkah 9: Tampilan sukses dengan Kode Tiket Pelacakan setelah laporan terkirim
  if (submittedTicket) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center bg-[#F5F5F5] px-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border-2 border-[#0A0A0A] bg-[#FFFFFF] p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A0A0A] text-[#FFFFFF]">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h1 className="text-2xl font-bold text-[#0A0A0A]">
            {t("chat.ticketTitle")}
          </h1>

          <div className="my-6 rounded-xl border border-[#D4D4D4] bg-[#F5F5F5] p-4">
            <p className="text-sm font-semibold text-[#525252]">
              {t("chat.ticketLabel")}
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider text-[#DC2626]">
              {submittedTicket}
            </p>
          </div>

          <p className="mb-6 text-base text-[#525252]">
            {t("chat.ticketHint")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/peta")}
              className="flex-1 rounded-xl bg-[#0A0A0A] px-4 py-3 text-base font-bold text-[#FFFFFF] hover:bg-[#171717]"
            >
              {t("nav.publicMap")}
            </button>
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setSubmittedTicket(null);
                navigate("/");
              }}
              className="flex-1 rounded-xl border border-[#0A0A0A] bg-[#FFFFFF] px-4 py-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F5F5F5]"
            >
              {t("nav.newReport")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasDraftReady = Boolean(draft.title || draft.summary || forceManualCard);
  const isAttachmentError =
    submitErrorCode === "PHOTO_TOO_LARGE" || submitErrorCode === "AUDIO_TOO_LARGE";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#F5F5F5]">
      {/* Langkah 10: Header halaman chat dengan tombol kembali dan kontrol suara TTS */}
      <header className="border-b border-[#D4D4D4] bg-[#0A0A0A] px-4 py-3 text-[#FFFFFF]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-base font-medium text-[#FFFFFF] hover:bg-[#171717]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t("common.back")}</span>
          </button>

          <h1 className="text-lg font-bold text-[#FFFFFF]">
            {t("chat.title")}
          </h1>

          <button
            type="button"
            onClick={toggleVoice}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#525252] bg-[#171717] px-3 py-1.5 text-sm font-semibold text-[#FFFFFF] hover:border-[#FFFFFF]"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-[#DC2626]" />
                <span>{t("chat.voiceOn")}</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-[#D4D4D4]" />
                <span>{t("chat.voiceOff")}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Langkah 11: Area riwayat percakapan beserta kartu pratinjau dan banner alur gagal */}
      <ChatWindow
        messages={messages}
        isProcessing={isProcessing}
        onSpeak={speakText}
      >
        {processErrorCode && (
          <div className="rounded-xl border border-[#DC2626] bg-[#FEE2E2] p-4">
            <div className="flex items-start gap-2 text-base font-medium text-[#0A0A0A]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
              <span>{t(`errors.${processErrorCode}`)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {processRetryCount < 2 && (
                <button
                  type="button"
                  onClick={handleRetryInitial}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C]"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{t("common.retry")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleActivateManualCard}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#171717]"
              >
                <Edit3 className="h-4 w-4" />
                <span>{t("chat.fillManually")}</span>
              </button>
            </div>
          </div>
        )}

        {isInvalidReportState && (
          <div className="rounded-xl border border-[#DC2626] bg-[#FEE2E2] p-4">
            <p className="text-base font-medium text-[#0A0A0A]">
              {t("chat.invalidReport")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C]"
              >
                <Mic className="h-4 w-4" />
                <span>{t("chat.reRecord")}</span>
              </button>
              <button
                type="button"
                onClick={handleActivateManualCard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-4 py-2 text-base font-bold text-[#0A0A0A] hover:bg-[#F5F5F5]"
              >
                <Edit3 className="h-4 w-4" />
                <span>{t("chat.typeInstead")}</span>
              </button>
            </div>
          </div>
        )}

        {hasDraftReady && (
          <ReportPreviewCard
            draft={draft}
            photoPreviewUrl={photoPreviewUrl}
            onSaveEdit={(updated) => {
              updateDraftFields(updated);
              setForceManualCard(false);
            }}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
            forceEditMode={forceManualCard}
            disabled={isSubmitting}
          />
        )}

        {(showPhotoBox || photoPreviewUrl) && hasDraftReady && (
          <PhotoUploadInput
            photoPreviewUrl={photoPreviewUrl}
            onAttachPhoto={attachPhoto}
            onRemovePhoto={removePhoto}
            onSkipPhoto={handleSkipPhoto}
            disabled={isSubmitting}
          />
        )}

        {submitErrorCode && (
          <div className="rounded-xl border border-[#DC2626] bg-[#FEE2E2] p-4">
            <div className="flex items-start gap-2 text-base font-medium text-[#0A0A0A]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
              <span>{t(`errors.${submitErrorCode}`)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSubmitReport({ skipAttachments: false })}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C]"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t("chat.resubmit")}</span>
              </button>

              {(isAttachmentError || photoFile || draft.audioBlob) && (
                <button
                  type="button"
                  onClick={() => handleSubmitReport({ skipAttachments: true })}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#171717]"
                >
                  <span>{t("chat.submitWithoutAttachment")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </ChatWindow>

      {/* Langkah 12: Bilah Quick Actions (0 token AI) dan form input pesan edit */}
      <div className="border-t border-[#D4D4D4] bg-[#FFFFFF] px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2.5">
          {hasDraftReady && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPhotoBox((prev) => !prev)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5]"
              >
                <Camera className="h-4 w-4" />
                <span>{t("chat.addPhoto")}</span>
              </button>

              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={isLocating || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5]"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 text-[#DC2626]" />
                )}
                <span>{t("chat.useGps")}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D4] bg-[#F5F5F5] px-3 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#D4D4D4]/50"
              >
                <MapPin className="h-4 w-4" />
                <span>{t("chat.pickOnMap")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitReport({ skipAttachments: false })}
                disabled={isSubmitting || isProcessing}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>{t("chat.submit")}</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isSubmitting}
              placeholder={t("chat.inputPlaceholder")}
              className="flex-1 rounded-xl border border-[#D4D4D4] bg-[#F5F5F5] px-4 py-3 text-base text-[#0A0A0A] placeholder-[#525252] focus:border-[#0A0A0A] focus:bg-[#FFFFFF] focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A0A0A] px-5 py-3 text-base font-bold text-[#FFFFFF] hover:bg-[#171717] disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span>{t("common.send")}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Langkah 13: Modal placeholder pemilih lokasi (akan dilengkapi Zikri) */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(locData) => updateDraftFields(locData)}
        onUseCurrentGps={handleUseCurrentGps}
        isLocating={isLocating}
        initialAddress={draft.address}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <ReportDraftProvider>
      <ChatPageContent />
    </ReportDraftProvider>
  );
}