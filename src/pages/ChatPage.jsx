// Halaman chat interaktif Lapor.in (/chat) untuk panduan pelaporan, edit draf, dan pengiriman laporan.

import { useEffect, useRef, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Construction,
  Droplets,
  Edit3,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import LocationPickerModal from "../components/chat/LocationPickerModal.jsx";
import PhotoUploadInput from "../components/chat/PhotoUploadInput.jsx";
import ReportPreviewCard from "../components/chat/ReportPreviewCard.jsx";
import { useLanguage } from "../hooks/useLanguage.js";
import { useReportDraft } from "../hooks/useReportDraft.js";
import {
  processReport,
  reverseGeocode,
  sendChatMessage,
} from "../services/apiClient.js";
import { signInAnonymouslySilent } from "../services/authService.js";
import { createReport } from "../services/reportService.js";

// Contoh laporan siap ketuk: ikon, kunci label, dan kunci kalimat awal (teksnya di id.json)
const REPORT_SUGGESTIONS = [
  { icon: Construction, labelKey: "chat.suggestRoadLabel", textKey: "chat.suggestRoadText" },
  { icon: Lightbulb, labelKey: "chat.suggestLampLabel", textKey: "chat.suggestLampText" },
  { icon: Trash2, labelKey: "chat.suggestTrashLabel", textKey: "chat.suggestTrashText" },
  { icon: Droplets, labelKey: "chat.suggestDrainLabel", textKey: "chat.suggestDrainText" },
];

function ChatPageContent() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    draft,
    inputMode,
    updateDraft,
    messages,
    addMessage,
    photoFile,
    photoPreviewUrl,
    attachPhoto,
    removePhoto,
    isProcessing,
    setIsProcessing,
    resetDraft,
  } = useReportDraft();


  const [inputText, setInputText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State pengendali alur gagal & hasil akhir pengiriman
  const [processErrorCode, setProcessErrorCode] = useState("");
  const [processRetryCount, setProcessRetryCount] = useState(0);
  const [forceManualCard, setForceManualCard] = useState(false);
  // Kunci pesan laporan tidak valid: "" (tidak ada), "chat.invalidReport" (rekaman),
  // atau "chat.invalidText" (ketikan)
  const [invalidMessageKey, setInvalidMessageKey] = useState("");
  const [submitErrorCode, setSubmitErrorCode] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const hasInitializedRef = useRef(false);
  const inputRef = useRef(null);
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

  // Langkah 1b: Hentikan suara sintesis browser ketika halaman chat ditutup atau berpindah rute
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Langkah 2: Jalankan pemrosesan awal laporan dari suara atau ketikan pertama
  const runInitialProcessing = useCallback(
    async ({ audioBlob, textInput }) => {
      setIsProcessing(true);
      setProcessErrorCode("");
      setInvalidMessageKey("");

      try {
        const result = await processReport({ audioBlob, textInput });

        // Alur gagal: AI menandai laporan tidak valid atau tidak terdengar jelas.
        // Draf TIDAK diisi, sehingga kartu pratinjau tidak tampil (PRD bagian 3, Alur Gagal)
        if (!result.draft.isValidReport || result.draft.audioQuality === "unusable") {
          const messageKey = audioBlob ? "chat.invalidReport" : "chat.invalidText";
          setInvalidMessageKey(messageKey);
          const invalidMsg = t(messageKey);
          addMessage("model", invalidMsg);
          speakText(invalidMsg);
          return;
        }

        updateDraft({
          ...result.draft,
          audioBlob: audioBlob || null,
        });

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
    [addMessage, setIsProcessing, speakText, t, updateDraft]
  );

  // Langkah 3: Saat halaman dibuka, baca draf yang dimulai halaman utama lewat startDraft().
  // inputMode "audio": rekaman ada di draft.audioBlob dan langsung diproses.
  // inputMode "manual": tampilkan sapaan dan tunggu ketikan warga.
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const incomingAudio = inputMode === "audio" ? draft.audioBlob : null;
    initialAudioRef.current = incomingAudio;
    initialTextRef.current = "";

    Promise.resolve().then(() => {
      if (incomingAudio) {
        runInitialProcessing({ audioBlob: incomingAudio, textInput: "" });
      } else {
        const welcomeText = t("chat.welcome");
        addMessage("model", welcomeText);
        speakText(welcomeText);
      }
    });
  }, [addMessage, draft.audioBlob, inputMode, runInitialProcessing, speakText, t]);

  // Langkah 4: Tombol Coba Lagi atau beralih ke pengisian manual apabila AI gagal
  function handleRetryInitial() {
    runInitialProcessing({
      audioBlob: initialAudioRef.current,
      textInput: initialTextRef.current,
    });
  }

  function handleActivateManualCard() {
    setProcessErrorCode("");
    setInvalidMessageKey("");
    setForceManualCard(true);
    updateDraft({
      audioQuality: "text_input",
      isValidReport: true,
    });
  }

  // Langkah 5: Contoh laporan diketuk (0 token AI): kalimat awalnya masuk ke kolom ketik,
  // lalu warga melengkapi sendiri. Tidak ada yang terkirim otomatis.
  function handleUseSuggestion(text) {
    setInputText(text);
    inputRef.current?.focus();
  }

  // Langkah 6: Ambil koordinat GPS perangkat dan lakukan reverse geocoding
  function handleUseCurrentGps() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      const geoErr = t("chat.locationDenied");
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
          updateDraft({
            latitude: lat,
            longitude: lng,
            address: geoResult.address,
            geohash: geoResult.geohash,
          });
          const confirmLoc = `${t("report.location")}: ${geoResult.address}`;
          addMessage("model", confirmLoc);
          speakText(confirmLoc);
        } catch (error) {
          updateDraft({
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
        const deniedMsg = t("chat.locationDenied");
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
        updateDraft(fieldUpdates);
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
      // Alur pemulihan: Jika sesi anonim belum siap, lakukan inisialisasi ulang otomatis dan coba kirim sekali lagi
      if (error?.code === "NOT_AUTHENTICATED") {
        try {
          await signInAnonymouslySilent();
          const fileToSend = skipAttachments ? null : photoFile;
          const audioToSend = skipAttachments ? null : draft.audioBlob;
          const payloadDraft = {
            ...draft,
            hasPhoto: Boolean(fileToSend),
          };
          const retryResult = await createReport(payloadDraft, fileToSend, audioToSend);
          setSubmittedTicket(retryResult.ticketCode);
          speakText(
            `${t("chat.ticketTitle")}. ${t("chat.ticketLabel")}: ${retryResult.ticketCode}`
          );
          return;
        } catch (retryError) {
          console.error("Gagal retry pengiriman laporan setelah silent auth:", retryError);
        }
      }

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
      <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] px-4 py-8">
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
              onClick={() => {
                resetDraft();
                navigate("/peta");
              }}
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
  // Penanda langkah: dihitung dari isi draf, tanpa state tambahan
  const hasStory = Boolean(draft.title || draft.summary);
  const hasLocation = draft.latitude !== null && draft.longitude !== null;
  const hasPhoto = Boolean(photoPreviewUrl);
  const currentStepKey = !hasStory ? "story" : !hasLocation ? "location" : "send";
  const steps = [
    { key: "story", label: t("chat.stepStory"), done: hasStory },
    { key: "location", label: t("chat.stepLocation"), done: hasLocation },
    { key: "photo", label: t("chat.stepPhoto"), done: hasPhoto },
    { key: "send", label: t("chat.stepSend"), done: false },
  ];

  // Contoh laporan hanya tampil sebelum warga mulai bercerita
  const hasUserMessage = messages.some((message) => message.role === "user");
  const showSuggestions = !hasDraftReady && !hasUserMessage && !isProcessing;

  const isAttachmentError =
    submitErrorCode === "PHOTO_TOO_LARGE" || submitErrorCode === "AUDIO_TOO_LARGE";

  return (
    <div className="flex h-dvh flex-col bg-[#F5F5F5]">
      {/* Langkah 10: Header halaman chat dengan tombol kembali dan kontrol suara TTS */}
      <header className="shrink-0 border-b border-[#D4D4D4] bg-[#0A0A0A] px-4 py-3 text-[#FFFFFF]">
        {/* Tiga kolom: kiri dan kanan sama lebar agar judul tepat di tengah. Di HP hanya ikon */}
        <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label={t("common.back")}
            className="inline-flex items-center gap-1.5 justify-self-start rounded-lg px-2.5 py-2 text-base font-medium text-[#FFFFFF] hover:bg-[#171717]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{t("common.back")}</span>
          </button>

          {/* Avatar asisten, nama, dan status */}
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-[#FFFFFF]"
            >
              <Bot className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base leading-tight font-bold text-[#FFFFFF] sm:text-lg">
                {t("chat.title")}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-[#D4D4D4]" aria-live="polite">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full bg-[#DC2626] ${isProcessing ? "animate-pulse" : ""}`}
                />
                <span>{isProcessing ? t("chat.statusTyping") : t("chat.statusActive")}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voiceEnabled ? t("chat.voiceOn") : t("chat.voiceOff")}
            className="inline-flex items-center gap-1.5 justify-self-end rounded-lg border border-[#525252] bg-[#171717] px-3 py-2 text-base font-semibold text-[#FFFFFF] hover:border-[#FFFFFF]"
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5 text-[#DC2626]" />
            ) : (
              <VolumeX className="h-5 w-5 text-[#D4D4D4]" />
            )}
            <span className="hidden sm:inline">
              {voiceEnabled ? t("chat.voiceOn") : t("chat.voiceOff")}
            </span>
          </button>
        </div>
      </header>

      {/* Langkah 10b: Penanda langkah. Selesai: centang hitam. Sedang dikerjakan: merah */}
      <nav
        aria-label={t("chat.stepsLabel")}
        className="shrink-0 border-b border-[#D4D4D4] bg-[#FFFFFF] px-4 py-2"
      >
        <ol className="mx-auto flex max-w-3xl items-center justify-between gap-1.5 sm:gap-3">
          {steps.map((step, index) => {
            const isCurrent = !step.done && step.key === currentStepKey;
            return (
              <li key={step.key} className="flex items-center gap-1.5 sm:flex-1 sm:gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.done
                      ? "bg-[#0A0A0A] text-[#FFFFFF]"
                      : isCurrent
                      ? "bg-[#DC2626] text-[#FFFFFF]"
                      : "border border-[#D4D4D4] bg-[#FFFFFF] text-[#525252]"
                  }`}
                >
                  {step.done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={`text-sm whitespace-nowrap ${
                    step.done || isCurrent ? "font-bold text-[#0A0A0A]" : "font-medium text-[#525252]"
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className="hidden h-px flex-1 bg-[#D4D4D4] sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Langkah 11: Area riwayat percakapan beserta kartu pratinjau dan banner alur gagal */}
      <ChatWindow
        messages={messages}
        isProcessing={isProcessing}
        onSpeak={speakText}
      >
        {showSuggestions && (
          <div className="chat-bubble-in sm:pl-12">
            <p className="mb-2.5 text-base font-medium text-[#525252]">
              {t("chat.suggestionsTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORT_SUGGESTIONS.map((suggestion) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={suggestion.labelKey}
                    type="button"
                    onClick={() => handleUseSuggestion(t(suggestion.textKey))}
                    className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A] bg-[#FFFFFF] px-4 py-2 text-base font-semibold text-[#0A0A0A] shadow-sm hover:bg-[#FEE2E2]"
                  >
                    <SuggestionIcon className="h-5 w-5 text-[#DC2626]" />
                    <span>{t(suggestion.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {processErrorCode && (
          <div className="sm:pl-12">
            {/* Pesan gagalnya sudah tampil sebagai gelembung asisten; di sini cukup pilihan lanjutnya */}
            <div className="flex flex-wrap gap-2">
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

        {invalidMessageKey && (
          <div className="sm:pl-12">
            {/* Pesannya sudah tampil sebagai gelembung asisten; di sini cukup pilihan lanjutnya */}
            <div className="flex flex-wrap gap-2">
              {/* Tombol rekam ulang hanya relevan jika laporan berasal dari rekaman */}
              {invalidMessageKey === "chat.invalidReport" && (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C]"
                >
                  <Mic className="h-4 w-4" />
                  <span>{t("chat.reRecord")}</span>
                </button>
              )}
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
            photoSlot={
              <PhotoUploadInput
                photoPreviewUrl={photoPreviewUrl}
                onAttachPhoto={attachPhoto}
                onRemovePhoto={removePhoto}
                disabled={isSubmitting}
              />
            }
            onUseGps={handleUseCurrentGps}
            isLocating={isLocating}
            onSaveEdit={(updated) => {
              updateDraft(updated);
              setForceManualCard(false);
              // Alamat diketik tetapi titik lokasi belum ada: minta warga menentukannya di peta.
              // Koordinat tidak pernah diisi otomatis, karena lokasi wajib berasal dari warga.
              if (updated.address && (draft.latitude === null || draft.longitude === null)) {
                setIsLocationModalOpen(true);
              }
            }}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
            forceEditMode={forceManualCard}
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

      {/* Langkah 12: Bilah bawah. Baris 1: kirim laporan (0 token AI). Baris 2: kolom ketik pesan */}
      <div className="shrink-0 border-t border-[#D4D4D4] bg-[#FFFFFF] px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2.5">
          {hasDraftReady && (
            <button
              type="button"
              onClick={() => handleSubmitReport({ skipAttachments: false })}
              disabled={isSubmitting || isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-3 text-lg font-bold text-[#FFFFFF] hover:bg-[#B91C1C] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>{t("chat.submit")}</span>
            </button>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isSubmitting}
              placeholder={t("chat.inputPlaceholder")}
              aria-label={t("chat.inputPlaceholder")}
              className="min-w-0 flex-1 rounded-xl border border-[#D4D4D4] bg-[#F5F5F5] px-4 py-3 text-base text-[#0A0A0A] placeholder-[#525252] focus:border-[#0A0A0A] focus:bg-[#FFFFFF] focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isSubmitting}
              aria-label={t("common.send")}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0A0A0A] px-4 py-3 text-base font-bold text-[#FFFFFF] hover:bg-[#171717] disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">{t("common.send")}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Langkah 13: Modal pemilih lokasi interaktif dan fallback manual */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(locData) => updateDraft(locData)}
        onUseCurrentGps={handleUseCurrentGps}
        isLocating={isLocating}
        initialAddress={draft.address}
        initialLatitude={draft.latitude}
        initialLongitude={draft.longitude}
        initialGeohash={draft.geohash}
      />
    </div>
  );
}

export default function ChatPage() {
  const { inputMode } = useReportDraft();

  // Halaman chat dibuka tanpa draf (misalnya setelah dimuat ulang, atau setelah laporan selesai):
  // kembali ke halaman utama. Penyedia draf dipasang di App.jsx, bukan di halaman ini.
  if (!inputMode) {
    return <Navigate to="/" replace />;
  }

  return <ChatPageContent />;
} 