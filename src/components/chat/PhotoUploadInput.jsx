// Komponen unggah foto bukti opsional dengan kompresi klien (<= 500 KB) dan penghapusan EXIF.

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";
import { compressImage } from "../../utils/imageCompressor.js";

export default function PhotoUploadInput({
  photoPreviewUrl,
  onAttachPhoto,
  onRemovePhoto,
  onSkipPhoto,
  disabled = false,
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  // Langkah 1: Tangani pemilihan file dari perangkat dan kompresi gambar di browser
  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) {
      return;
    }

    setErrorCode("");
    setIsCompressing(true);

    try {
      const { compressedFile, previewUrl } = await compressImage(selectedFile);
      onAttachPhoto(compressedFile, previewUrl);
    } catch (error) {
      setErrorCode(error?.code || "UNKNOWN_ERROR");
    } finally {
      setIsCompressing(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#D4D4D4] bg-[#FFFFFF] p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isCompressing}
        className="hidden"
      />

      {/* Langkah 2: Tampilkan pratinjau foto apabila sudah dilampirkan */}
      {photoPreviewUrl ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-[#D4D4D4] bg-[#F5F5F5]">
            <img
              src={photoPreviewUrl}
              alt={t("report.photo")}
              className="max-h-56 w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A0A0A]">
              <ImageIcon className="h-4 w-4 text-[#525252]" />
              {t("report.photoAttached")}
            </span>

            <button
              type="button"
              onClick={onRemovePhoto}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626] bg-[#FFFFFF] px-3 py-2 text-base font-medium text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("chat.removePhoto")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Langkah 3: Tampilkan tombol unggah foto dan tombol lewati apabila belum ada foto */
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isCompressing}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A0A0A] px-4 py-2.5 text-base font-medium text-[#FFFFFF] hover:bg-[#171717] disabled:opacity-50"
          >
            {isCompressing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span>
              {isCompressing ? t("common.loading") : t("chat.addPhoto")}
            </span>
          </button>

          {typeof onSkipPhoto === "function" && (
            <button
              type="button"
              onClick={onSkipPhoto}
              disabled={disabled || isCompressing}
              className="inline-flex items-center gap-2 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] px-4 py-2.5 text-base font-medium text-[#0A0A0A] hover:bg-[#F5F5F5] disabled:opacity-50"
            >
              <span>{t("chat.skipPhoto")}</span>
            </button>
          )}
        </div>
      )}

      {/* Langkah 4: Tampilkan pesan error terlokalisasi apabila kompresi atau ukuran foto gagal */}
      {errorCode && (
        <p className="mt-2 rounded-lg bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#DC2626]">
          {t(`errors.${errorCode}`)}
        </p>
      )}
    </div>
  );
}