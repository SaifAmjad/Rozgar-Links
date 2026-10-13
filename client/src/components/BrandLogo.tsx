import { useState } from 'react';

export function BrandLogo() {
  const [logoLoaded, setLogoLoaded] = useState(false);

  return (
    <span className="inline-flex min-h-11 items-center">
      <img
        alt={logoLoaded ? 'Rozgar Links' : ''}
        className={logoLoaded ? 'h-10 w-auto' : 'hidden'}
        onError={() => setLogoLoaded(false)}
        onLoad={() => setLogoLoaded(true)}
        src="/logo.png"
      />
      {!logoLoaded ? (
        <span aria-label="Rozgar Links" className="text-xl font-black tracking-wide text-primary">
          ROZGAR <span className="text-brand-green">LINKS</span>
        </span>
      ) : null}
    </span>
  );
}
