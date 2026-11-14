import { Turnstile } from '@marsidev/react-turnstile';

export default function TurnstileWidget({ onSuccess }) {
  return (
    <div className="my-4 flex justify-center">
      <Turnstile
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={onSuccess}
        options={{ 
          theme: 'dark', 
          size: 'invisible' 
        }}
      />
    </div>
  );
}