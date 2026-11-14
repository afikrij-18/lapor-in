// Komponen peta interaktif publik Leaflet dengan Marker Clustering (PRD bagian 6.3, 7.1, 7.2 & 8.1).
// Mematuhi Zero Emoji Policy (ikon SVG), palet kontras tinggi Hitam-Merah-Putih, dan pelacakan lokasi pengguna.

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Globe, Info, Locate, Navigation, X } from "lucide-react";
import { COLOR_PALETTE, URGENCY_LEVELS } from "../../config/constants.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { useLanguage } from "../../hooks/useLanguage.js";

// Impor stylesheet Leaflet dan MarkerCluster
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Kotak batas maksimum navigasi kamera wilayah Indonesia (Samudra Hindia s.d. Perbatasan Papua Nugini)
const INDONESIA_MAX_BOUNDS = [
  [-13.0, 92.0], // Batas Barat Daya
  [9.0, 143.0]   // Batas Timur Laut
];

// Koordinat default titik tengah cakupan nasional Indonesia pada Zoom 5
const DEFAULT_CENTER = [-2.2, 118.0];
const DEFAULT_ZOOM = 5;

// Pembuat ikon marker laporan berdasarkan tingkat urgensi
function createReportMarkerIcon(urgency) {
  let bgColor = COLOR_PALETTE.BLACK_PRIMARY;
  let pulseClass = "";

  if (urgency === URGENCY_LEVELS.EMERGENCY) {
    bgColor = COLOR_PALETTE.RED_PRIMARY;
    pulseClass = "animate-pulse";
  } else if (urgency === URGENCY_LEVELS.HIGH) {
    bgColor = "#EA580C"; // Oranye / Amber terang untuk diferensiasi tajam terhadap Darurat (Merah)
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer ${pulseClass}" style="background-color: ${bgColor};">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-report-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// Pembuat ikon marker lokasi langsung pengguna
function createUserMarkerIcon() {
  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-[#DC2626] shadow-xl">
      <div class="absolute w-12 h-12 rounded-full bg-[#DC2626] opacity-40 animate-ping"></div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-user-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Pembuat ikon cluster marker (Hitam & Merah kontras tinggi)
function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const html = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#DC2626] bg-[#0A0A0A] text-white font-bold text-sm shadow-xl">
      ${count}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-cluster-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// Komponen perantara untuk mengontrol pergerakan kamera peta
function MapController({
  selectedReport,
  userLocation,
  resetTrigger,
  reports = [],
  filterKey = "",
  isFilterActive = false
}) {
  const map = useMap();
  const previousReportRef = useRef(null);
  const lastViewBeforeSelectionRef = useRef(null);

  useEffect(() => {
    // Langkah 1: Kunci batas zoom minimal ke level 5 dan batas geografis ke Indonesia secara imperatif
    map.setMinZoom(5);
    map.setMaxZoom(18);
    map.setMaxBounds(INDONESIA_MAX_BOUNDS);

    // Pastikan jika zoom awal berada di bawah 5, paksa ke zoom 5
    if (map.getZoom() < 5) {
      map.setZoom(5);
    }
  }, [map]);

  useEffect(() => {
    // Langkah 2: Pusatkan peta jika ada laporan terpilih
    if (selectedReport && typeof selectedReport.latitude === "number" && typeof selectedReport.longitude === "number") {
      // Simpan posisi dan level zoom kamera sebelum terbang ke laporan (misal tampilan regional pulau)
      if (!previousReportRef.current) {
        lastViewBeforeSelectionRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom()
        };
      }

      map.flyTo([selectedReport.latitude, selectedReport.longitude], 16, { duration: 1.2 });
    } else if (previousReportRef.current && !selectedReport) {
      // Langkah 2b: Ketika panel detail ditutup (selectedReport menjadi null),
      // kembalikan kamera ke posisi dan zoom terakhir sebelum laporan diklik (misal kembali ke Pulau Sumatera)
      if (lastViewBeforeSelectionRef.current) {
        map.flyTo(
          lastViewBeforeSelectionRef.current.center,
          lastViewBeforeSelectionRef.current.zoom,
          { duration: 1.2 }
        );
      } else {
        map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
      }
    }
    previousReportRef.current = selectedReport;
  }, [map, selectedReport]);

  useEffect(() => {
    // Langkah 3: Pusatkan peta jika lokasi pengguna berhasil dideteksi
    if (userLocation && typeof userLocation.latitude === "number" && typeof userLocation.longitude === "number") {
      map.flyTo([userLocation.latitude, userLocation.longitude], 16, { duration: 1.2 });
    }
  }, [map, userLocation]);

  useEffect(() => {
    // Langkah 4: Kembalikan tampilan kamera ke seluruh wilayah Indonesia saat tombol reset ditekan
    if (resetTrigger > 0) {
      lastViewBeforeSelectionRef.current = null;
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [map, resetTrigger]);

  useEffect(() => {
    // Langkah 5: Otomatis zoom ke sebaran laporan saat filter dipilih
    // Filter laporan yang memiliki koordinat angka yang valid
    const validReports = reports.filter(
      (report) => typeof report.latitude === "number" && typeof report.longitude === "number"
    );

    // Tidak ada laporan untuk dibingkai: tanpa filter, kembali ke tampilan seluruh Indonesia
    if (validReports.length === 0) {
      if (!isFilterActive) {
        lastViewBeforeSelectionRef.current = null;
        map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
      }
      return;
    }

    // Ada laporan (dengan atau tanpa filter): arahkan peta ke sebarannya. Tanpa ini peta selalu
    // menampilkan seluruh Indonesia, walau semua laporan ada di satu kota.
    if (validReports.length === 1) {
      // Tepat 1 laporan: pusatkan ke laporan tersebut dengan zoom level 15
      map.flyTo([validReports[0].latitude, validReports[0].longitude], 15, { duration: 1.2 });
      lastViewBeforeSelectionRef.current = {
        center: L.latLng(validReports[0].latitude, validReports[0].longitude),
        zoom: 15
      };
    } else if (validReports.length > 1) {
      // Lebih dari 1 laporan: bingkai seluruh laporan menggunakan bounding box
      const bounds = L.latLngBounds(
        validReports.map((report) => [report.latitude, report.longitude])
      );
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.2 });
      lastViewBeforeSelectionRef.current = null;
    }
  }, [map, filterKey, isFilterActive, reports]);

  return null;
}

// Komponen penampil layer cluster marker laporan
function MarkerClusterLayer({ reports, onSelectReport }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function setupCluster() {
      // Langkah 1: Pastikan L tersedia di window untuk inisialisasi leaflet.markercluster
      if (typeof window !== "undefined") {
        window.L = L;
      }

      await import("leaflet.markercluster");
      if (!isMounted) return;

      // Hapus cluster layer lama jika ada
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }

      // Langkah 2: Buat MarkerClusterGroup dengan icon kustom Hitam/Merah
      const clusterGroup = L.markerClusterGroup({
        iconCreateFunction: createClusterIcon,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50
      });

      // Langkah 3: Tambahkan marker laporan ke dalam cluster
      reports.forEach((report) => {
        if (typeof report.latitude === "number" && typeof report.longitude === "number") {
          const marker = L.marker([report.latitude, report.longitude], {
            icon: createReportMarkerIcon(report.urgency)
          });

          // Langkah 3b: Pasang tooltip cepat judul laporan saat di-hover
          if (report.title) {
            marker.bindTooltip(report.title, {
              direction: "top",
              offset: [0, -32]
            });
          }

          marker.on("click", () => {
            if (onSelectReport) {
              onSelectReport(report);
            }
          });

          clusterGroup.addLayer(marker);
        }
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    }

    setupCluster();

    return () => {
      isMounted = false;
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, reports, onSelectReport]);

  return null;
}

// Komponen marker lokasi pengguna
function UserLocationMarker({ userLocation, tooltipText }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!userLocation) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const { latitude, longitude } = userLocation;
    if (typeof latitude !== "number" || typeof longitude !== "number") return;

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], {
        icon: createUserMarkerIcon(),
        zIndexOffset: 1000
      });
      if (tooltipText) {
        marker.bindTooltip(tooltipText, { permanent: false, direction: "top" });
      }
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map, userLocation, tooltipText]);

  return null;
}

