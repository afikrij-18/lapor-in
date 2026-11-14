// Route: /admin
// Halaman Dashboard Admin - Lapor.in (Dengan Detail Modal & Tolak dengan Alasan)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, AlertCircle, FileText, MapPin, RefreshCw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';
import { signOutAdmin, onAuthChange, isAdminUser } from '../services/authService.js';
import { listReportsForAdmin, updateReportStatus } from '../services/reportService.js';
import AdminStatsBar from '../components/admin/AdminStatsBar.jsx';
import ReportQueueTable from '../components/admin/ReportQueueTable.jsx';
import ReportDetailModal from '../components/admin/ReportDetailModal.jsx';
import RejectReasonModal from '../components/admin/RejectReasonModal.jsx';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, emergency: 0, resolved: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // State untuk modal detail laporan
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);

  // State untuk modal alasan penolakan
  const [rejectingReportId, setRejectingReportId] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchReports = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const data = await listReportsForAdmin();
      const activeData = data || [];

      setReports(activeData);

      const total = activeData.length;
      const pending = activeData.filter(r => !r.status || r.status === 'pending').length;
      const emergency = activeData.filter(r => r.urgency === 'Darurat' && (!r.status || r.status === 'pending')).length;
      const resolved = activeData.filter(r => r.status === 'resolved').length;

      setStats({ total, pending, emergency, resolved });
    } catch (error) {
      console.error('Gagal memuat laporan admin:', error);
      const errCode = error?.code || 'default';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.default'));
    } finally {
      setIsLoadingData(false);
    }
  }, [t]);

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

  // Handler update status (termasuk memicu modal penolakan dengan alasan)
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
      const errCode = error?.code || 'default';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.default'));
    }
  };

  // Konfirmasi penolakan dengan alasan dari modal
  const handleConfirmReject = async (reportId, reason) => {
    try {
      setErrorMessage(null);
      await updateReportStatus(reportId, 'rejected', reason);
      setRejectingReportId(null);
      fetchReports();
    } catch (error) {
      console.error('Gagal menolak laporan:', error);
      const errCode = error?.code || 'default';
      setErrorMessage(t(`errors.${errCode}`) !== `errors.${errCode}` ? t(`errors.${errCode}`) : t('errors.default'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAdmin();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Gagal keluar:', error);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex items-center justify-center text-base">
        <p className="text-[#D4D4D4]">{t('common.loading')}</p>
      </div>
    );
  }

  const pendingQueue = reports.filter(r => !r.status || r.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col text-base">
      <header className="bg-[#171717] border-b border-[#D4D4D4]/30 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center text-[#FFFFFF] shadow-md">
            <ShieldCheck size={24} />
          </div>
          <span className="font-bold tracking-wider text-lg">{t('admin.headerTitle')}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-base text-[#D4D4D4] hidden sm:inline">
            {adminUser?.email || 'admin@laporin.id'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-[#FFFFFF] rounded-lg text-base font-medium transition-all duration-200 shadow-sm cursor-pointer"
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

        <AdminStatsBar stats={stats} />

        <div className="flex border-b border-[#D4D4D4]/30 mb-6 space-x-2 sm:space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'queue'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
            }`}
          >
            <AlertCircle size={20} />
            <span>{t('admin.tabQueue')} ({pendingQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
            }`}
          >
            <FileText size={20} />
            <span>{t('admin.tabAll')}</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 px-4 font-medium text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'map'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#D4D4D4] hover:text-[#FFFFFF]'
            }`}
          >
            <MapPin size={20} />
            <span>{t('admin.tabMap')}</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-[#DC2626]/20 border border-[#DC2626] rounded-xl flex items-center justify-between text-base">
            <span className="text-[#FFFFFF]">{errorMessage}</span>
            <button
              onClick={fetchReports}
              className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] rounded-lg text-base font-medium inline-flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>{t('common.retry')}</span>
            </button>
          </div>
        )}

        <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-6 shadow-xl transition-all duration-300">
          {isLoadingData ? (
            <div className="text-center py-12 text-[#D4D4D4] text-base">{t('common.loading')}</div>
          ) : (
            <>
              {activeTab === 'queue' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('admin.tabQueue')}</h2>
                  <ReportQueueTable
                    reports={pendingQueue}
                    onUpdateStatus={handleStatusChange}
                    onDetail={(report) => setSelectedReportDetail(report)}
                  />
                </div>
              )}
              {activeTab === 'all' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('admin.tabAll')}</h2>
                  <ReportQueueTable
                    reports={reports}
                    onUpdateStatus={handleStatusChange}
                    onDetail={(report) => setSelectedReportDetail(report)}
                  />
                </div>
              )}
              {activeTab === 'map' && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">{t('admin.tabMap')}</h2>
                  <p className="text-base text-[#D4D4D4]">Peta interaktif Leaflet untuk pemantauan sebaran masalah.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Detail Laporan */}
      {selectedReportDetail && (
        <ReportDetailModal
          report={selectedReportDetail}
          onClose={() => setSelectedReportDetail(null)}
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
    </div>
  );
}

export default AdminDashboardPage;