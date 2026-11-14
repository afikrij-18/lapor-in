// Route: /admin
// Halaman Dashboard Admin dengan Pengecekan Admin Role yang Valid

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, AlertCircle, FileText, MapPin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';
import { signOutAdmin, onAuthChange, isAdminUser } from '../services/authService.js';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Langkah 1: Proteksi Route ketat menggunakan onAuthChange dan isAdminUser
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      // Cek apakah user ada DAN benar-benar merupakan admin yang sah
      if (!user || !isAdminUser(user)) {
        // Jika bukan admin (misal sesi anonim warga), tendang ke halaman login
        navigate('/admin/login', { replace: true });
      } else {
        setAdminUser(user);
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Langkah 2: Tangani proses keluar (logout) admin
  const handleLogout = async () => {
    try {
      await signOutAdmin(); // Ini akan mengeluarkan admin dan menggantinya ke sesi anonim warga
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
            <span>{t('admin.tabQueue') || 'Antrean Verifikasi'}</span>
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
          {activeTab === 'queue' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Antrean Laporan Masuk</h2>
              <p className="text-sm text-[#525252]">Tabel antrean verifikasi akan diisi pada commit berikutnya.</p>
            </div>
          )}
          {activeTab === 'all' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Semua Laporan Warga</h2>
              <p className="text-sm text-[#525252]">Daftar seluruh laporan akan ditampilkan di sini.</p>
            </div>
          )}
          {activeTab === 'map' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Peta Sebaran Laporan Admin</h2>
              <p className="text-sm text-[#525252]">Peta interaktif Leaflet untuk pemantauan sebaran masalah.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;