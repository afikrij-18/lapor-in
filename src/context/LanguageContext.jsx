/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

// Kamus terpusat Bahasa Indonesia (sesuai id.json)
const idDictionary = {
  home: {
    title: "Suarakan Masalah Lingkungan Anda Secara Aman",
    subtitle: "Tanpa Login Rumit • Mendukung Bahasa Daerah & Suara",
    micButton: "Tekan & Ceritakan Masalah Anda",
    manualInputBtn: "Ketik Laporan Secara Manual",
    retentionNotice: "Rekaman suara disimpan maksimal 30 hari untuk verifikasi admin."
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale] = useState('id');

  // Fungsi helper untuk mengambil teks berdasarkan path (contoh: 'home.title')
  const t = (path) => {
    const keys = path.split('.');
    let value = idDictionary;
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return '';
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}