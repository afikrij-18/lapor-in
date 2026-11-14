// State global bahasa antarmuka (saat ini Bahasa Indonesia saja).
// Seluruh teks antarmuka diambil dari public/locales/id.json, tidak ditulis langsung di komponen.
// Cara memakai teks di komponen: lihat src/hooks/useLanguage.js.

import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "../hooks/useLanguage.js";

const LANGUAGE = "id";

// Mengambil teks dari kamus berdasarkan kunci bertitik, misalnya "home.title".
function findText(dictionary, key) {
  return key.split(".").reduce((current, part) => {
    return current && typeof current === "object" ? current[part] : undefined;
  }, dictionary);
}

// Mengganti penanda {nama} di dalam teks dengan nilai dari params.
function fillParams(text, params) {
  if (!params) {
    return text;
  }
  return Object.keys(params).reduce((result, name) => {
    return result.replaceAll(`{${name}}`, String(params[name]));
  }, text);
}

export function LanguageProvider({ children }) {
  const [dictionary, setDictionary] = useState(null);

  useEffect(() => {
    let isActive = true;

    // Langkah 1: Muat kamus teks dari folder public dengan pencegahan cache basi
    fetch(`/locales/${LANGUAGE}.json?v=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((loadedDictionary) => {
        // Langkah 2: Simpan kamus jika komponen masih terpasang
        if (isActive) {
          setDictionary(loadedDictionary);
        }
      })
      .catch((error) => {
        // Langkah 3: Jika gagal, aplikasi tetap jalan dan menampilkan kunci teksnya
        console.error("Error pada LanguageProvider (memuat kamus teks):", error);
        if (isActive) {
          setDictionary({});
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(() => {
    // Fungsi penerjemah: mengembalikan teks, atau fallback/kuncinya jika teks tidak ditemukan
    const t = (key, params, fallback) => {
      const text = findText(dictionary, key);
      if (typeof text === "string") {
        return typeof params === "object" && params !== null ? fillParams(text, params) : text;
      }
      if (typeof fallback === "string") {
        return fallback;
      }
      if (typeof params === "string") {
        return params;
      }
      return key;
    };
    return { language: LANGUAGE, t };
  }, [dictionary]);

  // Tunggu kamus selesai dimuat agar halaman tidak sempat menampilkan kunci mentah
  if (dictionary === null) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
