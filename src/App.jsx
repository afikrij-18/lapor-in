import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';

// Komponen placeholder sementara untuk halaman lain yang sedang dikerjakan anggota tim lain
function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <h1 className="text-xl font-bold">{title} (Dalam Tahap Pengembangan)</h1>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        {/* Langkah 1: Konfigurasi rute halaman Lapor.in sesuai spesifikasi PRD */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<PlaceholderPage title="Halaman Chat Interaktif AI" />} />
          <Route path="/peta" element={<PlaceholderPage title="Halaman Peta Sebaran Publik" />} />
          <Route path="/admin/login" element={<PlaceholderPage title="Login Admin Lapor.in" />} />
          <Route path="/admin" element={<PlaceholderPage title="Dashboard Admin" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}