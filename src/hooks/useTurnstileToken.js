// Hook untuk mengambil token anti-bot Cloudflare Turnstile (PRD bagian 7.5).
//
// Contoh di halaman chat, sebelum memanggil processReport:
//   const { takeToken } = useTurnstileToken();
//   const token = await takeToken();
//   await processReport({ audioBlob, textInput, turnstileToken: token });
//
// takeToken() mengembalikan Promise berisi token. Token hanya berlaku sekali, jadi setiap
// pemanggilan mengambil token yang ada lalu meminta token baru dari widget.
// Widget dipasang satu kali oleh TurnstileProvider di App.jsx; halaman tidak perlu memasangnya.

import { createContext, useContext } from "react";

export const TurnstileContext = createContext(null);

export function useTurnstileToken() {
  const context = useContext(TurnstileContext);
  if (!context) {
    throw new Error("useTurnstileToken harus dipakai di dalam TurnstileProvider");
  }
  return context;
}
