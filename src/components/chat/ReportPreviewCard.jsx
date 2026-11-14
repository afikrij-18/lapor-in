import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  FileText,
  Image as ImageIcon,
  MapPin,
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
  photoPreviewUrl,
  onSaveEdit,
  onOpenLocationPicker,
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
      className={`rounded-2xl border-2 p-4 shadow-xs transition-colors sm:p-5 ${
        isEmergency
          ? "border-[#DC2626] bg-[#FEE2E2]/40"
          : "border-[#0A0A0A] bg-[#FFFFFF]"
      }`}
    >
      {/* Langkah 3: Header kartu berisi judul kartu, badge urgensi, dan tombol Edit Field */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D4] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#0A0A0A]" />
          <span className="text-base font-bold text-[#0A0A0A]">
            {draft.title || t("report.title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
              isEmergency
                ? "bg-[#DC2626] text-[#FFFFFF]"
                : draft.urgency === URGENCY_LEVELS.HIGH
                ? "bg-[#0A0A0A] text-[#FFFFFF]"
                : "border border-[#D4D4D4] bg-[#F5F5F5] text-[#0A0A0A]"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-1.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" />
              <span>{t("chat.editField")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Langkah 4: Tampilkan formulir edit inline atau tampilan ringkasan baca-saja */}
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <dt className="min-w-28 font-semibold text-[#525252]">
              {t("report.location")}:
            </dt>
            <dd className="flex flex-wrap items-center gap-2 text-[#0A0A0A]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0 text-[#DC2626]" />
                <span>{draft.address || t("report.locationEmpty")}</span>
              </span>
              {typeof onOpenLocationPicker === "function" && (
                <button
                  type="button"
                  onClick={onOpenLocationPicker}
                  disabled={disabled}
                  className="text-sm font-semibold text-[#DC2626] underline hover:text-[#B91C1C]"
                >
                  {t("chat.pickOnMap")}
                </button>
              )}
            </dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <dt className="min-w-28 font-semibold text-[#525252]">
              {t("report.photo")}:
            </dt>
            <dd className="flex items-center gap-2 text-[#0A0A0A]">
              <ImageIcon className="h-4 w-4 shrink-0 text-[#525252]" />
              <span>
                {photoPreviewUrl || draft.hasPhoto
                  ? t("report.photoAttached")
                  : t("report.photoEmpty")}
              </span>
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}