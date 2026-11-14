// State global draf laporan aktif (PRD bagian 7.1 dan 7.5).
// Draf, termasuk rekaman suara, hanya hidup di memori browser. Jika halaman dimuat ulang,
// draf hilang dan warga memulai lagi dari halaman utama.
// Cara memakainya di komponen: lihat src/hooks/useReportDraft.js.

import { useCallback, useMemo, useState } from "react";
import { INITIAL_REPORT_DRAFT } from "../config/constants.js";
import { ReportDraftContext } from "../hooks/useReportDraft.js";

const EMPTY_STATE = { draft: INITIAL_REPORT_DRAFT, inputMode: null };

export function ReportDraftProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE);

  // Memulai draf baru. Dipanggil halaman utama sebelum pindah ke /chat.
  const startDraft = useCallback(({ inputMode, audioBlob }) => {
    setState({
      draft: {
        ...INITIAL_REPORT_DRAFT,
        audioBlob: audioBlob || null,
        // Laporan yang diketik ditandai "text_input"; untuk rekaman, nilainya diisi AI nanti
        audioQuality: inputMode === "manual" ? "text_input" : INITIAL_REPORT_DRAFT.audioQuality
      },
      inputMode
    });
  }, []);

  // Mengubah sebagian isi draf, misalnya hasil AI atau koreksi warga.
  const updateDraft = useCallback((fields) => {
    setState((current) => ({
      ...current,
      draft: { ...current.draft, ...fields }
    }));
  }, []);

  // Mengosongkan draf, misalnya setelah laporan terkirim.
  const resetDraft = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  const value = useMemo(
    () => ({
      draft: state.draft,
      inputMode: state.inputMode,
      startDraft,
      updateDraft,
      resetDraft
    }),
    [state, startDraft, updateDraft, resetDraft]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}
