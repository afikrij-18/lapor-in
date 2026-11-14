// Komponen UI Form Login Admin - Lapor.in

import { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

export default function AdminLoginForm({ onSubmit, isLoading, errorMessage }) {
  // State lokal khusus untuk input form
  const [email, setEmail] = useState('admin@laporin.id');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password); // Kirim data email & password ke parent component (page)
  };

  return (
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
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-sm rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5">
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
              autoComplete="email"
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
              autoComplete="current-password"
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
  );
}