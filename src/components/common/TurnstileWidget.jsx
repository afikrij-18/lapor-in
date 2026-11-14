import { Turnstile } from '@marsidev/react-turnstile';

// Widget Cloudflare Turnstile tak terlihat.
// - onSuccess(token) dipanggil setiap kali token baru tersedia.
// - Token hanya berlaku sekali. Untuk meminta token baru (misalnya sebelum "Coba Lagi"),
//   kirim ref lalu panggil ref.current.reset():
//     const turnstileRef = useRef(null);
//     <TurnstileWidget ref={turnstileRef} onSuccess={setToken} />
//     turnstileRef.current?.reset();
export default function TurnstileWidget({ onSuccess, onError, ref }) {
  return (
    <div className="my-4 flex justify-center">
      <Turnstile
        ref={ref}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={onSuccess}
        onError={onError}
        options={{
          theme: 'dark',
          size: 'invisible'
        }}
      />
    </div>
  );
}
