// Modal pemilih lokasi di halaman chat dengan peta mini Leaflet interaktif dan fallback alamat manual.

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Navigation, X } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.js";
import { reverseGeocode } from "../../services/apiClient.js";

// Ikon pin vektor Signal Red (#DC2626) sesuai palet resmi dan Zero Emoji Policy
const RED_PIN_ICON = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color:#DC2626;width:24px;height:24px;border-radius:50%;border:3px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <div style="background-color:#FFFFFF;width:6px;height:6px;border-radius:50%;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const DEFAULT_COORDS = {
  lat: -0.9471,
  lng: 100.4172,
  geohash: "qpz6t59",
};

export default function LocationPickerModal(props) {
  if (!props.isOpen) {
    return null;
  }
  return <LocationPickerModalDialog {...props} />;
}

function LocationPickerModalDialog({
  onClose,
  onSelectLocation,
  onUseCurrentGps,
  isLocating = false,
  initialAddress = "",
  initialLatitude = null,
  initialLongitude = null,
  initialGeohash = "",
}) {
  const { t } = useLanguage();
  const [manualAddress, setManualAddress] = useState(initialAddress || "");
  const [selectedCoords, setSelectedCoords] = useState(() => ({
    lat:
      typeof initialLatitude === "number" && !isNaN(initialLatitude)
        ? initialLatitude
        : DEFAULT_COORDS.lat,
    lng:
      typeof initialLongitude === "number" && !isNaN(initialLongitude)
        ? initialLongitude
        : DEFAULT_COORDS.lng,
    geohash: initialGeohash || DEFAULT_COORDS.geohash,
  }));
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Langkah 1: Inisialisasi peta interaktif Leaflet saat modal dibuka
  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    // Bersihkan peta lama jika ada
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startLat =
      typeof initialLatitude === "number" && !isNaN(initialLatitude)
        ? initialLatitude
        : DEFAULT_COORDS.lat;
    const startLng =
      typeof initialLongitude === "number" && !isNaN(initialLongitude)
        ? initialLongitude
        : DEFAULT_COORDS.lng;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([startLat, startLng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([startLat, startLng], {
      icon: RED_PIN_ICON,
      draggable: true,
    }).addTo(map);

    // Langkah 2: Fungsi pembaruan posisi pin dan reverse geocode alamat
    async function updateMarkerPosition(lat, lng) {
      marker.setLatLng([lat, lng]);
      setIsReverseGeocoding(true);
      try {
        const geoResult = await reverseGeocode(lat, lng);
        setManualAddress(geoResult.address);
        setSelectedCoords({
          lat,
          lng,
          geohash: geoResult.geohash,
        });
      } catch {
        setSelectedCoords((prev) => ({
          ...prev,
          lat,
          lng,
        }));
      } finally {
        setIsReverseGeocoding(false);
      }
    }

    map.on("click", (e) => {
      updateMarkerPosition(e.latlng.lat, e.latlng.lng);
    });

    marker.on("dragend", (e) => {
      const position = e.target.getLatLng();
      updateMarkerPosition(position.lat, position.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Pastikan ukuran peta disesuaikan setelah modal render penuh
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLatitude, initialLongitude]);

  // Langkah 4: Simpan alamat dan koordinat yang dipilih ke draf laporan (Zero Dead-End Policy)
  function handleSaveLocation(event) {
    if (event) {
      event.preventDefault();
    }
    const finalAddress = manualAddress.trim() || initialAddress.trim() || t("report.locationEmpty");
    onSelectLocation({
      address: finalAddress,
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      geohash: selectedCoords.geohash,
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
        {/* Langkah 5: Header modal pemilih lokasi */}
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

        <div className="space-y-4">
          {/* Langkah 6: Tombol ambil lokasi GPS otomatis */}
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

          {/* Langkah 7: Kontainer peta interaktif mini Leaflet dengan pin yang dapat digeser atau diklik */}
          <div className="relative overflow-hidden rounded-xl border border-[#D4D4D4]">
            <div
              ref={mapContainerRef}
              className="h-48 w-full bg-[#F5F5F5]"
            />
            {isReverseGeocoding && (
              <div className="absolute inset-0 z-1000 flex items-center justify-center bg-[#0A0A0A]/30">
                <div className="flex items-center gap-2 rounded-lg bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#0A0A0A] shadow-md">
                  <Loader2 className="h-4 w-4 animate-spin text-[#DC2626]" />
                  <span>{t("common.loading")}</span>
                </div>
              </div>
            )}
            <div className="bg-[#F5F5F5] px-3 py-1.5 text-center text-xs text-[#525252]">
              {t("map.selectHint")}
            </div>
          </div>

          {/* Langkah 8: Form input alamat manual / konfirmasi alamat terpilih */}
          <form onSubmit={handleSaveLocation} className="space-y-3">
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

            <div className="flex justify-end gap-2 pt-1">
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