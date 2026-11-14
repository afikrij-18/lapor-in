// Route: /admin/login
// Halaman Login Admin - Lapor.in

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.js';
import { signInAdmin, onAuthChange, isAdminUser } from '../services/authService.js';
import AdminLoginForm from '../components/admin/AdminLoginForm.jsx';

function AdminLoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Langkah 1: Cegah akses ke halaman login jika sudah berstatus admin
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user && isAdminUser(user)) {
        navigate('/admin', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Langkah 2: Proses autentikasi saat form disubmit dari AdminLoginForm
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await signInAdmin(email, password);
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('Error pada AdminLoginPage (login gagal):', error);
      setErrorMessage(t('errors.INVALID_CREDENTIALS') || 'Email atau kata sandi salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-between selection:bg-[#DC2626] selection:text-white px-4 py-6">
      {/* Langkah 3: Header Mini dengan Akses Navigasi Kembali ke Beranda */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D4D4D4] hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-[#171717]"
        >
          <ArrowLeft size={16} className="text-[#DC2626]" />
          <span>{t('admin.backToHome', null, 'Kembali ke Beranda')}</span>
        </Link>

        {/* Brand Badge Mini */}
        <div className="flex items-center gap-2 text-white select-none">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border border-[#DC2626] flex items-center justify-center text-white shadow-[0_0_8px_rgba(220,38,38,0.3)] shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[#FFFFFF]">
            Lapor<span className="text-[#DC2626]">.in</span>
          </span>
        </div>
      </div>

      {/* Langkah 4: Konten Utama Form Login */}
      <div className="flex-1 flex items-center justify-center my-6">
        <AdminLoginForm 
          onSubmit={handleLogin} 
          isLoading={isLoading} 
          errorMessage={errorMessage} 
        />
      </div>

      {/* Langkah 5: Footer Hak Cipta Ringkas */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-[#525252]">
        <p>{t('footer.copyright', null, '© 2026 Lapor.in • Tim Minimize. Seluruh hak cipta dilindungi.')}</p>
      </div>
    </div>
  );
}

export default AdminLoginPage;