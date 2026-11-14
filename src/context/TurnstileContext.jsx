// Penyedia token Cloudflare Turnstile untuk seluruh aplikasi.
// Widget dipasang sekali di sini (bukan di tiap halaman), supaya token sudah siap sejak warga
// berada di halaman utama. Dengan begitu rekaman yang langsung diproses saat halaman chat
// dibuka tidak perlu menunggu widget selesai dimuat.
// Cara memakainya di komponen: lihat src/hooks/useTurnstileToken.js.

import { useCallback, useMemo, useRef } from "react";
import TurnstileWidget from "../components/common/TurnstileWidget.jsx";
import { TurnstileContext } from "../hooks/useTurnstileToken.js";

// Batas menunggu token jika widget belum selesai. Setelah itu request dikirim tanpa token
// dan server yang memutuskan; alur gagal ("Coba Lagi") tetap tersedia bagi warga.
const TOKEN_WAIT_MS = 15000;

export function TurnstileProvider({ children }) {
  const widgetRef = useRef(null);
  const tokenRef = useRef("");
  const waitersRef = useRef([]);

  // Langkah 1: Simpan token baru dan serahkan ke pemanggil yang sedang menunggu
  const handleSuccess = useCallback((token) => {
    tokenRef.current = token;
    waitersRef.current.forEach((resolveWaiter) => resolveWaiter(token));
    waitersRef.current = [];
  }, []);

  // Langkah 2: Catat kegagalan widget untuk developer; warga tidak melihat rincian teknisnya.
  // Token lama dibuang; widget mencoba lagi sendiri dan memanggil handleSuccess saat berhasil.
  const handleError = useCallback((errorCode) => {
    console.error("Error pada TurnstileWidget (kode Cloudflare):", errorCode);
    tokenRef.current = "";
  }, []);

  // Token kedaluwarsa (sekitar 5 menit): buang, jangan sampai terkirim ke server.
  // Widget memperbaruinya sendiri dan memanggil handleSuccess dengan token baru.
  const handleExpire = useCallback(() => {
    tokenRef.current = "";
  }, []);

  // Langkah 3: Ambil token. Token sekali pakai, jadi setelah diambil widget diminta membuat yang baru
  const takeToken = useCallback(() => {
    return new Promise((resolve) => {
      const finish = (token) => {
        tokenRef.current = "";
        if (widgetRef.current) {
          widgetRef.current.reset();
        }
        resolve(token);
      };

      if (tokenRef.current) {
        finish(tokenRef.current);
        return;
      }

      const waiter = (token) => {
        clearTimeout(timer);
        finish(token);
      };
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((item) => item !== waiter);
        finish("");
      }, TOKEN_WAIT_MS);
      waitersRef.current.push(waiter);
    });
  }, []);

  const value = useMemo(() => ({ takeToken }), [takeToken]);

  return (
    <TurnstileContext.Provider value={value}>
      {children}
      <TurnstileWidget
        ref={widgetRef}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
      />
    </TurnstileContext.Provider>
  );
}
