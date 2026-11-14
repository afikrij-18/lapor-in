// Route: /admin/login
// Kerangka Halaman Login Admin - Lapor.in (Polished UI)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';

function AdminLoginPage() {
  // Langkah 1: Inisialisasi state form login, router, dan lokalisasi
  const [email, setEmail] = useState('admin@laporin.id');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Langkah 2: Tangani submit form login (simulasi sementara untuk Commit 1)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Simulasi navigasi ke dashboard (akan disambungkan ke authService di commit berikutnya)
      navigate('/admin');
    } catch (error) {
      console.error('Error pada AdminLoginPage:', error);
      setErrorMessage(t('errors.INVALID_CREDENTIALS') || 'Email atau kata sandi salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#171717] border border-[#D4D4D4] rounded-xl p-8 shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#DC2626] flex items-center justify-center text-[#FFFFFF] mb-3 shadow-lg shadow-red-900/30">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
            {t('admin.loginTitle') || 'Masuk Admin'}
          </h1>
          <p className="text-sm text-[#525252] mt-1">Akses khusus moderator berwenang</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-sm rounded-lg animate-shake">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF] mb-1.5">
              {t('admin.email') || 'Email'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#525252]">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-[#D4D4D4] rounded-lg text-[#FFFFFF] placeholder-[#525252] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-200"
                placeholder="admin@laporin.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#FFFFFF] mb-1.5">
              {t('admin.password') || 'Kata Sandi'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#525252]">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-[#D4D4D4] rounded-lg text-[#FFFFFF] placeholder-[#525252] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-[0.99] text-[#FFFFFF] font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{isLoading ? 'Memproses...' : (t('admin.loginButton') || 'Masuk')}</span>
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;