export function PublicReportMap({
  reports = [],
  selectedReport = null,
  onSelectReport = () => { },
  filterKey = "",
  isFilterActive = false
}) {
  const { t } = useLanguage();
  const { coordinates: userLocation, loading: isLocating, getCurrentLocation } = useGeolocation();
  const [locateError, setLocateError] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Langkah 1: Siapkan teks antarmuka dari id.json dengan fallback teks bahasa Indonesia yang aman
  const resetIndonesiaLabel = (!t("map.resetIndonesia") || t("map.resetIndonesia") === "map.resetIndonesia")
    ? "Seluruh Indonesia"
    : t("map.resetIndonesia");

  const resetIndonesiaTitle = (!t("map.resetIndonesiaTitle") || t("map.resetIndonesiaTitle") === "map.resetIndonesiaTitle")
    ? "Kembalikan tampilan peta ke seluruh wilayah Indonesia"
    : t("map.resetIndonesiaTitle");

  const locateMeLabel = (!t("map.locateMe") || t("map.locateMe") === "map.locateMe")
    ? "Lokasi Saya"
    : t("map.locateMe");

  const locatingLabel = (!t("map.locating") || t("map.locating") === "map.locating")
    ? "Mencari Lokasi..."
    : t("map.locating");

  const locateTitle = (!t("map.locateTitle") || t("map.locateTitle") === "map.locateTitle")
    ? "Tampilkan & pusatkan ke lokasi saya saat ini"
    : t("map.locateTitle");

  const myLocationTooltip = (!t("map.myLocation") || t("map.myLocation") === "map.myLocation")
    ? "Lokasi Anda Saat Ini"
    : t("map.myLocation");

  // Langkah 2: Fungsi untuk mereset tampilan kamera peta kembali ke seluruh Indonesia
  const handleResetToIndonesia = () => {
    if (onSelectReport && selectedReport) {
      onSelectReport(null);
    }
    setResetTrigger((prev) => prev + 1);
  };

  // Langkah 3: Fungsi untuk meminta GPS dan memusatkan peta ke posisi warga saat tombol ditekan
  const handleLocateMe = async () => {
    try {
      setLocateError(null);
      await getCurrentLocation();
    } catch (err) {
      console.error("Gagal mendeteksi lokasi pengguna:", err);
      const errorMsg = (!t("map.locateError") || t("map.locateError") === "map.locateError")
        ? "Izin lokasi tidak diberikan atau GPS tidak aktif."
        : t("map.locateError");
      setLocateError(errorMsg);
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden rounded-lg border border-[#D4D4D4] bg-[#F5F5F5]">
      {/* Tombol Aksi Kontrol Peta: Seluruh Indonesia & Lokasi Saya (FAB Bulat di Mobile, Kapsul di Desktop) */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end gap-2.5">
        {/* Tombol Reset Kamera ke Seluruh Indonesia */}
        <button
          type="button"
          onClick={handleResetToIndonesia}
          className="w-11 h-11 sm:w-auto p-0 sm:px-3 sm:py-2 rounded-full sm:rounded-md flex items-center justify-center sm:gap-2 bg-[#0A0A0A] hover:bg-[#171717] text-white text-sm font-medium shadow-lg border border-[#D4D4D4] transition-colors cursor-pointer"
          title={resetIndonesiaTitle}
          aria-label={resetIndonesiaLabel}
        >
          <Globe className="w-5 h-5 sm:w-4 sm:h-4 text-[#DC2626]" />
          <span className="hidden sm:inline">{resetIndonesiaLabel}</span>
        </button>

        {/* Tombol Aksi Langsung: Pusatkan ke Lokasi Saya */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-11 h-11 sm:w-auto p-0 sm:px-3 sm:py-2 rounded-full sm:rounded-md flex items-center justify-center sm:gap-2 bg-[#0A0A0A] hover:bg-[#171717] text-white text-sm font-medium shadow-lg border border-[#D4D4D4] transition-colors disabled:opacity-50 cursor-pointer"
          title={locateTitle}
          aria-label={locateMeLabel}
        >
          <Locate className={`w-5 h-5 sm:w-4 sm:h-4 text-[#DC2626] ${isLocating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isLocating ? locatingLabel : locateMeLabel}</span>
        </button>

        {/* Notifikasi info koordinat pengguna langsung */}
        {userLocation && (
          <div className="bg-[#0A0A0A] text-white text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-md border border-[#D4D4D4] flex items-center gap-1.5 max-w-[190px] sm:max-w-none truncate">
            <Navigation className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
            <span className="truncate">
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </span>
          </div>
        )}

        {locateError && (
          <div className="bg-[#DC2626] text-white text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-md max-w-[200px] text-right">
            {locateError}
          </div>
        )}
      </div>

      {/* Widget Legenda Simbol Peta (Pojok Kiri Bawah, Adaptif Mobile) */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col items-start gap-1">
        {isLegendOpen ? (
          <div className="bg-[#0A0A0A]/95 text-white p-3 rounded-lg shadow-xl border border-[#D4D4D4] text-xs backdrop-blur-sm max-w-[230px] sm:max-w-[260px]">
            <div className="flex items-center justify-between gap-3 border-b border-[#525252] pb-1.5 mb-2 font-bold text-sm">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#DC2626]" />
                <span>{t("map.legendTitle", "Legenda Peta")}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLegendOpen(false)}
                className="text-[#D4D4D4] hover:text-white p-0.5 rounded cursor-pointer"
                title={t("common.close", "Tutup")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] border border-white animate-pulse shrink-0"></span>
                <span>{t("map.legendEmergency", "Darurat (Tindakan Segera)")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C] border border-white shrink-0"></span>
                <span>{t("map.legendHigh", "Urgensi Tinggi")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0A0A0A] border border-white shrink-0"></span>
                <span>{t("map.legendNormal", "Urgensi Normal")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0A0A0A] border border-[#DC2626] text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  5
                </span>
                <span>{t("map.legendCluster", "Kluster Laporan")}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLegendOpen(true)}
            className="w-11 h-11 sm:w-auto p-0 sm:px-3 sm:py-2 rounded-full sm:rounded-md flex items-center justify-center sm:gap-1.5 bg-[#0A0A0A] hover:bg-[#171717] text-white text-xs font-semibold shadow-lg border border-[#D4D4D4] transition-colors cursor-pointer"
            title={t("map.legendTitle", "Legenda Peta")}
            aria-label={t("map.legendTitle", "Legenda Peta")}
          >
            <Info className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">{t("map.legendTitle", "Legenda Peta")}</span>
          </button>
        )}
      </div>

      {/* Kontainer Utama Peta Leaflet */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={18}
        maxBounds={INDONESIA_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full min-h-0"
      >
        <TileLayer
          minZoom={5}
          maxZoom={18}
          bounds={INDONESIA_MAX_BOUNDS}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedReport={selectedReport}
          userLocation={userLocation}
          resetTrigger={resetTrigger}
          reports={reports}
          filterKey={filterKey}
          isFilterActive={isFilterActive}
        />
        <MarkerClusterLayer reports={reports} onSelectReport={onSelectReport} />
        <UserLocationMarker userLocation={userLocation} tooltipText={myLocationTooltip} />
      </MapContainer>
    </div>
  );
}

export default PublicReportMap;
