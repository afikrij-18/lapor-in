import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import {
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  REPORT_CATEGORIES,
  URGENCY_LEVELS,
} from "../../config/constants.js";
import { useLanguage } from "../../hooks/useLanguage.js";

export default function ReportPreviewCard({
  draft,
  photoSlot = null,
  onSaveEdit,
  onOpenLocationPicker,
  onUseGps,
  isLocating = false,
  forceEditMode = false,
  disabled = false,
}) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState(null);

  const isEmergency = draft.urgency === URGENCY_LEVELS.EMERGENCY;
  const activeEditing = isEditing || forceEditMode;

  // Langkah 1: Turunkan nilai form dari draf laporan aktif atau edit lokal pengguna
  const currentTitle = formState?.title ?? draft.title ?? "";
  const currentCategory = formState?.category ?? draft.category ?? "Lainnya";
  const currentUrgency = formState?.urgency ?? draft.urgency ?? URGENCY_LEVELS.NORMAL;
  const currentSummary = formState?.summary ?? draft.summary ?? "";
  const currentAddress = formState?.address ?? draft.address ?? "";

  function updateFormField(field, value) {
    setFormState((prev) => ({
      title: currentTitle,
      category: currentCategory,
      urgency: currentUrgency,
      summary: currentSummary,
      address: currentAddress,
      ...prev,
      [field]: value,
    }));
  }

  // Langkah 2: Buka form edit dengan menyalin nilai draf terbaru saat tombol diklik
  function handleStartEdit() {
    setFormState({
      title: draft.title || "",
      category: draft.category || "Lainnya",
      urgency: draft.urgency || URGENCY_LEVELS.NORMAL,
      summary: draft.summary || "",
      address: draft.address || "",
    });
    setIsEditing(true);
  }

  // Langkah 3: Simpan perubahan field ke ReportDraftContext tanpa memanggil API Gemini
  function handleSave(event) {
    event.preventDefault();
    onSaveEdit({
      title: currentTitle.trim().slice(0, MAX_TITLE_LENGTH),
      category: currentCategory,
      urgency: currentUrgency,
      summary: currentSummary.trim().slice(0, MAX_SUMMARY_LENGTH),
      address: currentAddress.trim().slice(0, 250),
    });
    setFormState(null);
    setIsEditing(false);
  }

  function handleCancel() {
    setFormState(null);
    setIsEditing(false);
  }

  return (
    <div
      className={`chat-bubble-in overflow-hidden rounded-2xl border-2 bg-[#FFFFFF] shadow-lg transition-colors ${
        isEmergency ? "border-[#DC2626]" : "border-[#0A0A0A]"
      }`}
    >
      {/* Langkah 3: Header kartu berisi judul kartu, badge urgensi, dan tombol Edit Field */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-[#0A0A0A] px-4 py-3 text-[#FFFFFF] sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <FileText className="mt-1 h-5 w-5 shrink-0 text-[#DC2626]" />
          <div className="min-w-0">
            <span className="block text-sm font-semibold tracking-wide text-[#D4D4D4] uppercase">
              {t("chat.draftLabel")}
            </span>
            <span className="block text-lg leading-snug font-bold break-words text-[#FFFFFF]">
              {draft.title || t("report.title")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
              isEmergency
                ? "bg-[#DC2626] text-[#FFFFFF]"
                : draft.urgency === URGENCY_LEVELS.HIGH
                ? "bg-[#FFFFFF] text-[#0A0A0A]"
                : "border border-[#D4D4D4] text-[#FFFFFF]"
            }`}
          >
            {isEmergency && <AlertTriangle className="h-4 w-4" />}
            <span>{draft.urgency}</span>
          </span>

          {!activeEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFFFFF] px-3 py-1.5 text-base font-semibold text-[#FFFFFF] hover:bg-[#171717] disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" />
              <span>{t("chat.editField")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Langkah 4: Tampilkan formulir edit inline atau tampilan ringkasan baca-saja */}
      <div className={`p-4 sm:p-5 ${isEmergency ? "bg-[#FEE2E2]/40" : ""}`}>
      {activeEditing ? (
        <form onSubmit={handleSave} className="space-y-3 text-base">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#0A0A0A]">
              {t("report.title")}
            </label>
            <input
              type="text"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={currentTitle}
              onChange={(e) => updateFormField("title", e.target.value)}
              className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#0A0A0A]">
                {t("report.category")}
              </label>
              <select
                value={currentCategory}
                onChange={(e) => updateFormField("category", e.target.value)}
                className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
              >
                {REPORT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#0A0A0A]">
                {t("report.urgency")}
              </label>
              <select
                value={currentUrgency}
                onChange={(e) => updateFormField("urgency", e.target.value)}
                className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
              >
                {Object.values(URGENCY_LEVELS).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#0A0A0A]">
              {t("report.summary")}
            </label>
            <textarea
              rows={3}
              required
              maxLength={MAX_SUMMARY_LENGTH}
              value={currentSummary}
              onChange={(e) => updateFormField("summary", e.target.value)}
              className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#0A0A0A]">
              {t("report.location")}
            </label>
            <input
              type="text"
              maxLength={250}
              value={currentAddress}
              onChange={(e) => updateFormField("address", e.target.value)}
              className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            {!forceEditMode && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-4 py-2 text-base font-medium text-[#0A0A0A] hover:bg-[#F5F5F5]"
              >
                <X className="h-4 w-4" />
                <span>{t("common.cancel")}</span>
              </button>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2 text-base font-semibold text-[#FFFFFF] hover:bg-[#171717]"
            >
              <Check className="h-4 w-4" />
              <span>{t("common.save")}</span>
            </button>
          </div>
        </form>
      ) : (
        <dl className="space-y-2.5 text-base">
          <div className="flex flex-col sm:flex-row sm:gap-2">
            <dt className="min-w-28 font-semibold text-[#525252]">
              {t("report.category")}:
            </dt>
            <dd className="font-medium text-[#0A0A0A]">{draft.category}</dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:gap-2">
            <dt className="min-w-28 font-semibold text-[#525252]">
              {t("report.summary")}:
            </dt>
            <dd className="text-[#0A0A0A]">{draft.summary || "-"}</dd>
          </div>

          {/* Lokasi: alamat saat ini, lalu dua cara menentukannya (0 token AI) */}
          <div className="flex flex-col gap-1.5 border-t border-[#D4D4D4] pt-3 sm:flex-row sm:gap-2">
            <dt className="min-w-28 shrink-0 font-semibold text-[#525252]">
              {t("report.location")}:
            </dt>
            <dd className="flex min-w-0 flex-1 flex-col gap-2 text-[#0A0A0A]">
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#DC2626]" />
                <span className="break-words">{draft.address || t("report.locationEmpty")}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {typeof onUseGps === "function" && (
                  <button
                    type="button"
                    onClick={onUseGps}
                    disabled={disabled || isLocating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-2 text-base font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 text-[#DC2626]" />
                    )}
                    <span>{t("chat.useGps")}</span>
                  </button>
                )}
                {typeof onOpenLocationPicker === "function" && (
                  <button
                    type="button"
                    onClick={onOpenLocationPicker}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-2 text-base font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4 text-[#DC2626]" />
                    <span>{t("chat.pickOnMap")}</span>
                  </button>
                )}
              </div>
            </dd>
          </div>

          {/* Foto: tombol tambah, atau pratinjau dan tombol hapus (diisi halaman chat) */}
          <div className="flex flex-col gap-1.5 border-t border-[#D4D4D4] pt-3 sm:flex-row sm:gap-2">
            <dt className="min-w-28 shrink-0 font-semibold text-[#525252]">
              {t("report.photo")}:
            </dt>
            <dd className="min-w-0 flex-1 text-[#0A0A0A]">{photoSlot}</dd>
          </div>
        </dl>
      )}
      </div>
    </div>
  );
}