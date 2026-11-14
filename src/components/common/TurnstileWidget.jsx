import { Turnstile } from '@marsidev/react-turnstile';

// Widget anti-bot Cloudflare Turnstile.
// Dipasang SATU KALI oleh TurnstileProvider (src/context/TurnstileContext.jsx); halaman dan
// komponen lain tidak memasangnya. Token diambil lewat useTurnstileToken().
//
// Tampilan "interaction-only": widget tidak terlihat selama Cloudflare bisa memverifikasi
// sendiri, dan baru muncul (kotak centang di bawah layar) jika Cloudflare meminta interaksi.
// Dengan ukuran tak terlihat seperti sebelumnya, permintaan interaksi itu tidak bisa dipenuhi
// dan token tidak pernah keluar.
export default function TurnstileWidget({ onSuccess, onError, onExpire, ref }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[2000] -translate-x-1/2">
      <Turnstile
        ref={ref}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'light',
          size: 'normal',
          appearance: 'interaction-only',
          language: 'id',
          // Jika verifikasi gagal, widget mencoba lagi sendiri setiap 3 detik
          retry: 'auto',
          retryInterval: 3000,
          // Token yang kedaluwarsa (sekitar 5 menit) diperbarui otomatis
          refreshExpired: 'auto'
        }}
      />
    </div>
  );
}
