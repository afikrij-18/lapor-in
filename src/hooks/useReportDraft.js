// Hook untuk mengakses state draf laporan aktif dari ReportDraftContext.

import { createContext, useContext } from "react";

export const ReportDraftContext = createContext(null);

export function useReportDraft() {
  const context = useContext(ReportDraftContext);
  if (!context) {
    throw new Error("useReportDraft harus digunakan di dalam ReportDraftProvider");
  }
  return context;
}