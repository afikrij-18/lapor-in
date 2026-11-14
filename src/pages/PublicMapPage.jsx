// Halaman Peta Publik Lapor.in (PRD bagian 3, 6.3 & 7.1).
// Menampilkan sebaran laporan warga terverifikasi pada peta interaktif dengan filter dan panel rincian.

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Tag,
  Trash2,
  Wrench,
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

// Langkah pembantu: Mendapatkan komponen ikon representatif untuk setiap kategori laporan resmi
const getCategoryIcon = (category) => {
  switch (category) {
    case "Infrastruktur":
      return Wrench;
    case "Kebersihan":
      return Trash2;
    case "Keamanan":
      return ShieldAlert;
    case "Fasilitas Umum":
      return Building2;
    default:
      return Tag;
  }
};

function PublicMapPage() {
  const { t } = useLanguage();

  // State data laporan publik dan status pemuatan
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State filter interaktif & pencarian
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // State laporan yang sedang dipilih untuk ditinjau di panel samping
  const [selectedReport, setSelectedReport] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fungsi menyalin kode tiket pelacakan ke clipboard dengan umpan balik visual
  const handleCopyTicket = async (ticketCode) => {
    if (!ticketCode) return;
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin kode tiket:", err);
    }
  };

  // Langkah 1: Ambil data laporan publik dari Firestore saat halaman dimuat
  useEffect(() => {
    let isMounted = true;

    async function loadInitialReports() {
      try {
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

    loadInitialReports();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fungsi untuk menyegarkan data laporan dari Firestore secara manual
  const handleRefreshReports = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await listPublicReports();
      setReports(data || []);
    } catch (err) {
      console.error("Error pada PublicMapPage saat memuat ulang laporan:", err);
      setError(err.code || "UNKNOWN_ERROR");
    } finally {
      setRefreshing(false);
    }
  };

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

  // Langkah 4: Filter data laporan berdasarkan pilihan kategori, urgensi, status, dan kata kunci pencarian
  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const matchCategory =
        selectedCategory === "ALL" || report.category === selectedCategory;
      const matchUrgency =
        selectedUrgency === "ALL" || report.urgency === selectedUrgency;
      const matchStatus =
        selectedStatus === "ALL" || report.status === selectedStatus;

      const matchSearch =
        !query ||
        (report.title && report.title.toLowerCase().includes(query)) ||
        (report.address && report.address.toLowerCase().includes(query)) ||
        (report.ticketCode && report.ticketCode.toLowerCase().includes(query)) ||
        (report.summary && report.summary.toLowerCase().includes(query));

      return matchCategory && matchUrgency && matchStatus && matchSearch;
    });
  }, [reports, selectedCategory, selectedUrgency, selectedStatus, searchQuery]);

  // Indikator apakah ada filter aktif yang diterapkan (termasuk kata kunci pencarian)
  const isFilterActive =
    selectedCategory !== "ALL" ||
    selectedUrgency !== "ALL" ||
    selectedStatus !== "ALL" ||
    searchQuery.trim().length > 0;

  // Indikator jumlah filter aktif (kategori, urgensi, status) untuk badge mobile
  const activeFiltersCount =
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedUrgency !== "ALL" ? 1 : 0) +
    (selectedStatus !== "ALL" ? 1 : 0);

  // Fungsi untuk mereset seluruh filter kembali ke kondisi awal
  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSelectedUrgency("ALL");
    setSelectedStatus("ALL");
    setSearchQuery("");
    setSelectedReport(null);
  };

  // Format tanggal dan jam pembuatan laporan secara ramah pengguna
  const formatReportDate = (timestamp) => {
    if (!timestamp) return null;
    let dateObj;
    if (typeof timestamp.toDate === "function") {
      dateObj = timestamp.toDate();
    } else if (timestamp.seconds) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else {
      dateObj = new Date(timestamp);
    }
    if (isNaN(dateObj.getTime())) return null;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(dateObj);
  };

  return (
    <main className="flex flex-col bg-[#FFFFFF] text-[#0A0A0A]">
      {/* Header Halaman Peta */}
      <header className="border-b border-[#D4D4D4] bg-[#0A0A0A] text-[#FFFFFF] px-3.5 py-2.5 sm:px-6 sm:py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to="/"
              className="p-1.5 rounded-md hover:bg-[#171717] transition-colors text-white shrink-0"
              title={t("common.back")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2 truncate">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626] shrink-0" />
                <span className="sm:hidden">{t("map.mapShortTitle", "Peta Laporan")}</span>
                <span className="hidden sm:inline">{t("map.title")}</span>
              </h1>
            </div>
          </div>

          <Link
            to="/chat"
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold rounded-md shadow transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="sm:hidden">{t("map.newReportShort", "Lapor")}</span>
            <span className="hidden sm:inline">{t("nav.newReport")}</span>
          </Link>
        </div>
      </header>

      {/* Kontainer Khusus Filter dan Peta: Berukuran h-screen Penuh */}
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Baris Filter Interaktif & Pencarian (Single-Row di Desktop, 2-Row di Mobile) */}
        <section className="bg-[#FFFFFF] border-b border-[#D4D4D4] px-3.5 py-2 sm:px-6 sm:py-2.5 shrink-0 shadow-xs">
          <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
            {/* Sisi Kiri: Kolom Pencarian + Tombol Mobile Filter & Refresh */}
            <div className="flex items-center justify-between gap-2 flex-1 lg:max-w-md xl:max-w-lg">
              {/* Kolom Pencarian Kata Kunci / Lokasi / Kode Tiket */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#525252] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedReport(null);
                  }}
                  placeholder={t("map.searchPlaceholder", "Cari kata kunci, lokasi, kode tiket...")}
                  className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-[#F5F5F5] hover:bg-[#EAEAEA] focus:bg-white border border-[#D4D4D4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A] placeholder:text-[#525252] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedReport(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#525252] hover:text-[#0A0A0A] cursor-pointer"
                    title={t("map.clearSearch", "Hapus pencarian")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tombol Filter Lanjutan Khusus Mobile & Tablet (Layar < lg) */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden relative p-2 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] text-[#0A0A0A] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={t("map.moreFilters", "Filter Lanjutan")}
                aria-label={t("map.moreFilters", "Filter Lanjutan")}
              >
                <SlidersHorizontal className="w-4 h-4 text-[#DC2626]" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Tombol Segarkan Data Khusus Mobile & Tablet (Layar < lg) */}
              <button
                type="button"
                onClick={handleRefreshReports}
                disabled={loading || refreshing}
                className="lg:hidden p-2 text-[#525252] hover:text-[#0A0A0A] bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title={t("map.refreshReports", "Segarkan data laporan")}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#DC2626]" : ""}`} />
              </button>
            </div>

            {/* Chip Kategori Horizontal Khusus Layar Mobile & Tablet (Layar < lg) */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold whitespace-nowrap">
              {/* Chip Semua Kategori */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedReport(null);
                }}
                className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === "ALL"
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs"
                    : "bg-[#F5F5F5] text-[#525252] border-[#D4D4D4] hover:bg-[#E5E5E5]"
                }`}
              >
                <span>{t("map.allCategories", "Semua")}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === "ALL"
                      ? "bg-white/20 text-white"
                      : "bg-[#E5E5E5] text-[#0A0A0A]"
                  }`}
                >
                  {reports.length}
                </span>
              </button>

              {/* Chip Tiap Kategori Resmi */}
              {REPORT_CATEGORIES.map((cat) => {
                const CatIcon = getCategoryIcon(cat);
                const isCatActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedReport(null);
                    }}
                    className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isCatActive
                        ? "bg-[#DC2626] text-white border-[#DC2626] shadow-xs"
                        : "bg-[#F5F5F5] text-[#0A0A0A] border-[#D4D4D4] hover:bg-[#E5E5E5]"
                    }`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${isCatActive ? "text-white" : "text-[#DC2626]"}`} />
                    <span>{cat}</span>
                  </button>
                );
              })}

              {/* Chip Reset Filter di Mobile jika ada filter aktif */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title={t("map.resetFilter", "Reset Filter")}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t("map.resetFilter", "Reset")}</span>
                </button>
              )}
            </div>

            {/* Sisi Kanan Desktop (Hanya muncul di layar lg ke atas): Kategori, Urgensi, Status Tanpa Ikon Pembuka + Reset, Refresh & Counter */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {/* Filter Kategori Desktop (Tanpa Ikon Pembuka di Kiri) */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedReport(null);
                  }}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A] cursor-pointer transition-colors"
                >
                  <option value="ALL">{t("map.filterCategory")}</option>
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#525252] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Urgensi Desktop (Tanpa Ikon Pembuka di Kiri) */}
              <div className="relative">
                <select
                  value={selectedUrgency}
                  onChange={(e) => {
                    setSelectedUrgency(e.target.value);
                    setSelectedReport(null);
                  }}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A] cursor-pointer transition-colors"
                >
                  <option value="ALL">{t("map.filterUrgency")}</option>
                  {Object.entries(URGENCY_LEVELS).map(([key, val]) => (
                    <option key={key} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#525252] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Status Desktop (Tanpa Ikon Pembuka di Kiri) */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setSelectedReport(null);
                  }}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626] text-[#0A0A0A] cursor-pointer transition-colors"
                >
                  <option value="ALL">{t("map.filterStatus")}</option>
                  <option value={REPORT_STATUS.VERIFIED}>{t("status.verified")}</option>
                  <option value={REPORT_STATUS.IN_PROGRESS}>{t("status.in_progress")}</option>
                  <option value={REPORT_STATUS.RESOLVED}>{t("status.resolved")}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#525252] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Tombol Reset Filter Cepat Desktop */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626] rounded-lg transition-colors cursor-pointer"
                  title={t("map.resetFilter", "Reset Filter")}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("map.resetFilter", "Reset")}</span>
                </button>
              )}

              {/* Tombol Segarkan Data Desktop */}
              <button
                type="button"
                onClick={handleRefreshReports}
                disabled={loading || refreshing}
                className="p-2 text-[#525252] hover:text-[#0A0A0A] bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#D4D4D4] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title={t("map.refreshReports", "Segarkan data laporan")}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#DC2626]" : ""}`} />
              </button>

              {/* Badge Counter Total Laporan Ditampilkan Desktop */}
              <div className="flex items-center gap-1.5 bg-[#0A0A0A] text-white text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-xs whitespace-nowrap">
                <span className="font-bold text-[#DC2626] font-mono">{filteredReports.length}</span>
                <span>{t("map.reportsCount", "Laporan")}</span>
              </div>
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

          {/* Notifikasi Mengambang Jika Hasil Filter Kosong (Zero Dead-End Policy) */}
          {!loading && !error && filteredReports.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-[#0A0A0A]/95 text-white px-4 py-2.5 rounded-lg shadow-xl border border-[#D4D4D4] flex items-center gap-3 max-w-md text-sm backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span className="text-xs sm:text-sm">
                {t("map.noReportsFound", "Tidak ada laporan yang sesuai dengan filter yang dipilih.")}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                {t("map.resetFilter", "Reset Filter")}
              </button>
            </div>
          )}

          <PublicReportMap
            reports={filteredReports}
            selectedReport={selectedReport}
            onSelectReport={(rep) => setSelectedReport(rep)}
            filterKey={`${selectedCategory}-${selectedUrgency}-${selectedStatus}-${searchQuery.trim()}`}
            isFilterActive={isFilterActive}
          />

          {/* Backdrop gelap tipis di layar mobile saat detail terbuka */}
          {selectedReport && (
            <div
              className="sm:hidden fixed inset-0 bg-black/40 z-[1001] backdrop-blur-[2px]"
              onClick={() => setSelectedReport(null)}
            />
          )}

          {/* Panel Rincian Laporan Terpilih (Bottom Sheet di Mobile, Floating Overlay di Desktop) */}
          {selectedReport && (
            <div className="fixed sm:absolute bottom-0 inset-x-0 sm:bottom-auto sm:inset-x-auto sm:top-4 sm:right-4 z-[1002] sm:z-[1001] w-full sm:max-w-md max-h-[82vh] sm:max-h-[calc(100%-32px)] rounded-t-2xl sm:rounded-xl border-t sm:border border-[#D4D4D4] shadow-2xl bg-[#FFFFFF] p-4 sm:p-5 flex flex-col overflow-y-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-right-6 duration-200">
              {/* Pegangan laci (drag handle pill) untuk layar sentuh ponsel */}
              <div className="sm:hidden w-12 h-1.5 bg-[#D4D4D4] rounded-full mx-auto -mt-1 mb-3 shrink-0" />

              <div className="flex flex-col gap-4">
                {/* Baris Judul, Kode Tiket, Waktu Pembuatan & Tombol Tutup Panel */}
                <div className="flex items-start justify-between border-b border-[#D4D4D4] pb-3">
                  <div className="flex-1 mr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#D4D4D4]">
                          {selectedReport.ticketCode || "LPR-OFFICIAL"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTicket(selectedReport.ticketCode || "LPR-OFFICIAL")}
                          className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded transition-colors cursor-pointer border border-transparent hover:border-[#D4D4D4]"
                          title={t("map.copyTicket", "Salin Kode")}
                        >
                          {copiedTicket ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#15803D]" />
                              <span className="text-[#15803D] font-bold">{t("map.ticketCopied", "Tersalin!")}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t("map.copyTicket", "Salin")}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {formatReportDate(selectedReport.createdAt) && (
                        <span className="text-xs text-[#525252] flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                          <span>{formatReportDate(selectedReport.createdAt)}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-[#0A0A0A] mt-2 leading-snug">
                      {selectedReport.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-md text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] cursor-pointer shrink-0"
                    title={t("common.close")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badges: Urgensi & Status Berwarna Semantik */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      selectedReport.urgency === URGENCY_LEVELS.EMERGENCY
                        ? "bg-[#DC2626] text-white"
                        : selectedReport.urgency === URGENCY_LEVELS.HIGH
                        ? "bg-[#EA580C] text-white"
                        : "bg-[#171717] text-white"
                    }`}
                  >
                    {selectedReport.urgency}
                  </span>

                  {selectedReport.status === REPORT_STATUS.RESOLVED ? (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span>{t(`status.${selectedReport.status}`) || selectedReport.status}</span>
                    </span>
                  ) : selectedReport.status === REPORT_STATUS.IN_PROGRESS ? (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{t(`status.${selectedReport.status}`) || selectedReport.status}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>{t(`status.${selectedReport.status}`) || selectedReport.status}</span>
                    </span>
                  )}

                  {/* Badge Kategori dengan Ikon Representatif */}
                  {(() => {
                    const CategoryIcon = getCategoryIcon(selectedReport.category);
                    return (
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#F5F5F5] text-[#0A0A0A] border border-[#D4D4D4] flex items-center gap-1.5 shadow-sm">
                        <CategoryIcon className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>{selectedReport.category}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Rincian Alamat & Tombol Navigasi Google Maps */}
                <div className="flex flex-col gap-2 bg-[#F5F5F5] p-3 rounded-lg border border-[#D4D4D4]">
                  <div className="flex items-start gap-2 text-sm text-[#0A0A0A]">
                    <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold block">{t("report.location")}:</span>
                      <p className="text-xs text-[#525252] mt-0.5 leading-relaxed">
                        {selectedReport.address || t("report.locationEmpty")}
                      </p>
                    </div>
                  </div>

                  {typeof selectedReport.latitude === "number" && typeof selectedReport.longitude === "number" && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#D4D4D4] mt-1 flex-wrap gap-2">
                      <span className="text-[11px] font-mono text-[#525252]">
                        {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.latitude},${selectedReport.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline"
                        title={t("map.openInMaps", "Buka di Google Maps")}
                      >
                        <span>{t("map.openInMaps", "Buka di Google Maps")}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
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

                {/* Foto Bukti Laporan dengan Fitur Klik untuk Memperbesar (Lightbox) */}
                {selectedReport.hasPhoto && (
                  <div>
                    <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#DC2626]" />
                      {t("report.photo")}
                    </span>

                    <div className="w-full h-48 bg-[#F5F5F5] rounded-md border border-[#D4D4D4] overflow-hidden flex items-center justify-center relative group">
                      {loadingPhoto ? (
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-[#525252] mt-1">{t("common.loading")}</span>
                        </div>
                      ) : photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="w-full h-full relative cursor-zoom-in group/btn focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-inset"
                          title={t("map.clickToEnlarge", "Klik untuk memperbesar foto")}
                        >
                          <img
                            src={photoUrl}
                            alt={selectedReport.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/btn:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                            <Maximize2 className="w-4 h-4" />
                            <span>{t("map.clickToEnlarge", "Perbesar Foto")}</span>
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-[#525252]">{t("report.photoEmpty")}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialog Modal Pratinjau Foto Layar Penuh (Lightbox) */}
          {isLightboxOpen && photoUrl && (
            <div
              className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div
                className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between pb-2 text-white/90">
                  <span className="text-sm font-semibold truncate max-w-[80vw]">
                    {selectedReport?.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-4"
                    title={t("map.closePreview", "Tutup Pratinjau Foto")}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <img
                  src={photoUrl}
                  alt={selectedReport?.title || "Foto Laporan"}
                  className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                />
              </div>
            </div>
          )}

          {/* Modal Filter Lanjutan Khusus Mobile & Tablet (Bottom Sheet) */}
          {isMobileFilterOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-[2000] backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              <div
                className="bg-white rounded-t-2xl p-5 shadow-2xl border-t border-[#D4D4D4] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pegangan Laci & Header */}
                <div className="w-12 h-1.5 bg-[#D4D4D4] rounded-full mx-auto -mt-1 mb-4" />
                <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#DC2626]" />
                    <h3 className="font-bold text-[#0A0A0A] text-base">{t("map.moreFilters", "Filter Lanjutan")}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-md text-[#525252] hover:text-[#0A0A0A] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Pilihan Kategori */}
                  <div>
                    <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
                      {t("report.category")}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("ALL")}
                        className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                          selectedCategory === "ALL"
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : "bg-[#F5F5F5] text-[#525252] border-[#D4D4D4]"
                        }`}
                      >
                        {t("map.filterCategory", "Semua Kategori")}
                      </button>
                      {REPORT_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                            selectedCategory === cat
                              ? "bg-[#DC2626] text-white border-[#DC2626]"
                              : "bg-[#F5F5F5] text-[#0A0A0A] border-[#D4D4D4]"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pilihan Tingkat Urgensi */}
                  <div>
                    <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
                      {t("report.urgency")}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUrgency("ALL")}
                        className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                          selectedUrgency === "ALL"
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : "bg-[#F5F5F5] text-[#525252] border-[#D4D4D4]"
                        }`}
                      >
                        {t("map.filterUrgency", "Semua Urgensi")}
                      </button>
                      {Object.entries(URGENCY_LEVELS).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedUrgency(val)}
                          className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                            selectedUrgency === val
                              ? val === URGENCY_LEVELS.EMERGENCY
                                ? "bg-[#DC2626] text-white border-[#DC2626]"
                                : val === URGENCY_LEVELS.HIGH
                                ? "bg-[#EA580C] text-white border-[#EA580C]"
                                : "bg-[#171717] text-white border-[#171717]"
                              : "bg-[#F5F5F5] text-[#0A0A0A] border-[#D4D4D4]"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pilihan Status Penanganan */}
                  <div>
                    <span className="text-xs font-bold text-[#525252] uppercase tracking-wider block mb-2">
                      {t("report.status")}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStatus("ALL")}
                        className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                          selectedStatus === "ALL"
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : "bg-[#F5F5F5] text-[#525252] border-[#D4D4D4]"
                        }`}
                      >
                        {t("map.filterStatus", "Semua Status")}
                      </button>
                      {[
                        { status: REPORT_STATUS.VERIFIED, label: t("status.verified") },
                        { status: REPORT_STATUS.IN_PROGRESS, label: t("status.in_progress") },
                        { status: REPORT_STATUS.RESOLVED, label: t("status.resolved") }
                      ].map(({ status, label }) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setSelectedStatus(status)}
                          className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                            selectedStatus === status
                              ? "bg-[#DC2626] text-white border-[#DC2626]"
                              : "bg-[#F5F5F5] text-[#0A0A0A] border-[#D4D4D4]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Aksi: Terapkan & Reset */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#D4D4D4]">
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={() => {
                          handleResetFilters();
                          setIsMobileFilterOpen(false);
                        }}
                        className="flex-1 py-2.5 text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626] rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t("map.resetFilter", "Reset Semua")}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="flex-1 py-2.5 text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{t("map.applyFilter", "Terapkan")}</span>
                    </button>
                  </div>
                </div>
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
