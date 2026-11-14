// Placeholder modal pemilih lokasi di halaman chat (akan dilengkapi komponen peta mini oleh Zikri).

import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  onUseCurrentGps,
  isLocating = false,
  initialAddress = "",
}) {
  const { t } = useLanguage();
  const [manualAddress, setManualAddress] = useState(initialAddress);

  if (!isOpen) {
    return null;
  }

  // Langkah 1: Simpan alamat manual apabila peta mini belum tersedia atau GPS gagal
  function handleManualSubmit(event) {
    event.preventDefault();
    if (!manualAddress.trim()) {
      return;
    }
    onSelectLocation({
      address: manualAddress.trim(),
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/70 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] bg-[#FFFFFF] p-5 shadow-lg">
        {/* Langkah 2: Header modal pemilih lokasi */}
        <div className="mb-4 flex items-center justify-between border-b border-[#D4D4D4] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#DC2626]" />
            <h2
              id="location-modal-title"
              className="text-lg font-bold text-[#0A0A0A]"
            >
              {t("chat.askLocation")}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-lg p-1.5 text-[#525252] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Langkah 3: Tombol ambil lokasi GPS otomatis */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              onUseCurrentGps();
              onClose();
            }}
            disabled={isLocating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-3 text-base font-bold text-[#FFFFFF] hover:bg-[#B91C1C] disabled:opacity-50"
          >
            <Navigation className="h-5 w-5" />
            <span>{isLocating ? t("common.loading") : t("chat.useGps")}</span>
          </button>

          {/* Langkah 4: Area placeholder peta mini Leaflet yang akan diisi Zikri */}
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#D4D4D4] bg-[#F5F5F5] p-4 text-center">
            <MapPin className="mb-2 h-7 w-7 text-[#525252]" />
            <p className="text-base font-medium text-[#0A0A0A]">
              {t("chat.pickOnMap")}
            </p>
            <p className="mt-1 text-sm text-[#525252]">
              {t("map.selectHint")}
            </p>
          </div>

          {/* Langkah 5: Form alamat manual sebagai jalur cadangan */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="block text-sm font-semibold text-[#0A0A0A]">
              {t("report.location")}
            </label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder={t("errors.GEOCODE_FAILED")}
              className="w-full rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-3 py-2.5 text-base text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#D4D4D4] bg-[#FFFFFF] px-4 py-2 text-base font-medium text-[#0A0A0A] hover:bg-[#F5F5F5]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0A0A0A] px-4 py-2 text-base font-semibold text-[#FFFFFF] hover:bg-[#171717]"
              >
                {t("common.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}