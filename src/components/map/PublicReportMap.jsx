// Komponen peta interaktif publik Leaflet dengan Marker Clustering (PRD bagian 6.3, 7.1, 7.2 & 8.1).
// Mematuhi Zero Emoji Policy (ikon SVG), palet kontras tinggi Hitam-Merah-Putih, dan pelacakan lokasi pengguna.

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Locate, Navigation } from "lucide-react";
import { COLOR_PALETTE, URGENCY_LEVELS } from "../../config/constants.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";

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
    bgColor = COLOR_PALETTE.RED_HOVER;
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
function MapController({ selectedReport, userLocation }) {
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

  return null;
}

// Komponen yang menyesuaikan tampilan awal peta ke sebaran laporan yang ada.
// Tanpa ini peta selalu dibuka menampilkan seluruh Indonesia, walau semua laporan ada di satu kota.
function FitToReports({ reports }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    // Langkah 1: Cukup sekali, saat laporan pertama kali selesai dimuat
    if (hasFittedRef.current) return;

    // Langkah 2: Kumpulkan titik laporan yang punya koordinat
    const points = reports
      .filter((report) => typeof report.latitude === "number" && typeof report.longitude === "number")
      .map((report) => [report.latitude, report.longitude]);
    if (points.length === 0) return;

    // Langkah 3: Arahkan peta ke wilayah yang memuat semua titik itu
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    hasFittedRef.current = true;
  }, [map, reports]);

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
function UserLocationMarker({ userLocation }) {
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
      marker.bindTooltip("Lokasi Anda Saat Ini", { permanent: false, direction: "top" });
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
  }, [map, userLocation]);

  return null;
}

export function PublicReportMap({
  reports = [],
  selectedReport = null,
  onSelectReport = () => { }
}) {
  const { coordinates: userLocation, loading: isLocating, getCurrentLocation } = useGeolocation();
  const [locateError, setLocateError] = useState(null);

  // Fungsi untuk meminta GPS dan memusatkan peta ke posisi warga saat tombol ditekan
  const handleLocateMe = async () => {
    try {
      setLocateError(null);
      await getCurrentLocation();
    } catch (err) {
      console.error("Gagal mendeteksi lokasi pengguna:", err);
      setLocateError("Izin lokasi tidak diberikan atau GPS tidak aktif.");
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden rounded-lg border border-[#D4D4D4] bg-[#F5F5F5]">
      {/* Tombol Aksi Langsung: Pusatkan ke Lokasi Saya */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] hover:bg-[#171717] text-white text-sm font-medium rounded-md shadow-lg border border-[#D4D4D4] transition-colors disabled:opacity-50 cursor-pointer"
          title="Tampilkan & pusatkan ke lokasi saya saat ini"
        >
          <Locate className={`w-4 h-4 text-[#DC2626] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Mencari Lokasi..." : "Lokasi Saya"}</span>
        </button>

        {/* Notifikasi info koordinat pengguna langsung */}
        {userLocation && (
          <div className="bg-[#0A0A0A] text-white text-xs px-3 py-1.5 rounded-md shadow-md border border-[#D4D4D4] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </span>
          </div>
        )}

        {locateError && (
          <div className="bg-[#DC2626] text-white text-xs px-3 py-1.5 rounded-md shadow-md">
            {locateError}
          </div>
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

        <FitToReports reports={reports} />
        <MapController selectedReport={selectedReport} userLocation={userLocation} />
        <MarkerClusterLayer reports={reports} onSelectReport={onSelectReport} />
        <UserLocationMarker userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

export default PublicReportMap;
