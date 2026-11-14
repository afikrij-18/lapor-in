// Route: /admin
// Halaman Dashboard Admin - Lapor.in (Lengkap dengan Filter, Pencarian, Peta Sebaran, & Aksi Langsung)

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  AlertCircle,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  RotateCcw,
  X
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';
import { signOutAdmin, onAuthChange, isAdminUser } from '../services/authService.js';
import { listReportsForAdmin, updateReportStatus, updateReport, deleteReport } from '../services/reportService.js';
import { REPORT_CATEGORIES, URGENCY_LEVELS } from '../config/constants.js';
import AdminStatsBar from '../components/admin/AdminStatsBar.jsx';
import ReportQueueTable from '../components/admin/ReportQueueTable.jsx';
import ReportDetailModal from '../components/admin/ReportDetailModal.jsx';
import RejectReasonModal from '../components/admin/RejectReasonModal.jsx';
import ReportEditModal from '../components/admin/ReportEditModal.jsx';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal.jsx';
import { PublicReportMap } from '../components/map/PublicReportMap.jsx';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, emergency: 0, resolved: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // State untuk pencarian dan penyaringan data antrean
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [activeStatsFilter, setActiveStatsFilter] = useState('all');

  // Ref untuk autofocus input pencarian saat menekan tombol /
  const searchInputRef = useRef(null);

  // State untuk modal detail, tolak, edit, dan modal verifikasi terpadu
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [selectedReportForVerification, setSelectedReportForVerification] = useState(null);
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [selectedReportEdit, setSelectedReportEdit] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  // Langkah 1: Memuat daftar laporan dari Firestore menggunakan service
  const fetchReports = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const data = await listReportsForAdmin();
      const activeData = data || [];

      setReports(activeData);

      // Hitung ringkasan statistik untuk AdminStatsBar
      const total = activeData.length;
      const pending = activeData.filter((r) => !r.status || r.status === 'pending').length;
      const emergency = activeData.filter((r) => r.urgency === 'Darurat' && (!r.status || r.status === 'pending')).length;
      const resolved = activeData.filter((r) => r.status === 'resolved').length;

      setStats({ total, pending, emergency, resolved });
    } catch (error) {
      console.error('Gagal memuat laporan admin:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    } finally {
      setIsLoadingData(false);
    }
  }, [t]);

  // Langkah 2: Pantau perubahan status autentikasi admin
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user || !isAdminUser(user)) {
        navigate('/admin/login', { replace: true });
      } else {
        setAdminUser(user);
        setIsLoadingAuth(false);
        fetchReports();
      }
    });

    return () => unsubscribe();
  }, [navigate, fetchReports]);

  // Langkah 2b: Listener tombol pintasan keyboard '/' untuk fokus ke pencarian
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Langkah 2c: Handler klik kartu statistik sebagai filter cepat (Quick Filter)
  const handleStatsFilterClick = (filterType) => {
    setActiveStatsFilter(filterType);
    if (filterType === 'total') {
      setActiveTab('all');
      setSelectedCategory('ALL');
      setSelectedUrgency('ALL');
      setSearchQuery('');
    } else if (filterType === 'pending') {
      setActiveTab('queue');
      setSelectedCategory('ALL');
      setSelectedUrgency('ALL');
    } else if (filterType === 'emergency') {
      setSelectedUrgency('Darurat');
    } else if (filterType === 'resolved') {
      setActiveTab('all');
    }
  };

  // Langkah 3: Handler perubahan status laporan (verifikasi, proses, selesai, tolak)
  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setErrorMessage(null);
      if (newStatus === 'rejected') {
        setRejectingReportId(reportId);
        return;
      }
      await updateReportStatus(reportId, newStatus);
      fetchReports();
    } catch (error) {
      console.error('Gagal memperbarui status laporan:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    }
  };

  // Langkah 3b: Handler verifikasi dan publikasikan langsung dari Modal Cross-Check
  const handleVerifyAndPublish = async (reportId, fields) => {
    try {
      setErrorMessage(null);
      if (fields && Object.keys(fields).length > 0) {
        await updateReport(reportId, fields);
      }
      await updateReportStatus(reportId, 'verified');
      setSelectedReportForVerification(null);
      setSelectedReportDetail(null);
      fetchReports();
    } catch (error) {
      console.error('Gagal memverifikasi dan mempublikasikan laporan:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    }
  };

  // Langkah 3c: Handler simpan draf saja (status tetap pending)
  const handleSaveDraftOnly = async (reportId, fields) => {
    try {
      setErrorMessage(null);
      if (fields && Object.keys(fields).length > 0) {
        await updateReport(reportId, fields);
      }
      setSelectedReportForVerification(null);
      setSelectedReportDetail(null);
      fetchReports();
    } catch (error) {
      console.error('Gagal menyimpan draf laporan:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    }
  };

  // Langkah 4: Handler konfirmasi alasan penolakan laporan
  const handleConfirmReject = async (reportId, reason) => {
    try {
      setErrorMessage(null);
      await updateReportStatus(reportId, 'rejected', reason);
      setRejectingReportId(null);
      fetchReports();
    } catch (error) {
      console.error('Gagal menolak laporan:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
    }
  };

  // Langkah 5: Handler buka modal konfirmasi hapus laporan
  const handleRequestDelete = (report) => {
    setDeletingReport(report);
  };

  // Langkah 5b: Eksekusi penghapusan laporan setelah dikonfirmasi pada modal
  const handleConfirmDelete = async (reportId) => {
    try {
      setErrorMessage(null);
      await deleteReport(reportId);
      setDeletingReport(null);
      fetchReports();
    } catch (error) {
      console.error('Gagal menghapus laporan:', error);
      const errCode = error?.code || 'UNKNOWN_ERROR';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.UNKNOWN_ERROR'));
      throw error;
    }
  };

  // Langkah 6: Handler logout admin
  const handleLogout = async () => {
    try {
      await signOutAdmin();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Gagal keluar:', error);
    }
  };

  // Langkah 7: Filter data laporan berdasarkan pencarian teks, kategori, dan urgensi
  const filterList = useCallback((list) => {
    return list.filter((r) => {
      // Filter teks pencarian (kode tiket, judul, alamat, ringkasan)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const ticketMatch = (r.ticketCode || '').toLowerCase().includes(query);
        const titleMatch = (r.title || '').toLowerCase().includes(query);
        const addressMatch = (r.address || '').toLowerCase().includes(query);
        const summaryMatch = (r.summary || '').toLowerCase().includes(query);

        if (!ticketMatch && !titleMatch && !addressMatch && !summaryMatch) {
          return false;
        }
      }

      // Filter kategori
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }

      // Filter urgensi
      if (selectedUrgency !== 'ALL' && r.urgency !== selectedUrgency) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedUrgency]);

  // Antrean khusus status pending
  const pendingQueue = useMemo(() => {
    return reports.filter((r) => !r.status || r.status === 'pending');
  }, [reports]);

  // Data hasil filter untuk tab aktif
  const filteredPendingQueue = useMemo(() => filterList(pendingQueue), [filterList, pendingQueue]);
  const filteredAllReports = useMemo(() => filterList(reports), [filterList, reports]);

  const isFilterActive = Boolean(searchQuery.trim() || selectedCategory !== 'ALL' || selectedUrgency !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedUrgency('ALL');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex items-center justify-center text-base">
        <p className="text-[#D4D4D4]">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col text-base">
      {/* Header Panel Admin */}
      <header className="bg-[#171717] border-b border-[#D4D4D4]/30 px-4 sm:px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center text-[#FFFFFF] shadow-md">
            <ShieldCheck size={24} />
          </div>
          <span className="font-bold tracking-wider text-lg">{t('admin.headerTitle')}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm sm:text-base text-[#D4D4D4] hidden sm:inline font-mono">
            {adminUser?.email || 'admin@laporin.id'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-[#FFFFFF] rounded-xl text-sm sm:text-base font-medium transition-all duration-200 shadow-sm cursor-pointer"
          >
            <LogOut size={18} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          {t('admin.dashboardTitle')}
        </h1>

        {/* Bilah Statistik Interaktif (Quick Filter) */}
        <AdminStatsBar
          stats={stats}
          activeFilter={activeStatsFilter}
          onFilterClick={handleStatsFilterClick}
        />

        {/* Navigasi Tab dengan Counter Pill Badges */}
        <div className="flex border-b border-[#D4D4D4]/30 mb-6 space-x-2 sm:space-x-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('queue');
              setActiveStatsFilter('pending');
            }}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${activeTab === 'queue'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
              }`}
          >
            <AlertCircle size={18} />
            <span>{t('admin.tabQueue')}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors ${activeTab === 'queue'
                  ? 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/40'
                  : 'bg-[#262626] text-[#D4D4D4] border-[#D4D4D4]/20'
                }`}
            >
              {pendingQueue.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setActiveStatsFilter('total');
            }}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${activeTab === 'all'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
              }`}
          >
            <FileText size={18} />
            <span>{t('admin.tabAll')}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${activeTab === 'all'
                  ? 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/40'
                  : 'bg-[#262626] text-[#D4D4D4] border-[#D4D4D4]/20'
                }`}
            >
              {reports.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('map');
              setActiveStatsFilter('map');
            }}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${activeTab === 'map'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
              }`}
          >
            <MapPin size={18} />
            <span>{t('admin.tabMap')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#DC2626]/20 border border-[#DC2626] rounded-xl flex items-center justify-between text-base">
            <span className="text-[#FFFFFF]">{errorMessage}</span>
            <button
              type="button"
              onClick={fetchReports}
              className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] rounded-lg text-base font-medium inline-flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>{t('common.retry')}</span>
            </button>
          </div>
        )}

        {/* Toolbar Pencarian & Filter Antrean */}
        <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-4 mb-6 shadow-md">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Input Pencarian dengan Shortcut '/' */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#D4D4D4]">
                <Search size={18} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.filterSearchPlaceholder', null, 'Cari kode tiket, judul, alamat...')}
                className="w-full pl-9 pr-14 py-2 bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-lg text-sm text-[#FFFFFF] placeholder-[#525252] focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center space-x-1.5">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#D4D4D4] hover:text-[#FFFFFF] cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-[#171717] border border-[#D4D4D4]/30 rounded text-[#D4D4D4] pointer-events-none">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Dropdown Kategori */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626] cursor-pointer"
            >
              <option value="ALL">{t('admin.filterAllCategories', null, 'Semua Kategori')}</option>
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Dropdown Urgensi */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-[#0A0A0A] border border-[#D4D4D4]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#DC2626] cursor-pointer"
            >
              <option value="ALL">{t('admin.filterAllUrgencies', null, 'Semua Urgensi')}</option>
              {Object.values(URGENCY_LEVELS).map((urg) => (
                <option key={urg} value={urg}>
                  {urg}
                </option>
              ))}
            </select>

            {/* Tombol Segarkan Data */}
            <button
              type="button"
              onClick={fetchReports}
              disabled={isLoadingData}
              className="px-3 py-2 bg-[#0A0A0A] hover:bg-[#262626] border border-[#D4D4D4]/30 rounded-lg text-sm font-medium inline-flex items-center space-x-1.5 cursor-pointer transition-colors text-[#FFFFFF] disabled:opacity-50"
              title={t('admin.refreshData', null, 'Segarkan Data')}
            >
              <RefreshCw size={14} className={isLoadingData ? "animate-spin text-[#DC2626]" : ""} />
              <span className="hidden sm:inline">{t('admin.refreshData', null, 'Segarkan')}</span>
            </button>

            {/* Tombol Reset Filter */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] border border-[#D4D4D4]/30 rounded-lg text-sm font-medium inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>{t('admin.filterReset', null, 'Reset Filter')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Kontainer Utama Konten Dashboard */}
        <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-300">
          {isLoadingData ? (
            <div className="text-center py-12 text-[#D4D4D4] text-base">{t('common.loading', null, 'Memuat...')}</div>
          ) : (
            <>
              {/* Tab 1: Antrean Verifikasi (Pending) */}
              {activeTab === 'queue' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t('admin.tabQueue', null, 'Antrean Verifikasi')}</h2>
                    <span className="text-xs text-[#D4D4D4] font-mono">
                      {filteredPendingQueue.length} / {pendingQueue.length} {t('admin.reportsCountLabel', null, 'Laporan')}
                    </span>
                  </div>
                  <ReportQueueTable
                    reports={filteredPendingQueue}
                    onVerify={(report) => setSelectedReportForVerification(report)}
                    onUpdateStatus={handleStatusChange}
                    onDetail={(report) => setSelectedReportDetail(report)}
                    onEdit={(report) => setSelectedReportEdit(report)}
                    onDelete={handleRequestDelete}
                  />
                </div>
              )}

              {/* Tab 2: Semua Laporan */}
              {activeTab === 'all' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t('admin.tabAll', null, 'Semua Laporan')}</h2>
                    <span className="text-xs text-[#D4D4D4] font-mono">
                      {filteredAllReports.length} / {reports.length} {t('admin.reportsCountLabel', null, 'Laporan')}
                    </span>
                  </div>
                  <ReportQueueTable
                    reports={filteredAllReports}
                    onVerify={(report) => setSelectedReportForVerification(report)}
                    onUpdateStatus={handleStatusChange}
                    onDetail={(report) => setSelectedReportDetail(report)}
                    onEdit={(report) => setSelectedReportEdit(report)}
                    onDelete={handleRequestDelete}
                  />
                </div>
              )}

              {/* Tab 3: Peta Sebaran Masalah (Integrasi Leaflet Map) */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">{t('admin.mapSectionTitle', null, 'Peta Sebaran Laporan Nasional')}</h2>
                      <p className="text-sm text-[#D4D4D4]">{t('admin.mapSectionDesc', null, 'Klik pada marker atau cluster untuk melihat rincian laporan di wilayah tersebut.')}</p>
                    </div>
                    <div className="text-xs text-[#D4D4D4] font-mono bg-[#0A0A0A] px-3 py-1.5 rounded-lg border border-[#D4D4D4]/20 w-fit">
                      {filteredAllReports.length} {t('admin.reportsCountLabel', null, 'Laporan')}
                    </div>
                  </div>
                  <div className="h-[600px] w-full rounded-xl overflow-hidden border border-[#D4D4D4]/30 shadow-2xl">
                    <PublicReportMap
                      reports={filteredAllReports}
                      onSelectReport={setSelectedReportDetail}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Cross-Check Verifikasi Terpadu & Detail Laporan */}
      {(selectedReportForVerification || selectedReportDetail) && (
        <ReportDetailModal
          report={selectedReportForVerification || selectedReportDetail}
          isVerificationMode={Boolean(selectedReportForVerification)}
          onClose={() => {
            setSelectedReportForVerification(null);
            setSelectedReportDetail(null);
          }}
          onVerifyAndPublish={handleVerifyAndPublish}
          onSaveDraft={handleSaveDraftOnly}
          onUpdateStatus={handleStatusChange}
          onReject={(id, reason) => {
            if (reason) {
              handleConfirmReject(id, reason);
              setSelectedReportForVerification(null);
              setSelectedReportDetail(null);
            } else {
              setRejectingReportId(id);
            }
          }}
        />
      )}

      {/* Modal Alasan Penolakan */}
      {rejectingReportId && (
        <RejectReasonModal
          reportId={rejectingReportId}
          onConfirm={handleConfirmReject}
          onClose={() => setRejectingReportId(null)}
        />
      )}

      {/* Modal Edit Laporan */}
      {selectedReportEdit && (
        <ReportEditModal
          report={selectedReportEdit}
          onClose={() => setSelectedReportEdit(null)}
          onUpdated={fetchReports}
        />
      )}

      {/* Modal Konfirmasi Hapus Laporan Permanen */}
      {deletingReport && (
        <DeleteConfirmModal
          report={deletingReport}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingReport(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboardPage;
