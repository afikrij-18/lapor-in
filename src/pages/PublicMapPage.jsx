// Halaman Peta Publik Lapor.in (PRD bagian 3, 6.3 & 7.1).
// Menampilkan sebaran laporan warga terverifikasi pada peta interaktif dengan filter dan panel rincian.

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Filter,
  Image as ImageIcon,
  MapPin,
  PlusCircle,
  X
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage.js";
import {
  REPORT_CATEGORIES,
  REPORT_STATUS,
  URGENCY_LEVELS
} from "../config/constants.js";
import { getReportPhotoUrl, listPublicReports } from "../services/reportService.js";
import PublicReportMap from "../components/map/PublicReportMap.jsx";

function PublicMapPage() {
  const { t } = useLanguage();

  // State data laporan publik dan status pemuatan
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State filter interaktif
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // State laporan yang sedang dipilih untuk ditinjau di panel samping
  const [selectedReport, setSelectedReport] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Langkah 1: Ambil data laporan publik dari Firestore melalui service layer
  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);
        const data = await listPublicReports();
        if (isMounted) {
          setReports(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error pada PublicMapPage saat memuat laporan:", err);
        if (isMounted) {
          setError(err.code || "UNKNOWN_ERROR");
          setLoading(false);
        }
      }
    }

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  // Langkah 2: Ambil foto laporan secara aman jika laporan terpilih memiliki hasPhoto === true
  useEffect(() => {
    let currentPhotoUrl = null;

    async function loadPhoto() {
      if (selectedReport && selectedReport.hasPhoto) {
        try {
          setLoadingPhoto(true);
          const url = await getReportPhotoUrl(selectedReport.id);
          currentPhotoUrl = url;
          setPhotoUrl(url);
        } catch (err) {
          console.error("Gagal memuat foto laporan:", err);
          setPhotoUrl(null);
        } finally {
          setLoadingPhoto(false);
        }
      } else {
        setPhotoUrl(null);
      }
    }

    loadPhoto();

    // Langkah 3: Bersihkan memori URL objek saat panel ditutup atau berganti laporan (PRD 7.5)
    return () => {
      if (currentPhotoUrl) {
        URL.revokeObjectURL(currentPhotoUrl);
      }
    };
  }, [selectedReport]);

  // Langkah 4: Filter data laporan berdasarkan pilihan kategori, urgensi, dan status
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchCategory =
        selectedCategory === "ALL" || report.category === selectedCategory;
      const matchUrgency =
        selectedUrgency === "ALL" || report.urgency === selectedUrgency;
      const matchStatus =
        selectedStatus === "ALL" || report.status === selectedStatus;
      return matchCategory && matchUrgency && matchStatus;
    });
  }, [reports, selectedCategory, selectedUrgency, selectedStatus]);

  return (
    <main className="flex flex-col bg-[#FFFFFF] text-[#0A0A0A]">
      {/* Header Halaman Peta */}
      <header className="border-b border-[#D4D4D4] bg-[#0A0A0A] text-[#FFFFFF] px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-md hover:bg-[#171717] transition-colors text-white"
              title={t("common.back")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#DC2626]" />
                {t("map.title")}
              </h1>
            </div>
          </div>

          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold rounded-md shadow transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("nav.newReport")}</span>
          </Link>
        </div>
      </header>

      {/* Kontainer Khusus Filter dan Peta: Berukuran h-screen Penuh */}
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Baris Filter Interaktif */}
        <section className="bg-[#F5F5F5] border-b border-[#D4D4D4] px-4 py-3 sm:px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
            <Filter className="w-4 h-4 text-[#DC2626]" />
            <span>Filter:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1">
            {/* Filter Kategori */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-[#D4D4D4] rounded-md focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A]"
            >
              <option value="ALL">{t("map.filterCategory")}</option>
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Filter Urgensi */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-[#D4D4D4] rounded-md focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A]"
            >
              <option value="ALL">{t("map.filterUrgency")}</option>
              {Object.entries(URGENCY_LEVELS).map(([key, val]) => (
                <option key={key} value={val}>
                  {val}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-[#D4D4D4] rounded-md focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A]"
            >
              <option value="ALL">{t("map.filterStatus")}</option>
              <option value={REPORT_STATUS.VERIFIED}>{t("status.verified")}</option>
              <option value={REPORT_STATUS.IN_PROGRESS}>{t("status.in_progress")}</option>
              <option value={REPORT_STATUS.RESOLVED}>{t("status.resolved")}</option>
            </select>
          </div>

          <div className="text-xs text-[#525252] font-medium">
            {filteredReports.length} Laporan Ditampilkan
          </div>
        </div>
      </section>

      {/* Konten Utama: Peta Layar Penuh Dinamis dengan Floating Detail Card */}
      <section className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-3 sm:px-6 flex flex-col min-h-0 relative">
        {/* Area Peta Lebar Penuh Dinamis */}
        <div className="relative flex-1 w-full h-full min-h-0 rounded-xl overflow-hidden shadow-sm border border-[#D4D4D4]">
          {loading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
              <div className="w-8 h-8 border-3 border-[#DC2626] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm font-medium text-[#525252]">{t("common.loading")}</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-[#DC2626] mb-2" />
              <p className="text-base font-semibold text-[#0A0A0A]">
                {t(`errors.${error}`) || t("errors.UNKNOWN_ERROR")}
              </p>
            </div>
          ) : null}

          <PublicReportMap
            reports={filteredReports}
            selectedReport={selectedReport}
            onSelectReport={(rep) => setSelectedReport(rep)}
          />

          {/* Panel Rincian Laporan Terpilih (Floating Overlay di atas Peta) */}
          {selectedReport && (
            <div className="absolute top-4 right-4 z-[1001] w-full max-w-sm sm:max-w-md max-h-[calc(100%-32px)] rounded-xl border border-[#D4D4D4] shadow-2xl bg-[#FFFFFF] p-5 flex flex-col overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* Baris Judul & Tombol Tutup Panel */}
                <div className="flex items-start justify-between border-b border-[#D4D4D4] pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#525252] block">
                      {selectedReport.ticketCode || "LPR-OFFICIAL"}
                    </span>
                    <h2 className="text-lg font-bold text-[#0A0A0A] mt-0.5 leading-snug">
                      {selectedReport.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-md text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] cursor-pointer"
                    title={t("common.close")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badges: Urgensi & Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      selectedReport.urgency === URGENCY_LEVELS.EMERGENCY
                        ? "bg-[#DC2626] text-white"
                        : selectedReport.urgency === URGENCY_LEVELS.HIGH
                        ? "bg-[#B91C1C] text-white"
                        : "bg-[#171717] text-white"
                    }`}
                  >
                    {selectedReport.urgency}
                  </span>

                  <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#F5F5F5] border border-[#D4D4D4] text-[#0A0A0A]">
                    {t(`status.${selectedReport.status}`) || selectedReport.status}
                  </span>

                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-[#F5F5F5] text-[#525252]">
                    {selectedReport.category}
                  </span>
                </div>

                {/* Rincian Alamat */}
                <div className="flex items-start gap-2 text-sm text-[#0A0A0A] bg-[#F5F5F5] p-3 rounded-md border border-[#D4D4D4]">
                  <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{t("report.location")}:</span>
                    <p className="text-xs text-[#525252] mt-0.5">
                      {selectedReport.address || t("report.locationEmpty")}
                    </p>
                    {typeof selectedReport.latitude === "number" && (
                      <span className="text-[11px] font-mono text-[#525252] block mt-1">
                        {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ringkasan Masalah */}
                <div>
                  <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-1">
                    {t("report.summary")}
                  </span>
                  <p className="text-sm text-[#0A0A0A] leading-relaxed bg-[#FFFFFF] border border-[#D4D4D4] p-3 rounded-md">
                    {selectedReport.summary}
                  </p>
                </div>

                {/* Foto Bukti Laporan */}
                {selectedReport.hasPhoto && (
                  <div>
                    <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#DC2626]" />
                      {t("report.photo")}
                    </span>

                    <div className="w-full h-48 bg-[#F5F5F5] rounded-md border border-[#D4D4D4] overflow-hidden flex items-center justify-center">
                      {loadingPhoto ? (
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-[#525252] mt-1">{t("common.loading")}</span>
                        </div>
                      ) : photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={selectedReport.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-[#525252]">{t("report.photoEmpty")}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      </div>
    </main>
  );
}

export default PublicMapPage;
