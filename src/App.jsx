// Konfigurasi rute seluruh halaman Lapor.in (PRD bagian 7.1).

import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/common/Footer.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PublicMapPage from "./pages/PublicMapPage.jsx";
import { signInAnonymouslySilent } from "./services/authService.js";

function App() {
  useEffect(() => {
    // Langkah 1: Buat sesi anonim di latar belakang saat aplikasi dibuka (Silent Anonymous Auth)
    signInAnonymouslySilent().catch((error) => {
      // Langkah 2: Jika gagal, halaman tetap tampil; pengiriman laporan akan memberi pesan error
      console.error("Error pada App (sesi anonim):", error);
    });
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/peta" element={<PublicMapPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              {/* Alamat yang tidak dikenal diarahkan ke halaman utama */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
