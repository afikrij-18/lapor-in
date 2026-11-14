import { Turnstile } from '@marsidev/react-turnstile';

export default function TurnstileWidget() {
  return (
    <div className="my-4 flex justify-center">
      {/* Langkah 1: Memuat widget Cloudflare Turnstile secara transparan di latar belakang */}
      <Turnstile
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        options={{ 
          theme: 'dark', 
          size: 'invisible' 
        }}
      />
    </div>
  );
}