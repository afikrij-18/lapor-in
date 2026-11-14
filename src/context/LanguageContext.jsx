// State global bahasa antarmuka (saat ini Bahasa Indonesia saja).
// Seluruh teks antarmuka diambil dari public/locales/id.json, tidak ditulis langsung di komponen.
// Dilengkapi fallback kamus default instan dan cache-busting agar kunci mentah tidak pernah muncul.

import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "../hooks/useLanguage.js";
import defaultDictionary from "../../public/locales/id.json";

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
  // Inisialisasi awal langsung dengan kamus lokal agar aplikasi tidak menunggu fetch dan bebas kedipan kunci mentah
  const [dictionary, setDictionary] = useState(defaultDictionary);

  useEffect(() => {
    let isActive = true;

    // Langkah 1: Muat kamus teks terbaru dari server/folder public dengan pencegah cache
    fetch(`/locales/${LANGUAGE}.json?v=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((loadedDictionary) => {
        // Langkah 2: Perbarui kamus jika berhasil dimuat dan komponen masih terpasang
        if (isActive && loadedDictionary && typeof loadedDictionary === "object") {
          setDictionary(loadedDictionary);
        }
      })
      .catch((error) => {
        // Langkah 3: Jika gagal, aplikasi tetap menggunakan defaultDictionary
        console.warn("Gagal memperbarui kamus teks via jaringan, menggunakan fallback default:", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(() => {
    // Fungsi penerjemah: mengembalikan teks, atau fallback cadangan, atau kuncinya jika keduanya tidak ada
    // Dua cara pemakaian yang sama-sama didukung:
    //   t("kunci", { nama: "nilai" }, "teks cadangan")  dan  t("kunci", "teks cadangan")
    const t = (key, params, fallback) => {
      // Argumen kedua berupa teks berarti teks cadangan, bukan parameter
      const fillValues = typeof params === "object" && params !== null ? params : undefined;
      const fallbackText = typeof params === "string" ? params : fallback;

      const text = findText(dictionary, key);
      if (typeof text === "string") {
        return fillParams(text, fillValues);
      }
      if (typeof fallbackText === "string") {
        return fillParams(fallbackText, fillValues);
      }
      return key;
    };
    return { language: LANGUAGE, t };
  }, [dictionary]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
