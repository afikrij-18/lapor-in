// Hook untuk mengambil teks antarmuka dari public/locales/id.json.
// Contoh pemakaian di komponen:
//   const { t } = useLanguage();
//   <h1>{t("home.title")}</h1>
//   <p>{t("home.handledCount", { count: 124 })}</p>

import { createContext, useContext } from "react";

// Nilai awal dipakai jika komponen berada di luar LanguageProvider
export const LanguageContext = createContext({
  language: "id",
  t: (key, params, fallback) => {
    if (typeof fallback === "string") return fallback;
    if (typeof params === "string") return params;
    return key;
  }
});

export function useLanguage() {
  return useContext(LanguageContext);
}
