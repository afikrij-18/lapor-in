// Route: /admin
// Halaman Dashboard Admin - Lapor.in

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, AlertCircle, FileText, MapPin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';
import { signOutAdmin, onAuthChange, isAdminUser } from '../services/authService.js';
import { listReportsForAdmin, updateReportStatus } from '../services/reportService.js';
import AdminStatsBar from '../components/admin/AdminStatsBar.jsx';
import ReportQueueTable from '../components/admin/ReportQueueTable.jsx';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  
  // State data laporan dan statistik
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, emergency: 0, resolved: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);

  const navigate = useNavigate();
  const { t } = useLanguage();

  // PERBAIKAN: Deklarasikan fetchReports DI ATAS sebelum dipanggil di useEffect
  const fetchReports = async () => {
    setIsLoadingData(true);
    try {
      const data = await listReportsForAdmin();
      
      const activeData = (!data || data.length === 0) ? [
        {
          id: 'dummy-1',
          ticketCode: 'LAPOR-001',
          title: 'Jalan Berlubang Parah di Jl. Sudirman',
          summary: 'Ada lubang besar berdiameter 1 meter yang membahayakan pengendara motor.',
          urgency: 'Darurat',
          status: 'pending',
          isValidReport: true
        },
        {
          id: 'dummy-2',
          ticketCode: 'LAPOR-002',
          title: 'Lampu Penerangan Jalan Mati',
          summary: 'Lampu jalan mati total di sekitar area taman kota, rawan tindak kejahatan.',
          urgency: 'Tinggi',
          status: 'pending',
          isValidReport: true
        }
      ] : data;

      setReports(activeData);

      // Hitung statistik ringkas
      const total = activeData.length;
      const pending = activeData.filter(r => !r.status || r.status === 'pending').length;
      const emergency = activeData.filter(r => (r.urgency === 'Darurat' || r.urgency === 'DARURAT') && (!r.status || r.status === 'pending')).length;
      const resolved = activeData.filter(r => r.status === 'resolved').length;

      setStats({ total, pending, emergency, resolved });
    } catch (error) {
      console.error('Gagal memuat laporan admin:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Langkah 1: Proteksi rute admin (Diletakkan DI BAWAH deklarasi fetchReports)
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user || !isAdminUser(user)) {
        navigate('/admin/login', { replace: true });
      } else {
        setAdminUser(user);
        setIsLoadingAuth(false);
        fetchReports(); // Aman dipanggil karena sudah dideklarasikan di atas
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fungsi umum untuk memperbarui status laporan (Terima, Tolak, Proses, Selesai)
  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await updateReportStatus(reportId, newStatus);
      fetchReports(); // Refresh data setelah status berubah
    } catch (error) {
      console.error('Gagal memperbarui status laporan:', error);
    }
  };

  // Tangani proses keluar (logout)
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
      <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex items-center justify-center">
        <p className="text-[#525252]">Memeriksa hak akses admin...</p>
      </div>
    );
  }

  const pendingQueue = reports.filter(r => !r.status || r.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col">
      {/* Header Admin */}
      <header className="bg-[#171717] border-b border-[#D4D4D4]/30 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#DC2626] rounded-lg flex items-center justify-center text-[#FFFFFF] shadow-md shadow-red-900/20">
            <ShieldCheck size={22} />
          </div>
          <span className="font-bold tracking-wider text-lg">LAPOR.IN ADMIN</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-[#D4D4D4] hidden sm:inline">
            {adminUser?.email || 'admin@laporin.id'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-[#FFFFFF] rounded-lg text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer"
          >
            <LogOut size={16} />
            <span>{t('nav.logout') || 'Keluar'}</span>
          </button>
        </div>
      </header>

      {/* Konten Utama Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          {t('admin.dashboardTitle') || 'Dashboard Admin'}
        </h1>

        {/* Baris Statistik Cepat */}
        <AdminStatsBar stats={stats} />

        {/* Tab Navigasi */}
        <div className="flex border-b border-[#D4D4D4]/30 mb-6 space-x-2 sm:space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-4 font-medium text-sm sm:text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'queue'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#525252] hover:text-[#FFFFFF]'
            }`}
          >
            <AlertCircle size={18} />
            <span>{t('admin.tabQueue') || 'Antrean Verifikasi'} ({pendingQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-medium text-sm sm:text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#525252] hover:text-[#FFFFFF]'
            }`}
          >
            <FileText size={18} />
            <span>{t('admin.tabAll') || 'Semua Laporan'}</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 px-4 font-medium text-sm sm:text-base border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'map'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#525252] hover:text-[#FFFFFF]'
            }`}
          >
            <MapPin size={18} />
            <span>{t('admin.tabMap') || 'Peta Sebaran'}</span>
          </button>
        </div>

        {/* Area Konten Dinamis Berdasarkan Tab */}
        <div className="bg-[#171717] border border-[#D4D4D4]/30 rounded-xl p-6 shadow-xl transition-all duration-300">
          {isLoadingData ? (
            <div className="text-center py-12 text-[#525252]">Memuat data laporan...</div>
          ) : (
            <>
              {activeTab === 'queue' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Antrean Laporan Masuk</h2>
                  <ReportQueueTable
                    reports={pendingQueue}
                    onUpdateStatus={handleStatusChange}
                  />
                </div>
              )}
              {activeTab === 'all' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Semua Laporan Warga</h2>
                  <ReportQueueTable
                    reports={reports}
                    onUpdateStatus={handleStatusChange}
                  />
                </div>
              )}
              {activeTab === 'map' && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Peta Sebaran Laporan Admin</h2>
                  <p className="text-sm text-[#525252]">Peta interaktif Leaflet untuk pemantauan sebaran masalah.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;