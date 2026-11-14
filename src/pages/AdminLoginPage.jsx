// Route: /admin/login
// Halaman Login Admin - Lapor.in

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <AdminLoginForm 
        onSubmit={handleLogin} 
        isLoading={isLoading} 
        errorMessage={errorMessage} 
      />
    </div>
  );
}

export default AdminLoginPage;